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

import SchedulePageController from './SchedulePageController';
import ReportWorkPageController from './ReportWorkPageController';
import {Application, Page, JSONDataAdapter, Datasource, Device} from '@maximo/maximo-js-api';
import { OpenLayersAdapter } from '@maximo/map-component';
import workorderitem from './test/wo-detail-json-data.js';
import unassignedworkorderitem from './test/unassigned-wo-detail-json-data.js';
import statusitem from './test/statuses-json-data.js';
import domainitem from './test/domain-json-data.js';
import worLogItem from './test/worklog-json-data.js';
import wpmaterial from './test/materials-json-data';
import sinon from 'sinon';
import wolocationmeters from './test/locationmeter-json-data.js';
import wolist from './test/wo-list-json-data.js';
import wocost from './test/wo-cost-json-data.js';
import jwocost from './test/wo-cost-total-json-data.js';
import labor from "./test/labors-json-data";
import WorkOrderDetailsController from './WorkOrderDetailsController';
import CommonUtil from "./utils/CommonUtil";
import worktype from "./test/worktype-json-data";
import commonUtil from './utils/CommonUtil';
import WOTimerUtil from './utils/WOTimerUtil.js';

function newDatasourceGlobal(data = workorderitem, items = "member", idAttribute = "wonum", name = "woDetailsReportWork") {
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

function newDatasource(data = workorderitem, name = 'workorderds') {
  const da = new JSONDataAdapter({
    src: workorderitem,
    items: 'member',
    schema: 'responseInfo.schema'
  });

  const ds = new Datasource(da, {
    idAttribute: 'wonum',
    name: name
  });

  return ds;
}

function newDatasourceWorkLog(data = worLogItem, name = 'woWorklogDs') {
  const da = new JSONDataAdapter({
    src: worLogItem,
    items: 'member',
    schema: 'responseInfo.schema'
  });

  const ds = new Datasource(da, {
    name: name
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

function newWOListDatasource(data = wolist, name = 'todaywoassignedDS') {
  const da = new JSONDataAdapter({
      src: data,
      items: 'member',
      schema: 'responseInfo.schema'
  });
  const ds = new Datasource(da, {
      idAttribute: 'wonum',
      name: name
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

it('Empty data source should display message', async () => {});

it('Page should display list of cards', async () => {});

it('card item click should send user to work order details', async () => {
  let mockSetPage = jest.fn();
  const controller = new SchedulePageController();
  const woDetailscontroller = new WorkOrderDetailsController();
  const app = new Application();

  const page = new Page();
  const workOrderDetailPage = new Page({name: 'workOrderDetails'});

  app.registerController(controller);
  workOrderDetailPage.registerController(woDetailscontroller);
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  app.currentPage = workOrderDetailPage;

  controller.pageInitialized(page, app);

  controller.showWODetail({wonum: 1000, siteid: 'BEDFORD'});
  expect(mockSetPage.mock.calls.length).toEqual(1);
  expect(mockSetPage.mock.calls[0][0].name).toEqual('workOrderDetails');
  expect(mockSetPage.mock.calls[0][0].resetScroll).toEqual(true);
  expect(mockSetPage.mock.calls[0][0].params.wonum).toEqual(1000);
  expect(mockSetPage.mock.calls[0][0].params.siteid).toEqual('BEDFORD');
});

it('should open materials page', async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'page'});

  app.registerController(controller);
  const ds = newDatasource(workorderitem, 'workorderds');
  page.registerDatasource(ds);
  let items = await ds.load();

  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  await controller.openDrawer({'item': items[0], 'datasource': ds});

  expect(page.state.dialogLabel).toBe('Materials and tools');

});


it('should fail opening materials page', async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'page'});

  page.state = {
    initialDefaultLogType: "!CLIENTNOTE!"
  }

  app.registerController(controller);
  const ds = newDatasource(workorderitem, 'workorderds');
  page.registerDatasource(ds);
  let items = await ds.load();

  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);

  try {
    await controller.openDrawer(items[0], null);
    expect.fail('failed opening materials page');
  } catch (e) {
    // good
  }

});

it('should open worklog page', async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'page'});
  
  app.client = {
    userInfo: {
      loginID: "sam",
      insertOrg: 'EGLENA',
      insertSite: 'BEDFORD'
    }
  }

  app.registerController(controller);
  const ds = newDatasource(workorderitem, 'wodetails');
  const woWorklogDs = newDatasourceWorkLog(worLogItem, 'woWorklogDs');
  const synonymdomainDs = newStatusDatasource(statusitem, 'synonymdomainData');
  page.registerDatasource(ds);
  page.registerDatasource(woWorklogDs);
  app.registerDatasource(synonymdomainDs);
  let items = await ds.load();

  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  await controller.openWorkLogDrawer({'item': items[1]});
  expect(page.state.chatLogGroupData.length).toBe(1);
  expect(page.state.defaultLogType).toBe('!UPDATE!');
});

it('should open save prompt on work log drawer validation', async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'page'});

  app.registerController(controller);
  const ds = newDatasource(workorderitem, 'wodetails');
  const woWorklogDs = newDatasourceWorkLog(worLogItem, 'woWorklogDs');
  const synonymdomainDs = newStatusDatasource(statusitem, 'synonymdomainData');
  page.registerDatasource(ds);
  page.registerDatasource(woWorklogDs);
  app.registerDatasource(synonymdomainDs);
  let items = await ds.load();
  app.client = {
    userInfo: {  
      loginID: "sam",
      insertOrg: 'EGLENA',
      insertSite: 'BEDFORD'
    },
  };
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  await controller.openWorkLogDrawer({'item': items[1]});

  page.state.isWorkLogEdit = true;
  page.state.initialDefaultLogType = '!UPDATE!';
  page.state.workLogData = { summary: "abc", longDescription: "<p>test</p>", logType: {value: 'UPDATE'}, sendDisable: false};
  controller.workLogValidate({});
  page.state.isWorkLogEdit = false;
  controller.workLogValidate({});
  expect(page.findDialog('saveDiscardWorkLog')).toBeDefined();

  app.client = { userInfo : { personid : "test" } };

  controller.saveWorkLogSaveDiscard();
  expect(page.findDialog('workLogDrawer')).toBeDefined();
  page.state.workLogData.sendDisable = true;
  controller.saveWorkLogSaveDiscard();
  controller.closeWorkLogSaveDiscard();
  expect(page.findDialog('workLogDrawer')).toBeDefined();

  controller.watchChatLogChanges({summary: "abc", longDescription: "<p>test</p>", logType: {value: 'UPDATE'}, sendDisable: false});
  await new Promise((r) => setTimeout(r, 600));
  expect(page.state.isWorkLogEdit).toBeTruthy();

  controller.watchChatLogChanges({summary: "abc", longDescription: "<p>test</p>", logType: {value: 'UPDATE'}, sendDisable: true});
  await new Promise((r) => setTimeout(r, 600));
  expect(page.state.isWorkLogEdit).toBeTruthy();

  controller.watchChatLogChanges({summary: "", longDescription: "", logType: {value: 'UPDATE'}, sendDisable: false, visibility: false});
  await new Promise((r) => setTimeout(r, 600));
  expect(page.state.isWorkLogEdit).toBeFalsy();
});

it('saveWorkLog', async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'page'});
  page.state = {
    initialDefaultLogType: "!CLIENTNOTE!"
  }
  app.client = {
    userInfo: {
      loginID: "sam",
      personid: 'SAM',labor: {laborcode: 'SAM'}
    }
  }

  app.registerController(controller);

  const ds = newDatasource(workorderitem, 'wodetails');
  const ds2 = newDatasourceWorkLog(worLogItem, 'woWorklogDs');
  let workLogModified = worLogItem;
  workLogModified.responseInfo.schema.properties.logtype.default = "!CLIENTNOTE!";
  const ds3 = newDatasourceWorkLog(workLogModified, 'woWorklogDs');
  const synonymdomainDs = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymdomainDs);
  let updatestub = sinon.stub(ds2, 'update');
  let forceloadstub = sinon.stub(ds2, 'forceReload');

  page.registerDatasource(ds);
  page.registerDatasource(ds2);

  let items = await ds.load();

  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  
  await controller.openWorkLogDrawer({'item': items[1], 'datasource': ds});
  expect(page.state.chatLogGroupData.length).toBe(1);
  let event = 'Test Comment 2';

  await controller.saveWorkLog(event);
  expect(updatestub.called).toBe(true);
  expect(updatestub.displayName).toBe('update');
  expect(updatestub.args.length).toBe(1);

  expect(forceloadstub.called).toBe(true);
  expect(forceloadstub.displayName).toBe('forceReload');

  event = 'A long description is a way to provide long alternative text for non-text elements, such as images. Examples of suitable use of long description are charts, graphs, maps, infographics, and other complex images. Like alternative text, long description should be descriptive and meaningful.';

	await controller.openWorkLogDrawer({'item': items[1], 'datasource': ds});
	page.state = {chatLogDescLength:100};
  await controller.saveWorkLog(event, true);

  updatestub.restore();
  forceloadstub.restore();

  sinon.stub(ds3, 'update');
  sinon.stub(ds3, 'forceReload');
  await controller.openWorkLogDrawer({'item': items[1], 'datasource': ds});
  expect(page.state.defaultLogType).toBe('!CLIENTNOTE!');
});

