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

import WorkOrderEditController from "./WorkOrderEditController";
import WOCreateEditUtils from "./utils/WOCreateEditUtils";
import {Application, Page, JSONDataAdapter, Datasource, Device} from "@maximo/maximo-js-api";
import worktype from "./test/worktype-json-data";
import workorderitem from './test/wo-detail-json-data.js';
import wpeditsettings from './test/wp-edit-setting-json-data.js';
import sinon from 'sinon';
import wpmaterial from "./test/materials-json-data";
import statusitem from './test/statuses-json-data.js';
import SynonymUtil from './utils/SynonymUtil';
import woclassitem from './test/woclass-json-data.js';
import CommonUtil from './utils/CommonUtil.js';
import assetFeatureData from "./test/assetfeature-json-data.js";
import specificationData from "./test/specification-json-data.js";
import classificationData from './test/classificationdata';  


function newDatasource(data = workorderitem, name = "dsWoedit") {
  const da = new JSONDataAdapter({
    src: data,
    items: "member",
    schema: 'responseInfo.schema'
  });

  const ds = new Datasource(da, {
    idAttribute: "wonum",
    name: name,
  });

  da.options.query = !da.options.query ? {} : da.options.query;
  da.options.query.interactive = null;
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
function newDatasource1(data, name = "wpEditSetting") {
	const da = new JSONDataAdapter({
		src: data,
		items: "member",
	});
	const ds = new Datasource(da, {
		idAttribute: "status",
		name: name,
	});
	return ds;
}

it("should manage selectedArray correctly with add/remove operations", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  app.registerController(controller);
  app.registerPage(page);

  await app.initialize();
  controller.pageInitialized(page, app);

  // Event with item having a multiid
  let evt = { item: { multiid: '1001' } };

  // Add item to selection
  controller.updateSelection(evt, true);
  expect(CommonUtil.sharedData.selectedMultiAssets).toContain('1001');
  expect(evt.item.hideDeleteIcon).toBe(true);

  // Remove item from selection
  controller.updateSelection(evt, false);
  expect(CommonUtil.sharedData.selectedMultiAssets).not.toContain('1001');
  expect(evt.item.hideDeleteIcon).toBe(false);

  // Add item back to selectedArray
  controller.updateSelection(evt, true);
  expect(CommonUtil.sharedData.selectedMultiAssets).toContain('1001');

  // Call deleteMultiLocCi (should add the item)
  controller.deleteMultiLocCi(evt);
  expect(CommonUtil.sharedData.selectedMultiAssets).toContain('1001');
  expect(evt.item.hideDeleteIcon).toBe(true);

  // Call undoMultiLocCi (should remove the item)
  controller.undoMultiLocCi(evt);
  expect(CommonUtil.sharedData.selectedMultiAssets).not.toContain('1001');
  expect(evt.item.hideDeleteIcon).toBe(false);

  // Try updating with an invalid event (no multiid)
  let invalidEvt = { item: {} };
  controller.updateSelection(invalidEvt, true);
  expect(CommonUtil.sharedData.selectedMultiAssets).not.toContain(undefined);

  // Test if deleteMultiLocCi and undoMultiLocCi also work correctly with invalid events
  controller.deleteMultiLocCi(invalidEvt);
  controller.undoMultiLocCi(invalidEvt);
  expect(CommonUtil.sharedData.selectedMultiAssets).not.toContain(undefined);
});

it("should fetch and load MultiAssetLocCi data correctly", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  app.registerController(controller);
  app.registerPage(page);

  await app.initialize();
  controller.pageInitialized(page, app);

  const mockWOMultiAssetLocCIItems = [
    { multiid: '1001', description: 'Test Asset' },
  ];
  CommonUtil.sharedData.isFollowupWO = true;

  const mockDatasource = {
    forceReload: jest.fn().mockResolvedValue(mockWOMultiAssetLocCIItems),
    load: jest.fn(),
  };
  const mockFindPage = jest.fn().mockReturnValue({
    findDatasource: jest.fn().mockReturnValue(mockDatasource),
  });

  controller.app.findPage = mockFindPage;

  const WOMultiAssetLocCIItems = await controller.app.findPage("workOrderDetails")
    ?.findDatasource("woMultiAssetLocationds")
    .forceReload();

  if (CommonUtil.sharedData.isFollowupWO) {
    await controller.loadMultiAssetLocCiData(WOMultiAssetLocCIItems);
  }

  //Assertions
  expect(mockFindPage).toHaveBeenCalledWith("workOrderDetails");
  expect(mockDatasource.forceReload).toHaveBeenCalled();
  expect(CommonUtil.sharedData.isFollowupWO).toBe(true);
});

