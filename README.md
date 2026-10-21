# Astral Audio

> A generative ambient soundscape and binaural beats audio synthesizer built with pure Web Audio API and vanilla JavaScript.

![Audio Engine](https://img.shields.io/badge/engine-Web%20Audio%20API-8b5cf6?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen?style=flat-square)

## Core Features

- 🌧️ **Procedural Audio Synthesis**: Generates authentic rain (pink noise), rolling ocean swells (LFO modulated lowpass), cosmic drone (432Hz binaural beat), and campfire embers entirely in code without sample audio files.
- 🎚️ **Multitrack Channel Mixer**: Smooth per-channel volume gain adjustments with real-time feedback.
- 🌌 **Real-Time FFT Canvas Visualizer**: Connected to the Web Audio `AnalyserNode` to draw live harmonic frequencies.
- 🧘 **Curated Presets**: Instantly trigger Deep Code, Midnight Sanctuary, or Interstellar Drift presets.

## Local Development

Serve locally with any static web server:

```bash
# Using Python
python -m http.server 5000

# Using Node.js
npx serve .
```

Navigate to `http://localhost:5000` to start listening.

## Author

Crafted by **[gvishnu006](https://github.com/gvishnu006)**
