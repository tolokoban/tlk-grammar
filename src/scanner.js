var Lexer = require("./lexer");

// Giving a name  to a scanner is  not mandatory. but it  is usefull for
// debugging. That's why, a name is  always given, even if not provided:
// that's the purpose of the incremental counter `nameCounter`.
var nameCounter = 0;


/**
 * Default  debug  listener.   Used  when  we  match   with  the  string
 * `'console'` as arguemnt `debug` of the function `match(code, debug)`.
 */
function consoleDebug(type, env, result) {
    var indent = '';
    var i;
    for (i = 0 ; i < env.level; i++) {
        indent += ' | ';
    }
    var prefix = env.scanner._type;
    var name = env.scanner.name();
    name = prefix + (name && name != prefix ? ':' + name : '');
    if (type == '>') {
        console.log(indent + '<' + name + '> @' + env.cursor + " \t\t "
                    + JSON.stringify(env.lexer.buffer.substr(env.cursor, 30)));

    }
    else if (type == '=') {
        console.log(indent + ' > ' + JSON.stringify(result));
        console.log(indent + '</' + name + '> @' + env.cursor);
    }
    else if (type == '!') {
        console.log(indent + '</' + name + '> FALSE! \t\t '
                    + JSON.stringify(env.lexer.buffer.substr(env.cursor, 30)));
    }
    else if (type == 'F') {
        console.log(indent + ' > FIRE `' + result.id + '` : ' + JSON.stringify(result.val));
    }
}


/**
 * Usefull for stringifying `arguments`.
 */
function stringifyArray(arr) {
    var args = [];
    for (var i = 0 ; i < arr.length ; i++) {
        args.push(arr[i]);
    }
    return JSON.stringify(args);
}


var Scanner = function(name) {
    this._id = nameCounter++;
    this._name = name;
    this._ctx = function() { return {}; };
    this._listeners = {};
};


/**
 * Get/set the name of this rule. This can be useful for debug.
 */
Scanner.prototype.name = function(v) {
    if (typeof v === 'undefined') {
        var name = this._name;
        if (typeof name === 'undefined') name = '#' + this._id;
        return name;
    }
    // Names cannot be overwritten.
    if (!this._name) this._name = v;
    return this;
};


/**
 * If  the rule  matches,  then fire  the `id`  signal  with `value`  as
 * argument.
 */
Scanner.prototype.fire = function(id, value) {
    if (typeof id === 'function') {
        this._fireValue = id;
    } else {
        this._fireValue = function() { return {id: id, val: value}; };
    }
    return this;
};


/**
 * @param {object} listeners - Attribute  keys are listeners' names. The
 * value is  a function (also  called __slot__)  which will react  to an
 * event and  return a boolean.  If `true`  is returned, the  event must
 * bubble to the parent. Otherwise, the event is cancelled.
 */
Scanner.prototype.listen = function(listeners) {
    this._listeners = listeners;
    return this;
};

/**
 * Set the context to pass to the slots as the `this` variable.
 */
Scanner.prototype.init = function(context) {
    if (typeof context === 'function') {
        this._ctx = context;
    } else {
        var stringified = JSON.stringify(context);
        this._ctx = function() { return JSON.parse(stringified); };
    }
    return this;
};


/**
 * @return void
 */
Scanner.prototype.match = function(lexer, debug) {
    var matcher = this._matcher;
    if (typeof matcher !== 'function') return false;

    if (typeof lexer === 'string') {
        lexer = new Lexer(lexer);
    }

    if (debug === 'console') debug = consoleDebug;
    if (typeof debug !== 'function') debug = function() {};

    return this.internal_match(lexer, {events: [], level: 0, cursor: 0}, debug);
};


