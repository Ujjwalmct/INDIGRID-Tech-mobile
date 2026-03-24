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

import { Application, Page, JSONDataAdapter, Datasource, Device } from '@maximo/maximo-js-api';
import sinon from 'sinon';
import WOTimerUtil from './WOTimerUtil';
import CommonUtil from './CommonUtil';
import WOUtil from './WOUtil';
import ReportWorkPageController from '../ReportWorkPageController';

import workorderitem from '../test/wo-detail-json-data.js';
import labor from "../test/labors-json-data";
import statusitem from '../test/statuses-json-data.js';

function newDatasource(data = workorderitem, name = 'workorderds') {
	const da = new JSONDataAdapter({
		src: data,
		items: 'member',
		schema: 'responseInfo.schema',
	});

	const ds = new Datasource(da, {
		idAttribute: 'wonum',
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

function newDatasourceNew(data = workorderitem, items = "member", idAttribute = "wonum", name = "woDetailsReportWork") {
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

describe('WOTimerUtil', () => {
  it('computedTimerStatus function to show/hide button ', async () => {
    let hideStartButton = WOTimerUtil.computedTimerStatus({
      wonum: '1022',
      description: '13170 problem',
      labtrans: [
        {
          laborcode: 'SAM',
          timerstatus: 'Active',
          timerstatus_maxvalue: 'ACTIVE',
        },
      ],
    }, 'SAM');
    expect(hideStartButton).toBe(true);

    hideStartButton = WOTimerUtil.computedTimerStatus({
      wonum: '1022',
      description: '13170 problem',
      labtrans: [
        {
          laborcode: 'SAM',
          timerstatus: 'Complete',
          timerstatus_maxvalue: 'COMPLETE',
        }
      ]
    }, 'SAM');
    expect(hideStartButton).toBe(false);
  });

  const defaultSetDs = {
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
            varname: "CONFIRMLABTRANS",
            vartype: "ORG",
            varvalue: "1"
          }
        ]
      },
      {
        _rowstamp: "731935",
        itemsetid: "SET1",
        href: "oslc/os/mxapiorganization/_RUFHTEVOQQ--",
        orgid: "EAGLENA",
        mobilemaxvars: [
          {
            maxvarsid: 2252,
            orgid: null,
            varname: "STARTTIMERINPRG",
            vartype: "SYSTEM",
            varvalue: "1"
          }
        ]
      }
    ]
  };

  function newDefaultSetDataSource(data = defaultSetDs, name = "defaultSetDs") {
    const da = new JSONDataAdapter({
      src: data,
      items: 'member',
    });
  
    const ds = new Datasource(da, {
      idAttribute: "itemsetid",
      name: 'defaultSetDs',
    });
  
    return ds;
  };

  it('openConFirmLabTimeDialog', async () => {
    let mockSetPage = jest.fn();
    global.open = jest.fn();
  
    const app = new Application();
    const page = new Page({ name: 'page', state: {} });
    const reportPage = new Page({ name: 'report_work' });
    const reportWorkController = new ReportWorkPageController();

    const ds = newStatusDatasource(statusitem, 'synonymdomainData');
    app.registerDatasource(ds);    

    const laborDetailDS = newLaborDetailDatasource(labor, 'woLaborDetailds');
    page.registerDatasource(laborDetailDS);
  
    reportPage.registerController(reportWorkController);

    app.client = {
      userInfo: {
        personid: 'SAM',
        labor: {
          laborcode: 'SAM'
        }
      },
    };

    app.setCurrentPage = mockSetPage;
    app.currentPage = reportPage;
    expect(laborDetailDS.item.finishdatetime).toBeUndefined();
    await WOTimerUtil.openConFirmLabTimeDialog(app, page, laborDetailDS, 'stop', 'woConfirmLabTime', 'work');
    expect(laborDetailDS.item.finishdatetime).toBeDefined();
    expect(page.state.woactionType).toEqual('work');

    const defaultSetDs = newDefaultSetDataSource();
    app.registerDatasource(defaultSetDs);
    await defaultSetDs.load();

    const wodetails = newDatasource(workorderitem, 'woDetailResource');
    page.registerDatasource(wodetails);
    
    app.state.networkConnected = false;
    Device.get().isMaximoMobile = true;
  
    let event = {
      field: "newreading",
      item: {
       confirmlabtrans: undefined,
       starttimerinprg: undefined
      },
      action : 'stop',
      serviceaddress: {

      }
    };
    await WOTimerUtil.clickStartStopTimer(app, page, event, 'work', wodetails, laborDetailDS, "woConfirmLabTimeOnSchedule");
    expect(laborDetailDS.item.finishdatetime).toBeDefined();
  });

  it('openConFirmLabTimeDialog without synonym data', async () => {
    let mockSetPage = jest.fn();
    global.open = jest.fn();
  
    const app = new Application();
    const page = new Page({ name: 'page', state: {} });
    const reportPage = new Page({ name: 'report_work' });
    const reportWorkController = new ReportWorkPageController();

    const ds = newStatusDatasource({}, 'synonymdomainData');
    app.registerDatasource(ds);
    
    const laborDetailDS = newLaborDetailDatasource(labor, 'woLaborDetailds');
    page.registerDatasource(laborDetailDS);
  
    reportPage.registerController(reportWorkController);

    app.client = {
      userInfo: {
        personid: 'SAM',
        labor: {
          laborcode: 'SAM'
        }
      },
    };

    app.setCurrentPage = mockSetPage;
    app.currentPage = reportPage;
    
    await WOTimerUtil.openConFirmLabTimeDialog(app, page, laborDetailDS, 'stop', 'woConfirmLabTime', '');
    expect(laborDetailDS.item.finishdatetime).toBeUndefined();
    expect(page.state.woactionType).toBeUndefined();
  });

  it('should return true if event action is "stop" or "pause" and item confirmlabtrans is "1"', () => {
    const event = {
      action: 'stop',
      item: {
        confirmlabtrans: '1'
      }
    };
    const app = {
      getConfirmlabtrans: () => '1'
    };
    expect(WOTimerUtil.isOpenConfirmDialog(event, app)).toBe(true);
  });

  it('should return false if event action is not "stop" or "pause"', () => {
    const event = {
      action: 'start',
      item: {
        confirmlabtrans: '1'
      }
    };
    const app = {
      getConfirmlabtrans: () => '1'
    };
    expect(WOTimerUtil.isOpenConfirmDialog(event, app)).toBe(false);
  });

  it('should return false if event action is "stop" or "pause" and item confirmlabtrans is not "1"', () => {
    const event = {
      action: 'stop',
      item: {
        confirmlabtrans: '0'
      }
    };
    const app = {
      getConfirmlabtrans: () => '1'
    };
    expect(WOTimerUtil.isOpenConfirmDialog(event, app)).toBe(false);
  });

  // Assisted by watsonx Code Assistant 
describe('checkAllRunningTimer', () => {
  it('should allow method to execute further when allow multipler timer is enabled', async () => {
    const app = {
      state: {
        systemProp: {
          'maximo.mobile.allowmultipletimers': '1'
        }
      }
    };
    const result = await WOTimerUtil.checkAllRunningTimer(app);
    expect(result).toBe(false);
  });

  it('should return runningTimer if it has length 1', async () => {
    const app = {
      state: {
        systemProp: {
          'maximo.mobile.allowmultipletimers': '1'
        }
      },
      findPage: jest.fn()
    };
   const runningTimer = [{ worktype: 'type1', computedWorkTitle: 'title1' }];
   const result = await WOTimerUtil.checkAllRunningTimer(app, null, null, null, null, null, runningTimer, null);
   expect(result).toEqual(false);
  });

//   it('should return runningTimer if it has length greater than 1', async () => {
//     const app = {
//       state: {
//         systemProp: {
//           'maximo.mobile.allowmultipletimers': 1
//         }
//       },
//       findPage: jest.fn()
//     };
//  //   const findRunningWorkOrder = sinon.spy(WOTimerUtil, 'findRunningWorkOrder');
//     // const runningTimer = [
//     //   { worktype: 'type1', computedWorkTitle: 'title1' },
//     //   { worktype: 'type2', computedWorkTitle: 'title2' }
//     // ];
//   //  const result = await WOTimerUtil.checkAllRunningTimer(app, null, null, null, null, null, runningTimer, null);
//  //   expect(result).toEqual(runningTimer);
//   });

  it('should return false if runningTimer has length 0', async () => {
    const app = {
      state: {
        systemProp: {
          'maximo.mobile.allowmultipletimers': '1'
        }
      },
      findPage : jest.fn(),
    };
    const runningTimer = [];

    const result = await WOTimerUtil.checkAllRunningTimer(app, null, null, null, null, null, runningTimer, null);
    expect(result).toBe(false);
  });
});


  it('openConFirmLabTimeDialog with type Travel', async () => {
    let mockSetPage = jest.fn();
    global.open = jest.fn();
  
    const app = new Application();
    const page = new Page({ name: 'page', state: {} });
    const reportPage = new Page({ name: 'report_work' });
    const reportWorkController = new ReportWorkPageController();

    const ds = newStatusDatasource(statusitem, 'synonymdomainData');
    app.registerDatasource(ds);
    
    const laborDetailDS = newLaborDetailDatasource(labor, 'woLaborDetailds');
    page.registerDatasource(laborDetailDS);
  
    reportPage.registerController(reportWorkController);

    app.client = {
      userInfo: {
        personid: 'SAM',
        labor: {
          laborcode: 'SAM'
        }
      },
    };

    app.setCurrentPage = mockSetPage;
    app.currentPage = reportPage;
    expect(laborDetailDS.item.finishdatetime).toBeUndefined();
    await WOTimerUtil.openConFirmLabTimeDialog(app, page, laborDetailDS, 'stop', 'woConfirmLabTime', 'travel');
    expect(laborDetailDS.item.finishdatetime).toBeDefined();
    expect(page.state.woactionType).toEqual('travel');
  });

  it("deleteTimer", async () => {
    const app = new Application({ findPage: jest.fn() });
    const page = new Page({ name: "page", state: {} });
    const reportPage = new Page({ name: "report_work", state: {} });
    const workOrderDetailPage = new Page({ name: "workOrderDetails" });
    const schPage = new Page({
      name: "schedule",
      state: { selectedDS: "woLaborDetaildsOnSchedule" },
    });

    const laborDetailDS = newLaborDetailDatasource(labor, "woLaborDetailds");
    app.registerPage(workOrderDetailPage);
    page.registerDatasource(laborDetailDS);
    workOrderDetailPage.registerDatasource(laborDetailDS);
    schPage.registerDatasource(laborDetailDS);

    const reportDetails = newDatasource(labor, "reportworkLaborDetailds");
    reportPage.registerDatasource(reportDetails);

    const schDS = newDatasource(labor, "woLaborDetaildsOnSchedule");
    schPage.registerDatasource(schDS);

    const wodetails = newDatasource(workorderitem, 'woDetailResource');
    workOrderDetailPage.registerDatasource(wodetails);

    const reportDeleteItemStub = sinon.stub(reportDetails, "deleteItem");
    const reportsearchQBE = sinon.stub(reportDetails, "searchQBE");
    const reportClearQBEStub = sinon.stub(reportDetails, "clearQBE");

    const deleteItemStub = sinon.stub(laborDetailDS, "deleteItem");
    const loadStub = sinon.stub(wodetails, "load");
    app.client = {
      userInfo: {
        personid: 'SAM',
        labor: {laborcraftrate: {craft: 'ELECT'}, laborcode: 'SAM'}
      }
    }
    await WOTimerUtil.deleteTimerEntry(app, reportPage);
    expect(reportDeleteItemStub.called).toBe(true);
    expect(reportClearQBEStub.called).toBe(true);
    expect(reportsearchQBE.called).toBe(true);

    await WOTimerUtil.deleteTimerEntry(app, schPage);
    expect(deleteItemStub.called).toBe(true);
    expect(app.findDialog("reportTimeDrawer")).toBeNull();

    await WOTimerUtil.deleteTimerEntry(app, workOrderDetailPage);
    expect(deleteItemStub.called).toBe(true);
    expect(loadStub.called).toBe(true);

    CommonUtil.sharedData.originalEvent = {
      app : app, page: page, event: 'event', detailDS: 'detailDS', laborDS: 'laborDS', transtype: 'transtype', transtypeDescription: 'transtypeDescription'
    }
    const getOfflineAllowedStatusList =sinon.stub(CommonUtil, "getOfflineAllowedStatusList")
    .returns([{"description": "Inprogress", "value": "INPRG", "maxvalue": "INPRG"}, {"description": "Completed", "value": "COMP", "maxvalue": "COMP"},{"description": "Waiting on Approval", "value": "WAPPR", "maxvalue": "WAPPR"}]);

    await WOTimerUtil.deleteTimerEntry(app, workOrderDetailPage);
    expect(CommonUtil.sharedData.showConfirmDialog).toBe(false);
    getOfflineAllowedStatusList.restore();
  });

  it('startStopTimer', async () => {
    let mockSetPage = jest.fn();
    global.open = jest.fn();
  
    const app = new Application();
    const page = new Page({ name: 'page' });
    const reportPage = new Page({ name: 'report_work' });
    const woDetailsPage = new Page({ name: 'workOrderDetails'});
    const reportWorkController = new ReportWorkPageController();
    Device.get ().isMaximoMobile = true;

    const ds = newStatusDatasource(statusitem, 'synonymdomainData');
    app.registerDatasource(ds);
    const laborDetailDS = newLaborDetailDatasource(labor, 'woLaborDetailds');
    page.registerDatasource(laborDetailDS);

    const laborDs = newLaborDetailDatasource(labor, 'laborDs');
    app.registerDatasource(laborDs);

    const defaultSetDs = newDefaultSetDataSource();
    app.registerDatasource(defaultSetDs);
    await defaultSetDs.load();
  
    app.client = {
      userInfo: {
        personid: 'SAM',
        labor: {laborcraftrate: {craft: 'ELECT'}, laborcode: 'SAM'}
      },
    };
    
    app.state = {
      systemProp: {
        'maximo.mobile.usetimer': '1',
        'maximo.mobile.allowmultipletimers': '0',
        'maximo.mobile.wostatusforesig': 'APPR,INPROG'
      },
    };
  
    reportPage.registerController(reportWorkController);

    const wodetails = newDatasource(workorderitem, 'woDetailResource');
    page.registerDatasource(wodetails);
    
    const todaywoassignedDS = newDatasource(workorderitem, 'todaywoassignedDS');
    app.registerDatasource(todaywoassignedDS);
  
    const items = await wodetails.load();
    await todaywoassignedDS.load();
    if(todaywoassignedDS.items && todaywoassignedDS.items[0].labtrans) {
      todaywoassignedDS.items[0].labtrans[1].timerstatus_maxvalue = "COMPLETE";
    }

    const invokeAction = sinon.stub(wodetails, 'invokeAction').returns(items[0]);
    await app.initialize();
  
    app.setCurrentPage = mockSetPage;

    items[1].allowedstates = {      
        "COMP": [{"description": "Completed", "value": "COMP", "maxvalue": "COMP"}],
        "WAPPR": [{"description": "Waiting on Approval", "value": "WAPPR", "maxvalue": "WAPPR"}],
        "INPRG": [{"description": "In progress", "value": "INPRG", "maxvalue": "INPRG"}]
    };
  
    laborDs.initializeQbe = jest.fn();
    laborDs.setQBE = jest.fn();
    const setQBE = jest.spyOn(laborDs, 'setQBE');
    app.state.woStatSigOptions= JSON.stringify({
      CLOSE: "CLOSE",
      CANCEL: "CAN"
    });
    app.state.woOSName= "MXAPIWODETAIL";
    await WOTimerUtil.startStopTimer(app, page, {item: items[1], datasource: wodetails, action: 'start'}, wodetails, laborDetailDS, 'WORK', 'Actual work time');
    expect(setQBE).toHaveBeenCalled();
    expect(invokeAction.called).toBe(true);
    expect(invokeAction.displayName).toBe('invokeAction');
    expect(invokeAction.args.length).toBe(1);
  
    app.currentPage = reportPage;

    const loadAction = sinon.stub(reportWorkController, 'loadRecord');
    await WOTimerUtil.startStopTimer(app, page, {item: items[1], datasource: wodetails, action: 'stop', actionType: 'work'}, wodetails, laborDetailDS, 'WORK', 'Actual work time');
    expect(loadAction.called).toBe(false);
  
    items[1].starttimerinprg = '1';
    items[1].status_maxvalue = 'APPR'
    await WOTimerUtil.startStopTimer(app, page, {item: items[1], datasource: wodetails, action: 'start'}, wodetails, laborDetailDS, 'WORK', 'Actual work time');
    expect(loadAction.called).toBe(false);

    app.state = {
      systemProp: {
        'maximo.mobile.usetimer': '0',
        'maximo.mobile.allowmultipletimers': '1',
        'maximo.mobile.wostatusforesig': 'APPR,INPROG'
      },
    };
    app.state.woStatSigOptions= JSON.stringify({
      CLOSE: "CLOSE",
      CANCEL: "CAN"
    });
    app.state.woOSName= "MXAPIWODETAIL";
    Device.get().isMaximoMobile = false;
    await WOTimerUtil.startStopTimer(app, page, {item: items[1], datasource: wodetails, action: 'start'}, wodetails, laborDetailDS, 'WORK', 'Actual work time');
    expect(loadAction.called).toBe(false);

    app.currentPage = woDetailsPage;
    await WOTimerUtil.startStopTimer(app, page, {item: items[1], datasource: wodetails, action: 'start'}, wodetails, laborDetailDS, 'WORK', 'Actual work time');
    expect(app.currentPage).toBe(woDetailsPage);
    expect(loadAction.called).toBe(false);
  });

  it('stopWorkOnStatusComp', async () => {
    let mockSetPage = jest.fn();
    global.open = jest.fn();

    const app = new Application();
    const page = new Page({ name: 'page', state: {} });

    const ds = newStatusDatasource(statusitem, 'synonymdomainData');
    app.registerDatasource(ds);

    const laborDetailDS = newLaborDetailDatasource(labor, 'woLaborDetailds');
    page.registerDatasource(laborDetailDS);

    app.client = {
      userInfo: {
        personid: 'SAM',
        labor: {
          laborcode: 'SAM'
        }
      },
    };

    app.setCurrentPage = mockSetPage;
    expect(laborDetailDS.item.finishdatetime).toBeUndefined();

    const defaultSetDs = newDefaultSetDataSource();
    app.registerDatasource(defaultSetDs);
    await defaultSetDs.load();

    const wodetails = newDatasource(workorderitem, 'woDetailResource');
    page.registerDatasource(wodetails);

    app.state.networkConnected = false;
    Device.get().isMaximoMobile = true;

    let activeLabTran = [{}];
    let sinonStub = sinon.stub(laborDetailDS, 'save');
    
    await WOTimerUtil.stopWorkOnStatusComp(app, activeLabTran, laborDetailDS);

    expect(sinonStub.called).toBe(true);
    expect(activeLabTran[0].finishdatetime).toBeDefined();
  });

  it('startStopTimerWithoutSynonym', async () => {
    let mockSetPage = jest.fn();
    global.open = jest.fn();
  
    const app = new Application();
    const page = new Page({ name: 'page' });
    const reportPage = new Page({ name: 'report_work' });
    const reportWorkController = new ReportWorkPageController();

    const ds = newStatusDatasource({}, 'synonymdomainData');
    app.registerDatasource(ds);

    const laborDetailDS = newLaborDetailDatasource(labor, 'woLaborDetailds');
    page.registerDatasource(laborDetailDS);
    
    const todaywoassignedDS = newDatasource(workorderitem, 'todaywoassignedDS');
    app.registerDatasource(todaywoassignedDS);
    
    app.client = {
      userInfo: {
        personid: 'SAM',
        labor: {laborcraftrate: {craft: 'ELECT'}, laborcode: 'SAM'}
      },
    };

    app.state = {
      systemProp: {
        'maximo.mobile.usetimer': '1',
        'maximo.mobile.allowmultipletimers': '0'
      },
    };
 
    reportPage.registerController(reportWorkController);

    const wodetails = newDatasource(workorderitem, 'woDetailResource');
    page.registerDatasource(wodetails);
  
    const items = await wodetails.load();
    await todaywoassignedDS.load();

    const toastAction = sinon.stub(app, 'toast');
    await app.initialize();
    app.setCurrentPage = mockSetPage; 
    jest.spyOn(WOUtil, 'isSafetyPlanReviewed').mockImplementationOnce(() => true);
    await WOTimerUtil.startStopTimer(app, page, {item: items[1], datasource: wodetails, action: 'start'}, wodetails, 'WORK', 'Actual work time');
    expect(toastAction.called).toBe(true);
  });

  it('clickEditLabor', async () => {
    let mockSetPage = jest.fn();
    global.open = jest.fn();

    const app = new Application();
    const page = new Page({ name: 'page' });
    const reportPage = new Page({ name: 'report_work' });
    const reportWorkController = new ReportWorkPageController();

    app.client = {
      userInfo: {
        personid: 'SAM',
        labor: {
          laborcode: 'SAM'
        }
      },
    };

    const labordetails = newDatasource(labor, "reportworkLaborDetailds");
    reportPage.registerController(reportWorkController);
    reportPage.registerDatasource(labordetails);

    
    const wodetails = newDatasource(workorderitem, 'woDetailResource');
    page.registerDatasource(wodetails);
    const items = await wodetails.load();

    await app.initialize();

    app.setCurrentPage = mockSetPage;
    app.currentPage = reportPage;
    reportWorkController.pageInitialized(reportPage, app);

    const woDetailsReportWork = newDatasourceNew(labor, "wodetails", "wonum", "woDetailsReportWork");
    const synonymDSData = newStatusDatasource(statusitem, 'synonymdomainData');
    const craftrate = newDatasource(labor, "craftrate", "craft", "craftrate");
    const reportworksSynonymData = newStatusDatasource(statusitem, 'reportworksSynonymData');
    const laborDs = newLaborDetailDatasource(labor, 'laborDs');

    reportPage.registerDatasource(woDetailsReportWork);
    reportPage.registerDatasource(reportworksSynonymData);
    app.registerDatasource(craftrate);
    reportPage.registerDatasource(craftrate);
    app.registerDatasource(laborDs);
    app.registerDatasource(synonymDSData);
    expect(reportworksSynonymData.items.length).toBe(0);
    expect(craftrate.items.length).toBe(0);
    expect(laborDs.items.length).toBe(0);
    await synonymDSData.load();
    await reportworksSynonymData.load();
    await craftrate.load();
    await laborDs.load();
    expect(reportworksSynonymData.items.length).not.toBe(0);
    expect(craftrate.items.length).not.toBe(0);
    expect(laborDs.items.length).not.toBe(0);
    await WOTimerUtil.clickEditLabor(app, items[1].href, items[1]);	
    expect(mockSetPage.mock.calls.length).toBe(1);
  });

  it('removeSecondsFromTimeString test', async () => {
    const time1 = '11:22:33';
    const result1 = WOTimerUtil.removeSecondsFromTimeString(time1);
    expect(result1).toBe('11:22:00');
    const time2 = '2021-02-04T11:22:33';
    const result2 = WOTimerUtil.removeSecondsFromTimeString(time2);
    expect(result2).toBe('2021-02-04T11:22:00');
    const time3 = '2021-02-04T11:22:33+09:00';
    const result3 = WOTimerUtil.removeSecondsFromTimeString(time3);
    expect(result3).toBe('2021-02-04T11:22:00+09:00');
  });



  it('Should send labtrans record on confirm dialog.  ', async () => {
    const app = new Application();
    const page = new Page({ name: 'page' });
    const reportWorkController = new ReportWorkPageController();
    page.registerController(reportWorkController);

    const woDetailds = newDatasource(workorderitem, 'woDetailds');
    app.registerDatasource(woDetailds);

    const wodetails = newDatasource(workorderitem, 'woDetailResource');
    page.registerDatasource(wodetails);
    app.registerDatasource(wodetails);

    const laborDetailDS = newLaborDetailDatasource(labor, 'woLaborDetailds');
    page.registerDatasource(laborDetailDS);

    const ds = newStatusDatasource(statusitem, "synonymdomainData");
    app.registerDatasource(ds);

    const reportWorkLabords = newDatasource(statusitem, "reportworkLabords");
    page.registerDatasource(reportWorkLabords);

    await app.initialize(); 

    const items = await wodetails.load();
   
    reportWorkController.pageInitialized(page, app);
    app.client = {
      userInfo: {
        personid: 'SAM',
        labor: {laborcraftrate: {craft: 'ELECT'}, laborcode: 'SAM'}
      },
    };
    app.state.woStatSigOptions= JSON.stringify({
      CLOSE: "CLOSE",
      CANCEL: "CAN"
    });
    app.state.woOSName= "MXAPIWODETAIL";
    await WOTimerUtil.clickSendLabTrans(app, page,{action: 'stop'}, wodetails, laborDetailDS,{item: {...items[1]}});
    expect(page.state.workloading).toBeDefined();
  });
  
  it('open the hazard drawer when starting workorder', async () => {
    let mockSetPage = jest.fn();
    global.open = jest.fn();

    const app = new Application();
    const page = new Page({ name: 'page' });
    page.state.enforceAssetScan = 1;
    app.state.disableScan = false;
    page.state.workloading = true;
    page.state.transactionProgress = false;
    const ds = newStatusDatasource(statusitem, 'synonymdomainData');
    app.registerDatasource(ds);
    const laborDetailDS = newLaborDetailDatasource(labor, 'woLaborDetailds');
    page.registerDatasource(laborDetailDS);

    app.client = {
      userInfo: {
        personid: 'SAM',
        labor: {laborcraftrate: {craft: 'ELECT'}, laborcode: 'SAM'}
      },
    };

    app.state = {
      systemProp: {
        'maximo.mobile.usetimer': '1',
        'maximo.mobile.allowmultipletimers': '1',
        'maximo.mobile.safetyplan.review' : '1'
      },
      scanParameter : {
        scanResParam : {
          scanValue: null
        }
      }
    };

    const wodetails = newDatasource(workorderitem, 'woDetailResource');
    page.registerDatasource(wodetails);
    app.registerDatasource(wodetails);
    
    const woDetailds = newDatasource(workorderitem, 'woDetailds');
    app.registerDatasource(woDetailds);
    
    const todaywoassignedDS = newDatasource(workorderitem, 'todaywoassignedDS');
    app.registerDatasource(todaywoassignedDS);

    const defaultSetDs = newDefaultSetDataSource();
    app.registerDatasource(defaultSetDs);
    await defaultSetDs.load();

    const items = await wodetails.load();
    await app.initialize();
    sinon.spy(page, 'showDialog');

    const getOfflineAllowedStatusList = sinon.stub(CommonUtil, "getOfflineAllowedStatusList")
      .returns([{"description": "Inprogress", "value": "INPRG", "maxvalue": "INPRG"}, {"description": "Completed", "value": "COMP", "maxvalue": "COMP"},{"description": "Waiting on Approval", "value": "WAPPR", "maxvalue": "WAPPR"}]);

    app.setCurrentPage = mockSetPage;
    await WOTimerUtil.startStopTimer(app, page, {item: items[1], datasource: wodetails, action: 'start', worktype: 'work'}, wodetails, laborDetailDS, 'WORK', 'Actual work time');
    expect(page.state.workloading).toBe(false);
    expect(page.showDialog.calledOnce).toBe(false);

    app.state.systemProp['maximo.mobile.usetimer'] = '0';
    const eventData = {...items[1]};
    eventData.starttimerinprg = '1';
    eventData.status_maxvalue = 'APPR'; 
    eventData.assetnum = '123456';
    jest.spyOn(CommonUtil, 'checkScanRequired').mockImplementation(() => {
      return true
    });
    await WOTimerUtil.startStopTimer(app, page, {item: eventData, datasource: wodetails, action: 'start', worktype: 'work'}, wodetails, laborDetailDS, 'WORK', 'Actual work time');
    expect(page.state.workloading).toBe(false);
    expect(app.state.scanParameter.scanResParam.scanValue).toBe(null);

    app.state.disableScan = true;
    app.state.skipScan = true;
    app.state.systemProp['maximo.mobile.wostatusforesig'] = 'INPRG';
    app.state.systemProp['maximo.mobile.usetimer'] = '1';
    jest.spyOn(WOTimerUtil, 'validateActiveTimer').mockImplementationOnce(() => Promise.resolve(false));
    jest.spyOn(WOUtil, 'isSafetyPlanReviewed').mockImplementationOnce(() => true);
    const reportDeleteItemStub = sinon.stub(WOTimerUtil, "clickSendLabTrans");
    await WOTimerUtil.startStopTimer(app, page, {item: eventData, datasource: wodetails, action: 'start', worktype: 'work', wohazardcount: 2, hazardReviewedReq: '1'}, wodetails, laborDetailDS, 'WORK', 'Actual work time');
    expect(page.state.transactionProgress).toBe(false);
    reportDeleteItemStub.restore();
    getOfflineAllowedStatusList.restore();
  });

  // Assisted by watsonx Code Assistant 
  describe('resetSharedConfirmationVariable', () => {
    it('should reset the shared confirmation variable', () => {
      // arrange
      const app = {
        findPage: jest.fn(() => ({
          state: {
            transactionProgress: true,
            workloading: true,
            loading: true
          }
        })),
        state: {
          showLoaderOnAllWO: true
        }
      };
      CommonUtil.sharedData = {
        originalEvent: 'originalEvent',
        showConfirmDialog: true
      };

      // act
      WOTimerUtil.resetSharedConfirmationVariable(app);

      // assert
      expect(app.findPage).toHaveBeenCalledWith('workOrderDetails');
      expect(app.findPage).toHaveBeenCalledWith('schedule');
      expect(app.state.showLoaderOnAllWO).toBe(false);
      expect(CommonUtil.sharedData.originalEvent).toBe(undefined);
      expect(CommonUtil.sharedData.showConfirmDialog).toBe(false);
      expect(app.state.showLoaderOnAllWO).toBe(false);
    });
    it('should reset query and return currentSearchText when isFiltered is true and vice versa', async () => {
      const app = {
        findPage: jest.fn((page) => (page === 'schedule' ? { state: { selectedDS: 'todaywoassignedDS' }, name: 'schedule' } : null)),
        findDatasource: jest.fn(() => todaywoassignedDS), currentPage: { name: 'schedule' },
      };
      const todaywoassignedDS = {
        baseQuery: {}, lastQuery: {}, state: { currentSearch: '', isFiltered: '', },
        load: jest.fn().mockResolvedValue([]),
      };
      todaywoassignedDS.state.currentSearch = '1000';
      todaywoassignedDS.state.isFiltered = '1000';

      const currentSearchText = await WOTimerUtil.resetDatasource(app);

      expect(currentSearchText).toBe('1000');
      expect(todaywoassignedDS.baseQuery.where).toBe('');
      expect(todaywoassignedDS.baseQuery.searchText).toBe('');
      expect(app.findDatasource).toHaveBeenCalledWith('todaywoassignedDS');

      const searchText = '1000';
      todaywoassignedDS.state.currentSearch = '';
      todaywoassignedDS.state.isFiltered = '';
      await WOTimerUtil.resetDatasource(app, searchText);

      expect(todaywoassignedDS.baseQuery.searchText).toBe(searchText);
      expect(app.findDatasource).toHaveBeenCalledWith('todaywoassignedDS');

      // Test scenario where shouldReloadDatasource is true
      CommonUtil.sharedData.shouldReloadDatasource = true;
      await WOTimerUtil.resetDatasource(app, 'itemHref');
      expect(todaywoassignedDS.load).toHaveBeenCalledWith({ itemUrl: 'itemHref' });
      expect(CommonUtil.sharedData.shouldReloadDatasource).toBe(false);
      expect(CommonUtil.sharedData.isCardOpen).toBe(false);

      // Test scenario where isCardOpen is true
      CommonUtil.sharedData.isCardOpen = true;
      todaywoassignedDS.lastQuery.itemUrl = 'someUrl';
      await WOTimerUtil.resetDatasource(app);
      expect(todaywoassignedDS.lastQuery.itemUrl).toBe('');
      expect(CommonUtil.sharedData.isCardOpen).toBe(true);
      expect(todaywoassignedDS.load).toHaveBeenCalledWith({ ...todaywoassignedDS.baseQuery, noCache: true })
    });
  });
});
