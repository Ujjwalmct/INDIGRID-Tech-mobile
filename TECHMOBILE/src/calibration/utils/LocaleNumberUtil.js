/*
 * Licensed Materials - Property of IBM
 *
 * 5724-U18, 5737-M66
 *
 * (C) Copyright IBM Corp. 2023 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */

/**
 * validate if a number is a valid number without locale or a valid locale number
 * @param {input} input input number
 * @param {locale} locale locale value e.g. en-US
 * @returns true or false 
 */
const isValidNumber = (input, locale) => {
  let isValidNumber = false;
  if (!isNaN(Number(input))) {
    isValidNumber = true;
  } else {
    isValidNumber = isValidLocaleNumber(input, locale);
  }
  return isValidNumber;
}

/**
 * validate if a number is a valid locale number
 * @param {input} input input number
 * @param {locale} locale locale value e.g. en-US 
 * @returns true or false 
 */
const isValidLocaleNumber = (input, locale) => {

  const decimalSeparator = getDecimalSeparator(locale);
  const thousandSeparator = getThousandSeparator(locale);

  const numberPattern = new RegExp(`^-?\\d{1,3}(${thousandSeparator}\\d{3})*(\\${decimalSeparator}\\d+)?$|^-?\\d+(\\${decimalSeparator}\\d+)?$`);
  const regex = new RegExp(numberPattern);
  const isLocaleNumberValid = regex.test(input);
  return isLocaleNumberValid;
}

/**
 * get default thousand separator based on locale 
 * @param {locale} locale locale value e.g. en-US 
 * @returns space,dot or comma
 */
const getDefaultThousandSeparator = (locale) => {
  const numberFormat = new Intl.NumberFormat(locale);
  const parts = numberFormat.formatToParts(1234567.89);

  const groupPart = parts.find(part => part.type === "group");
  let thousandSeparator = groupPart.value;
  return thousandSeparator;
}

/**
 * check if a string is a decimal number
 * @param {string} pointValue - The value to be checked if it is a decimal number.
 * @returns {boolean} - Returns true if the input value is a decimal number, otherwise returns false
 */
const isDecimalString = (pointValue) => {
  const regex = /^[+-]?\d*\.\d+$/; // Regex to match decimal numbers
  const isDecimal = regex.test(pointValue);
  return isDecimal;
}

/**
 * get thousand separator based on locale included some cases that not returned correct separator e.g., en-ZA, fr-FR 
 * @param {locale} locale locale value e.g. en-US 
 * @returns space,dot or comma
 */
const getThousandSeparator = (locale) => {
  let thousandSeparator = "";
  //special locale list that does not return the expected thousand separator
  const specialLocales = ["en-ZA", "fr-FR", "fr-CA", "da-DK"];
  if(specialLocales.includes(locale)){
    thousandSeparator = " ";
  } else {
    thousandSeparator = getDefaultThousandSeparator(locale);
  }
  return thousandSeparator;
};

/**
 * get decimal separator based on locale included some cases that not returned correct separator e.g., en-ZA 
 * @param {locale} locale locale value e.g. en-US
 * @returns dot or comma
 */
const getDecimalSeparator = (locale) => {
  let decimalSign = ".";
  //only en-ZA returns dot(.) in javascript, should be comma(,)
  if(locale === "en-ZA"){
    decimalSign = ",";
  } else {
    decimalSign = getDefaultDecimalSeparator(locale);
  }
  return decimalSign;
};

/**
 * get default decimal separator based on locale 
 * @param {locale} locale locale value e.g. en-US
 * @returns dot or comma
 */
const getDefaultDecimalSeparator = (locale) => {
  const numberWithDecimal = 1.1;
  const formattedNumber = new Intl.NumberFormat(locale).format(numberWithDecimal);
  const decimalSign = formattedNumber[1];
  return decimalSign;
};

const functions = {
  isValidNumber,
  isValidLocaleNumber,
  isDecimalString,
  getDefaultThousandSeparator,
  getThousandSeparator,
  getDecimalSeparator,
  getDefaultDecimalSeparator
};

  
export default functions;
  