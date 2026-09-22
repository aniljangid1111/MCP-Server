import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, writeFile } from "node:fs/promises";


const server = new McpServer({
  name: "todo-server",
  version: "1.0.0",
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const todosFile = path.join(__dirname, "todos.json");

// Read todos from JSON file
async function getTodosFromFile() {
  try {
    const data = await readFile(todosFile, "utf-8");

    console.error("READING TODO FILE:", todosFile);
    console.error("TODO DATA:", data);

    return JSON.parse(data);
  } catch (error) {
    console.error("TODO FILE ERROR:", error);
    return [];
  }
}

// Save todos to JSON file
async function saveTodosToFile(todos) {
  await writeFile(
    todosFile,
    JSON.stringify(todos, null, 2),
    "utf-8"
  );
}

// Add Todo
server.tool(
  "add_todo",
  "Add a new todo",
  {
    title: z.string(),
  },
  async ({ title }) => {
    const todos = await getTodosFromFile();

    const todo = {
      id: todos.length + 1,
      title,
      completed: false,
    };

    todos.push(todo);

    await saveTodosToFile(todos);

    return {
      content: [
        {
          type: "text",
          text: `Todo added successfully: ${title}`,
        },
      ],
    };
  }
);

// Get Todos
server.tool(
  "get_todos",
  "Get all todos",
  {},
  async () => {
    const todos = await getTodosFromFile();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(todos, null, 2),
        },
      ],
    };
  }
);

// Complete Todo
server.tool(
  "complete_todo",
  "Mark a todo as completed",
  {
    id: z.number(),
  },
  async ({ id }) => {
    const todos = await getTodosFromFile();

    const todo = todos.find((todo) => todo.id === id);

    if (!todo) {
      return {
        content: [
          {
            type: "text",
            text: `Todo with id ${id} not found`,
          },
        ],
      };
    }

    todo.completed = true;

    await saveTodosToFile(todos);

    return {
      content: [
        {
          type: "text",
          text: `Todo "${todo.title}" completed successfully`,
        },
      ],
    };
  }
);

// Delete Todo
server.tool(
  "delete_todo",
  "Delete a todo",
  {
    id: z.number(),
  },
  async ({ id }) => {
    const todos = await getTodosFromFile();

    const todoIndex = todos.findIndex((todo) => todo.id === id);

    if (todoIndex === -1) {
      return {
        content: [
          {
            type: "text",
            text: `Todo with id ${id} not found`,
          },
        ],
      };
    }

    const deletedTodo = todos[todoIndex];

    todos.splice(todoIndex, 1);

    await saveTodosToFile(todos);

    return {
      content: [
        {
          type: "text",
          text: `Todo "${deletedTodo.title}" deleted successfully`,
        },
      ],
    };
  }
);

// Update Todo
server.tool(
  "update_todo",
  "Update the title of an existing todo",
  {
    id: z.number(),
    title: z.string(),
  },
  async ({ id, title }) => {
    const todos = await getTodosFromFile();

    const todo = todos.find((todo) => todo.id === id);

    if (!todo) {
      return {
        content: [
          {
            type: "text",
            text: `Todo with id ${id} not found`,
          },
        ],
      };
    }

    todo.title = title;

    await saveTodosToFile(todos);

    return {
      content: [
        {
          type: "text",
          text: `Todo updated successfully: ${title}`,
        },
      ],
    };
  }
);

server.tool(
  "get_storage_path",
  "Show the location where the todo data is stored",
  {},
  async () => {
    return {
      content: [
        {
          type: "text",
          text: todosFile,
        },
      ],
    };
  }
);

// Todo Resource
server.resource(
  "todo-list",
  "todo://list",
  async (uri) => {
    const todos = await getTodosFromFile();

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(todos, null, 2),
        },
      ],
    };
  }
);

// Todo Review Prompt
server.prompt(
  "todo-review",
  "Review my todo list",
  () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "Review my todo list and tell me which tasks are completed and which tasks are still pending.",
        },
      },
    ],
  })
);

const transport = new StdioServerTransport();

await server.connect(transport);