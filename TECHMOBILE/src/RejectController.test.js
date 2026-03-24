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

import RejectController from './RejectController' ;
import { JSONDataAdapter, Datasource, Application, Page } from '@maximo/maximo-js-api';
import workorderitem from "./test/wo-detail-json-data.js";
import statusitem from './test/statuses-json-data.js';
import SynonymUtil from './utils/SynonymUtil.js';

function newSynonymDatasource(data = statusitem, name = 'synonymdomainData') {
  const da = new JSONDataAdapter({
    src: data,
    items: 'member',
    schema: 'responseInfo.schema'
  });

  const ds = new Datasource(da, {
    idAttribute: 'value',
    name: name
  });

  return ds;
}
// Assisted by WCA for GP. Latest GenAI contribution: Version 1, granite-20B-code-instruct-v1 model
describe('dialogInitialized', () => {
  it('should set the page and app variables', async () => {
    const controller = new RejectController();
    const app = new Application();
    const page = new Page({name: 'page'});
    page.registerController(controller);
    const parentPage = new Page({name: 'parentPage'});
    page.parent = parentPage ;
    app.registerController(controller);

    await app.initialize();
    controller.dialogInitialized(page, app);

    expect(controller.page).toBe(page);

  });

});

describe('dialogInitialized', () => {
  it('should set the page and app variables', async () => {
    const controller = new RejectController();
    const app = new Application();
    const page = new Page({name: 'page'});
    page.registerController(controller);
    const parentPage = new Page({name: 'parentPage'});
    page.parent = parentPage ;
    app.registerController(controller);

    await app.initialize();
    controller.dialogInitialized(page, app);

    expect(controller.page).toBe(page);

  });

});

// Assisted by WCA for GP. Latest GenAI contribution: Version 1, granite-20B-code-instruct-v1 model
/**
 * Tests for the dialogOpened method in the Dialog class.
 */
describe('dialogOpened', () => {
  it('should set the disableDoneButton property to true on the parent page state', () => {
    const app = new Application();
    const page = {
      state: {
        disableDoneButton: false,
        selectedStatus: 'test',
      },
      parent: {
        state: {
          disableDoneButton: false,
          appVar: app,
        },
      },
    };
    const dialog = new RejectController(page, app);
    dialog.dialogInitialized(page);
    dialog.dialogOpened();
    expect(page.parent.state.disableDoneButton).toBe(true);

    expect(page.state.disableDoneButton).toBe(true);
    expect(page.state.selectedStatus).toBe('');
    expect(page.parent.state.appVar).toBeUndefined();
  });


  it('should force reload the woDetailResource datasource', async () => {
    const app = {
      findDatasource: jest.fn(() => ({
        forceReload: jest.fn(),
      })),
    };
    const page = {
      parent: {
        state: {
          disableDoneButton: false,
          appVar: app
        },
      },
      state: {
        disableDoneButton: false,
        selectedStatus: 'test',
      },
    };
    const dialog = new RejectController(page, app);
    dialog.dialogInitialized(page);
    dialog.dialogOpened();
    expect(app.findDatasource).toHaveBeenCalledWith('woDetailResource');
  });
});

// Assisted by WCA for GP. Latest GenAI contribution: Version 1, granite-20B-code-instruct-v1 model
/**
 * Tests for the rejectStatus method in the Dialog class.
 */
describe('rejectStatus', () => {
  it('should set the loading status to false', async () => {
    const app = {
      state: {
        isRejected: false
      },
      registerDatasource: jest.fn(),
      setCurrentPage: jest.fn(),
      toast: jest.fn(),
      findPage: jest.fn(),
      findDatasource: jest.fn(() => ({
        forceReload: jest.fn(() => workorderitem),
        getChildDatasource: jest.fn(() => ({
          load: jest.fn(() => workorderitem),
          save: jest.fn(),
        })),
        item: workorderitem.member[0],
      })),
      getLocalizedLabel: jest.fn(() => 'Rejected'),
      currentPage:{
        name: 'Reject'
      }
    };
    const mockDS = {'test': jest.fn(() => ({
        forceReload: jest.fn(),
    }))};
    const page = {
      parent: {
        name: 'schedule',
        state: {
          loadingstatus: true,
          appVar: app,
          selectedDS: 'test'
        },
        datasources: [
          mockDS
        ],
        findDatasource: jest.fn(() => ({
        forceReload: jest.fn(() => workorderitem),
        getChildDatasource: jest.fn(() => ({
          load: jest.fn(() => workorderitem),
          save: jest.fn(),
        })),
        item: workorderitem.member[0],
      })),
        callController: jest.fn(),
        findDialog: jest.fn(() => ({
          closeDialog: jest.fn(),
        }))
      },
      state: {
        disableDoneButton: false,
        selectedStatus: 'test'
      },
    };
    const mockSynonymData = {
      value: 'REJECTED',
      valueid: 'ASSTAT|REJECTED',
      maxvalue: 'REJECTED',
      description: 'Rejected'
    };

    const synonymdomainDs = newSynonymDatasource(statusitem, 'synonymdomainData');
    synonymdomainDs.initializeQbe = jest.fn();
    app.registerDatasource(synonymdomainDs);
    jest.spyOn(SynonymUtil, 'getSynonym').mockResolvedValue(mockSynonymData);
    const dialog = new RejectController(page, app);
    dialog.dialogInitialized(page);
    expect(page.parent.state.loadingstatus).toBe(true);
    await dialog.rejectStatus();
    expect(page.parent.state.loadingstatus).toBe(false);
    expect(page.parent.findDialog).toHaveBeenCalledWith(page.parent.state.statusDialog);
  });

});

// Assisted by WCA for GP. Latest GenAI contribution: Version 1, granite-20B-code-instruct-v1 model
/**
 * Tests for the selectStatus method in the Dialog class.
 */
describe('selectStatus', () => {
  it('should set the disableDoneButton property of the page state to false', () => {
    const page = {
      parent: {
        state: {
          disableDoneButton: true,
        },
        datasources: {
          rejectList: {
            state: {
              selection: {
                count: 1,
              },
            },
          },
        },
      },
      state: {
        disableDoneButton: true,
      },
    };
    const app = {};
    const dialog = new RejectController(page, app);
    dialog.dialogInitialized(page);
    const item = {};
    dialog.selectStatus(item);
    expect(page.state.disableDoneButton).toBe(false);
    expect(page.parent.state.disableDoneButton).toBe(false);
    expect(page.state.selectedStatus).toBe(item);
  });

  it('should set the disableDoneButton property of the parent page state to false if there are selected items in the reject list', () => {
    const page = {
      parent: {
        datasources: {
          rejectList: {
            state: {
              selection: {
                count: 1,
              },
            },
          },
        },
        state: {
          disableDoneButton: true,
        },
      },
      state: {
        disableDoneButton: true,
      },
    };
    const app = {};
    const dialog = new RejectController(page, app);
    dialog.dialogInitialized(page);
    dialog.selectStatus({});
    expect(page.parent.state.disableDoneButton).toBe(false);
  });

  it('should set the disableDoneButton property of the parent page state to true if there are no selected items in the reject list', () => {
    const page = {
      parent: {
        datasources: {
          rejectList: {
            state: {
              selection: {
                count: 0,
              },
            },
          },
        },
        state: {
          disableDoneButton: false,
        },
      },
      state: {
        disableDoneButton: true,
      },
    };
    const app = {};
    const dialog = new RejectController(page, app);
    dialog.dialogInitialized(page);
    dialog.selectStatus({});
    expect(page.parent.state.disableDoneButton).toBe(true);
  });
});