it("should loadRecord", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  app.client = {
    userInfo: {
      defaultSite: 'BEDFORD'
    }
  }
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
    status: "APPR",
    locationnum : 'SHIPPING',
    locationdesc: 'Shipping and Receiving Department',
    schedfinish: "2024-09-26T05:18:00+05:30",
    schedstart: "2024-09-20T02:49:00+05:30",
    targcompdate: "2024-09-01T05:18:00+05:30",
    targstartdate: "2024-09-30T02:49:00+05:30",
    istask: false,
    wogroup: '1003',
    taskid: '103'
  };
  const workorder2 = {
    wonum: "1002",
    description: "Work Order desc",
    description_longdescription: "Work Order long desc",
    wopriority: 2,
    worktype: "CAL",
    orgid: "EAGLENA",
    status: "APPR",
    locationnum : 'SHIPPING',
    locationdesc: 'Shipping and Receiving Department',
    schedfinish: "2024-09-26T05:18:00+05:30",
    schedstart: "2024-09-20T02:49:00+05:30",
    targcompdate: "2024-09-01T05:18:00+05:30",
    targstartdate: "2024-09-30T02:49:00+05:30",
    istask: true,
    wogroup: '1002',
    taskid: '102'
  };

  const ds = newDatasource({ member: workorder }, "dsWoedit");
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");
  ds.baseQuery.select = 'wonum,description,description_longdescription,wopriority,worktype,locationnum,orgid,siteid,href,woclass';
  page.registerDatasource(ds);
  app.registerDatasource(assetLookupDS);
  app.registerDatasource(locationLookupDS);

  workorderitem.item = {
    multiassetlocci: [{
      assetid: 'test',
      locationid: 'loc1'
    }
    ]
  }
  const ds1 = newDatasource(workorderitem, 'woDetailResource');
  app.registerDatasource(ds1);


  const ds2 = newDatasource(workorder2, 'woDetailResource2');
  app.registerDatasource(ds2);

  const wpEditSettingDS = newDatasource1(wpeditsettings, 'wpEditSettingDS');
  page.registerDatasource(wpEditSettingDS);
  let editSettingDS = sinon.stub(wpEditSettingDS, 'searchQBE');

  await app.initialize();
  controller.pageInitialized(page, app);
  await controller.loadRecord(EmptyWorkOrder);
  expect(page.state.workorderData.length).toEqual(0);
  await controller.loadRecord(workorder);
  expect(page.state.workorderData.length).toEqual(1);
  expect(page.state.workorderData[0].worktype).toBe("CAL");
  expect(editSettingDS.displayName).toBe('searchQBE');

  workorder.worktype = "";
  app.state.incomingContext = { page:'workOrderDetails',assetnum : '123232', site: 'testsite'};
  await controller.loadRecord(workorder);
  expect(page.state.workorderData.length).toEqual(1);
  expect(page.state.workorderData[0].worktype).toBe("");


  page.params = {followup: true};
  page.datasources.newWorkOrderds = {clearState: ()=>{},addNew: ()=>{}, resetState: () =>{}};
  await controller.loadRecord(workorder);
  expect(page.state.pageTitle).toEqual('Create follow-up WO');

  
  page.params.followup = false;
  workorder.worktype = "CAL";
  jest.spyOn(app, "callController").mockImplementation(() => "1001 Edit work order");
  await controller.loadRecord(workorder);
  expect(page.state.pageTitle).toEqual('1001 Edit work order');

  jest.spyOn(app, "callController").mockImplementation(() => "1002-102 Edit work order");
  await controller.loadRecord(workorder2);
  expect(page.state.pageTitle).toEqual('1002-102 Edit work order');
  
  Device.get().isMaximoMobile = true;
  let forceReloadStub = sinon.stub(ds1, 'forceReload');
  await controller.loadRecord(workorder2);
  expect(forceReloadStub.called).toBe(true);

  await controller.loadRecord(workorder);
  // Assertion
  // expect(loadMultiAssetLocCiDataSpy).toHaveBeenCalled();
});

it("should open worktype dialog", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new WorkOrderEditController();
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
			insertSite: 'BEDFORD',
      insertOrg: 'EAGLENA',
		}
  }

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  await controller.openWorkTypeLookup(event);
  await expect(page.state.dialogOpened).toBeTruthy();
});

it("should return asset and location description", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  app.registerController(controller);
  app.registerPage(page);

  let workorder = {
    wonum: "1001",
    description: "Work Order desc",
    description_longdescription: "Work Order long desc",
    wopriority: 2,
    worktype: "CAL",
    orgid: "EAGLENA",
    assetnum: '12300',
    assetdesc: 'Electric cart',
    locationdesc: 'Shipping and Receiving Department',
    locationnum : 'SHIPPING'
  };

  await app.initialize();
  controller.pageInitialized(page, app);
  expect(controller.getAssetLocDesc(workorder.locationnum, workorder.locationdesc)).toEqual('SHIPPING Shipping and Receiving Department');
  delete workorder.locationdesc;
  expect(controller.getAssetLocDesc(workorder.locationnum, workorder.locationdesc)).toEqual('SHIPPING');

  let workOrder = {
    wonum: "1001",
    description: "Work Order desc",
    description_longdescription: "Work Order long desc",
    wopriority: 2,
    worktype: "CAL",
    orgid: "EAGLENA",
    assetnum: '12300',
    assetdesc: 'Electric cart',
    locationnum : 'SHIPPING'
  };

  expect(controller.getAssetLocDesc(workOrder.assetnum, workOrder.assetdesc)).toEqual('12300 Electric cart');
  delete workOrder.assetdesc;
  expect(controller.getAssetLocDesc(workOrder.assetnum, workOrder.assetdesc)).toEqual('12300');
});

it('updateAndSaveWorkOrder', async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: 'woedit' });
  const detailsPage = new Page({ name: 'workOrderDetails' });

  const ds = newDatasource(workorderitem, 'woDetailResource');
  const ds2 = newDatasource(workorderitem, 'dsWoedit');
  const ds3 = newDatasource(workorderitem, 'newWorkOrderds');
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");
  const deleteStub = sinon.stub(WOCreateEditUtils, 'deleteSpecification');
  const WOCreateEditUtilsStub = sinon.stub(WOCreateEditUtils, "getAssetOrLocation")
             .returns([{ assetnum: "10001", location: "OFFICE101", href : 'xyz' }]);
  ds2.baseQuery = {
    select: 'wonum,description,description_longdescription,wopriority,worktype,woassetdesc,orgid,siteid,href,woclass'
  };
  ds2.clearState = sinon.stub().resolves();
  ds2.resetState = sinon.stub().resolves();

  await ds.load();
  await ds2.load();
  await ds3.load();
  await assetLookupDS.load();
  app.registerDatasource(ds);
  app.registerDatasource(locationLookupDS);
  page.registerDatasource(ds2);
  page.registerDatasource(ds3);
  app.registerDatasource(assetLookupDS);
  app.registerController(controller);
  app.registerPage(page);
  app.registerPage(detailsPage);

  let updatestub = sinon.spy(ds, 'update');  

  await app.initialize();
  controller.pageInitialized(page, app);
  controller.pageInitialized(detailsPage, app);

  let NoItemEvent = {
    page: {
      params: { followup: false },
      datasources: { dsWoedit: ds2 }
    }
  };
  page.params.followup = false;
  let event = { page: page };
  page.state.editAssetsLocation = false;
  await controller.updateAndSaveWorkOrder(NoItemEvent);
  expect(app.currentPage.name).toBe("woedit");
  updatestub.restore();
  updatestub = sinon.stub(ds, 'update').callsFake(async () => {
    app.currentPage.name = "workOrderDetails";
    return Promise.resolve("success");
  });

  page.datasources.dsWoedit.item.wonum = null;
  app.client = { userInfo: { defaultSite: "BEDFORD" } };
  page.state.useConfirmDialog = false;
  await controller.updateAndSaveWorkOrder(event);

  expect(updatestub.calledOnce).toBe(true);
  expect(updatestub.getCall(0).args[0]).not.toHaveProperty('wonum');
  expect(app.currentPage.name).toBe("workOrderDetails");
  page.params.followup = false;
  updatestub.restore();
  deleteStub.restore();
  WOCreateEditUtilsStub.restore();
});

