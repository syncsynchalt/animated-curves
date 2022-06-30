all:

HEXNOW=$(shell echo "obase=16;$(shell date +%s)" | bc -l | tr A-F a-f)

bustin: bust
brust: bust
bust:
	sed -i '' -re 's/\.(css|js)/.\1?b='$(HEXNOW)'/g' site/*.html site/*.js site/*/*.js

dist:
	@if [[ -z "${DISTROOT}" ]]; then echo "Must set \$$DISTROOT variable"; exit 1; fi
	rm -rf tmp-dist-site/
	rsync -a --exclude=test --exclude=node_modules --exclude=package\*.json site/ tmp-dist-site/
	sed -i '' -re 's/\.(css|js)/.\1?b='$(HEXNOW)'/g' \
		tmp-dist-site/*.html tmp-dist-site/*.js tmp-dist-site/*/*.js
	rsync -avh --exclude=test --exclude=node_modules --exclude=package\*.json tmp-dist-site/ ${DISTROOT}/curves/
	rm -rf tmp-dist-site/
