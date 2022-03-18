import { Terminal } from "..";

let t = new Terminal(30, 30);
let m = { x: 0, y: 0 };

t.canvas.style.width = t.canvas.width * 3 + "px";
t.canvas.style.height = t.canvas.height * 3 + "px";
document.body.append(t.canvas);

t.ready().then(() => {
  update();
  onmousemove = event => {
    m = t.screenToGrid(event.clientX, event.clientY);
    update();
  };
});

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

function update() {
  t.clear();
  t.write(1, 1, BOX_DRAWING_EXAMPLE, "blue");
  t.put(m.x, m.y, 0x40, "black", "white");
}

