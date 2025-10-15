# PromptHire

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**PromptHire** is an MCP (Model Context Protocol) server that transforms ChatGPT conversations into structured freelance gig postings. Simply discuss project requirements in ChatGPT, and PromptHire automatically extracts details like title, description, budget, timeline, skills, and success criteria into a professional gig listing.

🔗 **Live Demo:** [https://prompthire-mcp-node-production.up.railway.app/](https://prompthire-mcp-node-production.up.railway.app/)

## Features

- 🤖 **AI-Powered Extraction** - Automatically extracts comprehensive project details from conversation history
- 📋 **10 Category System** - Categorizes gigs: Design, Development, Legal, Security, Marketing, Strategy, Education, Copywriting, and more
- ✅ **Success Criteria Tracking** - Captures specific, measurable acceptance criteria for projects
- 🎨 **Interactive Widget** - Beautiful, editable gig card with fullscreen support
- 💾 **Persistent Storage** - Saves gigs to JSON database with session tracking
- 🔗 **ChatGPT Integration** - Links back to the original conversation that created each gig
- 🌐 **Landing Page** - Browse all posted gigs with category filtering

## Architecture

PromptHire uses the Apps SDK to render rich UI components (widgets) alongside ChatGPT messages. It consists of:

1. **MCP Server** (`promptHire_server_node/`) - Node.js server exposing the `create-new-gig` tool
2. **Widget** (`src/prompthire-gig/`) - React component for creating and editing gig postings
3. **Landing Page** - Public-facing page displaying all saved gigs

## Repository Structure

- `promptHire_server_node/` – MCP server with tool definitions and database
- `src/prompthire-gig/` – React widget source code
- `assets/` – Generated widget bundles (gitignored, built locally)
- `promptHire.md` – Detailed project documentation

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm/yarn

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build the Widget

```bash
pnpm run build
```

This generates the widget bundle that the MCP server serves.

### 3. Start the Server

```bash
cd promptHire_server_node
pnpm start
```

The server will start on port 8000 (or `PORT` env variable):
- MCP endpoint: `http://localhost:8000/mcp`
- Landing page: `http://localhost:8000/`
- API: `http://localhost:8000/api/gigs`

## Testing in ChatGPT

To add PromptHire to ChatGPT:

1. Enable [developer mode](https://platform.openai.com/docs/guides/developer-mode)
2. Go to Settings > Connectors
3. Add your server URL

### Local Testing with ngrok

Expose your local server to the internet:

```bash
ngrok http 8000
```

Then add the ngrok URL to ChatGPT:
```
https://<your-subdomain>.ngrok-free.app/mcp
```

## Usage

In ChatGPT, discuss your project needs naturally:

```
User: I need someone to build a React dashboard for analytics.
      Budget is $2000, needs to be done in 2 weeks.
      Must include: user auth, data visualization, export to PDF.
      React, TypeScript, and D3.js experience required.

ChatGPT: [Understands requirements and calls create-new-gig tool]
```

PromptHire will:
1. Extract all details from the conversation
2. Display an interactive widget with the gig details
3. Allow you to edit fields, add skills, or refine criteria
4. Save the gig when you click "Save Gig" with your email

## Deployment

PromptHire is deployed on Railway. The monorepo structure uses:

```toml
# railway.toml
[deploy]
startCommand = "cd promptHire_server_node && pnpm start"
watchPaths = ["promptHire_server_node/**", "assets/**"]
```

Push to GitHub `main` branch to trigger automatic deployment.

## Database

Gigs are stored in `promptHire_server_node/data/saved-gigs.json` with the following schema:

```typescript
{
  id: string;                // Unique gig ID
  gig_title: string;         // Project title
  gig_description: string;   // Comprehensive description
  timeline: string;          // Project timeline
  budget: string;            // Budget or price range
  skills_required: string[]; // Required skills/tech
  category: string;          // One of 10 categories
  success_criteria: string[]; // Acceptance criteria
  email?: string;            // Contact email
  chat_link?: string;        // ChatGPT conversation link
  created_at: string;        // ISO timestamp
  session_id: string;        // MCP session ID
}
```

## Widget Features

- **Fullscreen Mode** - Expand widget for better editing experience
- **Post-Submission UI** - Success screen with "See gig" button
- **Real-time Editing** - Edit title, description, timeline, budget inline
- **Dynamic Skills & Criteria** - Add/remove skills and success criteria with one click
- **Category Icons** - Visual category indicators with color coding
- **Responsive Design** - Works on desktop and mobile

## Environment Variables

- `PORT` - Server port (default: 8000)
- `ADMIN_PASSWORD` - Optional admin password for protected endpoints

## Development

Run the dev server for hot module reloading:

```bash
pnpm run dev
```

Build widgets only:

```bash
pnpm run build
```

## Contributing

Issues and pull requests are welcome! Please note that response times may vary.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

---

Built with the [OpenAI Apps SDK](https://platform.openai.com/docs/guides/apps-sdk) and [Model Context Protocol](https://modelcontextprotocol.io/).
