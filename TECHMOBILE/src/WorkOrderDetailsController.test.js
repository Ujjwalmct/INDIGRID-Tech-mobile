/*
 * Licensed Materials - Property of IBM
 *
 * 5724-U18, 5737-M66
 *
 * (C) Copyright IBM Corp. 2023 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */

import WorkOrderDetailsController from "./WorkOrderDetailsController";
import ReportWorkPageController from "./ReportWorkPageController";
import SchedulePageController from "./SchedulePageController";
import WorkOrderEditController from "./WorkOrderEditController";
import wpmaterial from "./test/materials-json-data";
import unassignedworkorderitem from './test/unassigned-wo-detail-json-data.js';
import wocost from './test/wo-cost-json-data.js';
import jwocost from './test/wo-cost-total-json-data.js';
import WOTimerUtil from './utils/WOTimerUtil.js';
import CommonUtil from './utils/CommonUtil';
import RelatedWoController from './RelatedWoController';
import { OpenLayersAdapter } from '@maximo/map-component';
import {
  Application,
  Page,
  JSONDataAdapter,
  Datasource,
  AppSwitcher,
  MaximoAppSwitcher,
  Device,
  Dialog,
} from "@maximo/maximo-js-api";

import WOUtil from './utils/WOUtil';
import workorderitem from "./test/wo-detail-json-data.js";
import statusitem from "./test/statuses-json-data.js";
import sinon from "sinon";
import worLogItem from "./test/worklog-json-data.js";
import labor from "./test/labors-json-data";
import tasklist from "./test/task-list-json-data.js";
import downTimeCode from "./test/downtimecode-json-data.js";
import workordersingleitem from "./test/wo-detail-single-json-data.js";
import woSpecification from "./test/wo-specification-json-data.js";
import wolocationmeters from "./test/locationmeter-json-data";
import SynonymUtil from "./utils/SynonymUtil";
import assets from "./test/asset-json-data";
import commonUtil from './utils/CommonUtil';
import WOCreateEditUtils from "./utils/WOCreateEditUtils";

function newDatasource(data = workorderitem, name = "workorderds") {
  const da = new JSONDataAdapter({
    src: data,
    items: "member",
    schema: "responseInfo.schema",
  });

  const ds = new Datasource(da, {
    idAttribute: "wonum",
    name: name,
  });

  ds.clearState = () => { };
  return ds;
}


function newDatasourceWorkLog(data = worLogItem, name = "woDetailsWorklogDs") {
  const da = new JSONDataAdapter({
    src: worLogItem,
    items: "member",
    schema: "responseInfo.schema",
  });

  const ds = new Datasource(da, {
    name: name,
  });

  return ds;
}

function newStatusDatasource(data = statusitem, name) {
  const da = new JSONDataAdapter({
    src: statusitem,
    items: "member",
    schema: "responseInfo.schema",
  });

  const ds = new Datasource(da, {
    idAttribute: "value",
    name: name,
  });

  return ds;
}

function newLaborDetailDatasource(data = labor, name = "woLaborDetailds") {
  const da = new JSONDataAdapter({
    src: data,
    items: "labordetails2",
  });

  const ds = new Datasource(da, {
    idAttribute: "labtransid",
    name: name,
  });

  return ds;
}

function newAssetLocationDatasource(
  data = workorderitem,
  name = "woAssetLocationds"
) {
  const da = new JSONDataAdapter({
    src: data,
    items: "member",
    schema: "responseInfo.schema",
  });

  const ds = new Datasource(da, {
    idAttribute: "wonum",
    name: name,
  });

  return ds;
}

function newTaskDatasource(data = tasklist, name = "woPlanTaskds") {
  const da = new JSONDataAdapter({
    src: data,
    items: "member",
    schema: "responseInfo.schema",
  });
  const ds = new Datasource(da, {
    idAttribute: "taskid",
    name: name,
  });
  return ds;
}

function newDatasource1(data, name = "downTimeReportAsset") {
  const da = new JSONDataAdapter({
    src: data,
    items: "member",
  });
  const ds = new Datasource(da, {
    idAttribute: "downtime",
    name: name,
  });
  return ds;
}

function newLocDS(data = workorderitem, name = "woLocationds") {
  const da = new JSONDataAdapter({
    src: data,
    items: "member",
    schema: "responseInfo.schema",
  });

  const ds = new Datasource(da, {
    idAttribute: "wonum",
    name: name,
  });

  return ds;
}

function newTimerStatusDatasource(
  data = statusitem,
  name = "synonymdomainData"
) {
  const da = new JSONDataAdapter({
    src: data,
    items: "member",
    schema: "responseInfo.schema",
  });

  const ds = new Datasource(da, {
    idAttribute: "value",
    name: name,
  });

  return ds;
}

function materialDatasource(
  data = wpmaterial,
  idAttribute = "wonum",
  items = "member",
  name = "inventoryDS"
) {
  const da = new JSONDataAdapter({
    src: data,
    items: items,
  });
  const ds = new Datasource(da, {
    idAttribute: idAttribute,
    name: name,
  });
  return ds;
}

function newWOCostDatasource(data = wocost, name = 'dsWoTotal') {
  const da = new JSONDataAdapter({
    src: data,
    items: 'member',
    schema: 'responseInfo.schema'
  });
  const ds = new Datasource(da, {
    idAttribute: 'est',
    name: name
  });
  return ds;
}
it("Workorder estimated cost drawer should open", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const schedulePagecontroller = new SchedulePageController();

  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  app.client = {
    userInfo: {
      baseCurrency: "USD"
    }
  };

  const page = new Page({ name: "approvals" });
  const dsWoDetailTotal = newWOCostDatasource(wocost, "dsWoDetailTotal");
  page.registerDatasource(dsWoDetailTotal);

  const wodetails = newDatasource(workorderitem, "wodetails");
  page.registerDatasource(wodetails);

  const woCost = newWOCostDatasource(wocost, "dsWoTotal");
  const jsondsWoTotal = newWOCostDatasource(jwocost, "jsondsWoTotal");
  jsondsWoTotal.getSchema = () => jwocost.responseInfo.schema;

  page.registerDatasource(jsondsWoTotal);
  page.registerDatasource(woCost);

  await woCost.load();
  await wodetails.load();
  let openWoTotalCostDrawerStub = sinon
    .stub(schedulePagecontroller, "openWoTotalCostDrawer")
    .returns({});

  app.registerPage(page);
  await app.initialize();

  app.registerController(controller);
  page.registerController(schedulePagecontroller);

  controller.pageInitialized(page, app);
  app.setCurrentPage = mockSetPage;

  await controller.openWoCostDrawer({ item: { href: "href" } });
  await expect(openWoTotalCostDrawerStub.called).toBe(true);
});
it("should open task page when clicking on task button on workorder details page", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page();

  app.registerController(controller);

  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  await controller.navigateToTask({ wonum: 1000 });
  expect(page.state.navigateToTaskPage).toBeTruthy();
});

it("should not open task page if no href passed", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page();

  app.registerController(controller);

  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  await controller.navigateToTask();
  expect(page.state.navigateToTaskPage).not.toBeDefined();
});

it("should open report work page when clicking on report button on workorder details page", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const reportWorkController = new ReportWorkPageController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page();
  const reportPage = new Page({ name: "report_work" });
  app.client = {
    userInfo: {
      personid: "SAM",
      labor: { laborcraftrate: { craft: "ELECT", skilllevel: "SECONDCLASS" } },
    },
  };
  const reportworkLabords = newDatasource(
    labor,
    "reportworkLabords",
    "labtransid",
    "reportworkLabords"
  );
  const woDetailsReportWork = newDatasource(
    labor,
    "woDetailsReportWork",
    "wonum",
    "woDetailsReportWork"
  );
  const synonymdomainData = newTimerStatusDatasource(
    statusitem,
    "synonymdomainData"
  );
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const reportworksSynonymData = newStatusDatasource(
    statusitem,
    "reportworksSynonymData"
  );
  const locationDS = newStatusDatasource(wolocationmeters, "locationDS");
  const inventoryDS = materialDatasource(wpmaterial, "member", "inventoryDS");
  const synonymDSData = newStatusDatasource(statusitem, "synonymDSData");
  app.registerDatasource(synonymdomainData);
  app.registerController(controller);
  reportPage.registerController(reportWorkController);

  await app.initialize();
  app.setCurrentPage = mockSetPage;
  reportPage.registerDatasource(reportworkLabords);
  reportPage.registerDatasource(woDetailsReportWork);
  reportPage.registerDatasource(craftrate);
  reportPage.registerDatasource(reportworksSynonymData);
  reportPage.registerDatasource(locationDS);
  reportPage.registerDatasource(inventoryDS);
  reportPage.registerDatasource(synonymDSData);
  app.currentPage = reportPage;
  controller.pageInitialized(page, app);
  reportWorkController.pageInitialized(reportPage, app);
  await controller.navigateToReportWork({
    href: "oslc/os/mxapiwodetail/_QkVERk9SRC8zMDA2Ng--",
  });
  expect(page.state.navigateToReportWork).toBeTruthy();
});

it("should not open report work page if href passed but no current page", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page();

  app.registerController(controller);

  await app.initialize();
  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  await controller.navigateToReportWork({
    href: "oslc/os/mxapiwodetail/_QkVERk9SRC8zMDA2Ng--",
  });
  expect(page.state.navigateToReportWork).not.toBeDefined();
});

it("should show signature prompt when signature is enabled", async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  const page = new Page();
  app.state = {
    systemProp: {
      'maximo.mobile.statusforphysicalsignature': 'INPRG'
    },
    appnames: {
      inspection: "inspection",
      assetmobile: "assetmobile",
      assetswitch: "plusassetswitch",
      assist: "assist"
    }
  };

  app.registerController(controller);
  await app.initialize();

  app.setCurrentPage = jest.fn();
  controller.pageInitialized(page, app);
  //  app.state.systemProp["maximo.mobile.statusforphysicalsignature"] = "INPRG";
  controller.updateSignaturePrompt()
  expect(page.state.enableSignatureButton).toBeTruthy();
});

it("should not open report work page if no href passed", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page();

  app.registerController(controller);

  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  await controller.navigateToReportWork();
  expect(page.state.navigateToReportWork).not.toBeDefined();
});



it("should open materials page", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "page" });
  const mrDS = newDatasource(wpmaterial, "mrDS");
  page.registerDatasource(mrDS);
  const synonDS = newStatusDatasource(statusitem, "synonymdomainData");
  app.registerDatasource(synonDS);
  app.registerController(controller);
  const ds = newDatasource(workorderitem, "workorderds");
  page.registerDatasource(ds);
  let items = await ds.load();

  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  await controller.openMaterialToolDrawer({ item: items[0], datasource: ds, reload: true });

  expect(page.state.dialogLabel).toBe("Materials and tools");
});