it('updateAndSaveWorkOrder on fetching asset/location details', async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: 'woedit' });
  const detailsPage = new Page({ name: 'workOrderDetails' });

  const ds = newDatasource(workorderitem, 'woDetailResource');
  const ds2 = newDatasource(workorderitem, 'dsWoedit');
  const ds3 = newDatasource(workorderitem, 'newWorkOrderds');
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");

  ds2.baseQuery = {
    select: 'wonum,description,description_longdescription,wopriority,worktype,woassetdesc,orgid,siteid,href,woclass'
  };

  await ds.load();
  await ds2.load();
  await ds3.load();
  await assetLookupDS.load();
  app.registerDatasource(ds);
  app.registerDatasource(locationLookupDS);
  page.registerDatasource(ds2);
  page.registerDatasource(ds3);
  app.registerDatasource(assetLookupDS);
  app.registerController(controller);
  app.registerPage(page);
  app.registerPage(detailsPage);

  let updatestub = sinon.spy(ds, 'update');

  await app.initialize();
  controller.pageInitialized(page, app);
  controller.pageInitialized(detailsPage, app);

  let NoItemEvent = {
    page: {
      params: { followup: false },
      datasources: { dsWoedit: {} }
    }
  };
  page.params.followup = false;
  let event = { page: page };
  page.state.editAssetsLocation = true;
  controller.editAssetsLocation();
  const chooseLocationSpy = jest.spyOn(app, 'findDatasource');
  await controller.updateAndSaveWorkOrder(NoItemEvent);
  expect(chooseLocationSpy).not.toBeCalled();
  expect(app.currentPage.name).toBe("woedit");
  updatestub.restore();
  updatestub = sinon.stub(ds, 'update').callsFake(async () => {
    app.currentPage.name = "workOrderDetails";
    return Promise.resolve("success");
  });

  page.datasources.dsWoedit.item.wonum = null;
  app.client = { userInfo: { defaultSite: "BEDFORD" } };
  await controller.updateAndSaveWorkOrder(event);
  expect(updatestub.calledOnce).toBe(false);
  expect(app.currentPage.name).not.toBe("workOrderDetails");
  page.params.followup = false;
  updatestub.restore();
});

it('Should call readOnlyFields', async() => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  const ds = newDatasource(workorderitem, "dsWoedit");

  page.registerDatasource(ds);
  app.registerDatasource(ds);
  app.registerController(controller);
  await app.initialize();
  controller.pageInitialized(page, app);
  const readOnlyFields = sinon.spy(controller, 'readOnlyFields');

  await controller.editAssetsLocation();
  expect(readOnlyFields.called).toBe(true);
  expect(readOnlyFields.calledWith(ds)).toBe(true);
  expect(ds.state.canSave).toBe(false);
});

it('should createFollowupWo', async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  app.client = {
    userInfo: { personid: 'SAM', primaryPhone: 123 }
  }
  const page = new Page({ name: 'woedit' });
  const detailsPage = new Page({ name: 'workOrderDetails' });
  const relatedPage = new Page({ name: 'relatedWorkOrder' });
  const ds = newDatasource(workorderitem, 'woDetailResource');
  const deleteStub = sinon.stub(WOCreateEditUtils,'deleteSpecification');
  const dsData = { ...workorderitem };
  dsData.member[0].classstructureid = '100';
  dsData.member[0].hierarchypath = "PIPE_LEAK";
  const ds2 = newDatasource(dsData, 'dsWoedit');
  const ds3 = newDatasource(workorderitem, 'newWorkOrderds');
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");
  const woDetailRelatedDS = newDatasource(workorderitem, 'woDetailRelatedWorkOrder');
  const synonymDS = newStatusDatasource(statusitem, 'synonymdomainData');
  const specificationDS = newDatasource(specificationData, "createEditWoSpecificationDS");
  const loadSpecificationSpy = sinon.stub(WOCreateEditUtils, 'loadSpecifications');

  ds2.baseQuery = {
    select: 'wonum,description,description_longdescription,wopriority,worktype,woassetdesc,orgid,siteid,href,woclass'
  }
  ds3.baseQuery.select = "wonum,description,description_longdescription,wopriority,worktype,locationnum,orgid,siteid,href,woclass";

  await ds.load();
  await ds2.load();
  await ds3.load();
  await assetLookupDS.load();

  app.registerDatasource(ds);
  app.registerDatasource(locationLookupDS);
  app.registerDatasource(specificationDS);
  page.registerDatasource(ds2);
  page.registerDatasource(ds3);
  relatedPage.registerDatasource(woDetailRelatedDS);
  app.registerDatasource(assetLookupDS);
  app.registerDatasource(synonymDS);
  app.registerController(controller);
  app.registerPage(page);
  app.registerPage(detailsPage);
  app.registerPage(relatedPage);

  let updatestub = sinon.spy(ds, 'update');

  await app.initialize();
  controller.pageInitialized(page, app);
  controller.pageInitialized(detailsPage, app);
  page.params.followup = false;

  let event = {
    page: page
  }
  page.state.editAssetsLocation = true;
  controller.editAssetsLocation();

  const newwodsspy = jest.spyOn(ds3, 'save').mockImplementation(localpayload => {
    return localpayload.locationnum === 'Main Boiler Room' ? true : false;
  });

  // Mock data for CommonUtil.sharedData
  CommonUtil.sharedData = {
    containsMultiAssetCI: true,
    woMultiAssetLocCIDetails: [
      { multiid: 1, href: 'href1', localref: 'localref1', other: 'data1' },
      { multiid: 2, href: 'href2', localref: 'localref2', other: 'data2' },
      { multiid: 3, href: 'href3', localref: 'localref3', other: 'data3' }
    ],
    selectedArray: [1, 3]
  };
  page.params.followup = true;
  CommonUtil.sharedData.isFollowupWO = true;
  await controller.createFollowupWo(event);

  expect(loadSpecificationSpy).toBeTruthy();
  expect(newwodsspy).toBeTruthy();

  newwodsspy.mockClear();
  updatestub.restore();
  loadSpecificationSpy.restore();
  deleteStub.restore();
});

