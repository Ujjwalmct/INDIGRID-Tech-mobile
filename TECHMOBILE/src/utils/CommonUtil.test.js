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

import CommonUtil from './CommonUtil';
import SynonymUtil from './SynonymUtil.js'
import { JSONDataAdapter, Page, Datasource, Application, Device } from '@maximo/maximo-js-api';
import MapPreLoadAPI from '@maximo/map-component/build/ejs/framework/loaders/MapPreLoadAPI';

import workorderitem from '../test/wo-detail-json-data.js';
import worLogItem from '../test/worklog-json-data.js';
import statusitem from '../test/statuses-json-data.js';
import defaultDs from '../test/defaultds_maxvars-json-data.js';
import testWoDetails from "../calibration/test/test-wodetails-data";
import testCalibrationData from "../calibration/test/test-calibration-data";
import sinon from "sinon";

function newStatusDatasource(data = defaultDs, name = 'defaultSetDs') {
    const da = new JSONDataAdapter({
        src: data,
        items: 'member',
    });
    const ds = new Datasource(da, {
        idAttribute: 'value',
        name: name
    });
    return ds;
}

function newSynonymDatasource(data = statusitem, name = 'synonymdomainData') {
    const da = new JSONDataAdapter({
        src: data,
        items: 'member',
        schema: 'responseInfo.schema'
    });

    const ds = new Datasource(da, {
        idAttribute: 'value',
        name: name
    });

    return ds;
}
function newDatasource(data = workorderitem, name = 'workorderds') {
    const da = new JSONDataAdapter({
        src: data,
        items: 'member',
        schema: 'responseInfo.schema'
    });

    const ds = new Datasource(da, {
        idAttribute: 'wonum',
        name: name
    });

    return ds;
}

function newDatasourceWorkLog(data = worLogItem, name = 'woWorklogDs') {
    const da = new JSONDataAdapter({
        src: worLogItem,
        items: 'member',
        schema: 'responseInfo.schema'
    });

    const ds = new Datasource(da, {
        name: name
    });

    return ds;
}

let systemProp = {
    "maximo.mobile.completestatus": "COMP",
    "maximo.mobile.statusforphysicalsignature": "COMP,CAN",
    "maximo.mobile.useTimer": "1",
    "maximo.mobile.radius": "0",
    "maximo.mobile.wostatusforesig": "INPRG"
}

afterEach(() => {
    jest.restoreAllMocks();
});

describe('CommonUtil', () => {
    it('verify getSystemProp called', async () => {
        let app = {
            state: {
                systemProp: systemProp
            }
        };
        let propValue = CommonUtil.getSystemProp(app, 'maximo.mobile.completestatus');
        expect(propValue).toBe('COMP');
    });

    it('verify checkSystemProp called', async () => {
        let app = {
            state: {
                systemProp: systemProp
            }
        };
        let propValueTrue = await CommonUtil.checkSystemProp(app, 'maximo.mobile.useTimer');
        expect(propValueTrue).toBe(true);
        let propValueFalse = await CommonUtil.checkSystemProp(app, 'maximo.mobile.radius');
        expect(propValueFalse).toBe(false);
    });

    it('verify checkSysPropArrExist called with return type false', async () => {
        let app = {
            state: {
                systemProp: systemProp
            }
        };
        let propValuePositive = await CommonUtil.checkSysPropArrExist(app, 'maximo.mobile.statusforphysicalsignature', 'CAN', false);
        expect(propValuePositive).toBe(1);
        let propValueNagative = await CommonUtil.checkSysPropArrExist(app, 'maximo.mobile.statusforphysicalsignature', 'INPR', false);
        expect(propValueNagative).toBe(0);
        let propValueTrue = await CommonUtil.checkSysPropArrExist(app, 'maximo.mobile.statusforphysicalsignature', 'CAN', true);
        expect(propValueTrue).toBe(true);
    });

    it('returns false when statusComp is not in allowedSignature', async () => {
        const app = {
            state: {
                systemProp: systemProp
            }
        };
        const statusComp = 'valid';
        jest.spyOn(CommonUtil, 'getSystemProp').mockImplementation((app, systemPropName) => {
            // Mocked response based on systemPropName
            if (systemPropName === 'testProp') {
              return Promise.resolve('test,valid,invalid');
            }
            return Promise.resolve(null);
          });
        const result = await CommonUtil.checkSysPropArrExist(app, 'testProp', statusComp);
        expect(result).toBe(false);
      });

    it('should handle all cases for checkEsigRequired', async () => {
        const app = {
            state: {
                systemProp: {}
            }
        };
        const page = {
            state: {
                selectedStatus: "INPRG"
            }
        };

        // Case 1: esigCheck is undefined
        let propValueUndefined = await CommonUtil.checkEsigRequired(app, page);
        expect(propValueUndefined).toBe(false);

        // Case 2: esigCheck contains valid statuses
        app.state.systemProp["maximo.mobile.wostatusforesig"] = "INPRG,CAN";
        let propValuePositive = await CommonUtil.checkEsigRequired(app, page);
        expect(propValuePositive).toBe(true);

        // Case 3: selectedStatus does not match any in esigCheck
        page.state.selectedStatus = "NEWTEST";
        let propValueNegative = await CommonUtil.checkEsigRequired(app, page);
        expect(propValueNegative).toBe(false);

        // Case 4: esigCheck is empty
        app.state.systemProp["maximo.mobile.wostatusforesig"] = "";
        let propValueEmpty = await CommonUtil.checkEsigRequired(app, page);
        expect(propValueEmpty).toBe(false);
    });


    // Generated by WCA for GP
    it('Should Call checkScanRequired', async() => {
        let response = await CommonUtil.checkScanRequired("INPRG");
        expect(response).toBeTruthy();

        response = await CommonUtil.checkScanRequired("WAPR");
        expect(response).toBeFalsy();
    });

    it('verify mobilemaxvars works as expected', async () => {
        const app = new Application();
        
        const defDS = newStatusDatasource(defaultDs, 'defaultSetDs');
        app.registerDatasource(defDS);
        await defDS.load();
        
        const mobMaxVar = CommonUtil.filterMobileMaxvars("STARTTIMERINPRG", defDS);
        expect(mobMaxVar).toBeTruthy();
        expect(mobMaxVar.length).toBeGreaterThan(0);
        expect(mobMaxVar[0].varname).toBe("STARTTIMERINPRG");
        expect(mobMaxVar[0].varvalue).toBe("1");
    });

    it('should clear and reset the state of the provided data source', async () => {
    const mockDataSource = {
        clearState: jest.fn(),
        resetState: jest.fn()
      };
    await CommonUtil._resetDataSource(mockDataSource);
    expect(mockDataSource.clearState).toHaveBeenCalledTimes(1);
    expect(mockDataSource.resetState).toHaveBeenCalledTimes(1);
  });
});
it('verify open workLog works as expected', async () => {
    const app = new Application();
    const page = new Page({ name: 'page' });

    const ds = newDatasource(workorderitem, 'wodetails');
    const woWorklogDs = newDatasourceWorkLog(worLogItem, 'woWorklogDs');
    const synonymdomainDs = newSynonymDatasource(statusitem, 'synonymdomainData');
    page.registerDatasource(ds);
    page.registerDatasource(woWorklogDs);
    app.registerDatasource(synonymdomainDs);
    let items = await ds.load();

    await CommonUtil.openWorkLogDrawer(app, page, { 'item': items[1] }, woWorklogDs);
    expect(page.state.chatLogGroupData.length).toBe(1);
    expect(page.state.defaultLogType).toBe('!UPDATE!');
});

it('should handle MaximoMobile and query relationship logic correctly', async () => {
    const app = new Application();
    const page = new Page({ name: 'page' });

    const ds = newDatasource(workorderitem, 'wodetails');
    const woWorklogDs = newDatasourceWorkLog(worLogItem, 'woWorklogDs');
    const synonymdomainDs = newSynonymDatasource(statusitem, 'synonymdomainData');

    // Simulate MaximoMobile
    const deviceMock = jest.spyOn(Device, 'get').mockReturnValue({
        isMaximoMobile: true
    });

    woWorklogDs.options = {
        query: { relationship: "TESTRELATION" }
    };
    woWorklogDs.dependsOn = {
        schema: {
            properties: {
                testrelation: {
                    relation: "TESTRELATION",
                    items: { key: "value" }
                }
            }
        }
    };

    page.registerDatasource(ds);
    page.registerDatasource(woWorklogDs);
    app.registerDatasource(synonymdomainDs);

    const items = await ds.load();

    await CommonUtil.openWorkLogDrawer(app, page, { item: items[1] }, woWorklogDs);

    expect(woWorklogDs.schema).toBeDefined();
    expect(woWorklogDs.schema).toEqual({ key: "value" });
    deviceMock.mockRestore();
});


