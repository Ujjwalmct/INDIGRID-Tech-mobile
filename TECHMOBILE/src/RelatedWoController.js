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

import {Device,log} from '@maximo/maximo-js-api';
import CommonUtil from './utils/CommonUtil';
const TAG = 'RelatedWoController';

class RelatedWoController {
  pageInitialized(page, app) {
    log.t(TAG, 'Page Initialized');
    this.app = app;
    this.page = page;
  }

  /**
   * This method is called by clicking on create follow up work order button on
   * related work order page for specific work order accordingly.
   * @param {event} event
   */
  async createRelatedAndFollowUpWo(event) {    
    let workorder = event.item;
    this.app.findPage('workOrderDetails').state.canLoadWoDetailResourceChilds = false;
    let woDetailResource = this.app.findPage('workOrderDetails')?.findDatasource('woDetailResource');
    await woDetailResource?.load({ noCache: true, itemUrl: event?.item?.href });
    this.app.findPage('workOrderDetails').state.canLoadWoDetailResourceChilds = true;
    /* istanbul ignore next */
    if(woDetailResource?.item?.linearrelated){
      let deviceLinear = [];
      deviceLinear.push(woDetailResource?.item?.linearrelated);
      let linearAsset = this.app.findDatasource("linearAsset");
      await linearAsset?.load({ src: deviceLinear, noCache: true });
      this.app.state.linearinfo = this.page.state.linearinfo = woDetailResource?.item?.linearrelated?.[0];
    }
    this.app.setCurrentPage({name: 'woedit', resetScroll: true, params: { 
      followup: true,
      href: workorder.href,
      wonum: workorder.wonum,
      siteid: workorder.siteid,
      fromQuickReport: woDetailResource.item.isquickreported || this.page.params.fromQuickReport
    }
  });
    // istanbul ignore else
    if (this.app.currentPage) {
      this.app.currentPage.callController('loadRecord', workorder);
    }
  }

  /**
   * Redirects to work order detail page
   * @param {event} event
   */
  async showWoDetailPage(event) {
    this.app.setCurrentPage({
      name: "workOrderDetails",
      resetScroll: true,
      params: {wonum: event.item.wonum, siteid: event.item.siteid, href: event.item.href}
    });
  }

  /**
    * Called every time the page is being paused or leaving.
    * @param {Page} page - Page instance.
    * @param {Application} app - Application instance.
    */
  async pagePaused(page, app) {
    let dsName = Device.get().isMaximoMobile ? "myworkCreatedLocally" : "myworkDS";
    const myWorkds = app?.findDatasource(dsName);
    if (Object?.keys(myWorkds?.state?.qbe).length !== 0) {
      myWorkds?.clearQBE();
      await myWorkds?.searchQBE();
    }
  }

  /*
   * Method to resume the page and load related workorder datasource
   */
  //istanbul ignore next
  async pageResumed(page, app) {
    this.app.state.pageLoading = true;
    this.page.state.editWo = false;
    if (!page.params?.followupclickable) {
      this.page.state.nonClickAble = true;
      this.page.state.clickAble = false;
    } else {
      this.page.state.nonClickAble = false;
      this.page.state.clickAble = true;
    }
    //to disable the chevron button in devices if we  create new workorder in devices
    if (page.params?.chevronDisable) {
      this.page.state.wonum = undefined;
    }
    const woDetailResource = this.page.findDatasource('woDetailRelatedWorkOrder');
    woDetailResource.item.isquickreported = page.params.fromQuickReport;
    const syncLeft = this.page.findDatasource('relatedrecwo')?.items.some(item => 'anywhererefid' in item);

    /*
     * While forceSync is generally not recommended, it is applied here to ensure that newly created follow-up work orders are synced in online mode.
     *  This approach updates the single parent work order only if any follow-up work order hasn't been synced with the server and includes the anywhererefid.
     * This is a more efficient operation compared to manually syncing the entire work orders list & depends on forceSyncFollowUP state to be enabled true.
     */
    await woDetailResource?.load(
      {
        noCache: true,
        itemUrl: page.params.itemhref,
        forceSync: syncLeft && this.page.state.forceSyncFollowUP && this.app.state.networkConnected
      });
    this.app.state.pageLoading = false;
    this.page.state.editWo = !['CAN'].includes(woDetailResource?.item?.status_maxvalue);
  }


