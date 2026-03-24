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

/* eslint-disable no-console */
import {log, Device, AppSwitcher, MASAPI} from '@maximo/maximo-js-api';
import MaximoMapConfigurationLoader from "@maximo/map-component/build/ejs/framework/loaders/MaximoMapConfigurationLoader";
import MapConfigurationLoader from "@maximo/map-component/build/ejs/framework/loaders/MapConfigurationLoader";
import StorageManager from "@maximo/map-component/build/ejs/framework/storage/StorageManager";
import LocalStorageManager from "@maximo/map-component/build/ejs/framework/storage/LocalStorageManager";
import FileSystemStorageManager from "@maximo/map-component/build/ejs/framework/storage/FileSystemStorageManager";
import MapPreLoadAPI from '@maximo/map-component/build/ejs/framework/loaders/MapPreLoadAPI';
import {Browser} from '@maximo/maximo-js-api';
import SynonymUtil from "./utils/SynonymUtil";
import {DisconnectedSchemaFactory as DisconnectedFactory} from '@maximo/maximo-js-api';
import commonUtil from "./utils/CommonUtil";
import WOTimerUtil from "./utils/WOTimerUtil";
import appResolver from './utils/AppResolver';
import WOUtil from './utils/WOUtil';
const TAG = 'TechnicianApp';

const isHumaiDebugMode=localStorage.getItem("humai_debug")==="true"

class AppController {
  applicationInitialized(app) {
    this.app = app;
    // Check if login user has permission to access Assist
    if (sessionStorage.getItem('isEamApp') === 'false'||isHumaiDebugMode) {   
      this.checkAssistPermission();
    }
    //istanbul ignore else
    if (Device.get().isMaximoMobile) {
      try {
        DisconnectedFactory.get().createIndex('MXAPIFAILURELIST', ['failurelist']); 
        DisconnectedFactory.get().createIndex('MXAPIFAILURELIST', ['parent', 'type']);
        DisconnectedFactory.get().createIndex('MXAPITKCLASS', ['usewithworkorder', 'parent']); 
        DisconnectedFactory.get().createIndex('MXAPITKCLASS', ['classstructureid']);
      } catch (e) {
        //Do nothing
        //istanbul ignore next
        log.e(TAG, 'Error creating indexes ', e);
      }
    }
    // Update the Default Map Configuration Loader
    MapConfigurationLoader.setImplementation(MaximoMapConfigurationLoader);
    if (Device.get().isMaximoMobile) {
			//Update the Default Storage Manager
			StorageManager.setImplementation(FileSystemStorageManager);
		} else {
			//Update the Default Storage Manager
			StorageManager.setImplementation(LocalStorageManager);
    }
    //istanbul ignore next
    try {
      this.mapPreloadAPI = new MapPreLoadAPI();
      //istanbul ignore next
      this.mapPreloadAPI.validateMapConfiguration(this.app)
      .then((validMapConfiguration) => {
        this.app.state.isMapValid = validMapConfiguration;
      })
      .catch( error => {
        this.app.state.isMapValid = false
        log.t(TAG, 'validateMapConfiguration: ', error);
      });
      this.app.state.mapConfigurationLoaded = true;
    } catch(error) {
      log.t(TAG, error);
    }
       
    this.setupIncomingContext();    
    // Going back to wolist page from wodetail page
    this.app.on('page-changed', (nextPage, prevPage) => {
      if (prevPage.name === 'workOrderDetails' && nextPage.name === 'schedule' && nextPage.state.previousPage === 'schedulecardlist' && nextPage.state.mapOriginPage === 'wodetail') {
        nextPage.callController("openPrevPage");
      }

      //Going Back to Follow Up WO from the Save Discard Dailog
      //istanbul ignore if
      if (prevPage.name === 'relatedWorkOrder' && nextPage.name === 'schedule' && nextPage.resumed === true) {
        if(nextPage.state.previousPage === ""){
          nextPage.resumed = false;
          nextPage.state.previousPage = 'workOrderDetails';
          this.app.setCurrentPage({name: 'relatedWorkOrder', resetScroll: true, params: {itemhref: prevPage.params.itemhref}});
        }else{
          nextPage.state.previousPage = '';
        }
      }

       // Going back to woEditDetailsPage from schedule page on Discard
       if (prevPage.name === 'woedit' && nextPage.name === 'schedule') {
        this.app.setCurrentPage({
          name: "workOrderDetails",
          resetScroll: true,
          params: {
            wonum: prevPage.params.workorder.wonum,
            href: prevPage.params.workorder.href,
            siteid: prevPage.params.workorder.siteid
          }
        });
    }

      //istanbul ignore if
      if (prevPage.name === 'report_work' && nextPage.name === 'reserveMaterials' && prevPage.state.openedFrom !== 'reportwork') {
        this.app.setCurrentPage({name: 'workOrderDetails'});
        this.app.state.openedFrom = 'reportwork';
      }
    });
    // Open schedule page from navigator and set default state
    this.app.on('page-changing', (nextPage, prevPage) => {
      if (prevPage.name === 'schedule' && nextPage.name === 'schedule') {
        nextPage.callController('setDefaults');
      }
      if(prevPage.name === 'workOrderDetails') {
        prevPage.state.assetToOpen = '';
      }
    });
    
    // remove lengthy objects from state before moving to other app and serialization
    this.app.on("on-app-serialize", (app) => {
      //istanbul ignore if
      if (app.app.currentPage.name === 'tasks') {
        Reflect.deleteProperty(app.app.currentPage.state, 'workorder');
      }
      let schedulePage = app.app.findPage('schedule');
      //istanbul ignore if
      if (schedulePage) {
        Reflect.deleteProperty(schedulePage.state, 'woItems');
      }
    });

    if(isHumaiDebugMode){
      const switcher = AppSwitcher.get();
      switcher.registerApplication(
          'humai',
          'humai',
          'http://localhost:3000/#/'
      );
    }
    if (!this.app.device.isMaximoMobile) {
      commonUtil.getOfflineStatusList(app, app.client.userInfo.insertOrg, app.client.userInfo.insertSite);
    }

    // Set application reference to be used globally
    appResolver.setApplication(app);
  }

