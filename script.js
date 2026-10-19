/**
 * ==========================================================================
 * 1. CONFIGURATION
 * --------------------------------------------------------------------------
 * Swap any string, template, color, sound, or copy in one convenient place!
 * Supports URL query overrides:
 *   - ?thing=co-founder
 *   - ?name=Alex
 *   - ?sound=0
 * ==========================================================================
 */
const CONFIG = {
  // Recipient name (e.g., "Sarah"). If set, displays "Hey {name}," above the question
  recipientName: "",

  // Question template with placeholder for {thing}
  questionTemplate: "Will you be my {thing}?",

  // Default thing: "crush" | "friend" | "co-founder" | "snack buddy" | anything!
  thing: "crush",

  // Button labels
  yesLabel: "Yes",
  noLabel: "No",

  // Default audio state
  soundOn: true,

  // Escalation text for the "No" button on each click/escape attempt
  noTexts: [
    "No",
    "Are you sure?",
    "Think again!",
    "You're breaking my heart! 💔",
    "I'm gonna cry...",
    "Please? 🥺",
    "The button is getting tired...",
    "This is your last chance",
    "No doesn't work anymore",
    "Fine, I'll just say yes for you"
  ],

  // Punchline label when converted to second Yes button on final step
  convertedYesLabel: "Yes! (Okay fine 💖)",

  // Celebratory headlines picked at random when Yes is clicked
  celebrationHeadlines: [
    "YAY!!! 💖",
    "I KNEW IT! 🥰",
    "BEST DECISION EVER! 🎉",
    "OFFICIALLY LOCKED IN! ✨"
  ],

  // Celebratory subtitles
  celebrationSubtitles: [
    "There was never really another option anyway 😉",
    "You just made the absolute right choice!",
    "My heart is literally doing happy backflips right now!",
    "Cue the happiest celebration on the internet! 🥳"
  ],

  celebrationEmojis: ["💖", "🎉", "🥰", "🥳", "💍", "✨"],

  // Optional external sound URLs. If empty or if loading fails, the page
  // seamlessly falls back to the built-in Web Audio API synthesizer!
  soundUrls: {
    boing: "",
    bruh: "",
    vineBoom: "",
    sadViolin: "",
    airhorn: "",
    dramaticGasp: "",
    confettiPop: "",
    successChime: ""
  }
};

/**
 * Parse URL query parameters to allow custom sharing links:
 * e.g., ?thing=snack+buddy&name=Jessica
 */
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has("thing")) {
  CONFIG.thing = urlParams.get("thing").trim();
}
if (urlParams.has("name")) {
  CONFIG.recipientName = urlParams.get("name").trim();
}
if (urlParams.has("sound")) {
  CONFIG.soundOn = urlParams.get("sound") !== "0" && urlParams.get("sound") !== "false";
}

/**
 * ==========================================================================
 * 2. STATE MANAGEMENT
 * ==========================================================================
 */
const STATE = {
  noCount: 0,
  isMuted: false,
  isDarkMode: false,
  isCelebrated: false,
  btnNoPos: { x: 0, y: 0, rot: 0 },
  audioCtx: null,
  prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
};

// Load persisted preferences
try {
  const savedMute = localStorage.getItem("crush_proposal_muted");
  if (savedMute !== null) {
    STATE.isMuted = JSON.parse(savedMute);
  } else {
    STATE.isMuted = !CONFIG.soundOn;
  }

  const savedTheme = localStorage.getItem("crush_proposal_theme");
  if (savedTheme === "dark") {
    STATE.isDarkMode = true;
  }
} catch (e) {
  // LocalStorage access may fail in strict iframes
  STATE.isMuted = !CONFIG.soundOn;
}

/**
 * ==========================================================================
 * 3. SOUND SYNTHESIS & AUDIO SYSTEM (Zero External Assets Required!)
 * ==========================================================================
 */
