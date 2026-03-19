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
    host: 'VoidPulseSMP.aternos.me',
    port: 15376,
    username: 'Bot_' + Math.floor(Math.random() * 10000), // random name
    version: false,
    auth: 'offline'
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

    home = bot.entity.position.clone();

    brainLoop();
    antiAFK();
    randomLook();
  });

  // =========================
  // 💀 AUTO RESPAWN
  // =========================
  bot.on('death', () => {
    console.log('💀 Died → Respawning...');
    setTimeout(() => {
      try {
        bot._client.write('client_command', { actionId: 0 });
      } catch (e) {}
    }, 2000);
  });

  // =========================
  // 🧠 AI LOOP
  // =========================
  function brainLoop() {
    setInterval(() => {
      try {
        eatIfHungry();
        avoidMobs();
        healthCheck();
      } catch (e) {}
    }, 4000);
  }

  // =========================
  // 🍖 AUTO EAT
  // =========================
  async function eatIfHungry() {
    if (bot.food < 15 && !bot.isEating) {
      const food = bot.inventory.items().find(i =>
        i.name.includes('bread') ||
        i.name.includes('beef') ||
        i.name.includes('chicken')
      );

      if (food) {
        try {
          await bot.equip(food, 'hand');
          await bot.consume();
          console.log('🍖 Eating...');
        } catch {}
      }
    }
  }

  // =========================
  // ⚠ MOB ESCAPE
  // =========================
  function avoidMobs() {
    const mob = Object.values(bot.entities).find(e =>
      e.type === 'mob' &&
      e.position.distanceTo(bot.entity.position) < 6
    );

    if (mob) {
      console.log('⚠ Mob detected → running');

      const dx = bot.entity.position.x - mob.position.x;
      const dz = bot.entity.position.z - mob.position.z;

      const pos = bot.entity.position.offset(dx * 2, 0, dz * 2);

      bot.pathfinder.setGoal(
        new goals.GoalBlock(pos.x, pos.y, pos.z)
      );
    }
  }

  // =========================
  // ❤️ LOW HEALTH ESCAPE
  // =========================
  function healthCheck() {
    if (bot.health < 10) {
      console.log('⚠ Low health → retreat');

      const pos = bot.entity.position.offset(5, 0, 5);

      bot.pathfinder.setGoal(
        new goals.GoalBlock(pos.x, pos.y, pos.z)
      );
    }
  }

  // =========================
  // 🕺 HUMAN-LIKE MOVEMENT
  // =========================
  function antiAFK() {
    setInterval(() => {
      const actions = ['forward', 'back', 'left', 'right'];
      const action = actions[Math.floor(Math.random() * actions.length)];

      bot.setControlState(action, true);

      setTimeout(() => {
        bot.setControlState(action, false);
      }, 2000);

      if (Math.random() < 0.5) {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);
      }

    }, 8000);
  }

  // =========================
  // 👀 RANDOM LOOK
  // =========================
  function randomLook() {
    setInterval(() => {
      const yaw = Math.random() * Math.PI * 2;
      const pitch = (Math.random() - 0.5) * 0.5;
      bot.look(yaw, pitch, true);
    }, 5000);
  }

  // =========================
  // 🎮 COMMANDS
  // =========================
  bot.on('chat', (username, message) => {
    if (username === bot.username) return;

    const target = bot.players[username]?.entity;

    if (message === '!follow' && target) {
      bot.chat('👤 Following');
      bot.pathfinder.setGoal(new goals.GoalFollow(target, 2), true);
    }

    if (message === '!stop') {
      bot.chat('🛑 Stop');
      bot.pathfinder.setGoal(null);
    }

    if (message === '!home' && home) {
      bot.chat('🏠 Home');
      bot.pathfinder.setGoal(
        new goals.GoalBlock(home.x, home.y, home.z)
      );
    }
  });

  // =========================
  // ⚠ DEBUG
  // =========================
  bot.on('kicked', (reason) => {
    console.log('❌ KICKED:', reason);
  });

  bot.on('error', (err) => {
    console.log('❌ ERROR:', err);
  });

  // =========================
  // 🔁 RECONNECT (SLOW = SAFE)
  // =========================
  bot.on('end', () => {
    console.log('🔁 Reconnecting in 15s...');
    setTimeout(startBot, 15000);
  });
}

startBot();
