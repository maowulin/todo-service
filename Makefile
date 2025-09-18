.PHONY: dev dev:frontend dev:backend generate install

install:
	pnpm install

generate:
	pnpm -C frontend run generate && pnpm -C backend run generate

dev: dev:backend dev:frontend

dev:backend:
	pnpm -C backend dev

dev:frontend:
	pnpm -C frontend dev