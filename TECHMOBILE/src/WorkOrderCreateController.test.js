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

import WorkOrderCreateController from "./WorkOrderCreateController";
import WOCreateEditUtils from "./utils/WOCreateEditUtils";
import {Application, Page, JSONDataAdapter, Datasource, Device} from "@maximo/maximo-js-api";
import worktype from "./test/worktype-json-data";
import workorderitem from './test/wo-detail-json-data.js';
import statusitem from './test/statuses-json-data.js';
import woclassitem from './test/woclass-json-data.js';
import wpmaterial from "./test/materials-json-data";
import SynonymUtil from "./utils/SynonymUtil";
import CommonUtil from './utils/CommonUtil';
import assetFeatureData from "./test/assetfeature-json-data.js"
// import assetLookupData from './test/asset-lookup-json-data.js';
import sinon from 'sinon';
import specificationData from "./test/specification-json-data.js";
import assetAttributedata from "./test/assetAttribute-json-data.js";
import classificationData from "./test/classificationdata.js";
import { expect } from "@storybook/test";

function newDatasource(data, name = "dsCreateWo") {
  const da = new JSONDataAdapter({
    src: data,
    items: "member",
  });

  const ds = new Datasource(da, {
    idAttribute: "wonum",
    name: name,
  });

  return ds;
}

function newStatusDatasource(data = statusitem, name = 'synonymdomainData') {
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

function newWorktypeDatasource(data = woclassitem, name = 'synonymdomainData') {
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

let setData = {
	member: [
		{
			_rowstamp: "239020",
			itemsetid: "SET1",
			href: "oslc/os/mxapiorganization/_RUFHTEVOQQ--",
			orgid: "EAGLENA",
      mobilemaxvars: [
        {
          maxvarsid: 2255,
          orgid: "EAGLENA",
          varname: "COORDINATE",
          vartype: "ORG",
          varvalue: "LATLONG",
        },
        {
          maxvarsid: 541,
          orgid: "EAGLENA",
          varname: "CLOSENORECEIVEDPO",
          vartype: "ORG",
          varvalue: "0",
        }
      ]
		}
	]
};

it("should open create Workorder page", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo", params: {quickReport: true} });
  app.client = {
    userInfo: {
      defaultSite: 'BEDFORD',
      labor: {
          laborcode: 'wilson'
      }
    }
  }
  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainData);
  const alnDomainDS = newStatusDatasource(statusitem, 'alnDomainDS');
  app.registerDatasource(alnDomainDS);

  app.registerController(controller);
  app.registerPage(page);

  const EmptyWorkOrder = "";
  const workorder = {
    wonum: "1001",
    description: "Work Order desc",
    description_longdescription: "Work Order long desc",
    wopriority: 2,
    worktype: "CAL",
    orgid: "EAGLENA",
    location : {
      location : 'SHIPPING',
      description: 'Shipping and Receiving Department'
    },
    schedfinish: "2024-09-26T05:18:00+05:30",
    schedstart: "2024-09-20T02:49:00+05:30",
    targcompdate: "2024-09-01T05:18:00+05:30",
    targstartdate: "2024-09-30T02:49:00+05:30"
  };

  const ds = newDatasource({ member: workorder }, "dsCreateWo");
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");
  app.registerDatasource(assetLookupDS);
  app.registerDatasource(locationLookupDS);
  page.registerDatasource(ds);

  //Device.get().isMaximoMobile = true;

  let addNewstub = sinon.stub(ds, 'addNew');
  app.lastPage = { name: "createwo" };
  await app.initialize();
  controller.pageInitialized(page, app);

  page.params.quickReport = true;
  await controller.openNewWorkOrder(EmptyWorkOrder);
  
  expect(addNewstub.called).toBe(true);
	expect(addNewstub.displayName).toBe('addNew');
  app.state.incomingContext = { page:'createwo',assetnum : '123232', site: 'testsite'};
  await controller.openNewWorkOrder(EmptyWorkOrder);
  expect(app.state.incomingContext).toBe(null);
	addNewstub.restore();
  
});

it("should open worktype dialog", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page();
  app.client = {
		userInfo: {
		}
  }
  
  const synonymdomainData = newWorktypeDatasource(woclassitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainData);
  app.registerController(controller);
  app.registerPage(page);
  const dsworktype = newDatasource(worktype, "dsworktype");
  page.registerDatasource(dsworktype);
  await app.initialize();

  const event_without_org = {
    item: {
      description: "HVAC overheating",
      status: "WMATL",
      status_description: "Waiting on material",
      status_maxvalue: "WMATL",
      statusdate: "2021-03-09T16:08:51+05:30",
      wonum: "1228",
      worktype: "CM",
    },
  };
  
  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  await controller.openWorkTypeLookup(event_without_org);
  await expect(page.state.dialogOpened).toBeFalsy();

  const event = {
    item: {
      description: "HVAC overheating",
      status: "WMATL",
      status_description: "Waiting on material",
      status_maxvalue: "WMATL",
      statusdate: "2021-03-09T16:08:51+05:30",
      wonum: "1228",
      worktype: "CM",
      orgid: "EAGLENA",
      schedfinish: "2024-09-26T05:18:00+05:30",
      schedstart: "2024-09-20T02:49:00+05:30",
      targcompdate: "2024-09-01T05:18:00+05:30",
      targstartdate: "2024-09-30T02:49:00+05:30"
    },
  };

  app.client = {
		userInfo: {
			personid: 'SAM',
			insertSite: 'BADFORD',
      insertOrg: 'EAGLENA',
		}
  }

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  await controller.openWorkTypeLookup(event);
  await expect(page.state.dialogOpened).toBeTruthy();
});

