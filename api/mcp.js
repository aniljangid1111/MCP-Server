import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, writeFile } from "node:fs/promises";

const app = express();

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const todosFile = path.join(__dirname, "..", "todos.json");


// =========================
// TODO FILE FUNCTIONS
// =========================

async function getTodosFromFile() {
    try {
        const data = await readFile(todosFile, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        console.error("READ TODO ERROR:", error);
        return [];
    }
}

async function saveTodosToFile(todos) {
    await writeFile(
        todosFile,
        JSON.stringify(todos, null, 2),
        "utf-8"
    );
}


// =========================
// MCP SERVER
// =========================

function createServer() {
    const server = new McpServer({
        name: "todo-http-server",
        version: "1.0.0",
    });


    // =========================
    // PING
    // =========================

    server.tool(
        "ping",
        "Test the MCP HTTP server",
        {},
        async () => {
            return {
                content: [
                    {
                        type: "text",
                        text: "MCP HTTP server is working!",
                    },
                ],
            };
        }
    );


    // =========================
    // GET TODOS
    // =========================

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


    // =========================
    // ADD TODO
    // =========================

    server.tool(
        "add_todo",
        "Add a new todo",
        {
            title: z.string(),
        },
        async ({ title }) => {
            const todos = await getTodosFromFile();

            const todo = {
                id: todos.length
                    ? Math.max(...todos.map(todo => todo.id)) + 1
                    : 1,
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


    // =========================
    // COMPLETE TODO
    // =========================

    server.tool(
        "complete_todo",
        "Mark a todo as completed",
        {
            id: z.number(),
        },
        async ({ id }) => {
            const todos = await getTodosFromFile();

            const todo = todos.find(todo => todo.id === id);

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


    // =========================
    // DELETE TODO
    // =========================

    server.tool(
        "delete_todo",
        "Delete a todo",
        {
            id: z.number(),
        },
        async ({ id }) => {
            const todos = await getTodosFromFile();

            const todoIndex = todos.findIndex(
                todo => todo.id === id
            );

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


    // =========================
    // UPDATE TODO
    // =========================

    server.tool(
        "update_todo",
        "Update the title of an existing todo",
        {
            id: z.number(),
            title: z.string(),
        },
        async ({ id, title }) => {
            const todos = await getTodosFromFile();

            const todo = todos.find(todo => todo.id === id);

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


    return server;
}


// =========================
// MCP ENDPOINT
// =========================

app.all("/", async (req, res) => {
    const server = createServer();

    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
    });

    try {
        await server.connect(transport);

        await transport.handleRequest(
            req,
            res,
            req.body
        );
    } catch (error) {
        console.error("MCP ERROR:", error);

        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: "2.0",
                error: {
                    code: -32603,
                    message: "Internal server error",
                },
                id: null,
            });
        }
    }
});


// =========================
// HEALTH CHECK
// =========================

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        server: "todo-http-server",
    });
});


// =========================
// VERCEL EXPORT
// =========================

export default app;