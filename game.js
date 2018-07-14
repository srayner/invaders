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
let shoot, invaderKilled;
let score, scoreText;

// Keyboard Handling
let left = keyboard(37);
let right = keyboard(39);
let fire = keyboard(32);

right.press = () => {
    gun.vx = 6;
};

right.release = () => {
    gun.vx = 0;
}

left.press = () => {
    gun.vx = -6;
};

left.release = () => {
    gun.vx = 0;
}

fire.press = () => {
    playerLaser.x = gun.x + 15;
    playerLaser.y = gun.y;

    playerLaser.visible = true;
    playerLaser.vy = -10;
    shoot.play();
}

// Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

// Load an image and run the `setup` function when it's done
loader
    .add("alien1.png")
    .add("alien2.png")
    .add("alien3.png")
    .add("alienKilled1.png")
    .add("alienKilled2.png")
    .add("alienKilled3.png")
    .add("gun.png")
    .add("laser.png")
    .load(setup);

sounds.load([
    "fastinvader1.wav",
    "fastinvader2.wav",
    "fastinvader3.wav",
    "fastinvader4.wav",
    "shoot.wav",
    "invaderKilled.wav"
]);
sounds.whenLoaded = function(){
    pulse.push(sounds["fastinvader1.wav"]);
    pulse.push(sounds["fastinvader2.wav"]);
    pulse.push(sounds["fastinvader3.wav"]);
    pulse.push(sounds["fastinvader4.wav"]);
    shoot = sounds["shoot.wav"];
    invaderKilled = sounds["invaderKilled.wav"];
}

// This `setup` function will run when the images have loaded.
function setup() {
    
    var images = ['alien1.png', 'alien2.png', 'alien3.png'];
    swarm.aliens = [];
    for (var j=1; j<=3; j++) {
        for (var i=1; i<=10; i++) {
            alien = new Sprite(resources[images[j-1]].texture);
            alien.x = (i * 48) + 32;
            console.log (alien.x);
            alien.y = (j * 32) + 32;
            alien.value = 40 - (j * 10);
            alien.killedSprite = j-1;
            swarm.aliens.push(alien);
            app.stage.addChild(alien);
        }
    }
    swarm.vx = 8;
    swarm.vy = 0;

    alienKilledSprites = [];
    for (var i=1; i<=3; i++) {
        sprite = new Sprite(resources['alienKilled' + i + '.png'].texture);
        sprite.visible = false;
        app.stage.addChild(sprite);
        alienKilledSprites.push(sprite);
    }

    gun = new Sprite(resources["gun.png"].texture);
    gun.x = 320 - 16;
    gun.y = 480 - 48;
    gun.vx = 0;
    app.stage.addChild(gun);

    playerLaser = new Sprite(resources["laser.png"].texture);
    playerLaser.x = gun.x;
    playerLaser.y = gun.y - 16;
    playerLaser.vx = 0;
    playerLaser.vy = 0;
    playerLaser.visible = false;
    app.stage.addChild(playerLaser);
    
    app.ticker.add(delta => gameLoop(delta));

    score = 0;
    style = {
        fontFamily: 'Courier New',
        fontSize: 24,
        fill: ['#ffffff'], 
    }
    scoreText = new PIXI.Text(score, style);
    scoreText.x = 24;
    scoreText.y = 24;
    app.stage.addChild(scoreText);

    livesText = new PIXI.Text(score, style);
    livesText.x = 320;
    livesText.y = 24;
    livesText.text ="lives"
    app.stage.addChild(livesText);
}

function gameLoop(delta) {

    tick++;
    if (tick > 64) {
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
    checkAlienHit();
    scoreText.text = 'score ' + score;

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
        if (alien.visible && dx > 0 && alien.x >= (640 - 32)) {
            dx = -8;
            swarm.vx = 0;
            swarm.vy = 16;
        }
        if (alien.visible && dx < 0 && alien.x <= 0) {
            dx = 8;
            swarm.vx = 0;
            swarm.vy = 16;
        }
    });

    swarm.aliens.forEach(alien => {
        alien.x += swarm.vx;
        alien.y += swarm.vy;
    });

    alienKilledSprites.forEach(sprite => {
        sprite.visible = false;
    });

    swarm.vx = dx;
    swarm.vy = 0;

}

function checkAlienHit() {
    if (playerLaser.visible === false) {
        return;
    }

    lx = playerLaser.x;
    ly = playerLaser.y;
    swarm.aliens.forEach(alien => {
        if (alien.visible && lx +3 >= alien.x && lx <= alien.x + 32 && ly + 12 >= alien.y && ly <= alien.y + 32) {
            alien.visible = false;
            playerLaser.vy = 0;
            playerLaser.visible = false;
            killedSprite = alienKilledSprites[alien.killedSprite];
            killedSprite.x = alien.x;
            killedSprite.y = alien.y+4;
            killedSprite.visible = true;
            invaderKilled.play();
            score = score + alien.value;
        }
    });
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
