import newTestStub from "../../../test/AppTestStub.jsx";
import UnitLookupHelper from "../UnitLookupHelper.js";
import testCalibrationData from "../../test/test-calibration-data.js";
import testCalibrationUnitData from "../../test/test-calibration-unit.js";

const baseSetup = async () =>
  newTestStub({
    currentPage: "calibrationpoints",
    datasources: {
      pluscWoDs: {
        data: testCalibrationData,
      },
      unitspointLookupDs: {
        data: testCalibrationUnitData,
      },
    },
  })();

describe("UnitLookupHelper", () => {
  describe("openUnitLookup", () => {
    it("Should display dialog when opening unit lookup", async () => {
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      page.showDialog = jest.fn();

      const helper = new UnitLookupHelper(
        app,
        page,
        "unitspointLookupDs",
        "unitspointLookup"
      );

      // Act
      await helper.openUnitLookup();

      // Assert
      expect(page.showDialog).toHaveBeenCalled();
      expect(page.showDialog.mock.calls[0][0]).toEqual("unitspointLookup");
    });
  });
});
