var $ = require("../src/scanner");

describe('Scanner.regexp(rx)', function() {
    [
        ['[0-9A-F]+', '37F'],
        ['[0-9A-F]+', 'prout37Fabi', 'prout37F'],
        ['^[0-9A-F]+', 'prout37Fabi', false],
        ['^\\s*([0-9A-F]+)\\s*', '  2711  ', ['  2711  ', '2711']]
    ].forEach(function (item) {
        var rx = item[0];
        var text = item[1];
        var expected = item[2] || [text];
        if (typeof expected === 'string') expected = [expected];
        it('should match /' + rx + '/', function() {
            var result = $.regexp(rx).match(text);
            if (result !== false && !Array.isArray(result)) {
                fail('Result must be an array!');
            }
            var arr = [];
            if (Array.isArray(result)) {
                result.forEach(function (item) {
                    arr.push(item);
                });
            } else {
                arr = expected;
            }
            expect(arr).toEqual(expected);
        });
    });
});
