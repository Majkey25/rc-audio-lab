import { audioCoefficients } from './physics'
import type { Circuit, Tap } from './physics'

export type Sound = 'guitar' | 'bass' | 'sine' | 'noise'
export interface AudioSettings extends Circuit { sound: Sound; frequency: number; bypass: boolean; volume: number; tap: Tap }
export interface Measurement { frequencies: Float32Array<ArrayBuffer>; gainDb: Float32Array<ArrayBuffer> }

// Without a usable output device Firefox never settles resume(), which would leave the UI stuck on "loading".
function resumeAudio(context: AudioContext): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('The audio output device did not start within 15 seconds.')), 15000)
    context.resume().then(
      () => { clearTimeout(timeout); resolve() },
      error => { clearTimeout(timeout); reject(error) },
    )
  })
}

async function makeRiff(sample: AudioBuffer, octave: number): Promise<AudioBuffer> {
  const rate = sample.sampleRate, step = 0.42
  const notes = [0, 0, 3, 5, 0, 7, 5, 3]
  const offline = new OfflineAudioContext(1, Math.ceil(notes.length * step * rate), rate)
  const input = sample.getChannelData(0)
  let onset = 0
  while (onset < input.length && Math.abs(input[onset]) < 0.003) onset++
  onset = Math.max(0, onset - Math.round(rate * 0.002))
  for (let note = 0; note < notes.length; note++) {
    // Recorded F2 transposed to E2, then to the selected interval.
    const ratio = 2 ** ((notes[note] - 1 + octave) / 12)
    const source = offline.createBufferSource(), gain = offline.createGain()
    source.buffer = sample; source.playbackRate.value = ratio
    const start = note * step, end = (note + 1) * step
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(1, start + .003)
    gain.gain.setValueAtTime(1, end - .025)
    gain.gain.linearRampToValueAtTime(0, end)
    source.connect(gain).connect(offline.destination)
    source.start(start, onset / rate); source.stop(end)
  }
  const result = await offline.startRendering(), output = result.getChannelData(0)
  let peak = 0
  for (const value of output) peak = Math.max(peak, Math.abs(value))
  if (peak === 0) throw new Error('The guitar sample contains no audio.')
  for (let n = 0; n < output.length; n++) output[n] *= .8 / peak
  return result
}

function makeNoise(context: BaseAudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, Math.round(context.sampleRate * 2), context.sampleRate)
  const data = buffer.getChannelData(0)
  let seed = 0x52434c41
  for (let n = 0; n < data.length; n++) {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5
    data[n] = ((seed >>> 0) / 4294967296 * 2 - 1) * .25
  }
  return buffer
}

export class AudioEngine {
  private context: AudioContext
  private processor: AudioWorkletNode
  private source: AudioBufferSourceNode | OscillatorNode | null = null
  private master: GainNode
  private input: GainNode
  private dry: AnalyserNode
  private wet: AnalyserNode
  private dryBins: Float32Array<ArrayBuffer>
  private wetBins: Float32Array<ArrayBuffer>
  private frequencies: Float32Array<ArrayBuffer>
  private guitar: AudioBuffer
  private bass: AudioBuffer
  private noise: AudioBuffer
  private settings: AudioSettings
  private stopped = false

  private constructor(context: AudioContext, processor: AudioWorkletNode, guitar: AudioBuffer, bass: AudioBuffer, settings: AudioSettings) {
    this.context = context; this.processor = processor; this.settings = settings
    this.guitar = guitar; this.bass = bass; this.noise = makeNoise(context)
    this.master = context.createGain()
    this.master.gain.value = 0
    this.input = context.createGain()
    this.dry = context.createAnalyser(); this.wet = context.createAnalyser()
    for (const analyser of [this.dry, this.wet]) { analyser.fftSize = 4096; analyser.smoothingTimeConstant = .82 }
    this.dryBins = new Float32Array(this.dry.frequencyBinCount)
    this.wetBins = new Float32Array(this.wet.frequencyBinCount)
    this.frequencies = new Float32Array(this.dry.frequencyBinCount)
    for (let bin = 0; bin < this.frequencies.length; bin++) this.frequencies[bin] = bin * context.sampleRate / this.dry.fftSize
    this.input.connect(this.dry)
    this.input.connect(processor)
    processor.connect(this.wet)
    processor.connect(this.master).connect(context.destination)
    this.setSound(settings)
    this.applyFilter(settings, 0)
  }

