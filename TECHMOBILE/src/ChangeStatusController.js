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

import {log, Device} from '@maximo/maximo-js-api';
import WOUtil from './utils/WOUtil';
import commonUtil from './utils/CommonUtil';
import WOTimerUtil from './utils/WOTimerUtil';

const TAG = 'ChangeStatusController';

class ChangeStatusController {

  dialogInitialized(page) {
    this.page = page;
    this.app = this.page.getApplication();
    this.page.state.selectedStatus = "";
    this.page.state.selectedStatusMaxValue = "";
    this.page.state.statusMemo = "";
  }

  dialogOpened() {
    this.app.callController('resetSkipState');
    this.page.parent.state.disableDoneButton = true;
    this.page.state.selectedStatus = "";
    this.page.state.selectedStatusMaxValue = "";
    this.page.state.statusMemo = "";
  }


// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-8b-code-instruct
/**
 * Opens the signature dialog for the given work order.
 * @param {object} workorder - The work order object.
 */
  //istanbul ignore next
  async openSignatureDialog(workorder) {
    
    //istanbul ignore else
    if (!workorder?.href) {
      log.d(TAG, 'Work order has no href to load');
      this.page.state.canLoadWoDetails = false;
    }
    const wodetails = this.app.findDatasource('wodetails');
    await wodetails.load({ noCache: true, itemUrl: workorder.href });
    this.page.state.canLoadWoDetails = true;
    this.app.userInteractionManager.openSignature(
      imageData => {
        log.t(TAG, 'base64 image' + imageData);
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
        filename: this.page.parent.state.compDomainStatus,
        datasource: this.app.findDatasource('signatureAttachment'),
        onUpload: this.onSignatureUpload.bind(this)
      })
  }

