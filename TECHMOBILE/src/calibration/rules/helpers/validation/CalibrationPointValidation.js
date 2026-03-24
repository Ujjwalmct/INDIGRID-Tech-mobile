/*
 * Licensed Materials - Property of IBM
 *
 * 5724-U18, 5737-M66
 *
 * (C) Copyright IBM Corp. 2022,2024 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */

/** Constants */
import CalibrationPointConstants from "../../constants/CalibrationPointConstants";

/** Utils */
import getLocalizedLabel from "../../../../utils/getLocalizedLabel";
import Message from "../../../../utils/Message";
import fromDisplayableValue from "../../utils/numberFormatter/fromDisplayableValue";
import isEmpty from "../../utils/numberFormatter/isEmpty";

/** Validation */
import FieldError from "./FieldError";
import OutOfRangeFieldError from "./OutOfRangeFieldError";
import LocaleNumberUtil from '../../../utils/LocaleNumberUtil';

/**
 * Calibration Point Form Validation
 */
class CalibrationPointValidation {
  /**
   * Validate whole calibration points form.
   *
   * @param {ProxyObject} calpoint : Calibration point data as an Array of ProxyObject.
   * @param {String} fieldName : Field name to access we want to access in calpoint.
   * @param {ProxyObject} assetfunction : Current item from assetfunction datasource.
   * @param {String} locale : Locale.
   * @param {Boolean} allowEmpty - Defines if validation process should allow empty values.
   * @returns {Array} Returns Array<FieldError> errors found in form.
   */
  static validateField(calpoint, fieldName, assetfunction, locale, allowEmpty) {
    const errors = [];

    // Calibration point aliases
    const localizedCondition = this.localizeCondition(fieldName);
    const strValue = calpoint[fieldName];

    // Asset function aliases
    const outputExceeded = fieldName.startsWith(
      CalibrationPointConstants.CONDITION_ASFOUND
    )
      ? calpoint.asfounderror
      : calpoint.aslefterror;

    if (allowEmpty && isEmpty(strValue)) {
      return errors;
    }
    
    if (isEmpty(strValue)) {
      errors.push(
        new FieldError(
          CalibrationPointConstants.FIELD_ERROR,
          calpoint,
          fieldName,
          new Message("cannot_be_empty_value", "Cannot be empty value")
        )
      );
    }

    if (this.isTooLong(strValue)) {
      errors.push(
        new FieldError(
          CalibrationPointConstants.FIELD_ERROR,
          calpoint,
          fieldName,
          new Message(
            "entered_number_is_too_long",
            "Entered number is too long"
          )
        )
      );
    }

    if (!LocaleNumberUtil.isValidNumber(strValue, locale)) {
      errors.push(
        new FieldError(
          CalibrationPointConstants.FIELD_ERROR,
          calpoint,
          fieldName,
          new Message("enter_numeric_value", "Enter a numeric value")
        )
      );
    }

    /**
     * This assignment might affect one of these attributes:
     * @access calpoint.asfoundinput
     * @access calpoint.asfoundoutput
     * @access calpoint.asfoundsetpoint
     * @access calpoint.asleftinput
     * @access calpoint.asleftoutput
     * @access calpoint.asleftsetpoint
     */
    const value = fromDisplayableValue(
      strValue,
      locale
    );

    if (
      fieldName.endsWith("input") &&
      this.isInputOutOfRange(value, calpoint, assetfunction)
    ) {
      errors.push(
        // Should generate a message like: "The As Found input 1.125 is outside the range of 0.00 to 1.00."
        new OutOfRangeFieldError(calpoint, fieldName, assetfunction, locale)
      );
    }

    if (fieldName.endsWith("output") && outputExceeded) {
      errors.push(
        new FieldError(
          CalibrationPointConstants.FIELD_WARNING,
          calpoint,
          fieldName,
          new Message(
            "one_or_more_tolerance_limits_have_been_exceeded",
            `One or more ${localizedCondition} tolerance limits have been exceeded on this calibration point. (BMXAR0010)`,
            [localizedCondition]
          )
        )
      );
    }

    return errors;
  }

  /**
   * Validate whole calibration points form.
   *
   * @param {Array} calpoints - Calibration point data as an Array of ProxyObject.
   * @param {String} condition - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @param {ProxyObject} assetfunction - Current item from assetfunction datasource.
   * @param {String} locale : Locale.
   * @param {Boolean} allowEmpty - Defines if validation process should allow empty values.
   * @returns {Array} Returns Array<FieldError> errors found in form.
   */
  static validateForm(calpoints, condition, assetfunction, locale, allowEmpty) {
    let errors = [];

    // Validate input and output fields
    /**
     * This assignment might affect one of these attributes:
     * @access calpoint.asfoundinput
     * @access calpoint.asfoundoutput
     * @access calpoint.asfoundsetpoint
     * @access calpoint.asleftinput
     * @access calpoint.asleftoutput
     * @access calpoint.asleftsetpoint
     */
    const fields =
      assetfunction.plantype === CalibrationPointConstants.PLANTYPE.ANALOG
        ? [`${condition}input`, `${condition}output`]
        : [`${condition}setpoint`];

    calpoints.forEach((calpoint) => {
      fields.forEach((field) => {
        const fieldErrors = this.validateField(
          calpoint,
          field,
          assetfunction,
          locale,
          allowEmpty
        );

        errors = errors.concat(fieldErrors);
      });
    });

    return errors;
  }

