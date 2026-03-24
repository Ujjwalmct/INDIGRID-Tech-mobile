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
 * Described Field Error
 *
 * @typedef {import("../../../../utils").Message} Message
 */
class FieldError {
  errorType = null;
  fieldName = "";
  item = null;

  /**
   * Instance of Message to display localized messages from Javascript side.
   * @type {Message}
   */
  message = null;

  constructor(errorType, item, fieldName, message) {
    this.errorType = errorType;
    this.item = item;
    this.fieldName = fieldName;
    this.message = message;
  }

  /**
   * Return error type: 'lengthError', 'numberError'.
   * @returns {String}
   */
  getErrorType() {
    return this.errorType;
  }

  /**
   * Returns the field name in which this error is associated to to.
   * @returns {String}
   */
  getFieldName() {
    return this.fieldName;
  }

  /**
   * Returns ProxyObject in which this error belongs to.
   * @returns {ProxyObject}
   */
  getItem() {
    return this.item;
  }

  /**
   * Returns message object.
   * @returns {Message}
   */
  getMessageObject() {
    return this.message;
  }

  /**
   * Set message object.
   * @param {Message} message - Message for localization.
   */
  setMessageObject(message) {
    this.message = message;
  }

  /**
   * Returns the label for the current language.
   * @returns {String} Returns localized message.
   */
  getLocalizedLabel() {
    return this.message.getLocalizedLabel();
  }
}

export default FieldError;
