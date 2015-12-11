var $ = require("../src/scanner");

describe('Scanner.bof()', function() {
    it('should match empty file', function() {
        expect($.BOF.match('')).toBe(true);
    });
});
