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

import ToolsPageController from './ToolsPageController';
import tools from './test/tools-json-data';
import toolInventory from './test/tool-inventory-json-data';
import sinon from 'sinon';
import { Application, Datasource, JSONDataAdapter, Page } from '@maximo/maximo-js-api';

const toolJson = {
  member: [
    {
      "itemnum": "NIBBLER",
      "itemqty": 15,
      "hours": 8,
      "wpitemid": 587,
      "isrotating": false,
      "location": "PKG",
      "description": "BLACK & DECKER METAL NIBBLER",
      "siteid": "BEDFORD",
      "href": "oslc/os/mxapiwodetail/_QkVERk9SRC8xMjEx/uxshowplantool/2-587",
      "tooltrans": [
        {
          "toolqty": 155,
          "assetnum": "11430",
          "location": "BR430"
        }
      ],
      "storelocsite": "BEDFORD",
      "actualqty": 1
    },
    {
      "itemnum": "HAND IMPACTOR",
      "itemqty": 3,
      "hours": 0,
      "wpitemid": 586,
      "isrotating": true,
      "siteid": "BEDFORD",
      "href": "oslc/os/mxapiwodetail/_QkVERk9SRC8xMjEx/uxshowplantool/0-586",
      "tooltrans": [
        {
          "rotassetsite": "BEDFORD",
          "toolqty": 1,
          "assetnum": "11430",
          "location": "BR430",
          "rotassetnum": "2197"
        },
        {
          "rotassetsite": "BEDFORD",
          "toolqty": 1,
          "assetnum": "11430",
          "location": "BR430",
          "rotassetnum": "2196"
        }
      ],
      "storelocsite": "BEDFORD",
      "actualqty": 2
    },
    {
      "itemnum": "DUMP TRUCK",
      "itemqty": 3,
      "hours": 0,
      "wpitemid": 589,
      "isrotating": true,
      "description": "Dump Truck",
      "siteid": "BEDFORD",
      "href": "oslc/os/mxapiwodetail/_QkVERk9SRC8xMjEx/uxshowplantool/0-586",
      "tooltrans": [
        {
          "rotassetsite": "BEDFORD",
          "toolqty": 1,
          "assetnum": "11430",
          "location": "BR430",
          "rotassetnum": "2197"
        },
        {
          "rotassetsite": "BEDFORD",
          "toolqty": 1,
          "assetnum": "11430",
          "location": "BR430",
          "rotassetnum": "2196"
        }
      ],
      "storelocsite": "BEDFORD",
      "actualqty": 0
    }
  ],
};

function newDatasource(data = tools, name = 'selectedDatasource', field = 'member') {
  const da = new JSONDataAdapter({
    src: data,
    items: field,
  });
  const ds = new Datasource(da, {
    idAttribute: 'tooltransid',
    name: name,
    selection: {
      selected: []
    },
    load: jest.fn(),
    initializeQbe: jest.fn(),
    setQBE: jest.fn(),
    searchQBE: jest.fn(),
    forceReload: jest.fn(),
    bulkAdd: jest.fn(),
    on: jest.fn()
  });
  return ds;
}

describe('pageInitialized', () => {
  it('should initialize page and app correctly', () => {
    const controller = new ToolsPageController();
    const app = new Application();
    const page = new Page({ name: 'reportTools' });
    controller.page = page;
    controller.pageInitialized(page, app);
    expect(controller.page).toBe(page);
    expect(controller.app).toBe(app);
  });
});

