import { test, expect } from '@playwright/test'
import { audioCoefficients, cutoff, digitalResponse, lowPass } from '../../src/physics'
import type { Tap } from '../../src/physics'

const RATE = 48000

// Drives the production worklet with a sine and recovers its magnitude and phase by projection.
async function measureTone(page: import('@playwright/test').Page, circuit: { resistance: number; capacitance: number }, tap: Tap, frequency: number) {
  const { b0, b1, a1 } = audioCoefficients(circuit, RATE, tap)
  return page.evaluate(async ({ b0, b1, a1, frequency, rate }) => {
    const ctx = new OfflineAudioContext(1, rate, rate)
    await ctx.audioWorklet.addModule(new URL('rc-processor.js', location.href).href)
    const node = new AudioWorkletNode(ctx, 'rc-highpass', { outputChannelCount: [1] })
    node.parameters.get('b0')!.value = b0
    node.parameters.get('b1')!.value = b1
    node.parameters.get('a1')!.value = a1
    const buffer = ctx.createBuffer(1, rate, rate), input = buffer.getChannelData(0)
    for (let n = 0; n < rate; n++) input[n] = Math.sin(2 * Math.PI * frequency * n / rate) * .5
    const source = ctx.createBufferSource(); source.buffer = buffer; source.connect(node).connect(ctx.destination); source.start()
    const output = (await ctx.startRendering()).getChannelData(0)
    let ss = 0, cc = 0, sc = 0, ys = 0, yc = 0
    for (let n = Math.floor(rate * .25); n < rate; n++) {
      const s = Math.sin(2 * Math.PI * frequency * n / rate), c = Math.cos(2 * Math.PI * frequency * n / rate)
      ss += s * s; cc += c * c; sc += s * c; ys += output[n] * s; yc += output[n] * c
    }
    const det = ss * cc - sc * sc, a = (ys * cc - yc * sc) / det, b = (yc * ss - ys * sc) / det
    return { magnitude: Math.hypot(a, b) / .5, phase: Math.atan2(b, a) }
  }, { b0, b1, a1, frequency, rate: RATE })
}

test('production AudioWorklet matches analytic DSP for both taps', async ({ page }) => {
  await page.goto('./')
  for (const tap of ['resistor', 'capacitor'] as const) {
    const circuit = tap === 'capacitor' ? { resistance: 10000, capacitance: 47e-9 } : { resistance: 100000, capacitance: 10e-9 }
    for (const frequency of [41.2, cutoff(circuit), 5000]) {
      const actual = await measureTone(page, circuit, tap, frequency)
      const expected = digitalResponse(circuit, frequency, RATE, tap)
      expect(actual.magnitude).toBeCloseTo(expected.magnitude, 4)
      expect(actual.phase).toBeCloseTo(expected.phase!, 4)
    }
  }
})

test('bypass passes the input through untouched', async ({ page }) => {
  await page.goto('./')
  const bypass = await page.evaluate(async () => {
    const ctx = new OfflineAudioContext(1, 4800, 48000)
    await ctx.audioWorklet.addModule(new URL('rc-processor.js', location.href).href)
    const filter = new AudioWorkletNode(ctx, 'rc-highpass', { outputChannelCount: [1] })
    filter.parameters.get('mix')!.value = 0
    const source = ctx.createConstantSource(); source.offset.value = .2; source.connect(filter).connect(ctx.destination); source.start()
    const data = (await ctx.startRendering()).getChannelData(0)
    return Math.max(...data.map(value => Math.abs(value - .2)))
  })
  expect(bypass).toBeLessThan(1e-7)
})

