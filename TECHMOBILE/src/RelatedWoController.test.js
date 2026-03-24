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

import RelatedWoController from './RelatedWoController';
import WorkOrderEditController from "./WorkOrderEditController";
import CommonUtil from './utils/CommonUtil';
import {
  Application,
  Page,
  JSONDataAdapter,
  Datasource,
  Device,
} from '@maximo/maximo-js-api';
import workorderitem from './test/wo-detail-json-data.js';
import relatedRecord from './test/related-work-order.js';
import sinon from 'sinon';
import { expect } from '@storybook/test';

function newDatasource(data = workorderitem, name = "workorderds") {
  const da = new JSONDataAdapter({
    src: workorderitem,
    items: 'member',
    schema: 'responseInfo.schema',
  });

  const ds = new Datasource(da, {
    idAttribute: 'wonum',
    name: name,
  });

  return ds;
}

function newDatasourceRelatedRecord(
  data = relatedRecord,
  name = 'relatedWorkOrderDs'
) {
  const da = new JSONDataAdapter({
    src: relatedRecord,
    items: 'member',
    schema: 'responseInfo.schema'
  });

  const ds = new Datasource(da, {
    name: name
  });

  return ds;
}

afterEach(() => {
  jest.restoreAllMocks();
  sinon.restore();
});


it('Create related and follow up work order', async () => {
  global.open = jest.fn();

  const controller = new RelatedWoController();
  const woEditController = new WorkOrderEditController();
  const app = new Application();
  const page = new Page({name: 'page'});
  const workOrderDetailsPage = new Page({name: 'workOrderDetails'});
  const woDetailResourceDS = newDatasource(workorderitem, 'woDetailResource');
  app.registerPage(workOrderDetailsPage);

  workOrderDetailsPage.registerDatasource(woDetailResourceDS);
  app.client = {
    userInfo: {
      personid: 'SAM',
    },
  };

  app.registerController(controller);
  app.registerController(woEditController);

  const wodetails = newDatasource(workorderitem, 'woDetailRelatedWorkOrder');

  wodetails.controllers.push(new RelatedWoController());
  page.registerDatasource(wodetails);

  await wodetails.load();
  
  await app.initialize();

  controller.pageInitialized(page, app);
  app.currentPage = {callController: ()=>{}};
  const invokeLoadRecord = sinon.stub(app.currentPage, 'callController');
  const ds = newDatasourceRelatedRecord(relatedRecord, 'relatedWorkOrderDs');
  page.registerDatasource(ds);

  ds.dependsOn = wodetails;
  let pageSetter = jest.fn();
  app.setCurrentPage = pageSetter;
  let evt = {
    item: wodetails.item,
    datasource: wodetails,
  };

  await controller.createRelatedAndFollowUpWo(evt);
  expect(invokeLoadRecord.called).toBe(true);

});

it('should send user to work order detail page', async () => {
  const controller = new RelatedWoController();
  const app = new Application();

  let pageSetter = jest.fn();
  let event = {
    item: {wonum: '1001', siteid: 'BEDFORD'},
  };

  app.registerController(controller);
  await app.initialize();

  app.setCurrentPage = pageSetter;

  controller.pageInitialized(new Page(), app);

  controller.showWoDetailPage(event);

  expect(pageSetter.mock.calls.length).toEqual(1);

  expect(pageSetter.mock.calls[0][0].name).toEqual('workOrderDetails');
});

