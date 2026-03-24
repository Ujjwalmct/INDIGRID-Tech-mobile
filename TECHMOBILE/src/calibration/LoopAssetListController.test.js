import DatasheetConstants from "./rules/constants/DatasheetConstants.js";
import {  waitUtils } from "@maximo/maximo-js-api";
import datasheetTestData from "./test/test-datasheet-data.js";
import dsLoop from "./test/test-dsLoop-data.js";
import synonymdomainData from "./test/test-synonymdomain.js";
import SynonymDomain from "./rules/models/SynonymDomain.js";

import newTestStub from "../test/AppTestStub.jsx";
// eslint-disable-next-line
vi.mock("../utils/CommonUtil.js");
// eslint-disable-next-line
vi.mock("./rules/models/SynonymDomain.js");

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

const baseSetup = async () => {
  return newTestStub({
    currentPage: "loopassetlist",
    onNewState: (state) => {
      return { ...state, dataSheethref: dsLoop.href }
    },
    datasources: {
      pluscWoDs: {
        data: datasheetTestData,
      },
      synonymdomainData: {
        data: synonymdomainData,
      },
      dsLoop: {
        data: dsLoop,
      }
    },
  })();
};

const mockShowAllStatus = jest.fn();
const mockShowFilteredStatus = jest.fn();


