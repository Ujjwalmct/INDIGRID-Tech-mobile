// istanbul ignore file
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
import Message from "../../../../utils/Message";
import getLocalizedLabel from "../../../../utils/getLocalizedLabel";
import toDisplayableValue from "../../utils/numberFormatter/toDisplayableValue";

/** Validation */
import FieldError from "./FieldError";
import DatasheetConstants from "../../constants/DatasheetConstants";

/**
 * OutOfRangeFieldError
 * @typedef {import("../../../../utils").Message} Message
 */
class OutOfRangeFieldError extends FieldError {
  /**
   * Creates out of range field error.
   *
   * @param {ProxyObject} calpoint - Calibration point data.
   * @param {String} fieldName - Field name to access we want to access in calpoint.
   * @param {ProxyObject} assetfunction - Current item from assetfunction datasource.
   * @param {String} locale - Locale.
   */
  constructor(calpoint, fieldName, assetfunction, locale) {
    super(CalibrationPointConstants.FIELD_ERROR, calpoint, fieldName, null);

    // Create Message object
    this.setMessageObject(
      this.createMessage(calpoint, fieldName, assetfunction, locale)
    );
  }

  /**
   * Create message based on asset function properties.
   * @param {ProxyObject} calpoint - Calibration point.
   * @param {String} fieldName - Field name.
   * @param {ProxyObject} assetfunction - Asset function data.
   * @param {String} locale - Locale.
   * @returns {Message} Returns message based on asset function properties.
   */
  createMessage(calpoint, fieldName, assetfunction, locale) {
    // Localize messages
    const condition = this.localizeCondition(fieldName);
    const field = this.localizeField(fieldName);

    // Lower and upper bounds
    let lowerbound = "";
    let upperbound = "";

    // Number format options
    const numberFormatOptions = {
      places: assetfunction.inputprecision,
      round: DatasheetConstants.ROUND_VALUE,
    };

    // If cliplimits in
    if (assetfunction.cliplimitsin) {
      lowerbound = toDisplayableValue(
        assetfunction.instrcalrangefrom,
        numberFormatOptions,
        locale
      );
      upperbound = toDisplayableValue(
        assetfunction.instrcalrangeto,
        numberFormatOptions,
        locale
      );

      // ron1 lower and upper
    } else if (calpoint.ron1lower && calpoint.ron1upper) {
      lowerbound = toDisplayableValue(
        calpoint.ron1lower,
        numberFormatOptions,
        locale
      );
      upperbound = toDisplayableValue(
        calpoint.ron1upper,
        numberFormatOptions,
        locale
      );
    }

    return new Message(
      "number_is_out_of_range",
      `The ${condition} ${field} ${calpoint[fieldName]} is outside the range of ${lowerbound} to ${upperbound}.`,
      [condition, field, calpoint[fieldName], lowerbound, upperbound]
    );
  }

  /**
   * Localize condition to be shown in UI.
   * @param {String} fieldName - Field name.
   * @returns {String} Returns localized condition "As Found" or "As Left"
   */
  localizeCondition(fieldName) {
    return fieldName.startsWith(CalibrationPointConstants.CONDITION_ASFOUND)
      ? getLocalizedLabel("as_found", "As Found")
      : getLocalizedLabel("as_left", "As Left");
  }

  /**
   * Localize field suffix name "input" or "output".
   * @param {String} fieldName - Field name.
   * @returns {String} Return localized field name "Input" or "Output".
   */
  localizeField(fieldName) {
    return fieldName.endsWith("input")
      ? getLocalizedLabel("input", "input")
      : getLocalizedLabel("output", "output");
  }
}

export default OutOfRangeFieldError;