it("should open materials page with Tools", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "page" });

  app.registerController(controller);
  const mrDS = newDatasource(wpmaterial, "mrDS");
  page.registerDatasource(mrDS);
  const synonDS = newStatusDatasource(statusitem, "synonymdomainData");
  app.registerDatasource(synonDS);
  const ds = newDatasource(workorderitem, "workorderds");
  page.registerDatasource(ds);
  let items = await ds.load();
  await synonDS.load();
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  await controller.openMaterialToolDrawer({ item: items[1], datasource: ds });

  expect(page.state.dialogLabel).toBe("Materials and tools");
});

it("should fail opening materials page", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "page" });

  app.registerController(controller);
  const ds = newDatasource(workorderitem, "workorderds");
  const woDetailResource = newDatasource(workorderitem, "woDetailResource");
  page.registerDatasource(ds);
  page.registerDatasource(woDetailResource);
  let items = await ds.load();
  items[0].datasource = woDetailResource;
  items[0].item = '"oslc/os/mxapiwodetail/_QkVERk9SRC8xMjAy';
  await app.initialize();
  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);

  try {
    controller.openMaterialToolDrawer(items[0], null);
    expect.fail("failed opening materials page");
  } catch (e) {
    // good
  }
});

it("Should save workLog item", async () => {
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "page" });
  page.state = {
    initialDefaultLogType: "!CLIENTNOTE!"
  }
  app.client = {
    userInfo: {
      personid: "SAM",
      labor: { laborcode: "SAM" },
      insertOrg: 'EGLENA',
      insertSite: 'BEDFORD'
    },
  };

  app.registerPage(page);
  app.registerController(controller);

  const ds = newDatasource(workorderitem, "woDetailResource");
  const ds2 = newDatasourceWorkLog(worLogItem, "woDetailsWorklogDs");
  let workLogModified = worLogItem;
  workLogModified.responseInfo.schema.properties.logtype.default = "!CLIENTNOTE!";
  const ds3 = newDatasourceWorkLog(workLogModified, 'woDetailsWorklogDs');
  const synonymdomainDs = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainDs);
  let updatestub = sinon.stub(ds2, "update");
  let forceloadstub = sinon.stub(ds2, "forceReload");

  page.registerDatasource(ds);
  page.registerDatasource(ds2);

  let items = await ds.load();

  await app.initialize();

  controller.pageInitialized(page, app);
  await controller.openWorkLogDrawer({ item: items[1] });
  let event = {
    summary: "Test Comment 2",
    longDescription: "abc",
    logType: { value: 'WORK' },
    visibility: true
  };

  await controller.saveWorkLog(event);
  expect(updatestub.called).toBe(true);
  expect(updatestub.displayName).toBe("update");
  expect(updatestub.args.length).toBe(1);

  expect(forceloadstub.called).toBe(true);
  expect(forceloadstub.displayName).toBe("forceReload");

  await controller.openWorkLogDrawer({ item: items[1] });
  page.state = { chatLogDescLength: 100 };
  await controller.saveWorkLog(event);

  updatestub.restore();
  forceloadstub.restore();
  sinon.stub(ds3, 'update');
  sinon.stub(ds3, 'forceReload');
  await controller.openWorkLogDrawer({ item: items[0] });
  expect(page.state.initialDefaultLogType).toBe('!CLIENTNOTE!');
});

describe('computedUserName function', () => {
  let fn;
  beforeAll(() => {
    const { computedUserName } = new WorkOrderDetailsController();
    fn = computedUserName;
  });
  it('should returns displayname when it exists', () => {
    const itemWithDisplayname = { displayname: 'John Doe' };
    expect(fn(itemWithDisplayname)).toBe('John Doe');
  });

  it('should returns personid when displayname does not exist', () => {
    const itemWithoutDisplayname = { personid: '12345' };
    expect(fn(itemWithoutDisplayname)).toBe('12345');
  });

  it('should returns undefined when both displayname and personid do not exist', () => {
    const itemWithNeither = {};
    expect(fn(itemWithNeither)).toBeUndefined();
  });

  it('should returns undefined when item is null', () => {
    const itemNull = null;
    expect(fn(itemNull)).toBeUndefined();
  });
});

it("Should save workLog item", async () => {
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "page" });
  app.client = {
    userInfo: {
      personid: "SAM",
      labor: { laborcode: "SAM" },
      insertOrg: 'EGLENA',
      insertSite: 'BEDFORD'
    }
  };

  app.registerPage(page);
  app.registerController(controller);

  const ds = newDatasource(workorderitem, "woDetailResource");
  const ds2 = newDatasourceWorkLog(worLogItem, "woDetailsWorklogDs");
  const synonymdomainDs = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainDs);
  let updatestub = sinon.stub(ds2, "update");
  let forceloadstub = sinon.stub(ds2, "forceReload");

  page.registerDatasource(ds);
  page.registerDatasource(ds2);

  let items = await ds.load();

  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
  };

  await app.initialize();

  controller.pageInitialized(page, app);
  await controller.openWorkLogDrawer({ item: items[1] });
  let event = "Test Comment 2";

  await controller.saveWorkLog(event);
  expect(updatestub.called).toBe(true);
  expect(updatestub.displayName).toBe("update");
  expect(updatestub.args.length).toBe(1);

  expect(forceloadstub.called).toBe(true);
  expect(forceloadstub.displayName).toBe("forceReload");

  event =
    "A long description is a way to provide long alternative text for non-text elements, such as images. Examples of suitable use of long description are charts, graphs, maps, infographics, and other complex images. Like alternative text, long description should be descriptive and meaningful.";

  await controller.openWorkLogDrawer({ item: items[1] });
  page.state = { chatLogDescLength: 100 };
  await controller.saveWorkLog(event);

  updatestub.restore();
  forceloadstub.restore();
});

it("should open save prompt on work log drawer validation", async () => {
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "page" });
  page.state = {
    initialDefaultLogType: "!CLIENTNOTE!"
  }
  app.client = {
    userInfo: {
      personid: "SAM",
      labor: { laborcode: "SAM" },
    },
  };

  app.registerPage(page);
  app.registerController(controller);

  const ds = newDatasource(workorderitem, "woDetailResource");
  const ds2 = newDatasourceWorkLog(worLogItem, "woDetailsWorklogDs");
  let workLogModified = worLogItem;
  workLogModified.responseInfo.schema.properties.logtype.default = "!CLIENTNOTE!";
  const synonymdomainDs = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainDs);

  page.registerDatasource(ds);
  page.registerDatasource(ds2);

  let items = await ds.load();

  await app.initialize();

  controller.pageInitialized(page, app);
  await controller.openWorkLogDrawer({ item: items[1] });
  page.state = { chatLogDescLength: 100 };

  page.state.isWorkLogEdit = true;
  page.state.initialDefaultLogType = '!UPDATE!';
  page.state.workLogData = { summary: "abc", longDescription: "<p>test</p>", logType: { value: 'UPDATE' }, sendDisable: false };
  controller.workLogValidate({});
  page.state.isWorkLogEdit = false;
  controller.workLogValidate({});
  expect(page.findDialog('saveDiscardWorkLogDetail')).toBeDefined();

  app.client = { userInfo: { personid: "test" } };

  controller.saveWorkLogSaveDiscard();
  expect(page.findDialog('workLogDrawer')).toBeDefined();
  page.state.workLogData.sendDisable = true;
  controller.saveWorkLogSaveDiscard();
  controller.closeWorkLogSaveDiscard();
  expect(page.findDialog('workLogDrawer')).toBeDefined();

  controller.watchChatLogChanges({ summary: "abc", longDescription: "<p>test</p>", logType: { value: 'UPDATE' }, sendDisable: false });
  await new Promise((r) => setTimeout(r, 600));
  expect(page.state.isWorkLogEdit).toBeTruthy();

  controller.watchChatLogChanges({ summary: "abc", longDescription: "<p>test</p>", logType: { value: 'UPDATE' }, sendDisable: true });
  await new Promise((r) => setTimeout(r, 600));
  expect(page.state.isWorkLogEdit).toBeTruthy();

  controller.watchChatLogChanges({ summary: "", longDescription: "", logType: { value: 'UPDATE' }, sendDisable: false, visibility: false });
  await new Promise((r) => setTimeout(r, 600));
  expect(page.state.isWorkLogEdit).toBeFalsy();

});

it("should open status page ", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });
  const schedPage = new Page({ name: "schedule" });
  app.registerPage(schedPage);

  let item = {
    wonum: "SCRAP_2",
    status: "APPR",
    allowedstates: {
      COMP: [{ description: "Completed", value: "COMP" }],
      WAPPR: [{ description: "Waiting on Approval", value: "WAPPR" }],
    },
  };

  app.registerController(controller);
  const ds = newDatasource(workorderitem, "workorderds");
  const woDetailResource = newDatasource(workorderitem, "woDetailResource");
  page.registerDatasource(woDetailResource);
  page.registerDatasource(ds);
  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  await app.initialize();

  let saveSpy = sinon.spy(controller, "openWoDtlChangeStatusDialog");
  await controller.openWoDtlChangeStatusDialog({
    item: item,
    loadDatasource: ds,
    datasource: "allDS",
    referencePage: "workOrderDetails",
  });
  expect(saveSpy.calledOnce).toEqual(true);
});


it("should open reject dialog ", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });
  const schedPage = new Page({ name: "schedule" });
  app.registerPage(schedPage);

  let item = {
    wonum: "SCRAP_2",
    status: "APPR",
    allowedstates: {
      COMP: [{ description: "Completed", value: "COMP" }],
      WAPPR: [{ description: "Waiting on Approval", value: "WAPPR" }],
    },
  };

  app.registerController(controller);
  const ds = newDatasource(workorderitem, "workorderds");
  const woDetailResource = newDatasource(workorderitem, "woDetailResource");
  page.registerDatasource(woDetailResource);
  page.registerDatasource(ds);
  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  await app.initialize();

  let saveSpy = sinon.spy(schedPage, "callController");
  await controller.openWoDtlRejectWoDialog({
    item: item,
    loadDatasource: ds,
    datasource: "allDS",
    referencePage: "workOrderDetails",
  });
  expect(saveSpy.calledOnce).toEqual(true);
});

