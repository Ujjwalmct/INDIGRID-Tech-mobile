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

/**
 * @description Counts total of decimal places in num. Accepts common numbers and scientific notations.
 *  For example:
 *  - 0.99 should return 2.
 *  - 10e-12 should return 11.
 * @param {Number} num
 * @returns {Number} Number of digits on the right side of the decimal point.
 */
const decimalPlacesOf = (num) => {
  
  const match = (''+num).match(/(?:[.,'](\d+))?(?:[eE]([+-]?\d+))?$/);

  if (!match[0]) {
    return 0;
  }

  // Number of digits right of decimal point
  const decimalsCount = match[1] ? match[1].length : 0;

  // Adjust for scientific notation.
  const scientificNotationAdjustment = match[2] ? +match[2] : 0;

  // Number of digits
  return Math.max(0, decimalsCount - scientificNotationAdjustment);
};

export default decimalPlacesOf;
