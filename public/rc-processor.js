/* global AudioWorkletProcessor, registerProcessor */
// One state pair per channel; coefficient and bypass ramps are sample accurate.
class RCProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'b0', defaultValue: 0.99, minValue: 0, maxValue: 1 },
      { name: 'mix', defaultValue: 1, minValue: 0, maxValue: 1 },
    ]
  }
  constructor() {
    super()
    this.previousInput = [0, 0]
    this.previousOutput = [0, 0]
    this.active = true
    this.port.onmessage = event => { if (event.data === 'stop') this.active = false }
  }
  process(inputs, outputs, parameters) {
    if (!this.active) return false
    const input = inputs[0], output = outputs[0]
    for (let channel = 0; channel < output.length; channel++) {
      const source = input[channel] || input[0]
      let x1 = this.previousInput[channel], y1 = this.previousOutput[channel]
      for (let n = 0; n < output[channel].length; n++) {
        const x = source ? source[n] : 0
        const b0 = parameters.b0.length === 1 ? parameters.b0[0] : parameters.b0[n]
        const mix = parameters.mix.length === 1 ? parameters.mix[0] : parameters.mix[n]
        const y = b0 * (x - x1) - (1 - 2 * b0) * y1
        output[channel][n] = x * (1 - mix) + y * mix
        x1 = x; y1 = y
      }
      this.previousInput[channel] = x1
      this.previousOutput[channel] = Math.abs(y1) < 1e-25 ? 0 : y1
    }
    return true
  }
}
registerProcessor('rc-highpass', RCProcessor)
