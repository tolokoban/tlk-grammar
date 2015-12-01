var $ = require("../src/scanner");


describe('Scanner', function() {
    describe('with simple grammar', function() {
        var digit = $('digit').char('0123456789');
        var plus = $('plus').char('+');
        
        var scanner = $('SCANNER').and(digit, plus, digit);
        
        it('should match "1+1"', function() {
            expect(scanner.match('1+1')).toEqual(true);
        });
    });
});
