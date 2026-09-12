import { useState } from 'react'
import { format } from './physics'
import type { Translator } from './ui'

export interface Trace { name: string; color: string; points: [number, number][]; dashed?: boolean; id?: string }
interface Props {
  t: Translator;
  title: string; traces: Trace[]; xDomain: [number, number]; yDomain: [number, number]
  xLabel: string; yLabel: string; xTicks: number[]; yTicks: number[]
  log?: boolean; marker?: number; markerLabel?: string; cursor?: number
}
export function Plot({ t, title, traces, xDomain, yDomain, xLabel, yLabel, xTicks, yTicks, log, marker, markerLabel, cursor }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const width = 440, height = 250, left = 54, right = 18, top = 22, bottom = 44
  const transform = (v: number) => log ? Math.log10(v) : v
  const x = (v: number) => left + (transform(v) - transform(xDomain[0])) / (transform(xDomain[1]) - transform(xDomain[0])) * (width - left - right)
  const y = (v: number) => top + (yDomain[1] - Math.max(yDomain[0], Math.min(yDomain[1], v))) / (yDomain[1] - yDomain[0]) * (height - top - bottom)
  const readout = hover === null ? null : traces.map(trace => {
    const point = trace.points.reduce((best, p) => Math.abs(p[0] - hover) < Math.abs(best[0] - hover) ? p : best)
    return `${trace.name}: ${format(point[1])}`
  }).join(' · ')
  return <figure className="plot">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title}. ${xLabel}; ${yLabel}. ${t('Aktuální hodnoty jsou vedle grafu.','Current numeric values are beside the plot.')}`}
      onPointerMove={event => {
        const box = event.currentTarget.getBoundingClientRect()
        const fraction = Math.max(0, Math.min(1, ((event.clientX - box.left) / box.width * width - left) / (width - left - right)))
        const value = transform(xDomain[0]) + fraction * (transform(xDomain[1]) - transform(xDomain[0]))
        setHover(log ? 10 ** value : value)
      }} onPointerLeave={() => setHover(null)}>
      {xTicks.map(t => <g key={t}><line className="gridline" x1={x(t)} y1={top} x2={x(t)} y2={height - bottom} /><text x={x(t)} y={height - bottom + 19} textAnchor="middle">{format(t)}</text></g>)}
      {yTicks.map(t => <g key={t}><line className="gridline" x1={left} y1={y(t)} x2={width - right} y2={y(t)} /><text x={left - 8} y={y(t) + 4} textAnchor="end">{format(t)}</text></g>)}
      {traces.map(trace => <path key={trace.name} data-testid={trace.id} d={trace.points.map(([px, py], i) => `${i ? 'L' : 'M'}${x(px).toFixed(2)},${y(py).toFixed(2)}`).join(' ')} fill="none" stroke={trace.color} strokeWidth="2.3" strokeDasharray={trace.dashed ? '6 4' : undefined} />)}
      {marker !== undefined && marker >= xDomain[0] && marker <= xDomain[1] && <g><line className="marker" x1={x(marker)} x2={x(marker)} y1={top} y2={height - bottom} /><text className="marker-label" x={Math.min(x(marker) + 5, width - 100)} y={top + 12}>{markerLabel}</text></g>}
      {cursor !== undefined && <line className="cursor" x1={x(cursor)} x2={x(cursor)} y1={top} y2={height - bottom} />}
      {hover !== null && <line className="hoverline" x1={x(hover)} x2={x(hover)} y1={top} y2={height - bottom} />}
      <text x={width / 2} y={height - 3} textAnchor="middle">{xLabel}</text>
      <text transform={`translate(12 ${height / 2}) rotate(-90)`} textAnchor="middle">{yLabel}</text>
    </svg>
    <figcaption><span className="legend">{traces.map(trace => <span key={trace.name}><i style={{ borderColor: trace.color, borderTopStyle: trace.dashed ? 'dashed' : 'solid' }} />{trace.name}</span>)}</span><span className="plot-readout">{hover !== null ? `${format(hover)} · ${readout}` : t('Pohybem po grafu prozkoumej hodnoty.','Move across the graph to inspect values.')}</span></figcaption>
  </figure>
}
