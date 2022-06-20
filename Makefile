all:

NOW=$(shell date +%s)

bustin: bust
brust: bust
bust:
	sed -i '' -re 's/bustin=[0-9]*/bustin='$(NOW)'/g' site/*.js site/*/*.js site/*.html

dist:
	@if [[ -z "${DISTROOT}" ]]; then echo "Must set \$$DISTROOT variable"; exit 1; fi
	rm -rf tmp-dist-site/
	rsync -avh --exclude=test --exclude=node_modules --exclude=package\*.json site/ tmp-dist-site/
	sed -i '' -re 's/bustin=[0-9]*/bustin='$(NOW)'/g' tmp-dist-site/*.html tmp-dist-site/*.js tmp-dist-site/*/*.js
	rsync -avh --exclude=test --exclude=node_modules --exclude=package\*.json tmp-dist-site/ ${DISTROOT}/curves/
	rm -rf tmp-dist-site/
