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
 * Try to math the regular expression `rx`.
 */
Lexer.prototype.regexp = function(rx) {
    var match = rx.match(this.buffer.substr(this.cursor));
    if (!match) return false;
    this.cursor += match[0];
    return true;
};


/**
 * __until__ matcher.
 * Matches all the content preceding `word`.
 * Can be `false` only if `word` does not exist from the current cursor.
 * 
 * @param {string...} words - As many arguments as word to test. Stops
 * when it reaches the nearest word.
 *
 * @return `false`  if no word  has been found. Otherwise,  return the
 * text found just before the nearest word found.
 */
Lexer.prototype.until = function() {
    var searchSpace = this.buffer.substr(this.cursor);
    // Position of a word in `searchSpace`. -1 if not found.
    var wordIndex = -1;
    // Flag to know if at least one word has been found.
    var found = false;

    var i, word;
    for (i = 0 ; i < arguments.length ; i++) {
        word = arguments[i];
        wordIndex = searchSpace.indexOf(word);
        if (wordIndex > -1) {
            found = true;
            searchSpace = searchSpace.substr(0, wordIndex);
        }
    }
    if (found) {
        this.cursor += searchSpace.length;
        return searchSpace;
    }
    return false;
};



/**
 * @return void
 */
Lexer.prototype.eof = function() {
    return this.cursor >= this.buffer.length;
};



module.exports = Lexer;
