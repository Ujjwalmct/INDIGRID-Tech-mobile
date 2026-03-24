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
import DatasourceConstants from "./rules/constants/DatasourceConstants";
import LogConstants from "./rules/constants/LogConstants";
import PageConstants from "./rules/constants/PageConstants";

/** Utils */
import defaults from "./rules/utils/defaults";
import formatCalpoint from "./rules/utils/formatCalpoint";
import printTable from "./utils/printTable";
import toDisplayableValue from "./rules/utils/numberFormatter/toDisplayableValue";
import fromDisplayableValue from "./rules/utils/numberFormatter/fromDisplayableValue";

/** Helpers */
import CalibrationPointValidation from "./rules/helpers/validation/CalibrationPointValidation";
import DatasheetCalculation from "./rules/helpers/DatasheetCalculation";
import parseBool from "./utils/parseBool";

/** Handlers */
import CalibrationPointHandler from "./rules/handlers/CalibrationPointHandler";

/** Controller */
import CalibrationPointsController from "./CalibrationPointsController";

/** Graphite resources */
import { Datasource, JSONDataAdapter } from "@maximo/maximo-js-api";

/** Log */
import { log } from "@maximo/maximo-js-api";

import SynonymDomain from "./rules/models/SynonymDomain";

/**
 * CalibrationPointsRepeatableController
 *
 * @typedef {import('@maximo/maximo-js-api').Page} Page
 * @typedef {import('@maximo/maximo-js-api').Application} Application
 * @typedef {import('@maximo/maximo-js-api').Datasource} Datasource
 * @typedef {import("./rules/helpers/validation").FieldError} FieldError
 */
class CalibrationPointsRepeatableController extends CalibrationPointsController {
  /**
   * DatasheetCalculation.
   * @private
   * @type {DatasheetCalculation}
   */
  datasheetCalculation = null;

  /**
   * Page Initialized.
   * @param {Page} page
   * @param {App} app
   */
  pageInitialized(page, app) {
    this.page = page;
    this.app = app;

    /* Binding functions */
    this.formatCalpointBeforeSave = this.formatCalpointBeforeSave.bind(this);
    this.updateCalpointsIntoDS = this.updateCalpointsIntoDS.bind(this);
  }

  /**
   * When page is resumed.
   *
   * @param {Page} page
   * @param {App} app
   * @returns void
   */
  async pageResumed(page, app) {
    // Start loading
    page.state.loading = true;

    // State properties
    page.state.calpointtitle = page.params.calpointtitle;
    page.state.padding = this.calculatePadding(app);
    page.state.asserterror = false;
    this.page.state.calPointFlag = parseBool(page.params.calpoint);
    page.state.condition = page.params.condition;
    page.state.title = this.getPageTitle(page);
    page.state.colwidth = this.getTitleColumnWidth(app);
    page.state.asfoundcalstatus = page.params.asfoundcalstatus;
    page.state.asfoundcallabel = this.setLabelColor(
      this.page.state.asfoundcalstatus
    );
    page.state.asleftcalstatus = page.params.asleftcalstatus;
    page.state.asleftcallabel = this.setLabelColor(
      this.page.state.asleftcalstatus
    );
    this.page.state.inputprecision = page.params.inputprecision;
    this.page.state.outputprecision = page.params.outputprecision;
    this.page.state.pendingToleranceCalculationSet = new Set();

    this.setFormValid(true);
    this.setDirty(false);

    // Load supporting datasources
    const assetfunctionDS = this.getAssetFunctionDS();
    const calpointsDS = this.getCalibrationPointsDS();

    // Ignore fields have to be added to parent
    const datasheetDS = this.getDatasheetDS();
    datasheetDS.addIgnoreField('showWarningOnInputChange');
    datasheetDS.addIgnoreField('showWarningOnOutputChange');

    // Assign page state variables
    page.state.assetfunction = assetfunctionDS?.currentItem;
    page.state.dsconfig = await this.loadDsConfig(assetfunctionDS);
    this.isWarningShownOnDatasheetChanges = CalibrationPointHandler.isWarningMessageShownOnDatasheetChanges(this.getMaxVars());
    this.pluscTolWarnValue = CalibrationPointHandler.getPluscTolWarnMaxVarValue(this.getMaxVars());

    // Instantiate helpers
    this.datasheetCalculation = new DatasheetCalculation(page.state.dsconfig.currentItem, this.getLocale(), this.getDomainCalStatusDS());

    page.state.groupedCalpointsDS = await this.createGroupedCalpointsDS(
      calpointsDS
    );

    // Complete loading
    page.state.loading = false;
  }

