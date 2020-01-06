/*******************************************************************************
Copyright (c) 2019 Camelot ITlab GmbH.
******************************************************************************/

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

//PhoneDirectory Chaincode implementation
type PhoneDirectory struct {
}

//PHONEDIRECTORYSTATEKEY is the key for the state of the contract
const PHONEDIRECTORYSTATEKEY string = "PhoneDirectoryStateKey"

//SUPPORTEDVERSION onyl 1.0 supported now
const SUPPORTEDVERSION string = "1.0"

// ************************************
// asset and contract state
// ************************************

//PhoneDirectoryState is the contract state
type PhoneDirectoryState struct {
	Version string `json:"version"`
}

//Contact is the data structure
type Contact struct {
	ObjectType string  `json:"docType"` //docType is used to distinguish the various types of objects in state database
	ContactNo  *string `json:"contactNo"`
	FirstName  *string `json:"firstName"`
	LastName   *string `json:"lastName"`
	Address    *string `json:"address"`
	Timestamp  string  `json:"timestamp,omitempty"`
}

var phoneDirectoryState = PhoneDirectoryState{SUPPORTEDVERSION}

// Init deploy callback mode
func (t *PhoneDirectory) Init(stub shim.ChaincodeStubInterface) peer.Response {
	// Validate supplied init parameters, in this case zero arguments!
	if _, args := stub.GetFunctionAndParameters(); len(args) > 0 {
		return shim.Error("Init: Incorrect number of arguments; no arguments were expected and none should have been supplied.")
	}
	return shim.Success(nil)
}

// Invoke deploy and invoke callback mode
func (t *PhoneDirectory) Invoke(stub shim.ChaincodeStubInterface) peer.Response {

	// Which function is been called?
	function, args := stub.GetFunctionAndParameters()
	function = strings.ToLower(function)
	// Handle different functions
	if function == "registercontact" {
		// Register Contact Details
		return t.registerContact(stub, args)
	} else if function == "getcontact" {
		// Get Contact Details
		return t.getContact(stub, args)
	} else if function == "getcontacthistory" {
		// Get Contact History Details
		return t.getContactHistory(stub, args)
	}
	return shim.Error("Received unknown invocation: " + function)
}

//Query callback mode
func (t *PhoneDirectory) Query(stub shim.ChaincodeStubInterface) peer.Response {
	// Which function is been called?
	function, args := stub.GetFunctionAndParameters()
	function = strings.ToLower(function)
	// Handle different functions
	if function == "getcontact" {
		// Get Contact Details
		return t.getContact(stub, args)
	} else if function == "getcontacthistory" {
		// Get Contact History Details
		return t.getContactHistory(stub, args)
	}
	return shim.Error("Received unknown query: " + function)
}

/**********main implementation *************/

func main() {
	if err := shim.Start(new(PhoneDirectory)); err != nil {
		fmt.Printf("Main: Error starting phone_directory chaincode: %s", err)
	}
}

/******************** contact registration function ********************/

func (t *PhoneDirectory) registerContact(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	//var err error
	var contactEntry Contact
	var operationType string
	var contactKey string

	contactEntry.ObjectType = "contacts"
	contactEntry.ContactNo = args[0]
	contactEntry.FirstName = args[1]
	contactEntry.LastName = args[2]
	contactEntry.Address = args[3]
	operationType = args[4]
	contactKey = args[5]
	mytime := time.Now()
	contactEntry.Timestamp = mytime.Format("2006-01-02 15:04:05")

	// ==== Create contact object and marshal to JSON ====
	contactJSON, err := json.Marshal(contactEntry)
	if err != nil {
		return shim.Error("Marshal failed for Contact Entry" + fmt.Sprint(err))
	}

	switch operationType {
	case "C":
		// === Save contact to state ===
		rand.Seed(time.Now().UnixNano())

		err = stub.PutState(randSeq(10), contactJSON)
		if err != nil {
			return shim.Error(err.Error())
		}
	case "U":
		// === Update contact to state ===
		if len(contactKey) != 0 {

			// ==== Check if contact already exists ====
			contactAsBytes, err := stub.GetState(contactKey)
			if err != nil {
				return shim.Error("Failed to get contact: " + err.Error())
			} else if contactAsBytes != nil {
				err = stub.PutState(contactKey, contactJSON)
				if err != nil {
					return shim.Error(err.Error())
				}
			}
		} else {
			return shim.Error("Cotact key cannot be empty for update operation")
		}
	default:
		return shim.Error("Unsupported operation type:" + operationType)
	}

	return shim.Success(nil)
}

//******************** get registred contact function********************/

func (t *PhoneDirectory) getContact(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	var queryString string
	var err error

	queryString = args[0]
	if err != nil {
		return shim.Error("query string not provided")
	}

	// search contact based on provided queryString
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

/******************** get contact hostory function********************/

func (t *PhoneDirectory) getContactHistory(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	var contactKey string
	var err error

	contactKey = args[0]
	if err != nil {
		return shim.Error("contact key string not provided")
	}

	resultsIterator, err := stub.GetHistoryForKey(contactKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	objs, err := getHistoryListResult(resultsIterator, stub)
	if err != nil {
		return shim.Error("getListResult failed")
	}

	return shim.Success(objs)
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

func getHistoryListResult(resultsIterator shim.HistoryQueryIteratorInterface, stub shim.ChaincodeStubInterface) ([]byte, error) {

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
		buffer.WriteString("{\"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")
	fmt.Printf("queryResult:\n%s\n", buffer.String())
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
