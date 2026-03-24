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

import {log} from '@maximo/maximo-js-api';
import MapPreLoadAPI from '@maximo/map-component/build/ejs/framework/loaders/MapPreLoadAPI';
import CommonUtil from "./utils/CommonUtil";
const TAG = 'MapPageController';

class MapPageController {
  pageInitialized(page, app) {
    log.t(TAG, 'Map Page Initialized');
    this.app = app;
    this.page = page;
  }  
  /*
   * Method to resume the page
   */
  async pageResumed(page, app) {
    const isMobileTimer = (app.device.isMaximoMobile) ? 3000 : 1000; 
    window.setTimeout(() => {
      const schPage = (this.app.findPage("schedule")) ? 'schedule' : 'approvals';
      // below istanbul was necessary. Since, this condition is placed inside a setTimeout, its execution in tests has been inconsistent.
      //istanbul ignore next
      if (this.app?.lastPage?.name === 'schedule' && CommonUtil.sharedData) {
        CommonUtil.sharedData.clickedWo = false;
      }
      this.app.setCurrentPage({name:schPage});
      this.app.currentPage.state.selectedSwitch = 1;
      // If map is not configured or valid then user will redirect to list view
      // istanbul ignore else
      if(!this.app.state.isMapValid && this.app.state.mapConfigurationLoaded) {
        window.setTimeout(() => {
          this.app.currentPage.state.selectedSwitch = 0;
        }, isMobileTimer);
      } else if(!this.app.state.mapConfigurationLoaded) {
        this.mapPreloadAPI = new MapPreLoadAPI();
        //istanbul ignore next
        this.mapPreloadAPI.validateMapConfiguration(this.app)
        .then((validMapConfiguration) => {
          this.app.state.isMapValid = validMapConfiguration;
        })
        .catch( error => {
          this.app.state.isMapValid = false
          log.t(TAG, 'validateMapConfiguration: ', error);
        });
        this.app.state.mapConfigurationLoaded = true;
      }
    }, 1);
  }
}
export default MapPageController;
