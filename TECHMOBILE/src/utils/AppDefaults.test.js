
import AppDefaults from './AppDefaults';

const APP_DEFAULTS = {
  workLogType: "!CLIENTNOTE!"
};

describe('AppDefaults', () => {

  beforeEach(() => {
    AppDefaults.defaults = APP_DEFAULTS
  });
  
  it('should have initial defaults', () => {
    expect(AppDefaults.get("workLogType")).to.equal("!CLIENTNOTE!");
  });

  it('should set new defaults', () => {
    AppDefaults.set({defaultKey1: 'defaultVal1'});
    expect(AppDefaults.get("defaultKey1")).to.equal("defaultVal1");
  });

  it('should modify original defaults when setting new defaults', () => {
    AppDefaults.set({defaultKey2: 'defaultVal2'});
    expect(AppDefaults.get("workLogType")).to.equal("!CLIENTNOTE!");
    expect(AppDefaults.get("defaultKey2")).to.equal("defaultVal2");
  });

  it('should return value if key is matched', () => {
    expect(AppDefaults.get("workLogType")).to.equal("!CLIENTNOTE!");
  })

  it('should return whole object if key not match', () => {
    expect(AppDefaults.get("")).to.deep.equal(APP_DEFAULTS);
  })
});