const SOUNDS = {
  // Queue of meme sounds to cycle through on No clicks
  sequence: ["boing", "bruh", "vineBoom", "sadViolin", "airhorn", "dramaticGasp"],
  lastIndex: -1,

  /**
   * Safe initializer: resumes AudioContext on user gesture to obey browser autoplay policy
   */
  initContext() {
    if (!STATE.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        STATE.audioCtx = new AudioContextClass();
      }
    }
    if (STATE.audioCtx && STATE.audioCtx.state === "suspended") {
      STATE.audioCtx.resume().catch(() => {});
    }
  },

  /**
   * Play sound with priority: external URL audio -> Web Audio synth fallback
   */
  play(soundName) {
    if (STATE.isMuted) return;
    this.initContext();

    // 1. Try external audio URL if provided
    const url = CONFIG.soundUrls[soundName];
    if (url) {
      try {
        const audio = new Audio(url);
        audio.play().catch(() => {
          // Fallback to synth if external file fails
          this.synth(soundName);
        });
        return;
      } catch (e) {
        // Fall through to synth
      }
    }

    // 2. Play Web Audio API synthesized version
    this.synth(soundName);
  },

  /**
   * High-fidelity Web Audio API sound synthesizers for popular meme sounds
   */
  synth(name) {
    if (!STATE.audioCtx) return;
    const ctx = STATE.audioCtx;
    const now = ctx.currentTime;

    try {
      switch (name) {
        case "boing": {
          // Classic cartoon boing: sine pitch ramp up with spring vibrato
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(680, now + 0.22);
          osc.frequency.exponentialRampToValueAtTime(420, now + 0.38);

          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.45);
          break;
        }

        case "bruh": {
          // Low vocal-like dual oscillator slide down
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();

          osc1.type = "sawtooth";
          osc2.type = "triangle";
          osc1.frequency.setValueAtTime(125, now);
          osc1.frequency.exponentialRampToValueAtTime(75, now + 0.45);
          osc2.frequency.setValueAtTime(128, now);
          osc2.frequency.exponentialRampToValueAtTime(73, now + 0.45);

          filter.type = "bandpass";
          filter.frequency.setValueAtTime(550, now);
          filter.Q.setValueAtTime(3.5, now);

          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.52);
          osc2.stop(now + 0.52);
          break;
        }

        case "vineBoom": {
          // Deep sub-bass punch with low-end rumble
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(95, now);
          osc.frequency.exponentialRampToValueAtTime(28, now + 0.55);

          // Add noise transient for the slap punch
          const bufferSize = ctx.sampleRate * 0.15;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
          }
          const noiseSource = ctx.createBufferSource();
          noiseSource.buffer = buffer;
          const noiseFilter = ctx.createBiquadFilter();
          noiseFilter.type = "lowpass";
          noiseFilter.frequency.setValueAtTime(180, now);

          gain.gain.setValueAtTime(0.7, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

          osc.connect(gain);
          noiseSource.connect(noiseFilter);
          noiseFilter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          noiseSource.start(now);
          osc.stop(now + 0.7);
          noiseSource.stop(now + 0.2);
          break;
        }

        case "sadViolin": {
          // Mournful sliding violin phrase with slow vibrato
          const notes = [440, 415, 392]; // A4 -> G#4 -> G4
          notes.forEach((freq, i) => {
            const noteTime = now + i * 0.22;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(freq, noteTime);

            // subtle vibrato
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.frequency.setValueAtTime(5.5, noteTime);
            lfoGain.gain.setValueAtTime(4, noteTime);
            lfo.connect(osc.frequency);
            lfo.start(noteTime);
            lfo.stop(noteTime + 0.25);

            gain.gain.setValueAtTime(0.01, noteTime);
            gain.gain.linearRampToValueAtTime(0.18, noteTime + 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.24);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(noteTime);
            osc.stop(noteTime + 0.25);
          });
          break;
        }

        case "airhorn": {
          // Reggaeton airhorn chords (three rapid beeps)
          const beeps = [0, 0.11, 0.22];
          const freqs = [466.16, 554.37, 622.25]; // Bb4, C#5, Eb5
          beeps.forEach(offset => {
            freqs.forEach(freq => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "sawtooth";
              osc.frequency.setValueAtTime(freq, now + offset);

              gain.gain.setValueAtTime(0.12, now + offset);
              gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);

              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(now + offset);
              osc.stop(now + offset + 0.1);
            });
          });
          break;
        }

        case "dramaticGasp": {
          // Inward rushing breath noise sweep
          const bufferSize = ctx.sampleRate * 0.35;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
          }
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;

          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(300, now);
          filter.frequency.exponentialRampToValueAtTime(1400, now + 0.3);
          filter.Q.setValueAtTime(4.0, now);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.35, now + 0.25);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          noise.start(now);
          noise.stop(now + 0.36);
          break;
        }

        case "confettiPop": {
          // Crisp pop followed by sparkle chime
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.16);
          break;
        }

        case "successChime": {
          // Harmonious victory arpeggio: C5 - E5 - G5 - C6
          const chord = [523.25, 659.25, 783.99, 1046.50];
          chord.forEach((freq, idx) => {
            const noteTime = now + idx * 0.08;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, noteTime);

            gain.gain.setValueAtTime(0.2, noteTime);
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.6);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(noteTime);
            osc.stop(noteTime + 0.65);
          });
          break;
        }
      }
    } catch (err) {
      console.warn("Audio synth warning:", err);
    }
  },

  /**
   * Play the next meme sound in rotation for No clicks
   */
  playNextNoSound() {
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * this.sequence.length);
    } while (nextIdx === this.lastIndex && this.sequence.length > 1);

    this.lastIndex = nextIdx;
    this.play(this.sequence[nextIdx]);
  }
};

