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

import ReportWorkPageController from "./ReportWorkPageController";
import {
  Application,
  Page,
  JSONDataAdapter,
  Datasource, Device,
  Dialog
} from "@maximo/maximo-js-api";
import workorderitem from "./test/wo-failure-report-json-data";
import manufacturer from "./test/manufacturer-json-data.js";
import labor from "./test/labors-json-data";
import sinon from 'sinon';
import statusitem from './test/statuses-json-data';
import failurelist from './test/failurelist-json-data';
import wpmaterial from './test/materials-json-data';
import wolocationmeters from './test/locationmeter-json-data';
import invbalances from './test/invbal-json-data ';
import woassetmeters from './test/assetmeter-json-data';
import toolDetail from './test/tools-json-data';
import toolInventory from './test/tool-inventory-json-data';
import toolLocation from "./test/tool-location-json-data";
import SynonymUtil from './utils/SynonymUtil';
import CommonUtil from './utils/CommonUtil';
import tasklist from './test/task-list-json-data.js';
import WOUtil from './utils/WOUtil.js';
import WOTimerUtil from './utils/WOTimerUtil.js'

function newSetIdDatasource(data = statusitem, name = 'defaultSetDs') {
	const da = new JSONDataAdapter({
		src: data,
		items: 'member'
	});
	const ds = new Datasource(da, {
		idAttribute: 'value',
		name: name,
	});
	return ds;
}

function newWoDatasource(data = workorderitem, name = "workorderds") {
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
function newLaborDetailDatasource(data = labor, name = "woLaborDetailds") {
  const da = new JSONDataAdapter({
    src: data,
    items: "c",
  });

  const ds = new Datasource(da, {
    idAttribute: "labtransid",
    name: name,
  });

  return ds;
}
function materialDatasource(data = wpmaterial, idAttribute = 'wonum', items = 'member', name = 'inventoryDS') {
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
function newDatasource(data = workorderitem, items = "member", idAttribute = "wonum", name = "woDetailsReportWork") {
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

function newDatasource1(data, name = "inventbalDS") {
  const da = new JSONDataAdapter({
    src: data,
    items: "member",
  });

  const ds = new Datasource(da, {
    idAttribute: "idAttribute",
    name: name,
  });

  return ds;
}

function newStatusDatasource(data = statusitem, name = 'reportworksSynonymData') {
  const da = new JSONDataAdapter({
    src: data,
    items: 'member',
    schema: 'responseInfo.schema'
  });
  const ds = new Datasource(da, {
    idAttribute: 'value',
    name: name
  });
  return ds;
}

function newTimerStatusDatasource(data = statusitem, name = 'synonymdomainData') {
  const da = new JSONDataAdapter({
    src: data,
    items: 'member',
    schema: 'responseInfo.schema'
  });

  const ds = new Datasource(da, {
    idAttribute: 'value',
    name: name
  });

  return ds;
}

function newTaskDatasource(data = tasklist, name = 'woPlanTaskDetailds') {
  const da = new JSONDataAdapter({
      src: data,
      items: 'member',
      schema: 'responseInfo.schema'
  });
  const ds = new Datasource(da, {
      idAttribute: 'taskid',
      name: name
  });
  return ds;
}

let singleAsset = {
  member: [
    {
      assetnum: "R ASSET1",
      description: "Testing tool",
      href: "oslc/os/mxapiasset/_UiBBU1NFVDEvQkVERk9SRA--",
      itemnum: "TOOL1",
      location: "PKG",
      siteid: "BEDFORD",
      _rowstamp: "4387136"
    }
  ]
};

let singleBin = {
  member: [
    {
      itemnum: "TORCH",
      _rowstamp: "932187",
      curbal: 2.0,
      invbalancesid: 848,
      binnum: "Tools",
      lotnum: "",
      siteid: "BEDFORD",
      location: "CENTRAL",
      href: "oslc/os/mxapiinvbal/_VG9vbHMvfk5VTEx_L1RPUkNIL1NFVDEvQ0VOVFJBTC9_TlVMTH4vQkVERk9SRA--"
    }
  ]
};

let singleBlankBin = {
  member: [
    {
      itemnum: "TORCH",
      _rowstamp: "932187",
      curbal: 2.0,
      invbalancesid: 848,
      binnum: "",
      lotnum: "",
      siteid: "BEDFORD",
      location: "CENTRAL",
      href: "oslc/os/mxapiinvbal/_VG9vbHMvfk5VTEx_L1RPUkNIL1NFVDEvQ0VOVFJBTC9_TlVMTH4vQkVERk9SRA--"
    }
  ]
};

let multiBin = {
  member: [
    {
      itemnum: "TORCH",
      _rowstamp: "932187",
      curbal: 2.0,
      invbalancesid: 848,
      binnum: "Tools",
      siteid: "BEDFORD",
      location: "CENTRAL",
      href: "oslc/os/mxapiinvbal/_VG9vbHMvfk5VTEx_L1RPUkNIL1NFVDEvQ0VOVFJBTC9_TlVMTH4vQkVERk9SRA--"
    },
    {
      itemnum: "TORCH",
      _rowstamp: "932188",
      curbal: 2.0,
      invbalancesid: 843,
      binnum: "D-2-5",
      siteid: "BEDFORD",
      location: "CENTRAL",
      href: "oslc/os/mxapiinvbal/_VG9vbHMvfk5VTEx_L1RPUkNIL1NFVDEvQ0VOVFJBTC9_TlVMTH4vQkVERk9SRA--"
    }
  ]
};

let singleLocation = {
  member: [
    {
      _rowstamp: "132642",
      description: "Packaging Dept. Storeroom",
      siteid: "BEDFORD",
      location: "PKG",
      href: "oslc/os/mxapilocations/_UEtHL0JFREZPUkQ-"
    }
  ]
};

let taskDetail = {
  member: [
    {
      description: "scheduling",
      href: "http://childkey#V09SS09SREVSL1dPQUNUSVZJVFkvQkVERk9SRC9UMTA4MA--",
      localref: "oslc/os/mxapiwodetail/_QkVERk9SRC8xMjEx/woactivity/1-133366",
      status: "APPR",
      status_description: "Approved",
      status_maxvalue: "APPR",
      taskid: 10,
      parent: '1202',
      workorderid: 'WO120210'
    },
    {
      description: "scheduling",
      href: "http://childkey#V09SS09SREVSL1dPQUNUSVZJVFkvQkVERk9SRC9UMTA4MA--",
      localref: "oslc/os/mxapiwodetail/_QkVERk9SRC8xMjEx/woactivity/1-133366",
      status: "APPR",
      status_description: "Approved",
      status_maxvalue: "APPR",
      taskid: 20,
      parent: '1202',
      workorderid: 'WO120220'
    }
  ]
};

let toolJson = {
  member: [
    {
      itemid: 282,
      item_itemnum: "TORCH",
      item_description: "OXYGEN ACETYLENE CUTTING UNITS",
      href: "oslc/os/mxapitoolitem/_VE9SQ0gvU0VUMQ--",
      _rowstamp: "94666",
      rotassetnum: "",
      toolhrs: 2,
      toolqty: 3,
      storeloc: "CENTRAL",
    },
  ],
};

let toolCalJson = {
  member: [
    {
      itemid: 282,
      item_itemnum: "TORCH",
      item_description: "OXYGEN ACETYLENE CUTTING UNITS",
      href: "oslc/os/mxapitoolitem/_VE9SQ0gvU0VUMQ--",
      _rowstamp: "94666",
      rotassetnum: "AST001",
      toolhrs: 2,
      toolqty: 3,
      storeloc: "CENTRAL",
      assetnum: "AST001",
      pluscexpirydate: "10/10/2024",
      plusctype: "TYPE1",
      plusclotnum: "LOTNO1",
      pluscmanufacturer: "MANFACTURER"
    },
  ],
};

let materialJson = {
  member: [
    {
      item_itemnum: "ROTATING ITEM",
      assetnum: "1007",
      storeloc: "CENTRAL",
      positivequantity: 0,
    },
  ],
};


it("should load work order data with failure report", async () => {
  let setFailureReportData = jest.fn();

  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  app.client = {
    userInfo: {
      personid: 'SAM',
      defaultSite: 'BEDFORD',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}}
    }
  };
  app.registerController(controller);

  const reportworksSynonymData = newStatusDatasource(statusitem, "reportworksSynonymData");
  page.registerDatasource(reportworksSynonymData);

  const inventoryDS = materialDatasource(wpmaterial, 'member', 'inventoryDS');
  const synonymDSData = newStatusDatasource(statusitem, 'synonymDSData');
  const locationDS = newStatusDatasource(wolocationmeters, 'locationDS');
  const itemsDS = newDatasource(wpmaterial, 'member', 'itemnum', 'itemsDS');

  const workorderitemData = {...workorderitem};
  workorderitemData.member[0].flowcontrolled = true;
  workorderitemData.member[0].iscalibration = true;
  workorderitemData.member[0].pluscwodscount = 2;
  const woReportWorkDs = newDatasource(workorderitemData, "member", "wonum", "woDetailsReportWork");
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLaborDetailds");
  const reportWorkActualMaterialDs = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  app.registerDatasource(newWoDatasource(workorderitem, "woDetailds"));
  page.registerDatasource(craftrate);
  page.registerDatasource(woReportWorkDs);
  page.registerDatasource(reportworkLabords);
  page.registerDatasource(inventoryDS);
  page.registerDatasource(synonymDSData);
  page.registerDatasource(locationDS);
  page.registerDatasource(reportWorkActualMaterialDs);
  app.registerDatasource(itemsDS);

  app.registerPage(page);
  await app.initialize();

  controller.setFailureReportData = setFailureReportData;
  app.state = {
    systemProp: {
      'maximo.mobile.statusforphysicalsignature': 'APPR,WAPPR'
    },
  };
  controller.pageInitialized(page, app);

  reportworksSynonymData.load();
  app.state.incomingContext = {page: 'report_work', itemnum: '123232', itemsetid:'SET1'};
  sinon.stub(SynonymUtil, 'getSynonym').returns({value: 'WAPPR', maxvalue: 'WAPPR', description: 'WAPPR'});

  page.registerDatasource(itemsDS);
  await controller.loadRecord();
  expect(page.state.apprIntLabTrans).toEqual(1);
  expect(page.state.apprExtLabTrans).toEqual(0);
  expect(page.state.causeValue).toEqual("");
  expect(page.state.remedyValue).toEqual("");
  expect(page.state.itemnum).toEqual(undefined);
  return woReportWorkDs.forceReload().then(() => {
    expect(controller.setFailureReportData).toHaveBeenCalledTimes(1);
    expect(setFailureReportData.mock.calls[0][0]).toEqual(workorderitem.member);
  });
});

it("should set cause and remedy in page state when record is passed", async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});

  const failureListDS = newDatasource(failurelist, "member", "failurelist", "dsFailureList");
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const woDetailsReportWork = newDatasource(wpmaterial, "wodetails", "wonum", "woDetailsReportWork");
  const craftRate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const woReportWorkDs1 = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  page.registerDatasource(woReportWorkDs1);
  failureListDS.load();
  app.registerDatasource(failureListDS);
  app.registerController(controller);
  app.registerPage(page);
  page.dsFailureList = failureListDS;
  page.registerDatasource(reportworkLabords);
  page.registerDatasource(woDetailsReportWork);
  page.registerDatasource(craftRate);

  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  await app.initialize();
  controller.pageInitialized(page, app);

  expect(page.state.causeValue).toEqual(undefined);
  expect(page.state.remedyValue).toEqual(undefined);
  await controller.setFailureReportData(workorderitem.member);
  expect(page.state.causeValue).toEqual("Carton Spillage");
  expect(page.state.remedyValue).toEqual("Adjusted Timing of Lifter");
});

it("should set cause and remedy in page state in container mode", async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});

  const failureListDS = newDatasource(failurelist, "member", "failurelist", "dsFailureList");
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const woDetailsReportWork = newDatasource(wpmaterial, "wodetails", "wonum", "woDetailsReportWork");
  const craftRate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const woReportWorkDs1 = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  page.registerDatasource(woReportWorkDs1);
  failureListDS.load();
  app.registerDatasource(newWoDatasource(workorderitem, "woDetailds"));
  app.registerDatasource(failureListDS);
  app.registerController(controller);
  app.registerPage(page);
  page.dsFailureList = failureListDS;
  page.registerDatasource(reportworkLabords);
  page.registerDatasource(woDetailsReportWork);
  page.registerDatasource(craftRate);
  const materialsDrawer = new Dialog({name: "materialsDrawer"});
  page.registerDialog(materialsDrawer);
  page.showDialog = jest.fn();
  materialsDrawer.closeDialog = jest.fn();

  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };

  Device.get().isMaximoMobile = true;

  await app.initialize();
  controller.pageInitialized(page, app);

  expect(page.state.causeValue).toEqual(undefined);
  expect(page.state.remedyValue).toEqual(undefined);
  await controller.setFailureReportData(workorderitem.member);
  expect(page.state.causeValue).toEqual("Carton Spillage");
  expect(page.state.remedyValue).toEqual("Adjusted Timing of Lifter");
  expect(page.state.failureClassValue).toEqual("Packaging Line Failures");
  expect(page.state.problemValue).toEqual("Lift and Filling System");

  workorderitem.member[0].failureclassdelete = true;
  workorderitem.member[0].problemdelete = true;
  await controller.setFailureReportData(workorderitem.member);
  expect(page.state.failureClassValue).toEqual('');
  expect(page.state.problemValue).toEqual('');

  workorderitem.member[0].failureclassdelete = false;
  workorderitem.member[0].problemdelete = false;
  workorderitem.member[0].causedelete = true;
  workorderitem.member[0].remedydelete = true;

  await controller.setFailureReportData(workorderitem.member);
  expect(page.state.causeValue).toEqual('');
  expect(page.state.remedyValue).toEqual('');

  workorderitem.member[0].failurereport = undefined;
  await controller.setFailureReportData(workorderitem.member);
  expect(page.state.failureClassValue).toEqual('Packaging Line Failures');
  Device.get().isMaximoMobile = false;
});

it("should not set cause and remedy in page state when no record passed", async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  const failureListDS = newDatasource(failurelist, "member", "failurelist", "dsFailureList");
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const woDetailsReportWork = newDatasource(labor, "wodetails", "wonum", "woDetailsReportWork");
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const woReportWorkDs1 = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  page.registerDatasource(woReportWorkDs1);
  page.registerDatasource(craftrate);
  app.registerDatasource(failureListDS);
  page.registerDatasource(reportworkLabords);
  page.registerDatasource(woDetailsReportWork);

  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();

  controller.pageInitialized(page, app);
  await controller.setFailureReportData();
  expect(page.state.causeValue).toEqual('');
  expect(page.state.remedyValue).toEqual('');
});

it("it should set saveDataSuccessful to false ", async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const labordetails = newDatasource(labor, "labordetails1", "labtransid", "reportworkLaborDetailds");
  const woReportWorkDs = newDatasource(workorderitem, 'member', 'wonum', 'reportWorkActualToolsDetailDs');
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const woReportWorkDs1 = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  page.registerDatasource(woReportWorkDs1);
  page.registerDatasource(craftrate);
  page.registerDatasource(reportworkLabords);
  page.registerDatasource(labordetails);
  page.registerDatasource(woReportWorkDs);
  page.registerDatasource(wodetails);
  app.registerDatasource(synonymdomainData);
  app.registerController(controller);
  app.registerPage(page);
  app.lastPage = { name: "report_work" };
  await app.initialize();
  controller.pageInitialized(page, app);
  controller.onSaveDataFailed();
  expect(controller.saveDataSuccessful).toBe(false);      
});

it('Verify onCustomSaveTransition function', async () => {
	let mockedFn = jest.fn();
	const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
		userInfo: {
			personid: 'SAM',
      insertSite: 'BEDFORD',
			labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
		},
	};
  const calibStub = sinon.stub(controller, 'isCalibrationWo').returns(true);
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const woDetailsReportWork = newDatasource(wpmaterial, "wodetails", "wonum", "woDetailsReportWork");
  const labordetails = newDatasource(labor, "labordetails1", "labtransid", "reportworkLaborDetailds");
	const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
	const tooldetailDs = newDatasource(workorderitem, 'member', 'wonum', 'reportWorkActualToolsDetailDs');
	const woReportWorkDs = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDs');
	const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  const woReportWorkDs1 = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  page.registerDatasource(woReportWorkDs1);
  page.registerDatasource(reportworkLabords);
  page.registerDatasource(woDetailsReportWork);
	page.registerDatasource(labordetails);
	page.registerDatasource(craftrate);
	page.registerDatasource(tooldetailDs);
	page.registerDatasource(woReportWorkDs);
	app.registerDatasource(synonymdomainData);
  app.registerController(controller);
  app.registerPage(page);
  controller.pageInitialized(page, app);

  page.state = { callMethodAction: 'LABOR' };
  controller.saveLaborTransaction = mockedFn;	
	await app.initialize();
  await controller.onCustomSaveTransition();
  
  page.state = { callMethodAction: 'TOOL' };
  page.state.disableToolAction = false;
  controller.saveToolDetail = mockedFn;	
	await app.initialize();
  await controller.onCustomSaveTransition();

  page.state = { callMethodAction: 'TOOL' };
  page.state.disableToolAction = true;
  let value1 = await controller.onCustomSaveTransition();
  expect(value1.saveDataSuccessful).toBe(true);
  expect(value1.callDefaultSave).toBe(false);

  page.state = { callMethodAction: 'MATERIAL' };
  page.state.disableAction = false;
  controller.saveMaterialTransaction = mockedFn;	
	await app.initialize();
  await controller.onCustomSaveTransition();

  page.state = { callMethodAction: 'MATERIAL' };
  page.state.disableAction = true;
  let value2 = await controller.onCustomSaveTransition();
  expect(value2.saveDataSuccessful).toBe(true);
  expect(value2.callDefaultSave).toBe(false);

  page.state = { callMethodAction: 'LABOR' };
  page.state.errorMessage = true;
  controller.saveLaborTransaction = mockedFn;	
	await app.initialize();
  await controller.onCustomSaveTransition();
  calibStub.restore();
});

it("Open the labor time drawer in update mode", async () => {
  let showDialog = jest.fn();
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  page.showDialog = showDialog;

  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);

  const reportworksSynonymData = newStatusDatasource(statusitem, "reportworksSynonymData");
  page.registerDatasource(reportworksSynonymData);

  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const labordetails = newDatasource(labor, "labordetails", "labtransid", "reportworkLaborDetailds");
  const laborDs = newDatasource(labor, "labordetails", "labtransid", "laborDs");
  const woDetailsReportWork = newDatasource(wpmaterial, "wodetails", "wonum", "woDetailsReportWork");
  const taskLookupDS = newDatasource(taskDetail, 'member', 'taskid', 'woTaskds');
  const woReportWorkDs1 = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  page.registerDatasource(woReportWorkDs1);
  page.registerDatasource(craftrate);
  page.registerDatasource(labordetails);
  page.registerDatasource(woDetailsReportWork);
  app.registerDatasource(laborDs);
  page.registerDatasource(taskLookupDS);

  await woDetailsReportWork.load();
  let labtrans = await labordetails.load();
  sinon.stub(labordetails, "addNew").returns(labtrans);
});

it("Opens the premiumPayLookup dialog", async () => {
  let showDialog = jest.fn();
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({ name: "report_work" });
  page.showDialog = showDialog;

  let evt = {
    page: {
      showDialog: showDialog,
    },
  };

  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);

  await controller.openPremiumPayCodeLookup(evt);
  expect(evt.page.showDialog).toHaveBeenCalledWith("premiumPayLookup");
});