describe('loadPageData', () => {
  it('should set pageTitle based on isPlanned parameter', async () => {
    const controller = new ToolsPageController();
    const app = new Application({
      state: { pageLoading: false, canLoadWoDetailDS: false },
      getLocalizedLabel: jest.fn(),
      findPage: jest.fn(() => ({
        findDatasource: jest.fn(),
      })),
    });
    const page = new Page({
      name: 'reportTools',
      state: {
        pageTitle: '',
        selectedDS: '',
        loading: false
      },
      params: {
        href: 'oslc/os/mxapiwodetail/_QkVERk9SRC8xMjA3',
        isPlanned: true
      },
      findDatasource: jest.fn(() => ({
        items: [],
        forceReload: jest.fn(),
        load: jest.fn(),
      })),
      getLocalizedLabel: jest.fn(),
      separateToolsIntoGroups: jest.fn(() => [[], []]) 
    });

    const ds = newDatasource(tools, 'woIssuedToolDS');
    page.registerDatasource(ds);
    const toolsActualDs = newDatasource(tools, 'toolsActualDs');
    page.registerDatasource(toolsActualDs);
    app.registerController(controller);
    app.registerPage(page);
    await app.initialize();
    controller.pageInitialized(page, app);
    page.params.isPlanned = true;
    jest.spyOn(controller, "updateActualQty").mockImplementation(() => { });
    await controller.loadPageData();

    expect(controller.page.state.pageTitle).toBe(controller.app.getLocalizedLabel('planned_tools_title', 'Select planned tools'));

    controller.page.params.isPlanned = false;
    controller.page.state.pageTitle = ''; // Reset pageTitle
    await controller.loadPageData();
    expect(app.state.pageLoading).toBe(false);
    expect(page.state.loading).toBe(false);
    expect(controller.page.state.pageTitle).toBe(controller.app.getLocalizedLabel('issued_tools_title', 'Select issued tools'));
  });

  it('should handle missing href parameter', async () => {
    const controller = new ToolsPageController();
    const app = new Application({
      state: { pageLoading: false, canLoadWoDetailDS: false },
      getLocalizedLabel: jest.fn(),
      findPage: jest.fn(() => ({
        findDatasource: jest.fn(),
      })),
    });
    const page = new Page({
      name: 'reportTools',
      state: {
        pageTitle: '',
        selectedDS: '',
        loading: false
      },
      params: {
        href: 'oslc/os/mxapiwodetail/_QkVERk9SRC8xMjA3',
        isPlanned: true
      },
      findDatasource: jest.fn(() => ({
        items: [],
        forceReload: jest.fn(),
        load: jest.fn(),
      })),
      getLocalizedLabel: jest.fn(),
      separateToolsIntoGroups: jest.fn(() => [[], []])
    });
    const ds = newDatasource(tools, 'woIssuedToolDS');
    page.registerDatasource(ds);
    app.registerController(controller);
    app.registerPage(page);
    await app.initialize();
    controller.pageInitialized(page, app);
    page.params.isPlanned = true;
    const loadstub = sinon.stub(ds, 'load');
    jest.spyOn(controller, "updateActualQty").mockImplementation(() => { });
    await controller.loadPageData();
    expect(app.state.canLoadWoDetailDS).toBe(true);

    page.params.href = null;
    await controller.loadPageData();
    expect(loadstub.called).toBe(false);
  });
});