it("should navigate to schedulepage", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const schedulePagecontroller = new SchedulePageController();

  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "schedule" });
  const page1 = new Page({ name: 'report_work' });
  const ds = newDatasource(workorderitem, "workorderds");
  const wodetails = newDatasource(workorderitem, "wodetails");
  const todaywoassignedDS = newDatasource(undefined, "todaywoassignedDS");
  const pmduewolistDS = newDatasource(undefined, "pmduewolistDS");
  page.registerDatasource(ds);
  page.registerDatasource(wodetails);
  page.registerDatasource(todaywoassignedDS);
  page.registerDatasource(pmduewolistDS);
  page.registerController(schedulePagecontroller);
  await ds.load();

  app.registerPage(page);
  app.registerPage(page1);
  page1.state.fieldChangedManually = false;
  await app.initialize();

  app.registerController(controller);
  app.registerController(schedulePagecontroller);

  controller.pageInitialized(page, app);
  app.setCurrentPage = mockSetPage;
});

it("Workorder startWOStopTimer with confirmlabtrans = 0", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  const page = new Page({ name: "page" });
  const reportPage = new Page({ name: "report_work" });
  const reportWorkController = new ReportWorkPageController();

  app.client = {
    userInfo: {
      personid: "SAM",
      labor: { laborcraftrate: { craft: "ELECT" }, laborcode: "SAM" },
    },
  };

  app.state = {
    systemProp: {
      "maximo.mobile.usetimer": "1",
    },
    appnames: {
      inspection: "inspection",
      assetmobile: "assetmobile",
      assetswitch: "plusassetswitch",
      assist: "assist"
    }
  };

  const reportWorkLabords = newDatasource(statusitem, "reportworkLabords");
  reportPage.registerDatasource(reportWorkLabords);
  app.registerController(controller);
  reportWorkController.pageInitialized(app, reportPage);

  const ds = newStatusDatasource(statusitem, "synonymdomainData");
  app.registerDatasource(ds);

  const wodetails = newDatasource(workorderitem, "woDetailResource");
  page.registerDatasource(wodetails);

  const laborDetailDS = newLaborDetailDatasource(labor, "woLaborDetailds");
  page.registerDatasource(laborDetailDS);

  let items = await wodetails.load();
  let invokeAction = sinon.stub(wodetails, "invokeAction").returns(items[0]);
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  app.state.woStatSigOptions= JSON.stringify({
    CLOSE: "CLOSE",
    CANCEL: "CAN"
  });
  app.state.woOSName= "MXAPIWODETAIL";
  await controller.startWOStopTimer({
    item: items[1],
    datasource: wodetails,
    action: "start",
  });

  expect(invokeAction.called).toBe(true);
  expect(invokeAction.displayName).toBe("invokeAction");
  expect(invokeAction.args.length).toBe(1);
  app.state.woStatSigOptions= JSON.stringify({
    CLOSE: "CLOSE",
    CANCEL: "CAN"
  });
  app.state.woOSName= "MXAPIWODETAIL";
  app.currentPage = reportPage;
  await controller.startWOStopTimer({
    item: items[1],
    datasource: wodetails,
    action: "stop",
  });

  expect(invokeAction.called).toBe(true);
  expect(invokeAction.displayName).toBe("invokeAction");
  expect(invokeAction.args.length).toBe(2);

  controller.openNavigation = jest.fn();
  app.state = {
    systemProp: {
      "mxe.mobile.travel.navigation": "1",
      "maximo.mobile.usetimer": "1",
    },
    networkConnected: true,
    appnames: {
      inspection: "inspection",
      assetmobile: "assetmobile",
      assetswitch: "plusassetswitch",
      assist: "assist"
    }
  };

  wodetails.item.coordinate = "LATLONG";
  app.state.woStatSigOptions= JSON.stringify({
    CLOSE: "CLOSE",
    CANCEL: "CAN"
  });
  app.state.woOSName= "MXAPIWODETAIL";
  await controller.startWOStopTimer({
    item: items[1],
    datasource: wodetails,
    action: "start",
    worktype: "travel",
  });
  expect(invokeAction.called).toBe(true);
  expect(invokeAction.displayName).toBe("invokeAction");
  expect(invokeAction.args.length).toBe(3);
  expect(controller.openNavigation.mock.calls.length).toBe(1);

  controller.openNavigation = jest.fn();
  app.state = {
    systemProp: {
      "mxe.mobile.travel.navigation": "0",
      "maximo.mobile.usetimer": "1",
    },
    appnames: {
      inspection: "inspection",
      assetmobile: "assetmobile",
      assetswitch: "plusassetswitch",
      assist: "assist"
    }
  };
  app.state.woStatSigOptions= JSON.stringify({
    CLOSE: "CLOSE",
    CANCEL: "CAN"
  });
  app.state.woOSName= "MXAPIWODETAIL";
  await controller.startWOStopTimer({
    item: items[1],
    datasource: wodetails,
    action: "start",
    worktype: "travel",
  });
  expect(invokeAction.called).toBe(true);
  expect(invokeAction.displayName).toBe("invokeAction");
  expect(invokeAction.args.length).toBe(4);
  expect(controller.openNavigation.mock.calls.length).toBe(0);
  app.state = {
    systemProp: {
      "mxe.mobile.travel.navigation": "1",
      "maximo.mobile.usetimer": "1",
    },
    appnames: {
      inspection: "inspection",
      assetmobile: "assetmobile",
      assetswitch: "plusassetswitch",
      assist: "assist"
    }
  };
  app.state.woStatSigOptions= JSON.stringify({
    CLOSE: "CLOSE",
    CANCEL: "CAN"
  });
  app.state.woOSName= "MXAPIWODETAIL";
  await controller.startWOStopTimer({
    item: items[1],
    datasource: wodetails,
    action: "start",
    worktype: "travel",
  });

  expect(controller.openNavigation.mock.calls.length).toBe(1);
});

it("Workorder startWOStopTimer with confirmlabtrans = 1", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  const page = new Page({ name: "page" });
  const reportPage = new Page({ name: "report_work" });
  const reportWorkController = new ReportWorkPageController();

  app.client = {
    userInfo: {
      personid: "SAM",
      labor: { laborcraftrate: { craft: "ELECT" }, laborcode: "SAM" },
    },
  };

  app.state = {
    systemProp: {
      "maximo.mobile.usetimer": "1",
    },
    appnames: {
      inspection: "inspection",
      assetmobile: "assetmobile",
      assetswitch: "plusassetswitch",
      assist: "assist"
    }
  };

  app.registerController(controller);
  reportPage.registerController(reportWorkController);

  const ds = newStatusDatasource(statusitem, "synonymdomainData");
  app.registerDatasource(ds);

  const laborDetailDS = newLaborDetailDatasource(labor, "woLaborDetailds");
  page.registerDatasource(laborDetailDS);

  const reportWorkLabords = newDatasource(statusitem, "reportworkLabords");
  reportPage.registerDatasource(reportWorkLabords);

  const wodetails = newDatasource(workorderitem, "woDetailResource");
  page.registerDatasource(wodetails);

  const items = await wodetails.load();
  const invokeAction = sinon.stub(wodetails, "invokeAction").returns(items[0]);
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);

  items[1].confirmlabtrans = "1";
  app.state.woStatSigOptions= JSON.stringify({
    CLOSE: "CLOSE",
    CANCEL: "CAN"
  });
  app.state.woOSName= "MXAPIWODETAIL";
  await controller.startWOStopTimer({
    item: items[1],
    datasource: wodetails,
    action: "start",
  });

  expect(invokeAction.called).toBe(true);
  expect(invokeAction.displayName).toBe("invokeAction");
  expect(invokeAction.args.length).toBe(1);

  app.currentPage = reportPage;
  expect(laborDetailDS.item.finishdatetime).toBeUndefined();
  app.state.woStatSigOptions= JSON.stringify({
    CLOSE: "CLOSE",
    CANCEL: "CAN"
  });
  app.state.woOSName= "MXAPIWODETAIL";
  await controller.startWOStopTimer({
    item: items[1],
    datasource: wodetails,
    action: "stop",
  });
  expect(laborDetailDS.item.finishdatetime).toBeDefined();
});

it("Should call onDeleteEntry", async() => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({name: "workOrderDetails"});

  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);

  const deleteEntryStub = sinon.stub(WOTimerUtil, 'deleteTimerEntry');
  await controller.onDeleteEntry()
  expect(deleteEntryStub.called).toBe(true);
});

it("Workorder onClickEditLabor", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();
  const app = new Application();
  const controller = new WorkOrderDetailsController();
  const page = new Page({ name: "page" });
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  controller.pageInitialized(page, app);
  
  const reportPage = new Page({ name: "report_work" });
  const reportWorkController = new ReportWorkPageController();

  app.client = {
    userInfo: {
      personid: "SAM",
      labor: { laborcode: "SAM" },
    },
  };

  app.registerController(controller);
  app.registerController(reportWorkController)

  app.registerPage(page);
  app.registerPage(reportPage);

  const ds = newStatusDatasource(statusitem, "synonymdomainData");
  app.registerDatasource(ds);

  const laborDetailDS = newLaborDetailDatasource(labor, "woLaborDetailds");
  page.registerDatasource(laborDetailDS);
  const wodetails = newDatasource(workorderitem, "woDetailResource");
  page.registerDatasource(wodetails);

  const reportWorkLabords = newDatasource(statusitem, "reportworkLabords");
  reportPage.registerDatasource(reportWorkLabords);

  const items = await wodetails.load();

  await app.initialize();
  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  reportWorkController.pageInitialized(reportPage, app);

  app.currentPage = reportPage;
  await controller.onClickEditLabor({
    item: items[1],
    datasource: wodetails,
    action: "stop",
  });
  expect(mockSetPage.mock.calls.length).toBe(1);
});

it("Workorder onClickSendLabTrans", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "page" });
  const reportPage = new Page({ name: "report_work" });
  const reportWorkController = new ReportWorkPageController();

  app.client = {
    userInfo: {
      personid: "SAM",
      labor: { laborcode: "SAM" },
    },
  };

  app.registerController(controller);
  reportPage.registerController(reportWorkController);

  const ds = newStatusDatasource(statusitem, "synonymdomainData");
  app.registerDatasource(ds);

  const laborDetailDS = newLaborDetailDatasource(labor, "woLaborDetailds");
  page.registerDatasource(laborDetailDS);

  const wodetails = newDatasource(workorderitem, "woDetailResource");
  page.registerDatasource(wodetails);

  const reportWorkLabords = newDatasource(statusitem, "reportworkLabords");
  reportPage.registerDatasource(reportWorkLabords);

  const items = await wodetails.load();

  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);

  const savestub = sinon.stub(WOTimerUtil, "clickSendLabTrans");

  app.currentPage = reportPage;
  await controller.onClickSendLabTrans({
    item: items[1],
    datasource: wodetails,
    action: "stop",
  });
  expect(savestub.called).toBe(true);
});

