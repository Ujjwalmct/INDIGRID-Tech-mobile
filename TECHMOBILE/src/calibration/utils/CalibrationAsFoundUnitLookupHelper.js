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

import UnitLookupHelper from "./UnitLookupHelper";

class CalibrationAsFoundUnitLookupHelper extends UnitLookupHelper {
  constructor(app, page) {
    super (app,
    page,
    'unitspointLookupDs',
    'unitspointLookup')
  }
}

export default CalibrationAsFoundUnitLookupHelper;
