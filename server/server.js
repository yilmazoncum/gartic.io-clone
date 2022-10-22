const express = require('express')
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
    }
});
app.get('/', (req, res) => {
    res.sendFile(process.cwd()+ '/ui/login.html');
  });

app.get('/game', (req, res) => {
    res.sendFile(process.cwd()+ '/ui/index.html');
  });

var connections = []
var clientIdArr = [];
var connectionsLimit = 100; //default limit

io.on('connect', (socket) => {

    if (io.engine.clientsCount > connectionsLimit) {
        message = 'Game is already started'
        io.emit('error',message)
        socket.disconnect()
        console.log('Disconnected...')
        return
      }
    
    connections.push(socket)
    
    socket.on('add username', (username) => {
        socket.username = username;
        console.log(`${socket.username} has connected`);
        clientIdArr.push({"id":socket.id,"username":socket.username})
        io.emit('update-client-count',clientIdArr);
    });

    socket.on('disconnect', () => {
        connections = connections.filter((cn) => cn.id !== socket.id);
        clientIdArr = clientIdArr.filter((cn) => cn.id !== socket.id);
        console.log(`${socket.username} is disconnected`);
        io.emit('update-client-count', clientIdArr);
    })

    socket.on('draw', (data) => {
        socket.broadcast.emit('onDraw',data)
    })
    
    socket.on('down',(data) =>{
        socket.broadcast.emit('onDown',data)
    } ) 

    socket.on('startGame', () =>{
        //trigger anındaki oyuncu sayısını limit belirler
        connectionsLimit = io.engine.clientsCount
    })

})

http.listen(5000, () => console.log('listening on port 5000'));