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
  var playerCountValue = document.getElementById('playerCountValue');
  var playCountValue = document.getElementById('playCountValue');
  var statsScopeValue = document.getElementById('statsScopeValue');
  var leaderboardList = document.getElementById('leaderboardList');

  var config = window.CECE_GAME_CONFIG || {};
  var statsEndpoint = String(config.STATS_WEB_APP_URL || '').trim();
  var gameLevel = 'level1';
  var storageKey = 'ceceTypingStats';
  var visitorKey = 'ceceTypingVisitorId';
  var requestId = 0;
  var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`~!@#$%^&*()-_=+[]{}\\|;:\'",.<>/?';
  var correctScoreGain = 10;
  var wrongScorePenalty = 15;
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
  var roundRecorded = false;
  var stats = loadStats();
  var visitorId = getVisitorId();

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

  function getVisitorId() {
    try {
      var stored = localStorage.getItem(visitorKey);
      if (stored) return stored;
      var created = String(Date.now()) + '-' + Math.random().toString(16).slice(2);
      localStorage.setItem(visitorKey, created);
      return created;
    } catch (error) {
      return 'guest-' + Math.random().toString(16).slice(2);
    }
  }

  function hasGlobalStats() {
    return /^https:\/\/script\.google\.com\/macros\/s\//i.test(statsEndpoint);
  }

  function fetchGlobalStats(params, timeoutMs) {
    return new Promise(function (resolve, reject) {
      if (!hasGlobalStats()) {
        reject(new Error('Chưa cấu hình Apps Script Web App.'));
        return;
      }

      requestId += 1;
      var callbackName = 'ceceStatsCallback_' + Date.now() + '_' + requestId;
      var script = document.createElement('script');
      var timer = window.setTimeout(function () {
        cleanup();
        reject(new Error('Apps Script chưa phản hồi.'));
      }, timeoutMs || 12000);

      function cleanup() {
        window.clearTimeout(timer);
        delete window[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[callbackName] = function (payload) {
        cleanup();
        if (!payload || payload.ok === false) {
          reject(new Error((payload && payload.error) || 'Apps Script trả lỗi.'));
          return;
        }
        resolve(payload);
      };

      var query = Object.keys(params || {}).map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      });
      query.push('visitorId=' + encodeURIComponent(visitorId));
      query.push('level=' + encodeURIComponent(gameLevel));
      query.push('callback=' + encodeURIComponent(callbackName));

      script.src = statsEndpoint + (statsEndpoint.indexOf('?') === -1 ? '?' : '&') + query.join('&');
      script.onerror = function () {
        cleanup();
        reject(new Error('Không tải được Apps Script.'));
      };
      document.body.appendChild(script);
    });
  }

  function applyRemoteStats(payload) {
    if (!payload) return;
    stats = {
      players: Number(payload.players) || 0,
      plays: Number(payload.plays) || 0,
      scores: Array.isArray(payload.scores) ? payload.scores.map(function (item) {
        return { score: Number(item.score) || 0, at: Number(item.at) || 0 };
      }) : []
    };
    saveStats();
    renderStats();
  }

  function loadStats() {
    var fallback = {
      players: 0,
      plays: 0,
      scores: []
    };

    try {
      var parsed = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!parsed || typeof parsed !== 'object') return fallback;
      return {
        players: Number(parsed.players) || 0,
        plays: Number(parsed.plays) || 0,
        scores: Array.isArray(parsed.scores) ? parsed.scores.filter(function (item) {
          return item && Number(item.score) >= 0;
        }) : []
      };
    } catch (error) {
      return fallback;
    }
  }

  function saveStats() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(stats));
    } catch (error) {
      messageValue.textContent = 'Trình duyệt đang chặn lưu lịch sử điểm.';
    }
  }

  function registerVisitor() {
    if (hasGlobalStats()) {
      fetchGlobalStats({ action: 'visit' })
        .then(applyRemoteStats)
        .catch(function () {
          renderStats();
        });
      return;
    }

    stats.players = Math.max(stats.players, 1);
    saveStats();
    renderStats();
  }

  function renderStats() {
    statsScopeValue.textContent = hasGlobalStats() ? 'Top 3 điểm cao toàn cầu' : 'Top 3 điểm cao cục bộ';
    playerCountValue.textContent = stats.players;
    playCountValue.textContent = stats.plays;
    leaderboardList.textContent = '';

    var topScores = stats.scores.slice().sort(function (a, b) {
      return b.score - a.score || a.at - b.at;
    }).slice(0, 3);

    if (!topScores.length) {
      var emptyItem = document.createElement('li');
      emptyItem.textContent = 'Chưa có điểm';
      leaderboardList.appendChild(emptyItem);
      return;
    }

    topScores.forEach(function (item) {
      var row = document.createElement('li');
      row.textContent = item.score + ' điểm';
      leaderboardList.appendChild(row);
    });
  }

  function recordPlayStart() {
    if (hasGlobalStats()) {
      fetchGlobalStats({ action: 'start' })
        .then(applyRemoteStats)
        .catch(function () {
          stats.plays += 1;
          saveStats();
          renderStats();
        });
      return;
    }

    stats.plays += 1;
    saveStats();
    renderStats();
  }

  function recordFinalScore(finalScore, reason) {
    if (roundRecorded) return;
    roundRecorded = true;

    var oldBest = stats.scores.reduce(function (best, item) {
      return Math.max(best, Number(item.score) || 0);
    }, 0);

    if (hasGlobalStats()) {
      setOverlay('Đang lưu điểm', 'CeCe đang gửi điểm lên bảng xếp hạng toàn cầu.', true);
      fetchGlobalStats({ action: 'score', score: Math.max(0, finalScore) }, 15000)
        .then(function (payload) {
          applyRemoteStats(payload);
          showFinalOverlay(finalScore, !!payload.newBest, reason);
        })
        .catch(function () {
          recordLocalFinalScore(finalScore, oldBest);
          showFinalOverlay(finalScore, finalScore > 0 && finalScore > oldBest, reason);
        });
      return;
    }

    recordLocalFinalScore(finalScore, oldBest);
    showFinalOverlay(finalScore, finalScore > 0 && finalScore > oldBest, reason);
  }

  function recordLocalFinalScore(finalScore, oldBest) {
    if (finalScore <= 0) return;
    stats.scores.push({
      score: finalScore,
      at: Date.now()
    });
    stats.scores = stats.scores.sort(function (a, b) {
      return b.score - a.score || a.at - b.at;
    }).slice(0, 20);
    saveStats();
    renderStats();
  }

  function showFinalOverlay(finalScore, isNewBest, reason) {
    if (isNewBest) {
      setOverlay('Chúc mừng bạn là người nuôi cá xuất sắc nhất!', 'Điểm kỷ lục mới của bạn: ' + finalScore + '.', true);
    } else {
      setOverlay('Trò chơi kết thúc', reason || 'Bấm Bắt đầu để cho CeCe thử lại.', true);
    }
  }

  function refreshGlobalStats() {
    if (!hasGlobalStats()) return;
    fetchGlobalStats({ action: 'stats' })
      .then(applyRemoteStats)
      .catch(function () {
        renderStats();
      });
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
    roundRecorded = false;
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
    recordPlayStart();
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
    var finalScore = score;
    running = false;
    paused = false;
    startButton.disabled = false;
    pauseButton.disabled = true;
    endButton.disabled = true;
    pauseButton.textContent = 'Tạm dừng';
    currentBubble = null;
    wrongCount = 0;
    updateHud();
    recordFinalScore(finalScore, reason);
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
    var penalty = score === 0 ? 1 : wrongScorePenalty;
    currentBubble.eaten = false;
    currentBubble.x = cece.x - cece.direction * (cece.radius + 24);
    currentBubble.y = cece.y + 4;
    currentBubble.vx = -cece.direction * random(46, 72);
    currentBubble.vy = random(-26, 8);
    currentBubble = null;
    wrongCount = 0;
    score -= penalty;
    cece.radius = Math.max(16, cece.radius - 5.5);
    cece.faceTimer = 1;
    if (score < 0) {
      updateHud();
      endGame('CeCe đói quá vì bị âm điểm. Bấm Bắt đầu để nuôi CeCe lại nhé.');
      return;
    }
    messageValue.textContent = 'Sai 3 lần rồi. CeCe nhả bong bóng ra, bị trừ ' + penalty + ' điểm và nhỏ lại.';
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
    score += correctScoreGain;
    cece.radius = Math.min(120, cece.radius + 1.35);
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
  }

  function drawBackground(time) {
    var w = width();
    var h = height();
    var gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#8ee5f7');
    gradient.addColorStop(0.42, '#1f9bd0');
    gradient.addColorStop(1, '#064967');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    drawLightBeams(w, h, time);
    drawDistantWaves(w, h, time);
    drawSmallFishSchool(w, h, time);

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for (var i = 0; i < 34; i += 1) {
      var x = (i * 83 + time * (10 + (i % 4) * 3)) % (w + 80) - 40;
      var y = 35 + (i * 47) % (h - 120);
      ctx.beginPath();
      ctx.arc(x, y + Math.sin(time + i) * 10, 2 + (i % 4), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = varColor('--sand');
    ctx.beginPath();
    ctx.moveTo(0, h - 54);
    for (var sx = 0; sx <= w; sx += 60) {
      ctx.quadraticCurveTo(sx + 30, h - 86 + Math.sin(time + sx) * 8, sx + 60, h - 54);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();

    drawReef(w, h, time);
  }

  function varColor(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function drawLightBeams(w, h, time) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (var i = 0; i < 5; i += 1) {
      var x = ((i * w) / 4 + Math.sin(time * 0.35 + i) * 34) - w * 0.12;
      var beam = ctx.createLinearGradient(x, 0, x + w * 0.16, h);
      beam.addColorStop(0, 'rgba(255, 255, 255, 0.26)');
      beam.addColorStop(0.6, 'rgba(255, 255, 255, 0.04)');
      beam.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + w * 0.11, 0);
      ctx.lineTo(x + w * 0.24, h);
      ctx.lineTo(x - w * 0.05, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawDistantWaves(w, h, time) {
    var layers = [
      { y: h - 178, color: 'rgba(7, 91, 141, 0.36)', amp: 20, step: 115, speed: 0.5 },
      { y: h - 132, color: 'rgba(10, 109, 168, 0.46)', amp: 24, step: 98, speed: 0.72 },
      { y: h - 96, color: 'rgba(27, 149, 195, 0.62)', amp: 22, step: 88, speed: 0.94 }
    ];

    layers.forEach(function (layer, index) {
      ctx.fillStyle = layer.color;
      ctx.beginPath();
      ctx.moveTo(0, layer.y);
      for (var x = -layer.step; x <= w + layer.step; x += layer.step) {
        var crest = layer.y - layer.amp + Math.sin(time * layer.speed + index + x * 0.01) * 8;
        ctx.quadraticCurveTo(x + layer.step * 0.5, crest, x + layer.step, layer.y);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
    });
  }

  function drawSmallFishSchool(w, h, time) {
    var schools = [
      { x: w * 0.18, y: h * 0.25, color: '#dff7ff', count: 5, scale: 0.72 },
      { x: w * 0.68, y: h * 0.31, color: '#85c46a', count: 4, scale: 0.78 },
      { x: w * 0.43, y: h * 0.41, color: '#f4f7fb', count: 4, scale: 0.58 }
    ];

    schools.forEach(function (school, s) {
      for (var i = 0; i < school.count; i += 1) {
        var x = school.x + i * 34 + Math.sin(time * 0.8 + i + s) * 9;
        var y = school.y + Math.sin(time * 1.1 + i) * 14 + (i % 2) * 12;
        drawTinyFish(x, y, 15 * school.scale, 1, school.color);
      }
    });
  }

  function drawTinyFish(x, y, r, direction, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(direction, 1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.56, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(color, -16);
    ctx.beginPath();
    ctx.moveTo(-r * 0.78, 0);
    ctx.lineTo(-r * 1.25, -r * 0.42);
    ctx.lineTo(-r * 1.2, r * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#203749';
    ctx.beginPath();
    ctx.arc(r * 0.45, -r * 0.12, Math.max(1.5, r * 0.08), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawReef(w, h, time) {
    drawRock(w * 0.11, h - 42, 86, '#6d8ca0');
    drawRock(w * 0.35, h - 34, 52, '#7b96a6');
    drawRock(w * 0.78, h - 40, 78, '#5c829b');
    drawRock(w * 0.92, h - 38, 58, '#7793a3');

    drawCoralCluster(w * 0.08, h - 36, 1.05, time);
    drawCoralCluster(w * 0.24, h - 32, 0.74, time + 2);
    drawCoralCluster(w * 0.62, h - 34, 0.78, time + 1);
    drawCoralCluster(w * 0.86, h - 36, 1.12, time + 3);

    drawSeaPlants(w, h, time);
    drawShell(w * 0.49, h - 22, 18, '#f6dcb6');
    drawShell(w * 0.72, h - 24, 15, '#f2b7a0');
    drawStarfish(w * 0.18, h - 25, 17, '#f28b68', time);
    drawStarfish(w * 0.56, h - 24, 14, '#f4b855', time + 1.5);
  }

  function drawSeaPlants(w, h, time) {
    ctx.lineCap = 'round';
    for (var i = 0; i < 18; i += 1) {
      var x = 24 + i * (w / 17);
      var plantHeight = 38 + (i % 5) * 15;
      ctx.strokeStyle = i % 3 ? '#108268' : '#0a6f7a';
      ctx.lineWidth = 4 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(x, h - 24);
      ctx.quadraticCurveTo(x + Math.sin(time * 1.5 + i) * 16, h - 28 - plantHeight * 0.55, x + Math.sin(time + i) * 10, h - 30 - plantHeight);
      ctx.stroke();

      if (i % 2 === 0) {
        ctx.strokeStyle = '#5fc086';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, h - 44 - plantHeight * 0.35);
        ctx.quadraticCurveTo(x + 18, h - 54 - plantHeight * 0.32, x + 22, h - 64 - plantHeight * 0.24);
        ctx.stroke();
      }
    }
  }

  function drawRock(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x - r * 0.34, y, r * 0.5, r * 0.28, -0.1, 0, Math.PI * 2);
    ctx.ellipse(x + r * 0.1, y - r * 0.08, r * 0.58, r * 0.34, 0.05, 0, Math.PI * 2);
    ctx.ellipse(x + r * 0.5, y + r * 0.03, r * 0.34, r * 0.24, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.03, y - r * 0.18, r * 0.28, r * 0.08, -0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCoralCluster(x, y, scale, time) {
    drawBranchCoral(x - 22 * scale, y + 4, 42 * scale, '#ef6b8a', time);
    drawBranchCoral(x + 18 * scale, y + 6, 34 * scale, '#ff9f6e', time + 1.4);
    drawTubeCoral(x + 3 * scale, y + 2, scale, '#9b5fd3');
    drawRoundCoral(x - 4 * scale, y + 8, 24 * scale, '#ffd166');
  }

  function drawBranchCoral(x, y, size, color, time) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(4, size * 0.12);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - size);
    ctx.moveTo(x, y - size * 0.45);
    ctx.quadraticCurveTo(x - size * 0.28, y - size * 0.62, x - size * 0.26 + Math.sin(time) * 2, y - size * 0.86);
    ctx.moveTo(x, y - size * 0.58);
    ctx.quadraticCurveTo(x + size * 0.28, y - size * 0.72, x + size * 0.26 + Math.cos(time) * 2, y - size * 0.95);
    ctx.moveTo(x, y - size * 0.78);
    ctx.quadraticCurveTo(x - size * 0.12, y - size * 0.92, x - size * 0.08, y - size * 1.12);
    ctx.stroke();
    ctx.restore();
  }

  function drawTubeCoral(x, y, scale, color) {
    ctx.fillStyle = color;
    for (var i = 0; i < 4; i += 1) {
      var tx = x + (i - 1.5) * 10 * scale;
      var tubeHeight = (23 + i * 6) * scale;
      ctx.beginPath();
      ctx.roundRect(tx - 5 * scale, y - tubeHeight, 10 * scale, tubeHeight, 6 * scale);
      ctx.fill();
      ctx.fillStyle = '#cdb5f2';
      ctx.beginPath();
      ctx.ellipse(tx, y - tubeHeight, 6 * scale, 3 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
    }
  }

  function drawRoundCoral(x, y, r, color) {
    ctx.fillStyle = color;
    for (var i = 0; i < 7; i += 1) {
      var angle = (Math.PI * 2 * i) / 7;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * r * 0.36, y - r * 0.45 + Math.sin(angle) * r * 0.2, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawShell(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - r, y);
    ctx.quadraticCurveTo(x, y - r * 1.15, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(126, 88, 62, 0.28)';
    ctx.lineWidth = 2;
    for (var i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x, y - r * 0.82);
      ctx.lineTo(x + i * r * 0.28, y - 1);
      ctx.stroke();
    }
  }

  function drawStarfish(x, y, r, color, time) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(time) * 0.08);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (var i = 0; i < 10; i += 1) {
      var radius = i % 2 === 0 ? r : r * 0.42;
      var angle = -Math.PI / 2 + (i * Math.PI) / 5;
      var px = Math.cos(angle) * radius;
      var py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.36)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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
  registerVisitor();
  renderStats();
  resetGame();
  draw();
  setOverlay('Sẵn sàng xuống biển', 'Dùng phím mũi tên để bơi, Enter để đớp mồi gần nhất. Khi CeCe ăn bong bóng, hãy gõ đúng ký tự trong bong bóng đó.', true);
})();