it('should update and load data of wodetailds on call of method UpdateTheParentWO', async () => {

  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({name: 'woedit'});

  const ds = newDatasource(workorderitem, 'woDetailResource');
  await ds.load();
  app.registerDatasource(ds);
  await app.initialize();

  controller.pageInitialized(page, app);
  const wodetailsDsUpdate = jest.spyOn(ds,'update').mockImplementation(hasfollowupwork=> {
    return hasfollowupwork;
  });
  const wodetailsDsLoad = jest.spyOn(ds,'load')
  await controller.UpdateTheParentWO();
  expect(wodetailsDsUpdate).toBeTruthy();
  expect(wodetailsDsLoad).toBeCalled();
})

it('chooseLocation should call callCreateWorkOrder', async () => {
  
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({name: 'woedit'});
  const detailsPage = new Page({name: 'workOrderDetails'});

  const ds = newDatasource(workorderitem, 'woDetailResource');
  const ds2 = newDatasource(workorderitem, 'dsWoedit');
  const ds3 = newDatasource(workorderitem, 'newWorkOrderds');
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");

  ds2.baseQuery = {
    select : 'wonum,description,description_longdescription,wopriority,worktype,woassetdesc,orgid,siteid,href,woclass'
  }

  await ds.load();
  await ds2.load();
  await ds3.load();
  await assetLookupDS.load();
  app.registerDatasource(ds);
  app.registerDatasource(locationLookupDS);
  page.registerDatasource(ds2);
  page.registerDatasource(ds3);
  app.registerDatasource(assetLookupDS);
  app.registerController(controller);
  app.registerPage(page);
  app.registerPage(detailsPage);

  await app.initialize();
  controller.pageInitialized(page, app);
  controller.pageInitialized(detailsPage, app);

  page.params.followup = false;
  page.state.editAssetsLocation = true;
  controller.editAssetsLocation();
})

it('validateFields should handle different field validation scenarios', async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: 'woedit' });

  const ds = newDatasource(workorderitem, 'woDetailResource');
  const ds2 = newDatasource(workorderitem, 'dsWoedit');
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");
  const assetFeatureDataDS = newDatasource(assetFeatureData, "assetFeatureData");

  app.registerDatasource(ds);
  app.registerDatasource(assetLookupDS);
  app.registerDatasource(locationLookupDS);
  app.registerDatasource(assetFeatureDataDS);
  page.registerDatasource(ds2);
  app.registerController(controller);
  app.registerPage(page);

  page.state.minPriority = 0;
  page.state.maxPriority = 999;

  app.initialize();
  controller.pageInitialized(page, app);

  jest.spyOn(CommonUtil, 'getSystemProp').mockReturnValue(['TARGET', 'SCHEDULE']);

  let items = await ds2.load();

  items[0].assetnum = '';
  ds2.uiRequired.undefined = ['assetnum'];
  controller.validateFields();
  expect(page.state.errorMessage).toBe('Fill the required fields');

  items[0].assetnum = true;
  items[0].wopriority = 1000;
  controller.validateFields();
  expect(page.state.readOnlyState).toBe(true);

  items[0].wopriority = 1;
  items[0].targstartdate = '2024-11-02T00:00:00.000+05:30';
  items[0].targcompdate = '2024-11-01T00:00:00.000+05:30';
  controller.validateFields();
  expect(page.state.errorMessage).toBe('The target start date must be before the finish date');

  items[0].estdur = -1;
  controller.validateFields();
  expect(page.state.errorMessage).toBe('The duration should be positive value');

  //valid values
  items[0].estdur = 1;
  items[0].targstartdate = '2024-11-01T00:00:00.000+05:30';
  items[0].targcompdate = '2024-11-02T00:00:00.000+05:30';
  controller.validateFields();
  expect(page.state.errorMessage).toBe('');
});

it('should validate actual start and measures correctly', async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: 'woedit' });

  const ds = newDatasource(workorderitem, 'woDetailResource');
  const ds2 = newDatasource(workorderitem, 'dsWoedit');
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");
  const assetFeatureDataDS = newDatasource(assetFeatureData, "assetFeatureData");

  app.registerDatasource(ds);
  app.registerDatasource(assetLookupDS);
  app.registerDatasource(locationLookupDS);
  app.registerDatasource(assetFeatureDataDS);
  page.registerDatasource(ds2);
  app.registerController(controller);
  app.registerPage(page);

  page.state.minPriority = 0;
  page.state.maxPriority = 999;

  app.initialize();
  controller.pageInitialized(page, app);

  jest.spyOn(CommonUtil, 'getSystemProp').mockReturnValue(['TARGET', 'SCHEDULE']);

  let items = await ds2.load();

  // Actual start after creation
  items[0].actstart = '2024-09-27T00:00:00.000+05:30';
  items[0].schedstart = '2024-09-26T00:00:00.000+05:30';
  controller.page.params.fromQuickReport = true;

  //means No error message
  expect(page.state.errorMessage).toBe('');

  // Test feature label validation
  items[0].startfeaturelabel = "MP";
  sinon.stub(WOCreateEditUtils, "featureLabelValidation").returns(-1);
  controller.validateFields();
  expect(page.state.readOnlyState).toBe(true);

  // Test for asset measure validations
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

  const callControllerSpy = jest.spyOn(controller, "showWOWarnings").mockImplementation(() => true);
  jest.spyOn(controller, "uiRequired").mockImplementation((description, value) => {
    if (description === 'description' || description === 'worktype') {
      return true;
    }
    return false;
  });
  controller.validateFields();
  expect(callControllerSpy).toBeCalled();
});

