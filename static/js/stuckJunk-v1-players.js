/*jslint es6, node, this, for*/

function sJv1players() {
    "use strict";
    
    function didPlayerFindTheStuckJunk(board) {
        if (this.objective === 0 && this.adjacent_rects.some(function checkAdjacentRects(adjacent_rect) {
            return adjacent_rect === board.getStuckJunk();
        })) {
            this.objective = 1;
        }
    }
    
    function changeCurrentRect(new_current_rect, board, show_the_end) {
        this.current_rect = new_current_rect;
        
        function copyAdjacentRects(rect) {
            let adjacent_rects = [];

            rect.adjacent_rects.forEach(function pushAdjacentRects(adjacent_rect) {
                adjacent_rects.push(adjacent_rect);
            });

            return adjacent_rects;
        }
        
        if (this.current_rect !== 24) {
            let rect = board.getRect(this.current_rect);

            this.adjacent_rects = copyAdjacentRects(rect);

            if (this.adjacent_rects.length > 3) {
                let i = Math.floor(Math.random() * 4);
                this.adjacent_rects.splice(i, 1);
            }
            
            this.next_rect = this.adjacent_rects[0];

            didPlayerFindTheStuckJunk.call(this, board);
            
            if (show_the_end && (this.current_rect === 15 || this.current_rect === 23)) {
                this.adjacent_rects[2] = 24;
            }
            
            this.rect_clock = rect.duration;
        } else {
            this.next_rect = -1;
            this.adjacent_rects = [];
            this.objective = 3;
        }
    }
    
    function changeNextRect(Kostas, keyCode) {
        if (Kostas) {
            this.next_rect = this.adjacent_rects[(this.adjacent_rects.indexOf(this.next_rect) + 1) % 3];
        } else {
            this.next_rect = this.adjacent_rects[keyCode - 49];
        }
    }
    
    let players = [];
    let i;
    
    for (i = 0; i < 6; i += 1) {
        players.push({
            color: i, // 0: red
                      // 1: green
                      // 2: blue
                      // 3: orange
                      // 4: magenta
                      // 5: cyan
            active: false,
            current_rect: -1,
            adjacent_rects: [-1, -1, -1],
            next_rect: -1,
            rect_clock: 0,
            objective: 0,
            offset: 0,
            changeCurrentRect: changeCurrentRect,
            changeNextRect: changeNextRect,
            didPlayerFindTheStuckJunk: didPlayerFindTheStuckJunk
        });
    }
    
    return players;
}

if (typeof exports !== "undefined") {
    exports.sJv1players = sJv1players;
}