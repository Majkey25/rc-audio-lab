import { useEffect, useMemo, useRef, useState } from 'react'
import { Circuit } from './Circuit'
import { Control } from './Controls'
import { AudioView } from './AudioView'
import { TimeView } from './TimeView'
import { Explanation } from './Explanation'
import { AudioEngine } from './audio'
import { AudioControls } from './AudioControls'
import type { AudioSettings, Sound } from './audio'
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
  const [resistance, setR] = useState<number>(100000), [capacitance, setC] = useState<number>(10e-9)
  const [frequency, setFrequency] = useState(82.4), [voltage, setVoltage] = useState(5)
  const [direction, setDirection] = useState<Direction>('charging'), [position, setPosition] = useState(1), [playing, setPlaying] = useState(false), [normalized, setNormalized] = useState(false)
  const positionRef = useRef(1), engine = useRef<AudioEngine | null>(null)
  const [audioOn, setAudioOn] = useState(false), [busy, setBusy] = useState(false), [sound, setSound] = useState<Sound>('guitar'), [bypass, setBypass] = useState(false), [volume, setVolume] = useState(.3)
  const [sampleRate, setSampleRate] = useState<number | null>(null), [error, setError] = useState('')
  const latestAudio = useRef<AudioSettings>({ resistance, capacitance, sound, frequency, bypass, volume })
  const audioRequest = useRef(0)
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
    // The first frame timestamp can predate the effect, so the step is clamped to a forward step.
    function tick(now: number) { const delta = Math.min(Math.max(now - previous, 0), 100); previous = now; positionRef.current = Math.min(5, positionRef.current + delta / 2000); setPosition(positionRef.current); if (positionRef.current < 5) frame = requestAnimationFrame(tick); else setPlaying(false) }
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame)
  }, [playing])
  useEffect(() => { const query = matchMedia('(prefers-reduced-motion: reduce)'); const stop = () => { if (query.matches) setPlaying(false) }; const hide = () => { if (document.hidden) setPlaying(false) }; query.addEventListener('change', stop); document.addEventListener('visibilitychange', hide); return () => { query.removeEventListener('change', stop); document.removeEventListener('visibilitychange', hide) } }, [])
  useEffect(() => { latestAudio.current = { ...circuit, sound, frequency, bypass, volume }; engine.current?.update(latestAudio.current) }, [circuit, sound, frequency, bypass, volume])
  useEffect(() => () => { audioRequest.current++; void engine.current?.stop() }, [])

  async function toggleAudio() {
    const request = ++audioRequest.current
    setBusy(true); setError('')
    try {
      if (engine.current) {
        const old = engine.current; engine.current = null
        await old.stop(); setAudioOn(false)
      } else {
        const next = await AudioEngine.create(latestAudio.current)
        if (request !== audioRequest.current) { await next.stop(); return }
        engine.current = next
        next.update(latestAudio.current)
        await next.start()
        setSampleRate(next.sampleRate); setAudioOn(true)
      }
    } catch (cause) {
      if (engine.current) { await engine.current.stop(); engine.current = null }
      setAudioOn(false); setError(cause instanceof Error ? cause.message : 'Audio error')
    } finally { if (request === audioRequest.current) setBusy(false) }
  }

  const sinePoints = samples(220, 0, 2)
  const frequencies = samples(250, Math.log10(20), Math.log10(20000)).map(n => 10 ** n)
  const normalizePlot = normalized && voltage > 0
  const timeStates = samples(201, 0, 5).map(n => ({ n, ...transient(circuit, normalizePlot ? 1 : voltage, n * tau, direction) }))
  const scale = normalizePlot ? 1 : voltage || 1

  return <>
    <a className="skip-link" href="#lab">{t('Přejít na simulaci', 'Skip to simulator')}</a>
    <header className="site-header">
      <a className="brand" href="#"><span aria-hidden="true">─┤├─</span> RC Audio Lab</a>
      <nav aria-label={t('Projekt', 'Project')}>
        <a href={`${REPO}/blob/main/docs/project-report.md`}>{t('Zápočtový projekt', 'Project report')} ↗</a>
        <a href={`${REPO}/blob/main/docs/references.md`}>{t('Zdroje', 'Sources')} ↗</a>
        <a href={REPO}>GitHub ↗</a>
        <button className="language" onClick={() => setLanguage(language === 'cs' ? 'en' : 'cs')} aria-label={t('Switch to English', 'Přepnout do češtiny')}>{language === 'cs' ? 'English' : 'Čeština'}</button>
      </nav>
    </header>
    <main>
      <div className="intro">
        <h1>{t('Simulace RC obvodu', 'RC circuit simulation')}</h1>
        <p>{t('Vazební kondenzátor v pedálu nebo zesilovači: přenos basů, nabíjení a energie.', 'A coupling capacitor in a pedal or amplifier: bass response, charging and energy.')}</p>
      </div>
      <div className="mode-tabs" role="group" aria-label={t('Režim simulace', 'Simulation mode')}>
        <button aria-pressed={mode === 'audio'} onClick={() => { setMode('audio'); setPlaying(false) }}>{t('Zvuk a frekvence', 'Audio & frequency')}</button>
        <button aria-pressed={mode === 'time'} onClick={() => { setMode('time'); setPlaying(false) }}>{t('Nabíjení a energie', 'Charging & energy')}</button>
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
            <label className="checkbox"><input type="checkbox" checked={normalizePlot} disabled={voltage === 0} onChange={e => setNormalized(e.target.checked)}/>{t('Normalizovat grafy k U', 'Normalize plots to U')}</label>
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
            <Circuit t={t} r={resistance} c={capacitance} audio={mode === 'audio'} charge={voltage ? state.uc / voltage : 0} current={state.current} voltage={voltage} discharging={direction === 'discharging'} onResistanceChange={r => changeCircuit(r, capacitance)}/>
          </div>
          <AudioControls t={t} audioOn={audioOn} busy={busy} sound={sound} bypass={bypass} volume={volume} onToggle={() => void toggleAudio()} onSound={setSound} onBypass={setBypass} onVolume={setVolume}/>
          {mode === 'audio'
            ? <AudioView t={t} circuit={circuit} frequency={frequency} fc={fc} hp={hp} phase={phase} sampleRate={sampleRate} sinePoints={sinePoints} frequencies={frequencies}/>
            : <TimeView t={t} resistance={resistance} capacitance={capacitance} voltage={voltage} direction={direction} normalized={normalizePlot} tau={tau} time={time} position={position} playing={playing} state={state} timeStates={timeStates} scale={scale} onSeek={seek} onPlayPause={playPause}/>}
        </section>
        <Explanation t={t} mode={mode} direction={direction} frequency={frequency} resistance={resistance} capacitance={capacitance} voltage={voltage} position={position} tau={tau} fc={fc} hp={hp} phase={phase} state={state}/>
      </div>
      <p className="micro audio-note">{audioOn ? `${t('Vzorkování', 'Sample rate')}: ${format(sampleRate ?? 48000, 5)} Hz. ` : ''}{t('Zelená přerušovaná křivka ukazuje přenos digitálního filtru. Graf sinusovek zobrazuje ideální analogový obvod.', 'The green dashed curve shows the digital filter response. Sine plots show the ideal analog circuit.')}</p>
      {error && <p className="error" role="alert">{t('Zvuk se nepodařilo spustit nebo aktualizovat', 'Could not start or update audio')}: {error}</p>}
    </main>
  </>
}
export default App