it("Open the labor time drawer in add mode", async () => {
  let showDialog = jest.fn();
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work", state: {action: 'add',selectedLabors : new Map()}});
  page.showDialog = showDialog;

  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'},
    }
  };
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();

  const synonymdomainData = newTimerStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainData);
  const reportworksSynonymData = newStatusDatasource(statusitem, "reportworksSynonymData");
  page.registerDatasource(reportworksSynonymData);

  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const premiumpayJsonDS = newDatasource(labor, "craftrate", "craft", "premiumpayJsonDS");
  const labordetails = newDatasource(labor, "labordetails", "labtransid", "reportworkLaborDetailds");
  const woDetailsReportWork = newDatasource(labor, "wodetails", "wonum", "woDetailsReportWork");
  const inventoryDS = materialDatasource(wpmaterial, 'member', 'inventoryDS');
  const synonymDSData = newStatusDatasource(statusitem, 'synonymDSData');
  const locationDS = newStatusDatasource(wolocationmeters, 'locationDS');
  const laborDs = newDatasource(labor, "labordetails", "labtransid", "laborDs");
  const laborJsonDS = newDatasource(labor, "labordetails", "labtransid", "laborJsonDS");
  const taskLookupDS = newDatasource(taskDetail, 'member', 'taskid', 'woTaskds');
  const woReportWorkDs1 = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  page.registerDatasource(woReportWorkDs1);
  app.registerDatasource(newWoDatasource(workorderitem, "woDetailds"));
  page.registerDatasource(inventoryDS);
  page.registerDatasource(premiumpayJsonDS);
  page.registerDatasource(synonymDSData);
  page.registerDatasource(locationDS);
  page.registerDatasource(craftrate);
  page.registerDatasource(labordetails);
  page.registerDatasource(woDetailsReportWork);
  app.registerDatasource(laborDs);
  app.registerDatasource(laborJsonDS);
  app.registerDatasource(craftrate);
  page.registerDatasource(taskLookupDS);
  sinon.stub(laborDs, "clearState");
  sinon.stub(laborDs, "reset");
  sinon.stub(premiumpayJsonDS, "clearState");
  jest.spyOn(controller,"setPremiumPay").mockImplementation(()=>0);
  controller.pageInitialized(page, app);
  
  const itemNew = {
     personid: 'ADAMS',
     timerstatus: "ACTIVE",
     vendor : "CMC"
  }
  await woDetailsReportWork.load();
  let labtrans = await labordetails.load();
  sinon.stub(labordetails, "addNew").returns(labtrans[0]);
  app.state = {
    systemProp: {
      'maximo.mobile.statusforphysicalsignature': 'APPR,WAPPR'
    },
  };
  page.state.selectedLabors =  new Map();
  await controller.openReportTimeDrawer({action: 'add'});
  expect(page.state.hideDeleteTimer).toBe(true);
  expect(woDetailsReportWork.items.length).toEqual(1);
  expect(page.state.disableButton).toBe(false);
  await controller.loadAndOpenReportTimeDrawer({action: 'update', item: {personid: 'SAM'}});

  app.state.networkConnected = false;
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: ''}, laborcode: 'SAM'},
      displayName: 'Sam Murphy'
    }
  };
  controller.pageInitialized(page, app);
  controller.openReportTimeDrawer({action: 'add'});

  app.state.networkConnected = true;
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: '', skilllevel: ''}, laborcode: 'SAM'},
      displayName: 'Sam Murphy'
    }
  };
  controller.pageInitialized(page, app);
  controller.openReportTimeDrawer({action: 'add'});
  await controller.openReportTimeDrawer({action: 'update',item:itemNew});
  expect(page.state.vendor).toEqual(labordetails.item.vendor);
  expect(page.state.contractnum).toEqual(labordetails.item.contractnum);
});


it("get Premium Pay", async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({ name: "report_work" });
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: { laborcraftrate: { craft: 'ELECT', skilllevel: 'SECONDCLASS' }, laborcode: 'SAM' },
      displayName: 'Sam Murphy'
    }
  };
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  const craftsdata = {
    member: [
      {
        id: 1,
        laborcode: 'wilson',
        craft: 'ELECT',
        ppcraftrate: [
          {
            premiumpaycode: 'OT7',
            displayrate: '4.8',
            premiumpay: [
              { description: 'Sunday hours.', defaultratetype: 'MULTIPLIER' }
            ],
          },
          {
            premiumpaycode: 'OT0',
            displayrate: '1.8',
            premiumpay: [
              { description: 'Greater than 8 hours per shift', defaultratetype: 'MULTIPLIER' }
            ],
          },
        ]

      }
    ]
  }
  const craftrateLookupDS = newDatasource(craftsdata,'member', 'id', 'craftrate');
  page.registerDatasource(craftrateLookupDS);
  app.registerDatasource(craftrateLookupDS);
  //sinon.stub(laborDs, "clearState");
  controller.pageInitialized(page, app);
  Device.get().isMaximoMobile = false;
  await craftrateLookupDS.load();
  page.state = {};
  jest.spyOn(page, "findDatasource").mockImplementation(() => craftrateLookupDS);
  sinon.stub(craftrateLookupDS, 'initializeQbe');
  sinon.stub(craftrateLookupDS, 'setQBE');
  sinon.stub(craftrateLookupDS, "searchQBE")
  let evt = {
    item:
    {
      laborcode: 'wilson',
      craft: 'ELECT',
      groupedlabor: [{
        premiumpayrate: '1.5',
        premiumpaycode: 'OT7',
        premiumpayratetype: 'MULTIPLIER',

      }]
    }
  }
  await controller.getPremiumPay(evt);
  expect(page.state.displayrate).toBe('1.5');
  expect(CommonUtil.sharedData?.premiumpaycode).toBe('OT7');
  expect(page.state.displayratetype).toBe('MULTIPLIER');
  expect(page.state.premiumpaydescription).toBe('Sunday hours.');
  evt = {
    item:
    {
      laborcode: 'wilson',
      craft: 'ELECT',
      groupedlabor: [{
        premiumpaycode: 'OT7',
      }]
    }
  }
  Device.get().isMaximoMobile = true;
  await controller.getPremiumPay(evt);
  expect(page.state.displayrate).toBe('4.8');
  expect(CommonUtil.sharedData?.premiumpaycode).toBe('OT7');
  expect(page.state.displayratetype).toBe('MULTIPLIER');
  expect(page.state.premiumpaydescription).toBe('Sunday hours.');
});

it("set Premium Pay", async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({ name: "report_work" });
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: { laborcraftrate: { craft: 'ELECT', skilllevel: 'SECONDCLASS' }, laborcode: 'SAM' },
      displayName: 'Sam Murphy'
    }
  };
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  const crafts = {
    items: [
      {
        _rowstamp: '14303857',
        domainid: "WOCLASS",
        laborcode: "wilson",
        rate: "22",
        outside: "",
        contractnum: "",
        craft: "ELECT",
        skillleveldata: "FIRSTCLASS",
        craftdescription: "Electrician",
        defaultcraft: true,
        vendor: "",
        orgid: 'EAGLENA',
        siteid: 'BEDFORD',      
      },
      {
        _rowstamp: '14303858',
        domainid: "WOCLASS",
        laborcode: "Jones",
        rate: "12",
        outside: "",
        contractnum: "",
        craft: "MACH",
        skillleveldata: "APPRENTICE",
        craftdescription: "Machinist",
        defaultcraft: true,
        vendor: "",
        orgid: 'EAGLENA',
        siteid: 'BEDFORD',      
      },
      {
        _rowstamp: '14303859',
        domainid: "WOCLASS",
        laborcode: "Pedrick",
        rate: "23",
        outside: "",
        contractnum: "1022",
        craft: "HR",
        skillleveldata: "SECONDCLASS",
        craftdescription: "Human Resources",
        defaultcraft: false,
        vendor: "CMC",
        orgid: 'EAGLENA',
        siteid: 'BEDFORD',      
      }
    ]
  }
  const premiumpayJsonDS = newDatasource({},'member', 'id', 'premiumpayJsonDS');
  page.registerDatasource(premiumpayJsonDS);
  controller.pageInitialized(page, app);
  page.state = {};
  jest.spyOn(page,"findDatasource").mockImplementation(() => premiumpayJsonDS);
  jest.spyOn(controller, "getPremiumPayCodes").mockImplementation(() => [
    {
      displayrate: '10',
      premiumpaycode: 'OT77',
      description: 'Holiday Hours',
      displayratetype: 'MULTIPLIER'
    },
    {
      displayrate: '100',
      premiumpaycode: 'OT88',
      description: 'Greater than 8 hours per shift',
      displayratetype: 'MULTIPLIER'
    }
  ]);
  await controller.setPremiumPay(crafts);
  expect(premiumpayJsonDS.items.length).toBe(2);
  jest.spyOn(controller, "getPremiumPayCodes").mockImplementation(() => 
   {
    return  {
      displayrate: '10',
      premiumpaycode: 'OT77',
      description: 'Greater than 8 hours per shift',
      displayratetype: 'MULTIPLIER'
        }
   }
  );
  await controller.setPremiumPay({
    displayrate: '10',
    premiumpaycode: 'OT77',
    description: 'Greater than 40 hours per week.',
    displayratetype: 'MULTIPLIER'
  })
  expect(premiumpayJsonDS.items.length).toBe(1);
});

it("get Premium Pay Codes", async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({ name: "report_work" });
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  const defaultCraft = {
    id: 1,
    laborcode: 'wilson',
    craft: 'ELECT',
    ppcraftrate: [
      {
        premiumpaycode: 'OT1',
        displayrate: '4.8',
        premiumpay: [
          { description: 'Greater than 8 hours per shift', defaultratetype: 'MULTIPLIER' }
        ],
      },
      {
        premiumpaycode: 'OT2',
        displayrate: '1.8',
        premiumpay: [
          { description: 'Greater than 40 hours per week.', defaultratetype: 'MULTIPLIER' }
        ],
      },
      {
        premiumpaycode: 'OT3',
        displayrate: '1.2',
        premiumpay: [
          { description: 'Sunday hours.', defaultratetype: 'MULTIPLIER' }
        ],
      },
    ]
  }
  const premiumPayCode = await controller.getPremiumPayCodes(defaultCraft);
  expect(premiumPayCode.length).toBe(3);
});


it("select PremiumPay", async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({ name: "report_work" });
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  const labordetailsDS = newDatasource(labor, "labordetails", "labtransid", "reportworkLaborDetailds");
  page.registerDatasource(labordetailsDS);
  controller.pageInitialized(page, app);
  const evt = {
    description: 'Greater than 8 hours per shift',
    displayrate: '1.7',
    premiumpaycode: 'OT9',
    displayratetype: 'MULTIPLIER',
  }
  await controller.selectPremiumPay(evt);
  expect(page.state.premiumpaydescription).toEqual('Greater than 8 hours per shift');
  expect(page.state.displayrate).toEqual('1.7');
  expect(CommonUtil.sharedData?.premiumpaycode).toBe('OT9');
  expect(page.state.displayratetype).toEqual('MULTIPLIER');
  expect(page.datasources.reportworkLaborDetailds.item["premiumpaycode"]).toEqual('OT9');
  expect(page.datasources.reportworkLaborDetailds.item["premiumpayhours"]).toEqual('0');
});

it("Validate the time", async () => {
  let showDialog = jest.fn();
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work", state: {action: 'add'}});
  page.showDialog = showDialog;

  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  app.registerController(controller);
  app.registerPage(page);
  const woDetailds = newWoDatasource(workorderitem, "woDetailds");
  app.registerDatasource(woDetailds);
  await app.initialize();

  const reportworksSynonymData = newStatusDatasource(statusitem, "reportworksSynonymData");
  page.registerDatasource(reportworksSynonymData);

  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const labordetails = newDatasource(labor, "labordetails", "labtransid", "reportworkLaborDetailds");
  const woDetailsReportWork = newDatasource(labor, "wodetails", "wonum", "woDetailsReportWork");
  const woReportWorkDs1 = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  const setDS = newSetIdDatasource(statusitem, 'defaultSetDs');
  page.registerDatasource(woReportWorkDs1);
  page.registerDatasource(craftrate);
  page.registerDatasource(labordetails);
  page.registerDatasource(woDetailsReportWork);
  page.registerDatasource(setDS)
  controller.pageInitialized(page, app);
  jest.spyOn(controller, "_resetDataSource").mockImplementation(() => {});

  await woDetailsReportWork.load();
  let labtrans = await labordetails.load();
  sinon.stub(labordetails, "addNew").returns(labtrans);
  controller.validateRegularHrs({'page': page, 'app': app});

  expect(woDetailsReportWork.items.length).toEqual(1);
});

it("Validate the regular hours with string", async () => {
  let showDialog = jest.fn();
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work", state: {action: 'add'}});
  page.showDialog = showDialog;

  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  app.registerController(controller);
  app.registerPage(page);

  const reportworksSynonymData = newStatusDatasource(statusitem, "reportworksSynonymData");
  page.registerDatasource(reportworksSynonymData);

  const labordetails = newDatasource(labor, "labordetails1", "labtransid", "reportworkLaborDetailds");
  const woDetailsReportWork = newDatasource(labor, "wodetails", "wonum", "woDetailsReportWork");
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const woReportWorkDs1 = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  page.registerDatasource(woReportWorkDs1);
  page.registerDatasource(craftrate);
  page.registerDatasource(labordetails);
  page.registerDatasource(woDetailsReportWork);
  controller.pageInitialized(page, app);
  jest.spyOn(controller, "_resetDataSource").mockImplementation(() => {});

  await woDetailsReportWork.load();
  let labtrans = await labordetails.load();
  sinon.stub(labordetails, "addNew").returns(labtrans);

  labordetails.item.starttime = '2020-12-14T00:30:00+05:30';
  labordetails.item.startdate = '2020-12-14T00:00:00.000+05:30';
  labordetails.item.finishtime = '';
  labordetails.item.finishdate = '';
  labordetails.item.regularhrs = 1;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.finishdate = '2020-10-23T00:00:00.000+05:30';
  labordetails.item.finishtime = '';
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.startdate = '2020-10-23T00:00:00.000+05:30';
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.startdate = '2020-10-23T00:00:00.000+05:30';
  labordetails.item.starttime = '';
  labordetails.item.regularhrs = '';
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.startdate = '';
  labordetails.item.starttime = '';
  labordetails.item.finishtime = '2020-10-30T01:00:00+05:30';
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.startdate = '2020-11-02T00:00:00.000+05:30';
  labordetails.item.starttime = '2020-10-30T01:00:00+05:30';
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = '2020-10-30T01:00:00+05:30';
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = '2020-10-30T01:00:00+05:30';
  labordetails.item.startdate = '2020-10-24T00:00:00.000+05:30';
  labordetails.item.finishtime = '2020-10-30T02:00:00-04:00';
  labordetails.item.finishdate = '2020-10-23';
  labordetails.item.regularhrs = null;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = '2020-10-30T01:00:00+05:30';
  labordetails.item.startdate = '2020-10-23T00:00:00.000+05:30';
  labordetails.item.finishtime = '2020-10-30T02:00:00+05:30';
  labordetails.item.finishdate = '2020-10-24T00:00:00.000+05:30';
  labordetails.item.regularhrs = null;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = null;
  labordetails.item.startdate = '2020-10-23T00:00:00.000+05:30';
  labordetails.item.finishtime = null;
  labordetails.item.finishdate = '2020-10-23T00:00:00.000+05:30';
  labordetails.item.regularhrs = 2;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = null;
  labordetails.item.startdate = '2020-10-22T00:00:00.000+05:30';
  labordetails.item.finishtime = null;
  labordetails.item.finishdate = '2020-10-23T00:00:00.000+05:30';
  labordetails.item.regularhrs = 2;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = null;
  labordetails.item.startdate = '2020-10-22T00:00:00.000+05:30';
  labordetails.item.finishtime = null;
  labordetails.item.finishdate = '2020-11-20T00:00:00.000+05:30';
  labordetails.item.regularhrs = null;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = '2020-10-30T17:00:00+05:30';
  labordetails.item.startdate = '2020-12-02T00:00:00.000+05:30';
  labordetails.item.finishtime = null;
  labordetails.item.finishdate = null;
  labordetails.item.regularhrs = null;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = null;
  labordetails.item.startdate = '2020-12-02T00:00:00.000+05:30';
  labordetails.item.finishtime = null;
  labordetails.item.finishdate = '2020-12-03T00:00:00.000+05:30';
  labordetails.item.regularhrs = null;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = null;
  labordetails.item.startdate = '2020-12-02T00:00:00.000+05:30';
  labordetails.item.finishtime = '2020-10-30T17:30:00+05:30';
  labordetails.item.finishdate = null;
  labordetails.item.regularhrs = null;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = null;
  labordetails.item.startdate = '2020-12-02T00:00:00.000+05:30';
  labordetails.item.finishtime = '2020-10-30T01:30:00+05:30';
  labordetails.item.finishdate = null;
  labordetails.item.regularhrs = null;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = null;
  labordetails.item.startdate = '2020-12-02T00:00:00.000+05:30';
  labordetails.item.finishtime = null;
  labordetails.item.finishdate = null;
  labordetails.item.regularhrs = null;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = null;
  labordetails.item.startdate = null;
  labordetails.item.finishtime = null;
  labordetails.item.finishdate = null;
  labordetails.item.regularhrs = null;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = '2020-10-30T01:30:00+05:30';
  labordetails.item.startdate = '2020-12-02T00:00:00.000+05:30';
  labordetails.item.finishtime = '2020-10-30T01:00:00+05:30';
  labordetails.item.finishdate = '2020-12-02T00:00:00.000+05:30';
  labordetails.item.regularhrs = null;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = '2020-10-30T01:30:00+05:30';
  labordetails.item.startdate = '2020-12-02T00:00:00.000+05:30';
  labordetails.item.finishtime = '2021-02-06T23:00:00+05:30';
  labordetails.item.finishdate = null;
  labordetails.item.regularhrs = null;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = null;
  labordetails.item.startdate = '2020-12-03T00:00:00.000+05:30';
  labordetails.item.finishtime = null;
  labordetails.item.finishdate = '2020-12-10T00:00:00.000+05:30';
  labordetails.item.regularhrs = null;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = null;
  labordetails.item.startdate = '2020-12-03T00:00:00.000+05:30';
  labordetails.item.finishtime = '2020-10-30T08:00:00+05:30';
  labordetails.item.finishdate = '2020-12-10T00:00:00.000+05:30';
  labordetails.item.regularhrs = 1;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = null;
  labordetails.item.startdate = '2020-12-03T00:00:00.000+05:30';
  labordetails.item.finishtime = '2020-10-30T20:00:00+05:30';
  labordetails.item.finishdate = null;
  labordetails.item.regularhrs = null;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = null;
  labordetails.item.startdate = '2020-12-03T00:00:00.000+05:30';
  labordetails.item.finishtime = null;
  labordetails.item.finishdate = '2020-12-02T00:00:00.000+05:30';
  labordetails.item.regularhrs = null;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = '2020-10-30T05:00:00+05:30';
  labordetails.item.startdate = '2020-10-03T00:00:00.000+05:30';
  labordetails.item.finishtime = '2020-10-30T06:00:00+05:30';
  labordetails.item.finishdate = '2020-10-03T00:00:00.000+05:30';
  labordetails.item.regularhrs = -4;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = null;
  labordetails.item.startdate = '2020-12-03T00:00:00.000+05:30';
  labordetails.item.finishtime = null;
  labordetails.item.finishdate = '2022-01-01T00:00:00.000+05:30';
  labordetails.item.regularhrs = null;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = null;
  labordetails.item.startdate = null;
  labordetails.item.finishtime = '2022-01-01T20:00:00.000+05:30';
  labordetails.item.finishdate = null;
  labordetails.item.regularhrs = null;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = null;
  labordetails.item.startdate = '2020-10-03T00:00:00.000+05:30';
  labordetails.item.finishtime = null;
  labordetails.item.finishdate = '2019-10-03T00:00:00.000+05:30';
  labordetails.item.regularhrs = null;
  controller.validateRegularHrs({'page': page, 'app': app});

  labordetails.item.starttime = '2020-10-03T02:00:00.000+05:30';
  labordetails.item.startdate = '2020-10-03T00:00:00.000+05:30';
  labordetails.item.finishtime = '2020-10-03T01:00:00.000+05:30';
  labordetails.item.finishdate = '2019-10-03T00:00:00.000+05:30';
  labordetails.item.regularhrs = null;
  controller.validateRegularHrs({'page': page, 'app': app});

  page.state.dateTimeFieldsChanged = true;

  labordetails.item.starttime = '2020-10-03T02:00:00.000+05:30';
  labordetails.item.startdate = '2020-10-03T00:00:00.000+05:30';
  labordetails.item.finishtime = '2020-10-03T01:00:00.000+05:30';
  labordetails.item.finishdate = null;
  labordetails.item.regularhrs = null;
  page.state.dateTimeFieldsChanged = true;
  controller.validateRegularHrs({'page': page, 'app': app});

  controller.combineDateTime("2020-12-14T00:00:00.000+05:30", "2020-12-14T05:00:00+05:30");

  controller.calculateLaborDateTime("2020-12-14T00:00:00.000+05:30", "2020-12-14T05:00:00+05:30", 2);

  controller.calculateLaborDateTime("2020-12-14T07:00:00.000+05:30", "2020-12-14T05:00:00+05:30", 2, true);

  let datetime3 = controller.getOnlyDatePart("2020-12-14T05:00:00+05:30");
  expect(datetime3).toContain('T00:00:00');

  let datetime4 = controller.getMinutes("2020-12-14T05:00:00", app);
  expect(datetime4).toEqual(300);
});

