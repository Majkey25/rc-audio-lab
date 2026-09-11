import { Plot } from './Plot'
import { engineering as eng, format } from './physics'
import type { Direction, transient } from './physics'
import type { Translator } from './ui'

const BLUE = '#2675cd', RUST = '#c4582e'

type State = ReturnType<typeof transient>
export type TimeState = State & { n: number }

interface Props {
  t: Translator
  resistance: number
  capacitance: number
  voltage: number
  direction: Direction
  normalized: boolean
  tau: number
  time: number
  position: number
  playing: boolean
  state: State
  timeStates: TimeState[]
  scale: number
  onSeek: (value: number) => void
  onPlayPause: () => void
}

export function TimeView({ t, resistance, capacitance, voltage, direction, normalized, tau, time, position, playing, state, timeStates, scale, onSeek, onPlayPause }: Props) {
  return <>
    <div className="transport">
      <button className="primary" onClick={onPlayPause}>{playing ? t('Pozastavit', 'Pause') : t('Spustit děj', 'Play transition')}</button>
      <button onClick={() => onSeek(0)}>{t('Od začátku', 'Reset')}</button>
      <button onClick={() => onSeek(1)}>{t('Přejít na τ', 'Jump to τ')}</button>
      <label>
        {t('Čas', 'Time')}: <output>{format(position)}τ · {eng(time, 's')}</output>
        <input aria-label={t('Čas v násobcích tau', 'Time in time constants')} type="range" min="0" max="5" step="0.01" value={position} onChange={e => onSeek(Number(e.target.value))}/>
      </label>
    </div>
    <p className="micro">
      {t('Animace je zpomalená: jedna τ trvá na obrazovce 2 sekundy. V obvodu je to', 'Animation is slowed: one τ takes 2 screen seconds. In the circuit it is')} {eng(tau, 's')}. {t('Nic se nespouští automaticky.', 'Nothing starts automatically.')}
    </p>
    <div className="plot-grid">
      <section className="instrument">
        <h2>{t('Jak se rozděluje napětí', 'Where the voltage goes')}</h2>
        <Plot
          t={t}
          title={t('Napětí na C a R', 'Voltages across C and R')}
          traces={[
            { name: 'uC', color: BLUE, points: timeStates.map(s => [s.n, s.uc]) },
            { name: 'uR', color: RUST, points: timeStates.map(s => [s.n, s.ur]) },
          ]}
          xDomain={[0, 5]}
          yDomain={[direction === 'charging' ? 0 : -scale, scale]}
          xTicks={[0, 1, 2, 3, 4, 5]}
          yTicks={direction === 'charging' ? [0, scale / 2, scale] : [-scale, 0, scale]}
          xLabel={t('Čas / τ', 'Time / τ')}
          yLabel={normalized ? t('Napětí / U', 'Voltage / U') : t('Napětí [V]', 'Voltage [V]')}
          marker={1}
          markerLabel="τ"
          cursor={position}
        />
        <div className="readout-row">
          <div><small>{t('Kondenzátor', 'Capacitor')} uC</small><strong data-testid="uc">{eng(state.uc, 'V')}</strong></div>
          <div><small>{t('Rezistor', 'Resistor')} uR</small><strong>{eng(state.ur, 'V')}</strong></div>
        </div>
      </section>
      <section className="instrument">
        <h2>{t('Proud rezistorem', 'Current through R')}</h2>
        <Plot
          t={t}
          title={t('Proud během přechodu', 'Transition current')}
          traces={[{ name: 'i', color: RUST, points: timeStates.map(s => [s.n, normalized ? s.current * resistance : s.current * 1e6]) }]}
          xDomain={[0, 5]}
          yDomain={direction === 'charging' ? [0, normalized ? 1 : scale / resistance * 1e6] : [-(normalized ? 1 : scale / resistance * 1e6), 0]}
          xTicks={[0, 1, 2, 3, 4, 5]}
          yTicks={direction === 'charging' ? [0, normalized ? 1 : scale / resistance * 1e6] : [-(normalized ? 1 : scale / resistance * 1e6), 0]}
          xLabel={t('Čas / τ', 'Time / τ')}
          yLabel={normalized ? 'i / (U/R)' : t('Proud [µA]', 'Current [µA]')}
          marker={1}
          markerLabel="τ"
          cursor={position}
        />
        <div className="readout-row">
          <div><small>{t('Proud', 'Current')} i</small><strong>{eng(state.current, 'A')}</strong></div>
          <div><small>{t('Výkon', 'Power')} i²R</small><strong>{eng(state.power, 'W')}</strong></div>
        </div>
      </section>
    </div>
    <section className="energy-strip">
      <h2>{t('Energie se neztrácí', 'Energy does not disappear')}</h2>
      <p>{direction === 'charging'
        ? t('Energie zdroje = energie elektrického pole + teplo na R.', 'Source energy = electric-field energy + heat in R.')
        : t('Počáteční energie kondenzátoru = zbývající energie pole + teplo. Zdroj nic nedodává.', 'Initial capacitor energy = remaining field energy + heat. The source supplies nothing.')}</p>
      <div className="energy-values">
        <span>{t('Uloženo', 'Stored')}<strong>{eng(state.stored, 'J')}</strong></span>
        <span>{t('Teplo na R', 'Heat in R')}<strong data-testid="heat">{eng(state.heat, 'J')}</strong></span>
        <span>{direction === 'charging' ? t('Ze zdroje', 'From source') : t('Počáteční energie', 'Initial energy')}<strong>{eng(direction === 'charging' ? state.supplied : .5 * capacitance * voltage ** 2, 'J')}</strong></span>
      </div>
      <p className="checkpoint">
        {t('V čase τ', 'At τ')}: {direction === 'charging' ? 'uC = 63.212% U; uR = 36.788% U.' : 'uC = 36.788% U; i < 0.'} WR = ½CU²(1 − e⁻²) = 0.432332 CU².
      </p>
    </section>
  </>
}