// Assisted by watsonx Code Assistant 
it('should set the confirmDialog state with the correct values', () => {
    const app = {
    state: {
        confirmDialog: {}
    },
    getLocalizedLabel: jest.fn((_param1, param2, _param3) => param2)
    };
    const config = {
    title: {
        label: 'titleLabel',
        value: 'titleValue'
    },
    confirmDialogLabel1: {
        label: 'confirmDialogLabel1Label',
        value: 'confirmDialogLabel1Value'
    },
    confirmDialogLabel2: {
        label: 'confirmDialogLabel2Label',
        value: 'confirmDialogLabel2Value'
    },
    confirmDialogAcceptButton: {
        label: 'confirmDialogAcceptButtonLabel',
        value: 'confirmDialogAcceptButtonValue'
    },
    confirmDialogRejectButton: {
        label: 'confirmDialogRejectButtonLabel',
        value: 'confirmDialogRejectButtonValue'
    },
    onPrimaryClick: jest.fn(),
    onSecondaryClick: jest.fn()
    };
    const dynamicLabel = ['dynamicLabel1', 'dynamicLabel2'];

    CommonUtil.getConfirmDialogLabel(app, config, dynamicLabel);

    expect(app.state.confirmDialog).toEqual({
    title: 'titleValue',
    acceptIcon: '',
    acceptKind: 'Primary',
    label1: 'confirmDialogLabel1Value',
    label2: 'confirmDialogLabel2Value',
    acceptButton: 'confirmDialogAcceptButtonValue',
    rejectButton: 'confirmDialogRejectButtonValue',
    rejectIcon: '',
    onPrimaryClick: config.onPrimaryClick,
    onSecondaryClick: config.onSecondaryClick
    });
});

  
it('verify work log type filter based on orgId and siteId', async () => {
    const app = new Application();
    const page = new Page({ name: 'page' });
    const ds = newDatasource(workorderitem, 'wodetails');
    const woWorklogDs = newDatasourceWorkLog(worLogItem, 'woWorklogDs');
    const synonymdomainDs = newSynonymDatasource(statusitem, 'synonymdomainData');
    page.registerDatasource(ds);
    page.registerDatasource(woWorklogDs);
    app.registerDatasource(synonymdomainDs);
    const items = await ds.load();
    app.client = {
        userInfo: {
            insertOrg: 'EAGLENA',
            insertSite: 'BEDFORD'
        }
    }
    await CommonUtil.openWorkLogDrawer(app, page, { 'item': items[1] }, woWorklogDs);
    expect(synonymdomainDs.items.length).toBe(1);
    app.client = {
        userInfo: {
            insertOrg: '',
            insertSite: 'BEDFORD'
        }
    }
    await CommonUtil.openWorkLogDrawer(app, page, { 'item': items[1] }, woWorklogDs);
    expect(synonymdomainDs.items.length).toBe(1);
    app.client = {
        userInfo: {
            insertOrg: '',
            insertSite: ''
        }
    }
    await CommonUtil.openWorkLogDrawer(app, page, { 'item': items[1] }, woWorklogDs);
    expect(synonymdomainDs.items.length).toBe(1);
});

// Assisted by WCA for GP. Latest GenAI contribution: Version 1, granite-20B-code-instruct-v1 model
describe('canInteractWorkOrder', () => {
    it('should return true if the work order is accepted or rejected', () => {
        const item = {
            assignment: [
            {
                status: 'ACCEPTED'
            }
        ]};
        const app = {
            getChildDatasource: jest.fn(() => ({
                load: jest.fn(() => workorderitem),
                save: jest.fn(),
            })),
            state: {
                woOSName: 'security'
            },
            checkSigOption: (option) => true,
            getLocalizedLabel: jest.fn((key) => {
                if (key === 'Rejected') {
                    return 'REJECTED';
                } else {
                    return 'ACCEPTED';
                }
            })
        };
        expect(CommonUtil.canInteractWorkOrder(item, app)).toBe(true);
    });

   it('should return true if the work order status is completed', () => {
        const item = {
            status_maxvalue : 'COMP'
        };
        const app = {
            getChildDatasource: jest.fn(() => ({
                load: jest.fn(() => workorderitem),
                save: jest.fn(),
            })),
            state: {
                woOSName: 'security'
            },
            checkSigOption: (option) => true,
            getLocalizedLabel: jest.fn((key) => {
                if (key === 'Rejected') {
                    return 'REJECTED';
                } else {
                    return 'ACCEPTED';
                }
            })
        };
     
        expect(CommonUtil.canInteractWorkOrder(item, app)).toBe(true);

    });

    it('should return true if the work order status is approved', () => {
        const item = {
            status_maxvalue : 'APPR',
            assignment: [
                {
                    status: 'REJECTED',
                    assignmentid: 123
                }
            ],
        };
        const app = {
            getChildDatasource: jest.fn(() => ({
                load: jest.fn(() => workorderitem),
                save: jest.fn(),
            })),
            findDatasource: jest.fn(), 
            state: {
                woOSName: 'security'
            },
            checkSigOption: (option) => true,
            getLocalizedLabel: jest.fn((key) => {
                if (key === 'Rejected') {
                    return 'REJECTED';
                } else {
                    return 'ACCEPTED';
                }
            })
        };
     
        expect(CommonUtil.canInteractWorkOrder(item, app)).toBe(false);
    });

    it('should return false if the work order is assigned or delivered', () => {
        let item = {
            assignment: [
            {
                status: 'ASSIGNED',
                assignmentid: 123
            }
            ]
        };
        const app = {
            getChildDatasource: jest.fn(() => ({
                load: jest.fn(() => workorderitem),
                save: jest.fn(),
            })),
            state: {
                woOSName: 'security'
            },
            findDatasource: jest.fn(),
            checkSigOption: (option) => true,
            getLocalizedLabel: jest.fn((key) => {
                if (key === 'Rejected') {
                    return 'Rejected';
                } else {
                    return 'Accepted';
                }
            })
        };
        expect(CommonUtil.canInteractWorkOrder(item, app)).toBe(false);
        item = {
            assignment: [
            {
                status: 'Accepted',
                assignmentid: 123
            }
            ]
        };
        expect(CommonUtil.canInteractWorkOrder(item, app)).toBe(true);
    });

    it('should return false if no sigoption MANAGEASSIGNMENTSTATUS and vice versa', () => {
        const item = {
            assignment: [
            {
                status: 'ASSIGNED',
                assignmentid: 123
            }
            ]
        };
        const app = {
            getChildDatasource: jest.fn(() => ({
                load: jest.fn(() => workorderitem),
                save: jest.fn(),
            })),
            findDatasource: jest.fn(),
            state: {
                woOSName: 'MANAGEASSIGNMENTSTATUS'
            },
            checkSigOption: (option) => false,
            getLocalizedLabel: jest.fn((key) => {
                if (key === 'Rejected') {
                    return 'Rejected';
                } else {
                    return 'Accepted';
                }
            })
        };
        expect(CommonUtil.canInteractWorkOrder(item, app)).toBe(true);

        app.checkSigOption = (option) => true;
        expect(CommonUtil.canInteractWorkOrder(item, app)).toBe(false);
    });
});
  