it('should return FilteredDomainValues', async () => {
  const controller = new RelatedWoController();
  const app = new Application();
  const page = new Page();

  page.state = {
    loading: false,
    itemnum: null
  };
  const myworkDS = newDatasource(workorderitem, "myworkDS");
  const myWorkCreatedLocally = newDatasource(workorderitem, "myworkCreatedLocally");

  jest.spyOn(Device, 'get').mockReturnValue({ isMaximoMobile: true });

  page.registerDatasource(myWorkCreatedLocally);
  app.registerPage(page);

  controller.page = page;
  controller.app = app;

  await myworkDS.load();
  await myWorkCreatedLocally.load();

  myworkDS.item.anywhererefid = 'REF123';
  myworkDS.item.relatedwodesc = 'Test Work Order';
  myworkDS.item.relatedreckey = '1000';

  myWorkCreatedLocally.load = jest.fn();
  myWorkCreatedLocally.initializeQbe = jest.fn();
  myWorkCreatedLocally.setQBE = jest.fn();
  jest.spyOn(myWorkCreatedLocally, 'searchQBE').mockReturnValue([myWorkCreatedLocally.item]);

  myworkDS.load = jest.fn();
  myworkDS.initializeQbe = jest.fn();
  myworkDS.setQBE = jest.fn();
  myworkDS.state.currentSearch = '1201';
  jest.spyOn(myworkDS, 'searchQBE').mockReturnValue([myworkDS.item]);

  const childitem = {
    relatedwodesc: 'Test Work Order',
    anywhererefid: 'REF123',
    relatedreckey: '1000',
  }
 const respons =  await controller.getFilteredWorkOrder(childitem,myWorkCreatedLocally,'SITE1');
 expect(page.state.loading).toEqual(true);
 expect(myWorkCreatedLocally.initializeQbe).toHaveBeenCalled();
 expect(myWorkCreatedLocally.setQBE).toHaveBeenCalled();
 expect(respons.length).toBe(1);

 childitem.relatedreckey = null;
 const respons1 =  await controller.getFilteredWorkOrder(childitem,myworkDS,'SITE1');

 expect(page.state.loading).toEqual(true);
 expect(myworkDS.initializeQbe).toHaveBeenCalled();
 expect(myworkDS.setQBE).toHaveBeenCalled();
  expect(CommonUtil.sharedData.searchedText).toEqual('1201');
 expect(respons1.length).toBe(1);

});

it('should handle RBA scenario ', async () => {
  const controller = new RelatedWoController();
  const app = new Application();
  const page = new Page();

  page.state = {
    loading: false,
    itemnum: null
  };

  const myworkDS = newDatasource(workorderitem, "myworkDS");
  const woDetailRelatedWorkOrder = newDatasource(workorderitem, "woDetailRelatedWorkOrder");

  page.registerDatasource(myworkDS);
  page.registerDatasource(woDetailRelatedWorkOrder);
  app.registerPage(page);

  controller.page = page;
  controller.app = app;

  await myworkDS.load();
  await woDetailRelatedWorkOrder.load();

  jest.spyOn(app, 'toast').mockImplementation(() => { });

  jest.spyOn(Device, 'get').mockReturnValue({ isMaximoMobile: false });
  jest.spyOn(app, 'findDatasource').mockImplementation((dsName) => {
    if (dsName === 'myworkDS') return myworkDS;
    if (dsName === 'woDetailRelatedWorkOrder') return woDetailRelatedWorkOrder;
  });

  jest.spyOn(controller, 'getFilteredWorkOrder').mockImplementation((item, datasource, siteid) => {
    return []
  })

  jest.spyOn(woDetailRelatedWorkOrder, 'load').mockImplementation(() => { })
  const event = {
    item: {
      relatedwo: [{ href: '_QkVERk9SRC8zMDA1OB' }],
      siteid: 'SITE1',
    },
    childitem: {
      relatedreckey: '1005',
      relatedwodesc: 'Test Work Order',
      anywhererefid: 'REF123',
      href: '_QkVERk9SRC8zMDA1OB',
    },
  };
  await controller.openEditWo(event);
  expect(page.state.loading).toBe(false);

});

it('should handle MaximoMobile device scenario with myworkCreatedLocally datasource', async () => {
  const controller = new RelatedWoController();
  const app = new Application();
  const page = new Page();

  page.state = {
    loading: false,
    itemnum: null
  };

  const myworkCreatedLocally = newDatasource(workorderitem, "myworkCreatedLocally");
  const woDetailRelatedWorkOrder = newDatasource(workorderitem, "woDetailRelatedWorkOrder");

  page.registerDatasource(myworkCreatedLocally);
  page.registerDatasource(woDetailRelatedWorkOrder);
  app.registerPage(page);

  controller.page = page;
  controller.app = app;

  await myworkCreatedLocally.load();
  await woDetailRelatedWorkOrder.load();

  jest.spyOn(app, 'toast').mockImplementation(() => { });

  jest.spyOn(Device, 'get').mockReturnValue({ isMaximoMobile: true });
  jest.spyOn(app, 'findDatasource').mockImplementation((dsName) => {
    if (dsName === 'myworkCreatedLocally') return myworkCreatedLocally;
    if (dsName === 'woDetailRelatedWorkOrder') return woDetailRelatedWorkOrder;
  });

  jest.spyOn(controller, 'getFilteredWorkOrder').mockImplementation((item, datasource, siteid) => {
    return [datasource.item]
  })

  jest.spyOn(woDetailRelatedWorkOrder, 'load').mockImplementation(() => { })
  const event = {
    item: {
      relatedwo: [{ href: '_QkVERk9SRC8zMDA1OB' }],
      siteid: 'SITE1',
    },
    childitem: {
      relatedreckey: '1005',
      relatedwodesc: 'Test Work Order',
      anywhererefid: 'REF123',
      href: '_QkVERk9SRC8zMDA1OB',
    },
  };
  await controller.openEditWo(event);
  expect(page.state.loading).toBe(false);
  expect(page.state.itemnum).toBe('1005');
  expect(page.state.anywhererefid).toBe('REF123');
});

