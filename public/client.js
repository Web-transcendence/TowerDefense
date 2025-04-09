var canvas = document.getElementById("gameCanvas");
var ctx = canvas.getContext("2d");
var socket = new WebSocket("ws://localhost:8080");
// Main menu and tower selection
function drawMenu() {
    ctx.drawImage(assets.getImage("main"), 0, 0, canvas.width, canvas.height);
    ctx.drawImage(assets.getAnImage("rslime"), canvas.width * 0.1, canvas.height * 0.06, 170, 170);
    ctx.drawImage(assets.getAnImage("gslime"), canvas.width * 0.18, canvas.height * 0.17, 80, 80);
    ctx.drawImage(assets.getAnImage("pslime"), canvas.width * 0.11, canvas.height * 0.18, 80, 80);
    frame += 0.75;
    ctx.fillStyle = "#b329d1";
    ctx.strokeStyle = "#0d0d0d";
    ctx.lineWidth = 20;
    ctx.textAlign = "center";
    ctx.font = "64px 'Press Start 2P'";
    ctx.strokeText("Slime Defender", canvas.width * 0.545, canvas.height * 0.25, canvas.width * 0.6);
    ctx.fillText("Slime Defender", canvas.width * 0.545, canvas.height * 0.25, canvas.width * 0.6);
}
// Game classes and functions
var Game = /** @class */ (function () {
    function Game() {
        this.level = 0;
        this.timer = 4;
        this.start = false;
        this.state = 0;
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
        this.enemies = [];
        this.deck = [];
        this.board = [];
        this.name = name;
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
        this.images = {};
        this.loadImages();
    }
    Assets.prototype.loadImages = function () {
        var assetsFolder = "./assets/";
        var imageNames = ["black1.png", "black2.png", "black3.png", "black4.png",
            "blue1.png", "blue2.png", "blue3.png", "blue4.png",
            "green1.png", "green2.png", "green3.png", "green4.png",
            "orange1.png", "orange2.png", "orange3.png", "orange4.png",
            "pink1.png", "pink2.png", "pink3.png", "pink4.png",
            "red1.png", "red2.png", "red3.png", "red4.png",
            "violet1.png", "violet2.png", "violet3.png", "violet4.png",
            "white1.png", "white2.png", "white3.png", "white4.png",
            "yellow1.png", "yellow2.png", "yellow3.png", "yellow4.png",
            "ygreen1.png", "ygreen2.png", "ygreen3.png", "ygreen4.png",
            "main.png", "addTower.png", "hp.png", "mana.png",
            "map0.png", "map1.png", "map2.png", "map3.png", "map4.png",
            "poop0.png", "poop1.png",
            "bslime0.png", "bslime1.png",
            "gslime0.png", "gslime1.png",
            "yslime0.png", "yslime1.png",
            "rslime0.png", "rslime1.png",
            "pslime0.png", "pslime1.png",
            "dslime0.png", "dslime1.png"];
        for (var _i = 0, imageNames_1 = imageNames; _i < imageNames_1.length; _i++) {
            var name_1 = imageNames_1[_i];
            var key = name_1.split(".")[0];
            var img = new Image();
            img.src = "".concat(assetsFolder).concat(name_1);
            this.images[key] = img;
        }
    };
    Assets.prototype.getImage = function (name) {
        return (this.images[name]);
    };
    Assets.prototype.getAnImage = function (name) {
        if (frame % 30 < 15) {
            if (this.images["".concat(name, "0")])
                return (this.images["".concat(name, "0")]);
        }
        else {
            if (this.images["".concat(name, "1")])
                return (this.images["".concat(name, "1")]);
        }
        return (this.images[name]);
    };
    return Assets;
}());
var frame = 0;
var assets = new Assets();
var tile = canvas.width / 15;
var game = new Game;
var player1 = new Player("Player 1");
var player2 = new Player("Player 2");
var nmap = Math.floor(Math.random() * 5);
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
    switch (nmap) {
        case 4:
            ctx.fillStyle = "#dfdfdf";
            break;
        case 3:
            ctx.fillStyle = "#a08829";
            break;
        case 2:
            ctx.fillStyle = "#ab1e00";
            break;
        case 1:
            ctx.fillStyle = "#17b645";
            break;
        case 0:
            ctx.fillStyle = "#0075ab";
            break;
        default:
            ctx.fillStyle = "#fcc800";
            break;
    }
    ctx.strokeStyle = "#0d0d0d";
    ctx.lineWidth = 8;
    ctx.font = "40px 'Press Start 2P'";
    ctx.textAlign = "center";
    var timer = game.timer;
    if (game.start) {
        ctx.strokeText(timeTostring(timer), canvas.width * 0.5, canvas.height * 0.5 + tile * 0.25);
        ctx.fillText(timeTostring(timer), canvas.width * 0.5, canvas.height * 0.5 + tile * 0.25);
    }
    else if (timer > 1) {
        ctx.strokeText(timeTostring(timer - 1), canvas.width * 0.5, canvas.height * 0.5 + tile * 0.25);
        ctx.fillText(timeTostring(timer - 1), canvas.width * 0.5, canvas.height * 0.5 + tile * 0.25);
    }
    else {
        ctx.strokeText("Go !!!", canvas.width * 0.5, canvas.height * 0.5 + 23);
        ctx.fillText("Go !!!", canvas.width * 0.5, canvas.height * 0.5 + 23);
    }
}
function enemyPosx(pos, player) {
    if (pos < 480) {
        if (player === 1)
            return (pos);
        else
            return (canvas.width - pos);
    }
    if (pos > 1040) {
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
    if (pos < 480) {
        return (tile - 1);
    }
    if (pos > 1040) {
        return (tile * 8 - 1);
    }
    else
        return (pos - tile * 5 - 1);
}
function drawEnemies() {
    player1.enemies.forEach(function (enemy) {
        if (enemy.pos < 480)
            ctx.drawImage(assets.getAnImage(enemy.type), enemyPosx(enemy.pos, 1) - 35, enemyPosy(enemy.pos) - 35, 70, 70);
        else {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(assets.getAnImage(enemy.type), -1 * (enemyPosx(enemy.pos, 1) - 35) - 70, enemyPosy(enemy.pos) - 35, 70, 70);
            ctx.restore();
        }
        ctx.fillStyle = "#fcc800";
        ctx.font = "16px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText(enemy.hp.toString(), enemyPosx(enemy.pos, 1), enemyPosy(enemy.pos) + 28);
    });
    player2.enemies.forEach(function (enemy) {
        if (enemy.pos >= 480)
            ctx.drawImage(assets.getAnImage(enemy.type), enemyPosx(enemy.pos, 2) - 35, enemyPosy(enemy.pos) - 35, 70, 70);
        else {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(assets.getAnImage(enemy.type), -1 * (enemyPosx(enemy.pos, 2) - 35) - 70, enemyPosy(enemy.pos) - 35, 70, 70);
            ctx.restore();
        }
        ctx.fillStyle = "#fcc800";
        ctx.font = "16px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText(enemy.hp.toString(), enemyPosx(enemy.pos, 2), enemyPosy(enemy.pos) + 28);
    });
    frame += 1;
}
function getTowerColor(type) {
    if (type === "red")
        return ("#ab1e00");
    if (type === "blue")
        return ("#0075ab");
    if (type === "green")
        return ("#17b645");
    if (type === "yellow")
        return ("#ffe71e");
    if (type === "white")
        return ("#dfdfdf");
    return ("black");
}
function drawRawButton(centerx, centery, sizex, sizey, border) {
    var old = ctx.fillStyle;
    ctx.fillStyle = border;
    ctx.fillRect(centerx - sizex * 0.5 + 4, centery - sizey * 0.5, sizex - 8, sizey);
    ctx.fillRect(centerx - sizex * 0.5, centery - sizey * 0.5 + 4, sizex, sizey - 8);
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(centerx - sizex * 0.5 + 8, centery - sizey * 0.5 + 4, sizex - 16, sizey - 8);
    ctx.fillRect(centerx - sizex * 0.5 + 4, centery - sizey * 0.5 + 8, sizex - 8, sizey - 16);
    ctx.fillStyle = old;
}
function drawButtons() {
    ctx.fillStyle = "#fcc800";
    ctx.font = "16px 'Press Start 2P'";
    ctx.textAlign = "center";
    // addTower
    ctx.drawImage(assets.getImage("addTower"), tile * 6.5 - 35, canvas.height - tile * 0.75 - 35, 70, 70);
    ctx.drawImage(assets.getImage("addTower"), tile * 8.5 - 35, canvas.height - tile * 0.75 - 35, 70, 70);
    ctx.fillText(player1.cost.toString(), tile * 6.5, canvas.height - tile * 0.75 + 22);
    ctx.fillText(player2.cost.toString(), tile * 8.5, canvas.height - tile * 0.75 + 22);
    // stats
    drawRawButton(tile * 5.5, canvas.height - tile * 0.75, tile * 0.9, tile * 0.9, "#0096ff");
    ctx.drawImage(assets.getImage("mana"), tile * 5.35, canvas.height - tile * 1.05, tile * 0.3, tile * 0.3);
    drawRawButton(tile * 9.5, canvas.height - tile * 0.75, tile * 0.9, tile * 0.9, "#0096ff");
    ctx.drawImage(assets.getImage("mana"), tile * 9.35, canvas.height - tile * 1.05, tile * 0.3, tile * 0.3);
    ctx.fillStyle = "#0096ff";
    ctx.fillText(player1.mana.toString(), tile * 5.5, canvas.height - tile * 0.45, 50);
    ctx.fillText(player2.mana.toString(), tile * 9.5, canvas.height - tile * 0.45, 50);
    // Towers
    for (var i = 0; i < player1.deck.length && i < player2.deck.length; i++) {
        // Player 1
        drawRawButton(tile * (0.5 + i), canvas.height - tile * 0.75, tile * 0.9, tile * 1.3, getTowerColor(player1.deck[i].type));
        ctx.drawImage(assets.getImage("".concat(player1.deck[i].type).concat(player1.deck[i].level)), tile * (0.5 + i) - 28, canvas.height - tile - 28, 56, 56);
        ctx.fillStyle = "#eaeaea";
        if (player1.deck[i].level !== 4) {
            ctx.fillText("Lv. ".concat(player1.deck[i].level), tile * (0.5 + i), canvas.height - tile * 0.55, 50);
            ctx.fillText("Up: ".concat(100 * Math.pow(2, player1.deck[i].level)), tile * (0.5 + i), canvas.height - tile * 0.25, 50);
        }
        else
            ctx.fillText("Lv. max", tile * (0.5 + i), canvas.height - tile * 0.35, 50);
        // Player 2
        drawRawButton(tile * (10.5 + i), canvas.height - tile * 0.75, tile * 0.9, tile * 1.3, getTowerColor(player2.deck[i].type));
        ctx.fillStyle = "#eaeaea";
        ctx.drawImage(assets.getImage("".concat(player2.deck[i].type).concat(player2.deck[i].level)), tile * (10.5 + i) - 28, canvas.height - tile - 28, 56, 56);
        if (player2.deck[i].level !== 4) {
            ctx.fillText("Lv. ".concat(player2.deck[i].level), tile * (10.5 + i), canvas.height - tile * 0.55, 50);
            ctx.fillText("Up: ".concat(100 * Math.pow(2, player2.deck[i].level)), tile * (10.5 + i), canvas.height - tile * 0.25, 50);
        }
        else
            ctx.fillText("Lv. max", tile * (10.5 + i), canvas.height - tile * 0.35, 50);
    }
    // HP
    for (var j = 0; j < player1.hp; j++) {
        ctx.drawImage(assets.getImage("hp"), tile * (0.1 + j * 0.6), tile * 0.1, tile * 0.5, tile * 0.5);
    }
    for (var k = 0; k < player2.hp; k++) {
        ctx.drawImage(assets.getImage("hp"), canvas.width - tile * (0.6 + k * 0.6), tile * 0.1, tile * 0.5, tile * 0.5);
    }
}
function getTowerLevel(tower, pNum) {
    var player = pNum === 1 ? player1 : player2;
    for (var i = 0; i < player.deck.length; i++) {
        if (player.deck[i].type === tower.type) {
            return (player.deck[i].level);
        }
    }
}
function drawTowers() {
    player1.board.forEach(function (tower) {
        ctx.drawImage(assets.getImage("".concat(tower.tower.type).concat(getTowerLevel(tower.tower, 1))), tile * (0.75 + tower.pos % 4), tile * (1.5 + Math.floor(tower.pos / 4)), tile * 1.4, tile * 1.4);
    });
    player2.board.forEach(function (tower) {
        ctx.drawImage(assets.getImage("".concat(tower.tower.type).concat(getTowerLevel(tower.tower, 2))), tile * (9.75 + tower.pos % 4), tile * (1.5 + Math.floor(tower.pos / 4)), tile * 1.4, tile * 1.4);
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
function drawGame() {
    ctx.drawImage(assets.getImage("map".concat(nmap)), 0, 0, canvas.width, canvas.height);
    //drawGrid(); // for debug use only
    //drawTemplate(); // for debug use only
    drawTimer();
    drawEnemies();
    drawButtons();
    drawTowers();
}
// Main
function mainLoop() {
    switch (game.state) {
        case 0:
            drawMenu();
            break;
        case 1:
            drawGame();
            break;
        default:
            break;
    }
    requestAnimationFrame(mainLoop);
}
mainLoop();
// Communication with backend
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
window.addEventListener("keydown", function (event) {
    if (event.key === "b")
        socket.send(JSON.stringify({ event: "clic", player: 0, button: -2 }));
});
canvas.addEventListener("click", function (event) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var x = (event.clientX - rect.left) * scaleX;
    var y = (event.clientY - rect.top) * scaleY;
    switch (game.state) {
        case 0:
            socket.send(JSON.stringify({ event: "clic", player: 0, button: -1 }));
            game.state = 1;
            break;
        case 1:
            if (y >= canvas.height - tile * 1.25 && y < canvas.height - tile * 0.25) {
                if (x >= 0 && x < tile * 5)
                    socket.send(JSON.stringify({ event: "clic", player: 1, button: Math.floor(x / tile) }));
                else if (x >= tile * 6 && x < tile * 7) {
                    socket.send(JSON.stringify({ event: "clic", player: 1, button: 5 }));
                    console.log("Clic d\u00E9tect\u00E9 aux coordonn\u00E9es : (".concat(x, ", ").concat(y, ")"));
                }
                else if (x >= tile * 8 && x < tile * 9) {
                    socket.send(JSON.stringify({ event: "clic", player: 2, button: 5 }));
                    console.log("Clic d\u00E9tect\u00E9 aux coordonn\u00E9es : (".concat(x, ", ").concat(y, ")"));
                }
                else if (x >= tile * 10 && x < canvas.width)
                    socket.send(JSON.stringify({ event: "clic", player: 2, button: Math.floor(x / tile) - 10 }));
            }
            break;
        default:
            break;
    }
});
socket.onclose = function () { return console.log("Disconnected"); };
