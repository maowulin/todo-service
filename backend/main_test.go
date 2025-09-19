package main

import (
	"context"
	"net/http/httptest"
	"os"
	"sync"
	"testing"
	"time"

	"connectrpc.com/connect"
	todov1 "todo-service/gen"
	"todo-service/gen/todov1connect"
)

func TestAddTask(t *testing.T) {
	server := &todoServer{}

	req := &connect.Request[todov1.AddTaskRequest]{
		Msg: &todov1.AddTaskRequest{Text: "Test task"},
	}

	resp, err := server.AddTask(context.Background(), req)
	if err != nil {
		t.Fatalf("AddTask failed: %v", err)
	}

	if resp.Msg.Task.Text != "Test task" {
		t.Errorf("Expected task text 'Test task', got '%s'", resp.Msg.Task.Text)
	}

	if resp.Msg.Task.Completed {
		t.Error("New task should not be completed")
	}

	if resp.Msg.Task.Id == "" {
		t.Error("Task ID should not be empty")
	}
}

func TestGetTasks_List3(t *testing.T) {
	server := &todoServer{}

	testTasks := []string{"Task 1", "Task 2", "Task 3"}
	for _, text := range testTasks {
		req := &connect.Request[todov1.AddTaskRequest]{
			Msg: &todov1.AddTaskRequest{Text: text},
		}
		_, err := server.AddTask(context.Background(), req)
		if err != nil {
			t.Fatalf("AddTask failed: %v", err)
		}
	}

	getReq := &connect.Request[todov1.GetTasksRequest]{
		Msg: &todov1.GetTasksRequest{},
	}

	resp, err := server.GetTasks(context.Background(), getReq)
	if err != nil {
		t.Fatalf("GetTasks failed: %v", err)
	}

	if len(resp.Msg.Tasks) != len(testTasks) {
		t.Errorf("Expected %d tasks, got %d", len(testTasks), len(resp.Msg.Tasks))
	}

	for i, task := range resp.Msg.Tasks {
		if task.Text != testTasks[i] {
			t.Errorf("Task %d: expected '%s', got '%s'", i, testTasks[i], task.Text)
		}
	}
}

func TestAddTaskCreatedAtRFC3339(t *testing.T) {
	server := &todoServer{}
	resp, err := server.AddTask(context.Background(), &connect.Request[todov1.AddTaskRequest]{
		Msg: &todov1.AddTaskRequest{Text: "time"},
	})
	if err != nil {
		t.Fatalf("AddTask failed: %v", err)
	}
	if _, err := time.Parse(time.RFC3339, resp.Msg.Task.CreatedAt); err != nil {
		t.Fatalf("invalid RFC3339 time: %v", err)
	}
}

func TestGetTasks_List2(t *testing.T) {
	server := &todoServer{}

	testTasks := []string{"Task 1", "Task 2", "Task 3"}
	for _, text := range testTasks {
		req := &connect.Request[todov1.AddTaskRequest]{
			Msg: &todov1.AddTaskRequest{Text: text},
		}
		_, err := server.AddTask(context.Background(), req)
		if err != nil {
			t.Fatalf("AddTask failed: %v", err)
		}
	}

	getReq := &connect.Request[todov1.GetTasksRequest]{
		Msg: &todov1.GetTasksRequest{},
	}

	resp, err := server.GetTasks(context.Background(), getReq)
	if err != nil {
		t.Fatalf("GetTasks failed: %v", err)
	}

	if len(resp.Msg.Tasks) != len(testTasks) {
		t.Errorf("Expected %d tasks, got %d", len(testTasks), len(resp.Msg.Tasks))
	}

	for i, task := range resp.Msg.Tasks {
		if task.Text != testTasks[i] {
			t.Errorf("Task %d: expected '%s', got '%s'", i, testTasks[i], task.Text)
		}
	}
}

func TestConcurrentAddTasks(t *testing.T) {
	server := &todoServer{}
	var wg sync.WaitGroup
	n := 100
	wg.Add(n)
	for i := 0; i < n; i++ {
		go func(i int) {
			defer wg.Done()
			_, err := server.AddTask(context.Background(), &connect.Request[todov1.AddTaskRequest]{
				Msg: &todov1.AddTaskRequest{Text: "T"},
			})
			if err != nil {
				t.Errorf("AddTask goroutine failed: %v", err)
			}
		}(i)
	}
	wg.Wait()

	resp, err := server.GetTasks(context.Background(), &connect.Request[todov1.GetTasksRequest]{
		Msg: &todov1.GetTasksRequest{},
	})
	if err != nil {
		t.Fatalf("GetTasks failed: %v", err)
	}
	if len(resp.Msg.Tasks) != n {
		t.Fatalf("expected %d tasks, got %d", n, len(resp.Msg.Tasks))
	}
	seen := make(map[string]struct{}, n)
	for _, tk := range resp.Msg.Tasks {
		if _, ok := seen[tk.Id]; ok {
			t.Fatalf("duplicate id detected: %s", tk.Id)
		}
		seen[tk.Id] = struct{}{}
	}
}