it('should handle MaximoMobile device scenario with myworkDS datasource', async () => {
  const controller = new RelatedWoController();
  const app = new Application();
  const page = new Page();

  page.state = {
    loading: false,
    itemnum: null
  };

  const myworkCreatedLocally = newDatasource(workorderitem, "myworkCreatedLocally");
  const myworkDS = newDatasource(workorderitem, "myworkDS");
  const todaywoassignedDS = newDatasource(workorderitem, "todaywoassignedDS");
  const woDetailRelatedWorkOrder = newDatasource(workorderitem, "woDetailRelatedWorkOrder");

  
  page.registerDatasource(myworkCreatedLocally);
  page.registerDatasource(myworkDS);
  page.registerDatasource(woDetailRelatedWorkOrder);
  app.registerDatasource(todaywoassignedDS);
  app.registerPage(page);

  controller.page = page;
  controller.app = app;

  await myworkCreatedLocally.load();
  await myworkDS.load();
  await woDetailRelatedWorkOrder.load();
  await todaywoassignedDS.load();
  await app.initialize();
  jest.spyOn(app, 'toast').mockImplementation(() => { });

  todaywoassignedDS.baseQuery = {};
  todaywoassignedDS.clearState = jest.fn();
  todaywoassignedDS.reset = jest.fn();

  jest.spyOn(Device, 'get').mockReturnValue({ isMaximoMobile: true });
  jest.spyOn(app, 'findDatasource').mockImplementation((dsName) => {
    if (dsName === 'myworkCreatedLocally') return myworkCreatedLocally;
    if (dsName === 'myworkDS') return myworkDS;
    if (dsName === 'woDetailRelatedWorkOrder') return woDetailRelatedWorkOrder;
    if (dsName === 'todaywoassignedDS') return todaywoassignedDS;
  });

  jest.spyOn(controller, 'getFilteredWorkOrder').mockImplementation((item, datasource, siteid) => {
    if(datasource.name === 'myworkDS')
       return [datasource.item]  
    return []
  })

  jest.spyOn(woDetailRelatedWorkOrder, 'load').mockImplementation(() => { })
  const event = {
    item: {
      relatedwo: [{ href: '_QkVERk9SRC8zMDA1OB' }],
      siteid: 'SITE1',
    },
    childitem: {
      relatedreckey: '1005',
      relatedwodesc: 'Test Work Order',
      anywhererefid: 'REF123',
      href: '_QkVERk9SRC8zMDA1OB',
    },
  };
  await controller.openEditWo(event);
  expect(page.state.loading).toBe(false);
  expect(page.state.itemnum).toBe('1005');
  expect(page.state.anywhererefid).toBe('REF123');
  expect(todaywoassignedDS.clearState).toHaveBeenCalled();
  expect(todaywoassignedDS.reset).toHaveBeenCalled();
});

