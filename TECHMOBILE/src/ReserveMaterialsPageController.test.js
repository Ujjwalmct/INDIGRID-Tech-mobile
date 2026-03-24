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

import ReserveMaterialsPageController from './ReserveMaterialsPageController';
import {
  Application,
  Page,
  JSONDataAdapter,
  Datasource,
  Device,
} from '@maximo/maximo-js-api';

import workorderitem from './test/wo-detail-json-data.js';
import statusitem from './test/statuses-json-data.js';
import sinon from 'sinon';
import SynonymUtil from './utils/SynonymUtil';
import reservedItemRotatingAsset from './test/rotating-asset-data.js'

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

it('load records', async () => {
  const controller = new ReserveMaterialsPageController();
  const app = new Application();
  const page = new Page({
    name: 'reserveMaterials',
    state: { disableReservedMaterialAction: true },
  });

  app.registerController(controller);
  app.registerPage(page);

  const woMaterialResource = newDatasource(workorderitem, 'woMaterialResource');
  const woMaterialResourcejson = newDatasource(
    workorderitem,
    'woReservedMaterialNonRotating'
  );

  const woReservedMaterialds = newDatasource(
    workorderitem,
    'woReservedMaterialds'
  );
  await woReservedMaterialds.load();
  page.registerDatasource(woReservedMaterialds);
  page.registerDatasource(woMaterialResource);
  page.registerDatasource(woMaterialResourcejson);
  await app.initialize();
  await controller.loadPageResumed();

  jest.spyOn(controller, "_resetDataSource").mockImplementation(() => { });
  let searchReservedMaterial = jest.spyOn(woReservedMaterialds, 'initializeQbe').mockImplementation(() => true);
  expect(searchReservedMaterial).toBeTruthy();
});


it('should select the rotating asset', async () => {
  const fakeData = [
    { isrotating: true, reservedqty: 11, itemnum: 'item1', location: 'loc1', binnum: 'bin1', oplocation: 'oploc1', requestnum: 'req1', description: 'desc1', locationsdesc: 'locdesc1', invreserveid: 'inv1', storelocsiteid: 'site1', rotassetnum: 'asset1' }
  ];

  const controller = new ReserveMaterialsPageController();
  controller.selectedReservedItems = fakeData;
  const app = new Application();
  const page = new Page({
    name: 'reserveMaterials',
    state: { rotatingItemWithNoAsset: [], items: [], sendSelectedAssets: true },
  });

  const reservedRotatingAssetJsonDS = newDatasource(reservedItemRotatingAsset, 'reservedItemRotatingAssetJsonDS');
  const reservedRotatingAssetDS = newDatasource(reservedItemRotatingAsset, 'reservedItemRotatingAssetDS');
  const woReservedMaterialNonRotating = newDatasource(workorderitem, 'woReservedMaterialNonRotating');
  const woReservedMaterialRotating = newDatasource(workorderitem, 'woReservedMaterialRotating');
  const synonymData = newStatusDatasource(statusitem, 'synonymdomainData');
  app.registerController(controller);
  app.registerPage(page);
  app.registerDatasource(reservedRotatingAssetDS);
  app.registerDatasource(reservedRotatingAssetJsonDS);
  page.registerDatasource(woReservedMaterialNonRotating);
  page.registerDatasource(woReservedMaterialRotating);
  app.registerDatasource(synonymData);

  await app.initialize();
  await controller.pageInitialized(page, app);

  jest.spyOn(controller, "getReservedRotatingAssetData").mockReturnValue(fakeData);
  const sendReservedItems = jest.spyOn(controller, "sendReservedItems");
  controller.setReservedItems();
  expect(page.state.sendSelectedAssets).toBe(true);

  jest.spyOn(controller, "updateReservedItems").mockImplementation((rotatingItem, selectedAssetRotating) => {
    const initialLength = page.state.items.length;
    const newAssets = selectedAssetRotating.slice(initialLength);
    newAssets.forEach((rotAsset) => {
      const rotItem = { ...rotatingItem[0] };
      rotItem.rotassetnum = rotAsset.assetnum;
      page.state.items.push(rotItem);
    });
    return newAssets;
  });

  jest.spyOn(controller, "filterRotatingAssets").mockReturnValue(fakeData);
  jest.spyOn(controller, "filterRotatingAssetsBasedOnTransactions").mockReturnValue(fakeData);
  jest.spyOn(reservedRotatingAssetDS, "getSelectedItems").mockImplementation(() => { });

  // Call selectionRotatingAssets
  await controller.selectionRotatingAssets();
  expect(sendReservedItems).toHaveBeenCalled();
  expect(page.state.loadingReserverMaterials).toBeFalsy();
  expect(page.state.disableReservedMaterialAction).toBeTruthy();

  // Verify the updateReservedItems functionality
  const rotatingItem = [{ itemnum: 'item1', description: 'desc1' }];
  const selectedAssetRotating = [{ assetnum: 'asset1' }, { assetnum: 'asset2' }];
  await controller.updateReservedItems(rotatingItem, selectedAssetRotating);

  // Additional check for sendSelectedAssets condition
  page.state.rotatingItemWithNoAsset = fakeData;
  page.state.sendSelectedAssets = true;

  await controller.selectionRotatingAssets();
  expect(sendReservedItems).toHaveBeenCalled();
});

