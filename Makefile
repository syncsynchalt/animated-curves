all:

dist:
	@if [[ -z "${site}" ]]; then echo "Must set \$$site variable"; exit 1; fi
	rsync -avh --exclude=test --exclude=node_modules --exclude=package\*.json site/ ${site}
