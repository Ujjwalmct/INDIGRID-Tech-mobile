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

import {log, Device} from '@maximo/maximo-js-api';
const TAG = 'FailureDetailsPageController';

class FailureDetailsPageController {
  pageInitialized(page, app) {
    log.t(TAG, 'Page Initialized');
    this.app = app;
    this.page = page;
  }

  /*
   * Called every time the page is being paused or leaving.
   */
  pagePaused() {
    this.page.findDatasource('dsfailureDetailsList').clearSelections();
  }

  /*
   * Method to resume the page
   */
  //istanbul ignore next
  async pageResumed() {
    log.t(TAG, 'Page Resumed ..');
    this.page.dsFailureList = this.app.findDatasource('dsFailureList');
    this.page.state.failureInprogressCount = 0;
  }

  async loadRecord(){
    const workorder = this.page.params.workorder ;
    this.page.state.workorder = workorder ;
    this.page.state.deletFailReportList = [];
    const failureLstDS = this.page.findDatasource('dsfailureDetailsList');
    let reportWorkPage = this.app.findPage('report_work');

    // istanbul ignore else
    if (reportWorkPage && reportWorkPage !== '' && reportWorkPage.findDatasource('woDetailsReportWork')) {
        this.page.woDetailsReportWorkDS = reportWorkPage.findDatasource('woDetailsReportWork');
    }
    
    log.t(TAG, 'loadRecord :: woDetailsReportWorkDS items --> ' + this.page.woDetailsReportWorkDS.items); 
    failureLstDS.clearSelections();

    const placeHolderValues =[{title: this.app.getLocalizedLabel('fail_class_placeholder', 'Failure class'), type: 'FAILURECLASS', type_maxvalue: 'FAILURECLASS'},
                            {title: this.app.getLocalizedLabel('problem_placeholder', 'Problem'), type: 'PROBLEM', type_maxvalue: 'PROBLEM'}, 
                            {title: this.app.getLocalizedLabel('cause_placeholder', 'Cause'), type: 'CAUSE', type_maxvalue: 'CAUSE'},
                            {title: this.app.getLocalizedLabel('remedy_placeholder', 'Remedy'), type: 'REMEDY', type_maxvalue: 'REMEDY'},
                            {title: this.app.getLocalizedLabel('details_placeholder', 'Details'), type: 'Details', type_maxvalue: 'Details'}
                          ];

    let failureListArr = await this.failureListCreation(workorder, placeHolderValues);
    
    //istanbul ignore else
    if(Device.get().isMaximoMobile) {
      let enableIndexCheck = true;
      failureListArr.forEach((element, index) => {
        if((element.type_maxvalue === 'FAILURECLASS' && workorder.failureclassdelete) || (element.type_maxvalue === 'PROBLEM' && workorder.problemdelete) ||
        (element.type_maxvalue === 'CAUSE' && workorder.causedelete) || (element.type_maxvalue === 'REMEDY' && workorder.remedydelete)){
          failureListArr[index].description = '';
          failureListArr[index].failurecode = '';
          failureListArr[index].failurelist = '';
          failureListArr[index].readonly = true;
          failureListArr[index].isLoading = false;
          //istanbul ignore else
          if(enableIndexCheck) {
            failureListArr[index].readonly = false;
            enableIndexCheck = false;
          }
        }
      });
    }
  
    //get the Details data from failureListArr and changed it's readonly flag to false to allow user to click on it directly
    failureListArr[failureListArr.length-1].readonly = false;
    failureListArr =[...failureListArr];
    await failureLstDS.load({src: failureListArr, noCache:true});
    this.page.state.failureListArr = failureListArr;
    
    this.page.state.wofaildate = workorder.faildate;

    this.resetFailureList(failureListArr);

    // set previously set remark and long description
    this.page.state.failureRemark = workorder.remarkdesc ? workorder.remarkdesc : /*istanbul ignore next*/'';
    this.page.state.failureRemarkLongDesc = workorder.remarkdesc_longdescription || '';

    // set maximum length of remark text-area through checking datasource schema
    const workorderDS = this.page.woDetailsReportWorkDS;
    // istanbul ignore else
    if (workorderDS) {
      const remarkDescMaxLength = workorderDS.getFieldSize('remarkdesc');
      const remarkLongDescMaxLength = workorderDS.getFieldSize('remarkdesc_longdescription');
      // istanbul ignore else
      if (remarkDescMaxLength !== -1) {
        this.page.state.failureRemarkMaxLength = remarkDescMaxLength;
      }  
      // istanbul ignore else  
      if (remarkLongDescMaxLength !== -1) {
        this.page.state.failureRemarkLongDescMaxLength = remarkLongDescMaxLength;
      }
    }
  }

