all: placeholders

venv:
	virtualenv venv

placeholders:
	tools/placeholders.py < site/index.html > site/index.html.out
	mv site/index.html.out site/index.html

dist:
	@if [[ -z "${DISTROOT}" ]]; then echo "Must set \$$DISTROOT variable"; exit 1; fi
	rsync -avh --exclude=test --exclude=node_modules --exclude=package\*.json site/ ${DISTROOT}/invis/ec-demo/
