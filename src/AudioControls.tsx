import type { Sound } from './audio'
import type { Translator } from './ui'
import { REPO } from './ui'
interface Props {
  t: Translator; audioOn: boolean; busy: boolean; sound: Sound; bypass: boolean; volume: number
  onToggle: () => void; onSound: (sound: Sound) => void; onBypass: (value: boolean) => void; onVolume: (value: number) => void
}
export function AudioControls({ t, audioOn, busy, sound, bypass, volume, onToggle, onSound, onBypass, onVolume }: Props) {
  return <section className="listen-strip" aria-label={t('Zvuková ukázka', 'Audio demonstration')}>
    <div className="listen-heading"><h2>{t('Zvukový výstup', 'Audio output')}</h2><p>{t('Přehrávej a měň R, C nebo odbočku výstupu. Filtr reaguje okamžitě.', 'Play, then change R, C or the output tap. The filter responds immediately.')}</p></div>
    <div className="audio-controls">
      <button className="primary" disabled={busy} onClick={onToggle}>{busy ? t('Načítám zvuk…', 'Loading audio…') : audioOn ? t('Zastavit zvuk', 'Stop audio') : t('▶ Zapnout zvuk', '▶ Start audio')}</button>
      <label className="select-label">{t('Ukázka', 'Sound')}<select value={sound} onChange={e => onSound(e.target.value as Sound)} disabled={busy}>
        <option value="guitar">{t('Kytarová nahrávka · riff E2', 'Recorded guitar · E2 riff')}</option>
        <option value="bass">{t('Stejný riff o oktávu níž', 'Same riff one octave lower')}</option>
        <option value="sine">{t('Sinus při zvolené f', 'Sine at selected f')}</option>
        <option value="noise">{t('Bílý šum · měří přenos', 'White noise · measures the response')}</option>
      </select></label>
      <div className="ab-control" role="group" aria-label={t('Zvukový výstup', 'Audio output')}><button aria-pressed={bypass} onClick={() => onBypass(true)}>A · {t('Bez filtru', 'Bypass')}</button><button aria-pressed={!bypass} onClick={() => onBypass(false)}>B · {t('Přes filtr', 'Filtered')}</button></div>
      <label className="volume">{t('Hlasitost', 'Volume')}<input aria-label={t('Hlasitost', 'Volume')} type="range" min="0" max="1" step="0.01" value={volume} onChange={e => onVolume(Number(e.target.value))}/></label>
    </div>
    <p className="audio-caption">{t('A/B používá stejné vstupní zesílení, takže zeslabení patří k účinku filtru. Nejlépe je rozdíl slyšet na dolní propusti, kde ubývají výšky. Bílý šum vykreslí změřenou křivku přenosu. Posuvník f mění zvuk jen u sinusovky.', 'A/B keeps the same input gain, so attenuation is part of the filter effect. The difference is clearest on the low-pass, where treble disappears. White noise traces the measured response curve. The f slider changes audio only for the sine.')} <a href={`${REPO}/blob/main/docs/references.md#audio`}>FreePats · CC0</a></p>
  </section>
}
