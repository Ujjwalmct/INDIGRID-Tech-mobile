/*
 * Licensed Materials - Property of IBM
 *
 * 5737-M60, 5737-M66
 *
 * (C) Copyright IBM Corp. 2021,2023 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */

class ClassificationController {
  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  /**
   * This method is called when the datasource is initialized. It is passed the datasource object, the owning component, and the application instance.
   * @param {Object} ds - The datasource object.
   * @param {Object} owner - The owning component.
   * @param {Object} app - The application instance.
   */
  onDatasourceInitialized(ds, owner, app) {
    this.datasource = ds;
    this.owner = owner;
    this.app = app;
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  /**
   * @param {DataSource} dataSource - The data source object.
   * @param {Array<any>} items - An array of items loaded from the data source.
   */
  async onAfterLoadData(dataSource, items) {
    const totalCount = dataSource.dataAdapter.totalCount;

    // Initial page size is 1 so we get the totalCount
    // Now we reset and query the full set of classifications and exit
    // This will trigger onAfterLoadData() a second time
    // istanbul ignore else
    if (items.length < totalCount) {
      dataSource.reset({ ...dataSource.options.query, size: totalCount }, true);
      return; // exit after first load
    }
  }

}

export default ClassificationController;
