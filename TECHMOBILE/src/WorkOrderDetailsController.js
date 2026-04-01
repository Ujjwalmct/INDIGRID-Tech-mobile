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

import { log, Device, ShellCommunicator } from '@maximo/maximo-js-api';
import WOTimerUtil from './utils/WOTimerUtil';
import WOUtil from './utils/WOUtil';
import SynonymUtil from './utils/SynonymUtil';
import WOCreateEditUtils from "./utils/WOCreateEditUtils";
import CommonUtil from './utils/CommonUtil';
import { OpenLayersAdapter } from '@maximo/map-component';
const TAG = 'WorkOrderDetailsController';

class WorkOrderDetailsController {
  pageInitialized(page, app) {
    this.app = app;
    this.page = page;
    ShellCommunicator.get().on(
      'TRANSACTION_UNDONE',
      this.handleDeleteTransaction.bind(this)
    );
  }

  /**
   * Method implemented in controller itself.
   */
  constructor() {
    this.onUpdateDataFailed = this.onUpdateDataFailed.bind(this);
    this.saveDataSuccessful = true;
    CommonUtil.sharedData.newPageVisit = true;
  }


  /**
   * Function to open a sliding-drawer dialog to show Work Log for the Work Order with Long Description in Expanded View
   * @param event - should contain
   * event - event containing information about current item.
   * datasource - The Synonymdata Datasource to filter logType
   * item - The Work ORder Selected
   */
  async openWorkLogDrawer(event) {
    this.page.state.editWo = !['CAN'].includes(event?.item?.status_maxvalue);
    await CommonUtil.openWorkLogDrawer(this.app, this.page, event, this.page.findDatasource("woDetailsWorklogDs"), "woWorkLogDrawer");
  }
  /** 
   * Opens the cost drawer for the corresponding workorder.
   * @param {Object} event workorder item
   */
  async openWoCostDrawer(event) {
    if (this.app?.pages) {
      let approvalPage = this.app.findPage("approvals");

      // istanbul ignore else
      if (approvalPage) {
        approvalPage.callController("openWoTotalCostDrawer", event);
      }
    }
  }

  accessWoCostData(item) {
    return WOUtil.computedEstTotalCost(item).totalcost;
  }


  navigateToTask(item) {
    if (item?.wonum) {
      this.app.setCurrentPage({
        name: 'tasks',
        params: { wonum: item.wonum, href: item.href },
      });
      this.page.state.navigateToTaskPage = true;
    }
  }

  /*
   * Method to open the report work page on basis of workorder
   */
  navigateToReportWork(item) {
    if (this.app && this.page && item?.href) {
      this.app.setCurrentPage({
        name: 'report_work',
        params: {
          wonum: item.wonum,
          itemhref: item.href,
          istask: item.istask,
          wogroup: item.wogroup,
          taskid: item.taskid,
          href: item.href
        },
      });
      if (this.app.currentPage) {
        this.page.state.navigateToReportWork = true;
      }
    }
  }

