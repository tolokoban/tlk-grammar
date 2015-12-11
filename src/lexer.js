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
 * Try to match the regular expression `rx`.
 *
 * @return `false` if no match. Otherwise, return the match array.
 */
Lexer.prototype.regexp = function(rx) {
    var text = this.buffer.substr(this.cursor);
    var match = rx.exec(text);
    if (!match) return false;
    match[0] = text.substr(0, match.index) + match[0];
    this.cursor += match[0].length;
    return match;
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
    if (found && searchSpace.length > 0) {
        this.cursor += searchSpace.length;
        return searchSpace;
    }
    return false;
};



/**
 * End of file.
 */
Lexer.prototype.eof = function() {
    return this.cursor >= this.buffer.length;
};


/**
 * Beginning of file
 */
Lexer.prototype.bof = function() {
    return this.cursor == 0;
};



module.exports = Lexer;
