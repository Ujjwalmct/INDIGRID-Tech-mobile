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

import ScheduleDataController from './ScheduleDataController';
import workorderitem from './test/wo-detail-json-data';
import {Application, Datasource, JSONDataAdapter, Page, Device} from '@maximo/maximo-js-api';
import WOUtil from './utils/WOUtil';
import CommonUtil from './utils/CommonUtil'
import { OpenLayersAdapter } from '@maximo/map-component';
import sinon from "sinon";

function newDatasource(data = workorderitem, name = 'selectedDatasource', field = 'member') {
  const da = new JSONDataAdapter({
    src: data,
    items: field,
    schema: 'responseInfo.schema'
  });
  const ds = new Datasource(da, {
    idAttribute: 'wonum',
    name: name,
  });
  return ds;
}

function getFeatures(count, status) {
  let features = [];
  for (let i = 0; i < count; i++) {
    let feature = {
      get: (attr) => {
        if (attr === 'maximoAttributes') {
          return {
            status : status,
            status_maxvalue: status
          }
        }
        if (attr === 'geometry') {
          return {
            constructor: {
              name: 'point'
            }
          }
        }
      },
      getGeometry: () => {
        return { 
          getType: () => ({
            toLowerCase: () => {
              return 'point';
            }
          })
        }
      }
    }
    features.push(feature)
  }
  return features;
}

describe('computedDueDate and ComputedisOverDue', () => {
  const controller = new ScheduleDataController();
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  let object = {schedfinish: today.toLocaleString()};
  let emptyObject = {};

  it('should return invalid date if no date or invalid date', () => {
    expect(controller.computedIsOverDue({schedfinish: '45/45/45'})).toBeFalsy();
  });

  it('should not be overdue', () => {
    let upToDate = new Date();
    upToDate.setDate(today.getDate() + 1);
    upToDate.setHours(0, 0, 0, 0);
    object = {schedfinish: upToDate};

    expect(controller.computedIsOverDue(object)).toBeFalsy();
  });

  it('should be overdue', () => {
    let overdue = new Date();
    overdue.setDate(today.getDate() - 1);
    overdue.setHours(0, 0, 0, 0);
    object.schedfinish = overdue;

    expect(controller.computedIsOverDue(object)).toBeTruthy();
  });

  it('should return false when no data is found', () => {
    expect(controller.computedIsOverDue(emptyObject)).toBeFalsy();
  });
});

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-8b-code-instruct
it('computedWorkDescription returns right', async () => {
  const controller = new ScheduleDataController();

  let title = controller.computedWorkTitle({
    worktype: 'PM',
    wonum: '1022',
    description: 'Work order description',
  });
  expect(title).toBe('1022 Work order description');

  title = controller.computedWorkTitle({
    wonum: '1022'
  });
  expect(title).toBe('1022');

  title = controller.computedWorkTitle({
    wonum: '1022',
    istask: true,
    wogroup: 'group1',
    taskid: '10',
    description: 'Work order description',
  });

  expect(title).toBe('group1-10 Work order description');


  title = controller.computedWorkTitle({
    istask: false,
    wogroup: 'group1',
    taskid: '10',
    description: 'Work order description',
  });
  expect(title).toBe('Work order description');
});

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-8b-code-instruct
it('computedWorkType returns right', async () => {
  const controller = new ScheduleDataController();

  let title = controller.computedWorkType({
    worktype: 'PM',
    wonum: '1022',
  });
  expect(title).toBe('PM 1022');

  title = controller.computedWorkType({
    wonum: '1022'
  });
  expect(title).toBe('1022');

  title = controller.computedWorkType({
    wonum: '1022',
    istask: true,
    wogroup: 'group1',
    taskid: '10',
  });

  expect(title).toBe('group1-10');
});

it('computedAssetNum returns right', async () => {
  const controller = new ScheduleDataController();

  let title = controller.computedAssetNum({
    assetnumber: 'I-95N', assetdesc: 'Mowing'
  });
  expect(title).toBe('I-95N Mowing');

  title = controller.computedAssetNum({
    assetnumber: 'I-95N'
  });
  expect(title).toBe('I-95N');
});