  static async create(settings: AudioSettings): Promise<AudioEngine> {
    const context = new AudioContext({ sampleRate: 48000 })
    try {
      audioCoefficients({ resistance: 10000, capacitance: 1e-9 }, context.sampleRate)
      if (context.sampleRate <= 40000) throw new Error('Audio requires a sample rate above 40 kHz.')
      await resumeAudio(context)
      const response = await fetch(`${import.meta.env.BASE_URL}audio/guitar-f2.flac`)
      if (!response.ok) throw new Error(`Guitar sample could not load: HTTP ${response.status}.`)
      const [sample] = await Promise.all([
        response.arrayBuffer().then(data => context.decodeAudioData(data)),
        context.audioWorklet.addModule(`${import.meta.env.BASE_URL}rc-processor.js`),
      ])
      const processor = new AudioWorkletNode(context, 'rc-highpass', { outputChannelCount: [1] })
      const [guitar, bass] = await Promise.all([makeRiff(sample, 0), makeRiff(sample, -12)])
      return new AudioEngine(context, processor, guitar, bass, settings)
    } catch (cause) {
      void context.close().catch(error => console.warn('Audio context cleanup failed.', error))
      throw cause
    }
  }

  get sampleRate(): number { return this.context.sampleRate }

  private applyFilter(settings: AudioSettings, ramp: number) {
    const { b0, b1, a1 } = audioCoefficients(settings, this.context.sampleRate, settings.tap)
    const time = this.context.currentTime
    const set = (name: string, value: number) => {
      const parameter = this.processor.parameters.get(name)
      if (!parameter) throw new Error(`The audio processor is missing the ${name} parameter.`)
      if (ramp > 0) parameter.setTargetAtTime(value, time, ramp); else parameter.value = value
    }
    set('b0', b0); set('b1', b1); set('a1', a1); set('mix', settings.bypass ? 0 : 1)
  }

  private setSound(settings: AudioSettings) {
    this.source?.stop(); this.source?.disconnect()
    if (settings.sound === 'sine') {
      const oscillator = this.context.createOscillator()
      oscillator.frequency.value = settings.frequency
      this.source = oscillator
    } else {
      const source = this.context.createBufferSource()
      source.buffer = settings.sound === 'guitar' ? this.guitar : settings.sound === 'bass' ? this.bass : this.noise
      source.loop = true
      this.source = source
    }
    this.source.connect(this.input)
    this.source.start()
  }

  async start() {
    await resumeAudio(this.context)
    this.master.gain.setTargetAtTime(this.settings.volume * .4, this.context.currentTime, .02)
  }

  update(settings: AudioSettings) {
    if (this.stopped) return
    const time = this.context.currentTime
    this.applyFilter(settings, .012)
    this.master.gain.setTargetAtTime(settings.volume * .4, time, .015)
    if (settings.sound !== this.settings.sound) this.setSound(settings)
    else if (this.source instanceof OscillatorNode) this.source.frequency.setTargetAtTime(settings.frequency, time, .015)
    this.settings = settings
  }

  // Measured magnitude response of the running audio path: output spectrum minus input spectrum, per FFT bin.
  measure(floorDb = -95): Measurement {
    this.dry.getFloatFrequencyData(this.dryBins)
    this.wet.getFloatFrequencyData(this.wetBins)
    const frequencies: number[] = [], gainDb: number[] = []
    for (let bin = 1; bin < this.dryBins.length; bin++) {
      const frequency = this.frequencies[bin]
      if (frequency < 20 || frequency > 20000) continue
      if (!Number.isFinite(this.dryBins[bin]) || !Number.isFinite(this.wetBins[bin]) || this.dryBins[bin] < floorDb) continue
      frequencies.push(frequency)
      gainDb.push(this.wetBins[bin] - this.dryBins[bin])
    }
    return { frequencies: Float32Array.from(frequencies), gainDb: Float32Array.from(gainDb) }
  }

  async stop() {
    if (this.stopped) return
    this.stopped = true
    this.source?.stop(); this.source?.disconnect()
    this.processor.port.postMessage('stop')
    this.processor.disconnect(); this.master.disconnect(); this.input.disconnect()
    this.dry.disconnect(); this.wet.disconnect()
    await this.context.close()
  }
}
