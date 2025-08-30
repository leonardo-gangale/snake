const body = document.getElementsByTagName("body")[0];
const game__grid = document.getElementById("game__grid");
const game__canvas__ctx = game__grid.getContext("2d");
const score__txt = document.getElementById("score");
const highest_score__txt = document.getElementById("best_score");

const apple__icon = new Image();
apple__icon.src = "./apple.png";

const snake__head__icon = new Image();

const eating__sound__effect = new Audio("./food_sound.mp3");
const background__music = new Audio("./background_music.mp3");
const gameover__sound__effect = new Audio("./game_over_sound.mp3");

// Responsive sizing
const CELL_COUNT = 15;
let CELL_SIZE = Math.floor(Math.min(window.innerWidth, window.innerHeight) / CELL_COUNT);
game__grid.width = CELL_COUNT * CELL_SIZE;
game__grid.height = CELL_COUNT * CELL_SIZE;

function clearCanvas(){
  game__canvas__ctx.clearRect(0,0, game__grid.width, game__grid.height);
}

function drawImage(x, y, w, h, image, rotation = 0){
  game__canvas__ctx.save();
  game__canvas__ctx.translate(x * CELL_SIZE + CELL_SIZE/2, y * CELL_SIZE + CELL_SIZE/2);
  game__canvas__ctx.rotate((rotation * Math.PI) / 180);
  game__canvas__ctx.drawImage(image, -CELL_SIZE/2, -CELL_SIZE/2, CELL_SIZE, CELL_SIZE);
  game__canvas__ctx.restore();
}

class Snake{
  constructor () {
    this.game_height = this.game_width = CELL_COUNT;
    this.snake_head = [7,7];
    this.snake_portions = [[6,7]];
    this.food_coords = [];
    this.direction = "right";
    this.previous_direction = "";
    this.game_loop;
    this.score = 0;
    this.highest_score = Number(localStorage.getItem("highestScore")) || 0;
    highest_score__txt.innerHTML = this.highest_score;

    // Start music + game on first interaction
    const startMusic = () => {
      background__music.play();
      background__music.loop = true;
      background__music.volume = 0.3;
    };
    const startGameOnce = () => this.startGame();

    document.addEventListener("keydown", startMusic, { once: true });
    document.addEventListener("keydown", startGameOnce, { once: true });
    document.addEventListener("touchstart", startMusic, { once: true });
    document.addEventListener("touchstart", startGameOnce, { once: true });
  }

  drawBlock(x, y, w, h, color){
    if(game__canvas__ctx){
      game__canvas__ctx.fillStyle = color;
      game__canvas__ctx.fillRect(x*CELL_SIZE+1, y*CELL_SIZE+1, CELL_SIZE, CELL_SIZE);
    }
  }

