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
import AssetDialogMapController from './AssetDialogMapController';

import newTestStub from './test/AppTestStub';

import {Application} from "@maximo/maximo-js-api";

import { JSDOM } from "jsdom"
const dom = new JSDOM()
global.document = dom.window.document;

const div = document.createElement('div');
div.classList.add('mx--dialog-content');
global.document.body.appendChild(div);

const getInitialMapState = () => {
  return {
    isClusterSelected: false,
    pinSelected: null,
    selectedItem: null,
    selectedDS: null,
    isLoading: false,
    selectedDSAttribute: null
  }
};

// Assisted by watsonx Code Assistant 

it('should reset states and datasource on dialog close', () => {
  const controller = new AssetDialogMapController();
  const app = new Application();
  controller.app = app;
  app.state.map = getInitialMapState();
  const assetFilterJSONDS = {
    reset: jest.fn(),
    options: {
      query: {}
    }
  };
  app.findDatasource = () => assetFilterJSONDS;
  controller.resetStates = jest.fn();
  controller.onCloseAssetDialog();
  
  expect(controller.resetStates).toHaveBeenCalled();
  expect(assetFilterJSONDS.reset).toHaveBeenCalled();
});

it('should redirect to functions from base class', () => {

  const controller = new AssetDialogMapController();

  controller.handleItemMapClick = jest.fn();
  controller.handleAssetMapClick();
  expect(controller.handleItemMapClick).toHaveBeenCalled();

  controller.handleMapMove = jest.fn();
  controller.handleAssetMapMove();
  expect(controller.handleMapMove).toHaveBeenCalled();

});

describe('onAssetMapCreate', () => {

  let controller, app;

  beforeEach(() => {
    controller = new AssetDialogMapController();
    app = new Application();
    controller.app = app;
    app.state.map = getInitialMapState();
  });

  it('should set app state to loading', async () => {

    app.registerController(controller);
    await app.initialize();

      
    const map = {};
    controller.onAssetMapCreate(map);
    expect(app.state.map.isLoading).toBe(true);
  });

});

// Assisted by watsonx Code Assistant 
describe('selectAssetFromMap', () => {
    let app;
    beforeEach(async() => {

        let initapp = newTestStub({
            currentPage: 'createwo',
            datasources: {
              assetLookupDS: {
                    name: 'assetLookupDS',
                    data: [{
                        assetuid: 'uid1',
                        assetnum: '1',
                        siteid: 'BEDFORD'
                      }],
                },
                dsCreateWo: {
                    name: 'dsCreateWo',
                    data: [
                        {
                            assetuid : '',
                            assetnum: '',
                            parent: ''
                        }
                    ]
                },
                synonymdomainData: {
                  name: 'synonymdomainData',
                  data: [
                    {
                      domainid: 'WOSTATUS',
                      maxvalue: 'WAPPR',
                      value: 'WAPPR',
                      siteid: 'BEDFORD',
                      orgid: 'EAGLENA',
                      defaults: true,
                    }
                  ]
                }
            },
        });
        
        app = await initapp();

        app.client.userInfo = {
            insertSite: 'BEDFORD',
            defaultOrg: 'EAGLENA',
            defaultSite: 'BEDFORD'
        }

    });

    it('Take the "selectedItem" and set the asset on selected Datasource and close the dialog when the page is "createwo"', async () => {
      //Need to wait for pageLoading state property be false to begin test.  This is because on createWo page resume it will clear the createwo datasource and will fail tests
      await new Promise(resolve => {
        const interval = setInterval(() => {
          if (app.state.pageLoading === false) {
            clearInterval(interval);
            resolve();
          }
        }, 10);
      });

      app.state.map.selectedItem = {
          assetuid: 'uid1',
          assetnum: '1',
          siteid: 'BEDFORD'
        }
        
        let assetMapDialog = app.currentPage.findDialog('assetMapDialog');
        app.state.map.selectedDS = 'dsCreateWo';
        app.state.map.selectedDSAttribute = 'assetnum';
        let controller = assetMapDialog.controllers[0];
        controller.dialogInitialized(assetMapDialog);
        controller.dialog.closeDialog = jest.fn();
        //Forcing data the be populated in DS
        await controller.app.findDatasource("assetLookupDS").load();
        await controller.selectAssetFromMap(app.state.map.selectedDS);

        let datasource = controller.app.findDatasource(app.state.map.selectedDS);
        expect(app.currentPage).not.toBeNull();
        expect(app.currentPage.name).toBe("createwo");
        expect(datasource.item[app.state.map.selectedDSAttribute]).toBe(app.state.map.selectedItem.assetnum);
        expect(controller.dialog.closeDialog).toHaveBeenCalled();
      });

});

