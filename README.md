# ASCIIFlow MCP Server

An MCP (Model Context Protocol) server that exposes ASCIIFlow's drawing primitives as tools, enabling AI assistants to generate ASCII wireframes directly from PRDs or natural language descriptions.

## Installation

Requires Node.js >= 20.

**Recommended: Global installation from source**

```bash
# Clone the repository
git clone https://github.com/bobooooo/asciiflow-mcp.git
cd asciiflow-mcp

# Install dependencies
npm install

# Install globally
npm install -g .
```

**Alternative: Direct use with npx (may be slower)**

```bash
npx -y github:bobooooo/asciiflow-mcp
```

> **Note**: Due to npm's handling of git dependencies, direct installation with `npm install -g github:...` may fail. The recommended method above clones the repository first to avoid this issue.

## Claude Desktop Configuration

**For global installation (recommended):**

Add the following to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "asciiflow": {
      "command": "asciiflow-mcp"
    }
  }
}
```

**For npx:**

```json
{
  "mcpServers": {
    "asciiflow": {
      "command": "npx",
      "args": ["-y", "github:bobooooo/asciiflow-mcp"]
    }
  }
}
```

Then restart Claude Desktop.

## Available Tools

| Tool | Parameters | Description |
|------|-----------|-------------|
| `canvas_new` | — | 创建/重置一个空白画布 |
| `draw_box` | `x`, `y`, `w`, `h`, `label?` | 在画布上绘制矩形框。`x`/`y` 为左上角坐标，`w`/`h` 为宽高（字符单位，最小 3），`label` 可选，显示在顶边框中央 |
| `draw_line` | `x1`, `y1`, `x2`, `y2` | 在两点之间绘制折线（先水平后垂直） |
| `draw_arrow` | `x1`, `y1`, `x2`, `y2` | 在两点之间绘制带箭头的连线，箭头指向终点 |
| `add_text` | `x`, `y`, `text` | 在指定坐标添加文字，支持 `\n` 换行 |
| `canvas_export` | — | 导出当前画布为 ASCII 文本 |
| `canvas_preview` | — | 预览当前画布状态（与 `canvas_export` 相同，用于中间检查） |
| `canvas_batch` | `ops` | 批量执行绘图指令并返回最终结果。`ops` 是指令数组，每条指令包含 `op` 字段（`canvas_new` / `draw_box` / `draw_line` / `draw_arrow` / `add_text`）及对应参数 |

All coordinates are in character-grid units (columns / rows).

## Example Usage

### Single Tool Calls

Prompt Claude with:

> 帮我根据这个 PRD 生成登录页面的 ASCII 线框图：用户需要输入邮箱和密码，点击登录按钮后跳转到主页，底部有"忘记密码"和"注册"链接。

Claude will call the MCP tools sequentially and produce output like:

```
┌────────────────登录────────────────┐
│                                  │
│                                  │
│ 邮箱:                              │
│ ┌──────────────────────────────┐ │
│ │                              │ │
│ └──────────────────────────────┘ │
│                                  │
│ 密码:                              │
│ ┌──────────────────────────────┐ │
│ │                              │ │
│ └──────────────────────────────┘ │
│                                  │
│         ┌─────登 录──────┐         │
│         │              │         │
│         └──────────────┘         │
│                                  │
│  忘记密码?              注册账号   │
│                                  │
└──────────────────────────────────┘
```

### Batch Tool Call

For better performance, use `canvas_batch` to execute all drawing operations in a single call:

```json
{
  "ops": [
    { "op": "canvas_new" },
    { "op": "draw_box", "x": 0, "y": 0, "w": 36, "h": 20, "label": "登录" },
    { "op": "add_text", "x": 2, "y": 3, "text": "邮箱:" },
    { "op": "draw_box", "x": 2, "y": 4, "w": 32, "h": 3 },
    { "op": "add_text", "x": 2, "y": 8, "text": "密码:" },
    { "op": "draw_box", "x": 2, "y": 9, "w": 32, "h": 3 },
    { "op": "draw_box", "x": 10, "y": 13, "w": 16, "h": 3, "label": "登 录" },
    { "op": "add_text", "x": 3, "y": 17, "text": "忘记密码?" },
    { "op": "add_text", "x": 22, "y": 17, "text": "注册账号" }
  ]
}
```

## Development

### For End Users

This package is distributed with pre-built files. Simply install and use:

```bash
npm install -g github:bobooooo/asciiflow-mcp
```

### For Contributors

If you want to modify the source code, you need access to the ASCIIFlow client library:

**Option 1: Work in the main ASCIIFlow repository**

```bash
git clone https://github.com/bobooooo/asciiflow.git
cd asciiflow
git checkout asciiflow-mcp
cd mcp
npm install
npm run build
```

**Option 2: Link the client directory**

```bash
git clone https://github.com/bobooooo/asciiflow-mcp.git
cd asciiflow-mcp
# Clone the main repo as a sibling directory
cd ..
git clone https://github.com/bobooooo/asciiflow.git
cd asciiflow-mcp
npm install
npm run build
```

The build process requires the `../client/` directory from the main ASCIIFlow repository.

Run tests:

```bash
npm test
```

## Repository

- Main repository: https://github.com/bobooooo/asciiflow
- MCP package: https://github.com/bobooooo/asciiflow-mcp

## License

MIT