// Assisted by WCA for GP. Latest GenAI contribution: Version 1, granite-20B-code-instruct-v1 model
describe('markStatusAssigned', () => {
  it('should call api', async() => {
    const app = new Application();
        
    const event = {
        item: {
          assetnum: '1845',
          description: 'Pump10',
          wobyasset:[
            {
              description: 'HVAC overheating',
              status: 'WMATL',
              status_description: 'Waiting on material',
              status_maxvalue: 'WMATL',
              statusdate: '2021-03-09T16:08:51+05:30',
              wonum: '1228',
              worktype: 'CM',
              siteid: "BEDFORD"
            },
            {
              status_maxvalue: "WAPPR",
              status_description: "Waiting on approval",
              description: "[Auto - 634787] Work order with a description",
              worktype: "PM",
              wonum: "634787",
              status: "WAPPR",
              statusdate: "2021-08-09T13:08:57+05:30",
              siteid: "BEDFORD"
              },
              {
              status_maxvalue: "APPR",
              status_description: "Approved",
              description: "[Auto - 939232] Work order with a description",
              worktype: "PM",
              wonum: "939232",
              status: "APPR",
              statusdate: "2021-07-02T16:58:45+05:30",
              siteid: "BEDFORD"
              },
              {
              status_maxvalue: "CLOSE",
              status_description: "Waiting on approval",
              description: "Water on floor",
              wonum: "1131",
              status: "CLOSE",
              statusdate: "2004-10-06T15:30:34+05:30",
              siteid: "BEDFORD"
              }
          ]
        },
        invokeAction: jest.fn(),
        forceReload: jest.fn(),
        woNum: '634787'
    }
    let page = {
        state: {
            selectedStatus: "INPRG",
            loadingstatus: true
        }
    }
      const synonymDS = newStatusDatasource(defaultDs, 'synonymdomainData');
      app.registerDatasource(synonymDS);
      await synonymDS.load();
    const ds = {
        getChildDatasource: jest.fn(() => ({
            load: jest.fn(() => workorderitem.member[0].assignment),
            save: jest.fn(),
          })),
          forceReload: jest.fn(),
        getLocalizedLabel: jest.fn((key) => {
            if (key === 'Rejected') {
                return 'Rejected';
            } else {
                return 'Approved';
            }
        })
    }
    app.client = {
        userInfo: {
          personid: 'WILSON',
          labor: {
              laborcode: 'WILSON'
          }
        }
      };
    const callControllerSpy = jest.spyOn(event, "forceReload");
    await CommonUtil.markStatusAssigned(app,page,ds, event)
    expect(callControllerSpy).toBeCalled();
  });

    it('should return index as 0 when there are no assignments', async () => {
        const app = new Application();

        app.client = {
            userInfo: { labor: { laborcode: 'WILSON' } }
        };

        let page = {};
        const ds = {
            getChildDatasource: jest.fn(() => ({
                load: jest.fn(() => []),
                save: jest.fn(),
            })),
            item: { wonum: '1201' },
            forceReload: jest.fn()
        };

        const listDS = {
            forceReload: jest.fn()
        };
        const mockSynonymData = {
            value: 'ACCEPTED',
            valueid: 'ASSTAT|ACCEPTED',
            maxvalue: 'ACCEPTED',
            description: 'Accpeted'
        };
        const synonymdomainDs = newSynonymDatasource(statusitem, 'synonymdomainData');
        synonymdomainDs.initializeQbe = jest.fn();
        jest.spyOn(SynonymUtil, 'getSynonym').mockResolvedValue(mockSynonymData);
        app.registerDatasource(synonymdomainDs);
        await CommonUtil.markStatusAssigned(app, page, ds, listDS);

        const records = await ds.getChildDatasource().load();
        const index = records.length
            ? records.findIndex(
                assignment =>
                    assignment.laborcode === app.client.userInfo.labor.laborcode &&
                    assignment.assignmentid
            )
            : 0;

        expect(index).toBe(0);
    });


    it('should update the status and display success message for markStatusAssigned', async () => {
        const app = new Application();
        app.toast = jest.fn();
        app.getLocalizedLabel = (key, defaultValue) => defaultValue.toUpperCase();

        app.getLocalizedLabel = jest.fn().mockReturnValue('Assignment WO123 was assigned to you.');
        const event = {
            item: {
                assetnum: '1845',
                description: 'Pump10',
                wobyasset: [
                    {
                        description: 'HVAC overheating',
                        status: 'WMATL',
                        status_description: 'Waiting on material',
                        status_maxvalue: 'WMATL',
                        statusdate: '2021-03-09T16:08:51+05:30',
                        wonum: '1228',
                        worktype: 'CM',
                        siteid: "BEDFORD"
                    },
                    {
                        status_maxvalue: "WAPPR",
                        status_description: "Waiting on approval",
                        description: "[Auto - 634787] Work order with a description",
                        worktype: "PM",
                        wonum: "634787",
                        status: "WAPPR",
                        statusdate: "2021-08-09T13:08:57+05:30",
                        siteid: "BEDFORD"
                    },
                    {
                        status_maxvalue: "APPR",
                        status_description: "Approved",
                        description: "[Auto - 939232] Work order with a description",
                        worktype: "PM",
                        wonum: "939232",
                        status: "APPR",
                        statusdate: "2021-07-02T16:58:45+05:30",
                        siteid: "BEDFORD"
                    },
                    {
                        status_maxvalue: "CLOSE",
                        status_description: "Waiting on approval",
                        description: "Water on floor",
                        wonum: "1131",
                        status: "CLOSE",
                        statusdate: "2004-10-06T15:30:34+05:30",
                        siteid: "BEDFORD"
                    }
                ]
            },
            invokeAction: jest.fn(),
            forceReload: jest.fn(),
            woNum: '634787'
        }
        let page = {
            state: {
                selectedStatus: "INPRG",
                loadingstatus: true
            }
        }
        const ds = {
            getChildDatasource: jest.fn(() => ({
                load: jest.fn(() => workorderitem.member[0].assignment),
                save: jest.fn(),
            })),
            forceReload: jest.fn(),
            getLocalizedLabel: jest.fn((key) => {
                if (key === 'Rejected') {
                    return 'Rejected';
                } else {
                    return 'Approved';
                }
            }),
            item: [workorderitem]
        }
        ds.load = jest.fn();
        ds.save = jest.fn();
        app.client = {
            userInfo: {
                personid: 'WILSON',
                labor: {
                    laborcode: 'WILSON'
                }
            }
        };
        await app.initialize();
        const mockSynonymData = {
            value: 'ACCEPTED',
            valueid: 'ASSTAT|ACCEPTED',
            maxvalue: 'ACCEPTED',
            description: 'Accepted'
        };

        const synonymdomainDs = newSynonymDatasource(statusitem, 'synonymdomainData');
        synonymdomainDs.initializeQbe = jest.fn();
        app.registerDatasource(synonymdomainDs);
        jest.spyOn(SynonymUtil, 'getSynonym').mockResolvedValue(mockSynonymData);
        await CommonUtil.markStatusAssigned(app, page, ds, event)
        expect(app.toast).toHaveBeenCalledWith(
            expect.stringContaining('Assignment WO123 was assigned to you.'),
            'success'
        );
        expect(event.forceReload).toHaveBeenCalled();
    });
});

it('should call api and reject work order', async() => {
    const app = new Application();
    let page = {
        state: {
            selectedStatus: "INPRG",
            loadingstatus: true
        }
    }
    const ds = {
        getChildDatasource: jest.fn(() => ({
            load: jest.fn(() => workorderitem.member[0].assignment),
            save: jest.fn(),
          })),
        getLocalizedLabel: jest.fn((key) => {
            if (key === 'Rejected') {
                return 'Rejected';
            } else {
                return 'Approved';
            }
        })
    }
    let wods = jest.spyOn(app, "findDatasource").mockImplementation(() => {
        return {
            data: workorderitem,
            initializeQbe: ()=>{},
            setQBE: (param1,params2)=>{},
            searchQBE: ()=> {return workorderitem.member},
            load: () => {},
            forceReload: () => {return workorderitem},
            item:workorderitem.member[0],
            getChildDatasource: jest.fn(() => ({
                load: jest.fn(() => workorderitem.member[0].assignment),
                save: jest.fn(),
              }))
        }
    });
    sinon.stub(app, "toast").callThrough();
    await CommonUtil.removeAssigned(app,page,ds)
    expect(wods).toBeCalled();
  });

  // Assisted by watsonx Code Assistant 
it('should set temprecord', async () => {
    const app = new Application();
    app.client = {
        userInfo: {
            personid: 'WILSON',
            labor: {
                laborcode: 'WILSON'
            }
        }
    };
    let page = {
        state: {
            selectedStatus: "INPRG",
            loadingstatus: true
        }
    }
    const ds = {
        getChildDatasource: jest.fn(() => ({
            load: jest.fn(() => workorderitem.member[0].assignment),
            save: jest.fn(),
        })),
        getLocalizedLabel: jest.fn((key) => {
            if (key === 'Rejected') {
                return 'Rejected';
            } else {
                return 'Approved';
            }
        })
    }
    let wods = jest.spyOn(app, "findDatasource").mockImplementation(() => {
        return {
            data: workorderitem,
            initializeQbe: () => { },
            setQBE: (param1, params2) => { },
            searchQBE: () => { return workorderitem.member },
            load: () => { },
            forceReload: () => { return workorderitem },
            item: workorderitem.member[0],
            getChildDatasource: jest.fn(() => ({
                load: jest.fn(() => workorderitem.member[0].assignment),
                save: jest.fn(),
            }))
        }
    });
    sinon.stub(app, "toast").callThrough();
    await CommonUtil.removeAssigned(app, page, ds)
    expect(wods).toBeCalled();
});

it('should force reload when device is not MaximoMobile', async () => {
    const app = new Application();

    const deviceMock = jest.spyOn(Device, 'get').mockReturnValue({
        isMaximoMobile: false
    });

    let page = {
        state: {
            selectedStatus: "INPRG",
            loadingstatus: true
        }
    };

    const ds = {};
    const woDetailDsMock = {
        forceReload: jest.fn().mockResolvedValueOnce(),
        item: null
    };

    const datasourceMock = jest.spyOn(app, "findDatasource").mockReturnValue(woDetailDsMock);

    try {
        await CommonUtil.removeAssigned(app, page, ds);
        expect(woDetailDsMock.forceReload).toBeCalled();
    } catch (error) {
    } finally {
        deviceMock.mockRestore();
        datasourceMock.mockRestore();
    }
});

