const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const socket = new WebSocket("ws://localhost:8080");

class Game {
    level: number;
    timer: number;
    start: boolean;
    constructor() {
        this.timer = 4;
        this.level = 0;
        this.start = false;
    }
}

class Enemy {
    type: string;
    hp: number;
    pos: number;
    alive: boolean;
    constructor(type: string, hp: number, pos: number, alive: boolean) {
        this.type = type;
        this.hp = hp;
        this.pos = pos;
        this.alive = alive;
    }
}

class Player {
    name: string;
    hp: number;
    mana: number;
    enemies: Enemy[];
    constructor(name: string) {
        this.name = name;
        this.hp = 3;
        this.mana = 210;
        this.enemies = [];
    }
    addEnemy(enemy: Enemy) {
        this.enemies.push(enemy);
    }
}

class Assets {
    Enemy: HTMLImageElement = new Image();
    constructor () {
        this.Enemy.src = "./assets/slime.png";
    }
}

const tile = 80;
let game = new Game;
let player1 = new Player("Player 1");
let player2 = new Player("Player 2");
const assets = new Assets();

function timeTostring(timer: number) {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return (`${minutes}:${seconds.toString().padStart(2, '0')}`);
}

function drawGrid() {
    let sq = true;
    for (let i = 0; i < canvas.width; i += tile) {
        let j = 0;
        sq = !sq;
        for (; j < canvas.height; j += tile) {
            if (sq) {
                ctx.fillStyle = "#364153";
                sq = false;
            } else {
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
    ctx.textAlign = "center"
    let timer = game.timer;
    if (game.start)
        ctx.fillText(timeTostring(timer), canvas.width * 0.5, canvas.height * 0.5 + 23);
    else if (timer > 1)
        ctx.fillText(timeTostring(timer - 1), canvas.width * 0.5, canvas.height * 0.5 + 23);
    else {
        ctx.fillText("Go !!!", canvas.width * 0.5, canvas.height * 0.5 + 23);
    }
}

function enemyPosx(pos: number, player: number) {
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

function enemyPosy(pos: number) {
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
    player1.enemies.forEach(enemy => {
        ctx.drawImage(assets.Enemy, enemyPosx(enemy.pos, 1) - 35, enemyPosy(enemy.pos) - 35, 70, 70)
        ctx.fillStyle = "#fcc800";
        ctx.font = "16px 'Press Start 2P'";
        ctx.textAlign = "center"
        ctx.fillText(enemy.hp.toString(), enemyPosx(enemy.pos, 1), enemyPosy(enemy.pos) + 28);
    });
    player2.enemies.forEach(enemy => {
        ctx.drawImage(assets.Enemy, enemyPosx(enemy.pos, 2) - 35, enemyPosy(enemy.pos) - 35, 70, 70)
        ctx.fillStyle = "#fcc800";
        ctx.font = "16px 'Press Start 2P'";
        ctx.textAlign = "center"
        ctx.fillText(enemy.hp.toString(), enemyPosx(enemy.pos, 2), enemyPosy(enemy.pos) + 28);
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
            data.enemies.forEach((enemy: Enemy) => {
                player1.enemies.push(new Enemy(enemy.type, enemy.hp, enemy.pos, enemy.alive));
            });
            break;
        case "Player 2":
            player2.hp = data.hp;
            player2.mana = data.mana;
            player2.enemies.splice(0, player2.enemies.length);
            data.enemies.forEach((enemy: Enemy) => {
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

canvas.addEventListener("click", (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect(); // Récupère la position du canvas
    const scaleX = canvas.width / rect.width; // Gestion du scaling si besoin
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    if (x >= 40 && x < 120 && y <= 360 && y > 440)
        socket.send(JSON.stringify({ type: "clic" }));
    //console.log(`Clic détecté aux coordonnées : (${x}, ${y})`);
});

socket.onclose = function () { return console.log("Disconnected"); };