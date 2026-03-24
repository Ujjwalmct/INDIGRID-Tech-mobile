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
import round from "lodash/round";
import decimalPlacesOf from "./decimalPlacesOf";

/** Constants */
import DatasheetConstants from "../../constants/DatasheetConstants";

/**
 * Formats numeric value into string value formatted based on locale.
 *
 * Original implementation:
 * @see {@link https://github.ibm.com/maximo/Civil-Architecture/blob/master/rfcs/0010-calibration-rules-for-as-found-calculations/src/snippets/0002_toDisplayableValue.js#L58-L87}
 *
 * @param {Number} numVal - Value to be formatted.
 * @param {Object} options - Formatting options.
 * @param {String} locale - Locale.
 * @returns
 */
const toDisplayableValue = (numVal = 0, options = {}, locale = "en-US") => {
  // TODO: GRAPHITE-70968 refactor: argument 'options' should have same params as toLocaleString in toDisplayableValue
  /* options = {
	  places: <number>,
	  round: <DatasheetConstants.TRUNCATE_VALUE or ROUND_VALUE>,
	  stripThousandSign: {Boolean}
	}*/

  const limit = calculateFractionDigitsLimit(numVal, options);
  const minimumFractionDigits = calculateMinimumFractionDigits(numVal, options);
  const maximumFractionDigits = calculateMaximumFractionDigits(numVal, minimumFractionDigits);

  // Decide whether to truncate or fix decimals
  const formattedVal =
    options.round === DatasheetConstants.ROUND_VALUE
      ? Math.sign(numVal) * round(Math.abs(numVal), minimumFractionDigits)
      : options.round === DatasheetConstants.TRUNCATE_VALUE
      ? truncateDecimal(numVal, options.places)
      : numVal; // Add handling for any other cases if needed

  // Format result based on locale
  const strVal = Number(formattedVal)
    .toLocaleString(locale, {
      style: "decimal",
      minimumFractionDigits: Math.min(minimumFractionDigits, limit), // Should not exceed limit of fraction characters
      maximumFractionDigits: Math.min(maximumFractionDigits, limit), // Should not exceed limit of fraction characters
    });

  // Decides whether to strip thousand sign or return completely
  // formatted. If `stripThousandSign` is not mentioned in options,
  // then we assume the value is `true`.
  const strippedStrVal = options.stripThousandSign === false
    ? strVal
    : stripThousandSign(strVal, locale);

  // Safe measure to ensure the stripped string value never exceeds
  // the max value length limit.
  return strippedStrVal.substring(0, DatasheetConstants.MAX_VALUE_LENGTH);
};

/**
 * Find the thousand sign separator in strVal based on locale and
 * replace it with an empty string "".
 *
 * @param {String} strVal : Formatted value.
 * @param {String} locale : Locale
 * @returns {String} Formatted value stripped of thousand sign separator.
 */
const stripThousandSign = (strVal, locale) => {
  const { format } = new Intl.NumberFormat(locale);
  const [, thousandSign] = /^1(.)0/.exec(format(1000));
  return strVal.replaceAll(thousandSign, "");
};

/**
 * Calculates fraction digits limit based on MAX_VALUE_LENGTH and int
 * digits. Maximo requires that numVal cannot exceeds 15 characters,
 * so we need to limit the decimal precision based on this premise.
 * 
 * @param {Number} numVal 
 * @returns 
 */
const calculateFractionDigitsLimit = (numVal, options) => {
  /**
   * Count size of positive integer part of numVal.
   * Examples:
   *   - When numVal = -123.45, then intDigits = 4, because of "-123"
   *   - When numVal =  12.345, then intDigits = 2, because of "12"
   *   - When numVal =  1.3450, then intDigits = 1, because of "1"
   */
  const intDigits = String(parseInt(Math.abs(numVal))).length;

  // +1 If numVal is float. We count the decimal separator (e.g.: "." or ",")
  const decimalSeparatorOffset = isFloat(numVal)
    ? 1
    // +1 If numVal is safe integer (e.g.: "10") and options.places is 
    //    higher than 0. It means that we will need to add the decimal
    //    separator and decimal values, so we take into account as well
    : options.places > 0 
    ? 1
    : 0;

  // +1 If number is negative. We count the negative sign "-"
  const minusSignOffset = isNegative(numVal) ? 1 : 0;

  // Returns fraction digits limit based on MAX_VALUE_LENGTH limit
  return Math.max(
    DatasheetConstants.MAX_VALUE_LENGTH - (intDigits + minusSignOffset + decimalSeparatorOffset),
    0
  );
};

/**
 * Determines if numVal is safe integer of float number.
 * We are able to do that by applying modulus operator equal to 1:
 *
 * - 25    % 1 = 0
 * - 25.5  % 1 = 0.5
 * - 25.53 % 1 = 0.53
 *
 * If value is different than 0, it means the this number has decimals.
 *
 * @param {Numbers} numVal
 * @returns {Boolean}
 */
const isFloat = (numVal) => (Math.abs(numVal) % 1) > 0;

/**
 * Returns if number is negative.
 * @param {Number} numVal
 * @returns {Boolean}
 */
const isNegative = (numVal) => numVal < 0;

/**
 * Determine the minimum fraction digits to use when formatting input,
 * limited by max value length.
 *
 * @param {Number} numVal - Value to be formatted.
 * @param {Object} options - Formatting options.
 * @returns {Number}
 */
const calculateMinimumFractionDigits = (numVal, options) =>
  options.places === 0 || options.places
    ? options.places
    : decimalPlacesOf(numVal);

/**
 * Determine the maximum fraction digits to use when formatting input.
 * It should not exceed value defined by MAX_VALUE_LENGTH.
 *
 * @param {Number} numVal - Value to be formatted.
 * @param {Object} options - Formatting options.
 * @returns {Number}
 */
const calculateMaximumFractionDigits = (numVal, minimumFractionDigits) =>
  Math.max(minimumFractionDigits, decimalPlacesOf(numVal));

//Do not send in a value that has mre tha  to truncate. 
//For safety always use the managemin resolution feld in ANumberUtil
//Originally designed to truncate whatever the places the place argument gives. 29000.1234 places= 3 result is 29000.1
// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2

/**
 * Truncates a decimal number to a specific number of places.
 * @param {number} value The number to truncate.
 * @param {number} places The number of decimal places to keep.
 * @returns {number} The truncated number.
 */
const truncateDecimal = (value, places) => {
  // Return null if value is null or undefined
  if (value == null) return value;

  // Convert to string
  value = value.toString();
  const [integerPart, decimalPart] = value.split('.');

  // If there's no decimal part or the length is already within limits
  if (!decimalPart || decimalPart.length <= places) {
      return value;
  }

  // Truncate the decimal part
  const truncatedDecimal = decimalPart.slice(0, places);
  const truncatedValue = `${integerPart}.${truncatedDecimal}`;

  // Return the result
  return parseFloat(truncatedValue).toFixed(places);
};

export default toDisplayableValue;
