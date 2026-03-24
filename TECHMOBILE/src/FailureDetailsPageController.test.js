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

import FailureDetailsPageController from "./FailureDetailsPageController";
import {
  Application,
  Page,
  JSONDataAdapter,
  Datasource,
  Device,
} from "@maximo/maximo-js-api";
import sinon from "sinon";
import workorderitem from "./test/wo-failure-report-json-data";
import failurelist from "./test/failurelist-json-data";

function newWoDatasource(data = workorderitem, name = 'woDetailds') {
	const da = new JSONDataAdapter({
		src: workorderitem,
		items: 'member',
		schema: 'responseInfo.schema',
	});

	const ds = new Datasource(da, {
		idAttribute: 'wonum',
		name: name,
	});

	return ds;
}

function newDatasource(
  data = workorderitem,
  items = "member",
  idAttribute = "wonum",
  name = "woDetailsReportWork"
) {
  const da = new JSONDataAdapter({
    src: data,
    items: items,
    schema: "responseInfo.schema",
  });

  const ds = new Datasource(da, {
    idAttribute: idAttribute,
    name: name,
  });

  return ds;
}

const workorder = {
  _rowstamp: "21550310",
  workorderid: 166498,
  problem: {
    description: "Sticky Key",
    failurelist: {
      failurelist: 2138,
    },
  },
  failurecode: "HARDWARE",
  failurereport: [
    {
      _rowstamp: "21550311",
      type_maxvalue: "PROBLEM",
      localref:
        "http://localhost:9001/maximo/oslc/os/mxapiwodetail/_QkVERk9SRC9TQ1JBUF80/uxshowfailurereport/0-6173",
      failurecode: {
        description: "Sticky Key",
        failurelist: {
          type_maxvalue: "PROBLEM",
          type: "PROBLEM",
          type_description: "Problem",
          failurelist: 2138,
        },
      },
      $alias_this_attr$failurecode: "KEYSTICK",
      href: "http://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNjE3Mw--",
      type: "PROBLEM",
      type_description: "Problem",
      line_num: 2138,
    },
    {
      _rowstamp: "21550312",
      type_maxvalue: "CAUSE",
      localref:
        "http://localhost:9001/maximo/oslc/os/mxapiwodetail/_QkVERk9SRC9TQ1JBUF80/uxshowfailurereport/1-6178",
      failurecode: {
        description: "Worn Key",
        failurelist: {
          type_maxvalue: "CAUSE",
          type: "CAUSE",
          type_description: "Cause",
          failurelist: 2154,
        },
      },
      $alias_this_attr$failurecode: "WORNKEY",
      href: "http://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNjE3OA--",
      type: "CAUSE",
      type_description: "Cause",
      line_num: 2154,
    },
  ],
  failure: {
    description: "Hardware Failures",
    failurelist: {
      failurelist: 2136,
    },
  },
  problemcode: "KEYSTICK",
  siteid: "BEDFORD",
  href:
    "http://localhost:9001/maximo/oslc/os/mxapiwodetail/_QkVERk9SRC9TQ1JBUF80",
  faildate: "2020-10-22T11:38:20-04:00",
  orgid: "EAGLENA",
  wonum: "SCRAP_4",
  remarkdesc: "REMARK for workorder",
};
const workorder1 = {
  _rowstamp: "21550310",
  workorderid: 166498,
  problem: {
    description: "Sticky Key",
    failurelist: {
      failurelist: 2138,
    },
  },
  failurecode: "",
  failurereport: [],
  failure: {
    description: "Hardware Failures",
    failurelist: {
      failurelist: 2136,
    },
  },
  problemcode: "",
  siteid: "BEDFORD",
  href:
    "http://localhost:9001/maximo/oslc/os/mxapiwodetail/_QkVERk9SRC9TQ1JBUF80",
  faildate: "2020-10-22T11:38:20-04:00",
  orgid: "EAGLENA",
  wonum: "SCRAP_4",
  remarkdesc: "REMARK for workorder1",
};

 const workorder2 = {
  "iscalibration": false,
  "flowcontrolled": false,
  "failurereport": [
    {
      "_rowstamp": "2065173",
      "type_maxvalue": "PROBLEM",
      "localref": "oslc/os/mxapiwodetail/_QkVERk9SRC8xNDIx/uxshowfailurereport/0-5601",
      "failurecode": {
        "failurecode": "LEAK",
        "description": "Leaking"
      },
      "linenum": 1027,
      "href": "http://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNTYwMQ--",
      "type": "PROBLEM",
      "type_description": "Problem"
    },
    {
      "_rowstamp": "2065182",
      "type_maxvalue": "CAUSE",
      "localref": "oslc/os/mxapiwodetail/_QkVERk9SRC8xNDIx/uxshowfailurereport/1-5602",
      "failurecode": {
        "failurecode": "FITTING",
        "description": "Fitting Leaking"
      },
      "linenum": 1133,
      "href": "http://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNTYwMg--",
      "type": "CAUSE",
      "type_description": "Cause"
    },
    {
      "_rowstamp": "2065183",
      "type_maxvalue": "REMEDY",
      "localref": "oslc/os/mxapiwodetail/_QkVERk9SRC8xNDIx/uxshowfailurereport/2-5603",
      "failurecode": {
        "failurecode": "TIGHTFIT",
        "description": "Tighten Fitting"
      },
      "linenum": 1136,
      "href": "http://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNTYwMw--",
      "type": "REMEDY",
      "type_description": "Remedy"
    }
  ],
  "problemcode": "LEAK",
  "downprompt": "0",
  "faildate": "2024-08-20T15:07:06+05:30",
  "status_maxvalue": "APPR",
  "_rowstamp": "2065172",
  "problem": {
    "description": "Leaking",
    "failurelist": {
      "failurecode": "LEAK",
      "failurelist": 1143
    }
  },
  "istask": false,
  "siteid": "BEDFORD",
  "labtranstolerance": "0",
  "locationnum": "BR430",
  "href": "oslc/os/mxapiwodetail/_QkVERk9SRC8xNDIx",
  "assetnumber": "11430",
  "status_description": "Approved",
  "pluscqualtech": "0",
  "assetdesc": "Centrifugal Pump 100GPM/60FT HD",
  "orgid": "EAGLENA",
  "wonum": "1421",
  "workorderid": 133612,
  "failurecode": "PUMPS",
  "pluscvaltool": "0",
  "failure": {
    "description": "Pump Failures",
    "failurelist": {
      "failurelist": 1025
    }
  },
  "wogroup": "1421",
  "pluscwodscount": 0,
  "assetisrunning": true,
  "status": "APPR",
  "_bulkid": "133612"
}