  /**
   * Method for preparing and creting failure List and return the same.'
   * @param {workorder} workorder - Pass workorder object from page param data.
   * @param {placeHolderValues} placeHolderValues - Placeholder Array for failure data.
   */
  async failureListCreation(workorder, placeHolderValues) {
    let failureListArr = [];
    let setReadonly = false ;
    let parent = '' ;

    if (workorder?.failurecode?.length){
      failureListArr.push({
        title: placeHolderValues[0].title,
        failurecode: workorder.failurecode,
        description: workorder?.failure?.description,
        failurelistid: 0,
        failurelist: workorder?.failure?.failurelist?.failurelist || workorder.failurelistid,
        type: placeHolderValues[0].type,
        type_description: placeHolderValues[0].title,
        type_maxvalue: placeHolderValues[0].type_maxvalue,
        parent: '',
        orgid: workorder.orgid,
        readonly: false,
        href: workorder.href,
        isLoading : false
      })
    } else {
      failureListArr.push({'title':placeHolderValues[0].title,
        failurelistid: 0,
        failurelist: '',
        type: placeHolderValues[0].type,
        type_description: placeHolderValues[0].title,
        type_maxvalue: placeHolderValues[0].type_maxvalue,  
        failurecode:'',
        description:'',
        parent: '',
        orgid: workorder.orgid,
        readonly: false,
        isLoading : false
      });
      setReadonly = true ;
    }

    let problem;
    let i = 1;

    // check there is problem on failurereport. 
    if (workorder?.failurecode && workorder?.failurereport) {
      problem = workorder.failurereport.find((failurereport) => (failurereport.type_maxvalue === 'PROBLEM'));
    }
      
    // if there is no problem on failurereport, it assumes that problem set on offline mode.
    // istanbul ignore else
    if (!problem) {
      if (workorder?.problemcode?.length > 0) {
        failureListArr.push({
          title: placeHolderValues[1].title,
          failurecode: workorder.problemcode,
          description: workorder.problem.description,
          failurelistid: 1,
          failurelist: workorder.problem.failurelist.failurelist,
          type: placeHolderValues[1].type,
          type_description: placeHolderValues[1].title,
          type_maxvalue: placeHolderValues[1].type_maxvalue,
          parent: '',
          orgid: workorder.orgid,
          readonly: false,
          href: workorder.href,
          isLoading : false
        });
      } else {
        failureListArr.push({'title':placeHolderValues[1].title,
          failurelistid: 1,
          failurelist: '',
          type: placeHolderValues[1].type,
          type_description: placeHolderValues[1].title,
          type_maxvalue: placeHolderValues[1].type_maxvalue,  
          failurecode:'',
          description:'',
          parent: parent,
          orgid: workorder.orgid,
          readonly: setReadonly,
          isLoading : false
        });
        setReadonly = true;
      }
      i = 2;
    }

    // istanbul ignore else
    if (workorder) {
      // istanbul ignore else
      if (workorder.failurereport) {
        const failurelists = [];
        workorder.failurereport.forEach((failurereport) => {
          failurelists.push(failurereport.linenum);
        });

        // get failure information from failure list because there is no failure list information when failure is set on offline mode.
        let dsfailureList = this.page.dsFailureList;
        await dsfailureList.initializeQbe();
        dsfailureList.setQBE('failurelist', 'in', failurelists);
        const failures = await dsfailureList.searchQBE();

        workorder.failurereport.forEach((failurereport) => {
          // ignore deleted record on offline mode.
          // istanbul ignore else
          if (failurereport._action !== "delete") {
            const failure = failures.find((f) => f.failurelist === failurereport.linenum);
            let insertIndex = placeHolderValues.findIndex(record => record.type_maxvalue === failurereport.type_maxvalue);

            if (failure && insertIndex !== -1) {
              // update failure information if failure type already exist in array
              let insertElement = {
                title: failurereport.type_description,
                failurecode: failure.failurecode.failurecode,
                description: failure.failurecode.description,
                failurelistid: insertIndex,
                failurelist: failure.failurelist,
                type: failure.type,
                type_description: failure.type_description,
                type_maxvalue: failure.type_maxvalue,
                orgid: workorder.orgid,
                parent: '',
                href: failurereport.href,
                readonly: false,
                isLoading : false
              }; 
              failureListArr[insertIndex] = insertElement;
              i++;
            }
          }
        });
      }
      
      while(i < 5) {
        failureListArr.push({
          title: placeHolderValues[i].title,
          failurelistid: i,
          failurelist: '',
          type: placeHolderValues[i].type,
          type_description: placeHolderValues[i].title,
          type_maxvalue: placeHolderValues[i].type_maxvalue,
          failurecode:'',
          description:'',
          orgid: workorder.orgid,
          parent: '',
          readonly: i=== failureListArr.length -1 ? false:setReadonly,
          isLoading : false
        });
        setReadonly = true ;
        i++;
      }
    }

    let readOnly = false;
    let parentFailList;
    failureListArr.forEach((element) => {
      element.readonly = readOnly;
      // istanbul ignore else
      if (!element.failurecode) {
        readOnly = true;
      }
      element.parent = parentFailList;
      parentFailList = element.failurelist;
    });
    return failureListArr;
  }

