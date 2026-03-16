#!/usr/bin/env node


// src/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ../client/vector.ts
var Vector = class _Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  static serialize(value) {
    return value.toString();
  }
  static deserialize(value) {
    return _Vector.fromString(value);
  }
  static fromPointerEvent(event) {
    return new _Vector(event.clientX, event.clientY);
  }
  toString() {
    return `${this.x}:${this.y}`;
  }
  static fromString(value) {
    const split = value.split(":");
    return new _Vector(Number(split[0]), Number(split[1]));
  }
  equals(other) {
    return other != null && this.x == other.x && this.y == other.y;
  }
  subtract(other) {
    return new _Vector(this.x - other.x, this.y - other.y);
  }
  add(other) {
    return new _Vector(this.x + other.x, this.y + other.y);
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  scale(scale) {
    return new _Vector(this.x * scale, this.y * scale);
  }
  /**
   * Move up by value. Defaults to 1.
   */
  up(value = 1) {
    return new _Vector(this.x, this.y - value);
  }
  /**
   * Move down by value. Defaults to 1.
   */
  down(value = 1) {
    return new _Vector(this.x, this.y + value);
  }
  /**
   * Move left by value. Defaults to 1.
   */
  left(value = 1) {
    return new _Vector(this.x - value, this.y);
  }
  /**
   * Move right by value. Defaults to 1.
   */
  right(value = 1) {
    return new _Vector(this.x + value, this.y);
  }
};

// ../client/common.ts
var Box = class {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }
  left() {
    return Math.min(this.start.x, this.end.x);
  }
  right() {
    return Math.max(this.start.x, this.end.x);
  }
  top() {
    return Math.min(this.start.y, this.end.y);
  }
  bottom() {
    return Math.max(this.start.y, this.end.y);
  }
  topLeft() {
    return new Vector(
      Math.min(this.start.x, this.end.x),
      Math.min(this.start.y, this.end.y)
    );
  }
  topRight() {
    return new Vector(
      Math.max(this.start.x, this.end.x),
      Math.min(this.start.y, this.end.y)
    );
  }
  bottomRight() {
    return new Vector(
      Math.max(this.start.x, this.end.x),
      Math.max(this.start.y, this.end.y)
    );
  }
  bottomLeft() {
    return new Vector(
      Math.min(this.start.x, this.end.x),
      Math.max(this.start.y, this.end.y)
    );
  }
  contains(position) {
    const topLeft = this.topLeft();
    const bottomRight = this.bottomRight();
    return position.x >= topLeft.x && position.x <= bottomRight.x && position.y >= topLeft.y && position.y <= bottomRight.y;
  }
};
var CellContext = class {
  constructor(left, right, up, down, leftup, leftdown, rightup, rightdown) {
    this.left = left;
    this.right = right;
    this.up = up;
    this.down = down;
    this.leftup = leftup;
    this.leftdown = leftdown;
    this.rightup = rightup;
    this.rightdown = rightdown;
  }
  sum() {
    return +this.left + +this.right + +this.up + +this.down;
  }
};

// ../client/font.ts
var FONT_FAMILY = "'Source Code Pro', monospace";
var FONT_SIZE = 15;
var FONT_SPEC = `${FONT_SIZE}px ${FONT_FAMILY}`;

