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
import QuickReportController from "./QuickReportController.js";
import {Application, Page} from "@maximo/maximo-js-api";
describe('CreateWorkOrderController', () => {
    it("should open create Workorder page", async () => {
        const controller = new QuickReportController();
        let mockSetPage = jest.fn();
        const app = new Application();
        const page = new Page({ name: "createwo" });
        app.client = {
            userInfo: {
                defaultSite: 'BEDFORD',
                labor: {
                    laborcode: 'wilson'
                }
            }
        }

        app.registerController(controller);
        app.registerPage(page);

        await app.initialize();
        controller.pageInitialized(page, app);

        app.setCurrentPage = mockSetPage;

        await controller.pageResumed();
        await new Promise(res => setTimeout(res, 1000));
     
        expect(mockSetPage.mock.calls.length).toBe(1);
    });

});