  /* ------------------------------------------------------------------ */
  /*                                                                    */
  /* Getters & Setters                                                  */
  /*                                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Defines the color for the label based on status value.
   * @param {String} status : PASS, FAIL, UNDEFINED
   * @returns {String} Returns the color for the label based on status value.
   */
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
   * Getter that calculate padding value based on screen size.
   * @param {App} app
   * @returns {String}
   */
  calculatePadding(app) {
    const screenSize = app.state.screen.size;

    if (screenSize === PageConstants.SCREEN_SIZE.SMALL) {
      return PageConstants.PADDING.SMALL;
    }

    if (screenSize === PageConstants.SCREEN_SIZE.MEDIUM) {
      return PageConstants.PADDING.SMALL;
    }

    return PageConstants.PADDING.MEDIUM;
  }

  /**
   * Returns current asset function.
   * @returns {ProxyObject}
   */
  getAssetFunction() {
    return this.page.state.assetfunction;
  }

  /**
   * Getter that creates a page title based on the condition.
   * @param {Page} page
   * @returns {String}
   */
  getPageTitle(page) {
    const condition = page.params.condition;

    if (condition === CalibrationPointConstants.CONDITION_ASFOUND) {
      return "As found values";
    } else if (condition === CalibrationPointConstants.CONDITION_ASLEFT) {
      return "As left values";
    }

    return "";
  }

  /**
   * Getter that calculates the column width size for header.
   * @param {App} app
   * @returns
   */
  getTitleColumnWidth(app) {
    if (app.state.screen.size === PageConstants.SCREEN_SIZE.LARGE) {
      return PageConstants.COLUMN_WIDTH.MEDIUM;
    } else {
      return PageConstants.COLUMN_WIDTH.LARGE;
    }
  }

  /**
   * Gets condition of the page. Can be "asfound" or "asleft".
   * @returns {String}
   */
  getCondition() {
    return this.page.state.condition;
  }

  /**
   * Get grouped calibration points DS.
   * @returns {Datasource}
   */
  getGroupedCalpointsDS() {
    return this.page.state.groupedCalpointsDS;
  }

  /**
   * If calibration point data changed, then we call the data is "dirty".
   * @returns {Boolean} - Returns whether data changed or not.
   */
  isDirty() {
    return this.page.state.isdirty;
  }

  /**
   * Sets flag to indicate the data changed.
   * @param {Boolean} isdirty
   * @returns void
   */
  setDirty(isdirty) {
    this.page.state.isdirty = isdirty;
  }

  /**
   * Indicates if work is being saved.
   * @returns {Boolean} Returns whether the work is being saved.
   */
  isSaving() {
    return this.page.state.saving;
  }

  /**
   * Sets flag to indicate the data is being saved.
   * @param {Boolean} saving
   * @returns {void}
   */
  setSaving(saving) {
    this.page.state.saving = saving;
  }

  /**
   * Returns whether form is valid or not.
   * @returns {Boolean}
   */
  isFormValid() {
    return this.page.state.formvalid;
  }

  /**
   * Defines formvalid state
   * @param {Boolean} isValid
   */
  setFormValid(isValid) {
    this.page.state.formvalid = isValid;
  }

  /**
   * Get DS config instance.
   * @returns {Object}
   */
  getDsConfig() {
    return this.page.state.dsconfig;
  }

  /**
   * Defines if group has an error or not.
   * @param {ProxyObject} calpoint : Calibration point.
   * @param {Boolean} hasError : Sets if group has error or not.
   */
  setGroupError(calpoint, hasError) {
    this.getGroupedCalpointsDS().items[calpoint._group_index].haserror =
      hasError;
  }

