:- module(auth, [
    auth/2,   % ?Username, ?Password
    do_auth/1 % :Next
]).

:- use_module(library(http/json)).
:- use_module(library(http/http_session)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_wrapper)).

% auth(Username, Password).

:- dynamic(auth/2).

% Read auth data.

add_user(User):-
    atom_string(Username, User.username),
    atom_string(Password, User.password),
    asserta(auth(Username, Password)).

read_auth_data(Stream):-
    json_read_dict(Stream, Users),
    maplist(add_user, Users).

read_auth_data:-
    setup_call_cleanup(
        open('auth.json', read, Stream, []),
        read_auth_data(Stream),
        close(Stream)).

:- read_auth_data.

% Callback for handling authentication.

:- meta_predicate(do_auth(0)).

do_auth(Next):-
    (   http_session_data(login)
    ->  call(Next)
    ;   http_current_request(Request),
        http_redirect(see_other, '/login', Request)).
