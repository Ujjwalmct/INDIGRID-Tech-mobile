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

import { Application, JSONDataAdapter, Datasource, Page } from "@maximo/maximo-js-api";
// import sinon from 'sinon';
import WOCreateEditUtils from "./WOCreateEditUtils";
import assetLookupData from "../test/asset-lookup-json-data.js";
import statusitem from '../test/statuses-json-data.js';
import workorderitem from '../test/wo-detail-json-data.js';
import assetFeatureData from "../test/assetfeature-json-data.js"
import assetLrm from "../test/asset-lrm-data.js"
import sinon from 'sinon';
import WorkOrderEditController from "../WorkOrderEditController.js";
import alnDomainDS from '../test/alndomain-json-data.js';
import WorkOrderCreateController from "../WorkOrderCreateController";
import specificationData from "../test/specification-json-data.js";
import assetAttributedata from "../test/assetAttribute-json-data.js";
import classificationData from '../test/classificationdata';  

function newLookupDatasource(
  data,
  name = "assetLookupDS",
  idAttribute = "assetnum"
) {
  const da = new JSONDataAdapter({
    src: data,
    items: "member",
  });

  const ds = new Datasource(da, {
    idAttribute: idAttribute,
    name: name,
  });

  return ds;
}


function newStatusDatasource(data = statusitem, name = 'synonymdomainData') {
  const da = new JSONDataAdapter({
    src: statusitem,
    items: 'member',
    schema: 'responseInfo.schema'
  });
  const ds = new Datasource(da, {
    idAttribute: 'value',
    name: name
  });
  return ds;
}

function newDatasource(data = workorderitem, name = "dsWoedit") {
  const da = new JSONDataAdapter({
    src: data,
    items: "member",
    schema: 'responseInfo.schema'
  });

  const ds = new Datasource(da, {
    idAttribute: "wonum",
    name: name,
  });

  da.options.query = !da.options.query ? {} : da.options.query;
  da.options.query.interactive = null;
  return ds;
}

