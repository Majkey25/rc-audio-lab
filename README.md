# RC Audio Lab

[![CI](https://github.com/Majkey25/rc-audio-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/Majkey25/rc-audio-lab/actions/workflows/ci.yml)
[![Pages](https://github.com/Majkey25/rc-audio-lab/actions/workflows/deploy.yml/badge.svg)](https://github.com/Majkey25/rc-audio-lab/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)

[Open the simulation](https://majkey25.github.io/rc-audio-lab/) · [Read the project report in Czech](docs/project-report.md) · [Download the Word document](docs/Zapoctovy_projekt_RC_obvody_v_hudbe.docx)

An interactive simulation of capacitor charging, discharging and a first-order audio high-pass filter. Created by Matěj Teplý for an **AK3EJ credit project** at Tomas Bata University in Zlín. The interface defaults to Czech and includes an English switch.

The music example is a coupling capacitor between amplifier stages. It blocks steady DC and, together with the next stage's input resistance, attenuates low frequencies. A complete passive guitar pickup also has inductance; this app does not model that entire circuit.

## Using the simulation

- Change R with the slider or the rotary control beside the resistor. Change C and inspect the cutoff and substituted equations.
- Start the recorded guitar riff, then switch **A · Bypass** / **B · Filtered** while adjusting R or C. The second riff is the same recording transposed down an octave. A sine-wave source follows the frequency slider.
- Select **Charging & energy** to inspect capacitor voltage, resistor voltage, current and energy. Pause, scrub time or jump directly to τ. Discharging retains the same voltage/current references, so resistor voltage and current are negative.
- Open the component details for photographs and their credits. Keyboard arrows operate both sliders and the rotary control.

Audio uses one first-order recursive filter in an `AudioWorklet`. Its coefficients come from a bilinear transform prewarped at the analog cutoff. Parameter changes are smoothed without replacing filter nodes. The analog and digital responses agree at the cutoff; frequency warping is visible in the dashed digital trace. A/B keeps input gain unchanged, so attenuation remains audible.

## Run locally

Use **Node.js 24 or newer** and npm. No backend, API keys or database are required.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, including `/rc-audio-lab/`.

```sh
npm run check
npx playwright install chromium firefox
npm run test:e2e
```

`check` runs TypeScript, Oxlint, Node's built-in physics tests and the production build. Browser tests exercise both languages, the controls, charging/discharging, audio A/B, mobile layout and reduced motion. They also render the production audio processor in `OfflineAudioContext` and compare its measured amplitude/phase with the mathematical response. The recorded-sample test compares filtering of the same first three seconds, without using a microphone or claiming a hardware measurement.

## Implementation

| Path | Purpose |
|---|---|
| `src/physics.ts` | Pure RC equations and digital-filter coefficients |
| `src/App.tsx` | Shared parameters and lifecycle |
| `src/AudioView.tsx`, `src/TimeView.tsx` | Frequency and transient views |
| `src/Circuit.tsx`, `src/Knob.tsx`, `src/Plot.tsx` | Schematic, rotary control and SVG plots |
| `src/Explanation.tsx` | Equations, numerical substitutions and explanations |
| `src/audio.ts`, `public/rc-processor.js` | Recorded riff, Web Audio lifecycle and processor |
| `tests/physics.test.ts`, `tests/browser/` | Numeric and browser verification |
| `docs/` | Report, derivations, assignment summary and references |

## Deployment

Pull requests and pushes run [CI](.github/workflows/ci.yml). A successful CI run on `main` triggers the [Pages workflow](.github/workflows/deploy.yml). Deployment rebuilds the exact tested commit with `npm ci` and publishes `dist/` through the GitHub Pages artifact mechanism. Vite's base path is `/rc-audio-lab/`.

## Scope and sources

The model uses an ideal voltage source, resistor and capacitor. It excludes leakage, ESR, pickup inductance and amplifier clipping. Visual animation is slowed; actual time is shown separately. Recorded audio is processed numerically, not sent through physical components.

[Physics derivation](docs/physics.md) · [References and media credits](docs/references.md) · [Assignment summary](docs/assignment.md) · [AI use](docs/ai-use.md)

The accompanying Czech report uses numbered references and declares AI assistance in text, analysis, implementation and document preparation. It is a credit project, not a bachelor/master thesis or a claim of laboratory measurement.

## License

Original application code is available under the [MIT License](LICENSE). Component photographs retain their respective CC BY-SA licenses. The guitar recording is CC0. These licenses do not transfer rights to the UTB template/branding or third-party publications. See [media credits](docs/references.md#photographs).
