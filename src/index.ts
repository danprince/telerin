import defaultTilesetUrl from "./font.png";

type TileSet = HTMLImageElement | HTMLCanvasElement;

/**
 * A clipping rect defined in terms of its top left and bottom right corners.
 */
interface ClipRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface Layer {
  /**
   * Cell data encoded into a single typed buffer. Each cell is represented
   * with 5 sequential elements.
   *
   * ```
   * [charCode, colorIndex, backgroundIndex, offsetX, offsetY]
   * ```
   */
  buffer: Int16Array;
  /**
   * The clipping rect to use when rendering this layer.
   */
  clip: ClipRect;
}

let colorIndexSize = 0;
let colorToIndex: Record<string, number> = {};
let colorFromIndex: Record<number, string> = {};

/**
 * Converts a color to an index value that can be stored in a layer
 * buffer.
 */
function getColorIndex(color: string | undefined): number {
  if (!color) return 0;
  if (color in colorToIndex) return colorToIndex[color];
  let index = ++colorIndexSize;
  colorFromIndex[index] = color;
  return colorToIndex[color] = index;
}

/**
 * Mapping to convert character codes into tileset indexes.
 */
export type CodePage = Record<number, number>;

export const CP437: CodePage = { 9786: 1, 9787: 2, 9829: 3, 9830: 4, 9827: 5, 9824: 6, 8226: 7, 9688: 8, 9675: 9, 9689: 10, 9794: 11, 9792: 12, 9834: 13, 9835: 14, 9788: 15, 9658: 16, 9668: 17, 8597: 18, 8252: 19, 182: 20, 167: 21, 9644: 22, 8616: 23, 8593: 24, 8595: 25, 8594: 26, 8592: 27, 8735: 28, 8596: 29, 9650: 30, 9660: 31, 8962: 127, 199: 128, 252: 129, 233: 130, 226: 131, 228: 132, 224: 133, 229: 134, 231: 135, 234: 136, 235: 137, 232: 138, 239: 139, 238: 140, 236: 141, 196: 142, 197: 143, 201: 144, 230: 145, 198: 146, 244: 147, 246: 148, 242: 149, 251: 150, 249: 151, 255: 152, 214: 153, 220: 154, 162: 155, 163: 156, 165: 157, 8359: 158, 402: 159, 225: 160, 237: 161, 243: 162, 250: 163, 241: 164, 209: 165, 170: 166, 186: 167, 191: 168, 8976: 169, 172: 170, 189: 171, 188: 172, 161: 173, 171: 174, 187: 175, 9617: 176, 9618: 177, 9619: 178, 9474: 179, 9508: 180, 9569: 181, 9570: 182, 9558: 183, 9557: 184, 9571: 185, 9553: 186, 9559: 187, 9565: 188, 9564: 189, 9563: 190, 9488: 191, 9492: 192, 9524: 193, 9516: 194, 9500: 195, 9472: 196, 9532: 197, 9566: 198, 9567: 199, 9562: 200, 9556: 201, 9577: 202, 9574: 203, 9568: 204, 9552: 205, 9580: 206, 9575: 207, 9576: 208, 9572: 209, 9573: 210, 9561: 211, 9560: 212, 9554: 213, 9555: 214, 9579: 215, 9578: 216, 9496: 217, 9484: 218, 9608: 219, 9604: 220, 9612: 221, 9616: 222, 9600: 223, 945: 224, 223: 225, 915: 226, 960: 227, 931: 228, 963: 229, 181: 230, 964: 231, 934: 232, 920: 233, 937: 234, 948: 235, 8734: 236, 966: 237, 949: 238, 8745: 239, 8801: 240, 177: 241, 8805: 242, 8804: 243, 8992: 244, 8993: 245, 247: 246, 8776: 247, 176: 248, 8729: 249, 183: 250, 8730: 251, 8319: 252, 178: 253, 9632: 254 };

export class Terminal {
  /**
   * Width in cells.
   */
  readonly width: number;
  /**
   * Height in cells.
   */
  readonly height: number;
  /**
   * Canvas that the terminal renders to.
   */
  readonly canvas: HTMLCanvasElement;

