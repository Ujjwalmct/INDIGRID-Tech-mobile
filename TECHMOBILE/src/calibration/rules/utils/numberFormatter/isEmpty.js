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
 * Checks if num should be considered "empty" or not.
 * @param {Number|String} num : Number to check if its empty.
 * @returns {Boolean} Returns whether the number is considered empty or not.
 */
const isEmpty = (num) => num === null || num === undefined || num === "";

export default isEmpty;
