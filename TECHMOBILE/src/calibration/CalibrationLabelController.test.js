/*
 * Licensed Materials - Property of IBM
 *
 * 5724-U18, 5737-M66
 *
 * (C) Copyright IBM Corp. 2025 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */
import CalibrationLabelController from './CalibrationLabelController' ;
import CalibrationLabelUtils from './utils/CalibrationLabelUtils.js';
import {Application, Page, Datasource, JSONDataAdapter, Device} from '@maximo/maximo-js-api';
import calibrationTestItems from '../test/calibration-label-data.js';

const calibrationLabelItem = calibrationTestItems.calibrationLabelItem;
const calibrationLabelHeader = 'CALIBRATION LABEL';

function newDatasource(data = calibrationTestItems.calibrationLabelItem, items="member", idAttribute="wonum", name = "calibrationDetailsDS") {
  const da = new JSONDataAdapter({
    src: data,
    items: items,
  });

  const ds = new Datasource(da, {
    idAttribute: idAttribute,
    name: name,
  });

  return ds;
}

function assertValidHtml(html, expectedRowCount) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  expect(body.childNodes.length > 0).toBe(true);
  expect(body.querySelector(".print-content")).toBeTruthy();
  expect(body.querySelector(".card-header > h3").innerHTML.trim()).toBe(calibrationLabelHeader);
  expect(body.querySelectorAll(".field-row").length).toBe(expectedRowCount);
  expect(body.querySelectorAll(".field-value").length).toBe(expectedRowCount);
}

let app;
let page;
const controller = new CalibrationLabelController();

beforeEach(async () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();

  app = new Application();
  page = new Page({name: 'generateCalibrationLabel'});

  app.registerController(controller);
  page.registerController(controller);

  await app.initialize();
  app.client = { userInfo: {personid: 'WILSON'} };

  app.registerPage(page);
  page.registerDatasource(calibrationDetailsDS);
  page.registerDatasource(pmWorkorderDS);
  controller.pageInitialized(page, app);
});

const calibrationDetailsDS = newDatasource();
const pmWorkorderDS = newDatasource(calibrationTestItems.pmWorkorderDSItem, "member", "wonum", "pmWorkorderDS");

