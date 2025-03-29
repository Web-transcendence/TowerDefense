var canvas = document.getElementById("gameCanvas");
var ctx = canvas.getContext("2d");
var socket = new WebSocket("ws://localhost:8080");
var Game = /** @class */ (function () {
    function Game() {
        this.timer = 4;
        this.level = 0;
        this.start = false;
    }
    return Game;
}());
var Enemy = /** @class */ (function () {
    function Enemy(type, hp, pos, alive) {
        this.type = type;
        this.hp = hp;
        this.pos = pos;
        this.alive = alive;
    }
    return Enemy;
}());
var Player = /** @class */ (function () {
    function Player(name) {
        this.hp = 3;
        this.mana = 210;
        this.cost = 60;
        this.name = name;
        this.enemies = [];
        this.deck = [];
        this.board = [];
    }
    Player.prototype.addEnemy = function (enemy) {
        this.enemies.push(enemy);
    };
    return Player;
}());
var Tower = /** @class */ (function () {
    function Tower(type, speed, damages, area, effect, level) {
        this.type = type;
        this.speed = speed;
        this.damages = damages;
        this.area = area;
        this.effect = effect;
        this.level = level;
    }
    return Tower;
}());
var Board = /** @class */ (function () {
    function Board(pos, tower) {
        this.tower = tower;
        this.pos = pos;
    }
    return Board;
}());
var Assets = /** @class */ (function () {
    function Assets() {
        this.enemy = new Image();
        this.addTower = new Image();
        this.fire = new Image();
        this.ice = new Image();
        this.earth = new Image();
        this.enemy.src = "./assets/slime.png";
        this.addTower.src = "./assets/addTower.png";
        this.fire.src = "./assets/fire.png";
        this.ice.src = "./assets/ice.png";
        this.earth.src = "./assets/earth.png";
    }
    return Assets;
}());
var tile = 80;
var game = new Game;
var player1 = new Player("Player 1");
var player2 = new Player("Player 2");
var assets = new Assets();
function timeTostring(timer) {
    var minutes = Math.floor(timer / 60);
    var seconds = timer % 60;
    return ("".concat(minutes, ":").concat(seconds.toString().padStart(2, '0')));
}
function drawGrid() {
    var sq = true;
    for (var i = 0; i < canvas.width; i += tile) {
        var j = 0;
        sq = !sq;
        for (; j < canvas.height; j += tile) {
            if (sq) {
                ctx.fillStyle = "#364153";
                sq = false;
            }
            else {
                ctx.fillStyle = "#101828";
                sq = true;
            }
            ctx.fillRect(i, j, tile, tile);
        }
    }
}
function drawTimer() {
    ctx.fillStyle = "#fcc800";
    ctx.font = "40px 'Press Start 2P'";
    ctx.textAlign = "center";
    var timer = game.timer;
    if (game.start)
        ctx.fillText(timeTostring(timer), canvas.width * 0.5, canvas.height * 0.5 + 23);
    else if (timer > 1)
        ctx.fillText(timeTostring(timer - 1), canvas.width * 0.5, canvas.height * 0.5 + 23);
    else {
        ctx.fillText("Go !!!", canvas.width * 0.5, canvas.height * 0.5 + 23);
    }
}
function enemyPosx(pos, player) {
    if (pos < tile * 6) {
        if (player === 1)
            return (pos);
        else
            return (canvas.width - pos);
    }
    if (pos > tile * 13) {
        if (player === 1)
            return (tile * 19 - pos);
        else
            return (pos - tile * 4);
    }
    else {
        if (player === 1)
            return (tile * 6 - 1);
        else
            return (tile * 9 - 1);
    }
}
function enemyPosy(pos) {
    if (pos < tile * 6) {
        return (tile - 1);
    }
    if (pos > tile * 13) {
        return (tile * 8 - 1);
    }
    else
        return (pos - tile * 5 - 1);
}
function drawEnemies() {
    player1.enemies.forEach(function (enemy) {
        ctx.drawImage(assets.enemy, enemyPosx(enemy.pos, 1) - 35, enemyPosy(enemy.pos) - 35, 70, 70);
        ctx.fillStyle = "#fcc800";
        ctx.font = "16px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText(enemy.hp.toString(), enemyPosx(enemy.pos, 1), enemyPosy(enemy.pos) + 28);
    });
    player2.enemies.forEach(function (enemy) {
        ctx.drawImage(assets.enemy, enemyPosx(enemy.pos, 2) - 35, enemyPosy(enemy.pos) - 35, 70, 70);
        ctx.fillStyle = "#fcc800";
        ctx.font = "16px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText(enemy.hp.toString(), enemyPosx(enemy.pos, 2), enemyPosy(enemy.pos) + 28);
    });
}
function drawButtons() {
    ctx.drawImage(assets.addTower, tile * 6.5 - 35, canvas.height - tile * 0.75 - 35, 70, 70);
    ctx.drawImage(assets.addTower, tile * 8.5 - 35, canvas.height - tile * 0.75 - 35, 70, 70);
    ctx.fillStyle = "#fcc800";
    ctx.font = "16px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.fillText(player1.cost.toString(), tile * 6.5, canvas.height - tile * 0.75 + 22);
    ctx.fillText(player2.cost.toString(), tile * 8.5, canvas.height - tile * 0.75 + 22);
}
function towerAsset(type) {
    switch (type) {
        case "fire":
            return (assets.fire);
        case "ice":
            return (assets.ice);
        case "earth":
            return (assets.earth);
        default:
            return (assets.fire);
    }
}
function drawTowers() {
    player1.board.forEach(function (tower) {
        ctx.drawImage(towerAsset(tower.tower.type), tile * (1 + tower.pos % 4), tile * (2 + Math.floor(tower.pos / 4)), tile, tile);
    });
    player2.board.forEach(function (tower) {
        ctx.drawImage(towerAsset(tower.tower.type), tile * (10 + tower.pos % 4), tile * (2 + Math.floor(tower.pos / 4)), tile, tile);
    });
}
function drawTemplate() {
    ctx.fillStyle = "red";
    ctx.fillRect(0, tile * 0.5, tile * 6.5, tile * 8);
    ctx.fillStyle = "blue";
    ctx.strokeRect(0, tile, 6 * tile, 7 * tile);
    ctx.fillStyle = "brown";
    ctx.fillRect(tile * 0.5, tile * 1.5, tile * 5, tile * 6);
    ctx.fillStyle = "red";
    ctx.fillRect(0, tile * 7.5, tile, tile);
    ctx.fillStyle = "green";
    ctx.fillRect(tile, tile * 2, tile * 4, tile * 5);
}
function draw() {
    drawGrid();
    //drawTemplate(); // for debug use
    drawTimer();
    drawEnemies();
    drawButtons();
    drawTowers();
    requestAnimationFrame(draw);
}
draw();
socket.onopen = function () { return console.log("Connected to server"); };
socket.onmessage = function (event) {
    var data = JSON.parse(event.data);
    switch (data.class) {
        case "Game":
            game.level = data.level;
            game.timer = data.timer;
            game.start = data.start;
            break;
        case "Player 1":
            player1.hp = data.hp;
            player1.mana = data.mana;
            player1.cost = data.cost;
            player1.enemies.splice(0, player1.enemies.length);
            data.enemies.forEach(function (enemy) {
                player1.enemies.push(new Enemy(enemy.type, enemy.hp, enemy.pos, enemy.alive));
            });
            player1.deck.splice(0, player1.deck.length);
            data.deck.forEach(function (tower) {
                player1.deck.push(new Tower(tower.type, tower.speed, tower.damages, tower.area, tower.effect, tower.level));
            });
            player1.board.splice(0, player1.board.length);
            data.board.forEach(function (board) {
                player1.board.push(new Board(board.pos, new Tower(board.tower.type, board.tower.speed, board.tower.damages, board.tower.area, board.tower.effect, board.tower.level)));
            });
            break;
        case "Player 2":
            player2.hp = data.hp;
            player2.mana = data.mana;
            player2.cost = data.cost;
            player2.enemies.splice(0, player2.enemies.length);
            data.enemies.forEach(function (enemy) {
                player2.enemies.push(new Enemy(enemy.type, enemy.hp, enemy.pos, enemy.alive));
            });
            player2.deck.splice(0, player2.deck.length);
            data.deck.forEach(function (tower) {
                player2.deck.push(new Tower(tower.type, tower.speed, tower.damages, tower.area, tower.effect, tower.level));
            });
            player2.board.splice(0, player2.board.length);
            data.board.forEach(function (board) {
                player2.board.push(new Board(board.pos, new Tower(board.tower.type, board.tower.speed, board.tower.damages, board.tower.area, board.tower.effect, board.tower.level)));
            });
            break;
        default:
            console.warn("Unknown type received:", data);
    }
};
// window.addEventListener("keydown", (event) => {
//     socket.send(JSON.stringify({ type: "input", key: event.key, state: "down" }));
// });
//
// window.addEventListener("keyup", (event) => {
//     socket.send(JSON.stringify({ type: "input", key: event.key, state: "up" }));
// });
canvas.addEventListener("click", function (event) {
    var rect = canvas.getBoundingClientRect(); // Récupère la position du canvas
    var scaleX = canvas.width / rect.width; // Gestion du scaling si besoin
    var scaleY = canvas.height / rect.height;
    var x = (event.clientX - rect.left) * scaleX;
    var y = (event.clientY - rect.top) * scaleY;
    if (x >= tile * 6 && x < tile * 7 && y >= canvas.height - tile * 1.25 && y < canvas.height - tile * 0.25) {
        socket.send(JSON.stringify({ event: "clic", player: 1, button: "addTower" }));
        console.log("Clic d\u00E9tect\u00E9 aux coordonn\u00E9es : (".concat(x, ", ").concat(y, ")"));
    }
    if (x >= tile * 8 && x < tile * 9 && y >= canvas.height - tile * 1.25 && y < canvas.height - tile * 0.25) {
        socket.send(JSON.stringify({ event: "clic", player: 2, button: "addTower" }));
        console.log("Clic d\u00E9tect\u00E9 aux coordonn\u00E9es : (".concat(x, ", ").concat(y, ")"));
    }
});
socket.onclose = function () { return console.log("Disconnected"); };