it('Sets the selected labor code and its corresponding details',async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  app.registerPage(page);
  page.state = {action: 'add'}
  page.state.selectedLabors =  new Map();
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'},
      defaultSite: 'BEDFORD'
    }
  };
  app.registerController(controller);
  await app.initialize();
  const labors = {
    member: [
      {
        _rowstamp: '14303857',
        laborcode: 'wilson',
        displayname: 'mike wilson',
        orgid: 'EAGLENA',
        siteid: 'BEDFORD',      
      },
      {
        _rowstamp: '14303858',
        laborcode: 'Jones',
        displayname: 'Frank Jones',
        orgid: 'EAGLENA',
        siteid: 'BEDFORD',      
      },
      {
        _rowstamp: '14303859',
        laborcode: 'Pedrick',
        displayname: 'mike Pedrick',
        orgid: 'EAGLENA',
        siteid: 'BEDFORD',      
      },
    ]
  }
  const crafts = {
    member: [
      {
        _rowstamp: '14303857',
        domainid: "WOCLASS",
        laborcode: "wilson",
        rate: "22",
        outside: "",
        contractnum: "",
        craft: "ELECT",
        skillleveldata: "FIRSTCLASS",
        craftdescription: "Electrician",
        defaultcraft: true,
        vendor: "",
        orgid: 'EAGLENA',
        siteid: 'BEDFORD',      
      },
      {
        _rowstamp: '14303858',
        domainid: "WOCLASS",
        laborcode: "Jones",
        rate: "12",
        outside: "",
        contractnum: "",
        craft: "MACH",
        skillleveldata: "APPRENTICE",
        craftdescription: "Machinist",
        defaultcraft: true,
        vendor: "",
        orgid: 'EAGLENA',
        siteid: 'BEDFORD',      
      },
      {
        _rowstamp: '14303859',
        domainid: "WOCLASS",
        laborcode: "Pedrick",
        rate: "23",
        outside: "",
        contractnum: "1022",
        craft: "HR",
        skillleveldata: "",
        craftdescription: "Human Resources",
        defaultcraft: true,
        vendor: "CMC",
        orgid: 'EAGLENA',
        siteid: 'BEDFORD',      
      }
    ]
  }

  let craftrate = newDatasource1(crafts, "craftrate");
  const laborDS = newDatasource1(labors, "laborJsonDS");
  page.registerDatasource(craftrate);
  app.registerDatasource(laborDS);
  await craftrate.load();
  await laborDS.load(); 
  controller.pageInitialized(page, app);
  jest.spyOn(laborDS, "getSelectedItems").mockImplementation(() =>  [{laborcode: "Pedrick",displayname: 'mike Pedrick'}]);
  jest.spyOn(controller,"setCraftSkill").mockImplementation(()=>0);
  jest.spyOn(controller,"setPremiumPay").mockImplementation(()=>0);

  await controller.setLabors(); 
  expect(page.state.loadinglabor).toBe(false);
  expect(page.state.laborCode).toBe('Pedrick');
  expect(page.state.selectedLabors.size).toBe(1);
  expect(page.state.skilllevel).toBe('');
  expect(page.state.vendor).toBe('CMC');
  expect(page.state.contractnum).toBe('1022');
  expect(page.state.laborDisplayName).toBe('mike Pedrick');
  expect(page.state.multipleLabors).toBe(false);
  
})

it('Sets the multiple selected labor codes and their corresponding details',async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  app.registerPage(page);
  page.state = {action: 'add'}
  page.state.selectedLabors =  new Map();
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'},
      defaultSite: 'BEDFORD'
    }
  };
  app.registerController(controller);
  await app.initialize();
  const labors = {
    member: [
      {
        _rowstamp: '14303857',
        laborcode: 'wilson',
        displayname: 'mike wilson',
        orgid: 'EAGLENA',
        siteid: 'BEDFORD',      
      },
      {
        _rowstamp: '14303858',
        laborcode: 'Jones',
        displayname: 'Frank Jones',
        orgid: 'EAGLENA',
        siteid: 'BEDFORD',      
      },
      {
        _rowstamp: '14303859',
        laborcode: 'Pedrick',
        displayname: 'mike Pedrick',
        orgid: 'EAGLENA',
        siteid: 'BEDFORD',      
      },
    ]
  }
  const crafts = {
    member: [
      {
        _rowstamp: '14303857',
        domainid: "WOCLASS",
        laborcode: "wilson",
        rate: "22",
        outside: "",
        contractnum: "",
        craft: "ELECT",
        skillleveldata: "FIRSTCLASS",
        craftdescription: "Electrician",
        defaultcraft: true,
        vendor: "",
        orgid: 'EAGLENA',
        siteid: 'BEDFORD',      
      },
      {
        _rowstamp: '14303858',
        domainid: "WOCLASS",
        laborcode: "Jones",
        rate: "12",
        outside: "",
        contractnum: "",
        craft: "MACH",
        skillleveldata: "APPRENTICE",
        craftdescription: "Machinist",
        defaultcraft: true,
        vendor: "",
        orgid: 'EAGLENA',
        siteid: 'BEDFORD',      
      },
      {
        _rowstamp: '14303859',
        domainid: "WOCLASS",
        laborcode: "Pedrick",
        rate: "23",
        outside: "",
        contractnum: "1022",
        craft: "HR",
        skillleveldata: "SECONDCLASS",
        craftdescription: "Human Resources",
        defaultcraft: true,
        vendor: "CMC",
        orgid: 'EAGLENA',
        siteid: 'BEDFORD',      
      }
    ]
  }

  let craftrate = newDatasource1(crafts, "craftrate");
  const laborDS = newDatasource1(labors, "laborJsonDS");
  page.registerDatasource(craftrate);
  app.registerDatasource(laborDS);
  await craftrate.load();
  await laborDS.load(); 
  controller.pageInitialized(page, app);

  jest.spyOn(laborDS, "getSelectedItems").mockImplementation(() =>  [{laborcode: "Pedrick",displayname: 'mike Pedrick'},{laborcode: "wilson"}]);
  jest.spyOn(controller,"setCraftSkill").mockImplementation(()=>0);
  jest.spyOn(controller,"setPremiumPay").mockImplementation(()=>0);
  await controller.setLabors();
  expect(page.state.loadinglabor).toBe(false);
  expect(page.state.laborCode).toBe(undefined);
  expect(page.state.selectedLabors.size).toBe(2);
  expect(page.state.skilllevel).toBe('');
  expect(page.state.vendor).toBe('');
  expect(page.state.contractnum).toBe('');
  expect(page.state.laborDisplayName).toBe('wilson , mike Pedrick');
  expect(page.state.multipleLabors).toBe(true);
  
})
it("Add labor transaction", async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  const schedulepage = new Page({name: "schedule"});
  const approvals = new Page({ name: "approvals" });
  const reportTimeDrawer = new Dialog({
    name: 'reportTimeDrawer'
  });

  page.registerDialog(reportTimeDrawer);
  app.registerPage(page);
  app.registerPage(schedulepage);
  app.registerPage(approvals);

  const taskDS = newTaskDatasource(tasklist, 'woPlanTaskDetailds');
  page.registerDatasource(taskDS);

  page.showDialog = jest.fn();
  reportTimeDrawer.closeDialog = jest.fn();
  page.state = {action: 'add'}
  page.state.selectedLabors =  new Map();
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'},
      defaultSite: 'BEDFORD'
    }
  };
  app.registerController(controller);
  await app.initialize();
  jest.spyOn(app, "findDatasource").mockImplementation(() => taskDS);
  const reportworksSynonymData = newStatusDatasource(statusitem, "reportworksSynonymData");
  page.registerDatasource(reportworksSynonymData);
  const synonymDSData = newStatusDatasource(statusitem, 'synonymDSData');
  page.registerDatasource(synonymDSData);

  let craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const labordetails = newDatasource(labor, "labordetails1", "labtransid", "reportworkLaborDetailds");
  const woDetailsReportWork = newDatasource(labor, "wodetails", "wonum", "woDetailsReportWork");
  const synonymdomainData = newTimerStatusDatasource(statusitem, 'synonymdomainData');
  let jreportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "jreportworkLabords");
  const inventoryDS = materialDatasource(wpmaterial, 'member', 'inventoryDS');
  const locationDS = newDatasource(wolocationmeters, 'member', 'location', 'locationDS');
  const woReportWorkDs1 = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
   const laborDs = newDatasource(labor, "labordata", "laborid", "laborDs");
  page.registerDatasource(woReportWorkDs1);
  page.registerDatasource(locationDS);
  page.registerDatasource(inventoryDS);
  app.registerDatasource(synonymdomainData);
  app.registerDatasource(craftrate);
  app.registerDatasource(laborDs);
  page.registerDatasource(labordetails);
  page.registerDatasource(woDetailsReportWork);
  page.registerDatasource(jreportworkLabords);
  controller.pageInitialized(page, app);

  let labtrans = await labordetails.load();
  await jreportworkLabords.load();
  sinon.stub(labordetails, "addNew").returns(labtrans);
  controller.pageInitialized(page, app);
  let sarchQBEStubLaborType = sinon.stub(reportworksSynonymData, 'searchQBE').callThrough();
  await controller.loadRecord();
  labordetails.item.regularhrs = 0;
  expect(sarchQBEStubLaborType.displayName).toBe('searchQBE');
  await controller.saveLaborTransaction({'page': page, 'app': app});

  let updateAction = sinon.stub(labordetails, "update");
  let putAction = sinon.stub(labordetails, "bulkAdd");

  page.state = {action: 'update', craftdata: {craft: "ELECT", skilllevel: "SECONDCLASS", rate: 10}, skilllevel: "SECONDCLASS", vendor: "V2", contractnum: "C1"};
  controller.pageInitialized(page, app);
  labordetails.state.canSave = true;
  await controller.saveLaborTransaction({'page': page, 'app': app});
  expect(updateAction.called).toBe(true);
  expect(page.state.hideDeleteTimer).toBe(false);


  updateAction.restore();
  updateAction = sinon.stub(labordetails, "update");
  craftrate.item.defaultcraft = true;
  page.state = {action: 'update', craftdata: {craft: "ELECT", skilllevel: "SECONDCLASS", rate: 10}};
  controller.pageInitialized(page, app);
  await controller.saveLaborTransaction({'page': page, 'app': app});
  expect(updateAction.called).toBe(true);

  updateAction.restore();
  updateAction = sinon.stub(labordetails, "update");
  page.state = {action: 'update', craftdata: {craft: "ELECT", skilllevel: "SECONDCLASS", rate: 10}};
  controller.pageInitialized(page, app);
  await controller.saveLaborTransaction({'page': page, 'app': app});
  expect(updateAction.called).toBe(true);
  updateAction.restore();
 
  page.state = {action: 'add', craftdata: {craft: "ELECT", skilllevel: "SECONDCLASS", rate: 10}};
  page.state.selectedLabors =  new Map();
  controller.pageInitialized(page, app);
  await controller.saveLaborTransaction({'page': page, 'app': app});
  expect(putAction.called).toBe(true);
  putAction.restore();
  
  putAction = sinon.stub(labordetails, "bulkAdd");
  page.state = {action: 'add', craftdata: {craft: "ELECT", skilllevel: "SECONDCLASS", rate: 10}};
  page.state.selectedLabors =  new Map();
  controller.pageInitialized(page, app);
  labordetails.item.finishdate = '';
  labordetails.item.finishtime = '';
  await controller.saveLaborTransaction({'page': page, 'app': app});
  expect(putAction.called).toBe(true);
  putAction.restore();

  updateAction = sinon.stub(labordetails, "update");
  page.state = {action: 'add', craftdata: {craft: "ELECT", skilllevel: "SECONDCLASS", rate: 10}};
  page.state.selectedLabors =  new Map();
  controller.pageInitialized(page, app);
  labordetails.item.finishdate = '2020-10-20';
  labordetails.item.finishtime = '05:00';
  await controller.saveLaborTransaction({'page': page, 'app': app});
  expect(updateAction.called).toBe(false);
  updateAction.restore();

  updateAction = sinon.stub(labordetails, "update");
  page.state = {action: 'update', craftdata: {craft: "ELECT", skilllevel: "SECONDCLASS", rate: 10}};
  controller.pageInitialized(page, app);
  labordetails.item.startdate = '';
  labordetails.item.starttime = '';
  await controller.saveLaborTransaction({'page': page, 'app': app});
  expect(updateAction.called).toBe(true);
  updateAction.restore();

  updateAction = sinon.stub(labordetails, "update");
  page.state = {action: 'update', craftdata: {craft: "ELECT", skilllevel: "SECONDCLASS", rate: 10}};
  controller.pageInitialized(page, app);
  labordetails.item.startdate = '';
  labordetails.item.starttime = '';
  labordetails.item.regularhrs = 1;
  controller.pageInitialized(page, app);
  await controller.saveLaborTransaction({'page': page, 'app': app});
  expect(updateAction.called).toBe(true);
  updateAction.restore();

  updateAction = sinon.stub(labordetails, "update");
  let orginalMobile = Device.get().isMaximoMobile;
  Device.get().isMaximoMobile = true;
  const detailPage = new Page({name: "wodetails"});
  const woDetailResource = newDatasource(workorderitem, "member", "wonum", "woDetailResource");
  detailPage.registerDatasource(woDetailResource);
  app.registerPage(detailPage);
  Device.get().isMaximoMobile = orginalMobile;
  page.state = {action: 'update', craftdata: {craft: "ELECT", skilllevel: "SECONDCLASS", rate: 10}};
  labordetails.item.finishdate = '2020-10-20T00:00:00';
  labordetails.item.finishtime = '2020-10-20T05:00:00';
  await controller.saveLaborTransaction({'page': page, 'app': app});
  expect(updateAction.called).toBe(true);
  updateAction.restore();

  await app.initialize();
  app.state.networkConnected = false;
  page.state = {action: 'update', craftdata: {craft: "ELECT", skilllevel: "SECONDCLASS", rate: 10}};
  controller.pageInitialized(page, app);

  labordetails.item.finishdate = '2020-10-20T00:00:00';
  labordetails.item.finishtime = '2020-10-20T05:00:00';
  await controller.saveLaborTransaction({'page': page, 'app': app});
  jest.spyOn(controller,"setPremiumPay").mockImplementation(()=>0);
  controller.selectCraftSkill({skillleveldescdata: 'SECONDCLASS', craft: "ELECT", rate: 10, skillleveldata: 'ELECT'});
  controller.selectCraftSkill({skillleveldescdata: 'SECONDCLASS', craft: "ELECT", rate: 10});
  
  //Validate if there is no skilllevel exist
  craftrate.item.skillleveldata = undefined;
  app.state = {
    systemProp: {
      'maximo.mobile.statusforphysicalsignature': 'APPR,WAPPR'
    },
  };
  controller.loadRecord();
  expect(app.datasources['craftrate'].item.skillleveldata).toBe(undefined);

  //Validate if there is no defaultcraft exist
  craftrate.item.defaultcraft = false;
  controller.loadRecord();
  expect(app.datasources['craftrate'].item.defaultcraft).toBe(false);

  craftrate.item.craft = "ELECT";
  craftrate.item.skillleveldata = "SECONDCLASS";
  page.state = {craft: "ELECT", skilllevel: "SECONDCLASS"};
  controller.pageInitialized(page, app);
  controller.openCraftSkillLookup({'page': page, 'app': app, 'openLookup': true});
  expect(app.datasources['craftrate'].item.skillleveldata).toEqual("SECONDCLASS");

  craftrate.item.craft = "ELECT";
  craftrate.item.skillleveldata = undefined;
  page.state = {craft: "ELECT", skilllevel: undefined};
  controller.pageInitialized(page, app);
  controller.openCraftSkillLookup({'page': page, 'app': app, 'openLookup': true});
  expect(app.datasources['craftrate'].item.skillleveldata).toBe(undefined);

  page.state = {transTypeValue: "WORK", transTypeDesc: "Actual work time"};
  controller.pageInitialized(page, app);
  controller.openTransTypeLookup({'page': page, 'app': app});

  let exists = false;
  exists = controller.checkLaborAlreadyExists([{
    "labtransid": "1234",
    "startdate": "2020-10-22T00:00:00-04:00",
    "transtype": "work",
    "laborcode": "SAM"
  }], 'SAM');
  expect(exists).toBeTruthy();

  exists = controller.checkLaborAlreadyExists([{
    "labtransid": "1234",
    "startdate": "2020-10-22T00:00:00-04:00",
    "transtype": "work",
    "laborcode": "SAM"
  }], 'ELI');
  expect(exists).toBe(false);

  page.state = {groupedByLabor: false};
  app.registerPage(page);
  app.registerPage(schedulepage);
  controller.pageInitialized(page, app);
  controller.onAfterLoadData({"name": 'reportworkLaborDetailds'}, [{
    "labtransid": "1234",
    "startdate": "2020-10-22T00:00:00-04:00",
    "transtype": "work",
    "laborcode": "SAM"
  }]);
  expect(jreportworkLabords.items).not.toBe(undefined);

 controller.onAfterLoadData({"name": 'reportworkLaborDetailds'}, []);
 expect(jreportworkLabords.items).not.toBe(undefined);

  page.state = {groupedByLabor: true};
  app.registerPage(page);
  app.registerPage(schedulepage);
  controller.pageInitialized(page, app);
  await controller.onAfterLoadData({"name": 'reportworkLaborDetailds'}, [{
    "labtransid": "1234",
    "startdate": "2020-10-22T00:00:00-04:00",
    "transtype": "work",
    "laborcode": "ELI"
  }]);
  expect(jreportworkLabords.items).not.toBe(undefined);

  await controller.onAfterLoadData({"name": 'reportworkLaborDetailds'}, []);
  expect(jreportworkLabords.items).not.toBe(undefined);
});