  onContextReceived() {
    this.setupIncomingContext()
  }

  navigationItemClicked(item) {
    log.t(TAG, 'Clicked item', item);
    this.app.setCurrentPage({name: 'schedule'});
  }

  openMaterialsPage() {
    this.app.state.hideMattoolPrompt = true;
    this.app.setCurrentPage({name: 'materials'});
  }

  /**
   * Get external value on the basis of internal value.
   */
  _getStatusExternalValue(statusArr, internalValue) {
    let externalValue;
    // istanbul ignore else
    if (statusArr?.length && internalValue) {
      for(let status of statusArr){
        // istanbul ignore else
        if (status.defaults && status.maxvalue === internalValue) {
          externalValue = status.value;
          break;
        }
      }
    }
    return externalValue;
  }

  /**
   * Build workorder staus list from allowed state.
   */
  _buildWoStatusSet(allowedStates) {
    let statusArr = [];
    if (allowedStates) {
      Object.entries(allowedStates).forEach(([key, value]) => {
        // istanbul ignore else
        if (value) {
          value.forEach((statValue) => {
            statusArr.push({
              id: statValue.value,
              value: statValue.value,
              description: statValue.description,
              defaults: statValue.defaults,
              maxvalue: statValue.maxvalue,
              _bulkid: statValue.value
            });
          });
        }
      });
    }
    return statusArr;
  }

  /**
    * @description update page title dynamically get value of worktype and wonum from url parameter
    * @param  {parameters} parameters parameters object contains object of page, label and labelValue
    */
  updatePageTitle (parameters) {
    const wonum = parameters.page.params.wonum || "";
    let pageTitle = '';
        
    const type = typeof(parameters.page.params.istask);
    if(type === 'string'){
      parameters.page.params.istask = false;
    }
    
    if (parameters.page.params.istask && parameters.page.params.wogroup) {
      pageTitle = this.app.getLocalizedLabel(
        'wotask_' + parameters.label,
        `${parameters.page.params.wogroup}-${parameters.page.params.taskid} ${parameters.labelValue}`,
        [parameters.page.params.wogroup, parameters.page.params.taskid]
      );
    } else {
      pageTitle = this.app.getLocalizedLabel(
        parameters.label,
        `${wonum} ${parameters.labelValue}`,
        [wonum]
      );
    }
    return pageTitle;    
  }