  /*
   * Method to resume the page and load work order detail datasource
   */
  //istanbul ignore next
  async pageResumed(page, app) {
    CommonUtil.sharedData.newPageVisit = true;
    // Page.state.isMobile Set True if accessing from Mobile Device
    page.state.editWo = page.state.editDetails = false;
    page.state.isSafetyPlanReviewed = false;
    page.state.loading = true;
    page.state.totalpluscwodscount = 0;
    this.app.state.linearinfo = {};
    page.state.followupCount = '';
    this.page.state.fromQuickReport = this.app.state.fromQuickReport;
    if (page.params?.lastPage === 'assetWorkOrder') {
      page.state.historyDisable = page.params?.depth === 1
    } else {
      page.state.historyDisable = false;
    }
    page.state.isMobile = Device.get().isMaximoMobile;
    const reportWork = this.app.findPage('report_work');
    if (reportWork)
      reportWork.state.fieldChangedManually = false;
    const woDetailResource = page.findDatasource('woDetailResource');
    if (!page.params?.href) {
      log.d(TAG, 'page.params has no href to load');
      this.page.state.canLoadWoDetailResource = false;
    }
    await woDetailResource?.load({ noCache: true, itemUrl: page.params.href });
    this.page.state.canLoadWoDetailResource = true;

    const device = Device.get();
    page.state.inspectionAccess = app.checkSigOption(`${this.app.state.appnames.inspection}.READ`);
    page.state.enforceAssetScan = app.checkSigOption(`${this.app.state.woOSName}.ENFORCEASSETSCAN`);
    page.state.assetSwicthAccess = !!app.checkSigOption(`${this.app.state.appnames.assetswitch}.READ`);
    page.state.assetAccess = this.app.checkSigOption(`${this.app.state.appnames.assetmobile}.READ`);

    page.state.gpsLocationSaved = false;

    if (page.params.firstLogin) app.state.highlightStop = false;

    page.state.loadedLog = true;
    page.state.taskLoading = true;
    page.params.href = page.params.href || page.params.itemhref;
    app.findDatasource('woPlanTaskDetailds')?.resetState();
    if (woDetailResource?.item.istask) {
      app.findDatasource('woPlanTaskDetailds')?.load();
    }
    /*
     * Syncing the woDetailResource while coming back from offline to online mode
     */
    if (this.page.state.disConnected && this.app.state.networkConnected && this.app.state.refreshOnSubsequentLogin !== false) {
      await woDetailResource?.load({
        noCache: true,
        forceSync: true,
        itemUrl: page.params.href,
      });
      this.page.state.disConnected = false;
    }
    //calculate the badge value of datasheets on calibration icon
    if (woDetailResource?.item?.pluscloop) {
      for (let wod of woDetailResource.item.pluscwods || []) {
        // istanbul ignore else
        if (wod.assetnum) {
          page.state.totalpluscwodscount += 1;
        }
      }
    }
    //Open the tools/material drawer if navigated back from reserve item page or MR page
    if (((app.lastPage?.name === 'reserveMaterials' && this.app.state.openedFrom === '') || app.lastPage?.name === 'materialRequest') && !CommonUtil.sharedData.approvalRequest) {
      this.openMaterialToolDrawer({
        item: woDetailResource.item,
        datasource: woDetailResource,
        reload: false
      });
    }
    /* VGARMATZ, tentative removal based on recommendation from TomR in slack - Creating a PR
        https://ibm-watson-iot.slack.com/archives/GNFER73HV/p1671684227096289?thread_ts=1671650671.303129&cid=GNFER73HV

    woDetailResource.forceSync();
    woDetailResource.forceReload();
    */

    const WOMultiAssetLocCIDS = await this.page.findDatasource("woMultiAssetLocationds")?.forceReload();
    this.page.state.isOfflineMultiAssetLocCI = WOMultiAssetLocCIDS?.some((item) => !item.href || !item.localref);

    let linearAsset = this.app.findDatasource("linearAsset");
    let linearAssetArr = [];
    let deviceLinear = [];

    //istanbul ignore next
    linearAsset?.clearState();
    linearAsset?.resetState();
    if (!woDetailResource?.item?.linearrelated) {
      await linearAsset?.load();
    }
    if ((page?.params?.prevPage === "editwo" || page?.params?.prevPage === "CreateWO") && woDetailResource?.item?.multiassetlocci) {
      deviceLinear.push(woDetailResource?.item?.multiassetlocci);
      await linearAsset?.load({ src: deviceLinear, noCache: true });
      this.app.state.linearinfo = this.page.state.linearinfo = woDetailResource?.item?.multiassetlocci;
    }
    else if (woDetailResource?.item?.linearrelated && woDetailResource.item.linearrelated?.length > 0) {
      woDetailResource?.item?.linearrelated.forEach((ele) => {
        linearAssetArr.push(ele);
      })
      linearAssetArr = this.linearRelatedAssetSort(linearAssetArr);
      await linearAsset?.load({ src: linearAssetArr?.[0], noCache: true });
      this.app.state.linearinfo = this.page.state.linearinfo = linearAssetArr?.[0];
    }

    if (this.page.params.lastPage === "relatedWorkOrder" && app.device.isMaximoMobile) {
      deviceLinear.push(woDetailResource?.item?.multiassetlocci ?? []);
      await linearAsset?.load({ src: deviceLinear, noCache: true });
      this.app.state.linearinfo = this.page.state.linearinfo = woDetailResource?.item?.multiassetlocci;
    }

    let woDetailds = app.findDatasource('woDetailds');

    if (!page?.params?.href) {
      this.app.state.canLoadWoDetailDS = false;
    }
    await woDetailds?.load({ noCache: true, itemUrl: page.params.href });
    page.state.isSafetyPlanReviewed = WOUtil.isSafetyPlanReviewed(woDetailds?.item, app?.client?.userInfo?.personid);
    this.app.state.canLoadWoDetailDS = true;

    if (woDetailds) {
      if (
        woDetailResource.item.relatedrecord &&
        woDetailResource.item.relatedrecordcount !==
        woDetailResource.item.relatedrecord.length
      ) {
        woDetailResource.item.relatedrecordcount =
          woDetailResource.item.relatedrecord.length;
      }
    }
    const woPlanTaskDetailds = app.findDatasource("woPlanTaskDetailds");
    // istanbul ignore else
    if (woPlanTaskDetailds) {
      CommonUtil._resetDataSource(woPlanTaskDetailds);
      await woPlanTaskDetailds?.load({ noCache: true });
    }
    page.state.loading = false;
    const rejectLabel = app.getLocalizedLabel('rejected', 'Rejected').toUpperCase();
    const index = (woDetailResource?.item?.assignment?.length > 0) ? woDetailResource?.item?.assignment?.findIndex(assignment => assignment?.laborcode === this.app.client?.userInfo?.labor?.laborcode) : 0;
    const tempRecord = woDetailResource?.item?.assignment?.[index]?.status?.toUpperCase() === rejectLabel;
    app.state.isRejected = tempRecord?.[index]?.status?.toUpperCase() === rejectLabel;
    app.state.showAssignment = CommonUtil.canInteractWorkOrder(woDetailds?.item, app);

    CommonUtil.sharedData.clickedWo = page?.params?.prevPage === "CreateWO" ? false : page.params.wonum;
    if (app.state.incomingContext && woDetailResource.items.length === 0) {
      const loadParams = {
        noCache: true,
        itemUrl: page.params.href,
      }
      if (this.app.state.refreshOnSubsequentLogin !== false) {
        loadParams['forceSync'] = true;
      }
      await woDetailResource.load(loadParams);
      if (woDetailResource.items.length === 0) {
        let errorMessage =
          'This record is not on your device. Try again or wait until you are online.';
        page.error(
          this.app.getLocalizedLabel('record_not_on_device', errorMessage)
        );
      }
    }

    /* istanbul ignore next */
    if (device.isMaximoMobile) {
      if (this.page.findDatasource('woDetailResource').item.wonum && this.page.datasources.woDetailResource.item?.asset?.length > 0) {
        this.page.state.linearAsset = this.page.datasources.woDetailResource.item.asset[0]?.islinear;
      } else if (!this.page.findDatasource('woDetailResource').item.wonum) {
        this.page.state.linearAsset = this.page.state.isLinear;
      } else if (!woDetailResource.item.assetnum) {
        this.page.state.linearAsset = this.page.state.isLinear = false;
      } else {
        this.page.state.linearAsset = this.page.state.isLinear;
      }
    }

    let wonum = this.page.findDatasource('woDetailResource')?.item.wonum;
    page.state.editDetails = !['CAN', 'CLOSE'].includes(this.page.findDatasource('woDetailResource')?.item?.status_maxvalue);
    page.state.editWo = !['CAN'].includes(this.page.findDatasource('woDetailResource')?.item?.status_maxvalue);
    this.app.state.taskCountData = this.app.state.taskCountData
      ? this.app.state.taskCountData
      : {};
    if (!app.state.doclinksCountData) {
      app.state.doclinksCountData = {};
    }
    if (!app.state.doclinksCountData[wonum]) {
      app.state.doclinksCountData[wonum] = device.isMaximoMobile
        ? woDetailResource.item?.doclinks?.member?.length
        : woDetailResource?.item.doclinkscount;
    }

    //Reload the attachment list
    if (device.isMaximoMobile) {
      let woDetailResource = page.findDatasource('woDetailResource');

      await woDetailResource.forceReload();
      await page.findDatasource('woSpecification')?.load();

      woDetailResource.item.relatedrecordcount =
        woDetailResource.item.relatedwo?.length || woDetailResource.item.relatedrecordcount;

      app.state.doclinksCountData[wonum] = woDetailResource.item.doclinks ?
        woDetailResource.item.doclinks?.member?.length
        : woDetailResource?.item.doclinkscount;
    }

    app.state.doclinksCount = app.state.doclinksCountData[wonum]
      ? app.state.doclinksCountData[wonum]
      : undefined;

    page.state.loadedLog = false;
    // Load rowsSelected prop from sessionStorage
    let selectedDisplayOption = this.app.client?.getUserProperty('displayOption');
    if (selectedDisplayOption) {
      page.state.rowsSelected = selectedDisplayOption.rowsSelected;
    }

    //Show the chechmark if service address exists on location touchpoint
    let serviceAdress = this.page.findDatasource('woServiceAddress');
    if (
      serviceAdress?.item?.longitudex &&
      serviceAdress?.item?.latitudey
    ) {
      this.page.state.gpsLocationSaved = true;
    }
    //DT178612 GPS checkmark not displayed
    //istanbul ignore next
    else if (woDetailds) {
      if (woDetailds.item?.woserviceaddress) {
        woDetailds.item.woserviceaddress.forEach((address) => {
          if (address.longitudex && address.latitudey) {
            this.page.state.gpsLocationSaved = true;
          } else if (address.geoData) {
            let geoData = address.geoData;
            if (geoData.latitudey && geoData.longitudex) {
              this.page.state.gpsLocationSaved = true;
            }
          }
        })
      }
    }

    this.updateSignaturePrompt();

    // if app has state from quickreport and work order not already in progress (for edge case scenario) mark status of work order to in progress
    const fromQuickReport = !!(this.app.state.fromQuickReport);
    if (fromQuickReport && woDetailResource.item.status !== 'INPRG') {
      await this.markStatusInprogress('fromQuickReport');
      this.app.state.fromQuickReport = 0;
    }

    const relatedWoPageDs = this.app.findPage('relatedWorkOrder')?.datasources?.relatedrecwo;
    const woDetailRelatedWorkOrder = this.app.findPage('relatedWorkOrder')?.findDatasource("woDetailRelatedWorkOrder");
    //istanbul ignore else
    if (relatedWoPageDs?.items?.length > 0) {
      const params = { noCache: true }
      //istanbul ignore else
      if (app.device.isMaximoMobile) {
        params.itemUrl = page.findDatasource('woDetailResource').item.href;
      }
      await woDetailRelatedWorkOrder.load(params);
    }
    const followUpCount = relatedWoPageDs?.items?.length || (page.datasources.woDetailResource?.item?.relatedwocount || 0)
    const srcount = page.datasources.woDetailResource?.item?.relatedticketcount || 0;
    page.state.followupCount = followUpCount + srcount;

    let mrStatus = await SynonymUtil.getDefaultExternalSynonymValue(
      this.app.findDatasource('synonymdomainData'),
      'MRSTATUS',
      'CAN'
    );
    const mrDS = await this.page.findDatasource('mrDS');
    if (mrDS) {
      await mrDS.initializeQbe();
      mrDS.setQBE('status', '!=', mrStatus);
      await mrDS.searchQBE();
    }

    if (!woDetailResource?.item.assetnum && app.device.isMaximoMobile) {
      this.page.state.linearAsset = this.page.state.isLinear = false;
    }

    /**
   * If the material request datasource is available and the current application is Supervisor,
   * sets the status filter to only show Waiting on Approval and Draft material requests, and then searches the datasource.
   */
    if (this.app.name === "supmobile" && mrDS) {
      const supMrStatus = ['WAPPR', 'DRAFT']

      await mrDS.initializeQbe();
      mrDS.setQBE('status', 'in', supMrStatus);
      await mrDS.searchQBE();
    }

    let assetDataSource = page.findDatasource('woAssetLocationds');
    if (assetDataSource) {
      await assetDataSource.load();
      const assetsrecentwos = woDetailResource.item.assetsrecentwos;
      page.state.assetLocation = true;
      if (woDetailResource.item.assetnum && this.app.checkSigOption(`${this.app.state.appnames.assetmobile}.READ`)) {
        if (assetsrecentwos && assetsrecentwos.length > 0) {
          page.state.assetLocation = false;
        }
        if (this.app.currentPage.name === "workOrderDetails") {
          //Get the href of the asset (Transactional Asset Data)
          const transAssetDs = this.app.findDatasource('assetLookupDS');
          await transAssetDs?.load();
          const woDetailResourceNew = this.app.findDatasource('woDetailResource');
          await transAssetDs?.initializeQbe();
          transAssetDs?.setQBE('assetnum', woDetailResourceNew.item?.assetnum);
          transAssetDs?.setQBE('siteid', woDetailResourceNew.item?.siteid);
          const filteredCompClose = await transAssetDs?.searchQBE();
          if (device.isMaximoMobile && filteredCompClose?.length > 0) {
            this.page.state.linearAsset = this.page.state.isLinear = filteredCompClose[0].islinear;
            woDetailResourceNew.item.company = this.app.findDatasource("assetLookupDS")?.item?.manufacturer;
            assetDataSource.item.lrm = filteredCompClose[0].lrm;
            assetDataSource.item.direction = filteredCompClose[0].direction;
          }
          transAssetDs?.clearQBE();
          await transAssetDs?.searchQBE(undefined, true);

          if (this.page.params.lastPage === "relatedWorkOrder" && app.device.isMaximoMobile) {
            this.page.state.linearAsset = this.page.state.isLinear = filteredCompClose[0].islinear;
          }

          this.page.state.assetStatus = filteredCompClose?.[0]?.isrunning;
        }
      }
    }
    if (woDetailResource) {
      const locationsrecentwos = woDetailResource.item.locationsrecentwos;
      if (woDetailResource.item.locationnum) {
        if (locationsrecentwos && locationsrecentwos.length) {
          page.state.assetLocation = false;
        }
      }
    }
    if (device.isMaximoMobile && woDetailResource.item.assetisrunning === undefined) {
      woDetailResource.item.assetisrunning = this.page.state.assetStatus ?? assetDataSource.item.isrunning;
    }
    const WOSchedulingDates = CommonUtil.getSystemProp(this.app, 'maximo.mobile.WOSchedulingDates');
    page.state.loading = false;

    //conditions to display the date and time with a local timzezone.
    if (WOSchedulingDates?.includes('SCHEDULE')) {
      if (woDetailResource.item.schedstart) {
        await this.setLocaleTime('schedstart');
      }
      if (woDetailResource.item.schedfinish) {
        await this.setLocaleTime('schedfinish');
      }
    }

    if (WOSchedulingDates?.includes('TARGET')) {
      if (woDetailResource.item.targstartdate) {
        await this.setLocaleTime('targstartdate');
      }
      if (woDetailResource.item.targcompdate) {
        await this.setLocaleTime('targcompdate');
      }
    }

    if (woDetailResource?.item.reportdate) {
      await this.setLocaleTime('reportdate');
    }
    page.state.taskLoading = false;
    this.app.state.workOrderStatus = woDetailResource?.item?.status;
  }

