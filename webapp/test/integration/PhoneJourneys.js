/*global QUnit*/

jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/test/Opa5",
	"ZAPP_APPR_BAL/ZAPP_APPR_BAL/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"ZAPP_APPR_BAL/ZAPP_APPR_BAL/test/integration/pages/App",
	"ZAPP_APPR_BAL/ZAPP_APPR_BAL/test/integration/pages/Browser",
	"ZAPP_APPR_BAL/ZAPP_APPR_BAL/test/integration/pages/Master",
	"ZAPP_APPR_BAL/ZAPP_APPR_BAL/test/integration/pages/Detail",
	"ZAPP_APPR_BAL/ZAPP_APPR_BAL/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "ZAPP_APPR_BAL.ZAPP_APPR_BAL.view."
	});

	sap.ui.require([
		"ZAPP_APPR_BAL/ZAPP_APPR_BAL/test/integration/NavigationJourneyPhone",
		"ZAPP_APPR_BAL/ZAPP_APPR_BAL/test/integration/NotFoundJourneyPhone",
		"ZAPP_APPR_BAL/ZAPP_APPR_BAL/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});