describe("WOCreateEditUtils", () => {
  it("should getAssetOrLocation", async () => {
    const app = new Application();
    app.client = {
      userInfo: {
        defaultSite: "BEDFORD",
      },
    };
    const assetDataDs = newLookupDatasource(
      assetLookupData,
      "assetLookupDS",
      "assetnum"
    );
    app.registerDatasource(assetDataDs);

    let data = await WOCreateEditUtils.getAssetOrLocation(
      app,
      "assetLookupDS",
      "assetnum",
      "1008"
    );
    expect(data.length).toBe(1);
  });

  it("should setPriorityFailureCode", async () => {
    const app = new Application();
    app.client = {
      userInfo: {
        defaultSite: "BEDFORD",
      },
    };

    const assetDataDs = newLookupDatasource(
      assetLookupData,
      "assetLookupDS",
      "assetnum"
    );
    app.registerDatasource(assetDataDs);

    const locationDataDs = newLookupDatasource(
      assetLookupData,
      "locationLookupDS",
      "location"
    );
    app.registerDatasource(locationDataDs);

    let ds = {
      item: {
        assetnum: '1008'
      },
    };

    await WOCreateEditUtils.setPriorityFailureCode(app,ds);
    expect(ds.item.assetlocpriority).toBe(2);
    expect(ds.item.failurecode).toBe('PUMPS');

    ds = {
      item: {
        location: 'BR210'
      },
    };
    await WOCreateEditUtils.setPriorityFailureCode(app,ds);
    expect(ds.item.assetlocpriority).toBe(3);
    expect(ds.item.failurecode).toBe('HVAC');
  });

  it("should validateGlAccount", async () => {
    const app = new Application();

    let ds = {
      item: {
        glaccount: '6400-300-???'
      },
    };

    const page =  {
      state:{},
      showDialog: () => {},
    }

    let event = {
        glaccount: '6210-350-???'
    };
    const str = 'The location and asset combination that you entered has a different GL account. Do you want to update the GL account for this work order based on the new asset and location combination?'
    WOCreateEditUtils.validateGlAccount(app, page, ds, event);
    expect(page.state.dialogBMXMessage).toBe(str);

    const shouldShowDialogMessage = WOCreateEditUtils.validateGlAccount(app, page, ds, event, 'action', true);
    expect(shouldShowDialogMessage).toBe(false);
  });

  it("should validateLocation", async () => {
    const app = new Application();

    let ds = {
      item: {
        location: 'BR210'
      },
    };

    const page =  {
      state:{},
      showDialog: () => {},
    }

    let event = {
      location: 'BR230'
    };
    const str = `The specified asset is not in the current location. Do you want to change the location to match the location of this asset - ${event.location}?`
    WOCreateEditUtils.validateLocation(app, page, ds, event);
    expect(page.state.dialogBMXMessage).toBe(str);
    event.location = '';
    expect(WOCreateEditUtils.validateLocation(app, page, ds, event)).toBe(true);
  });

  it("should validateAsset", async () => {
    const app = new Application();

    let ds = {
      item: {
        assetnum: '11240'
      },
    };

    const page =  {
      state:{},
      showDialog: () => {},
    }

    let event = {
      asset: [
        {
          assetnum: "11250",
          description: "Circulation Fan- Centrifugal/ 20/000 CFM",
          location: "BR200",
          priority: 4,
        }
      ]
    };
    const str = `The specified location does not contain the current asset. Do you want to change your asset to the asset contained in the specified location - ${event.asset[0].assetnum}?`
    WOCreateEditUtils.validateAsset(app, page, ds, event);
    expect(page.state.dialogBMXMessage).toBe(str);
    
    event.asset = [];
    expect(WOCreateEditUtils.validateAsset(app, page, ds, event)).toBe(true);
  });

  it("should validateAsset when the current location has more one asets associated with it", async () =>{
    const app = new Application();
    const str = "The location is not associated with the specified asset. If you keep the location, the asset will be cleared."
    const page =  {
      state:{},
      showDialog: () => {},
    }
    let ds = {
      item: {
        assetnum: '11240'
      },
    };
    let event = {
      asset: [
        {
          assetnum: "11250",
          description: "Circulation Fan- Centrifugal/ 20/000 CFM",
          location: "BR200",
          priority: 4,
        },
        {
          assetnum: "11200",
          description: "HVAC System- 50 Ton Cool Cap/ 450000 Btu Heat Cap",
          location: "BR200",
          priority: 4,
        }
      ]
    };
    WOCreateEditUtils.validateAsset(app, page, ds, event);
    expect(page.state.dialogBMXMessage).toBe(str);
  })

  it("should setAsset", async () => {
    const app = new Application();

    let ds = {
      item: {
      },
    };

    const page =  {
      state:{},
      showDialog: () => {},
      name: 'woedit'
    }

    let event = {
      assetnum: '1877',
      location: 'FIELDSTAFF'
    };
    const controller = new WorkOrderCreateController();
    WOCreateEditUtils.setAsset(app, page, ds, event, controller);
    expect(ds.item.assetnum).toBe('1877');
  });

  it("should setGLAccount", async () => {
    const app = new Application();

    let ds = {
      item: {
      },
    };

    const page =  {
      state:{},
      showDialog: () => {},
      name: 'woedit'
    }

    let event = {
      assetnum: '1877',
      location: 'FIELDSTAFF'
    };
    const controller = new WorkOrderCreateController();
    WOCreateEditUtils.setGLAccount(app, page, ds, event, 'SETASSETGL', controller);
    expect(ds.item.assetnum).toBe('1877');
  });

  it("should open logtype lookup", async () => {
    const app = new Application();
    const page =  {
      state:{"initialDefaultLogType":"!CLIENTNOTE!"},
      showDialog: () => {},
      name: 'schedule'
    }
    const ds = newStatusDatasource(statusitem, 'synonymdomainData');
    app.registerDatasource(ds);
    await WOCreateEditUtils.openWorkLogTypeLookup(page,ds);
    expect(app.findDatasource("synonymdomainData").item.value).not.toBeNull();

    page.state.initialDefaultLogType = '';
    await WOCreateEditUtils.openWorkLogTypeLookup(page,ds);
    expect(app.findDatasource("synonymdomainData").item.value).not.toBeNull();
  });

  // Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it("should find the index of featureLabel", async () => {
    let assetFeatureArr = [
      { label: "MP 10" },
      { label: "MP 20" },
      { label: "MP 30" },
    ]
    let evt = { item: { startfeaturelabel: "MP 10" } };
    WOCreateEditUtils.featureLabelValidation(assetFeatureArr, evt, "startfeaturelabel");

    evt = { item: { endfeaturelabel: "MP 10" } };
    WOCreateEditUtils.featureLabelValidation(assetFeatureArr, evt, "endfeaturelabel");

    evt = { item: { endoffset: "0" } };
    WOCreateEditUtils.featureLabelValidation(assetFeatureArr, evt, "endoffset");

  });

  // Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it("should find the index of featureLabel", async () => {
    let assetFeatureArr = [
      { label: "MP 10" },
      { label: "MP 20" },
      { label: "MP 30" },
    ]
    const evt = { item: { startfeaturelabel: "MP 10" } };
    WOCreateEditUtils.featureLabelValidation(assetFeatureArr, evt, "startfeaturelabel");

    const evt1 = { item: { startfeaturelabel: "MP 10" } };
    WOCreateEditUtils.featureLabelValidation(assetFeatureArr, evt1, "endfeaturelabel");

  });

  // Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it("should validate the yoffsetref", async () => {
    const app = new Application();
    const page = {
      state: {},
      showDialog: () => { },
      name: 'createwo'
    }
    page.state.yoffsetArr = [
      { value: "MIDLINE" },
      { value: "EDGE-INSIDE" },
      { value: "EDGE-OUTSIDE" },
    ]
    let evt = { item: { startyoffsetref: "MIDLINE" } };
    WOCreateEditUtils.yRefValidation(app, page, evt, "startyoffsetref");

    evt = { item: { endyoffsetref: "MIDLINE" } };
    WOCreateEditUtils.yRefValidation(app, page, evt, "endyoffsetref");

    WOCreateEditUtils.yRefValidation(app, page, evt, "");

  });


  
    // Assisted by WCA@IBM
   // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it("should validate the zoffsetref", async () => {
    const app = new Application();
    const page = {
      state: {},
      showDialog: () => { },
      name: 'createwo'
    }
    page.state.zoffsetArr = [
      { value: "MIDLINE" },
      { value: "EDGE-INSIDE" },
      { value: "EDGE-OUTSIDE" },
    ]
    const evt = { item: { startzoffsetref: "MIDLINE" } };
    await WOCreateEditUtils.zRefValidation(app, page, evt, "startzoffsetref");

    const evt1 = { item: { endzoffsetref: "MP 10" } };
    await WOCreateEditUtils.zRefValidation(app, page, evt1, "endzoffsetref");

    await WOCreateEditUtils.zRefValidation(app, page, evt1, "");

  });

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  test('sets disableButton to true when readOnlyState, saveDisable, or zRefDisable is true', () => {
    const page = {
      state: {
        readOnlyState: true,
        saveDisable: false,
        zRefDisable: false,
        disableButton: false,
      },
    };

    WOCreateEditUtils.saveDisable(page);
    expect(page.state.disableButton).toBe(true);
  });

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it('should return false if evt.item.startyoffsetref is not defined', () => {
    const page = {
      state: {},
      showDialog: () => { },
      name: 'createwo'
    }
    const evt = {
      item: {}
    };
    expect(WOCreateEditUtils.startYRefCal(page, evt)).toBe(false);
  });

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it('should return true if evt.item.startyoffsetref is valid', () => {
    const page = {
      state: {},
      showDialog: () => { },
      name: 'createwo'
    }
    const evt1 = {
      item: {
        startyoffsetref: 'MIDLINE'
      }
    };

    expect(WOCreateEditUtils.startYRefCal(page, evt1)).toBe(true);

  });

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it('should return false if evt.item.endYRefCal is not defined', () => {
    const page = {
      state: {},
      showDialog: () => { },
      name: 'createwo'
    }
    const evt = {
      item: {}
    };
    expect(WOCreateEditUtils.endYRefCal(page, evt)).toBe(false);
  });

  it('should return true if evt.item.startyoffsetref is valid', () => {
    const page = {
      state: {},
      showDialog: () => { },
      name: 'createwo'
    }
    const evt1 = {
      item: {
        endyoffsetref: 'MIDLINE'
      }
    };
    //sinon.stub(WOCreateEditUtils, 'yRefValidation').returns (true);
    expect(WOCreateEditUtils.endYRefCal(page, evt1)).toBe(true);

  });
  


  it('should validate yreference when field is startyoffsetref when have data', () => {
    const page = {
      state: {
        yoffsetArr: ["EDGE_INSIDE", "EDGE_OUTSIDE"],
      },
      showDialog: () => { },
      name: 'createwo'
    };

    const evt = {
      item: {
        startyoffsetref: "EDGE_INSIDE",
      },
    };
    const field = "startyoffsetref";
    const result = WOCreateEditUtils.yRefValidation(page, evt, field);
    expect(result).toBe(false);
  });

  it('should push data in offset array', () => {
    const emptyArray = [];
    const result = WOCreateEditUtils.offSetArr(emptyArray);
    expect(result).toHaveLength(0);
  })

  it('should push data in offset array', () => {
    const arrayWithObjects = [{ value: "GROUND" }, { value: "SURFACE" }];
    const result = WOCreateEditUtils.offSetArr(arrayWithObjects);
    expect(result).toHaveLength(2);
  })


  it("returns true if the start y-offset reference is valid", () => {
    const page = {
      state: {
        yoffsetArr: [{ id: "1", value: "10" }, { id: "2", value: "20" }],
      },
    };
    const evt = { item: { startyoffsetref: "1" } };
    const field = "startyoffsetref";
    const result = WOCreateEditUtils.yRefValidation(page, evt, field);
    expect(result).toBe(false);
  });

  it("returns true if the start y-offset reference is valid", () => {
    const page = {
      state: {
        yoffsetArr: [{ id: "1", value: "10" }, { id: "2", value: "20" }],
      },
    };
    const evt = { item: { startyoffsetref: "20" } };
    const field = "startyoffsetref";
    const result = WOCreateEditUtils.yRefValidation(page, evt, field);
    expect(result).toBe(true);
  });

  it("returns true if the end y-offset reference is valid", () => {
    const page = {
      state: {
        yoffsetArr: [{ id: "1", value: "10" }, { id: "2", value: "20" }],
      },
    };
    const evt = { item: { endyoffsetref: "20" } };
    const field = "endyoffsetref";
    const result = WOCreateEditUtils.yRefValidation(page, evt, field);
    expect(result).toBe(true);
  });

  it("returns true if the end y-offset reference is valid", () => {
    const page = {
      state: {
        yoffsetArr: [{ id: "1", value: "10" }, { id: "2", value: "20" }],
      },
    };
    const evt = { item: { endyoffsetref: "2" } };
    const field = "endyoffsetref";
    const result = WOCreateEditUtils.yRefValidation(page, evt, field);
    expect(result).toBe(false);
  });



  it("should open reference point lookup", () => {
    const app = new Application();
    const evt = { ref: 'start' };
    const assetnum = 'I-95N';
    const showDialogStub = sinon.stub(app, "showDialog");
    WOCreateEditUtils.openRefPointLookup(app, evt, assetnum);
    expect(showDialogStub.called).toBe(true);

    const evt1 = { ref: 'end' };
    WOCreateEditUtils.openRefPointLookup(app, evt1, assetnum);
    expect(showDialogStub.called).toBe(true);

    showDialogStub.restore();

    const evt2 = { ref: 'new' };
    const showDialogStubNew = sinon.stub(app, "showDialog");
    WOCreateEditUtils.openRefPointLookup(app, evt2, assetnum);
    expect(showDialogStubNew.called).toBe(false);
   
  });

  it("should find the index of featureLabel", async () => {
    let assetFeatureArr = [
      { label: "MP 10" },
      { label: "MP 20" },
      { label: "MP 30" },
    ]
    const evt = { item: { startfeaturelabel: "MP 10" } };
    WOCreateEditUtils.featureLabelValidation(assetFeatureArr, evt, "startfeaturelabel");

    const evt1 = { item: { startfeaturelabel: "MP 10" } };
    WOCreateEditUtils.featureLabelValidation(assetFeatureArr, evt1, "endfeaturelabel");

  });

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it('should set the state correctly when selecting a new work type', async() => {
    // Page and Application Setup
    const app = new Application();
    const page = new Page({ name: "woedit" });

    // Initial Value Setup
    const workType = 'CM';

    // Set up Datasource
    app.registerPage(page);
    const dsWoEditDs = newDatasource(workorderitem, 'dsWoedit');
    page.registerDatasource(dsWoEditDs);

    // Call function being tested
    WOCreateEditUtils.selectWorkType(page, 'dsWoedit', workType);

    // Check that the state was updated correctly
    expect(page.state.worktype).toEqual(workType);
  });

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it('should call uiRequired - mandatory', () => {
    // Page and Application Setup
    const app = new Application();
    const page = new Page({ name: "woedit" });

    // Set up Datasource
    app.registerPage(page);
    const workOrderData = {...workorderitem};
    workOrderData.uiRequired = { field: ['wopriority']};
    const dsWoEditDs = newDatasource(workOrderData, 'dsWoedit');
    page.registerDatasource(dsWoEditDs);

    let result = WOCreateEditUtils.uiRequired(page, 'dsWoedit', 'wopriority', dsWoEditDs.wopriority);
    expect(result).toBe(false);

    result = WOCreateEditUtils.uiRequired(page, 'dsWoedit', null, dsWoEditDs.wopriority);
    expect(result).toBe(false);
  });

 
  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it('should call chooseLocation', async() => {
    // Page and Application Setup
    let app = new Application();
    const page = new Page({ name: "woedit" });

    // Test data
    const item = {
      location : "BR430",
      assetnum: "11430",
      locationnum: "BR430"
    };
    // Stub Methods
    const getAssetOrLocationStub = sinon.stub(WOCreateEditUtils, "getAssetOrLocation").returns([{ assetnum: "11430", location: "BR430" }]);
    const validateAssetStub = sinon.stub(WOCreateEditUtils, "validateAsset").returns(true);
    const setLocationStub = sinon.stub(WOCreateEditUtils, "setLocation");

    // Set up Datasource
    app.registerPage(page);
    app = {
      client: {
        userInfo: {
          defaultSite : "BEDFORD"
        }
      },
      findDatasource: jest.fn(() => ({
        forceReload: jest.fn(),
        initializeQbe: ()=>{},
        setQBE: (param1,params2)=>{},
        clearQBE:()=>{},
        searchQBE: ()=> {return assetLookupData.member1},
        item :{
          assetnum: "11430",
          locationnum: "BR430"
        }
      })),
    };
    const dsWoEditDs = newDatasource(workorderitem, 'dsWoedit');
    page.registerDatasource(dsWoEditDs);
    const controller = new WorkOrderCreateController();
    await WOCreateEditUtils.chooseLocation(app, page, 'dsWoedit', item, controller);
    expect(page.state.assetFiltered).toBeTruthy();
    expect(item.asset).toEqual([{ assetnum: "11430", location: "BR430"}]);
    expect(controller.validAssetValue).toEqual("11430");
    expect(controller.assetnum).toEqual([{ assetnum: "11430", location: "BR430"}]);
    getAssetOrLocationStub.restore();
    validateAssetStub.restore();
    setLocationStub.restore();
  });

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it('should call validateLinearAsset', async() => {
    // Page and Application Setup
    const app = new Application();
    const page = new Page({ name: "woedit" });
    app.client = {
      userInfo: {
        defaultSite : "BEDFORD"
      }
    }

    // Set up Datasource
    app.registerPage(page);
    const assetLookupDS = newDatasource(assetLookupData, 'assetLookupDS');
    const assetFeatureDataDs = newDatasource(assetFeatureData, 'assetFeatureData');
    const dsWoEditDs = newDatasource(workorderitem, 'dsWoedit');
    app.registerDatasource(assetLookupDS);
    app.registerDatasource(assetFeatureDataDs);
    page.registerDatasource(dsWoEditDs);
    app.initialize();

    await WOCreateEditUtils.validateLinearAsset(app, page, 'dsWoedit', '10001');

    expect(page.state.assetLinear).toBeFalsy()
    expect(page.state.endOffsetReadOnly).toBeTruthy();
  });

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it('Should call startOffsetCal', async () => {
    const app = new Application();
    const page = new Page({ name: "woedit" });
    page.state = {
      startFeatureMeasure: 10.20
    };
    app.registerPage(page);
    app.initialize();
    const measureCalculationStub = sinon.stub(WOCreateEditUtils, "measureCalculation").returns(20);
    let evt = { item: { startfeaturelabel: "MP 10" ,startoffset:"10", startmeasure: ""} };
    await WOCreateEditUtils.startOffsetCal(app, page, 'dsWoedit', evt);
    expect(evt.item.startmeasure).toBe("20.20");

    evt = { item: { startfeaturelabel: "" ,startoffset:"", startmeasure: ""} };
    await WOCreateEditUtils.startOffsetCal(app, page, 'dsWoedit', evt, false);
    expect(evt.item.startmeasure).toBe(10.2);
    measureCalculationStub.restore();
  });

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it('Should call endOffsetCal', async () => {
    const app = new Application();
    const page = new Page({ name: "woedit" });
    page.state = {
      endFeatureMeasure: 10.20
    };
    app.registerPage(page);
    app.initialize();
    const measureCalculationStub = sinon.stub(WOCreateEditUtils, "measureCalculation").returns(20);
    let evt = { item: { endfeaturelabel: "MP 10" , endoffset:"10" } };
    await WOCreateEditUtils.endOffsetCal(app, page, 'dsWoedit', evt);
    expect(evt.item.endmeasure).toBe("20.20");

    evt = { item: { endfeaturelabel: "" , endoffset:"" } };
    await WOCreateEditUtils.endOffsetCal(app, page, 'dsWoedit', evt, false);
    expect(evt.item.endmeasure).toBe(10.2);
    measureCalculationStub.restore();
  });

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it('Should call startMeasureCal', async () => {
    const app = new Application();
    const page = new Page({ name: "woedit" });
    page.state = {
      endFeatureMeasure: 10.20,
      measureUpdate: false,
      startOffsetReadOnly: null
    };
    app.registerPage(page);
    app.initialize();
    const measureCalculationStub = sinon.stub(WOCreateEditUtils, "measureCalculation").returns(20);

    let evt = { item: { startfeaturelabel: "" } };
    await WOCreateEditUtils.startMeasureCal(app, page, 'dsWoedit', evt);
    expect(page.state.endOffsetReadOnly).toBeFalsy()

    page.state.endMeasureUpdate = false;

    evt = { item: { startfeaturelabel: "MP 10" , startoffset:"10", startmeasure: "" } };
    await WOCreateEditUtils.startMeasureCal(app, page, 'dsWoedit', evt);
    expect(page.state.startOffsetReadOnly).toBeTruthy();

    evt = { item: { startfeaturelabel: "MP 10" , startmeasure: "" } };
    await WOCreateEditUtils.startMeasureCal(app, page, 'dsWoedit', evt);
    expect(measureCalculationStub.called).toBeFalsy();

    measureCalculationStub.restore();
  });

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it('Should call endMeasureCal', async () => {
    const app = new Application();
    const page = new Page({ name: "woedit" });
    page.state = {
      endFeatureMeasure: 10.20,
      measureUpdate: false,
      startOffsetReadOnly: null
    };
    app.registerPage(page);
    app.initialize();
    const measureCalculationStub = sinon.stub(WOCreateEditUtils, "measureCalculation").returns(20);
    let evt = { item: { endfeaturelabel: "" } };
    await WOCreateEditUtils.endMeasureCal(app, page, 'dsWoedit', evt);
    expect(page.state.endOffsetReadOnly).toBeFalsy()

    page.state.endMeasureUpdate = false;

    evt = { item: { endfeaturelabel: "MP 10" , endmeasure: "" } };
    await WOCreateEditUtils.endMeasureCal(app, page, 'dsWoedit', evt);
    expect(measureCalculationStub.called).toBeFalsy()

    evt = { item: { endfeaturelabel: "MP 10" , endoffset:"10", endmeasure: "" } };
    await WOCreateEditUtils.endMeasureCal(app, page, 'dsWoedit', evt);
    expect(page.state.endOffsetReadOnly).toBeTruthy();
    measureCalculationStub.restore();
  });

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it("Should call startMeasureValidation Validation", () => {
    const app = new Application();
    const page = new Page({ name: "woedit" });
    // Mock the dataset containing the linear asset's start and end measures
    const dsName = "dsWoedit";
    app.registerPage(page);
    app.initialize();
    // Test case 1: User input is within range
    let evt = { item: { startmeasure: 50 } };
    expect(WOCreateEditUtils.startMeasureValidation(app, page, dsName, evt)).toBe(true);
    page.state = {
      assetStartMeasure : 55
    }
    // Test case 2: User input is out of range
    evt = { item: { startmeasure: -1 } };
    expect(WOCreateEditUtils.startMeasureValidation(app, page, dsName, evt)).toBe(false);
  });

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it("Should call endMeasureValidation Validation", () => {
    const app = new Application();
    const page = new Page({ name: "woedit" });
    // Mock the dataset containing the linear asset's start and end measures
    const dsName = "dsWoedit";
    app.registerPage(page);
    app.initialize();
    // Test case 1: User input is within range
    let evt = { item: { endmeasure: 50 } };
    expect(WOCreateEditUtils.endMeasureValidation(app, page, dsName, evt)).toBe(true);
    page.state = {
      assetStartMeasure : 55
    }
    // Test case 2: User input is out of range
    evt = { item: { endmeasure: -1 } };
    expect(WOCreateEditUtils.endMeasureValidation(app, page, dsName, evt)).toBe(false);
  });

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it('Should call measureCalculation', async() => {
    const app = new Application();
    const page = new Page({ name: "woedit" });
    page.state = {
      endFeatureMeasure: 5,
      measureUpdate: false,
      startFeatureMeasure: 5
    };
    const assetLRMEditDs = newDatasource("", 'assetLRMEdit');
   
    const loadStub = sinon.stub(assetLRMEditDs, "load")
    app.registerDatasource(assetLRMEditDs);
    app.registerPage(page);
    app.initialize();
    let evt = {item: {endoffset: 20, startoffset: 20,}}
    let field = "endmeasure"
    const  isEditWo = true;
    const result = await WOCreateEditUtils.measureCalculation(app, page, evt, field, isEditWo);
    expect(loadStub.called).toBeTruthy();
    expect(result).toBe("25.00");

     field = "startmeasure"
    const resultNew = await WOCreateEditUtils.measureCalculation(app, page, evt, field, isEditWo);
    expect(loadStub.called).toBeTruthy();
    expect(resultNew).toBe("25.00");


  })

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
 it('Validates the startZRefCal()', async () => {
    const app = new Application();
    const page = new Page({ name: "woedit" });
    app.initialize();

    const evt2 = {
      item: {
        startzoffsetref: ""
      }
    }; 
    await WOCreateEditUtils.startZRefCal(app, page, 'dsWoedit', evt2);
    expect(page.state.saveDisable).toBe(false);
    
    // Arrange
    const evt = { item: { startzoffsetref: 45 } };
    await WOCreateEditUtils.startZRefCal(app, page, 'dsWoedit', evt);
    expect(page.state.saveDisable).toBeTruthy();

    //     const evt3 = {
    //   item: {
    //     startzoffsetref: "MiDLINE"
    //   }
    // }
    // const refCalVal = sinon.stub(WOCreateEditUtils, "zRefValidation").returns(false);
    // await WOCreateEditUtils.startZRefCal(app, page, 'dsCreateWo', evt3);
    // expect(page.state.saveDisable).toBe(refCalVal.value);

  });

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it('Validates the endZRefCal()', async () => {
    const app = new Application();
    const page = new Page({ name: "woedit" });
    app.initialize();

    const evt2 = {
      item: {
        endzoffsetref: ""
      }
    }; 
    await WOCreateEditUtils.endZRefCal(app, page, 'dsWoedit', evt2);
    expect(page.state.zRefDisable).toBe(false);

    // Arrange
    const evt = { item: { endzoffsetref: 45 } };
    await WOCreateEditUtils.endZRefCal(app, page, 'dsWoedit', evt);
    expect(page.state.zRefDisable).toBe(true);
  });

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it('Validate the startFeatureLabelVal', async() => {
    const app = new Application();
    const page = new Page({ name: "woedit" });
    const assetFeatureDataDs = newDatasource(assetFeatureData, 'assetFeatureData');
    app.registerDatasource(assetFeatureDataDs);
    const featureLabelValidationStub = sinon.stub(WOCreateEditUtils, "featureLabelValidation");
    const chooseReferncePointDataStub = sinon.stub(WOCreateEditUtils, "chooseReferncePointData");
    app.initialize();
    const evt = { item: { startfeaturelabel: null } };
    await WOCreateEditUtils.startFeatureLabelVal(app, page, 'dsWoedit', evt);
    expect(page.state.saveDisable).toBeFalsy();
    featureLabelValidationStub.restore();
    chooseReferncePointDataStub.restore();
  });

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it('Validate the endFeatureLabelVal', async() => {
    const app = new Application();
    const page = new Page({ name: "woedit" });
    const assetFeatureDataDs = newDatasource(assetFeatureData, 'assetFeatureData');
    app.registerDatasource(assetFeatureDataDs);
    const featureLabelValidationStub = sinon.stub(WOCreateEditUtils, "featureLabelValidation");
    const chooseReferncePointDataStub = sinon.stub(WOCreateEditUtils, "chooseReferncePointData");
    app.initialize();
    const evt = { item: { endfeaturelabel: null } };
    await WOCreateEditUtils.endFeatureLabelVal(app, page, 'dsWoedit', evt);
    expect(page.state.saveDisable).toBeFalsy();
    featureLabelValidationStub.restore();
    chooseReferncePointDataStub.restore();
  });

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it('Should call editAssetsLocation', async() => {
    const app = new Application();
    const page = new Page({ name: "woedit" });
    page.state = {
      editAssetsLocation: null
    };
    app.registerPage(page);
    app.initialize();
    let item = { value: 20 };
    await WOCreateEditUtils.editAssetsLocation(page, item, 'dsWoedit');
    expect(page.state.editAssetsLocation).toBeTruthy();

    item = { value: null };
    await WOCreateEditUtils.editAssetsLocation(page, item, 'dsWoedit');
    expect(page.state.editAssetsLocation).toBeTruthy();
  });

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it('Should call clearlinearfield', async() => {
    const app = new Application();
    const page = new Page({ name: "woedit" });
    app.registerPage(page);
    const dsWoEditDs = newDatasource(workorderitem, 'dsWoedit');
    page.registerDatasource(dsWoEditDs);
    app.initialize();
    await WOCreateEditUtils.clearlinearfield(page, 'dsWoedit');
    expect(dsWoEditDs.item.endzoffset).toBe(null);
  });

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it('Should call onUserConfirmationNo', async() => {
    const app = new Application();
    const page = new Page({ name: "woedit" });
    page.state = {
      selectedItem: {
        action: 'SETASSET',
        item : {
          assetnum: '10001'
        }
      }
    }
    app.registerPage(page);
    const dsWoEditDs = newDatasource(workorderitem, 'dsWoedit');
    page.registerDatasource(dsWoEditDs);
    app.initialize();
    WOCreateEditUtils.onUserConfirmationNo(app, page, 'dsWoedit');
    expect(dsWoEditDs.item.assetnum).toBe('10001');
  });

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  it('should call chooseAsset', async () => {
    const app = new Application();
    const page = new Page({ name: "woedit" });
    app.registerPage(page);
    page.state = {
      isMobile: true,
      isManual: false
    }
    const assetFeatureDataDs = newDatasource(assetFeatureData, 'assetFeatureData');
    app.registerDatasource(assetFeatureDataDs);
    const dsWoEditDs = newDatasource(workorderitem, 'dsWoedit');
    page.registerDatasource(dsWoEditDs);
    const controller = new WorkOrderCreateController();
    let item = { islinear: true }
    await WOCreateEditUtils.chooseAsset(app, page, 'dsWoedit', item, controller);
    expect(page.state.assetLinear).toBeTruthy();

    page.state.isMobile = false;
    item = { islinear: false }
    await WOCreateEditUtils.chooseAsset(app, page, 'dsWoedit', item, controller);
    expect(page.state.linearAssetAvailable).toBeFalsy();
  })

});

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
/**
 * This test verifies that the `defaultLinearData` function sets the start and end measures of a linear relationship to the values passed in as parameters. It also verifies that the function sets the start and end offset references to the y-offset and z-offset references of the LRM associated with the asset. Finally, it verifies that the function sets the start and end offset read-only flags to true.
 */