  /* ------------------------------------------------------------------ */
  /*                                                                    */
  /* Public methods                                                     */
  /*                                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Creates a datasource with calibration points grouped by "point"
   * property.
   *
   * @param {Datasource} calpointsDS
   * @returns {Datasource} Returns Datasource with calibration points grouped by "point".
   */
  async createGroupedCalpointsDS(calpointsDS) {
    // Error! Calibration points list is undefined
    if (!calpointsDS) {
      return null;
    }

    // Load datasources
    const domaincalstatusDS = this.getDomainCalStatusDS();

    // Load dependent datasources
    const dsconfig = this.getDsConfig();

    // Get condition
    const condition = this.getCondition();
    const assetfunction = this.getAssetFunction();

    // Calculate initial status
    this.calculateInitialStatus(
      condition,
      assetfunction,
      calpointsDS,
      domaincalstatusDS,
      dsconfig
    );

    // Group calibration points by "point" property
    const groupedBy = "point";
    const hashSet = this.groupBy(calpointsDS.items, groupedBy);
    const groupedCalpointsDS = this.initializeGroupedCalpointsDS(hashSet);

    // Load grouped calpoints datasource
    await groupedCalpointsDS.load();

    // Override groupedCalpointsDS attributes
    groupedCalpointsDS.items.forEach(async (group, groupIndex) => {
      const items = hashSet[group.groupedBy];

      // Overriding calibration points of the group and
      // position of it in groupedCalpointsDS state.
      // We can use these positions later to update the correct
      // calibration point instead of searching through the tree.
      items.forEach((calpoint, index) => {
        calpoint._group_index = groupIndex;
        calpoint._index = index;
        calpoint._output_exceeded = "";
      });

      // Override calpointsDS to include datasource `calpointsDS`
      // made of calibration points, so we can render the second
      // data-list in calibration-points-repeatable.xml
      group.calpointsDS = new Datasource(
        new JSONDataAdapter({
          allowReload: true,
          idAttribute: "pluscwodspointid",
          loadingDelay: 0,
          searchDelay: 0,
          src: items,
        }),
        {
          autoSave: false,
          idAttribute: "pluscwodspointid",
          name: `calpointsDS${group.groupedBy}`,
          pageSize: items.length,
          selectionMode: "none",
          selectionRequired: false,
        }
      );

      // Load child datasource
      await group.calpointsDS.load();

      // Attach this controller to datasource so we can have
      // access to methods implemented here
      group.calpointsDS.controllers.push(this);
    });

    return groupedCalpointsDS;
  }

  /**
   * Calculate initial status for each calibration point in the list.
   *
   * @param {String} condition - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @param {ProxyObject} assetfunction - Current item from assetfunction datasource.
   * @param {Datasource} calpointsDS - Reference to Calibration point datasource.
   * @param {Datasource} domaincalstatusDS - Reference to Domain Calibration Point Status datasource.
   * @param {Datasource} datasheetConfigDS - Reference to Datasheet Configuration Set datasource.
   * @returns void
   */
  calculateInitialStatus(
    condition,
    assetfunction,
    calpointsDS,
    domaincalstatusDS,
    datasheetConfigDS
  ) {
    // Update datasheetConfigDS based on assetfunctionDS
    this.datasheetCalculation.setDsConfig(datasheetConfigDS.currentItem);

    // Initialize each point and asset function and prepare for calculation
    calpointsDS.items.forEach((calpoint) => {
      calpoint.showWarningOnInputChange = false;
      calpoint.showWarningOnOutputChange = false;
      this.datasheetCalculation.calculateInitialStatus(
        condition,
        calpoint,
        assetfunction,
        domaincalstatusDS
      );
    });
  }

  /**
   * Receives an array of items (calibration points) and group them
   * by argument `groupedBy`. This method is used in createGroupedCalpointsDS
   * to group calibration points by `point` attribute. These grouped points
   * will be rendered in calibration-points-repeatable.xml in double
   * data-list setting.
   *
   * @param {Array} items - Array of objects.
   * @param {String} groupedBy - Attribute name which the items should be grouped into.
   * @returns {Object} Returns a hashset where index is the `groupBy` attribute value
   *                   and the value is a list of calibration points.
   */
  groupBy(items, groupedBy) {
    let hashSet = {};

    // Error! Argument items is not a valid array
    if (!Array.isArray(items)) {
      return hashSet;
    }

    items.forEach((originalItem) => {
      const item = { ...originalItem }; // Cloning item from original datasource to avoid side effects
      const key = item[groupedBy];
      const groupExist = Boolean(hashSet[key]);

      // Group already exist, then we push item into array
      if (groupExist) {
        hashSet[key].push(item);

        // Initializing group
      } else {
        hashSet[key] = [item];
      }
    });

    return hashSet;
  }

