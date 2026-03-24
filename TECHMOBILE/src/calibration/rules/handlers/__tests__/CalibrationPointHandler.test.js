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

/** Graphite resources */
import { Datasource, JSONDataAdapter } from "@maximo/maximo-js-api";

/** Test */
import newTestStub from "../../../../test/AppTestStub.jsx";
import testCalibrationData from "../../../test/test-calibration-data.js";
import testDomaincalstatusData from "../../../test/test-domaincalstatus-data.js";
import testCalpointsData from "../../../test/test-calpoints-data.js";

/** Constants */
import CalibrationPointConstants from "../../constants/CalibrationPointConstants";
import DatasheetConstants from "../../constants/DatasheetConstants";

/** Utils */
import defaults from "../../utils/defaults.js";
import generateRandomFloat from "../../utils/generateRandomFloat";
import generateRandomInt from "../../utils/generateRandomInt";
import pickRandom from "../../utils/pickRandom";
import toDisplayableValue from "../../utils/numberFormatter/toDisplayableValue";

/** Helpers */
import CalibrationPointHandler from "../CalibrationPointHandler";
import SynonymDomain from "../../models/SynonymDomain.js";

/** Implementation */
describe("CalibrationPointHandler", () => {
  const TEST_WODSNUM = 1011;

  const TEST_PLUSCWODSINSTRID = 10111;

  /**
   * Test suite setup
   * @param {Datasource} datasheetDS
   * @param {Datasource} calpointsDS
   * @returns
   */
  const setup = (
    datasheetDS,
    calpointsDS,
    domaincalstatusDS,
    assetFunctionDS,
    dsconfigDS,
    maxVars = []
  ) =>
    new CalibrationPointHandler(
      datasheetDS,
      calpointsDS,
      domaincalstatusDS,
      assetFunctionDS,
      dsconfigDS,
      maxVars
    );

  const initializeApp = async (pluscWoDsData = testCalibrationData) => {
    const app = await newTestStub({
      currentPage: "calibrationpoints",
      state: {
        assetFunctionsDetailsDS: "hello",
      },
      onNewState: (state) => {
        return { 
          ...state, 
          dataSheethref: testCalibrationData.href,
          canLoadCalibrationData: true
        }
      },
      datasources: {
        pluscWoDs: {
          data: pluscWoDsData,
        },
        domaincalstatusds: {
          data: testDomaincalstatusData,
        },
      },
      toast: jest.fn(),
      getLocalizedLabel: jest.fn(),
    })();

    return app;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore the spy created with spyOn
    jest.restoreAllMocks();
  });

  /* -------------------------------------------------------------------------- */
  /*                                Test Cases                                  */
  /* -------------------------------------------------------------------------- */

  describe("getCalpointsDS", () => {
    it("Should return instance of calibration point datasource", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);

      // Act
      const handler = setup(ds, calpoints);
      const actualDS = handler.getCalpointsDS();

      // Assert
      expect(actualDS.name).toEqual(calpoints.name);
    });

    it("Should return null when no datasource is provided", () => {
      // Arrange
      // Act
      const handler = setup();
      const actualDS = handler.getCalpointsDS();

      // Assert
      expect(actualDS).toEqual(null);
    });
  });

  describe("getDatasheetDS", () => {
    it("Should return instance of datasheet datasource", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);

      // Act
      const handler = setup(ds, calpoints);
      const actualDS = handler.getDatasheetDS();

      // Assert
      expect(actualDS.name).toEqual(ds.name);
    });

    it("Should return null when no datasource is provided", () => {
      // Arrange

      // Act
      const handler = setup();
      const actualDS = handler.getCalpointsDS();

      // Assert
      expect(actualDS).toEqual(null);
    });
  });

  describe("setCalpointsDS", () => {
    it("Should set property with calpoints datasource", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);

      // Act
      const handler = setup();
      const initialDS = handler.getCalpointsDS();

      handler.setCalpointsDS(calpoints);

      const actualDS = handler.getCalpointsDS();

      // Assert
      expect(initialDS).toEqual(null);
      expect(actualDS.name).toEqual(calpoints.name);
    });
  });

  describe("setDatasheetDS", () => {
    it("Should set property with datasheet datasource", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);

      // Act
      const handler = setup();
      const initialDS = handler.getDatasheetDS();

      handler.setDatasheetDS(ds);

      const actualDS = handler.getDatasheetDS();

      // Assert
      expect(initialDS).toEqual(null);
      expect(actualDS.name).toEqual(ds.name);
    });
  });

  describe("_getAssetFunctionStatus", () => {
    describe("asset function is calpoint", () => {
      it("Should return status of the highest tol{i}status found in point", () => {
        // Arrange
        const handler = setup();
        const assetfunctionMock = {
          calpoint: true,
          tol1status: DatasheetConstants.STATUS_FAIL,
          tol2status: DatasheetConstants.STATUS_FAIL,
          tol3status: DatasheetConstants.STATUS_FAIL,
          tol4status: DatasheetConstants.STATUS_PASS,

          tol3uppervalue: 2,
          tol3lowervalue: 0,
        };
        const calpointsMock = {
          items: [
            {
              asfounderror1: "1.035",
              asfounderror2: "1.035",
              asfounderror3: "1.036",
              asfounderror4: undefined,
              asfounderror: true,
            },
          ],
        };
        SynonymDomain.resolveToDefaultExternal = jest.fn(
          (domainCalStatusDs, dsStatus) => dsStatus
        );

        // Act
        const actualStatus = handler._getAssetFunctionStatus(
          assetfunctionMock,
          calpointsMock.items,
          CalibrationPointConstants.CONDITION_ASFOUND
        );

        // Assert
        expect(actualStatus).toEqual(DatasheetConstants.STATUS_FAIL);
        expect(assetfunctionMock.widestTolwidth).toEqual(2);
        expect(assetfunctionMock.widestTol).toEqual(3);
      });

      it("Should return initial status PASS when point set is empty", () => {
        // Arrange
        const handler = setup();
        const assetfunctionMock = { calpoint: true };
        const calpointsMock = { items: [] };
        SynonymDomain.resolveToDefaultExternal = jest.fn(
          (domainCalStatusDs, dsStatus) => dsStatus
        );

        // Spy on _getMaxToleranceExceeded
        const spy = jest.spyOn(handler, "_getMaxToleranceExceeded");

        // Act
        const actualStatus = handler._getAssetFunctionStatus(
          assetfunctionMock,
          calpointsMock.items,
          CalibrationPointConstants.CONDITION_ASFOUND
        );

        // Assert
        expect(actualStatus).toEqual(DatasheetConstants.STATUS_PASS);
        expect(spy).not.toHaveBeenCalled();
      });

      it("Should points with no error set", () => {
        // Arrange
        const handler = setup();
        const assetfunctionMock = { calpoint: true };
        const calpointsMock = {
          items: [
            {
              asfounderror: false,
              aslefterror: false,
            },
            {
              asfounderror: false,
              aslefterror: false,
            },
            {
              asfounderror: false,
              aslefterror: false,
            },
          ],
        };
        SynonymDomain.resolveToDefaultExternal = jest.fn(
          (domainCalStatusDs, dsStatus) => dsStatus
        );

        // Spy on _getMaxToleranceExceeded
        const spy = jest.spyOn(handler, "_getMaxToleranceExceeded");

        // Act
        const actualStatus = handler._getAssetFunctionStatus(
          assetfunctionMock,
          calpointsMock.items,
          CalibrationPointConstants.CONDITION_ASFOUND
        );

        // Assert
        expect(actualStatus).toEqual(DatasheetConstants.STATUS_PASS);
        expect(spy).not.toHaveBeenCalled();
      });

      it("Should skip assignment when tolindex is lower than maxtoleranceexceeded", () => {
        // Arrange
        const handler = setup();
        handler._getMaxToleranceExceeded = jest.fn(() => null);

        const assetfunctionMock = {
          calpoint: true,
          tol1status: DatasheetConstants.STATUS_FAIL,
          tol2status: DatasheetConstants.STATUS_FAIL,
          tol3status: DatasheetConstants.STATUS_FAIL,
          tol4status: DatasheetConstants.STATUS_PASS,
          tol3uppervalue: 2,
          tol3lowervalue: 0,
          widestTolwidth: null,
          widestTol: null,
        };
        const calpointsMock = {
          items: [
            {
              asfounderror1: "1.035",
              asfounderror2: "1.035",
              asfounderror3: "1.036",
              asfounderror4: undefined,
              asfounderror: true,
            },
          ],
        };
        SynonymDomain.resolveToDefaultExternal = jest.fn(
          (domainCalStatusDs, dsStatus) => dsStatus
        );

        // Act
        const actualStatus = handler._getAssetFunctionStatus(
          assetfunctionMock,
          calpointsMock.items,
          CalibrationPointConstants.CONDITION_ASFOUND
        );

        // Assert
        expect(actualStatus).toEqual(DatasheetConstants.STATUS_PASS);
        expect(assetfunctionMock.widestTolwidth).toEqual(null);
        expect(assetfunctionMock.widestTol).toEqual(null);
      });
    });

    describe("asset function is calfunction", () => {
      it("Should return initial status when point set is empty", () => {
        // Arrange
        const handler = setup();
        const assetfunctionMock = { calfunction: true };
        const calpointsMock = { items: [] };

        // Act
        const actualStatus = handler._getAssetFunctionStatus(
          assetfunctionMock,
          calpointsMock.items,
          CalibrationPointConstants.CONDITION_ASFOUND
        );

        // Assert
        expect(actualStatus).toEqual(null);
      });

      it("Should return initial status when point is neither pass or fail", () => {
        // Arrange
        const handler = setup();
        const assetfunctionMock = { calfunction: true };
        const calpointsMock = {
          items: [
            {
              asfoundfail: false,
              asfoundpass: false,
            },
          ],
        };

        // Act
        const actualStatus = handler._getAssetFunctionStatus(
          assetfunctionMock,
          calpointsMock.items,
          CalibrationPointConstants.CONDITION_ASFOUND
        );

        // Assert
        expect(actualStatus).toEqual(null);
      });

      it("Should return status FAIL when point is fail", () => {
        // Arrange
        const handler = setup();
        const assetfunctionMock = { calfunction: true };
        const calpointsMock = {
          items: [
            {
              asfoundfail: true,
              asfoundpass: false,
            },
          ],
        };
        SynonymDomain.resolveToInternal = jest.fn(
          (domainCalStatusDs, dsStatus) => dsStatus
        );
        SynonymDomain.resolveToDefaultExternal = jest.fn(
          (domainCalStatusDs, dsStatus) => dsStatus
        );

        // Act
        const actualStatus = handler._getAssetFunctionStatus(
          assetfunctionMock,
          calpointsMock.items,
          CalibrationPointConstants.CONDITION_ASFOUND
        );

        // Assert
        expect(actualStatus).toEqual(DatasheetConstants.STATUS_FAIL);
      });

      it("Should return status SUCESS when point is fail", () => {
        // Arrange
        const handler = setup();
        const assetfunctionMock = { calfunction: true };
        const calpointsMock = {
          items: [
            {
              asfoundfail: false,
              asfoundpass: true,
            },
          ],
        };
        SynonymDomain.resolveToInternal = jest.fn(
          (domainCalStatusDs, dsStatus) => dsStatus
        );
        SynonymDomain.resolveToDefaultExternal = jest.fn(
          (domainCalStatusDs, dsStatus) => dsStatus
        );

        // Act
        const actualStatus = handler._getAssetFunctionStatus(
          assetfunctionMock,
          calpointsMock.items,
          CalibrationPointConstants.CONDITION_ASFOUND
        );

        // Assert
        expect(actualStatus).toEqual(DatasheetConstants.STATUS_PASS);
      });

      it("Should return status NULL when point is neither fail nor pass", () => {
        // Arrange
        const handler = setup();
        const assetfunctionMock = { calfunction: true };
        const calpointsMock = {
          items: [
            {
              asfoundfail: "somethingelsethanboolean",
              asfoundpass: "somethingelsethanboolean",
            },
          ],
        };

        // Act
        const actualStatus = handler._getAssetFunctionStatus(
          assetfunctionMock,
          calpointsMock.items,
          CalibrationPointConstants.CONDITION_ASFOUND
        );

        // Assert
        expect(actualStatus).toEqual(null);
      });
    });

    it("Should return NULL when assetfunction is dynamic", () => {
      // Arrange
      const handler = setup();
      handler._getMaxToleranceExceeded = jest.fn(() => null);

      const assetfunctionMock = {
        caldynamic: true,
      };
      const calpointsMock = {
        items: [],
      };

      // Act
      const actualStatus = handler._getAssetFunctionStatus(
        assetfunctionMock,
        calpointsMock.items,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(actualStatus).toEqual(null);
    });
  });

  describe("getDomainCalStatusDS", () => {
    it("Should return null when domaincalstatus is not set", () => {
      // Arrange
      // Act
      const handler = setup();
      const actualDS = handler.getDomainCalStatusDS();

      // Assert
      expect(actualDS).toEqual(null);
    });

    it("Should return reference to domaincalstatus when exists", async () => {
      // Arrange
      const app = await initializeApp();
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      // Act
      const handler = setup();

      handler.setDomainCalStatusDS(domaincalstatusDS);

      const actualDS = handler.getDomainCalStatusDS();

      // Assert
      expect(actualDS.name).toEqual(domaincalstatusDS.name);
    });
  });

  describe("setDomainCalStatus", () => {
    it("Should set domaincalstatus instance", async () => {
      // Arrange
      const app = await initializeApp();
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      // Act
      const handler = setup();

      handler.setDomainCalStatusDS(domaincalstatusDS);

      const actualDS = handler.getDomainCalStatusDS();

      // Assert
      expect(actualDS.name).toEqual(domaincalstatusDS.name);
    });
  });

  describe("completeAsFoundAverageCalPointReadings", () => {
    it("Should invoke complete readings when called", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      const didClickOnCompleteReadings = true;

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS);
      handler._completeReadings = jest.fn();

      await handler.completeAsFoundAverageCalPointReadings(
        didClickOnCompleteReadings
      );

      // Assert
      expect(handler._completeReadings).toHaveBeenCalledTimes(1);
      expect(handler._completeReadings.mock.calls[0][1]).toEqual(
        CalibrationPointConstants.CONDITION_ASFOUND
      );
    });
  });

  describe("completeAsLeftAverageCalPointReadings", () => {
    it("Should invoke complete readings when called", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      const didClickOnCompleteReadings = true;

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS);
      handler._completeReadings = jest.fn();

      await handler.completeAsLeftAverageCalPointReadings(
        didClickOnCompleteReadings
      );

      // Assert
      expect(handler._completeReadings).toHaveBeenCalledTimes(1);
      expect(handler._completeReadings.mock.calls[0][1]).toEqual(
        CalibrationPointConstants.CONDITION_ASLEFT
      );
    });

    it("Should invoke complete readings when click is not mentioned", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS);
      handler._completeReadings = jest.fn();

      await handler.completeAsFoundAverageCalPointReadings(false);

      // Assert
      expect(handler._completeReadings).toHaveBeenCalledTimes(1);
      expect(handler._completeReadings.mock.calls[0][2]).toEqual(false);
    });
  });

  describe("_completeReadings", () => {
    it("Should return null when at least one calibration point is invalid", async () => {
      // Arrange
      const app = await initializeApp();

      // Arrange datasheet datasource and mock app functions
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);

      // Arrange assetfunctionDS
      const assetFunctionDS = createAssetFunctionDS([
        generateInst({ pluscwodsinstrid: TEST_PLUSCWODSINSTRID }),
      ]);

      // Arrange calibration point list
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const randomIndex = generateRandomInt(0, calpoints.items.length - 1);
      calpoints.items[randomIndex].invalidValueFound = true;

      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      const didClickOnCompleteReadings = true;

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS, assetFunctionDS);

      const assetfunction = await handler._completeReadings(
        null,
        CalibrationPointConstants.CONDITION_ASFOUND,
        didClickOnCompleteReadings
      );

      // Assert: should halt procedure and display a toast with error message
      expect(assetfunction).toEqual(null);
    });

    it("Should return null when assetfunction (parent of calpointsDS) is empty", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);
      const assetFunctionDS = createAssetFunctionDS([
        generateInst({ pluscwodsinstrid: TEST_PLUSCWODSINSTRID }),
      ]);

      const didClickOnCompleteReadings = true;

      calpoints.parent.currentItem = null;

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS, assetFunctionDS);

      const status = await handler._completeReadings(
        null,
        CalibrationPointConstants.CONDITION_ASFOUND,
        didClickOnCompleteReadings
      );

      // Assert
      expect(status).toEqual(null);
    });

    it("Should update asset function status when calibration point status changes", async () => {
      // Arrange calibration point list as if it was all good! It should return a PASS status
      const pluscWoDsData = {
        ...testCalibrationData.member,
        member: [
          {
            ...testCalibrationData.member[0],
            asfoundcalstatus: DatasheetConstants.STATUS_PASS,
            pluscwodsinstr: [
              {
                ...testCalibrationData.member[0].pluscwodsinstr[0],
                asfoundcalstatus: DatasheetConstants.STATUS_WARNING,
                calpoint: true,
                pluscwodspoint: testCalpointsData.member.map((item) => ({
                  ...item,
                  asfounderror: 0,
                  aslefterror: 0,
                  asfoundfail: 0,
                })),
              },
            ],
          },
        ],
      };

      const app = await initializeApp(pluscWoDsData);
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      const assetFunctionDS = createAssetFunctionDS([
        generateInst({
          ...testCalibrationData.member[0].pluscwodsinstr[0],
          asfoundcalstatus: DatasheetConstants.STATUS_WARNING,
          calpoint: true,
          pluscwodspoint: testCalpointsData.member.map((item) => ({
            ...item,
            asfounderror: 0,
            aslefterror: 0,
            asfoundfail: 0,
          })),
        }),
      ]);
      await assetFunctionDS.load();

      const didClickOnCompleteReadings = false;

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS, assetFunctionDS);

      handler.enableCompleteReadingsButton = jest.fn(() => true);
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );
      SynonymDomain.resolveToDefaultExternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      await handler._completeReadings(
        null,
        CalibrationPointConstants.CONDITION_ASFOUND,
        didClickOnCompleteReadings
      );

      // Assert
      expect(calpoints.parent.items.length).toBeGreaterThan(0);
      expect(calpoints.parent.currentItem.asfoundcalstatus).toEqual(
        DatasheetConstants.STATUS_PASS
      );
      expect(ds.currentItem.asfoundcalstatus).toEqual(
        DatasheetConstants.STATUS_PASS
      );
    });

    it("Should show status message when user clicks into complete readings", async () => {
      // Arrange calibration point list as if it was all good! It should return a PASS status
      const pluscWoDsData = {
        ...testCalibrationData.member,
        member: [
          {
            ...testCalibrationData.member[0],
            pluscwodsinstr: [
              {
                ...testCalibrationData.member[0].pluscwodsinstr[0],
                asfoundcalstatus: DatasheetConstants.STATUS_WARNING,
                calpoint: true,
                pluscwodspoint: testCalpointsData.member.map((item) => ({
                  ...item,
                  asfounderror: 0,
                  aslefterror: 0,
                  asfoundfail: 0,
                })),
              },
            ],
          },
        ],
      };

      const app = await initializeApp(pluscWoDsData);
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);

      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);
      const assetFunctionDS = createAssetFunctionDS([
        generateInst({
          ...testCalibrationData.member[0].pluscwodsinstr[0],
          asfoundcalstatus: DatasheetConstants.STATUS_WARNING,
          calpoint: true,
          pluscwodspoint: testCalpointsData.member.map((item) => ({
            ...item,
            asfounderror: 0,
            aslefterror: 0,
            asfoundfail: 0,
          })),
        }),
      ]);
      await assetFunctionDS.load();

      const didClickOnCompleteReadings = true;

      const maxVars = [
        {
          varname: "PLUSCAUTOSTATUS",
          varvalue: "1",
          orgid: "EAGLENA",
          siteid: null,
          maxvarsid: 1,
          vartype: "ORG",
        },
      ];

      // Act
      const handler = setup(
        ds,
        calpoints,
        domaincalstatusDS,
        assetFunctionDS,
         null,
        maxVars
      );

      handler.enableCompleteReadingsButton = jest.fn(() => true);
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );
      SynonymDomain.resolveToDefaultExternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      await handler._completeReadings(
        null,
        CalibrationPointConstants.CONDITION_ASFOUND,
        didClickOnCompleteReadings
      );

      // Assert
      expect(calpoints.parent.items.length).toBeGreaterThan(0);
      expect(calpoints.parent.currentItem.asfoundcalstatus).toEqual(
        DatasheetConstants.STATUS_PASS
      );
      expect(ds.currentItem.asfoundcalstatus).toEqual(
        DatasheetConstants.STATUS_PASS
      );
    });

    it("Should NOT show status message when neither user clicked into complete readings nor status exist", async () => {
      // Arrange calibration point list as if it was all good! It should return a PASS status
      const pluscWoDsData = {
        ...testCalibrationData.member,
        member: [
          {
            ...testCalibrationData.member[0],
            pluscwodsinstr: [
              {
                ...testCalibrationData.member[0].pluscwodsinstr[0],
                asfoundcalstatus: DatasheetConstants.STATUS_WARNING,
                calpoint: true,
                pluscwodspoint: testCalpointsData.member.map((item) => ({
                  ...item,
                  asfounderror: 0,
                  aslefterror: 0,
                  asfoundfail: 0,
                })),
              },
            ],
          },
        ],
      };

      const app = await initializeApp(pluscWoDsData);

      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const toastMockFn = jest.fn();
      ds.getApplication = jest.fn(() => ({
        toast: toastMockFn,
        state: {
          pluscwodsinstrid: TEST_PLUSCWODSINSTRID,
        },
        getLocalizedLabel: jest.fn(),
      }));

      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);
      const assetFunctionDS = createAssetFunctionDS([
        generateInst({ pluscwodsinstrid: TEST_PLUSCWODSINSTRID }),
      ]);

      const didClickOnCompleteReadings = false;

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS, assetFunctionDS);
      handler._getAssetFunctionStatus = jest.fn(() => null);

      await handler._completeReadings(
        null,
        CalibrationPointConstants.CONDITION_ASFOUND,
        didClickOnCompleteReadings
      );

      // Assert
      expect(toastMockFn).not.toHaveBeenCalled();
    });
  });

  describe("_getMaxToleranceExceeded", () => {
    it("Should return null when there's no tolerance exceeded", () => {
      // Arrange
      const point = {
        asfounderror1: undefined,
        asfounderror2: undefined,
        asfounderror3: undefined,
        asfounderror4: undefined,
      };

      const handler = setup();

      // Act
      const maxtolexceeded = handler._getMaxToleranceExceeded(
        point,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(maxtolexceeded).toEqual(null);
    });

    it("Should return null when tolerance value is zero", () => {
      for (let i = 1; i < 5; i++) {
        // Arrange
        const point = { [`asfounderror${i}`]: 0 };
        const handler = setup();

        // Act
        const maxtolexceeded = handler._getMaxToleranceExceeded(
          point,
          CalibrationPointConstants.CONDITION_ASFOUND
        );

        // Assert
        expect(maxtolexceeded).toEqual(null);
      }
    });

    it("Should return index when tolerance value is exceeded", () => {
      for (let i = 1; i < 5; i++) {
        // Arrange
        const error = generateRandomFloat();
        const errorStr = toDisplayableValue(error, {
          places: DatasheetConstants.DEFAULT_PRECISION,
          round: DatasheetConstants.ROUND_VALUE,
        });
        const point = { [`asfounderror${i}`]: errorStr };
        const handler = setup();

        // Act
        const maxtolexceeded = handler._getMaxToleranceExceeded(
          point,
          CalibrationPointConstants.CONDITION_ASFOUND
        );

        // Assert
        expect(maxtolexceeded).toEqual(i);
      }
    });

    it("Should return max index when multiple tolerance values are exceeded", () => {
      // Arrange
      const point = {
        asfounderror1: "1,000.38216",
        asfounderror2: "1,000.3057",
        asfounderror3: "2,000.14109",
        asfounderror4: undefined,
      };

      const handler = setup();

      // Act
      const maxtolexceeded = handler._getMaxToleranceExceeded(
        point,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(maxtolexceeded).toEqual(3);
    });
  });

  describe("enableCompleteReadingsButton", () => {
    it("Should return undefined for new point", async () => {
      // Arrange
      const app = await initializeApp();

      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      // const toastMockFn = jest.fn();
      // const getLocalizedLabelMockFn = jest.fn();
      ds.getApplication = jest.fn(() => app);

      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      const handler = setup(ds, calpoints, domaincalstatusDS);
      const assetFunc = {
        currentItem: {
          newPoint: true,
        },
      };
      handler.getAssetFunctionDS = jest.fn(() => assetFunc);
      handler.syncDisplaynActualResource = jest.fn();

      const checkAsLeft = false;
      const groupValidation = false;

      const result = handler.enableCompleteReadingsButton(
        checkAsLeft,
        groupValidation
      );

      expect(result).toEqual(undefined);
    });
    it("Should return false for empty pointset", async () => {
      // Arrange
      const app = await initializeApp();

      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      // const toastMockFn = jest.fn();
      // const getLocalizedLabelMockFn = jest.fn();
      ds.getApplication = jest.fn(() => app);

      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      const handler = setup(ds, calpoints, domaincalstatusDS);
      const assetFunc = {
        currentItem: {
          newPoint: false,
        },
      };
      const calPointDS = {};

      handler.getAssetFunctionDS = jest.fn(() => assetFunc);
      handler.getCalpointsDS = jest.fn(() => calPointDS);
      handler.syncDisplaynActualResource = jest.fn();

      const checkAsLeft = false;
      const groupValidation = false;

      const result = handler.enableCompleteReadingsButton(
        checkAsLeft,
        groupValidation
      );

      expect(result).toEqual(false);
    });
    describe("calfunction is true", () => {
      it("Should return true when ascheckleft is false", async () => {
        // Arrange
        const app = await initializeApp();

        const ds = await loadDatasheetDS(app, TEST_WODSNUM);
        // const toastMockFn = jest.fn();
        // const getLocalizedLabelMockFn = jest.fn();
        ds.getApplication = jest.fn(() => app);

        const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
        const domaincalstatusDS = await loadDomainCalStatusDS(app);

        const handler = setup(ds, calpoints, domaincalstatusDS);
        const assetFunc = {
          currentItem: {
            newPoint: false,
            calfunction: true,
          },
        };
        const item1 = {
          asfoundpass: true,
        };
        const item2 = {
          asfoundfail: true,
        };
        const pointSet = {
          items: [item1, item2],
        };

        handler.getAssetFunctionDS = jest.fn(() => assetFunc);
        handler.getCalpointsDS = jest.fn(() => pointSet);
        handler.syncDisplaynActualResource = jest.fn();

        const checkAsLeft = false;
        const groupValidation = false;

        const result = handler.enableCompleteReadingsButton(
          checkAsLeft,
          groupValidation
        );

        expect(result).toEqual(true);
      });

      it("Should return true when ascheckleft is true", async () => {
        // Arrange
        const app = await initializeApp();

        const ds = await loadDatasheetDS(app, TEST_WODSNUM);
        // const toastMockFn = jest.fn();
        // const getLocalizedLabelMockFn = jest.fn();
        ds.getApplication = jest.fn(() => app);

        const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
        const domaincalstatusDS = await loadDomainCalStatusDS(app);

        const handler = setup(ds, calpoints, domaincalstatusDS);
        const assetFunc = {
          currentItem: {
            newPoint: false,
            calfunction: true,
          },
        };
        const item1 = {
          asfoundpass: true,
          asleftpass: true,
        };
        const item2 = {
          asfoundfail: true,
          asleftfail: true,
        };
        const pointSet = {
          items: [item1, item2],
        };

        handler.getAssetFunctionDS = jest.fn(() => assetFunc);
        handler.getCalpointsDS = jest.fn(() => pointSet);
        handler.syncDisplaynActualResource = jest.fn();

        const checkAsLeft = true;
        const groupValidation = false;

        const result = handler.enableCompleteReadingsButton(
          checkAsLeft,
          groupValidation
        );

        expect(result).toEqual(true);
      });
    });

    describe("caldynamic is true", () => {
      it("Should return true when ascheckleft is false", async () => {
        // Arrange
        const app = await initializeApp();

        const ds = await loadDatasheetDS(app, TEST_WODSNUM);
        // const toastMockFn = jest.fn();
        // const getLocalizedLabelMockFn = jest.fn();
        ds.getApplication = jest.fn(() => app);

        const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
        const domaincalstatusDS = await loadDomainCalStatusDS(app);

        const handler = setup(ds, calpoints, domaincalstatusDS);
        const assetFunc = {
          currentItem: {
            newPoint: false,
            caldynamic: true,
          },
        };
        const item1 = {
          asfoundinput: 1,
          asfoundunit: "Deg C",
          asleftinput: 2,
          asleftunit: "Deg C",
        };
        const item2 = {
          asfoundinput: 2,
          asfoundunit: "Meters",
          asleftinput: 3,
          asleftunit: "Meters",
        };
        const pointSet = {
          items: [item1, item2],
        };

        handler.getAssetFunctionDS = jest.fn(() => assetFunc);
        handler.getCalpointsDS = jest.fn(() => pointSet);
        handler.syncDisplaynActualResource = jest.fn();

        const checkAsLeft = false;
        const groupValidation = false;

        const result = handler.enableCompleteReadingsButton(
          checkAsLeft,
          groupValidation
        );

        expect(result).toEqual(true);
      });

      it("Should return true when ascheckleft is true", async () => {
        // Arrange
        const app = await initializeApp();

        const ds = await loadDatasheetDS(app, TEST_WODSNUM);
        // const toastMockFn = jest.fn();
        // const getLocalizedLabelMockFn = jest.fn();
        ds.getApplication = jest.fn(() => app);

        const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
        const domaincalstatusDS = await loadDomainCalStatusDS(app);

        const handler = setup(ds, calpoints, domaincalstatusDS);
        const assetFunc = {
          currentItem: {
            newPoint: false,
            caldynamic: true,
          },
        };
        const item1 = {
          asfoundinput: 1,
          asfoundunit: "Deg C",
          asleftinput: 2,
          asleftunit: "Deg C",
        };
        const item2 = {
          asfoundinput: 2,
          asfoundunit: "Meters",
          asleftinput: 3,
          asleftunit: "Meters",
        };
        const pointSet = {
          items: [item1, item2],
        };

        handler.getAssetFunctionDS = jest.fn(() => assetFunc);
        handler.getCalpointsDS = jest.fn(() => pointSet);
        handler.syncDisplaynActualResource = jest.fn();

        const checkAsLeft = true;
        const groupValidation = false;

        const result = handler.enableCompleteReadingsButton(
          checkAsLeft,
          groupValidation
        );

        expect(result).toEqual(true);
      });
    });

    describe("calpoint is true", () => {
      it("Should return true when ascheckleft is false and group is false", async () => {
        // Arrange
        const app = await initializeApp();

        const ds = await loadDatasheetDS(app, TEST_WODSNUM);
        // const toastMockFn = jest.fn();
        // const getLocalizedLabelMockFn = jest.fn();
        ds.getApplication = jest.fn(() => app);

        const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
        const domaincalstatusDS = await loadDomainCalStatusDS(app);

        const handler = setup(ds, calpoints, domaincalstatusDS);
        const assetFunc = {
          currentItem: {
            newPoint: false,
            calpoint: true,
          },
        };
        const item1 = {
          asfoundinput: 1,
          asfoundoutput: 2,
          asfoundunit: "Deg C",
          asleftinput: 2,
          asleftunit: "Deg C",
        };
        const item2 = {
          asfoundinput: 2,
          asfoundoutput: 2,
          asfoundunit: "Meters",
          asleftinput: 3,
          asleftunit: "Meters",
        };
        const pointSet = {
          items: [item1, item2],
        };

        handler.getAssetFunctionDS = jest.fn(() => assetFunc);
        handler.getCalpointsDS = jest.fn(() => pointSet);
        handler.syncDisplaynActualResource = jest.fn();

        const checkAsLeft = false;
        const groupValidation = false;

        const result = handler.enableCompleteReadingsButton(
          checkAsLeft,
          groupValidation
        );

        expect(result).toEqual(true);
      });
      it("Should return true when ascheckleft is false and group is true", async () => {
        // Arrange
        const app = await initializeApp();

        const ds = await loadDatasheetDS(app, TEST_WODSNUM);
        // const toastMockFn = jest.fn();
        // const getLocalizedLabelMockFn = jest.fn();
        ds.getApplication = jest.fn(() => app);

        const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
        const domaincalstatusDS = await loadDomainCalStatusDS(app);

        const handler = setup(ds, calpoints, domaincalstatusDS);
        const assetFunc = {
          currentItem: {
            newPoint: false,
            calpoint: true,
          },
        };
        const item1 = {
          asfoundinput: 1,
          asfoundoutput: 2,
          asfoundunit: "Deg C",
          asleftinput: 2,
          asleftunit: "Deg C",
        };
        const item2 = {
          asfoundinput: 2,
          asfoundoutput: 2,
          asfoundunit: "Meters",
          asleftinput: 3,
          asleftunit: "Meters",
        };
        const pointSet = {
          items: [item1, item2],
        };

        handler.getAssetFunctionDS = jest.fn(() => assetFunc);
        handler.getCalpointsDS = jest.fn(() => pointSet);
        handler.syncDisplaynActualResource = jest.fn();

        const checkAsLeft = false;
        const groupValidation = true;

        const result = handler.enableCompleteReadingsButton(
          checkAsLeft,
          groupValidation
        );

        expect(result).toEqual(true);
      });

      it("Should return true when ascheckleft is true and group is false", async () => {
        // Arrange
        const app = await initializeApp();

        const ds = await loadDatasheetDS(app, TEST_WODSNUM);
        // const toastMockFn = jest.fn();
        // const getLocalizedLabelMockFn = jest.fn();
        ds.getApplication = jest.fn(() => app);

        const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
        const domaincalstatusDS = await loadDomainCalStatusDS(app);

        const handler = setup(ds, calpoints, domaincalstatusDS);
        const assetFunc = {
          currentItem: {
            newPoint: false,
            calpoint: true,
          },
        };
        const item1 = {
          asfoundinput: 1,
          asfoundoutput: 2,
          asleftinput: 3,
          asleftoutput: 4,
        };
        const item2 = {
          asfoundinput: 1,
          asfoundoutput: 2,
          asleftinput: 3,
          asleftoutput: 4,
        };
        const pointSet = {
          items: [item1, item2],
        };

        handler.getAssetFunctionDS = jest.fn(() => assetFunc);
        handler.getCalpointsDS = jest.fn(() => pointSet);
        handler.syncDisplaynActualResource = jest.fn();

        const checkAsLeft = true;
        const groupValidation = false;

        const result = handler.enableCompleteReadingsButton(
          checkAsLeft,
          groupValidation
        );

        expect(result).toEqual(true);
      });
      it("Should return true when ascheckleft is true and group is true", async () => {
        // Arrange
        const app = await initializeApp();

        const ds = await loadDatasheetDS(app, TEST_WODSNUM);
        // const toastMockFn = jest.fn();
        // const getLocalizedLabelMockFn = jest.fn();
        ds.getApplication = jest.fn(() => app);

        const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
        const domaincalstatusDS = await loadDomainCalStatusDS(app);

        const handler = setup(ds, calpoints, domaincalstatusDS);
        const assetFunc = {
          currentItem: {
            newPoint: false,
            calpoint: true,
          },
        };
        const item1 = {
          asfoundinput: 1,
          asfoundoutput: 2,
          asleftinput: 3,
          asleftoutput: 4,
        };
        const item2 = {
          asfoundinput: 1,
          asfoundoutput: 2,
          asleftinput: 3,
          asleftoutput: 4,
        };
        const pointSet = {
          items: [item1, item2],
        };

        handler.getAssetFunctionDS = jest.fn(() => assetFunc);
        handler.getCalpointsDS = jest.fn(() => pointSet);
        handler.syncDisplaynActualResource = jest.fn();

        const checkAsLeft = true;
        const groupValidation = true;

        const result = handler.enableCompleteReadingsButton(
          checkAsLeft,
          groupValidation
        );

        expect(result).toEqual(true);
      });
    });
  });

  describe("enableGroupCompleteReadingsAsFound", () => {
    it("Should run enableCompleteReadingsButton", async () => {
      const handler = setup();
      handler.enableCompleteReadingsButton = jest.fn();
      handler.enableGroupCompleteReadingsAsFound();
      expect(handler.enableCompleteReadingsButton).toHaveBeenCalled();
    });
  });

  describe("enableGroupCompleteReadingsAsLeft", () => {
    it("Should run enableCompleteReadingsButton", async () => {
      const handler = setup();
      handler.enableCompleteReadingsButton = jest.fn();
      handler.enableGroupCompleteReadingsAsLeft();
      expect(handler.enableCompleteReadingsButton).toHaveBeenCalled();
    });
  });

  describe("enableCompleteReadingsAsFound", () => {
    it("Should run enableCompleteReadingsButton", async () => {
      const handler = setup();
      handler.enableCompleteReadingsButton = jest.fn();
      handler.enableCompleteReadingsAsFound();
      expect(handler.enableCompleteReadingsButton).toHaveBeenCalled();
    });
  });

  describe("enableCompleteReadingsAsLeft", () => {
    it("Should run enableCompleteReadingsButton", async () => {
      const handler = setup();
      handler.enableCompleteReadingsButton = jest.fn();
      handler.enableCompleteReadingsAsLeft();
      expect(handler.enableCompleteReadingsButton).toHaveBeenCalled();
    });
  });

  describe("areFunctionChecksComplete", () => {
    it("Should return true when checks are complete", async () => {
      // Arrange
      const handler = setup();
      const prefix = "asfound";
      const item1 = {
        asfoundpass: true,
      };
      const item2 = {
        asfoundfail: true,
      };
      const pointSet = {
        items: [item1, item2],
      };

      // Act
      const result = handler.areFunctionChecksComplete(pointSet, prefix);

      // Assert
      expect(result).toEqual(true);
    });

    it("Should return false when checks are not complete", async () => {
      // Arrange
      const handler = setup();
      const prefix = "asfound";
      const item1 = {
        asfoundinput: 1,
      };
      const item2 = {
        asfoundoutput: 1,
      };
      const pointSet = {
        items: [item1, item2],
      };

      // Act
      const result = handler.areFunctionChecksComplete(pointSet, prefix);

      // Assert
      expect(result).toEqual(false);
    });

    it("Should return true when prefix is not rpovided", async () => {
      // Arrange
      const handler = setup();
      const item1 = {
        asfoundinput: 1,
      };
      const item2 = {
        asfoundoutput: 1,
      };
      const pointSet = {
        items: [item1, item2],
      };

      // Act
      const result = handler.areFunctionChecksComplete(pointSet);

      // Assert
      expect(result).toEqual(true);
    });
  });

  describe("areDynamicChecksComplete", () => {
    it("Should return true when checks are complete", async () => {
      // Arrange
      const handler = setup();
      const prefix = "asfound";
      const item1 = {
        asfoundinput: 1,
        asfoundunit: "Deg C",
      };
      const item2 = {
        asfoundinput: 2,
        asfoundunit: "Meters",
      };
      const pointSet = {
        items: [item1, item2],
      };

      // Act
      const result = handler.areDynamicChecksComplete(pointSet, prefix);

      // Assert
      expect(result).toEqual(true);
    });

    it("Should return false when checks are not complete", async () => {
      // Arrange
      const handler = setup();
      const prefix = "asfound";
      const item1 = {
        asfoundinput: 1,
      };
      const item2 = {
        asfoundoutput: 1,
      };
      const pointSet = {
        items: [item1, item2],
      };

      // Act
      const result = handler.areDynamicChecksComplete(pointSet, prefix);

      // Assert
      expect(result).toEqual(false);
    });

    it("Should return true when prefix is not provided", async () => {
      // Arrange
      const handler = setup();
      const item1 = {
        asfoundinput: 1,
      };
      const item2 = {
        asfoundoutput: 1,
      };
      const pointSet = {
        items: [item1, item2],
      };

      // Act
      const result = handler.areDynamicChecksComplete(pointSet);

      // Assert
      expect(result).toEqual(true);
    });
  });

  describe("areCalPointsComplete", () => {
    it("Should return true when checks are complete and all points have input and output", async () => {
      // Arrange
      const handler = setup();
      const prefix = "asfound";
      const item1 = {
        asfoundinput: 1,
        asfoundunit: "Deg C",
        asfoundoutput: 2,
      };
      const item2 = {
        asfoundinput: 2,
        asfoundunit: "Meters",
        asfoundoutput: 2,
      };
      const pointSet = {
        items: [item1, item2],
      };

      // Act
      const result = handler.areCalPointsComplete(pointSet, prefix);

      // Assert
      expect(result).toEqual(true);
    });

    it("Should return true when checks are complete and all points have setpoint", async () => {
      // Arrange
      const handler = setup();
      const prefix = "asfound";
      const item1 = {
        asfoundsetpoint: 1,
      };
      const item2 = {
        asfoundsetpoint: 1,
      };
      const pointSet = {
        items: [item1, item2],
      };

      // Act
      const result = handler.areCalPointsComplete(pointSet, prefix);
      // Assert
      expect(result).toEqual(true);
    });

    it("Should return true when checks are not complete", async () => {
      // Arrange
      const handler = setup();
      const prefix = "asfound";
      const item1 = {
        asfoundinput: 1,
      };
      const item2 = {
        asfoundsetpoint: 1,
      };

      const item3 = {
        asfoundoutput: 1,
      };
      const pointSet = {
        items: [item1, item2, item3],
      };

      // Act
      const result = handler.areCalPointsComplete(pointSet, prefix);
      // Assert
      expect(result).toEqual(false);
    });

    it("Should return true when prefix is not provided", async () => {
      // Arrange
      const handler = setup();
      const item1 = {
        asfoundinput: 1,
      };
      const item2 = {
        asfoundoutput: 1,
      };
      const pointSet = {
        items: [item1, item2],
      };

      // Act
      const result = handler.areCalPointsComplete(pointSet);
      // Assert
      expect(result).toEqual(true);
    });
  });
  describe("areGroupCalPointsComplete", () => {
    it("Should return true when checks are complete and all points have input and output", async () => {
      // Arrange
      const handler = setup();
      const prefix = "asfound";
      const item1 = {
        asfoundinput: 1,
        asfoundunit: "Deg C",
        asfoundoutput: 2,
        assetfunction: "caldynamic",
      };
      const item2 = {
        asfoundinput: 2,
        asfoundunit: "Meters",
        asfoundoutput: 2,
        assetfunction: "caldynamic",
      };
      const pointSet = {
        items: [item1, item2],
      };

      const assetfunc = "caldynamic";

      // Act
      const result = handler.areGroupCalPointsComplete(
        pointSet,
        prefix,
        assetfunc
      );

      // Assert
      expect(result).toEqual(true);
    });

    it("Should return true when checks are complete and all points have setpoint", async () => {
      // Arrange
      const handler = setup();
      const prefix = "asfound";
      const item1 = {
        asfoundsetpoint: 1,
      };
      const item2 = {
        asfoundsetpoint: 1,
        assetfunction: "caldynamic",
      };
      const pointSet = {
        items: [item1, item2],
      };

      const assetfunc = "caldynamic";

      // Act
      const result = handler.areGroupCalPointsComplete(
        pointSet,
        prefix,
        assetfunc
      );

      // Assert
      expect(result).toEqual(true);
    });

    it("Should return true when prefix is null", async () => {
      // Arrange
      const handler = setup();
      const prefix = null;
      const item1 = {
        asfoundsetpoint: 1,
      };
      const item2 = {
        asfoundsetpoint: 1,
        assetfunction: "caldynamic",
      };
      const pointSet = {
        items: [item1, item2],
      };

      const assetfunc = "caldynamic";

      // Act
      const result = handler.areGroupCalPointsComplete(
        pointSet,
        prefix,
        assetfunc
      );

      // Assert
      expect(result).toEqual(true);
    });

    it("Should return false when checks are not complete", async () => {
      // Arrange
      const handler = setup();
      const prefix = "asfound";
      const item1 = {
        asfoundinput: 1,
        assetfunction: "caldynamic",
      };
      const item2 = {
        asfoundsetpoint: 1,
        assetfunction: "caldynamic",
      };

      const item3 = {
        asfoundoutput: 1,
      };
      const pointSet = {
        items: [item1, item2, item3],
      };

      const assetfunc = "caldynamic";

      // Act
      const result = handler.areGroupCalPointsComplete(
        pointSet,
        prefix,
        assetfunc
      );
      // Assert
      expect(result).toEqual(false);
    });

    it("Should return true when prefix is not provided", async () => {
      // Arrange
      const handler = setup();
      const prefix = "";
      const item1 = {
        asfoundinput: 1,
      };
      const item2 = {
        asfoundoutput: 1,
      };
      const pointSet = {
        items: [item1, item2],
      };

      const assetfunc = "caldynamic";

      // Act
      const result = handler.areGroupCalPointsComplete(
        pointSet,
        prefix,
        assetfunc
      );
      // Assert
      expect(result).toEqual(true);
    });
  });

  describe("isPointValid", () => {
    it("Should return true for valid calpoint", async () => {
      // Arrange
      const handler = setup();
      const prefix = "asfound";
      const point = {
        asfoundinput: 1,
        asfoundunit: "Deg C",
        asfoundoutput: 2,
      };

      const assetFunction = {
        calpoint: true,
      };

      // Act
      const result = handler.isPointValid(assetFunction, point, prefix);

      // Assert
      expect(result).toEqual(true);
    });

    it("Should return true for valid calfunc", async () => {
      // Arrange
      const handler = setup();
      const prefix = "asfound";
      const point = {
        asfoundpass: true,
        asfoundunit: "Deg C",
      };

      const assetFunction = {
        calfunction: true,
      };

      // Act
      const result = handler.isPointValid(assetFunction, point, prefix);

      // Assert
      expect(result).toEqual(true);
    });

    it("Should return true for valid dynamic check", async () => {
      // Arrange
      const handler = setup();
      const prefix = "asfound";
      const point = {
        asfoundinput: 1,
        asfoundunit: "Deg C",
        asfoundoutput: 2,
      };

      const assetFunction = {
        caldynamic: true,
      };

      // Act
      const result = handler.isPointValid(assetFunction, point, prefix);

      // Assert
      expect(result).toEqual(true);
    });

    it("Should return false for invalid dynamic check", async () => {
      // Arrange
      const handler = setup();
      const prefix = "asfound";
      const point = {
        asfoundinput: 1,
      };

      const assetFunction = {
        caldynamic: true,
      };

      // Act
      const result = handler.isPointValid(assetFunction, point, prefix);

      // Assert
      expect(result).toEqual(false);
    });

    it("Should return false if non of the point types are true", async () => {
      // Arrange
      const handler = setup();
      const prefix = "asfound";
      const point = {
        asfoundinput: 1,
      };

      const assetFunction = {};

      // Act
      const result = handler.isPointValid(assetFunction, point, prefix);

      // Assert
      expect(result).toEqual(false);
    });
  });

  describe("isErrorCalculated", () => {
    it("Should return false when number is null", () => {
      // Arrange
      const handler = setup();

      // Act
      const isErrorCalculated = handler.isErrorCalculated(null);

      // Assert
      expect(isErrorCalculated).toEqual(false);
    });

    it("Should return false when number is undefined", () => {
      // Arrange
      const handler = setup();

      // Act
      const isErrorCalculated = handler.isErrorCalculated(undefined);

      // Assert
      expect(isErrorCalculated).toEqual(false);
    });

    it("Should return false when absolute number is equal to zero", () => {
      // Arrange
      const handler = setup();

      // Act
      const isErrorCalculated = handler.isErrorCalculated(0);

      // Assert
      expect(isErrorCalculated).toEqual(false);
    });

    it("Should return true when value is a number higher than zero", () => {
      // Arrange
      const handler = setup();

      // Act
      const isErrorCalculated = handler.isErrorCalculated(generateRandomInt());

      // Assert
      expect(isErrorCalculated).toEqual(true);
    });

    it("Should return true when value is a number lower than zero", () => {
      // Arrange
      const handler = setup();

      // Act
      const isErrorCalculated = handler.isErrorCalculated(
        -1 * generateRandomInt()
      );

      // Assert
      expect(isErrorCalculated).toEqual(true);
    });
  });

  describe("_updateDataSheetStatus", () => {
    it("Should update datasheet status when auto update flag is TRUE and is NOT missing status", async () => {
      // Arrange
      const app = await initializeApp();

      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      ds.currentItem = {
        ...ds.currentItem,
        asfoundcalstatus: DatasheetConstants.STATUS_WARNING,
        pluscwodsinstr: [
          {
            caldynamic: false,
            asfoundcalstatus: DatasheetConstants.STATUS_PASS,
          },
        ],
      };
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );
      SynonymDomain.resolveToDefaultExternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      const handler = setup(ds, calpoints, domaincalstatusDS);
      handler.autoUpdateDataSheetStatus = jest.fn(() => true);

      // Act
      const datasheet = await handler._updateDataSheetStatus(
        null,
        ds,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(handler.autoUpdateDataSheetStatus).toHaveBeenCalled();
      expect(datasheet["asfoundcalstatus"]).toEqual(
        DatasheetConstants.STATUS_PASS
      );
      expect(datasheet).toHaveProperty("asfoundstatusdesc_np");
      expect(datasheet).toHaveProperty("asfoundstatusicon_np");
    });

    it("Should do nothing when auto update flag is FALSE", async () => {
      // Arrange
      const app = await initializeApp();

      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      ds.currentItem = {
        ...ds.currentItem,
        asfoundcalstatus: DatasheetConstants.STATUS_WARNING,
        pluscwodsinstr: [
          {
            caldynamic: false,
            asfoundcalstatus: DatasheetConstants.STATUS_PASS,
          },
        ],
      };

      const handler = setup(ds, calpoints, domaincalstatusDS);
      handler.autoUpdateDataSheetStatus = jest.fn(() => false);

      // Act
      const datasheet = await handler._updateDataSheetStatus(
        null,
        ds,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(handler.autoUpdateDataSheetStatus).toHaveBeenCalled();
      expect(datasheet["asfoundcalstatus"]).toEqual(
        DatasheetConstants.STATUS_WARNING
      );
    });

    it("Should update datasheet status to empty if any asset function status is missing.", async () => {
      // Arrange
      const app = await initializeApp();

      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      ds.currentItem = {
        ...ds.currentItem,
        asfoundcalstatus: DatasheetConstants.STATUS_WARNING,
        pluscwodsinstr: [
          {
            caldynamic: false,
            asfoundcalstatus: null, // MISSING STATUS!
          },
        ],
      };

      const handler = setup(ds, calpoints, domaincalstatusDS);
      handler.autoUpdateDataSheetStatus = jest.fn(() => true);

      // Act
      const datasheet = await handler._updateDataSheetStatus(
        null,
        ds,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(handler.autoUpdateDataSheetStatus).toHaveBeenCalled();
      expect(datasheet["asfoundcalstatus"]).toBeNull();
    });

    it("Should update datasheet status to empty if any asset function status is BROKEN.", async () => {
      // Arrange
      const app = await initializeApp();

      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      ds.currentItem = {
        ...ds.currentItem,
        asfoundcalstatus: DatasheetConstants.STATUS_BROKEN,
        pluscwodsinstr: [
          {
            caldynamic: false,
            asfoundcalstatus: null, // MISSING STATUS!
          },
        ],
      };

      const handler = setup(ds, calpoints, domaincalstatusDS);
      handler.autoUpdateDataSheetStatus = jest.fn(() => true);

      // Act
      const datasheet = await handler._updateDataSheetStatus(
        null,
        ds,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(handler.autoUpdateDataSheetStatus).toHaveBeenCalled();
      expect(datasheet["asfoundcalstatus"]).toEqual("BROKEN");
    });

    describe("(Mocking internal methods)", () => {
      it("(Mocked) Should update datasheet status when auto update flag is TRUE and is NOT missing status", async () => {
        // Arrange
        const app = await initializeApp();
        const ds = await loadDatasheetDS(app, TEST_WODSNUM);
        const calpointsDS = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
        const domaincalstatusDS = await loadDomainCalStatusDS(app);

        // Heads up! For this test we are going to mock all internal methods
        // so we have full control of it. The test below will perform the same
        // test but with full integration.
        const handler = setup(ds, calpointsDS, domaincalstatusDS);
        // setup = (datasheetDS, calpointsDS, domaincalstatusDS) =>
        handler.autoUpdateDataSheetStatus = jest.fn(() => true);
        handler._checkAFStatuses = jest.fn(() => false);
        handler._getDataSheetStatus = jest.fn(
          () => DatasheetConstants.STATUS_PASS
        );

        // Act
        const initialStatus = ds.currentItem["asfoundcalstatus"];

        const datasheet = await handler._updateDataSheetStatus(
          null,
          ds,
          CalibrationPointConstants.CONDITION_ASFOUND
        );

        // Assert: calstatus should have changed
        expect(datasheet["asfoundcalstatus"]).not.toEqual(initialStatus);
        expect(datasheet["asfoundcalstatus"]).toEqual(
          DatasheetConstants.STATUS_PASS
        );
        expect(datasheet).toHaveProperty("asfoundstatusdesc_np"); // Assertion delegated to setDataSheetStatusNPFields
        expect(datasheet).toHaveProperty("asfoundstatusicon_np");
      });
      it("(Mocked) Should do nothing status when auto update flag is TRUE and is status is BROKEN", async () => {
        // Arrange
        const app = await initializeApp();
        const ds = await loadDatasheetDS(app, TEST_WODSNUM);
        const calpointsDS = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
        const domaincalstatusDS = await loadDomainCalStatusDS(app);

        // Heads up! For this test we are going to mock all internal methods
        // so we have full control of it. The test below will perform the same
        // test but with full integration.
        const handler = setup(ds, calpointsDS, domaincalstatusDS);
        // setup = (datasheetDS, calpointsDS, domaincalstatusDS) =>
        handler.autoUpdateDataSheetStatus = jest.fn(() => true);
        handler._checkAFStatuses = jest.fn(() => false);
        handler._getDataSheetStatus = jest.fn(
          () => DatasheetConstants.STATUS_BROKEN
        );

        // Act
        const datasheet = await handler._updateDataSheetStatus(
          null,
          ds,
          CalibrationPointConstants.CONDITION_ASFOUND
        );

        // Assert: calstatus should have changed
        expect(datasheet["asfoundcalstatus"]).toEqual("BROKEN");
      });

      it("(Mocked) Should do nothing when auto update flag is TRUE but is missing status", async () => {
        // Arrange
        const app = await initializeApp();
        const ds = await loadDatasheetDS(app, TEST_WODSNUM);
        const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
        const domaincalstatusDS = await loadDomainCalStatusDS(app);

        const handler = setup(ds, calpoints, domaincalstatusDS);
        handler.autoUpdateDataSheetStatus = jest.fn(() => true);
        handler._checkAFStatuses = jest.fn(() => true);

        // Act
        const datasheet = await handler._updateDataSheetStatus(
          null,
          ds,
          CalibrationPointConstants.CONDITION_ASFOUND
        );

        // Assert: calstatus should have changed
        expect(datasheet["asfoundcalstatus"]).toBeNull();
        expect(datasheet["asfoundstatusdesc_np"]).toBeNull();
        expect(datasheet["asfoundstatusicon_np"]).toBeNull();
      });

      it("(Mocked) Should do nothing when auto update flag is FALSE", async () => {
        // Arrange
        const app = await initializeApp();
        const ds = await loadDatasheetDS(app, TEST_WODSNUM);
        const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
        const domaincalstatusDS = await loadDomainCalStatusDS(app);

        const handler = setup(ds, calpoints, domaincalstatusDS);
        handler.autoUpdateDataSheetStatus = jest.fn(() => false);

        // Act
        const initialStatus = ds.currentItem["asfoundcalstatus"];
        const datasheet = await handler._updateDataSheetStatus(
          null,
          ds,
          CalibrationPointConstants.CONDITION_ASFOUND
        );

        // Assert: calstatus should have changed
        expect(datasheet["asfoundcalstatus"]).toEqual(initialStatus);
        expect(datasheet).not.toHaveProperty("asfoundstatusdesc_np"); // Assertion delegated to setDataSheetStatusNPFields
        expect(datasheet).not.toHaveProperty("asfoundstatusicon_np");
      });
    });
  });

  describe("setDataSheetStatusNPFields", () => {
    it("Should set datasheet status icon and description as NULL when status is NULL", async () => {
      // Arrange
      const handler = setup();

      const datasheet = {
        asfoundstatusdesc_np: "Warning Limit not Exceeded",
        asfoundstatusicon_np: DatasheetConstants.STATUS_PASS,
      };

      // Act
      await handler.setDataSheetStatusNPFields(
        datasheet,
        null,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(datasheet["asfoundstatusdesc_np"]).toEqual(null);
      expect(datasheet["asfoundstatusicon_np"]).toEqual(null);
    });

    it("Should set datasheet status icon and description with value when status is not NULL", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      const handler = setup(ds, calpoints, domaincalstatusDS);

      const datasheet = {
        asfoundstatusdesc_np: null,
        asfoundstatusicon_np: null,
      };
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      // Act
      await handler.setDataSheetStatusNPFields(
        datasheet,
        DatasheetConstants.STATUS_PASS,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(datasheet["asfoundstatusdesc_np"]).toEqual(
        "Warning Limit not Exceeded"
      );
      expect(datasheet["asfoundstatusicon_np"]).toEqual(
        DatasheetConstants.STATUS_PASS
      );
    });
  });

  describe("getStatusDescription", () => {
    it("Should catch exception when something wrong happens", async () => {
      // Arrange
      const handler = setup();
      handler.getDomainCalStatusDS = () => {
        throw Error("test error");
      };

      // Act
      const description = await handler.getStatusDescription(null);

      // Assert
      expect(description).toEqual(null);
    });

    it("Should return null when domaincalstatusDS is undefined", async () => {
      // Arrange
      const handler = setup();
      handler.setDomainCalStatusDS(undefined);

      // Act
      const description = await handler.getStatusDescription(
        DatasheetConstants.STATUS_PASS
      );

      // Assert
      expect(description).toEqual(null);
    });

    it("Should return null when status is undefined", () => {});

    it("Should return description when domaincalstatus is filtered by maxvalue", async () => {
      // Arrange
      const handler = setup();
      handler.getDomainCalStatusDS = jest.fn(() => ({
        items: [
          {
            _rowstamp: "356620",
            valueid: "PLUSCCALSTATUS|PASS",
            maxvalue: "PASS",
            defaults: true,
            description: "Warning Limit not Exceeded",
            value: "PASS",
            domainid: "PLUSCCALSTATUS",
          },
          {
            _rowstamp: "356615",
            valueid: "PLUSCCALSTATUS|FAIL",
            maxvalue: "FAIL",
            defaults: true,
            description: "Action Limit Exceeded",
            value: "FAIL",
            domainid: "PLUSCCALSTATUS",
          },
        ],
      }));
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      // Act
      const description = await handler.getStatusDescription(
        DatasheetConstants.STATUS_PASS
      );

      // Assert
      expect(description).toEqual("Warning Limit not Exceeded");
    });

    it("Should return null when domaincalstatusDS is not defined", async () => {
      // Arrange
      const handler = setup();
      handler.getDomainCalStatusDS = jest.fn();

      // Act
      const description = await handler.getStatusDescription(
        DatasheetConstants.STATUS_PASS
      );

      // Assert
      expect(description).toEqual(null);
    });
  });

  describe("getStatusIcon", () => {
    it("Should catch exception when something wrong occurs", () => {
      // Arrange
      const handler = setup();
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );
      handler.getDomainCalStatusDS = () => {
        throw Error("test error");
      };

      // Act
      const statusIcon = handler.getStatusIcon(null);

      // Assert
      expect(statusIcon).toEqual(null);
    });

    it("Should return null when internal status is null", () => {
      // Arrange
      const handler = setup();
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      // Act
      const statusIcon = handler.getStatusIcon(null);

      // Assert
      expect(statusIcon).toEqual(null);
    });

    it("Should return empty when internal status length is zero", () => {
      // Arrange
      const handler = setup();
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      // Act
      const statusIcon = handler.getStatusIcon("");

      // Assert
      expect(statusIcon).toEqual("");
    });

    it("Should return PASS when internal status is PASS", () => {
      // Arrange
      const handler = setup();
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      // Act
      const statusIcon = handler.getStatusIcon(DatasheetConstants.STATUS_PASS);

      // Assert
      expect(statusIcon).toEqual(DatasheetConstants.STATUS_PASS);
    });

    it("Should return FAIL when internal status is FAIL", () => {
      // Arrange
      const handler = setup();
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      // Act
      const statusIcon = handler.getStatusIcon(DatasheetConstants.STATUS_FAIL);

      // Assert
      expect(statusIcon).toEqual(DatasheetConstants.STATUS_FAIL);
    });

    it("Should return WARNING when internal status neither PASS nor FAIL", () => {
      // Arrange
      const handler = setup();
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      // Act
      const statusIcon = handler.getStatusIcon(null);

      // Assert
      expect(statusIcon).toEqual(null);
    });

    it("Should return empty when internal status length is zero", () => {
      // Arrange
      const handler = setup();
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      // Act
      const statusIcon = handler.getStatusIcon("");

      // Assert
      expect(statusIcon).toEqual("");
    });

    it("Should return PASS when internal status is PASS", () => {
      // Arrange
      const handler = setup();
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      // Act
      const statusIcon = handler.getStatusIcon(DatasheetConstants.STATUS_PASS);

      // Assert
      expect(statusIcon).toEqual(DatasheetConstants.STATUS_PASS);
    });

    it("Should return FAIL when internal status is FAIL", () => {
      // Arrange
      const handler = setup();
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      // Act
      const statusIcon = handler.getStatusIcon(DatasheetConstants.STATUS_FAIL);

      // Assert
      expect(statusIcon).toEqual(DatasheetConstants.STATUS_FAIL);
    });

    it("Should return WARNING when internal status neither PASS nor FAIL", () => {
      // Arrange
      const handler = setup();
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      // Act
      const statusIcon = handler.getStatusIcon(null);

      // Assert
      expect(statusIcon).toEqual(null);
    });

    it("Should return empty when internal status length is zero", () => {
      // Arrange
      const handler = setup();
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      // Act
      const statusIcon = handler.getStatusIcon("");

      // Assert
      expect(statusIcon).toEqual("");
    });

    it("Should return PASS when internal status is PASS", () => {
      // Arrange
      const handler = setup();
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      // Act
      const statusIcon = handler.getStatusIcon(DatasheetConstants.STATUS_PASS);

      // Assert
      expect(statusIcon).toEqual(DatasheetConstants.STATUS_PASS);
    });

    it("Should return FAIL when internal status is FAIL", () => {
      // Arrange
      const handler = setup();
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      // Act
      const statusIcon = handler.getStatusIcon(DatasheetConstants.STATUS_FAIL);

      // Assert
      expect(statusIcon).toEqual(DatasheetConstants.STATUS_FAIL);
    });

    it("Should return WARNING when internal status neither PASS nor FAIL", () => {
      // Arrange
      const handler = setup();
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      // Act
      const statusIcon = handler.getStatusIcon(
        DatasheetConstants.STATUS_BROKEN
      );

      // Assert
      expect(statusIcon).toEqual(DatasheetConstants.STATUS_WARNING);
    });
  });

  describe("_checkAFStatuses", () => {
    it("Should return false when asset function list is empty", () => {
      // Arrange
      const assetfunctions = [];
      const handler = setup();

      // Act
      const missingStatus = handler._checkAFStatuses(
        assetfunctions,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(missingStatus).toEqual(false);
    });

    it("Should return false when asset functions are all dynamic", () => {
      // Arrange
      const length = generateRandomInt(1, 10);
      const assetfunctions = Array.from({ length }, () => ({
        caldynamic: true,
        asfoundcalstatus: pickRandom(DatasheetConstants.STATUS_LIST),
      }));

      const handler = setup();

      // Act
      const missingStatus = handler._checkAFStatuses(
        assetfunctions,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(missingStatus).toEqual(false);
    });

    it("Should return false when all asset functions have status", () => {
      // Arrange
      const length = generateRandomInt(1, 10);
      const assetfunctions = Array.from({ length }, () => ({
        caldynamic: false,
        asfoundcalstatus: pickRandom(DatasheetConstants.STATUS_LIST),
      }));

      const handler = setup();

      // Act
      const missingStatus = handler._checkAFStatuses(
        assetfunctions,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(missingStatus).toEqual(false);
    });

    it("Should return true when at least one asset function is NOT dynamic and status is NULL", () => {
      // Arrange
      const length = generateRandomInt(1, 10);
      const assetfunctions = Array.from({ length }, () => ({
        caldynamic: false,
        asfoundcalstatus: pickRandom(DatasheetConstants.STATUS_LIST),
      }));

      assetfunctions.push({ caldynamic: false, asfoundcalstatus: null });

      const handler = setup();

      // Act
      const missingStatus = handler._checkAFStatuses(
        assetfunctions,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(missingStatus).toEqual(true);
    });

    it("Should return true when at least one asset function is NOT dynamic and status is empty string", () => {
      // Arrange
      const length = generateRandomInt(1, 10);
      const assetfunctions = Array.from({ length }, () => ({
        caldynamic: false,
        asfoundcalstatus: pickRandom(DatasheetConstants.STATUS_LIST),
      }));

      assetfunctions.push({ caldynamic: false, asfoundcalstatus: "" });

      const handler = setup();

      // Act
      const missingStatus = handler._checkAFStatuses(
        assetfunctions,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(missingStatus).toEqual(true);
    });
  });

  describe("_getDataSheetStatus", () => {
    it("Should return PASS when asset function list is empty", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);
      // SynonymDomain.resolveToInternal = jest.fn(
      //   (domainCalStatusDs, dsStatus) => dsStatus
      // );
      SynonymDomain.resolveToDefaultExternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      const assetfunctions = [];

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS);

      const status = await handler._getDataSheetStatus(
        assetfunctions,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(status).toEqual(DatasheetConstants.STATUS_PASS);
    });

    it("Should return NULL when at least one asset function has NULL status", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      const assetfunctions = [
        {
          asfoundcalstatus: null,
          caldynamic: false,
        },
      ];

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS);

      const status = handler._getDataSheetStatus(
        assetfunctions,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(status).toEqual(null);
    });

    it("Should return NULL when at least one asset function has undefined status", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      const assetfunctions = [
        {
          asfoundcalstatus: undefined,
          caldynamic: false,
        },
      ];

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS);

      const status = handler._getDataSheetStatus(
        assetfunctions,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(status).toEqual(null);
    });

    describe("(NOT caldynamic)", () => {
      it("Should return same status when asset function is either BROKEN or MISSING", async () => {
        // Arrange
        const app = await initializeApp();
        const ds = await loadDatasheetDS(app, TEST_WODSNUM);
        const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
        const domaincalstatusDS = await loadDomainCalStatusDS(app);
        SynonymDomain.resolveToInternal = jest.fn(
          (domainCalStatusDs, dsStatus) => dsStatus
        );
        SynonymDomain.resolveToDefaultExternal = jest.fn(
          (domainCalStatusDs, dsStatus) => dsStatus
        );

        const assetfunctions = [
          {
            asfoundcalstatus: DatasheetConstants.STATUS_PASS,
            caldynamic: false,
          },
          {
            asfoundcalstatus: DatasheetConstants.STATUS_MISSING,
            caldynamic: false,
          },
        ];

        // Act
        const handler = setup(ds, calpoints, domaincalstatusDS);

        const status = handler._getDataSheetStatus(
          assetfunctions,
          CalibrationPointConstants.CONDITION_ASFOUND
        );

        // Assert
        expect(status).toEqual(DatasheetConstants.STATUS_MISSING);
      });
    });

    describe("(calpoint)", () => {
      it("Should return FAIL when asset function status is FAIL", async () => {
        // Arrange
        const app = await initializeApp();
        const ds = await loadDatasheetDS(app, TEST_WODSNUM);
        const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
        const domaincalstatusDS = await loadDomainCalStatusDS(app);
        SynonymDomain.resolveToInternal = jest.fn(
          (domainCalStatusDs, dsStatus) => dsStatus
        );
        SynonymDomain.resolveToDefaultExternal = jest.fn(
          (domainCalStatusDs, dsStatus) => dsStatus
        );

        const assetfunctions = [
          {
            asfoundcalstatus: DatasheetConstants.STATUS_PASS,
            caldynamic: false,
            calpoint: true,
          },
          {
            asfoundcalstatus: DatasheetConstants.STATUS_FAIL,
            caldynamic: false,
            calpoint: true,
          },
        ];

        // Act
        const handler = setup(ds, calpoints, domaincalstatusDS);

        const status = handler._getDataSheetStatus(
          assetfunctions,
          CalibrationPointConstants.CONDITION_ASFOUND
        );

        // Assert
        expect(status).toEqual(DatasheetConstants.STATUS_FAIL);
      });

      it("Should return tolerance status when asset function tolerance is exceeded", async () => {
        // Arrange
        const app = await initializeApp();
        const ds = await loadDatasheetDS(app, TEST_WODSNUM);
        const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
        const domaincalstatusDS = await loadDomainCalStatusDS(app);
        SynonymDomain.resolveToInternal = jest.fn(
          (domainCalStatusDs, dsStatus) => dsStatus
        );
        SynonymDomain.resolveToDefaultExternal = jest.fn(
          (domainCalStatusDs, dsStatus) => dsStatus
        );

        const assetfunctions = [
          {
            asfoundcalstatus: DatasheetConstants.STATUS_WARNING,
            caldynamic: false,
            calpoint: true,
            pluscwodspoint: [
              { itemid: 1, asfoundinput: 2, asfoundoutput: 3, asfounderror1: 2.5 },
              { itemid: 1, asfoundinput: 2, asfoundoutput: 3 },
            ],  
            widestTol: generateRandomFloat(2, 2, 3), // tol
            widestTolwidth: 0, // width
          },
        ];

        // Act
        const handler = setup(ds, calpoints, domaincalstatusDS);

        const status = handler._getDataSheetStatus(
          assetfunctions,
          CalibrationPointConstants.CONDITION_ASFOUND
        );

        // Assert
        expect(status).toEqual(DatasheetConstants.STATUS_WARNING);
      });

      it("Should return status from HIGHEST tolerance when asset function has multiple exceptions", async () => {
        // Arrange
        const app = await initializeApp();
        const ds = await loadDatasheetDS(app, TEST_WODSNUM);
        const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
        const domaincalstatusDS = await loadDomainCalStatusDS(app);
        SynonymDomain.resolveToInternal = jest.fn(
          (domainCalStatusDs, dsStatus) => dsStatus
        );
        SynonymDomain.resolveToDefaultExternal = jest.fn(
          (domainCalStatusDs, dsStatus) => dsStatus
        );

        const assetfunctions = [
          {
            asfoundcalstatus: DatasheetConstants.STATUS_WARNING,
            caldynamic: false,
            calpoint: true,
            pluscwodspoint: [
              { itemid: 1, asfoundinput: 2, asfoundoutput: 3 },
              { itemid: 1, asfoundinput: 2, asfoundoutput: 3 },
            ],  
            widestTol: generateRandomFloat(2, 2, 3), // tol
            widestTolwidth: 0, // width
          },
          {
            asfoundcalstatus: DatasheetConstants.STATUS_WARNING + "GIBBERISH",
            caldynamic: false,
            calpoint: true,
            pluscwodspoint: [
              { itemid: 1, asfoundinput: 2, asfoundoutput: 3 },
              { itemid: 1, asfoundinput: 2, asfoundoutput: 3 },
            ],  
            widestTol: generateRandomFloat(1, 1, 3), // tol
            widestTolwidth: 0, // width
          },
          {
            asfoundcalstatus: DatasheetConstants.STATUS_PASS,
            caldynamic: false,
            calpoint: true,
            pluscwodspoint: [
              { itemid: 1, asfoundinput: 2, asfoundoutput: 3 },
              { itemid: 1, asfoundinput: 2, asfoundoutput: 3 },
            ],  
            widestTol: 0,
            widestTolwidth: 0,
          },
        ];

        // Act
        const handler = setup(ds, calpoints, domaincalstatusDS);

        const status = handler._getDataSheetStatus(
          assetfunctions,
          CalibrationPointConstants.CONDITION_ASFOUND
        );

        // Assert
        expect(status).toEqual(DatasheetConstants.STATUS_WARNING);
      });
    });

    describe("(calfunction)", () => {
      it("Should return PASS when all asset functions are PASS", async () => {
        // Arrange
        const app = await initializeApp();
        const ds = await loadDatasheetDS(app, TEST_WODSNUM);
        const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
        const domaincalstatusDS = await loadDomainCalStatusDS(app);
        SynonymDomain.resolveToInternal = jest.fn(
          (domainCalStatusDs, dsStatus) => dsStatus
        );
        SynonymDomain.resolveToDefaultExternal = jest.fn(
          (domainCalStatusDs, dsStatus) => dsStatus
        );

        const assetfunctions = [
          {
            asfoundcalstatus: DatasheetConstants.STATUS_PASS,
            caldynamic: false,
            calfunction: true,
            calpoint: false,
            widestTol: 0,
            widestTolwidth: 0,
          },
        ];

        // Act
        const handler = setup(ds, calpoints, domaincalstatusDS);

        const status = handler._getDataSheetStatus(
          assetfunctions,
          CalibrationPointConstants.CONDITION_ASFOUND
        );

        // Assert
        expect(status).toEqual(DatasheetConstants.STATUS_PASS);
      });

      it("Should return FAIL when at least one asset function is different than PASS", async () => {
        // Arrange
        const app = await initializeApp();
        const ds = await loadDatasheetDS(app, TEST_WODSNUM);
        const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
        const domaincalstatusDS = await loadDomainCalStatusDS(app);
        SynonymDomain.resolveToInternal = jest.fn(
          (domainCalStatusDs, dsStatus) => dsStatus
        );
        SynonymDomain.resolveToDefaultExternal = jest.fn(
          (domainCalStatusDs, dsStatus) => dsStatus
        );

        const assetfunctions = [
          {
            asfoundcalstatus: pickRandom([
              DatasheetConstants.STATUS_FAIL,
              DatasheetConstants.STATUS_WARNING,
            ]),
            caldynamic: false,
            calfunction: true,
            calpoint: false,
            widestTol: 0,
            widestTolwidth: 0,
          },
        ];

        // Act
        const handler = setup(ds, calpoints, domaincalstatusDS);

        const status = handler._getDataSheetStatus(
          assetfunctions,
          CalibrationPointConstants.CONDITION_ASFOUND
        );

        // Assert
        expect(status).toEqual(DatasheetConstants.STATUS_FAIL);
      });
    });
  });

  describe("_getToleranceForStatus", () => {
    it("Should return tolerance object when assetfunction is provided", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      const assetfunction = {
        asfoundcalstatus: DatasheetConstants.STATUS_PASS,
        caldynamic: false,
        calfunction: true,
        calpoint: false,
        pluscwodspoint: [
          { itemid: 1, asfoundinput: 2, asfoundoutput: 3 },
          { itemid: 1, asfoundinput: 2, asfoundoutput: 3 },
        ],
        widestTol: generateRandomFloat(0, 1, 5),
        widestTolwidth: generateRandomFloat(0, 1, 5),
      };

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS);

      const tol = handler._getToleranceForStatus(
        assetfunction,
        CalibrationPointConstants.CONDITION_ASFOUND,
        assetfunction.asfoundcalstatus
      );

      // Assert
      expect(tol.status).toEqual(assetfunction.asfoundcalstatus);
      expect(tol.tol).toEqual(assetfunction.widestTol);
      expect(tol.width).toEqual(assetfunction.widestTolwidth);
    });
  });

  describe("_setAssetFunctionErrorCount", () => {
    it("Should return 0 when calibration points list is empty", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      const assetfunction = {
        asfoundcalstatus: DatasheetConstants.STATUS_PASS,
        caldynamic: false,
        calfunction: true,
        calpoint: false,
        widestTol: generateRandomFloat(0, 1, 5),
        widestTolwidth: generateRandomFloat(0, 1, 5),
      };

      const calibrationpoints = [];

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS);

      const errorCount = handler._setAssetFunctionErrorCount(
        assetfunction,
        calibrationpoints,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(errorCount).toEqual(0);
      expect(assetfunction["asfounderror"]).toEqual(0);
    });

    it("Should return 0 when there are no errors in calibration points list", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      const assetfunction = {
        asfoundcalstatus: DatasheetConstants.STATUS_PASS,
        caldynamic: false,
        calfunction: true,
        calpoint: false,
        widestTol: generateRandomFloat(0, 1, 5),
        widestTolwidth: generateRandomFloat(0, 1, 5),
      };

      const calibrationpoints = Array.from({ length: 10 }, () => ({
        asfounderror: false,
        asfoundfail: false,
      }));

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS);

      const errorCount = handler._setAssetFunctionErrorCount(
        assetfunction,
        calibrationpoints,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(errorCount).toEqual(0);
      expect(assetfunction["asfounderror"]).toEqual(0);
    });

    it("Should return total of errors when there are errors in calibration points list", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      const assetfunction = {
        asfoundcalstatus: DatasheetConstants.STATUS_PASS,
        caldynamic: false,
        calfunction: true,
        calpoint: false,
        widestTol: generateRandomFloat(0, 1, 5),
        widestTolwidth: generateRandomFloat(0, 1, 5),
        asfounderror: 0,
      };

      // Arrange array with error
      const arr1 = Array.from({ length: 3 }, () => ({
        asfounderror: true,
        asfoundfail: false,
      }));

      // Arrange array with fail
      const arr2 = Array.from({ length: 3 }, () => ({
        asfounderror: false,
        asfoundfail: true,
      }));

      // Arrange array with no errors
      const arr3 = Array.from({ length: 3 }, () => ({
        asfounderror: false,
        asfoundfail: false,
      }));

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS);

      const errorCount = handler._setAssetFunctionErrorCount(
        assetfunction,
        [].concat(arr1).concat(arr2).concat(arr3),
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(errorCount).toEqual(6);
      expect(assetfunction["asfounderror"]).toEqual(6);
    });
  });

  describe("_showStatusMessage", () => {
    it("Should return FALSE when status is NULL", async () => {
      // Arrange
      const app = await initializeApp();

      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const toastMockFn = jest.fn();
      const getLocalizedLabelMockFn = jest.fn();
      ds.getApplication = jest.fn(() => ({
        toast: toastMockFn,
        getLocalizedLabel: getLocalizedLabelMockFn,
      }));

      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      const assetfuction = {
        asfoundcalstatus: null,
      };

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS);

      const shown = handler._showStatusMessage(
        null,
        CalibrationPointConstants.CONDITION_ASFOUND,
        assetfuction
      );

      // Assert
      expect(shown).toEqual(false);
      expect(toastMockFn).not.toHaveBeenCalled();
    });

    it("Should display toast message when status is not empty", async () => {
      // Arrange
      const app = await initializeApp();

      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const toastMockFn = jest.fn();
      const getLocalizedLabelMockFn = jest.fn();
      ds.getApplication = jest.fn(() => ({
        toast: toastMockFn,
        getLocalizedLabel: getLocalizedLabelMockFn,
      }));

      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      const assetfuction = {
        asfoundcalstatus: DatasheetConstants.STATUS_PASS,
      };

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS);

      const shown = handler._showStatusMessage(
        null,
        CalibrationPointConstants.CONDITION_ASFOUND,
        assetfuction
      );

      // Assert
      expect(shown).toEqual(true);
      expect(toastMockFn).toHaveBeenCalled();
      expect(getLocalizedLabelMockFn).toHaveBeenCalled();
    });
  });

  describe("checkMissingOrBroken", () => {
    const prefix = "asfound";
    const domainCalStatus = "PASS";
    it("Should return false wheen instr and ds are both pass", async () => {
      // Arrange
      const handler = setup();

      SynonymDomain.resolveToInternal = jest.fn(
        (calStatus, dsStatus) => dsStatus
      );
      const ds = {
        asfoundcalstatus: "PASS",
      };

      const instr = {
        asfoundcalstatus: "PASS",
      };

      const result = handler.checkMissingOrBroken(
        ds,
        instr,
        prefix,
        domainCalStatus
      );

      expect(result).toEqual(false);
    });

    it("Should return true when instr is missing and ds is pass", async () => {
      // Arrange
      const handler = setup();

      SynonymDomain.resolveToInternal = jest.fn(
        (calStatus, dsStatus) => dsStatus
      );
      const ds = {
        asfoundcalstatus: "PASS",
      };

      const instr = {
        asfoundcalstatus: "MISSING",
      };

      const result = handler.checkMissingOrBroken(
        ds,
        instr,
        prefix,
        domainCalStatus
      );

      expect(result).toEqual(true);
    });

    it("Should return true when instr is broken and ds is pass", async () => {
      // Arrange
      const handler = setup();

      SynonymDomain.resolveToInternal = jest.fn(
        (calStatus, dsStatus) => dsStatus
      );
      const ds = {
        asfoundcalstatus: "PASS",
      };

      const instr = {
        asfoundcalstatus: "BROKEN",
      };

      const result = handler.checkMissingOrBroken(
        ds,
        instr,
        prefix,
        domainCalStatus
      );

      expect(result).toEqual(true);
    });

    it("Should return true when instr is pass and ds is broken", async () => {
      // Arrange
      const handler = setup();

      SynonymDomain.resolveToInternal = jest.fn(
        (calStatus, dsStatus) => dsStatus
      );
      const ds = {
        asfoundcalstatus: "BROKEN",
      };

      const instr = {
        asfoundcalstatus: "PASS",
      };

      const result = handler.checkMissingOrBroken(
        ds,
        instr,
        prefix,
        domainCalStatus
      );

      expect(result).toEqual(true);
    });

    it("Should return true when instr is pass and ds is missing", async () => {
      // Arrange
      const handler = setup();

      SynonymDomain.resolveToInternal = jest.fn(
        (calStatus, dsStatus) => dsStatus
      );
      const ds = {
        asfoundcalstatus: "MISSING",
      };

      const instr = {
        asfoundcalstatus: "PASS",
      };

      const result = handler.checkMissingOrBroken(
        ds,
        instr,
        prefix,
        domainCalStatus
      );

      expect(result).toEqual(true);
    });

    it("Should return true when both are broken", async () => {
      // Arrange
      const handler = setup();

      SynonymDomain.resolveToInternal = jest.fn(
        (calStatus, dsStatus) => dsStatus
      );
      const ds = {
        asfoundcalstatus: "BROKEN",
      };

      const instr = {
        asfoundcalstatus: "BROKEN",
      };

      const result = handler.checkMissingOrBroken(
        ds,
        instr,
        prefix,
        domainCalStatus
      );

      expect(result).toEqual(true);
    });

    it("Should return true when both are missing", async () => {
      // Arrange
      const handler = setup();

      SynonymDomain.resolveToInternal = jest.fn(
        (calStatus, dsStatus) => dsStatus
      );
      const ds = {
        asfoundcalstatus: "MISSING",
      };

      const instr = {
        asfoundcalstatus: "MISSING",
      };

      const result = handler.checkMissingOrBroken(
        ds,
        instr,
        prefix,
        domainCalStatus
      );

      expect(result).toEqual(true);
    });
  });

  describe("performCalculationForCalPoint", () => {
    it("non-repeatable", async () => {
      const handler = setup();

      handler.getAssetFunctionDS = () => {
        return {
          currentItem: {
            repeatable: false,
          },
        };
      };

      const calpoint = {};

      handler.getDsconfigDS = () => {
        return { currentItem: {} };
      };
      const result = handler.performCalculationForCalPoint(calpoint, "asfound");

      // Assert
      expect(result).toEqual(false);
    });

    it("repeatable", async () => {
      const handler = setup();

      handler.getAssetFunctionDS = () => {
        return {
          currentItem: {
            repeatable: true,
          },
        };
      };

      const calpoint = {};

      const result = handler.performCalculationForCalPoint(calpoint, "asfound");

      // Assert
      expect(result).toEqual(null);
    });
  });

  describe("performCalculationForRepeatables", () => {
    it("Should return average point with results calculated", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      // Arrange asset function datasource
      const assetFunctionDS = createAssetFunctionDS([
        generateInst({ pluscwodsinstrid: TEST_PLUSCWODSINSTRID }),
      ]);

      await assetFunctionDS.load();

      assetFunctionDS.setSelected(0, true);

      // Arrange calibration points datasource
      // prettier-ignore
      const calpointsDS = createCalpointsDS([
        generatePoint({ asfoundinput: "1.006", point: 1, wonum: TEST_WODSNUM, dsplannum: "DS101", revisionnum: 1, instrseq: 1, isaverage: true }),
        generatePoint({ asfoundinput: "2.005", point: 1, wonum: TEST_WODSNUM, dsplannum: "DS101", revisionnum: 1, instrseq: 1 }),
        generatePoint({ asfoundinput: "3.004", point: 1, wonum: TEST_WODSNUM, dsplannum: "DS101", revisionnum: 1, instrseq: 1 }),
        generatePoint({ asfoundinput: "4.003", point: 1, wonum: TEST_WODSNUM, dsplannum: "DS101", revisionnum: 1, instrseq: 1 }),
        generatePoint({ asfoundinput: "5.002", point: 1, wonum: TEST_WODSNUM, dsplannum: "DS101", revisionnum: 1, instrseq: 1 }),
        generatePoint({ asfoundinput: "6.001", point: 1, wonum: TEST_WODSNUM, dsplannum: "DS101", revisionnum: 1, instrseq: 1 }),
      ]);

      await calpointsDS.load();

      calpointsDS.parent = assetFunctionDS;

      // Arrange datasheet configuration ds
      const dsconfigDS = { currentItem: {} };

      // Act
      const handler = setup(
        ds,
        calpointsDS,
        domaincalstatusDS,
        assetFunctionDS,
        dsconfigDS
      );

      const avgpoint = handler.performCalculationForRepeatables(
        calpointsDS.items,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(avgpoint.asfoundinput).toEqual("4.003");
      expect(avgpoint.asfinputstddev).toEqual("1.413");
    });
  });

  describe("getCalibrationAverageRecord", () => {
    it("Should return CalibrationAverageRecord containing the average calibration point and all associated points", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      // Arrange points
      // prettier-ignore
      const calpointsDS = createCalpointsDS([
        generatePoint({ point: 1, wonum: TEST_WODSNUM, dsplannum: "XX", revisionnum: "XX", instrseq: "XX", isaverage: true }),
        generatePoint({ point: 2, wonum: TEST_WODSNUM, dsplannum: "XX", revisionnum: "XX", instrseq: "XX", isaverage: true }),
        generatePoint({ point: 2, wonum: TEST_WODSNUM, dsplannum: "XX", revisionnum: "XX", instrseq: "XX", isaverage: false }),
        generatePoint({ point: 3, wonum: TEST_WODSNUM, dsplannum: "XX", revisionnum: "XX", instrseq: "XX", isaverage: true }),
        generatePoint({ point: 1, wonum: TEST_WODSNUM, dsplannum: "XX", revisionnum: "XX", instrseq: "XX", isaverage: false }),
        generatePoint({ point: 1, wonum: TEST_WODSNUM, dsplannum: "XX", revisionnum: "XX", instrseq: "XX", isaverage: false }),
        generatePoint({ point: 1, wonum: TEST_WODSNUM, dsplannum: "XX", revisionnum: "XX", instrseq: "XX", isaverage: false }),
      ]);

      await calpointsDS.load();

      // Act
      const handler = setup(ds, calpointsDS, domaincalstatusDS);

      const avgRecord = handler.getCalibrationAverageRecord(calpointsDS.items);
      const avgpoint = avgRecord.getAvgCalpoint();
      const calpoints = avgRecord.getAssociatedCalpoints();

      // Assert
      expect(avgpoint.isaverage).toEqual(true);
      expect(calpoints.length).toEqual(3);
      calpoints.forEach((point) => {
        expect(point.isaverage).toEqual(false);
      });
    });

    it.todo("Should find avg point and filter associated points by wonum");

    it.todo(
      "Should find avg point and filter associated points by revisionnum"
    );

    it.todo("Should find avg point and filter associated points by dsplannum");
  });

  describe("clearAttributes", () => {
    it.todo("Implement test cases for clearAttributes");
  });

  describe("performCalculation", () => {
    it("output", async () => {
      // Arrange
      const app = await initializeApp();

      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      // const toastMockFn = jest.fn();
      // const getLocalizedLabelMockFn = jest.fn();
      ds.getApplication = jest.fn(() => app);

      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      // const assetfuction = {
      //   asfoundcalstatus: null,
      // };

      const spy = jest.spyOn(app, "toast");

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS);

      //let calPointToSet = 1;

      await handler.performCalculation(
        {
          field: "asfoundoutput",
          item: { asfoundoutput: "23" },
        },
        "asfound"
      );

      // Assert
      expect(spy).not.toHaveBeenCalled();
    });

    it("input - analog", async () => {
      // Arrange
      const app = await initializeApp();

      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      // const toastMockFn = jest.fn();
      // const getLocalizedLabelMockFn = jest.fn();
      ds.getApplication = jest.fn(() => app);

      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      // const assetfuction = {
      //   asfoundcalstatus: null,
      // };

      const spy = jest.spyOn(app, "toast");

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS);

      handler.getCalpointsDS = () => {
        return {
          currentItem: {
            plantype: "ANALOG",
            asfoundinput: "",
            asfoundoutput: "",
            asleftoutput: "",
            asleftinput: "",
          },
        };
      };

      handler.getAssetFunctionDS = () => {
        return {
          currentItem: {
            nonlinear: "true",
          },
        };
      };

      //let calPointToSet = 1;

      await handler.performCalculation(
        {
          field: "asleftoutput",
          asleftoutput: "",
          plantype: "ANALOG",
        },
        "asleft"
      );
      await handler.performCalculation(
        {
          field: "asleftinput",
          asleftinput: "",
          plantype: "ANALOG",
        },
        "asleft"
      );

      // Assert
      expect(spy).not.toHaveBeenCalled();
    });

    it("input - analog non-null asfoundinput and asfoundoutput ", async () => {
      // Arrange
      const app = await initializeApp();

      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      // const toastMockFn = jest.fn();
      // const getLocalizedLabelMockFn = jest.fn();
      ds.getApplication = jest.fn(() => app);

      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      // const assetfuction = {
      //   asfoundcalstatus: null,
      // };

      const spy = jest.spyOn(app, "toast");

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS);

      handler.getCalpointsDS = () => {
        return {
          currentItem: {
            plantype: "ANALOG",
            asfoundinput: "2",
            asfoundoutput: "2",
          },
        };
      };

      handler.getAssetFunctionDS = () => {
        return {
          currentItem: {
            nonlinear: "true",
          },
        };
      };

      //let calPointToSet = 1;

      await handler.performCalculation(
        {
          field: "asfoundoutput",
          asfoundoutput: "23",
          plantype: "ANALOG",
        },
        "asfound"
      );

      await handler.performCalculation({
        field: "asfoundoutput",
        asfoundoutput: "23",
        plantype: "ANALOG",
      });

      // Assert
      expect(spy).not.toHaveBeenCalled();
    });

    it("input - analog non-null asfoundinput and asfoundoutput; nonlinear is false", async () => {
      // Arrange
      const app = await initializeApp();

      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      // const toastMockFn = jest.fn();
      // const getLocalizedLabelMockFn = jest.fn();
      ds.getApplication = jest.fn(() => app);

      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      // const assetfuction = {
      //   asfoundcalstatus: null,
      // };

      const spy = jest.spyOn(app, "toast");

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS);

      handler.getCalpointsDS = () => {
        return {
          currentItem: {
            plantype: "ANALOG",
            asfoundinput: "2",
            asfoundoutput: "2",
          },
        };
      };

      handler.getAssetFunctionDS = () => {
        return {
          currentItem: {
            nonlinear: false,
          },
        };
      };

      handler.getDsconfigDS = () => {
        return { currentItem: {} };
      };

      //let calPointToSet = 1;

      await handler.performCalculation(
        {
          field: "asfoundoutput",
          asfoundoutput: "23",
          asfoundinput: "1",
          plantype: "ANALOG",
        },
        "asfound"
      );
      await handler.performCalculation(
        {
          field: "asfoundoutput",
          asfoundoutput: "23",
          plantype: "ANALOG",
        },
        "asfound"
      );

      // Assert
      expect(spy).not.toHaveBeenCalled();
    });

    it("input - analog non-null asfoundinput and asfoundoutput; nonlinear is true", async () => {
      // Arrange
      const app = await initializeApp();

      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      // const toastMockFn = jest.fn();
      // const getLocalizedLabelMockFn = jest.fn();
      ds.getApplication = jest.fn(() => app);

      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      // const assetfuction = {
      //   asfoundcalstatus: null,
      // };

      const spy = jest.spyOn(app, "toast");

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS);

      handler.syncDisplaynActualResource = jest.fn();

      handler.getCalpointsDS = () => {
        return {
          currentItem: {
            plantype: "ANALOG",
            asfoundinput: "2",
            asfoundoutput: "2",
          },
        };
      };

      handler.getAssetFunctionDS = () => {
        return {
          currentItem: {
            nonlinear: true,
          },
        };
      };

      handler.getDsconfigDS = () => {
        return { currentItem: {} };
      };

      //let calPointToSet = 1;

      await handler.performCalculation(
        {
          field: "asfoundoutput",
          asfoundoutput: "23",
          asfoundinput: "1",
          plantype: "ANALOG",
        },
        "asfound"
      );
      await handler.performCalculation(
        {
          field: "asfoundoutput",
          asfoundoutput: "23",
          plantype: "ANALOG",
        },
        "asfound"
      );

      // Assert
      expect(spy).not.toHaveBeenCalled();
    });

    it("input - discrete", async () => {
      // Arrange
      const app = await initializeApp();

      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      // const toastMockFn = jest.fn();
      // const getLocalizedLabelMockFn = jest.fn();
      ds.getApplication = jest.fn(() => app);

      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      // const assetfuction = {
      //   asfoundcalstatus: null,
      // };

      const spy = jest.spyOn(app, "toast");

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS);

      handler.getCalpointsDS = () => {
        return {
          currentItem: {
            plantype: "DISCRETE",
            asleftsetpoint: "",
          },
        };
      };

      handler.getAssetFunctionDS = () => {
        return {
          currentItem: {
            nonlinear: "true",
          },
        };
      };

      await handler.performCalculation(
        {
          field: "asfoundsetpoint",
          asfoundsetpoint: "",
          plantype: "DISCRETE",
        },
        "asfound"
      );

      // Assert
      expect(spy).not.toHaveBeenCalled();
    });

    it("input - discrete non-null asfoundsetpoint", async () => {
      // Arrange
      const app = await initializeApp();

      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      // const toastMockFn = jest.fn();
      // const getLocalizedLabelMockFn = jest.fn();
      ds.getApplication = jest.fn(() => app);

      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      // const assetfuction = {
      //   asfoundcalstatus: null,
      // };

      const spy = jest.spyOn(app, "toast");

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS);

      handler.getCalpointsDS = () => {
        return {
          currentItem: {
            plantype: "DISCRETE",
            asleftsetpoint: "2",
            asfoundsetpoint: "",
          },
        };
      };

      handler.getAssetFunctionDS = () => {
        return {
          currentItem: {
            nonlinear: "true",
          },
        };
      };
      
      handler.getDsconfigDS = () => {
        return { currentItem: {} };
      };
      //let calPointToSet = 1;

      await handler.performCalculation(
        {
          field: "asfoundsetpoint",
          asfoundsetpoint: "23",
          plantype: "DISCRETE",
        },
        "asfound"
      );

      await handler.performCalculation(
        {
          field: "asfoundsetpoint",
          asfoundsetpoint: "",
          plantype: "DISCRETE",
        },
        "asfound"
      );

      // Assert
      expect(spy).not.toHaveBeenCalled();
    });

    it("input - invalid value", async () => {
      // Arrange
      const app = await initializeApp();

      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      // const toastMockFn = jest.fn();
      // const getLocalizedLabelMockFn = jest.fn();
      ds.getApplication = jest.fn(() => app);

      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      // const assetfuction = {
      //   asfoundcalstatus: null,
      // };

      //const spy = jest.spyOn(app, "toast");

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS);

      handler.getCalpointsDS = () => {
        return {
          currentItem: {
            plantype: "ANALOG",
          },
        };
      };

      handler.getAssetFunctionDS = () => {
        return {
          currentItem: {
            nonlinear: "true",
          },
        };
      };

      //let calPointToSet = 1;

      await handler.performCalculation(
        {
          field: "asfoundoutput",
          item: { asfoundoutput: "23" },
        },
        "asfound"
      );

      // Assert
      //expect(spy).toHaveBeenCalled();
    });

    it("input - point with invalidValueFound", async () => {
      // Arrange
      const app = await initializeApp();

      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      // const toastMockFn = jest.fn();
      // const getLocalizedLabelMockFn = jest.fn();
      ds.getApplication = jest.fn(() => app);

      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const domaincalstatusDS = await loadDomainCalStatusDS(app);

      // const assetfuction = {
      //   asfoundcalstatus: null,
      // };

      const spy = jest.spyOn(app, "toast");

      // Act
      const handler = setup(ds, calpoints, domaincalstatusDS);

      handler.getCalpointsDS = () => {
        return {
          currentItem: {
            plantype: "DISCRETE",
            asleftsetpoint: "2",
            invalidValueFound: "true",
          },
        };
      };

      handler.getAssetFunctionDS = () => {
        return {
          currentItem: {
            nonlinear: "true",
          },
        };
      };

      //let calPointToSet = 1;

      await handler.performCalculation(
        {
          field: "asfoundoutput",
          item: { asfoundoutput: "23" },
        },
        "asfound"
      );

      // Assert
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("_getAssetFunctionStatusByStandardDeviation", () => {
    it("Should return fail status based on standard deviation error", () => {
      // Arrange
      const handler = setup();
      const assetfunctionMock = {
        isstandarddeviation: true,
        calpoint: true,
        tol1status: DatasheetConstants.STATUS_FAIL,
        tol2status: DatasheetConstants.STATUS_FAIL,
        tol3status: DatasheetConstants.STATUS_FAIL,
        tol4status: DatasheetConstants.STATUS_PASS,
        tol3uppervalue: 2,
        tol3lowervalue: 0,
      };
      const calpointsMock = {
        items: [
          {
            asfounderror1: "1.035",
            asfounderror2: "1.035",
            asfounderror3: "1.036",
            asfounderror4: undefined,
            asfounderror: true,
            asfoundinputstddeverror: "-0.5",
            isaverage: true
          },
        ],
      };

      // Act
      const actualStatus = handler._getAssetFunctionStatusByStandardDeviation(
        assetfunctionMock,
        calpointsMock.items,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(actualStatus).toEqual(DatasheetConstants.STATUS_FAIL);
    });
    it("Should return empty status as asset function has not included standard deviation", () => {
      // Arrange
      const handler = setup();
      const assetfunctionMock = {
        isstandarddeviation: false,
        calpoint: true,
        tol1status: DatasheetConstants.STATUS_FAIL,
        tol2status: DatasheetConstants.STATUS_FAIL,
        tol3status: DatasheetConstants.STATUS_FAIL,
        tol4status: DatasheetConstants.STATUS_PASS,
        tol3uppervalue: 2,
        tol3lowervalue: 0,
      };
      const calpointsMock = {
        items: [
          {
            asfounderror1: "1.035",
            asfounderror2: "1.035",
            asfounderror3: "1.036",
            asfounderror4: undefined,
            asfounderror: true
          },
        ],
      };

      // Act
      const actualStatus = handler._getAssetFunctionStatusByStandardDeviation(
        assetfunctionMock,
        calpointsMock.items,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(actualStatus).toEqual(DatasheetConstants.STATUS_FAIL);
    });
    it("Should return empty status as asset function not calibration points", () => {
      // Arrange
      const handler = setup();
      const assetfunctionMock = {
        calpoint: false,
        tol1status: DatasheetConstants.STATUS_FAIL,
        tol2status: DatasheetConstants.STATUS_FAIL,
        tol3status: DatasheetConstants.STATUS_FAIL,
        tol4status: DatasheetConstants.STATUS_PASS,
        tol3uppervalue: 2,
        tol3lowervalue: 0,
      };
      const calpointsMock = {
        items: [
          {
            asfounderror1: "1.035",
            asfounderror2: "1.035",
            asfounderror3: "1.036",
            asfounderror4: undefined,
            asfounderror: true
          },
        ],
      };

      // Act
      const actualStatus = handler._getAssetFunctionStatusByStandardDeviation(
        assetfunctionMock,
        calpointsMock.items,
        CalibrationPointConstants.CONDITION_ASFOUND
      );

      // Assert
      expect(actualStatus).toEqual(DatasheetConstants.STATUS_EMPTY);
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                                Utils                                       */
  /* -------------------------------------------------------------------------- */

  const loadDatasheetDS = async (app, wodsnum) => {
    const datasheetDS = app.findDatasource("pluscWoDs");

    await datasheetDS.load({
      qbe: {
        wodsnum,
      },
    });

    return datasheetDS;
  };

  const loadDomainCalStatusDS = async (app) => {
    const domaincalstatusDS = app.findDatasource("domaincalstatusds");
    await domaincalstatusDS.load();
    return domaincalstatusDS;
  };

  const loadCalpointsDS = async (datasheetDS, pluscwodsinstrid) => {
    const assetFunctionDS = await datasheetDS.getChildDatasource(
      "pluscwodsinstr",
      datasheetDS.currentItem
    );

    await assetFunctionDS.load();

    const item = assetFunctionDS.items.find(
      (item) => item.pluscwodsinstrid === pluscwodsinstrid
    );

    const calpointsDS = await assetFunctionDS.getChildDatasource(
      "pluscwodspoint",
      item
    );

    await calpointsDS.load();

    return calpointsDS;
  };

  const createCalpointsDS = (items) =>
    new Datasource(
      new JSONDataAdapter({
        src: {
          items,
          loadingDelay: 0,
          searchDelay: 0,
        },
      }),
      {
        autoSave: false,
        name: `calpointsDS`,
        pageSize: items.length,
        selectionMode: "none",
        selectionRequired: false,
      }
    );

  const createAssetFunctionDS = (items) =>
    new Datasource(
      new JSONDataAdapter({
        src: {
          items,
          loadingDelay: 0,
          searchDelay: 0,
        },
      }),
      {
        autoSave: false,
        name: `assetFunctionDS`,
        pageSize: items.length,
        selectionMode: "single",
        selectionRequired: false,
      }
    );

  const generatePoint = (overridingProps) => {
    const defaultProps = {
      pluscwodspointid: generateRandomInt(1, Number.MAX_SAFE_INTEGER),
      asfoundoutput: null,
      asfoundsetpoint: null,
      asleftinput: null,
      asleftoutput: null,
      dsplannum: "",
      inputvalue: null,
      instrseq: "",
      isaverage: false,
      outputvalue: null,
      plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      point: null, // Number
      revisionnum: "",
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

    return { ...defaultProps, ...overridingProps };
  };
});
