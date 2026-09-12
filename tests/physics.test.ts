import { test } from 'node:test'
import assert from 'node:assert/strict'
import { timeConstant, transient, highPass, lowPass, response as tapResponse, cutoff, audioCoefficients, digitalResponse, PRESETS } from '../src/physics.ts'
const circuit = { resistance: 10_000, capacitance: 1e-6 }
function close(actual: number, expected: number, tolerance = 1e-10) { assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`) }

test('charging endpoints, tau checkpoint and Kirchhoff voltage law', () => {
  close(timeConstant(circuit), 0.01)
  const initial = transient(circuit, 5, 0)
  close(initial.uc, 0); close(initial.ur, 5); close(initial.current, 0.0005)
  const checkpoint = transient(circuit, 5, 0.01)
  close(checkpoint.uc, 3.1606027941427883)
  close(checkpoint.ur, 1.8393972058572117)
  for (const t of [0, 0.002, 0.01, 0.05, 1]) {
    const state = transient(circuit, 5, t)
    close(state.uc + state.ur, 5)
    close(state.stored + state.heat, state.supplied, 1e-14)
  }
})
test('heat integral, asymptote and independent midpoint integration', () => {
  close(transient(circuit, 5, 0.01).heat, 0.00001080830895954234, 1e-15)
  close(transient(circuit, 5, 1).heat, 0.0000125, 1e-15)
  let integral = 0
  const dt = 0.01 / 10000
  for (let n = 0; n < 10000; n++) integral += (25 / 10000) * Math.exp(-2 * (n + 0.5) * dt / 0.01) * dt
  close(integral, transient(circuit, 5, 0.01).heat, 1e-12)
})
test('discharge references reverse while resistor power stays positive', () => {
  const state = transient(circuit, 5, 0.01, 'discharging')
  close(state.uc, 5 / Math.E); close(state.ur, -5 / Math.E)
  assert.ok(state.current < 0 && state.power > 0)
  close(state.uc + state.ur, 0)
  close(state.stored + state.heat, 0.5 * 1e-6 * 25, 1e-15)
  close(state.supplied, 0)
})
test('zero voltage produces finite zeros without normalization errors', () => {
  for (const value of Object.values(transient(circuit, 0, 0.01))) assert.ok(Number.isFinite(value))
  close(transient(circuit, 0, 0.01).heat, 0)
})
test('high-pass cutoff, amplitude, phase, DC and octave response', () => {
  close(cutoff(circuit), 15.915494309189533)
  const state = highPass(circuit, cutoff(circuit))
  close(state.magnitude, Math.SQRT1_2); close(state.gainDb, -3.0102999566398116)
  close(state.phase!, Math.PI / 4)
  close(state.reactance, circuit.resistance)
  assert.equal(highPass(circuit, 0).phase, null)
  assert.equal(highPass(circuit, 0).gainDb, -Infinity)
  assert.ok(highPass(circuit, cutoff(circuit) * 100).magnitude > 0.999)
})
test('realistic bass coupling case independently known', () => {
  const c = { resistance: 100000, capacitance: 100e-9 }
  // Independent impedance-divider calculation: R / hypot(R, 1 / (2πfC)).
  close(highPass(c, 41.2).gainDb, -0.6040561600778419, 1e-10)
})
test('digital filter is first-order, stable and matches cutoff at 44.1/48/96 kHz', () => {
  for (const sampleRate of [44100, 48000, 96000]) {
    for (const capacitance of [1e-9, 22e-9, 1e-6]) {
      const c = { resistance: 10000, capacitance }
      const coefficients = audioCoefficients(c, sampleRate)
      assert.ok(Math.abs(coefficients.a1) < 1)
      close(coefficients.b0 + coefficients.b1, 0)
      const response = digitalResponse(c, cutoff(c), sampleRate)
      close(response.magnitude, Math.SQRT1_2, 1e-9)
      close(response.phase!, Math.PI / 4, 1e-9)
    }
  }
})
test('low-pass is the complement of the high-pass and lags in phase', () => {
  const c = { resistance: 10000, capacitance: 47e-9 }
  const fc = cutoff(c)
  close(fc, 338.6275, 1e-4)
  close(lowPass(c, fc).magnitude, Math.SQRT1_2, 1e-12)
  close(lowPass(c, fc).gainDb, -3.0103, 1e-4)
  close(lowPass(c, fc).phase, -Math.PI / 4, 1e-12)
  // Power splits between the two taps at every frequency.
  for (const f of [20, 100, fc, 2000, 20000]) close(lowPass(c, f).magnitude ** 2 + highPass(c, f).magnitude ** 2, 1)
  assert.equal(lowPass(c, 0).magnitude, 1)
  assert.ok(lowPass(c, fc * 100).gainDb < -39)
  assert.equal(tapResponse(c, 500, 'capacitor').magnitude, lowPass(c, 500).magnitude)
  assert.equal(tapResponse(c, 500, 'resistor').magnitude, highPass(c, 500).magnitude)
})

test('the low-pass digital filter matches the analog cutoff and passes DC', () => {
  for (const sampleRate of [44100, 48000, 96000]) {
    for (const capacitance of [1e-9, 47e-9, 1e-6]) {
      const c = { resistance: 10000, capacitance }
      const { b0, b1, a1 } = audioCoefficients(c, sampleRate, 'capacitor')
      assert.ok(Math.abs(a1) < 1)
      close(b0, b1)
      // DC gain of y = b0x + b1x1 - a1y1 is (b0 + b1) / (1 + a1).
      close((b0 + b1) / (1 + a1), 1, 1e-12)
      const measured = digitalResponse(c, cutoff(c), sampleRate, 'capacitor')
      close(measured.magnitude, Math.SQRT1_2, 1e-9)
      close(measured.phase!, -Math.PI / 4, 1e-9)
    }
  }
})

test('every preset stays inside the audio band and names its tap', () => {
  for (const preset of PRESETS) {
    const fc = cutoff(preset)
    assert.ok(fc > 10 && fc < 20000, `${preset.name} cutoff ${fc}`)
    assert.ok(preset.tap === 'capacitor' || preset.tap === 'resistor')
  }
  // The default low-pass demo has to remove a large share of a guitar's treble.
  const dark = PRESETS[1]
  assert.ok(lowPass(dark, 3000).gainDb < -18)
})

test('invalid physical inputs fail explicitly', () => {
  for (const value of [0, -1, Infinity, NaN]) {
    assert.throws(() => timeConstant({ ...circuit, resistance: value }), RangeError)
    assert.throws(() => timeConstant({ ...circuit, capacitance: value }), RangeError)
  }
  assert.throws(() => transient(circuit, -1, 0), RangeError)
  assert.throws(() => transient(circuit, 1, -1), RangeError)
  assert.throws(() => highPass(circuit, -1), RangeError)
  assert.throws(() => lowPass(circuit, -1), RangeError)
  assert.throws(() => audioCoefficients(circuit, 1), RangeError)
})
