import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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

// Load the inlined HTML bundle (no external hosting needed!)
// Widget includes fullscreen support and post-submission success UI
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const htmlPath = join(__dirname, "../../assets/prompthire-gig-2d2b.html");
const inlinedHtml = readFileSync(htmlPath, "utf-8");

// Extract the <style> tag from <head> and the body content
const styleMatch = inlinedHtml.match(/<style>([\s\S]*?)<\/style>/);
const bodyMatch = inlinedHtml.match(/<body>([\s\S]*)<\/body>/);

const styles = styleMatch ? styleMatch[0] : ""; // Keep full <style>...</style>
const body = bodyMatch ? bodyMatch[1].trim() : "";

// Combine styles + body for the complete widget HTML
const bodyContent = styles + "\n" + body;

const widget: PromptHireWidget = {
  id: "create-new-gig",
  title: "Create Freelance Gig",
  templateUri: "ui://widget/prompthire-gig.html",
  invoking: "Creating your gig posting...",
  invoked: "Gig created successfully",
  html: bodyContent, // Self-contained HTML with inlined CSS/JS
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
      description: "COMPREHENSIVE description extracted from the ENTIRE conversation including: project scope, all technical requirements, specific deliverables, success criteria, quality standards, constraints, dependencies, and any other details critical for project success. Include context from all messages in the conversation."
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
    },
    category: {
      type: "string",
      enum: ["design", "development", "legal", "security", "office-admin", "marketing", "strategy", "education", "copywriting", "other"],
      description: "Categorize the gig based on its primary focus: 'design' for UI/UX/graphic/visual design, 'development' for software/web/mobile/technical development, 'legal' for contracts/compliance/legal work, 'security' for cybersecurity/audits/penetration testing, 'office-admin' for administrative/data entry/scheduling tasks, 'marketing' for campaigns/SEO/advertising/growth, 'strategy' for business consulting/planning/advisory, 'education' for training/tutoring/course creation, 'copywriting' for content/technical/creative writing, 'other' for miscellaneous work not fitting other categories."
    },
    success_criteria: {
      type: "array",
      items: { type: "string" },
      description: "List of specific, measurable success criteria or acceptance criteria mentioned in the conversation (e.g., 'All tests must pass', 'Design must be mobile-responsive', 'Report must include executive summary', 'Code review required before delivery'). Extract any explicit or implied quality standards and deliverable requirements."
    },
    email: {
      type: "string",
      description: "Optional email address for contact about this gig."
    },
    chat_link: {
      type: "string",
      description: "Optional ChatGPT share link for the conversation that created this gig (e.g., https://chatgpt.com/share/...)."
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
  skills_required: z.array(z.string()).optional(),
  category: z.enum(["design", "development", "legal", "security", "office-admin", "marketing", "strategy", "education", "copywriting", "other"]).optional(),
  success_criteria: z.array(z.string()).optional(),
  email: z.string().optional(),
  chat_link: z.string().optional()
});

// Database types and functions
type SavedGig = {
  id: string;
  gig_title: string;
  gig_description: string;
  timeline: string;
  budget: string;
  skills_required: string[];
  category: string;
  success_criteria: string[];
  email?: string;
  chat_link?: string;
  created_at: string;
  session_id: string;
};

const DB_PATH = join(__dirname, "../data/saved-gigs.json");

function ensureDataDir() {
  const dataDir = dirname(DB_PATH);
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  if (!existsSync(DB_PATH)) {
    writeFileSync(DB_PATH, "[]", "utf-8");
  }
}

function loadGigs(): SavedGig[] {
  try {
    ensureDataDir();
    const data = readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading gigs:", error);
    return [];
  }
}

function saveGig(gig: SavedGig): string {
  try {
    ensureDataDir();
    const gigs = loadGigs();
    gigs.push(gig);
    writeFileSync(DB_PATH, JSON.stringify(gigs, null, 2), "utf-8");
    return gig.id;
  } catch (error) {
    console.error("Error saving gig:", error);
    throw new Error("Failed to save gig to database");
  }
}

function generateGigId(): string {
  return `gig_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const tools: Tool[] = [
  {
    name: widget.id,
    description: "Creates a freelance gig posting from the conversation. Use when user wants to turn discussed work into a formal gig listing. Trigger phrases: 'create a gig', 'create gig for', 'make this a freelance posting', etc.",
    inputSchema: toolInputSchema,
    title: widget.title,
    _meta: widgetMeta(widget)
  },
  {
    name: "save-gig",
    description: "Saves a gig posting to the database. Called from the widget when user clicks 'Save Gig' button.",
    inputSchema: toolInputSchema,
    title: "Save Gig to Database"
  }
];

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

function createPromptHireServer(sessionId: string): Server {
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
    const args = toolInputParser.parse(request.params.arguments ?? {});

    // Handle save-gig tool (called from widget button)
    if (request.params.name === "save-gig") {
      const gigId = generateGigId();
      const savedGig: SavedGig = {
        id: gigId,
        gig_title: args.gig_title,
        gig_description: args.gig_description,
        timeline: args.timeline || "To be discussed",
        budget: args.budget || "TBD",
        skills_required: args.skills_required || [],
        category: args.category || "other",
        success_criteria: args.success_criteria || [],
        email: args.email,
        chat_link: args.chat_link,
        created_at: new Date().toISOString(),
        session_id: sessionId
      };

      try {
        saveGig(savedGig);
        console.log(`✅ Gig saved: ${gigId} (session: ${sessionId})`);

        return {
          content: [
            {
              type: "text",
              text: `Gig "${args.gig_title}" saved successfully! ID: ${gigId}`
            }
          ],
          structuredContent: {
            success: true,
            gigId,
            saved: true,
            timestamp: savedGig.created_at
          }
        };
      } catch (error) {
        console.error("❌ Failed to save gig:", error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to save gig: ${error instanceof Error ? error.message : "Unknown error"}`
            }
          ],
          structuredContent: {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          }
        };
      }
    }

    // Handle create-new-gig tool (original widget creation)
    if (request.params.name === widget.id) {
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
          skills_required: args.skills_required || [],
          category: args.category || "other",
          success_criteria: args.success_criteria || [],
          email: args.email,
          chat_link: args.chat_link
        },
        _meta: widgetMeta(widget)
      };
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
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
  const transport = new SSEServerTransport(postPath, res);
  const sessionId = transport.sessionId;
  const server = createPromptHireServer(sessionId);

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

  // API endpoint to get gigs
  if (req.method === "GET" && url.pathname === "/api/gigs") {
    const category = url.searchParams.get("category");
    let gigs = loadGigs();

    // Filter by category if provided
    if (category && category !== "all") {
      gigs = gigs.filter(gig => gig.category === category);
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(gigs));
    return;
  }

  // Serve the HTML page
  if (req.method === "GET" && url.pathname === "/") {
    const htmlFilePath = join(__dirname, "../public/index.html");
    try {
      const html = readFileSync(htmlFilePath, "utf-8");
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
    } catch (error) {
      res.writeHead(404).end("Page not found");
    }
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
  console.log(`  Database: ${DB_PATH}`);
});
