import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { z } from "zod";

const app = express();

app.use(express.json());



const GOOGLE_SHEET_API = "https://script.google.com/macros/s/AKfycbxoJzHgWIbMJrh27UKNzUaQX_xoQgV-JU7CMRf4xVcSK-aRSDBYZ4TOLy7CMX_d25tGUA/exec";

// =========================
// TODO FILE FUNCTIONS
// =========================

async function getTodos() {
    const response = await fetch(
        `${GOOGLE_SHEET_API}?action=get`
    );

    if (!response.ok) {
        throw new Error("Google Sheet get request failed");
    }

    const data = await response.json();

    return data.todos || [];
}

async function addTodo(title) {
    const response = await fetch(GOOGLE_SHEET_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            action: "add",
            title: title
        })
    });

    const data = await response.json();

    console.log("GOOGLE ADD RESPONSE:", data);

    if (!response.ok || !data.success) {
        throw new Error(
            data.message || "Google Sheet add request failed"
        );
    }

    return data;
}

async function completeTodo(id) {
    const response = await fetch(GOOGLE_SHEET_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            action: "complete",
            id
        })
    });

    return await response.json();
}

async function deleteTodo(id) {
    const response = await fetch(GOOGLE_SHEET_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            action: "delete",
            id
        })
    });

    return await response.json();
}

async function updateTodo(id, title) {
    const response = await fetch(GOOGLE_SHEET_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            action: "update",
            id,
            title
        })
    });

    return await response.json();
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
            const todos = await getTodos();

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(todos, null, 2)
                    }
                ]
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
            title: z.string()
        },
        async ({ title }) => {

            const result = await addTodo(title);

            return {
                content: [
                    {
                        type: "text",
                        text: result.message
                    }
                ]
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
            id: z.number()
        },
        async ({ id }) => {

            const result = await completeTodo(id);

            return {
                content: [
                    {
                        type: "text",
                        text: result.message
                    }
                ]
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
            id: z.number()
        },
        async ({ id }) => {

            const result = await deleteTodo(id);

            return {
                content: [
                    {
                        type: "text",
                        text: result.message
                    }
                ]
            };
        }
    );


    // =========================
    // UPDATE TODO
    // =========================

    server.tool(
        "update_todo",
        "Update the title of a todo",
        {
            id: z.number(),
            title: z.string()
        },
        async ({ id, title }) => {

            const result = await updateTodo(id, title);

            return {
                content: [
                    {
                        type: "text",
                        text: result.message
                    }
                ]
            };
        }
    );

    return server;
}


// =========================
// MCP ENDPOINT
// =========================

app.all(["/", "/api/mcp"], async (req, res) => {
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

app.get(["/health", "/api/mcp/health"], (req, res) => {
    res.json({
        status: "ok",
        server: "todo-http-server",
    });
});


// =========================
// VERCEL EXPORT
// =========================

export default app;

if (process.env.VERCEL !== "1") {
    app.listen(3000, () => {
        console.log("MCP HTTP server listening on http://localhost:3000");
    });
}