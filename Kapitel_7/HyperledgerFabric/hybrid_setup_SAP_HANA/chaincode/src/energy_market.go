// DISCLAIMER:
// THIS SAMPLE CODE MAY BE USED SOLELY AS PART OF THE TEST AND EVALUATION OF THE SAP CLOUD PLATFORM
// BLOCKCHAIN SERVICE (THE “SERVICE”) AND IN ACCORDANCE WITH THE TERMS OF THE AGREEMENT FOR THE SERVICE.
// THIS SAMPLE CODE PROVIDED “AS IS”, WITHOUT ANY WARRANTY, ESCROW, TRAINING, MAINTENANCE, OR SERVICE
// OBLIGATIONS WHATSOEVER ON THE PART OF SAP.
<		q
package main

//=================================================================================================
//========================================================================================== IMPORT
import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
	"bytes"
	"math/rand"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

//=================================================================================================
//============================================================================= BLOCKCHAIN DOCUMENT
// Doc writes string to the blockchain (as JSON object) for a specific key
type ProductOffering struct {
	ObjectType		string 	`json:"docType"` //docType is used to distinguish the various types of objects in state database
	ProductName     string 	`json:"productName"`
	Description     string 	`json:"description"`
	OfferorID	    string 	`json:"offerorId"`
	BuyerID	        string 	`json:"buyerId"`
	Price           float32 `json:"price"`
	Status          int 	`json:"status"`
	Timestamp       string 	`json:"timestamp,omitempty"`
}

// Status enum
const (
    available = iota + 1  // 1
    outOfStock  	      // 2
)

func (productOffering *ProductOffering) FromJson(input []byte) *ProductOffering {
	json.Unmarshal(input, productOffering)
	return productOffering
}

func (productOffering *ProductOffering) ToJson() []byte {
	jsonDoc, _ := json.Marshal(productOffering)
	return jsonDoc
}

//=================================================================================================
//================================================================================= RETURN HANDLING
// Return handling: for return, we either return "shim.Success (payload []byte) with HttpRetCode=200"
// or "shim.Error(doc string) with HttpRetCode=500". However, we want to set our own status codes to
// map into HTTP return codes. A few utility functions:

// Success with a payload
func Success(rc int32, doc string, payload []byte) peer.Response {
	if len(doc) > 1048576 {
		return Error(500, "Maximum return payload length of 1MB exceeded!")
	}
	return peer.Response{
		Status:  rc,
		Message: doc,
		Payload: payload,
	}
}

// Error with an error message
func Error(rc int32, doc string) peer.Response {
	logger.Errorf("Error %d = %s", rc, doc)
	return peer.Response{
		Status:  rc,
		Message: doc,
	}
}

//=================================================================================================
//====================================================================================== VALIDATION
// Validation: all arguments for a function call is passed as a string array args[]. Validate that
// the number, type and length of the arguments are correct.
//
// The Validate function is called as follow:
// 		Validate("chaincode function name", args, T[0], Ta[0], Tb[0], T[1], Ta[1], Tb[1], ...)
// The parameter groups T[i], Ta[i], Tb[i] are used to validate each parameter in sequence in args.
// T[i]describes the type/format for the parameter i and Ta[i] and Tb[i] are type dependent.
//
//		T[i]	Ta[i]		Tb[i]				Comment
//		"%s"	minLength	maxLength			String with min/max length
//		"%json"	minLength	maxLength			JSON format with min/max length
//		"%b"	0			0					Boolean
//		"%i"	minValue	maxValue			Integer between min/max (inclusive)
//		"%f"	minValue	maxValue			Float64 between min/max (inclusive)
//		"%ts"	type		0					Timestamp in correct format, use for example: time.RFC3339
//		"%enum"	max			"enum1 enum2 ..."	Enum (one or upto max) from the space separated list supplied
//												Set max=1 if only one specific value is expected
//
func Validate(funcName string, args []string, desc ...interface{}) peer.Response {

	logger.Debugf("Function: %s(%s)", funcName, strings.TrimSpace(strings.Join(args, ",")))

	nrArgs := len(desc) / 3

	if len(args) != nrArgs {
		return Error(http.StatusBadRequest, "Parameter Mismatch")
	}

	for i := 0; i < nrArgs; i++ {
		switch desc[i*3] {

		case "%json":
			var jsonData map[string]interface{}
			if jsonErr := json.Unmarshal([]byte(args[i]), &jsonData); jsonErr != nil {
				return Error(http.StatusBadRequest, "JSON Payload Not Valid")
			}
			fallthrough

		case "%s":
			var minLen = desc[i*3+1].(int)
			var maxLen = desc[i*3+2].(int)
			if len(args[i]) < minLen || len(args[i]) > maxLen {
				return Error(http.StatusBadRequest, "Parameter Length Error")
			}

		case "%b":
			if _, err := strconv.ParseBool(args[i]); err != nil {
				return Error(http.StatusBadRequest, "Boolean Parameter Error")
			}

		case "%i":
			var min = desc[i*3+1].(int64)
			var max = desc[i*3+2].(int64)
			if i, err := strconv.ParseInt(args[i], 10, 0); err != nil || i < min || i > max {
				return Error(http.StatusBadRequest, "Integer Parameter Error")
			}

		case "%f":
			var min = desc[i*3+1].(float64)
			var max = desc[i*3+2].(float64)
			if f, err := strconv.ParseFloat(args[i], 64); err != nil || f < min || f > max {
				return Error(http.StatusBadRequest, "Float Parameter Error")
			}

		case "%ts":
			var format = desc[i*3+1].(string) // for example: time.RFC3339
			if _, err := time.Parse(args[i], format); err != nil {
				return Error(http.StatusBadRequest, "Timestamp Parameter Error")
			}

		case "%enum":
			var maxCount = desc[i*3+1].(int)
			var enums = strings.Fields(desc[i*3+2].(string))
			var values = strings.Fields(args[i])
			found := 0
			for _, v := range values {
				for _, e := range enums {
					if v == e {
						found++
						break
					}
				}
			}
			if found != len(values) || len(values) > maxCount {
				return Error(http.StatusBadRequest, "Enum Validation Error")
			}
		}
	}

	return Success(0, "OK", nil)
}

