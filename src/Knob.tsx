import { useRef } from 'react'
import { engineering } from './physics'
import type { Translator } from './ui'
export function Knob({ value, onChange, t }: { value: number; onChange: (value: number) => void; t: Translator }) {
  const drag = useRef<{ y: number; value: number } | null>(null)
  const proportion = (value - 10000) / 990000
  const angle = -135 + proportion * 270
  const update = (next: number) => onChange(Math.max(10000, Math.min(1000000, next)))
  return <div className="knob-control"><div className="knob" role="slider" tabIndex={0} aria-label={t('Otočný ovladač odporu','Rotary resistance control')} aria-valuemin={10000} aria-valuemax={1000000} aria-valuenow={Math.round(value)} aria-valuetext={engineering(value,'Ω')}
    onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { y: e.clientY, value } }}
    onPointerMove={e => { if (drag.current) update(drag.current.value + (drag.current.y - e.clientY) * 6600) }}
    onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }}
    onKeyDown={e => { const actions: Record<string,number> = { ArrowUp: value + 10000, ArrowRight: value + 10000, ArrowDown: value - 10000, ArrowLeft: value - 10000, Home: 10000, End: 1000000 }; if(e.key in actions){e.preventDefault(); update(actions[e.key])} }}>
    <svg viewBox="0 0 170 170" aria-hidden="true"><path d="M35 128 A65 65 0 1 1 135 128" fill="none" stroke="#d2dce5" strokeWidth="7" /><circle cx="85" cy="80" r="47" fill="#213a54" stroke="#10273c" strokeWidth="2"/><g transform={`rotate(${angle} 85 80)`}><path d="M85 44V58" stroke="#fff" strokeWidth="4" strokeLinecap="round"/></g><text x="85" y="148" textAnchor="middle">{engineering(value,'Ω')}</text></svg>
  </div><div><h3>{t('Otoč odporem','Turn the resistance')}</h3><p>{t('Táhni nahoru / dolů nebo použij šipky. Stejná hodnota R řídí schéma, grafy i zvuk.','Drag up / down or use the arrow keys. The same R drives the circuit, plots and audio.')}</p><p className="micro">{t('Výukový lineární ovladač 10 kΩ–1 MΩ. U reálného potenciometru jezdec mění délku odporové dráhy. Nejde o model konkrétního pedálu.','Educational linear control, 10 kΩ–1 MΩ. A real potentiometer moves a wiper along a resistive track. This is not a model of a named pedal.')}</p></div></div>
}
