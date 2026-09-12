import type { Sound } from './audio'
import type { Translator } from './ui'
import { REPO } from './ui'
interface Props {
  t: Translator; audioOn: boolean; busy: boolean; sound: Sound; bypass: boolean; volume: number
  onToggle: () => void; onSound: (sound: Sound) => void; onBypass: (value: boolean) => void; onVolume: (value: number) => void
}
export function AudioControls({ t, audioOn, busy, sound, bypass, volume, onToggle, onSound, onBypass, onVolume }: Props) {
  return <section className="listen-strip" aria-label={t('Zvuková ukázka', 'Audio demonstration')}>
    <div className="listen-heading"><h2>{t('Zvukový výstup', 'Audio output')}</h2><p>{t('Přehrávej riff a měň R nebo C. Filtr reaguje během přehrávání.', 'Play the riff and adjust R or C. The filter responds during playback.')}</p></div>
    <div className="audio-controls">
      <button className="primary" disabled={busy} onClick={onToggle}>{busy ? t('Načítám zvuk…', 'Loading audio…') : audioOn ? t('Zastavit zvuk', 'Stop audio') : t('▶ Zapnout zvuk', '▶ Start audio')}</button>
      <label className="select-label">{t('Ukázka', 'Sound')}<select value={sound} onChange={e => onSound(e.target.value as Sound)} disabled={busy}>
        <option value="guitar">{t('Kytarová nahrávka · riff E2', 'Recorded guitar · E2 riff')}</option>
        <option value="bass">{t('Stejný riff o oktávu níž', 'Same riff one octave lower')}</option>
        <option value="sine">{t('Sinus při zvolené f', 'Sine at selected f')}</option>
      </select></label>
      <div className="ab-control" role="group" aria-label={t('Zvukový výstup', 'Audio output')}><button aria-pressed={bypass} onClick={() => onBypass(true)}>A · {t('Bez filtru', 'Bypass')}</button><button aria-pressed={!bypass} onClick={() => onBypass(false)}>B · {t('Přes filtr', 'Filtered')}</button></div>
      <label className="volume">{t('Hlasitost', 'Volume')}<input aria-label={t('Hlasitost', 'Volume')} type="range" min="0" max="1" step="0.01" value={volume} onChange={e => onVolume(Number(e.target.value))}/></label>
    </div>
    <p className="audio-caption">{t('A/B používá stejné vstupní zesílení. Zeslabení je součást účinku filtru. Pro výrazný rozdíl vyzkoušej C = 2,2 nF. Posuvník f mění zvuk pouze v režimu Sinus.', 'A/B uses the same input gain. Attenuation is part of the filter effect. Try C = 2.2 nF for a stronger difference. The f slider changes audio only in Sine mode.')} <a href={`${REPO}/blob/main/docs/references.md#audio`}>FreePats · CC0</a></p>
  </section>
}
