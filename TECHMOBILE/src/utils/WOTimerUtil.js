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
import { OpenLayersAdapter } from '@maximo/map-component';
import SynonymUtil from './SynonymUtil';
import WOUtil from './WOUtil';
import CommonUtil from "./CommonUtil";

const TAG = 'WOTimerUtil';

/**
 * Called when timer is already started but not stopped, and the user is directly trying to complete the WO.
 * @param {Application} app application object.
 * @param {Object} activeLabTran object.
 * @param {Datasource} laborDS  labor detail datasource.
 */
const stopWorkOnStatusComp = async (app, activeLabTran, laborDS) => {

  const currentDateString = app.dataFormatter.currentUserDateTime();

  activeLabTran[0].finishdatetime = removeSecondsFromTimeString(currentDateString);
  activeLabTran[0].finishdate = app.dataFormatter.dateWithoutTimeZone(currentDateString);
  activeLabTran[0].finishtime = removeSecondsFromTimeString(app.dataFormatter.dateWithoutTimeZone(currentDateString));

  activeLabTran[0].starttime = removeSecondsFromTimeString(activeLabTran[0].starttime);
  activeLabTran[0].startdatetime = removeSecondsFromTimeString(activeLabTran[0].startdatetime);

  try {
    await laborDS.save();
  } catch (error) {
    //istanbul ignore next
    log.t(TAG, error);
  }
}

/**
 * Show/hide Start, Pause & Stop button on workorder list page. 
 * @param {item} item
 * @return {hideStartButton} bool value to hideStartButton 
 */
const computedTimerStatus = (item, labor) => {
  let hideStartButton = false;
  if (item?.labtrans?.length > 0) {
    hideStartButton = item.labtrans.some((member) => (member.timerstatus_maxvalue === "ACTIVE" && member.laborcode === labor));
    hideStartButton = !!hideStartButton;
  }
  return hideStartButton;
};

/**
 * Remove seconds from time
 * @param {String} timeString String
 * @return {String} string removed seconds part from time
 */
const removeSecondsFromTimeString = (timeString) => {
  let newTime = timeString;
  if (timeString) {
    if (timeString.length === 8) {    // for hh:mm:ss
      newTime = timeString.substring(0, 6) + '00';
    }
    else if (timeString.length === 19) {  // for yyyy-MM-ddThh:mm:ss
      newTime = timeString.substring(0, 17) + '00';
    }
    else if (timeString.length === 25) {  // for yyyy-MM-ddThh:mm:ss+00:00"
      newTime = timeString.substring(0, 17) + '00' + timeString.substring(19);
    }
  }

  return newTime;
}

/**
 * Show confirm dialog for labor trans. 
 * @param {Application} app application object
 * @param {Datasource} laborDS labor detail datasource
 * @param {String} timerstatusActive synonym of active for timerstatus
 * @param {String} dialogName dialog name
 * @param {String} action Type of action pause, start, stop etc..
 * @param {String} actionType Action Type
 */
const openConFirmLabTimeDialog = async (app, page, laborDS, action, dialogName, actionType) => {
  // show dialog
  const labor = app.client.userInfo.labor.laborcode;
  const current = new Date();
  
  current.setSeconds(0);
  
  const synonymDS = app.findDatasource('synonymdomainData');
  const timerstatusActive = await SynonymUtil.getSynonym(synonymDS, 'TIMERSTATUS', 'TIMERSTATUS|ACTIVE');
  const timerstatusComplete = await SynonymUtil.getSynonym(synonymDS, 'TIMERSTATUS', 'TIMERSTATUS|COMPLETE');

  if (timerstatusActive && timerstatusComplete) {
    // load active labtrans
    await laborDS.initializeQbe();
    laborDS.setQBE('timerstatus', '=', timerstatusActive.value);
    laborDS.setQBE('laborcode', '=', labor);
    await laborDS.searchQBE(undefined, true);

    const startDateTime = removeSecondsFromTimeString(laborDS.item.startdatetime);
    const startDateTimeMoment = app.dataFormatter.convertISOtoDate(startDateTime);
    const regularHrs = laborDS.item.regularhrs || Math.abs((current - startDateTimeMoment)) / 3600000;

    const currentDateString = app.dataFormatter.convertDatetoISO(current);

    // set start date and time
    laborDS.item.startdate = app.dataFormatter.dateWithoutTimeZone(laborDS.item.startdate);
    laborDS.item.starttime = app.dataFormatter.dateWithoutTimeZone(removeSecondsFromTimeString(laborDS.item.starttime));
    laborDS.item.startdatetime = removeSecondsFromTimeString(laborDS.item.startdatetime); // DT246361
    // set finish time
    laborDS.item.finishdatetime = currentDateString;
    laborDS.item.finishdate = app.dataFormatter.dateWithoutTimeZone(currentDateString);
    laborDS.item.finishtime = app.dataFormatter.dateWithoutTimeZone(currentDateString);

    laborDS.item.regularhrs = regularHrs;
    laborDS.item.timerstatus = timerstatusComplete.value;
    laborDS.item.timerstatus_maxvalue = timerstatusComplete.maxvalue;

    page.state.woaction = action;
    page.state.woactionType = actionType;
    app.showDialog(dialogName);
  }
  else {
    app.toast(
      app.getLocalizedLabel(
        'fail_get_synonym',
        `Can not get the synonym data for TIMERSTATUS`,
        ['TIMERSTATUS']
      ),
      'error'
    );
  }
};

