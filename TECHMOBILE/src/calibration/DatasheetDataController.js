/*
 * Licensed Materials - Property of IBM
 *
 * 5737-M60, 5737-M66
 *
 * (C) Copyright IBM Corp. 2021,2025 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */
import {log, Datasource, waitUtils} from "@maximo/maximo-js-api";
import DatasourceConstants from "./rules/constants/DatasourceConstants";
const TAG = 'DatasheetDataController';

class DatasheetDataController {

  onDatasourceInitialized(ds, owner, app) {
    this.datasource = ds;
    this.owner = owner;
    this.app = app;
    this.addChildDatasourceExtensions();
    this.datasheetChildrenLoading = false;
    this.assetFunctionCount = 0;
    this.datasource.assetFunctionDatasources = {};
    this.datasource.calibrationPointDatasources = {};
  }


  /*
   * Extend datasource with methods that wait for all child datasources to load
   */
  addChildDatasourceExtensions() {
    Datasource.prototype.loadAndWaitForChildren
      = (query, timeout) => this.loadAndWaitForChildren(query, timeout);
    Datasource.prototype.forceReloadAndWaitForChildren
      = (timeout) => this.forceReloadAndWaitForChildren(timeout);
    Datasource.prototype.waitForChildrenToLoad
      = (timeout) => this.waitForChildrenToLoad(timeout);
  }

  
  /*
   * Initialise some custom variables related to child datasources
   */
  initialiseChildDatasources() {
    this.datasheetChildrenLoading = true;
    this.assetFunctionCount = 0;
    this.selectedDatasheetIndex = this.app.state.selectedDatasheetIndex ?? 0;
    this.selectedAssetFunctionsIndex = this.app.state.selectedAssetFunctionsIndex ?? 0;
    this.datasource.assetFunctionDatasources = {};
    this.datasource.calibrationPointDatasources = {};
  }


  /*
   * Call datasource.load() and wait for children to complete loading
   * Time out after 5 seconds by default
   * If nothing has changed onAfterLoadData won't trigger and we'll exit quickly
   */
  async loadAndWaitForChildren(query = {}, timeout = 5000) {
    log.i(TAG,'Loading ' + this.datasource.name + ' and waiting for children.');
    this.datasheetChildrenLoading = false;
    await this.datasource.load(query);
    await this.waitForChildrenToLoad(timeout);
    log.i(TAG,this.datasource.name + ' fully loaded');
  }


  /*
   * Call datasource.forceReload() and wait for children to complete loading
   * Time out after 5 seconds by default
   */
  async forceReloadAndWaitForChildren(timeout = 5000) {
    log.i(TAG,'Force reloading ' + this.datasource.name);
    this.datasheetChildrenLoading = false;
    await this.datasource.forceReload(); // should trigger onAfterLoadData
    await this.waitForChildrenToLoad(timeout);
    log.i(TAG,this.datasource.name + ' fully loaded');
  }


  /*
   * Wait for condition that indicates child datasources have completed loading
   * Time out after 5 seconds by default
   * If nothing has changed onAfterDataLoad won't trigger and we'll exit quickly
   */
  async waitForChildrenToLoad(timeout = 5000) {
    log.i(TAG,'Waiting for child datasources to complete loading.');
    await this.waitForCondition(() => !this.datasheetChildrenLoading, timeout);
    log.i(TAG,'Child datasources fully loaded');
  }


  async waitForCondition(condition, timeoutMs) {
     try {
        await waitUtils.waitForCondition(condition, timeoutMs);
     } catch (e) /* istanbul ignore next */ {
        log.i(TAG, e);
     }
  }
  
  
  // Select active datasheet on reload if there was one
  setActiveDatasheet(dataSource) {
    // istanbul ignore else
    if (this.selectedDatasheetIndex >= 0 && 
         this.selectedDatasheetIndex < dataSource.items.length) {
      dataSource.get(this.selectedDatasheetIndex, true);
    }
  }


