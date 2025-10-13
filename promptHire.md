# PromptHire MCP Server - Complete Implementation Plan

## Overview
Create a minimal MCP server that converts conversation into a freelance gig card widget, following **only existing patterns** from the codebase.

## Architecture Decision: Dynamic Data Pattern
**Following:** `solar-system` pattern (uses `useWidgetProps()` for MCP data)
**Not following:** `pizzaz-list` pattern (uses static JSON)

## File Structure

```
promptHire_server_node/
├── package.json          ← Copy from pizzaz_server_node
├── tsconfig.json         ← Copy from pizzaz_server_node
├── README.md             ← Simple description
└── src/
    └── server.ts         ← Main MCP server (pattern: pizzaz_server_node/src/server.ts)

src/
└── prompthire-gig/
    ├── index.jsx         ← Widget entry (pattern: solar-system/index.jsx)
    └── GigCard.jsx       ← Card component (pattern: pizzaz-carousel/PlaceCard.jsx)

build-all.mts             ← Add "prompthire-gig" to targets array (line 17-25)
```

## Implementation Steps

### Step 1: Create MCP Server Directory & Files
```bash
mkdir promptHire_server_node
cd promptHire_server_node
mkdir src
```

**Files to create:**
1. `package.json` - Copy from pizzaz_server_node, change name to "prompthire-mcp-node"
2. `tsconfig.json` - Copy from pizzaz_server_node exactly
3. `README.md` - Simple description
4. `src/server.ts` - Main server implementation

### Step 2: Implement Server (src/server.ts)

**Pattern Source:** `pizzaz_server_node/src/server.ts:1-343`

**Key Components:**

1. **Widget Definition** (lines 23-31 → our equivalent):
```typescript
type PromptHireWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  responseText: string;
};
```

2. **Single Widget** (lines 43-109 → our equivalent):
```typescript
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
```

3. **Tool Input Schema** (lines 119-129 → our equivalent):
```typescript
const toolInputSchema = {
  type: "object",
  properties: {
    gig_title: {
      type: "string",
      description: "The title of the freelance gig, extracted from the conversation. Should be clear and specific."
    },
    gig_description: {
      type: "string",
      description: "Complete description of the freelance work discussed in the conversation. Include all requirements, deliverables, and context mentioned."
    },
    timeline: {
      type: "string",
      description: "Project timeline or deadline mentioned in conversation (e.g., '2 weeks', '1-2 months')"
    },
    budget: {
      type: "string",
      description: "Budget or price range discussed (e.g., '$1000', '$500-$1000', 'TBD')"
    },
    skills_required: {
      type: "array",
      items: { type: "string" },
      description: "List of skills or technologies needed for this gig (e.g., ['React', 'Node.js', 'API Design'])"
    }
  },
  required: ["gig_title", "gig_description"]
} as const;
```

4. **Tool Registration** (lines 135-141 → our equivalent):
```typescript
const tools: Tool[] = [{
  name: widget.id,
  description: "Creates a freelance gig posting from the conversation. Use when user wants to turn discussed work into a formal gig listing.",
  inputSchema: toolInputSchema,
  title: widget.title,
  _meta: widgetMeta(widget)
}];
```