  /*
   * Method to change the status. This is called from from the following pages:
   *    - Schedule Page
   *    - Work Detail Page
   */
  async changeStatus() {
    let parentPage = this.page.parent;

    // Method Config for Calibration Operations
    const calMethodConfig = {
      method: "changeStatus",
      params: [],
      pageName: 'changeStatus'
    }

    // Validate Datasheet warnings
    const woDetails = parentPage.state.woItem;
    // istanbul ignore else
    if (this.page.state.selectedStatusMaxValue === 'COMP' && woDetails?.iscalibration && woDetails?.pluscwodscount > 0 && this.app.name !== "supmobile") {
      parentPage.state.loadingstatus = true;
      const datasheetResult = await commonUtil.validateDataSheet(this.app, parentPage, woDetails, calMethodConfig);
      parentPage.state.loadingstatus = false;
      if (!datasheetResult) {
        return;
      }
    }
    
    // Validate Actual Tools
    // istanbul ignore else
    if (this.app.name !== "supmobile" && this.page.state.selectedStatusMaxValue === 'COMP' && woDetails?.iscalibration && woDetails?.pluscwodscount > 0 && !this.app.state.skipToolWarning && !this.app.state.disableToolWarning) {
      
      const validateActualTool = await commonUtil.validateActualTools(this.app, parentPage, woDetails, calMethodConfig);
      // istanbul ignore else
      if (!validateActualTool) {
        return;
      }
    }

    let selectedDSName = parentPage.state.referenceDS;
    let workorder = parentPage.state.woItem;
    let selectedStatus = this.page.state.selectedStatus;
    let referencePage;
    let hazardReviewedReq = this.app.state.systemProp && this.app.state.systemProp["maximo.mobile.safetyplan.review"];
    let woDetailDs = this.app.findDatasource("woDetailds");
    // should display dialog for preventive maintenance calibration
    const displayCalibrationLabelDialog = !!( (workorder.iscalibration || workorder.pluscloop) && workorder.pmnum );
    if (hazardReviewedReq === '1') {
      if (!woDetails?.href) {
        this.app.state.canLoadWoDetailDS = false;
      }
      await woDetailDs.load({ noCache: true, itemUrl: woDetails?.href });
      this.app.state.canLoadWoDetailDS = true;
    }
    const isSafetyPlanReviewed = WOUtil.isSafetyPlanReviewed(woDetailDs.item, this.app?.client?.userInfo?.personid);
    // Check and Verify Asset Barcode If Applicable
    if (parentPage.state.enforceAssetScan === 1 && !this.app.state.disableScan && workorder.assetnum) {
      parentPage.state.loadingstatus = true;
      const isScanRequired = await commonUtil.checkScanRequired(this.page.state.selectedStatusMaxValue);
      parentPage.state.loadingstatus = false;

      // istanbul ignore else
      if (isScanRequired) {
        const scanResParam = { 
          scanValue: null, 
          assetnum: workorder.assetnum, 
          locationnum: workorder.locationnum, 
          status: this.page.state.selectedStatusMaxValue 
        };
        this.app.state.scanParameter = { 
          app: this.app, 
          page: parentPage, 
          method:"changeStatus", 
          scanResParam: scanResParam 
        };
        this.app.showDialog("appAssetScanDialog");
        
        return;
      }
    }

    // Add work log comment
    if (this.app.state.skipScan) {
      this.app.state.skipScan = false;
      parentPage.state.loadingstatus = true;
      const message = this.page.state.selectedStatusMaxValue === 'COMP'?  this.app.getLocalizedLabel('worklog_woCompleted_without_scan', 'The work order was completed without scanning an asset.'): this.app.getLocalizedLabel('worklog_woStarted_without_scan', 'The work order was started without scanning an asset.');
      await parentPage.callController('saveWorkLog', {
        longDescription: "",
        summary: message,
        visibility: true
      }, true);
      parentPage.state.loadingstatus = false;
    }

    // Signature Check

    if (parentPage.state.enableSignatureButton && !this.app.state.skipSignature) {
      await this.openSignatureDialog(workorder);
      return;
    }


    this.app.state.skipToolWarning = false;
    this.app.state.disableScan = false;
    this.app.state.skipScan = false;
    this.app.state.skipSignature = false;

    //Open wohazard if not reviewed
    // istanbul ignore else
    if (workorder.wohazardcount > 0 && isSafetyPlanReviewed && this.page.state.selectedStatusMaxValue === 'INPRG' && hazardReviewedReq === '1') {
      let label = this.app.getLocalizedLabel('safetyplanreview_status', 'You must review the safety plan before you change the status.');
      this.app.toast(label, 'error', null, null, false);
      await WOUtil.openWOHazardDrawer(this.app, this.app.findPage(parentPage.state.referencePage), { item: woDetailDs.item }, parentPage.state.referencePage === "schedule" ? "slidingwohazard" : "wohazardDrawer");
      parentPage.findDialog(parentPage.state.statusDialog).closeDialog();
      return;
    }

    if (parentPage && (parentPage.state.referencePage === 'schedule' || parentPage.state.referencePage === 'approvals')) {
      referencePage = parentPage;
    } else {
      referencePage = this.app.pages.find((element) => {
        // istanbul ignore else
        if (element.name === parentPage.state.referencePage) {
          return element;
        } else {
          return '';
        }
      });
    }
    log.t(TAG, "changeStatus : selectedStatus --> " + selectedStatus);
    let currDate = new Date();
    let dataFormatter = this.app.dataFormatter;
    if (selectedStatus) {
      log.t(
        TAG,
        "changeStatus : Page Item = " +
        parentPage.state.woItem.wonum +
        " selectedDSName --> " +
        selectedDSName +
        " Parent Page woItem --> " +
        parentPage.state.woItem.wonum
      );

      currDate = dataFormatter.convertDatetoISO(currDate);

      log.t(TAG, "changeStatus : currDate Formatted --> " + currDate);

      let currWODatasource = referencePage.findDatasource(selectedDSName);

      
      let action = 'changeStatus';
      let option = {
        record: workorder,
        parameters: {
          status: this.page.state.selectedStatus,
          date: currDate,
          memo: this.page.state.statusMemo
        },
        headers: {
          'x-method-override': 'PATCH'
        },
        responseProperties: 'status,actfinish,pluscnextdate,pm.lastcompdate--lastcompdate,rel.wostatus{href, wostatusid, changeby, changedate, status}',
        localPayload: {
          status: this.page.state.selectedStatus,
          status_maxvalue: this.page.state.selectedStatusMaxValue,
          status_description: this.page.state.selectedStatusDescription,
          statusdate: currDate,
        },
        query: {interactive: false, ignorecollectionref:1},
        esigCheck: 0
      };
      if(this.checkEsigRequired()) {
        option.esigCheck = 1;
      }
      // istanbul ignore else
      if (workorder.woactivity && Device.get().isMaximoMobile) {
        let woTasks = await this.app.controllers[0].getWoActivity(this.page, this.app, workorder);
        // istanbul ignore else
        if (woTasks.length){
          option.localPayload["woactivity"] = woTasks;
        }
      }
      try {
        parentPage.state.loadingstatus = true;
        await currWODatasource.invokeAction(action, option);
        const isActiveLabTrans = await WOUtil.isActiveLabTrans(this.app, workorder.labtrans);
        if (this.page.state.selectedStatusMaxValue === 'COMP' && isActiveLabTrans) {
          let laborDS = this.app.findDatasource('woLaborDetailds');
          // istanbul ignore else
          if (parentPage.state.referencePage === "schedule") {
            // Load Current Work Order on schedule page
            const wodetails = this.app.findDatasource('wodetails');
            parentPage.state.canLoadWoDetailsChilds = false;
            if (!workorder?.href) {
              log.d(TAG, 'Work order has no href to load');
              this.page.state.canLoadWoDetails = false;
            }
            await wodetails.load({ noCache: true, itemUrl: workorder.href });
            this.page.state.canLoadWoDetails = true;
            parentPage.state.canLoadWoDetailsChilds = true;
            // Fetch Labor transactions of current work order from schedule page
            laborDS = this.app.findDatasource('woLaborDetaildsOnSchedule');
            await laborDS.forceReload();
            
          }
          const activeLabTran = await WOUtil.getActiveLabTrans(this.app, laborDS);
          // istanbul ignore else
          if (activeLabTran?.length > 0) {
            await WOTimerUtil.stopWorkOnStatusComp(this.app, activeLabTran, laborDS);
          }
        }

        referencePage.state.canLoadWoDetailResourceChilds = false;
        await currWODatasource.forceReload();
        referencePage.state.canLoadWoDetailResourceChilds = true;

        // Close the dialog .. this.page is the dialog's page, hence traverse to the parent page
        // and then call findDialog / closeDialog ..
        parentPage.findDialog(parentPage.state.statusDialog).closeDialog();

        //Navigate back to list page if status WO changed to COMP, CAN, CLOSE

        // istanbul ignore else
        if (this.page.state.selectedStatusMaxValue === 'COMP' || this.page.state.selectedStatusMaxValue === 'CAN' || this.page.state.selectedStatusMaxValue === 'CLOSE') {
          // Display calibration label dialog
          if(['COMP', 'CLOSE'].includes(this.page.state.selectedStatusMaxValue)
              && displayCalibrationLabelDialog) {
            this.app.showDialog("calibrationLabelDialog", {}, {'item': workorder});
          }

          const schPage = (this.app.findPage("schedule")) ? 'schedule' : 'approvals';
          this.app.setCurrentPage({name: schPage});
        }

      } finally {
        parentPage.state.loadingstatus = false;
      }
    }

  }

