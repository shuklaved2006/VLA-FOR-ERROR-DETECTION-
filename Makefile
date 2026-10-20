.PHONY: install test build run

install:
	npm ci

test:
	npm test

build:
	npm run build

run:
	npm run start