const workorder3 = {
  "iscalibration": false,
  "flowcontrolled": false,
  "failurereport": [],
  "problemcode": "LEAK",
  "downprompt": "0",
  "faildate": "2024-08-20T15:07:06+05:30",
  "status_maxvalue": "APPR",
  "_rowstamp": "2065172",
  "problem": {
    "description": "Leaking",
    "failurelist": {
      "failurecode": "LEAK",
      "failurelist": 1143
    }
  },
  "istask": false,
  "siteid": "BEDFORD",
  "labtranstolerance": "0",
  "locationnum": "BR430",
  "href": "oslc/os/mxapiwodetail/_QkVERk9SRC8xNDIx",
  "assetnumber": "11430",
  "status_description": "Approved",
  "pluscqualtech": "0",
  "assetdesc": "Centrifugal Pump 100GPM/60FT HD",
  "orgid": "EAGLENA",
  "wonum": "1421",
  "workorderid": 133612,
  "failurecode": "",
  "pluscvaltool": "0",
  "failure": {
    "description": "Pump Failures",
    "failurelist": {
      "failurelist": 1025
    }
  },
  "wogroup": "1421",
  "pluscwodscount": 0,
  "assetisrunning": true,
  "status": "APPR",
  "_bulkid": "133612"
}

it("should load failure details data with failure report", async () => {
  const controller = new FailureDetailsPageController();
  const app = new Application();
  const page = new Page({ name: "failure-details" });
  const reportWorkPage = new Page({ name: "report_work" });

  app.registerController(controller);
  const woReportWorkDs = newDatasource(
    workorderitem,
    "member",
    "wonum",
    "woDetailsReportWork"
  );
  const failureLstDS = newDatasource(
    [],
    "",
    "failurelistid",
    "dsfailureDetailsList"
  );
  const dsFailureList = newDatasource(
    failurelist,
    "member",
    "failurelist",
    "dsFailureList"
  );
  dsFailureList.load();
  app.registerDatasource(dsFailureList);

  let loadStubFailureLstDS = sinon.stub(failureLstDS, "load").callThrough();
  let clearSelStubFailureLstDS = sinon
    .stub(failureLstDS, "clearSelections")
    .callThrough();
  page.registerDatasource(failureLstDS);

  reportWorkPage.registerDatasource(woReportWorkDs);
  await woReportWorkDs.load();

  app.registerPage(page);
  app.registerPage(reportWorkPage);

  await app.initialize();
  controller.pageInitialized(page, app);
  page.woDetailsReportWorkDS = woReportWorkDs;
  page.params.workorder = workorder;
  await controller.loadRecord();

  expect(page.state.failureListArr.length).toEqual(5);
  expect(page.state.failureRemark).toEqual("REMARK for workorder");
  expect(page.state.failureRemarkMaxLength).toEqual(30);
  expect(loadStubFailureLstDS.called).toBe(true);
  expect(clearSelStubFailureLstDS.called).toBe(true);

  await controller.loadRecord();
  expect(page.state.failureListArr.length).toEqual(5);

  page.params.workorder = workorder1;
  await controller.loadRecord();
  expect(page.state.failureListArr.length).toEqual(5);
  expect(page.state.failureRemark).toEqual("REMARK for workorder1");
  expect(page.state.failureRemarkMaxLength).toEqual(30);
});

it("should load failure details data with failure report in container mode", async () => {
  const controller = new FailureDetailsPageController();
  const app = new Application();
  const page = new Page({ name: "failure-details" });
  const reportWorkPage = new Page({ name: "report_work" });

  app.registerController(controller);
  const woReportWorkDs = newDatasource(
    workorderitem,
    "member",
    "wonum",
    "woDetailsReportWork"
  );

  const failureLstDS = newDatasource(
    [],
    "",
    "failurelistid",
    "dsfailureDetailsList"
  );
  const dsFailureList = newDatasource(
    failurelist,
    "member",
    "failurelist",
    "dsFailureList"
  );
  dsFailureList.load();
  app.registerDatasource(dsFailureList);

  let loadStubFailureLstDS = sinon.stub(failureLstDS, "load").callThrough();
  let clearSelStubFailureLstDS = sinon
    .stub(failureLstDS, "clearSelections")
    .callThrough();
  page.registerDatasource(failureLstDS);

  reportWorkPage.registerDatasource(woReportWorkDs);
  await woReportWorkDs.load();

  app.registerPage(page);
  app.registerPage(reportWorkPage);

  await app.initialize();
  Device.get().isMaximoMobile = true;
  controller.pageInitialized(page, app);

  page.woDetailsReportWorkDS = woReportWorkDs;
  page.params.workorder = workorder;
  await controller.loadRecord();
  expect(page.state.failureListArr.length).toEqual(5);
  expect(page.state.failureRemark).toEqual("REMARK for workorder");
  expect(page.state.failureRemarkMaxLength).toEqual(30);
  expect(loadStubFailureLstDS.called).toBe(true);
  expect(clearSelStubFailureLstDS.called).toBe(true);

  page.params.workorder.problemdelete = true;
  await controller.loadRecord();
  expect(page.state.failureListArr[1].readonly).toEqual(false);
  expect(page.state.failureListArr[2].readonly).toEqual(true);
  expect(page.state.failureListArr[3].readonly).toEqual(true);
  expect(page.state.failureListArr.length).toEqual(5);
  Device.get().isMaximoMobile = false;
});

