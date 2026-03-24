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

import ScheduleWOListController from './ScheduleWOListController';
import {Application, Page} from '@maximo/maximo-js-api';

it("should Set the current page to schedule", async () => {
  const controller = new ScheduleWOListController();
  const app = new Application();
  const schedule = new Page({ name: "schedule" });
  const schedulewolist = new Page({ name: "schedulewolist" });
  app.registerController(controller);
  app.registerPage(schedule);
  app.registerPage(schedulewolist);
  await app.initialize();
  controller.pageResumed(schedulewolist, app);
  expect(app.currentPage.name).toEqual("schedule");

  app.setCurrentPage("schedulewolist");
  window.setTimeout(() => {
    expect(app.currentPage.state.selectedSwitch).toBe(0);
  }, 1);
});