it('Save Work Order', async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: 'createwo' });
  const dsData = { ...workorderitem };
  dsData.member[0].classstructureid = "100";
  dsData.member[0].hierarchypath = "PIPE_LEAK";
  const ds2 = newDatasource(dsData, 'dsCreateWo');
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  const specificationDS = newDatasource(specificationData, "createEditWoSpecificationDS");
  const classificationSpy = sinon.spy(controller, 'chooseClassification');
  const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");
  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  const assetAttributeDS = newDatasource(assetAttributedata, "assetAttributeDS");
  app.registerDatasource(synonymdomainData);
  const alnDomainDS = newStatusDatasource(statusitem, 'alnDomainDS');
  app.registerDatasource(alnDomainDS);
  app.registerDatasource(assetAttributeDS);
  app.registerDatasource(specificationDS);
  app.registerDatasource(ds2);
  app.registerDatasource(assetLookupDS);
  app.registerDatasource(locationLookupDS);
  page.registerDatasource(ds2);
  app.registerController(controller);
  app.registerPage(page);
  Device.get().isMaximoMobile = true;
  let workorder = {
    item: {
      wonum: "1001",
      description: "Work Order desc",
      description_longdescription: "Work Order long desc",
      wopriority: 2,
      worktype: "CAL",
      orgid: "EAGLENA",
      assetnum: '12300',
      assetdesc: 'Electric cart',
      location: { location: 'SHIPPING', description: 'Shipping and Receiving Department' },
      woserviceaddress: [{}],
      hierarchypath: 'PIPE_LEAK',
      classstructureid: '100'
    }
  };

  let savestub = sinon.stub(ds2, 'save').callsFake(async () => {
    await new Promise(resolve => setTimeout(resolve, 1));
    app.currentPage.name = "workOrderDetails";
    return Promise.resolve();
  });

  app.state.currentMapData = { coordinate: [12.12121212, 12.12121212] };
  app.lastPage = { name: "createwo" };
  await app.initialize();
  controller.pageInitialized(page, app);
  page.state.assetLinear = true;
  page.state.errorMessage = '';
  page.state.editAssetsLocation = false;
  sinon.stub(controller, 'getMaxvars').returns({ maxVars: [{ varvalue: 'LATLONG' }] });
  await expect(app.currentPage.name).toBe("createwo");
  page.state.errorMessage = false;
  await controller.createWorkorder(workorder);

  expect(savestub.called).toBe(true);
  expect(savestub.displayName).toBe('save');
  expect(app.currentPage.name).toBe("workOrderDetails");

  Device.get().isMaximoMobile = false;
  await controller.createWorkorder(workorder);
  expect(savestub.called).toBe(true);

  app.state.currentMapData = {};
  await controller.createWorkorder(workorder);
  expect(controller.saveDataSuccessful).toBe(true);

  page.state.errorMessage = 'Priority 1000 is not a valid priority value between 0 and 999';
  await controller.createWorkorder(workorder);
  page.state.assetFiltered = true;
  await controller.findAsset({ value: false });
  expect(page.state.isLocationAssetFocus).toBeFalsy();

  page.state.transactionInCourse = true;
  page.state.errorMessage = "";
  page.state.assetLinear = true;
  workorder.item.islinear = true;
  const navigateToDtlsPageSpy = sinon.spy(controller, 'navigateToDtlsPage');
  await controller.createWorkorder(workorder);
  expect(navigateToDtlsPageSpy.notCalled).toBe(true);

  const callSpy = sinon.spy(controller, 'callCreateWorkOrder');
  let WOCreateEditUtilsstub = sinon.stub(WOCreateEditUtils, "getAssetOrLocation")
    .returns([
      { assetnum: "10003", location: "OFFICE101" },
      { assetnum: "10002", location: "OFFICE101" },
    ]);
  ds2.item.assetnum = "10001";
  await controller.findAsset({ value: true });
  expect(callSpy.called).toBe(true);
  WOCreateEditUtilsstub.restore();
  classificationSpy.restore();
  savestub.restore();
});

it('Should not navigate', async() => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({name: 'createwo'});
 // jest.spyOn(Device, get).return({isMaximoMobile:true});
  
  const currentitem = {
    wonum: "1001",
    description: "Work Order desc",
    description_longdescription: "Work Order long desc",
    wopriority: 2,
    worktype: "CAL",
    orgid: "EAGLENA",
    assetnum: '12300',
    assetdesc: 'Electric cart',
    location : {
      location : 'SHIPPING',
      description: 'Shipping and Receiving Department'
    },
    woserviceaddress: [{}]
  }
  const response = undefined;
  await app.initialize();
  controller.pageInitialized(page, app);
  // add here
  Device.get().isMaximoMobile = true;
  const redirectSpy = jest.spyOn(app,'setCurrentPage');
  controller.navigateToDtlsPage(response, currentitem);
  expect(redirectSpy).not.toBeCalled();
})


it('Should not navigate in mobile', async() => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({name: 'createwo'});
  const ds = newDatasource(workorderitem, 'dsCreateWo');
  const currentitem = {
    wonum: "1001",
    description: "Work Order desc",
    description_longdescription: "Work Order long desc",
    wopriority: 2,
    worktype: "CAL",
    orgid: "EAGLENA",
    assetnum: '12300',
    assetdesc: 'Electric cart',
    location : {
      location : 'SHIPPING',
      description: 'Shipping and Receiving Department'
    },
    woserviceaddress: [{}]
  }
  page.registerDatasource(ds);
  await app.initialize();
  controller.pageInitialized(page, app);
  Device.get().isMaximoMobile = true;
  const redirectSpy = jest.spyOn(app,'setCurrentPage');
  controller.navigateToDtlsPage({items: currentitem}, currentitem);
  expect(redirectSpy).toBeCalled();
})

it('Do not Save Work Order', async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: 'createwo' });
  const ds2 = newDatasource(workorderitem, 'dsCreateWo');
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");
  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainData);

  app.registerDatasource(ds2);
  app.registerDatasource(assetLookupDS);
  app.registerDatasource(locationLookupDS);
  page.registerDatasource(ds2);
  app.registerController(controller);
  app.registerPage(page);
  Device.get().isMaximoMobile = true;

  let savestub = sinon.stub(ds2, 'save').callsFake(async () => {
    await new Promise(resolve => setTimeout(resolve, 1));
    app.currentPage.name = "workOrderDetails";
    return Promise.resolve();
  });

  let NoItemEvent = {};
  app.state.currentMapData = { coordinate: [12.12121212, 12.12121212] };
  app.lastPage = { name: "createwo" };
  await app.initialize();
  controller.pageInitialized(page, app);
  page.state.errorMessage = '';
  page.state.editAssetsLocation = true;
  sinon.stub(controller, 'getMaxvars').returns({ maxVars: [{ varvalue: 'LATLONG' }] });
  await controller.createWorkorder(NoItemEvent);

  expect(savestub.called).not.toBe(true);
  expect(savestub.called).toBe(false);
  expect(app.currentPage.name).not.toBe("workOrderDetails");
  expect(page.state.saveInProgress).toBeTruthy();

  savestub.restore();
});