describe('pagePaused', () => {
  it('should reset rotatingAsset and call reset methods', async () => {
    const controller = new ToolsPageController();
    const app = new Application({
      findDatasource: jest.fn(() => ({
        clearSelections: jest.fn()
      }))
    });
    const page = new Page({
      name: 'reportTools',
      state: {
        rotatingAsset: 'Centrifulgal Pump'
      },
      resetJsonDatasources: jest.fn(),
      resetToolSelections: jest.fn(),
    });

    const woNonRotatingToolJsonDS = newDatasource(tools, 'woNonRotatingToolJsonDS');
    app.registerDatasource(woNonRotatingToolJsonDS);
    const woRotatingToolJsonDS = newDatasource(tools, 'woRotatingToolJsonDS');
    app.registerDatasource(woRotatingToolJsonDS);
    const rotatingToolAssetJsonDS = newDatasource(tools, 'rotatingToolAssetJsonDS');
    app.registerDatasource(rotatingToolAssetJsonDS);
    app.registerController(controller);
    app.registerPage(page);
    await app.initialize();
    controller.pageInitialized(page, app);
    controller.pagePaused(page, app);

    expect(page.state.rotatingAsset).toBe('');
    expect(woNonRotatingToolJsonDS.items.length).toBe(0);
    expect(woRotatingToolJsonDS.items.length).toBe(0);
    expect(rotatingToolAssetJsonDS.items.length).toBe(0);
  });
});
describe('resetToolSelections', async () => {
  const controller = new ToolsPageController();
  const app = new Application();
  const page = new Page({
    name: 'reportTools',
    state: {
      pageTitle: '',
      selectedDS: ''
    },
    findDatasource: jest.fn(() => ({
      items: [],
      forceReload: jest.fn(),
      load: jest.fn(),
      clearSelections: jest.fn(),
      resetState: jest.fn()
    })),
    getLocalizedLabel: jest.fn()
  });
  const woNonRotatingToolJsonDS = newDatasource(tools, 'woNonRotatingToolJsonDS');
  page.registerDatasource(woNonRotatingToolJsonDS);

  const woRotatingToolJsonDS = newDatasource(tools, 'woRotatingToolJsonDS');
  app.registerDatasource(woRotatingToolJsonDS);

  const rotatingToolAssetJsonDS = newDatasource(tools, 'rotatingToolAssetJsonDS');
  page.registerDatasource(rotatingToolAssetJsonDS);

  app.registerController(controller);
  app.registerPage(page);
  await app.initialize();
  controller.pageInitialized(page, app);

  const resetToolSelectionsSpy = jest.spyOn(controller, 'resetToolSelections').mockImplementationOnce(() => true);
  const woNonRotatingToolJsonDSSpy = jest.spyOn(woNonRotatingToolJsonDS, "clearSelections").mockReturnValue([{ woNonRotatingToolJsonDS: { state: { selection: [] } } }]);
  const woRotatingToolJsonDSSpy = jest.spyOn(woRotatingToolJsonDS, "clearSelections").mockReturnValue([{ woRotatingToolJsonDS: { state: { selection: [] } } }]);
  const rotatingToolAssetJsonDSSpy = jest.spyOn(rotatingToolAssetJsonDS, "clearSelections").mockReturnValue([{ rotatingToolAssetJsonDS: { state: { selection: [] } } }]);

  it('should clear selections from woIssuedToolDS', () => {
    controller.resetToolSelections();
    expect(resetToolSelectionsSpy).toHaveBeenCalled();
    expect(woNonRotatingToolJsonDS.state.selection.selected).toStrictEqual({});
    expect(woRotatingToolJsonDS.state.selection.selected).toStrictEqual({});
    expect(rotatingToolAssetJsonDS.state.selection.selected).toStrictEqual({});
    woNonRotatingToolJsonDSSpy.mockRestore();
    woRotatingToolJsonDSSpy.mockRestore();
    rotatingToolAssetJsonDSSpy.mockRestore();
  });
});