it('Validate Enable/Disable button for Materials and tools', async () => {
  let mockSetPage = jest.fn();
	global.open = jest.fn();

  const controller = new ScheduleDataController();
  const app = new Application();
  const page = new Page({ name: "schedule" });
  app.registerPage(page);
  app.registerController(controller);
  app.setCurrentPage = mockSetPage;
  app.state = {
    systemProp: {
      'mxe.mobile.travel.prompt': '1',
    },
  };
  const ds = newDatasource(workorderitem, 'woDetailResource');
  page.registerDatasource(ds);
  await app.initialize();
  controller.onDatasourceInitialized(ds, '', app);

  
  let disableMaterialsButton = controller.computedDisableButton({
    wonum: '1001',
    title: 'Centrifugal Pump Oil Change',
    description:
      'The centrifugal pump oil changed must be performed every 3 months to meet manufacturer warranty conditions. Perform the oil change according to the manufaturers recommended guidelines, which are documented in the steps...',
    toolcount: 1
  });

  expect(disableMaterialsButton).toBe(false);
  expect(page.state.isMatAndToolAvail).toBe(true);
});

it('Validate Enable/Disable button for Materials and tools', async () => {
  let mockSetPage = jest.fn();
	global.open = jest.fn();

  const controller = new ScheduleDataController();
  const app = new Application();
  const page = new Page({ name: "approvals" });
  app.registerPage(page);
  app.registerController(controller);
  app.setCurrentPage = mockSetPage;
  app.state = {
    systemProp: {
      'mxe.mobile.travel.prompt': '1',
    },
  };
  const ds = newDatasource(workorderitem, 'woDetailResource');
  page.registerDatasource(ds);
  await app.initialize();
  controller.onDatasourceInitialized(ds, '', app);

  
  let disableMaterialsButton = controller.computedDisableButton({
    wonum: '1001',
    title: 'Centrifugal Pump Oil Change',
    description:
      'The centrifugal pump oil changed must be performed every 3 months to meet manufacturer warranty conditions. Perform the oil change according to the manufaturers recommended guidelines, which are documented in the steps...',
    toolcount: 1
  });

  expect(disableMaterialsButton).toBe(false);
  expect(page.state.isMatAndToolAvail).toBe(true);
});


it('computedItemNum returns right', async () => {
  const controller = new ScheduleDataController();

  let title = controller.computedItemNum({
    itemnum: '6I-2499',
    description: 'Filter, Primary Air'
  });
  expect(title).toBe('6I-2499 Filter, Primary Air');

  title = controller.computedItemNum({
    itemnum: '6I-2499'
  });
  expect(title).toBe('6I-2499');

  title = controller.computedItemNum({
    description: 'Filter, Primary Air'
  });
  expect(title).toBe('Filter, Primary Air');
});

it('accessWoCostData should return total', () => {
  const controller = new ScheduleDataController();
  jest.spyOn(WOUtil, "computedEstTotalCost").mockImplementation(() =>  {
    return {totalcost:"1995.50"}
  });
  expect(controller.accessWoCostData({})).toBe("1995.50");
});

it('computedTimerStatus function to show/hide button ', async () => {
  const controller = new ScheduleDataController();
  const app = new Application();
  const page = new Page({
    name: 'schedule'
  });

  app.client = {
    userInfo: {
      personId: 'SAM',
      labor: {
        laborcode: 'SAM'
      }
    }
  };
  app.state = {
    systemProp: {
      'mxe.mobile.travel.prompt': '1',
    },
  };
  const ds = newDatasource(workorderitem, 'woDetailResource');
  page.registerDatasource(ds);
  await app.initialize();
  controller.onDatasourceInitialized(ds, '', app);

  let hideStartButton = controller.computedTimerStatus({
    wonum: "1022",
    description: "13170 problem",
    labtrans: [
      {
        laborcode: "SAM",
        timerstatus_maxvalue: "ACTIVE",
        timerstatus: "ACTIVE",
        transtype: "TRAV",
        transtype_maxvalue: "WORK"
      },
    ],
  });
  expect(hideStartButton).toBe(true);

  hideStartButton = controller.computedTimerStatus({
    wonum: "1022",
    description: "13170 problem"
  });
  expect(hideStartButton).toBe(false);

  hideStartButton = controller.computedTimerStatus({
    wonum: '1022',
    description: '13170 problem',
    labtrans: [
      {
        laborcode: 'WILSON',
        timerstatus_maxvalue: 'ACTIVE',
        timerstatus: "ACTIVE",
        transtype: "WORK",
        transtype_maxvalue: "WORK"
      },
    ],
  });
  expect(hideStartButton).toBe(false);
});

