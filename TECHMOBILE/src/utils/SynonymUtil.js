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

/**
 * Get synonym for a specific valueid.
 * @param {Datasource} synonymDS
 * @param {String} domainId
 * @param {String} valueId
 */
const getSynonym = async (synonymDS, domainId, valueId) => {
  await synonymDS.initializeQbe();
  synonymDS.setQBE('domainid', '=', domainId);
  synonymDS.setQBE('valueid', '=', valueId);
  const response = await synonymDS.searchQBE(undefined, true);
  if (response?.[0]) {
    return response[0];
  }
  return undefined;
};

/**
 * Method return external values based on provided internal values in an array.
 * @param {Object} app 
 * @param {Array} internalStatusList 
 */
const getExternalStatusList = async (app, internalStatusList) => {
  let defOrg = app.client.userInfo.insertOrg;
  let defSite = app.client.userInfo.insertSite;

  let synonymDomainsDS = app.findDatasource('synonymdomainData');
  await synonymDomainsDS.initializeQbe();
  synonymDomainsDS.setQBE('domainid', '=', 'WOSTATUS');
  synonymDomainsDS.setQBE('orgid', '=', defOrg);
  synonymDomainsDS.setQBE('siteid', '=', defSite);

  let filteredDomainValues = await synonymDomainsDS.searchQBE();

  // istanbul ignore next
  if (filteredDomainValues && filteredDomainValues.length < 1) {
    synonymDomainsDS.setQBE('orgid', '=', defOrg);
    synonymDomainsDS.setQBE('siteid', '=', 'null');
    filteredDomainValues = await synonymDomainsDS.searchQBE();

    // istanbul ignore next
    if (filteredDomainValues && filteredDomainValues.length < 1) {
      synonymDomainsDS.setQBE('orgid', '=', 'null');
      synonymDomainsDS.setQBE('siteid', '=', 'null');
      filteredDomainValues = await synonymDomainsDS.searchQBE();
    }
  }
  let externalStatusList = [];
  filteredDomainValues.forEach((status) => {
    if (internalStatusList.includes(status.maxvalue)) {
      externalStatusList.push(status.value);
    }
  });
  return externalStatusList;
};

/**
 * Get default external value
 * @param {Datasource} synonymDS
 * @param {String} domainId
 * @param {String} maxValue
 */
const getDefaultExternalSynonymValue = async (synonymDS, domainId, maxValue) => {
  let type = '';
  if(synonymDS){
    await synonymDS.initializeQbe();
    synonymDS.setQBE('domainid', '=', domainId);
    synonymDS.setQBE('maxvalue', '=', maxValue);
    let items = await synonymDS.searchQBE();
    // istanbul ignore else
    if (items?.length) {
      for (const item of items) {
        // istanbul ignore else
        if (item.defaults && item.maxvalue === maxValue) {
          type = item.value;
          break;
        }
       }
    }
  }
  return type;
};

/**
 * Get synonym for a specific maxValue.
 * @param {Datasource} synonymDS
 * @param {String} domainId
 * @param {String} maxValue
 */
const getSynonymDomain = async (synonymDS, domainId, maxValue) => {
  await synonymDS.initializeQbe();
  synonymDS.setQBE('domainid', '=', domainId);
  synonymDS.setQBE('maxvalue', '=', maxValue);
  synonymDS.setQBE('defaults', true);
  let response = await synonymDS.searchQBE();
  // istanbul ignore else
  return response?.length && response?.[0];
 
};

/**
 * Get synonym for a specific maxValue & value.
 * @param {Datasource} synonymDS
 * @param {String} domainId
 * @param {String} maxValue
 * @param {String} value
 */
//DT254965 
const getSynonymValue = async (synonymDS, domainId, maxValue, value) => {
  await synonymDS.initializeQbe();
  synonymDS.setQBE('domainid', '=', domainId);
  synonymDS.setQBE('maxvalue', '=', maxValue);
  let items = await synonymDS.searchQBE();
  // istanbul ignore else
  if (items?.length) {
    for (const item of items) {
      // istanbul ignore else
      if (item.maxvalue === maxValue && item.value === value) {
        return item;
      }
    }
  }
  return undefined;
};

