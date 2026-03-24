/*
 * Licensed Materials - Property of IBM
 *
 * 5724-U18, 5737-M66
 *
 * (C) Copyright IBM Corp. 2022,2024 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */

/** Constants */
import CalibrationPointConstants from "./rules/constants/CalibrationPointConstants";
import DatasheetConstants from "./rules/constants/DatasheetConstants";
import UnitLookupConstants from "./utils/constants/UnitLookupConstants";

/** Utils */
import generateRandomInt from "./rules/utils/generateRandomInt";
import CalibrationPointHandler from "./rules/handlers/CalibrationPointHandler";
import DatasheetCalculation from "./rules/helpers/DatasheetCalculation";
import toDisplayableValue from "./rules/utils/numberFormatter/toDisplayableValue";

/** Test */
import newTestStub from "../test/AppTestStub";
import testCalibrationData from "./test/test-calibration-data";
import testCalibrationUnit from "./test/test-calibration-unit";
import testWoDetails from "./test/test-wodetails-data";
import testDatasheetDaData from "./test/test-datasheet-DA-data";
import testDatasheetENData from "./test/test-datasheet-EN-data";
import testDsconfigData from "./test/test-dsconfig-data";
import LocaleConstants from "./rules/constants/LocaleConstants";

const baseSetup = async () =>
  newTestStub({
    currentPage: "calibrationpoints",
    onNewState: (state) => {
      return { 
        ...state, 
        canLoadCalibrationData: true
      }
    },
    datasources: {
      pluscWoDs: {
        data: testCalibrationData,
      },
      unitspointLookupDs: {
        data: testCalibrationUnit,
      },
      woDetailCalibration: {
        data: testWoDetails,
      }
    },
  })();

