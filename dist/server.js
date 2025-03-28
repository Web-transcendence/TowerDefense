import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import * as fs from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const inputSchema = z.object({ player: z.number(), button: z.string() });
app.use(express.static(path.join(__dirname, "../public")));
class Game {
    constructor(timer) {
        this.timer = timer;
        this.level = 0;
        this.start = false;
    }
    toJSON() {
        return { class: "Game", level: this.level, timer: this.timer.timeLeft, start: this.start };
    }
}
class Timer {
    constructor(minutes, seconds) {
        this.intervalId = null;
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
class Player {
    constructor(name) {
        this.hp = 3;
        this.mana = 210;
        this.cost = 60;
        this.name = name;
        this.enemies = [];
        this.deck = loadTowers(path.join(__dirname, "../resources/towers.json"));
        this.board = [];
    }
    addEnemy(enemy) {
        this.enemies.push(enemy);
    }
    clearDeadEnemies() {
        this.enemies = this.enemies.filter(enemy => enemy.alive);
    }
    spawnTower() {
        if (this.mana < this.cost || this.board.length > 20) {
            console.log(`${this.name}: Mana insufficient or board full`);
            return;
        }
        this.mana -= this.cost;
        this.cost += 10;
        let pos = -1;
        while (pos === -1) {
            pos = Math.floor(Math.random() * 20);
            if (this.board.find(item => item.pos === pos))
                pos = -1;
        }
        const type = Math.floor(Math.random() * this.deck.length);
        this.board.push(new Board(pos, this.deck[type]));
        console.log(`${this.name}: Tower ${this.deck[type].type} spawned at position ${pos}`);
    }
    toJSON() {
        return { class: this.name, hp: this.hp, mana: this.mana, cost: this.cost, enemies: this.enemies, deck: this.deck, board: this.board };
    }
}
function loadTowers(filePath) {
    const data = fs.readFileSync(filePath, 'utf-8');
    return (JSON.parse(data));
}
class Tower {
    constructor(type, speed, damages, area, effect) {
        this.level = 1;
        this.type = type;
        this.speed = speed;
        this.damages = damages;
        this.area = area;
        this.effect = effect;
    }
    toJSON() {
        return { class: "Tower", type: this.type, speed: this.speed, damages: this.damages, area: this.area, effect: this.effect, level: this.level };
    }
}
class Board {
    constructor(pos, tower) {
        this.tower = tower;
        this.pos = pos;
    }
    toJSON() {
        return { class: "Board", pos: this.pos, tower: this.tower };
    }
}
class Enemy {
    constructor(type, hp, speed, damages) {
        this.type = type;
        this.hp = hp;
        this.speed = speed;
        this.pos = 0;
        this.damages = damages;
        this.alive = true;
    }
    toJSON() {
        return { class: "Enemy", type: this.type, hp: this.hp, pos: this.pos, alive: this.alive };
    }
}
function loadEnemies(filePath) {
    const data = fs.readFileSync(filePath, 'utf-8');
    return (JSON.parse(data));
}
let lvl0Enemies = loadEnemies(path.join(__dirname, "../resources/lvl0_enemies.json"));
let lvl1Enemies = loadEnemies(path.join(__dirname, "../resources/lvl1_enemies.json"));
let lvl2Enemies = loadEnemies(path.join(__dirname, "../resources/lvl2_enemies.json"));
function enemyGenerator(game) {
    let wave;
    switch (game.level) {
        case 0:
            wave = Math.floor((100 - game.timer.timeLeft) / 10);
            if (wave >= lvl0Enemies.length)
                wave = lvl0Enemies.length - 1;
            return (new Enemy(lvl0Enemies[wave].type, lvl0Enemies[wave].hp, lvl0Enemies[wave].speed, lvl0Enemies[wave].damages));
        case 1:
            wave = Math.floor((100 - game.timer.timeLeft) / 10);
            if (wave >= lvl1Enemies.length)
                wave = lvl1Enemies.length - 1;
            return (new Enemy(lvl1Enemies[wave].type, lvl1Enemies[wave].hp, lvl1Enemies[wave].speed, lvl1Enemies[wave].damages));
        case 2:
            wave = Math.floor((600 - game.timer.timeLeft) / 10);
            if (wave >= lvl2Enemies.length)
                wave = lvl2Enemies.length - 1;
            return (new Enemy(lvl2Enemies[wave].type, lvl2Enemies[wave].hp, lvl2Enemies[wave].speed, lvl2Enemies[wave].damages));
        default:
            return (new Enemy(lvl0Enemies[0].type, lvl0Enemies[0].hp, lvl0Enemies[0].speed, lvl0Enemies[0].damages));
    }
}
function enemySpawner(player1, player2, game) {
    if (game.start && game.timer.timeLeft % 10 === 5) {
        player1.addEnemy(enemyGenerator(game));
        player2.addEnemy(enemyGenerator(game));
    }
    setTimeout(() => enemySpawner(player1, player2, game), 1000);
}
function enemyLoop(player1, player2, game) {
    player1.enemies.forEach(enemy => {
        enemy.pos += enemy.speed;
        if (enemy.pos >= 1440) {
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
        if (enemy.pos >= 1440) {
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
function gameLoop(player1, player2, game) {
    if (game.start) {
        enemyLoop(player1, player2, game);
    }
    setTimeout(() => gameLoop(player1, player2, game), 10);
}
function gameInit(player1, player2, game) {
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
    let player1 = new Player("Player 1");
    let player2 = new Player("Player 2");
    let game = new Game(new Timer(0, 4));
    ws.on("message", (message) => {
        const { data, success, error } = inputSchema.safeParse(JSON.parse(message.toString()));
        if (!success || !data) {
            console.error(error);
            return;
        }
        switch (data.player) {
            case 1:
                player1.spawnTower();
                break;
            case 2:
                player2.spawnTower();
                break;
            default:
                break;
        }
    });
    const intervalId = setInterval(() => {
        ws.send(JSON.stringify(player1));
        ws.send(JSON.stringify(player2));
        ws.send(JSON.stringify(game));
    }, 10);
    game.timer.start();
    gameInit(player1, player2, game);
    gameLoop(player1, player2, game);
    enemySpawner(player1, player2, game);
    ws.on("close", () => {
        clearInterval(intervalId);
        console.log("Client disconnected");
    });
});
server.listen(8080, () => {
    console.log("Server running on http://localhost:8080");
});
