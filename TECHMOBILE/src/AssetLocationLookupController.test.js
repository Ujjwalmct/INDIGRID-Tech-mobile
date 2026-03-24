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

import AssetLocationLookupController from "./AssetLocationLookupController";
import {
  Application,
  Page,
  JSONDataAdapter,
  Datasource,
} from "@maximo/maximo-js-api";

import workorderitem from "./test/wo-detail-json-data.js";

describe("AssetLocationLookupController", () => {
  function newDatasource(
    data = workorderitem,
    name = "workOrderAttachmentResource"
  ) {
    const da = new JSONDataAdapter({
      src: workorderitem,
      items: "member",
    });

    const dsCreateWo = new Datasource(da, {
      idAttribute: "workOrderAttachmentResource",
      name: name,
    });

    return dsCreateWo;
  }

  it("Choose item from lookup", async () => {
    const controller = new AssetLocationLookupController();
    const app = new Application();
    const page = new Page({ name: "assetLookup" });
    app.registerController(controller);
    app.registerPage(page);

    const dsCreateWo = newDatasource(
      workorderitem,
      "workOrderAttachmentResource"
    );
    page.registerDatasource(dsCreateWo);

    await app.initialize();
    await dsCreateWo.load();
    controller.pageInitialized(page, app);
    let evt = {
      assetnum: "10001",
      description: "Test-material",
      asset: { manufacturer: "ATI", vendor: "PLUS" },
    };

    app.state.parentPage = "createwo";
    app.setCurrentPage("createwo");
    app.setCurrentPage("woedit");
    app.setCurrentPage("assetLookup");
    controller.chooseAssetItem(evt);
    expect(dsCreateWo.item.assetnum).toEqual("13120");
  });

  it("Choose item from lookup", async () => {
    const controller = new AssetLocationLookupController();
    const app = new Application();
    const page = new Page({ name: "assetLookup" });
    app.registerController(controller);
    app.registerPage(page);

    const dsCreateWo = newDatasource(
      workorderitem,
      "workOrderAttachmentResource"
    );
    page.registerDatasource(dsCreateWo);

    controller.app = app;
    controller.app.findPage = jest.fn(() => dsCreateWo);
    controller.app.setCurrentPage = jest.fn();
    controller.app.currentPage = {};
    controller.app.currentPage.callController = jest.fn();

    await app.initialize();
    await dsCreateWo.load();
    controller.pageInitialized(page, app);
    let evt = {
      assetnum: "10001",
      description: "Test-material",
      asset: { manufacturer: "ATI", vendor: "PLUS" },
    };

    app.state.parentPage = "createwo";
    app.setCurrentPage("createwo");
    app.setCurrentPage("woedit");
    app.setCurrentPage("assetLookup");
    controller.chooseAssetItem(evt);
    expect(dsCreateWo.item.assetnum).toEqual("13120");

    expect(controller.app.findPage).toHaveBeenCalled();
    expect(controller.app.setCurrentPage).toHaveBeenCalled();
    expect(controller.app.currentPage.callController).toHaveBeenCalled();
  });
});