it('getLabTransType function return Transaction Type ', async () => {
  const controller = new ScheduleDataController();
  const app = new Application();
  const page = new Page({
    name: 'schedule'
  });

  app.client = {
    userInfo: {
      personId: 'SAM',
      labor: {
        laborcode: 'SAM'
      }
    }
  };

  app.state.defaultTravTrans = {
      value: 'TRAV',
      description: "Travel time"
  };
  app.state.systemProp = {
    'mxe.mobile.travel.prompt': '1',
  };

  const ds = newDatasource(workorderitem, 'woDetailResource');
  page.registerDatasource(ds);
  await app.initialize();
  controller.onDatasourceInitialized(ds, '', app);

  let labTransTypeMethod = controller.getLabTransType({
    laborcode: "SAM",
    timerstatus_maxvalue: "ACTIVE",
    timerstatus: "ACTIVE",
    transtype: "TRAV",
    transtype_maxvalue: "WORK"
  });
  expect(labTransTypeMethod).toBe('TRAV_ACTIVE');

  labTransTypeMethod = controller.getLabTransType({
    wonum: "1022",
    description: "13170 problem",
    labtrans: null,
  });
  expect(labTransTypeMethod).toBe(undefined);
});

it('loadBasemapSpatialReference function should load basemapSpatialReference', async () => {
  const controller = new ScheduleDataController();
  const app = new Application();
  const page = new Page({
    name: 'schedule'
  });
  app.registerPage(page);
  app.registerController(controller);
  CommonUtil.sharedData.basemapSpatialReference = null;
  sinon.stub(CommonUtil, "getBasemapSpatialReference").returns('EPSG:3857')
  await app.initialize();
  await controller.loadBasemapSpatialReference();
  expect(CommonUtil.sharedData.basemapSpatialReference).toBe('EPSG:3857');
});

it("should return true when travel navigation is set ", async () => {
  const controller = new ScheduleDataController();
  const app = new Application();
  const page = new Page({ name: 'schedule' });
  app.registerPage(page);
  app.state = {};
  app.client = {};

  app.state = {
    systemProp: {
      'maximo.mobile.usetimer': '1',
      'mxe.mobile.travel.navigation': '1',
    },
  };

  controller.app = app;
  Device.get().isMaximoMobile = false
  let result = controller.isTravelNavigation();
  expect(result).toBe(true);

});

it("should return false when travel navigation is not set", async () => {
  const controller = new ScheduleDataController();
  const app = new Application();
  const page = new Page({ name: 'schedule' });
  app.registerPage(page);
  app.state = {};
  app.client = {};

  app.state = {
    systemProp: {
      'maximo.mobile.usetimer': '0',
      'mxe.mobile.travel.navigation': '0',
    },
  };

  controller.app = app;
  Device.get().isMaximoMobile = false
  let result = controller.isTravelNavigation();
  expect(result).toBe(false);

});

it('onBeforeLoadData', async () => {
  const controller = new ScheduleDataController();
  const app = new Application();
  const page = new Page({
    name: 'schedule'
  });
  app.registerPage(page);
  app.registerController(controller);
  controller.app = app;
  const selectedDatasource = newDatasource(
    workorderitem,
    'todaywoassignedDS',
    'member'
  );
  app.registerDatasource(selectedDatasource);
  jest.spyOn(controller, "isTravelNavigation").mockReturnValue(true);
  jest.spyOn(controller, "loadBasemapSpatialReference").mockImplementation(() => { });
  await app.initialize();
  await selectedDatasource.load();
  await controller.onBeforeLoadData(
    selectedDatasource,
    selectedDatasource.items
  );
  expect(controller.isTravelNavigation).toHaveBeenCalled();
  expect(controller.loadBasemapSpatialReference).toHaveBeenCalled();
});

it('onAfterLoadData', async () => {
  const controller = new ScheduleDataController();
  const app = new Application();
  const page = new Page({
    name: 'schedule'
  });
  app.registerPage(page);
  app.registerController(controller);
  const selectedDatasource = newDatasource(
    workorderitem,
    'selectedDatasource',
    'member'
  );
  app.registerDatasource(selectedDatasource);
  page.state = {
    selectedDS: 'selectedDatasource'
  };
  await app.initialize();
  await selectedDatasource.load();
  await controller.onAfterLoadData(
    selectedDatasource,
    selectedDatasource.items
  );
  expect(app.state.firstWO.length).toBe(4);
  expect(controller.isAllTaskComplete(selectedDatasource.items[0].woactivity)).toBe(true);
  expect(controller.isAllTaskComplete(selectedDatasource.items[1].woactivity)).toBe(false);
});


