module.exports = {
    Scanner: require('./src/scanner')
};


/* Tests... */


var $ = module.exports.Scanner;

var result = {bindings: []};

function addBinding() {
console.log("----------------------------------------");
console.info("[index] result=...", JSON.stringify( result, null, '  '));    
    if (typeof result.widget === 'string') {
        var binding = [result.widget, result.attribute];
        if (typeof result.value !== 'undefined') {
            binding.push( result.value );
        }
        result.bindings.push( binding );
    } else {
console.info("BAD WIDGET!");
    }
}

var sep = $('sep').x0n($.char(' \t\n\r'));
var name = $('name').regexp("[$a-zA-Z_-][$a-zA-Z_0-9-]+").fire("name");
var number = $('number').regexp("-?(\.[0-9]+|[0-9]+(\.[0-9]+)?)").fire("value");
var keyword = $('boolean').word('true', 'false', 'null').fire('value');
var string = $('string').regexp("'(\\.|[^\\']+)*'").fire('value');
var comma = $('comma').char(',').fire('comma');
var colon = $('colon').char(':').fire('colon');
var equal = $('equal').char('=').fire('equal');

var widget = $('widget').and(sep, name, sep).listen({
    name: function(v) {
        result.widget = v;
        console.log("WIDGET", JSON.stringify(result));        
        return true;
    }
});

var attribute = $('attribute').and(sep, colon, sep, name, sep).listen({
    name: function(v) {
        result.attribute = v;
        console.log("ATTRIBUTE", JSON.stringify(result));        
        return true;
    }
});

var value = $('value').and(sep, equal, sep, $.or(keyword, number, string), sep).listen({
    value: function(v) {
        result.value = v;
        console.log("VALUE", JSON.stringify(result));        
        return true;
    }
});

var item = $('item').and( widget, $.x01(attribute), $.x01(value) );

var bindings = $('bindings').and( item, $.x0n( $.and( sep, comma, sep, item, sep ) ) ).init({
    bindings: []
}).listen({
    comma: function() {
        console.log("COMA", JSON.stringify(result));        
        addBinding();
        delete result.widget;
        result.attribute = 'action';
        delete result.value;
        return true;
    }
});



var code = "view-task-close:text, btnCancelTaskClose:value=false, btnConfirmTaskClose:action=false";

bindings.match( code, 'console' );
addBinding();

console.log('============================================================');
console.log(code);
console.log(
    JSON.stringify( result, null, '  ' )
);