it('should handle items in page state and update reserved items', async () => {
  const controller = new ReserveMaterialsPageController();
  const page = new Page({
    name: 'reserveMaterials',
    state: { items: undefined },
  });
  controller.page = page;
  const rotatingItem = [{ itemnum: 'item1', description: 'desc1' }];
  const selectedAssetRotating = [{ assetnum: 'asset1' }, { assetnum: 'asset2' }];

  // Ensure items are initialized before calling updateReservedItems
  if (!page.state.items) {
    page.state.items = [];
  }
  await controller.updateReservedItems(rotatingItem, selectedAssetRotating);

  expect(page.state.items).toEqual([
    { itemnum: 'item1', description: 'desc1', rotassetnum: 'asset1' },
    { itemnum: 'item1', description: 'desc1', rotassetnum: 'asset2' },
  ]);
});


describe('Get selected items', () => {
  const controller = new ReserveMaterialsPageController();
  const app = new Application();
  const page = new Page({
    name: 'reserveMaterials',
    state: { disableReservedMaterialAction: true },
  });

  const woReservedMaterialRotating = newDatasource(workorderitem, 'woReservedMaterialRotating');
  const woReservedMaterialNonRotating = newDatasource(workorderitem, 'woReservedMaterialNonRotating');

  sinon.stub(woReservedMaterialNonRotating, 'initializeQbe');
  page.registerDatasource(woReservedMaterialNonRotating);
  page.registerDatasource(woReservedMaterialRotating);
  app.registerController(controller);
  app.registerPage(page);

  let rotatingItems;
  let nonRotatingItems;
  beforeEach(async () => {
    await app.initialize();
    controller.pageInitialized(page, app);

    rotatingItems = [{}, {}, {}, {}];
    nonRotatingItems = [{}, {}, {}];
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should get selectedReservedItems when both rotating and non-rotating have items', async () => {
    sinon.stub(woReservedMaterialRotating, 'getSelectedItems').returns(rotatingItems);
    sinon.stub(woReservedMaterialNonRotating, 'getSelectedItems').returns(nonRotatingItems);
    await controller.getSelectedItems();
    expect(controller.selectedReservedItems).toEqual(rotatingItems);
    expect(page.state.disableReservedMaterialAction).toBe(false);
  });

  it('should get selectedReservedItems when only rotating has items', async () => {
    sinon.stub(woReservedMaterialRotating, 'getSelectedItems').returns(rotatingItems);
    sinon.stub(woReservedMaterialNonRotating, 'getSelectedItems').returns([]);
    await controller.getSelectedItems();
    expect(controller.selectedReservedItems).toEqual(rotatingItems);
    expect(page.state.disableReservedMaterialAction).toBe(false);
  });

  it('should get selectedReservedItems when only non-rotating has items', async () => {
    sinon.stub(woReservedMaterialRotating, 'getSelectedItems').returns([]);
    sinon.stub(woReservedMaterialNonRotating, 'getSelectedItems').returns(nonRotatingItems);
    await controller.getSelectedItems();
    expect(controller.selectedReservedItems).toEqual(nonRotatingItems);
    expect(page.state.disableReservedMaterialAction).toBe(false);
  });

  it('should return true for disableReservedMaterialAction, when neither rotating nor non-rotating have items', async () => {
    sinon.stub(woReservedMaterialRotating, 'getSelectedItems').returns([]);
    sinon.stub(woReservedMaterialNonRotating, 'getSelectedItems').returns([]);
    await controller.getSelectedItems();
    expect(controller.selectedReservedItems).toEqual([]);
    expect(page.state.disableReservedMaterialAction).toBe(true);
  });
});

