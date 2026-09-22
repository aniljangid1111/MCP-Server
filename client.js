// import { Client } from "@modelcontextprotocol/sdk/client/index.js";
// import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
// import readline from "node:readline/promises";
// import { stdin as input, stdout as output } from "node:process";

// const transport = new StdioClientTransport({
//   command: "node",
//   args: ["index.js"],
// });

// const client = new Client({
//   name: "todo-client",
//   version: "1.0.0",
// });

// await client.connect(transport);

// console.log("Connected to MCP server!");

// const tools = await client.listTools();

// console.log("\nAvailable tools:");

// for (const tool of tools.tools) {
//   console.log(`- ${tool.name}: ${tool.description}`);
// }

// const rl = readline.createInterface({
//   input,
//   output,
// });

// const title = await rl.question("\nEnter your todo: ");

// // const result = await client.callTool({
// //   name: "add_todo",
// //   arguments: {
// //     title,
// //   },
// // });


// // console.log("\nServer response:");
// // console.log(result.content[0].text);

// const todos = await client.callTool({
//   name: "get_todos",
//   arguments: {},
// });

// const updated = await client.callTool({
//   name: "update_todo",
//   arguments: {
//     id: 1,
//     title: "Learn MCP Server",
//   },
// });

// console.log("\nUpdate Todo:");
// console.log(updated.content[0].text);

// // const deleted = await client.callTool({
// //   name: "delete_todo",
// //   arguments: {
// //     id: 2,
// //   },
// // });

// // console.log("\nDelete Todo:");
// // console.log(deleted.content[0].text);

// // const completed = await client.callTool({
// //   name: "complete_todo",
// //   arguments: {
// //     id: 1,
// //   },
// // });

// // console.log("\nComplete Todo:");
// // console.log(completed.content[0].text);

// console.log("\nAll Todos:");
// console.log(todos.content[0].text);

// rl.close();


import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["index.js"],
});

const client = new Client({
  name: "todo-client",
  version: "1.0.0",
});

await client.connect(transport);

console.log("Connected to MCP server!");

const tools = await client.listTools();

console.log("\nAvailable tools:");

for (const tool of tools.tools) {
  console.log(`- ${tool.name}: ${tool.description}`);
}