# expenses

General accounting ledger. The backend is written in SWI-Prolog
and frontend is written in KnockoutJS+Bootstrap 3.

## Running

Backend requires SWI-Prolog 7.x and packs:

 * [dict_schema](http://www.swi-prolog.org/pack/list?p=dict_schema)
 * [docstore](http://www.swi-prolog.org/pack/list?p=docstore)

These can be installed:

    ?- pack_install(dict_schema).
    ?- pack_install(docstore).

For running on *nix platform:

    swipl -s main.pl -- --port=8080 --interactive=true --workers=16

The app is accessible from <http://localhost:8080>. Accounts must
be added from <http://localhost:8080/#accounts> before any entries
can be added. There is no built-in authentication.

## License

The MIT License.
