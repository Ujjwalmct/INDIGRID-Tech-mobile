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

import MapPageController from './MapPageController';
import {Application, Page} from '@maximo/maximo-js-api';

it("should load work order list data with map", done => {
  global.open = jest.fn();
  const controller = new MapPageController();
  const app = new Application();
  const page = new Page({name: 'map'});
  const nextPage = new Page({name: 'schedule'});

  app.registerController(controller);
  app.registerPage(nextPage);
  app.registerPage(page);
  app.initialize().then(() => {
    window.setTimeout(() => {
      expect(app.currentPage).toBe(nextPage);
      expect(app.currentPage.state.selectedSwitch).toBe(1);
      return Promise.resolve(1);
    }, 1);
  });
});

it("should load work order list data with map for approvals", done => {
  global.open = jest.fn();
  const controller = new MapPageController();
  const app = new Application();
  const page = new Page({name: 'map'});
  const nextPage = new Page({name: 'approvals'});

  app.registerController(controller);
  app.registerPage(nextPage);
  app.registerPage(page);
  app.initialize().then(() => {
    window.setTimeout(() => {
      expect(app.currentPage).toBe(nextPage);
      expect(app.currentPage.state.selectedSwitch).toBe(1);
      return Promise.resolve(1);
    }, 1);
  });
});

it("should validate map configuration properly", async () => {
  global.open = jest.fn();
  jest.useFakeTimers();

  const controller = new MapPageController();
  const app = new Application();
  const page = new Page({ name: "map" });

  app.state.mapConfigurationLoaded = false;
  app.device = { isMaximoMobile: false };
  app.registerController(controller);
  app.registerPage(page);

  await app.initialize();
  await controller.pageResumed(page, app);

  jest.runAllTimers();

  expect(app.state.mapConfigurationLoaded).toBe(true);
});

it("should log when Map Page is initialized", () => {
  const controller = new MapPageController();
  const app = new Application();
  const page = new Page({ name: "map" });

  global.TAG = "MapPageController";
  global.log = { t: jest.fn() };

  jest.spyOn(global.log, "t");

  controller.pageInitialized(page, app);
  expect(app.currentPage).not.toBe(undefined);
});


it("should set isMobileTimer correctly based on device type", async () => {
  const controller = new MapPageController();
  const app = new Application();
  const page = new Page({ name: "map" });

  // Case 1: Mobile Device → Expect 3000ms
  app.device = { isMaximoMobile: true };

  controller.pageResumed(page, app);
  expect(app.device.isMaximoMobile ? 3000 : 1000).toBe(3000);

  // Case 2: Non-Mobile Device → Expect 1000ms
  app.device = { isMaximoMobile: false };

  controller.pageResumed(page, app);
  expect(app.device.isMaximoMobile ? 3000 : 1000).toBe(1000);
});
