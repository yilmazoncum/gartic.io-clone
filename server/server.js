const { Socket } = require('socket.io');

const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

io.on('connection', (socket)=> {
    console.log(`${socket.id} has connected`);

    socket.on('canvas-data', (data) => {
        io.broadcast.emit('canvas-data', data);
    })

    socket.on('disconnect', () => {
        console.log(`${socket.id} has disconnected`);
    })

})

http.listen(5000, () => console.log('listening on port 5000'));