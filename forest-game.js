(function () {
  var canvas = document.getElementById('gameCanvas');
  var ctx = canvas.getContext('2d');
  var startButton = document.getElementById('startButton');
  var pauseButton = document.getElementById('pauseButton');
  var endButton = document.getElementById('endButton');
  var overlay = document.getElementById('overlay');
  var scoreValue = document.getElementById('scoreValue');
  var sizeValue = document.getElementById('sizeValue');
  var hungerValue = document.getElementById('hungerValue');
  var targetValue = document.getElementById('targetValue');
  var wordInput = document.getElementById('wordInput');
  var messageValue = document.getElementById('messageValue');
  var playerCountValue = document.getElementById('playerCountValue');
  var playCountValue = document.getElementById('playCountValue');
  var statsScopeValue = document.getElementById('statsScopeValue');
  var leaderboardList = document.getElementById('leaderboardList');

  var config = window.CECE_GAME_CONFIG || {};
  var statsEndpoint = String(config.STATS_WEB_APP_URL || '').trim();
  var gameLevel = 'level2';
  var storageKey = 'ceceTypingStats-' + gameLevel;
  var visitorKey = 'ceceTypingVisitorId';
  var requestId = 0;
  var keys = {};
  var fruits = [];
  var beasts = [];
  var particles = [];
  var running = false;
  var paused = false;
  var lastTime = 0;
  var spawnTimer = 0;
  var score = 0;
  var wrongCount = 0;
  var hunger = 60;
  var roundRecorded = false;
  var spaceHeld = false;
  var jumpCharge = 0;
  var beastGrace = 0;
  var stats = loadStats();
  var visitorId = getVisitorId();

  var fruitNames = [
    'apple','banana','orange','grape','mango','pineapple','watermelon','strawberry','blueberry','blackberry',
    'raspberry','cherry','peach','pear','plum','apricot','kiwi','papaya','guava','lychee',
    'durian','coconut','lemon','lime','grapefruit','tangerine','mandarin','pomegranate','fig','date',
    'dragonfruit','starfruit','passionfruit','jackfruit','persimmon','cranberry','mulberry','boysenberry','gooseberry','currant',
    'cantaloupe','honeydew','melon','nectarine','plantain','olive','avocado','tomato','kumquat','yuzu',
    'pomelo','rambutan','longan','soursop','custardapple','sugarapple','breadfruit','tamarind','sapodilla','loquat',
    'quince','elderberry','cloudberry','lingonberry','acai','bilberry','huckleberry','salmonberry','juniperberry','miraclefruit',
    'jabuticaba','feijoa','cherimoya','mangosteen','salak','ackee','cupuacu','calamansi','bergamot','bloodorange',
    'uglifruit','buddhashand','hornedmelon','kiwano','pepino','medlar','pawpaw','mayhaw','serviceberry','barberry',
    'rowanberry','sea-buckthorn','aronia','chokeberry','saskatoon','marionberry','tayberry','loganberry','wineberry','dewberry',
    'youngberry','naranjilla','lucuma','mamey','mamoncillo','monstera','icecreambean','roseapple','waxapple','waterapple',
    'woodapple','baelfruit','ambarella','hogplum','jocote','jujube','pricklypear','cactuspear','pitaya','granadilla',
    'sweetlime','keylime','sudachi','kabosu','fingerlime','clementine','satsuma','minneola','tangelo','oroblanco',
    'whitecurrant','redcurrant','blackcurrant','greengage','damson','mirabelle','yellowplum','redplum','greenapple','redapple',
    'goldenapple','pinklady','fuji','gala','grannysmith','plantainbanana','ladyfingerbanana','redbanana','babybanana','burrobanana',
    'champagnegrape','concordgrape','muscat','raisins','sultana','greenpear','asianpear','boscpear','anjoupear','bartlettpear',
    'flatpeach','whitepeach','yellowpeach','donutpeach','whitegrape','redgrape','blackgrape','seedlessgrape','sourcherry','sweetcherry',
    'rainiercherry','bingcherry','orangeberry','pineberry','whitecurrant','goldenberry','cape-gooseberry','physalis','groundcherry','surinamcherry',
    'acerola','monkeyorange','santol','langsat','duku','pulasan','marang','chempedak','bignay','bilimbi',
    'carambola','chico','cashewapple','noni','banana-berry','coco-plum','desertlime','emublueberry','goumi','hardykiwi',
    'hawthorn','imbe','indianfig','kaffirlime','lemonadefruit','limequat','mandarinquat','mangaba','maprang','maqui',
    'melonpear','mountainapple','muscadine','nashi','okrafruit','osageorange','palmyra','pequi','phalsa','pineapple-guava',
    'pindo-palm','quenepa','redmombin','rosehip','safou','snakefruit','soncoya','spanishlime','stinkingtoe','tree-tomato',
    'velvetapple','wampee','wildorange','yellowpassionfruit','zinfandelgrape','asianplum','bitterorange','blackapple','bluegrape','breadnut'
  ];

  var monkey = {
    x: 180,
    y: 300,
    vx: 0,
    vy: 0,
    r: 30,
    baseR: 30,
    grounded: false,
    direction: 1,
    hurtTimer: 0
  };

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeWord(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, '').replace(/_/g, '-');
  }

  function fitCanvas() {
    var rect = canvas.getBoundingClientRect();
    var ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(640, Math.floor(rect.width * ratio));
    canvas.height = Math.max(420, Math.floor(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function width() {
    return canvas.width / (window.devicePixelRatio || 1);
  }

  function height() {
    return canvas.height / (window.devicePixelRatio || 1);
  }

  function groundY() {
    return height() - 58;
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

  function loadStats() {
    try {
      var parsed = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!parsed || typeof parsed !== 'object') return { players: 0, plays: 0, scores: [] };
      return {
        players: Number(parsed.players) || 0,
        plays: Number(parsed.plays) || 0,
        scores: Array.isArray(parsed.scores) ? parsed.scores : []
      };
    } catch (error) {
      return { players: 0, plays: 0, scores: [] };
    }
  }

  function saveStats() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(stats));
    } catch (error) {}
  }

  function applyRemoteStats(payload) {
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

  function renderStats() {
    statsScopeValue.textContent = hasGlobalStats() ? 'Top 3 điểm cao toàn cầu' : 'Top 3 điểm cao cục bộ';
    playerCountValue.textContent = stats.players;
    playCountValue.textContent = stats.plays;
    leaderboardList.textContent = '';
    var topScores = stats.scores.slice().sort(function (a, b) {
      return b.score - a.score || a.at - b.at;
    }).slice(0, 3);
    if (!topScores.length) {
      var empty = document.createElement('li');
      empty.textContent = 'Chưa có điểm';
      leaderboardList.appendChild(empty);
      return;
    }
    topScores.forEach(function (item) {
      var row = document.createElement('li');
      row.textContent = item.score + ' điểm';
      leaderboardList.appendChild(row);
    });
  }

  function registerVisitor() {
    if (hasGlobalStats()) {
      fetchGlobalStats({ action: 'visit' }).then(applyRemoteStats).catch(renderStats);
      return;
    }
    stats.players = Math.max(stats.players, 1);
    saveStats();
    renderStats();
  }

  function recordPlayStart() {
    if (hasGlobalStats()) {
      fetchGlobalStats({ action: 'start' }).then(applyRemoteStats).catch(function () {
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
      setOverlay('Đang lưu điểm', 'Khỉ con đang gửi điểm lên bảng xếp hạng toàn cầu.', true);
      fetchGlobalStats({ action: 'score', score: Math.max(0, finalScore) }, 15000)
        .then(function (payload) {
          applyRemoteStats(payload);
          showFinalOverlay(finalScore, !!payload.newBest, reason);
        })
        .catch(function () {
          recordLocalFinalScore(finalScore);
          showFinalOverlay(finalScore, finalScore > 0 && finalScore > oldBest, reason);
        });
      return;
    }
    recordLocalFinalScore(finalScore);
    showFinalOverlay(finalScore, finalScore > 0 && finalScore > oldBest, reason);
  }

  function recordLocalFinalScore(finalScore) {
    if (finalScore <= 0) return;
    stats.scores.push({ score: finalScore, at: Date.now() });
    stats.scores = stats.scores.sort(function (a, b) {
      return b.score - a.score || a.at - b.at;
    }).slice(0, 20);
    saveStats();
    renderStats();
  }

  function showFinalOverlay(finalScore, isNewBest, reason) {
    if (isNewBest) {
      setOverlay('Chúc mừng bạn là người nuôi khỉ xuất sắc nhất!', 'Điểm kỷ lục mới của bạn: ' + finalScore + '.', true);
    } else {
      setOverlay('Trò chơi kết thúc', reason || 'Bấm Bắt đầu để thử lại.', true);
    }
  }

  function updateHud() {
    scoreValue.textContent = score;
    sizeValue.textContent = (monkey.r / monkey.baseR).toFixed(1) + 'x';
    hungerValue.textContent = Math.max(0, Math.ceil(hunger)) + 's';
    var target = getNearestFruit();
    targetValue.textContent = target ? target.word : 'Chưa có';
  }

  function pickFruitWord() {
    return fruitNames[Math.floor(Math.random() * fruitNames.length)];
  }

  function resetGame() {
    fruits = [];
    beasts = [];
    particles = [];
    score = 0;
    wrongCount = 0;
    hunger = 60;
    roundRecorded = false;
    spawnTimer = 0;
    jumpCharge = 0;
    spaceHeld = false;
    beastGrace = 8;
    monkey.x = width() * 0.18;
    monkey.y = groundY() - monkey.r;
    monkey.vx = 0;
    monkey.vy = 0;
    monkey.r = monkey.baseR;
    monkey.hurtTimer = 0;
    for (var i = 0; i < 7; i += 1) spawnFruit();
    for (var j = 0; j < 3; j += 1) spawnBeast(j);
    updateHud();
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
    wordInput.disabled = false;
    wordInput.value = '';
    wordInput.focus();
    messageValue.textContent = 'Đứng gần trái cây, gõ tên tiếng Anh rồi Enter để hái.';
    setOverlay('', '', false);
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function togglePause() {
    if (!running) return;
    paused = !paused;
    pauseButton.textContent = paused ? 'Tiếp tục' : 'Tạm dừng';
    setOverlay('Đang tạm dừng', 'Bấm Tiếp tục để khỉ con vào rừng tiếp.', paused);
    if (!paused) {
      wordInput.focus();
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
    wordInput.disabled = true;
    updateHud();
    recordFinalScore(finalScore, reason);
  }

  function spawnFruit() {
    var treeIndex = Math.floor(random(0, 5));
    var treeX = 150 + treeIndex * (width() - 300) / 4 + random(-42, 42);
    var y = random(120, groundY() - 170);
    fruits.push({
      x: clamp(treeX, 48, width() - 48),
      y: y,
      r: random(18, 25),
      word: pickFruitWord(),
      wobble: random(0, Math.PI * 2)
    });
  }

  function spawnBeast(index) {
    var fromLeft = Math.random() < 0.5;
    beasts.push({
      x: fromLeft ? -80 - index * 150 : width() + 80 + index * 150,
      y: groundY() - 38,
      r: random(36, 48),
      vx: fromLeft ? random(32, 58) : random(-58, -32),
      color: Math.random() < 0.5 ? '#7a3f32' : '#5d4a86',
      belly: 0
    });
  }

  function getNearestFruit() {
    if (!fruits.length) return null;
    return fruits.reduce(function (best, item) {
      var d = Math.hypot(item.x - monkey.x, item.y - monkey.y);
      if (!best || d < best.d) return { fruit: item, d: d };
      return best;
    }, null).fruit;
  }

  function getHarvestableFruit() {
    var nearest = null;
    var nearestDistance = 170 + monkey.r;
    fruits.forEach(function (fruit) {
      var horizontalGap = Math.abs(fruit.x - monkey.x);
      var verticalGap = Math.abs(fruit.y - monkey.y);
      var d = Math.hypot(horizontalGap, verticalGap * 0.65);
      if (horizontalGap < 115 + monkey.r && verticalGap < 225 && d < nearestDistance) {
        nearest = fruit;
        nearestDistance = d;
      }
    });
    return nearest;
  }

  function handleWordSubmit() {
    if (!running || paused) return;
    var typed = normalizeWord(wordInput.value);
    var fruit = getHarvestableFruit();
    if (!fruit) {
      messageValue.textContent = 'Khỉ con cần đứng gần trái cây hơn mới hái được.';
      wordInput.value = '';
      return;
    }
    if (typed === normalizeWord(fruit.word)) {
      eatFruit(fruit);
    } else {
      wrongCount += 1;
      monkey.r = Math.max(18, monkey.r - 2.5);
      monkey.hurtTimer = 0.8;
      messageValue.textContent = wrongCount < 3 ? 'Sai rồi, khỉ con đau bụng và nhỏ đi. Sai ' + wrongCount + '/3.' : 'Sai 3 lần, khỉ con mất điểm và teo lại.';
      if (wrongCount >= 3) {
        wrongCount = 0;
        score -= score === 0 ? 1 : 15;
        monkey.r = Math.max(16, monkey.r - 4);
        if (score < 0) {
          updateHud();
          endGame('Khỉ con đói quá vì bị âm điểm.');
          return;
        }
      }
    }
    wordInput.value = '';
    updateHud();
  }

  function eatFruit(fruit) {
    fruits = fruits.filter(function (item) {
      return item !== fruit;
    });
    score += 10;
    hunger = 60;
    wrongCount = 0;
    monkey.r = Math.min(115, monkey.r + 1.45);
    addParticles(fruit.x, fruit.y, '#ffe07a', 18);
    messageValue.textContent = 'Đúng rồi! Khỉ con hái được ' + fruit.word + ' và lớn thêm một chút.';
    spawnFruit();
    updateHud();
  }

  function updateMonkey(dt) {
    var move = 0;
    if (keys.ArrowLeft) move -= 1;
    if (keys.ArrowRight) move += 1;
    monkey.vx = move * 210;
    if (move) monkey.direction = move > 0 ? 1 : -1;

    if (spaceHeld && monkey.grounded) {
      jumpCharge = clamp(jumpCharge + dt, 0, 1.2);
    }

    monkey.vy += 900 * dt;
    monkey.x += monkey.vx * dt;
    monkey.y += monkey.vy * dt;

    var floor = groundY() - monkey.r;
    if (monkey.y >= floor) {
      monkey.y = floor;
      monkey.vy = 0;
      monkey.grounded = true;
    } else {
      monkey.grounded = false;
    }

    if (keys.ArrowUp && monkey.grounded && !spaceHeld) {
      monkey.vy = -430;
      monkey.grounded = false;
    }

    monkey.x = clamp(monkey.x, monkey.r + 8, width() - monkey.r - 8);
    monkey.hurtTimer = Math.max(0, monkey.hurtTimer - dt);
  }

  function updateFruits(dt) {
    spawnTimer -= dt;
    if (spawnTimer <= 0 && fruits.length < 9) {
      spawnFruit();
      spawnTimer = random(3, 6);
    }
    fruits.forEach(function (fruit) {
      fruit.wobble += dt * 2;
      fruit.y += Math.sin(fruit.wobble) * 3 * dt;
    });
  }

  function updateBeasts(dt) {
    beasts.forEach(function (beast) {
      beast.x += beast.vx * dt;
      beast.belly = Math.max(0, beast.belly - dt);
      if (beast.vx > 0 && beast.x > width() + beast.r + 20) beast.x = -beast.r - random(50, 220);
      if (beast.vx < 0 && beast.x < -beast.r - 20) beast.x = width() + beast.r + random(50, 220);

      fruits.slice().forEach(function (fruit) {
        if (Math.hypot(beast.x - fruit.x, beast.y - fruit.y) < beast.r + fruit.r) {
          fruits = fruits.filter(function (item) {
            return item !== fruit;
          });
          beast.r = Math.min(98, beast.r + 3.2);
          beast.belly = 0.8;
          addParticles(fruit.x, fruit.y, '#ff9f43', 10);
          if (fruits.length < 5) spawnFruit();
        }
      });

      if (beastGrace <= 0 && beast.r > monkey.r * 0.92 && Math.hypot(beast.x - monkey.x, beast.y - monkey.y) < beast.r * 0.72 + monkey.r * 0.72) {
        endGame('Khỉ con bị thú dữ lớn hơn ăn thịt.');
      }
    });
  }

  function update(dt) {
    beastGrace = Math.max(0, beastGrace - dt);
    hunger -= dt;
    if (hunger <= 0) {
      endGame('Khỉ con không hái được trái cây trong 1 phút nên chết vì đói.');
      return;
    }
    updateMonkey(dt);
    updateFruits(dt);
    updateBeasts(dt);
    updateParticles(dt);
    updateHud();
  }

  function addParticles(x, y, color, count) {
    for (var i = 0; i < count; i += 1) {
      particles.push({
        x: x,
        y: y,
        vx: random(-70, 70),
        vy: random(-95, 20),
        r: random(2, 5),
        life: random(0.5, 1),
        color: color
      });
    }
  }

  function updateParticles(dt) {
    particles.forEach(function (p) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 140 * dt;
      p.life -= dt;
    });
    particles = particles.filter(function (p) {
      return p.life > 0;
    });
  }

  function drawBackground(time) {
    var w = width();
    var h = height();
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#bdf3d1');
    sky.addColorStop(0.45, '#6dcc87');
    sky.addColorStop(1, '#2a8b55');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255, 248, 178, 0.35)';
    ctx.beginPath();
    ctx.arc(w * 0.1, h * 0.12, 54, 0, Math.PI * 2);
    ctx.fill();

    drawForestLayer(w, h, time, 0.22, '#2d8a55', h - 210);
    drawForestLayer(w, h, time + 1, 0.35, '#1f7549', h - 160);

    ctx.fillStyle = '#6f4d2e';
    ctx.fillRect(0, groundY(), w, h - groundY());
    ctx.fillStyle = '#3f9d56';
    ctx.beginPath();
    ctx.moveTo(0, groundY());
    for (var x = 0; x <= w; x += 70) {
      ctx.quadraticCurveTo(x + 35, groundY() - 24 + Math.sin(time + x) * 5, x + 70, groundY());
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();

    drawTrees(w, h, time);
  }

  function drawForestLayer(w, h, time, alpha, color, baseY) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    for (var x = 0; x <= w; x += 90) {
      ctx.quadraticCurveTo(x + 45, baseY - 60 + Math.sin(time + x * 0.01) * 12, x + 90, baseY);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
    ctx.restore();
  }

  function drawTrees(w, h, time) {
    var positions = [0.08, 0.24, 0.42, 0.6, 0.78, 0.93];
    positions.forEach(function (ratio, i) {
      var x = w * ratio;
      var trunkH = 185 + (i % 3) * 26;
      ctx.fillStyle = '#7b4f29';
      ctx.fillRect(x - 11, groundY() - trunkH, 22, trunkH);
      ctx.fillStyle = i % 2 ? '#2f9b4e' : '#248c45';
      for (var j = 0; j < 5; j += 1) {
        ctx.beginPath();
        ctx.arc(x + Math.cos(j) * 44 + Math.sin(time + i) * 4, groundY() - trunkH + j * 14 - 28, 58 - j * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function drawFruit(fruit) {
    ctx.save();
    ctx.translate(fruit.x, fruit.y);
    var hue = fruit.word.charCodeAt(0) % 6;
    var colors = ['#f04f4f', '#f9c74f', '#90be6d', '#f8961e', '#b565f2', '#43aa8b'];
    ctx.fillStyle = colors[hue];
    ctx.strokeStyle = 'rgba(44, 77, 36, 0.35)';
    ctx.lineWidth = 2;
    if (/banana|plantain/i.test(fruit.word)) {
      ctx.beginPath();
      ctx.arc(0, -6, fruit.r, 0.25, Math.PI * 1.25);
      ctx.lineWidth = fruit.r * 0.55;
      ctx.strokeStyle = '#f9d84a';
      ctx.stroke();
    } else if (/grape|berry|currant/i.test(fruit.word)) {
      for (var i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.arc((i % 2) * fruit.r * 0.45 - fruit.r * 0.2, Math.floor(i / 2) * fruit.r * 0.42, fruit.r * 0.34, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, fruit.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#2b7a35';
    ctx.beginPath();
    ctx.ellipse(fruit.r * 0.2, -fruit.r * 0.95, fruit.r * 0.28, fruit.r * 0.14, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1b2d1c';
    ctx.font = '700 11px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(fruit.word, 0, fruit.r + 16);
    ctx.restore();
  }

  function drawMonkey() {
    ctx.save();
    ctx.translate(monkey.x, monkey.y);
    ctx.scale(monkey.direction, 1);
    var hurt = monkey.hurtTimer > 0;
    ctx.fillStyle = hurt ? '#b66a3a' : '#9b6138';
    ctx.beginPath();
    ctx.ellipse(0, 8, monkey.r * 0.88, monkey.r * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c98752';
    ctx.beginPath();
    ctx.arc(0, -monkey.r * 0.45, monkey.r * 0.72, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e7b882';
    ctx.beginPath();
    ctx.ellipse(0, -monkey.r * 0.35, monkey.r * 0.45, monkey.r * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1f1f1f';
    ctx.beginPath();
    ctx.arc(-monkey.r * 0.18, -monkey.r * 0.5, monkey.r * 0.06, 0, Math.PI * 2);
    ctx.arc(monkey.r * 0.18, -monkey.r * 0.5, monkey.r * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hurt ? '#9a1d2a' : '#3c2a1e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -monkey.r * 0.33, monkey.r * 0.2, hurt ? Math.PI : 0, hurt ? Math.PI * 2 : Math.PI);
    ctx.stroke();
    ctx.strokeStyle = '#8b542f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(-monkey.r * 0.76, 18, monkey.r * 0.44, Math.PI * 0.7, Math.PI * 1.8);
    ctx.stroke();
    ctx.restore();
  }

  function drawBeast(beast) {
    ctx.save();
    var direction = beast.vx >= 0 ? 1 : -1;
    ctx.translate(beast.x, beast.y);
    ctx.scale(direction, 1);
    ctx.fillStyle = beast.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, beast.r * 1.15, beast.r * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1d1d1d';
    ctx.beginPath();
    ctx.arc(beast.r * 0.46, -beast.r * 0.18, beast.r * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(beast.r * 0.74, 4);
    ctx.lineTo(beast.r * 0.9, 16);
    ctx.lineTo(beast.r * 0.58, 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = beast.belly > 0 ? 'rgba(255, 209, 102, 0.45)' : 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.ellipse(-beast.r * 0.18, 6, beast.r * 0.36, beast.r * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    particles.forEach(function (p) {
      ctx.save();
      ctx.globalAlpha = clamp(p.life, 0, 1);
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
    fruits.forEach(drawFruit);
    beasts.forEach(drawBeast);
    drawMonkey();
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

  wordInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleWordSubmit();
    }
  });

  window.addEventListener('keydown', function (event) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(event.key) !== -1) {
      event.preventDefault();
    }
    keys[event.key] = true;
    if (event.key === ' ') spaceHeld = true;
  });

  window.addEventListener('keyup', function (event) {
    keys[event.key] = false;
    if (event.key === ' ') {
      if (spaceHeld && monkey.grounded) {
        monkey.vy = -360 - jumpCharge * 260;
        monkey.grounded = false;
      }
      jumpCharge = 0;
      spaceHeld = false;
    }
  });

  window.addEventListener('resize', function () {
    fitCanvas();
    draw();
  });

  fitCanvas();
  registerVisitor();
  renderStats();
  resetGame();
  wordInput.disabled = true;
  draw();
  setOverlay('Sẵn sàng vào rừng', 'Dùng phím mũi tên để chạy. Giữ Space để lấy lực nhảy. Đứng gần trái cây, gõ tên tiếng Anh rồi Enter để hái.', true);
})();
