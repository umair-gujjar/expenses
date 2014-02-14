:- module(api, []).

:- use_module(library(http/http_json)).
:- use_module(library(http/http_wrapper)).
:- use_module(library(http/http_dispatch)).

:- use_module(library(docstore)).
:- use_module(library(arouter)).
:- use_module(library(sort_dict)).

:- use_module(schema).

% Error messages.

reply_error(invalid_data):-
    reply_json(_{ status: error, code: 111, message: 'Invalid data.' }).

reply_error(account_in_use):-
    reply_json(_{ status: error, code: 112, message: 'Account in use.' }).

:- route_post(api/entry, new_entry).

new_entry:-
    http_current_request(Request),
    http_read_json_dict(Request, Dict),
    entry(Dict, Entry, Errors),
    (   Errors = []
    ->  ds_insert(entry, Entry, Id),
        reply_json(_{ status: success, data: Id })
    ;   format(user_error, '~p', [Errors]), % FIXME use debug
        reply_error(invalid_data)).

:- route_get(api/entries/Start/End, get_entries(Start, End)).

get_entries(Start, End):-
    atom_number(Start, StartDate),
    atom_number(End, EndDate),
    ds_all(entry, [title, items], Entries),
    include(date_in_range(StartDate, EndDate), Entries, Filtered),
    maplist(attach_earliest_time, Filtered, WithDate),
    sort_dict(date, desc, WithDate, Sorted),
    reply_json(_{ status: success, data: Sorted }).

% Succeeds when the entry has and item
% in the given date range.

date_in_range(Start, End, Entry):-
    get_dict_ex(items, Entry, Items),
    member(Item, Items),
    get_dict(date, Item, Date),
    Date >= Start, Date =< End.

% Attaches the earliest item date to
% the entry.

attach_earliest_time(Entry, Out):-
    earliest_date(Entry, Date),
    put_dict(date, Entry, Date, Out).

earliest_date(Entry, Date):-
    get_dict_ex(items, Entry, Items),
    earliest_item_date(Items,  Date).

earliest_item_date([Item|Items], Earliest):-
    get_dict_ex(date, Item, Date),
    earliest_item_date(Items, Date, Earliest).

earliest_item_date([Item|Items], Acc, Earliest):-
    get_dict_ex(date, Item, Date),
    (   Acc < Date
    ->  earliest_item_date(Items, Acc, Earliest)
    ;   earliest_item_date(Items, Date, Earliest)).

earliest_item_date([], Acc, Acc).

% Responds entry without accounts.

:- route_get(api/entry/Id, get_entry(Id)).

get_entry(Id):-
    ds_get(Id, Entry),
    reply_json(_{ status: success, data: Entry }).

% Responds full entry with accounts.

:- route_get(api/entry/Id/full, get_full_entry(Id)).

get_full_entry(Id):-
    ds_get(Id, Entry),
    attach_entry_accounts(Entry, Tmp),
    reply_json(_{ status: success, data: Tmp }).

attach_entry_accounts(Entry, Out):-
    get_dict_ex(items, Entry, Items),
    attach_item_accounts(Items, OutItems),
    put_dict(items, Entry, OutItems, Out).

attach_item_accounts([Item|Items], [OutItem|OutItems]):-
    get_dict_ex(debit, Item, Debit),
    get_dict_ex(credit, Item, Credit),
    ds_get(Debit, DebitAccount),
    ds_get(Credit, CreditAccount),
    New = _{
        debit: DebitAccount,
        credit: CreditAccount
    },
    put_dict(New, Item, OutItem),
    attach_item_accounts(Items, OutItems).

attach_item_accounts([], []).

:- route_del(api/entry/Id, delete_entry(Id)).

delete_entry(Id):-
    ds_remove(Id),
    reply_json(_{ status: success, data: Id }).

:- route_put(api/entry/Id, update_entry(Id)).

update_entry(Id):-
    http_current_request(Request),
    http_read_json_dict(Request, Dict),
    entry(Dict, Entry, Errors),
    (   Errors = []
    ->  put_dict('$id', Entry, Id, Tmp),
        ds_update(Tmp),
        reply_json(_{ status: success, data: Id })
    ;   reply_error(invalid_data)).

:- route_post(api/account, new_account).

new_account:-
    http_current_request(Request),
    http_read_json_dict(Request, Dict),
    account(Dict, Account, Errors),
    (   Errors = []
    ->  ds_insert(account, Account, Id),
        reply_json(_{ status: success, data: Id })
    ;   reply_error(invalid_data)).

