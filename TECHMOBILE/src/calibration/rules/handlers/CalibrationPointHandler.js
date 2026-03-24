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

/** Constants */
import CalibrationPointConstants from "../constants/CalibrationPointConstants";
import DatasheetConstants from "../constants/DatasheetConstants";
import LogConstants from "../constants/LogConstants";

/** Helpers */
import CalibrationAverageRecord from "../helpers/CalibrationAverageRecord";
import DataSheetCalculation from "../helpers/DatasheetCalculation";
import SynonymDomain from "../models/SynonymDomain";

/** Utils */
import CommonUtil from "../../../utils/CommonUtil";
import fromDisplayableValue from "../utils/numberFormatter/fromDisplayableValue";
import printTable from "../../utils/printTable";

/** Log */
import { log } from "@maximo/maximo-js-api";
import LocaleConstants from "../constants/LocaleConstants";
import CalibrationHelper from "../../utils/CalibrationHelper";

/**
 * @typedef {import('@maximo/maximo-js-api').Page} Page
 * @typedef {import('@maximo/maximo-js-api').Application} Application
 * @typedef {import('@maximo/maximo-js-api').Datasource} Datasource
 */
class CalibrationPointHandler {
  /**
   * Reference to child datasource 'pluscwodspoint' that belongs to 'pluscWoDs'.
   * @type {Datasource}
   * @private
   */
  calpointsDS = null; // pluscwodspoint

  /**
   * Reference to datasource 'domaincalstatusds'.
   * @type {Datasource}
   * @private
   */
  domaincalstatusDS = null;

  /**
   * Reference to datasource 'pluscWoDs'.
   * @type {Datasource}
   * @private
   */
  datasheetDS = null;

  /**
   * Reference to datasource 'dsconfig'.
   * @type {Datasource}
   * @private
   */
  dsconfigDS = null;

  /**
   * User device's locale.
   * @private
   * @type {String}
   */
  locale = null;

  /**
   * Maxvars loaded by defaultSetDS datasource.
   * @type {Array}
   * @private
   */
  maxVars = [];

