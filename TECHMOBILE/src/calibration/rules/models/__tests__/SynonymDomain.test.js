import newTestStub from "../../../../test/AppTestStub.jsx";
import testDomaincalstatusData from "../../../test/test-domaincalstatus-data.js";
import testSynonymdomainData from "../../../test/test-synonymdomain.js";
import SynonymDomain from "../SynonymDomain.js";
import DatasheetConstants from "../../constants/DatasheetConstants";

/** Implementation */
describe("SynonymDomain", () => {
  /**
   * Test suite setup
   * @param {Datasource} synonymdomainData
   * @param {Datasource} statusListDS
   * @returns SynonymDomain
   */
  const setup = (synonymdomainData, changeStatusList) =>
    new SynonymDomain(synonymdomainData, changeStatusList);

  const initializeApp = async () => {
    const app = await newTestStub({
      currentPage: "datasheets",
      datasources: {
        synonymdomainData: {
          data: testSynonymdomainData,
        },
        changeStatusList: {
          data: testSynonymdomainData,
        },
        domaincalstatusds: {
          data: testDomaincalstatusData
        }
      },
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
  describe("setSynonymDS", () => {
    it("Should set property with SynonymDomin datasource", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadSynonymDomainDS(app);

      // Act
      const handler = setup();
      const initialDS = handler.getSynonymDS();

      handler.setSynonymDS(ds);

      const actualDS = handler.getSynonymDS();

      // Assert
      expect(initialDS).toEqual(null);
      expect(actualDS.name).toEqual(ds.name);
    });
  });
  describe("setStatusListDS", () => {
    it("Should set property with SynonymDomin datasource", async () => {
      // Arrange
      const app = await initializeApp();
      const statusListDS = await loadStatusListDS(app);

      // Act
      const handler = setup();
      const initialDS = handler.getStatusListDS();

      handler.setStatusListDS(statusListDS);

      const actualDS = handler.getStatusListDS();

      // Assert
      expect(initialDS).toEqual(null);
      expect(actualDS.name).toEqual(statusListDS.name);
    });
  });
  describe("getSynonymDS", () => {
    it("Should return instance of SynonymDomin datasource", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadSynonymDomainDS(app);
      const statusListDS = await loadStatusListDS(app);

      // Act
      const handler = setup(ds, statusListDS);
      const actualDS = handler.getSynonymDS();

      // Assert
      expect(actualDS.name).toEqual(ds.name);
    });

    it("Should return null when no datasource is provided", () => {
      // Arrange
      // Act
      const handler = setup();
      const actualDS = handler.getSynonymDS();

      // Assert
      expect(actualDS).toEqual(null);
    });
  });
  describe("getStatusListDS", () => {
    it("Should return null when no datasource is provided", () => {
      // Arrange
      // Act
      const handler = setup();
      const actualDS = handler.getStatusListDS();

      // Assert
      expect(actualDS).toEqual(null);
    });
  });

  describe("showFilteredStatus", () => {
    it("Should filter status from synonmdomain data", async () => {
      // Arrange
      const app = await initializeApp();
      const ds = await loadSynonymDomainDS(app);
      const statusListDS = await loadStatusListDS(app);

      // Act
      const handler = setup(ds, statusListDS);
      await handler.showFilteredStatus();

      // Assert
      expect(statusListDS.items.length).toBeGreaterThan(0);
    });
  });

  describe("resolveToDefaultExternal", () => {
    it("Should resolve to default external status value for a given domain cal status", async () => {
      // Arrange
      const app = await initializeApp();
      const domainCalStatusDS = await loadDomainCalStatusDS(app);

      // Act
      const externalStatus = SynonymDomain.resolveToDefaultExternal(domainCalStatusDS, DatasheetConstants.STATUS_PASS);

      // Assert
      expect(externalStatus).toEqual(DatasheetConstants.STATUS_PASS);
    });
  });

  describe("resolveToInternal", () => {
    it("Should resolve to internal status value for a given domain cal status", async () => {
      // Arrange
      const app = await initializeApp();
      const domainCalStatusDS = await loadDomainCalStatusDS(app);

      // Act
      const internalStatus = SynonymDomain.resolveToInternal(domainCalStatusDS, DatasheetConstants.STATUS_ADJTOIMP);

      // Assert
      expect(internalStatus).toEqual(DatasheetConstants.STATUS_ADJTOIMP);
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                                Utils                                       */
  /* -------------------------------------------------------------------------- */

  const loadSynonymDomainDS = async (app) => {
    const synonymdomainData = app.findDatasource("synonymdomainData");
    await synonymdomainData.load();
    return synonymdomainData;
  };
  const loadDomainCalStatusDS = async (app) => {
        const domaincalstatusDS = app.findDatasource("domaincalstatusds");
        await domaincalstatusDS.load();
        return domaincalstatusDS;
    };
  const loadStatusListDS = async (app) => {
    const changeStatusList = app.findDatasource("changeStatusList");
    await changeStatusList.load();
    return changeStatusList;
  };
});
