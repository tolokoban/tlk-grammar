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
    var $ = require('tlk-grammar').Scanner;

    // Grammar definition.
    var accumulator = $.and(
        $.char(' +\n'),
        $.and(
            $.x1n(
                     
            )
        )
    );
```


