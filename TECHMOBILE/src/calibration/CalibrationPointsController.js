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
import CalibrationPointConstants from "./rules/constants/CalibrationPointConstants";
import DatasheetConstants from "./rules/constants/DatasheetConstants";
import UnitLookupConstants from "./utils/constants/UnitLookupConstants";
import DatasourceConstants from "./rules/constants/DatasourceConstants";

/** Handlers */
import CalibrationPointHandler from "./rules/handlers/CalibrationPointHandler";

/** Helpers */
import DatasheetCalculation from "./rules/helpers/DatasheetCalculation";
import CalibrationAsFoundUnitLookupHelper from "./utils/CalibrationAsFoundUnitLookupHelper";
import CalibrationAsLeftUnitLookupHelper from "./utils/CalibrationAsLeftUnitLookupHelper";
import CalibrationHelper from "./utils/CalibrationHelper";

/** Utils */
import defaults from "./rules/utils/defaults";
import fromDisplayableValue from "./rules/utils/numberFormatter/fromDisplayableValue";
import parseBool from "./utils/parseBool";
import toDisplayableValue from "./rules/utils/numberFormatter/toDisplayableValue";
import Message from "../utils/Message";
import decimalPlacesOf from "./rules/utils/numberFormatter/decimalPlacesOf";

/** Controllers */
import BaseController from "./BaseController";

import isEmpty from "./rules/utils/numberFormatter/isEmpty";
import LocaleNumberUtil from './utils/LocaleNumberUtil';
import SynonymDomain from "./rules/models/SynonymDomain";

/**
 * CalibrationPointsController
 *
 * @typedef {import('@maximo/maximo-js-api').Page} Page
 * @typedef {import('@maximo/maximo-js-api').Application} Application
 * @typedef {import('@maximo/maximo-js-api').Datasource} Datasource
 */
class CalibrationPointsController extends BaseController {
  /**
   * Datasheet configuration datasource.
   * @private
   */
  dsconfig = null;

  pageInitialized(page, app) {
    this.app = app;
    this.page = page;
  }

  async pageResumed(page, app) {
    this.page = page;
    this.app = app;

    this.page.state.pendingToleranceCalculationSet = new Set();

    // Loading component helpers
    this.asFoundhelper = new CalibrationAsFoundUnitLookupHelper(app, page);
    this.asLefthelper = new CalibrationAsLeftUnitLookupHelper(app, page);
    this.calibrationHelper = new CalibrationHelper(app, page);

    // Ignore fields have to be added to parent
    const datasheetDS = this.getDatasheetDS();
    datasheetDS.addIgnoreField('showWarningOnInputChange');
    datasheetDS.addIgnoreField('showWarningOnOutputChange');
    datasheetDS.addIgnoreField('isCalibrationOutputValueExceeded');
    datasheetDS.addIgnoreField('isDeleting');

    // istanbul ignore next
    this.page.state.asserterror = false;
    this.page.state.calDynamicFlag = parseBool(page.params.caldynamic);
    this.page.state.calFunctionFlag = parseBool(page.params.calfunction);
    this.page.state.calPointFlag = parseBool(page.params.calpoint);
    this.page.state.calpointtitle = page.params.calpointtitle;
    this.page.state.instr = page.params.item;
    this.page.state.instrcalrangeeu = page.params.instrcalrangeeu;
    this.page.state.inputprecision = page.params.inputprecision;
    this.page.state.outputprecision = page.params.outputprecision;
    this.page.state.isNoAdjMadeEnabled = page.params.noadjmade;
    this.page.state.instroutrangeeu = page.params.instroutrangeeu;
    this.page.state.asfoundcalstatus = page.params.asfoundcalstatus;
    this.page.state.asfoundcallabel = this.setLabelColor(
      this.page.state.asfoundcalstatus
    );
    this.page.state.asleftcalstatus = page.params.asleftcalstatus;
    this.page.state.asleftcallabel = this.setLabelColor(
      this.page.state.asleftcalstatus
    );
    this.page.state.toleranceMissingLabel = this.app.getLocalizedLabel(
      "missed_tolerances_range",
      `Out of range`
    );

    this.page.state.assetFunctionTypePointLabel = this.getAssetFunctionTypePointLabel();

    // Initialize maps that will store the list of field IDs with validation errors.
    this.page.state.shownumbererror = {};
    this.page.state.showlengtherror = {};
    this.page.state.showerror = {};
    this.isWarningShownOnDatasheetChanges = CalibrationPointHandler.isWarningMessageShownOnDatasheetChanges(this.getMaxVars());
    this.pluscTolWarnValue = CalibrationPointHandler.getPluscTolWarnMaxVarValue(this.getMaxVars());

    this.setDirty(false);

    // Calculating initial status for each calibration point
    await this.calculateInitialStatus(app);

    // Set properties
    this.dsconfig = await this.loadDsConfig(app.state.assetFunctionsDetailsDS);
  }

  /**
   * Setter for label color
   * @param {String} status : PASS, FAIL, UNDEFINED
   * @returns {any}
   */
  //TODO: add this function into utlity class
  /* istanbul ignore next */
  setLabelColor(status) {
    const status_maxvalue = SynonymDomain.resolveToInternal(this.getDomainCalStatusDS(), status);

    switch (status_maxvalue) {
      case 'FAIL':
        return 'red';
      case 'PASS':
        return 'green';
      default:
        return "grey";
    }
  }

  /**
   * Setter
   * @param {Number} pointId
   * @param {String} whichFieldTypeChanged
   * @param {Boolean} value
   * @returns {any}
   */
  setNumberError(pointId, whichFieldTypeChanged, value) {
    // Create unique ID for field with pointID and the suffix "input"/"output"
    const id = "" + pointId + "-" + whichFieldTypeChanged;

    if (value) {
      // Add field ID to the list of errors
      this.page.state.shownumbererror[id] = true;
    } else {
      // Remove field ID to the list of errors
      delete this.page.state.shownumbererror[id];
    }
  }
  /**
   * 
   * @param {*} error 
   * @returns {Boolean}
   */

  isToleranceWarningShownOnTabOut(error, isDataValid) {
      const isToleranceWarning = DatasheetConstants.VALIDATE_TOLERANCE_ON_TAB_OUT === this.pluscTolWarnValue && error && !isDataValid;
      return isToleranceWarning;
  }

  /**
   * Setter
   * @param {Number} pointId
   * @param {String} whichFieldTypeChanged
   * @param {Boolean} value
   * @returns {any}
   */
  setLengthError(pointId, whichFieldTypeChanged, value) {
    // Create unique ID for field with pointID and the suffix "input"/"output"
    const id = "" + pointId + "-" + whichFieldTypeChanged;

    if (value) {
      // Add field ID to the list of errors
      this.page.state.showlengtherror[id] = true;
    } else {
      // Remove field ID to the list of errors
      delete this.page.state.showlengtherror[id];
    }
  }

  /**
   * Setter
   * @param {Number} pointId
   * @param {String} whichFieldTypeChanged
   * @param {Boolean} value
   * @returns {any}
   */
  setInputError(pointId, whichFieldTypeChanged, value) {
    // Create unique ID for field with pointID and the suffix "input"/"output"
    const id = "" + pointId + "-" + whichFieldTypeChanged;

    if (value) {
      // Add field ID to the list of errors
      this.page.state.showerror[id] = true;
    } else {
      // Remove field ID to the list of errors
      delete this.page.state.showerror[id];
    }
  }

  /**
   * Getter
   * @returns {Boolean}
   */
  getNumberError() {
    // Return true if the error list is not empty
    return Object.keys(this.page.state.shownumbererror).length > 0;
  }

  /**
   * Getter
   * @returns {Boolean}
   */
  getLengthError() {
    // Return true if the error list is not empty
    return Object.keys(this.page.state.showlengtherror).length > 0;
  }

  /**
   * Getter
   * @returns {Boolean}
   */
  getInputError() {
    // Return true if the error list is not empty
    return Object.keys(this.page.state.showerror).length > 0;
  }

