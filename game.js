
// Constants
const GUN_MAX_VELOCITY = 10;

// Aliases
let Application = PIXI.Application,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    Sprite = PIXI.Sprite;
Container = PIXI.Container;

// Create a Pixi Application
let app = new Application({
    width: 640,
    height: 480,
    antialias: true,
    transparent: false,
    resolution: 1
});

// Global vaiables
let titleScene, gameScene, endScene;
let swarm = {};
let alien;
let gun;
let playerLaser;
let bonusShip, ufoHigh, ufoLow, bonusTextTimeout;
let shelters = [];
let reachedBottom, reachedShelters, sheltersRemoved;
let invaderLasers = [];
let tick = 0;
let tickReset = 45;
let pulseCount = 0;
let pulse = [];
let shoot, invaderKilled;
let score, scoreText;
let playKilled, explosion;
let lifeImages = [], lives, livesGained;
let gameState = 'title';
let invaderQty;
let level;

// Keyboard Handling
let left = keyboard(37);
let right = keyboard(39);
let fire = keyboard(32);

right.press = () => {
    gun.ax = 0.4;
    gun.vx = 1;
};

right.release = () => {
    if (gun.vx > 0) {
        gun.ax = 0;
        gun.vx = 0;
    }
}

left.press = () => {
    gun.ax = -0.4;
    gun.vx = -1;
};

left.release = () => {
    if (gun.vx < 0) {
        gun.ax = 0;
        gun.vx = 0;
    }
}