  /**
   * @function updateSignaturePrompt
   * @description This function updates the signature prompt based on the system property.
   */
  updateSignaturePrompt() {
    let allowedSignatureSystemProp = this.app.state?.systemProp?.["maximo.mobile.statusforphysicalsignature"];
    if (allowedSignatureSystemProp) {
      let allowedSignature = allowedSignatureSystemProp
        .split(",")
        .map((status) => status.trim());
      let selected_status_is_inprg = allowedSignature.indexOf("INPRG") > -1 ? "INPRG" : "APPR";
      this.page.state.enableSignatureButton =
        allowedSignature.length > 0 &&
        allowedSignature.indexOf(selected_status_is_inprg) > -1;
      this.page.state.compDomainStatus = selected_status_is_inprg + new Date().getTime();
    }
  }


  async pagePaused() {
    this.page.state.isSafetyPlanReviewed = false;
    this.page.findDialog('woWorkLogDrawer')?.closeDialog();
    this.page.findDialog('slidingwodetailsmaterials')?.closeDialog();
    this.page.findDialog('openChangeStatusDialog')?.closeDialog();
    this.page.findDialog('wohazardDrawer')?.closeDialog();
    this.app?.findPage("schedule")?.findDialog('woStatusChangeDialog')?.closeDialog();
    this.app?.findPage("schedule")?.findDialog('rejectAssignment')?.closeDialog();
    this.app?.findPage("schedule")?.findDialog('laborAssignmentLookup')?.closeDialog();
    this.app?.findPage("schedule")?.findDialog('assignmentHistory')?.closeDialog();
  }
  //istanbul ignore next
  linearRelatedAssetSort(arr) {
    arr.sort((a, b) => b.multiid - a.multiid);
    return arr;
  }

  /**
   * Function to open a sliding-drawer dialog to show Materials and Tools for the Work Order
   * @param event should contain
   * item - The Work Order selected.
   * datasource - The Datasource to filter Materials and Tools listed in the Dialog.
   */
  async openMaterialToolDrawer(event) {
    if (event?.reload) {
      await event.datasource.load({ itemUrl: event.item.href });
    }
    const [labelId, fallback] = ['materialsAndToolsLabel', 'Materials and tools'];
    this.page.state.dialogLabel = this.app.getLocalizedLabel(labelId, fallback);
    this.page.showDialog('slidingwodetailsmaterials');
  }

  /**
   * Function to open material request page the Work Order
   * @param event should contain
   * item - The Work Order selected.
   */
  async openMaterialRequestPage(event) {
    this.app.setCurrentPage({
      name: 'materialRequest',
      params: { href: event.item.href, mr: event.mritem },
    });
    this.page.findDialog('slidingwodetailsmaterials').closeDialog();
  }

  /**
  * Validate before closing sliding drawer.
  * @param {validateEvent} validateEvent
  */
  workLogValidate(validateEvent) {
    if (this.page.state.isWorkLogEdit) {
      validateEvent.failed = true;
      this.page.showDialog('saveDiscardWorkLogDetail');
    } else {
      validateEvent.failed = false;
    }
  }

  assetStatusValidate() {
    //istanbul ignore next
    if (this.page.state.hideUp && this.page.state.hideDown) {
      return;
    } else {
      this.page.showDialog('saveDiscardassetDialog');
    }
  }

  closeAssetStatusDialog() {
    //istanbul ignore next
    this.page.findDialog('assetStatusDialog').closeDialog();
  }

  /**
  * This method calls when click save button on save discard prompt.
  */
  saveWorkLogSaveDiscard() {
    // Save Entered Data to chat Log
    if (!this.page.state.workLogData?.sendDisable) {
      this.saveWorkLog(this.page.state.workLogData);
    }
  }

  /**
  * This method calls when click discard button on save discard prompt.
  */
  closeWorkLogSaveDiscard() {
    // Close Work Log Drawer
    this.page.state.isWorkLogEdit = false;
    this.page.state.workLogData = null;
    this.page.findDialog('woWorkLogDrawer')?.closeDialog();
  }

  /**
  * This method is called when any changes done on work log screen and return value as Object with all field value.
  * @param {value} value
  */
  watchChatLogChanges(value) {
    // Clear Debounce Timeout
    clearTimeout(this.page.state.workLogChangeTimeout);
    // Set Debounce Timeout
    this.page.state.workLogChangeTimeout = setTimeout(() => {
      if (value?.summary || value?.longDescription || (this.page.state.initialDefaultLogType && value?.logType?.value !== this.page.state.initialDefaultLogType?.replace(/!/g, "")) || value?.visibility) {
        this.page.state.isWorkLogEdit = true;
        this.page.state.workLogData = value;
        // Clear Debounce Timeout
        clearTimeout(this.page.state.workLogChangeTimeout);
      } else {
        this.page.state.isWorkLogEdit = false;
        this.page.state.workLogData = null;
        // Clear Debounce Timeout
        clearTimeout(this.page.state.workLogChangeTimeout);
      }
    }, 500);
  }

