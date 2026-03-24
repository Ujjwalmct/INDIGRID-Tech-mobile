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

import ChangeStatusController from './ChangeStatusController' ;
import {Application, Page, JSONDataAdapter, Datasource, Device} from '@maximo/maximo-js-api';
import statusitem from './test/statuses-json-data.js';
import workorderitem from "./test/wo-failure-report-json-data";
import WOUtil from './utils/WOUtil';
import WOTimerUtil from './utils/WOTimerUtil';
import commonUtil from './utils/CommonUtil';
import sinon from 'sinon';
import labor from "./test/labors-json-data";

function newStatusDatasource (data = statusitem, name = 'synonymdomainData') {
  const da = new JSONDataAdapter ({
    src: statusitem,
    items: 'member',
    schema: 'responseInfo.schema',
  });

  const ds = new Datasource (da, {
    idAttribute: 'value',
    name: name,
  });

  return ds;
}
function newDatasource(data = workorderitem, items="member", idAttribute="wonum", name = "woDetailsReportWork") {
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

it('checkEsigRequired', async () => {
	let mockSetPage = jest.fn();
	global.open = jest.fn();

	const controller = new ChangeStatusController();
	const app = new Application();
	const page = new Page({name: 'page'});
	page.registerController(controller);
	const parentPage = new Page({name: 'parentPage'});
	page.parent = parentPage ;
	app.registerController(controller);
	const dsstatusDomainList = newStatusDatasource(statusitem, 'dsstatusDomainList');
	parentPage.registerDatasource(dsstatusDomainList);
	app.registerPage(page);
	await app.initialize();
	app.setCurrentPage = mockSetPage;
	page.getApplication = () => app;
	controller.dialogInitialized(page);
	app.state = {
		systemProp: {
		  'maximo.mobile.wostatusforesig': 'APPR,INPROG'
		}      
	  };
	page.state.selectedStatus = 'APPR';
	expect(controller.checkEsigRequired()).toBeTruthy();

	page.state.selectedStatus = 'WAPPR';
	expect(controller.checkEsigRequired()).toBeFalsy();
});

it('SelectStatus', async () => {
	let mockSetPage = jest.fn();
	global.open = jest.fn();

	const controller = new ChangeStatusController();
	const app = new Application();
	const page = new Page({name: 'page'});
	page.registerController(controller);
	const parentPage = new Page({name: 'parentPage'});
	page.parent = parentPage ;
	app.registerController(controller);
	const dsstatusDomainList = newStatusDatasource(statusitem, 'dsstatusDomainList');
	parentPage.registerDatasource(dsstatusDomainList);

	await app.initialize();
	let item = {'value':'APPR'};
	page.parent.datasources.dsstatusDomainList.setSelectedItem(item, true);

	app.setCurrentPage = mockSetPage;
	app.state = {
        systemProp: {
          'maximo.mobile.statusforphysicalsignature': 'APPR,WAPPR'
        },
      };
	page.getApplication = () => app;
	controller.dialogInitialized(page);
	await controller.selectStatus(item);
	expect(page.state.selectedStatus).toBeTruthy();
	expect(page.parent.state.disableDoneButton).toBe(false);
	controller.dialogOpened(page, app);
	expect(page.state.statusMemo).toBe('');

	page.parent.datasources.dsstatusDomainList.setSelectedItem(item, false);
	let item2 = { value: "APPR",'maxvalue':'APPR'};
	await controller.selectStatus(item2);
	expect(page.parent.state.disableDoneButton).toBe(true);
});

it('Set Status Memo', async () => {
	let mockSetPage = jest.fn();
	global.open = jest.fn();

	const controller = new ChangeStatusController();
	const app = new Application();
	const page = new Page({name: 'page'});
	page.registerController(controller);
	const parentPage = new Page({name: 'parentPage'});

	page.parent = parentPage ;
    page.state.statusMemo='';
	app.registerController(controller);
	await app.initialize();

	let event = {'currentTarget':{'value':'Status Memo'}};
	app.setCurrentPage = mockSetPage;
	controller.dialogInitialized(page, app);
	await controller.setStatusMemo(event);
	expect(page.state.statusMemo).toBeTruthy();	
});
it("Validate onSignatureUpload", async () => {
	let mockSetPage = jest.fn();
	const controller = new ChangeStatusController();
	const app = new Application();
	const page = new Page({ name: "page" });
	page.registerController(controller);
	const parentPage = new Page({ name: "parentPage" });
	const woDetailsds = newDatasource(workorderitem, "member", "wonum", "woDetailds");
  	page.parent = parentPage;
	app.registerController(controller);
	page.parent.state.referencePage = "workOrderDetails";
	app.state = {'doclinksCountData': [] };
	app.registerDatasource(woDetailsds);
	page.getApplication = () => app;
	controller.dialogInitialized(page);
	const woDetailResource = newDatasource(workorderitem, "member", "wonum", "woDetailResource");
    app.registerDatasource(woDetailResource);
    page.parent.state.woItem = await woDetailResource.load();
	await app.initialize();
	page.changeStatus = mockSetPage;
	let event = { currentTarget: { value: "Status Memo" } };
	await controller.onSignatureUpload(event);
	expect(app.state.doclinksCount).toBe('1001');
});

it('selectTaskStatus', async () => {
	let mockSetPage = jest.fn();
	global.open = jest.fn();

	const controller = new ChangeStatusController();
	const app = new Application();
	const page = new Page({name: 'page'});
	page.registerController(controller);
	const parentPage = new Page({name: 'parentPage'});
	page.parent = parentPage ;
	app.registerController(controller);
	const taskstatusDomainList = newStatusDatasource(statusitem, 'taskstatusDomainList');
	parentPage.registerDatasource(taskstatusDomainList);

	await app.initialize();
	
	app.setCurrentPage = mockSetPage;
	app.state = {
        systemProp: {
          'maximo.mobile.statusforphysicalsignature': 'APPR,WAPPR'
        },
      };
	page.parent.state.appVar = app;
	let item = {'value':'APPR'};
	page.parent.datasources.taskstatusDomainList.setSelectedItem(item, true);
	controller.dialogInitialized(page, app);
	await controller.selectTaskStatus(item);
	expect(page.parent.state.selectedTaskStatus).toBeTruthy();
	expect(page.parent.state.disableDoneButton).toBe(false);
	
	let item1 = {'value':'APPR'};
	page.parent.datasources.taskstatusDomainList.setSelectedItem(item1, false);
	await controller.selectTaskStatus(item1);
	expect(page.parent.state.disableDoneButton).toBe(true);
});

describe('changeStatus', () => {
	let mockSetPage = jest.fn();
	global.open = jest.fn();
	const controller = new ChangeStatusController();
	const app = new Application();
	const woDetailResource = newDatasource(workorderitem, "member", "wonum", "woDetailResource");
	const woDetailsds = newDatasource(
		workorderitem, "member", "wonum", "woDetailds"
	  );
	const wodetails = newDatasource(
		workorderitem, "member", "wonum", "wodetails"
	);
	const laborScheduleDS = newStatusDatasource(labor.labordetails2, 'woLaborDetaildsOnSchedule');
	const laborDetailsDS = newStatusDatasource(labor.labordetails2, "woLaborDetailds");
	app.registerDatasource(laborDetailsDS);
	app.registerDatasource(laborScheduleDS);
	app.registerDatasource(woDetailResource);
	app.registerDatasource(woDetailsds);
	app.registerDatasource(wodetails);
	
	it('Check and Verify Asset Barcode If Applicable', async () => {
		const parentPage = new Page({name: 'schedule', state: {referencePage: 'schedule'}});
		const page = new Page({name: 'page', parent: parentPage});
		page.registerController(controller);
		page.parent = parentPage ;
		app.registerController(controller);
		const taskstatusDomainList = newStatusDatasource(statusitem, 'taskstatusDomainList');
		parentPage.registerDatasource(taskstatusDomainList);
		page.parent.state.woItem = await woDetailResource.load();
		const checkActiveLabStub = sinon.stub(WOUtil, 'isActiveLabTrans').returns(true);
		await app.initialize();
		
		app.setCurrentPage = mockSetPage;
		app.state = {
			systemProp: {
			'maximo.mobile.statusforphysicalsignature': 'APPR,WAPPR'
			},
			skipScan: true,
			selectedStatusMaxValue: 'COMP'
		};
		page.getApplication = () => app;
		controller.dialogInitialized(page);
		page.parent.state.referencePage = "schedule";
		page.parent.state.referenceDS = 'taskstatusDomainList'
		page.state.selectedStatus = 'APPR';
		page.state.selectedStatusMaxValue = 'COMP';

		sinon.stub(taskstatusDomainList, "invokeAction").returns(statusitem[0]);
		sinon.stub(page.parent, "findDialog").returns({closeDialog: ()=>{}});
		const getActiveLabTrans = sinon.stub(WOUtil, "getActiveLabTrans").returns(["ITEM"]);
		const stopWorkOnStatusComp = sinon.stub(WOTimerUtil, "stopWorkOnStatusComp").returns(["ITEM"]);
		
		await controller.changeStatus();
		expect(getActiveLabTrans.called).toBe(true);
		expect(stopWorkOnStatusComp.called).toBe(true);
		getActiveLabTrans.restore();
		stopWorkOnStatusComp.restore();
		checkActiveLabStub.restore();
	});

	it('should check change status funcitonality in workOrderDetails', async () => {

		const parentPage = new Page({name: 'workOrderDetails', state: {referencePage: 'workOrderDetails'}});
		const schPage = new Page({name: 'schedule', state: {selectedDS: 'woDetailResource'}});
		const page = new Page({name: 'page', parent: parentPage, state: {selectedDS: 'woDetailResource'}});
		const checkActiveLabStub = sinon.stub(WOUtil, 'isActiveLabTrans').returns(true);
		page.registerController(controller);
		page.parent = parentPage ;
		app.registerController(controller);
		const taskstatusDomainList = newStatusDatasource(statusitem, 'taskstatusDomainList');
		parentPage.registerDatasource(taskstatusDomainList);
		page.parent.state.woItem = await woDetailResource.load();
		app.registerPage(parentPage);
		app.registerPage(schPage);

		await app.initialize();
		
		app.setCurrentPage = mockSetPage;
		app.state = {
			systemProp: {
			'maximo.mobile.statusforphysicalsignature': 'APPR,WAPPR'
			},
			skipScan: true,
			selectedStatusMaxValue: 'COMP'
		};
		page.getApplication = () => app;
		controller.dialogInitialized(page);
		page.parent.state.referencePage = "workOrderDetails";
		page.parent.state.referenceDS = 'taskstatusDomainList'
		page.state.selectedStatus = 'APPR';
		page.state.selectedStatusMaxValue = 'COMP'

		sinon.stub(taskstatusDomainList, "invokeAction").returns(statusitem[0]);
		sinon.stub(page.parent, "findDialog").returns({closeDialog: ()=>{}});
		const getActiveLabTrans = sinon.stub(WOUtil, "getActiveLabTrans").returns(["ITEM"]);
		const stopWorkOnStatusComp = sinon.stub(WOTimerUtil, "stopWorkOnStatusComp").returns(["ITEM"]);
		jest.spyOn(controller, 'checkEsigRequired').mockImplementationOnce(() => true);
		
		await controller.changeStatus();
		expect(getActiveLabTrans.called).toBe(true);
		expect(stopWorkOnStatusComp.called).toBe(true);
		getActiveLabTrans.restore();
		stopWorkOnStatusComp.restore();
		checkActiveLabStub.restore();
	});

	// Assisted by WCA@IBM
	// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
	it('Check and Verify for enforce asset scan', async () => {
		const parentPage = new Page({name: 'schedule', state: {referencePage: 'schedule',
			enforceAssetScan: 1,
			woItem: workorderitem.member[0]
		}});
		const page = new Page({name: 'page', parent: parentPage});
		page.registerController(controller);
		page.parent = parentPage ;
		app.registerController(controller);
		const taskstatusDomainList = newStatusDatasource(statusitem, 'taskstatusDomainList');
		parentPage.registerDatasource(taskstatusDomainList);

		app.registerPage(parentPage);
		app.registerPage(page);

		await app.initialize();
		jest.spyOn(commonUtil, 'checkScanRequired').mockImplementationOnce(() => Promise.resolve(true));
		jest.spyOn(app, 'showDialog').mockImplementation(() => {});
		
		app.setCurrentPage = mockSetPage;
		app.state = {
			systemProp: {
				'maximo.mobile.statusforphysicalsignature': 'APPR,WAPPR',
				'maximo.mobile.safetyplan.review' : '0'
			},
			skipScan: true,
			selectedStatusMaxValue: 'COMP',
			disableScan: false,
		};
		page.getApplication = () => app;
		controller.dialogInitialized(page);
		page.parent.state.woItem = workorderitem.member[0];
		
		page.parent.state.referencePage = "schedule";
		page.parent.state.referenceDS = 'taskstatusDomainList'
		page.state.selectedStatus = 'COMP';
		page.state.selectedStatusMaxValue = 'COMP'

		sinon.stub(taskstatusDomainList, "invokeAction").returns(statusitem[0]);
		sinon.stub(page.parent, "findDialog").returns({closeDialog: ()=>{}});
		const getActiveLabTrans = sinon.stub(WOUtil, "getActiveLabTrans").returns(["ITEM"]);
		const stopWorkOnStatusComp = sinon.stub(WOTimerUtil, "stopWorkOnStatusComp").returns(["ITEM"]);
		
		page.parent.state.enforceAssetScan = 1;
		await controller.changeStatus();
		expect(getActiveLabTrans.called).toBe(false);
		expect(stopWorkOnStatusComp.called).toBe(false);
		getActiveLabTrans.restore();
		stopWorkOnStatusComp.restore();
	});

	// Assisted by WCA@IBM
	// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
	it('should Open wohazard if not reviewed', async () => {
		const parentPage = new Page({name: 'workOrderDetails', state: {referencePage: 'workOrderDetails'}});
		const schPage = new Page({name: 'schedule', state: {selectedDS: 'taskstatusDomainList'}});
		const page = new Page({name: 'page', parent: parentPage});
		page.registerController(controller);
		page.parent = parentPage ;
		app.registerController(controller);
		const taskstatusDomainList = newStatusDatasource(statusitem, 'taskstatusDomainList');
		parentPage.registerDatasource(taskstatusDomainList);
		page.parent.state.woItem = {...workorderitem.member[0], wohazardcount: 1};
		app.registerPage(parentPage);
		app.registerPage(schPage);

		await app.initialize();
		
		app.setCurrentPage = mockSetPage;
		app.state = {
			systemProp: {
				'maximo.mobile.statusforphysicalsignature': 'APPR,WAPPR',
				'maximo.mobile.safetyplan.review' : '1'
			},
			skipScan: true,
			selectedStatusMaxValue: 'INPRG'
		};
		page.getApplication = () => app;
		controller.dialogInitialized(page);
		page.parent.state.referencePage = "workOrderDetails";
		page.parent.state.referenceDS = 'taskstatusDomainList'
		page.state.selectedStatus = 'INPRG';
		page.state.selectedStatusMaxValue = 'INPRG'

		const openWOHazardDrawer = sinon.stub(WOUtil, "openWOHazardDrawer").returns();
		sinon.stub(page.parent, "findDialog").returns({closeDialog: ()=>{}});
		
		await controller.changeStatus();
		expect(openWOHazardDrawer.called).toBe(true);
		openWOHazardDrawer.restore();
	});

	it('should return if not valid datasheet when work order has calibration marked asset', async () => {

		const parentPage = new Page({name: 'workOrderDetails', state: {referencePage: 'workOrderDetails'}});
		const schPage = new Page({name: 'schedule', state: {selectedDS: 'taskstatusDomainList'}});
		const page = new Page({name: 'page', parent: parentPage});
		page.registerController(controller);
		page.parent = parentPage ;
		app.registerController(controller);
		const taskstatusDomainList = newStatusDatasource(statusitem, 'taskstatusDomainList');
		parentPage.registerDatasource(taskstatusDomainList);
		page.parent.state.woItem = {...workorderitem.member[0], iscalibration: true, pluscwodscount: 1};
		app.registerPage(parentPage);
		app.registerPage(schPage);

		await app.initialize();
		
		app.setCurrentPage = mockSetPage;
		app.state = {
			systemProp: {
			'maximo.mobile.statusforphysicalsignature': 'APPR,WAPPR'
			},
			skipScan: true,
			selectedStatusMaxValue: 'COMP'
		};
		page.getApplication = () => app;
		controller.dialogInitialized(page);
		page.parent.state.referencePage = "workOrderDetails";
		page.parent.state.referenceDS = 'taskstatusDomainList'
		page.state.selectedStatus = 'APPR';
		page.state.selectedStatusMaxValue = 'COMP'

		sinon.stub(taskstatusDomainList, "invokeAction").returns(statusitem[0]);
		sinon.stub(page.parent, "findDialog").returns({closeDialog: ()=>{}});
		const getActiveLabTrans = sinon.stub(WOUtil, "getActiveLabTrans").returns(["ITEM"]);
		const stopWorkOnStatusComp = sinon.stub(WOTimerUtil, "stopWorkOnStatusComp").returns(["ITEM"]);
		const validateDataSheet = sinon.stub(commonUtil, 'validateDataSheet').returns(false);
		
		await controller.changeStatus();
		expect(getActiveLabTrans.called).toBe(false);
		expect(stopWorkOnStatusComp.called).toBe(false);
		expect(validateDataSheet.called).toBe(true);
		getActiveLabTrans.restore();
		stopWorkOnStatusComp.restore();
		validateDataSheet.restore();
		
	});

	// Assisted by WCA@IBM
	// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
	it('should Open wohazard if not reviewed', async () => {
		const parentPage = new Page({name: 'workOrderDetails', state: {referencePage: 'workOrderDetails'}});
		const schPage = new Page({name: 'schedule', state: {selectedDS: 'taskstatusDomainList'}});
		const page = new Page({name: 'page', parent: parentPage});
		page.registerController(controller);
		page.parent = parentPage ;
		app.registerController(controller);
		const taskstatusDomainList = newStatusDatasource(statusitem, 'taskstatusDomainList');
		parentPage.registerDatasource(taskstatusDomainList);
		page.parent.state.woItem = {...workorderitem.member[0], wohazardcount: 1};
		app.registerPage(parentPage);
		app.registerPage(schPage);

		await app.initialize();
		
		app.setCurrentPage = mockSetPage;
		app.state = {
			systemProp: {
				'maximo.mobile.statusforphysicalsignature': 'APPR,WAPPR',
				'maximo.mobile.safetyplan.review' : '1'
			},
			skipScan: true,
			selectedStatusMaxValue: 'INPRG'
		};
		page.getApplication = () => app;
		controller.dialogInitialized(page);
		page.parent.state.referencePage = "workOrderDetails";
		page.parent.state.referenceDS = 'taskstatusDomainList'
		page.state.selectedStatus = 'INPRG';
		page.state.selectedStatusMaxValue = 'INPRG'

		const openWOHazardDrawer = sinon.stub(WOUtil, "openWOHazardDrawer").returns();
		sinon.stub(page.parent, "findDialog").returns({closeDialog: ()=>{}});
		const isSafetyPlanReviewedStub = sinon.stub(WOUtil, "isSafetyPlanReviewed").returns(true);
		await controller.changeStatus();
		expect(openWOHazardDrawer.called).toBe(true);
		expect(isSafetyPlanReviewedStub.called).toBe(true);
		openWOHazardDrawer.restore();
		isSafetyPlanReviewedStub.restore();
	});

	// Assisted by WCA@IBM
	// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
	it('should return if not valid actual tool and work order has calibration marked asset', async () => {
		const parentPage = new Page({name: 'workOrderDetails', state: {referencePage: 'workOrderDetails'}});
		const schPage = new Page({name: 'schedule', state: {selectedDS: 'taskstatusDomainList'}});
		const page = new Page({name: 'page', parent: parentPage});
		page.registerController(controller);
		page.parent = parentPage ;
		app.registerController(controller);
		const taskstatusDomainList = newStatusDatasource(statusitem, 'taskstatusDomainList');
		parentPage.registerDatasource(taskstatusDomainList);
		page.parent.state.woItem = {...workorderitem.member[0], iscalibration: true, pluscwodscount: 1};
		app.registerPage(parentPage);
		app.registerPage(schPage);
		await app.initialize();
		
		app.setCurrentPage = mockSetPage;
		app.state = {
			systemProp: {
			'maximo.mobile.statusforphysicalsignature': 'APPR,WAPPR'
			},
			skipScan: true,
			selectedStatusMaxValue: 'COMP',
			skipToolWarning: false,
      		disableToolWarning: false,
		};
		page.getApplication = () => app;
		controller.dialogInitialized(page);
		page.parent.state.referencePage = "workOrderDetails";
		page.parent.state.referenceDS = 'taskstatusDomainList'
		page.state.selectedStatus = 'APPR';
		page.state.selectedStatusMaxValue = 'COMP'

		sinon.stub(taskstatusDomainList, "invokeAction").returns(statusitem[0]);
		sinon.stub(page.parent, "findDialog").returns({closeDialog: ()=>{}});
		const getActiveLabTrans = sinon.stub(WOUtil, "getActiveLabTrans").returns(["ITEM"]);
		const stopWorkOnStatusComp = sinon.stub(WOTimerUtil, "stopWorkOnStatusComp").returns(["ITEM"]);
		const validateDataSheet = sinon.stub(commonUtil, 'validateDataSheet').returns(true);
		const validateActualTools = sinon.stub(commonUtil, 'validateActualTools').returns(false);
		
		await controller.changeStatus();
		expect(getActiveLabTrans.called).toBe(false);
		expect(stopWorkOnStatusComp.called).toBe(false);
		expect(validateDataSheet.called).toBe(true);
		expect(validateActualTools.called).toBe(true);
		getActiveLabTrans.restore();
		stopWorkOnStatusComp.restore();
		validateDataSheet.restore();
		validateActualTools.restore();
		
	});

	// Assisted by WCA@IBM
	// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
	it('should check if esignature is enabled and return back', async () => {
		const parentPage = new Page({name: 'workOrderDetails', state: {referencePage: 'workOrderDetails', enableSignatureButton: true}});
		const schPage = new Page({name: 'schedule', state: {selectedDS: 'taskstatusDomainList'}});
		const page = new Page({name: 'page', parent: parentPage});
		page.registerController(controller);
		page.parent = parentPage ;
		app.registerController(controller);
		const taskstatusDomainList = newStatusDatasource(statusitem, 'taskstatusDomainList');
		parentPage.registerDatasource(taskstatusDomainList);
		page.parent.state.woItem = {...workorderitem.member[0], iscalibration: false, pluscwodscount: 0};
		app.registerPage(parentPage);
		app.registerPage(schPage);
		await app.initialize();
		
		app.setCurrentPage = mockSetPage;
		app.controllers = [{
			getWoActivity: () => ['item']
		}]
		app.state = {
			systemProp: {
			'maximo.mobile.statusforphysicalsignature': 'APPR,WAPPR'
			},
			skipScan: false,
			selectedStatusMaxValue: 'COMP',
			skipToolWarning: false,
      		disableToolWarning: false,
		};
		page.getApplication = () => app;
		controller.dialogInitialized(page);
		page.parent.state.referencePage = "workOrderDetails";
		page.parent.state.referenceDS = 'taskstatusDomainList'
		page.parent.state.enableSignatureButton = true;
		page.state.selectedStatus = 'APPR';
		page.state.selectedStatusMaxValue = 'COMP'

		sinon.stub(taskstatusDomainList, "invokeAction").returns(statusitem[0]);
		sinon.stub(page.parent, "findDialog").returns({closeDialog: ()=>{}});
		const getActiveLabTrans = sinon.stub(WOUtil, "getActiveLabTrans").returns(["ITEM"]);
		const stopWorkOnStatusComp = sinon.stub(WOTimerUtil, "stopWorkOnStatusComp").returns(["ITEM"]);
		const validateDataSheet = sinon.stub(commonUtil, 'validateDataSheet').returns(true);
		const validateActualTools = sinon.stub(commonUtil, 'validateActualTools').returns(true);
		const openSignatureDialog = jest.spyOn(controller, 'openSignatureDialog').mockImplementationOnce(() => true);
		page.parent.state.enableSignatureButton = true;
		
		await controller.changeStatus();
		expect(getActiveLabTrans.called).toBe(false);
		expect(stopWorkOnStatusComp.called).toBe(false);
		expect(validateDataSheet.called).toBe(false);
		expect(validateActualTools.called).toBe(false);
		expect(openSignatureDialog).toHaveBeenCalled();
		getActiveLabTrans.restore();
		stopWorkOnStatusComp.restore();
		validateDataSheet.restore();
		validateActualTools.restore();
		
	});


	// Assisted by WCA@IBM
	// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
	it('should check esignature is not enabled and continue', async () => {
		const parentPage = new Page({name: 'workOrderDetails', state: {referencePage: 'workOrderDetails', enableSignatureButton: true}});
		const schPage = new Page({name: 'schedule', state: {selectedDS: 'taskstatusDomainList'}});
		const page = new Page({name: 'page', parent: parentPage});
		const checkActiveLabStub = sinon.stub(WOUtil, 'isActiveLabTrans').returns(true);
		page.registerController(controller);
		page.parent = parentPage ;
		app.registerController(controller);
		const taskstatusDomainList = newStatusDatasource(statusitem, 'taskstatusDomainList');
		parentPage.registerDatasource(taskstatusDomainList);
		page.parent.state.woItem = {...workorderitem.member[0], iscalibration: false, pluscwodscount: 0};
		app.registerPage(parentPage);
		app.registerPage(schPage);
		await app.initialize();
		
		app.setCurrentPage = mockSetPage;
		app.controllers = [{
			getWoActivity: () => ['item']
		}]
		app.state = {
			systemProp: {
			'maximo.mobile.statusforphysicalsignature': 'APPR,WAPPR'
			},
			skipScan: false,
			selectedStatusMaxValue: 'COMP',
			skipToolWarning: false,
      		disableToolWarning: false,
		};
		page.getApplication = () => app;
		controller.dialogInitialized(page);
		page.parent.state.referencePage = "workOrderDetails";
		page.parent.state.referenceDS = 'taskstatusDomainList'
		page.parent.state.enableSignatureButton = true;
		page.state.selectedStatus = 'APPR';
		page.state.selectedStatusMaxValue = 'COMP'

		Device.get ().isMaximoMobile = true;

		sinon.stub(taskstatusDomainList, "invokeAction").returns(statusitem[0]);
		sinon.stub(page.parent, "findDialog").returns({closeDialog: ()=>{}});
		const getActiveLabTrans = sinon.stub(WOUtil, "getActiveLabTrans").returns(["ITEM"]);
		const stopWorkOnStatusComp = sinon.stub(WOTimerUtil, "stopWorkOnStatusComp").returns(["ITEM"]);
		const validateDataSheet = sinon.stub(commonUtil, 'validateDataSheet').returns(true);
		const validateActualTools = sinon.stub(commonUtil, 'validateActualTools').returns(true);
		const openSignatureDialog = jest.spyOn(controller, 'openSignatureDialog').mockImplementationOnce(() => false);
		page.parent.state.enableSignatureButton = false;
		
		await controller.changeStatus();
		expect(getActiveLabTrans.called).toBe(true);
		expect(stopWorkOnStatusComp.called).toBe(true);
		expect(validateDataSheet.called).toBe(false);
		expect(validateActualTools.called).toBe(false);
		expect(openSignatureDialog).not.toHaveBeenCalled();
		getActiveLabTrans.restore();
		stopWorkOnStatusComp.restore();
		checkActiveLabStub.restore();
	});

	it.each([
		{ iscalibration: true, pluscloop: false, pmnum: '1008', selectedStatus: 'COMP', calibrationLabelDialogExpected: true },
		{ iscalibration: true, pluscloop: false, pmnum: '1008', selectedStatus: 'INPRG', calibrationLabelDialogExpected: false },
		{ iscalibration: false, pluscloop: true, pmnum: '1009', selectedStatus: 'COMP', calibrationLabelDialogExpected: true },
		{ iscalibration: true, pluscloop: false, pmnum: undefined, selectedStatus: 'COMP', calibrationLabelDialogExpected: false },
		{ iscalibration: false, pluscloop: false, pmnum: undefined, selectedStatus: 'COMP', calibrationLabelDialogExpected: false }
	])('should display/not display calibration label after status change according to condition', 
		async ({ iscalibration, pluscloop, pmnum, selectedStatus, calibrationLabelDialogExpected }) => {
			// initial setup
			const parentPage = new Page({name: 'schedule'});
			const page = new Page({name: 'page'});
			const woDetailsPage = new Page({name: 'workOrderDetails'})
			
			page.registerController(controller);
			app.registerController(controller);
			woDetailsPage.registerDatasource(woDetailResource);
			
			app.registerPage(parentPage);
			app.registerPage(page);
			await app.initialize();
			
			app.setCurrentPage = mockSetPage;
			page.getApplication = () => app;
			controller.dialogInitialized(page);
			page.parent = parentPage;
			page.parent.state.woItem = await woDetailResource.load();
			page.state = {
				selectedStatus: selectedStatus,
				selectedStatusMaxValue: selectedStatus
			};
			parentPage.state = {
				referenceDS: 'woDetailResource',
				woItem: {...woDetailResource.item, iscalibration: iscalibration, pluscloop: pluscloop, pmnum: pmnum},
				referencePage: "workOrderDetails"
			};
			
			// spies and mocks
			const showDialogSpy = jest.spyOn(app, 'showDialog').mockImplementation(() => {});
			sinon.stub(page.parent, "findDialog").returns({closeDialog: ()=>{}});
			const findPagesStub = sinon.stub(app.pages, 'find').returns(woDetailsPage);
			const checkActiveLabStub = sinon.stub(WOUtil, 'isActiveLabTrans').returns(true);
			const getActiveLabTrans = sinon.stub(WOUtil, "getActiveLabTrans").returns(["ITEM"]);
			const stopWorkOnStatusComp = sinon.stub(WOTimerUtil, "stopWorkOnStatusComp").returns(["ITEM"]);
			const invokeActionStub = sinon.stub(woDetailResource, "invokeAction").returns({});

			// perform change status
			await controller.changeStatus();

			// Assert
			if(calibrationLabelDialogExpected) {
				expect(showDialogSpy).toHaveBeenCalledWith("calibrationLabelDialog", {}, {'item': page.parent.state.woItem});
			}
			else {
				expect(showDialogSpy).not.toHaveBeenCalledWith("calibrationLabelDialog");
			}

			// Clean-up
			findPagesStub.restore();
			checkActiveLabStub.restore();
			getActiveLabTrans.restore();
			stopWorkOnStatusComp.restore();
			invokeActionStub.restore();
			showDialogSpy.mockRestore();
		}
	);
});