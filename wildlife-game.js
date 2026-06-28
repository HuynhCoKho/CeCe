(function () {
  var canvas = document.getElementById('gameCanvas');
  var ctx = canvas.getContext('2d');
  var scoreValue = document.getElementById('scoreValue');
  var sizeValue = document.getElementById('sizeValue');
  var hungerValue = document.getElementById('hungerValue');
  var targetValue = document.getElementById('targetValue');
  var targetMeaning = document.getElementById('targetMeaning');
  var messageValue = document.getElementById('messageValue');
  var overlay = document.getElementById('overlay');
  var startButton = document.getElementById('startButton');
  var pauseButton = document.getElementById('pauseButton');
  var endButton = document.getElementById('endButton');
  var wordInput = document.getElementById('wordInput');
  var comboValue = document.getElementById('comboValue');
  var titleValue = document.getElementById('titleValue');
  var skinValue = document.getElementById('skinValue');
  var badgeList = document.getElementById('badgeList');
  var playerCountValue = document.getElementById('playerCountValue');
  var playCountValue = document.getElementById('playCountValue');
  var leaderboardList = document.getElementById('leaderboardList');
  var statsScopeValue = document.getElementById('statsScopeValue');

  var config = window.CECE_GAME_CONFIG || {};
  var statsEndpoint = config.STATS_WEB_APP_URL || '';
  var gameLevel = 'level3';
  var storageKey = 'ceceTypingStats-level3';
  var visitorKey = 'ceceTypingVisitorId';
  var visitorId = getVisitorId();

  var animalNames = [
    'Lion', 'Tiger', 'Elephant', 'Giraffe', 'Zebra', 'Bear', 'Panda', 'Koala', 'Sloth', 'Otter',
    'Fox', 'Wolf', 'Dog', 'Cat', 'Rabbit', 'Hare', 'Squirrel', 'Chipmunk', 'Beaver', 'Hedgehog',
    'Raccoon', 'Skunk', 'Badger', 'Mole', 'Bat', 'Monkey', 'Chimpanzee', 'Gorilla', 'Orangutan', 'Gibbon',
    'Baboon', 'Mandrill', 'Lemur', 'Colobus', 'Meerkat', 'Wombat', 'Kangaroo', 'Wallaby', 'Possum', 'Tasmanian Devil',
    'Deer', 'Moose', 'Elk', 'Reindeer', 'Caribou', 'Antelope', 'Gazelle', 'Camel', 'Llama', 'Alpaca',
    'Bison', 'Yak', 'Cow', 'Bull', 'Buffalo', 'Goat', 'Sheep', 'Ram', 'Horse', 'Pony',
    'Donkey', 'Mule', 'Quagga', 'Rhinoceros', 'Hippopotamus', 'Tapir', 'Pig', 'Wild Boar', 'Warthog', 'Peccary',
    'Cheetah', 'Leopard', 'Jaguar', 'Snow Leopard', 'Puma', 'Cougar', 'Lynx', 'Caracal', 'Serval', 'Ocelot',
    'Wildcat', 'Cheetah', 'African Wild Dog', 'Hyena', 'Jackal', 'Dingo', 'Dhole', 'Wolf', 'Golden Jackal', 'Red Fox',
    'Arctic Fox', 'Fennec Fox', 'Raccoon Dog', 'Skunk', 'Ferret', 'Weasel', 'Stoat', 'Mink', 'Marten', 'Fisher',
    'Aardvark', 'Anteater', 'Armadillo', 'Pangolin', 'Sloth Bear', 'Sun Bear', 'Polar Bear', 'Brown Bear', 'Black Bear', 'Giant Panda',
    'Red Panda', 'Aardvark', 'Okapi', 'Cassowary', 'Emu', 'Ostrich', 'Kiwi', 'Bird of Paradise', 'Flamingo', 'Swan',
    'Goose', 'Duck', 'Mallard', 'Seagull', 'Pigeon', 'Dove', 'Crow', 'Raven', 'Sparrow', 'Finch',
    'Robin', 'Bluebird', 'Cardinal', 'Woodpecker', 'Toucan', 'Parrot', 'Macaw', 'Cockatoo', 'Owl', 'Barn Owl',
    'Eagle', 'Hawk', 'Falcon', 'Vulture', 'Kite', 'Condor', 'Stork', 'Heron', 'Crane', 'Pelican',
    'Cormorant', 'Booby', 'Gannet', 'Penguin', 'Puffin', 'Albatross', 'Petrel', 'Swift', 'Hummingbird', 'Kingfisher',
    'Alligator', 'Crocodile', 'Caiman', 'Gavial', 'Snake', 'Cobra', 'Viper', 'Python', 'Boa', 'Lizard',
    'Chameleon', 'Iguana', 'Gecko', 'Monitor Lizard', 'Basilisk', 'Frog', 'Toad', 'Tree Frog', 'Salamander', 'Newt',
    'Sea Turtle', 'Land Turtle', 'Tortoise', 'Triceratops', 'Stegosaurus', 'Tyrannosaurus', 'Velociraptor', 'Pterodactyl', 'Diplodocus', 'Brachiosaurus',
    'Mosasaurus', 'Ichthyosaurus', 'Plesiosaurus', 'Pliosaurus', 'Shark', 'Great White Shark', 'Hammerhead Shark', 'Whale', 'Blue Whale', 'Orca',
    'Seal', 'Sea Lion', 'Walrus', 'Dugong', 'Manatee', 'Otter', 'Sea Otter', 'Beluga', 'Narwhal', 'Sperm Whale',
    'Octopus', 'Squid', 'Cuttlefish', 'Jellyfish', 'Seahorse', 'Starfish', 'Sea Urchin', 'Crab', 'Lobster', 'Shrimp',
    'Butterfly', 'Moth', 'Bee', 'Wasp', 'Hornet', 'Ant', 'Termite', 'Beetle', 'Ladybug', 'Dragonfly',
    'Damselfly', 'Grasshopper', 'Cricket', 'Praying Mantis', 'Stick Insect', 'Cicada', 'Fly', 'Mosquito', 'Firefly', 'Flea',
    'Scorpion', 'Spider', 'Tarantula', 'Tick', 'Mite', 'Centipede', 'Millipede', 'Snail', 'Slug', 'Oyster',
    'Clam', 'Mussel', 'Abalone', 'Abalone', 'Sea Anemone', 'Coral', 'Hydroid', 'Sponge', 'Sea Cucumber', 'Sea Slug',
    'Goldfish', 'Koi', 'Carp', 'Betta Fish', 'Guppy', 'Angelfish', 'Clownfish', 'Seahorse', 'Pufferfish', 'Pufferfish',
    'Eel', 'Moray Eel', 'Stingray', 'Manta Ray', 'Lionfish', 'Surgeonfish', 'Tuna', 'Swordfish', 'Salmon', 'Cod'
  ];

  var vietnameseMeanings = {
    lion: 'sư tử', tiger: 'cọp', elephant: 'voi', giraffe: 'hươu cao cổ', zebra: 'ngựa vằn', bear: 'gấu',
    panda: 'gấu trúc', koala: 'gấu túi', sloth: 'lười', otter: 'rái cá', fox: 'cáo', wolf: 'sói',
    dog: 'chó', cat: 'mèo', rabbit: 'thỏ', hare: 'thỏ rừng', squirrel: 'sóc', chipmunk: 'sóc chuột',
    beaver: 'hải ly', hedgehog: 'nhím', raccoon: 'gấu mèo', skunk: 'chồn hôi', badger: 'lửng', mole: 'chuột chũi',
    bat: 'dơi', monkey: 'khỉ', chimpanzee: 'tinh tinh', gorilla: 'khỉ đột', orangutan: 'đười ươi', gibbon: 'vượn',
    baboon: 'khỉ đầu chó', mandrill: 'khỉ mặt chó', lemur: 'vượn cáo', colobus: 'khỉ colobus', meerkat: 'cầy meerkat', wombat: 'gấu túi mũi trần',
    kangaroo: 'chuột túi', wallaby: 'chuột túi nhỏ', possum: 'thú có túi possum', deer: 'hươu', moose: 'nai sừng tấm', elk: 'nai sừng lớn',
    reindeer: 'tuần lộc', caribou: 'tuần lộc Bắc Mỹ', antelope: 'linh dương', gazelle: 'linh dương gazelle', camel: 'lạc đà', llama: 'lạc đà không bướu',
    alpaca: 'lạc đà alpaca', bison: 'bò rừng', yak: 'bò yak', cow: 'bò cái', bull: 'bò đực', buffalo: 'trâu',
    goat: 'dê', sheep: 'cừu', ram: 'cừu đực', horse: 'ngựa', pony: 'ngựa con', donkey: 'lừa',
    mule: 'la', rhinoceros: 'tê giác', hippopotamus: 'hà mã', tapir: 'heo vòi', pig: 'heo', cheetah: 'báo săn',
    leopard: 'báo hoa mai', jaguar: 'báo đốm', puma: 'báo sư tử', cougar: 'báo cougar', lynx: 'linh miêu', hyena: 'linh cẩu',
    jackal: 'chó rừng', dingo: 'chó dingo', weasel: 'chồn', stoat: 'chồn ermine', mink: 'chồn mink', marten: 'chồn marten',
    aardvark: 'lợn đất', anteater: 'thú ăn kiến', armadillo: 'tatu', pangolin: 'tê tê', okapi: 'hươu đùi vằn',
    cassowary: 'đà điểu đầu mào', emu: 'đà điểu emu', ostrich: 'đà điểu', kiwi: 'chim kiwi', flamingo: 'hồng hạc',
    swan: 'thiên nga', goose: 'ngỗng', duck: 'vịt', mallard: 'vịt trời', seagull: 'mòng biển', pigeon: 'bồ câu',
    dove: 'chim câu', crow: 'quạ', raven: 'quạ lớn', sparrow: 'chim sẻ', finch: 'chim sẻ thông', robin: 'chim cổ đỏ',
    bluebird: 'chim xanh', cardinal: 'hồng y điểu', woodpecker: 'chim gõ kiến', toucan: 'chim tucan', parrot: 'vẹt', macaw: 'vẹt macaw',
    cockatoo: 'vẹt mào', owl: 'cú mèo', eagle: 'đại bàng', hawk: 'diều hâu', falcon: 'chim ưng', vulture: 'kền kền',
    condor: 'kền kền khoang cổ', stork: 'cò', heron: 'diệc', crane: 'sếu', pelican: 'bồ nông', penguin: 'chim cánh cụt',
    puffin: 'hải âu cổ rụt', hummingbird: 'chim ruồi', kingfisher: 'chim bói cá', alligator: 'cá sấu Mỹ', crocodile: 'cá sấu', caiman: 'cá sấu caiman',
    snake: 'rắn', cobra: 'rắn hổ mang', viper: 'rắn lục', python: 'trăn', boa: 'trăn boa', lizard: 'thằn lằn',
    chameleon: 'tắc kè hoa', iguana: 'cự đà', gecko: 'tắc kè', frog: 'ếch', toad: 'cóc', salamander: 'kỳ giông',
    turtle: 'rùa', tortoise: 'rùa cạn', shark: 'cá mập', whale: 'cá voi', orca: 'cá voi sát thủ', seal: 'hải cẩu',
    walrus: 'hải mã', dugong: 'bò biển', manatee: 'lợn biển', beluga: 'cá voi trắng', narwhal: 'kỳ lân biển', octopus: 'bạch tuộc',
    squid: 'mực ống', cuttlefish: 'mực nang', jellyfish: 'sứa', seahorse: 'cá ngựa', starfish: 'sao biển', crab: 'cua',
    lobster: 'tôm hùm', shrimp: 'tôm', butterfly: 'bướm', moth: 'bướm đêm', bee: 'ong', wasp: 'ong bắp cày',
    hornet: 'ong vò vẽ', ant: 'kiến', termite: 'mối', beetle: 'bọ cánh cứng', ladybug: 'bọ rùa', dragonfly: 'chuồn chuồn',
    grasshopper: 'châu chấu', cricket: 'dế', fly: 'ruồi', mosquito: 'muỗi', scorpion: 'bọ cạp', spider: 'nhện',
    tarantula: 'nhện tarantula', tick: 've', mite: 'mạt', centipede: 'rết', millipede: 'cuốn chiếu', snail: 'ốc sên',
    slug: 'sên trần', oyster: 'hàu', clam: 'ngao', mussel: 'vẹm', abalone: 'bào ngư', coral: 'san hô',
    sponge: 'bọt biển', goldfish: 'cá vàng', koi: 'cá koi', carp: 'cá chép', guppy: 'cá bảy màu', angelfish: 'cá ông tiên',
    clownfish: 'cá hề', pufferfish: 'cá nóc', eel: 'lươn', tuna: 'cá ngừ', swordfish: 'cá kiếm', salmon: 'cá hồi',
    cod: 'cá tuyết'
  };

  var skyNames = new Set([
    'bat', 'cassowary', 'emu', 'ostrich', 'kiwi', 'birdofparadise', 'flamingo', 'swan', 'goose', 'duck', 'mallard', 'seagull',
    'pigeon', 'dove', 'crow', 'raven', 'sparrow', 'finch', 'robin', 'bluebird', 'cardinal', 'woodpecker', 'toucan', 'parrot',
    'macaw', 'cockatoo', 'owl', 'barnowl', 'eagle', 'hawk', 'falcon', 'vulture', 'kite', 'condor', 'stork', 'heron', 'crane',
    'pelican', 'cormorant', 'booby', 'gannet', 'penguin', 'puffin', 'albatross', 'petrel', 'swift', 'hummingbird', 'kingfisher',
    'butterfly', 'moth', 'bee', 'wasp', 'hornet', 'dragonfly', 'damselfly', 'fly', 'mosquito', 'firefly'
  ]);
  var waterNames = new Set([
    'otter', 'seaotter', 'alligator', 'crocodile', 'caiman', 'gavial', 'seaturtle', 'mosasaurus', 'ichthyosaurus', 'plesiosaurus',
    'shark', 'greatwhiteshark', 'hammerheadshark', 'whale', 'bluewhale', 'orca', 'seal', 'sealion', 'walrus', 'dugong', 'manatee',
    'beluga', 'narwhal', 'spermwhale', 'octopus', 'squid', 'cuttlefish', 'jellyfish', 'seahorse', 'starfish', 'seaurchin', 'crab',
    'lobster', 'shrimp', 'oyster', 'clam', 'mussel', 'abalone', 'seaanemone', 'coral', 'hydroid', 'sponge', 'seacucumber', 'seaslug',
    'goldfish', 'koi', 'carp', 'bettafish', 'guppy', 'angelfish', 'clownfish', 'pufferfish', 'eel', 'morayeel', 'stingray', 'mantaray',
    'lionfish', 'surgeonfish', 'tuna', 'swordfish', 'salmon', 'cod'
  ]);

  var animalCatalog = animalNames.map(function (name, index) {
    var key = compact(name);
    var habitat = skyNames.has(key) ? 'sky' : waterNames.has(key) ? 'water' : 'land';
    return {
      name: name,
      key: key,
      meaning: meaningFor(name),
      habitat: habitat,
      spriteIndex: index
    };
  });

  var sprite = new Image();
  sprite.src = 'assets/animals-icons.png?v=20260629-animals';
  var spriteCols = 20;
  var spriteCell = 72;

  var prey = [];
  var hunters = [];
  var particles = [];
  var keys = {};
  var rng = Math.random;
  var running = false;
  var paused = false;
  var lastTime = 0;
  var score = 0;
  var combo = 0;
  var bestCombo = 0;
  var preyCaught = 0;
  var skyCaught = 0;
  var waterCaught = 0;
  var landCaught = 0;
  var fastAnswers = 0;
  var survivalTime = 0;
  var hungerTime = 60;
  var hunterTimer = 12;
  var currentTarget = null;
  var lastSpokenTarget = '';
  var lastEatAt = 0;
  var wrongCount = 0;
  var statsState = readLocalStats();
  var pendingSpace = false;
  var spaceStart = 0;
  var spaceHoldTimer = 0;

  var mint = {
    x: 180,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 34,
    scale: 1,
    direction: 1,
    grounded: true,
    hurt: 0,
    action: 0
  };

  function width() { return canvas.width; }
  function height() { return canvas.height; }
  function groundY() { return height() * 0.69; }
  function waterY() { return height() * 0.78; }

  function resizeCanvas() {
    var rect = canvas.getBoundingClientRect();
    var ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(640, Math.floor(rect.width * ratio));
    canvas.height = Math.max(380, Math.floor(rect.height * ratio));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function resetGame() {
    score = 0;
    combo = 0;
    bestCombo = 0;
    preyCaught = 0;
    skyCaught = 0;
    waterCaught = 0;
    landCaught = 0;
    fastAnswers = 0;
    survivalTime = 0;
    hungerTime = 60;
    hunterTimer = 12;
    wrongCount = 0;
    prey = [];
    hunters = [];
    particles = [];
    currentTarget = null;
    lastSpokenTarget = '';
    lastEatAt = performance.now();
    mint.x = width() * 0.16;
    mint.y = groundY() - mint.radius;
    mint.vx = 0;
    mint.vy = 0;
    mint.radius = 34;
    mint.scale = 1;
    mint.direction = 1;
    mint.grounded = true;
    mint.hurt = 0;
    mint.action = 0;
    wordInput.value = '';
    for (var i = 0; i < 12; i += 1) spawnPrey();
    updateTarget(true);
    updateHud();
  }

  function startGame() {
    resetGame();
    running = true;
    paused = false;
    overlay.hidden = true;
    startButton.disabled = true;
    pauseButton.disabled = false;
    endButton.disabled = false;
    pauseButton.textContent = 'Tạm dừng';
    messageValue.textContent = 'Mint đã vào rừng. Hãy gõ tên con mồi đang hiện nhé!';
    wordInput.disabled = false;
    wordInput.focus();
    updateTarget(true);
    sendStats('start', null);
  }

  function pauseGame() {
    if (!running) return;
    paused = !paused;
    pauseButton.textContent = paused ? 'Tiếp tục' : 'Tạm dừng';
    overlay.hidden = !paused;
    if (paused) {
      overlay.querySelector('h2').textContent = 'Đang tạm dừng';
      overlay.querySelector('p').textContent = 'Bấm Tiếp tục để Mint săn tiếp.';
    } else {
      lastTime = performance.now();
      wordInput.focus();
    }
  }

  function endGame(reason) {
    if (!running) return;
    running = false;
    paused = false;
    startButton.disabled = false;
    pauseButton.disabled = true;
    endButton.disabled = true;
    wordInput.disabled = true;
    var finalScore = Math.max(0, Math.round(score + survivalTime * 0.2 + bestCombo * 8 + mint.scale * 12));
    score = finalScore;
    var title = 'Trò chơi kết thúc';
    var text = reason || 'Mint nghỉ săn với số điểm ' + finalScore + '.';
    overlay.hidden = false;
    overlay.querySelector('h2').textContent = title;
    overlay.querySelector('p').textContent = text;
    messageValue.textContent = text;
    updateHud();
    saveScore(finalScore);
  }

  function spawnPrey() {
    var item = animalCatalog[Math.floor(rng() * animalCatalog.length)];
    var habitat = item.habitat;
    var size = habitat === 'water' ? rand(34, 46) : habitat === 'sky' ? rand(30, 42) : rand(36, 50);
    var fromLeft = rng() < 0.55;
    var x = fromLeft ? rand(-160, -30) : rand(width() + 30, width() + 160);
    var y;
    if (habitat === 'sky') {
      y = rand(75, Math.max(95, groundY() - 190));
    } else if (habitat === 'water') {
      y = rand(waterY() + 34, height() - 55);
    } else {
      y = groundY() - size * 0.45;
    }
    prey.push({
      item: item,
      habitat: habitat,
      x: x,
      y: y,
      size: size,
      vx: (fromLeft ? 1 : -1) * rand(18, habitat === 'sky' ? 42 : 32),
      wobble: rand(0, Math.PI * 2),
      born: performance.now(),
      targetSeen: false
    });
  }

  function spawnHunter() {
    var fromLeft = rng() < 0.5;
    hunters.push({
      x: fromLeft ? -70 : width() + 70,
      y: groundY() - 58,
      vx: (fromLeft ? 1 : -1) * rand(28, 38),
      w: 38,
      h: 68,
      step: rand(0, Math.PI * 2)
    });
  }

  function loop(now) {
    requestAnimationFrame(loop);
    if (!lastTime) lastTime = now;
    var dt = Math.min(0.035, (now - lastTime) / 1000);
    lastTime = now;
    if (running && !paused) update(dt, now);
    draw(now);
  }

  function update(dt, now) {
    survivalTime += dt;
    hungerTime -= dt;
    hunterTimer -= dt;
    if (hungerTime <= 0) {
      endGame('Mint đói quá vì 1 phút chưa săn được con mồi nào.');
      return;
    }
    if (hunterTimer <= 0) {
      spawnHunter();
      hunterTimer = 12;
    }
    while (prey.length < 13) spawnPrey();
    updateMint(dt);
    updatePrey(dt);
    updateHunters(dt);
    updateParticles(dt);
    updateCollisions();
    updateTarget(false);
    updateHud();
  }

  function updateMint(dt) {
    var speed = 260;
    var waterLine = waterY() + 8;
    mint.vx = 0;
    if (keys.ArrowLeft) {
      mint.vx -= speed;
      mint.direction = -1;
    }
    if (keys.ArrowRight) {
      mint.vx += speed;
      mint.direction = 1;
    }
    if (keys.ArrowUp && mint.grounded) mint.vy = -360;
    if (keys.ArrowDown) mint.y += speed * 0.45 * dt;
    mint.x += mint.vx * dt;
    mint.vy += 760 * dt;
    mint.y += mint.vy * dt;
    var floor = groundY() - mint.radius * mint.scale * 0.72;
    if (mint.y > floor) {
      mint.y = floor;
      mint.vy = 0;
      mint.grounded = true;
    } else {
      mint.grounded = false;
    }
    if (mint.y > waterLine) mint.y = waterLine;
    mint.x = clamp(mint.x, 40, width() - 40);
    mint.hurt = Math.max(0, mint.hurt - dt);
    mint.action = Math.max(0, mint.action - dt);
  }

  function updatePrey(dt) {
    for (var i = prey.length - 1; i >= 0; i -= 1) {
      var p = prey[i];
      p.wobble += dt * 2.4;
      p.x += p.vx * dt;
      if (p.habitat === 'sky') p.y += Math.sin(p.wobble) * 10 * dt;
      if (p.habitat === 'water') p.y += Math.sin(p.wobble) * 8 * dt;
      if ((p.vx > 0 && p.x > width() + 180) || (p.vx < 0 && p.x < -180)) {
        prey.splice(i, 1);
      }
    }
  }

  function updateHunters(dt) {
    for (var i = hunters.length - 1; i >= 0; i -= 1) {
      var h = hunters[i];
      h.step += dt * 5;
      h.x += h.vx * dt;
      if ((h.vx > 0 && h.x > width() + 120) || (h.vx < 0 && h.x < -120)) hunters.splice(i, 1);
      for (var j = prey.length - 1; j >= 0; j -= 1) {
        var p = prey[j];
        if (p.habitat === 'land' && Math.abs(p.x - h.x) < 42 && Math.abs(p.y - h.y) < 62) {
          hunters[i].h += 2;
          prey.splice(j, 1);
          addParticles(h.x, h.y - 24, '#8b5a33', 6);
        }
      }
    }
  }

  function updateParticles(dt) {
    for (var i = particles.length - 1; i >= 0; i -= 1) {
      particles[i].life -= dt;
      particles[i].x += particles[i].vx * dt;
      particles[i].y += particles[i].vy * dt;
      particles[i].vy += 80 * dt;
      if (particles[i].life <= 0) particles.splice(i, 1);
    }
  }

  function updateCollisions() {
    for (var i = 0; i < hunters.length; i += 1) {
      var h = hunters[i];
      var dx = Math.abs(mint.x - h.x);
      var dy = Math.abs(mint.y - (h.y - 16));
      if (dx < 32 + mint.radius * mint.scale * 0.45 && dy < 54 + mint.radius * mint.scale * 0.2) {
        endGame('Mint đụng phải thợ săn rồi. Trò chơi kết thúc.');
        return;
      }
    }
  }

  function submitHunt(habitat) {
    if (!running || paused) return;
    var typed = compact(wordInput.value);
    if (!typed) return;
    var target = findTypedPrey(typed, habitat);
    if (target) {
      eatPrey(target, habitat);
      wordInput.value = '';
      wordInput.focus();
      return;
    }
    wrongAnswer(habitat);
  }

  function findTypedPrey(typed, habitat) {
    var best = null;
    var bestDist = Infinity;
    for (var i = 0; i < prey.length; i += 1) {
      var p = prey[i];
      if (p.habitat !== habitat || p.item.key !== typed) continue;
      var dist = Math.abs(p.x - mint.x) + Math.abs(p.y - mint.y) * 0.6;
      if (dist < bestDist) {
        best = p;
        bestDist = dist;
      }
    }
    return best;
  }

  function eatPrey(target, habitat) {
    var index = prey.indexOf(target);
    if (index >= 0) prey.splice(index, 1);
    var now = performance.now();
    var reaction = Math.max(0.8, (now - target.born) / 1000);
    var speedBonus = reaction < 5 ? 24 : reaction < 9 ? 12 : 0;
    var habitatBonus = habitat === 'sky' ? 18 : habitat === 'water' ? 16 : 12;
    combo += 1;
    bestCombo = Math.max(bestCombo, combo);
    preyCaught += 1;
    if (habitat === 'sky') skyCaught += 1;
    if (habitat === 'water') waterCaught += 1;
    if (habitat === 'land') landCaught += 1;
    if (speedBonus) fastAnswers += 1;
    wrongCount = 0;
    hungerTime = 60;
    lastEatAt = now;
    mint.scale = Math.min(2.6, mint.scale + 0.035);
    mint.radius = 34 * mint.scale;
    mint.action = 0.45;
    if (habitat === 'sky') mint.vy = -420;
    if (habitat === 'water') mint.y = Math.min(waterY() + 20, target.y - 8);
    var gain = Math.round(32 + habitatBonus + speedBonus + combo * 5 + survivalTime * 0.04);
    score += gain;
    addParticles(target.x, target.y, habitat === 'sky' ? '#f7d95b' : habitat === 'water' ? '#5bd7ff' : '#f5a142', 14);
    messageValue.textContent = 'Đúng rồi! Mint săn được ' + target.item.name + ' +' + gain + ' điểm.';
    updateRewards();
    updateTarget(true);
  }

  function wrongAnswer(habitat) {
    wrongCount += 1;
    combo = 0;
    mint.hurt = 0.7;
    mint.scale = Math.max(0.78, mint.scale - 0.045);
    mint.radius = 34 * mint.scale;
    var penalty = wrongCount <= 3 ? 0 : 12 + wrongCount * 3;
    score -= penalty;
    addParticles(mint.x, mint.y, '#cf4b3c', 10);
    var hint = habitat === 'sky' ? 'Dấu / chỉ dùng để bắt chim.' : habitat === 'water' ? 'Dấu \\ chỉ dùng để bắt cá dưới nước.' : 'Enter chỉ dùng để vồ mồi trên cạn.';
    messageValue.textContent = wrongCount <= 3
      ? 'Sai rồi, Mint hơi đau bụng. ' + hint
      : 'Sai quá 3 lần nên bị trừ ' + penalty + ' điểm. ' + hint;
    if (score < 0) endGame('Mint đói lả vì điểm xuống dưới 0.');
  }

  function updateTarget(forceSpeech) {
    var nearest = null;
    var best = Infinity;
    for (var i = 0; i < prey.length; i += 1) {
      var p = prey[i];
      var dist = Math.abs(p.x - mint.x) + Math.abs(p.y - mint.y) * 0.55;
      if (dist < best) {
        nearest = p;
        best = dist;
      }
    }
    currentTarget = nearest;
    if (!nearest) {
      targetValue.textContent = 'Chưa có';
      targetMeaning.textContent = 'Nghĩa tiếng Việt';
      return;
    }
    var suffix = nearest.habitat === 'sky' ? ' /' : nearest.habitat === 'water' ? ' \\' : ' Enter';
    targetValue.textContent = nearest.item.name + suffix;
    targetMeaning.textContent = nearest.item.meaning;
    if (running && (forceSpeech || !nearest.targetSeen) && lastSpokenTarget !== nearest.item.name) {
      nearest.targetSeen = true;
      lastSpokenTarget = nearest.item.name;
      speak(nearest.item.name);
    }
  }

  function updateHud() {
    scoreValue.textContent = Math.round(score);
    sizeValue.textContent = mint.scale.toFixed(1) + 'x';
    hungerValue.textContent = Math.max(0, Math.ceil(hungerTime)) + 's';
    comboValue.textContent = combo;
  }

  function updateRewards() {
    var badges = [];
    if (preyCaught >= 1) badges.push('Mồi đầu tiên');
    if (landCaught >= 6) badges.push('Vồ đất giỏi');
    if (skyCaught >= 4) badges.push('Bắt chim nhanh');
    if (waterCaught >= 4) badges.push('Vớt cá khéo');
    if (bestCombo >= 5) badges.push('Combo 5');
    if (preyCaught >= 20) badges.push('Thợ săn bền bỉ');
    if (mint.scale >= 1.8) badges.push('Cọp lớn');
    badgeList.textContent = badges.length ? badges.join(' | ') : 'Chưa có huy hiệu';
    titleValue.textContent = preyCaught >= 28 ? 'Chúa sơn lâm nhí' : bestCombo >= 8 ? 'Thợ săn siêu tốc' : preyCaught >= 12 ? 'Mint lanh lợi' : 'Cọp con tập săn';
    skinValue.textContent = mint.scale >= 2 ? 'Skin hoàng kim' : waterCaught >= 6 ? 'Skin suối xanh' : skyCaught >= 6 ? 'Skin mây trắng' : 'Skin vằn cam';
  }

  function draw(now) {
    drawBackground(now);
    prey.forEach(drawPrey);
    hunters.forEach(drawHunter);
    drawMint(now);
    drawParticles();
  }

  function drawBackground(now) {
    var w = width();
    var h = height();
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#a9e4ff');
    sky.addColorStop(0.44, '#7bc98f');
    sky.addColorStop(1, '#2f8b61');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    for (var i = 0; i < 5; i += 1) {
      var cx = ((now * 0.012 + i * 310) % (w + 260)) - 130;
      cloud(cx, 74 + i * 22, 42 + i * 5);
    }

    ctx.fillStyle = '#4a9a5d';
    hill(0, groundY() - 60, w * 0.38, 125);
    hill(w * 0.2, groundY() - 80, w * 0.52, 150);
    hill(w * 0.58, groundY() - 52, w * 0.48, 128);

    ctx.fillStyle = '#5aaa54';
    ctx.fillRect(0, groundY(), w, h - groundY());
    ctx.fillStyle = '#2d7d43';
    for (var x = 0; x < w; x += 56) {
      ctx.fillRect(x + Math.sin(x) * 4, groundY() - 18, 8, 28);
      ctx.beginPath();
      ctx.arc(x + 4, groundY() - 18, 18, Math.PI, 0);
      ctx.fill();
    }

    var river = ctx.createLinearGradient(0, waterY(), 0, h);
    river.addColorStop(0, '#62c7d4');
    river.addColorStop(1, '#1e80ad');
    ctx.fillStyle = river;
    ctx.fillRect(0, waterY(), w, h - waterY());
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (var r = 0; r < 8; r += 1) {
      ctx.beginPath();
      ctx.ellipse((now * 0.03 + r * 180) % w, waterY() + 26 + (r % 3) * 28, 48, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function hill(x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x, groundY());
    ctx.quadraticCurveTo(x + w * 0.5, y - h, x + w, groundY());
    ctx.closePath();
    ctx.fill();
  }

  function cloud(x, y, s) {
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.9, s * 0.34, 0, 0, Math.PI * 2);
    ctx.ellipse(x + s * 0.42, y + 2, s * 0.7, s * 0.28, 0, 0, Math.PI * 2);
    ctx.ellipse(x - s * 0.45, y + 5, s * 0.62, s * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPrey(p) {
    var icon = p.size;
    ctx.save();
    ctx.translate(p.x, p.y + Math.sin(p.wobble) * 2);
    if (p.vx < 0) ctx.scale(-1, 1);
    drawSprite(p.item.spriteIndex, -icon / 2, -icon / 2, icon, icon);
    ctx.restore();
    var tag = p.habitat === 'sky' ? '/' : p.habitat === 'water' ? '\\' : 'Enter';
    ctx.font = Math.max(12, icon * 0.24) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    roundRect(p.x - 46, p.y + icon * 0.52, 92, 21, 10);
    ctx.fill();
    ctx.fillStyle = '#173047';
    ctx.fillText(p.item.name + ' ' + tag, p.x, p.y + icon * 0.52 + 15);
  }

  function drawSprite(index, x, y, w, h) {
    if (!sprite.complete) {
      ctx.fillStyle = '#fff7d2';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    var sx = (index % spriteCols) * spriteCell;
    var sy = Math.floor(index / spriteCols) * spriteCell;
    ctx.drawImage(sprite, sx, sy, spriteCell, spriteCell, x, y, w, h);
  }

  function drawMint(now) {
    ctx.save();
    ctx.translate(mint.x, mint.y);
    ctx.scale(mint.direction * mint.scale, mint.scale);
    if (mint.hurt > 0) ctx.rotate(Math.sin(now * 0.04) * 0.08);
    ctx.fillStyle = mint.hurt > 0 ? '#e56d50' : '#ee9b2f';
    ctx.beginPath();
    ctx.ellipse(0, 0, 44, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(34, -14, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1f2831';
    for (var i = -2; i <= 2; i += 1) {
      ctx.fillRect(-20 + i * 13, -23, 5, 22);
    }
    ctx.beginPath();
    ctx.moveTo(-40, -2);
    ctx.quadraticCurveTo(-74, -32, -92, -8);
    ctx.lineWidth = 9;
    ctx.strokeStyle = '#ee9b2f';
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1f2831';
    ctx.stroke();
    ctx.fillStyle = '#f2c66d';
    ctx.beginPath();
    ctx.ellipse(8, 9, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(42, -18, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#102338';
    ctx.beginPath();
    ctx.arc(44, -17, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#102338';
    ctx.beginPath();
    ctx.arc(52, -8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawHunter(h) {
    ctx.save();
    ctx.translate(h.x, h.y);
    if (h.vx < 0) ctx.scale(-1, 1);
    ctx.fillStyle = '#5c3a26';
    ctx.fillRect(-8, -40, 16, 36);
    ctx.fillStyle = '#d19a66';
    ctx.beginPath();
    ctx.arc(0, -52, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4b6a35';
    ctx.fillRect(-18, -64, 36, 9);
    ctx.fillStyle = '#334127';
    ctx.fillRect(-24, -58, 48, 5);
    ctx.strokeStyle = '#2d2117';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-3, -4);
    ctx.lineTo(-14, 24 + Math.sin(h.step) * 5);
    ctx.moveTo(5, -4);
    ctx.lineTo(16, 24 - Math.sin(h.step) * 5);
    ctx.moveTo(8, -30);
    ctx.lineTo(35, -38);
    ctx.moveTo(35, -38);
    ctx.lineTo(54, -38);
    ctx.stroke();
    ctx.restore();
  }

  function drawParticles() {
    particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  function addParticles(x, y, color, count) {
    for (var i = 0; i < count; i += 1) {
      particles.push({
        x: x,
        y: y,
        vx: rand(-90, 90),
        vy: rand(-120, 20),
        r: rand(2, 6),
        life: rand(0.45, 0.9),
        color: color
      });
    }
  }

  function jump(power) {
    if (!running || paused || !mint.grounded) return;
    mint.vy = -clamp(power || 430, 320, 650);
    mint.grounded = false;
    mint.action = 0.35;
  }

  function handleSpaceDown(event) {
    if (event.repeat) return;
    pendingSpace = true;
    spaceStart = performance.now();
    clearTimeout(spaceHoldTimer);
    spaceHoldTimer = setTimeout(function () {
      if (pendingSpace) {
        pendingSpace = false;
        jump(620);
      }
    }, 230);
    event.preventDefault();
  }

  function handleSpaceUp(event) {
    if (!pendingSpace) {
      event.preventDefault();
      return;
    }
    var held = performance.now() - spaceStart;
    pendingSpace = false;
    clearTimeout(spaceHoldTimer);
    if (held < 210 && document.activeElement === wordInput) {
      var start = wordInput.selectionStart;
      var end = wordInput.selectionEnd;
      wordInput.value = wordInput.value.slice(0, start) + ' ' + wordInput.value.slice(end);
      wordInput.setSelectionRange(start + 1, start + 1);
    } else {
      jump(430 + held * 0.7);
    }
    event.preventDefault();
  }

  function onKeyDown(event) {
    if (event.key.indexOf('Arrow') === 0) {
      keys[event.key] = true;
      event.preventDefault();
      return;
    }
    if (event.key === ' ') {
      handleSpaceDown(event);
      return;
    }
    if (event.key === 'Enter') {
      submitHunt('land');
      event.preventDefault();
      return;
    }
    if (event.key === '/') {
      submitHunt('sky');
      event.preventDefault();
      return;
    }
    if (event.key === '\\') {
      submitHunt('water');
      event.preventDefault();
    }
  }

  function onKeyUp(event) {
    if (event.key.indexOf('Arrow') === 0) {
      keys[event.key] = false;
      event.preventDefault();
      return;
    }
    if (event.key === ' ') handleSpaceUp(event);
  }

  function saveScore(finalScore) {
    var oldBest = statsState.scores[0] ? statsState.scores[0].score : 0;
    statsState.plays += 1;
    statsState.scores.push({ score: finalScore, at: Date.now() });
    statsState.scores.sort(function (a, b) { return b.score - a.score || a.at - b.at; });
    statsState.scores = statsState.scores.slice(0, 3);
    writeLocalStats(statsState);
    renderStats(statsState, false);
    sendStats('score', finalScore, function (remote) {
      renderStats(remote, true);
      var remoteBest = remote.scores && remote.scores[0] ? Number(remote.scores[0].score) : 0;
      if (remote.newBest || (finalScore > oldBest && finalScore >= remoteBest)) {
        overlay.querySelector('p').textContent = 'Chúc mừng bạn là người nuôi cọp xuất sắc nhất!';
        messageValue.textContent = 'Chúc mừng bạn là người nuôi cọp xuất sắc nhất!';
      }
    });
  }

  function readLocalStats() {
    try {
      var data = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return {
        players: data.players || 1,
        plays: data.plays || 0,
        scores: Array.isArray(data.scores) ? data.scores.slice(0, 3) : []
      };
    } catch (error) {
      return { players: 1, plays: 0, scores: [] };
    }
  }

  function writeLocalStats(data) {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch (error) {}
  }

  function renderStats(data, global) {
    var safe = data || { players: 1, plays: 0, scores: [] };
    playerCountValue.textContent = safe.players || 0;
    playCountValue.textContent = safe.plays || 0;
    statsScopeValue.textContent = global ? 'Top 3 điểm cao toàn cầu' : 'Top 3 điểm cao';
    leaderboardList.innerHTML = '';
    var scores = safe.scores || [];
    if (!scores.length) {
      var empty = document.createElement('li');
      empty.textContent = 'Chưa có điểm';
      leaderboardList.appendChild(empty);
      return;
    }
    scores.slice(0, 3).forEach(function (item) {
      var li = document.createElement('li');
      li.textContent = Math.round(Number(item.score) || 0) + ' điểm';
      leaderboardList.appendChild(li);
    });
  }

  function sendStats(action, finalScore, callback) {
    if (!statsEndpoint) {
      if (callback) callback(statsState);
      return;
    }
    var name = 'ceceStatsCallback' + Date.now() + Math.floor(Math.random() * 1000);
    var script = document.createElement('script');
    var done = false;
    window[name] = function (payload) {
      done = true;
      cleanup();
      if (payload && payload.ok !== false) {
        renderStats(payload, true);
        if (callback) callback(payload);
      } else if (callback) {
        callback(statsState);
      }
    };
    function cleanup() {
      delete window[name];
      if (script.parentNode) script.parentNode.removeChild(script);
    }
    var url = statsEndpoint
      + '?action=' + encodeURIComponent(action)
      + '&level=' + encodeURIComponent(gameLevel)
      + '&visitorId=' + encodeURIComponent(visitorId)
      + '&callback=' + encodeURIComponent(name);
    if (finalScore !== null && finalScore !== undefined) url += '&score=' + encodeURIComponent(Math.round(finalScore));
    script.onerror = function () {
      if (!done) {
        cleanup();
        if (callback) callback(statsState);
      }
    };
    script.src = url;
    document.head.appendChild(script);
  }

  function getVisitorId() {
    try {
      var id = localStorage.getItem(visitorKey);
      if (!id) {
        id = 'mint-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(visitorKey, id);
      }
      return id;
    } catch (error) {
      return 'mint-guest-' + Date.now();
    }
  }

  function speak(text) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    try {
      window.speechSynthesis.cancel();
      var utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.82;
      utterance.pitch = 1.02;
      window.speechSynthesis.speak(utterance);
    } catch (error) {}
  }

  function meaningFor(name) {
    var lower = name.toLowerCase();
    if (vietnameseMeanings[lower]) return vietnameseMeanings[lower];
    var parts = lower.split(/\s+/);
    for (var i = parts.length - 1; i >= 0; i -= 1) {
      if (vietnameseMeanings[parts[i]]) return vietnameseMeanings[parts[i]];
    }
    return 'một loài động vật';
  }

  function compact(text) {
    return String(text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function rand(min, max) {
    return min + rng() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  startButton.addEventListener('click', startGame);
  pauseButton.addEventListener('click', pauseGame);
  endButton.addEventListener('click', function () { endGame('Bạn đã kết thúc chuyến săn của Mint.'); });
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', resizeCanvas);

  resizeCanvas();
  wordInput.disabled = true;
  renderStats(statsState, false);
  sendStats('visit', null);
  resetGame();
  requestAnimationFrame(loop);
}());
