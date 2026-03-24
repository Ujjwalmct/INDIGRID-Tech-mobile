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
import LocaleConstants from "../constants/LocaleConstants";
import LogConstants from "../constants/LogConstants";

/** Helpers */
import SynonymDomain from "../models/SynonymDomain";
import DecimalCalculator from "../utils/DecimalCalculator";

/** Utils */
import decimalPlacesOf from "../utils/numberFormatter/decimalPlacesOf";
import fromDisplayableValue from "../utils/numberFormatter/fromDisplayableValue";
import toDisplayableValue from "../utils/numberFormatter/toDisplayableValue";
import invalidTolerance from "../utils/invalidTolerance";
import printTable from "../../utils/printTable";
import isEmpty from "../utils/numberFormatter/isEmpty";

/** Log */
import { log } from "@maximo/maximo-js-api";

/**
 * Datasheet Calculation class.
 * @class
 * @constructor
 * @public
 *
 * @typedef {import('@maximo/maximo-js-api').Page} Page
 * @typedef {import('@maximo/maximo-js-api').Application} Application
 * @typedef {import('@maximo/maximo-js-api').Datasource} Datasource
 */
class DatasheetCalculation {
  /**
   * Reference to datasource "domaincalstatusds".
   * @type {Datasource}
   * @private
   */
  domainCalStatusDS = null;

  /**
   * Current item in datasource "dsconfig".
   * @type {ProxyObject}
   * @private
   */
  dsconfigItem = null;

  /**
   * Device locale.
   * @type {String}
   * @private
   */
  locale = LocaleConstants.EN_US;

  /**
   * Character used for decimal separator based on device locale.
   * @type {String}
   * @private
   */
  decimalSeparator = null;

  /**
   * @param {ProxyObject} dsconfigItem - Current item in datasource "dsconfig".
   * @param {String} locale - User locale.
   */
  constructor(dsconfigItem, locale = LocaleConstants.EN_US, domainCalStatusDS) {
    this.dsconfigItem = dsconfigItem;
    this.setLocale(locale);
    this.setDomainCalStatusDS(domainCalStatusDS);
  }

  /**
   * Get ds config current item instance.
   * @returns {ProxyObject}
   */
  getDsConfigItem() {
    return this.dsconfigItem ? this.dsconfigItem : null;
  }

  /**
   * Define dsconfigItem: datasheet configuration item.
   * @param {ProxyObject} dsconfig
   * @returns void
   */
  setDsConfig(dsconfig) {
    this.dsconfigItem = dsconfig;
  }

  /**
   * Getter.
   * @returns {Datasource}
   */
  getDomainCalStatusDS() {
    return this.domainCalStatusDS;
  }

  /**
   * Get Locale.
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
   * Set calibration status datasource reference.
   * @param {Datasource} calstatus - Reference to datasource "domaincalstatusds" defined in app.xml.
   * @returns
   */
  setDomainCalStatusDS(domainCalStatusDS) {
    this.domainCalStatusDS = domainCalStatusDS;
    return;
  }

  /**
   * Determine the initial status for all asset functions and calibration points.
   *
   * @param {String} sPrefix - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @param {ProxyObject} pointItem - Item reference to datasource "pluscwodspoint" defined in app.xml.
   * @param {ProxyObject} instrItem - Item reference to datasource "pluscwodsinstr" defined in app.xml.
   * @param {Datasource} domaincalstatusds - Reference to datasource "domaincalstatusds" defined in app.xml.
   * @returns Boolean - Returns whether tolerance was exceeded or not.
   */
  calculateInitialStatus(sPrefix, pointItem, instrItem, domaincalstatusds) {
    // Error! Asset function is linear, input is defined but output is NULL
    if (
      !instrItem?.nonlinear &&
      pointItem[`${sPrefix}input`] !== null &&
      pointItem[`${sPrefix}output`] === null
    ) {
      return null;
    }

    // Error! Neither input or output values were defined
    if (!pointItem[`${sPrefix}output`] || !pointItem[`${sPrefix}input`]) {
      return null;
    }

    this.setDomainCalStatusDS(domaincalstatusds);

    const toleranceRoundOption = this.getRoundOption("toltruncate");

    const actualPrecision = this.calculatePrecision(pointItem, sPrefix);

    const rightPrecision = this.getPointTolPrecision(
      pointItem,
      instrItem,
      sPrefix,
      actualPrecision
    );

    const outputValue =
      pointItem.plantype === CalibrationPointConstants.PLANTYPE.DISCRETE
        ? pointItem[`${sPrefix}setpoint`]
        : pointItem[`${sPrefix}output`];

    // Calculate tolerance errors
    const tolExceeded = this.calculateToleranceErrors(
      sPrefix,
      pointItem,
      instrItem,
      outputValue,
      {
        places: rightPrecision,
        round: toleranceRoundOption,
      }
    );

    return tolExceeded;
  }

  /**
   * Calculate quantity of fraction digits the input and output values
   * have for a given condition. Condition sPrefix can be "As Found" or
   * "As Left". If empty, then it should use the default properties
   * "inputvalue" and "outputvallue".
   *
   * For example:
   *   if input = 0.123 and ouput = 0.1234,
   *   the result should be: { input: 3, output: 4 }.
   *
   * @param {ProxyItem} pointItem - Calibration point data.
   * @param {String} sPrefix - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @returns Object - Object with quantity of fraction digits for input and output.
   */
  calculatePrecision(pointItem, sPrefix) {
    let input = pointItem["inputvalue"],
      output = pointItem["outputvallue"];

    if (sPrefix) {
      input = pointItem[`${sPrefix}input`];
      output = pointItem[`${sPrefix}output`];
    }

    return {
      input: decimalPlacesOf(input),
      output: decimalPlacesOf(output),
    };
  }

  /**
   * Returns the rigth tolerance precision for the field group, denoted
   * by its prefix for the given point.
   * @param {ProxyObject} pointItem - Item reference to datasource "pluscwodspoint" defined in app.xml.
   * @param {ProxyObject} instrItem - Item reference to datasource "pluscwodsinstr" defined in app.xml.
   * @param {String} fieldPrefix - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @param {Object} actualPrecision - Object generated by method `calculatePrecision`.
   * @returns
   */
  getPointTolPrecision(pointItem, instrItem, fieldPrefix, actualPrecision) {
    if (pointItem.plantype === CalibrationPointConstants.PLANTYPE.ANALOG) {
      return this.getTolPrecision(
        instrItem.outputprecision,
        actualPrecision.output,
        actualPrecision.input
      );
    }

    if (pointItem.plantype === CalibrationPointConstants.PLANTYPE.DISCRETE) {
      const num =
        fieldPrefix === ""
          ? pointItem.setpointvalue
          : pointItem[`${fieldPrefix}setpoint`];
      return decimalPlacesOf(num);
    }

    return 0;
  }

  /**
   * Defines the right precision to be used for tolerance limits and errors.
   * Formula Rounding or Truncation.
   * @param {Number} minOutputPrecision
   * @param {Number} actualOutputPrecision
   * @param {Number} actualInputPrecision
   * @returns Number
   */
  getTolPrecision(
    minOutputPrecision,
    actualOutputPrecision,
    actualInputPrecision
  ) {
    const dsconfig = this.getDsConfigItem();

    let rightPrecision = 0;

    switch (dsconfig?.tolerror) {
      case DatasheetConstants.TOLERANCE.USE_INSTR_OUTPUT:
        rightPrecision = minOutputPrecision + this.dsconfigItem.tolnplaces;
        break;
      case DatasheetConstants.TOLERANCE.USE_POINT_IO:
        rightPrecision =
          actualInputPrecision > actualOutputPrecision
            ? actualInputPrecision
            : actualOutputPrecision + 1;
        break;
      default:
        rightPrecision = minOutputPrecision;
        break;
    }

    return rightPrecision;
  }

  /**
   * Translate flag value from datasheet configuration attribute to
   * dojo truncate format, where: 0=round, -1=don't round (truncate).
   *
   * @param {String} attribute - attribute of the flag.
   * @returns {Number} 0 = round, -1 = truncate
   */
  getRoundOption(attribute) {
    const dsconfigItem = this.getDsConfigItem();

    if (dsconfigItem === null) {
      return DatasheetConstants.TRUNCATE_VALUE;
    }

    // dojo.number.format round option: 0=round, -1=don't round (truncate)
    return dsconfigItem[attribute]
      ? DatasheetConstants.TRUNCATE_VALUE
      : DatasheetConstants.ROUND_VALUE;
  }

  /**
   * Calculate tolerance errors.
   *
   * @param {String} sPrefix - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @param {ProxyObject} pointItem - Item reference to datasource "pluscwodspoint" defined in app.xml.
   * @param {ProxyObject} instrItem - Item reference to datasource "pluscwodsinstr" defined in app.xml.
   * @param {Number} output - Calculated output value.
   * @param {Object} options - Object consisting of properties: places, round.
   * @returns {Boolean} tolExceeded - Returns flag indicate the output value exceed tolerance values.
   */
  calculateToleranceErrors(sPrefix, pointItem, instrItem, output, options) {
    /** @var {String} */
    const locale = this.getLocale();

    /** @var {Boolean} */
    let tolExceeded = false;

    /** @var {String} */
    let status = null;

    /** @var {String} */
    let statusIcon = null;

    /** @var {String} */
    let outputValue = fromDisplayableValue(output, locale);

    for (let tol = 1; tol < 5; tol++) {
      const lowToleranceStr = pointItem[`${sPrefix}tol${tol}lower`];
      const lowTolerance = fromDisplayableValue(lowToleranceStr, locale);

      const highToleranceStr = pointItem[`${sPrefix}tol${tol}upper`];
      const highTolerance = fromDisplayableValue(highToleranceStr, locale);

      // No tolerance value is assigned
      if (invalidTolerance(lowTolerance) && invalidTolerance(highTolerance)) {
        continue;
      }

      let value = "";

      // Output value is under control
      // Set status as PASS and set associated "error" property to 0.
      if (outputValue >= lowTolerance && outputValue <= highTolerance) {
        status = SynonymDomain.resolveToDefaultExternal(
          this.domainCalStatusDS,
          DatasheetConstants.STATUS_PASS
        );
        statusIcon = DatasheetConstants.STATUS_PASS;

        value = toDisplayableValue(0, options, locale);
        pointItem[`${sPrefix}error${tol}`] = value;

        // Output is out of bounds!
      } else {
        tolExceeded = true;
        status = instrItem[`tol${tol}status`];
        statusIcon = SynonymDomain.resolveToInternal(this.domainCalStatusDS, status);

        const synonym = this.resolveToDefaultExternalSynonym(statusIcon);

        switch (statusIcon) {
          case DatasheetConstants.STATUS_FAIL:
            statusIcon = DatasheetConstants.STATUS_FAIL;
            break;
          case DatasheetConstants.STATUS_PASS:
            statusIcon = DatasheetConstants.STATUS_PASS;
            break;
          // Anything other than pass or fail is a WARNING icon
          default:
            statusIcon = DatasheetConstants.STATUS_WARNING;
        }

        // Attempt to update status information
        pointItem[`${sPrefix}status`] = status;
        pointItem[`${sPrefix}statusicon`] = statusIcon;
        pointItem[`${sPrefix}statusdesc`] = synonym.description;

        // Saving difference between output and the upper/lower bound
        // istanbul ignore else
        if (outputValue < lowTolerance || outputValue > highTolerance) {
          const valueToBeSubtracted =
            outputValue < lowTolerance ? lowTolerance : highTolerance;
          value = this.minusZeroMakeUp(outputValue - valueToBeSubtracted);
          if (options.round === DatasheetConstants.TRUNCATE_VALUE) {
            value = this.roundingLastDigitOfError(value, options.places);
          }
          value = toDisplayableValue(value, options, locale);
        }

        // Save output value and flip general error flag

        /**
         * This assignment affects one of these attributes:
         * @alias calpoint.asfounderror1
         * @alias calpoint.asfounderror2
         * @alias calpoint.asfounderror3
         * @alias calpoint.asfounderror4
         * @alias calpoint.aslefterror1
         * @alias calpoint.aslefterror2
         * @alias calpoint.aslefterror3
         * @alias calpoint.aslefterror4
         */
        pointItem[`${sPrefix}error${tol}`] = value;

        /**
         * This assignment affects one of these attributes:
         * @alias calpoint.asfounderror
         * @alias calpoint.aslefterror
         */
        pointItem[`${sPrefix}error`] = true;
      }
    } // end for loop: for (let tol = 1; tol < 5; tol++)

    // Status got updated for exceeded case, otherwise update now
    if (!tolExceeded) {
      status = status
        ? status
        : SynonymDomain.resolveToDefaultExternal(
            this.domainCalStatusDS,
            DatasheetConstants.STATUS_PASS
          );

      statusIcon = SynonymDomain.resolveToInternal(this.domainCalStatusDS, status);

      // Update point
      pointItem[`${sPrefix}status`] = status;
      pointItem[`${sPrefix}statusicon`] = statusIcon;
      pointItem[`${sPrefix}error`] = false; // Clear general error flag

      // Update description
      const synonym = this.resolveToDefaultExternalSynonym(statusIcon);
      pointItem[`${sPrefix}statusdesc`] = synonym.description;
    }

    return tolExceeded;
  }

