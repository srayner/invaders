// Aliases
let Application = PIXI.Application,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    Sprite = PIXI.Sprite;

// Create a Pixi Application
let app = new Application({
    width: 640,
    height: 480,
    antialias: true,
    transparent: false,
    resolution: 1
});

// Global vaiables
let swarm = {};
let alien;
let gun;
let playerLaser;
let tick = 0;
let pulseCount = 0;
let pulse = [];



// Keyboard Handling
let left = keyboard(37);
let right = keyboard(39);
let fire = keyboard(32);

right.press = () => {
    gun.vx = 3;
};

right.release = () => {
    gun.vx = 0;
}

left.press = () => {
    gun.vx = -3;
};

left.release = () => {
    gun.vx = 0;
}

fire.press = () => {
    playerLaser.x = gun.x;
    playerLaser.y = gun.y - 16;

    playerLaser.visible = true;
    playerLaser.vy = -6;
}

// Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

// Load an image and run the `setup` function when it's done
loader
    .add("alien.png")
    .add("gun.png")
    .load(setup);

sounds.load([
    "fastinvader1.wav",
    "fastinvader2.wav",
    "fastinvader3.wav",
    "fastinvader4.wav"
]);
sounds.whenLoaded = function(){
    pulse.push(sounds["fastinvader1.wav"]);
    pulse.push(sounds["fastinvader2.wav"]);
    pulse.push(sounds["fastinvader3.wav"]);
    pulse.push(sounds["fastinvader4.wav"]);
}

// This `setup` function will run when the images have loaded.
function setup() {
    
    swarm.aliens = [];
    for (var j=1; j<=3; j++) {
        for (var i=1; i<=10; i++) {
            alien = new Sprite(resources["alien.png"].texture);
            alien.x = (i * 48) + 32;
            console.log (alien.x);
            alien.y = (j * 48) + 32;
            swarm.aliens.push(alien);
            app.stage.addChild(alien);
        }
    }
    swarm.vx = 8;
    swarm.vy = 0;

    gun = new Sprite(resources["gun.png"].texture);
    gun.x = 320 - 16;
    gun.y = 480 - 48;
    gun.vx = 0;
    app.stage.addChild(gun);

    playerLaser = new Sprite(resources["alien.png"].texture);
    playerLaser.x = gun.x;
    playerLaser.y = gun.y - 16;
    playerLaser.vx = 0;
    playerLaser.vy = 0;
    playerLaser.visible = false;
    app.stage.addChild(playerLaser);
    
    app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta) {

    tick++;
    if (tick > 32) {
        pulseCount++;
        if (pulseCount > 3) {
            pulseCount = 0;
        }
        updateSwarm();
        pulse[pulseCount].play();
        tick = 0;
    }
    updateGun();
    updatePlayerLaser();
}

function updateGun() {
    gun.x += gun.vx;
}

function updatePlayerLaser() {
    playerLaser.y += playerLaser.vy;
    if (playerLaser.y < 0) {
        playerLaser.vy = 0;
        playerLaser.visible = false;
    }
}

function updateSwarm()
{
    var dx = swarm.vx;

    swarm.aliens.forEach(alien => {
        if (dx > 0 && alien.x >= (640 - 32)) {
            dx = -8;
            swarm.vx = 0;
            swarm.vy = 16;
        }
        if (dx < 0 && alien.x <= 0) {
            dx = 8;
            swarm.vx = 0;
            swarm.vy = 16;
        }
    });

    swarm.aliens.forEach(alien => {
        alien.x += swarm.vx;
        alien.y += swarm.vy;
    });

    swarm.vx = dx;
    swarm.vy = 0;

}

function keyboard(keyCode) {
    let key = {};
    key.code = keyCode;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;

    // The `downHandler`
    key.downHandler = event => {
        if (event.keyCode === key.code) {
            if (key.isUp && key.press) key.press();
            key.isDown = true;
            key.isUp = false;
        }
        event.preventDefault();
    };

    // The `upHandler`
    key.upHandler = event => {
        if (event.keyCode === key.code) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
        }
        event.preventDefault();
    };

    //  Attach event listeners
    window.addEventListener(
        "keydown", key.downHandler.bind(key), false
    );
    window.addEventListener(
        "keyup", key.upHandler.bind(key), false
    );
    return key;
}