it('validateFields should handle different field validation scenarios', async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: 'createwo' });

  const ds2 = newDatasource(workorderitem, 'dsCreateWo');
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");
  const assetFeatureDataDS = newDatasource(assetFeatureData, "assetFeatureData");
  ds2.state.dataLoaded = true;
  app.registerDatasource(ds2);
  app.registerDatasource(assetLookupDS);
  app.registerDatasource(locationLookupDS);
  app.registerDatasource(assetFeatureDataDS);
  page.registerDatasource(ds2);
  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainData);
  app.registerController(controller);
  app.registerPage(page);
  page.state.minPriority = 0;
  page.state.maxPriority = 999;
  app.lastPage = { name: "createwo" };
  page.params.quickReport = true;
  page.state.updatedForm = false;
  app.currentPage = { name: 'createwo' };
  app.client = { userInfo: { defaultSite: 'BEDFORD' } };

  await app.initialize();
  controller.pageInitialized(page, app);

  jest.spyOn(CommonUtil, 'getSystemProp').mockReturnValue(['TARGET', 'SCHEDULE']);
  controller.validateFields();
  expect(page.state.useConfirmDialog).toBe(false);

  // Test invalid priority
  let items = await ds2.load();
  items[0].wopriority = 1000;
  controller.validateFields();
  expect(page.state.readOnlyState).toBe(true);
  expect(app.currentPage.name).toBe("createwo");

  // Test valid priority, but invalid schedule start/finish date
  page.params.quickReport = true;
  items[0].wopriority = 1;
  items[0].schedstart = '2020-11-02T00:00:00.000+05:30';
  items[0].schedfinish = '2020-11-01T00:00:00.000+05:30';
  page.params.quickReport = false;
  controller.validateFields();
  expect(page.state.errorMessage).toBe('The scheduled start date must be before the finish date');
  expect(app.currentPage.name).toBe("createwo");

  // Test invalid estimated duration
  items[0].estdur = -1;
  controller.validateFields();
  expect(page.state.errorMessage).toBe('The duration should be positive value');

  // Test empty description
  items[0].description = "";
  controller.validateFields();
  expect(page.state.readOnlyState).toBe(true);
  expect(app.currentPage.name).toBe("createwo");

  // Test empty worktype
  items[0].worktype = "";
  controller.validateFields();
  expect(page.state.readOnlyState).toBe(true);
  expect(page.state.updatedForm).toBe(true);

  // Test linear validation for feature labels
  items[0].startfeaturelabel = "MP";
  sinon.stub(WOCreateEditUtils, "featureLabelValidation").returns(-1);
  controller.validateFields();
  expect(page.state.readOnlyState).toBe(true);

  items[0].endfeaturelabel = "MP";
  controller.validateFields();
  expect(page.state.readOnlyState).toBe(true);

  items[0].startyoffsetref = "CENTER";
  sinon.stub(WOCreateEditUtils, "startYRefCal").returns(true);
  controller.validateFields();
  expect(page.state.readOnlyState).toBe(true);

  items[0].endyoffsetref = "CENTER";
  sinon.stub(WOCreateEditUtils, "endYRefCal").returns(true);
  controller.validateFields();
  expect(page.state.readOnlyState).toBe(true);

  // Test start/end measure validation
  items[0].startmeasure = "-1";
  page.state.assetStartMeasure = "0";
  page.state.assetEndMeasure = "109.7";
  controller.validateFields();
  expect(page.state.readOnlyState).toBe(true);

  items[0].endmeasure = "200";
  page.state.assetStartMeasure = "0";
  page.state.assetEndMeasure = "109.7";
  controller.validateFields();
  expect(page.state.readOnlyState).toBe(true);
});

 it("handle close of cretae workorder page", async () => {
   const controller = new WorkOrderCreateController();
   const app = new Application();
   const page = new Page({ name: "schedule" });
   const ds = newDatasource(workorderitem, 'dsCreateWo');
   const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
   const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");
   app.registerDatasource(assetLookupDS);
   app.registerDatasource(locationLookupDS);
   page.registerDatasource(ds);
   const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
   app.registerDatasource(synonymdomainData);
   app.registerController(controller);
   app.registerPage(page);
   app.lastPage = { name: "createwo" };
   await app.initialize();
   controller.handleClose();
   expect(app.currentPage.name).toBe("schedule");       
 });

 it("it should set saveDataSuccessful to false ", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({name: 'createwo'});
  const ds = newDatasource(workorderitem, 'dsCreateWo');
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");
  page.registerDatasource(ds);
  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainData);
  app.registerDatasource(assetLookupDS);
  app.registerDatasource(locationLookupDS);
  app.registerController(controller);
  app.registerPage(page);
  app.lastPage = { name: "createwo" };
  await app.initialize();
  controller.onSaveDataFailed();
  expect(controller.saveDataSuccessful).toBe(false);      
});

it('it should be saved on user confirmation dialog save when leaving page', async () => {

  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({name: 'createwo'});
  const ds = newDatasource(workorderitem, 'dsCreateWo');
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");
  app.registerDatasource(assetLookupDS);
  app.registerDatasource(locationLookupDS);
  page.registerDatasource(ds);
  sinon.stub(ds, 'hasNewItems').returns(false);
  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainData);
  app.registerController(controller);
  app.registerPage(page);
  app.lastPage = { name: "createwo" };
  await app.initialize();
  controller.pageInitialized(page, app);

  await ds.load();
  await assetLookupDS.load();
  let updateSpy = sinon.spy(controller,'createWorkorder');

  controller.onCustomSaveTransition();
  expect(updateSpy.calledOnce).toBe(true);
  expect(updateSpy.getCall(0).args[0]).toStrictEqual({item: ds.item});  
});
it("it should set editorValue on change", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  const ds = newDatasource(workorderitem, 'dsCreateWo');
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");
  app.registerDatasource(assetLookupDS);
  app.registerDatasource(locationLookupDS);
  page.registerDatasource(ds);
  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainData);
  app.registerController(controller);
  app.registerPage(page);
  app.lastPage = { name: "createwo" };
  await app.initialize();
  let evt = {
    target: {
      content: "<p>Test</p>",
    },
  };
  controller.onEditorChange(evt);
  expect(page.state.editorValue).toBe(evt.target.content);
});

it("it should set editorValue on save", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  const ds = newDatasource(workorderitem, 'dsCreateWo');
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");
  app.registerDatasource(assetLookupDS);
  app.registerDatasource(locationLookupDS);
  page.registerDatasource(ds);
  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainData);
  app.registerController(controller);
  app.registerPage(page);
  app.lastPage = { name: "createwo" };
  await app.initialize();

  controller.onEditorSave();
  expect(page.state.editorValue).toBe(null);
});

it("it should show saveDiscardDialog on dialog back", async () => {
  let mockedFn = jest.fn();
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  const ds = newDatasource(workorderitem, 'dsCreateWo');
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");
  app.registerDatasource(assetLookupDS);
  app.registerDatasource(locationLookupDS);
  page.registerDatasource(ds);
  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainData);
  page.showDialog = mockedFn;
  app.registerController(controller);
  app.registerPage(page);
  page.state.editorValue = "<p>Test</p>";
  app.lastPage = { name: "createwo" };
  await app.initialize();

  controller.onCloseRichTextDialog();
  expect(page.showDialog.mock.calls.length).toEqual(1);
});

it("it should close dialog and reset editorValue value", async () => {
  let mockedFn = jest.fn();
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  const ds = newDatasource(workorderitem, 'dsCreateWo');
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");
  page.registerDatasource(ds);
  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainData);
  app.registerDatasource(assetLookupDS);
  app.registerDatasource(locationLookupDS);
  page.showDialog = mockedFn;
  app.registerController(controller);
  app.registerPage(page);
  page.state.editorValue = "<p>Test</p>";
  app.lastPage = { name: "createwo" };
  await app.initialize();

  controller.closeSaveDiscardDialog();
  expect(page.state.editorValue).toBe(null);
});

it("it should close dialog and reset editorValue value", async () => {
  const workorder = {
    wonum: "1001",
    description: "Work Order desc",
    description_longdescription: "Work Order long desc",
    wopriority: 2,
    worktype: "CAL",
    orgid: "EAGLENA",
    status: "APPR",
    locationnum: "SHIPPING",
    locationdesc: "Shipping and Receiving Department",
    schedfinish: "2024-09-26T05:18:00+05:30",
    schedstart: "2024-09-20T02:49:00+05:30",
    targcompdate: "2024-09-01T05:18:00+05:30",
    targstartdate: "2024-09-30T02:49:00+05:30"
  };
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  const ds = newDatasource({ member: workorder }, "dsCreateWo");
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");
  ds.baseQuery.select =
    "wonum,description,description_longdescription,wopriority,worktype,locationnum,orgid,siteid,href,woclass";
  page.registerDatasource(ds);
  app.registerDatasource(assetLookupDS);
  app.registerDatasource(locationLookupDS);
  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainData);
  app.registerController(controller);
  page.state = {
    editorValue: "<p>Test</p>",
  };
  app.registerPage(page);
  app.lastPage = { name: "createwo" };
  await app.initialize();
  await ds.load();
  let evt = {
    datasource: ds,
  };
  controller.setRichTextValue(evt);
  expect(ds.item.description_longdescription).toBe("<p>Test</p>");
});

