/*global QUnit*/

jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 balSet in the list
// * All 3 balSet have at least one balItemSet

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
		"ZAPP_APPR_BAL/ZAPP_APPR_BAL/test/integration/MasterJourney",
		"ZAPP_APPR_BAL/ZAPP_APPR_BAL/test/integration/NavigationJourney",
		"ZAPP_APPR_BAL/ZAPP_APPR_BAL/test/integration/NotFoundJourney",
		"ZAPP_APPR_BAL/ZAPP_APPR_BAL/test/integration/BusyJourney",
		"ZAPP_APPR_BAL/ZAPP_APPR_BAL/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});