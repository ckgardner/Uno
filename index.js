/*jshint esversion: 6 */

//EXPRESS SERVER CODE BELOW

const express = require('express');

var app = express();
app.set('port', (process.env.PORT || 8080));

app.use(express.static('public'));

// Optional http requests
// app.get('players', function(req, res){
// });

var server = app.listen(app.get('port'), function(){
    console.log("Server listening...");
});

// WEBSOCKET SERVER CODE BELOW

const WebSocket = require('ws');

const wss = new WebSocket.Server({ server: server });

// function noop() {}

// function heartbeat() {
//   this.isAlive = true;
// }

var clients = [];

wss.on('connection', function (wsclient) {

    // wsclient.isAlive = true;
    // wsclient.on('pong', heartbeat);

    // const interval = setInterval(function ping() {
    //   wss.clients.forEach(function each(wsclient) {
    //     if (wsclient.isAlive === false) return wsclient.terminate();
    
    //     ws.isAlive = false;
    //     ws.ping(noop);
    //   });
    // }, 30000);

    // Figure out what to do if clients log off. Rewatch his video.

    // Start with 2 players first
    wsclient.on('message', function (message) {

        var data = JSON.parse(message);

        console.log('received on server:', data);

        if (data.action && data.action == "addNew"){
          clients.push(data.name);
          console.log("Clients in game: ", clients);
          var status = false;
          if (clients.length >= 2){
            status = true;
          }
          var initializeData = {
            players: clients,
            action: "initialize",
            currentStatus: status,
            startCard: data.startCard,
          };
          wss.clients.forEach(function(oneClient){
            oneClient.send(JSON.stringify(initializeData));
          });
        }

        if (data.action && data.action == "chat" || "drawCard"){
          //BROADCAST from server to all clients
          wss.clients.forEach(function(oneClient){
            oneClient.send(JSON.stringify(data));
          });
        }
        if (data.action && data.action == "playCard"){
          let cardCount = data.cardCount;
          var winner = "";
          if (cardCount < 0){
            winner = data.name;
          }
          var nextTurn = "";
          
          if (data.value == "S"){
            for (i = 0; i < clients.length; i++){
              if (data.currentTurn == clients[i]){
                if (i+2 < clients.length){
                  nextTurn = clients[i+2]; 
                }
                else if (i+1 < clients.length){
                  nextTurn = clients[0];
                  console.log("1. next player will be: ", nextTurn);
                }else{
                  nextTurn = clients[1];
                  console.log("2. next player will be: ", nextTurn);
                }
              }
            }
          }else{
            for (i = 0; i < clients.length; i++){
              if (data.currentTurn == clients[i]){
                console.log(data.currentTurn, "compared to", clients[i]);
                if (i+1 < clients.length){
                  nextTurn = clients[i+1];
                  console.log("1. next player will be: ", nextTurn);
                }else{
                  nextTurn = clients[0];
                  console.log("2. next player will be: ", nextTurn);
                }
              }
            }
          }
          var serverData = {
            action: "playCard",
            name: data.name,
            message: data.message,
            color: data.color,
            value: data.value,
            currentTurn: nextTurn,
            won: winner,
          };
          wss.clients.forEach(function(oneClient){
            oneClient.send(JSON.stringify(serverData));
          });
          // Make sure the player draws 2 cards
        }
  });
});

// wss.on('close', function close() {
//   clearInterval(interval);
// });