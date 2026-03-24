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

/** Utils */
import getLocalizedLabel from "./getLocalizedLabel";

/**
 * Localized message representation.
 * 
 * @typedef {import('@maximo/maximo-js-api').Application} Application
 */
class Message {

  group = null;

  id = null;

  value = null;

  params = [];

  /**
   * Object that encapsulate the properties needed for translating
   * messages inside Javascript code using getLocalizedLabel.
   * 
   * @param {String} id - The messages unique key.
   * @param {String} value - The message to appear in case its unable to be found from server.
   * @param {Array}  params - An array of strings to replace placeholders in string.
   */
  constructor(id, value, params = []) {
    this.id = id;
    this.value = value;
    this.params = params;
  }

  /**
   * Get group.
   * @returns {String}
   */
  getGroup() {
    return this.group;
  }

  /**
   * Get id.
   * @returns {String}
   */
  getId() {
    return this.id;
  }

  /**
   * Get value.
   * @returns {String}
   */
  getValue() {
    return this.value;
  }

  /**
   * Get params.
   * @returns {String}
   */
  getParams() {
    return this.params;
  }

  /**
   * Returns the label for the current language.
   * @returns {String} Returns localized message.
   */
  getLocalizedLabel() {
    return getLocalizedLabel(
      this.getId(),
      this.getValue(),
      this.getParams()
    );
  }
}

export default Message;
