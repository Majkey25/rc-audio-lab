import { audioCoefficients } from './physics'
import type { Circuit } from './physics'

export type Sound = 'guitar' | 'bass' | 'sine'
export interface AudioSettings extends Circuit { sound: Sound; frequency: number; bypass: boolean; volume: number }

async function makeRiff(context: AudioContext, sample: AudioBuffer, octave: number): Promise<AudioBuffer> {
  const rate = context.sampleRate, step = 0.42
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

export class AudioEngine {
  private context: AudioContext
  private processor: AudioWorkletNode
  private source: AudioBufferSourceNode | OscillatorNode | null = null
  private master: GainNode
  private guitar: AudioBuffer
  private bass: AudioBuffer
  private settings: AudioSettings
  private stopped = false

  private constructor(context: AudioContext, processor: AudioWorkletNode, guitar: AudioBuffer, bass: AudioBuffer, settings: AudioSettings) {
    this.context = context; this.processor = processor; this.settings = settings
    this.guitar = guitar; this.bass = bass
    this.master = context.createGain()
    this.master.gain.value = 0
    processor.connect(this.master).connect(context.destination)
    this.setSound(settings)
    processor.parameters.get('b0')!.value = audioCoefficients(settings, context.sampleRate).b0
    processor.parameters.get('mix')!.value = settings.bypass ? 0 : 1
  }

  static async create(settings: AudioSettings): Promise<AudioEngine> {
    const context = new AudioContext({ sampleRate: 48000 })
    try {
      audioCoefficients({ resistance: 10000, capacitance: 1e-9 }, context.sampleRate)
      if (context.sampleRate <= 40000) throw new Error('Audio requires a sample rate above 40 kHz.')
      await context.resume()
      const response = await fetch(`${import.meta.env.BASE_URL}audio/guitar-f2.flac`)
      if (!response.ok) throw new Error(`Guitar sample could not load: HTTP ${response.status}.`)
      const [sample] = await Promise.all([
        response.arrayBuffer().then(data => context.decodeAudioData(data)),
        context.audioWorklet.addModule(`${import.meta.env.BASE_URL}rc-processor.js`),
      ])
      const processor = new AudioWorkletNode(context, 'rc-highpass', { outputChannelCount: [1] })
      const [guitar, bass] = await Promise.all([makeRiff(context, sample, 0), makeRiff(context, sample, -12)])
      return new AudioEngine(context, processor, guitar, bass, settings)
    } catch (cause) { await context.close(); throw cause }
  }

  get sampleRate(): number { return this.context.sampleRate }

  private setSound(settings: AudioSettings) {
    this.source?.stop(); this.source?.disconnect()
    if (settings.sound === 'sine') {
      const oscillator = this.context.createOscillator()
      oscillator.frequency.value = settings.frequency
      this.source = oscillator
    } else {
      const source = this.context.createBufferSource()
      source.buffer = settings.sound === 'guitar' ? this.guitar : this.bass
      source.loop = true
      this.source = source
    }
    this.source.connect(this.processor)
    this.source.start()
  }

  async start() {
    await this.context.resume()
    this.master.gain.setTargetAtTime(this.settings.volume * .4, this.context.currentTime, .02)
  }

  update(settings: AudioSettings) {
    if (this.stopped) return
    const time = this.context.currentTime
    this.processor.parameters.get('b0')!.setTargetAtTime(audioCoefficients(settings, this.context.sampleRate).b0, time, .012)
    this.processor.parameters.get('mix')!.setTargetAtTime(settings.bypass ? 0 : 1, time, .012)
    this.master.gain.setTargetAtTime(settings.volume * .4, time, .015)
    if (settings.sound !== this.settings.sound) this.setSound(settings)
    else if (this.source instanceof OscillatorNode) this.source.frequency.setTargetAtTime(settings.frequency, time, .015)
    this.settings = settings
  }

  async stop() {
    if (this.stopped) return
    this.stopped = true
    this.source?.stop(); this.source?.disconnect()
    this.processor.port.postMessage('stop')
    this.processor.disconnect(); this.master.disconnect()
    await this.context.close()
  }
}
