# ASCIIFlow MCP Server

An MCP (Model Context Protocol) server that exposes ASCIIFlow's drawing primitives as tools, enabling AI assistants to generate ASCII wireframes directly from PRDs or natural language descriptions.

## Setup

```bash
cd mcp && npm install && npm run build
```

Requires Node.js >= 22.

## Claude Desktop Configuration

Add the following to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "asciiflow": {
      "command": "node",
      "args": [
        "--loader",
        "/Users/xingbin/Documents/Study/asciiflow/mcp/loader.mjs",
        "/Users/xingbin/Documents/Study/asciiflow/mcp/dist/mcp/src/index.js"
      ]
    }
  }
}
```

Then restart Claude Desktop.

The `--loader` flag is required to resolve `#asciiflow/*` package imports at runtime from the compiled `dist/` output.

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

All coordinates are in character-grid units (columns / rows).

## Example Usage

Prompt Claude with something like:

> 帮我根据这个 PRD 生成登录页面的 ASCII 线框图：用户需要输入邮箱和密码，点击登录按钮后跳转到主页，底部有"忘记密码"和"注册"链接。

Claude will call the MCP tools and produce output like:

```
+----------------------------------+
|            登录                  |
+----------------------------------+
|                                  |
|  邮箱:                           |
|  +----------------------------+  |
|  |                            |  |
|  +----------------------------+  |
|                                  |
|  密码:                           |
|  +----------------------------+  |
|  |                            |  |
|  +----------------------------+  |
|                                  |
|       +----------------+         |
|       |    登 录       |         |
|       +----------------+         |
|                                  |
|   忘记密码?        注册账号      |
+----------------------------------+
```

## Running Tests

```bash
cd /path/to/asciiflow && node --loader ./mcp/loader.mjs ./mcp/test-canvas.mjs
```

Or from within the `mcp/` directory:

```bash
npm test
```