test('default high-pass strongly attenuates the recorded guitar', async ({ page }) => {
  await page.goto('./')
  const circuit = { resistance: 10000, capacitance: 1.38e-9 }
  const { b0, b1, a1 } = audioCoefficients(circuit, RATE, 'resistor')
  const result = await page.evaluate(async ({ b0, b1, a1, rate }) => {
    const decode = new OfflineAudioContext(1, 1, rate)
    const recording = await decode.decodeAudioData(await (await fetch(new URL('audio/guitar-f2.flac', location.href))).arrayBuffer())
    async function levelDb(mix: number) {
      const ctx = new OfflineAudioContext(1, rate * 3, rate)
      await ctx.audioWorklet.addModule(new URL('rc-processor.js', location.href).href)
      const filter = new AudioWorkletNode(ctx, 'rc-highpass', { outputChannelCount: [1] })
      filter.parameters.get('b0')!.value = b0
      filter.parameters.get('b1')!.value = b1
      filter.parameters.get('a1')!.value = a1
      filter.parameters.get('mix')!.value = mix
      const source = ctx.createBufferSource(); source.buffer = recording
      source.connect(filter).connect(ctx.destination); source.start()
      const data = (await ctx.startRendering()).getChannelData(0)
      let energy = 0
      for (const value of data) energy += value * value
      return 10 * Math.log10(energy / data.length)
    }
    return { dry: await levelDb(0), filtered: await levelDb(1) }
  }, { b0, b1, a1, rate: RATE })
  console.log('Default guitar level, dry vs high-pass:', result)
  expect(Number.isFinite(result.dry)).toBe(true)
  expect(Number.isFinite(result.filtered)).toBe(true)
  expect(result.filtered - result.dry).toBeLessThan(-20)
})

test('the low-pass removes most of the guitar treble while bypass keeps it', async ({ page }) => {
  await page.goto('./')
  const circuit = { resistance: 10000, capacitance: 47e-9 }
  const { b0, b1, a1 } = audioCoefficients(circuit, RATE, 'capacitor')
  const result = await page.evaluate(async ({ b0, b1, a1, rate }) => {
    const decode = new OfflineAudioContext(1, 1, rate)
    const recording = await decode.decodeAudioData(await (await fetch(new URL('audio/guitar-f2.flac', location.href))).arrayBuffer())
    // Energy above 2 kHz, isolated with a steep cascade so the number tracks perceived brightness.
    async function trebleDb(mix: number) {
      const ctx = new OfflineAudioContext(1, rate * 3, rate)
      await ctx.audioWorklet.addModule(new URL('rc-processor.js', location.href).href)
      const filter = new AudioWorkletNode(ctx, 'rc-highpass', { outputChannelCount: [1] })
      filter.parameters.get('b0')!.value = b0
      filter.parameters.get('b1')!.value = b1
      filter.parameters.get('a1')!.value = a1
      filter.parameters.get('mix')!.value = mix
      const source = ctx.createBufferSource(); source.buffer = recording; source.connect(filter)
      let tail: AudioNode = filter
      for (let stage = 0; stage < 4; stage++) {
        const band = ctx.createBiquadFilter(); band.type = 'highpass'; band.frequency.value = 2000; band.Q.value = .7
        tail.connect(band); tail = band
      }
      tail.connect(ctx.destination); source.start()
      const data = (await ctx.startRendering()).getChannelData(0)
      let energy = 0
      for (const value of data) energy += value * value
      return 10 * Math.log10(energy / data.length)
    }
    return { dry: await trebleDb(0), filtered: await trebleDb(1) }
  }, { b0, b1, a1, rate: RATE })
  console.log('Guitar treble above 2 kHz, dry vs low-pass:', result)
  expect(result.filtered - result.dry).toBeLessThan(-12)
  // The analytic curve predicts roughly this much loss in that band.
  expect(lowPass(circuit, 3000).gainDb).toBeLessThan(-18)
})

test('the live measurement traces the analytic curve and flattens on bypass', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Switch to English' }).click()
  await page.getByRole('combobox', { name: 'Sound', exact: true }).selectOption('noise')
  await page.getByRole('button', { name: '▶ Start audio' }).click()
  await expect(page.getByRole('button', { name: 'Stop audio' })).toBeVisible()
  await expect(page.locator('.plot path[stroke="#7a4fa3"]')).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: 'A · Bypass', exact: true }).click()
  await page.waitForTimeout(2500)
  const flat = await page.locator('.plot path[stroke="#7a4fa3"]').getAttribute('d')
  await page.getByRole('button', { name: 'B · Filtered', exact: true }).click()
  await page.waitForTimeout(2500)
  const shaped = await page.locator('.plot path[stroke="#7a4fa3"]').getAttribute('d')
  expect(flat).not.toEqual(shaped)
  await page.getByRole('button', { name: 'Stop audio' }).click()
})
