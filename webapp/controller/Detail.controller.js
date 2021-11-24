/*global location */
sap.ui.define([
	"ZAPP_APPR_BAL/ZAPP_APPR_BAL/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"ZAPP_APPR_BAL/ZAPP_APPR_BAL/model/formatter",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/m/Dialog",
	"sap/m/DialogType",
	"sap/m/Button",
	"sap/m/ButtonType",
	"sap/m/Text",
	'sap/ui/core/message/ControlMessageProcessor',
	"sap/ui/core/ValueState",
	'sap/m/MessagePopover',
	'sap/ui/core/message/Message',
	'sap/ui/core/Core',
	'sap/m/MessagePopoverItem'
], function(BaseController, JSONModel, formatter, MessageBox, MessageToast, Dialog, DialogType, Button, ButtonType, Text,
	ControlMessageProcessor, ValueState, MessagePopover, Message, Core, MessagePopoverItem) {
	"use strict";

	return BaseController.extend("ZAPP_APPR_BAL.ZAPP_APPR_BAL.controller.Detail", {

		formatter: formatter,
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});

			var oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
			var oMessageManager = sap.ui.getCore().getMessageManager();

			oMessageManager.registerMessageProcessor(oMessageProcessor);
			oMessageManager.removeAllMessages();

			var _messagePopover = new MessagePopover();

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function() {
			var oViewModel = this.getModel("detailView");

			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("detailView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});

			oShareDialog.open();
		},

		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function(oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");

			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("balSet", {
					BalId: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function(sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.BalId,
				sObjectName = oObject.BalId,
				oViewModel = this.getModel("detailView");

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("lineItemsList"),
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);

			oLineItemTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for line item table
				oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			});

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		setIconFromFlagChar: function(flag) {
			if (flag === "X") {
				return "sap-icon://accept";
			} else {
				return "sap-icon://decline";
			}
		},

		setVisible: function(flag) {
			if (flag === "X") {
				return true;
			} else {
				return false;
			}
		},

		onDeleteClick: function(oEvent) {
			var title = "Delete BAL dan SES keseluruhan.";
			var message = "Apakah anda yakin akan men-delete BAL dan SES nya sekaligus? Mohon dicek kembali sebelum melanjutkan.";
			var path = oEvent.getSource().getBindingContext().getProperty();

			path.Action = "DELETE";

			var oConfirmDialog = new Dialog({
				type: DialogType.Message,
				title: title,
				icon: 'sap-icon://delete',
				content: new Text({
					text: message
				}),
				beginButton: new Button({
					type: ButtonType.Accept,
					text: "Yes",
					icon: 'sap-icon://accept',
					press: function() {
						this.doDelete(path);
						oConfirmDialog.close();
					}.bind(this)
				}),
				endButton: new Button({
					type: ButtonType.Reject,
					text: "No",
					icon: "sap-icon://decline",
					press: function() {
						oConfirmDialog.close();
					}.bind(this)
				})
			});

			oConfirmDialog.open();
		},

		doDelete: function(path) {
			var oModel = this.getModel();

			oModel.update("/balSet(BalId='" + path.BalId + "')", path, {
				success: function(response) {
					var oSuccessMessageDialog = new Dialog({
						type: DialogType.Message,
						title: "Success",
						state: ValueState.Success,
						content: new Text({
							text: "BAL " + path.BalId + " dan seluruh dokumen SES berhasil dihapus."
						}),
						beginButton: new Button({
							type: ButtonType.Emphasized,
							text: "OK",
							press: function() {
								oModel.refresh();
								oSuccessMessageDialog.close();
							}.bind(this)
						})
					});

					oSuccessMessageDialog.open();
				},
				error: function(response) {
					MessageBox.show(
						"Error Happened, please check message box icon on bottom left", {
							icon: MessageBox.Icon.ERROR,
							title: "Error",
							onClose: function(oAction) {
								oModel.refresh();
							}
						}
					);
				}
			});
		},

		onReleaseClick: function(oEvent) {
			var title = "Release BAL.";
			var message = "Apakah anda yakin akan me-release BAL untuk diajukan ke approver? Mohon dicek kembali sebelum melanjutkan.";
			var path = oEvent.getSource().getBindingContext().getProperty();

			path.Action = "RELEASE";

			var oConfirmDialog = new Dialog({
				type: DialogType.Message,
				title: title,
				icon: 'sap-icon://complete',
				content: new Text({
					text: message
				}),
				beginButton: new Button({
					type: ButtonType.Accept,
					text: "Yes",
					icon: 'sap-icon://accept',
					press: function() {
						this.doRelease(path);
						oConfirmDialog.close();
					}.bind(this)
				}),
				endButton: new Button({
					type: ButtonType.Reject,
					text: "No",
					icon: "sap-icon://decline",
					press: function() {
						oConfirmDialog.close();
					}.bind(this)
				})
			});

			oConfirmDialog.open();
		},

		doRelease: function(path) {
			var oModel = this.getModel();

			oModel.update("/balSet(BalId='" + path.BalId + "')", path, {
				success: function(response) {
					var oSuccessMessageDialog = new Dialog({
						type: DialogType.Message,
						title: "Success",
						state: ValueState.Success,
						content: new Text({
							text: "BAL " + path.BalId + " berhasil di release."
						}),
						beginButton: new Button({
							type: ButtonType.Emphasized,
							text: "OK",
							press: function() {
								oModel.refresh();
								oSuccessMessageDialog.close();
							}.bind(this)
						})
					});

					oSuccessMessageDialog.open();
				},
				error: function(response) {
					MessageBox.show(
						"Error Happened, please check message box icon on bottom left", {
							icon: MessageBox.Icon.ERROR,
							title: "Error",
							onClose: function(oAction) {
								oModel.refresh();
							}
						}
					);
				}
			});
		},

		onCreateSesClick: function(oEvent) {
			var title = "Automatic SES Creation";
			var message = "Apakah anda yakin akan menggenerate dokumen SES dari BAL ini? Mohon dicek kembali sebelum melanjutkan.";
			var path = oEvent.getSource().getBindingContext().getProperty();

			path.Action = "CREATESES";

			var oConfirmDialog = new Dialog({
				type: DialogType.Message,
				title: title,
				icon: 'sap-icon://add-document',
				content: new Text({
					text: message
				}),
				beginButton: new Button({
					type: ButtonType.Accept,
					text: "Yes",
					icon: 'sap-icon://accept',
					press: function() {
						this.doCreateSes(path);
						oConfirmDialog.close();
					}.bind(this)
				}),
				endButton: new Button({
					type: ButtonType.Reject,
					text: "No",
					icon: "sap-icon://decline",
					press: function() {
						oConfirmDialog.close();
					}.bind(this)
				})
			});

			oConfirmDialog.open();
		},

		doCreateSes: function(path) {
			var oModel = this.getModel();

			oModel.update("/balSet(BalId='" + path.BalId + "')", path, {
				success: function(response) {
					var oSuccessMessageDialog = new Dialog({
						type: DialogType.Message,
						title: "Success",
						state: ValueState.Success,
						content: new Text({
							text: "SES berhasil digenerate dari BAL " + path.BalId
						}),
						beginButton: new Button({
							type: ButtonType.Emphasized,
							text: "OK",
							press: function() {
								oModel.refresh();
								oSuccessMessageDialog.close();
							}.bind(this)
						})
					});

					oSuccessMessageDialog.open();
				},
				error: function(response) {
					MessageBox.show(
						"Error Happened, please check message box icon on bottom left", {
							icon: MessageBox.Icon.ERROR,
							title: "Error",
							onClose: function(oAction) {
								oModel.refresh();
							}
						}
					);
				}
			});
		},

		onSesAcceptClick: function(oEvent) {
			var message =
				"Apakah anda yakin akan meng-Accept SES berikut? Mohon dicek kembali sebelum melanjutkan (akan terposting dokumen accounting dan dokumen progress pada WBS).";
			var path = oEvent.getSource().getBindingContext().getProperty();

			var title = "Accept SES no. " + path.Lblni;

			// try to access parent data
			var oView = this.getView().byId("sesItemsList").getParent();
			var oModel = oView.getModel();
			var oObject = oModel.getObject("/balSet('" + path.BalId + "')");

			oObject.Action = "ACCEPTSES";
			oObject.Lblni = path.Lblni;

			var oConfirmDialog = new Dialog({
				type: DialogType.Message,
				title: title,
				icon: 'sap-icon://flag',
				content: new Text({
					text: message
				}),
				beginButton: new Button({
					type: ButtonType.Accept,
					text: "Yes",
					icon: 'sap-icon://accept',
					press: function() {
						this.doAcceptSes(path, oObject);
						oConfirmDialog.close();
					}.bind(this)
				}),
				endButton: new Button({
					type: ButtonType.Reject,
					text: "No",
					icon: "sap-icon://decline",
					press: function() {
						oConfirmDialog.close();
					}.bind(this)
				})
			});

			oConfirmDialog.open();
		},

		doAcceptSes: function(path, object) {
			var oModel = this.getModel();

			oModel.update("/balSet(BalId='" + path.BalId + "')", object, {
				success: function(response) {
					var oSuccessMessageDialog = new Dialog({
						type: DialogType.Message,
						title: "Success",
						state: ValueState.Success,
						content: new Text({
							text: "SES " + path.Lblni + " berhasil di-accept"
						}),
						beginButton: new Button({
							type: ButtonType.Emphasized,
							text: "OK",
							press: function() {
								oModel.refresh();
								oSuccessMessageDialog.close();
							}.bind(this)
						})
					});

					oSuccessMessageDialog.open();
				},
				error: function(response) {
					MessageBox.show(
						"Error Happened, please check message box icon on bottom left", {
							icon: MessageBox.Icon.ERROR,
							title: "Error",
							onClose: function(oAction) {
								oModel.refresh();
							}
						}
					);
				}
			});
		},

		onSesDeleteClick: function(oEvent) {
			var message =
				"Apakah anda yakin akan meng-Delete SES berikut? Mohon dicek kembali sebelum melanjutkan (akan terposting dokumen reverse di accounting).";
			var path = oEvent.getSource().getBindingContext().getProperty();

			var title = "Delete SES no. " + path.Lblni;

			// try to access parent data
			var oView = this.getView().byId("sesItemsList").getParent();
			var oModel = oView.getModel();
			var oObject = oModel.getObject("/balSet('" + path.BalId + "')");

			oObject.Action = "DELETESES";
			oObject.Lblni = path.Lblni;

			var oConfirmDialog = new Dialog({
				type: DialogType.Message,
				title: title,
				icon: 'sap-icon://delete',
				content: [
					new Text({
						text: message
					})

					// new sap.m.Label({
					// 	text: 'Posting Date',
					// 	labelFor: 'postdate'
					// }),
					// new sap.m.DatePicker("postdate", {
					// 	value: {
					// 		path: '/myDate',
					// 		type: sap.ui.model.type.Date,
					// 		formatOptions: {
					// 			style: 'full',
					// 			UTC: true
					// 		}
					// 	},
					// 	valueFormat: "dd-MM-yyyy",
					// 	displayFormat: "dd-MM-yyyy",
					// 	required: true
					// }),
					// new sap.m.Label({
					// 	text: 'Document Date',
					// 	labelFor: 'docdate'
					// }),
					// new sap.m.DatePicker("docdate", {
					// 	value: {
					// 		path: '/myDate',
					// 		type: sap.ui.model.type.Date,
					// 		formatOptions: {
					// 			style: 'full',
					// 			UTC: true
					// 		}
					// 	},
					// 	valueFormat: "dd-MM-yyyy",
					// 	displayFormat: "dd-MM-yyyy",
					// 	required: true
					// })
				],
				beginButton: new Button({
					type: ButtonType.Accept,
					text: "Yes",
					icon: 'sap-icon://accept',
					press: function() {
						// var postdate = sap.ui.getCore().byId('postdate').getDateValue();
						// var docdate = sap.ui.getCore().byId('docdate').getDateValue();

						// oObject.Postdate = new Date(postdate);
						// oObject.Docdate = new Date(docdate);

						this.doDeleteSes(path, oObject);
						oConfirmDialog.close();
					}.bind(this)
				}),
				endButton: new Button({
					type: ButtonType.Reject,
					text: "No",
					icon: "sap-icon://decline",
					press: function() {
						oConfirmDialog.close();
					}.bind(this)
				}),
				afterClose: function() {
					oConfirmDialog.destroy();
				}
			});

			oConfirmDialog.open();
		},

		doDeleteSes: function(path, object) {
			var oModel = this.getModel();

			oModel.update("/balSet(BalId='" + path.BalId + "')", object, {
				success: function(response) {
					var oSuccessMessageDialog = new Dialog({
						type: DialogType.Message,
						title: "Success",
						state: ValueState.Success,
						content: new Text({
							text: "Keseluruhan SES pada BAL " + object.BalId + " berhasil di-delete."
						}),
						beginButton: new Button({
							type: ButtonType.Emphasized,
							text: "OK",
							press: function() {
								oModel.refresh();
								oSuccessMessageDialog.close();
							}.bind(this)
						})
					});

					oSuccessMessageDialog.open();
				},
				error: function(response) {
					MessageBox.show(
						"Error Happened, please check message box icon on bottom left", {
							icon: MessageBox.Icon.ERROR,
							title: "Error",
							onClose: function(oAction) {
								oModel.refresh();
							}
						}
					);
				}
			});
		},

		onMessagesButtonPress: function(oEvent) {

			var oMessagesButton = oEvent.getSource();
			if (!this._messagePopover) {
				this._messagePopover = new MessagePopover({
					items: {
						path: "message>/",
						template: new MessagePopoverItem({
							description: "{message>description}",
							type: "{message>type}",
							title: "{message>message}"
						})
					}
				});
				oMessagesButton.addDependent(this._messagePopover);
			}
			this._messagePopover.toggle(oMessagesButton);
		},
		setDeleteVisible: function(deleted, ses) {
			if (deleted !== 'X' && ses !== 'X') {
				return true;
			} else {
				return false;
			}
		},

		setCreateSesVisible: function(approver, released, ses) {
			if (approver === "X" && released === 'X' && ses !== 'X') {
				return true;
			} else {
				return false;
			}
		},

		setRejectVisible: function(approver, reject) {
			if (approver === 'X' && reject !== 'X') {
				return true;
			} else {
				return false;
			}
		},
		
		setReleaseVisible: function(approver, release, reject){
			if (approver === "" && release === "" && reject === ""){
				return true;
			} else {
				return false;
			}
		},

		onSendEmailPress: function(oEvent) {
			var message =
				"Apakah anda yakin akan mengirimkan dokumen BAL ini sebagai email? Email akan dikirimkan ke pihak-pihak terkait termasuk Vendor, mohon diperiksa kembali sebelum melanjutkan.";
			var path = oEvent.getSource().getBindingContext().getProperty();

			var title = "Send Email BAL no. " + path.BalId;

			path.Action = 'EMAIL';

			var oConfirmDialog = new Dialog({
				type: DialogType.Message,
				title: title,
				icon: 'sap-icon://email',
				content: new Text({
					text: message
				}),
				beginButton: new Button({
					type: ButtonType.Accept,
					text: "Yes",
					icon: 'sap-icon://accept',
					press: function() {
						this.doSendEmail(path);
						oConfirmDialog.close();
					}.bind(this)
				}),
				endButton: new Button({
					type: ButtonType.Reject,
					text: "No",
					icon: "sap-icon://decline",
					press: function() {
						oConfirmDialog.close();
					}.bind(this)
				})
			});

			oConfirmDialog.open();
		},

		doSendEmail: function(path) {
			var oModel = this.getModel();

			oModel.update("/balSet(BalId='" + path.BalId + "')", path, {
				success: function(response) {
					var oSuccessMessageDialog = new Dialog({
						type: DialogType.Message,
						title: "Success",
						state: ValueState.Success,
						content: new Text({
							text: "Email dokumen BAL " + path.BalId + " berhasil dikirimkan"
						}),
						beginButton: new Button({
							type: ButtonType.Emphasized,
							text: "OK",
							press: function() {
								oModel.refresh();
								oSuccessMessageDialog.close();
							}.bind(this)
						})
					});

					oSuccessMessageDialog.open();
				},
				error: function(response) {
					MessageBox.show(
						"Error Happened, please check message box icon on bottom left", {
							icon: MessageBox.Icon.ERROR,
							title: "Error",
							onClose: function(oAction) {
								oModel.refresh();
							}
						}
					);
				}
			});
		},

		onRejectPress: function(oEvent) {
			var message =
				"Apakah anda yakin akan menolak BAL ini? Mohon sertakan alasan penolakan di kolom berikut.";
			var path = oEvent.getSource().getBindingContext().getProperty();

			var title = "Reject BAL no. " + path.BalId;

			path.Action = 'REJECT';

			var oRejectText = new sap.m.TextArea(
				"rejectDialogTextarea", {
					liveChange: function(e) {
						var f = e.getParameter('value');
						path.RejectNote = f;
					},
					width: '100%',
					placeholder: "Please input reject message",
					required: true
				});

			var oConfirmDialog = new Dialog({
				type: DialogType.Message,
				title: title,
				icon: 'sap-icon://decline',
				content: [
					new Text({
						text: message
					}),
					new Text({
						text: path.RejectNote
					}), oRejectText
				],
				beginButton: new Button({
					type: ButtonType.Accept,
					text: "Yes",
					icon: 'sap-icon://accept',
					press: function() {
						this.doReject(path);
						oConfirmDialog.close();
					}.bind(this)
				}),
				endButton: new Button({
					type: ButtonType.Reject,
					text: "No",
					icon: "sap-icon://decline",
					press: function() {
						oConfirmDialog.close();
					}.bind(this)
				}),
				afterClose: function() {
					oConfirmDialog.destroy();
				}
			});

			oConfirmDialog.open();
		},

		doReject: function(path) {
			var oModel = this.getModel();

			oModel.update("/balSet(BalId='" + path.BalId + "')", path, {
				success: function(response) {
					var oSuccessMessageDialog = new Dialog({
						type: DialogType.Message,
						title: "Success",
						state: ValueState.Success,
						content: new Text({
							text: "Dokumen BAL " + path.BalId + " berhasil di-Reject"
						}),
						beginButton: new Button({
							type: ButtonType.Emphasized,
							text: "OK",
							press: function() {
								oModel.refresh();
								oSuccessMessageDialog.close();
							}.bind(this)
						})
					});

					oSuccessMessageDialog.open();
				},
				error: function(response) {
					MessageBox.show(
						"Error Happened, please check message box icon on bottom left", {
							icon: MessageBox.Icon.ERROR,
							title: "Error",
							onClose: function(oAction) {
								oModel.refresh();
							}
						}
					);
				}
			});
		},

		setStatusState: function(status) {
			var state;

			if (status !== null) {
				if (status === "RELEASE") {
					state = "Warning";
				} else if (status === "PROCESSED") {
					state = "Success";
				} else if (status === "REJECT") {
					state = "Error";
				} else {
					state = "None";
				}
			} else {
				state = "None";
			}

			return state;
		}
	});

});