  /**
   *
   * @param {*} statusIcon
   * @returns
   */
  // TODO: GRAPHITE-70964 refactor: implement resolveToDefaultExternalSynonym in DatasheetCalculation
  // this.calstatus should be datasource "domaincalstatus" located int: MaximoAnywhere/apps/WorkExecution/artifact/app.xml#L11388-L11403
  // Should access datasource, perform search and return first item
  resolveToDefaultExternalSynonym(maxvalue) {
    return {
      description: "Warning Limit not Exceeded",
    };
  }

  /**
   * Reduce precision to baseline if the value exceed the upper limit
   * threshold. Javascript has problems calculating floating points [1].
   *
   * It is possible to have some anomalies while calculating tolerance
   * errors, such as a flip error that transforms "0.5" (1 decimal)
   * into "0.499999999...9" (20 decimals).
   *
   * This function is intended to detect and correct the course, keeping
   * the value under the baseline to avoid error propagation.
   *
   * References:
   * 1. https://www.codemag.com/article/1811041/JavaScript-Corner-Math-and-the-Pitfalls-of-Floating-Point-Numbers
   *
   * @param {Number} value
   * @returns {String}
   */
  minusZeroMakeUp(value) {
    if (value === "") return value;

    let fractionDigits = decimalPlacesOf(value);

    // If no precision if informed, truncate the value
    if (fractionDigits == null || fractionDigits <= 0) {
      return Math.trunc(value).toString();
    }

    // Correcting flip error by truncating the precision back to baseline
    if (fractionDigits > DatasheetConstants.FRACTION_DIGITS_MAX) {
      return Number(value).toFixed(DatasheetConstants.FRACTION_DIGITS_BASELINE);
    }

    return value.toString();
  }

  /**
   * Calculate precision and returns an object that is compatible
   * with toDisplayableValue options parameter.
   *
   * @param {ProxyObject} item - Calibration point data object.
   * @param {String} conditionPrefix - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @param {ProxyObject} instrItem - Asset function data object.
   * @returns Object compatible with parameter 'options' from toDisplayableValue.
   */

  getRoundingOptionsObject(item, conditionPrefix, instrItem) {
    return {
      places: this.getPointTolPrecision(
        item,
        instrItem,
        conditionPrefix,
        this.calculatePrecision(item, conditionPrefix)
      ),
      round: this.getRoundOption("toltruncate"),
    };
  }

