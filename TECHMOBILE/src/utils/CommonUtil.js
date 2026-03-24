import _ from 'lodash';
import { log, Device } from '@maximo/maximo-js-api';
import SynonymUtil from "./SynonymUtil";
import MapPreLoadAPI from '@maximo/map-component/build/ejs/framework/loaders/MapPreLoadAPI';
import AppDefaults from "./AppDefaults";
/*
 * Licensed Materials - Property of IBM
 *
 * 5724-U18, 5737-M66
 *
 * (C) Copyright IBM Corp. 2023 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */

/**
 * Return System Property Value 
 * @param {Application} app application object
 * @param {String} systemPropName system property Name.
 */
const getSystemProp = (app, systemPropName) => {
    return app.state?.systemProp?.[systemPropName];
};

/**
 * Return true if system property value is same as expected value else return false 
 * @param {Application} app application object
 * @param {String} systemPropName system property name.
 * @param {String} propValue system property expected value. default value is 1
 */
const checkSystemProp = async (app, systemPropName, propValue = "1") => {
    return app.state?.systemProp?.[systemPropName] === propValue;
}

/**
 * Return true of false base on allowed property 
 * @param {Application} app application object
 * @param {String} systemPropName system property name for physical Sig.
 * @param {String} statusComp Complete Status name from maximo properties.
 * @param {Boolean} returnType Type of returning value , returnType True will return true/false, returnType false will return 1 or 0
 */
const checkSysPropArrExist = async (app, systemPropName, statusComp, returnType = true) => {
    const sigCheck = await getSystemProp(app, systemPropName);
    const allowedSignature = sigCheck? sigCheck.split(',').map((status) => status.trim()): [];
    const addEsig = allowedSignature.length > 0 && allowedSignature.indexOf(statusComp) > -1;
    if (returnType) {
        return !!(addEsig);
    } else {
        return (addEsig) ? 1 : 0;
    }
}

/**
 * Return the list of work order status list which is defined in synonymdomain table. 
 * if data already present in state "offlineStatusList" it will prevent repetative calls of synonymdomain
 * @param {app} app application object
 * @param {orgId} orgId Organization Id
 * @param {siteId} siteId Site Id
 */
const getOfflineStatusList = async (app, orgId, siteId) => {
    let filteredDomainValues = [];
    const synonymDomainsDS = app.findDatasource('synonymdomainData');
    
    if (!app.state.offlineStatusList?.length) {
      await synonymDomainsDS.initializeQbe();
      synonymDomainsDS.setQBE('domainid', 'WOSTATUS')
      synonymDomainsDS.setQBE('orgid', orgId);
      synonymDomainsDS.setQBE('siteid', siteId);

      filteredDomainValues = await synonymDomainsDS.searchQBE();

      // istanbul ignore next
      if (!app.state.offlineStatusList?.length && filteredDomainValues && filteredDomainValues.length < 1) {
        synonymDomainsDS.setQBE('domainid', 'WOSTATUS');
        synonymDomainsDS.setQBE('orgid', '=', orgId);
        synonymDomainsDS.setQBE('siteid', '=', 'null');
        filteredDomainValues = await synonymDomainsDS.searchQBE();

        // istanbul ignore next
        if (!app.state.offlineStatusList?.length && filteredDomainValues && filteredDomainValues.length < 1) {
          synonymDomainsDS.setQBE('domainid', 'WOSTATUS');
          synonymDomainsDS.setQBE('orgid', '=', 'null');
          synonymDomainsDS.setQBE('siteid', '=', 'null');
          filteredDomainValues = await synonymDomainsDS.searchQBE();
        }
      }

      if (filteredDomainValues?.length) {
        filteredDomainValues = filteredDomainValues.filter(status => {
          return Object.keys(JSON.parse(app.state.woStatSigOptions)).includes(status.maxvalue) ? app.checkSigOption(`${app.state.woOSName}.${status.maxvalue}`) : true;
        });
      }
      
      // istanbul ignore else
      if (!app.state.offlineStatusList?.length) {
        app.state.offlineStatusList = filteredDomainValues;
      }
      synonymDomainsDS.clearQBE();
    }
    return app.state.offlineStatusList;

    
}


  /**
   * Get systemproperties and store in a state.
   */
  const getTravelSystemProperties = async (app) => {   
    if (app.client && typeof app.client.getSystemProperties === 'function'){
      app.state.systemProp = await app.client.getSystemProperties('mxe.mobile.travel.prompt,mxe.mobile.travel.radius,mxe.mobile.travel.navigation,maximo.mobile.usetimer,maximo.mobile.statusforphysicalsignature,maximo.mobile.completestatus,mxe.mobile.navigation.windows,mxe.mobile.navigation.android,mxe.mobile.navigation.ios,maximo.mobile.allowmultipletimers,maximo.mobile.safetyplan.review,maximo.mobile.gotoreportwork');
    }    
  }

