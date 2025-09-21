sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/m/MessageBox",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/Text"
], function(ControllerExtension, MessageBox, Button, Dialog, Text) {
    "use strict";
console.log("ObjectPageExt.controller.js loaded🚀");
    return ControllerExtension.extend("salesorder.ext.controller.ObjectPageExt", {
        // You can use the "override" property to enhance lifecycle methods of the standard FE controller
        override: {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * @override
             */
            onInit: function() {
                // You can place initialization code here.
            }
        },

        // This is a custom function that will be called when the "Edit" button is pressed
        onEditPressed: function(oEvent) {
            const oContext = this.getView().getBindingContext();
            MessageBox.information("Edit button clicked for Sales Order: " + oContext.getProperty("Salesorder"));
        },

        // This is a custom function that will be called when the "Delete" button is pressed
        onDeletePressed: function(oEvent) {
            const oContext = this.getView().getBindingContext();
            const sSalesOrder = oContext.getProperty("Salesorder");
            // Use this.base to access the Fiori Elements extension API
            const oExtensionAPI = this.base.getExtensionAPI();

            const oDialog = new Dialog({
                title: "Confirm Deletion",
                type: "Message",
                content: new Text({ text: `Are you sure you want to delete Sales Order ${sSalesOrder}?` }),
                beginButton: new Button({
                    text: "Okay",
                    type: "Emphasized",
                    press: function () {
                        oContext.delete().then(function () {
                            MessageBox.success("Sales Order " + sSalesOrder + " deleted.");
                            // Navigate back to the list report after successful deletion
                            oExtensionAPI.getNavigationController().navigateBack();
                        }).catch(function (oError) {
                            MessageBox.error("Error deleting Sales Order: " + oError.message);
                        });
                        oDialog.close();
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function() {
                    oDialog.destroy();
                }
            });

            oDialog.open();
        }
    });
});