const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
    }
});

var connections = []

io.on('connect', (socket) => {

    connections.push(socket)
    console.log(socket);
    console.log(`${socket.id} has connected`);

   /*  socket.on('canvas-data', (data) => {
        io.broadcast.emit('canvas-data', data);
    }) */

    socket.on('disconnect', () => {
        connections = connections.filter((cn) => cn.id !== socket.id);
        console.log(`${socket.id} is disconnected`);
    })

    socket.on('draw', (data) => {
        socket.broadcast.emit('onDraw',data)
    })
    
    socket.on('down',(data) =>{
        socket.broadcast.emit('onDown',data)
    } ) 

})

http.listen(5000, () => console.log('listening on port 5000'));