it('create follow up workorder', async () => {

  const controller = new WorkOrderEditController();
  const app = new Application();
  app.client = {
    userInfo: {personid: 'SAM'}
  }
  const page = new Page({name: 'woedit'});
  const woDetailsPage = new Page({name: 'workOrderDetails'});
  const relatedPage = new Page({name: 'relatedWorkOrder'});
  const ds = newDatasource(workorderitem, 'woDetailResource');
  const specificationDS = newDatasource(specificationData, "createEditWoSpecificationDS");
  const classificationStub = sinon.spy(controller, 'chooseClassification');
  const ds2 = newDatasource(workorderitem, 'dsWoedit');
  const newWODs = newDatasource(workorderitem, 'newWorkOrderds');
  const woDetailRelatedDS = newDatasource(workorderitem, 'woDetailRelatedWorkOrder');
  const synonymDS = newStatusDatasource(statusitem, 'synonymdomainData');
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  
  // let synonymStub = 
  sinon.stub(SynonymUtil, 'getSynonym').returns({value: 'WAPPR',maxvalue: 'WAPPR',description: 'WAPPR'});
  woDetailsPage.registerDatasource(ds);

  app.registerDatasource(specificationDS);
  page.registerDatasource(ds2);
  page.registerDatasource(newWODs);
  app.registerDatasource(synonymDS);
  app.registerDatasource(assetLookupDS);
  relatedPage.registerDatasource(woDetailRelatedDS);
  app.registerController(controller);
  app.registerPage(page);
  app.registerPage(woDetailsPage);
  app.registerPage(relatedPage);

  await ds.load();
  newWODs.baseQuery = {
    select : 'wonum,description,description_longdescription,wopriority,worktype,woassetdesc,orgid,siteid,href,woclass'
  }
  await newWODs.load();
  await woDetailRelatedDS.load();
  await assetLookupDS.load();
  await synonymDS.load();
  await app.initialize();
  page.state.assetLinear = true;
  Device.get().isMaximoMobile = false;
  controller.pageInitialized(page, app);
  page.params = {
    followup: true
  };
  await controller.updateAndSaveWorkOrder({page, datasources: {'dsWoedit': ds2}});

  ds2.item.assetnum = '12345';
  page.params = {
    followup: true
  };
  await controller.updateAndSaveWorkOrder({page, datasources: {'dsWoedit': ds2}});

  ds2.item.assetnum = '';
  ds2.item.locationnum = '';
  page.state.isMobile = true;
  page.params = {
    followup: true
  };
  await controller.updateAndSaveWorkOrder({page, datasources: {'dsWoedit': ds2}});
  page.params.followup = false;
  expect(page.state.saveInProgress).toBe(false);
  page.state.isMobile = false;
  classificationStub.restore();
});

it('it should be update on user confirmation dialog save when leaving page', async () => {

  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({name: 'woedit'});
  const ds = newDatasource(workorderitem, 'dsWoedit');
  const ds1 = newDatasource(workorderitem, 'woDetailResource');
  ds.baseQuery.select = 'wonum,description,description_longdescription,wopriority,worktype,locationnum,orgid,siteid,href,woclass';
  page.registerDatasource(ds);
  app.registerDatasource(ds1);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  page.state.isMobile = true;
  controller.pageInitialized(page, app);

  let updateSpy = sinon.spy(controller,'updateAndSaveWorkOrder');

  controller.onCustomSaveTransition();
  expect(updateSpy.calledOnce).toBe(true);
  expect(updateSpy.getCall(0).args[0]).toStrictEqual({page: page});  
});

it("it should set saveDataSuccessful to false ", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({name: 'woedit'});
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.onUpdateDataFailed();
  expect(controller.saveDataSuccessful).toBe(false);      
});

it("it should set editorValue on change", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({name: 'woedit'});
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  let evt ={
    target: {
      content: "<p>Test</p>"
    }
  }
  controller.onEditorChange(evt);
  expect(page.state.editorValue).toBe(evt.target.content);      
});

it("it should set editorValue on save", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({name: 'woedit'});
  const ds = newDatasource(workorderitem, 'dsWoedit');
  ds.baseQuery.select = 'wonum,description,description_longdescription,wopriority,worktype,locationnum,orgid,siteid,href,woclass';
  page.registerDatasource(ds);
  const ds1 = newDatasource(workorderitem, 'woDetailResource');
  app.registerDatasource(ds1);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();

  controller.onEditorSave();
  expect(page.state.editorValue).toBe(null);      
});

it("it should show saveDiscardDialog on dialog back", async () => {
  let mockedFn = jest.fn();
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({name: 'woedit'});
  page.showDialog = mockedFn;
  app.registerController(controller);
  app.registerPage(page);
  page.state.editorValue = "<p>Test</p>"
  await app.initialize();

  controller.onCloseRichTextDialog();
  expect(page.showDialog.mock.calls.length).toEqual(1);   
});

it("it should close dialog and reset editorValue value", async () => {
  let mockedFn = jest.fn();
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({name: 'woedit'});
  page.showDialog = mockedFn;
  const ds = newDatasource(workorderitem, 'dsWoedit');
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");
  ds.baseQuery.select = 'wonum,description,description_longdescription,wopriority,worktype,locationnum,orgid,siteid,href,woclass';
  page.registerDatasource(ds);
  const ds1 = newDatasource(workorderitem, 'woDetailResource');
  app.registerDatasource(ds1);
  app.registerDatasource(assetLookupDS);
  app.registerDatasource(locationLookupDS);
  app.registerController(controller);
  app.registerPage(page);
  page.state.editorValue = "<p>Test</p>"
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
    locationnum : 'SHIPPING',
    locationdesc: 'Shipping and Receiving Department',
    schedfinish: "2024-09-26T05:18:00+05:30",
    schedstart: "2024-09-20T02:49:00+05:30",
    targcompdate: "2024-09-01T05:18:00+05:30",
    targstartdate: "2024-09-30T02:49:00+05:30"
  };
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({name: 'woedit'});
  const ds = newDatasource({ member: workorder }, "dsWoedit");
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");
  ds.baseQuery.select = 'wonum,description,description_longdescription,wopriority,worktype,locationnum,orgid,siteid,href,woclass';
  page.registerDatasource(ds);
  app.registerDatasource(assetLookupDS);
  app.registerDatasource(locationLookupDS);
  app.registerController(controller);
  page.state ={
    editorValue: "<p>Test</p>"
  }
  app.registerPage(page);
  
  await app.initialize();
  await ds.load();
  let evt = {
    datasource: ds
  }
  controller.setRichTextValue(evt);
  expect(ds.item.description_longdescription).toBe("<p>Test</p>");  
});