/**
 * ==========================================================================
 * 4. "NO" BUTTON BEHAVIOR: RUN AWAY, SHRINK, TEXT ESCALATION
 * ==========================================================================
 */
const NO_BUTTON = {
  el: null,

  init() {
    this.el = document.getElementById("noBtn");
    this.updateText();

    // Click and mobile touch events
    this.el.addEventListener("click", (e) => this.handleClick(e));
    this.el.addEventListener("pointerdown", (e) => {
      SOUNDS.initContext();
      // Flee immediately on pointerdown on mobile
      if (e.pointerType === "touch" && STATE.noCount >= 3) {
        this.runAway();
      }
    });

    // Past ~8 clicks: flee on hover/pointerenter without needing a click
    this.el.addEventListener("pointerenter", () => {
      if (STATE.noCount >= 8 && !this.isConverted()) {
        this.runAway();
      }
    });

    // Re-clamp position on window resize to never get lost off-screen
    window.addEventListener("resize", () => {
      this.clampCurrentPosition();
    });
  },

  isConverted() {
    return STATE.noCount >= CONFIG.noTexts.length - 1;
  },

  handleClick(e) {
    SOUNDS.initContext();

    // Punchline check: if it's already turned into the second Yes button
    if (this.isConverted()) {
      YES_BUTTON.handleYes();
      return;
    }

    STATE.noCount++;
    this.updateText();
    this.runAway();
    this.applyEffects();
    YES_BUTTON.grow();
    SOUNDS.playNextNoSound();

    // Announce for screen readers
    this.announce();
  },

  updateText() {
    const idx = Math.min(STATE.noCount, CONFIG.noTexts.length - 1);
    const text = CONFIG.noTexts[idx];

    // Final punchline conversion
    if (this.isConverted()) {
      this.el.textContent = CONFIG.convertedYesLabel;
      this.el.classList.add("as-yes");
      this.el.setAttribute("aria-label", "Yes! Converted from No button");
    } else {
      this.el.textContent = text;
    }

    // Counter hint under buttons
    const hintEl = document.getElementById("counterHint");
    if (STATE.noCount > 0 && !this.isConverted()) {
      hintEl.textContent = `Escape attempts: ${STATE.noCount} 🏃💨`;
    } else if (this.isConverted()) {
      hintEl.textContent = "Resistance is futile! ✨";
    }
  },

  /**
   * Calculates a safe new jump position within ±(40-120px)
   * CRITICAL: Clamps bounding rect so it remains within viewport with 16px padding
   */
  runAway() {
    if (STATE.prefersReducedMotion) return;

    // Random jump step between 40px and 120px in random directions
    const distance = 40 + Math.random() * 80;
    const angle = Math.random() * Math.PI * 2;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    let targetX = STATE.btnNoPos.x + dx;
    let targetY = STATE.btnNoPos.y + dy;

    // Clamp target position based on viewport bounds
    const clamped = this.clampCoordinates(targetX, targetY);
    STATE.btnNoPos.x = clamped.x;
    STATE.btnNoPos.y = clamped.y;

    // Random rotation within ±15 degrees
    STATE.btnNoPos.rot = (Math.random() * 30 - 15);

    this.applyTransforms();
  },

  clampCoordinates(candidateX, candidateY) {
    const margin = 16;
    const rect = this.el.getBoundingClientRect();

    // Current offset difference from base layout
    const currentLeft = rect.left;
    const currentTop = rect.top;
    const w = rect.width;
    const h = rect.height;

    // Compute where the button would land on screen
    const deltaX = candidateX - STATE.btnNoPos.x;
    const deltaY = candidateY - STATE.btnNoPos.y;

    let projectedLeft = currentLeft + deltaX;
    let projectedTop = currentTop + deltaY;
    let projectedRight = projectedLeft + w;
    let projectedBottom = projectedTop + h;

    let adjustedX = candidateX;
    let adjustedY = candidateY;

    // Viewport boundaries
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (projectedLeft < margin) {
      adjustedX += (margin - projectedLeft);
    } else if (projectedRight > vw - margin) {
      adjustedX -= (projectedRight - (vw - margin));
    }

    if (projectedTop < margin) {
      adjustedY += (margin - projectedTop);
    } else if (projectedBottom > vh - margin) {
      adjustedX -= (projectedBottom - (vh - margin));
    }

    return { x: adjustedX, y: adjustedY };
  },

  clampCurrentPosition() {
    const clamped = this.clampCoordinates(STATE.btnNoPos.x, STATE.btnNoPos.y);
    STATE.btnNoPos.x = clamped.x;
    STATE.btnNoPos.y = clamped.y;
    this.applyTransforms();
  },

  applyTransforms() {
    const scale = Math.max(0.35, 1 - 0.08 * STATE.noCount);

    this.el.style.setProperty("--no-tx", `${STATE.btnNoPos.x}px`);
    this.el.style.setProperty("--no-ty", `${STATE.btnNoPos.y}px`);
    this.el.style.setProperty("--no-scale", scale);
    this.el.style.setProperty("--no-rot", `${STATE.btnNoPos.rot}deg`);

    this.el.style.transform = `translate(${STATE.btnNoPos.x}px, ${STATE.btnNoPos.y}px) scale(${scale}) rotate(${STATE.btnNoPos.rot}deg)`;
  },

  applyEffects() {
    // Opacity degradation past ~5 clicks ("fading in shame")
    if (STATE.noCount >= 5 && !this.isConverted()) {
      const opacity = Math.max(0.55, 1 - 0.07 * (STATE.noCount - 5));
      this.el.style.opacity = opacity;
    } else if (this.isConverted()) {
      this.el.style.opacity = 1;
    }

    // Trigger wobble animation without stacking issues
    this.el.classList.remove("wobble");
    // Force reflow to restart CSS animation cleanly
    void this.el.offsetWidth;
    if (!STATE.prefersReducedMotion) {
      this.el.classList.add("wobble");
    }
  },

  announce() {
    const announceEl = document.getElementById("srAnnounce");
    const idx = Math.min(STATE.noCount, CONFIG.noTexts.length - 1);
    announceEl.textContent = `No button changed to: ${CONFIG.noTexts[idx]}. Scale reduced.`;
  },

  reset() {
    STATE.btnNoPos = { x: 0, y: 0, rot: 0 };
    this.el.style.transform = "";
    this.el.style.opacity = "";
    this.el.classList.remove("as-yes", "wobble");
    this.updateText();
  }
};