  /**
   * Creates a datasource using the hash set with calibration points
   * grouped by `point`.
   *
   * @param {Object} calpointsHashSet
   * @returns {Datasource} Returns instance of Datasource for grouped
   *  calibration points.
   */
  initializeGroupedCalpointsDS(calpointsHashSet) {
    let list = [];
    for (const key in calpointsHashSet) {
      list.push({
        groupedBy: key,
        id: key,
        pointdescription: this.findPointDescription(calpointsHashSet, key),
        calpointsDS: null,
        avgpoint: this.findAvgPoint(calpointsHashSet, key),
        haserror: false,
      });
    }

    const groupedCalpointsDS = new Datasource(
      new JSONDataAdapter({
        src: list,
        loadingDelay: 0,
        searchDelay: 0,
      }),
      {
        autoSave: false,
        name: "groupedCalpointsDS",
        pageSize: list.length,
        selectionMode: "single",
        selectionRequired: false,
        idAttribute: "id",
      }
    );

    // Attach this controller to datasource so we can have
    // access to methods implemented here
    groupedCalpointsDS.controllers.push(this);

    return groupedCalpointsDS;
  }

  /**
   * Find group description.
   *
   * @param {Object} calpointsHashSet - Hashset that groups calibration points by "point".
   * @param {String} key - Value of "point"
   * @returns {String} Returns point description.
   */
  findPointDescription(calpointsHashSet, key) {
    const calpoints = calpointsHashSet[key];

    // Error! Calpoints list is empty
    if (!Array.isArray(calpoints)) {
      return "";
    }

    const firstCalpoint = calpointsHashSet[key][0];

    return `${firstCalpoint.point} ${firstCalpoint.pointdescription || ""}`;
  }

  /**
   * Find calibration point with property `isaverage=true` in the
   * list of calibration points GROUPED by "point". The avgpoint will be
   * used in the UI to display tolerance boundaries (tol1lower, tol1upper,
   * etc.) and the tolerance errors (error1, error2, etc.).
   *
   * @param {Array} calpointsHashSet - Array of calibration points grouped by `point`.
   * @param {String} key - Value of property `point` used to group points.
   * @returns {ProxyObject} Returns the average point
   */
  findAvgPoint(calpointsHashSet, key) {
    return calpointsHashSet[key].find(
      (calpoint) => calpoint.isaverage === true
    );
  }

  /* ------------------------------------------------------------------ */
  /*                                                                    */
  /* Event actions                                                      */
  /*                                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Update calibration point data and perform calculations.
   * This method will perform these actions:
   *
   * 1. Mark data as "dirty", indicating data has changed
   * 2. Verify if user can save form
   * 3. Perform calculations once all repeatable points are entered
   * 4. Update average point with calculation results
   *
   * In point (1) we use the properties _group_index and _index defined in
   * `createGroupedCalpointsDS()` to easily find and update data by
   * accessing the position directly.
   *
   * @param {Object} context : Context object sent by input containing the calpoint and which field triggered the event.
   * @returns {Promise<Object>}
   */
  async changeCalpoint(context) {
    const { item: calpoint } = context;

    const condition = this.getCondition();

    /** @var {String} User locale. */
    const locale = this.getLocale();

    // istanbul ignore next
    if (log.isDebug()) {
      log.d(
        LogConstants.TAG_CALIBRATION,
        printTable(calpoint, [
          "pluscwodspointid",
          `${condition}input`,
          `${condition}output`,
        ])
      );
    }

    // Load datasources
    const groupedCalpointsDS = this.getGroupedCalpointsDS();
    const domaincalstatusDS = this.getDomainCalStatusDS();
    const datasheetDS = this.getDatasheetDS();
    const assetFunctionDS = this.getAssetFunctionDS();

    // Load dependent datasources
    const dsconfig = this.getDsConfig();
    const calpointsDS =
      groupedCalpointsDS.items[calpoint._group_index].calpointsDS;

    // Aliases
    const assetfunction = this.getAssetFunction();
    const maxVars = this.getMaxVars();

    // 2. Verify if user can save form
    //      We should allow user to save partial data. Empty fields are ok,
    //    partial data can be saved if no errors present.

    // Exclude avgpoint and validate only input calpoints
    const calpointsExceptAvg = calpointsDS.items.filter(
      (calpoint) => !calpoint.isaverage
    );

    const formErrorsAllowEmpty = CalibrationPointValidation.validateForm(
      calpointsExceptAvg,
      condition,
      assetfunction,
      locale,
      CalibrationPointConstants.ALLOW_EMPTY
    );

    // Count only field errors and use this value to determine
    // whether form is valid or not
    const formErrorCount =
      CalibrationPointValidation.countErrors(formErrorsAllowEmpty);

    this.setFormValid(formErrorCount === 0);

    // 3. Perform calculations once all repeatable points are entered
    //
    //   According to story GRAPHITE-68869:
    //     a. The Average and Standard Deviation will be calculated once
    //        all repeatable points are entered.
    //     b. Maximo will not calculate errors at the individual point,
    //        and instead all errors will be calculated and viewed with
    //        the Avg and Standard Deviation information.

    const formErrors = CalibrationPointValidation.validateFormErrorsOnly(
      calpointsExceptAvg,
      condition,
      assetfunction,
      locale,
      CalibrationPointConstants.NOT_ALLOW_EMPTY
    );

    if (formErrors.length > 0) {
      return;
    }

    const handler = new CalibrationPointHandler(
      datasheetDS,
      calpointsDS,
      domaincalstatusDS,
      assetFunctionDS,
      dsconfig,
      maxVars,
      locale
    );

    const avgpoint = await handler.performCalculationForRepeatables(
      calpointsDS.items,
      condition
    );

    // 4. Update average point with calculation results
    //
    //      After calculating average point, we need to save the results
    //    back to the grouped calibration point DS. The variable `avgpoint`
    //    is a simple object, therefore we need to iterate over its
    //    properties and update one by one, otherwise it won't be
    //    updated properly.
    //      The groupedCalpointsDS is our "source of truth" and we need
    //    to keep it updated so when the user hits "save()" we send the
    //    correct results.
    //      We need to update average point in two places:
    //    1. The object inside the calpoints list.
    //    2. The object used to display results in the page.
    //      The reason for having two objects is that we need one inside
    //    the list, so we can send the updates to the server, and we
    //    need another one as a mirror to the first, that can be easily
    //    provided by the data-list in the page.
    //      You can look at `initializeGroupedCalpointsDS` for more
    //    details about the structure.

    const avgpointOrigin = calpointsDS.items[avgpoint._index];
    const avgpointMirror =
      groupedCalpointsDS.items[avgpoint._group_index].avgpoint;

    for (const key in avgpoint) {
      avgpointOrigin[key] = avgpoint[key]; // Save avg point results back to original position
      avgpointMirror[key] = avgpoint[key]; // Save avg point results in the mirror to be displayed in UI
    }

    return calpoint;
  }

