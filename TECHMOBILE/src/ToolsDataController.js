/*
 * Licensed Materials - Property of IBM
 *
 * 5724-U18, 5737-M66
 *
 * (C) Copyright IBM Corp. 2025 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */

class ToolsDataController {

  /**
   * Called only once in the lifetime of the datasource.
   * 
   * @param {import('@maximo/maximo-js-api').Datasource} datasource  Datasource instance.
   * @param {import('@maximo/maximo-js-api').Page} owner - Owner of the datasource.  Usually the Page or Application.
   * @param {import('@maximo/maximo-js-api').Application} app - Application instance.
   */
  onDatasourceInitialized(owner, app) {
    this.owner = owner;
    this.app = app;
  }

  // Assisted by watsonx Code Assistant 
  /**
 * Computes a unique identifier for an item based on its properties.
 *
 * @param {Object} item - The item object containing itemnum and description properties.
 * @returns {string|null} The computed item number, or null if the item object is invalid.
 */
  computedItemNum(item) {
    return item ? (item.itemnum && item.description ? item.itemnum + ' ' + item.description : item.itemnum || item.description || null) : null;
  }
}

export default ToolsDataController;