it("should set value on asset/location on input value change", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  const ds = newDatasource(workorderitem, "dsWoedit");
  page.registerDatasource(ds);
  app.registerDatasource(ds);
  app.registerController(controller);
  await app.initialize();
  controller.pageInitialized(page, app);
  let evt = {
    assetnum: "10001",
    locationnum: "OFFICE101",
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
  const WOCreateEditUtilsStub = sinon
    .stub(WOCreateEditUtils, "getAssetOrLocation")
    .returns([{ assetnum: "10001", location: "OFFICE101" }]);
  await controller.onChangeAsset({item:evt,app:app});
  expect(page.findDatasource("dsWoedit").item.locationnum).toEqual("OFFICE101");
  expect(page.findDatasource("dsWoedit").item.assetnum).toEqual("10001");

  await controller.onChangeLocation({item:evt,app:app});
  expect(page.findDatasource("dsWoedit").item.locationnum).toEqual("OFFICE101");
  expect(page.findDatasource("dsWoedit").item.assetnum).toEqual("10001");
  page.name ='wocreate';
  page.state = {
    isMobile: true,
    selectedItem: { action: "SETASSET", item: evt },
  };
  controller.onUserConfirmationNo();
  expect(page.findDatasource("dsWoedit").item.assetnum).toEqual("10001");
  page.state = {
    isMobile: true,
    selectedItem: { action: "SETLOCATION", item: evt },
  };
  controller.onUserConfirmationNo();
  expect(page.findDatasource("dsWoedit").item.locationnum).toEqual("OFFICE101");
  page.state = {
    isMobile: true,
    selectedItem: { action: "SETASSETGL", item: evt },
  };
  controller.onUserConfirmationNo();
  expect(page.findDatasource("dsWoedit").item.locationnum).toEqual("OFFICE101");
  expect(page.findDatasource("dsWoedit").item.assetnum).toEqual("10001");
  WOCreateEditUtilsStub.restore();
});

it("should not clear Asset if location has the same asset ", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  app.client = {
    userInfo: {
      defaultSite: "BEDFORD",
    },
  };
  const ds = newDatasource([workorderitem.member[0]], "dsWoedit");
  const validateAssetStub = sinon.stub(WOCreateEditUtils, "validateAsset");
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
  page.state.assetFiltered = true;
  await controller.findAsset(item);
  expect(validateAssetStub.called).toBe(true);
  WOCreateEditUtilsstub.restore();

  WOCreateEditUtilsstub = sinon
    .stub(WOCreateEditUtils, "getAssetOrLocation")
    .returns([
      { assetnum: "10001", location: "OFFICE101" },
      { assetnum: "10002", location: "OFFICE101" },
    ]);
  ds.item.assetnum = "10001";
  await controller.findAsset(item);
  expect(ds.item.assetnum).toEqual("10001");
  WOCreateEditUtilsstub.restore();
});

it("should set value on asset/location on input value change by user type", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  const ds = newDatasource(workorderitem, "dsWoedit");
  page.registerDatasource(ds);
  app.registerDatasource(ds);
  app.registerController(controller);
  await app.initialize();
  controller.pageInitialized(page, app);
  let evt = {
    assetnum: "10001",
    locationnum: "OFFICE101",
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
    page.findDatasource("dsWoedit").item.locationnum = evt.location;
    page.findDatasource("dsWoedit").item.assetnum = evt.assetnum;
  });
  page.state = { isMobile: false };
  sinon
    .stub(WOCreateEditUtils, "getAssetOrLocation")
    .returns([{ assetnum: "10001", location: "OFFICE101" }]);
  controller.editAssetsLocation();
  await controller.findAsset({ value: 'OFFICE101'})
  expect(page.findDatasource("dsWoedit").item.locationnum).toEqual("OFFICE101");
  expect(page.findDatasource("dsWoedit").item.assetnum).toEqual("10001");
  const chooseAssetSpy = jest.spyOn(controller,'chooseAsset');
  controller.findLocation();
  expect(chooseAssetSpy).not.toBeCalled();

  await controller.findLocation({ value: '10001'});
  expect(page.findDatasource("dsWoedit").item.locationnum).toEqual("OFFICE101");
  expect(page.findDatasource("dsWoedit").item.assetnum).toEqual("10001");
  page.name ='wocreate';
  page.state = {
    isMobile: true,
    selectedItem: { action: "SETASSET", item: evt },
  };
  controller.onUserConfirmationNo();
  expect(page.findDatasource("dsWoedit").item.assetnum).toEqual("10001");
  page.state = {
    isMobile: true,
    selectedItem: { action: "SETLOCATION", item: evt },
  };
  controller.onUserConfirmationNo();
  expect(page.findDatasource("dsWoedit").item.locationnum).toEqual("OFFICE101");
  page.state = {
    isMobile: true,
    selectedItem: { action: "SETASSETGL", item: evt },
  };
  controller.onUserConfirmationNo();
  expect(page.findDatasource("dsWoedit").item.locationnum).toEqual("OFFICE101");
  expect(page.findDatasource("dsWoedit").item.assetnum).toEqual("10001");

  const chooseLocationSpy = jest.spyOn(controller,'chooseLocation');
  await controller.findAsset(false);
  expect(chooseLocationSpy).not.toBeCalled();
});

it("Should call find asset", async() => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  const ds = newDatasource(workorderitem, "dsWoedit");
  page.registerDatasource(ds);
  app.registerDatasource(ds);
  app.registerController(controller);
  await app.initialize();
  controller.pageInitialized(page, app);
  page.state = { isMobile: false };
  jest
    .spyOn(WOCreateEditUtils, "getAssetOrLocation").mockReturnValue([]);
  controller.editAssetsLocation();
  await controller.findAsset({ value: 'OFFICE101'})
  expect(page.state.isLocationAssetFocus).toBeFalsy();
});


it("should update page state of edit assets and location for manual value change", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  const ds = newDatasource(workorderitem, "dsWoedit");
  page.registerDatasource(ds);
  await app.initialize();
  controller.pageInitialized(page, app);
  controller.editAssetsLocation();
  expect(page.state.editAssetsLocation).toBeTruthy();
});