//=================================================================================================
//============================================================================================ MAIN
// Main function starts up the chaincode in the container during instantiate
//
var logger = shim.NewLogger("chaincode")

type EnergyMarket struct {
	// use this structure for information that is held (in-memory) within chaincode
	// instance and available over all chaincode calls
}

func main() {
	if err := shim.Start(new(EnergyMarket)); err != nil {
		fmt.Printf("Main: Error starting chaincode: %s", err)
	}
}

//=================================================================================================
//============================================================================================ INIT
// Init is called during Instantiate transaction after the chaincode container
// has been established for the first time, allowing the chaincode to
// initialize its internal data. Note that chaincode upgrade also calls this
// function to reset or to migrate data, so be careful to avoid a scenario
// where you inadvertently clobber your ledger's data!
//
func (cc *EnergyMarket) Init(stub shim.ChaincodeStubInterface) peer.Response {
	// Validate supplied init parameters, in this case zero arguments!
	if _, args := stub.GetFunctionAndParameters(); len(args) > 0 {
		return Error(http.StatusBadRequest, "Init: Incorrect number of arguments; no arguments were expected.")
	}
	return Success(http.StatusOK, "OK", nil)
}

//=================================================================================================
//========================================================================================== INVOKE
// Invoke is called to update or query the ledger in a proposal transaction.
// Updated state variables are not committed to the ledger until the
// transaction is committed.
//
func (cc *EnergyMarket) Invoke(stub shim.ChaincodeStubInterface) peer.Response {

	// Increase logging level for this example (ERROR level recommended for productive code)
	logger.SetLevel(shim.LogDebug)

	// Which function is been called?
	function, args := stub.GetFunctionAndParameters()
	function = strings.ToLower(function)

	// Route call to the correct function
	switch function {
	case "exist":
		return cc.exist(stub, args)
	case "read":
		return cc.read(stub, args)
	case "create":
		return cc.create(stub, args)
	case "update":
		return cc.update(stub, args)
	case "delete":
		return cc.delete(stub, args)
	case "$sql":
		return cc.SQL(stub, args)
	case "registerproductoffering":
		return cc.registerProductOffering(stub, args)
	case "getproductofferings":
		return cc.getProductOfferings(stub, args)
	case "purchaseproduct":
		return cc.purchaseProduct(stub, args)
	case "getproductofferingbyid":
		return cc.getProductOfferingByID(stub, args)
	case "deleteproductofferingbyid":
		return cc.deleteProductOfferingByID(stub, args)
	default:
		logger.Warningf("Invoke('%s') invalid!", function)
		return Error(http.StatusNotImplemented, "Invalid method! Valid methods are 'create|update|delete|exist|read|history|search|$SQL'!")
	}
}