/**
 * Function to check if there is an active work order timer
 * 
 * @returns {boolean} - True if there is no active work order timer, false otherwise
 */
const validateActiveTimer = async(app, labor, detailDS) => {
  const allowMultiTimerSysProp = app.state?.systemProp?.["maximo.mobile.allowmultipletimers"];
  if (allowMultiTimerSysProp === "0") {
    return await findRunningWorkOrder(app, labor, detailDS);
  } else {
    return true;
  }
}

// Assisted by watsonx Code Assistant 
/**
 * Check if there is a running timer for the current work order.
 * @param {object} app - The application object.
 * @param {object} page - The page object.
 * @param {object} event - The event object.
 * @param {object} laborDS - The labor data source object.
 * @param {string} transtype - The transaction type.
 * @param {string} transtypeDescription - The transaction type description.
 * @param {object} labor - The labor object.
 * @param {object} detailDS - The detail data source object.
 * @returns {Promise<boolean>} A promise that resolves to a boolean value indicating if there is a running timer.
 */
//istanbul ignore next
const checkAllRunningTimer = async(app, page, event, laborDS, transtype, transtypeDescription, labor, detailDS) => {
  const stopRunningTimerSysProp = app.state?.systemProp?.["maximo.mobile.allowmultipletimers"];
  let wostring = "";
  let lastWO = "";
  // multiple timer allowed no need to check further
  if(stopRunningTimerSysProp === "1") {
    return false;
  }
  const searchText = await resetDatasource(app);
  const runningTimer = await findRunningWorkOrder(app, labor, detailDS, false);
  if (!!searchText) {
    await resetDatasource(app, searchText);
  }
  if(runningTimer.length === 1) {
    const wostring = [`${(runningTimer[0].worktype || '')} ${runningTimer[0].computedWorkTitle}`, `${(event.item.worktype || '')} ${event.item.wonum} ${event.item.description}`]
    const config = {
      title: {
        label: 'confirmDialogTitle',
        value : 'Confirmation'
      },
      confirmDialogLabel1: {
        label: 'confirmDialogLabel1',
        value : 'Do you want to stop timer?'
      },
      confirmDialogLabel2: {
        label: 'confirmDialogLabel2',
        value :'Select Yes to stop the timer for work order {0} and start the timer for work order {1}.'
      },
      confirmDialogAcceptButton: {
        label: 'confirmDialogAcceptButton',
        value : 'Yes'
      },
      confirmDialogAcceptKind: 'secondary',
      confirmDialogRejectButton: {
        label: 'confirmDialogRejectButton',
        value : 'No'
      },
      onPrimaryClick: async (app) => {
        app.state.showLoaderOnAllWO = true;
        const workorder = {
          item: runningTimer[0],
          datasource: 'wodetails',
          action: "stop",
          worktype: "work"
        }
        CommonUtil.sharedData.stopEvent = {app, page, event, detailDS, laborDS, transtype, transtypeDescription}
        const workOrderList = (app.findPage("schedule")) ? app.findPage("schedule") : app.findPage("approvals");
        if (workOrderList) {
          await workOrderList.callController("startStopTimer", workorder);
        }
      },
      onSecondaryClick: (app) => {
        resetSharedConfirmationVariable(app);
      },
      onCloseClick: (app) => {
        resetSharedConfirmationVariable(app);
      },
    }
    // below line is to allow this whole config to be overrided by client if required.
    const dialogConfig = CommonUtil.sharedData?.dialogConfig ?? wostring;
    CommonUtil.getConfirmDialogLabel(app, config, dialogConfig);
    app.showDialog('confirmDialog');
    return runningTimer;
  } else if(runningTimer.length > 1) {
    runningTimer.forEach((wo, index) => {
      if(index < runningTimer.length-1) {
        wostring += `${(wo.worktype || '')} ${wo.computedWorkTitle}`;
        if(index !== runningTimer.length - 2) {
          wostring += ', ';
        }
      }
      if((runningTimer.length - 1) === index) {
        lastWO = `${(wo.worktype || '')} ${wo.computedWorkTitle}`;
      }
    })
    const message =  `The timers for ${wostring} and ${lastWO} are running. Stop or pause all work to start a new work order.`;
    app.toast(
      app.getLocalizedLabel(
        'activeTimer',
        message,
        [wostring, lastWO]
      ),
      "warning",
      undefined,
      undefined,
      false
    );
    resetSharedConfirmationVariable(app);
    if (CommonUtil.sharedData.isCardOpen) {
      CommonUtil.sharedData.shouldReloadDatasource = true;
      await resetDatasource(app, event.item.href);
    }
    return runningTimer;
  } else {
    return false;
  }
}

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-8b-code-instruct
/**
 * Resets the shared confirmation variable.
 * @param {Object} app - The application object.
 */
