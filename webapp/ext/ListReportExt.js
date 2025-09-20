
// webapp\ext\ListReportExt.js
sap.ui.define([
  "sap/ui/core/mvc/ControllerExtension",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "sap/ui/core/Fragment",
  "sap/ui/model/json/JSONModel",
  "sap/m/Column",
  "sap/m/HBox",
  "sap/m/Button",
  "sap/m/OverflowToolbarButton"
], function (ControllerExtension, MessageBox, MessageToast, Fragment, JSONModel, Column, HBox, Button, OverflowToolbarButton) {
  "use strict";

  function getTable(oView) {
    var a = oView.findAggregatedObjects(true, function (o) { return o && o.isA && o.isA("sap.m.Table"); });
    return a && a[0];
  }

  function ensureToolbarAdd(oTable, that) {
    var oTb = oTable.getHeaderToolbar && oTable.getHeaderToolbar();
    if (!oTb) { return; }
    var aC = oTb.getContent && oTb.getContent();
    for (var i = 0; i < (aC || []).length; i++) {
      if (aC[i].data && aC[i].data("isAddButton")) { return; }
    }
    var oAdd = new OverflowToolbarButton({
      icon: "sap-icon://add",
      type: "Emphasized",
      tooltip: "Add",
      press: that.onAddPress.bind(that)
    });
    if (oAdd.data) { oAdd.data("isAddButton", true); }
    oTb.addContent(oAdd);
  }

  function ensureActionsColumn(oTable) {
    var aCols = oTable.getColumns();
    var lastIsActions = aCols.length && aCols[aCols.length - 1].data && aCols[aCols.length - 1].data("isActionColumn");
    if (lastIsActions) { return; }
    var oCol = new Column({ width: "5rem", hAlign: "End" });
    if (oCol.data) { oCol.data("isActionColumn", true); }
    oTable.addColumn(oCol);
  }

  function addActionCells(oTable, that) {
    var aItems = oTable.getItems();
    for (var i = 0; i < aItems.length; i++) {
      var oItem = aItems[i];
      var aCells = oItem.getCells();
      var last = aCells[aCells.length - 1];
      var already = last && last.data && last.data("isActionCell");
      if (already) { continue; }
      var oHBox = new HBox({
        items: [
          new Button({ icon: "sap-icon://pushpin-on", type: "Transparent", tooltip: "Edit", press: that.onRowEdit.bind(that) }),
          new Button({ icon: "sap-icon://delete",     type: "Transparent", tooltip: "Delete", press: that.onRowDelete.bind(that) })
        ]
      });
      if (oHBox.data) { oHBox.data("isActionCell", true); }
      oItem.addCell(oHBox);
    }
  }

  function ensureDialog(that) {
    if (that._oEditDlg) { return Promise.resolve(that._oEditDlg); }
    var oView = that.base.getView();
    return Fragment.load({ name: "salesorder.ext.EditDialog", controller: that }).then(function (oDlg) {
      oDlg.setModel(new JSONModel({ mode: "Edit" }), "ext");
      oView.addDependent(oDlg);
      that._oEditDlg = oDlg;
      return oDlg;
    });
  }

  return ControllerExtension.extend("salesorder.ext.ListReportExt", {
    metadata: { methods: ["onAddPress","onRowEdit","onRowDelete","onEditOk","onEditCancel"] },

    override: {
      onAfterRendering: function () {
        // prove we loaded
        // console.log("[ListReportExt] loaded");
        var oView = this.base.getView();
        var oTable = getTable(oView);
        if (!oTable || this._hooked) { return; }
        this._hooked = true;

        ensureToolbarAdd(oTable, this);
        ensureActionsColumn(oTable);
        addActionCells(oTable, this);

        oTable.attachUpdateFinished(function () {
          ensureActionsColumn(oTable);
          addActionCells(oTable, this);
        }.bind(this));
      }
    },

    onAddPress: function () {
      var oView = this.base.getView();
      var oTable = getTable(oView);
      if (!oTable) { return; }
      var oBinding = oTable.getBinding("items");
      if (!oBinding) { return; }

      var nowIso = new Date().toISOString();
      this._createdCtx = oBinding.create({
        Salesorder: String(Date.now()).slice(-9),
        Createdbyuser: "EPM_DEMO",
        Creationdatetime: nowIso,
        Lastchangedbyuser: "EPM_DEMO",
        Lastchangeddatetime: nowIso,
        Iscreatedbybusinesspartner: false,
        Islastchangedbybusinesspartner: false,
        Customer: "",
        Companyname: "",
        Customercontact: "",
        Transactioncurrency: "USD",
        Grossamountintransaccurrency: 0,
        Netamountintransactioncurrency: 0,
        Taxamountintransactioncurrency: 0,
        Salesorderlifecyclestatus: "",
        Salesorderbillingstatus: "",
        Salesorderdeliverystatus: "",
        Salesorderoverallstatus: "",
        Opportunity: "",
        Salesorderpaymentmethod: "",
        Salesorderpaymentterms: "",
        Billtoparty: "",
        Billtopartyrole: "",
        Shiptoparty: "",
        Shiptopartyrole: ""
      });

      var that = this;
      ensureDialog(this).then(function (oDlg) {
        oDlg.getModel("ext").setProperty("/mode", "Create");
        oDlg.setBindingContext(that._createdCtx);
        oDlg.open();
      }).catch(function (err) { MessageBox.error(err && err.message ? err.message : String(err)); });
    },

    onRowEdit: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext();
      if (!oCtx) { return; }
      var that = this;
      ensureDialog(this).then(function (oDlg) {
        oDlg.getModel("ext").setProperty("/mode", "Edit");
        oDlg.setBindingContext(oCtx);
        oDlg.open();
      }).catch(function (err) { MessageBox.error(err && err.message ? err.message : String(err)); });
    },

    onRowDelete: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext();
      if (!oCtx) { return; }
      var sId = oCtx.getProperty("Salesorder");
      MessageBox.confirm("Delete Sales Order " + sId + "?", {
        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
        emphasizedAction: MessageBox.Action.OK,
        onClose: function (act) {
          if (act === MessageBox.Action.OK) {
            oCtx.delete("$auto")
              .then(function () { MessageToast.show("Deleted"); })
              .catch(function (err) { MessageBox.error(err.message); });
          }
        }
      });
    },

    onEditOk: function () {
      var oModel = this.base.getView().getModel();
      oModel.submitBatch("$auto")
        .then(function () { MessageToast.show("Saved"); })
        .catch(function (err) { MessageBox.error(err.message); });
      if (this._oEditDlg) { this._oEditDlg.close(); }
      this._createdCtx = null;
    },

    onEditCancel: function () {
      if (this._createdCtx) { this._createdCtx.delete("$auto"); this._createdCtx = null; }
      if (this._oEditDlg) { this._oEditDlg.close(); }
    }
  });
});
