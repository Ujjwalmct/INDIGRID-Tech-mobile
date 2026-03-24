/*
 * Licensed Materials - Property of IBM
 *
 * 5724-U18, 5737-M66
 *
 * (C) Copyright IBM Corp. 2024 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */

import LocaleConstants from "../../constants/LocaleConstants";
import limitToMaxFraction from "./limitToMaxFraction";

/**
 * @description This is will limit a max value of 15 digits for number. if exceeds
 * then it will trim the precision down.
 * @param {Number} value
 * @param {Number} fieldLength
 * @param {Number} maxfraction
 * @param {String} locale - User Locale
 * @returns {Number} Number of digits on the right side of the decimal point.
 */
const limitFieldValue = (
  value,
  fieldLength,
  maxfraction,
  locale = LocaleConstants.EN_US
) => {
  value = value.toString();

  const targetValue = value.substring(0, fieldLength);
  const decimalFoundAt = targetValue.indexOf(".");
  if (decimalFoundAt === fieldLength - 1) {
    //No fraction found but decimal found and integer length is one less
    value = targetValue.replace(".", "");
    return value;
  }

  if (decimalFoundAt < 0)
    //No decimal found
    return targetValue;

  let integer = value.split('.')[0];
  let fraction = value.split('.')[1];

  //Initialize the length attribute if object not exists
  integer = integer ? integer : { length: 0 };
  fraction = fraction ? fraction : { length: 0 };
  let digitsAllowed = fieldLength - 1;
  if (integer.length + fraction.length > digitsAllowed) {
    //Reduce the fraction to accomodate only 15
    let reduceFractionTo = Math.abs(integer.length - digitsAllowed);
    if (reduceFractionTo > maxfraction) reduceFractionTo = maxfraction;
    return limitToMaxFraction(value, reduceFractionTo, locale);
  }

  return limitToMaxFraction(value, maxfraction, locale);
};

export default limitFieldValue;
