/*
 * Licensed Materials - Property of IBM
 *
 * 5724-U18, 5737-M66
 *
 * (C) Copyright IBM Corp. 2022,2023 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */

/** Constants */
import DatasheetConstants from "./rules/constants/DatasheetConstants";
import CalibrationPointConstants from "./rules/constants/CalibrationPointConstants";
import DatasourceConstants from "./rules/constants/DatasourceConstants";

/** Utils */
import SynonymDomain from "./rules/models/SynonymDomain";

/** Log */
import { log } from "@maximo/maximo-js-api";
import CalibrationHelper from "./utils/CalibrationHelper";

const TAG = "DataSheetListController";

/**
 * DataSheetListController
 *
 * @typedef {import('@maximo/maximo-js-api').Page} Page
 * @typedef {import('@maximo/maximo-js-api').Application} Application
 * @typedef {import('@maximo/maximo-js-api').Datasource} Datasource
 */
class DataSheetListController {
  pageInitialized(page, app) {
    log.t(TAG, "Page Initialized");
    this.app = app;
    this.page = page;
  }

  async pageResumed(page, app) {
    // States
    app.state.dataSheetTitle = app.state.datasheetName;
    page.state.autoupdate = CalibrationHelper.getAutoUpdate();

    // Load work order calibration details
    await this.loadWoDetailCalibration(app, page);
  }

  /**
   * Load Work Order, Datasheet, Asset Function and Calibration Points.
   * @param {Application} app - Graphite App reference.
   * @param {Page} page - Graphite Page reference.
   * @returns {undefined}
   */
  async loadWoDetailCalibration(app, page) {
    // Start loading
    page.state.loading = true;
    // load of woDetailCalibration is controlled by this variable
    app.state.canLoadCalibrationData = true;
    const href = app.state.dataSheethref;

    // Datasources
    const workorderDS = app.findDatasource("woDetailCalibration");
    const datasheetDS = app.findDatasource("pluscWoDs");
    datasheetDS.clearQBE();
    datasheetDS.lastQuery = {};

    // Load work order details
    await workorderDS.load({
      itemUrl: href
    });
    
    // Load datasheet list
    // We set 'notify-when-parent-loads' to false so we 
    // determine when datasheet loads happen
    // Force reload only if coming from the workorder detail page
    if (app.lastPage?.name !== 'workOrderDetails') {
      await datasheetDS.loadAndWaitForChildren();
    } else {
      await datasheetDS.forceReloadAndWaitForChildren();
    }

    if (page.params.assetnum && page.params.isLoop) {
      datasheetDS.clearQBE();
      datasheetDS.setQBE("assetnum", page.params.assetnum);
      await datasheetDS.searchQBE(undefined, true);
  }
    // Complete loading
    page.state.loading = false;

    return true;
  }

  goBack() {    
    if(this.page.params.isLoop) {
      this.app.setCurrentPage({
        name: "loopassetlist",
        resetScroll: true,
        params: {
          location: this.page.params.location,
          href: this.app.state.dataSheethref,
        },
      });
    } else {
      this.app.setCurrentPage({
        name: "workOrderDetails",
        resetScroll: true,
        params: {
          wonum: this.app.state.datasheetWonum,
          href: this.app.state.dataSheethref,
          siteid: this.app.state.datasheetSiteid,
        },
      });
    }
  }

  /**
   * Function to handle the click in the Data Sheet List
   * @param {*} item
   */
  async openAssetFunctions(context) {
    context.page.state.loading = true;

    const ds = context.app.findDatasource("pluscWoDs");

    const index = ds.items.findIndex(
      (datasheet) => datasheet.pluscwodsid === Number(context.item.pluscwodsid)
    );
    ds.get(index, CalibrationPointConstants.SET_AS_CURRENT);
    this.app.state.selectedDatasheetIndex = index;

    await this.loadAssetFunctionsDS(context, ds);

    context.page.state.loading = false;
  }

  async loadAssetFunctionsDS(context, datasource) {
    const { app, item } = context;
    const pluscwodsid = item.pluscwodsid;

    // istanbul ignore else
    if (pluscwodsid in datasource.assetFunctionDatasources) {
      app.state.assetFunctionsDetailsDS 
        = datasource.assetFunctionDatasources[item.pluscwodsid];
  
      app.setCurrentPage({
        name: "assetfunctions",
        resetScroll: true,
        params: {
          isLoop: this.page.params.isLoop,
          location: this.page.params.location,
          assetfunctiontitle: `${item.dsplannum} ${item.description}`,
          assetrevisionnum: `${item.revisionnum}`,
          wodsnum: item.wodsnum,
        },
      });
    }
    return;
  }