// Assisted by WCA for GP. Latest GenAI contribution: Version 1, granite-20B-code-instruct-v1 model
describe('approveWO', () => {
  it('should approve a work order', async () => {
    const controller = new SchedulePageController();
    const app = new Application();
    const page = {
      datasources: {
        wodetails: {
          load: jest.fn(),
        }
      },
      findDatasource: jest.fn(),
      state: {
        selectedDS: 'new',
      }
    };

    app.findDatasource = jest.fn(() => ({
      forceReload: jest.fn(),
      load: jest.fn(() => workorderitem),
    }));

    controller.pageInitialized(page,app)
    commonUtil.markStatusAssigned=jest.fn();
    let event = {
      field: "newreading",
      item: {
        "assetnum": "13170"
      }
    }
    
    await controller.approveWO(event);
    expect(commonUtil.markStatusAssigned).not.toHaveBeenCalled();

    event.item.href = "http://localhost:3000/maximo/oslc/os/mxapiassetmeter/_VE9NQVNTMS8wLJE-FAKEASSETMETERRESTID"
    await controller.approveWO(event);
    expect(commonUtil.markStatusAssigned).toHaveBeenCalled();

    event.item.href = ""
    await controller.approveWO(event);
    expect(commonUtil.markStatusAssigned).toHaveBeenCalled();

  });
});

// Assisted by WCA for GP. Latest GenAI contribution: Version 1, granite-20B-code-instruct-v1 model
it('should open a dialog on click on reject work order button', async () => {
  const controller = new SchedulePageController();
  const app = {
    findDatasource: jest.fn(() => ({
      items: [],
      forceReload: jest.fn(),
      load: jest.fn(),
      initializeQbe: jest.fn(),
      setQBE: jest.fn(),
      searchQBE:jest.fn(),
    })),
    getLocalizedLabel: jest.fn(),
    showDialog: jest.fn(),
    state: {
      selectedWoListDs: null
    }
  };
  const page = {
    datasources: {
      rejectList: {
        clearState: jest.fn(),
        resetState: jest.fn(),
        clearSelections: jest.fn(),
      }
    },
    findDatasource: jest.fn(()=>({
       load: jest.fn(),
       clearSelections: jest.fn(),

    })),
    state: {
      selectedDS: 'new',
    },
    showDialog: jest.fn(),
  };
  let event = {
    field: "newreading",
    item: [{
      "assetnum": "13170"
    }]
  }
  CommonUtil.sharedData.clickedUnassignment = true;
  controller.pageInitialized(page,app);
  await controller.rejectWO(event)
  expect(page.state.workloading).toBe(false);
});

it('should update state of selectedWoListDs at app level on page Initialization', async () => {
  const controller = new SchedulePageController();
  const app = {
    findDatasource: jest.fn(() => ({
      items: [],
      forceReload: jest.fn(),
      load: jest.fn(),
      initializeQbe: jest.fn(),
      setQBE: jest.fn(),
      searchQBE:jest.fn()
    })),
    state: {
      selectedWoListDs: ''
    }
  };
  const page = {
    datasources: {
      rejectList: {
        clearState: jest.fn(),
        resetState: jest.fn(),
        clearSelections: jest.fn(),
        load: jest.fn()
      }
    },
    findDatasource: jest.fn(),
    state: {
      selectedDS: 'dummyDs',
    },
    showDialog: jest.fn(),
  };

  controller.pageInitialized(page,app);
  expect(app.state.selectedWoListDs).toBe("dummyDs");
});


it('should open status page anywhere mode', async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'page'});
  Device.get().isAnywhere = true;
 
  const travelScenarioData = { serviceaddress: {longitudex: 10, latitudey : 20}, labtrans: [{timerstatus_maxvalue: 'ACTIVE'}]}

  let item = {
    wonum: 'SCRAP_2', worktype:'CM', status: 'INPRG', status_maxvalue: 'INPRG', flowcontrolled:true, allowedstates: {
      "COMP": [{"description": "Completed", "value": "COMP", "maxvalue": "COMP"}],
      "WAPPR": [{"description": "Waiting on Approval", "value": "WAPPR", "maxvalue": "WAPPR"}]
    }
  };
  app.state = {
		woStatSigOptions: {
			"APPR" : "APPR", "CLOSE" : "CLOSE"
		}
	};
  app.state.woStatSigOptions = JSON.stringify(app.state.woStatSigOptions);
  app.client = {
    userInfo: {
      loginID: "sam",
      personid: "SAM",     
      },
    checkSigOption: (option) => true,
    findSigOption: (appName, sigoption) => true,
  };
  app.registerController(controller);
  
  const ds = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(ds);
  let loadstub = sinon.stub(ds, 'searchQBE');
  sinon.stub(commonUtil, "getOfflineAllowedStatusList")
      .returns([{"description": "Completed", "value": "COMP", "maxvalue": "COMP"},{"description": "Waiting on Approval", "value": "WAPPR", "maxvalue": "WAPPR"}]);

  const dsstatusDomainList = newStatusDatasource(statusitem, 'dsstatusDomainList');
  page.registerDatasource(dsstatusDomainList);
  const wodetails = newDatasource(workorderitem, "wodetails");
  app.registerDatasource(wodetails);
  const dsworktype = newStatusDatasource(worktype, "dsworktype");
  app.registerDatasource(dsworktype)
  await app.initialize();
  
  await dsworktype.load();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  await controller.openChangeStatusDialog({'item': item, 'datasource': dsstatusDomainList, 'referencePage': 'workOrderDetails'});

  expect(page.state.woItem).not.toBe(undefined);

  Device.get().isMaximoMobile = true;
  await controller.openChangeStatusDialog({'item': item, 'datasource': dsstatusDomainList, 'referencePage': 'workOrderDetails'});

  expect(loadstub.displayName).toBe('searchQBE');

  delete item['worktype'];
  item.status = 'COMP'; 
  item.status_maxvalue = 'COMP';
  item = {...item, ...travelScenarioData};
  await controller.openChangeStatusDialog({'item': item, 'datasource': dsstatusDomainList, 'referencePage': 'workOrderDetails'});

  Device.get().isMaximoMobile = false;
});

it('should open status page ', async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'page'});
  Device.get().isAnywhere = false;

  const event = {
    item: {
      status_maxvalue: 'INPRG',
    },
    selectedDatasource: null, 
  };
  
  let item = {
    wonum: 'SCRAP_2', status: 'APPR', status_maxvalue: 'APPR', allowedstates: {
      "COMP": [{"description": "Completed", "value": "COMP", "maxvalue": "COMP"}],
      "WAPPR": [{"description": "Waiting on Approval", "value": "WAPPR", "maxvalue": "WAPPR"}]
    }
  };
  app.state = {
		woStatSigOptions:{
			"APPR" : "APPR",
			"CLOSE" : "CLOSE"
		}
	};
  app.state.woStatSigOptions = JSON.stringify(app.state.woStatSigOptions);
  app.client = {
    userInfo: {
      loginID: "sam",
      personid: "SAM",     
      },
    checkSigOption: (option) => true,
    findSigOption: (appName, sigoption) => true,
  };

  app.registerController(controller);

  const ds = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(ds);

  const dsstatusDomainList = newStatusDatasource(statusitem, 'dsstatusDomainList');
  page.registerDatasource(dsstatusDomainList);
  const woDetailds = newDatasource(workorderitem, "wodetails");
  app.registerDatasource(woDetailds);

  const ds1 = newDatasource(workorderitem, 'woDetailResource');
  page.registerDatasource(ds1);
  const dsworktype = newStatusDatasource(worktype, "dsworktype");
  app.registerDatasource(dsworktype)
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  await ds1.forceReload();
  await controller.openChangeStatusDialog({'item': item, 'datasource': dsstatusDomainList, 'referencePage': 'workOrderDetails', 'selectedDatasource': ds1});

  expect(page.state.memoMaxLength).toEqual(50);
  expect(page.state.woItem).not.toBe(undefined);
  
  let loadstub = sinon.stub(dsstatusDomainList, 'load').callThrough();

  await controller.openChangeStatusDialog(event);
  loadstub.withArgs(loadstub, { noCache: true, src: [{ maxvalue: 'WAPPR' }] });
  expect(loadstub.called).toBeTruthy();
  expect(loadstub.callCount).toEqual(1);
  loadstub.restore();

});

