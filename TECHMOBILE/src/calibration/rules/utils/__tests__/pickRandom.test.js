import pickRandom from "../pickRandom.js";

describe("utils/pickRandom", () => {
  it("Should return object based on the selected list keys", async () => {
    // Arrange
    const arr = ["A", "B", "C"];

    // Act
    const picked = pickRandom(arr);

    // Assert
    expect(arr.includes(picked)).toEqual(true);
  });

  it("Should return undefined when argument is not passed", async () => {
    // Arrange
    // Act
    const picked = pickRandom();

    // Assert
    expect(picked).toEqual(null);
  });

  it("Should return null when argument is not an array", async () => {
    // Arrange
    // Act
    const picked = pickRandom("gibberish");

    // Assert
    expect(picked).toEqual(null);
  });
});