const resetSharedConfirmationVariable = (app) => {

  const detailsPage = app.findPage('workOrderDetails');
  if(detailsPage && CommonUtil.sharedData.showConfirmDialog) {
    detailsPage.state.transactionProgress = detailsPage.state.workloading =detailsPage.state.loading = false;
  }
  app.state.showLoaderOnAllWO = false;
  CommonUtil.sharedData.originalEvent = undefined;
  CommonUtil.sharedData.showConfirmDialog = false;
  const schPage = app.findPage("schedule") ||  app.findPage("approvals");
  if(schPage) {
    app.state.showLoaderOnAllWO = schPage.state.workloading = schPage.state.transactionProgress = false;
  }
}

// Assisted by watsonx Code Assistant 
/**
 * Find running work order
 * @param {object} app - Application object
 * @param {string} labor - Labor code
 * @param {object} detailDS - Detail data source
 * @param {boolean} shouldBreak - Should break flag
 * @returns {boolean|object} Returns true if no active work order timer, otherwise returns an array of active work order items
 */
const findRunningWorkOrder = async(app, labor, detailDS, shouldBreak = true) => {
  const schPage = app?.findPage("schedule") ||  app?.findPage("approvals");
  let allWODS = schPage?.findDatasource(schPage.state.selectedDS).items || detailDS?.items || [];
  let anyActiveWoTimer = false;
  let activeTimer = [];
  for (let i = 0; i < allWODS?.length; i ++) {
    let woItem = allWODS[i];
    if (woItem?.labtrans) {
      const labtransItem = woItem.labtrans;
      anyActiveWoTimer = labtransItem?.some((item) => (item.timerstatus_maxvalue === 'ACTIVE' && (labor === item.laborcode)));
      //istanbul ignore next
      if (anyActiveWoTimer && shouldBreak) {
        break;
      } else if(anyActiveWoTimer && !shouldBreak){
        activeTimer.push(woItem);
      }
    }
  }
  return (shouldBreak) ? !anyActiveWoTimer : activeTimer;   
}

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
/**
* Returns the datasource containing the timer detail information.
* @param {WOComponent} page The current page object.
* @returns {WODataSource} The datasource containing the timer detail information.
*/
const getLabTransDS = (page) => {
  return (
    page?.findDatasource("reportworkLaborDetailds") ||
    page?.findDatasource("woLaborDetailds") ||
    page?.findDatasource("woLaborDetaildsOnSchedule")
  );
};
  

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
/**
 * Delete a timer entry.
 * @param {Object} app The app object.
 * @param {Object} page The page object.
 */
const deleteTimerEntry = async (app, page) => {
  page.state.workloading = true;
  let errorOccured = false;
  const labTransDS = getLabTransDS(page);
  const wonum = page.state.currentItem || page.state.wonum;
  const transtype = labTransDS.items[0]?.transtype === 'TRAV'; 

  const option = {
    localPayload: {
      href: labTransDS.item.href,
    },
  };
  const handleSuccess = async () => {
    const schPage = app.findPage("schedule");
    // istanbul ignore else
    if (page.name === "report_work") {
      await labTransDS.initializeQbe();
      await labTransDS.searchQBE(undefined, true);
      page.findDialog("reportTimeDrawer").closeDialog();
    } else if (page.name === "schedule") {
      const schedulePage = app.findDatasource(schPage.state.selectedDS);
      await schedulePage.forceReload();
    } else if (page.name === "workOrderDetails") {
      const woDetailResource = page.findDatasource("woDetailResource");
      await woDetailResource.load();
    }
  };

  try {
    await labTransDS.deleteItem(labTransDS.items[0], option);
    await handleSuccess();
  } catch (error) {
    errorOccured = true;
    log.t(TAG, error);
  } finally {
    let msg = transtype ?  "Travel time was deleted." :`The labor entry for work order ${wonum} was deleted.`;
    let type = "success";
    if (errorOccured) {
      msg = transtype ? "Travel time was not deleted." : `The labor entry for work order ${wonum} was not deleted.`;
      type = "error";
    }
    app.state.showLoaderOnAllWO = page.state.workloading = false;
    app.toast(app.getLocalizedLabel("request_reject_success", msg), type);

    app.state.showLoaderOnAllWO = false;
    if(type === "success" && CommonUtil.sharedData.originalEvent) {
      const {app, page, event, detailDS, laborDS, transtype, transtypeDescription} = CommonUtil.sharedData.originalEvent;
      CommonUtil.sharedData.showConfirmDialog = true;
      CommonUtil.sharedData.fromDeleteEntry = true;
      await startStopTimer(app, page, event, detailDS, laborDS, transtype, transtypeDescription);
    }
    CommonUtil.sharedData.showConfirmDialog = false;
    CommonUtil.sharedData.fromDeleteEntry = false;
    resetSharedConfirmationVariable(app);
  }
};