describe('createAssetSymbology and retrieveAssetLegends', () => {

  let controller;
  beforeEach(() => {
    controller = new AssetDialogMapController();
    const app = new Application();
    controller.app = app;
    app.state.map = getInitialMapState();

    controller.onAssetMapCreate({});
    controller.mapUtils.createSymbology = jest.fn();
    controller.mapUtils.retrieveLegends = jest.fn();
  });

  it('should call mapUtils symbology function', () => {
    controller.createAssetSymbology({});
    expect(controller.mapUtils.createSymbology).toHaveBeenCalled();
  });

  it('should call mapUtils retrieveLegends function', () => {
    controller.retrieveAssetLegends();
    expect(controller.mapUtils.retrieveLegends).toHaveBeenCalled();
  });

});

// Assisted by watsonx Code Assistant 
describe('loading function', () => {

  let controller, app, isLoading, datasource;

  beforeEach(() => {
    controller = new AssetDialogMapController();
    app = new Application();
    controller.app = app;
    app.state.map = getInitialMapState();
    controller.populateListByExtent = jest.fn();
    isLoading = false;
    datasource = { name: 'maxlib_asset_map_layer_datasource' };
    app.state.map.isLoading =  true;
  });

  it('should set app state map isLoading to false and call populateListByExtent', () => {
    // arrange
    app.currentPage = {
        name: ''
    };

    const mockedsCreateWo = {
      name: `dsCreateWo`,
      item: {
        assetnum: 'assetVal',
        siteid: 'siteidVal'
      }
    };

    const mockedLocationMapDS = { 
      name: 'maxlib_asset_map_layer_datasource',
      item: {
        assetnum: 'assetVal',
        siteid: 'siteidVal'
      },
      items: []
    
    }
    app.findDatasource = (dsName) => {
      if (dsName === 'dsCreateWo') return mockedsCreateWo;
      if (dsName === 'maxlib_asset_map_layer_datasource') return mockedLocationMapDS;

    };

    controller.mapUtils = {}
    app.state.map.selectedDS = 'dsCreateWo';
    controller.loading(isLoading, datasource);
    // assert
    expect(app.state.map.isLoading).toBe(false);
    expect(controller.populateListByExtent).toHaveBeenCalled();
  });

  it('should set app state map selectedItem to assetRecord, blockOnMapMove to true', () => {
    // arrange
    app.currentPage = {
      name: 'createwo'
    };

    const mockedsCreateWo = {
      name: `dsCreateWo`,
      item: {
        assetnum: 'assetVal',
        siteid: 'siteidVal'
      }
    };

    const assetRecord = {
      assetnum: 'assetVal',
      siteid: 'siteidVal'
    };

    const mockedLocationMapDS = { 
      name: 'maxlib_asset_map_layer_datasource',
      item: {
        assetnum: 'assetVal',
        siteid: 'siteidVal'
      },
      items: [assetRecord]
    
    }
    app.findDatasource = (dsName) => {
      if (dsName === 'dsCreateWo') return mockedsCreateWo;
      if (dsName === 'maxlib_asset_map_layer_datasource') return mockedLocationMapDS;
    };
    
    controller.mapUtils = {
      getCoordinatesFromItem: jest.fn(() => [0, 0]),
      centerMap: jest.fn()
    }
    app.state.map.selectedDS = 'dsCreateWo';
    app.state.map.selectedDSAttribute = "assetnum";
    // act
    controller.loading(isLoading, datasource);
    // assert
    expect(app.state.map.selectedItem).toStrictEqual(assetRecord);
    expect(controller.blockOnMapMove).toBe(true);
    expect(controller.mapUtils.centerMap).toHaveBeenCalledWith(0, 0);
  });

  it('should use assetnum for edit page', () => {
    // arrange
    app.currentPage = {
      name: 'woedit'
    };

    const mockedsEditWo = {
      name: `dsWoedit`,
      item: {
        assetnum: 'assetVal',
        siteid: 'siteidVal'
      }
    };

    const assetRecord = {
      assetnum: 'assetVal',
      siteid: 'siteidVal'
    };

    const mockedLocationMapDS = { 
      name: 'maxlib_asset_map_layer_datasource',
      item: {
        assetnum: 'assetVal',
        siteid: 'siteidVal'
      },
      items: [assetRecord]
    
    }
    app.findDatasource = (dsName) => {
      if (dsName === 'dsWoedit') return mockedsEditWo;
      if (dsName === 'maxlib_asset_map_layer_datasource') return mockedLocationMapDS;
    };
    
    controller.mapUtils = {
      getCoordinatesFromItem: jest.fn(() => [0, 0]),
      centerMap: jest.fn()
    }

    app.state.map.selectedDS = 'dsWoedit';
    app.state.map.selectedDSAttribute = 'assetnum';
    // act
    controller.loading(isLoading, datasource);
    // assert
    expect(app.state.map.selectedItem).toStrictEqual(assetRecord);
    expect(controller.blockOnMapMove).toBe(true);
    expect(controller.mapUtils.centerMap).toHaveBeenCalledWith(0, 0);
  });

});

