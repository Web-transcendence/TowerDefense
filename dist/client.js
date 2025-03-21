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
    constructor(type, hp, speed, damages) {
        this.type = type;
        this.hp = hp;
        this.speed = speed;
        this.pos = 0;
        this.damages = damages;
        this.alive = true;
    }
}
let game = new Game;
function timeTostring(timer) {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return (`${minutes}:${seconds.toString().padStart(2, '0')}`);
}
function draw() {
    // Background
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
    ctx.fillStyle = "#fcc800";
    ctx.font = "40px 'Press Start 2P'";
    ctx.textAlign = "center";
    let timer = game.timer;
    if (game.start)
        ctx.fillText(timeTostring(timer), canvas.width * 0.5, canvas.height * 0.5 + 23);
    else if (timer !== 1)
        ctx.fillText(timeTostring(timer - 1), canvas.width * 0.5, canvas.height * 0.5 + 23);
    else {
        ctx.fillText("Go !!!", canvas.width * 0.5, canvas.height * 0.5 + 23);
    }
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
        case "Player":
            if (data.name === "Player 1") {
            }
            else {
            }
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
