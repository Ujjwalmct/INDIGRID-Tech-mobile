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

// Assisted by watsonx Code Assistant 

import SparePartPageController from './SparePartPageController'
import { Application, Page, Datasource, JSONDataAdapter } from '@maximo/maximo-js-api';
import wpmaterial from "./test/materials-json-data";
import workorderitem from "./test/wo-failure-report-json-data";
import sparepart from "./test/spartpart-json-data.js";
import assetLookupData from "./test/asset-lookup-json-data.js";
import CommonUtil from './utils/CommonUtil.js'
import SynonymUtil from './utils/SynonymUtil.js'
import statusitem from './test/statuses-json-data.js';
import sparematerials from './test/spartpart-json-data.js';
import sinon from 'sinon';

function newStatusDatasource(data = statusitem, name = 'synonymdomainData') {
  const da = new JSONDataAdapter({
    src: data,
    items: 'member',
    schema: 'responseInfo.schema',
  });

  const ds = new Datasource(da, {
    idAttribute: 'value',
    name: name,
  });

  return ds;
}

function materialDatasource(data = wpmaterial, idAttribute = 'wonum', items = 'member', name = 'inventoryListDS') {
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

function newLookupDatasource(
  data,
  name = "assetLookupDS",
  idAttribute = "assetnum"
) {
  const da = new JSONDataAdapter({
    src: data,
    items: "member",
  });

  const ds = new Datasource(da, {
    idAttribute: idAttribute,
    name: name,
  });

  return ds;
}

function newReportDatasource(data = workorderitem, items="member", idAttribute="wonum", name = "woDetailsReportWork") {
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

function newAssetLocationDatasource(data = workorderitem, name = 'woAssetLocationds') {
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

function newDatasource(data = workorderitem, name = 'workorderds') {
  const da = new JSONDataAdapter({
    src: workorderitem,
    items: 'member',
    schema: 'responseInfo.schema',
  });

  const ds = new Datasource(da, {
    idAttribute: 'wonum',
    name: name,
  });

  ds.clearSelections = jest.fn();
  return ds;
}

describe('onSaveDataFailed', () => {
  it('should set saveDataSuccessful to false', async () => {
    const controller = new SparePartPageController();
    const app = new Application();
    const page = new Page({ name: 'sparePart' });
    controller.pageInitialized(page, app);
    app.registerController(controller);
    await app.initialize();
    controller.onSaveDataFailed();
    expect(controller.saveDataSuccessful).toBe(false);
  });
});

it('should call page resumed method', async () => {
  const controller = new SparePartPageController();
  const app = new Application();
  const page = new Page({
    name: 'sparePart',
    state: { title: '' },
  });
  controller.page = page;
  controller.pageInitialized(page, app);
  app.registerController(controller);
  await app.initialize();
  const loadPageResumedSpy = jest.spyOn(controller, 'loadPageResumed').mockImplementationOnce(() => true);

  controller.pageResumed();
  expect(loadPageResumedSpy).toHaveBeenCalled();
  expect(page.state.title).toBe("Select spare parts");
});

it('should call loadPageResumed', async () => {
  const controller = new SparePartPageController();
  const app = new Application();
  const page = new Page({
    name: 'sparePart',
  });
  controller.page = page;
  controller.pageInitialized(page, app);
  app.registerController(controller);
  await app.initialize();
  const loadSparePartSpy = jest.spyOn(controller, 'loadSparePart').mockImplementationOnce(() => true);

  controller.loadPageResumed();
  expect(loadSparePartSpy).toHaveBeenCalled();
});

it('should call selectAsset', async () => {
  const controller = new SparePartPageController();
  const app = new Application();
  const page = new Page({
    name: 'sparePart',
  });

  const assetLookupDS = newLookupDatasource(wpmaterial, "assetLookupDS");
  app.registerDatasource(assetLookupDS);
  controller.page = page;
  controller.pageInitialized(page, app);
  app.registerController(controller);
  await app.initialize();
  
  const IntializeQBEStub = sinon.stub(assetLookupDS,"initializeQbe");
  const setQBEStub = sinon.stub(assetLookupDS,"setQBE");
  const searchQBEStub = sinon.stub(assetLookupDS,"searchQBE");
  jest.spyOn(controller, 'loadPageResumed').mockImplementationOnce(() => true);
  const evt = {assetnum : "11430"}

  controller.selectAsset(evt);
  expect(IntializeQBEStub.displayName).toBe('initializeQbe');
  expect(setQBEStub.displayName).toBe('setQBE');
  expect(searchQBEStub.displayName).toBe('searchQBE');
});

it("Should handleDeleteTransaction", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();
  const controller = new SparePartPageController();
  const app = new Application();
  const page = new Page({ name: "sparePart" });
  app.lastPage = { name: "sparePart" };

  await app.initialize();

  controller.pageInitialized(page, app);
  
  const woReportWorkDs = newReportDatasource(workorderitem, "member", "wonum", "woDetailsReportWork");
  const reportWorkActualMaterialDs = newReportDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');

  app.registerDatasource(woReportWorkDs);
  app.registerDatasource(reportWorkActualMaterialDs);

  const woReportWorkDsStub = sinon.stub(woReportWorkDs, "forceReload");
  const reportWorkActualMaterialDsStub = sinon.stub(reportWorkActualMaterialDs, "forceReload");
  

   let txn = {
    app: "Application",
    href: "testhref",
  };

  await controller.handleDeleteTransaction(txn);
  expect(woReportWorkDsStub.displayName).toBe("forceReload");
  expect(reportWorkActualMaterialDsStub.displayName).toBe("forceReload");

  app.setCurrentPage = mockSetPage;
  app.currentPage = page;

  await controller.handleDeleteTransaction(txn);
  expect(woReportWorkDsStub.displayName).toBe("forceReload");
  expect(reportWorkActualMaterialDsStub.displayName).toBe("forceReload");

 await controller.handleDeleteTransaction();

});

it('should call goBackToReportPage', async () => {
  const controller = new SparePartPageController();
  const app = new Application();
  const page = new Page({
    name: 'sparePart',
  });
  controller.page = page;
  controller.pageInitialized(page, app);
  app.registerController(controller);
  await app.initialize();

  const navigateSpy = jest.spyOn(app, 'navigateBack').mockImplementationOnce(() => true);

  controller.goBackToReportPage();
  expect(navigateSpy).toHaveBeenCalled();
  
});


it('should call openAssetlookup',async () => {
  const controller = new SparePartPageController();
  const app = new Application();
  app.showDialog = jest.fn();
  await app.initialize();
  app.registerController(controller);
  controller.openAssetLookup();
})

it('should call loadSparePart', async () => {
  const controller = new SparePartPageController();
  const app = new Application();
  const page = new Page({
    name: 'sparePart',
  });
  app.client = {
    userInfo: {
      insertSite: 'BEDFORD',
    }
  };

  const assetDataDs = newLookupDatasource( assetLookupData, "assetLookupDS");
  app.registerDatasource(assetDataDs);
  const woAssetLocationds = newAssetLocationDatasource(workorderitem, 'woAssetLocationds');
  app.registerDatasource(woAssetLocationds);
  const inventoryDS = materialDatasource(sparematerials, 'member','itemnum', 'inventoryDS');
  app.registerDatasource(inventoryDS);

  const sparePartJsonDs = newDatasource(sparepart,'sparePartJsonDs');
  page.registerDatasource(sparePartJsonDs);
  await assetDataDs.load();
  await sparePartJsonDs.load();
  await inventoryDS.load();

  const resetDsSpy = jest.spyOn(CommonUtil, '_resetDataSource').mockImplementationOnce(() => true);
  const initializeQbeSpy = sinon.stub(inventoryDS, 'initializeQbe');
  const setQbeSpy = sinon.stub(inventoryDS, 'setQBE');
  const searchQbeSpy = sinon.stub(inventoryDS, 'searchQBE');
  controller.page = page;
  controller.pageInitialized(page, app);
  app.registerController(controller);
  await app.initialize();

  const evt1 = { callFromLookup: false }
  controller.loadSparePart(evt1);
  expect(resetDsSpy).not.toHaveBeenCalled();

 const evt = { callFromLookup: true } 
 await woAssetLocationds.load();
 controller.loadSparePart(evt);
 expect(resetDsSpy).toHaveBeenCalled();
 expect(initializeQbeSpy.displayName).toBe('initializeQbe');
 expect(setQbeSpy.displayName).toBe('setQBE');
 expect(searchQbeSpy.displayName).toBe('searchQBE');

});

it('should call setSpareParts', async () => {
  const controller = new SparePartPageController();
  const app = new Application();
  const page = new Page({
    name: 'sparePart',
    state: {loadConfirmSelection : true}
  });
  app.client = {
    userInfo: {
      insertSite: 'BEDFORD',
    }
  };

  const synonymData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerDatasource(synonymData);
  await synonymData.load();

  sinon
  .stub(SynonymUtil, 'getSynonymDomain')
  .returns({ value: 'ISSUE', maxvalue: 'ISSUE', description: 'ISSUE' });

  const sparePartJsonDs = newDatasource(sparepart, 'sparePartJsonDs');
  page.registerDatasource(sparePartJsonDs);
  await sparePartJsonDs.load();


  const reportWorkActualMaterialDs = newReportDatasource(workorderitem, 'member', 'itemnum', 'reportWorkActualMaterialDs');
  app.registerDatasource(reportWorkActualMaterialDs);
  await reportWorkActualMaterialDs.load();

  sinon.stub(sparePartJsonDs, 'getSelectedItems').returns(sparepart);

  const bulkAddStub = sinon.stub(reportWorkActualMaterialDs, 'bulkAdd');

  controller.page = page;
  controller.pageInitialized(page, app);
  app.registerController(controller);
  await app.initialize();

  controller.saveDataSuccessful = true;
  controller.setSpareParts();
  expect(bulkAddStub.displayName).toBe("bulkAdd");
})

it('should call handlePageExit', async () => {
  const controller = new SparePartPageController();
  const app = new Application();
  const page = new Page({
    name: 'sparePart',
    state: {loadConfirmSelection : true}
  });

  const sparePartJsonDs = newDatasource(sparepart, 'sparePartJsonDs');
  page.registerDatasource(sparePartJsonDs);
  await sparePartJsonDs.load();
  const mockShowDialog = jest.spyOn(page, 'showDialog');
  const mockNavigateBack = jest.spyOn(app, 'navigateBack');

  let sparePartStub = sinon.stub(sparePartJsonDs, 'getSelectedItems').returns(sparepart);

  controller.page = page;
  controller.pageInitialized(page, app);
  app.registerController(controller);
  await app.initialize();

  controller.handlePageExit();
  expect(mockShowDialog).toHaveBeenCalledWith('saveDiscardDialog_sparepage');
  sparePartStub.restore();

  sinon.stub(sparePartJsonDs, 'getSelectedItems').returns([]);
  controller.handlePageExit();
  expect(mockNavigateBack).toHaveBeenCalled();
  

})

it('should call validateSparePart',async () => {
  const controller = new SparePartPageController();
  const app = new Application();
  const page = new Page({
    name: 'sparePart',
  });

  const sparePartJsonDs = newDatasource(sparepart, 'sparePartJsonDs');
  page.registerDatasource(sparePartJsonDs);
  await sparePartJsonDs.load(sparePartJsonDs.item.sparepart);

  controller.page = page;
  controller.pageInitialized(page, app);
  app.registerController(controller);
  await app.initialize();

 const event = {
    item: {
      quantity: null,
      maxquantity: 10,
      hasError: false,
      itemnum: "11453",
    },
  };

  controller.validateSparePart(event);
  expect(event.item.hasError).toBe(false);

  const event1 = {
    item: {
      quantity: 5,
      maxquantity: 10,
      hasError: false,
      itemnum: "11453",
    },
  };

  controller.validateSparePart(event1);
  expect(event.item.hasError).toBe(false);

  const event2 = {
    item: {
      quantity: 11,
      maxquantity: 10,
      hasError: true,
      itemnum: "11453",
    },
  };

  controller.validateSparePart(event2);
  expect(event.item.hasError).toBe(false);

})

it('should call disableSaveButton',async () => {
  const controller = new SparePartPageController();
  const app = new Application();
  const page = new Page({
    name: 'sparePart',
    state: {disableSaveButton : true}
  });

  const sparePartJsonDs = newDatasource(sparepart, 'sparePartJsonDs');
  page.registerDatasource(sparePartJsonDs);
  await sparePartJsonDs.load(sparePartJsonDs.item.sparepart);


  controller.page = page;
  controller.pageInitialized(page, app);
  app.registerController(controller);
  await app.initialize();


  await app.initialize();
  app.registerController(controller);

  controller.disableSaveButton();
  expect(page.state.disableSaveButton).toBe(true);

})
