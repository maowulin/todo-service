package main

import (
	"context"
	"testing"

	"connectrpc.com/connect"
	todov1 "todo-service/gen"
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