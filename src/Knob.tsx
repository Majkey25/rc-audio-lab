import { useRef } from 'react'
import { engineering } from './physics'
import type { Translator } from './ui'
export function Knob({ value, onChange, t }: { value: number; onChange: (value: number) => void; t: Translator }) {
  const drag = useRef<{ y: number; value: number } | null>(null)
  const proportion = (Math.log10(value) - 4) / 2
  const angle = -135 + proportion * 270
  const update = (next: number) => onChange(Math.max(10000, Math.min(1000000, next)))
  return <div className="knob-control"><div className="knob" role="slider" tabIndex={0} aria-label={t('Otočný ovladač odporu','Rotary resistance control')} aria-valuemin={10000} aria-valuemax={1000000} aria-valuenow={Math.round(value)} aria-valuetext={engineering(value,'Ω')}
    onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { y: e.clientY, value } }}
    onPointerMove={e => { if (drag.current) update(drag.current.value * 10 ** ((drag.current.y - e.clientY) / 75)) }}
    onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }}
    onKeyDown={e => { const actions: Record<string,number> = { ArrowUp: value * 10 ** .025, ArrowRight: value * 10 ** .025, ArrowDown: value / 10 ** .025, ArrowLeft: value / 10 ** .025, Home: 10000, End: 1000000 }; if(e.key in actions){e.preventDefault(); update(actions[e.key])} }}>
    <svg viewBox="0 0 170 170" aria-hidden="true"><path d="M35 128 A65 65 0 1 1 135 128" fill="none" stroke="#d2dce5" strokeWidth="7" /><circle cx="85" cy="80" r="47" fill="#213a54" stroke="#10273c" strokeWidth="2"/><g transform={`rotate(${angle} 85 80)`}><path d="M85 44V58" stroke="#fff" strokeWidth="4" strokeLinecap="round"/></g><text x="85" y="148" textAnchor="middle">{engineering(value,'Ω')}</text></svg>
  </div><p className="micro">{t('R · táhni svisle nebo použij šipky','R · drag vertically or use arrow keys')}</p></div>
}
