var $ = require("../src/scanner");

describe('Scanner.word(w1, w2, ...)', function() {
    [
        ['for', 'formidable'],
        [[',', ';', '.'], ', I ; you.'],
        [[',', ';', '.'], '; I, you.', ';'],
        [['for', 'next', 'return'], 'for', 'for'],
        [['for', 'next', 'return'], 'next', 'next'],
        [['for', 'next', 'return'], 'return', 'return'],
        [['for', 'next', 'return'], 'prout', false]
    ].forEach(function (item) {
        var words = item[0];
        var text = item[1];
        var expected = item[2];

        if (!Array.isArray(words)) {
            words = [words];
        }
        if (typeof expected === 'undefined') {
            expected = words[0];
        }

        it('should match `' + text + '` for words ' + JSON.stringify(words), function() {
            var matcher = $();
            $.Scanner.prototype.word.apply(matcher, words);
            var result = matcher.match(text);
            expect(result).toBe(expected);
        });
    });
});