it("should open asset lookup", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  const ds = newDatasource(workorderitem, "dsCreateWo");
  page.registerDatasource(ds);
  app.registerController(controller);
  app.currentPage = "createwo";
  page.state = { parentPage: "" };
  app.setCurrentPage = mockSetPage;
  await app.initialize();
  controller.pageInitialized(page, app);
  controller.openAssetLookup();
  expect(app.state.parentPage).toEqual("createwo");
  expect(page.state.useConfirmDialog).toEqual(true);
});

it("should not clear Asset if location has the same asset ", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.client = {
    userInfo: {
      defaultSite: "BEDFORD",
    },
  };
  const ds = newDatasource([workorderitem.member[0]], "dsCreateWo");
  let validateAssetStub = sinon.stub(WOCreateEditUtils, "validateAsset").returns(true);
  const validateAssetLocationStub = sinon.stub(WOCreateEditUtils, "validateAssetLocation");
  page.registerDatasource(ds);
  app.registerDatasource(ds);
  app.registerController(controller);
  await app.initialize();
  controller.pageInitialized(page, app);
  let item = {
    value: "OFFICE101",
  };
  page.state = { isMobile: false };
  let WOCreateEditUtilsstub = sinon
    .stub(WOCreateEditUtils, "getAssetOrLocation")
    .returns([
      { assetnum: "10003", location: "OFFICE101" },
      { assetnum: "10002", location: "OFFICE101" },
    ]);
  ds.item.assetnum = "10001";
  await controller.findAsset(item);
  expect(validateAssetStub.called).toBe(true);
  WOCreateEditUtilsstub.restore();
  validateAssetStub.restore();

  WOCreateEditUtilsstub = sinon
    .stub(WOCreateEditUtils, "getAssetOrLocation")
    .returns([
      { assetnum: "10001", location: "OFFICE101" },
      { assetnum: "10002", location: "OFFICE101" },
    ]);
  validateAssetStub = sinon.stub(WOCreateEditUtils, "validateAsset").returns(true);
  ds.item.assetnum = "10001";
  await controller.findAsset(item);
  expect(validateAssetLocationStub.called).toBe(false);
  WOCreateEditUtilsstub.restore();

  WOCreateEditUtilsstub = sinon
    .stub(WOCreateEditUtils, "getAssetOrLocation")
    .returns([]);
  ds.item.assetnum = "10001";
  await controller.findAsset(item);
  expect(ds.item.assetnum).toEqual("10001");
  WOCreateEditUtilsstub.restore();
  validateAssetStub.restore();
});

it("should set value on asset/location on input value change", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.client = {
    userInfo: {
      defaultSite: 'BEDFORD'
    }
  }
  const ds = newDatasource(workorderitem, "dsCreateWo");
  page.registerDatasource(ds);
  app.registerDatasource(ds);
  app.registerController(controller);
  await app.initialize();
  controller.pageInitialized(page, app);
  let evt = {
    assetnum: "10001",
    location: "OFFICE101",
    glaccount: "123456789",
    description: "Test-asset",
    priority: "1",
    asset: [
      {
        assetnum: "10001",
        location: "PLUS",
        priority: "1",
        failurecode: "class",
      },
    ],
  };
  page.state = { isMobile: false };
  let WOCreateEditUtilsstub = sinon
    .stub(WOCreateEditUtils, "getAssetOrLocation")
    .returns([{ assetnum: "10001", location: "OFFICE101" }]);
  const chooseLocation = sinon.stub(WOCreateEditUtils, "chooseLocation");
  await controller.onChangeAsset({item:evt, app:app});
  expect(page.findDatasource("dsCreateWo").item.location).toEqual("OFFICE101");
  expect(page.findDatasource("dsCreateWo").item.assetnum).toEqual("10001");

  await controller.onChangeLocation({item:evt,app:app});
  expect(page.findDatasource("dsCreateWo").item.location).toEqual("OFFICE101");
  expect(page.findDatasource("dsCreateWo").item.assetnum).toEqual("10001");

  page.state = {
    isMobile: true,
    selectedItem: { action: "SETASSET", item: evt },
  };
  controller.onUserConfirmationNo();
  expect(page.findDatasource("dsCreateWo").item.assetnum).toEqual("10001");
  page.state = {
    isMobile: true,
    selectedItem: { action: "SETLOCATION", item: evt },
  };
  controller.onUserConfirmationNo();
  expect(page.findDatasource("dsCreateWo").item.location).toEqual("OFFICE101");
  page.state = {
    isMobile: true,
    selectedItem: { action: "SETASSETGL", item: evt },
  };
  controller.onUserConfirmationNo();
  expect(page.findDatasource("dsCreateWo").item.location).toEqual("OFFICE101");
  expect(page.findDatasource("dsCreateWo").item.assetnum).toEqual("10001");
  WOCreateEditUtilsstub.restore();
  chooseLocation.restore();
});

it("should set value on asset/location on input value change by user type", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.client = {
    userInfo: {
      defaultSite: 'BEDFORD'
    }
  }
  const ds = newDatasource(workorderitem, "dsCreateWo");
  page.registerDatasource(ds);
  app.registerDatasource(ds);
  app.registerController(controller);
  await app.initialize();
  controller.pageInitialized(page, app);
  let evt = {
    assetnum: "10001",
    location: "OFFICE101",
    glaccount: "123456789",
    description: "Test-asset",
    priority: "1",
    asset: [
      {
        assetnum: "10001",
        location: "PLUS",
        priority: "1",
        failurecode: "class",
      },
    ],
  };
  jest.spyOn(WOCreateEditUtils, "chooseLocation").mockImplementation(() => {
    page.findDatasource("dsCreateWo").item.location = evt.location;
    page.findDatasource("dsCreateWo").item.assetnum = evt.assetnum;
  });
  page.state = { isMobile: false };
  sinon.stub(WOCreateEditUtils, "getAssetOrLocation").returns([{ assetnum: "10001", location: "OFFICE101" }]);
  controller.editAssetsLocation(evt);
  await controller.findAsset({ value: 'OFFICE101'})
  expect(page.findDatasource("dsCreateWo").item.location).toEqual("OFFICE101");
  expect(page.findDatasource("dsCreateWo").item.assetnum).toEqual("10001");

  await controller.onChangeLocation({item:evt,app:app});
  await controller.findLocation({ value: '10001'});
  expect(page.findDatasource("dsCreateWo").item.location).toEqual("OFFICE101");
  expect(page.findDatasource("dsCreateWo").item.assetnum).toEqual("10001");

  page.state = {
    isMobile: true,
    selectedItem: { action: "SETASSET", item: evt },
  };
  controller.onUserConfirmationNo();
  expect(page.findDatasource("dsCreateWo").item.assetnum).toEqual("10001");
  page.state = {
    isMobile: true,
    selectedItem: { action: "SETLOCATION", item: evt },
  };
  controller.onUserConfirmationNo();
  expect(page.findDatasource("dsCreateWo").item.location).toEqual("OFFICE101");
  page.state = {
    isMobile: true,
    selectedItem: { action: "SETASSETGL", item: evt },
  };
  controller.onUserConfirmationNo();
  expect(page.findDatasource("dsCreateWo").item.location).toEqual("OFFICE101");
  expect(page.findDatasource("dsCreateWo").item.assetnum).toEqual("10001");

  const chooseAssetSpy = jest.spyOn(controller,'chooseAsset');
  await controller.findLocation(false);
  expect(chooseAssetSpy).not.toBeCalled();
});

