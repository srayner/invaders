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
let alien;
let gun;

// Keyboard Handling
let left = keyboard(37);
let right = keyboard(39);

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

// Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

// Load an image and run the `setup` function when it's done
loader
    .add("alien.png")
    .add("gun.png")
    .load(setup);


// This `setup` function will run when the images have loaded.
function setup() {

    alien = new Sprite(resources["alien.png"].texture);
    alien.x = 16;
    alien.y = 32;
    alien.vx = 2;

    gun = new Sprite(resources["gun.png"].texture);
    gun.x = 320 - 16;
    gun.y = 480 - 48;
    gun.vx = 0;

    app.stage.addChild(alien);
    app.stage.addChild(gun);
    app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta) {

    if (alien.x >= (640 - 32)) {
        alien.vx = -2;
    }

    if (alien.x <= 0) {
        alien.vx = 2;
    }

    alien.x += alien.vx;
    gun.x += gun.vx;
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