/**
 * ==========================================================================
 * 5. "YES" BUTTON BEHAVIOR: GROW, HEARTBEAT ACCELERATION, CELEBRATION
 * ==========================================================================
 */
const YES_BUTTON = {
  el: null,

  init() {
    this.el = document.getElementById("yesBtn");
    this.el.textContent = CONFIG.yesLabel;
    this.el.addEventListener("click", () => this.handleYes());
  },

  grow() {
    // Scale grows with every No click: min(1 + 0.15 * noCount, 2.2)
    const scale = Math.min(1 + 0.15 * STATE.noCount, 2.2);
    this.el.style.setProperty("--yes-scale", scale);

    // Speed up heartbeat pulse with noCount
    const pulseSpeed = Math.max(0.65, 1.5 - STATE.noCount * 0.08);
    this.el.style.animationDuration = `${pulseSpeed}s`;

    // Shift glow and box shadow toward hot pink & gold
    const glowSpread = Math.min(25 + STATE.noCount * 6, 65);
    this.el.style.boxShadow = `0 ${8 + STATE.noCount}px ${24 + STATE.noCount * 4}px rgba(244, 63, 94, 0.45), 0 0 ${glowSpread}px rgba(255, 42, 109, ${Math.min(0.3 + STATE.noCount * 0.08, 0.85)})`;
  },

  handleYes() {
    if (STATE.isCelebrated) return;
    STATE.isCelebrated = true;
    SOUNDS.initContext();

    // Play double celebratory sounds: Pop + Airhorn & Success Chime!
    SOUNDS.play("confettiPop");
    setTimeout(() => SOUNDS.play("airhorn"), 150);
    setTimeout(() => SOUNDS.play("successChime"), 450);

    // Trigger confetti particle system
    CONFETTI.burst();

    // Switch card to celebration state
    document.getElementById("proposalView").style.display = "none";
    const celebView = document.getElementById("celebrationView");
    celebView.style.display = "block";
    celebView.setAttribute("aria-hidden", "false");

    // Pick random celebration headline and subtitle
    const hIdx = Math.floor(Math.random() * CONFIG.celebrationHeadlines.length);
    const sIdx = Math.floor(Math.random() * CONFIG.celebrationSubtitles.length);
    const eIdx = Math.floor(Math.random() * CONFIG.celebrationEmojis.length);

    document.getElementById("celebrationTitle").textContent = CONFIG.celebrationHeadlines[hIdx];
    document.getElementById("celebrationSubtitle").textContent = CONFIG.celebrationSubtitles[sIdx];
    document.getElementById("celebrationEmoji").textContent = CONFIG.celebrationEmojis[eIdx];

    // Announce for screen readers
    const announceEl = document.getElementById("srAnnounce");
    announceEl.textContent = `Yes accepted! ${CONFIG.celebrationHeadlines[hIdx]} ${CONFIG.celebrationSubtitles[sIdx]}`;
  },

  reset() {
    this.el.style.setProperty("--yes-scale", 1);
    this.el.style.animationDuration = "1.5s";
    this.el.style.boxShadow = "";
  }
};

