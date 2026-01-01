//-----
// open/close drawers
//
document.querySelectorAll(".category-toggle").forEach(btn => {
  btn.addEventListener("click", () => {
    // close all drawers
    document.querySelectorAll(".drawer").forEach(d => d.classList.remove("open"));
    // open clicked drawer
    const drawer = btn.nextElementSibling;
    drawer.classList.add("open");
  });
});

//-----
// read doll parts info on page load
//
document.addEventListener("DOMContentLoaded", () => {
  const dollType = document.body.dataset.dollType;
  const jsonFile = document.body.dataset.json;
  loadParts(jsonFile, dollType);
});

//-----
// parts array and canvas
//
const canvas = document.getElementById("dollCanvas");
const ctx = canvas.getContext("2d");
canvas.style.width = "200px";
canvas.style.height = "200px";
ctx.imageSmoothingEnabled = false;
let parts = [];
let draggingPart = null;
let offsetX = 0, offsetY = 0;
let selectedPart = null;

// get part position
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  if (e.touches && e.touches[0]) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  } else {
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
}

// redraw canvas
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  parts.forEach(p => {
    if (p == selectedPart) {
      ctx.fillStyle = "rgba(255, 153, 153, 0.6)";
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }
    ctx.drawImage(p.img, p.x, p.y, p.w, p.h);
  });
}

//-----
// put doll parts into drawer
//
async function loadParts(jsonFile, dollType) {

  const response = await fetch(jsonFile);
  const data = await response.json();


  const basePath = data["Prop-path"];

  document.querySelectorAll("#parts-area .category").forEach(categoryDiv => {
    const categoryName = categoryDiv.querySelector(".category-toggle").textContent.trim();
    const drawer = categoryDiv.querySelector(".drawer");

    if (data[categoryName]) {
      drawer.innerHTML = "";
      data[categoryName].forEach(file => {
        const img = document.createElement("img");
        img.src = `${basePath}${categoryName}/${file}`;
        img.alt = file;

        // add clicked part into canvas
        img.addEventListener("click", () => {
          const partImg = new Image();
          partImg.src = img.src;
          partImg.onload = () => {
            const x = (canvas.width - partImg.width) / 2;
            const y = (canvas.height - partImg.height) / 2;
            parts.push({
              img: partImg,
              x: x,
              y: y,
              w: partImg.width,
              h: partImg.height
            });
            redraw();
          };
        });

        drawer.appendChild(img);
      });
    }
  });
}

//-----
// drag the part
//
function startDrag(e) {
  const pos = getPos(e);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (pos.x >= p.x && pos.x <= p.x + p.w &&
        pos.y >= p.y && pos.y <= p.y + p.h) {
      draggingPart = p;
      offsetX = pos.x - p.x;
      offsetY = pos.y - p.y;
      // put foreground
      parts.splice(i, 1);
      parts.push(draggingPart);
      break;
    }
  }
}

function moveDrag(e) {
  if (!draggingPart) return;
  const pos = getPos(e);
  draggingPart.x = pos.x - offsetX;
  draggingPart.y = pos.y - offsetY;
  redraw();
}

function endDrag() {
  draggingPart = null;
}

// for large screen
canvas.addEventListener("mousedown", startDrag);
canvas.addEventListener("mousemove", moveDrag);
canvas.addEventListener("mouseup", endDrag);

// for small screen
canvas.addEventListener("touchstart", startDrag);
canvas.addEventListener("touchmove", moveDrag);
canvas.addEventListener("touchend", endDrag);

//-----
// select doll part in build area (double click or hold)
//
canvas.addEventListener("dblclick", e => {
  const pos = getPos(e);
  selectedPart = null;
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (pos.x >= p.x && pos.x <= p.x + p.w &&
        pos.y >= p.y && pos.y <= p.y + p.h) {
      selectedPart = p;
      redraw();
    }
  }
});

// tap and hold
let touchTimer;
canvas.addEventListener("touchstart", e => {
  touchTimer = setTimeout(() => {
    const pos = getPos(e);
    selectedPart = null;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (pos.x >= p.x && pos.x <= p.x + p.w &&
          pos.y >= p.y && pos.y <= p.y + p.h) {
        selectedPart = p;
        redraw();
      }
    }
  }, 500);
});
canvas.addEventListener("touchend", () => {
  clearTimeout(touchTimer);
});

//-----
// deselect the part
//
canvas.addEventListener("click", e => {
  const pos = getPos(e);
  if (selectedPart &&
      !(pos.x >= selectedPart.x && pos.x <= selectedPart.x + selectedPart.w &&
        pos.y >= selectedPart.y && pos.y <= selectedPart.y + selectedPart.h)) {
    selectedPart = null;
    redraw();
  }
});
canvas.addEventListener("touchend", e => {
  const pos = getPos(e);
  if (selectedPart &&
      !(pos.x >= selectedPart.x && pos.x <= selectedPart.x + selectedPart.w &&
        pos.y >= selectedPart.y && pos.y <= selectedPart.y + selectedPart.h)) {
    selectedPart = null;
    redraw();
  }
});

//-----
// remove button
//
document.getElementById("deleteBtn").addEventListener("click", () => {
  if (selectedPart) {
    parts = parts.filter(p => p !== selectedPart);
    selectedPart = null;
    redraw();
  }
});

// clear all button
document.getElementById("clearBtn").addEventListener("click", () => {
  parts = [];
  redraw();
});

//-----
// download button
//
document.getElementById("saveBtn").addEventListener("click", () => {
  const canvas = document.getElementById("dollCanvas");
  const ctx = canvas.getContext("2d");

  ctx.save();
  ctx.font = "12px sans-serif";
  ctx.fillStyle = "rgba(0,0,0,0.9)";
  ctx.textAlign = "center";
  ctx.fillText("Frontend Dollmaker Script", canvas.width / 2, canvas.height - 5);
  ctx.restore();

  // PNG format
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "mydoll.png";
  link.click();

  redraw();
});
