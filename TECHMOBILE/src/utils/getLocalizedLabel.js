/* istanbul ignore file */

/*
 * Licensed Materials - Property of IBM
 *
 * 5724-U18, 5737-M66
 *
 * (C) Copyright IBM Corp. 2022,2024 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */

import appResolver from "./AppResolver";

/**
 * Returns the label for the current language.
 * @see {@link https://pages.github.ibm.com/maximo-app-framework/graphite/main/jsdoc/Application.html#getLocalizedLabel}
 * @param {String} id - The labels unique id.
 * @param {String} value - The default label if not able to localize.
 * @param {Array} params - An array of strings to replace placeholders in string.
 * @returns {String}
 */
const getLocalizedLabel = (id, value, params) => {
  const app = appResolver.getApplication();
  return app ? app.getLocalizedLabel(id, value, params) : value;
};

export default getLocalizedLabel;
