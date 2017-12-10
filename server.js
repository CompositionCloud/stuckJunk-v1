/*jslint es6, node, this*/

const path = require("path");

function createServer() {
    "use strict";
    
    const express = require("express");
    const socketIO = require("socket.io");

    const server = express();

    server.use(express.static("static"));

    server.get("/", function (req, res) {
        res.sendFile(path.join(__dirname, "/static/html/stuckJunk-v1-game.html"));
    });

    server.get("/log_reader", function (req, res) {
        res.sendFile(path.join(__dirname, "/static/html/stuckJunk-v1-log_reader.html"));
    });
    
    return socketIO(server.listen(3000));
}

const io = createServer();

const sJv1board = require(path.join(__dirname, "/static/js/stuckJunk-v1-board.js"));
const sJv1players = require(path.join(__dirname, "/static/js/stuckJunk-v1-players.js"));

const COLOR_TO_INDEX = {
    red: 0,
    green: 1,
    blue: 2,
    orange: 3,
    magenta: 4,
    cyan: 5
};

let game = {
    state: "undefined",
    init: function init(number_of_players) {
        "use strict";
        
        this.state = "being filled";
        this.board = sJv1board.sJv1board();
        this.players = sJv1players.sJv1players();
        this.number_of_players = number_of_players;
        this.number_of_players_who_started_playing = 0;
        this.stuck_junk_flag = false;
        this.show_the_end = false;
        this.clock = {
            master: 0,
            t0: 0
        };
        this.log = ["stucJunk-v1-log" + "\n\n", ""];
    },
    numberOfActivePlayers: function numberOfActivePlayers() {
        "use strict";

        let count = 0;

        this.players.forEach(function countActive(player) {
            if (player.active) {
                count += 1;
            }
        });

        return count;
    },
    isColorTaken: function isColorTaken(color) {
        "use strict";

        return this.players.some(function (player, index) {
            return (player.active && index === COLOR_TO_INDEX[color]);
        });
    }
};

let number_of_clients = 0;

const fs = require("fs");

function saveLog(log) {
    "use strict";
    
    let d = new Date();
    let filename = d.getTime() + ".txt";
    
    fs.writeFile(path.join(__dirname, "/logs/" + filename), log, function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("new file: " + filename);
        }
    });
}

