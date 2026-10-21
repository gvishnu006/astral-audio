// Astral Audio Procedural Audio Engine
document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('nav-open');
    });
  }

  // Web Audio Context & Nodes
  let audioCtx = null;
  let masterGain = null;
  let analyser = null;
  let isInitialized = false;

  const channels = {
    rain: { gainNode: null, source: null },
    waves: { gainNode: null, source: null, lfo: null },
    drone: { gainNode: null, osc1: null, osc2: null },
    fire: { gainNode: null, source: null }
  };

  function initAudioContext() {
    if (isInitialized) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.8, audioCtx.currentTime);

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;

    masterGain.connect(analyser);
    analyser.connect(audioCtx.destination);

    // 1. Rain Synthesizer (Filtered Pink Noise)
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const rainSource = audioCtx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    const rainFilter = audioCtx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(1000, audioCtx.currentTime);

    channels.rain.gainNode = audioCtx.createGain();
    channels.rain.gainNode.gain.setValueAtTime(0, audioCtx.currentTime);

    rainSource.connect(rainFilter);
    rainFilter.connect(channels.rain.gainNode);
    channels.rain.gainNode.connect(masterGain);
    rainSource.start(0);

    // 2. Cosmic Drone (432Hz Harmonic Sine)
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(108, audioCtx.currentTime); // 432 / 4 deep bass
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(110, audioCtx.currentTime); // Binaural 2Hz theta beat

    channels.drone.gainNode = audioCtx.createGain();
    channels.drone.gainNode.gain.setValueAtTime(0, audioCtx.currentTime);

    osc1.connect(channels.drone.gainNode);
    osc2.connect(channels.drone.gainNode);
    channels.drone.gainNode.connect(masterGain);
    osc1.start(0);
    osc2.start(0);

    // 3. Ocean Waves (LFO Modulated Filtered Noise)
    const waveSource = audioCtx.createBufferSource();
    waveSource.buffer = noiseBuffer;
    waveSource.loop = true;

    const waveFilter = audioCtx.createBiquadFilter();
    waveFilter.type = 'lowpass';
    waveFilter.frequency.setValueAtTime(300, audioCtx.currentTime);

    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, audioCtx.currentTime); // 8-second wave swells

    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(250, audioCtx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(waveFilter.frequency);

    channels.waves.gainNode = audioCtx.createGain();
    channels.waves.gainNode.gain.setValueAtTime(0, audioCtx.currentTime);

    waveSource.connect(waveFilter);
    waveFilter.connect(channels.waves.gainNode);
    channels.waves.gainNode.connect(masterGain);

    waveSource.start(0);
    lfo.start(0);

    // 4. Campfire Crackle
    const fireSource = audioCtx.createBufferSource();
    fireSource.buffer = noiseBuffer;
    fireSource.loop = true;

    const fireFilter = audioCtx.createBiquadFilter();
    fireFilter.type = 'bandpass';
    fireFilter.frequency.setValueAtTime(2500, audioCtx.currentTime);
    fireFilter.Q.setValueAtTime(4.0, audioCtx.currentTime);

    channels.fire.gainNode = audioCtx.createGain();
    channels.fire.gainNode.gain.setValueAtTime(0, audioCtx.currentTime);

    fireSource.connect(fireFilter);
    fireFilter.connect(channels.fire.gainNode);
    channels.fire.gainNode.connect(masterGain);
    fireSource.start(0);

    isInitialized = true;
    startVisualizer();
  }

  // Sliders Interaction
  const soundChannels = document.querySelectorAll('.sound-channel');
  soundChannels.forEach(channel => {
    const soundType = channel.getAttribute('data-sound');
    const slider = channel.querySelector('.vol-slider');
    const label = channel.querySelector('.vol-value');

    slider.addEventListener('input', (e) => {
      initAudioContext();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const val = parseInt(e.target.value, 10);
      label.innerText = val === 0 ? 'Off' : val + '%';

      if (channels[soundType] && channels[soundType].gainNode) {
        channels[soundType].gainNode.gain.setTargetAtTime(val / 100, audioCtx.currentTime, 0.05);
      }
    });
  });

  // Presets Application
  const presets = {
    'deep-code': { rain: 45, waves: 0, drone: 70, fire: 0 },
    'night-library': { rain: 0, waves: 25, drone: 0, fire: 65 },
    'space-voyage': { rain: 0, waves: 0, drone: 85, fire: 0 }
  };

  const presetCards = document.querySelectorAll('.preset-card');
  presetCards.forEach(card => {
    card.addEventListener('click', () => {
      initAudioContext();
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const key = card.getAttribute('data-preset');
      const settings = presets[key];

      if (settings) {
        Object.keys(settings).forEach(type => {
          const channel = document.querySelector(`.sound-channel[data-sound="${type}"]`);
          if (channel) {
            const slider = channel.querySelector('.vol-slider');
            const label = channel.querySelector('.vol-value');
            const targetVal = settings[type];
            slider.value = targetVal;
            label.innerText = targetVal === 0 ? 'Off' : targetVal + '%';

            if (channels[type] && channels[type].gainNode) {
              channels[type].gainNode.gain.setTargetAtTime(targetVal / 100, audioCtx.currentTime, 0.05);
            }
          }
        });
      }
    });
  });

  // Canvas Waveform Visualizer
  const canvas = document.getElementById('visualizerCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;

  function startVisualizer() {
    if (!canvas || !ctx || !analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.95;
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(0.5, '#d946ef');
        gradient.addColorStop(1, '#38bdf8');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 4, barHeight);
        x += barWidth;
      }
    }
    draw();
  }
});