/**
 * Return List of allowed status based on current status of work order
 * @param {statusList} statusList list of offline status
 * @param {event} event datasource event work order object
 * @param {flowControlled} flowControlled work order flow controlled flag
 */
const getOfflineAllowedStatusList = async (app, event) => {
    const statusList = await getOfflineStatusList(app, event.item.orgid, event.item.siteid);
    const statusArr = [];
    statusList.forEach((element) => {
        const isValidTransition = isAllowedStatus(event.item.status_maxvalue, element.maxvalue);
        if (element.value && element.value !== event.item.status && isValidTransition) {
            statusArr.push({
                id: element.value,
                value: element.value,
                description: element.description,
                defaults: element.defaults,
                maxvalue: element.maxvalue,
                _bulkid: element.value
            });
        }
    });
    return statusArr;
}

  /**
   * In system properties we would get list of flag on which we have to ask for eSigCheck
   * if current status matches in list we would pass esigCheck 1 and on based of it graphite component
   * will handle to show prompt of esig
   * @returns 1 or 0 (boolean numeric value)
   */
  const checkEsigRequired = (app, page, status) => {
    const esigCheck = app.state?.systemProp?.["maximo.mobile.wostatusforesig"];
    const allowedSignature = esigCheck? esigCheck
      .split(',')
      .map((status) => status.trim()): [];
      const addEsig = allowedSignature.length > 0 &&
      allowedSignature.indexOf(page.state.selectedStatus) > -1;
    return (addEsig) ? true : false;
  }

/** 
 * This method checks status transition based on internal value.
 * @param { from } from from status
 * @param { to } to to status
*/
const isAllowedStatus = (from, to) => {
    let transitionMatrix = {
      WAPPR: ['COMP','WAPPR','CAN','INPRG','WSCH','CLOSE','WMATL','APPR'],
      WPCOND: ['COMP','WAPPR','CAN','INPRG','WSCH','CLOSE','WMATL','APPR'],
      APPR: ['COMP','WAPPR','CAN','INPRG','WSCH','CLOSE','WMATL','APPR'],
      WSCH: ['COMP','WAPPR','CAN','INPRG','WSCH','CLOSE','WMATL','APPR'],
      WMATL: ['COMP','WAPPR','CAN','INPRG','CLOSE','WMATL'],
      INPRG: ['COMP', 'WAPPR','INPRG','CLOSE','WMATL'],
      COMP: ['COMP', 'CLOSE'],
      CLOSE: ['CLOSE'],
      CAN: ['CAN']
    };

    if (!transitionMatrix[from] || transitionMatrix[from].indexOf(to) < 0) {
      return false;
    } else {
      return true;
    }
}


/**
 * Validate asset barcode
 * @param {string} selectedStatus - Status of the asset
 * @param {array} applicableStatus - Array of status that is applicable to the current operation
 * @returns {boolean} - True if the barcode is valid, otherwise false
 */
const checkScanRequired = async(selectedStatus, applicableStatus = ['INPRG', 'COMP']) => {
  // istanbul ignore else
  if (applicableStatus.includes(selectedStatus)) {
    return true;
  }
  return false;
}

/**
 * Returns true if the work order is not assigned or delivered
 * @param {Object} item The work order object
 * @returns {boolean} True if the work order is not assigned or delivered
 */
const canInteractWorkOrder = (item, app) => {
  const isAssignmentEnabled = app.checkSigOption(`${app.state.woOSName}.MANAGEASSIGNMENTSTATUS`);
  if(!isAssignmentEnabled || !item?.assignment?.length) {
    return true;
  }
  const assignment = item?.assignment?.filter(assignment => assignment?.laborcode === app.client?.userInfo?.labor?.laborcode && assignment?.assignmentid);
  if(item?.status_maxvalue === 'COMP'|| (!item?.hasOwnProperty('assignment') || !assignment.length)) {
    return true;
  }
  const domainStatus = app.findDatasource("assignmentdomainData")?.items.filter(domain => domain.valueid === 'ASSTAT|ACCEPTED')[0]?.value;
  const acceptLabel = domainStatus || app.getLocalizedLabel('accepted', 'Accepted').toUpperCase();
  const acceptableValues = [acceptLabel, 'WAITASGN', 'COMPLETE'];
  const status = assignment?.[0]?.status?.toUpperCase();
  return acceptableValues.includes(status);
}
/**
 * Marks the status of a work order as "Accepted".
 * @param {Object} app The GlideApplication object
 * @param {Object} page The current page object
 * @param {Object} ds The datasource object
 */