  // istanbul ignore next
  selectFailureDetails(item){
    log.t(TAG, 'selectFailureDetails : event.item --> ' + JSON.stringify(item));
  }
  // Assisted by watsonx Code Assistant 
  /**
   * Opens the failure list for the selected item.
   * @param {object} event - The event object containing the selected item.
   */
  async openFailureList(event){
    log.t(TAG, 'openFailureList : event.item --> ' + JSON.stringify(event));
    // istanbul ignore else
    if (!this.page.state.isFailureSaved && !this.page.state.isfailurelistloaded && this.page.state.failureInprogressCount > 0) {
      log.t(TAG, 'exit openFailureList: --> ');
      return;
    }    
    let failureLstDS = this.page.findDatasource('dsfailureDetailsList');
    let selectedItem = event.item ;
    this.page.state.selectedFailCode = event ;
    
    let dsfailureList = this.page.dsFailureList;
    try {      
      if (selectedItem?.type_maxvalue !== 'Details') {
        dsfailureList.state.loading = false;
        this.page.state.isfailurelistloaded = false;
        await dsfailureList.initializeQbe();
        // istanbul ignore else
        if (selectedItem && !selectedItem.readonly) {
          if (selectedItem.type_maxvalue && selectedItem.type_maxvalue === 'FAILURECLASS') {
            dsfailureList.setQBE('parent', '=', 'null');
          } else {
            dsfailureList.setQBE('parent', '=', selectedItem.parent);
          }
          await dsfailureList.searchQBE(undefined, true);
          this.page.state.isfailurelistloaded = true;
        }

        failureLstDS?.items.forEach(x => {
          x.isLoading = x.failurelistid === event.item.failurelistid;
        });
      }
    } catch (error) {
      this.page.state.isfailurelistloaded = false;
      failureLstDS?.items.forEach(x => {
        x.isLoading = false;
      });
    } finally {
    // istanbul ignore else
    if (!event.noViewChange) {
      if (event.index === 0) {
        this.page.state.splitViewIndex = 1;
      } else {
        this.page.state.splitViewIndex = event.index + 1;
      }
    }
    // istanbul ignore else
    if(event.index !== undefined && event.index < failureLstDS.items.length) {
      failureLstDS.items[event.index]._selected = true;
      failureLstDS.setSelectedItem(failureLstDS.items[event.index], true);
      this.page.state.hideDoneBtn = this.page.state.splitViewIndex > 0 && Device.get().screen.size === 'sm' ? true : false;
      //istanbul ignore if
      if(event.index === 4 && Device.get().isMaximoMobile){
        this.page.state.hideDoneBtn = false;
      }
    }
  }
  }
  // Assisted by watsonx Code Assistant 
  /**
   * Updates the failure list and saves the updated list.
   * @param {object} event - The event object containing failure list details. 
   * @returns {void}
   * @description * Updates the failure list based on the state of the page, saves the updated failure list. 
   */
  async updateAndSaveFailureList(event){
    log.t(TAG, 'updateFailureList : event.item --> ' + JSON.stringify(event));
    // istanbul ignore else
    if (this.page.state.isFailureSaved && !this.page.state.isfailurelistloaded) {
      log.t(TAG, 'exit updateFailureList :--> ');
      return;
    }
    
    if (this.page.state.listLoading) return;
    this.page.state.isFailureSaved = false;  
    this.page.state.listLoading = true; 
    let failureListArray = this.page.state.failureListArr ;
    let selectedID = this.page.state.selectedFailCode.item.failurelistid ;
    let selectedFailureCode = this.page.state.selectedFailCode.item.failurecode ;
    let failureLstDS = this.page.findDatasource('dsfailureDetailsList');
    let selectedFailList ;

    selectedFailList = event.item || event;

    //istanbul ignore else
    if (event.item) {
      let ds = this.app.findDatasource('dsFailureList');
      let index = ds?.items.indexOf(event.item);
      //istanbul ignore if 
      if (index !== -1) {
        ds.items[index].isLoading = true;
      }
    }

    // istanbul ignore else
    if(selectedFailureCode !== selectedFailList.failurecode.failurecode){
      let failLstElement ;
      let tempFailLstElement;
      let elementFound = false ;

      for (const failureListElement of failureListArray) {
        if (failureListElement.failurelistid === selectedID) {
          failLstElement = failureListElement;
          elementFound = true;
          this.page.state.deletFailReportList = [];
        }
        
        if (elementFound) {

          // istanbul ignore else
          if (selectedID === 2 || selectedID === 3) {
            tempFailLstElement = {};
            tempFailLstElement.failurelist = failureListElement.failurelist;
            tempFailLstElement.failurecode = failureListElement.failurecode;
            tempFailLstElement.description = failureListElement.description;
            tempFailLstElement.href = failureListElement.href;
            tempFailLstElement.type = failureListElement.type;
            tempFailLstElement.failurelistid = failureListElement.failurelistid;
            tempFailLstElement.type_maxvalue = failureListElement.type_maxvalue;
            this.page.state.deletFailReportList.push(tempFailLstElement);
          }
          // ************
          failureListElement.failurelist = '';
          failureListElement.failurecode = '';
          failureListElement.description = '';
          failureListElement.href = '';
          failureListElement.parent = '';
        }
      }

      failLstElement.failurecode = selectedFailList.failurecode.failurecode ;
      failLstElement.failurelist = selectedFailList.failurelist ;
      failLstElement.description = selectedFailList.failurecode.description ;
      failLstElement._bulkid     = selectedFailList.failurecode.failurecode ;
      
      let response = await this._saveFailureReport(failLstElement);
      let respHref = '';
      let readOnly = false ;
      let parentFailList ;
        failureListArray.forEach((element) => {
          element.readonly = readOnly;
          // istanbul ignore else
          if(!element.failurecode){
            readOnly = true ;
          }
          element.parent = parentFailList;
          parentFailList = element.failurelist ;
        });

      if(response) {
        failLstElement.href = response;
      }
      // istanbul ignore else
      if (this.page.state.isFailureSaved) {
        log.t(TAG, 'updateFailureList : After Add --> ' + respHref);

        log.t(TAG, 'updateFailureList : failureListArr Updated Item ID--> ' + failLstElement.failurelistid );
        // istanbul ignore else
        if(failLstElement.failurelistid < 4){
          this.openFailureList({"item" : failureListArray[failLstElement.failurelistid +1], "index":selectedID + 1});
        } else if(selectedID === failureListArray.length-1 && Device.get().screen.size === 'sm'){       
            this.page.state.splitViewIndex = 0;
            this.page.state.hideDoneBtn = false;
        }  

        //get the Details data from failureListArr and changed it's readonly flag to false to allow user to click on it directly
        failureListArray[failureListArray.length-1].readonly = false;
        failureListArray =[...failureListArray];     
        await failureLstDS.load({src: failureListArray, noCache:true});
        this.page.state.failureListArr = failureListArray ;

        // istanbul ignore else
        if(selectedID !== undefined && failureLstDS.items.length > 0 && selectedID < 3) {
          failureLstDS.items[selectedID + 1]._selected = true;
          failureLstDS.setSelectedItem(failureLstDS.items[selectedID + 1], true);
        }

      }
    }
    this.page.state.listLoading = false;
  }

