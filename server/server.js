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
//clientIdArr -> {"id":socket.id,"username":socket.username,"correctAnswerCount":0 ,"point":0})
var clients =[];
var round = 0;
var drawerID = null;
var connectionsLimit = 100; //default limit
var questions = []
var correctAnswerCount = 0;
var time;
var currentDrawer;

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
        socket.username = username;
        console.log(`${socket.username} has connected`);
        clientIdArr.push({"id":socket.id,"username":socket.username,"correctAnswerCount":0,"point":0})
        let highscoreInfoStr = getHighScoreInfo()
        io.emit('highscore-info',highscoreInfoStr)
        io.emit('update-client-count',clientIdArr);
    });

    //start the round and keep track of remaining time
    socket.on('start-round', () => {
        var currentDrawer = getDrawer();
        if(currentDrawer != -1){
            io.emit('round-begun')
            time = 30;
            var roundTime = setInterval(() => {
                io.emit('change-remaining-time',time);
                
                time -= 1;
                if(time <= 0){
                    clearInterval(roundTime);
                    correctAnswerCount = 0
                    io.emit('round-end',"time")
                    setDrawer();
                    //overlayda yazdırmak amacıyla hangi nedenle oyunun bittiğini parametre olarak gönderdik
                }
                else if (IsAllAnswersCorrect(correctAnswerCount)) {
                    clearInterval(roundTime);
                    correctAnswerCount = 0
                    io.emit('round-end',"correct")
                    setDrawer();
                    //overlayda yazdırmak amacıyla hangi nedenle oyunun bittiğini parametre olarak gönderdik
                }
            },1000);
    }
    });

    socket.on('prepare-next-drawer', () => {
        io.to(drawerID).emit('prepare-drawer');
    })

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
        round = 0;
        questions = []
        setDrawer();
        getQuestionsFromDb(connectionsLimit) //! kullanıcı sayısı kadar soru alıyo oyun mantığı değişebilir
        setDrawer();
        io.to(drawerID).emit('prepare-drawer');
        io.emit('game-begun');
        
    })

    socket.on('leaderChange', async () =>{
        socket.leave("non-leader")
        socket.join("leader")
    })

    socket.on('guessCorrect', () =>{
        foundClient = clientIdArr.find(cn => cn.id == socket.id) 
            setPoint(foundClient);
            setDrawerPoint(currentDrawer);
            foundClient.correctAnswerCount++ 
            correctAnswerCount++
            console.log(socket.username + "correct answer " + foundClient.point);
            io.emit('update-client-count', clientIdArr);
    })
})

function getDrawer(){
    console.log(round, connectionsLimit);
    console.log("146: " + questions)
  
    setDrawer();
    io.to(drawerID).emit('drawer');

    
    currentQuestion = questions[round]

    io.to(drawerID).emit('showQuestion',currentQuestion);
    io.to(drawerID).emit('prepare-drawer');
    io.emit('setQuestion',currentQuestion);
    round += 1;
    return drawerID;
}

function setDrawer(){
    if(round >= connectionsLimit){
        // TODO: start butonuna basınca oyun bitiyo, düzeltilmeli
        connectionsLimit = 100;
        io.emit('game-end', getWinner())
        return -1;
    }

    drawerID = clientIdArr[round]['id'];
    currentDrawer = clientIdArr[round];
}

function getWinner(){
    clientIdArr.sort((a,b) => a.point < b.point ? 1 : -1)
    if (checkHighscore(clientIdArr[0].point)) setHighscore(clientIdArr[0])
    return clientIdArr
}

function IsAllAnswersCorrect(count) {
    return (io.engine.clientsCount - 1) == count

}

function setHighscore(user) {

    let doc = fs.readFileSync( process.cwd()+ '/server/db.json' )
    let docData = JSON.parse(doc);

    docData.highscore.name = user.username
    docData.highscore.score = user.point

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

function setPoint(user){
    if(time >= 25) user.point += 3; //hardcoded :(
    else if(time >= 20) user.point += 2;
    else user.point += 1;
}

function setDrawerPoint(drawerUser){
    drawerUser.point+=4;
    console.log("235" + drawerUser);
}

function getHighScoreInfo(){
      let doc = fs.readFileSync( process.cwd()+ '/server/db.json' )
      let docData = JSON.parse(doc);
      str = "Highscore: " + docData.highscore.name + " -> " + docData.highscore.score
      return str
}



http.listen(5000, () => console.log('listening on port 5000'));