it("should openFailureList failure list", async () => {
  const controller = new FailureDetailsPageController();
  const app = new Application();
  const page = new Page({ name: "failure-details" });
  const page1 = new Page({ name: "report_work" });
  let workorder = { wonum: "SCRAP_4", siteid: "BEDFORD", orgid: "EAGLENA" };
  let eventItem = {
    item: {
      title: "Problem",
      failurecode: "HARDWARE",
      description: "Hardware Failures",
      failurelistid: 0,
      failurelist: 2136,
      type: "FAILURECLASS",
      orgid: "EAGLENA",
      href: "http://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNjE3Mw--",
      readonly: false,
      _bulkid: "1",
    },
  };
  let eventItem1 = {
    item: {
      title: "Problem",
      failurecode: "KEYSTICK",
      description: "Sticky Key",
      failurelistid: 1,
      failurelist: 2138,
      type: "PROBLEM",
      orgid: "EAGLENA",
      parent: 2136,
      href: "http://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNjE3Mw--",
      readonly: false,
      _bulkid: "1",
    },
    "index": 1,
  };
  let eventItem2 = {
    item: {
      "title": "Details",
      "failurelistid": 4,
      "failurelist": "",
      "type": "Details",
      "type_description": "Details",
      "type_maxvalue": "Details",
      "failurecode": "",
      "description": "",
      "orgid": "EAGLENA",
      "parent": 1055,
      "readonly": false,
      "isLoading": false,
      "_bulkid": "4"
    },
    "index": 4,
    "noViewChange": false
  }

  const woReportWorkDs = newDatasource(
    workorderitem,
    "member",
    "wonum",
    "woDetailsReportWork"
  );

  page.state = { workorder: workorder };
  app.registerController(controller);

  const failureLstDS = newDatasource(
    [],
    "member",
    "wonum",
    "dsfailureDetailsList"
  );
  const dsFailureList = newDatasource(
    failurelist,
    "member",
    "failurelist",
    "dsFailureList"
  );
  await dsFailureList.load();
  app.registerDatasource(dsFailureList);
  page.registerDatasource(failureLstDS);
  await failureLstDS.load();

  page.woDetailsReportWorkDS = woReportWorkDs;
  page.params.workorder = workorder;

  app.registerPage(page);
  app.registerPage(page1);

  await app.initialize();

  let sarchQBEStubFailureList = sinon
    .stub(dsFailureList, "searchQBE")
    .callThrough();

  controller.pageInitialized(page, app);


  page.state.isFailureSaved = false;
  page.state.isfailurelistloaded = false;
  page.state.failureInprogressCount = 2
  await controller.openFailureList(eventItem2);
  expect(sarchQBEStubFailureList.called).toBe(false);

  page.state.isFailureSaved = true; 
  await controller.openFailureList(eventItem);
  expect(sarchQBEStubFailureList.called).toBe(true);

  await controller.openFailureList(eventItem1);
  expect(dsFailureList.items.length).not.toEqual(0);
});

it("delete failure list", async () => {
  const controller = new FailureDetailsPageController();
  const app = new Application();
  const page = new Page({ name: "failure-details" });
  let delEvent = {
    index: 2,
    item: {
      title: "Cause",
      failurecode: "WRONGPRI",
      description: "Wrong Network Printer Specified",
      failurelistid: 2,
      failurelist: 2288,
      type: "CAUSE",
      orgid: "EAGLENA",
      parent: 2286,
      href: "http://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNjE5NA--",
      readonly: false,
      _bulkid: "2",
    },
  };
  app.registerController(controller);
  let failLisArray = [
    {
      title: "Failure class",
      failurecode: "PRINTER",
      description: "Printer Issues",
      failurelistid: 0,
      failurelist: 2284,
      type: "FAILURECLASS",
      parent: "",
      orgid: "EAGLENA",
      readonly: false,
      href: "oslc/os/mxapiwodetail/_QkVERk9SRC9TQ1JBUF80",
      _bulkid: "0",
    },
    {
      title: "Problem",
      failurecode: "NOPRINT",
      description: "Print Job Not Printing",
      failurelistid: 1,
      failurelist: 2286,
      type: "PROBLEM",
      orgid: "EAGLENA",
      parent: 2284,
      href: "http://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNjE5Mw--",
      readonly: false,
      _bulkid: "1",
    },
    {
      title: "Cause",
      failurecode: "WRONGPRI",
      description: "Wrong Network Printer Specified",
      failurelistid: 2,
      failurelist: 2288,
      type: "CAUSE",
      orgid: "EAGLENA",
      parent: 2286,
      href: "http://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNjE5OA--",
      readonly: false,
      _bulkid: "2",
    },
    {
      title: "Remedy",
      failurecode: "SPECLOC",
      description: "Specify Local Printer",
      failurelistid: 3,
      failurelist: 2302,
      type: "REMEDY",
      orgid: "EAGLENA",
      parent: 2288,
      href: "http://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNjE5OQ--",
      readonly: false,
      _bulkid: "3",
    },
    {
      title: "Details",
      failurecode: "",
      description: "",
      failurelistid: 4,
      failurelist: "",
      type: "",
      orgid: "",
      parent: "",
      href: "",
      readonly: false,
      _bulkid: "4",
    },
  ];
  let workorder = { wonum: "SCRAP_4", siteid: "BEDFORD", orgid: "EAGLENA" };
  const failureLstDS = newDatasource(
    [],
    "",
    "failurelistid",
    "dsfailureDetailsList"
  );
  const woReportWorkDs = newDatasource(
    workorderitem,
    "member",
    "wonum",
    "woDetailsReportWork"
  );
  const failureListDS = newDatasource(
    failurelist,
    "member",
    "failurelist",
    "dsFailureList"
  );
  const woDetailsds = newDatasource(
    workorderitem, "woDetailds"
  );
  let updatestub = sinon.stub(woReportWorkDs, "update");
  let loadstub = sinon.stub(failureLstDS, "load").callThrough();

  page.registerDatasource(failureLstDS);
  app.registerDatasource(failureListDS);
  app.registerDatasource(woDetailsds);
  app.registerPage(page);

  await woDetailsds.load();
  page.params.workorder = workorder;
  app.datasources['woDetailds'] = woDetailsds;

  page.state.failureListArr = failLisArray;
  page.woDetailsReportWorkDS = woReportWorkDs;
  page.state.deletFailReportList = [];

  await app.initialize();

  controller.pageInitialized(page, app);
  await controller.deleteFailureList(delEvent);

  expect(loadstub.called).toBe(true);
  expect(updatestub.called).toBe(true);
});