  async deleteFailureList(event) {
    log.t(TAG, 'deleteFailureList : event.item --> ' + JSON.stringify(event));
    this.page.state.selectedFailCode = '';
    let failureListArray = this.page.state.failureListArr;
    let selectedID = event.item.failurelistid;
    let failureLstDS = this.page.findDatasource('dsfailureDetailsList');
    let failLstElement = {};
    let elementFound = false ;
    
    log.t(TAG, 'updateFailureList : failureListArr Before Delete --> ' + JSON.stringify(failureListArray));
  
    for (const failure of failureListArray) {
      if (failure.failurelistid === selectedID) {
        this.page.state.deletFailReportList = [];
        failLstElement.failurelist = failure.failurelist;
        failLstElement.failurecode = failure.failurecode;
        failLstElement.description = failure.description;
        failLstElement.href = failure.href;
        failLstElement.type = failure.type;
        failLstElement.type_maxvalue = failure.type_maxvalue;
        failLstElement.failurelistid = failure.failurelistid;

        this.page.state.deletFailReportList.push(failLstElement);
        elementFound = true;
      } else if (elementFound) {
        // Delete all subsequent failreports which are synched with Maximo ..
        failLstElement.failurelist = failure.failurelist;
        failLstElement.failurecode = failure.failurecode;
        failLstElement.description = failure.description;
        failLstElement.href = failure.href;
        failLstElement.type = failure.type;
        failLstElement.type_maxvalue = failure.type_maxvalue;
        failLstElement.failurelistid = failure.failurelistid;
        this.page.state.deletFailReportList.push(failLstElement);
      }
      // ******************
      if (elementFound) {
        failure.failurelist = '';
        failure.failurecode = '';
        failure.description = '';
        failure.href = '';
        failure.parent = '';
      }
    }

    await this._deleteFailureReport();

    let readOnly = false ;
    let parentFailList ;
    failureListArray.forEach((element) => {
      element.readonly = readOnly;
      // istanbul ignore else
      if (!element.failurecode){
        readOnly = true;
      };
      element.parent = parentFailList;
      parentFailList = element.failurelist ;
    });
    
    //get the Details data from failureListArr and changed it's readonly flag to false to allow user to click on it directly
    failureListArray[failureListArray.length-1].readonly = false;
    failureListArray =[...failureListArray];
    failureLstDS.load({src: failureListArray, noCache:true});
    this.page.state.failureListArr = failureListArray ;

    let noViewChange = Device.get().screen.size === 'sm';
    this.openFailureList({'item':failureListArray[event.index],'noViewChange':noViewChange,'index':event.index}); 
  }

