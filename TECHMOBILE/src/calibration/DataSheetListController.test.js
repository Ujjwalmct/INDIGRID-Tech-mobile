import DataSheetListController from "./DataSheetListController.js";
import DatasheetConstants from "./rules/constants/DatasheetConstants.js";
import { Page, waitUtils } from "@maximo/maximo-js-api";
import datasheetTestData from "./test/test-datasheet-data.js";
import synonymdomainData from "./test/test-synonymdomain.js";
import SynonymDomain from "./rules/models/SynonymDomain.js";

import newTestStub from "../test/AppTestStub.jsx";
import CommonUtil from "../utils/CommonUtil.js";
import CalibrationHelper from "./utils/CalibrationHelper.js";
// eslint-disable-next-line
vi.mock("../utils/CommonUtil.js");
// eslint-disable-next-line
vi.mock("./rules/models/SynonymDomain.js");

const baseSetup = async () => {
  return newTestStub({
    currentPage: "datasheets",
    onNewState: (state) => {
      return { ...state, dataSheethref: datasheetTestData.href }
    },
    datasources: {
      pluscWoDs: {
        data: datasheetTestData,
      },
      synonymdomainData: {
        data: synonymdomainData,
      },
    },
  })();
};

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
    showFilteredStatus: mockShowFilteredStatus,
  }));
});