/**
 * Start or stop timer for specific workorder.
 * check if any running work order if useMultiple timer is disabled and show user to stop running work order
 * @param {Application} app application object
 * @param {Object} event work order object for starting or stoping timer.
 * @param {Datasource} detailDS work order detail datasource
 * @param {Datasource} laborDS labor detail datasource
 * @param {String} transtype trans type for labor trans.
 */
const startStopTimer = async (app, page, event, detailDS, laborDS, transtype, transtypeDescription) => {
  const schPage = app.findPage("schedule") ||  app.findPage("approvals");
  
  const labor = app.client.userInfo.labor.laborcode;
  const synonymdomainData = app.findDatasource('synonymdomainData');
  const current = new Date();  
  let methodAction;
  let localPayload;  
  let useTimerSystemProp = app.state?.systemProp?.["maximo.mobile.usetimer"];
  let hazardReviewedReq = app.state?.systemProp?.["maximo.mobile.safetyplan.review"];
  let label = app.getLocalizedLabel('safetyplanreview', 'You must review the safety plan before you start work.');
  let isInProgressAllowed = false;
  const currentDateString = app.dataFormatter.convertDatetoISO(current);

  // if confirm dialog isn't showm or user timer is disabled and event is start check for any running work order
  if(!CommonUtil.sharedData.showConfirmDialog && event.action === 'start' && useTimerSystemProp === '1') {
    const shouldReturn = await checkAllRunningTimer(app, page, event, laborDS, transtype, transtypeDescription, labor, detailDS);
    CommonUtil.sharedData.originalEvent = {app, page, event, detailDS, laborDS, transtype, transtypeDescription};
    // stop execution if any running work order found
    // istanbul ignore next
    if(shouldReturn) {
      return;
    }
  } else if (CommonUtil.sharedData.showConfirmDialog && event.action === 'start') {
    event = CommonUtil.sharedData.originalEvent.event;
  }

  const statusArr = await CommonUtil.getOfflineAllowedStatusList(app, event, false);
  page.state.transactionProgress = false;
  const isValidActiveTimer = await validateActiveTimer(app, labor, detailDS);
  
  // istanbul ignore else
  if (statusArr) {
    isInProgressAllowed = statusArr.filter(statValue => {
      return statValue.maxvalue === "INPRG";
    }).length > 0;
  }
  
  // If condition verify if barcode scanning mandatory for the work order start action
  if (
    event.action === 'start' && 
    page.state.enforceAssetScan === 1 && 
    isInProgressAllowed && 
    isValidActiveTimer && 
    event.worktype !== 'travel' && 
    event.item.starttimerinprg === '1' && 
    event.item.status_maxvalue === 'APPR' &&
    !app.state.disableScan && 
    event.item.assetnum
  )
  {
    const isScanRequired = await CommonUtil.checkScanRequired('INPRG');
    // istanbul ignore else
    if (isScanRequired) {
      const scanResParam = { scanValue: null, assetnum: event.item.assetnum, locationnum: event.item.locationnum, status: 'INPRG' };
      app.state.scanParameter = { app:app, page:page, event:event, detailDS:detailDS, laborDS:laborDS, transtype:transtype, transtypeDescription:transtypeDescription, method:"startStopTimer", scanResParam: scanResParam };
      app.showDialog("appAssetScanDialog");
      return;
    }
  }
  app.state.disableScan = false;

  // istanbul ignore else
  if (app.state.skipScan) {
    app.state.skipScan = false;
    const message = app.getLocalizedLabel('worklog_woStarted_without_scan', 'The work order was started without scanning an asset.');
    await page.callController('saveWorkLog', {
      longDescription: "",
      summary: message,
      visibility: true
    }, true);
  }
  const splanreviewdate = WOUtil.isSafetyPlanReviewed(app?.findDatasource('woDetailds')?.item, app?.client?.userInfo?.personid);
  //Open wohazard if not reviewed
  // istanbul ignore else
  if (event.action === 'start' && event.worktype === 'work' && event.item.wohazardcount > 0 && splanreviewdate && hazardReviewedReq === '1') {      
    app.toast(label, 'error', null, null, false);
    WOUtil.openWOHazardDrawer(app, page, event, page.name === "schedule"? "slidingwohazard" : "wohazardDrawer");
    app.state.showLoaderOnAllWO = page.state.workloading = page.state.transactionProgress = false;
    return;
  }  
  //Only change the WO status to INPRG without timer starts
  // istanbul ignore else
  if (event.action === 'start' && isInProgressAllowed && (useTimerSystemProp && useTimerSystemProp === '0')) {
    page.state.workloading = true;
    const woStatusData = await SynonymUtil.getSynonymDomain(synonymdomainData, 'WOSTATUS', 'INPRG');
    let option = {
      record: event.item,
      parameters: {
        status: woStatusData.value,
        date: currentDateString
      },
      responseProperties: 'status,status_description,status_maxvalue',
      localPayload: {
        status: woStatusData.value,
        status_maxvalue: woStatusData.maxvalue,
        status_description: woStatusData.description
      },
      query: {interactive: false},
      esigCheck: 0
    };
    const esigCheck = app.state?.systemProp?.["maximo.mobile.wostatusforesig"];
    const allowedSignature = esigCheck
      .split(',')
      .map((status) => status.trim());
    const addEsig = allowedSignature.length > 0 &&
    allowedSignature.indexOf(woStatusData.value) > -1;
    // istanbul ignore next
    if (addEsig) {
      option.esigCheck = 1;
    }
    // istanbul ignore if
    if (woStatusData && event.item.woactivity && Device.get().isMaximoMobile) {
      page.state.selectedStatus = woStatusData.value;
      page.state.selectedStatusMaxValue = woStatusData.maxvalue;
      page.state.selectedStatusDescription = woStatusData.description;
      let woTasks = await app.controllers[0]?.getWoActivity(page, app, event.item);
      option.localPayload["woactivity"] = woTasks;
    }
    await detailDS.invokeAction('changeStatus', option);
    page.state.workloading = page.state.transactionProgress = false;
    await detailDS.forceReload();
  }

  //Only start the timer when useTimerSystemProp = 1
  // istanbul ignore else
  if (useTimerSystemProp && useTimerSystemProp === '1') {
    page.state.workloading = true;
    
    let option = {
      objectStructure: `${app.state.woOSName}`,
      parameters: {
        labtrans: {
          transtype: transtype,
          laborcode: labor
        }
      },
      record: event.item,
      responseProperties: 'wonum,status,status_description,status_maxvalue,labtrans{timerstatus,anywhererefid}',
    }

    current.setSeconds(0);    
    
    if (event.action === 'start') {
      // istanbul ignore next
      if (!isValidActiveTimer) {
        app.toast(
          app.getLocalizedLabel(
            'timer_started',
            `Timer already started`
          ),
          'error'
        );
        
        page.state.workloading = page.state.transactionProgress = false;
        if (CommonUtil.sharedData.isCardOpen) {
          CommonUtil.sharedData.shouldReloadDatasource = true;
          await resetDatasource(app, event.item.href);
        }
        return;
      }

      methodAction = 'startTimerStartDate';
      let personInfo = app.client.userInfo;
      let craft = personInfo.labor.laborcraftrate.craft;
      
      let laborDs = app.findDatasource("laborDs");
      // istanbul ignore else
      if (Device.get().isMaximoMobile) {
        await laborDs?.initializeQbe();
        laborDs?.setQBE('laborcode', '=', personInfo.labor.laborcode);
        laborDs?.setQBE('orgid', '=', app.client.userInfo.defaultOrg);
        await laborDs?.searchQBE();
        laborDs = laborDs?.item?.laborcraftrate?.filter(craft => craft.defaultcraft);
      }

      const statusData = await SynonymUtil.getSynonym(synonymdomainData, 'TIMERSTATUS', 'TIMERSTATUS|ACTIVE');
      if (statusData) {
        let anywhererefid = new Date().getTime();
        localPayload = {
          labtrans: [{
            laborcode: labor,
            timerstatus: statusData.value,
            timerstatus_maxvalue: statusData.maxvalue,
            startdatetime: currentDateString,
            startdate: app.dataFormatter.dateWithoutTimeZone(currentDateString),
            starttime: removeSecondsFromTimeString(app.dataFormatter.dateWithoutTimeZone(currentDateString)),
            transtype: transtype,
            transtype_description: transtypeDescription,
            regularhrs: 0,
            anywhererefid: anywhererefid,
            displayname: app.client.userInfo.displayname,
            craftdescription: craft
          }],
          href: event.item.href
        };

        // istanbul ignore else
        if (Device.get().isMaximoMobile) {
          let labtrans = localPayload.labtrans[0];
          labtrans.contractnum = laborDs?.[0]?.contractnum;
          labtrans.skilllevel = laborDs?.[0]?.skilllevel;
          labtrans.vendor = laborDs?.[0]?.vendor
        }

        //Update WO status in offline
        // istanbul ignore next
        if (!event.item.starttimerinprg && Device.get().isMaximoMobile) {
          event.item.starttimerinprg = CommonUtil.filterMobileMaxvars('STARTTIMERINPRG', app.findDatasource('defaultSetDs'))[0]?.varvalue;
        }
        // istanbul ignore else
        if (event.item.starttimerinprg === '1' && event.item.status_maxvalue === 'APPR') {
          
          // istanbul ignore if
          if (event.worktype === 'work' && isInProgressAllowed && event.item.wohazardcount > 0 && splanreviewdate && hazardReviewedReq === '1') {            
            app.toast(label, 'error', null, null, false);
            WOUtil.openWOHazardDrawer(app, page, event, page.name === "schedule"? "slidingwohazard" : "wohazardDrawer");
            page.state.workloading = page.state.transactionProgress = false;
            return;
          }

          const woStatusData = await SynonymUtil.getSynonym(synonymdomainData, 'WOSTATUS', 'WOSTATUS|INPRG');
          // istanbul ignore if
          if (woStatusData) {
            localPayload.status = woStatusData.value;
            localPayload.status_description = woStatusData.description;
            localPayload.status_maxvalue = woStatusData.maxvalue;
          }
          // istanbul ignore if
          if (woStatusData && event.item.woactivity && Device.get().isMaximoMobile) {
            page.state.selectedStatus = woStatusData.value;
            page.state.selectedStatusMaxValue = woStatusData.maxvalue;
            page.state.selectedStatusDescription = woStatusData.description;
            let woTasks = await app.controllers[0].getWoActivity(page, app, event.item);
            localPayload.woactivity = woTasks;
          }
        }
  
        option.parameters.startDateTime = currentDateString;
        option.parameters.anywhererefid = anywhererefid;
        option.parameters.transtype = transtype;
        option.localPayload = localPayload;
  
      }
      else {
        page.state.workloading = page.state.transactionProgress = false;;
        app.toast(
          app.getLocalizedLabel(
            'fail_get_synonym',
            `Can not get the synonym data for TIMERSTATUS`,
            ['TIMERSTATUS']
          ),
          'error'
        );
      }
    } else {
      methodAction = 'stopTimerStartFinishDates';
  
      const activeStatus = await SynonymUtil.getSynonym(synonymdomainData, 'TIMERSTATUS', 'TIMERSTATUS|ACTIVE');
      const statusData = await SynonymUtil.getSynonym(synonymdomainData, 'TIMERSTATUS', 'TIMERSTATUS|COMPLETE');
      // istanbul ignore else
      if (activeStatus && statusData) {
        let anywhererefid;
        let regularHrs;
        await laborDS.initializeQbe();
        laborDS.setQBE('timerstatus', '=', activeStatus.value);
        laborDS.setQBE('laborcode', '=', labor);
        const activeLabor = await laborDS.searchQBE(undefined, true);
        // istanbul ignore if
        if (activeLabor?.[0]) {
          anywhererefid = activeLabor[0].anywhererefid;
  
          const startDateTimeMoment = app.dataFormatter.convertISOtoDate(activeLabor[0].startdatetime);
          regularHrs = activeLabor[0].regularhrs || Math.abs((current - startDateTimeMoment)) / 3600000;
        }
  
        localPayload = {
          labtrans: [{
            laborcode: labor,
            timerstatus: statusData.value,
            timerstatus_maxvalue: statusData.maxvalue,
            finishdatetime: currentDateString,
            finishdate: app.dataFormatter.dateWithoutTimeZone(currentDateString),
            finishtime: removeSecondsFromTimeString(app.dataFormatter.dateWithoutTimeZone(currentDateString)),
            regularhrs: regularHrs,
            anywhererefid: anywhererefid
          }],
          href: event.item.href
        };
        //DT209005:error BMXAA2569E when timezone is UTC+1
        option.parameters.finishDateTime = app.dataFormatter.dateWithoutTimeZone(currentDateString);
        option.parameters.startDateTime = app.dataFormatter.dateWithoutTimeZone(app.dataFormatter.dateTimeToLocalValue(activeLabor?.[0]?.startdatetime));
        //END DT
        option.parameters.noStopTimerPopup = true;
        option.localPayload = localPayload;
  
      }
      else {
        page.state.workloading = page.state.transactionProgress = false;
        app.toast(
          app.getLocalizedLabel(
            'fail_get_synonym',
            `Can not get the synonym data for TIMERSTATUS`,
            ['TIMERSTATUS']
          ),
          'error'
        );
      }
    }

    // After change the timer status, reloading the report page to fetch latest data
    const reportworkLaborDetailds =  app?.findPage('report_work')?.findDatasource('reportworkLaborDetailds');
    await reportworkLaborDetailds?.forceReload();
    let responseData = await detailDS.invokeAction(methodAction, option);
    let response = responseData;
  
    // istanbul ignore next
    if (response && Array.isArray(response) && response.length > 0) {
      response = response[0]._responsedata;
    } else if (response?._responsedata?.[0]) {
      response = response._responsedata[0];
    }
  
    // istanbul ignore next
    if (response) {
      if (event.action !== 'start') {
        if (schPage) {
          if (schPage.findPage('schedule')){
            schPage.findPage('schedule').state.woItems = await detailDS.forceReload();
          }else{
            await detailDS.forceReload();
          }
        }
      }

      if (event.action === 'stop' && event.actionType !== 'travel' && !CommonUtil.sharedData.showConfirmDialog) {
        app.setCurrentPage({
          name: 'report_work', 
          params: {
            itemhref: event.item.href, 
            wonum: event.item.wonum, 
            istask: event.item.istask,
            wogroup: event.item.wogroup,
            taskid: event.item.taskid
          }
        });
      }
      // user clicked on stop running work order so reintiate original start event where user clicked initially
      if (CommonUtil.sharedData.showConfirmDialog && !CommonUtil.sharedData.fromDeleteEntry) {
        const {app, page, event, detailDS, laborDS, transtype, transtypeDescription} = CommonUtil.sharedData.originalEvent;
        // we have to add set timeout here to add this method once all executing stack ends else this gets called before graphite updates
        // and we are not getting updated datas
        setTimeout(() => {
          startStopTimer(app, page, event, detailDS, laborDS, transtype, transtypeDescription);
          CommonUtil.sharedData.showConfirmDialog = false;
          app.state.showLoaderOnAllWO = false;
        });
        return;
      }

      // Called when Start Button Clicked from Work Order Details Screen
      let workOrderDetailsPage = app.findPage('workOrderDetails');
      if (workOrderDetailsPage) {
        page.state.transactionProgress = true;
        workOrderDetailsPage.state.woItem = await detailDS.forceReload();
      }
      page.state.transactionProgress = false;
      if (event.action === 'start' && (app.findPage('schedule') || app.findPage('approvals')) && app.currentPage.name !== "workOrderDetails") {
        app.currentPage.controllers[0].showWODetail(event.item);
      }
    }
  }
  page.state.workloading = page.state.transactionProgress = false;
  if (event.action === 'start') {
    resetSharedConfirmationVariable(app);
  } else if (event.action === 'stop') {
    CommonUtil.sharedData.showConfirmDialog = false;
  }
  
}

