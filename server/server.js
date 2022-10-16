const express = require('express')
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
    }
});
app.use('/',express.static('ui'))

var connections = []
var clientIdArr = [];

io.on('connect', (socket) => {
    
    connections.push(socket)
    clientIdArr.push(socket.id)
    console.log(`${socket.id} has connected`);
 
    io.emit('update-client-count',clientIdArr);

    socket.on('disconnect', () => {
        connections = connections.filter((cn) => cn.id !== socket.id);
        clientIdArr = clientIdArr.filter((cn) => cn !== socket.id);
        console.log(`${socket.id} is disconnected`);
        io.emit('update-client-count', clientIdArr);
    })

    socket.on('draw', (data) => {
        socket.broadcast.emit('onDraw',data)
    })
    
    socket.on('down',(data) =>{
        socket.broadcast.emit('onDown',data)
    } ) 

})

http.listen(5000, () => console.log('listening on port 5000'));