  // istanbul ignore next
 async _deleteFailureReport(){
    
    let workorder = this.page.params.workorder ;
    let deleteList = this.page.state.deletFailReportList ;
    let tempItem = {};
    tempItem.wonum = workorder.wonum || undefined;
    tempItem.href = workorder.href ;
    tempItem.siteid = workorder.siteid ;
    let woDS = this.page.woDetailsReportWorkDS ; 
    let tempFailRep;
    let tempFailureReport = [] ;
    let failClassToBeDel = false ;
    let offlineDelete = [];
    let failurePayloadData = [];

    let option = {
      responseProperties: 'wonum,failurereport',
      deleteRecord: true,
      localPayload: {
        href: workorder.href,
        failurereport: failurePayloadData
      }
    }
        
    if (deleteList && deleteList.length > 0) {
      deleteList.forEach((element) => {
        offlineDelete.push(element.type_maxvalue);
        if(element.type_maxvalue && element.type_maxvalue === 'FAILURECLASS'){
          tempItem.failurecode = '';
          failClassToBeDel = true;
        }else if(!failClassToBeDel){
          tempFailRep = {}
          tempFailRep.failurecode = element.failurecode ;
          tempFailRep.href = element.href ;
          tempFailRep._action = "delete";
          tempFailRep.type_maxvalue = element.type_maxvalue;
          tempFailureReport.push(tempFailRep);
          if(element.type_maxvalue === 'PROBLEM') {
            tempItem.problemcode = '';
            option.localPayload.problemcode = '';
            option.localPayload.problem = {
              description: '',
              failurelist: {failurecode: ''}
            }
          }
        }
      });

      if(Device.get().isMaximoMobile) {

        if(failClassToBeDel) {
          option.localPayload.failureclassdelete = true;
          option.localPayload.problemdelete = true;
          option.localPayload.causedelete = true;
          option.localPayload.remedydelete = true;
        }else if(offlineDelete.includes("PROBLEM")) {
          option.localPayload.problemdelete = true;
          option.localPayload.causedelete = true;
          option.localPayload.remedydelete = true;
        }else if(offlineDelete.includes("CAUSE")) {
          option.localPayload.causedelete = true;
          option.localPayload.remedydelete = true;
        } else {
          option.localPayload.remedydelete = true;
        }

        if(tempFailureReport.length === 0) {
          option.localPayload.failurecode = '';
          option.localPayload.failure = { description: ''};
          option.localPayload.problemcode = '';
          option.localPayload.problem = {
            description: '',
            failurelist: {failurecode: ''}
          }
          await woDS.forceReload();
          if(woDS.item.failurereport){
            woDS.item.failurereport.forEach((existing) => {
              failurePayloadData.push({href: existing.href, anywhererefid: existing.anywhererefid, _deleted: true});
            });
          }  
        }else {
          tempFailureReport.forEach((element) => {
            if(woDS.item.failurereport && woDS.item.failurereport.length > 0) {
              woDS.item.failurereport.forEach((existing) => {
                if((typeof existing.failurecode === 'object' && existing.failurecode.failurecode === element.failurecode) || existing.failurecode === element.failurecode) {
                  element.anywhererefid = existing.anywhererefid;
                  element.href = existing.href;
                  failurePayloadData.push({href: existing.href, anywhererefid: existing.anywhererefid, _deleted: true});
                }
              });
            }
            // istanbul ignore else
            if (!this.app.state.networkConnected && element.type_maxvalue === "PROBLEM") {
              element.href = "";
              element.anywhererefid = new Date().getTime();
              failurePayloadData.push({ anywhererefid: element.anywhererefid, _deleted: true });
            }
          });
        }
      }

      option.localPayload.failurereport = failurePayloadData;
      tempItem.failurereport = tempFailureReport;

      log.t(TAG, '_deleteFailureReport :updatdList :  delete updateDS items  --> ' + JSON.stringify(tempItem));
      
      this.page.state.failureInprogressCount += 1;
      // istanbul ignore next
      woDS.update(tempItem, option);
      this.page.state.failureInprogressCount -= 1;
      this.page.state.deletFailReportList= [];
    }
}