/**
 * Called by clicking Edit labor button on confirm dialog.
 * @param {Application} app application object
 * @param {String} href href for labor.
 * @param {Object} item labor item
 */
const clickEditLabor = async (app, href, item) => {
  app.setCurrentPage({
    name: 'report_work', 
    params: { 
      itemhref: href, 
      wonum: item.wonum, 
      istask: item.istask,
      wogroup: item.wogroup,
      taskid: item.taskid,
      stopResumeLoadData: true
    }
  });
  app.currentPage.callController('loadAndOpenReportTimeDrawer', {action: 'update', item: item});
};

/**
 * Called by clicking Edit labor button on confirm dialog.
 * @param {Application} app application object.
 * @param {Datasource} detailDS workorder detail datasource.
 * @param {Datasource} laborDS  labor detail datasource.
 */
const clickSendLabTrans = async (app, page, action, detailDS, laborDS, item) => {
  page.state.workloading = true;
  await startStopTimer(app, page, {item, action}, detailDS, laborDS);
};

/**
 * Return value of CONFIRMLABTRANS from MAXVAR, used to show labour approval confirm dialog
 * @param {Application} app application object 
 * @returns {String} "1" or undefined
 */
const getConfirmlabtrans = (app) => {
  // istanbul ignore if
  if (Device.get().isMaximoMobile && !app.state.networkConnected) {
      return CommonUtil.filterMobileMaxvars('CONFIRMLABTRANS', app.findDatasource('defaultSetDs'))[0]?.varvalue;
  }
}

