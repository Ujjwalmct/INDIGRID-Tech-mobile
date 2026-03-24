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

/** Graphite */
import { Datasource, JSONDataAdapter } from "@maximo/maximo-js-api";

/** Constants */
import CalibrationPointConstants from "./rules/constants/CalibrationPointConstants";
import DatasheetConstants from "./rules/constants/DatasheetConstants";
import PageConstants from "./rules/constants/PageConstants";

/** Utils */
import defaults from "./rules/utils/defaults";
import generateRandomInt from "./rules/utils/generateRandomInt";
import FieldError from "./rules/helpers/validation/FieldError";
import Message from "../utils/Message";
import toDisplayableValue from "./rules/utils/numberFormatter/toDisplayableValue";

/** Helpers */
import DatasheetCalculation from "./rules/helpers/DatasheetCalculation";

/** Handlers */
import CalibrationPointHandler from "./rules/handlers/CalibrationPointHandler";

/** Controller */
import CalibrationPointsRepeatableController from "./CalibrationPointsRepeatableController";

/** Mocks */
import newTestStub from "../test/AppTestStub";
import testCalibrationData from "./test/test-calibration-data";
import testCalibrationUnit from "./test/test-calibration-unit";
import testDomaincalstatusData from "./test/test-domaincalstatus-data";
import testWoDetails from "./test/test-wodetails-data";
import testDsconfigData from "./test/test-dsconfig-data";
import testUserinfoData from "./test/test-userinfo-data";
import testMxapiorganizationData from "./test/test-mxapiorganization-data";

import SynonymDomain from './rules/models/SynonymDomain.js';

const baseSetup = async () => {
  const app = await newTestStub({
    currentPage: "calpointrepeatable",
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
      },
      domaincalstatusds: {
        data: testDomaincalstatusData,
      },
      dsconfig: {
        data: testDsconfigData,
      },
      defaultSetDs: {
        data: testMxapiorganizationData,
      },
    },
  })();

  app.getUserInfo = jest.fn(() => testUserinfoData);

  return app;
};