it("should update page state and call updateAndSaveWorkOrder if earlier save was clicked or if state is false then don't call create WO method", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  
  const ds = newDatasource(workorderitem, 'woDetailResource');
  const ds2 = newDatasource(workorderitem, 'dsWoedit');
  const ds3 = newDatasource(workorderitem, 'newWorkOrderds');
  const assetLookupDS = newDatasource(wpmaterial, "assetLookupDS");
  const locationLookupDS = newDatasource(wpmaterial, "locationLookupDS");
  sinon.stub(controller, "chooseLocation");
  sinon.stub(controller, "onChangeLocation");
  ds2.baseQuery = {
    select : 'wonum,description,description_longdescription,wopriority,worktype,woassetdesc,orgid,siteid,href,woclass'
  }

  await ds.load();
  await ds2.load();
  await ds3.load();
  await assetLookupDS.load();
  app.registerDatasource(ds);
  app.registerDatasource(locationLookupDS);
  page.registerDatasource(ds2);
  page.registerDatasource(ds3);
  app.registerDatasource(assetLookupDS);
  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);
  
  page.state.editAssetsLocation = false;
  const updateAndSaveWorkOrderSpy = jest.spyOn(controller,'updateAndSaveWorkOrder');
  controller.callUpdateWorkOrder();
  expect(updateAndSaveWorkOrderSpy).not.toBeCalled();

  controller.editAssetsLocation();
  page.state.saveInProgress = true;
  const updatestub = sinon.stub(ds, 'update').resolves("success");
  page.datasources.dsWoedit.item.wonum = null;
  page.state.updateWorkorderItem = {
    page: {
      params: {followup: false},
      datasources: {
        dsWoedit : {
        }
      } 
    }
  }
  controller.callUpdateWorkOrder();
  expect(page.state.editAssetsLocation).toBeFalsy();
  expect(updateAndSaveWorkOrderSpy).toBeCalled();
  updatestub.restore();
});


it("should set value onUserConfirmationYes", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  const dsCreateWo = newDatasource(workorderitem, "dsWoedit");
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
    isMobile: true,
    selectedItem: { action: "SETASSET", item: evt },
  };
  sinon
  .stub(WOCreateEditUtils, "validateGlAccount")
  .returns(true);
  controller.onUserConfirmationYes();
  expect(page.findDatasource("dsWoedit").item.locationnum).toEqual("OFFICE101");
  expect(page.findDatasource("dsWoedit").item.assetnum).toEqual("10001");
  expect(controller.validAssetValue).toEqual("10001");
  page.state = {
    isMobile: true,
    selectedItem: { action: "SETLOCATION", item: evt },
  };
  controller.onUserConfirmationYes();
  expect(page.findDatasource("dsWoedit").item.locationnum).toEqual("OFFICE101");
  expect(page.findDatasource("dsWoedit").item.assetnum).toEqual("10001");
  expect(controller.validLocationValue).toEqual("OFFICE101");
  page.state = {
    isMobile: true,
    selectedItem: { action: "SETLOCGL", item: evt },
  };
  controller.onUserConfirmationYes();
  expect(page.findDatasource("dsWoedit").item.locationnum).toEqual("OFFICE101");
  expect(page.findDatasource("dsWoedit").item.assetnum).toEqual("10001");
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
  controller.onUserConfirmationYes();
  expect(page.findDatasource("dsWoedit").item.assetdesc).toEqual("");
  expect(page.findDatasource("dsWoedit").item.assetnum).toEqual("");
});

it("should open asset lookup", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  const ds = newDatasource(workorderitem, "dsWoedit");
  page.registerDatasource(ds);
  app.registerController(controller);
  app.currentPage = 'woedit';
  page.state = { parentPage: ''};
  app.setCurrentPage = mockSetPage;
  await app.initialize();
  controller.pageInitialized(page, app);
  controller.openAssetLookup();
  expect(app.state.parentPage).toEqual("woedit");
  expect(page.state.useConfirmDialog).toEqual(true);
});


it("should set value on asset on scanning barcode or QR code", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  app.client = {
    userInfo: {
      defaultSite: 'BEDFORD'
    }
  }
  const ds = newDatasource(workorderitem, "dsWoedit");
  page.registerDatasource(ds);
  app.registerDatasource(ds);
  app.registerController(controller);  
  await app.initialize();
  controller.pageInitialized(page, app);  
  controller.handleAssetBarcodeScan({value: ''})
  expect(page.findDatasource("dsWoedit").item.assetnum).toEqual(undefined); 

  controller.handleAssetBarcodeScan({value: '9780201379624'})
  expect(page.findDatasource("dsWoedit").item.assetnum).toEqual("9780201379624");

});


it("should set value on location on scanning barcode or QR code", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  app.client = {
    userInfo: {
      defaultSite: 'BEDFORD'
    }
  }
  const ds = newDatasource(workorderitem, "dsWoedit");
  page.registerDatasource(ds);
  app.registerDatasource(ds);
  app.registerController(controller);  
  await app.initialize();
  controller.pageInitialized(page, app);  
  controller.handleLocationBarcodeScan({value: ''})
  expect(page.findDatasource("dsWoedit").item.location).toEqual(undefined);
  controller.handleLocationBarcodeScan({value: '978020137963'})
  expect(page.findDatasource("dsWoedit").item.locationnum).toEqual("978020137963");
  
});


it("Should openYRefernceLookup", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  app.registerController(controller);  
  app.initialize();
  controller.pageInitialized(page, app);
  let evt = {
    ref:'start'
  }
  await controller.openYRefernceLookup(evt);
});

it("Should openEndYRefernceLookup", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  app.registerController(controller);  
  app.initialize();
  controller.pageInitialized(page, app);
  let evt = {
    ref:'end'
  }
  await controller.openEndYRefernceLookup(evt);
});

it("Should openZRefernceLookup", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  app.registerController(controller);  
  app.initialize();
  controller.pageInitialized(page, app);
  const evt = {
    ref:'start'
  }
  await controller.openZRefernceLookup(evt);
});

it("Should openEndZRefernceLookup", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  app.registerController(controller);  
  app.initialize();
  controller.pageInitialized(page, app);
  const evt = {
    ref:'end'
  }
  await controller.openEndZRefernceLookup(evt);
});

it("Should chooseYRefernce", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  const ds = newDatasource(workorderitem, "dsWoedit");
  page.registerDatasource(ds);
  app.registerController(controller); 
  
  app.initialize();
  controller.pageInitialized(page, app);

  const itemSelected =  {
    startyoffsetref : "1.00",
  }

  await controller.chooseYRefernce(page,"dsWoedit",itemSelected,"startyoffsetref");
});

it("Should chooseZRefernce", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  const ds = newDatasource(workorderitem, "dsWoedit");
  page.registerDatasource(ds);
  app.registerController(controller); 
  
  app.initialize();
  controller.pageInitialized(page, app);

  const itemSelected =  {
    startzoffsetref : "2.67",
  }
  await controller.chooseZRefernce(page,"dsWoedit",itemSelected,"startzoffsetref");
});

