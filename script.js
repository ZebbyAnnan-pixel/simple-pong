// Simple Pong game using canvas
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const leftScoreEl = document.getElementById('leftScore');
const rightScoreEl = document.getElementById('rightScore');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Game settings
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 90;
const PADDLE_SPEED = 6;
const AI_SPEED = 4.2;
const BALL_SIZE = 12;
const INITIAL_BALL_SPEED = 5;
const BALL_SPEED_INCREASE = 0.3;
const WIN_SCORE = 10;

let leftScore = 0;
let rightScore = 0;
let running = true;

// Paddles and ball state
const leftPaddle = {
  x: 20,
  y: (HEIGHT - PADDLE_HEIGHT) / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  dy: 0,
};

const rightPaddle = {
  x: WIDTH - 20 - PADDLE_WIDTH,
  y: (HEIGHT - PADDLE_HEIGHT) / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
};

const ball = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  size: BALL_SIZE,
  vx: 0,
  vy: 0,
  speed: INITIAL_BALL_SPEED,
};

// Start ball moving in a random direction (towards left or right)
function serveBall(towardsRight = true) {
  ball.x = WIDTH / 2;
  ball.y = HEIGHT / 2;
  ball.speed = INITIAL_BALL_SPEED;
  const angle = (Math.random() * Math.PI / 4) - (Math.PI / 8); // -22.5deg to +22.5deg
  ball.vx = (towardsRight ? 1 : -1) * ball.speed * Math.cos(angle);
  ball.vy = ball.speed * Math.sin(angle);
}

// Draw helpers
function drawRect(x, y, w, h, color = '#fff') {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawBall() {
  ctx.fillStyle = '#00e5ff';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.size / 2, 0, Math.PI * 2);
  ctx.fill();
}

// Draw dashed center line
function drawCenterLine() {
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 12]);
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, 10);
  ctx.lineTo(WIDTH / 2, HEIGHT - 10);
  ctx.stroke();
  ctx.setLineDash([]);
}

// Clamp helper
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// Game update and collision detection
function update() {
  if (!running) return;

  // Update left paddle from keyboard velocity
  leftPaddle.y += leftPaddle.dy;
  leftPaddle.y = clamp(leftPaddle.y, 0, HEIGHT - leftPaddle.height);

  // AI: move right paddle toward ball with limited speed
  const targetY = ball.y - rightPaddle.height / 2;
  const diff = targetY - rightPaddle.y;
  if (Math.abs(diff) > AI_SPEED) {
    rightPaddle.y += Math.sign(diff) * AI_SPEED;
  } else {
    rightPaddle.y = targetY;
  }
  rightPaddle.y = clamp(rightPaddle.y, 0, HEIGHT - rightPaddle.height);

  // Move ball
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Top/bottom wall collision
  if (ball.y - ball.size / 2 <= 0) {
    ball.y = ball.size / 2;
    ball.vy = -ball.vy;
  } else if (ball.y + ball.size / 2 >= HEIGHT) {
    ball.y = HEIGHT - ball.size / 2;
    ball.vy = -ball.vy;
  }

  // Paddle collisions
  // Left paddle
  if (ball.x - ball.size / 2 <= leftPaddle.x + leftPaddle.width) {
    if (ball.y + ball.size / 2 >= leftPaddle.y && ball.y - ball.size / 2 <= leftPaddle.y + leftPaddle.height) {
      // Collision detected
      ball.x = leftPaddle.x + leftPaddle.width + ball.size / 2 + 0.1;
      // Reflect and adjust angle depending on hit position
      const relativeIntersectY = (leftPaddle.y + leftPaddle.height / 2) - ball.y;
      const normalized = relativeIntersectY / (leftPaddle.height / 2);
      const bounceAngle = normalized * (Math.PI / 3); // up to 60 degrees
      const direction = 1; // to the right
      ball.speed += BALL_SPEED_INCREASE;
      ball.vx = direction * ball.speed * Math.cos(bounceAngle);
      ball.vy = -ball.speed * Math.sin(bounceAngle);
    }
  }

  // Right paddle
  if (ball.x + ball.size / 2 >= rightPaddle.x) {
    if (ball.y + ball.size / 2 >= rightPaddle.y && ball.y - ball.size / 2 <= rightPaddle.y + rightPaddle.height) {
      // Collision detected
      ball.x = rightPaddle.x - ball.size / 2 - 0.1;
      const relativeIntersectY = (rightPaddle.y + rightPaddle.height / 2) - ball.y;
      const normalized = relativeIntersectY / (rightPaddle.height / 2);
      const bounceAngle = normalized * (Math.PI / 3);
      const direction = -1; // to the left
      ball.speed += BALL_SPEED_INCREASE;
      ball.vx = direction * ball.speed * Math.cos(bounceAngle);
      ball.vy = -ball.speed * Math.sin(bounceAngle);
    }
  }

  // Score check
  if (ball.x - ball.size / 2 <= 0) {
    // Right player scores
    rightScore++;
    updateScore();
    if (checkWin()) return;
    pauseAndServe(true);
  } else if (ball.x + ball.size / 2 >= WIDTH) {
    // Left player scores
    leftScore++;
    updateScore();
    if (checkWin()) return;
    pauseAndServe(false);
  }
}