it("should load work order list data", async () => {  
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'page'});
  const page1 = new Page({name: 'report_work'});

  const ds = newDatasource(workorderitem, "myworkDS");
  page.registerDatasource(ds);
  app.state = {
    incomingContext: {
      breadcrumb: {
        enableReturnBreadcrumb: true
      }
    },
    screen: {
      size: 'sm'
    }
  };
  page.state = {
    breadcrumbWidth: 68,
    selectedDS : 'myworkDS'
  }

  app.client = {
    userInfo: {
      loginID: "sam",
      personid: "SAM",
      labor: {
        laborcode: "SAM",
        laborcraftrate: {
          craft: "Electrician",
          skilllevel: "Electrician - 2nd Class",
        },
      },
    },
    checkSigOption: (option) => true,
    findSigOption: (appName, sigoption) => true,
  };
  app.registerPage(page1);
  app.registerController(controller);
  const overdueDS = newDatasource(workorderitem, 'overdueDS');
  const todaywoassignedDS = newDatasource(workorderitem, 'todaywoassignedDS');
  const pmduewolistDS = newDatasource(workorderitem, 'pmduewolistDS');
  page.registerDatasource(overdueDS);
  page.registerDatasource(todaywoassignedDS);
  page.registerDatasource(pmduewolistDS);
  app.state.systemProp = {
    'mxe.mobile.travel.prompt': '1',
  };

  await app.initialize();
  page1.state.fieldChangedManually = false;

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  CommonUtil.sharedData.clickedWo = true;
  const filterListUsingPageParams = sinon.stub(controller, "filterListUsingPageParams");
  await controller.pageResumed(page);
  expect(page.state.firstLogin).toEqual(true);
  expect(filterListUsingPageParams.called).toBe(true);
  let evt = {
    selectedItem: {
      id: 'Unspecified'
    }
  }

  await controller.loadWOListData(evt);

  expect(overdueDS.dataAdapter.itemCount).toBe(undefined);
  expect(app.state.selectedWoListDs).toBe('Unspecified');

  evt.selectedItem.id = 'overdueDS';

  await controller.loadWOListData(evt);

  expect(overdueDS.dataAdapter.itemCount).not.toBe(0);
  expect(app.state.selectedWoListDs).toBe('overdueDS');

  page.state.firstLogin = false;
  page.state.selectedSwitch = 0;
  app.state.networkConnected = true;
  controller.pageInitialized(page, app);
  CommonUtil.sharedData.searchedText = true
  await controller.pageResumed(page);
  expect(overdueDS.dataAdapter.itemCount).not.toBe(0);
  page.state.selectedSwitch = 0;
  app.state.networkConnected = true;
  controller.pageInitialized(page, app);
  await controller.pageResumed(page);
  expect(page.state.firstLogin).toEqual(false);
  expect(overdueDS.dataAdapter.itemCount).not.toBe(0);

  page.state.firstLogin = false;
  page.state.selectedSwitch = 1;
  controller.pageInitialized(page, app);
  await controller.pageResumed(page);
  expect(overdueDS.dataAdapter.itemCount).not.toBe(0);
  expect(page.state.breadcrumbWidth).toEqual(68);
});

it("should show signature prompt when signature is enabled", async () => {
  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page();
  app.state = {
    systemProp: {
      'maximo.mobile.statusforphysicalsignature': 'INPRG'
    },
  };

  app.registerController(controller);
  await app.initialize();

  app.setCurrentPage = jest.fn();
  controller.pageInitialized(page, app);
//  app.state.systemProp["maximo.mobile.statusforphysicalsignature"] = "INPRG";
  controller.updateSignaturePrompt("INPRG")
  expect(page.state.enableSignatureButton).toBeTruthy();
});
it("Workorder startStopTimer", async () => {
  let mockSetPage = jest.fn();
  sinon.stub(OpenLayersAdapter, "transformCoordinate").returns([1,2]);
  global.open = jest.fn();

  const controller = new SchedulePageController();
  const app = new Application();
  app.state = {};
  const page = new Page({
    name: "schedule"
  });

  page.state = {'selectedDS': 'todaywoassignedDS'};
  const reportPage = new Page({
    name: 'report_work'
  });
  const reportWorkController = new ReportWorkPageController();

  app.client = {
    userInfo: {
      loginID: "sam",
      personid: "SAM",
      labor: {laborcraftrate: {craft: 'ELECT'}, laborcode: 'SAM'}
    },
  };

  app.state = {
		systemProp: {
			'maximo.mobile.usetimer': '1'
		},
	};

  app.registerController(controller);
  reportPage.registerController(reportWorkController);

  const ds = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(ds);

  const dsstatusDomainList = newStatusDatasource(statusitem, 'dsstatusDomainList');
  page.registerDatasource(dsstatusDomainList);

  const dsDomain = newStatusDatasource(domainitem, 'dsdomains');
  page.registerDatasource(dsDomain);

  const laborDetailDS = newLaborDetailDatasource(labor, 'woLaborDetaildsOnSchedule');
  page.registerDatasource(laborDetailDS);

  const reportWorkLabords = newDatasource(statusitem, 'reportworkLabords');
  reportPage.registerDatasource(reportWorkLabords);

  const woReportWorkDs = newDatasourceGlobal(workorderitem, "member", "wonum", "woDetailsReportWork");
  const craftrate = newDatasourceGlobal(labor, "craftrate", "craft", "craftrate");
  const reportworksSynonymData = newStatusDatasource(statusitem, "reportworksSynonymData");
  const inventoryDS = newDatasourceGlobal(wpmaterial, 'member', 'wonum', 'inventoryDS');
  const synonymDSData = newStatusDatasource(statusitem, 'synonymDSData');
  const locationDS = newStatusDatasource(wolocationmeters, 'locationDS');

  reportPage.registerDatasource(woReportWorkDs);
  reportPage.registerDatasource(craftrate);
  reportPage.registerDatasource(reportworksSynonymData);
  reportPage.registerDatasource(inventoryDS);
  reportPage.registerDatasource(synonymDSData);
  reportPage.registerDatasource(locationDS);

  const wolistds = newDatasource(workorderitem, page.state.selectedDS);
  page.registerDatasource(wolistds);

  const wodetails = newDatasource(workorderitem, 'wodetails');
  page.registerDatasource(wodetails);

  let items = await wolistds.load();
  let invokeAction = sinon.stub(wolistds, "invokeAction").returns(items[0]);
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  reportWorkController.pageInitialized(reportPage, app);

  await controller.startStopTimer({
    item: items[1],
    datasource: wolistds,
    'action': 'start',
    'worktype': 'work'
  });
  
  expect(invokeAction.called).toBe(true);
  expect(invokeAction.displayName).toBe("invokeAction");
  expect(invokeAction.args.length).toBe(1);

  app.currentPage = reportPage;
  await controller.startStopTimer({
    item: items[1],
    datasource: wolistds,
    'action': 'stop'
  });

  expect(invokeAction.called).toBe(true);
  expect(invokeAction.displayName).toBe("invokeAction");
  expect(invokeAction.args.length).toBe(2);

  controller.openNavigation = jest.fn();

  app.state = {
    systemProp: {
      'mxe.mobile.travel.navigation': '1','maximo.mobile.usetimer': '1'
    },
    networkConnected: true
  };

  wolistds.item.coordinate = 'LATLONG';

  await controller.startStopTimer({
    item: items[1],
    datasource: wolistds,
    'action': 'start',
    'worktype': 'travel'
  });
  expect(invokeAction.called).toBe(true);
  expect(invokeAction.displayName).toBe("invokeAction");
  expect(invokeAction.args.length).toBe(3);
  expect(controller.openNavigation.mock.calls.length).toBe(1);

  app.state = {
    systemProp: {
      'mxe.mobile.travel.navigation': '0', 'maximo.mobile.usetimer': '1'
    }
  };

  controller.openNavigation = jest.fn();

  await controller.startStopTimer({
    item: items[1],
    datasource: wolistds,
    'action': 'start',
    'worktype': 'travel'
  });

  expect(invokeAction.called).toBe(true);
  expect(invokeAction.displayName).toBe("invokeAction");
  expect(invokeAction.args.length).toBe(4);
  expect(controller.openNavigation.mock.calls.length).toBe(0);


  app.state = {
    systemProp: {
      'mxe.mobile.travel.navigation': '1',
    },
    networkConnected: true
  };

  wolistds.item.coordinate = 'XY';

  await controller.startStopTimer({
    item: items[1],
    datasource: wolistds,
    'action': 'start',
    'worktype': 'travel'
  });
  expect(controller.openNavigation.mock.calls.length).toBe(1);
  
  
  app.state = {
    systemProp: {
      'mxe.mobile.travel.navigation': '1',
      'maximo.mobile.travel.allowmultipletimers': '1',
    },
    networkConnected: false
  };

  wolistds.item.coordinate = 'LATLONG';
  await controller.startStopTimer({
    item: items[1],
    datasource: wolistds,
    'action': 'start',
    'worktype': 'travel'
  });
  expect(controller.openNavigation.mock.calls.length).toBe(2);
  expect(await controller.startStopTimer({
    item: items[4],
    datasource: wolistds,
    'action': 'start',
    'worktype': 'work'
  })).toBeUndefined();
});

