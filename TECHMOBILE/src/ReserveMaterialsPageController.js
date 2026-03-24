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

import SynonymUtil from './utils/SynonymUtil';
import CommonUtil from "./utils/CommonUtil";
import { Device, ShellCommunicator, log } from '@maximo/maximo-js-api';
const TAG = 'ReserveMaterialsPageController';

class ReserveMaterialsPageController {
  /**
   * Function to set flag for 'put-data-failed' event
   */

  pageInitialized(page, app) {
    this.app = app;
    this.page = page;
    this.selectedReservedItems = [];
    ShellCommunicator.get().on("TRANSACTION_UNDONE", this.handleDeleteTransaction.bind(this));
  }

    /**
   * Converts a string to a hash value using the djb2 algorithm.
   * @param {string} str - The input string to be hashed.
   * @returns {number} - The hash value of the input string.
   */
  hashConversion(str) {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 16777619) >>> 0;
    }
    return hash;
  }

  /**
   * Handle Delete transaction
   */
  async handleDeleteTransaction(event) {
    if (event?.app === this.app.name && !this.errorSelectionSaved &&
      (this.app.currentPage.name === this.page.name || this.app.lastPage.name === this.page.name)
    ) {
      const selectedResItems = this.page.state.items;
      let itemToUpdate = { ...this.page.findDatasource('woReservedMaterialRotating')?.items?.find(item => item?.requestnum === selectedResItems[0]?.requestnum) };
      this.hasFailedReservation = true;
      this.updateLocalDS(this.page.findDatasource('woReservedMaterialRotating'), itemToUpdate, selectedResItems);
      this.errorSelectionSaved = true;
    }
  }

  constructor() {
    this.onSaveDataFailed = this.onSaveDataFailed.bind(this);
    this.saveDataSuccessful = true;
  }

  onSaveDataFailed() {
    this.saveDataSuccessful = false;
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Validates Non Rotating item value
   * @param {object} event - The event object containing information about on change event on Number Input.
   * @returns {void}
   */
  validateNonRotatingItem({isInvalid}) {
    this.page.state.hasErrors = !!isInvalid;
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
    * Handles request to navigate away from the Reserve Page.
    * Prompts user to save or discard changes if necessary.
  */
  handlePageExit() {
    if (!this.page.state.disableReservedMaterialAction || this.getReservedRotatingAssetData().length > 0) {
      this.page.state.dialogBMXMessage = this.app.getLocalizedLabel(
        'messages_save_changes',
        'To leave this page, you must first discard or save your changes.'
      );
      this.page.showDialog('saveDiscardDialog_reservePage');
    }
    else {
      this.goBackToReportPage();
    }
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
    * Goes back to the report page.
    * @returns {void}
  */
  goBackToReportPage() {
    this.selectedReservedItems = [];
    this.page.state.noAssetFound = false;
    this.app.findDatasource('woReservedMaterialRotating')?.clearSelections();
    this.app.findDatasource('woReservedMaterialNonRotating')?.clearSelections();
    this.app.findDatasource("reservedItemRotatingAssetJsonDS")?.clearSelections();
    this.app.navigateBack();
  }

  pageResumed() {
    this.page.state.multipleStore = false;
    this.app.state.openedFrom = '';
    this.errorSelectionSaved = false;
    this.loadPageResumed();
  }

  // Assisted by WCA@IBM
  /**
  * @function dataListUpdate
  * @description This function is used to update the Rotating and Non-Rotating Json datasources.
  */
  async dataListUpdate() {
    const reserveDs = await this.page.findDatasource('woReservedMaterialds');
    const woReservedMaterialRotating = this.page.findDatasource('woReservedMaterialRotating');
    const woReservedMaterialNonRotating = this.page.findDatasource('woReservedMaterialNonRotating');

    const updatingJsonDS = reserveDs?.items?.some(item => item.isrotating ? woReservedMaterialRotating?.items.length === 0
      : woReservedMaterialNonRotating?.items.length === 0)

    if ((updatingJsonDS && !this.page.state.reservedItemAdded) || CommonUtil.sharedData.navigatedFromWOPage || !Device.get().isMaximoMobile) {
      CommonUtil.sharedData.navigatedFromWOPage = false;
      let nonRotatingItems = [], rotatingItems = [];
      //istanbul ignore else
      if (reserveDs?.items.length) {
        reserveDs.items.forEach(item => item.isrotating ? rotatingItems.push(item) : nonRotatingItems.push(item));
      }
      await Promise.all([
        woReservedMaterialRotating?.load({ src: rotatingItems, noCache: true }),
        woReservedMaterialNonRotating?.load({ src: nonRotatingItems, noCache: true })
      ]);
      woReservedMaterialNonRotating?.clearWarnings(woReservedMaterialNonRotating.item, 'reservedqty');
    }
    if (this.page.state.itemwithZeroQty) {
      const updatedRotatingitems = woReservedMaterialRotating?.items.filter(item => item.reservedqty !== 0);
      await woReservedMaterialRotating?.load({ src: updatedRotatingitems, noCache: true });
      this.page.state.itemwithZeroQty = false;
    }
  }

  /**
   * extended method from the pageResume
   */
  async loadPageResumed() {
    this.app.state.pageLoading = true;
    this.page.state.loading = true;
    const isMobile = Device.get().isMaximoMobile;
    this.page.state.disableReservedMaterialAction = true;
    this.page.state.loadingReserverMaterials = false;
    this.page.findDatasource("woReservedMaterialRotating")?.clearSelections();
    this.page.findDatasource("woReservedMaterialNonRotating")?.clearSelections();
    const woReservedMaterialds = this.app.findDatasource('woReservedMaterialds');
    const loadParams = {
      noCache: true,
      itemUrl: this.page.params.href
    }
    const woMaterialDetailResource = this.app.findDatasource('woMaterialResource');
    if (woMaterialDetailResource) {
      await woMaterialDetailResource.load(loadParams);
    }
    await woReservedMaterialds?.forceReload();
    await this.dataListUpdate();
    // istanbul ignore if
    if (woReservedMaterialds) {
      await woReservedMaterialds.initializeQbe();
      await woReservedMaterialds.searchQBE(undefined, true);

      let actualMatDs = this.app.findDatasource('reservedActualMaterialDs');
      const jreserveds = this.page.findDatasource('woReservedMaterialNonRotating');
      this.page.hasAnyReservedItemAdded = false;

      //Removed the added reserved items from the list in device only.
      if (isMobile) {
        await actualMatDs.load();
        let allActualItems = [];

        for (let i = 0; i < actualMatDs.dataAdapter.totalCount; i++) {
          if (!actualMatDs.isItemLoaded(i)) {
            await actualMatDs.load({ start: i });
          }

          allActualItems.push(actualMatDs.get(i));
        }

        let tempitems = [];
        let tempMatcheditems = [];

        for (const item of woReservedMaterialds.items) {
          this.page.matched = false;
          allActualItems.forEach((actualItem) => {
            if (
              actualItem?.invreserveid &&
              actualItem?.invreserveid === item.invreserveid &&
              actualItem?.isrotating !== item.isrotating
            ) {
              this.page.matched = true;
              tempMatcheditems.push(item);
            }
          });

          if (!this.page.matched) {
            this.page.hasAnyReservedItemAdded = true;
            let isExists = tempitems.some(
              (tempItem) => tempItem.invreserveid === item.invreserveid
            );
            if (!isExists && !item.isrotating) {
              tempitems.push(item);
            }
          }
        }

        this._resetDataSource(jreserveds);
        if (this.page.hasAnyReservedItemAdded) {
          await jreserveds.load({ src: tempitems, noCache: true });
        } else if (
          tempMatcheditems.length > 0 &&
          tempMatcheditems.length === woReservedMaterialds.items.length
        ) {
          await jreserveds.load({ src: [], noCache: true }); //When all items added show no records
        } else {
          await woReservedMaterialds.load({ noCache: true });
        }
      }

      this.page.state.reserveItemCount = woReservedMaterialds.items.length;
      this.page.state.showRotatingAssetList = false;
    }
    this.page.state.loading = false;
    this.app.state.pageLoading = false;
  }

  /**
   * Reset DS and set src to load.
   */
  _resetDataSource(ds) {
    ds?.clearState();
    ds?.resetState();
  }

  /*
   * Get the selected items
   */
  async getSelectedItems() {
    const woReservedMaterialRotating = this.app.findDatasource('woReservedMaterialRotating');
    const woReservedMaterialNonRotating = this.app.findDatasource('woReservedMaterialNonRotating');
    const selectedRotating = woReservedMaterialRotating?.getSelectedItems();
    const selectedNonRotating = woReservedMaterialNonRotating?.getSelectedItems();

    const selectedItems = selectedRotating?.length ? selectedRotating : selectedNonRotating;
    this.selectedReservedItems = selectedItems;
    this.page.state.noAssetFound = false;

    if (selectedItems?.length > 0) {
      this.page.state.disableReservedMaterialAction = false;
    } else {
      this.page.state.disableReservedMaterialAction = true;
    }
  }

  /**
   * Get Rotating Asset lookup value for rotating material
   */
  async updateReservedItems(rotatingItem, selectedAssetRotating) {
    const initialLength = this.page.state.items.length;
    const newAssets = selectedAssetRotating.slice(initialLength);
    newAssets.forEach((rotAsset) => {
      const rotItem = { ...rotatingItem[0] };
      rotItem.rotassetnum = rotAsset.assetnum;
      this.page.state.items.push(rotItem);
    });
    return newAssets;
  }

  /**
   * List out rotating assets for selected item & selections of assets
   */
  async selectionRotatingAssets() {
    this.page.state.rotatingItemWithAsset ??= [];
    let rotatingItem = this.page.state.rotatingItemWithNoAsset;
    const selectedAssetRotating = this.getReservedRotatingAssetData();
    await this.updateReservedItems(rotatingItem, selectedAssetRotating);

    /**
      * Updates the selected rotating item with the appropriate rotating asset.
      * If a rotating asset is selected from the list, the first condition is executed;
      * It will fetch the required rotating assets for the selected rotating item for initial execution as no rotating asset is selected.
    */
    if (rotatingItem?.length > 0 && selectedAssetRotating?.length > 0) {
      //istanbul ignore else
      if (this.page.state.sendSelectedAssets) {
        rotatingItem.shift();
        //istanbul ignore else
        if (rotatingItem.length === 0) {
          this.sendReservedItems();
          this.app.findDatasource("reservedItemRotatingAssetJsonDS")?.clearSelections();
        }
      }
    } else {
      const reservedRotatingAssetDS = this.app.findDatasource('reservedItemRotatingAssetDS');
      const reservedRotatingAssetJsonDS = this.app.findDatasource('reservedItemRotatingAssetJsonDS');
      const reservedActualMaterialItems = this.app.findDatasource('reservedActualMaterialDs')?.items;

      if (rotatingItem?.length > 0) {
        this.page.state.labelRotatingAsset = rotatingItem[0]?.description;
      }

      // Initialize QBE for searching rotating assets
      await reservedRotatingAssetDS?.initializeQbe();
      reservedRotatingAssetDS?.setQBE("itemnum", "=", rotatingItem[0]?.itemnum);
      reservedRotatingAssetDS?.setQBE("location", "=", rotatingItem[0]?.location);
      await reservedRotatingAssetDS?.searchQBE(undefined, true);

      const rotatingAssetData = reservedRotatingAssetDS?.items;

      this.page.state.noAssetFound = !rotatingAssetData?.length;
      // Mobile-specific asset sync and filtering based on conditions
      if (Device.get().isMaximoMobile) {
        const materialDS = this.app.findDatasource('woReservedMaterialds');
        const woMaterialResource = this.app.findDatasource('woMaterialResource');
        // Load work order material resource and material datasource
        await Promise.all([
          woMaterialResource.load({ itemUrl: this.page.params.href, noCache: true }),
          materialDS.load()
        ]);

        let filteredAssets = rotatingAssetData;
        // Further filter assets based on reservedActualMaterialItems, if they exist
        //istanbul ignore else
        if (reservedActualMaterialItems?.length) {
          filteredAssets = this.filterRotatingAssetsBasedOnTransactions(filteredAssets, reservedActualMaterialItems);
        }
        this.page.state.noAssetFound = !filteredAssets?.length;
        // Load final filtered assets into reservedRotatingAssetJsonDS
        reservedRotatingAssetJsonDS?.load({ src: filteredAssets, noCache: true });
      } else {
        reservedRotatingAssetJsonDS.load({ src: rotatingAssetData, noCache: true });
      }
      this.page.state.showRotatingAssetList = true;
      this.page.state.loadingReserverMaterials = false;
      this.page.state.disableReservedMaterialAction = true;
      if(!this.page.state.type && !selectedAssetRotating.length){
        this.app.toast(this.app.getLocalizedLabel("empty_items", 'You must select an item.'), 'error');
        this.page.state.type= '';
      }
    }
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Filters rotating assets based on valid asset numbers.
   * @param {Array} rotatingAssetData - An array of objects representing rotating assets.
   * @param {Array} validAssetNums - An array of valid asset numbers.
   * @return {Array} - Returns an array of filtered rotating assets.
   */
  filterRotatingAssets(rotatingAssetData, validAssetNums) {
    return rotatingAssetData.filter(asset => validAssetNums.includes(asset.assetnum));
  }


  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Filters rotating assets based on transactions.
   * @param {Array} rotatingAssetData - The data of rotating assets.
   * @param {Array} reservedActualMaterialItems - The reserved actual material items/transactions.
   * @returns {Array} - The filtered rotating assets that have not been used in transactions.
   */
  filterRotatingAssetsBasedOnTransactions(rotatingAssetData, reservedActualMaterialItems) {
    const uxRotAssetTransactions = {};
    reservedActualMaterialItems.forEach(({ itemnum, rotassetnum }) => {
      //istanbul ignore else
      if (!uxRotAssetTransactions[itemnum]) {
        uxRotAssetTransactions[itemnum] = [];
      }
      //istanbul ignore else
      if (rotassetnum && !uxRotAssetTransactions[itemnum].includes(rotassetnum)) {
        uxRotAssetTransactions[itemnum].push(rotassetnum);
      }
    });

    return rotatingAssetData.filter(({ itemnum, assetnum }) => {
      return !uxRotAssetTransactions[itemnum]?.includes(assetnum);
    });
  }

  /**
   * @returns Rotating asset list
   */
  getReservedRotatingAssetData() {
    return this.app.findDatasource("reservedItemRotatingAssetJsonDS").getSelectedItems();
  }

  /**
 * Updates local data sources with the provided item updates.
 *
 * @param {Object} woReservedMaterialRotating - The rotating reserved materials ds.
 * @param {Object} itemToUpdate - an object with similar requestnum.
 * @param {Array} selectedResItems - The selected reserved items to update.
 */
  updateLocalDS(woReservedMaterialRotating, itemToUpdate, selectedResItems) {
    const woReservedMaterialds = this.app?.findDatasource('woReservedMaterialds');
    const indexMaterialRotating = woReservedMaterialRotating?.items.findIndex(item => item.requestnum === itemToUpdate.requestnum);
    if (woReservedMaterialRotating.items[indexMaterialRotating]?.reservedqty - selectedResItems.length < 0) {
      this.page.state.dataFailed = true;
      return;
    }
    //istanbul ignore else
    if (indexMaterialRotating !== -1) {
      const itemRotating = woReservedMaterialRotating?.items[indexMaterialRotating];
      if (this.hasFailedReservation) {
        woReservedMaterialRotating.items[indexMaterialRotating].actualqty -= selectedResItems.length;
        woReservedMaterialRotating.items[indexMaterialRotating].reservedqty += selectedResItems.length;
        this.hasFailedReservation = false;
      }
      //updating values for the localDS
      else {
        woReservedMaterialRotating.items[indexMaterialRotating].reservedqty -= selectedResItems.length;
        woReservedMaterialRotating.items[indexMaterialRotating].actualqty = itemToUpdate.actualqty;
        //istanbul ignore else
        if (woReservedMaterialds?.items) {
          woReservedMaterialds.items[indexMaterialRotating].reservedqty = itemRotating.reservedqty;
          woReservedMaterialds.items[indexMaterialRotating].actualqty = itemRotating.actualqty;
        }
      }
      if (woReservedMaterialRotating?.items[indexMaterialRotating]?.reservedqty === 0) {
        this.page.state.itemwithZeroQty = true;
      }
    }
  }

  /**
   * Prepare the payload and send Reserve items to the server
   */
  async sendReservedItems() {
    let selectedResItems = this.page.state.items;
    const nonRotatingItem = selectedResItems.find((item) => !item.isrotating);
    let localReserveQty = nonRotatingItem ? nonRotatingItem.reservedqty : 1;
    let setDS = this.app.findDatasource('defaultSetDs');
    let synonymdomainData = this.app.findDatasource('synonymdomainData');
    let issueType = await SynonymUtil.getSynonymDomain(synonymdomainData, 'ISSUETYP', 'ISSUE');
    let reserveActualds = this.app.findDatasource('reservedActualMaterialDs');
    let woReservedMaterialNonRotating = this.page.findDatasource('woReservedMaterialNonRotating');
    const woReservedMaterialRotating = this.page.findDatasource('woReservedMaterialRotating');
    let itemsetid = null;
    //loop for selected rows
    let multiMatusetrans = [];
    // istanbul ignore next
    if (setDS?.item['itemsetid']) {
      itemsetid = setDS.item['itemsetid'];
    }
    let itemToUpdate = { ...woReservedMaterialRotating?.items?.find(item => item?.requestnum === selectedResItems[0]?.requestnum) };
    if (selectedResItems && selectedResItems.length > 0) {
      const onDataFailedHandler = this.onSaveDataFailed.bind(this);
      try {
        for (const resItem of selectedResItems) {
          const matusetransTemp = {
            itemnum: resItem.itemnum,
            storeloc: resItem.location,
            binnum: resItem.binnum,
            location: resItem.oplocation,
            issuetype_maxvalue: issueType.maxvalue,
            positivequantity: localReserveQty,
            requestnum: resItem.requestnum,
            description: resItem.description,
            locdesc: resItem.locationsdesc,
            invreserveid: resItem.invreserveid,
            matusetransid: resItem.isrotating ? Number.isNaN(+resItem.rotassetnum) ? this.hashConversion(resItem.rotassetnum): +resItem.rotassetnum : resItem.invreserveid,
            orgid: woReservedMaterialNonRotating.orgid,
            restype: woReservedMaterialNonRotating.restype,
            siteid: resItem.storelocsiteid,
            storelocsiteid: woReservedMaterialNonRotating.storelocsiteid,
            itemsetid: itemsetid
          };

          if (resItem.isrotating) {
            itemToUpdate.actualqty += matusetransTemp.positivequantity;
            matusetransTemp.rotassetnum = resItem.rotassetnum;
            matusetransTemp.location = resItem.oplocation;
          }
          multiMatusetrans.push(matusetransTemp);
        }

        this.updateLocalDS(woReservedMaterialRotating, itemToUpdate, selectedResItems);

        let option = {
          responseProperties: 'matrectransid,anywhererefid,requestnum',
          localpayload: multiMatusetrans
        };
        if (this.page.state.dataFailed) {
          this.saveDataSuccessful = false;
          reserveActualds?.off('put-data-failed', onDataFailedHandler);
          this.app.setCurrentPage({ name: 'report_work', params: { itemhref: this.page.params.href } });
          this.page.state.dataFailed = false;
          this.emptyActualqty = true;
          return;
        }
        this.saveDataSuccessful = true;
        reserveActualds?.on('put-data-failed', onDataFailedHandler);
        await reserveActualds.bulkAdd(multiMatusetrans, option);
      } catch (e) {
        log.t(TAG, 'Error on saving remark : ' + e);
      } finally {
        this.page.state.loadingReserverMaterials = false;
        this.page.state.disableReservedMaterialAction = true;
        this.page.state.reservedItemAdded = true;

        // istanbul ignore next
        if (this.saveDataSuccessful) {
          if (this.selectedReservedItems?.some(item => !item?._selected && item.isrotating)) {
            this.selectedReservedItems = [];
          }
          this.app.toast(this.app.getLocalizedLabel('resevered_items', `Reserved items added`), 'success');
          reserveActualds?.off('put-data-failed', onDataFailedHandler);
          this.app.setCurrentPage({ name: 'report_work', params: { itemhref: this.page.params.href } });
          return;
        }
        /**
        * Displays an error message if the user exceeds the reserved asset quantity for the selected rotating item.
        */
        else if (this.emptyActualqty) {
          this.app.toast(this.app.getLocalizedLabel('empty_actualqty_items', 'Reported assets must be equal or smaller than reserved quantity.'), 'error');
          return;
        }
        // Handle errored record scenario
        this.hasFailedReservation = true;
        this.updateLocalDS(woReservedMaterialRotating, itemToUpdate, selectedResItems);
      }
    } else {
      this.page.state.loadingReserverMaterials = false;
      this.page.state.disableReservedMaterialAction = true;
      this.app.toast(this.app.getLocalizedLabel("empty_items", 'You must select an item.'), 'error');
    }
  }

  /*
   * Save the reserved items
   */
  async setReservedItems(items) {
    // Fetch the reservedRotatingAsset datasource and get selected items
    const selectedAssetRotating = this.getReservedRotatingAssetData();
    this.page.state.sendSelectedAssets = selectedAssetRotating?.length > 0;
    this.page.state.showRotatingAssetList = false;
    this.page.state.loadingReserverMaterials = true;
    this.page.state.rotatingItemWithNoAsset = [];
    this.page.state.items = [];
    this.page.state.type = items?.type;
    const hasSelectedAssetRotating = selectedAssetRotating?.length && !selectedAssetRotating?.some(item => item?._selected);
    const hasSelectedReservedItemWithoutRotating = !this.selectedReservedItems?.some(item => item?._selected && item?.isrotating === false);
    const hasUnselectedRotatingItem = this.selectedReservedItems?.some(item => !item?._selected && item?.isrotating);
    
    if ((this.page.state.type  || hasSelectedAssetRotating || hasSelectedReservedItemWithoutRotating) && !hasUnselectedRotatingItem ) {
        this.selectedReservedItems = [];
    }
    if (!this.selectedReservedItems?.length) {
      this.selectedReservedItems = items?.item;
    }
    let selectedResItems = this.selectedReservedItems;
    //loop for selected rows
    if (selectedResItems && selectedResItems.length > 0) {
      for (const item of selectedResItems) {
        if (item.isrotating) {
          this.page.state.rotatingItemWithNoAsset.push(item);
        }
        else {
          this.page.state.items.push(item);
        }
      }
    }
    if (this.page.state.rotatingItemWithNoAsset.length === 0) {
      this.sendReservedItems();
    }
    else {
      this.selectionRotatingAssets();
    }
  }
}

export default ReserveMaterialsPageController;