/******************** Product Offering registration function ********************/

func (t *EnergyMarket) registerProductOffering(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	var ProductOffering ProductOffering

	ProductOffering.ObjectType = "productOfferings"
	ProductOffering.ProductName = args[0]
	ProductOffering.Description = args[1]
	ProductOffering.OfferorID = args[2]
	price, err := strconv.ParseFloat(args[3], 32)
	if err != nil {
		return shim.Error(err.Error())
	}
	ProductOffering.Price = float32(price)
	ProductOffering.Status = available
	mytime := time.Now()
	ProductOffering.Timestamp = mytime.Format("2006-01-02 15:04:05")

	// ==== Create productOffering object and marshal to JSON ====
	productOfferingJSON, err := json.Marshal(ProductOffering)
	if err != nil {
		return shim.Error("Marshal failed for productOffering Entry" + fmt.Sprint(err))
	}
	// === Save product offering to state ===
	rand.Seed(time.Now().UnixNano())

	err = stub.PutState(randSeq(10), productOfferingJSON)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(nil)
}

/******************** Purchase Product function ********************/
func (t *EnergyMarket) purchaseProduct(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	var productID = args[0];
	var buyerID = args[1];

	// ==== Get product details ====
	productAsBytes, err := stub.GetState(productID)
	if err != nil {
		return shim.Error("Failed to get product: " + err.Error())
	} else if productAsBytes != nil {
		var productOffering ProductOffering
		errJsonEntityUnmarshal := json.Unmarshal(productAsBytes, &productOffering)
		if errJsonEntityUnmarshal != nil {
			return shim.Error(errJsonEntityUnmarshal.Error())
		}

		if productOffering.Status != 2 {
			productOffering.BuyerID = buyerID;
			productOffering.Status = outOfStock;	

			// ==== Create productOffering object and marshal to JSON ====
			productOfferingJSON, err := json.Marshal(productOffering)
			if err != nil {
				return shim.Error("Marshal failed for productOffering Entry" + fmt.Sprint(err))
			}

			err = stub.PutState(productID, productOfferingJSON)
			if err != nil {
				return shim.Error(err.Error())
			}
		} else {
			return shim.Error("Product is out of stock")
		}
	}
	return shim.Success(nil)
}

//******************** get registred products function********************/