  // Assisted by watsonx Code Assistant 
  /**
   * Retrieves an array of deletable failure report objects based on the provided type_maxvalue.
   *
   * @param {string} type_maxvalue - The type of failure report to filter by.
   *                                  Accepted values: 'FAILURECLASS', 'PROBLEM', 'CAUSE', 'REMEDY'.
   * @returns {Array<Object>} - An array of objects representing deletable failure reports.
   *                           Each object has the following properties:
   *                           - _deleted: A boolean indicating that the object is marked for deletion.
   *                           - anywhererefid: The anywhererefid of the failure report (if available).
   *                           - href: The href of the failure report (if available).
   *
   * @example
   * const deletableReports = getDeletableObject('PROBLEM');
   * console.log(deletableReports);
   * // Output: [{ _deleted: true, anywhererefid: 'ref1', href: 'url1' }, ...]
   */
  getDeletableObject(type_maxvalue) {

    const woDS = this.page.woDetailsReportWorkDS;
    const failurereportSize = woDS.item?.failurereport.length;
    const tempFailurereportList = [];
    if (failurereportSize > 0) {

      let deletableType = [];
      if (type_maxvalue === 'FAILURECLASS' || type_maxvalue === 'PROBLEM') {
        deletableType = ['PROBLEM', 'CAUSE', 'REMEDY'];
      } else if (type_maxvalue === 'CAUSE') {
        deletableType = ['CAUSE', 'REMEDY'];
      } else if (type_maxvalue === 'REMEDY') {
        deletableType = ['REMEDY'];
      }

      for (let i = 0; i < failurereportSize; i++) {
        if (deletableType.includes(woDS.item?.failurereport[i]?.type_maxvalue)) {
          const obj = {
            _deleted: true,
          };
          if (woDS.item?.failurereport[i]?.anywhererefid) {
            obj.anywhererefid = woDS.item?.failurereport[i]?.anywhererefid
          }
          if (woDS.item?.failurereport[i].href) {
            obj.href = woDS.item?.failurereport[i].href;
          }
          tempFailurereportList.push(obj);
        }
      }
    }
    return tempFailurereportList;
  }