it('onAfterLoadData', async () => {
  const controller = new ScheduleDataController();
  const app = new Application();
  const page = new Page({
    name: 'approvals'
  });
  app.registerPage(page);
  app.registerController(controller);
  const selectedDatasource = newDatasource(
    workorderitem,
    'selectedDatasource',
    'member'
  );
  app.registerDatasource(selectedDatasource);
  page.state = {
    selectedDS: 'selectedDatasource',
    dataSourceIntializationCount: 2
  };
  let checkMatToolAvailStub = sinon.stub(controller, 'checkMatToolAvail');

  await app.initialize();
  await selectedDatasource.load();
  await controller.onAfterLoadData(
    selectedDatasource,
    selectedDatasource.items
  );
  expect(app.state.firstWO.length).toBe(4);
  expect(controller.isAllTaskComplete(selectedDatasource.items[0].woactivity)).toBe(true);
  expect(controller.isAllTaskComplete(selectedDatasource.items[1].woactivity)).toBe(false);
  expect(checkMatToolAvailStub.called).toBeTruthy();
});

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2

describe('Test isRejected function', () => {
  
  it('should return true when item status is Rejected', async () => {
    const controller = new ScheduleDataController();
    const app = new Application();
    const page = new Page({name: 'schedule'});
    app.registerPage(page);
    app.state.systemProp = {
      'mxe.mobile.travel.prompt': '1',
    };
    const ds = newDatasource(workorderitem, 'woDetailResource');
    page.registerDatasource(ds);
    await app.initialize();
    controller.onDatasourceInitialized(ds, '', app);
    const item = {
      assignment: [
        {
          status: 'Rejected',
        },
      ],
    };

    const result = controller.isRejected(item);

    expect(result).toBe(true);
  });

  it('should return false when item status is not Rejected', async () => {
    const controller = new ScheduleDataController();
    const app = new Application();
    const page = new Page({name: 'schedule'});
    app.registerPage(page);
    app.state = {
      systemProp: {
        'mxe.mobile.travel.prompt': '1',
      },
    };
    const ds = newDatasource(workorderitem, 'woDetailResource');
    page.registerDatasource(ds);
    await app.initialize();
    controller.onDatasourceInitialized(ds, '', app);
    const item = {
      assignment: [
        {
          status: 'Approved',
        },
      ],
    };

    const result = controller.isRejected(item);

    expect(result).toBe(false);
  });
});


it('computedWOStatusPriority function to display status and priority on workorder', async () => {
  const controller = new ScheduleDataController();
  const app = new Application();
  const page = new Page({name: 'schedule'});
  app.registerPage(page);
  app.registerController(controller);
  
  let assetQuery = {
    'asset.wobyasset.orderBy' :'-statusdate',
    'asset.wobyasset.limit' : 4
  };
  const ds = newDatasource(workorderitem, 'woAssetLocationds');
  page.registerDatasource(ds);
  ds.options.query = assetQuery;
  let locQuery = {
    'locations.wobylocation.orderBy' : '-statusdate',
    'locations.wobylocation.limit' : 4
  };
  const locDs = newDatasource(workorderitem, 'woLocationds');
  page.registerDatasource(locDs);
  locDs.options.query = locQuery;
  app.state = {
    systemProp: {
      'mxe.mobile.travel.prompt': '1',
    },
  };
  await app.initialize();
  controller.onDatasourceInitialized(ds, '', app);

  let item = controller.computedWOStatusPriority({
    status_description: "Approved",
    assignment: [
      {
          status: 'ACCEPTED'
      }
    ]
  });
  expect(item[0].label).toEqual("Approved");
  expect(item[0].type).toEqual("cool-gray");

  item = controller.computedWOStatusPriority({
    wopriority: 2,
    status_description: "Approved",
    assignment: [
      {
          status: 'ACCEPTED'
      }
    ]
  });
  expect(item[0].label).toEqual("Approved");
  expect(item[0].type).toEqual("cool-gray");
  item[0].onClick();
  expect(item[1].label).toEqual("Priority 2");
  expect(item[1].type).toEqual("dark-gray");
});