describe('loadCalibrationLabelInfo', async () => {
  it('should initialize with proper state and call "loadCalibrationLabelInfo"', async () => {
    page.params = {
      href: calibrationLabelItem.member[0].href
    };
    app.pageStack = ['schedule', 'workOrderDetails', 'generateCalibrationLabel'];

    const loadCalibrationLabelInfoSpy = jest.spyOn(controller, 'loadCalibrationLabelInfo').mockResolvedValue({});
    controller.pageResumed(page, app);

    // initial values set by pageResumed before loadCalibrationLabelInfo resolves
    expect(page.state.loading).toBe(true);
    expect(page.state.noDataFoundErrMsg).toBe(false);
    expect(loadCalibrationLabelInfoSpy).toHaveBeenCalled();
  });

  it('should set states for UI and data sources', async () => {
    app.pageStack = ['schedule', 'workOrderDetails', 'generateCalibrationLabel'];
    page.params = {
      href: calibrationLabelItem.member[0].href
    }
    page.state.noDataFoundErrMsg = false;
    
    const calibrationDetailsDSLoadSpy = jest.spyOn(calibrationDetailsDS, 'load');
    const dataFormatterSpy = jest.spyOn(app.dataFormatter, 'getISODate').mockReturnValue('2025-05-03'); 
    const pmWorkorderDSLoadSpy = jest.spyOn(pmWorkorderDS, 'load');
    const getCompletingUserSignatureSpy = jest.spyOn(controller, 'getCompletingUserSignature');
    const deriveCalibrationStatusSpy = jest.spyOn(controller, 'deriveCalibrationStatus');
    await controller.loadCalibrationLabelInfo();

    const calibrationDetailsDSQuery = calibrationDetailsDSLoadSpy.mock.calls[0][0];
    const pmWorkorderDSLoadSpyQuery = pmWorkorderDSLoadSpy.mock.calls[0][0];

    // verify the formatter was called with correct value.
    expect(dataFormatterSpy.mock.calls[0][0]).toBe(calibrationDetailsDS.item.lastcompdate);
    expect(calibrationDetailsDSLoadSpy.mock.calls.length).toBe(1);
    expect(pmWorkorderDSLoadSpy.mock.calls.length).toBe(1);
    expect(getCompletingUserSignatureSpy).toHaveBeenCalled();
    expect(deriveCalibrationStatusSpy).toHaveBeenCalled();
    expect(calibrationDetailsDSQuery.noCache === true && calibrationDetailsDSQuery.itemUrl === page.params.href);

    expect(pmWorkorderDSLoadSpyQuery.where).toBe("pm.pmuid=46 and actfinish>=\"2025-05-03\"");
    expect(pmWorkorderDSLoadSpyQuery.orderBy).toBe("actfinish descending");
    expect(pmWorkorderDSLoadSpyQuery.noCache).toBe(true);

    expect(page.state.signature).toBe('WILSON');
    expect(page.state.calstatus).toBe('BROKEN');
    expect(page.state.labelType).toBe('location');
    expect(page.state.noDataFoundErrMsg).toBe(false);

    calibrationDetailsDSLoadSpy.mockRestore();
    pmWorkorderDSLoadSpy.mockRestore();
  });

  it('should show dialog if more recent work order exists', async () => {
    app.pageStack = ['schedule', 'workOrderDetails', 'generateCalibrationLabel'];
    page.params = {
      href: calibrationLabelItem.member[1].href
    }
    page.state.noDataFoundErrMsg = false;
    
    const calibrationDetailsDSLoadSpy = jest.spyOn(calibrationDetailsDS, 'load').mockImplementation(() => { calibrationDetailsDS.get(1, true) }); // older PM Work order record
    const dataFormatterSpy = jest.spyOn(app.dataFormatter, 'getISODate').mockReturnValue('2025-05-03'); 
    const pmWorkorderDSLoadSpy = jest.spyOn(pmWorkorderDS, 'load');
    
    const showDialogSpy = jest.spyOn(page, 'showDialog').mockImplementation(() => {});
    await controller.loadCalibrationLabelInfo();
    
    const pmWorkorderDSLoadSpyQuery = pmWorkorderDSLoadSpy.mock.calls[0][0];
    // verify the formatter was called with correct value.
    expect(dataFormatterSpy.mock.calls[0][0]).toBe(calibrationDetailsDS.item.lastcompdate);
    expect(pmWorkorderDSLoadSpyQuery.where).toBe("pm.pmuid=46 and actfinish>=\"2025-05-03\"");
    expect(pmWorkorderDSLoadSpyQuery.orderBy).toBe("actfinish descending");
    expect(pmWorkorderDSLoadSpyQuery.noCache).toBe(true);

    expect(showDialogSpy).toHaveBeenCalledWith("newerRecordForPM", {}, {'item': calibrationTestItems.pmWorkorderDSItem.member[0]});
    
    showDialogSpy.mockRestore();
    calibrationDetailsDSLoadSpy.mockRestore();
  });

  it('should terminate if work order is ineligible', async () => {
    app.pageStack = ['schedule', 'workOrderDetails', 'generateCalibrationLabel'];
    page.params = {
      href: calibrationLabelItem.member[1].href
    }
    page.state.noDataFoundErrMsg = false;
    const calibrationDetailsDSLoadSpy = jest.spyOn(calibrationDetailsDS, 'load').mockImplementation(() => { calibrationDetailsDS.get(2, true) }); // ineligible PM Work order record
    await controller.loadCalibrationLabelInfo();
    calibrationDetailsDSLoadSpy.mockRestore();
    expect(page.state.noDataFoundErrMsg).toBe(true);
  });;

  it('should terminate if data source is null', async () => {
    page.state.noDataFoundErrMsg = false;
    jest.spyOn(page, 'findDatasource').mockImplementation( () => { return { item: {}, load: jest.fn() } } );
    await controller.loadCalibrationLabelInfo();
    expect(page.state.noDataFoundErrMsg).toBe(true);
  });

  it('should show dialog for offline', async () => {
    app.state = {networkConnected: false};
    const showDialogSpy = jest.spyOn(page, 'showDialog').mockImplementation(() => {});
    controller.pageResumed(page, app);
    expect(showDialogSpy).toHaveBeenCalledWith("callabel_offline_msg");
  });
});

