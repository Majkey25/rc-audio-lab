import { engineering, format } from './physics'
import type { Translator } from './ui'
interface Props { t: Translator; r: number; c: number; audio: boolean; charge: number; current: number; voltage: number; discharging: boolean }
export function Circuit({ t, r, c, audio, charge, current, voltage, discharging }: Props) {
  const count = Math.min(8, Math.max(0, Math.round(Math.abs(charge) * 8)))
  return <div className="circuit-wrap"><svg className="circuit" viewBox="0 0 660 205" role="img" aria-label={`${t('Zdroj, sériový kondenzátor','Source, series capacitor')} C ${engineering(c, 'F')}, R ${engineering(r, 'Ω')}. ${t('Výstup na R.','Output across R.')} ${audio ? 'AC' : `i = ${engineering(current, 'A')}`}`}>
    <g className="wire"><path d="M100 99V62H286 M310 62H480V91 M480 139V171 M100 139V171 M480 62H552" /><circle cx="100" cy="119" r="20" /><path d="M286 38V86M310 38V86" /><rect x="471" y="91" width="18" height="48" /><path d="M87 171H113M91 177H109M96 183H104M467 171H493M471 177H489M476 183H484" /></g>
    <circle cx="480" cy="62" r="4" fill="currentColor" /><circle cx="552" cy="62" r="3" fill="currentColor" />
    {audio ? <path d="M87 119Q94 101 100 119T113 119" className="wire" /> : <text x="100" y="125" textAnchor="middle" className="source-symbol">{discharging ? '0' : '+'}</text>}
    <text x="70" y="117" textAnchor="end">{audio ? 'Vin' : discharging ? '0 V' : `${format(voltage)} V`}</text>
    <text x="298" y="18" textAnchor="middle" className="component-label">C · {engineering(c, 'F')}</text>
    <text x="505" y="114" className="component-label">R</text><text x="505" y="134">{engineering(r, 'Ω')}</text>
    <text x="548" y="45" className="output-color">Vout = uR</text>
    <text x="298" y="113" textAnchor="middle" className="input-color">+ uC −</text>
    {!audio && Array.from({ length: count }, (_, i) => <g key={i}><text x="274" y={43 + i * 5.4} className="charge-dot">+</text><text x="319" y={43 + i * 5.4} className="charge-dot">−</text></g>)}
    <path d={current >= 0 ? 'M368 41H410L402 36M410 41L402 46' : 'M410 41H368L376 36M368 41L376 46'} fill="none" stroke="var(--rust)" strokeWidth="1.8" opacity={audio ? .65 : Math.min(1, Math.abs(current) * r / (voltage || 1) + .12)} />
    <text x="390" y="25" textAnchor="middle">{audio ? t('i střídá směr','i alternates') : t('směr i','i reference')}</text>
    <text x="330" y="193" textAnchor="middle" className="schematic-note">{audio ? t('Kondenzátor v sérii · výstup na rezistoru','Capacitor in series · output across the resistor') : t('Stejný obvod · napěťový skok nebo vybíjení do 0 V','Same circuit · voltage step or discharge to 0 V')}</text>
  </svg><p className="micro">{audio ? t('Polarita se střídá. Šipka značí referenční směr proudu, nikoli pohyb elektronů.','AC polarity reverses. The arrow marks a reference direction, not literal electron motion.') : t('Značky na deskách představují náboj. Záporný proud znamená opačný směr než při nabíjení.','Plate symbols represent charge. Negative current means flow opposite to charging.')}</p></div>
}
