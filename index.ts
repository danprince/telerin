import defaultFontSrc from "./font.png";

export interface Font {
  image: HTMLImageElement;
  charWidth: number;
  charHeight: number;
}

const defaultFontImage = new Image();
defaultFontImage.src = defaultFontSrc;

const defaultFont: Font = {
  image: defaultFontImage,
  charWidth: 6,
  charHeight: 6,
};

type CodePage = Record<number, number>;
export const CP437: CodePage = { 9786: 1, 9787: 2, 9829: 3, 9830: 4, 9827: 5, 9824: 6, 8226: 7, 9688: 8, 9675: 9, 9689: 10, 9794: 11, 9792: 12, 9834: 13, 9835: 14, 9788: 15, 9658: 16, 9668: 17, 8597: 18, 8252: 19, 182: 20, 167: 21, 9644: 22, 8616: 23, 8593: 24, 8595: 25, 8594: 26, 8592: 27, 8735: 28, 8596: 29, 9650: 30, 9660: 31, 8962: 127, 199: 128, 252: 129, 233: 130, 226: 131, 228: 132, 224: 133, 229: 134, 231: 135, 234: 136, 235: 137, 232: 138, 239: 139, 238: 140, 236: 141, 196: 142, 197: 143, 201: 144, 230: 145, 198: 146, 244: 147, 246: 148, 242: 149, 251: 150, 249: 151, 255: 152, 214: 153, 220: 154, 162: 155, 163: 156, 165: 157, 8359: 158, 402: 159, 225: 160, 237: 161, 243: 162, 250: 163, 241: 164, 209: 165, 170: 166, 186: 167, 191: 168, 8976: 169, 172: 170, 189: 171, 188: 172, 161: 173, 171: 174, 187: 175, 9617: 176, 9618: 177, 9619: 178, 9474: 179, 9508: 180, 9569: 181, 9570: 182, 9558: 183, 9557: 184, 9571: 185, 9553: 186, 9559: 187, 9565: 188, 9564: 189, 9563: 190, 9488: 191, 9492: 192, 9524: 193, 9516: 194, 9500: 195, 9472: 196, 9532: 197, 9566: 198, 9567: 199, 9562: 200, 9556: 201, 9577: 202, 9574: 203, 9568: 204, 9552: 205, 9580: 206, 9575: 207, 9576: 208, 9572: 209, 9573: 210, 9561: 211, 9560: 212, 9554: 213, 9555: 214, 9579: 215, 9578: 216, 9496: 217, 9484: 218, 9608: 219, 9604: 220, 9612: 221, 9616: 222, 9600: 223, 945: 224, 223: 225, 915: 226, 960: 227, 931: 228, 963: 229, 181: 230, 964: 231, 934: 232, 920: 233, 937: 234, 948: 235, 8734: 236, 966: 237, 949: 238, 8745: 239, 8801: 240, 177: 241, 8805: 242, 8804: 243, 8992: 244, 8993: 245, 247: 246, 8776: 247, 176: 248, 8729: 249, 183: 250, 8730: 251, 8319: 252, 178: 253, 9632: 254 };

export class Terminal {
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  codepage: CodePage = CP437;

  private font: Font;
  private tintCache = new Map<string, HTMLCanvasElement>();

  constructor(width: number, height: number, font: Font = defaultFont) {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d")!;
    canvas.width = width * font.charWidth;
    canvas.height = height * font.charHeight;
    canvas.style.imageRendering = "pixelated";
    ctx.imageSmoothingEnabled = false;

    this.width = width;
    this.height = height;
    this.font = font;
    this.canvas = canvas;
    this.ctx = ctx;
  }

  private tint(color: string) {
    let cached = this.tintCache.get(color);
    if (cached) return cached;

    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d")!;
    canvas.width = this.font.image.width;
    canvas.height = this.font.image.height;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.font.image, 0, 0);
    ctx.fillStyle = color;
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.tintCache.set(color, canvas);
    return canvas;
  }

  ready() {
    return new Promise<void>((resolve, reject) => {
      this.font.image.addEventListener("load", () => resolve());
      this.font.image.addEventListener("error", reject);
    });
  }

  put(x: number, y: number, code: number, fg?: string, bg?: string) {
    // If the image hasn't loaded yet, we need to bail out of rendering
    if (this.font.image.width === 0 || this.font.image.height === 0) return;

    code = this.codepage[code] ?? code;
    let img: HTMLImageElement | HTMLCanvasElement = this.font.image;
    let cw = this.font.charWidth;
    let ch = this.font.charHeight;
    let cols = img.width / cw;
    let sx = (code % cols) * cw;
    let sy = (code / cols | 0) * ch;
    let dx = x * cw;
    let dy = y * ch;

    if (fg) {
      img = this.tint(fg);
    }

    if (bg) {
      this.ctx.fillStyle = bg;
      this.ctx.fillRect(dx, dy, cw, ch);
    }

    this.ctx.drawImage(img, sx, sy, cw, ch, dx, dy, cw, ch);
  }

  write(x: number, y: number, text: string, fg?: string, bg?: string) {
    let tx = x;
    let ty = y;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "\n") {
        tx = x;
        ty++;
      } else {
        this.put(tx++, ty, text.charCodeAt(i), fg, bg);
      }
    }
  }

  clear(
    x: number = 0,
    y: number = 0,
    width: number = this.width,
    height: number = this.height
  ) {
    let cw = this.font.charWidth;
    let ch = this.font.charHeight;
    this.ctx.clearRect(x * cw, y * ch, width * cw, height * ch);
  }

  screenToGrid(x: number, y: number) {
    let { charWidth, charHeight } = this.font;
    let rect = this.canvas.getBoundingClientRect();
    let scaleX = rect.width / charWidth / this.width;
    let scaleY = rect.height / charHeight / this.height;
    let gridX = (x - rect.x) / charWidth / scaleX;
    let gridY = (y - rect.y) / charHeight / scaleY;
    return { x: Math.floor(gridX), y: Math.floor(gridY) };
  }
}
