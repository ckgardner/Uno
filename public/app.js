/*jshint esversion: 6 */

var app = new Vue({
    el: '#app',
    data: {
        socket: null, //This is a reference to the above socket variable
        messageToSend: "",
        newSenderName: "",
        senderName: "",
        incomingMessages: [],
        newUsername: "",
        classActive: true,

        you: "",
        yourTurn: false,
        onlyPlayer: true,
        currentPage: 'home',
        colors: ["red", "green", "blue", "yellow"],
        values: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        otherValues: ["+2", "S"],
        deck: [],
        myCards: [],
        lastCard: "",
        players: [],
        currentTurn: "",
        winner: "",
        gameOver: false,
        gameStart: false,
    },
    methods: {
        // heartbeat: function(){
        //     clearTimeout(this.pingTimeout);
        //     this.pingTimeout = setTimeout(()=>{
        //         this.terminate();
        //     }, 30000 + 1000);
        // },
        sendMessage: function(){
            var data = {
                name: this.senderName,
                message: "says " + this.messageToSend,
                action: "chat",
            };
            console.log("message to send", this.messageToSend);
            this.socket.send(JSON.stringify(data));
        },
        connectSocket: function(){
            this.socket = new WebSocket("wss://ancient-sierra-38701.herokuapp.com/");
            // this.socket.on('open', heartbeat());
            // this.socket.on('ping', heartbeat());
            // this.socket.on('close', function clear() {
            //     clearTimeout(this.pingTimeout);
            // });
            this.socket.onmessage = (event) =>{
                var data = JSON.parse(event.data);
                console.log('received on client:', data);

                if (data.action && data.action == "initialize"){
                    this.players = data.players;
                    this.gameStart = data.currentStatus;
                    this.currentPage = "main";
                    if(!this.gameStart){
                        this.currentPage = "waiting";
                    }
                    this.currentTurn = this.players[0];
                    if (this.currentTurn == this.you){
                        this.yourTurn = true;
                    }
                    this.lastCard = data.startCard;
                    console.log("players: ", data);
                }

                if (data.action && data.action == "chat" || data.action == "drawCard"){
                    this.incomingMessages.push(data);
                }

                if (data.action && data.action == "playCard"){
                    this.incomingMessages.push();
                    this.lastCard = {Color: data.color, Value: data.value};
                    this.currentTurn = data.currentTurn;
                    if (this.currentTurn == this.you){
                        this.yourTurn = true;
                    }else{
                        this.yourTurn = false;
                    }
                    if (data.won != ""){
                        this.winner = data.won;
                        this.gameOver = true;
                    }
                }
            };
            
            this.socket.onopen = () =>{
            };
        },
        newUserAdd: function(){
            this.senderName = this.newSenderName;
            this.you = this.newSenderName;
            var data = {
                name: this.senderName,
                action: "addNew",
                startCard: this.lastCard,
            };
            console.log("message to send", this.messageToSend);
            this.socket.send(JSON.stringify(data));

            this.newSenderName = "";
            this.currentPage = "main";
        },

        createDeck: function(){
            for (var y = 0; y < 2; y++){
                for (var i = 0; i < this.colors.length; i ++){
                    for(var x = 0; x < this.values.length; x++){
                        var card = {Color: this.colors[i], Value: this.values[x]};
                        this.deck.push(card);
                    }
                    for(var z = 0; z < this.otherValues.length; z++){
                        var card2 = {Color: this.colors[i], Value: this.otherValues[z]};
                        this.deck.push(card2);
                    }
                }
            }
            console.log(this.deck);
        },
        deal: function(){
            for (var i = 0; i < 7; i++){
                random = Math.floor(Math.random() * this.deck.length - 1);
                let card = this.deck[random];
                this.myCards.push(card);
                this.lastCard = this.deck[random];
            }
            
        },
        getClass: function(card){
            var result = [];
            console.log(card);
            if (card.Color == "red"){
                result.push('red');
            }else if (card.Color == "green"){
                result.push('green');
            }else if (card.Color == "blue"){
                result.push('blue');
            }else if(card.Color == "yellow"){
                result.push('yellow');
            }
            console.log(result);
            return result;
        },
        playCard: function(card){
            if (card.Color != this.lastCard.Color && card.Value != this.lastCard.Value){
                console.log("Can't Play card because", card, "!=", this.lastCard);
                return;
            }
            this.lastCard = card;
            console.log(card);
            var i = this.myCards.indexOf(card);
            this.myCards.splice(i, 1);
            console.log("new last card ", this.lastCard);
            var data = {
                name: this.senderName,
                message: "plays " + card.Color + " " + card.Value,
                action: "playCard",
                color: card.Color,
                value: card.Value,
                currentTurn: this.currentTurn,
                cardCount: this.myCards.length,
            };
            console.log("message to send", data);
            this.socket.send(JSON.stringify(data));
            this.yourTurn = false;
        },
        pickUpCard: function(){
            random = Math.floor(Math.random() * this.deck.length - 1);
            let card = this.deck[random];
            this.myCards.push(card);
            console.log("card picked up: ", card);
            var data = {
                name: this.senderName,
                message: "draws a card",
                action: "drawCard",
            };
            console.log("message to send", data);
            this.socket.send(JSON.stringify(data));
        },
    },
    created: function(){
            console.log("Vue created!");
            this.connectSocket();
            this.createDeck();
            this.deal();
        }
});