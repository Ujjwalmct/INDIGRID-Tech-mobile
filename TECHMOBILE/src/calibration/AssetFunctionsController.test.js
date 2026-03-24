
/** Constants */
import CalibrationPointConstants from "./rules/constants/CalibrationPointConstants.js";
import DatasheetConstants from "./rules/constants/DatasheetConstants.js";

/** Utils */
import CommonUtil from "../utils/CommonUtil.js";
import SynonymDomain from './rules/models/SynonymDomain.js';
import generateRandomInt from "./rules/utils/generateRandomInt.js";
import fromDisplayableValue from "./rules/utils/numberFormatter/fromDisplayableValue.js";

/** Controller */
import AssetFunctionsController from "./AssetFunctionsController";

/** Test */
import newTestStub from "../test/AppTestStub.jsx";
import testCalpointsData from "./test/test-calpoints-data.js";
import testCalibrationData from "./test/test-calibration-data.js";
import testDatasheetData from "./test/test-datasheet-data.js";

/** Graphite */
import { Page } from "@maximo/maximo-js-api";
import CalibrationHelper from "./utils/CalibrationHelper.js";

/** Implementation */
// eslint-disable-next-line
vi.mock('../utils/CommonUtil.js');
// eslint-disable-next-line
vi.mock('./rules/models/SynonymDomain.js');

const mockShowAllStatus = jest.fn();

const mockShowFilteredStatus = jest.fn();

beforeEach(() => {
  // Clear all instances and calls to constructor and all methods:
  SynonymDomain.mockClear();
  mockShowAllStatus.mockClear();
  mockShowFilteredStatus.mockClear();

  // Mock the implementation of the SynonymDomain class
  SynonymDomain.mockImplementation(() => ({
    showAllStatus: mockShowAllStatus,
    showFilteredStatus: mockShowFilteredStatus
  }));
});

const baseSetup = async () => {
  return newTestStub({
    currentPage: "assetfunctions",
    onNewState: (state) => {
      return { 
        ...state, 
        canLoadCalibrationData: true
      }
    },
    datasources: {
      pluscWoDs: {
        data: testCalibrationData
      }
    },
  })();
};