it("updateAndSave failure list", async () => {
  const controller = new FailureDetailsPageController();
  const app = new Application();
  const page = new Page({ name: "failure-details" });
  let updateEvent = {
    item: {
      parent: 2286,
      _rowstamp: "80319",
      failurelistid: 2,
      type_maxvalue: "CAUSE",
      failurecode: {
        failurecode: "WRONGPRI",
        description: "Wrong Network Printer Specified",
      },
      $alias_this_attr$failurecode: "WRONGPRI",
      href: "oslc/os/mxapifailurelist/_MjI4OC9FQUdMRU5B",
      type: "CAUSE",
      orgid: "EAGLENA",
      type_description: "Cause",
      failurelist: 2288,
      _bulkid: "2288",
    },
    "index": 2,
  };
  app.registerController(controller);
  let failLisArray = [
    {
      title: "Failure class",
      failurecode: "PRINTER",
      description: "Printer Issues",
      failurelistid: 0,
      failurelist: 2284,
      type: "FAILURECLASS",
      parent: "",
      orgid: "EAGLENA",
      readonly: false,
      href: "oslc/os/mxapiwodetail/_QkVERk9SRC9TQ1JBUF80",
      _bulkid: "0",
    },
    {
      title: "Problem",
      failurecode: "NOPRINT",
      description: "Print Job Not Printing",
      failurelistid: 1,
      failurelist: 2286,
      type: "PROBLEM",
      orgid: "EAGLENA",
      parent: 2284,
      href: "http://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNjE5Mw--",
      readonly: false,
      _bulkid: "1",
    },
    {
      title: "Cause",
      failurecode: "WRONGPRI",
      description: "Wrong Network Printer Specified",
      failurelistid: 2,
      failurelist: 2288,
      type: "CAUSE",
      orgid: "EAGLENA",
      parent: 2286,
      href: "http://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNjE5OA--",
      readonly: false,
      _bulkid: "2",
    },
    {
      title: "Remedy",
      failurecode: "SPECLOC",
      description: "Specify Local Printer",
      failurelistid: 3,
      failurelist: 2302,
      type: "REMEDY",
      orgid: "EAGLENA",
      parent: 2288,
      href: "http://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNjE5OQ--",
      readonly: false,
      _bulkid: "3",
    },
    {
      title: "Details",
      failurecode: "",
      description: "",
      failurelistid: 4,
      failurelist: "",
      type: "",
      orgid: "",
      parent: "",
      href: "",
      readonly: false,
      _bulkid: "4",
    },
  ];
  // FailList < 4
  let failLisArray1 = [
    {
      title: "Failure class",
      failurecode: "PRINTER",
      description: "Printer Issues",
      failurelistid: 0,
      failurelist: 2284,
      type: "FAILURECLASS",
      parent: "",
      orgid: "EAGLENA",
      readonly: false,
      href: "oslc/os/mxapiwodetail/_QkVERk9SRC9TQ1JBUF80",
      _bulkid: "0",
    },
    {
      title: "Problem",
      failurecode: "NOPRINT",
      description: "Print Job Not Printing",
      failurelistid: 1,
      failurelist: 2286,
      type: "PROBLEM",
      orgid: "EAGLENA",
      parent: 2284,
      href: "http://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNjE5Mw--",
      readonly: false,
      _bulkid: "1",
    },
    {
      title: "Cause",
      failurecode: "WRONGPRI",
      description: "Wrong Network Printer Specified",
      failurelistid: 2,
      failurelist: 2288,
      type: "CAUSE",
      orgid: "EAGLENA",
      parent: 2286,
      href: "http://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNjE5OA--",
      readonly: false,
      _bulkid: "2",
    },
    {
      title: "Remedy",
      failurecode: "SPECLOC",
      description: "Specify Local Printer",
      failurelistid: 3,
      failurelist: 2302,
      type: "REMEDY",
      orgid: "EAGLENA",
      parent: 2288,
      href: "http://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNjE5OQ--",
      readonly: false,
      _bulkid: "3",
    },
    {
      title: "Details",
      failurecode: "",
      description: "",
      failurelistid: 4,
      failurelist: "",
      type: "",
      orgid: "",
      parent: "",
      href: "",
      readonly: false,
      _bulkid: "4",
    },
  ];
  let workorder = { wonum: "SCRAP_4", siteid: "BEDFORD", orgid: "EAGLENA" };
  const failureLstDS = newDatasource(
    [],
    "",
    "failurelistid",
    "dsfailureDetailsList"
  );
  const woReportWorkDs = newDatasource(
    workorderitem,
    "member",
    "wonum",
    "woDetailsReportWork"
  );
  const dsFailureList = newDatasource(
    failurelist,
    "member",
    "failurelist",
    "dsFailureList"
  );
  const woDetailsds = newDatasource(
    workorderitem, "woDetailds"
  );

  let updatestub = sinon.stub(woReportWorkDs, "update");
  let loadStubDsfailureDetailsList = sinon
    .stub(failureLstDS, "load")
    .callThrough();
  let saveStub = sinon.stub(controller,"_saveFailureReport").returns(true); 

  page.registerDatasource(failureLstDS);
  app.registerDatasource(dsFailureList);
  app.registerDatasource(woDetailsds);
  app.registerPage(page);

  await woDetailsds.load();

  page.params.workorder = workorder;
  app.datasources['woDetailds'] = woDetailsds;

  page.state.failureListArr = failLisArray;
  page.state.listLoading = false;
  page.woDetailsReportWorkDS = woReportWorkDs;
  page.state.selectedFailCode = {
    item: {
      title: "Cause",
      failurelistid: 3,
      failurelist: "",
      type: "CAUSE",
      failurecode: "",
      description: "",
      orgid: "EAGLENA",
      parent: 2286,
      readonly: false,
      _bulkid: "2",
    },
  };
  page.state.deletFailReportList = [];

  await app.initialize();

  controller.pageInitialized(page, app);
  page.state.failureListArr = failLisArray1;

  await controller.updateAndSaveFailureList(updateEvent);
  expect(page.state.listLoading).toBe(false);
  expect(saveStub.called).toBe(true);

  saveStub.restore();
  
  await controller.updateAndSaveFailureList(updateEvent);
  expect(page.state.listLoading).toBe(false);
  expect(updatestub.called).toBe(true);
  expect(loadStubDsfailureDetailsList.called).toBe(true);

  page.state.listLoading = true;

  let result = await controller.updateAndSaveFailureList(updateEvent);
  expect(result).toBeUndefined();
  expect(page.state.listloading).toBeFalsy();
});

