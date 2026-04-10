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

    // ── Kick off task-list load early (runs in parallel with everything below) ──
    const taskListPromise = this._loadTaskList(app, page);
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
    // ── Await the task-list promise that was kicked off earlier ──
    await taskListPromise;
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

    // Sync attachment / related-record counts on mobile
    // (uses data already loaded at line 133 — no redundant forceReload)
    if (device.isMaximoMobile) {
      // Load woSpecification in parallel (non-blocking for task list)
      page.findDatasource('woSpecification')?.load();

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
   * Redirects to attachments page for a specific task item.
   * Called from the inline task checklist navigator-tile.
   *
   * The task's href from woPlanTaskDetailds is a relational URL
   * (e.g. .../woactivity/456) which the attachment page's
   * igtapiwodetail datasource cannot load directly.
   * We build a direct href using the parent WO's base URL pattern
   * and the task's own workorderid.
   */
  showTaskAttachmentPage(event) {
    const taskItem = event?.item;
    if (!taskItem) {
      log.e(TAG, 'showTaskAttachmentPage: no task item');
      return;
    }

    // Build a direct igtapiwodetail href for the task
    const parentWo = this.page.findDatasource('woDetailResource')?.item;
    let taskHref = taskItem.href;

    if (parentWo?.href && taskItem.workorderid) {
      // Parent href is like /oslc/os/igtapiwodetail/123
      // Replace the parent's workorderid with the task's workorderid
      const baseUrl = parentWo.href.substring(0, parentWo.href.lastIndexOf('/'));
      taskHref = `${baseUrl}/${taskItem.workorderid}`;
    }

    if (!taskHref) {
      log.e(TAG, 'showTaskAttachmentPage: unable to build task href');
      return;
    }

    this.app.state.woStatus = taskItem.status_maxvalue;
    this.app.setCurrentPage({
      name: 'attachments',
      params: { itemhref: taskHref },
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


  // --- Migrated from TaskController for q439v inline task list ---

  /**
   * Loads the task list datasource (woPlanTaskDetailds).
   * Extracted so it can be started early in pageResumed and run in parallel
   * with other non-dependent datasource loads.
   */
  async _loadTaskList(app, page) {
    try {
      const woPlanTaskDetailds = app.findDatasource('woPlanTaskDetailds');
      if (!woPlanTaskDetailds) return;

      // Hide the task list while we reset + reload to prevent "no results" flash
      page.state.taskLoading = true;

      CommonUtil._resetDataSource(woPlanTaskDetailds);

      // On mobile, apply QBE filter to only show INPRG and COMP tasks
      if (Device.get().isMaximoMobile) {
        let externalStatusList = await SynonymUtil.getExternalStatusList(app, ['INPRG', 'COMP']);
        await woPlanTaskDetailds.initializeQbe();
        woPlanTaskDetailds.setQBE('status', 'in', externalStatusList);
        await woPlanTaskDetailds.searchQBE(undefined, true);
      } else {
        await woPlanTaskDetailds.load({ noCache: true });
      }

      page.state.taskLoading = false;
    } catch (e) {
      log.e(TAG, '_loadTaskList error:', e);
      page.state.taskLoading = false;
    }
  }
  async onTaskItemClick(event) {
    // Maximo data-list passes the clicked datasource item directly as the event
    const taskid = event?.taskid ?? event?.item?.taskid;
    const workorderid = event?.workorderid ?? event?.item?.workorderid;
    if (!taskid || workorderid === undefined || workorderid === null) return;

    // Toggle: if already open collapse it, otherwise open this item
    if (`${this.page.state.itemToOpen}` === `${workorderid}`) {
      this.page.state.itemToOpen = '';
      this.page.state.openTaskId = null;
    } else {
      // --- IGT Geofencing check ---
      const parentWo = this.page.findDatasource('woDetailResource')?.item;
      if (parentWo) {
        const allowed = await this._checkGeofence(parentWo);
        if (!allowed) return;
      }
      // --- End geofencing ---

      // ★ Load alnDomainDS with the correct domain values BEFORE expanding
      // the task row, so the dropdown never renders with stale data.
      const taskItem = event?.item || event;
      if (taskItem && taskItem.workorderspec && taskItem.workorderspec.length > 0) {
        await this._loadAlnDomainForTask(taskItem);
      }

      // Only NOW expand the row — dropdown will render with correct data
      this.page.state.itemToOpen = workorderid;
      this.page.state.openTaskId = taskid;
    }
  }

  /**
   * Loads alnDomainDS with the correct domain values for the given task's
   * workorderspec items. All specs within a task share the same domain.
   * Resolves domainid from assetAttributeDS if not already on the spec.
   * @param {Object} taskItem - the clicked task item
   */
  async _loadAlnDomainForTask(taskItem) {
    try {
      const specs = taskItem.workorderspec || [];
      if (!specs.length) return;

      // Find the first spec that has or could have an ALN domain
      const firstAlnSpec = specs.find(
        s => s.domainid || s.datatype_maxvalue === 'ALN' || s.alnvalue !== undefined
      );
      if (!firstAlnSpec) return;

      // Resolve domainid — prefer what's already on the spec
      let domainId = firstAlnSpec.domainid;
      if (!domainId) {
        const assetAttrDS = this.app.findDatasource('assetAttributeDS');
        if (assetAttrDS) {
          await assetAttrDS.initializeQbe();
          assetAttrDS.setQBE('assetattrid', '=', firstAlnSpec.assetattrid);
          const results = await assetAttrDS.searchQBE();
          if (results && results.length > 0) {
            domainId = results[0].domainid;
            // Stamp domainid on ALL specs so future opens are instant
            specs.forEach(s => { if (!s.domainid) s.domainid = domainId; });
          }
        }
      }

      if (!domainId) return;

      const alnDS = this.app.findDatasource('alnDomainDS');
      if (alnDS) {
        await alnDS.clearState();
        await alnDS.initializeQbe();
        alnDS.setQBE('domainid', '=', domainId);
        await alnDS.searchQBE();
      }
    } catch (e) {
      log.e(TAG, 'Error loading alnDomainDS for task', e);
    }
  }

  async redirectToAssetDetails(item) {
    this.page.state.loadAssetData = true;
    try {
      this.page.state.loadAssetData = false;
      //istanbul ignore if
      if (item?.item?.href) {
        const context = {
          page: 'assetDetails',
          assetnum: item.item?.assetnum,
          siteid: this.page.state.currentAssetSite,
          href: item.item?.href,
        };
        this.app.callController('loadApp', {
          appName: this.app.state.appnames.assetmobile,
          context,
        });
      }
    } catch {
    } finally {
      this.page.state.loadAssetData = false;
    }
  }

  openTaskLongDesc(item) {
    if (item) {
      this.page.state.taskLongDesc = item.description_longdescription;
      this.page.showDialog('planTaskLongDesc');
      this.page.state.dialogOpend = true;
    }
  }

  openMeasurementDrawer(event) {
    if (event.item) {
      const woPlanTaskDetailDS = this.app.findDatasource("woPlanTaskDetaildsSelected");
      woPlanTaskDetailDS?.clearWarnings(woPlanTaskDetailDS.item, "measuredate");
      this.page.state.assetMeterHeader = `${event?.item?.measurepoint?.assetnum || ""} ${event.item?.measurepoint?.asset?.description || ""}`;
      this.page.state.measurementSaveDisabled = true;
      event.datasource.items[0]._selected = event.item.workorderid;
      this.page.showDialog("taskMeasurementDialog", { parent: this.page }, event.item);
    }
  }

  async saveTaskSpecification(event) {
    try {
      const taskDS = this.app.findDatasource('woPlanTaskDetailds');
      const parentTask = event?.item;

      if (!taskDS || !parentTask) {
        log.e(TAG, 'Cannot save: missing datasource or parent task reference');
        return;
      }

      const specs = parentTask.workorderspec || [];

      if (specs.length > 0) {
        // Stamp igtentered/igtenteredby on every spec with a filled value
        const nowISO = this.app.dataFormatter.convertDatetoISO(new Date());
        const personId = this.app?.client?.userInfo?.personid || this.app?.userInfo?.personid;

        // Update the workorderspec on the parent task item directly,
        // mirroring the pattern used in WorkOrderDetailsController.saveSpecification()
        parentTask.workorderspec = specs.map(spec => ({
          ...spec,
          igtentered: (spec.alnvalue && spec.alnvalue.trim() !== '') ? nowISO : spec.igtentered,
          igtenteredby: (spec.alnvalue && spec.alnvalue.trim() !== '') ? personId : spec.igtenteredby
        }));

        let interactive = { interactive: !Device.get().isMaximoMobile };
        interactive.localPayload = {
          ...parentTask,
          workorderspec: parentTask.workorderspec
        };

        await taskDS.save(interactive);

        // Check if all specs are filled — if so change task status to INSPCOMP
        const allFilled = specs.every(s => s.alnvalue && s.alnvalue.trim() !== '');

        if (allFilled) {
          try {
            // Look up the INSPCOMP synonym by external value
            const synonymDS = this.app.findDatasource('synonymdomainData');
            await synonymDS.initializeQbe();
            synonymDS.setQBE('domainid', '=', 'WOSTATUS');
            synonymDS.setQBE('value', '=', 'INSPCOMP');
            const synonymResults = await synonymDS.searchQBE();
            const inspcompStatus = synonymResults?.[0];

            if (inspcompStatus) {
              // Directly invoke changeStatus on the task datasource
              const statusAction = {
                parameters: {
                  status: inspcompStatus.value,
                  date: this.app.dataFormatter.currentUserDateTime()
                },
                record: { href: parentTask.localref },
                responseProperties: 'status,status_maxvalue,workorderid',
                localPayload: {
                  woactivity: [{
                    href: parentTask.href,
                    status: inspcompStatus.value,
                    date: this.app.dataFormatter.currentUserDateTime(),
                    status_maxvalue: inspcompStatus.maxvalue,
                    status_description: inspcompStatus.description || inspcompStatus.value,
                    workorderid: parentTask.workorderid
                  }],
                  href: taskDS.dependsOn.currentItem.href
                },
              };

              await taskDS.invokeAction('changeStatus', statusAction);

              // Update the task item locally
              parentTask.status = inspcompStatus.value;
              parentTask.status_maxvalue = inspcompStatus.maxvalue;
              parentTask.status_description = inspcompStatus.description || inspcompStatus.value;

              log.t(TAG, 'Task status changed to INSPCOMP');
            } else {
              log.e(TAG, 'INSPCOMP synonym not found in WOSTATUS domain');
            }
          } catch (statusError) {
            log.e(TAG, 'Could not change status to INSPCOMP', statusError);
          }
        }

        // Reload and recompute spec progress
        await taskDS.forceReload();
        const dataController = taskDS.dataController;
        if (dataController && taskDS.items) {
          taskDS.items.forEach(task => {
            task.computedSpecProgress = dataController.computedSpecProgress(task);
            task.computedAllSpecsFilled = dataController.computedAllSpecsFilled(task);
          });
        }
      }

      log.t(TAG, 'Task specifications saved successfully');
    }
    catch (error) {
      log.e(TAG, 'Error saving task specifications', error);
      this.app.toast('Failed to save specifications', 'error');
    }
  }

  async openTaskSpecLookup(event) {
    const specItem = event?.item;
    if (!specItem) return;

    this.page.state.taskSpecLookupLoader = true;
    // Store current spec item so chooseTaskSpecDomain can update it
    this.currentTaskSpecField = specItem;

    try {
      // Use domainid already on the spec item (enriched from schema) if available,
      // otherwise fall back to looking it up from assetAttributeDS
      let domainId = specItem.domainid || null;

      if (!domainId) {
        const assetAttrDS = this.app.findDatasource('assetAttributeDS');
        if (assetAttrDS) {
          await assetAttrDS.initializeQbe();
          assetAttrDS.setQBE('assetattrid', '=', specItem.assetattrid);
          const results = await assetAttrDS.searchQBE();
          if (results && results.length > 0) {
            domainId = results[0].domainid;
          }
        }
      }

      if (!domainId) {
        this.app.toast('No domain found for this attribute', 'warning');
        this.page.state.taskSpecLookupLoader = false;
        return;
      }

      // Filter alnDomainDS by the domainid
      const alnDS = this.app.findDatasource('alnDomainDS');
      if (alnDS) {
        await alnDS.clearState();
        await alnDS.initializeQbe();
        alnDS.setQBE('domainid', '=', domainId);
        await alnDS.searchQBE();
      }

      this.page.state.taskSpecLookupLoader = false;
      this.page.showDialog('woDetailTaskSpecAlnLookup');
    } catch (error) {
      log.e(TAG, 'Error opening task spec lookup', error);
      this.page.state.taskSpecLookupLoader = false;
    }
  }

  chooseTaskSpecDomain(itemSelected) {
    if (this.currentTaskSpecField && itemSelected) {
      this.currentTaskSpecField.alnvalue = itemSelected.value;
      this.currentTaskSpecField.igtentered = this.app.dataFormatter.convertDatetoISO(new Date());
      this.currentTaskSpecField.igtenteredby = this.app?.client?.userInfo?.personid || this.app?.userInfo?.personid;
      log.t(TAG, `Task spec domain selected: ${itemSelected.value} for ${this.currentTaskSpecField.assetattrid}`);
    }
  }

  /**
   * Called when the inline task spec dropdown value changes.
   * Stamps igtentered and igtenteredby on the spec item — same metadata
   * that chooseTaskSpecDomain sets for the lookup flow.
   * @param {Object} event - { selectedItem, spec }
   */
  onTaskSpecDropdownChange(event) {
    const specItem = event?.spec;
    if (specItem && event?.selectedItem) {
      specItem.igtentered = this.app.dataFormatter.convertDatetoISO(new Date());
      specItem.igtenteredby = this.app?.client?.userInfo?.personid || this.app?.userInfo?.personid;
    }
  }


  async _checkGeofence(item) {
    // ═══════════════════════════════════════════════════════════════
    // STEP 1 — GLOBAL SYSTEM PROPERTY CHECK (igtmobile.geofencing)
    // If false/missing → geofence is OFF globally, skip everything.
    // ═══════════════════════════════════════════════════════════════
    const rawGlobalProp = this.app?.state?.systemProp?.['igtmobile.geofencing'];
    log.t(TAG, `Geofence: raw system prop igtmobile.geofencing = "${rawGlobalProp}" (type: ${typeof rawGlobalProp})`);

    const isGlobalEnabled = this._isTruthy(rawGlobalProp);
    if (!isGlobalEnabled) {
      log.t(TAG, 'Geofence: GLOBAL property is false/missing — geofence OFF. Allowing access.');
      return true;
    }
    log.t(TAG, 'Geofence: GLOBAL property is true — checking WO-level geocode…');

    // ═══════════════════════════════════════════════════════════════
    // STEP 2 — WO SERVICE ADDRESS GEOCODE CHECK
    // ═══════════════════════════════════════════════════════════════
    let geocodeValue = undefined;

    // 2a. From the parent WO item's service address
    const woSA = item?.serviceaddress;
    if (woSA) {
      const sa = Array.isArray(woSA) ? woSA[0] : woSA;
      geocodeValue = sa?.geocode;
      log.t(TAG, `Geofence: woDetailResource serviceaddress.geocode = "${geocodeValue}"`);
    }

    // 2b. From woServiceAddress datasource
    if (geocodeValue === undefined || geocodeValue === null) {
      const woSaDs = this.app.findDatasource('woServiceAddress') || this.page?.findDatasource('woServiceAddress');
      let saItem = woSaDs?.item;
      if (Array.isArray(saItem)) saItem = saItem[0];
      if (saItem) {
        geocodeValue = saItem.geocode;
        log.t(TAG, `Geofence: woServiceAddress DS geocode = "${geocodeValue}"`);
      }
    }

    // 2c. From asset service address
    if (geocodeValue === undefined || geocodeValue === null) {
      const woAssetDs = this.app.findDatasource('woAssetLocationds') || this.page?.findDatasource('woAssetLocationds');
      if (woAssetDs?.item?.serviceaddress) {
        const assetSa = Array.isArray(woAssetDs.item.serviceaddress) ? woAssetDs.item.serviceaddress[0] : woAssetDs.item.serviceaddress;
        if (assetSa) {
          geocodeValue = assetSa.geocode;
          log.t(TAG, `Geofence: asset serviceaddress geocode = "${geocodeValue}"`);
        }
      }
    }

    log.t(TAG, `Geofence: resolved geocode = "${geocodeValue}" (type: ${typeof geocodeValue})`);

    const isWOGeofenceEnabled = this._isTruthy(geocodeValue);
    if (!isWOGeofenceEnabled) {
      log.t(TAG, 'Geofence: WO geocode is false/missing — geofence OFF for this WO. Allowing access.');
      return true;
    }
    log.t(TAG, 'Geofence: WO geocode is true — performing distance check…');

    // ═══════════════════════════════════════════════════════════════
    // STEP 3 — GET EQUIPMENT COORDINATES
    // ═══════════════════════════════════════════════════════════════
    const isInvalidCoord = (lat, lon) => {
      const pLat = parseFloat(lat);
      const pLon = parseFloat(lon);
      return isNaN(pLat) || isNaN(pLon) || (pLat === 0 && pLon === 0);
    };

    let lat1, lon1;

    if (woSA) {
      const sa = Array.isArray(woSA) ? woSA[0] : woSA;
      lat1 = sa?.latitudey;
      lon1 = sa?.longitudex;
    }

    if (isInvalidCoord(lat1, lon1)) {
      const woSaDs = this.app.findDatasource('woServiceAddress') || this.page?.findDatasource('woServiceAddress');
      let saItem = woSaDs?.item;
      if (Array.isArray(saItem)) saItem = saItem[0];
      if (saItem) {
        lat1 = saItem.latitudey;
        lon1 = saItem.longitudex;
      }
    }

    if (isInvalidCoord(lat1, lon1)) {
      const woAssetDs = this.app.findDatasource('woAssetLocationds') || this.page?.findDatasource('woAssetLocationds');
      if (woAssetDs?.item?.serviceaddress) {
        const assetSa = Array.isArray(woAssetDs.item.serviceaddress) ? woAssetDs.item.serviceaddress[0] : woAssetDs.item.serviceaddress;
        if (assetSa && !isInvalidCoord(assetSa.latitudey, assetSa.longitudex)) {
          lat1 = assetSa.latitudey;
          lon1 = assetSa.longitudex;
        }
      }
    }

    if (isInvalidCoord(lat1, lon1)) {
      const assetId = item.assetnumber || item.assetnum || '';
      this.page.error(
        this.app.getLocalizedLabel(
          'geofence_no_coords',
          `Equipment ${assetId} latitude and longitude are not defined. Contact System Administrator.`,
          [assetId]
        )
      );
      return false;
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 4 — GET GPS POSITION & CHECK DISTANCE
    // ═══════════════════════════════════════════════════════════════
    try {
      if (this.app.geolocation) {
        let initialLat = this.app.geolocation?.state?.latitude;
        let initialLon = this.app.geolocation?.state?.longitude;
        let alreadyValid = initialLat != null && initialLon != null && (initialLat !== 0 || initialLon !== 0);

        if (!alreadyValid) {
          this.app.geolocation.updateGeolocation({ enableHighAccuracy: true });
        }

        let retries = alreadyValid ? 1 : 8;
        let gpsAcquired = false;
        while (retries > 0 && !gpsAcquired) {
          const tempLat = this.app.geolocation?.state?.latitude;
          const tempLon = this.app.geolocation?.state?.longitude;
          if (tempLat != null && tempLon != null && (tempLat !== 0 || tempLon !== 0)) {
            gpsAcquired = true;
          } else {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          retries--;
        }
      }
    } catch (e) {
      log.t(TAG, 'Geofence: GPS update failed — ' + e);
    }

    const lat2 = this.app.geolocation?.state?.latitude;
    const lon2 = this.app.geolocation?.state?.longitude;

    if (lat2 == null || lon2 == null || (lat2 === 0 && lon2 === 0)) {
      this.page.error(
        this.app.getLocalizedLabel(
          'geofence_no_gps',
          'Unable to acquire GPS position. Please enable location services.'
        )
      );
      return false;
    }

    const distanceMeters = this._haversineDistance(lat1, lon1, lat2, lon2);

    const rawDistProp = this.app?.state?.systemProp?.['igtmobile.towerdistance'];
    const allowedTowerDistance = parseFloat(rawDistProp);

    if (isNaN(allowedTowerDistance)) {
      log.t(TAG, 'Geofence: igtmobile.towerdistance not configured.');
      this.page.error(
        this.app.getLocalizedLabel(
          'geofence_no_distance',
          `Allowed tower distance is not configured correctly in System Properties (Received: "${rawDistProp}"). Contact System Administrator.`
        )
      );
      return false;
    }

    log.t(TAG, `Geofence: distance = ${distanceMeters.toFixed(1)}m, allowed = ${allowedTowerDistance}m`);

    if (distanceMeters > allowedTowerDistance) {
      const eqLatLong = `${lat1},${lon1}`;
      const gpsLatLong = `${lat2},${lon2}`;
      this.page.error(
        this.app.getLocalizedLabel(
          'geofence_too_far',
          `Distance between Equipment location ${eqLatLong} and current GPS location ${gpsLatLong} is more than ${allowedTowerDistance} Meters.`,
          [eqLatLong, gpsLatLong, allowedTowerDistance]
        )
      );
      return false;
    }

    return true;
  }

  /**
   * Converts various truthy/falsy representations to boolean.
   * Returns true for: true, 1, "true", "1", "y", "yes"
   * Returns false for everything else including undefined/null/empty.
   */
  _isTruthy(val) {
    if (val === undefined || val === null) return false;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val !== 0;
    if (typeof val === 'string') {
      return ['true', '1', 'y', 'yes'].includes(val.trim().toLowerCase());
    }
    return !!val;
  }

  /**
   * Haversine formula — returns the great-circle distance in **meters**
   * between two lat/lon points.
   */
  _haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // convert km → meters
  }

}
export default WorkOrderDetailsController;
