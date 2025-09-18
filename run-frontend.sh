#!/bin/bash

echo "Installing dependencies..."
pnpm install -C frontend

echo "Generating protobuf/types for frontend..."
pnpm run generate -C frontend

echo "Starting frontend..."
pnpm run dev -C frontend