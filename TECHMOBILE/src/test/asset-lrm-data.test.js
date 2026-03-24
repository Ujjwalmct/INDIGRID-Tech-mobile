/*
 * Licensed Materials - Property of IBM
 *
 * 5724-U18, 5737-M66
 *
 * (C) Copyright IBM Corp. 2023 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */

import assets from './asset-lrm-data';
it('sample asset lrm data', () => {
  // we are just validating that all the data loads and is not null
  expect(assets).not.toBeNull();
});
