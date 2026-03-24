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

import ToolsDataController from './ToolsDataController';
import tools from './test/tools-json-data';
import { Application, Datasource, JSONDataAdapter, Page } from '@maximo/maximo-js-api';

function newDatasource(data = tools, name = 'selectedDatasource', field = 'member') {
  const da = new JSONDataAdapter({
    src: data,
    items: field,
  });
  const ds = new Datasource(da, {
    idAttribute: 'tooltransid',
    name: name,
  });
  return ds;
}

it('computedItemNum returns right', async () => {
  const controller = new ToolsDataController();
  const app = new Application();
  const page = new Page({
    name: 'reportTools'
  });

  app.client = {
    userInfo: {
      personId: 'WILSON',
      labor: {
        laborcode: 'WILSON'
      }
    }
  };

  const ds = newDatasource(tools, 'woIssuedToolDS');
  page.registerDatasource(ds);

  await app.initialize();
  controller.onDatasourceInitialized(ds, '', app);

  let title = controller.computedItemNum({
    itemnum: 'LATHE',
    description: 'Machine tool lathe'
  });
  expect(title).toBe('LATHE Machine tool lathe');

  title = controller.computedItemNum({
    itemnum: 'LATHE'
  });
  expect(title).toBe('LATHE');

  title = controller.computedItemNum({
    description: 'Machine tool lathe'
  });
  expect(title).toBe('Machine tool lathe');

  title = controller.computedItemNum();
  expect(title).toBe(null);

  title = controller.computedItemNum({
    itemnum: '',
    description: ''
  });
  expect(title).toBe(null);
});
