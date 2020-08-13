const firkant = require("../index.js")

describe("Load firkant", () => {
    test("Should be able to see version number of firkant", () => {
        const v = firkant.version;

        let re = /[0-9]+.[0-9]+.[0-9]+/
        let m = re.test(v);

        expect(m).toEqual(true);

    });
});