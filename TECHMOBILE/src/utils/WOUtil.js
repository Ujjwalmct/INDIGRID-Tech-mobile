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

import SynonymUtil from './SynonymUtil';


/**
 * Returns the active labtrans item
 * @param  {app} app current app object
 * @param {Object} datasource wo object
 */
const getActiveLabTrans = async (app, laborDS) => {

  const labor = app.client.userInfo.labor.laborcode;

  const synonymDS = app.findDatasource('synonymdomainData');
  const timerstatusActive = await SynonymUtil.getSynonym(synonymDS, 'TIMERSTATUS', 'TIMERSTATUS|ACTIVE');

  // load active labtrans
  await laborDS.initializeQbe();
  laborDS.setQBE('timerstatus', '=', timerstatusActive.value);
  laborDS.setQBE('laborcode', '=', labor);
  const activeLabTran = await laborDS.searchQBE(undefined, true);

  return activeLabTran;

}

// Assisted by watsonx Code Assistant 
/**
 * Find the active lab transaction from the list of transactions.
 * @param {Object} app - The application object.
 * @param {Array} transList - The list of transactions.
 * @returns {Object} - The active lab transaction object.
 */
const isActiveLabTrans = async(app, transList) => {
  const synonymDS = app.findDatasource('synonymdomainData');
  const timerstatusActive = await SynonymUtil.getSynonym(synonymDS, 'TIMERSTATUS', 'TIMERSTATUS|ACTIVE');
  return !!transList?.find((item) => item.timerstatus === timerstatusActive.value);
}

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-8b-code-instruct
/**
 * @param {object} app - The application object.
 * @param {object} item - The item object containing the asset number and location.
 * @returns {void}
 */
const openMeterReadingDrawer = (app, item) => {
  app.state.meterReading = {};
  // Set required details for meter reading dialogs    
  app.state.meterReading = {
    // Load Meters based on assetNum,
    assetnum: item.assetmetercount && item.assetnum,
    // Location info to load location meters
    location: item.locationmetercount && (item.location || item.locationnum),
    // Disable entering new reading for cancelled workorder
    restrictNewReading: ['CAN'].includes(item?.status_maxvalue),
    // Enable meter downloading
    canLoad: false
  }
  app.showDialog("maxlib_meterReadingDrawer");
}

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-8b-code-instruct
/**
 * Opens the Work Order Hazard drawer.
 * @param  {app} app current app object
 * @param  {Page} page current page object
 * @param  {Object} datasource wo object
 * @param  {drawer} drawer drawer to open
 */
 const openWOHazardDrawer = async(app, page, object, drawer) => {  
  let wods = app.findDatasource("woDetailds");
  // istanbul ignore else
  if (wods) {
    if (!object?.item?.href) {
      app.state.canLoadWoDetailDS = false;
    }
    await wods.load({
      noCache:true,
      itemUrl: object.item.href
    });
    app.state.canLoadWoDetailDS = true;
  }  
   const assignment = wods?.item?.assignment?.filter(x => x?.labor?.personid === app?.client?.userInfo?.personid) ?? [];
  wods.item.splanreviewdate = assignment?.length > 0 ? assignment[0]?.splanreviewdate : wods.item.splanreviewdate;
  // istanbul ignore else
  if(wods.item.splanreviewdate){
    wods.item.splanreviewdate = app.dataFormatter.dateWithoutTimeZone(app.dataFormatter.convertISOtoDate(wods.item.splanreviewdate));
    page.state.isSafetyPlanReviewed = !wods.item.splanreviewdate;
  }
  page.showDialog(drawer);
};

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-8b-code-instruct
/**
 * Updates the safety plan review date for a workorder .
 * @param  {app} app current app object
 * @param  {Page} page current page object
 * @param  {Object} datasource wo object
 * @param  {drawer} drawer drawer to open
 */
