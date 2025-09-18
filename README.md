# Todo Service

A memory-based todo list service built with Go + ConnectRPC + Next.js, using binary protocol for communication.

## Features

- ✅ Add tasks with `AddTask(text)`
- ✅ Get all tasks with `GetTasks()`
- ✅ Delete tasks with `DeleteTask(id)`
- ✅ Binary protocol for efficient communication
- ✅ Clean React/Next.js frontend
- ✅ Unit tests for backend services

## Architecture

- **Backend**: Go with ConnectRPC using binary wire format
- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Communication**: ConnectRPC with binary protocol for performance

## Getting Started

### Prerequisites

- Go 1.22+
- Node.js 18+
- npm or yarn

### Running the Backend

```bash
./run-backend.sh
```

The server will start on `http://localhost:8080`

### Running the Frontend

```bash
./run-frontend.sh
```

The frontend will start on `http://localhost:3000`

### Running Tests

```bash
cd backend
go test -v
```

## API Endpoints

- `POST /todo.v1.TodoService/AddTask` - Add a new task
- `POST /todo.v1.TodoService/GetTasks` - Get all tasks
- `POST /todo.v1.TodoService/DeleteTask` - Delete a task by ID

All endpoints use ConnectRPC with binary protocol.