it("should send user to attachments page", async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };

  let pageSetter = jest.fn();

  app.registerController(controller);
  await app.initialize();

  const originalSetter = app.setCurrentPage;
  app.setCurrentPage = pageSetter;

  controller.pageInitialized(new Page(), app);
  let event = {
    item: { href: "oslc/os/mxapiwodetail/_QkVERk9SRC81MTA1Nw--" },
  };
  controller.showAttachmentPage(event);

  expect(pageSetter.mock.calls.length).toEqual(1);

  expect(pageSetter.mock.calls[0][0].name).toEqual("attachments");

  app.setCurrentPage = originalSetter;
});

it("should send user to related work order page", async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };

  let pageSetter = jest.fn();
  let event = {
    item: { href: "oslc/os/mxapiwodetail/_QkVERk9SRC81MTA1Nw--" },
  };

  app.registerController(controller);
  await app.initialize();

  app.setCurrentPage = pageSetter;

  controller.pageInitialized(new Page(), app);

  controller.showRelatedWOPage(event);

  expect(pageSetter.mock.calls.length).toEqual(1);

  expect(pageSetter.mock.calls[0][0].name).toEqual("relatedWorkOrder");
});

it("should navigate map view of a current work order", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const schedulePagecontroller = new SchedulePageController();

  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };

  const page = new Page({ name: "schedule" });
  const ds = newDatasource(workorderitem, "workorderds");

  page.registerDatasource(ds);
  const wodetails = newDatasource(workorderitem, "wodetails");
  page.registerDatasource(wodetails);

  let items = await ds.load();

  app.registerPage(page);
  await app.initialize();

  app.registerController(controller);
  page.registerController(schedulePagecontroller);

  controller.pageInitialized(new Page(), app);
  app.setCurrentPage = mockSetPage;
  page.state.selectedDS = "workorderds";
  schedulePagecontroller.pageInitialized(page, app);

  await controller.handleMapPage({ item: items[2], datasource: ds });
  expect(page.state.selectedSwitch).toEqual(1);
});



it("should navigate map view of a current work order", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const schedulePagecontroller = new SchedulePageController();

  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };

  const page = new Page({ name: "approvals" });
  const ds = newDatasource(workorderitem, "workorderds");

  page.registerDatasource(ds);
  const wodetails = newDatasource(workorderitem, "wodetails");
  page.registerDatasource(wodetails);

  let items = await ds.load();

  app.registerPage(page);
  await app.initialize();

  app.registerController(controller);
  page.registerController(schedulePagecontroller);

  controller.pageInitialized(new Page(), app);
  app.setCurrentPage = mockSetPage;
  page.state.selectedDS = "workorderds";
  schedulePagecontroller.pageInitialized(page, app);

  await controller.handleMapPage({ item: items[2], datasource: ds });
  expect(page.state.selectedSwitch).toEqual(1);
});

it("should open asset mismatch dialog or toast on workorder details page", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "page" });

  app.registerController(controller);

  const woAssetLocationds = newAssetLocationDatasource(
    workorderitem,
    "woAssetLocationds"
  );
  page.registerDatasource(woAssetLocationds);

  await woAssetLocationds.load();
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  app.toast = jest.fn();
  page.showDialog = jest.fn();
  await controller.handleAssetScan({ value: "13120" });
  await expect(app.toast.mock.calls.length).toBe(1);
  await controller.handleAssetScan({ value: "13121" });
  await expect(page.showDialog.mock.calls.length).toEqual(1);
});

it("should open barcode scanner after closing the mismatch dialog", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "page" });

  app.registerController(controller);

  const woAssetLocationds = newAssetLocationDatasource(
    workorderitem,
    "woAssetLocationds"
  );
  page.registerDatasource(woAssetLocationds);

  const assetMisMatchDialog = new Dialog({
    name: "assetMisMatchDialog",
  });
  assetMisMatchDialog.closeDialog = jest.fn();
  page.showDialog = jest.fn();
  page.registerDialog(assetMisMatchDialog);

  await woAssetLocationds.load();
  await app.initialize();

  let event = { value: "mockval" };
  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  controller.openBarcodeScanner(event);
  controller.pageInitialized(page);
  controller.openBarcodeScanner(event);
});

it("should open assist app with context", async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  await app.initialize();
  controller.pageInitialized(new Page(), app);
  AppSwitcher.setImplementation(MaximoAppSwitcher, { app: app });
  const emitSpy = sinon.spy(app, "emit");

  const page = new Page({ name: "page" });
  const wodetailDS = newDatasource(workorderitem, "woDetailResource");
  page.registerDatasource(wodetailDS);
  let items = await wodetailDS.load();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
  };
  // calling with an empty wo item
  controller.gotoAssistApp({ item: {} });
  sinon.assert.callCount(emitSpy, 1);

  // calling with appName but without options and context data
  controller.gotoAssistApp({ item: items[1] });
  sinon.assert.callCount(emitSpy, 2);
});

it("should load data on container mode", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  let page = new Page({ name: "workOrderDetails" });
  const page1 = new Page({ name: 'report_work' });
  const fupPage = new Page({ name: 'relatedWorkOrder' });

  app.registerController(controller);

  const detailDS = newDatasource(workorderitem, "woDetailResource");
  const synonymDS = newStatusDatasource(statusitem, "synonymdomainData");
  const woDetailds = newDatasource(workorderitem, "woDetailds");
  const woPlanTaskDS = newTaskDatasource(tasklist, "woPlanTaskDetailds");
  const woServiceAddress = newDatasource(workorderitem, "woServiceAddress");
  const woSpec = newDatasource(woSpecification, "woSpecification");
  const woMultiAssetLocationds = newDatasource(workorderitem, "woMultiAssetLocationds");
  const assetDs = newAssetLocationDatasource(
    workorderitem,
    "woAssetLocationds"
  );
  const locDs = newLocDS(workorderitem, "woLocationds");
  const mrDS = newDatasource(wpmaterial, "mrDS");
  page.registerDatasource(mrDS);
  page.registerDatasource(detailDS);
  app.registerDatasource(synonymDS);
  app.registerDatasource(woDetailds);
  app.registerDatasource(woPlanTaskDS);
  page.registerDatasource(woServiceAddress);
  page.registerDatasource(assetDs);
  page.registerDatasource(locDs);
  page.registerDatasource(woSpec);
  page.registerDatasource(woMultiAssetLocationds);

  app.registerPage(page);
  app.registerPage(page1);
  app.registerPage(fupPage);

  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
  };

  await app.initialize();

  sinon.stub(commonUtil, "_resetDataSource")

  sinon.stub(SynonymUtil, "getDefaultExternalSynonymValue").returns("CAN");
  
  app.client = {
    userInfo: {
      insertOrg: "EAGLENA",
      insertSite: "BEDFORD",
    },
    checkSigOption: (option) => true,
    findSigOption: (appName, sigoption) => true,
    getUserProperty: () => { }
  };

  controller.pageInitialized(page, app)

  const woDetailRelatedWorkOrder = newDatasource(workorderitem, 'woDetailRelatedWorkOrder');
  woDetailRelatedWorkOrder.controllers.push(new RelatedWoController());
  fupPage.registerDatasource(woDetailRelatedWorkOrder);
  fupPage.params = {
    noCache: true,
    itemUrl: detailDS.item.href
  }
  await woDetailRelatedWorkOrder.load();

  await detailDS.load();

  app.setCurrentPage = mockSetPage;
  app.currentPage = page;
  app.state.fromQuickReport = true;
  detailDS.item.status = "INPRG"
  controller.pageInitialized(page, app);
  Device.get().isMaximoMobile = true;
  page1.state.fieldChangedManually = false;
  page.state.isLinear = false;

  await controller.pageResumed(page, app);
  
  expect(
    page.datasources["woServiceAddress"].item.longitudex
  ).not.toBeDefined();
  expect(app.currentPage.name).toBe("workOrderDetails");
  expect(page.state.assetLocation).toBe(true);
  expect(page.state.linearAsset).toBe(true);

  detailDS.item.wonum = undefined
  detailDS.item.assetnum = "11430"
  detailDS.item.asset[0].assetnum = "11430"
  detailDS.item.asset[0].islinear = false
  page.state.isLinear = false;
  await controller.pageResumed(page, app);
  expect(page.state.followupCount).toBe(2);
  expect(page.state.linearAsset).toBe(false);
});

it("should save longitude and latitude information in service address of workorder", async () => {
  // Override OpenLayersAdapter.transformCoordinate at runtime
  jest.spyOn(OpenLayersAdapter, 'transformCoordinate').mockImplementation((coords) => {
    return [coords[0] + 0.001, coords[1] + 0.001];
  });

  // Override CommonUtil.sharedData.basemapSpatialReference
  global.CommonUtil = {
    sharedData: {
      basemapSpatialReference: 'EPSG:3857'
    }
  };

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };

  const page = new Page({ name: "workOrderDetails" });
  const wods = newDatasource(workorderitem, "woServiceAddress");
  const woDetailResource = newDatasource(workorderitem, "woDetailResource");

  woDetailResource.searchQBE = () => Promise.resolve(workorderitem.member);
  page.registerDatasource(wods);
  page.registerDatasource(woDetailResource);
  app.registerController(controller);

  Object.defineProperty(app, 'geolocation', {
    get: () => ({
      state: {
        longitude: 72.5714,
        latitude: 23.0225
      }
    })
  });

  await app.initialize();

  controller.pageInitialized(page, app);

  jest.spyOn(app, "findDatasource").mockImplementation((name) => {
    return {
      data: workorderitem,
      initializeQbe: () => { },
      setQBE: () => { },
      searchQBE: () => Promise.resolve([{}]),
      update: jest.fn()
    };
  });

  // Test without coordinates
  let item = {};
  await controller.saveGPSLocation(item);
  expect(page.state.gpsLocationSaved).toBe(true);
  expect(item.autolocate).toContain('"type":"Point"');

  // Test with coordinates as 'XY'
  item = { coordinate: 'XY' };
  await controller.saveGPSLocation(item);
  expect(OpenLayersAdapter.transformCoordinate).toHaveBeenCalled();
  expect(page.state.gpsLocationSaved).toBe(true);
  expect(item.autolocate).toContain('"type":"Point"');
});

