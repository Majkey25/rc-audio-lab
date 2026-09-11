import { useEffect, useMemo, useRef, useState } from 'react'
import { Circuit } from './Circuit'
import { Control } from './Controls'
import { Knob } from './Knob'
import { AudioView } from './AudioView'
import { TimeView } from './TimeView'
import { Explanation } from './Explanation'
import { AudioEngine } from './audio'
import type { Sound } from './audio'
import { PRESETS, cutoff, engineering as eng, format, highPass, timeConstant, transient } from './physics'
import type { Direction } from './physics'
import { REPO } from './ui'
import type { Language, Translator } from './ui'
import './App.css'

const samples = (count: number, start: number, end: number) => Array.from({ length: count }, (_, i) => start + (end - start) * i / (count - 1))
const presetCs = ['Plné basové pásmo', 'Mírné potlačení basů', 'Silnější potlačení basů', 'Výrazná ukázka']

function App() {
  const [language, setLanguage] = useState<Language>(() => { try { return localStorage.getItem('rc-language') === 'en' ? 'en' : 'cs' } catch { return 'cs' } })
  const t: Translator = (cs, en) => language === 'cs' ? cs : en
  const [mode, setMode] = useState<'audio' | 'time'>('audio')
  const [resistance, setR] = useState<number>(100000), [capacitance, setC] = useState<number>(22e-9)
  const [frequency, setFrequency] = useState(82.4), [voltage, setVoltage] = useState(5)
  const [direction, setDirection] = useState<Direction>('charging'), [position, setPosition] = useState(1), [playing, setPlaying] = useState(false), [normalized, setNormalized] = useState(false)
  const positionRef = useRef(1), engine = useRef<AudioEngine | null>(null)
  const [audioOn, setAudioOn] = useState(false), [busy, setBusy] = useState(false), [sound, setSound] = useState<Sound>('guitar'), [bypass, setBypass] = useState(false), [volume, setVolume] = useState(.3)
  const [sampleRate, setSampleRate] = useState<number | null>(null), [error, setError] = useState('')
  const circuit = useMemo(() => ({ resistance, capacitance }), [resistance, capacitance])
  const tau = timeConstant(circuit), fc = cutoff(circuit), time = position * tau, state = transient(circuit, voltage, time, direction), hp = highPass(circuit, frequency), phase = hp.phase ?? 0
  const exactPreset = PRESETS.findIndex(p => p.resistance === resistance && p.capacitance === capacitance)

  function seek(value: number) { setPlaying(false); positionRef.current = value; setPosition(value) }
  function changeCircuit(r: number, c: number) { setR(r); setC(c); seek(0) }
  function playPause() {
    if (position >= 5) { positionRef.current = 0; setPosition(0) }
    setPlaying(!playing)
  }

  useEffect(() => { document.documentElement.lang = language; try { localStorage.setItem('rc-language', language) } catch {/* Storage is optional. */} }, [language])
  useEffect(() => {
    if (!playing) return
    let frame = 0, previous = performance.now()
    function tick(now: number) { const delta = Math.min(now - previous, 100); previous = now; positionRef.current = Math.min(5, positionRef.current + delta / 2000); setPosition(positionRef.current); if (positionRef.current < 5) frame = requestAnimationFrame(tick); else setPlaying(false) }
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame)
  }, [playing])
  useEffect(() => { const query = matchMedia('(prefers-reduced-motion: reduce)'); const stop = () => { if (query.matches) setPlaying(false) }; const hide = () => { if (document.hidden) setPlaying(false) }; query.addEventListener('change', stop); document.addEventListener('visibilitychange', hide); return () => { query.removeEventListener('change', stop); document.removeEventListener('visibilitychange', hide) } }, [])
  useEffect(() => { try { engine.current?.update({ ...circuit, sound, frequency, bypass, volume }) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Audio error') } }, [circuit, sound, frequency, bypass, volume])
  useEffect(() => () => { void engine.current?.stop() }, [])

  async function toggleAudio() { setBusy(true); setError(''); try { if (engine.current) { const old = engine.current; engine.current = null; await old.stop(); setAudioOn(false) } else { const next = new AudioEngine({ ...circuit, sound, frequency, bypass, volume }); engine.current = next; await next.start(); setSampleRate(next.sampleRate); setAudioOn(true) } } catch (cause) { if (engine.current) { await engine.current.stop(); engine.current = null } setAudioOn(false); setError(cause instanceof Error ? cause.message : 'Audio error') } finally { setBusy(false) } }

  const sinePoints = samples(220, 0, 2)
  const frequencies = samples(250, Math.log10(20), Math.log10(20000)).map(n => 10 ** n)
  const timeStates = samples(201, 0, 5).map(n => ({ n, ...transient(circuit, normalized ? 1 : voltage, n * tau, direction) }))
  const scale = normalized ? 1 : voltage || 1

  return <>
    <a className="skip-link" href="#lab">{t('Přejít na simulaci', 'Skip to simulator')}</a>
    <header className="site-header">
      <a className="brand" href="#"><span aria-hidden="true">─┤├─</span> RC Audio Lab</a>
      <nav aria-label={t('Projekt', 'Project')}>
        <a href={`${REPO}/blob/main/docs/project-report.md`}>{t('Semestrální práce', 'Project report')} ↗</a>
        <a href="#sources">{t('Zdroje', 'Sources')}</a>
        <a href={REPO}>GitHub ↗</a>
        <button className="language" onClick={() => setLanguage(language === 'cs' ? 'en' : 'cs')} aria-label={t('Switch to English', 'Přepnout do češtiny')}>{language === 'cs' ? 'English' : 'Čeština'}</button>
      </nav>
    </header>
    <main>
      <div className="intro">
        <h1>{t('Poslechni si, co mění kondenzátor', 'Hear what a capacitor changes')}</h1>
        <p>{t('Prozkoumej obvod pro potlačení basů. Změň součástku. Pochop výpočet. Poslechni si rozdíl.', 'Explore the bass-cut circuit. Change a component. Understand the calculation. Hear the difference.')}</p>
      </div>
      <div className="mode-tabs" role="group" aria-label={t('Režim simulace', 'Simulation mode')}>
        <button aria-pressed={mode === 'audio'} onClick={() => { setMode('audio'); setPlaying(false) }}>{t('Zvuk a frekvence', 'Audio & frequency')}</button>
        <button aria-pressed={mode === 'time'} onClick={() => { setMode('time'); setPlaying(false) }}>{t('Nabíjení a energie', 'Charging & energy')}</button>
        <span>{t('Jeden obvod. Dva pohledy.', 'One circuit. Two perspectives.')}</span>
      </div>
      <div className="workbench" id="lab">
        <aside className="parameter-rail" aria-label={t('Parametry obvodu', 'Circuit parameters')}>
          <label className="select-label">
            {t('Výukové nastavení', 'Educational preset')}
            <select aria-label={t('Výukové nastavení', 'Educational preset')} value={exactPreset < 0 ? 'custom' : exactPreset} onChange={e => { const p = PRESETS[Number(e.target.value)]; if (p) changeCircuit(p.resistance, p.capacitance) }}>
              <option value="custom" disabled>{t('Vlastní hodnoty', 'Custom values')}</option>
              {PRESETS.map((p, i) => <option key={p.name} value={i}>{t(presetCs[i], p.name)}</option>)}
            </select>
          </label>
          <p className="preset-note">{t('Modelové hodnoty, nikoli kopie konkrétního výrobku.', 'Teaching values, not a model of a named product.')}</p>
          <Control t={t} label={t('Odpor R', 'Resistance R')} value={resistance} min={10000} max={1000000} unit="Ω" log onChange={r => changeCircuit(r, capacitance)}/>
          <Control t={t} label={t('Kapacita C', 'Capacitance C')} value={capacitance} min={1e-9} max={1e-6} unit="F" log onChange={c => changeCircuit(resistance, c)}/>
          {mode === 'audio' ? <>
            <Control t={t} label={t('Frekvence f', 'Frequency f')} value={frequency} min={20} max={20000} unit="Hz" log onChange={setFrequency}/>
            <button className="text-button" disabled={fc < 20 || fc > 20000} onClick={() => setFrequency(fc)}>{t('Nastavit f na mezní frekvenci', 'Set f to cutoff frequency')}</button>
          </> : <>
            <Control t={t} label={t('Napětí zdroje U', 'Source voltage U')} value={voltage} min={0} max={12} step={.1} unit="V" onChange={u => { setVoltage(u); seek(0) }}/>
            <label className="select-label">
              {t('Děj', 'Process')}
              <select value={direction} onChange={e => { setDirection(e.target.value as Direction); seek(0) }}>
                <option value="charging">{t('Nabíjení z 0 V', 'Charge from 0 V')}</option>
                <option value="discharging">{t('Vybíjení z U', 'Discharge from U')}</option>
              </select>
            </label>
            <label className="checkbox"><input type="checkbox" checked={normalized} onChange={e => setNormalized(e.target.checked)}/>{t('Normalizovat grafy k U', 'Normalize plots to U')}</label>
          </>}
          <div className="parameter-summary">
            <div><span className="symbol">τ</span><span><strong data-testid="tau">{eng(tau, 's')}</strong><small>{t('časová konstanta', 'time constant')} · R × C</small></span></div>
            <div><span className="symbol">f<sub>c</sub></span><span><strong data-testid="cutoff">{eng(fc, 'Hz')}</strong><small>{t('mezní frekvence', 'cutoff')} · 1 / (2πRC)</small></span></div>
          </div>
        </aside>
        <section className="instruments" aria-label={t('Schéma a grafy', 'Circuit and plots')}>
          <div className="instrument schematic">
            <div className="instrument-heading">
              <h2>{t('Vazební RC obvod', 'The coupling circuit')}</h2>
              <span>{t('Horní propust · výstup na R', 'High-pass · output across R')}</span>
            </div>
            <Circuit t={t} r={resistance} c={capacitance} audio={mode === 'audio'} charge={voltage ? state.uc / voltage : 0} current={state.current} voltage={voltage} discharging={direction === 'discharging'}/>
          </div>
          {mode === 'audio'
            ? <AudioView t={t} circuit={circuit} frequency={frequency} fc={fc} hp={hp} phase={phase} sampleRate={sampleRate} sinePoints={sinePoints} frequencies={frequencies}/>
            : <TimeView t={t} resistance={resistance} capacitance={capacitance} voltage={voltage} direction={direction} normalized={normalized} tau={tau} time={time} position={position} playing={playing} state={state} timeStates={timeStates} scale={scale} onSeek={seek} onPlayPause={playPause}/>}
        </section>
        <Explanation t={t} mode={mode} direction={direction} frequency={frequency} resistance={resistance} capacitance={capacitance} voltage={voltage} position={position} tau={tau} fc={fc} hp={hp} phase={phase} state={state}/>
      </div>
      <section className="listen-strip" aria-label={t('Zvuková ukázka', 'Audio demonstration')}>
        <div>
          <h2>{t('Poslechni si rozdíl', 'Listen to the difference')}</h2>
          <p>{t('Syntetické tóny generované v prohlížeči.', 'Synthetic tones generated in your browser.')}</p>
        </div>
        <button className="primary" disabled={busy} onClick={() => void toggleAudio()}>{busy ? t('Spouštím…', 'Updating…') : audioOn ? t('Zastavit zvuk', 'Stop audio') : t('▶ Zapnout zvuk', '▶ Start audio')}</button>
        <label className="select-label">
          {t('Zvuk', 'Sound')}
          <select value={sound} onChange={e => setSound(e.target.value as Sound)}>
            <option value="guitar">{t('Harmonický tón kytary · E2', 'Harmonic guitar · E2')}</option>
            <option value="bass">{t('Harmonický tón baskytary · E1', 'Harmonic bass · E1')}</option>
            <option value="sine">{t('Sinus při zvolené f', 'Sine at selected f')}</option>
          </select>
        </label>
        <div className="ab-control" role="group" aria-label={t('Zvukový výstup', 'Audio output')}>
          <button aria-pressed={bypass} onClick={() => setBypass(true)}>{t('Bez filtru', 'Bypass')}</button>
          <button aria-pressed={!bypass} onClick={() => setBypass(false)}>{t('Přes filtr', 'Filtered')}</button>
        </div>
        <label className="volume">{t('Hlasitost', 'Volume')}<input aria-label={t('Hlasitost', 'Volume')} type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(Number(e.target.value))}/></label>
      </section>
      <p className="micro audio-note">{audioOn ? `${t('Zvuk běží', 'Audio running')} · ${format(sampleRate ?? 48000, 5)} Hz. ` : ''}{t('Zvuk používá digitální filtr prvního řádu se stejnou mezní frekvencí. Zelená přerušovaná křivka ukazuje jeho odchylku od analogového modelu. Graf sinusovek představuje ideální obvod, ne nahrávku. Zkreslení zesilovače zde nesimulujeme.', 'Audio uses a first-order digital filter with the same cutoff. The dashed green curve shows its difference from the analog model. Sine plots describe the ideal circuit, not a recording. Amplifier distortion is not simulated.')}</p>
      {error && <p className="error" role="alert">{t('Zvuk se nepodařilo spustit nebo aktualizovat', 'Could not start or update audio')}: {error}</p>}
      <section className="components-section">
        <div>
          <h2>{t('Ze schématu do ruky', 'From schematic to hardware')}</h2>
          <p>{t('Fotografie skutečných součástek a ovladač, který si můžeš vyzkoušet.', 'Real component photographs and a control you can try.')}</p>
          <Knob value={resistance} onChange={r => changeCircuit(r, capacitance)} t={t}/>
        </div>
        <div className="component-photos">
          <figure>
            <img src={`${import.meta.env.BASE_URL}components/potentiometer.jpg`} alt={t('Skutečný otočný potenciometr s hřídelí a třemi vývody', 'Real rotary potentiometer with a shaft and three terminals')} loading="lazy"/>
            <figcaption>{t('Potenciometr: otáčíš hřídelí, jezdec mění odpor.', 'Potentiometer: turn the shaft, the wiper changes resistance.')} <a href={`${REPO}/blob/main/docs/references.md#photographs`}>{t('Autor a licence', 'Credit and license')} ↗</a></figcaption>
          </figure>
          <figure>
            <img src={`${import.meta.env.BASE_URL}components/capacitor.jpg`} alt={t('Skutečný fóliový kondenzátor', 'Real film capacitor')} loading="lazy"/>
            <figcaption>{t('Kondenzátor: běžný pevný typ nemá otočný ovladač. Jinou kapacitu získáš výměnou. Fotografie neurčuje aktuální simulovanou hodnotu.', 'Capacitor: a fixed type has no rotary control. Change the component to change its capacitance. The photo does not specify the simulated value.')} <a href={`${REPO}/blob/main/docs/references.md#photographs`}>{t('Autor a licence', 'Credit and license')} ↗</a></figcaption>
          </figure>
        </div>
      </section>
      <section className="learn-more" id="sources">
        <div>
          <h2>{t('Kde to potkáš v hudbě', 'Where this lives in music')}</h2>
          <p>{t('Vazební kondenzátor odděluje stejnosměrná pracovní napětí zesilovacích stupňů. Se vstupním odporem dalšího stupně určuje přenos basů. Menší C zvýší mezní frekvenci. Před zkreslujícím stupněm tak může změnit, jak silně basy tento stupeň budí.', 'A coupling capacitor separates DC operating points of amplifier stages. With the next stage’s input resistance, it sets bass transmission. Smaller C raises cutoff. Before distortion, it can change how strongly bass drives that stage.')}</p>
          <p>{t('Pasivní magnetický snímač má také indukčnost. Jeho tónová clona s kabelem a zátěží je složitější. Zde modelujeme jednoduchou vazbu za ideálním zdrojem, nikoli celý snímač.', 'A passive magnetic pickup also has inductance. Its tone control, cable and load form a more complex circuit. Here we model simple coupling after an ideal source, not a complete pickup.')}</p>
        </div>
        <div>
          <h2>{t('Zdroje a předpoklady', 'Sources & assumptions')}</h2>
          <p>{t('Ideální R, C a zdroj. Bez odporu zdroje, svodu, ESR, indukčnosti snímače a přebuzení. R představuje vstupní zátěž dalšího stupně.', 'Ideal R, C and source. No source resistance, leakage, ESR, pickup inductance or clipping. R represents the next stage’s input load.')}</p>
          <ul>
            <li><a href="https://ocw.mit.edu/courses/ec-s06-practical-electronics-fall-2004/5d70e7c37b7dc19e1e947e7a7b1d4ac6_MITEC_S06F04_lec04.pdf">MIT · RC {t('obvody a filtry', 'circuits and filters')} ↗</a></li>
            <li><a href={`${REPO}/blob/main/docs/physics.md`}>{t('Odvození a digitální model', 'Derivation and digital model')} ↗</a></li>
            <li><a href={`${REPO}/blob/main/docs/references.md`}>{t('Přehled zdrojů a licencí', 'References and licenses')} ↗</a></li>
            <li><a href={`${REPO}/blob/main/docs/project-report.md`}>{t('Semestrální práce', 'University report')} ↗</a></li>
          </ul>
        </div>
      </section>
    </main>
    <footer>RC Audio Lab<span>{t('Každý výsledek má svůj výpočet. Kód pod licencí MIT.', 'Every result has a calculation. MIT-licensed code.')}</span><a href={REPO}>{t('Zdrojový kód', 'View source')} ↗</a></footer>
  </>
}
export default App
