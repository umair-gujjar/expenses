:- module(schema, [
    account/3,
    entry/3
]).

account(In, Out, Errors):-
    account_schema(Schema),
    convert(In, Schema, Out, Errors).

entry(In, Out, Errors):-
    entry_schema(Schema),
    convert(In, Schema, Out, Errors).

convert(In, Schema, Out, Errors):-
    convert(@, Schema, In, Out, [], Errors).

convert(Path, Schema, In, Out, EIn, EOut):-
    get_dict_ex(type, Schema, Type),
    convert_type(Type, Path, Schema, In, Out, EIn, EOut).

% Converts dict type.
% Adds error not_dict(Path) when
% the In value is not a dict.

convert_type(dict, Path, Schema, In, Out, EIn, EOut):- !,
    convert_dict(Path, Schema, In, Out, EIn, EOut).

convert_type(string, Path, Schema, In, Out, EIn, EOut):- !,
    convert_string(Path, Schema, In, Out, EIn, EOut).

convert_type(atom, Path, Schema, In, Out, EIn, EOut):- !,
    convert_atom(Path, Schema, In, Out, EIn, EOut).

convert_type(enum, Path, Schema, In, Out, EIn, EOut):- !,
    convert_enum(Path, Schema, In, Out, EIn, EOut).

convert_type(integer, Path, Schema, In, Out, EIn, EOut):- !,
    convert_integer(Path, Schema, In, Out, EIn, EOut).

convert_type(number, Path, Schema, In, Out, EIn, EOut):- !,
    convert_number(Path, Schema, In, Out, EIn, EOut).

convert_type(list, Path, Schema, In, Out, EIn, EOut):- !,
    convert_list(Path, Schema, In, Out, EIn, EOut).

convert_type(Type, Path, _, _, _, _, _):-
    throw(error(unknown_type(Path, Type))).

% Converts list.

convert_list(Path, Schema, In, Out, EIn, EOut):-
    is_list(In), !,
    get_dict_ex(items, Schema, ItemSchema),
    convert_list(In, Path, 0, ItemSchema, Out, EIn, EOut).

convert_list(Path, _, In, In, EIn, EOut):-
    EOut = [not_list(Path, In)|EIn].

convert_list([In|Ins], Path, N, ItemSchema, [Out|Outs], EIn, EOut):-
    convert(Path/[N], ItemSchema, In, Out, EIn, ETmp),
    N1 is N + 1,
    convert_list(Ins, Path, N1, ItemSchema, Outs, ETmp, EOut).

convert_list([], _, _, _, [], EIn, EIn).

convert_list(Arg, _, _):-
    throw(error(validation(not_list(Arg)))).

% Converts dict.

convert_dict(Path, Schema, In, Out, EIn, EOut):-
    is_dict(In, Tag), !,
    convert_dict(Tag, Path, Schema, In, Out, EIn, EOut).

convert_dict(Path, _, In, In, EIn, EOut):-
    EOut = [not_dict(Path, In)|EIn].

convert_dict(Tag, Path, Schema, In, Out, EIn, EOut):-
    (   get_dict(tag, Schema, Tag)
    ->  get_dict_ex(keys, Schema, Keys),
        dict_pairs(Keys, _, Pairs),
        convert_keys(Pairs, Path, In, OutPairs, EIn, EOut),
        dict_pairs(Out, Tag, OutPairs)
    ;   Out = In,
        EOut = [invalid_tag(Path)|EIn]).

convert_keys([Key-Schema|Pairs], Path, In, [Key-Out|OutPairs], EIn, EOut):-
    (   get_dict(Key, In, Value)
    ->  convert(Path/Key, Schema, Value, Out, EIn, ETmp),
        convert_keys(Pairs, Path, In, OutPairs, ETmp, EOut)
    ;   ETmp = [no_key(Path/Key)|EIn],
        convert_keys(Pairs, Path, In, OutPairs, ETmp, EOut)).

convert_keys([], _, _, [], Errors, Errors).

% Converts string.
% FIXME min/max length

convert_string(_, _, In, In, EIn, EIn):-
    string(In), !.

convert_string(_, _, In, Out, EIn, EIn):-
    atom(In), !,
    atom_string(In, Out).

convert_string(Path, _, In, In, EIn, EOut):-
    EOut = [not_string(Path, In)|EIn].

% Converts atom.
% FIXME min/max length

convert_atom(_, _, In, In, EIn, EIn):-
    atom(In), !.

convert_atom(_, _, In, Out, EIn, EIn):-
    string(In), !,
    atom_string(Out, In).

convert_atom(Path, _, In, In, EIn, EOut):-
    EOut = [not_atom(Path, In)|EIn].

% Checks integer.
% FIXME check min/max.

convert_integer(_, _, In, In, EIn, EIn):-
    integer(In), !.

convert_integer(Path, _, In, In, EIn, EOut):-
    EOut = [not_integer(Path, In)|EIn].

% Checks number.
% FIXME check min/max.

convert_number(_, _, In, In, EIn, EIn):-
    number(In), !.

convert_number(Path, _, In, In, EIn, EOut):-
    EOut = [not_number(Path, In)|EIn].

% Converts/checks enum.

convert_enum(Path, Schema, In, In, EIn, EOut):-
    atom(In), !,
    get_dict_ex(values, Schema, Values),
    check_enum(Path, Values, In, EIn, EOut).

convert_enum(Path, Schema, In, Out, EIn, EOut):-
    string(In), !,
    atom_string(Out, In),
    get_dict_ex(values, Schema, Values),
    check_enum(Path, Values, Out, EIn, EOut).

check_enum(_, Values, In, EIn, EIn):-
    memberchk(In, Values), !.

check_enum(Path, _, In, EIn, EOut):-
    EOut = [invalid_enum(Path, In)|EIn].

account_schema(_{
    type: dict,
    tag: account,
    keys: _{
        name: _{ type: string },
        code: _{ type: atom },
        type: _{
            type: enum,
            values: [
                liability,
                income,
                equity,
                asset,
                expense,
                cash,
                bank
            ]
        }
    }
}).

entry_schema(_{
    type: dict,
    tag: entry,
    keys: _{
        title: _{ type: string },
        items: _{
            type: list,
            items: _{
                type: dict,
                tag: item,
                keys: _{
                    title: _{ type: string },
                    date: _{ type: integer },
                    debit: _{ type: atom },
                    credit: _{ type: atom },
                    amount: _{ type: integer },
                    eur_amount: _{ type: integer },
                    currency: _{
                        type: enum,
                        values: [
                            eur,
                            usd,
                            gbp
                        ]
                    }
                }
            }
        }
    }
}).
