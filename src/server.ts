import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { WebSocket } from "ws";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const inputSchema = z.object({ player: z.number(), button: z.number() });
const towerSchema = z.object({ t1: z.number(), t2: z.number(), t3: z.number(), t4: z.number(), t5: z.number() });

class Game {
    level: number = 0;
    timer: Timer;
    start: boolean = false;
    state: number = 0;
    boss: boolean = false;
    constructor(timer: Timer) {
        this.timer = timer;
    }
    toJSON() {
        return {class: "Game", level: this.level, timer: this.timer.timeLeft, start: this.start, state: this.state, boss: this.boss};
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

class Player {
    name: string;
    hp: number = 3;
    mana: number = 180;
    cost: number = 50;
    enemies: Enemy[] = [];
    deck: Tower[] = [];
    board: Board[] = [];
    socket: WebSocket;
    constructor(name: string, ws: WebSocket) {
        this.name = name;
        this.socket = ws;
        for (let i = 0; i < 5; i++) {
            this.deck.push(allTowers[i].clone());
        }
    }
    addEnemy(enemy: Enemy) {
        this.enemies.push(enemy);
    }
    clearDeadEnemies() {
        this.enemies = this.enemies.filter(enemy => enemy.alive);
    }
    spawnTower() {
        if (this.mana < this.cost || this.board.length >= 20) {
            console.log(`${this.name}: Mana insufficient or board full`);
            return ;
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
       const newTower = this.deck[type].clone();
       setInterval(() => newTower.attack(this.enemies, this.deck[type].level), 10000 / newTower.speed);
       this.board.push(new Board(pos, newTower));
       console.log(`${this.name}: Tower ${this.deck[type].type} spawned at position ${pos}`);
    }
    upTowerRank(tower: number) {
        if (this.mana >= 100 * Math.pow(2, this.deck[tower].level) && this.deck[tower].level < 4) {
            this.mana -= 100 * Math.pow(2, this.deck[tower].level);
            this.deck[tower].level += 1;
        }
    }
    toJSON() {
        return {class: this.name, hp: this.hp, mana: this.mana, cost: this.cost, enemies: this.enemies, deck: this.deck, board: this.board};
    }
}

class Tower {
    type: string;
    speed: number;
    damages: number;
    area: number;
    effect: string;
    level: number = 1;
    constructor(type: string, speed: number, damages: number, area: number, effect: string) {
        this.type = type;
        this.speed = speed;
        this.damages = damages;
        this.area = area;
        this.effect = effect;
    }
    attack (enemies: Enemy[], rank: number) {
        let maxpos = -1;
        for (let i = 0; i < enemies.length; i++) {
            if (enemies[i].alive && enemies[i].pos > maxpos) {
                maxpos = enemies[i].pos;
            }
        }
        if (maxpos === -1)
            return ;
        if (this.area === 0) {
            for (let i = 0; i < enemies.length; i++) {
                if (enemies[i].alive && enemies[i].pos === maxpos) {
                    enemies[i].hp -= this.damages * rank;
                    if (this.effect === "stun") {
                        enemies[i].stun = true;
                        setTimeout(() => {enemies[i].stun = false;}, 500);
                    }
                    break;
                }
            }
        } else {
            enemies.forEach(enemy => {
                if (enemy.alive && enemy.pos <= maxpos + this.area && enemy.pos >= maxpos - this.area) {
                    enemy.hp -= this.damages * rank;
                    if (this.effect === "slow") {
                        enemy.slow = 0.6;
                        setTimeout(() => {enemy.slow = 1;}, 1000);
                    }
                }
            });
        }
    }
    clone() {
        return new Tower(this.type, this.speed, this.damages, this.area, this.effect);
    }
    toJSON() {
        return {class: "Tower", type: this.type, speed: this.speed, damages: this.damages, area: this.area, effect: this.effect, level: this.level};
    }
}

class Board {
    pos: number;
    tower: Tower;
    constructor(pos: number, tower: Tower) {
        this.tower = tower;
        this.pos = pos;
    }
    toJSON() {
        return {class: "Board", pos: this.pos, tower: this.tower};
    }
}

class Enemy {
    type: string;
    hp: number;
    speed: number;
    slow: number = 1;
    stun:boolean = false;
    pos: number = 0;
    damages: number;
    alive: boolean = true;
    constructor(type: string, hp: number, speed: number, damages: number) {
        this.type = type;
        this.hp = hp;
        this.speed = speed;
        this.damages = damages;
    }
    clone () {
        return(new Enemy(this.type, this.hp, this.speed, this.damages));
    }
    toJSON() {
        return {class: "Enemy", type: this.type, hp: this.hp, pos: this.pos, alive: this.alive};
    }
}

function loadTowers(filePath: string): Tower[] {
    const data = fs.readFileSync(filePath, 'utf-8');
    const rawTowers = JSON.parse(data);
    return (rawTowers.map((t: any) => new Tower(t.type, t.speed, t.damages, t.area, t.effect)));
}

function loadEnemies(filePath: string): Enemy[][] {
    const data = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(data);
    return (jsonData.enemies.map((level: any[]) =>
        level.map(enemy => new Enemy(enemy.type, enemy.hp, enemy.speed, enemy.damages))
    ));
}

const enemies: Enemy[][] = loadEnemies(path.join(__dirname, "../resources/enemies.json"));
const allTowers: Tower[] = loadTowers(path.join(__dirname, "../resources/towers.json"));

function checkGameOver(player1: Player, player2: Player, game: Game) {
    if (player1.hp <= 0 || player2.hp <= 0) {
        game.state = 2;
    }
}

function enemyGenerator(game: Game) {
    let wave: number;
    if (game.level != 2)
        wave = Math.floor((100 - game.timer.timeLeft) / 7);
    else
        wave = Math.floor((600 - game.timer.timeLeft) / 7);
    if (wave >= enemies[game.level].length)
        wave = enemies[game.level].length - 1;
    return (enemies[game.level][wave].clone());
}

function enemySpawner(player1: Player, player2: Player, game: Game) {
    if (game.start && game.timer.timeLeft % 8 === 7) { // Change this value to control the spawn rate (%)
        player1.addEnemy(enemyGenerator(game));
        player2.addEnemy(enemyGenerator(game));
    }
    if (game.state !== 1)
        return ;
    setTimeout(() => enemySpawner(player1, player2, game), 1000);
}

function enemyLoop (player1: Player, player2: Player, game: Game) {
    player1.enemies.forEach(enemy => {
        if (!enemy.stun)
            enemy.pos += enemy.speed * enemy.slow;
        if (enemy.pos >= 1440) {
            player1.hp -= enemy.damages;
            enemy.alive = false;
        }
        if (enemy.hp <= 0) {
            enemy.alive = false;
            if (enemy.damages != 2) {
                player1.mana += 100;
                player2.addEnemy(enemyGenerator(game));
            } else
                player1.mana += 10;
        }
    });
    player1.clearDeadEnemies();
    player2.enemies.forEach(enemy => {
        if (!enemy.stun)
            enemy.pos += enemy.speed * enemy.slow;
        if (enemy.pos >= 1440) {
            player2.hp -= enemy.damages;
            enemy.alive = false;
        }
        if (enemy.hp <= 0) {
            enemy.alive = false;
            if (enemy.damages != 2) {
                player2.mana += 100;
                player1.addEnemy(enemyGenerator(game));
            } else
                player2.mana += 10;
        }
    });
    player2.clearDeadEnemies();
    checkGameOver(player1, player2, game);
}

function gameLoop(player1: Player, player2: Player, game: Game) {
    if (game.start) {
        if (game.timer.timeLeft !== 0) {
            enemyLoop(player1, player2, game);
            game.boss = false;
        } else {
            if (!game.boss) {
                const p1Board = player1.enemies.length;
                const p2Board = player2.enemies.length;
                player1.enemies.splice(0, player1.enemies.length);
                player2.enemies.splice(0, player2.enemies.length);
                player1.enemies.push(new Enemy("kslime", 1000 + 100 * p1Board, 1, 2)); // Boss here
                player2.enemies.push(new Enemy("kslime", 1000 + 100 * p2Board, 1, 2));
            }
            enemyLoop(player1, player2, game);
            if (player1.enemies.length === 0 && player2.enemies.length === 0) {
                game.level = 2;
                game.timer = new Timer(1, 40);
                game.timer.start();
                player1.enemies.push(enemyGenerator(game));
                player2.enemies.push(enemyGenerator(game));
            }
            game.boss = true;
        }
    }
    if (game.state !== 1)
        return ;
    setTimeout(() => gameLoop(player1, player2, game), 10);
}

function gameInit(player1: Player, player2: Player, game: Game) {
    if (game.timer.timeLeft === 0) {
        game.timer = new Timer(1, 40); // Duree de la vague 1
        game.start = true;
        player1.addEnemy(enemies[0][0].clone());
        player2.addEnemy(enemies[0][0].clone());
        game.timer.start();
    }
    else
        setTimeout(() => gameInit(player1, player2, game), 100);
}

function mainLoop (player1: Player, player2: Player, game: Game) {
    if (game.state === 1) {
        game.timer.start();
        gameInit(player1, player2, game);
        gameLoop(player1, player2, game);
        enemySpawner(player1, player2, game);
    }
    else
        setTimeout(() => mainLoop(player1, player2, game), 100);
}

wss.on("connection", (ws) => {
    console.log("Client connected");
    let player1 = new Player ("Player 1");
    let player2 = new Player ("Player 2");
    let game = new Game(new Timer(0, 4));

    ws.on("message", (message) => {
        const msg = JSON.parse(message.toString());
        if (msg.event === "click" || msg.event === "keyDown") {
            const {data, success, error} = inputSchema.safeParse(msg);
            if (!success || !data) {
                console.log(error);
                return ;
            }
            const player = data.player === 1 ? player1 : player2;
            switch (data.button) {
                case 5:
                    player.spawnTower();
                    break;
                case 4:
                case 3:
                case 2:
                case 1:
                case 0:
                    player.upTowerRank(data.button);
                    break;
                //case -1:
                //    game.state = 1;
                //    break;
                case -2:
                    player1.mana += 100;
                    player2.mana += 100;
                    break;
                default:
                    break;
            }
        }
        else if (msg.event === "towerInit") {
            const {data, success, error} = towerSchema.safeParse(JSON.parse(message.toString()));
            if (!success || !data) {
                console.log(error);
                return;
            }
            player1.deck.splice(0, player1.deck.length);
            player1.deck.push(allTowers[data.t1].clone());
            player1.deck.push(allTowers[data.t2].clone());
            player1.deck.push(allTowers[data.t3].clone());
            player1.deck.push(allTowers[data.t4].clone());
            player1.deck.push(allTowers[data.t5].clone());
            game.state = 1;
        }
    });

    const intervalId = setInterval(() => {
        ws.send(JSON.stringify(player1));
        ws.send(JSON.stringify(player2));
        ws.send(JSON.stringify(game));
    }, 10);
    allTowers.forEach((tower: Tower) => {
        ws.send(JSON.stringify(tower));
    });
    mainLoop(player1, player2, game);

    ws.on("close", () => {
        clearInterval(intervalId);
        console.log("Client disconnected");
    });
});


class Room {
    id: number;
    players: Player[] = [];
    constructor (id: number, player: Player) {
        this.id = id;
        this.players.push(player);
    }
}

let rooms: Room[] = [];

function joinRoom(player: Player) {
    let id: number = -1;
    let i : number = 0;
    for (; i < rooms.length; i++) {
        if (rooms[i].players.length === 1) {
            rooms[i].players.push(player);
            id = rooms[i].id;
            break ;
        }
    }
    if (id === -1) {
        let room = new Room(rooms.length, player);
        rooms.push(room);
        return ;
    }
    let game = new Game(new Timer(0, 4));
    const intervalId = setInterval(() => {
        let i = rooms.findIndex(room => room.id === id);
        if (i === -1) {
            clearInterval(intervalId);
            return;
        }
        rooms[i].players[0].ws.send(JSON.stringify(rooms[i].players[0]));
        rooms[i].players[0].ws.send(JSON.stringify(rooms[i].players[1]));
        rooms[i].players[0].ws.send(JSON.stringify(game));
        rooms[i].players[1].ws.send(JSON.stringify(rooms[i].players[0].paddle));
        rooms[i].players[1].ws.send(JSON.stringify(rooms[i].players[1].paddle));
        rooms[i].players[1].ws.send(JSON.stringify(game));
    }, 10);

}

const fastify = Fastify({
    logger: true
});

fastify.register(fastifyWebsocket);

fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (socket, req) => {
        console.log("Client connected");
        let player = new Player("Player 1", socket);
        allTowers.forEach((tower: Tower) => {
            socket.send(JSON.stringify(tower));
        });
        socket.on("message", (message) => {
            const msg = JSON.parse(message.toString());
            if (msg.event === "click" || msg.event === "keyDown") {
                const {data, success, error} = inputSchema.safeParse(msg);
                if (!success || !data) {
                    console.log(error);
                    return ;
                }
                const player = data.player === 1 ? player1 : player2;
                switch (data.button) {
                    case 5:
                        player.spawnTower();
                        break;
                    case 4:
                    case 3:
                    case 2:
                    case 1:
                    case 0:
                        player.upTowerRank(data.button);
                        break;
                    //case -1:
                    //    game.state = 1;
                    //    break;
                    case -2:
                        player1.mana += 100;
                        player2.mana += 100;
                        break;
                    default:
                        break;
                }
            }
            else if (msg.event === "towerInit") {
                const {data, success, error} = towerSchema.safeParse(JSON.parse(message.toString()));
                if (!success || !data) {
                    console.log(error);
                    return;
                }
                player1.deck.splice(0, player1.deck.length);
                player1.deck.push(allTowers[data.t1].clone());
                player1.deck.push(allTowers[data.t2].clone());
                player1.deck.push(allTowers[data.t3].clone());
                player1.deck.push(allTowers[data.t4].clone());
                player1.deck.push(allTowers[data.t5].clone());
                game.state = 1;
            }
        });
        socket.on("close", () => {
            console.log("Client disconnected");
        });
        joinRoom(player);
    });
});

fastify.listen({ port: 8080, host: '0.0.0.0' }, (err, adrr) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`server running on ${adrr}`)
});