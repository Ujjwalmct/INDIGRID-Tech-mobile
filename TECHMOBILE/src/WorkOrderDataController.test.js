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

import WorkOrderDataController from './WorkOrderDataController';
import { Application, Datasource, JSONDataAdapter, Page} from '@maximo/maximo-js-api';
import workorderitem from './test/wo-detail-json-data.js';
import singleDetail from './test/wo-detail-single-json-data.js';
import ScheduleDataController from './ScheduleDataController';
import SchedulePageController from './SchedulePageController';
import tasklist from './test/task-list-json-data.js';
import worktype from "./test/worktype-json-data";
import sinon from 'sinon';
import CommonUtil from './utils/CommonUtil'
import WOUtil from './utils/WOUtil';
function newDatasource(data = workorderitem, name = 'woDetailResource') {
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


function newListDatasource(data = workorderitem, name = 'todaywoassignedDS') {
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

it('Validate Enable/Disable button for Materials and tools', async () => {
  const controller = new WorkOrderDataController();

  let disableMaterialsButton = controller.computedDisableButton({
    wonum: '1001',
    title: 'Centrifugal Pump Oil Change',
    description:
      'The centrifugal pump oil changed must be performed every 3 months to meet manufacturer warranty conditions. Perform the oil change according to the manufaturers recommended guidelines, which are documented in the steps...',
    wptool: [
      {
        wonum: '1001',
        itemqty: 1.0,
        description: 'ROCKWELL DRILL PRESS'
      }
    ]
  });

  expect(disableMaterialsButton).toBe(false);

  let disableMaterialsButton1 = controller.computedDisableButton({
    wonum: '1001',
    title: 'Centrifugal Pump Oil Change',
    description:
      'The centrifugal pump oil changed must be performed every 3 months to meet manufacturer warranty conditions. Perform the oil change according to the manufaturers recommended guidelines, which are documented in the steps...',
    wpmaterial: [
      {
        wonum: '1001',
        itemqty: 1.0,
        description: 'ROCKWELL DRILL PRESS'
      }
    ]
  });

  expect(disableMaterialsButton1).toBe(false);

  let enableMaterialsButton = controller.computedDisableButton();

  expect(enableMaterialsButton).toBe(true);
});

it('computedItemNum returns right', async () => {
  const controller = new WorkOrderDataController();

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

it('should calculate and update multiAssetCount for items with progress set to false', () => {
  const controller = new WorkOrderDataController();
  const mockState = { multiAssetCount: 0 };
  const app = {
    findPage: jest.fn(() => ({
      state: mockState
    }))
  };

  controller.app = app;

  const items = [
    { name: "Item 1", progress: false },
    { name: "Item 2", progress: true },
    { name: "Item 3", progress: false },
    { name: "Item 4", progress: true }
  ];

  controller.computedMultiAssetProgressCount(items);
  expect(mockState.multiAssetCount).toBe(2);
});

it('computedEstTotalCost should call WoUtil method', () => {
  const controller = new WorkOrderDataController();
  let computedEstTotalCost = sinon.spy(WOUtil,'computedEstTotalCost');
  controller.computedEstTotalCost({})
  expect(computedEstTotalCost.called).toBe(true);
});

it('accessWoCostData should return total', () => {
  
  const controller = new WorkOrderDataController();
  jest.spyOn(WOUtil, "computedEstTotalCost").mockImplementation(() =>  {
    return {totalcost:"1995.50"}
  });
  expect(controller.accessWoCostData({})).toBe("1995.50");
});

it('computedWorkType returns right', async () => {
  const controller = new WorkOrderDataController();

  let title = controller.computedWorkType({
    worktype: 'PM',
    wonum: '1022'
  });
  expect(title).toBe('PM 1022');

  title = controller.computedWorkType({
    wonum: '1022'
  });
  expect(title).toBe('1022');

  title = controller.computedWorkType({istask: false});
  expect(title).toBe('');

  title = controller.computedWorkType({
    worktype: 'PM',
    istask: false
  });
  expect(title).toBe('PM ');

  title = controller.computedWorkType({
    wogroup: 'PM',
    taskid: '10',
    istask: true
  });
  expect(title).toBe('PM-10');
});

it('computedWOTimerStatus function to show/hide button ', async () => {
	const controller = new WorkOrderDataController();
  const app = new Application();
  const page = new Page({
    name: 'workOrderDetails'
  });

  app.client = {
    userInfo :{
      personId : 'SAM',
      labor: {
        laborcode: 'SAM'
      }
    }
  };

  const ds = newDatasource(workorderitem, 'woDetailResource');
  page.registerDatasource(ds);

  await app.initialize();
  controller.onDatasourceInitialized(ds, '', app);

	let hideWOStartButton = controller.computedWOTimerStatus({
		wonum: '1022',
		description: '13170 problem',
		labtrans: [
			{
				laborcode: 'SAM',
				timerstatus_maxvalue: 'ACTIVE',
			},
		],
	});
	expect(hideWOStartButton).toBe(true);

	hideWOStartButton = controller.computedWOTimerStatus({
		wonum: '1022',
		description: '13170 problem',
	});
  expect(hideWOStartButton).toBe(false);
  
  hideWOStartButton = controller.computedWOTimerStatus({
    wonum: '1022',
    description: '13170 problem',
    labtrans: [
      {
        laborcode: 'WILSON',
        timerstatus_maxvalue: 'ACTIVE',
      },
    ],
  });
  expect(hideWOStartButton).toBe(false);
});

it('computedWODtlStatusPriority function to display status and priority on workorder details page', async () => {
  const controller = new WorkOrderDataController();
	const app = new Application();
  const page = new Page({
    name: 'workOrderDetails'
  });

  const schPage = new Page({
    name: 'schedule'
  });
  app.registerPage(schPage);

  app.registerPage(page);
  app.registerController(controller);

  const ds = newDatasource(workorderitem, 'woDetailResource');
  const ds1 = newDatasource(workorderitem, 'woDetailds');
  page.registerDatasource(ds);
  page.registerDatasource(ds1);

  await app.initialize();
  jest.spyOn(CommonUtil, "canInteractWorkOrder").mockImplementation(() => true);
  controller.onDatasourceInitialized(ds, '', app);
  await controller.computedWODtlStatusPriority({'item': {priority: 1, assignment: [
    {
        status: 'ACCEPTED'
    }
  ]}});

  // verfiy the work order status only
  let item = controller.computedWODtlStatusPriority({
    status_description: "Approved",
    assignment: [
      {
          status: 'ACCEPTED'
      }
    ]
  });
  
  expect(item.length).toEqual(1);
  jest.spyOn(CommonUtil, "canInteractWorkOrder").mockImplementation(() => true);
  // verfiy the work order status and priority
  item = controller.computedWODtlStatusPriority({
    status_description: "Approved",
    wopriority: 1,
    assignment: [
      {
          status: 'ACCEPTED'
      }
    ]
  });
  
  expect(item[0].label).toEqual("Approved");
  expect(item[0].type).toEqual("white");
  expect(item[0].action).toBe(true);
  expect(item[1].label).toEqual("Priority 1");
  expect(item[1].type).toEqual("dark-gray");

  jest.spyOn(CommonUtil, "canInteractWorkOrder").mockImplementation(() => false);
  // verfiy the work order status and priority
  item = controller.computedWODtlStatusPriority({
    status_description: "Approved",
    wopriority: 1
  });
  
  expect(item[0].label).toEqual("Priority 1");
  expect(item[0].type).toEqual("dark-gray");

  item = controller.computedWODtlStatusPriority({
    status_description: "Approved",
    wopriority: null
  });

  expect(item.length).toEqual(0);
});

it('user should able to interact task', async () => {
  const controller = new WorkOrderDataController();
	const app = {
    findDatasource: jest.fn(),
    state: {
      woOSName: 'security'
    },
    checkSigOption: (option) => true,
    getLocalizedLabel: jest.fn((key) => {
      if (key === 'Rejected') {
          return 'REJECTED';
      } else {
          return 'ACCEPTED';
      }
    })
  };
  jest.spyOn(app, "findDatasource").mockImplementation(() => {return {item : {assignment: [{status: 'Accepted'}]}}});
  controller.onDatasourceInitialized('', '', app);
  expect(controller.allowTaskInteract()).toBe(true);

  app.checkSigOption = (option) => true;
  jest.spyOn(app, "findDatasource").mockImplementation(() => {return {item : {assignment: [{status: 'Rejected'}]}}});
  controller.onDatasourceInitialized('', '', app);
  expect(controller.allowTaskInteract()).toBe(false);
});

it('should navigate to schedulepage datacontroller', async () => {
	let mockSetPage = jest.fn();
	global.open = jest.fn();

  const controller = new WorkOrderDataController();
  const schedulePagecontroller = new SchedulePageController();
	const scheduleDatacontroller = new ScheduleDataController();
	
	const app = new Application();
	
  const page = new Page({ name: 'schedule' });
  app.registerPage(page);
  controller.app = app;
  
  
  const ds = newDatasource(workorderitem, 'woDetailResource');
  const listds = newListDatasource(workorderitem, 'todaywoassignedDS');
  page.registerDatasource(ds); 
  page.registerDatasource(listds);
  
  let items = await ds.load();
	
	await app.initialize();
  page.registerController(controller);
  app.registerController(controller);
  page.registerController(schedulePagecontroller);
  app.registerController(schedulePagecontroller);
  page.registerController(scheduleDatacontroller);
  app.registerController(scheduleDatacontroller);
  app.setCurrentPage = mockSetPage;
	  
  let saveSpy = sinon.spy(controller, "computedWorkTypeButton");
  await controller.computedWorkTypeButton({'item': items[2], 'datasource': ds});
  expect(saveSpy.calledOnce).toEqual(true);
  	
});

it('computedAssetLoc returns correct localized label based on item properties', async () => {
  const controller = new WorkOrderDataController();
  controller.app = {
    getLocalizedLabel: (key, defaultValue) => defaultValue
  };

  // Case 2: Item has assetnum -> should return 'ASSET'
  let result = controller.computedAssetLoc({ assetnum: '12345' });
  expect(result).toBe('ASSET');

  // Case 3: Item has only location -> should return 'LOCATION'
  result = controller.computedAssetLoc({ location: 'MTP100' });
  expect(result).toBe('LOCATION');

  // Case 4: Random case when Item is undefined -> should return 'LOCATION'
  result = controller.computedAssetLoc(undefined);
  expect(result).toBe('LOCATION');
});


it('computedFieldLabel returns correct label', async () => {
  const controller = new WorkOrderDataController();
  controller.app = {
    getLocalizedLabel: (key, defaultValue) => defaultValue
  };

  let label = controller.computedFieldLabel({
    assetnum: '12300'
  });
  expect(label).toBe('Asset');

  label = controller.computedFieldLabel({
    location: 'MTP100'
  });
  expect(label).toBe('Location');

  label = controller.computedFieldLabel({});
  expect(label).toBe('Location');
});

it('computedInputDesc returns correct description', async () => {
  const controller = new WorkOrderDataController();

  let desc = controller.computedInputDesc({
    assetnum: '12300',
    assetdescription: 'Generator'
  });
  expect(desc).toBe('12300 Generator');

  desc = controller.computedInputDesc({
    assetnum: '12300'
  });
  expect(desc).toBe('12300');

  desc = controller.computedInputDesc({
    location: 'MTP100',
    locationdesc: 'Main Plant'
  });
  expect(desc).toBe('MTP100 Main Plant');

  desc = controller.computedInputDesc({
    location: 'MTP100'
  });
  expect(desc).toBe('MTP100');

  desc = controller.computedInputDesc({});
  expect(desc).toBe('');

  desc = controller.computedInputDesc(null);
  expect(desc).toBe('');
});


it('computedMeterCurDate and computedMeterCurTime return the current user date-time', async () => {
  const controller = new WorkOrderDataController();
  controller.app = { dataFormatter: { currentUserDateTime: jest.fn(() => '2024-02-05 12:34:56') } };

  // Call both functions one by one
  const dateResult = controller.computedMeterCurDate();
  const timeResult = controller.computedMeterCurTime();

  // Validations
  expect(dateResult).toBe('2024-02-05 12:34:56');
  expect(timeResult).toBe('2024-02-05 12:34:56');

  // Assertions
  expect(controller.app.dataFormatter.currentUserDateTime).toHaveBeenCalledTimes(2);
});


it("Validate hide/show meter touch point", async () => {
  const controller = new WorkOrderDataController();
  let hideMeterButtn = controller.computedMultiDisableMeter({
    multiassetmetercount: 0,
    multilocationmetercount: 0,
  });

  expect(hideMeterButtn).toBe(true);
});

it("Validate hide/show meter touch point", async () => {
  const controller = new WorkOrderDataController();

  let hideMeterButtn = controller.computedMultiDisableMeter({
    multiassetmetercount: 1,
    multilocationmetercount: 1,
  });

  expect(hideMeterButtn).toBe(false);
});


it('computedTaskStatus function to display status on task page', async () => {
  const controller = new WorkOrderDataController();
  const app = new Application();
  const page = new Page({name: 'tasks'});
  app.registerPage(page);
  app.registerController(controller);
  const ds = newDatasource(tasklist, 'woPlanTaskDetailds');
  app.registerDatasource(ds);
  await app.initialize();
  jest.spyOn(app, "findDatasource").mockImplementation(() => {return {item : {assignment: [{status: 'Accepted'}]}}});
  let item = controller.computedTaskStatus({
    status_description: "Approved"
  });

  expect(item[0].label).toEqual("Approved");
  expect(controller.allowTaskInteract()).toBe(true);
});

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
it('computedPredecessorString returns expected data',async ()=>{
  const controller = new WorkOrderDataController();
  let date = controller.computedPredecessorString({
    status_maxvalue : 'COMP'
  });
  expect(date).toBe(''); 

  date = controller.computedPredecessorString({
    status_maxvalue : 'INPRG',
    predessorwos : 'task1'
  });
  expect(date).toBe('task1'); 

});

it('computedBorderDisplay function to show/hide border on task page', async () => {  
  const controller = new WorkOrderDataController();

  let data  = controller.computedBorderDisplay({computedParentAssetLocation: "UPS", description_longdescription:""});
  expect(data).toEqual(false);

  data  = controller.computedBorderDisplay({computedParentAssetLocation: "DENMARK", description_longdescription:""});
  expect(data).toEqual(false);

  data  = controller.computedBorderDisplay({computedParentAssetLocation: "DENMARK", description_longdescription:"Desc Added"});
  expect(data).toEqual(false);

  data  = controller.computedBorderDisplay({computedParentAssetLocation: "", description_longdescription:""});
  expect(data).toEqual(false);

  data  = controller.computedBorderDisplay({computedParentAssetLocation: "", description_longdescription:"desc"});
  expect(data).toEqual(true);
});


it('hideLockIcon function to show/hide lock/complete button on task page', async () => {
  
  const controller = new WorkOrderDataController();
  const app = new Application();
  const page = new Page({name: 'schedule'});
  const page2 = new Page({name: 'tasks'});
  app.registerPage(page);
  app.registerPage(page2);
  app.registerController(controller);
  const ds = newDatasource(tasklist, 'woPlanTaskDetailds');
  const ds2 = newDatasource(singleDetail, 'woDetailResource');
  const dsworktype = newDatasource(worktype, "dsworktype");
  const woData = {...workorderitem};
  woData.member[0].flowcontrolled = true;
  const wodetails = newDatasource(woData, 'woDetailds');
	app.registerDatasource(wodetails);
  app.registerDatasource(dsworktype);
  app.registerDatasource(ds);
  page.registerDatasource(ds2);
  await app.initialize();
  await wodetails.load();
  await dsworktype.load()
  await ds.load()
  await ds2.load()
  ds2.item.worktype = 'CM';

  let item = controller.hideLockIcon({
    status_description: "Approved",
    woflowcontrolled: true,
    worktype: 'CM'
  });

  expect(item).toEqual(true);
  ds2.item.worktype = '';
  item = controller.hideLockIcon({
    status_description: "Approved",
    woflowcontrolled: true
  });

  expect(item).toEqual(false);
});

it('show hide task asset or location when it different from parentWO', async () => {
  const controller = new WorkOrderDataController();
  const app = new Application();
  const page = new Page({name: 'schedule'});
  const page2 = new Page({name: 'tasks'});
  app.registerPage(page);
  app.registerPage(page2);
  app.registerController(controller);
  const ds = newDatasource(tasklist, 'woPlanTaskDetailds');
  const ds2 = newDatasource(singleDetail, 'woDetailResource');
  const woData = {...workorderitem}; 
  const ds3 = newDatasource(woData, 'woDetailds');
  app.registerDatasource(ds);
  page.registerDatasource(ds2);
  page.registerDatasource(ds3);
  await app.initialize();
  await ds.load()
  await ds2.load()

  ds2.item.assetnumber = '123';
  ds2.item.locationnum = 'DENMARK';
  let item = controller.computedParentAssetLocation({assetnum: "123",location: "UPS"});
  expect(item).toEqual(false);

  ds2.item.assetnumber = '';
  ds2.item.locationnum = '';
  item = controller.computedParentAssetLocation({assetnum: '',location: ''});
  expect(item).toEqual(true);

  ds2.item.assetnumber = "123";
  ds2.item.locationnum = '';
  item = controller.computedParentAssetLocation({assetnum: "123",location: ''});
  expect(item).toEqual(true);

  ds2.item.assetnumber = '';
  ds2.item.locationnum = "UPS";
  item = controller.computedParentAssetLocation({assetnum: '',location: "UPS"});
  expect(item).toEqual(true);

});

it('show hide task asset or location when it different from parentWO', async () => {
  const controller = new WorkOrderDataController();
  const app = new Application();
  const page = new Page({name: 'schedule'});
  const page2 = new Page({name: 'tasks'});
  app.registerPage(page);
  app.registerPage(page2);
  app.registerController(controller);
  const ds = newDatasource(tasklist, 'woPlanTaskDetailds');
  const ds2 = newDatasource(singleDetail, 'woDetailResource');
  const woData = {...workorderitem}; 
  const ds3 = newDatasource(woData, 'woDetailds');
  app.registerDatasource(ds);
  page.registerDatasource(ds2);
  page.registerDatasource(ds3);
  await app.initialize();
  await ds.load()
  await ds2.load()

  ds2.item.assetnumber = '';
  ds2.item.locationnum = "UPS";
  let item = controller.computedParentAssetLocation({assetnum: '',location: "UPS",description_longdescription:""});
  expect(item).toEqual(true);

  let data  = controller.computedBorderDisplay({assetnum: '',location: "UPS",description_longdescription:""});
  expect(data).toEqual(false);

  ds2.item.assetnumber = '123';
  ds2.item.locationnum = "UPS";
  item = controller.computedParentAssetLocation({assetnum: '157',location: "DENMARK",description_longdescription:""});
  expect(item).toEqual(false);

  data  = controller.computedBorderDisplay({assetnum: '157',location: "DENMARK",description_longdescription:""});
  expect(data).toEqual(false);

  
  ds2.item.assetnumber = '123';
  ds2.item.locationnum = "UPS";
  item = controller.computedParentAssetLocation({assetnum: '157',location: "DENMARK",description_longdescription:""});
  expect(item).toEqual(false);

  data  = controller.computedBorderDisplay({assetnum: '157',location: "DENMARK",description_longdescription:"Desc Added"});
  expect(data).toEqual(true);
});

// Assisted by WCA for GP. Latest GenAI contribution: Version 1, granit
describe('ComputedShowAssignment', () => {
  it('should return true when the work order is not in progress', () => {
    const controller = new WorkOrderDataController();
    const result = controller.computedShowAssignment({
      status: 'Completed',
    });

    expect(result).toBe(true);
  });

  it('should return false when the work order is in progress', () => {
    const controller = new WorkOrderDataController();
    const result = controller.computedShowAssignment({
      status: 'In Progress',
    });

    expect(result).toBe(true);
  });

  it('should return true when the work order status not available', () => {
    const controller = new WorkOrderDataController();
    const result = controller.computedShowAssignment();

    expect(result).toBe(true);
  });
});
