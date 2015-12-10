var $ = require("../src/scanner");


describe('Grammar for modules', function() {
    var CTX = {require: [], _: []};

    var spc = $.x0n($.char(' \t\n\r'));
    var comment1 = $.and($.word('/*'), $.until('*/'), $.word('*/'));
    var comment2 = $.and($.word('//'), $.until('\n'), $.word('\n'));
    var comment = $.or(comment1, comment2);
    var garbage = $.x0n($.or(comment1, comment2, spc));
    var stringListener = {
        init: function() {
            CTX.string = '';
        },
        content: function(v) {                
            if (v.charAt(0) == '\\') {
                // Skip the backslash.
                v = v.charAt(1);
            }
            CTX.string += v;
        }
    };
    var string1 = $.and(
        $.char('"').fire('init'), 
        $.x0n(
            $.or(
                $.word('\\"').fire('content'),
                $.charNot('"').fire('content')
            )
        ).listen(stringListener),
        $.char('"')
    );
    var string2 = $.and(
        $.char("'").fire('init'), 
        $.x0n(
            $.or(
                $.word("\\'").fire('content'),
                $.charNot("'").fire('content')
            )
        ).listen(stringListener),
        $.char("'")
    );
    var string = $.or(string1, string2);
    var req = $.and(
        $.regexp('[^a-zA-Z\\._$]require\\s*\(\\s*'),
        garbage,
        string,
        garbage,
        $.char(')')
    ).fire('require');
    var _ = $.and(
        $.regexp('_\s*\(\s*'),
        garbage,
        string,
        garbage,
        $.char(',)')
    ).fire('_');
    var module = $.x0n(
        $.or(
            garbage,
            req,
            _,
            $.charAny()
        )
    );


});