function updateScore() {
  leftScoreEl.textContent = leftScore;
  rightScoreEl.textContent = rightScore;
}

function checkWin() {
  if (leftScore >= WIN_SCORE || rightScore >= WIN_SCORE) {
    running = false;
    setTimeout(() => {
      const winner = leftScore > rightScore ? 'You win!' : 'Computer wins';
      alert(`${winner}\nFinal score: ${leftScore} — ${rightScore}`);
      resetGame();
    }, 100);
    return true;
  }
  return false;
}

function pauseAndServe(towardsRight) {
  running = false;
  // small visual pause before serve
  setTimeout(() => {
    serveBall(towardsRight);
    running = true;
  }, 700);
}

function resetGame() {
  leftScore = 0;
  rightScore = 0;
  updateScore();
  leftPaddle.y = (HEIGHT - leftPaddle.height) / 2;
  rightPaddle.y = (HEIGHT - rightPaddle.height) / 2;
  serveBall(Math.random() > 0.5);
  running = true;
}

// Rendering
function render() {
  // clear
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // background panel
  ctx.fillStyle = 'rgba(10,14,24,0.45)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // center line
  drawCenterLine();

  // paddles
  drawRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height, '#bfefff');
  drawRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height, '#bfefff');

  // ball
  drawBall();
}

// Game loop
function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

// Input: mouse control (prefer mouse when used)
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleY = canvas.height / rect.height;
  const mouseY = (e.clientY - rect.top) * scaleY;
  leftPaddle.y = clamp(mouseY - leftPaddle.height / 2, 0, HEIGHT - leftPaddle.height);
});

// Keyboard control (ArrowUp/ArrowDown)
const keys = {};
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') {
    leftPaddle.dy = -PADDLE_SPEED;
    keys.ArrowUp = true;
  } else if (e.key === 'ArrowDown') {
    leftPaddle.dy = PADDLE_SPEED;
    keys.ArrowDown = true;
  }
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp') {
    keys.ArrowUp = false;
    if (keys.ArrowDown) leftPaddle.dy = PADDLE_SPEED;
    else leftPaddle.dy = 0;
  } else if (e.key === 'ArrowDown') {
    keys.ArrowDown = false;
    if (keys.ArrowUp) leftPaddle.dy = -PADDLE_SPEED;
    else leftPaddle.dy = 0;
  }
});

// Prevent arrow keys from scrolling page when focused
window.addEventListener('keydown', function(e) {
  if(['ArrowUp','ArrowDown'].indexOf(e.code) > -1) {
    e.preventDefault();
  }
}, false);

// Initialize and run
serveBall(Math.random() > 0.5);
loop();
