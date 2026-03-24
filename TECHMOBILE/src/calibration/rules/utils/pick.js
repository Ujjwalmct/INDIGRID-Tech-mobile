/*
 * IBM Confidential
 * OCO Source Materials
 * 5737-M66, 5900-AAA
 * (C) Copyright IBM Corp. 2023
 * The source code for this program is not published or otherwise divested of
 * its trade secrets, irrespective of what has been deposited with the U.S.
 * Copyright Office.
 */

/**
 * Pick one or more properties listed in `keys` from object and returns
 * a new object with the selected properties.
 *
 * For example: if object is {propA: 1, propB: 2, propC: 3} and
 *   keys is ['propA'], it should "pick" `propA` from original object
 *   and return a new object { propA: 1 }.
 *
 * @param {Object} object
 * @param {Array} keys
 * @returns
 */
const pick = (object, keys) =>
  Array.isArray(keys)
    ? keys.reduce((obj, key) => {
        if (object && object.hasOwnProperty(key)) {
          obj[key] = object[key];
        }
        return obj;
      }, {})
    : {};

export default pick;
