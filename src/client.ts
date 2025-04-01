const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const socket = new WebSocket("ws://localhost:8080");
let frame: number = 0;

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
    hp: number = 3;
    mana: number = 210;
    cost: number = 60;
    enemies: Enemy[];
    deck: Tower[];
    board: Board[];
    constructor(name: string) {
        this.name = name;
        this.enemies = [];
        this.deck = [];
        this.board = [];
    }
    addEnemy(enemy: Enemy) {
        this.enemies.push(enemy);
    }
}

class Tower {
    type: string;
    speed: number;
    damages: number;
    area: boolean;
    effect: string;
    level: number;
    constructor(type: string, speed: number, damages: number, area: boolean, effect: string, level: number) {
        this.type = type;
        this.speed = speed;
        this.damages = damages;
        this.area = area;
        this.effect = effect;
        this.level = level;
    }
}

class Board {
    pos: number;
    tower: Tower;
    constructor(pos: number, tower: Tower) {
        this.tower = tower;
        this.pos = pos;
    }
}

class Assets {
    images: Record<string, HTMLImageElement> = {};
    constructor() {
        this.loadImages();
    }
    private loadImages() {
        const assetsFolder = "./assets/";
        const imageNames = ["poop0.png", "poop1.png", "bat.png", "slime.png", "addTower.png", "fire.png", "ice.png", "earth.png"]; // On remplacera cette liste par un fetch auto côté backend si besoin

        for (const name of imageNames) {
            const key = name.split(".")[0];
            const img = new Image();
            img.src = `${assetsFolder}${name}`;
            this.images[key] = img;
        }
    }
    getImage(name: string): HTMLImageElement | undefined {
        return (this.images[name]);
    }
    getAnImage(name: string): HTMLImageElement | undefined {
        if (frame % 20 < 10) {
            if (this.images[`${name}0`])
                return (this.images[`${name}0`]);
        }
        else {
            if (this.images[`${name}1`])
                return (this.images[`${name}1`]);
        }
        return (this.images[name]);
    }
}

const assets = new Assets();
const tile = 80;
let game = new Game;
let player1 = new Player("Player 1");
let player2 = new Player("Player 2");

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

function enemyPosy(pos: number) {
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
    player1.enemies.forEach(enemy => {
        if (enemy.pos < 480)
            ctx.drawImage(assets.getAnImage(enemy.type)!, enemyPosx(enemy.pos, 1) - 35, enemyPosy(enemy.pos) - 35, 70, 70);
        else {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(assets.getAnImage(enemy.type)!, -1 * (enemyPosx(enemy.pos, 1) - 35) - 70, enemyPosy(enemy.pos) - 35, 70, 70);
            ctx.restore();
        }
        ctx.fillStyle = "#fcc800";
        ctx.font = "16px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText(enemy.hp.toString(), enemyPosx(enemy.pos, 1), enemyPosy(enemy.pos) + 28);
    });
    player2.enemies.forEach(enemy => {
        if (enemy.pos >= 480)
            ctx.drawImage(assets.getAnImage(enemy.type)!, enemyPosx(enemy.pos, 2) - 35, enemyPosy(enemy.pos) - 35, 70, 70);
        else {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(assets.getAnImage(enemy.type)!, -1 * (enemyPosx(enemy.pos, 2) - 35) - 70, enemyPosy(enemy.pos) - 35, 70, 70);
            ctx.restore();
        }
        ctx.fillStyle = "#fcc800";
        ctx.font = "16px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText(enemy.hp.toString(), enemyPosx(enemy.pos, 2), enemyPosy(enemy.pos) + 28);
    });
    frame += 1;
}

function drawButtons() {
    ctx.drawImage(assets.getImage("addTower")!, tile * 6.5 - 35, canvas.height - tile * 0.75 - 35, 70, 70);
    ctx.drawImage(assets.getImage("addTower")!, tile * 8.5 - 35, canvas.height - tile * 0.75 - 35, 70, 70);
    ctx.fillStyle = "#fcc800";
    ctx.font = "16px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.fillText(player1.cost.toString(), tile * 6.5, canvas.height - tile * 0.75 + 22);
    ctx.fillText(player2.cost.toString(), tile * 8.5, canvas.height - tile * 0.75 + 22);
}

function drawTowers() {
    player1.board.forEach(tower => {
        ctx.drawImage(assets.getImage(tower.tower.type)!, tile * (1 + tower.pos % 4), tile * (2 + Math.floor(tower.pos / 4)), tile, tile);
    });
    player2.board.forEach(tower => {
        ctx.drawImage(assets.getImage(tower.tower.type)!, tile * (10 + tower.pos % 4), tile * (2 + Math.floor(tower.pos / 4)), tile, tile);
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
    drawTemplate(); // for debug use
    drawTimer();
    drawEnemies();
    drawButtons();
    drawTowers();
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
            player1.cost = data.cost;
            player1.enemies.splice(0, player1.enemies.length);
            data.enemies.forEach((enemy: Enemy) => {
                player1.enemies.push(new Enemy(enemy.type, enemy.hp, enemy.pos, enemy.alive));
            });
            player1.deck.splice(0, player1.deck.length);
            data.deck.forEach((tower: Tower) => {
                player1.deck.push(new Tower(tower.type, tower.speed, tower.damages, tower.area, tower.effect, tower.level));
            });
            player1.board.splice(0, player1.board.length);
            data.board.forEach((board: Board) => {
                player1.board.push(new Board(board.pos, new Tower(board.tower.type, board.tower.speed, board.tower.damages, board.tower.area, board.tower.effect, board.tower.level)));
            });
            break;
        case "Player 2":
            player2.hp = data.hp;
            player2.mana = data.mana;
            player2.cost = data.cost;
            player2.enemies.splice(0, player2.enemies.length);
            data.enemies.forEach((enemy: Enemy) => {
                player2.enemies.push(new Enemy(enemy.type, enemy.hp, enemy.pos, enemy.alive));
            });
            player2.deck.splice(0, player2.deck.length);
            data.deck.forEach((tower: Tower) => {
                player2.deck.push(new Tower(tower.type, tower.speed, tower.damages, tower.area, tower.effect, tower.level));
            });
            player2.board.splice(0, player2.board.length);
            data.board.forEach((board: Board) => {
                player2.board.push(new Board(board.pos, new Tower(board.tower.type, board.tower.speed, board.tower.damages, board.tower.area, board.tower.effect, board.tower.level)));
            });
            break;
        default:
            console.warn("Unknown type received:", data);
    }
};

canvas.addEventListener("click", (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    if (x >= tile * 6 && x < tile * 7 && y >= canvas.height - tile * 1.25 && y < canvas.height - tile * 0.25) {
        socket.send(JSON.stringify({ event: "clic", player: 1, button: "addTower" }));
        console.log(`Clic détecté aux coordonnées : (${x}, ${y})`);
    }
    if (x >= tile * 8 && x < tile * 9 && y >= canvas.height - tile * 1.25 && y < canvas.height - tile * 0.25) {
        socket.send(JSON.stringify({ event: "clic", player: 2, button: "addTower" }));
        console.log(`Clic détecté aux coordonnées : (${x}, ${y})`);
    }
});

socket.onclose = function () { return console.log("Disconnected"); };