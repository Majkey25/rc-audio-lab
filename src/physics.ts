export interface Circuit { resistance: number; capacitance: number }
export type Direction = 'charging' | 'discharging'
// Ideal first-order filters; a complete passive guitar pickup also needs inductance and loading.
export type Tap = 'resistor' | 'capacitor'

function positive(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be finite and greater than zero.`)
  return value
}
function nonnegative(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be finite and nonnegative.`)
  return value
}
export function timeConstant({ resistance, capacitance }: Circuit): number {
  return positive(resistance, 'R') * positive(capacitance, 'C')
}
export function cutoff(circuit: Circuit): number { return 1 / (2 * Math.PI * timeConstant(circuit)) }

export function transient(circuit: Circuit, voltage: number, time: number, direction: Direction = 'charging') {
  const tau = timeConstant(circuit)
  nonnegative(voltage, 'U'); nonnegative(time, 't')
  const decay = Math.exp(-time / tau)
  const uc = voltage * (direction === 'charging' ? -Math.expm1(-time / tau) : decay)
  const ur = (direction === 'charging' ? 1 : -1) * voltage * decay
  const current = ur / circuit.resistance
  const heat = 0.5 * circuit.capacitance * voltage ** 2 * -Math.expm1(-2 * time / tau)
  const stored = 0.5 * circuit.capacitance * uc ** 2
  const supplied = direction === 'charging' ? circuit.capacitance * voltage * uc : 0
  return { tau, uc, ur, current, heat, stored, supplied, power: current ** 2 * circuit.resistance }
}

export function highPass(circuit: Circuit, frequency: number) {
  nonnegative(frequency, 'Frequency')
  const omega = 2 * Math.PI * frequency
  const x = omega * timeConstant(circuit)
  const magnitude = x / Math.hypot(1, x)
  return {
    omega, magnitude, gainDb: frequency === 0 ? -Infinity : 20 * Math.log10(magnitude),
    phase: frequency === 0 ? null : Math.atan2(1, x),
    reactance: frequency === 0 ? Infinity : 1 / (omega * circuit.capacitance),
  }
}

export function lowPass(circuit: Circuit, frequency: number) {
  nonnegative(frequency, 'Frequency')
  const omega = 2 * Math.PI * frequency
  const x = omega * timeConstant(circuit)
  const magnitude = 1 / Math.hypot(1, x)
  return {
    omega, magnitude, gainDb: 20 * Math.log10(magnitude),
    phase: -Math.atan(x),
    reactance: frequency === 0 ? Infinity : 1 / (omega * circuit.capacitance),
  }
}
export function response(circuit: Circuit, frequency: number, tap: Tap) {
  return tap === 'capacitor' ? lowPass(circuit, frequency) : highPass(circuit, frequency)
}

// Bilinear transform, prewarped at the analog cutoff. See docs/physics.md.
export function audioCoefficients(circuit: Circuit, sampleRate: number, tap: Tap = 'resistor') {
  positive(sampleRate, 'Sample rate')
  const fc = cutoff(circuit)
  if (fc >= sampleRate / 2) throw new RangeError('Cutoff must be below the audio Nyquist frequency.')
  const k = Math.tan(Math.PI * fc / sampleRate)
  const a1 = (k - 1) / (k + 1)
  return tap === 'capacitor'
    ? { b0: k / (1 + k), b1: k / (1 + k), a1 }
    : { b0: 1 / (1 + k), b1: -1 / (1 + k), a1 }
}

export function digitalResponse(circuit: Circuit, frequency: number, sampleRate: number, tap: Tap = 'resistor') {
  nonnegative(frequency, 'Frequency')
  if (frequency >= sampleRate / 2) throw new RangeError('Frequency must be below Nyquist.')
  const { b0, b1, a1 } = audioCoefficients(circuit, sampleRate, tap)
  const w = 2 * Math.PI * frequency / sampleRate
  const nr = b0 + b1 * Math.cos(w), ni = -b1 * Math.sin(w)
  const dr = 1 + a1 * Math.cos(w), di = -a1 * Math.sin(w)
  return {
    magnitude: Math.hypot(nr, ni) / Math.hypot(dr, di),
    phase: frequency === 0 ? (tap === 'capacitor' ? 0 : null) : Math.atan2(ni, nr) - Math.atan2(di, dr),
  }
}

export function format(value: number, digits = 3): string {
  if (value === Infinity) return '∞'
  if (value === -Infinity) return '−∞'
  return Number(value.toPrecision(digits)).toLocaleString('en-US', { maximumSignificantDigits: digits })
}
export function engineering(value: number, unit: string): string {
  const absolute = Math.abs(value)
  const [factor, prefix] = absolute >= 1e6 ? [1e6, 'M'] : absolute >= 1e3 ? [1e3, 'k'] : absolute >= 1 || absolute === 0 ? [1, ''] : absolute >= 1e-3 ? [1e-3, 'm'] : absolute >= 1e-6 ? [1e-6, 'µ'] : [1e-9, 'n']
  return `${format(value / Number(factor))} ${prefix}${unit}`
}

export const PRESETS = [
  { name: 'Tone control, bright', resistance: 10_000, capacitance: 10e-9, tap: 'capacitor' },
  { name: 'Tone control, dark', resistance: 10_000, capacitance: 47e-9, tap: 'capacitor' },
  { name: 'Tone control, closed', resistance: 100_000, capacitance: 22e-9, tap: 'capacitor' },
  { name: 'Coupling, full range', resistance: 100_000, capacitance: 100e-9, tap: 'resistor' },
  { name: 'Coupling, bass cut', resistance: 100_000, capacitance: 10e-9, tap: 'resistor' },
  { name: 'Coupling, extreme', resistance: 100_000, capacitance: 2.2e-9, tap: 'resistor' },
] as const satisfies readonly { name: string; resistance: number; capacitance: number; tap: Tap }[]
