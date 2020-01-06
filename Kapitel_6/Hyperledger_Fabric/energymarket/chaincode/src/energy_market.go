/*******************************************************************************
Copyright (c) 2019 Camelot ITlab GmbH.
******************************************************************************/

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strings"
	"math/rand"
	"time"
	"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

//EnergyMarket Chaincode implementation
type EnergyMarket struct {
}

//ENERGYMARKETSTATEKEY is the key for the state of the contract
const ENERGYMARKETSTATEKEY string = "EnergyMarketStateKey"

//SUPPORTEDVERSION onyl 1.0 supported now
const SUPPORTEDVERSION string = "1.0"

// ************************************
// asset and contract state
// ************************************

//EnergyMarketState is the contract state
type EnergyMarketState struct {
	Version string `json:"version"`
}

//ProductOffering is the data structure
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

var energyMarketState = EnergyMarketState{SUPPORTEDVERSION}

// Init deploy callback mode
func (t *EnergyMarket) Init(stub shim.ChaincodeStubInterface) peer.Response {
	// Validate supplied init parameters, in this case zero arguments!
	if _, args := stub.GetFunctionAndParameters(); len(args) > 0 {
		return shim.Error("Init: Incorrect number of arguments; no arguments were expected and none should have been supplied.")
	}
	return shim.Success(nil)
}

// Invoke deploy and invoke callback mode
func (t *EnergyMarket) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	
	// Which function is been called?
	function, args := stub.GetFunctionAndParameters()
	function = strings.ToLower(function)
	// Handle different functions
	if function == "registerproductoffering" {
		// Register Product Offering
		return t.registerProductOffering(stub, args)
	} else if function == "getproductofferings" {
		// Get Products
		return t.getProductOfferings(stub, args)
	} else if function == "purchaseproduct" {
		// Purchase Product
		return t.purchaseProduct(stub, args)
	} else if function == "getproductofferingbyid" {
		return t.getProductOfferingByID(stub, args)
	} else if function == "deleteproductofferingbyid" {
		return t.deleteProductOfferingByID(stub, args)
	}
	return shim.Error("Received unknown invocation: " + function)
}

/**********main implementation *************/

func main() {
	if err := shim.Start(new(EnergyMarket)); err != nil {
		fmt.Printf("Main: Error starting energy_market chaincode: %s", err)
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

func Success(payload []byte) peer.Response {
	return peer.Response{
		Status:  200,
		Message: "msg",
		Payload: payload,
	}
}

func Error(doc string) peer.Response {
	return peer.Response{
		Status:  400,
		Message: doc,
	}
}