  drawGameBackground(){
    let previous_color = "";
    if(game__canvas__ctx){
      for (let i = 0; i < this.game_height; i++){
        for(let j = 0; j < this.game_width; j++){
          if(previous_color === "#ebbb00"){
            game__canvas__ctx.fillStyle = "#ffcc00";
            previous_color = "#ffcc00";
          } else {
            game__canvas__ctx.fillStyle = "#ebbb00";
            previous_color = "#ebbb00";
          }
          game__canvas__ctx.fillRect(i*CELL_SIZE, j*CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      } 
    }
  }

  startGame(){
    this.game_loop = setInterval(() => this.move(), 200);
  }

  render(){
    this.drawGameBackground();
    snake__head__icon.src = "./snake_head_" + this.direction + ".png";
    drawImage(...this.snake_head, CELL_SIZE, CELL_SIZE, snake__head__icon);

    this.snake_portions.forEach((portion) =>{
      this.drawBlock(portion[0], portion[1], CELL_SIZE, CELL_SIZE, "#56b130");
    });

    this.food_coords.forEach((food) => {
      drawImage(...food, CELL_SIZE, CELL_SIZE, apple__icon);
    });
  }

  updateScore(){
    this.score ++;
    score__txt.innerHTML = this.score;
    if(this.score > this.highest_score){
      localStorage.setItem("highestScore", String(this.score));
      highest_score__txt.innerHTML = this.score;
    }
  }

  changeDirection(direction){
    if((direction === "right" || direction === "left") && this.snake_head[1] === this.snake_portions[this.snake_portions.length-1][1]) return;
    if((direction === "up" || direction === "down") && this.snake_head[0] === this.snake_portions[this.snake_portions.length-1][0]) return;
    this.previous_direction = this.direction;
    this.direction = direction;
  }

  checkCollision(){
    this.snake_portions.forEach((portion) => {
      if(this.snake_head[0] === portion[0] && this.snake_head[1] === portion[1]){
        clearInterval(this.game_loop);
        body.innerHTML = "<h1 style='font-size: 8vw; text-align:center;'>GAME OVER</h1>";
        gameover__sound__effect.play();
        setTimeout(() => {
          window.location.href = "/";
        }, 3000);
      }
    });

    if(this.food_coords.length === 0){
      for(let i = 0; i < Math.ceil(Math.random() * 3); i++){
        this.spawnFood();
      }
      return;
    }

    this.food_coords.forEach((coord) => {
      if(this.snake_head[0] === coord[0] && this.snake_head[1] === coord[1]){
        let index = this.food_coords.indexOf(coord);
        this.food_coords = [...this.food_coords.slice(0,index), ...this.food_coords.slice(index+1)];
        eating__sound__effect.play();
        this.grow();
        this.updateScore();
      }  
    });
  }

  grow(){
    switch(this.direction){
      case "right":
        this.snake_portions = [[this.snake_portions[0][0]-1, this.snake_portions[0][1]],...this.snake_portions];
        break;
      case "left":
        this.snake_portions = [[this.snake_portions[0][0]+1, this.snake_portions[0][1]],...this.snake_portions];
        break;
      case "down":
        this.snake_portions = [[this.snake_portions[0][0], this.snake_portions[0][1]-1],...this.snake_portions];
        break;
      case "up":
        this.snake_portions = [[this.snake_portions[0][0], this.snake_portions[0][1]+1],...this.snake_portions];
        break;
    }
    this.render();
  }

  move(){
    switch(this.direction){
      case "right":
        this.snake_portions = this.snake_portions.slice(1);
        this.snake_portions.push([this.snake_head[0], this.snake_head[1]]);
        this.snake_head[0] = (this.snake_head[0] + 1) % this.game_width;
        break;
      case "down": 
        this.snake_portions = this.snake_portions.slice(1);
        this.snake_portions.push([this.snake_head[0], this.snake_head[1]]);
        this.snake_head[1] = (this.snake_head[1] + 1) % this.game_height;
        break;
      case "up":
        this.snake_portions = this.snake_portions.slice(1);
        this.snake_portions.push([this.snake_head[0], this.snake_head[1]]);
        this.snake_head[1] = (this.snake_head[1] === 0) ? this.game_height - 1 : this.snake_head[1] - 1;
        break;
      case "left":
        this.snake_portions = this.snake_portions.slice(1);
        this.snake_portions.push([this.snake_head[0], this.snake_head[1]]);
        this.snake_head[0] = (this.snake_head[0] === 0) ? this.game_width - 1 : this.snake_head[0] - 1;
        break;
    }
    this.render();
    this.checkCollision();
  }

  spawnFood(){    
    let next_food_coords;
    do{
      next_food_coords = [Math.floor(Math.random() * this.game_width), Math.floor(Math.random() * this.game_height)];
    }while(this.snake_portions.some((portion) => portion[0] === next_food_coords[0] && portion[1] === next_food_coords[1]));
    this.food_coords.push(next_food_coords);
  }
}

document.addEventListener("keydown", (event) => {
  event.preventDefault();
  const key = event.key;
  switch (key) {
    case "ArrowLeft":
      snake.changeDirection("left");
      break;
    case "ArrowRight":
      snake.changeDirection("right");
      break;
    case "ArrowUp":
      snake.changeDirection("up");
      break;
    case "ArrowDown":
      snake.changeDirection("down");
      break;
  }
});

// Touch controls for mobile
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener("touchstart", (e) => {
  e.preventDefault();
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}, { passive: false });

document.addEventListener("touchend", (e) => {
  e.preventDefault();
  let dx = e.changedTouches[0].screenX - touchStartX;
  let dy = e.changedTouches[0].screenY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) snake.changeDirection("right");
    else snake.changeDirection("left");
  } else {
    if (dy > 0) snake.changeDirection("down");
    else snake.changeDirection("up");
  }
}, { passive: false });

let snake = new Snake();