  onCalpointValueChanged(event){
    // istanbul ignore else
    if(!event.target.dataset.previousValue) {
      event.target.dataset.previousValue = event.target.defaultValue || CalibrationPointConstants.NOT_APPLICABLE;
    }
     // 1. Mark data as "dirty", indicating data has changed
     this.setDirty(true);
  }

  /**
   * If user did not changed any calibration point, then navigate back
   * to where he came. Otherwise, display dialog asking if he wishes
   * to save or discard the changes before leave.
   *
   * @returns void
   */
  async goBack() {
    const isDirty = this.isDirty();

    if (isDirty) {
      this.page.showDialog("discardChanges");
    } else {
      this.undoChanges(); // undo changes from calculateInitialStatus()
      this.app.navigateBack();
    }
  }
  
  undoChanges() {
    const ds = this.getDatasheetDS();
    ds.undoAll();
    this.setDirty(false);
  }

  /**
   * Go back to assetfunctions page when user decides to leave the page
   * and chooses to discard calibration points changes.
   *
   * @returns void
   */
  async discardChanges() {
    // Reset data state
    this.undoChanges();

    const assetfunction = this.page.state.assetfunction;
    const datasheetDS = this.getDatasheetDS();

    // Go to asset functions page
    this.app.setCurrentPage({
      name: "assetfunctions",
      resetScroll: true,
      params: defaults(
        {
          assetfunctiontitle: `${assetfunction?.dsplannum} ${assetfunction?.description}`,
          wodsnum: datasheetDS.currentItem?.wodsnum,
        },
        this.page.params
      ),
    });
  }

  /**
   * Event triggered when user opts to save changes before navigate back.
   * @returns {undefined}
   */
  async saveChanges() {
    // Call changeStatus to save changes
    this.save();

    // Reset state variable
    this.setDirty(false);

    // Go back to previous page
    this.app.navigateBack();
  }

