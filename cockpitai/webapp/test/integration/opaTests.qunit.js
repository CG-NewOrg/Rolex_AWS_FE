/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["cockpitai/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