it('computedWOStatusPriority function to display status and priority on workorder', async () => {
  const controller = new ScheduleDataController();
  const app = new Application();
  const page = new Page({name: 'approvals'});
  app.registerPage(page);
  app.registerController(controller);
  
  let assetQuery = {
    'asset.wobyasset.orderBy' :'-statusdate',
    'asset.wobyasset.limit' : 4
  };
  const ds = newDatasource(workorderitem, 'woAssetLocationds');
  page.registerDatasource(ds);
  ds.options.query = assetQuery;
  let locQuery = {
    'locations.wobylocation.orderBy' : '-statusdate',
    'locations.wobylocation.limit' : 4
  };
  const locDs = newDatasource(workorderitem, 'woLocationds');
  page.registerDatasource(locDs);
  locDs.options.query = locQuery;
  app.state = {
    systemProp: {
      'mxe.mobile.travel.prompt': '1',
    },
  };
  await app.initialize();
  controller.onDatasourceInitialized(ds, '', app);

  let item = controller.computedWOStatusPriority({
    status_description: "Approved"
  });

  expect(item[0].label).toEqual("Approved");
  expect(item[0].type).toEqual("cool-gray");

  jest.spyOn(CommonUtil, "canInteractWorkOrder").mockImplementation(() => false);
  item = controller.computedWOStatusPriority({
    wopriority: 2
  });

});

it('distanceGPSandServiceaddress function to calculate distance between two cordinates in Miles ', async () => {
  const controller = new ScheduleDataController();

  let distance = controller.distanceGPSandServiceaddress('28.6691', '77.4537', '36.7783', '119.4179', 'Miles');
  expect(distance).toBeTruthy();

});

it('distanceGPSandServiceaddress function to calculate distance between two cordinates in KM', async () => {
  const controller = new ScheduleDataController();

  let distance = controller.distanceGPSandServiceaddress('28.6691', '77.4537', '36.7783', '119.4179', 'KM');
  expect(distance).toBeTruthy();

});

it('distanceGPSandServiceaddress function to calculate distance between two cordinates in KM', async () => {
  const controller = new ScheduleDataController();

  let distance = controller.distanceGPSandServiceaddress('28.6691', '77.4537', '28.6691', '77.4537', 'KM');
  expect(distance).toBe(0);
});



it("computedWorkTypeStatus function to show/hide button when distance is in KM", async () => {
  const controller = new ScheduleDataController();
  const app = new Application();
  const page = new Page({name: 'schedule'});
  app.registerPage(page);
  app.state = {};
  app.client = {};

  app.state = {
    systemProp: {
      'mxe.mobile.travel.prompt': '1',
      'mxe.mobile.travel.radius': '1',
      'maximo.mobile.usetimer': '1',
      'mxe.mobile.travel.navigation': '1'
    },
  };

  app.client = {
    userInfo: {
      country: 'IN',
    },
  };
  app.geolocation.updateGeolocation();
  app.geolocation.state.longitude = 77;
  app.geolocation.state.latitude = 28;
  app.geolocation.state.enabled = true;

  app.registerController(controller);
  //await app.initialize();
  

  const selectedDatasource = newDatasource(
    workorderitem,
    'selectedDatasource',
    'member'
  );
  app.registerDatasource(selectedDatasource);
  page.state = {
    selectedDS: 'selectedDatasource'
  };

  controller.app = app;

  let event = {
    wonum: '1201',
    description: '13170 problem',
    serviceaddress: {
      longitudex: '36',
      latitudey: '119',
    },
  };

  let hideworktypeButton = controller.computedWorkTypeStatus(event);
  expect(hideworktypeButton).toBe(true);

  app.state.systemProp['maximo.mobile.usetimer'] = '0';
  app.state.systemProp['mxe.mobile.travel.navigation'] = '0';

  hideworktypeButton = controller.computedWorkTypeStatus(event);
  expect(hideworktypeButton).toBe(false);

  Device.get().isMaximoMobile = 1;

  hideworktypeButton = controller.computedWorkTypeStatus(event);
  expect(hideworktypeButton).toBe(false);

  app.state.systemProp['mxe.mobile.travel.navigation'] = '1';

  hideworktypeButton = controller.computedWorkTypeStatus(event);
  expect(hideworktypeButton).toBe(true);

  app.state.systemProp['maximo.mobile.usetimer'] = '1';
  app.state.systemProp['mxe.mobile.travel.navigation'] = '0';

  hideworktypeButton = controller.computedWorkTypeStatus(event);
  expect(hideworktypeButton).toBe(true);
});