  /**
   * Hide / Collapse the tolerance summary block under each list of
   * calibration points.
   * @returns void
   */
  toggleAssert() {
    this.page.state.asserterror = !this.page.state.asserterror;
  }

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
   * @see validateCalpoint - The synchronous method that performs the actual validation and calculation.
   * @see save - Uses the pendingToleranceCalculationSet to ensure all calculations are complete before saving.
   */
  validateCalPointValuesAndCalculateTolerancesAsync(context, event) {
    const promise = this.validateCalpoint(context, event);

    // Track the promise
    this.page.state.pendingToleranceCalculationSet.add(promise);

    // When done, remove from set
    promise.finally(() => {
      this.page.state.pendingToleranceCalculationSet.delete(promise);
    });

    return promise;
  }

  /**
   * Format and validate calibration point, then check if form is valid.
   * This method will perform these actions:
   *
   * 1. Update the current calibration point data
   * 2. Validate field value
   * 3. Verify if user can save form
   *
   * In point (1) we use the properties _group_index and _index defined in
   * `createGroupedCalpointsDS()` to easily find and update data by
   * accessing the position directly.
   *
   * @param {Object} context : Context object sent by input containing the calpoint and which field triggered the event.
   * @param {Object} event - The event object.
   * @returns {Promise<void>}
   */
  async validateCalpoint(context, event) {

    const { item: calpoint, field } = context;

    const condition = this.getCondition();

    /** @var {String} User locale. */
    const locale = this.getLocale();

    // istanbul ignore next
    if (log.isDebug()) {
      log.d(
        LogConstants.TAG_CALIBRATION,
        printTable(calpoint, [
          "pluscwodspointid",
          `${condition}input`,
          `${condition}output`,
        ])
      );
    }

    // Load datasources
    const groupedCalpointsDS = this.getGroupedCalpointsDS();
    const calpointsDS =
      groupedCalpointsDS.items[calpoint._group_index].calpointsDS;
    const assetfunction = this.getAssetFunction();

    // 1. Update the current calibration point data
    //      Verify if value in calpoint[field] is considered a valid number
    //    based on locale, then format the value: "10" -> "10.00".
    //      If is not a valid number, then keep the original value
    //    and do not not attempt to format it.
    const isNonEmptyNumber = CalibrationPointValidation.isNonEmptyNumber(
      calpoint[field],
      locale
    );

    if(isNonEmptyNumber) {
      calpointsDS.items[calpoint._index][field] = formatCalpoint(calpoint, field, assetfunction, locale);
    }
    
    this.showWarningOnDatasheetChanges(calpoint, field, event.target.dataset.previousValue);
    event.target.dataset.previousValue = '';

    // 2. Validate field value
    this.clearWarnings(calpointsDS, calpoint, field);

    const errors = CalibrationPointValidation.validateField(
      calpoint,
      field,
      assetfunction,
      locale,
      CalibrationPointConstants.ALLOW_EMPTY
    );

    if (errors.length > 0) {
      // Mark form as invalid if found at least one error
      const errorsOnly = errors.filter(
        CalibrationPointValidation.filterErrorsOnly
      );
      if (errorsOnly.length > 0){
        calpoint.isDataValid = true;
        calpoint.showWarningOnInputChange = false;
        calpoint.showWarningOnOutputChange = false;
      }
      this.setFormValid(errorsOnly.length === 0);

      // Display error messages
      this.displayFieldErrors(groupedCalpointsDS, errors);
    }

    // 3. Verify if user can save form
    //      We should allow user to save partial data. Empty fields are ok,
    //    partial data can be saved if no errors present.

    // Exclude avgpoint and validate only input calpoints
    const calpointsExceptAvg = calpointsDS.items.filter(
      (calpoint) => !calpoint.isaverage
    );

    const formErrorsAllowEmpty = CalibrationPointValidation.validateForm(
      calpointsExceptAvg,
      condition,
      assetfunction,
      locale,
      CalibrationPointConstants.ALLOW_EMPTY
    );

    // Count only field errors and use this value to determine
    // whether form is valid or not. If form is not valid, we
    // highlight the group by displaying an icon on top of the
    // group list item on screen
    const errorCount =
      CalibrationPointValidation.countErrors(formErrorsAllowEmpty);

    this.setFormValid(errorCount === 0);
    this.setGroupError(calpoint, errorCount > 0);

    if (this.isFormValid()) {
      await this.changeCalpoint(context);
    }
  }