it("done failure list", async () => {
  const controller = new FailureDetailsPageController();
  const app = new Application();
  const page = new Page({ name: "failure-details" });
  const page1 = new Page({ name: "report_work" });
  const woReportWorkDs = newDatasource(
    workorderitem,
    "member",
    "wonum",
    "woDetailsReportWork"
  );
  const woDetailsReportWorks = newDatasource(
    workorderitem,
    "member",
    "wonum",
    "woDetailsReportWorks"
  );
  let workorder = { wonum: "SCRAP_4", siteid: "BEDFORD", orgid: "EAGLENA" };

  app.registerController(controller);

  const dsFailureList = newDatasource(
    failurelist,
    "member",
    "failurelist",
    "dsFailureList"
  );
  const woDetailsds = newDatasource(
    workorderitem, "woDetailds"
  );

  page.registerDatasource(woDetailsReportWorks);
  app.registerDatasource(dsFailureList);
  app.registerDatasource(woDetailsds);
  app.registerPage(page);
  app.registerPage(page1);

  await woDetailsds.load();

  page.woDetailsReportWorkDS = woReportWorkDs;
  page.params.workorder = workorder;

  app.datasources['woDetailds'] = woDetailsds;

  await app.initialize();

  controller.pageInitialized(page, app);
  await controller.doneFailureEdit();
  expect(page1.state.navigateToReportWork).toBeTruthy();
  expect(woDetailsds.items.length).toBeGreaterThan(0);
  expect(woDetailsds.item).toBeTruthy();
});

it("setRemarks set remark", async () => {
  const controller = new FailureDetailsPageController();
  const app = new Application();
  const page = new Page({ name: "failure-details" });
  const page1 = new Page({ name: "report_work" });

  const failureLstDS = newDatasource(
    [,,,,],
    "",
    "failurelistid",
    "dsfailureDetailsList"
  );

  const woReportWorkDs = newDatasource(
    workorderitem,
    "member",
    "wonum",
    "woDetailsReportWork"
  );
  const newRemarkValue = "new remark for workorder";
  let workorder = { wonum: "SCRAP_4", siteid: "BEDFORD", orgid: "EAGLENA" };

  app.registerController(controller);

  const dsFailureList = newDatasource(
    failurelist,
    "member",
    "failurelist",
    "dsFailureList"
  );
  page.registerDatasource(failureLstDS);
  app.registerDatasource(dsFailureList);
  app.registerPage(page);
  app.registerPage(page1);

  page.woDetailsReportWorkDS = woReportWorkDs;
  page.params.workorder = workorder;

  await app.initialize();

  controller.pageInitialized(page, app);
  controller.setRemarks({
    currentTarget: {
      value: newRemarkValue,
    },
  });

  expect(page.state.failureRemark).toEqual(newRemarkValue);

  await controller.editFailureDate();
  expect(page.state.splitViewIndex).toBe(++ failureLstDS.items.length);
});

it("saveRemark save remark", async () => {
  const controller = new FailureDetailsPageController();
  const app = new Application();
  const page = new Page({ name: "failure-details" });
  const page1 = new Page({ name: "report_work" });
  const newRemarkValue = "new remark for workorder\n";
  const woReportWorkDs = newDatasource(
    workorderitem,
    "member",
    "wonum",
    "woDetailsReportWork"
  );
  let workorder = { wonum: "SCRAP_4", siteid: "BEDFORD", orgid: "EAGLENA" };
  let updatestub = sinon.stub(woReportWorkDs, "update");
  app.registerController(controller);

  const dsFailureList = newDatasource(
    failurelist,
    "member",
    "failurelist",
    "dsFailureList"
  );
  app.registerDatasource(dsFailureList);
  app.registerPage(page);
  app.registerPage(page1);

  page.woDetailsReportWorkDS = woReportWorkDs;
  page.params.workorder = workorder;

  await app.initialize();

  controller.pageInitialized(page, app);

  controller.setRemarks({
    currentTarget: {
      value: newRemarkValue,
    },
  });

  await controller.saveRemarks();
  expect(updatestub.called).toBe(true);
});

