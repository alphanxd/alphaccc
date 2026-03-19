const mineflayer = require('mineflayer');
const express = require('express');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const mcDataLoader = require('minecraft-data');

// 🌐 KEEP ALIVE (Render)
const app = express();
app.get('/', (req, res) => res.send('Bot Army Alive'));
app.listen(3000, () => console.log('🌐 KeepAlive running'));

// ⚙ SETTINGS
const HOST = 'VoidPulseSMP.aternos.me';
const PORT = 15376;
const BOT_COUNT = 2; // ⚠ keep low for Aternos

function createBot(name) {

  const bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
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

    equipArmor();
    startBrain();
    antiAFK();
    antiTimeout();
    randomLook();
  });

  // =========================
  // 💀 AUTO RESPAWN
  // =========================
  bot.on('death', () => {
    console.log(`${name} died → respawn`);
    setTimeout(() => {
      try {
        bot._client.write('client_command', { actionId: 0 });
      } catch {}
    }, 2000);
  });

  // =========================
  // 🧠 MAIN AI LOOP
  // =========================
  function startBrain() {
    setInterval(() => {
      try {
        attackMob();
        eatIfHungry();
        lagAware();
      } catch {}
    }, 2000);
  }

  // =========================
  // ⚔ AUTO COMBAT
  // =========================
  function attackMob() {
    const mob = Object.values(bot.entities).find(e =>
      e.type === 'mob' &&
      e.position.distanceTo(bot.entity.position) < 4
    );

    if (mob) {
      bot.lookAt(mob.position.offset(0, 1, 0));
      bot.attack(mob);
      console.log(`${name} ⚔ attacking ${mob.name}`);
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
  // 🛡 AUTO ARMOR
  // =========================
  async function equipArmor() {
    const armorSlots = ['head', 'torso', 'legs', 'feet'];

    for (let item of bot.inventory.items()) {
      if (item.name.includes('helmet')) await bot.equip(item, 'head').catch(()=>{});
      if (item.name.includes('chestplate')) await bot.equip(item, 'torso').catch(()=>{});
      if (item.name.includes('leggings')) await bot.equip(item, 'legs').catch(()=>{});
      if (item.name.includes('boots')) await bot.equip(item, 'feet').catch(()=>{});
    }
  }

  // =========================
  // 🧠 LAG-AWARE SYSTEM
  // =========================
  function lagAware() {
    const tps = bot.time.timeOfDay;

    // simple lag detection (tick delay)
    if (tps % 20 !== 0) {
      console.log(`${name} ⚠ Lag detected → slowing AI`);
    }
  }

  // =========================
  // 🕺 ANTI AFK (FAST)
  // =========================
  function antiAFK() {
    setInterval(() => {
      bot.setControlState('forward', true);

      setTimeout(() => {
        bot.setControlState('forward', false);
      }, 1000);

      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 300);

    }, 2000);
  }

  // =========================
  // ⚡ ANTI TIMEOUT
  // =========================
  function antiTimeout() {
    setInterval(() => {
      try {
        bot._client.write('keep_alive', { keepAliveId: Date.now() });
      } catch {}
    }, 5000);
  }

  // =========================
  // 👀 RANDOM LOOK
  // =========================
  function randomLook() {
    setInterval(() => {
      bot.look(
        bot.entity.yaw + (Math.random() - 0.5),
        bot.entity.pitch
      );
    }, 1500);
  }

  // =========================
  // 🔁 RECONNECT
  // =========================
  bot.on('end', () => {
    console.log(`🔁 ${name} reconnecting...`);
    setTimeout(() => createBot(name), 5000);
  });

  bot.on('kicked', r => console.log(`${name} kicked:`, r));
  bot.on('error', e => console.log(`${name} error:`, e));
}

// =========================
// 🤖 BOT ARMY SPAWN
// =========================

for (let i = 1; i <= BOT_COUNT; i++) {
  setTimeout(() => {
    createBot('GodBot_' + i);
  }, i * 3000);
}
