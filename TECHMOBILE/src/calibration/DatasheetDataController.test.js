/*
 * Licensed Materials - Property of IBM
 *
 * 5737-M60, 5737-M66
 *
 * (C) Copyright IBM Corp. 2021,2025 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */
import datasheetTestData from "./test/test-datasheet-data.js";

import newTestStub from "../test/AppTestStub.jsx";

const baseSetup = async () => {
  return newTestStub({
    currentPage: "assetfunctions",
    onNewState: (state) => {
      return { 
        ...state, 
        canLoadCalibrationData: true
      }
    },
    datasources: {
      pluscWoDs: {
        data: datasheetTestData,
      },
    },
  })();
};

describe("DatasheetDataController", () => {

  it("Successfully loads child datasources for default datasheet and asset function", async () => {
    const app = await baseSetup();

    app.state.selectedDatasheetIndex = undefined;
    app.state.selectedAssetFunctionsIndex = undefined;

    const ds = app.findDatasource("pluscWoDs");
    await ds.loadAndWaitForChildren();

    expect(ds.items.length).toBeGreaterThan(0);

    // Should default to first datasheet and first asset function of that datasheet
    const expectedDatasheet = datasheetTestData.member[0];
    const expectedAssetFunction = expectedDatasheet['pluscwodsinstr'][0];
    expect(app.state.assetFunctionsDetailsDS).not.toBeUndefined();
    expect(app.state.calpointsds).not.toBeUndefined();

    expect(app.state.assetFunctionsDetailsDS.items.length).toBeGreaterThan(0);
    expect(app.state.calpointsds.items.length).toBeGreaterThan(0);

    expect(ds.currentItem.pluscwodsid).toEqual(expectedDatasheet.pluscwodsid);
    expect(app.state.assetFunctionsDetailsDS.currentItem.pluscwodsinstrid).toEqual(expectedAssetFunction.pluscwodsinstrid);
  });

  it("Successfully loads child datasources for selected datasheet and asset function", async () => {
    const app = await baseSetup();
    const _SELECTED_DATASHEET = 1;
    const _SELECTED_ASSETFUNCTION = 1;
    
    app.state.selectedDatasheetIndex = _SELECTED_DATASHEET;
    app.state.selectedAssetFunctionsIndex = _SELECTED_ASSETFUNCTION;

    const ds = app.findDatasource("pluscWoDs");
    await ds.loadAndWaitForChildren();

    expect(ds.items.length).toBeGreaterThan(0);

    const expectedDatasheet = datasheetTestData.member[_SELECTED_DATASHEET];
    const expectedAssetFunction = expectedDatasheet['pluscwodsinstr'][_SELECTED_ASSETFUNCTION];
    expect(app.state.assetFunctionsDetailsDS).not.toBeUndefined();
    expect(app.state.calpointsds).not.toBeUndefined();

    expect(app.state.assetFunctionsDetailsDS.items.length).toBeGreaterThan(0);
    expect(app.state.calpointsds.items.length).toBeGreaterThan(0);

    expect(ds.currentItem.pluscwodsid).toEqual(expectedDatasheet.pluscwodsid);
    expect(app.state.assetFunctionsDetailsDS.currentItem.pluscwodsinstrid).toEqual(expectedAssetFunction.pluscwodsinstrid);
  });

  it("Successfully force reloads datasource", async () => {
    const app = await baseSetup();

    const _SELECTED_DATASHEET = 0;
    const _SELECTED_ASSETFUNCTION = 1;

    app.state.selectedDatasheetIndex = _SELECTED_DATASHEET;
    app.state.selectedAssetFunctionsIndex = _SELECTED_ASSETFUNCTION;

    const ds = app.findDatasource("pluscWoDs");
    await ds.forceReloadAndWaitForChildren();

    expect(ds.items.length).toBeGreaterThan(0);

    const expectedDatasheet = datasheetTestData.member[_SELECTED_DATASHEET];
    const expectedAssetFunction = expectedDatasheet['pluscwodsinstr'][_SELECTED_ASSETFUNCTION];
    expect(app.state.assetFunctionsDetailsDS).not.toBeUndefined();
    expect(app.state.calpointsds).not.toBeUndefined();

    expect(app.state.assetFunctionsDetailsDS.items.length).toBeGreaterThan(0);
    expect(app.state.calpointsds.items.length).toBeGreaterThan(0);

    expect(ds.currentItem.pluscwodsid).toEqual(expectedDatasheet.pluscwodsid);
    expect(app.state.assetFunctionsDetailsDS.currentItem.pluscwodsinstrid).toEqual(expectedAssetFunction.pluscwodsinstrid);
  });

  it("Successfully loads and waits for datasource", async () => {
    const app = await baseSetup();

    const _SELECTED_DATASHEET = 0;
    const _SELECTED_ASSETFUNCTION = 0;

    app.state.selectedDatasheetIndex = _SELECTED_DATASHEET;
    app.state.selectedAssetFunctionsIndex = _SELECTED_ASSETFUNCTION;

    const ds = app.findDatasource("pluscWoDs");
    await ds.load();
    await ds.waitForChildrenToLoad();

    expect(ds.items.length).toBeGreaterThan(0);

    const expectedDatasheet = datasheetTestData.member[_SELECTED_DATASHEET];
    const expectedAssetFunction = expectedDatasheet['pluscwodsinstr'][_SELECTED_ASSETFUNCTION];
    expect(app.state.assetFunctionsDetailsDS).not.toBeUndefined();
    expect(app.state.calpointsds).not.toBeUndefined();

    expect(app.state.assetFunctionsDetailsDS.items.length).toBeGreaterThan(0);
    expect(app.state.calpointsds.items.length).toBeGreaterThan(0);

    expect(ds.currentItem.pluscwodsid).toEqual(expectedDatasheet.pluscwodsid);
    expect(app.state.assetFunctionsDetailsDS.currentItem.pluscwodsinstrid).toEqual(expectedAssetFunction.pluscwodsinstrid);
  });

  it("Does not update state datasources when selected indexes are invalid", async () => {
    const app = await baseSetup();

    const _SELECTED_DATASHEET = 10;
    const _SELECTED_ASSETFUNCTION = 10;

    app.state.selectedDatasheetIndex = _SELECTED_DATASHEET;
    app.state.selectedAssetFunctionsIndex = _SELECTED_ASSETFUNCTION;

    const ds = app.findDatasource("pluscWoDs");
    await ds.forceReloadAndWaitForChildren();

    expect(ds.items.length).toBeGreaterThan(0);

    expect(app.state.assetFunctionsDetailsDS).toBeUndefined();
    expect(app.state.calpointsds).toBeUndefined();
  });

});
