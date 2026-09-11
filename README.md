# RC Audio Lab ─┤├─

[![Deploy to GitHub Pages](https://github.com/Majkey25/rc-audio-lab/actions/workflows/deploy.yml/badge.svg)](https://github.com/Majkey25/rc-audio-lab/actions/workflows/deploy.yml)
[![GitHub Pages](https://img.shields.io/badge/Live_Demo-GitHub_Pages-2ea44f?style=flat&logo=github)](https://majkey25.github.io/rc-audio-lab/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?style=flat&logo=vite)](https://vitejs.dev/)
[![Tests Passing](https://img.shields.io/badge/Tests-Passing-success?style=flat&logo=node.js)](https://github.com/Majkey25/rc-audio-lab)

> **Interactive educational simulation explaining the physics of capacitor charging, discharging, energy dissipation, and RC filter behaviors in electric guitars, bass guitars, dynamic processors, and audio amplifiers.**

🔗 **Live Simulation:** [https://majkey25.github.io/rc-audio-lab/](https://majkey25.github.io/rc-audio-lab/)  
📄 **Full Academic Research Report (CZ):** [docs/project-report.md](docs/project-report.md)  
📐 **Physics & DSP Derivations:** [docs/physics.md](docs/physics.md)  
📚 **Literature & Media Attributions:** [docs/references.md](docs/references.md)

---

## Overview

**RC Audio Lab** bridges theoretical electromagnetic circuit theory with tangible musical applications. Built from the perspective of a multi-instrumentalist (guitarist, bassist, drummer), it demonstrates why series and parallel RC networks are fundamental to audio signal processing:

* **Audio & Frequency Domain:** Simulates an AC coupling high-pass filter ($u_{\text{out}}$ across $R$) used in guitar pedals and tube amplifiers to prevent DC offset propagation and control bass clarity. Features live browser Web Audio playback comparing bypassed vs. filtered guitar ($E_2$), bass ($E_1$), and sine waves.
* **Transient & Energy Domain:** Solves the first-order differential equation for DC charging and discharging steps. Numerically integrates Joule heating on the resistor to prove the exact analytical result:
  $$W_R(\tau) = \frac{1}{2} C U^2 \left(1 - e^{-2}\right) \approx 0.432332 \cdot C U^2$$
* **Physical Hardware Connection:** Direct tactile feedback through an interactive rotary potentiometer knob alongside high-resolution photographs of physical carbon track potentiometers and wound film capacitors.
* **Bilingual Support:** Fully localized in Czech (default) and English.

---

## Key Features

### 1. Dual Simulation Engines
* **Frequency Analysis:** Real-time Bode plot (magnitude in dB and phase angle in degrees) and oscilloscope waveform displays showing amplitude reduction and phase lead $\phi = \arctan(1 / \omega R C)$.
* **Transient Step Analysis:** Instantaneous voltage plots for $u_C(t)$, $u_R(t)$, source energy $W_z(t)$, stored electrostatic energy $W_C(t)$, and cumulative dissipated heat $W_R(t)$.

### 2. High-Fidelity Discrete DSP Modeling
Unlike standard Web Audio implementations that apply generic 2nd-order biquads with resonance peaks, this lab employs a **first-order IIR digital filter** via `IIRFilterNode` derived through the **Bilinear Transform with frequency prewarping**:
$$K = \tan\left(\frac{\pi f_c}{f_s}\right), \quad b_0 = \frac{1}{K + 1}, \quad b_1 = -\frac{1}{K + 1}, \quad a_1 = \frac{K - 1}{K + 1}$$
This guarantees a true $6\,\text{dB/octave}$ ($20\,\text{dB/decade}$) roll-off matching physical analog hardware.

### 3. Musical Educational Presets
1. **Full-range coupling:** $R = 100\,\mathrm{k\Omega}, C = 100\,\mathrm{nF} \implies f_c \approx 15.9\,\mathrm{Hz}$ (full bass preservation).
2. **Mild bass cut:** $R = 100\,\mathrm{k\Omega}, C = 22\,\mathrm{nF} \implies f_c \approx 72.3\,\mathrm{Hz}$ (sub-bass cleanup).
3. **Stronger bass cut:** $R = 100\,\mathrm{k\Omega}, C = 10\,\mathrm{nF} \implies f_c \approx 159\,\mathrm{Hz}$ (tight treble booster / overdrive pre-filter).
4. **Extreme demonstration:** $R = 47\,\mathrm{k\Omega}, C = 4.7\,\mathrm{nF} \implies f_c \approx 720\,\mathrm{Hz}$ (audible band-limiting).

---

## Project Structure

```
rc-audio-lab/
├── .github/workflows/
│   └── deploy.yml          # GitHub Pages automated CI/CD pipeline
├── docs/
│   ├── project-report.md   # Complete Czech semester research report (10 pages equivalent)
│   ├── physics.md          # Formal ODE derivations, energy proofs & DSP formulas
│   └── references.md       # MIT OpenCourseWare citations and photo licenses
├── public/
│   └── components/         # High-resolution component hardware photos
├── src/
│   ├── assets/             # Vector icons and styling resources
│   ├── audio.ts            # Web Audio API engine with custom IIRFilterNode
│   ├── physics.ts          # Core analytical models, ODEs, and energy integrals
│   ├── ui.ts               # Localized string dictionaries (CZ / EN)
│   ├── App.tsx             # Root application orchestrator
│   ├── AudioView.tsx       # AC frequency Bode & waveform plots
│   ├── TimeView.tsx        # DC transient voltage & energy plots
│   ├── Circuit.tsx         # SVG schematic rendering
│   ├── Controls.tsx        # Sliders, presets, and logarithmic scalers
│   ├── Knob.tsx            # Interactive rotary hardware potentiometer
│   └── Plot.tsx            # Canvas-based high-performance graphing
└── tests/
    └── physics.test.ts     # Automated mathematical and boundary verification tests
```

---

## Local Development & Testing

### Prerequisites
* Node.js $\ge 20.x$
* npm $\ge 10.x$

### Setup
```bash
# Clone repository
git clone https://github.com/Majkey25/rc-audio-lab.git
cd rc-audio-lab

# Install dependencies
npm install

# Run automated physics tests
npm test

# Start local development server
npm run dev
```

### Build & Verify
```bash
# Full validation: TypeScript check, linting, tests, and production bundle
npm run check
```

---

## Verification & Energy Balance

Every formula implemented in the lab is mathematically checked:
* Initial condition: $u_C(0^+) = 0$, $u_R(0^+) = U$, $i(0^+) = U/R$
* Half-power point: $|H(f_c)| = \frac{1}{\sqrt{2}} \approx -3.0103\,\text{dB}$
* Time constant: $u_C(\tau) = U(1 - e^{-1}) \approx 0.632121\,U$
* Dissipated heat up to $\tau$: $W_R(\tau) = \frac{1}{2} C U^2 (1 - e^{-2}) \approx 0.432332\,C U^2$
* Energy balance: $W_C(\tau) + W_R(\tau) \equiv W_z(\tau)$

Run `npm test` to execute all verification assertions.

---

## License

This project is licensed under the [MIT License](LICENSE).
Media assets in `public/components/` are licensed under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) as documented in [docs/references.md](docs/references.md).