describe("AssetFunctionsController", () => {
  it("Page initialized", async () => {
    const app = await baseSetup();
    const ds = app.findDatasource("pluscWoDs");

    expect(ds.state.hasData).toBe(false);
    await ds.load();
    expect(ds.state.hasData).toBe(true);
  });

  it("Page resumed", async () => {
    let app = await baseSetup();
    // assumes that 'pluscWoDs' is in your application
    let ds = app.findDatasource("pluscWoDs");
    await ds.load();

    app.currentPage.params = {
      itemhref:
        "oslc/os/techmobile/childkey#V09SS09SREVSL1BMVVNDV09EUy9QTFVTQ1dPRFNJTlNUUi8xMg--",
      assetfunctiontitle: "DS101 PG100300420EU",
    };
    app.currentPage.controllers[0].pageResumed(app.currentPage, app);

    expect(app.currentPage.state.assetfunctiontitle).toEqual(
      "DS101 PG100300420EU"
    );
  });

  it("Should send user back to last visited page", async () => {
    const controller = new AssetFunctionsController();
    let app = await baseSetup();

    const page = new Page({ name: "Asset Function" });
    app.registerPage(page);

    let pageSetter = jest.fn();

    app.registerController(controller);

    const originalSetter = app.setCurrentPage;
    app.setCurrentPage = pageSetter;

    controller.pageInitialized(page, app);

    await controller.goBack();

    expect(pageSetter.mock.calls.length).toEqual(1);

    app.setCurrentPage = originalSetter;
  });

  describe("goBack", () => {
    it("Should navigate back", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      app.navigateBack = jest.fn();
      controller.resetDataSource = jest.fn();

      // Act
      await controller.goBack();

      // Assert
      expect(app.navigateBack).toHaveBeenCalled();
    });
  });

  describe("openCalibrationPoints", () => {
    it("Should do nothing when calibration point is not defined", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();
      const pluscwodsinstrid = testCalibrationData.member[0].pluscwodsinstr[0].pluscwodsinstrid;

      controller.loadCalibrationPointsds = jest.fn();
      controller.loadCalibrationFunctionds = jest.fn();
      controller.loadCalibrationDynamicds = jest.fn();

      const event = {
        item: {
          calpoint: false,
          calfunction: false,
          caldynamic: false,
          pluscwodsinstrid: pluscwodsinstrid
        },
      };
      app.state.selectedAssetFunctionsIndex = undefined;

      // Act
      controller.openCalibrationPoints(event);

      // Assert
      expect(app.state.selectedAssetFunctionsIndex).toEqual(0);
      expect(controller.loadCalibrationPointsds).not.toHaveBeenCalled();
      expect(controller.loadCalibrationFunctionds).not.toHaveBeenCalled();
      expect(controller.loadCalibrationDynamicds).not.toHaveBeenCalled();
    });

    it("Should open calibration points ds when item is calpoint", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();
      const pluscwodsinstrid = testCalibrationData.member[0].pluscwodsinstr[0].pluscwodsinstrid;

      controller.loadCalibrationPointsds = jest.fn();

      const event = {
        item: {
          calpoint: true,
          pluscwodsinstrid: pluscwodsinstrid,
        },
      };
      app.state.selectedAssetFunctionsIndex = undefined;

      // Act
      controller.openCalibrationPoints(event);

      // Assert
      expect(app.state.selectedAssetFunctionsIndex).toEqual(0);
      expect(controller.loadCalibrationPointsds).toHaveBeenCalled();
    });

    it("Should open calibration function ds when item is calfunction", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();
      const pluscwodsinstrid = testCalibrationData.member[0].pluscwodsinstr[0].pluscwodsinstrid;

      controller.loadCalibrationFunctionds = jest.fn();

      const event = {
        item: {
          calfunction: true,
          pluscwodsinstrid: pluscwodsinstrid,
        },
      };
      app.state.selectedAssetFunctionsIndex = undefined;

      // Act
      controller.openCalibrationPoints(event);

      // Assert
      expect(app.state.selectedAssetFunctionsIndex).toEqual(0);
      expect(controller.loadCalibrationFunctionds).toHaveBeenCalled();
    });

    it("Should open calibration dynamic ds when item is caldynamic", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();
      const pluscwodsinstrid = testCalibrationData.member[0].pluscwodsinstr[0].pluscwodsinstrid;

      controller.loadCalibrationPointsds = jest.fn();
      controller.loadCalibrationFunctionds = jest.fn();
      controller.loadCalibrationDynamicds = jest.fn();

      const event = {
        item: {
          caldynamic: true,
          pluscwodsinstrid: pluscwodsinstrid,
        },
      };
      app.state.selectedAssetFunctionsIndex = undefined;

      // Act
      controller.openCalibrationPoints(event);

      // Assert
      expect(app.state.selectedAssetFunctionsIndex).toEqual(0);
      expect(controller.loadCalibrationDynamicds).toHaveBeenCalled();
    });

    it("Should open calibration repeatable page when asset function is repeatable", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();
      const pluscwodsinstrid = testCalibrationData.member[0].pluscwodsinstr[0].pluscwodsinstrid;

      controller.loadCalibrationPointsds = jest.fn();
      controller.loadCalibrationFunctionds = jest.fn();
      controller.loadCalibrationDynamicds = jest.fn();
      controller.loadCalibrationPointsRepeatablePage = jest.fn();

      const event = {
        item: {
          repeatable: true,
          pluscwodsinstrid: pluscwodsinstrid,
        },
      };
      app.state.selectedAssetFunctionsIndex = undefined;

      // Act
      controller.openCalibrationPoints(event);

      // Assert
      expect(app.state.selectedAssetFunctionsIndex).toEqual(0);
      expect(controller.loadCalibrationPointsRepeatablePage).toHaveBeenCalled();
    });
  });

  describe("loadCalibrationPointsds", () => {
    it("Should open calibration point page", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      controller.loadCalibrationPointPage = jest.fn();

      const item = {
        description: "HelloWorld",
        calpoint: true,
      };

      // Act
      await controller.loadCalibrationPointsds(item);

      // Assert
      expect(controller.loadCalibrationPointPage).toHaveBeenCalled();
    });
  });

  describe("loadCalibrationDynamicds", () => {
    it("Should open calibration point page", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      controller.loadCalibrationPointPage = jest.fn();

      const item = {
        description: "HelloWorld",
        caldynamic: true,
      };

      // Act
      await controller.loadCalibrationDynamicds(item);

      // Assert
      expect(controller.loadCalibrationPointPage).toHaveBeenCalled();
    });
  });

  describe("loadCalibrationFunctionds", () => {
    it("Should open calibration point page", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      controller.loadCalibrationPointPage = jest.fn();

      const item = {
        description: "HelloWorld",
        calfunction: true,
      };

      // Act
      await controller.loadCalibrationFunctionds(item);

      // Assert
      expect(controller.loadCalibrationPointPage).toHaveBeenCalled();
    });
  });

  describe("loadCalibrationPointsRepeatablePage", () => {
    it("Should open calibration point repeatable page", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();

      const assetfunction = app.state.assetFunctionsDetailsDS.item;

      // Act
      controller.loadCalibrationPointsRepeatablePage(assetfunction);

      // Assert
      expect(app.state.currentPageName).toEqual("calpointrepeatable");
    });
  });

  describe("loadCalibrationPointPage", () => {
    it("Should load page when asset function datasource exists", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();

      const assetfunction = app.state.assetFunctionsDetailsDS.item;
      controller.app.state = {
        ...controller.app.state,
        status: CalibrationPointConstants.CONDITION_ASFOUND
      };

      const overrideParams = {
        calpointtitle: "Overriden title",
        calfunction: true,
      };

      // Act
      await controller.loadCalibrationPointPage(assetfunction, overrideParams);

      // Assert
      expect(app.state.currentPageName).toEqual("calibrationpoints");
      expect(app.currentPage.params.calpointtitle).toEqual("Overriden title");
      expect(app.currentPage.params.calfunction).toBe(true);
    });

    it("Should return false when asset function DS does not exist", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      controller.app.state = {
        ...controller.app.state,
        status: CalibrationPointConstants.CONDITION_ASFOUND
      };

      const item = null;
      const overrideParams = null;

      // Act
      const loaded = await controller.loadCalibrationPointPage(
        item,
        overrideParams
      );

      // Assert
      expect(loaded).toEqual(false);
    });

    it("Should load page when condition is AS LEFT", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();

      const assetfunction = app.state.assetFunctionsDetailsDS.item;

      controller.app.state = {
        ...controller.app.state,
        status: CalibrationPointConstants.CONDITION_ASLEFT
      };

      const overrideParams = {
        calpointtitle: "Overriden title",
        calfunction: true,
      };

      // Act
      await controller.loadCalibrationPointPage(assetfunction, overrideParams);

      // Assert
      expect(app.state.currentPageName).toEqual("calibrationasleftpoints");
      expect(app.currentPage.params.calpointtitle).toEqual("Overriden title");
      expect(app.currentPage.params.calfunction).toBe(true);
    });

    it("Should load page when overrideParams is undefined", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();

      const assetfunction = app.state.assetFunctionsDetailsDS.item;

      controller.app.state = {
        ...controller.app.state,
        status: CalibrationPointConstants.CONDITION_ASLEFT
      };

      // Act
      await controller.loadCalibrationPointPage(assetfunction);

      // Assert
      expect(app.state.currentPageName).toEqual("calibrationasleftpoints");
    });
  });

  describe("loadDsConfig", () => {
    it("Should load dsconfig with asset function params when asset function is available", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      const ds = app.findDatasource("pluscWoDs");
      await ds.load();

      const dsplannum = `DS${generateRandomInt()}`;
      const revisionnum = generateRandomInt();

      const pluscwodsinstr = {
        currentItem: {
          dsplannum,
          revisionnum,
        },
      };

      const dsconfigMockFn = {
        load: jest.fn(),
        resetState: jest.fn(),
        clearState: jest.fn(),
      };
      const origFindDs = controller.app.findDatasource;
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
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      const ds = app.findDatasource("pluscWoDs");
      await ds.load();

      const dsconfigMockFn = {
        load: jest.fn(),
        resetState: jest.fn(),
        clearState: jest.fn(),
      };
      const origFindDs = controller.app.findDatasource;
      controller.app.findDatasource = jest.fn(() => dsconfigMockFn);

      // Act
      await controller.loadDsConfig();

      // Assert
      expect(dsconfigMockFn.load).toHaveBeenCalled();
      expect(dsconfigMockFn.load.mock.calls[0][0]).toEqual(undefined);
      controller.app.findDatasource = origFindDs;
    });
  });


  describe("getAssetFunctionDS", () => {
    it("Should return instance of getAssetFunctionDS", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      const ds = app.findDatasource("pluscWoDs");
      await ds.load();

      const assetfunctionDS = await loadAssetFunctionDS(ds);
      controller.app.state.assetFunctionsDetailsDS = assetfunctionDS;

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
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      const ds = app.findDatasource("pluscWoDs");
      await ds.load();

      const calpointsds = await loadCalpointsDS(ds);
      controller.app.state.calpointsds = calpointsds;

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
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      const ds = app.findDatasource("pluscWoDs");
      await ds.load();

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
      const page = app.findPage("assetfunctions");
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

  describe("getConditionPrefix", () => {
    it("Should return condition", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      // controller.app.state.status = CalibrationPointConstants.CONDITION_ASFOUND;
      page.state.condition = CalibrationPointConstants.CONDITION_ASFOUND;

      // Act
      const conditionPrefix = controller.getConditionPrefix();

      // Assert
      expect(conditionPrefix).toEqual(
        CalibrationPointConstants.CONDITION_ASFOUND
      );
    });
  });

  describe("openTypeLookup", () => {
    it("Should open Type Lookup", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      const openUnitLookupMockFn = jest.fn();

      controller.assetUnitLookupHelper = {
        openUnitLookup: openUnitLookupMockFn,
      };

      const event = {
        changeText: null,
        item: null,
      };

      // Act
      await controller.openTypeLookup(event);

      // Assert
      expect(openUnitLookupMockFn).toHaveBeenCalled();
    });
  });

  describe("openEnvironmentalConditions", () => {
    it("Should display dialog", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      page.showDialog = jest.fn();

      // Act
      await controller.openEnvironmentalConditions();

      // Assert
      expect(page.showDialog).toHaveBeenCalled();
    });
  });

  describe("openRemarks", () => {
    it("Should open remark dialog", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      page.showDialog = jest.fn();

      // Act
      await controller.openRemarks();

      // Assert
      expect(page.showDialog).toHaveBeenCalled();
    });

    it("Should save a remark", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      page.showDialog = jest.fn();
      page.closeDialog = jest.fn();


      const datasheetDS = app.findDatasource("pluscWoDs");

      await controller.openRemarks();

      datasheetDS.remark = "Remark";
      datasheetDS.save = jest.fn().mockReturnValue({});

      controller.saveRemark();

      expect(datasheetDS.save).toHaveBeenCalled();
    });
  });

  describe("selectUnits", () => {
    it("Should push selected unit into selected list", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      const pushMockFn = jest.fn();

      const accessor = "xxxxx";

      controller.page = {
        ...controller.page,
        state: {
          ...controller.page.state,
          changeText: accessor,
          selectedUnit: accessor,
          currentItem: {
            xxxxx: null,
          },
        },
      };

      const origFindDs = controller.app.findDatasource;
      controller.app.findDatasource = () => ({
        items: {
          push: pushMockFn,
        },
        load: jest.fn()
      });

      const itemSelected = {
        value: accessor,
        _selected: true,
      };

      // Act
      controller.selectUnits(itemSelected);

      // Assert
      expect(controller.page.state.selectedUnit).toEqual(accessor);
      controller.app.findDatasource = origFindDs;
    });

    it("Should clear selection when item is not selected", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      const accessor = "xxxxx";

      controller.page = {
        ...controller.page,
        state: {
          ...controller.page.state,
          changeText: accessor,
          selectedUnit: accessor,
          currentItem: {
            xxxxx: null,
          },
        },
      };

      const itemSelected = {
        value: accessor,
        _selected: false,
      };

      // Act
      controller.selectUnits(itemSelected);

      // Assert
      expect(controller.page.state.selectedUnit).toEqual("");
    });
  });

  describe("updateEnvironmentConditions", () => {
    it("Should update environment conditions", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      const origGetDatasheetDS = controller.getDatasheetDS;
      const mockGetDatasheetDS = jest.fn();
      controller.getDatasheetDS = mockGetDatasheetDS;
      const saveMockFn = jest.fn();

      controller.getDatasheetDS = jest.fn().mockReturnValue({
        currentItem: { id: "datasheet0001" },
        save: saveMockFn
      });

      const origFindDs = controller.app.findDatasource;
      controller.app.findDatasource = () => ({
        save: saveMockFn,
        load: jest.fn(),
        forceReload: jest.fn(),
        getChildDatasource: jest.fn(() => ({
          load: () => [],
        })),
      });

      controller.page.state.selectedUnit = "unit001";

      // Act
      await controller.updateEnvironmentConditions();

      // Assert
      expect(saveMockFn).toHaveBeenCalled();
      controller.app.findDatasource = origFindDs;
      controller.getDatasheetDS = origGetDatasheetDS;
    });

    it("Should not update conditions when there is no selected unit", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      const saveMockFn = jest.fn();

      const origFindDs = controller.app.findDatasource;
      controller.app.findDatasource = () => ({
        save: saveMockFn,
        load: jest.fn(),
      });

      controller.page.state.selectedUnit = false;

      // Act
      await controller.updateEnvironmentConditions();

      // Assert
      expect(saveMockFn).not.toHaveBeenCalled();
      controller.app.findDatasource = origFindDs;
    });
  });

  describe("handleToggled", () => {
    it("Should update item.noadjmade and show the correct dialog based on event.checked", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      const mockShowDialog = jest.fn();
      controller.page = { showDialog: mockShowDialog };
      controller.page.state = {
        noadjMade : false
      };

      // Define the initial state of the item
      const item = { noadjmade: false, pluscwodsinstrid: 1 }; // Add pluscwodsinstrid for completeness
  
      // Define the mock event with checked set to true
      const eventTrue = {
        item: item,
        evt: {
          target: {
            checked: true,
          },
        },
      };
  
      // Define the mock event with checked set to false
      const eventFalse = {
        item: item,
        evt: {
          target: {
            checked: false,
          },
        },
      };
  
      controller.page.state.noadjMade = eventTrue;
  
      // Act for checked = true
      controller.handleToggled(eventTrue);
      // Assert for checked = true
      expect(controller.page.state.noadjMade).toBe(true);
      expect(item.noadjmade).toBe(false);
      expect(mockShowDialog).toHaveBeenCalledWith("noAdjLimit");
  
      controller.page.state.noadjMade = eventFalse;
      // Act for checked = false
      controller.handleToggled(eventFalse);
      // Assert for checked = false
      expect(controller.page.state.noadjMade).toBe(false);
      expect(item.noadjmade).toBe(true);
      expect(mockShowDialog).toHaveBeenCalledWith("noAdjLimitOff");
    });
  });

  describe("clearCalibrationPoints", () => {
    it("Should clear calibration points and update state correctly", async () => {
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];
      const pluscWoDs = app.findDatasource("pluscWoDs");
      const origSaveData = controller.saveData;
      const mockSaveData = jest.fn();
      await pluscWoDs.loadAndWaitForChildren({ src: testDatasheetData });

      const pluscwodsinstrid = app.state.assetFunctionsDetailsDS.item.pluscwodsinstrid;
      app.state.pluscwodsinstrid = pluscwodsinstrid;
      controller.saveData = mockSaveData;
      const pointToUpdate = app.state.assetFunctionsDetailsDS.item['pluscwodspoint'][0];
      pointToUpdate.asleftinput = '100.00';
      pointToUpdate.asleftoutput = '4.00';

      await controller.clearCalibrationPoints();

      expect(pointToUpdate.asleftinput).toEqual(null);
      expect(pointToUpdate.asleftoutput).toEqual(null);
      controller.saveData = origSaveData;
    });
  });

  describe("copyCalibrationPoints", () => {
    it("Should copy calibration points for AF", async () => {
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];
      const pluscWoDs = app.findDatasource("pluscWoDs");
      const origSaveData = controller.saveData;
      const mockSaveData = jest.fn();
      await pluscWoDs.loadAndWaitForChildren({ src: testDatasheetData });

      const pluscwodsinstrid = app.state.assetFunctionsDetailsDS.item.pluscwodsinstrid;
      app.state.pluscwodsinstrid = pluscwodsinstrid;
      controller.saveData = mockSaveData;
      const pointToUpdate = app.state.assetFunctionsDetailsDS.item['pluscwodspoint'][0];
      pointToUpdate.asfoundinput = '100.00';
      pointToUpdate.asfoundoutput = '4.00';
      expect(pointToUpdate.asleftinput).toEqual(undefined);
      expect(pointToUpdate.asleftoutput).toEqual(undefined);
      
      const event = {
        datasource: pluscWoDs,
        item: pluscWoDs.item
      };
      await controller.copyCalibrationPoints(event);

      expect(pointToUpdate.asleftinput).toEqual(pointToUpdate.asfoundinput);
      expect(pointToUpdate.asleftoutput).toEqual(pointToUpdate.asfoundoutput);
  
      controller.saveData = origSaveData;
    });
  });

  describe("saveData", () => {
    it("Should save data", async () => {
      // Arrange
      const app = await baseSetup();
      app.state.selectedAssetFunctionsIndex = 0;
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];
      const ds = app.findDatasource("pluscWoDs");
      await ds.loadAndWaitForChildren();
      const assetfunctionDS = app.state.assetFunctionsDetailsDS;

      const origSave = assetfunctionDS.save;
      assetfunctionDS.save = jest.fn();

     // Act
      await controller.saveData();
  
      // Assert
      expect(assetfunctionDS.save).toHaveBeenCalled();

      assetfunctionDS.save = origSave;
    });
  });


  // Test to check if the copyValuesToAsLeft() method works correctly
  describe("copyValuesToAsLeft", () => {
    it("Should copy calibration point values", async () => {
      //Check if the correct values are being copied from the current item to the left side of the table

      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];
      let pluscWoDs = app.findDatasource("pluscWoDs");
      await pluscWoDs.load();

      const event = {
        currentitem: {
          calpoint: true,
          noadjmade: true,
          pluscwodspoint: [
            {
              asfoundinput: "1",
              asfoundoutput: "2",
            },
          ],
        },
      };

      await controller.copyValuesToAsLeft(event);
      expect(event.currentitem.pluscwodspoint[0]).toEqual({
        asleftinput: "1",
        asleftoutput: "2",
        asfoundinput: "1",
        asfoundoutput: "2",
      });
    });

    it("Should copy calibration DISCRETE values", async () => {
      //Check if the correct values are being copied from the current item to the left side of the table

      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];
      let pluscWoDs = app.findDatasource("pluscWoDs");
      await pluscWoDs.load();

      const event = {
        currentitem: {
          calpoint: true,
          noadjmade: true,
          pluscwodspoint: [
            {
              asfoundsetpoint: "0.01",
            },
          ],
        },
      };

      await controller.copyValuesToAsLeft(event);
      expect(event.currentitem.pluscwodspoint[0]).toEqual({
        asleftsetpoint: "0.01",
        asfoundsetpoint: "0.01",
      });
    });
  });

  describe("getAutoUpdate", () => {
    it("shouldBeTrueWhenPluscautostatusIsEnabled", async () => {
      // Arrange
      CommonUtil.filterMobileMaxvars.mockImplementation(() => ([{ varvalue: "1" }]));

      // Act
      const isAutoUpdateStatus = CalibrationHelper.getAutoUpdate();
      
      // Assert
      expect(isAutoUpdateStatus).toEqual(true);
      expect(CommonUtil.filterMobileMaxvars).toHaveBeenCalledWith(DatasheetConstants.PLUSCAUTOSTATUS, { "items": [{ "mobilemaxvars": [] }] });
    });

    it("shouldBeFalseWhenPluscautostatusIsDisabled", async () => {
      // Arrange
      CommonUtil.filterMobileMaxvars.mockImplementation(() => ([{ varvalue: "0" }]));

      // Act
      const isAutoUpdateStatus = CalibrationHelper.getAutoUpdate();

      // Assert
      expect(isAutoUpdateStatus).toEqual(false);
    });

    it("shouldBeFalseWhenPluscautostatusDoesNotExist", async () => {
      // Arrange
      CommonUtil.filterMobileMaxvars.mockImplementation(() => null);

      // Act
      const isAutoUpdateStatus = CalibrationHelper.getAutoUpdate();
      
      // Assert
      expect(isAutoUpdateStatus).toEqual(true);
      expect(CommonUtil.filterMobileMaxvars).toHaveBeenCalledWith(DatasheetConstants.PLUSCAUTOSTATUS, { "items": [{ "mobilemaxvars": [] }] });
    });
  });

  describe("openChangeStatusDialog", () => {
    it("shouldDisplayDialogWithAllStatusWhenAutoUpdateIsFalse", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      CalibrationHelper.getAutoUpdate = jest.fn(() => false);

      controller.page.showDialog = jest.fn();

      // Act
      await controller.openChangeStatusDialog({
        condition: CalibrationPointConstants.CONDITION_ASFOUND,
        item: {
          asfoundcalstatus: DatasheetConstants.STATUS_PASS
        }
      });
      
      // Assert
      expect(mockShowAllStatus).toHaveBeenCalled();
      expect(controller.page.showDialog).toHaveBeenCalled();
      expect(controller.page.showDialog.mock.calls[0][0]).toEqual("assetFunctionStatusDialog");
    });

    it("shouldDoNothingWhenAutoUpdateIsTrueAndStatusNeitherMissingOrBroken", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      CalibrationHelper.getAutoUpdate = jest.fn(() => true);

      controller.page.showDialog = jest.fn();
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      // Act
      [
        DatasheetConstants.STATUS_ACTION,
        DatasheetConstants.STATUS_ADJREQD,
        DatasheetConstants.STATUS_ADJTOIMP,
        DatasheetConstants.STATUS_FAIL,
        DatasheetConstants.STATUS_INSPECT,
        DatasheetConstants.STATUS_LIMITEDUSE,
        DatasheetConstants.STATUS_OLIM,
        DatasheetConstants.STATUS_PASS,
        DatasheetConstants.STATUS_WARNING,
      ].forEach(async (status) => {

        await controller.openChangeStatusDialog({
          condition: CalibrationPointConstants.CONDITION_ASFOUND,
          item: {
            asfoundcalstatus: status,
          },
        });

        // Assert
        expect(mockShowAllStatus).not.toHaveBeenCalled();
        expect(controller.page.showDialog).not.toHaveBeenCalled();
      });
    });

    it("shouldDisplayDialogWithFilteredStatusWhenAutoUpdateIsTrueAndStatusMissingOrBroken", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      CalibrationHelper.getAutoUpdate = jest.fn(() => true);

      controller.page.showDialog = jest.fn();
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      // Act
      [
        DatasheetConstants.STATUS_MISSING,
        DatasheetConstants.STATUS_BROKEN,
      ].forEach(async (status) => {

        await controller.openChangeStatusDialog({
          condition: CalibrationPointConstants.CONDITION_ASFOUND,
          item: {
            asfoundcalstatus: status,
          },
        });

        // Assert
        expect(mockShowFilteredStatus).toHaveBeenCalled();
        expect(controller.page.showDialog).toHaveBeenCalled();
        expect(controller.page.showDialog.mock.calls[0][0]).toEqual("assetFunctionStatusDialog");
      });
    });
  });

  describe("changeAssetFunctionStatus", () => {
    it("shouldSaveDatasheetWhenAssetFunctionStatusChanges", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      const saveMockFn = jest.fn();
      const closeDialogMockFn = jest.fn();
      const pluscwodsinstrid = generateRandomInt();

      controller.page.state.condition = CalibrationPointConstants.CONDITION_ASFOUND;

      controller.page.state.assetfunction = {
        pluscwodsinstrid,
        asfoundcalstatus: DatasheetConstants.STATUS_PASS
      };

      controller.page.findDialog = jest.fn(() => ({
        closeDialog: closeDialogMockFn
      }));

      controller.getDatasheetDS = jest.fn(() => ({
        save: saveMockFn,
        currentItem: {
          pluscwodsinstr: [
            // Adding few dummy asset functions
            {
              pluscwodsinstrid: pluscwodsinstrid - 1
            },
            {
              pluscwodsinstrid,
              asfoundcalstatus: DatasheetConstants.STATUS_PASS
            },
            {
              pluscwodsinstrid: pluscwodsinstrid + 1,
            }
          ]
        }
      }));

      // Act
      await controller.changeAssetFunctionStatus({
        value: DatasheetConstants.STATUS_BROKEN
      });
      
      // Assert
      expect(saveMockFn).toHaveBeenCalled();
      expect(controller.page.state.assetfunction.asfoundcalstatus).toEqual(DatasheetConstants.STATUS_BROKEN);
      expect(closeDialogMockFn).toHaveBeenCalled();
    });

    it("shouldNotSaveDatasheetWhenAssetFunctionIsNotFound", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      const saveMockFn = jest.fn();
      const closeDialogMockFn = jest.fn();
      const pluscwodsinstrid = generateRandomInt();

      controller.page.state.condition = CalibrationPointConstants.CONDITION_ASFOUND;

      controller.page.state.assetfunction = {
        pluscwodsinstrid,
        asfoundcalstatus: DatasheetConstants.STATUS_PASS
      };

      controller.page.findDialog = jest.fn(() => ({
        closeDialog: closeDialogMockFn
      }));

      controller.getDatasheetDS = jest.fn(() => ({
        save: saveMockFn,
        currentItem: {
          pluscwodsinstr: [
            // Adding few dummy asset functions
            {
              pluscwodsinstrid: pluscwodsinstrid - 1
            },
            {
              pluscwodsinstrid: pluscwodsinstrid + 1,
            }
          ]
        }
      }));

      // Act
      await controller.changeAssetFunctionStatus({
        value: DatasheetConstants.STATUS_BROKEN
      });
      
      // Assert
      expect(saveMockFn).not.toHaveBeenCalled();
      expect(controller.page.state.assetfunction.asfoundcalstatus).toEqual(DatasheetConstants.STATUS_BROKEN);
      expect(closeDialogMockFn).toHaveBeenCalled();
    });

    it("shouldResetStatusWhenResetStatusHasBeenCalled", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      const saveMockFn = jest.fn();
      const closeDialogMockFn = jest.fn();
      const pluscwodsinstrid = generateRandomInt();

      controller.page.state.condition = CalibrationPointConstants.CONDITION_ASFOUND;

      controller.page.state.assetfunction = {
        pluscwodsinstrid,
        asfoundcalstatus: DatasheetConstants.STATUS_PASS
      };

      controller.page.findDialog = jest.fn(() => ({
        closeDialog: closeDialogMockFn
      }));

      controller.getDatasheetDS = jest.fn(() => ({
        save: saveMockFn,
        currentItem: {
          pluscwodsinstr: [
            // Adding few dummy asset functions
            {
              pluscwodsinstrid: pluscwodsinstrid - 1
            },
            {
              pluscwodsinstrid,
              asfoundcalstatus: DatasheetConstants.STATUS_PASS
            },
            {
              pluscwodsinstrid: pluscwodsinstrid + 1,
            }
          ]
        }
      }));

      // Act
      await controller.resetAssetFunctionStatus({});
      
      // Assert
      expect(saveMockFn).toHaveBeenCalled();
      expect(controller.page.state.assetfunction.asfoundcalstatus).toEqual(DatasheetConstants.STATUS_EMPTY);
      expect(closeDialogMockFn).toHaveBeenCalled();
    });

  });

  describe("returnInternalStatusValue", () => {
    it("Should return internal status value for a cal status", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      // Act
      const resolveStatus = controller.returnInternalStatusValue(
        DatasheetConstants.STATUS_BROKEN
      );

      // Assert
      expect(resolveStatus).toEqual(DatasheetConstants.STATUS_BROKEN);
      expect(SynonymDomain.resolveToInternal).toHaveBeenCalled();
    });
  });

  describe("getLabelColorForInternalStatusValue", () => {
    it("Should return green color label when cal status is 'PASS'", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];
      controller.returnInternalStatusValue = jest.fn((status) => status);

      // Act
      const labelColor = controller.getLabelColorForInternalStatusValue(
        DatasheetConstants.STATUS_PASS
      );

      // Assert
      expect(labelColor).toEqual("green");
      expect(controller.returnInternalStatusValue).toHaveBeenCalled();
    });

    it("Should return red color label when cal status is 'FAIL'", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];
      controller.returnInternalStatusValue = jest.fn((status) => status);

      // Act
      const labelColor = controller.getLabelColorForInternalStatusValue(
        DatasheetConstants.STATUS_FAIL
      );

      // Assert
      expect(labelColor).toEqual("red");
      expect(controller.returnInternalStatusValue).toHaveBeenCalled();
    });

    it("Should return gray label when datasheet cal is other than 'PASS' or 'FAIL'", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];
      controller.returnInternalStatusValue = jest.fn((status) => status);

      // Act
      const labelColor = controller.getLabelColorForInternalStatusValue(
        DatasheetConstants.STATUS_ADJREQD
      );

      // Assert
      expect(labelColor).toEqual("gray");
      expect(controller.returnInternalStatusValue).toHaveBeenCalled();
    });
  });
  describe("getPrecision Methods", () => {
    it("Should return input precision for instrcal and ron1 fields", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      controller.getAssetFunctionDS = jest.fn().mockReturnValue({
        item: {
          inputprecision: 2,
          outputprecision: 4,
          inputrange: false,
          outputrange: false,
        },
      });

      // Act
      const result1 = controller.getPrecision("instrcalfrom");
      const result2 = controller.getPrecision("ron1max");

      // Assert
      expect(result1).toBe(2);
      expect(result2).toBe(2);
    });

    it("Should return input precision when tol/gb and inputrange is true", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      controller.getAssetFunctionDS = jest.fn().mockReturnValue({
        item: {
          inputprecision: 3,
          outputprecision: 6,
          inputrange: true,
          outputrange: false,
        },
      });

      // Act
      const result = controller.getPrecision("tolupper");

      // Assert
      expect(result).toBe(3);
    });

    it("Should return output precision when tol/gb and outputrange is true", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      controller.getAssetFunctionDS = jest.fn().mockReturnValue({
        item: {
          inputprecision: 2,
          outputprecision: 5,
          inputrange: false,
          outputrange: true,
        },
      });

      // Act
      const result = controller.getPrecision("gbtolerance");

      // Assert
      expect(result).toBe(5);
    });

    it("Should return output precision by default", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("assetfunctions");
      const controller = page.controllers[0];

      controller.getAssetFunctionDS = jest.fn().mockReturnValue({
        item: {
          inputprecision: 2,
          outputprecision: 5,
        },
      });

      // Act
      const result = controller.getPrecision("unknownField");

      // Assert
      expect(result).toBe(5);
    });
  });

  describe('getLocaleNumber', () => {

  it('Should return correct localized number using getLocaleNumber for locale pt-BR', async () => {
    const app = await baseSetup();
    const page = app.findPage("assetfunctions");
    const controller = page.controllers[0];

    const itemValue = '12345.678';
    const whichfieldtype = 'instrcalfrom';

    controller.getAssetFunctionDS = jest.fn().mockReturnValue({
      item: {
        inputprecision: 3,
        outputprecision: 5,
        inputrange: false,
        outputrange: false,
      }
    });
    const value = fromDisplayableValue(itemValue,
        { places: 3 },
        'pt-BR'
      );

    controller.getLocale = jest.fn().mockReturnValue('pt-BR');

    const result = controller.getLocaleNumber(value, whichfieldtype);

    expect(result).toEqual('12345,678');
  });

  it('Should return correct localized number using getLocaleNumber for locale de-DE', async () => {
    const app = await baseSetup();
    const page = app.findPage("assetfunctions");
    const controller = page.controllers[0];

    const itemValue = '98765.4321';
    const whichfieldtype = 'outputvalue';

    controller.getAssetFunctionDS = jest.fn().mockReturnValue({
      item: {
        inputprecision: 2,
        outputprecision: 4,
        inputrange: false,
        outputrange: false,
      }
    });

    const value = fromDisplayableValue(itemValue,
        { places: 4 },
        'de-DE'
      );

    controller.getLocale = jest.fn().mockReturnValue('de-DE');

    const result = controller.getLocaleNumber(value, whichfieldtype);

    expect(result).toEqual('98765,4321');
  });
});

  /* -------------------------------------------------------------------------- */
  /*                         Generators                                         */
  /* -------------------------------------------------------------------------- */

  const loadAssetFunctionDS = async (pluscWoDs) =>
    await pluscWoDs.getChildDatasource("pluscwodsinstr", pluscWoDs.currentItem);

  const loadCalpointsDS = async (pluscWoDs) => ({
    name: "calpointstest",
    items: testCalpointsData.member,
  });
  const loadDomainCalStatusDS = async () => ({
    name: "domaincalstatustest",
    items: [],
  });

});
