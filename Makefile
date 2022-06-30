all:

HEXNOW=$(shell echo "obase=16;$(shell date +%s)" | bc -l | tr A-F a-f)

dist-prep:
	@if [[ -z "${DISTROOT}" ]]; then echo "Must set \$$DISTROOT variable"; exit 1; fi
	rm -rf tmp-dist-site/
	rsync -a --exclude=test --exclude=node_modules --exclude=package\*.json site/ tmp-dist-site/
	./brust.sh tmp-dist-site

dist: dist-prep
	rsync -rlpvhc --exclude=test --exclude=node_modules --exclude=package\*.json tmp-dist-site/ ${DISTROOT}/curves/
	rm -rf tmp-dist-site/
