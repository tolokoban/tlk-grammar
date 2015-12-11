var $ = require("../src/scanner");

describe('Scanner.until(a, b, ...)', function() {
    var check = function(text, expected) {
        var args = [];
        for (var i = 2 ; i < arguments.length ; i++) {
            args.push(arguments[i]);            
        }
        var scanner = $.until.apply({}, args);
        it('should match ' + JSON.stringify(args) + ' against ' + '`' + text + '`', function() {
            expect(scanner.match(text)).toEqual(expected);
        });
    };

    check('Hello world!', 'Hello', ' ');
    check('Hello world!', false, 'H');
    check('Hello world!', false, 'w', 'H');
    check('Hello world!', 'Hell', 'et', 'lord', 'o w', '!', 'world');
});