    /**
   * Sets incoming context to navigate to workorder details page as per provided params
   */
  setupIncomingContext() {
    const incomingContext = this.app?.state?.incomingContext;
    //istanbul ignore if
    if (incomingContext?.editTrans) {
      incomingContext.page  = 'workOrderDetails';
    }

    if (incomingContext?.page && ((incomingContext?.wonum && incomingContext?.siteid) || (incomingContext?.href && !incomingContext?.itemId))) {
      this.app.setCurrentPage({name:"schedule"});
      this.app.setCurrentPage({
        name: incomingContext.page,
        resetScroll: true,
        params: {wonum: incomingContext.wonum, siteid: incomingContext.siteid, href: incomingContext.href}
      });
    } else if(incomingContext?.page && incomingContext?.href && incomingContext?.itemId) {
      this.app.setCurrentPage({
        name: incomingContext.page,
        resetScroll: true,
        params: { href: incomingContext.href,itemhref: incomingContext.href }
      });
    }
  }

  /**
   * Open iOS / Android Map
   * @param {option} option
   */
  async openNavigation(option) {
    log.t(TAG, "opening map");
    let device = Device.get();
    let platform = device?.platform.toLowerCase();   
    let url = "";
    let navigationIos =  this.app.state.systemProp?.["mxe.mobile.navigation.ios"];
    let navigationWindow = this.app.state.systemProp?.["mxe.mobile.navigation.windows"];
    let navigationAndroid = this.app.state.systemProp?.["mxe.mobile.navigation.android"];    
    
    navigationIos = navigationIos?.toLowerCase();
    navigationWindow = navigationWindow?.toLowerCase();
    navigationAndroid = navigationAndroid?.toLowerCase();

    if (platform === device.Constants.IOS.toLowerCase()) {
        url = this.getMapURLforDevice(navigationIos,option);
    } else if (platform === device.Constants.ANDROID.toLowerCase()) {        
        url =  this.getMapURLforDevice(navigationAndroid,option);     
    } else if ((platform ===  device.Constants.WINDOWS.toLowerCase()) || (platform ===  device.Constants.WINUI3.toLowerCase())) {
        url = this.getMapURLforDevice(navigationWindow,option);     
    }

    if (url !== "") {
      // istanbul ignore next
      if (!Device.get().isMaximoMobile) {
        Browser.get().openURL(url, "_system");
      } else {
        try {
          window.cordova.InAppBrowser.open(url, "_system", 'location=yes');
        } catch (error) {
          Browser.get().openURL(url, "_system");
        }
      }
    }
  }

  /**
   * Get description on the basis of internal value.
   */
  _getStatusDescription(statusArr, internalValue) {
    let description;
    // istanbul ignore else
    if (statusArr?.length && internalValue) {
    for (const status of statusArr) {
      if (status.defaults && status.maxvalue === internalValue) {
        description = status.description;
        break;
      }
    }
  }
    return description;
  }

  checkWorkspacesForAssist(workspaces) {
    let result = { assistUrl: null, isAccessible: false };
    for (let workspaceId in workspaces) {
      const { applications } = workspaces[workspaceId];
      if (applications?.['assist']) {
        const { href, role } = applications['assist'];
        result.assistUrl = href;
        if (role && role.length > 0 && role !== 'NO_ACCESS') {
          result.isAccessible = true;
          return result;
        }
      }
    }
    return result;
  }

  registerAssistUrl(assistUrl) {
    if (assistUrl) {
      if (!assistUrl.endsWith('/')) {
        assistUrl = assistUrl + '/';
      }
      let switcher = AppSwitcher.get();
      switcher.registerApplication(
        'assist',
        'Assist',
        `${assistUrl}technician`
      );
    }
  }
  