  /**
   * Save calibration points modified in this page back into
   * main datasource pluscwods.
   *
   * This method will do four things:
   *
   * 1. Get the list of modified calibration points from the grouped list.
   * 2. Update calpoints into main datasource calpointsDS.
   * 3. Update calpointsDS into asset function and datasheet datasources.
   * 3. Save the pluscwods item.
   *
   * @returns void
   */
  async save() {
    // Error! Form is not valid.
    if (!this.isFormValid()) {
      this.app.toast(
        this.app.getLocalizedLabel(
          "to_save_the_record_fix_the_validation_errors",
          "To save the record, fix the validation errors."
        ),
        "error"
      );
      return;
    }

    // Starting saving changes
    this.setSaving(true);

    if (this.page.state.pendingToleranceCalculationSet.size > 0) {
      // Wait for all calculations to finish
      await Promise.all([...this.page.state.pendingToleranceCalculationSet]);
    }

    // Load state variables
    const groupedCalpointsDS = this.page.state.groupedCalpointsDS;

    // Load datasources
    const pluscwoDS = this.getDatasheetDS();
    const domaincalstatusDS = this.getDomainCalStatusDS();
    const calpointsDS = this.app.state.calpointsds;
    const assetFunctionDS = this.getAssetFunctionDS();

    // Load dependent datasources
    const dsconfigDS = this.getDsConfig();

    // Load maxvars
    const maxVars = this.getMaxVars();

    /** @var {String} User locale. */
    const locale = this.getLocale();

    // Here we map all calibration points as array,
    // then we format all values before saving changes
    // and finally we update each calpoint in origin datasource `app.state.calpointsds`
    // with new values.
    this.mapAllCalpointsToArray(groupedCalpointsDS)
      .map(this.formatCalpointBeforeSave)
      .map(this.updateCalpointsIntoDS);

    /**
     * Condition in which the user is accessing the calibration points. Can be "asleft" or "asfound".
     * @type {String}
     */
    const condition = this.getConditionPrefix();

    // Update datasheet and asset function statuses
    const handler = new CalibrationPointHandler(
      pluscwoDS,
      calpointsDS,
      domaincalstatusDS,
      assetFunctionDS,
      dsconfigDS,
      maxVars,
      locale
    );

    // Update status in asset function and parent datasheet
    await handler._completeReadings(
      null,
      condition,
      CalibrationPointConstants.COMPLETE_READINGS_BACKGROUND
    );

    // Save changes in point, asset function and datasheet datasources
    await calpointsDS.save(DatasourceConstants.CALIBRATION_SAVE_OPTIONS);
    this.setSaving(false);

    // The status was updated in handler._completeReadings(); Update page state to reflect updated value.
    this.page.state[`${condition}calstatus`] =
      this.page.state.assetfunction[`${condition}calstatus`];
    this.page.state[`${condition}callabel`] = this.setLabelColor(
      this.page.state[`${condition}calstatus`]
    );

    // istanbul ignore else
    if(this.isToleranceWarningShownOnSave()) {
      this.page.showDialog('showToleranceWarning');
    }

    // Reset data state
    this.setDirty(false);
  }

  /**
   * Map all calibration points of each group and add into a
   * flat array.
   *
   * @param {Datasource} groupedCalpointsDS : Calibration points grouped by `point`.
   * @param {Boolean} keepVirtualAttrs : Defines whether to exclude virtual attributes or not.
   * @returns {Array} Returns an array of calibration points.
   */
  mapAllCalpointsToArray(groupedCalpointsDS, keepVirtualAttrs = false) {
    const calpoints = [];

    // Map through groups and collect calibration points
    groupedCalpointsDS.items.forEach((group) => {
      group.calpointsDS.items.forEach((calpoint) => {
        calpoint.showWarningOnInputChange = false;
        calpoint.showWarningOnOutputChange = false;
        const clone = { ...calpoint };

        // Delete virtual attributes
        // *Note*: In `createGroupedCalpointsDS` we assign a few virtual
        // attributes to help us manage the data in this page and we
        // must remove it before attempting to sync with the main
        // datasource so we don't carry over these attr. Otherwise,
        // the data will be sent to the API and result in failure
        // (attributes don't exist).
        if (!keepVirtualAttrs) {
          CalibrationPointConstants.EXCLUDE_ATTRIBUTES.forEach((attr) => {
            delete clone[attr];
          });
        }

        calpoints.push(clone);
      });
    });

    return calpoints;
  }

