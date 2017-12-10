/*jslint es6, for*/

function sJv1GUI() {
    "use strict";
    
    let board;
    let board_ctx;
    let clock;
    let objectives;
    let objectives_div;
    let abbreviations;
    let abbreviations_div;
    
    const COLOR = [
        ["rgba(255, 0, 0, 1)", "rgba(255, 0, 0, 0.1)"],
        ["rgba(0, 255, 0, 1)", "rgba(0, 255, 0, 0.1)"],
        ["rgba(0, 0, 255, 1)", "rgba(0, 0, 255, 0.1)"],
        ["rgba(255, 127, 0, 1)", "rgba(255, 127, 0, 0.1)"],
        ["rgba(255, 0, 255, 1)", "rgba(255, 0, 255, 0.1)"],
        ["rgba(0, 255, 255, 1)", "rgba(0, 255, 255, 0.1)"]
    ];
    
    function init(flag) {
        if (!flag) {
            document.body.innerHTML =
                    "<div class='main'>" +
                    "    <div class='item board' id='board-div'>" +
                    "        <canvas id='board' width = '974' height='750' />" +
                    "    </div>" +
                    "    <div class='item info'>" +
                    "        <div class='clock-div'>" +
                    "            <span class='clock' id='clock' />" +
                    "        </div>" +
                    "        <div class='info-main'>" +
                    "            <div class='info-item' id='objectives-div'>" +
                    "                <span class='objectives' id='objectives' />" +
                    "            </div>" +
                    "            <div class='info-item' id='abbreviations-div'>" +
                    "                <span class='abbreviations' id='abbreviations' />" +
                    "            </div>" +
                    "        </div>" +
                    "    </div>" +
                    "</div>";
            
            board = document.getElementById("board");
            clock = document.getElementById("clock");
            objectives = document.getElementById("objectives");
            objectives_div = document.getElementById("objectives-div");
            abbreviations = document.getElementById("abbreviations");
            abbreviations_div = document.getElementById("abbreviations-div");

            board_ctx = board.getContext("2d");
        }
        
        return true;
    }
    
    function draw(game) {
        board_ctx.clearRect(0, 0, board.width, board.height);
        
        board_ctx.fillStyle = "white";
        board_ctx.strokeStyle = "black";
        board_ctx.lineWidth = 1;
        
        let i;
        let j;
        let rect;
        
        for (i = 0; i < 5; i += 1) {
            for (j = 0; j < 5; j += 1) {
                rect = game.board.getRect(i, j);
                
                if (!(i === 4 && j === 4)) {
                    board_ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
                    board_ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
                } else if (game.show_the_end) {
                    board_ctx.textAlign = "center";
                    board_ctx.font = "48px monospace";
                    board_ctx.fillStyle = "black";
                    board_ctx.fillText("THE", rect.x + rect.width / 2 + 1, rect.y + rect.height / 2 - 5);
                    board_ctx.fillText("END", rect.x + rect.width / 2 + 1, rect.y + rect.height / 2 + 35);
                }
            }
        }
        
        function drawRectClock(clock, rect, color, offset) {
            if (offset === undefined) {
                offset = 0;
            }
            
            let fill_style = board_ctx.fillStyle;
            
            board_ctx.fillStyle = color;
            board_ctx.font = "12px monospace";
            board_ctx.textAlign = "right";
            
            clock /= 1000;
            
            board_ctx.fillText(clock.toFixed(1), rect.x + rect.width - 3, rect.y + 14 + offset);
            
            board_ctx.fillStyle = fill_style;
        }
        
        function drawRectInstruction(rect, color) {
            let fill_style = board_ctx.fillStyle;
            
            board_ctx.fillStyle = color;
            board_ctx.font = "20px monospace";
            board_ctx.textAlign = "center";
            
            board_ctx.fillText(rect.instruction, rect.x + rect.width / 2, rect.y + rect.height / 2 + 5);
            
            board_ctx.fillStyle = fill_style;
        }
        
        function fillAdjacentRect(adjacent_rect) {
            rect = game.board.getRect(adjacent_rect);
            
            board_ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
            
            if (game.state !== "undefined" && game.state !== "being filled") {
                let draw_clock_instr = true;
                
                if (game.this_player === "monitor") {
                    game.players.some(function willClockAndInstructionBeDrawnLater(player) {
                        if (adjacent_rect === player.current_rect || adjacent_rect === player.next_rect) {
                            draw_clock_instr = false;
                            return true;
                        }
                    });
                }

                if (draw_clock_instr && adjacent_rect !== 24) {
                    drawRectClock(rect.duration, rect, "black");
                    drawRectInstruction(rect, "black");
                }
            }
        }
        
        if (game.this_player === "monitor") {
            game.players.forEach(function checkIfAdjacentRectsAreToBeFilled(player, index) {
                if (player.active && player.current_rect !== 24) {
                    board_ctx.fillStyle = COLOR[index][1];

                    player.adjacent_rects.forEach(fillAdjacentRect);
                }
            });
        } else {
            board_ctx.fillStyle = COLOR[game.this_player][1];
            
            game.players[game.this_player].adjacent_rects.forEach(fillAdjacentRect);
        }
                
        let rects = [];
        
        function fillRectsArray(player, which_rect) {
            let which_rect_index =
                    (which_rect === "current_rect")
                ? 1
                : 2;
            
            for (j = 0; j < rects.length; j += 1) {
                if (player[which_rect] === rects[j][0]) {
                    rects[j][which_rect_index].push(player.color);
                    break;
                }
            }

            if (j === rects.length) {
                let new_rect = [player[which_rect], [], []];
                new_rect[which_rect_index] = [player.color];
                rects.push(new_rect);
            }
        }
        
        let k = 0;
        
        if (game.this_player !== "monitor") {
            k = game.this_player;
        }

        for (i = 0; i < 6; i += 1) {
            if (game.players[(i + k) % 6].active) {
                fillRectsArray(game.players[(i + k) % 6], "current_rect");
            }
        }
        
        if (game.this_player !== "monitor") {
            fillRectsArray(game.players[game.this_player], "next_rect");
        } else {
            for (i = 0; i < 6; i += 1) {
                if (game.players[i].active) {
                    fillRectsArray(game.players[i], "next_rect");
                }
            }
        }

        board_ctx.lineWidth = 3;
        
        let draw_the_end_rect = false;
        
        if (game.show_the_end) {
            draw_the_end_rect = true;
        }
        
        rects.forEach(function drawRects(each_rect) {
            rect = game.board.getRect(each_rect[0]);
            
            if (each_rect[0] === 24) {
                draw_the_end_rect = false;
            }
            
            each_rect[1].forEach(function drawCurrentRects(player_color, index) {
                board_ctx.strokeStyle = COLOR[player_color][0];

                board_ctx.strokeRect(rect.x - 5 * index, rect.y - 5 * index, rect.width + 10 * index, rect.height + 10 * index);

                if (game.state !== "undefined" && game.state !== "being filled" && each_rect[0] !== 24 && (game.this_player === "monitor" || game.this_player === player_color)) {
                    drawRectClock(game.players[player_color].rect_clock, rect, COLOR[player_color][0], 10 * index);
                    
                    if (index === 0) {
                        let color;
                        

                        if (each_rect[1].length > 1 && (game.this_player === "monitor")) {
                            let width;
                            
                            board_ctx.font = "20px monospace";
                            
                            width = board_ctx.measureText(rect.instruction).width;
                            
                            color = board_ctx.createLinearGradient(rect.x + rect.width / 2 - width / 2, 0, rect.x + rect.width / 2 + width / 2, 0);
                            
                            each_rect[1].forEach(function addColorStop(player_color, index) {
                                color.addColorStop(index / (each_rect[1].length - 1), COLOR[player_color][0]);
                            });
                        } else {
                            color = COLOR[player_color][0];
                        }
                        drawRectInstruction(rect, color);
                    }
                }
            });

            each_rect[2].forEach(function drawNextRects(player_color, index) {
                if (each_rect[0] !== 24 && index === 0 && each_rect[1].length === 0) {
                    board_ctx.strokeStyle = "white";
                    board_ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
                }

                board_ctx.strokeStyle = COLOR[player_color][0];
                board_ctx.setLineDash([6, 4]);

                board_ctx.strokeRect(
                    rect.x - (5 * index + 5 * each_rect[1].length),
                    rect.y - (5 * index + 5 * each_rect[1].length),
                    rect.width + (10 * index + 10 * each_rect[1].length),
                    rect.height + (10 * index + 10 * each_rect[1].length)
                );

                board_ctx.setLineDash([]);

                if (game.state !== "undefined" && game.state !== "being filled" && each_rect[0] !== 24 && (each_rect[1].length === 0 || game.this_player !== "monitor") && index === 0) {
                    drawRectClock(rect.duration, rect, "black");
                    drawRectInstruction(rect, "black");
                }
            });
        });
        
        if (draw_the_end_rect) {
            rect = game.board.getRect(24);
            
            board_ctx.strokeStyle = "black";
            board_ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        }
                
        let lines = [];
                
        if (game.this_player !== "monitor") {
            if (game.players[game.this_player].current_rect !== 24) {
                lines = [
                    [game.players[game.this_player].current_rect, game.players[game.this_player].next_rect, [game.this_player]]
                ];
            }
        } else {
            game.players.forEach(function fillLinesArray(player) {
                if (player.active && player.current_rect !== 24) {
                    for (j = 0; j < lines.length; j += 1) {
                        if (
                            (player.current_rect === lines[j][0] && player.next_rect === lines[j][1]) ||
                            (player.current_rect === lines[j][1] && player.next_rect === lines[j][0])
                        ) {
                            lines[j][2].push(player.color);
                            break;
                        }
                    }

                    if (j === lines.length) {
                        lines.push([player.current_rect, player.next_rect, [player.color]]);
                    }
                }
            });
        }
                                
        function drawLine(x1, y1, x2, y2, player_color) {
            board_ctx.strokeStyle = COLOR[player_color][0];
            
            board_ctx.beginPath();
            board_ctx.moveTo(x1, y1);
            board_ctx.lineTo(x2, y2);
            board_ctx.stroke();
            board_ctx.closePath();
        }
        
        lines.forEach(function drawLines(line) {
            const rect1 = game.board.getRect(line[0]);
            const rect2 = game.board.getRect(line[1]);
            const L1 = Math.hypot(rect1.width, rect1.height);
            const L2 = Math.hypot(rect2.width, rect2.height);
            
            let rect1_index;
            let rect2_index;
                        
            rects.forEach(function findRectIndex(rect, index) {
                if (rect[0] === line[0]) {
                    rect1_index = index;
                }
                
                if (rect[0] === line[1]) {
                    rect2_index = index;
                }
            });
                        
            line[2].forEach(function calculatePoints(player_color, index) {
                const P = (index + 1) / (line[2].length + 1);
                const R1 = L1 * P;
                const R2 = L2 * P;
                            
                function getOffset(rect_index) {
                    if (rects[rect_index][1].indexOf(player_color) !== -1) {
                        return rects[rect_index][1].indexOf(player_color);
                    } else {
                        return rects[rect_index][1].length + rects[rect_index][2].indexOf(player_color);
                    }
                }
                
                let rect1_offset = getOffset(rect1_index);
                let rect2_offset = getOffset(rect2_index);
                
                let rect1_correction = 0;
                let rect2_correction = 0;
                
                if (rect1.i === rect2.i) {
                    if (rect1.j > rect2.j) {
                        drawLine(
                            rect2.x + rect2.width * P,
                            rect2.y + rect2.height + (rect2_offset * 5),
                            rect1.x + rect1.width * P,
                            rect1.y - (rect1_offset * 5),
                            player_color
                        );
                    } else if (rect1.j < rect2.j) {
                        drawLine(
                            rect1.x + rect1.width * P,
                            rect1.y + rect1.height + (rect1_offset * 5),
                            rect2.x + rect2.width * P,
                            rect2.y - (rect2_offset * 5),
                            player_color
                        );
                    }
                } else if (rect1.i > rect2.i) {
                    if (rect1.j > rect2.j) {
                        if (line[2].length === 1) {
                            rect2_correction = -1;
                        } else {
                            rect1_correction = 1;
                            rect2_correction = 1;
                        }
                        
                        drawLine(
                            rect2.x + Math.min(2 * R2 / L2, 1) * rect2.width + (rect2_offset * 5 + rect2_correction),
                            rect2.y + (1 - Math.max(2 * (R2 / L2) - 1, 0)) * rect2.height + (rect2_offset * 5 + rect2_correction),
                            rect1.x + Math.max(2 * (R1 / L1) - 1, 0) * rect1.width - (rect1_offset * 5 + rect1_correction),
                            rect1.y + (1 - Math.min(2 * R1 / L1, 1)) * rect1.height - (rect1_offset * 5 + rect1_correction),
                            player_color
                        );
                    } else if (rect1.j < rect2.j) {
                        if (line[2].length === 1) {
                            rect1_correction = -1;
                        } else {
                            rect1_correction = 1;
                            rect2_correction = 1;
                        }
                        
                        drawLine(
                            rect2.x + Math.min(2 * R2 / L2, 1) * rect2.width + (rect2_offset * 5 + rect2_correction),
                            rect2.y + Math.max(2 * (R2 / L2) - 1, 0) * rect2.height - (rect2_offset * 5 + rect2_correction),
                            rect1.x + Math.max(2 * (R1 / L1) - 1, 0) * rect1.width - (rect1_offset * 5 + rect1_correction),
                            rect1.y + Math.min(2 * R1 / L1, 1) * rect1.height + (rect1_offset * 5 + rect1_correction),
                            player_color
                        );
                    } else if (rect1.j === rect2.j) {
                        drawLine(
                            rect2.x + rect2.width + (rect2_offset * 5),
                            rect2.y + rect2.height * P,
                            rect1.x - (rect1_offset * 5),
                            rect1.y + rect1.height * P,
                            player_color
                        );
                    }
                } else if (rect1.i < rect2.i) {
                    if (rect1.j > rect2.j) {
                        if (line[2].length === 1) {
                            rect2_correction = -1;
                        } else {
                            rect1_correction = 1;
                            rect2_correction = 1;
                        }
                        
                        drawLine(
                            rect1.x + Math.min(2 * R1 / L1, 1) * rect1.width + (rect1_offset * 5 + rect1_correction),
                            rect1.y + Math.max(2 * (R1 / L1) - 1, 0) * rect1.height - (rect1_offset * 5 + rect1_correction),
                            rect2.x + Math.max(2 * (R2 / L2) - 1, 0) * rect2.width - (rect2_offset * 5 + rect2_correction),
                            rect2.y + Math.min(2 * R2 / L2, 1) * rect2.height + (rect2_offset * 5 + rect2_correction),
                            player_color
                        );
                    } else if (rect1.j < rect2.j) {
                        if (line[2].length === 1) {
                            rect1_correction = -1;
                        } else {
                            rect1_correction = 1;
                            rect2_correction = 1;
                        }

                        drawLine(
                            rect1.x + Math.min(2 * R1 / L1, 1) * rect1.width + (rect1_offset * 5 + rect1_correction),
                            rect1.y + (1 - Math.max(2 * (R1 / L1) - 1, 0)) * rect1.height + (rect1_offset * 5 + rect1_correction),
                            rect2.x + Math.max(2 * (R2 / L2) - 1, 0) * rect2.width - (rect2_offset * 5 + rect2_correction),
                            rect2.y + (1 - Math.min(2 * R2 / L2, 1)) * rect2.height - (rect2_offset * 5 + rect2_correction),
                            player_color
                        );
                    } else if (rect1.j === rect2.j) {
                        drawLine(
                            rect1.x + rect1.width + (rect1_offset * 5),
                            rect1.y + rect1.height * P,
                            rect2.x - (rect2_offset * 5),
                            rect2.y + rect2.height * P,
                            player_color
                        );
                    }
                }
            });
        });
        
        if (game.state === "being filled") {
            clock.innerHTML = "waiting for more players";
        } else if (game.state === "ready") {
            clock.innerHTML = "--- ready ---";
        } else if (game.state === "on") {
            let mm = Math.floor(game.clock.master / 60000);
            let ss = Math.floor((game.clock.master - mm * 60000) / 1000);

            if (mm < 10) {
                mm = "0" + mm;
            }

            if (ss < 10) {
                ss = "0" + ss;
            }

            clock.innerHTML = "--- " + mm + ":" + ss + " ---";
        } else if (game.state === "the end") {
            clock.innerHTML = "-- THE END --";
        }
        
        if (game.state !== "undefined" && game.state !== "being filled") {
            let obj = [0, 0, 0, 0];

            game.players.forEach(function checkObjectives(player) {
                if (player.active) {
                    obj[player.objective] += 1;
                }
            });

            let obj_index = 0;

            if (game.show_the_end) {
                obj_index = 2;
            }
            
            let all_or_both = "all";
            
            if (game.number_of_players === 2) {
                all_or_both = "both";
            }
            
            const OBJECTIVES_TEXT = [
                ["<b>objective #1: find the stuck junk</b><br><br>", "found it", "find it"],
                "<b>objective #2: " + all_or_both + " players should play at the same time as if they were the junk stuck in the drawer</b>",
                ["<b>objective #3: reach the end</b><br><br>", "reached the end", "reach the end"]
            ];
            
            const NUM_TO_WORDS = [
                "", "one player", "two players", "three players", "four players"
            ];
            
            const YOU_AND_NUM_TO_WORDS = [
                "", "", "you and another player", "you and two other players", "you and three other players"
            ];
            
            if (game.stuck_junk_flag && !game.show_the_end) {
                obj_index = 1;
                objectives.innerHTML = OBJECTIVES_TEXT[1];
            } else {
                if (obj[obj_index + 1] === game.number_of_players) {
                    objectives.innerHTML = OBJECTIVES_TEXT[obj_index][0] + "everyone " + OBJECTIVES_TEXT[obj_index][1];
                } else if (obj[obj_index + 1] === 1 && (game.number_of_players > 2 || game.this_player === "monitor" || game.players[game.this_player].objective === obj_index + 1)) {
                    if (game.this_player !== "monitor" && game.players[game.this_player].objective === obj_index + 1) {
                        objectives.innerHTML = OBJECTIVES_TEXT[obj_index][0] + "only you " + OBJECTIVES_TEXT[obj_index][1];
                    } else {
                        objectives.innerHTML = OBJECTIVES_TEXT[obj_index][0] + "one player " + OBJECTIVES_TEXT[obj_index][1];
                    }
                } else if (obj[obj_index + 1] === game.number_of_players - 1) {
                    if (game.this_player !== "monitor" && game.players[game.this_player].objective === obj_index) {
                        objectives.innerHTML = OBJECTIVES_TEXT[obj_index][0] + "only you didn't " + OBJECTIVES_TEXT[obj_index][2];
                    } else {
                        objectives.innerHTML = OBJECTIVES_TEXT[obj_index][0] + "only one player didn't " + OBJECTIVES_TEXT[obj_index][2];
                    }
                } else if (obj[obj_index + 1] === 0) {
                    objectives.innerHTML = OBJECTIVES_TEXT[obj_index][0] + "no one " + OBJECTIVES_TEXT[obj_index][1];
                } else {
                    if (game.this_player !== "monitor" && game.players[game.this_player].objective === obj_index + 1) {
                        objectives.innerHTML =
                                OBJECTIVES_TEXT[obj_index][0] + YOU_AND_NUM_TO_WORDS[obj[obj_index + 1]] + " " + OBJECTIVES_TEXT[obj_index][1];
                    } else {
                        objectives.innerHTML =
                                OBJECTIVES_TEXT[obj_index][0] + NUM_TO_WORDS[obj[obj_index + 1]] + " " + OBJECTIVES_TEXT[obj_index][1];
                    }
                }
            }

            objectives_div.style = "background-color: white; padding-top: 6px;";

            abbreviations_div.style = "background-color: lightyellow";
            abbreviations.innerHTML = "<u>abbreviations</u><br>" +
                    "<b>I</b>: imitate what you hear<br>" +
                    "<b>J</b>: play as if you were junk inside the drawer<br>" +
                    "<b>sJ</b>: play as if you were the junk stuck in the drawer<br>" +
                    "<b>F</b>: play as if you were trying to fix the drawer<br>" +
                    "<b>D</b>: play as if you were the drawer<br>" +
                    "<b>P</b>: pause";
        }
    }
    
    return {
        init: init,
        draw: draw
    };
}