  /**
   * Calculate Asset error, updates error in point based on sPrefix and returns the error as a number
   * @param {String} sPrefix
   * @param {ProxyObject} point
   * @param {ProxyObject} instr
   * @param {Number} input
   * @param {Number} output
   * @param {ProxyObject} attrs
   * @param {Boolean} isOpposite
   * @param {Array} actualPrecision
   * @param {Array} options
   * @returns {any}
   */
  calculateAssetError(
    sPrefix,
    point,
    instr,
    input,
    output,
    attrs,
    isOpposite,
    actualPrecision,
    options
  ) {
    const locale = this.getLocale();

    let error = "";

    const calculator = new DecimalCalculator();
    const prefixinput = fromDisplayableValue(input, locale);
    const prefixoutput = fromDisplayableValue(output, locale);

    let finalValue = 0;
    if (point.plantype === "DISCRETE") {
      error = prefixoutput - prefixinput;
    } else {
      let inputInOutputEU = 0;
      if (instr["nonlinear"]) {
        // if the instrument is non-linear, use the desired output value for the calculation
        inputInOutputEU = fromDisplayableValue(point["outputvalue"], locale);
      } else {
        let negative_state = 1;
        //Squared Calculation for Reverse Flow Calibration
        if (instr["squared"]) {
          if (prefixinput.toString().charAt(0) === "-") {
            negative_state = -1;
          } else if (prefixinput === 0) {
            negative_state = 0;
          }

          if (negative_state === 0) {
            inputInOutputEU = attrs["outputFrom"];
          } else if (negative_state === -1) {
            finalValue =
              attrs["outputFrom"] -
              Math.pow(
                (prefixinput - attrs["inputFrom"]) / attrs["instrInputSpan"],
                2
              ) *
                attrs["instrOutputSpan"];
            inputInOutputEU = finalValue;
          } else {
            finalValue =
              attrs["outputFrom"] +
              Math.pow(
                (prefixinput - attrs["inputFrom"]) / attrs["instrInputSpan"],
                2
              ) *
                attrs["instrOutputSpan"];
            inputInOutputEU = finalValue;
          }
        } else if (instr["squareroot"]) {
          if (prefixinput.toString().charAt(0) === "-") {
            negative_state = -1;
          } else if (prefixinput === 0) {
            negative_state = 0;
          }

          if (negative_state === 0) {
            inputInOutputEU = attrs["outputFrom"];
          } else if (negative_state === -1) {
            finalValue =
              attrs["outputFrom"] -
              Math.sqrt(prefixinput / attrs["inputTo"]) *
                attrs["instrOutputSpan"];
            inputInOutputEU = finalValue;
          } else {
            finalValue =
              attrs["outputFrom"] +
              Math.sqrt(prefixinput / attrs["inputTo"]) *
                attrs["instrOutputSpan"];
            inputInOutputEU = finalValue;
          }
        } else {
          if (isOpposite) {
            finalValue =
              attrs["outputTo"] -
              (prefixinput - attrs["inputFrom"]) *
                (attrs["instrOutputSpan"] / attrs["instrInputSpan"]);
          } else {
            finalValue =
              attrs["outputFrom"] +
              (prefixinput - attrs["inputFrom"]) *
                (attrs["instrOutputSpan"] / attrs["instrInputSpan"]);
          }
          inputInOutputEU = finalValue;
        }
      }
      options["places"] = this.getAssetPrecision(
        options.places,
        actualPrecision
      );
      error = calculator.minus(prefixoutput, inputInOutputEU);
    }
    // e
    if (isEmpty(error)) {
      point.setNullValue(sPrefix + "outerror");
    } else {
      error = this.minusZeroMakeUp(error);
      if (options.round === DatasheetConstants.TRUNCATE_VALUE) {
        error = this.roundingLastDigitOfError(error, options.places);
      }
      error = toDisplayableValue(error, options, locale);
      point[sPrefix + "outerror"] = calculator.convertNegativeZero(error);
    }

    if (!isEmpty(error) && !isNaN(error)) {
      this.checkValueLength(point, error);
    }

    return error;
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  /**
   * checkValueLength
   *
   * @param {object} point - The point object
   * @param {number} value - The value to check
   * @returns {void}
   *
   * This function checks if the value length or decimal places of a value exceed the allowed limit. If they do, it sets the invalidValueFound property of the point object to true. Otherwise, it sets it to false. It takes two arguments: the point object and the value to check. It does not return anything.
   */
  checkValueLength(point, value) {
    if (
      (value && value.toString().length > 15) ||
      (value && decimalPlacesOf(value) > 10)
    )
      point["invalidValueFound"] = !!(point["invalidValueFound"] | true);
    else point["invalidValueFound"] = !!(point["invalidValueFound"] | false);
  }

  /**
   * Calculates the tolerance for points that are analog or discrete.
   * @see {@link https://github.ibm.com/maximo/anywhere-applications-old/blob/ddba64a4af5caa415fca6e9c8f697cea58540388/MaximoAnywhere/apps/WorkExecutionDemo/common/js/application/business/calibration/DataSheetCalculation.js#L37}
   *
   * @param {String} sPrefix - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @param {ProxyObject} point - Calibration point ProxyObject.
   * @param {ProxyObject} instr - Assetfunction ProxyObject.
   * @returns {Boolean} isWithinTolerance - Returns whether point is within tolerance bounds.
   */

  calculateTolForAnalogOrDiscrete(sPrefix, point, instr) {
    const locale = this.getLocale();

    let isWithinTolerance = true;
    let toleranceRoundOption = this.getRoundOption("toltruncate");
    let assetRoundOption = this.getRoundOption("assettruncate");

    this.calstatus = this.getDomainCalStatusDS();

    let minOutputPrecision = instr["outputprecision"];
    if (point.plantype === "DISCRETE") {
      minOutputPrecision = instr["inputprecision"];
    } else {
      minOutputPrecision = instr["outputprecision"];
    }
    let actualPrecision = {
      input: decimalPlacesOf(
        sPrefix === "" ? point["inputvalue"] : point[sPrefix + "input"]
      ),
      output: decimalPlacesOf(
        sPrefix === "" ? point["outputvalue"] : point[sPrefix + "output"]
      ),
    };

    let instrRange = {
      instrcalrangefrom: fromDisplayableValue(
        instr["instrcalrangefrom"],
        locale
      ),
      instrcalrangeto: fromDisplayableValue(instr["instrcalrangeto"], locale),
      instroutrangefrom: fromDisplayableValue(
        instr["instroutrangefrom"],
        locale
      ),
      instroutrangeto: fromDisplayableValue(instr["instroutrangeto"], locale),
    };

    let attrs = this.getDirection(instrRange);
    let isOpposite = attrs.opposite;

    let inputValue = 0;
    if (point.plantype === "DISCRETE") {
      inputValue = point["setpointvalue"];
    } else {
      inputValue = point[sPrefix + "input"];
    }

    let outputValue = 0;
    if (point.plantype === "DISCRETE") {
      outputValue = point[sPrefix + "setpoint"];
    } else {
      outputValue = point[sPrefix + "output"];
    }

    let rightPrecision = this.getPointTolPrecision(
      point,
      instr,
      sPrefix,
      actualPrecision
    );

    if (rightPrecision > 10) {
      rightPrecision = 10;
    }

    // Calculate tolerances
    if (instr["squareroot"]) {
      this.calculateToleranceRangeSquareRoot(sPrefix, point, instr);
    } else if (instr["squared"]) {
      this.calculateToleranceRangeSquared(sPrefix, point, instr);
    } else {
      this.calculateTolerances(sPrefix, point, instr, attrs, {
        places: rightPrecision,
        round: toleranceRoundOption,
      });
    }

    // Get the right precision for Asset.
    //rightPrecision = this.getAssetPrecision(minOutputPrecision, actualPrecision);

    // We can't calculate asset and process error if the input span is zero
    //Discrete asset error should be calculated irrespective.
    if (attrs["instrInputSpan"] === 0 && point.plantype !== "DISCRETE") {
      return false;
    }

    // Calculate Asset Error
    let assetError = this.calculateAssetError(
      sPrefix,
      point,
      instr,
      inputValue,
      outputValue,
      attrs,
      isOpposite,
      actualPrecision,
      { places: minOutputPrecision, round: assetRoundOption }
    );

    // Process Asset Error
    this.calculateProcessAssetError(
      sPrefix,
      point,
      instr,
      inputValue,
      outputValue,
      attrs,
      isOpposite,
      assetError,
      actualPrecision,
      { places: minOutputPrecision, round: assetRoundOption }
    );

    //Do not calculate tolerance error and status if  only input was filled and is not nonlinear
    if (
      !point[sPrefix + "output"] &&
      point[sPrefix + "input"] &&
      !instr.nonlinear
    ) {
      return;
    }

    // Calculate tolerance errors
    isWithinTolerance = this.calculateToleranceErrors(
      sPrefix,
      point,
      instr,
      outputValue,
      { places: rightPrecision, round: toleranceRoundOption }
    );

    // if record is changed, clear asfound/asleft pass/fail (these are only set by function check validation)
    if (point.isChanged) {
      point[sPrefix + "fail"] = false;
      point[sPrefix + "pass"] = false;
    }

    return isWithinTolerance;
  }

  /**
   * Calculates the tolerance range for instruments that are square rooted and updates the lower and upper tolerance ranges for the point.
   * @param {String} sPrefix
   * @param {ProxyObject} point
   * @param {ProxyObject} instr
   * @returns {any}
   */
  calculateToleranceRangeSquareRoot(sPrefix, point, instr) {
    /** @var {String} User locale. */
    const locale = this.getLocale();

    let desiredOutputVal = 0.0;

    let instrRange = {
      instrcalrangefrom: fromDisplayableValue(
        instr["instrcalrangefrom"],
        locale
      ),
      instrcalrangeto: fromDisplayableValue(instr["instrcalrangeto"], locale),
      instroutrangefrom: fromDisplayableValue(
        instr["instroutrangefrom"],
        locale
      ),
      instroutrangeto: fromDisplayableValue(instr["instroutrangeto"], locale),
    };

    let i = 0.0;
    let iLower = instrRange.instrcalrangefrom;
    let iUpper = instrRange.instrcalrangeto;
    let inputSpan = iUpper - iLower;
    let oLower = instrRange.instroutrangefrom;
    let oUpper = instrRange.instroutrangeto;
    let outputSpan = oUpper - oLower;

    let shouldRound = this.getRoundOption("TOLTRUNCATE");

    let actualPrecision = {
      input: decimalPlacesOf(
        sPrefix === "" ? point["inputvalue"] : point[sPrefix + "input"]
      ),
      output: decimalPlacesOf(
        sPrefix === "" ? point["outputvalue"] : point[sPrefix + "output"]
      ),
    };
    let rightPrecision = this.getPointTolPrecision(
      point,
      instr,
      sPrefix,
      actualPrecision
    );
    let options = { places: rightPrecision, round: shouldRound };

    for (let tol = 1; tol < 5; tol++) {
      let toltype = instr["tol" + tol + "type"];
      if (!toltype) toltype = null;

      let tolLower = 0.0;
      let tolUpper = 0.0;
      tolLower = instr["tol" + tol + "lowervalue"]
        ? fromDisplayableValue(instr["tol" + tol + "lowervalue"], locale)
        : tolLower;
      tolUpper = instr["tol" + tol + "uppervalue"]
        ? fromDisplayableValue(instr["tol" + tol + "uppervalue"], locale)
        : tolUpper;

      //Set the desire output vlue
      if (sPrefix && sPrefix !== "") {
        let asinputvalue = point[sPrefix + "input"];
        desiredOutputVal = this.calculateDesiredOutput(
          asinputvalue.toString(),
          point,
          instr
        );
        i = parseFloat(point[sPrefix + "input"]);
      } else {
        //Watchout for issue. Possibly using the rounded displayeble version of output value.
        //Instead of full calculated precision which should ideally be the case.
        desiredOutputVal = parseFloat(point["outputvalue"]);
        i = parseFloat(point["inputvalue"]);
      }

      let sqrtFrom = 0.0;
      let sqrtTo = 0.0;

      let calcSummedRDG = false;
      let calcSummedEU = false;
      let calcSummedSpan = false;
      let calcSummedURV = false;

      let toleranceLower = "";
      let toleranceUpper = "";

      //EU
      let sumEU = instr["tol" + tol + "sumeu"];
      if (!sumEU || sumEU === null || sumEU === "") {
        sumEU = "";
      } else {
        calcSummedEU = true;
      }

      //%READING
      let sumRead = instr["tol" + tol + "sumread"];
      if (!sumRead || sumRead === null || sumRead === "") {
        sumRead = "";
      } else {
        calcSummedRDG = true;
      }

      //%SPAN
      let sumSpan = instr["tol" + tol + "sumspan"];
      if (!sumSpan || sumSpan === null || sumSpan === "") {
        sumSpan = "";
      } else {
        calcSummedSpan = true;
      }

      //%URV
      let sumURV = instr["tol" + tol + "sumurv"];
      if (!sumURV || sumSpan === null || sumSpan === "") {
        sumURV = "";
      } else {
        calcSummedURV = true;
      }

      let gbFrom = 0;
      let gbTo = 0;
      gbFrom = this.addGuardBand(instr, 0.0, tol, "from", true, 0.0);
      gbTo = this.addGuardBand(instr, 0.0, tol, "to", true, 0.0);
      let can_process = true;
      //If not summed tolerance
      if (
        !calcSummedEU &&
        !calcSummedRDG &&
        !calcSummedSpan &&
        !calcSummedURV
      ) {
        if (toltype != null) {
          if (
            (toltype === "EU" || sumEU !== "") &&
            instr.plantype === "ANALOG"
          ) {
            sqrtFrom = this.sqrtToleranceEU(
              i,
              iUpper,
              outputSpan,
              oLower,
              tolLower,
              gbFrom
            );
            sqrtTo = this.sqrtToleranceEU(
              i,
              iUpper,
              outputSpan,
              oLower,
              tolUpper,
              gbTo
            );
          } else if (
            (toltype === "%SPAN" || sumSpan !== "") &&
            instr.plantype === "ANALOG"
          ) {
            sqrtFrom = this.sqrtTolerancePercentSpan(
              i,
              iUpper,
              inputSpan,
              outputSpan,
              oLower,
              tolLower,
              gbFrom
            );
            sqrtTo = this.sqrtTolerancePercentSpan(
              i,
              iUpper,
              inputSpan,
              outputSpan,
              oLower,
              tolUpper,
              gbTo
            );
          } else if (
            (toltype === "%URV" || sumURV !== "") &&
            instr.plantype === "ANALOG"
          ) {
            sqrtFrom = this.sqrtTolerancePercentURV(
              i,
              iUpper,
              outputSpan,
              oLower,
              tolLower,
              gbFrom
            );
            sqrtTo = this.sqrtTolerancePercentURV(
              i,
              iUpper,
              outputSpan,
              oLower,
              tolUpper,
              gbTo
            );
          } else if (
            (toltype === "%READING" || sumRead !== "") &&
            instr.plantype === "ANALOG"
          ) {
            sqrtFrom = this.sqrtTolerancePercentReading(
              i,
              iUpper,
              outputSpan,
              oLower,
              tolLower,
              gbFrom
            );
            sqrtTo = this.sqrtTolerancePercentReading(
              i,
              iUpper,
              outputSpan,
              oLower,
              tolUpper,
              gbTo
            );
          }
        } else {
          can_process = false;
        }
      } else {
        let summedTpDirectionBoth = false;
        let summedToDirectionPlus = false;
        let summedToDirectionMINUS = false;

        let sumTolEU = parseFloat(sumEU === "" ? 0.0 : sumEU);
        let sumTolSpan = parseFloat(sumSpan === "" ? 0.0 : sumSpan);
        let sumTolRead = parseFloat(sumRead === "" ? 0.0 : sumRead);
        let sumTolURV = parseFloat(sumURV === "" ? 0.0 : sumURV);

        let sumDirection = instr["tol" + tol + "sumdirection"];

        if (sumDirection === "+") summedToDirectionPlus = true;
        else if (sumDirection === "-") summedToDirectionMINUS = true;
        else if (sumDirection === "+/-") summedTpDirectionBoth = true;

        //Check to see if the input + tolearnce is negative when the tol is summed
        let sumSummedTol = sumTolEU + sumTolSpan + sumTolRead + sumTolURV;
        sumSummedTol = Math.sqrt(sumSummedTol);

        if (summedToDirectionMINUS || summedTpDirectionBoth) {
          sqrtFrom = this.sqrtToleranceSummed(
            i,
            iUpper,
            inputSpan,
            outputSpan,
            oLower,
            parseFloat(-1 * sumTolEU),
            parseFloat(-1 * sumTolSpan),
            parseFloat(-1 * sumTolURV),
            parseFloat(-1 * sumTolRead),
            parseFloat(-1 * gbFrom)
          );
        } else {
          sqrtFrom = desiredOutputVal;
        }

        if (summedToDirectionPlus || summedTpDirectionBoth)
          sqrtTo = this.sqrtToleranceSummed(
            i,
            iUpper,
            inputSpan,
            outputSpan,
            oLower,
            sumTolEU,
            sumTolSpan,
            sumTolURV,
            sumTolRead,
            gbTo
          );
        else sqrtTo = desiredOutputVal;
      }
      if (can_process) {
        toleranceLower = toDisplayableValue(sqrtFrom, options, locale);
        toleranceUpper = toDisplayableValue(sqrtTo, options, locale);

        if (instr.cliplimits) {
          let dtoleranceLower = Math.min(
            Math.max(toleranceLower, oLower),
            oUpper
          );
          let dtoleranceUpper = Math.max(
            Math.min(toleranceUpper, oUpper),
            oLower
          );

          toleranceLower = toDisplayableValue(dtoleranceLower, options, locale);
          toleranceUpper = toDisplayableValue(dtoleranceUpper, options, locale);
        }
        if (
          !isEmpty(toleranceLower) &&
          !isEmpty(toleranceUpper) &&
          !isNaN(toleranceLower) &&
          !isNaN(toleranceUpper)
        ) {
          point[sPrefix + "tol" + tol + "lower"] = toleranceLower;
          point[sPrefix + "tol" + tol + "upper"] = toleranceUpper;
        } else {
          point[sPrefix + "tol" + tol + "lower"] = null;
          point[sPrefix + "tol" + tol + "upper"] = null;
        }
      }
    }
  }
  /**
   * Calculates the tolerance range for instruments that are squared and updates the lower and upper tolerance ranges for the point.
   * @param {String} sPrefix
   * @param {ProxyObject} point
   * @param {ProxyObject} instr
   * @returns {any}
   */

  calculateToleranceRangeSquared(sPrefix, point, instr) {
    const locale = this.getLocale();

    let desiredOutputVal = 0.0;

    let instrRange = {
      instrcalrangefrom: fromDisplayableValue(
        instr["instrcalrangefrom"],
        locale
      ),
      instrcalrangeto: fromDisplayableValue(instr["instrcalrangeto"], locale),
      instroutrangefrom: fromDisplayableValue(
        instr["instroutrangefrom"],
        locale
      ),
      instroutrangeto: fromDisplayableValue(instr["instroutrangeto"], locale),
    };

    let i = 0.0;
    let asinputvalue = null;
    let iLower = instrRange.instrcalrangefrom;
    let iUpper = instrRange.instrcalrangeto;
    let inputSpan = iUpper - iLower;
    let oLower = instrRange.instroutrangefrom;
    let oUpper = instrRange.instroutrangeto;
    let outputSpan = oUpper - oLower;

    let shouldRound = this.getRoundOption("TOLTRUNCATE");

    let actualPrecision = {
      input: decimalPlacesOf(
        sPrefix === "" ? point["inputvalue"] : point[sPrefix + "input"]
      ),
      output: decimalPlacesOf(
        sPrefix === "" ? point["outputvalue"] : point[sPrefix + "output"]
      ),
    };
    let rightPrecision = this.getPointTolPrecision(
      point,
      instr,
      sPrefix,
      actualPrecision
    );
    let options = { places: rightPrecision, round: shouldRound };

    for (let tol = 1; tol < 5; tol++) {
      let toltype = instr["tol" + tol + "type"];
      if (!toltype) toltype = null;

      let tolLower = 0.0;
      let tolUpper = 0.0;
      tolLower = instr["tol" + tol + "lowervalue"]
        ? fromDisplayableValue(instr["tol" + tol + "lowervalue"], locale)
        : tolLower;
      tolUpper = instr["tol" + tol + "uppervalue"]
        ? fromDisplayableValue(instr["tol" + tol + "uppervalue"], locale)
        : tolUpper;

      //Set the desire output vlue
      if (sPrefix && sPrefix !== "") {
        asinputvalue = point[sPrefix + "input"];
        desiredOutputVal = this.calculateDesiredOutput(
          asinputvalue.toString(),
          point,
          instr
        );
        i = parseFloat(point[sPrefix + "input"]);
      } else {
        //Watchout for issue. Possibly using the rounded displayeble version of output value.
        //Instead of full calculated precision which should ideally be the case.
        desiredOutputVal = parseFloat(point["outputvalue"]);
        i = parseFloat(point["inputvalue"]);
      }

      let sqrtFrom = 0.0;
      let sqrtTo = 0.0;

      let calcSummedRDG = false;
      let calcSummedEU = false;
      let calcSummedSpan = false;
      let calcSummedURV = false;

      let toleranceLower = "";
      let toleranceUpper = "";

      //EU
      let sumEU = instr["tol" + tol + "sumeu"];
      if (!sumEU || sumEU === null || sumEU === "") {
        sumEU = "";
      } else {
        calcSummedEU = true;
      }

      //%READING
      let sumRead = instr["tol" + tol + "sumread"];
      if (!sumRead || sumRead === null || sumRead === "") {
        sumRead = "";
      } else {
        calcSummedRDG = true;
      }

      //%SPAN
      let sumSpan = instr["tol" + tol + "sumspan"];
      if (!sumSpan || sumSpan === null || sumSpan === "") {
        sumSpan = "";
      } else {
        calcSummedSpan = true;
      }

      //%URV
      let sumURV = instr["tol" + tol + "sumurv"];
      if (!sumURV || sumSpan === null || sumSpan === "") {
        sumURV = "";
      } else {
        calcSummedURV = true;
      }

      let exp = 2.0;

      let gbFrom = 0;
      let gbTo = 0;
      gbFrom = this.addGuardBand(instr, 0.0, tol, "from", true, 0.0);
      gbTo = this.addGuardBand(instr, 0.0, tol, "to", true, 0.0);
      let can_process = true;
      if (
        !calcSummedEU &&
        !calcSummedRDG &&
        !calcSummedSpan &&
        !calcSummedURV
      ) {
        if (toltype != null) {
          if (
            (toltype === "EU" || sumEU !== "") &&
            instr.plantype === "ANALOG"
          ) {
            sqrtFrom =
              Math.pow((i - iLower + tolLower + gbFrom) / inputSpan, exp) *
                outputSpan +
              oLower;
            sqrtTo =
              Math.pow((i - iLower + tolUpper + gbTo) / inputSpan, exp) *
                outputSpan +
              oLower;
          } else if (
            (toltype === "%SPAN" || sumSpan !== "") &&
            instr.plantype === "ANALOG"
          ) {
            sqrtFrom =
              Math.pow(
                (i - iLower + tolLower * (inputSpan / 100) + gbFrom) /
                  inputSpan,
                exp
              ) *
                outputSpan +
              oLower;
            sqrtTo =
              Math.pow(
                (i - iLower + tolUpper * (inputSpan / 100) + gbTo) / inputSpan,
                exp
              ) *
                outputSpan +
              oLower;
          } else if (
            (toltype === "%URV" || sumURV !== "") &&
            instr.plantype === "ANALOG"
          ) {
            sqrtFrom =
              Math.pow(
                (i - iLower + tolLower * (Math.abs(iUpper) / 100) + gbFrom) /
                  inputSpan,
                exp
              ) *
                outputSpan +
              oLower;
            sqrtTo =
              Math.pow(
                (i - iLower + tolUpper * (Math.abs(iUpper) / 100) + gbTo) /
                  inputSpan,
                exp
              ) *
                outputSpan +
              oLower;
          } else if (
            (toltype === "%READING" || sumRead !== "") &&
            instr.plantype === "ANALOG"
          ) {
            sqrtFrom =
              Math.pow(
                (i - iLower + tolLower * (Math.abs(i) / 100) + gbFrom) /
                  inputSpan,
                exp
              ) *
                outputSpan +
              oLower;
            sqrtTo =
              Math.pow(
                (i - iLower + tolUpper * (Math.abs(i) / 100) + gbTo) /
                  inputSpan,
                exp
              ) *
                outputSpan +
              oLower;
          }
        } else {
          can_process = false;
        }
      } else {
        let summedTpDirectionBoth = false;
        let summedToDirectionPlus = false;
        let summedToDirectionMINUS = false;

        let sumTolEU = parseFloat(sumEU === "" ? 0.0 : sumEU);
        let sumTolSpan = parseFloat(sumSpan === "" ? 0.0 : sumSpan);
        let sumTolRead = parseFloat(sumRead === "" ? 0.0 : sumRead);
        let sumTolURV = parseFloat(sumURV === "" ? 0.0 : sumURV);

        let sumDirection = instr["tol" + tol + "sumdirection"];

        if (sumDirection === "+") summedToDirectionPlus = true;
        else if (sumDirection === "-") summedToDirectionMINUS = true;
        else if (sumDirection === "+/-") summedTpDirectionBoth = true;

        if (summedToDirectionMINUS || summedTpDirectionBoth) {
          sqrtFrom =
            Math.pow(
              (i -
                iLower -
                sumTolEU -
                sumTolSpan * (inputSpan / 100) -
                sumTolURV * (Math.abs(iUpper) / 100) -
                sumTolRead * (Math.abs(i) / 100) +
                gbFrom) /
                inputSpan,
              exp
            ) *
              outputSpan +
            oLower;
        } else {
          sqrtFrom = desiredOutputVal;
        }

        if (summedToDirectionPlus || summedTpDirectionBoth) {
          sqrtTo =
            Math.pow(
              (i -
                iLower +
                sumTolEU +
                sumTolSpan * (inputSpan / 100) +
                sumTolURV * (Math.abs(iUpper) / 100) +
                sumTolRead * (Math.abs(i) / 100) +
                gbTo) /
                inputSpan,
              exp
            ) *
              outputSpan +
            oLower;
        } else {
          sqrtTo = desiredOutputVal;
        }
      }

      if (can_process) {
        toleranceLower = toDisplayableValue(sqrtFrom, options, locale);
        toleranceUpper = toDisplayableValue(sqrtTo, options, locale);

        if (instr.cliplimits) {
          let dtoleranceLower = Math.min(
            Math.max(toleranceLower, oLower),
            oUpper
          );
          let dtoleranceUpper = Math.max(
            Math.min(toleranceUpper, oUpper),
            oLower
          );

          toleranceLower = toDisplayableValue(dtoleranceLower, options, locale);
          toleranceUpper = toDisplayableValue(dtoleranceUpper, options, locale);
        }
        if (
          !isEmpty(toleranceLower) &&
          !isEmpty(toleranceUpper) &&
          !isNaN(toleranceLower) &&
          !isNaN(toleranceUpper)
        ) {
          point[sPrefix + "tol" + tol + "lower"] = toleranceLower;
          point[sPrefix + "tol" + tol + "upper"] = toleranceUpper;
        } else {
          point[sPrefix + "tol" + tol + "lower"] = null;
          point[sPrefix + "tol" + tol + "upper"] = null;
        }
      }
    }
  }

  /**
   * Calculates tolerances for the given point, updates tolerances within the point and returns true on successful update.
   * @param {String} sPrefix
   * @param {ProxyObject} point
   * @param {ProxyObject} instr
   * @param {ProxyObject} instrRange
   * @param {ProxyObject} attrs
   * @param {Array} actualPrecision
   * @param {Array} options
   * @returns {any}
   */
  calculateTolerances(sPrefix, point, instr, attrs, options) {
    const locale = this.getLocale();

    // Check to see if tolerance is on output range
    let isOutputRangeLimit = instr["outputrange"];

    // input span by output span
    let ISpanByOSpan =
      (attrs["outputTo"] - attrs["outputFrom"]) /
      (attrs["inputTo"] - attrs["inputFrom"]);
    let desiredOutputValue = 0;
    let setPointValue = 0;
    // Loop through tolerance levels
    for (let tol = 1; tol < 5; tol++) {
      let tollowervalue = fromDisplayableValue(
        instr["tol" + tol + "lowervalue"],
        locale
      );
      let toluppervalue = fromDisplayableValue(
        instr["tol" + tol + "uppervalue"],
        locale
      );

      let toleranceLower = null;
      let toleranceUpper = null;
      // TOLTYPE
      let toltype = instr["tol" + tol + "type"];
      let tolPrefixes = [];
      if (instr["nonlinear"]) {
        tolPrefixes = ["asfound", "asleft"];
      } else {
        tolPrefixes = [sPrefix];
      }

      if (this.hasSummedCalculations(instr, tol)) {
        let summedTol = this.calculateSummedTolerance(
          sPrefix,
          instr,
          point,
          tol,
          isOutputRangeLimit,
          attrs,
          ISpanByOSpan
        );
        toleranceLower = summedTol["toleranceLower"];
        toleranceUpper = summedTol["toleranceUpper"];
        if (toltype === null) toltype = "SUM";
      } else if (toltype === "EU") {
        // Engineering Units
        if (!instr["nonlinear"] && sPrefix) {
          let asinputvalue = fromDisplayableValue(
            point[sPrefix + "input"],
            locale
          );
          desiredOutputValue = this.calculateDesiredOutput(
            asinputvalue,
            point,
            instr
          );
        } else {
          desiredOutputValue = fromDisplayableValue(
            point["outputvalue"],
            locale
          );
        }

        if (point.plantype === "DISCRETE") {
          // discrete eu equation use set point value instead of desired output value
          setPointValue = fromDisplayableValue(point["setpointvalue"], locale);
          toleranceLower = setPointValue + tollowervalue;
          toleranceUpper = setPointValue + toluppervalue;
        } else {
          if (isOutputRangeLimit) {
            // tolerance on output
            toleranceLower = desiredOutputValue + tollowervalue;
            toleranceUpper = desiredOutputValue + toluppervalue;
          } else {
            // tolerance on input
            // Lower tolerance range value
            toleranceLower = desiredOutputValue + tollowervalue * ISpanByOSpan;
            // Upper tolerance range value
            toleranceUpper = desiredOutputValue + toluppervalue * ISpanByOSpan;
          }
        }
      } else {
        // %SPAN, %URV and %READING
        let inputAttrName = "";
        if (point.plantype === "ANALOG") {
          inputAttrName = sPrefix ? sPrefix + "input" : "inputvalue";
        }
        if (point.plantype === "DISCRETE") {
          inputAttrName = sPrefix ? sPrefix + "setpoint" : "setpointvalue";
        }
        let inputValue = fromDisplayableValue(point[inputAttrName], locale);
        let outputvalue = fromDisplayableValue(point["outputvalue"], locale);
        desiredOutputValue = sPrefix
          ? this.calculateDesiredOutput(inputValue, point, instr)
          : outputvalue;
        desiredOutputValue = instr["nonlinear"]
          ? outputvalue
          : desiredOutputValue;
        let factor = null;
        if (toltype === "%READING") {
          factor = this.calculateREADINGfactor(
            sPrefix,
            point,
            desiredOutputValue,
            isOutputRangeLimit,
            point.plantype
          );
        } else if (toltype === "%SPAN") {
          factor = this.calculateSPANfactor(attrs, isOutputRangeLimit);
        } else if (toltype === "%URV") {
          factor = this.calculateURVfactor(attrs, isOutputRangeLimit);
        }
        if (toltype && point.plantype === "ANALOG") {
          if (!isOutputRangeLimit) {
            toleranceLower =
              desiredOutputValue +
              tollowervalue * ((factor / 100) * ISpanByOSpan);
            toleranceUpper =
              desiredOutputValue +
              toluppervalue * ((factor / 100) * ISpanByOSpan);
          } else {
            toleranceLower =
              desiredOutputValue + tollowervalue * (factor / 100);
            toleranceUpper =
              desiredOutputValue + toluppervalue * (factor / 100);
          }
        } else if (toltype && point.plantype === "DISCRETE") {
          let setpoint = fromDisplayableValue(point["setpointvalue"], locale);
          if (!isOutputRangeLimit) {
            toleranceLower = setpoint + tollowervalue * factor;
            toleranceUpper = setpoint + toluppervalue * factor;
          } else {
            toleranceLower = (setpoint + tollowervalue) * factor;
            toleranceUpper = (setpoint + toluppervalue) * factor;
          }
        }
      }

      if (toltype && instr["cliplimits"]) {
        toleranceLower = Math.min(
          Math.max(toleranceLower, attrs["outputFrom"]),
          attrs["outputTo"]
        );
        toleranceUpper = Math.max(
          Math.min(toleranceUpper, attrs["outputTo"]),
          attrs["outputFrom"]
        );
      }

      //Set the tolerance values
      for (let i = 0; i < tolPrefixes.length; ++i) {
        if (
          !isEmpty(toleranceLower) &&
          !isEmpty(toleranceUpper) &&
          !isNaN(toleranceLower) &&
          !isNaN(toleranceUpper)
        ) {
          point[tolPrefixes[i] + "tol" + tol + "lower"] = toDisplayableValue(
            toleranceLower,
            options,
            locale
          );
          point[tolPrefixes[i] + "tol" + tol + "upper"] = toDisplayableValue(
            toleranceUpper,
            options,
            locale
          );
        } else {
          point[tolPrefixes[i] + "tol" + tol + "lower"] = null;
          point[tolPrefixes[i] + "tol" + tol + "upper"] = null;
        }
      }
    }

    return true;
  }

  calculateREADINGfactor(prefix, point, desiredOutput, isTolOutput, plantype) {
    const locale = this.getLocale();

    if (plantype === "ANALOG") {
      let attrName = prefix ? prefix + "input" : "inputvalue";
      if (!isTolOutput) {
        return Math.abs(fromDisplayableValue(point[attrName], locale));
      } else {
        if (prefix) {
          return desiredOutput;
        } else {
          return Math.abs(fromDisplayableValue(point["outputvalue"], locale));
        }
      }
    } else if (plantype === "DISCRETE") {
      let attrName = prefix ? prefix + "setpoint" : "setpointvalue";
      let factor = fromDisplayableValue(point[attrName], locale);
      return Math.abs(factor) / 100;
    }
  }

  calculateSPANfactor(attrs, isTolOutput) {
    if (!isTolOutput) {
      return attrs["inputTo"] - attrs["inputFrom"];
    } else {
      return attrs["outputTo"] - attrs["outputFrom"];
    }
  }

  calculateURVfactor(attrs, isTolOutput) {
    if (!isTolOutput) {
      return Math.abs(attrs["inputTo"]);
    } else {
      return Math.abs(attrs["outputTo"]);
    }
  }

  /**
   * roundingLastDigitOfError
   *
   * @param {number} errValue - The error value to round
   * @param {number} nplaces - The number of places to round to
   * @returns {number} The rounded error value
   *
   * This function rounds the last digit of an error value to the nearest integer. It takes two arguments: the error value and the number of places to round to. It returns the rounded error value.
   */
  //istanbul ignore next
  roundingLastDigitOfError(errValue, nplaces) {
    const splitArr = errValue.toString().split(".");
    const fraction = splitArr[1];
    const fullNumber = splitArr[0];

    let result = errValue;
    //put isNotEmpty function here instead of plain if condition
    if (
      !isEmpty(fraction) &&
      !isNaN(fraction) &&
      !isEmpty(nplaces) &&
      !isNaN(nplaces) &&
      fraction.length > nplaces
    ) {
      const numArr = fraction.toString().split("");
      const lastDigit = numArr[nplaces - 1];
      const nextDigitToLastDigit = numArr[nplaces];
      if (parseInt(lastDigit) === 0 && parseInt(nextDigitToLastDigit) > 5) {
        numArr[nplaces - 1] = 1;
        result = `${fullNumber}.${numArr.join("")}`;
      }
    }
    return result;
  }

  /**
   * Defines the right precision to be used for asset and process errors. Formula Rounding or Truncation
   * @param {Number} minOutputPrecision
   * @param {Array} actualPrecision
   * @returns {Number}
   */
  getAssetPrecision(minOutputPrecision, actualPrecision) {
    const dsconfigItem = this.getDsConfigItem();
    let rightPrecision = 0;
    switch (dsconfigItem?.asseterror) {
      case 1:
        rightPrecision = minOutputPrecision + dsconfigItem?.assetnplaces;
        break;
      case 2:
        rightPrecision =
          actualPrecision.input > actualPrecision.output
            ? actualPrecision.input
            : actualPrecision.output;
        break;
      default:
        rightPrecision = minOutputPrecision;
        break;
    }
    return rightPrecision;
  }

  /**
   * Creates and returns attribute array based on input and output direction.
   * @param {Array} instrRange
   * @returns {Array}
   */
  getDirection(instrRange) {
    let attrs = {};
    if (
      instrRange["instrcalrangefrom"] - instrRange["instrcalrangeto"] < 0 &&
      instrRange["instroutrangefrom"] - instrRange["instroutrangeto"] >= 0
    ) {
      //	1. Opposite Direction Input Increasing and Output Decreasing
      attrs = {
        inputFrom: instrRange["instrcalrangefrom"],
        inputTo: instrRange["instrcalrangeto"],
        outputFrom: instrRange["instroutrangeto"],
        outputTo: instrRange["instroutrangefrom"],
        opposite: true,
      };
    } else if (
      instrRange["instrcalrangefrom"] - instrRange["instrcalrangeto"] > 0 &&
      instrRange["instroutrangefrom"] - instrRange["instroutrangeto"] <= 0
    ) {
      //	2. Opposite Direction Input Decreasing and Output Increasing
      attrs = {
        inputFrom: instrRange["instrcalrangeto"],
        inputTo: instrRange["instrcalrangefrom"],
        outputFrom: instrRange["instroutrangefrom"],
        outputTo: instrRange["instroutrangeto"],
        opposite: true,
      };
    } else if (
      instrRange["instrcalrangefrom"] - instrRange["instrcalrangeto"] > 0 &&
      instrRange["instroutrangefrom"] - instrRange["instroutrangeto"] >= 0
    ) {
      //	3. Same Direction Input Decreasing and Output Decreasing
      attrs = {
        inputFrom: instrRange["instrcalrangeto"],
        inputTo: instrRange["instrcalrangefrom"],
        outputFrom: instrRange["instroutrangeto"],
        outputTo: instrRange["instroutrangefrom"],
        opposite: false,
      };
    } else {
      //  4. Same Direction Input Increasing and Output Increasing
      attrs = {
        inputFrom: instrRange["instrcalrangefrom"],
        inputTo: instrRange["instrcalrangeto"],
        outputFrom: instrRange["instroutrangefrom"],
        outputTo: instrRange["instroutrangeto"],
        opposite: false,
      };
    }
    attrs["instrInputSpan"] = attrs["inputTo"] - attrs["inputFrom"];
    attrs["instrOutputSpan"] = attrs["outputTo"] - attrs["outputFrom"];
    return attrs;
  }

  /**
   * Calculates Process Error and updates error for given point.
   * @param {String} sPrefix
   * @param {ProxyObject} point
   * @param {ProxyObject} instr
   * @param {Number} input
   * @param {Number} output
   * @param {ProxyObject} attrs
   * @param {Boolean} isOpposite
   * @param {Number} error
   * @param {Number} actualPrecision
   * @param {Array} options
   * @returns {any}
   */
  calculateProcessAssetError(
    sPrefix,
    point,
    instr,
    input,
    output,
    attrs,
    isOpposite,
    error,
    actualPrecision,
    options
  ) {
    const locale = this.getLocale();
    const calculator = new DecimalCalculator();
    let inputValue = fromDisplayableValue(input, locale);
    let outputValue = fromDisplayableValue(output, locale);

    options["places"] = this.getAssetPrecision(options.places, actualPrecision);
    if (instr["processeu"] !== null) {
      if (
        instr["nonlinear"] ||
        instr["processeu"] === instr["instroutrangeeu"] ||
        (instr.plantype === CalibrationPointConstants.PLANTYPE.DISCRETE &&
          instr["processeu"] === instr["instrcalrangeeu"])
      ) {
        // Process EU is equal to output EU
        const errorStr = this.minusZeroMakeUp(error);
        point[`${sPrefix}proerror`] = calculator.convertNegativeZero(errorStr);
      } else if (instr["processeu"] === instr["instrcalrangeeu"]) {
        // Process EU is equal to input EU
        let errorResult1 = 0;
        if (isOpposite) {
          errorResult1 =
            (attrs["instrInputSpan"] / attrs["instrOutputSpan"]) *
            (outputValue -
              (attrs["outputTo"] -
                (inputValue - attrs["inputFrom"]) *
                  (attrs["instrOutputSpan"] / attrs["instrInputSpan"])));
        } else {
          errorResult1 =
            (attrs["instrInputSpan"] / attrs["instrOutputSpan"]) *
            (outputValue -
              ((inputValue - attrs["inputFrom"]) *
                (attrs["instrOutputSpan"] / attrs["instrInputSpan"]) +
                attrs["outputFrom"]));
        }
        error = this.minusZeroMakeUp(errorResult1);
        error = toDisplayableValue(error, options, locale);
        //error = toDisplayableValue(errorResult1, 'decimal', options);
        point[`${sPrefix}proerror`] = calculator.convertNegativeZero(error);
      } else if (instr["processeufactor"] !== null) {
        // A Process EU Factor should have been provided
        let factor = fromDisplayableValue(instr["processeufactor"], locale);
        if (factor !== 0) {
          error = this.minusZeroMakeUp(error * factor);
          if (options.round === DatasheetConstants.TRUNCATE_VALUE) {
            error = this.roundingLastDigitOfError(error, options.places);
          }
          error = toDisplayableValue(error, options, locale);
          point[`${sPrefix}proerror`] = calculator.convertNegativeZero(error);
        }
      }
    }
  }
  /**
   * Square Root calculation for general
   * @param {Number} iUpper
   * @param {Number} outputSpan
   * @param {Number} oLower
   * @param {Number} linearTol
   * @returns {Number}
   */
  sqrtToleranceGeneral(iUpper, outputSpan, oLower, linearTol) {
    let sign = linearTol < 0 ? -1 : 1;
    return oLower + sign * Math.sqrt(Math.abs(linearTol) / iUpper) * outputSpan;
  }

  /**
   * Square Root calculation for Summed
   * @param {Number} i
   * @param {Number} iUpper
   * @param {Number} outputSpan
   * @param {Number} oLower
   * @param {Number} tol
   * @param {Number} guardBand
   * @returns {any}
   */

  sqrtToleranceSummed(
    i,
    iUpper,
    inputSpan,
    outputSpan,
    oLower,
    sumTolEU,
    sumTolSpan,
    sumTolURV,
    sumTolReading,
    guardBand
  ) {
    let linearTol =
      i +
      sumTolEU +
      sumTolSpan * (inputSpan / 100) +
      sumTolURV * (Math.abs(iUpper) / 100) +
      sumTolReading * (Math.abs(i) / 100) +
      guardBand;

    return this.sqrtToleranceGeneral(iUpper, outputSpan, oLower, linearTol);
  }

  /**
   * Square Root calculation for Reading
   * @param {Number} i
   * @param {Number} iUpper
   * @param {Number} outputSpan
   * @param {Number} oLower
   * @param {Number} tol
   * @param {Number} guardBand
   * @returns {any}
   */

  sqrtTolerancePercentReading(i, iUpper, outputSpan, oLower, tol, guardBand) {
    let linearTol = i + tol * (Math.abs(i) / 100) + guardBand;
    return this.sqrtToleranceGeneral(iUpper, outputSpan, oLower, linearTol);
  }

  /**
   * Square Root calculation for URV
   * @param {Number} i
   * @param {Number} iUpper
   * @param {Number} outputSpan
   * @param {Number} oLower
   * @param {Number} tol
   * @param {Number} guardBand
   * @returns {any}
   */

  sqrtTolerancePercentURV(i, iUpper, outputSpan, oLower, tol, guardBand) {
    let lineartol = i + tol * (Math.abs(iUpper) / 100) + guardBand;
    return this.sqrtToleranceGeneral(iUpper, outputSpan, oLower, lineartol);
  }

  /**
   * Square Root calculation for %Span
   * @param {Number} i
   * @param {Number} iUpper
   * @param {Number} outputSpan
   * @param {Number} oLower
   * @param {Number} tol
   * @param {Number} guardBand
   * @returns {any}
   */

  sqrtTolerancePercentSpan(
    i,
    iUpper,
    inputSpan,
    outputSpan,
    oLower,
    tol,
    guardBand
  ) {
    let linearTol = i + tol * (inputSpan / 100) + guardBand;
    return this.sqrtToleranceGeneral(iUpper, outputSpan, oLower, linearTol);
  }

  /**
   * Square Root calculation for EU
   * @param {Number} i
   * @param {Number} iUpper
   * @param {Number} outputSpan
   * @param {Number} oLower
   * @param {Number} tol
   * @param {Number} guardBand
   * @returns {any}
   */
  sqrtToleranceEU(i, iUpper, outputSpan, oLower, tol, guardBand) {
    let linearTol = i + tol + guardBand;
    return this.sqrtToleranceGeneral(iUpper, outputSpan, oLower, linearTol);
  }

  /**
   * Calculates and returns tolerance with guard band
   * @param {ProxyObject} instr
   * @param {Number} tolerance
   * @param {Number} tol
   * @param {String} direction, '-' or '+'
   * @param {Boolean} doNotApplySpanRatio
   * @param {Number} spanRatio
   * @returns {Number}
   */
  addGuardBand(
    instr,
    tolerance,
    tol,
    direction,
    doNotApplySpanRatio,
    spanRatio
  ) {
    if (this.hasGuardbandFields(instr, tol)) {
      let gb =
        parseFloat(instr["gb" + direction + tol]) *
        (doNotApplySpanRatio ? 1 : spanRatio);
      let gbSign = instr["gbsumdirection" + tol] === "-" ? -1 : 1;
      let updatedTolerance = parseFloat(tolerance) + gbSign * gb;

      if (isNaN(updatedTolerance)) {
        return null;
      } else {
        return updatedTolerance;
      }
    } else {
      return tolerance;
    }
  }

  /**
   * Checks if instrument has guard band field and returns boolean.
   * @param {ProxyObject} instr
   * @param {ProxyObject} tol
   * @returns {Boolean}
   */
  hasGuardbandFields(instr, tol) {
    let isGBFromFilled = instr["gbfrom" + tol] === null ? false : true;
    let isGBToFilled = instr["gbto" + tol] === null ? false : true;
    let isSumDirFilled = instr["gbsumdirection" + tol] === null ? false : true;

    if (
      (isGBFromFilled && (!isGBToFilled || !isSumDirFilled)) ||
      (isGBToFilled && (!isGBFromFilled || !isSumDirFilled)) ||
      (isSumDirFilled && (!isGBFromFilled || !isGBToFilled)) ||
      (!isGBFromFilled && !isGBToFilled && !isSumDirFilled)
    ) {
      return false;
    }
    return true;
  }

  /**
   * This method calculates the desired output for analog calibration point
   * @param nominalInput: the nominalInput or inputValue given in "String datatype"
   * @param point: pointObject
   * @param instr: asset function object
   * @param isLinear: if the asset function is linear
   * @return  desiredOutputValue
   * */
  calculateDesiredOutput(nominalInput, point, instr) {
    const locale = this.getLocale();

    let instrRange = {
      instrcalrangefrom: fromDisplayableValue(
        instr["instrcalrangefrom"],
        locale
      ),
      instrcalrangeto: fromDisplayableValue(instr["instrcalrangeto"], locale),
      instroutrangefrom: fromDisplayableValue(
        instr["instroutrangefrom"],
        locale
      ),
      instroutrangeto: fromDisplayableValue(instr["instroutrangeto"], locale),
    };

    let dattr = this.getDirection(instrRange);

    //Calculate lets required in the desired output formula
    let asinputvalue = parseFloat(nominalInput);
    let resultSpan1 =
      instrRange["instrcalrangeto"] - instrRange["instrcalrangefrom"];
    let resultSpan2 =
      instrRange["instroutrangeto"] - instrRange["instroutrangefrom"];
    let desiredOutputValue = 0;

    if (instr.squared || instr.squareroot) {
      let negative_state = 1;
      if (String(nominalInput).charAt(0) === "-") {
        negative_state = -1;
      } else if (asinputvalue === 0) negative_state = 0;

      if (negative_state === 0) {
        desiredOutputValue = instrRange["instroutrangefrom"];
      } else if (instr.squared) {
        desiredOutputValue = this.calculateSquaredOutputValue(
          negative_state,
          asinputvalue,
          instrRange
        );
      } else {
        desiredOutputValue = this.calculateSquareRootOutputValue(
          negative_state,
          asinputvalue,
          point,
          instr,
          instrRange
        );
      }
    } else {
      if (dattr.opposite) {
        desiredOutputValue =
          (asinputvalue - instrRange["instrcalrangefrom"]) *
            (resultSpan2 / resultSpan1) +
          instrRange["instroutrangefrom"];
      } else {
        desiredOutputValue =
          instrRange["instroutrangefrom"] -
          (asinputvalue - instrRange["instrcalrangefrom"]) *
            ((instrRange["instroutrangefrom"] - instrRange["instroutrangeto"]) /
              resultSpan1);
      }
    }

    return desiredOutputValue;
  }

  /**
   * Calculates the output value for instruments with Square Root.
   * @param {Number} sign
   * @param {Number} asinputvalue
   * @param {ProxyObject} point
   * @param {ProxyObject} instr
   * @param {Array} instrRange
   * @returns {Number}
   */
  calculateSquareRootOutputValue(sign, asinputvalue, point, instr, instrRange) {
    const locale = this.getLocale();
    const resultSpan2 =
      instrRange["instroutrangeto"] - instrRange["instroutrangefrom"];
    if (sign === -1) {
      return (
        instrRange["instroutrangefrom"] -
        Math.sqrt(asinputvalue / instrRange["instroutrangeto"]) * resultSpan2
      );
    } else {
      let op_val =
        Math.sqrt(asinputvalue / instrRange["instrcalrangeto"]) * resultSpan2 +
        instrRange["instroutrangefrom"];
      //We do this only for non negative square root if calculated from new point creation view.
      //Defect 205016
      /* Istanbul ignore next */
      if (point.newpoint)
        op_val = toDisplayableValue(
          op_val,
          {
            places: instr["outputprecision"],
            round: 0,
          },
          locale
        );

      return op_val;
    }
  }

  /**
   * Calculates the output value for instruments with Square.
   * @param {Number} sign
   * @param {Number} asinputvalue
   * @param {Array} instrRange
   * @returns {Number}
   */
  calculateSquaredOutputValue(sign, asinputvalue, instrRange) {
    let signvalue = null;
    const exp = 2.0;

    const resultSpan1 =
      instrRange["instrcalrangeto"] - instrRange["instrcalrangefrom"];
    const resultSpan2 =
      instrRange["instroutrangeto"] - instrRange["instroutrangefrom"];

    if (sign === -1) {
      signvalue = -1.0;
    } else {
      signvalue = 1.0;
    }

    let outputValue =
      signvalue *
        (Math.pow(
          (asinputvalue - instrRange["instrcalrangefrom"]) / resultSpan1,
          exp
        ) *
          resultSpan2) +
      instrRange["instroutrangefrom"];

    return outputValue;
  }

  /**
   * Description
   * @param {String} prefix
   * @param {ProxyObject} point
   * @param {ProxyObject} instr
   * @param {Number} tol
   * @param {Boolean} isTolOutput
   * @param {ProxyObject} attrs
   * @param {Number} ISpanByOSpan
   * @returns {Number}  

   */
  calculateSummedTolerance(
    prefix,
    instr,
    point,
    tol,
    isTolOutput,
    attrs,
    ISpanByOSpan
  ) {
    const locale = this.getLocale();

    let summedToleranceFrom = null;
    let summedToleranceTo = null;
    let sumCalcTypes = this.getSummedCalcTypes(instr, tol);
    let sumEU = null,
      sumRead = null,
      sumSpan = null,
      sumURV = null;
    for (let n in sumCalcTypes) {
      let sumCalcType = sumCalcTypes[n];
      switch (sumCalcType) {
        case "sumeu":
          sumEU = this.calcSumEU(instr, tol, isTolOutput, ISpanByOSpan);
          break;
        case "sumread":
          sumRead = this.calcSumRead(
            prefix,
            instr,
            point,
            tol,
            isTolOutput,
            attrs,
            ISpanByOSpan
          );
          break;
        case "sumspan":
          sumSpan = this.calcSumSpan(
            instr,
            tol,
            isTolOutput,
            attrs,
            ISpanByOSpan
          );
          break;
        case "sumurv":
          sumURV = this.calcSumURV(
            instr,
            tol,
            isTolOutput,
            attrs,
            ISpanByOSpan
          );
          break;
        /* istanbul ignore next */
        default:
          break;
      }
    }
    const gbFrom = this.addGuardBand(instr, 0.0, tol, "from", true, 0.0);
    const gbTo = this.addGuardBand(instr, 0.0, tol, "to", true, 0.0);
    const inputAttr = prefix ? prefix + "input" : "inputvalue";
    const inputValue = fromDisplayableValue(point[inputAttr], locale);
    const desiredOutputValue = this.calculateDesiredOutput(
      inputValue,
      point,
      instr
    );

    let sumdirection = instr["tol" + tol + "sumdirection"];

    if (sumdirection === "-") {
      summedToleranceFrom =
        desiredOutputValue - sumEU - sumRead - sumSpan - sumURV + gbFrom;
      summedToleranceTo = desiredOutputValue;
    } else if (sumdirection === "+") {
      summedToleranceFrom = desiredOutputValue;
      summedToleranceTo =
        desiredOutputValue + sumEU + sumRead + sumSpan + sumURV + gbTo;
    } else if (sumdirection === "+/-") {
      summedToleranceFrom =
        desiredOutputValue - sumEU - sumRead - sumSpan - sumURV + gbFrom;
      summedToleranceTo =
        desiredOutputValue + sumEU + sumRead + sumSpan + sumURV + gbTo;
    }
    return {
      toleranceLower: summedToleranceFrom,
      toleranceUpper: summedToleranceTo,
    };
  }

  /**
   * Calulcates sum for EU instruments. Returns sum as a number.
   * @param {ProxyObject} instr
   * @param {Number} tol
   * @param {Boolean} isTolOutput
   * @param {ProxyObject} attrs
   * @param {Number} ISpanByOSpan
   * @returns {Number}
   */
  calcSumEU(instr, tol, isTolOutput, ISpanByOSpan) {
    const locale = this.getLocale();

    let tolnsumeu = fromDisplayableValue(instr["tol" + tol + "sumeu"], locale);
    if (isTolOutput) {
      return tolnsumeu;
    } else {
      return tolnsumeu * ISpanByOSpan;
    }
  }
  /**
   * Calulcates sum for Read instruments. Returns sum as a number.
   * @param {ProxyObject} instr
   * @param {Number} tol
   * @param {Boolean}} isTolOutput
   * @param {ProxyObject} attrs
   * @param {Number} ISpanByOSpan
   * @returns {Number}
   */

  calcSumRead(prefix, instr, point, tol, isTolOutput, attrs, ISpanByOSpan) {
    const locale = this.getLocale();

    let tolnsumread = fromDisplayableValue(
      instr["tol" + tol + "sumread"],
      locale
    );
    let inputAttr = prefix ? prefix + "input" : "inputvalue";
    let inputValue = fromDisplayableValue(point[inputAttr], locale);
    let factor = null;
    if (!isTolOutput) {
      factor = inputValue;
      return tolnsumread * ((Math.abs(factor) / 100) * ISpanByOSpan);
    } else {
      if (prefix) {
        factor = this.calculateDesiredOutput(inputValue, point, instr);
      } else {
        factor = fromDisplayableValue(instr["outputvalue"], locale);
      }
      return tolnsumread * (Math.abs(factor) / 100);
    }
  }
  /**
   * Calulcates sum for Span instruments. Returns sum as a number.
   * @param {ProxyObject} instr
   * @param {Number} tol
   * @param {Boolean}} isTolOutput
   * @param {ProxyObject} attrs
   * @param {Number} ISpanByOSpan
   * @returns {Number}
   */
  calcSumSpan(instr, tol, isTolOutput, attrs, ISpanByOSpan) {
    const locale = this.getLocale();

    let tolnsumspan = fromDisplayableValue(
      instr["tol" + tol + "sumspan"],
      locale
    );
    let factor = null;
    if (!isTolOutput) {
      factor = attrs["inputTo"] - attrs["inputFrom"];
      return tolnsumspan * ((factor / 100) * ISpanByOSpan);
    } else {
      factor = attrs["outputTo"] - attrs["outputFrom"];
      return tolnsumspan * (factor / 100);
    }
  }

  /**
   * Calulcates sum for URV instruments. Returns sum as a number.
   * @param {ProxyObject} instr
   * @param {Number} tol
   * @param {Boolean}} isTolOutput
   * @param {ProxyObject} attrs
   * @param {Number} ISpanByOSpan
   * @returns {Number}
   */
  calcSumURV(instr, tol, isTolOutput, attrs, ISpanByOSpan) {
    const locale = this.getLocale();
    const tolnsumurv = fromDisplayableValue(
      instr["tol" + tol + "sumurv"],
      locale
    );
    let factor = null;
    if (!isTolOutput) {
      factor = attrs["inputTo"];
      return tolnsumurv * ((Math.abs(factor) / 100) * ISpanByOSpan);
    } else {
      factor = attrs["outputTo"];
      return tolnsumurv * (Math.abs(factor) / 100);
    }
  }

  /**
   * Returns an array that includes the types of calculations that an instrument has.
   * @param {ProxyObject} instr
   * @param {Number} tol
   * @returns {Array}
   */
  getSummedCalcTypes(instr, tol) {
    const calcTypes = ["sumeu", "sumread", "sumspan", "sumurv"];
    let summedCalcTypes = [];
    for (let n in calcTypes) {
      const calcType = calcTypes[n];
      const sumvalue = instr["tol" + tol + calcType];
      if (sumvalue && sumvalue !== "") {
        summedCalcTypes.push(calcType);
      }
    }
    return summedCalcTypes;
  }

  /**
   * Checks if an instrument has any calculation types and returns a boolean.
   * @param {ProxyObject} instr
   * @param {Number} tol
   * @returns {Boolean}
   */
  hasSummedCalculations(instr, tol) {
    return this.getSummedCalcTypes(instr, tol).length > 0;
  }

  /**
   * Calculate Average and Standard Deviation for points.
   *
   * @param {String} condition - 'asfound' or 'asleft'.
   * @param {ProxyObject} assocpoints - Calpoints filtered by 'isaverage = false' associated to avgpoint.
   * @param {ProxyObject} avgpoint - ModelData average calibration point record, 'isaverage = true'.
   * @param {ProxyObject} instr - instrument
   * @returns {ProxyObject} Returns avgpoint object updated with calculation results.
   */
  calculateAvgAndStdDeviation(condition, assocpoints, avgpoint, instr) {
    const locale = this.getLocale();

    const stdPrefix =
      condition === CalibrationPointConstants.CONDITION_ASFOUND
        ? CalibrationPointConstants.STDDEV_ASFOUND
        : CalibrationPointConstants.STDDEV_ASLEFT;

    const toltruncate = this.getRoundOption("toltruncate");

    if (avgpoint.plantype === CalibrationPointConstants.PLANTYPE.ANALOG) {
      // Calculate precision
      /* prettier-ignore */
      const precision = {
        input: this.calculatePrecisionByAttr(assocpoints, `${condition}input`),
        output: this.calculatePrecisionByAttr(assocpoints, `${condition}output`)
      }

      // Calculate average of input values

      const avginput = this.calculateAverageByAttr(
        assocpoints,
        `${condition}input`
      );

      /**
       * This assignment might affect one of these attributes:
       * @alias calpoint.asfoundinput
       * @alias calpoint.asleftinput
       */
      avgpoint[`${condition}input`] = toDisplayableValue(
        avginput,
        {
          places: precision.input,
          round: toltruncate,
        },
        locale
      );

      // Calculate average of output values

      const avgoutput = this.calculateAverageByAttr(
        assocpoints,
        `${condition}output`
      );

      /**
       * This assignment might affect one of these attributes:
       * @alias calpoint.asfoundoutput
       * @alias calpoint.asleftoutput
       */
      avgpoint[`${condition}output`] = toDisplayableValue(
        avgoutput,
        {
          places: precision.output,
          round: toltruncate,
        },
        locale
      );

      // Calculate standard deviation of input values

      const stddevinput = this.calculateStandardDeviationByAttr(
        assocpoints,
        avginput,
        `${condition}input`
      );

      /**
       * This assignment might affect one of these attributes:
       * @alias calpoint.asfinputstddev
       * @alias calpoint.aslinputstddev
       */
      avgpoint[`${stdPrefix}inputstddev`] = toDisplayableValue(
        stddevinput,
        {
          places: precision.input,
          round: toltruncate,
        },
        locale
      );

      // Calculate standard deviation of output values

      const stddevoutput = this.calculateStandardDeviationByAttr(
        assocpoints,
        avgoutput,
        `${condition}output`
      );

      /**
       * This assignment might affect one of these attributes:
       * @alias calpoint.asfoutputstddev
       * @alias calpoint.asloutputstddev
       */
      avgpoint[`${stdPrefix}outputstddev`] = toDisplayableValue(
        stddevoutput,
        {
          places: precision.output,
          round: toltruncate,
        },
        locale
      );

      if(instr.isstandarddeviation) {

        const rightInputPrecision = this.calculateRightPrecisionForStandardDeviationError(avgpoint, condition, instr, CalibrationPointConstants.FIELD_TYPE.INPUT);

        // Calculate standard deviation error of input values
        const stddevinputerror = instr.standarddeviationinputlimit - avgpoint[`${stdPrefix}inputstddev`];

        /**
         * This assignment might affect one of these attributes:
         * @alias calpoint.asfoundinputstddeverror
         * @alias calpoint.asleftinputstddeverror
         */
        avgpoint[`${condition}inputstddeverror`] = toDisplayableValue(
          stddevinputerror,
          {
            places: rightInputPrecision,
            round: toltruncate,
          },
          locale
        );

        const rightOutputPrecision = this.calculateRightPrecisionForStandardDeviationError(avgpoint, condition, instr, CalibrationPointConstants.FIELD_TYPE.OUTPUT);

        // Calculate standard deviation error of output values

        const stddevoutputerror = instr.standarddeviationoutputlimit - avgpoint[`${stdPrefix}outputstddev`];

        /**
         * This assignment might affect one of these attributes:
         * @alias calpoint.asfoundoutputstddeverror
         * @alias calpoint.asleftoutputstddeverror
         */
        avgpoint[`${condition}outputstddeverror`] = toDisplayableValue(
          stddevoutputerror,
          {
            places: rightOutputPrecision,
            round: toltruncate,
          },
          locale
        );
      }

      // Discrete set point
    } else if (
      avgpoint.plantype === CalibrationPointConstants.PLANTYPE.DISCRETE
    ) {
      // Calculate precision
      /* prettier-ignore */
      const precision = {
        setpoint: this.calculatePrecisionByAttr(assocpoints, `${condition}setpoint`)
      }

      // Calculate setpoint average

      const avgsetpoint = this.calculateAverageByAttr(
        assocpoints,
        `${condition}setpoint`
      );

      /**
       * This assignment might affect one of these attributes:
       * @alias calpoint.asfoundsetpoint
       * @alias calpoint.asleftsetpoint
       */
      avgpoint[`${condition}setpoint`] = toDisplayableValue(
        avgsetpoint,
        {
          places: precision.setpoint,
          round: toltruncate,
        },
        locale
      );

      // Calculate setpoint standard deviation

      const stddevsetpoint = this.calculateStandardDeviationByAttr(
        assocpoints,
        avgsetpoint,
        `${condition}setpoint`
      );

      /**
       * This assignment might affect one of these attributes:
       * @alias calpoint.asfsetptstddev
       * @alias calpoint.aslsetptstddev
       */
      avgpoint[`${stdPrefix}setptstddev`] = toDisplayableValue(
        stddevsetpoint,
        {
          places: precision.setpoint,
          round: toltruncate,
        },
        locale
      );

      if(instr.isstandarddeviation) {

        const rightPrecision = this.calculateRightPrecisionForStandardDeviationError(avgpoint, condition, instr, null);

        // Calculate standard deviation error of output values
        const stddevoutputerror = instr.standarddeviationoutputlimit - avgpoint[`${stdPrefix}setptstddev`];

        /**
         * This assignment might affect one of these attributes:
         * @alias calpoint.asfoundsetpointstddeverror
         * @alias calpoint.asleftsetpointstddeverror
         */
        avgpoint[`${condition}setpointstddeverror`] = toDisplayableValue(
          stddevoutputerror,
          {
            places: rightPrecision,
            round: toltruncate,
          },
          locale
        );
      }
    }

    // istanbul ignore if
    if (log.isDebug()) {
      // prettier-ignore
      log.d(
        LogConstants.TAG_CALIBRATION,
        "avgpoint avg and stddev results:" +
          printTable({
            "id"             : avgpoint.pluscwodspointid,
            "asfinputstddev" : avgpoint.asfinputstddev,
            "aslinputstddev" : avgpoint.aslinputstddev,
            "asfoutputstddev": avgpoint.asfoutputstddev,
            "asloutputstddev": avgpoint.asloutputstddev,
            "asfoundsetpoint": avgpoint.asfoundsetpoint,
            "asleftsetpoint" : avgpoint.asleftsetpoint,
            "asfsetptstddev" : avgpoint.asfsetptstddev,
            "aslsetptstddev" : avgpoint.aslsetptstddev
          })
      );
    }

    return avgpoint;
  }

  /**
   * Determine largest precision number to use as decimal limiter.
   * For example, let's say our calpoints looks like this:
   * ```
   * calpoints = [
   *   { asfoundinput: "1.01" ... },
   *   { asfoundinput: "1.001" ... },
   *   { asfoundinput: "1.0001" ... },
   *   { asfoundinput: "1.001" ... },
   *   { asfoundinput: "1.01" ... },
   * ]
   * ```
   *
   * This function will iterate over the calibration points (calpoints),
   * then calculate the precision - number of fraction digits - of each
   * point and keep the largest one.
   *
   * In the example above, the answer would be 4, because we the value
   * "1.0001" has 4 fraction digits (".0001").
   *
   * @param {Array} calpoints - List of calibration points.
   * @param {String} attributeName - Attribute name to access the value.
   * @returns {Number}
   */
  calculatePrecisionByAttr(calpoints, attributeName) {
    let precision = 0;

    calpoints.forEach((calpoint) => {
      precision = Math.max(precision, decimalPlacesOf(calpoint[attributeName]));
    });

    return precision;
  }

  /**
   * Calculate Average for attribute.
   * @param {ProxyObject} calpoints - ModelDataSet filtered by 'isaverage = false' calibration points (repeatables)
   * @param {String} attributeName
   * @returns {Number}
   */
  calculateAverageByAttr(calpoints, attributeName) {
    const locale = this.getLocale();

    let sum = 0;

    for (let i = 0; i < calpoints.length; i++) {
      const point = calpoints[i];
      const value = point[attributeName];
      sum += fromDisplayableValue(value, locale);
    }

    return sum / calpoints.length;
  }

  /**
   * Returns standard deviation for array of points.
   *
   * @alias calculateStandardDeviationByAttr
   * @see {@link https://github.ibm.com/maximo/Civil-Architecture/blob/master/rfcs/0010-calibration-rules-for-as-found-calculations/src/snippets/0011/0011_StandardDeviationMixin_calculateAvgAndStdDeviation.js}
   *
   * @param {ProxyObject} calpoints - ModelDataSet filtered by 'isaverage = false' calibration points (repeatables).
   * @param {Number} avgValue - average of points.
   * @param {String} attributeName - attribute of the point on which to calculate standard deviation.
   *
   * @returns {Number}
   */
  calculateStandardDeviationByAttr(calpoints, avgValue, attributeName) {
    const locale = this.getLocale();
    const dsconfig = this.getDsConfigItem();

    let n = 1;
    let length = calpoints.length;

    switch (dsconfig?.stddev) {
      case DatasheetConstants.DEVIATION_N:
        n = length;
        break;
      case DatasheetConstants.DEVIATION_N_MINUS_1:
        n = length - 1;
        break;
      default:
        n = length;
    }

    let sumOfSquaredDiffs = 0;

    for (let i = 0; i < length; i++) {
      const calpoint = calpoints[i];
      const value = fromDisplayableValue(calpoint[attributeName], locale);

      sumOfSquaredDiffs += Math.pow(value - avgValue, 2);
    }

    return Math.sqrt(sumOfSquaredDiffs / n);
  }

  /**
   * Calculate precision for standard deviation error
   * @param {String} condition - 'asfound' or 'asleft'.
   * @param {ProxyObject} avgpoint - ModelData average calibration point record, 'isaverage = true'.
   * @param {ProxyObject} instr - instrument
   * @returns {Number} Returns precision points
   */
  calculateRightPrecisionForStandardDeviationError(avgpoint, condition, instr, fieldType) {
    const actualPrecision = this.calculatePrecision(avgpoint, condition);
    let rightPrecision = this.getStandardDeviationErrorPrecision(
      avgpoint,
      instr,
      condition,
      actualPrecision,
      fieldType
    );

    if (rightPrecision > 10) {
      rightPrecision = 10;
    }

    return rightPrecision;
  }

  /**
   * Returns the standard deviation error precision for the field group, denoted
   * by its prefix for the given point.
   * @param {ProxyObject} pointItem - Item reference to datasource "pluscwodspoint" defined in app.xml.
   * @param {ProxyObject} instrItem - Item reference to datasource "pluscwodsinstr" defined in app.xml.
   * @param {String} fieldPrefix - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @param {Object} actualPrecision - Object generated by method `calculatePrecision`.
   * @param {String} fieldType - Field type - input/output
   * @returns
   */
  getStandardDeviationErrorPrecision(pointItem, instrItem, fieldPrefix, actualPrecision, fieldType) {
    if (pointItem.plantype === CalibrationPointConstants.PLANTYPE.ANALOG) {
      return this.getStandardDeviationErrorTolPrecision(
        instrItem.outputprecision,
        actualPrecision.output,
        actualPrecision.input,
        fieldType
      );
    }

    if (pointItem.plantype === CalibrationPointConstants.PLANTYPE.DISCRETE) {
      const num =
        fieldPrefix === ""
          ? pointItem.setpointvalue
          : pointItem[`${fieldPrefix}setpoint`];
      return decimalPlacesOf(num);
    }

    return 0;
  }

  /**
   * Defines the right precision to be used for Standard deviation errors.
   * Formula Rounding or Truncation.
   * @param {Number} minOutputPrecision
   * @param {Number} actualOutputPrecision
   * @param {Number} actualInputPrecision
   * @param {String} fieldType 
   * @returns Number
   */
  getStandardDeviationErrorTolPrecision(
    minOutputPrecision,
    actualOutputPrecision,
    actualInputPrecision,
    fieldType
  ) {
    const dsconfig = this.getDsConfigItem();

    let rightPrecision = 0;

    switch (dsconfig?.tolerror) {
      case DatasheetConstants.TOLERANCE.USE_INSTR_OUTPUT:
        rightPrecision = minOutputPrecision + this.dsconfigItem.tolnplaces;
        break;
      case DatasheetConstants.TOLERANCE.USE_POINT_IO:
        rightPrecision = fieldType === CalibrationPointConstants.FIELD_TYPE.INPUT
            ? actualInputPrecision + 1
            : actualOutputPrecision + 1;
        break;
      default:
        rightPrecision = minOutputPrecision;
        break;
    }

    return rightPrecision;
  }
}

export default DatasheetCalculation;