/**
 * Called by clicking Edit labor button on confirm dialog.
 * @param {Application} app application object.
 * @param {Page} page current page object.
 * @param {String} worktype work type for lab trans
 * @param {Datasource} domainDS domain datasource.
 * @param {Datasource} synonymDS synonym datasource.* 
 * @param {Datasource} woDS workorder detail datasource.
 * @param {Datasource} laborDetailDS  labor detail datasource.
 */
const clickStartStopTimer = async (app, page, event, worktype, woDS, laborDetailDS, dialogName) => {

  page.state.transactionProgress = true;
  // check confirmlabtrans when action is stop
  // DT189569: to support show Labor approval dialog in offline mode
  //istanbul ignore else
  if (isOpenConfirmDialog(event, app)) {
    // show dialog
    await openConFirmLabTimeDialog(app, page, laborDetailDS, event.action, dialogName, event.actionType);
    page.state.transactionProgress = false;
  }
  else {
    let transtype = '';
    let transtypeDescription = '';
    let travelNavigation = '';
    const synonymDS = app.findDatasource('synonymdomainData');
    //istanbul ignore if
    if (worktype === 'work') {
      const transtypeSynonym = await SynonymUtil.getSynonymByOrg(synonymDS,
        'LTTYPE',
        ['WORK'],
        app.client.userInfo.defaultOrg);
      if (transtypeSynonym?.length) {
        transtype = transtypeSynonym[0].value;
        transtypeDescription = transtypeSynonym[0].description;
      }
    } else if (worktype === 'travel') {
      const transtypeSynonym = app.state.defaultTravTrans;
      //istanbul ignore if
      if (transtypeSynonym) {
        transtype = transtypeSynonym.value;
        transtypeDescription = transtypeSynonym.description;
      }
      travelNavigation = app.state.systemProp["mxe.mobile.travel.navigation"];
      // istanbul ignore else
      if (woDS.item.coordinate && travelNavigation === "1") {
        let geolocationlong = app.geolocation.state.longitude;
        let geolocationlat = app.geolocation.state.latitude;

        let serlong = event.item.serviceaddress.longitudex;
        let serlat = event.item.serviceaddress.latitudey;
        
        const isLat = CommonUtil.isLatOrLong(serlat);
        const isLong = CommonUtil.isLatOrLong(serlong);

        // istanbul ignore else
        if (serlat && serlong && !isLat && !isLong) {
          const basemapSpatialReference = CommonUtil.sharedData.basemapSpatialReference;
          const convertedCoordinates = OpenLayersAdapter.transformCoordinate([serlong,serlat], basemapSpatialReference,'EPSG:4326');
          serlong = convertedCoordinates[0];
          serlat = convertedCoordinates[1];
        }

        let controllerOption = {
          geolocationlong: geolocationlong,
          geolocationlat: geolocationlat,
          serlong: serlong,
          serlat: serlat,
        };
        app.callController("openNavigation", controllerOption);
      }
    }

    // send start or stop timer 
    await startStopTimer(app, page, event, woDS, laborDetailDS, transtype, transtypeDescription);
  }
}