describe('reportTools', async () => {
  const controller = new ToolsPageController();
  const app = new Application({
    findDatasource: jest.fn(),
    findPage: { findDatasource: jest.fn() },
    state: {},
    getLocalizedLabel: jest.fn(),
    toast: jest.fn()
  });
  const page = new Page({
    name: 'reportTools',
    state: {
      pageTitle: '',
      selectedDS: ''
    },
    params: { isPlanned: true, href: 'oslc/os/mxapiwodetail/_QkVERk9SRC8xMjA3' },
    state: {},
    goBackToReportPage: jest.fn(),
    onSaveDataFailed: jest.fn()
  });
  const reportPage = new Page({ name: 'report_work' });
  const woNonRotatingToolJsonDS = newDatasource(toolJson, 'woNonRotatingToolJsonDS');
  woNonRotatingToolJsonDS.clearSelections = jest.fn();
  page.registerDatasource(woNonRotatingToolJsonDS);
  const tooljsonData = { ...toolJson };
  const woReportWorkDs = newDatasource(tooljsonData, 'reportWorkActualToolsDetailDs');
  reportPage.registerDatasource(woReportWorkDs);
  app.registerPage(page);
  app.registerPage(reportPage);
  app.registerController(controller);
  await app.initialize();
  controller.pageInitialized(page, app);
  jest.spyOn(app, "toast").mockImplementation(() => { });
  jest.spyOn(app, "findPage").mockImplementation(() => { });
  jest.spyOn(controller, "goBackToReportPage").mockImplementation(() => { });

  it('should exit early if datasource has warnings', async () => {
    app.toast = jest.fn();
    page.goBackToReportPage = jest.fn();
    controller.selectedDS = 'woNonRotatingToolJsonDS';
    woNonRotatingToolJsonDS.hasWarnings = jest.fn(() => true);
    jest.spyOn(woNonRotatingToolJsonDS, "load").mockImplementation(() => { });
    await controller.reportTools();
    expect(page.state.loading).toBe(false);
    expect(app.findPage).not.toHaveBeenCalled();
    expect(woNonRotatingToolJsonDS.load).not.toHaveBeenCalled();
  });
  it('should handle missing href parameter', async () => {
    page.params.href = undefined;
    const loadstub = sinon.stub(woReportWorkDs, 'load');
    await controller.reportTools();
    expect(loadstub.called).toBe(false);
  });
  it('should report tools successfully', async () => {
    app.registerPage(reportPage);
    page.params.isPlanned = true;
    jest.spyOn(controller, "updateActualQty").mockImplementation(() => { });
    await controller.loadPageData();
    page.params.href = 'oslc/os/mxapiwodetail/_QkVERk9SRC8xMjA3';
    woNonRotatingToolJsonDS.hasWarnings = jest.fn(() => false);
    jest.spyOn(woReportWorkDs, "load").mockImplementation(() => { });
    app.findPage = jest.fn((page) =>
      page === 'report_work' ? { findDatasource: jest.fn(() => woReportWorkDs) } : null
    );
    await controller.reportTools();

    expect(woReportWorkDs.load).toHaveBeenCalled();
    expect(app.toast).toHaveBeenCalledWith('Planned tools added successfully', 'success');
    expect(page.state.loading).toBe(false);
    expect(controller.goBackToReportPage).toHaveBeenCalled();

    page.params.isPlanned = false;
    jest.spyOn(controller, "updateActualQty").mockImplementation(() => { });
    await controller.loadPageData();
    page.params.href = 'oslc/os/mxapiwodetail/_QkVERk9SRC8xMjA3';
    woNonRotatingToolJsonDS.hasWarnings = jest.fn(() => false);
    jest.spyOn(woReportWorkDs, "load").mockImplementation(() => { });
    app.findPage = jest.fn((page) =>
      page === 'report_work' ? { findDatasource: jest.fn(() => woReportWorkDs) } : null
    );
    await controller.reportTools();

    expect(woReportWorkDs.load).toHaveBeenCalled();
    expect(app.toast).toHaveBeenCalledWith('Issued tools added successfully', 'success');
    expect(page.state.loading).toBe(false);
    expect(controller.goBackToReportPage).toHaveBeenCalled();
  });
  it('should handle error during reporting tools', async () => {
    woReportWorkDs.bulkAdd = jest.fn();
    const onSaveDataFailedstub = sinon.stub(controller, 'onSaveDataFailed').returns(controller.saveDataSuccessful = false);
    woReportWorkDs.bulkAdd.mockRejectedValue(new Error('Failed to add tools'));
    await controller.reportTools();
    expect(onSaveDataFailedstub.called).toBe(false);
    expect(app.toast).toHaveBeenCalledWith('Failed to add tools', 'error');
  });
});

