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

import AssetWoController from './AssetWoController';
import { Application, Page, JSONDataAdapter, Datasource } from '@maximo/maximo-js-api';

function newDatasource(data, name = "assetWorkOrderList") {
    const da = new JSONDataAdapter({
      src: data,
      items: 'member'
    });
  
    const ds = new Datasource(da, {
      idAttribute: 'wonum',
      name: name,
    });
  
    return ds;
  }

it("should loadRecord", async () => {
    const controller = new AssetWoController();    
    const app = new Application();
    const page = new Page({name: "assetWorkOrder"});
    const whereQuery = ["COMP","CLOSE"];
    app.registerController(controller);
    app.registerPage(page);
    const eventItem = {
      item : {
        assetnumber: '1002',
        assetdesc: 'Fire Extinguisher2',
        assetsrecentwos:[
          {
            description: 'HVAC overheating',
            status: 'WMATL',
            status_description: 'Waiting on material',
            status_maxvalue: 'WMATL',
            statusdate: '2021-03-09T16:08:51+05:30',
            wonum: '1228',
            worktype: 'CM',
            siteid: "BEDFORD"
          },
          {
            description: 'HVAC overheating',
            status: 'COMP',
            status_description: 'Waiting on material',
            status_maxvalue: 'COMP',
            statusdate: '2021-03-09T16:08:51+05:30',
            wonum: '1229',
            worktype: 'CM',
            siteid: "BEDFORD"
          }
        ],
         locationnum: 'MOFLOOR2',
        locationdesc: '2nd Floor, Main Office',
        locationsrecentwos:[
          {
            description: 'HVAC overheating',
            status: 'WMATL',
            status_description: 'Waiting on material',
            status_maxvalue: 'WMATL',
            statusdate: '2021-03-09T16:08:51+05:30',
            wonum: '1228',
            worktype: 'CM',
            siteid: "BEDFORD"
          },
          {
            description: 'HVAC overheating',
            status: 'COMP',
            status_description: 'Waiting on material',
            status_maxvalue: 'COMP',
            statusdate: '2021-03-09T16:08:51+05:30',
            wonum: '1229',
            worktype: 'CM',
            siteid: "BEDFORD"
          }
        ],
        woNum: '634787'
      },

      woNum: '634787'
    }
    const event = {
      item: {
        assetnumber: '1845',
        assetdesc: 'Pump10',
        assetsrecentwos:[
          {
            description: 'HVAC overheating',
            status: 'WMATL',
            status_description: 'Waiting on material',
            status_maxvalue: 'WMATL',
            statusdate: '2021-03-09T16:08:51+05:30',
            wonum: '1228',
            worktype: 'CM',
            siteid: "BEDFORD"
          },
          {
            status_maxvalue: "WAPPR",
            status_description: "Waiting on approval",
            description: "[Auto - 634787] Work order with a description",
            worktype: "PM",
            wonum: "634787",
            status: "WAPPR",
            statusdate: "2021-08-09T13:08:57+05:30",
            siteid: "BEDFORD"
            },
            {
            status_maxvalue: "APPR",
            status_description: "Approved",
            description: "[Auto - 939232] Work order with a description",
            worktype: "PM",
            wonum: "939232",
            status: "APPR",
            statusdate: "2021-07-02T16:58:45+05:30",
            siteid: "BEDFORD"
            },
            {
            status_maxvalue: "CLOSE",
            status_description: "Waiting on approval",
            description: "Water on floor",
            wonum: "1131",
            status: "CLOSE",
            statusdate: "2004-10-06T15:30:34+05:30",
            siteid: "BEDFORD"
            }
        ],
        locationnum: 'HMWA21',
        locationdesc: 'Street 33, Main Road',
        locationsrecentwos:[
          {
            description: 'HVAC overheating',
            status: 'WMATL',
            status_description: 'Waiting on material',
            status_maxvalue: 'WMATL',
            statusdate: '2021-03-09T16:08:51+05:30',
            wonum: '1228',
            worktype: 'CM',
            siteid: "BEDFORD"
          },
          {
            status_maxvalue: "WAPPR",
            status_description: "Waiting on approval",
            description: "[Auto - 634787] Work order with a description",
            worktype: "PM",
            wonum: "634787",
            status: "WAPPR",
            statusdate: "2021-08-09T13:08:57+05:30",
            siteid: "BEDFORD"
            },
            {
            status_maxvalue: "APPR",
            status_description: "Approved",
            description: "[Auto - 939232] Work order with a description",
            worktype: "PM",
            wonum: "939232",
            status: "APPR",
            statusdate: "2021-07-02T16:58:45+05:30",
            siteid: "BEDFORD"
            },
            {
            status_maxvalue: "WAPPR",
            status_description: "Waiting on approval",
            description: "Water on floor",
            wonum: "1131",
            status: "WAPPR",
            statusdate: "2004-10-06T15:30:34+05:30",
            siteid: "BEDFORD"
            },
        ]
      },

    }
    const event3 = {
      item: {
        assetnumber: '2000',
        assetdesc: '',
        assetsrecentwos:[
          {
            description: 'HVAC overheating',
            status: 'COMP',
            status_description: 'Waiting on material',
            status_maxvalue: 'COMP',
            statusdate: '2021-03-09T16:08:51+05:30',
            wonum: '2001',
            worktype: 'CM',
            siteid: "BEDFORD"
          },
          {
            status_maxvalue: "COMP",
            status_description: "Completed",
            description: "[Auto - 634787] Work order with a description",
            worktype: "PM",
            wonum: "2002",
            status: "COMP",
            statusdate: "2021-08-09T13:08:57+05:30",
            siteid: "BEDFORD"
          },
          {
            status_maxvalue: "COMP",
            status_description: "Approved",
            description: "[Auto - 939232] Work order with a description",
            worktype: "PM",
            wonum: "2003",
            status: "COMP",
            statusdate: "2021-07-02T16:58:45+05:30",
            siteid: "BEDFORD"
          },
          {
            status_maxvalue: "CLOSE",
            status_description: "Closed",
            description: "Water on floor",
            wonum: "2004",
            status: "CLOSE",
            statusdate: "2004-10-06T15:30:34+05:30",
            siteid: "BEDFORD"
          }
        ],
        locationnum: 'LOC200',
        locationdesc: '',
        locationsrecentwos:[
          {
            description: 'HVAC overheating',
            status: 'COMP',
            status_description: 'Completed',
            status_maxvalue: 'COMP',
            statusdate: '2021-03-09T16:08:51+05:30',
            wonum: '2005',
            worktype: 'CM',
            siteid: "BEDFORD"
          },
          {
            status_maxvalue: "COMP",
            status_description: "Completed",
            description: "[Auto - 634787] Work order with a description",
            worktype: "PM",
            wonum: "2006",
            status: "COMP",
            statusdate: "2021-08-09T13:08:57+05:30",
            siteid: "BEDFORD"
          },
          {
            status_maxvalue: "CLOSE",
            status_description: "Closed",
            description: "Unique Work Order of Location Tracking",
            wonum: "2007",
            status: "CLOSE",
            statusdate: "2004-10-06T15:30:34+05:30",
            siteid: "BEDFORD"
          },
          {
            status_maxvalue: "COMP",
            status_description: "Completed",
            description: "Unique Work Order of Location Tracking",
            wonum: "2008",
            status: "COMP",
            statusdate: "2004-10-06T15:30:34+05:30",
            siteid: "BEDFORD"
          }
        ],
        woNum: '333333'
      },

      
    };

    app.state.workorderLimit = 3;
    
    const ds = newDatasource({member:[eventItem.item.assetsrecentwos]}, "assetWorkOrderList");
    const locDs = newDatasource({member:[eventItem.item.locationsrecentwos]}, "locationWorkOrderList");
    page.registerDatasource(ds);
    page.registerDatasource(locDs);
    await app.initialize();
    controller.pageInitialized(page, app);
    await controller.loadRecord(eventItem, whereQuery, whereQuery);
    expect(page.state.assetNumDesc).toEqual('1002 Fire Extinguisher2');
    expect(page.state.locationNumDesc).toEqual('MOFLOOR2 2nd Floor, Main Office');

    const dsAsset = newDatasource({member:[event.item.assetsrecentwos]}, "assetWorkOrder");
    const locationDs = newDatasource({member:[event.item.locationsrecentwos]}, "locationWorkOrder");
    page.registerDatasource(dsAsset);
    page.registerDatasource(locationDs);
    await controller.loadRecord(event, whereQuery, whereQuery);
    expect(page.state.assetNumDesc).toEqual('1845 Pump10');
    expect(page.state.locationNumDesc).toEqual('HMWA21 Street 33, Main Road');

    const dsAsset3 = newDatasource({member:[event3.item.wobyasset]}, "assetWorkOrder3");
    const locationDs3 = newDatasource({member:[event3.item.wobylocation]}, "locationWorkOrder3");
    page.registerDatasource(dsAsset3);
    page.registerDatasource(locationDs3);
    await controller.loadRecord(event3, whereQuery, whereQuery);
    expect(page.state.assetNumDesc).toEqual('2000 ');
    expect(page.state.locationNumDesc).toEqual('LOC200 ');
    
  });

  it("should call checkWorkOrderUnique and return true if item already in array", async() => {
    const controller = new AssetWoController();    
    const app = new Application();
    const page = new Page({name: "assetWorkOrder"});
    app.registerController(controller);
    app.registerPage(page);
    const assetArray = [
      {
        description: 'HVAC overheating',
        status: 'WMATL',
        status_description: 'Waiting on material',
        status_maxvalue: 'WMATL',
        statusdate: '2021-03-09T16:08:51+05:30',
        wonum: '2001',
        worktype: 'CM',
        siteid: "BEDFORD"
      },
      {
        status_maxvalue: "COMP",
        status_description: "Completed",
        description: "[Auto - 634787] Work order with a description",
        worktype: "PM",
        wonum: "2002",
        status: "COMP",
        statusdate: "2021-08-09T13:08:57+05:30",
        siteid: "BEDFORD"
      },
      {
        status_maxvalue: "APPR",
        status_description: "Approved",
        description: "[Auto - 939232] Work order with a description",
        worktype: "PM",
        wonum: "2003",
        status: "APPR",
        statusdate: "2021-07-02T16:58:45+05:30",
        siteid: "BEDFORD"
      },
      {
        status_maxvalue: "CLOSE",
        status_description: "Closed",
        description: "Water on floor",
        wonum: "2004",
        status: "CLOSE",
        statusdate: "2004-10-06T15:30:34+05:30",
        siteid: "BEDFORD"
      }
    ];

    const wonumId = "2004";
    const siteid = "BEDFORD";
    const result1 = await controller.checkWorkOrderUnique(wonumId, siteid, assetArray);
    expect(result1).toEqual(false);

    const wonumId2 = "2007";
    const result2 = await controller.checkWorkOrderUnique(wonumId2, siteid, assetArray);
    expect(result2).toEqual(true);
  });


  it("should _computedWorkTypeWonum", async () => {
    const controller = new AssetWoController();    
    const app = new Application();
    const page = new Page({name: "assetWorkOrder"});
    app.registerController(controller);
    app.registerPage(page);
    const event = {
      item: {
        wobyasset:[
          {
            description: 'HVAC overheating',
            status: 'WMATL',
            status_description: 'Waiting on material',
            status_maxvalue: 'WMATL',
            statusdate: '2021-03-09T16:08:51+05:30',
            wonum: '1228',
            worktype: 'CM'
          }
        ]
      }
    }
    await app.initialize();
    controller.pageInitialized(page, app);
    let workTypeWonum = await controller._computedWorkTypeWonum(event.item.wobyasset[0]);
    expect(workTypeWonum).toBe('CM 1228')

    const event2 = {
      item: {
        wobyasset:[
          {
            description: 'HVAC overheating',
            status: 'WMATL',
            status_description: 'Waiting on material',
            status_maxvalue: 'WMATL',
            statusdate: '2021-03-09T16:08:51+05:30',
            wonum: '1228'
          }
        ]
      }
    }

    workTypeWonum = await controller._computedWorkTypeWonum(event2.item.wobyasset[0]);
    expect(workTypeWonum).toBe('1228')
  });

  it('should send open work order details page', async () => {

    global.open = jest.fn();
    const controller = new AssetWoController();    
    const app = new Application();
    const page = new Page({name: "assetWorkOrder"});
    app.registerController(controller);
    app.registerPage(page);
  
    let event = {
      item: {wonum: '1001', siteid: 'BEDFORD',href:'oslc/os/mxapiwodetail/_QkVERk9SRC8xNDI4'},
    };
  
    app.initialize();
    controller.pageInitialized(page, app);
   
    await controller.openAssetLocHstryDtlsPage(event);
    expect(page.state.loading).toEqual(false);
  
  });