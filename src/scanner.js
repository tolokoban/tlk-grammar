var Lexer = require("./lexer");



var Scanner = function(name) {
    if (typeof name !== 'undefined') this.name(name);
    this._ctx = "{}";
};


/**
 * Set the name of this rule. This can be useful for debug.
 */
Scanner.prototype.name = function(name) {
    this._name = name;
    return this;
};


/**
 * If the rule matches, fire the `id` signal with `value` as argument.
 */
Scanner.prototype.fire = function(id, value) {
    this._fireId = "" + id;
    if (typeof value !== 'function') {
        this._fireValue = function() { return value; };
    } else {
        this._fireValue = value;
    }
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
    if (typeof lexer === 'string') {
        lexer = new Lexer(lexer);
    }
    var matcher = this._matcher;
    if (typeof matcher !== 'function') return false;

    var cursor = lexer.cursor;
    var ctx = this._ctx();
    if (matcher.call(ctx, lexer)) {
        return true;
    } else {
        // Rollback.
        lexer.cursor = cursor;
        return false;
    }
};


/**
 * Char matcher.
 * Matches if the current char is part of `chars`string.
 */
Scanner.prototype.char = function(chars) {
    this._matcher = function(lexer) {
        var c = lexer.read();
        return chars.indexOf(c) > -1;
    };
    return this;
};


/**
 * Word matcher.
 * Matches if the current word is `word`.
 */
Scanner.prototype.word = function(word) {
    this._matcher = function(lexer) {
        return lexer.word(word);
    };
    return this;
};



var $ = function(name) {
    return Scanner(name);
};




module.exports = $;
