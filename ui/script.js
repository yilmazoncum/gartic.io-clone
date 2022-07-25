var canvas = document.getElementById('my-canvas');
var colorPicker = document.getElementById('pen-color');
var clientCount = document.getElementById('client-count');

canvas.width = 0.98 * window.innerWidth;
canvas.height = 0.9 * window.innerHeight;

var io = io();
 
let ctx = canvas.getContext('2d');
let x,y,penColor;
let lineActive = false;

canvas.addEventListener('click',(e) => {
    lineActive = !lineActive
    ctx.moveTo(x, y)
    ctx.beginPath();
    io.emit('down',{x,y})
})

io.on('onDraw', (data) => {
    drawLine(data);
})

io.on('onDown', (data) => {
    lineActive = !lineActive
    ctx.moveTo(data.x, data.y)
    ctx.beginPath();
})

io.on('update-client-count', (count) =>{
    clientCount.innerHTML = count
})

colorPicker.addEventListener('input', (e) => {
    penColor = colorPicker.value
})

window.onmousemove = (e)=>{
    x = e.clientX;
    y = e.clientY;

    if(lineActive){
        io.emit("draw",{x,y,penColor})
        drawLine({x,y,penColor});
    }
}

const drawLine = (data) => {
    ctx.strokeStyle = data.penColor;
    ctx.lineTo(data.x,data.y)
    ctx.stroke();
}

