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
 * Describes configurations associated to Graphite datasources.
 */
const DatasourceConstants = {

  /**
   * Defines a maximum allowed page size
   */
  MAX_PAGE_SIZE: 10000000,

  /**
   * Datasource option configuration to get child datasource
   * from pluscWoDS.
   */
  get ASSET_FUNCTION_CHILD_OPTIONS() {
    return {
      selectionMode: "single",
      idAttribute: "pluscwodsinstrid",
      query: { relationship: "pluscwodsinstr" }
    };
  },

  /**
   * Datasource option configuration to get child datasource
   * from pluscwodsinstr.
   */
  get CALIBRATION_POINT_CHILD_OPTIONS() {
    return {
      selectionMode: "single",
      idAttribute: "pluscwodspointid",
      pageSize: this.MAX_PAGE_SIZE,
      query: { relationship: "pluscwodsinstrallpoint" },
    };
  },

  /**
   * Datasource save option: cf https://jsw.ibm.com/browse/MAXUIF-1688.
   */
  get CALIBRATION_SAVE_OPTIONS() {
    return {
      skipMerge: true
    };
  }

}

export default DatasourceConstants;