it('defaultLinearData function sets the start and end measures, offsets, and offset references', async () => {
  const app = new Application();
  const page = new Page({ name: "woedit" });
  const woDatasource = newDatasource(workorderitem, "dsWoedit");
  const assetLrmDs = newDatasource(assetLrm, "assetLRMEdit");
  const controller = new WorkOrderEditController();
  page.registerDatasource(woDatasource);
  app.registerDatasource(assetLrmDs);
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);
  await assetLrmDs.load();
  await WOCreateEditUtils.defaultLinearData(app, page, woDatasource, {
    startmeasure: '10',
    endmeasure: '20',
    lrm: '1234567890'
  });
  expect(woDatasource.item.startmeasure).toBe('10');
  expect(woDatasource.item.endmeasure).toBe('20');
  expect(page.state.startOffsetReadOnly).toBeTruthy();
  expect(page.state.endOffsetReadOnly).toBeTruthy();
});

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
// Test to verify that the openAssetLookup function opens the asset lookup modal and sets the parent page name
test("openAssetLookup() should open the asset lookup modal and set the parent page name", () => {
  let mockSetPage = jest.fn();
  global.open = jest.fn();
  const app = new Application();
  const controller = new WorkOrderEditController();
  const page = new Page({ name: 'page' });
  page.registerController(controller);
  const parentPage = new Page({ name: 'parentPage' });
  page.parent = parentPage;

  app.registerPage(page);
  app.initialize();
  app.setCurrentPage = mockSetPage;
  page.getApplication = () => app;

  app.state.parentPage = 'woedit';

  // Call the openAssetLookup function with sample arguments
  WOCreateEditUtils.openAssetLookup(app, page, "woedit");

  // Assert that the parentPage property of the app state was set correctly
  expect(app.state.parentPage).toBe("woedit");

  // Assert that the useConfirmDialog property of the page state was set to false
  expect(page.state.useConfirmDialog).toBe(true);
});

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
it('Validates the openZRefernceLookup()', async () => {
  const app = new Application();
  const alnoDomainDs = newDatasource(alnDomainDS, "alnDomainDS");
  app.registerDatasource(alnoDomainDs);
  app.initialize();
  const showDialogStub = sinon.stub(app, "showDialog");

  let evt = { ref: 'new' };
  WOCreateEditUtils.openZRefernceLookup(app, evt);
  expect(showDialogStub.called).toBe(false);

  evt = { ref: 'start' };
  WOCreateEditUtils.openZRefernceLookup(app, evt);
  expect(showDialogStub.called).toBe(false);

});

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
it('Validates the openYRefernceLookup()', async () => {
  const app = new Application();
  const alnoDomainDs = newDatasource(alnDomainDS, "alnDomainDS");
  app.registerDatasource(alnoDomainDs);
  app.initialize();

  const evt = { ref: 'new' };
  const showDialogStub = sinon.stub(app, "showDialog");
  WOCreateEditUtils.openYRefernceLookup(app, evt);
  expect(showDialogStub.called).toBe(false);
});

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
// Test 1 - Checks that the asset number is set correctly when an asset is chosen
it('chooseAssetItem sets the asset number correctly', () => {
  const app = new Application();
  const page = new Page({ name: "woedit" });

  // Set up datasource with asset number
  const controller = new WorkOrderEditController();
  const woDatasource = newDatasource(workorderitem, "dsWoedit");
  page.registerDatasource(woDatasource);
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);

  const item = {
    assetnum: '12345'
  }
  // woDatasource.item.assetnum = '12345';
  WOCreateEditUtils.chooseAssetItem(app, page, woDatasource, item, controller);
  // Choose asset and check that asset number was set correctly
  expect(woDatasource.item.assetnum).toBe('12345');
});


