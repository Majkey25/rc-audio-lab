import { Plot } from './Plot'
import { digitalResponse, engineering as eng, format, response } from './physics'
import type { Circuit, Tap } from './physics'
import type { Measurement } from './audio'
import type { Translator } from './ui'

const BLUE = '#2675cd', RUST = '#c4582e', GREEN = '#38754f', VIOLET = '#7a4fa3'

interface Props {
  t: Translator
  circuit: Circuit
  tap: Tap
  frequency: number
  fc: number
  hp: ReturnType<typeof response>
  phase: number
  sampleRate: number | null
  sinePoints: number[]
  frequencies: number[]
  measurement: Measurement | null
  audioOn: boolean
}

// The FFT gives ~1700 usable bins; averaging them into log-spaced buckets keeps the curve readable.
function buckets({ frequencies, gainDb }: Measurement, count = 96): [number, number][] {
  const low = Math.log10(20), high = Math.log10(20000), width = (high - low) / count
  const sums = new Float64Array(count), totals = new Uint32Array(count)
  for (let i = 0; i < frequencies.length; i++) {
    const slot = Math.floor((Math.log10(frequencies[i]) - low) / width)
    if (slot < 0 || slot >= count) continue
    sums[slot] += gainDb[i]; totals[slot]++
  }
  const points: [number, number][] = []
  for (let slot = 0; slot < count; slot++) {
    if (!totals[slot]) continue
    points.push([10 ** (low + (slot + .5) * width), sums[slot] / totals[slot]])
  }
  return points
}

