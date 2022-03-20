import { Terminal } from "../src";

const BOX_DRAWING_EXAMPLE = `
┌─┬┐  ╔═╦╗  ╓─╥╖  ╒═╤╕
│ ││  ║ ║║  ║ ║║  │ ││
├─┼┤  ╠═╬╣  ╟─╫╢  ╞═╪╡
└─┴┘  ╚═╩╝  ╙─╨╜  ╘═╧╛
┌───────────────────┐
│  ╔═══╗ Some Text  │▒
│  ╚═╦═╝ in the box │▒
╞═╤══╩══╤═══════════╡▒
│ ├──┬──┤           │▒
│ └──┴──┘           │▒
└───────────────────┘▒
 ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
`;


let t = new Terminal(30, 30);
t.scale(2);
let m = { x: 0, y: 0 };

onmousemove = e => {
  m = t.screenToGrid(e.clientX, e.clientY);
}

drawBackground();
loop();

function drawBackground() {
  t.layer = 1;
  for (let x = 0; x < t.width; x++) {
    for (let y = 0; y < t.height; y++) {
      let code = Math.random() * 400 | 0;
      let offsetX = (Math.random() - 0.5) * 10;
      let offsetY = (Math.random() - 0.5) * 10;
      let h = Math.random() * 360 | 0;
      t.color = `hsl(${h}, 80%, 60%)`;
      t.put(x, y, code, offsetX, offsetY);
    }
  }

  t.write(0, 0, BOX_DRAWING_EXAMPLE);
}

function loop() {
  requestAnimationFrame(loop);

  t.layer = 3;
  t.clearLayer();
  t.color = "white";
  t.background = "black";
  t.box(m.x, m.y, 3, 3, "▒▒▒▒▒▒▒");
  t.box(m.x - 1, m.y - 1, 3, 3);
  t.put(m.x, m.y, "X".charCodeAt(0));

  t.refresh();
}

t.canvas.style.background = "black";
document.body.append(t.canvas);
