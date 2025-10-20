// Clean, minimal Phaser 3 scene that draws everything with Graphics

class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // no external assets
  }

  create() {
    this.cameras.main.setBackgroundColor('#e9f0ff');

    // ground graphics + physics tiles
    this.groundGroup = this.physics.add.staticGroup();
    this.groundGraphics = this.add.graphics();
    this.groundGraphics.fillStyle(0x6b8e23, 1);
    for (let i = 0; i < 32; i++) {
      const x = i * 32;
      const y = 520;
      this.groundGraphics.fillRect(x, y, 32, 80);
      const tile = this.groundGroup.create(x + 16, y + 16, null);
      tile.body.setSize(32, 32);
      tile.body.immovable = true;
      tile.body.allowGravity = false;
    }

    // player physics body
    this.player = this.physics.add.sprite(100, 460, null);
    this.player.setDisplaySize(32, 48);
    this.player.body.setCollideWorldBounds(true);

    // graphics for player
    this.playerGfx = this.add.graphics();

    // simple NPCs
    this.npcs = [];
    const npcXs = [600, 350, 800];
    npcXs.forEach((nx, idx) => {
      const nBody = this.physics.add.staticSprite(nx, 456, null);
      nBody.setDisplaySize(32, 48);
      const nGfx = this.add.graphics();
      nGfx.fillStyle(0xc62828, 1);
      nGfx.fillRoundedRect(nx - 16, 424, 32, 48, 8);
      nGfx.fillStyle(0xffe0b2, 1);
      nGfx.fillCircle(nx, 440, 12);
      const nHealthBar = this.add.graphics();
      this.npcs.push({ body: nBody, gfx: nGfx, healthBar: nHealthBar });
    });

    this.physics.add.collider(this.player, this.groundGroup);

    // input
    this.cursors = this.input.keyboard.createCursorKeys();

    // HUD
    this.add.text(12, 12, '-> | <- = move, Up = jump', { font: '16px Arial', fill: '#000' });

    // Parallax background: simple moving clouds
    this.clouds = this.add.group();
        // health bar for player
        this.playerHealthBar = this.add.graphics();
        this.playerHealth = 100;
    for (let i = 0; i < 6; i++) {
      const cx = 100 + i * 180;
      const cy = 80 + (i % 2) * 20;
      const cloud = this.add.graphics();
      cloud.fillStyle(0xffffff, 0.9);
      cloud.fillEllipse(0,0,120,40);
      cloud.x = cx; cloud.y = cy;
      cloud.speed = 0.2 + Math.random()*0.6;
      this.clouds.add(cloud);
    }

    // NPC data (gameplay state)
    const personalities = ['friendly', 'rude', 'shy'];
    this.npcsData = this.npcs.map((n, i)=>({
      name: `Classmate ${i+1}`,
      strength: 30 + i*10,
      frustration: 0,
      retaliation: false,
      alive: true,
      willing: Math.random() > 0.25,
      health: 100,
      personality: personalities[i % personalities.length]
    }));

    // track how many NPCs the player has "defeated" in RPS
    this.playerWins = 0;
    this.climaxTriggered = false;
  // flag while asking an NPC (prevents repeated SPACE)
  this.isAsking = false;

    // Talk UI and input for interaction
  this.talkText = this.add.text(480, 100, '', { font: '18px Arial', fill: '#222', backgroundColor: '#fff', padding: {x:8,y:4} }).setOrigin(0.5).setDepth(60).setVisible(false);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // No action menu: interactions use only the RPS minigame

    // Load player customization (from previous character screen) if exists
    const saved = localStorage.getItem('playerCustom');
    try {
      this.playerCustom = saved ? JSON.parse(saved) : { shirtColor: 0x1565c0, skinTone: 0xffe0b2 };
    } catch(e) {
      this.playerCustom = { shirtColor: 0x1565c0, skinTone: 0xffe0b2 };
    }

    // Action result text (in-scene)
    this.actionResultText = this.add.text(512, 560, '', { font: '18px Arial', fill: '#111', backgroundColor:'#fff', padding:{x:8,y:6} }).setOrigin(0.5).setDepth(30).setVisible(false);

    // Minigame UI (RPS)
    this.minigameContainer = this.add.container(512, 200).setDepth(25).setVisible(false);
    const mgBg = this.add.graphics();
    mgBg.fillStyle(0x222222, 0.9);
    mgBg.fillRoundedRect(-180, -60, 360, 120, 8);
    this.minigameContainer.add(mgBg);
    const choices = ['rock','paper','scissors'];
    // place centered buttons: -100, 0, +100 and set origin to center for proper alignment
    const btnXs = [-100, 0, 100];
    choices.forEach((c,i)=>{
      const tx = this.add.text(btnXs[i], 0, c.toUpperCase(), {font:'18px Arial', fill:'#fff'}).setInteractive({useHandCursor:true}).setOrigin(0.5);
      tx.on('pointerdown', ()=> this.resolveMinigame(c));
      this.minigameContainer.add(tx);
    });
    this.minigameResultText = this.add.text(512, 260, '', {font:'16px Arial', fill:'#fff'}).setOrigin(0.5).setDepth(26).setVisible(false);
  }

  // No onAction: interactions go straight to the minigame

  // Resolve the RPS minigame; playerChoice is 'rock'|'paper'|'scissors'
  resolveMinigame(playerChoice){
    const choices = ['rock','paper','scissors'];
    const npcChoice = Phaser.Utils.Array.GetRandom(choices);
    const win = (playerChoice === 'rock' && npcChoice === 'scissors') ||
                (playerChoice === 'scissors' && npcChoice === 'paper') ||
                (playerChoice === 'paper' && npcChoice === 'rock');
    const tie = playerChoice === npcChoice;
    const idx = this.currentNpcIndex;
  const npc = this.npcsData[idx];
  // base frustration for a successful attack
  const base = 15;

    let resultMsg = '';
    if (tie) {
      resultMsg = `Tie! Classmate pick ${npcChoice.toUpperCase()}.`;
    } else if (win) {
      npc.frustration = Math.min(100, npc.frustration + Math.round(base * 1.2));
      npc.strength = Math.max(0, npc.strength - 8);
      npc.health = Math.max(0, npc.health - 20);
      window.playerStats = window.playerStats || { strength: 50, personality: 50 };
      window.playerStats.personality = (window.playerStats.personality || 50) - 6;
      resultMsg = `You win! Classmate pick ${npcChoice.toUpperCase()}. Classmate getting mad !`;
      this.playerWins += 1;
      if (npc.health <= 0) {
        npc.alive = false;
        resultMsg += ` ${npc.name} knocked down.`;
      }
      if (this.playerWins >= 10 && !this.climaxTriggered) {
        this.climaxTriggered = true;
        this.time.delayedCall(600, ()=> this.triggerClimax());
      }
    } else {
      window.playerStats = window.playerStats || { strength: 50, personality: 50 };
      window.playerStats.strength = Math.max(0, (window.playerStats.strength || 50) - 10);
      window.playerStats.personality = (window.playerStats.personality || 50) - 10;
      this.playerHealth = Math.max(0, this.playerHealth - 15);
      resultMsg = `You lose! Classmate pick ${npcChoice.toUpperCase()}. You got hit!`;
      if (this.playerHealth <= 0) {
        resultMsg += ' You knocked down.';
        this.time.delayedCall(800, ()=> this.showBeatenEnding());
      }
    }

    // handle retaliation
    if (npc.frustration >= 80 && !npc.retaliation) {
      npc.retaliation = true;
      resultMsg += ` ${npc.name} is about to lose control!`;
    }

    if (!npc.alive) {
      resultMsg += ` ${npc.name} has left.`;
    }

    this.minigameResultText.setText(resultMsg).setVisible(true);
    this.minigameContainer.setVisible(false);
    this.showActionResult(resultMsg);
    // hide minigame result after a moment
    this.time.delayedCall(1800, ()=> { this.minigameResultText.setVisible(false); });
    // clear pending
    this.pendingAction = null;
  }

  showActionResult(msg){
    this.actionResultText.setText(msg).setVisible(true);
    this.time.delayedCall(2500, ()=> this.actionResultText.setVisible(false));
  }

  // --- Climax / ending flow (non-graphic) ---
  triggerClimax(){
    // stop regular input and interactions
    this.input.enabled = false;
    this.actionMenu.setVisible(false);
    this.minigameContainer.setVisible(false);

    // create climax UI
    this.climaxContainer = this.add.container(512, 220).setDepth(40);
    const ccBg = this.add.graphics();
    ccBg.fillStyle(0x000000, 0.85);
    ccBg.fillRect(-360, -140, 720, 280);
    this.climaxContainer.add(ccBg);
    this.climaxDialogText = this.add.text(0, -60, 'Climax: Conflict has escalated...', {font:'20px Arial', fill:'#fff', align:'center', wordWrap:{width:640}}).setOrigin(0.5);
    this.climaxContainer.add(this.climaxDialogText);

    // choices: Apologize / Provoke / Stay Silent
    const apologies = [ ['Apologize','apologize'], ['Provoke','provoke'], ['Stay Silent','silent'] ];
    apologies.forEach((p,i)=>{
      const btn = this.add.text(-160 + i*160, 20, p[0], {font:'18px Arial', fill:'#fff', backgroundColor:'#444', padding:{x:8,y:6}}).setInteractive({useHandCursor:true}).setOrigin(0.5);
      btn.on('pointerdown', ()=> this.handleClimaxChoice(p[1]));
      this.climaxContainer.add(btn);
    });
  }

  handleClimaxChoice(choice){
    // remove climax UI
    if (this.climaxContainer) this.climaxContainer.destroy();
    // depending on choice, show different endings
    if (choice === 'apologize'){
      this.showReconcileEnding();
    } else {
      // 'provoke' or 'silent' lead to a severe (non-graphic) beating ending
      this.showBeatenEnding();
    }
  }

  showReconcileEnding(){
    // player apologizes, conflict resolves — non-violent
    const msg = 'You choose to apologize. The conflict de-escalates, and the school intervenes to mediate.';
    const endBg = this.add.graphics();
    endBg.fillStyle(0xffffff, 1);
    endBg.fillRect(162, 180, 700, 220);
    const endText = this.add.text(512, 260, msg, {font:'20px Arial', fill:'#000', align:'center', wordWrap:{width:640}}).setOrigin(0.5);
    const btn = this.add.text(512, 340, 'Play Again', {font:'18px Arial', fill:'#fff', backgroundColor:'#007acc', padding:{x:10,y:6}}).setInteractive({useHandCursor:true}).setOrigin(0.5);
    btn.on('pointerdown', ()=> this.scene.restart());
  }

  showBeatenEnding(){
    // Non-graphic depiction: player is incapacitated and taken away
    // visually indicate player is down: draw a darker overlay and a downed player sprite
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0,0,1024,600);

    // draw a simple 'down' representation for the player (rotated rectangle)
    const downG = this.add.graphics();
    downG.fillStyle(0x1565c0, 1);
    downG.fillRect(this.player.x - 36, this.player.y - 8, 48, 18);
    downG.fillStyle(0xffe0b2, 1);
    downG.fillCircle(this.player.x + 10, this.player.y - 2, 10);

    const msg = 'You got severely beaten and incapacitated. School authorities arrive and take you to the nurse.';
    const endText = this.add.text(512, 260, msg, {font:'20px Arial', fill:'#fff', align:'center', wordWrap:{width:640}}).setOrigin(0.5);
    const btn = this.add.text(512, 340, 'Play Again', {font:'18px Arial', fill:'#000', backgroundColor:'#fff', padding:{x:10,y:6}}).setInteractive({useHandCursor:true}).setOrigin(0.5);
    btn.on('pointerdown', ()=> this.scene.restart());
  }

  update() {
    const speed = 160;
    if (this.cursors.left.isDown) this.player.setVelocityX(-speed);
    else if (this.cursors.right.isDown) this.player.setVelocityX(speed);
    else this.player.setVelocityX(0);
    if (this.cursors.up.isDown && this.player.body.onFloor()) this.player.setVelocityY(-360);

    // draw player at physics pos
    this.drawPlayer(this.player.x, this.player.y);
    // draw player health bar
    this.playerHealthBar.clear();
    const px = this.player.x, py = this.player.y - 40;
    this.playerHealthBar.fillStyle(0xff0000, 1);
    this.playerHealthBar.fillRect(px - 16, py - 16, 32, 6);
    this.playerHealthBar.fillStyle(0x00ff00, 1);
    this.playerHealthBar.fillRect(px - 16, py - 16, 32 * (this.playerHealth/100), 6);

    // draw NPC health bars
    this.npcs.forEach((npc, i) => {
      const n = npc.body;
      const nd = this.npcsData[i];
      npc.healthBar.clear();
      if (nd.alive) {
        npc.healthBar.fillStyle(0xff0000, 1);
        npc.healthBar.fillRect(n.x - 16, n.y - 40, 32, 6);
        npc.healthBar.fillStyle(0x00ff00, 1);
        npc.healthBar.fillRect(n.x - 16, n.y - 40, 32 * (nd.health/100), 6);
      }
    });
    // move clouds
    this.clouds.getChildren().forEach(c=>{ c.x += c.speed; if(c.x>1150) c.x = -100; });

    // proximity detection and talk interaction
    let nearNpc = -1;
    for (let i=0;i<this.npcs.length;i++){
      const n = this.npcs[i].body;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, n.x, n.y);
      if (d < 64 && this.npcsData[i].alive) { nearNpc = i; break; }
    }
    if (nearNpc >= 0) {
      // only show the prompt when the minigame isn't already open and we're not in the middle of asking
      if (!this.minigameContainer.visible && !this.isAsking) {
        this.talkText.setText('Press [SPACE] to play RPS with ' + this.npcsData[nearNpc].name);
        this.talkText.setVisible(true);
      } else if (!this.isAsking) {
        this.talkText.setVisible(false);
      }

      if (!this.isAsking && Phaser.Input.Keyboard.JustDown(this.spaceKey)){
        // ask the NPC to play; NPC may accept or refuse
        this.isAsking = true;
        this.currentNpcIndex = nearNpc;
        this.askToPlay(nearNpc);
      }
    } else {
      this.talkText.setVisible(false);
      // hide minigame if moved away
      if (this.minigameContainer.visible) this.minigameContainer.setVisible(false);
    }
  }

  // Ask NPC to play: show player line, then NPC response; if agrees, start minigame
  askToPlay(npcIndex){
    const npc = this.npcsData[npcIndex];
    // player line
    this.talkText.setText(`I: "Hey, want to play rock-paper-scissors? Loser gets flicked on the forehead!"`);
    this.talkText.setVisible(true);
    // after short delay, show NPC response
    this.time.delayedCall(800, ()=>{
      if (npc.willing && npc.alive) {
        let reply = '';
        if (npc.personality === 'friendly') reply = 'Sure, let\'s have some fun!';
        else if (npc.personality === 'grumpy') reply = 'Fine, but don\'t cry if you lose!';
        else reply = 'Uh... okay, I guess.';
        this.talkText.setText(npc.name + ` (${npc.personality}): "${reply}"`);
        this.time.delayedCall(600, ()=>{
          this.minigameContainer.setVisible(true);
          this.minigameResultText.setVisible(false);
          this.talkText.setVisible(false);
          this.isAsking = false;
        });
      } else {
        let reply = '';
        if (npc.personality === 'friendly') reply = 'Sorry, I don\'t like violence.';
        else if (npc.personality === 'grumpy') reply = 'I don\'t have time to play with you!';
        else reply = 'I... don\'t want to play.';
        this.talkText.setText(npc.name + ` (${npc.personality}): "${reply}"`);
        this.time.delayedCall(1200, ()=>{
          this.talkText.setVisible(false);
          this.isAsking = false;
        });
      }
    });
  }

  drawPlayer(x, y) {
    const g = this.playerGfx;
    g.clear();
    // shirt/body color from customization
    const shirt = this.playerCustom && this.playerCustom.shirtColor ? this.playerCustom.shirtColor : 0x1565c0;
    const skin = this.playerCustom && this.playerCustom.skinTone ? this.playerCustom.skinTone : 0xffe0b2;
    g.fillStyle(shirt, 1);
    g.fillRect(x - 16, y - 32, 32, 48);
    g.fillStyle(skin, 1);
    g.fillCircle(x, y - 16, 12);
  }
}

// start the game
if (typeof Phaser !== 'undefined') {
  const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 600,
    parent: 'game-container',
    physics: { default: 'arcade', arcade: { gravity: { y: 800 }, debug: false } },
    scene: [MainScene]
  };
  new Phaser.Game(config);
}
