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

/*
This page is created to address a specific issue: when the current page is already
set to "Schedule" and the user clicks on the "My Schedule" tile again, the pageResume 
method is not triggered. To resolve this, the schedulewolist page has been linked 
to the "My Schedule" tile. This ensures that when the tile is clicked, the pageResume 
method of the schedulewolist page is invoked. Within this method, we  set the 
current page to "Schedule", thereby ensuring the desired behavior is consistently executed. */
class ScheduleWOListController {
  /*
   * Method to resume the page
   */
  pageResumed(page, app) {
   window.setTimeout(() => {
     // istanbul ignore else
     if (app.currentPage?.name === "schedule" || app.currentPage?.name === "schedulewolist") {
       app.setCurrentPage("schedule");
       app.currentPage.state.selectedSwitch = 0;
     }
   }, 1);
  }
}
export default ScheduleWOListController;
