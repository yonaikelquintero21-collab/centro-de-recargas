/**
 * Cyber TV Robot Cursor Companion
 * Biblioteca interactiva autónoma: convierte la imagen en un robot 3D que sigue el cursor.
 * Cero dependencias externas.
 */

(function () {
  if (typeof window === 'undefined') return;

  // Solo activar en dispositivos con puntero (ratón / trackpad)
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!hasFinePointer) return;

  const EYE_COLORS = {
    cyan: { primary: '#38bdf8', glow: 'rgba(56, 189, 248, 0.85)', label: 'Cian Cibernético' },
    lime: { primary: '#bcff48', glow: 'rgba(188, 255, 72, 0.85)', label: 'Verde Neón' },
    purple: { primary: '#c084fc', glow: 'rgba(192, 132, 252, 0.85)', label: 'Púrpura' },
    gold: { primary: '#fbbf24', glow: 'rgba(251, 191, 36, 0.85)', label: 'Oro Estelar' },
    white: { primary: '#ffffff', glow: 'rgba(255, 255, 255, 0.95)', label: 'Blanco Puro' }
  };

  const state = {
    enabled: true,
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    vx: 0,
    vy: 0,
    tiltX: 0,
    tiltY: 0,
    tiltZ: 0,
    mode: 'companion', // 'companion' | 'cursor'
    audio: false,
    colorKey: 'cyan',
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.85)',
    isMouseDown: false,
    isHovering: false,
    speechTimer: 180,
    speechText: '¡Sistemas Online! 🚀'
  };

  const particles = [];
  let audioCtx = null;

  // Síntesis de audio con Web Audio API
  function playAudio(type) {
    if (!state.audio) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'beep') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'chirp') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(720, now + 0.05);
        osc.frequency.setValueAtTime(1020, now + 0.1);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'hover') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(1100, now + 0.06);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'transform') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.35);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // Creación de elementos DOM
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    #robot-companion-root {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 999999;
      overflow: hidden;
    }
    #robot-companion-canvas {
      position: absolute;
      inset: 0;
      pointer-events: none;
      mix-blend-mode: screen;
    }
    #robot-companion-avatar {
      position: absolute;
      top: 0;
      left: 0;
      width: 96px;
      height: 96px;
      transform-origin: center center;
      will-change: transform;
      filter: drop-shadow(0 14px 28px rgba(0,0,0,0.7));
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    .rc-speech {
      position: absolute;
      top: -34px;
      left: 50%;
      transform: translateX(-50%);
      white-space: nowrap;
      background: rgba(10, 12, 16, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      font-size: 11px;
      padding: 3px 9px;
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(8px);
      transition: opacity 0.2s, transform 0.2s;
    }
    .rc-speech::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
      width: 7px;
      height: 7px;
      background: rgba(10, 12, 16, 0.9);
      border-right: 1px solid rgba(255, 255, 255, 0.2);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }
    .rc-reticle {
      position: absolute;
      inset: -6px;
      border: 1px dashed var(--rc-color, #38bdf8);
      border-radius: 14px;
      opacity: 0;
      transform: scale(0.85);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .rc-reticle.active {
      opacity: 1;
      transform: scale(1.08) rotate(45deg);
    }
    .rc-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 0 16px var(--rc-glow, rgba(56,189,248,0.85)));
      user-select: none;
    }
    .rc-eye {
      position: absolute;
      top: 36%;
      width: 19px;
      height: 19px;
      background-color: var(--rc-color, #38bdf8);
      border-radius: 50%;
      box-shadow: 0 0 14px 4px var(--rc-glow, rgba(56,189,248,0.85)), inset 0 0 6px #ffffff;
      opacity: 0.92;
      transition: height 0.1s, border-radius 0.15s;
    }
    .rc-eye.left { left: 30%; }
    .rc-eye.right { right: 30%; }
    .rc-eye.blink { height: 2px !important; border-radius: 2px !important; }
    .rc-eye.happy { height: 11px !important; border-radius: 10px 10px 0 0 !important; }
    .rc-scanlines {
      position: absolute;
      top: 15%;
      left: 20%;
      right: 20%;
      bottom: 24%;
      background: repeating-linear-gradient(0deg, rgba(0,0,0,0.6) 0px, transparent 2px, transparent 4px);
      pointer-events: none;
      opacity: 0.25;
      border-radius: 6px;
    }
    .rc-thrusters {
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 26px;
      pointer-events: none;
    }
    .rc-thruster {
      width: 7px;
      height: 20px;
      background: linear-gradient(to bottom, #ffffff, var(--rc-color, #38bdf8), transparent);
      border-radius: 50%;
      filter: blur(1px);
      animation: rcThrusterPulse 0.14s infinite alternate;
      box-shadow: 0 0 10px var(--rc-glow, rgba(56,189,248,0.85));
    }
    @keyframes rcThrusterPulse {
      0% { transform: scaleY(0.85); opacity: 0.8; }
      100% { transform: scaleY(1.3); opacity: 1; }
    }
  `;
  document.head.appendChild(styleEl);

  const rootEl = document.createElement('div');
  rootEl.id = 'robot-companion-root';
  rootEl.innerHTML = `
    <canvas id="robot-companion-canvas"></canvas>
    <div id="robot-companion-avatar">
      <div id="rc-speech-el" class="rc-speech">¡Sistemas Online! 🚀</div>
      <div id="rc-reticle-el" class="rc-reticle"></div>
      <div style="position: relative; width: 100%; height: 100%;">
        <img src="robot-head.png" alt="Robot TV" class="rc-img" />
        <div id="rc-eye-l" class="rc-eye left"></div>
        <div id="rc-eye-r" class="rc-eye right"></div>
        <div class="rc-scanlines"></div>
        <div class="rc-thrusters">
          <div class="rc-thruster"></div>
          <div class="rc-thruster"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(rootEl);

  const canvas = document.getElementById('robot-companion-canvas');
  const ctx = canvas.getContext('2d');
  const avatar = document.getElementById('robot-companion-avatar');
  const speechEl = document.getElementById('rc-speech-el');
  const reticleEl = document.getElementById('rc-reticle-el');
  const eyeL = document.getElementById('rc-eye-l');
  const eyeR = document.getElementById('rc-eye-r');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  function updateColor(key) {
    if (!EYE_COLORS[key]) return;
    state.colorKey = key;
    state.color = EYE_COLORS[key].primary;
    state.glow = EYE_COLORS[key].glow;
    avatar.style.setProperty('--rc-color', state.color);
    avatar.style.setProperty('--rc-glow', state.glow);
  }
  updateColor('cyan');

  function speak(text) {
    state.speechText = text;
    state.speechTimer = 200;
    speechEl.innerText = text;
    speechEl.style.opacity = '1';
    playAudio('beep');
  }

  function spawnSparks(count, spd) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const s = Math.random() * spd + 1.5;
      particles.push({
        x: state.x,
        y: state.y + 35,
        vx: Math.cos(angle) * s,
        vy: Math.sin(angle) * s,
        size: Math.random() * 3.5 + 1.2,
        alpha: 1,
        decay: 0.035,
        color: i % 2 === 0 ? state.color : '#ffffff'
      });
    }
  }

  function triggerTransform() {
    playAudio('transform');
    speak('¡HIPERPROPULSIÓN ⚡!');
    avatar.style.transition = 'transform 0.15s ease';
    spawnSparks(40, 8);
    setTimeout(() => {
      avatar.style.transition = '';
    }, 400);
  }

  // Eventos de ratón
  window.addEventListener('mousemove', (e) => {
    state.targetX = e.clientX;
    state.targetY = e.clientY;
    avatar.style.opacity = '1';

    const target = e.target;
    const isInteractable = !!target.closest('a, button, input, select, textarea, [role="button"], .interactive');
    if (isInteractable !== state.isHovering) {
      state.isHovering = isInteractable;
      reticleEl.classList.toggle('active', isInteractable);
      if (isInteractable) playAudio('hover');
    }
  }, { passive: true });

  window.addEventListener('mousedown', () => {
    state.isMouseDown = true;
    eyeL.classList.add('happy');
    eyeR.classList.add('happy');
    playAudio('beep');
    spawnSparks(16, 4.5);
  });

  window.addEventListener('mouseup', () => {
    state.isMouseDown = false;
    setTimeout(() => {
      eyeL.classList.remove('happy');
      eyeR.classList.remove('happy');
    }, 320);
  });

  // Bucle de física e inercia 3D
  let blinkCounter = 0;

  function loop(currentTime) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state.enabled) {
      const ease = state.mode === 'cursor' ? 0.42 : 0.16;
      const dx = state.targetX - state.x;
      const dy = state.targetY - state.y;

      state.vx = dx * ease;
      state.vy = dy * ease;
      state.x += state.vx;
      state.y += state.vy;

      const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);

      // Inclinación 3D
      const targetTiltX = Math.max(-28, Math.min(28, -state.vy * 0.95));
      const targetTiltY = Math.max(-32, Math.min(32, state.vx * 1.15));
      const targetTiltZ = Math.max(-18, Math.min(18, state.vx * 0.45));

      state.tiltX += (targetTiltX - state.tiltX) * 0.2;
      state.tiltY += (targetTiltY - state.tiltY) * 0.2;
      state.tiltZ += (targetTiltZ - state.tiltZ) * 0.2;

      const hoverBob = Math.sin(currentTime * 0.0035) * 5;
      const renderX = state.mode === 'cursor' ? state.x + 16 : state.x + 36;
      const renderY = state.mode === 'cursor' ? state.y + 16 : state.y - 18 + hoverBob;

      const scale = state.isMouseDown ? 0.92 : 1.0;
      avatar.style.transform = `translate3d(${renderX}px, ${renderY}px, 0px) translate(-50%, -50%) perspective(800px) rotateX(${state.tiltX}deg) rotateY(${state.tiltY}deg) rotateZ(${state.tiltZ}deg) scale(${scale})`;

      // Propulsores
      if (speed > 1.2 || Math.random() < 0.4) {
        particles.push({
          x: renderX - 16 + (Math.random() - 0.5) * 5,
          y: renderY + 42,
          vx: -(state.vx * 0.2) + (Math.random() - 0.5) * 1.2,
          vy: Math.random() * 2.8 + 1.8,
          size: Math.random() * 3 + 1,
          alpha: 0.75,
          decay: 0.035,
          color: state.color
        });
        particles.push({
          x: renderX + 16 + (Math.random() - 0.5) * 5,
          y: renderY + 42,
          vx: -(state.vx * 0.2) + (Math.random() - 0.5) * 1.2,
          vy: Math.random() * 2.8 + 1.8,
          size: Math.random() * 3 + 1,
          alpha: 0.75,
          decay: 0.035,
          color: state.color
        });
      }

      // Parpadeo
      blinkCounter++;
      if (blinkCounter > 240) {
        eyeL.classList.add('blink');
        eyeR.classList.add('blink');
        setTimeout(() => {
          eyeL.classList.remove('blink');
          eyeR.classList.remove('blink');
        }, 160);
        blinkCounter = 0;
      }

      // Diálogo
      if (state.speechTimer > 0) {
        state.speechTimer--;
        if (state.speechTimer === 0) {
          speechEl.style.opacity = '0';
        }
      }

      // Dibujar partículas
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      }
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

  // Exponer API global
  window.RobotCursor = {
    speak,
    triggerTransform,
    setTheme: updateColor,
    toggleSound: () => {
      state.audio = !state.audio;
      if (state.audio) playAudio('chirp');
      return state.audio;
    },
    setMode: (m) => {
      state.mode = m === 'cursor' ? 'cursor' : 'companion';
      speak(state.mode === 'companion' ? 'Modo Dron 🛸' : 'Modo Puntero 🎯');
    },
    toggle: () => {
      state.enabled = !state.enabled;
      avatar.style.opacity = state.enabled ? '1' : '0';
      return state.enabled;
    }
  };
})();