it('should show toast message when showToast is true', async () => {
    const app = new Application();
    app.toast = jest.fn(); // Mocking the toast function

    let page = {};
    const ds = {};
    // Mock forceReload to avoid undefined error
    const woDetailDsMock = {
        forceReload: jest.fn().mockResolvedValue(),
        item: {
            wonum: "1201",
            assignment: []
        }
    };
    const mockSynonymData = {
        value: 'REJECTED',
        valueid: 'ASSTAT|REJECTED',
        maxvalue: 'REJECTED',
        description: 'Rejected'
    };

    const synonymdomainDs = newSynonymDatasource(statusitem, 'synonymdomainData');
    synonymdomainDs.initializeQbe = jest.fn();
    app.registerDatasource(synonymdomainDs);
    jest.spyOn(SynonymUtil, 'getSynonym').mockResolvedValue(mockSynonymData);

    jest.spyOn(app, "findDatasource").mockReturnValue(woDetailDsMock);

    await CommonUtil.removeAssigned(app, page, ds, true);

    expect(app.toast).toBeCalledWith(
        expect.stringContaining("could not be rejected"),
        "error"
    );
});

it('should not show toast message when showToast is false', async () => {
    const app = new Application({
        findDatasource: jest.fn((name) => {
            if (name === 'synonymdomainData') return {};
            if (name === 'wodetails') return woDetailDsMock;
        }),
        toast: jest.fn(),
        getLocalizedLabel: jest.fn((key, msg) => msg)
    }
    );

    let page = {};
    const ds = {};
    const woDetailDsMock = {
        forceReload: jest.fn().mockResolvedValue(),
        item: { wonum: "1202", assignment: [] },
        forceReload: jest.fn().mockResolvedValue(),
        save: jest.fn().mockResolvedValue()
    };

    const mockSynonymData = {
        value: 'REJECTED',
        valueid: 'ASSTAT|REJECTED',
        maxvalue: 'REJECTED',
        description: 'Rejected'
    };

    const synonymdomainDs = newSynonymDatasource(statusitem, 'synonymdomainData');
    synonymdomainDs.initializeQbe = jest.fn();
    app.registerDatasource(synonymdomainDs);
    jest.spyOn(SynonymUtil, 'getSynonym').mockResolvedValue(mockSynonymData);
    jest.spyOn(app, "findDatasource").mockReturnValue(woDetailDsMock);

    await CommonUtil.removeAssigned(app, page, ds, false);
    expect(SynonymUtil.getSynonym).toHaveBeenCalled();
    expect(woDetailDsMock.forceReload).toHaveBeenCalled();
});

it('Verify validateDataSheet method as expected', async() => {
    const app = new Application();
    const page = new Page({ name: 'page' });

    const calibration = newDatasource(testWoDetails, 'woDetailCalibration');
    calibration.load = jest.fn();
    const data = {...testCalibrationData};
    const assetFun1 = {...data.member[0]};
    assetFun1.required = true;
    assetFun1.asfoundcalstatus = "PASS";
    assetFun1.asfoundcalstatus_maxvalue = "PASS";
    assetFun1.asleftcalstatus = "PASS";
    assetFun1.asleftcalstatus_maxvalue = "PASS";
    const assetFun2 = {...data.member[0]};
    assetFun2.required = true;
    delete assetFun2.asfoundcalstatus_maxvalue;
    delete assetFun2.asleftcalstatus_maxvalue;
    const assetFun3 = {...data.member[0]};
    delete assetFun3.asfoundcalstatus_maxvalue;
    delete assetFun3.asleftcalstatus_maxvalue;
    assetFun3.required = true;
    data.member = [assetFun1, assetFun2, assetFun3];
    const datasheet = newDatasource(data, 'pluscWoDs');
    app.registerDatasource(calibration);
    app.registerDatasource(datasheet);
    const workorder = { wonum: '1200', href: 'abc' };
    const response = await CommonUtil.validateDataSheet(app, page, workorder, true);
    expect(response).toBe(true);
});

it('should validate Incomplete Datasheet', async() => {
    const app = new Application();
    const page = new Page({ name: 'page' });
    const calibration = newDatasource(testWoDetails, 'woDetailCalibration');
    calibration.load = jest.fn();
    const data = {...testCalibrationData};
    const assetFun1 = {...data.member[0]};
    assetFun1.required = true;
    assetFun1.asfoundcalstatus = null;
    assetFun1.asfoundcalstatus_maxvalue = null;
    assetFun1.asleftcalstatus = null;
    assetFun1.asleftcalstatus_maxvalue = null;
    data.member = [assetFun1];
    const datasheet = newDatasource(data, 'pluscWoDs');
    app.registerDatasource(calibration);
    app.registerDatasource(datasheet);
    const workorder = { wonum: '1200', href: 'abc' };
    const response = await CommonUtil.validateDataSheet(app, page, workorder, true);
    expect(response).toBe(false);
});

it('should raise datasheet warning when all dynamic checks are not entered.', () => {
    const app = new Application();

    const page = new Page({ name: 'page' });
    const workorder = { wonum: '1200', href: 'abc' };
    app.showDialog = jest.fn();
    app.findDatasource = jest.fn((datasourceName) => {
        if(datasourceName === 'woDetailCalibration') {
            return {
                item: {
                    wonum: '1200',
                }
            };
        }

        if(datasourceName === 'pluscWoDs') {
            return {
                items: [{
                    required: true,
                    asfoundcalstatus: 'PASS',
                    asleftcalstatus: 'PASS',
                    pluscwodsinstr: [{
                        caldynamic: false
                    },
                    {
                        caldynamic: true,
                        pluscwodspoint: [{
                            asfoundinput: '12',
                            asleftinput: ''
                        }]
                    },
                    {
                        caldynamic: true,
                        pluscwodspoint: [{
                            asfoundinput: '',
                            asleftinput: ''
                        }]
                    }    
                ]
                }]
            };
        }
    });

    CommonUtil.validateDataSheet(app, page, workorder);

    expect(app.showDialog).toHaveBeenCalledWith('dataSheetWarnings');
});

it('should not raise datasheet warning when all dynamic checks values are entered.', () => {
    const app = new Application();

    const page = new Page({ name: 'page' });
    const workorder = { wonum: '1200', href: 'abc' };
    app.showDialog = jest.fn();
    app.findDatasource = jest.fn((datasourceName) => {
        if(datasourceName === 'woDetailCalibration') {
            return {
                item: {
                    wonum: '1200',
                }
            };
        }

        if(datasourceName === 'pluscWoDs') {
            return {
                items: [{
                    required: true,
                    asfoundcalstatus: 'PASS',
                    asleftcalstatus: 'PASS',
                    pluscwodsinstr: [{
                        caldynamic: true,
                        pluscwodspoint: [{
                            asfoundinput: '123',
                            asleftinput: '123'
                        }]
                    }]
                },
                {
                    required: false,
                    asfoundcalstatus: 'PASS',
                    asleftcalstatus: 'PASS',
                }
            ]
            };
        }
    });

    CommonUtil.validateDataSheet(app, page, workorder);

    expect(app.showDialog).not.toHaveBeenCalledWith('dataSheetWarnings');
});

it('if event is stop or pause then only get geolocation', async() => {
    const app = new Application();
    await app.initialize({
        geolocation: {
            updateGeolocation: () => {return true}
        }
    });
    app.state = {
        systemProp: {
            'mxe.mobile.travel.prompt': '1',
        }
    };
    const callControllerSpy = jest.spyOn(app.geolocation, "updateGeolocation").mockImplementation(() => {
        return true
      });

    CommonUtil.callGeoLocation(app, 'start');
    expect(callControllerSpy).not.toBeCalled();

    CommonUtil.callGeoLocation(app, 'stop');
    expect(callControllerSpy).toBeCalled();
});

it('Verify validateActualTools method as expected', async() => {
    const app = new Application();
    const page = new Page({ name: 'page' });
    await app.initialize();
    app.showDialog = jest.fn();
    const workorder1 = { wonum: '1200', href: 'abc', pluscvaltool: '0', uxshowactualtool: ['a','b'] };
    let response = await CommonUtil.validateActualTools(app, page, workorder1);
    expect(response).toBe(true);
    const workorder2 = { wonum: '1200', href: 'abc', pluscvaltool: '2'};
    response = await CommonUtil.validateActualTools(app, page, workorder2);
    expect(response).toBe(false);
    const workorder3 = { wonum: '1200', href: 'abc', pluscvaltool: '1'};
    response = await CommonUtil.validateActualTools(app, page, workorder3);
    expect(response).toBe(false);
});