func TestGetTasks(t *testing.T) {
	server := &todoServer{}

	testTasks := []string{"Task 1", "Task 2", "Task 3"}
	for _, text := range testTasks {
		req := &connect.Request[todov1.AddTaskRequest]{
			Msg: &todov1.AddTaskRequest{Text: text},
		}
		_, err := server.AddTask(context.Background(), req)
		if err != nil {
			t.Fatalf("AddTask failed: %v", err)
		}
	}

	getReq := &connect.Request[todov1.GetTasksRequest]{
		Msg: &todov1.GetTasksRequest{},
	}

	resp, err := server.GetTasks(context.Background(), getReq)
	if err != nil {
		t.Fatalf("GetTasks failed: %v", err)
	}

	if len(resp.Msg.Tasks) != len(testTasks) {
		t.Errorf("Expected %d tasks, got %d", len(testTasks), len(resp.Msg.Tasks))
	}

	for i, task := range resp.Msg.Tasks {
		if task.Text != testTasks[i] {
			t.Errorf("Task %d: expected '%s', got '%s'", i, testTasks[i], task.Text)
		}
	}
}

func TestDeleteTask(t *testing.T) {
	server := &todoServer{}

	addReq := &connect.Request[todov1.AddTaskRequest]{
		Msg: &todov1.AddTaskRequest{Text: "Task to delete"},
	}

	addResp, err := server.AddTask(context.Background(), addReq)
	if err != nil {
		t.Fatalf("AddTask failed: %v", err)
	}

	taskID := addResp.Msg.Task.Id

	getReq := &connect.Request[todov1.GetTasksRequest]{
		Msg: &todov1.GetTasksRequest{},
	}

	getResp, err := server.GetTasks(context.Background(), getReq)
	if err != nil {
		t.Fatalf("GetTasks failed: %v", err)
	}

	if len(getResp.Msg.Tasks) != 1 {
		t.Errorf("Expected 1 task before deletion, got %d", len(getResp.Msg.Tasks))
	}

	deleteReq := &connect.Request[todov1.DeleteTaskRequest]{
		Msg: &todov1.DeleteTaskRequest{Id: taskID},
	}

	deleteResp, err := server.DeleteTask(context.Background(), deleteReq)
	if err != nil {
		t.Fatalf("DeleteTask failed: %v", err)
	}

	if !deleteResp.Msg.Success {
		t.Error("Delete should have succeeded")
	}

	getResp2, err := server.GetTasks(context.Background(), getReq)
	if err != nil {
		t.Fatalf("GetTasks failed: %v", err)
	}

	if len(getResp2.Msg.Tasks) != 0 {
		t.Errorf("Expected 0 tasks after deletion, got %d", len(getResp2.Msg.Tasks))
	}
}

func TestDeleteNonExistentTask(t *testing.T) {
	server := &todoServer{}

	deleteReq := &connect.Request[todov1.DeleteTaskRequest]{
		Msg: &todov1.DeleteTaskRequest{Id: "non-existent-id"},
	}

	deleteResp, err := server.DeleteTask(context.Background(), deleteReq)
	if err != nil {
		t.Fatalf("DeleteTask failed: %v", err)
	}

	if deleteResp.Msg.Success {
		t.Error("Delete should have failed for non-existent task")
	}
}

func TestUpdateTaskCompletedFavorite(t *testing.T) {
	server := &todoServer{}

	addResp, err := server.AddTask(context.Background(), &connect.Request[todov1.AddTaskRequest]{
		Msg: &todov1.AddTaskRequest{Text: "To update"},
	})
	if err != nil {
		t.Fatalf("AddTask failed: %v", err)
	}
	id := addResp.Msg.Task.Id

	completed := true
	favorite := true
	upd := &connect.Request[todov1.UpdateTaskRequest]{
		Msg: &todov1.UpdateTaskRequest{Id: id, Completed: &completed, Favorite: &favorite},
	}

	resp, err := server.UpdateTask(context.Background(), upd)
	if err != nil {
		t.Fatalf("UpdateTask failed: %v", err)
	}
	if !resp.Msg.Success {
		t.Fatalf("expected success true")
	}
	if !resp.Msg.Task.Completed || !resp.Msg.Task.Favorite {
		t.Errorf("expected completed and favorite true, got completed=%v favorite=%v", resp.Msg.Task.Completed, resp.Msg.Task.Favorite)
	}
}