it("computedWorkTypeStatus function to show/hide button when distance is in Miles", async () => {
  const controller = new ScheduleDataController();
  const app = new Application();
  const page = new Page({name: 'schedule'});
  app.registerPage(page);
  app.state = {};
  app.client = {};

  app.state = {
    systemProp: {
      'mxe.mobile.travel.prompt': '1',
      'mxe.mobile.travel.radius': '1',
    },
  };

  app.client = {
    userInfo: {
      country: 'US',
    },
  };

  app.geolocation.updateGeolocation();
  app.geolocation.state.longitude = 77;
  app.geolocation.state.latitude = 28;
  app.geolocation.state.enabled = true;

  app.registerController(controller);
  const selectedDatasource = newDatasource(
    workorderitem,
    'selectedDatasource',
    'member'
  );
  app.registerDatasource(selectedDatasource);
  page.state = {
    selectedDS: 'selectedDatasource',
  };
  controller.app = app;

  let event = {
    wonum: '1201',
    description: '13170 problem',
    serviceaddress: {
      longitudex: '36',
      latitudey: '119',
    },
  };

  let hideworktypeButton = controller.computedWorkTypeStatus(event);
  expect(hideworktypeButton).toBe(true);

});

it("should trigger coordinate transformation for invalid lat/long values", async () => {
  const controller = new ScheduleDataController();
  const app = new Application();
  const page = new Page({ name: "schedule" });

  app.registerPage(page);
  app.state = {
    systemProp: {
      "mxe.mobile.travel.prompt": "1",
      "mxe.mobile.travel.radius": "1",
      "maximo.mobile.usetimer": "1",
      "mxe.mobile.travel.navigation": "1",
    },
  };

  app.client = {
    userInfo: {
      country: "IN",
    },
  };

  app.geolocation.updateGeolocation();
  app.geolocation.state.longitude = 77;
  app.geolocation.state.latitude = 28;
  app.geolocation.state.enabled = true;

  app.registerController(controller);

  controller.app = app;


  let event = {
    wonum: '1201',
    description: '13170 problem',
    serviceaddress: {
      longitudex: '36',
      latitudey: '119',
    },
  };

  jest.spyOn(CommonUtil, "isLatOrLong").mockReturnValue(false);
  jest.spyOn(OpenLayersAdapter, "transformCoordinate").mockReturnValue([99, 55]);

  controller.computedWorkTypeStatus(event);

  expect(OpenLayersAdapter.transformCoordinate).toHaveBeenCalledWith(
    ["36", "119"],
    CommonUtil.sharedData.basemapSpatialReference,
    "EPSG:4326"
  );

  CommonUtil.isLatOrLong.mockRestore();
  OpenLayersAdapter.transformCoordinate.mockRestore();
});

it("computedWorkTypeStatus function to show/hide button when long-lat of serviceaddress is not defined ", async () => {
  const controller = new ScheduleDataController();
  const app = new Application();
  const page = new Page({name: 'schedule'});
  app.registerPage(page);
  app.state = {};
  app.client = {};

  app.state = {
    systemProp: {
      'mxe.mobile.travel.prompt': '0',
      'mxe.mobile.travel.radius': '1',
    },
  };

  app.client = {
    userInfo: {
      country: 'US',
    },
  };

  app.geolocation.updateGeolocation();
  app.geolocation.state.longitude = 77;
  app.geolocation.state.latitude = 28;
  app.geolocation.state.enabled = true;

  app.registerController(controller);
  const selectedDatasource = newDatasource(
    workorderitem,
    'selectedDatasource',
    'member'
  );
  app.registerDatasource(selectedDatasource);
  page.state = {
    selectedDS: 'selectedDatasource',
  };
  controller.app = app;

  let event = {
    wonum: '1201',
    description: '13170 problem',
    serviceaddress: {},

  };

  let hideworktypeButton = controller.computedWorkTypeStatus(event);
  expect(hideworktypeButton).toBe(false);

});

