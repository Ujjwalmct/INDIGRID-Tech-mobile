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
 * Create ASCII table with attributes from object.
 * For example, the object below:
 *   obj = {
 *     "pluscwodspointid": 123,
 *     "input": "3",
 *     "output": "500"
 *   }
 *
 * Will be transformed into:
 * `
 * +------------------+-------+
 * |    Attribute     | Value |
 * +------------------+-------+
 * | pluscwodspointid | 123   |
 * | input            | 3     |
 * | output           | 500   |
 * +------------------+-------+
 * `
 *
 * @param {Object} object
 * @param {Array} filter
 * @returns {String}
 */
const printTable = (origObject, filter) => {
  // Add header
  const object = { ...origObject };
  object["Attribute"] = "Value";

  const PADDING = 2;
  const hasFilter = Array.isArray(filter);

  let spacingCol1 = 0;
  let spacingCol2 = 0;
  let key = "";

  for (key in object) {
    if (hasFilter && !filter.includes(key) && key !== "Attribute") {
      continue;
    }
    if (key.length > spacingCol1) {
      spacingCol1 = key.length;
    }
    if (object[key]?.length > spacingCol2) {
      spacingCol2 = object[key]?.length;
    }
  }

  spacingCol1 += PADDING;
  spacingCol2 += PADDING;

  // Build Header
  const spaceA = "".padEnd(spacingCol1, "-");
  const spaceB = "".padEnd(spacingCol2, "-");

  let line = `+${spaceA}+${spaceB}+\n`;
  let content = [];

  for (key in object) {
    if (hasFilter && !filter.includes(key) && key !== "Attribute") {
      continue;
    }

    const valA = key;
    const valB = String(object[key]);

    // First column
    const a = Math.max(spacingCol1 - valA.length, 1);
    const spaceA = "".padStart(a, " ");

    // Second column
    const b = Math.max(spacingCol2 - valB.length, 1);
    const spaceB = "".padStart(b, " ");

    content.push(`|${spaceA}${key}|${object[key]}${spaceB}|\n`);
  }

  return (
    "\n" +
    line +
    content[content.length - 1] +
    line +
    content.slice(0, content.length - 1).join("") +
    line
  );
};

export default printTable;
