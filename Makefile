all:

NOW=$(shell date +%s)

bustin: bust
brust: bust
bust:
	sed -i '' -re 's/bustin=[0-9]*/bustin='$(NOW)'/g' site/*.js site/*/*.js site/*.html

dist:
	@if [[ -z "${DISTROOT}" ]]; then echo "Must set \$$DISTROOT variable"; exit 1; fi
	rsync -avh --exclude=test --exclude=node_modules --exclude=package\*.json site/ ${DISTROOT}/curves/