it("Choose transaction type", async () => {
  let showDialog = jest.fn();
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  page.showDialog = showDialog;
  page.state = {action: 'add'}
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  app.registerController(controller);
  app.registerPage(page);
  const taskDS = newTaskDatasource(tasklist, 'woPlanTaskDetailds');
  app.registerDatasource(taskDS);
  await app.initialize();
  controller.pageInitialized(page, app);

  const synonymDSData = newStatusDatasource(statusitem, 'synonymDSData');
  page.registerDatasource(synonymDSData);
  const labordetails = newDatasource(labor, "labordetails1", "labtransid", "reportworkLaborDetailds");
  page.registerDatasource(labordetails);
  const woDetailsReportWork = newDatasource(labor, "wodetails", "wonum", "woDetailsReportWork");
  page.registerDatasource(woDetailsReportWork);
  const woReportWorkDs1 = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  page.registerDatasource(woReportWorkDs1);
  await labordetails.load();

  page.state = {transTypeVal: "", transTypeDesc: ''};
  controller.chooseTransType({value: "WORK", description: 'WORK'});
  controller.chooseTransType();
});

it("should openFailureList details passed", async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    },
    checkSigOption: (option) => true,
    findSigOption: (appName, sigoption) => true,
  };
  const page1 = new Page({name: "failureDetails"});
  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  let workorder = {'item': {'wonum': 'SCRAP_4', 'siteid': 'BEDFORD', 'orgid': 'EAGLENA'}};
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const wodetailsreportwork = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  const reportworksSynonymData = newStatusDatasource(statusitem, "reportworksSynonymData");
  const inventoryDS = materialDatasource(wpmaterial, 'member', 'inventoryDS');
  const synonymDSData = newStatusDatasource(statusitem, 'synonymDSData');
  const locationDS = newStatusDatasource(wolocationmeters, 'locationDS');
  const woReportWorkDs1 = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  page.registerDatasource(woReportWorkDs1);

  page1.registerDatasource(reportworksSynonymData);
  app.registerDatasource(synonymdomainData);
  page1.registerDatasource(craftrate);
  page1.registerDatasource(inventoryDS);
  page1.registerDatasource(synonymDSData);
  page1.registerDatasource(locationDS);

  app.registerController(controller);
  page1.registerDatasource(reportworkLabords);
  page1.registerDatasource(wodetailsreportwork);
  app.registerPage(page);
  app.registerPage(page1);
  await app.initialize();

  controller.pageInitialized(page, app);
  await controller.openFailureDetails(workorder);
  expect(page1.state.navigateToFailureDetails).toBeTruthy();
});

it("it should return group item", () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  const reportworkLaborDetailds = newDatasource(labor, "labordetails1", "labtransid", "reportworkLaborDetailds");
  page.state = {apprExtLabTrans: 0,apprIntLabTrans:1 };
  app.registerPage(page);
  app.initialize();
  controller.pageInitialized(page, app);
  page.registerDatasource(reportworkLaborDetailds);
  const groupedItem = controller.createGroupedLaborTransactions(labor.labordata);
  expect(groupedItem.laborcode).not.toBeNull();
})


it("validate EndDateTime before save", async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});

  app.registerPage(page);

  page.state = {dateTimeRemoved: true};
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  app.registerController(controller);
  await app.initialize();
  controller.pageInitialized(page, app);

  const reportworkLaborDetailds = newDatasource(labor, "labordetails1", "labtransid", "reportworkLaborDetailds");
  const woDetailsReportWork = newDatasource(labor, "wodetails", "wonum", "woDetailsReportWork");
  const woReportWorkDs1 = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  page.registerDatasource(woReportWorkDs1);
  page.registerDatasource(reportworkLaborDetailds);
  page.registerDatasource(woDetailsReportWork);

  woDetailsReportWork.item.labtranstolerance = 0;
  reportworkLaborDetailds.item.startdate = '2021-02-19T00:00:00';
  reportworkLaborDetailds.item.starttime = '2021-02-19T05:00:00';
  reportworkLaborDetailds.item.regularhrs = 30;

  controller.validateEndDateTime({'page': page, 'app': app}, app, page);

  reportworkLaborDetailds.item.startdate = '2021-02-19T00:00:00';
  reportworkLaborDetailds.item.starttime = '2021-02-19T05:00:00';
  reportworkLaborDetailds.item.regularhrs = 17;

  controller.validateEndDateTime({'page': page, 'app': app});
});


it('Open the openMaterialsDrawer()', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainData); 
  const itemsDS = newDatasource(wpmaterial, 'member', 'itemnum', 'itemsDS');
  const synonymDSData = newStatusDatasource(statusitem, 'synonymDSData');
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLaborDetailds");
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const taskLookupDS = newDatasource(taskDetail, 'member', 'taskid', 'woTaskds');
  const woReportWorkDs1 = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  page.registerDatasource(woReportWorkDs1);
  app.registerDatasource(newWoDatasource(workorderitem, "woDetailds"));
  page.registerDatasource(craftrate);
  app.registerDatasource(itemsDS);
  page.registerDatasource(synonymDSData);
  page.registerDatasource(reportworkLabords);
  page.registerDatasource(wodetails);
  app.registerController(controller);
  page.registerController(taskLookupDS);

  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);

  await controller.openMaterialsDrawer({page: page, app: app}, app, page);
  expect(app.state.pageLoading).toBe(false);
  expect(page.state.isSavedMaterial).toBe(true);
  expect(page.state.saveAction).toBe(true);
  expect(page.state.disableAction).toBe(true);
});

it('Open the openMaterialLookup()', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };

  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainData);  
  const itemsDS = newDatasource(wpmaterial, 'member', 'itemnum', 'itemsDS');
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const woReportWorkDs1 = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  page.registerDatasource(woReportWorkDs1);
  page.registerDatasource(craftrate);
  page.registerDatasource(itemsDS);
  page.registerDatasource(reportworkLabords);
  page.registerDatasource(wodetails);

  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  let evt = {page: page, app: app};
  itemsDS.item.itemnum = '20778';

  await controller.openMaterialLookup(evt);
  expect(page.datasources['itemsDS'].item.itemnum).toEqual('20778');
});

it("Calls the laborBlurTimeEvent", async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({ name: "report_work" });

  const event = {
    target: {
      attributes: {
        id: {
          value: {
            toLowerCase: jest.fn(),
          },
        },
      },
      value: true,
    },
    dataFormatValid: true,
  };

  const labor1 = {
    ...labor,
    clearWarnings: jest.fn(),
    addWarnings: jest.fn(),
  };

  let labordetails = newDatasource(
    labor1,
    "labordetails1",
    "labtransid",
    "reportworkLaborDetailds"
  );
  app.registerDatasource(labordetails);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  const clearWarn = sinon.stub(labordetails, "clearWarnings");
  const addWarn = sinon.stub(labordetails, "addWarnings");

  await controller.laborBlurTimeEvent(event);
  expect(clearWarn.called).toBe(true);

  const event1 = {
    target: {
      attributes: {
        id: {
          value: {
            toLowerCase: jest.fn(),
          },
        },
      },
      value: true,
    },
    dataFormatValid: false,
  };

  await controller.laborBlurTimeEvent(event1);
  expect(clearWarn.called).toBe(true);
  expect(addWarn.called).toBe(true);
});

it('Open the openStoreRoomLookup()', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };

  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainData);  
  const locationDS = newDatasource(wolocationmeters, 'member', 'location', 'locationDS');
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const woReportWorkDs1 = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  page.registerDatasource(woReportWorkDs1);
  page.registerDatasource(craftrate);
  page.registerDatasource(locationDS);
  page.registerDatasource(reportworkLabords);
  page.registerDatasource(wodetails);

  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  let evt = {page: page, app: app};
  locationDS.item.location = 'CENTRAL';

  await controller.openStoreRoomLookup(evt);
  expect(page.datasources['locationDS'].item.location).toEqual('CENTRAL');
  expect(page.datasources['locationDS'].selectedItem).toBeFalsy();
});

it('Open the openBinLookup()', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      defaultSite: 'BADFORD',
    },
  };
  const inventbalDS = newDatasource(invbalances, 'member', 'binnum', 'inventbalDS');
  page.registerDatasource(inventbalDS);
  await inventbalDS.load();
  const woReportWorkDs1 = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  page.registerDatasource(woReportWorkDs1);

  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  const inventbalDsStub = sinon.stub(inventbalDS, 'searchQBE');
  const inventbalDsStub1 = sinon.stub(inventbalDS, 'initializeQbe'); 
  controller.pageInitialized(page, app);
  let evt = {page: page, app: app};
  inventbalDS.item.binnum = '6-7-8';

  await controller.openBinLookup(evt);
  expect(page.datasources['inventbalDS'].item.binnum).toEqual('6-7-8');
  expect(inventbalDsStub.called).toBe(true);
  expect(inventbalDsStub.displayName).toBe('searchQBE');
  expect(inventbalDsStub1.called).toBe(true);
  expect(inventbalDsStub1.displayName).toBe('initializeQbe');
});

it('Open the openTransactionTypeLookup()', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  
  const synonymDSData = newStatusDatasource(statusitem, 'synonymDSData');
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  const woReportWorkDs1 = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  page.registerDatasource(woReportWorkDs1);
  app.registerDatasource(synonymdomainData);
  
  const failureListDS = newDatasource(failurelist, "member", "failurelist", "dsFailureList");
  app.registerDatasource(failureListDS);
  page.dsFailureList = failureListDS;
  page.registerDatasource(craftrate);
  page.registerDatasource(synonymDSData);
  page.registerDatasource(reportworkLabords);
  page.registerDatasource(wodetails);

  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  let evt = {page: page, app: app};
  synonymDSData.item.transType = 'ISSUE';

  await controller.openTransactionTypeLookup(evt);
  expect(page.datasources['synonymDSData'].item.transType).toEqual('ISSUE');
});

it('verify the setStoreRoom()', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  app.registerPage(page);
  const inventbalDS = newDatasource(invbalances, 'member', 'binnum', 'inventbalDS');
  page.registerDatasource(inventbalDS);

  const inventoryDS = materialDatasource(wpmaterial, 'member', 'inventoryDS');
  const synonymDSData = newStatusDatasource(statusitem, 'synonymdomainData');
  const locationDS = newDatasource(toolLocation, 'member', 'location', 'locationDS');
  const woReportWorkDs = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const failureListDS = newDatasource(failurelist, "member", "failurelist", "dsFailureList");
  app.registerDatasource(failureListDS);
  page.dsFailureList = failureListDS;
  page.registerDatasource(craftrate);
  page.registerDatasource(inventoryDS);
  app.registerDatasource(synonymDSData);
  page.registerDatasource(locationDS);
  page.registerDatasource(woReportWorkDs);
  page.registerDatasource(reportworkLabords);
  page.registerDatasource(wodetails);
  app.registerController(controller);
  const woDetailds = newWoDatasource(workorderitem, "woDetailds");
  app.registerDatasource(woDetailds);
  sinon.stub(inventoryDS, "searchQBE");
  await app.initialize();
  controller.pageInitialized(page, app);
  await woReportWorkDs.load();
  await locationDS.load();
  await wodetails.load();
  await synonymDSData.load();
  let evt = {page: page, app: app};
  await controller.setStoreRoom(evt);
});

it('verify the setBinNumber()', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      defaultSite: 'BADFORD',
    },
  };
  const inventbalDS = newDatasource(invbalances, 'member', 'binnum', 'inventbalDS');
  page.registerDatasource(inventbalDS);

  const inventoryDS = materialDatasource(wpmaterial, 'member', 'inventoryDS');
  const synonymDSData = newStatusDatasource(statusitem, 'synonymDSData');
  const locationDS = newStatusDatasource(wolocationmeters, 'locationDS');
  const woReportWorkDs1 = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  page.registerDatasource(woReportWorkDs1);
  page.registerDatasource(inventoryDS);
  page.registerDatasource(synonymDSData);
  page.registerDatasource(locationDS);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  let evt = {page: page, app: app};
  await controller.setBinNumber(evt);
});

it('Choose transactionType lookup', async () => {
  let showDialog = jest.fn();
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  page.showDialog = showDialog;
  page.state = {action: 'add'};
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'},
    },
  };
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();

  const labordetails = newDatasource(labor, 'labordetails1', 'labtransid', 'reportworkLaborDetailds');
  page.registerDatasource(labordetails);
  const woReportWorkDs = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  page.registerDatasource(woReportWorkDs);
 
  await woReportWorkDs.load();

  page.state = {transTypeVal: '', transTypeDesc: ''};
  controller.pageInitialized(page, app);
  controller.chooseTransactionType({value: 'WORK', description: 'WORK'});
  expect(page.datasources['reportWorkActualMaterialDs'].item.transtype).toEqual('WORK');
  expect(page.datasources['reportWorkActualMaterialDs'].item.transtype_description).toEqual('WORK');
});

it('Choose chooseMaterial', async () => {
  let showDialog = jest.fn();
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'},
    },
  };
  page.showDialog = showDialog;
  const inventoryDS = materialDatasource(wpmaterial, 'member', 'inventoryDS');
  page.registerDatasource(inventoryDS);
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  const woReportWorkDs1 = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  page.registerDatasource(woReportWorkDs1);
  page.registerDatasource(reportworkLabords);
  page.registerDatasource(wodetails);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  let evt = {
    itemnum: '10001',
    description: 'Test-material',
  };

  controller.pageInitialized(page, app);
  controller.chooseMaterial(evt);
  expect(page.state.itemnum).toEqual('10001');
});

it('Choose chooseStoreRoom', async () => {
  let showDialog = jest.fn();
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  page.showDialog = showDialog;
  const binNumberDS = newDatasource(invbalances, 'member', 'binnum', 'inventbalDS');
  page.registerDatasource(binNumberDS);
  const rotatingAssetDS = newDatasource(woassetmeters, 'member', 'assetnum', 'rotatingAssetDS');
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const woReportWorkDs1 = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  page.registerDatasource(woReportWorkDs1);
  page.registerDatasource(craftrate);
  page.registerDatasource(rotatingAssetDS);
  page.registerDatasource(reportworkLabords);
  page.registerDatasource(wodetails);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  let evt = {
    itemnum: '10001',
    location: 'CENTRAL',
    description: 'central-storeroom',
  };
  controller.pageInitialized(page, app);
  controller.chooseStoreRoom(evt);
  expect(page.state.storeloc).toEqual('CENTRAL');
});

it('Choose chooseBinNumber', async () => {
  let showDialog = jest.fn();
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  page.showDialog = showDialog;
  const woReportWorkDs = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  const rotatingAssetDS = newDatasource1(singleAsset, "rotatingAssetDS");
  page.registerDatasource(rotatingAssetDS);
  page.registerDatasource(woReportWorkDs);
  page.registerDatasource(reportworkLabords);
  page.registerDatasource(wodetails);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  let evt = {
    itemnum: '10001',
    binnum: '2-3-4',
    curbal: '123',
    conditioncode: 'NEW',
  };
  controller.pageInitialized(page, app);
  controller.chooseBinNumber(evt);
  expect(page.datasources['reportWorkActualMaterialDs'].item.binnum).toEqual('2-3-4');
  expect(page.datasources['reportWorkActualMaterialDs'].item.conditioncode).toEqual('NEW');
});

it('Choose validateMaterial', async () => {
  let showDialog = jest.fn();
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  page.showDialog = showDialog;
  const woReportWorkDs = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  page.registerDatasource(craftrate);
  page.registerDatasource(wodetails);
  page.registerDatasource(woReportWorkDs);
  page.registerDatasource(reportworkLabords);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  controller.validateMaterial({page: page, app: app});
  expect(page.state.disableAction).toEqual(true);
});

it('Choose validateMaterial for Rotating asset', async () => {
  let showDialog = jest.fn();
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  page.showDialog = showDialog;
  page.state.isRotating = true;
  const woReportWorkDs = newDatasource(materialJson, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(wodetails);
  page.registerDatasource(woReportWorkDs);
  page.registerDatasource(reportworkLabords);
  const rotatingAssetDS = newDatasource1(singleAsset, 'rotatingAssetDS');
  page.registerDatasource(rotatingAssetDS);
  app.registerController(controller);
  app.registerPage(page);
  
  
  await wodetails.load();
  await woReportWorkDs.load();
  await rotatingAssetDS.load();
  
  await app.initialize();
  controller.pageInitialized(page, app);
  woReportWorkDs.items[0].positivequantity = 0;
  controller.validateMaterial({page: page, app: app});
  expect(page.state.disableAction).toEqual(true);

  woReportWorkDs.items[0].positivequantity = 2;
  controller.validateMaterial({page: page, app: app});
  expect(page.state.disableAction).toEqual(false);
  expect(page.state.useConfirmDialog).toEqual(true);

  woReportWorkDs.items[0].positivequantity = -2;
  controller.validateMaterial({page: page, app: app});
  expect(page.state.disableAction).toEqual(true);
  
  woReportWorkDs.items[0].assetnum = undefined;
  controller.validateMaterial({page: page, app: app});
  expect(page.state.disableAction).toEqual(true);

  
});

it('validate saveMaterialTransaction', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };

  const taskDS = newTaskDatasource(tasklist, 'woPlanTaskDetailds');
  page.registerDatasource(taskDS);

  const matListds = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  await matListds.load();
  page.registerDatasource(matListds);

  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(wodetails);
  page.registerDatasource(reportworkLabords);
  
  const forceReloadStubListDs = sinon.stub(matListds, 'forceReload');
  const initializeQbeStub = sinon.stub(matListds, 'initializeQbe');
  app.registerController(controller);

  const materialsDrawer = new Dialog({name: "materialsDrawer"});
  page.registerDialog(materialsDrawer);
  page.showDialog = jest.fn();
  materialsDrawer.closeDialog = jest.fn();

  app.registerPage(page);
  await app.initialize();

  jest.spyOn(app, "findDatasource").mockImplementation(() => taskDS);

  page.state.isSavedMaterial = true;
  page.state.saveAction = true;
  controller.pageInitialized(page, app);
  await controller.saveMaterialTransaction();  
  expect(page.state.loadingSaveMaterial).toEqual(false);
  expect(page.state.isSavedMaterial).toEqual(false);
  expect(forceReloadStubListDs.displayName).toBe('forceReload');
  forceReloadStubListDs.restore();

  matListds.schema = "";
  page.state.isSavedMaterial = true;
  page.state.saveAction = true;
  await controller.saveMaterialTransaction();
  expect(initializeQbeStub.called).toBe(true);
});

