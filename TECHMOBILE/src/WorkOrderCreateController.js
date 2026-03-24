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

import { log, Device } from "@maximo/maximo-js-api";
import SynonymUtil from './utils/SynonymUtil';
import WOCreateEditUtils from "./utils/WOCreateEditUtils";
import CommonUtil from './utils/CommonUtil';

const TAG = "WorkOrderCreateController";


class WorkOrderCreateController {
  /**
   * defines fields to implement onCustomSaveTransition()
   * which is to avoid defaultSaveTransition defined at framework level
   * and uses save method implemented in controller itself.
   */
  constructor() {
    this.onSaveDataFailed = this.onSaveDataFailed.bind(this);
    this.saveDataSuccessful = true;
    this.callDefaultSave = true;
    this.validLocationValue = null;
    this.validAssetValue = null;
  }

  pageInitialized(page, app) {
    log.t(TAG, "Work order create Page Initialized");
    this.app = app;
    this.page = page;
    this.page.state.isLocationAssetFocus = false;
    if(this.page.params.quickReport) {
      this.page.state.defaultConfirm = this.page.state.useConfirmDialog;
      this.page.state.useConfirmDialog = false;
    }
    this.setPageTitle();
    CommonUtil.getTravelSystemProperties(this.app);
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  /**
   * This function is called when the user clicks the "Close" button on the confirmation dialog.
   * It sets the asset number and location values in the dsCreateWo object based on the selected options.
   */
  onUserConfirmationClose() {
    const dsCreateWo = this.app.findDatasource("dsCreateWo");
    WOCreateEditUtils.onUserConfirmationClose(this, dsCreateWo);
  }
  async setPageTitle() {
    if(this.page.params.quickReport) {
      this.page.state.pageTitle = this.app.getLocalizedLabel(
        'create_quickreport_title', 'New work order (via Quick Reporting)'
      )
      this.app.state.fromQuickReport = 1;
    } else {
      this.page.state.pageTitle = this.app.getLocalizedLabel(
        'createwo_title', 'Create work order'
      )
      this.app.state.fromQuickReport = 0;
    }
  }

  /**
   * Function to open Create WorkOrder page.
   * This function opens a new work order form by clearing the state of the datasource, retrieving the schema if it's missing,
   * and hide app loader once form is reset
   */
  async openNewWorkOrder() {
    const dsCreateWo = this.page.findDatasource("dsCreateWo");
    dsCreateWo.clearState();

    // After coming back from humai, schema is missing, this line is used to retrieve schema again.
    if(!dsCreateWo.getSchema()){
      await dsCreateWo.initializeQbe();
    }
    // istanbul ignore else
    if (dsCreateWo) {
      await this.prepareDefaultData(dsCreateWo);
    }

    if(this.page.params.quickReport) {
      this.setPriority();
    }
    // istanbul ignore else
    if (this.app.state.incomingContext && this.app.state.incomingContext.page === "createwo") {
      this.recoverFromSession(dsCreateWo);
    }
    // Reset alnDomainDS, Asset Lookup and Location Lookup
    // istanbul ignore next
    Promise.allSettled([
      WOCreateEditUtils.resetDataSource(this.app, 'alnDomainDS'),
      WOCreateEditUtils.resetDataSource(this.app, 'assetLookupDS'),
      WOCreateEditUtils.resetDataSource(this.app, 'locationLookupDS')
    ]).then(this.app.state.pageLoading = false);

    this.page.state.hasPreloadedDataSet = true;
  }

  // Assisted by WCA@IBM
  /**
   * Set the priority and work type for a new work order.
   * @param {string} priority - The priority of the work order.
   * @param {string} workType - The type of work for the work order.
   */
  setPriority() {
    const dsCreateWo = this.page.findDatasource("dsCreateWo");
    /* DT399960 - MASISMIG-58885 - Removing hardcoded wopriority and worktype values and making it configurable through system properties */
    dsCreateWo.item.wopriority = CommonUtil.getSystemProp(this.app, 'maximo.mobile.QuickWoPriority');
    dsCreateWo.item.worktype = CommonUtil.getSystemProp(this.app, 'maximo.mobile.QuickWoWorktype');
  }

  /** 
   * Function to set default data
   * If status data found then restore it
   * and apply default value in new WO from schema
   * @param dsCreateWo  create wo datasource to be passed
  */
  async prepareDefaultData(dsCreateWo) {
    const statusData = await SynonymUtil.getDefExtSynonymValueIdWithOrgSite(
      this.app.findDatasource("synonymdomainData"),
      "WOSTATUS",
      "WAPPR",
      this.app.userInfo.defaultOrg,
      this.app.userInfo.defaultSite);
    const WOSchedulingDates = CommonUtil.getSystemProp(this.app, 'maximo.mobile.WOSchedulingDates');
    const newWo = await dsCreateWo.addNew();
    if (newWo) {
      const currDate = new Date();
      const dataFormatter = this.app.dataFormatter;
      if (statusData) {
        newWo.status = statusData.value;
        newWo.status_description = statusData.description;
        newWo.status_maxvalue = statusData.maxvalue;
      }
      if (this.app.client) {
        newWo.siteid = this.app.client.userInfo.insertSite;
        newWo.reportedby = this.app.client.userInfo.personid;
      }
      newWo.status = statusData.value;
      newWo.chargestore = false;
      newWo.status_description = statusData.description;
      newWo.status_maxvalue = statusData.maxvalue;
      newWo.statusdate = dataFormatter.convertDatetoISO(currDate);
      newWo.reportdate = dataFormatter.convertDatetoISO(currDate);
    }
    /* DT221877 - MASISMIG-42208*/
    ["description", "worktype", "hierarchypath", "classstructureid"].forEach(field => {
      WOCreateEditUtils.setFieldValue(this.page, field);
    });

    /* DT221877 - MASISMIG-42208*/
    if (WOSchedulingDates?.includes('TARGET') && !this.page.params.quickReport) {
      ["targstartdate", "targcompdate"].forEach(field => {
        WOCreateEditUtils.setFieldValue(this.page, field);
      });
    }
    if (WOSchedulingDates?.includes('SCHEDULE') && !this.page.params.quickReport) {
      ["schedstart", "schedfinish"].forEach(field => {
        WOCreateEditUtils.setFieldValue(this.page, field);
      });
    }

    dsCreateWo.item["estdur"] = dsCreateWo?.getSchema()?.properties?.estdur?.defaultValue || dsCreateWo?.item?.estdur || "0";
    if (this.page.params.quickReport) {
      dsCreateWo.item.isquickreported = 1;
      dsCreateWo.item.wopriority = 1;
      dsCreateWo.item.actstart = dsCreateWo?.getSchema()?.properties?.actstart?.defaultValue || dsCreateWo?.item?.actstart || "" || newWo?.statusdate;
      const assignmentDS = this.app.findDatasource("assignmentdomainData");
      const assignedValue = assignmentDS?.items?.find(assignment => assignment.maxvalue === 'ASSIGNED' && assignment.defaults);
      dsCreateWo.item["assignment"] = [{
        laborcode: this.app.client.userInfo.labor.laborcode,
        status_maxvalue: 'ASSIGNED',
        status: assignedValue?.value
      }]
      this.page.state.useConfirmDialog = false;
    } else {
      WOCreateEditUtils.setFieldValue(this.page, 'wopriority');
      dsCreateWo.item["assignment"] = undefined;
    }
    
    ["assetnum", "location"].forEach(field => {
      WOCreateEditUtils.setFieldValue(this.page, field);
    });

    // istanbul ignore else
    if (this.app.state.currentMapData?.gisIntegrationData) {
      const mboValues = this.app.state.currentMapData.gisIntegrationData;
      for (const mboValue of mboValues) {
        const [woField] = Object.keys(mboValue);
        const [gisValue] = Object.values(mboValue);
        // istanbul ignore else
        if (woField && gisValue) {
          dsCreateWo.item[woField] = gisValue
        }
      }
    }
    this.app.state.parentPage = "";
  }

  /** 
   * Function to Fetch Data from Session
   * and set Context if state has incomingContext assetnum
   * @param dsCreateWo  create wo datasource to be passed
  */
  recoverFromSession(dsCreateWo) {
    const savedWorkorder = sessionStorage.getItem("createwo_workorder");
    // istanbul ignore if
    if (savedWorkorder) {
      const item = JSON.parse(savedWorkorder);
      Object.entries(item).forEach(
        ([key, value]) => {
          if(!["workorderid","_bulkid","href"].includes(key)){
            dsCreateWo.item[key] = value;
          }
        }
      );
      sessionStorage.removeItem("createwo_workorder");
    }
    if (this.app.state.incomingContext.assetnum) {
      this.setIncomingContext();
    }
 }

  /**
   * Function to set flag for 'save-data-failed' event
   */
  onSaveDataFailed() {
    this.saveDataSuccessful = false;
  }

  /**
   * Function to open WorkType lookup with preselected item
   */
  async openWorkTypeLookup(evt) {
    let defOrg = this.app.client.userInfo.insertOrg;
    let typeDs = this.app.findDatasource("dsworktype");

    if (typeDs && defOrg) {
      typeDs.clearState();
      // istanbul ignore next
      if (!this.page.state.worktype) {
        typeDs.clearSelections();
        const selectedItem = typeDs.items.find(item => item.worktype === this.page.state.worktype);
        if (selectedItem) {
          typeDs.setSelectedItem(selectedItem, true);
        }  
      }
      this.page.showDialog("workTyLookup");
      this.page.state.dialogOpened = true;
    }
  }

  /**
   * Function to create new work order
   */
  async createWorkorder(evt) {
    // Workaround to validate fields before saving
    // Graphite's duration fields is not triggering onValueChanged when field made blank which is not validating value
    this.page.state.errorMessage = this.validateFields();
    if(this.page.state.errorMessage || this.page.state.readOnlyState) {
      let toastTitle = this.app
          .getLocalizedLabel(
            'messages_issue_on_save_body',
            'Fix the indicated errors. Then, save your changes.'
          );
        let toastBody = this.app
          .getLocalizedLabel(
            'messages_issue_on_save_title',
            'Unable to save due to errors on the page'
          );
        this.app.toast(toastBody, 'error', toastTitle);
      return
    }
    /* istanbul ignore else */
    if(this.page.state.transactionInCourse && this.page.state.errorMessage === ""){
      log.d("Multiples click in create only first will be saved");
      return;
    }
    this.page.state.transactionInCourse = true;
    let workorder = evt.item;
    if(this.page.state.editAssetsLocation) {
      this.page.state.createWorkorderItem = evt;
      this.page.state.saveInProgress=true;
      /* istanbul ignore next */
      if (this.page.state.isLocationAssetFocus) {
        this.page.state.transactionInCourse = false;
        return;
      }
    }
    this.page.state.isLocationAssetFocus = false;

    if (workorder) {
      let woCreateResource = this.page.findDatasource("dsCreateWo");
      woCreateResource.item["locationnum"] = woCreateResource.item["location"];
      /* istanbul ignore else */
      if (this.page.state.isMobile) {
        await WOCreateEditUtils.setPriorityFailureCode(this.app, woCreateResource);
      }

      // istanbul ignore else
      if (this.classificationChanged) {
        const specDatas = await WOCreateEditUtils.updateSpecificationAttributes(this.app);
        woCreateResource.item.workorderspec = specDatas;
        woCreateResource.item.classstructure = {
          hierarchypath: woCreateResource.currentItem?.hierarchypath,
          classstructureid: woCreateResource.currentItem?.classstructureid,
        };
      }

      let linearAssetSrc = [];
      if (this.page.state.assetLinear) {
        let multiassetlocci = {
          startyoffsetref: workorder.startyoffsetref,
          assetnum: workorder.assetnum,
          location: woCreateResource.item["location"],
          endyoffsetref: workorder.endyoffsetref,
          startzoffsetref: workorder.startzoffsetref,
          endzoffsetref: workorder.endzoffsetref,
          startoffset: workorder.startoffset,
          endoffset: workorder.endoffset,
          startzoffset: workorder.startzoffset,
          endzoffset: workorder.endzoffset,
          startyoffset: workorder.startyoffset,
          endyoffset: workorder.endyoffset,
          startmeasure: workorder.startmeasure,
          endmeasure: workorder.endmeasure,
          startassetfeatureid: workorder.startassetfeatureid,
          endassetfeatureid: workorder.endassetfeatureid,
          startfeaturelabel: workorder.startfeaturelabel,
          endfeaturelabel: workorder.endfeaturelabel,
          isprimary: 1,
          siteid: workorder.siteid,
        };
        woCreateResource.item['multiassetlocci'] = multiassetlocci;
        linearAssetSrc = [multiassetlocci];
      }

      try {
        if (this.callDefaultSave) {
          this.page.state.useConfirmDialog = false;
        }
        let response;
        this.saveDataSuccessful = true;
        woCreateResource.on("save-data-failed", this.onSaveDataFailed);
        //Do not go for update if there is any client side error
        if (!this.page.state.errorMessage) {
          const interactive = await this.prepareDatatoUpdate(woCreateResource);
          response = await woCreateResource.save(interactive);
        } else {
          this.saveDataSuccessful = false;
        }
        // istanbul ignore next
        if (response && woCreateResource.currentItem) {
          if (this.page.state.assetLinear) {
          let linearAsset = this.app.findDatasource("linearAsset");
          await linearAsset?.load({ src: linearAssetSrc, noCache: true });
          }
          this.navigateToDtlsPage(response, woCreateResource.currentItem);
          this.app.findPage("workOrderDetails").state.isLinear = this.page.state.assetLinear;

        }
      } catch (error) {
        /* istanbul ignore next */
        log.t(TAG, error);
      } finally {
        if (this.callDefaultSave) {
          this.page.state.useConfirmDialog = true;
        }
        this.page.state.worktype = '';
        this.page.state.hierarchypath = '';
        this.page.state.classstructureid = '';
        woCreateResource.off("save-data-failed", this.onSaveDataFailed);
        this.page.state.transactionInCourse = false;
        this.page.state.saveInProgress=false;
      }
    }
  }

  /**
   * Function to navigate to Work order details page 
   * after work order save
   * In case of device siteId will not set in pageparams and data will be set from currentItem
   * In case of web siteid will set in pageparams and data will set from response
   * if no response items found code will not be executed
   */
  navigateToDtlsPage(response,currentItem){
    const device = Device.get();
    this.app.state.currentMapData = undefined;
    const itemwonum = currentItem.wonum;
    const itemhref = currentItem.href;

    //workorder creation failed and no items found return from here to prevent further execution of code.
    if (!response?.items || response.items?.length <= 0) {
      log.t(TAG, "Workorder creation failed no items found.");
      return;
    }
    /* istanbul ignore else */
    if (device.isMaximoMobile) {
      if (
        this.app.pageStack.length === 2 &&
        this.app.pageStack[1] === "createwo"
      ) {
        this.app.pageStack.push("schedule");
      }
      this.app.setCurrentPage({
        name: "workOrderDetails",
        resetScroll: true,
        params: { wonum: itemwonum, href: itemhref,prevPage: "CreateWO"},
      });
    }  else {
        if (
          this.app.pageStack.length === 2 &&
          this.app.pageStack[1] === "createwo"
        ) {
          this.app.pageStack.push("schedule");
        }
        if (response.items[0].href) {
          this.app.setCurrentPage({
            name: "workOrderDetails",
            resetScroll: true,
            params: {
              prevPage: "CreateWO",
              wonum: response.items[0].wonum,
              siteid: response.items[0].siteid,
              href: response.items[0].href
            },
          });
        }
    }
  }

   /**
    * Function to prepare the data if there is no client side error
    * update autolocate information in case it's mobile device
    * else update woserviceaddress of item
    * if there is no client side error
   */
  async prepareDatatoUpdate(woCreateResource){
    const device = Device.get();
    let interactive = { interactive: !this.page.state.isMobile};
    // istanbul ignore else
    if(this.app.state.currentMapData?.coordinate?.length) {
      const timeRef = new Date().getTime()
      const maxVars = await this.getMaxvars();
      let geoCoordinates = this.app.state.currentMapData.coordinate;
      
      const geoLatLong = this.setCoordinates();

      let autolocate = {
          coordinates: [geoLatLong?.[0], geoLatLong?.[1]],
          type: 'Point'	
      }

      /* istanbul ignore else */
      if(maxVars[0]?.varvalue === 'LATLONG') {
        geoCoordinates = geoLatLong
      }

      /* istanbul ignore else */
      if(device.isMaximoMobile) {
        const serviceAddress = {
          "woserviceaddress": [
            {
              latitudey : geoCoordinates[1],
              longitudex:geoCoordinates[0],
              anywhererefid: timeRef
            }
          ]
        }
        interactive['localPayload'] = {
          ...woCreateResource.item,
          woserviceaddress: serviceAddress,
          autolocate: JSON.stringify(autolocate),
          serviceaddress: {
            latitudey : geoCoordinates[1],
            longitudex: geoCoordinates[0],
            anywhererefid: timeRef
          },
        }
        const esigNeeded = await CommonUtil.checkSysPropArrExist(this.app, 'maximo.mobile.wostatusforesig', 'INPRG');
        if(esigNeeded && this.page.params.quickReport) {
          interactive['esigCheck'] = 1;
        } else {
          interactive['esigCheck'] = 0;
        }
        woCreateResource.item["woserviceaddress"] = [{
          longitudex: geoCoordinates[0],
          latitudey: geoCoordinates[1],
        }]
      } else {
        woCreateResource.item["woserviceaddress"][0].longitudex = geoCoordinates[0];
        woCreateResource.item["woserviceaddress"][0].latitudey = geoCoordinates[1];
      }
    } else {
      let serviceAddress = woCreateResource.item["woserviceaddress"]?.length && woCreateResource.item["woserviceaddress"][0];
      if (!(serviceAddress?.longitudex && serviceAddress?.latitudey)) {
        delete woCreateResource.item["woserviceaddress"];
      }
    }
    return interactive;
  }

   /**
   * Function to set the coordinates
   */
  setCoordinates(){
    const geoLatLong = this.app?.map?.convertCoordinates(
      this.app.state.currentMapData.coordinate,
      this.app.map.getBasemapSpatialReference(),
      'EPSG:4326'
    );
    return geoLatLong;
  }

  /**
   * Function to get maxvars item
   */
  async getMaxvars() {
    let maxVars = CommonUtil.filterMobileMaxvars('COORDINATE', this.app.findDatasource('defaultSetDs'));
    return maxVars;
  }

  /**
   * Create work order on user confirmation dialog save
   * */
  async onCustomSaveTransition() {
    let dsCreateWo = this.page.findDatasource("dsCreateWo");
    this.callDefaultSave = false;
    await this.createWorkorder({
      item: dsCreateWo.item,
    });
    return {
      saveDataSuccessful: this.saveDataSuccessful,
      callDefaultSave: this.callDefaultSave,
    };
  }

  /**
   * This function called when click on any item in worktype lookup
   * @param event  event.worktype value returned from lookup
   */
  async selectWorkType(event) {
    WOCreateEditUtils.selectWorkType(this.page, 'dsCreateWo', event.worktype);
  }

  /**
   * function to close Create work order page.
   */
  handleClose() {
    this.app.setCurrentPage({ name: "schedule", resetScroll: true });
  }
  /*
   * Method to resume the page
   */
  pageResumed() {
    this.app.state.pageLoading = true;
    this.app.pageStack = ["schedule", "createwo"];
    this.page.state.isMobile = Device.get().isMaximoMobile;
    this.page.state.assetLinear = false;
    this.page.state.linearAssetAvailable=false;
    this.page.state.saveDisable  = false;
    this.page.state.disableButton = false;
    this.page.state.zRefDisable = false;
    this.classificationChanged = false;
    let addNew = true;
    WOCreateEditUtils.loadYRefData(this.app,this.page);
    /* istanbul ignore else */
    if(this.app?.lastPage?.name === 'assetLookup') {
      addNew = false;
    }
    this.setPageTitle();

    // Added the `hasPreloadedDataSet` flag to track if preloaded data has been modified.
    // The issue was the "Save/Discard" dialog appearing even without changes, caused by preloading data.
    // The flag is initially `false` and set to `true` once the default data is loaded (openNewWorkOrder()).
    // On user input, the `onValueChange` event checks if the data was preloaded and modified.
    // If both are true, the confirmation dialog is shown, ensuring unsaved changes are not lost.
    this.page.state.hasPreloadedDataSet = false;

    /* istanbul ignore else */
    if (addNew) {
      this.openNewWorkOrder();
      this.page.state.useConfirmDialog = false;
    } else {
      this.app.state.pageLoading = false;
    }
    if(this.page.params.quickReport) {
      this.page.state.useConfirmDialog = false;
    }
  }

  /**
   * function called On calender datetime value changed
   */
  // istanbul ignore next
  onValueChanged(changeObj) {
    this.page.state.errorMessage = this.validateFields();
    if (changeObj.field === 'endmeasure') {
      if (changeObj.oldValue === changeObj.newValue?.toString()) {
        this.page.state.endMeasureUpdate = true;
      } else {
        this.page.state.endMeasureUpdate = false;
      }
    }

    if (changeObj.field === 'startmeasure') {
      if (changeObj.oldValue === changeObj.newValue?.toString()) {
        this.page.state.measureUpdate = true;
      } else {
        this.page.state.measureUpdate = false;
      }
    }
    
  
    //Used to update the value if we remove startfeaturelabel and endfeaturelabel
    if (changeObj.field === 'startfeaturelabel' && !changeObj.newValue) {
      this.page.state.startOffsetReadOnly = true;
      changeObj.datasource.item.startoffset =null;
        changeObj.datasource.item.startfeaturelabel = "";
        changeObj.datasource.item.startassetfeatureid = null;
      changeObj.datasource.item.startmeasure = null;
    }
    if (changeObj.field === 'endfeaturelabel' && !changeObj.newValue) {
      this.page.state.endOffsetReadOnly = true;
      changeObj.datasource.item.endoffset = null;
      changeObj.datasource.item.endfeaturelabel = "";
      changeObj.datasource.item.endassetfeatureid = null;
      changeObj.datasource.item.endmeasure = null;
    }
    if (changeObj.newValue && this.page.state.hasPreloadedDataSet) {
      this.page.state.useConfirmDialog = true;
    }
  }

  /**
  * Function to validate if field is ui required and not has value on attribute
  * @param attributeName attribute name
  * @param attributeValue attribute value
  * @returns  true or false
  */
  uiRequired(attributeName, attributeValue){
    return WOCreateEditUtils.uiRequired(this.page, 'dsCreateWo', attributeName, attributeValue);
  }

  /**
   * Function to validate workorder fields
   */
 validateFields() {
  let workorder = this.page.findDatasource('dsCreateWo').item;
  const WOSchedulingDates = CommonUtil.getSystemProp(this.app, 'maximo.mobile.WOSchedulingDates');
  let arrayListFieldsWithError = [];

   /* DT399960 - MASISMIG-58885 - Removing hardcoded wopriority and worktype values and making it configurable through system properties */
   let quickWoPriority, quickWoWorktype;
   if (this.page.params.quickReport) {
     quickWoPriority = CommonUtil.getSystemProp(this.app, 'maximo.mobile.QuickWoPriority');
     quickWoWorktype = CommonUtil.getSystemProp(this.app, 'maximo.mobile.QuickWoWorktype');
   }
  if(this.page.params.quickReport && (
    (workorder?.worktype && workorder?.worktype !== quickWoWorktype) || (workorder?.wopriority && workorder?.wopriority !== quickWoPriority) || workorder?.description || workorder?.schedstart || workorder?.schedfinish
  )) {
    this.page.state.updatedForm = true;
    this.page.state.useConfirmDialog = this.page.state.defaultConfirm;
  } else if(this.page.params.quickReport && !this.page.state?.updatedForm) {
    this.page.state.useConfirmDialog = false;
  }
  let errorMessage = "";
  let errorField = "";

  /* DT221877 - MASISMIG-42208 */
   if((this.uiRequired("description", workorder?.description !== undefined ? workorder.description.trim() : workorder?.description))){
    arrayListFieldsWithError.push({"attributename":"description", "error":true});
    this.showWOWarnings("description", "");
  }else{
    arrayListFieldsWithError.push({"attributename":"description", "error":false});
    this.clearWarnings("description");
  }

  if(this.uiRequired("worktype", workorder?.worktype)){
    arrayListFieldsWithError.push({"attributename":"worktype", "error":true});
  }else{
    arrayListFieldsWithError.push({"attributename":"worktype", "error":false});
    this.clearWarnings("worktype");
  }
  /* DT221877 - MASISMIG-42208 */ 

  //DT179992: Mobile, required fields not working
  let minEstimatedDuration = this.page.state.minEstimatedDuration ?? 0;

 if ((workorder.wopriority &&
    (workorder.wopriority < this.page.state.minPriority || workorder.wopriority > this.page.state.maxPriority))
    || (this.uiRequired("wopriority", workorder.wopriority)))
  {
    if((workorder.wopriority < this.page.state.minPriority || workorder.wopriority > this.page.state.maxPriority)) {
      errorMessage = this.app.getLocalizedLabel('priority_error_msg', `Priority ${workorder.wopriority} is not a valid priority value between ${this.page.state.minPriority} and ${this.page.state.maxPriority}`, [workorder.wopriority, this.page.state.minPriority, this.page.state.maxPriority]);
      errorField = "wopriority";
      this.showWOWarnings(errorField, errorMessage);
      this.page.state.errorMessage = errorMessage;
    }
    arrayListFieldsWithError.push({"attributename":"wopriority", "error":true});
  } else {
    this.clearWarnings("wopriority");
    arrayListFieldsWithError.push({"attributename":"wopriority", "error":false});
  }
  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
    * Validate two dates to ensure they are valid and within the correct range.
    * @param {string} startField - The id of the start date field.
    * @param {string} endField - The id of the end date field.
    * @param {string} errorFieldLabel - The label for the error message field.
  */
  const validateDates = (startField, endField, errorFieldLabel) => {
    if (
      (workorder[startField] && workorder[endField] && workorder[startField] > workorder[endField])
      || this.uiRequired(startField, workorder[startField])
      || this.uiRequired(endField, workorder[endField])
    ) {
      const errorMessage = this.app.getLocalizedLabel(
        `startdate_enddate_compare_msg`,
        `The ${errorFieldLabel} start date must be before the finish date`
      );
      this.showWOWarnings(startField, errorMessage);
      this.page.state.errorMessage = errorMessage;
      arrayListFieldsWithError.push({ "attributename": startField, "error": true });
      arrayListFieldsWithError.push({ "attributename": endField, "error": true });
    } else {
      this.clearWarnings(startField);
      arrayListFieldsWithError.push({ "attributename": startField, "error": false });
      arrayListFieldsWithError.push({ "attributename": endField, "error": false });
    }
  }
  // istanbul ignore else
  if (WOSchedulingDates?.includes('SCHEDULE') && !this.page.params.quickReport) {
    validateDates("schedstart", "schedfinish", "scheduled");
  }

  // istanbul ignore else
  if (WOSchedulingDates?.includes('TARGET') && !this.page.params.quickReport) {
    validateDates("targstartdate", "targcompdate", "target");
  }
  

  if (workorder.estdur < minEstimatedDuration
    || (this.uiRequired("estdur",workorder.estdur))) 
  {
    // istanbul ignore next
    if (minEstimatedDuration > 0) {
      errorMessage = this.app.getLocalizedLabel(`est_dur_msg`,`The duration should be greater then ${minEstimatedDuration}`, [minEstimatedDuration]);
    } else {
      errorMessage = this.app.getLocalizedLabel(`est_dur_msg`,`The duration should be positive value`);
    }
    errorField = "estdur";
    this.showWOWarnings(errorField, errorMessage);
    this.page.state.errorMessage = errorMessage;
    arrayListFieldsWithError.push({"attributename":"estdur", "error":true});
  } else {
    this.clearWarnings("estdur");
    arrayListFieldsWithError.push({"attributename":"estdur", "error":false});
  }
  arrayListFieldsWithError =  this.validateLinearForm(workorder,arrayListFieldsWithError)
  if (arrayListFieldsWithError.find(data => data.error === true)) {
    this.page.state.readOnlyState = true;
  } else {
    this.page.state.readOnlyState = false;
  }
  WOCreateEditUtils.saveDisable(this.page);
  return errorMessage;
}

  /**
   * Function to set field warnings
   */
  showWOWarnings(field, message) {
    WOCreateEditUtils.showWOWarnings(this.page, "dsCreateWo", field, message);
  }

  /**
   * Function to clear field warnings
   */
  clearWarnings(field) {
    WOCreateEditUtils.clearWarnings(this.page, "dsCreateWo", field);
  }

  /**
   * Set editorValue on the basis of content
   * @param {*} rich text editor on change event
   */
  onEditorChange(evt) {
    this.page.state.editorValue = evt.target.content;
  }

  /**
   * Reset editorValue on save perform from rich text editor save button
   */
  onEditorSave() {
    this.page.state.editorValue = null;
  }

  /**
   * Callback from dialog back button
   */
  onCloseRichTextDialog() {
    // istanbul ignore else
    if (
      !!this.page.state?.editorValue?.trim() && 
      this.page.datasources?.dsCreateWo?.item?.["description_longdescription"] !== this.page.state.editorValue
    ) {
      this.page.showDialog("saveDiscardDialogCreatePage");
    }
  }

  /**
   * Set long description value.
   * @param {*} workorder item and datasource as event
   */
  setRichTextValue(evt) {
    evt.datasource.item.description_longdescription = this.page.state.editorValue;
    this.onEditorSave();
  }

  /**
   * Reset editorValue on click discard button
   */
  closeSaveDiscardDialog() {
    this.onEditorSave();
  }
  /**
   * choose location from lookup
   * validateAsset function should be validated only on mobile platform.
   */
  async chooseLocation(item) {
    await WOCreateEditUtils.chooseLocation(this.app, this.page, "dsCreateWo", item, this);
  }

  /**
   * open asset lookup
   */
  openAssetLookup() {
    WOCreateEditUtils.openAssetLookup(this.app, this.page, "createwo");
  }

  async setIncomingContext () {
    const context = this.app.state.incomingContext;

    this.page.datasources.dsCreateWo.item["assetnum"] = context.assetnum;
    this.app.state.incomingContext = null;

    this.onChangeAsset({
      item: this.page.findDatasource('dsCreateWo').item,
      app: this.app,
    });
  }
  /**
   * set and validate asset on asset input field
   * getAssetOrLocation function just return a valid asset
   */
  async onChangeAsset(event) {
    /* istanbul ignore else */
    if (event.item?.assetnum?.trim()) {
      let asset = await WOCreateEditUtils.getAssetOrLocation(
        event.app,
        "assetLookupDS",
        "assetnum",
        event.item.assetnum
      );
      /* istanbul ignore else */
      if (asset && asset.length > 0) {
        this.chooseAsset(asset[0]);
      }
    }
  }
  /**
   * set and validate location on location input field
   * getAssetOrLocation function just return a valid location
   */
  async onChangeLocation(event) {
    /* istanbul ignore else */
    if (event.item?.location?.trim()) {
      let location = await WOCreateEditUtils.getAssetOrLocation(
        event.app,
        "locationLookupDS",
        "location",
        event.item.location
      );
      /* istanbul ignore else */
      if (location && location.length > 0) {
        await this.chooseLocation(location[0]);
      }
    } else{
      let lookupDs = event.app.findDatasource("assetLookupDS");
      await WOCreateEditUtils.clearSearch(lookupDs);
    }
  }

  /**
   * search location on blur of assets input
   * @param {*} input value on blur
   */
   async findLocation(item) {
    if(!item.value) {
      this.page.state.isLocationAssetFocus = false;
      this.page.state.assetLinear = false;
      this.page.state.linearAssetAvailable=false;
      return;
    } 
     // istanbul ignore next
     if (item.value) {
       await this.validateLinearAsset(item.value);
     }
     let assetData = await WOCreateEditUtils.getAssetOrLocation(
       this.app,
       "assetLookupDS",
       "assetnum",
       item.value
     );
     /* istanbul ignore else */
     if (assetData.length === 1) {
       await this.chooseAsset(assetData[0]);
     }
     // istanbul ignore next
     if (assetData.length === 0) {
       this.page.state.assetLinear = false;
       this.page.state.linearAssetAvailable = false;
     }
     this.page.state.isManual = false;
     this.page.state.isLocationAssetFocus = false;
     this.callCreateWorkOrder();
   }

  /**
   * This function validates whether the selected asset is linear or not.
   * @param {object} app - The application object.
   * @param {object} page - The current page object.
   * @param {string} assetNum - The asset number to be validated.
   */
  async validateLinearAsset(assetNum) {
    await WOCreateEditUtils.validateLinearAsset(this.app, this.page, 'dsCreateWo', assetNum);
  }

  /**
   * This function calculates the start measure of an item based on its start feature label and offset. It also validates the start measure and updates it if necessary.
   * @param {*} evt The event object passed to the function.
   */
  async startOffsetCal(evt){
    await WOCreateEditUtils.startOffsetCal(this.app, this.page, 'dsCreateWo', evt, false);
  }

  /**
   * This function calculates the end measure of an annotation based on its end offset and the start measure of the annotation.
   * @param {*} evt The event object containing the annotation data.
   */
  async endOffsetCal(evt){
    await WOCreateEditUtils.endOffsetCal(this.app, this.page, 'dsCreateWo', evt, false);
  }

  /**
   * This function is called when the user clicks the Start Measure button. It validates the Start Measure input and displays any warnings or errors as needed.
   * @param {*} evt An object containing the event details.
   */
  async startMeasureCal(evt){
    await WOCreateEditUtils.startMeasureCal(this.app, this.page, 'dsCreateWo', evt, false);
  }

    /**
   * This function is called when the user clicks the End Measure button. It validates the End Measure input and displays any warnings or errors as needed.
   * @param {*} evt An object containing the event details.
   */
    async endMeasureCal(evt){
      await WOCreateEditUtils.endMeasureCal(this.app, this.page, 'dsCreateWo', evt, false);
    }

  /**
   * search assets on blur of location input
   * @param evt (object): An object representing the event.
   * @param errorField (string): A string representing the id of the field where the error message should be displayed.
   * @returns This function returns a boolean value indicating whether the start measure is valid or not.
   */    
  startMeasureValidation(evt){
    return WOCreateEditUtils.startMeasureValidation(this.app, this.page, 'dsCreateWo', evt);
  }

    /**
   * search assets on blur of location input
   * @param evt (object): An object representing the event.
   * @param errorField (string): A string representing the id of the field where the error message should be displayed.
   * @returns This function returns a boolean value indicating whether the start measure is valid or not.
   */    
    endMeasureValidation(evt){
      return WOCreateEditUtils.endMeasureValidation(this.app, this.page, 'dsCreateWo', evt);
    }

  /**
   * This function validates the start Z Offset Reference field when creating or editing work orders.
   * @param evt (object): The event object for the field being validated.
   * @returns Returns true if the validation passes, false otherwise.
   */
   async startZRefCal(evt){
    await WOCreateEditUtils.startZRefCal(this.app, this.page, 'dsCreateWo', evt);
  }

  /**
   * This function validates the End Z Offset Reference field when creating or editing work orders.
   * @param evt (object): The event object for the field being validated.
   * @returns Returns true if the validation passes, false otherwise.
   */
  async endZRefCal(evt){
    await WOCreateEditUtils.endZRefCal(this.app, this.page, 'dsCreateWo', evt);
  }

   // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Search assets on blur of location input
   * Find an asset or location based on the input value.
   * @param {Object} item The input value object containing the asset or location value.
   * @returns {Promise<void>} A promise that resolves when the asset or location is found.
   */
   async findAsset(item) {
    const dsCreateWo = await this.app.findDatasource("dsCreateWo");
    /* istanbul ignore else */
    let assetData = false;
    if(!item?.value) { 
      this.page.state.isLocationAssetFocus = false;
      if(this.page.state.assetFiltered) {
        await WOCreateEditUtils.getAssetOrLocation(
          this.app,
          "assetLookupDS",
          "location",
          ''
        );
      }
      this.page.state.assetFiltered = false;
      return;
    };
    if(!assetData) {
      assetData = await WOCreateEditUtils.getAssetOrLocation(
        this.app,
        "assetLookupDS",
        "location",
        item.value
      );
    }
    
    if (assetData.length === 1) {
      await this.chooseLocation(assetData[0]);
      this.validAssetValue = assetData[0].assetnum;
    } else if (assetData.length > 1 && assetData.findIndex((asset) => asset.assetnum === dsCreateWo?.item?.assetnum) < 0) {
      item.asset = assetData;
      WOCreateEditUtils.validateAsset(this.app, this.page, dsCreateWo, item);
      this.validAssetValue = item?.asset?.assetnum;
    } else if (!assetData.some(asset => asset.assetnum === dsCreateWo?.item?.assetnum)) {
      const tempItem = {
        asset: [{
          assetnum: dsCreateWo.item.assetnum,
        }],
        location: item.value
      }
      WOCreateEditUtils.validateAssetLocation(this.app, this.page, dsCreateWo, tempItem, this);
    }
    this.page.state.isLocationAssetFocus = false;
    this.page.state.assetFiltered = true;
    this.callCreateWorkOrder();
  }

  /**
   * Flag for user manually entered location or assets
   */
  async editAssetsLocation(item) {
    await WOCreateEditUtils.editAssetsLocation(this.page, item, 'dsCreateWo');
  }


  /**
   * If createWorkOrder method was called before and we were waiting for assets / location data
   * then after fetch of location / assets proceed with createWorkOrder and also
   * set editAssetsLocation and saveInProgress to false
   */
   callCreateWorkOrder() {
    if(this.page.state.saveInProgress) {
      this.page.state.editAssetsLocation = false;
      this.page.saveInProgress = false;
      this.createWorkorder(this.page.state.createWorkorderItem);
    }
  }
  
   /**
	 * Use to set the selected item..
	 * @param {item} asset item
	 */
  chooseAssetItem(item) {
    WOCreateEditUtils.chooseAssetItem(this.app, this.page, 'dsCreateWo', item, this);
  }

  /**
   * choose the asset value form asset lookup;
   */
  async chooseAsset(item) {
    await WOCreateEditUtils.chooseAsset(this.app, this.page, 'dsCreateWo', item, this);
  }

  /**
   * set Asset/location value when user confirm Yes
   */
  setLookUpValue() {
    let dsCreateWo = this.app.findDatasource("dsCreateWo");
    let selectedItem = this.page.state.selectedItem;
    /* istanbul ignore else */
    if (selectedItem.action === "SETASSET") {
      const isValidGL = WOCreateEditUtils.validateGlAccount(this.app, this.page, dsCreateWo, selectedItem.item, "SETASSETGL", true);
      WOCreateEditUtils.setAsset(this.app, this.page, dsCreateWo, selectedItem.item, this);
       /* istanbul ignore else  */
      if(isValidGL) {
        this.validAssetValue = selectedItem.item.assetnum;
      }
    } else if (selectedItem.action === "SETLOCATION") {
      const isValidGL = WOCreateEditUtils.validateGlAccount(this.app, this.page, dsCreateWo, selectedItem.item, "SETLOCGL", true);
      WOCreateEditUtils.setLocation(this.app, this.page, dsCreateWo, selectedItem.item, this);
      /* istanbul ignore else  */
      if(isValidGL) {
        this.validLocationValue = selectedItem.item.location || selectedItem.item.locationnum;
      }
      if (selectedItem.item.asset.length > 1) {
        dsCreateWo.item.assetnum = "";
        dsCreateWo.item.assetdesc = "";
        dsCreateWo.item.asset = [];
      }
   //   this.validLocationValue = selectedItem.item.location;
    } else if (selectedItem.action === "SETLOCGL" || selectedItem.action === "SETASSETGL") {
      WOCreateEditUtils.setGLAccount(this.app, this.page, dsCreateWo, selectedItem.item, selectedItem.action, this);
      (selectedItem.action === "SETLOCGL") ? this.validLocationValue = selectedItem.item.location || selectedItem.item.locationnum : this.validAssetValue = selectedItem.item.assetnum;
    }
  }

  /**
   * set Asset/location value when user confirm NO
   */
  onUserConfirmationNo() {
    WOCreateEditUtils.onUserConfirmationNo(this.app, this.page, 'dsCreateWo');
  }

  /**
   * set Asset value on scanning a barcode/QR code
   */
  handleAssetBarcodeScan(event) {
    let dsCreateWo = this.app.findDatasource("dsCreateWo"); 
    if (event.value) {
      dsCreateWo.item.assetnum = event.value;
    }
    this.onChangeAsset({"item":dsCreateWo.item, "app":this.app});  
  }

  /**
   * set location value on scanning a barcode/QR code
   */
  handleLocationBarcodeScan(event) {
    let dsCreateWo = this.app.findDatasource("dsCreateWo");
    if (event.value) {   
      dsCreateWo.item.location = event.value; 
    }  
    this.onChangeLocation({"item":dsCreateWo.item, "app":this.app}); 
  }

  /**
   * This function opens the Y reference point lookup dialog for the end point.
   * @param {object} evt - The event object.
   */
  async openYRefernceLookup(evt) {
    await WOCreateEditUtils.openYRefernceLookup(this.app, evt);
  }

  /**
    * This function opens the Y reference point lookup dialog for the end point.
    * @param {object} evt - The event object.
  */
  async openEndYRefernceLookup(evt) {
    await WOCreateEditUtils.openYRefernceLookup(this.app, evt);
  }


  /**
   * This function opens the Z reference point lookup dialog.
   * @param {object} evt - The event object.
   */
  async openZRefernceLookup(evt) {
    await WOCreateEditUtils.openZRefernceLookup(this.app, evt);
  }

  /**
   * This function opens the end Z reference point lookup dialog.
   * @param {object} evt - The event object.
   */
  async openEndZRefernceLookup(evt) {
    await WOCreateEditUtils.openZRefernceLookup(this.app, evt);
  }

  /**
    * This function chooses the Y reference point from the lookup dialog.
    * @param {object} itemSelected - The selected item in the lookup dialog.
   */
  async chooseYRefernce(itemSelected) {
    await WOCreateEditUtils.chooseYRefernceData(this.page, "dsCreateWo", itemSelected, "startyoffsetref");
    this.clearWarnings("startyoffsetref");
  }

  /**
   * This function chooses the Z reference point from the reference point lookup dialog.
   * @param {object} itemSelected - The selected item in the reference point lookup dialog.
   */
  async chooseZRefernce(itemSelected) {
    await WOCreateEditUtils.chooseYRefernceData(this.page, "dsCreateWo", itemSelected, "startzoffsetref");
    this.page.state.saveDisable = false;
    this.clearWarnings("startzoffsetref");
    WOCreateEditUtils.saveDisable(this.page);
  }

  /**
   * This function chooses the end Y reference point from the reference point lookup dialog.
   * @param {object} itemSelected - The selected item in the reference point lookup dialog.
   */
  async chooseEndYRefernce(itemSelected) {
    await WOCreateEditUtils.chooseYRefernceData(this.page, "dsCreateWo", itemSelected, "endyoffsetref");
    this.clearWarnings("endyoffsetref");
  }

  /**
   * This function chooses the end Z reference point from the reference point lookup dialog.
   * @param {object} itemSelected - The selected item in the reference point lookup dialog.
   */
  async chooseEndZRefernce(itemSelected) {
    await WOCreateEditUtils.chooseYRefernceData(this.page, "dsCreateWo", itemSelected, "endzoffsetref");
    this.page.state.zRefDisable = false;
    this.clearWarnings("endzoffsetref");
    WOCreateEditUtils.saveDisable(this.page);
  }

  /**
   * This function opens the reference point lookup dialog for starting a work order.
   * @param {object} evt - The event object.
   */
  async openStartReferncePointLookup(evt) {
    const dscreatewo = this.page.findDatasource("dsCreateWo");
    await WOCreateEditUtils.openRefPointLookup(this.app, evt, dscreatewo?.item?.assetnum);
  }

  /**
   * This function opens the reference point lookup dialog and loads the appropriate reference points into the datasource.
   * @param {object} evt - The event object.
   * @param {object} dsWoedit - The datasource object.
   * @param {string} assetnum - The asset number.
   */
  async openEndReferncePointLookup(evt) {
    const dscreatewo = this.page.findDatasource("dsCreateWo");
    await WOCreateEditUtils.openRefPointLookup(this.app, evt, dscreatewo?.item?.assetnum);
  }

  /**
   * This function opens the reference point lookup dialog and loads the appropriate reference points into the datasource.
   * @param {string} itemSelected - The item selected from the list of reference points.
   */
  async chooseReferncePoint(itemSelected) {
    await WOCreateEditUtils.chooseReferncePointData(this.page, "dsCreateWo", itemSelected, "startfeaturelabel");
    this.clearWarnings("startfeaturelabel");
  }

  /**
   * This function chooses the selected reference point data from the lookup dialog and updates the datasource.
   * @param {object} itemSelected - The item selected in the lookup dialog.
   */
  async chooseEndReferncePoint(itemSelected) {
    await WOCreateEditUtils.chooseReferncePointData(this.page, "dsCreateWo", itemSelected, "endfeaturelabel");
    this.clearWarnings("endfeaturelabel");
  }
  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  //validateLinearForm function is to validate user input when creating or editing a linear work order. 
  validateLinearForm(workorder, arrayListFieldsWithError) {
    if (workorder.startfeaturelabel) {
      const evt = { "item": workorder };
      const assetFeatureDs = this.app.findDatasource('assetFeatureData');
      const assetFeatureArr = assetFeatureDs.items;
      const hasError = WOCreateEditUtils.featureLabelValidation(assetFeatureArr, evt, "startfeaturelabel");
      arrayListFieldsWithError = this.validateFeatureLabel(hasError, "startfeaturelabel", arrayListFieldsWithError);
    }
    if (workorder.endfeaturelabel) {
      const evt = { "item": workorder };
      const assetFeatureDs = this.app.findDatasource('assetFeatureData');
      const assetFeatureArr = assetFeatureDs.items;
      const hasError = WOCreateEditUtils.featureLabelValidation(assetFeatureArr, evt, "endfeaturelabel");
      arrayListFieldsWithError = this.validateFeatureLabel(hasError, "endfeaturelabel", arrayListFieldsWithError);
    }
    if (workorder.startyoffsetref) {
      const evt = { "item": workorder };
      const hasError = WOCreateEditUtils.startYRefCal(this.page, evt);
      arrayListFieldsWithError = this.validateStartYOffsetzRef(hasError, "startyoffsetref", arrayListFieldsWithError);
    }
    if (workorder.endyoffsetref) {
      const evt = { "item": workorder };
      const hasError = WOCreateEditUtils.endYRefCal(this.page, evt);
      arrayListFieldsWithError = this.validateStartYOffsetzRef(hasError, "endyoffsetref", arrayListFieldsWithError);
    }
    if (workorder.startmeasure) {
      const errorMsg = this.app.getLocalizedLabel(
        `measure_error_msg`,
        `Start Measure must be between the linear asset's Start Measure ${this.page.state.assetStartMeasure} and ${this.page.state.assetEndMeasure}. (BMXAA6139)`, [this.page.state.assetStartMeasure, this.page.state.assetEndMeasure]
      );
      const errorField = "startmeasure";
      if (workorder.startmeasure && ((workorder.startmeasure < this.page.state.assetStartMeasure) || (workorder.startmeasure > this.page.state.assetEndMeasure))) {
        this.page.state.errorMessage = errorMsg;
        arrayListFieldsWithError.push({ "attributename": "startmeasure", "error": true });
      } else {
        this.clearWarnings(errorField);
        arrayListFieldsWithError.push({ "attributename": "startmeasure", "error": false });
      }
    }

    if (workorder.endmeasure) {
      const errorMsg = this.app.getLocalizedLabel(
        `measure_error_msg`,
        `End Measure must be between the linear asset's Start Measure ${this.page.state.assetStartMeasure} and ${this.page.state.assetEndMeasure}. (BMXAA6139)`, [this.page.state.assetStartMeasure, this.page.state.assetEndMeasure]
      );
      const errorField = "endmeasure";
      if (workorder.endmeasure && ((workorder.endmeasure < this.page.state.assetStartMeasure) || (workorder.endmeasure > this.page.state.assetEndMeasure))) {
        this.page.state.errorMessage = errorMsg;
        arrayListFieldsWithError.push({ "attributename": "endmeasure", "error": true });
      } else {
        this.clearWarnings(errorField);
        arrayListFieldsWithError.push({ "attributename": "endmeasure", "error": false });
      }
    }
    return arrayListFieldsWithError;
  }
   // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  //This function validates the start feature label field in the layout editor. If the value entered is not a valid number or percentage, an error message is displayed and the user is prompted to enter a valid value.
  validateFeatureLabel(hasError, errorField, arrayListFieldsWithError){
    if (hasError === -1) {
      const errorMessage = this.app.getLocalizedLabel(
        `valid_featurelabel`,
        `Enter a valid reference feature on this asset`
      );
      this.showWOWarnings(errorField, errorMessage);
      this.page.state.errorMessage = errorMessage;
      arrayListFieldsWithError.push({ "attributename": errorField, "error": true });
    } else {
      this.clearWarnings(errorField);
      arrayListFieldsWithError.push({ "attributename": errorField, "error": false });
    }
    return arrayListFieldsWithError;
  }
  
  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  //This function validates the start y-offset reference field in the layout editor. If the value entered is not a valid number or percentage, an error message is displayed and the user is prompted to enter a valid value.
  validateStartYOffsetzRef(hasError, errorField, arrayListFieldsWithError) {
    if (hasError) {
      const errorMessage = this.app.getLocalizedLabel(
        `valid_yoffsetref`,
        `Enter valid Y offset`
      );
      this.showWOWarnings(errorField, errorMessage);
      this.page.state.errorMessage = errorMessage;
      arrayListFieldsWithError.push({ "attributename": errorField, "error": true });
    } else {
      this.clearWarnings(errorField);
      arrayListFieldsWithError.push({ "attributename": errorField, "error": false });
    }
    return arrayListFieldsWithError;
  }
    // Assisted by WCA@IBM
   // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  //This function validates the end y-offset reference field in the layout editor. If the value entered is not a valid number or percentage, an error message is displayed and the user is prompted to enter a valid value.
  validateEndYOffsetzRef(hasError, errorField, arrayListFieldsWithError) {
    if (hasError) {
      const errorMessage = this.app.getLocalizedLabel(
        `valid_yoffsetref`,
        `Enter valid Y offset`
      );
      this.showWOWarnings(errorField, errorMessage);
      this.page.state.errorMessage = errorMessage;
      arrayListFieldsWithError.push({ "attributename": "endyoffsetref", "error": true });
    } else {
      this.clearWarnings(errorField);
      arrayListFieldsWithError.push({ "attributename": "endyoffsetref", "error": false });
    }
    return arrayListFieldsWithError;
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  /**
   * Opens the classification lookup dialog.
   */
  async openClassification() {
    this.app.showDialog("classificationLookup");
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  /**
   * Choose a classification for the work item being edited.
   * @param {Object} itemSelected - The selected classification item.
   */
  async chooseClassification(itemSelected) {
    this.classificationChanged = true;
    await WOCreateEditUtils.chooseClassification(this.app, this.page, "dsCreateWo", itemSelected);
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  /**
   * Clears the classification information from the work order edit datasource.
   * 
   * @returns {Promise<void>} A promise that resolves when the classification information has been cleared.
   */
  async clearClassification() {
    await WOCreateEditUtils.clearClassification(this.app, this.page, "dsCreateWo");
  }

}
export default WorkOrderCreateController;
