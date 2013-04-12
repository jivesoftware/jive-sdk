var assert = require("assert")

describe("TestHelloWorld", function() {
    it("should be true that 1 == \"1\"", function() {
        assert.equal(1, "1", "Test 1 = \"1\"");
    });

    it("should be true that 1 == 1", function() {
        assert.equal(1, 1, "Test 1 = \"1\"");
    });
});