it("validate setCraftSkill", async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});

  app.registerPage(page);

  page.state = {laborCode: 'ELI'};
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}}
    }
  };
  app.registerController(controller);


  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const labordetails = newDatasource(labor, "labordetails", "labtransid", "reportworkLaborDetailds");
  let craftRateStub = sinon.stub(craftrate, 'searchQBE');
  page.registerDatasource(craftrate);
  page.registerDatasource(labordetails);
  const evt = {
    "item": {
      "labtransid": 100232,
      "regularhrs": 0,
      "transtype": "WORK",
      "laborcode": "WILSON",
      "timerstatus": "ACTIVE",
      "displayname": "Mike Wilson",
      "groupedlabor": [
        {
          "anywhererefid": 1728377330197,
          "craftid": "CRAFTNEW",
          "localref": "oslc/os/mxapiwodetail/_QkVERk9SRC8xMzAw/uxshowactuallabor/0-100232",
          "transtype": "WORK",
          "craft": "CRAFTNEW",
          "transtype_description": "Actual work time",
          "starttime": "2024-10-08T14:18:00+00:00",
          "startdate": "2024-10-08T00:00:00+00:00",
          "timerstatus_maxvalue": "ACTIVE",
          "craftdescription": "Technician Craft",
          "timerstatus_description": "The Labor Transaction has been started and timer is active",
          "laborcode": "WILSON",
          "regularhrs": 0,
          "_rowstamp": "1425500",
          "labtransid": 100232,
          "transtype_maxvalue": "WORK",
          "outside": false,
          "payrate": 0,
          "craftskill": [
            {
              "skillleveldesc": "Technician Craft"
            }
          ],
          "displayname": "Mike Wilson",
          "timerstatus": "ACTIVE",
          "href": "http://childkey#V09SS09SREVSL0xBQlRSQU5TL1dJTFNPTi8xMDAyMzIvQkVERk9SRA--",
          "startdatetime": "2024-10-08T08:48:00+00:00",
          "_bulkid": "100232",
          "computedstartdate": "October 08, 2024"
        }
      ],
      "timerstatus_maxvalue": "ACTIVE",
      "transtype_description": "Actual work time",
      "_bulkid": "100232",
      "computedstartdate": null,
      "computedfinishdate": null
    },
    "action": "update"
  }
  await app.initialize();
  controller.pageInitialized(page, app);

  await controller.setCraftSkill(evt);
  expect(craftRateStub.called).toBe(true);
  expect(page.state.vendor).toEqual(labordetails.item.vendor);
  expect(page.state.contractnum).toEqual(labordetails.item.contractnum);
});

it("validate selectLabor", async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };

  app.registerPage(page);
  app.registerController(controller);


  const synonymDSData = newStatusDatasource(statusitem, 'synonymdomainData');
  page.registerDatasource(synonymDSData);
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const labordetails = newDatasource(labor, "labordetails", "labtransid", "reportworkLaborDetailds");
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(craftrate);
  page.registerDatasource(labordetails);
  page.registerDatasource(reportworkLabords);
  page.registerDatasource(wodetails);
  const failureListDS = newDatasource(failurelist, "member", "failurelist", "dsFailureList");
  app.registerDatasource(failureListDS);
  page.dsFailureList = failureListDS;
  await app.initialize();

  controller.pageInitialized(page, app);
  let evt = {
    laborcode: 'ELI',
    _selected: true
  }

  await controller.selectLabor(evt);
  expect(page.state.laborCode).toBe('ELI');
});

it("validate openLaborLookup", async () => {
  let showDialog = jest.fn();
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  app.registerPage(page);
  page.showDialog = showDialog;
  page.state = {laborCode: 'ADAMS', laborCodeDesc: 'Hank Adams'};

  page.state.selectedLabors = new Map([['wilson',{laborcode : 'wilson'}]])
  app.registerController(controller);
  const labors = {
    member: [
      {
        _rowstamp: '14303857',
        laborcode: 'wilson',
        displayname: 'mike wilson',
        orgid: 'EAGLENA',
        siteid: 'BEDFORD',      
      },
      {
        _rowstamp: '14303858',
        laborcode: 'Jones',
        displayname: 'Frank Jones',
        orgid: 'EAGLENA',
        siteid: 'BEDFORD',      
      },
      {
        _rowstamp: '14303859',
        laborcode: 'Pedrick',
        displayname: 'mike Pedrick',
        orgid: 'EAGLENA',
        siteid: 'BEDFORD',      
      },
    ]
  }
  const laborDs = newDatasource1(labors, "laborDs");
  const laborJsonDS = newDatasource1(labors, "laborJsonDS");
  let laborDstub = sinon.stub(laborDs, 'searchQBE');
  let laborJsonDSstub = sinon.stub(laborJsonDS, 'reset');
  const showDialogSpy = jest.spyOn(app, 'showDialog').mockImplementation(() => {});
  app.registerDatasource(laborDs);
  await laborDs.load();
  app.registerDatasource(laborJsonDS);
  await laborJsonDS.load();
  
  await app.initialize();
  controller.pageInitialized(page, app);

  let evt = {
    orgid: 'EAGLENA',
    page: page
  }
  await controller.openLaborLookup(evt);
  expect(laborDstub.called).toBe(true);
  expect(laborJsonDSstub.called).toBe(true);
  expect(showDialogSpy).toHaveBeenCalledWith("laborLookup");
});


it('Open the RotatingAssetLookup()', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  const rotatingAssetDS = newDatasource(woassetmeters, 'member', 'assetnum', 'rotatingAssetDS');
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(wodetails);
  page.registerDatasource(rotatingAssetDS);
  page.registerDatasource(reportworkLabords);
  app.registerController(controller);
  rotatingAssetDS.item.assetnum = '13170';
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);

  controller.openRotatingAssetLookup({page: page, app: app});
  expect(page.datasources['rotatingAssetDS'].item.assetnum).toEqual('13170');
});

it('Choose chooseRotatingAsset', async () => {
  let showDialog = jest.fn();
  let validateMaterial = jest.fn();
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  page.showDialog = showDialog;
  controller.validateMaterial = validateMaterial;
  const rotatingAssetDS = newDatasource(workorderitem, 'member', 'assetnum', 'reportWorkActualMaterialDs');
  page.registerDatasource(rotatingAssetDS);
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(wodetails);
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  page.registerDatasource(reportworkLabords);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  let evt = {
    assetnum: '10001',
    description: 'test description',
  };
  controller.pageInitialized(page, app);
  controller.chooseRotatingAsset(evt);
  expect(page.datasources['reportWorkActualMaterialDs'].item.assetnum).toEqual('10001');
  expect(page.datasources['reportWorkActualMaterialDs'].item.asset_description).toEqual('test description');
  expect(controller.validateMaterial.mock.calls.length).toBe(1);
});

it('verify the getRotatingAsset()', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  const synonymDSData = newStatusDatasource(statusitem, 'synonymDSData');
  page.registerDatasource(synonymDSData);
  const rotatingAssetDS = newDatasource(woassetmeters, 'member', 'assetnum', 'rotatingAssetDS');
  const woReportWorkDs = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const reportworksSynonymData = newStatusDatasource(statusitem, "reportworksSynonymData");
  page.registerDatasource(reportworksSynonymData);
  page.registerDatasource(craftrate);
  page.registerDatasource(wodetails);
  page.registerDatasource(reportworkLabords);  
  page.registerDatasource(rotatingAssetDS);
  page.registerDatasource(woReportWorkDs);
  app.registerController(controller);
  app.registerPage(page);
  await rotatingAssetDS.load();
  await woReportWorkDs.load();
  await app.initialize();
  controller.pageInitialized(page, app);
  page.state.itemnum = '1001';
  page.state.storeloc = 'CENTRAL';
  let evt = {
    assetnum: '10001',
    description: 'test description',
  };
  rotatingAssetDS.searchQBE=()=>Promise.resolve([evt]);
  jest.spyOn(controller, 'validateMaterial').mockImplementation(() => {
    return true
  });
  await controller.getRotatingAsset();
  expect(page.state.rotatingAsset).toEqual(true);
});

it("should give error while completing the workorder", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "page"});
  const schedPage = new Page({name: "schedule"});

  page.state = {
    reportWorkPrompt: {}
  };
  app.state.disableScan = false;

  app.registerPage(page);
  app.registerPage(schedPage);

  app.client = {
    userInfo: {
      personid: "SAM",
    }
  };

  app.registerController(controller);
  workorderitem.member[0] = {...workorderitem.member[0], iscalibration : true, pluscwodscount: 2 };
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");

  page.registerDatasource(wodetails);

  jest.spyOn(CommonUtil, 'validateDataSheet').mockImplementation(() => {
    return true
  });
  jest.spyOn(CommonUtil, 'validateActualTools').mockImplementation(() => {
    return true
  });
  
  const getAppsSpy = jest.spyOn(page, "getApplication").mockImplementation(() => app);
  const callControllerSpy = jest.spyOn(app, "callController").mockImplementation(() => true);
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);

  let evt = {
    item: {
      downprompt: "1",
      assetisrunning: false,
      assetnumber: '1001'
    },
    datasource: wodetails
  }
  page.state.enforceAssetScan = 1;
  jest.spyOn(CommonUtil, 'checkScanRequired').mockImplementation(() => {
    return true
  });

  let response = await controller.completeWorkorder(evt);
  expect(response).toBe(false);
  getAppsSpy.mockRestore();
  callControllerSpy.mockRestore();
});

it('Open the ToolsDrawer', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
	    defaultSite: 'BEDFORD',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  let showDialogSpy = sinon.spy(page, 'showDialog');
  let resetDataSpy = sinon.spy(controller, 'resetToolStoreBinAsset');
  const woReportWorkDs = newDatasource(workorderitem, 'member', 'wonum', 'reportWorkActualToolsDetailDs');
  const materialDS = newDatasource(wpmaterial, "member", "itemnum", "reportWorkActualMaterialDs");
  const toolDS = newDatasource(toolDetail, 'member', 'itemnum', 'toolDS');
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  page.registerDatasource(reportworkLabords);
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(wodetails);
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  page.registerDatasource(craftrate);
  const taskLookupDS = newDatasource(taskDetail, 'member', 'taskid', 'woTaskds');
  page.registerDatasource(taskLookupDS);
  page.registerDatasource(woReportWorkDs);
  page.registerDatasource(materialDS)
  app.registerDatasource(toolDS);
  app.registerDatasource(newWoDatasource(workorderitem, "woDetailds"));
  app.registerController(controller);
  app.registerPage(page);
  let tooltrans = await woReportWorkDs.load();
  sinon.stub(woReportWorkDs, "addNew").returns(tooltrans[0]);
  await app.initialize();
  controller.pageInitialized(page, app);
  await controller.openToolsDrawer();

  expect(woReportWorkDs.item['item_itemnum']).toEqual('');
  expect(woReportWorkDs.item['item_description']).toEqual('');
  expect(woReportWorkDs.item['toolqty']).toEqual(1);
  expect(woReportWorkDs.item['toolhrs']).toEqual(1);
  expect(woReportWorkDs.item['task_id']).toEqual('');
  expect(woReportWorkDs.item['task_description']).toEqual('');
  expect(page.state.itemnum).toBe(false);
  expect(page.state.disableToolAction).toBe(true);
  expect(resetDataSpy.calledOnce).toBe(true);
  expect(woReportWorkDs.item['storeloc_desc']).toEqual('');
  expect(woReportWorkDs.item['storeloc']).toEqual('');
  expect(woReportWorkDs.item['binnum']).toEqual('');
  expect(woReportWorkDs.item['lotnum']).toEqual('');
  expect(woReportWorkDs.item['assetnum']).toEqual('');
  expect(woReportWorkDs.item['asset_description']).toEqual('');
  expect(page.state.storeloc).toEqual('');
  expect(page.state.binnum).toBe(false);
  expect(page.state.rotatingAsset).toBe(false);
  expect(showDialogSpy.calledOnce).toBe(true);
  expect(showDialogSpy.getCall(0).args[0]).toStrictEqual('toolsDrawer');

  const calibrationStub = sinon.stub(controller, 'isCalibrationWo').returns(true);
  const clearWarningStub = sinon.stub(controller, 'clearCalToolWarning');
  await controller.openToolsDrawer();
  expect(woReportWorkDs.item['item_itemnum']).toEqual('');  
  expect(woReportWorkDs.item['binnum']).toEqual('');  
  expect(woReportWorkDs.item['storeloc']).toEqual('');  
  expect(woReportWorkDs.item['assetnum']).toEqual('');  
  expect(clearWarningStub.called).toBe(true);
  calibrationStub.restore();
  clearWarningStub.restore();
});

it('Open the ToolsLookup', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.name = 'technician';
  app.client = {
    userInfo: {
      personid: 'SAM',
	    defaultSite: 'BEDFORD',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  const isCalibrationSpy = sinon.stub(controller, 'isCalibrationWo').returns(true);
  const resetToolLookupStub = sinon.stub(controller, 'resetToolLookup');
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  page.registerDatasource(reportworkLabords);
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(wodetails);
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  page.registerDatasource(craftrate);
  const toolDS = newDatasource(toolDetail, 'member', 'itemnum', 'toolDS');
  page.registerDatasource(toolDS);
  let showDialogSpy = sinon.spy(page, 'showDialog');
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  let evt = {page: page, app: app};

  await controller.openToolsLookup(evt);
  expect(showDialogSpy.calledOnce).toBe(true);
  expect(showDialogSpy.getCall(0).args[0]).toStrictEqual('toolLookup');
  expect(isCalibrationSpy.calledOnce).toBe(true);
  isCalibrationSpy.restore();
  resetToolLookupStub.restore();
});

it('chooseTool', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  const toolLookupDialog = new Dialog({
    name: 'toolLookup'
  });
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  app.registerPage(page);
  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainData);
  await synonymdomainData.load();
  sinon.spy(controller, 'resetTechnician');
  let setToolStoreSpy = sinon.spy(controller, 'setToolStore');
  const clearWarningStub = sinon.stub(controller, 'clearCalToolWarning');
  const chooseCalAssetSpy = sinon.stub(controller, 'chooseCalAsset');
  let isCalibrationWo = sinon.stub(controller, 'isCalibrationWo').returns(false);
  const validateToolDataStub = sinon.stub(controller, 'validateToolData');
  const toolDS = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDetailDs');
  const inventoryDS = newDatasource1(toolInventory, 'inventoryDS');
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  page.registerDatasource(craftrate);
  page.registerDatasource(wodetails);
  page.registerDatasource(reportworkLabords);
  page.registerDatasource(toolDS);
  page.registerDatasource(inventoryDS);
  toolLookupDialog.closeDialog = jest.fn();
  page.registerDialog(toolLookupDialog);
  app.registerController(controller);
  await app.initialize();
  let evt = {
    itemnum: 'LATHE',
    description: 'MACHINE TOOL LATHE',
  };
  await controller.pageInitialized(page, app);
  await controller.chooseTool(evt);
  expect(page.state.itemnum).toEqual('LATHE');
  expect(toolDS.item['item_itemnum']).toEqual(evt.itemnum);
  expect(toolDS.item['item_description']).toEqual(evt.description);
  expect(setToolStoreSpy.calledOnce).toBe(true);
  isCalibrationWo.restore();
  isCalibrationWo = sinon.stub(controller, 'isCalibrationWo').returns(true);
  evt.rotating = true;
  wodetails.item.assetnum = "";
  await controller.chooseTool(evt);
  expect(chooseCalAssetSpy.calledOnce).toBe(true);
  wodetails.item.assetnum = "AST01";
  evt.rotating = false;
  await controller.chooseTool(evt);
  expect(page.state.useConfirmDialog).toBe(true);
  expect(clearWarningStub.called).toBe(true);
  isCalibrationWo.restore();
  validateToolDataStub.restore();
  clearWarningStub.restore();
});

it('verify the setToolStore() for multiple storerooms', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      defaultSite: 'BEDFORD'
    },
  };
  let resetToolStoreBinAssetSpy = sinon.spy(controller, 'resetToolStoreBinAsset');
  page.state.itemnum = 'PURGE';

  const inventoryDS = newDatasource1(toolInventory, 'inventoryToolDS');
  const locationDS = newDatasource(toolLocation, 'member', 'location', 'locationDS');
  const woToolDataDS = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDetailDs');
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const woDetailsReportWork = newDatasource(labor, "wodetails", "wonum", "woDetailsReportWork");
  page.registerDatasource(woDetailsReportWork);
  page.registerDatasource(craftrate);
  const synonymDSData = newStatusDatasource(statusitem, 'synonymDSData');
  page.registerDatasource(synonymDSData);  
  await synonymDSData.load();
  await woDetailsReportWork.load();
  await inventoryDS.load();
  await locationDS.load();
  let inventorydsStub = sinon.stub(inventoryDS, 'searchQBE');
  let inventorydsStub2 = sinon.stub(inventoryDS, 'initializeQbe');
  let locationdsStub2 = sinon.stub(locationDS, 'initializeQbe');
  page.registerDatasource(inventoryDS);
  page.registerDatasource(locationDS);
  page.registerDatasource(woToolDataDS);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);

  await controller.setToolStore();
  expect(inventorydsStub.called).toBe(true);
  expect(inventorydsStub.displayName).toBe('searchQBE');
  expect(inventorydsStub2.called).toBe(true);
  expect(inventorydsStub2.displayName).toBe('initializeQbe');
  expect(locationdsStub2.called).toBe(true);
  expect(locationdsStub2.displayName).toBe('initializeQbe');
  expect(page.state.multipleLocations).toBe(true);
  expect(resetToolStoreBinAssetSpy.calledOnce).toBe(true);
});

it('verify the setToolStore() for single location', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      defaultSite: 'BEDFORD'
    },
  };
  let setToolBinSpy = sinon.spy(controller, 'setToolBinNumber');
  page.state.itemnum = 'PURGE';
  const inventoryDS = newDatasource1(toolInventory, 'inventoryToolDS');
  const locationDS = newDatasource(singleLocation, 'member', 'location', 'locationDS');
  const woToolDataDS = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDetailDs');
  const binNumberDS = newDatasource(invbalances, 'member', 'binnum', 'inventbalDS');
  await inventoryDS.load();
  await locationDS.load();
  let inventorydsStub = sinon.stub(inventoryDS, 'searchQBE');
  let inventorydsStub2 = sinon.stub(inventoryDS, 'initializeQbe');
  let locationdsStub = sinon.stub(locationDS, 'initializeQbe');
  let locationdsStub2 = sinon.stub(locationDS, 'clearQBE');

  page.registerDatasource(inventoryDS);
  page.registerDatasource(locationDS);
  page.registerDatasource(woToolDataDS);
  page.registerDatasource(binNumberDS);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);

  await controller.setToolStore();
  expect(inventorydsStub.called).toBe(true);
  expect(inventorydsStub.displayName).toBe('searchQBE');
  expect(inventorydsStub2.called).toBe(true);
  expect(inventorydsStub2.displayName).toBe('initializeQbe');
  expect(locationdsStub.called).toBe(true);
  expect(locationdsStub.displayName).toBe('initializeQbe');
  expect(locationdsStub2.called).toBe(true);
  expect(locationdsStub2.displayName).toBe('clearQBE');
  expect(page.state.multipleLocations).toBe(false);
  expect(page.state.storeloc).toEqual(singleLocation.member[0].location);
  expect(woToolDataDS.item['storeloc_desc']).toEqual(singleLocation.member[0].description);
  expect(woToolDataDS.item['storeloc']).toBe(singleLocation.member[0].location);
  expect(setToolBinSpy.calledOnce).toBe(true);
});

it('verify the setToolStore() -- no tool inventory data', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      defaultSite: 'BEDFORD'
    },
  };
  let resetDataSpy = sinon.spy(controller, 'resetToolStoreBinAsset');
  page.state.itemnum = 'PURGE';
  let blanktoolInventory = [];
  const inventoryDS = newDatasource1(blanktoolInventory, 'inventoryToolDS');
  let inventorydsStub = sinon.stub(inventoryDS, 'searchQBE');
  let inventorydsStub2 = sinon.stub(inventoryDS, 'initializeQbe');
  const woToolDataDS = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDetailDs');
  page.registerDatasource(inventoryDS);
  page.registerDatasource(woToolDataDS);
  app.registerController(controller);
  await inventoryDS.load();
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  await controller.setToolStore();

  expect(inventorydsStub.called).toBe(true);
  expect(inventorydsStub.displayName).toBe('searchQBE');
  expect(inventorydsStub2.called).toBe(true);
  expect(inventorydsStub2.displayName).toBe('initializeQbe');
  expect(resetDataSpy.calledOnce).toBe(true);
  expect(page.state.multipleLocations).toBe(false);
});