function isOpenConfirmDialog(event, app) {
  return (event.action === 'stop' || event.action === 'pause') && ((event.item.confirmlabtrans || getConfirmlabtrans(app)) === '1');
}

// Assisted by watsonx Code Assistant 
/**
 * Resets the data source query and optionally updates it with the provided search text.
 *
 * @async
 * @function resetDatasource
 * @param {Object} app - The application instance.
 * @param {string} [searchText] - The search text to update the query with.
 * @returns {string|null>} The current search text if a reset occurred, otherwise null.
 */
const resetDatasource = async (app, searchText) => {
  const ds = app.findDatasource(
    app.findPage("schedule")?.state?.selectedDS || app.findPage("approvals")?.state?.selectedDS
  );
  if (!ds) return;

  //istanbul ignore else
  if (ds.state?.currentSearch?.length > 0 && ds.state?.isFiltered?.length > 0 && !CommonUtil.sharedData.shouldReloadDatasource) {
    const currentSearchText = ds.state.isFiltered;
    if (CommonUtil.sharedData.isCardOpen) {
      ds.lastQuery.itemUrl = "";
    }
    ds.baseQuery.where = "";
    ds.baseQuery.searchText = "";
    await ds.load({ ...ds.baseQuery, noCache: true });
    return currentSearchText;
  }

  //istanbul ignore else
  if (searchText !== undefined && !CommonUtil.sharedData.shouldReloadDatasource) {
    ds.baseQuery.searchText = searchText;
    await ds.load({ ...ds.baseQuery, noCache: true });
    return;
  }

  //istanbul ignore else
  if (CommonUtil.sharedData.isCardOpen && !CommonUtil.sharedData.shouldReloadDatasource) {
    ds.lastQuery.itemUrl = "";
    ds.baseQuery.where = "";
    ds.baseQuery.searchText = "";
    await ds.load({ ...ds.baseQuery, noCache: true });
    return;
  }

  //istanbul ignore else
  if (CommonUtil.sharedData.shouldReloadDatasource) {
    //Parameter Overloading :: searchText acts as href in this case
    await ds.load({ itemUrl: searchText });
    CommonUtil.sharedData.shouldReloadDatasource = false;
    CommonUtil.sharedData.isCardOpen = false;
  }
}

const functions = {
  getLabTransDS,
  deleteTimerEntry,
  computedTimerStatus,
  openConFirmLabTimeDialog,
  startStopTimer,
  clickEditLabor,
  clickSendLabTrans,
  clickStartStopTimer,
  removeSecondsFromTimeString,
  validateActiveTimer,
  checkAllRunningTimer,
  stopWorkOnStatusComp,
  resetSharedConfirmationVariable,
  findRunningWorkOrder,
  isOpenConfirmDialog,
  resetDatasource
};

export default functions;
