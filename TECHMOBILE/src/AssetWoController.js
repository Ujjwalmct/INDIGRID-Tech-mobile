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

import {log} from '@maximo/maximo-js-api';
const TAG = 'AssetWoController';

class AssetWoController {
  pageInitialized(page, app) {
    log.t(TAG, 'Page Initialized');
    this.app = app;
    this.page = page;
  }

  /*
   * Build Json DataSource on the basis of items for asset workOrder.
   * assetQuery and locationQuery should be an array of string like ["COMP", "CLOSE"] which is reading from datasource where attribute dynamically
   */
  async loadRecord(event) {
    //TODO:  Static declaration of allowedStatus and its use may not required considering wobyasset and wobylocations already returning only WO with these. 
    const allowedStatus = ['COMP', 'CLOSE'];
    const workOrderLimit = this.app.state.workorderLimit;
    let assetWorkOrderList = this.page.findDatasource('assetWorkOrderList');
    let assetWo = [];
    this.page.state.assetNumDesc = '';
    this.page.state.locationNumDesc = '';

    let locationWorkOrderList = this.page.findDatasource('locationWorkOrderList');
    let locationWo = [];

    //to get the Date before 6 month
    let d = new Date();
    d.setDate(d.getDate() - 180);
    let dataFormatter = this.app.dataFormatter;
    let currDate = dataFormatter.convertDatetoISO(d);

    const wobyAsset = this.assetLocationWO(event.item.assetsrecentwos, event.item.wonum);
    // istanbul ignore else
    if(wobyAsset?.length) {
      let loopLimit =  0;

    for (const wo of wobyAsset) {
      // istanbul ignore else
      if (wo.statusdate < currDate) {
        this.page.state.woVal = wo.wonum;
        wo.hideChevron = true;
      } else {
        wo.hideChevron = false;
      }
      // Check if Status_maxvalue is same as where query parameter like COMP or CLOSE then it will be added to history page
      if (allowedStatus.includes(wo.status_maxvalue)) {
        assetWo.push({
          wonum: wo.wonum,
          description: wo.description,
          status: wo.status,
          status_maxvalue: wo.status_maxvalue,
          status_description: wo.status_description,
          worktype: wo.worktype,
          statusdate: wo.statusdate,
          computedWorkTypeWonum: this._computedWorkTypeWonum(wo),
          siteid: wo.siteid,
          hideChevron: wo.hideChevron
        });
        loopLimit += 1;
        if (loopLimit === workOrderLimit) {
          break;
        }
      }
    }

      this.page.state.assetNumDesc = event.item.assetnumber + ' ' + (event.item.assetdesc || "");
    }
    const wobyLocation = this.assetLocationWO(event.item.locationsrecentwos,  event.item.wonum);
    // istanbul ignore else 
    if(wobyLocation?.length) {
      let loopLimit = 0;

      for (const wobyLoc of wobyLocation) {
        // istanbul ignore else
        if(wobyLoc.statusdate<currDate){
          this.page.state.woVal = wobyLoc.wonum;
          wobyLoc.hideLocChevron = true;
        }
        else{
          wobyLoc.hideLocChevron = false;
        }
        // Check if Status_maxvalue is same as where query parameter like COMP or CLOSE then it will be added to history page
        if (allowedStatus.includes(wobyLoc.status_maxvalue) && this.checkWorkOrderUnique(wobyLoc.wonum, wobyLoc.siteid, assetWo)) {
          locationWo.push({
            wonum: wobyLoc.wonum,
            description: wobyLoc.description,
            status: wobyLoc.status,
            status_maxvalue: wobyLoc.status_maxvalue,
            status_description: wobyLoc.status_description,
            worktype: wobyLoc.worktype,
            statusdate: wobyLoc.statusdate,
            computedWorkTypeWonum: this._computedWorkTypeWonum(wobyLoc),
            siteid: wobyLoc.siteid,
            hideLocChevron : wobyLoc.hideLocChevron
          });
          loopLimit += 1;
          if (loopLimit === workOrderLimit) {
            break;
          }
        }
      }
     
      this.page.state.locationNumDesc = event.item.locationnum + ' ' + (event.item.locationdesc || "");
    }

    this.page.state.isAsset = !(event.item.assetnumber || wobyAsset?.length)
    this.page.state.isLocation = !(event.item.locationnum || wobyLocation?.length);
    await assetWorkOrderList.load({ src: assetWo, noCache: true });
    await locationWorkOrderList.load({ src: locationWo, noCache: true });
  }

  /**
   * Function to return true or false based on verfy workOrderId present in array or not
   * @param {Number} workOrderId 
   * @param {Array} workOrderList 
   * @returns 
   */
  checkWorkOrderUnique(workOrderId, siteid, workOrderList) {
    return !workOrderList.find((workOrder) => workOrder.wonum === workOrderId && workOrder.siteid === siteid);
  }

  /**
   * Function to return the asset/location work order history excluding current WO.
   * @param {Array} items should contain asset/location work order history.
   * @param {String} woNum should contain current work order number.
   */
  assetLocationWO(items, woNum) {
    // istanbul ignore else
    if(items?.length) {
      let assetLocWO = items.filter((item => item.wonum !== woNum));
      return assetLocWO;
    }
  }

  /*
   * Compute workType and wonum combination.
   */
  _computedWorkTypeWonum(item) {
    let computedWorkType = null;

    //istanbul ignore else
    if (item?.wonum) {
      if (item.worktype) {
        computedWorkType = item.worktype + ' ' + item.wonum;
      } else {
        computedWorkType = item.wonum;
      }
    }
    return computedWorkType;
  }

   /*
   * This method will redirect to the workorder details page from Asset and Location history page when will click on chevron
   */
  async openAssetLocHstryDtlsPage(event){
    this.page.state.loading = true;
    this.page.state.wonumVal = event.item.wonum;
    
    let completedClosedDs = this.app.findDatasource('completedCloseDS');
    await completedClosedDs?.load();
    await completedClosedDs?.initializeQbe();
    completedClosedDs?.setQBE('wonum', event.item.wonum);
    completedClosedDs?.setQBE('siteid', event.item.siteid);
    let filteredCompClose = await completedClosedDs?.searchQBE();

    // istanbul ignore if
    if(filteredCompClose?.[0]?.href){
      this.page.state.loading = false;
      this.app.setCurrentPage({
        name: "workOrderDetails",
        resetScroll: false,
        params: { href:filteredCompClose[0].href, wonum: event.item.wonum,depth:1,lastPage :'assetWorkOrder'},
        lastPage :'assetWorkOrder',
        pushStack:true
      });
      completedClosedDs.reset(completedClosedDs.baseQuery, true);
    }
    // istanbul ignore else
    else{
      this.page.state.loading = false;
      this.app.toast(this.app.getLocalizedLabel('kdr4w_empty-set-string',`Record not available in the device`), 'error');
    }
  }
}

export default AssetWoController;
