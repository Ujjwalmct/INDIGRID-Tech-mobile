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

import DatasheetConstants from "../rules/constants/DatasheetConstants";
import CommonUtil from "../../utils/CommonUtil";
import getMaxVars from "../../utils/getMaxVars";
import SynonymDomain from '../rules/models/SynonymDomain';

class CalibrationHelper {
  constructor(datasheetDS = null, calpointsDS = null, assetfunctionDS = null) {
    if (datasheetDS) {
      this.setDatasheetDS(datasheetDS);
    }

    if (calpointsDS) {
      this.setCalpointsDS(calpointsDS);
    }
    //istanbul ignore next
    if (assetfunctionDS) {
      this.setAssetFunctionDS(assetfunctionDS);
    }
  }

  /**
   * Setter.
   * @returns undefined
   */
  setCalpointsDS(calpointsDS) {
    this.calpointsDS = calpointsDS;
  }

  /**
   * Setter.
   * @returns undefined
   */
  setDatasheetDS(datasheetDS) {
    this.datasheetDS = datasheetDS;
  }

  /**
   * Sets asset function (pluscwodsinstr) datasource as parent of
   * calibration points datasource. Calibration points and Asset
   * Function datasources are instatiated with getChildDatasource in
   * AssetFunctionsController and are being detached from its parent.
   * Therefore, we use this method to make sure they have a proper
   * parent that we have control of.
   *
   * @param {Datasource} assetfunctionDS
   * @returns void
   */
  //istanbul ignore next
  setAssetFunctionDS(assetfunctionDS) {
    const calpointsDS = this.getCalpointsDS();
    calpointsDS.parent = assetfunctionDS;
  }

  /**
   * Get reference to asset function datasource.
   * @returns {Datasource}
   */
  getAssetFunctionDS() {
    const calpointsDS = this.getCalpointsDS();
    return calpointsDS.parent;
  }

  /**
   * Getter.
   * @returns {Datasource}
   */
  getCalpointsDS() {
    return this.calpointsDS;
  }

  /**
   * Getter.
   * @returns {Datasource}
   */
  getDatasheetDS() {
    return this.datasheetDS;
  }

  /**
   * Defines if datasheet should be updated manually or automatically
   * after calculations are perfomed in the calibration point page.
   *   If value is "0", then we turn the update off and allow user to
   * change it manually in datasheet page. If value is "1", disable
   * this feature on datasheet page and let it be updated in the
   * CalibrationPointHandler.
   *   If the maxvar "PLUSCAUTOSTATUS" is not set, then use default
   * value "1".
   *
   * @returns {Boolean}
   */
  static getAutoUpdate() {
    let isAutoUpdateStatus = true;
    const [maxvar] =
      CommonUtil.filterMobileMaxvars(DatasheetConstants.PLUSCAUTOSTATUS, {
        items: [
          {
            mobilemaxvars: getMaxVars(),
          },
        ],
      }) || [];

    if (maxvar) {
      isAutoUpdateStatus =
        maxvar.varvalue ===
        DatasheetConstants.UPDATE_DATASHEET_STATUS_AUTOMATICALLY;
    }
    return isAutoUpdateStatus;
  }

  // Assisted by watsonx Code Assistant
  /**
   * Check the status of an asset function.
   * @param {Array} assetFunctions - An array of asset functions.
   * @param {string} condition - The condition to check.
   * @param {Object} domainCalStatusDS - The domain object containing status mappings.
   * @returns {string} The status of the asset function.
   */
  static checkMissingOrBrokenStatus(assetFunctions, condition, domainCalStatusDS) {
    const statusList = {};
    let status = null;
    for (let i = 0; i < assetFunctions.length; i++) {
      const assetFunctionCalStatus = assetFunctions[i][`${condition}calstatus`];
      if(assetFunctionCalStatus) {
        const internalStatus = SynonymDomain.resolveToInternal(domainCalStatusDS, assetFunctionCalStatus);
        if(!statusList[internalStatus]) {
          statusList[internalStatus] = [assetFunctionCalStatus];
        } else {
          statusList[internalStatus].push(assetFunctionCalStatus);
        }
      }
    }
    if (statusList[DatasheetConstants.STATUS_MISSING]) {
      const missingStatusDefaultValue = SynonymDomain.resolveToDefaultExternal(domainCalStatusDS, DatasheetConstants.STATUS_MISSING);
      status = statusList[DatasheetConstants.STATUS_MISSING].includes(missingStatusDefaultValue) ? missingStatusDefaultValue : statusList[DatasheetConstants.STATUS_MISSING][0]; 
    } else if (statusList[DatasheetConstants.STATUS_BROKEN]) {
      const brokenStatusDefaultValue = SynonymDomain.resolveToDefaultExternal(domainCalStatusDS, DatasheetConstants.STATUS_BROKEN);
      status = statusList[DatasheetConstants.STATUS_BROKEN].includes(brokenStatusDefaultValue) ? brokenStatusDefaultValue : statusList[DatasheetConstants.STATUS_BROKEN][0]; 
    }
    return status;
  }
  
}

export default CalibrationHelper;
