var firkant = require("../dist/firkantet-frontend.js")

describe("Load firkant", () => {
    test("Should be able to see version number of firkant", () => {
        const v = firkant.version;

        let re = /[0-9]+.[0-9]+.[0-9]+/
        let m = re.test(v);

        expect(m).toEqual(true);

    });
});

describe("Get d3 version", () => {
    test("Should be able to see version number of d3", () => {
        const v = firkant.getD3Version();

        let re = /[0-9]+.[0-9]+.[0-9]+/
        let m = re.test(v);

        expect(m).toEqual(true);
        expect(v).toEqual("5.16.0");

    });

});