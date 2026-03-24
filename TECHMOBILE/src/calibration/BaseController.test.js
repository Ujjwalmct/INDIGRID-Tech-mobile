/*
 * Licensed Materials - Property of IBM
 *
 * 5724-U18, 5737-M66
 *
 * (C) Copyright IBM Corp. 2022,2023 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */

/** Test */
import newTestStub from "../test/AppTestStub";
import testCalibrationData from "./test/test-calibration-data";
import testCalibrationUnit from "./test/test-calibration-unit";
import testUserInfoData from "./test/test-userinfo-data";
import testWoDetails from "./test/test-wodetails-data";

const baseSetup = async () =>
  newTestStub({
    currentPage: "calibrationpoints",
    datasources: {
      pluscWoDs: {
        data: testCalibrationData,
      },
      unitspointLookupDs: {
        data: testCalibrationUnit,
      },
      woDetailCalibration: {
        data: testWoDetails,
      },
    },
  })();

describe("BaseController", () => {
  describe("getLocale", () => {
    it("Should return en-US when user is american", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");

      app.getUserInfo = jest.fn(() => testUserInfoData);

      /**
       * @type {CalibrationPointsController}
       */
      const controller = page.controllers[0];

      // Act
      controller.pageInitialized(page, app);
      const locale = controller.getLocale();

      // Assert
      expect(locale.startsWith("en")).toBeTruthy();
    });

    it("Should return fr-FR when user is french", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");

      testUserInfoData.defaultLcale = "fr"; 
      testUserInfoData.defaultLanguage = "FR";

      app.getUserInfo = jest.fn(() => testUserInfoData);

      /**
       * @type {CalibrationPointsController}
       */
      const controller = page.controllers[0];

      // Act
      controller.pageInitialized(page, app);
      const locale = controller.getLocale();

      // Assert
      expect(locale.startsWith("fr")).toBeTruthy();
    });

    it("Should return en-US as default when user country does not exists", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");

      testUserInfoData.defaultLcale = "";
      testUserInfoData.defaultLanguage = "EN";

      app.getUserInfo = jest.fn(() => testUserInfoData);

      /**
       * @type {CalibrationPointsController}
       */
      const controller = page.controllers[0];

      // Act
      controller.pageInitialized(page, app);
      const locale = controller.getLocale();

      // Assert
      expect(locale.startsWith("en")).toBeTruthy();
    });
  });
});