  // Assisted by watsonx Code Assistant 
  /**
   * Retrieve filtered domain values based on the provided item and datasource.
   * @param {Object} item - The item object containing related information.
   * @param {Object} datasource - The datasource object for loading data.
   * @param {String} siteid - The site ID for filtering.
   * @returns {Promise<Object>} - A promise resolving to the search results.
   */
  async getFilteredWorkOrder(item, datasource, siteid) {
    const { relatedreckey, relatedwodesc, anywhererefid } = item
    const searchText = datasource.state?.currentSearch;
    if (searchText?.length > 0 && datasource.state?.isFiltered?.length > 0) {
      this.page.state.loading = true;

      datasource.baseQuery.where = "";
      datasource.baseQuery.searchText = "";
      await datasource.load({ ...datasource.baseQuery, noCache: true });

      CommonUtil.sharedData.searchedText = searchText;
    }
    await datasource?.initializeQbe();
    datasource?.setQBE(relatedreckey ? 'wonum' : 'description', relatedreckey || relatedwodesc);
    //istanbul ignore else
    if (!relatedreckey) {
      datasource?.setQBE('anywhererefid', anywhererefid);
    }
    datasource?.setQBE('siteid', siteid);
    this.page.state.loading = true;
    return await datasource?.searchQBE();
  }
  
  /*
   * Method for redirect to workorderdetails page on click of followup workorder
   */
  async openEditWo(event) {
    //If user created a follow up work order from Classic or RBA, user have to perform “Check for updates” for “Work created by me” list in work order list page
    const woDetailResource = this.page?.findDatasource('woDetailRelatedWorkOrder');
    this.page.state.itemnum = event.childitem.relatedreckey;
    this.page.state.anywhererefid = event.childitem.anywhererefid;
    const dsName = Device.get().isMaximoMobile ? "myworkCreatedLocally" : "myworkDS";
    const myWorkds = this.app?.findDatasource(dsName);
    //istanbul ignore else
    if (Device.get().isMaximoMobile) {
      await myWorkds?.forceReload();
    }
    let filteredWorkOrder = await this.getFilteredWorkOrder(event.childitem, myWorkds, event.item.siteid);
    //istanbul ignore else
    if (Device.get().isMaximoMobile && (!(filteredWorkOrder?.[0]))) {
      const todaywoassignedDS = this.app?.findDatasource('todaywoassignedDS');
      const baseQuery = todaywoassignedDS.baseQuery;
      todaywoassignedDS.clearState();
      filteredWorkOrder = await this.getFilteredWorkOrder(event.childitem, todaywoassignedDS, event.item.siteid);
      todaywoassignedDS.reset(baseQuery);
      //istanbul ignore else
      if (!filteredWorkOrder?.[0]) {
        const myWorkds = this.app?.findDatasource('myworkDS');
        //istanbul ignore else
        if (!myWorkds.state.hasData) {
          myWorkds.clearState();
          myWorkds.resetState();
          await myWorkds?.load({ noCache: true });
        }
        filteredWorkOrder = await this.getFilteredWorkOrder(event.childitem, myWorkds, event.item.siteid);
      }
    }

    if (filteredWorkOrder?.[0]?.href) {
      /*
       * Although forceSync is generally discouraged, it is used here to ensure that newly created follow-up work orders are synced in online mode. 
       * This is specifically implemented to sync follow-up work orders that have changes from the MANAGE end & sync only those whose cheveron has been clicked.
       * The syncing behavior is controlled by the forceSyncFollowUP state variable and the condition below.
       */
      await woDetailResource?.load({
        itemUrl: filteredWorkOrder?.[0]?.href,
        noCache: true,
        forceSync: this.app.state.networkConnected && this.page.state.forceSyncFollowUP
      });
      
      // when will click on chveron button then current page will be set to workorderdetails and depth will be equal to 1 and after that chevron button will not be visible
      this.page.state.loading = false;
      const childHref = Device.get().isMaximoMobile ? event?.item?.relatedwo[0]?.href : event.childitem.href;

      this.app.setCurrentPage({
        name: "workOrderDetails",
        resetScroll: false,
        params: {
          href: filteredWorkOrder[0].href,
          wonum: event.childitem.relatedreckey,
          depth: 1,
          lastPage: "relatedWorkOrder",
          childItemHref: childHref,
          fromQuickReport: event.item.isquickreported
        },
        lastPage: "relatedWorkOrder",
        pushStack: true
      });
    } else {
      this.page.state.loading = false;
      this.app.toast(this.app.getLocalizedLabel('record_not_available_device', `Record not available in the device`), 'error');
    }
  }
}

export default RelatedWoController;
