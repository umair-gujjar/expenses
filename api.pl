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
    member(Item, Entry.items),
    Date = Item.date,
    Date >= Start, Date =< End.

% Attaches the earliest item date to
% the entry.

attach_earliest_time(Entry, Out):-
    earliest_date(Entry, Date),
    put_dict(date, Entry, Date, Out).

earliest_date(Entry, Date):-
    earliest_item_date(Entry.items,  Date).

earliest_item_date([Item|Items], Earliest):-
    earliest_item_date(Items, Item.date, Earliest).

earliest_item_date([Item|Items], Acc, Earliest):-
    Date = Item.date,
    (   Acc < Date
    ->  earliest_item_date(Items, Acc, Earliest)
    ;   earliest_item_date(Items, Date, Earliest)).

earliest_item_date([], Acc, Acc).

% Responds entry without accounts.

:- route_get(api/entry/Id, get_entry(Id)).

get_entry(Id):-
    ds_col_get(entry, Id, Entry),
    reply_json(_{ status: success, data: Entry }).

% Responds full entry with accounts.

:- route_get(api/entry/Id/full, get_full_entry(Id)).

get_full_entry(Id):-
    ds_col_get(entry, Id, Entry),
    entry_accounts(Entry, Accounts),
    entry_changes(Entry, Changes),
    put_dict(Entry, _{
        accounts: Accounts,
        changes: Changes
    }, Full),
    reply_json(_{ status: success, data: Full }).

entry_accounts(Entry, Accounts):-
    entry_item_accounts(Entry.items, _{}, Accounts).

entry_item_accounts([Item|Items], Acc, Accounts):-
    Debit = Item.debit,
    Credit = Item.credit,
    (   get_dict(Debit, Acc, _)
    ->  Tmp = Acc
    ;   ds_col_get(account, Debit, DebitAccount),
        put_dict(Debit, Acc, DebitAccount, Tmp)),
    (   get_dict(Credit, Acc, _)
    ->  New = Tmp
    ;   ds_col_get(account, Credit, CreditAccount),
        put_dict(Credit, Tmp, CreditAccount, New)),
    entry_item_accounts(Items, New, Accounts).

entry_item_accounts([], Acc, Acc).

% Project changes in accounts.

entry_changes(Entry, Changes):-
    entry_item_changes(Entry.items, Pairs),
    collect_changes(Pairs, Changes).

entry_item_changes([Item|Items], Changes):-
    Debit = Item.debit,
    Credit = Item.credit,
    Amount = Item.eur_amount,
    account_effect(Debit, debit, Amount, DebitEffect),
    account_effect(Credit, credit, Amount, CreditEffect),
    Changes = [Debit-DebitEffect,Credit-CreditEffect|Rest],
    entry_item_changes(Items, Rest).

entry_item_changes([], []).

collect_changes([Key-Value|Changes], Out):-
    collect_changes(Changes, Rest),
    increase_key(Key, Rest, Value, Out).

collect_changes([], _{}).

increase_key(Key, In, Value, Out):-
    (   get_dict(Key, In, Old)
    ->  New is Old + Value,
        put_dict(Key, In, New, Out)
    ;   put_dict(Key, In, Value, Out)).

:- route_del(api/entry/Id, delete_entry(Id)).

delete_entry(Id):-
    ds_col_remove(entry, Id),
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
    (   ds_col_get(account, Id, Account)
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
    ;   ds_col_remove(account, Id),
        reply_json(_{ status: success, data: Id })).

entries_use_account([Entry|_], Account):-
    member(Item, Entry.items),
    (   Account = Item.debit
    ;   Account = Item.credit), !.

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
    EntryTitle = Entry.title,
    EntryId = Entry.'$id',
    Items = Entry.items,
    account_entry_items(Items, Start, End, EntryTitle, EntryId, Id, Acc, Tmp),
    account_items(Entries, Start, End, Id, Tmp, AccountItems).

