/*global window, sJv1board, sJv1players, sJv1GUI*/

/*jslint es6, this*/

function sJv1client(socket) {
    "use strict";
    
    let game = {
        state: "undefined",
        init: function init(number_of_players) {
            this.state = "being filled";
            this.board = sJv1board();
            this.players = sJv1players();
            this.this_player = -1; // 0-5: red, green, blue, orange, magenta, cyan
            this.number_of_players = number_of_players;
            this.stuck_junk_flag = false;
            this.show_the_end = false;
            this.clock = {
                master: 0,
                delta: 0,
                t0: 0
            };
        }
    };
    
    let GUI = sJv1GUI();
    let GUI_init_flag = false;
    let Kostas = false; // "Kostas" mode of interaction
    
    let audio = [
        0,
        new Audio("audio/stuckJunk-1.mp3"),
        new Audio("audio/stuckJunk-2.mp3"),
        new Audio("audio/stuckJunk-3.mp3"),
        new Audio("audio/stuckJunk-4.mp3"),
        new Audio("audio/stuckJunk-5.mp3"),
        new Audio("audio/stuckJunk-6.mp3"),
        new Audio("audio/stuckJunk-7.mp3"),
        new Audio("audio/stuckJunk-8.mp3"),
        new Audio("audio/stuckJunk-9.mp3"),
        new Audio("audio/stuckJunk-10.mp3"),
        0,
        new Audio("audio/stuckJunk-12.mp3"),
        0,
        new Audio("audio/stuckJunk-14.mp3"),
        new Audio("audio/stuckJunk-15.mp3"),
        new Audio("audio/stuckJunk-16.mp3"),
        new Audio("audio/stuckJunk-17.mp3"),
        new Audio("audio/stuckJunk-18.mp3"),
        new Audio("audio/stuckJunk-19.mp3"),
        new Audio("audio/stuckJunk-20.mp3"),
        new Audio("audio/stuckJunk-21.mp3"),
        new Audio("audio/stuckJunk-22.mp3"),
        0,
        0
    ];
    
    function loop(t) {
        game.clock.delta = t - game.clock.t0;
        game.clock.t0 = t;
        
        if (game.state === "on" && game.this_player !== "monitor") {
            if (game.players[game.this_player].active && game.players[game.this_player].current_rect !== 24) {
                game.players[game.this_player].rect_clock -= game.clock.delta;
                game.players[game.this_player].rect_clock = Math.max(game.players[game.this_player].rect_clock, 0);
                
                if (game.players[game.this_player].rect_clock === 0) {
                    game.players[game.this_player].changeCurrentRect(game.players[game.this_player].next_rect, game.board, game.show_the_end);
                    if (audio[game.players[game.this_player].current_rect] !== 0) {
                        audio[game.players[game.this_player].current_rect].play();
                    }
                }
            }
        }
        
        if (game.state === "on") {
            game.clock.master += game.clock.delta;
        }
                
        if (game.state !== "undefined") {
            if (game.this_player !== "monitor") {
                socket.emit("update player", game.players[game.this_player], game.clock.master);
            }
            
            GUI.draw(game);
            
            window.requestAnimationFrame(loop);
        }
    }
    
    function createGame() {
        let result;
        let condition;
        
        do {
            result = window.prompt(
                "*** CREATE A GAME ***" + "\n\n" + "Type the number of players that will play the game. The minimum is two; the maximum is six." + "\n\n" + "For example, to create a two-player game, type \"2\".",
                "2"
            );

            if (result !== null) {
                result = parseInt(result);

                if (result >= 2 && result <= 6) {
                    condition = true;
                } else {
                    condition = false;
                }
            } else {
                break;
            }
        } while (!condition);

        if (result !== null) {
            socket.emit("create game", result);
        } else {
            socket.emit("game aborted");
        }
    }
        
    function createPlayer(alert) {
        if (alert) {
            window.alert("The color you chose is already taken. Please try again.");
        }
        
        let result;
        let condition;
        
        let player = {
            color: "",
            rect: -1
        };

        do {
            result = window.prompt(
                "*** NEW PLAYER ***" + "\n\n" + "Type your player's color, a comma, and the numerical index of the rectangle from which you would like to start. Possible colors are red, green, blue, orange, magenta, and cyan; the indexes of the rectangles range from 00 to 23. For example, to create a red player starting from the top-left rectangle, type \"red,00\"." + "\n\n" + "Type \"monitor\" if you only want to monitor the game.",
                "red,00"
            );

            if (result !== null) {
                result = result.split(",");

                if (result.length === 2 && (result[0] === "red" || result[0] === "green" || result[0] === "blue" || result[0] === "orange" || result[0] === "magenta" || result[0] === "cyan")) {
                    result[1] = parseInt(result[1]);

                    if (result[1] >= 0 && result[1] <= 23) {
                        player.color = result[0];
                        player.rect = result[1];
                        condition = true;
                    } else {
                        condition = false;
                    }
                } else if (result[0] === "monitor") {
                    player = result[0];
                    condition = true;
                } else {
                    condition = false;
                }
            } else {
                break;
            }
        } while (!condition);

        if (result !== null) {
            socket.emit("check player", player);
        } else {
            socket.emit("player aborted");
        }
    }
        
    function confirmPlayer(player, number_of_players) {
        GUI_init_flag = GUI.init(GUI_init_flag);
        
        game.init(number_of_players);
        
        game.this_player = player.color;
        
        game.players[game.this_player].active = true;
        game.players[game.this_player].changeCurrentRect(player.rect, game.board, false, socket);
    
        window.requestAnimationFrame(loop);
    }
    
    function updatePlayer(player) {
        if (game.state !== "undefined") {
            if (game.this_player === "monitor") {
                game.players[player.color] = player;
            } else if (game.this_player !== player.color) {
                game.players[player.color].active = true;
                game.players[player.color].current_rect = player.current_rect;
                game.players[player.color].objective = player.objective;
            }
        }
    }
    
    function initMonitor(number_of_players, no_alert) {
        if (!no_alert) {
            window.alert("The game is full. You can only monitor.");
        }

        GUI_init_flag = GUI.init(GUI_init_flag);
        
        game.init(number_of_players);

        game.this_player = "monitor";
        
        window.requestAnimationFrame(loop);
    }
    
    function initBoard(instructions, sJ_index) {
        game.board.copyFromArray(instructions, sJ_index);
        
        game.players.forEach(function aslIfPlayerFoundTheStuckJunk(player) {
            player.didPlayerFindTheStuckJunk(game.board);
        });
        
        game.state = "ready";
    }
    
    
    function startMonitoring(clock) {
        if (game.this_player === "monitor") {
            game.state = "on";
            game.clock.master = clock;
        }
    }
    
    function theStuckJunkWasFound() {
        game.stuck_junk_flag = true;
    }
    
    function everyoneIsStuckJunk() {
        if (game.this_player !== "monitor") {
            game.players[game.this_player].objective = 2;
        }
        
        game.show_the_end = true;
    }
    
    function gameOver() {
        GUI.draw(game);
        
        game.state = "undefined";
        
        document.getElementById("clock").innerHTML = "-- THE END --";
    }
        
    function waitForGame() {
        GUI_init_flag = GUI.init(GUI_init_flag);
        
        document.getElementById("clock").innerHTML = "waiting for a game to be created";
    }
    
    function gameAborted() {
        GUI_init_flag = GUI.init(GUI_init_flag);
        
        if (game.this_player >= 0 && game.this_player <= 5 && game.players[game.this_player].current_rect !== -1 && audio[game.players[game.this_player].current_rect] !== 0) {
            audio[game.players[game.this_player].current_rect].pause();
        }
                
        game.state = "undefined";
        
        document.getElementById("clock").innerHTML = "please refresh";
    }
    
    function playerAborted() {
        GUI_init_flag = GUI.init(GUI_init_flag);
        
        game.state = "undefined";
        
        document.getElementById("clock").innerHTML = "please refresh";
    }
    
    function interact(e) {
        if (game.state === "ready" && game.this_player !== "monitor") {
            if (e.keyCode >= 49 && e.keyCode <= 51) {
                game.state = "on";
                
                if (audio[game.players[game.this_player].current_rect] !== 0) {
                    audio[game.players[game.this_player].current_rect].play();
                }
                
                socket.emit("start game", game.this_player);
            }
        } else if (game.state === "on" && game.this_player !== "monitor") {
            if (e.keyCode >= 49 && e.keyCode <= 51) {
                game.players[game.this_player].changeNextRect(Kostas, e.keyCode);
            }
        }
        
        if (e.keyCode === 65) {
            game.state = "undefined";
            socket.emit("game aborted");
        }
        
        if (e.keyCode === 67) {
            if (document.body.style.cursor === "none") {
                document.body.style.cursor = "auto";
            } else {
                document.body.style.cursor = "none";
            }
        }
        
        if (e.keyCode === 75) {
            Kostas = !Kostas;
        }
    }
    
    return {
        createGame: createGame,
        initBoard: initBoard,
        createPlayer: createPlayer,
        confirmPlayer: confirmPlayer,
        updatePlayer: updatePlayer,
        theStuckJunkWasFound: theStuckJunkWasFound,
        everyoneIsStuckJunk: everyoneIsStuckJunk,
        gameOver: gameOver,
        initMonitor: initMonitor,
        startMonitoring: startMonitoring,
        waitForGame: waitForGame,
        gameAborted: gameAborted,
        playerAborted: playerAborted,
        interact: interact
    };
}