  readonly ctx: CanvasRenderingContext2D;
  /**
   * Image/canvas that contains the tileset.
   */
  readonly tileset: TileSet;
  /**
   * Width of cells in pixels.
   */
  readonly cellWidth: number;
  /**
   * Height of cells in pixels.
   */
  readonly cellHeight: number;
  /**
   * List of layers in the terminal.
   */
  private layers: Layer[] = [];
  /**
   * A cache of tinted versions of the tileset.
   */
  private tints: Record<string, HTMLCanvasElement> = {};

  /**
   * Current foreground color that will be used in draw calls.
   *
   * Set to `undefined` to draw cells without tinting.
   */
  color: string | undefined;
  /**
   * Current background color that will be used in draw calls.
   *
   * Set to `undefined` to skip rendering background colors.
   */
  background: string | undefined;
  /**
   * Current layer (defaults to 0) to that the other drawing functions will operate on.
   * Must be a positive integer.
   */
  layer: number = 0;
  /**
   * The current {@link CodePage}. Defaults to {@link CP437}.
   */
  codepage: CodePage = CP437;

  constructor(
    width: number,
    height: number,
    url: string = defaultTilesetUrl,
    cellWidth = 6,
    cellHeight = 6,
  ) {
    let tileset = new Image();
    tileset.src = url;

    // Draw anything that was buffered before the tileset loaded
    tileset.addEventListener("load", () => this.refresh());

    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d")!;
    canvas.width = width * cellWidth;
    canvas.height = height * cellHeight;
    ctx.imageSmoothingEnabled = false;
    canvas.style.imageRendering = "pixelated";
    this.tileset = tileset;
    this.width = width;
    this.height = height;
    this.canvas = canvas;
    this.ctx = ctx;
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight
  }

  /**
   * Creates a layer with an empty buffer and the default clipping rect.
   */
  private createLayer() {
    return {
      buffer: new Int16Array(this.width * this.height * 5),
      clip: { x0: 0, y0: 0, x1: this.width - 1, y1: this.height - 1 },
    };
  }

  /**
   * Gets the current layer and creates it if it doesn't exist.
   */
  private getLayer(): Layer {
    return this.layers[this.layer] ||
      (this.layers[this.layer] = this.createLayer());
  }

  /**
   * Creates a color tinted version of the tileset.
   */
  tint(color: string): TileSet {
    let tinted = this.tints[color];
    if (tinted) return tinted;
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d")!;
    ctx.drawImage(this.tileset, 0, 0);
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return this.tints[color] = canvas;
  }

  /**
   * Set the scale factor for the canvas.
   * 
   * ```ts
   * terminal.scale(2)
   * ```
   */
  scale(factor: number) {
    let { canvas } = this;
    canvas.style.width = canvas.width * factor + "px";
    canvas.style.height = canvas.height * factor + "px";
  }

  /**
   * Clears the contents of all layers.
   */
  clear() {
    for (let layer of this.layers) {
      if (layer) {
        layer.buffer.fill(0);
      }
    }
  }

  /**
   * Clears the contents of the current layer.
   */
  clearLayer() {
    this.getLayer().buffer.fill(0);
  }

  /**
   * Set the clipping rectangle for the current layer.
   *
   * ```ts
   * terminal.clip(0, 0, 10, 10);
   * ```
   *
   * Call with no arguments to reset the clipping rectangle.
   * 
   * ```ts
   * terminal.clip();
   * ```
   *
   * The clipping rect is only applied when rendering.
   */
  clip(x = 0, y = 0, width = this.width, height = this.height) {
    this.getLayer().clip = { x0: x, y0: y, x1: x + width, y1: y + height };
  }