it("saveRemark saves when wonum is empty in offline mode",async () => {
  const controller = new FailureDetailsPageController();
  const app = new Application();
  const page = new Page({ name: "failure-details" });
  const page1 = new Page({ name: "report_work" });
  const newRemarkValue = "new remark for workorder";
  const woReportWorkDs = newDatasource(
    workorderitem,
    "member",
    "wonum",
    "woDetailsReportWork"
  );
  let workorder = { wonum: "", siteid: "BEDFORD", orgid: "EAGLENA" };
  let updatestub = sinon.stub(woReportWorkDs, "update");

  app.registerController(controller);

  const dsFailureList = newDatasource(
    failurelist,
    "member",
    "failurelist",
    "dsFailureList"
  );
  app.registerDatasource(dsFailureList);
  app.registerPage(page);
  app.registerPage(page1);

  page.woDetailsReportWorkDS = woReportWorkDs;
  page.params.workorder = workorder;
  await app.initialize();
  controller.pageInitialized(page, app);
  controller.setRemarks({
    currentTarget: {
      value: newRemarkValue,
    },
  });

  await controller.saveRemarks();
  expect(updatestub.called).toBe(true);
});

it("setLongDesc set Long Desc", async () => {
  const controller = new FailureDetailsPageController();
  const app = new Application();
  const page = new Page({ name: "failure-details" });
  const page1 = new Page({ name: "report_work" });
  const woReportWorkDs = newDatasource(
    workorderitem,
    "member",
    "wonum",
    "woDetailsReportWork"
  );
  const newLongDescValue = "Long desc for workorder";
  let workorder = { wonum: "SCRAP_4", siteid: "BEDFORD", orgid: "EAGLENA" };

  app.registerController(controller);

  const dsFailureList = newDatasource(
    failurelist,
    "member",
    "failurelist",
    "dsFailureList"
  );
  app.registerDatasource(dsFailureList);
  app.registerPage(page);
  app.registerPage(page1);

  page.woDetailsReportWorkDS = woReportWorkDs;
  page.params.workorder = workorder;

  await app.initialize();

  controller.pageInitialized(page, app);
  controller.setLongDesc({
    currentTarget: {
      value: newLongDescValue,
    },
  });

  expect(page.state.failureRemarkLongDesc).toEqual(newLongDescValue);
});

it("saveLongDesc to save long description", async () => {
  const controller = new FailureDetailsPageController();
  const app = new Application();
  const page = new Page({ name: "failure-details" });
  const page1 = new Page({ name: "report_work" });
  const newLongDescValue = "Long desc for workorder\n";
  const woReportWorkDs = newDatasource(
    workorderitem,
    "member",
    "wonum",
    "woDetailsReportWork"
  );
  let workorder = { wonum: "SCRAP_4", siteid: "BEDFORD", orgid: "EAGLENA" };
  let updatestub = sinon.stub(woReportWorkDs, "update");
  app.registerController(controller);

  const dsFailureList = newDatasource(
    failurelist,
    "member",
    "failurelist",
    "dsFailureList"
  );
  app.registerDatasource(dsFailureList);
  app.registerPage(page);
  app.registerPage(page1);

  page.woDetailsReportWorkDS = woReportWorkDs;
  page.params.workorder = workorder;

  await app.initialize();

  controller.pageInitialized(page, app);

  controller.setLongDesc({
    currentTarget: {
      value: newLongDescValue,
    },
  });

  await controller.saveLongDesc();
  expect(updatestub.called).toBe(true);
});

it("saveLongDesc to save long description when wonum is empty in offline mode", async () => {
  const controller = new FailureDetailsPageController();
  const app = new Application();
  const page = new Page({ name: "failure-details" });
  const page1 = new Page({ name: "report_work" });
  const newLongDescValue = "Long desc for workorder\n";
  const woReportWorkDs = newDatasource(
    workorderitem,
    "member",
    "wonum",
    "woDetailsReportWork"
  );
  let workorder = { wonum: "", siteid: "BEDFORD", orgid: "EAGLENA" };
  let updatestub = sinon.stub(woReportWorkDs, "update");

  app.registerController(controller);

  const dsFailureList = newDatasource(
    failurelist,
    "member",
    "failurelist",
    "dsFailureList"
  );
  app.registerDatasource(dsFailureList);
  app.registerPage(page);
  app.registerPage(page1);

  page.woDetailsReportWorkDS = woReportWorkDs;
  page.params.workorder = workorder;

  await app.initialize();

  controller.pageInitialized(page, app);
  controller.setLongDesc({
    currentTarget: {
      value: newLongDescValue,
    },
  });

  await controller.saveLongDesc();
  expect(updatestub.called).toBe(true);
});

