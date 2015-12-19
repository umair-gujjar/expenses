:- module(main, []).

% Catch uncaught errors/warnings and shut down
% when they occur.

:- dynamic(loading/1).
:- asserta(loading(0)).

% The first hook is for detecting
% loading state.

user:message_hook(Term, _, _):-
    (   Term = load_file(start(Level, _))
    ->  asserta(loading(Level))
    ;   (   Term = load_file(done(Level, _, _, _, _, _))
        ->  retractall(loading(Level))
        ;   true)),
    fail.

% The second hook shuts down SWI when
% error occurs during loading.

user:message_hook(Term, Type, _):-
    loading(_),
    ( Type = error ; Type = warning ),
    message_to_string(Term, String),
    writeln(user_error, String),
    halt(1).

:- use_module(library(http/http_json)).
:- use_module(library(http/http_error)).
:- use_module(library(http/http_session)).
:- use_module(library(http/http_wrapper)).
:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_unix_daemon)).
:- use_module(library(http/http_parameters)).
:- use_module(library(http/http_session)).
:- use_module(library(http/json)).

:- use_module(library(debug)).
:- use_module(library(docstore)).
:- use_module(library(arouter)).
:- use_module(library(st/st_render)).
:- use_module(library(st/st_file)).

:- use_module(api).

% Log errors to stderr.

:- debug(http(error)).

% Set session options.

:- http_set_session_options([
    create(auto),
    timeout(86400)
]).

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

:- route_get(/, do_auth, front).

front:-
    format('Content-type: text/html; charset=UTF-8~n~n'),
    current_output(Stream),
    st_render_file(views/index, _{}, Stream,
        _{ strip: true, cache: true }).

% Shows the login form.

:- route_get(login, login_form).

login_form:-
    format('Content-type: text/html; charset=UTF-8~n~n'),
    current_output(Stream),
    st_render_file(views/login, _{}, Stream,
        _{ strip: true, cache: true }).

% Runs authentication.

:- route_post(login, login_check).

login_check:-
    http_current_request(Request),
    http_parameters(Request, [
        username(Username, [atom, default('')]),
        password(Password, [atom, default('')])
    ]),
    (   auth(Username, Password)
    ->  http_session_assert(login),
        http_redirect(see_other, '/', Request)
    ;   http_redirect(see_other, '/login#invalid', Request)).

% Main routing predicate.

top_route(Request):-
    (   route(Request)
    ->  true
    ;   (   serve_file(Request)
        ->  true
        ;   http_404([], Request))).

serve_file(Request):-
    memberchk(path(Path), Request),
    atom_concat(public, Path, File),
    exists_file(File),
    http_reply_file(File, [], Request).

http_unix_daemon:http_server_hook(Options):-
    ds_open('data.docstore'),
    http_server(top_route, Options).

% Provides toplevel for non-forking daemon.

toplevel:-
    on_signal(int,  _, quit),
    on_signal(hup,  _, quit),
    on_signal(term, _, quit),
    repeat,
    thread_get_message(Msg),
    Msg == quit,
    halt(0).

quit(_) :-
    thread_send_message(main, quit).

:- dynamic(started).

start:-
    (   started
    ->  true
    ;   assertz(started),
        http_daemon).

:- start.