  /**
   * Check whether the login MAS user has permission to access Assist
   * @returns true or false, assist is accessible for the login user
   */
  async checkAssistPermission() {
    let assistUrl = null;
    let isAccessible = false;
    const masUserProfile = await MASAPI.get().getUserProfile();
    // istanbul ignore next - can not test mas profile api call
    if (masUserProfile?.user) {
      const { workspaces } = masUserProfile.user;
      ({ assistUrl, isAccessible } = this.checkWorkspacesForAssist(workspaces));
    }
    this.app.state.isAssistAccessible = isAccessible;
    // istanbul ignore next - can not test mas profile api call
    if (isAccessible && !Device.get().isMaximoMobile) {
      // register assist url if not running in maximo mobile container
      this.registerAssistUrl(assistUrl);
    }
  }


  /* It is used to call TaskController completeWoTask function
   * @param {*} item 
   */
  completeTheTask(item){
    this.app.findPage("tasks").callController('completeWoTask', item);
  }

  /**
   * Call gotoAssistAppFromTask function with arguments
   * @param {*} event
   */
  gotoAssistAppFromTask(event) {
    const taskFields = [
      "description",
      "status",
      "status_description",
      "inspname"
    ];
    const item = event.item || {};
    //istanbul ignore else
    if (this.app) {
      let woDetailDS = this.app.findDatasource("woDetailds");
      let woItem = {};
      //istanbul ignore else
      if (woDetailDS && woDetailDS.items.length > 0) {
        woItem = { ...woDetailDS.item };
      }
      // set task field and value
      woItem["taskid"] = item.taskid;

      for (const key of taskFields) {
        if (item[key] != null) {
          woItem["task_" + key] = item[key];
        }
      }
      if (item.inspectionbatchresult && item.inspectionbatchresult.length > 0) {
        woItem["task_inspresult"] = item.inspectionbatchresult[0].inspresult;
      }
      //istanbul ignore else
      if (woItem.failure?.description) {
        // flatten failure.description as failuredesc
        woItem["failuredesc"] = woItem.failure.description;
      }
      let woDetailsPage = this.app.findPage("workOrderDetails");
      const woFields = [
        "wonum",
        "title",
        "workorderid",
        "assetnum",
        "assetdesc",
        "assettype",
        "company",
        "failurecode",
        "failuredesc",
        "problemcode",
        "status",
        "status_description",
        "owner",
        "siteid",
        "href",
        "reportdate",
        "schedstart",
        "actstart",
        "targstartdate",
        "classificationid",
        "jpnum",
        "jpdesc",
        "taskid",
        "task_description",
        "task_status",
        "task_status_description",
        "task_inspname",
        "task_inspresult",
        "locationnum",
        "locationdesc"
      ];
      if (woDetailsPage && woDetailsPage.controllers.length > 0) {
        const { description, locationnum, failure, taskid } = woItem;
        let value = { wodesc: description };
        for (const key of woFields) {
          if (woItem[key] != null) {
            value[key] = woItem[key];
          }
        }
                
        if (locationnum) {
          value.location = woItem.locationnum;
        }
        // istanbul ignore next
        if (failure?.description) {
          if (value.failuredesc == null) {
            value.failuredesc = failure.description;
          }
        }
        let type = taskid ? "mxwotask" : "mxwo";
        // maximo wo context passed to assist app
        let context = { type, value };
        this.loadApp({
          appName: this.app.state.appnames.assist,
          context
        });
      } else {
        const { locationnum, description } = woItem;
        let value = { wodesc: description };
        // exclude unnecessary fields of wo item from context
        for (const key of woFields) {
          if (woItem[key] != null) {
            value[key] = woItem[key];
          }
        }
        //istanbul ignore else
        if (locationnum) {
          value["location"] = woItem.locationnum;
        }
        let context = {
          type: "mxwotask",
          value
        };
        this.loadApp({ appName: this.app.state.appnames.assist, context });
      }
    }
  }

  /* It is used to call TaskController openTaskLongDesc function
   * @param {*} item 
   */
  openTaskLongDesc(item){
    this.app.findPage("tasks").callController('openTaskLongDesc', item);
  }