// ../client/constants.ts
var UNICODE = {
  cornerTopLeft: "\u250C",
  cornerTopRight: "\u2510",
  cornerBottomRight: "\u2518",
  cornerBottomLeft: "\u2514",
  arrowLeft: "\u25C4",
  arrowRight: "\u25BA",
  arrowUp: "\u25B2",
  arrowDown: "\u25BC",
  lineVertical: "\u2502",
  lineHorizontal: "\u2500",
  junctionDown: "\u252C",
  junctionUp: "\u2534",
  junctionLeft: "\u2524",
  junctionRight: "\u251C",
  junctionAll: "\u253C"
};
var SPECIAL_VALUE = UNICODE.junctionAll;
var ALT_SPECIAL_VALUE = UNICODE.arrowRight;
var SPECIAL_VALUE_KEYS = [
  "cornerTopLeft",
  "cornerTopRight",
  "cornerBottomRight",
  "cornerBottomLeft",
  "lineVertical",
  "lineHorizontal",
  "junctionDown",
  "junctionUp",
  "junctionLeft",
  "junctionRight",
  "junctionAll"
];
var ALT_SPECIAL_VALUE_KEYS = [
  "arrowLeft",
  "arrowRight",
  "arrowUp",
  "arrowDown"
];
var SPECIAL_VALUES = [
  .../* @__PURE__ */ new Set([
    ...SPECIAL_VALUE_KEYS.map((key) => UNICODE[key])
    // ...SPECIAL_VALUE_KEYS.map((key) => ASCII[key]),
  ])
];
var ALT_SPECIAL_VALUES = [
  .../* @__PURE__ */ new Set([
    ...ALT_SPECIAL_VALUE_KEYS.map((key) => UNICODE[key])
    // ...ALT_SPECIAL_VALUE_KEYS.map((key) => ASCII[key]),
  ])
];
var Characters = class {
  static isLine = (value) => {
    return SPECIAL_VALUES.includes(value);
  };
  static isArrow = (value) => {
    return ALT_SPECIAL_VALUES.includes(value);
  };
};
var ALL_SPECIAL_VALUES = SPECIAL_VALUES.concat(ALT_SPECIAL_VALUES);