  /**
   * Validate whole calibration points form and return only errors (skip warnings).
   *
   * @param {Array} calpoints - Calibration point data as an Array of ProxyObject.
   * @param {String} condition - String prefix to access data in point instance. Can be "asfound" or "asleft".
   * @param {ProxyObject} assetfunction - Current item from assetfunction datasource.
   * @param {String} locale : Locale.
   * @returns {Array} Returns Array<FieldError> errors found in form.
   */
  static validateFormErrorsOnly(
    calpoints,
    condition,
    assetfunction,
    locale,
    allowEmpty
  ) {
    return this.validateForm(
      calpoints,
      condition,
      assetfunction,
      locale,
      allowEmpty
    ).filter(
      (error) => error.getErrorType() === CalibrationPointConstants.FIELD_ERROR
    );
  }

  /**
   * Filter errors only
   * @param {FieldError} error
   * @returns {Boolean} Returns whether error type is error or not.
   */
  static filterErrorsOnly(error) {
    return error.getErrorType() === CalibrationPointConstants.FIELD_ERROR;
  }

  /**
   * Count errors in a list of field errors.
   * @param {Array} errors - Array<FieldError>.
   * @returns {Number}
   */
  static countErrors(errors) {
    return errors.filter(
      (error) => error.getErrorType() === CalibrationPointConstants.FIELD_ERROR
    ).length;
  }

  /**
   * Localize condition to be shown in UI.
   * @param {String} fieldName - Field name.
   * @returns {String} Returns localized condition "As Found" or "As Left"
   */
  static localizeCondition(fieldName) {
    return fieldName.startsWith(CalibrationPointConstants.CONDITION_ASFOUND)
      ? getLocalizedLabel("as_found", "As Found")
      : getLocalizedLabel("as_left", "As Left");
  }

  /* ------------------------------------------------------------------ */
  /*                                                                    */
  /* Validation rules                                                   */
  /*                                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Validates is strValue is a valid number.
   * @param {String} strValue
   * @param {String} locale
   * @returns {Boolean}
   */
  static isNonEmptyNumber(strValue, locale) {
    return (
      !isEmpty(strValue) &&
      LocaleNumberUtil.isValidNumber(strValue, locale)
    );
  }

  /**
   * Verifies whether value exceeds the maximum length size.
   * @param {String} value - Value in string format.
   * @returns {Boolean}
   */
  static isTooLong(value) {
    return (
      String(value).replaceAll(/(\.,|-)/g, "").length >
      CalibrationPointConstants.MAX_VALUE_LENGTH
    );
  }

  /**
   * Check if user input is within the upper and lower bounds of the instrument.
   * If bounds are not defined, ignore validation and return False
   *
   * Original implementation:
   * @see {@link https://github.ibm.com/maximo/anywhere-applications/blob/66255b9a70838e63960c2919a984422a44f5f1e4/MaximoAnywhere/apps/WorkExecution/common/js/application/business/CalibrationPointObject.js#L236-L273}
   *
   * @param {Number} value - Numeric value.
   * @param {ProxyObject} calpoint - Calibration point data.
   * @param {ProxyObject} assetfunction - Asset function data.
   * @returns {Boolean}
   */
  static isInputOutOfRange(value, calpoint, assetfunction) {
    let lowerbound = null;
    let upperbound = null;

    if (assetfunction.cliplimitsin) {
      lowerbound = assetfunction.instrcalrangefrom;
      upperbound = assetfunction.instrcalrangeto;
    } else if (calpoint.ron1lower && calpoint.ron1upper) {
      lowerbound = Math.min(calpoint.ron1lower, calpoint.ron1upper);
      upperbound = Math.max(calpoint.ron1lower, calpoint.ron1upper);
    }

    // Ignore validation if bounds are not defined
    return isEmpty(lowerbound) || isEmpty(upperbound)
      ? false
      : this.isOutOfRange(value, lowerbound, upperbound);
  }

  /**
   * Verifies whether value exceeds the range defined by asset function.
   * @param {Number} value - Numeric value.
   * @param {Number} lowerbound : Asset function property to define the range.
   * @param {Number} upperbound : Asset function property to define the range.
   * @returns {Boolean}
   */
  static isOutOfRange(value, lowerbound, upperbound) {
    return value < lowerbound || value > upperbound;
  }
}

export default CalibrationPointValidation;
