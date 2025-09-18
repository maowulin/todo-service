package main

import (
	"context"
	"testing"

	"connectrpc.com/connect"
	todov1 "todo-service/gen/todo/v1"
)

func TestAddTask(t *testing.T) {
	server := &todoServer{}

	// Test adding a task
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

	// Add some tasks first
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

	// Get all tasks
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

	// Verify task contents
	for i, task := range resp.Msg.Tasks {
		if task.Text != testTasks[i] {
			t.Errorf("Task %d: expected '%s', got '%s'", i, testTasks[i], task.Text)
		}
	}
}

func TestDeleteTask(t *testing.T) {
	server := &todoServer{}

	// Add a task
	addReq := &connect.Request[todov1.AddTaskRequest]{
		Msg: &todov1.AddTaskRequest{Text: "Task to delete"},
	}

	addResp, err := server.AddTask(context.Background(), addReq)
	if err != nil {
		t.Fatalf("AddTask failed: %v", err)
	}

	taskID := addResp.Msg.Task.Id

	// Verify task exists
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

	// Delete the task
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

	// Verify task is gone
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

	// Try to delete a task that doesn't exist
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