describe("DataSheetListController", () => {
  it("Page initilized", async () => {
    const app = await baseSetup();
    const ds = app.findDatasource("pluscWoDs");

    await ds.load();
    expect(ds.state.hasData).toBe(true);
  });

  it("Page resumed", async () => {
    // Arrange
    const app = await baseSetup();
    const page = app.currentPage;
    app.state.datasheetName = "CAL102 Calibration 102";

    const ds = app.findDatasource("pluscWoDs");
    await ds.load();

    // Act
    page.controllers[0].pageResumed(app.currentPage, app);

    // Assert
    expect(app.state.dataSheetTitle).toEqual("CAL102 Calibration 102");
    expect(page.state.autoupdate).toEqual(true);
  });

  it("Should force reload datasource when coming from workorder detail page", async () => {
    // Arrange
    const app = await baseSetup();
    const page = app.currentPage;
    app.lastPage = {
      name: 'workOrderDetails'
    };

    const ds = app.findDatasource("pluscWoDs");
    const origForceReload = ds.forceReloadAndWaitForChildren;
    const mockForceReload = jest.fn();
	  ds.forceReloadAndWaitForChildren = mockForceReload;

    // Act
    await page.controllers[0].loadWoDetailCalibration(app, app.currentPage);

    // Assert
    expect(mockForceReload).toHaveBeenCalled();

    ds.forceReloadAndWaitForChildren = origForceReload;
  });

  it("Should load datasource when coming from assetfunctions page", async () => {
    // Arrange
    const app = await baseSetup();
    const page = app.currentPage;
    app.lastPage = {
      name: 'assetfunctions'
    };

    const ds = app.findDatasource("pluscWoDs");
    const origLoad = ds.loadAndWaitForChildren;
    const mockLoad = jest.fn();
	  ds.loadAndWaitForChildren = mockLoad;

    // Act
    await page.controllers[0].loadWoDetailCalibration(app, app.currentPage);

    // Assert
    expect(mockLoad).toHaveBeenCalled();

    ds.loadAndWaitForChildren = origLoad;
  });

  it("Should send user back to last visited page", async () => {
    const controller = new DataSheetListController();
    let app = await baseSetup();

    const page = new Page({ name: "Mob Calibration" });
    app.registerPage(page);

    let pageSetter = jest.fn();

    app.registerController(controller);

    const originalSetter = app.setCurrentPage;
    app.setCurrentPage = pageSetter;

    controller.pageInitialized(page, app);

    controller.goBack();

    expect(pageSetter.mock.calls.length).toEqual(1);

    app.setCurrentPage = originalSetter;
  });

  describe("getAutoUpdate", () => {
    it("should evaluate isAutoUpdateStatus to true if PLUSCAUTOSTATUS is enabled", async () => {
      //Arrange
      CommonUtil.filterMobileMaxvars.mockImplementation(() => [
        { varvalue: "1" },
      ]);
      //Act
      const isAutoUpdateStatus = CalibrationHelper.getAutoUpdate();
      //Assert
      expect(isAutoUpdateStatus).toEqual(true);
      expect(CommonUtil.filterMobileMaxvars).toHaveBeenCalledWith(
        DatasheetConstants.PLUSCAUTOSTATUS,
        { items: [{ mobilemaxvars: [] }] }
      );
    });

    it("should evaluate isAutoUpdateStatus to false if PLUSCAUTOSTATUS is disabled", async () => {
      //Arrange
      CommonUtil.filterMobileMaxvars.mockImplementation(() => [
        { varvalue: "0" },
      ]);

      //Act
      const isAutoUpdateStatus = CalibrationHelper.getAutoUpdate();

      //Assert
      expect(isAutoUpdateStatus).toEqual(false);
    });
  });

  describe("openAssetFunctions", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it("should load datasheets successfully and page loading should be false at the end.", async () => {
      //Arrange
      const app = await baseSetup();
      const page = app.findPage("datasheets");
      const ds = app.findDatasource("pluscWoDs");

      const controller = page.controllers[0];
      controller.loadAssetFunctionsDS = jest.fn();

      const context = { page, app, item: { pluscwodsid: 88 } };
      await ds.load({ qbe: { pluscwodsid: 88 } });

      //Act
      await controller.openAssetFunctions(context);

      //Assert
      expect(ds.currentItem.wodsnum).toEqual(1081);
      expect(controller.loadAssetFunctionsDS).toHaveBeenCalledWith(context, ds);
      expect(ds.items.length).toEqual(1);
      expect(page.state.loading).toBe(false);
    });

    it("should raise an error while loading assetfunction and page loading should be true at the end.", async () => {
      //Arrange
      const app = await baseSetup();
      const page = app.findPage("datasheets");

      const controller = page.controllers[0];
      controller.loadAssetFunctionsDS = jest
        .fn()
        .mockRejectedValue(
          new Error("Error occured during assetfunction loading.")
        );

      const context = { page, app, item: { pluscwodsid: 88 } };
      //Act Assert
      await expect(controller.openAssetFunctions(context)).rejects.toThrow(
        "Error occured during assetfunction loading."
      );
      expect(page.state.loading).toBe(true);
    });

    it("should load assetfunctions from datasheet datasource and sets it into app state.", async () => {
      //Arrange
      const app = await baseSetup();
      await waitUtils.wait(1000);
      const page = app.findPage("datasheets");
      const ds = app.findDatasource("pluscWoDs");
      await ds.load({ qbe: { pluscwodsid: 88 } });
      await ds.waitForChildrenToLoad();

      const controller = page.controllers[0];
      const context = { page, app, item: ds.item };

      //Act
      await controller.loadAssetFunctionsDS(context, ds);

      //Assert
      expect(app.currentPage.name).toEqual("assetfunctions");
      expect(app.state.assetFunctionsDetailsDS?.items?.length).toEqual(3);
    });

    it("should not load assetfunctions from datasheet which does not have any assetfunctions.", async () => {
      //Arrange
      const app = await baseSetup();
      await waitUtils.wait(1000);
      const page = app.findPage("datasheets");
      const ds = app.findDatasource("pluscWoDs");
      await ds.load();
      await ds.waitForChildrenToLoad();

      const controller = page.controllers[0];
      const context = { page, app, item: { pluscwodsid: 888 } };

      app.state.assetFunctionsDetailsDS = {}

      //Act
      await controller.loadAssetFunctionsDS(context, ds);

      //Assert
      expect(app.currentPage.name).not.toEqual("assetfunctions");
      expect(app.state.assetFunctionsDetailsDS.items).toBe(undefined);
    });
  });
  describe("openChangeStatus", () => {
    it("should open dataSheetStatusDialog if autoupdate is false.", async () => {
      //Arrange
      const app = await baseSetup();
      const page = app.findPage("datasheets");
      page.showDialog = jest.fn();
      const controller = page.controllers[0];
      CalibrationHelper.getAutoUpdate = jest.fn().mockReturnValue(false);
      const datasheet = { asfoundcalstatus: "MISSING" };
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      const event = {
        app,
        page,
        item: datasheet,
        changeText: "asfoundcalstatus",
      };

      //Act
      await controller.openChangeStatus(event);

      //Assert
      expect(page.showDialog).toHaveBeenCalledWith("dataSheetStatusDialog");
      expect(page.state.changeText).toEqual("asfoundcalstatus");
      expect(page.state.currentItem).toEqual(event.item);
      expect(mockShowAllStatus).toHaveBeenCalledTimes(1);
    });
    it("should open dataSheetStatusDialog if autoupdate is true.", async () => {
      //Arrange
      const app = await baseSetup();
      const page = app.findPage("datasheets");
      page.showDialog = jest.fn();
      const controller = page.controllers[0];
      CalibrationHelper.getAutoUpdate = jest.fn().mockReturnValue(true);
      const datasheet = { asfoundcalstatus: "MISSING" };
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      const event = {
        app,
        page,
        item: datasheet,
        changeText: "asfoundcalstatus",
      };

      //Act
      await controller.openChangeStatus(event);

      //Assert
      expect(page.showDialog).toHaveBeenCalledWith("dataSheetStatusDialog");
      expect(mockShowFilteredStatus).toHaveBeenCalledTimes(1);
    });
    it("should not open dataSheetStatusDialog if autoupdate is true and status is PASS.", async () => {
      //Arrange
      const app = await baseSetup();
      const page = app.findPage("datasheets");
      page.showDialog = jest.fn();
      const controller = page.controllers[0];
      CalibrationHelper.getAutoUpdate = jest.fn().mockReturnValue(true);
      const datasheet = { asfoundcalstatus: "PASS" };
      SynonymDomain.resolveToInternal = jest.fn(
        (domainCalStatusDs, dsStatus) => dsStatus
      );

      const event = {
        app,
        page,
        item: datasheet,
        changeText: "asfoundcalstatus",
      };

      //Act
      await controller.openChangeStatus(event);

      //Assert
      expect(page.showDialog).not.toHaveBeenCalledWith("dataSheetStatusDialog");
      expect(mockShowFilteredStatus).not.toHaveBeenCalled();
    });
  });
  describe("selectStatus", () => {
    it("should select status from list and update into datasource.", async () => {
      //Arrange
      const app = await baseSetup();
      const page = app.findPage("datasheets");
      const datasheetds = app.findDatasource("pluscWoDs");
      await datasheetds.load();
      page.state.currentItem = datasheetds.currentItem;
      page.state.changeText = "asfoundcalstatus";
      const controller = page.controllers[0];
      const selectedItem = { value: "MISSING", _selected: true };

      const pageDialog = page.findDialog("dataSheetStatusDialog");
      pageDialog.closeDialog = jest.fn();

      //Act
      await controller.selectStatus(selectedItem);

      //Assert
      expect(page.state.currentItem.asfoundcalstatus).toEqual("MISSING");
      expect(datasheetds.item.asfoundcalstatus).toEqual("MISSING");
      expect(pageDialog.closeDialog).toHaveBeenCalled();
    });

    it("should set selected status to empty if _selected is false.", async () => {
      //Arrange
      const app = await baseSetup();
      const page = app.findPage("datasheets");
      const datasheetds = app.findDatasource("pluscWoDs");
      await datasheetds.load();
      page.state.currentItem = datasheetds.currentItem;
      page.state.changeText = "asfoundcalstatus";
      const controller = page.controllers[0];
      controller.changeStatus = jest.fn();
      const selectedItem = { value: "MISSING", _selected: false };

      //Act
      await controller.selectStatus(selectedItem);

      //Assert
      expect(page.state.selectedStatus).toBeFalsy();
    });
    it("should not save datasource and should not close dialog.", async () => {
      const app = await baseSetup();
      const page = app.findPage("datasheets");
      page.findDialog = jest.fn().mockReturnValue(null);
      const controller = page.controllers[0];

      //Act
      await controller.changeStatus();

      //Assert
      expect(page.findDialog).toHaveBeenCalled();
    });
  });

  describe("returnInternalStatusValue", () => {
    it("Should return internal status value for a datasheet status", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("datasheets");
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
    it("Should return green color label when datasheet status is 'PASS'", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("datasheets");
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

    it("Should return red color label when datasheet status is 'FAIL'", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("datasheets");
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

    it("Should return gray label when datasheet status is other than 'PASS' or 'FAIL'", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("datasheets");
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
  describe("returnInternalStatusValue", () => {
    it("Should return internal status value for a datasheet status", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("datasheets");
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
    it("Should return green color label when datasheet status is 'PASS'", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("datasheets");
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

    it("Should return red color label when datasheet status is 'FAIL'", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("datasheets");
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

    it("Should return gray label when datasheet status is other than 'PASS' or 'FAIL'", async () => {
      // Arrange
      const app = await baseSetup();
      const page = app.findPage("datasheets");
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
});
