import Phaser from 'phaser';
import { SUITS, handTotal } from './game.js';

const C = { ink: 0x302b23, gold: 0xd6aa63, paper: 0xf6ecd5, rust: 0xad4e38, green: 0x244638 };

export class HeistScene extends Phaser.Scene {
  constructor(onSelect, onReady) {
    super('heist');
    this.onSelectCard = onSelect;
    this.onSceneReady = onReady;
    this.snapshot = null;
    this.selectedId = null;
    this.travel = 0;
    this.cardPositions = new Map();
    this.feedback = null;
    this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion = this.motionPreference.matches;
  }

  create() {
    this.background = this.add.graphics();
    this.landscape = this.add.graphics();
    this.windowMask = this.make.graphics({ x: 0, y: 0, add: false });
    this.landscape.setMask(this.windowMask.createGeometryMask());
    this.frame = this.add.graphics();
    this.caption = this.add.text(24, 157, 'BORDERLAND RAILROAD  /  CARGO MANIFEST', {
      fontFamily: 'monospace', fontSize: '10px', color: '#c3b899', letterSpacing: 1,
    });
    this.cardLayer = this.add.container();
    this.effectsLayer = this.add.container().setDepth(10);
    this.signal = this.add.graphics().setDepth(11);
    this.onMotionChange = (event) => {
      this.reducedMotion = event.matches;
      this.clearEffects();
      this.paintCards(false);
    };
    this.motionPreference.addEventListener('change', this.onMotionChange);
    this.scale.on('resize', this.layout, this);
    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      this.events.off('shutdown', cleanup);
      this.events.off('destroy', cleanup);
      this.scale.off('resize', this.layout, this);
      this.motionPreference.removeEventListener('change', this.onMotionChange);
      this.clearEffects();
      this.windowMask.destroy();
      this.cardPositions.clear();
    };
    this.events.once('shutdown', cleanup);
    this.events.once('destroy', cleanup);
    this.layout();
    this.onSceneReady(this);
  }

  layout() {
    const { width: w, height: h } = this.scale;
    const compact = h <= 370;
    const windowTop = compact ? 12 : 18;
    const windowHeight = compact ? 88 : 120;
    const feltTop = windowTop + windowHeight + 7;
    const windowScale = windowHeight / 120;
    const windowOffset = windowTop - 18 * windowScale;
    this.tableGeometry = {
      compact, windowScale, windowOffset,
      cardsTop: compact ? 137 : 181,
      bannerY: 100 * windowScale + windowOffset,
    };
    this.landscape.setScale(1, windowScale).setY(windowOffset);
    this.signal.setScale(1, windowScale).setY(windowOffset);
    const g = this.background.clear();
    g.fillStyle(0x624735).fillRect(0, 0, w, feltTop + 2);
    // Warm timber around the window, with brass edging above the green felt.
    g.lineStyle(1, 0xd6aa63, 0.1);
    for (let y = 6; y < feltTop; y += 12) {
      g.lineBetween(0, y, w, y);
      g.lineBetween(0, y + 3, w * 0.28, y + 3);
    }
    g.fillStyle(0x1d352d).fillRect(0, feltTop, w, h - feltTop);
    // A quiet, deterministic grain on the felt; no downloaded artwork.
    g.lineStyle(1, 0xc4b78c, 0.045);
    for (let x = -h; x < w; x += 13) g.lineBetween(x, feltTop, x + h, h);
    g.fillStyle(0x152720, 0.45).fillRect(0, h - 9, w, 9);
    g.fillStyle(0x332b22).fillRect(0, feltTop - 4, w, 7);
    g.fillStyle(0xcba467, 0.75).fillRect(0, feltTop + 1, w, 2);
    this.windowMask.clear().fillStyle(0xffffff).fillRoundedRect(22, windowTop, w - 44, windowHeight, 8);
    const f = this.frame.clear();
    f.lineStyle(7, 0x30291f).strokeRoundedRect(21, windowTop - 1, w - 42, windowHeight + 2, 10);
    f.lineStyle(2, 0xcaa469, 0.85).strokeRoundedRect(23, windowTop + 1, w - 46, windowHeight - 2, 7);
    f.lineStyle(1, 0xf4d199, 0.35).lineBetween(31, windowTop - 3, w - 31, windowTop - 3);
    for (const x of [12, w - 12]) for (const y of [windowTop - 4, feltTop - 3, h - 16]) {
      f.fillStyle(0xb7a276).fillCircle(x, y, 2);
      f.lineStyle(1, 0x554c37).lineBetween(x - 1, y, x + 1, y);
    }
    this.caption.setY(compact ? 117 : 157).setFontSize(w < 450 ? 8 : 10);
    this.paintLandscape();
    this.paintCards(false);
    this.paintSignal();
  }

  update(_time, delta) {
    if (this.reducedMotion) return;
    this.travel += Math.min(delta, 40) * 0.018;
    this.paintLandscape();
    this.paintSignal();
  }

  paintLandscape() {
    const g = this.landscape.clear();
    const w = this.scale.width;
    g.fillStyle(0xe6bf85).fillRect(20, 16, w - 40, 130);
    g.fillStyle(0xefd2a0).fillRect(20, 16, w - 40, 44);
    g.fillStyle(0xf9e3b1).fillCircle(w * 0.74, 52, 22);
    g.fillStyle(0xcf956a);
    for (let x = -320; x < w + 320; x += 260) {
      const p = x - this.travel * 0.16 % 260;
      g.fillPoints([{ x: p, y: 106 }, { x: p + 50, y: 66 }, { x: p + 96, y: 66 },
        { x: p + 110, y: 79 }, { x: p + 155, y: 82 }, { x: p + 215, y: 110 }], true);
    }
    g.fillStyle(0xb27654);
    for (let x = -230; x < w + 230; x += 210) {
      const p = x - this.travel * 0.35 % 210;
      g.fillPoints([{ x: p, y: 125 }, { x: p + 62, y: 90 }, { x: p + 90, y: 88 },
        { x: p + 108, y: 102 }, { x: p + 158, y: 104 }, { x: p + 210, y: 127 }], true);
    }
    g.fillStyle(0x956045).fillRect(0, 122, w, 20);
    // A tiny frontier settlement moves more slowly than the trackside poles.
    g.fillStyle(0x815a44, 0.55);
    const town = w + 150 - ((this.travel * 0.28 + w * 0.35) % (w + 470));
    for (let i = 0; i < 4; i++) {
      const p = town + i * 36;
      const height = i === 1 ? 25 : 14 + i * 2;
      g.fillRect(p, 121 - height, 28, height);
      g.fillRect(p - 3, 118 - height, 34, 4);
    }
    g.lineStyle(2, 0x785941, 0.55);
    g.lineBetween(town + 155, 91, town + 151, 123);
    g.lineBetween(town + 173, 91, town + 177, 123);
    g.fillRoundedRect(town + 151, 82, 26, 15, 3);
    // Telegraph poles and sagging wires pass the window.
    for (let x = -200; x < w + 280; x += 220) {
      const p = x - this.travel % 220;
      g.lineStyle(3, 0x634932).lineBetween(p, 72, p, 137);
      g.lineStyle(2, 0x634932).lineBetween(p - 12, 81, p + 12, 81);
      g.lineStyle(1, 0x715440, 0.7);
      g.beginPath(); g.moveTo(p, 77); g.lineTo(p + 110, 87); g.lineTo(p + 220, 77); g.strokePath();
    }
    g.fillStyle(0x48523c);
    for (let x = -300; x < w + 320; x += 360) {
      const p = x - this.travel * 0.6 % 360;
      g.fillRoundedRect(p, 99, 5, 27, 2);
      g.fillRoundedRect(p - 9, 109, 11, 4, 2);
      g.fillRoundedRect(p - 9, 103, 4, 9, 2);
      g.fillRoundedRect(p + 3, 105, 10, 4, 2);
      g.fillRoundedRect(p + 9, 96, 4, 12, 2);
    }
    g.lineStyle(2, 0x60432d).lineBetween(0, 132, w, 132);
    for (let x = -(this.travel * 2 % 24); x < w; x += 24) {
      g.lineStyle(2, 0x6e4730).lineBetween(x, 134, x + 8, 140);
    }
    // Soft puffs from the locomotive drift across the glass without hiding cards.
    for (let i = 0; i < 5; i++) {
      const age = (this.travel * 0.0035 + i / 5) % 1;
      const px = w + 25 - age * (w * 0.5 + 70);
      const py = 82 - age * 65 + Math.sin(age * Math.PI * 2) * 3;
      g.fillStyle(0xffefd1, (1 - age) * 0.17);
      g.fillEllipse(px, py, 36 + age * 55, 12 + age * 25);
    }
    g.lineStyle(1, 0xffefd1, 0.13).lineBetween(32, 28, w * 0.24, 28);
  }

  sync(state, selectedId) {
    const previous = this.feedback;
    const next = state ? {
      seed: state.seed, train: state.trainIndex, carriage: state.carriageIndex,
      history: state.history.length, phase: state.phase, pocketedId: state.pocketedId,
      handIds: state.hand.map((card) => card.id), total: handTotal(state.hand),
    } : null;
    const newHand = !previous || !next || previous.seed !== next.seed
      || previous.train !== next.train || previous.carriage !== next.carriage
      || next.history < previous.history || (previous.phase !== 'playing' && next.phase === 'playing');
    const previousIds = new Set(newHand ? [] : previous.handIds);
    if (newHand) {
      this.clearEffects();
      this.cardPositions.clear();
    }
    this.snapshot = state;
    this.selectedId = selectedId;
    this.feedback = next;
    this.paintCards(true, previousIds);
    this.paintSignal();
    if (!next || !previous) return;
    if (!newHand && next.pocketedId && previous.pocketedId !== next.pocketedId) this.animatePocket(next.pocketedId);
    if (next.phase === 'result' && (newHand || next.history > previous.history || previous.phase !== 'result')) {
      this.celebrate(state.result.busted ? 'bust' : state.result.perfect ? 'perfect' : 'escape', {
        amount: state.result.busted ? state.result.secured : state.result.total,
      });
    } else if (next.phase === 'playing' && next.total === 21 && (newHand || previous.total !== 21)) {
      this.celebrate('ready', { label: '21 · THE PERFECT MOMENT' });
    }
  }

  paintCards(animate, previousIds = new Set()) {
    if (!this.cardLayer) return;
    for (const card of this.cardLayer.list) this.stopObjectTweens(card);
    this.cardLayer.removeAll(true);
    const previousPositions = this.cardPositions;
    this.cardPositions = new Map();
    const { width: w, height: h } = this.scale;
    const hand = this.snapshot?.hand.length ? this.snapshot.hand : [null, null, null];
    const gap = w < 480 ? 9 : 16;
    const columns = Math.min(hand.length, Math.max(2, Math.floor((w - 44) / (70 + gap))));
    const rows = Math.ceil(hand.length / columns);
    const { cardsTop } = this.tableGeometry;
    const availableHeight = h - cardsTop - 11;
    const ch = Math.min(182, (availableHeight - (rows - 1) * gap) / rows);
    const cw = Math.min(124, ch / 1.47, (w - 44 - (columns - 1) * gap) / columns);
    const cardHeight = cw * 1.47;
    const gridHeight = rows * cardHeight + (rows - 1) * gap;
    const startY = cardsTop + (availableHeight - gridHeight) / 2;

    hand.forEach((card, index) => {
      const row = Math.floor(index / columns);
      const count = Math.min(columns, hand.length - row * columns);
      const x = (w - count * cw - (count - 1) * gap) / 2 + (index % columns) * (cw + gap);
      const y = startY + row * (cardHeight + gap);
      const node = this.add.container(x, y);
      const g = this.add.graphics();
      node.add(g);
      const selected = card && card.id === this.selectedId;
      const secured = card && card.id === this.snapshot?.pocketedId;
      if (selected) g.fillStyle(C.gold, 0.14).fillRoundedRect(-5, -5, cw + 10, cardHeight + 10, 10);
      g.fillStyle(0x071911, 0.45).fillRoundedRect(3, 6, cw, cardHeight, 7);
      g.fillStyle(card ? C.paper : 0x3d5e4c).fillRoundedRect(0, 0, cw, cardHeight, 7);
      g.lineStyle(selected ? 3 : 1, selected ? 0xedb854 : secured ? 0x9caa79 : 0xc3b899, card ? 1 : 0.5)
        .strokeRoundedRect(0, 0, cw, cardHeight, 7);
      g.lineStyle(1, card ? 0xc8b797 : 0x76896a, 0.6).strokeRoundedRect(5, 5, cw - 10, cardHeight - 10, 4);
      if (!card) {
        g.lineStyle(1, 0x9baf83, 0.2);
        for (let inset = 11; inset < cw / 3; inset += 6) g.strokeRoundedRect(inset, inset, cw - inset * 2, cardHeight - inset * 2, 3);
        this.drawLoot(g, 'spades', cw / 2, cardHeight / 2, cw / 90, 0x9baf83);
        this.cardLayer.add(node);
        return;
      }
      const suit = SUITS.find((item) => item.id === card.suit);
      const color = ['diamonds', 'hearts'].includes(card.suit) ? '#a54635' : '#302b23';
      const text = (tx, ty, value, size, options = {}) => {
        const label = this.add.text(tx, ty, value, { fontFamily: 'Georgia, serif', fontSize: `${size}px`, color, ...options });
        node.add(label);
        return label;
      };
      const small = cw < 90;
      const rankSize = Math.min(31, Math.max(20, cw * 0.27));
      const footerHeight = small ? 39 : 46;
      const artTop = small ? 46 : 54;
      const artSpace = Math.max(18, cardHeight - footerHeight - artTop - 6);
      const artY = artTop + artSpace / 2;
      const tint = { diamonds: 0xe5bc60, clubs: 0xc9a16d, spades: 0xa7afa1, hearts: 0xd9ac82 }[card.suit];
      text(9, 5, card.rank, rankSize, { fontStyle: 'bold' });
      text(cw - 10, 8, suit.symbol, small ? 21 : 27).setOrigin(1, 0);
      const value = card.rank === 'A' ? '1 / 11' : String(card.value);
      text(10, Math.ceil(rankSize * 1.1) + 7, `VALUE ${value}`, small ? 7 : 8, {
        fontFamily: 'monospace', color: '#6d5c45', fontStyle: 'bold',
      });
      g.fillStyle(tint, 0.22).fillEllipse(cw / 2, artY + 1, cw * 0.72, artSpace * 0.88);
      this.drawLoot(g, card.suit, cw / 2, artY, Math.min(cw / 100, artSpace / 60), C.ink, true);
      g.fillStyle(secured ? 0xdce0c6 : 0xecddbc).fillRoundedRect(7, cardHeight - footerHeight, cw - 14, footerHeight - 6, 4);
      g.lineStyle(1, 0xbca373, 0.5).lineBetween(13, cardHeight - footerHeight, cw - 13, cardHeight - footerHeight);
      text(cw / 2, cardHeight - (small ? 26 : 30), `$${card.loot}`, small ? 22 : 28, {
        fontStyle: 'bold', color: '#302b23',
      }).setOrigin(0.5);
      text(cw / 2, cardHeight - 11, 'PRINTED LOOT', small ? 6 : 7, {
        fontFamily: 'monospace', color: '#776448', fontStyle: 'bold',
      }).setOrigin(0.5, 0);
      if (secured) {
        g.fillStyle(0x405b3d).fillRoundedRect(7, artY - 10, cw - 14, 22, 3);
        g.lineStyle(1, 0xbac593).strokeRoundedRect(7, artY - 10, cw - 14, 22, 3);
        text(cw / 2, artY - 5, 'POCKETED', small ? 8 : 10, { fontFamily: 'monospace', fontStyle: 'bold', color: '#fff0c9' }).setOrigin(0.5, 0);
      } else if (card.boosted) {
        g.fillStyle(0x405b3d).fillRoundedRect(cw - 29, artTop - 1, 23, 16, 3);
        text(cw - 17.5, artTop + 7, '×2', 10, { fontFamily: 'monospace', color: '#fff0c9', fontStyle: 'bold' }).setOrigin(0.5);
      }
      if (this.snapshot?.phase === 'playing' && !this.snapshot.pocketedId) {
        node.setInteractive(new Phaser.Geom.Rectangle(0, 0, cw, cardHeight), Phaser.Geom.Rectangle.Contains);
        node.input.cursor = 'pointer';
        node.on('pointerover', () => {
          if (!node.getData('dealing')) node.setY(y - 6);
        });
        node.on('pointerout', () => {
          if (!node.getData('dealing')) node.setY(y - (selected ? 5 : 0));
        });
        node.on('pointerdown', () => this.onSelectCard(card.id));
      }
      this.cardLayer.add(node);
      const targetY = y - (selected ? 5 : 0);
      this.cardPositions.set(card.id, { x, y: targetY, width: cw, height: cardHeight, node });
      node.setY(targetY);
      if (animate && !previousIds.has(card.id) && !this.reducedMotion) {
        const faces = [...node.list];
        faces.forEach((face) => face.setVisible(false));
        const back = this.add.graphics();
        back.fillStyle(0x3d5e4c).fillRoundedRect(0, 0, cw, cardHeight, 7);
        back.lineStyle(2, C.gold, 0.8).strokeRoundedRect(5, 5, cw - 10, cardHeight - 10, 4);
        this.drawLoot(back, 'spades', cw / 2, cardHeight / 2, cw / 90, C.gold);
        node.add(back);
        const dealY = 132 * this.tableGeometry.windowScale + this.tableGeometry.windowOffset;
        node.setPosition(w - 55, dealY).setScale(0.28, 0.68).setAngle(8).setAlpha(0.4).setData('dealing', true);
        this.tweens.add({
          targets: node, x, y: targetY, scaleX: 1, scaleY: 1, angle: 0, alpha: 1,
          duration: 370, delay: index < 2 && previousIds.size === 0 ? index * 65 : 0,
          ease: 'Cubic.Out', onComplete: () => node.setData('dealing', false),
        });
        this.tweens.add({
          targets: back, scaleX: 0, duration: 130, delay: 75,
          ease: 'Sine.In', onComplete: () => {
            faces.forEach((face) => face.setVisible(true));
            back.destroy();
          },
        });
      } else if (animate && !this.reducedMotion && previousPositions.has(card.id)) {
        const old = previousPositions.get(card.id);
        if (old.x !== x || old.y !== targetY) {
          node.setPosition(old.x, old.y);
          this.tweens.add({ targets: node, x, y: targetY, duration: 210, ease: 'Cubic.Out' });
        }
      }
    });
  }

  stopObjectTweens(object) {
    this.tweens.killTweensOf(object);
    if (object.list) for (const child of object.list) this.stopObjectTweens(child);
  }

  clearEffects() {
    if (!this.effectsLayer) return;
    for (const effect of this.effectsLayer.list) this.stopObjectTweens(effect);
    this.effectsLayer.removeAll(true);
    // CameraManager may already have shut down before the scene cleanup runs.
    this.cameras.main?.resetFX();
  }

  paintSignal() {
    if (!this.signal) return;
    const g = this.signal.clear();
    const w = this.scale.width;
    const total = this.snapshot?.hand.length ? handTotal(this.snapshot.hand) : 0;
    const color = total > 21 ? C.rust : total === 21 ? C.gold : total >= 18 ? 0xd19149 : 0x88a179;
    const pulse = this.reducedMotion ? 0.12 : 0.13 + Math.sin(this.travel * 0.25) * 0.055;
    g.fillStyle(0x283b2d, 0.95).fillRoundedRect(w - 63, 30, 26, 32, 5);
    g.lineStyle(1, C.gold, 0.65).strokeRoundedRect(w - 63, 30, 26, 32, 5);
    g.fillStyle(color, pulse).fillCircle(w - 50, 46, 15);
    g.fillStyle(color, 0.9).fillCircle(w - 50, 46, 6);
    g.fillStyle(0xffe9b6, 0.65).fillCircle(w - 52, 44, 2);
    g.fillStyle(0x283b2d, 0.9).fillRoundedRect(34, 30, 30, 34, 5);
    this.drawLoot(g, 'spades', 49, 48, 0.42, this.snapshot?.pocketedId ? C.gold : 0x9ba080);
  }

  animatePocket(id) {
    const card = this.cardPositions.get(id);
    if (!card) return;
    const x = card.x + card.width / 2;
    const y = card.y + card.height / 2;
    if (!this.reducedMotion) {
      const stamp = this.add.graphics({ x, y });
      stamp.lineStyle(3, C.gold, 0.8).strokeCircle(0, 0, card.width * 0.36);
      stamp.lineStyle(1, C.gold, 0.65).strokeCircle(0, 0, card.width * 0.29);
      this.effectsLayer.add(stamp);
      stamp.setScale(1.55).setAlpha(0);
      this.tweens.add({ targets: stamp, scale: 1, alpha: 1, duration: 180, ease: 'Back.Out',
        onComplete: () => this.tweens.add({ targets: stamp, alpha: 0, scale: 1.2, duration: 260, onComplete: () => stamp.destroy() }) });
      const pocketY = 48 * this.tableGeometry.windowScale + this.tableGeometry.windowOffset;
      this.coinBurst(x, y, 7, { x: 49, y: pocketY });
    }
    this.showBanner(`$${this.snapshot.secured.toLocaleString('en-US')} POCKETED`, C.gold, 1000);
  }

  coinBurst(x, y, count, destination = null) {
    if (this.reducedMotion) return;
    for (let i = 0; i < count; i++) {
      const coin = this.add.graphics({ x, y });
      const radius = 3 + i % 3;
      coin.fillStyle(C.gold).fillCircle(0, 0, radius);
      coin.lineStyle(1, 0xffe1a0).strokeCircle(0, 0, radius - 1);
      coin.lineStyle(1, 0x8b5b28).lineBetween(0, -radius / 2, 0, radius / 2);
      this.effectsLayer.add(coin);
      const angle = (i / count) * Math.PI * 2;
      const distance = 35 + (i % 4) * 14;
      this.tweens.add({
        targets: coin, x: x + Math.cos(angle) * distance, y: y + Math.sin(angle) * distance - 25,
        angle: i % 2 ? 120 : -120, duration: 260, delay: i * 16, ease: 'Cubic.Out',
        onComplete: () => this.tweens.add({
          targets: coin, x: destination?.x ?? coin.x + Math.cos(angle) * 25,
          y: destination?.y ?? coin.y + 75, alpha: 0, scaleX: 0.35,
          duration: destination ? 480 : 500, ease: destination ? 'Cubic.In' : 'Sine.In',
          onComplete: () => coin.destroy(),
        }),
      });
    }
  }

  showBanner(label, color = C.gold, duration = 1300) {
    if (!this.effectsLayer) return;
    // One readable announcement at a time; cosmetic feedback never blocks input.
    if (this.banner?.active) {
      this.stopObjectTweens(this.banner);
      this.banner.destroy();
    }
    const w = this.scale.width;
    const { bannerY } = this.tableGeometry;
    const banner = this.add.container(w / 2, bannerY);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Georgia, serif', fontSize: `${w < 420 ? 17 : 22}px`, fontStyle: 'bold',
      color: `#${color.toString(16).padStart(6, '0')}`, align: 'center',
      wordWrap: { width: w - 100 },
    }).setOrigin(0.5);
    const plate = this.add.graphics();
    const width = Math.min(w - 58, text.width + 38);
    const height = text.height + 20;
    plate.fillStyle(0x172b22, 0.94).fillRoundedRect(-width / 2, -height / 2, width, height, 4);
    plate.lineStyle(1, color, 0.65).strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
    banner.add([plate, text]);
    this.effectsLayer.add(banner);
    this.banner = banner;
    if (this.reducedMotion) {
      this.tweens.add({ targets: banner, alpha: 0, delay: duration, duration: 1, onComplete: () => banner.destroy() });
    } else {
      banner.setY(bannerY + 8).setAlpha(0).setScale(0.93);
      this.tweens.add({ targets: banner, y: bannerY, alpha: 1, scale: 1, duration: 200, ease: 'Back.Out' });
      this.tweens.add({ targets: banner, alpha: 0, y: bannerY - 7, delay: duration, duration: 250, onComplete: () => banner.destroy() });
    }
  }

  celebrate(kind, { amount = 0, label } = {}) {
    if (!this.effectsLayer) return;
    const cash = `$${Math.max(0, amount).toLocaleString('en-US')}`;
    const messages = {
      bust: amount > 0 ? `BUSTED · ${cash} KEPT SAFE` : 'BUSTED · THE GUARDS CAUGHT ON',
      escape: `${cash} · CLEAN GETAWAY`, perfect: `${cash} · PERFECT GETAWAY!`,
      ready: '21 · THE PERFECT MOMENT', rank: 'OUTLAW RANK UP', contract: 'CONTRACT COMPLETE',
      train: 'TRAIN CLEARED', reward: 'A WELL-EARNED REWARD',
    };
    this.showBanner(label || messages[kind] || messages.reward, kind === 'bust' ? 0xf0b09a : C.gold,
      kind === 'perfect' || kind === 'rank' ? 1900 : 1350);
    if (this.reducedMotion) return;
    const w = this.scale.width;
    const h = this.scale.height;
    if (kind === 'bust') {
      this.cameras.main.shake(230, 0.006);
      const alarm = this.add.graphics();
      alarm.lineStyle(6, C.rust, 0.8).strokeRoundedRect(4, 4, w - 8, h - 8, 6);
      this.effectsLayer.add(alarm);
      this.tweens.add({ targets: alarm, alpha: 0, duration: 550, onComplete: () => alarm.destroy() });
    } else if (kind === 'ready') {
      for (const card of this.cardPositions.values()) {
        const gleam = this.add.graphics({ x: card.x, y: card.y });
        gleam.lineStyle(2, C.gold, 0.9).strokeRoundedRect(-3, -3, card.width + 6, card.height + 6, 8);
        this.effectsLayer.add(gleam);
        this.tweens.add({ targets: gleam, alpha: 0, duration: 850, onComplete: () => gleam.destroy() });
      }
    } else {
      const big = ['perfect', 'rank', 'train'].includes(kind);
      const burstY = this.tableGeometry.compact ? (this.tableGeometry.cardsTop + h - 11) / 2 : Math.min(h - 70, 260);
      this.coinBurst(w / 2, burstY, big ? 22 : 12);
      if (big) {
        for (let i = 0; i < 9; i++) {
          const x = 40 + ((i * 83) % Math.max(1, w - 80));
          const y = this.tableGeometry.cardsTop + 7 + (i % 3) * 38;
          const star = this.add.graphics({ x, y });
          star.lineStyle(2, C.gold).lineBetween(-5, 0, 5, 0).lineBetween(0, -5, 0, 5);
          this.effectsLayer.add(star);
          star.setScale(0).setAlpha(0);
          this.tweens.add({ targets: star, scale: 1.2, alpha: 1, angle: 60, duration: 230, delay: i * 40,
            yoyo: true, hold: 100, onComplete: () => star.destroy() });
        }
      }
    }
  }

  drawCargo(g, suit, x, y, scale) {
    const outline = 0x543a29;
    const points = (vertices) => vertices.map(([px, py]) => ({ x: x + px * scale, y: y + py * scale }));
    const polygon = (vertices, fill, stroke = outline) => {
      const path = points(vertices);
      g.fillStyle(fill).fillPoints(path, true);
      g.lineStyle(1.8 * scale, stroke).strokePoints(path, true);
    };
    const rounded = (px, py, width, height, radius, fill, stroke = outline) => {
      g.fillStyle(fill).fillRoundedRect(x + px * scale, y + py * scale, width * scale, height * scale, radius * scale);
      g.lineStyle(1.8 * scale, stroke).strokeRoundedRect(x + px * scale, y + py * scale, width * scale, height * scale, radius * scale);
    };
    const line = (x1, y1, x2, y2, color = outline, width = 1.4) => {
      g.lineStyle(width * scale, color).lineBetween(x + x1 * scale, y + y1 * scale, x + x2 * scale, y + y2 * scale);
    };
    const ellipse = (px, py, width, height, fill, stroke = outline) => {
      g.fillStyle(fill).fillEllipse(x + px * scale, y + py * scale, width * scale, height * scale);
      g.lineStyle(1.6 * scale, stroke).strokeEllipse(x + px * scale, y + py * scale, width * scale, height * scale);
    };
    g.fillStyle(0x65492d, 0.15).fillEllipse(x, y + 25 * scale, 61 * scale, 8 * scale);
    if (suit === 'diamonds') {
      // Two stacked ingots and minted coins: warm highlights make gold read at a glance.
      polygon([[-28, 9], [-21, -2], [10, -2], [17, 9]], 0xf6ce64);
      polygon([[-28, 9], [17, 9], [17, 21], [-28, 21]], 0xd59a3b);
      line(-25, 12, 14, 12, 0xffe5a1);
      polygon([[-15, -7], [-9, -19], [18, -19], [25, -7]], 0xffdc7b);
      polygon([[-15, -7], [25, -7], [25, 4], [-15, 4]], 0xeab34b);
      line(-11, -3, 21, -3, 0xffe6a3);
      polygon([[-9, -19], [18, -19], [25, -7], [20, -7]], 0xe2a343);
      line(-4, -13, 8, -13, 0xb67d2d);
      ellipse(21, 17, 18, 16, 0xe6ac43);
      ellipse(20, 13, 18, 16, 0xffd26a);
      ellipse(20, 13, 11, 10, 0xefbc53, 0xba8032);
      line(20, 10, 20, 16, 0x9a652c, 1.8);
      line(-22, -22, -22, -14, 0xe1ae4c, 1.6);
      line(-26, -18, -18, -18, 0xe1ae4c, 1.6);
    } else if (suit === 'clubs') {
      // Braced planks and a darker side give the freight crate a tangible silhouette.
      polygon([[-25, -16], [-13, -24], [25, -24], [13, -16]], 0xd8ae73);
      polygon([[13, -16], [25, -24], [25, 14], [13, 23]], 0x8f603a);
      rounded(-25, -16, 38, 39, 1, 0xbd8a51);
      for (const py of [-6, 5, 15]) line(-23, py, 11, py, 0x936439);
      line(17, -13, 17, 18, 0xb08350);
      line(22, -18, 22, 14, 0xb08350);
      polygon([[-25, -16], [-19, -16], [13, 16], [13, 23], [7, 23], [-25, -9]], 0xe2b87e);
      rounded(-26, -17, 5, 41, 1, 0xd5a268);
      rounded(9, -17, 5, 41, 1, 0xd5a268);
      for (const px of [-23.5, 11.5]) for (const py of [-12, 18]) {
        g.fillStyle(0x63452f).fillCircle(x + px * scale, y + py * scale, 1.2 * scale);
      }
      line(-15, 11, -7, 11, 0x795133);
      line(-12, 15, -3, 15, 0x795133);
    } else if (suit === 'hearts') {
      // A trail ration satchel, bread, and a corked canteen distinguish provisions.
      rounded(-27, -6, 34, 27, 5, 0xbe824e);
      rounded(-29, -10, 37, 11, 4, 0xe0b37b);
      rounded(-16, -11, 7, 33, 1, 0x85593c);
      rounded(-16, 2, 7, 8, 1, 0xd5b16b);
      line(-12.5, 4, -12.5, 8, 0x6c4c32);
      ellipse(-14, -15, 28, 13, 0xe7bb76);
      for (const px of [-20, -13, -6]) line(px - 1, -18, px + 1, -13, 0xb27b43);
      polygon([[7, -18], [17, -18], [17, -9], [24, -5], [27, 2], [27, 17], [23, 23], [2, 23], [-2, 17], [-2, 2], [1, -5], [7, -9]], 0x668473);
      rounded(6, -24, 12, 8, 2, 0xc9a36c);
      rounded(1, 0, 24, 16, 4, 0x8ca18a);
      line(5, 1, 5, 13, 0xc3d0ac, 2);
      line(22, -3, 22, 17, 0x476557, 1.5);
    } else {
      // Contraband travels in a dark canvas sack sealed with red wax.
      polygon([[-12, -13], [-16, -26], [-7, -24], [0, -28], [7, -24], [15, -26], [12, -13]], 0x7e8b83);
      ellipse(0, 5, 45, 43, 0x66776c);
      g.fillStyle(0x829486, 0.8).fillEllipse(x - 7 * scale, y + 2 * scale, 17 * scale, 30 * scale);
      line(-8, -23, -5, -15, 0x526358);
      line(7, -23, 4, -15, 0x526358);
      line(-14, -12, 13, -12, 0xd5b47d, 3);
      line(-14, -8, 13, -8, 0xe4c590, 2);
      line(9, -9, 18, 0, 0xd5b47d, 2);
      line(11, -9, 21, -7, 0xd5b47d, 2);
      ellipse(2, 8, 18, 18, 0xac503c);
      ellipse(2, 8, 11, 11, 0xc46b4e, 0x8b3f30);
      line(-1, 5, 5, 11, 0xf0be85, 1.6);
      line(5, 5, -1, 11, 0xf0be85, 1.6);
      line(-14, 15, -9, 20, 0x4d6054);
      line(13, 14, 10, 20, 0x4d6054);
    }
  }

  drawLoot(g, suit, x, y, scale, color, illustrated = false) {
    if (illustrated) {
      this.drawCargo(g, suit, x, y, scale);
      return;
    }
    g.lineStyle(2 * scale, color, 0.8);
    g.fillStyle(color, 0.12);
    if (suit === 'diamonds') {
      g.fillPoints([{ x: x - 25 * scale, y: y + 12 * scale }, { x: x - 16 * scale, y: y - 9 * scale },
        { x: x + 13 * scale, y: y - 9 * scale }, { x: x + 25 * scale, y: y + 12 * scale }], true);
      g.strokePoints([{ x: x - 25 * scale, y: y + 12 * scale }, { x: x - 16 * scale, y: y - 9 * scale },
        { x: x + 13 * scale, y: y - 9 * scale }, { x: x + 25 * scale, y: y + 12 * scale }], true);
      g.lineBetween(x - 8 * scale, y - 9 * scale, x - 14 * scale, y + 12 * scale);
      g.lineBetween(x + 7 * scale, y - 9 * scale, x + 15 * scale, y + 12 * scale);
    } else if (suit === 'clubs') {
      g.strokeRect(x - 21 * scale, y - 17 * scale, 42 * scale, 34 * scale);
      g.lineBetween(x - 21 * scale, y - 17 * scale, x + 21 * scale, y + 17 * scale);
      g.lineBetween(x + 21 * scale, y - 17 * scale, x - 21 * scale, y + 17 * scale);
      g.strokeRect(x - 15 * scale, y - 11 * scale, 30 * scale, 22 * scale);
    } else if (suit === 'hearts') {
      g.fillRoundedRect(x - 20 * scale, y - 13 * scale, 40 * scale, 31 * scale, 5 * scale);
      g.strokeRoundedRect(x - 20 * scale, y - 13 * scale, 40 * scale, 31 * scale, 5 * scale);
      g.strokeRect(x - 10 * scale, y - 21 * scale, 20 * scale, 8 * scale);
      g.lineBetween(x - 20 * scale, y - 3 * scale, x + 20 * scale, y - 3 * scale);
      g.lineBetween(x, y - 5 * scale, x, y + 5 * scale);
    } else {
      g.fillCircle(x, y + 3 * scale, 21 * scale);
      g.strokeCircle(x, y + 3 * scale, 21 * scale);
      g.lineBetween(x - 12 * scale, y - 14 * scale, x - 7 * scale, y - 24 * scale);
      g.lineBetween(x - 7 * scale, y - 24 * scale, x + 7 * scale, y - 24 * scale);
      g.lineBetween(x + 7 * scale, y - 24 * scale, x + 12 * scale, y - 14 * scale);
      g.lineBetween(x - 12 * scale, y - 14 * scale, x + 12 * scale, y - 14 * scale);
      g.lineBetween(x - 6 * scale, y + 2 * scale, x + 6 * scale, y + 2 * scale);
      g.lineBetween(x, y - 5 * scale, x, y + 10 * scale);
    }
  }
}

export function mountGame(onSelect, onReady) {
  const parent = document.querySelector('#game-table');
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#244238',
    // The observer below skips hidden boards, avoiding zero-size WebGL framebuffers on quit.
    scale: { mode: Phaser.Scale.NONE, width: parent.clientWidth, height: parent.clientHeight },
    scene: new HeistScene(onSelect, onReady),
    render: { antialias: true, pixelArt: false },
    audio: { noAudio: true },
    banner: false,
  });
  const observer = new ResizeObserver(() => {
    if (parent.clientWidth > 0 && parent.clientHeight > 0) game.scale.resize(parent.clientWidth, parent.clientHeight);
  });
  observer.observe(parent);
  game.events.once('destroy', () => observer.disconnect());
  return game;
}