// ../client/render_layer.ts
var LegacyRenderLayer = class {
  constructor(baseLayer) {
    this.baseLayer = baseLayer;
  }
  keys() {
    return this.baseLayer.keys();
  }
  entries() {
    return this.keys().map((key) => [key, this.get(key)]);
  }
  get(position) {
    const characterSet = UNICODE;
    const combined = this.baseLayer;
    const value = combined.get(position);
    const isLine = Characters.isLine(value);
    const isArrow = Characters.isArrow(value);
    if (isArrow) {
      const context = cellContext(position, combined);
      if (context.sum() === 1) {
        if (context.up) {
          return characterSet.arrowDown;
        }
        if (context.down) {
          return characterSet.arrowUp;
        }
        if (context.left) {
          return characterSet.arrowRight;
        }
        if (context.right) {
          return characterSet.arrowLeft;
        }
      }
      if (context.sum() === 2) {
        if (context.left && context.right && !context.rightup && !context.rightdown) {
          return characterSet.arrowLeft;
        }
        if (context.left && context.right && !context.leftup && !context.leftdown) {
          return characterSet.arrowRight;
        }
        if (context.up && context.down && !context.leftup && !context.rightup) {
          return characterSet.arrowDown;
        }
        if (context.up && context.down && !context.leftdown && !context.rightdown) {
          return characterSet.arrowUp;
        }
      }
      if (context.sum() === 3) {
        if (!context.up) {
          return characterSet.arrowUp;
        }
        if (!context.down) {
          return characterSet.arrowDown;
        }
        if (!context.left) {
          return characterSet.arrowLeft;
        }
        if (!context.right) {
          return characterSet.arrowRight;
        }
      }
    }
    if (isLine) {
      const context = cellContext(position, combined);
      if (context.sum() === 1) {
        if (context.left || context.right) {
          return characterSet.lineHorizontal;
        }
        if (context.up || context.down) {
          return characterSet.lineVertical;
        }
      }
      if (context.sum() === 2) {
        if (context.left && context.right) {
          return characterSet.lineHorizontal;
        }
        if (context.up && context.down) {
          return characterSet.lineVertical;
        }
        if (context.right && context.down) {
          return characterSet.cornerTopLeft;
        }
        if (context.left && context.down) {
          return characterSet.cornerTopRight;
        }
        if (context.right && context.up) {
          return characterSet.cornerBottomLeft;
        }
        if (context.left && context.up) {
          return characterSet.cornerBottomRight;
        }
      }
      if (context.sum() === 3) {
        if (!context.right && context.leftup && context.leftdown) {
          return characterSet.lineVertical;
        }
        if (!context.left && context.rightup && context.rightdown) {
          return characterSet.lineVertical;
        }
        if (!context.down && context.leftup && context.rightup) {
          return characterSet.lineHorizontal;
        }
        if (!context.up && context.rightdown && context.leftdown) {
          return characterSet.lineHorizontal;
        }
        if (context.up && context.left && context.right && context.leftup && context.rightup) {
          return characterSet.lineHorizontal;
        }
        if (context.down && context.left && context.right && context.leftdown && context.rightdown) {
          return characterSet.lineHorizontal;
        }
        const up = combined.get(position.up());
        const down = combined.get(position.down());
        const left = combined.get(position.left());
        const right = combined.get(position.right());
        if (context.left && context.right && context.down) {
          if (Characters.isArrow(down)) {
            return characterSet.lineHorizontal;
          }
          if (Characters.isArrow(right)) {
            return characterSet.cornerTopRight;
          }
          if (Characters.isArrow(left)) {
            return characterSet.cornerTopLeft;
          }
          return characterSet.junctionDown;
        }
        if (context.left && context.right && context.up) {
          if (Characters.isArrow(up)) {
            return characterSet.lineHorizontal;
          }
          if (Characters.isArrow(left)) {
            return characterSet.cornerBottomLeft;
          }
          if (Characters.isArrow(right)) {
            return characterSet.cornerBottomRight;
          }
          return characterSet.junctionUp;
        }
        if (context.left && context.up && context.down) {
          if (Characters.isArrow(left)) {
            return characterSet.lineVertical;
          }
          if (Characters.isArrow(up)) {
            return characterSet.cornerTopRight;
          }
          if (Characters.isArrow(down)) {
            return characterSet.cornerBottomRight;
          }
          return characterSet.junctionLeft;
        }
        if (context.up && context.right && context.down) {
          if (Characters.isArrow(right)) {
            return characterSet.lineVertical;
          }
          if (Characters.isArrow(up)) {
            return characterSet.cornerTopLeft;
          }
          if (Characters.isArrow(down)) {
            return characterSet.cornerBottomLeft;
          }
          return characterSet.junctionRight;
        }
        return SPECIAL_VALUE;
      }
      if (context.sum() === 4) {
        const upIsArrow = Characters.isArrow(combined.get(position.up()));
        const downIsArrow = Characters.isArrow(combined.get(position.down()));
        const leftIsArrow = Characters.isArrow(combined.get(position.left()));
        const rightIsArrow = Characters.isArrow(combined.get(position.right()));
        if (upIsArrow && !downIsArrow && !leftIsArrow && !rightIsArrow) {
          return characterSet.junctionDown;
        }
        if (!upIsArrow && downIsArrow && !leftIsArrow && !rightIsArrow) {
          return characterSet.junctionUp;
        }
        if (!upIsArrow && !downIsArrow && leftIsArrow && !rightIsArrow) {
          return characterSet.junctionRight;
        }
        if (!upIsArrow && !downIsArrow && !leftIsArrow && rightIsArrow) {
          return characterSet.junctionLeft;
        }
        if (upIsArrow && downIsArrow && !leftIsArrow && !rightIsArrow) {
          return characterSet.lineHorizontal;
        }
        if (upIsArrow && !downIsArrow && leftIsArrow && !rightIsArrow) {
          return characterSet.cornerTopLeft;
        }
        if (upIsArrow && !downIsArrow && !leftIsArrow && rightIsArrow) {
          return characterSet.cornerTopRight;
        }
        if (!upIsArrow && downIsArrow && leftIsArrow && !rightIsArrow) {
          return characterSet.cornerBottomLeft;
        }
        if (!upIsArrow && downIsArrow && !leftIsArrow && rightIsArrow) {
          return characterSet.cornerBottomRight;
        }
        if (!upIsArrow && !downIsArrow && leftIsArrow && rightIsArrow) {
          return characterSet.lineVertical;
        }
        return characterSet.junctionAll;
      }
    }
    return value;
  }
};
function cellContext(position, layer) {
  const left = ALL_SPECIAL_VALUES.includes(
    layer.get(position.left())
  );
  const right = ALL_SPECIAL_VALUES.includes(
    layer.get(position.right())
  );
  const up = ALL_SPECIAL_VALUES.includes(layer.get(position.up()));
  const down = ALL_SPECIAL_VALUES.includes(
    layer.get(position.down())
  );
  const leftup = ALL_SPECIAL_VALUES.includes(
    layer.get(position.left().up())
  );
  const leftdown = ALL_SPECIAL_VALUES.includes(
    layer.get(position.left().down())
  );
  const rightup = ALL_SPECIAL_VALUES.includes(
    layer.get(position.right().up())
  );
  const rightdown = ALL_SPECIAL_VALUES.includes(
    layer.get(position.right().down())
  );
  return new CellContext(
    left,
    right,
    up,
    down,
    leftup,
    leftdown,
    rightup,
    rightdown
  );
}