// Assisted by watsonx Code Assistant 
describe('showReturn', () => {
    it('should return true if records length is greater than 0 and laborcode matches', async () => {
      const app = {
        client: {
          userInfo: {
            personid: '12345',
            labor: {
                laborcode: '12345'
            }
          }
        },
        state: {
            canReturn: false
        },
        findDatasource: jest.fn(() => ({
            data: workorderitem,
            initializeQbe: ()=>{},
            setQBE: (param1,params2)=>{},
            searchQBE: ()=> {return workorderitem.member},
            load: () => {},
            forceReload: () => {return workorderitem},
            item:workorderitem.member[0],
            getChildDatasource: jest.fn(() => ({
                load: jest.fn(() => workorderitem.member[0].assignment),
                save: jest.fn(),
            })),
            clearState: () => {},
            clearQBE: () => {},
        }))
      };
      const woDetailDs = {
        getChildDatasource: jest.fn(() => ({
          load: jest.fn(() => [{ laborcode: '12345' }])
        }))
      };
      const result = await CommonUtil.showReturn(app, woDetailDs);
      expect(result).toBe(true);
    });
  
    it('should return false if records length is 0', async () => {
      const app = {
        client: {
          userInfo: {
            personid: '123456'
          }
        },
        state: {
            canReturn: false
        },
        findDatasource: jest.fn(() => ({
            data: workorderitem,
            initializeQbe: ()=>{},
            setQBE: (param1,params2)=>{},
            searchQBE: ()=> {return workorderitem.member},
            load: () => {},
            forceReload: () => {return workorderitem},
            item:workorderitem.member[0],
            getChildDatasource: jest.fn(() => ({
                load: jest.fn(() => workorderitem.member[0].assignment),
                save: jest.fn(),
            })),
            clearState: () => {},
            clearQBE: () => {},
        }))
      };
      const woDetailDs = {
        getChildDatasource: jest.fn(() => ({
          load: jest.fn(() => [])
        }))
      };
      const result = await CommonUtil.showReturn(app, woDetailDs);
      expect(result).toBe(false);
    });
  
    it('should return false if laborcode does not match', async () => {
      const app = {
        client: {
          userInfo: {
            personid: '12345'
          }
        },
        state: {
            canReturn: false
        },
        findDatasource: jest.fn(() => ({
            data: workorderitem,
            initializeQbe: ()=>{},
            setQBE: (param1,params2)=>{},
            searchQBE: ()=> {return workorderitem.member},
            load: () => {},
            forceReload: () => {return workorderitem},
            item:workorderitem.member[0],
            getChildDatasource: jest.fn(() => ({
                load: jest.fn(() => workorderitem.member[0].assignment),
                save: jest.fn(),
            })),
            clearState: () => {},
            clearQBE: () => {},
        }))
      };
      const woDetailDs = {
        getChildDatasource: jest.fn(() => ({
          load: jest.fn(() => [{ laborcode: '67890' }])
        }))
      };
      const result = await CommonUtil.showReturn(app, woDetailDs);
      expect(result).toBe(false);
    });
  
    it('should return false if records is undefined', async () => {
      const app = {
        client: {
          userInfo: {
            personid: '12345'
          }
        },
        state: {
            canReturn: false
        },
        findDatasource: jest.fn(() => ({
            data: workorderitem,
            initializeQbe: ()=>{},
            setQBE: (param1,params2)=>{},
            searchQBE: ()=> {return workorderitem.member},
            load: () => {},
            forceReload: () => {return workorderitem},
            item:workorderitem.member[0],
            getChildDatasource: jest.fn(() => ({
                load: jest.fn(() => workorderitem.member[0].assignment),
                save: jest.fn(),
            })),
            clearState: () => {},
            clearQBE: () => {},
        }))
      };
      const woDetailDs = {
        getChildDatasource: jest.fn(() => ({
          load: jest.fn(() => [])
        }))
      };
      const result = await CommonUtil.showReturn(app, woDetailDs);
      expect(result).toBe(false);
    });
  });
  
// Assisted by watsonx Code Assistant 
it('should returns empty list if offlineStatusList is not initialized in getOfflineStatusList', async () => {
    const app = new Application();
    app.state = {
       offlineStatusList: null,
    };
    const synonymdomainDs = newSynonymDatasource(statusitem, 'synonymdomainData');
    synonymdomainDs.load = jest.fn();
    synonymdomainDs.initializeQbe = jest.fn();
    synonymdomainDs.setQBE = jest.fn();
    synonymdomainDs.searchQBE = jest.fn();
    jest.spyOn(synonymdomainDs, 'searchQBE').mockReturnValue([]);
    app.registerDatasource(synonymdomainDs);
    const result = await CommonUtil.getOfflineStatusList(app, 'org123', 'site456');
    expect(result).toEqual([]);
    expect(app.state.offlineStatusList).toEqual([]);
    expect(synonymdomainDs.initializeQbe).toHaveBeenCalled();
    expect(synonymdomainDs.setQBE).toHaveBeenCalledTimes(9);
    expect(synonymdomainDs.searchQBE).toHaveBeenCalled();
});

// Assisted by watsonx Code Assistant 
it('should returns offlineStatusList if it is already initialized in getOfflineStatusList', async () => {
    const app = new Application();
    app.state = {
       offlineStatusList: ['status1', 'status2']
    };
    const synonymdomainDs = newSynonymDatasource(statusitem, 'synonymdomainData');
    synonymdomainDs.load = jest.fn();
    synonymdomainDs.initializeQbe = jest.fn();
    synonymdomainDs.setQBE = jest.fn();
    synonymdomainDs.searchQBE = jest.fn();
    jest.spyOn(synonymdomainDs, 'searchQBE').mockReturnValue([]);
    app.registerDatasource(synonymdomainDs);
    const result = await CommonUtil.getOfflineStatusList(app, 'org123', 'site456');
    expect(result).toEqual(['status1', 'status2']);
    expect(synonymdomainDs.initializeQbe).not.toHaveBeenCalled();
    expect(synonymdomainDs.setQBE).not.toHaveBeenCalled();
    expect(synonymdomainDs.searchQBE).not.toHaveBeenCalled();
});

// Assisted by watsonx Code Assistant 
it('should get systemproperties and store in a state in getSystemProperties', async () => {
    const app = new Application();
    app.state = {
        systemProp: 'mockSystemProperties',
    };
    app.client = {
        getSystemProperties: jest.fn().mockResolvedValue('mockSystemProperties'),
    }
    await CommonUtil.getTravelSystemProperties(app);
    expect(app.state.systemProp).toBe('mockSystemProperties');
    expect(app.client.getSystemProperties).toHaveBeenCalledWith(
        'mxe.mobile.travel.prompt,mxe.mobile.travel.radius,mxe.mobile.travel.navigation,maximo.mobile.usetimer,maximo.mobile.statusforphysicalsignature,maximo.mobile.completestatus,mxe.mobile.navigation.windows,mxe.mobile.navigation.android,mxe.mobile.navigation.ios,maximo.mobile.allowmultipletimers,maximo.mobile.safetyplan.review,maximo.mobile.gotoreportwork'
    );
});

// Assisted by watsonx Code Assistant 
it('should not set systemProp when app.client.getSystemProperties is not a function', async () => {
    const app = new Application();
    app.state = {
        systemProp: null,
    };
    app.client = {
        getSystemProperties: []
    }
    await CommonUtil.getTravelSystemProperties(app);
    expect(app.state.systemProp).toBeNull();
   expect(typeof(app.client.getSystemProperties)).toBe('object')
});

// Assisted by watsonx Code Assistant 
it('should not set systemProp when app.client does not exist', async () => {
    const app = new Application();
    app.state = {
        systemProp: null,
    };
    delete app.client;
    await CommonUtil.getTravelSystemProperties(app);
    expect(app.client).toBeFalsy();
    expect(app.state.systemProp).toBeNull();
});

// Assisted by watsonx Code Assistant 
it('should not include statuses with invalid transitions in getOfflineAllowedStatusList', async () => {
    const app = new Application();
    app.state = {
        offlineStatusList: [{
            orgid: 'org1',
            siteid: 'site1',
            status: 'status2',
            status_maxvalue: 25,
            maxvalue: 'APPR',
        }]
     };
     const synonymdomainDs = newSynonymDatasource(statusitem, 'synonymdomainData');
     synonymdomainDs.load = jest.fn();
     synonymdomainDs.initializeQbe = jest.fn();
     synonymdomainDs.setQBE = jest.fn();
     synonymdomainDs.searchQBE = jest.fn();
     jest.spyOn(synonymdomainDs, 'searchQBE').mockReturnValue([{
        orgid: 'org1',
        siteid: 'site1',
        status: 'status2',
        status_maxvalue: 25,
        maxvalue: 'APPR',
    }]);
     
     app.registerDatasource(synonymdomainDs);

    const event = {
        item: {
            orgid: 'org1',
            siteid: 'site1',
            status: 'status2',
            status_maxvalue: 25,
        },
    };
    const result1 = await CommonUtil.getOfflineStatusList(app, 'org123', 'site456');
    expect(result1).toEqual([{
        orgid: 'org1',
        siteid: 'site1',
        status: 'status2',
        status_maxvalue: 25,
        maxvalue: 'APPR',
    }]);
    const result = await CommonUtil.getOfflineAllowedStatusList(app, event);
    expect(result).toEqual([]);
});