account_items([], _, _, _, Acc, Acc).

account_entry_items([Item|Items], Start, End, EntryTitle, EntryId, Id, Acc, Out):-
    Debit = Item.debit,
    Credit = Item.credit,
    Eur = Item.eur_amount,
    Title = Item.title,
    Date = Item.date,
    (   (Debit = Id ; Credit = Id),
        Date >= Start, Date =< End
    ->  ds_col_get(account, Debit, DebitAccount),
        ds_col_get(account, Credit, CreditAccount),
        (   Debit = Id
        ->  Type = DebitAccount.type,
            effect_multiplier(debit, Type, Mult)
        ;   Type = CreditAccount.type,
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
effect_multiplier(debit, cash, 1).
effect_multiplier(debit, bank, 1).
effect_multiplier(debit, expense, 1).

effect_multiplier(credit, liability, 1).
effect_multiplier(credit, income, 1).
effect_multiplier(credit, equity, 1).
effect_multiplier(credit, asset, -1).
effect_multiplier(credit, cash, -1).
effect_multiplier(credit, bank, -1).
effect_multiplier(credit, expense, -1).

% Balance account types.

balance(equity).
balance(asset).
balance(liability).

% Calculates amount effect for an account.

account_effect(Id, Side, Amount, Effect):-
    ds_col_get(account, Id, [type], Account),
    effect_multiplier(Side, Account.type, Mult),
    Effect is Mult * Amount.

% Cash flow items.

:- route_get(api/cash/Start/End,
    get_cash_flow(Start, End)).

get_cash_flow(Start, End):-
    atom_number(Start, StartDate),
    atom_number(End, EndDate),
    cash_items(StartDate, EndDate, Items),
    reply_json(_{ status: success, data: Items }).

% Finds items that are in the given date range
% and are made on cash/bank accounts.

cash_items(Start, End, Items):-
    ds_all(entry, Entries),
    filter_entry_cash_items(Entries, Start, End, Items).

filter_entry_cash_items(Entries, Start, End, Items):-
    filter_entry_cash_items(Entries, Start, End, [], Items).

filter_entry_cash_items([Entry|Entries], Start, End, Acc, Filtered):-
    filter_cash_items(Entry.items, Start, End, FilteredItems),
    append(FilteredItems, Acc, NewAcc),
    filter_entry_cash_items(Entries, Start, End, NewAcc, Filtered).

filter_entry_cash_items([], _, _, Acc, Acc).

% Filters out items that are cash or bank items
% (expense or income) and are made in the given date range.

filter_cash_items([Item|Items], Start, End, [Out|Filtered]):-
    Date = Item.date,
    Date >= Start, Date =< End,
    Debit = Item.debit,
    Credit = Item.credit,
    Amount = Item.eur_amount,
    (   account_is_cash(Debit),
        \+ account_is_cash(Credit),
        account_effect(Debit, debit, Amount, Effect),
        ds_col_get(account, Credit, CreditAccount),
        Out = _{ amount: Effect, account: CreditAccount, date: Date }
    ;   account_is_cash(Credit),
        \+ account_is_cash(Debit),
        account_effect(Credit, credit, Amount, Effect),
        ds_col_get(account, Debit, DebitAccount),
        Out = _{ amount: Effect, account: DebitAccount, date: Date }), !,
    filter_cash_items(Items, Start, End, Filtered).

filter_cash_items([_|Items], Start, End, Filtered):- !,
    filter_cash_items(Items, Start, End, Filtered).

filter_cash_items([], _, _, []).

account_is_expense_or_income(AccountId):-
    ds_col_get(account, AccountId, [type], Account),
    Type = Account.type,
    (Type = expense ; Type = income), !.

% Succeeds when the account is a
% cash or bank account.

account_is_cash(AccountId):-
    ds_col_get(account, AccountId, [type], Account),
    Type = Account.type,
    (Type = cash ; Type = bank), !.