/**
 * ==========================================================================
 * 6. CONFETTI & AMBIENT FLOATING HEARTS (Lightweight Canvas Particle Systems)
 * ==========================================================================
 */
const CONFETTI = {
  canvas: null,
  ctx: null,
  particles: [],
  animId: null,

  init() {
    this.canvas = document.getElementById("confettiCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => this.resize());
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  burst() {
    this.particles = [];
    const count = STATE.prefersReducedMotion ? 40 : 130;
    const colors = ["#ff2a6d", "#f43f5e", "#ec4899", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#fbbf24"];
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 12;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3.5, // bias upwards
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() * 12 - 6),
        gravity: 0.22,
        drag: 0.985,
        alpha: 1,
        fade: 0.007 + Math.random() * 0.008,
        shape: Math.random() > 0.4 ? "rect" : "heart"
      });
    }

    if (!this.animId) {
      this.loop();
    }
  },

  drawHeart(ctx, x, y, size) {
    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(x, y + topCurveHeight);
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
    ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 2, x, y + size);
    ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 2, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
    ctx.closePath();
    ctx.fill();
  },

  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.rotation += p.rotSpeed;
      p.alpha -= p.fade;

      if (p.alpha <= 0 || p.y > this.canvas.height + 50) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;

      if (p.shape === "rect") {
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        this.drawHeart(this.ctx, 0, -p.size / 2, p.size);
      }

      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animId = requestAnimationFrame(() => this.loop());
    } else {
      this.animId = null;
    }
  }
};

/**
 * Ambient floating hearts & sparkles canvas for rich romantic atmosphere
 */