describe('refreshLabelPage', () => {
  it('should call loadCalibrationLabelInfo() with changed item', async () => {
    page.params = { href: calibrationLabelItem.member[1].href };

    const loadCalibrationLabelInfoSpy = jest.spyOn(controller, 'loadCalibrationLabelInfo');
    const calibrationDetailsDSLoadSpy = jest.spyOn(calibrationDetailsDS, 'load').mockImplementation(() => { calibrationDetailsDS.get(0, true) });
    const pmWorkorderDSLoadSpy = jest.spyOn(pmWorkorderDS, 'load');

    await controller.refreshLabelPage(calibrationLabelItem.member[0]);

    const calibrationDetailsDSQuery = calibrationDetailsDSLoadSpy.mock.calls[0][0];
    expect(loadCalibrationLabelInfoSpy.mock.calls.length).toBe(1);
    expect(loadCalibrationLabelInfoSpy).toHaveBeenCalledWith(false);
    expect(pmWorkorderDSLoadSpy).not.toHaveBeenCalled();
    expect(page.params.href).toBe(calibrationLabelItem.member[0].href);
    expect(calibrationDetailsDSQuery).toMatchObject({
      noCache: true,
      itemUrl: page.params.href,
    });
    expect(page.state.signature).toBe('WILSON');
    expect(page.state.calstatus).toBe('BROKEN');
    expect(page.state.labelType).toBe('location');
    expect(page.state.noDataFoundErrMsg).toBe(false);
  });
});

describe('getCompletingUserSignature', () => {
  it('should find user who has completed the workorder', () => {
    // Has 'COMP' entry
    const wostatusArr = calibrationLabelItem.member[0].wostatus;
    expect(controller.getCompletingUserSignature(wostatusArr)).toBe('WILSON');
    // Has only 'CLOSE' entry
    const wostatusArr2 = [...wostatusArr.slice(0, 2), ...wostatusArr.slice(3)];
    expect(controller.getCompletingUserSignature(wostatusArr2)).toBe('MAXADMIN');
  })
});

describe('getCalibrationstatusIcon', () => {
  function assertIconForCalStatus(calStatus, calStatusIconName) {
    page.state.calstatus = calStatus;
    expect(controller.getCalibrationstatusIcon()).toBe(calStatusIconName);
  }

  it('should return the correct status icon', () => {
    assertIconForCalStatus('PASS', 'Carbon:checkmark--outline');
    assertIconForCalStatus('FAIL', 'Carbon:Close--outline');
    assertIconForCalStatus('OLIM', 'Carbon:Close--outline');
    assertIconForCalStatus('BROKEN', 'Carbon:Warning--alt');
    assertIconForCalStatus('', '');
    assertIconForCalStatus(null, '');
    assertIconForCalStatus(undefined, '');
  });
})

describe(('getWorkOrderFieldValue'), () => {
  it('should return date formatted field for item', () => {
    jest.spyOn(page, 'findDatasource').mockImplementation(() => { return {item: calibrationLabelItem.member[0]} });
    expect(controller.getWorkOrderFieldValue('actfinish', 'DATE')).toBe('05/03/2025');
    expect(controller.getWorkOrderFieldValue('wonum')).toBe(calibrationLabelItem.member[0].wonum);
    expect(controller.getWorkOrderFieldValue('invalidField')).toBe('');

    jest.spyOn(page, 'findDatasource').mockImplementation(() => { return undefined });
    expect(controller.getWorkOrderFieldValue('wonum')).toBe('');
  })
});