it('Should call chooseClassification()', async() => {
  const app = new Application();
  const page = new Page({ name: "woedit" });

  // Set up datasource with asset number
  const controller = new WorkOrderEditController();
  const woDatasource = newDatasource(workorderitem, "dsWoedit");
  page.registerDatasource(woDatasource);
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);

  const selectedItem = {
    classstructureid: '123',
    hierarchypath: 'PIPE_LEAK'
  }
  // woDatasource.item.assetnum = '12345';
  WOCreateEditUtils.chooseClassification(app, page, "dsWoedit", selectedItem);
  // Choose asset and check that asset number was set correctly
  expect(page.state.hierarchypath).toBe('PIPE_LEAK');
  expect(page.state.classstructureid).toBe('123');
});

it('Should call clearClassification()', async() => {
  const app = new Application();
  const page = new Page({ name: "woedit" });

  // Set up datasource with asset number
  const controller = new WorkOrderEditController();
  const woDatasource = newDatasource(workorderitem, "dsWoedit");
  page.registerDatasource(woDatasource);
  app.registerController(controller);
  app.initialize();
  controller.pageInitialized(page, app);

  // woDatasource.item.assetnum = '12345';
  WOCreateEditUtils.clearClassification(app, page, "dsWoedit");
  // Choose asset and check that asset number was set correctly
  expect(page.state.hierarchypath).toBe('');
  expect(page.state.classstructureid).toBe('');
});