it('Workorder startWOStopTimer with confirmlabtrans = 1', async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({
    name: "page"
  });
  const reportPage = new Page({
    name: 'report_work'
  });

  page.state = {'selectedDS': 'todaywoassignedDS'};
  const reportWorkController = new ReportWorkPageController();

  app.client = {
    userInfo: {
      loginID: "sam",
      personid: "SAM",
      labor: {laborcraftrate: {craft: 'ELECT'}, laborcode: 'SAM'}
    },
  };

  app.state = {
		systemProp: {
		  'maximo.mobile.usetimer': '1'
		},
	  };

  app.registerController(controller);
  reportPage.registerController(reportWorkController);

  const ds = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(ds);

  const dsstatusDomainList = newStatusDatasource(statusitem, 'dsstatusDomainList');
  page.registerDatasource(dsstatusDomainList);

  const laborDetailDS = newLaborDetailDatasource(labor, 'woLaborDetaildsOnSchedule');
  page.registerDatasource(laborDetailDS);

  const reportWorkLabords = newDatasource(statusitem, 'reportworkLabords');
  reportPage.registerDatasource(reportWorkLabords);

  const wolistds = newDatasource(workorderitem, page.state.selectedDS);
  page.registerDatasource(wolistds);

  const wodetails = newDatasource(workorderitem, 'wodetails');
  page.registerDatasource(wodetails);

  const items = await wodetails.load();
  let invokeAction = sinon.stub(wolistds, "invokeAction").returns(items[0]);
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);

  items[1].confirmlabtrans = '1';

  await controller.startStopTimer({item: items[1], datasource: wolistds, action: 'start'});

  expect(invokeAction.called).toBe(true);
  expect(invokeAction.displayName).toBe('invokeAction');
  expect(invokeAction.args.length).toBe(1);

  app.currentPage = reportPage;
  expect(laborDetailDS.item.finishdatetime).toBeUndefined();

  await controller.startStopTimer({item: items[1], datasource: wolistds, action: 'stop'});
  expect(laborDetailDS.item.finishdatetime).toBeDefined();
});

it('Workorder onClickEditLabor', async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'page'});
  const reportPage = new Page({name: 'report_work'});
  const reportWorkController = new ReportWorkPageController();

  app.client = {
    userInfo: {
      loginID: "sam",
      personid: 'SAM',
      labor: {laborcode: 'SAM', laborcraftrate: {craft: 'ELECT', skilllevel: 'SECONDCLASS'}}
    }
  };

  app.registerController(controller);
  reportPage.registerController(reportWorkController);

  const ds = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(ds);

  const wolistds = newDatasource(workorderitem, "todaywoassignedDS");
  page.registerDatasource(wolistds);

  const wodetails = newDatasource(workorderitem, 'wodetails');
  page.registerDatasource(wodetails);

  const laborDetailDS = newLaborDetailDatasource(labor, 'woLaborDetaildsOnSchedule');
  page.registerDatasource(laborDetailDS);

  const reportWorkLabords = newDatasource(statusitem, 'reportworkLabords');
  reportPage.registerDatasource(reportWorkLabords);

  const woReportWorkDs = newDatasourceGlobal(workorderitem, "member", "wonum", "woDetailsReportWork");
  const craftrate = newDatasourceGlobal(labor, "craftrate", "craft", "craftrate");
  const reportworksSynonymData = newStatusDatasource(statusitem, "reportworksSynonymData");
  const inventoryDS = newDatasourceGlobal(wpmaterial, 'member', 'wonum', 'inventoryDS');
  const synonymDSData = newStatusDatasource(statusitem, 'synonymDSData');
  const locationDS = newStatusDatasource(wolocationmeters, 'locationDS');
  const laborDs = newDatasourceGlobal(labor, "labordetails", "labtransid", "laborDs");
  const labordetails = newDatasourceGlobal(labor, "labordetails", "labtransid", "reportworkLaborDetailds");

  reportPage.registerDatasource(woReportWorkDs);
  reportPage.registerDatasource(craftrate);
  reportPage.registerDatasource(reportworksSynonymData);
  reportPage.registerDatasource(inventoryDS);
  reportPage.registerDatasource(synonymDSData);
  reportPage.registerDatasource(locationDS);
  reportPage.registerDatasource(labordetails);
  app.registerDatasource(laborDs);
  app.registerDatasource(craftrate);

  const items = await wodetails.load();

  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  reportWorkController.pageInitialized(reportPage, app);

  app.currentPage = reportPage;
  await controller.onClickEditLabor({item: items[1], datasource: wodetails, action: 'stop'});
  expect(mockSetPage.mock.calls.length).toBe(1);
});

it('Workorder onClickSendLabTrans', async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'page'});
  const reportPage = new Page({name: 'report_work'});
  const reportWorkController = new ReportWorkPageController();

  app.client = {
    userInfo: {
      loginID: "sam",
      personid: 'SAM',labor: {laborcode: 'SAM'}
    },
  };

  app.registerController(controller);
  reportPage.registerController(reportWorkController);

  const ds = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(ds);

  const wolistds = newDatasource(workorderitem, "todaywoassignedDS");
  page.state = {'selectedDS': 'todaywoassignedDS'};
  page.registerDatasource(wolistds);

  const wodetails = newDatasource(workorderitem, 'wodetails');
  page.registerDatasource(wodetails);
  
  const reportWorkLabords = newDatasource(statusitem, 'reportworkLabords');
  reportPage.registerDatasource(reportWorkLabords);
  
  const woDetailsReportWork = newDatasourceGlobal(labor, "wodetails", "wonum", "woDetailsReportWork");
  const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
  const reportworksSynonymData = newStatusDatasource(statusitem, 'reportworksSynonymData');
  const inventoryDS = materialDatasource(wpmaterial, 'member', 'inventoryDS');
  const locationDS = newStatusDatasource(wolocationmeters, 'locationDS');
  const itemsDS = newDatasource(wpmaterial, 'member', 'itemnum', 'itemsDS');
  const synonymDSData = newStatusDatasource(statusitem, 'synonymDSData');
    
  reportPage.registerDatasource(woDetailsReportWork);
  reportPage.registerDatasource(craftrate);
  
  reportPage.registerDatasource(reportworksSynonymData);    
  reportPage.registerDatasource(inventoryDS);
  reportPage.registerDatasource(locationDS);
  reportPage.registerDatasource(synonymDSData);
  app.registerDatasource(itemsDS);
  
  const items = await wodetails.load();

  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  reportWorkController.pageInitialized(reportPage, app);

  const startStopTimerStub = sinon.stub(WOTimerUtil, 'clickSendLabTrans');  app.currentPage = reportPage;
  await controller.onClickSendLabTrans({item: items[1], datasource: wodetails, action: 'stop'});
  expect(startStopTimerStub.called).toBe(true);
});