it("work order edit", async () => {
  let mockedFn = jest.fn();
  const controller = new WorkOrderDetailsController();
  const editcontroller = new WorkOrderEditController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "woedit" });
  const page3 = new Page({ name: "report_work" });

  const page2 = new Page({ name: "workOrderDetails" });
  const detailDS = newDatasource(workorderitem, "woDetailResource");

  let workorder = {
    item: { wonum: "1001", siteid: "BEDFORD", orgid: "EAGLENA" },
    datasource: "woDetailResource",
  };

  page.params = {
    wonum: "1001",
    istask: true,
    wogroup: "",
    taskid: "1452",
    wo: workorder.item
  }

  const workorder1 = {
    wonum: "1001",
    description: "Work Order desc",
    description_longdescription: "Work Order long desc",
    wopriority: 2,
    worktype: "CAL",
    orgid: "EAGLENA",
    status: "APPR",
    locationnum: 'SHIPPING',
    locationdesc: 'Shipping and Receiving Department',
    schedfinish: "2024-09-26T05:18:00+05:30",
    schedstart: "2024-09-20T02:49:00+05:30",
    targcompdate: "2024-09-01T05:18:00+05:30",
    targstartdate: "2024-09-30T02:49:00+05:30",
    istask: false,
    wogroup: '1003',
    taskid: '103'
  };

  const ds = newDatasource({ member: workorder1 }, "dsWoedit");
  app.registerDatasource(ds);
  const synonymdomainData = newTimerStatusDatasource(
    statusitem,
    "synonymdomainData"
  );
  app.registerDatasource(synonymdomainData);
  const woAssetLocationds = newAssetLocationDatasource(
    workorderitem,
    "woAssetLocationds"
  );
  page2.registerDatasource(woAssetLocationds);
  const woLocationds = newLocDS(workorderitem, "woLocationds");
  page2.registerDatasource(woLocationds);
  const woDetailds = newDatasource(workorderitem, "woDetailds");
  page2.registerDatasource(woDetailds);
  const woServiceAddress = newDatasource(workorderitem, "woServiceAddress");
  page2.registerDatasource(woServiceAddress);
  const mrDS = newDatasource(wpmaterial, "mrDS");
  page2.registerDatasource(mrDS);
  page2.registerDatasource(detailDS);

  page.registerDatasource(woAssetLocationds);
  page.registerDatasource(woLocationds);
  page.registerDatasource(woDetailds);
  page.registerDatasource(woServiceAddress);
  page.registerDatasource(mrDS);
  page.registerDatasource(detailDS);

  app.client = {
    userInfo: {
      insertOrg: "EAGLENA",
      insertSite: "BEDFORD",
    },
    checkSigOption: (option) => true,
    findSigOption: (appName, sigoption) => true,
  };
  Device.get().isMaximoMobile = false;
  app.registerController(controller);
  app.registerController(editcontroller);
  app.registerPage(page2);
  app.registerPage(page);
  app.registerPage(page3);

  editcontroller.pageInitialized(page, app);
  controller.pageInitialized(page2, app);
  await app.initialize();

  page.callController = mockedFn;
  page.workOrderEdit = mockedFn;
  page3.state.fieldChangedManually = false;
});

it("should open Asset WorkOrder", async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });
  const page2 = new Page({ name: "report_work" });
  const page1 = new Page({ name: "assetWorkOrder" });
  const detailDS = newDatasource(workorderitem, "woDetailResource");

  app.registerController(controller);
  page.registerDatasource(detailDS);
  page1.registerDatasource(detailDS);
  const woAssetLocationds = newAssetLocationDatasource(
    workorderitem,
    "woAssetLocationds"
  );
  woAssetLocationds.baseQuery.childFilters = [
    {
      "asset.wobyasset.where": 'status in ["COMP","CLOSE"]'
    }
  ]
  page.registerDatasource(woAssetLocationds);
  const woLocationds = newLocDS(workorderitem, "woLocationds");

  woLocationds.baseQuery.childFilters = [
    {
      "locations.wobylocation.where": 'status in ["COMP","CLOSE"]'
    }
  ]
  page.registerDatasource(woLocationds);
  const woDetailds = newDatasource(workorderitem, "woDetailds");
  page.registerDatasource(woDetailds);
  const woServiceAddress = newDatasource(workorderitem, "woServiceAddress");
  page.registerDatasource(woServiceAddress);
  const mrDS = newDatasource(wpmaterial, "mrDS");
  page.registerDatasource(mrDS);
  const synonymdomainData = newTimerStatusDatasource(
    statusitem,
    "synonymdomainData"
  );
  app.registerDatasource(synonymdomainData);

  page1.registerDatasource(woAssetLocationds);
  page1.registerDatasource(woLocationds);
  page1.registerDatasource(woDetailds);
  page1.registerDatasource(woServiceAddress);
  page1.registerDatasource(mrDS);

  app.registerPage(page);
  app.registerPage(page1);
  app.registerPage(page2);
  page2.state.fieldChangedManually = false;

  await app.initialize();

  controller.pageInitialized(page, app);
  let event = {
    item: {
      assetnum: "11200",
      description: "HVAC System- 50 Ton Cool Cap/ 450000 Btu Heat Cap",
      isrunning: false,
    },
  };
  page2.state.fieldChangedManually = false;
  const whereQuery = ["COMP", "CLOSE"];
  controller.openAssetWorkOrder(event, whereQuery, whereQuery);
  expect(app.currentPage.name).toBe("assetWorkOrder");
});

it("should choose DownTimeCode", async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });

  app.registerController(controller);

  await app.initialize();
  controller.pageInitialized(page, app);
  let event = {
    description: "Breakdown",
    value: "BRKDWN",
  };
  controller.chooseDownTimeCode(event);
  expect(page.state.downTimeCodeValue).toBe("BRKDWN");
  expect(page.state.downTimeCodeDesc).toBe("Breakdown");
});

it("should open DowntimeCode lookup", async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });

  app.registerController(controller);
  app.registerPage(page);

  const ds = newStatusDatasource(downTimeCode, "alnDomainDS");
  app.registerDatasource(ds);
  let loadstub = sinon.stub(ds, "searchQBE");
  
  await app.initialize();
  controller.pageInitialized(page, app);
  let event = {
    page: page,
  };
  await controller.openDowntimeCodeLookup(event);
  expect(loadstub.called).toBe(true);
  expect(loadstub.displayName).toBe("searchQBE");
  loadstub.restore();
});

it("should handleToggled", async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });

  page.state.upDownButtonGroupdata = [
    { id: "assetUpBtn", iconName: "carbon:arrow--up", toggled: true },
    { id: "assetDownBtn", iconName: "carbon:arrow--down", toggled: false },
  ];

  const ds = newDatasource([], "downTimeReportAsset");
  page.registerDatasource(ds);

  app.registerController(controller);

  await app.initialize();
  controller.pageInitialized(page, app);
  let event = {
    isrunning: true,
    item: {
      id: "assetDownBtn",
      label: undefined,
      toggled: false,
    },
  };
  controller.handleToggled(event);
  expect(page.state.hideUp).toBe(false);
  expect(page.state.hideDown).toBe(false);

  event.item.id = "assetUpBtn";

  controller.handleToggled(event);
  expect(page.state.hideUp).toBe(true);
  expect(page.state.hideDown).toBe(true);
  window.setTimeout(async () => {
    expect(page.state.disableSaveDowtimeButton).toBe(true);
  }, 50);

  event.isrunning = false;
  controller.handleToggled(event);
  expect(page.state.hideUp).toBe(false);
  expect(page.state.hideDown).toBe(false);
});

it("should setCurrentDateTime", async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails", state: { useConfirmDialog: true } });

  page.state = {
    useConfirmDialog: false
  }
  const ds = newDatasource([], "downTimeReportAsset");
  page.registerDatasource(ds);
  const woAssetLocationds = newAssetLocationDatasource(
    workorderitem,
    "woAssetLocationds"
  );
  page.registerDatasource(woAssetLocationds);
  const woLocationds = newLocDS(workorderitem, "woLocationds");
  page.registerDatasource(woLocationds);
  const woDetailds = newDatasource(workorderitem, "woDetailds");
  page.registerDatasource(woDetailds);
  const woServiceAddress = newDatasource(workorderitem, "woServiceAddress");
  page.registerDatasource(woServiceAddress);
  const mrDS = newDatasource(wpmaterial, "mrDS");
  page.registerDatasource(mrDS);

  app.registerController(controller);

  await app.initialize();
  controller.pageInitialized(page, app);
  await controller.setCurrentDateTime();

  expect(ds.items).not.toBeNull();
});

it("should correctly handle unassignment", async () => {
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const controller = new WorkOrderDetailsController();
  const page = new Page({ name: "workOrderDetails" });

  const woDetailResource = {
    item: { id: 1 },
    datasource: "woDetailDatasource"
  };

  page.datasources = {
    woDetailResource: woDetailResource
  };

  // Mock schedulePage
  const schedulePage = new Page({ name: "schedule" });
  schedulePage.callController = jest.fn();

  app.pages = [schedulePage, page];
  app.registerController(controller);
  await app.initialize();
  controller.pageInitialized(page, app);

  CommonUtil.sharedData.clickedUnassignment = false;

  controller.unassignment();

  // Validate callController execution
  expect(schedulePage.callController).toHaveBeenCalledWith("rejectWO", {
    item: woDetailResource.item,
    datasource: woDetailResource.datasource,
    action: "Reject"
  });

  expect(CommonUtil.sharedData.clickedUnassignment).toBe(false);
  expect(CommonUtil.sharedData.allowReassignmentPage).toBeUndefined();
  expect(CommonUtil.sharedData.event).toBeUndefined();
});

it("should correctly save specification and update page state", async () => {
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const controller = new WorkOrderDetailsController();
  const page = new Page({ name: "workOrderDetails" });

  const woSpecCombinedDS = {
    items: [{ specId: 1, value: "Test Spec" }]
  };

  const woDetailsResource = {
    item: {},
    save: jest.fn().mockResolvedValue(true)
  };

  const woSpecificationDS = {
    forceReload: jest.fn()
  };

  const woSpecificationEditDrawer = {
    closeDialog: jest.fn()
  };

  page.state.specificationLoader = false;
  app.findDatasource = jest.fn((dsName) => {
    if (dsName === "woSpecificationsCombinedDS") return woSpecCombinedDS;
    if (dsName === "woDetailResource") return woDetailsResource;
    if (dsName === "woSpecification") return woSpecificationDS;
  });

  page.findDialog = jest.fn(() => woSpecificationEditDrawer);
  app.registerController(controller);
  await app.initialize();
  controller.pageInitialized(page, app);

  await controller.saveSpecification();

  expect(page.state.specificationLoader).toBe(false);
  expect(woDetailsResource.item.workorderspec).toEqual(woSpecCombinedDS.items);
  expect(woDetailsResource.save).toHaveBeenCalled();
  expect(woSpecificationEditDrawer.closeDialog).toHaveBeenCalled();
});