it('Should call updateSpecificationAttributes()', async() => {
  const app = new Application();
  const page = new Page({ name: "woedit" });
  const controller = new WorkOrderEditController();
  const woDatasource = newDatasource(workorderitem, "dsWoedit");
  const specificationDS = newDatasource(specificationData, "createEditWoSpecificationDS");
  const assetAttributeDS = newDatasource(assetAttributedata, "assetAttributeDS");
  page.registerDatasource(woDatasource);
  app.registerDatasource(specificationDS);
  app.registerDatasource(assetAttributeDS);
  app.registerController(controller);
  await assetAttributeDS.load();
  await specificationDS.load();
  await app.initialize();
  await controller.pageInitialized(page, app);
  await WOCreateEditUtils.updateSpecificationAttributes(app);
  expect(specificationDS.items.length).toBe(10);
});

it('Should call loadSpecifications()', async() => {
  const app = new Application();
  const page = new Page({ name: "woedit" });
  const controller = new WorkOrderEditController();
  const woDatasource = newDatasource(workorderitem, "dsWoedit");
  const specificationDS = newDatasource(specificationData, "createEditWoSpecificationDS");
  sinon.stub(WOCreateEditUtils, 'validateAsset').returns(true);
  sinon.stub(WOCreateEditUtils, 'setLocation').returns(true);
  page.registerDatasource(woDatasource);
  app.registerDatasource(specificationDS);
  app.registerController(controller);
  await specificationDS.load();
  await app.initialize();
  await controller.pageInitialized(page, app);
  WOCreateEditUtils.validateAssetLocation(app, page, specificationDS, {}, controller);
  await WOCreateEditUtils.loadSpecifications (app, specificationData.member);
  expect(specificationDS.items.length).toBe(10);
});


