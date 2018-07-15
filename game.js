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
let invaderLasers = [];
let tick = 0;
let tickReset = 45;
let pulseCount = 0;
let pulse = [];
let shoot, invaderKilled;
let score, scoreText;
let playKilled, explosion;
let lifeImages = [], lives;
let gameState = 'play';
let invaderQty;

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
    .add('alien1', 'sprites/alien1.png')
    .add('alien2', 'sprites/alien2.png')
    .add('alien3', 'sprites/alien3.png')
    .add('alienKilled1', 'sprites/alienKilled1.png')
    .add('alienKilled2', 'sprites/alienKilled2.png')
    .add('alienKilled3', 'sprites/alienKilled3.png')
    .add('gun', 'sprites/gun.png')
    .add('playerKilled', 'sprites/playerKilled.png')
    .add('laser', 'sprites/laser.png')
    .add('invaderLaser', 'sprites/invaderLaser.png')
    .load(setup);

sounds.load([
    "sounds/fastinvader1.wav",
    "sounds/fastinvader2.wav",
    "sounds/fastinvader3.wav",
    "sounds/fastinvader4.wav",
    "sounds/shoot.wav",
    "sounds/invaderKilled.wav",
    "sounds/explosion.wav"
]);
sounds.whenLoaded = function(){
    pulse.push(sounds["sounds/fastinvader1.wav"]);
    pulse.push(sounds["sounds/fastinvader2.wav"]);
    pulse.push(sounds["sounds/fastinvader3.wav"]);
    pulse.push(sounds["sounds/fastinvader4.wav"]);
    shoot = sounds["sounds/shoot.wav"];
    invaderKilled = sounds["sounds/invaderKilled.wav"];
    explosion = sounds["sounds/explosion.wav"];
}

// This `setup` function will run when the images have loaded.
function setup() {
    
    var images = ['alien1', 'alien2', 'alien3'];
    swarm.aliens = [];
    invaderQty = 0;
    for (var j=1; j<=3; j++) {
        for (var i=1; i<=10; i++) {
            alien = new Sprite(resources[images[j-1]].texture);
            alien.x = (i * 48) + 32;
            alien.y = (j * 32) + 32;
            alien.value = 40 - (j * 10);
            alien.killedSprite = j-1;
            swarm.aliens.push(alien);
            app.stage.addChild(alien);
            invaderQty++;
        }
    }
    swarm.vx = 8;
    swarm.vy = 0;

    alienKilledSprites = [];
    for (var i=1; i<=3; i++) {
        sprite = new Sprite(resources['alienKilled' + i].texture);
        sprite.visible = false;
        app.stage.addChild(sprite);
        alienKilledSprites.push(sprite);
    }

    gun = new Sprite(resources["gun"].texture);
    gun.x = 320 - 16;
    gun.y = 480 - 48;
    gun.vx = 0;
    app.stage.addChild(gun);

    playerKilled = new Sprite(resources["playerKilled"].texture);
    playerKilled.visible = false;
    app.stage.addChild(playerKilled);

    for (i=1; i<=3; i++) {
        life = new Sprite(resources["gun"].texture);
        life.x = 430 + (i * 40);
        life.y = 20;
        lifeImages.push(life);
        app.stage.addChild(life);
    };

    playerLaser = new Sprite(resources["laser"].texture);
    playerLaser.x = gun.x;
    playerLaser.y = gun.y - 16;
    playerLaser.vx = 0;
    playerLaser.vy = 0;
    playerLaser.visible = false;
    app.stage.addChild(playerLaser);
    
    invaderLaser = new Sprite(resources["invaderLaser"].texture);
    invaderLaser.visible = false;
    app.stage.addChild(invaderLaser);

    app.ticker.add(delta => gameLoop(delta));

    score = 0;
    lives = 3
    style = {
        fontFamily: 'Courier New',
        fontSize: 24,
        fill: ['#ffffff'], 
    }
    scoreText = new PIXI.Text(score, style);
    scoreText.x = 32;
    scoreText.y = 24;
    app.stage.addChild(scoreText);

    livesText = new PIXI.Text('lives', style);
    livesText.x = 380;
    livesText.y = 24;
    app.stage.addChild(livesText);
    
}

function gameLoop(delta) {
    if (gameState == 'play') {
        play(delta);
    }
}

function play(delta) {
    if (gun.visible === false) {
        sleep(1000);
        playerKilled.visible = false;
        gun.visible = true;
    }

    tick++;
    if (tick > tickReset) {
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
    updateInvaderLasers();
    checkAlienHit();
    checkPlayerHit();
    scoreText.text = 'score ' + score;
    checkLevelEnd();
    checkGameOver();
}

function checkPlayerHit() {
    invaderLasers.forEach(invaderLaser => {
        if (invaderLaser.visible && hitTestRectangle(invaderLaser, gun)) {
            explosion.play();
            invaderLaser.visible = false;
            gun.visible = false;
            playerKilled.x = gun.x;
            playerKilled.y = gun.y;
            playerKilled.visible = true;
            lives--;
            gun.x = 64;
        }
    })
}

function checkGameOver()
{
    lifeImages[2].visible = lives > 2;
    lifeImages[1].visible = lives > 1;
    lifeImages[0].visible = lives > 0;
    if (lives < 1) {
        gameState = 'end';
    }
}

function checkLevelEnd()
{
    if (invaderQty <= 0) {
        gameState = 'end';
    }
}

function updateGun() {
    gun.x += gun.vx;
}

function updatePlayerLaser() {
    playerLaser.y += playerLaser.vy;
    if (playerLaser.y < 64) {
        playerLaser.vy = 0;
        playerLaser.visible = false;
    }
}

function updateInvaderLasers() {
    invaderLasers.forEach(invaderLaser => {
        invaderLaser.y += invaderLaser.vy;
        if (invaderLaser.y === gun.y+32) {
            invaderLaser.vy = 0;
            invaderLaser.visible = false;
        }
    });
}

function updateSwarm()
{
    var dx = swarm.vx;

    swarm.aliens.forEach(alien => {
        if (alien.visible && dx > 0 && alien.x >= (640 - 32)) {
            dx = -8;
            swarm.vx = 0;
            swarm.vy = 16;
            tickReset -= 5;
        }
        if (alien.visible && dx < 0 && alien.x <= 0) {
            dx = 8;
            swarm.vx = 0;
            swarm.vy = 16;
            tickReset -= 5;
        }
    });

    if (tickReset < 8) {
        tickReset = 8;
    }

    swarm.aliens.forEach(alien => {
        alien.x += swarm.vx;
        alien.y += swarm.vy;
        if (alien.visible) {
            var rnd = Math.floor((Math.random() * 40) + 1);
            if (rnd === 7 && alien.visible) {
                invaderLaser = new Sprite(resources['invaderLaser'].texture);
                invaderLaser.x = alien.x + 14;
                invaderLaser.y = 100;
                invaderLaser.vy = 6;
                invaderLaser.visible = true;
                invaderLasers.push(invaderLaser);
                app.stage.addChild(invaderLaser);
            }
        }
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
            invaderQty--;
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
