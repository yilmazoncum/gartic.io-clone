var canvas = document.getElementById('my-canvas');

canvas.width = 0.98 * window.innerWidth;
canvas.height = 0.9 * window.innerHeight;

var io = io.connect("http://localhost:5000")

let ctx = canvas.getContext('2d');
let x,y;
let lineActive = false;

canvas.addEventListener('click',(e) => {
    lineActive = !lineActive
    ctx.moveTo(x, y)
})

window.onmousemove = (e)=>{
    x = e.clientX;
    y = e.clientY;
    if(lineActive){
        ctx.lineTo(x,y)
        ctx.stroke();
    }
}