describe(('deriveCalibrationStatus'), () => {
  it('should derive calibration status according to the rules', () => {
    expect(controller.deriveCalibrationStatus(calibrationLabelItem.member[1].pluscwods)).toBe('PASS');
    expect(controller.deriveCalibrationStatus([])).toBe('MISSING');
    // with 'MISSING' status
    expect(controller.deriveCalibrationStatus([
        { "asleftcalstatus_maxvalue": "MISSING" }, 
        { "asleftcalstatus_maxvalue": "PASS" }, 
        { "asleftcalstatus_maxvalue": "ADJREQD" }
      ])).toBe('PASS');
    expect(controller.deriveCalibrationStatus([
        { "asleftcalstatus_maxvalue": "MISSING" }, 
        { "asleftcalstatus_maxvalue": undefined }
      ])).toBe('MISSING');
    expect(controller.deriveCalibrationStatus([
        { "asleftcalstatus_maxvalue": "MISSING" }, 
        { "asleftcalstatus_maxvalue": "FAIL" },
        { "asleftcalstatus_maxvalue": "OLIM" }
      ])).toBe('FAIL');
      expect(controller.deriveCalibrationStatus([
        { "asleftcalstatus_maxvalue": "MISSING" }, 
        { "asleftcalstatus_maxvalue": "PASS" },
        { "asleftcalstatus_maxvalue": "OLIM" }
      ])).toBe('OLIM');
  })
});

describe('generateCalibrationLabel', () => {
  it('Should call cordova print plugin to print data for location label', () => {
    jest.spyOn(Device, 'get').mockReturnValue({isMaximoMobile: true});
    page.state = {
      signature: 'WILSON',
      calstatus: 'PASS',
      labelType: 'location',
      noDataFoundErrMsg: false
    };
    jest.spyOn(page, 'findDatasource').mockImplementation(() => { return {item: calibrationLabelItem.member[0]} });
    window.cordova = {
      plugins: { 
        printer: {
          print: jest.fn()
        }
      }
    };
    const populateFieldsSpy = jest.spyOn(controller, 'populateFieldsForMobile');
    const htmlTemplateGeneratorSpy = jest.spyOn(CalibrationLabelUtils, 'getHTMLTemplateForMobileToPrint');
    controller.generateCalibrationLabel();
    expect(populateFieldsSpy).toHaveBeenCalled();
    expect(htmlTemplateGeneratorSpy.mock.calls.length).toBe(1);
    const fieldRowCount = populateFieldsSpy.mock.calls.filter(arg => arg[3] != null).length;
    assertValidHtml(htmlTemplateGeneratorSpy.mock.results[0].value, fieldRowCount);
    expect(window.cordova.plugins.printer.print).toHaveBeenCalled();
  });

  it('Should call cordova print plugin to print data for asset label', () => {
    jest.spyOn(Device, 'get').mockReturnValue({isMaximoMobile: true});
    page.state = {
      signature: 'WILSON',
      calstatus: 'PASS',
      labelType: 'asset',
      noDataFoundErrMsg: false
    };
    jest.spyOn(page, 'findDatasource').mockImplementation(() => { return {item: calibrationLabelItem.member[3]} });
    window.cordova = {
      plugins: { 
        printer: {
          print: jest.fn()
        }
      }
    };
    const populateFieldsSpy = jest.spyOn(controller, 'populateFieldsForMobile');
    const htmlTemplateGeneratorSpy = jest.spyOn(CalibrationLabelUtils, 'getHTMLTemplateForMobileToPrint');
    controller.generateCalibrationLabel();
    expect(populateFieldsSpy).toHaveBeenCalled();
    expect(htmlTemplateGeneratorSpy.mock.calls.length).toBe(1);
    const fieldRowCount = populateFieldsSpy.mock.calls.filter(arg => arg[3] != null).length;
    assertValidHtml(htmlTemplateGeneratorSpy.mock.results[0].value, fieldRowCount);
    expect(window.cordova.plugins.printer.print).toHaveBeenCalled();
  });

  it('Should call window print to print data for desktop', () => {
    Device.get().isMaximoMobile = false;
    const webHtmlGeneratorSpy = jest.spyOn(CalibrationLabelUtils, 'generateHtmlForWebClient');
    const windowPrintSpy = jest.spyOn(window, 'print');
    const documentHeadAppendChildSpy = jest.spyOn(document.head, 'appendChild');
    const documentHeadRemoveChildSpy = jest.spyOn(document.head, 'removeChild');

    controller.generateCalibrationLabel();
    
    expect(webHtmlGeneratorSpy.mock.calls.length).toBe(1);
    expect(windowPrintSpy.mock.calls.length).toBe(1);

    // does not get invoked in vitest, need to call it manually
    window.onafterprint();
    // assert the style element is removed
    expect(documentHeadRemoveChildSpy).toHaveBeenCalledWith(documentHeadAppendChildSpy.mock.calls[0][0]);
  });
});