:- route_get(api/accounts, get_accounts).

get_accounts:-
    ds_all(account, Accounts),
    sort_dict(code, Accounts, Sorted),
    reply_json(_{ status: success, data: Sorted }).

:- route_get(api/account/Id, get_account(Id)).

get_account(Id):-
    (   ds_get(Id, Account)
    ->  reply_json(_{ status: success, data: Account })
    ;   reply_json(_{ status: error, code: 101, message: 'No such account.' })).

:- route_put(api/account/Id, update_account(Id)).

update_account(Id):-
    http_current_request(Request),
    http_read_json_dict(Request, Dict),
    account(Dict, Account, Errors),
    (   Errors = []
    ->  put_dict('$id', Account, Id, Tmp),
        ds_update(Tmp),
        reply_json(_{ status: success, data: Id })
    ;   reply_error(invalid_data)).

% Account removing.
% Checks that the account is not
% used by any entry.

:- route_del(api/account/Id, delete_account(Id)).

delete_account(Id):-
    ds_all(entry, [items], Entries),
    (   entries_use_account(Entries, Id)
    ->  reply_error(account_in_use)
    ;   ds_remove(Id),
        reply_json(_{ status: success, data: Id })).

entries_use_account([Entry|_], Account):-
    get_dict_ex(items, Entry, Items),
    member(Item, Items),
    (   get_dict_ex(debit, Item, Account)
    ;   get_dict_ex(credit, Item, Account)), !.

entries_use_account([_|Entries], Account):-
    entries_use_account(Entries, Account).

% Items of an account.

:- route_get(api/account/Id/items/Start/End,
    get_account_items(Id, Start, End)).

get_account_items(Id, Start, End):-
    atom_number(Start, StartDate),
    atom_number(End, EndDate),
    ds_all(entry, All),
    account_items(All, StartDate, EndDate, Id, Items),
    sort_dict(date, desc, Items, Sorted),
    reply_json(_{ status: success, data: Sorted }).

account_items(All, Start, End, Id, Items):-
    account_items(All, Start, End, Id, [], Items).

account_items([Entry|Entries], Start, End, Id, Acc, AccountItems):-
    get_dict_ex(title, Entry, EntryTitle),
    get_dict_ex('$id', Entry, EntryId),
    get_dict_ex(items, Entry, Items),
    account_entry_items(Items, Start, End, EntryTitle, EntryId, Id, Acc, Tmp),
    account_items(Entries, Start, End, Id, Tmp, AccountItems).

account_items([], _, _, _, Acc, Acc).

account_entry_items([Item|Items], Start, End, EntryTitle, EntryId, Id, Acc, Out):-
    get_dict_ex(debit, Item, Debit),
    get_dict_ex(credit, Item, Credit),
    get_dict_ex(eur_amount, Item, Eur),
    get_dict_ex(title, Item, Title),
    get_dict_ex(date, Item, Date),
    (   (Debit = Id ; Credit = Id),
        Date >= Start, Date =< End
    ->  ds_get(Debit, DebitAccount),
        ds_get(Credit, CreditAccount),
        (   Debit = Id
        ->  get_dict_ex(type, DebitAccount, Type),
            effect_multiplier(debit, Type, Mult)
        ;   get_dict_ex(type, CreditAccount, Type),
            effect_multiplier(credit, Type, Mult)),
        Amount is Mult * Eur,
        Row = _{
            debit: DebitAccount,
            credit: CreditAccount,
            amount: Eur,
            entry_title: EntryTitle,
            entry_id: EntryId,
            date: Date,
            effect: Amount,
            title: Title
        },
        account_entry_items(Items, Start, End, EntryTitle, EntryId, Id, [Row|Acc], Out)
    ;   account_entry_items(Items, Start, End, EntryTitle, EntryId, Id, Acc, Out)).

account_entry_items([], _, _, _, _, _, Acc, Acc).

effect_multiplier(debit, liability, -1).
effect_multiplier(debit, income, -1).
effect_multiplier(debit, equity, -1).
effect_multiplier(debit, asset, 1).
effect_multiplier(debit, expense, 1).

effect_multiplier(credit, liability, 1).
effect_multiplier(credit, income, 1).
effect_multiplier(credit, equity, 1).
effect_multiplier(credit, asset, -1).
effect_multiplier(credit, expense, -1).
