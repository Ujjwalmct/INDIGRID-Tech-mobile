/** Test */
import newTestStub from "../../../test/AppTestStub.jsx";
import testCalibrationData from "../../test/test-calibration-data.js";
import testCalibrationUnitData from '../../test/test-calibration-unit.js'

/** Helpers */
import UnitLookupHelper from "../UnitLookupHelper.js";

let initializeApp;

const baseSetup = async () => {
  initializeApp = newTestStub({
    currentPage: "calibrationpoints",
    datasources: {
      pluscWoDs: {
        data: testCalibrationData,
      },
      unitspointLookupDs: {
        data: testCalibrationUnitData,
      },
    },
  });

  const app = await initializeApp();
  return app;
};

describe("Calibration As Found Unit Lookup Helper", () => {
  describe("openUnitLookup", () => {
    it("Dialog 'unitspointLookup' is shown when opening unit lookup", async () => {
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");

      page.showDialog = jest.fn();

      const helper = new UnitLookupHelper(
        app,
        page,
        "unitspointLookupDs",
        "unitspointLookup"
      );

      await helper.openUnitLookup();

      expect(page.showDialog).toHaveBeenCalled();
      expect(page.showDialog.mock.calls[0][0]).toEqual("unitspointLookup");
    });
  });
});
