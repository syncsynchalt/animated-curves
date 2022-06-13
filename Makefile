all:

dist:
	@if [[ -z "${DISTROOT}" ]]; then echo "Must set \$$DISTROOT variable"; exit 1; fi
	rsync -avh --exclude=test --exclude=node_modules --exclude=package\*.json site/ ${DISTROOT}/invis/ec-demo/
