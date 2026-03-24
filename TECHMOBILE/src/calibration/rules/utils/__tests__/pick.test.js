import pick from "../pick.js";

describe("utils/pick", () => {
  it("Should return object based on the selected list keys", async () => {
    // Arrange
    const obj = {
      propA: 1,
      propB: 2,
      propC: 1,
    };

    // Act
    const picked = pick(obj, ["propB"]);

    // Assert
    expect(picked).toEqual({ propB: 2 });
  });

  it("Should return empty object when key list is empty", async () => {
    // Arrange
    const obj = {
      propA: 1,
      propB: 2,
      propC: 1,
    };

    // Act
    const picked = pick(obj, []);

    // Assert
    expect(picked).toEqual({});
  });

  it("Should return object based on the selected list keys", async () => {
    // Arrange
    const obj = {
      propA: 1,
      propB: 2,
      propC: 1,
    };

    // Act
    const picked = pick(obj, ["propD"]);

    // Assert
    expect(picked).toEqual({});
  });

  it("Should return empty object when key list is not an array", async () => {
    // Arrange
    const obj = {
      propA: 1,
      propB: 2,
      propC: 1,
    };

    // Act
    const picked = pick(obj);

    // Assert
    expect(picked).toEqual({});
  });

  it("shouldReturnEmptyObjectWhenObjectIsUndefined", async () => {
    // Arrange
    const obj = undefined;

    // Act
    const picked = pick(obj, ["propA"]);

    // Assert
    expect(picked).toEqual({});
  });
});
