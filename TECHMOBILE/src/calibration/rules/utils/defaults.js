/*
 * IBM Confidential
 * OCO Source Materials
 * 5737-M66, 5900-AAA
 * (C) Copyright IBM Corp. 2023
 * The source code for this program is not published or otherwise divested of
 * its trade secrets, irrespective of what has been deposited with the U.S.
 * Copyright Office.
 */

const defaults = (obj, ...defs) =>
  Object.assign({}, obj, ...defs.reverse(), obj);

export default defaults;