const AMBIENT = {
  canvas: null,
  ctx: null,
  items: [],

  init() {
    this.canvas = document.getElementById("ambientCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => this.resize());

    // Spawn drifting items
    const count = 24;
    for (let i = 0; i < count; i++) {
      this.items.push(this.createItem(true));
    }

    this.loop();
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  createItem(randomY = false) {
    return {
      x: Math.random() * this.canvas.width,
      y: randomY ? Math.random() * this.canvas.height : this.canvas.height + 20,
      size: 10 + Math.random() * 16,
      speedY: 0.4 + Math.random() * 0.7,
      speedX: Math.sin(Math.random() * Math.PI * 2) * 0.4,
      wobbleSpeed: 0.02 + Math.random() * 0.02,
      wobbleOffset: Math.random() * Math.PI * 2,
      alpha: 0.15 + Math.random() * 0.25,
      color: STATE.isDarkMode ? "rgba(244, 114, 182, " : "rgba(236, 72, 153, "
    };
  },

  drawHeart(ctx, x, y, size) {
    ctx.beginPath();
    const top = size * 0.3;
    ctx.moveTo(x, y + top);
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + top);
    ctx.bezierCurveTo(x - size / 2, y + (size + top) / 2, x, y + (size + top) / 2, x, y + size);
    ctx.bezierCurveTo(x, y + (size + top) / 2, x + size / 2, y + (size + top) / 2, x + size / 2, y + top);
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + top);
    ctx.closePath();
    ctx.fill();
  },

  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let item of this.items) {
      item.y -= item.speedY;
      item.wobbleOffset += item.wobbleSpeed;
      item.x += Math.sin(item.wobbleOffset) * 0.6 + item.speedX;

      if (item.y < -30) {
        Object.assign(item, this.createItem(false));
      }

      this.ctx.fillStyle = `${item.color}${item.alpha})`;
      this.drawHeart(this.ctx, item.x, item.y, item.size);
    }

    requestAnimationFrame(() => this.loop());
  }
};

/**
 * ==========================================================================
 * 7. INITIALIZATION & UI BINDINGS
 * ==========================================================================
 */
function initApp() {
  // 1. Populate Headline & Tag from Config / Query
  const recipientTag = document.getElementById("recipientTag");
  const greetingContainer = document.getElementById("greetingContainer");

  if (CONFIG.recipientName) {
    recipientTag.textContent = `For: ${CONFIG.recipientName} 💌`;
    recipientTag.style.display = "inline-block";
    greetingContainer.textContent = `Hey ${CONFIG.recipientName},`;
    greetingContainer.style.display = "block";
  }

  // Build question text from template
  const thingWordEl = document.getElementById("thingWord");
  thingWordEl.textContent = CONFIG.thing;

  // 2. Initialize Subsystems
  NO_BUTTON.init();
  YES_BUTTON.init();
  CONFETTI.init();
  AMBIENT.init();

  // 3. Audio & Theme Controls
  const soundBtn = document.getElementById("soundToggleBtn");
  const soundIcon = document.getElementById("soundIcon");
  const themeBtn = document.getElementById("themeToggleBtn");
  const themeIcon = document.getElementById("themeIcon");

  function updateSoundUI() {
    soundIcon.textContent = STATE.isMuted ? "🔇" : "🔊";
    soundBtn.setAttribute("aria-label", STATE.isMuted ? "Unmute sounds" : "Mute sounds");
  }

  function updateThemeUI() {
    if (STATE.isDarkMode) {
      document.body.classList.add("dark-mode");
      themeIcon.textContent = "☀️";
      themeBtn.setAttribute("aria-label", "Switch to light mode");
    } else {
      document.body.classList.remove("dark-mode");
      themeIcon.textContent = "🌙";
      themeBtn.setAttribute("aria-label", "Switch to dark mode");
    }
  }

  soundBtn.addEventListener("click", () => {
    STATE.isMuted = !STATE.isMuted;
    updateSoundUI();
    try {
      localStorage.setItem("crush_proposal_muted", JSON.stringify(STATE.isMuted));
    } catch (e) {}
  });

  themeBtn.addEventListener("click", () => {
    STATE.isDarkMode = !STATE.isDarkMode;
    updateThemeUI();
    try {
      localStorage.setItem("crush_proposal_theme", STATE.isDarkMode ? "dark" : "light");
    } catch (e) {}
  });

  updateSoundUI();
  updateThemeUI();

  // 4. "Do it again" Reset Button
  document.getElementById("resetBtn").addEventListener("click", () => {
    STATE.isCelebrated = false;
    STATE.noCount = 0;
    document.getElementById("proposalView").style.display = "block";
    const celebView = document.getElementById("celebrationView");
    celebView.style.display = "none";
    celebView.setAttribute("aria-hidden", "true");
    document.getElementById("counterHint").textContent = "";

    NO_BUTTON.reset();
    YES_BUTTON.reset();
  });

  // 5. Global user gesture listener to warm up AudioContext safely
  const warmUpAudio = () => {
    SOUNDS.initContext();
    window.removeEventListener("pointerdown", warmUpAudio);
    window.removeEventListener("keydown", warmUpAudio);
  };
  window.addEventListener("pointerdown", warmUpAudio, { once: true });
  window.addEventListener("keydown", warmUpAudio, { once: true });
}

// Launch application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