it('should handle MaximoMobile device scenario for myworkDS datasource with no data', async () => {
  const controller = new RelatedWoController();
  const app = new Application();
  const page = new Page();

  page.state = {
    loading: false,
    itemnum: null
  };
  let workorderitems = {
    member: [],
  }
  const myworkCreatedLocally = newDatasource(workorderitem, "myworkCreatedLocally");
  const myworkDS = newDatasource(workorderitems, "myworkDS");
  const todaywoassignedDS = newDatasource(workorderitem, "todaywoassignedDS");
  const woDetailRelatedWorkOrder = newDatasource(workorderitem, "woDetailRelatedWorkOrder");

  
  page.registerDatasource(myworkCreatedLocally);
  page.registerDatasource(myworkDS);
  page.registerDatasource(woDetailRelatedWorkOrder);
  app.registerDatasource(todaywoassignedDS);
  app.registerPage(page);

  controller.page = page;
  controller.app = app;

  await myworkCreatedLocally.load();
  await myworkDS.load();
  await woDetailRelatedWorkOrder.load();
  await todaywoassignedDS.load();
  await app.initialize();
  jest.spyOn(app, 'toast').mockImplementation(() => { });
  
  todaywoassignedDS.baseQuery = {};
  todaywoassignedDS.clearState = jest.fn();
  todaywoassignedDS.reset = jest.fn();

  myworkDS.clearState = jest.fn();
  myworkDS.resetState = jest.fn();
  myworkDS.load = jest.fn();
  myworkDS.state.hasData = false;
  
  jest.spyOn(Device, 'get').mockReturnValue({ isMaximoMobile: true });
  jest.spyOn(app, 'findDatasource').mockImplementation((dsName) => {
    if (dsName === 'myworkCreatedLocally') return myworkCreatedLocally;
    if (dsName === 'myworkDS') return myworkDS;
    if (dsName === 'woDetailRelatedWorkOrder') return woDetailRelatedWorkOrder;
    if (dsName === 'todaywoassignedDS') return todaywoassignedDS;
  });

  jest.spyOn(controller, 'getFilteredWorkOrder').mockImplementation((item, datasource, siteid) => {
    if(datasource.name === 'myworkDS')
       return [datasource.item]  
    return []
  })

  jest.spyOn(woDetailRelatedWorkOrder, 'load').mockImplementation(() => { })
  const event = {
    item: {
      relatedwo: [{ href: '_QkVERk9SRC8zMDA1OB' }],
      siteid: 'SITE1',
    },
    childitem: {
      relatedreckey: '1005',
      relatedwodesc: 'Test Work Order',
      anywhererefid: 'REF123',
      href: '_QkVERk9SRC8zMDA1OB',
    },
  };
  await controller.openEditWo(event);
  expect(page.state.loading).toBe(false);
  expect(page.state.itemnum).toBe('1005');
  expect(page.state.anywhererefid).toBe('REF123');
  expect(todaywoassignedDS.clearState).toHaveBeenCalled();
  expect(todaywoassignedDS.reset).toHaveBeenCalled();
});

