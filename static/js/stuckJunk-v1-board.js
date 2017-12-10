/*jslint es6, node, for*/

function sJv1board() {
    "use strict";
    
    let instructions = new Array(25);
    let sJ_index = -1;
    
    function newInstructions(players, number_of_players) {
        // select first which rectangle will be "sJ"

        let sJ_pool = [1, 2, 3, 8, 10, 12, 14, 15, 17, 19, 20];
        
        players.forEach(function removeCurrentRects(player) {
            if (player.active) {
                if (sJ_pool.indexOf(player.current_rect) !== -1) {
                    sJ_pool.splice(sJ_pool.indexOf(player.current_rect), 1);
                }
                
                if (number_of_players < 3) {
                    player.adjacent_rects.forEach(function removeAdjacentRects(adjacent_rect) {
                        if (sJ_pool.indexOf(adjacent_rect) !== -1) {
                            sJ_pool.splice(sJ_pool.indexOf(adjacent_rect), 1);
                        }
                    });
                }
            }
        });
        
        sJ_index = sJ_pool[Math.floor(Math.random() * sJ_pool.length)];

        instructions[sJ_index] = "sJ";
        
        let F_pool = [1, 2, 3, 6, 8, 10, 12, 14, 15, 17, 19, 20, 21, 22];
        let D_pool = [1, 2, 3, 8, 10, 12, 14, 15, 17, 18, 19, 20, 22];
        
        if (F_pool.indexOf(sJ_index) !== -1) {
            F_pool.splice(F_pool.indexOf(sJ_index), 1);
        }
        
        if (D_pool.indexOf(sJ_index) !== -1) {
            D_pool.splice(D_pool.indexOf(sJ_index), 1);
        }
        
        let possible_instructions = [
            ["P"],                      // 0
            ["I", "J", "sJ", "D", "F"], // 1
            ["I", "J", "sJ", "D", "F"], // 2
            ["I", "J", "sJ", "D", "F"], // 3
            ["I", "J"],                 // 4
            ["I", "J"],                 // 5
            ["F", "P"],                 // 6
            ["I", "J"],                 // 7
            ["I", "J", "sJ", "D", "F"], // 8
            ["I", "J"],                 // 9
            ["I", "J", "sJ", "D", "F"], // 10
            ["P"],                      // 11
            ["I", "J", "sJ", "D", "F"], // 12
            ["P"],                      // 13
            ["I", "sJ", "D", "F"],      // 14
            ["I", "sJ", "D", "F"],      // 15
            ["I"],                      // 16
            ["I", "sJ", "D", "F"],      // 17
            ["I", "F"],                 // 18
            ["I", "sJ", "D", "F"],      // 19
            ["I", "sJ", "D", "F"],      // 20
            ["F", "P"],                 // 21
            ["I", "J", "D", "F"],       // 22
            ["P"]                       // 23
        ];
        
        function removeInstruction(instruction_abbreviation) {
            possible_instructions.forEach(function checkRectangle(unused, rect) {
                possible_instructions[rect].forEach(function removeInstructionFromRect(unused, instruction) {
                    if (possible_instructions[rect][instruction] === instruction_abbreviation) {
                        possible_instructions[rect].splice(instruction, 1);
                    }
                });
            });
        }
        
        removeInstruction("sJ");
        
        // either segment 4 or segment 9 must be "J"
        
        if (!Math.floor(Math.random() * 2)) {
            instructions[4] = "J";
        } else {
            instructions[9] = "J";
        }
        
        // "D" and "F" must occur at least once
        
        instructions[F_pool[Math.floor(Math.random() * F_pool.length)]] = "F";
        
        D_pool.splice(D_pool.indexOf(instructions.indexOf("F")), 1);
        
        instructions[D_pool[Math.floor(Math.random() * D_pool.length)]] = "D";
        
        // "J", "D" and "F" must not occur more than 3 times
        
        let distribution = [0, 1, 1, 1, 1, 4]; // I, J, sJ, F, D, P
        
        const INSTRUCTION_TO_INDEX = {
            I: 0,
            J: 1,
            sJ: 2,
            F: 3,
            D: 4,
            P: 5
        };
        
        let i;
        
        for (i = 0; i < 24; i += 1) {
            if (!instructions[i]) {
                instructions[i] = possible_instructions[i][Math.floor(Math.random() * possible_instructions[i].length)];
                distribution[INSTRUCTION_TO_INDEX[instructions[i]]] += 1;
                
                if (instructions[i] !== "I" && distribution[INSTRUCTION_TO_INDEX[instructions[i]]] === 3) {
                    removeInstruction(instructions[i]);
                }
            }
        }
        
        return instructions;
    }
        
    function copyFromArray(instr, sJ) {
        instructions = instr;
        sJ_index = sJ;
    }
    
    function copyFromLog(log, start_from) {
        let i;
        
        for (i = start_from; i < start_from + 24; i += 1) {
            log[i] = log[i].split(" ");
            instructions[i - start_from] = log[i][1];
            
            if (log[i][1] === "sJ") {
                sJ_index = i - start_from;
            }
        }
    }
        
    function getRect(x, y) {
        let i;
        let j;
        let index;
        
        if (y === undefined) {
            index = x;
            j = Math.floor(index / 5);
            i = (j % 2)
                ? (4 - index % 5)
                : (index % 5);
        } else {
            index = y * 5;
            index += (y % 2 === 0)
                ? x
                : (4 - x);
            i = x;
            j = y;
        }
        
        const DURATIONS = [
            4273,   // 0
            102898, // 1
            31133,  // 2
            23094,  // 3
            18957,  // 4
            28050,  // 5
            7699,   // 6
            16790,  // 7
            40478,  // 8
            29710,  // 9
            23507,  // 10
            8011,   // 11
            25669,  // 12
            8615,   // 13
            162126, // 14
            59690,  // 15
            5713,   // 16
            60769,  // 17
            7391,   // 18
            42135,  // 19
            65578,  // 20
            16610,  // 21
            137017, // 22
            17419,  // 23
            100000  // 24
        ]; // item 24 is only used for calculating the size of the rectangle
        
        let size = (Math.pow(DURATIONS[index] / DURATIONS[14], 0.3) * 0.9) / 5;
        
        const BOARD_WIDTH = 974;
        const BOARD_HEIGHT = 750;
        
        const ADJACENT_RECTS = [
            [9, 1, 8],        // 0
            [0, 8, 2],        // 1
            [1, 7, 3],        // 2
            [2, 6, 4],        // 3
            [3, 6, 5],        // 4
            [6, 4, 14],       // 5
            [7, 3, 13, 5],    // 6
            [8, 2, 12, 6],    // 7
            [9, 1, 11, 7],    // 8
            [0, 10, 8],       // 9
            [9, 19, 11],      // 10
            [10, 8, 18, 12],  // 11
            [11, 7, 17, 13],  // 12
            [12, 6, 16, 14],  // 13
            [13, 5, 15],      // 14
            [13, 16, 14],     // 15
            [17, 13, 23, 15], // 16
            [18, 12, 22, 16], // 17
            [19, 11, 21, 17], // 18
            [10, 20, 18],     // 19
            [19, 18, 21],     // 20
            [20, 18, 22],     // 21
            [21, 17, 23],     // 22
            [17, 22, 16]      // 23
        ];
        
        return {
            i: i,
            j: j,
            x: BOARD_WIDTH / 5 * i + (BOARD_WIDTH / 5 - size * BOARD_WIDTH) / 2,
            y: BOARD_HEIGHT / 5 * j + (BOARD_HEIGHT / 5 - size * BOARD_HEIGHT) / 2,
            width: size * BOARD_WIDTH,
            height: size * BOARD_HEIGHT,
            instruction: instructions[index],
            duration: DURATIONS[index],
            adjacent_rects: ADJACENT_RECTS[index]
        };
    }
    
    function getStuckJunk() {
        return sJ_index;
    }
    
    function getInstructions() {
        return instructions;
    }
    
    return {
        newInstructions: newInstructions,
        copyFromArray: copyFromArray,
        copyFromLog: copyFromLog,
        getRect: getRect,
        getStuckJunk: getStuckJunk,
        getInstructions: getInstructions
    };
}

if (typeof exports !== "undefined") {
    exports.sJv1board = sJv1board;
}
