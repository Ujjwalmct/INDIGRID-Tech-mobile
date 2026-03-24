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

/** Constants */
import UnitLookupConstants from "./constants/UnitLookupConstants";

class UnitLookupHelper {
  constructor(app, page, datasourceName, dialogName) {
    this.app = app;
    this.page = page;
    this.unitsLookupDs = this.page.findDatasource(datasourceName); // Or this.page

    this.dialogName = dialogName;
  }

  /**
   * Opens unit lookup for the corresponding datasheet record.
   * @param  {Page} page current page object.
   * @param  {app} app  current app object.
   * @param  {Datasource} unitsLookupDs current unit lookup datasource
   * @param  {String} dialogName dialog name to open
   */
  async openUnitLookup() {
    await this.unitsLookupDs.initializeQbe();
    this.unitsLookupDs.setQBE("domainid", "=", UnitLookupConstants.DOMAINID);
    await this.unitsLookupDs.searchQBE();
    this.page.showDialog(this.dialogName);
  }
}

export default UnitLookupHelper;
