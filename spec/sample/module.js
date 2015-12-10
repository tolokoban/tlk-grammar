"use strict";
var W = require("tp4.wait").create;
var I = require("tp4.input").create;
var B = require("tp4.button").create;
var S = require("tp4.select").create;
var WS = require("tfw.web-service");
var LG = require("tfw.layout-grid").create;
var Msg = require("tp4.message").msg;
var Err = require("tp4.message").err;
var Modal = require("tfw.modal");
var Widget = require("wdg");

var T = Widget.tag;


/**
 * @example
 * var Edit = require("bib.edit");
 * var instance = new Edit(bibs);
 * @class Edit
 */
var Edit = function(bibs) {
    var that = this;
    this._bibs = bibs;

    Widget.call(this);
    this.addClass("bib-edit");
    var section = Widget.tag('section');
    this.append(section);
    var header = (new require("tp4.header"))({left: 'back#/book/list', icons: []});
    header.title(_('edit'));
    this.append(header);
    this._header = header;

    this._inpFirstName = I({label: _('firstname'), width: '200px'});
    this._inpLastName = I({label: _('lastname'), width: '200px'});
    this._inpFemale = S(_('sex'), {'1': "♀ F", '0': "♂ M"});
    this._inpCategory = I({label: _('category'), size: 4});

    var btnCancel = B({caption: _('cancel'), href: "#/book/list"});
    var btnOK = B(_('ok')).Tap(function() { that.update(); });
    this._btnOK = btnOK;
    var btnDelete = B(_('delete')).addClass('warning').css('width', '240px').Tap(function() {
        Modal.confirm(
            _('delete_confirm', that._bibNumber),
            function(parent) {
                parent.setWait(_('delete_wait'));
                that._bibs.deleteBib(that._bibNumber).then(function() {
                    location.hash = "/book/list";
                    parent.hide();
                }, function(err) {
                    parent.hide();
                });
            });
    });
    section.append(
        LG(
            this._inpFirstName,
            this._inpLastName
        ).styles({_: ["center", "middle"]}).css('width', '240px'),
        LG(
            [this._inpFemale, this._inpCategory],
            [btnCancel, btnOK]
        ).styles({_: ["center", "middle"]}).css('width', '240px'),
        T('br'),
        btnDelete
    );
};

// Extension of Widget.
Edit.prototype = Object.create(Widget.prototype);
Edit.prototype.constructor = Edit;

/**
 * @return void
 */
Edit.prototype.setBibNumber = function(bibNumber) {
    this._bibNumber = bibNumber;
    this._header.title('<html>' + _('edit') + " - <big>" + bibNumber + '</big>');
    var bibs = this._bibs;
    var bibIndex = bibs.findBib(bibNumber);
    var bib = bibs.get(bibIndex);

    ['FirstName', 'LastName', 'Female', 'Category'].forEach(function (id) {
        var val = bib ? bib[id.toLowerCase()] : '';
        this['_inp' + id].val(val);
    }, this);

    this._inpFirstName.focus();
};


/**
 * Mise à jour du dossard courant, puis retour à la liste.
 */
Edit.prototype.update = function() {
    var btnOK = this._btnOK;
    btnOK.waitOn();
    Msg(_('update_in_progress'));
    this._bibs.updateBib({
        bib: this._bibNumber,
        firstname: this._inpFirstName.val().trim(),
        lastname: this._inpLastName.val().trim(),
        category: this._inpCategory.val().trim().toUpperCase(),
        female: this._inpFemale.val() == '1' ? true : false
    }).then(function() {
        btnOK.waitOff();
        location.hash = "/book/list";
    }, function(err) {
        btnOK.waitOff();
        Err(_('update_error'));
    });
};


Edit.create = function(bibs) {
    return new Edit(bibs);
};
module.exports = Edit;
