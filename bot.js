const mineflayer = require('mineflayer');
const express = require('express');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const mcDataLoader = require('minecraft-data');

// 🌐 KEEP RENDER ALIVE
const app = express();
app.get('/', (req, res) => res.send('Bot Alive'));
app.listen(3000, () => console.log('🌐 KeepAlive running'));

function startBot() {

  const bot = mineflayer.createBot({
    host: 'VoidPulseSMP.aternos.me', // CHANGE if needed
    port: 15376,                     // CHANGE if needed
    username: 'GodAI_1',
    version: false,                  // auto detect (1.21 safe)
    auth: 'offline'                  // 🔐 IMPORTANT (for cracked servers)
  });

  bot.loadPlugin(pathfinder);

  let mcData;
  let movements;
  let home = null;

  bot.on('spawn', () => {
    console.log('✅ Bot Spawned');

    mcData = mcDataLoader(bot.version);
    movements = new Movements(bot, mcData);

    bot.pathfinder.setMovements(movements);

    // Save home position
    home = bot.entity.position.clone();

    brainLoop();
  });

  // =========================
  // 🧠 MAIN AI LOOP
  // =========================
  function brainLoop() {
    setInterval(() => {
      try {
        eatIfHungry();
        avoidMobs();
      } catch (err) {
        console.log('Brain Error:', err);
      }
    }, 4000);
  }

  // =========================
  // 🍖 AUTO EAT
  // =========================
  async function eatIfHungry() {
    if (bot.food < 15 && !bot.isEating) {
      const food = bot.inventory.items().find(item =>
        item.name.includes('bread') ||
        item.name.includes('beef') ||
        item.name.includes('chicken')
      );

      if (food) {
        try {
          await bot.equip(food, 'hand');
          await bot.consume();
          console.log('🍖 Eating...');
        } catch (e) {}
      }
    }
  }

  // =========================
  // ⚠ MOB AVOID SYSTEM
  // =========================
  function avoidMobs() {
    const mob = Object.values(bot.entities).find(e =>
      e.type === 'mob' &&
      e.position.distanceTo(bot.entity.position) < 6
    );

    if (mob) {
      console.log('⚠ Mob nearby → escaping');

      const dx = bot.entity.position.x - mob.position.x;
      const dz = bot.entity.position.z - mob.position.z;

      const escapePos = bot.entity.position.offset(dx * 2, 0, dz * 2);

      bot.pathfinder.setGoal(
        new goals.GoalBlock(escapePos.x, escapePos.y, escapePos.z)
      );
    }
  }

  // =========================
  // 🎮 CHAT COMMANDS
  // =========================
  bot.on('chat', (username, message) => {
    if (username === bot.username) return;

    const target = bot.players[username]?.entity;

    if (message === '!follow' && target) {
      bot.chat('👤 Following you');
      bot.pathfinder.setGoal(new goals.GoalFollow(target, 2), true);
    }

    if (message === '!stop') {
      bot.chat('🛑 Stopped');
      bot.pathfinder.setGoal(null);
    }

    if (message === '!home' && home) {
      bot.chat('🏠 Going home');
      bot.pathfinder.setGoal(
        new goals.GoalBlock(home.x, home.y, home.z)
      );
    }

    if (message === '!jump') {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
    }
  });

  // =========================
  // ⚠ DEBUG LOGGING (VERY IMPORTANT)
  // =========================
  bot.on('kicked', (reason) => {
    console.log('❌ Kicked for:', reason);
  });

  bot.on('error', (err) => {
    console.log('❌ Error:', err);
  });

  // =========================
  // 🔁 AUTO RECONNECT
  // =========================
  bot.on('end', () => {
    console.log('🔁 Reconnecting in 5s...');
    setTimeout(startBot, 5000);
  });
}

startBot();