  /**
   * Constructor.
   *
   * @param {Datasource} datasheetDS
   * @param {Datasource} calpointsDS
   * @param {Datasource} domaincalstatusDS
   * @param {Datasource} assetfunctionDS - Reference to asset function datasource.
   * @param {Datasource} dsconfigDS - Reference to to datasource 'dsconfig'.
   * @param {Array} maxVars : Mobile maxvars defined in "defaultSetDS".
   * @param {String} locale - User locale.
   * @returns {undefined}
   */
  /* istanbul ignore next */
  constructor(
    datasheetDS = null,
    calpointsDS = null,
    domaincalstatusDS = null,
    assetfunctionDS = null,
    dsconfigDS = null,
    maxVars = [],
    locale = LocaleConstants.EN_US
  ) {
    if (datasheetDS) {
      this.setDatasheetDS(datasheetDS);
    }

    if (calpointsDS) {
      this.setCalpointsDS(calpointsDS);
    }

    if (domaincalstatusDS) {
      this.setDomainCalStatusDS(domaincalstatusDS);
    }

    if (assetfunctionDS) {
      this.setAssetFunctionDS(assetfunctionDS);
    }

    if (dsconfigDS) {
      this.setDsconfigDS(dsconfigDS);
    }

    if (maxVars) {
      this.setMaxVars(maxVars);
    }

    if (locale) {
      this.setLocale(locale);
    }
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
   * Getter.
   * @returns {Datasource}
   */
  getDomainCalStatusDS() {
    return this.domaincalstatusDS;
  }

  /**
   * Get reference of dsconfig.
   * @returns {Datasource}
   */

  getDsconfigDS() {
    return this.dsconfigDS;
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
   * Set reference of datasource 'dsconfig'.
   * @params {Datasource} dsconfigDS - Reference
   */

  setDsconfigDS(dsconfigDS) {
    this.dsconfigDS = dsconfigDS;
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

  setAssetFunctionDS(assetfunctionDS) {
    const calpointsDS = this.getCalpointsDS();
    calpointsDS.parent = assetfunctionDS;
  }

  /**
   * Setter.
   * @returns undefined
   */
  setDomainCalStatusDS(domaincalstatusDS) {
    this.domaincalstatusDS = domaincalstatusDS;
  }

  /**
   * Returns max vars.
   * @returns {Object}
   */
  getMaxVars() {
    return this.maxVars;
  }

  /**
   * Setter.
   * @param {Object} maxVars
   * @returns {undefined}
   */
  setMaxVars(maxVars) {
    this.maxVars = maxVars;
    return;
  }

  /**
   * Get locale.
   * @returns {String}
   */
  getLocale() {
    return this.locale;
  }

  /**
   * Set locale.
   * @param {String} locale
   */
  setLocale(locale) {
    this.locale = locale;
  }

  /**
   * This method should be executed every time input/output changes when
   * all input/outputs were filled in the calibrapoints.xml, then we
   * execute this reading and update status of datasheet and asset
   * function.
   *
   * @param {Boolean} completeReadingsClicked - Flag that indicates whether this function was invoked from a click event.
   * @returns String - Return updated asset function status.
   */
  async completeAsFoundAverageCalPointReadings(completeReadingsClicked) {
    return await this._completeReadings(
      null,
      CalibrationPointConstants.CONDITION_ASFOUND,
      completeReadingsClicked
    );
  }

  /**
   * This method should be executed every time input/output changes when
   * all input/outputs were filled in the calibrapoints.xml, then we
   * execute this reading and update status of datasheet and asset
   * function.
   *
   * @param {Boolean} completeReadingsClicked - Flag that indicates whether this function was invoked from a click event.
   * @returns String - Return updated asset function status.
   */
  async completeAsLeftAverageCalPointReadings(completeReadingsClicked) {
    return await this._completeReadings(
      null,
      CalibrationPointConstants.CONDITION_ASLEFT,
      completeReadingsClicked
    );
  }

  // TODO: GRAPHITE-72086 refactor: remove eventContext from callings in CalibrationPointHandler
  /**
   * Complete calbiration point reading (submission action).
   *
   * @param {Object} eventContext - *DEPRECATED* variable.
   * @param {CalibrationPointConstants.PREFIXES} conditionPrefix - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @param {Boolean} completeReadingsClicked - Flag that indicates whether this function was invoked from a click event.
   * @returns {Datasource} datasheetDS - Should return datasheet datasource with all changes available in it.
   */
  async _completeReadings(
    eventContext,
    conditionPrefix,
    completeReadingsClicked
  ) {
    const datasheetDS = this.getDatasheetDS();
    const assetfunctionDS = this.getAssetFunctionDS();
    const assetfunction = assetfunctionDS.currentItem;

    // istanbul ignore if
    if (!assetfunction) {
      return null;
    }

    const calpoints = this.getCalpointsDS().items;

    // initialize status as 'empty'
    let status = DatasheetConstants.STATUS_EMPTY;

    // check if all fields have been filled out.
    /* istanbul ignore next */
    if (
      this.enableCompleteReadingsButton(
        conditionPrefix === CalibrationPointConstants.CONDITION_ASLEFT
      )
    ) {

      if (assetfunction?.isstandarddeviation && assetfunction?.calpoint) {
        // calculate status with standard deviation error 
        status = this._getAssetFunctionStatusByStandardDeviation(assetfunction, calpoints, conditionPrefix);
      } else {
        // only calculate status if all data has been provided
        status = this._getAssetFunctionStatus(
          assetfunction,
          calpoints,
          conditionPrefix
        );
      }
   
    }

    assetfunction[`${conditionPrefix}calstatus`] = status;

    // Set error count on asset function for cal points and func checks
    this._setAssetFunctionErrorCount(assetfunction, calpoints, conditionPrefix);

    // This will make changes to the datasheet, to be saved by caller
    await this._updateDataSheetStatus(
      eventContext,
      datasheetDS,
      conditionPrefix
    );

    // Show message only if asset function status has changed or if complete readings was clicked
    if (completeReadingsClicked) {
      this._showStatusMessage(eventContext, conditionPrefix, assetfunction);
    }

    /* istanbul ignore next */
    if (log.isDebug()) {
      log.d(
        LogConstants.TAG_CALIBRATION,
        `Asset function ID=${assetfunction["pluscwodsinstrid"]}:`
      );
      // prettier-ignore
      log.d(
        LogConstants.TAG_CALIBRATION,
        printTable(assetfunction, [
          'pluscwodsinstrid',
          'description',
          'asfoundcalstatus',
          'asfounderror',
          'asleftcalstatus',
          'aslefterror',
          'widestTolwidth',
          'widestTol'
        ])
      );
    }

    // Check if we have a mssing or broken status to roll up to
    let missingOrBrokenStatus = CalibrationHelper.checkMissingOrBrokenStatus(datasheetDS.currentItem.pluscwodsinstr, conditionPrefix, this.getDomainCalStatusDS());
    if (missingOrBrokenStatus) {
      datasheetDS.currentItem[`${conditionPrefix}calstatus`] =
        missingOrBrokenStatus;
    }
    
    return this.getDatasheetDS();
  }

  /**
   * Checks for any tolerance error in calibration point and changes
   * the asset function status based on the results.
   *
   * @param {pluscwodsinstr} assetfunction - Asset function data object.
   * @param {pluscwodspoint} calpoints - List of calibration point data objects.
   * @param {CalibrationPointConstants.PREFIXES} condition - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @returns
   */
  _getAssetFunctionStatus(assetfunction, calpoints, condition) {
    let status = DatasheetConstants.STATUS_EMPTY;
    let domaincalstatusDS = this.getDomainCalStatusDS();

    // Asset function is calibration point
    if (assetfunction.calpoint === true) {
      // Calibration points
      status = SynonymDomain.resolveToDefaultExternal(
        domaincalstatusDS,
        DatasheetConstants.STATUS_PASS
      );

      let maxtolexceeded = null;

      for (let i = 0; i < calpoints.length; i++) {
        const point = calpoints[i];

        // Skip point if there are no errors set
        if (!point.asfounderror && !point.aslefterror) {
          // TODO: GRAPHITE-73090 fix: should calculate calibration point asfounderror and aslefterror values
          continue;
        }

        const tolindex = this._getMaxToleranceExceeded(point, condition);

        if (tolindex > maxtolexceeded) {
          // if a higher tolerance has exceeded
          // get status from assetfuction tolXstatus

          // TODO: GRAPHITE-73091 fix: where do assetfunction.tolXstatus is calculated? // status = point[`${condition}status`];

          /**
           * This assignment might affect one of these attributes:
           * @alias assetfunction.tol1status
           * @alias assetfunction.tol2status
           * @alias assetfunction.tol3status
           * @alias assetfunction.tol4status
           */
          status = assetfunction[`tol${tolindex}status`];
          maxtolexceeded = tolindex;

          /**
           * This assignment might affect one of these attributes:
           * @alias assetfunction.tol1uppervalue
           * @alias assetfunction.tol2uppervalue
           * @alias assetfunction.tol3uppervalue
           * @alias assetfunction.tol4uppervalue
           * @alias assetfunction.tol1lowervalue
           * @alias assetfunction.tol2lowervalue
           * @alias assetfunction.tol3lowervalue
           * @alias assetfunction.tol4lowervalue
           */
          const range =
            assetfunction[`tol${maxtolexceeded}uppervalue`] -
            assetfunction[`tol${maxtolexceeded}lowervalue`];

          /**
           * This assignment might affect one of these attributes:
           * @changes assetfunction.widestTolwidth
           * @changes assetfunction.widestTol
           */
          assetfunction.widestTolwidth = range;
          assetfunction.widestTol = maxtolexceeded;
        }
      }

      // Asset function is a calibration function
    } else if (assetfunction.calfunction === true) {
      // Function checks
      for (let i = 0; i < calpoints.length; i++) {
        const point = calpoints[i];

        // If point is incomplete, then there's no status to set.
        /**
         * This statement might affect one of these attributes:
         * @alias calpoint.asfoundfail
         * @alias calpoint.asfoundpass
         * @alias calpoint.asleftfail
         * @alias calpoint.asleftpass
         */
        if (
          point[`${condition}pass`] === false &&
          point[`${condition}fail`] === false
        ) {
          break;
        }

        // If any fail is set, assetfunction calstatus fails
        /**
         * This statement might affect one of these attributes:
         * @alias calpoint.asfoundfail
         * @alias calpoint.asleftfail
         */
        if (point[`${condition}fail`] === true) {
          status = SynonymDomain.resolveToDefaultExternal(
            domaincalstatusDS,
            DatasheetConstants.STATUS_FAIL
          );
          break;
        }

        // If pass is set, status is pass but have to check all points
        /**
         * This statement might affect one of these attributes:
         * @alias calpoint.asfoundpass
         * @alias calpoint.asleftpass
         */
        else if (point[`${condition}pass`] === true) {
          status = SynonymDomain.resolveToDefaultExternal(
            domaincalstatusDS,
            DatasheetConstants.STATUS_PASS
          );
        }
      }
    }

    return status;
  }

  /**
   * Find index of the last tolerance error that exceeded threshold.
   * @param {item} point - Instance of 'pluscwodspoint' datasource.
   * @param {CalibrationPointConstants.PREFIXES} conditionPrefix - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @returns Number - Index of the last exceeded tolerance.
   */
  _getMaxToleranceExceeded(point, conditionPrefix) {
    const locale = this.getLocale();

    let maxtolexceeded = null;

    for (let i = 1; i < 5; i++) {
      // Is there a tolerance?
      /**
       * This statement might be related to one of these attributes:
       * @alias calpoint.asfounderror1
       * @alias calpoint.asfounderror2
       * @alias calpoint.asfounderror3
       * @alias calpoint.asfounderror4
       * @alias calpoint.aslefterror1
       * @alias calpoint.aslefterror2
       * @alias calpoint.aslefterror3
       * @alias calpoint.aslefterror4
       */
      const errorStr = String(point[`${conditionPrefix}error${i}`]);
      const error = fromDisplayableValue(errorStr, locale);

      if (this.isErrorCalculated(error)) {
        maxtolexceeded = i;
      }
    }

    return maxtolexceeded;
  }

  /**
   * Returns true if tolerance error value is calculated and higher than zero.
   * @param {Number} error
   * @returns Number
   */
  isErrorCalculated(error) {
    return error != null && Math.abs(error) > 0;
  }

  /**
   * Update status value in datasheet item.
   *
   * @param {*} eventContext - *DEPRECATED* variable.
   * @param {*} datasheetDS - Datasheet datasource reference
   * @param {String} conditionPrefix - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @returns Object Datasheet item object data
   */
  async _updateDataSheetStatus(eventContext, datasheetDS, conditionPrefix) {
    const datasheet = datasheetDS.currentItem;

    if (this.autoUpdateDataSheetStatus()) {
      // Update the data sheet status if all assetfunctions have
      // 'asfoundstatus' and 'asleftstatus'
      const missingStatus = this._checkAFStatuses(
        datasheet.pluscwodsinstr,
        conditionPrefix
      );

      // All asset functions have status set if necessary and auto update
      // is on, then update datasheet status based on asfound or asleft
      // prefix
      if (!missingStatus) {
        const datasheetStatus = this._getDataSheetStatus(
          datasheet.pluscwodsinstr,
          conditionPrefix
        );

        /**
         * This statement might be related to one of these attributes:
         * @alias datasheet.asleftcalstatus
         * @alias datasheet.asfoundcalstatus
         */
        datasheet[`${conditionPrefix}calstatus`] = datasheetStatus;

        await this.setDataSheetStatusNPFields(
          datasheet,
          datasheetStatus,
          conditionPrefix
        );

        return datasheet;
      } else if (
        ![
          DatasheetConstants.STATUS_MISSING,
          DatasheetConstants.STATUS_BROKEN,
        ].includes(datasheet[`${conditionPrefix}calstatus`])
      ) {
        datasheet[`${conditionPrefix}calstatus`] = null;
        datasheet[`${conditionPrefix}statusdesc_np`] = null;
        datasheet[`${conditionPrefix}statusicon_np`] = null;
      }
    }

    return datasheet;
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
  // TODO: GRAPHITE-76799 refactor: add autoUpdateDataSheetStatus function into calibration/utils

  autoUpdateDataSheetStatus() {
    const maxvars = CommonUtil.filterMobileMaxvars(
      DatasheetConstants.PLUSCAUTOSTATUS,
      {
        items: [
          {
            mobilemaxvars: this.getMaxVars(),
          },
        ],
      }
    );

    return Array.isArray(maxvars) && maxvars.length > 0
      ? maxvars[0].varvalue ===
          DatasheetConstants.UPDATE_DATASHEET_STATUS_AUTOMATICALLY
      : true;
  }


  static isWarningMessageShownOnDatasheetChanges(mobilemaxvars) {
    let isWarningShownOnDatasheetChanges = false;
    const [maxvars] = CommonUtil.filterMobileMaxvars(
      DatasheetConstants.PLUSCEDITDATA,
      {
        items: [
          {
            mobilemaxvars,
          },
        ],
      }
    ) || [];
    isWarningShownOnDatasheetChanges = maxvars?.varvalue === DatasheetConstants.SHOW_WARNING_ON_DATASHEET_CHANGES;

    return isWarningShownOnDatasheetChanges;
  }

  static getPluscTolWarnMaxVarValue(mobilemaxvars) {
    const [maxvars] = CommonUtil.filterMobileMaxvars(
      DatasheetConstants.PLUSCTOLWARN,
      {
        items: [
          {
            mobilemaxvars,
          },
        ],
      }
    ) || [];
    return maxvars?.varvalue;
  }

  /**
   * @param {*} datasheet - Datasheet datasource reference
   * @param {*} status - status
   * @param {String} conditionPrefix - String prefix to access data in point instance. Can be "asfound" or "asleft".
   */
  async setDataSheetStatusNPFields(datasheet, status, conditionPrefix) {
    if (status != null) {
      const statusdesc = await this.getStatusDescription(status);
      datasheet[`${conditionPrefix}statusdesc_np`] = statusdesc;

      const statusicon = this.getStatusIcon(status);
      datasheet[`${conditionPrefix}statusicon_np`] = statusicon;
      return;
    }

    datasheet[`${conditionPrefix}statusdesc_np`] = null;
    datasheet[`${conditionPrefix}statusicon_np`] = null;
    return;
  }

  /**
   * getter method for status description
   * @param {*} status - status
   * @returns status description
   */
  async getStatusDescription(status) {
    try {
      const domaincalstatusDS = this.getDomainCalStatusDS();
      if (status && domaincalstatusDS && domaincalstatusDS.items) {
        const maxvalue = SynonymDomain.resolveToInternal(
          domaincalstatusDS,
          status
        );

        const synonym = domaincalstatusDS.items.find( item => (item.maxvalue === maxvalue && item.defaults) );

        if (synonym) {
          return synonym.description;
        }
      }
    } catch (e) {
      log.e("getStatusDescription error\n" + e);
    }

    return null;
  }

  /**
   * getter method for status icon
   * @param {*} status - status
   * @returns status icon
   */
  getStatusIcon(status) {
    let internalStatus = null;

    try {
      internalStatus = SynonymDomain.resolveToInternal(
        this.getDomainCalStatusDS(),
        status
      );

      if (
        internalStatus != null &&
        internalStatus.length > 0 &&
        internalStatus !== DatasheetConstants.STATUS_PASS &&
        internalStatus !== DatasheetConstants.STATUS_FAIL
      ) {
        return DatasheetConstants.STATUS_WARNING;
      }
    } catch (e) {
      log.e("getStatusIcon error\n" + e);
    }

    return internalStatus;
  }

  /**
   * Iterates over datasheet's asset function list in search of any
   * asset function with `calstatus` missing. Returns TRUE if any asset
   * function have its status missing. If all asset function items have
   * status and are not dynamic functions, then return FALSE.
   *
   * @param {Array} assetfunctions - List of asset function items.
   * @param {String} conditionPrefix - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @returns Boolean
   */
  _checkAFStatuses(assetfunctions, conditionPrefix) {
    let missingStatus = false;

    for (let i = 0; i < assetfunctions.length; i++) {
      const assetfunction = assetfunctions[i];

      // Break out if asfound or asleft cal statuses are not set (ignore dynamic checks)
      const isNotDynamic = assetfunction["caldynamic"] === false;

      const calstatusIsEmpty =
        assetfunction[`${conditionPrefix}calstatus`] == null ||
        assetfunction[`${conditionPrefix}calstatus`] === "";

      if (isNotDynamic && calstatusIsEmpty) {
        missingStatus = true;
        break;
      }
    }

    return missingStatus;
  }

  /**
   * Determine datasheet status based on asset function state.
   *
   * @param {Array} assetfunctions - List of asset function items.
   * @param {String} conditionPrefix - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @returns String Returns the datasheet status.
   */
  _getDataSheetStatus(assetfunctions, conditionPrefix) {
    // Get the DataSheet status from the set of asset functions
    const domaincalstatusDS = this.getDomainCalStatusDS();

    let finalStatus = DatasheetConstants.STATUS_PASS;
    let tol = null;

    let missingOrBrokenStatus = CalibrationHelper.checkMissingOrBrokenStatus(
      assetfunctions,
      conditionPrefix,
      domaincalstatusDS
    );
    if (!missingOrBrokenStatus) {
      for (let i = 0; i < assetfunctions.length; i++) {
        const assetfunction = assetfunctions[i];

        const status = SynonymDomain.resolveToInternal(
          domaincalstatusDS,
          assetfunction[`${conditionPrefix}calstatus`]
        );

        // If any asset function status is null, the overall set status
        // (for the data sheet) is null
        if (
          assetfunction.caldynamic === false &&
          [null, undefined].includes(status)
        ) {
          return null;
        }

        // If not a dynamic check and status is either MISSING or BROKEN,
        // datasheet status is same
        if (
          assetfunction.caldynamic === false &&
          [
            DatasheetConstants.STATUS_MISSING,
            DatasheetConstants.STATUS_BROKEN,
          ].includes(status)
        ) {
          finalStatus = status;
          break;
        } else {
          // For calibration points
          if (assetfunction.calpoint) {
            // For each asset function, if the status is not pass, find the tolerance with that status
            if (status !== DatasheetConstants.STATUS_PASS) {
              if (status === DatasheetConstants.STATUS_FAIL) {
                finalStatus = status;
                break;
              } else {
                const tmpTol = this._getToleranceForStatus(
                  assetfunction,
                  conditionPrefix,
                  status
                );

                // If tmpTol > 0, then the tolerance with index of tmpTol.tol was exceeded
                if (tmpTol && tmpTol.tol > 0 && (tol == null || tmpTol.tol > tol.tol)) {
                  tol = tmpTol;
                  finalStatus = tol.status;
                }
              }
            }
          }

          // For function checks
          else if (assetfunction.calfunction === true) {
            // For each asset function, if the status is not pass, set it to fail and return
            if (status !== DatasheetConstants.STATUS_PASS) {
              finalStatus = DatasheetConstants.STATUS_FAIL;
              break;
            }
          }
        }
      }
    } else {
      finalStatus = missingOrBrokenStatus;
    }

    return SynonymDomain.resolveToDefaultExternal(
      domaincalstatusDS,
      finalStatus
    );
  }

  getTmpTol(assetfunction, condition) {
    let maxtolexceeded = null;

    const calpoints = assetfunction.pluscwodspoint;
    for (let i = 0; i < calpoints.length; i++) {
      const point = calpoints[i];

      const tolindex = this._getMaxToleranceExceeded(point, condition);
      if (tolindex > maxtolexceeded) {
        // if a higher tolerance has exceeded
        // get status from assetfuction tolXstatus

        // TODO: GRAPHITE-73091 fix: where do assetfunction.tolXstatus is calculated? // status = point[`${condition}status`];

        /**
         * This assignment might affect one of these attributes:
         * @alias assetfunction.tol1status
         * @alias assetfunction.tol2status
         * @alias assetfunction.tol3status
         * @alias assetfunction.tol4status
         */
        maxtolexceeded = tolindex;

        /**
         * This assignment might affect one of these attributes:
         * @alias assetfunction.tol1uppervalue
         * @alias assetfunction.tol2uppervalue
         * @alias assetfunction.tol3uppervalue
         * @alias assetfunction.tol4uppervalue
         * @alias assetfunction.tol1lowervalue
         * @alias assetfunction.tol2lowervalue
         * @alias assetfunction.tol3lowervalue
         * @alias assetfunction.tol4lowervalue
         */
        const range =
          assetfunction[`tol${maxtolexceeded}uppervalue`] -
          assetfunction[`tol${maxtolexceeded}lowervalue`];

        /**
         * This assignment might affect one of these attributes:
         * @changes assetfunction.widestTolwidth
         * @changes assetfunction.widestTol
         */
        assetfunction.widestTolwidth = range;
        assetfunction.widestTol = maxtolexceeded;
      }
    }
  }

  /**
   * @param {Array} assetfunctions - List of asset function items.
   * @param {String} conditionPrefix - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @param {*} statusValue - status Value
   */
  _getToleranceForStatus(assetfunction, conditionPrefix, statusValue) {
    // return tolerance index, width and status
    // return the tolerance index, width and status
    this.getTmpTol(assetfunction, conditionPrefix);
    return {
      status: statusValue,
      tol: assetfunction.widestTol,
      width: assetfunction.widestTolwidth,
    };
  }

  /**
   * Takes asset function and counts errors and failures in its
   * calibration points list. Returns the total count of errors.
   *
   * @param {Object} assetfunction - pluscwodsinstr data.
   * @param {Array} calibrationpoints - pluscwodspoint array.
   * @param {String} conditionPrefix - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @returns Number
   */
  _setAssetFunctionErrorCount(
    assetfunction,
    calibrationpoints,
    conditionPrefix
  ) {
    let assetErrorsCount = 0;

    for (let i = 0; i < calibrationpoints.length; i++) {
      const point = calibrationpoints[i];

      if (point[`${conditionPrefix}error`] || point[`${conditionPrefix}fail`]) {
        assetErrorsCount++;
      }
    }

    /**
     * This assignment might affect one of these attributes:
     * @changes assetfunction.asfounderror
     * @changes assetfunction.aslefterror
     */
    assetfunction[`${conditionPrefix}error`] = Number(assetErrorsCount);

    return assetErrorsCount;
  }

  /**
   * Displays warning message as a toast.
   *
   * @param {*} eventContext - *DEPRECATED* variable.
   * @param {CalibrationPointConstants.PREFIXES} conditionPrefix - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @param {Object} assetfunction - pluscwodsinstr data.
   * @returns Boolean - Returns whether the toast was invoked or not.
   */
  _showStatusMessage(eventContext, conditionPrefix, assetfunction) {
    const status = assetfunction[`${conditionPrefix}calstatus`];
    if (status != null) {
      const app = this.getDatasheetDS().getApplication();

      app.toast(
        app.getLocalizedLabel(
          "assetfunction_showstatus",
          `Asset function status is ${status}`
        ),
        "success" // TODO: GRAPHITE-73089 fix: should be "error" when status is "FAIL"
      );

      return true;
    }

    return false;
  }

  /**
   * Perform calculations for non-repeating points.
   * @param {String} prefix - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @returns {boolean|null}
   */
  // TODO: lines below need to be reviewed and unit tested
  performCalculationForCalPoint(calpoint, prefix) {
    const instr = this.getAssetFunctionDS().currentItem;

    // Datasheet Calculation
    if (!instr.repeatable) {
      // Datasheet Calculation
      const locale = this.getLocale();
      const dsconfigDS = this.getDsconfigDS();
      const calc = new DataSheetCalculation(dsconfigDS.currentItem, locale, this.getDomainCalStatusDS());
      return calc.calculateTolForAnalogOrDiscrete(prefix, calpoint, instr);
    }

    return null;
  }

  /**
   * Perform calculations for repeating points
   * @param {Array} calpoints - Calibration point data as an Array of ProxyObject.
   * @param {String} condition - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @returns {ProxyObject} avgpoint - Returns updated average calibration point.
   */
  performCalculationForRepeatables(calpoints, condition) {
    /** @type {CalibrationAverageRecord} */
    const calpointAvgRecord = this.getCalibrationAverageRecord(calpoints);
    const avgpoint = calpointAvgRecord.getAvgCalpoint();
    const assocpoints = calpointAvgRecord.getAssociatedCalpoints();

    // prettier-ignore
    /* istanbul ignore next */
    if (log.isDebug()) {
      log.d(
        LogConstants.TAG_CALIBRATION,
        "Performing calculations for repeatable points:" +
          printTable({
            "condition"  : condition,
            "calpoints"  : calpoints.length > 0 ? `${calpoints.length} calpoints found` : "empty",
            "avgpoint"   : avgpoint ? "1 avgpoint found" : "Not found",
            "assocpoints": assocpoints.length > 0 ? `${assocpoints.length} assocpoints found` : "empty",
          })
      );
    }


    const dsconfigDS = this.getDsconfigDS();
    const locale = this.getLocale();

    const calc = new DataSheetCalculation(dsconfigDS.currentItem, locale, this.getDomainCalStatusDS());
    
    const assetFunctionDS = this.getAssetFunctionDS();
    const instr = assetFunctionDS.currentItem;

    // Calculate average and standard deviation.
    // Results should be saved back into avgpoint.
    calc.calculateAvgAndStdDeviation(condition, assocpoints, avgpoint, instr);
    
    // Calculate tolerance values for either Analog or Discrete points.
    // Results should be saved back into avgpoint.
    assocpoints.forEach((assocpoint) => {
      calc.calculateTolForAnalogOrDiscrete(condition, assocpoint, instr);
    });

    calc.calculateTolForAnalogOrDiscrete(condition, avgpoint, instr);

    // prettier-ignore
    /* istanbul ignore next */
    if (log.isDebug()) {
      log.d(
        LogConstants.TAG_CALIBRATION,
        "Avgpoint tolerance errors:" +
          printTable({
            "Tolerance 1": `From: ${avgpoint.asfoundtol1lower} | To: ${avgpoint.asfoundtol1upper} | Error: ${avgpoint.asfounderror1}`,
            "Tolerance 2": `From: ${avgpoint.asfoundtol2lower} | To: ${avgpoint.asfoundtol2upper} | Error: ${avgpoint.asfounderror2}`,
            "Tolerance 3": `From: ${avgpoint.asfoundtol3lower} | To: ${avgpoint.asfoundtol3upper} | Error: ${avgpoint.asfounderror3}`,
            "Tolerance 4": `From: ${avgpoint.asfoundtol4lower} | To: ${avgpoint.asfoundtol4upper} | Error: ${avgpoint.asfounderror4}`
          })
      );
    }

    return avgpoint;
  }

  /**
   * Find the calibration point marked as "isaverage" which will store all calculations,
   * and all other points associated to it.
   *
   * @param {Array} points - List of calibration points as Array<ProxyObject>.
   * @returns {CalibrationAverageRecord} - Return object holding the average point and all points associated to it.
   */
  /* istanbul ignore next */
  // TODO: GRAPHITE-75662 fix: method getCalibrationAverageRecord is obsolete in CalibrationPointHandler
  getCalibrationAverageRecord(points) {
    const calpoint = points[0]; // Using first point of the list to filter collection

    let avgpoint = null;
    let assocpoints = [];

    if (calpoint.wonum === null) {
      if (calpoint.revisionnum === null) {
        avgpoint = points.find(
          (point) =>
            point.dsplannum === calpoint.dsplannum &&
            point.instrseq === calpoint.instreq &&
            point.point === calpoint.point &&
            point.isaverage === true
        );

        assocpoints = points.filter(
          (point) =>
            point.dsplannum === calpoint.dsplannum &&
            point.instrseq === calpoint.instreq &&
            point.point === calpoint.point &&
            point.isaverage === false
        );

        // Find by revisionnum
      } else {
        avgpoint = points.find(
          (point) =>
            point.revisionnum === calpoint.revisionnum &&
            point.dsplannum === calpoint.dsplannum &&
            point.instrseq === calpoint.instrseq &&
            point.point === calpoint.point &&
            point.isaverage === true
        );

        assocpoints = points.filter(
          (point) =>
            point.revisionnum === calpoint.revisionnum &&
            point.dsplannum === calpoint.dsplannum &&
            point.instrseq === calpoint.instrseq &&
            point.point === calpoint.point &&
            point.isaverage === false
        );
      }

      // Find by wonum
    } else {
      avgpoint = points.find(
        (point) =>
          point.wonum === calpoint.wonum &&
          point.revisionnum === calpoint.revisionnum &&
          point.dsplannum === calpoint.dsplannum &&
          point.instrseq === calpoint.instrseq &&
          point.siteid === calpoint.siteid &&
          point.point === calpoint.point &&
          point.isaverage === true
      );

      assocpoints = points.filter(
        (point) =>
          point.wonum === calpoint.wonum &&
          point.siteid === calpoint.siteid &&
          point.dsplannum === calpoint.dsplannum &&
          point.revisionnum === calpoint.revisionnum &&
          point.instrseq === calpoint.instrseq &&
          point.point === calpoint.point &&
          point.isaverage === false
      );
    }

    return new CalibrationAverageRecord(avgpoint, assocpoints);
  }

  /**
   * Modifies calpoint attributes to clear attributes before start
   * calculations.
   *
   * Accessing the properties directly instead of mapping through it.
   * We want to preserve the ProxyObject and use fewer variables to
   * access the properties.
   *
   * Instead of using a map with property variables, like this:
   * ```js
   *   const attributes = ['error1', 'error2' ...];
   *   attributes.forEach(attr => {
   *     calpoint[`${prefix}${attr}`] = null;
   *   })
   * ```
   *
   * I found that doing this:
   * ```js
   * calpoint[`${prefix}statusicon`] = null;
   * calpoint[`${prefix}statusdesc`] = null;
   * ...
   * ```
   *
   * Is helpful in two ways:
   *
   * 1. It is easier to search where a certain property is being
   *    mentioned and assigned. For example: apply the term
   *    `/calpoint.*status.*=/gm` to find "where"
   * 2. We can assign any value we want in a single row instead of creating two loops to assign "null" or "false".
   *
   * @param {ProxyObject} calpoint - Calibration point data.
   * @param {String} prefix - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @returns void
   */
  clearAttributes(calpoint, prefix) {
    // Attributes that needs to be cleared
    calpoint[`${prefix}statusicon`] = null;
    calpoint[`${prefix}statusdesc`] = null;
    calpoint[`${prefix}status`] = null;
    calpoint[`${prefix}pass`] = false;
    calpoint[`${prefix}fail`] = false;
    calpoint[`${prefix}error`] = false;
    calpoint[`${prefix}error1`] = null;
    calpoint[`${prefix}error2`] = null;
    calpoint[`${prefix}error3`] = null;
    calpoint[`${prefix}error4`] = null;
    calpoint[`${prefix}outerror`] = null;
    calpoint[`${prefix}proerror`] = null;
    calpoint[`${prefix}tol1lworig`] = null;
    calpoint[`${prefix}tol2lworig`] = null;
    calpoint[`${prefix}tol3lworig`] = null;
    calpoint[`${prefix}tol4lworig`] = null;
    calpoint[`${prefix}tol1uporig`] = null;
    calpoint[`${prefix}tol2uporig`] = null;
    calpoint[`${prefix}tol3uporig`] = null;
    calpoint[`${prefix}tol4uporig`] = null;
    calpoint[`${prefix}tol1lower`] = null;
    calpoint[`${prefix}tol2lower`] = null;
    calpoint[`${prefix}tol3lower`] = null;
    calpoint[`${prefix}tol4lower`] = null;
    calpoint[`${prefix}tol1upper`] = null;
    calpoint[`${prefix}tol2upper`] = null;
    calpoint[`${prefix}tol3upper`] = null;
    calpoint[`${prefix}tol4upper`] = null;

    return calpoint;
  }

  // only checks that as found entries are valid and pass group validation

  enableGroupCompleteReadingsAsFound() {
    let groupValidation = true;
    this.enableCompleteReadingsButton(false, groupValidation);
  }

  // checks that both as found and as left entries are valid and pass group validation

  enableGroupCompleteReadingsAsLeft() {
    let groupValidation = true;
    this.enableCompleteReadingsButton(true, groupValidation);
  }

  // only checks that as found entries are valid and pass validation

  enableCompleteReadingsAsFound() {
    this.enableCompleteReadingsButton(false);
  }

  // checks that both as found and as left entries are valid and pass validation

  enableCompleteReadingsAsLeft() {
    this.enableCompleteReadingsButton(true);
  }

  /**
   * checks that both as found and as left entries are valid and pass validation
   * @param {ProxyObject} checkAsLeft - check as left data
   * @param {String} groupValidation - check group validation.
   * @returns void
   */

  enableCompleteReadingsButton(checkAsLeft, groupValidation) {
    // let datasheet = this.getDatasheetDS();
    let assetfunc = this.getAssetFunctionDS().currentItem;
    let pointSet = this.getCalpointsDS();

    //Somehow this get called when we add a new record to calibration pointlist resource
    //Detecting this and not processsing further.
    if (assetfunc.newPoint) return;
    let enable = true;

    if (!Object.keys(pointSet).length) {
      // || !this.validateWorkOrderStatus(calpoint)
      enable = false;
    }
    // if checkAsLeft == false, only check asfound.  if checkAsLeft == true, check asfound AND asleft
    else if (assetfunc.calfunction === true) {
      // function checks
      if (!checkAsLeft) {
        enable = this.areFunctionChecksComplete(pointSet, "asfound");
      } else {
        enable = this.areFunctionChecksComplete(pointSet, "asleft");
      }
    } else if (assetfunc.caldynamic === true) {
      // dynamic checks
      if (!checkAsLeft) {
        enable = this.areDynamicChecksComplete(pointSet, "asfound");
      } else {
        enable = this.areDynamicChecksComplete(pointSet, "asleft");
      }
    } else if (assetfunc.calpoint === true) {
      // calibration points
      if (groupValidation) {
        if (!checkAsLeft) {
          enable = this.areGroupCalPointsComplete(
            pointSet,
            "asfound",
            assetfunc
          );
        } else {
          enable = this.areGroupCalPointsComplete(
            pointSet,
            "asleft",
            assetfunc
          );
        }
      } else {
        if (!checkAsLeft) {
          enable = this.areCalPointsComplete(pointSet, "asfound");
        } else {
          enable = this.areCalPointsComplete(pointSet, "asleft");
        }
      }
    }

    return enable;
  }

  /**
   * validate output values
   * @param {ProxyObject} ds - pluscwods data
   * @param domainCalStatus - synonym domain status
   * @param {ProxyObject} instr - Asset function data.
   * @param {String} prefix - String prefix to access data in point instance. Can be "asfound" or "asleft".
   */
  checkMissingOrBroken(ds, instr, prefix, domainCalStatus) {
    let dsstatus = SynonymDomain.resolveToInternal(
      domainCalStatus,
      ds[prefix + "calstatus"]
    );
    let instrstatus = SynonymDomain.resolveToInternal(
      domainCalStatus,
      instr[prefix + "calstatus"]
    );
    let dsMissingOrBroken = dsstatus === "MISSING" || dsstatus === "BROKEN";
    let instrMissingOrBroken =
      instrstatus === "MISSING" || instrstatus === "BROKEN";
    return dsMissingOrBroken || instrMissingOrBroken;
  }

  // loop through points to see if all of the checks are valid - reading is complete

  areFunctionChecksComplete(pointSet, prefix) {
    let complete = true;
    if (prefix != null) {
      pointSet.items.forEach((point) => {
        if (!this.isFuncCheckValid(point, prefix)) {
          // neither has been clicked
          complete = false;
          return;
        }
      });
    }
    return complete;
  }

  areDynamicChecksComplete(pointSet, prefix) {
    let complete = true;
    if (prefix != null) {
      pointSet.items.forEach((point) => {
        if (!this.isDynCheckValid(point, prefix)) {
          // neither has been clicked
          complete = false;
          return;
        }
      });
    }
    return complete;
  }

  // validate a group of cal points based on asset funcion

  areGroupCalPointsComplete(pointSet, prefix, assetfunc) {
    let complete = true;
    if (prefix != null) {
      pointSet.items.forEach((point) => {
        if (
          assetfunc === point.assetfunction &&
          !this.isCalPointValid(point, prefix)
        ) {
          complete = false;
          return;
        }
      });
    }
    return complete;
  }

  areCalPointsComplete(pointSet, prefix) {
    let complete = true;
    if (prefix != null) {
      pointSet.items.forEach((point) => {
        if (!this.isCalPointValid(point, prefix)) {
          complete = false;
          return;
        }
      });
    }

    return complete;
  }

  // check if the point has the correct values set to be considered a valid point

  isPointValid(assetFunction, point, prefix) {
    let valid = false;
    if (assetFunction.calpoint === true) {
      valid = this.isCalPointValid(point, prefix);
    } else if (assetFunction.calfunction === true) {
      valid = this.isFuncCheckValid(point, prefix);
    } else if (assetFunction.caldynamic === true) {
      valid = this.isDynCheckValid(point, prefix);
    }
    return valid;
  }

  isCalPointValid(point, prefix) {
    // calpoint - analog has asfound/asleft input and output, discrete has asfound/asleft setpoint
    if (
      (point[prefix + "input"] && point[prefix + "output"]) ||
      point[prefix + "setpoint"]
    ) {
      return true;
    }
    return false;
  }

  isDynCheckValid(point, prefix) {
    // caldynamic - has asfound/asleft input and unit
    if (point[prefix + "input"] != null && point[prefix + "unit"] != null) {
      return true;
    }
    return false;
  }

  isFuncCheckValid(point, prefix) {
    // calfunction - has asfound/asleft pass or fail
    if (point[prefix + "pass"] === true || point[prefix + "fail"] === true) {
      // one has been clicked
      return true;
    }
    return false;
  }

  /**
   * Perform calculations.
   * @param {ProxyObject} calpoint - Calibration point data.
   * @param {String} prefix - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @returns void
   */

  async performCalculation(calpoint, prefix) {
    const assetfunction = this.getAssetFunctionDS().currentItem;

    // Clear the calibration attributes
    if (prefix) {
      this.clearAttributes(calpoint, prefix);
    }

    if (calpoint.plantype === CalibrationPointConstants.PLANTYPE.ANALOG) {
      if (calpoint[`${prefix}output`] === "") {
        calpoint[`${prefix}output`] = null;
      }

      if (calpoint[`${prefix}input`] === "") {
        calpoint[`${prefix}input`] = null;
      }

      // If nonlinear, both fields should be filled
      // before calculating the tolerances
      if (assetfunction.nonlinear) {
        if (
          calpoint[`${prefix}input`] != null &&
          calpoint[`${prefix}output`] != null
        ) {
          this.performCalculationForCalPoint(calpoint, prefix);
        }

        // Asset function is linear
      } else {
        // Not checking for output field, since input not filled. Do nothing.
        if (calpoint[`${prefix}input`] != null) {
          this.performCalculationForCalPoint(calpoint, prefix);
        }
      }

      // Calibration point is DISCRETE
    } else if (
      calpoint.plantype === CalibrationPointConstants.PLANTYPE.DISCRETE
    ) {
      if (calpoint[`${prefix}setpoint`] === "") {
        calpoint[`${prefix}setpoint`] = null;
      }

      if (calpoint[`${prefix}setpoint`] != null) {
        this.performCalculationForCalPoint(calpoint, prefix);
      }
    }

    // Enable complete readings
    if (prefix === CalibrationPointConstants.CONDITION_ASFOUND) {
      this.enableCompleteReadingsAsFound();
    } else {
      this.enableCompleteReadingsAsLeft();
    }

    return;
  }

  /**
   * Raise toast. Wrapper to app.toast() function.
   * @param {String} messageKey
   * @param {String} fallbackMessage
   * @returns void
   */
  /* istanbul ignore next */
  raiseToast(messageKey, fallbackMessage, type = "success") {
    const app = this.getDatasheetDS().getApplication();
    app.toast(app.getLocalizedLabel(messageKey, fallbackMessage), type);
  }

  /**
   * Checks for any standard deviation error in calibration point and changes
   * the asset function status based on the results. In case of negative standnard deviation error
   * the asset function status marked as FAIL otherwise status would be calculated based on tolerance
   *
   * @param {pluscwodsinstr} assetfunction - Asset function data object.
   * @param {pluscwodspoint} calpoints - List of calibration point data objects.
   * @param {CalibrationPointConstants.PREFIXES} condition - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @returns
   */
  _getAssetFunctionStatusByStandardDeviation(assetfunction, calpoints, condition) {
    
    for (let i = 0; i < calpoints.length; i++) {
      const point = calpoints[i];
      if(point.isaverage && (point[`${condition}inputstddeverror`] < 0 || 
        point[`${condition}outputstddeverror`] < 0 ||
        point[`${condition}setpointstddeverror`] < 0)
      ){
        return DatasheetConstants.STATUS_FAIL;
      }
    }
    
    return this._getAssetFunctionStatus(
      assetfunction,
      calpoints,
      condition
    );
  }
}

export default CalibrationPointHandler;