it("_saveFailureReport to check the cause type", async () => {
  const controller = new FailureDetailsPageController();
  const app = new Application();
  const page = new Page({ name: "failureDetails" });
  const page1 = new Page({ name: "report_work" });
  const causereq = 
    {
      "description": "Breaker Tripped",
      "failurecode": "BREAKTRP",
      "failurelist": 1086,
      "failurelistid": 2,
      "isLoading": false,
      "orgid": "EAGLENA",
      "parent": 1073,
      "readonly": false,
      "title": "Cause",
      "type": "CAUSE",
      "type_description": "Cause",
      "type_maxvalue": "CAUSE",
      "_bulkid": "BREAKTRP"
    };
  
   let failLisArray = [
    {
      title: "Failure class",
      failurecode: "PRINTER",
      description: "Printer Issues",
      failurelistid: 0,
      failurelist: 2284,
      type: "FAILURECLASS",
      parent: "",
      orgid: "EAGLENA",
      readonly: false,
      href: "oslc/os/mxapiwodetail/_QkVERk9SRC9TQ1JBUF80",
      _bulkid: "0",
    },
    {
      title: "Problem",
      failurecode: "NOPRINT",
      description: "Print Job Not Printing",
      failurelistid: 1,
      failurelist: 2286,
      type: "PROBLEM",
      orgid: "EAGLENA",
      parent: 2284,
      href: "http://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNjE5Mw--",
      readonly: false,
      _bulkid: "1",
    },
    {
      title: "Cause",
      failurecode: "WRONGPRI",
      description: "Wrong Network Printer Specified",
      failurelistid: 2,
      failurelist: 2288,
      type: "CAUSE",
      orgid: "EAGLENA",
      parent: 2286,
      href: "http://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNjE5OA--",
      readonly: false,
      _bulkid: "2",
    },
    {
      title: "Remedy",
      failurecode: "SPECLOC",
      description: "Specify Local Printer",
      failurelistid: 3,
      failurelist: 2302,
      type: "REMEDY",
      orgid: "EAGLENA",
      parent: 2288,
      href: "http://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNjE5OQ--",
      readonly: false,
      _bulkid: "3",
    },
    {
      title: "Details",
      failurecode: "",
      description: "",
      failurelistid: 4,
      failurelist: "",
      type: "",
      orgid: "",
      parent: "",
      href: "",
      readonly: false,
      _bulkid: "4",
    },
  ];

  const woReportWorkDs = newDatasource(
    workorderitem,
    "member",
    "wonum",
    "woDetailsReportWork"
  );

  app.registerController(controller);

  const dsFailureList = newDatasource(
    failurelist,
    "member",
    "failurelist",
    "dsFailureList"
  );
  
  const woDetailDS = newWoDatasource(workorderitem, 'woDetailds');    
  app.registerDatasource(dsFailureList);
  app.registerDatasource(woDetailDS);
  app.registerDatasource(woReportWorkDs);
  app.registerPage(page);
  app.registerPage(page1);

  page.woDetailsReportWorkDS = woReportWorkDs;
  page.woDetailds = woDetailDS;
  page.params.workorder = workorder;
  page.state.failureListArr = failLisArray
  await app.initialize();
  
  const updateStub = sinon.spy(woReportWorkDs, 'update');
  const forceReloadStub = sinon.spy(woReportWorkDs, 'forceReload');


  controller.pageInitialized(page, app);

  let result = await controller._saveFailureReport(causereq);
  expect(updateStub.calledOnce).toBe(true); 
  expect(forceReloadStub.calledOnce).toBe(true);
  expect(result).toBeUndefined();

})

it("_saveFailureReport to check the failure class", async () => {
  const controller = new FailureDetailsPageController();
  const app = new Application();
  const page = new Page({ name: "failureDetails" });
  const page1 = new Page({ name: "report_work" });
  
    const failurereq = 
    {
        "description": "Failure Code Class 0A7IV",
        "failurecode": "0A7IV",
        "failurelist": [
            3986
        ],
        "failurelistid": 0,
        "href": "",
        "isLoading": false,
        "orgid": "EAGLENA",
        "title": "Failure class",
        "type": "FAILURECLASS",
        "type_description": "Failure class",
        "type_maxvalue": "FAILURECLASS",
        "_bulkid": "0A7IV"
    }
  

  const woReportWorkDs = newDatasource(
    workorderitem,
    "member",
    "wonum",
    "woDetailsReportWork"
  );

  app.registerController(controller);

  const dsFailureList = newDatasource(
    failurelist,
    "member",
    "failurelist",
    "dsFailureList"
  );
  
  const woDetailDS = newWoDatasource(workorderitem, 'woDetailds');    
  app.registerDatasource(dsFailureList);
  app.registerDatasource(woDetailDS);
  app.registerDatasource(woReportWorkDs);
  app.registerPage(page);
  app.registerPage(page1);

  page.woDetailsReportWorkDS = woReportWorkDs;
  page.woDetailds = woDetailDS;
  page.params.workorder = workorder;
  await app.initialize();
  
  const updateStub = sinon.spy(woReportWorkDs, 'update');
  const forceReloadStub = sinon.spy(woReportWorkDs, 'forceReload');

  controller.pageInitialized(page, app);

  let result = await controller._saveFailureReport(failurereq);
  expect(page.state.failureInprogressCount).toEqual(0);
  expect(updateStub.calledOnce).toBe(true);
  expect(page.state.isFailureSaved).toBeTruthy();
  expect(forceReloadStub.notCalled).toBe(true);
  expect(result).toBeUndefined();

})

it("should create failure List", async () => {
  const controller = new FailureDetailsPageController();
  const app = new Application();
  const page = new Page({ name: "failure-details" });
  const reportWorkPage = new Page({ name: "report_work" });

  app.registerController(controller);
  const woReportWorkDs = newDatasource(
    workorderitem,
    "member",
    "wonum",
    "woDetailsReportWork"
  );

  const dsFailureList = newDatasource(
    failurelist,
    "member",
    "failurelist",
    "dsFailureList"
  );
  dsFailureList.load();
  app.registerDatasource(dsFailureList);


  await woReportWorkDs.load();

  app.registerPage(page);
  app.registerPage(reportWorkPage);

  await app.initialize();
  controller.pageInitialized(page, app);
  page.woDetailsReportWorkDS = woReportWorkDs;
  page.params.workorder = workorder2;
  const placeHolderValues = [{ title: 'Failure class', type: 'FAILURECLASS', type_maxvalue: 'FAILURECLASS' },
  { title: 'Problem', type: 'PROBLEM', type_maxvalue: 'PROBLEM' },
  { title: 'Cause', type: 'CAUSE', type_maxvalue: 'CAUSE' },
  { title: 'Remedy', type: 'REMEDY', type_maxvalue: 'REMEDY' },
  { title: 'Details', type: 'Details', type_maxvalue: 'Details' }
  ];
  const failureListArr = await controller.failureListCreation(workorder2, placeHolderValues);
  expect(failureListArr.length).not.toBe(0);
});

