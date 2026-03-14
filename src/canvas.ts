import { Layer } from "#asciiflow/client/layer.js";
import { Vector } from "#asciiflow/client/vector.js";
import { layerToText } from "#asciiflow/client/text_utils.js";
import { UNICODE } from "#asciiflow/client/constants.js";
import { line } from "#asciiflow/client/draw/utils.js";
import { Box } from "#asciiflow/client/common.js";

export class Canvas {
  private layer = new Layer();

  reset() {
    this.layer = new Layer();
  }

  drawBox(x: number, y: number, w: number, h: number, label?: string) {
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

  drawLine(x1: number, y1: number, x2: number, y2: number) {
    const lineLayer = line(new Vector(x1, y1), new Vector(x2, y2), true);
    this.layer.setFrom(lineLayer);
  }

  drawArrow(x1: number, y1: number, x2: number, y2: number) {
    this.drawLine(x1, y1, x2, y2);
    const dx = x2 - x1;
    const dy = y2 - y1;
    let arrowChar: string;
    if (Math.abs(dx) >= Math.abs(dy)) {
      arrowChar = dx >= 0 ? UNICODE.arrowRight : UNICODE.arrowLeft;
    } else {
      arrowChar = dy >= 0 ? UNICODE.arrowDown : UNICODE.arrowUp;
    }
    this.layer.set(new Vector(x2, y2), arrowChar);
  }

  addText(x: number, y: number, text: string) {
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

  export(): string {
    return layerToText(this.layer);
  }
}
