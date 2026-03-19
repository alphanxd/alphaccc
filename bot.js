const mineflayer = require('mineflayer');
const express = require('express');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const mcDataLoader = require('minecraft-data');

// 🌐 KEEP RENDER ALIVE
const app = express();
app.get('/', (req, res) => res.send('Bot Army Alive'));
app.listen(3000, () => console.log('🌐 Server running'));

  const LEADER_NAME = 'thequantxd'; // 👈 PUT YOUR NAME

function createBot(name) {

  const bot = mineflayer.createBot({
    host: 'VoidPulseSMP.aternos.me',
    port: 15376,
    username: name,
    version: false,
    auth: 'offline'
  });

  bot.loadPlugin(pathfinder);

  let mcData;
  let movements;

  bot.on('spawn', () => {
    console.log(`🤖 ${name} joined`);

    mcData = mcDataLoader(bot.version);
    movements = new Movements(bot, mcData);
    bot.pathfinder.setMovements(movements);

    startBrain();
    antiAFK();
    randomLook();
  });

  // =========================
  // 🧠 TEAM AI LOOP
  // =========================
  function startBrain() {
    setInterval(() => {
      try {
        followLeader();
        avoidMobs();
        eatIfHungry();
      } catch {}
    }, 3000);
  }

  // =========================
  // 👤 FOLLOW LEADER
  // =========================
  function followLeader() {
    const leader = bot.players[LEADER_NAME]?.entity;
    if (!leader) return;

    bot.pathfinder.setGoal(
      new goals.GoalFollow(leader, 2),
      true
    );
  }

  // =========================
  // ⚠ AVOID MOBS
  // =========================
  function avoidMobs() {
    const mob = Object.values(bot.entities).find(e =>
      e.type === 'mob' &&
      e.position.distanceTo(bot.entity.position) < 5
    );

    if (mob) {
      const dx = bot.entity.position.x - mob.position.x;
      const dz = bot.entity.position.z - mob.position.z;

      const escape = bot.entity.position.offset(dx * 2, 0, dz * 2);

      bot.pathfinder.setGoal(
        new goals.GoalBlock(escape.x, escape.y, escape.z)
      );
    }
  }

  // =========================
  // 🍖 AUTO EAT
  // =========================
  async function eatIfHungry() {
    if (bot.food < 15 && !bot.isEating) {
      const food = bot.inventory.items().find(i =>
        i.name.includes('bread') ||
        i.name.includes('beef')
      );

      if (food) {
        try {
          await bot.equip(food, 'hand');
          await bot.consume();
        } catch {}
      }
    }
  }

  // =========================
  // 🕺 ANTI AFK
  // =========================
  function antiAFK() {
    setInterval(() => {
      const actions = ['forward', 'back', 'left', 'right'];
      const act = actions[Math.floor(Math.random() * actions.length)];

      bot.setControlState(act, true);

      setTimeout(() => {
        bot.setControlState(act, false);
      }, 1500);

    }, 7000);
  }

  // =========================
  // 👀 RANDOM LOOK
  // =========================
  function randomLook() {
    setInterval(() => {
      bot.look(Math.random() * Math.PI * 2, 0, true);
    }, 5000);
  }

  // =========================
  // 💀 RESPAWN
  // =========================
  bot.on('death', () => {
    setTimeout(() => {
      bot._client.write('client_command', { actionId: 0 });
    }, 2000);
  });

  // =========================
  // 🔁 RECONNECT
  // =========================
  bot.on('end', () => {
    console.log(`🔁 ${name} reconnecting...`);
    setTimeout(() => createBot(name), 5000);
  });

  bot.on('kicked', (r) => console.log(`${name} kicked:`, r));
  bot.on('error', (e) => console.log(`${name} error:`, e));
}

// =========================
// 🤖 SPAWN BOT ARMY
// =========================

const BOT_COUNT = 3;

for (let i = 1; i <= BOT_COUNT; i++) {
  setTimeout(() => {
    createBot('ArmyBot_' + i);
  }, i * 3000);
}