it("should set storeloc and storeloc_desc to null", () => {
  const controller = new ReportWorkPageController();
  const event = { target: {} };
  const reportWorkToolsDs = {
    item: {
      storeloc: "test",
      storeloc_desc: "test"
    }
  };
  const app = {
    findDatasource: jest.fn(() => reportWorkToolsDs)
  };
  const page = new Page({name: 'report_work'});

  controller.pageInitialized(page, app)
  controller.removeStore(event);
  expect(reportWorkToolsDs.item.storeloc).toBeNull();
  expect(reportWorkToolsDs.item.storeloc_desc).toBeNull();
});

it('chooseToolStoreRoom', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
	    defaultSite: 'BEDFORD',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  let resetDataSpy = sinon.spy(controller, 'resetToolBinData');
  let setToolBinSpy = sinon.spy(controller, 'setToolBinNumber');
  let setToolRotAssetSpy = sinon.spy(controller, 'setToolRotatingAsset');
  const toolDS = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDetailDs');
  const binNumberDS = newDatasource(invbalances, 'member', 'binnum', 'inventbalDS');
  const rotatingAssetDS = newDatasource1(singleAsset, 'rotatingAssetDS');
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  page.registerDatasource(reportworkLabords);
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(wodetails);
  const toolStoreDialog = new Dialog({
    name: 'toolStoreRoomLookup'
  });
  toolStoreDialog.closeDialog = jest.fn();
  page.registerDialog(toolStoreDialog);
  page.registerDatasource(toolDS);
  page.registerDatasource(binNumberDS);
  page.registerDatasource(rotatingAssetDS);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  let evt = {
    itemnum: '10001',
    location: 'CENTRAL',
    description: 'central-storeroom',
  };
  controller.pageInitialized(page, app);

  controller.chooseToolStoreRoom(evt);
  expect(toolDS.item.storeloc_desc).toEqual(evt.description);
  expect(toolDS.item.storeloc).toEqual(evt.location);
  expect(page.state.storeloc).toEqual(evt.location);
  expect(resetDataSpy.calledOnce).toBe(true);
  expect(setToolBinSpy.calledOnce).toBe(true);
  expect(setToolRotAssetSpy.calledOnce).toBe(true);
});

it('Open the ToolStoreLookup', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  const synonymdomainData = newTimerStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainData);
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  page.registerDatasource(reportworkLabords);
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(wodetails);
  const failureListDS = newDatasource(failurelist, "member", "failurelist", "dsFailureList");
  app.registerDatasource(failureListDS);
  page.dsFailureList = failureListDS;
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  page.registerDatasource(craftrate);
  let showDialogSpy = sinon.spy(page, 'showDialog');
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  let evt = {page: page, app: app};

  await controller.openToolStoreLookup(evt);
  expect(showDialogSpy.calledOnce).toBe(true);
  expect(showDialogSpy.getCall(0).args[0]).toStrictEqual('toolStoreRoomLookup');
});

it('chooseToolBinNumber', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  const synonymdomainData = newTimerStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainData);
  let setToolRotAssetSpy = sinon.spy(controller, 'setToolRotatingAsset');
  const toolDS = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDetailDs');
  const rotatingAssetDS = newDatasource(woassetmeters, 'member', 'assetnum', 'rotatingAssetDS');
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  page.registerDatasource(reportworkLabords);
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(wodetails);
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  page.registerDatasource(craftrate);
  const failureListDS = newDatasource(failurelist, "member", "failurelist", "dsFailureList");
  await failureListDS.load();
  app.registerDatasource(failureListDS);
  page.dsFailureList = failureListDS;
  const toolBinDialog = new Dialog({
    name: 'toolBinLookup'
  });
  toolBinDialog.closeDialog = jest.fn();
  page.registerDialog(toolBinDialog);
  page.registerDatasource(toolDS);
  page.registerDatasource(rotatingAssetDS);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  let evt = {
    itemnum: '10001',
    binnum: '2-3-4',
    lotnum: '1.5',
  };
  controller.pageInitialized(page, app);

  controller.chooseToolBinNumber(evt);
  expect(toolDS.item.binnum).toEqual(evt.binnum);
  expect(toolDS.item.lotnum).toEqual(evt.lotnum);
  expect(page.state.binnum).toEqual(evt.binnum);
  expect(setToolRotAssetSpy.calledOnce).toBe(true);

  evt = {
    itemnum: '10001',
    binnum: '',
    lotnum: '',
  };

  controller.chooseToolBinNumber(evt);
  expect(toolDS.item.binnum).toEqual('');
  expect(toolDS.item.lotnum).toEqual('');
  expect(page.state.binnum).toEqual('');
  expect(setToolRotAssetSpy.calledTwice).toBe(true);
});

it('Open the ToolBinLookup()', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      defaultSite: 'BEDFORD'
    },
  };
  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  page.registerDatasource(synonymdomainData);
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  page.registerDatasource(reportworkLabords);
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(wodetails);
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  page.registerDatasource(craftrate);
  let showDialogSpy = sinon.spy(page, 'showDialog');
  app.registerController(controller);
  await synonymdomainData.load();
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  let evt = {page: page, app: app};

  await controller.openToolBinLookup(evt);
  expect(showDialogSpy.calledOnce).toBe(true);
  expect(showDialogSpy.getCall(0).args[0]).toStrictEqual('toolBinLookup');
});

it('verify the setToolBinNumber() -- no invbal data', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  let resetBinSpy = sinon.spy(controller, 'resetToolBinData');
  let blankInvbal = [];
  app.client = {
    userInfo: {
      personid: 'SAM',
      defaultSite: 'BEDFORD'
    },
  };
  page.state.itemnum = 'TORCH';
  page.state.storeloc = 'CENTRAL';
  const synonymDSData = newStatusDatasource(statusitem, 'synonymDSData');
  page.registerDatasource(synonymDSData);
  const inventbalDS = newDatasource1(blankInvbal, 'inventbalDS');
  let inventorydsStub = sinon.stub(inventbalDS, 'initializeQbe');
  const synonymdomainData = newTimerStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainData);
  const woToolDataDS = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDetailDs');
  page.registerDatasource(inventbalDS);
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  page.registerDatasource(reportworkLabords);
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const woDetailsReportWork = newDatasource(labor, "wodetails", "wonum", "woDetailsReportWork");
  page.registerDatasource(woDetailsReportWork);
  page.registerDatasource(craftrate);
  page.registerDatasource(woToolDataDS);
  app.registerController(controller);
  app.registerPage(page);
  await inventbalDS.load();
  await woDetailsReportWork.load();
  await synonymDSData.load();
  await app.initialize();
  controller.pageInitialized(page, app);
  await controller.setToolBinNumber();

  expect(inventorydsStub.called).toBe(true);
  expect(inventorydsStub.displayName).toBe('initializeQbe');
  expect(resetBinSpy.calledOnce).toBe(true);
});

it('verify the setToolBinNumber() -- single bin case', async () => {
  const controller = new ReportWorkPageController();
  let setToolRotAssetSpy = sinon.spy(controller, 'setToolRotatingAsset');
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      defaultSite: 'BEDFORD'
    },
  };
  page.state.itemnum = 'TORCH';
  page.state.storeloc = 'CENTRAL';
  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  page.registerDatasource(synonymdomainData);
  let inventbalDS = newDatasource1(singleBin, 'inventbalDS');
  let rotatingAssetDS = newDatasource1(singleBin, 'rotatingAssetDS');
  let inventoryinitStub = sinon.stub(inventbalDS, 'initializeQbe');
  let inventoryclearStub = sinon.stub(inventbalDS, 'clearQBE');
  const woReportWorkDs = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDetailDs');
  await inventbalDS.load();
  await synonymdomainData.load();
  page.registerDatasource(inventbalDS);
  page.registerDatasource(rotatingAssetDS);
  page.registerDatasource(woReportWorkDs);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  await controller.setToolBinNumber();

  expect(inventoryinitStub.called).toBe(true);
  expect(inventoryinitStub.displayName).toBe('initializeQbe');
  expect(inventoryclearStub.called).toBe(true);
  expect(inventoryclearStub.displayName).toBe('clearQBE');
  expect(woReportWorkDs.item.binnum).toEqual(singleBin.member[0].binnum);
  expect(woReportWorkDs.item.lotnum).toEqual(singleBin.member[0].lotnum);
  expect(page.state.binnum).toEqual(singleBin.member[0].binnum);
  expect(page.state.multipleBins).toEqual(false);
  expect(setToolRotAssetSpy.calledOnce).toBe(true);
});

it('verify the setToolBinNumber() -- single blank bin case', async () => {
  const controller = new ReportWorkPageController();
  let setToolRotAssetSpy = sinon.spy(controller, 'setToolRotatingAsset');
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      defaultSite: 'BEDFORD'
    },
  };
  page.state.itemnum = 'TORCH';
  page.state.storeloc = 'CENTRAL';
  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  page.registerDatasource(synonymdomainData);
  let inventbalDS = newDatasource1(singleBlankBin, 'inventbalDS');
  let rotatingAssetDS = newDatasource1(singleBlankBin, 'rotatingAssetDS');
  let inventoryinitStub = sinon.stub(inventbalDS, 'initializeQbe');
  let inventoryclearStub = sinon.stub(inventbalDS, 'clearQBE');
  const woReportWorkDs = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDetailDs');
  await inventbalDS.load();
  await synonymdomainData.load();
  page.registerDatasource(inventbalDS);
  page.registerDatasource(rotatingAssetDS);
  page.registerDatasource(woReportWorkDs);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  await controller.setToolBinNumber();

  expect(inventoryinitStub.called).toBe(true);
  expect(inventoryinitStub.displayName).toBe('initializeQbe');
  expect(inventoryclearStub.called).toBe(true);
  expect(inventoryclearStub.displayName).toBe('clearQBE');
  expect(woReportWorkDs.item.binnum).toEqual(singleBlankBin.member[0].binnum);
  expect(woReportWorkDs.item.lotnum).toEqual(singleBlankBin.member[0].lotnum);
  expect(page.state.binnum).toEqual(singleBlankBin.member[0].binnum);
  expect(page.state.multipleBins).toEqual(false);
  expect(setToolRotAssetSpy.calledOnce).toBe(true);
});

it('setToolBinNumber() --verify the multibin case', async () => {
  const controller = new ReportWorkPageController();
  let openBinLookupSpy = sinon.spy(controller, 'openToolBinLookup');
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      defaultSite: 'BEDFORD'
    },
  };
  page.state.itemnum = 'TORCH';
  page.state.storeloc = 'CENTRAL';
  const synonymDSData = newStatusDatasource(statusitem, 'synonymdomainData');
  page.registerDatasource(synonymDSData);
  let inventbalDS = newDatasource1(multiBin, 'inventbalDS');
  let inventoryinitStub = sinon.stub(inventbalDS, 'initializeQbe');
  let inventoryclearStub = sinon.stub(inventbalDS, 'clearQBE');
  const woReportWorkDs = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDs');
  await inventbalDS.load();
  await synonymDSData.load();
  page.registerDatasource(inventbalDS);
  page.registerDatasource(woReportWorkDs);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  await controller.setToolBinNumber();

  expect(inventoryinitStub.called).toBe(true);
  expect(inventoryinitStub.displayName).toBe('initializeQbe');
  expect(inventoryclearStub.called).toBe(true);
  expect(inventoryclearStub.displayName).toBe('clearQBE');
  expect(page.state.multipleBins).toEqual(true);
  expect(openBinLookupSpy.calledOnce).toBe(true);
});

it('chooseToolRotatingAsset', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      defaultSite: 'BEDFORD'
    },
  };
  const synonymDSData = newStatusDatasource(statusitem, 'synonymdomainData');
  page.registerDatasource(synonymDSData);
  const toolDS = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDetailDs');
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  page.registerDatasource(reportworkLabords);
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(wodetails);
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  page.registerDatasource(craftrate);
  const toolAssetDialog = new Dialog({
    name: 'toolRotatingAssetLookup'
  });
  toolAssetDialog.closeDialog = jest.fn();
  page.registerDialog(toolAssetDialog);
  page.registerDatasource(toolDS);
  app.registerController(controller);
  await synonymDSData.load();
  app.registerPage(page);
  await app.initialize();
  let evt = {
    assetnum: '1001',
    description: 'Rotating Asset',
  };
  controller.pageInitialized(page, app);
  const stub = await sinon.stub(controller, 'validateToolDueDate').returns(true);
  await stub();
  await controller.chooseToolRotatingAsset(evt);
  expect(toolDS.item.assetnum).toEqual(evt.assetnum);
  expect(toolDS.item.asset_description).toEqual(evt.description);
  expect(page.state.rotatingAsset).toBe(true);
});

it('verify the setToolRotatingAsset() -- no rotating assets', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      defaultSite: 'BEDFORD'
    },
  };
  let resetAssetSpy = sinon.spy(controller, 'resetToolAssetData');
  let blankRotAsset = [];
  page.state.itemnum = 'TORCH';
  page.state.storeloc = 'CENTRAL';
  page.state.itemnum = 'B1';
  const synonymDSData = newStatusDatasource(statusitem, 'synonymdomainData');
  page.registerDatasource(synonymDSData);
  const rotatingAssetDS = newDatasource1(blankRotAsset, 'rotatingAssetDS');
  let rotassetdsStub = sinon.stub(rotatingAssetDS, 'initializeQbe');
  const woToolDataDS = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDetailDs');
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(wodetails);
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  page.registerDatasource(craftrate);  
  page.registerDatasource(reportworkLabords);
  page.registerDatasource(rotatingAssetDS);
  page.registerDatasource(woToolDataDS);
  app.registerController(controller);
  await rotatingAssetDS.load();
  await synonymDSData.load();
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  await controller.setToolRotatingAsset();

  expect(rotassetdsStub.called).toBe(true);
  expect(rotassetdsStub.displayName).toBe('initializeQbe');
  expect(resetAssetSpy.calledOnce).toBe(true);
});

it('verify the setToolRotatingAsset() -- single rotating asset', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
      defaultSite: 'BEDFORD'
    },
  };
  const synonymDSData = newStatusDatasource(statusitem, 'synonymdomainData');
  page.registerDatasource(synonymDSData);
  const rotatingAssetDS = newDatasource(singleAsset, 'member', 'assetnum', 'rotatingAssetDS');
  let rotassetinitStub = sinon.stub(rotatingAssetDS, 'initializeQbe');
  let calibrationStub = sinon.stub(controller, 'isCalibrationWo').returns(true);
  const woReportWorkDs = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualToolsDetailDs');
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  page.registerDatasource(craftrate);
  page.registerDatasource(wodetails);
  page.registerDatasource(reportworkLabords);
  page.registerDatasource(rotatingAssetDS);
  page.registerDatasource(woReportWorkDs);
  app.registerController(controller);
  await synonymDSData.load();
  await rotatingAssetDS.load();
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  await controller.setToolRotatingAsset();

  expect(rotassetinitStub.called).toBe(true);
  expect(woReportWorkDs.item.assetnum).toEqual(singleAsset.member[0].assetnum);
  expect(woReportWorkDs.item.asset_description).toEqual(singleAsset.member[0].description);
  expect(page.state.rotatingAsset).toEqual(true);
  expect(page.state.multipleRotatingAsset).toEqual(false);

  calibrationStub.restore();
});

it('verify the setToolRotatingAsset() -- multiasset', async () => {
  const controller = new ReportWorkPageController();
  let resetAssetSpy = sinon.spy(controller, 'resetToolAssetData');
  let openAssetLookupSpy = sinon.spy(controller, 'openToolRotatingAssetLookup');
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
	    defaultSite: 'BEDFORD',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  const synonymDSData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymDSData);
  let rotatingAssetDS = newDatasource(woassetmeters, 'member', 'assetnum', 'rotatingAssetDS');
  let rotassetinitStub = sinon.stub(rotatingAssetDS, 'initializeQbe');
  const woReportWorkDs = newDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualToolsDetailDs');
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  page.registerDatasource(craftrate);
  page.registerDatasource(wodetails);
  page.registerDatasource(reportworkLabords);
  page.registerDatasource(rotatingAssetDS);
  page.registerDatasource(woReportWorkDs);
  app.registerController(controller);
  app.registerPage(page);
  await rotatingAssetDS.load();
  await synonymDSData.load();
  await app.initialize();
  controller.pageInitialized(page, app);
  await controller.setToolRotatingAsset();

  expect(rotassetinitStub.called).toBe(true);
  expect(page.state.multipleRotatingAsset).toEqual(true);
  expect(resetAssetSpy.calledOnce).toBe(true);
  expect(openAssetLookupSpy.calledOnce).toBe(true);
});

it('Open the ToolRotatingAssetLookup()', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
	    defaultSite: 'BEDFORD',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  const synonymDSData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymDSData);
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  page.registerDatasource(reportworkLabords);
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(wodetails);
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  page.registerDatasource(craftrate);
  const failureListDS = newDatasource(failurelist, "member", "failurelist", "dsFailureList");
  failureListDS.load();
  app.registerDatasource(failureListDS);
  page.dsFailureList = failureListDS;
  let showDialogSpy = sinon.spy(page, 'showDialog');
  app.registerController(controller);
  await synonymDSData.load();
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  let evt = {page: page, app: app};

  controller.openToolRotatingAssetLookup(evt);
  expect(showDialogSpy.calledOnce).toBe(true);
  expect(showDialogSpy.getCall(0).args[0]).toStrictEqual('toolRotatingAssetLookup');
});

it('Open the Task Lookup', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
	    defaultSite: 'BEDFORD',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };

  const taskDS = newTaskDatasource(tasklist, 'woPlanTaskDetailds');
  app.registerDatasource(taskDS);

  const synonymDSData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymDSData);
  const taskLookupDS = newDatasource(taskDetail, 'member', 'taskid', 'woTaskds');
  page.registerDatasource(taskLookupDS);
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  page.registerDatasource(reportworkLabords);
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(wodetails);
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  page.registerDatasource(craftrate);
  const failureListDS = newDatasource(failurelist, "member", "failurelist", "dsFailureList");
  failureListDS.load();
  app.registerDatasource(newWoDatasource(workorderitem, "woDetailds"));
  app.registerDatasource(failureListDS);
  page.dsFailureList = failureListDS;
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  page.state = {wonum: '1202'};
  let evt = {page: page, app: app};
  let showDialogSpy = sinon.spy(evt.page, 'showDialog');
  controller.pageInitialized(page, app);
  await taskLookupDS.load();
  await wodetails.load();
  await synonymDSData.load();

  page.state.selectedTaskItem = taskLookupDS.items[0];

  await controller.getWoTasks();
  await controller.openTaskLookup(evt);
  expect(showDialogSpy.calledOnce).toBe(true);
  expect(showDialogSpy.getCall(0).args[0]).toStrictEqual('toolTaskLookup');
});