  /**
   * Redirects to different application as per provided arguments.
   * @param {*} args 
   */
  loadApp(args = {}) {
    let appName = args.appName ? args.appName : undefined;
    let breadcrumbData = {returnName: `Returning to ${this.app.name}`, enableReturnBreadcrumb: true};
    if (!appName) {
      log.e(TAG,'loadApp : appName required for navigation.', args);
      return;
    }
    let options = args.options ? args.options : {canReturn: true};
    let context = args.context ? args.context : {};
    let switcher = AppSwitcher.get();
    context.breadcrumb = breadcrumbData;
    switcher.gotoApplication(appName, context, options);
  }

  /**
   * Check whether need to show prompt down message or not
   * @returns true or false
   */
  checkDownPrompt(evt) {
    if(evt.workorder.downprompt === '1') {
      let errorMessage = 'The asset currently has a status of Down. To change the status of the asset now, you must cancel the current status change and report downtime.';
      evt.page.error(
        this.app.getLocalizedLabel("assetPromptDownMessage", errorMessage)
      );
      return true;
    } else {
      return false;
    }
  }

  /**
   * Get URL on the basis of navigation property value.
   */
  getMapURLforDevice(navigationprop,option){
    let url = "";

    if (navigationprop === "applemaps") {
        url = Browser.get().appendUrl("https://maps.apple.com/", "saddr",  option.geolocationlat +"," +option.geolocationlong);
        url = Browser.get().appendUrl(url, "daddr",  option.serlat + "," + option.serlong);      
    }
    if (navigationprop === "waze") {
        url = Browser.get().appendUrl("https://waze.com/ul?navigate=yes", "ll",  option.serlat + "," + option.serlong);      
    }
    if (navigationprop === "googlemaps") {    
        url = Browser.get().appendUrl("https://www.google.com/maps/dir/?api=1","destination",option.serlat + "," + option.serlong);      
    }    
    return url;

  }
  /**
   * function return woactivity from workorder.
   * @param {page} is page object.
   * @param {app} is application object.
   * @param {woItem} is workorder item object.
   */
  async getWoActivity(page, app, woItem) {
    let taskList = [...woItem.woactivity];
    let woTaskList = [];
    let taskItems = [];
    let workTypeDs = app.findDatasource("dsworktype");
    const woInprgStatus = await SynonymUtil.getSynonym(this.app.findDatasource('synonymdomainData'), 'WOSTATUS', 'WOSTATUS|INPRG');
    let workType = [];

    /* istanbul ignore else */
    if(woItem.worktype) {
      workType = workTypeDs.items.filter(
        (item) => item.worktype === woItem.worktype
      );
    }
    taskList.forEach(async (item) => {
      let status = page.state.selectedStatus;
      let maxValue = page.state.selectedStatusMaxValue;
      let statusDescription = page.state.selectedStatusDescription;
      /* istanbul ignore else */
      if (['COMP', 'CLOSE', 'CAN'].includes(item.status_maxvalue) || !item.parentchgsstatus ) {
        status = item.status;
        maxValue = item.status_maxvalue;
        statusDescription = item.status_description;
      }
      //istanbul ignore if
      if(woItem.flowcontrolled) {
        if(item.taskid && !item.predessorwos && (item.status_maxvalue !== 'COMP' &&
        item.status_maxvalue !== 'CLOSE' &&
        item.status_maxvalue !== 'CAN' && item.status_maxvalue !== 'INPRG')) {
          if(!workType.length || (workType.length && !workType[0].startstatus_maxvalue) ) {
            status = woInprgStatus.value;
            maxValue = woInprgStatus.maxvalue;
            statusDescription = woInprgStatus.description;
          } else if(workType && workType?.length && workType[0].startstatus && workType[0].startstatus_maxvalue === 'INPRG') {
            status = workType[0].startstatus;
            maxValue = workType[0].startstatus_maxvalue;
            statusDescription = workType[0].startstatus_description;
          } else {
            status = item.status;
            maxValue = item.status_maxvalue;
            statusDescription = item.status_description;
          }
        } else {
            status = item.status;
            maxValue = item.status_maxvalue;
            statusDescription = item.status_description;
          }
        }
        taskItems.push({
          ...item,
          status: status,
          status_maxvalue: maxValue,
          status_description: statusDescription,
        });
      });
    woTaskList = taskItems;
    return woTaskList;
  }