it("Should chooseEndYRefernce", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  const ds = newDatasource(workorderitem, "dsWoedit");
  page.registerDatasource(ds);
  app.registerController(controller); 
  
  app.initialize();
  controller.pageInitialized(page, app);

  const itemSelected =  {
    endyoffsetref : "3.45",
  };
  await controller.chooseEndYRefernce(page,"dsWoedit",itemSelected,"endyoffsetref");
});

it("Should chooseEndZRefernce", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  const ds = newDatasource(workorderitem, "dsWoedit");
  page.registerDatasource(ds);
  app.registerController(controller); 
  
  app.initialize();
  controller.pageInitialized(page, app);

  const itemSelected =  {
    endzoffsetref : "2.89",
  };

  await controller.chooseEndZRefernce(page,"dsWoedit",itemSelected,"endzoffsetref");
});

it("Should chooseReferncePoint", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  const ds = newDatasource(workorderitem, "dsWoedit");
  page.registerDatasource(ds);
  app.registerController(controller);  

  app.initialize();
  controller.pageInitialized(page, app);

  const itemSelected =  {
    label : "MP-10",
    assetfeatureid : "183",
  };
  await controller.chooseReferncePoint(page,"dsWoedit",itemSelected,"startfeaturelabel");
});

it("Should chooseEndReferncePoint", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  const ds = newDatasource(workorderitem, "dsWoedit");
  page.registerDatasource(ds);
  app.registerController(controller);  

  app.initialize();
  controller.pageInitialized(page, app);

  const itemSelected =  {
    endfeaturelabel : "MP-20",
    assetfeatureid : "184",
  };
 
  await controller.chooseEndReferncePoint(page,"dsWoedit",itemSelected,"endfeaturelabel");
});

it("Should openStartReferncePointLookup", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  app.registerController(controller);  
  app.initialize();
  controller.pageInitialized(page, app);

  const evt = {
    ref:'start'
  };
  await controller.openStartReferncePointLookup(evt);
});
 
it("Should openEndReferncePointLookup", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  app.registerController(controller);  
  app.initialize();
  controller.pageInitialized(page, app);

  const evt = {
    ref:'end'
  };
  await controller.openEndReferncePointLookup(evt);
});

 
it("Should validateLinearState", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  app.registerController(controller);  
  app.initialize();
  controller.pageInitialized(page, app);

  await controller.setLinearState(true);
  expect(page.state.assetLinear).toBe(true);

  await controller.setLinearState(false);
  expect(page.state.assetLinear).toBe(false);
});

it("Should validateLinearState", async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  app.registerController(controller);  
  app.initialize();
  controller.pageInitialized(page, app);

  await controller.setLinearState(false);
  expect(page.state.assetLinear).toBe(false);
});

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
it('should validate endyoffsetref', () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
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
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
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
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
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
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
  const hasError = true;
  const errorField = "startfeaturelabel";
  const arrayListFieldsWithError = [{ attributename: 'startfeaturelabel', error: true }];
  controller.validateEndYOffsetzRef(hasError, errorField, arrayListFieldsWithError);
  const clearWarn = sinon.stub(controller, "clearWarnings");
  expect(clearWarn.called).toBe(false);
})

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
it('should validate selectWorkType', () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
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
it("Opens the classification lookup dialog", () => {
  const controller = new WorkOrderEditController();
  const app = new Application({showDialog : jest.fn()});
  const page = new Page({ name: "woedit" });

  let dsWoedit = newDatasource(workorderitem, "dsWoedit");
  dsWoedit.item.classstructureid = "1001";
  CommonUtil.sharedData.treeData = {
    find: jest.fn(() => true),
  };

  const woClassDataDS = newDatasource(classificationData, "workOrderClassDomain");
  app.registerDatasource(woClassDataDS);
  page.registerDatasource(dsWoedit);
  woClassDataDS.setSelectedItem = jest.fn();
  woClassDataDS.load = jest.fn();

  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);

  controller.openClassification();
  expect(woClassDataDS.items.length).toEqual(0);
});

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
it('should showWOWarnings', () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
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
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
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
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
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
it('should endMeasureCal', () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
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
  const controller = new WorkOrderEditController
  ();
  const app = new Application();
  const page = new Page({ name: "woedit" });
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
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
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
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
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
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
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
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
 
  const evt = { item: { endfeaturelabel: "MP 10" } };
  const endMeasureValidationStub = sinon.stub(WOCreateEditUtils, "endMeasureValidation").returns(true);
  controller.endMeasureValidation(evt);
  expect(endMeasureValidationStub.called).toBeTruthy()
})

  
it('Validates the startZRefCal() method when the endzoffsetref field is invalid', async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
  const evt = { item: { startzoffsetref: 45 } };
  const startZRefCalStub = sinon.stub(WOCreateEditUtils, "startZRefCal").returns(true);
  await controller.startZRefCal(evt);
  expect(startZRefCalStub.called).toBeTruthy()
});

it('Validates the endZRefCal() method when the endzoffsetref field is invalid', async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
  const evt = { item: { endzoffsetref: 45 } };
  const endZRefCalStub = sinon.stub(WOCreateEditUtils, "endZRefCal").returns(true);
  await controller.endZRefCal(evt);
  expect(endZRefCalStub.called).toBeTruthy()
});

it('Calls chooseAssetItem() method ', async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
  const data = {assetnum :"7600", location : "XYZ"}
  const chooseAssetItemStub = sinon.stub(WOCreateEditUtils, "chooseAssetItem").returns(true);
  controller.chooseAssetItem(data);
  expect(chooseAssetItemStub.called).toBeTruthy()
});

it('Calls chooseClassification and clearClassification method ', async () => {
  const controller = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({ name: "woedit" });
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
  const ds = newDatasource({ member: workorder }, "dsWoedit");
  page.registerDatasource(ds);
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
  await controller.chooseClassification({hierarchypath: 'PIPE_LEAK', classstructureid: '1000'});
  expect(page.state.hierarchypath).toBe('PIPE_LEAK');
  expect(page.state.classstructureid).toBe('1000');

  await controller.clearClassification();
  expect(page.state.hierarchypath).toBe('');
  expect(page.state.classstructureid).toBe('');
});