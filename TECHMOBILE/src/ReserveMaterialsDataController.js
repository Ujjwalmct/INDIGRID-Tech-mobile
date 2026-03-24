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

class ReservedMaterialsDataController {

  onDatasourceInitialized(ds, owner, app) {
    this.datasource = ds;
    this.owner = owner;
    this.app = app;
  }

  /*
   * Create the itemnum along with desc
   */
  computedItemNum(item) {
    let computedItemNum = null;

    if (item) {
      if (item.itemnum && item.description) {
        computedItemNum = item.itemnum + ' ' + item.description;
      } else if (item.itemnum && !item.description) {
        computedItemNum = item.itemnum;
      } else {
        computedItemNum = item.description;
      }
    }
    return computedItemNum;
  }

}

export default ReservedMaterialsDataController;
