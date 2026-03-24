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
import LocationDialogMapController from './LocationDialogMapController';
import {Application} from '@maximo/maximo-js-api';

import newTestStub from './test/AppTestStub';

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
  const controller = new LocationDialogMapController();
  const app = new Application();
  controller.app = app;
  app.state.map = getInitialMapState();
  const locationFilterJSONDS = {
    reset: jest.fn(),
    options: {
      query: {}
    }
  };
  app.findDatasource = () => locationFilterJSONDS;
  controller.resetStates = jest.fn();
  controller.onCloseLocationDialog();
  
  expect(controller.resetStates).toHaveBeenCalled();
  expect(locationFilterJSONDS.reset).toHaveBeenCalled();
});

it('should redirect to functions from base class', () => {

  const controller = new LocationDialogMapController();

  controller.handleItemMapClick = jest.fn();
  controller.handleLocationMapClick();
  expect(controller.handleItemMapClick).toHaveBeenCalled();

  controller.handleMapMove = jest.fn();
  controller.handleLocationMapMove();
  expect(controller.handleMapMove).toHaveBeenCalled();

});

describe('onLocationMapCreate', () => {

  let controller, app;

  beforeEach(() => {
    controller = new LocationDialogMapController();
    app = new Application();
    controller.app = app;
    app.state.map = getInitialMapState();
  });

  it('should set app state to loading', async () => {

    app.registerController(controller);
    await app.initialize();

      
    const map = {};
    controller.onLocationMapCreate(map);
    expect(app.state.map.isLoading).toBe(true);
  });

});

describe('selectLocationFromMap', () => {
    let app;
    beforeEach(async() => {

        let initapp = newTestStub({
            currentPage: 'createwo',
            datasources: {
              locationLookupDS: {
                    name: 'locationLookupDS',
                    data: [{
                        locationsid: 'uid1',
                        location: '1',
                        siteid: 'BEDFORD'
                      }],
                },
                dsCreateWo: {
                    name: 'dsCreateWo',
                    data: [
                        {
                            locationsid : '',
                            location: '',
                        }
                    ]
                },
                synonymdomainData: {
                  name: 'synonymdomainData',
                  data: [
                    {
                      domainid: 'WOSTATUS',
                      maxvalue: 'WAPPR',
                      orgid: 'EAGLENA',
                      siteid: 'BEDFORD',
                      defaults: true
                    }
                  ]
                }
            },
        });
        
        app = await initapp();

        app.client.userInfo = {
            insertSite: 'BEDFORD'
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
        locationsid: 'uid1',
        location: '1',
        siteid: 'BEDFORD'
      }
      
      let locationMapDialog = app.currentPage.findDialog('locationMapDialog');
      app.state.map.selectedDS = 'dsCreateWo';
      app.state.map.selectedDSAttribute = 'location';
      let controller = locationMapDialog.controllers[0];
      controller.dialogInitialized(locationMapDialog);
      controller.dialog.closeDialog = jest.fn();
      //Forcing data the be populated in DS
      await controller.selectLocationFromMap(app.state.map.selectedDS);

      let datasource = controller.app.findDatasource(app.state.map.selectedDS);
      expect(app.currentPage).not.toBeNull();
      expect(app.currentPage.name).toBe("createwo");
      expect(datasource.item[app.state.map.selectedDSAttribute]).toBe(app.state.map.selectedItem.location);
      expect(controller.dialog.closeDialog).toHaveBeenCalled();
    
    });

});

describe('createLocationSymbology and retrieveLocationLegends', () => {

  let controller;
  beforeEach(() => {
    controller = new LocationDialogMapController();
    const app = new Application();
    controller.app = app;
    app.state.map = getInitialMapState();

    controller.onLocationMapCreate({});
    controller.mapUtils.createSymbology = jest.fn();
    controller.mapUtils.retrieveLegends = jest.fn();
  });

  it('should call mapUtils symbology function', () => {
    controller.createLocationSymbology({});
    expect(controller.mapUtils.createSymbology).toHaveBeenCalled();
  });

  it('should call mapUtils retrieveLegends function', () => {
    controller.retrieveLocationLegends();
    expect(controller.mapUtils.retrieveLegends).toHaveBeenCalled();
  });

});