describe('onDatasourceSelectionChanged function', () => {

  let controller, app;

  beforeEach(() => {
    controller = new AssetDialogMapController();
    app = new Application();
    controller.app = app;
    app.state.map = getInitialMapState();
    controller.onAssetMapCreate({});
    controller.mapUtils.highlightItem = jest.fn();
    controller.mapUtils.getMaximoAttributesFromFeature = jest.fn((x) => x);
    
  });

  it('should highlight the map feature corresponding to selected item', () => {

    const assetRecord = {
      assetid: 'LOC1'
    };

    controller.mapUtils.getFeaturesFromCurrentExtent = jest.fn(() => [assetRecord]);

    const mockedLocationMapDS = { 
      name: 'MapFilterJSON',
      item: assetRecord,
      items: [assetRecord]    
    }

    const uniquePinMock = {
      get: () => [assetRecord]
    };
    const getLayerByNameMock = jest.fn((name) => ({
      getSource: () => ({
        getFeatures: () => [uniquePinMock]
      })
    }));
    controller.mapUtils.getMapInstance = jest.fn(() => ({
      maximoMap: {
        getLayerByName: getLayerByNameMock
      }
    }));

    controller.onDatasourceSelectionChanged({datasource: mockedLocationMapDS, item: mockedLocationMapDS.item, selected: true});

    expect(app.state.map.selectedItem).toStrictEqual(assetRecord);
    expect(controller.mapUtils.highlightItem).toHaveBeenCalled();
  });

});

describe('handleMapMove', () => {
  let mapUtilsMock;
  let mapInstanceMock;
  let app;
  let controller;


  beforeEach(() => {
    mapInstanceMock = {
      clearFeatureStyle: jest.fn()
    }

    mapInstanceMock.clearFeatureStyle.mockImplementation(() => {
      return;
    });

    mapUtilsMock = {
      getMapInstance: jest.fn()
    };

    mapUtilsMock.getMapInstance.mockImplementation(() => {
      return mapInstanceMock;
    });

    app = new Application();
    app.state.map = getInitialMapState();
    app.log = {};
    app.log.e = jest.fn();

    controller = new AssetDialogMapController();
    controller.app = app;
    controller.onAssetMapCreate({});
    controller._getMapUtils = jest.fn();
    controller._getMapUtils.mockImplementation(() => {
      return mapUtilsMock;
    });
    controller.populateListByExtent = jest.fn();
  });

  it('should clear feature style and reset selectedItem when blockOnMapMove is false', () => {
    controller.handleMapMove({ extent: {  } });
    expect(controller._getMapUtils).toHaveBeenCalled();
    expect(controller._getMapUtils().getMapInstance).toHaveBeenCalled();
    expect(controller._getMapUtils().getMapInstance().clearFeatureStyle).toHaveBeenCalled();
    expect(app.state.map.selectedItem).toBeNull();
  });

  it('should not perform any action when blockOnMapMove is true', () => {
    controller.blockOnMapMove = true;
    controller.handleMapMove({ extent: {  } });

    expect(controller._getMapUtils().getMapInstance).not.toHaveBeenCalled();
    expect(app.state.map.selectedItem).toBeNull();
  });

  it('should log an error and not perform any action when mapInfo or extent is not provided', () => {
    controller.handleMapMove(null);

    expect(app.log.e).toHaveBeenCalledWith('BaseDialogMapController', 'No map info or extent to handle map move action.');
  });
});