io.on("connection", function connection(socket) {
    "use strict";
    
    let this_player = "undefined";
    
    number_of_clients += 1;
        
    socket.on("start", function start() {
        if (game.state === "undefined") {
            game.state = "being created";
            socket.emit("create game");
        } else if (game.state === "being created") {
            socket.emit("wait for game");
        } else if (game.state === "being filled") {
            socket.emit("create player");
        } else if (game.state === "ready" || game.state === "on") {
            this_player = "monitor";
            
            socket.emit("init monitor", game.number_of_players);
            socket.emit("init board", game.board.getInstructions(), game.board.getStuckJunk());
        }
        
        if (game.state === "on") {
            socket.emit("start monitoring", game.clock.master);
        }
    });
    
    socket.on("create game", function createGame(number_of_players) {
        game.init(number_of_players);
        
        io.emit("create player");
    });
    
    socket.on("check player", function checkPlayer(player) {
        if (player === "monitor") {
            this_player = "monitor";
            
            // sending the last argument as true will prevent the client from showing an alert saying that the game is full
            socket.emit("init monitor", game.number_of_players, true);
        } else {
            if (game.numberOfActivePlayers() === game.number_of_players) {
                this_player = "monitor";
            
                socket.emit("init monitor", game.number_of_players);
            } else if (game.isColorTaken(player.color)) {

                // sending the last argument as true will make the client show an alert saying that the color is taken
                socket.emit("create player", true);
            } else {
                player.color = COLOR_TO_INDEX[player.color];
                
                this_player = player.color;
                                
                socket.emit("confirm player", player, game.number_of_players);
            }
        }
    });
    
    socket.on("update player", function updatePlayer(player, timestamp) {
        if ((game.players[player.color].current_rect !== player.current_rect || game.players[player.color].next_rect !== player.next_rect) && timestamp > 0) {
            if (player.current_rect !== 24) {
                game.log[1] += player.color + ": " + player.current_rect + "," + player.next_rect + "," + player.adjacent_rects + " at " + timestamp + "\n";
            } else {
                game.log[1] += player.color + ": " + player.current_rect + " at " + timestamp + "\n";
            }
        }
        
        game.players[player.color] = player;
        
        if (timestamp > game.clock.master) {
            game.clock.master = timestamp;
        }
        
        io.emit("update player", player);
        
        if (game.state === "being filled") {
            if (game.numberOfActivePlayers() === game.number_of_players) {
                io.emit("init board", game.board.newInstructions(game.players, game.number_of_players), game.board.getStuckJunk());
                                
                game.state = "ready";
            }
        } else if (game.state !== "undefined") {
            // objective #1
            if (!game.stuck_junk_flag && !game.players.some(function isThereSomeoneWhoIsStillLookingForTheStuckJunk(player) {
                return player.active && (player.objective === 0);
            })) {
                game.stuck_junk_flag = true;
                
                io.emit("the stuckJunk was found");
            }
            
            // objective #2
            if (game.stuck_junk_flag && !game.show_the_end && !game.players.some(function isThereSomeoneWhoIsNotTheStuckJunk(player) {
                return player.active && (player.current_rect !== game.board.getStuckJunk());
            })) {
                game.players.forEach(function changeObjective(player) {
                    if (player.active) {
                        player.objective = 2;
                    }
                });
                
                game.show_the_end = true;
                
                io.emit("everyone is stuckJunk");
            }
            
            // objective #3
            if (!game.players.some(function isThereSomeoneWhoDidNotReachTheEnd(player) {
                return player.active && (player.objective !== 3);
            })) {
                game.state = "undefined";
                
                game.log[1] += "\n" + "THE END";
                
                saveLog(game.log[0] + game.log[1]);
                
                io.emit("game over");
            }
        }
    });
    
    socket.on("start game", function startGame(this_player) {
        let d = new Date();
        
        if (game.state === "ready") {
            game.state = "on";
            game.clock.t0 = d.getTime();
            
            game.log[0] += this_player + ": " + game.players[this_player].current_rect + "," + game.players[this_player].next_rect + "," + game.players[this_player].adjacent_rects + " at 0" + "\n";
            
            io.emit("start monitoring", 0);
        } else {
            game.players[this_player].offset = d.getTime() - game.clock.t0;
            game.log[0] += this_player + ": " + game.players[this_player].current_rect + "," + game.players[this_player].next_rect + "," + game.players[this_player].adjacent_rects + " at " + game.players[this_player].offset + "\n";
        }
        
        game.number_of_players_who_started_playing += 1;
        
        if (game.number_of_players_who_started_playing === game.number_of_players) {
            game.log[0] += "\n" + "initializing game" + "\n";
            game.board.getInstructions().forEach(function formatInstruction(instruction, index) {
                game.log[0] += index + ": " + instruction + "\n";
            });
            game.log[0] += "\n";
        }
    });
    
    socket.on("game aborted", function gameAborted() {
        game.state = "undefined";
                
        game.players = sJv1players.sJv1players();
        
        io.emit("game aborted");
    });
        
    socket.on("player aborted", function playerAborted() {
        socket.emit("player aborted");
    });
    
    socket.on("disconnect", function disconnect() {
        if (this_player >= 0 && this_player <= 5) {
            game.players[this_player].active = false;
        }
        
        number_of_clients -= 1;
        
        if (number_of_clients === 0) {
            game.state = "undefined";

            game.players = sJv1players.sJv1players();
        }
    });
});