func TestUpdateTaskDueAtAndClear(t *testing.T) {
	server := &todoServer{}

	addResp, err := server.AddTask(context.Background(), &connect.Request[todov1.AddTaskRequest]{
		Msg: &todov1.AddTaskRequest{Text: "With due"},
	})
	if err != nil {
		t.Fatalf("AddTask failed: %v", err)
	}
	id := addResp.Msg.Task.Id

	due := "2025-12-31T23:59:00Z"
	setReq := &connect.Request[todov1.UpdateTaskRequest]{
		Msg: &todov1.UpdateTaskRequest{Id: id, DueAt: &due},
	}
	setResp, err := server.UpdateTask(context.Background(), setReq)
	if err != nil {
		t.Fatalf("UpdateTask set due failed: %v", err)
	}
	if !setResp.Msg.Success || setResp.Msg.Task.DueAt != due {
		t.Fatalf("expected due set to %s", due)
	}

	empty := ""
	clearReq := &connect.Request[todov1.UpdateTaskRequest]{
		Msg: &todov1.UpdateTaskRequest{Id: id, DueAt: &empty},
	}
	clearResp, err := server.UpdateTask(context.Background(), clearReq)
	if err != nil {
		t.Fatalf("UpdateTask clear due failed: %v", err)
	}
	if !clearResp.Msg.Success || clearResp.Msg.Task.DueAt != "" {
		t.Fatalf("expected due cleared to empty, got %q", clearResp.Msg.Task.DueAt)
	}
}

func TestUpdateTaskInvalidID(t *testing.T) {
	server := &todoServer{}
	completed := true
	resp, err := server.UpdateTask(context.Background(), &connect.Request[todov1.UpdateTaskRequest]{
		Msg: &todov1.UpdateTaskRequest{Id: "not-exist", Completed: &completed},
	})
	if err != nil {
		t.Fatalf("UpdateTask failed: %v", err)
	}
	if resp.Msg.Success {
		t.Fatalf("expected success false for invalid id")
	}
}

func TestDeleteTaskTwice(t *testing.T) {
	server := &todoServer{}
	add, err := server.AddTask(context.Background(), &connect.Request[todov1.AddTaskRequest]{
		Msg: &todov1.AddTaskRequest{Text: "del"},
	})
	if err != nil {
		t.Fatalf("AddTask failed: %v", err)
	}
	id := add.Msg.Task.Id

	first, err := server.DeleteTask(context.Background(), &connect.Request[todov1.DeleteTaskRequest]{
		Msg: &todov1.DeleteTaskRequest{Id: id},
	})
	if err != nil {
		t.Fatalf("DeleteTask failed: %v", err)
	}
	if !first.Msg.Success {
		t.Fatalf("first delete should succeed")
	}

	second, err := server.DeleteTask(context.Background(), &connect.Request[todov1.DeleteTaskRequest]{
		Msg: &todov1.DeleteTaskRequest{Id: id},
	})
	if err != nil {
		t.Fatalf("DeleteTask second failed: %v", err)
	}
	if second.Msg.Success {
		t.Fatalf("second delete should fail")
	}
}

func TestUpdateTaskNoFields(t *testing.T) {
	server := &todoServer{}
	add, err := server.AddTask(context.Background(), &connect.Request[todov1.AddTaskRequest]{
		Msg: &todov1.AddTaskRequest{Text: "noop"},
	})
	if err != nil {
		t.Fatalf("AddTask failed: %v", err)
	}
	id := add.Msg.Task.Id

	upd, err := server.UpdateTask(context.Background(), &connect.Request[todov1.UpdateTaskRequest]{
		Msg: &todov1.UpdateTaskRequest{Id: id},
	})
	if err != nil {
		t.Fatalf("UpdateTask failed: %v", err)
	}
	if !upd.Msg.Success || upd.Msg.Task == nil {
		t.Fatalf("expected success with task returned")
	}
	if upd.Msg.Task.Completed || upd.Msg.Task.Favorite || upd.Msg.Task.DueAt != "" {
		t.Fatalf("unexpected changes: completed=%v favorite=%v due=%q", upd.Msg.Task.Completed, upd.Msg.Task.Favorite, upd.Msg.Task.DueAt)
	}
}

func TestMainStartupHelpers(t *testing.T) {
	os.Unsetenv("BACKEND_PORT")
	os.Unsetenv("PORT")
	if p := getPort(); p != "8080" {
		t.Fatalf("expected default 8080, got %s", p)
	}
	os.Setenv("PORT", "7777")
	if p := getPort(); p != "7777" {
		t.Fatalf("expected 7777 from PORT, got %s", p)
	}
	os.Setenv("BACKEND_PORT", "6666")
	if p := getPort(); p != "6666" {
		t.Fatalf("expected 6666 from BACKEND_PORT, got %s", p)
	}
}

func TestHTTPServerRoutes(t *testing.T) {
	srv := newHTTPServer(":0")
	ts := httptest.NewServer(srv.Handler)
	defer ts.Close()

	client := todov1connect.NewTodoServiceClient(ts.Client(), ts.URL)
	resp, err := client.AddTask(context.Background(), connect.NewRequest(&todov1.AddTaskRequest{Text: "x"}))
	if err != nil {
		t.Fatalf("AddTask via http failed: %v", err)
	}
	if resp.Msg.Task.Text != "x" {
		t.Fatalf("unexpected task text: %s", resp.Msg.Task.Text)
	}
}