  /**
   * function return true/false whether all predessor task is complete or not.
   * @param {tasklist} is an array of tasks.
   * @param {item} is single task item.
   */
  validatePredessor(tasklist, item) {
    let tasks = [];
    if( item.status_maxvalue !== 'COMP' && item.predessorwos) {
      let taskids;
      if(item.predessorwos.includes('(')){
        taskids = this.getPredssorWoTask(item);
      }else{
        taskids = item.predessorwos.split(',');
      }
      tasks = tasklist.filter(item => item.taskid && taskids.includes(item.taskid.toString()) && item.status_maxvalue !== 'COMP');
    } else {
      return false;
    }
    
    return !tasks.length;
  }

  /**
   * function return an array task ids.
   * @param {item} is single task item.
   */
  getPredssorWoTask(item) {
    // NOSONAR
    const regex = /\d+(?=\))/g;
    const str = item.predessorwos;
    const matches = str.match(regex);
    return matches || [];
  }
  

  /**
  * Function to close the asset scan dialog
  */
  closeMismatchAssetScan() {
    // istanbul ignore else
    if (this.app) {
      this.app.findDialog('appAssetMisMatchDialog')?.closeDialog();
    }
  }

  /**
  * Function to resume previous method call
  */
  async scanActions() {
    const params = this.app.state.scanParameter;
    switch(params.method) {
      case "startStopTimer":
        WOTimerUtil[params.method](params.app, params.page, params.event, params.detailDS, params.laborDS, params.transtype, params.transtypeDescription);
        break;
      case "changeStatus":
        params.page.findDialog("woStatusChangeDialog").callController(params.method, {});
        break;
      case "completeWorkorder":
        params.page.callController(params.method, params.evt);
        break;
      case "completeWoTask":
        params.page.callController(params.method, params.record);
        break;
    }
    this.app.state.scanParameter = {};
  }

  /**
  * Function to catch events on changing route
  */
  pagePaused() {
    this.closeAssetScan();
    this.closeMismatchAssetScan();
  }

  onAssetScan(event) {
    const scanResParam = this.app.state.scanParameter?.scanResParam;
    if (event.value && (event.value === scanResParam.assetnum || event.value === scanResParam.locationnum)) {
      this.app.state.skipScan = false;
      this.app.state.disableScan = true;
      this.scanActions();
      this.closeAssetScan();
      this.closeMismatchAssetScan();
    } else if (event.value) {
      this.app.state.scanParameter.scanResParam.scanValue = event;
      this.app.showDialog("appAssetMisMatchDialog")
    }
  }

  closeAssetScan() {
    // istanbul ignore else
    if (this.app) {
      this.app.findDialog('appAssetScanDialog')?.closeDialog();
      WOTimerUtil.resetSharedConfirmationVariable(this.app);
    }
  }

  /**
  * Function to continue without scan
  */
  skipAssetScan() {
    this.app.state.skipScan = true;
    this.app.state.disableScan = true;
    this.scanActions();
    this.closeAssetScan();
  }

  /**
   * Navigate to ACM
   * @param {object} event - Event object
   */
  async navigateToAcm(event) {
    const assetItemData = event.item;
    const breadcrumbData = {returnName: `Returning to ${this.app.name}`, enableReturnBreadcrumb: true};

    //istanbul ignore else
    if (assetItemData?.href) {
      const context = {
        page: 'assetSwitch',
        assetnum: assetItemData.assetnum,
        plusaparentassetnum: assetItemData.plusaparentassetnum,
        href: assetItemData.href,
        wonum: assetItemData.wonum,
        breadcrumb: breadcrumbData
      };
      const options = {canReturn: true, openWindow: false};
      AppSwitcher.get().gotoApplication(this.app.state.appnames.assetswitch, context, options);
    } else {
      log.e('Cannot load requested asset');
    }
  }

  /**
   * @description Redirect to calibration page
   * @returns {void}
   */
  async redirectCalibration() {
    this.app?.findDialog('dataSheetWarnings')?.closeDialog();
    const workOrderDetails = await this.app.findPage("workOrderDetails");
    if (workOrderDetails) {
      await this.app.setCurrentPage({
        name: "workOrderDetails",
        params: { 
          href:this.app.state.calibParameter.workorder.href, 
          siteid: this.app.state.calibParameter.workorder.siteid,
          wonum: this.app.state.calibParameter.workorder.wonum
        }
      });
      await workOrderDetails.callController("navigateToCalibration", this.app.state.calibParameter.workorder);
    }
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Confirms the dialog by clicking on the primary button.
   */
  confirmDialogPrimaryClick() {
    this.app.state.confirmDialog.onPrimaryClick(this.app);

  }

  // Assisted by watsonx Code Assistant 
  /**
   * Confirms a dialog with secondary action.
   */
  confirmDialogSecondaryClick() {
    this.app.state.confirmDialog.onSecondaryClick(this.app);
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Confirms the dialog close click.
   * @param {Object} app - The application object.
   */
  confirmDialogCloseClick(app) {
    app.state.confirmDialog.onCloseClick();
  }
  
  /**
 * @description Redirect to Report Page
 * @returns {Promise<void>}
 */
  async redirectToReport() {
    this.app?.findDialog('toolsError')?.closeDialog();
    const workOrderDetails = await this.app.findPage("workOrderDetails");
    if (workOrderDetails) {
      await this.app.setCurrentPage({
        name: "workOrderDetails",
        params: { 
          href:this.app.state.calibParameter.workorder.href, 
          wonum: this.app.state.calibParameter.workorder.wonum
        }
      });
      await workOrderDetails.callController("navigateToReportWork", this.app.state.calibParameter.workorder);
    }
  }

  /**
   * @description Resume action after calibration warnings
   * @returns {void}
   */
  saveWorkOrderStatus() {
    this.app?.findDialog('toolsWarnings')?.closeDialog();
    this.app.state.skipToolWarning = true;
    const calibParams = this.app.state.calibParameter
    switch(calibParams.pageName) {
      case "report_work":
        calibParams.page.callController(calibParams.method, calibParams.params);
        break;
      case "changeStatus":
        this.app.findPage('schedule').findDialog("woStatusChangeDialog").callController(calibParams.method, {});
        break;
    }
    this.app.state.calibParameter = {};
  }

  /**
   * @description Skip reset state of app
   * @returns {void}
   */
  resetSkipState() {
    this.app.state.skipToolWarning = false;
    this.app.state.disableScan = false;
    this.app.state.skipScan = false;
    this.app.state.skipSignature = false;
    this.app.state.scanParameter = {};
    this.app.state.calibParameter = {};
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Opens the meter reading drawer for the current app.
   * @param {object} event - The event object that triggered the function.
   * @returns {void}
   */
  openMeterReadingDrawer(event) {
    WOUtil.openMeterReadingDrawer(this.app, event.item);
  }


  openLocationMapDialog(evt) {
    this.app.state.map.selectedDS = evt.datasource;
    this.app.state.map.selectedDSAttribute = evt.attribute;
    this.app.showDialog('locationMapDialog');
  } 

  openAssetMapDialog(evt) {
    this.app.state.map.selectedDS = evt.datasource;
    this.app.state.map.selectedDSAttribute = evt.attribute;
    this.app.showDialog('assetMapDialog');
  }
  
  async openMultiAssetFollowupPage(event){
    let currentAsset = event.item;
    let woDetailds = this.app.findDatasource('woDetailds');
    this.app.setCurrentPage({name: 'woedit', resetScroll: true, params: { 
        type: 'multiAssetFollowup',
        followup: true,
        href: woDetailds.item.href,
        wonum: woDetailds.item.wonum,
        siteid: woDetailds.item.siteid,
      }
    });
    //istanbul ignore else
    if (this.app.currentPage) {
      await this.app.currentPage.callController('loadRecord',woDetailds.item, currentAsset);
    }  
  }

  /**
   * Navigates into a classification hierarchy by drilling down into a selected classification item.
   * This is an async wrapper method that delegates to the common utility function for classification navigation.
   * 
   * @async
   * @method drillInClassification
   * @memberof AppController
   * @param {Object} item - The classification item to drill into
   */
  async drillInClassification(item) {
    await commonUtil.drillInClassification(this.app, item);
  }
}
export default AppController;