it("should check if no workorder array data", async () => {
  const controller = new FailureDetailsPageController();
  const app = new Application();
  const page = new Page({ name: "failure-details" });
  const reportWorkPage = new Page({ name: "report_work" });

  app.registerController(controller);
  const woReportWorkDs = newDatasource(
    workorderitem,
    "member",
    "wonum",
    "woDetailsReportWork"
  );

  const dsFailureList = newDatasource(
    failurelist,
    "member",
    "failurelist",
    "dsFailureList"
  );
  dsFailureList.load();
  app.registerDatasource(dsFailureList);


  await woReportWorkDs.load();

  app.registerPage(page);
  app.registerPage(reportWorkPage);

  await app.initialize();
  controller.pageInitialized(page, app);
  page.woDetailsReportWorkDS = woReportWorkDs;
  page.params.workorder = workorder3;
  const placeHolderValues = [{ title: 'Failure ', type: 'FAILURECLASS', type_maxvalue: 'FAILURECLASS' },
  { title: 'Problem', type: 'PROBLEM', type_maxvalue: 'PROBLEM' },
  { title: 'Cause', type: 'CAUSE', type_maxvalue: 'CAUSE' },
  { title: 'Remedy', type: 'REMEDY', type_maxvalue: 'REMEDY' },
  { title: 'Details', type: 'Details', type_maxvalue: 'Details' }
  ];
  const failureListArr = await controller.failureListCreation(workorder3, placeHolderValues);
  expect(workorder3.failurecode.length).toBe(0);
  expect(failureListArr.length).not.toBe(0); 
});


it("should return deletable failure report objects based on the provided type_maxvalue", async () => {
  const controller = new FailureDetailsPageController();
  const app = new Application();
  const page = new Page({ name: "failure-details" });

  const woReportData = {
    member: [
      {
        _rowstamp: "22801400",
        workorderid: 774,
        failurereport: [
          {
            _rowstamp: "22801401",
            type_maxvalue: "PROBLEM",
            linenum: 1005,
            href: "https://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNTUyMQ--",
            type: "PROBLEM",
          },
          {
            _rowstamp: "22801404",
            type_maxvalue: "CAUSE",
            linenum: 1011,
            href: "https://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNTUyMg--",
            type: "CAUSE",
          },
          {
            _rowstamp: "22801405",
            type_maxvalue: "REMEDY",
            linenum: 1015,
            href: "https://childkey#V09SS09SREVSL0ZBSUxVUkVSRVBPUlQvNTUyMw--",
            type: "REMEDY",
          },
        ],
      },
    ],
  }
  const woReportWorkDs = newDatasource(
    woReportData,
    "member",
    "wonum",
    "woDetailsReportWork"
  );
  app.registerController(controller);
  app.registerPage(page);
  await woReportWorkDs.load();
  page.woDetailsReportWorkDS = woReportWorkDs;
  await app.initialize();
  controller.pageInitialized(page, app);
  let type_maxvalue = 'FAILURECLASS'
  let result = await controller.getDeletableObject(type_maxvalue);
  expect(result.length).toBe(3);

  type_maxvalue = 'PROBLEM'
  result = await controller.getDeletableObject(type_maxvalue);
  expect(result.length).toBe(3);

  type_maxvalue = 'CAUSE'
  result = await controller.getDeletableObject(type_maxvalue);
  expect(result.length).toBe(2);

  type_maxvalue = 'REMEDY'
  result = await controller.getDeletableObject(type_maxvalue);
  expect(result.length).toBe(1); 
});

describe("pagePaused lifecycle method", () => {

  it("should clear selections when page is paused", async () => {
    const controller = new FailureDetailsPageController();
    const app = new Application();
    const page = new Page({ name: "failure-details" });

    const failureLstDS = newDatasource(
      [],
      "",
      "failurelistid",
      "dsfailureDetailsList"
    );

    const clearSelectionsSpy = sinon.spy(failureLstDS, 'clearSelections');

    page.registerDatasource(failureLstDS);
    app.registerPage(page);
    await app.initialize();

    controller.pageInitialized(page, app);
    controller.pagePaused();

    expect(clearSelectionsSpy.called).toBe(true);
    expect(clearSelectionsSpy.calledOnce).toBe(true);
  });

  it("should call clearSelections on datasource when page is paused", async () => {
    const controller = new FailureDetailsPageController();
    const app = new Application();
    const page = new Page({ name: "failure-details" });

    const failureLstDS = newDatasource(
      [
        { failurelistid: 0, _selected: true },
        { failurelistid: 1, _selected: true }
      ],
      "",
      "failurelistid",
      "dsfailureDetailsList"
    );

    const clearSelectionsSpy = sinon.spy(failureLstDS, 'clearSelections');

    await failureLstDS.load();
    page.registerDatasource(failureLstDS);
    app.registerPage(page);
    await app.initialize();

    controller.pageInitialized(page, app);
    controller.pagePaused();

    // Verify clearSelections was called
    expect(clearSelectionsSpy.called).toBe(true);
    expect(clearSelectionsSpy.calledOnce).toBe(true);
  });
});