  /**
   * Load Max Vars as array.
   * @returns {Object} Return hash set where key = varname and value = varvalue.
   */
  getMaxVars() {
    return this.getDefaultSetDS().currentItem?.mobilemaxvars;
  }

  /**
   * Returns defaultSetDS reference.
   * @returns {Datasource}.
   */
  getDefaultSetDS() {
    return this.app.findDatasource("defaultSetDs");
  }

  /**
   * Setter
   * @param {String} input
   * @param {String} message : Error message to show
   * @returns {any}
   */
  /* istanbul ignore next */
  setCalPointDsWarning(input, message, whichFieldTypeChanged) {
    const field = this.getModifiedFieldName(
      input.plantype,
      whichFieldTypeChanged
    );
    this.app.state.calpointsds.setWarning(input, field, message);
  }

  /**
   * Setter
   * @param {String} input
   * @param {String} field : Field on which to clear the input
   * @returns {any}
   */
  /* istanbul ignore next */
  clearCalPointDsWarning(input, field) {
    const calibrationPointsDS = this.getCalibrationPointsDS();

    if (calibrationPointsDS) {
      calibrationPointsDS.clearWarnings(input, field);
    }
  }

  /**
   * Click event when user chooses to save changes in "go back" dialog
   * before navigating back.
   *
   * @returns void
   */
  async saveChanges() {
    // Call saveUpdate to save changes
    await this.saveUpdate();

    // Reset state variable
    this.setDirty(false);

    // Go back to previous page
    if(this.page.state.isCalledFromAddDeleteCalibrationPoint) {
      this.continueAddOrDeleteCalibrationPoint();
    } else {
      this.app.navigateBack();
    }
  }
  
  undoChanges() {
    const ds = this.getDatasheetDS();
    ds.undoAll();
    this.setDirty(false);
  }

  /**
   * Discard changes in calibration point page and go back to
   * asset function.
   *
   * @returns void
   */
  discardChanges() {
    this.undoChanges();
    const datasheetDS = this.getDatasheetDS();
    const item = datasheetDS.item;
    this.page.state.loading = false;
    if (this.page.state.isCalledFromAddDeleteCalibrationPoint) {
      this.continueAddOrDeleteCalibrationPoint();
    } else {
      // Go to asset functions page
      this.app.setCurrentPage({
        name: "assetfunctions",
        resetScroll: true,
        params: defaults(
          {
            assetfunctiontitle: `${item.dsplannum} ${item.description}`,
            assetrevisionnum: `${item.revisionnum}`,
            wodsnum: item.wodsnum,
          },
          this.page.params
        ),
      });
    }

  }


  // TODO: GRAPHITE-73087 fix: should calculateToleranceErrors onAfterDataLoad when opening calibrationpoint.xml pages

  /**
   * Returns reference to asset function datasource.
   *
   * @returns {Datasource} - Returns reference to asset function datasource.
   */
  getAssetFunctionDS() {
    return this.app.state.assetFunctionsDetailsDS;
  }

  getCalibrationPointsDS() {
    return this.app.state.calpointsds;
  }

  /**
   * Returns datasheetDS reference.
   * @returns {Datasource}
   */
  getDatasheetDS() {
    const datasheetDS = this.app.findDatasource("pluscWoDs");
    return datasheetDS;
  }

  getDomainCalStatusDS() {
    return this.app.findDatasource("domaincalstatusds");
  }

  getDsConfig() {
    return this.dsconfig;
  }

  /**
   * Accessing the condition of calibration points the user wants to
   * access. This parameter is provided in AssetFunctionsController when
   * user clicks to open the calibration points page.
   *
   * It can be "As Found" ("asfound") or "As Left" ("asleft").
   *
   * @returns {String}
   */
  getConditionPrefix() {
    return this.page.params.condition;
  }


  /**
   * Sets flag to indicate the data changed.
   *
   * When the user changes any form (calpoint, calfunction, caldynamic),
   * we set `isdirty=True` to indicate the "data is dirty, changed".
   * If the user tries to go back, we use this flag to whether the app
   * should ask to discard/save or not.
   *
   * This flag is also used to enable the "save" button.
   * When something changes, we enable the button to allow the user to
   * save the data.
   *
   * @param {Boolean} isdirty
   * @returns void
   */
  setDirty(isDirty) {
    this.page.state.isdirty = isDirty;
  }

  /**
   * If calibration point data changed, then we call the data is "dirty".
   *
   * When the user changes any form (calpoint, calfunction, caldynamic),
   * we set `isdirty=True` to indicate the "data is dirty, changed".
   * If the user tries to go back, we use this flag to whether the app
   * should ask to discard/save or not.
   *
   * This flag is also used to enable the "save" button.
   * When something changes, we enable the button to allow the user to
   * save the data.
   *
   * @returns {Boolean} - Returns whether data changed or not.
   */
  isDirty() {
    return this.page.state.isdirty;
  }

  async goBack() {
    const isDirty = this.isDirty();

    if (isDirty) {
      this.page.showDialog("saveDiscardRules");
    } else {
      this.undoChanges(); // undo changes from calculateInitialStatus()
      this.app.navigateBack();
    }
  }

  /* istanbul ignore next */
  async goBackfromleft() {
    const isDirty = this.isDirty();

    if (isDirty) {
      this.page.showDialog("saveAsLeftDiscardRules");
    } else {
      this.undoChanges(); // undo changes from calculateInitialStatus()
      this.app.navigateBack();
    }
  }

  /**
   * Calculate initial status for each calibration point in the list.
   *
   * @param {Application} app - Application reference.
   * @returns Boolean - Returns true if calibration point were initialized.
   */
  async calculateInitialStatus(app) {
    const assetFunctionDS = app.state.assetFunctionsDetailsDS;

    // Map all calibration points
    // istanbul ignore next
    if (assetFunctionDS) {
      const dsconfig = await this.loadDsConfig(assetFunctionDS);
      const domaincalstatusds = app.findDatasource("domaincalstatusds");

      const item = assetFunctionDS.currentItem;
      const calpointsds = this.getCalibrationPointsDS();

      // Datasheet Calculation
      const calc = new DatasheetCalculation(dsconfig.currentItem, this.getLocale(), this.getDomainCalStatusDS());

      // Initialize all calibration points
      if (calpointsds) {
        calpointsds.items.forEach((calpoint) => {
          calpoint.showWarningOnInputChange = false;
          calpoint.showWarningOnOutputChange = false;
          calc.calculateInitialStatus(
            CalibrationPointConstants.CONDITION_ASFOUND,
            calpoint,
            item,
            domaincalstatusds
          );
        });

        return true;
      }

      return false;
    }

    return false;
  }

  /**
   * Load #dsconfig datasource.
   * @param {Datasource} assetfunctionDS
   * @returns {Datasource}
   */
  async loadDsConfig(assetfunctionDS) {
    const dsconfig = this.app.findDatasource("dsconfig");

    dsconfig.clearState();
    dsconfig.resetState();

    if (assetfunctionDS?.currentItem) {
      const { dsplannum, revisionnum } = assetfunctionDS.currentItem;
      await dsconfig.load({
        qbe: { dsplannum, revisionnum },
      });
    } else {
      await dsconfig.load();
    }

    return dsconfig;
  }

  //istanbul ignore next
  toggleAssert() {
    this.page.state.asserterror = !this.page.state.asserterror;
  }

  async openTypeLookup(event) {
    this.page.state.changeText = event.changeText;
    this.page.state.currentItem = event.item;

    if (event.changeText === UnitLookupConstants.CONDITION_ASLEFTUNIT) {
      await this.asLefthelper.openUnitLookup();
    } else {
      await this.asFoundhelper.openUnitLookup();
    }
  }