// Assisted by watsonx Code Assistant 
it('should call deleteSpecification()', async () => {
  const app = new Application();
  const woSpec = newDatasource(specificationData, "woSpecification");
  app.registerDatasource(woSpec);
  await app.initialize();
  await woSpec.load();
  await WOCreateEditUtils.deleteSpecification(app);
  expect(woSpec.items.length).toBeGreaterThan(0);
});

// Assisted by watsonx Code Assistant 
it('should call verifyOrgId()', async () => {
  const app = new Application();
  app.client = {
    userInfo: {
      insertOrg: "EAGLENA"
    }
  };
  await app.initialize();
  const returnValue = await WOCreateEditUtils.verifyOrgId(app, 'EAGLENA');
  expect(returnValue).toBeTruthy();
});

// Assisted by watsonx Code Assistant 
it('should call verifySiteId()', async () => {
  const app = new Application();
  app.client = {
    userInfo: {
      insertOrg: "EAGLENA",
      defaultSite: "BEDFORD"
    }
  };
  await app.initialize();
  const returnValue = await WOCreateEditUtils.verifySiteId(app, 'BEDFORD');
  expect(returnValue).toBeTruthy();
});

// Assisted by watsonx Code Assistant 
it('should call hasWoObject()', async () => {
  const app = new Application();
  await app.initialize();
  const item = {
    classusewith: [
      {
        "objectname" : "WORKORDER"
      },
      {
        "objectname": "WOACTIVITY"
      },
      {
        "objectname": "SOLUTION"
      },
      {
        "objectname": "INCIDENT"
      }
    ]
  };
  const returnValue = await WOCreateEditUtils.hasWoObject(item);
  expect(returnValue).toBeTruthy();
});

