# tlk-grammar
Simple, versatile and generic grammar scanner.
Not design to be the fastest, but the most powerful and easy to use.

## Example

```javascript
var $ = require('tlk-grammar').Scanner;

// Grammar definition.
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
    
// The `text` is made of integral numbers and `+`operators.
// This function return th result of the summation.
// For example: `summation("3 + 7 + 5") === 15`
function summation(text) {
    var result = accumulator.match(text);
    return result ? result.total : 0;
}
```

The previous grammar could have been defined like this:

```javascript
// Grammar definition.
var accumulator = $.and(
    $.x0n($.char('+ \t\n\r')),
    $.x0n(
        $.and(
            $.x1n(
                $.char('0','9').fire('digit'),
                $.x0n($.char('+ \t\n\r'))
            )
        )
        .init({n: 0})
        .listen({
            digit: function(v) {
                this.n = (v.charCodeAt(0) - 48) + this.n * 10;
            }
        })
        .fire(function() {
            return {id: 'number', val: this.n};
        })
    )
)
.init({total: 0})
.listen({ number: function(v) { this.total += v; } });
```


## Reference

### Scanner

Let's suppose we have:

```
var $ = require('tlk-grammar').Scanner;
```

#### $.charAny()


#### $.char(a)


#### $.char(a,b)


#### $.eof()


#### $.regexp(pattern, flags)

Matches again a [javascript regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FRegExp).
Argument `flags` is not mandatory.

__Return / Fire__:
The same result as the Javascript function `RegExp.prototype.exec()`, but the match always act as if `pattern` starts with a `^`.

#### $.until(a, b, c, ...)

Match for any non-empty string before the nearest occurence of any of the arguments (a, b, c, ...).

```js
$.until('(', ')').match('f(5)') === 'f'
$.until('(', ')').match('(5)') === false
$.until('(', ')').match('5 - x) + f(8)') === '5 - x'
```

__Return / Fire__: this non-empty string.

