var Lexer = require("./lexer");

// Giving a name  to a scanner is  not mandatory. but it  is usefull for
// debugging. That's why, a name is  always given, even if not provided:
// that's the purpose of the incremental counter `nameCounter`.
var nameCounter = 0;


var Scanner = function(name) {
    if (typeof name === 'undefined') name = '#' + (nameCounter++);
    this._name = name;
    this._ctx = function() { return {}; };
    this._listeners = {};
};


/**
 * Get the name of this rule. This can be useful for debug.
 */
Scanner.prototype.getName = function() {
    return this._name;
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
Scanner.prototype.match = function(lexer) {
    var matcher = this._matcher;
    if (typeof matcher !== 'function') return false;

    if (typeof lexer === 'string') {
        lexer = new Lexer(lexer);
    }

    return this.internal_match(lexer, {events: [], level: 0});
};


Scanner.prototype.internal_match = function(lexer, parentEnv) {
    var matcher = this._matcher;
    if (typeof matcher !== 'function') return false;

    // Save the cursor position for potential rollback.
    var cursor = lexer.cursor;
    var ctx;
    var env = { events: [], level: parentEnv.level + 1 };
    if (matcher(lexer, env)) {
        // Check for listeners on events.
        if (env.events.length > 0) {
            env.events.forEach(function (evt) {
                var listener = this._listeners[evt.id];
                var stopPropagation = false;
                if (typeof listener === 'function') {
                    // Execute the listener.
                    if (!ctx) ctx = this._ctx();
                    stopPropagation = (
                        true !== listener.call(ctx, evt.val)
                    );
                }
                if (!stopPropagation) {
                    // Propagate events to parent.
                    parentEnv.events.push(evt);
                }
            }, this);
        }
        // Check if there is something to fire.
        var fireVal = this._fireValue;
        if (fireVal) {
            if (!ctx) ctx = this._ctx();
            // The  `fire` function  should return  an object  like this
            // `{id: 'number', val: 3.141592}`.
            var event = fireVal.call(ctx);
            // The `fire` function can return  a `string`. This is to be
            // considered as the `id` of the event.
            if (typeof event === 'string') {
                event = {id: event};
            }
            // Low-level scanners (such as  `char`, `word`, ...) store a
            // value in the environment (`env`).
            if (typeof event.val === 'undefined') event.val = env.val;
            parentEnv.events.push(event);
        }
        return ctx || true;
    } else {
        // Rollback.
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
    if (typeof upperBound === 'undefined') {
        // Syntax 1: char must be part of the string `chars`.
        this._matcher = function(lexer, env) {
            var c = lexer.read();
            if (chars.indexOf(c) > -1) {
                env.val = c;
                return true;
            }
            return false;
        };
    } else {
        // Syntax 2: char must be between (inclusive) `chars` and `upperBound`
        this._matcher = function(lexer, env) {
            var c = lexer.read();
            if (c >= chars && c <= upperBound) {
                env.val = c;
                return true;
            }
            return false;
        };
    }
    return this;
};


/**
 * __word__ matcher.
 * Matches if the current word is `word`.
 */
Scanner.prototype.word = function(word) {
    this._type = "word";
    this._matcher = function(lexer, env) {
        if (lexer.word(word)) {
            env.value = env;
            return true;
        }
        return false;
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
    this._matcher = function(lexer, env) {
        // If the matching fails, we must go back to this cursor.
        var child, i;
        for (i = 0 ; i < args.length ; i++) {
            child = args[i];
            if (!child.internal_match(lexer, env)) {
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
    this._matcher = function(lexer, env) {
        // If the matching fails, we must go back to this cursor.
        var child, i;
        for (i = 0 ; i < args.length ; i++) {
            child = args[i];
            if (child.internal_match(lexer, env)) {
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
    this._matcher = function(lexer, env) {
        if (!child.internal_match(lexer, env)) return false;
        while (child.internal_match(lexer, env));
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
    this._matcher = function(lexer, env) {
        while (child.internal_match(lexer, env));
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
    this._matcher = function(lexer, env) {
        child.internal_match(lexer, env);
        return true;
    };
    return this;
};


/**
 * __end of file__ matcher.
 */
Scanner.prototype.eof = function() {
    this._type = 'eof';
    this._matcher = function(lexer, env) {
        return lexer.eof();
    };
    return this;
};


var $ = function(name) {
    return new Scanner(name);
};

// End of file.
$.EOF = $('EOF').eof();

$.char = function(a, b) { return (new Scanner()).char(a, b); };
$.word = function(w) { return (new Scanner()).word(w); };
$.x01 = function(s) { return (new Scanner()).x01(s); };
$.x0n = function(s) { return (new Scanner()).x0n(s); };
$.x1n = function(s) { return (new Scanner()).x1n(s); };

module.exports = $;