describe("CalibrationPointsRepeatableController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore the spy created with spyOn
    jest.restoreAllMocks();
  });

  describe("pageInitialized", () => {
    it("Should instantiate app and page when page is initialized", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      app._id = generateRandomInt(1001, 2000);
      page._id = generateRandomInt(0, 1000);

      // Act
      controller.pageInitialized(page, app);

      // Assert
      expect(controller.page._id).toEqual(page._id);
      expect(controller.app._id).toEqual(app._id);
      expect(page._id).not.toEqual(app._id);
    });
  });

  describe("pageResumed", () => {
    it("Should set page state variables when page is resumed", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");

      app.state.screen.size = PageConstants.SCREEN_SIZE.SMALL;
      page.params.condition = CalibrationPointConstants.CONDITION_ASFOUND;

      // Act
      await ds.loadAndWaitForChildren();
      controller.pageResumed(page, app);

      // Assert
      expect(page.state.asserterror).toEqual(false);
      expect(page.state.condition).toEqual(
        CalibrationPointConstants.CONDITION_ASFOUND
      );
      expect(page.state.title).toEqual("As found values");
    });

    it("Should instatiate helpers when page is resumed", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");

      // Act
      await ds.loadAndWaitForChildren();
      await controller.pageResumed(page, app);

      // Assert
      expect(controller.datasheetCalculation).toBeInstanceOf(
        DatasheetCalculation
      );
    });

    it("Should group calibration points when page is resumed", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      // Act
      await controller.pageResumed(page, app);

      // Assert
      expect(page.state.groupedCalpointsDS).not.toBeUndefined();
    });
  });

  describe("setLabelColor", () => {
    it("shouldReturnRedWhenStatusIsFail", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );
        SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      // Act
      const color = controller.setLabelColor(DatasheetConstants.STATUS_FAIL);

      // Assert
      expect(color).toEqual("red");
    });

    it("shouldReturnGreenWhenStatusIsPASS", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );
       SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      // Act
      const color = controller.setLabelColor(DatasheetConstants.STATUS_PASS);

      // Assert
      expect(color).toEqual("green");
    });

    it("shouldReturnGreyWhenStatusIsNeitherPASSnorFAIL", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );
       SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      // Act
      const color = controller.setLabelColor(DatasheetConstants.STATUS_BROKEN);

      // Assert
      expect(color).toEqual("grey");
    });
  });

  describe("calculatePadding", () => {
    it("Should return small padding when screen size is small", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      app.state.screen.size = PageConstants.SCREEN_SIZE.SMALL;

      // Act
      const padding = controller.calculatePadding(app);

      // Assert
      expect(padding).toEqual(PageConstants.PADDING.SMALL);
    });

    it("Should return small padding when screen size is medium", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      app.state.screen.size = PageConstants.SCREEN_SIZE.MEDIUM;

      // Act
      const padding = controller.calculatePadding(app);

      // Assert
      expect(padding).toEqual(PageConstants.PADDING.SMALL);
    });

    it("Should return medium padding when screen size is different than small and medium", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      app.state.screen.size = PageConstants.SCREEN_SIZE.LARGE;

      // Act
      const padding = controller.calculatePadding(app);

      // Assert
      expect(padding).toEqual(PageConstants.PADDING.MEDIUM);
    });
  });

  describe("getPageTitle", () => {
    it("Should return 'As found values' when condition is AS FOUND", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      page.params.condition = CalibrationPointConstants.CONDITION_ASFOUND;

      // Act
      const title = controller.getPageTitle(page);

      // Assert
      expect(title).toEqual("As found values");
    });

    it("Should return 'As left values' when condition is AS LEFT", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      page.params.condition = CalibrationPointConstants.CONDITION_ASLEFT;

      // Act
      const title = controller.getPageTitle(page);

      // Assert
      expect(title).toEqual("As left values");
    });

    it("Should return empty '' when condition is neither LEFT or FOUND", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      page.params.condition = "gibberish";

      // Act
      const title = controller.getPageTitle(page);

      // Assert
      expect(title).toEqual("");
    });
  });

  describe("getTitleColumnWidth", () => {
    it("Should return MEDIUM COLUMN WIDTH when screen size is LARGE", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      app.state.screen.size = PageConstants.SCREEN_SIZE.LARGE;

      // Act
      const width = controller.getTitleColumnWidth(app);

      // Assert
      expect(width).toEqual(PageConstants.COLUMN_WIDTH.MEDIUM);
    });

    it("Should return LARGE COLUMN WIDTH when screen size is different than LARGE", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      app.state.screen.size = PageConstants.SCREEN_SIZE.MEDIUM;

      // Act
      const width = controller.getTitleColumnWidth(app);

      // Assert
      expect(width).toEqual(PageConstants.COLUMN_WIDTH.LARGE);
    });
  });

  describe("getCondition", () => {
    it("Should return condition parameter", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      page.state.condition = CalibrationPointConstants.CONDITION_ASFOUND;

      // Act
      controller.pageInitialized(page, app);

      const condition = controller.getCondition(page);

      // Assert
      expect(condition).toEqual(CalibrationPointConstants.CONDITION_ASFOUND);
    });
  });

  describe("isDirty", () => {
    it("Should return dirty state", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
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
      const page = app.findPage("calpointrepeatable");
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

  describe("isSaving", () => {
    it("shouldReturnSavingBoolean", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );

      // Act
      controller.setSaving(false);
      const before = controller.isSaving();

      controller.setSaving(true);
      const after = controller.isSaving();

      // Assert
      expect(before).toEqual(false);
      expect(after).toEqual(true);
    });
  });

  describe("setSaving", () => {
    it("shouldChangeSavingBoolean", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );

      // Act
      controller.setSaving(false);
      const before = controller.isSaving();

      controller.setSaving(true);
      const after = controller.isSaving();

      // Assert
      expect(before).toEqual(false);
      expect(after).toEqual(true);
    });
  });

  describe("createGroupedCalpointsDS", () => {
    it("Should return grouped calibration points when calibration point is passed", async () => {
      // Arrange
      const app = createAppMock();

      const dsconfig = app.findDatasource("dsconfig");

      const page = {
        state: {
          condition: CalibrationPointConstants.CONDITION_ASFOUND,
          assetfunction: createAssetfunction({
            pluscwodsinstrid: 1012,
            calpoint: true,
            plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
          }),
        },
      };

      const calpointsDSMock = {
        load: jest.fn(),
        items: [
          createCalpoint({ href: "1", pluscwodspointid: 1, point: "1" }),
          createCalpoint({ href: "2", pluscwodspointid: 2, point: "2" }),
          createCalpoint({ href: "3", pluscwodspointid: 10, point: "1" }),
          createCalpoint({ href: "4", pluscwodspointid: 20, point: "2" }),
          createCalpoint({ href: "5", pluscwodspointid: 100, point: "1" }),
          createCalpoint({ href: "6", pluscwodspointid: 200, point: "2" }),
        ],
      };

      const controller = new CalibrationPointsRepeatableController();
      controller.datasheetCalculation = new DatasheetCalculation(
        dsconfig.currentItem
      );
      controller.pageInitialized(page, app);
      controller.getCondition = jest.fn(
        () => CalibrationPointConstants.CONDITION_ASFOUND
      );
      controller.calculateInitialStatus = jest.fn();

      // Act
      const ds = await controller.createGroupedCalpointsDS(calpointsDSMock);

      // Assert
      expect(controller.calculateInitialStatus).toHaveBeenCalled();
      expect(ds.items.length).toEqual(2);

      ds.items.forEach(async (group, index) => {
        expect(group.calpointsDS).toBeInstanceOf(Datasource);
        expect(group.groupedBy).toEqual(String(index + 1));
        expect(group.calpointsDS.state.pageSize).toEqual(3);
      });
    });

    it("Should return null when calibration points is undefined", async () => {
      // Arrange
      const controller = new CalibrationPointsRepeatableController();

      // Act
      const ds = await controller.createGroupedCalpointsDS();

      // Assert
      expect(ds).toEqual(null);
    });
  });

  describe("calculateInitialStatus", () => {
    it("Should initialize status of asset function and each of its calibration points", async () => {
      // Arrange
      const app = createAppMock();

      const dsconfig = app.findDatasource("dsconfig");

      const domaincalstatusDS = app.findDatasource("domaincalstatusds");

      const assetfunction = createAssetfunction();

      const calpointsDSMock = createCalpointDS({
        items: [
          createCalpoint({ href: "1", pluscwodspointid: 1011 }),
          createCalpoint({ href: "2", pluscwodspointid: 1012 }),
          createCalpoint({ href: "3", pluscwodspointid: 1013 }),
          createCalpoint({ href: "4", pluscwodspointid: 1014 }),
          createCalpoint({ href: "5", pluscwodspointid: 1015 }),
          createCalpoint({ href: "6", pluscwodspointid: 1016 }),
          createCalpoint({ href: "7", pluscwodspointid: 1017 }),
          createCalpoint({ href: "8", pluscwodspointid: 1018 }),
        ],
      });

      const controller = new CalibrationPointsRepeatableController();
      controller.datasheetCalculation = new DatasheetCalculation(
        dsconfig.currentItem
      );
      controller.datasheetCalculation.calculateInitialStatus = jest.fn();

      // Act
      controller.calculateInitialStatus(
        CalibrationPointConstants.CONDITION_ASFOUND,
        assetfunction,
        calpointsDSMock,
        domaincalstatusDS,
        dsconfig
      );

      // Assert
      expect(
        controller.datasheetCalculation.calculateInitialStatus
      ).toHaveBeenCalledTimes(8);
    });
  });

  describe("groupBy", () => {
    it("Should return empty hashSet when items is not an array", () => {
      // Arrange
      const groupedBy = "point";
      const controller = new CalibrationPointsRepeatableController();

      // Act
      const hashSet = controller.groupBy(null, groupedBy);

      // Assert
      expect(hashSet).toEqual({});
    });

    it("Should return empty hashSet when items is empty array", () => {
      // Arrange
      const items = [];
      const groupedBy = "point";
      const controller = new CalibrationPointsRepeatableController();

      // Act
      const hashSet = controller.groupBy(items, groupedBy);

      // Assert
      expect(hashSet).toEqual({});
    });

    it("Should return hashSet when items is grouped by 'point'", () => {
      // Arrange
      const items = [
        createCalpoint({ pluscwodspointid: 1011, point: "1" }),
        createCalpoint({ pluscwodspointid: 1012, point: "2" }),
        createCalpoint({ pluscwodspointid: 1013, point: "3" }),
        createCalpoint({ pluscwodspointid: 1014, point: "1" }),
        createCalpoint({ pluscwodspointid: 1015, point: "2" }),
        createCalpoint({ pluscwodspointid: 1016, point: "1" }),
      ];

      const groupedBy = "point";

      const controller = new CalibrationPointsRepeatableController();

      // Act
      const hashSet = controller.groupBy(items, groupedBy);

      // Assert
      expect(hashSet["1"].length).toEqual(3);
      expect(hashSet["2"].length).toEqual(2);
      expect(hashSet["3"].length).toEqual(1);
    });
  });

  describe("initializeGroupedCalpointsDS", () => {
    it("Should return datasource with calibration points grouped by attribute 'point'", () => {
      // Arrange
      const hashSet = {
        1: [
          createCalpoint({ pluscwodspointid: 1011, point: "1" }),
          createCalpoint({ pluscwodspointid: 1014, point: "1" }),
          createCalpoint({ pluscwodspointid: 1016, point: "1" }),
        ],
        2: [
          createCalpoint({ pluscwodspointid: 1012, point: "2" }),
          createCalpoint({ pluscwodspointid: 1015, point: "2" }),
        ],
        3: [
          createCalpoint({
            pluscwodspointid: 1013,
            point: "3",
            pointdescription: "calpoint3",
          }),
        ],
      };

      const controller = new CalibrationPointsRepeatableController();

      // Act
      const groupedCalpointsDS =
        controller.initializeGroupedCalpointsDS(hashSet);

      // Assert
      expect(groupedCalpointsDS.name).toEqual("groupedCalpointsDS");
      expect(groupedCalpointsDS.controllers[0]).toBeInstanceOf(
        CalibrationPointsRepeatableController
      );

      groupedCalpointsDS.items.forEach((group, index) => {
        expect(group.groupedBy).toEqual(index + 1);
        expect(group.pointdescription).toEqual(
          hashSet[index][0].pluscwodspointid +
            ` ${hashSet[index][0].pointdescription || ""}`
        );
        expect(group.calpointsDS).toEqual(null);
        expect(group.id).toEqual(index + 1);
      });
    });
  });

  describe("findPointDescription", () => {
    it("shouldReturnPointDescriptionOfFirstItemInHashset", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );

      const calpointsHashSet = {
        1: [
          createCalpoint({
            point: "112",
            pointdescription: "Calibration point",
          }),
          createCalpoint({
            point: "113",
            pointdescription: "Something something",
          }),
        ],
      };

      const key = "1";

      // Act
      const description = controller.findPointDescription(
        calpointsHashSet,
        key
      );

      // Assert
      expect(description).toEqual("112 Calibration point");
    });

    it("shouldReturnOnlyIdWhenDescriptionIsEmpty", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );

      const calpointsHashSet = {
        1: [
          createCalpoint({ point: "112", pointdescription: "" }),
          createCalpoint({
            point: "113",
            pointdescription: "Something something",
          }),
        ],
      };

      const key = "1";

      // Act
      const description = controller.findPointDescription(
        calpointsHashSet,
        key
      );

      // Assert
      expect(description).toEqual("112 ");
    });

    it("shouldReturnEmptyStringWhenHashsetIsNull", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );

      const calpointsHashSet = {
        1: null,
      };

      const key = "1";

      // Act
      const description = controller.findPointDescription(
        calpointsHashSet,
        key
      );

      // Assert
      expect(description).toEqual("");
    });
  });

  describe("findAvgPoint", () => {
    it("shouldReturnAvgPointInHashset", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );

      const calpointsHashSet = {
        1: [
          createCalpoint({ pluscwodspointid: "111", isaverage: false }),
          createCalpoint({ pluscwodspointid: "112", isaverage: true }),
          createCalpoint({ pluscwodspointid: "113", isaverage: false }),
        ],
      };

      const key = "1";

      // Act
      const avgpoint = controller.findAvgPoint(calpointsHashSet, key);

      // Assert
      expect(avgpoint.pluscwodspointid).toEqual("112");
    });

    it("shouldReturnUndefinedWhenAvgPointDoesNotExist", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );

      const calpointsHashSet = {
        1: [
          createCalpoint({ pluscwodspointid: "111", isaverage: false }),
          createCalpoint({ pluscwodspointid: "112", isaverage: false }),
          createCalpoint({ pluscwodspointid: "113", isaverage: false }),
        ],
      };

      const key = "1";

      // Act
      const avgpoint = controller.findAvgPoint(calpointsHashSet, key);

      // Assert
      expect(avgpoint).toEqual(undefined);
    });
  });

  describe("changeCalpoint", () => {
    it("shouldNotPerformCalculationWhenFormErrorExist", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");

      /**
       * Pick only the first error from the list to display in screen.
       * @var controller
       * @type {CalibrationPointsRepeatableController}
       */
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );

      // Arrange base datasources
      await controller.getDefaultSetDS().load();

      // Arrange target objects
      const assetfunction = createAssetfunction({
        pluscwodsinstrid: "11",
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      });
      const calpoint = createCalpoint({
        pluscwodspointid: "112",
        asfoundinput: "100.60",
        asfoundoutput: "3500.100",
        isaverage: false,
        _group_index: 0,
      });

      // Arrange state variables
      page.state.assetfunction = assetfunction;
      page.state.condition = CalibrationPointConstants.CONDITION_ASFOUND;
      page.state.dsconfig = createDsConfig({ pluscdsconfigid: "601" });
      page.state.groupedCalpointsDS = {
        items: [
          {
            calpointsDS: {
              items: [
                calpoint,
                createCalpoint({
                  pluscwodspointid: "113",
                  asfoundinput: "XXXXXX",
                  asfoundoutput: "3500.100",
                  isaverage: false,
                }),
                createCalpoint({
                  pluscwodspointid: "114",
                  asfoundinput: "100.06",
                  asfoundoutput: "3500.102",
                  isaverage: false,
                }),
                createCalpoint({
                  pluscwodspointid: "115",
                  asfoundinput: "100.66",
                  asfoundoutput: "3500.103",
                  isaverage: true,
                }),
              ],
            },
          },
        ],
      };
      controller.app.state.assetFunctionsDetailsDS = {
        currentItem: assetfunction,
      };

      // Arrange context
      const context = {
        item: calpoint,
      };

      // Act
      const updatedCalpoint = await controller.changeCalpoint(context);

      const formValid = controller.isFormValid();

      // Assert
      expect(formValid).toEqual(false);
      expect(updatedCalpoint).toEqual(undefined);
    });

    it("shouldPerformCalculationsWhenFormIsValid", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");

      /**
       * Pick only the first error from the list to display in screen.
       * @var controller
       * @type {CalibrationPointsRepeatableController}
       */
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );

      // Arrange base datasources
      await controller.getDefaultSetDS().load();

      // Arrange target objects
      const assetfunction = createAssetfunction({
        pluscwodsinstrid: "11",
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      });
      const calpoint = createCalpoint({
        pluscwodspointid: "112",
        asfoundinput: "100.123",
        asfoundoutput: "3500.100",
        isaverage: false,
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        _group_index: 0,
      });

      // Arrange state variables
      page.state.assetfunction = assetfunction;
      page.state.condition = CalibrationPointConstants.CONDITION_ASFOUND;
      page.state.dsconfig = {
        currentItem: createDsConfig({
          pluscdsconfigid: "601",
          stddev: DatasheetConstants.DEVIATION_N,
        }),
      };
      page.state.groupedCalpointsDS = {
        items: [
          {
            avgpoint: {},
            calpointsDS: {
              items: [
                calpoint,
                createCalpoint({
                  pluscwodspointid: "113",
                  asfoundinput: "100.231",
                  asfoundoutput: "3500.100",
                  plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
                  isaverage: false,
                }),
                createCalpoint({
                  pluscwodspointid: "114",
                  asfoundinput: "100.312",
                  asfoundoutput: "3500.102",
                  plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
                  isaverage: false,
                }),
                createCalpoint({
                  pluscwodspointid: "115",
                  asfoundinput: "100.123",
                  asfoundoutput: "3500.103",
                  plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
                  isaverage: true,
                }),
              ],
            },
          },
        ],
      };
      controller.app.state.assetFunctionsDetailsDS = {
        currentItem: assetfunction,
      };

      // Arrange context
      const context = {
        item: calpoint,
      };

      // AVG: 100.222

      // Act
      await controller.changeCalpoint(context);

      const formValid = controller.isFormValid();
      const avgpoint = page.state.groupedCalpointsDS.items[0].avgpoint;

      // Assert
      expect(formValid).toEqual(true);
      expect(avgpoint.asfoundinput).toEqual("100.222");
      expect(avgpoint.asfoundoutput).toEqual("3500.101");
    });
  });

  describe("saveChanges", () => {
    it("shouldCallSaveAndNavigateBack", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");

      /**
       * Pick only the first error from the list to display in screen.
       * @var controller
       * @type {CalibrationPointsRepeatableController}
       */
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );
      const origSave = controller.save;
      controller.save = jest.fn();
      controller.app.navigateBack = jest.fn();

      // Act
      await controller.saveChanges();

      // Assert
      expect(controller.save).toHaveBeenCalled();
      expect(controller.app.navigateBack).toHaveBeenCalled();

      controller.save = origSave;
    });
  });

  describe("goBack", () => {
    it("Should show dialog asking to discard changes when data is dirty", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      controller.app.navigateBack = jest.fn();
      controller.page.showDialog = jest.fn();

      controller.setDirty(true);

      // Act
      controller.goBack();

      // Assert
      expect(controller.app.navigateBack).not.toHaveBeenCalled();
      expect(controller.page.showDialog).toHaveBeenCalled();
    });

    it("Should navigate back when data is NOT dirty", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      controller.app.navigateBack = jest.fn();
      controller.page.showDialog = jest.fn();

      // Act
      controller.goBack();

      // Assert
      expect(controller.app.navigateBack).toHaveBeenCalled();
      expect(controller.page.showDialog).not.toHaveBeenCalled();
    });
  });

  describe("discardChanges", () => {
    it("Should go to asset functions page when user discard changes", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      controller.app.setCurrentPage = jest.fn();
      controller.getDatasheetDS = jest.fn(() => ({
        currentItem: {
          wodsnum: 1,
        },
        undoAll: jest.fn()
      }));

      // Act
      controller.discardChanges();

      // Assert
      expect(controller.app.setCurrentPage).toHaveBeenCalled();
      expect(controller.app.setCurrentPage.mock.calls[0][0].name).toEqual(
        "assetfunctions"
      );
    });
  });

  describe("toggleAssert", () => {
    it("Should flip asserterror flag to True", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      controller.page.state.asserterror = false;

      // Act
      controller.toggleAssert();

      // Assert
      expect(controller.page.state.asserterror).toEqual(true);
    });

    it("Should flip asserterror flag to False", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      controller.page.state.asserterror = true;

      // Act
      controller.toggleAssert();

      // Assert
      expect(controller.page.state.asserterror).toEqual(false);
    });
  });

  describe('validateCalPointValuesAndCalculateTolerancesAsync', () => {
    it('should track promise in pendingToleranceCalculationSet and remove it when resolved', async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      // Setup the pendingToleranceCalculationSet
      page.state.pendingToleranceCalculationSet = new Set();

      // Mock validateCalPoint to return a promise
      const mockPromise = Promise.resolve();
      controller.validateCalpoint = jest.fn().mockReturnValue(mockPromise);

      const calpoint = createCalpoint({ pluscwodspointid: "112", asfoundinput: "100", asfoundoutput: "3500.100", isaverage: false, _group_index: 0, _index: 0 });
      const context = { item: calpoint };
      const event = { target: { dataset: { previousValue: '' } } };

      // Act
      const resultPromise = controller.validateCalPointValuesAndCalculateTolerancesAsync(context, event);

      // Assert
      expect(controller.validateCalpoint).toHaveBeenCalledWith(context, event);
      expect(page.state.pendingToleranceCalculationSet.has(resultPromise)).toBe(true);

      // Wait for promise to resolve
      await resultPromise;

      // Check that promise was removed from set
      expect(page.state.pendingToleranceCalculationSet.has(resultPromise)).toBe(false);
    });

    it('should properly track and manage promises in the pendingToleranceCalculationSet', async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      // Setup the pendingToleranceCalculationSet
      page.state.pendingToleranceCalculationSet = new Set();

      // Create a spy on the Set.delete method to verify it's called
      const deleteSpyFn = jest.spyOn(page.state.pendingToleranceCalculationSet, 'delete');

      // Mock validateCalpoint to return a promise
      controller.validateCalpoint = jest.fn().mockReturnValue(Promise.resolve());

      const calpoint = createCalpoint({ pluscwodspointid: "112", asfoundinput: "100", asfoundoutput: "3500.100", isaverage: false, _group_index: 0, _index: 0 });
      const context = { item: calpoint };
      const event = { target: { dataset: { previousValue: '' } } };

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

  describe("validateCalpoint", () => {
    it("shouldDisplayFieldErrorsWhenCalpointIsInvalid", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");

      /**
       * Pick only the first error from the list to display in screen.
       * @var controller
       * @type {CalibrationPointsRepeatableController}
       */
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );

      // Arrange target objects
      const assetfunction = createAssetfunction({
        pluscwodsinstrid: "11",
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      });
      const calpoint = createCalpoint({
        pluscwodspointid: "112",
        asfoundinput: "XXXXXX",
        asfoundoutput: "3500.100",
        isaverage: false,
        _group_index: 0,
      });

      // Arrange mock functions
      const clearWarningsMockFn = jest.fn();

      // Arrange mocked methods
      controller.displayFieldErrors = jest.fn();

      // Arrange state variables
      page.state.assetfunction = assetfunction;
      page.state.condition = CalibrationPointConstants.CONDITION_ASFOUND;
      page.state.dsconfig = createDsConfig({ pluscdsconfigid: "601" });
      page.state.groupedCalpointsDS = {
        items: [
          {
            calpointsDS: {
              clearWarnings: clearWarningsMockFn,
              haserror: false,
              items: [
                calpoint,
                createCalpoint({
                  pluscwodspointid: "113",
                  asfoundinput: "100.60",
                  asfoundoutput: "3500.100",
                  isaverage: false,
                }),
                createCalpoint({
                  pluscwodspointid: "114",
                  asfoundinput: "100.06",
                  asfoundoutput: "3500.102",
                  isaverage: false,
                }),
                createCalpoint({
                  pluscwodspointid: "115",
                  asfoundinput: "100.66",
                  asfoundoutput: "3500.103",
                  isaverage: true,
                }),
              ],
            },
          },
        ],
      };
      controller.app.state.assetFunctionsDetailsDS = {
        currentItem: assetfunction,
      };

      // Arrange context
      const context = {
        field: "asfoundinput",
        item: calpoint,
      };
      const event = { target: { dataset: { previousValue: '' }}};

      // Act
      await controller.validateCalpoint(context, event);

      const formValid = controller.isFormValid();
      // Assert
      expect(formValid).toEqual(false);
      expect(controller.displayFieldErrors).toHaveBeenCalled();
    });

    it("shouldNotDisplayFieldErrorsWhenCalpointIsValid", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");

      /**
       * Pick only the first error from the list to display in screen.
       * @var controller
       * @type {CalibrationPointsRepeatableController}
       */
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );

      // Arrange target objects
      const assetfunction = createAssetfunction({
        pluscwodsinstrid: "11",
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        inputprecision: 5,
      });
      const calpoint = createCalpoint({
        pluscwodspointid: "112",
        asfoundinput: "100",
        asfoundoutput: "3500.100",
        isaverage: false,
        _group_index: 0,
        _index: 0,
      });

      // Arrange mock functions
      const clearWarningsMockFn = jest.fn();

      // Arrange mocked methods
      controller.displayFieldErrors = jest.fn();
      controller.changeCalpoint = jest.fn();

      // Arrange state variables
      page.state.assetfunction = assetfunction;
      page.state.condition = CalibrationPointConstants.CONDITION_ASFOUND;
      page.state.dsconfig = createDsConfig({ pluscdsconfigid: "601" });
      page.state.groupedCalpointsDS = {
        items: [
          {
            calpointsDS: {
              clearWarnings: clearWarningsMockFn,
              haserror: false,
              items: [
                calpoint,
                createCalpoint({
                  pluscwodspointid: "113",
                  asfoundinput: "100.60",
                  asfoundoutput: "3500.100",
                  isaverage: false,
                }),
                createCalpoint({
                  pluscwodspointid: "114",
                  asfoundinput: "100.06",
                  asfoundoutput: "3500.102",
                  isaverage: false,
                }),
                createCalpoint({
                  pluscwodspointid: "115",
                  asfoundinput: "100.66",
                  asfoundoutput: "3500.103",
                  isaverage: true,
                }),
              ],
            },
          },
        ],
      };
      controller.app.state.assetFunctionsDetailsDS = {
        currentItem: assetfunction,
      };

      // Arrange context
      const context = {
        field: "asfoundinput",
        item: calpoint,
      };

      const event = { target: { dataset: { previousValue: '' }}};

      // Act
      await controller.validateCalpoint(context, event);

      const formValid = controller.isFormValid();

      // Assert
      expect(formValid).toEqual(true);
      expect(controller.displayFieldErrors).not.toHaveBeenCalled();
      expect(
        page.state.groupedCalpointsDS.items[0].calpointsDS.items[
          calpoint._index
        ].asfoundinput
      ).toEqual("100.00000");
    });

    it("shouldNotFormatEmptyValue", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");

      /**
       * Pick only the first error from the list to display in screen.
       * @var controller
       * @type {CalibrationPointsRepeatableController}
       */
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );

      // Arrange target objects
      const assetfunction = createAssetfunction({
        pluscwodsinstrid: "11",
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        inputprecision: 5,
      });
      const calpoint = createCalpoint({
        pluscwodspointid: "112",
        asfoundinput: "",
        asfoundoutput: "3500.100",
        isaverage: false,
        _group_index: 0,
        _index: 0,
      });

      // Arrange mock functions
      const clearWarningsMockFn = jest.fn();

      // Arrange state variables
      page.state.assetfunction = assetfunction;
      page.state.condition = CalibrationPointConstants.CONDITION_ASFOUND;
      page.state.dsconfig = createDsConfig({ pluscdsconfigid: "601" });
      page.state.groupedCalpointsDS = {
        items: [
          {
            calpointsDS: {
              clearWarnings: clearWarningsMockFn,
              haserror: false,
              items: [calpoint],
            },
          },
        ],
      };

      // Arrange context
      const context = {
        field: "asfoundinput",
        item: calpoint,
      };

      const event = { target: { dataset: { previousValue: '' }}};

      // Act
      await controller.validateCalpoint(context, event);

      // Assert
      expect(
        page.state.groupedCalpointsDS.items[0].calpointsDS.items[
          calpoint._index
        ].asfoundinput
      ).toEqual("");
    });
  });

  describe("onCalpointValueChanged", () => {
    it("should detect change happned in input box", async () => {
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];
      const event = { target: { dataset: { previousValue: '' }}};

      expect(controller.isDirty()).toEqual(false);
      controller.onCalpointValueChanged(event);

      // Assert
      expect(controller.isDirty()).toEqual(true);
    });
  });

  describe("save", () => {
    it("Should save calibration point", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      // Arrange datasources
      const datasheetDSMock = app.findDatasource("pluscWoDs");

      controller.datasheetCalculation = { getRoundingOptionsObject: jest.fn() };
      controller.calculateTolError = jest.fn();
      controller.updateCalpointsIntoDS = jest.fn();
      controller.getDatasheetDS = jest.fn(() => datasheetDSMock);
      controller.isToleranceWarningShownOnSave = jest.fn(() => true);

      // Mock app resources
      controller.app.navigateBack = jest.fn();
      controller.app.state.calpointsds = createCalpointDS({
        items: [
          createCalpoint({ pluscwodspointid: 1011 }),
          createCalpoint({ pluscwodspointid: 1012 }),
          createCalpoint({ pluscwodspointid: 1013 }),
        ],
      });
      const calpointDS = controller.app.state.calpointsds;
      const origSave = calpointDS.save;
      const mockSave = jest.fn();
      calpointDS.save = mockSave;

      // Mock page resources
      controller.page.state.isdirty = false;
      controller.page.showDialog = jest.fn();
      controller.page.state.assetfunction = createAssetfunction();
      controller.page.state.condition =
        CalibrationPointConstants.CONDITION_ASFOUND;
      controller.page.state.groupedCalpointsDS = {
        items: [
          {
            avgpoint: createCalpoint({
              pluscwodspointid: 1014,
              _group_index: 0,
              _index: 3,
              isaverage: true,
            }),
            calpointsDS: {
              items: [
                createCalpoint({
                  pluscwodspointid: 1011,
                  _group_index: 0,
                  _index: 0,
                }),
                createCalpoint({
                  pluscwodspointid: 1012,
                  _group_index: 0,
                  _index: 1,
                }),
                createCalpoint({
                  pluscwodspointid: 1013,
                  _group_index: 0,
                  _index: 2,
                }),
              ],
            },
          },
        ],
      };

      const assetfunction = createAssetfunction({
        dsplannum: "DS101",
        outputprecision: 3,
        inputprecision: 3,
      });

      controller.getAssetFunction = jest.fn(() => assetfunction);

      const completeReadingsMockFn = jest.fn(() => datasheetDSMock);
      CalibrationPointHandler.prototype._completeReadings =
        completeReadingsMockFn;

      // Act
      await controller.save();

      // Assert
      // 1. Should update calpoint datasource with modified calpoints
      expect(controller.updateCalpointsIntoDS).toHaveBeenCalled();

      // 2. Complete calibration point reading (submission action) and
      expect(completeReadingsMockFn).toHaveBeenCalled();

      // 3. Should save and navigate back
      expect(mockSave).toHaveBeenCalled();
     
      // 4. Should call showdialog if tolerance warning needs to be displayed.
      expect(page.showDialog).toHaveBeenCalled();

      calpointDS.save = origSave;
    });

    it("shouldDisplayToastWhenFormIsNotValid", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      controller.app.toast = jest.fn();
      controller.app.getLocalizedLabel = jest.fn();
      controller.setSaving = jest.fn();

      // Act
      page.state.formvalid = false;

      await controller.save();

      // Arrange
      expect(controller.app.toast).toHaveBeenCalled();
      expect(controller.app.getLocalizedLabel).toHaveBeenCalled();
      expect(controller.setSaving).not.toHaveBeenCalled();
    });
  });

  describe("mapAllCalpointsToArray", () => {
    it("shouldDeleteVirtualPropertiesWhenCreatingArray", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      // Mock page resources
      const groupedCalpointsDS = {
        items: [
          {
            calpointsDS: {
              items: [
                createCalpoint({
                  pluscwodspointid: 1011,
                  _group_index: 0,
                  _index: 0,
                }),
                createCalpoint({
                  pluscwodspointid: 1012,
                  _group_index: 0,
                  _index: 1,
                }),
                createCalpoint({
                  pluscwodspointid: 1013,
                  _group_index: 0,
                  _index: 2,
                }),
              ],
            },
          },
        ],
      };

      // Act
      const calpoints = controller.mapAllCalpointsToArray(groupedCalpointsDS);

      // Assert
      expect(calpoints.length).toEqual(3);
      expect(calpoints[0].pluscwodspointid).toEqual(1011);
      expect(calpoints[1].pluscwodspointid).toEqual(1012);
      expect(calpoints[2].pluscwodspointid).toEqual(1013);

      calpoints.forEach((calpoint) => {
        CalibrationPointConstants.EXCLUDE_ATTRIBUTES.forEach((attr) => {
          expect(calpoint).not.toHaveProperty(attr);
        });
      });
    });

    it("shouldKeepVirtualPropertiesWhenCreatingArray", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      // Mock page resources
      const groupedCalpointsDS = {
        items: [
          {
            calpointsDS: {
              items: [
                createCalpoint({
                  pluscwodspointid: 1011,
                  _group_index: 0,
                  _index: 0,
                }),
                createCalpoint({
                  pluscwodspointid: 1012,
                  _group_index: 0,
                  _index: 1,
                }),
                createCalpoint({
                  pluscwodspointid: 1013,
                  _group_index: 0,
                  _index: 2,
                }),
              ],
            },
          },
        ],
      };

      // Act
      const calpoints = controller.mapAllCalpointsToArray(
        groupedCalpointsDS,
        CalibrationPointConstants.KEEP_VIRTUAL_ATTRS
      );

      // Assert
      expect(calpoints.length).toEqual(3);
      expect(calpoints[0].pluscwodspointid).toEqual(1011);
      expect(calpoints[1].pluscwodspointid).toEqual(1012);
      expect(calpoints[2].pluscwodspointid).toEqual(1013);

      calpoints.forEach((calpoint) => {
        CalibrationPointConstants.EXCLUDE_ATTRIBUTES.forEach((attr) => {
          expect(calpoint).toHaveProperty(attr);
        });
      });
    });
  });

  describe("formatCalpointBeforeSave", () => {
    it("shouldFormatAnalogPoints", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");

      /**
       * Pick only the first error from the list to display in screen.
       * @var controller
       * @type {CalibrationPointsRepeatableController}
       */
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );

      // Arrange target objects
      const assetfunction = createAssetfunction({
        pluscwodsinstrid: "11",
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        inputprecision: 5,
        outputprecision: 5,
      });
      const calpoint = createCalpoint({
        pluscwodspointid: "112",
        asfoundinput: "1,000.0",
        asfoundoutput: "3,500.0",
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
      });

      // Arrange state variables
      page.state.assetfunction = assetfunction;
      page.state.condition = CalibrationPointConstants.CONDITION_ASFOUND;

      // Act
      const updated = await controller.formatCalpointBeforeSave(calpoint);

      // Assert
      expect(updated.asfoundinput).toEqual("1000.00000");
      expect(updated.asfoundoutput).toEqual("3500.00000");
    });

    it("shouldFormatDiscretePoints", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");

      /**
       * Pick only the first error from the list to display in screen.
       * @var controller
       * @type {CalibrationPointsRepeatableController}
       */
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );

      // Arrange target objects
      const assetfunction = createAssetfunction({
        pluscwodsinstrid: "11",
        plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
        inputprecision: 5,
        outputprecision: 5,
      });
      const calpoint = createCalpoint({
        pluscwodspointid: "112",
        asfoundsetpoint: "1,000.0",
        plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
      });

      // Arrange state variables
      page.state.assetfunction = assetfunction;
      page.state.condition = CalibrationPointConstants.CONDITION_ASFOUND;

      // Act
      const updated = await controller.formatCalpointBeforeSave(calpoint);

      // Assert
      expect(updated.asfoundsetpoint).toEqual("1000.00000");
    });

    it("shouldNotFormatEmptyNumbers", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");

      /**
       * Pick only the first error from the list to display in screen.
       * @var controller
       * @type {CalibrationPointsRepeatableController}
       */
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );

      // Arrange target objects
      const assetfunction = createAssetfunction({
        pluscwodsinstrid: "11",
        plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
        inputprecision: 5,
        outputprecision: 5,
      });
      const calpoint = createCalpoint({
        pluscwodspointid: "112",
        asfoundsetpoint: "",
        plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
      });

      // Arrange state variables
      page.state.assetfunction = assetfunction;
      page.state.condition = CalibrationPointConstants.CONDITION_ASFOUND;

      // Act
      const updated = await controller.formatCalpointBeforeSave(calpoint);

      // Assert
      expect(updated.asfoundsetpoint).toEqual("");
    });
  });

  describe("updateCalpointsIntoDS", () => {
    it("Should find calibration point in datasource and update it with updatedCalpoints", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];

      const calpointsDS = {
        // Datasource
        items: [
          createCalpoint({
            pluscwodspointid: 1011,
            asfoundinput: 1.15,
            asfoundoutput: 100.66,
          }),
          createCalpoint({
            pluscwodspointid: 1012,
            asfoundinput: 1.2,
            asfoundoutput: 50.66,
          }),
          createCalpoint({
            pluscwodspointid: 1013,
            asfoundinput: 3.15,
            asfoundoutput: 75.12,
          }),
          createCalpoint({
            pluscwodspointid: 1014,
            asfoundinput: 10.15,
            asfoundoutput: 88.1,
          }),
        ],
      };

      controller.getCalibrationPointsDS = jest.fn(() => calpointsDS);

      const updatedCalpoint = createCalpoint({
        pluscwodspointid: 1014,
        asfoundinput: 300.0,
        asfoundoutput: 400.0,
      });

      const assetfunction = createAssetfunction({
        dsplannum: "DS101",
        outputprecision: 3,
        inputprecision: 3,
      });

      controller.getAssetFunction = jest.fn(() => assetfunction);

      // Act
      controller.updateCalpointsIntoDS(updatedCalpoint);

      // Assert

      // Should update last calibration points in `calpointsDS`
      expect(calpointsDS.items[3].pluscwodspointid).toEqual(1014);
      expect(calpointsDS.items[3].asfoundinput).toEqual(300.0);
      expect(calpointsDS.items[3].asfoundoutput).toEqual(400.0);
    });
  });

  describe("funcCheckToggle", () => {
    it("Should update status to PASS when condition is valid", async () => {
      CalibrationPointConstants.PREFIXES.forEach(async (condition) => {
        // Arrange
        const app = await baseSetup();
        const page = app.findPage("calpointrepeatable");
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
        const page = app.findPage("calpointrepeatable");
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
      const page = app.findPage("calpointrepeatable");
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

  describe("displayFieldErrors", () => {
    it("shouldMarkAsFoundAsFail", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );

      const calpoint = createCalpoint({
        pluscwodspointid: "1011",
        asfoundfail: false,
        _group_index: 0,
        _index: 0,
      });

      const setWarningMockFn = jest.fn();

      const groupedCalpointsDS = {
        items: [
          {
            calpointsDS: {
              setWarning: setWarningMockFn,
              items: [calpoint],
            },
          },
        ],
      };

      const fieldErrors = [
        new FieldError(
          CalibrationPointConstants.FIELD_ERROR,
          calpoint,
          "asfoundinput",
          new Message("cannot_be_empty_value", "Cannot be empty value")
        ),
      ];

      // Act
      controller.displayFieldErrors(groupedCalpointsDS, fieldErrors);

      // Assert
      expect(calpoint.asfoundfail).toEqual(true);
      expect(setWarningMockFn).toHaveBeenCalled();
    });

    it("shouldMarkAsLeftAsFail", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );

      const calpoint = createCalpoint({
        pluscwodspointid: "1011",
        asleftfail: false,
        _group_index: 0,
        _index: 0,
      });

      const setWarningMockFn = jest.fn();

      const groupedCalpointsDS = {
        items: [
          {
            calpointsDS: {
              setWarning: setWarningMockFn,
              items: [calpoint],
            },
          },
        ],
      };

      const fieldErrors = [
        new FieldError(
          CalibrationPointConstants.FIELD_ERROR,
          calpoint,
          "asleftinput",
          new Message("cannot_be_empty_value", "Cannot be empty value")
        ),
      ];

      // Act
      controller.displayFieldErrors(groupedCalpointsDS, fieldErrors);

      // Assert
      expect(calpoint.asleftfail).toEqual(true);
      expect(setWarningMockFn).toHaveBeenCalled();
    });

    it("shouldSetWarningWhenFieldHasError", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );

      const calpoint = createCalpoint({
        pluscwodspointid: "1011",
        asfoundfail: false,
        _group_index: 0,
        _index: 0,
      });

      const setWarningMockFn = jest.fn();

      const groupedCalpointsDS = {
        items: [
          {
            calpointsDS: {
              setWarning: setWarningMockFn,
              items: [calpoint],
            },
          },
        ],
      };

      const fieldErrors = [
        new FieldError(
          CalibrationPointConstants.FIELD_ERROR,
          calpoint,
          "asfoundinput",
          new Message("cannot_be_empty_value", "Cannot be empty value")
        ),
      ];

      // Act
      controller.displayFieldErrors(groupedCalpointsDS, fieldErrors);

      // Assert
      expect(setWarningMockFn).toHaveBeenCalled();
    });

    it("shouldMarkOutputExceededWhenOutputHasError", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );

      const calpoint = createCalpoint({
        pluscwodspointid: "1011",
        asfoundfail: false,
        _group_index: 0,
        _index: 0,
      });

      const setWarningMockFn = jest.fn();

      const groupedCalpointsDS = {
        items: [
          {
            calpointsDS: {
              setWarning: setWarningMockFn,
              items: [calpoint],
            },
          },
        ],
      };

      const fieldErrors = [
        new FieldError(
          CalibrationPointConstants.FIELD_WARNING,
          calpoint,
          "asfoundoutput",
          new Message("cannot_be_empty_value", "Cannot be empty value")
        ),
      ];

      // Act
      controller.displayFieldErrors(groupedCalpointsDS, fieldErrors);

      // Assert
      expect(calpoint._output_exceeded).toEqual("Cannot be empty value");
    });

    it("shouldNotMarkOutputExceededWhenTypeIsNotWarning", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );

      const calpoint = createCalpoint({
        pluscwodspointid: "1011",
        asfoundfail: false,
        _output_exceeded: false,
        _group_index: 0,
        _index: 0,
      });

      const setWarningMockFn = jest.fn();

      const groupedCalpointsDS = {
        items: [
          {
            calpointsDS: {
              setWarning: setWarningMockFn,
              items: [calpoint],
            },
          },
        ],
      };

      const fieldErrors = [
        new FieldError(
          CalibrationPointConstants.FIELD_ERROR,
          calpoint,
          "asfoundoutput",
          new Message("cannot_be_empty_value", "Cannot be empty value")
        ),
      ];

      // Act
      controller.displayFieldErrors(groupedCalpointsDS, fieldErrors);

      // Assert
      expect(calpoint._output_exceeded).toEqual(false);
    });

    it("shouldNotMarkOutputExceededWhenFieldIsNotOutput", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.findController(
        (c) => c instanceof CalibrationPointsRepeatableController
      );

      const calpoint = createCalpoint({
        pluscwodspointid: "1011",
        asfoundfail: false,
        _output_exceeded: false,
        _group_index: 0,
        _index: 0,
      });

      const setWarningMockFn = jest.fn();

      const groupedCalpointsDS = {
        items: [
          {
            calpointsDS: {
              setWarning: setWarningMockFn,
              items: [calpoint],
            },
          },
        ],
      };

      const fieldErrors = [
        new FieldError(
          CalibrationPointConstants.FIELD_WARNING,
          calpoint,
          "asfoundinput",
          new Message("cannot_be_empty_value", "Cannot be empty value")
        ),
      ];

      // Act
      controller.displayFieldErrors(groupedCalpointsDS, fieldErrors);

      // Assert
      expect(calpoint._output_exceeded).toEqual(false);
    });
  });

  describe('getLocaleNumber', () => {
    it('should call toDisplayableValue with input precision when whichfieldtype is "input"',async () => {
      const app = await baseSetup();
      const page = app.findPage("calpointrepeatable");
      const controller = page.controllers[0];
      // Arrange
      const itemValue = '10,123.456';
      const whichfieldtype = 'input';
  
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
      const page = app.findPage("calpointrepeatable");
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

  /* ------------------------------------------------------------------ */
  /*                                                                    */
  /* Generators                                                         */
  /*                                                                    */
  /* ------------------------------------------------------------------ */

  const createAppMock = () => ({
    getUserInfo: jest.fn(() => testUserinfoData),
    findDatasource: jest.fn((name) => {
      if (name === "domaincalstatusds") {
        return new Datasource(
          new JSONDataAdapter({
            src: {
              items: testDomaincalstatusData.member,
              loadingDelay: 0,
              searchDelay: 0,
            },
          }),
          {
            autoSave: false,
            name: "domaincalstatusds",
            pageSize: testDomaincalstatusData.length,
            selectionMode: "none",
            selectionRequired: false,
            idAttribute: "valueid",
          }
        );
      }

      if (name === "dsconfig") {
        return new Datasource(
          new JSONDataAdapter({
            src: {
              items: testDsconfigData.member,
              loadingDelay: 0,
              searchDelay: 0,
            },
          }),
          {
            autoSave: false,
            name: "dsconfig",
            pageSize: testDsconfigData.length,
            selectionMode: "none",
            selectionRequired: false,
            idAttribute: "pluscdsconfigid",
          }
        );
      }
    }),
  });

  const createCalpointDS = (props) => defaults(props, { items: [] });

  const createCalpoint = (props) =>
    defaults(props, {
      pluscwodspointid: null,
      asfoundpass: null,
      asleftpass: null,
      asfounderror1: null,
      asfounderror2: null,
      asfounderror3: null,
      asfounderror4: null,
      asfoundinput: null,
      asfoundoutput: null,
      asfoundsetpoint: null,
      asfoundtol1lower: null,
      asfoundtol1upper: null,
      asfoundtol2lower: null,
      asfoundtol2upper: null,
      asfoundtol3lower: null,
      asfoundtol3upper: null,
      asfoundtol4lower: null,
      asfoundtol4upper: null,
      asfoundunit: null,
      aslefterror1: null,
      aslefterror2: null,
      aslefterror3: null,
      aslefterror4: null,
      asleftinput: null,
      asleftsetpoint: null,
      aslefttol1lower: null,
      aslefttol1upper: null,
      aslefttol2lower: null,
      aslefttol2upper: null,
      aslefttol3lower: null,
      aslefttol3upper: null,
      aslefttol4lower: null,
      aslefttol4upper: null,
      asleftunit: null,
      href: null,
      inputvalue_np: null,
      inputvalue: null,
      instrumentdesc: null,
      instrumentfunction: null,
      outputvalue_np: null,
      outputvalue: null,
      plantype: null,
      point: null,
      pointdescription: null,
      _group_index: 0,
      _index: 0,
      _output_exceeded: 0,
    });

  const createAssetfunction = (props) =>
    defaults(props, {
      pluscwodsinstrid: null,
      href: null,
      asfoundcalstatus: null,
      asleftcalstatus: null,
      caldynamic: null,
      calfunction: null,
      calpoint: null,
      cliplimits: 1,
      cliplimitsin: 1,
      description: null,
      dsplannum: null,
      inputprecision: null,
      inputrange: null,
      instrcalrangeeu: null,
      instrcalrangefrom: null,
      instrcalrangeto: null,
      instroutrangeeu: null,
      instroutrangefrom: null,
      instroutrangeto: null,
      outputprecision: null,
      outputrange: null,
      plantype: null,
      repeatable: null,
      revisionnum: null,
      ron1lowervalue: null,
      ron1type: null,
      ron1uppervalue: null,
      tol1lowervalue: null,
      tol1status: null,
      tol1type: null,
      tol1uppervalue: null,
      tol2lowervalue: null,
      tol2status: null,
      tol2type: null,
      tol2uppervalue: null,
      tol3lowervalue: null,
      tol3status: null,
      tol3type: null,
      tol3uppervalue: null,
      tol4lowervalue: null,
      tol4status: null,
      tol4type: null,
      tol4uppervalue: null,
      pluscwodspoint: [],
    });

  const createDsConfig = (props) =>
    defaults(props, {
      pluscdsconfigid: null,
      asseterror: null,
      assetnplaces: null,
      assettruncate: null,
      dsplannum: null,
      outputtruncate: null,
      rangetruncate: null,
      repeatvalue: null,
      revisionnum: null,
      stddev: null,
      tolerror: null,
      tolnplaces: null,
      toltruncate: null,
    });
});
