const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const socket = new WebSocket("ws://localhost:8080");
// Main menu and tower selection
function aoeornot(area) {
    if (area !== 0)
        return ("area dmg");
    return ("mono dmg");
}
function isSelected(i) {
    if (selected.includes(i))
        return ("#b329d1");
    return ("#eaeaea");
}
function drawMenu() {
    // Background
    ctx.drawImage(assets.getImage("main"), 0, 0, canvas.width, canvas.height);
    // Title
    ctx.drawImage(assets.getAnImage("rslime"), canvas.width * 0.1, canvas.height * 0.06, 170, 170);
    ctx.drawImage(assets.getAnImage("gslime"), canvas.width * 0.18, canvas.height * 0.17, 80, 80);
    ctx.drawImage(assets.getAnImage("pslime"), canvas.width * 0.11, canvas.height * 0.18, 80, 80);
    frame += 0.75;
    ctx.fillStyle = "#b329d1";
    ctx.strokeStyle = "#0d0d0d";
    ctx.lineWidth = tile / 4;
    ctx.textAlign = "center";
    ctx.font = "64px 'Press Start 2P'";
    ctx.strokeText("Slime Defender", canvas.width * 0.545, canvas.height * 0.25, canvas.width * 0.6);
    ctx.fillText("Slime Defender", canvas.width * 0.545, canvas.height * 0.25, canvas.width * 0.6);
    // Tower Selection
    for (let i = 0; i < allTowers.length; i++) {
        let centerx = (0.18 + Math.floor(i % 5) * 0.16) * canvas.width;
        let centery = (0.54 + Math.floor(i / 5) * 0.16) * canvas.height;
        drawRawButton(centerx, centery, canvas.width * 0.15, canvas.height * 0.15, isSelected(i));
        ctx.drawImage(assets.getImage(`${allTowers[i].type}4`), centerx - tile * 1.1, centery - tile * 0.6, canvas.height * 0.11, canvas.height * 0.11);
        ctx.fillStyle = "#eaeaea";
        ctx.textAlign = "left";
        ctx.font = `${tile / 5}px 'Press Start 2P'`;
        ctx.fillText(`atk: ${allTowers[i].damages}`, centerx, centery - tile * 0.35, canvas.width * 0.06);
        ctx.fillText(`spd: ${allTowers[i].speed}`, centerx, centery - tile * 0.05, canvas.width * 0.06);
        ctx.fillText(aoeornot(allTowers[i].area), centerx, centery + tile * 0.25, canvas.width * 0.06);
        if (allTowers[i].effect !== "none")
            ctx.fillText(allTowers[i].effect, centerx, centery + tile * 0.55, canvas.width * 0.06);
    }
    // Random button
    drawRawButton(canvas.width * 0.63, canvas.height * 0.9, canvas.width * 0.06, canvas.height * 0.06, "#eaeaea");
    if (rdmhover)
        ctx.drawImage(assets.getImage("randomh"), canvas.width * 0.634, canvas.height * 0.9 - tile * 0.125, tile * 0.25, tile * 0.25);
    else
        ctx.drawImage(assets.getImage("random"), canvas.width * 0.634, canvas.height * 0.9 - tile * 0.125, tile * 0.25, tile * 0.25);
    // Start button
    ctx.textAlign = "center";
    ctx.font = `${tile / 4.2}px 'Press Start 2P'`;
    if (selected.length === 5) {
        drawRawButton(canvas.width * 0.5, canvas.height * 0.9, canvas.width * 0.26, canvas.height * 0.1, "#b329d1");
        ctx.fillText("Click to start", canvas.width * 0.5, canvas.height * 0.91, canvas.width * 0.22);
    }
    else {
        drawRawButton(canvas.width * 0.5, canvas.height * 0.9, canvas.width * 0.26, canvas.height * 0.1, "#eaeaea");
        ctx.fillText("Select 5 rocks", canvas.width * 0.5, canvas.height * 0.91, canvas.width * 0.22);
    }
}
// Game classes and functions
class Bullet {
    constructor(type, rank, pos, target, travel) {
        this.type = type;
        this.rank = rank;
        this.pos = pos;
        this.target = target;
        this.travel = travel;
    }
}
class Game {
    constructor() {
        this.level = 0;
        this.timer = 4;
        this.start = false;
        this.state = 0;
        this.boss = false;
    }
}
class Enemy {
    constructor(type, hp, pos) {
        this.type = type;
        this.hp = hp;
        this.pos = pos;
    }
}
class Player {
    constructor(name) {
        this.hp = 3;
        this.mana = 210;
        this.cost = 60;
        this.enemies = [];
        this.deck = [];
        this.board = [];
        this.bullets = [];
        this.name = name;
    }
    addEnemy(enemy) {
        this.enemies.push(enemy);
    }
    addBullet(bullet) {
        this.bullets.push(bullet);
    }
}
class Tower {
    constructor(type, speed, damages, area, effect, level) {
        this.pos = 0;
        this.type = type;
        this.speed = speed;
        this.damages = damages;
        this.area = area;
        this.effect = effect;
        this.level = level;
    }
}
class Board {
    constructor(pos, tower) {
        this.tower = tower;
        this.pos = pos;
    }
}
class Assets {
    constructor() {
        this.images = {};
        this.loadImages();
    }
    loadImages() {
        const assetsFolder = "./assets/";
        const imageNames = ["black1.png", "black2.png", "black3.png", "black4.png",
            "blue1.png", "blue2.png", "blue3.png", "blue4.png",
            "green1.png", "green2.png", "green3.png", "green4.png",
            "orange1.png", "orange2.png", "orange3.png", "orange4.png",
            "pink1.png", "pink2.png", "pink3.png", "pink4.png",
            "red1.png", "red2.png", "red3.png", "red4.png",
            "violet1.png", "violet2.png", "violet3.png", "violet4.png",
            "white1.png", "white2.png", "white3.png", "white4.png",
            "yellow1.png", "yellow2.png", "yellow3.png", "yellow4.png",
            "ygreen1.png", "ygreen2.png", "ygreen3.png", "ygreen4.png",
            "main.png", "addTower.png", "hp.png", "mana.png", "random.png", "randomh.png",
            "map0.png", "map1.png", "map2.png", "map3.png", "map4.png",
            "poop0.png", "poop1.png",
            "bslime0.png", "bslime1.png",
            "gslime0.png", "gslime1.png",
            "yslime0.png", "yslime1.png",
            "rslime0.png", "rslime1.png",
            "pslime0.png", "pslime1.png",
            "dslime0.png", "dslime1.png",
            "kslime0.png", "kslime1.png"];
        for (const name of imageNames) {
            const key = name.split(".")[0];
            const img = new Image();
            img.src = `${assetsFolder}${name}`;
            this.images[key] = img;
        }
    }
    getImage(name) {
        return (this.images[name]);
    }
    getAnImage(name) {
        if (frame % 30 < 15) {
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
let frame = 0;
const assets = new Assets();
const tile = canvas.width / 15;
let game = new Game;
let player1 = new Player("Player 1");
let player2 = new Player("Player 2");
const nmap = Math.floor(Math.random() * 5);
let allTowers = [];
let selected = [];
let rdmhover = false;
let bullets = [];
function timeTostring(timer) {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return (`${minutes}:${seconds.toString().padStart(2, '0')}`);
}
function drawBullets() {
    //console.log(bullets);
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
    ctx.lineWidth = tile * 0.1;
    ctx.font = `${tile * 0.5}px 'Press Start 2P'`;
    ctx.textAlign = "center";
    let timer = game.timer;
    if (game.start) {
        if (!game.boss) {
            ctx.strokeText(timeTostring(timer), canvas.width * 0.5, canvas.height * 0.5 + tile * 0.25);
            ctx.fillText(timeTostring(timer), canvas.width * 0.5, canvas.height * 0.5 + tile * 0.25);
        }
        else {
            ctx.strokeText("Boss", canvas.width * 0.5, canvas.height * 0.5 + tile * 0.25);
            ctx.fillText("Boss", canvas.width * 0.5, canvas.height * 0.5 + tile * 0.25);
        }
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
    player1.enemies.forEach(enemy => {
        if (enemy.pos < 480)
            ctx.drawImage(assets.getAnImage(enemy.type), enemyPosx(enemy.pos, 1) - tile * 0.5, enemyPosy(enemy.pos) - tile * 0.5, tile, tile);
        else {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(assets.getAnImage(enemy.type), -1 * (enemyPosx(enemy.pos, 1) - tile * 0.5) - 70, enemyPosy(enemy.pos) - tile * 0.5, tile, tile);
            ctx.restore();
        }
        ctx.fillStyle = "#eaeaea";
        ctx.font = "16px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText(enemy.hp.toString(), enemyPosx(enemy.pos, 1), enemyPosy(enemy.pos) + 28);
    });
    player2.enemies.forEach(enemy => {
        if (enemy.pos >= 480)
            ctx.drawImage(assets.getAnImage(enemy.type), enemyPosx(enemy.pos, 2) - tile * 0.5, enemyPosy(enemy.pos) - tile * 0.5, tile, tile);
        else {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(assets.getAnImage(enemy.type), -1 * (enemyPosx(enemy.pos, 2) - tile * 0.5) - 70, enemyPosy(enemy.pos) - tile * 0.5, tile, tile);
            ctx.restore();
        }
        ctx.fillStyle = "#eaeaea";
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
    if (type === "black")
        return ("#030303");
    if (type === "orange")
        return ("#ff8000");
    if (type === "pink")
        return ("#e74fff");
    if (type === "violet")
        return ("#b329d1");
    if (type === "ygreen")
        return ("#b8dc04");
    return ("black");
}
function drawRawButton(centerx, centery, sizex, sizey, border) {
    const old = ctx.fillStyle;
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
    for (let i = 0; i < player1.deck.length && i < player2.deck.length; i++) {
        // Player 1
        drawRawButton(tile * (0.5 + i), canvas.height - tile * 0.75, tile * 0.9, tile * 1.3, getTowerColor(player1.deck[i].type));
        ctx.drawImage(assets.getImage(`${player1.deck[i].type}${player1.deck[i].level}`), tile * (0.5 + i) - 28, canvas.height - tile - 28, 56, 56);
        ctx.fillStyle = "#eaeaea";
        if (player1.deck[i].level !== 4) {
            ctx.fillText(`Lv. ${player1.deck[i].level}`, tile * (0.5 + i), canvas.height - tile * 0.55, 50);
            ctx.fillText(`Up: ${100 * Math.pow(2, player1.deck[i].level)}`, tile * (0.5 + i), canvas.height - tile * 0.25, 50);
        }
        else
            ctx.fillText(`Lv. max`, tile * (0.5 + i), canvas.height - tile * 0.35, 50);
        // Player 2
        drawRawButton(tile * (10.5 + i), canvas.height - tile * 0.75, tile * 0.9, tile * 1.3, getTowerColor(player2.deck[i].type));
        ctx.fillStyle = "#eaeaea";
        ctx.drawImage(assets.getImage(`${player2.deck[i].type}${player2.deck[i].level}`), tile * (10.5 + i) - 28, canvas.height - tile - 28, 56, 56);
        if (player2.deck[i].level !== 4) {
            ctx.fillText(`Lv. ${player2.deck[i].level}`, tile * (10.5 + i), canvas.height - tile * 0.55, 50);
            ctx.fillText(`Up: ${100 * Math.pow(2, player2.deck[i].level)}`, tile * (10.5 + i), canvas.height - tile * 0.25, 50);
        }
        else
            ctx.fillText(`Lv. max`, tile * (10.5 + i), canvas.height - tile * 0.35, 50);
    }
    // HP
    for (let j = 0; j < player1.hp; j++) {
        ctx.drawImage(assets.getImage("hp"), tile * (0.1 + j * 0.6), tile * 0.1, tile * 0.5, tile * 0.5);
    }
    for (let k = 0; k < player2.hp; k++) {
        ctx.drawImage(assets.getImage("hp"), canvas.width - tile * (0.6 + k * 0.6), tile * 0.1, tile * 0.5, tile * 0.5);
    }
}
function getTowerLevel(tower, pNum) {
    const player = pNum === 1 ? player1 : player2;
    for (let i = 0; i < player.deck.length; i++) {
        if (player.deck[i].type === tower.type) {
            return (player.deck[i].level);
        }
    }
}
function drawTowers() {
    player1.board.forEach(tower => {
        ctx.drawImage(assets.getImage(`${tower.tower.type}${getTowerLevel(tower.tower, 1)}`), tile * (0.75 + tower.pos % 4), tile * (1.5 + Math.floor(tower.pos / 4)), tile * 1.4, tile * 1.4);
    });
    player2.board.forEach(tower => {
        ctx.drawImage(assets.getImage(`${tower.tower.type}${getTowerLevel(tower.tower, 2)}`), tile * (9.75 + tower.pos % 4), tile * (1.5 + Math.floor(tower.pos / 4)), tile * 1.4, tile * 1.4);
    });
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
            }
            else {
                ctx.fillStyle = "#101828";
                sq = true;
            }
            ctx.fillRect(i, j, tile, tile);
        }
    }
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
    ctx.drawImage(assets.getImage(`map${nmap}`), 0, 0, canvas.width, canvas.height);
    //drawGrid(); // for debug use only
    //drawTemplate(); // for debug use only
    drawTimer();
    drawEnemies();
    drawButtons();
    drawTowers();
    drawBullets();
}
// EndScreen
function drawEndScreen() {
    ctx.drawImage(assets.getImage(`map${nmap}`), 0, 0, canvas.width, canvas.height);
    drawEnemies();
    drawButtons();
    drawTowers();
    ctx.strokeStyle = "#0d0d0d";
    ctx.lineWidth = tile * 0.2;
    ctx.font = `${tile}px 'Press Start 2P'`;
    ctx.textAlign = "center";
    if (player1.hp > player2.hp) {
        ctx.fillStyle = "#17b645";
        ctx.strokeText("You win!", canvas.width * 0.5, canvas.height * 0.5);
        ctx.fillText("You win!", canvas.width * 0.5, canvas.height * 0.5);
    }
    else if (player2.hp > player1.hp) {
        ctx.fillStyle = "#ab1e00";
        ctx.strokeText("You lose!", canvas.width * 0.5, canvas.height * 0.5);
        ctx.fillText("You lose!", canvas.width * 0.5, canvas.height * 0.5);
    }
    else {
        ctx.fillStyle = "#0075ab";
        ctx.strokeText("Draw!", canvas.width * 0.5, canvas.height * 0.5);
        ctx.fillText("Draw!", canvas.width * 0.5, canvas.height * 0.5);
    }
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
        case 2:
            drawEndScreen();
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
    const data = JSON.parse(event.data);
    let board;
    let i;
    switch (data.class) {
        case "Game":
            game.level = data.level;
            game.timer = data.timer;
            game.start = data.start;
            if (data.state === 2)
                game.state = 2;
            game.boss = data.boss;
            break;
        case "Player 1":
            player1.hp = data.hp;
            player1.mana = data.mana;
            player1.cost = data.cost;
            player1.enemies.splice(0, player1.enemies.length);
            data.enemies.forEach((enemy) => {
                if (enemy)
                    player1.enemies.push(new Enemy(enemy.type, enemy.hp, enemy.pos));
            });
            player1.deck.splice(0, player1.deck.length);
            data.deck.forEach((tower) => {
                player1.deck.push(new Tower(tower.type, tower.speed, tower.damages, tower.area, tower.effect, tower.level));
            });
            for (i = player1.board.length; i < data.board.length; i++) {
                board = data.board[i];
                player1.board.push(new Board(board.pos, new Tower(board.tower.type, board.tower.speed, board.tower.damages, board.tower.area, board.tower.effect, board.tower.level)));
            }
            player1.bullets.splice(0, player1.bullets.length);
            data.bullets.forEach((bullet) => {
                if (bullet)
                    player1.bullets.push(new Bullet(bullet.type, bullet.rank, bullet.pos, bullet.target, bullet.travel));
            });
            break;
        case "Player 2":
            player2.hp = data.hp;
            player2.mana = data.mana;
            player2.cost = data.cost;
            player2.enemies.splice(0, player2.enemies.length);
            data.enemies.forEach((enemy) => {
                if (enemy)
                    player2.enemies.push(new Enemy(enemy.type, enemy.hp, enemy.pos));
            });
            player2.deck.splice(0, player2.deck.length);
            data.deck.forEach((tower) => {
                player2.deck.push(new Tower(tower.type, tower.speed, tower.damages, tower.area, tower.effect, tower.level));
            });
            for (i = player2.board.length; i < data.board.length; i++) {
                board = data.board[i];
                player2.board.push(new Board(board.pos, new Tower(board.tower.type, board.tower.speed, board.tower.damages, board.tower.area, board.tower.effect, board.tower.level)));
            }
            player2.bullets.splice(0, player1.bullets.length);
            data.bullets.forEach((bullet) => {
                if (bullet)
                    player2.bullets.push(new Bullet(bullet.type, bullet.rank, bullet.pos, bullet.target, bullet.travel));
            });
            break;
        case "Tower":
            allTowers.push(new Tower(data.type, data.speed, data.damages, data.area, data.effect, data.level));
            break;
        default:
            console.warn("Unknown type received:", data);
    }
};
window.addEventListener("keydown", (event) => {
    if (event.key === "b")
        socket.send(JSON.stringify({ event: "keyDown", player: 0, button: -2 }));
});
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    switch (game.state) {
        case 0:
            if (x >= 0.1 * canvas.width && x < canvas.width * 0.9 && y >= 0.46 * canvas.height && y < 0.78 * canvas.height) {
                const select = Math.floor((x - 0.1 * canvas.width) / (canvas.width * 0.16)) + 5 * Math.floor((y - 0.46 * canvas.height) / (canvas.height * 0.16));
                if (selected.includes(select)) {
                    const index = selected.indexOf(select);
                    if (index !== -1) {
                        selected.splice(index, 1);
                    }
                }
                else if (selected.length < 5)
                    selected.push(select);
            }
            if (selected.length === 5 && x >= 0.37 * canvas.width && x < 0.63 * canvas.width && y >= 0.85 * canvas.height && y < 0.95 * canvas.height) {
                socket.send(JSON.stringify({ event: "towerInit", t1: selected[0], t2: selected[1], t3: selected[2], t4: selected[3], t5: selected[4] }));
                game.state = 1;
            }
            if (x >= 0.63 * canvas.width && x < 0.66 * canvas.width && y >= 0.87 * canvas.height && y < 0.93 * canvas.height) {
                selected.splice(0, selected.length);
                while (selected.length < 5) {
                    const add = Math.floor(Math.random() * 10);
                    if (!selected.includes(add))
                        selected.push(add);
                }
            }
            break;
        case 1:
            if (y >= canvas.height - tile * 1.25 && y < canvas.height - tile * 0.25) {
                if (x >= 0 && x < tile * 5)
                    socket.send(JSON.stringify({ event: "click", player: 1, button: Math.floor(x / tile) }));
                else if (x >= tile * 6 && x < tile * 7) {
                    socket.send(JSON.stringify({ event: "click", player: 1, button: 5 }));
                }
                else if (x >= tile * 8 && x < tile * 9) {
                    socket.send(JSON.stringify({ event: "click", player: 2, button: 5 }));
                }
                else if (x >= tile * 10 && x < canvas.width)
                    socket.send(JSON.stringify({ event: "click", player: 2, button: Math.floor(x / tile) - 10 }));
            }
            break;
        default:
            break;
    }
});
canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    rdmhover = x >= 0.63 * canvas.width && x < 0.66 * canvas.width && y >= 0.87 * canvas.height && y < 0.93 * canvas.height;
});
socket.onclose = function () { return console.log("Disconnected"); };
export {};