it("should set page title to quick report or create work order as per set params", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" , params: {quickReport: false}});
  await app.initialize();
  controller.pageInitialized(page, app);

  page.params.quickReport = true;
  controller.setPageTitle();
  expect(app.state.fromQuickReport).toBe(1);

  page.params.quickReport = false;
   await controller.setPageTitle();
  expect(app.state.fromQuickReport).toBe(0);
});


it("should set useConfirmDialog = false if quick report is set", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" , params: {quickReport: false}});
  app.lastPage = {
    name : 'assetLookup'
  }
  await app.initialize();
  controller.pageInitialized(page, app);
  page.params.quickReport = true;
  controller.pageResumed(page, app);
  
  controller.setPageTitle();
  expect(page.state.useConfirmDialog).toBe(false);
});

it("should update page state of edist assets and location for manual value change", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  const ds = newDatasource(workorderitem, "dsCreateWo");
  page.registerDatasource(ds);
  await app.initialize();
  controller.pageInitialized(page, app);
  controller.editAssetsLocation();
  expect(page.state.editAssetsLocation).toBeTruthy();
  expect(page.state.isLocationAssetFocus).toBeTruthy();
});

it("should update page state and call createWorkOrder if earlier save was clicked or if state is false then don't call create WO method", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  const ds = newDatasource(workorderitem, "dsCreateWo");
  page.registerDatasource(ds);
  await app.initialize();
  controller.pageInitialized(page, app);

  page.state.editAssetsLocation = false;
  const createWorkorderSpy = jest.spyOn(controller,'createWorkorder');
  controller.callCreateWorkOrder();
  expect(createWorkorderSpy).not.toBeCalled();

  controller.editAssetsLocation();
  page.state.saveInProgress = true;
  page.state.createWorkorderItem = {}
  controller.callCreateWorkOrder();
  expect(page.state.editAssetsLocation).toBeFalsy();
  expect(page.state.saveInProgress).toBeTruthy();
  expect(createWorkorderSpy).toBeCalled();
});

it("should set value setLookUpValue", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  const dsCreateWo = newDatasource(workorderitem, "dsCreateWo");
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  page.registerDatasource(dsCreateWo);
  app.registerDatasource(dsCreateWo);
  app.registerDatasource(assetLookupDS);
  app.registerController(controller);
  await app.initialize();
  controller.pageInitialized(page, app);
  app.client = {
    userInfo: {
      defaultSite: "BEDFORD",
    },
  };
  let evt = {
    assetnum: "10001",
    location: "OFFICE101",
    glaccount: "123456789",
    description: "Test-asset",
    priority: "1",
    asset: [
      {
        assetnum: "10001",
        location: "PLUS",
        priority: "1",
        failurecode: "class",
      },
    ],
  };
  page.state = {
    isMobile: false,
    selectedItem: { action: "SETASSET", item: evt },
  };
  sinon
  .stub(WOCreateEditUtils, "validateGlAccount")
  .returns(true);
  controller.setLookUpValue();
  expect(page.findDatasource("dsCreateWo").item.location).toEqual("OFFICE101");
  expect(page.findDatasource("dsCreateWo").item.assetnum).toEqual("10001");
  expect(controller.validAssetValue).toEqual("10001");
  page.state = {
    isMobile: false,
    selectedItem: { action: "SETLOCATION", item: evt },
  };
  controller.setLookUpValue();
  expect(page.findDatasource("dsCreateWo").item.location).toEqual("OFFICE101");
  expect(page.findDatasource("dsCreateWo").item.assetnum).toEqual("10001");
  expect(controller.validLocationValue).toEqual("OFFICE101");
  page.state = {
    isMobile: false,
    selectedItem: { action: "SETLOCGL", item: evt },
  };
  controller.setLookUpValue();
  expect(page.findDatasource("dsCreateWo").item.location).toEqual("OFFICE101");
  expect(page.findDatasource("dsCreateWo").item.assetnum).toEqual("10001");
  expect(controller.validLocationValue).toEqual("OFFICE101");
  evt.asset = [
    {
      "parent": "11210",
      "description": "Motor Starter- Size 2/440v/3ph/60cy",
      "locationdesc": "Circulation Fan #1- Main Office HVAC",
      "assetnum": "11211",
      "siteid": "BEDFORD",
      "href": "oslc/os/mxapiasset/_MTEyMTEvQkVERk9SRA--",
      "assetuid": 131,
      "locglaccount": "6210-350-???",
      "location": "BR210",
    },
    {
      "parent": "11200",
      "description": "Circulation Fan- Centrifugal/ 20/000 CFM",
      "locationdesc": "Circulation Fan #1- Main Office HVAC",
      "assetnum": "11210",
      "siteid": "BEDFORD",
      "href": "oslc/os/mxapiasset/_MTEyMTAvQkVERk9SRA--",
      "assettype": "FACILITIES",
      "assetuid": 129,
      "locglaccount": "6210-350-???",
      "location": "BR210",
    }
  ]
  page.state = {
    isMobile: false,
    selectedItem: { action: "SETLOCATION", item: evt },
  };
  controller.setLookUpValue();
  expect(page.findDatasource("dsCreateWo").item.assetdesc).toEqual("");
  expect(page.findDatasource("dsCreateWo").item.assetnum).toEqual("");
});


it("should set value on asset on scanning barcode or QR code", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.client = {
    userInfo: {
      defaultSite: 'BEDFORD'
    }
  }
  const ds = newDatasource(workorderitem, "dsCreateWo");
  page.registerDatasource(ds);
  app.registerDatasource(ds);
  app.registerController(controller);  
  await app.initialize();
  controller.pageInitialized(page, app);  
  controller.handleAssetBarcodeScan({value: ''})
  expect(page.findDatasource("dsCreateWo").item.assetnum).toEqual(undefined); 

  controller.handleAssetBarcodeScan({value: '9780201379624'})
  expect(page.findDatasource("dsCreateWo").item.assetnum).toEqual("9780201379624"); 
   
});


it("should set value on location on scanning barcode or QR code", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.client = {
    userInfo: {
      defaultSite: 'BEDFORD'
    }
  }
  const ds = newDatasource(workorderitem, "dsCreateWo");
  page.registerDatasource(ds);
  app.registerDatasource(ds);
  app.registerController(controller);  
  await app.initialize();
  controller.pageInitialized(page, app);  
  controller.handleLocationBarcodeScan({value: ''})
  expect(page.findDatasource("dsCreateWo").item.location).toEqual(undefined);
  controller.handleLocationBarcodeScan({value: '978020137963'})
  expect(page.findDatasource("dsCreateWo").item.location).toEqual("978020137963");
  
   
});