it('set selected items', async () => {
  const controller = new ReserveMaterialsPageController();
  const app = new Application();
  const page = new Page({
    name: 'reserveMaterials',
    state: {
      disableReservedMaterialAction: false,
      loadingReserverMaterials: true,
      items: [],
      rotatingItemWithNoAsset: []
    },
  });

  const woReservedMaterialNonRotating = newDatasource(
    workorderitem,
    'woReservedMaterialNonRotating'
  );
  const reservedActualMaterialDs = newDatasource(
    workorderitem,
    'reservedActualMaterialDs'
  );
  const defaultSetDs = newStatusDatasource(statusitem, 'defaultSetDs');
  const synonymData = newStatusDatasource(statusitem, 'synonymdomainData');
  const woReservedItem = newDatasource(reservedItemRotatingAsset, 'reservedItemRotatingAssetJsonDS');
  sinon.stub(woReservedMaterialNonRotating, 'clearState');
  sinon.stub(woReservedMaterialNonRotating, 'resetState');
  page.registerDatasource(woReservedMaterialNonRotating);
  page.registerDatasource(reservedActualMaterialDs);
  page.registerDatasource(defaultSetDs);

  page.registerDatasource(woReservedItem);
  app.registerDatasource(synonymData);

  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);

  const mockItems = [
    { isrotating: false, itemnum: 'item1', description: 'Item 1' },
    { isrotating: true, itemnum: 'item2', description: 'Item 2' }
  ];
  sinon.stub(woReservedMaterialNonRotating, 'load').resolves(mockItems);

  const items = await woReservedMaterialNonRotating.load();
  controller.selectedReservedItems = items;

  sinon
    .stub(SynonymUtil, 'getSynonymDomain')
    .returns({ value: 'ISSUE', maxvalue: 'ISSUE', description: 'ISSUE' });

  await controller.setReservedItems(items);
  expect(controller.selectedReservedItems).toEqual(items);

  // Ensure non-rotating items are added to the page state
  expect(page.state.items).toContainEqual(mockItems[0]);
  expect(page.state.rotatingItemWithNoAsset).toContainEqual(mockItems[1]);

  // Clear the selectedReservedItems and update state
  controller.selectedReservedItems = [];
  await controller.setReservedItems({ item: [] });
  expect(controller.selectedReservedItems).toEqual([]);
  expect(page.state.disableReservedMaterialAction).toBe(true);

  controller.selectedReservedItems = [];
  page.state.sendSelectedAssets = [];
  await controller.setReservedItems({ item: [] });
  expect(controller.selectedReservedItems).toEqual([]);
  expect(page.state.disableReservedMaterialAction).toBe(true);
  expect(page.state.loadingReserverMaterials).toBe(false);
});

