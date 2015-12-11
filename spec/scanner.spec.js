var $ = require("../src/scanner");


describe('Scanner', function() {
    describe('syntax checking', function() {
        /**
         * @param {object} grammar - the root Scanner to test.
         * @param {array[string]} yes - array of strings that should match.
         * @param {array[string]} no - array of strings that should NOT match.
         */
        function check(grammar, yes, no) {
            if (Array.isArray(yes)) {
                yes.forEach(function (src) {
                    it('should match "' + src + '"', function() {
                        expect(grammar.match(src)).not.toBe(false);
                    });
                });
            }
            if (Array.isArray(no)) {
                no.forEach(function (src) {
                    it('should NOT match "' + src + '"', function() {
                        expect(grammar.match(src)).toBe(false);
                    });
                });
            }
        }

        describe('with "eof"', function() {
            check($.EOF, [''], ['k']);
        });
        describe('with "until"', function() {
            check(
                $.and($.until('A', 'B', 'C'), $.char('ABC'), $.char('X')),
                ['MisterAXisOK', 'MisterBXisNotAnorC', 'FinalCX'],
                ['MisterAgisOK', 'MisterBgisNotAnorC', 'BadBBXnotFound']
            );
        });
        describe('with "char"', function() {
            // Syntax 1.
            check(
                $().char('abc'),
                ['a', 'b', 'c', 'a484554', 'bhevhgdv'],
                ['d', '8', '.', '']
            );
            // Syntax 2.
            check(
                $().char('a', 'z'),
                ['a', 'b', 'z', 'g484554', 'hevhgdv'],
                ['_', '8', '.', '', ' kk']
            );
        });
        describe('with "word"', function() {
            check(
                $().word('dog'),
                ['dog', 'doggy'],
                ['d', 'ogdog', '.', '']
            );
        });
        describe('with simple grammar (digit+, plus, digit+, EOF)', function() {
            var digit = $('digit').char('0123456789');
            var number = $('number').x1n(digit);
            var plus = $('plus').char('+');
            var scanner = $('SCANNER').and(number, plus, number, $.EOF);

            check(
                scanner,
                ['1+1', '0+23', '45+6', '789+987', '666+666'],
                ['', '+', '1', '4545489', '65+', '+448', '65++4', '6+3+', ' 6+3']
            );
        });
    });
    describe('`fire` and `listen`', function() {
        describe('for a little grammar', function() {
            var sep = $('sep').x0n($.char('+ \t\n\r'));
            var digit = $('digit').char('0','9').fire('digit');
            var number = $('number').and($.x1n(digit), sep)
                .init({n: 0})
                .listen({
                    digit: function(v) {
                        this.n = (v.charCodeAt(0) - 48) + this.n * 10;
                    }
                })
                .fire(function() {
                    return {id: 'number', val: this.n};
                });
            var accumulator = $('accumulator').and(sep, $.x0n(number))
                .init({total: 0})
                .listen({ number: function(v) { this.total += v; } });
            [
                ["7", 7],
                ["3141592", 3141592],
                ["4+9", 13],
                ["44+19", 63],
                ["945+2151 +   8712 + 4", 11812],
                [" +  ++  +++ 945++++++++++2151 +  + 4 + 8712", 11812],
                ["   945,2151 +;;,++   4 + 8712  ", 945],
                ["44 + 19 , 85 + 112 + 12", 63],
            ].forEach(function (item) {
                var code = item[0];
                var total = item[1];
                it('should parse "' + code + '" and return ' + total, function() {
                    expect(accumulator.match(code)).toEqual({total: total});
                });
            });
        });
    });
});
