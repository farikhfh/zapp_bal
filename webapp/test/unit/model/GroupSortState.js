/*global QUnit*/

sap.ui.define([
	"ZAPP_APPR_BAL/ZAPP_APPR_BAL/model/GroupSortState",
	"sap/ui/model/json/JSONModel"
], function (GroupSortState, JSONModel) {
	"use strict";

	QUnit.module("GroupSortState - grouping and sorting", {
		beforeEach: function () {
			this.oModel = new JSONModel({});
			// System under test
			this.oGroupSortState = new GroupSortState(this.oModel, function() {});
		}
	});

	QUnit.test("Should always return a sorter when sorting", function (assert) {
		// Act + Assert
		assert.strictEqual(this.oGroupSortState.sort("Amt").length, 1, "The sorting by Amt returned a sorter");
		assert.strictEqual(this.oGroupSortState.sort("BalId").length, 1, "The sorting by BalId returned a sorter");
	});

	QUnit.test("Should return a grouper when grouping", function (assert) {
		// Act + Assert
		assert.strictEqual(this.oGroupSortState.group("Amt").length, 1, "The group by Amt returned a sorter");
		assert.strictEqual(this.oGroupSortState.group("None").length, 0, "The sorting by None returned no sorter");
	});


	QUnit.test("Should set the sorting to Amt if the user groupes by Amt", function (assert) {
		// Act + Assert
		this.oGroupSortState.group("Amt");
		assert.strictEqual(this.oModel.getProperty("/sortBy"), "Amt", "The sorting is the same as the grouping");
	});

	QUnit.test("Should set the grouping to None if the user sorts by BalId and there was a grouping before", function (assert) {
		// Arrange
		this.oModel.setProperty("/groupBy", "Amt");

		this.oGroupSortState.sort("BalId");

		// Assert
		assert.strictEqual(this.oModel.getProperty("/groupBy"), "None", "The grouping got reset");
	});
});