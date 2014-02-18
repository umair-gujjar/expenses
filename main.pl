:- module(main, []).

:- use_module(library(http/http_json)).
:- use_module(library(http/http_error)).
:- use_module(library(http/http_wrapper)).
:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_unix_daemon)).

:- use_module(library(docstore)).
:- use_module(library(arouter)).
:- use_module(library(st/st_render)).
:- use_module(library(st/st_file)).

:- use_module(api).

:- st_set_extension(html).

:- route_get(/, front).

front:-
    format('Content-type: text/html; charset=UTF-8~n~n'),
    st_render_file(views/index, _{}).

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
