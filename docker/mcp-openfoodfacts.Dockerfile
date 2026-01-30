# Open Food Facts MCP Server - HTTP/SSE exposed via mcp-proxy
# Bridges stdio-based open-food-facts-mcp to HTTP for n8n and other remote clients

FROM ghcr.io/sparfenyuk/mcp-proxy:latest

# Install Node.js for running open-food-facts-mcp
RUN apk add --no-cache nodejs npm git

# Clone and build open-food-facts-mcp (stdio-only MCP server)
WORKDIR /app
RUN git clone --depth 1 https://github.com/caleb-conner/open-food-facts-mcp off-mcp
WORKDIR /app/off-mcp
# Patch: upstream has TS errors (args unknown/undefined) - add type assertion
RUN sed -i 's/arguments: args } = request.params;/arguments: rawArgs } = request.params; const args = (rawArgs ?? {}) as any;/' src/index.ts
RUN npm install && npm run build && rm -rf .git node_modules/.cache

# Default: expose SSE on port 8080, spawn open-food-facts-mcp via stdio
ENV MCP_PORT=8080
ENV MCP_HOST=0.0.0.0

EXPOSE ${MCP_PORT}

# mcp-proxy: SSE server mode, spawns stdio server (node dist/index.js)
# --port, --host: SSE server binding
# node dist/index.js: the stdio MCP server to spawn
CMD ["--port=8080", "--host=0.0.0.0", "node", "/app/off-mcp/dist/index.js"]
