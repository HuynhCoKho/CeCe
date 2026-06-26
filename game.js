(function () {
  var canvas = document.getElementById('gameCanvas');
  var ctx = canvas.getContext('2d');
  var startButton = document.getElementById('startButton');
  var pauseButton = document.getElementById('pauseButton');
  var endButton = document.getElementById('endButton');
  var overlay = document.getElementById('overlay');
  var scoreValue = document.getElementById('scoreValue');
  var sizeValue = document.getElementById('sizeValue');
  var missValue = document.getElementById('missValue');
  var targetValue = document.getElementById('targetValue');
  var messageValue = document.getElementById('messageValue');

  var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`~!@#$%^&*()-_=+[]{}\\|;:\'",.<>/?';
  var keys = {};
  var bubbles = [];
  var bigFish = [];
  var particles = [];
  var running = false;
  var paused = false;
  var lastTime = 0;
  var spawnTimer = 0;
  var currentBubble = null;
  var wrongCount = 0;
  var score = 0;
  var manualCooldown = 0;

  var cece = {
    x: 360,
    y: 300,
    radius: 30,
    baseRadius: 30,
    vx: 42,
    vy: 26,
    targetX: 520,
    targetY: 260,
    bellyTimer: 0,
    faceTimer: 0,
    safeTimer: 0,
    direction: 1
  };

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function pickChar() {
    return chars[Math.floor(Math.random() * chars.length)];
  }

  function fitCanvas() {
    var rect = canvas.getBoundingClientRect();
    var ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(640, Math.floor(rect.width * ratio));
    canvas.height = Math.max(420, Math.floor(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    keepInBounds();
  }

  function width() {
    return canvas.width / (window.devicePixelRatio || 1);
  }

  function height() {
    return canvas.height / (window.devicePixelRatio || 1);
  }

  function keepInBounds() {
    cece.x = clamp(cece.x, cece.radius + 12, width() - cece.radius - 12);
    cece.y = clamp(cece.y, cece.radius + 12, height() - cece.radius - 42);
  }

  function setOverlay(title, text, show) {
    overlay.hidden = !show;
    if (!show) return;
    overlay.querySelector('h2').textContent = title;
    overlay.querySelector('p').textContent = text;
  }

  function updateHud() {
    scoreValue.textContent = score;
    sizeValue.textContent = (cece.radius / cece.baseRadius).toFixed(1) + 'x';
    missValue.textContent = wrongCount + '/3';
    targetValue.textContent = currentBubble ? currentBubble.char : 'Chưa có';
  }

  function resetGame() {
    bubbles = [];
    bigFish = [];
    particles = [];
    currentBubble = null;
    wrongCount = 0;
    score = 0;
    spawnTimer = 0;
    manualCooldown = 0;
    cece.x = width() * 0.33;
    cece.y = height() * 0.5;
    cece.radius = cece.baseRadius;
    cece.vx = 48;
    cece.vy = 24;
    cece.targetX = width() * 0.62;
    cece.targetY = height() * 0.42;
    cece.bellyTimer = 0;
    cece.faceTimer = 0;
    cece.safeTimer = 3;

    for (var i = 0; i < 13; i += 1) spawnBubble();
    for (var j = 0; j < 4; j += 1) spawnBigFish(j);
    updateHud();
  }

  function spawnBubble() {
    var side = Math.random() < 0.5 ? -1 : 1;
    bubbles.push({
      x: side < 0 ? -30 : width() + 30,
      y: random(70, height() - 95),
      r: random(18, 28),
      char: pickChar(),
      vx: side < 0 ? random(14, 38) : random(-38, -14),
      vy: random(-10, 10),
      wobble: random(0, Math.PI * 2),
      eaten: false
    });
  }

  function spawnBigFish(index) {
    var r = random(42, 70);
    var fromLeft = Math.random() < 0.5;
    bigFish.push({
      x: fromLeft ? -r - index * 90 : width() + r + index * 90,
      y: random(90, height() - 130),
      r: r,
      vx: fromLeft ? random(34, 66) : random(-66, -34),
      hue: Math.random() < 0.5 ? '#3651a4' : '#70419a',
      wobble: random(0, Math.PI * 2)
    });
  }

  function startGame() {
    fitCanvas();
    resetGame();
    running = true;
    paused = false;
    startButton.disabled = true;
    pauseButton.disabled = false;
    endButton.disabled = false;
    pauseButton.textContent = 'Tạm dừng';
    messageValue.textContent = 'CeCe đang tìm bong bóng ngon. Gõ đúng ký tự khi CeCe ăn được mồi.';
    setOverlay('', '', false);
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function togglePause() {
    if (!running) return;
    paused = !paused;
    pauseButton.textContent = paused ? 'Tiếp tục' : 'Tạm dừng';
    setOverlay('Đang tạm dừng', 'Bấm Tiếp tục để CeCe bơi tiếp.', paused);
    if (!paused) {
      lastTime = performance.now();
      requestAnimationFrame(loop);
    }
  }

  function endGame(reason) {
    running = false;
    paused = false;
    startButton.disabled = false;
    pauseButton.disabled = true;
    endButton.disabled = true;
    pauseButton.textContent = 'Tạm dừng';
    currentBubble = null;
    wrongCount = 0;
    updateHud();
    setOverlay('Trò chơi kết thúc', reason || 'Bấm Bắt đầu để cho CeCe thử lại.', true);
  }

  function chooseAutoTarget() {
    if (Math.random() > 0.015 && Math.hypot(cece.x - cece.targetX, cece.y - cece.targetY) > 28) return;

    if (bubbles.length && Math.random() < 0.76) {
      var nearest = bubbles.reduce(function (best, item) {
        var d = Math.hypot(item.x - cece.x, item.y - cece.y);
        return d < best.d ? { bubble: item, d: d } : best;
      }, { bubble: null, d: Infinity }).bubble;
      if (nearest) {
        cece.targetX = nearest.x;
        cece.targetY = nearest.y;
        return;
      }
    }

    cece.targetX = random(60, width() - 60);
    cece.targetY = random(70, height() - 105);
  }

  function moveCece(dt) {
    var speed = 190;
    var dx = 0;
    var dy = 0;

    if (keys.ArrowLeft) dx -= 1;
    if (keys.ArrowRight) dx += 1;
    if (keys.ArrowUp) dy -= 1;
    if (keys.ArrowDown) dy += 1;

    if (dx || dy) {
      var length = Math.hypot(dx, dy);
      cece.x += (dx / length) * speed * dt;
      cece.y += (dy / length) * speed * dt;
      cece.direction = dx < 0 ? -1 : dx > 0 ? 1 : cece.direction;
    } else {
      chooseAutoTarget();
      var tx = cece.targetX - cece.x;
      var ty = cece.targetY - cece.y;
      var distance = Math.hypot(tx, ty) || 1;
      cece.x += (tx / distance) * cece.vx * dt;
      cece.y += (ty / distance) * cece.vy * dt;
      cece.direction = tx < -3 ? -1 : tx > 3 ? 1 : cece.direction;
    }

    cece.bellyTimer = Math.max(0, cece.bellyTimer - dt);
    cece.faceTimer = Math.max(0, cece.faceTimer - dt);
    keepInBounds();
  }

  function eatBubble(bubble) {
    if (currentBubble) return;
    currentBubble = bubble;
    bubble.eaten = true;
    wrongCount = 0;
    cece.bellyTimer = 1.1;
    messageValue.textContent = 'CeCe đang tiêu hóa: hãy gõ đúng ký tự trong bong bóng.';
    addParticles(bubble.x, bubble.y, '#e8fbff', 12);
    updateHud();
  }

  function tryManualEat() {
    if (!running || paused || currentBubble || manualCooldown > 0) return;
    manualCooldown = 0.25;
    var nearest = null;
    var nearestDistance = 90;
    bubbles.forEach(function (bubble) {
      var d = Math.hypot(bubble.x - cece.x, bubble.y - cece.y);
      if (d < nearestDistance) {
        nearest = bubble;
        nearestDistance = d;
      }
    });
    if (nearest) {
      eatBubble(nearest);
    } else {
      cece.faceTimer = 0.4;
      messageValue.textContent = 'Chưa có bong bóng đủ gần để CeCe đớp.';
    }
  }

  function rejectBubble() {
    if (!currentBubble) return;
    currentBubble.eaten = false;
    currentBubble.x = cece.x - cece.direction * (cece.radius + 24);
    currentBubble.y = cece.y + 4;
    currentBubble.vx = -cece.direction * random(46, 72);
    currentBubble.vy = random(-26, 8);
    currentBubble = null;
    wrongCount = 0;
    cece.radius = Math.max(22, cece.radius - 4);
    cece.faceTimer = 1;
    messageValue.textContent = 'Sai 3 lần rồi. CeCe nhả bong bóng ra và nhỏ lại một tẹo.';
    updateHud();
  }

  function digestBubble() {
    if (!currentBubble) return;
    addParticles(cece.x, cece.y, '#f5c56e', 18);
    bubbles = bubbles.filter(function (item) {
      return item !== currentBubble;
    });
    currentBubble = null;
    wrongCount = 0;
    score += 10;
    cece.radius = Math.min(68, cece.radius + 1.8);
    cece.bellyTimer = 0;
    cece.faceTimer = 0.5;
    messageValue.textContent = 'Ngon lành. CeCe lớn lên một chút!';
    updateHud();
  }

  function handleTyping(event) {
    if (!running || paused) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      tryManualEat();
      return;
    }

    if (!currentBubble || event.key.length !== 1) return;
    event.preventDefault();

    if (event.key === currentBubble.char) {
      digestBubble();
    } else {
      wrongCount += 1;
      cece.faceTimer = 0.8;
      messageValue.textContent = wrongCount < 3 ? 'Ôi, sai rồi. CeCe hơi đau bụng.' : 'CeCe đau bụng quá!';
      if (wrongCount >= 3) rejectBubble();
      updateHud();
    }
  }

  function updateBubbles(dt) {
    spawnTimer -= dt;
    if (spawnTimer <= 0 && bubbles.length < 18) {
      spawnBubble();
      spawnTimer = random(0.65, 1.2);
    }

    bubbles.forEach(function (bubble) {
      if (bubble.eaten) {
        bubble.x += (cece.x - bubble.x) * Math.min(1, dt * 8);
        bubble.y += (cece.y - bubble.y) * Math.min(1, dt * 8);
        return;
      }
      bubble.wobble += dt * 2;
      bubble.x += bubble.vx * dt;
      bubble.y += (bubble.vy + Math.sin(bubble.wobble) * 13) * dt;
      if (bubble.x < -80 || bubble.x > width() + 80 || bubble.y < 30 || bubble.y > height() - 30) {
        bubble.x = bubble.vx > 0 ? -40 : width() + 40;
        bubble.y = random(70, height() - 95);
      }
      if (!currentBubble && Math.hypot(bubble.x - cece.x, bubble.y - cece.y) < cece.radius + bubble.r * 0.72) {
        eatBubble(bubble);
      }
    });
  }

  function updateBigFish(dt) {
    bigFish.forEach(function (fish) {
      fish.wobble += dt * 2.4;
      fish.x += fish.vx * dt;
      fish.y += Math.sin(fish.wobble) * 18 * dt;
      if (fish.vx > 0 && fish.x > width() + fish.r + 20) fish.x = -fish.r - random(40, 240);
      if (fish.vx < 0 && fish.x < -fish.r - 20) fish.x = width() + fish.r + random(40, 240);

      var dangerDistance = fish.r * 0.68 + cece.radius * 0.72;
      if (cece.safeTimer <= 0 && Math.hypot(fish.x - cece.x, fish.y - cece.y) < dangerDistance) {
        endGame('CeCe bị cá lớn bắt mất. Bấm Bắt đầu để thử lại nhé.');
      }
    });
  }

  function addParticles(x, y, color, count) {
    for (var i = 0; i < count; i += 1) {
      particles.push({
        x: x,
        y: y,
        vx: random(-60, 60),
        vy: random(-70, 40),
        life: random(0.45, 0.9),
        maxLife: 0.9,
        r: random(2, 5),
        color: color
      });
    }
  }

  function updateParticles(dt) {
    particles.forEach(function (p) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 25 * dt;
      p.life -= dt;
    });
    particles = particles.filter(function (p) {
      return p.life > 0;
    });
  }

  function update(dt) {
    manualCooldown = Math.max(0, manualCooldown - dt);
    cece.safeTimer = Math.max(0, cece.safeTimer - dt);
    moveCece(dt);
    updateBubbles(dt);
    updateBigFish(dt);
    updateParticles(dt);
    if (running && cece.radius >= 68) {
      endGame('CeCe đã thành cá siêu khỏe sau khi ăn rất nhiều bong bóng!');
    }
  }

  function drawBackground(time) {
    var w = width();
    var h = height();
    var gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#78d9f5');
    gradient.addColorStop(0.45, '#168fc7');
    gradient.addColorStop(1, '#075476');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (var i = 0; i < 24; i += 1) {
      var x = (i * 83 + time * (10 + (i % 4) * 3)) % (w + 80) - 40;
      var y = 35 + (i * 47) % (h - 105);
      ctx.beginPath();
      ctx.arc(x, y + Math.sin(time + i) * 10, 2 + (i % 4), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = varColor('--sand');
    ctx.beginPath();
    ctx.moveTo(0, h - 44);
    for (var sx = 0; sx <= w; sx += 60) {
      ctx.quadraticCurveTo(sx + 30, h - 70 + Math.sin(time + sx) * 7, sx + 60, h - 44);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();

    drawSeaPlants(w, h, time);
  }

  function varColor(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function drawSeaPlants(w, h, time) {
    ctx.lineCap = 'round';
    for (var i = 0; i < 12; i += 1) {
      var x = 28 + i * (w / 11);
      var plantHeight = 34 + (i % 4) * 14;
      ctx.strokeStyle = i % 2 ? '#0f7d67' : '#0b6f7b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x, h - 28);
      ctx.quadraticCurveTo(x + Math.sin(time * 1.5 + i) * 14, h - 28 - plantHeight * 0.58, x + Math.sin(time + i) * 8, h - 28 - plantHeight);
      ctx.stroke();
    }
  }

  function drawBubble(bubble) {
    var alpha = bubble.eaten ? 0.48 : 0.9;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(222, 249, 255, 0.72)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.beginPath();
    ctx.arc(bubble.x - bubble.r * 0.32, bubble.y - bubble.r * 0.32, bubble.r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#073d5c';
    ctx.font = '700 ' + Math.max(18, bubble.r * 0.92) + 'px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bubble.char, bubble.x, bubble.y + 1);
    ctx.restore();
  }

  function drawFishBody(x, y, r, direction, color, label, hurt) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(direction, 1);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.25, r * 0.76, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = shade(color, -18);
    ctx.beginPath();
    ctx.moveTo(-r * 1.08, 0);
    ctx.lineTo(-r * 1.78, -r * 0.55);
    ctx.lineTo(-r * 1.7, r * 0.54);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.24)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.18, -r * 0.22, r * 0.48, r * 0.16, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(r * 0.68, -r * 0.2, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hurt ? '#a62634' : '#17202a';
    ctx.beginPath();
    ctx.arc(r * 0.73, -r * 0.19, r * 0.075, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = hurt ? '#a62634' : '#263b4c';
    ctx.lineWidth = Math.max(2, r * 0.05);
    ctx.beginPath();
    if (hurt) {
      ctx.arc(r * 0.62, r * 0.22, r * 0.18, Math.PI, Math.PI * 2);
    } else {
      ctx.arc(r * 0.65, r * 0.08, r * 0.2, 0.12, Math.PI - 0.12);
    }
    ctx.stroke();

    if (label) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 ' + Math.max(13, r * 0.32) + 'px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, -r * 0.08, 0);
    }
    ctx.restore();
  }

  function shade(hex, percent) {
    var value = parseInt(hex.slice(1), 16);
    var amount = Math.round(2.55 * percent);
    var r = clamp((value >> 16) + amount, 0, 255);
    var g = clamp((value >> 8 & 0xff) + amount, 0, 255);
    var b = clamp((value & 0xff) + amount, 0, 255);
    return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
  }

  function drawBigFish(fish) {
    var direction = fish.vx >= 0 ? 1 : -1;
    drawFishBody(fish.x, fish.y, fish.r, direction, fish.hue, '', false);
  }

  function drawCece() {
    var pulse = cece.bellyTimer > 0 ? Math.sin(performance.now() / 80) * 1.5 : 0;
    var hurt = cece.faceTimer > 0 && wrongCount > 0;
    drawFishBody(cece.x, cece.y, cece.radius + pulse, cece.direction, '#ef6b5e', 'CeCe', hurt);
  }

  function drawParticles() {
    particles.forEach(function (p) {
      ctx.save();
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function draw() {
    var time = performance.now() / 1000;
    drawBackground(time);
    bubbles.forEach(drawBubble);
    bigFish.forEach(drawBigFish);
    drawCece();
    drawParticles();
  }

  function loop(now) {
    if (!running || paused) return;
    var dt = Math.min(0.033, (now - lastTime) / 1000 || 0.016);
    lastTime = now;
    update(dt);
    draw();
    if (running && !paused) requestAnimationFrame(loop);
  }

  startButton.addEventListener('click', startGame);
  pauseButton.addEventListener('click', togglePause);
  endButton.addEventListener('click', function () {
    endGame('Bạn đã kết thúc lượt chơi. Bấm Bắt đầu khi muốn chơi lại.');
  });

  window.addEventListener('keydown', function (event) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(event.key) !== -1) {
      event.preventDefault();
      keys[event.key] = true;
      return;
    }
    handleTyping(event);
  });

  window.addEventListener('keyup', function (event) {
    keys[event.key] = false;
  });

  window.addEventListener('resize', function () {
    fitCanvas();
    draw();
  });

  fitCanvas();
  resetGame();
  draw();
  setOverlay('Sẵn sàng xuống biển', 'Dùng phím mũi tên để bơi, Enter để đớp mồi gần nhất. Khi CeCe ăn bong bóng, hãy gõ đúng ký tự trong bong bóng đó.', true);
})();