describe("CalibrationPointsController", () => {
  describe("pageInitialized", () => {
    it("Should have page and app when arguments are provided", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints"); // TODO: select pageMock
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");
      // Act
      await ds.loadAndWaitForChildren();
      controller.pageInitialized(page, app);

      // Assert
      expect(controller.page).toEqual(page);
      expect(controller.app).toEqual(app);
    });
  });

  describe("pageResumed", () => {
    it("Should have page and app when arguments are provided", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");

      // Act
      await ds.loadAndWaitForChildren();
      await controller.pageResumed(page, app);

      // Assert
      expect(controller.page).toEqual(page);
      expect(controller.app).toEqual(app);
    });
  });

  describe("toggleAssert", () => {
    it("Should update assert error to false when assert error is true", async () => {
      // Arange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");

      // Act
      await ds.loadAndWaitForChildren();

      // Assert
      expect(controller.page.state.asserterror).toEqual(false);
      controller.toggleAssert();
      expect(controller.page.state.asserterror).toEqual(true);
      controller.toggleAssert();
      expect(controller.page.state.asserterror).toEqual(false);
    });
  });

  describe("calculateTolError", () => {
    it("Should skip calculation when output is not a number", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const item = {
        asfoundoutput: "gibberish",
        asfounderror1: null,
      };

      const controller = page.controllers[0];

      // Act
      const result = controller.calculateTolError(
        CalibrationPointConstants.CONDITION_ASFOUND,
        item,
        null,
        null
      );

      // Assert
      expect(result).toEqual(null);
    });

    it("Should skip calculation when tolerance lower value is null or no tolerance bound is provided", async () => {
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      page.state.instr = {
        tol1lowervalue: null,
        tol1uppervalue: null,
      };

      const item = {
        asfoundoutput: 1,
        asfounderror1: null,
        asfounderror2: null,
      };

      const expected = {
        asfounderror1: null,
        asfounderror2: null,
      };

      const controller = page.controllers[0];

      const calc = {
        minusZeroMakeUp: jest.fn(),
      };

      const roundingOptions = {
        places: 3,
        round: DatasheetConstants.ROUND_VALUE,
      };

      // Act
      controller.calculateTolError(
        CalibrationPointConstants.CONDITION_ASFOUND,
        item,
        calc,
        roundingOptions
      );

      // Assert
      for (let i = 1; i < 3; i++) {
        expect(item[`tol${i}error`]).toEqual(expected[`tol${i}error`]);
      }
    });

    it("Should calculate the correct tolerance error when all tolerance bounds are provided", async () => {
      // Arange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");

      page.state.instr = {
        tol1lowervalue: 2,
        tol1uppervalue: 5,
        tol2lowervalue: 0,
        tol2uppervalue: 1,
        tol3lowervalue: 5,
        tol3uppervalue: 6,
        tol4lowervalue: 2.312,
        tol4uppervalue: 3.719,
      };

      const expected = {
        asfounderror1: "0.000",
        asfounderror2: "3.000",
        asfounderror3: "-1.000",
        asfounderror4: "0.281",
      };

      const item = {
        asfoundoutput: "4.000",
        asfoundtol1lower: "2.000",
        asfoundtol1upper: "5.000",
        asfoundtol2lower: "0.000",
        asfoundtol2upper: "1.000",
        asfoundtol3lower: "5.000",
        asfoundtol3upper: "6.000",
        asfoundtol4lower: "2.312",
        asfoundtol4upper: "3.719",
        asfounderror1: null,
        asfounderror2: null,
        asfounderror3: null,
        asfounderror4: null,
      };

      const controller = page.controllers[0];

      const calc = {
        minusZeroMakeUp: jest.fn((val) => val),
      };

      const roundingOptions = {
        places: 3,
        round: DatasheetConstants.ROUND_VALUE,
      };

      // Act
      controller.calculateTolError(
        CalibrationPointConstants.CONDITION_ASFOUND,
        item,
        calc,
        roundingOptions
      );

      // Assert
      for (let i = 1; i < 5; i++) {
        // const tolerror = parseFloat((item[`tol${i}error`]).toFixed(3));
        const tolerror = item[`tol${i}error`];
        expect(tolerror).toEqual(expected[`tol${i}error`]);
      }
    });
  });

  describe("openTypeLookup", () => {
    it("Should open lookup when condition is AS FOUND", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];

      const ds = app.findDatasource("unitspointLookupDs");
      await ds.loadAndWaitForChildren();

      controller.asFoundhelper.openUnitLookup = jest.fn();

      // Act
      await controller.openTypeLookup({
        item: true,
        changeText: UnitLookupConstants.CONDITION_ASFOUNDUNIT,
      });

      // Assert
      expect(controller.asFoundhelper.openUnitLookup).toHaveBeenCalled();
    });

    it("Should open lookup when condition is AS LEFT", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];

      const ds = app.findDatasource("unitspointLookupDs");
      await ds.loadAndWaitForChildren();

      controller.asLefthelper.openUnitLookup = jest.fn();

      // Act
      await controller.openTypeLookup({
        item: true,
        changeText: UnitLookupConstants.CONDITION_ASLEFTUNIT,
      });

      // Assert
      expect(controller.asLefthelper.openUnitLookup).toHaveBeenCalled();
    });
  });

  describe("roundExceedMaxFractionDigits", () => {
    it("Should round correctly if exceed max fraction digits", async () => {
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      const noRoundValue1 = controller.roundExceedMaxFractionDigits(100);
      expect(noRoundValue1).toEqual(100);

      const noRoundValue2 = controller.roundExceedMaxFractionDigits(100.06);
      expect(noRoundValue2).toEqual(100.06);

      const noRoundValue3 = controller.roundExceedMaxFractionDigits(0.006);
      expect(noRoundValue3).toEqual(0.006);

      const noRoundValue4 = controller.roundExceedMaxFractionDigits(0.0000000001);
      expect(noRoundValue4).toEqual(0.0000000001);

      const roundedValue1 = controller.roundExceedMaxFractionDigits(100.00000000006);
      expect(roundedValue1).toEqual(100.0000000001);

      const roundedValue2 = controller.roundExceedMaxFractionDigits(100.000000565566);
      expect(roundedValue2).toEqual(100.0000005656);

    });
  });


  describe("getAssetFunctionDS", () => {
    it("Should return instance of getAssetFunctionDS", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];

      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();

      const assetfunctionDS = app.state.assetFunctionsDetailsDS;

      // Act
      const actualAssetfunctionDS = controller.getAssetFunctionDS();

      // Assert
      expect(actualAssetfunctionDS.name).toEqual(assetfunctionDS.name);
    });
  });

  describe("getCalibrationPointsDS", () => {
    it("Should return instance of getCalibrationPointsDS", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];

      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();

      const calpointsds = app.state.calpointsds;

      // Act
      const actualCalpointsds = await controller.getCalibrationPointsDS();

      // Assert
      expect(actualCalpointsds.name).toEqual(calpointsds.name);
    });
  });

  describe("getDatasheetDS", () => {
    it("Should return instance of getDatasheetDS", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];

      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();

      // Act
      const datasheetDS = controller.getDatasheetDS();

      // Assert
      expect(datasheetDS.name).toEqual(ds.name);
    });
  });

  describe("getDomainCalStatusDS", () => {
    it("Should return instance of getDomainCalStatusDS", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];

      const ds = await loadDomainCalStatusDS();

      const origFindDs = controller.app.findDatasource;
      controller.app.findDatasource = jest.fn(() => ds);

      // Act
      const domainDS = controller.getDomainCalStatusDS();

      // Assert
      expect(domainDS.name).toEqual(ds.name);

      controller.app.findDatasource = origFindDs;
    });
  });

  describe("getDsConfig", () => {
    it("Should return instance of getDsConfig", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];

      controller.dsconfig = await loadDsConfig();

      // Act
      const dsconfig = controller.getDsConfig();

      // Assert
      expect(dsconfig.name).toEqual(controller.dsconfig.name);
    });
  });

  describe("getConditionPrefix", () => {
    it("Should return condition", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];

      // controller.app.state.status = CalibrationPointConstants.CONDITION_ASFOUND;
      page.params.condition = CalibrationPointConstants.CONDITION_ASFOUND;

      // Act
      const conditionPrefix = controller.getConditionPrefix();

      // Assert
      expect(conditionPrefix).toEqual(
        CalibrationPointConstants.CONDITION_ASFOUND
      );
    });
  });

  describe("goBack", () => {
    it("Should display dialog asking to discard rules when text field change is true", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];

      controller.page.showDialog = jest.fn();
      controller.app.navigateBack = jest.fn();

      // Act
      controller.setDirty(true);
      controller.goBack();

      // Assert
      expect(controller.page.showDialog).toHaveBeenCalled();
      expect(controller.app.navigateBack).not.toHaveBeenCalled();
    });

    it("Should navigate back when no text was changed", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];

      controller.page.showDialog = jest.fn();
      controller.app.navigateBack = jest.fn();

      // Act
      controller.goBack();

      // Assert
      expect(controller.page.showDialog).not.toHaveBeenCalled();
      expect(controller.app.navigateBack).toHaveBeenCalled();
    });
  });

  describe("loadDsConfig", () => {
    it("Should load dsconfig with asset function params when asset function is available", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];

      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();

      const dsplannum = `DS${generateRandomInt()}`;
      const revisionnum = generateRandomInt();

      const pluscwodsinstr = {
        currentItem: {
          dsplannum,
          revisionnum,
        },
      };

      const origFindDs = controller.app.findDatasource;
      const dsconfigMockFn = {
        load: jest.fn(),
        resetState: jest.fn(),
        clearState: jest.fn(),
      };
      controller.app.findDatasource = jest.fn(() => dsconfigMockFn);

      // Act
      await controller.loadDsConfig(pluscwodsinstr);

      // Assert
      const call = dsconfigMockFn.load.mock.calls[0][0];

      expect(call).toEqual({ qbe: { dsplannum, revisionnum } });
      
      controller.app.findDatasource = origFindDs;
    });

    it("Should load default dsconfig when asset function is not available", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];

      const ds = app.findDatasource("pluscWoDs");
      await ds.load();

      const origFindDs = controller.app.findDatasource;
      const dsconfigMockFn = {
        load: jest.fn(),
        resetState: jest.fn(),
        clearState: jest.fn(),
      };
      controller.app.findDatasource = jest.fn(() => dsconfigMockFn);

      // Act
      await controller.loadDsConfig();

      // Assert
      expect(dsconfigMockFn.load).toHaveBeenCalled();
      expect(dsconfigMockFn.load.mock.calls[0][0]).toEqual(undefined);
      
      controller.app.findDatasource = origFindDs;
    });
  });

  describe("saveChanges", () => {
    it("Should reset text flag to false and change status", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();
      const calpointsds = app.state.calpointsds;

      const origSave = calpointsds.save;
      calpointsds.save = jest.fn();

      page.state.isdirty = true;

      // Act
      await controller.saveChanges();

      // Assert
      expect(page.state.isdirty).toEqual(false);
      expect(calpointsds.save).toHaveBeenCalled();
      expect(app.state.currentPageName).toEqual('schedule');

      calpointsds.save = origSave;
    });

    it("Should reset text flag to false and change status and remain on the calibration page", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      page.state.isCalledFromAddDeleteCalibrationPoint = true;
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();
      const calpointsds = app.state.calpointsds;

      const origSave = calpointsds.save;
      calpointsds.save = jest.fn();

      page.state.isdirty = true;

      // Act
      await controller.saveChanges();

      // Assert
      expect(page.state.isdirty).toEqual(false);
      expect(calpointsds.save).toHaveBeenCalled();
      calpointsds.save = origSave;
    });
  });

  describe("discardChanges", () => {
    it("Should redirect to asset functions page", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];

      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();
      
      controller.setDirty(true);

      // Act
      controller.discardChanges();

      // Assert
      expect(controller.isDirty()).toEqual(false);
      expect(app.state.currentPageName).toEqual('assetfunctions');
    });

    it("Should redirect to Calibration page", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      page.state.isCalledFromAddDeleteCalibrationPoint = true;
     
      const controller = page.controllers[0];
      controller.continueAddOrDeleteCalibrationPoint = jest.fn();

      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();

      controller.setDirty(true);

      // Act
      controller.discardChanges();

      // Assert
      expect(controller.isDirty()).toEqual(false);
      expect(controller.continueAddOrDeleteCalibrationPoint).toHaveBeenCalled();
    });
  });

  describe("isDirty", () => {
    it("Should return dirty state", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];

      // Act
      controller.pageInitialized(page, app);

      controller.setDirty(false);
      const before = controller.isDirty();

      controller.setDirty(true);
      const after = controller.isDirty();

      // Assert
      expect(before).toEqual(false);
      expect(after).toEqual(true);
    });
  });

  describe("setDirty", () => {
    it("Should set dirty state", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];

      // Act
      controller.pageInitialized(page, app);

      controller.setDirty(false);
      const before = controller.isDirty();

      controller.setDirty(true);
      const after = controller.isDirty();

      // Assert
      expect(before).toEqual(false);
      expect(after).toEqual(true);
    });
  });

  describe("calculateInitialStatus", () => {
    it("Should return false when pluscwodsinstr does not exist", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];

      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();

      app.state.assetFunctionsDetailsDS = null;

      // Act
      const result = await controller.calculateInitialStatus(app);

      // Assert
      expect(result).toEqual(false);
    });
  });

  describe("onCalpointValueChanged", () => {
    it("should detect change happned in input box", async () => {
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      const event = { target: { dataset: { previousValue: '' } } };

      expect(controller.isDirty()).toEqual(false);
      controller.onCalpointValueChanged(event);

      // Assert
      expect(controller.isDirty()).toEqual(true);
    });
  });

  describe("calculateCalPointTolerances", () => {
    it("Should NOT calculate tolerance error when input or output are missing", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];

      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren({ src: testDatasheetENData });

      controller.app.state.status = CalibrationPointConstants.CONDITION_ASFOUND;
      controller.calculateTolError = jest.fn();

      const item = {
        asfoundoutput: null,
        asfoundinput: "1.001",
      };

      //Act
      await controller.calculateCalPointTolerances(item);

      // Assert
      expect(controller.calculateTolError).not.toHaveBeenCalled();
    });

    it("Should calculate tolerance error when changing status", async () => {
      // Arrange
      const app = await baseSetup();
 
      const page = app.findPage("calibrationpoints");
      page.params = {
        ...page.params,
        condition: CalibrationPointConstants.CONDITION_ASFOUND
      }

      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren({ src: testDatasheetENData });

      const controller = page.controllers[0];
      controller.getLocale = jest.fn(() => LocaleConstants.EN_US);

      // Act
      const entries = [
        {
          asfoundinput: "100.00",
          asfoundoutput: "4.00",
        },
        {
          asfoundinput: "105.00",
          asfoundoutput: "4.00",
        },
        {
          asfoundinput: "105.00",
          asfoundoutput: "40.00",
        },
      ];

      const errors = [
        {
          asfounderror: false,
          asfounderror1: "0.00",
          asfounderror2: "0.00",
          asfounderror3: "0.00",
          asfounderror4: "0.00",
          asfoundouterror: "0.00",
          asfoundproerror: "0.00",
        },
        {
          asfounderror: true,
          asfounderror1: "-0.32",
          asfounderror2: "-0.24",
          asfounderror3: "-0.16",
          asfounderror4: "-0.08",
          asfoundouterror: "-0.40",
          asfoundproerror: "-5.00",
        },
        {
          asfounderror: true,
          asfounderror1: "35.51",
          asfounderror2: "35.44",
          asfounderror3: "35.36",
          asfounderror4: "35.28",
          asfoundouterror: "35.60",
          asfoundproerror: "445.00",
        },
      ];

      for (let i = 0; i < 3; i++) {
        const calpoint = {
          ...testDatasheetENData.member[0].pluscwodsinstr[0].pluscwodspoint[0],
          ...entries[i],
        };

        await controller.calculateCalPointTolerances(calpoint);

        // Assert
        expect(calpoint.asfounderror).toEqual(errors[i].asfounderror);
        expect(calpoint.asfounderror1).toEqual(errors[i].asfounderror1);
        expect(calpoint.asfounderror2).toEqual(errors[i].asfounderror2);
        expect(calpoint.asfounderror3).toEqual(errors[i].asfounderror3);
        expect(calpoint.asfounderror4).toEqual(errors[i].asfounderror4);
        expect(calpoint.asfoundouterror).toEqual(errors[i].asfoundouterror);
        expect(calpoint.asfoundproerror).toEqual(errors[i].asfoundproerror);
      }
    });
  });

  describe("validateCalPointAndCalculateTolerances", () => {
    it("verifies validateNumerical has been called.", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();

      controller.resetValidationFlags = jest.fn();
      controller.validateNumerical = jest
        .fn(() => true)
        .mockName("validateNumerical");
      controller.validateLength = jest
        .fn(() => false)
        .mockName("validateLength");
      controller.standardizeDecimal = jest.fn();
      controller.checkBounds = jest.fn();
      controller.calculateCalPointTolerances = jest.fn();

      controller.getLengthError = jest.fn(() => false);
      controller.getNumberError = jest.fn(() => false);

      const calpoint = { plantype: CalibrationPointConstants.PLANTYPE.ANALOG };
      const whichFieldTypeChanged = CalibrationPointConstants.FIELD_TYPE.INPUT;
      const event = { target: { dataset: { previousValue: '' }}};


      // Act
      controller.validateCalPointAndCalculateTolerances({ item: calpoint, whichFieldTypeChanged }, event);

      // Assert
      expect(controller.resetValidationFlags).toHaveBeenCalledWith(
        calpoint,
        whichFieldTypeChanged
      );
      expect(controller.validateNumerical).toHaveBeenCalledWith(
        calpoint,
        whichFieldTypeChanged
      );
    });

    it("verifies validateLength has been called.", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();

      controller.resetValidationFlags = jest.fn();
      controller.validateNumerical = jest
        .fn(() => false)
        .mockName("validateNumerical");
      controller.validateLength = jest
        .fn(() => true)
        .mockName("validateLength");
      controller.standardizeDecimal = jest.fn();
      controller.checkBounds = jest.fn();
      controller.calculateCalPointTolerances = jest.fn();

      controller.getLengthError = jest.fn(() => false);
      controller.getNumberError = jest.fn(() => false);

      const calpoint = { plantype: CalibrationPointConstants.PLANTYPE.ANALOG };
      const whichFieldTypeChanged = CalibrationPointConstants.FIELD_TYPE.INPUT;
      const event = { target: { dataset: { previousValue: '' }}};

      // Act
      controller.validateCalPointAndCalculateTolerances({ item: calpoint, whichFieldTypeChanged }, event);

      // Assert
      expect(controller.validateLength).toHaveBeenCalledWith(
        calpoint,
        whichFieldTypeChanged
      );
    });

    it("verifies standardizeDecimal and checkBounds have been called.", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();

      controller.resetValidationFlags = jest.fn();
      controller.validateNumerical = jest
        .fn(() => false)
        .mockName("validateNumerical");
      controller.validateLength = jest
        .fn(() => false)
        .mockName("validateLength");
      controller.standardizeDecimal = jest.fn();
      controller.checkBounds = jest.fn();
      controller.calculateCalPointTolerances = jest.fn();

      controller.getLengthError = jest.fn(() => false);
      controller.getNumberError = jest.fn(() => false);

      const calpoint = { plantype: CalibrationPointConstants.PLANTYPE.ANALOG };
      const whichFieldTypeChanged = CalibrationPointConstants.FIELD_TYPE.INPUT;
      const event = { target: { dataset: { previousValue: '' }}};

      // Act
      controller.validateCalPointAndCalculateTolerances({ item: calpoint, whichFieldTypeChanged }, event);

      // Assert
      expect(controller.standardizeDecimal).toHaveBeenCalledWith(
        calpoint,
        whichFieldTypeChanged
      );
      expect(controller.checkBounds).toHaveBeenCalledWith(
        calpoint,
        whichFieldTypeChanged
      );
    });
  });

  describe("validateNumerical", () => {
    it("should evaluate a valid number.", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      controller.getConditionPrefix = jest
        .fn()
        .mockReturnValue(CalibrationPointConstants.CONDITION_ASFOUND);
      const whichFieldTypeChanged = CalibrationPointConstants.FIELD_TYPE.INPUT;
      const fieldName = `${CalibrationPointConstants.CONDITION_ASFOUND}${whichFieldTypeChanged}`;
      const calpoint = {
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        [fieldName]: "500.00",
      };

      // Act
      const isValidationFailed = controller.validateNumerical(
        calpoint,
        whichFieldTypeChanged
      );

      // Assert
      expect(isValidationFailed).toEqual(false);
    });

    it("should evaluate a invalid number.", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      controller.getConditionPrefix = jest
        .fn()
        .mockReturnValue(CalibrationPointConstants.CONDITION_ASFOUND);
      controller.setCalPointDsWarning = jest.fn();
      controller.setNumberError = jest.fn();
      const message = "Enter a numeric value";
      const whichFieldTypeChanged = CalibrationPointConstants.FIELD_TYPE.INPUT;
      const fieldName = `${CalibrationPointConstants.CONDITION_ASFOUND}setpoint`;
      const calpoint = {
        plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
        [fieldName]: "abcd",
      };

      // Act
      const isValidationFailed = controller.validateNumerical(
        calpoint,
        whichFieldTypeChanged
      );

      // Assert
      expect(isValidationFailed).toEqual(true);
      expect(calpoint.asfoundfail).toEqual(true);
      expect(controller.setCalPointDsWarning).toHaveBeenCalledWith(
        calpoint,
        message,
        whichFieldTypeChanged
      );
      expect(controller.setCalPointDsWarning).toHaveBeenCalledWith(
        calpoint,
        message,
        whichFieldTypeChanged
      );
    });
  });

  describe("validateLength", () => {
    it("verifies input number should be of valid length.", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      controller.getConditionPrefix = jest
        .fn()
        .mockReturnValue(CalibrationPointConstants.CONDITION_ASFOUND);
      const whichFieldTypeChanged = CalibrationPointConstants.FIELD_TYPE.INPUT;
      const fieldName = `${CalibrationPointConstants.CONDITION_ASFOUND}${whichFieldTypeChanged}`;
      const calpoint = {
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        [fieldName]: "123456",
      };

      // Act
      const isValidationFailed = controller.validateLength(
        calpoint,
        whichFieldTypeChanged
      );

      // Assert
      expect(isValidationFailed).toEqual(false);
    });

    it("verifies negative input number should be of valid length.", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      controller.getConditionPrefix = jest
        .fn()
        .mockReturnValue(CalibrationPointConstants.CONDITION_ASFOUND);
      const whichFieldTypeChanged = CalibrationPointConstants.FIELD_TYPE.INPUT;
      const fieldName = `${CalibrationPointConstants.CONDITION_ASFOUND}${whichFieldTypeChanged}`;
      const calpoint = {
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        [fieldName]: "-123456789012345",
      };

      // Act
      const isValidationFailed = controller.validateLength(
        calpoint,
        whichFieldTypeChanged
      );

      // Assert
      expect(isValidationFailed).toEqual(false);
    });

    it("should raise an error that Entered number is too long.", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      controller.getConditionPrefix = jest
        .fn()
        .mockReturnValue(CalibrationPointConstants.CONDITION_ASFOUND);
      controller.setCalPointDsWarning = jest.fn();
      controller.setNumberError = jest.fn();
      const message = "Entered number is too long";
      const whichFieldTypeChanged = CalibrationPointConstants.FIELD_TYPE.INPUT;
      const fieldName = `${CalibrationPointConstants.CONDITION_ASFOUND}setpoint`;
      const calpoint = {
        plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
        [fieldName]: "1234567890123456",
      };

      // Act
      const isValidationFailed = controller.validateLength(
        calpoint,
        whichFieldTypeChanged
      );

      // Assert
      expect(isValidationFailed).toEqual(true);
      expect(calpoint.asfoundfail).toEqual(true);
      expect(controller.setCalPointDsWarning).toHaveBeenCalledWith(
        calpoint,
        message,
        whichFieldTypeChanged
      );
      expect(controller.setCalPointDsWarning).toHaveBeenCalledWith(
        calpoint,
        message,
        whichFieldTypeChanged
      );
    });
  });

  describe("standardizeDecimal", () => {
    it("formats input value as per defined configuration.", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const whichFieldTypeChanged = CalibrationPointConstants.FIELD_TYPE.INPUT;
      page.state.inputprecision = 4;
      const controller = page.controllers[0];
      const fieldName = `${CalibrationPointConstants.CONDITION_ASFOUND}${whichFieldTypeChanged}`;
      controller.getModifiedFieldName = jest.fn().mockReturnValue(fieldName);
      const calpoint = {
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        [fieldName]: "123456",
      };

      // Act
      controller.standardizeDecimal(calpoint, whichFieldTypeChanged);

      // Assert
      expect(calpoint[fieldName]).toEqual("123456.0000");
    });
    it("should remove commas from formatted number.", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const whichFieldTypeChanged = CalibrationPointConstants.FIELD_TYPE.INPUT;
      page.state.inputprecision = 4;
      const controller = page.controllers[0];
      const fieldName = `${CalibrationPointConstants.CONDITION_ASFOUND}${whichFieldTypeChanged}`;
      controller.getModifiedFieldName = jest.fn().mockReturnValue(fieldName);
      const calpoint = {
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        [fieldName]: "11,23,456",
      };

      // Act
      controller.standardizeDecimal(calpoint, whichFieldTypeChanged);

      // Assert
      expect(calpoint[fieldName]).toEqual("1123456.0000");
    });
  });

  describe("checkBounds", () => {
    it("should check user input is within the upper and lower bounds of the instrument.", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const whichFieldTypeChanged = CalibrationPointConstants.FIELD_TYPE.INPUT;
      const controller = page.controllers[0];
      const selectedAssetFn = {
        cliplimitsin: true,
        instrcalrangefrom: 25,
        instrcalrangeto: 100,
        instroutrangefrom: 2,
        instroutrangeto: 20,
      };
      controller.getAssetFunctionDS = jest
        .fn()
        .mockReturnValue({ currentItem: selectedAssetFn });
      controller.getConditionPrefix = jest
        .fn()
        .mockReturnValue(CalibrationPointConstants.CONDITION_ASFOUND);
      controller.setCalPointDsWarning = jest.fn();
      controller.setInputError = jest.fn();
      const fieldName = `${CalibrationPointConstants.CONDITION_ASFOUND}${whichFieldTypeChanged}`;
      controller.getModifiedFieldName = jest.fn().mockReturnValue(fieldName);
      const calpoint = {
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        [fieldName]: "45",
        pluscwodspointid: 125,
      };

      controller.getLengthError = jest.fn(() => false);
      controller.getNumberError = jest.fn(() => false);

      // Act
      controller.checkBounds(calpoint, whichFieldTypeChanged);

      // Assert
      expect(calpoint.asfoundfail).toBeFalsy();
      expect(page.state.message).toBeFalsy();
      expect(controller.setCalPointDsWarning).not.toHaveBeenCalled();
      expect(controller.setInputError).not.toHaveBeenCalled();
    });

    it("should check user input is outside the upper and lower bounds of the instrument.", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const whichFieldTypeChanged = CalibrationPointConstants.FIELD_TYPE.INPUT;
      const controller = page.controllers[0];
      const selectedAssetFn = {
        cliplimitsin: true,
        instrcalrangefrom: 25,
        instrcalrangeto: 100,
        instroutrangefrom: 2,
        instroutrangeto: 20,
      };
      controller.getAssetFunctionDS = jest
        .fn()
        .mockReturnValue({ currentItem: selectedAssetFn });
      controller.getConditionPrefix = jest
        .fn()
        .mockReturnValue(CalibrationPointConstants.CONDITION_ASFOUND);
      controller.setCalPointDsWarning = jest.fn();
      controller.setInputError = jest.fn();
      const message =
        "The As Found input 126 is outside the range of 25 to 100.";
      const fieldName = `${CalibrationPointConstants.CONDITION_ASFOUND}${whichFieldTypeChanged}`;
      controller.getModifiedFieldName = jest.fn().mockReturnValue(fieldName);
      const calpoint = {
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        [fieldName]: "126",
        pluscwodspointid: 125,
      };

      // Act
      controller.checkBounds(calpoint, whichFieldTypeChanged);

      // Assert
      expect(calpoint.asfoundfail).toEqual(true);
      expect(page.state.message).toEqual(message);
      expect(controller.setCalPointDsWarning).toHaveBeenCalledWith(
        calpoint,
        message,
        whichFieldTypeChanged
      );
      expect(controller.setInputError).toHaveBeenCalledWith(
        calpoint.pluscwodspointid,
        whichFieldTypeChanged,
        true
      );
    });

    it("should check user input is outside the upper and lower bounds of the instrument with cliplmits instruction.", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const whichFieldTypeChanged = CalibrationPointConstants.FIELD_TYPE.INPUT;
      const controller = page.controllers[0];
      const selectedAssetFn = {
        cliplimitsin: false,
        instrcalrangefrom: 25,
        instrcalrangeto: 100,
        instroutrangefrom: 2,
        instroutrangeto: 20,
      };
      controller.getAssetFunctionDS = jest
        .fn()
        .mockReturnValue({ currentItem: selectedAssetFn });
      controller.getConditionPrefix = jest
        .fn()
        .mockReturnValue(CalibrationPointConstants.CONDITION_ASFOUND);
      controller.setCalPointDsWarning = jest.fn();
      controller.setInputError = jest.fn();
      const message =
        "The As Found input 102 is outside the range of 24 to 101.";
      const fieldName = `${CalibrationPointConstants.CONDITION_ASFOUND}${whichFieldTypeChanged}`;
      controller.getModifiedFieldName = jest.fn().mockReturnValue(fieldName);
      const calpoint = {
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        [fieldName]: "102",
        ron1lower: 24,
        ron1upper: 101,
        pluscwodspointid: 125,
      };

      // Act
      controller.checkBounds(calpoint, whichFieldTypeChanged);

      // Assert
      expect(calpoint.asfoundfail).toEqual(true);
      expect(page.state.message).toEqual(message);
      expect(controller.setCalPointDsWarning).toHaveBeenCalledWith(
        calpoint,
        message,
        whichFieldTypeChanged
      );
      expect(controller.setInputError).toHaveBeenCalledWith(
        calpoint.pluscwodspointid,
        whichFieldTypeChanged,
        true
      );
    });

    it("should swap ronupper and ronlower value if range is not defined properly.", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const whichFieldTypeChanged = CalibrationPointConstants.FIELD_TYPE.INPUT;
      const controller = page.controllers[0];
      const selectedAssetFn = {
        cliplimitsin: false,
        instrcalrangefrom: 25,
        instrcalrangeto: 100,
        instroutrangefrom: 2,
        instroutrangeto: 20,
      };
      controller.getAssetFunctionDS = jest
        .fn()
        .mockReturnValue({ currentItem: selectedAssetFn });
      controller.getConditionPrefix = jest
        .fn()
        .mockReturnValue(CalibrationPointConstants.CONDITION_ASFOUND);
      controller.setCalPointDsWarning = jest.fn();
      controller.setInputError = jest.fn();
      const message =
        "The As Found input 23 is outside the range of 101 to 24.";
      const fieldName = `${CalibrationPointConstants.CONDITION_ASFOUND}${whichFieldTypeChanged}`;
      controller.getModifiedFieldName = jest.fn().mockReturnValue(fieldName);
      const calpoint = {
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        [fieldName]: "23",
        ron1lower: 101,
        ron1upper: 24,
        pluscwodspointid: 125,
      };

      // Act
      controller.checkBounds(calpoint, whichFieldTypeChanged);

      // Assert
      expect(calpoint.asfoundfail).toEqual(true);
      expect(page.state.message).toEqual(message);
      expect(controller.setCalPointDsWarning).toHaveBeenCalledWith(
        calpoint,
        message,
        whichFieldTypeChanged
      );
      expect(controller.setInputError).toHaveBeenCalledWith(
        calpoint.pluscwodspointid,
        whichFieldTypeChanged,
        true
      );
    });
  });

  describe('isDataValid method', () => {
    
    it('should return false when no errors exist', async ()  => {
      // Test case where no errors exist for the given point IDs
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      const calpoint = { plantype: CalibrationPointConstants.PLANTYPE.ANALOG, ron1lower: 24,  ron1upper: 101, pluscwodspointid: 125 };
      
      const result = controller.isDataValid(calpoint);
      expect(result).toBe(false);
    });
  
    it('should return true when there is a number error for input',async () => {
      // Mock the state to show a number error for the input point
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      const calpoint = { plantype: CalibrationPointConstants.PLANTYPE.ANALOG, ron1lower: 24,  ron1upper: 101, pluscwodspointid: 125 };
      
      page.state.shownumbererror[`${calpoint.pluscwodspointid}-input`] = true;
  
      const result = controller.isDataValid(calpoint);
      expect(result).toBe(true);
    });
  
    it('should return true when there is a length error for output', async () => {
      // Mock the state to show a length error for the output point
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      const calpoint = { plantype: CalibrationPointConstants.PLANTYPE.ANALOG, ron1lower: 24,  ron1upper: 101, pluscwodspointid: 125 };
      
      page.state.showlengtherror[`${calpoint.pluscwodspointid}-output`] = true;
  
      const result = controller.isDataValid(calpoint);
      expect(result).toBe(true);
    });
  
    it('should return true when there is an input error for input point', async () => {
      // Mock the state to show an input error for the input point
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      const calpoint = { plantype: CalibrationPointConstants.PLANTYPE.ANALOG, ron1lower: 24,  ron1upper: 101, pluscwodspointid: 125 };
      
      page.state.showerror[`${calpoint.pluscwodspointid}-input`] = true;
  
      const result = controller.isDataValid(calpoint);
      expect(result).toBe(true);
    });
  
    it('should return true when there is an error for either input or output point', async () => {

      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      const calpoint = { plantype: CalibrationPointConstants.PLANTYPE.ANALOG, ron1lower: 24,  ron1upper: 101, pluscwodspointid: 125 };
      
      // Mock a number error for the input point and a length error for the output point
      page.state.shownumbererror[`${calpoint.pluscwodspointid}-input`] = true;
      page.state.showlengtherror[`${calpoint.pluscwodspointid}-output`] = true;
  
      const result = controller.isDataValid(calpoint);
      expect(result).toBe(true);
    });
  
    it('should return false when errors for both input and output are absent', async () => {
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      const calpoint = { plantype: CalibrationPointConstants.PLANTYPE.ANALOG, ron1lower: 24,  ron1upper: 101, pluscwodspointid: 125 };
      
      // Mock the state to show no errors
      page.state.shownumbererror[`${calpoint.pluscwodspointid}-input`] = false;
      page.state.showlengtherror[`${calpoint.pluscwodspointid}-output`] = false;
      page.state.showerror[`${calpoint.pluscwodspointid}-input`] = false;
      page.state.showerror[`${calpoint.pluscwodspointid}-output`] = false;
  
      const result = controller.isDataValid(calpoint);
      expect(result).toBe(false);
    });
  
    it('should handle when input has missing pluscwodspointid', async () => {
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      const calpoint = { plantype: CalibrationPointConstants.PLANTYPE.ANALOG, ron1lower: 24,  ron1upper: 101, pluscwodspointid: 125 };
      
      // Test when input.pluscwodspointid is missing or undefined
      calpoint.pluscwodspointid = undefined;
      const result = controller.isDataValid(calpoint);
      expect(result).toBe(false); // Should return false if there's no valid point ID
    });
  
  });

  describe("funcCheckToggle", () => {
    it("Should update status to PASS when condition is valid", async () => {
      CalibrationPointConstants.PREFIXES.forEach(async (condition) => {
        // Arrange
        const app = await baseSetup();
        const page = app.findPage("calibrationpoints");
        const controller = page.controllers.pop();

        const item = {
          [`${condition}pass`]: false,
          [`${condition}fail`]: true,
        };

        const args = {
          condition,
          item: item,
          event: {
            id: `${condition}pass`,
          },
        };

        // Act
        const result = controller.funcCheckToggle(args);

        // Assert
        expect(result).toEqual(true);
        expect(args.item[`${condition}pass`]).toEqual(true);
        expect(args.item[`${condition}fail`]).toEqual(false);
      });
    });

    it("Should update status to FAIL when condition is valid", async () => {
      CalibrationPointConstants.PREFIXES.forEach(async (condition) => {
        // Arrange
        const app = await baseSetup();
        const page = app.findPage("calibrationpoints");
        const controller = page.controllers.pop();

        const item = {
          [`${condition}pass`]: true,
          [`${condition}fail`]: false,
        };
        const args = {
          condition,
          item: item,
          event: { id: `${condition}fail` },
        };

        // Act
        const result = controller.funcCheckToggle(args);

        // Assert
        expect(result).toEqual(true);
        expect(args.item[`${condition}pass`]).toEqual(false);
        expect(args.item[`${condition}fail`]).toEqual(true);
      });
    });

    it("Should return false when condition is not valid", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers.pop();

      const item = {
        asfoundpass: true,
        asfoundfail: false,
      };
      const args = {
        item: item,
        condition: "gibberish",
        evt: { id: "asfoundpass" },
      };

      // Act
      const result = controller.funcCheckToggle(args);

      // Assert
      expect(result).toEqual(false);
      expect(args.item.asfoundpass).toEqual(true);
      expect(args.item.asfoundfail).toEqual(false);
    });
  });

  describe("setNumberError", () => {
    it("Should correctly update error ", async () => {
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");

      // Act
      await ds.loadAndWaitForChildren();

      controller.pageInitialized(page, app);
      controller.pageResumed(page, app);

      const value = true;
      const pointId = 1;
      const whichFieldTypeChanged = "input";
      const ID = "" + pointId + "-" + whichFieldTypeChanged;

      controller.setNumberError(pointId, whichFieldTypeChanged, value);

      expect(controller.page.state.shownumbererror[ID]).toEqual(true);

      controller.setNumberError(pointId, whichFieldTypeChanged, false);

      expect(controller.page.state.shownumbererror[ID]).toEqual(undefined);
    });
  });

  describe("getNumberError", () => {
    it("Should correctly update error ", async () => {
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");

      // Act
      await ds.loadAndWaitForChildren();

      controller.pageInitialized(page, app);
      controller.pageResumed(page, app);

      const value = true;
      const pointId = 1;
      const whichFieldTypeChanged = "input";

      controller.setNumberError(pointId, whichFieldTypeChanged, value);

      expect(controller.getNumberError()).toEqual(true);

      controller.setNumberError(pointId, whichFieldTypeChanged, false);

      expect(controller.getNumberError()).toEqual(false);
    });
  });

  describe("setLengthError", () => {
    it("Should correctly update error ", async () => {
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");

      // Act
      await ds.loadAndWaitForChildren();

      controller.pageInitialized(page, app);
      controller.pageResumed(page, app);

      const value = true;
      const pointId = 1;
      const whichFieldTypeChanged = "input";
      const ID = "" + pointId + "-" + whichFieldTypeChanged;

      controller.setLengthError(pointId, whichFieldTypeChanged, value);

      expect(controller.page.state.showlengtherror[ID]).toEqual(true);

      controller.setLengthError(pointId, whichFieldTypeChanged, false);

      expect(controller.page.state.showlengtherror[ID]).toEqual(undefined);
    });
  });

  describe("getLengthError", () => {
    it("Should correctly update error ", async () => {
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");

      // Act
      await ds.loadAndWaitForChildren();

      controller.pageInitialized(page, app);
      controller.pageResumed(page, app);

      const value = true;
      const pointId = 1;
      const whichFieldTypeChanged = "input";

      controller.setLengthError(pointId, whichFieldTypeChanged, value);

      expect(controller.getLengthError()).toEqual(true);

      controller.setLengthError(pointId, whichFieldTypeChanged, false);

      expect(controller.getLengthError()).toEqual(false);
    });
  });

  describe("setInputError", () => {
    it("Should correctly update error ", async () => {
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");

      // Act
      await ds.loadAndWaitForChildren();

      controller.pageInitialized(page, app);
      controller.pageResumed(page, app);

      const value = true;
      const pointId = 1;
      const whichFieldTypeChanged = "input";
      const ID = "" + pointId + "-" + whichFieldTypeChanged;

      controller.setInputError(pointId, whichFieldTypeChanged, value);

      expect(controller.page.state.showerror[ID]).toEqual(true);

      controller.setInputError(pointId, whichFieldTypeChanged, false);

      expect(controller.page.state.showerror[ID]).toEqual(undefined);
    });
  });

  describe("getInputError", () => {
    it("Should correctly update error ", async () => {
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");

      // Act
      await ds.loadAndWaitForChildren();

      controller.pageInitialized(page, app);
      controller.pageResumed(page, app);

      const value = true;
      const pointId = 1;
      const whichFieldTypeChanged = "input";

      controller.setInputError(pointId, whichFieldTypeChanged, value);

      expect(controller.getInputError()).toEqual(true);

      controller.setInputError(pointId, whichFieldTypeChanged, false);

      expect(controller.getInputError()).toEqual(false);
    });
  });

  describe("getModifiedFieldName", () => {
    it("Should correctly return field name when plantype is analog", async () => {
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];

      controller.pageInitialized(page, app);
      controller.page.params.condition =
        CalibrationPointConstants.CONDITION_ASFOUND;

      const whichFieldTypeChanged = "input";
      const plantype = "ANALOG";

      const fieldName = controller.getModifiedFieldName(
        plantype,
        whichFieldTypeChanged
      );

      expect(fieldName).toEqual("asfoundinput");
    });

    it("Should correctly return field name when plantype is analog", async () => {
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];

      controller.pageInitialized(page, app);
      controller.page.params.condition =
        CalibrationPointConstants.CONDITION_ASFOUND;

      const whichFieldTypeChanged = "input";
      const plantype = "DISCRETE";

      const fieldName = controller.getModifiedFieldName(
        plantype,
        whichFieldTypeChanged
      );

      expect(fieldName).toEqual("asfoundsetpoint");
    });
  });

  describe("resetValidationFlags", () => {
    it("Should correctly reset all flags when Input and Output values are not exceeded ", async () => {
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];

      controller.pageInitialized(page, app);
      controller.page.params.condition =
        CalibrationPointConstants.CONDITION_ASFOUND;

      const whichFieldTypeChanged = "input";
      const pointId = 1;
      const value = true;
      const input = {
        pluscwodspointid: 1,
        isCalibrationInputValueExceeded: false,
        isCalibrationOutputValueExceeded: false,
        asfoundfail: true,
      };

      controller.setInputError(pointId, whichFieldTypeChanged, value);
      controller.setLengthError(pointId, whichFieldTypeChanged, value);
      controller.setNumberError(pointId, whichFieldTypeChanged, value);

      expect(controller.getInputError()).toEqual(true);
      expect(controller.getLengthError()).toEqual(true);
      expect(controller.getNumberError()).toEqual(true);

      controller.resetValidationFlags(input, whichFieldTypeChanged);

      expect(controller.getInputError()).toEqual(false);
      expect(controller.getLengthError()).toEqual(false);
      expect(controller.getNumberError()).toEqual(false);
      expect(input["asfoundfail"]).toEqual(false);
    });

    it("Should correctly reset flags when Input and Output values are exceeded ", async () => {
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];

      controller.pageInitialized(page, app);

      const whichFieldTypeChanged = "input";
      const pointId = 1;
      const value = true;
      const input = {
        pluscwodspointid: 1,
        isCalibrationInputValueExceeded: true,
        isCalibrationOutputValueExceeded: true,
      };

      controller.setInputError(pointId, whichFieldTypeChanged, value);
      controller.setLengthError(pointId, whichFieldTypeChanged, value);
      controller.setNumberError(pointId, whichFieldTypeChanged, value);

      expect(controller.getInputError()).toEqual(true);
      expect(controller.getLengthError()).toEqual(true);
      expect(controller.getNumberError()).toEqual(true);

      controller.resetValidationFlags(input, whichFieldTypeChanged);

      expect(controller.getInputError()).toEqual(false);
      expect(controller.getLengthError()).toEqual(false);
      expect(controller.getNumberError()).toEqual(false);
    });
  });

  describe("danishLocale", () => {
    describe("calculateCalPointTolerances", () => {
      it("shouldCalculateToleranceErrorsWhenLocaleUsesCommaAsDecimalSeparator", async () => {
        // Arrange
        const app = await baseSetup();
        const page = app.findPage("calibrationpoints");
        page.params = {
          ...page.params,
          condition: CalibrationPointConstants.CONDITION_ASFOUND
        }
  
        const ds = app.findDatasource("pluscWoDs");
        await ds.loadAndWaitForChildren({ src: testDatasheetDaData });

        // Arrange controller mocks
        const controller = page.controllers[0];
        controller.getLocale = jest.fn(() => LocaleConstants.DA_DK);

        // Act
        const entries = [
          {
            asfoundinput: "100,00",
            asfoundoutput: "4,00",
          },
          {
            asfoundinput: "105,00",
            asfoundoutput: "4,00",
          },
          {
            asfoundinput: "105,00",
            asfoundoutput: "40,00",
          },
        ];

        const errors = [
          {
            asfounderror: false,
            asfounderror1: "0,00",
            asfounderror2: "0,00",
            asfounderror3: "0,00",
            asfounderror4: "0,00",
            asfoundouterror: "0,00",
            asfoundproerror: "0,00",
          },
          {
            asfounderror: true,
            asfounderror1: "-0,32",
            asfounderror2: "-0,24",
            asfounderror3: "-0,16",
            asfounderror4: "-0,08",
            asfoundouterror: "-0,40",
            asfoundproerror: "-5,00",
          },
          {
            asfounderror: true,
            asfounderror1: "35,51",
            asfounderror2: "35,44",
            asfounderror3: "35,36",
            asfounderror4: "35,28",
            asfoundouterror: "35,60",
            asfoundproerror: "445,00",
          },
        ];

        for (let i = 0; i < 3; i++) {
          const calpoint = {
            ...testDatasheetDaData.member[0].pluscwodsinstr[0]
              .pluscwodspoint[0],
            ...entries[i],
          };

          await controller.calculateCalPointTolerances(calpoint);

          // Assert
          expect(calpoint.asfounderror).toEqual(errors[i].asfounderror);
          expect(calpoint.asfounderror1).toEqual(errors[i].asfounderror1);
          expect(calpoint.asfounderror2).toEqual(errors[i].asfounderror2);
          expect(calpoint.asfounderror3).toEqual(errors[i].asfounderror3);
          expect(calpoint.asfounderror4).toEqual(errors[i].asfounderror4);
          expect(calpoint.asfoundouterror).toEqual(errors[i].asfoundouterror);
          expect(calpoint.asfoundproerror).toEqual(errors[i].asfoundproerror);
        }
      });
    });
  });

  describe('showWarningOnDatasheetChanges', () => {
    it('should set showWarningOnInputChange to true if field is in INPUT_FIELDS', async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      page.state.calPointFlag = true;
      const controller = page.controllers[0];
      controller.isWarningShownOnDatasheetChanges = true;
      const calpoint = { asfoundinput: '90.0' };

      const field = 'asfoundinput';
      const prevValue = '80.0';
      
      // Act
      controller.showWarningOnDatasheetChanges(calpoint, field, prevValue);
      
      // Assert
      expect(calpoint.showWarningOnInputChange).toBe(true);
    });

    it('should set showWarningOnOutputChange to true if field is in OUTPUT_FIELDS', async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      page.state.calPointFlag = true;
      const controller = page.controllers[0];
      controller.isWarningShownOnDatasheetChanges = true;
      const calpoint = { asfoundoutput: '5.0' };

      const field = 'asfoundoutput';
      const prevValue = '4.0';
      
      // Act
      controller.showWarningOnDatasheetChanges(calpoint, field, prevValue);
      
      // Assert
      expect(calpoint.showWarningOnOutputChange).toBe(true);
    });

    it('should not set showWarningOnInputChange or showWarningOnOutputChange if isWarningShownOnDatasheetChanges is false', async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      page.state.isWarningShownOnDatasheetChanges = false;
      page.state.calPointFlag = true;
      const controller = page.controllers[0];
      const calpoint = { asfoundinput: '90.0' };

      const field = 'asfoundinput';
      const prevValue = '80.0';
      
      // Act
      controller.showWarningOnDatasheetChanges(calpoint, field, prevValue);
      
      // Assert
      expect(calpoint.showWarningOnInputChange).toBeUndefined();
      expect(calpoint.showWarningOnOutputChange).toBeUndefined();
    });

    it('should not set showWarningOnInputChange or showWarningOnOutputChange if calPointFlag is false', async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      page.state.calPointFlag = false;
      const controller = page.controllers[0];
      controller.isWarningShownOnDatasheetChanges = true;
      const calpoint = { asfoundinput: '90.0' };

      const field = 'asfoundinput';
      const prevValue = '80.0';
      
      // Act
      controller.showWarningOnDatasheetChanges(calpoint, field, prevValue);
      
      // Assert
      expect(calpoint.showWarningOnInputChange).toBeUndefined();
      expect(calpoint.showWarningOnOutputChange).toBeUndefined();
    });

    it('should not set showWarningOnInputChange or showWarningOnOutputChange if prevValue and currentValue of field are same', async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      page.state.calPointFlag = true;
      const controller = page.controllers[0];
      controller.isWarningShownOnDatasheetChanges = true;
      const calpoint = { asfoundsetpoint: '80.0' };

      const field = 'asfoundsetpoint';
      const prevValue = '80.0';
      
      // Act
      controller.showWarningOnDatasheetChanges(calpoint, field, prevValue);
      
      // Assert
      expect(calpoint.showWarningOnInputChange).toBeUndefined();
      expect(calpoint.showWarningOnOutputChange).toBeUndefined();
    });
    
    it('should not set showWarningOnInputChange or showWarningOnOutputChange if prevValue is empty', async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      page.state.calPointFlag = true;
      const controller = page.controllers[0];
      controller.isWarningShownOnDatasheetChanges = true;
      const calpoint = { asfoundoutput: '4.0' };

      const field = 'asfoundoutput';
      const prevValue = '';
      
      // Act
      controller.showWarningOnDatasheetChanges(calpoint, field, prevValue);
      
      // Assert
      expect(calpoint.showWarningOnInputChange).toBeUndefined();
      expect(calpoint.showWarningOnOutputChange).toBeUndefined();
    });
    
    it('should not set showWarningOnInputChange or showWarningOnOutputChange if field is not in INPUT_FIELDS or OUTPUT_FIELDS', async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      page.state.calPointFlag = true;
      const controller = page.controllers[0];
      controller.isWarningShownOnDatasheetChanges = true;
      const calpoint = { asfoundoutput: '4.0' };

      const field = 'dummyfield';
      const prevValue = '3.0';
      
      // Act
      controller.showWarningOnDatasheetChanges(calpoint, field, prevValue);
      
      // Assert
      expect(calpoint.showWarningOnInputChange).toBeUndefined();
      expect(calpoint.showWarningOnOutputChange).toBeUndefined();
    });
  });

  describe('isToleranceWarningShownOnSave', () => {
    it('should show tolerance warning if any tolerance error found on calibration point.', async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      controller.getCalibrationPointsDS = jest.fn(() => ({
        items: [{
          asfounderror1: "0",
          asfounderror2: "0",
          asfounderror3: "0",
          asfounderror4: "1",
        }],
        addNew: jest.fn()
      }));
      controller.getConditionPrefix = jest.fn(() => 'asfound');
      controller.getLocale = jest.fn(() => LocaleConstants.EN_US);
      controller.pluscTolWarnValue = DatasheetConstants.VALIDATE_TOLERANCE_ONCE_PER_SAVE;
      
      // Act
      const isToleranceWarningShown = controller.isToleranceWarningShownOnSave();
      
      // Assert
      expect(isToleranceWarningShown).toBe(true);
    });

    it('should not show tolerance warning if all tolerance errors are zero.', async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      controller.getCalibrationPointsDS = jest.fn(() => ({
        items: [{
          asfounderror1: "0",
          asfounderror2: "0",
          asfounderror3: "0",
          asfounderror4: "0",

        }],
        addNew: jest.fn()
      }));
      controller.getConditionPrefix = jest.fn(() => 'asfound');
      controller.getLocale = jest.fn(() => LocaleConstants.EN_US);
      controller.pluscTolWarnValue = DatasheetConstants.VALIDATE_TOLERANCE_ONCE_PER_SAVE;
      
      
      // Act
      const isToleranceWarningShown = controller.isToleranceWarningShownOnSave();
      
      // Assert
      expect(isToleranceWarningShown).toBe(false);
    });

    it('should not show tolerance warning if pluscTolWarnValue is not set to zero', async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      controller.getCalibrationPointsDS = jest.fn(() => ({
        items: [{
          asfounderror1: "1",
          asfounderror2: "0",
          asfounderror3: "0",
          asfounderror4: "0",

        }],
        addNew: jest.fn()
      }));
      controller.getConditionPrefix = jest.fn(() => 'asfound');
      controller.getLocale = jest.fn(() => LocaleConstants.EN_US);
      controller.pluscTolWarnValue = DatasheetConstants.NEVER_VALIDATE_TOLERANCE;
      
      
      // Act
      const isToleranceWarningShown = controller.isToleranceWarningShownOnSave();
      
      // Assert
      expect(isToleranceWarningShown).toBe(false);
    });

  });

  describe('isToleranceWarningShownOnTabOut', () => {
    it('should show tolerance warning if pluscTolWarnValue is set to validate tolerance of tab out.', async () => {
       // Arrange
       const app = await baseSetup();
       const page = app.findPage("calibrationpoints");
       const controller = page.controllers[0];
       controller.pluscTolWarnValue = DatasheetConstants.VALIDATE_TOLERANCE_ON_TAB_OUT;
       const error = true;
       
       // Act
       const isToleranceWarningShown = controller.isToleranceWarningShownOnTabOut(error);
       
       // Assert
       expect(isToleranceWarningShown).toBe(true);
    });
    it('should not show tolerance warning if error is set to false.', async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      controller.pluscTolWarnValue = DatasheetConstants.VALIDATE_TOLERANCE_ON_TAB_OUT;
      const error = false;
      
      // Act
      const isToleranceWarningShown = controller.isToleranceWarningShownOnTabOut(error);
      
      // Assert
      expect(isToleranceWarningShown).toBe(false);
    });
  });

  // Assuming the method `getLocaleNumber` belongs to a class MyClass
  // You might need to import or require necessary modules if needed.
  
  describe('getLocaleNumber', () => {
    it('should call toDisplayableValue with input precision when whichfieldtype is "input"',async () => {
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      // Arrange
      const itemValue = '10,123.456';
      const whichfieldtype = 'input';
  
      controller.page = {
        state: {
          inputprecision: 2, // Example precision for input
          outputprecision: 3, // Example precision for output
        }
      };
  
      // Mock `getLocale` and `toDisplayableValue` before each test
      controller.getLocale = jest.fn();
  
      const value = toDisplayableValue(10123.456,
        { places: 2 },
        'en-US'
      );
  
      controller.getLocale.mockReturnValue('en-US'); // Mock locale return value
  
      // Act
      controller.getLocaleNumber(itemValue, whichfieldtype);
  
      // Assert
      expect(value).toEqual("10123.456");
    });
  
    it('should call toDisplayableValue with output precision when whichfieldtype is "output"',async () => {
      const app = await baseSetup();
      const page = app.findPage("calibrationpoints");
      const controller = page.controllers[0];
      // Arrange
      const itemValue = 123.456;
      const whichfieldtype = 'output';
  
      // Mock `getLocale` and `toDisplayableValue` before each test
      controller.getLocale = jest.fn();
  
      const value = toDisplayableValue(itemValue,
        { places: 2 },
        'da-DK'
      );
  
      controller.getLocale.mockReturnValue('da-DK');
  
      // Act
      controller.getLocaleNumber(itemValue, whichfieldtype);
  
      // Assert
      expect(value).toEqual("123,456");
    });
  });

  describe("validateAndLaunchInsertPointDialog", () => {
    let app;
    let page;
    let controller;
    beforeAll(async () => {
      app = await baseSetup();
      page = app.findPage("calibrationpoints");
      controller = page.controllers[0];
    });

    beforeEach(() => {
      jest.spyOn(app, "toast").mockImplementation(() => { });
      app.client = {
        userInfo: {
          personid: "SAM",
          defaultSite: "BEDFORD",
          insertOrg: "EAGLENA",
        },
      };
      const wPEditSettingDS = {
        items: [{
          orgid: "EAGLENA",
          status: "APPR",
          plusceditpoint: true,
        }],
      };

      // Mock the findDatasource method to return our mock resource
      jest.spyOn(app, "findDatasource").mockImplementation(() => {
        return wPEditSettingDS;
      });

      controller.getAssetFunctionDS = jest.fn().mockReturnValue({ currentItem: { allowpointinserts: true } });
      
      app.state.workOrderStatus = "APPR";
      app.state.datasheetWonum = "1470";
    });

    it("should show error toast if asset function does not support adding calibration points", async () => {
  
      controller.page.showDialog = jest.fn();
      const selectedAssetFn = {
        allowpointinserts: false,
      };
      controller.getAssetFunctionDS = jest.fn().mockReturnValue({ currentItem: selectedAssetFn });

      controller.validateAndLaunchInsertPointDialog();

      // Assert that toast is shown with the correct message
      expect(app.toast).toHaveBeenCalledWith(
        "BMXAR0004E - The Asset Function does not support adding calibration points.",
        "error", "", "", "", false
      );
      expect(controller.page.showDialog).not.toHaveBeenCalledWith("addCalPoint"); // Dialog should not be shown
    });

    it("should show error toast if adding/removing calibration points is not enabled for the work order", async () => {
      const wPEditSettingDS = {
        items: [
          {
            orgid: "EAGLENA",
            status: "APPR",
            plusceditpoint: false,
          },
        ],
      };
      // Mock the findDatasource method to return our mock resource
      jest.spyOn(app, "findDatasource").mockImplementation(() => {
        return wPEditSettingDS;
      });

      controller.page.showDialog = jest.fn();

      controller.validateAndLaunchInsertPointDialog();

      // Assert that toast is shown with the correct message
      expect(app.toast).toHaveBeenCalledWith(
        `BMXAR0011E - Adding or Removing Calibration Points is not enabled for work order ${app.state.datasheetWonum} which has a status of ${app.state.workOrderStatus}.`,
        "error", "", "", "", false
      );
      expect(controller.page.showDialog).not.toHaveBeenCalled(); // Dialog should not be shown
    });

    it("should launch the dialog if all conditions are met", async () => {
      const addNewMock = jest.fn();
      const showDialogMock = jest.fn();
      controller.getCalibrationPointsDS = jest.fn(() => ({
        items: [{
          asfounderror1: "0",
          asfounderror2: "0",
          asfounderror3: "0",
          asfounderror4: "1",
        }],
        addNew: addNewMock
      }));

      controller.page.showDialog = showDialogMock;
      controller.isDirty = jest.fn().mockReturnValue(false);

      await controller.validateAndLaunchInsertPointDialog({ isDeleting: false });

      expect(addNewMock).toHaveBeenCalled();
      expect(showDialogMock).toHaveBeenCalledWith("addCalPoint");
      expect(app.toast).not.toHaveBeenCalled();
    });

    it("should show error toast if the organization ID does not match", async () => {
      
      app.client.userInfo.insertOrg = "EAGLESA";
      controller.page.showDialog = jest.fn();
      controller.validateAndLaunchInsertPointDialog();

      // Assert that toast is shown with the correct message
      expect(app.toast).toHaveBeenCalledWith(
        `BMXAR0011E - Adding or Removing Calibration Points is not enabled for work order ${app.state.datasheetWonum} which has a status of ${app.state.workOrderStatus}.`,
        "error", "", "", "", false
      );
      expect(controller.page.showDialog).not.toHaveBeenCalled(); // Dialog should not be shown
    });

    it("should show error toast if the plusceditpoint is missing", async () => {
      const wPEditSettingDS = {
        items: [
          {
            orgid: "EAGLENA",
            status: "INPRG",
          },
        ],
      };
      // Mock the findDatasource method to return our mock resource
      jest.spyOn(app, "findDatasource").mockImplementation(() => {
        return wPEditSettingDS;
      });

      controller.page.showDialog = jest.fn();
      controller.validateAndLaunchInsertPointDialog();

      // Assert that toast is shown with the correct message
      expect(app.toast).toHaveBeenCalledWith(
        `BMXAR0011E - Adding or Removing Calibration Points is not enabled for work order ${app.state.datasheetWonum} which has a status of ${app.state.workOrderStatus}.`,
        "error", "", "", "", false
      );
      expect(controller.page.showDialog).not.toHaveBeenCalled(); // Dialog should not be shown
    });
    it('should show saveDiscardRules dialog in case of unsaved changes are there.', () => {
      const showDialogMock = jest.fn();
      controller.isDirty = jest.fn().mockReturnValue(true);
      controller.page.showDialog = showDialogMock;
      controller.validateAndLaunchInsertPointDialog({ isDeleting: false });

      expect(showDialogMock).toHaveBeenCalledWith("saveDiscardRules");
      expect(page.state.isCalledFromAddDeleteCalibrationPoint).toEqual(true);
    });
    it('should show saveAsLeftDiscardRules dialog in case of unsaved changes are there for asleft page.', () => {
      const showDialogMock = jest.fn();
      controller.isDirty = jest.fn().mockReturnValue(true);
      controller.page.showDialog = showDialogMock;
      controller.getConditionPrefix = jest.fn().mockReturnValue('asleft')
      controller.validateAndLaunchInsertPointDialog({ isDeleting: false });

      expect(showDialogMock).toHaveBeenCalledWith("saveAsLeftDiscardRules");
      expect(page.state.isCalledFromAddDeleteCalibrationPoint).toEqual(true);
    })
  });
  
  describe("getAssetFunctionTypePointLabel", () => {
    let app;
    let page;
    let controller;
    beforeAll(async () => {
      app = await baseSetup();
      page = app.findPage("calibrationpoints");
      controller = page.controllers[0];
    });

    it("Should return the calibration point label for the asset function type calibration", async () => {
      controller.page.state.calPointFlag = true;
      controller.page.state.calFunctionFlag = false;
      controller.page.state.calDynamicFlag = false;
      const assetFunctionTypePointLabel = controller.getAssetFunctionTypePointLabel();

      expect(assetFunctionTypePointLabel).toEqual('calibration point');
      expect(controller.page.state.assetFunctionType).toEqual('Calibration');
    });

    it("Should return the function check point label for the asset function type function check", async () => {
      controller.page.state.calPointFlag = false;
      controller.page.state.calFunctionFlag = true;
      controller.page.state.calDynamicFlag = false;
      const assetFunctionTypePointLabel = controller.getAssetFunctionTypePointLabel();

      expect(assetFunctionTypePointLabel).toEqual('function check point');
      expect(controller.page.state.assetFunctionType).toEqual('Function check');
    });

    it("Should return the dynamic check point label for the asset function type dynamic check", async () => {
      controller.page.state.calPointFlag = false;
      controller.page.state.calFunctionFlag = false;
      controller.page.state.calDynamicFlag = true;
      const assetFunctionTypePointLabel = controller.getAssetFunctionTypePointLabel();

      expect(assetFunctionTypePointLabel).toEqual('dynamic check point');
      expect(controller.page.state.assetFunctionType).toEqual('Dynamic check');
    });
  })

  describe('calcAssetAndDatasheetStatus', () => {
    let app;
    let page;
    let controller;
    beforeAll(async () => {
      app = await baseSetup();
      page = app.findPage("calibrationpoints");
      controller = page.controllers[0];
    });
    it('should update asset status and datasheet status for asleft and asfound both condition.', async () => {
      //Arrange
      controller.page.state.saveInProgress = false;
      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();
      let completeReadingsMethodCall = 0;
      jest.spyOn(CalibrationPointHandler.prototype, '_completeReadings').mockImplementation(() => {
        completeReadingsMethodCall++;
      });
      const calpointsds = app.state.calpointsds;

      const origSave = calpointsds.save;
      calpointsds.save = jest.fn();
      
      //Act
      await controller.calcAssetAndDatasheetStatus();

      //Aseert
      expect(completeReadingsMethodCall).toBe(2);
      expect(calpointsds.save).toHaveBeenCalled();
      expect(page.state.asfoundcalstatus).toBe('PASS');
      expect(page.state.asleftcalstatus).toBe('PASS');

      calpointsds.save = origSave;
    })

    it('should update asset status and datasheet status for given condition prefix.', async () => {
      //Arrange
      controller.page.state.saveInProgress = true;
      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();
      let completeReadingsMethodCall = 0;
      jest.spyOn(CalibrationPointHandler.prototype, '_completeReadings').mockImplementation(() => {
        completeReadingsMethodCall++;
      });
      const calpointsds = app.state.calpointsds;

      const origSave = calpointsds.save;
      calpointsds.save = jest.fn();
      
      //Act
      await controller.calcAssetAndDatasheetStatus();

      //Aseert
      expect(completeReadingsMethodCall).toBe(1);
      expect(calpointsds.save).toHaveBeenCalled();
      expect(page.state.asfoundcalstatus).toBe('PASS');

      calpointsds.save = origSave;
    })
  })

  describe('validateCalibrationFieldValue', () => {
    let app;
    let page;
    let controller;

    beforeAll(async () => {
      app = await baseSetup();
      page = app.findPage("calibrationpoints");
      controller = page.controllers[0];
    });

    it('Should raise an error when calibration field is not valid number.', () => {
      const event = { target: { value: 'alpha001' } }
      const setWarningMock = jest.fn();
      const point = { point: 'alpha001' };
      controller.getCalibrationPointsDS = jest.fn(() => ({
        item: point,
        setWarning: setWarningMock
      }));
      controller.validateCalibrationFieldValue('point', event);

      expect(setWarningMock).toHaveBeenCalledWith(point, 'point', 'Enter a numeric value');
    });

    it('Should apply clipslimit and transform input value.', () => {
      const event = { target: { value: '15,000.04' } };
      const calpointMock = { item: { inputvalue: '0' } };
      controller.validateClipLimitsForNominalInput = jest.fn();
      page.state.inputprecision = 4;
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue(calpointMock);
      controller.getAssetFunctionDS = jest.fn().mockReturnValue({
        item: {
          cliplimitsin: true
        }
      });
      controller.validateCalibrationFieldValue('inputvalue', event);

      expect(controller.validateClipLimitsForNominalInput).toHaveBeenCalledWith('inputvalue');
      expect(calpointMock.item.inputvalue).toBe('15000.0400');
    });
  });

  describe('validateClipLimitsForNominalInput', () => {
    let app;
    let page;
    let controller;

    beforeAll(async () => {
      app = await baseSetup();
      page = app.findPage("calibrationpoints");
      controller = page.controllers[0];
    });

    it('should raise a clipslimit error when inputvalue is out of range.', () => {
      const setWarningMock = jest.fn();
      const calpointMock = { 
        item: { inputvalue: '15.00' },
        setWarning: setWarningMock
     };
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue(calpointMock);
      controller.getAssetFunctionDS = jest.fn().mockReturnValue({
        item: {
          instrcalrangefrom: "4",
          instrcalrangeto: "8",
          cliplimitsin: true
        }
      });

      const fieldName = 'inputvalue'

      controller.validateClipLimitsForNominalInput(fieldName);
      
      expect(setWarningMock).toHaveBeenCalledWith(expect.any(Object), fieldName, `The ${calpointMock.item.inputvalue} is outside the range of 4 to 8.`);
    });

    it('should swap instrCalRangeFrom and instrCalRangeTo values if these are defined in opposite order.', () => {
      const setWarningMock = jest.fn();
      const calpointMock = { 
        item: { inputvalue: '15.00' },
        setWarning: setWarningMock
     };
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue(calpointMock);
      controller.getAssetFunctionDS = jest.fn().mockReturnValue({
        item: {
          instrcalrangefrom: "8",
          instrcalrangeto: "4",
          cliplimitsin: true
        }
      });

      const fieldName = 'inputvalue'

      controller.validateClipLimitsForNominalInput(fieldName);
      
      expect(setWarningMock).toHaveBeenCalledWith(expect.any(Object), fieldName, `The ${calpointMock.item.inputvalue} is outside the range of 8 to 4.`);
    })

  });

  describe('onCalibrationFieldChange', () => {
    let app;
    let page;
    let controller;

    beforeAll(async () => {
      app = await baseSetup();
      page = app.findPage("calibrationpoints");
      controller = page.controllers[0];
    });

    it('should clear previous warnings if any on change event of input field.', () => { 
      const clearWarningsMock = jest.fn();
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue({
        clearWarnings: clearWarningsMock,
        item: {
          inputvalue: 10
        }
      });
      const fieldName = 'inputvalue';
      controller.onCalibrationFieldChange(fieldName);

      expect(clearWarningsMock).toHaveBeenCalledWith(expect.any(Object), fieldName);
    });
  });

  describe('continueAddOrDeleteCalibrationPoint', () => {
    let app;
    let page;
    let controller;

    beforeAll(async () => {
      app = await baseSetup();
      page = app.findPage("calibrationpoints");
      controller = page.controllers[0];
    });

    it('should call delete calibration point if method is invoked from delete point.', () => { 
      controller.deleteCalibrationPoint = jest.fn();
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue({
        item: {
          isDeleting: true
        }
      });
      controller.continueAddOrDeleteCalibrationPoint();

      expect(controller.deleteCalibrationPoint).toHaveBeenCalled();
      expect(controller.page.state.isCalledFromAddDeleteCalibrationPoint).toEqual(false);
    });

    it('should call validateAndLaunchInsertPointDialog if method is invoked from add calibration point.', () => { 
      controller.validateAndLaunchInsertPointDialog = jest.fn();
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue({
        item: {
          isDeleting: false
        }
      });
      controller.continueAddOrDeleteCalibrationPoint();

      expect(controller.validateAndLaunchInsertPointDialog).toHaveBeenCalledWith({ isDeleting: false });
      expect(controller.page.state.isCalledFromAddDeleteCalibrationPoint).toEqual(false);
    });
  });

  describe('toggleCalibrationPointActionMenu', () => {
    let app;
    let page;
    let controller;

    beforeAll(async () => {
      app = await baseSetup();
      page = app.findPage("calibrationpoints");
      controller = page.controllers[0];
    });

    it('should update toggle menu state inside item object.', () => {
      const item = {};
      controller.toggleCalibrationPointActionMenu(item, true);

      expect(item.isCalPointMenuOpen).toBe(true);
    })
  });


  describe('closeAddEditCalPointDialog', () => {
    let app;
    let page;
    let controller;

    beforeAll(async () => {
      app = await baseSetup();
      page = app.findPage("calibrationpoints");
      controller = page.controllers[0];
    });

    it('should close edit calibration point dialog.', () => {
      const clearAllWarningsMock = jest.fn();
      const clearChangesMock = jest.fn();
      const undoAllMock = jest.fn();
      const closeDialogMock = jest.fn();
      controller.getDatasheetDS = jest.fn().mockReturnValue({
        undoAll: undoAllMock
      });
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue({
        clearAllWarnings: clearAllWarningsMock,
        clearChanges: clearChangesMock
      });
      page.findDialog = jest.fn().mockReturnValue({
        closeDialog: closeDialogMock
      });

      controller.closeEditCalPointDialog();

      expect(clearAllWarningsMock).toHaveBeenCalled();
      expect(clearChangesMock).toHaveBeenCalled();
      expect(undoAllMock).toHaveBeenCalled();
      expect(closeDialogMock).toHaveBeenCalled();
    });

    it('should close add calibration point dialog.', () => {
      const clearAllWarningsMock = jest.fn();
      const clearChangesMock = jest.fn();
      const undoAllMock = jest.fn();
      const closeDialogMock = jest.fn();

      controller.getCalibrationPointsDS = jest.fn().mockReturnValue({
        clearAllWarnings: clearAllWarningsMock,
        clearChanges: clearChangesMock,
        undoAll: undoAllMock
      });
      page.findDialog = jest.fn().mockReturnValue({
        closeDialog: closeDialogMock
      });

      controller.closeAddCalPointDialog();

      expect(clearAllWarningsMock).toHaveBeenCalled();
      expect(clearChangesMock).toHaveBeenCalled();
      expect(undoAllMock).toHaveBeenCalled();
      expect(closeDialogMock).toHaveBeenCalled();
    });
  });

  describe('openEditCalibrationPointDialog', () => {
    let app;
    let page;
    let controller;

    beforeAll(async () => {
      app = await baseSetup();
      page = app.findPage("calibrationpoints");
      controller = page.controllers[0];
    });

    it('should open edit Calibration point dialog.', () => {
      const item = { pluscwodspointid: 123 };
      const clearWarningsMock = jest.fn();
      const showDialogMock = jest.fn();
      const getByIdMock = jest.fn();
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue({
        clearWarnings: clearWarningsMock,
        getById: getByIdMock
      });

      page.showDialog = showDialogMock;

      controller.openEditCalibrationPointDialog(item);

      expect(clearWarningsMock).toHaveBeenCalledWith(item, 'point');
      expect(getByIdMock).toHaveBeenCalledWith(123, true);
      expect(showDialogMock).toHaveBeenCalledWith('editCalPoint');
    });
  });

  describe('calculateDesiredOutputForNewAnalog', () => {
    let app;
    let page;
    let controller;

    beforeAll(async () => {
      app = await baseSetup();
      page = app.findPage("calibrationpoints");
      page.state.calPointFlag = true;
      page.state.inputprecision = 2;
      page.state.outputprecision = 4;
      controller = page.controllers[0];
      controller.getDsConfig = jest.fn().mockReturnValue({
        item: {
          repeatvalue: 5,
          rangetruncate: true,
          revisionnum: 0,
          assettruncate: false,
          assetnplaces: 0,
          tolnplaces: 0,
          outputtruncate: true,
          tolerror: 1,
          dsplannum: "DS101",
          pluscdsconfigid: 1,
          stddev: 1,
          asseterror: 1,
          toltruncate: false,
        }
      });
      controller.getAssetFunctionDS = jest.fn().mockReturnValue({
        item: {
          ron1lowervalue: -1,
          ron1uppervalue: 1, 
          ron1type: 'EU',
          instrcalrangefrom: 0, 
          instrcalrangeto: 100, 
          instroutrangefrom: 4, 
          instroutrangeto: 20
        }
      });
    });

    it('should calculate desired output while adding or editing calibration point.', () => {
      const instrRange = {
        instrcalrangefrom: 0,
        instrcalrangeto: 100,
        instroutrangefrom: 4,
        instroutrangeto: 20,
      };
      const calPoint = {
        inputvalue: 35
      };
      const calculateTolerancesSpy = jest.spyOn(DatasheetCalculation.prototype, 'calculateTolerances').mockImplementation(() => {});
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue({
        item: calPoint,
        get: jest.fn()
      });

      controller.calculatePointRangeLimits = jest.fn();
      
      controller.calculateDesiredOutputForNewAnalog(CalibrationPointConstants.PLANTYPE.ANALOG);

      expect(controller.calculatePointRangeLimits).toHaveBeenCalledWith(35, instrRange);
      expect(calPoint.outputvalue).toEqual('9.6000');
      expect(calculateTolerancesSpy).toHaveBeenCalledTimes(1)
    });

    it('should calculate desired output and round it while adding or editing calibration point.', () => {
      const calPoint = {
        inputvalue: 43
      };
      
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue({
        item: calPoint,
        get: jest.fn()
      });

      controller.getDsConfig = jest.fn().mockReturnValue({
        item: {
          repeatvalue: 5,
          rangetruncate: true,
          revisionnum: 0,
          assettruncate: false,
          assetnplaces: 0,
          tolnplaces: 0,
          outputtruncate: false,
          tolerror: 1,
          dsplannum: "DS101",
          pluscdsconfigid: 1,
          stddev: 1,
          asseterror: 1,
          toltruncate: false,
        }
      });

      controller.calculatePointRangeLimits = jest.fn();
      
      controller.calculateDesiredOutputForNewAnalog(CalibrationPointConstants.PLANTYPE.ANALOG);

      expect(calPoint.outputvalue).toEqual('10.8800');
    });

    it('should not calculate desired output when asset function is no linear.', () => {
      const calPoint = {
        inputvalue: 35
      };
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue({
        item: calPoint,
        get: jest.fn()
      });
      
      jest.spyOn(DatasheetCalculation.prototype, 'calculateTolerances').mockImplementation(() => {});

      controller.getAssetFunctionDS = jest.fn().mockReturnValue({
        item: {
          ron1lowervalue: -1,
          ron1uppervalue: 1, 
          ron1type: 'EU',
          instrcalrangefrom: 0, 
          instrcalrangeto: 100, 
          instroutrangefrom: 4, 
          instroutrangeto: 20,
          nonlinear: true
        }
      });

      controller.calculatePointRangeLimits = jest.fn();
      
      controller.calculateDesiredOutputForNewAnalog(CalibrationPointConstants.PLANTYPE.ANALOG);

      expect(calPoint.outputvalue).toBeFalsy();
    });
  });

  describe('deleteCalibrationPoint', () => {
    let app;
    let page;
    let controller;

    beforeAll(async () => {
      app = await baseSetup();
      page = app.findPage("calibrationpoints");
      controller = page.controllers[0];
    });

    it('should delete calibration point item if point deletion is allowed.', async () => {
      const itemToBeDeleted = { pluscwodspointid: 123 };
      page.state.assetFunctionType = 'Calibration';
      const calpoint = {};
      const calpointDsMock = {
        getById: jest.fn().mockReturnValue(calpoint),
        deleteItem: jest.fn().mockResolvedValue(true)
      };
      const forceReloadAndWaitForChildrenMock = jest.fn();
      app.toast = jest.fn();
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue(calpointDsMock);
      controller.isDirty = jest.fn().mockReturnValue(false);
      controller.validateAndLaunchInsertPointDialog = jest.fn().mockResolvedValue(true);
      controller.getDatasheetDS = jest.fn().mockReturnValue({
        forceReloadAndWaitForChildren: forceReloadAndWaitForChildrenMock
      });

      controller.calculateInitialStatus = jest.fn();
      controller.calcAssetAndDatasheetStatus = jest.fn();

      await controller.deleteCalibrationPoint(itemToBeDeleted);

      expect(calpointDsMock.getById).toHaveBeenCalledWith(123, true);
      expect(calpoint.isDeleting).toBe(true);
      expect(forceReloadAndWaitForChildrenMock).toHaveBeenCalled();
      expect(controller.calculateInitialStatus).toHaveBeenCalled();
      expect(controller.calcAssetAndDatasheetStatus).toHaveBeenCalled();
      expect(app.toast).toHaveBeenCalledWith('Calibration point deleted.', 'success', "", "", "", false);
    });
  });
  describe('isCalPointValid', () => {
    let app;
    let page;
    let controller;

    beforeAll(async () => {
      app = await baseSetup();
      page = app.findPage("calibrationpoints");
      controller = page.controllers[0];
    });

    it('should raise an error when point field is empty.', () => {
      const setWarningMock = jest.fn();
      page.state.assetFunctionType = 'Calibration';
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue({
        item: {
          point: ''
        },
        setWarning: setWarningMock,
      });
      const isCalpointValid = controller.isCalPointValid();

      expect(setWarningMock).toHaveBeenCalledWith(expect.any(Object), 'point', 'Calibration point is required.');
      expect(isCalpointValid).toBe(false);
    });

    it('should raise an error when user entered duplicate value of point field.', () => {
      const setWarningMock = jest.fn();
      page.state.assetFunctionType = 'Calibration';
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue({
        item: {
          point: 123
        },
        setWarning: setWarningMock,
      });
      const existingCalibrationPoints = [{
        point: 123
      }];
      const isCalpointValid = controller.isCalPointValid(existingCalibrationPoints);

      expect(setWarningMock).toHaveBeenCalledWith(expect.any(Object), 'point', 'Calibration point must be unique.');
      expect(isCalpointValid).toBe(false);
    })
  });

  describe('addCalibrationPoint', () => {
    let app;
    let page;
    let controller;

    beforeAll(async () => {
      app = await baseSetup();
      page = app.findPage("calibrationpoints");
      controller = page.controllers[0];
    });

    it('should add valid calibration point.', async () => {
      const closeDialogMock = jest.fn();
      const saveMock = jest.fn();
      const forceReloadAndWaitForChildrenMock = jest.fn();
      app.toast = jest.fn();
      page.state.assetFunctionType = 'Calibration';
      controller.isCalPointValid = jest.fn().mockReturnValue(true);
      controller.populateDefaultValuesForCalPointFields = jest.fn();
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue({
        save: saveMock
      });
      controller.getDatasheetDS = jest.fn().mockReturnValue({
        forceReloadAndWaitForChildren: forceReloadAndWaitForChildrenMock
      });
      controller.calculateInitialStatus = jest.fn();
      controller.calcAssetAndDatasheetStatus = jest.fn();
      page.findDialog = jest.fn().mockReturnValue({
        closeDialog: closeDialogMock,
      });
      controller.getAssetFunctionDS = jest.fn().mockReturnValue({
        item: {
          pluscwodspoint: []
        }
      });

      await controller.addCalibrationPoint();

      expect(app.toast).toHaveBeenCalledWith('Calibration point added.', 'success', "", "", "", false);
      expect(page.findDialog).toHaveBeenCalledWith('addCalPoint');
      expect(saveMock).toHaveBeenCalledWith({ responseProperties: 'anywhererefid,pluscwodspointid,point,dsplannum,instrseq,wonum,isadded,plantype,wodsnum,revisionnum' });
      expect(closeDialogMock).toHaveBeenCalled();
      expect(forceReloadAndWaitForChildrenMock).toHaveBeenCalled();
      expect(controller.populateDefaultValuesForCalPointFields).toHaveBeenCalled();
      expect(controller.getDatasheetDS).toHaveBeenCalled();
      expect(controller.calculateInitialStatus).toHaveBeenCalled();
      expect(controller.calcAssetAndDatasheetStatus).toHaveBeenCalled();
    });
  });

  describe('editCalibrationPoint', () => {
    let app;
    let page;
    let controller;

    beforeAll(async () => {
      app = await baseSetup();
      page = app.findPage("calibrationpoints");
      controller = page.controllers[0];
    });

    it('should edit calibration point.', async () => {
      const closeDialogMock = jest.fn();
      const saveMock = jest.fn();
      app.toast = jest.fn();
      controller.calculateDesiredOutputForNewAnalog = jest.fn();
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue({
        items: [{
          pluscwodspointid: 2
        }],
        save: saveMock,
        item: {
          pluscwodspointid: 1,
          plantype: 'ANALOG'
        }
      });
      controller.isCalPointValid = jest.fn().mockReturnValue(true);
      page.state.assetFunctionType = 'Calibration';
      page.findDialog = jest.fn().mockReturnValue({
        closeDialog: closeDialogMock,
      });

      await controller.editCalibrationPoint();

      expect(app.toast).toHaveBeenCalledWith('Calibration point updated.', 'success', "", "", "", false);
      expect(page.findDialog).toHaveBeenCalledWith('editCalPoint');
      expect(saveMock).toHaveBeenCalledWith({ responseProperties: 'anywhererefid,pluscwodspointid,point,dsplannum,instrseq,wonum,isadded,plantype,wodsnum,revisionnum' });
      expect(closeDialogMock).toHaveBeenCalled();
      expect(controller.calculateDesiredOutputForNewAnalog).toHaveBeenCalledWith('ANALOG');
    })
  });

  describe('populateDefaultValuesForCalPointFields', () => {
    let app;
    let page;
    let controller;

    beforeAll(async () => {
      app = await baseSetup();
      page = app.findPage("calibrationpoints");
      controller = page.controllers[0];
    });

    it('should populate default values for calpoint record if those fields are empty.', () => {
      const calpoint = {};
      page.state.calPointFlag = true;
      page.state.inputprecision = 4;
      controller.calculateDesiredOutputForNewAnalog = jest.fn();
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue({
        item: calpoint,
        dependsOn: {
          dependsOn: {
            item: {
              wodsnum: 'DS101'
            }
          },
          item: {
            wonum: 'WO123',
            dsplannum: 'DSPL01',
            instrseq: 101,
            revisionnum: 1,
            plantype: 'ANALOG',
            plantype_maxvalue: 'ANALOG',
            plantype_description: 'ANALOG asset function'
          }
        }
      });
      // app.userInfo = jest.fn().mockReturnValue('en');

      controller.populateDefaultValuesForCalPointFields();

      expect(calpoint.wonum).toBe('WO123');
      expect(calpoint.wodsnum).toBe('DS101');
      expect(calpoint.dsplannum).toBe('DSPL01');
      expect(calpoint.instrseq).toBe(101);
      expect(calpoint.revisionnum).toBe(1);
      expect(calpoint.plantype).toBe('ANALOG');
      expect(calpoint.plantype_maxvalue).toBe('ANALOG');
      expect(calpoint.plantype_description).toBe('ANALOG asset function');
      expect(calpoint.inputvalue).toBe('0.0000');

      expect(calpoint.asfounderror).toBe(false);
      expect(calpoint.asfoundfail).toBe(false);
      expect(calpoint.asfoundpass).toBe(false);
      expect(calpoint.asfoundpterror).toBe(false);

      expect(calpoint.aslefterror).toBe(false);
      expect(calpoint.asleftfail).toBe(false);
      expect(calpoint.asleftpass).toBe(false);
      expect(calpoint.asleftpterror).toBe(false);
      expect(controller.calculateDesiredOutputForNewAnalog).toHaveBeenCalled();
    });

    it('should not populate default values for calpoint record if those fields are non empty .', () => {
      const calpoint = {
        wonum: 'WO123',
        wodsnum: 'DS101',
        dsplannum: 'DSPL01',
        instrseq: 101,
        revisionnum: 1,
        langcode: 'en',
        plantype: 'DISCRETE',
        plantype_maxvalue: 'DISCRETE',
        plantype_description: 'DISCRETE asset function'
      };
      page.state.calPointFlag = true;
      page.state.inputprecision = 4;
      controller.calculateDesiredOutputForNewAnalog = jest.fn();
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue({ 
        item: calpoint,
        dependsOn: {
          dependsOn: {
            item: {
              wodsnum: 'DEFAULT'
            }
          },
          item: {
            wonum: 'DEFAULT',
            dsplannum: 'DEFAULT',
            instrseq: 'DEFAULT',
            revisionnum: 'DEFAULT',
            plantype: 'DEFAULT',
            plantype_maxvalue: 'DEFAULT',
            plantype_description: 'DEFAULT'
          }
        }
      });

      controller.populateDefaultValuesForCalPointFields();

      expect(calpoint.wonum).toBe('WO123');
      expect(calpoint.wodsnum).toBe('DS101');
      expect(calpoint.dsplannum).toBe('DSPL01');
      expect(calpoint.instrseq).toBe(101);
      expect(calpoint.revisionnum).toBe(1);
      expect(calpoint.plantype).toBe('DISCRETE');
      expect(calpoint.plantype_maxvalue).toBe('DISCRETE');
      expect(calpoint.plantype_description).toBe('DISCRETE asset function');
      expect(calpoint.setpoint).toBe('0.0000');

      expect(calpoint.asfounderror).toBe(false);
      expect(calpoint.asfoundfail).toBe(false);
      expect(calpoint.asfoundpass).toBe(false);
      expect(calpoint.asfoundpterror).toBe(false);

      expect(calpoint.aslefterror).toBe(false);
      expect(calpoint.asleftfail).toBe(false);
      expect(calpoint.asleftpass).toBe(false);
      expect(calpoint.asleftpterror).toBe(false);
      expect(controller.calculateDesiredOutputForNewAnalog).toHaveBeenCalled();
    });
  });

  describe('calculatePointRangeLimits', () => {
    let app;
    let page;
    let controller;

    beforeAll(async () => {
      app = await baseSetup();
      page = app.findPage("calibrationpoints");
      controller = page.controllers[0];
    });

    it('should set ron1lower, ron1upper and rontype in case of toltype EU.', () => {
      const calpoint = {};
      const instrRange = {
        instrcalrangefrom: 10,
        instrcalrangeto: 100,
      };
      const assetItem = {
        ron1lowervalue: -1,
        ron1uppervalue: 1,
        inputprecision: 2,
        ron1type: 'EU',
        cliplimits: true
      };
      controller.getDsConfig = jest.fn().mockReturnValue({ item: { rangetruncate: true } });
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue({ item: calpoint });
      controller.getAssetFunctionDS = jest.fn().mockReturnValue({ item: assetItem });

      controller.calculatePointRangeLimits(50, instrRange);

      expect(calpoint.ron1lower).toBe('49.00');
      expect(calpoint.ron1upper).toBe('51.00');
      expect(calpoint.rontype).toBe('EU');
    });

    it('should set ron1lower, ron1upper and rontype in case of toltype %SPAN.', () => {
      const calpoint = {};
      const instrRange = {
        instrcalrangefrom: 10,
        instrcalrangeto: 100,
      };
      const assetItem = {
        ron1lowervalue: -1,
        ron1uppervalue: 1,
        inputprecision: 2,
        ron1type: '%SPAN',
        cliplimits: true
      };
      controller.getDsConfig = jest.fn().mockReturnValue({ item: { rangetruncate: true } });
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue({ item: calpoint });
      controller.getAssetFunctionDS = jest.fn().mockReturnValue({ item: assetItem });

      controller.calculatePointRangeLimits(50, instrRange);

      expect(calpoint.ron1lower).toBe('49.10');
      expect(calpoint.ron1upper).toBe('50.90');
      expect(calpoint.rontype).toBe('%SPAN');
    });

    it('should set ron1lower, ron1upper and rontype in case of toltype %URV.', () => {
      const calpoint = {};
      const instrRange = {
        instrcalrangefrom: 10,
        instrcalrangeto: 100,
      };
      const assetItem = {
        ron1lowervalue: -1,
        ron1uppervalue: 1,
        inputprecision: 2,
        ron1type: '%URV',
        cliplimits: true
      };
      controller.getDsConfig = jest.fn().mockReturnValue({ item: { rangetruncate: true } });
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue({ item: calpoint });
      controller.getAssetFunctionDS = jest.fn().mockReturnValue({ item: assetItem });

      controller.calculatePointRangeLimits(50, instrRange);

      expect(calpoint.ron1lower).toBe('49.00');
      expect(calpoint.ron1upper).toBe('51.00');
      expect(calpoint.rontype).toBe('%URV');
    });

    it('should set ron1lower, ron1upper and rontype in case of toltype %READING.', () => {
      const calpoint = {};
      const instrRange = {
        instrcalrangefrom: 10,
        instrcalrangeto: 100,
      };
      const assetItem = {
        ron1lowervalue: -1,
        ron1uppervalue: 1,
        inputprecision: 2,
        ron1type: '%READING',
        cliplimits: true
      };
      controller.getDsConfig = jest.fn().mockReturnValue({ item: { rangetruncate: true } });
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue({ item: calpoint });
      controller.getAssetFunctionDS = jest.fn().mockReturnValue({ item: assetItem });

      controller.calculatePointRangeLimits(50, instrRange);

      expect(calpoint.ron1lower).toBe('49.50');
      expect(calpoint.ron1upper).toBe('50.50');
      expect(calpoint.rontype).toBe('%READING');
    });

    it('should set ron1lower, ron1upper and rontype in case of empty toltype.', () => {
      const calpoint = {};
      const instrRange = {
        instrcalrangefrom: 10,
        instrcalrangeto: 100,
      };
      const assetItem = {
        ron1lowervalue: -1,
        ron1uppervalue: 1,
        inputprecision: 2,
      };
      controller.getDsConfig = jest.fn().mockReturnValue({ item: { rangetruncate: false } });
      controller.getCalibrationPointsDS = jest.fn().mockReturnValue({ item: calpoint });
      controller.getAssetFunctionDS = jest.fn().mockReturnValue({ item: assetItem });

      controller.calculatePointRangeLimits(50, instrRange);

      expect(calpoint.ron1lower).toBe('0.00');
      expect(calpoint.ron1upper).toBe('0.00');
      expect(calpoint.rontype).toBe('');
    });

  });

  /* -------------------------------------------------------------------------- */
  /*                         Generators                                         */
  /* -------------------------------------------------------------------------- */

  const loadDomainCalStatusDS = async () => ({
    name: "domaincalstatustest",
    items: [],
  });

  const loadDsConfig = async () => ({
    name: "dsconfigtest",
    items: testDsconfigData.member,
  });
});