// ../client/text_utils.ts
function layerToText(layer, box) {
  if (layer.keys().length === 0) {
    return "";
  }
  if (!box) {
    const start = new Vector(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    const end = new Vector(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);
    layer.keys().forEach((position) => {
      start.x = Math.min(start.x, position.x);
      start.y = Math.min(start.y, position.y);
      end.x = Math.max(end.x, position.x);
      end.y = Math.max(end.y, position.y);
    });
    box = new Box(start, end);
  }
  const lineArrays = [
    ...new Array(box.bottomRight().y - box.topLeft().y + 1)
  ].map(
    (x) => [...new Array(box.bottomRight().x - box.topLeft().x + 1)].fill(" ")
  );
  layer.entries().filter(([key, value]) => box.contains(key) && !!value).forEach(([key, value]) => {
    let v = value;
    if (v.charCodeAt(0) < 32 || v.charCodeAt(0) == 127) {
      v = " ";
    }
    lineArrays[key.y - box.topLeft().y][key.x - box.topLeft().x] = v;
  });
  return lineArrays.map((lineValues) => lineValues.reduce((acc, curr) => acc + curr, "")).join("\n");
}
function textToLayer(value, offset) {
  if (!offset) {
    offset = new Vector(0, 0);
  }
  const layer = new Layer();
  const lines = value.replace(/\r\n?/g, "\n").split("\n");
  for (let j = 0; j < lines.length; j++) {
    const line2 = lines[j];
    for (let i = 0; i < line2.length; i++) {
      const char = line2.charAt(i);
      if (char !== " " && char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127) {
        layer.set(new Vector(i, j).add(offset), char);
      }
    }
  }
  return layer;
}

// ../client/layer.ts
var Layer = class _Layer {
  static serialize(value) {
    return JSON.stringify({
      version: 2,
      x: value.entries().reduce((acc, [key]) => Math.min(acc, key.x), Number.MAX_SAFE_INTEGER),
      y: value.entries().reduce((acc, [key]) => Math.min(acc, key.y), Number.MAX_SAFE_INTEGER),
      text: layerToText(value)
    });
  }
  static deserialize(value) {
    const object = JSON.parse(value);
    if (!object.version) {
      const fixedLayer = new _Layer();
      const legacyRenderedLayer = new LegacyRenderLayer(
        textToLayer(object.text, new Vector(object.x, object.y))
      );
      fixedLayer.setFrom(legacyRenderedLayer);
      return fixedLayer;
    }
    return textToLayer(object.text, new Vector(object.x, object.y));
  }
  entries() {
    return this.keys().map((key) => [key, this.get(key)]);
  }
  map = /* @__PURE__ */ new Map();
  delete(position) {
    this.map.delete(position.toString());
  }
  clear() {
    this.map.clear();
  }
  set(position, value) {
    this.map.set(position.toString(), value);
  }
  setFrom(layer) {
    for (const [key, value] of layer.entries()) {
      this.set(key, value);
    }
  }
  get(position) {
    const key = position.toString();
    return this.map.has(key) ? this.map.get(key) ?? "" : "";
  }
  has(position) {
    return this.map.has(position.toString());
  }
  keys() {
    return [...this.map.keys()].map((key) => Vector.fromString(key));
  }
  size() {
    return this.map.size;
  }
  /**
   * Applies another layer to this layer, and returns the new layer and a layer that can be applied to undo the operation.
   */
  apply(otherLayer) {
    const newLayer = new _Layer();
    newLayer.map = new Map(this.map.entries());
    const undoLayer = new _Layer();
    Array.from(otherLayer.map.entries()).forEach(([key, newValue]) => {
      const oldValue = this.map.get(key);
      if (newValue === "" || newValue === " ") {
        newLayer.map.delete(key);
      } else {
        newLayer.map.set(key, newValue);
      }
      if (oldValue !== newValue) {
        undoLayer.map.set(key, !!oldValue ? oldValue : "");
      }
    });
    return [newLayer, undoLayer];
  }
};

// ../client/draw/utils.ts
function line(startPosition, endPosition, horizontalFirst) {
  if (startPosition.x === endPosition.x || startPosition.y === endPosition.y) {
    return straightLine(startPosition, endPosition);
  } else {
    return cornerLine(startPosition, endPosition, horizontalFirst);
  }
}
function cornerLine(startPosition, endPosition, horizontalFirst) {
  const cornerPosition = horizontalFirst ? new Vector(endPosition.x, startPosition.y) : new Vector(startPosition.x, endPosition.y);
  let layer = new Layer();
  layer = layer.apply(straightLine(startPosition, cornerPosition))[0];
  layer = layer.apply(straightLine(cornerPosition, endPosition))[0];
  layer.set(
    cornerPosition,
    horizontalFirst ? startPosition.x < endPosition.x ? startPosition.y < endPosition.y ? UNICODE.cornerTopRight : UNICODE.cornerBottomRight : startPosition.y < endPosition.y ? UNICODE.cornerTopLeft : UNICODE.cornerBottomLeft : startPosition.y < endPosition.y ? startPosition.x < endPosition.x ? UNICODE.cornerBottomLeft : UNICODE.cornerBottomRight : startPosition.x < endPosition.x ? UNICODE.cornerTopLeft : UNICODE.cornerTopRight
  );
  return layer;
}
function straightLine(startPosition, endPosition) {
  const layer = new Layer();
  if (startPosition.x !== endPosition.x && startPosition.y !== endPosition.y) {
    throw new Error(
      `Can't draw a straight line between points ${startPosition} and ${endPosition}`
    );
  }
  if (startPosition.x === endPosition.x) {
    const top = Math.min(startPosition.y, endPosition.y);
    const bottom = Math.max(startPosition.y, endPosition.y);
    for (let y = top; y <= bottom; y++) {
      layer.set(new Vector(startPosition.x, y), UNICODE.lineVertical);
    }
  }
  if (startPosition.y === endPosition.y) {
    const left = Math.min(startPosition.x, endPosition.x);
    const right = Math.max(startPosition.x, endPosition.x);
    for (let x = left; x <= right; x++) {
      layer.set(new Vector(x, startPosition.y), UNICODE.lineHorizontal);
    }
  }
  return layer;
}

// src/canvas.ts
var Canvas = class {
  layer = new Layer();
  reset() {
    this.layer = new Layer();
  }
  drawBox(x, y, w, h, label) {
    const start = new Vector(x, y);
    const end = new Vector(x + w - 1, y + h - 1);
    const box = new Box(start, end);
    for (let px = box.left(); px <= box.right(); px++) {
      this.layer.set(new Vector(px, box.top()), UNICODE.lineHorizontal);
      this.layer.set(new Vector(px, box.bottom()), UNICODE.lineHorizontal);
    }
    for (let py = box.top(); py <= box.bottom(); py++) {
      this.layer.set(new Vector(box.left(), py), UNICODE.lineVertical);
      this.layer.set(new Vector(box.right(), py), UNICODE.lineVertical);
    }
    this.layer.set(box.topLeft(), UNICODE.cornerTopLeft);
    this.layer.set(box.topRight(), UNICODE.cornerTopRight);
    this.layer.set(box.bottomRight(), UNICODE.cornerBottomRight);
    this.layer.set(box.bottomLeft(), UNICODE.cornerBottomLeft);
    if (label && w > 2) {
      const innerWidth = w - 2;
      const truncated = label.slice(0, innerWidth);
      const labelX = x + 1 + Math.floor((innerWidth - truncated.length) / 2);
      for (let i = 0; i < truncated.length; i++) {
        this.layer.set(new Vector(labelX + i, y), truncated[i]);
      }
    }
  }
  drawLine(x1, y1, x2, y2) {
    const lineLayer = line(new Vector(x1, y1), new Vector(x2, y2), true);
    this.layer.setFrom(lineLayer);
  }
  drawArrow(x1, y1, x2, y2) {
    this.drawLine(x1, y1, x2, y2);
    const dx = x2 - x1;
    const dy = y2 - y1;
    let arrowChar;
    if (Math.abs(dx) >= Math.abs(dy)) {
      arrowChar = dx >= 0 ? UNICODE.arrowRight : UNICODE.arrowLeft;
    } else {
      arrowChar = dy >= 0 ? UNICODE.arrowDown : UNICODE.arrowUp;
    }
    this.layer.set(new Vector(x2, y2), arrowChar);
  }
  addText(x, y, text) {
    const lines = text.split("\n");
    for (let row = 0; row < lines.length; row++) {
      for (let col = 0; col < lines[row].length; col++) {
        const ch = lines[row][col];
        if (ch !== " ") {
          this.layer.set(new Vector(x + col, y + row), ch);
        }
      }
    }
  }
  export() {
    return layerToText(this.layer);
  }
};

// src/index.ts
var canvas = new Canvas();
var server = new McpServer({
  name: "asciiflow",
  version: "0.1.0"
});
server.tool(
  "canvas_new",
  "\u521B\u5EFA/\u91CD\u7F6E\u4E00\u4E2A\u7A7A\u767D\u753B\u5E03",
  {},
  async () => {
    canvas.reset();
    return { content: [{ type: "text", text: "Canvas reset." }] };
  }
);
server.tool(
  "draw_box",
  "\u5728\u753B\u5E03\u4E0A\u7ED8\u5236\u4E00\u4E2A\u77E9\u5F62\u6846\u3002x/y \u662F\u5DE6\u4E0A\u89D2\u5750\u6807\uFF0Cw/h \u662F\u5BBD\u9AD8\uFF08\u5B57\u7B26\u5355\u4F4D\uFF09\u3002label \u53EF\u9009\uFF0C\u663E\u793A\u5728\u9876\u8FB9\u6846\u4E2D\u592E\u3002",
  {
    x: z.number().int().describe("\u5DE6\u4E0A\u89D2 x \u5750\u6807"),
    y: z.number().int().describe("\u5DE6\u4E0A\u89D2 y \u5750\u6807"),
    w: z.number().int().min(3).describe("\u5BBD\u5EA6\uFF08\u81F3\u5C11 3\uFF09"),
    h: z.number().int().min(3).describe("\u9AD8\u5EA6\uFF08\u81F3\u5C11 3\uFF09"),
    label: z.string().optional().describe("\u53EF\u9009\u6807\u7B7E\u6587\u5B57")
  },
  async ({ x, y, w, h, label }) => {
    canvas.drawBox(x, y, w, h, label);
    return { content: [{ type: "text", text: `Box drawn at (${x},${y}) size ${w}x${h}.` }] };
  }
);
server.tool(
  "draw_line",
  "\u5728\u4E24\u70B9\u4E4B\u95F4\u7ED8\u5236\u4E00\u6761\u6298\u7EBF\uFF08\u5148\u6C34\u5E73\u540E\u5782\u76F4\uFF09",
  {
    x1: z.number().int(),
    y1: z.number().int(),
    x2: z.number().int(),
    y2: z.number().int()
  },
  async ({ x1, y1, x2, y2 }) => {
    canvas.drawLine(x1, y1, x2, y2);
    return { content: [{ type: "text", text: `Line drawn from (${x1},${y1}) to (${x2},${y2}).` }] };
  }
);
server.tool(
  "draw_arrow",
  "\u5728\u4E24\u70B9\u4E4B\u95F4\u7ED8\u5236\u5E26\u7BAD\u5934\u7684\u8FDE\u7EBF\uFF0C\u7BAD\u5934\u6307\u5411\u7EC8\u70B9",
  {
    x1: z.number().int(),
    y1: z.number().int(),
    x2: z.number().int(),
    y2: z.number().int()
  },
  async ({ x1, y1, x2, y2 }) => {
    canvas.drawArrow(x1, y1, x2, y2);
    return { content: [{ type: "text", text: `Arrow drawn from (${x1},${y1}) to (${x2},${y2}).` }] };
  }
);
server.tool(
  "add_text",
  "\u5728\u6307\u5B9A\u5750\u6807\u6DFB\u52A0\u6587\u5B57\uFF08\u652F\u6301 \\n \u6362\u884C\uFF09",
  {
    x: z.number().int(),
    y: z.number().int(),
    text: z.string().describe("\u8981\u6DFB\u52A0\u7684\u6587\u5B57\uFF0C\u652F\u6301 \\n \u6362\u884C")
  },
  async ({ x, y, text }) => {
    canvas.addText(x, y, text);
    return { content: [{ type: "text", text: `Text added at (${x},${y}).` }] };
  }
);
server.tool(
  "canvas_export",
  "\u5BFC\u51FA\u5F53\u524D\u753B\u5E03\u4E3A ASCII \u6587\u672C",
  {},
  async () => {
    const result = canvas.export();
    return { content: [{ type: "text", text: result || "(empty canvas)" }] };
  }
);
server.tool(
  "canvas_preview",
  "\u9884\u89C8\u5F53\u524D\u753B\u5E03\u72B6\u6001\uFF08\u4E0E canvas_export \u76F8\u540C\uFF0C\u7528\u4E8E\u4E2D\u95F4\u68C0\u67E5\uFF09",
  {},
  async () => {
    const result = canvas.export();
    return { content: [{ type: "text", text: result || "(empty canvas)" }] };
  }
);
var OpSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("canvas_new") }),
  z.object({ op: z.literal("draw_box"), x: z.number().int(), y: z.number().int(), w: z.number().int().min(3), h: z.number().int().min(3), label: z.string().optional() }),
  z.object({ op: z.literal("draw_line"), x1: z.number().int(), y1: z.number().int(), x2: z.number().int(), y2: z.number().int() }),
  z.object({ op: z.literal("draw_arrow"), x1: z.number().int(), y1: z.number().int(), x2: z.number().int(), y2: z.number().int() }),
  z.object({ op: z.literal("add_text"), x: z.number().int(), y: z.number().int(), text: z.string() })
]);
server.tool(
  "canvas_batch",
  "\u6279\u91CF\u6267\u884C\u7ED8\u56FE\u6307\u4EE4\u5E76\u8FD4\u56DE\u6700\u7EC8 ASCII \u7ED3\u679C\u3002ops \u662F\u6307\u4EE4\u6570\u7EC4\uFF0C\u6BCF\u6761\u6307\u4EE4\u5305\u542B op \u5B57\u6BB5\u6307\u5B9A\u64CD\u4F5C\u7C7B\u578B\uFF08canvas_new / draw_box / draw_line / draw_arrow / add_text\uFF09\uFF0C\u4EE5\u53CA\u5BF9\u5E94\u53C2\u6570\u3002\u6267\u884C\u5B8C\u6240\u6709\u6307\u4EE4\u540E\u81EA\u52A8\u5BFC\u51FA\u753B\u5E03\u3002",
  {
    ops: z.array(OpSchema).describe("\u7ED8\u56FE\u6307\u4EE4\u6570\u7EC4\uFF0C\u6309\u987A\u5E8F\u6267\u884C")
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
var transport = new StdioServerTransport();
await server.connect(transport);
