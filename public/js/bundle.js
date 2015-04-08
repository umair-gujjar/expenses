(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var cash=require("./controller/cash"),entry=require("./controller/entry"),account=require("./controller/account"),view=require("./lib/view"),period=require("./lib/period"),money=require("./lib/money"),date=require("./lib/date"),handle_error=require("./lib/handle_error");window.formatDate=function(t){return date.format(t)},window.formatAmount=function(t){return money.format(t)},route(/^entries/,function(){entry.list()["catch"](handle_error)}),route(/^expanded/,function(){entry.expanded()["catch"](handle_error)}),route(/^entry\/edit\/([a-z0-9\-]+)/,function(t){entry.edit(t)["catch"](handle_error)}),route(/^entry\/view\/([a-z0-9\-]+)/,function(t){entry.view(t)["catch"](handle_error)}),route(/^entry\/add/,function(){entry.add()["catch"](handle_error)}),route(/^accounts/,function(){account.list()["catch"](handle_error)}),route(/^account\/add/,function(){account.add()["catch"](handle_error)}),route(/^account\/edit\/(.+)/,function(t){account.edit(t)["catch"](handle_error)}),route(/^account\/(.+)\/items/,function(t){account.items(t)["catch"](handle_error)}),route(/^cash/,function(){cash.show()["catch"](handle_error)});var helpTemplate='<h2>Help</h2>\n<h3>Debit/credit effects</h3>\n<table class="table">\n    <tr>\n        <th>Type</th><th>Debit</th><th>Credit</th>\n    </tr>\n    <tr>\n        <td>asset</td><td>+</td><td>-</td>\n    </tr>\n    <tr>\n        <td>expense</td><td>+</td><td>-</td>\n    </tr>\n    <tr>\n        <td>liability</td><td>-</td><td>+</td>\n    </tr>\n    <tr>\n        <td>income</td><td>-</td><td>+</td>\n    </tr>\n    <tr>\n        <td>equity</td><td>-</td><td>+</td>\n    </tr>\n</table>\n';route(/^help/,function(){view.show(helpTemplate,{})}),route(/.*/,function(){route.go("entries")});var periodForm=document.getElementById("period");ko.applyBindings(period,periodForm);


},{"./controller/account":2,"./controller/cash":3,"./controller/entry":4,"./lib/date":8,"./lib/handle_error":9,"./lib/money":10,"./lib/period":11,"./lib/view":13}],2:[function(require,module,exports){
var accountVM=require("./vm/account_vm"),api=require("../lib/api"),view=require("../lib/view"),period=require("../lib/period"),accountsTemplate='<h2>Accounts</h2>\n<table class="table table-condensed">\n    <tr>\n        <th>Code</th>\n        <th>Name</th>\n        <th>Type</th>\n        <th>Entries</th>\n    </tr>\n    <tbody data-bind="foreach: accounts">\n        <tr>\n            <td>\n                <a data-bind="text: code, attr: { href: \'#account/edit/\' + $id }" href="#"></a>\n            </td>\n            <td data-bind="text: name"></td>\n            <td data-bind="text: type"></td>\n            <td>\n                <a data-bind="attr: { href: \'#account/\' + $id + \'/items\' }" href="#">View</a>\n            </td>\n        </tr>\n    </tbody>\n</table>\n<a class="btn btn-default hidden-print" href="#account/add" role="button">\n    <span class="glyphicon glyphicon-plus"></span> Add\n</a>\n';exports.list=function(){return api.account.all().then(function(t){return view.show(accountsTemplate,{accounts:t})})};var itemsTemplate='<h2>Account <span data-bind="text: account.code + \' - \' + account.name"></span></h2>\n<table class="table table-condensed">\n    <tr>\n        <th>Date</th>\n        <th>Title</th>\n        <th>Item title</th>\n        <th class="text-right">Amount</th>\n    </tr>\n    <tbody data-bind="foreach: accounts">\n        <tr>\n            <td data-bind="text: formatDate(date)"></td>\n            <td>\n                <a data-bind="text: entry_title,\n                    attr: { href: \'#entry/view/\' + entry_id }" href="#"></a>\n            </td>\n            <td data-bind="text: title"></td>\n            <td data-bind="text: formatAmount(effect)" class="text-right"></td>\n        </tr>\n    </tbody>\n    <tr>\n        <td></td>\n        <td></td>\n        <td></td>\n        <td data-bind="text: formatAmount(total)" class="text-right"></td>\n    </tr>\n</table>\n';exports.items=function(t){var n=period.start(),e=period.end();return api.account.items(t,n,e).then(function(n){return api.account.get(t).then(function(t){var e=0;return n.forEach(function(t){e+=t.effect}),view.show(itemsTemplate,{accounts:n,account:t,total:e})})})};var accountTemplate='<h2>Account</h2>\n<form data-bind="submit: save" class="form-horizontal">\n    <div class="panel panel-default">\n        <div class="panel-body">\n            <div class="form-group">\n                <label class="col-sm-2 control-label">ID</label>\n                <div class="col-sm-10">\n                    <input data-bind="value: $id"\n                        type="text" name="code" title="Code"\n                        readonly="true" class="form-control">\n                </div>\n            </div>\n            <div class="form-group">\n                <label class="col-sm-2 control-label">Code</label>\n                <div class="col-sm-10">\n                    <input data-bind="value: code"\n                        type="text" name="code" title="Code"\n                        placeholder="Code" required="true" class="form-control">\n                </div>\n            </div>\n            <div class="form-group">\n                <label class="col-sm-2 control-label">Name</label>\n                <div class="col-sm-10">\n                    <input data-bind="value: name"\n                        type="text" name="name" title="Name"\n                        placeholder="Name" required="true" class="form-control">\n                </div>\n            </div>\n            <div class="form-group">\n                <label class="col-sm-2 control-label">Type</label>\n                <div class="col-sm-10">\n                    <select data-bind="options: types,\n                        optionsCaption: \'Select type\', value: type"\n                        required="true" class="form-control"></select>\n                </div>\n            </div>\n        </div>\n    </div>\n    <button type="submit" class="btn btn-default">\n        <span class="glyphicon glyphicon-ok"></span> Save\n    </button>\n    <a data-bind="click: remove" class="btn btn-default" href="#" role="button">\n        <span class="glyphicon glyphicon-remove"></span> Delete\n    </a>\n    <a class="btn btn-default" href="#accounts" role="button">\n        <span class="glyphicon glyphicon-arrow-left"></span> Back\n    </a>\n</form>';exports.add=function(){return view.show(accountTemplate,accountVM())},exports.edit=function(t){return api.account.get(t).then(function(t){return view.show(accountTemplate,accountVM(t))})};


},{"../lib/api":7,"../lib/period":11,"../lib/view":13,"./vm/account_vm":5}],3:[function(require,module,exports){
var api=require("../lib/api"),view=require("../lib/view"),period=require("../lib/period"),cashTemplate='<h2>Cash flow</h2>\n<table class="table table-condensed">\n    <tr>\n        <th>Date</th>\n        <th>Account</th>\n        <th class="text-right">Amount</th>\n    </tr>\n    <tbody data-bind="foreach: items">\n        <tr>\n            <td data-bind="text: formatDate(date)"></d>\n            <td>\n                <a data-bind="text: account.code + \' (\' + account.name + \')\', attr: { href: \'#account/\' + account.$id + \'/items\' }" href="#"></a>\n            </td>\n            <td data-bind="text: formatAmount(amount)" class="text-right"></td>\n        </tr>\n    </tbody>\n</table>\n<h3>Cash flow summary</h3>\n<table class="table table-condensed">\n    <tr>\n        <th>Account</th>\n        <th class="text-right">Amount</th>\n    </tr>\n    <tbody data-bind="foreach: summary">\n        <tr>\n            <td>\n                <a data-bind="text: account.code + \' (\' + account.name + \')\', attr: { href: \'#account/\' + account.$id + \'/items\' }" href="#"></a>\n            </td>\n            <td data-bind="text: formatAmount(amount)" class="text-right"></td>\n        </tr>\n    </tbody>\n</table>\n';exports.show=function(){var t=period.start(),a=period.end();return api.cash.list(t,a).then(function(t){var a={},n={};t.forEach(function(t){var e=t.account.code;n[e]=t.account,a[e]=(a[e]||0)+t.amount});var e=Object.keys(a).map(function(t){return{account:n[t],amount:a[t]}});view.show(cashTemplate,{items:t,summary:e})})};


},{"../lib/api":7,"../lib/period":11,"../lib/view":13}],4:[function(require,module,exports){
var entryVM=require("./vm/entry_vm"),api=require("../lib/api"),view=require("../lib/view"),period=require("../lib/period"),handle_error=require("../lib/handle_error"),entryTemplate='<h2>Edit entry</h2>\n<form data-bind="submit: save" class="form-horizontal">\n    <div class="panel panel-default">\n        <div class="panel-body">\n            <div class="form-group">\n                <label class="col-sm-2 control-label">ID</label>\n                <div class="col-sm-10">\n                    <input data-bind="value: $id"\n                        type="text" readonly="true" class="form-control">\n                </div>\n            </div>\n            <div class="form-group">\n                <label class="col-sm-2 control-label">Title</label>\n                <div class="col-sm-10">\n                    <input data-bind="value: title"\n                        type="text" name="title" title="Title" id="entry-title"\n                        placeholder="Title" required="true" class="form-control">\n                </div>\n            </div>\n        </div>\n    </div>\n    <h3>Items</h3>\n    <div data-bind="foreach: items" class="items">\n        <div class="panel panel-default">\n            <div class="panel-body">\n                <div class="form-group">\n                    <label class="col-sm-2 control-label">Item title</label>\n                    <div class="col-sm-10">\n                        <input data-bind="value: title" type="text"\n                             class="form-control">\n                    </div>\n                </div>\n                <div class="form-group">\n                    <label class="col-sm-2 control-label">Date</label>\n                    <div class="col-sm-10">\n                        <input data-bind="value: date"\n                            type="text" pattern="\\d{2}\\.\\d{2}\\.\\d{4}" name="date" title="Date"\n                            placeholder="Date" required="true" class="form-control">\n                    </div>\n                </div>\n                <div class="form-group">\n                    <label class="col-sm-2 control-label">Debit</label>\n                    <div class="col-sm-10">\n                        <select data-bind="options: $parent.accounts, value: debit,\n                            optionsCaption: \'Select account\', optionsText: $parent.accountText,\n                            optionsValue: $parent.accountValue"\n                            required="true" class="form-control"></select>\n                    </div>\n                </div>\n                <div class="form-group">\n                    <label class="col-sm-2 control-label">Credit</label>\n                    <div class="col-sm-10">\n                        <select data-bind="options: $parent.accounts, value: credit,\n                            optionsCaption: \'Select account\', optionsText: $parent.accountText,\n                            optionsValue: $parent.accountValue"\n                            required="true" class="form-control"></select>\n                    </div>\n                </div>\n                <div class="form-group">\n                    <label class="col-sm-2 control-label">Original currency</label>\n                    <div class="col-sm-10">\n                        <select data-bind="options: $parent.currencies,\n                            optionsCaption: \'Select currency\', value: currency"\n                            required="true" class="form-control"></select>\n                    </div>\n                </div>\n                <div class="form-group">\n                    <label class="col-sm-2 control-label">Original amount</label>\n                    <div class="col-sm-10">\n                        <input data-bind="value: amount" type="text"\n                            required="true" pattern="\\d+(?:\\.(\\d{2}))?" class="form-control">\n                    </div>\n                </div>\n                <div class="form-group">\n                    <label class="col-sm-2 control-label">EUR amount</label>\n                    <div class="col-sm-10">\n                        <input data-bind="value: eur_amount" type="text"\n                            required="true" pattern="\\d+(?:\\.(\\d{2}))?" class="form-control">\n                    </div>\n                </div>\n                <div class="form-group">\n                    <div class="col-sm-offset-2 col-sm-3">\n                        <a data-bind="click: $parent.removeItem" class="btn btn-default" href="#" role="button">\n                            <span class="glyphicon glyphicon-remove"></span> Delete item\n                        </a>\n                    </div>\n                </div>\n            </div>\n        </div>\n    </div>\n    <button type="submit" class="btn btn-default">\n        <span class="glyphicon glyphicon-ok"></span> Save\n    </button>\n    <a data-bind="click: addItem" class="btn btn-default" href="#" role="button">\n        <span class="glyphicon glyphicon-list"></span> Add item\n    </a>\n    <a data-bind="click: remove" class="btn btn-default" href="#" role="button">\n        <span class="glyphicon glyphicon-remove"></span> Delete\n    </a>\n    <a data-bind="attr: { href: $id ? \'#entry/view/\' + $id : \'#entries\' }" class="btn btn-default" href="#" role="button">\n        <span class="glyphicon glyphicon-arrow-left"></span> Back\n    </a>\n</form>\n',entryViewTemplate='<h2 data-bind="text: title"></h2>\n<h3>Items</h3>\n<table class="table table-condensed">\n    <tr>\n        <th>Date</th>\n        <th>Debit</th>\n        <th>Credit</th>\n        <th class="text-right">Original amount</th>\n        <th>Currency</th>\n        <th class="text-right">EUR amount</th>\n    </tr>\n    <tbody data-bind="foreach: items">\n        <tr>\n            <td data-bind="text: formatDate(date)"></td>\n            <td>\n                <a data-bind="text: debit.code + \' (\' + debit.name + \')\',\n                    attr: { href: \'#account/\' + debit.$id + \'/items\' }" href="#"></a>\n            </td>\n            <td>\n                <a data-bind="text: credit.code + \' (\' + credit.name + \')\',\n                    attr: { href: \'#account/\' + credit.$id + \'/items\' }" href="#"></a>\n            </td>\n            <td data-bind="text: formatAmount(amount)" class="text-right"></td>\n            <td data-bind="text: currency.toUpperCase()"></td>\n            <td data-bind="text: formatAmount(eur_amount)" class="text-right"></td>\n        </tr>\n    </tbody>\n</table>\n<h3>Changes in balance</h3>\n<table class="table table-condensed">\n    <tr>\n        <th>Account</th>\n        <th class="text-right">Change</th>\n    </tr>\n    <tbody data-bind="foreach: changes">\n        <tr>\n            <td>\n                <a data-bind="text: account.code + \' (\' + account.name + \')\',\n                    attr: { href: \'#account/\' + account.$id + \'/items\' }" href="#"></a>\n            </td>\n            <td data-bind="text: formatAmount(change)" class="text-right"></td>\n        </tr>\n    </tbody>\n</table>\n<a data-bind="attr: { href: \'#entry/edit/\' + $id }"\n    class="btn btn-default" href="#" role="button">\n    <span class="glyphicon glyphicon-edit"></span> Edit\n</a>\n<a data-bind="click: copy" class="btn btn-default" href="#" role="button">\n    <span class="glyphicon glyphicon-share"></span> Copy\n</a>\n<a class="btn btn-default" href="#entries" role="button">\n    <span class="glyphicon glyphicon-arrow-left"></span> Back\n</a>\n';exports.view=function(t){return api.entry.full(t).then(function(n){n.items.forEach(function(t){t.debit=n.accounts[t.debit],t.credit=n.accounts[t.credit]}),n.changes=Object.keys(n.changes).map(function(t){return{account:n.accounts[t],change:n.changes[t]}}),n.copy=function(){api.entry.get(t).then(function(t){return api.account.all().then(function(n){t.$id=null,view.show(entryTemplate,entryVM(n,t)),document.getElementById("entry-title").focus()})})["catch"](handle_error)},view.show(entryViewTemplate,n)})};var entriesTemplate='<h2>Entries</h2>\n<p>\n    All entries that have item with date in the selected period.\n</p>\n<table class="table table-condensed">\n    <tr>\n        <th>Date</th>\n        <th>Title</th>\n    </tr>\n    <tbody data-bind="foreach: entries">\n        <tr>\n            <td data-bind="text: formatDate(date)"></td>\n            <td>\n                <a data-bind="text: title, attr: { href: \'#entry/view/\' + $id }" href="#"></a>\n            </td>\n        </tr>\n    </tbody>\n</table>\n<a class="btn btn-default hidden-print" href="#entry/add" role="button">\n    <span class="glyphicon glyphicon-plus"></span> Add\n</a>\n';exports.list=function(){var t=period.start(),n=period.end();return api.entry.list(t,n).then(function(t){view.show(entriesTemplate,{entries:t})})};var expandedTemplate='<h2>Entries (expanded)</h2>\n<p>\n    All entries that have item with date in the selected period.\n</p>\n<table class="table table-condensed">\n    <tr>\n        <th>Date</th>\n        <th>Title</th>\n        <th>Debit</th>\n        <th>Credit</th>\n        <th class="text-right">Amount</th>\n    </tr>\n    <tbody data-bind="foreach: entries">\n        <tr>\n            <td data-bind="text: formatDate(date)"></td>\n            <td>\n                <strong><a data-bind="text: title, attr: { href: \'#entry/view/\' + $id }" href="#"></a></strong>\n            </td>\n            <td></td>\n            <td></td>\n            <td></td>\n        </tr>\n        <!-- ko foreach: items -->\n            <tr>\n                <td data-bind="text: formatDate(date)"></td>\n                <td data-bind="text: title"></td>\n                <td data-bind="text: debit.code + \' (\' + debit.name + \')\'"></td>\n                <td data-bind="text: credit.code + \' (\' + credit.name + \')\'"></td>\n                <td data-bind="text: formatAmount(eur_amount)" class="text-right"></td>\n            </tr>\n        <!-- /ko -->\n    </tbody>\n</table>\n';exports.expanded=function(){var t=period.start(),n=period.end();return api.entry.list(t,n).then(function(t){return api.account.all().then(function(n){var e={};n.forEach(function(t){e[t.$id]=t}),t.forEach(function(t){t.items.forEach(function(t){t.debit=e[t.debit],t.credit=e[t.credit]})}),view.show(expandedTemplate,{entries:t})})})},exports.edit=function(t){return api.entry.get(t).then(function(t){return api.account.all().then(function(n){view.show(entryTemplate,entryVM(n,t)),document.getElementById("entry-title").focus()})})},exports.add=function(t){return api.account.all().then(function(t){view.show(entryTemplate,entryVM(t)),document.getElementById("entry-title").focus()})};


},{"../lib/api":7,"../lib/handle_error":9,"../lib/period":11,"../lib/view":13,"./vm/entry_vm":6}],5:[function(require,module,exports){
var view=require("../../lib/view"),api=require("../../lib/api");module.exports=function(e){var n={$id:null,code:ko.observable(),name:ko.observable(),type:ko.observable(),types:["liability","income","equity","asset","expense","cash","bank"]};return e&&(n.$id=e.$id,n.code(e.code),n.name(e.name),n.type(e.type)),n.toJS=function(){return{code:n.code(),name:n.name(),type:n.type()}},n.toString=function(){return n.code()+" ("+n.name()+")"},n.save=function(){n.$id?api.account.update(n.$id,n.toJS()).done(function(){window.location.hash="#accounts"})["catch"](handle_error):api.account.save(n.toJS()).done(function(){window.location.hash="#accounts"})["catch"](handle_error),view.message("Account is saved.")},n.remove=function(){n.$id&&confirm("Delete the account?")&&api.account.remove(n.$id).then(function(e){window.location.hash="#accounts"},function(e){view.message("Cannot delete the account. "+e.message,"alert-danger")})["catch"](handle_error)},n};


},{"../../lib/api":7,"../../lib/view":13}],6:[function(require,module,exports){
function itemVM(e){var t={title:ko.observable(),date:ko.observable(),debit:ko.observable(),credit:ko.observable(),currency:ko.observable(),amount:ko.observable(),eur_amount:ko.observable()};return t.eur_orig=ko.computed(function(){var e=t.amount(),r=t.currency();return e&&"EUR"===r?e:void 0}),t.eur_orig.subscribe(function(e){e&&t.eur_amount(e)}),e?(t.title(e.title),t.date(date.format(e.date)),t.debit(e.debit),t.credit(e.credit),t.amount(money.format(e.amount)),t.currency(e.currency.toUpperCase()),t.eur_amount(money.format(e.eur_amount))):t.date(date.format(Math.floor(Date.now()/1e3))),t.toJS=function(){return{title:t.title(),date:date.parse(t.date()),debit:t.debit(),credit:t.credit(),amount:money.parse(t.amount()),currency:t.currency().toLowerCase(),eur_amount:money.parse(t.eur_amount())}},t}var money=require("../../lib/money"),date=require("../../lib/date"),view=require("../../lib/view"),api=require("../../lib/api");module.exports=function(e,t){var r={title:ko.observable(),$id:null,items:ko.observableArray([]),accounts:e,currencies:["EUR","USD","GBP"]};return t&&(r.$id=t.$id,r.title(t.title),t.items.forEach(function(e){r.items.push(itemVM(e))})),r.toJS=function(){return{title:r.title(),items:r.items().map(function(e){return e.toJS()})}},r.accountText=function(e){return e.code+" ("+e.name+")"},r.accountValue=function(e){return e.$id},r.save=function(){r.$id?api.entry.update(r.$id,r.toJS()).done(function(){window.location.hash="#entry/view/"+r.$id})["catch"](handle_error):api.entry.save(r.toJS()).done(function(e){window.location.hash="#entry/view/"+e})["catch"](handle_error),view.message("The entry is saved.")},r.remove=function(){r.$id&&confirm("Remove the entry?")&&api.entry.remove(r.$id).done(function(){window.location.hash="#entries",view.message("The entry is deleted.")})["catch"](handle_error)},r.addItem=function(){r.items.push(itemVM())},r.removeItem=function(e){confirm("Remove the item "+e.title()+"?")&&r.items.remove(e)["catch"](handle_error)},r};


},{"../../lib/api":7,"../../lib/date":8,"../../lib/money":10,"../../lib/view":13}],7:[function(require,module,exports){
function spinnerShow(){0===showCount&&spinner.show(),showCount+=1}function spinnerHide(){showCount-=1,0===showCount&&spinner.hide()}function fetchGet(e){return spinnerShow(),fetch(e,{headers:{Accept:"application/json"}})["catch"](function(e){throw spinnerHide(),e}).then(handleResponse)}function fetchDelete(e){return spinnerShow(),fetch(e,{method:"DELETE",headers:{Accept:"application/json"}})["catch"](function(e){throw spinnerHide(),e}).then(handleResponse)}function fetchSave(e,n){return spinnerShow(),fetch(e,{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify(n)})["catch"](function(e){throw spinnerHide(),e}).then(handleResponse)}function fetchUpdate(e,n){return spinnerShow(),fetch(e,{method:"PUT",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify(n)})["catch"](function(e){throw spinnerHide(),e}).then(handleResponse)}function handleResponse(e){return spinnerHide(),e.json().then(function(e){if("success"===e.status)return e.data;throw new Error("API response is not success: "+e.message)})}var spinner=require("./spinner"),showCount=0;exports.entry={full:function(e){return fetchGet("/api/entry/"+encodeURIComponent(e)+"/full")},get:function(e){return fetchGet("/api/entry/"+encodeURIComponent(e))},list:function(e,n){var t="/api/entries/"+encodeURIComponent(e)+"/"+encodeURIComponent(n);return fetchGet(t)},remove:function(e){return fetchDelete("/api/entry/"+encodeURIComponent(e))},update:function(e,n){return fetchUpdate("/api/entry/"+encodeURIComponent(e),n)},save:function(e){return fetchSave("/api/entry",e)}},exports.account={all:function(){return fetchGet("/api/accounts")},items:function(e,n,t){var o="/api/account/"+encodeURIComponent(e)+"/items/"+encodeURIComponent(n)+"/"+encodeURIComponent(t);return fetchGet(o)},get:function(e){return fetchGet("/api/account/"+encodeURIComponent(e))},update:function(e,n){return fetchUpdate("/api/account/"+encodeURIComponent(e),n)},save:function(e){return fetchSave("/api/account",e)},remove:function(e){return fetchDelete("/api/account/"+encodeURIComponent(e))}},exports.cash={list:function(e,n){var t="/api/cash/"+encodeURIComponent(e)+"/"+encodeURIComponent(n);return fetchGet(t)}};


},{"./spinner":12}],8:[function(require,module,exports){
exports.parse=function(e){var t=e.match(/(\d{2})\.(\d{2})\.(\d{4})/);if(t){var r=parseInt(t[1],10),a=parseInt(t[2],10)-1,n=parseInt(t[3],10),o=new Date;return o.setUTCHours(0,0,0,0),o.setUTCFullYear(n,a,r),Math.floor(o.getTime()/1e3)}throw new Error("Cannot parse date "+e)},exports.format=function(e){function t(e){return 10>e?"0"+e:""+e}var r=new Date(1e3*e),a=r.getUTCFullYear(),n=r.getUTCMonth()+1,o=r.getUTCDate();return t(o)+"."+t(n)+"."+a};


},{}],9:[function(require,module,exports){
module.exports=function(o){console.log(o),console.error(o.stack)};


},{}],10:[function(require,module,exports){
exports.parse=function(r){var t=r.match(/(\d+)(?:\.(\d{2}))?/);if(t){var a=parseInt(t[1],10),n=0;return t[2]&&(n=parseInt(t[2],10)),100*a+n}throw new Error("Cannot parse "+r)},exports.format=function(r){var t=!1;0>r&&(t=!0,r=-r);var a=Math.floor(r/100),n=r%100;return(t?"-":"")+a+"."+((10>n?"0":"")+n)};


},{}],11:[function(require,module,exports){
exports.start_month=ko.observable(),exports.end_month=ko.observable(),exports.start=function(){var e=exports.months.indexOf(exports.start_month()),r=parseInt(exports.year(),10),t=new Date;return t.setUTCFullYear(r,e,1),t.setUTCHours(0,0,0,0),Math.floor(t.getTime()/1e3)},exports.end=function(){var e=exports.months.indexOf(exports.end_month()),r=parseInt(exports.year(),10);11===e?(e=0,r+=1):e+=1;var t=new Date;return t.setUTCFullYear(r,e,1),t.setUTCHours(0,0,0,0),Math.floor(t.getTime()/1e3)-1},exports.update=function(){route.refresh()};var currentDate=new Date,currentYear=currentDate.getUTCFullYear(),currentMonth=currentDate.getUTCMonth();exports.months=["January","February","March","April","May","June","July","August","September","October","November","December"],exports.year=ko.observable(currentYear.toString()),exports.years=[];for(var y=2012;currentYear+1>=y;y++)exports.years.push(y.toString());exports.start_month(exports.months[currentMonth]),exports.end_month(exports.months[currentMonth]);


},{}],12:[function(require,module,exports){
exports.show=function(){var e=document.getElementById("spinner");e&&(e.style.display="block")},exports.hide=function(){var e=document.getElementById("spinner");e&&(e.style.display="none")};


},{}],13:[function(require,module,exports){
exports.show=kontainer.create("#content"),exports.message=function(e,t){var n=document.getElementById("messages"),s=document.createElement("div"),a="alert";a+=t?" "+t:" alert-success",s.className=a,s.innerHTML=e,n.appendChild(s),setTimeout(function(){n.removeChild(s)},2e3)};


},{}]},{},[1])


//# sourceMappingURL=bundle.js.map