fire.press = () => {
    if (gameState === 'title') {
        score = 0;
        lives = 3;
        livesGained = 0;
        level = 0;
        initLevel();
        titleScene.visible = false;
        gameScene.visible = true;
        gameState = 'play';
        return;
    }

    if (gun.visible && !playerLaser.visible) {
        playerLaser.x = gun.x + 15;
        playerLaser.y = gun.y;
        playerLaser.visible = true;
        playerLaser.vy = -9;
        shoot.play();
    }
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
    .add('bonusShip', 'sprites/bonus.png')
    .add('gun', 'sprites/gun.png')
    .add('playerKilled', 'sprites/playerKilled.png')
    .add('laser', 'sprites/laser.png')
    .add('invaderLaser', 'sprites/invaderLaser.png')
    .add('shelter1', 'sprites/shelter1.png')
    .add('shelter2', 'sprites/shelter2.png')
    .add('shelter3', 'sprites/shelter3.png')
    .add('shelter4', 'sprites/shelter4.png')
    .add('shelter5', 'sprites/shelter5.png')
    .add('shelter6', 'sprites/shelter6.png')
    .add('shelter7', 'sprites/shelter7.png')
    .add('shelter8', 'sprites/shelter8.png')
    .add('shelter9', 'sprites/shelter9.png')
    .load(setup);


sounds.load([
    "sounds/fastinvader1.wav",
    "sounds/fastinvader2.wav",
    "sounds/fastinvader3.wav",
    "sounds/fastinvader4.wav",
    "sounds/ufo_highpitch.wav",
    "sounds/ufo_lowpitch.wav",
    "sounds/shoot.wav",
    "sounds/invaderKilled.wav",
    "sounds/explosion.wav"
]);
sounds.whenLoaded = function () {
    pulse.push(sounds["sounds/fastinvader1.wav"]);
    pulse.push(sounds["sounds/fastinvader2.wav"]);
    pulse.push(sounds["sounds/fastinvader3.wav"]);
    pulse.push(sounds["sounds/fastinvader4.wav"]);
    shoot = sounds["sounds/shoot.wav"];
    ufoHigh = sounds["sounds/ufo_highpitch.wav"];
    ufoHigh.loop = true;
    ufoLow = sounds["sounds/ufo_lowpitch.wav"];
    ufoLow.loop = true;
    invaderKilled = sounds["sounds/invaderKilled.wav"];
    explosion = sounds["sounds/explosion.wav"];
}

// This `setup` function will run when the images have loaded.
function setup() {

    titleScene = new Container;
    app.stage.addChild(titleScene);
    createText(titleScene, 'Invaders', 320, 40, 32, '#0000ff', 'center');
    createText(titleScene, '= 30 points', 260, 180, 24, '#ffffff', 'left');
    createText(titleScene, '= 20 points', 260, 210, 24, '#ffffff', 'left');
    createText(titleScene, '= 10 points', 260, 240, 24, '#ffffff', 'left');
    createSprite(titleScene, 'alien3', 210, 180);
    createSprite(titleScene, 'alien2', 210, 210);
    createSprite(titleScene, 'alien1', 210, 240);
    createText(titleScene, 'Press \'Space\' to play', 320, 360, 24, '#ffffff', 'center');


    gameScene = new Container;
    gameScene.visible = false;
    app.stage.addChild(gameScene);

    swarm.aliens = [];
    invaderQty = 0;
    buildInvaderRow('alien3', 2, 96, 30);
    buildInvaderRow('alien2', 1, 128, 20);
    buildInvaderRow('alien2', 1, 160, 20);
    buildInvaderRow('alien1', 0, 192, 10);
    buildInvaderRow('alien1', 0, 224, 10);
    swarm.vx = 8;
    swarm.vy = 0;

    alienKilledSprites = [];
    for (var i = 1; i <= 3; i++) {
        sprite = new Sprite(resources['alienKilled' + i].texture);
        sprite.visible = false;
        gameScene.addChild(sprite);
        alienKilledSprites.push(sprite);
    }

    bonusShip = new Sprite(resources["bonusShip"].texture);
    bonusShip.x = 0;
    bonusShip.y = 64;
    bonusShip.vx = 0;
    bonusShip.visible = false;
    gameScene.addChild(bonusShip);

    bonusText = createText(gameScene, '100', 0, 64, 14, '#ffffff', 'center');
    bonusText.visible = false;

    gun = new Sprite(resources["gun"].texture);
    gun.x = 320 - 16;
    gun.y = 480 - 32;
    gun.vx = 0;
    gameScene.addChild(gun);

    playerKilled = new Sprite(resources["playerKilled"].texture);
    playerKilled.visible = false;
    gameScene.addChild(playerKilled);

    for (i = 1; i <= 3; i++) {
        life = new Sprite(resources["gun"].texture);
        life.x = 430 + (i * 40);
        life.y = 20;
        lifeImages.push(life);
        gameScene.addChild(life);
    };

    playerLaser = new Sprite(resources["laser"].texture);
    playerLaser.x = gun.x;
    playerLaser.y = gun.y - 16;
    playerLaser.vx = 0;
    playerLaser.vy = 0;
    playerLaser.visible = false;
    gameScene.addChild(playerLaser);

    shelters.push(createShelter(gameScene, 64, 480 - 80));
    shelters.push(createShelter(gameScene, 296, 480 - 80));
    shelters.push(createShelter(gameScene, 640 - 112, 480 - 80));

    createText(gameScene, 'score', 32, 16, 24, '#ffffff', 'left');
    scoreText = createText(gameScene, '0', 120, 16, 24, '#00ff00', 'left');
    livesText = createText(gameScene, 'lives', 380, 16, 24, '#ffffff', 'left');

    app.ticker.add(delta => gameLoop(delta));
}

function initLevel() {
    alienKilledSprites.forEach(sprite => {
        sprite.visible = false;
    });

    reachedBottom = false;
    reachedShelters = false;

    invaderQty = 0;
    swarm.aliens.forEach(alien => {
        alien.x = alien.ix;
        alien.y = alien.iy;
        alien.visible = true;
        invaderQty++;
    })
    tickReset = 60 - (level * 10);
    if (tickReset < 15) {
        tickReset = 15;
    }

    playerLaser.visible = false;

    shelters.forEach(shelter => {
        shelter.forEach(s => {
            s.visible = true;
        });
    });
    sheltersRemoved = false;

    level++;
}

function buildInvaderRow(image, killedImageIndex, yPos, value) {
    for (var i = 1; i <= 11; i++) {
        alien = new Sprite(resources[image].texture);
        alien.visible = false;
        alien.ix = (i * 44) + 44;
        alien.iy = yPos;
        alien.value = value;
        alien.killedSprite = killedImageIndex;
        swarm.aliens.push(alien);
        gameScene.addChild(alien);
        invaderQty++;
    }
}

function gameLoop(delta) {

    if (gameState == 'play' || gameState == 'end') {
        play(delta);
    }
}

function play(delta) {
    checkLevelEnd();
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
    checkInvadersReachedBottom();
    updateGun();
    updatePlayerLaser();
    updateInvaderLasers();
    updateBonusShip();
    checkShelterHit();
    checkAlienHit();
    checkBonusShipHit();
    checkPlayerHit();

    scoreText.text = score;

    checkGameOver();
}

function checkShelterHit() {
    if (playerLaser.visible) {
        shelters.forEach(shelter => {
            shelter.forEach(s => {
                if (s.visible && hitTestRectangle(playerLaser, s)) {
                    playerLaser.vy = 0;
                    playerLaser.visible = false;
                    s.visible = false;
                }
            });
        });
    }

    invaderLasers.forEach(invaderLaser => {
        if (invaderLaser.visible) {
            shelters.forEach(shelter => {
                shelter.forEach(s => {
                    if (s.visible && hitTestRectangle(invaderLaser, s)) {
                        invaderLaser.visible = false;
                        s.visible = false;
                    }
                });
            });
        }
    });
}

function checkBonusShipHit() {
    if (playerLaser.visible && bonusShip.visible && hitTestRectangle(playerLaser, bonusShip)) {
        bonusShip.visible = false;
        bonusShip.vx = 0;
        bonusShip.sound.pause();
        bonusText.text = bonusShip.value;
        bonusText.x = bonusShip.x + 5;
        bonusText.visible = true;
        bonusTextTimeout = 30;
        invaderKilled.play();
        increaseScore(bonusShip.value);
    }
}

function updateBonusShip() {

    if (bonusText.visible) {
        bonusTextTimeout--;
        bonusText.visible = (bonusTextTimeout > 0);
    }

    if (bonusShip.visible) {
        bonusShip.x += bonusShip.vx;
        if ((bonusShip.vx > 0 && bonusShip.x > 640) || (bonusShip.vx < 0 && bonusShip.x < 0)) {
            bonusShip.visible = false;
            bonusShip.sound.pause();
        }
    }

    if (!bonusShip.visible) {
        var rnd = Math.floor((Math.random() * 2000) + 1);
        if (rnd === 14) {
            bonusShip.visible = true;
            bonusShip.value = Math.floor((Math.random() * 5) + 1) * 50;
            bonusShip.sound = ufoLow;
            bonusShip.x = 0;
            bonusShip.vx = 3;
            bonusShip.sound.play();

        }
        if (rnd === 28) {
            bonusShip.visible = true;
            bonusShip.value = Math.floor((Math.random() * 5) + 1) * 50;
            bonusShip.sound = ufoHigh;
            bonusShip.x = 640;
            bonusShip.vx = -3;
            bonusShip.sound.play();
        }
    }
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

function checkGameOver() {
    if (gameState == 'end') {
        sleep(4000);
        gameScene.visible = false;
        titleScene.visible = true;
        gameState = 'title';
        return;
    }

    lifeImages[2].visible = lives > 2;
    lifeImages[1].visible = lives > 1;
    lifeImages[0].visible = lives > 0;
    if (lives < 1) {
        if (bonusShip.hasOwnProperty('sound')) {
            bonusShip.sound.pause();
        }
        gameState = 'end';
    }
}

function checkLevelEnd() {
    if (invaderQty <= 0 && !bonusShip.visible) {
        playerLaser.visible = false;
        sleep(800);
        initLevel();
    }
}

function checkInvadersReachedBottom() {
    if (reachedBottom) {
        sleep(400);
        initLevel();
    } else {
        swarm.aliens.forEach(alien => {
            if (alien.visible && alien.y >= 480 - 64) {
                reachedBottom = true;
            }
            if (alien.visible && alien.y >= 384) {
                reachedShelters = true;
            }
        });
        if (reachedShelters && !sheltersRemoved) {
            removeShelters();
        }
        if (reachedBottom) {
            explosion.play();
            gun.visible = false;
            playerKilled.x = gun.x;
            playerKilled.y = gun.y;
            playerKilled.visible = true;
            lives--;
        }
    }
}

function removeShelters() {
    shelters.forEach(shelter => {
        shelter.forEach(s => {
            s.visible = false;
        });
    });
}

function increaseScore(value) {
    score = score + value;
    if ((score / 2000) >= livesGained) {
        lives++;
        livesGained++;
        if (lives > 3) {
            lives = 3;
        }
    }
}

function updateGun() {

    // Update gun position.
    gun.x += gun.vx;
    gun.x = Math.max(gun.x, 16);
    gun.x = Math.min(gun.x, (640 - gun.width - 16));

    // If gun is moving increase velocity.
    if (gun.vx != 0) {
        gun.vx += gun.ax;
    }

    // Restrict gun to a maximum velocity.
    gun.vx = Math.sign(gun.vx) * Math.min(GUN_MAX_VELOCITY, Math.abs(gun.vx));
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
        if (invaderLaser.y === gun.y + 32) {
            invaderLaser.vy = 0;
            invaderLaser.visible = false;
        }
    });
}