  // istanbul ignore next
  async _saveFailureReport(failureReport){
    log.t(TAG, '_saveFailureReport :updatdList :  add or update updateDS items  --> ' + JSON.stringify(failureReport));
    
    let workorder = this.app.findDatasource('woDetailds').items.length ? this.app.findDatasource('woDetailds').item : this.page.params.workorder; //DT198011
    let tempItem ;
    let woDS = this.page.woDetailsReportWorkDS ; 
    let tempFailRep = {};
    let tempFailureReport = [] ;
    let tempFailurereportList = [];
    let respHref ;
    let response ;
   
    tempItem = {};
    tempItem.wonum = workorder.wonum || undefined;
    tempItem.href = workorder.href ;
    tempItem.siteid = workorder.siteid ;
    // istanbul ignore next
    let option = {
      localPayload:{href: workorder.href},
      responseProperties: 'failurereport,anywhererefid'
    }
    
    if (failureReport.type_maxvalue === 'FAILURECLASS') {
      tempItem.failurecode = failureReport.failurecode;
      tempItem.failure = {
        description: failureReport.description,
        failurelist: {
          failurelist: failureReport.failurelist
        }
      };
      tempItem.problem= {}
      tempItem.problemcode= "";
      // istanbul ignore else
      if (woDS.item?.failurereport?.length > 0) {
        const deletableObject = this.getDeletableObject(failureReport.type_maxvalue);
        tempFailurereportList.push(...deletableObject);
      }
    } else if (failureReport.type_maxvalue === 'PROBLEM') {
      tempItem.problemcode = failureReport.failurecode;
      tempItem.problem = {
        description: failureReport.description,
        failurelist: {
          failurelist: failureReport.failurelist
        }
      };
      // istanbul ignore else
      if (woDS.item?.failurereport?.length > 0) {
        const deletableObject = this.getDeletableObject(failureReport.type_maxvalue);
        tempFailurereportList.push(...deletableObject);
      }
      if (woDS.currentItem.problem) this.page.state.problemchanged = true;
      if (!workorder.faildate || workorder.faildate === '') {
        tempItem.faildate = this.app.dataFormatter.convertDatetoISO(new Date());
        this.page.state.wofaildate = tempItem.faildate;
      }
    } 
    else if (failureReport.failurecode && failureReport.failurecode !== ""
        && failureReport.type_maxvalue !== "FAILURECLASS") {
        await woDS.forceReload(); // needed to update the failurereportid values on the failure report list
      let tempFailRep = {
        linenum: failureReport.failurelist,
        failurecode: failureReport.failurecode,
        type_description: failureReport.type_description,
        type_maxvalue: failureReport.type_maxvalue,
        anywhererefid: new Date().getTime()
      };
      if (woDS.currentItem?.failurereport && woDS.currentItem?.failurereport?.length) {
        for (let i = 0; i < woDS.currentItem?.failurereport?.length; i++) {
          if (woDS.currentItem?.failurereport[i].type_maxvalue === failureReport.type_maxvalue) {
            await this._deleteFailureReport();
          }
        }
      }
      if (failureReport.href) {
        tempFailRep.href = failureReport.href;
      }
      tempFailureReport.push(tempFailRep);

    }

    tempItem.failurereport = tempFailureReport;

    if (Device.get().isMaximoMobile) {
      if (failureReport.type_maxvalue === 'FAILURECLASS') {
        option.localPayload.failureclassdelete = false;
        option.localPayload.problemdelete = true;
      } else if (failureReport.type_maxvalue === "PROBLEM") {
        option.localPayload.problemdelete = false;
      } else if (failureReport.type_maxvalue === "CAUSE") {
        option.localPayload.causedelete = false;
      } else {
        option.localPayload.remedydelete = false;
      }
      option.localPayload = { ...option.localPayload, ...tempItem };
      // istanbul ignore else
      if (failureReport.type_maxvalue === 'FAILURECLASS' || failureReport.type_maxvalue === 'PROBLEM') {
        option.localPayload['failurereport'] = tempFailurereportList;
        option.localPayload.causedelete = true;
        option.localPayload.remedydelete = true;
      }
    }

    log.t(TAG, '_saveFailureReport :updatdList :  add or update updateDS items  --> ' + JSON.stringify(tempItem));
    
    this.page.state.failureInprogressCount += 1;
    response = await woDS.update(tempItem ,option);
    this.page.state.failureInprogressCount -= 1;
    this.page.state.isFailureSaved = true;
    log.t(TAG, '_saveFailureReport :updatdList :  add or update response  --> ' + JSON.stringify(response));

    let failureReportResponse;

    // istanbul ignore next
    if (!["FAILURECLASS", "PROBLEM"].includes(failureReport.type_maxvalue)) {
      const index = response?.failurereport.findIndex(record => record.type_maxvalue === failureReport.type_maxvalue);
      failureReportResponse = response?.failurereport[index]?.failurereportid;
      const failureListArr = this.page.state.failureListArr;
      if (failureReport.type_maxvalue === 'CAUSE') {
        failureListArr[2].href = response?.failurereport[index].href;
      } else if (failureReport.type_maxvalue === 'REMEDY') {
        failureListArr[3].href = response?.failurereport[index].href;
      }
    }
    // istanbul ignore next
    if (failureReportResponse) {
      tempItem.failurereport[0].failurereportid = failureReportResponse;
      if(!option.localPayload.failurereport){
        option.localPayload = { ...option.localPayload, ...tempItem };
      }
      option.localPayload.failurereport[0].failurereportid = failureReportResponse;
    }

    if(response?.failurereport){
      response.failurereport.forEach((element) => {
        if(element.type_maxvalue === tempFailRep.type_maxvalue){
          respHref = element.href ;
        }
      });
    }    

    return respHref;
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
    * Edit failure date.
    *
    * @returns {void}
    */
  editFailureDate() {
    this.page.state.loading = true;
    this.page.state.splitViewIndex = ++this.page.findDatasource('dsfailureDetailsList').items.length;
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * This function updates the work order details report work data source and navigates to the report work page.
   * @param {object} item - The work order details report work item.
   * @param {string} faildate - The failure date.
   * @returns {Promise<void>} A promise that resolves when the update is complete.
   */
  // istanbul ignore next
  async doneFailureEdit(){
    const woDetailsReportWork = this.page.woDetailsReportWorkDS;
    //Do not go back until items get deleted
    if(this.page.state.failureInprogressCount > 0) {
      this.page.state.savingData = true;
      window.setTimeout(() => {
        this.doneFailureEdit();
      }, 50)
      return;
    }
    const workorder = this.app.findDatasource('woDetailds').items.length ? this.app.findDatasource('woDetailds').item : this.page.params.workorder; //DT198011
    const item = {
      href: workorder.href,
      wonum: workorder.wonum || undefined,
      siteid: workorder.siteid,
      faildate: woDetailsReportWork.item.faildate,
    }
    const option = {
      responseProperties: woDetailsReportWork.baseQuery.select
    };
    await woDetailsReportWork.update(item, option);
    this.page.state.savingData = false;
    this.app.setCurrentPage({
      name: "report_work",
      params: {
        wonum: workorder.wonum || undefined,
        itemhref: workorder.href,
        istask: workorder.istask,
        wogroup: workorder.wogroup,
        taskid: workorder.taskid,
      },
    });   
    // istanbul ignore else
    if(this.app.currentPage) {
      this.page.state.navigateToReportWork = true;
    }
  }

  /**
   * Callback method for when the text-area for remark is changed.'
   */
  setRemarks(event) {
    const curValue = event.currentTarget.value;
    this.page.state.failureRemark = curValue;
    log.t(TAG, 'setRemarks : failureRemark --> ' +  this.page.state.failureRemark);
    this.remarkenterdate = this.app.dataFormatter.currentUserDateTime();
    this.page.changeRemark = true;
  }

  /**
   * Callback method for when the text-area loses focus.'
   */
  async saveRemarks() {
    const workorder = this.page.params.workorder;
    const workorderDS = this.page.woDetailsReportWorkDS; 

    let item = {
      href : workorder.href,
      wonum: workorder.wonum || undefined,
      siteid: workorder.siteid,
      remarkdesc: this.page.state.failureRemark,
      remarkenterdate: this.remarkenterdate
    }

    let option = {
      responseProperties: workorderDS.baseQuery.select
    };

    // istanbul ignore else
    if (this.page.changeRemark) {
      try {
        this.page.state.failureInprogressCount += 1;
        await workorderDS.update(item,option);
        this.page.changeRemark = false;
      } catch(e) {
        /* istanbul ignore next */
        log.t(TAG, 'Error on saving remark : ' + e);
      }
      finally {
        this.page.state.failureInprogressCount -= 1;
      }

      log.t(TAG, 'saveRemarks : failureRemark --> ' +  this.page.state.failureRemark);  
    }
  }

  /**
   * Reset to previous state of the selection/list
   */
  resetFailureList(failureListArray) {
    let event= {};
    let elementFound = false;
    let noViewChange = Device.get().screen.size === 'sm';
    // istanbul ignore else
    if(failureListArray) {
      for (const failureList of failureListArray) {
        // istanbul ignore else
        if(failureList.failurecode === '') {
          event.item = failureList;
          elementFound = true;
          break;
        }
      }
    }

    // istanbul ignore next
    if(!elementFound && failureListArray) {
      event.item = failureListArray[0];
    }
    this.openFailureList({'item':event.item,'index':event.item.failurelistid,'noViewChange':noViewChange});
  }

  /**
   * Update split view state
   */

  // istanbul ignore next
  updateViewState(evt) {
    this.page.state.hideDoneBtn = evt > 0 && Device.get().screen.size === 'sm' ? false : true;
    this.page.state.splitViewIndex = 0;
  }

  /**
   * Callback method for when the text-area for Long Description is changed.'
   */
       setLongDesc(event) {
        const curValue = event.currentTarget.value;
        this.page.state.failureRemarkLongDesc = curValue;
        log.t(TAG, 'setLongDesc : failureRemark --> ' +  this.page.state.failureRemarkLongDesc);
         this.remarkenterdate = this.app.dataFormatter.currentUserDateTime();
        this.page.changeLongRemark = true;
      }

  /**
   * Callback method for when the text-area loses focus.'
   */
   async saveLongDesc() {
    const workorder = this.page.params.workorder;
    const workorderDS = this.page.woDetailsReportWorkDS; 

    // istanbul ignore if
    if(! workorder) return; 
    
    let item = {
      href : workorder.href,
      wonum: workorder.wonum || undefined,
      siteid: workorder.siteid,
      remarkdesc: this.page.state.failureRemark,
      remarkdesc_longdescription: this.page.state.failureRemarkLongDesc,
      remarkenterdate: this.remarkenterdate
    }

    let option = {
      responseProperties: workorderDS.baseQuery.select
    };

    // istanbul ignore else
    if (this.page.changeLongRemark) {
      try {
        this.page.state.failureInprogressCount += 1;
        await workorderDS.update(item,option);
        this.page.changeLongRemark = false;
      } catch(e) {
        /* istanbul ignore next */
        log.t(TAG, 'Error on saving remark : ' + e);
      }
      finally {
        this.page.state.failureInprogressCount -= 1;
      }

      log.t(TAG, 'saveRemarks : failureRemark --> ' +  this.page.state.failureRemarkLongDesc); 
       
    }
  }
  
}

export default FailureDetailsPageController;
