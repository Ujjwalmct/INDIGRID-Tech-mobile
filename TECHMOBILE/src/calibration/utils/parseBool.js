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
 * Parse page parameter to boolean. Graphite converts any param to
 * string, so if we have a param "?blockvisible=true", the value
 * will be convert to String("true") instead of Boolean(true).
 *
 * So we add two strict rules here to parse the string "true" or
 * string "false" to its boolean values.
 *
 * @value {Boolean} value
 * @returns {Boolean} Returns converted value
 */
const parseBool = (value) => {
  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }
  }

  return Boolean(value);
};

export default parseBool;
