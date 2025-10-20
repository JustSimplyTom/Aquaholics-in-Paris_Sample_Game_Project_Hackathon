// Phaser 3.60.0 story-based game scene
class StoryScene extends Phaser.Scene {
  constructor() { super({ key: 'StoryScene' }); }

  preload() {}

  create() {
    this.cameras.main.setBackgroundColor('#e9f0ff');
    this.player = this.physics.add.sprite(120, 420, null);
    this.player.setDisplaySize(32, 48);
    this.playerGfx = this.add.graphics();
    this.playerHealth = 100;
    this.playerHealthBar = this.add.graphics();

    // Classmates
    this.classmates = [
      { name: 'Classmate 1', x: 320, personality: 'friendly', health: 100, healthBar: this.add.graphics(), alive: true },
      { name: 'Classmate 2', x: 520, personality: 'aggressive', health: 100, healthBar: this.add.graphics(), alive: true },
      { name: 'Classmate 3', x: 720, personality: 'shy', health: 100, healthBar: this.add.graphics(), alive: true }
    ];
    this.classmateGfx = this.classmates.map(c => this.add.graphics());

    // Dialogue
    this.dialogueText = this.add.text(512, 80, '', { font: '20px Arial', fill: '#222', backgroundColor: '#fff', padding: {x:12,y:8} }).setOrigin(0.5).setDepth(10).setVisible(false);
    this.redText = this.add.text(512, 300, '', { font: '28px Arial', fill: '#d32f2f', backgroundColor: '#fff', padding: {x:16,y:12} }).setOrigin(0.5).setDepth(100).setVisible(false);
    this.restartBtn = this.add.text(512, 380, 'Restart', { font: '22px Arial', fill: '#fff', backgroundColor: '#1976d2', padding: {x:16,y:8} }).setOrigin(0.5).setDepth(101).setVisible(false).setInteractive();
    this.restartBtn.on('pointerdown', () => this.scene.restart());

    // Fade overlay
    this.fadeOverlay = this.add.graphics().setDepth(99);
    this.fadeOverlay.setAlpha(0);

    // RPS UI
    this.rpsContainer = this.add.container(512, 200).setDepth(20).setVisible(false);
    const rpsBg = this.add.graphics();
    rpsBg.fillStyle(0x222222, 0.9);
    rpsBg.fillRoundedRect(-180, -60, 360, 120, 8);
    this.rpsContainer.add(rpsBg);
    const choices = ['rock','paper','scissors'];
    choices.forEach((c,i)=>{
      const tx = this.add.text(-100 + i*100, 0, c.toUpperCase(), {font:'20px Arial', fill:'#fff'}).setInteractive({useHandCursor:true}).setOrigin(0.5);
      tx.on('pointerdown', ()=> this.playRPS(c));
      this.rpsContainer.add(tx);
    });
    this.rpsResultText = this.add.text(0, 50, '', {font:'18px Arial', fill:'#fff'}).setOrigin(0.5);
    this.rpsContainer.add(this.rpsResultText);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // State
    this.currentClassmate = null;
    this.storyStep = 0;
    this.playerWins = 0;
    this.aggressiveTriggered = false;
    this.friendlyTriggered = false;
    this.shyTriggered = false;

    // Draw initial
    this.drawAll();
    this.showDialogue('Move with arrow keys. Press SPACE to interact with classmates.');
  }

  drawAll() {
    // Player
    this.playerGfx.clear();
    this.playerGfx.fillStyle(0x1565c0, 1);
    this.playerGfx.fillRect(this.player.x - 16, this.player.y - 32, 32, 48);
    this.playerGfx.fillStyle(0xffe0b2, 1);
    this.playerGfx.fillCircle(this.player.x, this.player.y - 16, 12);
    // Player health bar
    this.playerHealthBar.clear();
    this.playerHealthBar.fillStyle(0xff0000, 1);
    this.playerHealthBar.fillRect(this.player.x - 16, this.player.y - 44, 32, 6);
    this.playerHealthBar.fillStyle(0x00ff00, 1);
    this.playerHealthBar.fillRect(this.player.x - 16, this.player.y - 44, 32 * (this.playerHealth/100), 6);
    // Classmates
    this.classmates.forEach((c, i) => {
      const g = this.classmateGfx[i];
      g.clear();
      if (!c.alive) return;
      g.fillStyle(c.personality==='aggressive'?0x8d1919:0xc62828, 1);
      g.fillRoundedRect(c.x - 16, 424, 32, 48, 8);
      g.fillStyle(0xffe0b2, 1);
      g.fillCircle(c.x, 440, 12);
      // Health bar
      c.healthBar.clear();
      c.healthBar.fillStyle(0xff0000, 1);
      c.healthBar.fillRect(c.x - 16, 420, 32, 6);
      c.healthBar.fillStyle(0x00ff00, 1);
      c.healthBar.fillRect(c.x - 16, 420, 32 * (c.health/100), 6);
    });
  }

