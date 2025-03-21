import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, "../public")));

class Game {
    level: number;
    timer: Timer;
    start: boolean;
    constructor(timer: Timer) {
        this.timer = timer;
        this.level = 0;
        this.start = false;
    }
    toJSON() {
        return {class: "Game", level: this.level, timer: this.timer.timeLeft, start: this.start};
    }
}

class Timer {
    timeLeft: number;
    intervalId: ReturnType<typeof setInterval> | null = null;
    constructor(minutes: number, seconds: number) {
        this.timeLeft = minutes * 60 + seconds;
    }
    start() {
        this.intervalId = setInterval(() => {
            if (this.timeLeft > 0)
                this.timeLeft--;
            else
                this.stop();
        }, 1000);
    }
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}

class Enemy {
    type: string;
    hp: number;
    speed: number;
    pos: number;
    damages: number;
    alive: boolean;
    constructor(type: string, hp: number, speed: number, damages: number) {
        this.type = type;
        this.hp = hp;
        this.speed = speed;
        this.pos = 0;
        this.damages = damages;
        this.alive = true;
    }
    toJSON() {
        return {class: "Enemy", type: this.type, hp: this.hp, pos: this.pos, alive: this.alive};
    }
}

function loadEnemies(filePath: string): Enemy[] {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}

let lvl0Enemies = loadEnemies(path.join(__dirname, "../resources/lvl0_enemies.json"));
let lvl1Enemies = loadEnemies(path.join(__dirname, "../resources/lvl1_enemies.json"));
let lvl2Enemies = loadEnemies(path.join(__dirname, "../resources/lvl2_enemies.json"));

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
    clearDeadEnemies() {
        this.enemies = this.enemies.filter(enemy => enemy.alive);
    }
    toJSON() {
        return {class: "Player", name: this.name, hp: this.hp, mana: this.mana, enemies: this.enemies};
    }
}

function enemyGenerator(game: Game) {
    let wave: number;
    switch (game.level) {
        case 0:
            wave = (100 - game.timer.timeLeft) % 10
            if (wave > lvl0Enemies.length)
                wave = lvl0Enemies.length;
            return (new Enemy(lvl0Enemies[wave].type, lvl0Enemies[wave].hp, lvl0Enemies[wave].speed, lvl0Enemies[wave].damages));
        case 1:
            wave = (100 - game.timer.timeLeft) % 10
            if (wave > lvl1Enemies.length)
                wave = lvl1Enemies.length;
            return (new Enemy(lvl1Enemies[wave].type, lvl1Enemies[wave].hp, lvl1Enemies[wave].speed, lvl1Enemies[wave].damages));
        case 2:
            wave = (600 - game.timer.timeLeft) % 10
            if (wave > lvl2Enemies.length)
                wave = lvl2Enemies.length;
            return (new Enemy(lvl2Enemies[wave].type, lvl2Enemies[wave].hp, lvl2Enemies[wave].speed, lvl2Enemies[wave].damages));
        default:
            return (new Enemy(lvl0Enemies[0].type, lvl0Enemies[0].hp, lvl0Enemies[0].speed, lvl0Enemies[0].damages));
    }
}

function enemyLoop (player1: Player, player2: Player, game: Game) {
    player1.enemies.forEach(enemy => {
        enemy.pos += enemy.speed;
        if (enemy.pos >= 1000) {
            player1.hp -= enemy.damages;
            enemy.alive = false;
        }
        if (enemy.hp <= 0) {
            enemy.alive = false;
            player2.addEnemy(enemyGenerator(game));
        }
    });
    player1.clearDeadEnemies();
    player2.enemies.forEach(enemy => {
        enemy.pos += enemy.speed;
        if (enemy.pos >= 1000) {
            player2.hp -= enemy.damages;
            enemy.alive = false;
        }
        if (enemy.hp <= 0) {
            enemy.alive = false;
            player1.addEnemy(enemyGenerator(game));
        }
    });
    player2.clearDeadEnemies();
}

function gameLoop(player1: Player, player2: Player, game: Game) {
    if (game.start) {
        enemyLoop(player1, player2, game);
    }
    setTimeout(() => gameLoop(player1, player2, game), 10);
}

function gameInit(player1: Player, player2: Player, game: Game) {
    if (game.timer.timeLeft === 0) {
        game.timer = new Timer(1, 40);
        game.start = true;
        player1.addEnemy(new Enemy(lvl0Enemies[0].type, lvl0Enemies[0].hp, lvl0Enemies[0].speed, lvl0Enemies[0].damages));
        player2.addEnemy(new Enemy(lvl0Enemies[0].type, lvl0Enemies[0].hp, lvl0Enemies[0].speed, lvl0Enemies[0].damages));
        game.timer.start();
    }
    else
        setTimeout(() => gameInit(player1, player2, game), 100);
}

wss.on("connection", (ws) => {
    console.log("Client connected");
    let player1 = new Player ("Player 1");
    let player2 = new Player ("Player 2");
    let game = new Game(new Timer(0, 4));

    const intervalId = setInterval(() => {
        ws.send(JSON.stringify(player1));
        ws.send(JSON.stringify(player2));
        ws.send(JSON.stringify(game));
    }, 10);
    game.timer.start();
    gameInit(player1, player2, game);
    gameLoop(player1, player2, game);
    ws.on("close", () => {
        clearInterval(intervalId);
        console.log("Client disconnected");
    });
});

server.listen(8080, () => {
    console.log("Server running on http://localhost:8080");
});
