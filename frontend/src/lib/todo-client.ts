import { createPromiseClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { TodoService } from "../../../backend/gen/todo/v1/todov1connect";

const transport = createConnectTransport({
  baseUrl: "http://localhost:8080",
  useBinaryFormat: true, // 使用二进制格式
});

export const todoClient = createPromiseClient(TodoService, transport);