it('chooseTask', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
    userInfo: {
      personid: 'SAM',
	    defaultSite: 'BEDFORD',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  const synonymDSData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymDSData);
  const toolDS = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDetailDs');
  const labordetails = newDatasource(labor, "labordetails", "labtransid", "reportworkLaborDetailds");
  const materialDS = newDatasource(wpmaterial, "member", "itemnum", "reportWorkActualMaterialDs");
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const failureListDS = newDatasource(failurelist, "member", "failurelist", "dsFailureList");
  app.registerDatasource(failureListDS);
  page.dsFailureList = failureListDS;
  page.registerDatasource(craftrate);
  page.registerDatasource(wodetails);
  page.registerDatasource(reportworkLabords);
  page.registerDatasource(toolDS);
  page.registerDatasource(labordetails);
  page.registerDatasource(materialDS);
  app.registerController(controller);
  
  const toolTaskLookup = new Dialog({name: "toolTaskLookup"});
  page.registerDialog(toolTaskLookup);
  page.showDialog = jest.fn();
  toolTaskLookup.closeDialog = jest.fn();

  app.registerPage(page);
  await app.initialize();
  let evt = {
    taskid: '10',
    description: 'scheduling',
    workorderid: 'WO1202'
  };
  controller.pageInitialized(page, app);

  controller.chooseTask(evt);
  expect(toolDS.item.task_id).toEqual(evt.taskid);
  expect(toolDS.item.task_description).toEqual(evt.description);
  expect(page.state.taskid).toEqual(evt.workorderid);
  expect(labordetails.item.taskid).toEqual(evt.taskid);
  expect(materialDS.item.task_id).toEqual(evt.taskid);
});

it('validate saveToolDetail', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}}
    }
  };
  const calibStub = sinon.stub(controller, 'isCalibrationWo').returns(true);
  const validateDueDateStub = sinon.stub(controller, 'validateToolDueDate').returns(true);
  const synonymDSData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymDSData);
  let tooljsonData = {...toolJson};
  tooljsonData.plusctechnician = 'WILSON';
  const toolDS = newDatasource1(tooljsonData, "reportWorkActualToolsDetailDs");
  await toolDS.load();
  page.registerDatasource(toolDS);
  const toolListDS = newDatasource1(toolJson, "reportWorkActualToolsDs");
  await toolListDS.load();
  page.registerDatasource(toolListDS);
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  page.registerDatasource(reportworkLabords);
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(wodetails);
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  page.registerDatasource(craftrate);
  let forceReloadStub = sinon.stub(toolDS, 'forceReload');
  let forceReloadStubListDs = sinon.stub(toolListDS, 'forceReload');
  const putAction = sinon.stub(toolDS, "put");
  const toolsDrawer = new Dialog({name: "toolsDrawer"});
  page.registerDialog(toolsDrawer);
  page.showDialog = jest.fn();
  toolsDrawer.closeDialog = jest.fn();
  const taskDS = newTaskDatasource(tasklist, 'woPlanTaskDetailds');
  page.registerDatasource(taskDS);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  jest.spyOn(app, "findDatasource").mockImplementation(() => taskDS);
  controller.pageInitialized(page, app);
  await controller.saveToolDetail({page: page, app: app});
  expect(page.state.isCalledOnce).toBe(true);
  expect(page.state.loadingToolDetail).toBe(false);
  expect(putAction.called).toBe(true);
  expect(putAction.displayName).toBe('put');
  expect(forceReloadStub.called).toBe(true);
  expect(forceReloadStub.displayName).toBe('forceReload');
  expect(forceReloadStubListDs.displayName).toBe('forceReload');
  expect(validateDueDateStub.calledOnce).toBe(true);
  putAction.restore();
  forceReloadStub.restore();
  forceReloadStubListDs.restore();
  calibStub.restore();
  validateDueDateStub.restore();
});

it('Choose validateToolData', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}}
    }
  };

  const taskDS = newTaskDatasource(tasklist, 'woPlanTaskDetailds');
  page.registerDatasource(taskDS);

  const synonymDSData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymDSData);
  const toolDs = newDatasource1(toolJson, "reportWorkActualToolsDetailDs");
  page.registerDatasource(toolDs);
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  page.registerDatasource(reportworkLabords);
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(wodetails);
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  page.registerDatasource(craftrate);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  jest.spyOn(app, "findDatasource").mockImplementation(() => taskDS);
  
  await controller.validateToolData({page: page, app: app});
  expect(page.state.disableToolAction).toBe(false);
});

it('Choose validateToolData calibration', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  app.name = "technician";
  page.state = {
    isRotating: true,
    isBufferTools: true
  };
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}}
    }
  };
  const isCalibrationWoStub = sinon.stub(controller, 'isCalibrationWo').returns(true);
  const toolDs = newDatasource1(toolCalJson, "reportWorkActualToolsDetailDs");
  page.registerDatasource(toolDs);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  await controller.validateToolData({page: page, app: app});
  expect(page.state.disableToolAction).toBe(false);

  page.state.isRotating = false;
  await controller.validateToolData({page: page, app: app});
  expect(page.state.disableToolAction).toBe(false);
  const warningStub = sinon.stub(toolDs, 'hasWarnings').returns(true);
  await controller.validateToolData({page: page, app: app});
  expect(page.state.disableToolAction).toBe(true);
  isCalibrationWoStub.restore();
  warningStub.restore();
});

it('Choose validateToolData --negative case', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}}
    }
  };
  page.state = {
    isBufferTools: true
  };
  const synonymDSData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymDSData);
  const toolDs = newDatasource1(toolJson, "reportWorkActualToolsDetailDs");
  page.registerDatasource(toolDs);
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  page.registerDatasource(reportworkLabords);
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(wodetails);
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  page.registerDatasource(craftrate);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  page.state.isRotating = true;
  await controller.validateToolData({page: page, app: app});
  expect(page.state.disableToolAction).toBe(true);
});

it("open reserve material page", async () => {
	let mockSetPage = jest.fn();

	const controller = new ReportWorkPageController();
	const app = new Application();
	const page = new Page({name: "page"});

	await app.initialize();  
	app.setCurrentPage = mockSetPage;
	controller.pageInitialized(page, app);
	
	await controller.openReservedMaterials({item:{href: 'oslc/os/mxapiwodetail/_QkVERk9SRC8zMDA1OA--'}});
	await expect(mockSetPage.mock.calls.length).toEqual(1);
});

it("should complete workorder", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  const schedPage = new Page({name: "schedule"});
  const workOrderDetailsPage = new Page({name: "workOrderDetails"});

  app.registerPage(page);
  app.registerPage(schedPage);
  app.registerPage(workOrderDetailsPage);

  app.client = {
    userInfo: {
      personid: "SAM",
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    },
    checkSigOption: (option) => true,
    findSigOption: (appName, sigoption) => true,
  };

  app.registerController(controller);
  const synonymDSData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymDSData);

  workorderitem.member[0] = {...workorderitem.member[0], iscalibration : true, pluscwodscount: 2 };
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  const wolist = newDatasource(workorderitem, "member", "wonum", "todaywoassignedDS");
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const laborDetailDS = newLaborDetailDatasource();
  page.registerDatasource(laborDetailDS);
  page.registerDatasource(craftrate);

  page.registerDatasource(wodetails);
  page.registerDatasource(wolist);

  jest.spyOn(CommonUtil, 'validateDataSheet').mockImplementation(() => {
    return true
  });
  jest.spyOn(CommonUtil, 'validateActualTools').mockImplementation(() => {
    return true
  });

  let items = await wodetails.load();
  let invokeAction = sinon.stub(wodetails, "invokeAction").returns(items[0]);
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  app.state = {
    systemProp: {
      'maximo.mobile.statusforphysicalsignature': 'APPR,WAPPR',
      'maximo.mobile.wostatusforesig': 'APPR,INPROG'
    }
  };
  controller.pageInitialized(page, app);
  const activeLabTrans = await WOUtil.getActiveLabTrans(app, laborDetailDS);
  expect(activeLabTrans).toBeTruthy();
  expect(activeLabTrans.length).toBe(0);

  let evt = {
    item: wodetails.item,
    datasource: wodetails,
    status:'APPR'
  }
  app.state.woStatSigOptions= JSON.stringify({
    CLOSE: "CLOSE",
    CANCEL: "CAN"
  });
  app.state.woOSName= "MXAPIWODETAIL";
  await controller.completeWorkorder(evt);

  expect(invokeAction.called).toBe(false);
  expect(invokeAction.displayName).toBe("invokeAction");
  expect(invokeAction.args.length).toBe(0);

  const openSigStub = sinon.stub(controller, 'openSignatureDialog');
  app.state = {
    ...app.state,
    skipScan: true,
    skipSignature: false
  }
  page.state = {
    enableSignatureButton: true
  }
  app.state.woStatSigOptions= JSON.stringify({
    CLOSE: "CLOSE",
    CANCEL: "CAN"
  });
  app.state.woOSName= "MXAPIWODETAIL";
  await controller.completeWorkorder(evt);

  expect(openSigStub.called).toBe(false);
});

it("should complete workorder in anywhere mode", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "page"});
  const schedPage = new Page({name: "schedule"});

  let anyWhereDefault = Device.get().isMaximoMobile;

  Device.get().isMaximoMobile = true;

  app.registerPage(page);
  app.registerPage(schedPage);

  app.client = {
    userInfo: {
      personid: "SAM",
    },
    checkSigOption: (option) => true,
    findSigOption: (appName, sigoption) => true,
  };

  app.registerController(controller);
  const synonymDSData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymDSData);
  workorderitem.member[0] = {...workorderitem.member[0], iscalibration : true, pluscwodscount: 2 };
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  const wolist = newDatasource(workorderitem, "member", "wonum", "todaywoassignedDS");

  const reportworksSynonymData = newStatusDatasource(statusitem, "reportworksSynonymData");
  page.registerDatasource(reportworksSynonymData);

  page.registerDatasource(wodetails);
  page.registerDatasource(wolist);
  app.state = {
    systemProp: {
      'maximo.mobile.statusforphysicalsignature': 'APPR,WAPPR',
      'maximo.mobile.wostatusforesig': 'APPR,INPROG'
    },
    disableScan : false
  };
  let items = await wodetails.load();
  let invokeAction = sinon.stub(wodetails, "invokeAction").returns(items[0]);
  page.state = {
    enforceAssetScan : 0
  }

  jest.spyOn(CommonUtil, 'validateDataSheet').mockImplementation(() => {
    return true
  });
  jest.spyOn(CommonUtil, 'validateActualTools').mockImplementation(() => {
    return true
  });
  
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  wodetails.item.assetnumber = "123";
  let evt = {
    item: wodetails.item,
    datasource: wodetails,
    status: 'COMP'
  }
  app.state.woStatSigOptions= JSON.stringify({
    CLOSE: "CLOSE",
    CANCEL: "CAN"
  });
  app.state.woOSName= "MXAPIWODETAIL";
  await controller.completeWorkorder(evt);
  expect(invokeAction.called).toBe(true);
  expect(invokeAction.displayName).toBe("invokeAction");
  expect(invokeAction.args.length).toBe(1);
  
  Device.get().isMaximoMobile = anyWhereDefault;

  Device.get().isMaximoMobile = false;

  page.state = {
    enforceAssetScan : 1
  }
  
  jest.spyOn(CommonUtil, 'checkScanRequired').mockImplementation(() => {
    return true
  });
  app.state.woStatSigOptions= JSON.stringify({
    CLOSE: "CLOSE",
    CANCEL: "CAN"
  });
  app.state.woOSName= "MXAPIWODETAIL";
  await controller.completeWorkorder(evt);
  expect(app.state.scanParameter?.scanResParam.scanValue).toBe(null);

  app.state.disableScan = true;
  app.state.woStatSigOptions= JSON.stringify({
    CLOSE: "CLOSE",
    CANCEL: "CAN"
  });
  app.state.woOSName= "MXAPIWODETAIL";
  await controller.completeWorkorder(evt);
  expect(app.state.disableScan).toBe(false);
});

it("should test onCloseDrawer", async () => {

	const controller = new ReportWorkPageController();
	const app = new Application();
	const page = new Page({name: "page"});
  page.state = {
    errorMessage: true
  }
  app.client = {
		userInfo: {
			personid: 'SAM',
      insertSite: 'BEDFORD',
			labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
		},
	};
  const taskDS = newTaskDatasource(tasklist, 'woPlanTaskDetailds');
  const labordetails = newDatasource(labor, "labordetails", "labtransid", "reportworkLaborDetailds");
  const materialDS = newDatasource(workorderitem, 'member', 'assetnum', 'reportWorkActualMaterialDs');
  const reportDetails = newDatasource(labor, "reportworkLaborDetailds");
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const laborDs = newDatasource(labor, "labordata", "laborid", "laborDs");
  page.registerDatasource(reportDetails);
  page.registerDatasource(taskDS);
  page.registerDatasource(labordetails);
  page.registerDatasource(craftrate)
  app.registerDatasource(laborDs);
  app.registerController(controller);
  app.registerPage(page);
	await app.initialize();  
  sinon.stub(materialDS, 'forceReload');
  jest.spyOn(app, "findDatasource").mockImplementation(() => taskDS);
	controller.pageInitialized(page, app);
	
  let evt = {
    page: page,
    ds: materialDS,
  }
	await controller.onCloseDrawer(evt);
  expect(app.state.pageLoading).toBe(false);
  expect(page.state.useConfirmDialog).toBe(true);

  page.state = {
    useConfirmDialog : false
  }
  await controller.onCloseDrawer({ds:materialDS});
 // expect(labordetails.items.length).toBe(1);
});

it("should open saveDiscardLaborsDialog onCloseDrawer", async () => {

  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({ name: "page" });
  page.state = {
    useConfirmDialog: true,
    callMethodAction: 'LABOR'
  }
  app.findDialog = jest.fn().mockReturnValue({
    closeDialog: jest.fn()
  });
  const taskDS = newTaskDatasource(tasklist, 'woPlanTaskDetailds');
  const laborDs = newDatasource(labor, "labordata", "laborid", "laborDs");
  const materialDS = newDatasource(workorderitem, 'member', 'assetnum', 'reportWorkActualMaterialDs');
  app.registerDatasource(laborDs);
  app.registerDatasource(taskDS);
  await app.initialize();
  jest.spyOn(app, "findDatasource").mockImplementation(() => taskDS);
  sinon.stub(materialDS, 'forceReload');
  controller.pageInitialized(page, app);
  laborDs.clearSelections = jest.fn();

  let evt = {
    page: page,
    ds: materialDS,
  }
  await controller.onCloseDrawer(evt);
  expect(page.state.hideDeleteTimer).toBe(false);
  expect(app.findDialog('saveDiscardLaborsDialog')).toBeDefined();
  expect(page.state.useConfirmDialog).toBe(false);
});


it("Should call reload labor", async() => {
	const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
		userInfo: {
			personid: 'SAM',
      insertSite: 'BEDFORD',
			labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
		},
	};

  const taskDS = newTaskDatasource(tasklist, 'woPlanTaskDetailds');
  app.registerDatasource(taskDS);
  
  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const woDetailResource = newDatasource(workorderitem, "member", "wonum", "woDetailResource");
  const labordetails = newDatasource(labor, "labordetails", "labtransid", "reportworkLaborDetailds");
  const wolistds = newDatasource(workorderitem, "todaywoassignedDS");
  page.registerDatasource(wolistds);
  page.registerDatasource(reportworkLabords);
  app.registerDatasource(woDetailResource);
  app.registerController(controller);
  app.registerPage(page);
  controller.pageInitialized(page, app);
  
	await app.initialize();
  const evt = {
    app: app,
    page: page
  }

  await controller.reloadLabor(evt, reportworkLabords, wolistds, woDetailResource, labordetails);
  expect(page.state.loadinglabor).toBe(false);
});

it("Should Call validateDate and validateToolDueDate", async() => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
		userInfo: {
			personid: 'SAM',
      insertSite: 'BEDFORD',
			labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
		},
	};
  const maxvarStub = sinon.stub(CommonUtil, 'filterMobileMaxvars').returns('1');
  const workorderitemData = {...workorderitem};
  workorderitemData.member[0] = {...workorderitem.member[0], iscalibration: true, pluscwodscount: 2, pluscduedate_np: new Date() }
  const wodetails = newDatasource(workorderitemData, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(wodetails);

  app.registerController(controller);
  app.registerPage(page);
  controller.pageInitialized(page, app);
	await app.initialize();
  const result = await controller.validateDate("2024-04-10T19:00:18+05:30", "2024-04-11T19:00:18+05:30");
  expect(result).toBe(false);
  
  const assetdata = {
    assetnum: 'AR1',
    pluscduedate_np: '2024-04-10T19:00:18+05:30',
    useDate: '2024-04-09T19:00:18+05:30'
  }
  const validateDateStub = sinon.stub(controller, "validateDate").returns(true);
  await validateDateStub();
  const result1 = await controller.validateToolDueDate(assetdata.pluscduedate_np, assetdata.useDate);
  expect(result1).toBe(true);
  maxvarStub.restore();
});

it("Should call validateQualification", async() => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: 'report_work'});
  app.client = {
		userInfo: {
			personid: 'SAM',
      insertSite: 'BEDFORD',
			labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
		},
	};
  app.registerController(controller);
  app.registerPage(page);
  controller.pageInitialized(page, app);
	await app.initialize();

  let laborQual = [{ qualificationid: 'A'}];
  let toolQual = [{ qualificationid: 'A'}];
  let result = await controller.validateQualification(laborQual, toolQual);
  expect(result).toBe(true);

  laborQual = [{ qualificationid: 'A'}];
  toolQual = [{ qualificationid: 'A'}, { qualificationid: 'B'}];
  result = await controller.validateQualification(laborQual, toolQual);
  expect(result).toBe(false);
});

it('Should call openTechnicianLookup', async() => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    },
  };
  app.registerPage(page);

  page.state = {laborCode: 'ADAMS', laborCodeDesc: 'Hank Adams'};
  app.registerController(controller);


  const laborDs = newDatasource(labor, "labordata", "laborid", "laborDs");
  let laborDstub = sinon.stub(laborDs, 'searchQBE');
  page.registerDatasource(laborDs);

  const reportworkLabords = newDatasource(labor, "reportworkLabords", "labtransid", "reportworkLabords");
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(reportworkLabords);
  page.registerDatasource(wodetails);
  await app.initialize();
  controller.pageInitialized(page, app);

  let evt = {
    orgid: 'EAGLENA',
    page: page
  }
  await controller.openTechnicianLookup(evt);
  expect(laborDstub.called).toBe(true);
});

it("should call chooseTechnician", async() => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  sinon.stub(controller, 'validateQualification').returns(true);
  app.client = {
    userInfo: {
      personid: 'SAM',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
    }
  };
  app['name'] = "techmobile";
  app.registerPage(page);
  app.registerController(controller);
  let workorderitemData = {...workorderitem};
  workorderitemData.member[0].iscalibration = true;
  workorderitemData.member[0].pluscwodscount = 2;
  workorderitemData.member[0].pluscqualtech = '2';
  page.state.skipQualification = false;
  const wodetails = newDatasource(workorderitemData, 'member', 'wonum', "woDetailsReportWork");
  await wodetails.load();
  const woReportWorkDs = newDatasource(workorderitemData, 'member', 'wonum', 'reportWorkActualToolsDetailDs');
  page.registerDatasource(wodetails);
  page.registerDatasource(woReportWorkDs);
  await app.initialize();
  controller.pageInitialized(page, app);
  let evt = {
    laborcode: 'ELI',
    displayname: 'Eli Richards'
  }
  page.state.selectedTool = {toolqual:[{ qualificationid: 'A'}]};
  await controller.chooseTechnician(evt);
  expect(page.state.laborCode).toBe('ELI');

  await controller.saveTechnician();
  expect(page.state.skipQualification).toBe(false);
});