5. **CallTool Handler** (lines 204-225 → our equivalent):
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const args = toolInputParser.parse(request.params.arguments ?? {});

  return {
    content: [{
      type: "text",
      text: widget.responseText
    }],
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
```

6. **SSE/Session Management** (lines 230-343 → copy exactly)

### Step 3: Create Widget Component

**Create:** `src/prompthire-gig/index.jsx`

**Pattern Source:** `src/solar-system/solar-system.jsx:202-380` (dynamic data)

```jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { useWidgetProps } from "../use-widget-props";
import GigCard from "./GigCard";

function App() {
  const props = useWidgetProps({
    gig_title: "Sample Freelance Gig",
    gig_description: "This is a demo gig card",
    timeline: "2 weeks",
    budget: "$1000",
    skills_required: ["React", "Tailwind"]
  });

  return (
    <div className="antialiased w-full p-4">
      <GigCard {...props} />
    </div>
  );
}

createRoot(document.getElementById("prompthire-gig-root")).render(<App />);
```

### Step 4: Create Card Component

**Create:** `src/prompthire-gig/GigCard.jsx`

**Pattern Source:** `src/pizzaz-carousel/PlaceCard.jsx:1-40`

```jsx
import React from "react";
import { Briefcase, Clock, DollarSign, CheckCircle } from "lucide-react";

export default function GigCard({
  gig_title,
  gig_description,
  timeline,
  budget,
  skills_required
}) {
  return (
    <div className="w-full max-w-2xl border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-black/5">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-blue-50">
            <Briefcase className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-black truncate">
              {gig_title}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-black/60">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{timeline}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span>{budget}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-6 py-5">
        <p className="text-sm text-black/80 whitespace-pre-wrap">
          {gig_description}
        </p>
      </div>

      {/* Skills */}
      {skills_required && skills_required.length > 0 && (
        <div className="px-6 py-4 border-t border-black/5">
          <div className="flex flex-wrap gap-2">
            {skills_required.map((skill, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-sm text-black/70"
              >
                <CheckCircle className="h-3 w-3" />
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 border-t border-black/5 bg-gray-50">
        <button
          type="button"
          className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center rounded-full bg-blue-600 text-white px-6 py-2.5 text-sm font-medium hover:bg-blue-700 active:bg-blue-800"
        >
          Post Gig
        </button>
      </div>
    </div>
  );
}
```

### Step 5: Update Build System

**File:** `build-all.mts`
**Line:** 17-25

**Change:**
```typescript
const targets: string[] = [
  "todo",
  "solar-system",
  "pizzaz",
  "pizzaz-carousel",
  "pizzaz-list",
  "pizzaz-albums",
  "pizzaz-video",
  "prompthire-gig",  // ← Add this line
];
```

### Step 6: Install & Build

```bash
# Install server dependencies
cd promptHire_server_node
pnpm install

# Build widget
cd ..
pnpm run build

# Start server
cd promptHire_server_node
pnpm start
```

### Step 7: Test

**Expected Assets Generated:**
- `assets/prompthire-gig-2d2b.html`
- `assets/prompthire-gig-2d2b.css`
- `assets/prompthire-gig-2d2b.js`

**MCP Server Running:**
- `http://localhost:8000/mcp` (SSE endpoint)
- `http://localhost:8000/mcp/messages` (POST endpoint)

**Test Tool Call:**
```json
{
  "name": "create-new-gig",
  "arguments": {
    "gig_title": "Build React Dashboard",
    "gig_description": "Need a responsive admin dashboard with charts and tables",
    "timeline": "3 weeks",
    "budget": "$2000-$3000",
    "skills_required": ["React", "Tailwind", "Chart.js"]
  }
}
```

## Dependencies (All Existing)

**Server:**
- `@modelcontextprotocol/sdk: ^0.5.0`
- `zod: ^3.23.8`
- `tsx: ^4.19.2` (dev)
- `typescript: ^5.6.3` (dev)

**Widget:**
- `react: ^19.1.1`
- `react-dom: ^19.1.1`
- `lucide-react: ^0.536.0`
- `tailwindcss: 4.1.11`

## Verification Checklist

- [ ] Widget renders without errors
- [ ] `useWidgetProps()` receives data from MCP tool
- [ ] Card displays all fields correctly
- [ ] Build produces hashed HTML/CSS/JS files
- [ ] MCP server accepts tool calls
- [ ] ChatGPT can trigger tool with "create a gig"

## Success Criteria

✅ Follows existing patterns 100%
✅ No invented code - all patterns sourced from codebase
✅ Minimal implementation - single card, no routing/state
✅ Works end-to-end: conversation → tool call → widget render