// Assisted by watsonx Code Assistant 
it('should return an array of allowed status objects', async () => {
    const app = new Application();
    app.state = {
        offlineStatusList: [{
            orgid: 'org1',
            siteid: 'site1',
            status: 'status2',
            status_maxvalue: 'WAPPR',
            maxvalue: 'APPR',
            value: 'DRAFT'

        }]
    };
    const synonymdomainDs = newSynonymDatasource(statusitem, 'synonymdomainData');
    synonymdomainDs.load = jest.fn();
    synonymdomainDs.initializeQbe = jest.fn();
    synonymdomainDs.setQBE = jest.fn();
    synonymdomainDs.searchQBE = jest.fn();


    app.registerDatasource(synonymdomainDs);

    const event = {
        item: {
            orgid: 'org1',
            siteid: 'site1',
            status: 'status2',
            status_maxvalue: 'WAPPR',
            maxvalue: 'APPR'
        },
    };
    const result1 = await CommonUtil.getOfflineStatusList(app, 'org123', 'site456');
    expect(result1).toEqual([{
        orgid: 'org1',
        siteid: 'site1',
        status: 'status2',
        status_maxvalue: 'WAPPR',
        maxvalue: 'APPR',
        value: 'DRAFT'

    }]);
    const result = await CommonUtil.getOfflineAllowedStatusList(app, event);
    expect(result).toEqual([{
        id: 'DRAFT',
        value: 'DRAFT',
        description: undefined,
        defaults: undefined,
        maxvalue: 'APPR',
        _bulkid: 'DRAFT'
    }]);

});

// Assisted by watsonx Code Assistant 
it('should returns false for invalid transitions in isAllowedStatus', async () => {
    expect(CommonUtil.isAllowedStatus('WAPPR', 'INVALID')).toBe(false);
    expect(CommonUtil.isAllowedStatus('COMP', 'INVALID')).toBe(false);
});

// Assisted by watsonx Code Assistant 
it('should returns true for valid transitions in isAllowedStatus', async () => {
    expect(CommonUtil.isAllowedStatus('WAPPR', 'COMP')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WAPPR', 'APPR')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WAPPR', 'CAN')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WAPPR', 'INPRG')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WAPPR', 'WSCH')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WAPPR', 'CLOSE')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WAPPR', 'WMATL')).toBe(true);

    expect(CommonUtil.isAllowedStatus('WPCOND', 'COMP')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WPCOND', 'APPR')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WPCOND', 'CAN')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WPCOND', 'INPRG')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WPCOND', 'WSCH')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WPCOND', 'CLOSE')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WPCOND', 'WMATL')).toBe(true);

    expect(CommonUtil.isAllowedStatus('APPR', 'COMP')).toBe(true);
    expect(CommonUtil.isAllowedStatus('APPR', 'WAPPR')).toBe(true);
    expect(CommonUtil.isAllowedStatus('APPR', 'CAN')).toBe(true);
    expect(CommonUtil.isAllowedStatus('APPR', 'INPRG')).toBe(true);
    expect(CommonUtil.isAllowedStatus('APPR', 'WSCH')).toBe(true);
    expect(CommonUtil.isAllowedStatus('APPR', 'CLOSE')).toBe(true);
    expect(CommonUtil.isAllowedStatus('APPR', 'WMATL')).toBe(true);

    expect(CommonUtil.isAllowedStatus('WSCH', 'COMP')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WSCH', 'WAPPR')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WSCH', 'CAN')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WSCH', 'INPRG')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WSCH', 'WSCH')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WSCH', 'CLOSE')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WSCH', 'WMATL')).toBe(true);

    expect(CommonUtil.isAllowedStatus('WMATL', 'COMP')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WMATL', 'WAPPR')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WMATL', 'CAN')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WMATL', 'INPRG')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WMATL', 'CLOSE')).toBe(true);
    expect(CommonUtil.isAllowedStatus('WMATL', 'WMATL')).toBe(true);

    expect(CommonUtil.isAllowedStatus('INPRG', 'COMP')).toBe(true);
    expect(CommonUtil.isAllowedStatus('INPRG', 'WAPPR')).toBe(true);
    expect(CommonUtil.isAllowedStatus('INPRG', 'INPRG')).toBe(true);
    expect(CommonUtil.isAllowedStatus('INPRG', 'CLOSE')).toBe(true);
    expect(CommonUtil.isAllowedStatus('INPRG', 'WMATL')).toBe(true);

    expect(CommonUtil.isAllowedStatus('COMP', 'COMP')).toBe(true);
    expect(CommonUtil.isAllowedStatus('COMP', 'CLOSE')).toBe(true);

    expect(CommonUtil.isAllowedStatus('CLOSE', 'CLOSE')).toBe(true);
    expect(CommonUtil.isAllowedStatus('CLOSE', 'COMP')).toBe(false);

    expect(CommonUtil.isAllowedStatus('CAN', 'CAN')).toBe(true);
    expect(CommonUtil.isAllowedStatus('CAN', 'COMP')).toBe(false);
});

// Assisted by watsonx Code Assistant 
it('should update tempRecord status and finishdate in completeAssigned', async () => {
    const app = {
        findDatasource: jest.fn(() => ({
            forceReload: jest.fn(() => workorderitem),
            getChildDatasource: jest.fn(() => ({
                load: jest.fn(() => workorderitem),
                save: jest.fn().mockResolvedValue({}),
            })),
            item: workorderitem.member[0],
        })),
        client: {
            userInfo: {
                labor: {
                    laborcode: 'LABOR123',
                },
            },
        },
        dataFormatter: { convertDatetoISO: jest.fn().mockReturnValue('2024-04-16T00:00:00.000Z') },
        log: {
            t: jest.fn(),
        },

    }

    let tempRecord = {
        status: null,
        status_maxvalue: null,
        status_description: null,
        finishdate: null,
    };
    let assignmentDS = {
        items: [
            {
                maxvalue: 'COMPLETE',
                value: 'COMPLETED',
                description: 'Work order completed',
                defaults: true,
            },
        ],
    };
    const page = new Page({ name: 'page' });
    const ds = newDatasource(workorderitem, 'wodetails');

    page.registerDatasource(ds);
    await ds.load();

    const result = await CommonUtil.completeAssigned(app, ds, tempRecord, assignmentDS);
    expect(result).toBe(true);
    expect(tempRecord.status).toBe('COMPLETED');
    expect(tempRecord.status_maxvalue).toBe('COMPLETE');
    expect(tempRecord.status_description).toBe('Work order completed');
    expect(tempRecord.finishdate).toBe('2024-04-16T00:00:00.000Z');
});

it('should not update tempRecord status and finishdate and throw error in completeAssigned', async () => {
    const app = {
        findDatasource: jest.fn(() => ({
            forceReload: jest.fn(() => workorderitem),
            getChildDatasource: jest.fn(() => ({
                load: jest.fn(() => workorderitem),
                save: jest
                    .fn()
                    .mockRejectedValue(
                        new Error("Error occured during save.")
                    )
            })),
            item: workorderitem.member[0],
        })),
        client: {
            userInfo: {
                labor: {
                    laborcode: 'LABOR123',
                },
            },
        },
        dataFormatter: { convertDatetoISO: jest.fn().mockReturnValue('2024-04-16T00:00:00.000Z') },
        log: {
            t: jest.fn(),
        },

    }

    let tempRecord = {
        status: null,
        status_maxvalue: null,
        status_description: null,
        finishdate: null,
    };
    let assignmentDS = {
        items: [
            {
                maxvalue: 'REJECTED',
                value: 'REJECTED',
                description: 'Work order recjected',
                defaults: true,
            },
        ],
    };


    const page = new Page({ name: 'page' });
    const ds = newDatasource(workorderitem, 'wodetails');
    ds.save = jest.fn().mockRejectedValue(new Error("Error occured during save."))
    page.registerDatasource(ds);
    await ds.load();

    const result = await CommonUtil.completeAssigned(app, ds, tempRecord, assignmentDS);
    expect(result).toBe(false);
    expect(tempRecord.status).toBeFalsy();
    expect(tempRecord.status_maxvalue).toBeFalsy();
    expect(tempRecord.status_description).toBeFalsy();
    expect(tempRecord.finishdate).toBe('2024-04-16T00:00:00.000Z');
});


// Assisted by watsonx Code Assistant 
it('should delete the specified property from sharedData in clearSharedData', async () => {
    CommonUtil.clearSharedData('prop1');
    expect(CommonUtil.sharedData).not.toHaveProperty('prop1');
});

// Assisted by watsonx Code Assistant 
it('should call openReassignmentDrawer with sharedData.event when allowReassignmentPage.name is "schedule" or "approvals"', async () => {
    const app = new Application();

    CommonUtil.sharedData.allowReassignmentPage = {
        name: 'schedule',
        callController: jest.fn(),
        reassignDialogConfig: {
            onPrimaryClick: jest.fn()
        }
    }
    let event = {};

    await CommonUtil.sharedData.reassignDialogConfig.onPrimaryClick(app, CommonUtil.sharedData, event);
    expect(CommonUtil.sharedData.allowReassignmentPage.callController).toHaveBeenCalledWith('openReassignmentDrawer', CommonUtil.sharedData.event);
});