it('should Error record_not_available_device', async () => {
  const controller = new RelatedWoController();
  const app = new Application();
  const page = new Page();

  page.state = {
    loading: false,
    itemnum: null
  };

  const myworkCreatedLocally = newDatasource(workorderitem, "myworkCreatedLocally");
  const myworkDS = newDatasource(workorderitem, "myworkDS");
  const woDetailRelatedWorkOrder = newDatasource(workorderitem, "woDetailRelatedWorkOrder");

  page.registerDatasource(myworkCreatedLocally);
  page.registerDatasource(myworkDS);
  page.registerDatasource(woDetailRelatedWorkOrder);
  app.registerPage(page);

  controller.page = page;
  controller.app = app;

  await myworkCreatedLocally.load();
  await myworkDS.load();
  await woDetailRelatedWorkOrder.load();

  jest.spyOn(app, 'toast').mockImplementation(() => { });

  jest.spyOn(Device, 'get').mockReturnValue({ isMaximoMobile: false });
  jest.spyOn(app, 'findDatasource').mockImplementation((dsName) => {
    if (dsName === 'myworkCreatedLocally') return myworkCreatedLocally;
    if (dsName === 'myworkDS') return myworkDS;
    if (dsName === 'woDetailRelatedWorkOrder') return woDetailRelatedWorkOrder;
  });

  jest.spyOn(controller, 'getFilteredWorkOrder').mockImplementation((item, datasource, siteid) => {
    return []
  })

  jest.spyOn(woDetailRelatedWorkOrder, 'load').mockImplementation(() => { })
  const event = {
    item: {
      relatedwo: [{ href: '_QkVERk9SRC8zMDA1OB' }],
      siteid: 'SITE1',
    },
    childitem: {
      relatedreckey: '1005',
      relatedwodesc: 'Test Work Order',
      anywhererefid: 'REF123',
      href: '_QkVERk9SRC8zMDA1OB',
    },
  };
  await controller.openEditWo(event);
  expect(page.state.loading).toBe(false);
});
test('pagePaused lifecycle called, should clearQBE if any', async () => {

  const controller = new RelatedWoController();
  const app = new Application();
  const page = new Page({ name: "relatedWorkOrder" });
  const ds = newDatasource(workorderitem, "myworkDS");
  const dsCreatedLocally = newDatasource(workorderitem, "myworkCreatedLocally");
  app.registerController(controller);
  app.registerPage(page);
  app.registerDatasource(ds);
  app.registerDatasource(dsCreatedLocally);

  //Scenario:1 -> when isMaximoMobile = true && qbe.length = 0

  dsCreatedLocally.state.qbe = {
  }

  jest.spyOn(Device, 'get').mockReturnValue({ isMaximoMobile: true });
  jest.spyOn(app, 'findDatasource').mockImplementation(name => name === "myworkDS"
    ? ds : name === "myworkCreatedLocally"
      ? dsCreatedLocally : null);
  await dsCreatedLocally.load();

  let dsCreatedLocallyStub = sinon.stub(dsCreatedLocally, 'clearQBE');
  let dsCreatedLocallyStubSearch = sinon.stub(dsCreatedLocally, 'searchQBE');
  expect(Object?.keys(dsCreatedLocally.state.qbe).length).toBe(0);

  await controller.pagePaused(page, app);

  expect(app.findDatasource).toHaveBeenCalledWith("myworkCreatedLocally");
  expect(dsCreatedLocallyStub.called).toBe(false);
  expect(dsCreatedLocallyStubSearch.called).toBe(false);

  //Scenario:2 -> when isMaximoMobile = true && qbe.length = 2

  dsCreatedLocally.state.qbe = {
    siteid: {
      0: {
        subType: "UPPER",
        unparsedValue: "BEDFORD",
        value: "%BEDFORD%"
      }
    },
    wonum: {
      0: {
        subType: "UPPER",
        unparsedValue: "1392",
        value: "%1392%"
      }
    }
  }

  // Mock Device.get().isMaximoMobile to return true
  jest.spyOn(Device, 'get').mockReturnValue({ isMaximoMobile: true });
  jest.spyOn(app, 'findDatasource').mockImplementation(name => name === "myworkDS"
    ? ds : name === "myworkCreatedLocally"
      ? dsCreatedLocally : null);
  await dsCreatedLocally.load();
  expect(Object?.keys(dsCreatedLocally.state.qbe).length).toBe(2);

  await controller.pagePaused(page, app);

  expect(app.findDatasource).toHaveBeenCalledWith("myworkCreatedLocally");
  expect(dsCreatedLocallyStub.called).toBe(true);
  expect(dsCreatedLocallyStubSearch.called).toBe(true);

  //Scenario:3 -> when isMaximoMobile = false && qbe.length = 0
  ds.state.qbe = {
  }

  jest.spyOn(Device, 'get').mockReturnValue({ isMaximoMobile: false });
  jest.spyOn(app, 'findDatasource').mockImplementation(name => name === "myworkDS"
    ? ds : name === "myworkCreatedLocally"
      ? dsCreatedLocally : null);
  await ds.load();

  let dsStub = sinon.stub(ds, 'clearQBE');
  let dsStubSearch = sinon.stub(ds, 'searchQBE');
  expect(Object?.keys(ds.state.qbe).length).toBe(0);

  await controller.pagePaused(page, app);

  expect(app.findDatasource).toHaveBeenCalledWith("myworkDS");
  expect(dsStub.called).toBe(false);
  expect(dsStubSearch.called).toBe(false);

  //Scenario:4 -> when isMaximoMobile = false && qbe.length = 2

  ds.state.qbe = {
    siteid: {
      0: {
        subType: "UPPER",
        unparsedValue: "BEDFORD",
        value: "%BEDFORD%"
      }
    },
    wonum: {
      0: {
        subType: "UPPER",
        unparsedValue: "1392",
        value: "%1392%"
      }
    }
  }

  jest.spyOn(Device, 'get').mockReturnValue({ isMaximoMobile: false });
  jest.spyOn(app, 'findDatasource').mockImplementation(name => name === "myworkDS"
    ? ds : name === "myworkCreatedLocally"
      ? dsCreatedLocally : null);
  await ds.load();
  expect(Object?.keys(ds.state.qbe).length).toBe(2);

  await controller.pagePaused(page, app);

  expect(app.findDatasource).toHaveBeenCalledWith("myworkDS");
  expect(dsStub.called).toBe(true);
  expect(dsStubSearch.called).toBe(true);
});

