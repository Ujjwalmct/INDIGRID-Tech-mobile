/*
 * Licensed Materials - Property of IBM
 *
 * 5724-U18, 5737-M66
 *
 * (C) Copyright IBM Corp. 2022,2025 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */

import { Device } from '@maximo/maximo-js-api';

import CalibrationLabelUtils from "./utils/CalibrationLabelUtils";

const calibrationStatusIcons = {
  PASS: 'Carbon:checkmark--outline',
  FAIL: 'Carbon:Close--outline',
  OLIM: 'Carbon:Close--outline',
  BROKEN: 'Carbon:Warning--alt'
};

/**
 * CalibrationLabelController
 *
 * @typedef {import('@maximo/maximo-js-api').Page} Page
 * @typedef {import('@maximo/maximo-js-api').Application} Application
 * @typedef {import('@maximo/maximo-js-api').Datasource} Datasource
 */
class CalibrationLabelController {
  /**
   * Called once for the lifetime of the application.
   *
   * @param {import('@maximo/maximo-js-api').Page} page - Page instance.
   * @param {import('@maximo/maximo-js-api').Application} app - Application instance.
   */
  pageInitialized(page, app) {
    this.app = app;
    this.page = page;
  }

  /**
   * Called every time the page is resumed, including the first time the page is created.
   *
   * @param {import('@maximo/maximo-js-api').Page} page - Page instance.
   * @param {import('@maximo/maximo-js-api').Application} app - Application instance.
   */
  pageResumed(page, app) {
    this.app = app;
    this.page = page;

    if(!this.app.state.networkConnected) {
      page.state.noDataFoundErrMsg = true;
      this.page.showDialog("callabel_offline_msg");
      return;
    }

    page.state.noDataFoundErrMsg = false;
    page.state.loading = true;
    this.loadCalibrationLabelInfo().then(() => {
      // istanbul ignore next
      page.state.loading = false;
    });
  }

  /**
   * Set up calibration label information from workorder, called from pageResumed and refreshLabelPage
   */
  async loadCalibrationLabelInfo(verifyLatestWorkorder = true)  {
    const pageStack = this.app.pageStack;
    // find the previous page
    const referrerPage = pageStack.length > 1 ? pageStack[pageStack.length - 2] : pageStack[0];
    const calibrationDetailsDS = this.page.findDatasource("calibrationDetailsDS");
    // istanbul ignore else
    if (this.page.params.href && calibrationDetailsDS) {
      await calibrationDetailsDS.load({
        noCache: true,
        itemUrl: this.page.params.href,
      });
      
      const { pluscwods: datasheets = [], workorderid, iscalibration, pluscloop, pmnum, pmuid, lastcompdate, status_maxvalue, wostatus = [] } = calibrationDetailsDS.item || {};

      const isValidWO = ['COMP', 'CLOSE'].includes(status_maxvalue) && (iscalibration || pluscloop) && pmnum && lastcompdate;
      // basic eligibility for label generation
      if(!isValidWO) {
        this.page.state.noDataFoundErrMsg = true;
        return;
      }

      // if the user arrived from completion of work order, then referrerPage will be 'schedule'
      if(referrerPage !== 'schedule' && verifyLatestWorkorder) {
        // Find out the latest work order corresponding to the current workorder's PM
        this.page.state.canLoadPmWorkorderDS = true;
        const lastCompDateISOFormat = this.app.dataFormatter.getISODate(lastcompdate);
        const pmWorkorderDS = this.page.findDatasource("pmWorkorderDS");
        const pmWorkorderDsQueryClause = `pm.pmuid=${pmuid} and actfinish>="${lastCompDateISOFormat}"`;
        const pmWorkorderDsQuery = {
          where: pmWorkorderDsQueryClause,
          orderBy: 'actfinish descending',
          noCache: true,
          forceSync: (pmWorkorderDsQueryClause !== pmWorkorderDS.lastQuery?.where) || pmWorkorderDS.hasCacheExpired()
        };
        await pmWorkorderDS.load(pmWorkorderDsQuery);
        this.page.state.canLoadPmWorkorderDS = false;

        // this is not the latest work order finished from the PM
        if(pmWorkorderDS?.item?.workorderid !== workorderid) {
          this.page.state.noDataFoundErrMsg = true;
          if(pmWorkorderDS?.item?.workorderid) {
            this.page.showDialog("newerRecordForPM", {}, {'item': pmWorkorderDS.item});
            return;
          }
        }
      }

      this.page.state.signature = referrerPage === 'schedule' ? this.app.client.userInfo.personid : this.getCompletingUserSignature(wostatus); // person who has completed the work order
      this.page.state.calstatus = this.deriveCalibrationStatus(datasheets); // overall calibration status - one of PASS, FAIL, OLIM, BROKEN, MISSING
      this.page.state.labelType = iscalibration ? 'asset' : 'location';
      this.page.state.noDataFoundErrMsg = this.page.state.calstatus === 'MISSING' || !isValidWO;
    } else {
      this.page.state.noDataFoundErrMsg = true;
    }
  };

  /**
   * Sets the label information from the details of the given work order item.
   * @param {Object} item - item containing work order information
   * @param {String} item.href - item href
   */
  async refreshLabelPage(item) {
    this.page.params.href = item.href;
    this.page.state.loading = true;
    await this.loadCalibrationLabelInfo(false).then(() => {
      this.page.state.loading = false;
    });
  }