it('createWOSymbology single feature INPRG', async () => {
  let mapController = new ScheduleDataController();

    const app = new Application();
    app.registerController(mapController);
    mapController.app = app;
    await app.initialize();

    const mockgetLocalizedLabel = jest.fn();
    app.getLocalizedLabel = mockgetLocalizedLabel;

  let params = {features: getFeatures(1, 'INPRG'), legends: mapController.retrieveWOLegends(app)};
  let responseJson = mapController.createWOSymbology(params);
  expect(responseJson).not.toBeNull();

  params = {features: getFeatures(1, 'CLOSE'), legends: mapController.retrieveWOLegends(app)};
  responseJson = mapController.createWOSymbology(params);
  expect(responseJson).not.toBeNull();

  params = {features: getFeatures(1, 'APPR'), legends: mapController.retrieveWOLegends(app)};
  responseJson = mapController.createWOSymbology(params);
  expect(responseJson).not.toBeNull();

  params = {features: getFeatures(1, 'WMATL'), legends: mapController.retrieveWOLegends(app)};
  responseJson = mapController.createWOSymbology(params);
  expect(responseJson).not.toBeNull();
});

it('createWOSymbology single feature DONE', async() => {
  let mapController = new ScheduleDataController();
  const app = new Application();
  app.registerController(mapController);
  mapController.app = app;
  await app.initialize();

  const mockgetLocalizedLabel = jest.fn();
  app.getLocalizedLabel = mockgetLocalizedLabel;
  const params = {features: getFeatures(1, 'DONE'), legends: mapController.retrieveWOLegends(app)};
  let responseJson = mapController.createWOSymbology(params);
  expect(responseJson).not.toBeNull();
});

it('createWOSymbology many feature', async() => {
  let mapController = new ScheduleDataController();
  const app = new Application();
  app.registerController(mapController);
  mapController.app = app;
  await app.initialize();

  const mockgetLocalizedLabel = jest.fn();
  app.getLocalizedLabel = mockgetLocalizedLabel;
  
  let params = {features: getFeatures(1, 'INPRG'), legends: mapController.retrieveWOLegends(app)};
  let responseJson = mapController.createWOSymbology(params);
  expect(responseJson).not.toBeNull();

  params = {features: getFeatures(2, 'INPRG'), legends: mapController.retrieveWOLegends(app)};
  responseJson = mapController.createWOSymbology(params);
  expect(responseJson).not.toBeNull();
});

it('computedIsAssetLoc returns expected data', async () => {
  const controller = new ScheduleDataController();
  let res = controller.computedIsAssetLoc({
    assetnumber: '',assetdesc:'',locationnum:'',locationdesc:''
  });
  expect(res).toEqual(true);
}); 

it('Validate Enable/Disable button for Materials and tools', async () => {
  let mockSetPage = jest.fn();
	global.open = jest.fn();

  const controller = new ScheduleDataController();
  const app = new Application();
  const page = new Page({ name: "schedule" });
  app.registerPage(page);
  app.registerController(controller);
  app.setCurrentPage = mockSetPage;

  const ds = newDatasource(workorderitem, 'woDetailResource');
  page.registerDatasource(ds);
  await app.initialize();

  
  let disableMaterialsButton = controller.checkMatToolAvail([{
    wonum: '1001',
    title: 'Centrifugal Pump Oil Change',
    description:
      'The centrifugal pump oil changed must be performed every 3 months to meet manufacturer warranty conditions. Perform the oil change according to the manufaturers recommended guidelines, which are documented in the steps...',
    toolcount: 1,
    materialcount : 1
  }]);

  expect(disableMaterialsButton).toBe(true);

  disableMaterialsButton = controller.checkMatToolAvail([{
    wonum: '1001',
    title: 'Centrifugal Pump Oil Change',
    description:
      'The centrifugal pump oil changed must be performed every 3 months to meet manufacturer warranty conditions. Perform the oil change according to the manufaturers recommended guidelines, which are documented in the steps...',
    toolcount: 0,
    materialcount : 0
  }]);

  expect(disableMaterialsButton).toBe(false);
});

it("Test canInteractWorkOrder function", async () => {
  const controller = new ScheduleDataController();
  const app = new Application();
  const page = new Page({
    name: "approvals",
  });
  app.registerPage(page);
  app.registerController(controller);
  const selectedDatasource = newDatasource(
    workorderitem,
    "selectedDatasource",
    "member"
  );
  app.registerDatasource(selectedDatasource);
  page.state = {
    selectedDS: "selectedDatasource",
  };
  let canInteractWorkOrderStub = sinon.stub(CommonUtil, "canInteractWorkOrder");

  await app.initialize();

  await controller.computedShowAssignment(selectedDatasource.items[0]);
  expect(canInteractWorkOrderStub.called).toBeTruthy();
});