function updateSwarm() {
    var dx = swarm.vx;

    swarm.aliens.forEach(alien => {
        if (alien.visible && dx > 0 && alien.x >= (640 - 32)) {
            dx = -8;
            swarm.vx = 0;
            swarm.vy = 16;
            tickReset -= 10;
        }
        if (alien.visible && dx < 0 && alien.x <= 0) {
            dx = 8;
            swarm.vx = 0;
            swarm.vy = 16;
            tickReset -= 10;
        }
    });

    if (tickReset < 5) {
        tickReset = 5;
    }

    swarm.aliens.forEach((alien, index) => {
        alien.x += swarm.vx;
        alien.y += swarm.vy;
        if (alien.visible && invaderCanFire(index)) {
            var rnd = Math.floor((Math.random() * 14) + 1);
            if (false && rnd === 7 && alien.visible) {
                invaderLaser = new Sprite(resources['invaderLaser'].texture);
                invaderLaser.x = alien.x + 14;
                invaderLaser.y = alien.y + 24;
                invaderLaser.vy = 4;
                invaderLaser.visible = true;
                invaderLasers.push(invaderLaser);
                gameScene.addChild(invaderLaser);
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
        if (alien.visible && lx + 3 >= alien.x && lx <= alien.x + 32 && ly + 12 >= alien.y && ly <= alien.y + 32) {
            alien.visible = false;
            playerLaser.vy = 0;
            playerLaser.visible = false;
            killedSprite = alienKilledSprites[alien.killedSprite];
            killedSprite.x = alien.x;
            killedSprite.y = alien.y + 4;
            killedSprite.visible = true;
            invaderKilled.play();
            increaseScore(alien.value);
            invaderQty--;
        }
    });
}

function invaderCanFire(invaderIndex) {
    i = invaderIndex + 11;
    while (i < swarm.aliens.length) {
        if (swarm.aliens[i].visible) {
            return false;
        }
        i += 11;
    }
    return true;
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

function createText(scene, text, x, y, size, color, justify) {
    style = {
        fontFamily: 'Courier New',
        fontSize: size,
        fill: [color],
    }
    var txt = new PIXI.Text(text, style);
    txt.x = x;
    if (justify === 'center') {
        txt.x -= (txt.width / 2);
    }
    txt.y = y;
    scene.addChild(txt);
    return txt;
};

function createSprite(scene, name, x, y) {
    var sprite = new Sprite(resources[name].texture);
    sprite.x = x;
    sprite.y = y;
    scene.addChild(sprite);
    return sprite;
}

function createShelter(scene, x, y) {
    s1 = createSprite(scene, 'shelter1', x, y);
    s2 = createSprite(scene, 'shelter2', x + 8, y);
    s3 = createSprite(scene, 'shelter2', x + 16, y);
    s4 = createSprite(scene, 'shelter2', x + 24, y);
    s5 = createSprite(scene, 'shelter2', x + 32, y);
    s6 = createSprite(scene, 'shelter3', x + 40, y);

    s7 = createSprite(scene, 'shelter2', x, y + 8);
    s8 = createSprite(scene, 'shelter2', x + 8, y + 8);
    s9 = createSprite(scene, 'shelter2', x + 16, y + 8);
    s10 = createSprite(scene, 'shelter2', x + 24, y + 8);
    s11 = createSprite(scene, 'shelter2', x + 32, y + 8);
    s12 = createSprite(scene, 'shelter2', x + 40, y + 8);

    s13 = createSprite(scene, 'shelter2', x, y + 16);
    s14 = createSprite(scene, 'shelter8', x + 8, y + 16);
    s15 = createSprite(scene, 'shelter4', x + 16, y + 16);
    s16 = createSprite(scene, 'shelter5', x + 24, y + 16);
    s17 = createSprite(scene, 'shelter9', x + 32, y + 16);
    s18 = createSprite(scene, 'shelter2', x + 40, y + 16);

    s19 = createSprite(scene, 'shelter2', x, y + 24);
    s20 = createSprite(scene, 'shelter6', x + 8, y + 24);
    s21 = createSprite(scene, 'shelter7', x + 32, y + 24);
    s22 = createSprite(scene, 'shelter2', x + 40, y + 24);

    shelter = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16, s17, s18, s19, s20, s21, s22];
    return shelter;
}