const markStatusAssigned = async (app,page,ds, listDS) => {
  const assignmentDS = ds.getChildDatasource('assignment',ds.item);
  const records = await assignmentDS.load();
  const woStatusData = await SynonymUtil.getSynonym(app.findDatasource('synonymdomainData'), 'ASSTAT', 'ASSTAT|ACCEPTED');

  const assignmentLength = records?.length;
  const index = (assignmentLength) ? records?.findIndex(assignment => assignment?.laborcode === app.client?.userInfo?.labor?.laborcode && assignment?.assignmentid) : 0;
  const tempRecord = records[index];
  // istanbul ignore else
  if (records.length > 0 && tempRecord && woStatusData) {
    tempRecord.status = woStatusData.value;
    tempRecord.valueid = woStatusData.valueid;
    tempRecord.status_maxvalue = woStatusData.maxvalue;
    tempRecord.status_description = woStatusData.description;
  }
  try {
    await assignmentDS.save();
    app.toast(app.getLocalizedLabel('accepted_wo', "The assignment has been accepted."), 'success');
  } catch (error) {
    log.t("Assigned", "Failed assignment rejection : work order --> " + ds?.item?.wonum + "--> " + error);
    const message = `Assignment ${ds?.item?.wonum} could not be assigned to you.`;
    app.toast(
      app.getLocalizedLabel(
        'accepted_wo_failure',
        message,
        [ds.item?.wonum]
      ),
    'error');
  }
  await ds.forceReload();
  await listDS.forceReload();
}

/**
 * Marks the status of a work order as "Accepted".
 * @param {Object} app The GlideApplication object
 * @param {Object} page The current page object
 * @param {Object} ds The datasource object
 */
const removeAssigned = async (app, page, ds, showToast = true) => {
  const woStatusData = await SynonymUtil.getSynonym(app.findDatasource('synonymdomainData'), 'ASSTAT', 'ASSTAT|REJECTED');
  const woDetailDs = app.findDatasource("wodetails");
  await woDetailDs.forceReload();
  const records = woDetailDs.item?.assignment ?? [];
  const assignmentLength = records?.length;
  const index = (assignmentLength) ? records?.findIndex(assignment => assignment?.laborcode === app.client?.userInfo?.labor?.laborcode) : 0;

  let tempRecord = woDetailDs.item.assignment[index];
  if (records.length > 0 && tempRecord && woStatusData) {
    tempRecord.status = woStatusData.value;
    tempRecord.valueid = woStatusData.valueid;
    tempRecord.status_maxvalue = woStatusData.maxvalue;
    tempRecord.status_description = woStatusData.description;
    tempRecord.laborcode = null;
    tempRecord.splanreviewdate = null;
  }

  const localPayload = {
    hidewo: 'HIDE',
    href: woDetailDs.item.href,
    assignment: woDetailDs.item.assignment
  };
  const option = {
    responseProperties: "assignment,href",
    localPayload: localPayload,
    // have to add manual action event as in quick work order it's creating new instead 
    // later on more time can be spend to find solution for this but most possibly issue lies at graphite or platform end
    _action: "change"
  };
  const dataToUpdate = {
    assignment: woDetailDs.item.assignment,
    href: woDetailDs.item.href,
    hidewo: 'HIDE',
    // below properties should not be part of original request but found limitation in graphite for bulk put case
    // where it's spreading of payload of child with change and ignoring options
    responseProperties: "assignment,href",
    localPayload: localPayload,
    _action: "change"
  };
  try {
    await woDetailDs.save(dataToUpdate, option);
    /* istanbul ignore next */
    if (showToast) {
      const message = `Assignment ${woDetailDs.item.wonum} was ${(sharedData.clickedUnassignment) ? 'returned' : 'rejected'} and returned to the dispatcher.`;
      app.toast(
        app.getLocalizedLabel(
          (sharedData.clickedUnassignment) ? 'unassigned_wo' : 'rejected_wo',
          message,
          [woDetailDs.item.wonum]
        ),
        'success');
    }
  } catch (error) {
    log.t("Reject", "Failed assignment rejection : work order --> " + woDetailDs.item?.wonum + "--> " + error);
    //istanbul ignore if
    if (showToast) {
      const message = `Assignment ${woDetailDs.item?.wonum} could not be ${(sharedData.clickedUnassignment) ? 'returned' : 'rejected'}. Resync data and try again.`;
      app.toast(
        app.getLocalizedLabel(
          (sharedData.clickedUnassignment) ? 'unassigned_wo_failure' : 'rejected_wo_failure',
          message,
          [woDetailDs.item?.wonum]
        ),
        'error');
    }
  }
}

