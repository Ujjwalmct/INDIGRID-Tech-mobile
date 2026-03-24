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

/**
 * Global State to hold instances.
 * Heads up! Here we use a random suffix "suwi3c9l" to reduce the 
 * chances of this variable be overriden by another file.
 */
let globalState_suwi3c9l = {
  app: null
};

/**
 * Singleton that holds reference to Application instatiated in AppController. 
 *
 * This singleton allow us to access `app` variable outside the controller,
 * without having to pass it as argument all the way through.
 * 
 * @typedef {import('@maximo/maximo-js-api').Application} Application
 */
class AppResolver {
  /**
   * Returns instance of Application.
   * @returns {Application}
   */
  getApplication() {
    return globalState_suwi3c9l["app"];
  }

  /**
   * Sets instance of Application.
   * @param {Application} app 
   */
  setApplication(app) {
    globalState_suwi3c9l["app"] = app;
  }
}

let appResolver = Object.freeze(new AppResolver());

export default appResolver;
