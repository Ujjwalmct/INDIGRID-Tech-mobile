/*
 * IBM Confidential
 * OCO Source Materials
 * 5737-M66, 5900-AAA
 * (C) Copyright IBM Corp. 2023
 * The source code for this program is not published or otherwise divested of
 * its trade secrets, irrespective of what has been deposited with the U.S.
 * Copyright Office.
 */

import generateRandomInt from "./generateRandomInt";

/**
 * Generate a random float number between min and max, with `fractionDigits` size.
 * @param {Number} min
 * @param {Number} max
 * @param {Number} fractionDigits
 * @returns Number - Returns float number.
 */
const generateRandomFloat = (min = 1000, max = 9999, fractionDigits = 3) => {
  const intPart = generateRandomInt(min, max);

  //istanbul ignore else
  if (fractionDigits === 0) {
    return intPart;
  }

  const maxF = 10 ** fractionDigits;
  const minF = 10 ** (fractionDigits - 1);
  const fractionStr = "0." + generateRandomInt(minF, maxF);
  const fractionPart = Number(fractionStr);

  return Number(intPart + fractionPart);
};

export default generateRandomFloat;
