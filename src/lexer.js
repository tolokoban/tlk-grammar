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
Lexer.prototype.char = function(chars) {
    var c = this.read();
    var found = chars.indexOf(c) > -1;
    if (found) return true;
    this.cursor--;
    return false;
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