Scanner.prototype.internal_match = function(lexer, parentEnv, debug) {
    var matcher = this._matcher;
    if (typeof matcher !== 'function') return false;

    parentEnv.cursor = lexer.cursor;
    parentEnv.lexer = lexer;
    parentEnv.scanner = this;
    debug('>', parentEnv);

    // Save the cursor position for potential rollback.
    var cursor = lexer.cursor;
    var ctx = this._ctx();
    var env = { events: [], level: parentEnv.level + 1, ctx: ctx };
    if (false !== matcher.call(ctx, lexer, env, debug)) {
        // Check for listeners on events.
        if (env.events.length > 0) {
            env.events.forEach(function (evt) {
                var listener = this._listeners[evt.id];
                var stopPropagation = false;
                if (typeof listener === 'function') {
                    // Execute the listener.
                    stopPropagation = (
                        true !== listener.call(ctx, evt.val)
                    );
                }
                else if (typeof listener !== 'undefined') {
                    // A listener set to `null`  can be use to absord an
                    // event without processing it.
                    stopPropagation = true;
                }
                if (!stopPropagation) {
                    // Propagate events to parent.
                    parentEnv.events.push(evt);
                }
            }, this);
        }
        // Check if there is something to fire.
        var fireVal = this._fireValue;
        if (typeof fireVal !== 'undefined') {
            // The  `fire` function  should return  an object  like this
            // `{id: 'number', val: 3.141592}`.
            var event = fireVal.call(ctx);
            debug('F', parentEnv, event);
            // The `fire` function can return  a `string`. This is to be
            // considered as the `id` of the event.
            if (typeof event === 'string') {
                event = {id: event};
            }
            // Low-level scanners (such as  `char`, `word`, ...) store a
            // value in the environment (`env`).
            if (typeof event.val === 'undefined') event.val = env.val;
            // If no value has been definde yet, just use the context.
            if (typeof event.val === 'undefined') event.val = ctx.$value || ctx;
            parentEnv.events.push(event);
        }
        // Return the context. If it does'nt exist, return the matcher's
        // result.
        var result = typeof ctx.$value === 'undefined' ? ctx : ctx.$value;
        debug(result === false ? '!' : '=', parentEnv, result);
        return result;
    } else {
        // Rollback.
        debug('!', parentEnv);
        lexer.cursor = cursor;
        return false;
    }
};


/**
 * __char__ matcher.
 * Syntax 1: `char('0123456789')`
 *   Matches if the current char is part of `chars` string.
 * Syntax 2: `char('0', '9')`
 *   Matches  if the  current char  is between  (inclusive) `chars`  and
 *   `upperBound`.
 */
Scanner.prototype.char = function(chars, upperBound) {
    this._type = "char";
    this.name(JSON.stringify(chars) + (upperBound ? "-" + JSON.stringify(upperBound) : ''));
    if (typeof upperBound === 'undefined') {
        // Syntax 1: char must be part of the string `chars`.
        this._matcher = function(lexer) {
            var c = lexer.read();
            if (chars.indexOf(c) > -1) {
                this.$value = c;
                return c;
            }
            return false;
        };
    } else {
        // Syntax 2: char must be between (inclusive) `chars` and `upperBound`
        this._matcher = function(lexer) {
            var c = lexer.read();
            if (c >= chars && c <= upperBound) {
                this.$value = c;
                return c;
            }
            return false;
        };
    }
    return this;
};


/**
 * __char-not__ matcher.
 * Match any char that `$.char(...)` would match with the same arguments.
 */
Scanner.prototype.charNot = function(chars, upperBound) {
    this._type = "char-not";
    this.name(JSON.stringify(chars) + (upperBound ? "-" + JSON.stringify(upperBound) : ''));
    if (typeof upperBound === 'undefined') {
        // Syntax 1: char must be part of the string `chars`.
        this._matcher = function(lexer) {
            var c = lexer.read();
            if (chars.indexOf(c) == -1) {
                this.$value = c;
                return c;
            }
            return false;
        };
    } else {
        // Syntax 2: char must be between (inclusive) `chars` and `upperBound`
        this._matcher = function(lexer) {
            var c = lexer.read();
            if (c < chars || c > upperBound) {
                this.$value = c;
                return c;
            }
            return false;
        };
    }
    return this;
};


/**
 * __char-any__ matcher.
 * Matches any char.
 *
 * @return `false` only if end of buffer has been reached.
 */
Scanner.prototype.charAny = function() {
    this._type = "char-any";
    this._matcher = function(lexer) {
        if (lexer.eof()) return false;
        this.$value = lexer.read();
        return true;
    };
    return this;
};


/**
 * __word__ matcher.
 * Matches if the current word is `word`.
 */
Scanner.prototype.word = function() {
    this._type = "word";
    var words = arguments;
    this.name(stringifyArray(words));
    this._matcher = function(lexer) {
        var word;
        for (var k = 0 ; k < words.length ; k++) {
            word = words[k];
            if (lexer.word(word)) {
                return this.$value = word;
            }
        }
        return false;
    };
    return this;
};


/**
 * __regexp__ matcher.
 * Matches against a regular expression.
 *
 * @return  `false`  if  no   match.  Otherwise,  returns  the  matching
 * array. It will have only one items, unless you specified groups.
 */
Scanner.prototype.regexp = function(pattern, flags) {
    this._type = "regexp";
    if (pattern.charAt(0) != '^') {
        pattern = '^' + pattern;
    }
    var rx = new RegExp(pattern, flags);
    this.name("/" + pattern + "/" + (flags ? flags : ''));
    this._matcher = function(lexer) {
        return (this.$value = lexer.regexp(rx)) || false;
    };
    return this;
};


