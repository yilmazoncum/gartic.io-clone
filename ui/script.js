var canvas = document.getElementById('my-canvas');

canvas.width = 0.98 * window.innerWidth;
canvas.height = 0.9 * window.innerHeight;

<<<<<<< HEAD
var io = io();
=======
var io = io.connect("http://localhost:5000")
>>>>>>> 626d6bd1fa88cb1796a988a548ece9c7b6be95ae
 
let ctx = canvas.getContext('2d');
let x,y;
let lineActive = false;

canvas.addEventListener('click',(e) => {
    lineActive = !lineActive
    ctx.moveTo(x, y)
    io.emit('down',{x,y})
})

io.on('onDraw', (data) => {
    ctx.lineTo(data.x,data.y)
    ctx.stroke();
})

io.on('onDown', (data) => {
    lineActive = !lineActive
    ctx.moveTo(data.x, data.y)
})

window.onmousemove = (e)=>{
    x = e.clientX;
    y = e.clientY;

    if(lineActive){
        io.emit("draw",{x,y})
        ctx.lineTo(x,y)
        ctx.stroke();
    }
}

