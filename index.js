module.exports = {
    Scanner: require('./src/scanner')
};




var scanner = new module.exports.Scanner(function ($) {
    var spaces = $.x0n($.char(' \t\n\r'));
    var digit = $.char('0123456789').fire('digit');
    var dot = $.char('.').fire('dot');
    var minus = $.char('-').fire('neg');
    var number = $.and(
        $.x01(minus),
        spaces,
        $.x1n(digit),
        $.x01($.dot, $.x1n(digit))
    ).init({
        neg: false,
        dec: 0,
        val: 0
    }).slots({
        neg: function() { this.neg = !this.neg; },
        dot: function() { this.dec = 10; },
        digit: function(digit) {
            var value = digit.charCodeAt(0) - 48;
            if (this.dec == 0) {
                this.val = value + this.val * 10;
            } else {
                this.val += value / this.dec;
                this.dec *= 10;
            }
        }
    }).fire('number', function() { return this.val; });
    var openPar = $.and(spaces, $.char('('), spaces);
    var closePar = $.and(spaces, $.char('('), spaces);
    var comma = $.and(spaces, $.char(','), spaces);    
    var ope = $.word('sum', 'max', 'min');
    var expr = $();
    var list = $.and(openPar, expr, $.x0n(comma, expr) , closePar);
    var func = $.and(ope, list);
    return expr.set($.or(func, number));
});