// Assisted by watsonx Code Assistant 
/**
 * Complete assigned work order.
 * @param {object} app - The application object.
 * @param {object} woDetailDs - The work order detail dataset.
 * @param {object} tempRecord - The temporary record object.
 * @param {object} assignmentDS - The assignment dataset.
 * @returns {Promise<void>} A promise that resolves when the work order is completed.
 */
const completeAssigned = async (app, woDetailDs, tempRecord, assignmentDS) => {
  const compValue = assignmentDS?.items?.find(assignment => assignment.maxvalue === 'COMPLETE' && assignment.defaults);

  tempRecord.status = compValue?.value;
  tempRecord.status_maxvalue = compValue?.maxvalue;
  tempRecord.status_description = compValue?.description;
  tempRecord.finishdate = app.dataFormatter.convertDatetoISO(new Date());//app.dataFormatter.dateWithoutTimeZone(app.dataFormatter.convertDatetoISO(new Date()));

  const localPayload = {
    hidewo: 'HIDE',
    href: woDetailDs.item.href,
    assignment: woDetailDs.item.assignment
  };
  const option = {
    responseProperties: "assignment,href",
    localPayload: localPayload,
    // have to add manual action event as in quick work order it's creating new instead 
    // later on more time can be spend to find solution for this but most possibly issue lies at graphite or platform end
    _action: "change"
  };
  const dataToUpdate = {
    assignment: woDetailDs.item.assignment,
    href: woDetailDs.item.href,
    hidewo: 'HIDE',
    // below properties should not be part of original request but found limitation in graphite for bulk put case
    // where it's spreading of payload of child with change and ignoring options
    responseProperties: "assignment,href",
    localPayload: localPayload,
    _action: "change"
  };
  try {
    await woDetailDs.save(dataToUpdate, option);
    return true;
  } catch (error) {
    log.t("Reassigned", "Failed reassignement : work order --> " + woDetailDs.item?.wonum + "f--> " + error);
    return false;
  }
}

 // Generated by WCA for GP
/**
 * Reset state of Datasource
 */
const _resetDataSource = (ds) =>{
  ds.clearState();
  ds.resetState();
}

/**
 * To filter mobile maxvar for a given varname in order of SITE, ORG, SYSTEM hierarchy
 * @param {varname} of maxvars for mobile
 * @param {defDS} is defaultSetDs - Datasource
 */
const filterMobileMaxvars = (varname, defDS) => {
  const typeHierarchy = ["SITE", "ORG", "SYSTEM"];
  let MaxVar = [];
  // istanbul ignore next
  if (defDS?.items?.length) {
    MaxVar = defDS.items[0]?.mobilemaxvars
      ?.filter((item) => item.varname === varname && typeHierarchy.includes(item.vartype))
      .sort((a, b) => {
        return typeHierarchy.indexOf(a.vartype) - typeHierarchy.indexOf(b.vartype);
      });
  }
  return MaxVar;
}


/**
 * Set throttled function to set Geo state
 * @param {Object} geolocationState object
 */
// istanbul ignore next
const setGeoState = _.throttle((geolocationState) => {
  geolocationState.enabled = !(geolocationState && ((geolocationState.latitude === 0 && geolocationState.longitude === 0) || geolocationState.hasError));
}, 500);

/**
 * Set Enabled or Disabled state based on application geolocation
 * @param {app} app application object
 */
// istanbul ignore next
const setGeoLocationState = (app) => {
  const geolocation = app.geolocation;
  const travelPrompt = +getSystemProp(app, 'mxe.mobile.travel.prompt');
  // istanbul ignore else
  if (geolocation && travelPrompt) {
    geolocation.on("geolocation-updated", () => setGeoState(geolocation.state));
    geolocation.updateGeolocation({enableHighAccuracy: true});
  }
};

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
/**
 * This function takes in an app object and an event object as input, and sets the geolocation state based on the action property of the event object.
 * @param {Object} app - The app object represents the current state of the Alexa skill.
 * @param {Object} event - The event object represents the specific event that triggered the function.
 */
