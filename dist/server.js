import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
app.use(express.static(path.join(__dirname, "../public")));
class Enemy {
    constructor(name, health, speed, damages) {
        this.type = name;
        this.health = health;
        this.speed = speed;
        this.pos = 0;
        this.damages = damages;
    }
    toJSON() {
        return { type: this.type, health: this.health, pos: this.pos };
    }
}
class Player {
    constructor(name) {
        this.name = name;
        this.health = 3;
        this.mana = 210;
        this.enemies = [];
    }
    addEnemy(enemy) {
        this.enemies.push(enemy);
    }
}
function enemyGenerator(player1, player2) {
    let monster = new Enemy("Poop", 10, 10, 1);
    player1.addEnemy(monster);
    player2.addEnemy(monster);
    setTimeout(enemyGenerator, 1000);
}
function enemyLoop(player1, player2) {
    player1.enemies.forEach(enemies => {
        enemies.pos += enemies.speed;
        if (enemies.pos > 1000) {
            player1.health -= enemies.damages;
        }
        // Gerer la disparition d'un enemie
    });
    player2.enemies.forEach(enemies => {
        enemies.pos += enemies.speed;
        if (enemies.pos > 1000) {
            player2.health -= enemies.damages;
        }
        // Pareil
    });
    setTimeout(enemyLoop, 10);
}
/*function gameloop(ws: WebSocket) {
    ws.send(JSON.stringify(player1));
    ws.send(JSON.stringify(player2));
}*/
wss.on("connection", (ws) => {
    console.log("Client connected");
    let player1 = new Player("Player 1");
    let player2 = new Player("Player 2");
    enemyGenerator(player1, player2);
    enemyLoop(player1, player2);
    ws.send(JSON.stringify(player1));
    ws.send(JSON.stringify(player2));
    ws.on("message", (data) => {
        console.log("Données reçues du client :", data.toString());
    });
    ws.on("close", () => console.log("Client disconnected"));
});
server.listen(8080, () => {
    console.log("Server running on http://localhost:8080");
});
