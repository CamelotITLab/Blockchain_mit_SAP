sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
	"use strict";

	return Controller.extend("EnergyMarket.controller.EnergyMarket", {

		onInit: function () {
			this.getUsers();
		},

		displayMyOffers: function () {
			const that = this;
			const url = "/middleware/getProductOfferingsForUser?user=" + this.currentUser.userId;
			const myOffersModel = new JSONModel();

			$.ajax({
				type: "GET",
				contentType: "application/json",
				url: url,
				success: function (data) {
					if (Array.isArray(JSON.parse(data))) {
						const offers = [];
						JSON.parse(data).map(o => {
							const buyer = o.buyerId ? o.buyerId : "-";
							const offer = {
								"productName": o.productName,
								"productDescription": o.productDescription,
								"productPrice": o.productPrice,
								"buyerId": buyer,
								"productId": o.productId
							};
							offers.push(offer);
						});
						const modelData = {
							myOffers: offers
						};
						myOffersModel.setData(modelData);
						that.getView().byId("my-offers").setModel(myOffersModel, "myOffersModel");
					}
				},
				error: function () {
					myOffersModel.setData();
					that.getView().byId("my-offers").setModel(myOffersModel, "myOffersModel");
				}
			});
		},

		displayMarketplaceOffers: function () {
			const that = this;
			const url = "/middleware/getAvailableProductOfferings";
			const marketplaceOffersModel = new JSONModel();

			$.ajax({
				type: "GET",
				contentType: "application/json",
				url: url,
				success: function (data) {
					if (Array.isArray(JSON.parse(data))) {
						const offers = [];
						JSON.parse(data).map(o => {
							const offer = {
								"productName": o.productName,
								"productDescription": o.productDescription,
								"productPrice": o.productPrice,
								"offerorId": o.offerorId,
								"productId": o.productId
							};
							offers.push(offer);
						});
						const modelData = {
							marketplaceOffers: offers
						}
						marketplaceOffersModel.setData(modelData);
						that.getView().byId("marketplace").setModel(marketplaceOffersModel);
					}
				},
				error: function () {
					marketplaceOffersModel.setData();
					that.getView().byId("marketplace").setModel(marketplaceOffersModel);
				}
			});
		},

		displayBoughtOffers: function () {
			const that = this;
			const url = "/middleware/getProductPurchasesForUser?user=" + this.currentUser.userId;
			const boughtOffersModel = new JSONModel();

			$.ajax({
				type: "GET",
				contentType: "application/json",
				url: url,
				success: function (data) {
					if (Array.isArray(JSON.parse(data))) {
						const offers = [];
						JSON.parse(data).map(o => {
							const offer = {
								"productName": o.productName,
								"productDescription": o.productDescription,
								"productPrice": o.productPrice,
								"offerorId": o.offerorId,
								"productId": o.productId
							};
							offers.push(offer);
						});
						const modelData = {
							boughtOffers: offers,
							currentUser: that.currentUser
						}
						boughtOffersModel.setData(modelData);
						that.getView().byId("bought-offers").setModel(boughtOffersModel, "boughtOffersModel");
					}
				},
				error: function () {
					boughtOffersModel.setData();
					that.getView().byId("bought-offers").setModel(boughtOffersModel, "boughtOffersModel");
				}
			});
		},

		openCreateOfferDialog: function () {
			const offerDetails = {
				productName: "",
				productDescription: "",
				productPrice: ""
			};
			const oModel = new JSONModel();

			oModel.setData({
				offer: offerDetails
			});

			if (!this._createOfferDialog) {
				this._createOfferDialog = sap.ui.xmlfragment("EnergyMarket.view.CreateOffer", this);
				this.getView().addDependent(this._createOfferDialog);
			}

			this._createOfferDialog.setModel(oModel);
			this._createOfferDialog.open();
		},

		onBtnCreateOffer: function () {
			sap.ui.core.BusyIndicator.show();
			const that = this;
			const i18nModel = this.getView().getModel("i18n").getResourceBundle();
			const offer = this._createOfferDialog.getModel().getData().offer;

			if (offer.productName && offer.productDescription && offer.productPrice) {
				if (isNaN(offer.productPrice)) {
					sap.ui.core.BusyIndicator.hide();
					return MessageToast.show(i18nModel.getText("priceHasToBeNumber"), {
						duration: 1000
					});
				}
				const url = "/middleware/registerProductOffering";
				const payload = {
					"productName": offer.productName,
					"productDescription": offer.productDescription,
					"offerorId": this.currentUser.userId,
					"productPrice": offer.productPrice
				};
				$.ajax({
					type: "Post",
					contentType: "application/json",
					accept: "application/json",
					data: JSON.stringify(payload),
					url: url,
					success: function () {
						const successAlert = i18nModel.getText("offerCreated");
						MessageToast.show(successAlert);
						that.displayMyOffers();
						that.displayMarketplaceOffers();
						sap.ui.core.BusyIndicator.hide();
						that._createOfferDialog.close();
					},
					error: function () {
						sap.ui.core.BusyIndicator.hide();
						const failureAlert = i18nModel.getText("offerNotCreated");
						sap.m.MessageToast.show(failureAlert);
						that._createOfferDialog.close();
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

		onBtnCancelCreateOffer: function () {
			this._createOfferDialog.close();
		},

		onBtnBuyOffer: function () {
			const i18nModel = this.getView().getModel("i18n").getResourceBundle();
			const marketplaceTable = this.getView().byId("marketplace");
			const selectedItem = marketplaceTable.getSelectedItem();
			if (selectedItem === null) {
				return MessageToast.show(i18nModel.getText("selectMsg"), {
					duration: 2000
				});
			}
			const that = this;
			const bindingContext = selectedItem.getBindingContext();
			const offer = bindingContext.getModel().getProperty(bindingContext.sPath);
			if (offer.offerorId === this.currentUser.userId) {
				return MessageToast.show(i18nModel.getText("notPossibleToBuyOwnOffer"), {
					duration: 2000
				});
			} else if (parseInt(offer.productPrice ) > parseInt(this.currentUser.accountBalance)) {
				return MessageToast.show(i18nModel.getText("notEnoughCoins"), {
					duration: 2000
				});
			}
			const url = "/middleware/purchaseProduct";
			const payload = {
				"productId": offer.productId,
				"buyerId": this.currentUser.userId
			};
			sap.ui.core.BusyIndicator.show();
			$.ajax({
				type: "Post",
				contentType: "application/json",
				accept: "application/json",
				data: JSON.stringify(payload),
				url: url,
				success: function () {
					that.getAccountBalanceOfCurrentUser();
					that.displayMyOffers();
					that.displayMarketplaceOffers();
					that.displayBoughtOffers();
					sap.ui.core.BusyIndicator.hide();
					const successAlert = i18nModel.getText("offerBought");
					MessageToast.show(successAlert);
				},
				error: function () {
					sap.ui.core.BusyIndicator.hide();
					const failureAlert = i18nModel.getText("offerNotBought");
					sap.m.MessageToast.show(failureAlert);
				}
			});
		},

		getUsers: function () {
			sap.ui.core.BusyIndicator.show();
			const that = this;
			const url = "/middleware/getUserList";
			const usersModel = new JSONModel();

			$.ajax({
				type: "GET",
				contentType: "application/json",
				url: url,
				success: function (data) {
					const modelData = {
						users: JSON.parse(data)
					}
					usersModel.setData(modelData);
					that.getView().byId("user-select").setModel(usersModel);
					that.users = modelData.users;
					that.currentUser = modelData.users[0];
					const currentUserModel = new JSONModel();
					currentUserModel.setData({
						currentUser: that.currentUser
					});
					that.getView().byId("my-offers").setModel(currentUserModel, "currentUserModel");
					that.getView().byId("bought-offers").setModel(currentUserModel, "currentUserModel");
					that.getAccountBalanceOfCurrentUser();
					that.displayMyOffers();
					that.displayMarketplaceOffers();
					that.displayBoughtOffers();
					sap.ui.core.BusyIndicator.hide();
				},
				error: function () {
					usersModel.setData();
					that.getView().byId("user-select").setModel(usersModel);
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},

		changeCurrentUser: function (oEvent) {
			sap.ui.core.BusyIndicator.show();
			const userId = oEvent.getParameters().selectedItem.getKey();
			this.users.map(user => {
				if (user.userId == userId) this.currentUser = user;
			});
			const currentUserModel = new JSONModel();
			currentUserModel.setData({
				currentUser: this.currentUser
			});
			this.getView().byId("my-offers").setModel(currentUserModel, "currentUserModel");
			this.getView().byId("bought-offers").setModel(currentUserModel, "currentUserModel");
			this.getAccountBalanceOfCurrentUser();
			this.displayMyOffers();
			this.displayMarketplaceOffers();
			this.displayBoughtOffers();
			sap.ui.core.BusyIndicator.hide();
		},

		getAccountBalanceOfCurrentUser: function () {
			const that = this;
			const url = "/middleware/getAccountBalance?user=" + this.currentUser.userId;
			const accountBalanceModel = new JSONModel();

			$.ajax({
				type: "GET",
				contentType: "application/json",
				url: url,
				success: function (data) {
					const modelData = {
						accountBalance: data
					}
					that.currentUser.accountBalance = data;
					accountBalanceModel.setData(modelData);
					that.getView().byId("account-balance").setModel(accountBalanceModel);
				},
				error: function () {
					usersModel.setData();
					that.getView().byId("account-balance").setModel(usersModel);
				}
			});
		}
	});
});