// Assisted by watsonx Code Assistant 
describe('loading function', () => {

  let controller, app, isLoading, datasource;

  beforeEach(() => {
    controller = new LocationDialogMapController();
    app = new Application();
    controller.app = app;
    app.state.map = getInitialMapState();
    // controller.onLocationMapCreate({});
    controller.populateListByExtent = jest.fn();
    isLoading = false;
    datasource = { name: 'maxlib_location_map_layer_datasource' };
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
        location: 'locationVal',
        siteid: 'siteidVal'
      }
    };

    const mockedLocationMapDS = { 
      name: 'maxlib_location_map_layer_datasource',
      item: {
        location: 'locationVal',
        siteid: 'siteidVal'
      },
      items: []
    
    }
    app.findDatasource = (dsName) => {
      if (dsName === 'dsCreateWo') return mockedsCreateWo;
      if (dsName === 'maxlib_location_map_layer_datasource') return mockedLocationMapDS;

    };

    controller.mapUtils = {}
    app.state.map.selectedDS = 'dsCreateWo';
    controller.loading(isLoading, datasource);
    // assert
    expect(app.state.map.isLoading).toBe(false);
    expect(controller.populateListByExtent).toHaveBeenCalled();
  });

  it('should set app state map selectedItem to locationRecord, blockOnMapMove to true', () => {
    // arrange
    app.currentPage = {
      name: 'createwo'
    };

    const mockedsCreateWo = {
      name: `dsCreateWo`,
      item: {
        location: 'locationVal',
        siteid: 'siteidVal'
      }
    };

    const locationRecord = {
      location: 'locationVal',
      siteid: 'siteidVal'
    };

    const mockedLocationMapDS = { 
      name: 'maxlib_location_map_layer_datasource',
      item: {
        location: 'locationVal',
        siteid: 'siteidVal'
      },
      items: [locationRecord]
    
    }
    app.findDatasource = (dsName) => {
      if (dsName === 'dsCreateWo') return mockedsCreateWo;
      if (dsName === 'maxlib_location_map_layer_datasource') return mockedLocationMapDS;
    };
    
    controller.mapUtils = {
      getCoordinatesFromItem: jest.fn(() => [0, 0]),
      centerMap: jest.fn()
    }

    app.state.map.selectedDS = 'dsCreateWo';
    app.state.map.selectedDSAttribute = "location";
    // act
    controller.loading(isLoading, datasource);
    // assert
    expect(app.state.map.selectedItem).toStrictEqual(locationRecord);
    expect(controller.blockOnMapMove).toBe(true);
    expect(controller.mapUtils.centerMap).toHaveBeenCalledWith(0, 0);
  });

  it('should use locationnum for edit page', () => {
    // arrange
    app.currentPage = {
      name: 'woedit'
    };

    const mockedsEditWo = {
      name: `dsWoedit`,
      item: {
        location: 'locationVal',
        siteid: 'siteidVal'
      }
    };

    const locationRecord = {
      location: 'locationVal',
      siteid: 'siteidVal'
    };

    const mockedLocationMapDS = { 
      name: 'maxlib_location_map_layer_datasource',
      item: {
        location: 'locationVal',
        siteid: 'siteidVal'
      },
      items: [locationRecord]
    
    }
    app.findDatasource = (dsName) => {
      if (dsName === 'dsWoedit') return mockedsEditWo;
      if (dsName === 'maxlib_location_map_layer_datasource') return mockedLocationMapDS;
    };
    
    app.state.map.selectedDS = 'dsWoedit';
    app.state.map.selectedDSAttribute = "location";
    
    controller.mapUtils = {
      getCoordinatesFromItem: jest.fn(() => [0, 0]),
      centerMap: jest.fn()
    }
    // act
    controller.loading(isLoading, datasource);
    // assert
    expect(app.state.map.selectedItem).toStrictEqual(locationRecord);
    expect(controller.blockOnMapMove).toBe(true);
    expect(controller.mapUtils.centerMap).toHaveBeenCalledWith(0, 0);
  });

});

describe('onDatasourceSelectionChanged function', () => {

  let controller, app;

  beforeEach(() => {
    controller = new LocationDialogMapController();
    app = new Application();
    controller.app = app;
    app.state.map = getInitialMapState();
    controller.onLocationMapCreate({});
    controller.mapUtils.highlightItem = jest.fn();
    controller.mapUtils.getMaximoAttributesFromFeature = jest.fn((x) => x);
    
  });

  it('should highlight the map feature corresponding to selected item', () => {

    const locationRecord = {
      locationsid: 'LOC1'
    };

    controller.mapUtils.getFeaturesFromCurrentExtent = jest.fn(() => [locationRecord]);

    const mockedLocationMapDS = { 
      name: 'MapFilterJSON',
      item: locationRecord,
      items: [locationRecord]    
    }

    const uniquePinMock = {
      get: () => [locationRecord]
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

    expect(app.state.map.selectedItem).toStrictEqual(locationRecord);
    expect(controller.mapUtils.highlightItem).toHaveBeenCalled();
  });

});