  /**
   * Select Unit the calibration point will be measure with.
   * Examples: Celsius, Fahrenheit, Lbs, etc.
   *
   * @param {ProxyObject} itemSelected - Unit selected by user.
   * @returns void
   */
  //istanbul ignore next
  async selectUnits(itemSelected) {
    this.page.state.selectedValue = itemSelected.value;

    /**
     * Calibration point attribute that will be changed.
     * @alias asleftunit
     * @alias asfoundunit
     */
    const attributeName = this.page.state.changeText;

    const calpoint = this.page.state.currentItem;

    calpoint[attributeName] = itemSelected.value;

    //istanbul ignore else
    if (!itemSelected._selected) {
      this.page.state.selectedValue = "";
    }

    this.setDirty(true);
  }

  /* ------------------------------------------------------------------ */
  /*                                                                    */
  /* Event Handlers                                                     */
  /*                                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Save and update custom transation.
   * @returns {Object} Returns whether custom transaction was saved.
   */
  /* istanbul ignore next */
  async onCustomSaveTransition() {
    const success = await this.saveUpdate();
    return { saveDataSuccessful: success, callDefaultSave: false };
  }

  /**
   * Save data.
   *
   * @param {Object} event - Event data from data-list action.
   */
  /* istanbul ignore next */
  async saveUpdate() {
    if (
      this.getLengthError() ||
      this.getNumberError() ||
      this.getInputError()
    ) {
      this.app.toast(
        this.app.getLocalizedLabel(
          "to_save_the_record_fix_the_validation_errors",
          "To save the record, fix the validation errors."
        ),
        "error"
      );
      return;
    }

    // Reset state variable
    this.setDirty(false);
    this.page.state.saveInProgress = true;

    if (this.page.state.pendingToleranceCalculationSet.size > 0) {
            // Wait for all calculations to finish
      await Promise.all([...this.page.state.pendingToleranceCalculationSet]);
          }
    const calpointsDS = this.getCalibrationPointsDS();
    await this.calcAssetAndDatasheetStatus();
    this.page.state.saveInProgress = false;

    //GRAPHITE-77679: clear all previous output warnings.
    calpointsDS.forEach((calpoint) => {
      calpoint.isCalibrationOutputValueExceeded = false;
      calpoint.showWarningOnInputChange = false;
      calpoint.showWarningOnOutputChange = false;
    });

    if(this.isToleranceWarningShownOnSave()) {
      this.page.showDialog('showToleranceWarning');
    }

    return null;
  }

  /**
   * This method verifies that if any tolerance error is there and validate tolerance once on save is set then it should show tolerance warning.
   * @returns {Boolean}
   */
  isToleranceWarningShownOnSave() {
    const calpointsDS = this.getCalibrationPointsDS();
    const condition = this.getConditionPrefix();
    const locale = this.getLocale();
    const isAnyErrorFound = calpointsDS.items.some(calpoint => {
      const tol1Error =  fromDisplayableValue(calpoint[`${condition}error1`], locale) || 0;
      const tol2Error = fromDisplayableValue(calpoint[`${condition}error2`], locale) || 0;
      const tol3Error = fromDisplayableValue(calpoint[`${condition}error3`], locale) || 0;
      const tol4Error = fromDisplayableValue(calpoint[`${condition}error4`], locale) || 0;
      const showTolWarning = tol1Error!==0 || tol2Error!==0 || tol3Error!==0 || tol4Error!==0;
      return showTolWarning;
    });
    return DatasheetConstants.VALIDATE_TOLERANCE_ONCE_PER_SAVE === this.pluscTolWarnValue && isAnyErrorFound;
  }

  /**
   * Generate field name based on condition prefix, plantype and updated field
   * @param {String} plantype : ANALOG or DISCRETE
   * @param {String} whichFieldTypeChanged : input or output
   * @returns {String}
   */
  getModifiedFieldName(plantype, whichFieldTypeChanged) {
    const isAnalog = plantype === CalibrationPointConstants.PLANTYPE.ANALOG;
    const conditionPrefix = this.getConditionPrefix();
    const fieldName = isAnalog
      ? `${conditionPrefix}${whichFieldTypeChanged}`
      : `${conditionPrefix}setpoint`;
    return fieldName;
  }

  onCalpointValueChanged(event) {
    // istanbul ignore else
    if(!event.target.dataset.previousValue) {
      event.target.dataset.previousValue = event.target.defaultValue || CalibrationPointConstants.NOT_APPLICABLE;
    }
    this.setDirty(true);
  }

  /**
   * Event handler is triggered when user changes value.
   *
   * @param {ProxyObject} calpoint - Calibration point data object.
   * @returns void
   */
  async calculateCalPointTolerances(item) {
    // Load datasources
    const assetfunctionDS = this.getAssetFunctionDS();
    const calpointsds = this.getCalibrationPointsDS();
    const datasheetDS = this.getDatasheetDS();
    const domaincalstatusds = this.getDomainCalStatusDS();

    // Load dependent datasources
    const dsconfigDS = await this.loadDsConfig(assetfunctionDS);

    // Load maxvars
    const maxVars = this.getMaxVars();

    /** @var {String} User locale. */
    const locale = this.getLocale();

    // Update datasheet and asset function status
    const condition = this.getConditionPrefix();

    const handler = new CalibrationPointHandler(
      datasheetDS,
      calpointsds,
      domaincalstatusds,
      assetfunctionDS,
      dsconfigDS,
      maxVars,
      locale
    );

    // tolerances are calculting only for calpoints
    // istanbul ignore else
    if (assetfunctionDS.currentItem?.calpoint) {
      await handler.performCalculation(item, condition);
    }
  }

  /**
   * Calculate tolerance error.
   *
   * @param {String} conditionPrefix - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @param {ProxyObject} calpoint - Calibration point data object.
   * @param {DatasheetCalculation} calc - Instance of DatasheetCalculation.
   * @param {Object} roundingOptions - Object consisting of properties: places, round.
   * @returns
   */
  // TODO: GRAPHITE-75228 fix: remove calculateTolError from CalibrationPointsController
  /* istanbul ignore next */
  calculateTolError(conditionPrefix, calpoint, calc, roundingOptions) {
    const locale = this.getLocale();
    const output = Number(calpoint[`${conditionPrefix}output`]);

    if (isNaN(output)) {
      // do nothing
      return null;
    }

    // Calculate tolerance error for each point
    for (let i = 1; i < 5; i++) {
      const lowervalue = calpoint[`${conditionPrefix}tol${i}lower`];
      const uppervalue = calpoint[`${conditionPrefix}tol${i}upper`];

      if (!isNaN(lowervalue) && lowervalue !== null) {
        const lowerLimit = Number(lowervalue);
        const upperLimit = Number(uppervalue);

        let tolerror = 0;

        if (lowerLimit > output) {
          tolerror = calc.minusZeroMakeUp(output - lowerLimit);
        } else if (output > upperLimit) {
          tolerror = calc.minusZeroMakeUp(output - upperLimit);
        }

        calpoint[`${conditionPrefix}error${i}`] = toDisplayableValue(
          tolerror,
          roundingOptions,
          locale
        );
      }
    }

    return calpoint;
  }