const reviewSafetyPlan = async (app) => {
  const wods = app.findDatasource("woDetailds");
  const assignmentDS = wods?.getChildDatasource('assignment', wods?.item);
  const filterFunc = assignment => {
    return assignment?.laborcode === app.client?.userInfo?.labor?.laborcode;
  };
  assignmentDS?.applyInMemoryFilter(filterFunc);
  await assignmentDS?.load();
  const reviewDate = app.dataFormatter.currentUserDateTime();
   if (assignmentDS?.items?.length > 0) {
    assignmentDS.items[0].splanreviewdate = reviewDate;
    assignmentDS.items[0].changedate = reviewDate;
    await assignmentDS.save();
  }
  else {
    const localPayload = {
      href: wods?.item?.href,
      splanreviewdate: reviewDate
    };
    const option = {
      responseProperties: "description,anywhererefid",
      localPayload: localPayload
    };
    const dataToUpdate = {splanreviewdate: reviewDate, href:wods?.item?.href};		
    await wods.update(dataToUpdate, option);  
 }
  
  await wods.forceReload();
  const schedulePage = app.findPage("schedule") || app.findPage("approvals");
  // istanbul ignore next
  if (schedulePage?.state) {
    const scheduleDS = schedulePage.state.selectedDS;
    const schedulePageDS = app.findDatasource(scheduleDS);
    if (schedulePageDS) {
      await schedulePageDS.load({
        noCache: true,
      });
    }
  }
  if (wods?.item)
    wods.item.splanreviewdate = app.dataFormatter.dateWithoutTimeZone(app.dataFormatter.convertISOtoDate(assignmentDS?.currentItem?.splanreviewdate || wods.item?.splanreviewdate || reviewDate));
  const currentPage = app?.findPage(app?.currentPage?.name);
  // istanbul ignore else
  if (currentPage) {
    currentPage.state.isSafetyPlanReviewed = false;
  }
  //istanbul ignore else
  if (!wods?.item?.href && schedulePage) {
    schedulePage.state.canLoadWoDetails = false;
  }
   app.findDatasource('wodetails')?.load({
    noCache:true,
    itemUrl: wods?.item?.href
  });
  // istanbul ignore else
  if (schedulePage) {
    schedulePage.state.canLoadWoDetails = true;
  }
  assignmentDS?.clearInMemoryFilter();
};


/**
 * 
 * @param {*} workorder item passed to method to do all necessary calculation  
 * @returns cost object of workorder including tasks
 */
const computedEstTotalCost = (item) => {
  let woActivityLength = item.woactivity?.length;
  let newData = {
    estintlabcost: item.estintlabcost || 0,
    estintlabhrs: item.estintlabhrs || 0,
    estlabhrs: item.estlabhrs || 0,
    estmatcost: item.estmatcost || 0,
    estoutlabcost: item.estoutlabcost || 0,
    estoutlabhrs: item.estoutlabhrs || 0,
    estservcost: item.estservcost || 0,
    esttoolcost: item.esttoolcost || 0
  }
  // istanbul ignore if
  if(item.woactivity?.length) {
    while(woActivityLength--) {
      newData.estintlabcost += parseFloat(item.woactivity[woActivityLength].estintlabcost);
      newData.estintlabhrs += parseFloat(item.woactivity[woActivityLength].estintlabhrs);
      newData.estlabhrs += parseFloat(item.woactivity[woActivityLength].estlabhrs);
      newData.estmatcost += parseFloat(item.woactivity[woActivityLength].estmatcost);
      newData.estoutlabcost += parseFloat(item.woactivity[woActivityLength].estoutlabcost);
      newData.estoutlabhrs += parseFloat(item.woactivity[woActivityLength].estoutlabhrs);
      newData.estservcost += parseFloat(item.woactivity[woActivityLength].estservcost);
      newData.esttoolcost += parseFloat(item.woactivity[woActivityLength].esttoolcost);
    }
  }
  const estimatedcost = {
    intlbrhrs: newData.estintlabhrs.toFixed(2),
    extlbrhrs: newData.estoutlabhrs.toFixed(2),
    intlbrcost: newData.estintlabcost.toFixed(2),
    extlbrcost: newData.estoutlabcost.toFixed(2),
    servicecost: parseFloat(newData.estservcost).toFixed(2),
    toolcost: parseFloat(newData.esttoolcost).toFixed(2),
    materialcost: parseFloat(newData.estmatcost).toFixed(2),
    totallbrhrs: parseFloat(newData.estintlabhrs + newData.estoutlabhrs).toFixed(2),
    totallbrcost: parseFloat(newData.estintlabcost + newData.estoutlabcost).toFixed(2),
    totalcost: (newData.estservcost + newData.esttoolcost + newData.estmatcost + newData.estintlabcost + newData.estoutlabcost).toFixed(2)
  };
  return estimatedcost;
}

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-8b-code-instruct
/**
 * Check if the safety plan for an item has been reviewed.
 * @param {Object} item - The item to check.
 * @returns {boolean} True if the safety plan has been reviewed, false otherwise.
 */
const isSafetyPlanReviewed = (item, personid) => {
  const assignment = item?.assignment?.filter(x => x?.labor?.personid === personid) ?? [];
  return assignment?.length > 0 ? !assignment[0]?.splanreviewdate : item?.splanreviewdate ? !item?.splanreviewdate : true;                             
}

const functions = {
  openMeterReadingDrawer,
  openWOHazardDrawer,
  reviewSafetyPlan,
  computedEstTotalCost,
  getActiveLabTrans,
  isSafetyPlanReviewed,
  isActiveLabTrans
};


export default functions;
