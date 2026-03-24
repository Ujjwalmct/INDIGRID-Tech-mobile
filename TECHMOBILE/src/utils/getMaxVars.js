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
 * @returns {String}
 */
const getMaxVars = () => {
  // Get Application instance
  const app = appResolver.getApplication();

  // Error! App is undefined, return empty array
  if (!app) {
    return [];
  }

  // Load datasource
  const defaultSetDs = app.findDatasource("defaultSetDs");

  // Accessing mobile max vars attribute
  const mobilemaxvars = defaultSetDs?.currentItem?.mobilemaxvars;

  // Return MAXVARS
  return Array.isArray(mobilemaxvars) ? mobilemaxvars : [];
};

export default getMaxVars;