  /**
   * Computes the user name based on the provided item.
   * @param {Object} item The item object containing displayname or personid.
   * @returns {string} The computed user name.
   */
  computedUserName(item) {
    return item?.displayname || item?.personid
  }

  /*
   * Method to add new work log
   */
  async saveWorkLog(value, directSave = false) {
    let longDescription = value.longDescription;
    let summary = value.summary;
    let longType = value.logType?.value ? value.logType.value : this.page.state.defaultLogType;
    let woDetailsWorklogDs = this.page.findDatasource('woDetailsWorklogDs');

    let workLog = {
      createby: this.app.client.userInfo.personid,
      createdate: new Date(),
      logtype: longType,
      description: summary,
      anywhererefid: new Date().getTime(),
      description_longdescription: longDescription,
      clientviewable: value.visibility
    };

    let option = {
      responseProperties:
        'anywhererefid,createdate,description,description_longdescription,person.displayname--displayname,createby--personid,logtype',
      localPayload: {
        createby:
          this.app.client.userInfo.displayName ||
          this.app.client.userInfo.personid,
        personid:
          this.app.client.userInfo.displayName ||
          this.app.client.userInfo.personid,
        createdate: new Date(),
        description: summary,
        logtype: longType,
        anywhererefid: workLog.anywhererefid,
        description_longdescription: longDescription,
      },
    };
    let response;
    // istanbul ignore if
    if (directSave) {
      woDetailsWorklogDs.on('update-data-failed', this.onUpdateDataFailed);
      response = await woDetailsWorklogDs.update(workLog, option);

      // istanbul ignore if
      if (response) {
        woDetailsWorklogDs.off('update-data-failed', this.onUpdateDataFailed);
      }

      return;
    }
    try {
      this.app.userInteractionManager.drawerBusy(true);
      this.page.state.chatLogLoading = true;
      this.saveDataSuccessful = true;

      woDetailsWorklogDs.on('update-data-failed', this.onUpdateDataFailed);
      response = await woDetailsWorklogDs.update(workLog, option);
      // istanbul ignore if
      if (response) {
        woDetailsWorklogDs.off('update-data-failed', this.onUpdateDataFailed);
      }

      this.page.state.chatLogGroupData = await this.page.findDatasource(
        'woDetailsWorklogDs'
      ).forceReload();
    } catch {
    } finally {
      this.app.userInteractionManager.drawerBusy(false);
      this.page.state.chatLogLoading = false;
      //Reset default Logtype
      let schemaLogType = this.page.findDatasource(
        'woDetailsWorklogDs'
      ).getSchemaInfo('logtype');
      // istanbul ignore else
      if (schemaLogType) {
        this.page.state.defaultLogType = schemaLogType.default;
      }
    }
    //If no error happen then re-open the drawer
    // istanbul ignore else
    if (this.saveDataSuccessful) {
      this.page.state.isWorkLogEdit = false;
      this.page.state.workLogData = null;
      this.page.showDialog('woWorkLogDrawer');
    }

  }

  /*
   * Method to open the Change Status slider-drawer.
   * @param event should contain
   * item - The Work Order selected.
   * datasource - The Datasource for synonymdomain.
   */
  async openWoDtlChangeStatusDialog(event) {
    log.t(
      TAG,
      'openChangeStatusDialog : event --> ' +
      event.datasource +
      ' wonum --> ' +
      event.item.wonum
    );

    let schedulePage = this.app.pages.find((element) => {
      // istanbul ignore else
      if (element.name === 'schedule' || element.name === 'approval') {
        return element;
      } else {
        return '';
      }
    });
    //istanbul ignore else
    if (schedulePage && schedulePage !== '') {
      schedulePage.callController('openChangeStatusDialog', event);
      this.page.state.navigateToSchedulePage = true;
    }
  }

  /**
   * Opens the Reject Work Order dialog
   * @param {Event} event - The event that triggered the action
   */
  openWoDtlRejectWoDialog(event) {
    log.t(
      TAG,
      'openRejectDialog : event --> ' +
      event.datasource +
      ' wonum --> ' +
      event.item.wonum
    );

    let schedulePage = this.app.pages.find((element) => {
      // istanbul ignore else
      if (element.name === 'schedule' || element.name === 'approval') {
        return element;
      } else {
        return '';
      }
    });
    //istanbul ignore else
    if (schedulePage && schedulePage !== '') {
      schedulePage.callController('rejectWO', event);
      this.page.state.navigateToSchedulePage = true;
    }
  }

  //istanbul ignore next
  async approveWO(event) {
    log.t(TAG,
      'approveWO : event --> ' +
      event.datasource +
      ' wonum --> ' +
      event.item.wonum
    );

    this.page.state.workloading = true;
    const woDetailDs = await this.app.findDatasource("woDetailds");

    //istanbul ignore if
    if (!this.page?.params?.href) {
      this.app.state.canLoadWoDetailDS = false;
    }
    await woDetailDs?.load({ noCache: true, itemUrl: this.page.params.href });
    this.app.state.canLoadWoDetailDS = true;

    const schedPage = this.app.findPage('schedule') || this.app.findPage("approvals");
    const wolistds = this.app.findDatasource(schedPage.state.selectedDS);
    await CommonUtil.markStatusAssigned(this.app, this.page, woDetailDs, wolistds);
    this.app.state.showLoaderOnAllWO = this.page.state.workloading = false;
    this.app.state.showAssignment = CommonUtil.canInteractWorkOrder(woDetailDs.item, this.app);
  }

  /**
* This method is called by clicking on start work or stop work button on work order detail page
* and start/stop timer for specific work order accordingly.
* @param {event} event
*/
  //istanbul ignore next
  async openSignatureDialog(event) {
    let workorder = event.item;

    let woDetailds = this.app.findDatasource("wodetails");
    //istanbul ignore else
    if (!workorder?.href) {
      this.page.state.canLoadWoDetails = false;
    }
    await woDetailds.load({ noCache: true, itemUrl: workorder.href });
    this.page.state.canLoadWoDetails = true;
    await this.app.userInteractionManager.openSignature(
      async imageData => {
        log.t(TAG, "base64 image" + imageData);

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
        datasource: this.app.findDatasource("signatureAttachment"),
        onUpload: this.onUpload.bind(this),
      })
  }

  /**
* This method invokes complete work API once image is uploaded.
*/
  //istanbul ignore next
  async onUpload(manual = true) {
    if (manual && (this.page.state.fromQuickReport || this.page.state.fromQuickReport === undefined) && CommonUtil.sharedData.newPageVisit) {
      CommonUtil.sharedData.newPageVisit = false;
      return;
    }
    //During Start work it will not wait for the API response
    let woDetailResourceDS = this.app.findDatasource("woDetailResource");
    //istanbul ignore else
    if (woDetailResourceDS) {
      this.app.state.doclinksCountData[woDetailResourceDS.item.wonum] = Device.get().isMaximoMobile ? woDetailResourceDS.item?.doclinks?.member?.length : woDetailResourceDS.item?.doclinkscount;
      this.app.state.doclinksCount = this.app.state.doclinksCountData[woDetailResourceDS.item.wonum];
    }
    const workorder = {
      item: woDetailResourceDS.item,
      datasource: woDetailResourceDS,
      action: "start",
      worktype: "work"
    }
    if (manual) {
      await this.startWOStopTimer(workorder);
    }
    this.updateSignaturePrompt();
  }


