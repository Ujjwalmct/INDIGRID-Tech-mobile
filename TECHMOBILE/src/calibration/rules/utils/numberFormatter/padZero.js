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

import isEmpty from "./isEmpty";

/**
 * Converts a number to string and pad end with zeroes until precision
 * is reached.
 *
 *   For example, if precision=5:
 *   - padZero(5000, precision)         should return "5000.00000"
 *   - padZero(5000.10, precision)      should return "5000.10000"
 *   - padZero(5000.0000000, precision) should return "5000.00000"
 *   - padZero(5000.0001, precision)    should return "5000.00010"
 *   - padZero(null, precision)         should return null
 *   - padZero(undefined, precision)    should return undefined
 *   - padZero("", precision)           should return ""
 *
 * @param {Number} num - Numeric value
 * @param {Number} precision - Number of digits the fraction part have.
 * @returns {String} Returns value as string with fraction part pad with zeroes.
 */
const padZero = (num, precision, nullable = false) => {
  if (isEmpty(num)) {
    return nullable ? num : `0.${"0".padEnd(precision, "0")}`;
  }

  const [integer, fraction] = num.toString().split(".");

  return fraction
    ? `${integer}.${fraction.padEnd(precision, "0")}`
    : `${integer}.${"0".padEnd(precision, "0")}`;
};

export default padZero;

/*
Testing padZero

const a = 5000.00
const b = 5000.10
const c = 5000.110

const precision = 5;

console.log(format(5000, precision));
console.log(format(5000.10, precision));
console.log(format(5000.0000000, precision));
console.log(format(5000.0001, precision));
console.log(format(null, precision));
console.log(format(undefined, precision));
console.log(format(0, precision));
*/
