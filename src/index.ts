import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Canvas } from "./canvas.js";

const canvas = new Canvas();
const server = new McpServer({
  name: "asciiflow",
  version: "0.1.0",
});

server.tool(
  "canvas_new",
  "创建/重置一个空白画布",
  {},
  async () => {
    canvas.reset();
    return { content: [{ type: "text", text: "Canvas reset." }] };
  }
);

server.tool(
  "draw_box",
  "在画布上绘制一个矩形框。x/y 是左上角坐标，w/h 是宽高（字符单位）。label 可选，显示在顶边框中央。",
  {
    x: z.number().int().describe("左上角 x 坐标"),
    y: z.number().int().describe("左上角 y 坐标"),
    w: z.number().int().min(3).describe("宽度（至少 3）"),
    h: z.number().int().min(3).describe("高度（至少 3）"),
    label: z.string().optional().describe("可选标签文字"),
  },
  async ({ x, y, w, h, label }) => {
    canvas.drawBox(x, y, w, h, label);
    return { content: [{ type: "text", text: `Box drawn at (${x},${y}) size ${w}x${h}.` }] };
  }
);

server.tool(
  "draw_line",
  "在两点之间绘制一条折线（先水平后垂直）",
  {
    x1: z.number().int(),
    y1: z.number().int(),
    x2: z.number().int(),
    y2: z.number().int(),
  },
  async ({ x1, y1, x2, y2 }) => {
    canvas.drawLine(x1, y1, x2, y2);
    return { content: [{ type: "text", text: `Line drawn from (${x1},${y1}) to (${x2},${y2}).` }] };
  }
);

server.tool(
  "draw_arrow",
  "在两点之间绘制带箭头的连线，箭头指向终点",
  {
    x1: z.number().int(),
    y1: z.number().int(),
    x2: z.number().int(),
    y2: z.number().int(),
  },
  async ({ x1, y1, x2, y2 }) => {
    canvas.drawArrow(x1, y1, x2, y2);
    return { content: [{ type: "text", text: `Arrow drawn from (${x1},${y1}) to (${x2},${y2}).` }] };
  }
);

server.tool(
  "add_text",
  "在指定坐标添加文字（支持 \\n 换行）",
  {
    x: z.number().int(),
    y: z.number().int(),
    text: z.string().describe("要添加的文字，支持 \\n 换行"),
  },
  async ({ x, y, text }) => {
    canvas.addText(x, y, text);
    return { content: [{ type: "text", text: `Text added at (${x},${y}).` }] };
  }
);

server.tool(
  "canvas_export",
  "导出当前画布为 ASCII 文本",
  {},
  async () => {
    const result = canvas.export();
    return { content: [{ type: "text", text: result || "(empty canvas)" }] };
  }
);

server.tool(
  "canvas_preview",
  "预览当前画布状态（与 canvas_export 相同，用于中间检查）",
  {},
  async () => {
    const result = canvas.export();
    return { content: [{ type: "text", text: result || "(empty canvas)" }] };
  }
);

// Discriminated union for batch operations
const OpSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("canvas_new") }),
  z.object({ op: z.literal("draw_box"), x: z.number().int(), y: z.number().int(), w: z.number().int().min(3), h: z.number().int().min(3), label: z.string().optional() }),
  z.object({ op: z.literal("draw_line"), x1: z.number().int(), y1: z.number().int(), x2: z.number().int(), y2: z.number().int() }),
  z.object({ op: z.literal("draw_arrow"), x1: z.number().int(), y1: z.number().int(), x2: z.number().int(), y2: z.number().int() }),
  z.object({ op: z.literal("add_text"), x: z.number().int(), y: z.number().int(), text: z.string() }),
]);

server.tool(
  "canvas_batch",
  "批量执行绘图指令并返回最终 ASCII 结果。ops 是指令数组，每条指令包含 op 字段指定操作类型（canvas_new / draw_box / draw_line / draw_arrow / add_text），以及对应参数。执行完所有指令后自动导出画布。",
  {
    ops: z.array(OpSchema).describe("绘图指令数组，按顺序执行"),
  },
  async ({ ops }) => {
    for (const op of ops) {
      switch (op.op) {
        case "canvas_new":
          canvas.reset();
          break;
        case "draw_box":
          canvas.drawBox(op.x, op.y, op.w, op.h, op.label);
          break;
        case "draw_line":
          canvas.drawLine(op.x1, op.y1, op.x2, op.y2);
          break;
        case "draw_arrow":
          canvas.drawArrow(op.x1, op.y1, op.x2, op.y2);
          break;
        case "add_text":
          canvas.addText(op.x, op.y, op.text);
          break;
      }
    }
    const result = canvas.export();
    return { content: [{ type: "text", text: result || "(empty canvas)" }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
