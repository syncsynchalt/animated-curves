all: placeholders

placeholders:
	tools/placeholders.py < site/index.html > site/index.html.out
	mv site/index.html.out site/index.html

dist:
	@if [[ -z "${site}" ]]; then echo "Must set \$$site variable"; exit 1; fi
	rsync -avh --exclude=test --exclude=node_modules --exclude=package\*.json site/ ${site}