  getCalibrationstatusIcon() {
    return calibrationStatusIcons[this.page.state.calstatus] || '';
  }

  getCompletingUserSignature(wostatus = []) {
    // Find 'COMP' status entry.
    let personId = ''; 
    for(const woStatusChange of wostatus) {
      if(woStatusChange.status === 'COMP') {
        personId = woStatusChange.changeby;
        break;
      } else if (woStatusChange.status === 'CLOSE' && !personId) {
        personId = woStatusChange.changeby; // in case we don't find 'COMP' entry, this entry should be considered
      }
    }

    return personId;
  }

  getWorkOrderFieldValue(fieldName, fieldType) {
    let fieldValue = '';
    const { item: workOrderItem = {}} = this.page.findDatasource("calibrationDetailsDS") || {};
    
    if (workOrderItem[fieldName]) {
      fieldValue = fieldType === 'DATE' ? this.app.dataFormatter.dateToString(workOrderItem[fieldName], 'MM/DD/YYYY') 
                                          : workOrderItem[fieldName]
    }

    return fieldValue;
  }

  deriveCalibrationStatus(datasheets) {
    let missingStatusCount = 0;
    let finalStatus = datasheets.reduce((acc, curr) => {
      if (['MISSING', '', null, undefined].includes(curr.asleftcalstatus_maxvalue)) {
        missingStatusCount += 1;
      }

      if (curr.asleftcalstatus_maxvalue === 'BROKEN') {
        acc = curr.asleftcalstatus_maxvalue;
      } else if (curr.asleftcalstatus_maxvalue === 'FAIL' && acc !== 'BROKEN') {
        acc = curr.asleftcalstatus_maxvalue;
      } else if (curr.asleftcalstatus_maxvalue === 'OLIM' && !['BROKEN', 'FAIL'].includes(acc)) {
        acc = curr.asleftcalstatus_maxvalue;
      }
      return acc;
    }, 'PASS');
    
    if (missingStatusCount === datasheets.length) {
      finalStatus = 'MISSING'
    }
    return finalStatus;
  }

  // Assisted by watsonx Code Assistant 
  /**
   * generateCalibrationLabel - This function generates the calibration label for the application.
   * @returns {void}
   */
  generateCalibrationLabel() {
    if (Device.get().isMaximoMobile) {
      const calibrationDetailsDS = this.page.findDatasource('calibrationDetailsDS');

      let fieldRowsForMobile = [];
      const { item: {
        wonum,
        assetnum,
        assetparent, 
        assetdesc,
        location,
        locationparent,
        locationdesc,
        actfinish,
        pluscnextdate,
        pluscphyloc
        } = {} } = calibrationDetailsDS || {};
      const isDateFormatNeeded = true;

      const statusHeaderId = 'callabel_header';
      const statusHeader = this.app.getLocalizedLabel(`${statusHeaderId}_label`, 'CALIBRATION LABEL');
      this.populateFieldsForMobile(fieldRowsForMobile, 'callabel_status', 'Status', this.page.state.calstatus);

      if(this.page.state.labelType === 'asset') {
        this.populateFieldsForMobile(fieldRowsForMobile, 'callabel_asset_id', 'Asset ID', assetnum);
        this.populateFieldsForMobile(fieldRowsForMobile, 'callabel_parent_asset', 'Parent Asset', assetparent);
        this.populateFieldsForMobile(fieldRowsForMobile, 'callabel_asset_desc', 'Description', assetdesc);
      } else {
        this.populateFieldsForMobile(fieldRowsForMobile, 'callabel_loc_id', 'Location ID', location);
        this.populateFieldsForMobile(fieldRowsForMobile, 'callabel_parent_loc', 'Parent Location', locationparent);
        this.populateFieldsForMobile(fieldRowsForMobile, 'callabel_loc_desc', 'Description', locationdesc);
      }

      this.populateFieldsForMobile(fieldRowsForMobile, 'callabel_pluscphyloc', 'Physical Location', pluscphyloc);
      this.populateFieldsForMobile(fieldRowsForMobile, 'callabel_wonum', 'WO Number', wonum);
      this.populateFieldsForMobile(fieldRowsForMobile, 'callabel_actfinish', 'Calibration On', actfinish, isDateFormatNeeded);
      this.populateFieldsForMobile(fieldRowsForMobile, 'callabel_pluscnextdate', 'Next Due date', pluscnextdate, isDateFormatNeeded);
      this.populateFieldsForMobile(fieldRowsForMobile, 'callabel_signature', 'Signature', this.page.state.signature);
      this.populateFieldsForMobile(fieldRowsForMobile, 'callabel_date', 'Date', actfinish, isDateFormatNeeded);

      const templateData = {
        logoUrl: 'https://picsum.photos/100',
        fieldRows: fieldRowsForMobile
      };
      const htmlContent = CalibrationLabelUtils.getHTMLTemplateForMobileToPrint(templateData, statusHeader);
      window.cordova.plugins.printer.print(htmlContent);
    } else {
      CalibrationLabelUtils.generateHtmlForWebClient();
    }
  }

  populateFieldsForMobile(fieldRows, label_id, label, value, dateFormat = false) {
    if(value) {
      fieldRows.push({
        label: this.app.getLocalizedLabel(`${label_id}_label`, label), 
        value: dateFormat ? this.app.dataFormatter.dateToString(value, 'MM/DD/YYYY') : value
      });
    }
  }
}

export default CalibrationLabelController;