describe('validateCalPointValuesAndCalculateTolerancesAsync', () => {
  it('should track promise in pendingToleranceCalculationSet and remove it when resolved', async () => {
    // Arrange
    const app = await baseSetup();
    const page = app.findPage("calibrationpoints");
    const controller = page.controllers[0];
    
    // Setup the pendingToleranceCalculationSet
    page.state.pendingToleranceCalculationSet = new Set();
    
    // Mock validateCalPointAndCalculateTolerances to return a promise
    const mockPromise = Promise.resolve();
    controller.validateCalPointAndCalculateTolerances = jest.fn().mockReturnValue(mockPromise);
    
    const context = {
      item: { plantype: CalibrationPointConstants.PLANTYPE.ANALOG },
      whichFieldTypeChanged: 'input'
    };
    const event = { target: { dataset: { previousValue: '10' } } };
    
    // Act
    const resultPromise = controller.validateCalPointValuesAndCalculateTolerancesAsync(context, event);
    
    // Assert
    expect(controller.validateCalPointAndCalculateTolerances).toHaveBeenCalledWith(context, event);
    expect(page.state.pendingToleranceCalculationSet.has(resultPromise)).toBe(true);
    
    // Wait for promise to resolve
    await resultPromise;
    
    // Check that promise was removed from set
    expect(page.state.pendingToleranceCalculationSet.has(resultPromise)).toBe(false);
  });

  it('should properly track and manage promises in the pendingToleranceCalculationSet', async () => {
    // Arrange
    const app = await baseSetup();
    const page = app.findPage("calibrationpoints");
    const controller = page.controllers[0];
    
    // Setup the pendingToleranceCalculationSet
    page.state.pendingToleranceCalculationSet = new Set();
    
    // Create a spy on the Set.delete method to verify it's called
    const deleteSpyFn = jest.spyOn(page.state.pendingToleranceCalculationSet, 'delete');
    
    // Mock validateCalPointAndCalculateTolerances to return a promise
    controller.validateCalPointAndCalculateTolerances = jest.fn().mockReturnValue(Promise.resolve());
    
    const context = {
      item: { plantype: CalibrationPointConstants.PLANTYPE.ANALOG },
      whichFieldTypeChanged: 'input'
    };
    const event = { target: { dataset: { previousValue: '10' } } };
    
    // Act
    const resultPromise = controller.validateCalPointValuesAndCalculateTolerancesAsync(context, event);
    
    // Assert initial state
    expect(page.state.pendingToleranceCalculationSet.has(resultPromise)).toBe(true);
    
    // Wait for promise to complete
    await resultPromise;
    
    // Verify the delete method was called with the promise
    expect(deleteSpyFn).toHaveBeenCalledWith(resultPromise);
    
    // Cleanup
    deleteSpyFn.mockRestore();
  });
});