const callGeoLocation = (app, action) => {
  if(action === 'stop' || action === 'pause') {
    setGeoLocationState(app);
  }
}
/**
 * Common Function to open a sliding-drawer dialog to show Work Log for the Work Order at Schedule & WorkOrderDetails Page
 * @param {Application} app The application
 * @param {page} page - page name
 * @param {event} event - event containing information about current item
 * @param {workLogDS} is workLogDS - woDetailsWorklogDs from WorkOrderDetails Page & woWorklogDs from Schedule Page
 * @param {drawerName} is drawer names for WorkOrderDetails & Schedule Page
 */
const openWorkLogDrawer = async (app, page, event, workLogDS, drawerName) => {
  // Initialized Loader on Button when Work Log Drawer Icon Clicked
  page.state.chatLogLoading = true;
  const orgId = app.client?.userInfo?.insertOrg;
  const siteId = app.client?.userInfo?.insertSite;
  //istanbul ignore next
  if (page.name === "schedule") {
    page.state.currentItem = event.item.wonum;
    const wodetails = page.findDatasource("wodetails");
    //istanbul ignore else
    if (!event?.item?.href) {
      page.state.canLoadWoDetails=false;
		}
    page.state.canLoadWoDetailsChilds = false;
    await wodetails.load({ noCache: true, itemUrl: event.item.href });
    page.state.canLoadWoDetailsChilds = true;
    page.state.canLoadWoDetails=true;
  }
  workLogDS.clearState();
  workLogDS.resetState();
  await workLogDS
    .load({
      noCache: true,
      itemUrl: event.item?.href,
    })
    .then((response) => {
      page.state.chatLogGroupData = response;
    });

  // istanbul ignore if
  if (Device.get().isMaximoMobile && workLogDS.options.query.relationship) {
    //Get schema of childdatasource.
    workLogDS.schema =
      workLogDS.dependsOn.schema.properties[
        Object.entries(workLogDS.dependsOn.schema.properties)
          .filter(
            (item) =>
              item[1].relation &&
              item[1].relation.toUpperCase() ===
              workLogDS.options.query.relationship.toUpperCase()
          )
          .map((obj) => obj[0])[0]
      ].items;
  }

  let schemaLogType = workLogDS.getSchemaInfo("logtype");
  let schemaDescription = workLogDS.getSchemaInfo("description");
  let logTypeValue;
  //istanbul ignore else
  if (schemaLogType) {
    logTypeValue = schemaLogType.default?.replace(/!/g, "");
  }
  // Filter Logtype data from synonydomain Datasource which passed in Chat-log Component
  const synonymDs = app.datasources["synonymdomainData"];
  let filteredLogTypeList;
  // Initalized QBE with Org and Site
  synonymDs.clearState();
  await synonymDs.initializeQbe();
  synonymDs.setQBE("domainid", "=", "LOGTYPE");
  synonymDs.setQBE('orgid', orgId);
  synonymDs.setQBE('siteid', siteId);
  filteredLogTypeList = await synonymDs.searchQBE();

  // istanbul ignore if
  if (filteredLogTypeList.length < 1) {
    synonymDs.setQBE('siteid', '=', 'null');
    filteredLogTypeList = await synonymDs.searchQBE(); 
  }

  // istanbul ignore if
  if (filteredLogTypeList.length < 1) {
    synonymDs.setQBE('orgid', '=', 'null');
    filteredLogTypeList = await synonymDs.searchQBE();
  }

  page.state.workLogItem = event.item;
  page.state.defaultLogType = logTypeValue || AppDefaults.get('workLogType');

  const logItem = synonymDs.items.find((item) => {
    return item.value === page.state.defaultLogType && item.defaults;
  });

  const logValue = logItem ? `!${logItem.value}!` : schemaLogType.default;

  page.state.defaultLogType = page.state.initialDefaultLogType = logValue;

  // istanbul ignore else
  if (schemaDescription) {
    page.state.chatLogDescLength = schemaDescription.maxLength;
  }

  // Stop Loading of Chat Log Icon touchpoint once all data loaded
  page.state.chatLogLoading = false;

  // Open Work Log Drawer once all Data Loaded
  page.showDialog(drawerName);
}



/**
 * @description Validate Data Sheet
 * @param {App} app - The app instance
 * @param {Page} page - The current page instance
 * @param {Object} workorder - The current workorder object
 * @param {Object} methodConfig - The method configuration object
 * @returns {Promise<boolean>} A promise that resolves to a boolean value indicating whether the validation was successful or not
 */
