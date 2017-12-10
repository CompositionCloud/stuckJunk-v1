/*global window, sJv1board, sJv1players, sJv1GUI*/

/*jslint es6, this*/

function sJv1logReader() {
    "use strict";
    
    let log = "";
    let log_index = 0;
    let GUI = sJv1GUI();
    let game = {
        init: function init() {
            this.state = "undefined";
            this.board = sJv1board();
            this.players = sJv1players();
            this.this_player = "monitor";
            this.number_of_players = 0;
            this.stuck_junk_flag = false;
            this.show_the_end = false;
            this.clock = {
                master: 0,
                delta: 0,
                t0: 0
            };
        }
    };
    
    function loop(t) {
        game.clock.delta = t - game.clock.t0;
        game.clock.t0 = t;
        
        if (game.state === "on") {
            game.clock.master += game.clock.delta;
            
            game.players.forEach(function updateRectClocks(player) {
                if (player.active && player.current_rect !== 24 && game.clock.master > player.offset) {
                    player.rect_clock -= game.clock.delta;
                    player.rect_clock = Math.max(player.rect_clock, 0);
                }
            });
                                    
            let i = parseInt(log[log_index][0][0]);
            
            if (game.clock.master >= parseInt(log[log_index][3]) + game.players[i].offset) {
                if (game.players[i].current_rect !== parseInt(log[log_index][1][0])) {
                    game.players[i].current_rect = parseInt(log[log_index][1][0]);
                    game.players[i].rect_clock = game.board.getRect(game.players[i].current_rect).duration;
                }
                
                game.players[i].next_rect = parseInt(log[log_index][1][1]);
                
                game.players[i].adjacent_rects = [
                    parseInt(log[log_index][1][2]), parseInt(log[log_index][1][3]), parseInt(log[log_index][1][4])
                ];
                
                // objective #1
                if (game.players[i].objective === 0) {
                    if (game.players[i].adjacent_rects.some(function isStuckJunk(adjacent_rect) {
                        return adjacent_rect === game.board.getStuckJunk();
                    })) {
                        game.players[i].objective = 1;
                    }
                    
                    if (!game.players.some(function isThereSomeoneWhoIsStillLookingForTheStuckJunk(player) {
                        return player.active && (player.objective === 0);
                    })) {
                        game.stuck_junk_flag = true;
                    }
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
                }
                                
                // objective #3
                if (game.players[i].objective === 2 && game.players[i].current_rect === 24) {
                    game.players[i].objective = 3;
                }
                
                log_index += 1;
                
                if (log[log_index + 1] !== "THE END") {
                    log[log_index] = log[log_index].split(" ");
                    log[log_index][1] = log[log_index][1].split(",");
                } else {
                    game.state = "the end";
                    
                }
            }
        }
        
        GUI.draw(game);
                
        window.requestAnimationFrame(loop);
    }
        
    function load() {
        GUI.init();
        
        document.getElementById("clock").innerHTML = "drag and drop a stuckJunk-v1 log file";
        
        document.body.ondragenter = function ondragenter(e) {
            e.stopPropagation();
            e.preventDefault();
        };
        
        document.body.ondragover = function ondragover(e) {
            e.stopPropagation();
            e.preventDefault();
        };

        document.body.ondrop = function ondrop(e) {
            e.stopPropagation();
            e.preventDefault();

            let reader = new FileReader();
            
            reader.readAsText(e.dataTransfer.files[0]);
            reader.onloadend = function read(e) {
                let tmp_log = e.target.result.split("\n");

                if (tmp_log[0] !== "stuckJunk-v1-log") {
                    window.alert("Invalid File!");
                    return;
                }
                
                log = tmp_log;
                
                game.init();
                
                log.some(function initLog(line, index) {
                    if (index > 1) {
                        if (line === "initializing game") {
                            game.number_of_players = index - 3;
                            
                            game.board.copyFromLog(log, index + 1);
                            
                            log_index = index + 26;
                            
                            return true;
                        }
                        if (line !== "initializing game") {
                            if (line) {
                                line = line.split(" ");
                                line[1] = line[1].split(",");

                                let j = parseInt(line[0][0]);

                                game.players[j].active = true;
                                game.players[j].current_rect = parseInt(line[1][0]);
                                game.players[j].next_rect = parseInt(line[1][1]);
                                game.players[j].adjacent_rects =
                                        [parseInt(line[1][2]), parseInt(line[1][3]), parseInt(line[1][4])];
                                game.players[j].rect_clock = game.board.getRect(game.players[j].current_rect).duration;
                                game.players[j].objective = 0;
                                game.players[j].offset = parseInt(line[3]);
                            }
                        }
                    }
                    
                    return false;
                });
                                
                log[log_index] = log[log_index].split(" ");
                log[log_index][1] = log[log_index][1].split(",");
                
                game.players.forEach(function (player) {
                    if (player.active) {
                        player.didPlayerFindTheStuckJunk(game.board);
                    }
                });
                
                game.state = "ready";
                
                window.requestAnimationFrame(loop);
            };
        };
    }
    
    function interact(e) {
        let player_index = [];
        
        player_index[82] = 0;
        player_index[71] = 1;
        player_index[66] = 2;
        player_index[79] = 3;
        player_index[67] = 4;
        player_index[77] = 5;

        if (e.keyCode === 86) {
            game.this_player = "monitor";
        } else if ((e.keyCode === 82 || e.keyCode === 71 || e.keyCode === 66 || e.keyCode === 79 || e.keyCode === 67 || e.keyCode === 77) && game.players[player_index[e.keyCode]].active) {
            game.this_player = player_index[e.keyCode];
        }
        
        if (game.state === "ready" && e.keyCode >= 49 && e.keyCode <= 51) {
            game.state = "on";
        }
        
        if (e.keyCode === 72) {
            if (document.body.style.cursor === "none") {
                document.body.style.cursor = "auto";
            } else {
                document.body.style.cursor = "none";
            }
        }
    }
    
    return {
        load: load,
        interact: interact
    };
}