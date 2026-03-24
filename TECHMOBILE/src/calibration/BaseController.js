// istanbul ignore file

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

import LocaleConstants from "./rules/constants/LocaleConstants";

/**
 * BaseController
 *
 * @typedef {import('@maximo/maximo-js-api').Application} Application
 * @typedef {import('@maximo/maximo-js-api').Datasource} Datasource
 * @typedef {import('@maximo/maximo-js-api').Page} Page
 */
class BaseController {
  /**
   * Reference to global App.
   * @private
   * @type {Application}
   */
  app = null;

  /**
   * Reference to current page.
   * @private
   * @type {Page}
   */
  page = null;

  /**
   * Initialize page.
   * @param {Page} page
   * @param {Application} app
   */
  pageInitialized(page, app) {
    this.app = app;
    this.page = page;
  }

  /**
   * Get user locale from user info in ISO format, ie: "en", "en-US", "en-GB".
   * References:
   * 1. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#locales
   * 2. https://en.wikipedia.org/wiki/IETF_language_tag
   * @returns {String} Returns user locale, i.e.: "en-US", "fr-FR", "pt-BR".
   */
  getLocale() {
    const userInfo = this.app.getUserInfo();
    const userLocale = this.app.parseLocale(userInfo);

    // Replace separators to a valid js format
    let localeISO = String(userLocale).replaceAll("_", "-");

    // Test if parsed locale is valid.
    // If getCanonicalLocales throws and exception,
    // then we keep en-US as default.
    try {
      Intl.getCanonicalLocales([localeISO]);
    } catch (error) {
      localeISO = LocaleConstants.EN_US;
    }

    return localeISO;
  }
}

export default BaseController;