const validateDataSheet = async(app, page, workorder, methodConfig = {}, showDialog = true) => {
  const allowedDatasheetStatus = ['PASS', 'FAIL', 'ACTION', 'ADJREQD', 'ADJTOIMP', 'BROKEN', 'INSPECT', 'LIMITEDUSE', 'MISSING', 'OLIM', 'WARNING'];
  app.state.disableToolWarning = false;
  
  const woDetailscalibration = app.findDatasource('woDetailCalibration');
  const pluscWoDs = app.findDatasource("pluscWoDs");
  
  // istanbul ignore else
  if (woDetailscalibration?.item?.wonum !== workorder?.wonum) {
    // Clear and Load WorkOrder to CalibratiowoDetailCalibrationn Datasource
    await woDetailscalibration?.clearState();
    await woDetailscalibration?.load({noCache:true, itemUrl: workorder.href});
  
    // After load work order details, clear and load child datasheets too
    await pluscWoDs?.clearState();
    await pluscWoDs.load();
  }

  // Validate Incomplete Datasheet
  let anyDataSheetSuccess = false;
  const incompleteDatasheet = pluscWoDs?.items.filter((datasheet) => {
    let allDynamicChecksEntered = true;
    const { pluscwodsinstr = [] } = datasheet;
    for (const instr of pluscwodsinstr) {
      const { pluscwodspoint = [], caldynamic } = instr;
      if (!caldynamic) {
        continue
      }
      if (!allDynamicChecksEntered) {
        break;
      }
      for (const point of pluscwodspoint) {
        allDynamicChecksEntered = (!point.asfoundinput || !point.asleftinput) ? false : true;
        if (!allDynamicChecksEntered) {
          break;
        }
      }
    }
    // istanbul ignore else
    if (datasheet?.required && (!datasheet?.asfoundcalstatus || !datasheet?.asleftcalstatus || !allDynamicChecksEntered)) {
      return true;
    } else {
      if (datasheet?.required && allowedDatasheetStatus.includes(datasheet.asfoundcalstatus) && allowedDatasheetStatus.includes(datasheet.asleftcalstatus)) {
        anyDataSheetSuccess = true;
      }
      return false;
    }
  });

  app.state.disableToolWarning = !anyDataSheetSuccess;

  // Open Warning if Datasheet Incomplete
  // istanbul ignore next
  if (incompleteDatasheet?.length) {
    // Set Parameter for Calibration Operations
    app.state.calibParameter = { app: app, page: page, workorder: workorder, ...methodConfig};
    // Show Datasheet Warning Dialog
    // istanbul ignore next
    if (showDialog) {
      app.showDialog('dataSheetWarnings');
    }
  return false;  
  }
  
  return true;
}


/**
 * @description Validate actual tools availability
 * @param {object} app - The app object
 * @param {object} page - The current page object
 * @param {object} workorder - The current workorder object
 * @param {object} methodConfig - The method configuration object
 * @returns {boolean} - True if validation passes, false otherwise
*/
const validateActualTools = async(app, page, workorder, methodConfig = {}, showDialog = true) => {
  // Validate Tools
  // istanbul ignore else
  if (workorder?.pluscvaltool === '0' || workorder?.actualtoolcount > 0) {
    return true;  
  }

  // Set Parameter for Calibration Operations
  app.state.calibParameter = { app: app, page: page, workorder: workorder, ...methodConfig};
  // Show Tool Warning 
  // istanbul ignore next
  if (showDialog) {
    if (workorder?.pluscvaltool === '1') {
      app.showDialog('toolsWarnings');
    } else {
      app.showDialog('toolsError');
    }  
  }
  return false;
}

// Assisted by watsonx Code Assistant 
/**
 * Returns the confirm dialog label.
 * @param {object} app - The application object.
 * @param {object} config - The configuration object.
 * @param {array} dynamicLabel - The dynamic label array.
 */
