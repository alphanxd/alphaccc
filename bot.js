const mineflayer = require('mineflayer');
const express = require('express');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const mcDataLoader = require('minecraft-data');

// KEEP RENDER ALIVE
const app = express();
app.get('/', (req, res) => res.send('Bot Alive'));
app.listen(3000);

function createBot() {
  const bot = mineflayer.createBot({
    host: 'VoidPulseSMP.aternos.me',
    port: 15376,
    username: 'God_AI_Bot',
    version: false
  });

  bot.loadPlugin(pathfinder);

  let mcData;
  let defaultMove;
  let basePosition = null;

  bot.on('spawn', () => {
    console.log('🧠 AI Bot Spawned');

    mcData = mcDataLoader(bot.version);
    defaultMove = new Movements(bot, mcData);

    // Save spawn as base
    basePosition = bot.entity.position.clone();

    startBrain();
  });

  // =========================
  // 🧠 MAIN AI LOOP
  // =========================
  function startBrain() {
    setInterval(() => {
      try {
        survivalCheck();
        dangerCheck();
      } catch (e) {
        console.log('Brain error:', e);
      }
    }, 5000);
  }

  // =========================
  // 🍖 AUTO EAT
  // =========================
  function survivalCheck() {
    if (bot.food < 15) {
      const food = bot.inventory.items().find(item => item.name.includes('bread') || item.name.includes('beef'));
      if (food) {
        bot.equip(food, 'hand');
        bot.consume();
        console.log('🍖 Eating food');
      }
    }
  }

  // =========================
  // ⚠ DANGER DETECTION
  // =========================
  function dangerCheck() {
    const mob = Object.values(bot.entities).find(e =>
      e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 6
    );

    if (mob) {
      console.log('⚠ Danger detected!');
      runAway(mob);
    }
  }

  function runAway(mob) {
    bot.pathfinder.setMovements(defaultMove);

    const away = bot.entity.position.offset(
      bot.entity.position.x - mob.position.x,
      0,
      bot.entity.position.z - mob.position.z
    );

    bot.pathfinder.setGoal(new goals.GoalBlock(away.x, away.y, away.z));
  }

  // =========================
  // 👤 FOLLOW PLAYER
  // =========================
  bot.on('chat', (username, message) => {
    if (username === bot.username) return;

    const target = bot.players[username]?.entity;

    if (message === '!follow' && target) {
      bot.chat('🧠 Following...');
      bot.pathfinder.setMovements(defaultMove);
      bot.pathfinder.setGoal(new goals.GoalFollow(target, 2), true);
    }

    if (message === '!stop') {
      bot.chat('🛑 Stopping');
      bot.pathfinder.setGoal(null);
    }

    if (message === '!home') {
      if (basePosition) {
        bot.chat('🏠 Returning home');
        bot.pathfinder.setGoal(
          new goals.GoalBlock(
            basePosition.x,
            basePosition.y,
            basePosition.z
          )
        );
      }
    }
  });

  // =========================
  // 🔁 AUTO RECONNECT
  // =========================
  bot.on('end', () => {
    console.log('🔁 Reconnecting...');
    setTimeout(createBot, 5000);
  });

  bot.on('error', err => console.log(err));
}

createBot();