  /**
   * This method is called by clicking on start work or stop work button on work order detail page
   * and start/stop timer for specific work order accordingly.
   * @param {event} event
   */
  async startWOStopTimer(event) {
    CommonUtil.callGeoLocation(this.app, event.action);
    const woDetailResource = this.page.findDatasource('woDetailResource');
    const woLaborDetailDS = this.page.findDatasource('woLaborDetailds');

    this.page.state.currentItem = event.item.wonum;
    this.page.state.transactionProgress = true;

    /**
     * changing the disConnected flag when starting WO in Offline
     */
    // istanbul ignore else
    if (!this.app.state.networkConnected) this.page.state.disConnected = true;

    await WOTimerUtil.clickStartStopTimer(
      this.app,
      this.page,
      event,
      event.worktype,
      woDetailResource,
      woLaborDetailDS,
      'woConfirmLabTime'
    );
  }

  /**
   * @function markStatusInprogress
   * @description This function is used to mark work order as in progress.
   */
  async markStatusInprogress() {
    const dataFormatter = this.app.dataFormatter;
    const currDate = dataFormatter.convertDatetoISO(dataFormatter.currentUserDateTime());
    const action = 'changeStatus';
    const woDetailResourceDS = this.app.findDatasource("woDetailResource");
    this.updateSignaturePrompt();

    // if phsycial signature property is enable prompt for physical signature and wait for it
    // if user cancels signature it will not let
    // istanbul ignore else
    if (this.page.state.enableSignatureButton) {
      await this.openSignatureDialog(woDetailResourceDS);
    }

    this.page.state.selectedStatus = "INPRG";
    this.page.state.selectedStatusMaxValue = "INPRG";
    this.page.state.selectedStatusDescription = "In Progress";


    let option = {
      record: woDetailResourceDS.item,
      parameters: {
        status: 'INPRG',
        date: currDate,
        memo: this.page.state.statusMemo
      },
      headers: {
        'x-method-override': 'PATCH'
      },
      responseProperties: 'status',
      localPayload: {
        status: 'INPRG',
        memo: this.page.state.statusMemo,
        statusdate: currDate,
        status_maxvalue: "INPRG",
        status_description: "In Progress",
        href: woDetailResourceDS.item.href
      },
      query: { interactive: false },
      esigCheck: 0
    };
    // istanbul ignore else
    if (CommonUtil.checkEsigRequired(this.app, this.page, "INPRG")) {
      option.esigCheck = 1;
    }

    try {
      this.page.state.loadingstatus = true;
      // istanbul ignore else
      if (woDetailResourceDS) {
        await woDetailResourceDS.invokeAction(action, option);
        woDetailResourceDS.item.selectedStatus = "INPRG";
        woDetailResourceDS.item.status_maxvalue = "INPRG";
        await woDetailResourceDS.forceReload();
        this.onUpload(false);
      }
    } finally {
      this.page.state.loadingstatus = false;
    }
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  /**
  * Deletes the timer entry from the database and navigates to the schedule page.
  */
  onDeleteEntry() {
    WOTimerUtil.deleteTimerEntry(this.app, this.page);
  }

  /**
   * This method is called by clicking edit labor button on confirm dialog.
   */
  async onClickEditLabor() {
    let wodetails = this.page.findDatasource('woDetailResource');
    const woLaborDetailDS = this.page.findDatasource('woLaborDetailds');
    woLaborDetailDS.item.wonum = wodetails.item.wonum;
    await WOTimerUtil.clickEditLabor(
      this.app,
      wodetails.item.href,
      woLaborDetailDS.item
    );
  }

  /**
   * This method is called by clicking send button on confirm dialog.
   * @param {event} event
   */
  async onClickSendLabTrans(event) {
    const woDetailResource = this.page.findDatasource('woDetailResource');
    const woLaborDetailDS = this.page.findDatasource('woLaborDetailds');
    await WOTimerUtil.clickSendLabTrans(
      this.app,
      this.page,
      event.action,
      woDetailResource,
      woLaborDetailDS,
      event.item
    );

    //Update the wo list after start/stop WO
    //istanbul ignore next
    if (this.app.findPage('schedule')) {
      let schedPage = this.app.findPage('schedule') || this.app.findPage("approvals");
      const wolistds = this.app.findDatasource(schedPage.state.selectedDS);
      await wolistds.forceReload();
    }
  }

  /**
   * Redirects to attachments page.
   */
  showAttachmentPage(event) {
    this.app.state.woStatus = event.item.status_maxvalue;
    this.app.setCurrentPage({
      name: 'attachments',
      params: { itemhref: event.item.href },
    });
  }


  /**
   * Redirects to Related work order page.
   */
  showRelatedWOPage(event) {
    this.page.state.clickable = this.page.params?.depth === 1;
    this.app.setCurrentPage({
      name: 'relatedWorkOrder',
      params: {
        itemhref: event.item.href,
        fromQuickReport: event.item.isquickreported,
        followupclickable: this.page.state.clickable
      },
      pushStack: true
    });
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Shows the specifications of the work order.
   * @async
   * @function showSpecifications
   * @returns {void}
   */
  async showSpecifications() {
    this.page.state.specificationSaveDisable = false;
    const woSpecification = this.page.findDatasource('woSpecification');
    await woSpecification.load({ noCache: true });
    //istanbul ignore next
    this.page.showDialog('woSpecificationDrawer');
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Shows the specifications of the work order.
   * @async
   * @function openEditSpecification
   * @returns {void}
   */
  async openEditSpecification() {
    this.page.state.specificationLoader = true;
    await WOCreateEditUtils.generateCombineSpecDs(this.app, 'woSpecificationsCombinedDS');
    await this.page.showDialog('woSpecificationEditDrawer');
    this.page.state.specificationLoader = false;
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Closes the specification loader.
   * @param {boolean} pageState - The current state of the page.
   */
  onCloseSpecification() {
    this.page.state.specificationLoader = false;
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Opens a dialog for domain lookup based on the data type of the current field.
   * @param {Event} evt The event object.
   */
  async openSpecLookup(evt) {
    let ds;
    let dialogName;
    this.page.state.lookupLoader = true;
    this.currentField = evt?.item;
    if (evt?.item?.datatype_maxvalue === "NUMERIC") {
      ds = this.app.findDatasource("numericDomainDS");
      dialogName = 'woSpecNumericDomainLookup';
    } else if (evt?.item?.datatype_maxvalue === "ALN") {
      ds = this.app.findDatasource("alnDomainDS");
      dialogName = 'woSpecAlnDomainLookup';
    } else {
      ds = this.app.findDatasource("tableDomainDS");
      dialogName = 'woSpecTableDomainLookup';
    }
    await ds?.clearState();
    await ds?.initializeQbe();
    ds?.setQBE("domainid", "=", evt.item.domainid);
    await ds?.searchQBE();
    this.page.state.lookupLoader = false;
    this.page.showDialog(dialogName);
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Choose Work Order Specification Domain
   * @param {object} itemSelected - The selected item from the dropdown
   * @returns {void}
   */
  async chooseWoSpecDomain(itemSelected) {
    let updateValue = this.currentField;
    let woSpecCombinedDS = this.app.findDatasource("woSpecificationsCombinedDS");
    updateValue.alnvalue = itemSelected.value;
    updateValue.igtentered = this.app.dataFormatter.convertDatetoISO(new Date());
    updateValue.igtenteredby = this.app?.client?.userInfo?.personid || this.app?.userInfo?.personid;
    woSpecCombinedDS?.items.push(updateValue);
    this.validateSpecification();
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Choose work order specification number and domain.
   * @param {object} itemSelected - The selected item from the dropdown menu.
   * @returns {void}
   */
  async chooseWoSpecNumDomain(itemSelected) {
    let updateValue = this.currentField;
    let woSpecCombinedDS = this.app.findDatasource("woSpecificationsCombinedDS");
    updateValue.numvalue = itemSelected.value;
    updateValue.igtentered = this.app.dataFormatter.convertDatetoISO(new Date());
    updateValue.igtenteredby = this.app?.client?.userInfo?.personid || this.app?.userInfo?.personid;
    woSpecCombinedDS?.items.push(updateValue);
    this.validateSpecification();
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Choose Work Order Specification Table Domain
   * @param {object} itemSelected - The selected item from the dropdown
   * @returns {void}
   */
  async chooseWoSpecTableDomain(itemSelected) {
    let updateValue = this.currentField;
    let woSpecCombinedDS = this.app.findDatasource("woSpecificationsCombinedDS");
    updateValue.tablevalue = itemSelected.description;
    woSpecCombinedDS?.items.push(updateValue);
    this.validateSpecification();
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Closes the specification drawer.
   * 
   * @param {object} validateEvent - Event from validate props of drawer
   * @returns {void}
   */
  async onSpecificationClose(validateEvent) {
    //istanbul ignore else
    if (this.app.findDatasource('woSpecificationsCombinedDS').state.itemsChanged) {
      validateEvent.failed = true;
      await this.page.showDialog('saveDiscardSpecificationDialog');
    } else {
      validateEvent.failed = false;
    }
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Closes the specification drawer.
   * 
   * @returns {void}
   */
  async closeSpecificationDrawer() {
    await this.app.findDatasource('woSpecificationsCombinedDS')?.clearState();
    await this.page.findDialog('saveDiscardSpecificationDialog')?.closeDialog();
    await this.page.findDialog("woSpecificationEditDrawer")?.closeDialog();
    this.page.state.specificationLoader = false;
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Validates the specification and disables the save button if there are any client warnings.
   * @returns {void}
   */
  validateSpecification() {
    const datasource = this.app.findDatasource('woSpecificationsCombinedDS');
    this.page.state.specificationSaveDisable = datasource?.state?.clientWarnings ? Object.keys(datasource.state.clientWarnings).length : false;
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Save the work order specification.
   * 
   * @async
   * @function
   * @returns {void}
   */
  async saveSpecification() {
    this.page.state.specificationLoader = true;
    let interactive = { interactive: !Device.get().isMaximoMobile };
    const woSpecCombinedDS = this.app.findDatasource("woSpecificationsCombinedDS");

    //istanbul ignore else
    if (woSpecCombinedDS) {
      let woDetailsResource = this.app.findDatasource("woDetailResource");
      woDetailsResource.item.workorderspec = woSpecCombinedDS.items;
      interactive.localPayload = {
        ...woDetailsResource.item,
        workorderspec: woSpecCombinedDS.items
      }
      await woDetailsResource.save(interactive);
      await this.page.findDatasource('woSpecification')?.forceReload();
    }

    await this.page.findDialog("woSpecificationEditDrawer")?.closeDialog();
    this.page.state.specificationLoader = false;
  }

  /**
   * Switch to Assist application with context
   */
  gotoAssistApp(event) {
    log.t(TAG, 'gotoAssistApp', event.item);
    const item = event.item || {};
    const woFields = [
      'wonum',
      'title',
      'workorderid',
      'assetnum',
      'assetdesc',
      'assettype',
      'company',
      'failurecode',
      'failuredesc',
      'problemcode',
      'status',
      'status_description',
      'owner',
      'siteid',
      'href',
      'reportdate',
      'actstart',
      'schedstart',
      'targstartdate',
      'classificationid',
      'jpnum',
      'jpdesc',
      'taskid',
      'task_description',
      'task_status',
      'task_status_description',
      'task_inspname',
      'task_inspresult',
      'locationnum',
      'locationdesc',
    ];
    const { description, locationnum, failure, taskid } = item;
    let value = { wodesc: description };
    for (const key of woFields) {
      if (item[key] != null) {
        value[key] = item[key];
      }
    }
    // istanbul ignore else
    if (locationnum) {
      value.location = item.locationnum;
    }
    // istanbul ignore next
    if (failure?.description) {
      if (value.failuredesc == null) {
        value.failuredesc = failure.description;
      }
    }
    let type = taskid ? 'mxwotask' : 'mxwo';
    // maximo wo context passed to assist app
    let context = { type, value };
    this.app.emit('loadApp', {
      appName: this.app.state.appnames.assist,
      context,
    });
  }

  /**
   * Function to load card view of a selected work order on map-overlay
   */
  async handleMapPage(event) {
    let schedPage = this.app.findPage('schedule') || this.app.findPage("approvals");
    //istanbul ignore else
    if (schedPage) {
      schedPage.state.selectedSwitch = 1;
      schedPage.state.mapOriginPage = 'wodetail';
      schedPage.state.previousPage = 'wodetail';
      this.app.setCurrentPage(schedPage);
      schedPage.callController('openWOCard', event);
    }
  }

  /**
   * Function to display asset mismatch dialog or confirmation toast based on barcode scanned value.
   */
  async handleAssetScan(event) {
    this.page.state.assetScanValue = event.value
      ? event.value
      : this.app.getLocalizedLabel('unknown', 'Unknown');
    let woAssetLocationds = await this.page.findDatasource(
      'woAssetLocationds'
    ).load();

    if (this.page.state.assetScanValue === woAssetLocationds[0].assetnum) {
      let label = this.app.getLocalizedLabel(
        'asset_confirmed',
        'Asset confirmed'
      );
      this.app.toast(label, 'success');
    } else {
      this.page.showDialog('assetMisMatchDialog');
    }
  }

  /**
   * Close asset mismatch dialog.
   */
  async closeMisMatchDialog() {
    // istanbul ignore next
    if (this.page) {
      this.page.findDialog('assetMisMatchDialog').closeDialog();
    }
  }

  /**
   * Open barcode scanner after closing the dialog.
   */
  openBarcodeScanner(event) {
    this.closeMisMatchDialog();
    this.handleAssetScan(event);
  }

  /*
   * Method to open the asset workOrder history.
   */
  openAssetWorkOrder(event) {

    this.app.setCurrentPage({ name: 'assetWorkOrder' });
    // istanbul ignore else
    if (this.app.currentPage) {
      this.app.currentPage.callController('loadRecord', event);
    }
  }

  /*
   * Save GPS latitude and longitude in service address of the workorder.
   */
  async saveGPSLocation(item) {
    const { longitude, latitude } = this.app.geolocation.state;
    const spatialReference = CommonUtil.sharedData.basemapSpatialReference;

    let coords;
    // converting coordinates to LAT LONG from XY
    if (item.coordinate === 'XY') {
      coords = OpenLayersAdapter.transformCoordinate([longitude, latitude], 'EPSG:4326', spatialReference)
    }
    else {
      coords = [longitude, latitude];
    }

    const [latitudeX, longitudeY] = coords;
    const geoData = { longitudex: latitudeX, latitudey: longitudeY };

    await this.page.findDatasource('woServiceAddress').update(geoData, {
      responseProperties: 'wonum',
      localPayload: { geoData },
    });

    item.autolocate = `{"coordinates":[${latitudeX},${longitudeY}],"type":"Point"}`;

    const woDetailsDS = this.app.findDatasource('woDetailResource');
    await woDetailsDS.initializeQbe();
    woDetailsDS.setQBE('wonum', item.wonum);

    const [woSearch] = await woDetailsDS.searchQBE(undefined, false);
    if (woSearch) {
      woSearch.autolocate = `{"coordinates":[${latitudeX},${longitudeY}],"type":"Point"}`;;
    }

    this.app.toast(
      this.app.getLocalizedLabel('gps_location_saved', 'Device location saved'), 'success', '');
    this.page.state.gpsLocationSaved = true;
  }
  /**
   * Function to open edit work order page when click on edit icon
   * Passing current workorder details in page params to get the current work order details on edit page
   */
  workOrderEdit(event) {
    let workorder = event.item;
    let woSchema = this.app.findDatasource(event.datasource).getSchema();
    // istanbul ignore next
    if (workorder && (workorder.wonum || workorder.href)) {
      this.app.state.woDetail = {
        page: 'workOrderDetails',
        wonum: this.page.params.wonum,
        siteid: this.page.params.siteid,
        href: this.page.params.href,
      };
      this.app.setCurrentPage({
        name: 'woedit',
        resetScroll: true,
        params: {
          href: workorder.href,
          workorder, woSchema,
          wonum: workorder.wonum,
          istask: workorder.istask,
          wogroup: workorder.wogroup,
          taskid: workorder.taskid,
          wo: event.item,
          fromQuickReport: workorder.isquickreported
        },
      });
    }
  }

  /*
   * Opens the asset down time drawer on basis of workorder asset
   */
  async openAssetDownTimeDrawer(event) {
    let device = Device.get();
    let offlineModDowntime = [];
    let anywhereContainerMode = device.isMaximoMobile;
    let woDetailDs = this.page.findDatasource('woDetailResource');
    let modDownTime = woDetailDs.item.moddowntimehist;
    this.page?.findDatasource('downTimeReportAsset')?.setSchema(woDetailDs?.getSchema());
    this.page.state.upDownButtonGroupdata = [
      {
        id: 'assetUpBtn',
        iconName: 'carbon:arrow--up',
        toggled: event.item.assetisrunning,
      },
      {
        id: 'assetDownBtn',
        iconName: 'carbon:arrow--down',
        toggled: !event.item.assetisrunning,
      },
    ];

    let statusdate = '';
    // istanbul ignore next
    if (modDownTime?.length) {
      // istanbul ignore else
      if (anywhereContainerMode) {
        offlineModDowntime = modDownTime.filter(
          (item) => item.savedFromDevice === true
        );
      }

      if (
        offlineModDowntime?.length &&
        anywhereContainerMode
      ) {
        statusdate = modDownTime[modDownTime.length - 1].startdate;
      } else {
        statusdate = modDownTime[0].enddate ? modDownTime[0].enddate : modDownTime[0].startdate;
      }
    }
    this.page.state.lastStatusChangeDate = statusdate;

    this.page.state.hideUp = true;
    this.page.state.hideDown = true;
    this.page.state.disableSaveDowtimeButton = true;
    this.page.state.downTimeCodeValue = '';
    this.page.state.downTimeCodeDesc = '';
    await this.setCurrentDateTime();
    this.page.showDialog('assetStatusDialog');
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Opens the reassignment drawer.
   * @param {boolean} loading - The loading state of the page.
   * @returns {Promise<void>} A promise that resolves when the dialog is shown.
   */
  async openReassignmentDrawer() {
    this.app.state.canReturn = true;
    const woDetailDs = this.app.findDatasource("woDetailds");
    this.app.state.canLoadWoDetailDS = false;
    woDetailDs.load({ noCache: true, itemUrl: this.page.params.href });
    this.app.state.canLoadWoDetailDS = true;
    await CommonUtil.showReturn(this.app, woDetailDs);
    await this.app.showDialog("laborAssignmentLookup");
    this.page.state.loading = false;
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Opens the reassignment dialog.
   * @param {Object} page - The page object.
   * @param {Object} dialogConfig - The dialog configuration object.
   * @returns {Promise<void>} A promise that resolves when the dialog is closed.
   */
  async openReassignmentDialog() {
    const woDetailResource = this.app.findDatasource('woDetailResource');
    //work order is in progress return it
    //istanbul ignore else
    if (woDetailResource.item.computedWOTimerStatus) {
      this.app.toast(this.app.getLocalizedLabel('infoOnReassign', `Stop or pause the work to remove or transfer the assignment.`), 'info');
      return;
    }
    this.page.state.loading = true;
    CommonUtil.sharedData.allowReassignmentPage = {
      name: this.page.name,
      callController: this.page.callController.bind(this.page)
    }
    const dialogConfig = CommonUtil.sharedData?.reassignDialogConfig;
    CommonUtil.getConfirmDialogLabel(this.app, dialogConfig);
    await this.app.showDialog('confirmDialog');
    this.page.state.loading = false;
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Unassignment function
   * @param {Object} item - Work order item
   * @param {Object} datasource - Work order datasource
   * @returns {void}
   */
  unassignment() {
    CommonUtil.sharedData.clickedUnassignment = true;
    const woDetailResource = this.page.findDatasource('woDetailResource');
    const schedulePage = this.app.pages.find((element) => {
      //istanbul ignore else
      if (element.name === 'schedule' || element.name === 'approval') {
        return element;
      } else {
        return '';
      }
    });
    const evt = { 'item': woDetailResource.item, 'datasource': woDetailResource.datasource, 'action': 'Reject' }
    schedulePage.callController('rejectWO', evt);
    CommonUtil.sharedData.clickedUnassignment = false;
    CommonUtil.clearSharedData(CommonUtil.sharedData?.allowReassignmentPage);
    CommonUtil.clearSharedData(CommonUtil.sharedData?.event);
  }

  /*
   * Set current Date/Time
   */
  async setCurrentDateTime() {
    let downTimeReportAsset = this.page.findDatasource('downTimeReportAsset');
    let downTimeData = [
      {
        statuschangedate: this.app.dataFormatter.convertDatetoISO(new Date()),
      },
    ];
    await downTimeReportAsset.load({ src: downTimeData, noCache: true });
  }

  /*
   * Functions that support to display the local timezone
   */
  // istanbul ignore next 
  async setLocaleTime(date_value) {
    const woDetailResource = this.page.findDatasource('woDetailResource');

    const localeString = new Date(
      `${woDetailResource.item[date_value]}`
    ).toString();

    const new_date_value = this.app.dataFormatter.convertDatetoISO(
      localeString
    );

    woDetailResource.item[date_value] = new_date_value;
  }
  /*
   * Switch between up and down state
   */
  handleToggled(evt) {
    this.page.state.hideUp = false;
    this.page.state.hideDown = false;
    const id = evt.item.id;
    for (
      let index = 0;
      index < this.page.state.upDownButtonGroupdata.length;
      index++
    ) {
      const element = this.page.state.upDownButtonGroupdata[index];

      if ((id === 'assetDownBtn' && evt.isrunning) || (id === 'assetUpBtn' && !evt.isrunning)) {
        this.page.state.hideUp = false;
        this.page.state.hideDown = false;
        // istanbul ignore next
        window.setTimeout(() => {
          this.validateDownTimeDate();
        }, 50);
      } else {
        this.page.state.hideUp = true;
        this.page.state.hideDown = true;
        // istanbul ignore next
        window.setTimeout(() => {
          this.page.state.disableSaveDowtimeButton = true;
        }, 50);
      }

      // istanbul ignore else
      if (element.id === id) {
        element.toggled = evt.item.toggled;
        break;
      }
    }
  }

  /**
   * Function to open Down time lookup
   */
  async openDowntimeCodeLookup(evt) {
    let downTimeCodeLookup = this.app.findDatasource("alnDomainDS");
    await downTimeCodeLookup.initializeQbe();
    downTimeCodeLookup.setQBE('domainid', '=', 'DOWNCODE');
    downTimeCodeLookup.searchQBE();
    evt.page.showDialog('downTimeCodeLookup');
  }

  /**
   * Function to choose Down time code
   */
  chooseDownTimeCode(evt) {
    // istanbul ignore else
    if (evt) {
      this.page.state.downTimeCodeValue = evt.value;
      this.page.state.downTimeCodeDesc = evt.description;
    }
  }

  /**
   * Validate down time date
   */
  validateDownTimeDate() {
    let downTimeReportAsset = this.page.findDatasource('downTimeReportAsset');
    let dataFormatter = this.app.dataFormatter;
    let statusChangeDate = downTimeReportAsset.item['statuschangedate'];
    let errorMessage = '';
    let errorField = '';

    if (downTimeReportAsset.currentItem != null && downTimeReportAsset.getWarning(downTimeReportAsset.currentItem, 'statuschangedate')) {
      this.page.state.disableSaveDowtimeButton = true;
      this.clearWarnings('statuschangedate');
      return;
    }

    if (statusChangeDate === '') {
      errorMessage = this.app.getLocalizedLabel(
        'assetStatusDateRequired',
        'Status Date is required.'
      );
      errorField = 'statuschangedate';
      this.showDownTimeWarning(errorField, errorMessage);
      this.page.state.disableSaveDowtimeButton = true;
      return errorMessage;
    } else {
      this.page.state.disableSaveDowtimeButton = false;
      this.clearWarnings('statuschangedate');
    }

    // istanbul ignore else
    if (this.page.state.lastStatusChangeDate) {
      if (
        dataFormatter.convertISOtoDate(statusChangeDate).getTime() <=
        dataFormatter
          .convertISOtoDate(this.page.state.lastStatusChangeDate)
          .getTime()
      ) {
        this.page.state.disableSaveDowtimeButton = true;
        errorMessage = this.app.getLocalizedLabel(
          'assetStatusDateCompare',
          'New asset status change date must be greater than change dates on all previous transactions for this asset.'
        );
        errorField = 'statuschangedate';
        this.showDownTimeWarning(errorField, errorMessage);
        return errorMessage;
      } else {
        this.page.state.disableSaveDowtimeButton = false;
        this.clearWarnings('statuschangedate');
      }
    }
  }

  /**
   * Function to set field warnings
   */
  // istanbul ignore next
  showDownTimeWarning(field, message) {
    let downTimeReportAsset = this.page.findDatasource('downTimeReportAsset');
    downTimeReportAsset.setWarning(downTimeReportAsset.item, field, message);
  }

  /**
   * Function to clear field warnings
   */
  // istanbul ignore next
  clearWarnings(field) {
    let downTimeReportAsset = this.page.findDatasource('downTimeReportAsset');
    downTimeReportAsset.clearWarnings(downTimeReportAsset.item, field);
  }

  /**
   * Save asset dowtime
   */
  async saveAssetDownTimeTransaction(evt) {
    let downTimeReportAsset = evt.page.findDatasource('downTimeReportAsset');
    let woDetailDs = evt.page.findDatasource('woDetailResource');
    let action = 'downtimereport';
    let option = {
      objectStructure: `${this.app.state.woOSName}`,
      parameters: {
        statuschangedate: downTimeReportAsset.item.statuschangedate,
        statuschangecode: evt.page.state.downTimeCodeValue || '',
        operational: '1',
      },
      record: woDetailDs.item,
      responseProperties: 'moddowntimehist{*}',
      localPayload: {
        statuschangedate: downTimeReportAsset.item.statuschangedate,
        assetisrunning: !woDetailDs.item.assetisrunning,
        moddowntimehist: [
          {
            startdate: downTimeReportAsset.item.statuschangedate,
            savedFromDevice: true,
          },
        ],
      },
    };

    try {
      evt.page.state.loadingreportdowntimebtn = true;
      await woDetailDs.invokeAction(action, option);
      await woDetailDs.forceReload();
    } finally {
      evt.page.state.loadingreportdowntimebtn = false;
      evt.page.findDialog('assetStatusDialog').closeDialog();
    }
  }

  /**
   * Set the Log Type from the Lookup
   */
  async setWODetailsLogType(event) {
    this.page.state.defaultLogType = event.value;
  }

  /** Function to open reserve material page.
   * @param event should contain
   * item - The Work Order selected.
   */
  async openReservedMaterials(event) {
    this.app.setCurrentPage({
      name: 'reserveMaterials',
      params: { href: event.item.href, wonum: event.item.wonum },
    });
    this.page.findDialog('slidingwodetailsmaterials')?.closeDialog();
  }

  /**
   * Function to set flag for 'save-data-failed' event
   */
  onUpdateDataFailed() {
    this.saveDataSuccessful = false;
  }

  /**
   * closing all dialogs of workorder detail page
   */
  _closeAllDialogs(page) {
    /* istanbul ignore else */
    if (page?.dialogs?.length) {
      page.dialogs.map((dialog) => page.findDialog(dialog.name).closeDialog());
    }
  }

  /**
   * Handle Delete transaction
   */
  async handleDeleteTransaction(event) {
    //istanbul ignore else
    if (
      event.app === this.app.name &&
      (this.app.currentPage.name === this.page.name ||
        this.app.lastPage.name === this.page.name)
    ) {
      const woDetailResource = this.page.findDatasource('woDetailResource');
      //See of the detail page's record is the same one that had the transaction deleted.
      /* istanbul ignore else */
      if (woDetailResource?.currentItem?.href === event.href) {
        let records = await woDetailResource.load({
          noCache: true,
          itemUrl: woDetailResource.currentItem.href,
        });

        //If no record was returned then the work order was removed so redirect the user to the schedule page.
        /* istanbul ignore else */
        if (!records || records.length === 0) {
          this._closeAllDialogs(this.page);
          const schPage = (this.app.findPage("schedule")) ? 'schedule' : 'approvals';
          this.app.setCurrentPage({ name: schPage, resetScroll: true });
        }
      } else if (
        this.app.currentPage.name !== this.page.name &&
        this.app.currentPage?.getMainDatasource()?.currentItem?.href === event.href
      ) {
        await this.app.currentPage
          .getMainDatasource()
          .load({ noCache: true, itemUrl: event.href });
      }

      let schedPage = this.app.findPage('schedule') || this.app.findPage("approvals");
      // istanbul ignore if
      if (schedPage) {
        await this.app.findDatasource(schedPage.state.selectedDS).forceReload();
      }
    }
  }

  /*
   * Open Safety Drawer
   */
  async openHazardDrawer(event) {
    WOUtil.openWOHazardDrawer(this.app, this.page, event, 'wohazardDrawer');
  }

  /*
   * Open Safety Drawer
   */
  async openAssignmentHistory() {
    this.page.state.loading = true;
    await this.app.findDatasource('assignmentDetailds').forceReload();
    this.page.showDialog("assignmentHistory");
    this.page.state.loading = false;
  }

  /**
   * Review the safetyplan
   */
  async reviewSafetyPlan() {
    await WOUtil.reviewSafetyPlan(this.app);
    this.app
      .findDatasource('woDetailResource')
      .load({ noCache: true, itemUrl: this.page.params.href });
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Shows the multi-asset page from the woDetailsResource page.
   *
   * @param {Object} event - The event object containing the necessary data.
   *
   */
  showMultiAssetPage({ href, ds }) {
    this.app.setCurrentPage({
      name: 'multiAssetLocCi',
      resetScroll: true,
      params: {
        href: href,
        ds: ds
      },
      pushStack: true
    });
  }

  /**
   * Method to navigate to asset details of asset app
   */
  async navigateToAssetDetails() {
    this.page.state.loadAssetData = true;
    const woDetailResource = this.app.findDatasource('woDetailResource');

    try {
      this.page.state.loadAssetData = false;
      //istanbul ignore else
      let context = {
        page: 'assetDetails',
        assetnum: woDetailResource.item.assetnum,
        siteid: woDetailResource.item.siteid,
        href: woDetailResource.currentItem.asset[0].href,
      };
      this.app.callController('loadApp', {
        appName: this.app.state.appnames.assetmobile,
        context,
      });
    } catch {
    } finally {
      this.page.state.loadAssetData = false;
    }
  }

  /**
      * Method to navigate to Calibration Pages
      */
  //istanbul ignore next
  navigateToCalibration(item) {
    this.app.state.dataSheethref = item.href;
    this.app.state.assetnum = item.assetnum;
    if (item.assetnum && item.iscalibration) {
      let assetNumber = '';
      let assetDescription = '';
      if (item.assetnum) {
        assetNumber = item.assetnum;
      } else if (item.assetnumber) {
        assetNumber = item.assetnumber;
      }
      if (item.assetdesc) {
        assetDescription = item.assetdesc;
      }
      this.app.state.datasheetName = `${assetNumber} ${assetDescription}`;
    } else if (item.locationnum && item.pluscloop) {
      this.app.state.datasheetName = `${item.locationnum ? item.locationnum : ''} ${item.locationdesc ? item.locationdesc : ''}`;
    } else {
      this.app.state.datasheetName = "";
    }
    this.app.state.datasheetWonum = item.wonum;
    this.app.state.datasheetSiteid = item.siteid;
    if (item.pluscloop) {
      this.app.setCurrentPage({
        name: 'loopassetlist',
        params: {
          location: item.locationnum,
          href: item.href
        }
      });
    } else if (item?.wonum) {
      this.app.setCurrentPage({
        name: 'datasheets',
        params: {
          href: item.href,
          wonum: item.wonum
        }
      });
    }
  }
}

export default WorkOrderDetailsController;