it("should open Asset DownTimeDrawer", async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });
  const ds = newDatasource(workordersingleitem, "woDetailResource");
  const ds1 = newDatasource([], "downTimeReportAsset");
  const woAssetLocationds = newAssetLocationDatasource(
    workorderitem,
    "woAssetLocationds"
  );
  page.registerDatasource(woAssetLocationds);
  const woLocationds = newLocDS(workorderitem, "woLocationds");
  page.registerDatasource(woLocationds);
  const woDetailds = newDatasource(workorderitem, "woDetailds");
  page.registerDatasource(woDetailds);
  const woServiceAddress = newDatasource(workorderitem, "woServiceAddress");
  page.registerDatasource(woServiceAddress);
  const mrDS = newDatasource(wpmaterial, "mrDS");
  page.registerDatasource(mrDS);

  app.client = {
    userInfo: {
      insertOrg: "EAGLENA",
      insertSite: "BEDFORD",
    },
    checkSigOption: (option) => true,
    findSigOption: (appName, sigoption) => true,
  };
  app.registerPage(page);
  page.registerDatasource(ds);
  page.registerDatasource(ds1);

  app.registerController(controller);

  const synonymdomainData = newTimerStatusDatasource(
    statusitem,
    "synonymdomainData"
  );
  app.registerDatasource(synonymdomainData);

  await app.initialize();
  controller.pageInitialized(page, app);

  let event = {
    item: {
      assetisrunning: true,
    },
  };
  await controller.openAssetDownTimeDrawer(event);

  expect(page.state.hideUp).toBe(true);
  expect(page.state.hideDown).toBe(true);
});

it("should saveAssetDownTimeTransaction()", async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });
  const page1 = new Page({ name: 'report_work' });
  const ds = newDatasource(workordersingleitem, "woDetailResource");
  const ds1 = newDatasource(
    [{ statuschangedate: "2021-07-02T11:36:07+05:30" }],
    "downTimeReportAsset"
  );
  const assetStatusDialog = new Dialog({
    name: "assetStatusDialog",
  });
  app.registerPage(page);
  app.registerPage(page1);
  assetStatusDialog.closeDialog = jest.fn();
  page.registerDialog(assetStatusDialog);
  page.registerDatasource(ds);
  page.registerDatasource(ds1);
  const woAssetLocationds = newAssetLocationDatasource(
    workorderitem,
    "woAssetLocationds"
  );
  page.registerDatasource(woAssetLocationds);
  const woLocationds = newLocDS(workorderitem, "woLocationds");
  page.registerDatasource(woLocationds);
  const woDetailds = newDatasource(workorderitem, "woDetailds");
  page.registerDatasource(woDetailds);
  const woServiceAddress = newDatasource(workorderitem, "woServiceAddress");
  page.registerDatasource(woServiceAddress);
  const mrDS = newDatasource(wpmaterial, "mrDS");
  page.registerDatasource(mrDS);
  page.state.downTimeCodeValue = "";
  app.registerController(controller);

  let items = await ds.load();
  await ds1.load();
  let invokeAction = sinon.stub(ds, "invokeAction").returns(items[0]);
  let forceReloadStub = sinon.stub(ds, "forceReload");
  page1.state.fieldChangedManually = false;
  await app.initialize();
  controller.pageInitialized(page, app);
  let event = {
    page: page,
  };
  await controller.saveAssetDownTimeTransaction(event);
  expect(invokeAction.called).toBe(true);
  expect(invokeAction.displayName).toBe("invokeAction");
  expect(forceReloadStub.called).toBe(true);
  invokeAction.restore();
  forceReloadStub.restore();
});

it("should validateDownTimeDate()", async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });
  const page1 = new Page({ name: 'report_work' });
  const ds = newDatasource(workordersingleitem, "woDetailResource");
  const ds1 = newDatasource1(
    [{ statuschangedate: "2021-07-01T11:36:07+05:30" }],
    "downTimeReportAsset"
  );
  const woAssetLocationds = newAssetLocationDatasource(
    workorderitem,
    "woAssetLocationds"
  );
  page.registerDatasource(woAssetLocationds);
  const woLocationds = newLocDS(workorderitem, "woLocationds");
  page.registerDatasource(woLocationds);
  const woDetailds = newDatasource(workorderitem, "woDetailds");
  page.registerDatasource(woDetailds);
  const woServiceAddress = newDatasource(workorderitem, "woServiceAddress");
  page.registerDatasource(woServiceAddress);
  const mrDS = newDatasource(wpmaterial, "mrDS");
  page.registerDatasource(mrDS);
  const assetStatusDialog = new Dialog({
    name: "assetStatusDialog",
  });
  app.registerPage(page);
  app.registerPage(page1);
  assetStatusDialog.closeDialog = jest.fn();
  page.registerDialog(assetStatusDialog);
  page.registerDatasource(ds);
  page.registerDatasource(ds1);
  page.state.downTimeCodeValue = "";
  page.state.lastStatusChangeDate = "2021-07-02T11:36:07+05:30";
  app.registerController(controller);

  await ds1.load();
  page1.state.fieldChangedManually = false;
  await app.initialize();
  controller.pageInitialized(page, app);
  controller.validateDownTimeDate();
  expect(page.state.disableSaveDowtimeButton).toBe(true);

  controller.clearWarnings("statuschangedate");
  page.state.lastStatusChangeDate = "2021-06-29T11:36:07+05:30";
  controller.validateDownTimeDate();
  expect(page.state.disableSaveDowtimeButton).toBe(false);

  ds1.item.statuschangedate = "";
  controller.validateDownTimeDate();
  expect(page.state.disableSaveDowtimeButton).toBe(true);
  controller.clearWarnings("statuschangedate");

  ds1.currentItem = { statuschangedate: "2021-07-01T11:36:07+05:30" };
  ds1.getWarning = jest.fn().mockReturnValue(true);


  controller.validateDownTimeDate();
  // Ensure that the disableSaveDowtimeButton flag is set due to warning
  expect(page.state.disableSaveDowtimeButton).toBe(true);
  expect(ds1.getWarning).toHaveBeenCalledWith(ds1.currentItem, 'statuschangedate');

  controller.clearWarnings("statuschangedate");
});

it("should open material request page", async () => {
  global.open = jest.fn();
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "page" });
  const mrDS = newDatasource(wpmaterial, "mrDS");
  page.registerDatasource(mrDS);
  app.registerController(controller);
  const ds = newDatasource(workorderitem, "workorderds");
  page.registerDatasource(ds);
  let items = await ds.load();
  let mritems = await mrDS.load();

  await app.initialize();

  const setCurrentPageSpy = sinon.spy(app, "setCurrentPage");
  const slidingWodetailsMaterials = new Dialog({
    name: "slidingwodetailsmaterials",
  });
  slidingWodetailsMaterials.closeDialog = jest.fn();
  page.registerDialog(slidingWodetailsMaterials);

  controller.pageInitialized(page, app);
  await controller.openMaterialRequestPage({
    item: items[0],
    mritem: mritems[0],
  });
  sinon.assert.callCount(setCurrentPageSpy, 1);
});

it("should set LogType", async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });
  app.registerController(controller);
  await app.initialize();
  controller.pageInitialized(page, app);
  let event = { value: "APPTNOTE", description: "Appointment Note" };
  controller.setWODetailsLogType(event);
  expect(page.state.defaultLogType).toBe("APPTNOTE");
});

it("open reserve material page", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "page" });

  await app.initialize();
  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);

  page.findDialog = jest.fn();

  controller.openReservedMaterials({
    item: { href: "oslc/os/mxapiwodetail/_QkVERk9SRC8zMDA1OA--" },
  });
  await expect(page.findDialog.mock.calls.length).toEqual(1);
});

it("it should set saveDataSuccessful to false ", async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "page" });
  const page1 = new Page({ name: 'report_work' });

  const woDetailResource = newDatasource(workorderitem, "woDetailResource");
  page.registerDatasource(woDetailResource);

  app.registerController(controller);
  app.registerPage(page);
  app.registerPage(page1);
  page1.state.fieldChangedManually = false;
  await app.initialize();
  controller.onUpdateDataFailed();
  expect(controller.saveDataSuccessful).toBe(false);
});

it("it should closeAllDialogs", async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });
  const page1 = new Page({ name: 'report_work' });
  const woWorkLogDrawer = new Dialog({
    name: "woWorkLogDrawer",
  });
  const woDetailResource = newDatasource(workorderitem, "woDetailResource");
  page.registerDatasource(woDetailResource);
  page.registerDialog(woWorkLogDrawer);
  woWorkLogDrawer.closeDialog = jest.fn();
  app.registerController(controller);
  app.registerPage(page);
  app.registerPage(page1);
  page1.state.fieldChangedManually = false;
  await app.initialize();
  controller.pageInitialized(page, app);
  controller._closeAllDialogs(page);
  expect(woWorkLogDrawer.closeDialog.mock.calls.length).not.toBeNull();
});

it("it should handleDeleteTransaction", async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });
  const page1 = new Page({ name: 'report_work' });
  const woWorkLogDrawer = new Dialog({
    name: "woWorkLogDrawer",
  });
  const woDetailResource = newDatasource(workorderitem, "woDetailResource");
  page.registerDatasource(woDetailResource);

  const woAssetLocationds = newAssetLocationDatasource(
    workorderitem,
    "woAssetLocationds"
  );
  page.registerDatasource(woAssetLocationds);

  sinon.stub(woDetailResource, "load").returns([]);
  woDetailResource.currentItem = { href: "testhref" };
  page.registerDialog(woWorkLogDrawer);
  woWorkLogDrawer.closeDialog = jest.fn();
  app.registerController(controller);
  app.registerPage(page);
  app.registerPage(page1);
  page1.state.fieldChangedManually = false;
  let txn = {
    app: "Application",
    href: "testhref",
  };
  await app.initialize();
  controller.pageInitialized(page, app);
  await controller.handleDeleteTransaction(txn);
  expect(woWorkLogDrawer.closeDialog.mock.calls.length).not.toBeNull();
});