/**
 * @return void
 */
Scanner.prototype.until = function() {
    this._type = "until";
    // Duplicate `arguments` to be able to use the array in the matcher.
    var args = arguments;
    this.name(stringifyArray(args));
    this._matcher = function(lexer) {
        var result = Lexer.prototype.until.apply(lexer, args);
        if (result === false) return false;
        this.$value = result;
        return true;
    };
    return this;
};


/**
 * __sequence__ matcher.
 * Matches only if all children match.
 */
Scanner.prototype.and = function() {
    this._type = "and";
    var args = arguments;
    this._matcher = function(lexer, env, debug) {
        var child, i;
        for (i = 0 ; i < args.length ; i++) {
            child = args[i];
            if (false === child.internal_match(lexer, env, debug)) {
                return false;
            }
        }
        return true;
    };
    return this;
};


/**
 * __alternative__ matcher.
 * Matches only if at least on child matchs.
 */
Scanner.prototype.or = function() {
    this._type = "or";
    var args = arguments;
    this._matcher = function(lexer, env, debug) {
        var child, i;
        for (i = 0 ; i < args.length ; i++) {
            child = args[i];
            if (false !== child.internal_match(lexer, env, debug)) {
                return true;
            }
        }
        return false;
    };
    return this;
};


/**
 * __1 to n occurences__ matcher.
 * Matches `child+`.
 */
Scanner.prototype.x1n = function(child) {
    this._type = 'x1n';
    this._matcher = function(lexer, env, debug) {
        if (!child.internal_match(lexer, env, debug)) return false;
        while (child.internal_match(lexer, env, debug));
        return true;
    };
    return this;
};


/**
 * __0 to n occurences__ matcher.
 * Matches `child*`.
 */
Scanner.prototype.x0n = function(child) {
    this._type = 'x0n';
    this._matcher = function(lexer, env, debug) {
        while (child.internal_match(lexer, env, debug));
        return true;
    };
    return this;
};


/**
 * __0 to 1 occurence__ matcher.
 * Matches `child?`.
 */
Scanner.prototype.x01 = function(child) {
    this._type = 'x01';
    this._matcher = function(lexer, env, debug) {
        child.internal_match(lexer, env, debug);
        return true;
    };
    return this;
};


/**
 * __end of file__ matcher.
 */
Scanner.prototype.eof = function() {
    this._type = 'eof';
    this._matcher = function(lexer) {
        return this.$value = (lexer.eof() === false ? false : true);
    };
    return this;
};


/**
 * __beginning of file__ matcher.
 */
Scanner.prototype.bof = function() {
    this._type = 'bof';
    this._matcher = function(lexer) {
        this.$value = lexer.bof() !== false;
        return this.$value;
    };
    return this;
};


var $ = function(name) {
    return new Scanner(name);
};

// End of file.
$.EOF = $('EOF').eof();
// Beginning of file.
$.BOF = $('BOF').bof();

$.eof = function() { return (new Scanner()).eof(); };
$.bof = function() { return (new Scanner()).bof(); };
$.charAny = function() { return (new Scanner()).charAny(); };
$.charNot = function(a, b) { return (new Scanner()).charNot(a, b); };
$.char = function(a, b) { return (new Scanner()).char(a, b); };
$.word = function() {
    /*
    var i, args = [];
    for (i = 0 ; i < arguments.length ; i++) args.push(arguments[i]);
    */
    return Scanner.prototype.word.apply(new Scanner(), arguments);
};
$.regexp = function(rxString, flags) { return (new Scanner()).regexp(rxString, flags); };
$.until = function() {
    var scanner = new Scanner();
    var args = [];
    for (var i = 0 ; i < arguments.length ; i++) {
        args.push(arguments[i]);
    }
    return Scanner.prototype.until.apply(scanner, args);
};
$.and = function() {
    var scanner = new Scanner();
    var args = [];
    for (var i = 0 ; i < arguments.length ; i++) {
        args.push(arguments[i]);
    }
    return Scanner.prototype.and.apply(scanner, args);
};
$.or = function() {
    var scanner = new Scanner();
    var args = [];
    for (var i = 0 ; i < arguments.length ; i++) {
        args.push(arguments[i]);
    }
    return Scanner.prototype.or.apply(scanner, args);
};
$.x01 = function(s) { return (new Scanner()).x01(s); };
$.x0n = function(s) { return (new Scanner()).x0n(s); };
$.x1n = function(s) { return (new Scanner()).x1n(s); };

$.Scanner = Scanner;

/**
 *
 */
module.exports = $;
