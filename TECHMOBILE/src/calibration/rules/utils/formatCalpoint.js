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
import DatasheetConstants from "../constants/DatasheetConstants";

/** Utils */
import fromDisplayableValue from "./numberFormatter/fromDisplayableValue";
import toDisplayableValue from "./numberFormatter/toDisplayableValue";

/**
 * Formats calpoint values.
 *
 * @param {ProxyObject} calpoint : Calibration point.
 * @param {String} field : Field name user is changing.
 * @param {ProxyObject} assetfunction : Asset function object.
 * @returns {String} Formatted value based on locale.
 */
const formatCalpoint = (calpoint, field, assetfunction, locale) => {
  let precision = DatasheetConstants.DEFAULT_PRECISION;

  // If assetfunction exists, use its precision
  if (assetfunction) {
    precision = field.endsWith("output")
      ? assetfunction.outputprecision
      : assetfunction.inputprecision;
  }

  /**
   * This assignment might affect one of these attributes:
   * @changes calpoint.asfoundinput
   * @changes calpoint.asfoundoutput
   * @changes calpoint.asfoundsetpoint
   * @changes calpoint.asleftinput
   * @changes calpoint.asleftoutput
   * @changes calpoint.asleftsetpoint
   */
  return formatField(
    calpoint[field],
    precision,
    locale
  );
};

/**
 * Formats numeric value into string value formatted based on locale.
 *
 * @param {String} strValue : String value.
 * @param {Number} places : Decimal precision.
 * @param {Boolean} round : DatasheetConstants.TRUNCATE_VALUE or DatasheetConstants.ROUND_VALUE.
 * @param {String} locale : User locale, i.e.: "en-US".
 * @returns {String}
 */
const formatField = (strValue, places, locale) =>
  toDisplayableValue(
    fromDisplayableValue(strValue, locale),
    {
      places,
      stripThousandSign: true,
    },
    locale
  );

export default formatCalpoint;
