/** Test */
import newTestStub from "../../../test/AppTestStub.jsx";
import testCalibrationData from "../../test/test-calibration-data.js";

/** Helpers */
import CalibrationHelper from "../CalibrationHelper.js";

/** Implementation */
describe("CalibrationHelper", () => {
    const TEST_WODSNUM = 1011;
  
    const TEST_PLUSCWODSINSTRID = 10111;
  
    /**
     * Test suite setup
     * @param {Datasource} datasheetDS
     * @param {Datasource} calpointsDS
     * @returns
     */
    const setup = (
      datasheetDS,
      calpointsDS,
      assetFunctionDS
    ) =>
      new CalibrationHelper(
        datasheetDS,
        calpointsDS,
        assetFunctionDS,
      );
  
    const initializeApp = async (pluscWoDsData = testCalibrationData) => {
      const app = await newTestStub({
        currentPage: "assetfunctions",
        state: {
          assetFunctionsDetailsDS: "hello",
        },
        onNewState: (state) => {
          return { 
            ...state, 
            dataSheethref: testCalibrationData.href,
            canLoadCalibrationData: true
          }
        },
        datasources: {
          pluscWoDs: {
            data: pluscWoDsData,
          }
        },
        toast: jest.fn(),
        getLocalizedLabel: jest.fn(),
      })();
  
      return app;
    };
  
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    afterEach(() => {
      // Restore the spy created with spyOn
      jest.restoreAllMocks();
    });

/* -------------------------------------------------------------------------- */
  /*                                Test Cases                                  */
  /* -------------------------------------------------------------------------- */

  describe("getCalpointsDS", () => {
    it("Should return instance of calibration point datasource", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);

      // Act
      const helper = setup(ds, calpoints);
      const actualDS = helper.getCalpointsDS();

      // Assert
      expect(actualDS.name).toEqual(calpoints.name);
    });
  });

  describe("getAssetFunctionDS", () => {
    it("Should return instance of asset functions datasource", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);
      const assetfunctions = await loadAssetFunctionDS(ds);
      // Act
      const helper = setup(ds, calpoints);
      const actualDS = helper.getAssetFunctionDS();

      // Assert
      expect(actualDS.name).toEqual(assetfunctions.name);
    });
  });

  describe("getDatasheetDS", () => {
    it("Should return instance of datasheet datasource", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);

      // Act
      const helper = setup(ds, calpoints);
      const actualDS = helper.getDatasheetDS();

      // Assert
      expect(actualDS.name).toEqual(ds.name);
    });
  });

  describe("setCalpointsDS", () => {
    it("Should set property with calpoints datasource", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);
      const calpoints = await loadCalpointsDS(ds, TEST_PLUSCWODSINSTRID);

      // Act
      const helper = setup();

      helper.setCalpointsDS(calpoints);

      const actualDS = helper.getCalpointsDS();

      // Assert
      expect(actualDS.name).toEqual(calpoints.name);
    });
  });

  describe("setDatasheetDS", () => {
    it("Should set property with datasheet datasource", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadDatasheetDS(app, TEST_WODSNUM);

      // Act
      const helper = setup();

      helper.setDatasheetDS(ds);

      const actualDS = helper.getDatasheetDS();

      // Assert
      expect(actualDS.name).toEqual(ds.name);
    });
  });


  /* -------------------------------------------------------------------------- */
  /*                                Utils                                       */
  /* -------------------------------------------------------------------------- */

  const loadDatasheetDS = async (app, wodsnum) => {
    const datasheetDS = app.findDatasource("pluscWoDs");

    await datasheetDS.load({
      qbe: {
        wodsnum,
      },
    });

    return datasheetDS;
  };

  const loadAssetFunctionDS = async (pluscWoDs) =>
    await pluscWoDs.getChildDatasource("pluscwodsinstr", pluscWoDs.currentItem);

  const loadCalpointsDS = async (datasheetDS, pluscwodsinstrid) => {
    const assetFunctionDS = await datasheetDS.getChildDatasource(
      "pluscwodsinstr",
      datasheetDS.currentItem
    );

    await assetFunctionDS.load();

    const item = assetFunctionDS.items.find(
      (item) => item.pluscwodsinstrid === pluscwodsinstrid
    );

    const calpointsDS = await assetFunctionDS.getChildDatasource(
      "pluscwodspoint",
      item
    );

    await calpointsDS.load();

    return calpointsDS;
  };
});
