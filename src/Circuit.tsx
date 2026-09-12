import { engineering, format } from './physics'
import type { Tap } from './physics'
import type { Translator } from './ui'
import { REPO } from './ui'
import { Knob } from './Knob'

interface Props {
  t: Translator; tap: Tap; r: number; c: number; audio: boolean
  charge: number; current: number; voltage: number; discharging: boolean
  onResistanceChange: (value: number) => void
}

export function Circuit({ t, tap, r, c, audio, charge, current, voltage, discharging, onResistanceChange }: Props) {
  const lowPass = tap === 'capacitor'
  const count = Math.min(8, Math.max(0, Math.round(Math.abs(charge) * 8)))
  // Low-pass takes the output across the shunt capacitor, so the two components swap places.
  const seriesLabel = lowPass ? `R · ${engineering(r, 'Ω')}` : `C · ${engineering(c, 'F')}`
  const shuntLabel = lowPass ? 'C' : 'R'
  const shuntValue = lowPass ? engineering(c, 'F') : engineering(r, 'Ω')
  const knobLeader = lowPass ? 'M298 78V152H624' : 'M493 115H624'
  return <div className="circuit-wrap"><div className="circuit-stage"><svg className="circuit" viewBox="0 0 790 205" role="group"
    aria-label={`${t('Zdroj', 'Source')}, ${lowPass ? t('sériový rezistor', 'series resistor') : t('sériový kondenzátor', 'series capacitor')} R ${engineering(r, 'Ω')}, C ${engineering(c, 'F')}. ${lowPass ? t('Výstup na C.', 'Output across C.') : t('Výstup na R.', 'Output across R.')} ${audio ? 'AC' : `i = ${engineering(current, 'A')}`}`}>
    <g className="wire">
      <path d="M100 99V62H274 M322 62H480V91 M480 139V171 M100 139V171 M480 62H552" />
      <circle cx="100" cy="119" r="20" />
      <path d="M87 171H113M91 177H109M96 183H104M467 171H493M471 177H489M476 183H484" />
      {lowPass
        ? <><rect x="274" y="50" width="48" height="24" fill="#fff" /><path d="M480 91V107M480 123V139" /></>
        : <><path d="M274 62H292M304 62H322M292 38V86M304 38V86" /><rect x="471" y="91" width="18" height="48" /></>}
    </g>
    {lowPass && <path d="M456 107H504M456 123H504" className="wire" />}
    <circle cx="480" cy="62" r="4" fill="currentColor" /><circle cx="552" cy="62" r="3" fill="currentColor" />
    <path d={knobLeader} className="knob-leader" />
    <foreignObject x="628" y="40" width="140" height="168"><Knob value={r} onChange={onResistanceChange} t={t}/></foreignObject>
    {audio ? <path d="M87 119Q94 101 100 119T113 119" className="wire" /> : <text x="100" y="125" textAnchor="middle" className="source-symbol">{discharging ? '0' : '+'}</text>}
    <text x="70" y="117" textAnchor="end">{audio ? 'Vin' : discharging ? '0 V' : `${format(voltage)} V`}</text>
    <text x="298" y="24" textAnchor="middle" className="component-label">{seriesLabel}</text>
    <text x="512" y="110" className="component-label">{shuntLabel}</text><text x="512" y="130">{shuntValue}</text>
    <text x="548" y="45" className="output-color">Vout = u{lowPass ? 'C' : 'R'}</text>
    {!audio && (lowPass
      ? Array.from({ length: count }, (_, i) => <g key={i}><text x={444 + i * 8} y="105" className="charge-dot">+</text><text x={444 + i * 8} y="134" className="charge-dot">−</text></g>)
      : Array.from({ length: count }, (_, i) => <g key={i}><text x="282" y={43 + i * 5.4} className="charge-dot">+</text><text x="311" y={43 + i * 5.4} className="charge-dot">−</text></g>))}
    <path d={current >= 0 ? 'M368 41H410L402 36M410 41L402 46' : 'M410 41H368L376 36M368 41L376 46'} fill="none" stroke="var(--rust)" strokeWidth="1.8" opacity={audio ? .65 : Math.min(1, Math.abs(current) * r / (voltage || 1) + .12)} />
    <text x="390" y="25" textAnchor="middle">{audio ? t('i střídá směr', 'i alternates') : t('směr i', 'i reference')}</text>
    <text x="330" y="196" textAnchor="middle" className="schematic-note">{lowPass
      ? t('Dolní propust · rezistor v sérii, výstup na kondenzátoru', 'Low-pass · series resistor, output across the capacitor')
      : t('Horní propust · kondenzátor v sérii, výstup na rezistoru', 'High-pass · series capacitor, output across the resistor')}</text>
  </svg></div><p className="micro">{audio ? t('Šipka značí referenční směr proudu.', 'The arrow marks the current reference.') : t('Značky u kondenzátoru představují náboj. Záporný proud teče opačně než při nabíjení.', 'Marks at the capacitor represent charge. Negative current flows opposite to charging.')}</p>
  <details className="hardware-details"><summary>{t('Skutečné součástky', 'Real components')}</summary><div className="component-photos"><figure><img src={`${import.meta.env.BASE_URL}components/potentiometer.jpg`} alt={t('Otočný potenciometr', 'Rotary potentiometer')} loading="lazy"/><figcaption>{t('Potenciometr: jezdec mění odpor při otáčení hřídele.', 'Potentiometer: the wiper changes resistance as the shaft turns.')} Richard Wheeler (Zephyris), CC BY-SA 3.0.</figcaption></figure><figure><img src={`${import.meta.env.BASE_URL}components/capacitor.jpg`} alt={t('Řez fóliovým kondenzátorem', 'Film capacitor cross section')} loading="lazy"/><figcaption>{t('Pevný kondenzátor 3,3 nF v řezu. Kapacitu zde měníme výměnou součástky, ne otáčením.', 'A sectioned fixed 3.3 nF capacitor. Change the component to change capacitance; it has no knob.')} TubeTimeUS, CC BY-SA 4.0.</figcaption></figure></div><a href={`${REPO}/blob/main/docs/references.md#photographs`}>{t('Zdroje fotografií a licence', 'Photo sources and licenses')}</a></details></div>
}
