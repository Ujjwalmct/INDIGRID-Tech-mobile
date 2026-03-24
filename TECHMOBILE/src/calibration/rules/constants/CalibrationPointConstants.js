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

const CalibrationPointConstants = {
  // PREFIXES
  PREFIXES: ["asleft", "asfound"],
  CONDITION_ASLEFT: "asleft",
  CONDITION_ASFOUND: "asfound",

  STDDEV_ASFOUND: "asf",
  STDDEV_ASLEFT: "asl",

  // PLANTYPE
  PLANTYPE: {
    DISCRETE: "DISCRETE",
    ANALOG: "ANALOG",
  },

  FIELD_TYPE: {
    INPUT: "input",
    OUTPUT: "output",
  },

  // UI
  COMPLETE_READINGS_CLICKED: true,
  COMPLETE_READINGS_BACKGROUND: false,

  // Input/Output
  ENTRY_INPUT: "input",
  ENTRY_OUTPUT: "output",

  // Check value length
  MAX_VALUE_LENGTH: 15,

  // Virtual attributes used in CalibrationPointsRepeatable.
  // It should be deleted before saving into main datasource.
  EXCLUDE_ATTRIBUTES: ["_group_index", "_index", "_output_exceeded"],

  /**
   * In Repeatable Calpoints page, we work with virtual attributes
   * created on the fly to help us handle the calibration points
   * data and its groups. However, we should always remove them
   * before sending to the server. We use this constant to
   * communicate when we want to keep the attributes and
   * when we wish to get rid of them.
   */
  KEEP_VIRTUAL_ATTRS: true,

  NULLABLE: true,

  /**
   * Denoting different error types to be displayed in the calibration
   * points page at UI level.
   */
  FIELD_WARNING: "FIELD_WARNING",
  FIELD_ERROR: "FIELD_ERROR",

  /**
   * This property is used when we want to get an item from the
   * datasource and set the same item as "currentItem".
   *
   * For instance, we use this in CalibrationPointsController to
   * change the currentItem in asset function datasource as
   * we switch between pages.
   *
   * For more details: https://github.ibm.com/maximo-app-framework/technician-app/pull/3391
   */
  SET_AS_CURRENT: true,

  /**
   * We should be able to save partial data, but we cannot perform
   * calculations until all data is provided. When we validate a field
   * in Calibration, we must allow it to be empty and keep this choice
   * intact. However, we need to take empty values into account when
   * verifying whether we can perform calculations or not.
   *   We use these two options ALLOW_EMPTY and NOT_ALLOW_EMPTY to
   * separate between these steps, so the user can be able to save
   * points but not have the tolerances calculated until all data is
   * provided.
   */
  ALLOW_EMPTY: true,

  NOT_ALLOW_EMPTY: false,

  INPUT_FIELDS: ['asfoundinput', 'asleftinput', 'asfoundsetpoint', 'asleftsetpoint'],
  OUTPUT_FIELDS: ['asfoundoutput', 'asleftoutput'],
  NOT_APPLICABLE: 'N/A'
};

export default CalibrationPointConstants;
