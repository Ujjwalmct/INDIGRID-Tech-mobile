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

import DatasheetConstants from "../constants/DatasheetConstants";

// TODO: GRAPHITE-70967 fix: replace this SynonymDomain with app datasource
export default class SynonymDomain {
  /**
   * Reference to child datasource 'synonymDS'.
   * @type {Datasource}
   * @private
   */
  synonymDS = null; // synonymdomain data

  /**
   * Reference to datasource 'statusListDS'.
   * @type {Datasource}
   * @private
   */
  statusListDS = null;

  /**
   * Constructor.
   * @param {Datasource} synonymDS
   * @param {Datasource} statusListDS
   */
  constructor(synonymDS = null, statusListDS = null) {
    this.setSynonymDS(synonymDS);
    this.setStatusListDS(statusListDS);
  }

  static resolveToDefaultExternal(domaincalstatusDS, status) {
    const result = domaincalstatusDS?.items?.find(item => item.maxvalue === status && item.defaults);
    return result?.value;
  }

  static resolveToInternal(domaincalstatusDS, status) {
    const result = domaincalstatusDS?.items?.find(item => item.value === status);
    return result?.maxvalue;
  }

  /**
   * @memberof module:synonym
   * @description Resolve a status to its default external value.
   * @param {String} calstatus - The  calstatus.
   * @param {String} status - The status.
   */
  async showFilteredStatus() {
    const synonymDS = this.getSynonymDS();
    const statusListDS = this.getStatusListDS();
    await synonymDS.initializeQbe();
    synonymDS.setQBE("domainid", "=", DatasheetConstants.DOMAINID);
    synonymDS.setQBE("maxvalue", "in", [
      DatasheetConstants.STATUS_BROKEN,
      DatasheetConstants.STATUS_MISSING,
    ]);
    await synonymDS.searchQBE();

    const list = synonymDS.items;
    statusListDS.resetState();
    await statusListDS.load({ src: list, noCache: true });
  }

  /**
   * Show all available status options.
   */
  // istanbul ignore next
  async showAllStatus() {
    const synonymDS = this.getSynonymDS();
    const statusListDS = this.getStatusListDS();

    // Perform search
    await synonymDS.initializeQbe();
    synonymDS.setQBE("domainid", "=", DatasheetConstants.DOMAINID); // ACTION, ADJREQD, ADJTOIMP, BROKEN, FAIL, INSPECT, LIMITEDUSE, MISSING, OLIM, PASS, WARNING
    await synonymDS.searchQBE();

    // Load results into status list
    statusListDS.resetState();
    await statusListDS.load({ src: synonymDS.items });
  }

  /**
   * Getter.
   * @returns undefined
   */
  getSynonymDS() {
    return this.synonymDS;
  }

  /**
   * Getter.
   * @returns undefined
   */
  getStatusListDS() {
    return this.statusListDS;
  }

  /**
   * Setter.
   * @returns {Datasource}
   */
  setSynonymDS(synonymDS) {
    this.synonymDS = synonymDS;
  }

  /**
   * Setter.
   * @returns {Datasource}
   */
  setStatusListDS(statusListDS) {
    this.statusListDS = statusListDS;
  }
}
