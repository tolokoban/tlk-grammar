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
                        expect(grammar.match(src)).toEqual(true);
                    });
                });
            }
            if (Array.isArray(no)) {
                no.forEach(function (src) {
                    it('should NOT match "' + src + '"', function() {
                        expect(grammar.match(src)).toEqual(false);
                    });
                });
            }
        }

        describe('with "eof"', function() {
            check($.EOF, [''], ['k']);
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
        var RESULT = {};

        var spc = $('spc').x0n($.char(' \t\n\r'));
        var digit = $('digit').char('0','9').fire('digit');
        var number = $('number').and($.x1n(digit), spc)
            .init({n: 0})
            .listen({
                digit: function(v) {
console.log('Catch "digit" with value: ', v);                    
                    this.n = (v.charCodeAt(0) - 48) + this.n * 10;
console.log(this);                    
                }
            })
            .fire(function() {
console.info("[scanner.spec] this.n=...", this.n);
                return {id: 'number', val: this.n};
            });
        var list = $('list').and(spc, $.x0n(number))
            .listen({
                number: function(v) {
                    RESULT.value = v;
                }
            });
        it('should return 13', function() {
            list.match('13');
            expect(RESULT.value).toBe(13);
        });
    });
});
