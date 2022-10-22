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
        if (io.engine.clientsCount == 1 ) {
            //ilk bağlanan kişi leader room'a
            socket.join("leader")
            io.emit('leaderChange')
        }
        else {
            //diğerleri non-leader room'a
            socket.join("non-leader")
        }

        socket.username = username;
        console.log(`${socket.username} has connected`);
        clientIdArr.push({"id":socket.id,"username":socket.username})
        io.emit('update-client-count',clientIdArr);
    });

    socket.on('disconnect', async () => {
        connections = connections.filter((cn) => cn.id !== socket.id);
        clientIdArr = clientIdArr.filter((cn) => cn.id !== socket.id);

        //leader room'un client sayısı 
        const sockets = await io.in("leader").fetchSockets();
        if(sockets.length == 0){
            newLeaderId = clientIdArr[0].id
            io.to(newLeaderId).emit("leaderChange")
        }

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

    socket.on('leaderChange', async () =>{
        socket.leave("non-leader")
        socket.join("leader")
    })
})

const GetSocketsInfo = async () => {
    // Util/Debug Func
    const sockets = await io.fetchSockets();
    for (const socket of sockets) {
        console.log(socket.id);
        console.log(socket.rooms);
      }
}

http.listen(5000, () => console.log('listening on port 5000'));