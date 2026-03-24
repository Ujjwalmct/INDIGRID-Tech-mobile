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

import MultiAssetLocCiController from './MultiAssetLocCiController';
import multiassetlocitem from "./test/wo-detail-multiassetloc-data.js";
import { Application, Page, Datasource, JSONDataAdapter, Device } from '@maximo/maximo-js-api';
import sinon from 'sinon';
import { expect } from '@storybook/test';


function newDatasource(name = 'multiAssetLocDS', data = []) {
  const da = new JSONDataAdapter({
    src: data,
    items: 'member',
    schema: 'responseInfo.schema'
  });
  const ds = new Datasource(da, { name: name });
  return ds;
}
function newDatasourceMultiAssetLoc(
  data = multiassetlocitem,
  name = "woMultiAssetLocationds"
) {
  const da = new JSONDataAdapter({
    src: data,
    items: "member",
    schema: "responseInfo.schema",
  });

  const ds = new Datasource(da, {
    idAttribute: "multiid",
    name: name,
  });

  return ds;
}

afterEach(() => {
  sinon.restore();
  jest.restoreAllMocks();
});

describe('MultiAssetLocCiController', () => {
  let controller;
  let app;
  let page;

  beforeEach(() => {
    controller = new MultiAssetLocCiController();
    app = new Application();
    page = new Page({ name: 'multiAssetLocPage' });

    app.state.appnames = {
      inspection: "inspection",
      assetmobile: "assetmobile"
    };
  
    controller.pageInitialized(page, app);

    page.state.multiAssetData = 'multiAssetLocDS';
    jest.spyOn(Device, 'get').mockReturnValue({
      isMaximoMobile: true
    });
  });
  it('should initialize page and app correctly', () => {
    expect(controller.page).toBe(page);
    expect(controller.app).toBe(app);
    expect(page.state.mapMultiAssetListHeight).toBeDefined();
  });
  it('should set appropriate state for Tablet/Ipad and MaximoMobile in pageInitialized', () => {
    jest.spyOn(Device, 'get').mockReturnValue({
      isTablet: true,
      isIpad: false,
      isMaximoMobile: true,
    });

    const page = {
      state: {},
    };
    const app = {};

    controller.pageInitialized(page, app);

    // Assert state updates for Tablet/Ipad
    expect(page.state.mapPaddingRight).toBe("1rem");
    expect(page.state.mapPaddingLeft).toBe("0.5rem");
    expect(page.state.mapMultiAssetListHeight).toBe("25%");

    // Assert state updates for MaximoMobile (overrides Tablet/Ipad)
    expect(page.state.mapPaddingBottom).toBe("calc(100vh - 5rem)");
    expect(page.state.mapMultiAssetCardHeight).toBe("45%");
  });

  it('should process data after loading correctly when all conditions are met', () => {
    // Set up the page and app states
    page.state.selectedSwitch = 1;
    app.state.isMapValid = true;

    // Mock Device.get to return isMaximoMobile: true
    jest.spyOn(Device, 'get').mockReturnValue({ isMaximoMobile: true });
    const mockLoadOfflineData = sinon.stub(controller.mapPreloadAPI, 'loadOfflineData');

    // Scenario 1: items with asset array
    const itemsWithAsset = [{ id: 1, asset: [{ id: 100 }] }];
    controller.onAfterLoadData(null, itemsWithAsset);

    // Assertions
    expect(mockLoadOfflineData.calledOnce).toBe(true);
    expect(mockLoadOfflineData.calledWith(itemsWithAsset, 3, 16, "assetautolocate", "4326", app, false)).toBe(true);

    // Reset the stub for the next scenario
    mockLoadOfflineData.resetHistory();

    // Scenario 2: items with location
    const itemsWithLocation = [{ id: 1, location: "Location123" }];
    controller.onAfterLoadData(null, itemsWithLocation);

    // Assertions
    expect(mockLoadOfflineData.calledOnce).toBe(true);
    expect(mockLoadOfflineData.calledWith(itemsWithLocation, 3, 16, "locationautolocate", "4326", app, false)).toBe(true);
  });

  it('should call handleItemClick when map exists in openMap', () => {
    const mockHandleItemClick = jest.spyOn(controller, 'handleItemClick');
    const mockMap = {
      parseGeometry: sinon.stub().returns({}),
      getLayerSpatialReference: sinon.stub().returns('4326'),
      getGeometryCenter: sinon.stub().returns({ getCoordinates: () => [0, 0] }),
      convertCoordinates: sinon.stub().returns([0, 0]),
      getFeatureByGeo: sinon.stub().returns({ featuresAndLayers: [{}] }),
      getNewStyle: sinon.stub(),
      changeFeatureStyle: sinon.stub(),
      centerTo: sinon.stub(),
      clearFeatureStyle: sinon.stub(),
      getBasemapSpatialReference: sinon.stub()
    };
    app.map = mockMap;
    const event = {
      item: {
        assetautolocate: false,
        locationautolocate: true,
        locationstatus_maxvalue: 'NOT_READY',
        asset: [{ status_maxvalue: 'ACTIVE' }]
      }
    };

    controller.openMap(event);
    expect(mockHandleItemClick).toHaveBeenCalledWith(event.item);
  });

  it('should not call handleItemClick when map does not exist in openMap', () => {
    const mockHandleItemClick = jest.spyOn(controller, 'handleItemClick');
    const event = { item: { id: 1 } };

    app.map = null;
    controller.openMap(event);
    expect(mockHandleItemClick).not.toHaveBeenCalled();
  });

  it('should handle empty asset array gracefully in handleItemClick', () => {
    const mockMap = {
      parseGeometry: sinon.stub().returns({}),
      getLayerSpatialReference: sinon.stub().returns('4326'),
      getGeometryCenter: sinon.stub().returns({ getCoordinates: () => [0, 0] }),
      convertCoordinates: sinon.stub().returns([0, 0]),
      getFeatureByGeo: sinon.stub().returns({ featuresAndLayers: [] }),
      getNewStyle: sinon.stub(),
      changeFeatureStyle: sinon.stub(),
      centerTo: sinon.stub(),
      clearFeatureStyle: sinon.stub(),
      getBasemapSpatialReference: sinon.stub()
    };
    app.map = mockMap;
    const item = {
      assetautolocate: false,
      locationautolocate: true,
      locationstatus_maxvalue: 'NOT_READY',
      asset: []
    };

    controller.handleItemClick(item);
    expect(mockMap.changeFeatureStyle.called).toBe(false);
  });

  it('should apply correct styles based on currentStatus in handleItemClick', () => {
    const mockMap = {
      parseGeometry: sinon.stub().returns({}),
      getLayerSpatialReference: sinon.stub().returns('4326'),
      getGeometryCenter: sinon.stub().returns({ getCoordinates: () => [0, 0] }),
      convertCoordinates: sinon.stub().returns([0, 0]),
      getFeatureByGeo: sinon.stub().returns({ featuresAndLayers: [{}] }),
      getNewStyle: sinon.stub(),
      changeFeatureStyle: sinon.stub(),
      centerTo: sinon.stub(),
      clearFeatureStyle: sinon.stub(),
      getBasemapSpatialReference: sinon.stub()
    };
    app.map = mockMap;

    const statuses = ['NOT READY', 'OPERATING', 'ACTIVE', 'DECOMMISSIONED'];
    const items = statuses.map(status => ({
      assetautolocate: false,
      locationautolocate: true,
      locationstatus_maxvalue: status,
      asset: [{ status_maxvalue: status }],
    }));

    items.forEach(item => {
      controller.handleItemClick(item);
      expect(mockMap.getNewStyle.called).toBe(false);
    });
  });

  it('should call clearFeatureStyle when assetautolocate and locationautolocate are both false', () => {
    const mockMap = {
      clearFeatureStyle: sinon.stub(),
    };
    app.map = mockMap;

    const item = {
      assetautolocate: false,
      locationautolocate: false,
      asset: [{ status_maxvalue: 'ACTIVE' }],
    };

    controller.handleItemClick(item);

    // Assertions
    expect(mockMap.clearFeatureStyle.calledOnce).toBe(true);
  });

  it('should call parseGeometry and getLayerSpatialReference for Multiple Assets when assetautolocate is true', () => {
    const mockMap = {
      parseGeometry: sinon.stub().returns({}),
      getLayerSpatialReference: sinon.stub().returns('4326'),
      getBasemapSpatialReference: sinon.stub().returns('4326'),
      getGeometryCenter: sinon.stub().returns({ getCoordinates: () => [0, 0] }),
      convertCoordinates: sinon.stub().returns([0, 0]),
      getFeatureByGeo: sinon.stub().returns({ featuresAndLayers: [{}] }),
      changeFeatureStyle: sinon.stub(),
      centerTo: sinon.stub(),
      clearFeatureStyle: sinon.stub(),
      getNewStyle: sinon.stub(),
    };
    app.map = mockMap;

    const item = {
      assetautolocate: true,
      locationautolocate: false,
      asset: [{ status_maxvalue: 'ACTIVE' }],
    };

    controller.handleItemClick(item);

    // Assertions
    expect(mockMap.parseGeometry.calledWith(item.assetautolocate)).toBe(true);
    expect(mockMap.getLayerSpatialReference.calledWith('Multiple Assets')).toBe(true);
  });

  it('should handle various scenarios in openMultiAssetCard', async () => {
    const mockDatasource = newDatasource('multiAssetLocDS');
    mockDatasource.initializeQbe = sinon.stub().resolves();
    mockDatasource.setQBE = sinon.stub();
    mockDatasource.searchQBE = sinon.stub().resolves();

    page.datasources = { multiAssetLocDS: mockDatasource };
    page.state.multiAssetData = 'multiAssetLocDS';
    jest.spyOn(Device, 'get').mockReturnValue({ isMaximoMobile: true });

    // Mock woMultiAssetLocationds datasource
    const mockWoMultiAssetDS = newDatasource('woMultiAssetLocationds');
    mockWoMultiAssetDS.load = sinon.stub().resolves();
    app.findDatasource = sinon.stub().returns(mockWoMultiAssetDS);

    // 1. Scenario: event?.item is present
    const event = {
      item: {
        multiid: '123',
        assetautolocate: false,
        locationautolocate: true,
        locationstatus_maxvalue: 'READY',
        asset: [{ status_maxvalue: 'ACTIVE' }],
      },
      prevPage: 'testPage',
    };

    await controller.openMultiAssetCard(event);

    // Assert QBE is initialized and searchQBE is called
    expect(mockDatasource.initializeQbe.calledOnce).toBe(true);
    expect(mockDatasource.setQBE.calledWith('multiid', '=', '123')).toBe(true);
    expect(mockDatasource.searchQBE.calledOnce).toBe(true);

    // Assert page state is updated
    expect(page.state.showMapOverlay).toBe(1);
    expect(page.state.previousPage).toBe('testPage');

    // 2. Scenario: app.map is not defined, or loadMap is true
    const mockOpenMap1 = jest.spyOn(controller, 'openMap');
    jest.useFakeTimers();
    app.map = null; // Simulate no map object
    const event2 = {
      item: {
        multiid: '123',
        assetautolocate: false,
        locationautolocate: true,
        locationstatus_maxvalue: 'READY',
        asset: [{ status_maxvalue: 'ACTIVE' }], // Ensure asset is valid
      },
    };

    await controller.openMultiAssetCard(event2);
    jest.runAllTimers();
    expect(mockOpenMap1).toHaveBeenCalledWith(event2);
    jest.useRealTimers();

    // 3. Scenario: app.map is defined and loadMap is false
    const mockOpenMap2 = jest.spyOn(controller, 'openMap');
    const mockMap = {
      parseGeometry: sinon.stub().returns({}),
      getLayerSpatialReference: sinon.stub().returns('4326'),
      getGeometryCenter: sinon.stub().returns({ getCoordinates: () => [0, 0] }),
      convertCoordinates: sinon.stub().returns([0, 0]),
      getFeatureByGeo: sinon.stub().returns({ featuresAndLayers: [{}] }),
      getNewStyle: sinon.stub(),
      changeFeatureStyle: sinon.stub(),
      centerTo: sinon.stub(),
      clearFeatureStyle: sinon.stub(),
      getBasemapSpatialReference: sinon.stub()
    };
    app.map = mockMap;
    const event3 = {
      item: {
        multiid: '123',
        assetautolocate: false,
        locationautolocate: true,
        locationstatus_maxvalue: 'READY',
        asset: [{ status_maxvalue: 'ACTIVE' }],
      },
    };
    await controller.openMultiAssetCard(event3);

    // Assert openMap is called directly
    expect(mockOpenMap2).toHaveBeenCalledWith(event3);

    // 4. Scenario: cardOpenfromList is true, app.map is not defined, and Device is MaximoMobile
    page.state.cardOpenfromList = true;
    app.map = null;
    const event4 = {
      item: {
        multiid: '456',
        assetautolocate: true,
        locationautolocate: false,
        locationstatus_maxvalue: 'READY',
        asset: [{ status_maxvalue: 'ACTIVE' }],
      },
    };

    await controller.openMultiAssetCard(event4);

    // Assert woMultiAssetLocationds datasource is loaded
    expect(app.findDatasource.calledWith('woMultiAssetLocationds')).toBe(true);
    expect(mockWoMultiAssetDS.load.calledWith({ noCache: true })).toBe(true);

    // Assert QBE is initialized and searchQBE is called
    expect(mockDatasource.initializeQbe.called).toBe(true);
    expect(mockDatasource.setQBE.calledWith('multiid', '=', '456')).toBe(true);
    expect(mockDatasource.searchQBE.called).toBe(true);
  });

  it('should set showMapOverlay to 0 in showMultiAssetCardList', () => {
    const event = {};
    controller.showMultiAssetCardList(event);

    expect(page.state.showMapOverlay).toBe(0);
  });

  it('should set selectedSwitch to 1 and call openMultiAssetCard with the event', () => {
    const mockOpenMultiAssetCard = jest.spyOn(controller, 'openMultiAssetCard').mockImplementation(() => { });
    const event = { someProperty: 'testEvent' };

    controller.openMapPage(event);

    // Assertions
    expect(page.state.selectedSwitch).toBe(1);
    expect(mockOpenMultiAssetCard).toHaveBeenCalledWith(event);
  });

  it('should reset selectedSwitch to 0 in setDefaults', () => {
    controller.setDefaults();

    expect(page.state.selectedSwitch).toBe(0);
  });

  it('should set showMapOverlay to 0 in showMapList', () => {
    controller.showMapList();

    expect(page.state.showMapOverlay).toBe(0);
  });

  it('should call loadPageResumed in pageResumed', () => {
    const mockLoadPageResumed = jest.spyOn(controller, 'loadPageResumed').mockResolvedValue();

    controller.pageResumed(page, app);

    expect(mockLoadPageResumed).toHaveBeenCalledWith(page, app);
  });

  it('should load data for resumed page in loadPageResumed, fetching multiAssetData if not present', async () => {
    app.state.pageLoading = false;
    app.state.checkSigOption = jest.fn().mockReturnValue(true);

    const mockDatasource = {
      load: jest.fn(),
      reset: jest.fn(),
      name: 'multiAssetLocCiJsonDS',
    };
    page.findDatasource = jest.fn().mockReturnValue(mockDatasource);

    const mockMultiAssetDS = {
      dataAdapter: { totalCount: 2 },
      isItemLoaded: jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true),
      load: jest.fn(),
      get: jest.fn().mockReturnValueOnce({ id: 1 }).mockReturnValueOnce({ id: 2 }),
    };

    page.params = {
      ds: {
        childrenToLoad: [{ name: 'woMultiAssetLocationds', ...mockMultiAssetDS }],
      },
    };

    await controller.loadPageResumed(page, app);

    // Assertions 
    expect(app.state.pageLoading).toBe(false);
    expect(page.state.inspectionAccess).toBe(false);
    expect(page.state.multiAssetData).toBe('multiAssetLocCiJsonDS');
    page.params.ds.childrenToLoad = [];
    await controller.loadPageResumed(page, app);

    // Assertions
    expect(app.state.pageLoading).toBe(false);
    expect(page.state.inspectionAccess).toBe(false);
    expect(page.state.multiAssetData).toBe('multiAssetLocCiJsonDS');
  });


  it('should handle various datasource scenarios in resetDatasource', async () => {
    // 1. Scenario where datasource does not exist (!ds)
    page.datasources = {};
    page.state.multiAssetData = 'nonExistentDataSource';

    let result = await controller.resetDatasource();

    expect(result).toBeUndefined();

    // 3. Scenario where qbe exists and needs to be cleared
    const ds2 = newDatasource('multiAssetLocDS');
    ds2.state = { currentSearch: [], isFiltered: [], qbe: { someField: 'someValue' } };
    ds2.clearQBE = sinon.stub();
    ds2.searchQBE = sinon.stub().resolves();

    page.datasources = { multiAssetLocDS: ds2 };
    page.state.multiAssetData = 'multiAssetLocDS';

    result = await controller.resetDatasource();

    // Assert qbe is cleared and searchQBE is called
    expect(result).toBeUndefined();
    expect(ds2.clearQBE.calledOnce).toBe(true);
    expect(ds2.searchQBE.calledOnce).toBe(true);
  });

  it('should initialize map correctly', () => {
    const mockMap = {};
    const mockAsset = 'asset123';
    controller.page.state.mapHighlightedAsset = mockAsset;

    // Replace handleItemClick with a test version
    let itemClicked = null;
    controller.handleItemClick = (item) => {
      itemClicked = item;
    };

    controller.onMapInitialized(mockMap);

    expect(controller.app.map).toBe(mockMap);
    expect(itemClicked).toBe(mockAsset);
    expect(controller.page.state.mapHighlightedAsset).toBe('');
  });

  it('should navigate to asset detail page correctly', async () => {
    const item = { assetnum: 'A100', siteid: 'S1', asset: [{ href: '/assetDetails/A100' }] };
    const mockCallController = sinon.stub(app, 'callController');

    await controller.navigateMultiAssetToAssetDetails(item);
    expect(mockCallController.calledOnce).toBe(true);
  });

  it('should handle map click event and cluster features correctly', async () => {
    const item = {
      hasFeature: true,
      featuresAndLayers: [
        {
          feature: {
            get: sinon.stub().withArgs('features').returns([{
              get: sinon.stub().withArgs('maximoAttributes').returns({
                asset: [{ status_maxvalue: 'ACTIVE' }],
                assetautolocate: true,
                locationautolocate: false
              })
            }]),
            values_: {
              features: [{
                get: sinon.stub().withArgs('maximoAttributes').returns({
                  asset: [{ status_maxvalue: 'ACTIVE' }],
                  assetautolocate: true,
                  locationautolocate: false
                })
              }]
            }
          },
          layer: { get: sinon.stub().withArgs('isMarkerLayer').returns(false) }
        }
      ]
    };

    const mockMap = {
      getNewStyle: sinon.stub(),
      changeFeatureStyle: sinon.stub(),
      clearFeatureStyle: sinon.stub(),
      isFeatureHighlighed: sinon.stub(),
      getGeometryCenter: sinon.stub()
    };
    app.map = mockMap;

    const mockDatasource = newDatasource('multiAssetLocDS');
    mockDatasource.initializeQbe = sinon.stub().resolves();
    mockDatasource.setQBE = sinon.stub();
    mockDatasource.load = sinon.stub().resolves();
    page.datasources = { multiAssetLocDS: mockDatasource };
    page.state.multiAssetData = 'multiAssetLocDS';

    await controller.handleMapClick(item);

    expect(mockDatasource.setQBE.calledOnce).toBe(true);
    expect(mockDatasource.load.calledOnce).toBe(true);
    expect(mockMap.getGeometryCenter.calledOnce).toBe(false);
  });

  it('should open previous page correctly', async () => {
    const mockMap = {
      clearFeatureStyle: sinon.stub(),
    };
    app.map = mockMap;
    page.state.previousPage = 'mapmultiAssetlist';

    const mockResetDatasource = sinon.stub(controller, 'resetDatasource').resolves();

    await controller.openPrevPage();

    // Assertions
    expect(mockMap.clearFeatureStyle.calledOnce).toBe(true);
    expect(mockResetDatasource.calledOnce).toBe(true);
  });

  it("should update multi asset progress", async () => {
    let record = {
      assetItem: {
        progress: false,
        multiid: 4086,
        href: "http://childkey#V09SS09SREVSL01VTFRJQVNTRVRMT0NDSS80MDg2",
        isprimary: false
      },
    };

    const multiAssetDs = newDatasourceMultiAssetLoc(
      multiassetlocitem,
      "woMultiAssetLocationds"
    );
    await multiAssetDs.load();
    app.registerDatasource(multiAssetDs);
    app.registerController(controller);

    await app.initialize();
    controller.pageInitialized(page, app);

    await controller.updateMultiAssetProgress(record);
    expect(page.state.progress).toBe(true);

    record.assetItem.progress = true;
    await controller.updateMultiAssetProgress(record);
    expect(page.state.progress).toBe(false);

    record = {};
    await controller.updateMultiAssetProgress(record);
    expect(page.state.progress).toBe(false);
  });
});
