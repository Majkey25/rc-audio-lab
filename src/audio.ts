import { audioCoefficients } from './physics'
import type { Circuit } from './physics'

export type Sound = 'guitar' | 'bass' | 'sine'
export interface AudioSettings extends Circuit { sound: Sound; frequency: number; bypass: boolean; volume: number }

export class AudioEngine {
  private context: AudioContext
  private oscillator: OscillatorNode
  private dry: GainNode
  private wet: GainNode
  private master: GainNode
  private filter: IIRFilterNode
  private branch: GainNode
  private retiring: { filter: IIRFilterNode; branch: GainNode; timer: ReturnType<typeof setTimeout> } | null = null
  private settings: AudioSettings

  constructor(settings: AudioSettings) {
    this.context = new AudioContext()
    this.settings = settings
    this.oscillator = this.context.createOscillator()
    this.dry = this.context.createGain()
    this.wet = this.context.createGain()
    this.master = this.context.createGain()
    this.filter = this.makeFilter(settings)
    this.branch = this.context.createGain()
    this.oscillator.connect(this.dry).connect(this.master)
    this.oscillator.connect(this.filter).connect(this.branch).connect(this.wet).connect(this.master)
    this.master.connect(this.context.destination)
    this.master.gain.value = 0
    this.dry.gain.value = settings.bypass ? 1 : 0
    this.wet.gain.value = settings.bypass ? 0 : 1
    this.setSound(settings)
    this.oscillator.start()
  }

  get sampleRate(): number { return this.context.sampleRate }

  private makeFilter(circuit: Circuit): IIRFilterNode {
    const { b0, b1, a1 } = audioCoefficients(circuit, this.context.sampleRate)
    return this.context.createIIRFilter([b0, b1], [1, a1])
  }

  private setSound(settings: AudioSettings) {
    if (settings.sound === 'sine') this.oscillator.type = 'sine'
    else {
      const real = new Float32Array(17), imag = new Float32Array(17)
      for (let n = 1; n < 17; n++) imag[n] = 1 / n ** (settings.sound === 'bass' ? 1.7 : 1.3)
      this.oscillator.setPeriodicWave(this.context.createPeriodicWave(real, imag))
    }
    const fundamental = settings.sound === 'guitar' ? 82.4069 : settings.sound === 'bass' ? 41.2034 : settings.frequency
    this.oscillator.frequency.setTargetAtTime(fundamental, this.context.currentTime, 0.015)
  }

  async start() {
    await this.context.resume()
    this.master.gain.setTargetAtTime(this.settings.volume * 0.15, this.context.currentTime, 0.02)
  }

  update(settings: AudioSettings) {
    const t = this.context.currentTime
    if (settings.resistance !== this.settings.resistance || settings.capacitance !== this.settings.capacitance) {
      this.clearRetiring()
      const previous = { filter: this.filter, branch: this.branch }
      this.filter = this.makeFilter(settings)
      this.branch = this.context.createGain()
      this.branch.gain.value = 0
      this.oscillator.connect(this.filter).connect(this.branch).connect(this.wet)
      this.branch.gain.linearRampToValueAtTime(1, t + 0.025)
      previous.branch.gain.cancelAndHoldAtTime(t)
      previous.branch.gain.linearRampToValueAtTime(0, t + 0.025)
      this.retiring = { ...previous, timer: setTimeout(() => this.clearRetiring(), 60) }
    }
    if (settings.sound !== this.settings.sound || settings.frequency !== this.settings.frequency) this.setSound(settings)
    this.dry.gain.setTargetAtTime(settings.bypass ? 1 : 0, t, 0.015)
    this.wet.gain.setTargetAtTime(settings.bypass ? 0 : 1, t, 0.015)
    this.master.gain.setTargetAtTime(settings.volume * 0.15, t, 0.015)
    this.settings = settings
  }

  private clearRetiring() {
    if (!this.retiring) return
    clearTimeout(this.retiring.timer)
    this.oscillator.disconnect(this.retiring.filter)
    this.retiring.filter.disconnect()
    this.retiring.branch.disconnect()
    this.retiring = null
  }

  async stop() {
    this.clearRetiring()
    this.oscillator.stop()
    this.oscillator.disconnect()
    this.filter.disconnect()
    this.branch.disconnect()
    this.dry.disconnect(); this.wet.disconnect(); this.master.disconnect()
    await this.context.close()
  }
}