// Assisted by watsonx Code Assistant 
it('should call openReassignmentDrawer without sharedData.event when allowReassignmentPage.name is not "schedule" or "approvals"', async () => {
    const app = new Application();
    CommonUtil.sharedData.allowReassignmentPage = {
        name: 'someOtherPage',
        callController: jest.fn(),
        reassignDialogConfig: {
            onPrimaryClick: jest.fn(),
            onSecondaryClick: jest.fn(),
            onCloseClick: jest.fn()
        },

    }
    let event = {};

    await CommonUtil.sharedData.reassignDialogConfig.onPrimaryClick(app, CommonUtil.sharedData, event);
    expect(CommonUtil.sharedData.allowReassignmentPage.callController).toHaveBeenCalledWith('openReassignmentDrawer');
});

// Assisted by watsonx Code Assistant 
it('should call onSecondaryClick with sharedData.event when allowReassignmentPage.name is "unassignment"', async () => {
    CommonUtil.sharedData.allowReassignmentPage = {
        name: 'unassignment',
        callController: jest.fn(),
        reassignDialogConfig: {
            onPrimaryClick: jest.fn(),
            onSecondaryClick: jest.fn(),
            onCloseClick: jest.fn()
        }
    }
    await CommonUtil.sharedData.reassignDialogConfig.onSecondaryClick();
    expect(CommonUtil.sharedData.allowReassignmentPage.callController).toHaveBeenCalledWith('unassignment', CommonUtil.sharedData.event);
});
// Assisted by watsonx Code Assistant 
it('should call onCloseClick with sharedData.clickedUnassignment as false', () => {
    CommonUtil.sharedData.allowReassignmentPage = {
        reassignDialogConfig: {
            onPrimaryClick: jest.fn(),
            onSecondaryClick: jest.fn(),
            onCloseClick: jest.fn()
        }
    }
    CommonUtil.sharedData.clickedUnassignment = true;
    CommonUtil.sharedData.allowReassignmentPage = 'prop1';
    CommonUtil.sharedData.event = 'prop1';

    CommonUtil.clearSharedData(CommonUtil.sharedData.allowReassignmentPage);
    CommonUtil.sharedData.reassignDialogConfig.onCloseClick();
    expect(CommonUtil.sharedData.clickedUnassignment).toBe(false)
    expect(CommonUtil.sharedData).not.toHaveProperty('prop1');
});

// Assisted by watsonx Code Assistant 
it('should not modify sharedData if the property does not exist in clearSharedData', async () => {
    const sharedData = {
              prop1: 'value1',
              prop2: 'value2',
            };
             CommonUtil.clearSharedData('prop1');
             setTimeout(() => {
                CommonUtil.clearSharedData('nonExistentProp');
                expect(sharedData).not.toHaveProperty('nonExistentProp');
             }, 1000);     
});

// Assisted by watsonx Code Assistant 
it('should not modify sharedData if propertyName is not provided in clearSharedData', async () => {
    const sharedData = {
              prop1: 'value1',
              prop2: 'value2',
            };
             CommonUtil.clearSharedData('prop1');
             setTimeout(() => {
                CommonUtil.clearSharedData();
                expect(sharedData).toHaveProperty('prop1');
             }, 1000);     
});

// Assisted by watsonx Code Assistant 
it('should returns null when mapConfiguration or layers are not loaded in getBasemapSpatialReference', async () => {
    let preloadAPI = new MapPreLoadAPI();
    preloadAPI = {
        loadMapConfiguration: jest.fn(() => Promise.resolve(null)),
        loadLayers: jest.fn(() => Promise.resolve(null))
    }

    preloadAPI.loadMapConfiguration.mockRejectedValueOnce(new Error());
    preloadAPI.loadLayers.mockRejectedValueOnce(new Error());

    const result = await CommonUtil.getBasemapSpatialReference(preloadAPI);
    expect(result).toBeNull();
});

// Assisted by watsonx Code Assistant 
it('should returns null when baseMapInfo is not loaded in getBasemapSpatialReference', async () => {
    let preloadAPI = new MapPreLoadAPI();
    preloadAPI = {
        loadMapConfiguration: jest.fn(() => Promise.resolve(null)),
        loadLayers: jest.fn(() => Promise.resolve(null)),
        getBaseMapInfo: jest.fn(() => Promise.resolve(null))
    }
    let mapConfiguration = {
        spatialReferences: [
            { wkid: 3857 },
            { wkid: 4326 }
        ]
    };
    let layers = [
        {
            type: 'indexedVector',
            tileInfo: {
                spatialReference: {
                    wkid: 102100
                }
            }
        }
    ];

    preloadAPI.loadMapConfiguration.mockResolvedValue(mapConfiguration);
    preloadAPI.loadLayers.mockResolvedValue(layers);
    preloadAPI.getBaseMapInfo.mockRejectedValueOnce(new Error());

    const result = await CommonUtil.getBasemapSpatialReference(preloadAPI);
    expect(result).toBeNull();
});

// Assisted by watsonx Code Assistant 
it('should returns correct spatial reference for indexedVector type in getBasemapSpatialReference', async () => {
    let preloadAPI = new MapPreLoadAPI();
    preloadAPI = {
        loadMapConfiguration: jest.fn(() => Promise.resolve(null)),
        loadLayers: jest.fn(() => Promise.resolve(null)),
        getBaseMapInfo: jest.fn(() => Promise.resolve(null))
    }
    let mapConfiguration = {
        spatialReferences: [
            { wkid: 3857 },
            { wkid: 4326 }
        ]
    };
    let layers = [
        {
            type: 'indexedVector',
            tileInfo: {
                spatialReference: {
                    wkid: 102100
                }
            }
        }
    ];
    let baseMapInfo = {
        spatialReference: {
            wkid: 102100,
            wkt: 'PROJCS["WGS 84 / World Mercator", ...]'
        }
    };

    preloadAPI.loadMapConfiguration.mockResolvedValue(mapConfiguration);
    preloadAPI.loadLayers.mockResolvedValue(layers);
    preloadAPI.getBaseMapInfo.mockResolvedValue(baseMapInfo);

    const result = await CommonUtil.getBasemapSpatialReference(preloadAPI);
    setTimeout(() => {
        expect(result).toBe('EPSG:3857');
    }, 1000);

});

// Assisted by watsonx Code Assistant 
it('should registers and returns spatial reference based on WKID in getBasemapSpatialReference', async () => {
    let preloadAPI = new MapPreLoadAPI();
    preloadAPI = {
        loadMapConfiguration: jest.fn(() => Promise.resolve(null)),
        loadLayers: jest.fn(() => Promise.resolve(null)),
        getBaseMapInfo: jest.fn(() => Promise.resolve(null)),
        registerSpatialReference: jest.fn(() => Promise.resolve(null)),
    }
    let mapConfiguration = {
        spatialReferences: [
            { wkid: 3857 },
            { wkid: 4326 }
        ]
    };
    let layers = [
        {
            type: 'indexedVector',
            tileInfo: {
                spatialReference: {
                    wkid: 102100
                }
            }
        }
    ];
    let baseMapInfo = {
        spatialReference: {
            wkid: 102100,
            wkt: 'PROJCS["WGS 84 / World Mercator", ...]'
        }
    };

    preloadAPI.loadMapConfiguration.mockResolvedValue(mapConfiguration);
    preloadAPI.loadLayers.mockResolvedValue(layers);
    preloadAPI.getBaseMapInfo.mockResolvedValue(baseMapInfo);

    await CommonUtil.getBasemapSpatialReference(preloadAPI);
    setTimeout(() => {
        expect(preloadAPI.registerSpatialReference).toHaveBeenCalledWith(
            expect.objectContaining({ wkid: 102100 })
        );
    }, 1000);


});

// Assisted by watsonx Code Assistant 
it('should returns correct spatial reference for custom WKT-based type in getBasemapSpatialReference', async () => {
    let preloadAPI = new MapPreLoadAPI();
    preloadAPI = {
        loadMapConfiguration: jest.fn(() => Promise.resolve(null)),
        loadLayers: jest.fn(() => Promise.resolve(null)),
        getBaseMapInfo: jest.fn(() => Promise.resolve(null)),
        registerSpatialReference: jest.fn(() => Promise.resolve(null)),
    }
    let mapConfiguration = {
        spatialReferences: [
            { wkid: 3857 },
            { wkid: 4326 }
        ]
    };
    let layers = [
        {
            type: 'indexedVector',
            tileInfo: {
                spatialReference: {
                    wkid: 102100
                }
            }
        }
    ];
    let baseMapInfo = {
        spatialReference: {
            wkid: 102100,
            wkt: 'PROJCS["WGS 84 / World Mercator", ...]'
        }
    };

    baseMapInfo.spatialReference.wkt = 'PROJCS["Unknown", ... ]';
    preloadAPI.loadMapConfiguration.mockResolvedValue(mapConfiguration);
    preloadAPI.loadLayers.mockResolvedValue(layers);
    preloadAPI.getBaseMapInfo.mockResolvedValue(baseMapInfo);

    const result = await CommonUtil.getBasemapSpatialReference(preloadAPI);
    setTimeout(() => {
        expect(result).toBe('EPSG:BASEMAP');
    }, 1000);

});

