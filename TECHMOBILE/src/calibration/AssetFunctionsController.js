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

/** Utils */
import defaults from "./rules/utils/defaults";

/** Constants */
import CalibrationPointConstants from "./rules/constants/CalibrationPointConstants";
import DatasheetConstants from "./rules/constants/DatasheetConstants";
import DatasourceConstants from "./rules/constants/DatasourceConstants";

/** Utils */
import AssetUnitLookupHelper from "./utils/AssetUnitLookupHelper";
import CalibrationHelper from "./utils/CalibrationHelper";
import CalibrationPointHandler from "./rules/handlers/CalibrationPointHandler";
import SynonymDomain from "./rules/models/SynonymDomain";
import isEmpty from "./rules/utils/numberFormatter/isEmpty";
import toDisplayableValue from "./rules/utils/numberFormatter/toDisplayableValue.js";
import fromDisplayableValue from "./rules/utils/numberFormatter/fromDisplayableValue.js";

/** Graphite */
import { log } from "@maximo/maximo-js-api";

/** Controllers */
import BaseController from "./BaseController";

const TAG = "AssetFunctionsController";

/**
 * AssetFunctionsController
 *
 * @typedef {import('@maximo/maximo-js-api').Page} Page
 * @typedef {import('@maximo/maximo-js-api').Application} Application
 * @typedef {import('@maximo/maximo-js-api').Datasource} Datasource
 */
class AssetFunctionsController extends BaseController {
  pageInitialized(page, app) {
    log.t(TAG, "Page Initialized");
    this.app = app;
    this.page = page;

    /** Binding */
    this.countPoints = this.countPointsByAssetfunction.bind(this);
  }

  async pageResumed(page, app) {
    log.t(TAG, "Page resumed");

    // Start loading
    this.page.state.loading = true;

    this.page = page;
    this.app = app;
    this.assetUnitLookupHelper = new AssetUnitLookupHelper(app, page);

    //istanbul ignore next
    this.page.state.calPointFlag = false;
    this.page.state.calDynamicFlag = false;
    this.page.state.calFunctionFlag = false;
    this.page.state.assetfunctiontitle = page.params.assetfunctiontitle;
    this.page.state.revisionnum = page.params.assetrevisionnum;

    // Ignore fields have to be added to parent
    const datasheetDS = this.getDatasheetDS();
    datasheetDS.addIgnoreField('disableNoadjmade');

    // Should any of these be saved to server?    
    datasheetDS.addIgnoreField('asleftstatus');
    datasheetDS.addIgnoreField('asleftstatusdesc');
    datasheetDS.addIgnoreField('asleftstatusicon');
    datasheetDS.addIgnoreField('widestTol');
    datasheetDS.addIgnoreField('widestTolwidth');
    datasheetDS.addIgnoreField('asfoundstatusdesc_np');
    datasheetDS.addIgnoreField('asfoundstatusicon_np');
    datasheetDS.addIgnoreField('asleftstatusdesc_np');
    datasheetDS.addIgnoreField('asleftstatusicon_np');

    // Complete loading
    this.page.state.loading = false;
    this.enableAsFoundNoAdjustmentMade();
  }

  /*
   * Send back to page where he last visited.
   */
  async goBack() {
    this.app.navigateBack();
  }

  /**
   * Function to handle the click in the Data Sheet List.
   * @param {Object} event
   */
  openCalibrationPoints(event) {
    const assetfunction = event.item;

    this.app.state.status = event.changeText;
    this.app.state.pluscwodsinstrid = assetfunction.pluscwodsinstrid;

    const assetfunctionDS = this.getAssetFunctionDS();
    const index = assetfunctionDS.items.findIndex(instrdata => instrdata.pluscwodsinstrid === Number(assetfunction.pluscwodsinstrid));
    assetfunctionDS.get(index, CalibrationPointConstants.SET_AS_CURRENT);
    this.app.state.selectedAssetFunctionsIndex = index;

    //istanbul ignore else
    if (assetfunction.repeatable) {
      return this.loadCalibrationPointsRepeatablePage(assetfunction);
    }

    //istanbul ignore else
    if (assetfunction.calpoint) {
      return this.loadCalibrationPointsds(assetfunction);
    } else if (assetfunction.calfunction) {
      return this.loadCalibrationFunctionds(assetfunction);
    } else if (assetfunction.caldynamic) {
      return this.loadCalibrationDynamicds(assetfunction);
    }
  }

