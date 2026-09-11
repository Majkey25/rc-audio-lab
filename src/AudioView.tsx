import { Plot } from './Plot'
import { digitalResponse, engineering as eng, format, highPass } from './physics'
import type { Circuit } from './physics'
import type { Translator } from './ui'

const BLUE = '#2675cd', RUST = '#c4582e', GREEN = '#38754f'

interface Props {
  t: Translator
  circuit: Circuit
  frequency: number
  fc: number
  hp: ReturnType<typeof highPass>
  phase: number
  sampleRate: number | null
  sinePoints: number[]
  frequencies: number[]
}

export function AudioView({ t, circuit, frequency, fc, hp, phase, sampleRate, sinePoints, frequencies }: Props) {
  return <>
    <div className="plot-grid">
      <section className="instrument">
        <h2>{t('Vstup a výstup', 'Input and output')}</h2>
        <p className="micro">
          {t('Sinusový vstup', 'Sine input')} {eng(frequency, 'Hz')}. {t('Výstup předbíhá o', 'Output leads by')} {format(phase * 180 / Math.PI)}°.
        </p>
        <Plot
          t={t}
          title={t('Vstupní a výstupní sinusovka', 'Input and output sine waves')}
          traces={[
            { name: t('Vstup · 1 V', 'Input · 1 V'), color: BLUE, points: sinePoints.map(n => [n / frequency * 1000, Math.sin(n * 2 * Math.PI)]) },
            { name: t('Výstup na R', 'Output across R'), color: RUST, points: sinePoints.map(n => [n / frequency * 1000, hp.magnitude * Math.sin(n * 2 * Math.PI + phase)]) },
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
        <p className="micro">{t('Nízké tóny slábnou. Vyšší se blíží úrovni vstupu.', 'Low frequencies fade. Higher ones approach the input level.')}</p>
        <Plot
          t={t}
          title={t('Amplitudový přenos horní propusti', 'High-pass magnitude')}
          traces={[
            { name: t('Ideální RC', 'Ideal RC'), color: RUST, points: frequencies.map(f => [f, highPass(circuit, f).gainDb]) },
            ...(sampleRate ? [{
              name: t('Zvukový digitální filtr', 'Digital audio filter'),
              color: GREEN,
              dashed: true,
              points: frequencies.filter(f => f < sampleRate / 2).map(f => [f, 20 * Math.log10(digitalResponse(circuit, f, sampleRate).magnitude)] as [number, number]),
            }] : []),
          ]}
          xDomain={[20, 20000]}
          yDomain={[-60, 2]}
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
        title={t('Fázový posun', 'Phase lead')}
        traces={[{ name: t('Předbíhání výstupu', 'Output phase lead'), color: BLUE, points: frequencies.map(f => [f, (highPass(circuit, f).phase ?? 0) * 180 / Math.PI]) }]}
        xDomain={[20, 20000]}
        yDomain={[0, 90]}
        log
        xTicks={[20, 100, 1000, 10000, 20000]}
        yTicks={[0, 30, 45, 60, 90]}
        marker={fc}
        markerLabel="fc · +45°"
        cursor={frequency}
        xLabel={t('Frekvence [Hz]', 'Frequency [Hz]')}
        yLabel={t('Fáze [°]', 'Phase [°]')}
      />
      <p>{t('Kladná fáze znamená dřívější vrchol výstupní sinusovky v rámci cyklu. Obvod nepředpovídá budoucnost. Při nulové frekvenci je výstup nulový a fáze nedefinovaná.', 'Positive phase means an earlier output peak within a cycle. The circuit does not predict the future. At DC the output is zero and phase is undefined.')}</p>
    </details>
  </>
}