  /**
   * Open change status sliding-drawer component and let the user
   * choose the value for the asset function.
   *
   * @param {Event} event
   * @returns void
   */
  async openChangeStatus(event) {
    const { item: datasheet, app, page, changeText: field } = event;

    /**
     * Determine whether datasheet status can be manually updated
     * or should be calculated in calibration handler
     * @type {Boolean}
     */
    const autoupdate = CalibrationHelper.getAutoUpdate();

    /**
     * Fetch current status; 'changeText' tells which attribute to check.
     * This assignment might affect one of these attributes:
     * @access datasheet.asfoundcalstatus
     * @access datasheet.asleftcalstatus
     * @type {String}
     */
    const status = datasheet[field];

    // Load datasources
    const synonymDS = app.findDatasource("synonymdomainData");
    const statusListDS = app.findDatasource("changeStatusList");
    const domainCalStatusDs = app.findDatasource("domaincalstatusds");

    // Synonym handler
    const synonymHandler = new SynonymDomain(synonymDS, statusListDS);
    const status_maxvalue = SynonymDomain.resolveToInternal(domainCalStatusDs, status);

    // Change state
    page.state.changeText = event?.changeText;
    page.state.currentItem = event?.item;

    // If autoupdate option is set to false, then status won't
    // be calculated by calibration point handler and the user
    // can set any status he wishes.
    if (!autoupdate) {
      await synonymHandler.showAllStatus();
      page.showDialog("dataSheetStatusDialog");
      return;
    }

    // Datasheet status should be calculated by calibration point handler
    // and cannot be changed manually, except if it is empty
    // (see first case below).
    // istanbul ignore else
    if (autoupdate) {
      // Check if status has been previously calculated.
      // If so, user cannot change it to Broken/Missing,
      // but if the status was set to Missing/Broken,
      // user may be able to change it.
      if (
        status_maxvalue &&
        ![
          DatasheetConstants.STATUS_BROKEN,
          DatasheetConstants.STATUS_MISSING,
        ].includes(status_maxvalue)
      ) {
        log.d(
          TAG,
          "User cannot change status that is neither Broken nor Missing."
        );
        return;

        // Can be marked as BROKEN or MISSING manually by user
      } else {
        log.d(TAG, "Can be updated manually by user.");
        await synonymHandler.showFilteredStatus();
        page.showDialog("dataSheetStatusDialog");
      }
    }
  }

  async selectStatus(itemSelected) {
    // Select the new calibration status
    this.page.state.selectedStatus = itemSelected.value;
    const changeText = this.page.state.changeText;
    let updateValue = this.page.state.currentItem;
    let pluscWoDs = this.app.findDatasource("pluscWoDs");

    updateValue[changeText] = itemSelected.value;

    pluscWoDs.items.push(updateValue);
    if (!itemSelected._selected) {
      this.page.state.selectedStatus = "";
    }
    await this.changeStatus();
  }

  /***
   * saving data
   */
  async changeStatus() {
    const selectedStatus = this.page.state.selectedStatus;
    const pluscWoDs = this.app.findDatasource("pluscWoDs");

    //istanbul ignore else
    if (selectedStatus) {
      await pluscWoDs.save(DatasourceConstants.CALIBRATION_SAVE_OPTIONS);
    }
    const dataSheetStatusDialog = this.page.findDialog("dataSheetStatusDialog");
    if (dataSheetStatusDialog) {
      await dataSheetStatusDialog.closeDialog();
    }
  }

  returnInternalStatusValue(status) {
    const domainCalStatusDS = this.app.findDatasource("domaincalstatusds");
    return SynonymDomain.resolveToInternal(domainCalStatusDS, status);
  }

  getLabelColorForInternalStatusValue(status) {
    const status_maxvalue = this.returnInternalStatusValue(status);
    return status_maxvalue === 'PASS' ? 'green' : status_maxvalue === 'FAIL' ? 'red' : 'gray';
  }
}

export default DataSheetListController;