/**
 * Get default synonym for a specific maxValue & organization
 * @param {Datasource} synonymDS
 * @param {String} domainId
 * @param {Array} of maxValues
 * @param {String} orgid
 */
const getSynonymByOrg = async (synonymDS, domainId, maxValues, orgId) => {
  await synonymDS.initializeQbe();
  synonymDS.setQBE('domainid', '=', domainId);
  synonymDS.setQBE('maxvalue', 'in', maxValues);
  synonymDS.setQBE('defaults', true);
  synonymDS.setQBE('orgid', '=', orgId);

  let items = await synonymDS.searchQBE();
  if (!items || items?.length < 1) {
    synonymDS.setQBE('orgid', '=', 'null');
    items = await synonymDS.searchQBE();
  }
  return items;
};

/**
 * Get synonym for a specific value.
 * @param {Datasource} synonymDS
 * @param {String} domainId
 * @param {String} value
 * @param {String} siteid
 * @param {String} orgid
 */
const getSynonymDomainByValue = async (synonymDS, domainId, value, siteid, orgid) => {
  await synonymDS.initializeQbe();
  
  synonymDS.setQBE('domainid', '=', domainId);
  synonymDS.setQBE('value', '=', value);
  synonymDS.setQBE('orgid', '=', orgid);
  synonymDS.setQBE('siteid', '=', siteid);
  
  let filteredDomainValues = await synonymDS.searchQBE(undefined, true);

  if (filteredDomainValues && filteredDomainValues.length < 1) {
    synonymDS.setQBE('orgid', '=', orgid);
    synonymDS.setQBE('siteid', '=', 'null');
    filteredDomainValues = await synonymDS.searchQBE();

    // istanbul ignore next
    if (filteredDomainValues && filteredDomainValues.length < 1) {
      synonymDS.setQBE('orgid', '=', 'null');
      synonymDS.setQBE('siteid', '=', 'null');
      filteredDomainValues = await synonymDS.searchQBE();
    }

    if (filteredDomainValues?.[0]) {
      return filteredDomainValues[0];
    }

    return undefined;
  }

  return filteredDomainValues[0];
};

/**
 * Get default external value
 * @param {Datasource} synonymDS
 * @param {String} domainId
 * @param {String} maxValue
 * @param {String} defOrg
 * @param {String} defSite
 */
const getDefExtSynonymValueIdWithOrgSite = async (synonymDS, domainId, maxValue, defOrg, defSite) => {
  await synonymDS.initializeQbe();
  synonymDS.setQBE('domainid', '=', domainId);
  synonymDS.setQBE('maxvalue', '=', maxValue);
  synonymDS.setQBE('orgid', '=', defOrg);
  synonymDS.setQBE('siteid', '=', defSite);
  synonymDS.setQBE('defaults', true);

  let filteredDomainValues = await synonymDS.searchQBE();

  // istanbul ignore next
  if (filteredDomainValues && filteredDomainValues.length < 1) {
    synonymDS.setQBE('domainid', '=', domainId);
    synonymDS.setQBE('maxvalue', '=', maxValue);
    synonymDS.setQBE('orgid', '=', defOrg);
    synonymDS.setQBE('siteid', '=', 'null');
    synonymDS.setQBE('defaults', true);
    filteredDomainValues = await synonymDS.searchQBE();

    // istanbul ignore next
    if (filteredDomainValues && filteredDomainValues.length < 1) {
      synonymDS.setQBE('domainid', '=', domainId);
      synonymDS.setQBE('maxvalue', '=', maxValue);
      synonymDS.setQBE('orgid', '=', 'null');
      synonymDS.setQBE('siteid', '=', 'null');
      synonymDS.setQBE('defaults',  true);
      filteredDomainValues = await synonymDS.searchQBE();
    }

  }
  return filteredDomainValues?.[0];
};

const functions = {
  getSynonym,
  getExternalStatusList,
  getDefaultExternalSynonymValue,
  getSynonymDomain,
  getSynonymValue,
  getSynonymByOrg,
  getSynonymDomainByValue,
  getDefExtSynonymValueIdWithOrgSite
};

export default functions;
