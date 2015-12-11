var $ = require("../src/scanner");
var FS = require("fs");

describe('Grammar for modules', function() {
//  return;
    
    var CTX = {require: [], _: []};

    var stringListener = {
        init: function() {
            CTX.string = '';
        },
        content: function(v) {
        }
    };

    var newString = function(quote) {
        return $.and(
            $.char(quote),
            $.x0n(
                $.or(
                    $.word("\\'").fire('content'),
                    $.charNot(quote).fire('content')
                )
            ),
            $.char(quote)
        ).init({$value: ''}).listen({
            content: function(v) {
                if (v.charAt(0) == '\\') {
                    // Skip the backslash.
                    v = v.charAt(1);
                }
                this.$value += v;
            }
        }).fire('string');
    };

    var spc = $.regexp('[ \t\n\r]+');
    var comment1 = $.and($.word('/*'), $.until('*/'), $.or($.eof(), $.word('*/')));
    var comment2 = $.and($.word('//'), $.until('\n'), $.or($.eof(), $.word('\n')));
    var comment = $('comment').or(comment1, comment2);
    var garbage = $('garbage').x1n($.or(comment1, comment2, spc)).fire('yes');
    var optional_garbage = $('optional garbage').x01(garbage);
    var string = $('string').or(newString('"'), newString("'"));
    var identifier = $('identifier').regexp("[_a-z$0-9\\.]+", "i").fire('no');
    var req = $('require').and(
        $.word('require'),
        optional_garbage,
        $.word('('),
        optional_garbage,
        string,
        optional_garbage,
        $.char(')')
    ).listen({
        yes: null,
        no: null,
        string: function(v) {
            this.$value = v;
        }
    }).fire('require');
    var intl = $('intl').and(
        $.word('_'),
        optional_garbage,
        $.word('('),
        optional_garbage,
        string,
        optional_garbage,
        $.char(',)')
    ).listen({
        yes: null,
        no: null,
        string: function(v) {
            this.$value = v;
        }
    }).fire('intl');
    var module = $.and(
        $.x0n(
            $.or(
                req,
                intl,
                garbage,
                identifier,
                $.charAny().fire('yes')
            )
        ),
        $.EOF
    ).init({intl: [], require: [], ok: true}).listen({
        yes: function() { this.ok = true; },
        no: function() { this.ok = false; },
        intl: function(v) {
            if (this.ok && this.intl.indexOf(v) == -1) {
                this.intl.push(v);
            }
        },
        require: function(v) {
            if (this.ok && this.require.indexOf(v) == -1) {
                this.require.push(v);
            }
        }
    });

    it('should match `require("foobar")`', function() {
        var result = req.match('require("foobar")');
        expect(result).toEqual('foobar');
    });

    [
        ["require( 'tp4.input');", {intl: [], require: ['tp4.input']}],
        ["var I = require('tp4.input' );", {intl: [], require: ['tp4.input']}],
        ["var I = require ('tp4.input');", {intl: [], require: ['tp4.input']}],
        ['var I = require("tp4.input").create;', {intl: [], require: ['tp4.input']}],
        ["var I = require('tp4.input').create;", {intl: [], require: ['tp4.input']}],
        ["var I = require( /* comment * / 'tp4.input');", {intl: [], require: ['tp4.input']}],
        ["I=require// Comment\n( 'tp4.input' /* Noway * /);", {intl: [], require: ['tp4.input']}],
        ['require("youpi")', {intl: [], require: ["youpi"]}],
        ['Nothing to match', {intl: [], require: []}],
        ["There // require('toto'), ignored", {intl: [], require: []}],
        ['', {intl: [], require: []}],
        ['require("youpi", 5)', {intl: [], require: []}],
        ['There is nothing to match', {intl: [], require: []}]
    ].forEach(function (item) {
        var code = item[0];
        var expected = item[1];
        it('should parse correctly `' + code + '`', function() {
            var result = module.match(code);
            delete result.ok;
            expect(result).toEqual(expected);
        });
    });

    return;
    

    var content = FS.readFileSync(__dirname + '/sample/module.js').toString();
    console.info("[grammar.modules.spec] content.substr(0, 100)=...");
    console.info(content.substr(0, 100));    
    it('should match file `sample/module.js`', function() {
        expect(module.match(content)).toEqual({
            intl: [],
            require: [666]
        });
    });
});