describe("filterListUsingPageParams", () => {
  it("should return if no datasource is selected not in map mode", async () => {
    const controller = new SchedulePageController();
    const app = new Application();
    const page = new Page({name: 'SchedulePage'});
    const page1 = new Page({ name: 'report_work' });
    const todaywoassignedDS = newDatasource(workorderitem, 'todaywoassignedDS');
    page.registerDatasource(todaywoassignedDS);
    await todaywoassignedDS.load();
    app.registerController(controller);
    app.registerPage(page);
    app.registerPage(page1);

    controller.pageInitialized(page,app);
    page.state.selectedDS = null;
    page.state.selectedSwitch = 0;

    const openWOCardSpy = jest.spyOn(controller, "openWOCard");
    await controller.filterListUsingPageParams("12345");
    expect(openWOCardSpy).not.toHaveBeenCalled();
  });

  it("should call openWOCard when coming to map page from details or other applications", async () => {
    const controller = new SchedulePageController();
    const app = new Application();
    const page = new Page({name: 'SchedulePage'});
    const page1 = new Page({ name: 'report_work' });
    const todaywoassignedDS = newDatasource(workorderitem, 'todaywoassignedDS');
    page.registerDatasource(todaywoassignedDS);
    await todaywoassignedDS.load();

    await app.initialize();
    app.setCurrentPage = page;
    app.registerController(controller);
    app.registerPage(page);
    app.registerPage(page1);

    controller.pageInitialized(page,app);
    page.state = {'selectedDS': 'todaywoassignedDS'};
    page.state.selectedSwitch = 1;

    const openWOCardSpy = jest.spyOn(controller, "openWOCard");
    await controller.filterListUsingPageParams("12345");
    expect(openWOCardSpy).toHaveBeenCalled();
  });
});

it('Hide/show Get Materials & tools button from the work order list page', async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'page'});
  page.state = {
    firstLogin: false
  }
  app.client = {
    userInfo: {
      loginID: "sam",
      personid: "SAM",
      labor: {
        laborcode: "SAM",
        laborcraftrate: {
          craft: "Electrician",
          skilllevel: "Electrician - 2nd Class",
        },
      },
    },
  };

  app.registerController(controller);
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);

  let firstLoginData = 'Wed Feb 12 2025 10:40:09 GMT+0530 (India Standard Time)';
  localStorage.setItem('logindata_sam', firstLoginData);
  controller.trackUserLogin(page, 'sam');

  expect(page.state.firstLogin).toEqual(true);

  firstLoginData = new Date();
  localStorage.setItem('logindata_sam', firstLoginData);
  controller.trackUserLogin(page, 'sam');

  expect(page.state.firstLogin).toEqual(true);
});

it('should open wocard on map view', async () => {
  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'schedule'});
  const ds = newDatasource(workorderitem, 'workorderds');
  app.registerController(controller);
  await app.initialize();
  page.state = {'selectedDS': 'workorderds'};
  page.datasources = [ds];
  controller.pageInitialized(page, app);
  page.registerDatasource(ds);
  let event = {
    item: {
      wonum: '1201'
    },
    prevPage: 'schedulecardlist'
  }

  await controller.openWOCard(event);
  expect(page.state.showMapOverlay).toEqual(1);
  expect(page.state.previousPage).toEqual('schedulecardlist');

  event = {
    wonum: '1201',
    prevPage: 'schedulecardlist'
  }

  await controller.openWOCard(event);
  expect(page.state.showMapOverlay).toEqual(1);
  expect(page.state.previousPage).toEqual('mapwolist');
});

it('should render the page from where it came on map view', async () => {
  const controller = new SchedulePageController();
  const app = new Application();
  let page = new Page({name: 'schedule'});
  const page1 = new Page({ name: 'report_work' });
  const ds = newDatasource(workorderitem, 'workorderds');
  app.registerController(controller);
  await app.initialize();
  page.state = {'selectedDS': 'workorderds', 'previousPage': 'mapwolist'};
  page.datasources = [ds];
  controller.pageInitialized(page, app);
  page.registerDatasource(ds);
  let event = {
    item: {
      wonum: '1201'
    },
  }

  page.state = {'selectedDS': 'workorderds', 'previousPage': 'schedulecardlist'};
  await controller.openPrevPage(event);
  expect(page.state.selectedSwitch).toEqual(0);


  page = new Page({name: 'workOrderDetails'});
  app.registerPage(page);
  app.registerPage(page1);
	page1.state.fieldChangedManually = false;
  controller.pageInitialized(page, app);
  page.state = {'selectedDS': 'workorderds', 'previousPage': 'wodetail'};
  
  const todaywoassignedDS = newDatasource(workorderitem, 'todaywoassignedDS');
  page.registerDatasource(todaywoassignedDS);
  
  await controller.openPrevPage(event);
  expect(controller.app.currentPage.title).toEqual('workOrderDetails');
  expect(page.state.previousPage).toEqual('wodetail');

  page = new Page({name: 'workOrderDetails'});
  app.registerPage(page);
  controller.pageInitialized(page, app);
  page.state = {'selectedDS': 'workorderds', 'previousPage': 'wodetail', 'mapOriginPage': 'wodetail'};
  await controller.openPrevPage(event);
  expect(page.state.previousPage).toEqual('schedulecardlist');
});

it('should set height of wolist for mobile on map view', async () => {
  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'schedule'});

  app.registerController(controller);
  await app.initialize();
  let device = Device.get();
  device.isMobile = true;

  controller.pageInitialized(page, app);
  expect(page.state.mapWOListHeight).toEqual('35%');
});

it('should open a map view of a work order from work order list page', async () => {
  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'schedule'});
  page.state = {'selectedDS': 'todaywoassignedDS'};
  const todaywoassignedDS = newDatasource(workorderitem, 'todaywoassignedDS');
  page.registerDatasource(todaywoassignedDS);
  
  app.registerController(controller);
  await app.initialize();

  controller.pageInitialized(page, app);

  await controller.openMapPage(todaywoassignedDS);
  expect(page.state.selectedSwitch).toEqual(1);
});


it('should point workorder when open map', async () => {
  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'schedule'});
  page.state = {'selectedDS': 'todaywoassignedDS'};
  const todaywoassignedDS = newDatasource(workorderitem, 'todaywoassignedDS');
  page.registerDatasource(todaywoassignedDS);

  app.registerController(controller);
  await app.initialize();
   
  controller.pageInitialized(page, app);
  app.map = true;

  const callControllerSpy = jest.spyOn(controller, "handleItemClick").mockImplementation(() => true);
  let item = {coordinate:'XY', 
             formattedaddress: "IBM Gift City",
             href: "oslc/os/mxapiwodetail/_QkVERk9SRC8xNDI4",
             autolocate: "{\"coordinates\":[6.529388579793247E-4,2.080922436000822E-4],\"type\":\"Point\"}",
             wonum: "428"
            }
  controller.openMap(item);
  expect(callControllerSpy).toBeCalled();
});

it('should reset datasource when switched to wo card list', async () => {
  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'schedule'});
  page.state = {'selectedDS': 'workorderds'};

  app.registerController(controller);
  const ds = newDatasource(workorderitem, 'workorderds');
  page.registerDatasource(ds);
  controller.pageInitialized(page, app);
  controller.showCardList();

  expect(page.state.showMapOverlay).toEqual(0);
});

it('should reset default state', async () => {
  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'schedule'});

  app.registerController(controller);
  controller.pageInitialized(page, app);
  controller.setDefaults();
  expect(page.state.selectedSwitch).toEqual(0);
});

it('should get travel system properties', async () => {
  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'schedule'});
  app.client = {
    userInfo: {
      personid: 'SAM', loginID: "sam", labor: { laborcode: 'SAM' }
    }
  }
  app.client.getSystemProperties = jest.fn();
  app.geolocation.updateGeolocation = jest.fn();

  app.registerController(controller);
  controller.pageInitialized(page, app);
  commonUtil.getTravelSystemProperties(app);
  expect(app.client.getSystemProperties).toBeCalled();  
});

it('resets mapoverlay for map content when switched to map view', async () => {
  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'schedule'});
  controller.pageInitialized(page, app);
  controller.showMapList();
  expect(page.state.showMapOverlay).toEqual(0);
});

it('should change work order status to approve',  async  () => {
  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page();

  const synonymStatusDS = newStatusDatasource();
  const woListDs = newWOListDatasource();
  const ds1 = newDatasource(undefined, "pmduewolistDS");
  page.registerDatasource(ds1);
  page.state.selectedSwitch = 1;
  page.state.showMapOverlay = 1;

  const mockSetPage = jest.fn();
  let invokeAction = sinon.stub(woListDs, "invokeAction").returns({});
  app.registerDatasource(synonymStatusDS);
  page.registerDatasource(woListDs);
  app.registerController(controller);

  await app.initialize();
  app.setCurrentPage = mockSetPage;
  app.state = {
    systemProp: {
      'maximo.mobile.wostatusforesig': 'APPR,INPROG',
      'mxe.mobile.travel.prompt': '1',
    },
  };
  controller.pageInitialized(page, app);
  await controller.changeWorkorderStatus({item: {href: 'href', workorderid: '12345'}, status: 'WOSTATUS|APPR'});
  expect(invokeAction.called).toBe(true);
});