  /**
   * Put a character into a cell.
   *
   * ```ts
   * terminal.put(0, 0, 0x40)
   * terminal.put(0, 0, 0x40, -1, -1)
   * ```
   *
   * @param x X cell coordinate
   * @param y Y cell coordinate
   * @param code Character code
   * @param offsetX Horizontal offset in pixels
   * @param offsetY Vertical offset in pixels
   */
  put(x: number, y: number, code: number, offsetX = 0, offsetY = 0) {
    let { width, height, color, background, codepage } = this;
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    let { buffer } = this.getLayer();
    let i = (x + y * width) * 5;
    buffer[i++] = codepage[code] || code;
    buffer[i++] = getColorIndex(color);
    buffer[i++] = getColorIndex(background);
    buffer[i++] = offsetX;
    buffer[i] = offsetY;
  }

  /**
   * Renders the terminal to the canvas.
   */
  refresh() {
    // Can't render unless the tileset has loaded
    if (this.tileset.width === 0) return;

    let { canvas, ctx, tileset, width, cellWidth, cellHeight } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let layer of this.layers) {
      if (layer == null) continue;
      let { buffer, clip } = layer;
      for (let y = clip.y0; y <= clip.y1; y++) {
        for (let x = clip.x0; x <= clip.x1; x++) {
          let i = (x + y * width) * 5;
          let code = buffer[i++];
          if (!code) continue;
          let fg = buffer[i++];
          let bg = buffer[i++];
          let offsetX = buffer[i++];
          let offsetY = buffer[i++];
          let img: HTMLImageElement | HTMLCanvasElement = tileset;
          let cols = tileset.width / cellWidth;
          let cw = cellWidth;
          let ch = cellHeight;
          let sx = (code % cols) * cw;
          let sy = (code / cols | 0) * ch;
          let dx = x * cw + offsetX;
          let dy = y * ch + offsetY;
          if (fg) img = this.tint(colorFromIndex[fg]);
          if (bg) ctx.fillStyle = colorFromIndex[bg];
          if (bg) ctx.fillRect(dx, dy, cw, ch);
          ctx.drawImage(img, sx, sy, cw, ch, dx, dy, cw, ch);
        }
      }
    }
  }

  /**
   * Writes a string of text to the current layer.
   *
   * ```ts
   * terminal.write(1, 2, "Hello, world!")
   * ```
   */
  write(x: number, y: number, text: string) {
    let tx = x;
    let ty = y;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "\n") {
        tx = x;
        ty++;
      } else {
        this.put(tx++, ty, text.charCodeAt(i));
      }
    }
  }

  /**
   * Draw a box.
   *
   * ```ts
   * // Use the default box drawing characters
   * terminal.box(0, 0, 5, 5);
   * 
   * // Use custom box drawing characters
   * terminal.box(0, 0, 5, 5, "┌┐└┘─│");
   * ```
   */
  box(x: number, y: number, w: number, h: number, chars = "┌┐└┘─│") {
    let [x0, y0, x1, y1] = [x, y, x + w - 1, y + h - 1];
    this.put(x0, y0, chars.charCodeAt(0));
    this.put(x1, y0, chars.charCodeAt(1));
    this.put(x0, y1, chars.charCodeAt(2));
    this.put(x1, y1, chars.charCodeAt(3));

    for (let x = x0 + 1; x < x1; x++) {
      this.put(x, y0, chars.charCodeAt(4));
      this.put(x, y1, chars.charCodeAt(4));
    }

    for (let y = y0 + 1; y < y1; y++) {
      this.put(x0, y, chars.charCodeAt(5));
      this.put(x1, y, chars.charCodeAt(5));
    }
  }

  /**
   * Converts coordinates in screen space (e.g. `event.clientX` and
   * `event.clientY`) to rounded grid coordinates.
   */
  screenToGrid(x: number, y: number): { x: number, y: number } {
    let { width, height, cellWidth, cellHeight, canvas } = this;
    let rect = canvas.getBoundingClientRect();
    let scaleX = rect.width / cellWidth / width;
    let scaleY = rect.height / cellHeight / height;
    let gridX = (x - rect.x) / cellWidth / scaleX;
    let gridY = (y - rect.y) / cellHeight / scaleY;
    return { x: Math.floor(gridX), y: Math.floor(gridY) };
  }
}
