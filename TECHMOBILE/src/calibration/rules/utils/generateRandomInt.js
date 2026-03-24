/*
 * IBM Confidential
 * OCO Source Materials
 * 5737-M66, 5900-AAA
 * (C) Copyright IBM Corp. 2023
 * The source code for this program is not published or otherwise divested of
 * its trade secrets, irrespective of what has been deposited with the U.S.
 * Copyright Office.
 */

const generateRandomInt = (min = 1000, max = 9999) =>
  Number(Math.trunc(Math.random() * (max - min + 1)) + min);

export default generateRandomInt;
