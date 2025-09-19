package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"sync"
	"time"

	"connectrpc.com/connect"
	"github.com/google/uuid"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"

	todov1 "todo-service/gen"
	"todo-service/gen/todov1connect"
)

type task struct {
	ID        string
	Text      string
	Completed bool
	CreatedAt time.Time
	Favorite  bool
	DueAt     string
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
		Favorite:  false,
		DueAt:     "",
	}

	s.tasks = append(s.tasks, newTask)

	response := &todov1.AddTaskResponse{
		Task: &todov1.Task{
			Id:        newTask.ID,
			Text:      newTask.Text,
			Completed: newTask.Completed,
			CreatedAt: newTask.CreatedAt.Format(time.RFC3339),
			Favorite:  newTask.Favorite,
			DueAt:     newTask.DueAt,
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
			Favorite:  t.Favorite,
			DueAt:     t.DueAt,
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

func (s *todoServer) UpdateTask(
	ctx context.Context,
	req *connect.Request[todov1.UpdateTaskRequest],
) (*connect.Response[todov1.UpdateTaskResponse], error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, t := range s.tasks {
		if t.ID == req.Msg.Id {
			if req.Msg.Completed != nil {
				t.Completed = req.Msg.GetCompleted()
			}
			if req.Msg.Favorite != nil {
				t.Favorite = req.Msg.GetFavorite()
			}
			if req.Msg.DueAt != nil {
				t.DueAt = req.Msg.GetDueAt()
			}
			updated := &todov1.Task{
				Id:        t.ID,
				Text:      t.Text,
				Completed: t.Completed,
				CreatedAt: t.CreatedAt.Format(time.RFC3339),
				Favorite:  t.Favorite,
				DueAt:     t.DueAt,
			}
			return connect.NewResponse(&todov1.UpdateTaskResponse{Success: true, Task: updated}), nil
		}
	}

	return connect.NewResponse(&todov1.UpdateTaskResponse{Success: false, Task: nil}), nil
}

func getPort() string {
	port := os.Getenv("BACKEND_PORT")
	if port == "" {
		port = os.Getenv("PORT")
		if port == "" {
			port = "8080"
		}
	}
	return port
}

func newHTTPServer(addr string) *http.Server {
	server := &todoServer{}
	mux := http.NewServeMux()
	path, handler := todov1connect.NewTodoServiceHandler(server)
	mux.Handle(path, handler)
	return &http.Server{
		Addr:    addr,
		Handler: h2c.NewHandler(mux, &http2.Server{}),
	}
}

func main() {
	port := getPort()
	addr := ":" + port
	fmt.Println("Server starting on", addr)
	srv := newHTTPServer(addr)
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		log.Fatal(err)
	}
	log.Fatal(srv.Serve(ln))
}