const getConfirmDialogLabel = (app, config, dynamicLabel = []) => {
  app.state.confirmDialog = {
    title: config.title ? app.getLocalizedLabel(config.title.label, config.title.value) : '',
    label1: config.confirmDialogLabel1 ? app.getLocalizedLabel(config.confirmDialogLabel1.label, config.confirmDialogLabel1.value) : '',
    label2: config.confirmDialogLabel2 ? app.getLocalizedLabel(config.confirmDialogLabel2.label, config.confirmDialogLabel2.value, dynamicLabel) : '',
    acceptButton: config.confirmDialogAcceptButton ? app.getLocalizedLabel(config.confirmDialogAcceptButton.label, config.confirmDialogAcceptButton.value) : '',
    acceptIcon: config.confirmDialogAcceptIcon || '',
    acceptKind: config.confirmDialogAcceptKind || 'Primary',
    rejectIcon: config.confirmDialogRejectIcon || '',
    rejectButton: config.confirmDialogRejectButton ? app.getLocalizedLabel(config.confirmDialogRejectButton.label, config.confirmDialogRejectButton.value) : '',
    onPrimaryClick: config.onPrimaryClick,
    onSecondaryClick: config.onSecondaryClick,
    onCloseClick: config.onCloseClick
  }
  sharedData.showConfirmDialog = true;
}

const clearSharedData = (propertyName) => {
  if(sharedData[propertyName]) {
    delete sharedData[propertyName];
  }
}

// Assisted by watsonx Code Assistant 
/**
 * Get the spatial reference of the basemap.
 * @param {object} app - The application object.
 * @returns {string} The spatial reference of the basemap.
 */
/* istanbul ignore next */
const getBasemapSpatialReference = async (app) => {
  const preloadAPI = new MapPreLoadAPI();

  try {
      // Load map configuration and layers
      const mapConfiguration = await preloadAPI.loadMapConfiguration(app);
      const layers = await preloadAPI.loadLayers(mapConfiguration, app);
      // istanbul ignore else
      if (!layers || layers.length === 0) {
          return null;
      }

      // Enable token for the first layer and get base map info
      const baseMapInfo = await preloadAPI.getBaseMapInfo(layers[0], app);
      // istanbul ignore else
      if (!baseMapInfo) {
          return null;
      }

      // Determine the spatial reference
      let basemapSpatialReference = baseMapInfo.spatialReference;
      // istanbul ignore else
      if (baseMapInfo.type === "indexedVector" && baseMapInfo.tileInfo?.spatialReference) {
          basemapSpatialReference = baseMapInfo.tileInfo.spatialReference;
      }

      const { wkid, wkt, latestWkid } = basemapSpatialReference || {};

      // Register and return spatial reference based on WKID
      // istanbul ignore else
      if (wkid) {
          const { spatialReferences = [] } = mapConfiguration;
          const spatialReference = spatialReferences.find(ref => ref.wkid === wkid);
          // istanbul ignore else
          if(spatialReference){
            MapPreLoadAPI.registerSpatialReference(spatialReference);
          }
          return latestWkid ? `EPSG:${latestWkid}` : `EPSG:${wkid}`;
      }

      // Handle custom spatial reference (WKT-based)
      // istanbul ignore else
      if (wkt) {
          const projCode = "EPSG:BASEMAP";
          const baseMapCustomSR = {
              wkid: projCode,
              definition: wkt
          };
          MapPreLoadAPI.registerSpatialReference(baseMapCustomSR);
          return projCode;
      }

      return null;

  } catch (error) {
      log.t('getBasemapSpatialReference: ', error);
      return null;
  }
};

// Assisted by watsonx Code Assistant 
/**
 * Allow return button if owner of work order is labor only
 * @param {object} app - The application object.
 * @returns {Promise<void>} - A promise that resolves when the function is complete.
 */
const showReturn = async(app, woDetailDs) => {
  let canReturn = true;
  const assignmentDS = woDetailDs.getChildDatasource('assignment',woDetailDs.item);
  const records = await assignmentDS?.load();
  const index = records?.findIndex(assignment => assignment?.laborcode === app.client?.userInfo?.labor?.laborcode);
  const laborDsSingle = app.findDatasource('laborDsSingle');
  await laborDsSingle.initializeQbe();
  laborDsSingle.clearState();
  if(index < 0) {
    canReturn =  false;
    laborDsSingle.clearQBE();
    await laborDsSingle.searchQBE(undefined, true);
  } else {
    // if we foud assignment first get all labor records matching craft and skill
    // need to do as we don't have data available in labor DS
    const craftrateDs = app.findDatasource('craftrate');
    await craftrateDs.initializeQbe();
    craftrateDs.setQBE('craft', records[index].craft);
    craftrateDs.setQBE('skillleveldata', records[index].skilllevel);
    const filterdLabors = await craftrateDs.searchQBE();
    const laborCodes = filterdLabors.map(item => item.laborcode);

    // get all labor with QBE of matching labor records from above
    laborDsSingle.setQBE('laborcode', 'in', laborCodes);
    await laborDsSingle.searchQBE();
  }
  app.state.canReturn = canReturn;
  return canReturn;
}