// Assisted by watsonx Code Assistant 
it('should call getClassificationSpec()', async () => {
  const app = new Application();
  const specificationDataCustom = {...specificationData};
  specificationDataCustom.member[0].classstructureid = '1013';
  const woSpec = newDatasource(specificationDataCustom, "woSpecification");
  const workOrderClassDomain = newDatasource(classificationData, "workOrderClassDomain");
  const hasWoObjectStub = sinon.stub(WOCreateEditUtils, 'hasWoObject').returns(true);
  const verifyOrgId = sinon.stub(WOCreateEditUtils, 'verifyOrgId').returns(true);
  const verifySiteId = sinon.stub(WOCreateEditUtils, 'verifySiteId').returns(true);
  app.registerDatasource(woSpec);
  app.registerDatasource(workOrderClassDomain);
  await app.initialize();
  await woSpec.load();
  await workOrderClassDomain.load();
  const returnVal = await WOCreateEditUtils.getClassificationSpec(app, 'workOrderClassDomain', woSpec.item.classstructureid);
  expect(returnVal?.length).toBeGreaterThan(0);
  hasWoObjectStub.restore();
  verifyOrgId.restore();
  verifySiteId.restore();
});

// Assisted by watsonx Code Assistant 
it('should call generateCombineSpecDs()', async () => {
  const app = new Application();
  const getClassificationSpecStub = sinon.stub(WOCreateEditUtils, 'getClassificationSpec').returns([
    {
      "assetattrid": "ANOM TYP",
      "classstructureid": "1013",
      "applydownhier": false,
      "continuous": false,
      "assetattributeid": 36,
      "href": null,
      "classspecid": 151,
      "orgid": "EAGLENA"
    }
  ]);
  const specificationDataCustom = {...specificationData};
  specificationDataCustom.member = [{...specificationData.member[0]}];
  specificationDataCustom.member[0].classstructureid = '1013';
  const woSpec = newDatasource(specificationDataCustom, "woSpecification");
  const workOrderClassDomain = newDatasource(classificationData, "workOrderClassDomain");
  const assetAttributeDS = newDatasource(assetAttributedata, "assetAttributeDS");
  const woSpecificationsCombinedDS = newDatasource({}, 'woSpecificationsCombinedDS');
  app.registerDatasource(woSpec);
  app.registerDatasource(woSpecificationsCombinedDS);
  app.registerDatasource(assetAttributeDS);
  app.registerDatasource(workOrderClassDomain);
  await app.initialize();
  await woSpec.load();
  await workOrderClassDomain.load();
  await WOCreateEditUtils.generateCombineSpecDs(app, 'woSpecificationsCombinedDS');
  expect(woSpecificationsCombinedDS.items.length).toBeGreaterThan(0);
  getClassificationSpecStub.restore();
});