describe('resetJsonDatasources', async () => {
  it('should call load on all datasources with empty src and noCache true', async () => {
    const controller = new ToolsPageController();
    const app = new Application({
      findDatasource: jest.fn()
    });
    const page = new Page({
      name: 'reportTools',
    });

    const woNonRotatingToolJsonDS = newDatasource(tools, 'woNonRotatingToolJsonDS');
    page.registerDatasource(woNonRotatingToolJsonDS);

    const woRotatingToolJsonDS = newDatasource(tools, 'woRotatingToolJsonDS');
    app.registerDatasource(woRotatingToolJsonDS);

    const rotatingToolAssetJsonDS = newDatasource(tools, 'rotatingToolAssetJsonDS');
    page.registerDatasource(rotatingToolAssetJsonDS);

    app.registerController(controller);
    app.registerPage(page);
    await app.initialize();
    controller.pageInitialized(page, app);

    await controller.resetJsonDatasources();

    expect(woNonRotatingToolJsonDS.items.length).toBe(0);
    expect(woRotatingToolJsonDS.items.length).toBe(0);
    expect(rotatingToolAssetJsonDS.items.length).toBe(0);
  });
});

describe('handlePageExit', () => {
  it('should go back to the report work page ', async () => {
    const controller = new ToolsPageController();
    const app = new Application({
      findDatasource: jest.fn(),
      navigateBack: jest.fn()
    });
    const page = new Page({
      name: 'reportTools',
      showDialog: jest.fn(),
    });

    const woNonRotatingToolJsonDS = newDatasource(tools, 'woNonRotatingToolJsonDS');
    app.registerDatasource(woNonRotatingToolJsonDS);
    app.registerController(controller);
    app.registerPage(page);
    await app.initialize();
    controller.pageInitialized(page, app);
    app.findDatasource = jest.fn(() => ({ state: { selection: { count: 1 } } }));
    const showDialogSpy = jest.spyOn(page, 'showDialog');
    controller.handlePageExit();

    const goBackSpy = jest.spyOn(app, 'navigateBack').mockImplementationOnce(() => true);
    expect(showDialogSpy).toHaveBeenCalledWith('saveDiscardToolsDialog');
    expect(goBackSpy).not.toHaveBeenCalled();

    app.findDatasource = jest.fn(() => ({ state: { selection: { count: 0 } } }));
    controller.handlePageExit();
    expect(goBackSpy).toHaveBeenCalled();
    goBackSpy.mockRestore();

  });
});
describe('goBackToReportPage', () => {
  it('should call resetToolSelections and navigateBack', async () => {
    const controller = new ToolsPageController();
    const app = new Application({
      navigateBack: jest.fn(),
      findDatasource: jest.fn(() => ({
        getSelectedItems: jest.fn(() => []),
        clearSelections: jest.fn()
      })),
    });
    const page = new Page({
      name: 'reportTools',
      resetToolSelections: jest.fn()
    });
    const woNonRotatingToolJsonDS = newDatasource(tools, 'woNonRotatingToolJsonDS');
    app.registerDatasource(woNonRotatingToolJsonDS);

    const woRotatingToolJsonDS = newDatasource(tools, 'woRotatingToolJsonDS');
    app.registerDatasource(woRotatingToolJsonDS);

    const rotatingToolAssetJsonDS = newDatasource(tools, 'rotatingToolAssetJsonDS');
    app.registerDatasource(rotatingToolAssetJsonDS);
    app.registerController(controller);

    app.registerPage(page);
    await app.initialize();
    controller.pageInitialized(page, app);
    const navigateBackSpy = jest.spyOn(app, 'navigateBack').mockImplementationOnce(() => true);
    const resetToolSelectionsSpy = jest.spyOn(controller, 'resetToolSelections').mockImplementationOnce(() => true);
    controller.goBackToReportPage();

    expect(resetToolSelectionsSpy).toHaveBeenCalled();
    expect(navigateBackSpy).toHaveBeenCalled();
    navigateBackSpy.mockRestore();
    resetToolSelectionsSpy.mockRestore();
  });

});
describe('separateToolsIntoGroups', () => {
  it('should separate items into rotating and non-rotating groups', async () => {
    const controller = new ToolsPageController();
    const app = new Application();
    let page = new Page({
      name: 'reportTools',
    });

    const woDetailsToolds = newDatasource(toolJson, 'woDetailsToolds');
    page.registerDatasource(woDetailsToolds);

    app.registerController(controller);
    app.registerPage(page);
    await app.initialize();
    controller.pageInitialized(page, app);

    const [nonRotating, rotating] = controller.separateToolsIntoGroups(woDetailsToolds?.items);

    expect(nonRotating.length).toBe(0);
    expect(rotating.length).toBe(0);
  });

  it('should separate items into rotating and non-rotating groups', () => {
    const controller = new ToolsPageController();
    const app = new Application({
      findDatasource: jest.fn((ds) => ({
        load: jest.fn()
      }))
    });
    const page = new Page({
      name: 'reportTools',
    });
    app.registerController(controller);
    app.registerPage(page);
    controller.pageInitialized(page, app);
    const [nonRotating, rotating] = controller.separateToolsIntoGroups({ items: null });
    expect(nonRotating).toEqual([]);
    expect(rotating).toEqual([]);
  });

  it('should handle undefined or null input gracefully', () => {
    const controller = new ToolsPageController();
    const app = new Application()
    const page = new Page({ name: 'reportTools' });
    app.registerController(controller);
    app.registerPage(page);
    controller.pageInitialized(page, app);
    const [nonRotating, rotating] = controller.separateToolsIntoGroups(null);
    expect(nonRotating).toEqual([]);
    expect(rotating).toEqual([]);
  });

  it('should handle null or undefined item.hours and default it to 1', () => {
    const controller = new ToolsPageController();
    const app = new Application()
    const page = new Page({ name: 'reportTools' });
    app.registerController(controller);
    app.registerPage(page);
    controller.pageInitialized(page, app);
    const tools = [
      {
        "issuetype": "ISSUE",
        "itemnum": "WELDER",
        "itemqty": 1,
        "issuetype_description": "Issue item",
        "isrotating": false,
        "description": "LINCOLN 250AMP ELECTRIC WELDER",
        "matusetransid": 100446,
        "location": "CENTRAL",
        "href": "oslc/os/mxapiwodetail/_QkVERk9SRC8xMjA0/issuedtool/0-100446",
        "issuetype_maxvalue": "ISSUE"
      }, {
        "issuetype": "ISSUE",
        "itemnum": "DUMP TRUCK",
        "itemqty": 1,
        "issuetype_description": "Issue item",
        "isrotating": true,
        "description": "LINCOLN 250AMP ELECTRIC WELDER",
        "matusetransid": 100447,
        "location": "CENTRAL",
        "href": "oslc/os/mxapiwodetail/_QkVERk9SRC8xMjA0/issuedtool/0-100447",
        "issuetype_maxvalue": "ISSUE"
      }
    ];
    const [nonRotating, rotating] = controller.separateToolsIntoGroups(tools);
    expect(nonRotating[0].hours).toEqual(1);
    expect(rotating[0].hours).toEqual(1);
  });

});