  async onAfterLoadData(dataSource, items) {
    // istanbul ignore else
    if (items && dataSource.name === 'pluscWoDs') {
      log.i(TAG,'Creating child asset function datasources.');
      this.initialiseChildDatasources();
      this.setActiveDatasheet(dataSource);
      this.createAssetFunctionDatasources(dataSource, items);
    } else if (
      items &&
      dataSource?.options?.datasourceType === 'CHILD' &&
      dataSource.name.includes('pluscWoDs.pluscwodsinstr') &&
      dataSource.parent.options.datasourceType !== 'CHILD'
    ) {
      log.i(TAG,'Creating child point datasources for asset function ds: ' + dataSource.name);
      const activeAssetFunction = dataSource.name === this.app.state.assetFunctionsDetailsDS?.name;
      this.createCalpointDatasources(dataSource, items, activeAssetFunction);
    }
  }


  async createAssetFunctionDatasources(dataSource, items) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      // istanbul ignore else
      if (item.pluscwodsinstr && Array.isArray(item.pluscwodsinstr)) {
        this.assetFunctionCount += item.pluscwodsinstr.length;
      }
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await this.createAssetFunctionDatasource(
        dataSource, 
        item, 
        i===this.selectedDatasheetIndex
      );
    }
  }


  /*
   */
  async createAssetFunctionDatasource(dataSource, item, activeDatasheet) {
    const assetfunctionds = await dataSource.getChildDatasource(
      "pluscwodsinstr",
      item,
      DatasourceConstants.ASSET_FUNCTION_CHILD_OPTIONS
    );
    // istanbul ignore else
    if (assetfunctionds) {
      this.datasource.assetFunctionDatasources[item.pluscwodsid] = assetfunctionds;
      // If this is the active datasheet initialise the active asset function
      // istanbul ignore else
      if (activeDatasheet) {
        this.app.state.assetFunctionsDetailsDS = assetfunctionds;
      }
      dataSource.setPreserveChildren(true);
      await assetfunctionds.load();
      log.i(TAG,'Asset function datasource name: ' + assetfunctionds.name);
      log.i(TAG,'Asset function item count: ' + assetfunctionds.items.length);
      // istanbul ignore else
      if (activeDatasheet && 
          this.selectedAssetFunctionsIndex >= 0 && 
          this.selectedAssetFunctionsIndex < assetfunctionds.items.length) {
        assetfunctionds.get(this.selectedAssetFunctionsIndex, true);
      }
    }
  }


  async createCalpointDatasources(dataSource, items, activeAssetFunction) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const activeCalpointDS = activeAssetFunction && i === this.selectedAssetFunctionsIndex;
      await this.createCalpointDatasource(dataSource, item, activeCalpointDS);
      if (--this.assetFunctionCount <= 0) {
        this.datasheetChildrenLoading = false;
        log.i(TAG,'Last calibration point datasource loaded.');
      }
    }
  }

  /*
   */
  async createCalpointDatasource(dataSource, item, activeCalpointDS) {
     const calpointsds = await dataSource.getChildDatasource(
       "pluscwodspoint",
       item,
       DatasourceConstants.CALIBRATION_POINT_CHILD_OPTIONS
     );
    // istanbul ignore else
    if (calpointsds) {
      this.datasource.calibrationPointDatasources[item.pluscwodsinstrid] = calpointsds;
      // If the parent ds is the active asset function set the active point datasource
      // istanbul ignore else
      if (activeCalpointDS) {
        this.app.state.calpointsds = calpointsds;
      }
      dataSource.setPreserveChildren(true);
      await calpointsds.load();
      log.i(TAG,'Calibration point datasource name: ' + calpointsds.name);
      log.i(TAG,'Calibration point item count: ' + calpointsds.items.length);
    }
  }

};

export default DatasheetDataController;
