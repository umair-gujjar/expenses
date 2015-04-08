:- module(schema, [
    account/3,
    entry/3
]).

:- use_module(library(dict_schema)).

account(In, Out, Errors):-
    convert(In, account, Out, Errors).

entry(In, Out, Errors):-
    convert(In, entry, Out, Errors).

:- register_schema(account, _{
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

:- register_schema(entry, _{
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
