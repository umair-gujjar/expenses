all: ui

BROWSERIFY = node_modules/.bin/browserify
EXORCIST = node_modules/.bin/exorcist
JSHINT = node_modules/.bin/jshint

BUNDLE = public/js/bundle.js

MAP = $(BUNDLE).map

EXTERNAL = public/js/external/knockout.js public/js/external/fetch.js \
	public/js/external/es6-promise.js public/js/external/router-standalone.js \
	public/js/external/kontainer-standalone.js

# Make pipe fail when a command
# in pipe fails.

export SHELLOPTS:=errexit:pipefail

.DELETE_ON_ERROR:

ui: $(EXTERNAL) $(BUNDLE)

BUNDLE_DEPS = public/js/app.js public/js/lib/*.js public/js/controller/*.js \
	public/js/controller/vm/*.js public/templates/*.html Makefile

$(BUNDLE): $(BUNDLE_DEPS)
	rm -f $(MAP)
	$(BROWSERIFY) --debug -t brfs -t uglifyify $< | $(EXORCIST) $(MAP) > $@

check:
	$(JSHINT) public/js/app.js public/js/lib/ public/js/controller/

public/js/external/knockout.js: node_modules/knockout/build/output/knockout-latest.js
	cp $< $@

public/js/external/fetch.js: node_modules/whatwg-fetch/fetch.js
	cp $< $@

public/js/external/es6-promise.js: node_modules/es6-promise/dist/es6-promise.min.js
	cp $< $@

public/js/external/router-standalone.js: node_modules/hash-regex-router/dist/router-standalone.js
	cp $< $@

public/js/external/kontainer-standalone.js: node_modules/kontainer/dist/kontainer-standalone.js
	cp $< $@

clean:
	rm -f $(EXTERNAL) $(BUNDLE) $(MAP)

deploy:
	ssh www-data@infdot.com 'cd /sites/expenses.infdot.com && git pull origin master'
	ssh root@infdot.com 'supervisorctl restart expenses_infdot_com'

.PHONY: all ui clean check deploy