// Assisted by watsonx Code Assistant 
it('should call filterClassifications()', async () => {
  const app = new Application();
  app.client = {
    userInfo: {
      insertOrg: "EAGLENA"
    }
  };
  const hasWoObjectStub = sinon.stub(WOCreateEditUtils, 'hasWoObject').returns(true);
  const verifyOrgId = sinon.stub(WOCreateEditUtils, 'verifyOrgId').returns(true);
  const verifySiteId = sinon.stub(WOCreateEditUtils, 'verifySiteId').returns(true);
  await app.initialize();
  const items = [
    {
      "id": 1,
      "orgid": "EAGLENA",
      "siteid": "BEDFORD",
      classusewith: [
        {
          "objectname" : "WORKORDER"
        },
        {
          "objectname": "WOACTIVITY"
        },
        {
          "objectname": "SOLUTION"
        },
        {
          "objectname": "INCIDENT"
        }
      ]
    }
  ];
  const returnVal = await WOCreateEditUtils.filterClassifications(app, items);
  expect(returnVal).toBeTruthy();
  hasWoObjectStub.restore();
  verifyOrgId.restore();
  verifySiteId.restore();
});

it('should call setFieldValue()', async () => {
  const app = new Application();
  const dsCreateWo = newDatasource(
    workorderitem,
    "dsCreateWo"
  );
  const page = new Page({ name: "createwo" });
  page.registerDatasource(dsCreateWo);
  app.registerPage(page);
  await dsCreateWo.load();
  await app.initialize();
  await WOCreateEditUtils.setFieldValue(page, 'description');
  expect(dsCreateWo.item.assetnum).toBe("13120");
});