describe('getStoreroomForTools', () => {
  it('should return item location when isPlanned is false', async () => {
    const controller = new ToolsPageController();
    const app = new Application({
      findPage: jest.fn((page) =>
        page === 'report_work' ? { findDatasource: jest.fn() } : null
      )
    });
    const reportPage = new Page({ name: 'report_work' });
    const page = new Page({
      name: 'reportTools',
      findDatasource: jest.fn(() => ({
        initializeQbe: jest.fn(),
        setQBE: jest.fn(),
        searchQBE: jest.fn(),
        clearQBE: jest.fn()
      })),
    });

    const woDetailsToolds = newDatasource(toolJson, 'woDetailsToolds');
    const inventoryDS = newDatasource(toolInventory, 'inventoryToolDS');
    page.registerDatasource(woDetailsToolds);
    reportPage.registerDatasource(inventoryDS);

    app.registerController(controller);
    app.registerPage(page);
    app.registerPage(reportPage);
    await app.initialize();
    controller.pageInitialized(page, app);

    const item = toolJson.member[0];
    const result = await controller.getStoreroomForTools(item, true);
    expect(result).toEqual(['CENTRAL']);
  });

  it('should fetch and return storeroom locations when isPlanned is true', async () => {
    const controller = new ToolsPageController();
    const app = new Application({
      findPage: jest.fn((page) =>
        page === 'report_work' ? { findDatasource: jest.fn() } : null
      )
    });
    const page = new Page({
      name: 'reportTools',
      findDatasource: jest.fn(() => ({
        initializeQbe: jest.fn(),
        setQBE: jest.fn(),
        searchQBE: jest.fn(),
        clearQBE: jest.fn()
      })),
    });

    const woDetailsToolds = newDatasource(toolJson, 'woDetailsToolds');
    page.registerDatasource(woDetailsToolds);
    app.registerController(controller);
    app.registerPage(page);
    await app.initialize();
    controller.pageInitialized(page, app);

    const item = toolJson.member[1];
    const result = await controller.getStoreroomForTools(item, false);
    expect(result.length).toBe(2);
  })

  it('should return empty array if no inventoryToolDS is found', async () => {
    const controller = new ToolsPageController();
    const app = new Application({
      findPage: jest.fn((page) =>
        page === 'report_work' ? { findDatasource: jest.fn() } : null
      )
    });
    const reportPage = new Page({ name: 'report_work' });
    const page = new Page({
      name: 'reportTools',
      findDatasource: jest.fn(() => ({
        initializeQbe: jest.fn(),
        setQBE: jest.fn(),
        searchQBE: jest.fn(),
        clearQBE: jest.fn()
      })),
    });

    const woDetailsToolds = newDatasource(toolJson, 'woDetailsToolds');
    const inventoryDS = newDatasource(toolInventory, 'inventoryToolDS');
    page.registerDatasource(woDetailsToolds);
    reportPage.registerDatasource(inventoryDS);

    app.registerController(controller);
    app.registerPage(page);
    app.registerPage(reportPage);
    await app.initialize();
    controller.pageInitialized(page, app);

    const item = toolJson.member[1];
    const result = await controller.getStoreroomForTools(item, true);
    expect(result).toEqual([]);
  });
});

