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

/**
 * @description for number that come in like .98; append 0 in front
 * @param {Number} numberString
 * @param {Number} symbol
 * @returns {Number} Number of digits on the right side of the decimal point.
 */
const manageMissingBase = (numberString, symbol) => {
  let sign = '';
  symbol = symbol ? symbol : '.';

  const decimalFound = numberString.indexOf(symbol) > -1 ? true : false;
  // Check befor decimal symbol, if the base if empty.
  // If yes then append a 0

  if (decimalFound) {
    // Strip any sign symbol
    if (numberString.charAt(0) === '-') {
      numberString = numberString.substr(1, numberString.length);
      sign = '-';
    }

    const base_length = numberString.split(symbol)[0].length;
    if (base_length === 0) numberString = '0' + numberString;

    numberString = sign + numberString;
  }

  return numberString;
};

export default manageMissingBase;