  /**
   * Load calibration point page as calibration point.
   *
   * @param {Object} item - Calibration point data.
   * @returns Boolean - Returns whether the page was redirected or not.
   */
  loadCalibrationPointsds(item) {
    return this.loadCalibrationPointPage(item, {
      assetfunctionid: item.pluscwodsinstrid,
      caldynamic: false,
      calfunction: false,
      calpoint: item.calpoint,
      inputprecision: item.inputprecision,
      outputprecision: item.outputprecision,
      noadjmade: item.noadjmade,
      calpointtitle: item.description,
      condition: this.app.state.status,
      instrcalrangeeu: item.instrcalrangeeu,
      instroutrangeeu: item.instroutrangeeu,
      asfoundcalstatus: item.asfoundcalstatus,
      asleftcalstatus: item.asleftcalstatus,
    });
  }

  /**
   * Load calibration point page as dynamic point.
   *
   * @param {Object} item - Calibration point data.
   * @returns Boolean - Returns whether the page was redirected or not.
   */
  async loadCalibrationDynamicds(item) {
    return this.loadCalibrationPointPage(item, {
      assetfunctionid: item.pluscwodsinstrid,
      caldynamic: item.caldynamic,
      calfunction: false,
      calpoint: false,
      calpointtitle: item.description,
      condition: this.app.state.status,
      asfoundcalstatus: item.asfoundcalstatus,
      asleftcalstatus: item.asleftcalstatus,
      instrcalrangeeu: item.instrcalrangeeu,
      instrcalrangefrom: item.instrcalrangefrom,
      instrcalrangeto: item.instrcalrangeto,
      instroutrangeeu: item.instroutrangeeu,
      instroutrangefrom: item.instroutrangefrom,
      instroutrangeto: item.instroutrangeto,
    });
  }

  /**
   * Load calibration point page as calibration function.
   *
   * @param {Object} item - Calibration point data.
   * @returns Boolean - Returns whether the page was redirected or not.
   */
  loadCalibrationFunctionds(item) {
    return this.loadCalibrationPointPage(item, {
      assetfunctionid: item.pluscwodsinstrid,
      caldynamic: false,
      calfunction: item.calfunction,
      calpoint: false,
      calpointtitle: item.description,
      condition: this.app.state.status,
      asfoundcalstatus: item.asfoundcalstatus,
      asleftcalstatus: item.asleftcalstatus,
    });
  }

  /**
   * Loads repeating calibration point page.
   *
   * @param {ProxyObject} assetfunction
   * @returns void.
   */
  loadCalibrationPointsRepeatablePage(assetfunction) {
    const datasheetDS = this.getDatasheetDS();

    // istanbul ignore else
    if (assetfunction?.pluscwodsinstrid in datasheetDS.calibrationPointDatasources) {

      const calpointDS = datasheetDS.calibrationPointDatasources[assetfunction.pluscwodsinstrid];
  
      // Save calibration points into app state variable
      this.app.state.calpointsds = calpointDS;
  
      // Go to calibration points repeatable page
      const params = {
        assetfunctionid: assetfunction.pluscwodsinstrid,
        caldynamic: Boolean(assetfunction.caldynamic),
        calfunction: Boolean(assetfunction.calfunction),
        calpoint: Boolean(assetfunction.calpoint),
        calpointtitle: assetfunction.description,
        condition: this.app.state.status,
        instrcalrangeeu: assetfunction.instrcalrangeeu,
        instroutrangeeu: assetfunction.instroutrangeeu,
        asfoundcalstatus: assetfunction.asfoundcalstatus,
        asleftcalstatus: assetfunction.asleftcalstatus,
        inputprecision: assetfunction.inputprecision,
        outputprecision: assetfunction.outputprecision,
      };
  
      this.app.setCurrentPage({
        name: "calpointrepeatable",
        params: defaults(params, this.page.params),
        resetScroll: true,
      });
    }
  }

