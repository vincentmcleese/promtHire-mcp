import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type CallToolRequest,
  type ListResourceTemplatesRequest,
  type ListResourcesRequest,
  type ListToolsRequest,
  type ReadResourceRequest,
  type Resource,
  type ResourceTemplate,
  type Tool
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

type PromptHireWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  responseText: string;
};

function widgetMeta(widget: PromptHireWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true
  } as const;
}

const widget: PromptHireWidget = {
  id: "create-new-gig",
  title: "Create Freelance Gig",
  templateUri: "ui://widget/prompthire-gig.html",
  invoking: "Creating your gig posting...",
  invoked: "Gig created successfully",
  html: `
<div id="prompthire-gig-root"></div>
<link rel="stylesheet" href="https://persistent.oaistatic.com/ecosystem-built-assets/prompthire-gig-2d2b.css">
<script type="module" src="https://persistent.oaistatic.com/ecosystem-built-assets/prompthire-gig-2d2b.js"></script>
  `.trim(),
  responseText: "Created your freelance gig posting!"
};

const toolInputSchema = {
  type: "object",
  properties: {
    gig_title: {
      type: "string",
      description: "The title of the freelance gig, extracted from the ENTIRE conversation. Should be clear and specific about the work needed."
    },
    gig_description: {
      type: "string",
      description: "COMPLETE description of the freelance work discussed in the ENTIRE conversation. Include all requirements, deliverables, technical details, and context mentioned throughout the conversation."
    },
    timeline: {
      type: "string",
      description: "Project timeline or deadline mentioned anywhere in the conversation (e.g., '2 weeks', '1-2 months', '3 days'). If not specified, use 'To be discussed'."
    },
    budget: {
      type: "string",
      description: "Budget or price range discussed in the conversation (e.g., '$1000', '$500-$1000', 'TBD'). If not specified, use 'TBD'."
    },
    skills_required: {
      type: "array",
      items: { type: "string" },
      description: "List of skills or technologies needed for this gig based on the ENTIRE conversation (e.g., ['React', 'Node.js', 'API Design']). Extract all technical requirements mentioned."
    }
  },
  required: ["gig_title", "gig_description"],
  additionalProperties: false
} as const;

const toolInputParser = z.object({
  gig_title: z.string(),
  gig_description: z.string(),
  timeline: z.string().optional(),
  budget: z.string().optional(),
  skills_required: z.array(z.string()).optional()
});

const tools: Tool[] = [{
  name: widget.id,
  description: "Creates a freelance gig posting from the conversation. Use when user wants to turn discussed work into a formal gig listing. Trigger phrases: 'create a gig', 'create gig for', 'make this a freelance posting', etc.",
  inputSchema: toolInputSchema,
  title: widget.title,
  _meta: widgetMeta(widget)
}];

const resources: Resource[] = [{
  uri: widget.templateUri,
  name: widget.title,
  description: `${widget.title} widget markup`,
  mimeType: "text/html+skybridge",
  _meta: widgetMeta(widget)
}];

const resourceTemplates: ResourceTemplate[] = [{
  uriTemplate: widget.templateUri,
  name: widget.title,
  description: `${widget.title} widget markup`,
  mimeType: "text/html+skybridge",
  _meta: widgetMeta(widget)
}];

function createPromptHireServer(): Server {
  const server = new Server(
    {
      name: "prompthire-mcp-node",
      version: "0.1.0"
    },
    {
      capabilities: {
        resources: {},
        tools: {}
      }
    }
  );

  server.setRequestHandler(ListResourcesRequestSchema, async (_request: ListResourcesRequest) => ({
    resources
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request: ReadResourceRequest) => {
    if (request.params.uri !== widget.templateUri) {
      throw new Error(`Unknown resource: ${request.params.uri}`);
    }

    return {
      contents: [
        {
          uri: widget.templateUri,
          mimeType: "text/html+skybridge",
          text: widget.html,
          _meta: widgetMeta(widget)
        }
      ]
    };
  });

  server.setRequestHandler(ListResourceTemplatesRequestSchema, async (_request: ListResourceTemplatesRequest) => ({
    resourceTemplates
  }));

  server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => ({
    tools
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    if (request.params.name !== widget.id) {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    const args = toolInputParser.parse(request.params.arguments ?? {});

    return {
      content: [
        {
          type: "text",
          text: widget.responseText
        }
      ],
      structuredContent: {
        gig_title: args.gig_title,
        gig_description: args.gig_description,
        timeline: args.timeline || "To be discussed",
        budget: args.budget || "TBD",
        skills_required: args.skills_required || []
      },
      _meta: widgetMeta(widget)
    };
  });

  return server;
}

type SessionRecord = {
  server: Server;
  transport: SSEServerTransport;
};

const sessions = new Map<string, SessionRecord>();

const ssePath = "/mcp";
const postPath = "/mcp/messages";

async function handleSseRequest(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const server = createPromptHireServer();
  const transport = new SSEServerTransport(postPath, res);
  const sessionId = transport.sessionId;

  sessions.set(sessionId, { server, transport });

  transport.onclose = async () => {
    sessions.delete(sessionId);
    await server.close();
  };

  transport.onerror = (error) => {
    console.error("SSE transport error", error);
  };

  try {
    await server.connect(transport);
  } catch (error) {
    sessions.delete(sessionId);
    console.error("Failed to start SSE session", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to establish SSE connection");
    }
  }
}

async function handlePostMessage(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    res.writeHead(400).end("Missing sessionId query parameter");
    return;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    res.writeHead(404).end("Unknown session");
    return;
  }

  try {
    await session.transport.handlePostMessage(req, res);
  } catch (error) {
    console.error("Failed to process message", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to process message");
    }
  }
}

const portEnv = Number(process.env.PORT ?? 8000);
const port = Number.isFinite(portEnv) ? portEnv : 8000;

const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "OPTIONS" && (url.pathname === ssePath || url.pathname === postPath)) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type"
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === ssePath) {
    await handleSseRequest(res);
    return;
  }

  if (req.method === "POST" && url.pathname === postPath) {
    await handlePostMessage(req, res, url);
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.on("clientError", (err: Error, socket) => {
  console.error("HTTP client error", err);
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

httpServer.listen(port, () => {
  console.log(`PromptHire MCP server listening on http://localhost:${port}`);
  console.log(`  SSE stream: GET http://localhost:${port}${ssePath}`);
  console.log(`  Message post endpoint: POST http://localhost:${port}${postPath}?sessionId=...`);
});
