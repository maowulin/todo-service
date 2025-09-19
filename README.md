# Todo Service

一个基于 Go + ConnectRPC + Next.js 的内存型 Todo 应用，前后端通过二进制协议高效通信。

## 功能特性（已实现）

- 新增任务、删除任务、获取任务列表
- 更新任务：勾选完成/取消、标星收藏/取消、设置/清除截止时间
- 前端分组展示：已收藏、未完成、已完成；分组标题始终展示数量（包含 0）
- 截止时间提醒：到期且未完成时触发浏览器通知（需用户授权）
- 任务支持设置/清除截止时间（日期与时间）

## 技术与架构

- 后端：
  - Go + ConnectRPC（connect-go），HTTP/2 h2c 明文服务
  - Proto 定义见 backend/todo.proto，内存存储（进程重启数据清空）
  - 端口：环境变量 BACKEND_PORT 或 PORT（默认 8080）
- 前端：
  - Next.js + TypeScript + Tailwind CSS
  - connect-web（Promise 客户端）+ 二进制协议
  - 通过 Next 重写将 /api/\* 代理到后端，环境变量 BACKEND_ORIGIN（默认 http://localhost:8080）
  - 代码生成：buf + protoc-gen-connect-es + protoc-gen-es（生成在 frontend/src/gen）

## 安装与运行

### 先决条件

- Go 1.22+
- Node.js 18+
- pnpm（推荐）
- buf CLI（前端类型生成需要）。未安装可通过：
  - macOS: brew install bufbuild/buf/buf
  - 或通用: go install github.com/bufbuild/buf/cmd/buf@latest

### 安装与启动

pnpm install

pnpm dev

pnpm build

## 使用说明

1. 访问前端页面，输入内容添加任务
2. 勾选完成/取消完成；点击星标进行收藏/取消收藏
3. 为任务设置截止时间（支持清除）；到期时若未完成且已授权通知，将收到浏览器提醒
4. 分组：
   - 已收藏（仅收藏任务）
   - 未完成（排除收藏）
   - 已完成（排除收藏，可折叠/展开）

## API 概览（ConnectRPC）

- todo.v1.TodoService
  - AddTask(AddTaskRequest) -> AddTaskResponse
  - GetTasks(GetTasksRequest) -> GetTasksResponse
  - DeleteTask(DeleteTaskRequest) -> DeleteTaskResponse
  - UpdateTask(UpdateTaskRequest) -> UpdateTaskResponse（支持 presence，可部分更新 completed/favorite/due_at）

服务默认路径经 connect 路由暴露；前端通过 /api/\* 代理到后端（见 frontend/next.config.js）。

## 配置

- 后端端口：BACKEND_PORT 或 PORT（默认 8080）
- 前端代理目标：BACKEND_ORIGIN（默认 http://localhost:8080）

## 限制与提示

- 数据存储在内存中，重启后端进程数据会丢失
- 浏览器通知需用户授权，移动端和部分浏览器可能受限