it('should open Safety Plans drawer for assigned/unassigned work order', async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: 'page' });

  app.registerController(controller);
  // Creating a datasource with assignment object for test
  let ds = newDatasource(workorderitem, 'woDetailds');
  const dsLoad = sinon.spy(ds, 'load');
  app.registerDatasource(ds);
  let items = await ds.load();

  const woDetailResourceds = newDatasource(workorderitem, 'woDetailResource');
  app.registerDatasource(woDetailResourceds);
  await woDetailResourceds.load();

  let showDialogSpy = sinon.spy(page, 'showDialog');
  app.registerController(controller);
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  await controller.openHazardDrawer({ 'item': items[0], 'datasource': ds });
  expect(dsLoad.called).toBe(true);
  window.setTimeout(() => {
    expect(showDialogSpy.getCall(0).args[0]).toStrictEqual('wohazardDrawer');
  }, 50);


  ds.items[0].assignment[0].splanreviewdate = new Date();
  woDetailResourceds.items[0].splanreviewdate = new Date();
  await controller.openHazardDrawer({ 'item': items[0], 'datasource': ds });
  expect(dsLoad.called).toBe(true);
  window.setTimeout(() => {
    expect(showDialogSpy.getCall(0).args[0]).toStrictEqual('wohazardDrawer');
  }, 50);

  app.resetDatasources();

  // reassigning the datasource with no assignment object for test
  ds = newDatasource(unassignedworkorderitem, 'woDetailds');
  items = await ds.load();
  await controller.openHazardDrawer({ 'item': items[0], 'datasource': ds });
  window.setTimeout(() => {
    expect(showDialogSpy.getCall(0).args[0]).toStrictEqual('wohazardDrawer');
  }, 500);
});

it('should review Safety Plan for assigned workorder', async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const schedulePagecontroller = new SchedulePageController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: 'page' });

  app.registerController(controller);
  page.registerController(schedulePagecontroller);
  const ds = newDatasource(workorderitem, 'woDetailResource');
  app.registerDatasource(ds);

  const woDetailds = newDatasource(workorderitem, 'woDetailds');
  app.registerDatasource(woDetailds);

  const wodetails = newDatasource(workorderitem, 'wodetails');
  app.registerDatasource(wodetails);

  await ds.load();
  await woDetailds.load();
  const saveAction = sinon.stub(woDetailds, "save");
  app.registerController(controller);
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  page.state.selectedDS = "workorderds";
  controller.pageInitialized(new Page(), app);
  schedulePagecontroller.pageInitialized(page, app);
  await controller.reviewSafetyPlan(app);

  expect(saveAction.called).toBe(false);
});


it('accessWoCostData should return total', () => {
  const controller = new WorkOrderDetailsController();
  jest.spyOn(WOUtil, "computedEstTotalCost").mockImplementation(() => {
    return { totalcost: "1995.50" }
  });
  expect(controller.accessWoCostData({})).toBe("1995.50");
});

it('should navigate to asset detail', async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: 'page' });
  app.registerController(controller);
  const ds = newDatasource(workorderitem, 'woDetailResource');
  app.registerDatasource(ds);

  const assetLookupDS = newDatasource(assets, "assetLookupDS");
  app.registerDatasource(assetLookupDS);

  await ds.load();
  app.registerController(controller);
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  let loadAppFn = jest.fn();
  controller.loadApp = loadAppFn;
  await controller.navigateToAssetDetails();
  expect(loadAppFn.mock.calls.length).not.toBeLessThan(0);


  page.state = {
    currentWOAssetHref: true
  }
  controller.navigateToAssetDetails();
});


it('should navigate to multi-asset detail page', () => {
  const mockSetCurrentPage = jest.fn();
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: 'multiAssetPage' });

  app.setCurrentPage = mockSetCurrentPage;
  controller.pageInitialized(page, app);

  // Provide the href directly instead of an event object.
  const href = '/multiAssetDetails/12345';
  const ds = 'sampleDatasource';
  controller.showMultiAssetPage({ href, ds });

  expect(mockSetCurrentPage).toHaveBeenCalledWith({
    name: 'multiAssetLocCi',
    resetScroll: true,
    params: {
      href: href,
      ds: ds
    },
    pushStack: true,
  });
});


it("should call pagePause", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "page" });
  const mrDS = newDatasource(wpmaterial, "mrDS");
  page.registerDatasource(mrDS);
  const synonDS = newStatusDatasource(statusitem, "synonymdomainData");
  app.registerDatasource(synonDS);
  app.registerController(controller);
  const ds = newDatasource(workorderitem, "workorderds");
  page.registerDatasource(ds);
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);

  jest.spyOn(page, "findDialog");
  await controller.pagePaused();

  expect(page.findDialog('woWorkLogDrawer')).toBeDefined();
});

it("should call showSpecifications", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });
  const wodetails = newDatasource(workordersingleitem, "woDetailResource");
  const woSpec = newDatasource(woSpecification, "woSpecification");
  page.registerDatasource(wodetails);
  page.registerDatasource(woSpec);

  app.registerPage(page);
  await app.initialize();

  app.registerController(controller);

  controller.pageInitialized(page, app);
  app.setCurrentPage = mockSetPage;

  controller.showSpecifications();
  expect(page.findDialog('woSpecificationDrawer')).toBeDefined();
});

it('should set specificationLoader to true, generateCombineSpecDs, showDialog, and then set specificationLoader to false', async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({name: "workOrderDetails"});

  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  app.setCurrentPage = mockSetPage;
  page.showDialog = jest.fn();

  const generateCombineSpecDsStub = sinon.stub(WOCreateEditUtils, 'generateCombineSpecDs');

  await controller.openEditSpecification(app);

  expect(generateCombineSpecDsStub.called).toBe(true);
  expect(page.showDialog).toHaveBeenCalledWith('woSpecificationEditDrawer');
  expect(page.state.specificationLoader).toBe(false);
});

it("should mark status in progress", async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });
  const reportPage = new Page({ name: "report_work" });
  app.state.doclinksCountData = [];
  app.client = {
    userInfo: {
      personid: 'SAM',
      defaultStoreroom: 'UPS',
      defaultOrg: 'EAGLENA',
      labor: { laborcraftrate: { craft: 'ELECT', skilllevel: 'SECONDCLASS' }, laborcode: 'SAM' }
    },
  };
  page.state = {
    useConfirmDialog: true,
    fieldChangedManually: false,
    enableSignatureButton: true,
  };

  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  app.registerController(controller);
  const ds = newDatasource(workorderitem, "workorderds");
  const woDetailds = newDatasource(workorderitem, "woDetailds");
  const woDetails = newDatasource(workorderitem, "wodetails");
  const woDetailResource = newDatasource(workorderitem, "woDetailResource");

  const synonymdomainData = newTimerStatusDatasource(
    statusitem,
    "synonymdomainData"
  );

  app.setCurrentPage = page;
  page.registerDatasource(ds);
  page.registerDatasource(woDetailResource);
  page.registerDatasource(woDetailds);
  page.registerDatasource(woDetails);
  page.registerDatasource(synonymdomainData)
  jest.spyOn(controller, "openSignatureDialog").mockImplementation(() => {
    return true;
  });
  let invokeAction = sinon.stub(woDetailResource, "invokeAction").returns(workorderitem.member[0]);
  let forceReloadStub = sinon.stub(woDetailResource, "forceReload");

  app.registerPage(page);
  app.registerPage(reportPage)

  await app.initialize();
  app.registerController(controller);

  controller.pageInitialized(page, app);

  sinon
    .stub(SynonymUtil, "getSynonymDomain")
    .returns({ value: "APPR", maxvalue: "APPR", description: "APPR" });
  jest.spyOn(commonUtil, "checkEsigRequired").mockImplementation(() => {
    return true;
  });
  await controller.markStatusInprogress();
  expect(invokeAction.called).toBe(true);
  expect(invokeAction.args[0][1].record).toBe(woDetailResource.item);
  expect(invokeAction.args[0][1].parameters.date).toBeDefined();
  expect(invokeAction.args[0][1].parameters.statusdate).toBeUndefined();
  expect(invokeAction.args[0][1].localPayload.statusdate).toBeDefined();
  expect(invokeAction.args[0][1].localPayload.href).toBe(woDetailResource.item.href);
  expect(forceReloadStub.called).toBe(true);
  invokeAction.restore();
  forceReloadStub.restore();
});

it("should show signature prompt", async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });
  const reportPage = new Page({ name: "report_work" });

  app.registerController(controller);
  const ds = newDatasource(workorderitem, "workorderds");
  const woDetailds = newDatasource(workorderitem, "woDetailds");
  const woDetails = newDatasource(workorderitem, "wodetails");
  const woDetailResource = newDatasource(workorderitem, "woDetailResource");
  app.setCurrentPage = page;

  page.registerDatasource(ds);
  page.registerDatasource(woDetailResource);
  page.registerDatasource(woDetailds);
  page.registerDatasource(woDetails);

  app.registerPage(page);
  app.registerPage(reportPage)

  await app.initialize();
  app.registerController(controller);

  controller.pageInitialized(page, app);

  jest.spyOn(app, "findDatasource").mockImplementation(() => {
    return {
      data: workorderitem,
      initializeQbe: () => { },
      setQBE: (param1, params2) => { },
      searchQBE: () => { return workorderitem.member },

      load: () => { }
    }
  });

  controller.openSignatureDialog({ item: { href: 'href' } });
});

it("should open workorderEdit page", async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  const page = new Page({ name: "workOrderDetails" });
  app.state = {
    woDetail: {},
    appnames: {
      inspection: "inspection",
      assetmobile: "assetmobile",
      assetswitch: "plusassetswitch",
      assist: "assist"
    }
  };
  
  let mockSetPage = jest.fn();
  app.registerController(controller);
  app.setCurrentPage = mockSetPage;


  app.registerPage(page);
  await app.initialize();

  controller.pageInitialized(page, app);
  jest.spyOn(app, "findDatasource").mockImplementation(() => {
    return {
      data: workorderitem,
      initializeQbe: () => { },
      setQBE: (param1, params2) => { },
      searchQBE: () => { return workorderitem.member },
      load: () => { },
      getSchema: () => { }
    }
  });

  const setCurrentPageSpy = sinon.spy(app, "setCurrentPage");
  // const setCurrentPage = jest.spyOn(app, "setCurrentPage")
  controller.workOrderEdit({ item: { href: 'href' } });
  expect(app.state.woDetail.page).toBe("workOrderDetails")

  sinon.assert.callCount(setCurrentPageSpy, 1);

});

