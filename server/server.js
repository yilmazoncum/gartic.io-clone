<<<<<<< HEAD
const express = require('express')
const app = express();
=======
const app = require('express')();
>>>>>>> 626d6bd1fa88cb1796a988a548ece9c7b6be95ae
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
    }
});
<<<<<<< HEAD
app.use('/',express.static('ui'))
=======
>>>>>>> 626d6bd1fa88cb1796a988a548ece9c7b6be95ae

var connections = []

io.on('connect', (socket) => {
<<<<<<< HEAD
    
    connections.push(socket)
    console.log(`${socket.id} has connected`);

=======

    connections.push(socket)
    console.log(socket);
    console.log(`${socket.id} has connected`);

   /*  socket.on('canvas-data', (data) => {
        io.broadcast.emit('canvas-data', data);
    }) */

>>>>>>> 626d6bd1fa88cb1796a988a548ece9c7b6be95ae
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