export function AudioView({ t, circuit, tap, frequency, fc, hp, phase, sampleRate, sinePoints, frequencies, measurement, audioOn }: Props) {
  const lowPass = tap === 'capacitor'
  const filterName = lowPass ? t('dolní propusti', 'low-pass') : t('horní propusti', 'high-pass')
  const measured = measurement && measurement.frequencies.length > 8 ? buckets(measurement) : null
  const leadLabel = phase >= 0 ? t('Výstup předbíhá o', 'Output leads by') : t('Výstup se zpožďuje o', 'Output lags by')
  return <>
    <div className="plot-grid">
      <section className="instrument">
        <h2>{t('Vstup a výstup', 'Input and output')}</h2>
        <p className="micro">
          {t('Sinusový vstup', 'Sine input')} {eng(frequency, 'Hz')}. {leadLabel} {format(Math.abs(phase) * 180 / Math.PI)}°.
        </p>
        <Plot
          t={t}
          title={t('Vstupní a výstupní sinusovka', 'Input and output sine waves')}
          traces={[
            { name: t('Vstup · 1 V', 'Input · 1 V'), color: BLUE, points: sinePoints.map(n => [n / frequency * 1000, Math.sin(n * 2 * Math.PI)]) },
            { name: lowPass ? t('Výstup na C', 'Output across C') : t('Výstup na R', 'Output across R'), color: RUST, points: sinePoints.map(n => [n / frequency * 1000, hp.magnitude * Math.sin(n * 2 * Math.PI + phase)]) },
          ]}
          xDomain={[0, 2000 / frequency]}
          yDomain={[-1.1, 1.1]}
          xTicks={[0, 500 / frequency, 1000 / frequency, 1500 / frequency, 2000 / frequency]}
          yTicks={[-1, -.5, 0, .5, 1]}
          xLabel={t('Čas [ms]', 'Time [ms]')}
          yLabel={t('Napětí [V]', 'Voltage [V]')}
        />
        <div className="readout-row">
          <div><small>{t('Amplituda vstupu', 'Input amplitude')}</small><strong>1.00 V</strong></div>
          <div><small>{t('Amplituda výstupu', 'Output amplitude')}</small><strong className="output-color">{format(hp.magnitude)} V</strong></div>
        </div>
      </section>
      <section className="instrument">
        <h2>{t('Frekvenční charakteristika', 'Frequency response')}</h2>
        <p className="micro">
          {lowPass
            ? t('Výšky slábnou. Nízké frekvence se blíží úrovni vstupu.', 'Treble fades. Low frequencies approach the input level.')
            : t('Basy slábnou. Vysoké frekvence se blíží úrovni vstupu.', 'Bass fades. High frequencies approach the input level.')}
          {' '}
          {audioOn
            ? t('Fialová křivka odhaduje přenos z aktuálních spekter. Pro srovnání použij bílý šum; v režimu A má být přenos přibližně 0 dB.', 'The violet curve estimates response from the current spectra. Use white noise for comparison; in mode A the response should be approximately 0 dB.')
            : t('Po zapnutí zvuku se doplní odhad ze spekter.', 'Start audio to add a spectrum-based estimate.')}
        </p>
        <Plot
          t={t}
          title={t('Amplitudový přenos', 'Magnitude response')}
          traces={[
            { name: t('Ideální RC', 'Ideal RC'), color: RUST, points: frequencies.map(f => [f, response(circuit, f, tap).gainDb]) },
            ...(sampleRate && fc < sampleRate / 2 ? [{
              name: t('Digitální filtr', 'Digital filter'),
              color: GREEN,
              dashed: true,
              points: frequencies.filter(f => f < sampleRate / 2).map(f => [f, 20 * Math.log10(digitalResponse(circuit, f, sampleRate, tap).magnitude)] as [number, number]),
            }] : []),
            ...(audioOn && measured?.length ? [{ id: 'measured-response', name: t('Odhad ze spekter', 'Spectrum estimate'), color: VIOLET, points: measured }] : []),
          ]}
          xDomain={[20, 20000]}
          yDomain={[-60, 6]}
          log
          xTicks={[20, 100, 1000, 10000, 20000]}
          yTicks={[-60, -40, -20, 0]}
          marker={fc}
          markerLabel="fc · −3 dB"
          cursor={frequency}
          xLabel={t('Frekvence [Hz] · logaritmicky', 'Frequency [Hz] · logarithmic')}
          yLabel={t('Přenos [dB]', 'Gain [dB]')}
        />
        <div className="readout-row">
          <div><small>{t('Při', 'At')} {eng(frequency, 'Hz')}</small><strong data-testid="gain">{format(hp.gainDb)} dB</strong></div>
          <div><small>{t('Mezní frekvence', 'Cutoff')}</small><strong className="positive">{eng(fc, 'Hz')}</strong></div>
        </div>
        {fc < 20 && <p className="micro">{t('Mezní frekvence leží pod rozsahem grafu.', 'Cutoff is below the graph range.')}</p>}
      </section>
    </div>
    <details className="phase-panel">
      <summary>{t('Prozkoumat fázový posun', 'Explore the phase shift')}<span>{format(phase * 180 / Math.PI)}°</span></summary>
      <Plot
        t={t}
        title={t('Fázový posun', 'Phase shift')}
        traces={[{ name: t('Fáze výstupu', 'Output phase'), color: BLUE, points: frequencies.map(f => [f, (response(circuit, f, tap).phase ?? 0) * 180 / Math.PI]) }]}
        xDomain={[20, 20000]}
        yDomain={lowPass ? [-90, 0] : [0, 90]}
        log
        xTicks={[20, 100, 1000, 10000, 20000]}
        yTicks={lowPass ? [-90, -60, -45, -30, 0] : [0, 30, 45, 60, 90]}
        marker={fc}
        markerLabel={lowPass ? 'fc · −45°' : 'fc · +45°'}
        cursor={frequency}
        xLabel={t('Frekvence [Hz]', 'Frequency [Hz]')}
        yLabel={t('Fáze [°]', 'Phase [°]')}
      />
      <p>{lowPass
        ? t('Záporná fáze znamená pozdější vrchol výstupní sinusovky v rámci cyklu. Daleko nad mezní frekvencí se zpoždění blíží 90°.', 'Negative phase means a later output peak within a cycle. Far above cutoff the lag approaches 90°.')
        : t('Kladná fáze znamená dřívější vrchol výstupní sinusovky v rámci cyklu. Obvod nepředpovídá budoucnost. Při nulové frekvenci je výstup nulový a fáze nedefinovaná.', 'Positive phase means an earlier output peak within a cycle. The circuit does not predict the future. At DC the output is zero and phase is undefined.')}
      </p>
      <p className="micro">{t('Přenos i fáze patří', 'Magnitude and phase belong to')} {filterName}.</p>
    </details>
  </>
}