it("Workorder estimated cost drawer should open", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: "page"});

  app.client = {
    userInfo: {
      loginID: "sam",
      baseCurrency: 'USD'
    }
  }

  app.registerController(controller);
  app.registerPage(page);
  const wodetails = newDatasource(workorderitem, "wodetails");
  await wodetails.load();
  page.registerDatasource(wodetails);

  const woCost = newWOCostDatasource(wocost, "dsWoTotal");
  const jsondsWoTotal = newWOCostDatasource(jwocost, "jsondsWoTotal");
  jsondsWoTotal.getSchema = () =>  jwocost.responseInfo.schema;

  await woCost.load();
  await jsondsWoTotal.load();

  page.registerDatasource(jsondsWoTotal);
  page.registerDatasource(woCost);

  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);

  await controller.openWoTotalCostDrawer({item: {href: 'href'}});

  expect(page.state.woCostDrawerTitle).toEqual('Cost');
});

it('should set padding of wolist on talet on map view', async () => {
  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'schedule'});

  app.registerController(controller);
  await app.initialize();
  let device = Device.get();
  device.isTablet = true;

  controller.pageInitialized(page, app);
  expect(page.state.mapPaddingRight).toEqual('1rem');
  expect(page.state.mapPaddingLeft).toEqual('0.5rem');
  expect(page.state.mapWOListHeight).toEqual('25%');
});

it('should set bottom of wolist on mobile on map view', async () => {
  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'schedule'});

  app.registerController(controller);
  await app.initialize();
  let device = Device.get();

  controller.pageInitialized(page, app);
  expect(page.state.mapPaddingBottom).toEqual('calc(100vh - 9rem)');

  device.isMaximoMobile = true;
  controller.pageInitialized(page, app);
  expect(page.state.mapPaddingBottom).toEqual('calc(100vh - 5rem)');
});

it("should forceReload method called on the woCard of map view", async () => {
  global.open = jest.fn();  
  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: "schedule"});
  const page1 = new Page({ name: 'report_work' });
  app.registerController(controller);
  app.registerPage(page);
  app.registerPage(page1);
	page1.state.fieldChangedManually = false;
  
  const ds = newDatasource(undefined, "todaywoassignedDS");
  const ds2 = newDatasource(undefined, "pmduewolistDS");
  page.registerDatasource(ds);
  page.registerDatasource(ds2);
  page.state.selectedSwitch = 1;
  page.state.showMapOverlay = 1;
      
  await app.initialize();
  let forceReloadStubAssigned = sinon.stub(ds, 'forceReload');
  let forceReloadStub = sinon.stub(ds2, 'forceReload');
  await ds.forceReload();
  await ds2.forceReload();
  controller.pageInitialized(page, app);
  
  expect(forceReloadStubAssigned.called).toBe(true);
  expect(forceReloadStub.called).toBe(true);

  forceReloadStubAssigned.restore();
  forceReloadStub.restore();
});

it('should set LogType', async () => {
  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({ name: 'schedulePage' });
  app.registerController(controller);
  await app.initialize();
  controller.pageInitialized(page, app);
  let event = {value: 'APPTNOTE', description: 'Appointment Note'};
  controller.setLogType(event);
  expect(page.state.defaultLogType).toBe('APPTNOTE');
});

it("it should set saveDataSuccessful to false ", async () => {
  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'SchedulePage'});
  const page1 = new Page({ name: 'report_work' });
  
  app.state.systemProp = {
    'mxe.mobile.travel.prompt': '1'
  };

  const todaywoassignedDS = newDatasource(workorderitem, 'todaywoassignedDS');
  page.registerDatasource(todaywoassignedDS);
  
  const pmduewolistDS = newDatasource(workorderitem, 'pmduewolistDS');
  page.registerDatasource(pmduewolistDS);
  
  await todaywoassignedDS.load();
  await pmduewolistDS.load();
  app.registerController(controller);
  app.registerPage(page);
  app.registerPage(page1);
	page1.state.fieldChangedManually = false;
  await app.initialize();
  controller.onUpdateDataFailed();
  expect(controller.saveDataSuccessful).toBe(false);      
});

it("it should handleDeleteTransaction", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();
  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: "schedule"});
  
  const todaywoassignedDS = newDatasource(workorderitem, 'todaywoassignedDS');
  app.registerDatasource(todaywoassignedDS);
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  app.currentPage = page;
  controller.pageInitialized(page, app);
  
  page.state = {
    breadcrumbWidth: 68,
    selectedDS : 'todaywoassignedDS'
  }

  let txn = {
    app: "Application",
    href: "testhref",
  };
  
  await controller.handleDeleteTransaction(txn);
  
  // let txn1 = {
  //   app: "Applicationtest",
  //   href: "testhref",
  // };
  
  await controller.handleDeleteTransaction();
});

it('should open Safety Plans drawer for assigned/unassigned work order', async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'page'});

  app.registerController(controller);
  // Creating a datasource with assignment object for test
  let ds = newDatasource(workorderitem, 'woDetailds');
  app.registerDatasource(ds);
  let items = await ds.load();
  let showDialogSpy = sinon.spy(page, 'showDialog');
  const dsLoad = sinon.spy(ds, 'load'); 
  app.registerController(controller);
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  await controller.openHazardDrawer({'item': items[0], 'datasource': ds});
  expect(dsLoad.called).toBe(true);
  window.setTimeout(() => {
    expect(showDialogSpy.getCall(0).args[0]).toStrictEqual('slidingwohazard');
  }, 50);

  app.resetDatasources();

  // reassigning the datasource with no assignment object for test
  ds = newDatasource(unassignedworkorderitem, 'woDetailds');
  items = await ds.load();
  await controller.openHazardDrawer({ 'item': items[0], 'datasource': ds });
  window.setTimeout(() => {
    expect(showDialogSpy.getCall(0).args[0]).toStrictEqual('slidingwohazard');
  }, 50);
});
it('should review Safety Plan for assigned/unassigned workorder', async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'page'});

  app.registerController(controller);
  // Creating a datasource with assignment object for test
  let ds = newDatasource(workorderitem, 'woDetailds');
  app.registerDatasource(ds);
  const wodetailsDs = newDatasource(workorderitem, 'wodetails');
  app.registerDatasource(wodetailsDs);
  await ds.load();
  let updateAction = sinon.stub(ds, "update");
  app.registerController(controller);
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);
  await controller.reviewSafetyPlan(app);
  //in case of assigned workorder datasource update method to be used for review date update
  expect(updateAction.called).toBe(false);

  // reassigning the datasource with no assignment object for test
  await ds.clearState();
  ds = newDatasource(unassignedworkorderitem, 'woDetailds');
  await ds.load();
  await controller.reviewSafetyPlan(app);
  //in case of unassigned workorder datasource update method to be used for review date update
  expect(updateAction.called).toBe(true);
});

it('should validate handleMapLongPress', async () => {
  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'page'});

  app.registerController(controller);
  app.registerController(controller);
  app.client = {
    userInfo: {
      loginID: "sam",
      personid: "SAM",     
      },
    checkSigOption: (option) => true,
    findSigOption: (appName, sigoption) => true,
  };
  await app.initialize();
  let data = {
    coordinate: [12.1212121212,12.1212121212],
  };
  controller.pageInitialized(page, app);
  await controller.handleMapLongPress(data);
  controller.goToCreateWoPage();
  expect(app.state.currentMapData.coordinate).not.toBe(undefined);
});

it('should validate handleMapLongPress with gisMaximoRelationshipConfig state', async () => {
  const controller =  new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'SchedulePage'});

  app.registerController(controller);
  app.registerController(controller);
  app.client = {
    userInfo: {
      loginID: "sam",
      personid: "SAM",     
      },
    checkSigOption: (option) => true,
    findSigOption: (appName, sigoption) => true,
  };

  await app.initialize();
  controller.pageInitialized(page, app);
  
  app.map = {
    getIntegrationGISData: jest.fn(()=>{
      return {
        geometryCenter: [-13045940.235099997, 4036505.349949997],
        mboValues: [{description: '2502'}]
      }
    }),
  };

  page.state.gisMaximoRelationshipConfig = {
    gisLayerName: "Units",
    returnCenter: true,
    toleranceLevel: 20,
    fieldRelationships: '[{"gisField":"ObjectID", "mboField":"description", "mboFieldType":"string"}]',
  }
  
  expect(app.map).toBeDefined();

  let data = {
    coordinate: [12.1212121212,12.1212121212],
    position: [730.0185546875, 65.89349365234375]
  };

  await controller.handleMapLongPress(data);
  
  expect(app.map.getIntegrationGISData).toBeCalled()
  expect(app.state.currentMapData.coordinate).toStrictEqual([-13045940.235099997, 4036505.349949997]);
  expect(app.state.currentMapData.gisIntegrationData).toStrictEqual([{description: '2502'}]);
});