  /**
   * Changes calibration status for As Found or As Left calibration functions.
   *
   * @param {Object} args - Object with properties "item", condition: asfound,asleft,
   * event: clicked button and toggle state information as object
   * @returns Boolean
   */
  funcCheckToggle(args) {
    const { item, condition, event } = args;

    const isValidCondition =
      CalibrationPointConstants.PREFIXES.includes(condition);

    if (!isValidCondition) return false;

    const relatedStatusId =
      event.id === `${condition}pass` ? `${condition}fail` : `${condition}pass`;
    item[event.id] = true;
    item[relatedStatusId] = false;

    this.setDirty(true);
    return true;
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Show warning on datasheet changes.
   * @param {Object} calpoint - The calpoint object.
   * @param {string} field - The field name that changed.
   * @param {string} prevValue - The previous value of field.
   */
  showWarningOnDatasheetChanges(calpoint, field, prevValue) {
    const { calPointFlag } = this.page.state;

    if (this.isWarningShownOnDatasheetChanges &&
      !isEmpty(calpoint[field]) &&
      !isEmpty(prevValue) &&
      calPointFlag &&
      prevValue !== CalibrationPointConstants.NOT_APPLICABLE &&
      prevValue !== calpoint[field]) {
      // istanbul ignore else
      if (CalibrationPointConstants.INPUT_FIELDS.includes(field)) {
        calpoint.showWarningOnInputChange = true;
      } else if (CalibrationPointConstants.OUTPUT_FIELDS.includes(field)) {
        calpoint.showWarningOnOutputChange = true;
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*                                                                    */
  /* Form Validation Rules                                              */
  /*                                                                    */
  /* ------------------------------------------------------------------ */


  /**
   * Asynchronously validates calibration point values and calculates tolerances.
   *
   * This method wraps the synchronous validation and calculation process in an asynchronous context.
   * It tracks the promise in a set to ensure all calculations are completed before saving operations.
   * When the promise resolves or rejects, it automatically removes itself from the tracking set.
   *
   * @param {Object} context - The context object containing the calibration point and field information.
   * @param {Object} context.item - The calibration point data object.
   * @param {String} context.whichFieldTypeChanged - Indicates which field type changed ('input' or 'output').
   * @param {Object} event - The event object that triggered the validation.
   * @param {HTMLElement} event.target - The DOM element that triggered the event.
   * @param {DOMStringMap} event.target.dataset - Dataset containing previous values.
   * @returns {Promise} A promise that resolves when validation and calculation are complete.
   *
   * @see validateCalPointAndCalculateTolerances - The synchronous method that performs the actual validation and calculation.
   * @see saveUpdate - Uses the pendingToleranceCalculationSet to ensure all calculations are complete before saving.
   */
  validateCalPointValuesAndCalculateTolerancesAsync(context, event) {
    const promise = this.validateCalPointAndCalculateTolerances(context, event);

    // Track the promise
    this.page.state.pendingToleranceCalculationSet.add(promise);

    // When done, remove from set
    promise.finally(() => {
      this.page.state.pendingToleranceCalculationSet.delete(promise);
    });

    return promise;
  }


  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
    * Validate cal point and calculate tolerances.
    * @param {Object} context : Context object sent by input containing the calpoint and which field triggered the event.
    * @param {Object} event - The event object.
    */
  /* istanbul ignore next */
  async validateCalPointAndCalculateTolerances(context, event) {
    const assetfunctionDS = this.getAssetFunctionDS();
    const { item: calpoint, whichFieldTypeChanged } = context;
    const field = this.getModifiedFieldName(calpoint.plantype, whichFieldTypeChanged);
    this.resetValidationFlags(calpoint, whichFieldTypeChanged);

    // User typed alphanumeric value ("ABC") - we should only allow numbers (that included negative ones)
    this.validateNumerical(calpoint, whichFieldTypeChanged);
    
    // User typed in too long number - this checks for the max length allowed, not related to tolerance ranges
    this.validateLength(calpoint, whichFieldTypeChanged);

    // User typed a value with no trailing zeros - "12", instead of "12.00" - we can automatically add it (best solutions) or throw a validation error
    this.standardizeDecimal(calpoint, whichFieldTypeChanged);

    calpoint.isDataValid = this.isDataValid(calpoint);
    // User types big number which goes outside of the range - this is not an error, but a warning shown to a user and does not affect the validation or saving
    if (assetfunctionDS.currentItem.calpoint) {
      this.checkBounds(calpoint, whichFieldTypeChanged);
    }

    this.showWarningOnDatasheetChanges(calpoint, field, event.target.dataset.previousValue);
    event.target.dataset.previousValue = '';

    if (!calpoint.isDataValid) {
      await this.calculateCalPointTolerances(calpoint);
    }
  }

  isDataValid(input) {
    let isDataValid = false;
    const { shownumbererror, showlengtherror,showerror} = this.page.state;
    const inputPointKey = `${input.pluscwodspointid}-input`;
    const outputPointKey = `${input.pluscwodspointid}-output`;

    if(shownumbererror[inputPointKey] || shownumbererror[outputPointKey] || showlengtherror[inputPointKey] || showlengtherror[outputPointKey] || showerror[inputPointKey] || showerror[outputPointKey]) {
      isDataValid = true;
    }
    return isDataValid;
  }

  /**
   * Reset errors and warnings when user inputs new data
   * @param {any} input : input from user
   * @returns {any}
   */
  resetValidationFlags(input, whichFieldTypeChanged) {
    const field = this.getModifiedFieldName(
      input.plantype,
      whichFieldTypeChanged
    );
    const conditionPrefix = this.getConditionPrefix();
    this.setLengthError(input.pluscwodspointid, whichFieldTypeChanged, false);
    this.setNumberError(input.pluscwodspointid, whichFieldTypeChanged, false);
    this.setInputError(input.pluscwodspointid, whichFieldTypeChanged, false);
    this.clearCalPointDsWarning(input, field);
    if (conditionPrefix) input[`${conditionPrefix}fail`] = false;
  }

  /**
   * Check if user input is within the upper and lower bounds of the instrument
   * @param {any} input
   * @param {any} conditionPrefix : 'asfound' or 'asleft'
   * @param {any} instrcalrangeto
   * @param {any} instrcalrangefrom
   * @param {any} instroutrangeto
   * @param {any} instroutrangefrom
   * @returns {any}
   */
  checkBounds(input, whichFieldTypeChanged) {
    const locale = this.getLocale();
    let instr = this.getAssetFunctionDS().currentItem;
    const { FIELD_TYPE } = CalibrationPointConstants;
    const conditionPrefix = this.getConditionPrefix();
    const field = this.getModifiedFieldName(
      input.plantype,
      whichFieldTypeChanged
    );
    const ioValue = parseFloat(input[field]);
    const isIOValueOutOfRange = (ioValue, lowerValue, upperValue) =>
      ioValue < lowerValue || ioValue > upperValue;

    const inputUpperBound = parseFloat(instr.instrcalrangeto);
    const inputLowerBound = parseFloat(instr.instrcalrangefrom);

    // Apply localization to warning message
    const localizedCondition =
      conditionPrefix === CalibrationPointConstants.CONDITION_ASFOUND
        ? this.app.getLocalizedLabel("as_found", "As Found")
        : this.app.getLocalizedLabel("as_left", "As Left");

    // istanbul ignore else
    if (whichFieldTypeChanged === FIELD_TYPE.INPUT) {
      let ron1lower = fromDisplayableValue(input.ron1lower, locale, "double");
      let ron1upper = fromDisplayableValue(input.ron1upper, locale, "double");
      let rightRon1Lower = ron1lower;
      let rightRon1Upper = ron1upper;
      if (rightRon1Lower && rightRon1Upper) {
        if (ron1lower - ron1upper > 0) {
          rightRon1Lower = ron1upper;
          rightRon1Upper = ron1lower;
        }
        // istanbul ignore else
        if (ioValue < rightRon1Lower || ioValue > rightRon1Upper) {
          // This line produces a message like this:
          // "The As Found Input 101.00 is outside the range of 0.00 and 100.00"
          const message = new Message(
            "number_is_out_of_range",
            `The ${localizedCondition} ${whichFieldTypeChanged} ${ioValue} is outside the range of ${ron1lower} to ${ron1upper}.`,
            [
              localizedCondition,
              whichFieldTypeChanged,
              ioValue,
              ron1lower,
              ron1upper,
            ]
          );

          this.page.state.message = message.getLocalizedLabel();

          input[`${conditionPrefix}fail`] = true;
          this.setCalPointDsWarning(
            input,
            this.page.state.message,
            whichFieldTypeChanged
          );
          this.setInputError(
            input.pluscwodspointid,
            whichFieldTypeChanged,
            true
          );
        }
      }
      if (instr.cliplimitsin) {
        if (isIOValueOutOfRange(ioValue, inputLowerBound, inputUpperBound)) {
          // This line produces a message like this:
          // "The As Found Input 101.00 is outside the range of 0.00 and 100.00"
          const message = new Message(
            "number_is_out_of_range",
            `The ${localizedCondition} ${whichFieldTypeChanged} ${ioValue} is outside the range of ${inputLowerBound} to ${inputUpperBound}.`,
            [
              localizedCondition,
              whichFieldTypeChanged,
              ioValue,
              inputLowerBound,
              inputUpperBound,
            ]
          );

          this.page.state.message = message.getLocalizedLabel();

          input[`${conditionPrefix}fail`] = true;
          this.setCalPointDsWarning(
            input,
            this.page.state.message,
            whichFieldTypeChanged
          );
          this.setInputError(
            input.pluscwodspointid,
            whichFieldTypeChanged,
            true
          );
        }
      }
    }
  }

  /**
   * Standardize decimal place to match default precision
   * @param {any} calpoint
   * @param {any} condition : 'asfound' or 'asleft'
   * @param {any} whichFieldTypeChanged : 'input' or 'output'
   */
  standardizeDecimal(calpoint, whichFieldTypeChanged) {
    const locale = this.getLocale();
    const fieldName = this.getModifiedFieldName(
      calpoint.plantype,
      whichFieldTypeChanged
    );
    const ioValue = calpoint[fieldName];
    const instrPrecision = this.page.state[`${whichFieldTypeChanged}precision`];

    // istanbul ignore else
    if (ioValue) {
      const ioNumber = fromDisplayableValue(ioValue, locale);
      const formattedIoNumber = this.roundExceedMaxFractionDigits(ioNumber);
      const ioFormatted = toDisplayableValue(
        formattedIoNumber,
        {
          places: instrPrecision,
        },
        locale
      );
      calpoint[fieldName] = ioFormatted;
    }
  }
  
  /**
   * Rounds a number to a maximum of 10 decimal places.
   * @param {number} number - The number to be rounded.
   * @returns {number} The rounded number.
   */
  roundExceedMaxFractionDigits(number) {
    let roundedNumber = number;
    let numberString = number.toString();
    let decimalIndex = numberString.indexOf('.');
  
    if (decimalIndex !== -1) {
      const decimalPart = numberString.slice(decimalIndex + 1);
  
      if (decimalPart.length > DatasheetConstants.FRACTION_DIGITS_BASELINE) {
        const roundedNumberValue = number.toFixed(DatasheetConstants.FRACTION_DIGITS_BASELINE);
        roundedNumber = parseFloat(roundedNumberValue);
      }
    }
    return roundedNumber;
  }

  /**
   * Validate that input is numerical
   * @param {any} input
   * @param {any} conditionPrefix : 'asfound' or 'asleft'
   * @returns {any}
   */
  validateNumerical(input, whichFieldTypeChanged) {
    const isAnalog =
      input.plantype === CalibrationPointConstants.PLANTYPE.ANALOG;
    const conditionPrefix = this.getConditionPrefix();
    const ioValue = isAnalog
      ? input[`${conditionPrefix}${whichFieldTypeChanged}`]
      : input[`${conditionPrefix}setpoint`];
    const locale = this.getLocale();
    if (!LocaleNumberUtil.isValidNumber(ioValue, locale)) {
      const message = new Message(
        "enter_numeric_value",
        "Enter a numeric value"
      );
      this.setCalPointDsWarning(
        input,
        message.getLocalizedLabel(),
        whichFieldTypeChanged
      );
      this.setNumberError(input.pluscwodspointid, whichFieldTypeChanged, true);
      input[`${conditionPrefix}fail`] = true;
      return true;
    }
    return false;
  }

  /**
   * Validate that input lenght is within bounds.
   * @param {any} input
   * @param {any} conditionPrefix : 'asfound' or 'asleft'
   * @returns {any}
   */
  validateLength(input, whichFieldTypeChanged) {
    const isAnalog =
      input.plantype === CalibrationPointConstants.PLANTYPE.ANALOG;
    const conditionPrefix = this.getConditionPrefix();
    let floatInput = parseFloat(
      isAnalog
        ? input[`${conditionPrefix}${whichFieldTypeChanged}`]
        : input[`${conditionPrefix}setpoint`]
    );
    let inputlength = String(floatInput).replace(".", "", ",").length;
    if (floatInput < 0) {
      // remove 1 character from length for negative symbol
      inputlength = inputlength - 1;
    }
    if (inputlength > CalibrationPointConstants.MAX_VALUE_LENGTH) {
      const message = new Message(
        "entered_number_is_too_long",
        "Entered number is too long"
      );
      this.setCalPointDsWarning(
        input,
        message.getLocalizedLabel(),
        whichFieldTypeChanged
      );
      this.setLengthError(input.pluscwodspointid, whichFieldTypeChanged, true);
      input[`${conditionPrefix}fail`] = true;
      return true;
    }
    return false;
  }

  // Assisted by watsonx Code Assistant
  // Code generated by WCA@IBM in this programming language is not approved for use in IBM product development.
  /**
   * Returns the locale for input and output.
   * @param {string} whichfieldtype input or output
   * @returns {string} The locale for input and output.
   */
  getLocaleNumber(itemValue, whichfieldtype) {
    const locale = this.getLocale();
    const itemValueNumber = fromDisplayableValue(itemValue, locale);
    return toDisplayableValue(
      itemValueNumber,
      {
        places:
          whichfieldtype === "input"
            ? this.page.state.inputprecision
            : this.page.state.outputprecision,
      },
      locale
    );
  }
// **************************** Add calibration points code starts from here. ****************************

  // Assisted by watsonx Code Assistant 
  /**
   * validateAndLaunchInsertPointDialog - This function validates and launches the insert point dialog.
   * @param {Object} event - The event that triggered this function.
   * @param {boolean} [event.isDeleting] - Indicates whether the operation is a deletion or not.
   * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the operation is allowed or not.
   */
  async validateAndLaunchInsertPointDialog(event) {
    let isAdditionOrDeletionAllowed = true;
    const orgid = this.app.client?.userInfo?.insertOrg;
    const { isDeleting } = event || {};
    let isEditCalPointEnabledFromWoEditRule = false;

    const assetfunctionDS = this.getAssetFunctionDS();
    const isAllowPointInsertsEnabled = assetfunctionDS.currentItem.allowpointinserts;
    
    const wPEditSetting = this.app.findDatasource("wpEditSettingDS");

    isEditCalPointEnabledFromWoEditRule = wPEditSetting.items
      .filter((wpEditAllItem) =>
          wpEditAllItem.orgid === orgid
      ).some((wpEditAllItem) => wpEditAllItem.plusceditpoint && wpEditAllItem.status === this.app.state.workOrderStatus);

    if (!isAllowPointInsertsEnabled) {
      const message = this.app.getLocalizedLabel(
        "calpoint_add_error",
        "BMXAR0004E - The Asset Function does not support adding calibration points."
      );
      this.app.toast(message, "error", "", "","" ,false);
      isAdditionOrDeletionAllowed = false;
      return isAdditionOrDeletionAllowed;
    }

    if (!isEditCalPointEnabledFromWoEditRule) {
      const message = this.app.getLocalizedLabel(
        "wo_edit_rule_calpoint_error",
         `BMXAR0011E - Adding or Removing Calibration Points is not enabled for work order ${this.app.state.datasheetWonum} which has a status of ${this.app.state.workOrderStatus}.`,
         [this.app.state.datasheetWonum, this.app.state.workOrderStatus]
      );
      this.app.toast(message, "error", "", "","" ,false);
      isAdditionOrDeletionAllowed = false;
      return isAdditionOrDeletionAllowed;
    }
    const isDirty = this.isDirty();
    if (isDirty) {
      this.page.state.isCalledFromAddDeleteCalibrationPoint = true;
      const dialogToBeLaunched = this.getConditionPrefix() === 'asleft' ? 'saveAsLeftDiscardRules': 'saveDiscardRules';
      this.page.showDialog(dialogToBeLaunched);
    } else {
      //istanbul ignore else
      if (!isDeleting) {
        const calibrationPointsDS = this.getCalibrationPointsDS();
        await calibrationPointsDS.addNew();
        this.page.showDialog("addCalPoint");
      }
    }
    return isAdditionOrDeletionAllowed;
  }

  // Assisted by watsonx Code Assistant 
  /**
   * getAssetFunctionTypePointLabel - This function returns the label for the insert point card based on the state of the page.
   * @returns {string} The label for the insert point card.
   */
  getAssetFunctionTypePointLabel() {
    const { calDynamicFlag, calFunctionFlag, calPointFlag } = this.page.state;
    let assetFunctionTypePointLabel = "";
    if (calPointFlag) {
      assetFunctionTypePointLabel = this.app.getLocalizedLabel("calibration_point", "calibration point");
      this.page.state.assetFunctionType = this.app.getLocalizedLabel("calibration", "Calibration");
    } else if (calFunctionFlag) {
      assetFunctionTypePointLabel = this.app.getLocalizedLabel("function_check_point", "function check point");
      this.page.state.assetFunctionType = this.app.getLocalizedLabel("function_check", "Function check");
    } else if (calDynamicFlag) {
      assetFunctionTypePointLabel = this.app.getLocalizedLabel("dynamic_check_point", "dynamic check point");
      this.page.state.assetFunctionType = this.app.getLocalizedLabel("dynamic_check", "Dynamic check");
    }

    return assetFunctionTypePointLabel;
  }
 
  // Assisted by watsonx Code Assistant 

  /**
   * populateDefaultValuesForCalPointFields - This function populates default values for calibration point fields.
   * @returns {void}
   */
  populateDefaultValuesForCalPointFields() {
    const calpointsDS = this.getCalibrationPointsDS();
    const userInfo = this.app.getUserInfo();
    calpointsDS.item.isadded = true;

    if (!calpointsDS.item.wonum) {
      calpointsDS.item.wonum = calpointsDS.dependsOn.item.wonum;
    }
    if (!calpointsDS.item.wodsnum) {
      calpointsDS.item.wodsnum = calpointsDS.dependsOn.dependsOn.item.wodsnum;
    }
    if (!calpointsDS.item.dsplannum) {
      calpointsDS.item.dsplannum = calpointsDS.dependsOn.item.dsplannum;
    }
    if(!calpointsDS.item.instrseq) {
      calpointsDS.item.instrseq = calpointsDS.dependsOn.item.instrseq;
    }
    if(!calpointsDS.item.revisionnum) {
      calpointsDS.item.revisionnum = calpointsDS.dependsOn.item.revisionnum;
    }

    if (!calpointsDS.item.plantype) {
      calpointsDS.item.plantype = calpointsDS.dependsOn.item.plantype;
      calpointsDS.item.plantype_maxvalue = calpointsDS.dependsOn.item.plantype_maxvalue;
      calpointsDS.item.plantype_description = calpointsDS.dependsOn.item.plantype_description;
    }
    
    if(!calpointsDS.item.langcode) {
      calpointsDS.item.langcode = userInfo.langcode;
    }

    const inputFieldName = calpointsDS.item.plantype === CalibrationPointConstants.PLANTYPE.ANALOG ? 'inputvalue': 'setpoint';
    //istanbul ignore else
    if(this.page.state.calPointFlag && isEmpty(calpointsDS.item[inputFieldName])) {
      calpointsDS.item[inputFieldName] = toDisplayableValue(0, { places: this.page.state.inputprecision, 'round': -1 }, this.getLocale());
    }

    this.calculateDesiredOutputForNewAnalog(calpointsDS.item.plantype);

    calpointsDS.item.asfounderror = false;
    calpointsDS.item.asfoundfail = false;
    calpointsDS.item.asfoundpass = false;
    calpointsDS.item.asfoundpterror = false;
    
    calpointsDS.item.aslefterror = false;
    calpointsDS.item.asleftfail = false;
    calpointsDS.item.asleftpass = false;
    calpointsDS.item.asleftpterror = false;

  }

  // Assisted by watsonx Code Assistant 
  /**
   * isCalPointValid - This function checks if a calibration point is valid based on the provided existingCalibrationPoints.
   * @param {Array<Object>} [existingCalibrationPoints] - An optional array of existing calibration points to check for uniqueness.
   * @returns {boolean} - A boolean indicating whether the calibration point is valid or not.
   */
  isCalPointValid(existingCalibrationPoints = []) {
    let isPointValid = true;
    const calpointsDS = this.getCalibrationPointsDS();
    
    if(!calpointsDS.item.point) {
      const errorMessage = this.app.getLocalizedLabel(
        "calpoint_required_validation",
        `${this.page.state.assetFunctionType} point is required.`,
        [this.page.state.assetFunctionType]
      );
      calpointsDS.setWarning(calpointsDS.item, 'point', errorMessage);
      isPointValid = false;
    }

    if(existingCalibrationPoints.some(item => item.point === calpointsDS.item.point)) {
      const errorMessage = this.app.getLocalizedLabel(
        "calpoint_unique_validation",
        `${this.page.state.assetFunctionType} point must be unique.`,
        [this.page.state.assetFunctionType]
      );
      calpointsDS.setWarning(calpointsDS.item, 'point', errorMessage);
      isPointValid = false;
    }
    return isPointValid;
  }
  
  // Assisted by watsonx Code Assistant 
  /**
   * addCalibrationPoint - This function adds a new calibration point to the application.
   * @returns {Promise<void>}
   */
  async addCalibrationPoint() {
    const calpointsDS = this.getCalibrationPointsDS();
    const assetFunctionDs = this.getAssetFunctionDS();
    //istanbul ignore else
    if (this.isCalPointValid(assetFunctionDs.item.pluscwodspoint)) {
      this.populateDefaultValuesForCalPointFields();
      this.page.state.loading = true;
      this.page.findDialog('addCalPoint').closeDialog();

      await calpointsDS.save({ responseProperties: 'anywhererefid,pluscwodspointid,point,dsplannum,instrseq,wonum,isadded,plantype,wodsnum,revisionnum' });
      await this.getDatasheetDS().forceReloadAndWaitForChildren();
      // Calculating initial status for each calibration point
      await this.calculateInitialStatus(this.app);
      await this.calcAssetAndDatasheetStatus();
      this.page.state.loading = false;
      const sucessMessage = this.app.getLocalizedLabel(
        "calpoint_add_success",
        `${this.page.state.assetFunctionType} point added.`,
        [this.page.state.assetFunctionType]
      );

      this.setDirty(false);
      this.app.toast(sucessMessage, "success", "", "", "", false);
    }
  }

  // Assisted by watsonx Code Assistant 
  /**
   * openEditCalibrationPointDialog - This function opens the edit calibration point dialog for a given item.
   * @param {Object} item - The calibration point item to open the dialog for.
   * @returns {Promise<void>}
   */
  async openEditCalibrationPointDialog(item) {
    const calpointsDS = this.getCalibrationPointsDS();
    calpointsDS.clearWarnings(item, 'point');
    calpointsDS.getById(item.pluscwodspointid, true);
    this.page.showDialog('editCalPoint');
  }

  // Assisted by watsonx Code Assistant 
  /**
   * editCalibrationPoint - This function edits a calibration point and saves the changes.
   * @returns {Promise<void>}
   */
  async editCalibrationPoint() {
    const calpointsDS = this.getCalibrationPointsDS();
    const existingCalibrationPoints = calpointsDS.items.filter(item => calpointsDS.item.pluscwodspointid !== item.pluscwodspointid);
    //istanbul ignore else
    if (this.isCalPointValid(existingCalibrationPoints)) {
      this.page.findDialog('editCalPoint').closeDialog();
      this.calculateDesiredOutputForNewAnalog(calpointsDS.item.plantype);
      await calpointsDS.save({ responseProperties: 'anywhererefid,pluscwodspointid,point,dsplannum,instrseq,wonum,isadded,plantype,wodsnum,revisionnum' });
      const sucessMessage = this.app.getLocalizedLabel(
        "calpoint_update_success",
        `${this.page.state.assetFunctionType} point updated.`,
        [this.page.state.assetFunctionType]
      );
      this.app.toast(sucessMessage, "success", "", "", "", false);
    }
  }

  // Assisted by watsonx Code Assistant 
  /**
  * calculatePointRangeLimits - This function calculates the point range limits based on the given input and instrument range.
  * @param {string} nominalInput - The nominal input value.
  * @param {Object} instrRange - The instrument range object.
  * @returns {void}
  */
  calculatePointRangeLimits(nominalInput, instrRange) {
    const assetFunctionsDs = this.getAssetFunctionDS();
    const locale = this.getLocale();
    const calpointsDS = this.getCalibrationPointsDS();
    const { ron1lowervalue, ron1uppervalue, inputprecision, ron1type, cliplimits } = assetFunctionsDs.item;
    const dsConfigItem = this.getDsConfig().item;
    const asinputvalue = parseFloat(nominalInput);
    const rangeLimitLower = parseFloat(ron1lowervalue);
    const rangeLimitUpper = parseFloat(ron1uppervalue);
    const inputLower = instrRange.instrcalrangefrom;
    const inputUpper = instrRange.instrcalrangeto;
    const inputSpan = inputUpper - inputLower;
    
    let toltype = ron1type || "";
    let calcLimitLower = null;
    let calcLimitUpper = null;

    switch (toltype) {
      case "EU": {
        calcLimitLower = asinputvalue + rangeLimitLower;
        calcLimitUpper = asinputvalue + rangeLimitUpper;
        break;
      }
      case "%SPAN": {
        calcLimitLower = asinputvalue + (inputSpan / 100) * rangeLimitLower;
        calcLimitUpper = asinputvalue + (inputSpan / 100) * rangeLimitUpper;
        break;
      }
      case "%URV": {
        calcLimitLower = asinputvalue + (Math.abs(inputUpper) / 100) * rangeLimitLower;
        calcLimitUpper = asinputvalue + (Math.abs(inputUpper) / 100) * rangeLimitUpper;
        break;
      }
      case "%READING": {
        calcLimitLower = asinputvalue + (Math.abs(asinputvalue) / 100) * rangeLimitLower;
        calcLimitUpper = asinputvalue + (Math.abs(asinputvalue) / 100) * rangeLimitUpper;
        break;
      }
      default: {
        calcLimitLower = null;
        calcLimitUpper = null;
        break;
      }
    }

    if (cliplimits) {
      calcLimitLower = Math.min(Math.max(calcLimitLower, inputLower), inputUpper);
      calcLimitUpper = Math.max(Math.min(calcLimitUpper, inputUpper), asinputvalue);
    }

    //TODO round and truncate as necessary.
    //DSCOnfig rangetruncate and precision
    const isRounded = dsConfigItem.rangetruncate ? -1 : 0;  // round option:  0=round, -1=don't round (truncate)
    const options = {places: inputprecision, round: isRounded};
    
    calcLimitLower = toDisplayableValue(calcLimitLower, options, locale);
    calcLimitUpper = toDisplayableValue(calcLimitUpper, options, locale);
    
    calpointsDS.item.ron1lower = calcLimitLower;
    calpointsDS.item.ron1upper = calcLimitUpper;
    calpointsDS.item.rontype = toltype;
  }

  // Assisted by watsonx Code Assistant 
  /**
   * calculateDesiredOutputForNewAnalog - This function calculates the desired output for a new analog calibration point.
   * @param {string} plantype - The type of calibration point.
   * @returns {void}
   */
  calculateDesiredOutputForNewAnalog(plantype) {
    const calpointsDS = this.getCalibrationPointsDS();
    //istanbul ignore else
    if (this.page.state.calPointFlag && plantype === CalibrationPointConstants.PLANTYPE.ANALOG && !isEmpty(calpointsDS.item.inputvalue)) {
      const assetFnDs = this.getAssetFunctionDS();
      const { ron1lowervalue, ron1uppervalue, ron1type, instrcalrangefrom, instrcalrangeto, instroutrangefrom, instroutrangeto } = assetFnDs.item;
      const locale = this.getLocale();
      const dsConfigItem = this.getDsConfig().item;
      const calc = new DatasheetCalculation(dsConfigItem, locale);
      const inputValue = fromDisplayableValue(calpointsDS.item.inputvalue, locale);
      const instrRange = {
        instrcalrangefrom: fromDisplayableValue(instrcalrangefrom, locale),
        instrcalrangeto: fromDisplayableValue(instrcalrangeto, locale),
        instroutrangefrom: fromDisplayableValue(instroutrangefrom, locale),
        instroutrangeto: fromDisplayableValue(instroutrangeto, locale),
      };
      //istanbul ignore else
      if (!assetFnDs.item.nonlinear) {
        const desiredOutputValue = calc.calculateDesiredOutput(inputValue, calpointsDS.item, assetFnDs.item);
        const formattedDesiredOutputValue = this.roundExceedMaxFractionDigits(desiredOutputValue);
        const isRounded = dsConfigItem.outputtruncate ? -1 : 0;  // round option:  0=round, -1=don't round (truncate)
        calpointsDS.item.outputvalue = toDisplayableValue(formattedDesiredOutputValue, { places: this.page.state.outputprecision, round: isRounded }, locale);
      }

      //Calculate range limit
      //istanbul ignore else
      if (inputValue && ron1lowervalue && ron1uppervalue && ron1type) {
        this.calculatePointRangeLimits(inputValue, instrRange);
      }

      //calculate Tolerances for newly added point
      const attrs = calc.getDirection(instrRange);
      const minInputFraction =  this.page.state.inputprecision
			const minOutputFraction = this.page.state.outputprecision
			
			const actualPrecision = {
					input: minInputFraction,
					output: decimalPlacesOf(calpointsDS.get('outputvalue'))
			};
      let rightPrecision = calc.getAssetPrecision(minOutputFraction, actualPrecision);
      calc.calculateTolerances("", calpointsDS.item, assetFnDs.item, attrs, {places: rightPrecision , round: calc.getRoundOption('toltruncate')});
    }
  }

  // Assisted by watsonx Code Assistant 
  /**
   * deleteCalibrationPoint - This function deletes a calibration point from the application.
   * @param {Object} item - The calibration point to be deleted.
   * @returns {Promise<void>}
   */
  async deleteCalibrationPoint(item) {
    const calpointsDS = this.getCalibrationPointsDS();
    const calpoint = calpointsDS.getById(item.pluscwodspointid, true);
    calpoint.isDeleting = true;
    const isDirty = this.isDirty();
    const isDeletionAllowed = await this.validateAndLaunchInsertPointDialog({ isDeleting: true });
    // istanbul ignore else
    if (isDeletionAllowed && !isDirty) {
      this.page.state.loading = true;
      const response = await calpointsDS.deleteItem(item);
      // istanbul ignore else
      if (response) {
        await this.getDatasheetDS().forceReloadAndWaitForChildren();
        // Calculating initial status for each calibration point
        await this.calculateInitialStatus(this.app);
        await this.calcAssetAndDatasheetStatus();
        const sucessMessage = this.app.getLocalizedLabel(
          "calpoint_delete_success",
          `${this.page.state.assetFunctionType} point deleted.`,
          [this.page.state.assetFunctionType]
        );
        this.setDirty(false);
        this.app.toast(sucessMessage, "success", "", "", "", false);
      }
    }
    this.page.state.loading = false;
  }
  // Assisted by watsonx Code Assistant 
  /**
   * Calculate and Updates the calibration points, asset function, and datasheet status based on the current page state and user condition.
   *
   * @async
   * @returns {Promise<void>} - Resolves when the updates are complete.
   *
   * @example
   * await calcAssetAndDatasheetStatus();
   */
  async calcAssetAndDatasheetStatus() {
    // Load datasources
    const domaincalstatusDS = this.getDomainCalStatusDS();
    const pluscwoDS = this.getDatasheetDS();
    const assetfunctionDS = this.getAssetFunctionDS();
    const calpointsDS = this.getCalibrationPointsDS();

    // Load dependent datasources
    const dsconfigDS = await this.loadDsConfig(assetfunctionDS);

    // Load maxvars
    const maxVars = this.getMaxVars();

    /** @var {String} User locale. */
    const locale = this.getLocale();

    /**
     * Condition in which the user is accessing the calibration points. Can be "asleft" or "asfound".
     * @type {String}
     */
    const condition = this.getConditionPrefix();

    // Update datasheet and asset function status
    const handler = new CalibrationPointHandler(
      pluscwoDS,
      calpointsDS,
      domaincalstatusDS,
      assetfunctionDS,
      dsconfigDS,
      maxVars,
      locale
    );

    if (this.page.state.saveInProgress) {
      // Update status in asset function and parent datasheet when it is called from individual asfound or asleft page.
      await handler._completeReadings(
        null,
        condition,
        CalibrationPointConstants.COMPLETE_READINGS_BACKGROUND
      );
      // Save changes in point, asset function and datasheet datasources
      await calpointsDS.save(DatasourceConstants.CALIBRATION_SAVE_OPTIONS);
      // The status was updated in handler._completeReadings(); Update page state to reflect updated value.
      this.page.state[`${condition}calstatus`] = assetfunctionDS.currentItem[`${condition}calstatus`];
      this.page.state[`${condition}callabel`] = this.setLabelColor(this.page.state[`${condition}calstatus`]);
    } else {
      
      // Update status in asset function and parent datasheet when it is called from add or delete calibration point.
      await handler._completeReadings(
        null,
        CalibrationPointConstants.CONDITION_ASFOUND,
        CalibrationPointConstants.COMPLETE_READINGS_BACKGROUND
      );
      await handler._completeReadings(
        null,
        CalibrationPointConstants.CONDITION_ASLEFT,
        CalibrationPointConstants.COMPLETE_READINGS_BACKGROUND
      );
      
      // Save changes in point, asset function and datasheet datasources
      await calpointsDS.save(DatasourceConstants.CALIBRATION_SAVE_OPTIONS);

      // The status was updated in handler._completeReadings(); Update page state to reflect updated value.
      this.page.state['asfoundcalstatus'] = assetfunctionDS.currentItem['asfoundcalstatus'];
      this.page.state['asfoundcallabel'] = this.setLabelColor(this.page.state['asfoundcallabel']);
      this.page.state['asleftcalstatus'] = assetfunctionDS.currentItem['asleftcalstatus'];
      this.page.state['asleftcallabel'] = this.setLabelColor(this.page.state['asleftcallabel']);
    }
  }
  
  // Assisted by watsonx Code Assistant 
  /**
   * closeAddCalPointDialog - This function closes the add calibration point dialog.
   * @returns {void}
   */
  closeAddCalPointDialog() {
    const addCalPointDialog  = this.page.findDialog('addCalPoint')
    const calibrationPointsDS = this.getCalibrationPointsDS();
    calibrationPointsDS.undoAll();
    calibrationPointsDS.clearChanges(true);
    calibrationPointsDS.clearAllWarnings();
    addCalPointDialog.closeDialog();
  }

  // Assisted by watsonx Code Assistant 
  /**
   * closeEditCalPointDialog - This function closes the add calibration point dialog.
   * @returns {void}
   */
  closeEditCalPointDialog() {
    const editCalPointDialog  = this.page.findDialog('editCalPoint');
    const calibrationPointsDS = this.getCalibrationPointsDS();
    const datasheetDs = this.getDatasheetDS();
    datasheetDs.undoAll();
    calibrationPointsDS.clearAllWarnings();
    calibrationPointsDS.clearChanges(true);
    
    editCalPointDialog.closeDialog();
  }
  // Assisted by watsonx Code Assistant 

  /**
   * toggleCalibrationPointActionMenu - This function toggles the open state of the calibration point action menu for a given item.
   * @param {Object} item - The calibration point item to toggle the menu for.
   * @param {boolean} isOpen - The new open state for the menu.
   * @returns {void}
   */
  toggleCalibrationPointActionMenu(item, isOpen) {
    item.isCalPointMenuOpen = isOpen;
  }

  // Assisted by watsonx Code Assistant 
  /**
   * continueAddOrDeleteCalibrationPoint - This function continues the process of adding or deleting a calibration point.
   * @returns {void}
   */
  continueAddOrDeleteCalibrationPoint() {
    this.page.state.isCalledFromAddDeleteCalibrationPoint = false;
    const { item: calPoint } = this.getCalibrationPointsDS();
    if (calPoint.isDeleting) {
      this.deleteCalibrationPoint(calPoint);
    } else {
      this.validateAndLaunchInsertPointDialog({ isDeleting: calPoint.isDeleting });
    }
  }

  // Assisted by watsonx Code Assistant 
  /**
   * onCalibrationFieldChange - This function clears any warnings related to the point field when its value changes.
   * @param {string} fieldName - The name of the field to validate.
   * @returns {void}
   */
  onCalibrationFieldChange(fieldName) {
    const calpointsDs = this.getCalibrationPointsDS();
    calpointsDs.clearWarnings(calpointsDs.item, fieldName);
  }

  // Assisted by watsonx Code Assistant 
  /**
   * validateCalibrationFieldValue - This function validates the numeric value of a point input field.
   * @param {string} fieldName - The name of the field to validate. 
   * @param {Event} event - The event object containing the input value.
   * @returns {void}
   */
  validateCalibrationFieldValue(fieldName, event) {
    const calpointsDs = this.getCalibrationPointsDS();
    const assetFnDs = this.getAssetFunctionDS();
    const locale = this.getLocale();
    if (!LocaleNumberUtil.isValidNumber(event.target.value, locale)) {
      const message = new Message(
        "enter_numeric_value",
        "Enter a numeric value"
      );
      calpointsDs.setWarning(calpointsDs.item, fieldName, message.getLocalizedLabel());
      return;
    }
    //istanbul ignore else
    if(fieldName !== "point") {
      const inputNumber = fromDisplayableValue(event.target.value, locale);
      const formattedInputNumber = this.roundExceedMaxFractionDigits(inputNumber);
      calpointsDs.item[fieldName] = toDisplayableValue(formattedInputNumber,{ places: this.page.state.inputprecision, 'round': -1 }, locale);
      //istanbul ignore else
      if(assetFnDs.item.cliplimitsin){
        this.validateClipLimitsForNominalInput(fieldName);
      }  
    }
  }

  // Assisted by watsonx Code Assistant 
  /**
  * Validates the clip limits for the given input value.
  * @param {number} inputValue The input value to validate.
  * @param {string} fieldName The name of the field being validated.
  * @returns {void}
  */
  validateClipLimitsForNominalInput(fieldName) {
    const assetFnDs = this.getAssetFunctionDS();
    const calpointsDs = this.getCalibrationPointsDS();
    const { instrcalrangefrom, instrcalrangeto, cliplimitsin  } = assetFnDs.item;
    const locale = this.getLocale();
    //clipslimits check, if inputvalue is valid or not
    //istanbul ignore else
    if (calpointsDs.item.inputvalue && cliplimitsin) {
      const instrCalRangeFrom = fromDisplayableValue(instrcalrangefrom, locale);
      const instrCalRangeTo = fromDisplayableValue(instrcalrangeto, locale);
      const lowerRangeLimit = (instrCalRangeFrom <= instrCalRangeTo) ? instrCalRangeFrom : instrCalRangeTo;
      const upperRangeLimit = (instrCalRangeFrom > instrCalRangeTo) ? instrCalRangeFrom : instrCalRangeTo;
      //istanbul ignore else
      if ((calpointsDs.item.inputvalue < lowerRangeLimit) || (calpointsDs.item.inputvalue > upperRangeLimit)) {
        const message = new Message(
            "clips_limitsin_validation",
            `The ${calpointsDs.item.inputvalue} is outside the range of ${instrCalRangeFrom} to ${instrCalRangeTo}.`,
            [calpointsDs.item.inputvalue, instrCalRangeFrom, instrCalRangeTo]
        );
        calpointsDs.setWarning(calpointsDs.item, fieldName, message.getLocalizedLabel());
      }
    }
  }
}

export default CalibrationPointsController;