  /**
   * Format calibration point before sending to API.
   *
   * *Note*: The entry input is formatted by smart-input based on
   * the configured locale. However, the API will only accept valid
   * numbers, so we need to parse these entries before sending them
   * away, otherwise the request will be refused and return an error.
   *
   *   Example, if locale = "en-US" and user types the value "5000.00":
   *   - The smart-input will format it to "5,000.00"
   *   - In save(), we will receive a list of entries with the formatted values
   *   - Before sending to the server, we map all calpoints and parse them
   *       back from "5,000.00" to "5000.00".
   *
   * @param {ProxyObject} calpoint : Calibration point.
   * @returns {ProxyObject} Returns formatted calibration point.
   */
  // prettier-ignore
  formatCalpointBeforeSave(calpoint) {

    const assetfunction = this.getAssetFunction();
    const condition = this.getCondition();
    const locale = this.getLocale();

    const fields = calpoint.plantype === CalibrationPointConstants.PLANTYPE.ANALOG 
      ? [`${condition}input`, `${condition}output`]
      : [`${condition}setpoint`];

    /**
     * This assignment might affect one of these attributes:
     * @changes calpoint.asfoundinput
     * @changes calpoint.asfoundoutput
     * @changes calpoint.asfoundsetpoint
     * @changes calpoint.asleftinput
     * @changes calpoint.asleftoutput
     * @changes calpoint.asleftsetpoint
     */
    fields.forEach((field) => {
      const isNonEmptyNumber = CalibrationPointValidation.isNonEmptyNumber(
        calpoint[field],
        locale
      );

      calpoint[field] = isNonEmptyNumber
        ? formatCalpoint(calpoint, field, assetfunction, locale)
        : calpoint[field];
    });

    return calpoint;
  }

  /**
   * Update each calculated calibration point back to the origin
   * datasource reference.
   *
   * @param {Datasource} calpointsDS - Main calibration points datasource reference.
   * @param {Array} updatedCalpoints - Array of calibration points updated in the page.
   * @returns {Datasource} Returns updated calpointsDS.
   */
  updateCalpointsIntoDS(calpoint) {
    // Load origin calibration point DS
    const calpointsDS = this.getCalibrationPointsDS();

    for (let i = 0; i < calpointsDS.items.length; i++) {
      // Find first calpoint by its id and update its attributes
      if (calpointsDS.items[i].pluscwodspointid === calpoint.pluscwodspointid) {
        for (const field in calpoint) {
          calpointsDS.items[i][field] = calpoint[field];
        }
        return calpointsDS.items[i];
      }
    }
  }

  /**
   * Display field errors found in groupedCalpointsDS
   *
   * @param {Datasource} groupedCalpointsDS
   * @param {Array<FieldError>} fieldErrors
   * @returns {undefined}
   */
  displayFieldErrors(groupedCalpointsDS, fieldErrors) {
    /**
     * Pick only the first error from the list to display in screen.
     * @var firstError
     * @type {FieldError}
     */
    const firstError = fieldErrors[0];

    const errorType = firstError.getErrorType();
    const calpoint = firstError.getItem();
    const fieldName = firstError.getFieldName();
    const localizedLabel = firstError.getLocalizedLabel();

    // Get datasource references
    const calpointsDS =
      groupedCalpointsDS.items[calpoint._group_index].calpointsDS;
    const calpointRef = calpointsDS.items[calpoint._index];

    // Mark calpoint as fail
    if (fieldName.startsWith(CalibrationPointConstants.CONDITION_ASFOUND)) {
      calpointRef.asfoundfail = true;
    } else {
      calpointRef.asleftfail = true;
    }

    // Displaying errors on screen
    if (errorType === CalibrationPointConstants.FIELD_ERROR) {
      calpointsDS.setWarning(calpointRef, fieldName, localizedLabel);
      return;
    }

    if (
      fieldName.endsWith("output") &&
      errorType === CalibrationPointConstants.FIELD_WARNING
    ) {
      calpointRef._output_exceeded = localizedLabel;
      return;
    }
  }

  /**
   * Clear warning and calibration point flags.
   *
   * @param {Datasource} calpointsDS : Calibration point datasource.
   * @param {ProxyObject} calpoint : Calibration point object.
   * @param {String} field : Field name user is changing.
   * @returns {undefined}
   */
  clearWarnings(calpointsDS, calpoint, field) {
    calpointsDS.clearWarnings(calpoint, field);

    calpoint._output_exceeded = "";
    calpoint._output_exceeded_message = "";
    calpoint.asfoundfail = false;
    calpoint.asleftfail = false;
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
}

export default CalibrationPointsRepeatableController;
