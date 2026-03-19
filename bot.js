const mineflayer = require('mineflayer');
const express = require('express');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const mcDataLoader = require('minecraft-data');

// 🌐 KEEP ALIVE (Render)
const app = express();
app.get('/', (req, res) => res.send('Human Bot Alive'));
app.listen(3000, () => console.log('🌐 KeepAlive running'));

// ⚙ SETTINGS
const HOST = 'VoidPulseSMP.aternos.me';
const PORT = 15376;
const BOT_COUNT = 1; // start with 1 (increase later)

// =========================
// 🤖 CREATE BOT
// =========================
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

  bot.on('spawn', () => {
    console.log(`🤖 ${name} joined`);

    mcData = mcDataLoader(bot.version);
    bot.pathfinder.setMovements(new Movements(bot, mcData));

    // 🚀 instant move (anti-timeout)
    bot.setControlState('forward', true);
    setTimeout(() => bot.setControlState('forward', false), 1500);

    equipArmor();
    humanMovement();
    humanLook();
    antiTimeout();

    // delay brain (more human-like)
    setTimeout(() => {
      brainLoop();
    }, 4000);
  });

  // =========================
  // 🧠 HUMAN AI LOOP
  // =========================
  function brainLoop() {
    setInterval(() => {
      try {
        eatIfHungry();
        attackMob();
        randomPause(); // human delay
      } catch {}
    }, 2500 + Math.random() * 2000);
  }

  // =========================
  // ⚔ SMART COMBAT
  // =========================
  function attackMob() {
    const mob = Object.values(bot.entities).find(e =>
      e.type === 'mob' &&
      e.position.distanceTo(bot.entity.position) < 4
    );

    if (mob) {
      bot.lookAt(mob.position.offset(0, 1, 0), true);

      setTimeout(() => {
        bot.attack(mob);
      }, 300 + Math.random() * 400); // human reaction delay

      console.log(`${name} ⚔ attacking ${mob.name}`);
    }
  }

  // =========================
  // 🍖 AUTO EAT
  // =========================
  async function eatIfHungry() {
    if (bot.food < 14 && !bot.isEating) {
      const food = bot.inventory.items().find(i =>
        i.name.includes('bread') ||
        i.name.includes('beef') ||
        i.name.includes('chicken')
      );

      if (food) {
        try {
          await bot.equip(food, 'hand');
          await bot.consume();
          console.log(`${name} 🍖 eating`);
        } catch {}
      }
    }
  }

  // =========================
  // 🛡 AUTO ARMOR
  // =========================
  async function equipArmor() {
    for (let item of bot.inventory.items()) {
      if (item.name.includes('helmet')) await bot.equip(item, 'head').catch(()=>{});
      if (item.name.includes('chestplate')) await bot.equip(item, 'torso').catch(()=>{});
      if (item.name.includes('leggings')) await bot.equip(item, 'legs').catch(()=>{});
      if (item.name.includes('boots')) await bot.equip(item, 'feet').catch(()=>{});
    }
  }

  // =========================
  // 🕺 HUMAN MOVEMENT
  // =========================
  function humanMovement() {
    setInterval(() => {
      const actions = ['forward', 'back', 'left', 'right'];
      const action = actions[Math.floor(Math.random() * actions.length)];

      bot.setControlState(action, true);

      setTimeout(() => {
        bot.setControlState(action, false);
      }, 1000 + Math.random() * 1000);

      // occasional jump
      if (Math.random() < 0.4) {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 300);
      }

    }, 2000 + Math.random() * 2000);
  }

  // =========================
  // 👀 HUMAN LOOK
  // =========================
  function humanLook() {
    setInterval(() => {
      const yaw = bot.entity.yaw + (Math.random() - 0.5);
      const pitch = (Math.random() - 0.5) * 0.3;

      bot.look(yaw, pitch, true);
    }, 1500 + Math.random() * 1000);
  }

  // =========================
  // ⏱ RANDOM PAUSE (HUMAN FEEL)
  // =========================
  function randomPause() {
    if (Math.random() < 0.2) {
      bot.clearControlStates();
      console.log(`${name} 🧠 thinking...`);
    }
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
  // 💀 RESPAWN
  // =========================
  bot.on('death', () => {
    console.log(`${name} 💀 died`);
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

  bot.on('kicked', r => console.log(`${name} kicked:`, r));
  bot.on('error', e => console.log(`${name} error:`, e));
}

// =========================
// 🤖 START BOT(S)
// =========================

for (let i = 1; i <= BOT_COUNT; i++) {
  setTimeout(() => {
    createBot('HumanBot_' + i);
  }, i * 3000);
}