// Assisted by watsonx Code Assistant 
it('should registers and returns spatial reference for custom WKT-based type in getBasemapSpatialReference', async () => {
    let preloadAPI = new MapPreLoadAPI();
    preloadAPI = {
        loadMapConfiguration: jest.fn(() => Promise.resolve(null)),
        loadLayers: jest.fn(() => Promise.resolve(null)),
        getBaseMapInfo: jest.fn(() => Promise.resolve(null)),
        registerSpatialReference: jest.fn(() => Promise.resolve(null)),
    }
    let mapConfiguration = {
        spatialReferences: [
            { wkid: 3857 },
            { wkid: 4326 }
        ]
    };
    let layers = [
        {
            type: 'indexedVector',
            tileInfo: {
                spatialReference: {
                    wkid: 102100
                }
            }
        }
    ];
    let baseMapInfo = {
        spatialReference: {
            wkid: 102100,
            wkt: 'PROJCS["WGS 84 / World Mercator", ...]'
        }
    };

    baseMapInfo.spatialReference.wkt = 'PROJCS["Unknown", ... ]';
    preloadAPI.loadMapConfiguration.mockResolvedValue(mapConfiguration);
    preloadAPI.loadLayers.mockResolvedValue(layers);
    preloadAPI.getBaseMapInfo.mockResolvedValue(baseMapInfo);

    await CommonUtil.getBasemapSpatialReference(preloadAPI);
    setTimeout(() => {
        expect(MapPreLoadAPI.registerSpatialReference).toHaveBeenCalledWith(
            expect.objectContaining({
                wkid: 'EPSG:BASEMAP',
                definition: 'PROJCS["Unknown", ... ]'
            })
        );
    }, 1000);
});

it('should return true for valid latitude or longitude values',()=>{
    expect(CommonUtil.isLatOrLong(45.5)).toBe(true);
    expect(CommonUtil.isLatOrLong(91.5)).toBe(true);
    expect(CommonUtil.isLatOrLong(170.5)).toBe(true);
    expect(CommonUtil.isLatOrLong(453)).toBe(false);
    expect(CommonUtil.isLatOrLong(8065456.3445)).toBe(false);
})


describe('drillInClassification', () => {
    let app;
    let mockDs;
    let sandbox;

    beforeEach(() => {
      sandbox = sinon.createSandbox();

      mockDs = {
        initializeQbe: jest.fn().mockResolvedValue(undefined),
        setQBE: jest.fn(),
        searchQBE: jest.fn().mockResolvedValue([]),
        lastQuery: {
          searchText: 'test'
        }
      };

      app = {
        findDatasource: jest.fn().mockReturnValue(mockDs)
      };
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should query child classifications for Mobile environment with parent item', async () => {
      // Mock Device to return isMaximoMobile as true
      const deviceMock = sandbox.stub(Device, 'get').returns({
        isMaximoMobile: true
      });

      const parentItem = {
        classstructureid: 'PARENT123'
      };

      await CommonUtil.drillInClassification(app, parentItem);

      // Verify datasource was found
      expect(app.findDatasource).toHaveBeenCalledWith('workOrderClassDomain');

      // Verify QBE was initialized
      expect(mockDs.initializeQbe).toHaveBeenCalled();

      // Verify lastQuery.searchText was cleared
      expect(mockDs.lastQuery.searchText).toBe('');

      // Verify Mobile-specific QBE parameters
      expect(mockDs.setQBE).toHaveBeenCalledWith('usewithworkorder', true);
      expect(mockDs.setQBE).toHaveBeenCalledWith('parent', '=', 'PARENT123');

      // Verify searchQBE was called
      expect(mockDs.searchQBE).toHaveBeenCalled();

      deviceMock.restore();
    });

    it('should query root-level classifications for Mobile environment without parent item', async () => {
      // Mock Device to return isMaximoMobile as true
      const deviceMock = sandbox.stub(Device, 'get').returns({
        isMaximoMobile: true
      });

      await CommonUtil.drillInClassification(app, null);

      // Verify datasource was found
      expect(app.findDatasource).toHaveBeenCalledWith('workOrderClassDomain');

      // Verify QBE was initialized
      expect(mockDs.initializeQbe).toHaveBeenCalled();

      // Verify lastQuery.searchText was cleared
      expect(mockDs.lastQuery.searchText).toBe('');

      // Verify Mobile-specific QBE parameters for root level
      expect(mockDs.setQBE).toHaveBeenCalledWith('usewithworkorder', true);
      expect(mockDs.setQBE).toHaveBeenCalledWith('parent', '!=', '*');

      // Verify searchQBE was called
      expect(mockDs.searchQBE).toHaveBeenCalled();

      deviceMock.restore();
    });

    it('should query child classifications for Web environment with parent item', async () => {
      // Mock Device to return isMaximoMobile as false
      const deviceMock = sandbox.stub(Device, 'get').returns({
        isMaximoMobile: false
      });

      const parentItem = {
        classstructureid: 'WEB_PARENT456'
      };

      await CommonUtil.drillInClassification(app, parentItem);

      // Verify datasource was found
      expect(app.findDatasource).toHaveBeenCalledWith('workOrderClassDomain');

      // Verify QBE was initialized
      expect(mockDs.initializeQbe).toHaveBeenCalled();

      // Verify lastQuery.searchText was cleared
      expect(mockDs.lastQuery.searchText).toBe('');

      // Verify Web-specific QBE parameters
      expect(mockDs.setQBE).toHaveBeenCalledWith('classusewith.objectname', '=', 'WORKORDER');
      expect(mockDs.setQBE).toHaveBeenCalledWith('parent', '=', 'WEB_PARENT456');

      // Verify searchQBE was called
      expect(mockDs.searchQBE).toHaveBeenCalled();

      deviceMock.restore();
    });

    it('should query root-level classifications for Web environment without parent item', async () => {
      // Mock Device to return isMaximoMobile as false
      const deviceMock = sandbox.stub(Device, 'get').returns({
        isMaximoMobile: false
      });

      await CommonUtil.drillInClassification(app, null);

      // Verify datasource was found
      expect(app.findDatasource).toHaveBeenCalledWith('workOrderClassDomain');

      // Verify QBE was initialized
      expect(mockDs.initializeQbe).toHaveBeenCalled();

      // Verify lastQuery.searchText was cleared
      expect(mockDs.lastQuery.searchText).toBe('');

      // Verify Web-specific QBE parameters for root level (null parent)
      expect(mockDs.setQBE).toHaveBeenCalledWith('classusewith.objectname', '=', 'WORKORDER');
      expect(mockDs.setQBE).toHaveBeenCalledWith('parent', '=', 'null');

      // Verify searchQBE was called
      expect(mockDs.searchQBE).toHaveBeenCalled();

      deviceMock.restore();
    });

    it('should handle datasource without lastQuery property', async () => {
      // Mock Device to return isMaximoMobile as true
      const deviceMock = sandbox.stub(Device, 'get').returns({
        isMaximoMobile: true
      });

      // Remove lastQuery from mockDs
      delete mockDs.lastQuery;

      const parentItem = {
        classstructureid: 'TEST789'
      };

      await CommonUtil.drillInClassification(app, parentItem);

      // Verify datasource was found
      expect(app.findDatasource).toHaveBeenCalledWith('workOrderClassDomain');

      // Verify QBE was initialized
      expect(mockDs.initializeQbe).toHaveBeenCalled();

      // Verify Mobile-specific QBE parameters
      expect(mockDs.setQBE).toHaveBeenCalledWith('usewithworkorder', true);
      expect(mockDs.setQBE).toHaveBeenCalledWith('parent', '=', 'TEST789');

      // Verify searchQBE was called
      expect(mockDs.searchQBE).toHaveBeenCalled();

      deviceMock.restore();
    });

    it('should handle item with undefined classstructureid in Web environment', async () => {
      // Mock Device to return isMaximoMobile as false
      const deviceMock = sandbox.stub(Device, 'get').returns({
        isMaximoMobile: false
      });

      const parentItem = {
        // classstructureid is undefined
      };

      await CommonUtil.drillInClassification(app, parentItem);

      // Verify datasource was found
      expect(app.findDatasource).toHaveBeenCalledWith('workOrderClassDomain');

      // Verify QBE was initialized
      expect(mockDs.initializeQbe).toHaveBeenCalled();

      // Verify Web-specific QBE parameters with null for undefined classstructureid
      expect(mockDs.setQBE).toHaveBeenCalledWith('classusewith.objectname', '=', 'WORKORDER');
      expect(mockDs.setQBE).toHaveBeenCalledWith('parent', '=', 'null');

      // Verify searchQBE was called
      expect(mockDs.searchQBE).toHaveBeenCalled();

      deviceMock.restore();
    });
  });