  /**
   * Set current page based on the condition and type of calibration
   * point the user selected. This method will prepare all data it needs
   * to render the page before redirecting the user. If the redirection
   * succeeds, then it returns True. If asset function datasource is
   * undefined or the calibration point list is empty, it won't load
   * the page and will return False.
   *
   * A calibration point can one of three types:
   * - Function
   * - Point
   * - Dynamic Check
   *
   * And the user can choose to open the calibration point "As Found"
   * or "As Left" condition.
   *
   * @param {ProxyObject} item - Asset function proxy object.
   * @param {Object} overrideParams - Parameters that will override current state.
   * @returns Boolean - Returns whether the page was redirected or not.
   */
  loadCalibrationPointPage(item, overrideParams = {}) {
    // Load asset function datasource
    this.app.state.nopointexist = false;

    const datasheetDS = this.getDatasheetDS();

    // istanbul ignore else
    if (item?.pluscwodsinstrid in datasheetDS.calibrationPointDatasources) {
      const calpointDS = datasheetDS.calibrationPointDatasources[item.pluscwodsinstrid];
  
      // Select page by condition prefix 'asfound' or 'asleft'
      const pagename =
        this.app.state.status === CalibrationPointConstants.CONDITION_ASFOUND
          ? "calibrationpoints"
          : "calibrationasleftpoints";
  
      this.app.state.calpointsds = calpointDS;
  
      this.app.setCurrentPage({
        name: pagename,
        params: defaults(overrideParams, this.page.params),
        resetScroll: true,
      });
  
      return true;
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
        qbe: { dsplannum, revisionnum }
      });
    } else {
      await dsconfig.load();
    }

    return dsconfig;
  }

  /**
   * Getter.
   * @returns {Datasource}
   */
  getDomainCalStatusDS() {
    return this.app.findDatasource("domaincalstatusds");
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
   * Accessing the condition of calibration points the user wants to 
   * access. This parameter is provided in AssetFunctionsController when
   * user clicks to open the calibration points page. 
   * 
   * It can be "As Found" ("asfound") or "As Left" ("asleft").
   * 
   * @returns {String}
   */
  getConditionPrefix(){
    return this.page.state.condition;
  }

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

  /**
   * Open type lookup.
   * @param {Event} event
   */
  async openTypeLookup(event) {
    this.page.state.changeText = event.changeText;
    this.page.state.currentItem = event.item;
    await this.assetUnitLookupHelper.openUnitLookup();
  }

  /**
   * Open environmental conditions.
   */
  async openEnvironmentalConditions() {
    this.page.showDialog("EnvironmentalConditionsDialog");
  }

  // Assisted by watsonx Code Assistant 
  /**
  * Opens the remarks page in a dialog.
  * @returns {void}
  */
  async openRemarks() {
    this.page.showDialog("remarks");
  }

  // Assisted by watsonx Code Assistant 
  /**
  * Save remarks to the database.
  * @async
  * @returns {Promise<void>}
  */
  async saveRemark() {
    const pluscwoDS = this.app.findDatasource("pluscWoDs");
    await pluscwoDS.save(DatasourceConstants.CALIBRATION_SAVE_OPTIONS);

    const remarkDialog = this.page.findDialog(
      "remarks"
    );
    //istanbul ignore next
    if (remarkDialog) {
      await remarkDialog.closeDialog();
    }

    this.app.toast(
      this.app.getLocalizedLabel(
         'remark_saved',
         `Your remarks were added.`
      ),
      'success'
   );
  }

  /**
   * Select Unit the calibration point will be measure with.
   * Examples: Celsius, Fahrenheit, Lbs, etc.
   *
   * @param {ProxyObject} itemSelected - Unit selected by user.
   * @returns void
   */
  // istanbul ignore next
  selectUnits(itemSelected) {
    this.page.state.selectedUnit = itemSelected.value;

    const changeText = this.page.state.changeText;
    const updateValue = this.page.state.currentItem;
    updateValue[changeText] = itemSelected.value;

    // istanbul ignore else
    if (!itemSelected._selected) {
      this.page.state.selectedUnit = "";
    }
  }

  /**
   * Update environment conditions
   */
  async updateEnvironmentConditions() {
    let selectedUnit = this.page.state.selectedUnit;
    const pluscwoDS = this.getDatasheetDS();
    //istanbul ignore else
    if (selectedUnit) {
      await pluscwoDS.save(DatasourceConstants.CALIBRATION_SAVE_OPTIONS);
    }
    const EnvironmentalConditionsDialog = this.page.findDialog(
      "EnvironmentalConditionsDialog"
    );
    //istanbul ignore next
    if (EnvironmentalConditionsDialog) {
      await EnvironmentalConditionsDialog.closeDialog();
    }
  }

  enableAsFoundNoAdjustmentMade() {
    const assetfunctionDS = this.getAssetFunctionDS();
    if (assetfunctionDS && assetfunctionDS.items) {
      for (const instr of assetfunctionDS.items) {
        // istanbul ignore else
        if (instr) {
          // Check if the properties exist before accessing them
          if (instr.noadjmadechoice1 && instr.calpoint) {
            instr.disableNoadjmade = false;
            // istanbul ignore else
            if(instr.pluscwodspoint && instr.pluscwodspoint.length > 0) {
              const { pluscwodspoint } = instr;
              for (const point of pluscwodspoint) {
                  // istanbul ignore next
                  Object.keys(point).forEach((key) => {
                    const value = point[key];
                    const isKeyRelevant = [
                      "asleftinput",
                      "asleftoutput",
                    ].includes(key);
                    const isaverageRelevant = point["isaverage"];
                    if (
                      !instr.noadjmade &&
                      !isaverageRelevant &&
                      ((instr.plantype === "DISCRETE" &&
                        key === "asleftsetpoint" &&
                        !isEmpty(value)) ||
                        (instr.plantype === "ANALOG" &&
                          isKeyRelevant &&
                          !isEmpty(value)))
                    ) {
                      instr.disableNoadjmade = true;
                      return;
                    }
                  });
              }
            }
          }
        }
      }
    }
  }

  /*
   * Switch between up and down state
   */
  //istanbul ignore next
  handleToggled(event) {
    const { item, evt } = event;
    // Directly assign the boolean value based on the checked property
    const newAdjMade = evt.target.checked;
    this.page.state.noadjMade = evt.target.checked;
    item.noadjmade = !this.page.state.noadjMade;
    this.app.state.pluscwodsinstrid = item.pluscwodsinstrid;
    // Use a ternary operator to determine which dialog to show
    const dialog = newAdjMade ? "noAdjLimit" : "noAdjLimitOff";
    this.page.showDialog(dialog);
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
    * Clears the calibration points for the current instruction.
    * @async
    * @returns {Promise<void>}
  */
  async clearCalibrationPoints() {
    const assetfunctionDS = this.getAssetFunctionDS();
    this.page.state.condition = CalibrationPointConstants.CONDITION_ASLEFT;
    const index = assetfunctionDS.items.findIndex(instrdata => instrdata.pluscwodsinstrid === Number(this.app.state.pluscwodsinstrid));
    assetfunctionDS.get(index, CalibrationPointConstants.SET_AS_CURRENT);
    this.app.state.selectedAssetFunctionsIndex = index;

    const datasheetDS = this.getDatasheetDS();
    const calpointDS = datasheetDS.calibrationPointDatasources[assetfunctionDS.currentItem.pluscwodsinstrid];
    this.app.state.calpointsds = calpointDS;

    // Iterate over each property in the item object
    //istanbul ignore else
    if (
      Object.keys(assetfunctionDS.currentItem).length &&
      assetfunctionDS.currentItem.pluscwodspoint
    ) {
      const { pluscwodspoint } = assetfunctionDS.currentItem;

      assetfunctionDS.currentItem.asleftcalstatus = null;

      for (const point of pluscwodspoint) {
        //istanbul ignore next
        if (point) {
          Object.keys(point).forEach((key) => {
            // Check if the property name starts with 'asleft'
            //istanbul ignore else
            if (key.startsWith("asleft")) {
              if (
                key !== "asleftpass" &&
                key !== "asleftfail" &&
                key !== "aslefterror"
              ) {
                // Set the value to null or any other value you prefer
                point[key] = null; // Or you can use `undefined` if preferred
              }
            }
          });
        }
      }
    }
    await this.saveData();
  }

  /**
   * Copy calibration points from "asfound" value to "asleft" values.
   * @param {Event} event
   * @returns void
   */
  async copyCalibrationPoints(event) {
    // Load datasources
    const assetfunctionDS = this.getAssetFunctionDS();
    const index = assetfunctionDS.items.findIndex(
      (instrdata) =>
        instrdata.pluscwodsinstrid === Number(this.app.state.pluscwodsinstrid)
    );
    assetfunctionDS.get(index, CalibrationPointConstants.SET_AS_CURRENT);
    this.app.state.selectedAssetFunctionsIndex = index;
    this.page.state.condition = CalibrationPointConstants.CONDITION_ASLEFT;

    const datasheetDS = this.getDatasheetDS();
    const calpointDS = datasheetDS.calibrationPointDatasources[assetfunctionDS.currentItem.pluscwodsinstrid];
    this.app.state.calpointsds = calpointDS;

    this.copyValuesToAsLeft({
      item: event.item,
      datasource: event.datasource,
      currentitem: assetfunctionDS.currentItem,
    });

    await this.saveData();
  }

  /**
   * Copy calibration point's asfound values into asleft with out adjustment
   * @param {*} event
   */
  async copyValuesToAsLeft(event) {
    const { currentitem } = event;

    //istanbul ignore else
    if (currentitem && currentitem.pluscwodspoint) {
      const { pluscwodspoint, calpoint } = currentitem;

      const propertyMappings = [
        "error",
        "input",
        "output",
        "setpoint",
        "statusicon",
        "statusdesc",
        "proerror",
        "outerror",
        "pass",
        "fail",
        "calstatus",
        "unit",
        "tol1upper",
        "tol2upper",
        "tol3upper",
        "tol4upper",
        "tol1lower",
        "tol2lower",
        "tol3lower",
        "tol4lower",
        "tol1lworig",
        "tol2lworig",
        "tol3lworig",
        "tol4lworig",
        "tol1uporig",
        "tol2uporig",
        "tol3uporig",
        "tol4uporig",
      ];

      const copyPropertiesWithPrefix = (point, fromPrefix, toPrefix) => {
        propertyMappings.forEach((prop) => {
          const fromProperty = `${fromPrefix}${prop}`;
          const toProperty = `${toPrefix}${prop}`;

          //istanbul ignore else
          if (point[fromProperty] !== undefined) {
            point[toProperty] = point[fromProperty];
          }

          // Handle indexed properties like error1, error2, etc.
          for (let i = 1; i < 5; i++) {
            const fromIndexedProperty = `${fromPrefix}${prop}${i}`;
            const toIndexedProperty = `${toPrefix}${prop}${i}`;

            //istanbul ignore next
            if (point[fromIndexedProperty] !== undefined) {
              point[toIndexedProperty] = point[fromIndexedProperty];
            }
          }
        });
      };

      pluscwodspoint.forEach((point) => {
        //istanbul ignore else
        if (point) {
          //istanbul ignore else
          if (calpoint && (point.asfoundinput || point.asfoundoutput)) {
            copyPropertiesWithPrefix(point, "asfound", "asleft");
          } else if (calpoint && point.asfoundsetpoint) {
            copyPropertiesWithPrefix(point, "asfound", "asleft");
          }
        }
      });
    }
  }

  /**
   * Save Data.
   *
   * @param {Event} event
   */
  async saveData() {
    this.page.state.loading = true;
    const pluscwoDS = this.getDatasheetDS();
    const assetfunctionDS = this.getAssetFunctionDS();
    const calpointsDS = this.getCalibrationPointsDS();
    // Load datasources
    const domaincalstatusDS = this.getDomainCalStatusDS();

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

    // Update status in asset function and parent datasheet
    await handler._completeReadings(
      null,
      condition,
      CalibrationPointConstants.COMPLETE_READINGS_BACKGROUND
    );

    // Save changes in asset function and parent datasheet
    await assetfunctionDS.save(DatasourceConstants.CALIBRATION_SAVE_OPTIONS);

    // Reload child datasources before updating noadjmade on asset function
    this.page.state.loading = true;
    // Reloading ensures subsequent changes are detected by the datasource observers
    await pluscwoDS.forceReloadAndWaitForChildren();    
    await this.updateNoAdjustMade();
    this.page.state.loading = false;

    return null;
  }

  /*
   * noadjmade needs to be saved separately after the main save
   * to avoid a '...has been updated by another user' type error
   * (presumably setting noadjmade=true triggers some additional
   *  complex logic on the back end)
   */   
  async updateNoAdjustMade() {
    const assetfunctionDS = this.getAssetFunctionDS();
    assetfunctionDS.currentItem.noadjmade = this.page.state.noadjMade;
    await assetfunctionDS.save(DatasourceConstants.CALIBRATION_SAVE_OPTIONS);
  }

  /**
   * Counting calibration points for this asset function.
   * This function is being used to count points and display it in
   * the xml page, which we call it with `callController()`.
   *
   * This is important because there's a nuance between repeatable
   * and Non-repeatable pages. If datasheet is repeatable, we need
   * to ignore all points marked as `isaverage=true`.
   *   If datasheet is Non-Repeatable, we go ahead and return the
   * list size.
   *
   * @param {ProxyObject} assetfunction - Asset function data.
   * @returns {Number}
   */
  // istanbul ignore next
  countPointsByAssetfunction(assetfunction) {
    // Aliases
    const { pluscwodspoint, repeatable } = assetfunction;

    //istanbul ignore else
    if (!Array.isArray(pluscwodspoint)) {
      return "-";
    }

    // If repeatable, we filter the list and count all points
    // that are NOT marked as `isaverage`. If Non-repeatable,
    // then we just return list size.
    return repeatable
      ? pluscwodspoint.filter((calpoint) => calpoint.isaverage !== true).length
      : pluscwodspoint.length;
  }

  /**
   * Receives error count "asfounderror" or "aslefterror" and returns
   * a localized label to be displayed right below asset function.
   *
   * @param {Number} errorCount
   * @returns {String} Returns label displaying the error count in asset function.
   */
  getLocalizedLabelErrorCount(errorCount) {
    //istanbul ignore next
    return errorCount > 0
      ? this.app.getLocalizedLabel("n_errors", `${errorCount} error(s)`, [
        errorCount,
      ])
      : this.app.getLocalizedLabel("no_errors_to_show", "No errors to show");
  }

  /**
   * Open change status sliding-drawer component and let the user
   * choose the value for the asset function.
   *
   * @param {Event} event
   * @returns void
   */
  async openChangeStatusDialog(event) {
    /**
     * Current asset function status.
     * This assignment might affect one of these attributes:
     * @access datasheet.asfoundcalstatus
     * @access datasheet.asleftcalstatus
     * @type {String}
     */
    const status = event.item[`${event.condition}calstatus`];

    // Assign condition and asset function temporarily to be used in dialog
    this.page.state.condition = event.condition;
    this.page.state.assetfunction = event.item;

    // Load handler
    const synonymDS = this.app.findDatasource("synonymdomainData");
    const statusListDS = this.app.findDatasource("assetFunctionStatusListDS");
    const domainCalStatusDs = this.app.findDatasource("domaincalstatusds");
    const synonymHandler = new SynonymDomain(synonymDS, statusListDS);
    const status_maxvalue = SynonymDomain.resolveToInternal(domainCalStatusDs, status);

    /**
     * Determine whether datasheet status can be manually updated
     * or be calculated by calibration handler.
     * @type {Boolean}
     */
    const autoupdate = CalibrationHelper.getAutoUpdate();

    // If autoupdate option is set to False, then status won't
    // be calculated by calibration point handler. Therefore, the user
    // needs to set the status manually (to any option he wishes).
    if (!autoupdate) {
      await synonymHandler.showAllStatus();
      this.page.showDialog("assetFunctionStatusDialog");
      return;
    }

    // If autoupdate is set to True, then it is expected that the
    // Asset function status should be calculated by calibration point
    // handler. As a safe measure, we filter the status list to a
    // reduced set of options based on the current value.
    // istanbul ignore else
    if (autoupdate) {
      // If status exists and is neither BROKEN nor MISSING,
      // then user is not allowed to change it.
      if (
        status_maxvalue &&
        ![
          DatasheetConstants.STATUS_BROKEN,
          DatasheetConstants.STATUS_MISSING,
        ].includes(status_maxvalue)
      ) {
        log.d(
          TAG,
          "User cannot change status that is neither Broken nor Missing."
        );
        return;

        // If status is EMPTY, BROKEN or MISSING, then the user
        // can change it to either BROKEN or MISSING.
      } else {
        log.d(TAG, "Can be manually updated by user.");
        await synonymHandler.showFilteredStatus();
        this.page.showDialog("assetFunctionStatusDialog");
      }
    }
  }

  /**
   * Reset Asset Function status to null
   * @param {ProxyObject} item
   */
  async resetAssetFunctionStatus() {
    const { assetfunction, condition } = this.page.state;

    // Change asset function status locally
    assetfunction[`${condition}calstatus`] = null;

    // Load datasource
    const datasheetDS = this.getDatasheetDS();

    // Find index to asset function in main datasheet datasource
    // and update its status.
    const index = datasheetDS.currentItem.pluscwodsinstr.findIndex(
      (af) => af.pluscwodsinstrid === assetfunction.pluscwodsinstrid
    );

    // istanbul ignore else
    if (index >= 0) {
      datasheetDS.currentItem.pluscwodsinstr[index][`${condition}calstatus`] =
        null;
      datasheetDS.currentItem[`${condition}calstatus`] =
        CalibrationHelper.checkMissingOrBrokenStatus(
          datasheetDS.currentItem.pluscwodsinstr,
          condition,
          this.getDomainCalStatusDS()
        );
      await datasheetDS.save(DatasourceConstants.CALIBRATION_SAVE_OPTIONS);
    }

    // Close dialog after updating status
    this.page.findDialog("assetFunctionStatusDialog")?.closeDialog();
  }

  /**
   * Change Asset Function status.
   * @param {ProxyObject} item
   */
  async changeAssetFunctionStatus(item) {
    const { assetfunction, condition } = this.page.state;

    // Change asset function status locally
    assetfunction[`${condition}calstatus`] = item.value;

    // Load datasource
    const datasheetDS = this.getDatasheetDS();

    // Find index to asset function in main datasheet datasource
    // and update its status.
    const index = datasheetDS.currentItem.pluscwodsinstr.findIndex(
      (af) => af.pluscwodsinstrid === assetfunction.pluscwodsinstrid
    );

    if (index >= 0) {
      datasheetDS.currentItem.pluscwodsinstr[index][`${condition}calstatus`] =
        item.value;
      datasheetDS.currentItem[`${condition}calstatus`] = CalibrationHelper.checkMissingOrBrokenStatus(
        datasheetDS.currentItem.pluscwodsinstr,
        condition,
        this.getDomainCalStatusDS()
      );
      await datasheetDS.save(DatasourceConstants.CALIBRATION_SAVE_OPTIONS);
    }

    // Close dialog after updating status
    this.page.findDialog("assetFunctionStatusDialog")?.closeDialog();
  }

  returnInternalStatusValue(status) {
    return SynonymDomain.resolveToInternal(this.getDomainCalStatusDS(), status);
  }

  getLabelColorForInternalStatusValue(status) {
    const status_maxvalue = this.returnInternalStatusValue(status);
    return status_maxvalue === 'PASS' ? 'green' : status_maxvalue === 'FAIL' ? 'red' : 'gray';
  }

  /**
   * Returns the locale for input and output.
   * @param {string} whichfieldtype input or output
   * @returns {string} The locale for input and output.
   */
  //istanbul ignore next
  getLocaleNumber(itemValue, whichfieldtype) {
    const locale = this.getLocale();
    const finalPrecision = this.getPrecision(whichfieldtype);
    const itemValueNumber = fromDisplayableValue(itemValue, locale);
    return toDisplayableValue(
      itemValueNumber,
      {
        places:finalPrecision
      },
      locale
    );
  }

  /**
   * Method to determine the precision based on the field type.
   *
   * @param {string} whichfieldtype - The field type (e.g., 'instrcal', 'range', etc.)
   * @param {number} inputprecision - The input precision value.
   * @param {number} outputprecision - The output precision value.
   * @returns {number} The determined precision value (input or output).
  */
  getPrecision(whichfieldtype) {
    const { inputprecision, outputprecision, inputrange, outputrange } = this.getAssetFunctionDS().item;
    const startsWith = (prefix) => whichfieldtype.startsWith(prefix);

    if (startsWith('instrcal') || startsWith('ron1')) return inputprecision;

    if (startsWith('tol') || startsWith('gb')) {
      if (inputrange) return inputprecision;
      if (outputrange) return outputprecision;
    }
    return outputprecision; // default fallback
  }
}
export default AssetFunctionsController;
