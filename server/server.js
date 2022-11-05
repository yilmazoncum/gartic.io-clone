const express = require('express')
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
    }
});
const db = require('./db.json')
const fs = require('fs');

app.get('/', (req, res) => {
    res.sendFile(process.cwd()+ '/ui/login.html');
  });

app.get('/game', (req, res) => {
    res.sendFile(process.cwd()+ '/ui/index.html');
  });
  
app.get('/results', (req, res) => {
    res.sendFile(process.cwd()+ '/ui/result.html');
  });  

var connections = [];
var clientIdArr = [];
//clientIdArr -> {"id":socket.id,"username":socket.username,"correctAnswerCount":0 })
var clients =[];
var round = 0;
var drawerID = null;
var connectionsLimit = 100; //default limit
var questions = []
var correctAnswerCount = 0;

io.on('connect', (socket) => {

    if (io.engine.clientsCount > connectionsLimit) {
        message = 'Game is already started'
        io.emit('error',message)
        socket.disconnect()
        console.log('Disconnected...')
        return
      }
    
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
        clientIdArr.push({"id":socket.id,"username":socket.username,"correctAnswerCount":0 })
        io.emit('update-client-count',clientIdArr);
    });

    //start the round and keep track of remaining time
    socket.on('start-round', () => {
        var currentDrawer = setDrawer();
        if(currentDrawer != -1){
            io.emit('round-begun')
            var time = 30;
            var roundTime = setInterval(() => {
                io.emit('change-remaining-time',time);
                
                time -= 1;
                if(time <= 0 || IsAllAnswersCorrect(correctAnswerCount)){
                    clearInterval(roundTime);
                    correctAnswerCount = 0
                    io.emit('round-end')
                }
            },1000);
    }
    });

    socket.on('disconnect', async () => {
        connections = connections.filter((cn) => cn.id !== socket.id);
        clientIdArr = clientIdArr.filter((cn) => cn.id !== socket.id);

        //leader room'un client sayısı 
        const sockets = await io.in("leader").fetchSockets();
        // if(sockets.length == 0){
        //     newLeaderId = clientIdArr[0].id
        //     io.to(newLeaderId).emit("leaderChange")
        // }

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
        getQuestionsFromDb(connectionsLimit) //! kullanıcı sayısı kadar soru alıyo oyun mantığı değişebilir
        
        io.emit('game-begun');
        
    })

    socket.on('leaderChange', async () =>{
        socket.leave("non-leader")
        socket.join("leader")
    })

    socket.on('guessCorrect', () =>{
        foundClient = clientIdArr.find(cn => cn.id == socket.id) 
            foundClient.correctAnswerCount++ 
            correctAnswerCount++
            console.log(socket.username + "correct answer " + foundClient.correctAnswerCount);
            io.emit('update-client-count', clientIdArr);
    })
})

function setDrawer(){
    console.log(round, connectionsLimit);
    console.log("146: " + questions)
    if(round >= connectionsLimit){
        // TODO: start butonuna basınca oyun bitiyo, düzeltilmeli
        
        io.emit('game-end', getWinner())
        return -1;
    }
  
    drawerID = clientIdArr[round]['id'];
    io.to(drawerID).emit('drawer');

    
    currentQuestion = questions[round]

    io.to(drawerID).emit('showQuestion',currentQuestion)
    io.emit('setQuestion',currentQuestion);
    round += 1;
    return drawerID;
}

function getWinner(){
    clientIdArr.sort((a,b) => a.correctAnswerCount < b.correctAnswerCount ? 1 : -1)
    if (checkHighscore(clientIdArr[0].correctAnswerCount)) setHighscore(clientIdArr[0])
    return clientIdArr
}

function IsAllAnswersCorrect(count) {
    return (io.engine.clientsCount - 1) == count

}

function setHighscore(user) {

    let doc = fs.readFileSync( process.cwd()+ '/server/db.json' )
    let docData = JSON.parse(doc);

    docData.highscore.name = user.username
    docData.highscore.score = user.correctAnswerCount

    let data = JSON.stringify(docData);  
    fs.writeFileSync(process.cwd()+ '/server/db.json', data);
}

function checkHighscore(score) {
    return db.highscore.score < score; 
}

function getQuestionsFromDb(questionCount){
    for (let i = 0; i < questionCount; i++) {
        randomNum = randomNumber(10) //! db deki soru sayısı 10
        questions.push(db.questions[randomNum].text)
    }

    console.log(questions)
}

function randomNumber(maxValue) {
    return Math.floor(Math.random() * maxValue)
}

const GetSocketsInfo = async () => {
    // Util/Debug Func
    const sockets = await io.fetchSockets();
    for (const socket of sockets) {
        console.log(socket.id);
        console.log(socket.rooms);
      }
}



http.listen(5000, () => console.log('listening on port 5000'));