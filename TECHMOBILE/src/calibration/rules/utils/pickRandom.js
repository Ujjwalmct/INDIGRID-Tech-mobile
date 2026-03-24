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

const pickRandom = (list) =>
  Array.isArray(list) ? list[generateRandomInt(0, list.length - 1)] : null;

export default pickRandom;
