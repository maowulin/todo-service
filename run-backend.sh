#!/bin/bash

cd backend

echo "Installing dependencies..."
go mod download

echo "Generating protobuf code..."
# 如果buf没有安装，先安装
if ! command -v buf &> /dev/null; then
    echo "Installing buf..."
    go install github.com/bufbuild/buf/cmd/buf@latest
fi

if ! command -v protoc-gen-connect-go &> /dev/null; then
    echo "Installing connect-go plugin..."
    go install connectrpc.com/connect/cmd/protoc-gen-connect-go@latest
fi

buf generate

echo "Starting server..."
go run main.go