func (t *EnergyMarket) getProductOfferings(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	var queryString string
	var err error

	queryString = args[0]
	if err != nil {
		return shim.Error("query string not provided")
	}

	resultsIterator, err := stub.GetQueryResult(queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	objs, err := getListResult(resultsIterator, stub)
	if err != nil {
		return shim.Error("getListResult failed")
	}

	return shim.Success(objs)
}
 
func (t *EnergyMarket) getProductOfferingByID(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	var productID = args[0];

	// ==== Get product details ====
	productAsBytes, err := stub.GetState(productID)
	if err != nil {
		return shim.Error("Failed to get product: " + err.Error())
	} else if productAsBytes != nil {
		return shim.Success(productAsBytes)	
	}
	return shim.Success(nil)
}

func (t *EnergyMarket) deleteProductOfferingByID(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	var productID = args[0];

	// ==== Delete product offering ====
	err := stub.DelState(productID)
	if err != nil {
		return shim.Error("Failed to delete product: " + err.Error())
	}
	return shim.Success(nil)
}

//****************** Unique String generator function *************/

func randSeq(n int) string {
	var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
    b := make([]rune, n)
    for i := range b {
        b[i] = letters[rand.Intn(len(letters))]
    }
    return string(b)
}

func getListResult(resultsIterator shim.StateQueryIteratorInterface, stub shim.ChaincodeStubInterface) ([]byte, error) {

	defer resultsIterator.Close()
	// buffer is a JSON array containing QueryRecords
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")
		buffer.WriteString(",\"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")
	fmt.Printf("queryResult:\n%s\n", buffer.String())
	return buffer.Bytes(), nil
}

func getSingleResult(result []byte) ([]byte, error) {
	var buffer bytes.Buffer
	buffer.WriteString("{\"Record\":")
	// Record is a JSON object, so we write as-is
	buffer.WriteString(string(result))
	buffer.WriteString("}")
	return buffer.Bytes(), nil
}



//=================================================================================================
//=========================================================================================== EXIST
// Validate text's existance by ID
//
func (cc *EnergyMarket) exist(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// Validate and extract parameters
	if rc := Validate("exist", args /*args[0]=id*/, "%s", 1, 64); rc.Status > 0 {
		return rc
	}
	id := strings.ToLower(args[0])

	// If we can read the ID, then it exists
	if value, err := stub.GetState(id); err != nil || value == nil {
		return Error(http.StatusNotFound, "Not Found")
	}

	return Success(http.StatusNoContent, "Text Exists", nil)
}

//=================================================================================================
//============================================================================================ READ
// Read text by ID
//
func (cc *EnergyMarket) read(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// Validate and extract parameters
	if rc := Validate("read", args /*args[0]=id*/, "%s", 1, 10); rc.Status > 0 {
		return rc
	}
	id := strings.ToLower(args[0])

	// Read the value for the ID
	if value, err := stub.GetState(id); err != nil || value == nil {
		return Error(http.StatusNotFound, "Not Found")
	} else {
		return Success(http.StatusOK, "OK", value)
	}
}

//=================================================================================================
//========================================================================================== CREATE
// Creates a text by ID
//
func (cc *EnergyMarket) create(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// Validate and extract parameters
	if rc := Validate("create", args 
	/*args[0]=id*/, "%s", 1, 64 
	/*args[1]=ObjectType*/, "%s", 1, 64 
	/*args[1]=ProductName*/, "%s", 1, 255 
	/*args[1]=Description*/, "%s", 1, 64 
	/*args[1]=OfferorID*/, "%s", 1, 50 
	/*args[1]=Price*/, "%f", 0.1, 2.5); rc.Status > 0 {
		return rc
	}


	/////////////////////////////////////////////////////////
	// extract the individual parameters from the args array
	/////////////////////////////////////////////////////////
	
	// id
	id := strings.ToLower(args[0])

	// price
	price, err := strconv.ParseFloat(args[6], 32)
	if err != nil {
		return shim.Error(err.Error())
	}

	// create timestamp
	mytime := time.Now()

	// create new productOffering from extracted parameters
	productOffering := &ProductOffering{ObjectType: args[2], ProductName: args[3], Description: args[4], OfferorID: args[5], Price: float32(price), Status: available, Timestamp: mytime.Format("2006-01-02 15:04:05")}


	// Validate that this ID does not yet exist. If the key does not exist (nil, nil) is returned.
	if value, err := stub.GetState(id); !(err == nil && value == nil) {
		return Error(http.StatusConflict, "ProductOffering already exists")
	}

	// write new productOffering to blockchain
	if err := stub.PutState(id, productOffering.ToJson()); err != nil {
		return Error(http.StatusInternalServerError, err.Error())
	}

	// return positive feedback if successful
	return Success(http.StatusCreated, "ProductOffering created", nil)
}

//=================================================================================================
//========================================================================================== UPDATE
// Updates a text by ID
//
func (cc *EnergyMarket) update(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// Validate and extract parameters
	if rc := Validate("create", args 
	/*args[0]=id*/, "%s", 1, 64 
	/*args[1]=ObjectType*/, "%s", 1, 64 
	/*args[1]=ProductName*/, "%s", 1, 255 
	/*args[1]=Description*/, "%s", 1, 64 
	/*args[1]=OfferorID*/, "%s", 1, 50 
	/*args[1]=Price*/, "%f", 0.1, 2.5); rc.Status > 0 {
		return rc
	}

	////////////////////////////////////////////////////////
	// extract the individual parameters from the args array
	////////////////////////////////////////////////////////
	
	// productid
	id := strings.ToLower(args[0])

	// price
	price, err := strconv.ParseFloat(args[5], 32)
	if err != nil {
		return shim.Error(err.Error())
	}

	// create the timestamp
	mytime := time.Now()

	// create new productOffering with extracted parameters
	productOffering := &ProductOffering{ObjectType: "productOfferings", ProductName: args[2], Description: args[3], OfferorID: args[4], Price: float32(price), Status: available, Timestamp: mytime.Format("2006-01-02 15:04:05")}


	// validate that productID does exist
	if value, err := stub.GetState(id); err != nil || value == nil {
		return Error(http.StatusNotFound, "Not Found")
	}

	// save modified productOffering to blockchain
	if err := stub.PutState(id, productOffering.ToJson()); err != nil {
		return Error(http.StatusInternalServerError, err.Error())
	}

	// return positive feedback if successful
	return Success(http.StatusNoContent, "Text Updated", nil)

}

//=================================================================================================
//========================================================================================== DELETE
// Delete text by ID
//
func (cc *EnergyMarket) delete(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// Validate and extract parameters
	if rc := Validate("delete", args /*args[0]=id*/, "%s", 1, 10); rc.Status > 0 {
		return rc
	}

	////////////////////////////////////////////////////////
	// extract the individual parameters from the args array
	////////////////////////////////////////////////////////
	
	// productid
	id := strings.ToLower(args[0])

	// validate that this productid exists
	if value, err := stub.GetState(id); err != nil || value == nil {
		return Error(http.StatusNotFound, "ProductOffering not found")
	}

	// delete the productOffering 
	// (the value associated with the key)
	if err := stub.DelState(id); err != nil {
		// return info on eventual error
		return Error(http.StatusInternalServerError, err.Error())
	}

	// return positive feedback if successful
	return Success(http.StatusNoContent, "ProductOffering deleted", nil)

}

//=================================================================================================
//============================================================================================= SQL
// SQL Interface for HANA Integration
//
// Calling sequences:
//		QUERY:	$SQL("SCHEMA")
//		QUERY:	$SQL("SELECT", id, docType)
//		INVOKE:	$SQL("INSERT", id, docType, payload)
//		INVOKE:	$SQL("UPDATE", id, docType, payload)
//		INVOKE:	$SQL("DELETE", id, docType)
//
func (cc *EnergyMarket) SQL(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// Extract command
	cmd := "UNKNOWN COMMAND"
	if len(args) > 0 {
		cmd = strings.ToUpper(args[0])
	}

	// Process command
	switch cmd {

	case "SELECT":
        if rc := Validate("$SQL", args /*args[0]=SELECT*/, "%s", 1, 10 /*args[1]=productID*/); rc.Status > 0 {
            return rc
        }
        return cc.read(stub, []string{args[1]})

    case "INSERT":
        if rc := Validate("$SQL", args /*args[0]=INSERT*/, "%s", 1, 10 /*args[1]=productID*/, "%s", 1, 16 /*args[2]=ObjectType*/, "ProductOffering" /*args[3]=payload*/, "%json", 2, 1024); rc.Status > 0 {
            return rc
        }
        var productOffering ProductOffering
        return cc.create(stub, []string{args[1], args[2], productOffering.FromJson([]byte(args[3])).ProductName, productOffering.FromJson([]byte(args[3])).Description, 
                        productOffering.FromJson([]byte(args[3])).OfferorID, strconv.FormatFloat(float64(productOffering.FromJson([]byte(args[3])).Price), 'f', -1, 32)})

    case "UPDATE":
        if rc := Validate("$SQL", args /*args[0]=UPDATE*/, "%s", 1, 10 /*args[1]=productID*/, "%s", 1, 16 /*args[2]=ObjectType*/, "ProductOffering" /*args[3]=payload*/, "%json", 2, 1024); rc.Status > 0 {
            return rc
        }
        var productOffering map[string]interface{}
        json.Unmarshal([]byte(args[3]), &productOffering)
        var oldproductOffering ProductOffering
        oldproductOffering.FromJson(cc.read(stub, []string{args[1]}).Payload)
        if productOffering["ProductName"] == nil {
            productOffering["ProductName"] = oldproductOffering.ProductName
        }
        if productOffering["Description"] == nil {
            productOffering["Description"] = oldproductOffering.Description
        }
        if productOffering["OfferorID"] == nil {
            productOffering["OfferorID"] = oldproductOffering.OfferorID
        }
        if productOffering["Price"] == nil {
            productOffering["Price"] = oldproductOffering.Price
        }
        if productOffering["Status"] == nil {
            productOffering["Status"] = oldproductOffering.Status
        }
        if productOffering["Timestamp"] == nil {
            productOffering["Timestamp"] = oldproductOffering.Status
        }
        return cc.update(stub, []string{args[1], productOffering["ProductName"].(string), productOffering["Description"].(string), strconv.FormatFloat(productOffering["Price"].(float64), 'f', 6, 64), productOffering["Status"].(string)})

    case "DELETE":
        if rc := Validate("$SQL", args /*args[0]=DELETE*/, "%s", 1, 10 /*args[1]=productID*/, "%s", 1, 16 /*args[2]=ObjectType*/); rc.Status > 0 {
            return rc
        }
        return cc.delete(stub, []string{args[1]})
	}

	logger.Warningf("$SQL('%s') invalid!", cmd)
	return Error(http.StatusNotImplemented, "Invalid $SQL! Valid methods are 'SELECT|INSERT|UPDATE|DELETE'!")
}