// Assisted by watsonx Code Assistant 
/**
 * Check if a value is a valid latitude or longitude.
 * @param {number} value - The value to check.
 * @returns {boolean} - True if the value is a valid latitude or longitude, false otherwise.
 */
const isLatOrLong = (coordinate) => {
  const value = coordinate && Number(coordinate);
  return typeof value === 'number' && ((value >= -90 && value <= 90) || (value >= -180 && value <= 180));
}

// use below variable to share data app wide, note it's const so you can push key name but don't redeclare it
const sharedData = {
  reassignDialogConfig : {
      title: {
        label: 'reassignDialogTitle',
        value : 'Reassign or unassign'
      },
      confirmDialogLabel1: {
        label: 'reassignDialogLabel',
        value : 'The accepted assignment can be reassigned to other technician or Unassigned. Would you like to Unassign the assignment or reassign to other?'
      },
      confirmDialogAcceptButton: {
        label: 'reassignDialogButton',
        value : 'Reassign'
      },
      confirmDialogRejectButton: {
        label: 'unassignDialogButton',
        value : 'Unassign'
      },
      confirmDialogAcceptKind: 'primary',
      confirmDialogAcceptIcon: 'maximo:reassign',
      confirmDialogRejectIcon: 'carbon:study--previous',
      //reassign button is primary button here
      onPrimaryClick: async (app) => {
        // different page have different code requirement due to loader
        if (sharedData.allowReassignmentPage.name === "schedule" || sharedData.allowReassignmentPage.name === "approvals") {
          sharedData.allowReassignmentPage.callController("openReassignmentDrawer", sharedData.event);
        } else {
          sharedData.allowReassignmentPage.callController("openReassignmentDrawer");
        }
      },
      //unassign button is secondary button here
      onSecondaryClick: () => {
        sharedData.allowReassignmentPage.callController("unassignment",sharedData.event);
      },
       //unassign button is secondary button here
       onCloseClick: () => {
        sharedData.clickedUnassignment = false;
        clearSharedData(sharedData?.allowReassignmentPage);
        clearSharedData(sharedData?.event);
      },
  },
  isCardOpen: false,
  shouldReloadDatasource: false,
  basemapSpatialReference: null,
  prop1: 'value1',
  clickedWo: false
}


/**
 * Drills into classification hierarchy by querying child classifications for work orders.
 * Handles both Mobile and Web environments with platform-specific queries.
 * 
 * @async
 * @param {Object} app - Application instance
 * @param {Object} [item] - Parent classification item. If null, fetches root-level items
 * @param {string} item.classstructureid - Parent classification ID
 * @returns {Promise<void>}
 */
const drillInClassification = async (app, item) => {
  const workOrderClassDomainLookupDS = app.findDatasource("workOrderClassDomain");
  await workOrderClassDomainLookupDS.initializeQbe();
  if (workOrderClassDomainLookupDS.lastQuery) {
    workOrderClassDomainLookupDS.lastQuery.searchText = "";
  }
  if (Device.get().isMaximoMobile) {
    workOrderClassDomainLookupDS.setQBE('usewithworkorder', true);
    if (item) {
      workOrderClassDomainLookupDS.setQBE("parent", "=", item.classstructureid);
    } else {
      workOrderClassDomainLookupDS.setQBE("parent", "!=", "*");
    }
  } else {
    workOrderClassDomainLookupDS.setQBE('classusewith.objectname', '=', 'WORKORDER');
    workOrderClassDomainLookupDS.setQBE("parent", "=", item?.classstructureid || "null");
  }
  await workOrderClassDomainLookupDS.searchQBE();
}

const functions = {
    getSystemProp,
    checkSystemProp,
    checkSysPropArrExist,
    getOfflineStatusList,
    getOfflineAllowedStatusList,
    isAllowedStatus,
    checkEsigRequired,
    getTravelSystemProperties,
    checkScanRequired,
    canInteractWorkOrder,
    markStatusAssigned,
    removeAssigned,
    _resetDataSource,
    filterMobileMaxvars,
    setGeoLocationState,
    openWorkLogDrawer,
    validateDataSheet,
    validateActualTools,
    callGeoLocation,
    getConfirmDialogLabel,
    clearSharedData,
    getBasemapSpatialReference,
    showReturn,
    completeAssigned,
    isLatOrLong,
    sharedData,
    drillInClassification
};
  
export default functions;
  