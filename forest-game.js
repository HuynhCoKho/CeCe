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
  var targetMeaning = document.getElementById('targetMeaning');
  var wordInput = document.getElementById('wordInput');
  var messageValue = document.getElementById('messageValue');
  var comboValue = document.getElementById('comboValue');
  var titleValue = document.getElementById('titleValue');
  var skinValue = document.getElementById('skinValue');
  var badgeList = document.getElementById('badgeList');
  var playerCountValue = document.getElementById('playerCountValue');
  var playCountValue = document.getElementById('playCountValue');
  var statsScopeValue = document.getElementById('statsScopeValue');
  var leaderboardList = document.getElementById('leaderboardList');

  var config = window.CECE_GAME_CONFIG || {};
  var statsEndpoint = String(config.STATS_WEB_APP_URL || '').trim();
  var gameLevel = 'level2';
  var storageKey = 'ceceTypingStats-' + gameLevel;
  var rewardStorageKey = 'ceceTypingRewards-' + gameLevel;
  var visitorKey = 'ceceTypingVisitorId';
  var requestId = 0;
  var fruitSprite = new Image();
  var fruitSpriteLoaded = false;
  var keys = {};
  var fruits = [];
  var beasts = [];
  var particles = [];
  var running = false;
  var paused = false;
  var lastTime = 0;
  var spawnTimer = 0;
  var beastSpawnTimer = 0;
  var score = 0;
  var fruitCount = 0;
  var combo = 0;
  var bestCombo = 0;
  var fastAnswers = 0;
  var survivalTime = 0;
  var currentTitle = 'Người hái quả mới';
  var currentSkin = 'brown';
  var wrongCount = 0;
  var hunger = 60;
  var roundRecorded = false;
  var spaceHeld = false;
  var jumpCharge = 0;
  var beastGrace = 0;
  var stats = loadStats();
  var rewards = loadRewards();
  var visitorId = getVisitorId();

  fruitSprite.onload = function () {
    fruitSpriteLoaded = true;
    draw();
  };
  fruitSprite.src = 'assets/fruits-icons.png?v=20260628-fruits-icons';

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

  var fruitCatalog = [
    'apple','apricot','avocado','banana','blackberries','blueberries','boysenberry','cantaloupe','cape gooseberry','cherry',
    'clementine','cocos plum','coconut','cranberry','currant','date','dragon fruit','durian','elephant apple','feijoa',
    'fig','finger lime','grape','grapefruit','guava','honeydew','jackfruit','jambul','kiwifruit','kumquat',
    'lemon','lime','loquat','lychee','mandarin','mango','mangosteen','mulberry','nance','nectarine',
    'orange','papaya','passion fruit','peach','pear','persimmon','pineapple','pomegranate','pomelo','quince',
    'raspberry','red banana','salak','star fruit','strawberry','tamarillo','tangelo','ugli fruit','velvet apple','watermelon',
    'acai berry','acerola','ackee','african star apple','african cucumber','akebi','albizio fruit','amalaki','ambarella','american persimmon',
    'ananas','atemoya','babaco','baccaurea','bael fruit','bali fruit','bambangan','berry white','bilberry','black sapote',
    'blackcurrant','blackolive','buddha hand','caimito','canistel','carambola','casaba melon','cattley guava','cempedak','cloudberry',
    'cocona','copoiba','cornelian cherry','cupuacu','damson','duku','durian berry','egg fruit','emu apple','fairchild tangerine',
    'gac fruit','genip','goldenberry','gooseberry','grumichama','hawaiian pineapple','ilama','jaboticaba','jujube','juniper berry',
    'kakadu plum','kecombrang fruit','kinkajou','koolfruit','kuruba','langsat','lanzones','lemon drop','lilikoi','lucuma',
    'mabolo','mamey sapote','manila tamarind','marian plum','marolo','maypop','melon pear','miracle fruit','mountain papaya','muntingia calabura',
    'nangka','natal plum','noni','nashi','oil palm fruit','olive','opuntia fruit','orinoco grape','pandanus fruit','palm fruit',
    'peach palm','pepino','peruvian apple cactus','persian lime','pili nut','pitahaya','platania','plumcot','pond apple','prickly pear',
    'pulasan','quandong','rambutan','ramontchi','rollinia','rose apple','salal berry','sandoricum','santol','satsuma',
    'sea buckthorn','serviceberry','snake fruit','solanum berry','soursop','spanish lime','spinel berry','sugar apple','surinam cherry','tamarind',
    'tayberry','teddy bear melon','thimbleberry','thunder god vine','tomatillo','tongkat ali fruit','tungin','uvaria','vanilla bean','voavanga',
    'water apple',
    'white mulberry','wineberry','winter melon','wolfberry','voli pear','yuzu','ziziphus','abiu','achachairu','african mangosteen',
    'african mango','blue java banana','brazilian guava','caja','camu camu','honeyberry','salvia fruit','star apple','yumberry'
  ].map(function (word, index) {
    return { word: word, iconIndex: index };
  });

  var fruitMeanings = {
    apple: 'quả táo',
    banana: 'quả chuối',
    orange: 'quả cam',
    grape: 'quả nho',
    mango: 'quả xoài',
    pineapple: 'quả dứa',
    watermelon: 'quả dưa hấu',
    strawberry: 'quả dâu tây',
    blueberry: 'quả việt quất',
    blackberry: 'quả mâm xôi đen',
    raspberry: 'quả mâm xôi',
    cherry: 'quả anh đào',
    peach: 'quả đào',
    pear: 'quả lê',
    plum: 'quả mận',
    apricot: 'quả mơ',
    kiwi: 'quả kiwi',
    papaya: 'quả đu đủ',
    guava: 'quả ổi',
    lychee: 'quả vải',
    durian: 'quả sầu riêng',
    coconut: 'quả dừa',
    lemon: 'quả chanh vàng',
    lime: 'quả chanh xanh',
    grapefruit: 'quả bưởi chùm',
    tangerine: 'quả quýt',
    mandarin: 'quả quýt',
    pomegranate: 'quả lựu',
    fig: 'quả sung',
    date: 'quả chà là',
    dragonfruit: 'quả thanh long',
    starfruit: 'quả khế',
    passionfruit: 'quả chanh dây',
    jackfruit: 'quả mít',
    persimmon: 'quả hồng',
    cranberry: 'quả nam việt quất',
    mulberry: 'quả dâu tằm',
    cantaloupe: 'dưa lưới',
    honeydew: 'dưa mật',
    melon: 'quả dưa',
    nectarine: 'quả xuân đào',
    plantain: 'chuối nấu',
    olive: 'quả ô liu',
    avocado: 'quả bơ',
    tomato: 'quả cà chua',
    kumquat: 'quả tắc',
    pomelo: 'quả bưởi',
    rambutan: 'quả chôm chôm',
    longan: 'quả nhãn',
    soursop: 'quả mãng cầu xiêm',
    custardapple: 'quả na',
    sugarapple: 'quả na',
    breadfruit: 'quả sa kê',
    tamarind: 'quả me',
    sapodilla: 'quả hồng xiêm',
    loquat: 'quả nhót tây',
    quince: 'quả mộc qua',
    mangosteen: 'quả măng cụt',
    salak: 'quả da rắn',
    calamansi: 'quả tắc',
    bloodorange: 'cam ruột đỏ',
    hornedmelon: 'dưa sừng',
    kiwano: 'dưa sừng',
    pepino: 'dưa lê nam Mỹ',
    roseapple: 'quả roi',
    waxapple: 'quả roi',
    waterapple: 'quả roi',
    woodapple: 'quả táo gỗ',
    jujube: 'quả táo tàu',
    pricklypear: 'quả lê gai',
    cactuspear: 'quả lê gai',
    pitaya: 'quả thanh long',
    sweetlime: 'chanh ngọt',
    keylime: 'chanh key',
    fingerlime: 'chanh ngón tay',
    clementine: 'quýt clementine',
    tangelo: 'quýt lai bưởi',
    raisins: 'nho khô',
    physalis: 'quả tầm bóp',
    groundcherry: 'quả tầm bóp',
    acerola: 'sơ ri',
    langsat: 'quả bòn bon',
    duku: 'quả bòn bon',
    pulasan: 'quả pulasan',
    marang: 'quả marang',
    carambola: 'quả khế',
    chico: 'quả hồng xiêm',
    cashewapple: 'quả điều',
    noni: 'quả nhàu',
    hardykiwi: 'kiwi nhỏ',
    kaffirlime: 'quả chúc',
    nashi: 'lê châu Á',
    okrafruit: 'quả đậu bắp',
    palmyra: 'quả thốt nốt',
    rosehip: 'quả tầm xuân',
    snakefruit: 'quả da rắn',
    spanishlime: 'chanh Tây Ban Nha',
    treetomato: 'cà chua thân gỗ',
    'tree-tomato': 'cà chua thân gỗ',
    velvetapple: 'quả thị nhung',
    wampee: 'quả hồng bì',
    wildorange: 'cam dại',
    yellowpassionfruit: 'chanh dây vàng',
    asianplum: 'mận châu Á',
    bitterorange: 'cam đắng',
    blackapple: 'táo đen',
    bluegrape: 'nho xanh tím',
    breadnut: 'hạt sa kê'
  };

  var fruitRoots = [
    ['passionfruit', 'chanh dây'], ['dragonfruit', 'thanh long'], ['starfruit', 'khế'], ['grapefruit', 'bưởi chùm'],
    ['gooseberry', 'lý gai'], ['currant', 'lý chua'], ['berry', 'dâu'], ['cherry', 'anh đào'], ['grape', 'nho'],
    ['apple', 'táo'], ['banana', 'chuối'], ['orange', 'cam'], ['peach', 'đào'], ['pear', 'lê'], ['plum', 'mận'],
    ['lime', 'chanh'], ['melon', 'dưa'], ['kiwi', 'kiwi'], ['fig', 'sung'], ['mango', 'xoài'], ['papaya', 'đu đủ'],
    ['guava', 'ổi'], ['lychee', 'vải'], ['coconut', 'dừa'], ['tomato', 'cà chua'], ['avocado', 'bơ']
  ];

  var fruitModifiers = [
    ['white', 'trắng'], ['black', 'đen'], ['blue', 'xanh tím'], ['red', 'đỏ'], ['green', 'xanh'], ['yellow', 'vàng'],
    ['golden', 'vàng'], ['pink', 'hồng'], ['sour', 'chua'], ['sweet', 'ngọt'], ['asian', 'châu Á'], ['wild', 'dại'],
    ['baby', 'nhỏ'], ['seedless', 'không hạt'], ['flat', 'dẹt']
  ];

  var rewardNames = {
    firstFruit: 'Quả đầu tiên',
    speedStar: 'Tia chớp gõ chữ',
    comboFive: 'Combo 5',
    forestSurvivor: 'Sống sót trong rừng',
    giantMonkey: 'Khỉ lớn khỏe',
    fruitHero: 'Anh hùng trái cây',
    titleRookie: 'Người hái quả tập sự',
    titleRanger: 'Người giữ rừng nhanh tay',
    titleCombo: 'Vua combo nhí',
    sparkle: 'Lấp lánh combo',
    leafTrail: 'Lá bay theo bước',
    golden: 'Skin khỉ vàng',
    leafCape: 'Skin áo lá',
    berryCheeks: 'Skin má dâu'
  };

  var skinLabels = {
    brown: 'Skin nâu rừng',
    golden: 'Skin khỉ vàng',
    leafCape: 'Skin áo lá',
    berryCheeks: 'Skin má dâu'
  };

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

  function loadRewards() {
    try {
      var parsed = JSON.parse(localStorage.getItem(rewardStorageKey) || 'null');
      if (!parsed || typeof parsed !== 'object') return { badges: [], titles: [], effects: [], skins: ['brown'] };
      return {
        badges: Array.isArray(parsed.badges) ? parsed.badges : [],
        titles: Array.isArray(parsed.titles) ? parsed.titles : [],
        effects: Array.isArray(parsed.effects) ? parsed.effects : [],
        skins: Array.isArray(parsed.skins) && parsed.skins.length ? parsed.skins : ['brown']
      };
    } catch (error) {
      return { badges: [], titles: [], effects: [], skins: ['brown'] };
    }
  }

  function saveRewards() {
    try {
      localStorage.setItem(rewardStorageKey, JSON.stringify(rewards));
    } catch (error) {}
  }

  function hasReward(type, id) {
    return rewards[type].indexOf(id) !== -1;
  }

  function addReward(type, id) {
    if (hasReward(type, id)) return false;
    rewards[type].push(id);
    return true;
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

  function renderRewards() {
    comboValue.textContent = combo;
    titleValue.textContent = currentTitle;
    skinValue.textContent = skinLabels[currentSkin] || skinLabels.brown;
    if (!rewards.badges.length) {
      badgeList.textContent = 'Chưa có huy hiệu';
      return;
    }
    badgeList.textContent = rewards.badges.slice(-3).map(function (id) {
      return rewardNames[id] || id;
    }).join(' • ');
  }

  function getBestSkin() {
    if (hasReward('skins', 'berryCheeks')) return 'berryCheeks';
    if (hasReward('skins', 'leafCape')) return 'leafCape';
    if (hasReward('skins', 'golden')) return 'golden';
    return 'brown';
  }

  function getRunTitle() {
    if (bestCombo >= 10 || hasReward('titles', 'titleCombo')) return rewardNames.titleCombo;
    if (fastAnswers >= 5 || hasReward('titles', 'titleRanger')) return rewardNames.titleRanger;
    if (fruitCount >= 1 || hasReward('titles', 'titleRookie')) return rewardNames.titleRookie;
    return 'Người hái quả mới';
  }

  function unlockRunRewards(finalScore) {
    var unlocked = [];

    function unlock(type, id) {
      if (addReward(type, id)) unlocked.push(rewardNames[id] || id);
    }

    if (fruitCount >= 1) {
      unlock('badges', 'firstFruit');
      unlock('titles', 'titleRookie');
    }
    if (fastAnswers >= 3) {
      unlock('badges', 'speedStar');
      unlock('titles', 'titleRanger');
      unlock('effects', 'sparkle');
    }
    if (bestCombo >= 5) {
      unlock('badges', 'comboFive');
      unlock('effects', 'leafTrail');
    }
    if (survivalTime >= 60) unlock('badges', 'forestSurvivor');
    if (monkey.r / monkey.baseR >= 1.45) unlock('badges', 'giantMonkey');
    if (fruitCount >= 15) unlock('badges', 'fruitHero');
    if (finalScore >= 120) unlock('skins', 'golden');
    if (survivalTime >= 90) unlock('skins', 'leafCape');
    if (fruitCount >= 20) unlock('skins', 'berryCheeks');
    if (bestCombo >= 10) unlock('titles', 'titleCombo');

    currentSkin = getBestSkin();
    currentTitle = getRunTitle();
    saveRewards();
    renderRewards();
    return unlocked;
  }

  function getFinalBonus() {
    return {
      survival: Math.floor(survivalTime / 10) * 2,
      size: Math.max(0, Math.round((monkey.r / monkey.baseR - 1) * 25)),
      combo: bestCombo >= 5 ? Math.min(30, bestCombo * 2) : 0
    };
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

  function recordFinalScore(finalScore, reason, bonus) {
    if (roundRecorded) return;
    roundRecorded = true;
    var unlocked = unlockRunRewards(finalScore);
    var oldBest = stats.scores.reduce(function (best, item) {
      return Math.max(best, Number(item.score) || 0);
    }, 0);
    if (hasGlobalStats()) {
      setOverlay('Đang lưu điểm', 'Khỉ con đang gửi điểm lên bảng xếp hạng toàn cầu.', true);
      fetchGlobalStats({ action: 'score', score: Math.max(0, finalScore) }, 15000)
        .then(function (payload) {
          applyRemoteStats(payload);
          showFinalOverlay(finalScore, !!payload.newBest, reason, bonus, unlocked);
        })
        .catch(function () {
          recordLocalFinalScore(finalScore);
          showFinalOverlay(finalScore, finalScore > 0 && finalScore > oldBest, reason, bonus, unlocked);
        });
      return;
    }
    recordLocalFinalScore(finalScore);
    showFinalOverlay(finalScore, finalScore > 0 && finalScore > oldBest, reason, bonus, unlocked);
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

  function showFinalOverlay(finalScore, isNewBest, reason, bonus, unlocked) {
    var details = 'Trái cây: ' + fruitCount + ', combo tốt nhất: ' + bestCombo + ', sống sót: ' + Math.floor(survivalTime) + 's.';
    if (bonus) {
      details += ' Thưởng cuối: sinh tồn +' + bonus.survival + ', cỡ khỉ +' + bonus.size + ', combo +' + bonus.combo + '.';
    }
    if (unlocked && unlocked.length) {
      details += ' Mở khóa: ' + unlocked.join(', ') + '.';
    }
    if (isNewBest) {
      setOverlay('Chúc mừng bạn là người nuôi khỉ xuất sắc nhất!', 'Điểm kỷ lục mới của bạn: ' + finalScore + '. ' + details, true);
    } else {
      setOverlay('Trò chơi kết thúc', (reason || 'Bấm Bắt đầu để thử lại.') + ' Điểm: ' + finalScore + '. ' + details, true);
    }
  }

  function updateHud() {
    scoreValue.textContent = score;
    sizeValue.textContent = (monkey.r / monkey.baseR).toFixed(1) + 'x';
    hungerValue.textContent = Math.max(0, Math.ceil(hunger)) + 's';
    var target = getNearestFruit();
    targetValue.textContent = target ? target.word : 'Chưa có';
    targetMeaning.textContent = target ? getFruitMeaning(target.word) : 'Nghĩa tiếng Việt';
    renderRewards();
  }

  function pickFruitWord() {
    return fruitCatalog[Math.floor(Math.random() * fruitCatalog.length)];
  }

  function getFruitMeaning(word) {
    var key = String(word || '').toLowerCase();
    if (fruitMeanings[key]) return fruitMeanings[key];
    var compactKey = key.replace(/[-\s]/g, '');
    if (fruitMeanings[compactKey]) return fruitMeanings[compactKey];

    var root = '';
    fruitRoots.some(function (item) {
      if (compactKey.indexOf(item[0]) !== -1) {
        root = item[1];
        return true;
      }
      return false;
    });

    if (!root) return 'một loại trái cây';

    var modifiers = fruitModifiers.filter(function (item) {
      return compactKey.indexOf(item[0]) !== -1;
    }).map(function (item) {
      return item[1];
    });
    return 'quả ' + root + (modifiers.length ? ' ' + modifiers.join(' ') : '');
  }

  function resetGame() {
    fruits = [];
    beasts = [];
    particles = [];
    score = 0;
    fruitCount = 0;
    combo = 0;
    bestCombo = 0;
    fastAnswers = 0;
    survivalTime = 0;
    currentSkin = getBestSkin();
    currentTitle = getRunTitle();
    wrongCount = 0;
    hunger = 60;
    roundRecorded = false;
    spawnTimer = 0;
    beastSpawnTimer = 16;
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
    spawnBeast(0);
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
    var bonus = getFinalBonus();
    var finalScore = Math.max(0, score + bonus.survival + bonus.size + bonus.combo);
    if (finalScore !== score) score = finalScore;
    running = false;
    paused = false;
    startButton.disabled = false;
    pauseButton.disabled = true;
    endButton.disabled = true;
    pauseButton.textContent = 'Tạm dừng';
    wordInput.disabled = true;
    updateHud();
    recordFinalScore(finalScore, reason, bonus);
  }

  function spawnFruit() {
    var treeIndex = Math.floor(random(0, 5));
    var treeX = 150 + treeIndex * (width() - 300) / 4 + random(-42, 42);
    var y = random(120, groundY() - 170);
    var fruitEntry = pickFruitWord();
    fruits.push({
      x: clamp(treeX, 48, width() - 48),
      y: y,
      r: random(18, 25),
      word: fruitEntry.word,
      iconIndex: fruitEntry.iconIndex,
      bornAt: performance.now(),
      wobble: random(0, Math.PI * 2)
    });
  }

  function spawnBeast(index) {
    var fromLeft = Math.random() < 0.5;
    beasts.push({
      x: fromLeft ? -120 - index * 220 : width() + 120 + index * 220,
      y: groundY() - 38,
      r: random(36, 48),
      vx: fromLeft ? random(22, 40) : random(-40, -22),
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
      combo = 0;
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
    var answerSeconds = Math.max(0.5, (performance.now() - fruit.bornAt) / 1000);
    var speedBonus = answerSeconds <= 4 ? Math.max(1, Math.round(10 - answerSeconds * 1.7)) : 0;
    combo += 1;
    bestCombo = Math.max(bestCombo, combo);
    if (speedBonus >= 4) fastAnswers += 1;
    var comboBonus = combo >= 3 ? Math.min(18, Math.floor(combo / 3) * 3) : 0;
    var gained = 10 + speedBonus + comboBonus;
    score += gained;
    fruitCount += 1;
    hunger = 60;
    wrongCount = 0;
    monkey.r = Math.min(115, monkey.r + 1.45);
    addParticles(fruit.x, fruit.y, combo >= 5 && hasReward('effects', 'sparkle') ? '#98f5ff' : '#ffe07a', combo >= 5 ? 28 : 18);
    currentTitle = getRunTitle();
    messageValue.textContent = 'Đúng! +' + gained + ' điểm: quả +' + 10 + ', nhanh +' + speedBonus + ', combo +' + comboBonus + '.';
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
    beastSpawnTimer -= dt;
    if (beastSpawnTimer <= 0 && beasts.length < 3) {
      spawnBeast(beasts.length);
      beastSpawnTimer = random(18, 28);
    }

    beasts.forEach(function (beast) {
      beast.x += beast.vx * dt;
      beast.belly = Math.max(0, beast.belly - dt);

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
    beasts = beasts.filter(function (beast) {
      return beast.x > -beast.r - 180 && beast.x < width() + beast.r + 180;
    });
  }

  function update(dt) {
    survivalTime += dt;
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
    if (fruitSpriteLoaded) {
      var columns = 20;
      var rows = 10;
      var cellW = fruitSprite.width / columns;
      var cellH = fruitSprite.height / rows;
      var index = Math.max(0, Math.min(columns * rows - 1, Number(fruit.iconIndex) || 0));
      var col = index % columns;
      var row = Math.floor(index / columns);
      var sx = col * cellW;
      var sy = row * cellH;
      var sw = cellW;
      var sh = cellH;
      var drawSize = fruit.r * 2.7;
      ctx.save();
      ctx.shadowColor = 'rgba(15, 45, 20, 0.2)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
      ctx.drawImage(fruitSprite, sx, sy, sw, sh, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      ctx.restore();
    } else {
      var hue = fruit.word.charCodeAt(0) % 6;
      var colors = ['#f04f4f', '#f9c74f', '#90be6d', '#f8961e', '#b565f2', '#43aa8b'];
      ctx.fillStyle = colors[hue];
      ctx.strokeStyle = 'rgba(44, 77, 36, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, fruit.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
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
    var bodyColor = '#9b6138';
    var headColor = '#c98752';
    var faceColor = '#e7b882';
    if (currentSkin === 'golden') {
      bodyColor = '#d59a25';
      headColor = '#f1bd48';
      faceColor = '#ffe1a3';
    } else if (currentSkin === 'leafCape') {
      bodyColor = '#7a7040';
      headColor = '#b77b46';
      faceColor = '#e8bd88';
    } else if (currentSkin === 'berryCheeks') {
      bodyColor = '#8d5b49';
      headColor = '#c07c58';
      faceColor = '#f0c59a';
    }

    if (combo >= 5 && hasReward('effects', 'sparkle')) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = currentSkin === 'golden' ? '#fff0a8' : '#9df7ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, -4, monkey.r * 1.25 + Math.sin(performance.now() / 160) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = hurt ? '#b66a3a' : bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 8, monkey.r * 0.88, monkey.r * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();
    if (currentSkin === 'leafCape') {
      ctx.fillStyle = '#2f9d55';
      ctx.beginPath();
      ctx.moveTo(-monkey.r * 0.75, -2);
      ctx.quadraticCurveTo(-monkey.r * 0.15, monkey.r * 0.18, monkey.r * 0.1, monkey.r * 0.95);
      ctx.quadraticCurveTo(-monkey.r * 0.5, monkey.r * 0.65, -monkey.r * 0.9, monkey.r * 0.25);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.arc(0, -monkey.r * 0.45, monkey.r * 0.72, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = faceColor;
    ctx.beginPath();
    ctx.ellipse(0, -monkey.r * 0.35, monkey.r * 0.45, monkey.r * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    if (currentSkin === 'berryCheeks') {
      ctx.fillStyle = 'rgba(240, 83, 109, 0.72)';
      ctx.beginPath();
      ctx.arc(-monkey.r * 0.3, -monkey.r * 0.32, monkey.r * 0.09, 0, Math.PI * 2);
      ctx.arc(monkey.r * 0.3, -monkey.r * 0.32, monkey.r * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
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
