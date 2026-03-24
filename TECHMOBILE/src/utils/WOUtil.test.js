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

import WOUtil from './WOUtil';
import workorderitem from '../test/wo-detail-json-data.js';
import statusitem from '../test/statuses-json-data.js';
import SynonymUtil from './SynonymUtil';
import { JSONDataAdapter,Page, Datasource, Application } from '@maximo/maximo-js-api';
import labor from "../test/labors-json-data";
import Sinon from 'sinon';

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

function newDatasource(data = workorderitem, name = 'workorderds') {
  const da = new JSONDataAdapter({
    src: data,
    items: 'member',
    schema: 'responseInfo.schema'
  });

  const ds = new Datasource(da, {
    idAttribute: 'wonum',
    name: name,
    update: jest.fn()
  });

  return ds;
}

describe('WOUtil', () => {

  it('Should return the Active Labour Transaction', async () => {

    const app = new Application();
    const page = new Page({ name: 'page', state: {} });   
    app.registerPage(page);
    await app.initialize(); 

    const synonymDS = newStatusDatasource(statusitem, 'synonymdomainData');
    const getSynonym = await SynonymUtil.getSynonym(synonymDS, 'TIMERSTATUS', 'TIMERSTATUS|ACTIVE');
    expect(getSynonym.value).toBe('ACTIVE');
    app.registerDatasource(synonymDS);

    app.client = {
      userInfo: {
        labor: {
          laborcode: {
            laborcode: "SAM",
            timerstatus_maxvalue: "ACTIVE",
            timerstatus: "ACTIVE",
            transtype: "TRAV",
            transtype_maxvalue: "WORK"
          }
        },
      labtrans: [
      {
        laborcode: "SAM",
        timerstatus_maxvalue: "ACTIVE",
        timerstatus: "ACTIVE",
        transtype: "TRAV",
        transtype_maxvalue: "WORK"
      },
    ],
      }
    }

    const laborDetailDS = newLaborDetailDatasource(labor, 'labordetails2');
    page.registerDatasource(laborDetailDS);
    laborDetailDS.searchQBE=()=>Promise.resolve([{"timerstatus":"ACTIVE","laborcode": app.client.userInfo.labor.laborcode}]);
    const activeLabTran = await WOUtil.getActiveLabTrans(app, laborDetailDS);

    expect(activeLabTran).toEqual([
      {
        "laborcode": {
          "laborcode": "SAM",
          "timerstatus": "ACTIVE",
          "timerstatus_maxvalue": "ACTIVE",
          "transtype": "TRAV",
          "transtype_maxvalue": "WORK",
        },
        "timerstatus": "ACTIVE",
      }
    ]);

  });

  it('Should update the safety plan review date ', async () => {
    const app = new Application({
      dataFormatter: {
        currentUserDateTime: jest.fn(),
        convertISOtoDate: jest.fn(),
        dateWithoutTimeZone: jest.fn()
      }
    });
    const schedulePage = new Page({ name: 'schedule', state: {}, showDialog: jest.fn() });   
    const approvalsPage = new Page({ name: 'approvals', state: {}, showDialog: jest.fn() });   

    app.registerPage(schedulePage);
    app.registerPage(approvalsPage);

    app.findDatasource = () => ({
      save: jest.fn(),
      load: jest.fn(),
      update: jest.fn(),
      forceReload: jest.fn(),
      getChildDatasource: jest.fn().mockReturnValue(assignmentDS),
      findPage: jest.fn((name) => {
        if (name === 'schedule') return schedulePage;
        if (name === 'approvals') return approvalsPage;
      })
    });
    await app.initialize(); 

    const woDetailds = newDatasource(workorderitem, 'woDetailds');
    const assignmentDS = {
      items: [
        {
          status_maxvalue: "ASSIGNED",
          _rowstamp: "25135111",
          status_description: "ACCEPTED",
          localref: "oslc\/os\/mxapiwodetail\/_QkVERk9SRC8yMjA2\/showassignment\/0-3018",
          href: "http:\/\/childkey#V09SS09SREVSL0FTU0lHTk1FTlQvMzAxOA--",
          assignmentid: 3018,
          laborcode: "WILSON",
          status: "ASSIGNED",
        },
      ],
    };
    assignmentDS.applyInMemoryFilter = jest.fn();
    assignmentDS.clearInMemoryFilter = jest.fn();
    assignmentDS.load = jest.fn();
    assignmentDS.save = jest.fn();

    const wodetails = newDatasource(workorderitem, 'wodetails');
    app.registerDatasource(woDetailds);
    app.registerDatasource(wodetails);
    app.findDatasource = jest.fn((name) => {
      if (name === 'woDetailds') return woDetailds;
    });
    wodetails.save = jest.fn();
    await woDetailds.load();
    await wodetails.load();
    await WOUtil.reviewSafetyPlan(app);
    expect(woDetailds.items.length).toBe(5)
    expect(woDetailds.item.splanreviewdate).toBeDefined();

    woDetailds.items.length = 0
    expect(wodetails.update).toBeInstanceOf(Function);
    
  });

  it('should update safety plan review date when assignment exists', async () => {
    const app = new Application({
      dataFormatter: {
        currentUserDateTime: jest.fn(),
        convertISOtoDate: jest.fn(),
        dateWithoutTimeZone: jest.fn()
      }
    });
    app.findDatasource = () => ({
      save: jest.fn(),
      load: jest.fn(),
      update: jest.fn(),
      forceReload: jest.fn(),
      getChildDatasource: jest.fn().mockReturnValue(assignmentDS),
      findPage: jest.fn((name) => {
        if (name === 'schedule') return schedulePage;
      })
    });
    const schedulePage = new Page({ name: 'schedule', state: {}, showDialog: jest.fn() });
    const assignmentDS = {
      items: [
        {
          status_maxvalue: "ASSIGNED",
          _rowstamp: "25135111",
          status_description: "ACCEPTED",
          localref: "oslc\/os\/mxapiwodetail\/_QkVERk9SRC8yMjA2\/showassignment\/0-3018",
          href: "http:\/\/childkey#V09SS09SREVSL0FTU0lHTk1FTlQvMzAxOA--",
          assignmentid: 3018,
          laborcode: "WILSON",
          status: "ASSIGNED",
        },
      ],
    };
    app.registerPage(schedulePage);
    assignmentDS.items = [{ laborcode: '123', status: 'ASSIGNED' }];
    assignmentDS.applyInMemoryFilter = jest.fn();
    assignmentDS.clearInMemoryFilter = jest.fn();
    assignmentDS.load = jest.fn().mockResolvedValue();
    assignmentDS.save = jest.fn().mockResolvedValue();

    await WOUtil.reviewSafetyPlan(app);

    expect(assignmentDS.items[0].splanreviewdate).toBeDefined();
    expect(assignmentDS.items[0].changedate).toBeDefined();
    expect(assignmentDS.save).toHaveBeenCalled();
  });

  it('Should call isActiveLabTrans', async() => {

    const app = new Application();
    await app.initialize(); 

    const synonymStub = Sinon.stub(SynonymUtil, 'getSynonym').returns({value:'ACTIVE'});
    const testData = [
      {
        laborcode: "WILSON",
        timerstatus_maxvalue: "COMPLETED",
        timerstatus: "COMPLETED",
        transtype: "WORK",
        transtype_maxvalue: "WORK"
      },
      {
        laborcode: "WILSON",
        timerstatus_maxvalue: "ACTIVE",
        timerstatus: "ACTIVE",
        transtype: "WORK",
        transtype_maxvalue: "WORK"
      }
    ]
    expect(await WOUtil.isActiveLabTrans(app, testData)).toEqual(true);
    synonymStub.restore();
  })

  it('Should set the correct state properties and show meter reading dialog', async() => {
    const app = new Application();
    app.showDialog = jest.fn();

    await app.initialize(); 
    const testData = 
      {
        assetmetercount: true,
        assetnum: '12345',
        canLoad: false,
        locationmetercount: true,
        location: 'STOREROOM',
        status_maxvalue: 'INPRG',
        restrictNewReading: false  
      }    
    WOUtil.openMeterReadingDrawer(app, testData)
    expect(app.state.meterReading).toEqual({
      "assetnum": "12345",
      "canLoad": false,
      "location": "STOREROOM",
      "restrictNewReading": false,
    });
    expect(app.showDialog).toHaveBeenCalledWith('maxlib_meterReadingDrawer');
  });

  it('Should set the correct state properties and show work order Hazard dialog', async() => {
    const app = new Application();
    const page = new Page({ name: 'approvals', state: {} });   
    app.registerPage(page);
    page.showDialog = jest.fn();
    
    const date = new Date()
    const wods = {
      load: jest.fn().mockResolvedValue(workorderitem),
      item: {
        assignment: [{splanreviewdate: date}],
        splanreviewdate: date
      }
    }

    const woDetailds = newDatasource(workorderitem, 'woDetailds');
    await woDetailds.load();
    app.registerDatasource(woDetailds);

    app.findDatasource = jest.fn().mockReturnValue(wods);
    app.dataFormatter.convertISOtoDate = jest.fn()
    app.dataFormatter.dateWithoutTimeZone =  jest.fn()
    woDetailds.load = jest.fn().mockResolvedValue(workorderitem);

    await app.initialize(); 
    
    await WOUtil.openWOHazardDrawer(app, page, woDetailds, "wohazardDrawer")
    expect(app.findDatasource).toHaveBeenCalledWith("woDetailds");
    expect(app.state.canLoadWoDetailDS).toEqual(true);
    expect(app.dataFormatter.convertISOtoDate).toHaveBeenCalled();
    expect(app.dataFormatter.dateWithoutTimeZone).toHaveBeenCalled();

    expect(woDetailds.item.assignment.length).toBe(1);
    expect(woDetailds.item.splanreviewdate).toBeDefined();
    expect(page.state.isSafetyPlanReviewed).toBe(true);

    expect(page.showDialog).toHaveBeenCalledWith('wohazardDrawer');

    await WOUtil.openWOHazardDrawer(app, page, { item: { href: undefined}}, "wohazardDrawer")
    expect(app.state.canLoadWoDetailDS).toEqual(true);
  });

  it('Should call computedEstTotalCost function', async() => {
    const item = {
      estintlabcost: 100,
      estintlabhrs: 2,
      estlabhrs: 3,
      estmatcost: 50,
      estoutlabcost: 75,
      estoutlabhrs: 4,
      estservcost: 25,
      esttoolcost: 15
    };
    const result = WOUtil.computedEstTotalCost(item);

    expect(result).toEqual({
      intlbrhrs: '2.00',
      extlbrhrs: '4.00',
      intlbrcost: '100.00',
      extlbrcost: '75.00',
      servicecost: '25.00',
      toolcost: '15.00',
      materialcost: '50.00',
      totallbrhrs: '6.00',
      totallbrcost: '175.00',
      totalcost: '265.00'
    });
  });

  it('Should return safety plan review status', async() => {
    const item = {
      assignment: [],
      splanreviewdate: new Date()
    }
    expect(WOUtil.isSafetyPlanReviewed(item, 'WILSON')).toBe(false);

    item.assignment = [{ splanreviewdate: '2025-05-28' }]
    expect(WOUtil.isSafetyPlanReviewed(item, 'WILSON')).toBe(false);

    expect(WOUtil.isSafetyPlanReviewed(undefined)).toBe(true);
    expect(WOUtil.isSafetyPlanReviewed({})).toBe(true);

    item.assignment = [{ assignment: [], splanreviewdate: null }];
    expect(WOUtil.isSafetyPlanReviewed(item, 'WILSON')).toBe(false);

    item.assignment = [{ labor: { personid: 'WILSON' }, splanreviewdate: new Date() }]
    expect(WOUtil.isSafetyPlanReviewed(item, 'WILSON')).toBe(false);

    item.assignment = [{ labor: { personid: 'WILSON' }, splanreviewdate: null }]
    expect(WOUtil.isSafetyPlanReviewed(item, 'WILSON')).toBe(true);
  });
});

 
