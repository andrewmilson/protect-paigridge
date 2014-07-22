window.onload = function() {
	// set up variables
	var game = new Game()
		, KEY_CODES = {13: "enter", 38: "up", 87: "up", 68: "right", 39: "right", 65: "left", 37: "left", 40: "down", 32: "space", 40: "down"}
		, KEY_STATUS = {}
		, images = {}
		, modalClassName = "modal"
		, gameOver = true
		, gameReady = false
		, score = 0
		, $score = document.getElementById("score")
		, $gameOver = document.getElementById("game-over")
		, $startGame = document.getElementById("start-game")
		, $instructions = document.getElementById("instructions")
		, $storeModal = document.getElementById("store")
		, $storeButton = document.getElementById("store-button")
		, $newGames = document.getElementsByClassName("new-game")
		, $modals = document.getElementsByClassName("modal")
		, $finalScore = document.getElementById("final-score")
		, $highScore = document.getElementById("high-score");

	window.requestAnimFrame = (function(){
		return  window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			function( callback ){ window.setTimeout(callback, 1000 / 60); };
	})();

	// this is my function for downloading images
	function imageDownloader(args, callback) {
		var downloadStatus = 0;
		var imgObj = {};

		for (var image in args) {
			imgObj[image] = new Image();
			imgObj[image].src = args[image];

			imgObj[image].onload = imgObj[image].onerror = function() {
				if (downloadStatus++ + 1 == Object.keys(imgObj).length) callback(imgObj);
			};
		}
	}

	// handles all users key presses
	function mouseHandler(e) {
		var keyCode = (e.keyCode) ? e.keyCode : e.charCode;

		if (KEY_CODES[keyCode]) {
			e.preventDefault();
			KEY_STATUS[KEY_CODES[keyCode]] = e.type == "keydown" ? true : false;
		}

		if(!gameOver && KEY_STATUS.enter && !gameReady) {
			gameReady = true;
			$instructions.className = modalClassName;
		}

		if (gameOver && KEY_STATUS.enter) {
			newGame();
		}
	}
	// listening for key presses
	document.onkeydown = mouseHandler;
	document.onkeyup = mouseHandler;

	// helper function for finging the x and y speed components when given an angle and total speed
	function speedXY(rotation, speed) {
		return {
			x: Math.cos(rotation) * speed,
			y: Math.sin(rotation) * speed * -1
		}
	}

	// explosion object. This is called each time you blow up a missile
	function Explosion() {
		this.init = function(x, y) {
			this.x = x;
			this.y = y;

			game.sounds.explosion.play();

			this.circles = {
				"positionX": [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()],
				"positionY": [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()],
				"radius": [6 + Math.random() * 8, 6 + Math.random() * 8, 6 + Math.random() * 8, 6 + Math.random() * 8, 6 + Math.random() * 8]
			};
		};

		this.draw = function() {
			for (var i = 0; i < this.circles.radius.length; i++) {
				this.context.beginPath();
				this.context.fillStyle = "#000";
				this.context.arc(this.x + this.circles.positionX[i] * 20, this.y + this.circles.positionY[i] * 20, this.circles.radius[i] + 2, Math.PI * 2, false);
				this.context.fill();
				this.context.closePath();
			}

			for (var i = 0; i < this.circles.radius.length; i++) {
				this.context.beginPath();
				this.context.fillStyle = "#B3B3B3";
				this.context.arc(this.x + this.circles.positionX[i] * 20, this.y + this.circles.positionY[i] * 20, this.circles.radius[i], Math.PI * 2, false);
				this.context.fill();
				this.context.closePath();
				this.circles.radius[i]--;

				if (this.circles.radius[i] <= 0) {
					this.circles.radius.splice(i, 1);
					this.circles.positionX.splice(i, 1);
					this.circles.positionY.splice(i, 1);
					i--;
				}
			}
		};
	}

	// bullet object. This is the object for each bullet fired by the plane
	function Bullet() {
		this.init = function(x, y, speed, direction) {
			this.x = x;
			this.y = y;
			this.speed = speed;
			this.direction = direction - 0.2 + Math.random() * 0.4;
		};

		this.draw = function() {
			this.context.fillStyle = "#000000";

			var speed = speedXY(this.direction, this.speed);
			this.x += speed.x;
			this.y += speed.y;

			this.context.save();
			this.context.translate(this.x, this.y);
			this.context.rotate(this.direction * -1);
			this.context.fillRect(-2, -1, 4, 1);
			this.context.restore();
		};
	}

	// this is the object for each missile
	function Enemy() {
		this.init = function(x, y) {
			this.x = x;
			this.y = y;
			this.speed = 2;
			this.direction = 0;
			this.random = [[Math.random(), Math.random(), Math.random(), Math.random(), Math.random()], [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()], [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()]];
		};

		this.draw = function(targetX, targetY) {
			this.direction = Math.atan2(targetX, targetY) * -1;

			var speed = speedXY(this.direction, this.speed);
			this.x += speed.y * -1;
			this.y += speed.x * -1;

			this.context.save();
			this.context.translate(this.x, this.y);
			this.context.rotate(this.direction);
			!(game.count % 5) ? this.random = [[Math.random(), Math.random(), Math.random(), Math.random(), Math.random()], [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()], [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()]] : 0;

			for (var i = 0; i < this.random[0].length; i++) {
				this.context.beginPath();
				this.context.fillStyle = "#000";
				this.context.arc(-4 + this.random[0][i] * 8, 30 + this.random[2][i] * 8, 6 + this.random[1][i] * 3, Math.PI * 2, false);
				this.context.fill();
				this.context.closePath();
			};

			this.context.fillStyle = "#000";
			this.context.beginPath();
			this.context.moveTo(-6, -6);
			this.context.lineTo(-6, 32);
			this.context.lineTo(6, 32);
			this.context.lineTo(6, -6);
			this.context.lineTo(-0, -16);
			this.context.lineTo(-6, -6);
			this.context.fill();
			this.context.closePath();

			this.context.beginPath();
			this.context.fillStyle = "#FCFF36";
			this.context.moveTo(-3, -6);
			this.context.lineTo(0, -11);
			this.context.lineTo(3, -6);
			this.context.lineTo(-3, -6);
			this.context.fill();
			this.context.closePath();

			this.context.fillStyle = "#B3B3B3";
			this.context.fillRect(-3, 20, 6, 12);

			this.context.fillStyle = "#C1272D";
			this.context.fillRect(-3, -3, 6, 20);

			for (var i = 0; i < this.random[0].length; i++) {
				this.context.beginPath();
				this.context.fillStyle = "#B3B3B3";
				this.context.arc(-4 + this.random[0][i] * 8, 30 + this.random[2][i] * 8, 3 + this.random[1][i] * 3, Math.PI * 2, false);
				this.context.fill();
				this.context.closePath();
			};

			this.context.restore();
		};
	}

	// this is the object for Pai
	function PaigridgeRoosh() {
		this.init = function(x, y) {
			this.x = x;
			this.y = y;
			this.speed = 0.1;
			this.topSpeed = 0.5
			this.acceleration = 0.05;
			this.speedDecay = 0.9975;
			this.direction = 0;
		};

		this.draw = function() {
			var oldAcceleration = this.acceleration;
			this.speed *= this.speedDecay;

			!(game.count % (500)) ? this.direction = Math.random() * 360 : 0;
			!(game.count % 300) ? this.acceleration *= [-1, 1][Math.round(Math.random())] : 0;
			oldAcceleration != this.acceleration ? game.sounds.paigridgeChangeDirection.play() : 0;
			window.innerWidth - this.x < 200 && this.acceleration > 0 ? this.acceleration *= -1 : 0;
			this.x < 200 && this.acceleration < 0 ? this.acceleration *= -1 : 0;
			this.y < 200 ? this.direction = 90 + Math.random() * 180 : 0;
			window.innerHeight - this.y < 200 ? this.direction = 90 + Math.random() * 180 : 0;

			Math.abs(this.speed) < this.topSpeed ? this.speed += this.acceleration : 0;

			this.x += this.speed;
			this.y += speedXY(this.direction, this.speed).y;

			this.context.save();
			this.context.translate(Math.floor(this.x), Math.floor(this.y));
			this.context.scale((this.speed < 0 ? -1 : 1), 1);
			this.context.drawImage(images.dugong, (!(game.count % 2) && Math.abs(this.speed) < this.topSpeed ? 80 : 0), 0, 80, 80, -40, -40, 80, 80);
			this.context.restore();
		}
	}

	// object for the plane
	function Plane() {
		this.init = function() {
			this.bullets = [];
			this.x = 100;
			this.y = 100;
			this.acceleration = 1.2;
			this.speed = 0;
			this.maxSpeed = 4;
			this.speedDecay = 0.98;
			this.rotation = 0;
			this.rotationStep = 0.09;
		};

		this.accelerate = function() {
			this.speed < this.maxSpeed && this.speed != 0 ? this.speed *= this.acceleration : this.speed == 0 ? this.speed = 0.5 : 0;
		};

		this.steerLeft = function() {
			this.rotation += this.rotationStep;
		};

		this.steerRight = function() {
			this.rotation -= this.rotationStep;
		};

		this.draw = function() {
			// this.context.clearRect(this.x - 35, this.y - 35, 70, 70);

			this.speed < 0.5 ? this.speed = 0 : 0;
			this.speed *= this.speedDecay;

			KEY_STATUS.left ? this.steerLeft() : 0;
			KEY_STATUS.right ? this.steerRight() : 0;

			if (KEY_STATUS.space || KEY_STATUS.up) {
				this.accelerate();

				if (!(game.count % 8)) {
					var bullet = new Bullet();
					var bulletSpeed = speedXY(game.plane.rotation, 8);
					bullet.init(game.plane.x + bulletSpeed.x, game.plane.y + bulletSpeed.y, 4 + this.speed, game.plane.rotation);
					game.plane.bullets.push(bullet);
					var bullet = new Bullet();
				}
			}

			for (var i = 0; i < this.bullets.length; i++) {
				this.bullets[i].draw();
			};

			var speed = speedXY(this.rotation, this.speed);
			this.x += speed.x;
			this.y += speed.y;

			this.context.save()
			this.context.translate(this.x, this.y);
			this.context.rotate(this.rotation * -1 + Math.PI * 0.5);
			this.context.drawImage(images.plane, -25, -20, 50, 50);
			this.context.restore();
		};
	}

	function Sound() {
		this.pool = [];
		this.currentSound = 0;

		this.init = function(fileLocation, size) {
			this.size = size;

			for (var i = 0; i < size; i++) {
				audio = new Audio(fileLocation);
				audio.load();
				this.pool[i] = audio;
			}
		};

		this.play = function() {
			if (this.pool[this.currentSound].currentTime == 0 || this.pool[this.currentSound].ended) {
				this.pool[this.currentSound].play();
			}

			this.currentSound = (this.currentSound + 1) % this.size
		}
	}

	function Game() {
		this.init = function() {
			this.count = 0;

			this.sounds = {};

			this.sounds.explosion = new Sound();
			this.sounds.explosion.init("audio/hitmarker.mp3", 3);

			this.sounds.paigridgeChangeDirection = new Sound();
			this.sounds.paigridgeChangeDirection.init("audio/change-direction.m4a", 1);

			this.$planeCanvas = document.getElementById("game");
			this.$planeCanvas.width = window.innerWidth;
			this.$planeCanvas.height = window.innerHeight;
			this.planeCtx = this.$planeCanvas.getContext("2d");
			Plane.prototype.context = this.planeCtx;
			this.plane = new Plane();
			this.plane.init();

			this.$bulletCanvas = document.getElementById("game");
			this.$bulletCanvas.width = window.innerWidth;
			this.$bulletCanvas.height = window.innerHeight;
			this.bulletCtx = this.$bulletCanvas.getContext("2d");
			Bullet.prototype.context = this.bulletCtx;

			this.$PaigridgeRooshCanvas = document.getElementById("game");
			this.$PaigridgeRooshCanvas.width = window.innerWidth;
			this.$PaigridgeRooshCanvas.height = window.innerHeight;
			this.PaigridgeRooshContext = this.$PaigridgeRooshCanvas.getContext("2d");
			PaigridgeRoosh.prototype.context = this.PaigridgeRooshContext
			this.PaigridgeRoosh = new PaigridgeRoosh();
			this.PaigridgeRoosh.init(500, 200);

			this.$enemiesCanvas = document.getElementById("game");
			this.$enemiesCanvas.width = window.innerWidth;
			this.$enemiesCanvas.height = window.innerHeight;
			this.enemiesCtx = this.$enemiesCanvas.getContext("2d");
			Enemy.prototype.context = this.enemiesCtx;
			this.enemies = [];

			this.explosions = [];
			Explosion.prototype.context = this.enemiesCtx;
		};

		this.start = function() {
			this.plane.draw();
			animate();
		};
	}

	function animate() {
		gameOver || requestAnimFrame(animate);
		game.bulletCtx.clearRect(0, 0, game.$bulletCanvas.width, game.$bulletCanvas.height);

		game.plane.draw();
		game.PaigridgeRoosh.draw();

		if (gameReady) {
			// game.enemiesCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

			if (!(game.count % 40)) {
				game.enemies.push(new Enemy());
				game.enemies[game.enemies.length - 1].init(Math.random() * window.innerWidth, [window.innerHeight + 10, -10][Math.round(Math.random())]);
			}

			for (var i = 0; i < game.enemies.length; i++) {
				game.enemies[i].draw(game.enemies[i].x - game.PaigridgeRoosh.x, game.enemies[i].y - game.PaigridgeRoosh.y);

				if (Math.sqrt(Math.pow(Math.abs(game.enemies[i].x - game.PaigridgeRoosh.x), 2) + Math.pow(Math.abs(game.enemies[i].y - game.PaigridgeRoosh.y), 2)) < 20) {
					gameOver = true;
					gameReady = false;
				}

				for (var j = 0; j < game.plane.bullets.length; j++) {
					if (game.plane.bullets[j].x > window.innerWidth || game.plane.bullets[j].x < 0 || game.plane.bullets[j].y > window.innerHeight || game.plane.bullets[j].y < 0) {
						game.plane.bullets.splice(j, 1);
						j--;
						continue;
					}

					// if (Math.sqrt(Math.pow(Math.abs(game.plane.bullets[j].x - game.PaigridgeRoosh.x), 2) + Math.pow(Math.abs(game.plane.bullets[j].y - game.PaigridgeRoosh.y), 2)) < 20) {
					// 	gameOver = true;
					// }

					if (Math.sqrt(Math.pow(Math.abs(game.enemies[i].x - game.plane.bullets[j].x), 2) + Math.pow(Math.abs(game.enemies[i].y - game.plane.bullets[j].y), 2)) < 20) {
						game.explosions.push(new Explosion());
						game.explosions[game.explosions.length - 1].init(game.enemies[i].x, game.enemies[i].y);

						game.enemies[i] = new Enemy();
						game.enemies[i].init(Math.random() * window.innerWidth, [window.innerHeight + 10, -10][Math.round(Math.random())]);
						game.plane.bullets.splice(j, 1);
						j--;

						score++;
						console.log(score);
						$score.innerHTML = score;
					}
				}
			}

			if (gameOver) {
				$gameOver.className = modalClassName + " show";

				$finalScore.innerHTML = score;
				$highScore.innerHTML = localStorage.getItem("score") || 0;
			}

			for (var i = 0; i < game.explosions.length; i++) {
				game.explosions[i].draw();

				if (!game.explosions[i].circles.radius.length) {
					game.explosions.splice(i, 1);
					i--;
				}
			};
		}

		game.count++;
	}

	function newGame() {
		$startGame.className = modalClassName;
		$gameOver.className = modalClassName;
		$instructions.className = modalClassName + " show";
		$score.innerHTML = 0;
		score = 0;
		game = new Game();
		gameOver = false;
		game.init();
		game.start();
	}

	// download all the images for the game
	imageDownloader({
		dugong: "images/dugong.png",
		plane: "images/plane.png"
	}, function(imgObj) {
		console.log(imgObj)
		images = imgObj;

		[].forEach.call($newGames, function(elm) {
			elm.onclick = newGame;
		});

		game.init();

		[].forEach.call($modals, function(element) {
			element.style.marginTop = -element.offsetHeight / 2 + "px";
		});
	});

	window.onresize = function() {
		game.$planeCanvas.width = window.innerWidth;
		game.$planeCanvas.height = window.innerHeight;

		game.$bulletCanvas.width = window.innerWidth;
		game.$bulletCanvas.height = window.innerHeight;

		game.$PaigridgeRooshCanvas.width = window.innerWidth;
		game.$PaigridgeRooshCanvas.height = window.innerHeight;

		game.$enemiesCanvas.width = window.innerWidth;
		game.$enemiesCanvas.height = window.innerHeight;
		game.$planeCanvas.width = window.innerWidth;
	}
};