describe('getRotatingToolsData', () => {
  const controller = new ToolsPageController();
  const app = new Application({
    findDatasource: jest.fn(() => ({
      state: { selection: { count: 1 }, hasError: 0 },
      clearSelections: jest.fn(),
      resetState: jest.fn()
    })),
    navigateBack: jest.fn()
  });
  const page = new Page({
    name: 'reportTools',
    state: {}
  });
  it('should show dialog if tools have selections', async () => {
    const woNonRotatingToolJsonDS = newDatasource(tools, 'woNonRotatingToolJsonDS');
    app.registerDatasource(woNonRotatingToolJsonDS);
    app.findDatasource = jest.fn(() => ({ getSelectedItems: jest.fn(() => [tools.member[0]]) }));
    app.registerController(controller);
    app.registerPage(page);
    await app.initialize();
    controller.pageInitialized(page, app);
    jest.spyOn(page, 'showDialog');
    controller.getRotatingToolsData({ description: 'MACHINE TOOL LATHE' });
    expect(page.showDialog).toHaveBeenCalledWith('saveDiscardToolsDialog');
    expect(controller.selectedDS).toBeUndefined();
  });

  it('should load rotating tools json datasource', async () => {

    const rotatingToolAssetDS = newDatasource(toolJson, "rotatingToolAssetDS");
    app.registerDatasource(rotatingToolAssetDS);
    app.registerController(controller);
    app.registerPage(page);
    controller.pageInitialized(page, app);
    app.findDatasource = jest.fn(() => ({ getSelectedItems: jest.fn(() => []), clearSelections: jest.fn(), load: jest.fn(), resetState: jest.fn() }));
    page.resetToolSelections = jest.fn();
    page.getStoreroomForTools = jest.fn(async () => ['CENTRAL']);
    page.findDatasource = jest.fn((ds) => rotatingToolAssetDS);
    rotatingToolAssetDS.initializeQbe = jest.fn();
    rotatingToolAssetDS.setQBE = jest.fn();
    rotatingToolAssetDS.searchQBE = jest.fn();

    const initializeQbeSpy = jest.spyOn(rotatingToolAssetDS, 'initializeQbe');
    const setQBESpy = jest.spyOn(rotatingToolAssetDS, 'setQBE');
    const searchQBESpy = jest.spyOn(rotatingToolAssetDS, 'searchQBE');
    await controller.getRotatingToolsData(toolJson.member[0]);
    expect(page.state.pageTitle).toBe('Select rotating tools');
    expect(controller.selectedDS).toBe('rotatingToolAssetJsonDS');
    expect(page.state.rotatingAsset).toBe('BLACK & DECKER METAL NIBBLER');
    expect(initializeQbeSpy).toHaveBeenCalled();
    expect(setQBESpy).toHaveBeenCalledWith('itemnum', '=', 'NIBBLER');
    expect(setQBESpy).toHaveBeenCalledWith('itemtype', '=', 'TOOL');
    expect(setQBESpy).toHaveBeenCalledWith('siteid', '=', 'BEDFORD');
    expect(searchQBESpy).toHaveBeenCalled();

    await controller.getRotatingToolsData(toolJson.member[1]);
    expect(page.state.pageTitle).toBe('Select rotating tools');
    expect(controller.selectedDS).toBe('rotatingToolAssetJsonDS');
    expect(page.state.rotatingAsset).toBe('HAND IMPACTOR');
    expect(initializeQbeSpy).toHaveBeenCalled();
    expect(setQBESpy).toHaveBeenCalledWith('itemnum', '=', 'HAND IMPACTOR');
    expect(setQBESpy).toHaveBeenCalledWith('itemtype', '=', 'TOOL');
    expect(setQBESpy).toHaveBeenCalledWith('siteid', '=', 'BEDFORD');
    expect(searchQBESpy).toHaveBeenCalled();

  });
});