it("should not call forceSync ", async () => {
  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'SchedulePage'});
  const page1 = new Page({ name: 'report_work' });
  
  const todaywoassignedDS = newDatasource(workorderitem, 'todaywoassignedDS');
  page.registerDatasource(todaywoassignedDS);
  
  const pmduewolistDS = newDatasource(workorderitem, 'pmduewolistDS');
  page.registerDatasource(pmduewolistDS);  

  let syncSpy = sinon.spy(todaywoassignedDS, 'forceSync');
  let reloadSpy = sinon.spy(todaywoassignedDS, 'forceReload');
  
  app.registerController(controller);
  app.registerPage(page);
  app.registerPage(page1);
	app.state.refreshOnSubsequentLogin = false;
  page.state.selectedDS = 'todaywoassignedDS';
  CommonUtil.getBasemapSpatialReference = jest.fn();
  await app.initialize();
  app.setCurrentPage = page;

  sinon.assert.notCalled(syncSpy);
  sinon.assert.calledOnce(reloadSpy);
});

it("should call pagePause", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();

  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'page'});

  const ds = newDatasource(workorderitem, "myworkDS");
  page.registerDatasource(ds);
  app.state = {
    incomingContext: {
      breadcrumb: {
        enableReturnBreadcrumb: true
      }
    },
    screen: {
      size: 'sm'
    }
  };
  page.state = {
    breadcrumbWidth: 68,
    selectedDS : 'myworkDS'
  }

  app.client = {
    userInfo: {
      loginID: "sam",
      personid: "SAM",
      labor: {
        laborcode: "SAM",
        laborcraftrate: {
          craft: "Electrician",
          skilllevel: "Electrician - 2nd Class",
        },
      },
    },
    checkSigOption: (option) => true,
    findSigOption: (appName, sigoption) => true,
  };
  app.registerController(controller);
  const overdueDS = newDatasource(workorderitem, 'overdueDS');
  const todaywoassignedDS = newDatasource(workorderitem, 'todaywoassignedDS');
  const pmduewolistDS = newDatasource(workorderitem, 'pmduewolistDS');
  page.registerDatasource(overdueDS);
  page.registerDatasource(todaywoassignedDS);
  page.registerDatasource(pmduewolistDS);
  await app.initialize();

  app.setCurrentPage = mockSetPage;
  controller.pageInitialized(page, app);

  jest.spyOn(page, 'findDialog');

  await controller.pagePaused();
  expect(page.findDialog('workLogDrawer')).toBeDefined();
});

it('should call deleteTimerEntry with correct arguments', async () => {
  const app = new Application();
  const schPage = new Page({
    name: "schedule",
    state: { selectedDS: "woLaborDetaildsOnSchedule" },
  });
  const controller = new SchedulePageController();
  const laborDetailDS = newLaborDetailDatasource(labor, "woLaborDetailds");
  app.registerController(controller);
  app.registerDatasource(laborDetailDS);
  schPage.registerDatasource(laborDetailDS);
  controller.pageInitialized(schPage, app);
  const deleteAction = sinon.stub(laborDetailDS, "deleteItem");
  await controller.onDeleteEntry(app, schPage);
  expect(deleteAction.called).toBe(true);
});

describe('@maximo/map-component', () => {
  function getItem(datasource, maximoAttributes, isMarkerLayer = false) {
    if (!maximoAttributes) {
      return {
        hasFeature: false,
        featuresAndLayers: [],
      }
    }
  
    const feature = new Map();
    feature.set('maximoAttributes', maximoAttributes);
  
    const features = [feature]
  
    const layer = new Map();
    layer.set('datasource', datasource);
    layer.set('isMarkerLayer', false);
  
    const featuresAndLayers = [{}]
    featuresAndLayers[0].layer = layer;
  
    if (isMarkerLayer) {
      featuresAndLayers[0].feature = features;
    } else {
      featuresAndLayers[0].feature = new Map();
      featuresAndLayers[0].feature.set('features', features);
      featuresAndLayers[0].feature.values_ = {};
      featuresAndLayers[0].feature.values_.features = features;
    }
    
    return {
      hasFeature: true,
      featuresAndLayers,
    }
  
  }

  it('should change info on handleMapClick method', async () => {
    const controller = new class extends SchedulePageController {
      onMapInitialized() {}
    };
    
    const app = new Application();
    app.registerController(controller);
    
    const page = new Page({ name: 'schedule '});
    const datasource = newDatasource(workorderitem, 'todaywoassignedDS');
    page.registerDatasource(datasource);
  
    page.state = { selectedDS: 'todaywoassignedDS' };
    
    await app.initialize();
    
    controller.pageInitialized(page, app);
    
    controller.page.state.selectedSwitch = 1;
  
    controller.app.map = {
      getNewStyle: jest.fn(),
      changeFeatureStyle: jest.fn(),
      isFeatureHighlighed: jest.fn(),
    };
  
    expect(controller.app.map).toBeDefined();
  
    const [item0, item1] = await datasource.load();
    let item = null;
  
    item = getItem(datasource, item0);
    await controller.handleMapClick(item);
    
    expect(datasource.dataAdapter.items[0].wonum).toBe(item0.wonum);
  
    item = getItem(datasource, item1);
    await controller.handleMapClick(item);
  
    expect(datasource.dataAdapter.items[1].wonum).toBe(item1.wonum);
  
  });
})

 // Assisted by watsonx Code Assistant 
 
describe('changeAssignment function', () => {
  it('should verify changeAssignment executes method properly', async () => {
    const app = new Application({
      state: {assignmentLoading:'true' },
    });
    //  app.currentPage.name = 'schedule';
    const schPage = new Page({
      name: "schedule",
      state: { selectedDS: "woLaborDetaildsOnSchedule" },
    });
    const labor = {
      laborcode: 'wilson',
      displayname: 'mike wilson',
      orgid: 'EAGLENA',
      siteid: 'BEDFORD',
    }
    const labor1 = {
      laborcode: 'SAM',
      displayname: 'SAM wilson',
      orgid: 'EAGLENA',
      siteid: 'BEDFORD',
    }

    app.currentPage = {
      name: 'schedule'
    }
    app.setCurrentPage = jest.fn();
    app.client = {
      userInfo: {
        personid: 'wilson'
      }
    };

    app.lastPage = { name:'relatedWorkOrder' }
    app.toast = jest.fn();
    const controller = new SchedulePageController();
    const laborDetailDS = newLaborDetailDatasource(labor, "woLaborDetailds");
    const workorderobj = {...workorderitem};
    workorderobj.labtrans = [
      {
      "laborcode": "wilson",
      "transtype_maxvalue": "WORK",
      "labtransid": 100051,
      "timerstatus_maxvalue": "COMPLETE",
      },
      {
      "laborcode": "SAM",
      "transtype_maxvalue": "WORK",
      "labtransid": 100059,
      "timerstatus_maxvalue": "ACTIVE",
      }
    ]
    const wolist = newDatasource(workorderobj, "wodetails");
    const woDetailds = newDatasource(workorderitem, "woDetailds");
    app.registerDatasource(woDetailds);
    app.registerDatasource(wolist);
    app.registerController(controller);
    app.registerDatasource(laborDetailDS);

    jest.spyOn(CommonUtil, 'removeAssigned');

    sinon.stub(app,"checkSigOption").returns(false)
    const wolistds = newDatasource(workorderitem, "todaywoassignedDS");
    schPage.state = { 'selectedDS': 'todaywoassignedDS' };
    app.registerDatasource(wolistds);
    schPage.registerDatasource(wolistds);
    schPage.registerDatasource(laborDetailDS);
    schPage.registerDatasource(woDetailds);
    await woDetailds.load();
    const forceloadstublist = sinon.stub(wolist, 'forceReload');
    const forceloadstub = sinon.stub(woDetailds, 'forceReload');


    app.registerController(controller);
    schPage.registerController(controller);
    await app.initialize();
    controller.pageInitialized(schPage, app);

    jest.spyOn(CommonUtil, 'completeAssigned').mockImplementationOnce(() => false);
    await controller.changeAssignment();

    await controller.changeAssignment(labor);
    expect(app.state.assignmentLoading).toBe(false);

    controller.addNewAssignment = jest.fn();
    await controller.changeAssignment(labor);
    expect(app.state.assignmentLoading).toBe(false);
    forceloadstub.restore();
    forceloadstublist.restore();

    await controller.changeAssignment();
    expect(app.state.assignmentLoading).toBe(false);

    app.currentPage = {
      name: 'wodetails'
    }
    const naviagteStub = jest.spyOn(app, 'navigateBack');
    await controller.changeAssignment(labor1);
    expect(naviagteStub).toHaveBeenCalled();
  });
});

