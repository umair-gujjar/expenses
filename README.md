# expenses

General accounting ledger. The backend is written in SWI-Prolog
and frontend is written in KnockoutJS+Bootstrap 3.

## Configuration

Add file `auth.json` with users and passwords:

```json
[
    {
        "username": "test",
        "password": "test"
    }
]
```

## Running

Backend requires SWI-Prolog 7.x and packs:

    ?- pack_install('http://packs.rlaanemets.com/dict-schema/dict_schema-0.0.2.tgz').
    ?- pack_install('http://packs.rlaanemets.com/docstore/docstore-2.0.1.tgz').
    ?- pack_install('http://packs.rlaanemets.com/simple-template/simple_template-1.0.1.tgz').
    ?- pack_install('http://packs.rlaanemets.com/alternative-router/arouter-1.1.1.tgz').
    ?- pack_install('http://packs.rlaanemets.com/sort-dict/sort_dict-0.0.3.tgz').

For running on *nix platform:

    swipl -s main.pl -- --port=8080 --interactive=true --workers=16

The app is accessible from <http://localhost:8080>. Accounts must
be added from <http://localhost:8080/#accounts> before any entries
can be added.

## License

The MIT License.