  /**
   * In system properties we would get list of flag on which we have to ask for eSigCheck
   * if current status matches in list we would pass esigCheck 1 and on based of it graphite component
   * will handle to show prompt of esig
   * @returns 1 or 0 (boolean numeric value)
   */
  checkEsigRequired() {
    const esigCheck = this.app.state.systemProp && this.app.state.systemProp["maximo.mobile.wostatusforesig"];
    const allowedSignature = esigCheck? esigCheck
      .split(',')
      .map((status) => status.trim()): [];
      const addEsig = allowedSignature.length > 0 &&
      allowedSignature.indexOf(this.page.state.selectedStatus) > -1;
    return (addEsig) ? 1 : 0;
  }


  selectStatus(item) {
    log.t(TAG, 'selectStatus : SelectStatus called .. ' + JSON.stringify(item));
    this.page.state.selectedStatus = item.value;
    this.page.state.disableDoneButton = false;
    this.page.parent.state.disableDoneButton = false;
    this.page.state.selectedStatusMaxValue = item.maxvalue;
    this.page.state.selectedStatusDescription = item.description;
    this.page.parent.state.compDomainStatus = item.value + new Date().getTime();
    let workorder = this.page.parent.state.woItem;
    let allowedSignatureSystemProp = this.app.state.systemProp && this.app.state.systemProp["maximo.mobile.statusforphysicalsignature"];
   
    // istanbul ignore else
    if (allowedSignatureSystemProp) {
      let allowedSignature = allowedSignatureSystemProp
        .split(',')
        .map((status) => status.trim());

        this.page.parent.state.enableSignatureButton =
        allowedSignature.length > 0 &&
        allowedSignature.indexOf(item.value) > -1;
    }
    // istanbul ignore next
    if((item.maxvalue === 'COMP' || item.maxvalue === 'CLOSE') && workorder.assetisrunning === false && workorder.assetnumber && item._selected) {
      this.app.callController('checkDownPrompt',{workorder:workorder,page: this.page.parent});
    }
    if (this.page.parent.datasources.dsstatusDomainList && this.page.parent.datasources.dsstatusDomainList.state.selection.count > 0) {
      this.page.parent.state.disableDoneButton = false;
    } else {
      this.page.parent.state.disableDoneButton = true;
    }
  }

  setStatusMemo(event) {
    this.page.state.statusMemo = event.currentTarget.value;
    log.t(TAG, 'setStatusMemo : statusMemo --> ' + this.page.state.statusMemo);
  }

  /**
   * This method invokes change status API once signature is uploaded.
   */
  async onSignatureUpload() {
    this.app.state.skipSignature = true;
    await this.changeStatus();
    let woDetailResourceDS = this.app.findDatasource('woDetailResource');
    
    //istanbul ignore else
    if (woDetailResourceDS) {
      await woDetailResourceDS.forceReload();  
      this.app.state.doclinksCountData[woDetailResourceDS.item.wonum] = Device.get().isMaximoMobile ? woDetailResourceDS.item.doclinks.member.length : woDetailResourceDS.item.doclinkscount;
      this.app.state.doclinksCount = this.app.state.doclinksCountData[woDetailResourceDS.item.wonum];
    }
  }

  /**
   * This method invokes on task status selection.
   */
  selectTaskStatus(item) {
    log.t(TAG, 'selectStatus : SelectStatus called .. ' + JSON.stringify(item));
    this.page.parent.state.selectedTaskStatus = item;
    if (this.page.parent.datasources.taskstatusDomainList && this.page.parent.datasources.taskstatusDomainList.state.selection.count > 0) {
      this.page.parent.state.disableDoneButton = false;
    } else {
      this.page.parent.state.disableDoneButton = true;
    }
  }
}

export default ChangeStatusController;