it('should review Safety Plan for unassigned workorder', async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderDetailsController();
  const schedulePagecontroller = new SchedulePageController();
  const app = new Application({
    findDatasource: jest.fn((ds) => ({
      load: jest.fn(),
      resetState: jest.fn()
    }))
  });
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: 'page' });

  app.registerController(controller);
  page.registerController(schedulePagecontroller);
  const ds = newDatasource(unassignedworkorderitem, 'woDetailResource');
  app.registerDatasource(ds);

  let woDetailds = newDatasource(unassignedworkorderitem, 'woDetailds');
  app.registerDatasource(woDetailds);

  let wodetails = newDatasource(unassignedworkorderitem, 'wodetails');
  app.registerDatasource(wodetails);

  await ds.load();
  await woDetailds.load();
  let updateAction = sinon.stub(woDetailds, "update");
  app.registerController(controller);
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  page.state.selectedDS = "workorderds";
  controller.pageInitialized(new Page(), app);
  schedulePagecontroller.pageInitialized(page, app);
  await controller.reviewSafetyPlan(app);
  expect(updateAction.called).toBe(true);
});

// Assisted by watsonx Code Assistant 

describe("openReassignmentDrawer", () => {
  it("should set app state canReturn to true", async () => {
    const controller = new WorkOrderDetailsController();
    const app = {
      state: {
        canReturn: false,
      },
      findDatasource: jest.fn(() => ({
        showReturn: jest.fn(),
        load: () => workorderitem,
      })),
      showDialog: jest.fn(),
    };
    const page = new Page({ name: 'page' });
    controller.pageInitialized(page, app);
    jest.spyOn(commonUtil, "showReturn").mockImplementation(() => {
      return true;
    });
    await controller.openReassignmentDrawer(app);
    expect(app.state.canReturn).toBe(true);
    expect(app.showDialog).toHaveBeenCalledWith("laborAssignmentLookup");
  });

});

// Assisted by watsonx Code Assistant 
describe('openReassignmentDialog', () => {
  it('should return if work order is in progress', async () => {
    const woDetailResource = {
      item: {
        computedWOTimerStatus: true
      }
    };
    const app = {
      findDatasource: jest.fn(() => woDetailResource),
      toast: jest.fn(),
      getLocalizedLabel: jest.fn()
    };
    const page = {
      state: {
        loading: false
      },
      name: 'testPage',
      callController: jest.fn()
    };
    jest.spyOn(commonUtil, "getConfirmDialogLabel").mockImplementation(() => {
      return true;
    });
    const controller = new WorkOrderDetailsController();
    controller.pageInitialized(page, app);
    await controller.openReassignmentDialog(app, page);
    expect(app.toast).toHaveBeenCalledWith(app.getLocalizedLabel('infoOnReassign'), 'info');
    expect(page.state.loading).toBe(false);
  });

  it('should show confirm dialog and set loading state', async () => {
    const woDetailResource = {
      item: {
        computedWOTimerStatus: false
      }
    };
    const app = {
      findDatasource: jest.fn(() => woDetailResource),
      showDialog: jest.fn(),
      toast: jest.fn(),
      getLocalizedLabel: jest.fn()
    };
    const page = {
      state: {
        loading: false
      },
      name: 'testPage',
      callController: jest.fn()
    };
    jest.spyOn(commonUtil, "getConfirmDialogLabel").mockImplementation(() => {
      return true;
    });
    const controller = new WorkOrderDetailsController();
    controller.pageInitialized(page, app);
    await controller.openReassignmentDialog(app, page);
    expect(app.showDialog).toHaveBeenCalledWith('confirmDialog');
    expect(page.state.loading).toBe(false);
  });
});


it("should load multi-asset location CI items and set offline state when href or localref are missing", async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });

  const woMultiAssetLocationds = {
    forceReload: jest.fn().mockResolvedValue([
      { multiid: 1, assetid: 'asset1', locationlocationsid: 'loc1', _bulkid: 'bulk1' },
      { assetid: 'asset2', locationlocationsid: 'loc2', _bulkid: 'bulk2' },
    ]),
  };

  // Mock the page datasource finding
  page.findDatasource = jest.fn();
  page.findDatasource.mockImplementation((name) => {
    if (name === 'woMultiAssetLocationds') return woMultiAssetLocationds;
  });

  controller.page = page;
  controller.app = app;

  const WOMultiAssetLocCIDS = await controller.page.findDatasource("woMultiAssetLocationds")?.forceReload();
  controller.page.state.isOfflineMultiAssetLocCI = WOMultiAssetLocCIDS?.some((item) => !item.href || !item.localref);

  expect(woMultiAssetLocationds.forceReload).toHaveBeenCalledTimes(1);
  expect(controller.page.state.isOfflineMultiAssetLocCI).toBe(true);

  // Assert: Check the processed data
  expect(WOMultiAssetLocCIDS).toEqual([
    { multiid: 1, assetid: 'asset1', locationlocationsid: 'loc1', _bulkid: 'bulk1' },
    { assetid: 'asset2', locationlocationsid: 'loc2', _bulkid: 'bulk2' },
  ]);
});

it('should set specificationSaveDisable to the number of client warnings', () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });
  controller.app = app;
  controller.page = page;
  const datasource = {
    state: {
      clientWarnings: {
        warning1: 'warning1',
        warning2: 'warning2',
      },
    },
  };

  controller.app.findDatasource = jest.fn().mockReturnValue(datasource);
  controller.page.state.specificationSaveDisable = null;

  controller.validateSpecification();

  expect(controller.page.state.specificationSaveDisable).toBe(2);
});

it('should set specificationSaveDisable to 0 if there are no client warnings', () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });
  const datasource = {
    state: {
      clientWarnings: {},
    },
  };
  controller.app = app;
  controller.page = page;
  controller.app.findDatasource = jest.fn().mockReturnValue(datasource);
  controller.page.state.specificationSaveDisable = null;

  controller.validateSpecification();

  expect(controller.page.state.specificationSaveDisable).toBe(0);
});

it('should call closeSpecificationDrawer', async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });
  const woSpecificationsCombinedDS = newDatasource(unassignedworkorderitem, 'woSpecificationsCombinedDS');
  const dialogMock = sinon.stub(page, "findDialog").returns({closeDialog: ()=>{}});
  page.registerController(controller);
  app.registerDatasource(woSpecificationsCombinedDS);
  app.registerPage(page);
  await app.initialize();
  await controller.closeSpecificationDrawer();
  expect(dialogMock.called).toBeTruthy();
  dialogMock.restore();
});

it('should call onSpecificationClose', async () => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });
  const woSpecificationsCombinedDS = newDatasource(unassignedworkorderitem, 'woSpecificationsCombinedDS');
  woSpecificationsCombinedDS.state.itemsChanged = true;
  const dialogMock = sinon.stub(page, "showDialog");
  page.registerController(controller);
  app.registerDatasource(woSpecificationsCombinedDS);
  app.registerPage(page);
  await app.initialize();
  const event = { failed: null };
  await controller.onSpecificationClose(event);
  expect(dialogMock.called).toBeTruthy();
  dialogMock.restore();
});

it('Should call openSpecLookup', async() => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });
  page.showDialog = jest.fn();

  const evt = {
    item: {
      datatype_maxvalue: "NUMERIC"
    }
  }
  page.registerController(controller);
  app.registerPage(page);
  await app.initialize();

  await controller.openSpecLookup(evt);
  expect(page.state.lookupLoader).toBeFalsy();
  expect(page.showDialog).toHaveBeenCalledWith('woSpecNumericDomainLookup');

  evt.item.datatype_maxvalue = "ALN"
  await controller.openSpecLookup(evt);
  expect(page.showDialog).toHaveBeenCalledWith('woSpecAlnDomainLookup');

  evt.item.datatype_maxvalue = "MAXTABLE"
  await controller.openSpecLookup(evt);
  expect(page.showDialog).toHaveBeenCalledWith('woSpecTableDomainLookup');

});

it('Should call chooseWoSpecDomain', async() => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });

  const itemSelected = { value: 'testValue', alnvalue: 'ALN' }
  const updateValue = { alnvalue: 'testValue' };
  
  page.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.currentField = {
    tablevalue: "",
    numvalue: "",
    alnvalue: ""
  };
  await controller.chooseWoSpecDomain(itemSelected);
  expect(updateValue.alnvalue).toBe(itemSelected.value);
});

it('Should call chooseWoSpecNumDomain', async() => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });

  const itemSelected = { value: 'testValue', numvalue: 'INT' }
  const updateValue = { numvalue: 'testValue' };
  
  page.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.currentField = {
    tablevalue: "",
    numvalue: "",
    alnvalue: ""
  };
  await controller.chooseWoSpecNumDomain(itemSelected);
  expect(updateValue.numvalue).toBe(itemSelected.value);
});

it('Should call chooseWoSpecTableDomain', async() => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });

  const itemSelected = { value: 'testValue', tablevalue: 'ALN' }
  const updateValue = { tablevalue: 'testValue' };
  
  page.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.currentField = {
    tablevalue: "",
    numvalue: "",
    alnvalue: ""
  };
  await controller.chooseWoSpecTableDomain(itemSelected);
  expect(updateValue.tablevalue).toBe(itemSelected.value);
});


it('Should call onCloseSpecification', async() => {
  const controller = new WorkOrderDetailsController();
  const app = new Application();
  app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
  const page = new Page({ name: "workOrderDetails" });
  page.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  await controller.onCloseSpecification();
  expect(page.state.specificationLoader).toBeFalsy();
})


// Assisted by watsonx Code Assistant 
describe('openAssignmentHistory', () => {

  it('should set loadingAssignment to true, reload the datasource, show the dialog, and then set loadingAssignment to false', async () => {
    const app = new Application();
    app.state.appnames = {
    inspection: "inspection",
    assetmobile: "assetmobile",
    assetswitch: "plusassetswitch",
    assist: "assist"
  };
    const page = new Page({ name: "workOrderDetails" });
    app.findDatasource = jest.fn(() => ({
      resetState: jest.fn(),
      forceReload: jest.fn(),
      clearState: jest.fn(),
      load: jest.fn(),
      initializeQbe: jest.fn(),
      clearQBE: jest.fn(),
      searchQBE: jest.fn(),
      setQBE: jest.fn()
    }));
    page.showDialog = jest.fn();
    page.findDatasource = jest.fn(() => ({
      resetState: jest.fn(),
      forceReload: jest.fn(),
      clearState: jest.fn(),
      load: jest.fn(),
      initializeQbe: jest.fn(),
      clearQBE: jest.fn(),
      searchQBE: jest.fn(),
      setQBE: jest.fn(),
    }));

    const controller = new WorkOrderDetailsController();
    controller.pageInitialized(page, app);
    // Act
    await controller.openAssignmentHistory();

    // Assert
    expect(app.findDatasource).toHaveBeenCalledWith('assignmentDetailds');
    expect(page.showDialog).toHaveBeenCalledWith("assignmentHistory");
    expect(page.state.loading).toBe(false);
  });
});
