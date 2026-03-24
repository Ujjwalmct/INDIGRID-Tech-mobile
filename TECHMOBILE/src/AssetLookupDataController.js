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

class AssetLookupDataController {  
  // Assisted by watsonx Code Assistant 
  /**
   * Computes the asset description by concatenating the asset number and description.
   * @param {object} item - The item object containing asset number and description.
   * @returns {string} - The concatenated asset number and description.
   */
  computedAssetDesc(item) {
    return item?.assetnum + ' ' + item?.description;
  }
  }
  
  export default AssetLookupDataController;
    