it("should call getMaxvars", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.client = {
    userInfo: {
      defaultSite: 'BEDFORD'
    }
  }
  const ds = newDatasource(workorderitem, "dsCreateWo");
  const defaultSetDs = newStatusDatasource(setData, 'defaultSetDs');
  page.registerDatasource(ds);
  app.registerDatasource(ds);
  app.registerDatasource(defaultSetDs);
  app.registerController(controller);
  await defaultSetDs.load();  
  await app.initialize();
  controller.pageInitialized(page, app);  
  let getMaxvars = await controller.getMaxvars();
  expect(getMaxvars.length).toBe(1);
});

it("should chooseAssetItem", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  const ds = newDatasource(workorderitem, "dsCreateWo");
  page.registerDatasource(ds);
  app.registerDatasource(ds);
  app.registerController(controller);  
  await app.initialize();
  controller.pageInitialized(page, app); 
  page.state.isManual = true;
  page.state.assetLinear = false;
  ds.item.assetnum ='';
  ds.item.location = '';
  ds.item.islinear = false;
  controller.validAssetValue = '';
  const data = {assetnum :"7600", location : "XYZ"}
  controller.chooseAssetItem(data);
  expect(ds.item.assetnum).toEqual(data.assetnum);
  expect(page.state.assetLinear).toBe(false);
  controller.chooseAsset(data);
});


it("Should openYRefernceLookup", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);  
  app.initialize();
  controller.pageInitialized(page, app);
  let evt = {
    ref:'start'
  }
  await controller.openYRefernceLookup(evt);
});

it("Should openEndYRefernceLookup", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);  
  app.initialize();
  controller.pageInitialized(page, app);
  let evt = {
    ref:'end'
  }
  await controller.openEndYRefernceLookup(evt);
});

it("Should openZRefernceLookup", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);  
  app.initialize();
  controller.pageInitialized(page, app);
  const evt = {
    ref:'start'
  }
  await controller.openZRefernceLookup(evt);
});

it("Should openEndZRefernceLookup", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);  
  app.initialize();
  controller.pageInitialized(page, app);
  const evt = {
    ref:'end'
  }
  await controller.openEndZRefernceLookup(evt);
});

it("Should chooseYRefernce", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  const ds = newDatasource(workorderitem, "dsCreateWo");
  page.registerDatasource(ds);
  app.registerController(controller);  

  app.initialize();
  controller.pageInitialized(page, app);

  const itemSelected =  {
    startyoffsetref : "1.00",
  };
  const ds2 = page.findDatasource("dsCreateWo");
   app.registerDatasource(ds2);

  await controller.chooseYRefernce(page,"dsCreateWo",itemSelected,"startyoffsetref");
});

it("Should chooseZRefernce", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  const ds = newDatasource(workorderitem, "dsCreateWo");
  page.registerDatasource(ds);
  app.registerController(controller);  

  app.initialize();
  controller.pageInitialized(page, app);

  const itemSelected =  {
    startzoffsetref : "2.67",
  };;


  await controller.chooseZRefernce(page,"dsCreateWo",itemSelected,"startzoffsetref");
});

it("Should chooseEndYRefernce", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  const ds = newDatasource(workorderitem, "dsCreateWo");
  page.registerDatasource(ds);
  app.registerController(controller);  

  app.initialize();
  controller.pageInitialized(page, app);

  const itemSelected =  {
    endyoffsetref : "2.89",
  };;

  await controller.chooseEndYRefernce(page,"dsCreateWo",itemSelected,"endyoffsetref");
});

it("Should chooseEndZRefernce", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  const ds = newDatasource(workorderitem, "dsCreateWo");
  page.registerDatasource(ds);
  app.registerController(controller);  

  app.initialize();
  controller.pageInitialized(page, app);

  const itemSelected =  {
    endzoffsetref : "3.45",
  };
 
  await controller.chooseEndZRefernce(page,"dsCreateWo",itemSelected,"endzoffsetref");
});

it("Should chooseReferncePoint", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  const ds = newDatasource(workorderitem, "dsCreateWo");
  page.registerDatasource(ds);
  app.registerController(controller);  

  app.initialize();
  controller.pageInitialized(page, app);

  const itemSelected =  {
    startfeaturelabel : "MP-10",
    assetfeatureid : "183",
  };
   
  await controller.chooseReferncePoint(page,"dsCreateWo",itemSelected,"startfeaturelabel");
});

it("Should chooseEndReferncePoint", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  const ds = newDatasource(workorderitem, "dsCreateWo");
  page.registerDatasource(ds);
  app.registerController(controller);  

  app.initialize();
  controller.pageInitialized(page, app);

  const itemSelected =  {
    endfeaturelabel : "MP-20",
    assetfeatureid : "184",
  };
  await controller.chooseEndReferncePoint(page,"dsCreateWo",itemSelected,"endfeaturelabel");
});

it("Should openStartReferncePointLookup", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);  
  app.initialize();
  controller.pageInitialized(page, app);

  const evt = {
    ref:'start'
  };
  await controller.openStartReferncePointLookup(evt);
});
 
it("Should openEndReferncePointLookup", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);  
  app.initialize();
  controller.pageInitialized(page, app);

  const evt = {
    ref:'end'
  };
  await controller.openEndReferncePointLookup(evt);
});

it("should prepare Default Data", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo", params: { quickReport: true } });

  app.userInfo.defaultOrg = 'EAGLENA';
  app.userInfo.defaultSite = 'BEDFORD';
  app.client = {
    userInfo: {
      personid: 'WILSON',
      insertSite: 'BEDFORD',
      labor: {
          laborcode: 'wilson'
      }
    }
  }

  const workorder = workorderitem;
  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainData);
  const ds = newDatasource({ member: workorder}, "dsCreateWo");
  app.registerController(controller);
  app.registerPage(page);
  page.registerDatasource(ds);

  await app.initialize();
  controller.pageInitialized(page, app);

  // Mock the methods
  const getSchemaStub = sinon.stub(ds, "getSchema").returns({
    properties: {
      assetnum: { defaultValue: "ABC"},
      location: { defaultValue: "ABC"}
    }
  });

  jest.spyOn(SynonymUtil, 'getDefExtSynonymValueIdWithOrgSite').mockResolvedValue({
    value: "WAPPR",
    description: "Waiting on approval",
    maxvalue: "WAPPR"
  });
  const statusData = sinon.stub(SynonymUtil, "getDefExtSynonymValueIdWithOrgSite").returns({ value: "WAPPR", description: "Waiting on approval", maxvalue: "WAPPR" });
  
  const addNewStub = jest.spyOn(ds, 'addNew').mockResolvedValue(workorder);

  page.params.quickReport = true;
  await controller.prepareDefaultData(ds);

  // Assertions
  expect(addNewStub).toHaveBeenCalled();
  expect(statusData.called).toBe(true);
  expect(statusData().value).toBe("WAPPR");

  expect(app.client).toBeTruthy();
  expect(app.state.parentPage).toBe("");
  expect(page.state.useConfirmDialog).toBe(false);
  
  expect(ds.item.wopriority).toBe(1); 
  expect(ds.item.isquickreported).toBe(1);// Quick report setting
  getSchemaStub.restore();
});

