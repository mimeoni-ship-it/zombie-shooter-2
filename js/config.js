// ========== GAME CONFIG ==========
const CONFIG = {
    // Player
    playerSpeed: 8,
    playerSnowSpeed: 3,
    jumpVelocity: 8,
    gravity: 20,

    // Health
    maxHealth: 100,
    zombieBiteDamage: 25,
    bossBiteDamage: 50,
    obstacleDamage: 50,

    // Thirst/Cold
    thirstDrain: 3,      // per second
    coldDrain: 3,        // per second
    thirstDamage: 10,    // per second when 0
    coldDamage: 10,      // per second when 0
    scorePenalty: 2,     // per second when 0

    // Speed progression
    baseSpeed: 20,
    speedGrowth: 0.8,    // per second
    speedMultGrowth: 0.03,

    // Spawning
    zombieBaseInterval: 2,
    zombieMinInterval: 0.4,
    obstacleBaseInterval: 2.5,
    obstacleMinInterval: 0.6,
    healthInterval: 12,
    waterInterval: 8,
    fireInterval: 8,

    // Boss
    bossScoreThreshold: 500,
    bossHealth: 30,
    bossDamage: 50,
    bossScore: 500,
    bossCoins: 200,

    // Weapons
    weapons: [
        { id: 0, name: 'Súng Cơ Bản', emoji: '🔫', damage: 1, fireRate: 300, auto: false, aoe: false, pierce: false, color: 0xffff00, price: 0, owned: true },
        { id: 1, name: 'Súng Liên Thanh', emoji: '🔫', damage: 1, fireRate: 80, auto: true, aoe: false, pierce: false, color: 0xffaa00, price: 500, owned: false },
        { id: 2, name: 'Súng Phóng Lựu', emoji: '🚀', damage: 3, fireRate: 600, auto: false, aoe: true, pierce: false, color: 0xff4400, price: 1500, owned: false },
        { id: 3, name: 'Súng Laser', emoji: '⚡', damage: 5, fireRate: 150, auto: true, aoe: false, pierce: true, color: 0x00ffff, price: 3000, owned: false }
    ],

    // Items
    itemPrices: { water: 200, fire: 200 },

    // Maps
    maps: {
        night:  { name: 'Đêm Mặc Định', emoji: '🌙', bg: 0x1a1a2e, fog: 0x1a1a2e, ground: 0x2d4a1e, road: 0x333333, ambient: 0x404060, ambientInt: 0.6, dir: 0xffaa44, dirInt: 0.8, special: null },
        desert: { name: 'Sa Mạc Nắng', emoji: '☀️', bg: 0xe8c880, fog: 0xe8c880, ground: 0xcc9944, road: 0xaa8855, ambient: 0xffddaa, ambientInt: 1.0, dir: 0xffffee, dirInt: 1.2, special: 'thirst' },
        snow:   { name: 'Băng Tuyết', emoji: '❄️', bg: 0xcceeff, fog: 0xcceeff, ground: 0xeeeeee, road: 0xcccccc, ambient: 0xaaccff, ambientInt: 0.9, dir: 0xffffff, dirInt: 0.9, special: 'cold' }
    },

    // Scoring
    zombieScore: 100,
    zombieCoins: 20,
    scorePerSecond: 15,
    coinRate: 10  // 1 coin per 10 score
};

// ========== STATE ==========
let GameState = {
    running: false,
    paused: false,
    score: 0,
    coins: parseInt(localStorage.getItem('zombieCoins') || '0'),
    zombiesKilled: 0,
    health: 100,
    thirst: 100,
    cold: 100,
    speed: 20,
    speedMult: 1,
    time: 0,
    currentMap: 'night',
    currentWeapon: 0,
    bossThreshold: 500,
    bossActive: false,
    combo: 0,
    comboTimer: 0
};

function saveCoins() {
    localStorage.setItem('zombieCoins', GameState.coins);
}

function resetGameState() {
    GameState.running = false;
    GameState.paused = false;
    GameState.score = 0;
    GameState.zombiesKilled = 0;
    GameState.health = 100;
    GameState.thirst = 100;
    GameState.cold = 100;
    GameState.speed = CONFIG.baseSpeed;
    GameState.speedMult = 1;
    GameState.time = 0;
    GameState.bossThreshold = CONFIG.bossScoreThreshold;
    GameState.bossActive = false;
    GameState.combo = 0;
    GameState.comboTimer = 0;
}
