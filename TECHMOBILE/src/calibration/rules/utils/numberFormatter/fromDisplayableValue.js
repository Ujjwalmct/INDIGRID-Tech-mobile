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
import LocaleNumberUtil from '../../../utils/LocaleNumberUtil.js';
/**
 * Converts value from located string to number value.
 * For example:
 *   strVal = "1,000.25"
 *   locale = "en-US"
 * Returns: 1000.25
 * 
 * @param {String} strVal 
 * @param {String} locale 
 * @param {allowNaN} allowNaN : accept NaN as return value in case strVal is not a number.
 * @returns {Number|NaN}
 */
const fromDisplayableValue = (strVal, locale) => {

  // Error! strVal is null
  if (strVal === null) {
    return null;
  }

  // Already a number, so skip formatting
  if(typeof strVal === "number") {
    return strVal;
  }

  // Error! strVal is not string
  if (typeof strVal !== "string") {
    return null;
  }
  
  const decimalSign = LocaleNumberUtil.getDecimalSeparator(locale);
  const thousandSeparator = LocaleNumberUtil.getThousandSeparator(locale);
  
  if(!LocaleNumberUtil.isDecimalString(strVal)){
    strVal = strVal.replaceAll(thousandSeparator, "");
  }
  
  let replacedDecimalValue = strVal.replace(decimalSign, ".")
  
  let formatedValue = Number(replacedDecimalValue);
  
  return formatedValue;
};

export default fromDisplayableValue;