describe("LoopAssetListController", () => {
  describe("loadWoList", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it("should load datasheets successfully and page loading should be false at the end.", async () => {
      //Arrange
      const app = await baseSetup();
      const page = app.findPage("loopassetlist");
      // const ds = app.findDatasource("dsLoop");

      const controller = page.controllers[0];
      controller.calculateStatus = jest.fn();

      //Act
      await controller.loadWoList(app,page);

      //Assert
      expect(page.state.loading).toBe(false);
      expect(controller.calculateStatus).toHaveBeenCalled();
    });

    it("should raise an error while loading assetfunction and page loading should be true at the end.", async () => {
      //Arrange
      const app = await baseSetup();
      const page = app.findPage("loopassetlist");

      const controller = page.controllers[0];
      controller.loadWoList = jest
        .fn()
        .mockRejectedValue(
          new Error("Error occured during assetfunction loading.")
        );
      expect(page.state.loading).toBe(true);
    });

    it.skip("should filter items from datasource correctly", async () => {
      //TODO
      //Arrange
      const app = await baseSetup();
      await waitUtils.wait(1000);
      const page = app.findPage("loopassetlist");
      page.params.location= "LOOP1";

      const controller = page.controllers[0];
      controller.calculateStatus = jest.fn();
      // const ds = app.findDatasource("dsLoop");


      //Act
      await controller.loadWoList(app,page);

      //Assert
    });


  });
  describe("resetStatus", () => {
    it("all items should have a completed count of 0 ", async () => {
      const app = await baseSetup();
      const page = app.findPage("loopassetlist");

      const controller = page.controllers[0];
      const item = {
        name: "item 1",
        pluscwods: [{
          asfoundcalstatus: DatasheetConstants.STATUS_FAIL,
          asleftcalstatus: DatasheetConstants.STATUS_PASS,
          assetnum: "CAL101"
        },{
          asfoundcalstatus: DatasheetConstants.STATUS_ADJREQD,
          asleftcalstatus: DatasheetConstants.STATUS_ADJTOIMP,
          assetnum: "CAL100"
        }],
        completedwodscount: 1,
      };

      controller.resetStatus(item);
      expect(item.pluscwods[0].completedwodscount).toBe(0);
      expect(item.pluscwods[1].completedwodscount).toBe(0);
    });
  })
  describe("calculateStatus", () => {
    it(" should update any numbers when status is not EMPTY  ", async () => {
      const app = await baseSetup();
      const page = app.findPage("loopassetlist");

      const controller = page.controllers[0];
      const item = {
        name: "item 1",
        completedwodscount: 1,
        pluscwods: [{
          asfoundcalstatus: DatasheetConstants.STATUS_ADJREQD,
          asleftcalstatus: DatasheetConstants.STATUS_ADJTOIMP,
          assetnum: "CAL100"
        }],
      };
      const result = controller.calculateStatus(item);

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBe(1);

    const assetMap = result[0];
    expect(assetMap.assetnum).toBe("CAL100");
    expect(assetMap.totalwodscount).toBe(1);
    expect(assetMap.completedwodscount).toBe(1);
    });
    it(" should call reset status in calculate status  ", async () => {
      const app = await baseSetup();
      const page = app.findPage("loopassetlist");

      const controller = page.controllers[0];
      const item = {
        name: "item 1",
        completedwodscount: 1,
        pluscwods: [{
          asfoundcalstatus: DatasheetConstants.STATUS_FAIL,
          asleftcalstatus: DatasheetConstants.STATUS_FAIL,
          assetnum: "CAL100"
        },{
          asfoundcalstatus: DatasheetConstants.STATUS_FAIL,
          asleftcalstatus: DatasheetConstants.STATUS_FAIL,
          assetnum: "CAL100"
        }],
      };
      
      controller.resetStatus = jest.fn();
      controller.calculateStatus(item);
      expect(controller.resetStatus).toHaveBeenCalled();
    });

    it(" should update count when pass/fail status is found  ", async () => {
      const app = await baseSetup();
      const page = app.findPage("loopassetlist");

      const controller = page.controllers[0];
      const item = {
        name: "item 1",
        completedwodscount: 0,
        pluscwods: [{
          asfoundcalstatus: DatasheetConstants.STATUS_PASS,
          asleftcalstatus: DatasheetConstants.STATUS_PASS,
          assetnum: "CAL100"
        },{
          asfoundcalstatus: DatasheetConstants.STATUS_FAIL,
          asleftcalstatus: DatasheetConstants.STATUS_PASS,
          assetnum: "CAL100"
        }],
      };
      
      const result = controller.calculateStatus(item);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
  
      const assetMap = result[0];
      expect(assetMap.assetnum).toBe("CAL100");
      expect(assetMap.totalwodscount).toBe(2);
      expect(assetMap.completedwodscount).toBe(2);
    });
    it(" should not update count when EMPTY status is found  ", async () => {
      const app = await baseSetup();
      const page = app.findPage("loopassetlist");

      const controller = page.controllers[0];
      const item = {
        name: "item 1",
        completedwodscount: 1,
        pluscwods: [{
          asfoundcalstatus: DatasheetConstants.STATUS_EMPTY,
          asleftcalstatus: DatasheetConstants.STATUS_EMPTY,
          assetnum: "CAL100"
        },{
          asfoundcalstatus: DatasheetConstants.STATUS_FAIL,
          asleftcalstatus: DatasheetConstants.STATUS_PASS,
          assetnum: "CAL100"
        }],
      };

      const result = controller.calculateStatus(item);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
  
      const assetMap = result[0];
      expect(assetMap.assetnum).toBe("CAL100");
      expect(assetMap.totalwodscount).toBe(2);
      expect(assetMap.completedwodscount).toBe(1);
    });
  })
  describe("goBack", () => {
    it("should go back to the right page ", async () => {
      const app = await baseSetup();
      const page = app.findPage("loopassetlist");
      app.state.datasheetWonum = "123";
      app.state.dataSheethref = "456";
      app.state.datasheetSiteid = "789";

      const controller = page.controllers[0];
      controller.goBack();
      expect(app.currentPage.name).toBe("workOrderDetails");
      expect(app.currentPage.params.wonum).toBe("123");
      expect(app.currentPage.params.href).toBe("456");
      expect(app.currentPage.params.siteid).toBe("789");
    });
  })
  describe("navigateToCalibrationFromAssetList", () => {
    it("should not changes pages if item.wonum does not exist ", async () => {
      const app = await baseSetup();
      const page = app.findPage("loopassetlist");
      const item = {
        href : "1",
        assetnum : null,
        iscalibration : false,
        assetdesc : "asset description",
        locationnum : null,
        locationdesc : "location description",
        wonum : null,
        siteid : "3",
        pluscloop : true
      };

      const controller = page.controllers[0];
      controller.navigateToCalibrationFromAssetList(item);
      expect(app.state.datasheetName).toBe("");
      expect(app.currentPage.name).toBe("loopassetlist");
    });
    it("should not navigate to datasheets page for calibration loop wo with no assetnum ", async () => {
      const app = await baseSetup();
      const page = app.findPage("loopassetlist");
      const item = {
        href : "1",
        assetnum : null,
        iscalibration : true,
        assetdesc : "asset description",
        locationnum : "789",
        locationdesc : "location description",
        wonum : "2",
        siteid : "3",
        pluscloop : true
      };

      const controller = page.controllers[0];
      controller.navigateToCalibrationFromAssetList(item);
      expect(app.state.datasheetName).toBe("");
      expect(app.currentPage.name).toBe("loopassetlist");
    });
    it("should correctly navigate to datasheets page for non calibration loop wo with assetnum ", async () => {
      const app = await baseSetup();
      const page = app.findPage("loopassetlist");
      const item = {
        href : "1",
        assetnum : "123",
        iscalibration : false,
        assetdesc : "asset description",
        locationnum : "789",
        locationdesc : "location description",
        wonum : "2",
        siteid : "3",
        pluscloop : true
      };

      const controller = page.controllers[0];
      controller.navigateToCalibrationFromAssetList(item);
      expect(app.state.datasheetName).toBe("123 asset description");
      expect(app.currentPage.name).toBe("datasheets");
      expect(app.currentPage.params.location).toBe("789");
      expect(app.currentPage.params.isLoop).toBe(true);
    });
    it("should correctly navigate to datasheets page for calibration loop wo with assetnum ", async () => {
      const app = await baseSetup();
      const page = app.findPage("loopassetlist");
      const item = {
        assetnum : "123",
        iscalibration : true,
        assetdesc : "asset description",
        locationnum : "789",
        locationdesc : "location description",
        wonum : "2",
        siteid : "3",
        pluscloop : true
      };

      const controller = page.controllers[0];
      controller.navigateToCalibrationFromAssetList(item);
      expect(app.state.datasheetName).toBe("123 asset description");
      expect(app.currentPage.name).toBe("datasheets");
      expect(app.currentPage.params.location).toBe("789");
      expect(app.currentPage.params.isLoop).toBe(true);
    });
    it("should correctly navigate to datasheets page for calibration loop wo with assetnum and no asset desc ", async () => {
      const app = await baseSetup();
      const page = app.findPage("loopassetlist");
      const item = {
        href : "1",
        assetnum : "123",
        iscalibration : true,
        assetdesc : null,
        locationnum : "789",
        locationdesc : "location description",
        wonum : "2",
        siteid : "3",
        pluscloop : true
      };

      const controller = page.controllers[0];
      controller.navigateToCalibrationFromAssetList(item);
      expect(app.state.datasheetName).toBe("123 ");
      expect(app.currentPage.name).toBe("datasheets");
      expect(app.currentPage.params.location).toBe("789");
      expect(app.currentPage.params.isLoop).toBe(true);
    });
  })
  describe("isValidStatus", () => {
    it("Check if status to be considered for count- EMPTY ", async () => {
        //Arrange
        const app = await baseSetup();
        const page = app.findPage("loopassetlist");

        const controller = page.controllers[0];
        expect(controller.isValidStatus(DatasheetConstants.STATUS_EMPTY)).toBe(false);
    });
    it("Check if status to be considered for count- PASS ", async () => {
      //Arrange
      const app = await baseSetup();
      const page = app.findPage("loopassetlist");

      const controller = page.controllers[0];
      expect(controller.isValidStatus(DatasheetConstants.STATUS_PASS)).toBe(true);
    });
    it("Check if status to be considered for count- FAIL ", async () => {
      //Arrange
      const app = await baseSetup();
      const page = app.findPage("loopassetlist");

      const controller = page.controllers[0];
      expect(controller.isValidStatus(DatasheetConstants.STATUS_FAIL)).toBe(true);
    });
  })
});
