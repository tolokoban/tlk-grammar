var Lexer = function(sourceCode) {
    this.buffer = sourceCode;
    this.cursor = 0;
};


/**
 * @return void
 */
Lexer.prototype.read = function() {
    return this.buffer[this.cursor++];
};


/**
 * @return void
 */
Lexer.prototype.word = function(word) {
    var len = word.length;
    if (this.buffer.substr(this.cursor, len) == word) {
        this.cursor += len;
        return true;
    }
    return false;
};


/**
 * Try to mathc the regular expression `rx`.
 */
Lexer.prototype.regexp = function(rx) {
    var match = rx.match(this.buffer.substr(this.cursor));
    if (!match) return false;
    this.cursor += match[0];
    return true;
};



/**
 * @return void
 */
Lexer.prototype.eof = function() {
    return this.cursor >= this.buffer.length;
};



module.exports = Lexer;
