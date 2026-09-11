import { engineering } from './physics'
import type { Translator } from './ui'
interface Props { t: Translator; label: string; value: number; min: number; max: number; unit: string; onChange: (value: number) => void; log?: boolean; step?: number }
export function Control({ t, label, value, min, max, unit, onChange, log = false, step }: Props) {
  return <label className="control"><span>{label}<output>{engineering(value, unit)}</output></span>
    <input type="range" aria-label={label} aria-valuetext={engineering(value, unit)} min={log ? Math.log10(min) : min} max={log ? Math.log10(max) : max} step={log ? 0.005 : step ?? 'any'} value={log ? Math.log10(value) : value} onChange={e => onChange(log ? 10 ** Number(e.target.value) : Number(e.target.value))} />
    <span className="range-ends"><span>{engineering(min, unit)}</span><span>{log ? t('logaritmicky','logarithmic') : ''}</span><span>{engineering(max, unit)}</span></span>
  </label>
}
