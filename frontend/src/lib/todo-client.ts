import { createPromiseClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { TodoService } from "@/gen/todo_connect";
import {
  AddTaskRequest,
  AddTaskResponse,
  GetTasksRequest,
  GetTasksResponse,
  DeleteTaskRequest,
  DeleteTaskResponse,
  UpdateTaskRequest,
  UpdateTaskResponse,
} from "@/gen/todo_pb";

const transport = createConnectTransport({
  baseUrl: "/api",
  useBinaryFormat: true,
});

const client = createPromiseClient(TodoService, transport);

export const todoClient = {
  addTask: async (request: AddTaskRequest): Promise<AddTaskResponse> => {
    return client.addTask(request);
  },
  getTasks: async (request: GetTasksRequest): Promise<GetTasksResponse> => {
    return client.getTasks(request);
  },
  deleteTask: async (
    request: DeleteTaskRequest
  ): Promise<DeleteTaskResponse> => {
    return client.deleteTask(request);
  },
  updateTask: async (
    request: UpdateTaskRequest
  ): Promise<UpdateTaskResponse> => {
    return client.updateTask(request);
  },
};