it("should prepare Default Data with currentMapData gisIntegrationData values", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo", params: { quickReport: true } });

  app.userInfo.defaultOrg = 'EAGLENA';
  app.userInfo.defaultSite = 'BEDFORD';
  app.client = {
    userInfo: {
      personid: 'WILSON',
      insertSite: 'BEDFORD',
      labor: {
          laborcode: 'wilson'
      }
    }
  }

  app.state.currentMapData = {
    coordinate: [12.12121212,12.12121212],
    gisIntegrationData: [{description: '2502'}]
  }
  const workorder = workorderitem;
  const synonymdomainData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainData);
  const ds = newDatasource({ member: workorder }, "dsCreateWo");
  app.registerController(controller);
  app.registerPage(page);
  page.registerDatasource(ds);

  await app.initialize();
  controller.pageInitialized(page, app);

  // Mock the methods
  const getSchemaStub = sinon.stub(ds, "getSchema").returns({
    properties: {
      assetnum: { defaultValue: "ABC"},
      location: { defaultValue: "ABC"}
    }
  });
  jest.spyOn(SynonymUtil, 'getDefExtSynonymValueIdWithOrgSite').mockResolvedValue({
    value: "WAPPR",
    description: "Waiting on approval",
    maxvalue: "WAPPR"
  });
  const statusData = sinon.stub(SynonymUtil, "getDefExtSynonymValueIdWithOrgSite").returns({ value: "WAPPR", description: "Waiting on approval", maxvalue: "WAPPR" });
  
  const addNewStub = jest.spyOn(ds, 'addNew').mockResolvedValue(workorder);

  page.params.quickReport = true;
  await controller.prepareDefaultData(ds);

  // Assertions
  expect(addNewStub).toHaveBeenCalled();
  expect(statusData.called).toBe(true);
  expect(statusData().value).toBe("WAPPR");

  expect(app.client).toBeTruthy();
  expect(app.state.parentPage).toBe("");
  expect(page.state.useConfirmDialog).toBe(false);
  
  expect(ds.item.description).toBe("2502");
  getSchemaStub.restore();
});

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
it('should validate endyoffsetref', () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
  const hasError = true;
  const errorField = "endyoffsetref";
  const arrayListFieldsWithError = [{ attributename: 'endyoffsetref', error: true }];
  controller.validateEndYOffsetzRef(hasError, errorField, arrayListFieldsWithError);
  const clearWarn = sinon.stub(controller, "clearWarnings");
  expect(clearWarn.called).toBe(false);
})

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
it('should validate startyoffsetref', () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
  const hasError = true;
  const errorField = "startyoffsetref";
  const arrayListFieldsWithError = [{ attributename: 'startyoffsetref', error: true }];
  controller.validateEndYOffsetzRef(hasError, errorField, arrayListFieldsWithError);
  const clearWarn = sinon.stub(controller, "clearWarnings");
  expect(clearWarn.called).toBe(false);
})

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
it('should validate endfeaturelabel', () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
  const hasError = true;
  const errorField = "endfeaturelabel";
  const arrayListFieldsWithError = [{ attributename: 'endfeaturelabel', error: true }];
  controller.validateEndYOffsetzRef(hasError, errorField, arrayListFieldsWithError);
  const clearWarn = sinon.stub(controller, "clearWarnings");
  expect(clearWarn.called).toBe(false);
})

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
it('should validate startfeaturelabel', () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
  const hasError = true;
  const errorField = "startfeaturelabel";
  const arrayListFieldsWithError = [{ attributename: 'startfeaturelabel', error: true }];
  controller.validateEndYOffsetzRef(hasError, errorField, arrayListFieldsWithError);
  const clearWarn = sinon.stub(controller, "clearWarnings");
  expect(clearWarn.called).toBe(false);
});

it('only sets the location on the datasource item', () => {
  // Call the onUserConfirmationClose method
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  const ds = newDatasource(workorderitem, "dsCreateWo");
  page.registerDatasource(ds);
  app.registerDatasource(ds);
  app.registerController(controller);  
  controller.validAssetValue = 11430;
  controller.validLocationValue = 'BR430';
  controller.pageInitialized(page, app);  
  controller.onUserConfirmationClose();
  expect(ds.item.assetnum).toBe(11430);
  expect(ds.item.location).toBe('BR430');
});

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
it('should validate selectWorkType', () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
  const event = {
    item: {
      worktype: "CM"
    }
  }
  const workType = sinon.stub(WOCreateEditUtils, "selectWorkType").returns(true);
  controller.selectWorkType(event);
  expect(workType.called).toBeTruthy()
})

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
it('should showWOWarnings', () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);

  const field = "endzoffsetref"
  const message = "enter valid z offset"
  const showWarningType = sinon.stub(WOCreateEditUtils, "showWOWarnings").returns(true);
  controller.showWOWarnings(field,message);
  expect(showWarningType.called).toBeTruthy()
})

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
it('should clearWarnings', () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
 
  const field = "endzoffsetref"
  const clearWarningType = sinon.stub(WOCreateEditUtils, "clearWarnings").returns(true);
  controller.clearWarnings(field);
  expect(clearWarningType.called).toBeTruthy()
})

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
it('should validateLinearAsset', () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
 
  const assetNum = "I-95N"
  const validateLinearAssetStub = sinon.stub(WOCreateEditUtils, "validateLinearAsset").returns(true);
  controller.validateLinearAsset(assetNum);
  expect(validateLinearAssetStub.called).toBeTruthy()
})

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
it("Opens the classification lookup dialog", async() => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });

  let dsCreateWo = newDatasource(workorderitem, "dsCreateWo");
  dsCreateWo.item.classstructureid = "1001";
  CommonUtil.sharedData.treeData = {
    find: jest.fn(() => true),
  };

  // Initialize woClassDataDS datasource
  const woClassDataDS = newDatasource(classificationData, "workOrderClassDomain");
  woClassDataDS.setSelectedItem = jest.fn();
  woClassDataDS.load = jest.fn();

  page.registerDatasource(dsCreateWo);
  page.registerDatasource(woClassDataDS);

  app.registerController(controller);
  await app.initialize();
  controller.pageInitialized(page, app);
  controller.openClassification();
  expect(woClassDataDS.items.length).toEqual(0);
});

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
it('should endMeasureCal', () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
 
  const event = {
    item: {
      endoffset: "10"
    }
  }
  const endMeasureCalStub = sinon.stub(WOCreateEditUtils, "endMeasureCal").returns(true);
  controller.endMeasureCal(event);
  expect(endMeasureCalStub.called).toBeTruthy()
})


// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
it('should endOffsetCal', () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
 
  const event = {
    item: {
      endoffset: "10",
      endfeaturelabel : "MP 10"
    }
  }
  const endOffsetStub = sinon.stub(WOCreateEditUtils, "endOffsetCal").returns(true);
  controller.endOffsetCal(event);
  expect(endOffsetStub.called).toBeTruthy()
})

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
it('should startOffsetCal', () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
 
  const evt = { item: { startfeaturelabel: "MP 10" ,startoffset:"10"} };
  const startOffsetStub = sinon.stub(WOCreateEditUtils, "startOffsetCal").returns(true);
  controller.startOffsetCal(evt);
  expect(startOffsetStub.called).toBeTruthy()
})

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
it('should startMeasureCal', () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
 
  const evt = { item: { startfeaturelabel: "MP 10" ,startoffset:"10"} };
  const startMeasureCalStub = sinon.stub(WOCreateEditUtils, "startMeasureCal").returns(true);
  controller.startMeasureCal(evt);
  expect(startMeasureCalStub.called).toBeTruthy()
})

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
it('should startMeasureValidation', () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
 
  const evt = { item: { startfeaturelabel: "MP 10" } };
  const startMeasureValidationStub = sinon.stub(WOCreateEditUtils, "startMeasureValidation").returns(true);
  controller.startMeasureValidation(evt);
  expect(startMeasureValidationStub.called).toBeTruthy()
})

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
it('should endMeasureValidation', () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
 
  const evt = { item: { endfeaturelabel: "MP 10" } };
  const endMeasureValidationStub = sinon.stub(WOCreateEditUtils, "endMeasureValidation").returns(true);
  controller.endMeasureValidation(evt);
  expect(endMeasureValidationStub.called).toBeTruthy()
})

  
it('Validates the startZRefCal() method when the endzoffsetref field is invalid', async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
  const evt = { item: { startzoffsetref: 45 } };
  const startZRefCalStub = sinon.stub(WOCreateEditUtils, "startZRefCal").returns(true);
  await controller.startZRefCal(evt);
  expect(startZRefCalStub.called).toBeTruthy()
});

it('Validates the endZRefCal() method when the endzoffsetref field is invalid', async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
  const evt = { item: { endzoffsetref: 45 } };
  const endZRefCalStub = sinon.stub(WOCreateEditUtils, "endZRefCal").returns(true);
  await controller.endZRefCal(evt);
  expect(endZRefCalStub.called).toBeTruthy()
});

it('Calls chooseAssetItem method ', async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
  const data = {assetnum :"7600", location : "XYZ"}
  const chooseAssetItemStub = sinon.stub(WOCreateEditUtils, "chooseAssetItem").returns(true);
  controller.chooseAssetItem(data);
  expect(chooseAssetItemStub.called).toBeTruthy()
});

it('Calls chooseClassification and clearClassification method ', async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({ name: "createwo" });
  const chooseClassfication = jest.spyOn(WOCreateEditUtils, 'chooseClassification');
  const clearClassfication = jest.spyOn(WOCreateEditUtils, 'clearClassification');
  const workorder = {
    wonum: "1001",
    description: "Work Order desc",
    description_longdescription: "Work Order long desc",
    wopriority: 2,
    worktype: "CAL",
    orgid: "EAGLENA",
    location : {
      location : 'SHIPPING',
      description: 'Shipping and Receiving Department'
    },
    schedfinish: "2021-06-04T05:18:00+05:30",
    schedstart: "2021-06-04T02:49:00+05:30"
  };
  const ds = newDatasource({ member: workorder }, "dsCreateWo");
  page.registerDatasource(ds);
  app.registerController(controller);
  await app.initialize();
  await controller.pageInitialized(page, app);
  await controller.chooseClassification({hierarchypath: 'PIPE_LEAK', classstructureid: '1000'});
  expect(chooseClassfication).toHaveBeenCalled();
  await controller.clearClassification();
  expect(clearClassfication).toHaveBeenCalled();
});

it("should call createWorkorder with toast error", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({
    state:{
      errorMessage: true,
      readOnlyState:true
    }
  });
  app.client = {
    findDatasource: jest.fn(() => workorderitem),
    getLocalizedLabel: jest.fn(() => 'string'),
    showDialog: jest.fn(),
    client: {
      userInfo: {
        personid: 'wilson'
      }
    },
    state: {},
  }
  app.toast = jest.fn();
  const event = {
    item: {
      description: "HVAC overheating",
      status: "WMATL",
      status_description: "Waiting on material",
      status_maxvalue: "WMATL",
      statusdate: "2021-03-09T16:08:51+05:30",
      wonum: "1228",
      worktype: "CM",
      orgid: "EAGLENA",
      schedfinish: "2024-09-26T05:18:00+05:30",
      schedstart: "2024-09-20T02:49:00+05:30",
      targcompdate: "2024-09-01T05:18:00+05:30",
      targstartdate: "2024-09-30T02:49:00+05:30"
    },
  };
  const workorder = {
    wonum: "1001",
    description: "Work Order desc",
    description_longdescription: "Work Order long desc",
    wopriority: 2,
    worktype: "CAL",
    orgid: "EAGLENA",
    location : {
      location : 'SHIPPING',
      description: 'Shipping and Receiving Department'
    },
    schedfinish: "2021-06-04T05:18:00+05:30",
    schedstart: "2021-06-04T02:49:00+05:30"
  };
  app.getLocalizedLabel(('messages_issue_on_save_body'), 'Fix the indicated errors. Then, save your changes.');
  app.getLocalizedLabel(('messages_issue_on_save_title'), 'Unable to save due to errors on the page');
  const ds = newDatasource({ member: workorder }, "dsCreateWo");
  page.registerDatasource(ds);
  await app.initialize();
  sinon.stub(controller,'validateFields').returns(true);
  controller.pageInitialized(page, app);
  controller.createWorkorder(event);
  expect(app.toast).toHaveBeenCalled();
});



it("should call createWorkorder with classification change", async () => {
  const controller = new WorkOrderCreateController();
  const app = new Application();
  const page = new Page({
    state:{
      errorMessage: false,
      readOnlyState:false
    }
  });
  app.client = {
    findDatasource: jest.fn(() => workorderitem),
    getLocalizedLabel: jest.fn(() => 'string'),
    showDialog: jest.fn(),
    client: {
      userInfo: {
        personid: 'wilson'
      }
    },
    state: {},
  }
  app.toast = jest.fn();
  const event = {
    item: {
      description: "HVAC overheating",
      status: "WMATL",
      status_description: "Waiting on material",
      status_maxvalue: "WMATL",
      statusdate: "2021-03-09T16:08:51+05:30",
      wonum: "1228",
      worktype: "CM",
      orgid: "EAGLENA",
      schedfinish: "2024-09-26T05:18:00+05:30",
      schedstart: "2024-09-20T02:49:00+05:30",
      targcompdate: "2024-09-01T05:18:00+05:30",
      targstartdate: "2024-09-30T02:49:00+05:30"
    },
  };
  app.registerController(controller);
  const specificationDS = newDatasource(specificationData, "createEditWoSpecificationDS");
  const assetAttributeDS = newDatasource(assetAttributedata, "assetAttributeDS");
  assetAttributeDS.initializeQbe = jest.fn();
  assetAttributeDS.setQBE = jest.fn();
  assetAttributeDS.searchQBE = jest.fn();
  assetAttributeDS.forceReload = jest.fn();
  const ds = newDatasource({ member: specificationData }, "dsCreateWo");
  page.registerDatasource(ds);
  app.registerDatasource(assetAttributeDS);
  app.registerDatasource(specificationDS);
  await app.initialize();
  controller.pageInitialized(page, app);
  const chooseClassificationSpy = jest.spyOn(controller,'chooseClassification');
  await controller.chooseClassification(specificationData.member[0]);
  controller.createWorkorder(event);
  expect(chooseClassificationSpy).toHaveBeenCalled();
});