  showDialogue(msg) {
    this.dialogueText.setText(msg).setVisible(true);
    this.time.delayedCall(2000, ()=> this.dialogueText.setVisible(false));
  }

  update() {
    if (this.storyStep > 0) return; // lock movement during story events
    const speed = 160;
    if (this.cursors.left.isDown) this.player.setVelocityX(-speed);
    else if (this.cursors.right.isDown) this.player.setVelocityX(speed);
    else this.player.setVelocityX(0);
    if (this.cursors.up.isDown && this.player.body.onFloor()) this.player.setVelocityY(-360);
    this.drawAll();
    // Proximity check
    let near = null;
    for (let i=0;i<this.classmates.length;i++) {
      const c = this.classmates[i];
      if (!c.alive) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, 456);
      if (d < 64) { near = i; break; }
    }
    if (near!==null && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.currentClassmate = near;
      this.handleInteraction(near);
    }
  }

  handleInteraction(idx) {
    const c = this.classmates[idx];
    if (c.personality==='shy') {
      this.storyStep = 3;
      this.fadeOut(()=>{
        this.redText.setText('Some people may not have good intentions. Be cautious when interacting with others.').setVisible(true);
      });
      return;
    }
    let msg = '';
    if (c.personality==='friendly') msg = 'Classmate 1 (friendly): "Just for fun!"';
    else if (c.personality==='aggressive') msg = 'Classmate 2 (Rude): "Don\'t cry if you lose!"';
    this.showDialogue(msg);
    this.rpsContainer.setVisible(true);
    this.rpsResultText.setText('');
  }

  playRPS(playerChoice) {
    const idx = this.currentClassmate;
    const c = this.classmates[idx];
    let win;
    // Win bias for player
    if (!this.friendlyTriggered && c.personality==='friendly') win = true;
    else if (!this.aggressiveTriggered && c.personality==='aggressive') win = true;
    else win = false;
    // Story triggers
    if (c.personality==='friendly') {
      if (!this.friendlyTriggered) {
        c.health -= 50;
        this.playerWins++;
        this.rpsResultText.setText('You win!');
        if (c.health <= 0) {
          c.alive = false;
          this.friendlyTriggered = true;
          this.storyStep = 1;
          this.rpsContainer.setVisible(false);
          this.fadeOut(()=>{
            this.redText.setText('Don\'t let emotions cloud your judgment over trivial matters.').setVisible(true);
          });
        }
      }
    } else if (c.personality==='aggressive') {
      if (!this.aggressiveTriggered) {
        c.health -= 50;
        this.playerWins++;
        this.rpsResultText.setText('You win!');
        if (c.health <= 0) {
          c.alive = false;
          this.aggressiveTriggered = true;
          this.storyStep = 2;
          this.rpsContainer.setVisible(false);
          // Player gets beaten
          this.time.delayedCall(800, ()=>{
            this.playerHealth = 0;
            this.drawAll();
            this.fadeOut(()=>{
              this.redText.setText('School bullying is a serious issue.').setVisible(true);
              this.restartBtn.setVisible(true);
            });
          });
        }
      }
    }
    this.drawAll();
    this.time.delayedCall(1200, ()=> this.rpsContainer.setVisible(false));
  }

  fadeOut(cb) {
    this.tweens.add({
      targets: this.fadeOverlay,
      alpha: 1,
      duration: 1200,
      onComplete: cb
    });
  }
}

if (typeof Phaser !== 'undefined') {
  const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 600,
    parent: 'game-container',
    physics: { default: 'arcade', arcade: { gravity: { y: 800 }, debug: false } },
    scene: [StoryScene]
  };
  new Phaser.Game(config);
}

window.addEventListener("DOMContentLoaded", () => {
  const intro = document.getElementById("intro-screen");
  const introText = document.getElementById("intro-text");

  // Auto fade out intro text
  setTimeout(() => {
    intro.style.opacity = 0;
    setTimeout(() => intro.remove(), 1500);
  }, 4000);
});