describe('onSaveDataFailed', () => {
  const controller = new ToolsPageController();
  const app = new Application({ getLocalizedLabel: jest.fn() });
  const page = new Page({ name: 'reportTools', state: {} });
  app.registerController(controller);
  app.registerPage(page);
  controller.pageInitialized(page, app);
  controller.page = page;

  test('should set saveDataSuccessful to false', () => {
    controller.onSaveDataFailed();
    expect(controller.saveDataSuccessful).toBe(false);
  });
});

describe('updateActualQty', () => {
  it('should update actualqty for each rotating item', async () => {
    const controller = new ToolsPageController();
    const app = new Application();
    const page = new Page({
      name: 'reportTools'
    });
    const mockWoRotatingToolJsonDS = {
      items: [
        { itemnum: 'item1', actualqty: 0 },
        { itemnum: 'item2', actualqty: 0 }
      ]
    };
    const mockToolsActualDs = {
      items: [
        { itemnum: 'item1' },
        { itemnum: 'item1' },
      ],
      forceReload: jest.fn(),
    };
    app.registerPage(page);
    page.registerController(controller);
    await app.initialize();
    controller.pageInitialized(page, app);
    page.findDatasource = jest.fn((name) => {
      if (name === 'toolsActualDs') return mockToolsActualDs;
      if (name === 'woRotatingToolJsonDS') return mockWoRotatingToolJsonDS;
      return null;
    })
    await controller.updateActualQty();
    // Assertions
    expect(mockWoRotatingToolJsonDS.items[0].actualqty).toBe(2); 
    expect(mockWoRotatingToolJsonDS.items[1].actualqty).toBe(0); 
  });
});

