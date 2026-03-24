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
import newTestStub from "../../../../test/AppTestStub.jsx";
import testCalibrationData from "../../../test/test-calibration-data.js";
import testDsconfigData from "../../../test/test-dsconfig-data.js";

/** Constants */
import CalibrationPointConstants from "../../constants/CalibrationPointConstants.js";
import DatasheetConstants from "../../constants/DatasheetConstants";

/** Utils */
import generateRandomInt from "../../utils/generateRandomInt";
import generateRandomFloat from "../../utils/generateRandomFloat";
import toDisplayableValue from "../../utils/numberFormatter/toDisplayableValue";
import defaults from "../../utils/defaults.js";

/** Helpers */
import DatasheetCalculation from "../DatasheetCalculation";

/** Implementation */
describe("DatasheetCalculation", () => {
  const TEST_DSPLANNUM = "DMG_MULTI";

  const TEST_REVISIONNUM = 0;

  const TEST_WONUM = "1206";

  const TEST_PLUSCWODSPOINTID = 1;

  const setup = async (dsconfigItem = null) => {
    const domainCalStatusDS = {
      name: "domaincalstatusds",
      items: [{
        value: 'PASS',
        maxvalue: 'PASS',
        defaults: 1
      },
      {
        value: 'FAIL',
        maxvalue: 'FAIL',
        defaults: 1
      }
    ],
    };
    if (!dsconfigItem) {
      const app = await initializeApp();
      const dsconfig = await loadDsConfig(
        app,
        TEST_DSPLANNUM,
        TEST_REVISIONNUM
      );
      return new DatasheetCalculation(dsconfig.currentItem, "en-US", domainCalStatusDS);
    }
    return new DatasheetCalculation(dsconfigItem, "en-US", domainCalStatusDS);
  };

  const initializeApp = async () => {
    return await newTestStub({
      currentPage: "assetfunctions",
      onNewState: (state) => {
        return { 
          ...state, 
          canLoadCalibrationData: true,
          dataSheethref: testCalibrationData.href
        }
      },
      datasources: {
        pluscWoDs: {
          data: testCalibrationData,
        },
        dsconfig: {
          data: testDsconfigData,
        },
      },
    })();
  };

  const loadDsConfig = async (app, dsplannum, revisionnum) => {
    const dsconfig = app.findDatasource("dsconfig");

    await dsconfig.load({
      qbe: {
        dsplannum,
        revisionnum,
      },
    });

    return dsconfig;
  };

  const loadInstrItem = async (app, wonum) => {
    const pluscWoDs = app.findDatasource("pluscWoDs");
    await pluscWoDs.load({
      qbe: {
        wonum,
      },
    });
    return pluscWoDs.currentItem.pluscwodsinstr[0];
  };

  const loadCalibrationPointItem = async (app, wonum, pluscwodspointid) => {
    const pluscWoDs = app.findDatasource("pluscWoDs");
    await pluscWoDs.load({
      qbe: {
        wonum,
      },
    });
    return pluscWoDs.currentItem.pluscwodsinstr[0].pluscwodspoint.find(
      (point) => point.pluscwodspointid === pluscwodspointid
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {});

  /* -------------------------------------------------------------------------- */
  /*                                Test Cases                                  */
  /* -------------------------------------------------------------------------- */

  describe("calculateInitialStatus", () => {
    it("Should return null when input or output are undefined", async () => {
      // Arrange
      const app = await initializeApp();

      const dscalc = await setup();

      const instrItem = await loadInstrItem(app, TEST_WONUM);
      instrItem.nonlinear = true;

      const calstatus = null;

      // Arrange point
      const pointItem = loadCalibrationPointItem(
        app,
        TEST_WONUM,
        TEST_PLUSCWODSPOINTID
      );
      pointItem.asfoundinput = 0.007;
      delete pointItem.asfoundinput;
      delete pointItem.asfoundoutput;

      // Act
      const actualCalstatus = dscalc.calculateInitialStatus(
        CalibrationPointConstants.CONDITION_ASFOUND,
        pointItem,
        instrItem,
        calstatus
      );

      // Assert
      expect(actualCalstatus).toEqual(null);
    });

    it("Should return null when output is null but input is not null and instrument is linear", async () => {
      // Arrange
      const app = await initializeApp();

      const dscalc = await setup();

      const pointItem = await loadCalibrationPointItem(
        app,
        TEST_WONUM,
        TEST_PLUSCWODSPOINTID
      );
      pointItem.asfoundinput = 0.007;
      pointItem.asfoundoutput = null;

      const instrItem = await loadInstrItem(app, TEST_WONUM);
      instrItem.nonlinear = false;

      const calstatus = null;

      // Act
      const actualCalstatus = dscalc.calculateInitialStatus(
        CalibrationPointConstants.CONDITION_ASFOUND,
        pointItem,
        instrItem,
        calstatus
      );

      // Assert
      expect(actualCalstatus).toEqual(null);
    });

    it("Should update calibration status ds", async () => {
      // Arrange
      const app = await initializeApp();

      const dscalc = await setup();

      const instrItem = await loadInstrItem(app, TEST_WONUM);
      instrItem.nonlinear = true;

      const domainCalStatusDS = {
        name: "domaincalstatusds",
        items: [],
      };

      dscalc.setDomainCalStatusDS(domainCalStatusDS);

      expect(dscalc.domainCalStatusDS.name).toEqual(domainCalStatusDS.name);
    });

    it("shouldReturnToleranceRateWhenCalibrationPointIsComplete", async () => {
      // Arrange
      const app = await initializeApp();

      const dsconfig = await loadDsConfig(
        app,
        TEST_DSPLANNUM,
        TEST_REVISIONNUM
      );
      dsconfig.currentItem.toltruncate = true;

      const dscalc = await setup({ dsconfig });

      const instr = { nonlinear: false };
      const point = generatePoint({
        asfoundinput: 0.007,
        asfoundoutput: 1.007,
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        asfoundtol1lower: 0,
        asfoundtol1upper: 1,
        asfoundtol2lower: 0,
        asfoundtol2upper: 1,
        asfoundtol3lower: 0,
        asfoundtol3upper: 1,
        asfoundtol4lower: 0,
        asfoundtol4upper: 1,
      });
      const calstatus = DatasheetConstants.STATUS_PASS;

      // Act
      const tolExceeded = dscalc.calculateInitialStatus(
        CalibrationPointConstants.CONDITION_ASFOUND,
        point,
        instr,
        calstatus
      );

      // Assert
      expect(tolExceeded).toEqual(true);
    });

    it("Should use asfoundsetpoint value when plantype is DISCRETE", async () => {
      // Arrange
      const app = await initializeApp();

      const dsconfig = await loadDsConfig(
        app,
        TEST_DSPLANNUM,
        TEST_REVISIONNUM
      );
      dsconfig.currentItem.toltruncate = true;

      const dscalc = await setup({ dsconfig });

      const instr = { nonlinear: false };
      const point = generatePoint({
        asfoundinput: 0.007,
        asfoundoutput: 1.007,
        asfoundsetpoint: 2.008,
        plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
        asfoundtol1lower: 0,
        asfoundtol1upper: 1,
        asfoundtol2lower: 0,
        asfoundtol2upper: 1,
        asfoundtol3lower: 0,
        asfoundtol3upper: 1,
        asfoundtol4lower: 0,
        asfoundtol4upper: 1,
      });
      const calstatus = DatasheetConstants.STATUS_PASS;

      // Act
      const tolExceeded = dscalc.calculateInitialStatus(
        CalibrationPointConstants.CONDITION_ASFOUND,
        point,
        instr,
        calstatus
      );

      // Assert
      expect(tolExceeded).toEqual(true);
    });
  });

  describe("calculateToleranceErrors", () => {
    it("Should return false when no tolerance threshold was assigned to point", async () => {
      // Arrange params
      const sPrefix = CalibrationPointConstants.CONDITION_ASFOUND;

      const options = {
        round: DatasheetConstants.ROUND_VALUE,
        places: DatasheetConstants.DEFAULT_PRECISION,
      };

      const outputValue = toDisplayableValue(
        generateRandomFloat(0, 10),
        options
      );

      const app = await initializeApp();

      const instrItem = await loadInstrItem(app, TEST_WONUM);

      const pointItem = await loadCalibrationPointItem(
        app,
        TEST_WONUM,
        TEST_PLUSCWODSPOINTID
      );
      for (let tol = 1; tol < 5; tol++) {
        pointItem[`${sPrefix}tol${tol}upper`] = null;
        pointItem[`${sPrefix}tol${tol}lower`] = null;
        instrItem[`tol${tol}status`] = DatasheetConstants.STATUS_WARNING;
      }

      // Act
      const dscalc = await setup();

      const tolExceeded = dscalc.calculateToleranceErrors(
        sPrefix,
        pointItem,
        instrItem,
        outputValue,
        options
      );

      // Assert
      const pass = DatasheetConstants.STATUS_PASS;
      const description = "Warning Limit not Exceeded";

      expect(tolExceeded).toEqual(false);
      expect(pointItem[`${sPrefix}status`]).toEqual(pass);
      expect(pointItem[`${sPrefix}statusicon`]).toEqual(pass);
      expect(pointItem[`${sPrefix}statusdesc`]).toEqual(description);
      expect(pointItem[`${sPrefix}error`]).toEqual(false);
    });

    it("Should return true and calculate error diff when output value exceeds all tolerance upper limits", async () => {
      // Arrange params
      const sPrefix = CalibrationPointConstants.CONDITION_ASFOUND;

      const options = {
        round: DatasheetConstants.ROUND_VALUE,
        places: DatasheetConstants.DEFAULT_PRECISION,
      };

      const value = generateRandomFloat(20, 30);
      const outputValue = toDisplayableValue(value, options);

      const app = await initializeApp();

      const instrItem = await loadInstrItem(app, TEST_WONUM);

      const pointItem = await loadCalibrationPointItem(
        app,
        TEST_WONUM,
        TEST_PLUSCWODSPOINTID
      );
      pointItem[`${sPrefix}status`] = DatasheetConstants.STATUS_FAIL;

      const expectedErrorList = [];

      for (let tol = 1; tol < 5; tol++) {
        instrItem[`tol${tol}status`] = DatasheetConstants.STATUS_FAIL;

        const low = generateRandomFloat(0, 10);
        const lowStr = toDisplayableValue(low, options);
        pointItem[`${sPrefix}tol${tol}lower`] = lowStr;

        const upper = generateRandomFloat(low, low + 10);
        const upperStr = toDisplayableValue(upper, options);
        pointItem[`${sPrefix}tol${tol}upper`] = upperStr;

        expectedErrorList.push(toDisplayableValue(value - upper, options));
      }

      // Act
      const dscalc = await setup();

      const tolExceeded = dscalc.calculateToleranceErrors(
        sPrefix,
        pointItem,
        instrItem,
        outputValue,
        options
      );

      // Assert
      const fail = DatasheetConstants.STATUS_FAIL;
      const description = "Warning Limit not Exceeded";

      expect(tolExceeded).toEqual(true);
      expect(pointItem[`${sPrefix}status`]).toEqual(fail);
      expect(pointItem[`${sPrefix}statusicon`]).toEqual(fail);
      expect(pointItem[`${sPrefix}statusdesc`]).toEqual(description);

      // Assert: should calculate the difference between value and the
      // upper limit and store as "error" label.
      expectedErrorList.forEach((err, tol) => {
        expect(pointItem[`${sPrefix}error${tol + 1}`]).toEqual(err);
      });
    });

    it("Should return WARNING status icon when output value exceeds all tolerance limit and status is unknown", async () => {
      // Arrange params
      const app = await initializeApp();
      const instrItem = await loadInstrItem(app, TEST_WONUM);

      const sPrefix = CalibrationPointConstants.CONDITION_ASFOUND;
      const options = {
        round: DatasheetConstants.ROUND_VALUE,
        places: DatasheetConstants.DEFAULT_PRECISION,
      };
      const outputValue = toDisplayableValue(2, options);

      const pointItem = await loadCalibrationPointItem(
        app,
        TEST_WONUM,
        TEST_PLUSCWODSPOINTID
      );
      pointItem[`${sPrefix}status`] = DatasheetConstants.STATUS_BROKEN;
      for (let tol = 1; tol < 5; tol++) {
        instrItem[`tol${tol}status`] = DatasheetConstants.STATUS_BROKEN;
        pointItem[`${sPrefix}tol${tol}lower`] = toDisplayableValue(0, options);
        pointItem[`${sPrefix}tol${tol}upper`] = toDisplayableValue(1, options);
      }

      // Act
      const dscalc = await setup();

      const tolExceeded = dscalc.calculateToleranceErrors(
        sPrefix,
        pointItem,
        instrItem,
        outputValue,
        options
      );

      // Assert
      const warning = DatasheetConstants.STATUS_WARNING;
      const broken = DatasheetConstants.STATUS_BROKEN;

      expect(tolExceeded).toEqual(true);
      expect(pointItem[`${sPrefix}status`]).toEqual(broken);
      expect(pointItem[`${sPrefix}statusicon`]).toEqual(warning);
    });

    it("Should return PASS status icon when output value exceeds all tolerance limit and status is unknown", async () => {
      // Arrange params
      const app = await initializeApp();
      const instrItem = await loadInstrItem(app, TEST_WONUM);

      const sPrefix = CalibrationPointConstants.CONDITION_ASFOUND;
      const options = {
        round: DatasheetConstants.ROUND_VALUE,
        places: DatasheetConstants.DEFAULT_PRECISION,
      };
      const outputValue = toDisplayableValue(2, options);

      const pointItem = await loadCalibrationPointItem(
        app,
        TEST_WONUM,
        TEST_PLUSCWODSPOINTID
      );
      pointItem[`${sPrefix}status`] = DatasheetConstants.STATUS_PASS;
      for (let tol = 1; tol < 5; tol++) {
        instrItem[`tol${tol}status`] = DatasheetConstants.STATUS_PASS;
        pointItem[`${sPrefix}tol${tol}lower`] = toDisplayableValue(0, options);
        pointItem[`${sPrefix}tol${tol}upper`] = toDisplayableValue(1, options);
      }

      // Act
      const dscalc = await setup();

      const tolExceeded = dscalc.calculateToleranceErrors(
        sPrefix,
        pointItem,
        instrItem,
        outputValue,
        options
      );

      // Assert
      const warning = DatasheetConstants.STATUS_PASS;
      const broken = DatasheetConstants.STATUS_PASS;

      expect(tolExceeded).toEqual(true);
      expect(pointItem[`${sPrefix}status`]).toEqual(broken);
      expect(pointItem[`${sPrefix}statusicon`]).toEqual(warning);
    });

    it("Should return true and calculate error diff when output value did not reached any lower tolerance limit", async () => {
      // Arrange params
      const sPrefix = CalibrationPointConstants.CONDITION_ASFOUND;

      const options = {
        round: DatasheetConstants.ROUND_VALUE,
        places: DatasheetConstants.DEFAULT_PRECISION,
      };

      const value = generateRandomFloat(0, 9);
      const outputValue = toDisplayableValue(value, options);

      const app = await initializeApp();

      const instrItem = await loadInstrItem(app, TEST_WONUM);

      const pointItem = await loadCalibrationPointItem(
        app,
        TEST_WONUM,
        TEST_PLUSCWODSPOINTID
      );
      pointItem[`${sPrefix}status`] = DatasheetConstants.STATUS_FAIL;

      const expectedErrorList = [];

      for (let tol = 1; tol < 5; tol++) {
        instrItem[`tol${tol}status`] = DatasheetConstants.STATUS_FAIL;

        const low = generateRandomFloat(10, 20);
        const lowStr = toDisplayableValue(low, options);
        pointItem[`${sPrefix}tol${tol}lower`] = lowStr;

        const higher = generateRandomFloat(low, low + 10);
        const higherStr = toDisplayableValue(higher, options);
        pointItem[`${sPrefix}tol${tol}upper`] = higherStr;

        expectedErrorList.push(toDisplayableValue(value - low, options));
      }

      // Act
      const dscalc = await setup();

      const tolExceeded = dscalc.calculateToleranceErrors(
        sPrefix,
        pointItem,
        instrItem,
        outputValue,
        options
      );

      // Assert
      const fail = DatasheetConstants.STATUS_FAIL;
      const description = "Warning Limit not Exceeded";

      expect(tolExceeded).toEqual(true);
      expect(pointItem[`${sPrefix}status`]).toEqual(fail);
      expect(pointItem[`${sPrefix}statusicon`]).toEqual(fail);
      expect(pointItem[`${sPrefix}statusdesc`]).toEqual(description);

      // Assert: should calculate the difference between value and the
      //  upper limit and store as "error" label.
      expectedErrorList.forEach((err, tol) => {
        expect(pointItem[`${sPrefix}error${tol + 1}`]).toEqual(err);
      });
    });

    it("Should set error tolerance as zero when output value is under tolerance bounds", async () => {
      // Arrange params
      const sPrefix = CalibrationPointConstants.CONDITION_ASFOUND;

      const options = {
        round: DatasheetConstants.ROUND_VALUE,
        places: DatasheetConstants.DEFAULT_PRECISION,
      };

      const value = generateRandomFloat(0, 9);
      const outputValue = toDisplayableValue(value, options);

      const app = await initializeApp();

      const instrItem = await loadInstrItem(app, TEST_WONUM);

      const pointItem = await loadCalibrationPointItem(
        app,
        TEST_WONUM,
        TEST_PLUSCWODSPOINTID
      );
      pointItem[`${sPrefix}status`] = DatasheetConstants.STATUS_FAIL;

      const expectedErrorList = [];

      for (let tol = 1; tol < 5; tol++) {
        instrItem[`tol${tol}status`] = DatasheetConstants.STATUS_FAIL;

        const low = value - 1;
        const lowStr = toDisplayableValue(low, options);
        pointItem[`${sPrefix}tol${tol}lower`] = lowStr;

        const higher = value + 1;
        const higherStr = toDisplayableValue(higher, options);
        pointItem[`${sPrefix}tol${tol}upper`] = higherStr;

        expectedErrorList.push(toDisplayableValue(0, options));
      }

      // Act
      const dscalc = await setup();

      const tolExceeded = dscalc.calculateToleranceErrors(
        sPrefix,
        pointItem,
        instrItem,
        outputValue,
        options
      );

      // Assert
      const pass = DatasheetConstants.STATUS_PASS;
      const description = "Warning Limit not Exceeded";

      expect(tolExceeded).toEqual(false);
      expect(pointItem[`${sPrefix}status`]).toEqual(pass);
      expect(pointItem[`${sPrefix}statusicon`]).toEqual(pass);
      expect(pointItem[`${sPrefix}statusdesc`]).toEqual(description);

      // Assert: should calculate the difference between value and the
      //  upper limit and store as "error" label.
      expectedErrorList.forEach((err, tol) => {
        expect(pointItem[`${sPrefix}error${tol + 1}`]).toEqual(err);
      });
    });
  });

  describe("calculatePrecision", () => {
    it("Should calculate decimals of 'as found' IO when prefix is ASFOUND", async () => {
      // Arrange
      const dscalc = await setup();

      // Arrange params
      const point = generatePoint({
        asfoundinput: 0.0007,
        asfoundoutput: 0.0007,
      });

      // Act
      const precision = dscalc.calculatePrecision(
        point,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(precision.input).toEqual(4);
      expect(precision.output).toEqual(4);
    });

    it("Should calculate decimals of 'as left' IO when prefix is ASLEFT", async () => {
      // Arrange datasheet calculation
      const dscalc = await setup();

      // Arrange params
      const point = generatePoint({
        asleftinput: 0.0007,
        asleftoutput: 0.0007,
      });

      // Act
      const precision = dscalc.calculatePrecision(
        point,
        CalibrationPointConstants.CONDITION_ASLEFT
      );

      // Assert
      expect(precision.input).toEqual(4);
      expect(precision.output).toEqual(4);
    });

    it("Should calculate decimals of default IO when prefix is empty", async () => {
      // Arrange datasheet calculation
      const dscalc = await setup();

      // Arrange params
      const point = generatePoint({
        inputvalue: 0.0007,
        outputvallue: 0.0007,
      });

      // Act
      const precision = dscalc.calculatePrecision(point, "");

      // Assert
      expect(precision.input).toEqual(4);
      expect(precision.output).toEqual(4);
    });

    it("Should return 0 when prefix is an invalid string option", async () => {
      // Arrange datasheet calculation
      const dscalc = await setup();

      // Arrange params
      const point = generatePoint({
        inputvalue: 0.0007,
        outputvallue: 0.0007,
      });

      // Act
      const precision = dscalc.calculatePrecision(point, "XXX");

      // Assert
      expect(precision.input).toEqual(0);
      expect(precision.output).toEqual(0);
    });

    it("Should return 0 when IO values are not defined", async () => {
      // Arrange datasheet calculation
      const dscalc = await setup();

      // Arrange params
      const point = generatePoint();

      // Act
      const precision = dscalc.calculatePrecision(
        point,
        CalibrationPointConstants.CONDITION_ASLEFT
      );

      // Assert
      expect(precision.input).toEqual(0);
      expect(precision.output).toEqual(0);
    });

    it("Should return 0 when IO values are not defined and prefix is empty", async () => {
      // Arrange datasheet calculation
      const dscalc = await setup();

      // Arrange params
      const point = generatePoint();

      // Act
      const precision = dscalc.calculatePrecision(point, "");

      // Assert
      expect(precision.input).toEqual(0);
      expect(precision.output).toEqual(0);
    });
  });

  describe("getPointTolPrecision", () => {
    it("Should calculate tol precision when plan type is ANALOG", async () => {
      // Arrange params
      const tolerror = DatasheetConstants.TOLERANCE.USE_INSTR_OUTPUT;
      const tolnplaces = 2;
      const outputprecision = 5;
      const pointItem = generatePoint({
        setpointvalue: 0.25,
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      });

      const actualPrecision = { input: 3, output: 3 };

      // Arrange app
      const app = await initializeApp();

      // Arrange dsconfig
      const dsconfig = await loadDsConfig(
        app,
        TEST_DSPLANNUM,
        TEST_REVISIONNUM
      );
      dsconfig.currentItem.tolerror = tolerror;
      dsconfig.currentItem.tolnplaces = tolnplaces;

      // Arrange asset function item
      const instrItem = await loadInstrItem(app, TEST_WONUM);
      instrItem.outputprecision = outputprecision;

      // Arrange datasheet calculation
      const dscalc = await setup(dsconfig.currentItem);

      // Spy
      const getTolPrecisionSpy = jest.spyOn(dscalc, "getTolPrecision");

      // Act
      const tolerancePrecision = dscalc.getPointTolPrecision(
        pointItem,
        instrItem,
        CalibrationPointConstants.CONDITION_ASFOUND,
        actualPrecision
      );

      // Assert
      expect(tolerancePrecision).toEqual(tolnplaces + outputprecision);
      expect(getTolPrecisionSpy).toHaveBeenCalled();
    });

    it("Should calculate decimal places of setpoint when plan type is DISCRETE", async () => {
      // Arrange datasheet calculation
      const dscalc = await setup();

      // Arrange params
      const point = generatePoint({
        plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
        asfoundsetpoint: 1.0007, // precision of 4 decimals
        setpointvalue: 1.00007, // precision of 5 decimals
      });

      // Spy
      const getTolPrecisionSpy = jest.spyOn(dscalc, "getTolPrecision");

      // Act
      const tolerancePrecision = dscalc.getPointTolPrecision(
        point,
        null,
        CalibrationPointConstants.CONDITION_ASFOUND,
        null
      );

      // Assert
      expect(tolerancePrecision).toEqual(4);
      expect(getTolPrecisionSpy).not.toHaveBeenCalled();
    });

    it("Should calculate decimal places of setpoint when plan type is empty", async () => {
      // Arrange datasheet calculation
      const dscalc = await setup();

      // Arrange params
      const point = generatePoint({
        plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
        asfoundsetpoint: 1.0007, // precision of 4 decimals
        setpointvalue: 1.00007, // precision of 5 decimals
      });

      // Spy
      const getTolPrecisionSpy = jest.spyOn(dscalc, "getTolPrecision");

      // Act
      const tolerancePrecision = dscalc.getPointTolPrecision(
        point,
        null,
        "",
        null
      );

      // Assert
      expect(tolerancePrecision).toEqual(5);
      expect(getTolPrecisionSpy).not.toHaveBeenCalled();
    });

    it("Should return 0 when plantype is neither ANALOG or DISCRETE", async () => {
      // Arrange datasheet calculation
      const dscalc = await setup();

      // Arrange params
      const point = generatePoint({
        plantype: "",
        asfoundsetpoint: 1.0007, // precision of 4 decimals
        setpointvalue: 1.00007, // precision of 5 decimals
      });

      // Spy
      const getTolPrecisionSpy = jest.spyOn(dscalc, "getTolPrecision");

      // Act
      const tolerancePrecision = dscalc.getPointTolPrecision(
        point,
        null,
        "",
        null
      );

      // Assert
      expect(tolerancePrecision).toEqual(0);
      expect(getTolPrecisionSpy).not.toHaveBeenCalled();
    });
  });

  describe("getTolPrecision", () => {
    it("Should return asset function output value when tolerror is USE_INSTR_OUTPUT_VALUE", async () => {
      // Arrange
      const tolerror = DatasheetConstants.TOLERANCE.USE_INSTR_OUTPUT;
      const tolnplaces = 2;

      // Arrange dsconfig
      const app = await initializeApp();
      const dsconfig = await loadDsConfig(
        app,
        TEST_DSPLANNUM,
        TEST_REVISIONNUM
      );

      dsconfig.currentItem.tolerror = tolerror;
      dsconfig.currentItem.tolnplaces = tolnplaces;

      // Arrange dscalc
      const dscalc = await setup(dsconfig.currentItem);

      // Arrange params
      const minOutputPrecision = 5;
      const actualOutputPrecision = 5;
      const actualInputPrecision = 5;

      // Act
      const tolerancePrecision = dscalc.getTolPrecision(
        minOutputPrecision,
        actualOutputPrecision,
        actualInputPrecision
      );

      // Assert
      expect(tolerancePrecision).toEqual(minOutputPrecision + tolnplaces);
    });

    it("Should return input precision when tolerror is USE_POINT_IO and actual input is higher than output", async () => {
      // Arrange
      const minOutputPrecision = null;
      const actualOutputPrecision = generateRandomInt(0, 10);
      const actualInputPrecision = generateRandomInt(11, 20);

      // Arrange dsconfig
      const app = await initializeApp();
      const dsconfig = await loadDsConfig(
        app,
        TEST_DSPLANNUM,
        TEST_REVISIONNUM
      );
      dsconfig.currentItem.tolerror = DatasheetConstants.TOLERANCE.USE_POINT_IO;

      // Arrange datasheet calculation
      const dscalc = await setup(dsconfig.currentItem);

      // Act
      const tolerancePrecision = dscalc.getTolPrecision(
        minOutputPrecision,
        actualOutputPrecision,
        actualInputPrecision
      );

      // Assert
      expect(actualOutputPrecision).not.toEqual(actualInputPrecision);
      expect(tolerancePrecision).toEqual(actualInputPrecision);
    });

    it("Should be output precision plus 1 when tolerror is USE_POINT_IO and actual input is lower than output", async () => {
      // Arrange
      const minOutputPrecision = null;
      const actualOutputPrecision = generateRandomInt(11, 20);
      const actualInputPrecision = generateRandomInt(0, 10);

      // Arrange datasheet configuration
      const app = await initializeApp();
      const dsconfig = await loadDsConfig(
        app,
        TEST_DSPLANNUM,
        TEST_REVISIONNUM
      );
      dsconfig.currentItem.tolerror = DatasheetConstants.TOLERANCE.USE_POINT_IO;

      // Arrange datasheet calculation
      const dscalc = await setup(dsconfig.currentItem);

      // Act
      const tolerancePrecision = dscalc.getTolPrecision(
        minOutputPrecision,
        actualOutputPrecision,
        actualInputPrecision
      );

      // Assert
      expect(actualOutputPrecision).not.toEqual(actualInputPrecision);
      expect(tolerancePrecision).toEqual(actualOutputPrecision + 1);
    });

    it("Should be output precision plus 1 when tolerror is USE_POINT_IO and actual input is equal to output", async () => {
      // Arrange params
      const minOutputPrecision = null;
      const actualOutputPrecision = generateRandomInt(0, 20);
      const actualInputPrecision = actualOutputPrecision;

      // Arrange datasheet configuration
      const app = await initializeApp();
      const dsconfig = await loadDsConfig(
        app,
        TEST_DSPLANNUM,
        TEST_REVISIONNUM
      );
      dsconfig.currentItem.tolerror = DatasheetConstants.TOLERANCE.USE_POINT_IO;

      // Arrange datasheet calculation
      const dscalc = await setup(dsconfig.currentItem);

      // Act
      const tolerancePrecision = dscalc.getTolPrecision(
        minOutputPrecision,
        actualOutputPrecision,
        actualInputPrecision
      );

      // Assert
      expect(actualOutputPrecision).toEqual(actualInputPrecision);
      expect(tolerancePrecision).toEqual(actualOutputPrecision + 1);
    });

    it("Should be min output precision when tolerror is null", async () => {
      // Arrange params
      const minOutputPrecision = 5;
      const actualOutputPrecision = 5;
      const actualInputPrecision = 5;

      // Arrange datasheet configuration
      const app = await initializeApp();
      const dsconfig = await loadDsConfig(
        app,
        TEST_DSPLANNUM,
        TEST_REVISIONNUM
      );
      dsconfig.currentItem.tolerror = null;

      // Arrange datasheet calculation
      const dscalc = await setup(dsconfig);

      // Act
      const tolerancePrecision = dscalc.getTolPrecision(
        minOutputPrecision,
        actualOutputPrecision,
        actualInputPrecision
      );

      // Assert
      expect(tolerancePrecision).toEqual(minOutputPrecision);
    });

    it("Should be min output precision when tolerror is different than Datasheet Tolerance Options", async () => {
      // Arrange params
      const minOutputPrecision = 5;
      const actualOutputPrecision = 5;
      const actualInputPrecision = 5;

      // Arrange datasheet configuration
      const app = await initializeApp();
      const dsconfig = await loadDsConfig(
        app,
        TEST_DSPLANNUM,
        TEST_REVISIONNUM
      );
      dsconfig.currentItem.tolerror = generateRandomInt(3, 100);

      // Arrange datasheet calculation
      const dscalc = await setup(dsconfig.currentItem);

      // Act
      const tolerancePrecision = dscalc.getTolPrecision(
        minOutputPrecision,
        actualOutputPrecision,
        actualInputPrecision
      );

      // Assert
      expect(tolerancePrecision).toEqual(minOutputPrecision);
    });
  });

  describe("getRoundOption", () => {
    it("Should return TRUNCATE value when dsconfig is null", async () => {
      // Arrange dsconfig
      const dscalc = await setup();

      // Act
      dscalc.setDsConfig(null);
      const roundOption = dscalc.getRoundOption("toltruncate");

      // Assert
      expect(roundOption).toEqual(DatasheetConstants.TRUNCATE_VALUE);
    });

    it("Should be truncate value option when attribute exist", async () => {
      // Arrange dsconfig
      const app = await initializeApp();
      const dsconfig = await loadDsConfig(
        app,
        TEST_DSPLANNUM,
        TEST_REVISIONNUM
      );
      dsconfig.currentItem.toltruncate = true;

      // Arrange dscalc
      const dscalc = await setup(dsconfig.currentItem);

      // Act
      const roundOption = dscalc.getRoundOption("toltruncate");

      // Assert
      expect(roundOption).toEqual(DatasheetConstants.TRUNCATE_VALUE);
    });

    it("Should be round value option when attribute does not exist", async () => {
      // Arrange dsconfig
      const app = await initializeApp();
      const dsconfig = await loadDsConfig(
        app,
        TEST_DSPLANNUM,
        TEST_REVISIONNUM
      );
      dsconfig.currentItem.toltruncate = false;

      // Arrange dscalc
      const dscalc = await setup(dsconfig.currentItem);

      // Act
      const roundOption = dscalc.getRoundOption("toltruncate");

      // Assert
      expect(roundOption).toEqual(DatasheetConstants.ROUND_VALUE);
    });
  });

  describe("minusZeroMakeUp", () => {
    it("Should return empty string when value is empty", async () => {
      // Arrange
      const dscalc = await setup();

      // Act
      const actual = dscalc.minusZeroMakeUp("");

      // Assert
      expect(actual).toEqual("");
    });

    it("Should keep value when it is an integer", async () => {
      // Arrange
      const dscalc = await setup();

      // Act
      const expected = generateRandomInt(
        1,
        10 ** DatasheetConstants.FRACTION_DIGITS_MAX
      );
      const actual = dscalc.minusZeroMakeUp(expected);

      // Assert
      expect(actual).toEqual(expected.toString());
    });

    it("Should truncate precision to baseline when fraction digits exceeds MAX limit", async () => {
      // Arrange
      const dscalc = await setup();

      // Act
      const value = "1.8189203704659658149876";
      const baseLine = DatasheetConstants.FRACTION_DIGITS_BASELINE;
      const expected = Number(value).toFixed(baseLine);
      const received = dscalc.minusZeroMakeUp(value);

      // Assert
      expect(value).not.toEqual(expected);
      expect(received).toEqual(expected);
    });

    it("Should keep value when fraction digits is lower thatn MAX limit", async () => {
      // Arrange
      const dscalc = await setup();

      for (
        let precision = 0;
        precision <= DatasheetConstants.FRACTION_DIGITS_MAX;
        precision++
      ) {
        // Act
        const expected = generateRandomFloat(1, 1, precision);
        const actual = dscalc.minusZeroMakeUp(expected);

        // Assert
        expect(actual).toEqual(expected.toString());
      }
    });

    it("Should truncate precision when fraction digits is zero", async () => {
      // Arrange
      const dscalc = await setup();

      // Act
      const actual = dscalc.minusZeroMakeUp("100");

      // Assert
      expect(actual).toEqual("100");
    });
  });

  describe("calculateTolerances", () => {
    const sPrefix = "asfound";
    const attrs = {
      inputFrom: 25.0,
      inputTo: 75.0,
      outputFrom: 4.0,
      outputTo: 20.0,
      opposite: true,
      instrInputSpan: 50.0,
      instrOutputSpan: 16.0,
    };
    describe("Discrete PlanType,", () => {
      it("Should calculate when toltype is null", async () => {
        const dscalc = await setup();
        const instr = generateInst();
        instr.tol1type = null;
        instr.sumTolEU = 1;
        instr.plantype = "DISCRETE";
        instr.outputrange = true;
        instr.tol1sumdirection = "-";
        instr.instrcalrangefrom = 200.0;
        instr.instrcalrangeto = 100.0;
        instr.instroutrangefrom = 10.0;
        instr.instroutrangeto = 20.0;
        instr.outputprecision = 2;
        instr.gbfrom1 = 1;
        instr.gbto1 = 1;
        instr.gbsumdirection1 = "-";
        instr.gbopposite1 = -1;

        const point = generatePoint({
          asfoundinput: 50,
          asfoundoutput: 15,
          setpointvalue: 20,
          plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
        });

        const options = {
          round: DatasheetConstants.ROUND_VALUE,
          places: 2,
        };

        dscalc.calculateTolerances(sPrefix, point, instr, attrs, options);
        expect(point.asfoundtol1lower).toEqual(null);
        expect(point.asfoundtol1upper).toEqual(null);
      });
      describe("toltype %SPAN", () => {
        it("Should calculate when outputrange is true", async () => {
          const dscalc = await setup();
          const instr = generateInst();
          instr.tol1type = "%SPAN";
          instr.plantype = "DISCRETE";
          instr.outputrange = true;
          instr.tol1sumdirection = "-";
          instr.instrcalrangefrom = 200.0;
          instr.instrcalrangeto = 100.0;
          instr.instroutrangefrom = 10.0;
          instr.instroutrangeto = 20.0;
          instr.outputprecision = 2;
          instr.gbfrom1 = 1;
          instr.gbto1 = 1;
          instr.gbsumdirection1 = "-";
          instr.gbopposite1 = -1;

          const point = generatePoint({
            asfoundinput: 50,
            asfoundoutput: 15,
            setpointvalue: 20,
            plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
          });

          const options = {
            round: DatasheetConstants.ROUND_VALUE,
            places: 2,
          };

          dscalc.calculateTolerances(sPrefix, point, instr, attrs, options);
          expect(point.asfoundtol1lower).toEqual("320.00");
          expect(point.asfoundtol1upper).toEqual("320.00");
        });
        it("Should calculate when outputrange is false", async () => {
          const dscalc = await setup();
          const instr = generateInst();
          instr.tol1type = "%SPAN";
          instr.plantype = "DISCRETE";
          instr.outputrange = false;
          instr.tol1sumdirection = "-";
          instr.instrcalrangefrom = 200.0;
          instr.instrcalrangeto = 100.0;
          instr.instroutrangefrom = 10.0;
          instr.instroutrangeto = 20.0;
          instr.outputprecision = 2;
          instr.gbfrom1 = 1;
          instr.gbto1 = 1;
          instr.gbsumdirection1 = "-";
          instr.gbopposite1 = -1;

          const point = generatePoint({
            asfoundinput: 50,
            asfoundoutput: 15,
            setpointvalue: 20,
            plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
          });

          const options = {
            round: DatasheetConstants.ROUND_VALUE,
            places: 2,
          };

          dscalc.calculateTolerances(sPrefix, point, instr, attrs, options);
          expect(point.asfoundtol1lower).toEqual("20.00");
          expect(point.asfoundtol1upper).toEqual("20.00");
        });
      });
      describe("toltype EU", () => {
        it("Should calculate when outputrange is true", async () => {
          const dscalc = await setup();
          const instr = generateInst();
          instr.tol1type = "EU";
          instr.plantype = "DISCRETE";
          instr.outputrange = true;
          instr.tol1sumdirection = "-";
          instr.instrcalrangefrom = 200.0;
          instr.instrcalrangeto = 100.0;
          instr.instroutrangefrom = 10.0;
          instr.instroutrangeto = 20.0;
          instr.outputprecision = 2;
          instr.gbfrom1 = 1;
          instr.gbto1 = 1;
          instr.gbsumdirection1 = "-";
          instr.gbopposite1 = -1;

          const point = generatePoint({
            asfoundinput: 50,
            asfoundoutput: 15,
            setpointvalue: 20,
            plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
          });

          const options = {
            round: DatasheetConstants.ROUND_VALUE,
            places: 2,
          };

          dscalc.calculateTolerances(sPrefix, point, instr, attrs, options);
          expect(point.asfoundtol1lower).toEqual("20.00");
          expect(point.asfoundtol1upper).toEqual("20.00");
        });
        it("Should calculate when outputrange is false", async () => {
          const dscalc = await setup();
          const instr = generateInst();
          instr.tol1type = "EU";
          instr.plantype = "DISCRETE";
          instr.outputrange = false;
          instr.tol1sumdirection = "-";
          instr.instrcalrangefrom = 200.0;
          instr.instrcalrangeto = 100.0;
          instr.instroutrangefrom = 10.0;
          instr.instroutrangeto = 20.0;
          instr.outputprecision = 2;
          instr.gbfrom1 = 1;
          instr.gbto1 = 1;
          instr.gbsumdirection1 = "-";
          instr.gbopposite1 = -1;

          const point = generatePoint({
            asfoundinput: 50,
            asfoundoutput: 15,
            setpointvalue: 20,
            plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
          });

          const options = {
            round: DatasheetConstants.ROUND_VALUE,
            places: 2,
          };

          dscalc.calculateTolerances(sPrefix, point, instr, attrs, options);
          expect(point.asfoundtol1lower).toEqual("20.00");
          expect(point.asfoundtol1upper).toEqual("20.00");
        });
      });
    });
    describe("Analog PlanType,", () => {
      it("Should calculate when toltype is EU", async () => {
        const dscalc = await setup();
        const instr = generateInst();
        instr.tol1type = "EU";
        instr.plantype = "ANALOG";
        instr.outputrange = true;
        instr.tol1sumdirection = "-";
        instr.instrcalrangefrom = 200.0;
        instr.instrcalrangeto = 100.0;
        instr.instroutrangefrom = 10.0;
        instr.instroutrangeto = 20.0;
        instr.outputprecision = 2;
        instr.gbfrom1 = 1;
        instr.gbto1 = 1;
        instr.gbsumdirection1 = "-";
        instr.gbopposite1 = -1;

        const point = generatePoint({
          asfoundinput: 50,
          asfoundoutput: 15,
          plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        });

        const options = {
          round: DatasheetConstants.ROUND_VALUE,
          places: 2,
        };

        dscalc.calculateTolerances(sPrefix, point, instr, attrs, options);
        expect(point.asfoundtol1lower).toEqual("25.00");
        expect(point.asfoundtol1upper).toEqual("25.00");
      });
      it("Should calculate when toltype is EU and instr limits are clipped", async () => {
        const dscalc = await setup();
        const instr = generateInst();
        instr.outputrange = false;
        instr.tol1type = "EU";
        instr.plantype = "ANALOG";
        instr.tol1sumdirection = "-";
        instr.instrcalrangefrom = 200.0;
        instr.instrcalrangeto = 100.0;
        instr.instroutrangefrom = 10.0;
        instr.instroutrangeto = 20.0;
        instr.outputprecision = 2;
        instr.gbfrom1 = 1;
        instr.gbto1 = 1;
        instr.gbsumdirection1 = "-";
        instr.gbopposite1 = -1;
        instr.cliplimits = true;

        const point = generatePoint({
          asfoundinput: 50,
          asfoundoutput: 15,
          plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        });

        const options = {
          round: DatasheetConstants.ROUND_VALUE,
          places: 2,
        };

        dscalc.calculateTolerances(sPrefix, point, instr, attrs, options);
        expect(point.asfoundtol1lower).toEqual("20.00");
        expect(point.asfoundtol1upper).toEqual("20.00");
      });
    });
  });

  describe("calculateTolForAnalogOrDiscrete", () => {
    const sPrefix = "asfound";
    describe("Discrete PlanType", () => {
      it("Should calculate tol correctly for squared instr", async () => {
        const app = await initializeApp();
        const instr = await loadInstrItem(app, TEST_WONUM);
        instr.squared = true;
        const dscalc = await setup();
        const point = generatePoint({
          asfoundinput: 0.7,
          asfoundoutput: 0.8,
          plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
        });
        const result = dscalc.calculateTolForAnalogOrDiscrete(
          sPrefix,
          point,
          instr
        );
        expect(result).toEqual(false);
      });
      it("Should calculate tol correctly for square rooted instr", async () => {
        const app = await initializeApp();
        const instr = await loadInstrItem(app, TEST_WONUM);
        instr.squareroot = true;
        const dscalc = await setup();
        const point = generatePoint({
          asfoundinput: 0.7,
          asfoundoutput: 0.8,
          plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
        });
        const result = dscalc.calculateTolForAnalogOrDiscrete(
          sPrefix,
          point,
          instr
        );
        expect(result).toEqual(false);
      });
      it("Should calculate tol correctly for regular instr when outputrange is true", async () => {
        const app = await initializeApp();
        const instr = await loadInstrItem(app, TEST_WONUM);
        instr.outputrange = true;
        instr.tol1type = "%SPAN";
        const dscalc = await setup();
        const point = generatePoint({
          asfoundinput: 0.7,
          asfoundoutput: 0.8,
          plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
        });
        const result = dscalc.calculateTolForAnalogOrDiscrete(
          sPrefix,
          point,
          instr
        );
        expect(result).toEqual(false);
      });
      it("Should calculate tol correctly for regular instr when outputrange is false", async () => {
        const app = await initializeApp();
        const instr = await loadInstrItem(app, TEST_WONUM);
        instr.tol1type = "%SPAN";
        const dscalc = await setup();
        const point = generatePoint({
          asfoundinput: 0.7,
          asfoundoutput: 0.8,
          plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
        });
        const result = dscalc.calculateTolForAnalogOrDiscrete(
          sPrefix,
          point,
          instr
        );
        expect(result).toEqual(false);
      });

      it("Should reset fail and pass tags when point is changed", async () => {
        const app = await initializeApp();
        const instr = await loadInstrItem(app, TEST_WONUM);
        const dscalc = await setup();
        const point = generatePoint({
          asfoundinput: 0.7,
          asfoundoutput: 0.8,
          isChanged: true,
          plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
          asfoundfail: true,
          asfoundpass: true,
        });
        dscalc.calculateTolForAnalogOrDiscrete(sPrefix, point, instr);
        expect(point.asfoundfail).toEqual(false);
        expect(point.asfoundpass).toEqual(false);
      });
    });

    describe("Analog PlanType", () => {
      it("Should calculate tol correctly for squared instr", async () => {
        const app = await initializeApp();
        const instr = await loadInstrItem(app, TEST_WONUM);
        instr.squared = true;
        const dscalc = await setup();
        const point = generatePoint({
          asfoundinput: 0.7,
          asfoundoutput: 0.8,
          plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        });
        const result = dscalc.calculateTolForAnalogOrDiscrete(
          sPrefix,
          point,
          instr
        );
        expect(result).toEqual(false);
      });
      it("Should calculate tol correctly for square root instr", async () => {
        const app = await initializeApp();
        const instr = await loadInstrItem(app, TEST_WONUM);
        instr.outputprecision = 11;
        instr.squareroot = true;
        const dscalc = await setup();
        const point = generatePoint({
          asfoundinput: 0.7,
          asfoundoutput: 0.8,
          plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        });
        const result = dscalc.calculateTolForAnalogOrDiscrete(
          sPrefix,
          point,
          instr
        );
        expect(result).toEqual(false);
      });
      it("Should calculate tol correctly for regular instr for SPAN tol type", async () => {
        const app = await initializeApp();
        const instr = await loadInstrItem(app, TEST_WONUM);
        instr.outputprecision = 11;
        instr.tol1type = "%SPAN";
        const dscalc = await setup();
        const point = generatePoint({
          asfoundinput: 0.7,
          asfoundoutput: 0.8,
          plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        });
        const result = dscalc.calculateTolForAnalogOrDiscrete(
          sPrefix,
          point,
          instr
        );
        expect(result).toEqual(false);
        const result2 = dscalc.calculateTolForAnalogOrDiscrete(
          "",
          point,
          instr
        );
        expect(result2).toEqual(false);
      });
      it("Should calculate tol correctly for regular instr for EU tol type", async () => {
        const app = await initializeApp();
        const instr = await loadInstrItem(app, TEST_WONUM);
        instr.outputprecision = 11;
        instr.tol1type = "EU";
        instr.nonlinear = true;
        const dscalc = await setup();
        const point = generatePoint({
          asfoundinput: 0.7,
          asfoundoutput: 0.8,
          plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        });
        const result = dscalc.calculateTolForAnalogOrDiscrete(
          sPrefix,
          point,
          instr
        );
        expect(result).toEqual(false);
      });
      it("Should calculate tol correctly for regular instr for URV tol type", async () => {
        const app = await initializeApp();
        const instr = await loadInstrItem(app, TEST_WONUM);
        instr.outputprecision = 11;
        instr.tol1type = "%URV";
        const dscalc = await setup();
        const point = generatePoint({
          asfoundinput: 0.7,
          asfoundoutput: 0.8,
          plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        });
        const result = dscalc.calculateTolForAnalogOrDiscrete(
          sPrefix,
          point,
          instr
        );
        expect(result).toEqual(false);
      });
      it("Should calculate tol correctly for regular instr for Reading tol type with summed calculations", async () => {
        const app = await initializeApp();
        const instr = await loadInstrItem(app, TEST_WONUM);
        instr.outputprecision = 11;
        instr.tol1type = "%READING";
        instr.tol1sumread = 1;
        const dscalc = await setup();
        const point = generatePoint({
          asfoundinput: 0.7,
          asfoundoutput: 0.8,
          plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        });
        const result = dscalc.calculateTolForAnalogOrDiscrete(
          sPrefix,
          point,
          instr
        );
        expect(result).toEqual(false);
      });
      it("Should calculate tol correctly for regular instr for null tol type with summed calculations", async () => {
        const app = await initializeApp();
        const instr = await loadInstrItem(app, TEST_WONUM);
        instr.outputprecision = 11;
        instr.tol1type = null;
        instr.tol1sumread = 1;
        const dscalc = await setup();
        const point = generatePoint({
          asfoundinput: 0.7,
          asfoundoutput: 0.8,
          plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        });
        const result = dscalc.calculateTolForAnalogOrDiscrete(
          sPrefix,
          point,
          instr
        );
        expect(result).toEqual(false);
      });
      it("Should calculate tol correctly for regular instr for Reading tol type without summed calculations", async () => {
        const app = await initializeApp();
        const instr = await loadInstrItem(app, TEST_WONUM);
        instr.outputprecision = 11;
        instr.tol1type = "%READING";
        const dscalc = await setup();
        const point = generatePoint({
          asfoundinput: 0.7,
          asfoundoutput: 0.8,
          plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        });
        const result = dscalc.calculateTolForAnalogOrDiscrete(
          sPrefix,
          point,
          instr
        );
        expect(result).toEqual(false);
      });
      it("Should calculate tol correctly for regular instr when output range is true", async () => {
        const app = await initializeApp();
        const instr = await loadInstrItem(app, TEST_WONUM);
        instr.outputprecision = 11;
        instr.tol1type = "%SPAN";
        instr.outputrange = "true";
        const dscalc = await setup();
        const point = generatePoint({
          asfoundinput: 0.7,
          asfoundoutput: 0.8,
          plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        });
        const result = dscalc.calculateTolForAnalogOrDiscrete(
          sPrefix,
          point,
          instr
        );
        expect(result).toEqual(false);
      });
    });

    it("Should return false when prefix is empty", async () => {
      const app = await initializeApp();
      const instr = await loadInstrItem(app, TEST_WONUM);
      const dscalc = await setup();
      const point = generatePoint({
        asfoundinput: 0.7,
        asfoundoutput: false,
        plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
      });
      instr.nonlinear = false;
      const result = dscalc.calculateTolForAnalogOrDiscrete("", point, instr);
      expect(result).toEqual(false);
    });

    it("Should return undefined when only input was filled and instr is not nonlinear", async () => {
      const app = await initializeApp();
      const instr = await loadInstrItem(app, TEST_WONUM);
      const dscalc = await setup();
      const point = generatePoint({
        asfoundinput: 0.7,
        asfoundoutput: false,
        plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
      });
      instr.nonlinear = false;
      const result = dscalc.calculateTolForAnalogOrDiscrete(
        sPrefix,
        point,
        instr
      );
      expect(result).toEqual(undefined);
    });
    it("Should return undefined when input is invalid and instr is analog", async () => {
      const app = await initializeApp();
      const instr = await loadInstrItem(app, TEST_WONUM);
      const dscalc = await setup();
      const point = generatePoint({
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      });
      instr.nonlinear = true;
      const result = dscalc.calculateTolForAnalogOrDiscrete(
        sPrefix,
        point,
        instr
      );
      expect(result).toEqual(false);
    });
  });

  describe("getRoundingOptionsObject", () => {
    it("Should return rounding options when all arguments are provided.", async () => {
      const dscalc = await setup();
      const app = await initializeApp();
      const item = generatePoint({
        asfoundinput: -2.8,
        asfoundoutput: -0.98,
        inputvalue: -3.0,
        outputvalue: 0.0,
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      });

      const conditionPrefix = "input";
      const instr = await loadInstrItem(app, TEST_WONUM);
      instr.nonlinear = true;

      const result = dscalc.getRoundingOptionsObject(
        item,
        conditionPrefix,
        instr
      );
      expect(result.places).toEqual(2);
      expect(result.round).toEqual(0);
    });
  });

  describe("calculateAssetError", () => {
    const options = {
      round: DatasheetConstants.ROUND_VALUE,
      places: 2,
    };

    it("Should return NaN when invalid input or output value is passed", async () => {
      //Arrange
      const app = await initializeApp();
      const instr = await loadInstrItem(app, TEST_WONUM);
      instr.nonlinear = true;
      const dscalc = await setup();

      const point = generatePoint({
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      });
      //Act
      const assetError = dscalc.calculateAssetError(
        CalibrationPointConstants.CONDITION_ASFOUND,
        point,
        instr,
        "abc",
        NaN,
        null,
        null,
        null,
        options
      );

      //Assert
      expect(assetError).toEqual("NaN");
      expect(point["asfoundouterror"]).toEqual("NaN");
    });

    describe("plantype = discrete", () => {
      it("Should calculate the correct error.", async () => {
        //Arrange
        const app = await initializeApp();
        const instr = await loadInstrItem(app, TEST_WONUM);
        instr.nonlinear = true;
        const dscalc = await setup();

        const point = generatePoint({
          asfoundinput: 0.7,
          asfoundoutput: 0.8,
          plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
        });

        //Act
        const assetError = dscalc.calculateAssetError(
          CalibrationPointConstants.CONDITION_ASFOUND,
          point,
          instr,
          point.asfoundinput,
          point.asfoundoutput,
          null,
          null,
          null,
          options
        );

        //Assert
        expect(assetError).toEqual("0.10");
        expect(point["asfoundouterror"]).toEqual("0.10");
      });
    });

    describe("plantype = analog and instrument = non-linear", () => {
      it("Should calculate the correct error.", async () => {
        //Arrange
        //const app = await initializeApp();
        const instr = generateInst({
          nonlinear: true,
          squared: true,
        });
        const dscalc = await setup();

        const point = generatePoint({
          asfoundinput: 0.7,
          asfoundoutput: 0.8,
          inputvalue: 0.7,
          outputvalue: 0.8,
          plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        });

        //Act
        const assetError = dscalc.calculateAssetError(
          CalibrationPointConstants.CONDITION_ASFOUND,
          point,
          instr,
          point.asfoundinput,
          point.asfoundoutput,
          null,
          null,
          null,
          options
        );

        //Assert
        expect(assetError).toEqual("0.00");
        expect(point["asfoundouterror"]).toEqual("0.00");
      });
    });

    describe("plantype = analog and instrument = linear", () => {
      const attrsCI1209 = {
        inputFrom: 25.0,
        inputTo: 75.0,
        outputFrom: 4.0,
        outputTo: 20.0,
        opposite: true,
        instrInputSpan: 50.0,
        instrOutputSpan: 16.0,
      };

      describe("instrument is squared", () => {
        it("Should calculate the correct error when inputValue is zero", async () => {
          //Arrange
          //const app = await initializeApp();
          const instr = generateInst({
            nonlinear: false,
            squared: true,
          });
          const dscalc = await setup();

          const attrsEUIWO2 = {
            inputFrom: 0,
            inputTo: 100.0,
            outputFrom: 4.0,
            outputTo: 20.0,
            opposite: true,
            instrInputSpan: 100.0,
            instrOutputSpan: 16.0,
          };

          const point = generatePoint({
            asfoundinput: 0,
            asfoundoutput: 4.01,
            inputvalue: 0,
            outputvalue: 4.01,
            plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
          });

          //Act
          const assetError = dscalc.calculateAssetError(
            CalibrationPointConstants.CONDITION_ASFOUND,
            point,
            instr,
            point.asfoundinput,
            point.asfoundoutput,
            attrsEUIWO2,
            null,
            null,
            options
          );

          //Assert
          expect(assetError).toEqual("0.01");
          expect(point["asfoundouterror"]).toEqual("0.01");
        });

        it("Should calculate the correct error when inputValue is positive", async () => {
          //Arrange
          //const app = await initializeApp();
          const instr = generateInst({
            nonlinear: false,
            squared: true,
          });
          const dscalc = await setup();

          const point = generatePoint({
            asfoundinput: 26,
            asfoundoutput: 6,
            inputvalue: 26,
            outputvalue: 6,
            plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
          });

          //Act
          const assetError = dscalc.calculateAssetError(
            CalibrationPointConstants.CONDITION_ASFOUND,
            point,
            instr,
            point.asfoundinput,
            point.asfoundoutput,
            attrsCI1209,
            null,
            null,
            options
          );

          //Assert
          expect(assetError).toEqual("1.99");
          expect(point["asfoundouterror"]).toEqual("1.99");
        });

        it("Should calculate the correct error when inputValue is negative", async () => {
          //Arrange
          //const app = await initializeApp();
          const instr = generateInst({
            nonlinear: false,
            squared: true,
          });
          const dscalc = await setup();

          const attrs1383 = {
            inputFrom: -5.0,
            inputTo: 500.0,
            outputFrom: 0.0,
            outputTo: 10.0,
            opposite: true,
            instrInputSpan: 505.0,
            instrOutputSpan: 10.0,
          };

          const point = generatePoint({
            asfoundinput: -2.8,
            asfoundoutput: -0.98,
            inputvalue: -3.0,
            outputvalue: 0.0,
            plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
          });

          //Act
          const assetError = dscalc.calculateAssetError(
            CalibrationPointConstants.CONDITION_ASFOUND,
            point,
            instr,
            point.asfoundinput,
            point.asfoundoutput,
            attrs1383,
            null,
            null,
            options
          );

          //Assert
          expect(assetError).toEqual("-0.98");
          expect(point["asfoundouterror"]).toEqual("-0.98");
        });
      });

      describe("instrument is squarerooted", () => {
        it("Should calculate the correct error when instr is square rooted and inputValue is zero", async () => {
          //Arrange
          //const app = await initializeApp();
          const instr = generateInst({
            nonlinear: false,
            squareroot: true,
          });
          const dscalc = await setup();

          const attrsSUMSQRTIWO = {
            inputFrom: 0,
            inputTo: 500.0,
            outputFrom: 0.0,
            outputTo: 10.0,
            opposite: true,
            instrInputSpan: 500.0,
            instrOutputSpan: 10.0,
          };

          const point = generatePoint({
            asfoundinput: 0.0,
            asfoundoutput: 0.45,
            inputvalue: 0.0,
            outputvalue: 0.0,
            plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
          });

          //Act
          const assetError = dscalc.calculateAssetError(
            CalibrationPointConstants.CONDITION_ASFOUND,
            point,
            instr,
            point.asfoundinput,
            point.asfoundoutput,
            attrsSUMSQRTIWO,
            null,
            null,
            options
          );

          //Assert
          expect(assetError).toEqual("0.45");
          expect(point["asfoundouterror"]).toEqual("0.45");
        });

        it("Should calculate the correct error when instr is square rooted and inputValue is positive", async () => {
          //Arrange
          //const app = await initializeApp();
          const instr = generateInst({
            nonlinear: false,
            squareroot: true,
          });
          const dscalc = await setup();

          const attrsSUMSQRTIWO = {
            inputFrom: 0,
            inputTo: 500.0,
            outputFrom: 0.0,
            outputTo: 10.0,
            opposite: true,
            instrInputSpan: 500.0,
            instrOutputSpan: 10.0,
          };

          const point = generatePoint({
            asfoundinput: 150.0,
            asfoundoutput: 5.48,
            inputvalue: 150.0,
            outputvalue: 5.48,
            plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
          });

          //Act
          const assetError = dscalc.calculateAssetError(
            CalibrationPointConstants.CONDITION_ASFOUND,
            point,
            instr,
            point.asfoundinput,
            point.asfoundoutput,
            attrsSUMSQRTIWO,
            null,
            null,
            options
          );

          //Assert
          expect(assetError).toEqual("0.00");
          expect(point["asfoundouterror"]).toEqual("0.00");
        });

        it("Should calculate the correct error when instr is square rooted and inputValue is negative", async () => {
          //Arrange
          //const app = await initializeApp();
          const instr = generateInst({
            nonlinear: false,
            squareroot: true,
          });
          const dscalc = await setup();

          const attrs1382 = {
            inputFrom: -5.0,
            inputTo: -500.0,
            outputFrom: 0.0,
            outputTo: 10.0,
            opposite: true,
            instrInputSpan: 505.0,
            instrOutputSpan: 10.0,
          };

          const point = generatePoint({
            asfoundinput: -3.0,
            asfoundoutput: -1.0,
            inputvalue: -3.0,
            outputvalue: -0.77,
            plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
          });

          //Act
          const assetError = dscalc.calculateAssetError(
            CalibrationPointConstants.CONDITION_ASFOUND,
            point,
            instr,
            point.asfoundinput,
            point.asfoundoutput,
            attrs1382,
            null,
            null,
            options
          );

          //Assert
          expect(assetError).toEqual("-0.23");
          expect(point["asfoundouterror"]).toEqual("-0.23");
        });
      });

      describe("instrument is neither squared nor square-rooted", () => {
        const attrsURVNIWO = {
          inputFrom: -500.0,
          inputTo: 500.0,
          outputFrom: 0.0,
          outputTo: 10.0,
          opposite: false,
          instrInputSpan: 1000.0,
          instrOutputSpan: 10.0,
        };

        const optionsURVNIWO = {
          round: DatasheetConstants.ROUND_VALUE,
          places: 3,
        };

        it("Should calculate the correct error when inputValue is zero", async () => {
          //Arrange
          //const app = await initializeApp();
          const instr = generateInst({
            nonlinear: false,
            squareroot: false,
          });
          const dscalc = await setup();

          const point = generatePoint({
            asfoundinput: 0.0,
            asfoundoutput: 5.14,
            inputvalue: 0.0,
            outputvalue: 5.0,
            plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
          });

          //Act
          const assetError = dscalc.calculateAssetError(
            CalibrationPointConstants.CONDITION_ASFOUND,
            point,
            instr,
            point.asfoundinput,
            point.asfoundoutput,
            attrsURVNIWO,
            null,
            null,
            optionsURVNIWO
          );

          //Assert
          expect(assetError).toEqual("0.140");
          expect(point["asfoundouterror"]).toEqual("0.140");
        });

        it("Should calculate the correct error when inputValue is positive", async () => {
          //Arrange
          //const app = await initializeApp();
          const instr = generateInst({
            nonlinear: false,
            squareroot: false,
          });
          const dscalc = await setup();

          const point = generatePoint({
            asfoundinput: 251.0,
            asfoundoutput: 7.69,
            inputvalue: 250.0,
            outputvalue: 7.5,
            plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
          });

          //Act
          const assetError = dscalc.calculateAssetError(
            CalibrationPointConstants.CONDITION_ASFOUND,
            point,
            instr,
            point.asfoundinput,
            point.asfoundoutput,
            attrsURVNIWO,
            null,
            null,
            optionsURVNIWO
          );

          //Assert
          expect(assetError).toEqual("0.180");
          expect(point["asfoundouterror"]).toEqual("0.180");
        });

        it("Should calculate the correct error when datasheet isOpposite", async () => {
          //Arrange

          const optionsURVNIWO = {
            round: DatasheetConstants.ROUND_VALUE,
            places: 2,
          };
          //const app = await initializeApp();
          const instr = generateInst({
            nonlinear: false,
            squareroot: false,
            squared: false,
          });
          const dscalc = await setup();

          const point = generatePoint({
            asfoundinput: 9.3,
            asfoundoutput: 20.1,
            inputvalue: 10,
            outputvalue: 19,
            plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
          });

          const instrRange = {
            instrcalrangefrom: 200.0,
            instrcalrangeto: 0.0,
            instroutrangefrom: 0,
            instroutrangeto: 20,
          };

          const attributes = dscalc.getDirection(instrRange);

          //Act
          const assetError = dscalc.calculateAssetError(
            CalibrationPointConstants.CONDITION_ASFOUND,
            point,
            instr,
            point.asfoundinput,
            point.asfoundoutput,
            attributes,
            true,
            null,
            optionsURVNIWO
          );

          //Assert
          expect(assetError).toEqual("1.03");
          expect(point["asfoundouterror"]).toEqual("1.03");
        });

        it("Should calculate the correct error when inputValue is negative", async () => {
          //Arrange
          //const app = await initializeApp();
          const instr = generateInst({
            nonlinear: false,
            squareroot: false,
          });
          const dscalc = await setup();

          const point = generatePoint({
            asfoundinput: -500.0,
            asfoundoutput: 0.02,
            inputvalue: -500.0,
            outputvalue: 0.0,
            plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
          });

          //Act
          const assetError = dscalc.calculateAssetError(
            CalibrationPointConstants.CONDITION_ASFOUND,
            point,
            instr,
            point.asfoundinput,
            point.asfoundoutput,
            attrsURVNIWO,
            null,
            null,
            optionsURVNIWO
          );

          //Assert
          expect(assetError).toEqual("0.020");
          expect(point["asfoundouterror"]).toEqual("0.020");
        });
      });
    });
  });

  describe("getAssetPrecision", () => {
    it("Should return correct precision for asset errors", async () => {
      // Arrange
      const app = await initializeApp();

      const dsconfig = await loadDsConfig(
        app,
        TEST_DSPLANNUM,
        TEST_REVISIONNUM
      );
      dsconfig.currentItem.asseterror = 1;
      dsconfig.currentItem.assetnplaces = 2;
      const dscalc = new DatasheetCalculation(dsconfig.currentItem);

      const minOutputPrecision = 2;
      const actualPrecision = 1;

      // Act
      const precision = dscalc.getAssetPrecision(
        minOutputPrecision,
        actualPrecision
      );

      // Assert
      expect(precision).toEqual(4);
    });
    it("Should return correct precision for precision errors where input is less than output", async () => {
      // Arrange
      const app = await initializeApp();

      const dsconfig = await loadDsConfig(
        app,
        TEST_DSPLANNUM,
        TEST_REVISIONNUM
      );

      const actualPrecision = {
        input: 1,
        output: 2,
      };
      dsconfig.currentItem.asseterror = 2;
      dsconfig.currentItem.assetnplaces = 2;
      const dscalc = new DatasheetCalculation(dsconfig.currentItem);

      const minOutputPrecision = 7;

      // Act
      const precision = dscalc.getAssetPrecision(
        minOutputPrecision,
        actualPrecision
      );

      // Assert
      expect(precision).toEqual(2);
    });
    it("Should return correct precision for precision errors where output is less than input", async () => {
      // Arrange
      const app = await initializeApp();

      const dsconfig = await loadDsConfig(
        app,
        TEST_DSPLANNUM,
        TEST_REVISIONNUM
      );

      const actualPrecision = {
        input: 2,
        output: 1,
      };
      dsconfig.currentItem.asseterror = 2;
      dsconfig.currentItem.assetnplaces = 2;
      const dscalc = new DatasheetCalculation(dsconfig.currentItem);

      const minOutputPrecision = 7;

      // Act
      const precision = dscalc.getAssetPrecision(
        minOutputPrecision,
        actualPrecision
      );

      // Assert
      expect(precision).toEqual(2);
    });

    it("Should return correct precision for default assetError values", async () => {
      // Arrange
      const app = await initializeApp();

      const dsconfig = await loadDsConfig(
        app,
        TEST_DSPLANNUM,
        TEST_REVISIONNUM
      );

      const actualPrecision = {
        input: 1,
        output: 2,
      };
      dsconfig.currentItem.asseterror = 4;
      dsconfig.currentItem.assetnplaces = 2;
      const dscalc = new DatasheetCalculation(dsconfig.currentItem);

      const minOutputPrecision = 2;

      // Act
      const precision = dscalc.getAssetPrecision(
        minOutputPrecision,
        actualPrecision
      );

      // Assert
      expect(precision).toEqual(2);
    });
  });

  describe("getDirection", () => {
    it("Should return correct attributes for Opposite Direction, Input Increasing and Output Decreasing", async () => {
      //Arrange
      //const app = await initializeApp();
      const dscalc = await setup();

      const instrRange = {
        instrcalrangefrom: 0,
        instrcalrangeto: 10,
        instroutrangefrom: 10,
        instroutrangeto: 0,
      };

      const expectedAttrs = {
        inputFrom: 0,
        inputTo: 10,
        outputFrom: 0,
        outputTo: 10,
        opposite: true,
        instrInputSpan: 10,
        instrOutputSpan: 10,
      };

      //Act
      const attrs = dscalc.getDirection(instrRange);

      //Assert
      expect(attrs).toEqual(expectedAttrs);
    });

    it("Should return correct attributes for Opposite Direction Input Decreasing and Output Increasing", async () => {
      //Arrange
      //const app = await initializeApp();
      const dscalc = await setup();

      const instrRange = {
        instrcalrangefrom: 5,
        instrcalrangeto: 1,
        instroutrangefrom: 2,
        instroutrangeto: 6,
      };

      const expectedAttrs = {
        inputFrom: 1,
        inputTo: 5,
        outputFrom: 2,
        outputTo: 6,
        opposite: true,
        instrInputSpan: 4,
        instrOutputSpan: 4,
      };

      //Act
      const attrs = dscalc.getDirection(instrRange);

      //Assert
      expect(attrs).toEqual(expectedAttrs);
    });

    it("Should return correct attributes for Same Direction Input Decreasing and Output Decreasing", async () => {
      //Arrange
      //const app = await initializeApp();
      const dscalc = await setup();

      const instrRange = {
        instrcalrangefrom: 5,
        instrcalrangeto: 1,
        instroutrangefrom: 6,
        instroutrangeto: 2,
      };

      const expectedAttrs = {
        inputFrom: 1,
        inputTo: 5,
        outputFrom: 2,
        outputTo: 6,
        opposite: false,
        instrInputSpan: 4,
        instrOutputSpan: 4,
      };

      //Act
      const attrs = dscalc.getDirection(instrRange);

      //Assert
      expect(attrs).toEqual(expectedAttrs);
    });

    it("Should return correct attributes for Same Direction Input Increasing and Output Increasing", async () => {
      //Arrange
      //const app = await initializeApp();
      const dscalc = await setup();

      const instrRange = {
        instrcalrangefrom: 1,
        instrcalrangeto: 5,
        instroutrangefrom: 2,
        instroutrangeto: 6,
      };

      const expectedAttrs = {
        inputFrom: 1,
        inputTo: 5,
        outputFrom: 2,
        outputTo: 6,
        opposite: false,
        instrInputSpan: 4,
        instrOutputSpan: 4,
      };

      //Act
      const attrs = dscalc.getDirection(instrRange);

      //Assert
      expect(attrs).toEqual(expectedAttrs);
    });
  });

  describe("calculateProcessAssetError", () => {
    const options = {
      round: DatasheetConstants.ROUND_VALUE,
      places: 2,
    };

    it("Should return NaN when invalid input or output value is passed", async () => {
      //Arrange
      const app = await initializeApp();
      const instr = await generateInst(app, TEST_WONUM);
      instr.nonlinear = true;
      instr.processeu = "Deg C";
      const dscalc = await setup();

      const point = generatePoint({
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      });

      //Act
      dscalc.calculateProcessAssetError(
        CalibrationPointConstants.CONDITION_ASFOUND,
        point,
        instr,
        "abc",
        NaN,
        null,
        null,
        NaN,
        null,
        options
      );

      //Assert
      expect(point["asfoundproerror"]).toEqual("NaN");
    });

    it("Should return Process error when isOpposite true", async () => {
      //Arrange
      //const app = await initializeApp();
      const instr = await generateInst({
        nonlinear: false,
        pluscwodsinstrid: 10111,
        processeu: "%",
        instroutrangeeu: "mA",
        instrcalrangeeu: "%",
        processeufactor: "",
        plantype: "DISCRETE",
      });
      const dscalc = await setup();

      const attrsSUMSQRTIWO = {
        inputFrom: 25.0,
        inputTo: 75.0,
        outputFrom: 3.0,
        outputTo: 15.0,
        opposite: true,
        instrInputSpan: 50.0,
        instrOutputSpan: 12.0,
      };

      const point = generatePoint({
        asfoundinput: 74.0,
        asfoundoutput: 14.99,
        inputvalue: 75.0,
        outputvalue: 15.0,
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      });

      const actualPrecision = { input: 0, output: 2 };

      //Act
      dscalc.calculateProcessAssetError(
        CalibrationPointConstants.CONDITION_ASFOUND,
        point,
        instr,
        point.asfoundinput,
        point.asfoundoutput,
        attrsSUMSQRTIWO,
        attrsSUMSQRTIWO.opposite,
        0.23,
        actualPrecision,
        options
      );

      //Assert
      expect(point["asfoundproerror"]).toEqual("0.23");
    });

    it("Should return Process error when isOpposite true", async () => {
      //Arrange
      //const app = await initializeApp();
      const instr = await generateInst({
        nonlinear: false,
        pluscwodsinstrid: 10111,
        processeu: "Dec C",
        instroutrangeeu: "mA",
        instrcalrangeeu: "Dec C",
        processeufactor: "",
      });
      const dscalc = await setup();

      const attrsSUMSQRTIWO = {
        inputFrom: 0,
        inputTo: 100.0,
        outputFrom: 4.0,
        outputTo: 20.0,
        opposite: true,
        instrInputSpan: 100.0,
        instrOutputSpan: 16.0,
      };

      const point = generatePoint({
        asfoundinput: 50.11,
        asfoundoutput: 8.0,
        inputvalue: 50.0,
        outputvalue: 12.0,
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      });

      const actualPrecision = { input: 0, output: 2 };

      //Act
      dscalc.calculateProcessAssetError(
        CalibrationPointConstants.CONDITION_ASFOUND,
        point,
        instr,
        point.asfoundinput,
        point.asfoundoutput,
        attrsSUMSQRTIWO,
        attrsSUMSQRTIWO.opposite,
        -4.02,
        actualPrecision,
        options
      );

      //Assert
      expect(point["asfoundproerror"]).toEqual("-24.89");
    });
    it("Should return Process error when isOpposite false", async () => {
      //Arrange
      //const app = await initializeApp();
      const instr = await generateInst({
        nonlinear: false,
        pluscwodsinstrid: 10111,
        processeu: "Dec C",
        instroutrangeeu: "mA",
        instrcalrangeeu: "Dec C",
        processeufactor: "",
      });
      const dscalc = await setup();

      const attrsSUMSQRTIWO = {
        inputFrom: 0,
        inputTo: 100.0,
        outputFrom: 4.0,
        outputTo: 20.0,
        opposite: false,
        instrInputSpan: 100.0,
        instrOutputSpan: 16.0,
      };

      const point = generatePoint({
        asfoundinput: 50.11,
        asfoundoutput: 8.0,
        inputvalue: 50.0,
        outputvalue: 12.0,
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      });

      const actualPrecision = { input: 0, output: 2 };

      //Act
      dscalc.calculateProcessAssetError(
        CalibrationPointConstants.CONDITION_ASFOUND,
        point,
        instr,
        point.asfoundinput,
        point.asfoundoutput,
        attrsSUMSQRTIWO,
        attrsSUMSQRTIWO.opposite,
        -4.02,
        actualPrecision,
        options
      );

      //Assert
      expect(point["asfoundproerror"]).toEqual("-25.11");
    });
    it("Should return Process error when processEuFactor exists", async () => {
      //Arrange
      //const app = await initializeApp();
      const instr = await generateInst({
        nonlinear: false,
        pluscwodsinstrid: 10111,
        processeu: "Dec C",
        instroutrangeeu: "mA",
        instrcalrangeeu: "Dec C",
        processeufactor: "16.67",
      });
      const dscalc = await setup();

      const attrsSUMSQRTIWO = {
        inputFrom: 0,
        inputTo: 100.0,
        outputFrom: 4.0,
        outputTo: 20.0,
        opposite: false,
        instrInputSpan: 100.0,
        instrOutputSpan: 16.0,
      };

      const point = generatePoint({
        asfoundinput: 50.11,
        asfoundoutput: 8.0,
        inputvalue: 50.0,
        outputvalue: 12.0,
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      });

      const actualPrecision = { input: 0, output: 2 };

      //Act
      dscalc.calculateProcessAssetError(
        CalibrationPointConstants.CONDITION_ASFOUND,
        point,
        instr,
        point.asfoundinput,
        point.asfoundoutput,
        attrsSUMSQRTIWO,
        attrsSUMSQRTIWO.opposite,
        -4.02,
        actualPrecision,
        options
      );

      //Assert
      expect(point["asfoundproerror"]).toEqual("-25.11");
    });

    it("Should calculate process error when processeufactor is not null", async () => {
      //Arrange

      const app = await initializeApp();
      const instr = await generateInst(app, TEST_WONUM);
      instr.nonlinear = false;
      instr.processeufactor = 16.67;
      instr.processeu = "Dec C";
      instr.instroutrangeeu = "Volts";
      instr.instrcalrangeeu = "Inches";
      const dscalc = await setup();

      const attrsSUMSQRTIWO = {
        inputFrom: -2000.0,
        inputTo: 2000.0,
        outputFrom: 0.0,
        outputTo: 5.0,
        opposite: false,
        instrInputSpan: 4000.0,
        instrOutputSpan: 5.0,
      };

      const point = generatePoint({
        asfoundinput: -1998.0,
        asfoundoutput: 0.0,
        inputvalue: -2000.0,
        outputvalue: 0.0,
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      });

      const actualPrecision = { input: 0, output: 5 };

      const options = {
        round: DatasheetConstants.ROUND_VALUE,
        places: 5,
      };

      //Act
      dscalc.calculateProcessAssetError(
        CalibrationPointConstants.CONDITION_ASFOUND,
        point,
        instr,
        point.asfoundinput,
        point.asfoundoutput,
        attrsSUMSQRTIWO,
        attrsSUMSQRTIWO.opposite,
        -0.0025,
        actualPrecision,
        options
      );

      //Assert
      expect(point["asfoundproerror"]).toEqual("-0.04168");
    });
    it("Should calculate process error when processeufactor is 0", async () => {
      //Arrange

      const app = await initializeApp();
      const instr = await generateInst(app, TEST_WONUM);
      instr.nonlinear = false;
      instr.processeufactor = 0;
      instr.processeu = "Dec C";
      instr.instroutrangeeu = "Volts";
      instr.instrcalrangeeu = "Inches";
      const dscalc = await setup();

      const attrsSUMSQRTIWO = {
        inputFrom: -2000.0,
        inputTo: 2000.0,
        outputFrom: 0.0,
        outputTo: 5.0,
        opposite: false,
        instrInputSpan: 4000.0,
        instrOutputSpan: 5.0,
      };

      const point = generatePoint({
        asfoundinput: -1998.0,
        asfoundoutput: 0.0,
        inputvalue: -2000.0,
        outputvalue: 0.0,
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      });

      const actualPrecision = { input: 0, output: 5 };

      const options = {
        round: DatasheetConstants.ROUND_VALUE,
        places: 5,
      };

      //Act
      dscalc.calculateProcessAssetError(
        CalibrationPointConstants.CONDITION_ASFOUND,
        point,
        instr,
        point.asfoundinput,
        point.asfoundoutput,
        attrsSUMSQRTIWO,
        attrsSUMSQRTIWO.opposite,
        -0.0025,
        actualPrecision,
        options
      );

      //Assert
      expect(point["asfoundproerror"]).toEqual(undefined);
    });
    it("Should calculate process error when processeufactor is null but processeu exists", async () => {
      //Arrange

      const app = await initializeApp();
      const instr = await generateInst(app, TEST_WONUM);
      instr.nonlinear = false;
      instr.processeufactor = null;
      instr.processeu = "Dec C";
      instr.instroutrangeeu = "Volts";
      instr.instrcalrangeeu = "Inches";
      const dscalc = await setup();

      const attrsSUMSQRTIWO = {
        inputFrom: -2000.0,
        inputTo: 2000.0,
        outputFrom: 0.0,
        outputTo: 5.0,
        opposite: false,
        instrInputSpan: 4000.0,
        instrOutputSpan: 5.0,
      };

      const point = generatePoint({
        asfoundinput: -1998.0,
        asfoundoutput: 0.0,
        inputvalue: -2000.0,
        outputvalue: 0.0,
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      });

      const actualPrecision = { input: 0, output: 5 };

      const options = {
        round: DatasheetConstants.ROUND_VALUE,
        places: 5,
      };

      // Act
      dscalc.calculateProcessAssetError(
        CalibrationPointConstants.CONDITION_ASFOUND,
        point,
        instr,
        point.asfoundinput,
        point.asfoundoutput,
        attrsSUMSQRTIWO,
        attrsSUMSQRTIWO.opposite,
        -0.0025,
        actualPrecision,
        options
      );

      //Assert
      expect(point["asfoundproerror"]).toEqual(undefined);
    });

    it("Should calculate process error when processeufactor is null", async () => {
      //Arrange

      const app = await initializeApp();
      const instr = await generateInst(app, TEST_WONUM);
      instr.nonlinear = false;
      instr.processeufactor = null;
      instr.processeu = null;
      instr.instroutrangeeu = "Volts";
      instr.instrcalrangeeu = "Inches";
      const dscalc = await setup();

      const attrsSUMSQRTIWO = {
        inputFrom: -2000.0,
        inputTo: 2000.0,
        outputFrom: 0.0,
        outputTo: 5.0,
        opposite: false,
        instrInputSpan: 4000.0,
        instrOutputSpan: 5.0,
      };

      const point = generatePoint({
        asfoundinput: -1998.0,
        asfoundoutput: 0.0,
        inputvalue: -2000.0,
        outputvalue: 0.0,
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      });

      const actualPrecision = { input: 0, output: 5 };

      const options = {
        round: DatasheetConstants.ROUND_VALUE,
        places: 5,
      };

      //Act
      dscalc.calculateProcessAssetError(
        CalibrationPointConstants.CONDITION_ASFOUND,
        point,
        instr,
        point.asfoundinput,
        point.asfoundoutput,
        attrsSUMSQRTIWO,
        attrsSUMSQRTIWO.opposite,
        -0.0025,
        actualPrecision,
        options
      );

      //Assert
      expect(point["asfoundproerror"]).toEqual(undefined);
    });
  });

  describe("getDomainCalStatusDS", () => {
    it("Should return correct domaincalstatus ds", async () => {
      const dscalc = await setup();
      const domainCalStatusDS = {
        name: "domaincalstatusds",
        items: [],
      };
      const result = dscalc.getDomainCalStatusDS();
      expect(result.name).toEqual(domainCalStatusDS.name);
    });
  });

  describe("calculateToleranceRangeSquared", () => {
    const point = {
      asfoundinput: 10,
      inputvalue: 5,
      outputvalue: 1,
      asfoundsetpoint: 50,
      setpointvalue: 75,
    };
    it("Should calculate when all sums are provided", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1sumurv = 2;
      instr.tol1sumeu = 1;
      instr.tol1sumread = 3;
      instr.tol1sumspan = 4;
      instr.tol1sumdirection = "-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "-";
      instr.gbopposite1 = -1;
      instr.tol1lowervalue = 5;
      instr.tol1uppervalue = 10;
      const sPrefix = "asfound";

      dscalc.calculateToleranceRangeSquared(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("46");
      expect(point.asfoundtol1upper).toEqual("29");
      instr.tol1sumdirection = "a";
      instr.gbsumdirection1 = "a";
      dscalc.calculateToleranceRangeSquared(sPrefix, point, instr);
      expect(point.asfoundtol1upper).toEqual("29");
    });
    it("Should calculate when some sums are not provided", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1sumurv = 2;
      instr.tol1sumeu = 1;
      instr.tol1sumdirection = "-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "-";
      instr.gbopposite1 = -1;
      instr.tol1lowervalue = 5;
      instr.tol1uppervalue = 10;
      const sPrefix = "asfound";

      dscalc.calculateToleranceRangeSquared(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("47");
      expect(point.asfoundtol1upper).toEqual("29");
    });
    it("Should calculate when some sums are not provided", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1sumspan = 2;
      instr.tol1sumread = 1;
      instr.tol1sumdirection = "-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "-";
      instr.gbopposite1 = -1;
      instr.tol1lowervalue = 5;
      instr.tol1uppervalue = 10;
      const sPrefix = "asfound";

      dscalc.calculateToleranceRangeSquared(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("46");
      expect(point.asfoundtol1upper).toEqual("29");
    });
    it("Should return null when tolerance is not provided", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1sumurv = 2;
      instr.tol1sumeu = 1;
      instr.tol1lowervalue = null;
      instr.tol1sumread = 3;
      instr.tol1sumspan = 4;
      instr.tol1type = "READING";
      instr.tol1sumdirection = "+";
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "+";
      instr.gbopposite1 = 1;
      const sPrefix = "asfound";

      dscalc.calculateToleranceRangeSquared(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual(null);
      expect(point.asfoundtol1upper).toEqual(null);
    });
    it("Should calculate when sumdirection is +", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1sumurv = 2;
      instr.tol1sumeu = 1;
      instr.tol1sumread = 3;
      instr.tol1sumspan = 4;
      instr.tol1sumdirection = "+";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "+";
      instr.gbopposite1 = 1;
      const sPrefix = "asfound";

      dscalc.calculateToleranceRangeSquared(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("29");
      expect(point.asfoundtol1upper).toEqual("46");
    });
    it("Should calculate when instr cliplimits is true", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1sumurv = 2;
      instr.tol1sumeu = 1;
      instr.tol1sumread = 3;
      instr.tol1sumspan = 4;
      instr.tol1sumdirection = "+";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "+";
      instr.gbopposite1 = 1;
      instr.cliplimits = true;
      const sPrefix = "asfound";

      dscalc.calculateToleranceRangeSquared(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("20");
      expect(point.asfoundtol1upper).toEqual("20");
    });
    it("Should calculate when sum direction is +/-", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1sumurv = 2;
      instr.tol1sumeu = 1;
      instr.tol1sumread = 3;
      instr.tol1sumspan = 4;
      instr.tol1sumdirection = "+/-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "+/-";
      instr.gbopposite1 = 1;
      const sPrefix = "asfound";

      dscalc.calculateToleranceRangeSquared(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("45");
      expect(point.asfoundtol1upper).toEqual("46");
    });
    it("Should calculate when prefix is null", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1sumurv = 2;
      instr.tol1sumeu = 1;
      instr.tol1sumread = 3;
      instr.tol1sumspan = 4;
      instr.tol1sumdirection = "-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "-";
      instr.gbopposite1 = -1;
      const sPrefix = "";

      dscalc.calculateToleranceRangeSquared(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("45");
      expect(point.asfoundtol1upper).toEqual("46");
    });
    it("Should calculate when toltype is EU", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1type = "EU";
      instr.plantype = "ANALOG";
      instr.tol1sumdirection = "-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "-";
      instr.gbopposite1 = -1;
      const sPrefix = "";

      dscalc.calculateToleranceRangeSquared(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("45");
      expect(point.asfoundtol1upper).toEqual("46");
    });
    it("Should calculate when toltype is %SPAN", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1type = "%SPAN";
      instr.plantype = "ANALOG";
      instr.tol1sumdirection = "-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "-";
      instr.gbopposite1 = -1;
      const sPrefix = "";

      dscalc.calculateToleranceRangeSquared(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("45");
      expect(point.asfoundtol1upper).toEqual("46");
    });
    it("Should calculate when toltype is %URV", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1type = "%URV";
      instr.plantype = "ANALOG";
      instr.tol1sumdirection = "-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "-";
      instr.gbopposite1 = -1;
      const sPrefix = "";

      dscalc.calculateToleranceRangeSquared(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("45");
      expect(point.asfoundtol1upper).toEqual("46");
    });
    it("Should calculate when toltype is %READING", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1type = "%READING";
      instr.plantype = "ANALOG";
      instr.tol1sumdirection = "-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "-";
      instr.gbopposite1 = -1;
      const sPrefix = "";

      dscalc.calculateToleranceRangeSquared(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("45");
      expect(point.asfoundtol1upper).toEqual("46");
    });
    it("Should not calculate when toltype is incorrect", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1type = "NOTAVALUE";
      instr.plantype = "ANALOG";
      instr.tol1sumdirection = "-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "-";
      instr.gbopposite1 = -1;
      const sPrefix = "";

      dscalc.calculateToleranceRangeSquared(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("45");
      expect(point.asfoundtol1upper).toEqual("46");
    });
  });

  describe("calculateToleranceRangeSquareRoot", () => {
    const point = {
      asfoundinput: 10,
      inputvalue: 5,
      outputvalue: 1,
      asfoundsetpoint: 50,
      setpointvalue: 75,
    };
    it("Should calculate when all sums are provided", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1sumurv = 2;
      instr.tol1sumeu = 1;
      instr.tol1sumread = 3;
      instr.tol1sumspan = 4;
      instr.tol1sumdirection = "-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "-";
      instr.gbopposite1 = -1;
      instr.tol1lowervalue = 5;
      instr.tol1uppervalue = 10;
      const sPrefix = "asfound";

      dscalc.calculateToleranceRangeSquareRoot(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("13");
      expect(point.asfoundtol1upper).toEqual("29");
      instr.tol1sumdirection = "a";
      instr.gbsumdirection1 = "a";
      dscalc.calculateToleranceRangeSquareRoot(sPrefix, point, instr);
      expect(point.asfoundtol1upper).toEqual("29");
    });
    it("Should calculate when sumdirection is +", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1sumurv = 2;
      instr.tol1sumeu = 1;
      instr.tol1sumread = 3;
      instr.tol1sumspan = 4;
      instr.tol1sumdirection = "+";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "+";
      instr.gbopposite1 = 1;
      const sPrefix = "asfound";

      dscalc.calculateToleranceRangeSquareRoot(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("29");
      expect(point.asfoundtol1upper).toEqual("13");
    });
    it("Should return null when tolerance is not provided", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1sumurv = 2;
      instr.tol1sumeu = 1;
      instr.tol1sumread = 3;
      instr.tol1sumspan = 4;
      instr.tol1type = "READING";
      instr.tol1sumdirection = "+";
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "+";
      instr.gbopposite1 = 1;
      const sPrefix = "asfound";

      dscalc.calculateToleranceRangeSquareRoot(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual(null);
      expect(point.asfoundtol1upper).toEqual(null);
    });
    it("Should calculate when instr cliplimits is true", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1sumurv = 2;
      instr.tol1sumeu = 1;
      instr.tol1sumread = 3;
      instr.tol1sumspan = 4;
      instr.tol1sumdirection = "+";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "+";
      instr.gbopposite1 = 1;
      instr.cliplimits = true;
      const sPrefix = "asfound";

      dscalc.calculateToleranceRangeSquareRoot(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("20");
      expect(point.asfoundtol1upper).toEqual("13");
    });
    it("Should calculate when sum direction is +/-", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1sumurv = 2;
      instr.tol1sumeu = 1;
      instr.tol1sumread = 3;
      instr.tol1sumspan = 4;
      instr.tol1sumdirection = "+/-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "+/-";
      instr.gbopposite1 = 1;
      const sPrefix = "asfound";

      dscalc.calculateToleranceRangeSquareRoot(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("13");
      expect(point.asfoundtol1upper).toEqual("13");
    });
    it("Should calculate when prefix is null", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1sumurv = 2;
      instr.tol1sumeu = 1;
      instr.tol1sumread = 3;
      instr.tol1sumspan = 4;
      instr.tol1sumdirection = "-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "-";
      instr.gbopposite1 = -1;
      const sPrefix = "";

      dscalc.calculateToleranceRangeSquareRoot(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("13");
      expect(point.asfoundtol1upper).toEqual("13");
    });
    it("Should calculate when toltype is EU", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1type = "EU";
      instr.plantype = "ANALOG";
      instr.tol1sumeu = 10;
      instr.tol1sumdirection = "-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "-";
      instr.gbopposite1 = -1;
      const sPrefix = "";

      dscalc.calculateToleranceRangeSquareRoot(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("13");
      expect(point.asfoundtol1upper).toEqual("13");
    });
    it("Should calculate when toltype is EU but sum EU is not provided", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1type = "EU";
      instr.plantype = "ANALOG";
      instr.tol1sumeeu = "";
      instr.tol1sumdirection = "-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "-";
      instr.gbopposite1 = -1;
      const sPrefix = "";

      dscalc.calculateToleranceRangeSquareRoot(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("13");
      expect(point.asfoundtol1upper).toEqual("13");
    });
    it("Should calculate when toltype is %SPAN", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1type = "%SPAN";
      instr.plantype = "ANALOG";
      instr.tol1sumdirection = "-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "-";
      instr.gbopposite1 = -1;
      const sPrefix = "";

      dscalc.calculateToleranceRangeSquareRoot(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("13");
      expect(point.asfoundtol1upper).toEqual("13");
    });
    it("Should calculate when toltype is %SPAN but other sums are provided", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1type = "%SPAN";
      instr.plantype = "ANALOG";
      instr.tol1sumeu = "";
      instr.tol1sumspan = 10.0;
      instr.tol1sumdirection = "-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "-";
      instr.gbopposite1 = -1;
      const sPrefix = "";

      dscalc.calculateToleranceRangeSquareRoot(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("13");
      expect(point.asfoundtol1upper).toEqual("13");
    });
    it("Should calculate when toltype is %URV", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1type = "%URV";
      instr.plantype = "ANALOG";
      instr.tol1sumdirection = "-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "-";
      instr.gbopposite1 = -1;
      const sPrefix = "";

      dscalc.calculateToleranceRangeSquareRoot(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("13");
      expect(point.asfoundtol1upper).toEqual("13");
    });
    it("Should calculate when toltype is %READING", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1type = "%READING";
      instr.plantype = "ANALOG";
      instr.tol1sumdirection = "-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "-";
      instr.gbopposite1 = -1;
      const sPrefix = "";

      dscalc.calculateToleranceRangeSquareRoot(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("13");
      expect(point.asfoundtol1upper).toEqual("13");
    });
    it("Should not calculate when toltype is incorrect", async () => {
      const dscalc = await setup();
      const instr = generateInst();
      instr.tol1type = "NOTAVALUE";
      instr.plantype = "ANALOG";
      instr.tol1sumdirection = "-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "-";
      instr.gbopposite1 = -1;
      const sPrefix = "";

      dscalc.calculateToleranceRangeSquareRoot(sPrefix, point, instr);
      expect(point.asfoundtol1lower).toEqual("13");
      expect(point.asfoundtol1upper).toEqual("13");
    });
  });

  describe("sqrtToleranceGeneral", () => {
    const iUpper = 100;
    const outputSpan = 2;
    const oLower = 1;
    it("Should calcualte tolerance correctly when linearTol is negative", async () => {
      const dscalc = await setup();
      const linearTol = -400;
      const answer = dscalc.sqrtToleranceGeneral(
        iUpper,
        outputSpan,
        oLower,
        linearTol
      );

      expect(answer).toEqual(-3);
    });

    it("Should calcualte tolerance correctly when linearTol is negative", async () => {
      const dscalc = await setup();
      const linearTol = 400;
      const answer = dscalc.sqrtToleranceGeneral(
        iUpper,
        outputSpan,
        oLower,
        linearTol
      );

      expect(answer).toEqual(5);
    });
  });

  describe("sqrtToleranceSummed", () => {
    const i = 0;
    const iUpper = 100;
    const inputSpan = 50;
    const outputSpan = 2;
    const oLower = 1;
    const sumTolEU = 3;
    const sumTolSpan = 4;
    const sumTolURV = 5;
    const sumTolReading = 6;
    const guardBand = 7;
    it("Should calcualte tolerance correctly", async () => {
      const dscalc = await setup();
      const answer = dscalc.sqrtToleranceSummed(
        i,
        iUpper,
        inputSpan,
        outputSpan,
        oLower,
        sumTolEU,
        sumTolSpan,
        sumTolURV,
        sumTolReading,
        guardBand
      );

      expect(answer).toEqual(1.824621125123532);
    });
  });

  describe("sqrtTolerancePercentReading", () => {
    const i = 200;
    const iUpper = 100;
    const outputSpan = 2;
    const oLower = 1;
    const guardBand = 7;
    const tol = 3;
    it("Should calcualte tolerance correctly", async () => {
      const dscalc = await setup();
      const answer = dscalc.sqrtTolerancePercentReading(
        i,
        iUpper,
        outputSpan,
        oLower,
        tol,
        guardBand
      );
      const answer2 = dscalc.sqrtTolerancePercentReading(
        "",
        "",
        "",
        "",
        "",
        ""
      );

      expect(answer).toEqual(3.9189039038652846);
      expect(answer2).toEqual("NaN");
    });
  });

  describe("sqrtTolerancePercentURV", () => {
    const i = 200;
    const iUpper = 100;
    const outputSpan = 2;
    const oLower = 1;
    const guardBand = 7;
    const tol = 3;
    it("Should calcualte tolerance correctly", async () => {
      const dscalc = await setup();
      const answer = dscalc.sqrtTolerancePercentURV(
        i,
        iUpper,
        outputSpan,
        oLower,
        tol,
        guardBand
      );

      expect(answer).toEqual(3.898275349237888);
    });
  });

  describe("sqrtTolerancePercentSpan", () => {
    const i = 200;
    const iUpper = 100;
    const inputSpan = 3;
    const outputSpan = 2;
    const oLower = 1;
    const guardBand = 7;
    const tol = 3;
    it("Should calcualte tolerance correctly", async () => {
      const dscalc = await setup();
      const answer = dscalc.sqrtTolerancePercentSpan(
        i,
        iUpper,
        inputSpan,
        outputSpan,
        oLower,
        tol,
        guardBand
      );

      expect(answer).toEqual(3.8781243892507495);
    });
  });

  describe("sqrtToleranceEU", () => {
    const i = 200;
    const iUpper = 100;
    const outputSpan = 2;
    const oLower = 1;
    const guardBand = 7;
    const tol = 3;
    it("Should calcualte tolerance correctly", async () => {
      const dscalc = await setup();
      const answer = dscalc.sqrtToleranceEU(
        i,
        iUpper,
        outputSpan,
        oLower,
        tol,
        guardBand
      );

      expect(answer).toEqual(3.898275349237888);
    });
  });

  describe("addGuardBand", () => {
    it("Should return correct tolerance when instr has guardband and doNotApplySpanRatio is false and gbSign is negative ", async () => {
      let tol = "1";
      let tolerance = "100";
      let direction = "opposite";
      let doNotApplySpanRatio = false;
      let spanRatio = 2;
      const instr = generateInst({
        gbfrom1: 1,
        gbto1: 1,
        gbsumdirection1: "-",
        gbopposite1: -1,
      });
      const dscalc = await setup();
      let answer = dscalc.addGuardBand(
        instr,
        tolerance,
        tol,
        direction,
        doNotApplySpanRatio,
        spanRatio
      );
      expect(answer).toEqual(102);
    });

    it("Should return correct tolerance when instr has guardband and doNotApplySpanRatio is false and gbSign is positive ", async () => {
      let tol = "1";
      let tolerance = "100";
      let direction = "opposite";
      let doNotApplySpanRatio = false;
      let spanRatio = 2;
      const instr = generateInst({
        gbfrom1: 1,
        gbto1: 1,
        gbsumdirection1: "+",
        gbopposite1: 1,
      });
      const dscalc = await setup();
      let answer = dscalc.addGuardBand(
        instr,
        tolerance,
        tol,
        direction,
        doNotApplySpanRatio,
        spanRatio
      );
      expect(answer).toEqual(102);
    });

    it("Should return correct tolerance when instr has guardband and doNotApplySpanRatio is true and gbSign is positive ", async () => {
      let tol = "1";
      let tolerance = "100";
      let direction = "opposite";
      let doNotApplySpanRatio = true;
      let spanRatio = 2;
      const instr = generateInst({
        gbfrom1: 1,
        gbto1: 1,
        gbsumdirection1: "+",
        gbopposite1: 1,
      });
      const dscalc = await setup();
      let answer = dscalc.addGuardBand(
        instr,
        tolerance,
        tol,
        direction,
        doNotApplySpanRatio,
        spanRatio
      );
      expect(answer).toEqual(101);
    });

    it("Should return correct tolerance when instr does not guardband and doNotApplySpanRatio is false and gbSign is positive ", async () => {
      let tol = "1";
      let tolerance = "100";
      let direction = "opposite";
      let doNotApplySpanRatio = false;
      let spanRatio = 2;
      const instr = generateInst({
        gbfrom1: null,
        gbto1: 1,
        gbsumdirection1: "+",
        gbopposite1: 1,
      });
      const dscalc = await setup();
      let answer = dscalc.addGuardBand(
        instr,
        tolerance,
        tol,
        direction,
        doNotApplySpanRatio,
        spanRatio
      );
      expect(answer).toEqual("100");
    });
  });

  describe("hasGuardbandFields", () => {
    it("Should return false when isGBFromFilled is true and isGBToFilled is false and gbsumdirection is false", async () => {
      let tol = "1";
      const instr = generateInst({
        gbfrom1: 1,
        gbto1: null,
        gbsumdirection1: null,
      });
      const dscalc = await setup();
      let answer = dscalc.hasGuardbandFields(instr, tol);
      expect(answer).toEqual(false);
    });

    it("Should return false when isGBFromFilled is true and isGBToFilled is true and gbsumdirection is false", async () => {
      let tol = "1";
      const instr = generateInst({
        gbfrom1: 1,
        gbto1: 1,
        gbsumdirection1: null,
      });
      const dscalc = await setup();
      let answer = dscalc.hasGuardbandFields(instr, tol);
      expect(answer).toEqual(false);
    });

    it("Should return false when isGBFromFilled is true and isGBToFilled is false and gbsumdirection is true", async () => {
      let tol = "1";
      const instr = generateInst({
        gbfrom1: 1,
        gbto1: null,
        gbsumdirection1: 1,
      });
      const dscalc = await setup();
      let answer = dscalc.hasGuardbandFields(instr, tol);
      expect(answer).toEqual(false);
    });

    it("Should return false when isGBFromFilled is false and isGBToFilled is true and gbsumdirection is false", async () => {
      let tol = "1";
      const instr = generateInst({
        gbfrom1: null,
        gbto1: 1,
        gbsumdirection1: null,
      });
      const dscalc = await setup();
      let answer = dscalc.hasGuardbandFields(instr, tol);
      expect(answer).toEqual(false);
    });

    it("Should return false when isGBFromFilled is false and isGBToFilled is true and gbsumdirection is true", async () => {
      let tol = "1";
      const instr = generateInst({
        gbfrom1: null,
        gbto1: 1,
        gbsumdirection1: 1,
      });
      const dscalc = await setup();
      let answer = dscalc.hasGuardbandFields(instr, tol);
      expect(answer).toEqual(false);
    });

    it("Should return false when isGBFromFilled is false and isGBToFilled is false and gbsumdirection is true", async () => {
      let tol = "1";
      const instr = generateInst({
        gbfrom1: null,
        gbto1: null,
        gbsumdirection1: 1,
      });
      const dscalc = await setup();
      let answer = dscalc.hasGuardbandFields(instr, tol);
      expect(answer).toEqual(false);
    });

    it("Should return false when isGBFromFilled is false and isGBToFilled is false and gbsumdirection is false", async () => {
      let tol = "1";
      const instr = generateInst({
        gbfrom1: null,
        gbto1: null,
        gbsumdirection1: null,
      });
      const dscalc = await setup();
      let answer = dscalc.hasGuardbandFields(instr, tol);
      expect(answer).toEqual(false);
    });

    it("Should return true when isGBFromFilled is true and isGBToFilled is true and gbsumdirection is true", async () => {
      let tol = "1";
      const instr = generateInst({
        gbfrom1: 1,
        gbto1: 1,
        gbsumdirection1: 1,
      });
      const dscalc = await setup();
      let answer = dscalc.hasGuardbandFields(instr, tol);
      expect(answer).toEqual(true);
    });
  });

  describe("calculateAvgAndStdDeviation", () => {
    const prefix = "asfound";
    const points = [
      {
        asfoundinput: 1.01,
        asfoundoutput: 2.0,
        asfoundsetpoint: 1.0,
        isAverage: false,
      },
      {
        asfoundinput: 2.0,
        asfoundoutput: 3.0,
        asfoundsetpoint: 2.0,
        isAverage: false,
      },
      {
        asfoundinput: 3.0,
        asfoundoutput: 4.0,
        asfoundsetpoint: 3.0,
        isAverage: true,
      },
      {
        asfoundinput: 4.0,
        asfoundoutput: 5.0,
        asfoundsetpoint: 4.0,
        isAverage: false,
      },
      {
        asfoundinput: 5.0,
        asfoundoutput: 6.0,
        asfoundsetpoint: 5.0,
        isAverage: false,
      },
    ];

    describe("plantype is analog", () => {
      const avgpoint = {
        asfoundinput: 3.0,
        asfoundoutput: 4.0,
        asfoundsetpoint: 6.0,
        isAverage: true,
        plantype: "ANALOG",
      };

      const instr = generateInst({
        gbfrom1: 1,
        gbto1: 1,
        gbsumdirection1: "-",
        gbopposite1: -1,
      });

      it("Should calculate average and standard deviation correctly", async () => {
        const dscalc = await setup();
        let result = dscalc.calculateAvgAndStdDeviation(
          prefix,
          points,
          avgpoint,
          instr
        );

        expect(result.asfoundinput).toEqual("3.00");
        expect(result.asfoundoutput).toEqual("4");

        dscalc.dsconfigItem["stddev"] = 3;

        result = dscalc.calculateAvgAndStdDeviation(prefix, points, avgpoint, instr);

        expect(result.asfinputstddev).toEqual("1.41");
        expect(result.asfoutputstddev).toEqual("1");
      });

      it("Should calculate average and standard deviation with error correctly", async () => {
        const dscalc = await setup();
        instr.isstandarddeviation = true;
        let result = dscalc.calculateAvgAndStdDeviation(
          prefix,
          points,
          avgpoint,
          instr
        );

        expect(result.asfoundinput).toEqual("3.00");
        expect(result.asfoundoutput).toEqual("4");

        dscalc.dsconfigItem["stddev"] = 3;

        result = dscalc.calculateAvgAndStdDeviation(prefix, points, avgpoint, instr);

        expect(result.asfinputstddev).toEqual("1.41");
        expect(result.asfoutputstddev).toEqual("1");
      });
    });

    describe("plantype is discrete", () => {
      const avgpoint = {
        asfoundinput: 3.0,
        asfoundoutput: 4.0,
        isAverage: true,
        plantype: "DISCRETE",
      };

      const instr = generateInst({
        gbfrom1: 1,
        gbto1: 1,
        gbsumdirection1: "-",
        gbopposite1: -1,
      });

      it("Should calculate average and standard deviation correctly", async () => {
        const dscalc = await setup();
        dscalc.dsconfigItem["stddev"] = 2;
        const result = dscalc.calculateAvgAndStdDeviation(
          prefix,
          points,
          avgpoint,
          instr
        );

        expect(result.asfoundsetpoint).toEqual("3");
        expect(result.asfsetptstddev).toEqual("2");
      });

      it("Should calculate average and standard deviation with error correctly", async () => {
        const dscalc = await setup();
        dscalc.dsconfigItem["stddev"] = 2;
        instr.isstandarddeviation = true;
        const result = dscalc.calculateAvgAndStdDeviation(
          prefix,
          points,
          avgpoint,
          instr
        );

        expect(result.asfoundsetpoint).toEqual("3");
        expect(result.asfsetptstddev).toEqual("2");
      });
    });

    it("Should calculate average and standard deviation correctly when plantype is neither discrete nor analog", async () => {
      const dscalc = await setup();
      const avgpoint = {
        asfoundinput: 3.0,
        asfoundoutput: 4.0,
        isAverage: true,
        plantype: "NEITHER",
      };
      dscalc.dsconfigItem["stddev"] = 2;
      const result = dscalc.calculateAvgAndStdDeviation(
        prefix,
        points,
        avgpoint
      );

      expect(result.asfoundsetpoint).toEqual(undefined);
      expect(result.asfsetptstddev).toEqual(undefined);
    });

    it("Should calculate average and standard deviation correctly when plantype is neither discrete nor analog and condition is neither as found nor as left", async () => {
      const dscalc = await setup();
      const avgpoint = {
        asfoundinput: 3.0,
        asfoundoutput: 4.0,
        isAverage: true,
        plantype: "NEITHER",
      };
      dscalc.dsconfigItem["stddev"] = 2;
      const conditionPrefix = "Neither";
      const result = dscalc.calculateAvgAndStdDeviation(
        conditionPrefix,
        points,
        avgpoint
      );

      expect(result.asfoundsetpoint).toEqual(undefined);
      expect(result.asfsetptstddev).toEqual(undefined);
    });
  });

  describe("calculateAverageByAttr", () => {
    const prefix = "asfound";
    const points = [
      {
        asfoundinput: 1.01,
        asfoundoutput: 2.0,
        asfoundsetpoint: 1.0,
        isAverage: false,
      },
      {
        asfoundinput: 2.0,
        asfoundoutput: 3.0,
        asfoundsetpoint: 2.0,
        isAverage: false,
      },
      {
        asfoundinput: 3.0,
        asfoundoutput: 4.0,
        asfoundsetpoint: 3.0,
        isAverage: true,
      },
      {
        asfoundinput: 4.0,
        asfoundoutput: 5.0,
        asfoundsetpoint: 4.0,
        isAverage: false,
      },
      {
        asfoundinput: 5.0,
        asfoundoutput: 6.0,
        asfoundsetpoint: 5.0,
        isAverage: false,
      },
    ];

    it("Should calculate average when precision is reset", async () => {
      const dscalc = await setup();
      dscalc.dsconfigItem["stddev"] = 2;
      const result = dscalc.calculateAverageByAttr(points, `${prefix}setpoint`);

      expect(result).toEqual(3);
    });
  });

  describe("calculateDesiredOutput", () => {
    describe("Instrument is squared", () => {
      it("should calculate for the output correctly when input is postive", async () => {
        const dscalc = await setup();

        const instr = {
          instrcalrangefrom: 200.0,
          instrcalrangeto: 100.0,
          instroutrangefrom: 10.0,
          instroutrangeto: 20.0,
          squared: true,
          outputprecision: 2,
        };
        const nominalInput = "99.00";
        const point = {
          newpoint: false,
        };

        const result = dscalc.calculateDesiredOutput(
          nominalInput,
          point,
          instr
        );
        expect(result).toEqual(20.201);
      });
      it("should calculate for the output correctly when input is negative", async () => {
        const dscalc = await setup();

        const instr = {
          instrcalrangefrom: 200.0,
          instrcalrangeto: 100.0,
          instroutrangefrom: 10.0,
          instroutrangeto: 20.0,
          squared: true,
          outputprecision: 2,
        };
        const nominalInput = "-10";
        const point = {
          newpoint: false,
        };

        const result = dscalc.calculateDesiredOutput(
          nominalInput,
          point,
          instr
        );
        expect(result).toEqual(-34.1);
      });
    });
    describe("Instrument is square rooted", () => {
      it("should calculate for the output correctly when input is postive", async () => {
        const dscalc = await setup();

        const instr = {
          instrcalrangefrom: 200.0,
          instrcalrangeto: 100.0,
          instroutrangefrom: 10.0,
          instroutrangeto: 20.0,
          squareroot: true,
          outputprecision: 2,
        };
        const nominalInput = "10.00";
        const point = {
          newpoint: false,
        };

        const result = dscalc.calculateDesiredOutput(
          nominalInput,
          point,
          instr
        );
        expect(result).toEqual(13.16227766016838);
      });
      it("should calculate for the output correctly when input is 0", async () => {
        const dscalc = await setup();

        const instr = {
          instrcalrangefrom: 200.0,
          instrcalrangeto: 100.0,
          instroutrangefrom: 10.0,
          instroutrangeto: 20.0,
          squareroot: true,
          outputprecision: 2,
        };
        const nominalInput = "0";
        const point = {
          newpoint: false,
        };

        const result = dscalc.calculateDesiredOutput(
          nominalInput,
          point,
          instr
        );
        expect(result).toEqual(10);
      });
    });
    describe("Instrument is not squared or square rooted", () => {
      it("should calculate for the output correctly when input is postive", async () => {
        const dscalc = await setup();

        const instr = {
          instrcalrangefrom: 200.0,
          instrcalrangeto: 100.0,
          instroutrangefrom: 10.0,
          instroutrangeto: 20.0,
          outputprecision: 2,
        };
        const nominalInput = "10.00";
        const point = {
          newpoint: false,
        };

        const result = dscalc.calculateDesiredOutput(
          nominalInput,
          point,
          instr
        );
        expect(result).toEqual(29);
      });
      it("should calculate for the output correctly when input is 0", async () => {
        const dscalc = await setup();

        const instr = {
          instrcalrangefrom: 200.0,
          instrcalrangeto: 100.0,
          instroutrangefrom: 10.0,
          instroutrangeto: 20.0,
          outputprecision: 2,
        };
        const nominalInput = "0";
        const point = {
          newpoint: false,
        };

        const result = dscalc.calculateDesiredOutput(
          nominalInput,
          point,
          instr
        );
        expect(result).toEqual(30);
      });

      it("should calculate for the output correctly when input is negative", async () => {
        const dscalc = await setup();

        const instr = {
          instrcalrangefrom: 200.0,
          instrcalrangeto: 100.0,
          instroutrangefrom: 10.0,
          instroutrangeto: 20.0,
          outputprecision: 2,
        };
        const nominalInput = "-10";
        const point = {
          newpoint: false,
        };

        const result = dscalc.calculateDesiredOutput(
          nominalInput,
          point,
          instr
        );
        expect(result).toEqual(31);
      });
    });
  });

  describe("calculateSquareRootOutputValue", () => {
    const instrRange = {
      instrcalrangefrom: 200.0,
      instrcalrangeto: 100.0,
      instroutrangefrom: 10.0,
      instroutrangeto: 20.0,
    };
    const instr = {
      outputprecision: 2,
    };

    it("Should calucalte Desired Output correctly when sign is -1", async () => {
      const dscalc = await setup();
      const sign = -1;
      const asinputvalue = 10;
      const point = {};

      const result = dscalc.calculateSquareRootOutputValue(
        sign,
        asinputvalue,
        point,
        instr,
        instrRange
      );
      expect(result).toEqual(2.9289321881345245);
    });

    it("Should calucalte Desired Output correctly when sign is 1", async () => {
      const dscalc = await setup();
      const sign = 1;
      const asinputvalue = 10;
      const point = {
        newpoint: false,
      };

      const result = dscalc.calculateSquareRootOutputValue(
        sign,
        asinputvalue,
        point,
        instr,
        instrRange
      );
      expect(result).toEqual(13.16227766016838);
    });

    it("Should calculate Desired Output correctly when sign is 1 and point is new", async () => {
      const dscalc = await setup();
      const sign = 1;
      const asinputvalue = 10;
      const point = {
        newpoint: true,
      };

      const result = dscalc.calculateSquareRootOutputValue(
        sign,
        asinputvalue,
        point,
        instr,
        instrRange
      );
      expect(result).toEqual("13.16");
    });
  });

  describe("calculateSquaredOutputValue", () => {
    const instrRange = {
      instrcalrangefrom: 200.0,
      instrcalrangeto: 100.0,
      instroutrangefrom: 10.0,
      instroutrangeto: 20.0,
    };

    it("Should calucalte Desired Output correctly when sign is -1", async () => {
      const dscalc = await setup();
      const sign = -1;
      const asinputvalue = -10;

      const result = dscalc.calculateSquaredOutputValue(
        sign,
        asinputvalue,
        instrRange
      );
      expect(result).toEqual(-34.1);
    });

    it("Should calculate Desired Output correctly when sign is 1", async () => {
      const dscalc = await setup();
      const sign = 1;
      const asinputvalue = 10;

      const result = dscalc.calculateSquaredOutputValue(
        sign,
        asinputvalue,
        instrRange
      );
      expect(result).toEqual(46.1);
    });
  });

  describe("calculateSummedTolerance", () => {
    const point = {
      asfoundinput: 10,
      inputvalue: 5,
      outputvalue: 1,
      asfoundsetpoint: 50,
      setpointvalue: 75,
    };

    it("Should return null when sumDirection is incorrect", async () => {
      const dscalc = await setup();
      const tol = 1;
      const attrs = {
        inputFrom: 25.0,
        inputTo: 75.0,
        outputFrom: 3.0,
        outputTo: 15.0,
        opposite: false,
        instrInputSpan: 50.0,
        instrOutputSpan: 12.0,
      };
      const instr = generateInst();
      instr.tol1sumurv = 2;
      instr.tol1sumeu = 1;
      instr.tol1sumread = 3;
      instr.tol1sumspan = 4;
      instr.tol1sumdirection = "A";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "A";
      instr.gbopposite1 = -1;
      const prefix = "";
      const isTolOutput = true;
      const ISpanByOSpan = 0.5;

      const result = dscalc.calculateSummedTolerance(
        prefix,
        instr,
        point,
        tol,
        isTolOutput,
        attrs,
        ISpanByOSpan
      );
      expect(result.toleranceLower).toEqual(null);
      expect(result.toleranceUpper).toEqual(null);
    });

    it("Should calculate summed tolerance when sumDirection is -", async () => {
      const dscalc = await setup();
      const tol = 1;
      const attrs = {
        inputFrom: 25.0,
        inputTo: 75.0,
        outputFrom: 3.0,
        outputTo: 15.0,
        opposite: false,
        instrInputSpan: 50.0,
        instrOutputSpan: 12.0,
      };
      const instr = generateInst();
      instr.tol1sumurv = 2;
      instr.tol1sumeu = 1;
      instr.tol1sumread = 3;
      instr.tol1sumspan = 4;
      instr.tol1sumdirection = "-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "-";
      instr.gbopposite1 = -1;
      const prefix = "asfound";
      const isTolOutput = true;
      const ISpanByOSpan = 0.5;

      const result = dscalc.calculateSummedTolerance(
        prefix,
        instr,
        point,
        tol,
        isTolOutput,
        attrs,
        ISpanByOSpan
      );
      expect(result.toleranceLower).toEqual(25.349999999999998);
      expect(result.toleranceUpper).toEqual(29);
    });

    it("Should calculate summed tolerance when sumDirection is +", async () => {
      const dscalc = await setup();
      const tol = 1;
      const attrs = {
        inputFrom: 25.0,
        inputTo: 75.0,
        outputFrom: 3.0,
        outputTo: 15.0,
        opposite: false,
        instrInputSpan: 50.0,
        instrOutputSpan: 12.0,
      };
      const instr = generateInst();
      instr.tol1sumurv = 2;
      instr.tol1sumeu = 1;
      instr.tol1sumread = 3;
      instr.tol1sumspan = 4;
      instr.tol1sumdirection = "+";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "+";
      instr.gbopposite1 = 1;
      const prefix = "asfound";
      const isTolOutput = true;
      const ISpanByOSpan = 0.5;

      const result = dscalc.calculateSummedTolerance(
        prefix,
        instr,
        point,
        tol,
        isTolOutput,
        attrs,
        ISpanByOSpan
      );
      expect(result.toleranceLower).toEqual(29);
      expect(result.toleranceUpper).toEqual(32.650000000000006);
    });
    it("Should calculate summed tolerance when sumDirection is +/-", async () => {
      const dscalc = await setup();
      const tol = 1;
      const attrs = {
        inputFrom: 25.0,
        inputTo: 75.0,
        outputFrom: 3.0,
        outputTo: 15.0,
        opposite: false,
        instrInputSpan: 50.0,
        instrOutputSpan: 12.0,
      };
      const instr = generateInst();
      instr.tol1sumurv = 2;
      instr.tol1sumeu = 1;
      instr.tol1sumread = 3;
      instr.tol1sumspan = 4;
      instr.tol1sumdirection = "+/-";
      instr.instrcalrangefrom = 200.0;
      instr.instrcalrangeto = 100.0;
      instr.instroutrangefrom = 10.0;
      instr.instroutrangeto = 20.0;
      instr.outputprecision = 2;
      instr.gbfrom1 = 1;
      instr.gbto1 = 1;
      instr.gbsumdirection1 = "+/-";
      instr.gbopposite1 = 1;
      const prefix = "asfound";
      const isTolOutput = true;
      const ISpanByOSpan = 0.5;

      const result = dscalc.calculateSummedTolerance(
        prefix,
        instr,
        point,
        tol,
        isTolOutput,
        attrs,
        ISpanByOSpan
      );
      expect(result.toleranceLower).toEqual(27.349999999999998);
      expect(result.toleranceUpper).toEqual(32.650000000000006);
    });
  });

  describe("calculateREADINGfactor", () => {
    const point = {
      asfoundinput: 10,
      inputvalue: 5,
      outputvalue: 1,
      asfoundsetpoint: 50,
      setpointvalue: 75,
    };
    const desiredOutput = 11;
    describe("Analog plantype", () => {
      const plantype = "ANALOG";
      it("Should calculate READING factor correctly when isTolOutput is true and prefix is not null", async () => {
        const dscalc = await setup();
        const isTolOutput = true;
        const prefix = "asfound";
        const result = dscalc.calculateREADINGfactor(
          prefix,
          point,
          desiredOutput,
          isTolOutput,
          plantype
        );

        expect(result).toEqual(11);
      });

      it("Should calculate READING factor correctly when isTolOutput is true and prefix is null", async () => {
        const dscalc = await setup();
        const isTolOutput = true;
        const prefix = null;
        const result = dscalc.calculateREADINGfactor(
          prefix,
          point,
          desiredOutput,
          isTolOutput,
          plantype
        );

        expect(result).toEqual(1);
      });

      it("Should calculate READING factor correctly when isTolOutput is false and prefix is not null", async () => {
        const dscalc = await setup();
        const isTolOutput = false;
        const prefix = "asfound";
        const result = dscalc.calculateREADINGfactor(
          prefix,
          point,
          desiredOutput,
          isTolOutput,
          plantype
        );

        expect(result).toEqual(10);
      });

      it("Should calculate READING factor correctly when isTolOutput is false and prefix is null", async () => {
        const dscalc = await setup();
        const isTolOutput = false;
        const prefix = null;
        const result = dscalc.calculateREADINGfactor(
          prefix,
          point,
          desiredOutput,
          isTolOutput,
          plantype
        );

        expect(result).toEqual(5);
      });
    });
    describe("Discrete plantype", () => {
      const plantype = "DISCRETE";
      it("Should calculate READING factor correctly when prefix is not null", async () => {
        const dscalc = await setup();
        const isTolOutput = true;
        const prefix = "asfound";
        const result = dscalc.calculateREADINGfactor(
          prefix,
          point,
          desiredOutput,
          isTolOutput,
          plantype
        );

        expect(result).toEqual(0.5);
      });

      it("Should calculate READING factor correctly when prefix is null", async () => {
        const dscalc = await setup();
        const isTolOutput = true;
        const prefix = null;
        const result = dscalc.calculateREADINGfactor(
          prefix,
          point,
          desiredOutput,
          isTolOutput,
          plantype
        );

        expect(result).toEqual(0.75);
      });
    });
    const plantype = "INCORRECT";
    it("Should return null if plantype is incorrect", async () => {
      const dscalc = await setup();
      const isTolOutput = true;
      const prefix = "asfound";
      const result = dscalc.calculateREADINGfactor(
        prefix,
        point,
        desiredOutput,
        isTolOutput,
        plantype
      );

      expect(result).toEqual(undefined);
    });
  });

  describe("calculateSPANfactor", () => {
    const attrs = {
      inputTo: 1,
      inputFrom: 2,
      outputTo: 5,
      outputFrom: 2,
    };
    it("Should calculate SPAN factor correctly when isTolOutput is true", async () => {
      const dscalc = await setup();
      const isTolOutput = true;
      const result = dscalc.calculateSPANfactor(attrs, isTolOutput);

      expect(result).toEqual(3);
    });

    it("Should calculate SPAN factor correctly when isTolOutput is false", async () => {
      const dscalc = await setup();
      const isTolOutput = false;
      const result = dscalc.calculateSPANfactor(attrs, isTolOutput);

      expect(result).toEqual(-1);
    });
  });

  describe("calculateURVfactor", () => {
    const attrs = {
      inputTo: 1,
      outputTo: 2,
    };

    it("Should calculate URV factor correctly when isTolOutput is true", async () => {
      const dscalc = await setup();
      const isTolOutput = true;
      const result = dscalc.calculateURVfactor(attrs, isTolOutput);

      expect(result).toEqual(2);
    });

    it("Should calculate URV factor correctly when isTolOutput is false", async () => {
      const dscalc = await setup();
      const isTolOutput = false;
      const result = dscalc.calculateURVfactor(attrs, isTolOutput);

      expect(result).toEqual(1);
    });

    it("Should calculate URV factor correctly when isTolOutput is false and factor is negative", async () => {
      const dscalc = await setup();
      const isTolOutput = false;
      const attrsNegative = {
        inputTo: -1,
        outputTo: 2,
      };
      const result = dscalc.calculateURVfactor(attrsNegative, isTolOutput);

      expect(result).toEqual(1);
    });
  });

  describe("calcSumEU", () => {
    // const attrs = {
    //   inputFrom: 25.0,
    //   inputTo: 75.0,
    //   outputFrom: 3.0,
    //   outputTo: 15.0,
    //   opposite: false,
    //   instrInputSpan: 50.0,
    //   instrOutputSpan: 12.0,
    // };

    const instr = {
      tol1sumeu: 2,
      outputvalue: 5,
    };

    const ISpanByOSpan = 0.5;

    const tol = 1;

    it("Should calculate correct sum when isTolOutput is false", async () => {
      //const app = await initializeApp();
      const dscalc = await setup();
      // const point = generatePoint({
      //   asfoundinput: 51.0,
      //   asfoundoutput: 4.5,
      //   inputvalue: 50.0,
      //   outputvalue: 5,
      //   plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      // });
      const isTolOutput = false;

      const sum = dscalc.calcSumEU(instr, tol, isTolOutput, ISpanByOSpan);

      expect(sum).toEqual(1);
    });

    it("Should calculate correct sum when isTolOutput is true", async () => {
      //const app = await initializeApp();
      const dscalc = await setup();
      // const point = generatePoint({
      //   asfoundinput: 51.0,
      //   asfoundoutput: 4.5,
      //   inputvalue: 50.0,
      //   outputvalue: 5,
      //   plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      // });
      const isTolOutput = true;

      const sum = dscalc.calcSumEU(instr, tol, isTolOutput, ISpanByOSpan);

      expect(sum).toEqual(2);
    });
  });

  describe("calcSumRead", () => {
    const attrs = {
      inputFrom: 25.0,
      inputTo: 75.0,
      outputFrom: 3.0,
      outputTo: 15.0,
      opposite: false,
      instrInputSpan: 50.0,
      instrOutputSpan: 12.0,
    };

    const instr = {
      tol1sumread: 2,
      outputvalue: 5,
    };

    const ISpanByOSpan = 0.5;

    const tol = 1;

    it("Should calculate correct sum when isTolOutput is false", async () => {
      //const app = await initializeApp();
      const dscalc = await setup();
      const point = generatePoint({
        asfoundinput: 51.0,
        asfoundoutput: 4.5,
        inputvalue: 50.0,
        outputvalue: 5,
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      });
      const isTolOutput = false;
      const prefix = "asfound";

      const sum = dscalc.calcSumRead(
        prefix,
        instr,
        point,
        tol,
        isTolOutput,
        attrs,
        ISpanByOSpan
      );

      expect(sum).toEqual(0.51);
    });

    it("Should calculate correct sum when isTolOutput is true and prefix is null", async () => {
      //const app = await initializeApp();
      const dscalc = await setup();
      const point = generatePoint({
        asfoundinput: 51.0,
        asfoundoutput: 4.5,
        inputvalue: 50.0,
        outputvalue: 5,
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      });
      const isTolOutput = true;
      const prefix = null;

      const sum = dscalc.calcSumRead(
        prefix,
        instr,
        point,
        tol,
        isTolOutput,
        attrs,
        ISpanByOSpan
      );

      expect(sum).toEqual(0.1);
    });
  });

  describe("calcSumSpan", () => {
    const attrs = {
      inputFrom: 25.0,
      inputTo: 75.0,
      outputFrom: 3.0,
      outputTo: 15.0,
      opposite: false,
      instrInputSpan: 50.0,
      instrOutputSpan: 12.0,
    };

    const instr = {
      tol1sumspan: 2,
    };

    const ISpanByOSpan = 0.5;

    const tol = 1;

    it("Should calculate correct sum when isTolOutput is false", async () => {
      //const app = await initializeApp();
      const dscalc = await setup();
      const isTolOutput = false;

      const sum = dscalc.calcSumSpan(
        instr,
        tol,
        isTolOutput,
        attrs,
        ISpanByOSpan
      );

      expect(sum).toEqual(0.5);
    });

    it("Should calculate correct sum when isTolOutput is true", async () => {
      //const app = await initializeApp();
      const dscalc = await setup();
      const isTolOutput = true;

      const sum = dscalc.calcSumSpan(
        instr,
        tol,
        isTolOutput,
        attrs,
        ISpanByOSpan
      );

      expect(sum).toEqual(0.24);
    });
  });

  describe("calcSumURV", () => {
    const attrs = {
      inputFrom: 25.0,
      inputTo: 75.0,
      outputFrom: 3.0,
      outputTo: 15.0,
      opposite: false,
      instrInputSpan: 50.0,
      instrOutputSpan: 12.0,
    };

    const instr = {
      tol1sumurv: 2,
    };

    const ISpanByOSpan = 0.5;

    const tol = 1;

    it("Should calculate correct sum when isTolOutput is false", async () => {
      //const app = await initializeApp();
      const dscalc = await setup();
      const isTolOutput = false;

      const sum = dscalc.calcSumURV(
        instr,
        tol,
        isTolOutput,
        attrs,
        ISpanByOSpan
      );

      expect(sum).toEqual(0.75);
    });

    it("Should calculate correct sum when isTolOutput is true", async () => {
      //const app = await initializeApp();
      const dscalc = await setup();
      const isTolOutput = true;

      const sum = dscalc.calcSumURV(
        instr,
        tol,
        isTolOutput,
        attrs,
        ISpanByOSpan
      );

      expect(sum).toEqual(0.3);
    });
  });

  describe("getSummedCalcTypes", () => {
    it("Should not add calc type if no calc type is in instr", async () => {
      //Arrange
      //const app = await initializeApp();
      const dscalc = await setup();

      const instr = {};

      let tol = 1;

      //Act
      const attrs = dscalc.getSummedCalcTypes(instr, tol);

      //Assert
      expect(attrs.length).toEqual(0);
      expect(attrs).toEqual([]);
    });

    it("Should add calc type if calc type is in instr", async () => {
      //Arrange
      //const app = await initializeApp();
      const dscalc = await setup();

      const instr = {
        tol1sumeu: 1,
        tol1sumread: 2,
      };

      let tol = 1;

      //Act
      const attrs = dscalc.getSummedCalcTypes(instr, tol);

      //Assert
      expect(attrs.length).toEqual(2);
      expect(attrs).toEqual(["sumeu", "sumread"]);
    });
  });

  describe("hasSummedCalculations", () => {
    it("Should return false if no calc types are there", async () => {
      //Arrange
      //const app = await initializeApp();
      const dscalc = await setup();

      const instr = {};

      let tol = 1;

      //Act
      const answer = dscalc.hasSummedCalculations(instr, tol);

      //Assert
      expect(answer).toEqual(false);
    });

    it("Should add calc type if calc type is in instr", async () => {
      //Arrange
      //const app = await initializeApp();
      const dscalc = await setup();

      const instr = {
        tol1sumeu: 1,
        tol1sumread: 2,
      };

      let tol = 1;

      //Act
      const answer = dscalc.hasSummedCalculations(instr, tol);

      //Assert
      expect(answer).toEqual(true);
    });
  });

  describe("calculateAvgAndStdDeviation", () => {
    describe("analog", () => {
      it("Should calculate average and standard deviation values", () => {
        // Arrange
        /* prettier-ignore */
        const calpoints = [
          generatePoint({ asfoundinput: "10.003", asfoundoutput: "9.013" }),
          generatePoint({ asfoundinput: "12.123", asfoundoutput: "21.321" }),
          generatePoint({ asfoundinput: "23.40", asfoundoutput: "4.032" }),
          generatePoint({ asfoundinput: "23.00009", asfoundoutput: "9.000023" }),
          generatePoint({ asfoundinput: "16.23", asfoundoutput: "32.61" }),
          generatePoint({ asfoundinput: "23.677", asfoundoutput: "7.6732" }),
          generatePoint({ asfoundinput: "21.877", asfoundoutput: "7.7812" }),
          generatePoint({ asfoundinput: "16.222", asfoundoutput: "16.222" })
        ];

        const avgpoint = generatePoint({
          isaverage: true,
          plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        });

        const dsconfigitem = {
          stddev: DatasheetCalculation.DEVIATION_N,
        };

        const calc = new DatasheetCalculation(dsconfigitem);

        const instr = generateInst({
          gbfrom1: 1,
          gbto1: 1,
          gbsumdirection1: "-",
          gbopposite1: -1,
        });

        // Act
        const updatedAvgpoint = calc.calculateAvgAndStdDeviation(
          CalibrationPointConstants.CONDITION_ASFOUND,
          calpoints,
          avgpoint, 
          instr
        );

        // Assert
        expect(updatedAvgpoint.isaverage).toEqual(true);
        expect(updatedAvgpoint.plantype).toEqual("ANALOG");
        expect(updatedAvgpoint.asfinputstddev).toEqual("5.06710");
        expect(updatedAvgpoint.asfoundinput).toEqual("18.31651");
        expect(updatedAvgpoint.asfoundoutput).toEqual("13.456553");
        expect(updatedAvgpoint.asfoutputstddev).toEqual("8.877194");
      });
    });

    describe("discrete", () => {
      it("Should calculate average and standard deviation values", () => {
        // Arrange
        /* prettier-ignore */
        const calpoints = [
          generatePoint({ asfoundsetpoint: "10.003" }),
          generatePoint({ asfoundsetpoint: "12.123" }),
          generatePoint({ asfoundsetpoint: "23.40" }),
          generatePoint({ asfoundsetpoint: "23.00009" }),
          generatePoint({ asfoundsetpoint: "16.23" }),
          generatePoint({ asfoundsetpoint: "23.677" }),
          generatePoint({ asfoundsetpoint: "21.877" }),
          generatePoint({ asfoundsetpoint: "16.222" }),
        ];

        const avgpoint = generatePoint({
          isaverage: true,
          plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
        });

        const dsconfigitem = {
          stddev: DatasheetCalculation.DEVIATION_N,
        };

        const calc = new DatasheetCalculation(dsconfigitem);

        const instr = generateInst({
          gbfrom1: 1,
          gbto1: 1,
          gbsumdirection1: "-",
          gbopposite1: -1,
        });

        // Act
        const updatedAvgpoint = calc.calculateAvgAndStdDeviation(
          CalibrationPointConstants.CONDITION_ASFOUND,
          calpoints,
          avgpoint,
          instr
        );

        // Assert
        expect(updatedAvgpoint.asfoundsetpoint).toEqual("18.31651");
        expect(updatedAvgpoint.asfsetptstddev).toEqual("5.06710");
      });
    });
  });

  describe("calculatePrecisionByAttributeName", () => {
    it("Should return largest precision number", () => {
      // Arrange
      const calpoints = [
        generatePoint({ asfoundinput: "1.0023" }),
        generatePoint({ asfoundinput: "1.002345" }),
        generatePoint({ asfoundinput: "1.00234" }),
        generatePoint({ asfoundinput: "1.002" }),
      ];

      const calc = new DatasheetCalculation(null);

      const attributeName = `${CalibrationPointConstants.CONDITION_ASFOUND}input`;

      // Act
      const precision = calc.calculatePrecisionByAttr(calpoints, attributeName);

      // Assert
      expect(precision).toEqual(6);
    });
  });

  describe("calculateStandardDeviationByAttr", () => {
    it("Should calculate standard deviation by attribute name", () => {
      // Arrange
      const dsconfigItem = {
        stddev: DatasheetConstants.DEVIATION_N,
      };

      const calpoints = [
        generatePoint({ asfoundinput: "10.003" }),
        generatePoint({ asfoundinput: "12.123" }),
        generatePoint({ asfoundinput: "23.40" }),
        generatePoint({ asfoundinput: "23.00009" }),
        generatePoint({ asfoundinput: "16.23" }),
        generatePoint({ asfoundinput: "23.677" }),
        generatePoint({ asfoundinput: "21.877" }),
        generatePoint({ asfoundinput: "16.222" }),
      ];

      const avgValue = 18.31651125;

      const calc = new DatasheetCalculation(dsconfigItem);

      // Act
      const stddev = calc.calculateStandardDeviationByAttr(
        calpoints,
        avgValue,
        "asfoundinput"
      );

      // Assert
      expect(stddev).toEqual(5.0671027845935726);
    });
  });  

  describe("calculateRightPrecisionForStandardDeviationError", () => {
    const avgpoint = {
      asfoundinput: "3.00",
      asfoundoutput: "4.00",
      asfoundsetpoint: 6.00,
      isAverage: true,
      plantype: "ANALOG",
    };

    const instr = generateInst({
      gbfrom1: 1,
      gbto1: 1,
      gbsumdirection1: "-",
      gbopposite1: -1,
      outputprecision: 2
    });

    it("Should calculate standard deviation error precision",  async () => {
     
      const dscalc = await setup();
      // Act
      const precision = dscalc.calculateRightPrecisionForStandardDeviationError(
        avgpoint,
        "asfound",
        instr
      );

      // Assert
      expect(precision).toEqual(2);

    });

    it("Should calculate standard deviation error precision - max precision",  async () => {
    
      instr.outputprecision = 15;
      const dscalc = await setup();
      // Act
      const precision = dscalc.calculateRightPrecisionForStandardDeviationError(
        avgpoint,
        "asfound",
        instr
      );

      // Assert
      expect(precision).toEqual(10);
    });

    it("Should calculate standard deviation error precision - invalid plan type",  async () => {
      instr.outputprecision = 15;
      avgpoint.plantype = "INVALID";
      const dscalc = await setup();
      // Act
      const precision = dscalc.calculateRightPrecisionForStandardDeviationError(
        avgpoint,
        "asfound",
        instr
      );

      // Assert
      expect(precision).toEqual(0);
    });

    it("Should calculate standard deviation error precision - tolerror is USE_POINT_IO",  async () => {
      instr.outputprecision = 15;
      avgpoint.plantype = "ANALOG";
 
       // Arrange dsconfig
       const app = await initializeApp();
       const dsconfig = await loadDsConfig(
         app,
         TEST_DSPLANNUM,
         TEST_REVISIONNUM
       );
       dsconfig.currentItem.tolerror = DatasheetConstants.TOLERANCE.USE_POINT_IO;
 
       // Arrange datasheet calculation
       const dscalc = await setup(dsconfig.currentItem);

      // Act
      const precision = dscalc.calculateRightPrecisionForStandardDeviationError(
        avgpoint,
        "asfound",
        instr
      );

      // Assert
      expect(precision).toEqual(3);
    });

    it("Should calculate standard deviation error precision - tolerror is null",  async () => {
      instr.outputprecision = 15;
      avgpoint.plantype = "ANALOG";
      // Arrange dsconfig
      const app = await initializeApp();
      const dsconfig = await loadDsConfig(
        app,
        TEST_DSPLANNUM,
        TEST_REVISIONNUM
      );
      dsconfig.currentItem.tolerror = null;

      // Arrange datasheet calculation
      const dscalc = await setup(dsconfig.currentItem);

      // Act
      const precision = dscalc.calculateRightPrecisionForStandardDeviationError(
        avgpoint,
        "asfound",
        instr
      );

      // Assert
      expect(precision).toEqual(10);
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                         Generators                                         */
  /* -------------------------------------------------------------------------- */

  const generatePoint = (overridingProps) => {
    const defaultProps = {
      asfinputstddev: null,
      asfoundinput: null,
      asfoundoutput: null,
      asfoundsetpoint: null,
      asfoundsetptstddev: null,
      asfoutputstddev: null,
      asleftinput: null,
      asleftoutput: null,
      aslinputstddev: null,
      asloutputstddev: null,
      inputvalue: null,
      outputvalue: null,
      plantype: null,
      setpointvalue: null,
    };

    return defaults(overridingProps, defaultProps);
  };

  const generateInst = (overridingProps) => {
    const defaultProps = {
      _rowstamp: null,
      pluscwodsinstrid: null,
      pluscwodspoint: null,
      localref: null,
      plantype_maxvalue: null,
      description: null,
      href: null,
      dsplannum: null,
      plantype_description: null,
      plantype: null,
      outputprecision: null,
    };
    return defaults(overridingProps, defaultProps);
  };
 });