it('pagePaused initializes page state', async () => {

  const controller = new ReportWorkPageController();
	const app = new Application();
	const page = new Page({name: "report_work"});

  app.registerController(controller);
  app.registerPage(page);

  await controller.pagePaused(page);

  expect(page.state.causeValue).toBe('');
  expect(page.state.remedyValue).toBe('');
  expect(page.state.problemValue).toBe('');
  expect(page.state.failureClassValue).toBe('');
});

it("Should call chooseToolRotatingAsset()", async() => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  app['name'] = "technician";
  const validateToolDateStub = sinon.stub(controller, 'validateToolDueDate').returns(true);
  const page = new Page({name: "report_work"});
  sinon.stub(page, 'findDialog');
  const woReportWorkDs = newDatasource(workorderitem, 'member', 'wonum', 'reportWorkActualToolsDetailDs');
  app.registerController(controller);
  app.registerPage(page);
  page.registerDatasource(woReportWorkDs);
  await controller.pageInitialized(page, app);
  const evt = {
    assetnum: 'AST01',
    description: "Asset Desc"
  }
  await controller.chooseToolRotatingAsset(evt);
  expect(woReportWorkDs.item.assetnum).toBe('AST01');
  validateToolDateStub.restore();
});

it("Should call openCalRotatingAssetLookup()", async() => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  page.show = jest.fn();
  const rotatingAssetDS = newDatasource(woassetmeters, 'member', 'assetnum', 'rotatingAssetDS');
  page.registerDatasource(rotatingAssetDS);
  app.registerController(controller);
  app.registerPage(page);
  controller.pageInitialized(page, app);
  await controller.openCalRotatingAssetLookup({orgid: 'EAGLENA', page: page});
  expect(rotatingAssetDS.items.length).toBeGreaterThan(0);
});

it("Should call chooseManufacturer()", async() => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  page.showDialog = jest.fn();
  const manufacturerDs = newDatasource(manufacturer, "member", "wonum", "dsManufacturer");
  const woReportWorkDs = newDatasource(workorderitem, 'member', 'wonum', 'reportWorkActualToolsDetailDs');
  page.registerDatasource(woReportWorkDs);
  page.registerDatasource(manufacturerDs);
  app.registerController(controller);
  app.registerPage(page);
  controller.pageInitialized(page, app);
  controller.openManufacturerLookup({page: page});
  await controller.chooseManufacturer({company: "ABC"})
  expect(woReportWorkDs.item['pluscmanufacturer']).toEqual('ABC');
});

it("Should call onDeleteEntry", async() => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  app.registerController(controller);
  app.registerPage(page);
  controller.pageInitialized(page, app);
  const deleteEntryStub = sinon.stub(WOTimerUtil, 'deleteTimerEntry');
  controller.onDeleteEntry()
  expect(deleteEntryStub.called).toBe(true);
});

it('should call resetToolLookup()', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work",});
  page.state = {
    selectedTool: { itemnum: 'LATHE' }
  }
  app.client = {
    userInfo: {
      personid: 'SAM',
      defaultSite: 'BEDFORD',
      labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}}
    }
  };
  app.callController = jest.fn();
  const woReportWorkDs = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDetailDs');
  page.registerDatasource(woReportWorkDs);
  const toolDS = newDatasource(toolDetail, 'member', 'itemnum', 'toolDS');
  page.registerDatasource(toolDS);
  const reportDetails = newDatasource(labor, "reportworkLaborDetailds");
  page.registerDatasource(reportDetails);
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  page.registerDatasource(craftrate);
  const woDetailds = newWoDatasource(workorderitem, "woDetailds");
  app.registerDatasource(woDetailds);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  woReportWorkDs.item.assetnum = 'AST01';
  await controller.resetToolLookup();
  expect(toolDS.items.length).toBe(1);

  page.state = {
    selectedTool: false
  };
  await controller.resetToolLookup();
  expect(toolDS.items.length).toBe(toolDetail.member.length);
});

it('should call openCalRotatingAssetLookup()', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  const resetRotatingLookupStub = sinon.stub(controller, 'resetRotatingAssetLookup');
  jest.spyOn(page, 'showDialog').mockImplementation(() => {});
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  await controller.openCalRotatingAssetLookup({page: page});
  expect(resetRotatingLookupStub.calledOnce).toBe(true);
  resetRotatingLookupStub.restore();
});


it('should call selectCalRotatingAsset()', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  const chooseCalToolStub = sinon.stub(controller, 'chooseCalTool');
  const validateRotateStub = sinon.stub(controller, 'validateRotatingAsset');
  const woReportWorkDs = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDetailDs');
  page.registerDatasource(woReportWorkDs); 
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  const evt = { page: page, assetnum: 'AST01', description: 'ASTDESC', iscalibration: true, pluscduedate_np: new Date(), caltooltrans: [{rotassetnum: 'ASTDESC'}] }
  await controller.selectCalRotatingAsset(evt);
  expect(page.state.rotatingAsset).toBe(true);
  expect(page.state.useConfirmDialog).toBe(true);
  expect(chooseCalToolStub.calledOnce).toBe(true);
  chooseCalToolStub.restore();
  validateRotateStub.restore();
});

it('Should call chooseCalTool()', async() => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  app.client = {
		userInfo: {
			personid: 'SAM',
      insertSite: 'BEDFORD',
			labor: {laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}, laborcode: 'SAM'}
		},
	};
  const page = new Page({name: "report_work"});
  const woReportWorkDs = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDetailDs');
  const toolds = newDatasource(toolDetail, 'member', 'itemnum', 'toolDS');
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  page.registerDatasource(woReportWorkDs);
  page.registerDatasource(toolds);
  page.registerDatasource(wodetails);
  page.registerDatasource(craftrate);
  app.registerController(controller);
  const woDetailds = newWoDatasource(workorderitem, "woDetailds");
  app.registerDatasource(woDetailds);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  await controller.chooseCalTool({itemnum: 'PURGE'});
  expect(page.state.isRotating).toBe(true);
  expect(toolds.items.length).toBe(1);

  await controller.chooseCalTool({itemnum: "LATHE"});
  expect(page.state.isRotating).toBe(false);
  expect(toolds.items.length).toBe(1);

  await controller.chooseCalTool({itemnum: "NAN"});
  expect(toolds.items.length).toBe(0);
});

it('Should call chooseCalAsset()', async() => {
  let findDialog = jest.fn();
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  page.findDialog = findDialog;
  const woReportWorkDs = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDetailDs');
  const rotatingAssetDS = newDatasource(woassetmeters, 'member', 'assetnum', 'rotatingAssetDS');
  page.registerDatasource(woReportWorkDs);
  page.registerDatasource(rotatingAssetDS);
  const reportDetails = newDatasource(labor, "reportworkLaborDetailds");
  page.registerDatasource(reportDetails);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  await controller.chooseCalAsset({itemnum: 'PURGE'});
  expect(rotatingAssetDS.items.length).toBe(1);

  await controller.chooseCalAsset({itemnum: "LATHE"});
  expect(rotatingAssetDS.items.length).toBe(0);

  controller.closeCalRotAssetError();
  await controller.chooseCalAsset({});
  expect(page.state.hideAssetLookup).toBeTruthy();
});

it('Should call resetRotatingAssetField()', async() => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  const validateToolDataStub = sinon.stub(controller, 'validateToolData');
  const woReportWorkDs = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDetailDs');
  page.registerDatasource(woReportWorkDs);
  app.registerController(controller);
  app.registerPage(page);
  const woDetailds = newWoDatasource(workorderitem, "woDetailds");
  app.registerDatasource(woDetailds);
  await app.initialize();
  await controller.resetRotatingAssetField();
  expect(woReportWorkDs.item.assetnum).toBe('');
  expect(woReportWorkDs.item.asset_description).toBe('');
  expect(page.state.assetCalDueDate).toBe(null);
  expect(validateToolDataStub.calledOnce).toBe(true);
  validateToolDataStub.restore();
});

it('Should call resetToolField()', async() => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  const validateToolDataStub = sinon.stub(controller, 'validateToolData');
  const clearWarningStub = sinon.stub(controller, 'clearCalToolWarning');
  const woReportWorkDs = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDetailDs');
  page.registerDatasource(woReportWorkDs);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  await controller.resetToolField();
  expect(woReportWorkDs.item.item_itemnum).toBe('');
  expect(woReportWorkDs.item.item_description).toBe('');
  expect(page.state.itemnum).toBe(false);
  expect(page.state.isBufferTools).toBe(false);
  expect(validateToolDataStub.calledOnce).toBe(true);
  expect(clearWarningStub.called).toBe(true);
  validateToolDataStub.restore();
  clearWarningStub.restore();
});

it('should call resetRotatingAssetLookup()', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({name: "report_work"});
  page.state = {
    itemnum: "PURGE"
  }
  const woReportWorkDs = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDetailDs');
  const wodetails = newDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  const woDetailds = newWoDatasource(workorderitem, "woDetailds");
  page.registerDatasource(woReportWorkDs);
  page.registerDatasource(wodetails);
  app.registerDatasource(woDetailds);
  let rotatingAssetDS = newDatasource(woassetmeters, 'member', 'assetnum', 'rotatingAssetDS');
  page.registerDatasource(rotatingAssetDS);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();

  await controller.resetRotatingAssetLookup();
  expect(rotatingAssetDS.items.length).toBe(1);
});

it("Should call showRemoveToolWarning()", () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = {
    showDialog: jest.fn(),
  };
  app.registerController(controller);
  app.registerPage(page);
  controller.pageInitialized(page, app);
  controller.showRemoveToolWarning();
  expect(page.showDialog).toHaveBeenCalledWith('removeToolWarning');
});

it('Should call onCloseToolsDetailsDrawer()', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = {
    findDialog: jest.fn().mockReturnValue({
      closeDialog: jest.fn(),
    })
  };
  const reportWorkActualToolsDs = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDs');
  app.registerDatasource(reportWorkActualToolsDs);
  app.registerController(controller);
  app.registerPage(page);
  controller.pageInitialized(page, app);

  jest.spyOn(app, "findDatasource").mockImplementation(() => reportWorkActualToolsDs);

  await controller.onCloseToolsDetailsDrawer();
  expect(page.findDialog().closeDialog).toHaveBeenCalled();
});

it('Should call openToolsDetailsDrawer()', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = new Page({ name: "report_work" });
  const event = { tooltransid: 77 };
  const reportWorkActualToolsDs = newDatasource(toolDetail, 'member', 'itemnum', 'reportWorkActualToolsDs');
  app.registerDatasource(reportWorkActualToolsDs);
  const rotatingAssetDS = newDatasource(woassetmeters, 'member', 'assetnum', 'rotatingAssetDS');
  page.registerDatasource(rotatingAssetDS);
  app.registerController(controller);
  app.registerPage(page);
  controller.pageInitialized(page, app);

  page.showDialog = jest.fn();
  page.findDatasource = jest.fn(() => ({
    initializeQbe: jest.fn(),
    setQBE: jest.fn(),
    searchQBE: jest.fn()
  }));   
  jest.spyOn(app, "findDatasource").mockImplementation(() => rotatingAssetDS);
  await controller.openToolsDetailsDrawer(event);
  expect(page.showDialog).toHaveBeenCalledWith('toolsDetailsDrawer');
});

it('Should call removeTool()', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  const page = {
    findDialog: jest.fn().mockReturnValue({
      closeDialog: jest.fn(),
    }),
    findDatasource: jest.fn(() => ({
      initializeQbe: jest.fn(),
      setQBE: jest.fn(),
      searchQBE: jest.fn(),
      clearQBE: jest.fn()
    })),
    state: { loading: true }
  };
  const reportWorkActualToolsDs = newDatasource1(toolJson, "reportWorkActualToolsDs");
  await reportWorkActualToolsDs.load();
  app.registerDatasource(reportWorkActualToolsDs);
  app.registerController(controller);
  app.registerPage(page);
  controller.pageInitialized(page, app);
  app.toast = jest.fn();
  jest.spyOn(page, "findDatasource").mockImplementation(() => reportWorkActualToolsDs);
  const deleteItem = sinon.stub(reportWorkActualToolsDs, "deleteItem");
  await controller.removeTool();
  expect(page.state.loading).toBe(false);
  expect(deleteItem.called).toBe(true);
});

it('Should call isCalibrationWo()', async () => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  app.name = "techmobile";
  const page = new Page({ name: "report_work" });
  const workorderitemData = {...workorderitem};
  workorderitemData.member[0].iscalibration = true;
  workorderitemData.member[0].pluscwodscount = 2;
  const woReportWorkDs = newDatasource(workorderitemData, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(woReportWorkDs);
  app.registerController(controller);
  app.registerPage(page);
  controller.pageInitialized(page, app);
  await woReportWorkDs.load();
  let result = await controller.isCalibrationWo();
  expect(result).toBe(true);
  app.name = "supmobile";
  result = await controller.isCalibrationWo();
  expect(result).toBe(false);
});

it('Should call validateRotatingAsset()', async() => {
  const controller = new ReportWorkPageController();
  const app = new Application();
  app.name = "techmobile";
  const page = new Page({ name: "report_work" });
  const maxvarStub = sinon.stub(CommonUtil, 'filterMobileMaxvars').returns('1');
  const workorderitemData = {...workorderitem};
  workorderitemData.member[0].iscalibration = true;
  workorderitemData.member[0].pluscwodscount = 2;
  workorderitemData.member[0].assetnumber = "1007";
  const actualWorkDs = newDatasource(workorderitem, 'member', 'wonum', 'reportWorkActualToolsDetailDs');
  const woReportWorkDs = newDatasource(workorderitemData, "member", "wonum", "woDetailsReportWork");
  page.registerDatasource(woReportWorkDs);
  page.registerDatasource(actualWorkDs);
  app.registerController(controller);
  app.registerPage(page);
  controller.pageInitialized(page, app);
  await woReportWorkDs.load();
  await controller.validateRotatingAsset({caltooltrans: [{rotassetnum: 'CASSET1'}]});
  expect(page.findDialog('calRotatingAssetWarning')).toBeNull();
  await controller.validateRotatingAsset({caltooltrans: [{rotassetnum: '1007'}]});
  expect(page.findDialog('calRotatingAssetWarning')).toBeDefined();
  expect(page.state.calDialogMessage).not.toBeNull();
  maxvarStub.restore();
});

// Assisted by watsonx Code Assistant 
it('should identify the correct assignment and call CommonUtil.completeAssigned', async () => {
  const app = new Application();
  // Mock the necessary dependencies
  app.findDatasource = () => ({
    item: {
      assignment: [
        { laborcode: 'testLaborCode' }
      ]
    }
  });
  app.client = { userInfo: { labor: { laborcode: 'testLaborCode' } } };
  app.getLocalizedLabel = (key, defaultValue) => defaultValue.toUpperCase();
  const page = new Page({ name: "report_work" });
  page.state = { loadingcomp: null };
  app.toast = (message, type) => {
    expect(message).toContain('Assignment');
    expect(type).toBe('success');
  };
  app.setCurrentPage = (page) => {
    expect(page).toBe('schedule');
  };
  app.findPage = (pageName) => ({ state: { selectedDS: 'testDS' } });
  app.findDatasource = (dsName) => ({ 
    item: {
      assignment: [
        { laborcode: 'testLaborCode' }
      ]
    },
    forceReload: () => {}
  });

  const controller = new ReportWorkPageController();
  controller.pageInitialized(page, app);
  // Mock CommonUtil.completeAssigned
  const completeAssignedSpy = jest.spyOn(CommonUtil, 'completeAssigned').mockResolvedValue();
  Device.get().isMaximoMobile = true;

  // Call the method
  await controller.completeAssignment();

  // Assert the result
  expect(completeAssignedSpy).toHaveBeenCalled();
});

describe('showCompAssignment', () => {

  it('should hide comp assignment when status_maxvalue is COMP', async () => {
    const app = new Application();
    const hiddenTypeMaxValue = true;
    app.findDatasource = jest.fn().mockReturnValue({
      item: {
        assignment: [
          { laborcode: 'testLaborCode', status: 'ASSIGNED' },
          { laborcode: 'otherLaborCode', status: 'PENDING' },
        ],
        status_maxvalue: 'COMP',
      },
      load: jest.fn()
    });
    app.getLocalizedLabel = jest.fn().mockReturnValue('ACCEPTED');
    app.client = {
      userInfo: {
        labor: {
          laborcode: 'testLaborCode',
        },
      },
    }
    const controller = new ReportWorkPageController();
    const page = new Page({ name: "report_work" });
    controller.pageInitialized(page, app);
    // Call the method
    await controller.showCompAssignment();
    expect(hiddenTypeMaxValue).toBe(true);
  });

  it('should show comp assignment when laborcode and status match and status_maxvalue is not COMP', async () => {
    const app = new Application();
    app.findDatasource = jest.fn().mockReturnValue({
      item: {
        assignment: [
          { laborcode: 'testLaborCodeNo', status: 'ASSIGNED' },
          { laborcode: 'otherLaborCode', status: 'PENDING' },
        ],
        status_maxvalue: 'INPRG',
      },
      load: jest.fn()
    });
    app.getLocalizedLabel = jest.fn().mockReturnValue('ACCEPTED');
    app.client = {
      userInfo: {
        labor: {
          laborcode: 'testLaborCode',
        },
      },
    }
    const hiddenTypeMaxValue = false;

    const controller = new ReportWorkPageController();
    const page = new Page({ name: "report_work" });
    page.state.hideCompAssignment = true;
    controller.pageInitialized(page, app);
    await controller.showCompAssignment();
    expect(hiddenTypeMaxValue).toBe(false);
  });

});

describe('reportTimeDrawerValidate', () => {
  const app = new Application();
  const controller = new ReportWorkPageController();
  const page = new Page({ name: "report_work" });
  controller.pageInitialized(page, app);

  it('should not fail validation when conditions are not met', () => {
    page.state.useConfirmDialog = false;
    page.state.callMethodAction = 'LABOR';
    let validateEvent = {};
    controller.reportTimeDrawerValidate(validateEvent);
    expect(validateEvent.failed).toBe(false);

    page.state.useConfirmDialog = true;
    page.state.callMethodAction = 'LABOR';
    controller.reportTimeDrawerValidate(validateEvent);
    expect(validateEvent.failed).toBe(true);

    page.state.useConfirmDialog = true;
    page.state.callMethodAction = 'OTHER';
    controller.reportTimeDrawerValidate(validateEvent);
    expect(validateEvent.failed).toBe(false);
  });
});

describe('closeToolsTransaction', () => {
  const app = new Application({
    findDatasource: jest.fn().mockReturnValue({
      clearSelections: jest.fn()
    })
  });
  const controller = new ReportWorkPageController();
  const page = new Page({
    name: "report_work",
    state: {
      isAddAction: true,
      multipleLabors: true,
      hideDeleteTimer: true
    }
  });
  const reportTimeDrawer = new Dialog({
    name: 'reportTimeDrawer'
  });
  const saveDiscardLaborsDialog = new Dialog({
    name: 'saveDiscardLaborsDialog'
  });
  page.showDialog = jest.fn();
  controller.pageInitialized(page, app);
  reportTimeDrawer.closeDialog = jest.fn();
  page.registerDialog(reportTimeDrawer);
  saveDiscardLaborsDialog.closeDialog = jest.fn();
  page.registerDialog(saveDiscardLaborsDialog);
  test('should reset states and close dialogs', () => {
    controller.closeToolsTransaction();
    controller.resetTaskDS = jest.fn();
    expect(page.state.isAddAction).toBe(false);
    expect(page.state.multipleLabors).toBe(false);
    expect(page.state.hideDeleteTimer).toBe(false);
  });
});
