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


import { log, ShellCommunicator } from "@maximo/maximo-js-api";
import SynonymUtil from './utils/SynonymUtil';
import CommonUtil from './utils/CommonUtil';
const TAG = 'SparePartPageController';

// Assisted by watsonx Code Assistant 
/**
 * This class represents the Spare Part Page Controller.
 */
class SparePartPageController {

  constructor() {
    this.onSaveDataFailed = this.onSaveDataFailed.bind(this);
    this.saveDataSuccessful = true;
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Initializes the page.
   * @param {object} page - The page object.
   * @param {object} app - The app object.
   */
  pageInitialized(page, app) {
    this.app = app;
    this.page = page;
    ShellCommunicator.get().on("TRANSACTION_UNDONE", this.handleDeleteTransaction.bind(this));
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Callback function for when save data operation fails.
   * @param {Object} error - The error object that contains details about the failure.
   * @returns {void}
   */
  onSaveDataFailed() {
    this.saveDataSuccessful = false;
  }

  // Assisted by watsonx Code Assistant 
  /**
   * This function is called when the page is resumed.
   * @param {Object} page - The page object.
   * @param {Object} app - The app object.
   */
  pageResumed() {
    this.page.state.title = this.app.getLocalizedLabel(
      "spare_part_label",
      "Select spare parts"
    );
    this.loadPageResumed({ callFromLookup: false });
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Loads the page and its resources.
   * @param {Event} evt The event that triggered the function.
   * @returns {Promise<void>} A promise that resolves when the page and its resources have been loaded.
   */
  async loadPageResumed(evt) {
    this.app.state.pageLoading = true;
    await this.loadSparePart(evt);
    this.app.state.pageLoading = false;
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Loads spare part information for a work order asset.
   * @param {Object} evt - The event object.
   * @param {boolean} evt.callFromLookup - Indicates if the function is being called from a lookup.
   */
  async loadSparePart(evt) {
    const defSite = this.app.client?.userInfo?.insertSite;
    this.sparePartQtyUpdate = false;
    const woAssetLocationDS = evt.callFromLookup ? this.app.findDatasource("assetLookupDS") : this.app.findDatasource('woAssetLocationds')
    this.assetUpdate =  evt.callFromLookup;

    const sparePart = woAssetLocationDS?.item?.sparepart
    const sparePartJsonDs = this.page.findDatasource('sparePartJsonDs');
    sparePartJsonDs.items.forEach(item => {sparePartJsonDs?.clearWarnings(item, "quantity");})
    this.page.state.assetLabel = `${woAssetLocationDS.item.assetnum || ''} ${woAssetLocationDS.item.description || ''}`
    
    if (evt.callFromLookup) {
      CommonUtil._resetDataSource(woAssetLocationDS);
      CommonUtil._resetDataSource(sparePartJsonDs);  
    }
    
    if (!sparePart) {
      await sparePartJsonDs.load({ src: [], noCache: true })
    } else {
      const spartPartItem = [];
      spartPartItem.push(...sparePart.map(item => item.sparepartitem || item.itemnum || item.item[0].itemnum));

      //Set QBE on inventory ds to get the quantity of the spare part item and maps to map respective item data together
      let inventoryDS = this.app.findDatasource('inventoryDS');
      await inventoryDS.initializeQbe();
      inventoryDS.setQBE('itemnum', 'in', spartPartItem)
      inventoryDS.setQBE('siteid', '=', defSite);
      await inventoryDS.searchQBE();

      const sparePartMap = this.prepareSparePartMap(sparePart);

      inventoryDS.items.forEach(item => {
        //istanbul ignore else
        if (sparePartMap.has(item.itemnum)) {
          item.quantity = item.maxquantity = sparePartMap.get(item.itemnum).quantity;
          item.labelDisplay = `${item.itemnum} ${sparePartMap.get(item.itemnum)?.item[0].description}`
          item.description = `${sparePartMap.get(item.itemnum)?.item[0].description}`;
        }
      });
      await sparePartJsonDs.load({ src: inventoryDS.items, noCache: true })
    }
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Creates a map of spare parts based on the item number and quantity.
   * @param {Array} sparePart - An array of objects containing the item number and quantity.
   * @return {Map} sparePartMap - A map of spare parts with the item number as the key and the quantity as the value.
   */
  prepareSparePartMap(sparePart) {
    const sparePartMap = new Map();
    sparePart.forEach(item => {
      const key = item.sparepartitem || item.itemnum || item.item.itemnum;
      //istanbul ignore if
      if (sparePartMap.has(key)) {
        sparePartMap.get(key).quantity += item.quantity
      } else {
        sparePartMap.set(key, item)
      }
    })
    return sparePartMap;
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Set spare parts for a work report.
   * @async
   * @function setSpareParts
   * @returns {Promise<void>}
   */
  async setSpareParts() {
    this.page.state.loadConfirmSelection = true;
    let spareItemToAdd = []
    let synonymdomainDS = this.app.findDatasource('synonymdomainData');
    const issueType = await SynonymUtil.getSynonymDomain(synonymdomainDS, 'ISSUETYP', 'ISSUE');
    const sparePartJsonDs = this.page.findDatasource("sparePartJsonDs");
    const reportWorkActualMaterialDs = this.app.findDatasource("reportWorkActualMaterialDs");
    const onDataFailedHandler = this.onSaveDataFailed.bind(this);
    try {
      const sparePartItem = sparePartJsonDs.getSelectedItems();
      //istanbul ignore else
      if (!!sparePartItem.length) {
        sparePartItem.forEach(item => {
          const sparePartMat = {
            locdesc: `${item.location} Storeroom`,
            siteid: item.siteid,
            itemnum: item.itemnum,
            description : item.description,
            positivequantity: item.quantity,
            invreserveid: item.inventoryid,
            matusetransid: item.inventoryid,
            storeloc: item.location,
            issuetype: issueType.value,
            issuetype_maxvalue: issueType.maxvalue,
          }
          spareItemToAdd.push(sparePartMat);
        })

        const option = {
          responseProperties: 'matusetransid,anywhererefid,requestnum',
          localpayload: spareItemToAdd
        };
        this.saveDataSuccessful = true;
        reportWorkActualMaterialDs?.on('put-data-failed', onDataFailedHandler);
        await reportWorkActualMaterialDs.bulkAdd(spareItemToAdd, option);
        //istanbul ignore else
        if (this.saveDataSuccessful) {
          CommonUtil._resetDataSource(sparePartJsonDs);
          this.app.setCurrentPage({ name: 'report_work', params: { itemhref: this.page?.params?.href } });
        }
      }

    }
     catch (error) {
      log.t(TAG, 'Error on saving remark : ' + error);
    } finally {
      reportWorkActualMaterialDs?.off('put-data-failed', onDataFailedHandler);
      this.page.state.loadConfirmSelection = false;
    }
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Opens the asset lookup dialog.
   */
  openAssetLookup() {
    this.page?.findDatasource('sparePartJsonDs');
    this.app?.showDialog('assetLookupDialog');
  }

  async callPageResumed(){
    await this.loadPageResumed({ callFromLookup: false });
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Selects an asset based on the provided asset number and site ID.
   * @param {Object} evt - The event object containing the asset number and site ID.
   * @returns {Promise<void>} - A promise that resolves when the asset is selected.
   */
  async selectAsset(evt) {
    const assetLookupDS = this.app.findDatasource("assetLookupDS");
    await assetLookupDS.initializeQbe();
    assetLookupDS.setQBE("assetnum", "=", evt.assetnum);
    assetLookupDS.setQBE("siteid", "=", evt.siteid);
    await assetLookupDS.searchQBE();
    await this.loadPageResumed({ callFromLookup: true });
  }


  // Assisted by watsonx Code Assistant 
  /**
   * Handle delete transaction event
   * @param {Event} event - The event object
   * @returns {Promise<void>} - A promise that resolves when the transaction is deleted
   */
  async handleDeleteTransaction(event) {
    if (event?.app === this.app.name &&
      (this.app.currentPage?.name === this.page.name || this.app.lastPage?.name === this.page.name)
    ) {
      Promise.all([this.app.findDatasource('woDetailsReportWork')?.forceReload(),
        this.app.findDatasource('reportWorkActualMaterialDs')?.forceReload()]);
    }
  }

  // Assisted by watsonx Code Assistant 
  /**
    * Handles request to navigate away from the SparePart Page.
    * Prompts user to save or discard changes if necessary.
  */
  handlePageExit() {
    const sparePartJsonDs = this.page.findDatasource('sparePartJsonDs');
    if ((sparePartJsonDs?.getSelectedItems().length > 0) || this.assetUpdate || this.sparePartQtyUpdate) {
      this.page.state.dialogBMXMessage = this.app.getLocalizedLabel(
        'messages_save_changes',
        'To leave this page, you must first discard or save your changes.'
      );
      this.page.showDialog('saveDiscardDialog_sparepage');
    }else{
      this.app.navigateBack();
    }
  }

  // Assisted by watsonx Code Assistant 
  /**
    * Goes back to the report page.
    * @returns {void}
  */
  goBackToReportPage() {
    this.app.findDatasource("sparePartJsonDs")?.clearSelections();
    this.app.navigateBack();
  }

  /**
    * Validation for spare part quantity
  */
  validateSparePart(event) {
    const sparePartJsonDs = this.page.findDatasource('sparePartJsonDs');
    //istanbul ignore else
    sparePartJsonDs?.items?.forEach(item => {
    //istanbul ignore else
      if (event.item.itemnum === item.itemnum) {
        //istanbul ignore else
        if (!event.item.quantity || (event.item.quantity !== event.item.maxquantity)) {
          this.sparePartQtyUpdate = true;
      }
      
      if (!event.item.quantity || (event.item.quantity > event.item.maxquantity)) {
        item.hasError = true;
        this.page.state.disableSaveButton = true;
      } else {
        item.hasError = false;
      }
      }
    })
  }

  /**
    * If quantity field any error will disable the confirm selection button
  */
  disableSaveButton() {
    const sparePartJsonDs = this.page.findDatasource('sparePartJsonDs');
    let hasError;
    sparePartJsonDs.items.forEach((item) =>
    {
      //istanbul ignore else
      if (item.hasError) {
        hasError = true;
        return;
      }
    })

    if (hasError) {
      this.page.state.disableSaveButton = true;
    } else {
      this.page.state.disableSaveButton = false;
    }
  }
}

export default SparePartPageController;