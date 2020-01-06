sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
	"use strict";

	return Controller.extend("PharmaInventory.controller.PharmaInventory", {

		onInit: function () {
			this.url = "/multichain/rpc";
			this.apikey = "EIGENEN_API_KEY_HIER_EINSETZEN";
			this.stream = "pharma-inventory";
			this.init();
		},

		init: function () {
			sap.ui.core.BusyIndicator.show();
			const that = this;
			$.ajax({
				type: "POST",
				contentType: "application/json",
				url: that.url,
				headers: {
					"apikey": that.apikey
				},
				data: JSON.stringify({
					"method": "liststreams"
				}),
				success: function (data) {
					let exists = false;
					for (let i = 0; i < data.result.length; i++) {
						if (data.result[i].name == that.stream) {
							exists = true;
							break;
						}
					}
					if (!exists) {
						that.createStream();
					} else {
						that.displayAllProducts();
					}
					sap.ui.core.BusyIndicator.hide();
				},
				error: function () {
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},

		createStream: function () {
			sap.ui.core.BusyIndicator.show();
			const that = this;
			$.ajax({
				type: "POST",
				contentType: "application/json",
				url: that.url,
				headers: {
					"apikey": that.apikey
				},
				data: JSON.stringify({
					"method": "create",
					"params": ["stream", this.stream, true]
				}),
				success: function () {
					sap.ui.core.BusyIndicator.hide();
				},
				error: function () {
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},

		displayAllProducts: function () {
			sap.ui.core.BusyIndicator.show();
			const that = this;
			$.ajax({
				type: "POST",
				contentType: "application/json",
				url: that.url,
				headers: {
					"apikey": that.apikey
				},
				data: JSON.stringify({
					"method": "liststreamitems",
					"params": [this.stream, false, 100000]
				}),
				success: function (data) {
					if (data.result.length > 0) {
						const products = new Map();
						data.result.map(e => {
							const productID = e.key;
							const product = JSON.parse(that.hexDecode(e.data));
							if (!products.get(productID) || product.version > products.get(productID).version) {
								if (product.expiryDate < Date.now()) product.available = false;
								product.productID = productID;
								product.formattedProductionDate = that.createDateFromTimestamp(product.productionDate);
								product.formattedExpiryDate = that.createDateFromTimestamp(product.expiryDate);
								products.set(productID, product);
							}
						});
						const productsModel = new JSONModel();
						productsModel.setData(Array.from(products.values()));
						that.getView().byId("products_table").setModel(productsModel);
					}
					sap.ui.core.BusyIndicator.hide();
				},
				error: function () {
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},

		displayProducts: function (oEvent) {
			if (!oEvent.getParameter("clearButtonPressed") && oEvent.getParameter("query")) {
				sap.ui.core.BusyIndicator.show();
				const that = this;
				const query = oEvent.getParameter("query");
				$.ajax({
					type: "POST",
					contentType: "application/json",
					url: that.url,
					headers: {
						"apikey": that.apikey
					},
					data: JSON.stringify({
						"method": "liststreamitems",
						"params": [this.stream, false, 100000]
					}),
					success: function (data) {
						if (data.result.length > 0) {
							const products = new Map();
							data.result.map(e => {
								const productID = e.key;
								const product = JSON.parse(that.hexDecode(e.data));
								if ((productID == query || product.productName == query) &&
									(!products.get(productID) || product.version > products.get(productID).version)) {
									if (product.expiryDate < Date.now()) product.available = false;
									product.productID = productID;
									product.formattedProductionDate = that.createDateFromTimestamp(product.productionDate);
									product.formattedExpiryDate = that.createDateFromTimestamp(product.expiryDate);
									products.set(productID, product);
								}
							});
							const productsModel = new JSONModel();
							productsModel.setData(Array.from(products.values()));
							that.getView().byId("products_table").setModel(productsModel);
						}
						sap.ui.core.BusyIndicator.hide();
					},
					error: function () {
						sap.ui.core.BusyIndicator.hide();
					}
				});
			}
		},

		openAddProductDialog: function () {
			const productionDate = new Date();
			const expiryDate = new Date();
			expiryDate.setMonth(expiryDate.getMonth() + 12);
			const productDetails = {
				productName: "",
				productionDate: productionDate,
				expiryDate: expiryDate,
			};
			const productModel = new JSONModel();

			productModel.setData({
				product: productDetails
			});

			if (!this._addProductDialog) {
				this._addProductDialog = sap.ui.xmlfragment("PharmaInventory.view.AddProduct", this);
				this.getView().addDependent(this._addProductDialog);
			}

			this._addProductDialog.setModel(productModel);
			this._addProductDialog.open();
		},

		onBtnAddProduct: function () {
			sap.ui.core.BusyIndicator.show();
			const that = this;
			const i18nModel = this.getView().getModel("i18n").getResourceBundle();
			const product = this._addProductDialog.getModel().getData().product;

			if (product.productName && product.productionDate && product.expiryDate) {
				if (product.productionDate <= product.expiryDate) {
					const productID = this.generateProductID();
					const productData = {
						"productName": product.productName,
						"productionDate": Date.parse(product.productionDate),
						"expiryDate": Date.parse(product.expiryDate),
						"available": true,
						"version": 0
					};
					const productDataHex = this.hexEncode(JSON.stringify(productData));
					$.ajax({
						type: "POST",
						contentType: "application/json",
						headers: {
							"apikey": that.apikey
						},
						data: JSON.stringify({
							"method": "publish",
							"params": [that.stream, productID, productDataHex]
						}),
						url: that.url,
						success: function () {
							sap.ui.core.BusyIndicator.hide();
							const successAlert = i18nModel.getText("ProductAdded");
							MessageToast.show(successAlert);
							that.displayAllProducts();
							that._addProductDialog.close();
						},
						error: function () {
							sap.ui.core.BusyIndicator.hide();
							const failureAlert = i18nModel.getText("ProductNotAdded");
							sap.m.MessageToast.show(failureAlert);
							that._addProductDialog.close();
						}
					});
				} else {
					sap.ui.core.BusyIndicator.hide();
					const invalidTimeInterval = i18nModel.getText("invalidTimeInterval");
					MessageToast.show(invalidTimeInterval, {
						duration: 1000
					});
				}
			} else {
				sap.ui.core.BusyIndicator.hide();
				const missingValues = i18nModel.getText("missingValues");
				MessageToast.show(missingValues, {
					duration: 1000
				});
			}
		},

		onBtnCancelAddProduct: function () {
			this._addProductDialog.close();
		},

		changeAvailability: function () {
			const i18nModel = this.getView().getModel("i18n").getResourceBundle();
			const productTable = this.getView().byId("products_table");
			const selectedItem = productTable.getSelectedItem();
			if (selectedItem === null) {
				return MessageToast.show(i18nModel.getText("selectMsg"), {
					duration: 2000
				});
			}
			sap.ui.core.BusyIndicator.show();
			const that = this;
			const bindingContext = selectedItem.getBindingContext();
			const product = bindingContext.getModel().getProperty(bindingContext.sPath);
			const productData = {
				"productName": product.productName,
				"productionDate": product.productionDate,
				"expiryDate": product.expiryDate,
				"available": !product.available,
				"version": product.version + 1
			};
			const productDataHex = this.hexEncode(JSON.stringify(productData));
			$.ajax({
				type: "POST",
				contentType: "application/json",
				headers: {
					"apikey": that.apikey
				},
				data: JSON.stringify({
					"method": "publish",
					"params": [that.stream, product.productID, productDataHex]
				}),
				url: that.url,
				success: function () {
					sap.ui.core.BusyIndicator.hide();
					that.displayAllProducts();
					const successAlert = i18nModel.getText("ProductUpdated");
					MessageToast.show(successAlert);
				},
				error: function () {
					sap.ui.core.BusyIndicator.hide();
					const failureAlert = i18nModel.getText("ProductNotUpdated");
					sap.m.MessageToast.show(failureAlert);
				}
			});
		},

		hexEncode: function (sValue) {
			var hex, i;
			var result = "";
			for (i = 0; i < sValue.length; i++) {
				hex = sValue.charCodeAt(i).toString(16);
				result += ("0" + hex).slice(-2);
			}
			return result;
		},

		hexDecode: function (sValue) {
			var hexes = sValue.match(/.{1,2}/g) || [];
			var result = "";
			for (var j = 0; j < hexes.length; j++) {
				result += String.fromCharCode(parseInt(hexes[j], 16));
			}
			return result;
		},

		generateProductID: function () {
			return (Date.now().toString(36) + Math.random().toString(36).substr(2)).toUpperCase();
		},

		createDateFromTimestamp: function (timestamp) {
			if (timestamp) {
				const date = new Date(timestamp);
				const options = {
					year: 'numeric',
					month: '2-digit',
					day: 'numeric'
				};
				return date.toLocaleDateString(this.getView().getModel("i18n").getProperty("dateFormat"), options);
			}
		},

		formatProductAvailable: function (oValue) {
			if (oValue === true) {
				return this.getView().getModel("i18n").getProperty("yes");
			} else if (oValue === false) {
				return this.getView().getModel("i18n").getProperty("no");
			}
		},

		formatProductAvailableState: function (oValue) {
			if (oValue === true) {
				return "Success";
			} else if (oValue === false) {
				return "Warning";
			}
		},
	});
});
