/**
 * @fileoverview Test suite for the LaborJsonDsLoader module
 * @module LaborJsonDsLoader.test
 * @requires ./LaborJsonDsLoader.js
 * @requires @maximo/maximo-js-api
 * @requires @storybook/test
 * @requires sinon
 */

import loader from "./LaborJsonDsLoader.js";
import {
    JSONDataAdapter,
    Datasource,
    Application
} from "@maximo/maximo-js-api";
import { expect } from "@storybook/test";
import sinon from "sinon";

/**
 * @constant {Object} labors
 * @description Mock labor data used for testing the LaborJsonDsLoader
 * @property {Array} member - Array of labor records
 */
const labors = {
    member: [
      {
        _rowstamp: '14303857',
        laborcode: 'wilson',
        displayname: 'mike wilson',
        orgid: 'EAGLENA',
        siteid: 'BEDFORD',
        laborcraftrate: true,
      },
      {
        _rowstamp: '14303858',
        laborcode: 'Jones',
        displayname: 'Frank Jones',
        orgid: 'EAGLENA',
        siteid: 'BEDFORD',
        laborcraftrate: false,
      },
      {
        _rowstamp: '14303859',
        laborcode: 'Pedrick',
        displayname: 'mike Pedrick',
        orgid: 'EAGLENA',
        siteid: 'BEDFORD',
        laborcraftrate: true,
      },
    ]
  }

/**
 * @description Test suite for the LaborJsonDsLoader module
 */
describe("LaborJsonDsLoader", () => {
    /**
     * @type {Application} app - Maximo JS API Application instance
     * @type {Datasource} laborDs - Labor datasource instance
     */
    let app, laborDs;

    /**
     * @description Set up test environment before each test
     * @function beforeEach
     */
    beforeEach(async () => {
        // Set up the application and datasource mocks
        app = new Application();
        const dataAdapter = new JSONDataAdapter({
            src: labors,
            items: "member",
        });
        laborDs = new Datasource(dataAdapter, {
            idAttribute: "idAttribute",
            name: 'laborDs',
        });
        app.registerDatasource(laborDs);
        await app.initialize();
        sinon.stub(app, "findDatasource").callsFake((name) => {
            if (name === "laborDs") return laborDs;
        });
    });

    /**
     * @description Clean up test environment after each test
     * @function afterEach
     */
    afterEach(() => {
        // Restore all stubs to prevent test pollution
        sinon.restore();
    });

    /**
     * @description Test case: Verify loader returns empty array when datasource is not found
     * @function it
     */
    it("should return empty array when datasource is not found", async () => {
        // Set up a datasource locator that returns undefined
        const datasourceLocator = () => undefined;
        
        // Call the loader function
        const result = await loader({ datasourceLocator});
        
        // Expect an empty array
        expect(result).toEqual([]);
    });

    /**
     * @description Test case: Verify loader returns empty array when datasource has no items
     * @function it
     */
    it("should return empty array when datasource has no items", async () => {
        // Set totalCount to 0
        laborDs.dataAdapter.totalCount = 0;

        // Set up a datasource locator that returns our mock datasource        
        const datasourceLocator = (name) => app.findDatasource(name);
        
        // Call the loader function
        const result = await loader({ datasourceLocator });
        
        // Expect an empty array
        expect(result).toEqual([]);
    });

    /**
     * @description Test case: Verify loader loads unloaded items and filters by laborcraftrate
     * @function it
     */
    it("should load items that are not already loaded", async () => {
        await laborDs.load();
        // Set totalCount to 3
        laborDs.dataAdapter.totalCount = 3;
        const loadSpy = jest.spyOn(laborDs, 'load').mockImplementation((i) => {});
        jest.spyOn(laborDs, 'isItemLoaded').mockImplementation(i => i <= 1);
        jest.spyOn(laborDs, 'get').mockImplementation((i) => {
            return labors.member[i];
        });

        // Set up a datasource locator that returns our mock datasource
        const datasourceLocator = (name) => app.findDatasource(name);
        
        // Call the loader function
        const data = await loader({ datasourceLocator });
        
        // Verify that load was called only once
        expect(loadSpy).toHaveBeenCalledTimes(1);
        // Verify that items are filtered based on laborcraftrate
        expect(data.length).toBe(2);
    });
});

// Made with Bob