describe('openReassignmentDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const event = {
    item: {
      computedTimerStatus: false,
      href: 'example.com'
    }
  };
  const event1 = {
    item: {
      computedTimerStatus: false,
      href: ''
    }
  };
  const woDetailDs = {
    load: jest.fn()
  };
  const app = {
    findDatasource: jest.fn(() => woDetailDs),
    getLocalizedLabel: jest.fn(() => 'example label'),
    toast: jest.fn(),
    showDialog: jest.fn(),
    client: {
      userInfo: {
        personid: 'wilson'
      }
    },
    state: {},
  };
  const CommonUtil = {
    sharedData: {
      allowReassignmentPage: {},
      event: {},
      reassignDialogConfig: {}
    },
    getConfirmDialogLabel: jest.fn()
  };

  it('should load woDetailDs and show confirmDialog', async () => {
    const controller = new SchedulePageController();
    const page = new Page({name: 'page'});
    controller.pageInitialized(page, app);
    await controller.openReassignmentDialog(event);
    expect(woDetailDs.load).toHaveBeenCalledWith({
      noCache: true,
      itemUrl: event.item.href
    });
    expect(app.showDialog).toHaveBeenCalledWith('confirmDialog');
    await controller.openReassignmentDialog(event1);
  });

  it('should return if computedTimerStatus is true or one case say labor record has started', async () => {
    event.item.computedTimerStatus = true;
    const controller = new SchedulePageController();
    const page = new Page({name: 'page'});
    controller.pageInitialized(page, app);
    event.item.computedTimerStatus = true;
    await controller.openReassignmentDialog(event);
    expect(app.toast).toHaveBeenCalled();
    expect(woDetailDs.load).not.toHaveBeenCalled();
    expect(CommonUtil.getConfirmDialogLabel).not.toHaveBeenCalled();
    expect(app.showDialog).not.toHaveBeenCalled();
  });
});

 // Assisted by watsonx Code Assistant 
 
 describe('computedUserName', () => {
   it('should return the displayname if it exists, otherwise return the personid', async () => {
     const itemWithDisplayName = { displayname: 'WILSON' };

     const controller = new SchedulePageController();
     const app = new Application();
     const page = new Page({
        name: 'schedule',
      });
      controller.pageInitialized(page, app);
      app.registerController(controller);
      await app.initialize();
 
     expect(controller.computedUserName(itemWithDisplayName)).toBe('WILSON');


     const itemWithoutDisplayName = { personid: 'ADMIN' };
     expect(controller.computedUserName(itemWithoutDisplayName)).toBe('ADMIN');
   });
 });
 
 it('should call onResetSharedConfirmationVariable', async () => {

  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({
     name: 'schedule',
  });
  controller.pageInitialized(page, app);
  app.registerController(controller);
  await app.initialize();

  const resetSharedConfirmationVariableSpy = jest.spyOn(WOTimerUtil, 'resetSharedConfirmationVariable');
  controller.onResetSharedConfirmationVariable(app)
  expect(resetSharedConfirmationVariableSpy).toBeCalled();
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
});

it('should call unassignment', async () => {
  const controller = new SchedulePageController();
  const app = new Application(
  );
  const page = new Page({
     name: 'schedule',
  });

  const event  ={
  item : {
    wonum : "1001"
  }
  }

  controller.pageInitialized(page, app);
  app.registerController(controller);
  await app.initialize();

  CommonUtil.sharedData.clickedUnassignment = false;
  CommonUtil.sharedData.allowReassignmentPage = {};
  CommonUtil.sharedData.event = {};
  
  sinon.stub(controller, 'rejectWO');
  jest.spyOn(CommonUtil, 'clearSharedData');
  controller.unassignment(event);
  expect(app.state.assignmentLoading).toBe(true);
});

// Assisted by watsonx Code Assistant 

describe("openReassignmentDrawer", () => {
  it("should set app state canReturn to true", async () => {
  const controller = new SchedulePageController();
   
  const app = new Application({
    state: {
      canReturn: false,
    },
    findDatasource: jest.fn(() => ({
      showReturn: jest.fn(),
      load: () => workorderitem,
    })),
    showDialog: jest.fn(),
  });
  const page = new Page({
     name: 'schedule',
  });
  sinon.stub(CommonUtil, "showReturn");
  controller.pageInitialized(page, app);
  const woDetailds = newDatasource(workorderitem, "wodetails");
  app.registerDatasource(woDetailds);
  await woDetailds.load();
  app.registerController(controller);
  await app.initialize();
  await controller.openReassignmentDrawer(app);
  expect(app.state.assignmentLoading).toBe(false);
 
  });

});


describe('calculateRemainingTime', () => {
  it('should return 0 when actualTime is greater than or equal to laborTime', () => {
    const controller = new SchedulePageController();
    const app = new Application({
      dataFormatter: {
        convertISOtoDate: jest.fn(),
        timeToDecimal: jest.fn(),
      },
    });

    const page = new Page({
       name: 'schedule',
    });
   
    controller.pageInitialized(page, app);
    app.registerController(controller);
    app.initialize();

    const laborTime = '2022-01-01T09:00:00Z';
    const actualTime = '2022-01-01T09:00:00Z';

    const result = controller.calculateRemainingTime(laborTime, actualTime);
    expect(result).toBe(0);
  });
});

// Assisted by watsonx Code Assistant 
describe('addNewAssignment', () => {
  it('should add a new assignment and save it', async () => {
    const controller = new SchedulePageController();
    const app = new Application();
    const page = new Page({
      name: 'schedule',
    });

    const assignmentDs = {
      "status_description": "ACCEPTED",
      "localref": "oslc/os/mxapiwodetail/_QkVERk9SRC8xMzI3/showassignment/0-706",
      "craft": "ELECT",
      "finishdate": "2025-03-27T09:18:33+00:00",
      "scheduledate": "2025-03-27T08:18:33+00:00",
      "assignmentid": 706,
      "laborcode": "WILSON",
      "labor": {
        "person": {
          "displayname": "Mike Wilson"
        },
        "personid": "WILSON"
      },
      "status_maxvalue": "ASSIGNED",
      "_rowstamp": "11725663",
      "skilllevel": "FIRSTCLASS",
      "href": "http://childkey#V09SS09SREVSL0FTU0lHTk1FTlQvNzA2",
      "laborhrs": 1,
      "status": "ACCEPTED",
      "_bulkid": "706"
    };

    const woDetailDS = newDatasource(workorderitem, 'woDetailds');
    app.registerDatasource(woDetailDS);

    controller.pageInitialized(page, app);
    app.registerController(controller);
    await app.initialize();




    const labor = { laborcode: 'LAB123' };
    const remainHours = 4;
    const assignedValue = { value: 'Assigned', maxvalue: 10, description: 'Assigned status' };
    const href = 'https://example.com/workorder/123';
    const records = { skilllevel: 'ELECT', craft: 'Electrician' };

    await controller.addNewAssignment(woDetailDS, records, labor, remainHours, href, assignedValue);

    const assignementDs = newDatasource(assignmentDs, 'assignmentDetailds');
    app.registerDatasource(assignementDs);
    await assignementDs.load();
    const addNewStub = jest.spyOn(assignementDs, "addNew");

    const records1 = !{};
    await controller.addNewAssignment(woDetailDS, records1,labor, remainHours, href, assignedValue);
    expect(addNewStub).toHaveBeenCalled();

  });

});


// Assisted by watsonx Code Assistant 

describe('dialogClosed', () => {
  it('should close the rejectAssignment and laborAssignmentLookup dialogs and clear shared data', () => {

  const controller = new SchedulePageController();
  const app = new Application();
  const page = new Page({name: 'schedule'});

  const clearSharedDataSpy = jest.spyOn(CommonUtil, 'clearSharedData');
  controller.pageInitialized(page, app);
  app.registerController(controller);
  app.initialize();
  
  
  controller.dialogClosed();
  expect(clearSharedDataSpy).toHaveBeenCalled();
  });
});