describe('sendReservedItems', () => {
  const controller = new ReserveMaterialsPageController();
  const app = new Application();
  const page = new Page({
    name: 'reserveMaterials',
    state: {
      disableReservedMaterialAction: false,
      loadingReserverMaterials: true,
      items: {},
      rotatingItemWithNoAsset: {},
      dataFailed: false
    },
  });
  app.registerPage(page);
  app.registerController(controller);

  const woReservedMaterialNonRotating = newDatasource(workorderitem, 'woReservedMaterialNonRotating');
  const reservedActualMaterialDs = newDatasource(workorderitem, 'reservedActualMaterialDs');
  const defaultSetDs = newStatusDatasource(statusitem, 'defaultSetDs');
  const SynonymUtil = newStatusDatasource(statusitem, 'synonymdomainData');
  const woReservedItem = newDatasource(reservedItemRotatingAsset, 'reservedItemRotatingAssetJsonDS');
  const woReservedMaterialRotating = newDatasource(workorderitem, 'woReservedMaterialRotating');

  page.registerDatasource(woReservedMaterialNonRotating);
  page.registerDatasource(woReservedMaterialRotating);
  page.registerDatasource(reservedActualMaterialDs);
  page.registerDatasource(defaultSetDs);
  page.registerDatasource(woReservedItem);
  app.registerDatasource(SynonymUtil);
  app.registerController(controller);
  app.registerPage(page);

  beforeEach(async () => {
    await app.initialize();
    controller.pageInitialized(page, app);

    SynonymUtil.getSynonymDomain = jest.fn().mockResolvedValue({ maxvalue: 'ISSUE' });
    sinon.stub(controller, 'updateLocalDS');
    sinon.stub(reservedActualMaterialDs, 'bulkAdd').callsFake((payload, options, callback) => {
      callback(null, {});
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should prepare the payload and send reserved items to the server', async () => {
    page.state.items = [
      { isrotating: true, reservedqty: 1, itemnum: 'item1', location: 'loc1', binnum: 'bin1', oplocation: 'oploc1', requestnum: 'req1', description: 'desc1', locationsdesc: 'locdesc1', invreserveid: 'inv1', storelocsiteid: 'site1', rotassetnum: 'asset1' }
    ];
    page.state.dataFailed = false;
    await controller.sendReservedItems();
    sinon.assert.calledOnce(reservedActualMaterialDs.bulkAdd);

    expect(controller.saveDataSuccessful).toBe(true);
    expect(page.state.loadingReserverMaterials).toBe(false);
    expect(page.state.disableReservedMaterialAction).toBe(true);

    controller.onSaveDataFailed();
    expect(controller.saveDataSuccessful).toBe(false);
  });

  it('should handle the dataFailed state correctly', async () => {
    page.state.items = [
      { isrotating: true, reservedqty: 1, itemnum: 'item1', location: 'loc1', binnum: 'bin1', oplocation: 'oploc1', requestnum: 'req1', description: 'desc1', locationsdesc: 'locdesc1', invreserveid: 'inv1', storelocsiteid: 'site1', rotassetnum: 'asset1' }
    ];
    sinon.stub(woReservedMaterialRotating.items, 'find').callsFake((callback) => {
      return [
        { requestnum: 'req1', reservedqty: 1, actualqty: 1 },
      ].find(callback);
    });

    page.state.dataFailed = true;
    controller.onSaveDataFailed();
    await controller.sendReservedItems();

    // Verify that bulkAdd are not called
    sinon.assert.notCalled(reservedActualMaterialDs.bulkAdd);
    expect(controller.saveDataSuccessful).toBe(false);
  });

  it('should handle emptyActualqty case correctly', async () => {
    page.state.items = [
      { isrotating: true, reservedqty: 1, itemnum: 'item1', location: 'loc1', binnum: 'bin1', oplocation: 'oploc1', requestnum: 'req1', description: 'desc1', locationsdesc: 'locdesc1', invreserveid: 'inv1', storelocsiteid: 'site1', rotassetnum: 'asset1' }
    ];
    sinon.stub(woReservedMaterialRotating.items, 'find').callsFake((callback) => {
      return [
        { requestnum: 'req1', reservedqty: 1, actualqty: 1 },
      ].find(callback);
    });

    page.state.dataFailed = true;
    controller.emptyActualqty = true;

    await controller.sendReservedItems();

    expect(controller.emptyActualqty).toBe(true);
    sinon.assert.notCalled(reservedActualMaterialDs.bulkAdd);
  });
});

it("Should handleDeleteTransaction", async () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();
  const controller = new ReserveMaterialsPageController();
  const app = new Application();
  const page = new Page({ name: "reserveMaterials" });

  await app.initialize();

  app.setCurrentPage = mockSetPage;
  app.currentPage = page;
  controller.pageInitialized(page, app);
  const woReservedMaterialRotating = {
    name: 'woReservedMaterialRotating',
    items: [
      { requestnum: '12345', reservedqty: 1, actualqty: 1 }
    ]
  };

  sinon.stub(controller.page, 'findDatasource').callsFake((name) => {
    if (name === 'woReservedMaterialRotating') {
      return woReservedMaterialRotating;
    }
    return null;
  });

  app.registerDatasource(woReservedMaterialRotating);

  let txn = {
    app: "Application",
    href: "testhref",
  };
  page.state.items = [{ requestnum: "12345" }];

  await controller.handleDeleteTransaction(txn);
  await controller.handleDeleteTransaction();

  // Verify changes made to datasources and state
  expect(controller.errorSelectionSaved).toBe(true);
  expect(controller.hasFailedReservation).toBe(false);
});

it('should update local datasources', async () => {
  const controller = new ReserveMaterialsPageController();
  const app = new Application();
  const page = new Page({
    name: 'reserveMaterials',
    state: { dataFailed: true, itemwithZeroQty: true }
  });
  const woReservedMaterialRotating = {
    items: [
      { requestnum: '1295', reservedqty: 2, actualqty: 3 },
      { requestnum: '1296', reservedqty: 5, actualqty: 2 },
      { requestnum: '1297', reservedqty: 3, actualqty: 3 }
    ],
  };
  const woReservedMaterialds = {
    items: [
      { requestnum: '1295', reservedqty: 2, actualqty: 3 },
      { requestnum: '1296', reservedqty: 5, actualqty: 2 },
      { requestnum: '1297', reservedqty: 3, actualqty: 3 }
    ],
    forceReload: jest.fn(),
    initializeQbe: jest.fn(),
    searchQBE: jest.fn().mockResolvedValue([]),
    load: jest.fn().mockResolvedValue([]),
    clearSelections: jest.fn()
  };
  const selectedResItems = [{}, {}, {}]; // Simulated fake selected reserved items
  app.registerController(controller);
  app.registerPage(page);
  app.findDatasource = jest.fn().mockImplementation((name) => {
    if (name === 'woReservedMaterialds') {
      return woReservedMaterialds;
    }
    if (name === 'woReservedMaterialRotating') {
      return woReservedMaterialRotating;
    }
  });

  await app.initialize();
  controller.pageInitialized(page, app);

  expect(woReservedMaterialRotating.items).toBeDefined();

  // When hasFailedReservation is true
  const itemToUpdate = { requestnum: '1295', actualqty: 6 };
  controller.updateLocalDS(woReservedMaterialRotating, itemToUpdate, selectedResItems);
  const updatedIndex = woReservedMaterialRotating.items.findIndex(item => item.requestnum === itemToUpdate.requestnum);
  expect(updatedIndex).toEqual(0);
  const updatedItem = woReservedMaterialRotating.items[updatedIndex];
  expect(updatedItem.reservedqty).toEqual(woReservedMaterialRotating.items[updatedIndex].reservedqty);
  expect(page.state.dataFailed).toEqual(true);

  const itemToUpdate_failed = { requestnum: '1296', actualqty: 5 };
  controller.updateLocalDS(woReservedMaterialRotating, itemToUpdate_failed, selectedResItems);
  const updatedIndex_failedIndex = woReservedMaterialRotating.items.findIndex(item => item.requestnum === itemToUpdate_failed.requestnum);
  expect(updatedIndex_failedIndex).toEqual(1);
  controller.hasFailedReservation = true;
  const failedItem = woReservedMaterialRotating.items[updatedIndex_failedIndex];
  expect(failedItem.actualqty).toEqual(woReservedMaterialRotating.items[updatedIndex_failedIndex].actualqty);
  expect(failedItem.reservedqty).toEqual(woReservedMaterialRotating.items[updatedIndex_failedIndex].reservedqty);
  expect(controller.hasFailedReservation).toBe(true);
  controller.hasFailedReservation = false;

  // When hasFailedReservation is false and successful data save with updated reserved quantity
  const itemToUpdate2 = { requestnum: '1296', actualqty: 5 };
  controller.updateLocalDS(woReservedMaterialRotating, itemToUpdate2, selectedResItems);
  const updatedIndex2 = woReservedMaterialRotating.items.findIndex(item => item.requestnum === itemToUpdate2.requestnum);
  expect(updatedIndex2).toEqual(1);
  const updatedItem2 = woReservedMaterialRotating.items[updatedIndex2];
  expect(updatedItem2.reservedqty).toEqual(woReservedMaterialRotating.items[updatedIndex2].reservedqty);
  expect(woReservedMaterialds.items[updatedIndex2].reservedqty).toEqual(updatedItem2.reservedqty);
  expect(woReservedMaterialds.items[updatedIndex2].actualqty).toEqual(updatedItem2.actualqty);
  expect(controller.saveDataSuccessful).toBe(true);

  //Check for reserved quantity for 0
  const itemToUpdate3 = { requestnum: '1297', actualqty: 3 };
  controller.updateLocalDS(woReservedMaterialRotating, itemToUpdate3, selectedResItems);
  const updatedIndex3 = woReservedMaterialRotating.items.findIndex(item => item.requestnum === itemToUpdate3.requestnum);
  const updatedItem3 = woReservedMaterialRotating.items[updatedIndex3];
  expect(updatedItem3.reservedqty).toEqual(0);
  expect(page.state.itemwithZeroQty).toBe(true);
  expect(woReservedMaterialds.items[updatedIndex3].reservedqty).toEqual(updatedItem3.reservedqty);
  expect(woReservedMaterialds.items[updatedIndex3].actualqty).toEqual(updatedItem3.actualqty);
});

it('should handle when no items are selected & check negative values for non-rotating items', async () => {
  const controller = new ReserveMaterialsPageController();
  const app = new Application();
  const page = new Page({
    name: 'reserveMaterials',
    state: { disableReservedMaterialAction: true },
  });

  await app.initialize();
  controller.pageInitialized(page, app);
  const woReservedMaterialRotating = newDatasource(workorderitem, 'woReservedMaterialRotating');
  const woReservedMaterialNonRotating = newDatasource(workorderitem, 'woReservedMaterialNonRotating');

  sinon.stub(woReservedMaterialNonRotating, 'initializeQbe');
  page.registerDatasource(woReservedMaterialNonRotating);
  app.registerController(controller);
  app.registerPage(page);

  sinon.stub(woReservedMaterialRotating, 'getSelectedItems').returns([]);
  sinon.stub(woReservedMaterialNonRotating, 'getSelectedItems').returns([]);
  await controller.getSelectedItems();
  expect(page.state.disableReservedMaterialAction).toBe(true);

  let isInvalid = {isInvalid : true};
  let isInvalid2 = {isInvalid : false};

  woReservedMaterialNonRotating.item.reservedqty = -3;
  controller.validateNonRotatingItem({isInvalid});
  expect(page.state.hasErrors).toBe(true);

  woReservedMaterialNonRotating.item.reservedqty = 3;
  controller.validateNonRotatingItem(isInvalid2);
  expect(page.state.hasErrors).toBe(false);
});

it('should handle page exit correctly', async () => {
  const controller = new ReserveMaterialsPageController();
  const app = new Application();
  const page = new Page({
    name: 'reserveMaterials',
    state: { disableReservedMaterialAction: true }
  });
  app.registerController(controller);
  app.registerPage(page);
  controller.page = page;
  controller.app = app;


  const mockGetReservedRotatingAssetData = jest.spyOn(controller, 'getReservedRotatingAssetData');
  const mockShowDialog = jest.spyOn(page, 'showDialog');
  const mockNavigateBack = jest.spyOn(app, 'navigateBack');
  const mockGetLocalizedLabel = jest.spyOn(app, 'getLocalizedLabel').mockReturnValue('Test message');

  // Test with unsaved changes
  mockGetReservedRotatingAssetData.mockReturnValue([{ itemnum: 'item1', reservedqty: 5 }]);
  controller.handlePageExit();
  expect(mockShowDialog).toHaveBeenCalledWith('saveDiscardDialog_reservePage');
  expect(mockGetLocalizedLabel).toHaveBeenCalledWith('messages_save_changes', 'To leave this page, you must first discard or save your changes.');

  // Test when no unsaved changes
  page.state.disableReservedMaterialAction = true; // Set to false to test navigation
  mockGetReservedRotatingAssetData.mockReturnValue([]);
  controller.handlePageExit();
  expect(mockNavigateBack).toHaveBeenCalled();
});

it('should sync and filter assets correctly for mobile', async () => {
  const fakeData = [
    { isrotating: true, reservedqty: 11, itemnum: 'item1', location: 'loc1', binnum: 'bin1', oplocation: 'oploc1', requestnum: 'req1', description: 'desc1', locationsdesc: 'locdesc1', invreserveid: 'inv1', storelocsiteid: 'site1', rotassetnum: 'asset1' }
  ];

  const controller = new ReserveMaterialsPageController();
  const app = new Application();
  const page = new Page({
    name: 'reserveMaterials',
    state: {
      rotatingItemWithNoAsset: fakeData,
      items: fakeData,
      sendSelectedAssets: true,
      disableReservedMaterialAction: true,
      loadingReserverMaterials: true
    }
  });

  const reservedRotatingAssetDS = newDatasource(reservedItemRotatingAsset, 'reservedRotatingAssetDS');
  const reservedRotatingAssetJsonDS = newDatasource(reservedItemRotatingAsset, 'reservedRotatingAssetJsonDS');
  const woReservedMaterialds = newDatasource(workorderitem, 'woReservedMaterialds');
  const woMaterialResource = newDatasource(workorderitem, 'woMaterialResource');
  const reservedActualMaterialDs = newDatasource(workorderitem, 'reservedActualMaterialDs');
  const synonymData = newStatusDatasource(statusitem, 'synonymdomainData');

  app.registerController(controller);
  app.registerPage(page);
  app.registerDatasource(reservedRotatingAssetDS);
  app.registerDatasource(reservedRotatingAssetJsonDS);
  app.registerDatasource(woReservedMaterialds);
  app.registerDatasource(woMaterialResource);
  app.registerDatasource(reservedActualMaterialDs);
  app.registerDatasource(synonymData);

  await app.initialize();
  await controller.pageInitialized(page, app);

  // Mock Device.get().isMaximoMobile to return true
  Device.get = jest.fn().mockReturnValue({ isMaximoMobile: true });

  jest.spyOn(reservedActualMaterialDs, 'items', 'get').mockReturnValue([{ itemnum: 'item1', rotassetnum: 'asset1' }]);
  jest.spyOn(controller, "getReservedRotatingAssetData").mockReturnValue(fakeData);

  const sendReservedItems = jest.spyOn(controller, "sendReservedItems");
  controller.setReservedItems();

  expect(page.state.sendSelectedAssets).toBe(true);
  jest.spyOn(controller, "updateReservedItems").mockImplementation(() => { });
  jest.spyOn(controller, "filterRotatingAssets").mockReturnValue(fakeData);
  jest.spyOn(controller, "filterRotatingAssetsBasedOnTransactions").mockReturnValue(fakeData);
  jest.spyOn(reservedRotatingAssetDS, "getSelectedItems").mockImplementation(() => { });


  await controller.selectionRotatingAssets();
  expect(sendReservedItems).toHaveBeenCalled();
  expect(page.state.loadingReserverMaterials).toBeFalsy();
  expect(page.state.disableReservedMaterialAction).toBeTruthy();

  page.state.sendSelectedAssets = true;
  const rotatingItem = [...fakeData];
  rotatingItem.shift();
  jest.spyOn(controller, 'getReservedRotatingAssetData').mockReturnValue(rotatingItem);

  await controller.selectionRotatingAssets();
  expect(rotatingItem.length).toBe(0);
});

it('should filter rotating assets based on valid asset numbers', () => {
  const controller = new ReserveMaterialsPageController();
  const rotatingAssetData = [{ assetnum: 'asset1' }, { assetnum: 'asset2' }];
  const validAssetNums = ['asset1'];

  const filteredAssets = controller.filterRotatingAssets(rotatingAssetData, validAssetNums);

  expect(filteredAssets).toEqual([{ assetnum: 'asset1' }]);
});

it('should filter rotating assets based on transactions', () => {
  const controller = new ReserveMaterialsPageController();
  const rotatingAssetData = [{ itemnum: 'item1', assetnum: 'asset1' }, { itemnum: 'item2', assetnum: 'asset2' }];
  const reservedActualMaterialItems = [{ itemnum: 'item1', rotassetnum: 'asset1' }];

  const filteredAssets = controller.filterRotatingAssetsBasedOnTransactions(rotatingAssetData, reservedActualMaterialItems);

  expect(filteredAssets).toEqual([{ itemnum: 'item2', assetnum: 'asset2' }]);
});

it('should reset the datasource by clearing and resetting its state', () => {
  const controller = new ReserveMaterialsPageController();
  const mockDatasource = {
    clearState: jest.fn(),
    resetState: jest.fn(),
  };

  controller._resetDataSource(mockDatasource);

  expect(mockDatasource.clearState).toHaveBeenCalled();
  expect(mockDatasource.resetState).toHaveBeenCalled();
});