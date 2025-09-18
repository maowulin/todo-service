package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"connectrpc.com/connect"
	"github.com/google/uuid"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"

	todov1 "todo-service/gen/todo/v1"
	"todo-service/gen/todo/v1/todov1connect"
)

type task struct {
	ID        string
	Text      string
	Completed bool
	CreatedAt time.Time
}

type todoServer struct {
	tasks []*task
	mu    sync.RWMutex
}

func (s *todoServer) AddTask(
	ctx context.Context,
	req *connect.Request[todov1.AddTaskRequest],
) (*connect.Response[todov1.AddTaskResponse], error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	newTask := &task{
		ID:        uuid.New().String(),
		Text:      req.Msg.Text,
		Completed: false,
		CreatedAt: time.Now(),
	}

	s.tasks = append(s.tasks, newTask)

	response := &todov1.AddTaskResponse{
		Task: &todov1.Task{
			Id:        newTask.ID,
			Text:      newTask.Text,
			Completed: newTask.Completed,
			CreatedAt: newTask.CreatedAt.Format(time.RFC3339),
		},
	}

	return connect.NewResponse(response), nil
}

func (s *todoServer) GetTasks(
	ctx context.Context,
	req *connect.Request[todov1.GetTasksRequest],
) (*connect.Response[todov1.GetTasksResponse], error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	protoTasks := make([]*todov1.Task, len(s.tasks))
	for i, t := range s.tasks {
		protoTasks[i] = &todov1.Task{
			Id:        t.ID,
			Text:      t.Text,
			Completed: t.Completed,
			CreatedAt: t.CreatedAt.Format(time.RFC3339),
		}
	}

	response := &todov1.GetTasksResponse{
		Tasks: protoTasks,
	}

	return connect.NewResponse(response), nil
}

func (s *todoServer) DeleteTask(
	ctx context.Context,
	req *connect.Request[todov1.DeleteTaskRequest],
) (*connect.Response[todov1.DeleteTaskResponse], error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i, t := range s.tasks {
		if t.ID == req.Msg.Id {
			s.tasks = append(s.tasks[:i], s.tasks[i+1:]...)
			return connect.NewResponse(&todov1.DeleteTaskResponse{Success: true}), nil
		}
	}

	return connect.NewResponse(&todov1.DeleteTaskResponse{Success: false}), nil
}

func main() {
	server := &todoServer{}
	mux := http.NewServeMux()
	path, handler := todov1connect.NewTodoServiceHandler(server)
	mux.Handle(path, handler)

	fmt.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(
		":8080",
		h2c.NewHandler(mux, &http2.Server{}),
	))
}