sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
	"use strict";

	return Controller.extend("PhoneDirectory.controller.PhoneDirectory", {

		onInit: function () {
			this.displayAllEntries();
		},

		displayAllEntries: function () {
			sap.ui.core.BusyIndicator.show();
			const that = this;
			const queryString = '{"selector":{"docType":"contacts"}}';
			const url = "/hyperledger-fabric/getContact/" + queryString;
			const entriesModel = new JSONModel();

			$.ajax({
				type: "GET",
				contentType: "application/json",
				url: url,
				success: function (data) {
					if (!Array.isArray(data)) data = [data];
					const entries = [];
					data.map(e => {
						const entry = {
							"firstName": e.Record.firstName,
							"lastName": e.Record.lastName,
							"address": e.Record.address,
							"phoneNumber": e.Record.contactNo,
							"entryKey": e.Key
						};
						entries.push(entry);
					});
					entriesModel.setData(entries);
					that.getView().byId("entries_table").setModel(entriesModel);
					sap.ui.core.BusyIndicator.hide();
				},
				error: function () {
					entriesModel.setData();
					that.getView().byId("entries_table").setModel(entriesModel);
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},

		displayEntries: function (oEvent) {
			if (!oEvent.getParameter("clearButtonPressed") && oEvent.getParameter("query")) {
				sap.ui.core.BusyIndicator.show();
				const that = this;
				const query = oEvent.getParameter("query");
				const queryData = query.split(" ");
				let queryString = "";
				if (queryData.length == 1) {
					if (queryData[0].match(/^[0-9]+$/) != null) {
						const phoneNumber = queryData[0];
						queryString = '{"selector":{"docType":"contacts","contactNo":"' + phoneNumber + '"}}';
					} else {
						const firstName = queryData[0];
						queryString = '{"selector":{"docType":"contacts","firstName":"' + firstName + '"}}';
					}
				} else if (queryData.length == 2) {
					const firstName = queryData[0];
					const lastName = queryData[1];
					queryString = '{"selector":{"docType":"contacts","firstName":"' + firstName + '","lastName":"' + lastName + '"}}';
				}
				const url = "/hyperledger-fabric/getContact/" + queryString;
				const entriesModel = new JSONModel();

				$.ajax({
					type: "GET",
					contentType: "application/json",
					url: url,
					success: function (data) {
						if (!Array.isArray(data)) data = [data];
						const entries = [];
						data.map(e => {
							const entry = {
								"firstName": e.Record.firstName,
								"lastName": e.Record.lastName,
								"address": e.Record.address,
								"phoneNumber": e.Record.contactNo,
								"entryKey": e.Key
							};
							entries.push(entry);
						});
						entriesModel.setData(entries);
						that.getView().byId("entries_table").setModel(entriesModel);
						sap.ui.core.BusyIndicator.hide();
					},
					error: function () {
						entriesModel.setData();
						that.getView().byId("entries_table").setModel(entriesModel);
						sap.ui.core.BusyIndicator.hide();
					}
				});
			}
		},

		openEntryHistoryDialog: function () {
			const entryTable = this.getView().byId("entries_table");
			const selectedItem = entryTable.getSelectedItem();
			if (selectedItem === null) {
				return MessageToast.show(this.getView().getModel("i18n").getProperty("selectMsg"), {
					duration: 2000
				});
			}
			sap.ui.core.BusyIndicator.show();
			const that = this;
			const bindingContext = selectedItem.getBindingContext();
			const entry = bindingContext.getModel().getProperty(bindingContext.sPath);
			const entryKey = entry.entryKey;
			const url = "/hyperledger-fabric/getContactHistory/" + entryKey;
			const historyModel = new JSONModel();

			$.ajax({
				type: "GET",
				contentType: "application/json",
				url: url,
				success: function (data) {
					if (!Array.isArray(data)) data = [data];
					const history = [];
					data.map(e => {
						let timestamp = "";
						let unixTimestamp = 0;
						if (e.Record.timestamp) {
							unixTimestamp = Date.parse(e.Record.timestamp);
							const date = new Date(unixTimestamp);
							const timezoneOffset = date.getTimezoneOffset() * 60 * 1000;
							const unixTimestampWithoutOffSet = unixTimestamp - timezoneOffset;
							const dateWithoutOffSet = new Date(unixTimestampWithoutOffSet);
							const options = {
								weekday: 'long',
								year: 'numeric',
								month: '2-digit',
								day: 'numeric',
								hour: '2-digit',
								minute: '2-digit'
							};
							timestamp = dateWithoutOffSet.toLocaleDateString('de-DE', options);
						}
						const record = {
							"firstName": e.Record.firstName,
							"lastName": e.Record.lastName,
							"address": e.Record.address,
							"phoneNumber": e.Record.contactNo,
							"timestamp": timestamp,
							"unixTimestamp": unixTimestamp
						};
						history.push(record);
					});
					historyModel.setData(history);

					if (!that._entryHistoryDialog) {
						that._entryHistoryDialog = sap.ui.xmlfragment("PhoneDirectory.view.EntryHistory", that);
						that.getView().addDependent(that._entryHistoryDialog);
					}

					that._entryHistoryDialog.setModel(historyModel);
					that._entryHistoryDialog.open();
					sap.ui.core.BusyIndicator.hide();
				},
				error: function () {
					MessageToast.show(that.getView().getModel("i18n").getProperty("noHistory"), {
						duration: 2000
					});
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},

		onBtnCloseHistoryDialog: function () {
			this._entryHistoryDialog.close();
		},

		openAddEntryDialog: function () {
			const entryDetails = {
				firstName: "",
				lastName: "",
				address: "",
				phoneNumber: ""
			};
			const oModel = new JSONModel();

			oModel.setData({
				entry: entryDetails
			});

			if (!this._addEntryDialog) {
				this._addEntryDialog = sap.ui.xmlfragment("PhoneDirectory.view.AddEntry", this);
				this.getView().addDependent(this._addEntryDialog);
			}

			this._addEntryDialog.setModel(oModel);
			this._addEntryDialog.open();
		},

		onBtnAddEntry: function () {
			sap.ui.core.BusyIndicator.show();
			const that = this;
			const i18nModel = this.getView().getModel("i18n").getResourceBundle();
			const entry = this._addEntryDialog.getModel().getData().entry;

			if (entry.firstName && entry.lastName && entry.address && entry.phoneNumber) {
				const url = "/hyperledger-fabric/registerContact/";
				const payload = {
					"first_name": entry.firstName,
					"last_name": entry.lastName,
					"address": entry.address,
					"contact_no": entry.phoneNumber,
					"operation_type": "C"
				};
				$.ajax({
					type: "Post",
					contentType: "application/json",
					accept: "application/json",
					data: JSON.stringify(payload),
					url: url,
					success: function (data) {
						sap.ui.core.BusyIndicator.hide();
						const successAlert = i18nModel.getText("EntryAdded");
						MessageToast.show(successAlert);
						that.displayAllEntries();
						that._addEntryDialog.close();
					},
					error: function () {
						sap.ui.core.BusyIndicator.hide();
						const failureAlert = i18nModel.getText("EntryNotAdded");
						sap.m.MessageToast.show(failureAlert);
						that._addEntryDialog.close();
					}
				});
			} else {
				sap.ui.core.BusyIndicator.hide();
				const missingValues = i18nModel.getText("missingValues");
				MessageToast.show(missingValues, {
					duration: 1000
				});
			}
		},

		onBtnCancelAddEntry: function () {
			this._addEntryDialog.close();
		},

		openUpdateEntryDialog: function () {
			const entryTable = this.getView().byId("entries_table");
			const selectedItem = entryTable.getSelectedItem();
			if (selectedItem === null) {
				return MessageToast.show(this.getView().getModel("i18n").getProperty("selectMsg"), {
					duration: 2000
				});
			}
			const bindingContext = selectedItem.getBindingContext();
			const entry = bindingContext.getModel().getProperty(bindingContext.sPath);

			const entryDetails = {
				firstName: entry.firstName,
				lastName: entry.lastName,
				address: entry.address,
				phoneNumber: entry.phoneNumber,
				entryKey: entry.entryKey
			};

			const oModel = new JSONModel();
			oModel.setData({
				entry: entryDetails
			});

			if (!this._updateEntryDialog) {
				this._updateEntryDialog = sap.ui.xmlfragment("PhoneDirectory.view.UpdateEntry", this);
				this.getView().addDependent(this._updateEntryDialog);
			}

			this._updateEntryDialog.setModel(oModel);
			this._updateEntryDialog.open();
		},

		onBtnUpdateEntry: function () {
			sap.ui.core.BusyIndicator.show();
			const that = this;
			const i18nModel = this.getView().getModel("i18n").getResourceBundle();
			const entry = this._updateEntryDialog.getModel().getData().entry;

			if (entry.firstName && entry.lastName && entry.address && entry.phoneNumber) {
				const url = "/hyperledger-fabric/registerContact/";
				const payload = {
					"first_name": entry.firstName,
					"last_name": entry.lastName,
					"address": entry.address,
					"contact_no": entry.phoneNumber,
					"operation_type": "U",
					"contact_key_2": entry.entryKey
				};
				$.ajax({
					type: "Post",
					contentType: "application/json",
					accept: "application/json",
					data: JSON.stringify(payload),
					url: url,
					success: function (data) {
						sap.ui.core.BusyIndicator.hide();
						const successAlert = i18nModel.getText("EntryUpdated");
						MessageToast.show(successAlert);
						that.displayAllEntries();
						that._updateEntryDialog.close();
					},
					error: function () {
						sap.ui.core.BusyIndicator.hide();
						const failureAlert = i18nModel.getText("EntryNotUpdated");
						sap.m.MessageToast.show(failureAlert);
						that._updateEntryDialog.close();
					}
				});
			} else {
				sap.ui.core.BusyIndicator.hide();
				const missingValues = i18nModel.getText("missingValues");
				MessageToast.show(missingValues, {
					duration: 1000
				});
			}
		},

		onBtnCancelUpdateEntry: function () {
			this._updateEntryDialog.close();
		}
	});
});