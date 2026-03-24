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

import {Device, log} from '@maximo/maximo-js-api';
import WOTimerUtil from './utils/WOTimerUtil';
import SynonymUtil from './utils/SynonymUtil';
import CommonUtil from './utils/CommonUtil';
import WOUtil from './utils/WOUtil';
const TAG = 'ReportWorkPageController';

class ReportWorkPageController {
  pageInitialized(page, app) {
    this.app = app;
    this.page = page;
    this.incomingContextLoaded = false;
  }

  /*
 * Method to resume the page
 */
  //istanbul ignore next
  async pageResumed() {
    this.page.state.selectedLabors = new Map();
    this.app.callController('resetSkipState');
    this.page.state.pageTitle = this.app.callController('updatePageTitle', {page: this.page, label: 'report_work_title', labelValue: 'Report work'});
    this.page.state.fieldChangedManually = false;
    this.page.state.showRemoveTool = false;
    this.page.state.showToolDetails = false;
    this.page.dsFailureList = this.app.findDatasource('dsFailureList');
    this.page.state.hideCompAssignment = true;

    this.page.state.enforceAssetScan = this.app.checkSigOption(`${this.app.state.woOSName}.ENFORCEASSETSCAN`);

    // istanbul ignore else
    if (!this.incomingContextLoaded && !this.page.params.stopResumeLoadData) {
      await this.loadRecord();
      this.showCompAssignment();
    }

    this.page.state.openedFrom = '';
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Asynchronously shows the component assignment.
   * * @returns {Promise<void>}
   */
  async showCompAssignment() {
    const woDetailDs = this.app.findDatasource("woDetailds");
    //istanbul ignore else
    if (Device.get().isMaximoMobile) {
      //istanbul ignore else
      if (!this.page?.params?.href && !this.page?.params?.itemhref) {
        log.d(TAG, 'this.page.params has no href or itemhref to load');
        this.app.state.canLoadWoDetailDS = false;
      }
      await woDetailDs?.load({ noCache: true, itemUrl: this.page.params.itemhref || this.page.params.href });
      this.app.state.canLoadWoDetailDS = true;
    }
    let records = woDetailDs?.item?.assignment;
    const index = records?.findIndex(assignment => (assignment.laborcode === this.app.client?.userInfo?.labor?.laborcode && assignment.status_maxvalue === 'ASSIGNED' && assignment.assignmentid));
    const hiddenTypeMaxValue = ["WAPPR", "CAN", "CLOSE", "COMP"].includes(woDetailDs?.item?.status_maxvalue);
    this.page.state.hideCompAssignment = hiddenTypeMaxValue || index < 0 || !woDetailDs?.item?.assignment;
  }

  //istanbul ignore next
  pagePaused(page) {
    page.state.causeValue = "";
    page.state.remedyValue = "";
    page.state.problemValue = "";
    page.state.failureClassValue = "";
    // Lookup Close while going away from page
    page.findDialog('calibrationToolRotatingAssetLookup')?.closeDialog();
    page.findDialog('toolRotatingAssetLookup')?.closeDialog();
    page.findDialog('toolLookup')?.closeDialog();
    page.findDialog('rotatingAssetLookup')?.closeDialog();
    page.findDialog('technicianLookup')?.closeDialog();

    // Drawer Close while going away from page
    page.findDialog('calibrationToolsDrawer')?.closeDialog();
    page.findDialog('toolsDrawer')?.closeDialog();
    page.findDialog('toolsDueDateError')?.closeDialog();
    page.findDialog('qualificationError')?.closeDialog();
    page.findDialog('qualificationWarning')?.closeDialog();
    page.findDialog('toolsDetailsDrawer')?.closeDialog();
 }

 /**
  * reset qbe filter on woPlanTaskDetailds as
  * purpose of reusing same datasource in report page is achieved
  */
 async resetTaskDS() {
    const taskDS = await this.app.findDatasource('woPlanTaskDetailds');
    await taskDS.initializeQbe();
    taskDS.clearQBE();
    await taskDS.searchQBE(undefined, true);
 }


  /**
   * Apply schema to child related datasource.
   * 
   * @param {*} childDatasource - Child Datasource referenced via a relationship.
   */
  /* istanbul ignore next */
  updateSchema(childDatasource) {
    if (childDatasource.options?.query?.relationship) {

      childDatasource.schema = childDatasource.dependsOn.schema.properties[Object.entries(childDatasource.dependsOn.schema.properties)
        .filter(
          item =>
            item[1].relation &&
            item[1].relation.toUpperCase() ===
            childDatasource.options.query.relationship.toUpperCase()
        )
        .map(obj => obj[0])[0]].items;
    }
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  /**
  * Deletes the timer entry from the database.
  */
  onDeleteEntry() {
    WOTimerUtil.deleteTimerEntry(this.app, this.page);
  }

  /**
   * Function to load report work datasource.
   */
  async loadRecord() {
    let defOrg = this.app.client?.userInfo?.insertOrg;
    let defSite = this.app.client?.userInfo?.insertSite;
    //clear existing data from datasource in order to prepare for new set of data
    this.page.findDatasource('reportworkLaborDetailds')?.clearState();
    this.page.state.causeValue = "";
    this.page.state.remedyValue = "";
    this.page.state.failureEdit = true; //DT261473
    this.page.state.editWo = false;

    let datasource = this.page.findDatasource("woDetailsReportWork");

    //istanbul ignore if
    if (this.app.lastPage?.name === 'sparePart') {
      await Promise.all([datasource?.forceReload(),
      this.app.findDatasource('reportWorkActualMaterialDs')?.forceReload()])
    }
    // istanbul ignore else
    if (!this.page?.params?.href && !this.page?.params?.itemhref) {
      log.d(TAG, 'this.page.params has no href or itemhref to load');
      this.page.state.canLoadWoDetailsReportWork = false;
    }
    this.page.state.canLoadReportWorkActualToolsDetailDs = false;
    datasource?.clearState();
    datasource?.resetState();
    let response = await datasource?.load({ noCache: true, itemUrl: this.page.params.itemhref || this.page.params.href });
    this.page.state.canLoadReportWorkActualToolsDetailDs = true;
    this.page.state.canLoadWoDetailsReportWork = true;
    if(!datasource?.item) {
      return;
    }
    let wonum = datasource.item.wonum;
    this.page.state.wonum = datasource.item.wonum;
    this.page.state.apprIntLabTrans = parseInt(datasource?.item?.lr_appr_in_labor);
    this.page.state.apprExtLabTrans = parseInt(datasource?.item?.lr_appr_out_labor);
    this.page.state.editWo = !['CAN'].includes(datasource?.item?.status_maxvalue);
    this.page.state.showToolDetails = this.isCalibrationWo();
    const maxVars = CommonUtil.filterMobileMaxvars('PLUSCAPPRTOOLS', this.app.findDatasource('defaultSetDs'));
    // istanbul ignore if
    if ( this.page.state.showToolDetails && maxVars[0]?.varvalue === '0') {
      this.page.state.showRemoveTool = true;
    }
    // istanbul ignore next
    if (!this.page.state.reportWorkPrompt) {
      this.page.state.reportWorkPrompt = {};
    }
    this.page.state.useConfirmDialog = false;
    this.page.state.reportWorkPrompt[wonum] = false;
    let statusComp = CommonUtil.getSystemProp(this.app, 'maximo.mobile.completestatus');
    this.page.state.compDomainStatus = statusComp + new Date().getTime();
    // istanbul ignore next
    this.page.state.enableSignatureButton = await CommonUtil.checkSysPropArrExist(this.app, 'maximo.mobile.statusforphysicalsignature', statusComp);
    // istanbul ignore if
    if (this.app.state.incomingContext && !this.incomingContextLoaded) {
      this.incomingContextLoaded = true;
      if (datasource.items.length === 0) {
        //force-sync load from server
        response = await datasource.load({noCache: true, forceSync: true, itemUrl: this.page.params.itemhref || this.page.params.href});
        //if still not found on server then throw message
        if (datasource.items.length === 0) {
          this.page.state.loading = false;
          let errorMessage = 'This record is not on your device. Try again or wait until you are online.';
          this.page.error(
            this.app.getLocalizedLabel("record_not_on_device", errorMessage)
          );
          return;
        }
      }
    }

    // Validate Task Completion Status
    const reportWorkData = datasource.item;
    // istanbul ignore else
    if (reportWorkData?.flowcontrolled && reportWorkData?.iscalibration && reportWorkData?.pluscwodscount && this.app.name !== "supmobile") {
      this.page.state.taskInComplete = this.app.state.taskCount > 0;
    } else if (reportWorkData?.flowcontrolled && (!reportWorkData?.iscalibration || !reportWorkData?.pluscwodscount)) {
      this.page.state.taskInComplete = true;
    } else {
      this.page.state.taskInComplete = false;
    }

    await this.setFailureReportData(response);

    await this.openCraftSkillLookup({page: this.page, app: this.app, openLookup: false});
    let reportWorkSynonymDomainDS = this.page.findDatasource('reportworksSynonymData');
    if(!reportWorkSynonymDomainDS) {
      return;
    }
    await reportWorkSynonymDomainDS.initializeQbe();
    reportWorkSynonymDomainDS.clearQBE();
    reportWorkSynonymDomainDS.setQBE('domainid', '=', 'LTTYPE');
    reportWorkSynonymDomainDS.setQBE('maxvalue', '=', 'WORK');
    reportWorkSynonymDomainDS.setQBE('orgid', '=', defOrg);
    reportWorkSynonymDomainDS.setQBE('siteid', '=', defSite);
    
    let filteredDomainValues = await reportWorkSynonymDomainDS.searchQBE();
    // istanbul ignore next
    if (filteredDomainValues && filteredDomainValues.length < 1) {
      reportWorkSynonymDomainDS.clearQBE();
      reportWorkSynonymDomainDS.setQBE('domainid', '=', 'LTTYPE');
      reportWorkSynonymDomainDS.setQBE('maxvalue', '=', 'WORK');
      reportWorkSynonymDomainDS.setQBE('orgid', '=', defOrg);
      reportWorkSynonymDomainDS.setQBE('siteid', '=', 'null');
      filteredDomainValues = await reportWorkSynonymDomainDS.searchQBE();

      // istanbul ignore next
      if (filteredDomainValues && filteredDomainValues.length < 1) {
        reportWorkSynonymDomainDS.clearQBE();
        reportWorkSynonymDomainDS.setQBE('domainid', '=', 'LTTYPE');
        reportWorkSynonymDomainDS.setQBE('maxvalue', '=', 'WORK');
        reportWorkSynonymDomainDS.setQBE('orgid', '=', 'null');
        reportWorkSynonymDomainDS.setQBE('siteid', '=', 'null');
        await reportWorkSynonymDomainDS.searchQBE();
      }
    }
    await this.page.findDatasource('inventoryDS')?.load();
    await this.page.findDatasource('locationDS')?.load();

    // istanbul ignore else
    if (this.app.state.incomingContext?.itemnum && this.app.state.incomingContext?.itemsetid && this.app.state.incomingContext?.page === 'report_work') {
      this.setIncomingContext();
      this.page.state.pageTitle = this.app.callController('updatePageTitle', { page: this.page, label: 'report_work_title', labelValue: 'Report work' });
      this.page.dynamicPageTitleUpdate(this.page, this.page.state.pageTitle);
    }

  }

  /**
   * Filter the labor transactions on basis of laborcode only after ds loads
   */
  async onAfterLoadData(dataSource, items) {
    if (dataSource.name === 'reportworkLaborDetailds' && items.length) {
      const reportworkLaborDetailds = this.page.findDatasource("reportworkLaborDetailds");
      // istanbul ignore next
      if (!this.page.state.groupedByLabor) {
        // istanbul ignore next
        await reportworkLaborDetailds.initializeQbe();
        reportworkLaborDetailds.setQBE('laborcode', '=', this.app.client?.userInfo?.labor?.laborcode);
        await reportworkLaborDetailds.searchQBE();
      } else {
        let sortedReportWorkLabordsObjItemsArr = [];
          items.forEach((item) => {
            // istanbul ignore else
            if (item) {
              const laborcode = item.laborcode;
              // istanbul ignore else
              if (!this.checkLaborAlreadyExists(sortedReportWorkLabordsObjItemsArr, laborcode)) {
                //Fetch the transactions filtered by labor
                const filteredTransactions = items.filter((item => item?.laborcode && laborcode && item?.laborcode === laborcode));

                if (filteredTransactions.length) {
                  //Group the transactions on basis of labor
                  filteredTransactions.forEach((item) => {
                    const groupedByLabors = this.createGroupedLaborTransactions(item);
                    sortedReportWorkLabordsObjItemsArr.push({ ...groupedByLabors });
                  })
                }
              }
            }
          });

        //Pushed the transactions into JSON ds
        const jlabords = this.page.findDatasource('jreportworkLabords');
        this._resetDataSource(jlabords);
        await jlabords.load({src: sortedReportWorkLabordsObjItemsArr});
      }
    } else if (dataSource.name === 'reportworkLaborDetailds' && items.length === 0) {
      const jlabords = this.page.findDatasource('jreportworkLabords');
      this._resetDataSource(jlabords);
    }
  }

  /**
   * Reset DS and set src to load.
   */
  _resetDataSource(ds) {
    ds?.clearState();
    ds?.resetState();
  }

  /**
   * Group the transactions on basis of labor.
   */
  createGroupedLaborTransactions(laborItems) {
    const laborgroup = [];
    laborgroup.push(laborItems);
    let groupedItem = {
      labtransid: laborItems.labtransid,
      startdate: laborItems.startdate,
      starttime: laborItems.starttime,
      finishdate: laborItems.finishdate,
      finishtime: laborItems.finishtime,
      regularhrs: laborItems.regularhrs,
      transtype: laborItems.transtype,
      laborcode: laborItems.laborcode,
      anywhererefid: laborItems.anywhererefid,
      timerstatus: laborItems.timerstatus,
      displayname: laborItems.displayname || laborItems.laborcode,
      skilllevel: laborItems.skilllevel,
      vendor: laborItems.vendor,
      contractnum: laborItems.contractnum,
      groupedlabor: laborgroup,
      timerstatus_maxvalue: laborItems.timerstatus_maxvalue,
      transtype_description: laborItems.transtype_description,
      craft: laborItems.craft,
      //hideEditIcon : It will check edit icon will display or not. First it will check for the current labor transaction timer is active or not, if transaction is active it will set to true to hide pencil icon else it will check labor is external or internal and will check transaction is auto-approve for labor or not, if transaction will not approve for any labor it will set to false and pencil icon will be display.
      hideEditIcon: (laborItems.timerstatus_maxvalue === 'COMPLETE' || ! laborItems.timerstatus_maxvalue)  ? (laborItems.outside ? (this.page.state.apprExtLabTrans? true:false) : (this.page.state.apprIntLabTrans? true:false)) : true
    };

    return groupedItem;
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  /**
   * Checks if a labor code already exists in the report work labors array.
   * @param {Array} sortedReportWorkLabords - An array of report work labors.
   * @param {string} laborcode - The labor code to check for.
   * @returns {boolean} - A boolean indicating whether the labor code exists.
   */
  checkLaborAlreadyExists(sortedReportWorkLabords, laborcode) {
    let isExists = false;
    // istanbul ignore else
    if (sortedReportWorkLabords && sortedReportWorkLabords.length > 0) {
      isExists = sortedReportWorkLabords.some(item => laborcode === item.laborcode);
    }
    return isExists;
  }

  /**
   * Function to save material transactions
   */
  async saveMaterialTransaction() {
    this.resetTaskDS();
    this.page.state.useConfirmDialog = false;
    // istanbul ignore else
    if (this.page.state.isSavedMaterial && this.page.state.saveAction === true) {
      const matusetransDs = this.page.findDatasource('reportWorkActualMaterialDs');
      if (!matusetransDs.schema) {
        await matusetransDs.initializeQbe();
      }
      let matusetrans = {
        itemnum: matusetransDs.item.item_itemnum,
        storeloc: matusetransDs.item.storeloc,
        positivequantity: matusetransDs.item.positivequantity,
        binnum: matusetransDs.item.binnum,
        lotnum: matusetransDs.item.lotnum,
        conditioncode: matusetransDs.item.conditioncode,
        curbal: matusetransDs.item.curbal,
        issuetype: matusetransDs.item.transtype,
        rotassetnum: matusetransDs.item.assetnum,
        location: matusetransDs.item.location,
        locdesc: matusetransDs.item.storeloc_desc,
        description: matusetransDs.item.item_description,
        taskid: matusetransDs.item.task_id
      };
      // istanbul ignore next
      if (matusetrans.location && typeof matusetrans.location === 'object') {
        delete matusetrans.location;
        matusetrans.location = matusetransDs.item.location.location;
      }

      let option = {
        responseProperties: 'matusetransid, anywhererefid',
      };
      const onDataFailedHandler = this.onSaveDataFailed.bind(this)
      try {
        this.page.state.useConfirmDialog = false;
        this.page.state.loadingSaveMaterial = true;
        this.page.state.isSavedMaterial = false;
        this.saveDataSuccessful = true;
        matusetransDs.on('put-data-failed', onDataFailedHandler);
        await matusetransDs.put(matusetrans, option);
        this.page.findDialog('materialsDrawer').closeDialog();
        await this.page.findDatasource('reportWorkActualMaterialDs').forceReload();
      } finally {
        this.page.state.useConfirmDialog = false;
        this.page.state.isSavedMaterial = false;
        this.page.state.loadingSaveMaterial = false;
        this.saveDataSuccessful = true;
        matusetransDs.off('put-data-failed', onDataFailedHandler);
      }
    }
  }


  // Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-8b-code-instruct
/**
 * Opens the materials drawer dialog.
 * @param {object} evt - The event object.
 */
  async openMaterialsDrawer(evt) {
    this.page.state.callMethodAction = 'MATERIAL';
    this.app.state.pageLoading = true;
    let materialsTrans = this.page.findDatasource('reportWorkActualMaterialDs');
    await materialsTrans.clearWarnings(materialsTrans.item, 'item_itemnum');
    await materialsTrans.addNew();
    materialsTrans.item['item_description'] = '';
    materialsTrans.item['item_itemnum'] = '';
    materialsTrans.item['storeloc'] = '';
    materialsTrans.item['storeloc_desc'] = '';
    materialsTrans.item['binnum'] = '';
    materialsTrans.item["conditioncode"] = ''; 
    materialsTrans.item["lotnum"] = ''; 
    materialsTrans.item['transtype'] = '';
    materialsTrans.item['positivequantity'] = 1;
    materialsTrans.item['assetnum'] = '';
    materialsTrans.item['asset_description'] = '';
    materialsTrans.item['location'] = '';
    materialsTrans.item['task_description'] = '';
    materialsTrans.item['task_id'] = '';

    //reset items lookup datasource
    let itemsDS = this.app.findDatasource('itemsDS');
    itemsDS.clearState();
    itemsDS.load();

    //Fetch the tasks
    await this.getWoTasks();

    this.page.state.isSavedMaterial = true;
    this.page.state.saveAction = true;
    this.page.state.disableAction = true;
    this.page.state.itemnum = false;
    this.page.state.rotatingAsset = false;
    this.page.state.isRotating = false;
    let transTypeDs = await this.page.findDatasource('synonymDSData');
    // istanbul ignore next
    if (transTypeDs?.lastQuery?.qbe && JSON.stringify(transTypeDs?.lastQuery?.qbe) !== '{}') {
      transTypeDs.clearQBE();
      await transTypeDs.searchQBE(undefined, true);
    }
    // istanbul ignore next
    if (evt?.item?.locationnum) {
      materialsTrans.item['location'] = evt.item.locationnum;
    }
    let DSData = await SynonymUtil.getSynonymByOrg(transTypeDs,
      'ISSUETYP',
      ['ISSUE', 'RETURN'],
      evt.app.client.userInfo.defaultOrg);
    // istanbul ignore next
    if (DSData && transTypeDs && transTypeDs.items.length > 0) {
      let transType = transTypeDs.items.filter((item) => item.maxvalue === 'ISSUE');
      this.page.state.transactionType = transType[0].value;
    }
    this.page.showDialog('materialsDrawer');
    this.page.state.useConfirmDialog = false;
    this.app.state.pageLoading = false;
  }

  async openMaterialLookup(evt) {
    let itemsDS = await evt.page.findDatasource('itemsDS');
    let selectedItem;
    // istanbul ignore next
    itemsDS.items.forEach((item) => {
	    // istanbul ignore else
      if(item.itemnum === evt.page.datasources.reportWorkActualMaterialDs.item.item_itemnum) {
        selectedItem = item;
      }
    });
    // istanbul ignore next
    if (selectedItem) {
      itemsDS.setSelectedItem(selectedItem, true);
    } else {
			itemsDS.clearSelections();
		}
    evt.page.showDialog('materialLookup');
  }

  /**
   * Function to open the store room look
   */
  async openStoreRoomLookup(evt) {
    let locationDS = await evt.page.findDatasource('locationDS');
    let selectedItem;
    locationDS.items.forEach((item) => {
      // istanbul ignore else
      if (item.location === evt.page.datasources.reportWorkActualMaterialDs.item.storeloc) {
        selectedItem = item;
      }
    });
    // istanbul ignore next
    if (selectedItem) {
      locationDS.setSelectedItem(selectedItem, true);
    } else {
			locationDS.clearSelections();
		}
    evt.page.showDialog('storeRoomLookup');
  }


   // Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-8b-code-instruct
/**
 * Opens the bin lookup dialog for the selected item.
 * @param {object} evt - The event object.
 */
  async openBinLookup(evt) {
    let binNumberDS = await evt.page.findDatasource('inventbalDS');
    await binNumberDS.initializeQbe();
    binNumberDS.setQBE('siteid', '=', this.app.client.userInfo.defaultSite);
    binNumberDS.setQBE('itemnum', '=', this.page.state.itemnum);
    binNumberDS.setQBE('location', '=', this.page.state.storeloc);
     await binNumberDS.searchQBE();
    let selectedItem;
    binNumberDS.items.forEach((item) => {
      // istanbul ignore if
    if (item.binnum === evt.page.datasources.reportWorkActualMaterialDs.item.binnum) {
      selectedItem = item;
    }
  });
    // istanbul ignore next
    if (selectedItem) {
      binNumberDS.setSelectedItem(selectedItem, true);
    } else {
			binNumberDS.clearSelections();
		}
    evt.page.showDialog('binLookup');
  }

  async getRotatingAsset() {
    let rotatingAssetDS = this.page.findDatasource('rotatingAssetDS');
    let reportWorkActualMaterialDs = this.page.findDatasource('reportWorkActualMaterialDs');
    await rotatingAssetDS.initializeQbe();
    rotatingAssetDS.setQBE('itemnum', '=', this.page.state.itemnum);
    rotatingAssetDS.setQBE('location', '=', this.page.state.storeloc);
    rotatingAssetDS.setQBE('parent', '=null');
    let rotatingAsset = await rotatingAssetDS.searchQBE();
    this.page.state.rotatingAsset = false;
    // istanbul ignore next
    if (rotatingAsset && rotatingAsset.length === 1) {
      this.page.datasources.reportWorkActualMaterialDs.item.assetnum = rotatingAsset[0].assetnum;
      this.page.datasources.reportWorkActualMaterialDs.item.asset_description = rotatingAsset[0].description;
      this.page.state.rotatingAsset = true;
      this.page.state.multipleRotatingAsset = false;
      this.validateMaterial(this);
    } else if (rotatingAsset && rotatingAsset.length > 1) {
      reportWorkActualMaterialDs.item.assetnum = '';
      reportWorkActualMaterialDs.item.asset_description = '';
      this.page.state.rotatingAsset = true;
      this.page.state.multipleRotatingAsset = true;
      if (rotatingAsset.length > 1) this.openRotatingAssetLookup(this);
    } else {
      reportWorkActualMaterialDs.item.assetnum = '';
      reportWorkActualMaterialDs.item.asset_description = '';
      this.page.state.multipleRotatingAsset = false;
      this.validateMaterial(this);
    }
  }

  async openRotatingAssetLookup(evt) {
    let rotatingAssetDS = await evt.page.findDatasource('rotatingAssetDS');
    let selectedItem;
    // istanbul ignore next
    rotatingAssetDS.items.forEach((item) => {
      // istanbul ignore else
      if (item.assetnum === evt.page.datasources.reportWorkActualMaterialDs.item.assetnum) {
        selectedItem = item;
      }
    });
    // istanbul ignore next
    if (selectedItem) {
      rotatingAssetDS.setSelectedItem(selectedItem, true);
    } else {
			rotatingAssetDS.clearSelections();
		}
    evt.page.showDialog('rotatingAssetLookup');
  }

  /**
   * Function to open the transaction type lookup
   */
  async openTransactionTypeLookup(evt) {
    let transTypeDs = await evt.page.findDatasource('synonymDSData');
    let selectedItem;
    transTypeDs.items.forEach((item) => {
    // istanbul ignore else
    if (item.value === evt.page.findDatasource('reportWorkActualMaterialDs').item.transtype) {
      selectedItem = item;
    }
  });
    // istanbul ignore next
    if (selectedItem) {
      transTypeDs.setSelectedItem(selectedItem, true);
    } else {
			transTypeDs.clearSelections();
		}
    evt.page.showDialog('transactionTypeLookup');
  }

  /**
   * Function to set the store room when record is single
   */
  async setStoreRoom() {
    let inventoryDS = await this.page.findDatasource('inventoryDS');
    await inventoryDS.initializeQbe();
    inventoryDS.setQBE('itemnum', '=', this.page.state.itemnum);
    await inventoryDS.searchQBE();
    const inventoryList = [];
    inventoryDS.items.forEach((item) => {
      inventoryList.push(item.location);
    });
    // istanbul ignore next
    if (inventoryList.length > 0) {
      let locationDS = await this.page.findDatasource('locationDS');
      await locationDS.initializeQbe();
      locationDS.setQBE('location', 'in', inventoryList);
      let locationData = await locationDS.searchQBE();
      // istanbul ignore next
      if (locationData.length === 1) {
        this.page.datasources.reportWorkActualMaterialDs.item.storeloc_desc = locationData[0].description;
        this.page.datasources.reportWorkActualMaterialDs.item.storeloc = locationData[0].location;
        this.page.state.storeloc = locationData[0].location;
        this.page.state.multipleLocations = false;
        this.setBinNumber();
        this.validateMaterial(this);
      } else {
        this.page.datasources.reportWorkActualMaterialDs.item.storeloc_desc = '';
        this.page.datasources.reportWorkActualMaterialDs.item.storeloc = '';
        this.page.state.storeloc = '';
        this.page.datasources.reportWorkActualMaterialDs.item.binnum = '';
        this.page.datasources.reportWorkActualMaterialDs.item.curbal = '';
        this.page.datasources.reportWorkActualMaterialDs.item.conditioncode = "";
        this.page.datasources.reportWorkActualMaterialDs.item.lotnum = "";
        this.page.state.multipleLocations = true;
        this.openStoreRoomLookup(this);
      }
    }
  }

  /**
   * Function to set the bin number when record is single
   */
  async setBinNumber() {
    let binNumberDS = await this.page.findDatasource('inventbalDS');
    await binNumberDS.initializeQbe();
    binNumberDS.setQBE('siteid', '=', this.app.client.userInfo.defaultSite);
    binNumberDS.setQBE('itemnum', '=', this.page.state.itemnum);
    binNumberDS.setQBE('location', '=', this.page.state.storeloc);
    let binNumData = await binNumberDS.searchQBE();
    // istanbul ignore next
    if (binNumData.length === 1) {
      this.page.datasources.reportWorkActualMaterialDs.item.binnum = binNumData[0].binnum;
      this.page.datasources.reportWorkActualMaterialDs.item.curbal = binNumData[0].curbal;
      this.page.datasources.reportWorkActualMaterialDs.item.conditioncode = binNumData[0].conditioncode;
      this.page.datasources.reportWorkActualMaterialDs.item.lotnum = binNumData[0].lotnum;
      this.page.state.multipleBins = false;
      await this.getRotatingAsset();
      this.validateMaterial(this);
    } else if (binNumData.length > 1) {
      this.page.state.multipleBins = true;
      this.openBinLookup(this);
    }
  }


  // Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-8b-code-instruct
/**
 * Chooses a material for the report work material detail page.
 * @param {object} evt The event object containing the selected material's item number, description, and quantity.
 */
  async chooseMaterial(evt) {
    // istanbul ignore else
    if (evt) {
      this.page.datasources.reportWorkActualMaterialDs.item.item_itemnum = evt.itemnum;
      this.page.datasources.reportWorkActualMaterialDs.item.item_description = evt.description;
      this.page.datasources.reportWorkActualMaterialDs.item.positivequantity = 1;
      this.page.datasources.reportWorkActualMaterialDs.item.transtype = this.page.state.transactionType;
      this.page.state.itemnum = evt.itemnum;
      this.page.state.isRotating = evt.rotating;
      //DT240711 - Rotating asset does not display when adding rotating item
      this.page.datasources.reportWorkActualMaterialDs.item.assetnum = "";
      this.page.datasources.reportWorkActualMaterialDs.item.asset_description = "";
      this.page.datasources.reportWorkActualMaterialDs.item.binnum = "";
      this.page.datasources.reportWorkActualMaterialDs.item.curbal = "";
      this.page.datasources.reportWorkActualMaterialDs.item.conditioncode = "";
      this.page.datasources.reportWorkActualMaterialDs.item.lotnum = "";
      //END OF DT
      // istanbul ignore next
      await this.setStoreRoom();
      this.validateMaterial(this);
      this.page.state.useConfirmDialog = true;
    }
  }


  // Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-8b-code-instruct
/**
 * Chooses a store room for the work material detail form.
 * @param {object} evt - The event object containing the selected store room information.
 * @param {string} evt.description - The description of the selected store room.
 * @param {string} evt.location - The location of the selected store room.
 */
  async chooseStoreRoom(evt) {
    // istanbul ignore else
    if (evt) {
      this.page.datasources.reportWorkActualMaterialDs.item.storeloc_desc = evt.description;
      this.page.datasources.reportWorkActualMaterialDs.item.storeloc = evt.location;
      this.page.state.storeloc = evt.location;
      this.page.datasources.reportWorkActualMaterialDs.item.binnum = '';
      this.page.datasources.reportWorkActualMaterialDs.item.curbal = '';
      this.page.datasources.reportWorkActualMaterialDs.item.conditioncode = "";
      this.page.datasources.reportWorkActualMaterialDs.item.lotnum = "";
      //DT240711 - Rotating asset does not display when adding rotating item
      this.page.datasources.reportWorkActualMaterialDs.item.assetnum = "";
      this.page.datasources.reportWorkActualMaterialDs.item.asset_description = "";
      //END OF DT
      this.setBinNumber();
      this.validateMaterial(this);
      this.page.state.useConfirmDialog = true;
    }
  }


  // Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-8b-code-instruct
/**
 * Choose bin number for work material detail report.
 * @param {object} evt - The event object containing the selected bin number, current balance, condition code, lot number, asset number, and asset description.
 */
  async chooseBinNumber(evt) {
    // istanbul ignore else
    if (evt) {
      this.page.datasources.reportWorkActualMaterialDs.item.binnum = evt.binnum;
      this.page.datasources.reportWorkActualMaterialDs.item.curbal = evt.curbal;
      this.page.datasources.reportWorkActualMaterialDs.item.conditioncode = evt.conditioncode;
      this.page.datasources.reportWorkActualMaterialDs.item.lotnum = evt.lotnum;
       this.page.datasources.reportWorkActualMaterialDs.item.assetnum = evt.assetnum;
       this.page.datasources.reportWorkActualMaterialDs.item.asset_description = evt.description;
      this.page.state.useConfirmDialog = true;
      await this.getRotatingAsset();
    }
  }

  /**
   * Function to choose the rotating asset from lookup
   */
  chooseRotatingAsset(evt) {
    // istanbul ignore else
    if (evt) {
      this.page.datasources.reportWorkActualMaterialDs.item.assetnum = evt.assetnum;
      this.page.datasources.reportWorkActualMaterialDs.item.asset_description = evt.description;
      this.page.datasources.reportWorkActualMaterialDs.item.binnum = evt.binnum;
      this.page.datasources.reportWorkActualMaterialDs.item.curbal = evt.curbal;
      this.page.datasources.reportWorkActualMaterialDs.item.conditioncode = evt.conditioncode;
      this.validateMaterial(this);
      this.page.state.useConfirmDialog = true;
    }
  }

  /**
   * Function to choose the transaction type from lookup
   */
  chooseTransactionType(evt) {
    // istanbul ignore else
    if (evt) {
      this.page.datasources.reportWorkActualMaterialDs.item.transtype = evt.value;
      this.page.datasources.reportWorkActualMaterialDs.item.transtype_description = evt.description;
      this.page.state.useConfirmDialog = true;
    }
  }

  /**
     * Function to to validate the form
     */
  async validateMaterial(evt) {
    const reportMaterialDs = evt.page.findDatasource('reportWorkActualMaterialDs');
    let itemnum = reportMaterialDs.item['item_itemnum'];
    let quentity = reportMaterialDs.item['positivequantity'];
    let rotatingAssetNum = reportMaterialDs.item['assetnum'];
    let isRotatingAsset = evt.page.state.isRotating;
    if ((itemnum && quentity > 0 && !isRotatingAsset)
      || (isRotatingAsset && rotatingAssetNum && quentity > 0)) {
      evt.page.state.disableAction = false;
      reportMaterialDs.clearWarnings(reportMaterialDs.item, 'item_itemnum');
    } else {
      evt.page.state.disableAction = true;
      reportMaterialDs.setWarning(reportMaterialDs.item, 'item_itemnum');
    }
    // istanbul ignore next
    if(quentity > 1){
      this.page.state.useConfirmDialog = true;
    }
  }
  /**
   * Find the default craft and set skillleveldesc as empty if no skilldata exist
   */
  async openCraftSkillLookup(evt) {
    let craftrateds = evt.app.findDatasource('craftrate');
    if(!craftrateds) {
      return;
    }
    await craftrateds.initializeQbe();
    craftrateds.setQBE('laborcode', '=', evt.page.state.laborCode || evt.app.client.userInfo.labor.laborcode);
    craftrateds.setQBE('orgid', '=', evt.app.client.userInfo.defaultOrg); // DT241756 - MASISMIG-46119
    await craftrateds.searchQBE(undefined, true);

    let selectedItem;

    // istanbul ignore else
    if (craftrateds?.item) {
      evt.page.state.craftdata = craftrateds.items[0];
      craftrateds.items.forEach((item, index) => {

        // istanbul ignore next
        if (evt.openLookup) {
          if (evt.page.state.skilllevel && evt.page.state.craft) {
            if ((evt.page.state.skilllevel === item.skillleveldata) && (evt.page.state.craft === item.craft)) {
              selectedItem = item;
            }
          } else if (!evt.page.state.skilllevel && evt.page.state.craft) {
            if ((!item.skillleveldata) && (evt.page.state.craft === item.craft)) {
              selectedItem = item;
            }
          }
          else if (item.defaultcraft) {
            selectedItem = item;
          }
        }

        // istanbul ignore else
        if (item.defaultcraft) {
          evt.page.state.craftdata = item;
        }
      });
    }

    // istanbul ignore if
    if (evt.openLookup) {
      if (selectedItem) {
        craftrateds.setSelectedItem(selectedItem, true);
      }
      evt.page.showDialog("craftLookup");
    }
  }

  /**
   * Function to set cause and remedy in page state for report-work
   * after report work datasource has been loaded
   */
  async setFailureReportData(records) {
    this.page.state.causeValue = "";
    this.page.state.remedyValue = "";
    this.page.state.problemValue = "";
    this.page.state.failureClassValue = "";
    let dsfailureList = this.page.dsFailureList;

    // istanbul ignore else
    if (records?.[0]?.failurereport) {
      const failurelists = [];

      records[0].failurereport.forEach(async (item) => {
        // istanbul ignore next
        if (item.type_maxvalue === "CAUSE" || item.type_maxvalue === "REMEDY") {
          failurelists.push(item.linenum);
        }
      });

      await dsfailureList.initializeQbe();
      dsfailureList.setQBE('failurelist', 'in', failurelists);
      const failures = await dsfailureList.searchQBE(undefined, true);

     records[0].failurereport.forEach(async (item) => {
        // istanbul ignore next
        if (item._action !== 'delete') {
          if (item.type_maxvalue === "CAUSE") {
            const failure = failures.find((f) => f.failurelist === item.linenum);
            if (failure?.failurecode?.description) {
              this.page.state.causeValue = failure?.failurecode?.description;
            } else if (item?.failurecode?.failurecode) {
              this.page.state.causeValue = item?.failurecode?.failurecode ;
            } else {
              this.page.state.causeValue = item?.failurecode;
            }
          } else if (item.type_maxvalue === "REMEDY") {
            const failure = failures.find((f) => f.failurelist === item.linenum);
            if (failure?.failurecode?.description) {
                this.page.state.remedyValue = failure?.failurecode?.description;
              } else if (item?.failurecode?.failurecode) {
                this.page.state.remedyValue = item?.failurecode?.failurecode;
              } else {
                this.page.state.remedyValue = item?.failurecode;
              }
          }
        }
      });

      //istanbul ignore else
      if (Device.get().isMaximoMobile) {
        this.page.state.failureClassValue = records[0].failureclassdelete ? '' : records[0]?.failure?.description || records[0]?.failuredescription;
        this.page.state.problemValue = records[0].problemdelete ? '' : records[0]?.problem?.description || records[0]?.problem?.failurelist?.failurecode;

        // istanbul ignore else
        if (records[0].causedelete) {
          this.page.state.causeValue = '';
        }
        // istanbul ignore else
        if (records[0].remedydelete) {
          this.page.state.remedyValue = '';
        }
      }
    } else if (Device.get().isMaximoMobile && records && records[0] && !records[0].failurereport) {
      this.page.state.failureClassValue = records[0].failureclassdelete ? '' : (records[0]?.failure && records[0]?.failure?.description) || records[0]?.failuredescription;
    }
    this.page.state.failureEdit = false; // DT261473 
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  /**
  * @function onCloseDrawer
  * @description This function is called when the drawer is closed. It resets the task datasource, checks if there was an error message in the page state, and if so, shows a confirmation dialog. If the confirmation dialog is dismissed without saving changes, it calls the resetTaskDS function to reset the task datasource. If the confirmation dialog is confirmed, it shows the save/discard labor dialog. If the save/discard labor dialog is dismissed, it calls the resetTaskDS function to reset the task datasource. If the save/discard labor dialog is confirmed, it clears the QBE of the reportworkLaborDetailds datasource and forces a reload of the woDetailsReportWork datasource.
  * @param {object} evt - The event object.
  */
  async onCloseDrawer(evt) {
    this.resetTaskDS();
    const laborJsonDS = this.app.findDatasource('laborJsonDS'); 
    laborJsonDS.clearSelections();
    this.page.state.hideDeleteTimer = false;
    await evt.ds.forceReload();
    if (evt?.page?.state?.errorMessage) {
      this.page.state.useConfirmDialog = true;
    } else if (this.page.state.useConfirmDialog && this.page.state.callMethodAction === 'LABOR') {
      this.page.showDialog('saveDiscardLaborsDialog');
      this.page.state.useConfirmDialog = false;
    } else {
      const reportworkLaborList = this.page.findDatasource("reportworkLaborDetailds");
      reportworkLaborList.clearQBE();
      await reportworkLaborList.searchQBE(undefined, true);
    }
  }

  /**
* Validate before closing sliding drawer.
* @param {validateEvent} validateEvent
*/
  reportTimeDrawerValidate(validateEvent) {
    validateEvent.failed = this.page.state.useConfirmDialog && this.page.state.callMethodAction === 'LABOR';
    if (validateEvent.failed) {
      this.page.showDialog('saveDiscardLaborsDialog');
    }
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  /**
   * @function openReportTimeDrawer
   * @description Opens report time drawer.
   * @param {Event} evt - event object.
   */
  async openReportTimeDrawer(evt) {
    this.app.state.pageLoading = true;
    if(evt.action === 'add'){
      this.page.state.hideDeleteTimer = true;
    }
    this.page.state.premiumEdit =  false;
    this.page.state.laborDisplayName = ""
    this.page.state.selectedLabors?.clear();
    this.page.state.useConfirmDialog = false;
    this.page.state.callMethodAction = 'LABOR';
    let personInfo = this.app.client.userInfo;
    this.page.state.disableButton = false;
    this.page.state.laborEditDialogLoader = evt.action === 'update';
    this.page.state.failureEdit = evt.action === 'add' || evt.action !== 'update';
    let dataFormatter = this.app.dataFormatter;
    let device = Device.get();
    let laborCode = personInfo.labor.laborcode;
    let laborCodeDesc = personInfo.displayName || laborCode;
    this.page.state.laborCode = laborCode;
    this.page.state.selectedTaskItem = undefined;

    //reset labor and craftrate lookup datasources
    let laborLookupDs = this.app.findDatasource('laborDs');
    laborLookupDs.clearState();
    await laborLookupDs.load();

    const laborJsonDS = this.app.findDatasource("laborJsonDS");
    laborJsonDS.reset(laborJsonDS.baseQuery, true, { resetItems: true, resetDataAdapter: true });
    await laborJsonDS?.load();

    let craftrateLookupDs = this.app.findDatasource('craftrate');
    craftrateLookupDs.clearState();

    //Set default craft skill
    await this.setCraftSkill(evt);

    const premiumpayJsonDS = this.app.findDatasource('premiumpayJsonDS');
    premiumpayJsonDS?.clearState();
    await premiumpayJsonDS?.load({ noCache: true, src: [] });

    this.page.state.premiumpaydescription = '';
    this.page.state.displayrate = '';
    CommonUtil.sharedData.premiumpaycode = '';
    this.page.state.displayratetype = '';

    //Fetch the tasks
    await this.getWoTasks();

    // istanbul ignore if
    if (this.page.state.craftdata && this.page.state.craftdata.laborcode !== personInfo.labor.laborcode) {
      await this.openCraftSkillLookup({page: this.page, app: this.app, openLookup: false});
    }
    let craftSkillLevel = this.page.state.craftdata;
    this.page.state.dateTimeRemoved = undefined;
    const labords = this.page.findDatasource('reportworkLaborDetailds');
    let synonymdomainData = this.app.findDatasource('synonymdomainData');
    this.page.state.timerStatusComplete = await SynonymUtil.getSynonym(synonymdomainData, 'TIMERSTATUS', 'TIMERSTATUS|COMPLETE');

    // istanbul ignore next
    if (evt && evt.action === 'update') {
      this.page.state.isAddAction = false;
      labords.item.finishdate = '';
      labords.item.finishtime = '';
      await labords.initializeQbe();
      if (device.isMaximoMobile) {
        labords.setQBE('anywhererefid', '=', evt.item.anywhererefid);
      } else {
        labords.setQBE('labtransid', '=', evt.item?.labtransid);
      }
      await labords.searchQBE(undefined, true);
      // istanbul ignore else
      if (evt.item.groupedlabor) {
        await this.getPremiumPay(evt, craftrateLookupDs);
      }
      labords.item.starttime = dataFormatter.dateWithoutTimeZone(WOTimerUtil.removeSecondsFromTimeString(labords.item.starttime));
      labords.item.finishdate = evt.item?.finishdate || '';
      labords.item.finishtime = evt.item?.finishtime;
      labords.item.timerstatus = evt.item.timerstatus;
      labords.item.timerstatus_maxvalue = evt.item.timerstatus_maxvalue;
      labords.item.anywhererefid = evt.item.anywhererefid;
      this.page.state.craft  = evt.item?.craft;
      this.page.state.rate = labords.item.payrate;
      this.page.state.skilllevel = labords.item.skilllevel;
      this.page.state.vendor = labords.item.vendor;
      this.page.state.contractnum = labords.item.contractnum;
      this.page.state.outside = labords.item.outside;
      let timerStatus = labords.item.timerstatus_maxvalue;
      // istanbul ignore else 
      if (evt.item.groupedlabor?.[0]?.craft) {
        this.page.state.craft = evt.item.groupedlabor?.[0]?.craft;
      }
      // istanbul ignore else 
      if (evt.item.groupedlabor?.[0]?.craftdescription) {
        labords.item.craftdescription = evt.item.groupedlabor[0].craftdescription;
      }
      
      // istanbul ignore else 
      if (evt.item.groupedlabor?.[0]?.premiumpaycode) {
        this.page.state.premiumEdit = true;
      }
      //Set craft and skill to default when timer started 
      if (timerStatus === 'ACTIVE' && !labords.item.craft) {
        labords.item.craftdescription = craftSkillLevel.craftdescription;
        this.page.state.craft = craftSkillLevel.craft;
        this.page.state.skilllevel = craftSkillLevel.skillleveldata;
        this.page.state.rate = craftSkillLevel.rate;
      }

      this.page.state.action = 'update';
      if (device.isMaximoMobile) {
        //updateSchema is a temporary workaround
        this.updateSchema(labords);
        let typeDs = this.page.findDatasource("reportworksSynonymData");
        typeDs.items.forEach(item => {
          if (item.value === evt.item.transtype) {
            labords.item["transtype_description"] = item.description;
          }
        });
      }
    } else {
      this.page.state.action = 'add';
      this.page.state.isAddAction = true;
      if (this.page.findDatasource('reportworkLaborDetailds')) {
        let labords = this.page.findDatasource('reportworkLaborDetailds');
        let newLabtrans = await labords.addNew();
        if (device.isMaximoMobile) {
          this.updateSchema(labords);
        }
        if (this.app.state.networkConnected && newLabtrans) {
          labords.item["labtransid"] = newLabtrans.labtransid;
        }
        const transtypeData = await SynonymUtil.getDefExtSynonymValueIdWithOrgSite(this.app.findDatasource("synonymdomainData"), 'LTTYPE', 'WORK', this.app.userInfo.defaultOrg, this.app.userInfo.defaultSite);
        labords.item["transtype"] = transtypeData?.value || '';
        labords.item["transtype_description"] = transtypeData?.description || transtypeData?.value;
        labords.item["startdate"] = dataFormatter.convertDatetoISO(new Date().setHours(0, 0, 0, 0));
        labords.item["regularhrs"] = newLabtrans?.regularhrs ? newLabtrans.regularhrs : 0;
        labords.item["starttime"] = '';
        labords.item["finishdate"] = '';
        labords.item["finishtime"] = '';
        labords.item["craftdescription"] = craftSkillLevel.craftdescription;
        labords.item["displayname"] = laborCodeDesc;
        labords.item["laborcode"] = laborCode;

        if (craftSkillLevel) {
          this.page.state.craft = craftSkillLevel.craft;
          this.page.state.skilllevel = craftSkillLevel.skillleveldata;
          this.page.state.rate = craftSkillLevel.rate;
        }
      }
    }

    await this.setPremiumPay(craftrateLookupDs);
    // istanbul ignore next 
    this.page.state.transTypeValue = labords.item["transtype"];
    this.page.state.transTypeDesc = labords.item["transtype_description"];
    this.page.showDialog("reportTimeDrawer");
    this.page.state.fieldChangedManually =  false;
    // set all the values of datasource item before this line
    this.page.state.useConfirmDialog = false;
    this.page.state.failureEdit = false;
    this.page.state.laborEditDialogLoader = false;
    this.app.state.pageLoading = false;
  }

// Assisted by watsonx Code Assistant 
/**
 * Retrieve premium pay rate information based on labor code and craft.
 * @param {Object} evt - The event object containing the labor code and craft.
 * @returns {void}
 */
  async getPremiumPay(evt) {
    const craftrateLookupDs = this.app.findDatasource('craftrate');
    await craftrateLookupDs.initializeQbe();
    craftrateLookupDs.setQBE('laborcode', '=', evt.item?.laborcode);
    craftrateLookupDs.setQBE('craft', '=', evt.item?.craft);
    await craftrateLookupDs.searchQBE(undefined, true);
    this.page.state.displayrate = evt.item?.groupedlabor[0].premiumpayrate;
    CommonUtil.sharedData.premiumpaycode = evt.item?.groupedlabor[0].premiumpaycode;
    this.page.state.displayratetype = evt.item?.groupedlabor[0].premiumpayratetype;
    const ppcraftrate = craftrateLookupDs.item.ppcraftrate;
    ppcraftrate?.forEach((item) => {
      // istanbul ignore else 
      if (item.premiumpaycode === CommonUtil.sharedData.premiumpaycode ) { 
        this.page.state.premiumpaydescription = item.premiumpay[0].description;
        // istanbul ignore else 
        if (Device.get().isMaximoMobile) {
          this.page.state.displayrate = item.displayrate;
          this.page.state.displayratetype = item.premiumpay[0].defaultratetype;
        }
      }
    });
  }

// Assisted by watsonx Code Assistant 
/**
 * Returns an array of premium pay codes based on the default craft.
 * @param {Object} defaultCraft - The default craft object.
 * @returns {Array} premiumpaycodes - An array of premium pay codes.
 */
  getPremiumPayCodes(defaultCraft) {
    const premiumpaycodes = [];
    if (defaultCraft?.ppcraftrate) {
      defaultCraft.ppcraftrate.forEach(ppcraftrate => {
        ppcraftrate.premiumpay.forEach(item => {
          const premiumpaycode = {
            displayrate: ppcraftrate.displayrate,
            premiumpaycode: ppcraftrate.premiumpaycode,
            description: item.description,
            displayratetype: item.defaultratetype
          };
          premiumpaycodes.push(premiumpaycode);
        });
      });
    }
    return premiumpaycodes;
  }

// Assisted by watsonx Code Assistant 
/**
 * Sets the premium pay for a craft.
 * @param {Object} craft - The craft object.
 * @returns {Promise<void>} - A promise that resolves when the premium pay is set.
 */
  async setPremiumPay(craft) {
    const premiumpayJsonDS = this.page.findDatasource('premiumpayJsonDS');
    let premiumpaycodes = [];
    if (craft.items) {
      const defaultCraft = craft.items.find(item => item.defaultcraft) || null;
      // istanbul ignore else 
      if (defaultCraft) {
        premiumpaycodes = this.getPremiumPayCodes(defaultCraft);
      }
    } else {
      const defaultCraft = craft;
      premiumpaycodes = this.getPremiumPayCodes(defaultCraft);
    }
    await premiumpayJsonDS?.load({ noCache: true, src: premiumpaycodes });
  }

// Assisted by watsonx Code Assistant 
/**
 * Selects a premium pay code and updates the corresponding fields in the page state and data source.
 */
  async selectPremiumPay(evt){
    this.page.state.premiumpaydescription = evt.description;
    this.page.state.displayrate = evt.displayrate;
    CommonUtil.sharedData.premiumpaycode = evt.premiumpaycode
    this.page.state.displayratetype = evt.displayratetype;
    this.page.datasources.reportworkLaborDetailds.item.premiumpaycode = evt.premiumpaycode;
    this.page.datasources.reportworkLaborDetailds.item.premiumpayhours = '0';
  }
  /*
   * Load record and open report time drawer after loading.
  */
  async loadAndOpenReportTimeDrawer(evt) {
    this.app.state.pageLoading = true;
    this.page.findDatasource("reportworkLaborDetailds")?.clearState();

    // istanbul ignore next
    await Promise.allSettled([
      this.loadRecord(),
      this.openReportTimeDrawer(evt),
    ]).finally(() => {
      this.app.state.pageLoading = false
    });
  }

  /**
   * Function to open trans type lookup with pre selected item
   */
  async openTransTypeLookup(evt) {
    let typeDs = evt.page.findDatasource('reportworksSynonymData');
    let selectedItem;
    typeDs.items.forEach(item => {
      // istanbul ignore else
      if (item.value === evt.page.state.transTypeValue && item.description === evt.page.state.transTypeDesc) {
        selectedItem = item;
      }
    });
    // istanbul ignore else
    if (selectedItem) {
      typeDs.setSelectedItem(selectedItem, true);
    }
    evt.page.showDialog("transTypeLookup");
  }

  /**
   * Function to choose trans type
   */
  chooseTransType(evt) {
    if (evt) {
      this.page.datasources.reportworkLaborDetailds.item["transtype"] = evt.value;
      this.page.datasources.reportworkLaborDetailds.item["transtype_description"] = evt.description;
      this.page.state.transTypeValue = evt.value;
      this.page.state.transTypeDesc = evt.description;
      this.page.state.useConfirmDialog = true;
    }
  }

  /**
   * Function to select craft and skill
   */
  async selectCraftSkill(evt) {
    await this.setPremiumPay(evt);
    let labords = this.page.findDatasource('reportworkLaborDetailds');
    labords.item["craftdescription"] = evt.craftdescription;
    this.page.state.rate = evt.rate;
    this.page.state.skilllevel = evt.skillleveldata || '';
    this.page.state.craft = evt.craft;
    this.page.state.vendor = evt.vendor || '';
    this.page.state.contractnum = evt.contractnum || '';
    this.page.state.useConfirmDialog = true;
  }

  /**
   * Function to clear field warnings
   */
  // istanbul ignore next
  clearWarnings(evt, field) {
    let labords = evt.page.findDatasource('reportworkLaborDetailds');
    labords.clearWarnings(
      labords.item,
      field
    );
  }

  /**
   * Function to set field warnings
   */
  // istanbul ignore next
  showLaborWarnings(evt, field, message) {
    let labords = evt.page.findDatasource('reportworkLaborDetailds');
    labords.setWarning(
      labords.item,
      field,
      message
    );
  }

  // istanbul ignore next
  onValueChanged(changeObj) {
    //Clear warnings if fields are blank
    let field = changeObj.field;
    let fieldArr = ['startdate', 'starttime', 'finishdate', 'finishtime'];
    let changedFieldArr = ['startdate', 'starttime'];
    let dataFormatter = this.app.dataFormatter;
    this.page.state.dateTimeFieldsChanged = false;

    // istanbul ignore else
    if (field !== 'startdate' && fieldArr.indexOf(field) >= 0 && changeObj.newValue === '') {
      this.clearWarnings(this, field);
    }

    // istanbul ignore else
    if (fieldArr.indexOf(field) >= 0 && changeObj.newValue && dataFormatter.dateWithoutTimeZone(changeObj.newValue) !== dataFormatter.dateWithoutTimeZone(changeObj.oldValue)) {
      this.page.state.dateTimeFieldsChanged = true;
      this.page.state.useConfirmDialog = true;
    }

    // istanbul ignore else
    if (changeObj.field === 'regularhrs' && changeObj.newValue !== changeObj.oldValue) {
      if(!this.page.state.dateTimeFieldsChanged){
        this.page.state.regularHrsChanged = true;
      }
      this.page.state.useConfirmDialog = true;
    }

    // istanbul ignore else
    if (changedFieldArr.indexOf(field) >= 0 && dataFormatter.dateWithoutTimeZone(changeObj.newValue) !== dataFormatter.dateWithoutTimeZone(changeObj.oldValue)) {
      this.page.state.dateTimeRemoved = false;
    }

    // istanbul ignore else
    if (changeObj.field === 'regularhrs' && changeObj.oldValue !== '' && (changeObj.newValue !== changeObj.oldValue)) {
      this.page.state.dateTimeRemoved = false;
    }

    // istanbul ignore else
    if ((changeObj.field === 'finishdate' || changeObj.field === 'finishtime') && changeObj.newValue === '' && changeObj.oldValue !== '') {
      this.page.state.dateTimeRemoved = true;
    }

    //istanbul ignore else 
    if (changeObj.field === 'toolqty') {
      this.validateToolData(this);
    } 
    // istanbul ignore else
    if (((changeObj.field === 'finishtime')
    || (changeObj.field === 'starttime')
    || (changeObj.field === 'startdate')
    || (changeObj.field === 'finishdate')) && this.page.state.regularHrsChanged === false) {
      this.page.state.fieldChangedManually = true;
    } else {
      this.page.state.fieldChangedManually = false;
    }

    this.page.state.errorMessage = this.validateRegularHrs({page: this.page, app: this.app});

    // istanbul ignore else
    if (["toolhrs","pluscmanufacturer","plusclotnum","plusctype","pluscexpirydate"].includes(changeObj.field)) {
      this.page.state.disableToolSave = this.validateToolData({page: this.page, app: this.app});
    }
  }

  /**
   * Function to validate regular horus and dates
   */
  validateRegularHrs(evt) {
    let dataFormatter = evt.app.dataFormatter;
    let labords = evt.page.findDatasource('reportworkLaborDetailds');
    let labtranstolerance = evt.page.findDatasource('woDetailsReportWork').item["labtranstolerance"];
    /**
   * Getting the labtranstolerance value when WO created in offline mode
   */
    // istanbul ignore else
    if (!labtranstolerance) {
      labtranstolerance = CommonUtil.filterMobileMaxvars('LABTRANSTOLERANCE', evt.app.findDatasource('defaultSetDs'))[0]?.varvalue;
    }
    let startDate = dataFormatter.dateWithoutTimeZone(WOTimerUtil.removeSecondsFromTimeString(labords.item["startdate"]), true);
    let startTime = dataFormatter.dateWithoutTimeZone(WOTimerUtil.removeSecondsFromTimeString(labords.item["starttime"]));
    let finishDate = dataFormatter.dateWithoutTimeZone(WOTimerUtil.removeSecondsFromTimeString(labords.item["finishdate"]));
    let finishTime = dataFormatter.dateWithoutTimeZone(WOTimerUtil.removeSecondsFromTimeString(labords.item["finishtime"]));
    let regularHrs = labords.item["regularhrs"];
    let errorMessage = ''; let errorField = '';
    let todayDate = new Date();
    todayDate = dataFormatter.convertISOtoDate(todayDate.setTime(todayDate.getTime() + (dataFormatter.timeToDecimal(labtranstolerance) * 60 * 60 * 1000)));
    if (labords.item["startdate"] === '') {
      errorMessage = this.app.getLocalizedLabel('startdate_msg', 'Start date is required');
      errorField = 'startdate';
      this.showLaborWarnings(evt, errorField, errorMessage);
      this.page.state.disableButton = true;
      return errorMessage;
    } else {
      this.page.state.disableButton = false;
      this.clearWarnings(evt, 'startdate');
    }

    // istanbul ignore else
    if (labords.item["regularhrs"] === '') {
      errorMessage = this.app.getLocalizedLabel('regularhr_req_msg', 'Regular hours is required');
      errorField = 'regularhrs';
      this.showLaborWarnings(evt, errorField, errorMessage);
      this.page.state.disableButton = true;
      return errorMessage;
    } else if (typeof labords.item["regularhrs"] === 'string') {
      errorMessage = this.app.getLocalizedLabel('regularhr_invalid_msg', 'Invalid regular hours');
      errorField = 'regularhrs';
      this.showLaborWarnings(evt, errorField, errorMessage);
      this.page.state.disableButton = true;
      return errorMessage;
    } else {
      this.clearWarnings(evt, 'regularhrs');
      this.page.state.disableButton = false;
    }

    let laborStartDateTime = '';
    let laborFinishDateTime = '';
    let isCalculatedFinishDate = false;

    // istanbul ignore if
    if (startDate) {
      if (dataFormatter.convertISOtoDate(startDate) > todayDate) {
        errorMessage = this.app.getLocalizedLabel('future_startdate_msg', 'Start date cannot be in the future');
        errorField = 'startdate';
        this.showLaborWarnings(evt, errorField, errorMessage);
        this.clearWarnings(evt, 'starttime');
        return errorMessage;
      } else {
        this.clearWarnings(evt, 'startdate');
      }
    }

    if (startDate && startTime) {
      laborStartDateTime = this.combineDateTime(startDate, startTime);

      // istanbul ignore if
      if (laborStartDateTime > todayDate) {
        if (this.getMinutes(laborStartDateTime) > this.getMinutes(todayDate)) {
          errorMessage = this.app.getLocalizedLabel('future_starttime_msg', 'Start time cannot be in the future');
          errorField = 'starttime';
          this.clearWarnings(evt, 'startdate');
          this.showLaborWarnings(evt, errorField, errorMessage);
          return errorMessage;
        }
      }
      else {
        this.clearWarnings(evt, 'startdate');
        this.clearWarnings(evt, 'starttime');
      }
    }

    // istanbul ignore if
    if (startDate && startTime && regularHrs && regularHrs > 0 && (!finishDate || !finishTime) && this.page.state.dateTimeRemoved === false) {
      let finishdate = this.calculateLaborDateTime(startDate, startTime, regularHrs);
      labords.item["finishdate"] = finishDate = this.getOnlyDatePart(finishdate);
      labords.item["finishtime"] = finishTime = dataFormatter.dateWithoutTimeZone(dataFormatter.convertDatetoISO(this.combineDateTime(todayDate, finishdate)));
      isCalculatedFinishDate = true;
      this.page.state.regularHrsChanged = false;
    }

    // istanbul ignore if
    if (startDate && startTime && regularHrs && regularHrs > 0 && (finishDate || finishTime) && this.page.state.dateTimeRemoved === false && this.page.state.fieldChangedManually === false) {
      let finishdate = this.calculateLaborDateTime(startDate, startTime, regularHrs);
      labords.item["finishdate"] = finishDate = this.getOnlyDatePart(finishdate);
      labords.item["finishtime"] = finishTime = dataFormatter.dateWithoutTimeZone(dataFormatter.convertDatetoISO(this.combineDateTime(todayDate, finishdate)));
      this.page.state.regularHrsChanged = false;
      isCalculatedFinishDate = true;
    }

    if (finishDate) {
      // istanbul ignore next
      if (dataFormatter.convertISOtoDate(this.getOnlyDatePart(finishDate)) > todayDate) {
        errorMessage = this.app.getLocalizedLabel('future_enddate_msg', 'End date cannot be in the future');
        errorField = 'finishdate';
        this.showLaborWarnings(evt, errorField, errorMessage);
        this.clearWarnings(evt, 'finishtime');
        return errorMessage;
      } else if (dataFormatter.convertISOtoDate(this.getOnlyDatePart(finishDate)) < dataFormatter.convertISOtoDate(this.getOnlyDatePart(startDate))) {
        errorMessage = this.app.getLocalizedLabel('start_enddate_compare_msg', 'End date should be later than start date');
        errorField = 'finishdate';
        this.showLaborWarnings(evt, errorField, errorMessage);
        this.clearWarnings(evt, 'finishtime');
        return errorMessage;
      } else {
        this.clearWarnings(evt, 'finishdate');
      }
    }
    // istanbul ignore if
    if (finishTime && !finishDate) {
      if (this.getMinutes(finishTime) > this.getMinutes(todayDate)) {
        errorMessage = this.app.getLocalizedLabel('future_endtime_msg', 'End time cannot be in the future');
        errorField = 'finishtime';
        this.showLaborWarnings(evt, errorField, errorMessage);
        return errorMessage;
      } else {
        this.clearWarnings(evt, 'finishtime');
      }
    }
    // istanbul ignore if
    if (finishDate && finishTime) {
      laborFinishDateTime = this.combineDateTime(finishDate, finishTime);

      // istanbul ignore if
      if (laborFinishDateTime > todayDate) {
        if (this.getMinutes(laborFinishDateTime) > this.getMinutes(todayDate)) {
          errorMessage = this.app.getLocalizedLabel('future_endtime_msg', 'End time cannot be in the future');
          errorField = 'finishtime';
          this.clearWarnings(evt, 'finishdate');
          this.showLaborWarnings(evt, errorField, errorMessage);
          return errorMessage;
        }
      } else {
        this.clearWarnings(evt, 'finishdate');
        this.clearWarnings(evt, 'finishtime');
      }
    }

    // istanbul ignore if
    if (finishDate && finishTime && regularHrs && regularHrs > 0 && !startTime) {
      let date = this.calculateLaborDateTime(finishDate, finishTime, regularHrs, true);
      labords.item["starttime"] = date;
    }

    // istanbul ignore if
    if (startDate && startTime && finishDate && finishTime && this.page.state.dateTimeFieldsChanged) {
      this.page.state.dateTimeFieldsChanged = false;
      laborStartDateTime = this.combineDateTime(startDate, startTime);
      laborFinishDateTime = this.combineDateTime(finishDate, finishTime);

      if (regularHrs >= 0) {
        let hours = Math.abs((laborFinishDateTime - laborStartDateTime)) / 3600000;
        labords.item["regularhrs"] = hours;

        if (laborFinishDateTime > laborStartDateTime && !isCalculatedFinishDate) {
          labords.item["regularhrs"] = hours;
          this.clearWarnings(evt, 'finishdate');
        }

        this.page.state.regularHrsChanged = false;
      }
    }
    // istanbul ignore if
    if(startDate && startTime && finishTime && this.page.state.dateTimeFieldsChanged) {
      labords.item["finishdate"] = this.getOnlyDatePart(startDate);
      laborStartDateTime = this.combineDateTime(startDate, startTime);
      laborFinishDateTime = this.combineDateTime(startDate, finishTime);
      let timeDifference = laborFinishDateTime - laborStartDateTime;
      if(timeDifference < 0) {
        laborFinishDateTime.setDate(laborFinishDateTime.getDate() + 1);
      }
      if(regularHrs >= 0) {
        let hours = Math.abs((laborFinishDateTime - laborStartDateTime)) / 3600000;
        labords.item["regularhrs"] = hours;
      }
    }

    // istanbul ignore if
    if (startDate && startTime && finishDate && finishTime && regularHrs && regularHrs > 0 && this.page.state.regularHrsChanged) {
      laborStartDateTime = this.combineDateTime(startDate, startTime);
      laborFinishDateTime = this.combineDateTime(finishDate, finishTime);
      let hours = Math.abs((laborFinishDateTime - laborStartDateTime)) / 3600000;

      if (regularHrs > hours) {
        errorMessage = this.app.getLocalizedLabel('regularhr_msg', 'Hours exceed duration between start and end time');
        errorField = 'regularhrs';
        this.showLaborWarnings(evt, errorField, errorMessage);
        return errorMessage;
      } else {
        this.clearWarnings(evt, 'regularhrs');
      }
    }

    if (startDate && startTime && finishDate && finishTime) {
      laborStartDateTime = this.combineDateTime(startDate, startTime);
      laborFinishDateTime = this.combineDateTime(finishDate, finishTime);

      if (startDate === finishDate && (this.getMinutes(laborFinishDateTime) < this.getMinutes(laborStartDateTime))) {
        errorMessage = this.app.getLocalizedLabel('start_endtime_compare_msg', 'End time should be later than start time');
        errorField = 'finishtime';
        this.clearWarnings(evt, 'finishdate');
        this.showLaborWarnings(evt, errorField, errorMessage);
        return errorMessage;
      } else {
        this.clearWarnings(evt, 'finishtime');
      }
    }

    if (startDate && !startTime && finishDate && !finishTime && regularHrs && regularHrs > 0) {
      laborStartDateTime = dataFormatter.convertISOtoDate(startDate);
      laborFinishDateTime = dataFormatter.convertISOtoDate(finishDate);
      let hours = Math.abs((laborFinishDateTime - laborStartDateTime)) / 3600000;

      if (regularHrs > hours) {
        errorMessage = this.app.getLocalizedLabel('regularhr_overtime_msg', 'Regular hours plus overtime exceeds duration between start and end date');
        errorField = 'regularhrs';
        this.showLaborWarnings(evt, errorField, errorMessage);
        return errorMessage;
      } else {
        this.clearWarnings(evt, 'regularhrs');
      }
    }

    if (startDate && !startTime && finishDate && !finishTime) {
      // istanbul ignore next
      if (dataFormatter.convertISOtoDate(this.getOnlyDatePart(finishDate)) < dataFormatter.convertISOtoDate(this.getOnlyDatePart(startDate))) {
        errorMessage = this.app.getLocalizedLabel('start_enddate_compare_msg', 'End date should be later than start date');
        errorField = 'finishdate';
        this.showLaborWarnings(evt, errorField, errorMessage);
        return errorMessage;
      } else {
        this.clearWarnings(evt, 'finishdate');
      }
    }

    return errorMessage;
  }

  /**
   * Function to inject time part into dateISO and return dateTime object.
   * For ex: dt = 2020-12-15T00:00:00.000+05:30, time = 2020-12-14T03:00:00.000+05:30
   * And it will return as 2020-12-15T03:00:00.000+05:30
   */
  combineDateTime(dateISO, timeISO, app) {
    let dataFormatter = (app) ? app.dataFormatter : this.app.dataFormatter;
    let date = dataFormatter.convertISOtoDate(dateISO);
    let time = dataFormatter.convertISOtoDate(timeISO);
    date.setHours(time.getHours());
    date.setMinutes(time.getMinutes());
    return date;
  }

  /**
   * Function calculate enddate time depending upon the hours.
   */
  calculateLaborDateTime(dateISO, timeISO, hours, isReverse, app) {
    let dataFormatter = (app) ? app.dataFormatter : this.app.dataFormatter;
    let datetime = this.combineDateTime(dateISO, timeISO, app);

    let calcDateTime = !isReverse ? datetime.setMinutes(datetime.getMinutes() + hours * 60) : datetime.setMinutes(datetime.getMinutes() - hours * 60);
    return dataFormatter.dateWithoutTimeZone(dataFormatter.convertDatetoISO(calcDateTime));
  }

  /**
   * Function to return only the date excluding the time portion of it
   * For ex: 2020-12-14T00:00:00.000+05:30.
   */
  getOnlyDatePart(dateISO, app) {
    let dataFormatter = (app) ? app.dataFormatter : this.app.dataFormatter;
    let date = dataFormatter.convertISOtoDate(dateISO);
    date.setHours(0);
    date.setMinutes(0);
    date = dataFormatter.dateWithoutTimeZone(dataFormatter.convertDatetoISO(date));
    return date;
  }

  /**
   * Function to return the minutes.
   */
  getMinutes(dateISO, app) {
    let dataFormatter = (app) ? app.dataFormatter : this.app.dataFormatter;
    let date = dataFormatter.convertISOtoDate(dateISO);
    return date.getHours() * 60 + date.getMinutes();
  }

  /**
   * Re-validate the end date and time when going for save.
   */
  validateEndDateTime(evt) {
    let labords = evt.page.findDatasource('reportworkLaborDetailds');
    let dataFormatter = evt.app.dataFormatter;
    let invalidDatetime = false;

    if (labords.item["startdate"] && labords.item["starttime"] && labords.item["regularhrs"] && labords.item["regularhrs"] > 0 && evt.page.state.dateTimeRemoved) {
      let todayDate = new Date();
      let labtranstolerance = evt.page.findDatasource('woDetailsReportWork').item["labtranstolerance"];
      todayDate = dataFormatter.convertISOtoDate(todayDate.setHours(todayDate.getHours() + dataFormatter.timeToDecimal(labtranstolerance)));

      let finishDate = this.calculateLaborDateTime(labords.item["startdate"], labords.item["starttime"], labords.item["regularhrs"], false, evt.app);
      let finishTime = dataFormatter.dateWithoutTimeZone(dataFormatter.convertDatetoISO(this.combineDateTime(todayDate, finishDate, evt.app)));

      let laborFinishDateTime = this.combineDateTime(finishDate, finishTime, evt.app);

      // istanbul ignore if
      if ((dataFormatter.convertISOtoDate(this.getOnlyDatePart(finishDate, evt.app)) > todayDate) ||
        (this.getOnlyDatePart(finishDate, evt.app) === WOTimerUtil.removeSecondsFromTimeString(this.getOnlyDatePart(todayDate, evt.app)) &&
          (this.getMinutes(laborFinishDateTime, evt.app) > this.getMinutes(todayDate, evt.app)))) {
        let errorMessage = evt.app.getLocalizedLabel('regularhr_with_futuredate_msg', 'Actual labor can not be with future dates and times');
        this.showLaborWarnings(evt, 'regularhrs', errorMessage);
        invalidDatetime = true;
      }
    }

    return invalidDatetime;
  }

  /**
   * Function to set flag for 'put-data-failed' event
   */
  //istanbul ignore next
  onSaveDataFailed() {
    this.saveDataSuccessful = false;
  }

  async onCustomSaveTransition() {
		let evt	 = {
      page: this.page,
      app: this.app
		}
    // istanbul ignore else
    if(this.page.state.callMethodAction === 'LABOR') {
      if(!evt.page.state.errorMessage) {
        await this.saveLaborTransaction(evt);
        return {saveDataSuccessful: this.saveDataSuccessful, callDefaultSave: false};
      } else {
        window.setTimeout(() => {
          this.page.showDialog("reportTimeDrawer");
        }, 100);
        return {saveDataSuccessful: true, callDefaultSave: false};
      }
    }
    // istanbul ignore else
    if(this.page.state.callMethodAction === 'TOOL') {
      if(!evt.page.state.disableToolAction) {
        await this.saveToolDetail(evt);
        return {saveDataSuccessful: this.saveDataSuccessful, callDefaultSave: false};
      } else {
        window.setTimeout(() => {
          this.page.showDialog("toolsDrawer");
        }, 100);
        return {saveDataSuccessful: true, callDefaultSave: false};
      }
    }
    // istanbul ignore else
    if(this.page.state.callMethodAction === 'MATERIAL') {
      if(!evt.page.state.disableAction) {
        await this.saveMaterialTransaction();
        return {saveDataSuccessful: this.saveDataSuccessful, callDefaultSave: false};
      } else {
        window.setTimeout(() => {
          this.page.showDialog("materialsDrawer");
        }, 100);
        return {saveDataSuccessful: true, callDefaultSave: false};
      }
    } 
	}

 // Assisted by watsonx Code Assistant 
  /**
 * Close the tools transaction.
 * @param {Event} evt - The event object.
 * @returns {void}
 */
  closeToolsTransaction() {
    this.app.findDatasource('laborJsonDS')?.clearSelections();
    this.page.state.isAddAction = false;
    this.page.state.multipleLabors = false;
    this.page.state.hideDeleteTimer = false;
    this.page.findDialog('saveDiscardLaborsDialog')?.closeDialog();
    this.page.findDialog("reportTimeDrawer")?.closeDialog();
  }

  /**
   * Function to save labor transactions
   */
  async saveLaborTransaction(evt) {
    this.resetTaskDS();
    this.page.state.hideDeleteTimer = false;
    this.page.state.useConfirmDialog = false;
    let personInfo = evt.app.client.userInfo;
    let laborcode = evt.page.state.laborCode || personInfo.labor.laborcode;
    let siteID = personInfo.insertSite;
    let dataFormatter = evt.app.dataFormatter;
    let craft = ''; let skilllevel = ''; let startDate; let rate = 0;

    const labords = evt.page.findDatasource('reportworkLaborDetailds');
    const laborJsonDS = this.app.findDatasource('laborJsonDS');
    
    let WoDetailPageDs = evt.app.findDatasource('woDetailResource');
    const schPage = evt.app.findPage("schedule") || evt.app.findPage("approvals");
    let WoListPageDs = evt.app.findDatasource(schPage.state.selectedDS);

    // istanbul ignore if
    if (this.validateEndDateTime(evt) || !labords.state.canSave) {
      return;
    }

    craft = evt.page.state.craft;
    skilllevel = evt.page.state.skilllevel ? evt.page.state.skilllevel : '';
    rate = evt.page.state.rate || undefined;
    const vendor = evt.page.state.vendor ? evt.page.state.vendor : '';
    const contractnum = evt.page.state.contractnum ? evt.page.state.contractnum : '';
    this.page.state.outside = evt.page.state.outside;
    const craftdescription = labords?.item?.craftdescription
    // istanbul ignore next
    if (evt.page.state.errorMessage) {
      return;
    }

    // istanbul ignore next
    if (labords.item["startdate"]) {
      startDate = dataFormatter.dateWithoutTimeZone(labords.item["startdate"], true);
    }

    const startTime = dataFormatter.dateWithoutTimeZone(WOTimerUtil.removeSecondsFromTimeString(labords.item["starttime"]));
    const finishTime = dataFormatter.dateWithoutTimeZone(WOTimerUtil.removeSecondsFromTimeString(labords.item["finishtime"]));
    // istanbul ignore next
    if (evt.page.state.action === 'add') {
      const isSingleLabor = this.page.state.selectedLabors.size === 1;
      let laborList = [];
      // eslint-disable-next-line
      for (const [key, value] of this.page.state.selectedLabors) {
        // istanbul ignore else
        if (isSingleLabor) {
          // Set properties specific to a single labor item
          value.craft = this.page.state.craft;
          value.skilllevel = this.page.state.skilllevel;
          value.payrate = this.page.state.rate;
          value.vendor = this.page.state.vendor;
          value.contractnum = this.page.state.contractnum;
          value.premiumpaycode = CommonUtil.sharedData.premiumpaycode
          value.premiumpayhours = labords.item.premiumpayhours;
        }
        // Set common properties for all labor items
        value.transtype = labords.item["transtype"];
        value.transtype_description = labords.item["transtype_description"];
        value.regularhrs = labords.item["regularhrs"];
        value.startdate = startDate;
        value.starttime = startTime;
        value.finishdate = dataFormatter.dateWithoutTimeZone(labords.item["finishdate"]);
        value.finishtime = finishTime;
        value.siteid = siteID;
        value.taskid = labords.item.taskid;
        value.actualtaskid = labords.item.actualtaskid;
        value.task_description = labords.item.task_description;
        laborList.push(value);
      }
      // istanbul ignore next
      let option = {
        responseProperties: 'labtransid, anywhererefid'
      }
      const onDataFailedHandler = this.onSaveDataFailed.bind(this);
      try {
        this.page.state.useConfirmDialog = false;
        evt.page.state.loadinglabor = true;
        this.saveDataSuccessful = true;
        labords.on('put-data-failed', onDataFailedHandler);
        await labords.bulkAdd(laborList, option);
        this.page.state.selectedLabors.clear();
        this.page.state.laborDisplayName = ""
      }
      catch (err) {
        //handle error
      }
      finally {
        this.page.state.useConfirmDialog = false;
        evt.page.state.loadinglabor = false;
        this.saveDataSuccessful = true;
        labords.off('put-data-failed', onDataFailedHandler);
        laborJsonDS?.clearSelections();
      }
    } else {
      let labor = {
        craft: craft,
        regularhrs: labords.item["regularhrs"],
        startdate: startDate,
        starttime: startTime,
        finishdate: dataFormatter.dateWithoutTimeZone(labords.item["finishdate"]),
        finishtime: finishTime,
        laborcode: laborcode || labords.item["laborcode"],
        skilllevel: skilllevel,
        siteid: siteID,
        transtype: labords.item["transtype"],
        transtype_description: labords.item["transtype_description"],
        labtransid: labords.item["labtransid"],
        payrate: rate,
        href: labords.item["href"],
        anywhererefid: labords.item["anywhererefid"],
        craftdescription: craftdescription,
        displayname: labords.item.displayname,
        taskid: labords.item.taskid,
        actualtaskid: labords.item.actualtaskid,
        task_description:labords.item.task_description,
        vendor: vendor,
        contractnum: contractnum,
      };

      // istanbul ignore else 
      if (CommonUtil.sharedData.premiumpaycode && labords.item['premiumpayhours']) { 
        labor.premiumpaycode =  CommonUtil.sharedData.premiumpaycode;
        labor.premiumpayhours = labords.item.premiumpayhours;
      }

      if ((labords.item["timerstatus_maxvalue"] === 'ACTIVE' || labords.item["timerstatus_maxvalue"] === 'COMPLETE') && evt.page.state.timerStatusComplete) {
        if ((labor.finishdate || labor.finishtime) || (labor.startdate && labor.starttime && labor.regularhrs && labor.regularhrs > 0)) {
          labor.timerstatus = evt.page.state.timerStatusComplete.value;
          labor.timerstatus_maxvalue = evt.page.state.timerStatusComplete.maxvalue;
        }
      }

      let option = {
        responseProperties: 'labtransid, anywhererefid'
      }
      const onUpdateFailedHandler = this.onSaveDataFailed.bind(this);
      try {
        this.page.state.useConfirmDialog = false;
        evt.page.state.loadinglabor = true; 
        this.saveDataSuccessful = true;
        labords.on('update-data-failed', onUpdateFailedHandler);
        await labords.update(labor, option);
      }
      catch (err) {
        //handle error
      }
      finally {
        this.page.state.useConfirmDialog = false;
        evt.page.state.loadinglabor = false;
        this.saveDataSuccessful = true;
        labords.off('update-data-failed', onUpdateFailedHandler);
      }
    }
    this.closeToolsTransaction();
    // istanbul ignore next
    evt.page.findDialog("reportTimeDrawer").closeDialog();
    this.reloadLabor(evt, WoListPageDs, WoDetailPageDs, labords);
  }

  async reloadLabor(evt, WoListPageDs, WoDetailPageDs, labords) {
    try {
      evt.page.state.loadinglabor = true;
      const reportworkLaborDetailds =  await this.app.findDatasource("reportworkLaborDetailds");
      // istanbul ignore if
      if (Device.get().isMaximoMobile) {
        if (WoDetailPageDs) {
          await WoDetailPageDs.forceReload();
        }
        await evt.page.findDatasource('woDetailsReportWork').forceReload();
        await WoListPageDs.forceReload();
      }
      labords.clearQBE();
      await labords.searchQBE(undefined, true);
      // istanbul ignore if
      if (reportworkLaborDetailds?.name && reportworkLaborDetailds?.items.length) {
        await this.onAfterLoadData(reportworkLaborDetailds, reportworkLaborDetailds?.items);
      }
    } finally {
      evt.page.state.loadinglabor = false;
    }
  }

  openFailureDetails(event) {
    let workorder = event.item;
    let parentPage = this.page;
    let optionsParam = {'parentPage': parentPage};

    // istanbul ignore else
    if (workorder) {
      this.app.setCurrentPage({name: 'failureDetails', resetScroll: true, params: {...this.page.params, workorder}});
      // istanbul ignore else
      if (this.app.currentPage) {
        this.app.currentPage.callController('loadRecord', optionsParam);
        this.page.state.navigateToFailureDetails = true;
      }
    }
  }

  /**
   * Change the status of workorder to complete. 
   */
   async completeWorkorder(evt) {
    // Method Config for Calibration Operations
    const calMethodConfig = {
      method: "completeWorkorder",
      params: evt,
      pageName: "report_work"
    }

    // Validate Datasheet status if all required datasheet Marked as PASS/FAIl/BROKEN/MISMATCH and calibration workorder then it will be consider as completed
    // istanbul ignore else
    if (evt?.item?.iscalibration && evt?.item?.pluscwodscount > 0 && this.app.name !== "supmobile") {
      this.page.state.loadingcomp = true;
      const datasheetResult = await CommonUtil.validateDataSheet(this.app, this.page, evt?.item, calMethodConfig);
      this.page.state.loadingcomp = false;
      // istanbul ignore next
      if (!datasheetResult) {
        return;
      }
    }

    // Validate Actual Tools If any required datasheet marked as PASS/FAIL and calibration workorder then it will be execute
    // istanbul ignore else
    if (this.app.name !== "supmobile" && evt?.item?.iscalibration && evt?.item?.pluscwodscount > 0 && !this.app.state.skipToolWarning && !this.app.state.disableToolWarning) {
      const workOrder = {...evt?.item, actualtoolcount: this.page?.findDatasource('reportWorkActualToolsDs')?.items.length};
      const validateActualTool = await CommonUtil.validateActualTools(this.app, this.page, workOrder, calMethodConfig);
      // istanbul ignore next
      if (!validateActualTool) {
        return;
      }
    }

    let schedPage = this.app.findPage('schedule') || this.app.findPage("approvals");
    let workorder = evt.item;
    let dataSource = evt.datasource;
    let status = evt.status;
    let statusDescription;
    let statusMaxValue;

    let currDate = new Date();
    let dataFormatter = this.app.dataFormatter;
    currDate = dataFormatter.convertDatetoISO(currDate);

    // istanbul ignore else
    if (this.isDownPrompt(workorder)) {
      return false;
    }
     const synonymdomainData = this.app.findDatasource('synonymdomainData');
     const orgid = dataSource.item.orgid || this.app.client.userInfo.insertOrg;
     const siteid = dataSource.item.siteid || this.app.client.userInfo.insertSite;
     const woStatusData = status
       ? await SynonymUtil.getSynonymDomainByValue(synonymdomainData, 'WOSTATUS', status, dataSource.item.siteid, dataSource.item.orgid)
       : await SynonymUtil.getDefExtSynonymValueIdWithOrgSite(synonymdomainData, 'WOSTATUS', 'COMP', orgid, siteid);
    // istanbul ignore else
    if (woStatusData) {
      statusMaxValue = woStatusData.maxvalue;
      statusDescription = woStatusData.description;
    }
    const validStatus = (
      await CommonUtil.getOfflineAllowedStatusList(this.app, evt, false)
    ).some((e) => e.value === evt.status);
    if (!validStatus) {
      this.app.toast(
        this.app.getLocalizedLabel(
          "invalid_status",
          `Could not change '${evt.item.status_maxvalue}' status to '${evt.status}'.`
        ),
        "error"
      );
      return;
    }

    // istanbul ignore else
    if (this.page.state.enforceAssetScan === 1 && !this.app.state.disableScan && workorder.assetnumber) {
      const isScanRequired = await CommonUtil.checkScanRequired(statusMaxValue);
      // istanbul ignore else
      if (isScanRequired) {
        const scanResParam = { scanValue: null, assetnum: workorder.assetnumber, locationnum: workorder.locationnum, status: statusMaxValue };
        this.app.state.scanParameter = { app: this.app, page: this.page, evt: evt, method:"completeWorkorder", scanResParam: scanResParam };
        this.app.showDialog("appAssetScanDialog");
        return;
      }
    }
    // istanbul ignore else
    if (this.app.state.skipScan) {
      this.app.state.skipScan = false;
      let workOrderDetails = this.app.findPage("workOrderDetails");
      // istanbul ignore else
      if(workOrderDetails) {
        const message = this.app.getLocalizedLabel('worklog_woCompleted_without_scan', 'The work order was completed without scanning an asset.');
        await workOrderDetails.callController('saveWorkLog', {
          longDescription: "",
          summary: message,
          visibility: true
        }, true);
      }
    }

    // Signature Check
    // istanbul ignore else
    if (this.page.state.enableSignatureButton && !this.app.state.skipSignature) {
      await this.openSignatureDialog(evt);
      return;
    }

    this.app.state.skipToolWarning = false;
    this.app.state.disableScan = false;
    this.app.state.skipScan = false;
    this.app.state.skipSignature = false;

    try {
      this.page.state.loadingcomp = true;
      const statusArr = await CommonUtil.getOfflineAllowedStatusList(this.app, evt, false);
      // istanbul ignore next
      if (statusArr) {
        statusArr.forEach((obj) => {
          if (woStatusData?.value === obj.value) {
            status = obj.value;
            statusMaxValue = obj.maxvalue;
            statusDescription = obj.description;
          }
        });
      }
      let option = {
        record: workorder,
        parameters: {
          status: status,
          date: currDate,
        },
        responseProperties: 'status,status_maxvalue,status_description',
        localPayload: {
          status: status,
          status_maxvalue: statusMaxValue,
          status_description: statusDescription
        },
        query: { interactive: false },
        esigCheck: 0
      };
      // istanbul ignore else
      if (this.checkEsigRequired(status)) {
        option.esigCheck = 1;
      }
      let response = await dataSource.invokeAction('changeStatus', option);

      // istanbul ignore if
      if (response && Array.isArray(response) && response.length > 0) {
        response = response[0]._responsedata;
      }

      // istanbul ignore next
      if (response?.status && response?.status !== evt.item.status) {

        const laborDS = this.app.findDatasource('reportworkLaborDetailds');
        const activeLabTran = await WOUtil.getActiveLabTrans(this.app, laborDS);

        if (activeLabTran?.length > 0) {
          await WOTimerUtil.stopWorkOnStatusComp(this.app, activeLabTran, laborDS);
        }
        laborDS.clearQBE();
        await laborDS.searchQBE();
        let label = this.app.getLocalizedLabel(
          'woCompleted_label',
          `Work order ${(dataSource.item.wonum || '')} completed`, [(dataSource.item.wonum || '')]
        );
        this.app.toast(label, 'success');
        this.app.setCurrentPage(schedPage);
        let prevPageDatasource =
          schedPage.findDatasource(schedPage.state.selectedDS);
        await prevPageDatasource.forceReload();
      }
    } catch (err) {
      //handle error
    } finally {
      this.page.state.loadingcomp = false;
    }
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Completes an assignment and navigates to the schedule or approvals page.
   *
   * @async
   * @throws {Error} Will throw an error if there is a problem completing the assignment.
   *
   * @example
   * await completeAssignment();
   */
  async completeAssignment() {
    const woDetailDs = this.app.findDatasource("woDetailds");
    const assignmentDS = this.app.findDatasource("assignmentdomainData");
    try {
      this.page.state.loadingcomp = true;
      const index = woDetailDs.item?.assignment?.findIndex(assignment => assignment?.laborcode === this.app.client?.userInfo?.labor?.laborcode && assignment.assignmentid) ?? 0;
      const tempRecord = woDetailDs.item.assignment[index];
      await CommonUtil.completeAssigned(this.app, woDetailDs, tempRecord, assignmentDS);
      const message = `Assignment ${woDetailDs.item.wonum} was completed`;
      this.app.toast(
        this.app.getLocalizedLabel(
          'completed_wo', //to do change this before raising PR
          message,
          [woDetailDs.item.wonum]
        ),
        'success');
      const schPage = this.app.findPage("schedule") || this.app.findPage("approvals");
      //istanbul ignore if
      if (Device.get().isMaximoMobile) {
        let WoListPageDs = this.app.findDatasource(schPage.state.selectedDS);
        await WoListPageDs.forceReload();
      }
      this.page.state.loadingcomp = false;
      const schedPage = this.app.findPage('schedule') || this.app.findPage("approvals");
      this.app.setCurrentPage(schedPage);
    } catch (error) {
      log.t("Complete WO", "Failed assignment completion : work order --> " + woDetailDs.item?.wonum + "f--> " + error);
      this.page.state.loadingcomp = false;
    }
  }

  /**
   * In system properties we would get list of flag on which we have to ask for eSigCheck
   * if current status matches in list we would pass esigCheck 1 and on based of it graphite component
   * will handle to show prompt of esig
   * @returns 1 or 0 (boolean numeric value)
   */
  checkEsigRequired(status) {
    const esigCheck = this.app.state?.systemProp["maximo.mobile.wostatusforesig"];
    const allowedSignature = esigCheck
      .split(',')
      .map((status) => status.trim());
      const addEsig = allowedSignature.length > 0 &&
      allowedSignature.indexOf(status) > -1;
    return (addEsig) ? 1 : 0;
  }

  /**
   * Open labor lookup to select labor
   */
  async openLaborLookup(evt) {
    let laborDs = this.app.findDatasource('laborDs');
    await laborDs.initializeQbe();
    laborDs.setQBE('orgid', '=', evt.orgid);
    await laborDs.searchQBE(undefined, true);
    const laborJsonDS = this.app.findDatasource("laborJsonDS");
    laborJsonDS.reset(laborJsonDS.baseQuery, true, { resetItems: true, resetDataAdapter: true });
    await laborJsonDS?.load();
    laborJsonDS.items.forEach(item => {
      if (this.page.state.selectedLabors.get(item.laborcode)) {
        laborJsonDS.setSelectedItem(item, true);
      }
    });
    this.app.showDialog("laborLookup");
  }

 // Assisted by watsonx Code Assistant 
 /**
 * Sets the selected labor codes and their corresponding details.
 * @param {Event} evt The event object.
 */
  async setLabors() {
    this.page.state.loadinglabor = true;
    const laborJsonDS = this.app.findDatasource('laborJsonDS');
    const craftrateds = this.app.findDatasource('craftrate');
    craftrateds.clearState();
    craftrateds.resetState();
    const selectedLaborsList = laborJsonDS.getSelectedItems();
    const laborDisplayNames = [];
    selectedLaborsList.forEach((item, index) => {
      laborDisplayNames.push({'laborcode' : item.laborcode,'displayname': item.displayname || item.laborcode});
    });
    if (laborDisplayNames.length === 1) {
      this.page.state.laborCode = laborDisplayNames[0].laborcode;
      await this.setCraftSkill();
      await this.setPremiumPay(craftrateds);
    }
    await craftrateds.initializeQbe();
    craftrateds.setQBE('laborcode', 'in', laborDisplayNames.map(labor => labor.laborcode));
    craftrateds.setQBE('orgid', '=', this.app.userInfo.defaultOrg);
    await craftrateds.searchQBE(undefined, true);
    if (craftrateds?.item) {
      this.page.state.selectedLabors.clear()
      craftrateds.items.forEach((item, index) => {
        // istanbul ignore else
        if (item.defaultcraft) {
          this.page.state.selectedLabors.set(
            item.laborcode, {
            'laborcode': item.laborcode,
            'rate': item.rate,
            'outside': item.outside,
            'contractnum': item.contractnum || '',
            'craft': item.craft,
            'skilllevel': item.skillleveldata || '',
            'craftdescription': item.craftdescription,
            'vendor': item.vendor,
          }
          );
        }
      });
    }
    laborDisplayNames.forEach((item) => {
      if (this.page.state.selectedLabors.has(item.laborcode)) {
        const selectedLabor = this.page.state.selectedLabors.get(item.laborcode);
        selectedLabor.displayname = item.displayname;
        this.page.state.selectedLabors.set(item.laborcode, selectedLabor);
      }
    })
    this.page.state.laborDisplayName = Array.from(this.page.state.selectedLabors.values())
      .map(value => value.displayname)
      .join(' , ');

    if (this.page.state.selectedLabors.size === 1) {
      // eslint-disable-next-line
      for (const [laborKey, labor] of this.page.state.selectedLabors) {
        this.page.state.skilllevel = labor.skilllevel;
        this.page.state.vendor = labor.vendor;
        this.page.state.contractnum = labor.contractnum;
        this.page.state.laborDisplayName = labor.displayname;
        this.page.state.multipleLabors = false;
      }
    } else {
      this.page.state.skilllevel = '';
      this.page.state.vendor = '';
      this.page.state.contractnum = '';
      this.page.state.multipleLabors = true;
    }
    this.page.state.loadinglabor = false;
  }

  /**
   * Function to select labor
   */
  async selectLabor(evt) {
    let labords = this.page.findDatasource('reportworkLaborDetailds');
    labords.item["displayname"] = evt.displayname || evt.laborcode;
    this.page.state.laborCode = evt.laborcode;
    // istanbul ignore else 
    if (evt._selected) {
      await this.setCraftSkill(evt);
    }
    this.page.state.useConfirmDialog=true;
  }

  // Assisted by watsonx Code Assistant 
  /**
 * Sets the craft and skill level based on the selected labor code.
 * @param {Event} evt The event object.
 */
  async setCraftSkill(evt) {
    let craftrateds = this.app.findDatasource('craftrate');
    let labords = this.page.findDatasource('reportworkLaborDetailds');
    craftrateds.clearState();

    craftrateds.resetState();
    await craftrateds.initializeQbe();
    craftrateds.setQBE('laborcode', '=', this.page.state.laborCode);
    craftrateds.setQBE('orgid', '=', this.app.userInfo.defaultOrg); // DT241756 - MASISMIG-46119
    await craftrateds.searchQBE(undefined, true);
    this.page.state.craftdata = '';
    this.page.state.skilllevel = '';
    this.page.state.craft = '';
    labords.item["craftdescription"] = '';
    // istanbul ignore next
    if (craftrateds?.item) {
      craftrateds.items.forEach((item, index) => {
        // istanbul ignore else 
        if (item.defaultcraft && evt?.action !== 'update') {
          this.page.state.craftdata = item;

          labords.item["craftdescription"] = item.craftdescription;
          labords.item.contractnum = item.contractnum;
          labords.item.vendor = item.vendor;
          this.page.state.skilllevel = item.skillleveldata || '';
          this.page.state.craft = item.craft;
          this.page.state.vendor = item.vendor || '';
          this.page.state.contractnum = item.contractnum || '';
          this.page.state.outside = item.outside;
        }
        //istanbul ignore else
        if (evt?.action === 'add') {
          this.page.state.selectedLabors.set(
            this.page.state.laborCode, {
            'laborcode': evt.laborcode || this.page.state.laborCode,
            'displayname': evt.displayname || labords.item["displayname"],
            'outside': item.outside,
            'contractnum': item.contractnum || '',
            'craft': item.craft,
            'skilllevel': item.skillleveldata || '',
            'craftdescription': item.craftdescription,
            'vendor': item.vendor,
          }
          )
        }
      });
    }
  }

  /**
   *  function to search itemsDS with incoming context of itemId
   */
  async setIncomingContext() {
    let itemsDS;
    try {
      const context = this.app.state.incomingContext;
      itemsDS = await this.page.findDatasource('itemsDS');
      await itemsDS.initializeQbe();
      itemsDS.setQBE('itemnum', context.itemnum);
      itemsDS.setQBE('itemsetid', context.itemsetid);
      const itemData = await itemsDS.searchQBE();
      const datasource = this.page.findDatasource("woDetailsReportWork");
      const evt = {
        page: this.page,
        app: this.app,
        item: datasource.item
      }
      await this.openMaterialsDrawer(evt);
      // istanbul ignore if
      if (itemData && itemData.length > 0) {
        this.chooseMaterial(itemData[0]);
      };
    } finally {
      this.app.state.incomingContext = null;
      // istanbul ignore else 
      if (itemsDS?.lastQuery?.qbe && JSON.stringify(itemsDS?.lastQuery?.qbe) !== "{}") {
        itemsDS.clearQBE();
        await itemsDS.searchQBE(undefined, true);
      }
    }
  }

  /**
   * function to open tools drawer
   */
  async openToolsDrawer() {
    this.page.state.callMethodAction = 'TOOL';
    this.page.state.isBufferTools = false;
    this.page.state.assetCalDueDate = null;
    this.page.state.hideToolLookup = false;
    this.page.state.hideAssetLookup = false;
    let tools = this.page.findDatasource('reportWorkActualToolsDetailDs');
    await tools.forceReload();
    await tools.clearWarnings(tools.item, 'item_itemnum');
    //reset tools lookup datasource
    let toolds = this.app.findDatasource('toolDS');
    toolds.clearState();
    toolds.load();

    //Fetch the tasks
    await this.getWoTasks();

    await tools.addNew();

    tools.item['item_itemnum'] = '';
    tools.item['item_description'] = '';
    tools.item['toolqty'] = 1;
    tools.item['toolhrs'] = 1;
    tools.item['task_id'] = '';
    tools.item['task_description'] = '';
    this.page.state.itemnum = false;
    this.page.state.disableToolAction = true;
    this.page.state.isCalledOnce = false;
    this.page.state.rotatingAsset = false;
    this.page.state.isRotating = false; // reset to hide the Rotating asset on second load TS012428523
    this.resetToolStoreBinAsset();
    this.page.state.selectedTaskItem = undefined;
    if (this.isCalibrationWo()) {
      // Set Calibration Specific fields with empty value
      tools.item.pluscduedate = '';
      tools.item.plusctoolusedate = '';
      tools.item.pluscexpirydate = '';
      tools.item.plusctype = '';
      tools.item.pluscmanufacturer = '';
      tools.item.plusclotnum = '';
      tools.item.plusccomment = '';
      // Clear previous warnings
      this.clearCalToolWarning(tools, ['pluscmanufacturer', 'plusclotnum', 'plusctype', 'pluscexpirydate']);
      // Open Calibration Tools Drawer
      this.page.showDialog('calibrationToolsDrawer');
    } else {
      this.page.showDialog('toolsDrawer');
    }
    this.page.state.useConfirmDialog = false;
  }


  // Assisted by watsonx Code Assistant 
  /**
   * Chooses a tool from the tool lookup.
   *
   * @param {Object} evt - The event object.
   */
  async chooseTool(evt) {
    this.page.state.hideAssetLookup = false;
    let reportWorkToolsDs = this.page.findDatasource('reportWorkActualToolsDetailDs');
    // istanbul ignore else
    if (evt) {
      reportWorkToolsDs.item['item_itemnum'] = evt.itemnum;
      reportWorkToolsDs.item['item_description'] = evt.description;
      this.page.state.selectedTool = evt;
      this.page.state.itemnum = evt.itemnum;
      this.page.state.isRotating = evt.rotating;
      this.page.state.isBufferTools = evt.pluscsolution;
      this.page.findDialog('toolLookup').closeDialog();
      await this.resetTechnician();
      this.page.state.useConfirmDialog = true;
      if (this.isCalibrationWo()) {
        // Clear previous warnings
        this.clearCalToolWarning(reportWorkToolsDs, ['pluscmanufacturer', 'plusclotnum', 'plusctype', 'pluscexpirydate']);
        //istanbul ignore else
        if (!reportWorkToolsDs.item.assetnum) {
          await this.chooseCalAsset(evt);
        } else {
          this.validateToolData({page: this.page, app: this.app});
        }
      } else {
        await this.setToolStore();
      }
    }
  }

  /**
   * Function to set the store room when record is single and open store lookup for multiple records
   */
  async setToolStore() {
    let inventoryDS = this.page.findDatasource('inventoryToolDS');
    await inventoryDS?.initializeQbe();
    inventoryDS?.setQBE('itemnum', '=', this.page.state.itemnum);
    await inventoryDS?.searchQBE();
    const inventoryList = [];
    inventoryDS?.items.forEach((item) => {
      inventoryList.push(item.location);
    });
    let actualToolDS = this.page.findDatasource('reportWorkActualToolsDetailDs');
    if (inventoryList.length > 0) {
      let locationDS = this.page.findDatasource('locationDS');
      await locationDS.initializeQbe();
      locationDS.clearQBE();
      locationDS.setQBE('location', 'in', inventoryList);
      let locationData = await locationDS.searchQBE();
      if (locationData.length === 1) {
        actualToolDS.item['storeloc_desc'] = locationData[0].description;
        actualToolDS.item['storeloc'] = locationData[0].location;
        this.page.state.storeloc = locationData[0].location;
        this.page.state.multipleLocations = false;
        this.setToolBinNumber();
        this.validateToolData(this);
      } else {
        this.resetToolStoreBinAsset();
        this.openToolStoreLookup(this);
        this.page.state.multipleLocations = true;
      }
    } else {
      this.resetToolStoreBinAsset();
      this.page.state.multipleLocations = false;
    }
  }


  /**
   * Function to reset tool's store and inventory data
   */
  resetToolStoreBinAsset() {
    let actualToolDS = this.page.findDatasource('reportWorkActualToolsDetailDs');
    actualToolDS.item['storeloc_desc'] = '';
    actualToolDS.item['storeloc'] = '';
    this.page.state.storeloc = '';
    this.resetToolBinData();
    this.resetToolAssetData();
  }

  /**
   * Function to reset tool's store and inventory data
   */
  resetToolBinData() {
    let actualToolDS = this.page.findDatasource('reportWorkActualToolsDetailDs');
    actualToolDS.item['binnum'] = '';
    actualToolDS.item['lotnum'] = '';
    this.page.state.binnum = false;
  }

  /**
   * Function to reset tool's store and inventory data
   */
  resetToolAssetData() {
    let actualToolDS = this.page.findDatasource('reportWorkActualToolsDetailDs');
    actualToolDS.item['assetnum'] = '';
    actualToolDS.item['asset_description'] = '';
    this.page.state.rotatingAsset = false;
    this.page.state.assetCalDueDate = null;
    this.validateToolData({page: this.page, app: this.app}); 
  }

  /**
  * Resets the technician field in the datasource
  */
  resetTechnician() {
    let actualToolDS = this.page.findDatasource('reportWorkActualToolsDetailDs');
    actualToolDS.item['plusctechnician'] = '';
    this.page.state.laborCode = '';
  }

  /**
   * Function to choose the store room from lookup
   * @param {Object} evt event (contains the selected storeroom object)
   */
  async chooseToolStoreRoom(evt) {
    // istanbul ignore else
    if (evt) {
      this.page.datasources.reportWorkActualToolsDetailDs.item['storeloc_desc'] = evt.description;
      this.page.datasources.reportWorkActualToolsDetailDs.item['storeloc'] = evt.location;
      this.page.state.storeloc = evt.location;
      this.resetToolBinData();
      this.page.findDialog('toolStoreRoomLookup').closeDialog();
      this.setToolBinNumber();
      this.setToolRotatingAsset();
      this.validateToolData(this);
      this.page.state.useConfirmDialog = true;
    }
  }

  /**
   * Function to open the store room lookup
   * @param {Object} evt json object containg page and app objects
   */
  async openToolStoreLookup(evt) {
    evt.page.showDialog('toolStoreRoomLookup');
  }

  /**
   * Function to choose the bin from lookup
   * @param {Object} evt event (contains the selected tool inventory object)
   */
  chooseToolBinNumber(evt) {
    let actualToolDS = this.page.findDatasource('reportWorkActualToolsDetailDs');
    // istanbul ignore else
    if (evt) {
      if(evt.binnum) {
        this.page.state.binnum = evt.binnum;
        actualToolDS.item['binnum'] = evt.binnum;
      } else {
        this.page.state.binnum = '';
        actualToolDS.item['binnum'] = '';
      }

      if (evt.lotnum) {
        actualToolDS.item['lotnum'] = evt.lotnum ;
      } else {
        actualToolDS.item['lotnum'] = '';
      }

      this.page.findDialog('toolBinLookup').closeDialog();
      this.setToolRotatingAsset();
      this.page.state.useConfirmDialog = true;
    }
  }

  /**
   * Function to open the bin lookup
   * @param {Object} evt json object containing page and app objects
   */
  async openToolBinLookup(evt) {
    evt.page.showDialog('toolBinLookup');
  }

  /**
   * Function to set the bin number when record is single
   */
  async setToolBinNumber() {
    let actualToolDS = this.page.findDatasource('reportWorkActualToolsDetailDs');
    let binNumberDS = this.page.findDatasource('inventbalDS');
    await binNumberDS.initializeQbe();
    binNumberDS.clearQBE();
    binNumberDS.setQBE('siteid', '=', this.app.client.userInfo.defaultSite);
    binNumberDS.setQBE('itemnum', '=', this.page.state.itemnum);
    binNumberDS.setQBE('location', '=', this.page.state.storeloc);
    let binNumData = await binNumberDS.searchQBE();

    if (binNumData.length === 1) {
      if(binNumData[0].binnum) {
        actualToolDS.item.binnum = binNumData[0].binnum;
        this.page.state.binnum = binNumData[0].binnum;
      } else {
        actualToolDS.item.binnum = '';
        this.page.state.binnum = '';
      }
      actualToolDS.item.lotnum = binNumData[0].lotnum || ""; 
      this.page.state.multipleBins = false;
      this.setToolRotatingAsset();
    } else if (binNumData.length > 1) {
      this.page.state.multipleBins = true;
      this.openToolBinLookup(this);
    } else {
      this.resetToolBinData();
    }
  }

  /**
   * Function to open tool lookup for tool search
   */
  async openToolsLookup() {
    // istanbul ignore else
    if (this.isCalibrationWo()) {
      await this.resetToolLookup();
    }
    this.page.showDialog('toolLookup');
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Resets the lookup for tools.
   * @param {string} itemnum - The item number of the selected tool.
   */
  async resetToolLookup() {
    const actualToolDS = this.page.findDatasource('reportWorkActualToolsDetailDs');
    const toolDs = this.page.findDatasource('toolDS');
    toolDs.clearState();
    if (this.page.state.selectedTool?.itemnum && actualToolDS.item?.assetnum) {
      await toolDs.initializeQbe();
      toolDs.setQBE('itemnum','=', this.page.state.selectedTool.itemnum);
    } else {
      toolDs.clearQBE();
    }
    await toolDs.searchQBE(undefined, true);
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Resets the rotating asset for a given organization ID.
   * @param {string} evt - event object.
   */
  async openCalRotatingAssetLookup(evt) {
    await this.resetRotatingAssetLookup();
    evt.page.showDialog('calibrationToolRotatingAssetLookup');
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Choose Calibrating Rotating Asset
   * @param {Object} evt - Event object
   */
  async selectCalRotatingAsset(evt) {
    // Declarations
    this.page.state.hideToolLookup = false;
    const actualToolDS = this.page.findDatasource('reportWorkActualToolsDetailDs');
        
    // Default Val
    this.page.state.rotatingAsset = true;
    this.page.state.selectedTool = evt;
    this.page.state.assetCalDueDate = evt?.pluscduedate_np;

    // Set Value
    actualToolDS.item.assetnum = evt.assetnum;
    actualToolDS.item.asset_description = evt.description;
    actualToolDS.item.pluscduedate = evt.pluscduedate_np? this.app.dataFormatter.convertDatetoISO(evt.pluscduedate_np) : "";

    // Select Tool
    // istanbul ignore else 
    if (!actualToolDS.item.item_itemnum) {
      await this.chooseCalTool(evt);
    }

    // Close Calibration Asset Lookup
    this.page.findDialog('calibrationToolRotatingAssetLookup')?.closeDialog();

    // Validations
    this.page.state.useConfirmDialog = true;
    this.validateToolData(this);

    // Rotating Asset Circular validation
    // istanbul ignore else 
    if (evt?.iscalibration && evt?.caltooltrans?.length > 0) {
      await this.validateRotatingAsset(evt);
    }
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Choose Cal Tool
   * @param {Event} evt Event object
   */
  async chooseCalTool(evt) {
    const toolDs = this.page.findDatasource('toolDS');
    const actualToolDS = this.page.findDatasource('reportWorkActualToolsDetailDs');

    // Filter Tools based on rotating asset
    //istanbul ignore else
    if (evt.itemnum) {
      toolDs.clearState();
      await toolDs.initializeQbe();
      toolDs.setQBE('itemnum','=', evt.itemnum);
      await toolDs.searchQBE(undefined, true);
    } else {
      this.page.state.hideToolLookup = true;
      return;
    }
    

    // Set Tool
    //istanbul ignore else
    if (toolDs.items.length === 1) {
      actualToolDS.item.item_itemnum = toolDs.item.itemnum;
      actualToolDS.item.item_description = toolDs.item.description;
      this.page.state.itemnum = toolDs.item.itemnum;
      this.page.state.isRotating = toolDs.item.rotating || false;
      this.page.state.isBufferTools = toolDs.item.pluscsolution || false;
      // Clear previous warnings
      this.clearCalToolWarning(actualToolDS, ['pluscmanufacturer', 'plusclotnum', 'plusctype', 'pluscexpirydate']);
      this.validateToolData(this);
    } else if(toolDs.items.length > 1) {
      this.page.showDialog('toolLookup');
    } else {
      this.page.state.hideToolLookup = true;
      this.validateToolData(this);
    }
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Choose Calibration Asset
   * @param {Event} evt Event object
   */
  async chooseCalAsset(evt) {
    // Declarations
    const rotatingAssetDS = this.page.findDatasource('rotatingAssetDS');
    const actualToolDS = this.page.findDatasource('reportWorkActualToolsDetailDs');

    // Filter Tools based on rotating asset
    if(evt?.itemnum) {
      rotatingAssetDS.clearState();
      await rotatingAssetDS.initializeQbe();
      rotatingAssetDS.setQBE('itemnum','=', evt?.itemnum);
      await rotatingAssetDS.searchQBE(undefined, true);
    } else {
      this.page.state.hideAssetLookup = true;
      return;
    }

    // Set Tool
    //istanbul ignore else
    if (rotatingAssetDS.items.length === 1) {
      this.page.state.assetCalDueDate = rotatingAssetDS.item?.pluscduedate_np;
      actualToolDS.item.assetnum = rotatingAssetDS.item.assetnum;
      actualToolDS.item.asset_description = rotatingAssetDS.item.description;
      actualToolDS.item.pluscduedate = rotatingAssetDS.item.pluscduedate_np? this.app.dataFormatter.convertDatetoISO(rotatingAssetDS.item.pluscduedate_np) : "";
      this.page.state.rotatingAsset = true;
      this.validateToolData({page: this.page, app: this.app});
      // Rotating Asset Circular validation
      //istanbul ignore if
      if (rotatingAssetDS.item?.iscalibration && rotatingAssetDS.item?.caltooltrans?.length > 0) {
        await this.validateRotatingAsset(rotatingAssetDS.item);
      }
    } else if (rotatingAssetDS.items.length > 1) {
      this.page.showDialog('calibrationToolRotatingAssetLookup');
    } else {
      this.page.state.hideAssetLookup = true;
      this.validateToolData(this);
    }
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Resets the rotating asset field.
   */
  resetRotatingAssetField() {
    const actualToolDS = this.page.findDatasource('reportWorkActualToolsDetailDs');
    this.page.state.hideToolLookup = false;
    actualToolDS.item.assetnum = "";
    actualToolDS.item.asset_description = "";
    this.page.state.assetCalDueDate = null;
    actualToolDS.item.pluscduedate = "";
    this.validateToolData({page: this.page, app: this.app});
  }

  // Assisted by watsonx Code Assistant 
  // Code generated by WCA@IBM in this programming language is not approved for use in IBM product development.
  /**
   * Closes a dialog box with the ID "calRotatingAssetWarning" on a web page.
   */
  closeCalRotAssetError() {
    this.page.findDialog('calRotatingAssetWarning')?.closeDialog();
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Resets the tool field data.
   */
  resetToolField() {
    const actualToolDS = this.page.findDatasource('reportWorkActualToolsDetailDs');
    this.page.state.hideAssetLookup = false;
    actualToolDS.item.item_itemnum = "";
    actualToolDS.item.item_description = "";
    this.page.state.itemnum = false;
    this.page.state.isBufferTools = false;
    this.page.state.isRotating = false;
    this.validateToolData({page: this.page, app: this.app});
    // Clear previous warnings
    this.clearCalToolWarning(actualToolDS, ['pluscmanufacturer', 'plusclotnum', 'plusctype', 'pluscexpirydate']);
  }

  /**
   * Function to choose the rotating asset from lookup
   * @param {Object} evt event containing chosen rotating asset object
   */
  async chooseToolRotatingAsset(evt) {
    const actualToolDS = this.page.findDatasource('reportWorkActualToolsDetailDs');
    this.page.state.isBufferTools = false;

    // istanbul ignore else
    if (evt) {
      actualToolDS.item['assetnum'] = evt.assetnum;
      actualToolDS.item['asset_description'] = evt.description;
      this.page.state.rotatingAsset = true;
      this.page.findDialog('toolRotatingAssetLookup')?.closeDialog();
      this.validateToolData(this);
      this.page.state.useConfirmDialog = true;
    }
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Clears warnings for specific fields in a dataset.
   * @param {object} ds - The datasource.
   * @param {array} fields - An array of field names.
   */
  clearCalToolWarning(ds, fields) {
    fields.forEach((field) => {
      ds.clearWarnings(
        ds.item,
        field
      );
    });
  }

  /**
  * Saves the technician to the datasource
  */
  saveTechnician() {
    this.page.state.skipQualification = true;
    this.chooseTechnician(this.page.state.qualificationParams);
  }

  /**
  * Choose a technician from the list of available technicians
  * @param {Object} evt - The event object
  */
  async chooseTechnician(evt) {
    this.page.state.qualificationParams = {};
    const reportData = this.page?.findDatasource('woDetailsReportWork')?.item;
    // istanbul ignore else
    if (this.app.name !== "supmobile" && this.page.state.selectedTool?.toolqual?.length && reportData?.iscalibration && reportData?.pluscwodscount > 0 && reportData?.pluscqualtech > 0 && !this.page.state.skipQualification) {
      const result = await this.validateQualification(evt?.laborqual || [], this.page.state.selectedTool.toolqual);
      // istanbul ignore next
      if (!result) {
        if (reportData?.pluscqualtech === "1") {
          this.page.state.qualificationParams = evt;
          this.page.showDialog('qualificationWarning');
        } else {
          this.page.showDialog('qualificationError');
        }
        this.resetTechnician();
        return;
      }
    }
    this.page.state.skipQualification = false;

    let actualToolDS = this.page.findDatasource('reportWorkActualToolsDetailDs');
    // istanbul ignore else
    if (evt) {
      actualToolDS.item['plusctechnician'] = evt.laborcode;
      this.app.findDialog('technicianLookup')?.closeDialog();
      this.page.state.laborCode = evt.laborcode;
      this.validateToolData(this);
      this.page.state.useConfirmDialog = true;
    }
  }

  /**
   * Function to set the rotating asset when record is single and open asset lookup for multiple records
   */
  async setToolRotatingAsset() {
    let actualToolDS = this.page.findDatasource('reportWorkActualToolsDetailDs');
    let rotatingAssetDS = this.page.findDatasource('rotatingAssetDS');
    await rotatingAssetDS.initializeQbe();
    rotatingAssetDS.setQBE('itemnum', '=', this.page.state.itemnum);
    rotatingAssetDS.setQBE('location', '=', this.page.state.storeloc);
    // istanbul ignore else
    if(this.page.state.binnum) rotatingAssetDS.setQBE('binnum', '=', this.page.state.binnum);
    let rotatingAsset = await rotatingAssetDS.searchQBE();

    if (rotatingAsset && rotatingAsset.length === 1) {
      actualToolDS.item['assetnum'] = rotatingAsset[0].assetnum;
      actualToolDS.item['asset_description'] = rotatingAsset[0].description;
      this.page.state.rotatingAsset = true;
      this.page.state.multipleRotatingAsset = false;
      this.validateToolData(this);
    } else if (rotatingAsset && rotatingAsset.length > 1) {
      this.resetToolAssetData();
      this.page.state.multipleRotatingAsset = true;
      this.openToolRotatingAssetLookup(this);
    } else {
      this.resetToolAssetData();
      this.page.state.multipleRotatingAsset = false;
      this.validateToolData(this);
    }
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Validates the due date of a tool asset.
   * @param {object} assetdata - The asset data to validate.
   * @returns {Promise<boolean>} A promise that resolves to true if the due date is valid, false otherwise.
   */
  async validateToolDueDate(dueDate, useDate) {
    const maxVars = CommonUtil.filterMobileMaxvars('PLUSCPASTDUEVAL', this.app.findDatasource('defaultSetDs'));
    return maxVars[0]?.varvalue === '1' && dueDate? await this.validateDate(dueDate, useDate) : true;
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Validates the selected rotating asset against the maximum allowed assets for the current user.
   * 
   * @param {Object} selectedAsset - The selected rotating asset object.
   * @returns {void}
   */
  async validateRotatingAsset(selectedAsset) {
    const maxVars = CommonUtil.filterMobileMaxvars('PLUSCROTASSET', this.app.findDatasource('defaultSetDs'));
    const actualToolDS = this.page.findDatasource('reportWorkActualToolsDetailDs');
    // istanbul ignore else
    if(maxVars[0].varvalue !== "0") {
      const reportData = this.page?.findDatasource('woDetailsReportWork')?.item;
      const isInvalidAsset = selectedAsset.caltooltrans.some((itm) => itm.rotassetnum === reportData.assetnumber)
      // istanbul ignore else
      if (isInvalidAsset) {
        if (maxVars[0].varvalue === "1") {
          this.page.state.calDialogMessage = this.app.getLocalizedLabel(
            "dialog_calrotatingasset_warning",
            `The rotating asset ${ reportData.assetnumber } was recently used as calibration tool for rotating asset ${ actualToolDS.item.assetnum }. You should select a different rotating asset for this calibration.`,
            [reportData.assetnumber],
            [actualToolDS.item.assetnum]
          );
          this.page.showDialog('calRotatingAssetWarning');
        } else {
          this.page.state.calDialogMessage = this.app.getLocalizedLabel(
            "dialog_calrotatingasset_error",
            `The rotating asset ${ reportData.assetnumber } was recently used as calibration tool for rotating asset ${ actualToolDS.item.assetnum }. You must select a different rotating asset for this calibration.`,
            [reportData.assetnumber],
            [actualToolDS.item.assetnum]
          );
          this.page.showDialog('calRotatingAssetError');
        }
      }
    }
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Checks if the current work order is a calibration work order.
   * @returns {boolean} True if the work order is a calibration work order, false otherwise.
   */
  isCalibrationWo() {
    const reportData = this.page?.findDatasource('woDetailsReportWork')?.item;
    return reportData?.iscalibration && reportData?.pluscwodscount > 0 && this.app.name !== 'supmobile';
  }

  /**
  * Validates the qualifications of the technician against the qualifications required for the selected tool
  * @param {Array} laborQual - The array of qualifications for the technician
  * @param {Array} toolQual - The array of qualifications required for the selected tool
  * @returns {Boolean} - True if the technician has all the required qualifications, false otherwise
  */
  async validateQualification(laborQual, toolQual) {
    const commonQual = toolQual.filter(tool => {
        return laborQual.some(({qualificationid}) => tool.qualificationid === qualificationid)
    });
    return commonQual.length === toolQual.length;    
  }

  /**
   * Validates the due date of the work order
   * @param {String} dueDate - The due date of the work order
   * @returns {Boolean} - True if the due date is in the future, false otherwise
   */
  async validateDate(dueDate, useDate) {
    const dataFormatter = this.app.dataFormatter;
    const currentDate = dataFormatter.convertDatetoISO(new Date());
    return useDate ? useDate <= dueDate : currentDate <= dueDate;
  }

  /**
   * Function to open tool rotating asset lookup
   * @param {Object} evt json object containing page and app objects
   */
  async openToolRotatingAssetLookup(evt) {
    evt.page.showDialog('toolRotatingAssetLookup');
  }

  
  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Resets the rotating asset lookup.
   */
  async resetRotatingAssetLookup() {
    const rotatingAssetDS = this.page.findDatasource('rotatingAssetDS');
    const actualToolDS = this.page.findDatasource('reportWorkActualToolsDetailDs');
    //istanbul ignore if
    if (this.page.state.itemnum && actualToolDS.item.item_itemnum) {
      await rotatingAssetDS.initializeQbe();
      rotatingAssetDS.setQBE('itemnum','=', this.page.state.itemnum);
    } else {
      rotatingAssetDS.clearState();
      rotatingAssetDS.clearQBE();
    }
    await rotatingAssetDS.searchQBE(undefined, true);
  }

  /**
   * Function to open Technician lookup
   * @param {Object} evt json object containing page and app objects
   */
  async openTechnicianLookup(evt) {
    let laborDs = this.app.findDatasource('laborDs');
    laborDs.clearState();
    await laborDs.initializeQbe();
    laborDs.clearQBE();
    laborDs.setQBE('orgid', '=', evt.orgid);
    await laborDs.searchQBE(undefined, true);
    let selectedItem;
    laborDs.items.forEach(item => {
      // istanbul ignore next
      if (item.laborcode === evt.page.state.laborCode) {
        selectedItem = item;
      }
    });

    // istanbul ignore if
    if (selectedItem) {
      laborDs.setSelectedItem(selectedItem, true);
    }
    this.app.showDialog("technicianLookup");
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Opens the manufacturer lookup dialog.
   * @param {object} evt - The event object.
   */
  openManufacturerLookup(evt) {
    evt.page.showDialog('manufacturerLookup');
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Chooses a manufacturer from the manufacturer lookup dialog.
   * @param {object} evt - The event object.
   */
  async chooseManufacturer(evt) {
    await this.resetManufacturerLookup();
    const actualToolDS = this.page.findDatasource('reportWorkActualToolsDetailDs');
    actualToolDS.item.pluscmanufacturer = evt?.company;
    this.page.findDialog('manufacturerLookup')?.closeDialog();
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Resets the manufacturer lookup dialog.
   */
  async resetManufacturerLookup() {
    const dsManufacturer = this.page.findDatasource('dsManufacturer');
    dsManufacturer.clearState();
    await dsManufacturer.initializeQbe();
    await dsManufacturer.searchQBE(undefined, true);
  }

  /**
   * Function to get the tasks
   */
  async getWoTasks() {
    const woDetailds = this.app.findDatasource('woDetailds');
    const woHref = this.page.params.itemhref || this.page.params.href;
    if (!woHref) {
      this.page.state.canLoadWoDetailDS = false;
    }
    await woDetailds.load({ noCache: true, itemUrl: woHref });
    this.page.state.canLoadWoDetailDS = true;

    const taskds = this.app.findDatasource('woPlanTaskDetailds');
    // istanbul ignore else
    if (woHref && taskds) {
      await taskds.load();
      this.page.state.reportWorkTaskCount = taskds.items.length;
    }
  }

  /**
   * Function to open the task lookup
   * @param {Object} evt json object containg page and app objects
   */
  async openTaskLookup(evt) {
    const taskds = this.app.findDatasource('woPlanTaskDetailds');
    //Reset the prev selection and highlight the selected item
    taskds.clearSelections();

    await taskds.initializeQbe();
    await taskds.clearQBE();
    taskds.setQBE('status', 'in', ['INPRG', 'WMATL', 'APPR', 'WSCH', 'WPCOND', 'COMP']);
    await taskds.searchQBE();
    // istanbul ignore else
    if (this.page.state.selectedTaskItem) {
      taskds.setSelectedItem(this.page.state.selectedTaskItem, true);
    }

    evt.page.showDialog('toolTaskLookup');

  }

// Assisted by watsonx Code Assistant 
/**
 * Opens the premium pay code lookup dialog.
 * @param {Event} evt The event that triggered the function.
 */
  async openPremiumPayCodeLookup(evt) {
    evt.page?.showDialog('premiumPayLookup');
  }

  /**
   * Function to choose the rotating asset from lookup
   * @param {Object} evt containing chosen task object
   */
  async chooseTask(evt) {
    let actualToolDS = this.page.findDatasource('reportWorkActualToolsDetailDs');
    let labords = this.page.findDatasource('reportworkLaborDetailds');
    let actualMaterialDS = this.page.findDatasource('reportWorkActualMaterialDs');

    // istanbul ignore else
    if (evt) {
      actualToolDS.item['task_description'] = evt.description;
      actualToolDS.item['task_id'] = evt.taskid;
      this.page.state.taskid = evt.workorderid;

      //Set selected taskid to labor ds
      labords.item.task_description = evt.description;
      labords.item.taskid = evt.taskid;
      labords.item.actualtaskid = evt.taskid;
      this.page.state.selectedTaskItem = evt;

      //Set selected taskid to material ds
      actualMaterialDS.item['task_description'] = evt.description;
      actualMaterialDS.item['task_id'] = evt.taskid;
      this.page.findDialog('toolTaskLookup').closeDialog();
      this.page.state.useConfirmDialog = true;
    }
  }

  /**
   * Function to save the tool data
   * @param {Object} evt which contains app and page objects
   */
  async saveToolDetail(evt) {
    this.resetTaskDS();
    this.page.state.useConfirmDialog = false;
    // istanbul ignore else
    if (!evt.page.state.isCalledOnce) {
      let toolDs = evt.page.findDatasource('reportWorkActualToolsDetailDs');
      let toolListDs = evt.page.findDatasource('reportWorkActualToolsDs');
      let toolData = {
        itemnum: toolDs.item.item_itemnum,
        description: toolDs.item.item_description,
        toolqty: toolDs.item.toolqty,
        toolhrs: toolDs.item.toolhrs,
        taskid: toolDs.item.task_id,
        rotassetnum: toolDs.item.assetnum,
        toolitem: {
          description: toolDs.item.item_description
        }
      };

      // istanbul ignore else
      if (this.isCalibrationWo()) {
        const result = await this.validateToolDueDate(toolDs?.item?.pluscduedate, toolDs?.item?.plusctoolusedate);
        // istanbul ignore if
        if (!result) { 
          this.page.showDialog('toolsDueDateError');
          return; 
        }
        toolData.plusctechnician = toolDs.item?.plusctechnician;
        toolData.pluscduedate = toolDs.item?.pluscduedate;
        toolData.plusctoolusedate = toolDs.item?.plusctoolusedate;
        toolData.pluscexpirydate = toolDs.item?.pluscexpirydate;
        toolData.plusctype = toolDs.item?.plusctype;
        toolData.pluscmanufacturer = toolDs.item?.pluscmanufacturer;
        toolData.plusclotnum = toolDs.item?.plusclotnum;
        toolData.plusccomment = toolDs.item?.plusccomment;
      }

      let option = {
        responseProperties: 'tooltransid, anywhererefid'
      };
      const onDataFailedHandler = this.onSaveDataFailed.bind(this);
      try {
        this.page.state.useConfirmDialog = false;
        evt.page.state.loadingToolDetail = true;
        evt.page.state.isCalledOnce = true;
        this.saveDataSuccessful = true;
        toolDs.on('put-data-failed', onDataFailedHandler);
        await toolDs.put(toolData, option);
        evt.page.findDialog(this.isCalibrationWo() ? 'calibrationToolsDrawer' : 'toolsDrawer')?.closeDialog();
        await toolDs.forceReload();
        await toolListDs.forceReload()
      } finally {
        this.page.state.useConfirmDialog = false;
        evt.page.state.isCalledOnce = true;
        evt.page.state.loadingToolDetail = false;
        this.saveDataSuccessful = true;
        toolDs.off('put-data-failed', onDataFailedHandler);
      }
    }
  }

  /**
   * Function to validate the tool form
   * @param {Object} evt which contains current (ReportWorkPageController) objects
   */
  async validateToolData(evt) {
    let toolDs = evt.page.findDatasource('reportWorkActualToolsDetailDs');
    await toolDs.load();
    const toolData = toolDs.item;
    const toolItem = toolData?.item_itemnum;
    const toolQty = toolData?.toolqty;
    const toolhrs = toolData?.toolhrs;
    const isRotatingAsset = evt.page.state.isRotating;
    const rotatingAssetNum = toolData?.assetnum;

    let isValid;
    if (this.isCalibrationWo()) {
      isValid = isRotatingAsset ? (toolItem && toolQty > 0 && toolhrs > 0 && rotatingAssetNum)
      : (toolItem && toolQty > 0 && toolhrs > 0);
      // istanbul ignore else
      if (this.page.state.isBufferTools && isValid) {
        isValid = toolData?.pluscexpirydate && toolData?.plusctype && toolData?.plusclotnum && toolData?.pluscmanufacturer;
      }
    } else {
      isValid = isRotatingAsset ? (toolItem && toolQty > 0 && toolhrs > 0 && rotatingAssetNum)
      : (toolItem && toolQty > 0 && toolhrs > 0);
    }

    if (isValid && !toolDs.hasWarnings(toolDs.item,'toolqty')) {
      evt.page.state.disableToolAction = false;
      toolDs.clearWarnings(toolDs.item, 'item_itemnum');
    } else {
      evt.page.state.disableToolAction = true;
      toolDs.setWarning(toolDs.item, 'item_itemnum');
    }
    // istanbul ignore else
    if(toolQty > 1 || toolhrs > 1){
      this.page.state.useConfirmDialog = true;
    }

    if(toolQty > 0){
      toolDs.clearWarnings(toolDs.item, 'toolqty');
    }
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Removes the store location from the report work tools detail data source.
   * @param {Event} event The event object.
   */
  removeStore(event) {
    // istanbul ignore else
    if (event) {
      const reportWorkToolsDs = this.app.findDatasource("reportWorkActualToolsDetailDs");
      reportWorkToolsDs.item['storeloc'] = null;
      reportWorkToolsDs.item['storeloc_desc'] = null;
    }
  }

  /**
   * @param - event raised from the component.
   * This method use to open signature dialog.
   */
  //istanbul ignore next
  async openSignatureDialog(event) {
    let workorder = event.item;

    //istanbul ignore else
    if (!workorder?.href) {
      this.page.state.canLoadWoDetails=false;
		}
    const wodetails = this.app.findDatasource('wodetails');
    await wodetails.load({noCache: true, itemUrl: workorder.href});
    this.page.state.canLoadWoDetails=true;
    this.app.userInteractionManager.openSignature(
      imageData => {
        log.t(TAG, 'base64 image' + imageData);
      }
      ,
      {
        imageFormat: null,
        primaryIcon: null,
        secondaryIcon: null,
        heading: null,
        primaryButtonSaveText: null,
        secondaryButtonDiscardText: null,
        signatureLabel: null,
        filename: this.page.state.compDomainStatus,
        datasource: this.app.findDatasource('signatureAttachment'),
        onUpload: this.onUpload.bind(this),
      })
  }

  /**
   * this method checks if Downtime dialog is prompted.
   */
  isDownPrompt(event) {
    if (event.downprompt === '1' && event.assetnumber && !event.assetisrunning && !this.page.state.reportWorkPrompt[event.wonum]) {
      this.app.callController('checkDownPrompt', { workorder: event, page: this.page });
      this.page.state.reportWorkPrompt[event.wonum] = true;
      return true;
    }
    return false;
  }


  /**
   * This method invokes complete work API once image is uploaded.
   */
  async onUpload() {
    let datasource = this.page.findDatasource("woDetailsReportWork");
    let statusData = this.app.state?.systemProp['maximo.mobile.completestatus'];
    const workorder = {
      item: datasource.item,
      datasource: datasource,
      status: statusData
    }
    this.app.state.skipSignature = true;
    await this.completeWorkorder(workorder);
  }

  /** Function to open reserve material page.
   * @param event should contain
   * item - The Work Order selected.
   */
  async openReservedMaterials(event) {
    this.page.state.openedFrom = 'reportwork';
    this.app.setCurrentPage({ name: 'reserveMaterials', params: { href: event.item.href, wonum: event.item.wonum }});
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Handles blur events for labor time input fields.
   *
   * @param {Event} event - The blur event object.
   * @private
   */
   laborBlurTimeEvent(event) {
     if (event?.target?.value) {
      const id = event.target.attributes.id.value.toLowerCase();
      const attribute = id === 'endtime' ? 'finishtime' : id;
      let ds = this.app.findDatasource('reportworkLaborDetailds');
      if (event.dataFormatValid) {
        ds.clearWarnings(ds.item, attribute);
      } else {
        let message = {};
        ds.clearWarnings(ds.item, attribute);
        message[attribute] = 'Invalid time';
        ds.addWarnings(ds.getId(ds.item), message, false);
      }
    }
   }

  // Assisted by watsonx Code Assistant 
  /**
   * Opens the tools details drawer.
   * 
   * @param {object} event - The event object containing the tooltransid parameter.
   * @returns {void}
   */
  async openToolsDetailsDrawer(event) {
    const reportWorkActualToolsDs = this.page.findDatasource('reportWorkActualToolsDs');
    await reportWorkActualToolsDs.initializeQbe();
    reportWorkActualToolsDs.setQBE('itemnum', '=', event.itemnum);
    reportWorkActualToolsDs.setQBE('anywhererefid', '=', event.anywhererefid);
    await reportWorkActualToolsDs.searchQBE(undefined, true);

    // fetching the non-persistent field from asset datasource
    //istanbul ignore if
    if (reportWorkActualToolsDs?.items?.length) {
      const rotatingAssetDS = this.page.findDatasource('rotatingAssetDS');
      await rotatingAssetDS.initializeQbe();
      rotatingAssetDS.setQBE('assetnum', '=', reportWorkActualToolsDs?.item?.rotassetnum);
      await rotatingAssetDS.searchQBE(undefined, true);
      reportWorkActualToolsDs.item.pluscduedate_np = rotatingAssetDS?.item?.pluscduedate_np;
    }
    this.page.showDialog("toolsDetailsDrawer");
  }

  // Assisted by watsonx Code Assistant 
  /**
   * This function is used to close the tools details drawer.
   */
  async onCloseToolsDetailsDrawer() {
    this.page.findDialog("toolsDetailsDrawer").closeDialog();
    const reportWorkActualToolsDs = this.app.findDatasource('reportWorkActualToolsDs');
    reportWorkActualToolsDs.clearQBE();
    await reportWorkActualToolsDs.searchQBE(undefined, true);
  }

  // Assisted by watsonx Code Assistant 
  // Code generated by WCA@IBM in this programming language is not approved for use in IBM product development.
  /**
   * This function is used to show the remove tool warning dialog.
   */
  showRemoveToolWarning() {
    this.page.showDialog('removeToolWarning');
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Removes a tool from the workorder.
   * @returns {Promise<void>} A promise that resolves when the tool is successfully removed or rejects with an error message if the removal fails.
   */
  async removeTool() {
    this.page.state.loading = true;
    let errorOccured = false;
    const reportWorkActualToolsDs = this.page.findDatasource('reportWorkActualToolsDs');
    const toolDescription = reportWorkActualToolsDs?.item?.toolitem?.description || '';
    const option = {
      localPayload: {
        href: reportWorkActualToolsDs?.item?.href,
      },
    };
    try {
      await reportWorkActualToolsDs.deleteItem(reportWorkActualToolsDs?.items[0], option);
      this.page.findDialog("toolsDetailsDrawer").closeDialog();
    } catch (error) {
      errorOccured = true;
      log.t(TAG, error);
    } finally {
      let msg = `Successfully removed tool ${toolDescription}`;
      let msgKey = "tool_delete_reject_success";
      let type = "success";
      //istanbul ignore if
      if (errorOccured) {
        msg = `The tool ${toolDescription} was not removed`;
        msgKey = "tool_delete_reject_failure";
        type = "error";
      }
      reportWorkActualToolsDs.clearQBE();
      await reportWorkActualToolsDs.searchQBE(undefined, true);
      this.app.toast(this.app.getLocalizedLabel(msgKey, msg), type);
      this.page.state.loading = false;
    }
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Opens the spare part details page for a specific work order.
   *
   * @param {Object} event - The event object containing the work order number (wonum) and the spare part's href.
   * */
  openAssetSparePart(event){
    this.app.setCurrentPage({ name: 'sparePart', params: { href: event.item.href, wonum: event.item.wonum }});
  }

  // Assisted by watsonx Code Assistant 

  /**
   * Opens the report tools page with the provided parameters.
   *
   * @param {Object} event - The event object containing the necessary data.
   * @param {Object} event.item - The item object containing the following properties:
   * @param {string} event.item.href - The href value for the report tools page.
   * @param {string} event.item.wonum - The wonum value for the report tools page.
   * @param {string} event.item.asset_description - The asset description value for the report tools page.
   * @param {string} [event.type] - The type of report tools page to open ('planned' or 'issued').
   * @returns {void}
   */
  openReportToolsPage(event) {
    this.app.setCurrentPage({ name: 'reportTools', params: { href: event.item.href, wonum: event.item.wonum, isPlanned: event.type === 'planned' } });
  }

}

export default ReportWorkPageController;