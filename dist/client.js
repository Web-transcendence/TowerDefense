const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const socket = new WebSocket("ws://localhost:8080");
class Game {
    constructor() {
        this.timer = 4;
        this.level = 0;
        this.start = false;
    }
}
class Enemy {
    constructor(type, hp, pos, alive) {
        this.type = type;
        this.hp = hp;
        this.pos = pos;
        this.alive = alive;
    }
}
class Player {
    constructor(name) {
        this.name = name;
        this.hp = 3;
        this.mana = 210;
        this.enemies = [];
    }
    addEnemy(enemy) {
        this.enemies.push(enemy);
    }
}
let game = new Game;
let player1 = new Player("Player 1");
let player2 = new Player("Player 2");
function timeTostring(timer) {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return (`${minutes}:${seconds.toString().padStart(2, '0')}`);
}
function drawGrid() {
    let sq = true;
    for (let i = 0; i < canvas.width; i += 80) {
        let j = 0;
        sq = !sq;
        for (; j < canvas.height; j += 80) {
            if (sq) {
                ctx.fillStyle = "#364153";
                sq = false;
            }
            else {
                ctx.fillStyle = "#101828";
                sq = true;
            }
            ctx.fillRect(i, j, 80, 80);
        }
    }
}
function drawTimer() {
    ctx.fillStyle = "#fcc800";
    ctx.font = "40px 'Press Start 2P'";
    ctx.textAlign = "center";
    let timer = game.timer;
    if (game.start)
        ctx.fillText(timeTostring(timer), canvas.width * 0.5, canvas.height * 0.5 + 23);
    else if (timer > 1)
        ctx.fillText(timeTostring(timer - 1), canvas.width * 0.5, canvas.height * 0.5 + 23);
    else {
        ctx.fillText("Go !!!", canvas.width * 0.5, canvas.height * 0.5 + 23);
    }
}
function enemyPosx(pos, player) {
    if (pos < 440) {
        if (player === 1)
            return (pos);
        else
            return (1200 - pos);
    }
    if (pos > 1000) {
        if (player === 1)
            return (1440 - pos);
        else
            return (pos - 240);
    }
    else {
        if (player === 1)
            return (439);
        else
            return (759);
    }
}
function enemyPosy(pos) {
    if (pos < 440) {
        return (119);
    }
    if (pos > 1000) {
        return (679);
    }
    else
        return (pos - 321);
}
function drawEnemies() {
    console.log(player1.enemies);
    player1.enemies.forEach(enemy => {
        ctx.fillStyle = "#fcc800";
        ctx.fillRect(enemyPosx(enemy.pos, 1) - 20, enemyPosy(enemy.pos) - 20, 40, 40);
        ctx.fillStyle = "#101828";
        ctx.font = "12px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText(enemy.hp.toString(), enemyPosx(enemy.pos, 1), enemyPosy(enemy.pos) + 20);
    });
    player2.enemies.forEach(enemy => {
        ctx.fillStyle = "#fcc800";
        ctx.fillRect(enemyPosx(enemy.pos, 2) - 20, enemyPosy(enemy.pos) - 20, 40, 40);
        ctx.fillStyle = "#101828";
        ctx.font = "12px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText(enemy.hp.toString(), enemyPosx(enemy.pos, 2), enemyPosy(enemy.pos) + 20);
    });
}
function draw() {
    // Background
    drawGrid();
    drawTimer();
    drawEnemies();
    requestAnimationFrame(draw);
}
draw();
socket.onopen = function () { return console.log("Connected to server"); };
socket.onmessage = function (event) {
    const data = JSON.parse(event.data);
    switch (data.class) {
        case "Game":
            game.level = data.level;
            game.timer = data.timer;
            game.start = data.start;
            break;
        case "Player 1":
            player1.hp = data.hp;
            player1.mana = data.mana;
            player1.enemies.splice(0, player1.enemies.length);
            data.enemies.forEach((enemy) => {
                player1.enemies.push(new Enemy(enemy.type, enemy.hp, enemy.pos, enemy.alive));
            });
            break;
        case "Player 2":
            player2.hp = data.hp;
            player2.mana = data.mana;
            player2.enemies.splice(0, player2.enemies.length);
            data.enemies.forEach((enemy) => {
                player2.enemies.push(new Enemy(enemy.type, enemy.hp, enemy.pos, enemy.alive));
            });
            break;
        default:
            console.warn("Unknown type received:", data);
    }
};
window.addEventListener("keydown", (event) => {
    socket.send(JSON.stringify({ type: "input", key: event.key, state: "down" }));
});
window.addEventListener("keyup", (event) => {
    socket.send(JSON.stringify({ type: "input", key: event.key, state: "up" }));
});
socket.onclose = function () { return console.log("Disconnected"); };
export {};
