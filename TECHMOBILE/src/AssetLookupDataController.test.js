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

import AssetLookupDataController from "./AssetLookupDataController.js";
import {
  Application,
} from "@maximo/maximo-js-api";

// Assisted by watsonx Code Assistant 
describe('computedAssetDesc', () => {
  it('should return the asset number and description', async () => {
    const controller = new AssetLookupDataController();
    const app = new Application();
    app.registerController(controller);
    await app.initialize();

    const item = {
      assetnum: '12345',
      description: 'Sample Asset'
    };
    const result = controller.computedAssetDesc(item);
    expect(result).toBe('12345 Sample Asset');
  });
});
