import { engineering as eng, format } from './physics'
import type { Direction, Tap, response, transient } from './physics'
import type { Translator } from './ui'

function Calculation({ title, value, formula, substitution, meaning, open = false }: { title: string; value: string; formula: string; substitution: string; meaning: string; open?: boolean }) {
  return <details className="calculation" open={open || undefined}>
    <summary><span>{title}</span><strong>{value}</strong></summary>
    <p className="formula">{formula}</p>
    <p className="substitution">{substitution}</p>
    <p>{meaning}</p>
  </details>
}

interface Props {
  t: Translator
  tap: Tap
  mode: 'audio' | 'time'
  direction: Direction
  frequency: number
  resistance: number
  capacitance: number
  voltage: number
  position: number
  tau: number
  fc: number
  hp: ReturnType<typeof response>
  phase: number
  state: ReturnType<typeof transient>
}

export function Explanation({ t, tap, mode, direction, frequency, resistance, capacitance, voltage, position, tau, fc, hp, phase, state }: Props) {
  return <aside className="explanation-rail" aria-label={t('Vysvětlení a výpočty', 'Explanation and calculations')}>
    <h2>{t('Proč se to děje', 'Why this happens')}</h2>
    <p>{mode === 'audio'
      ? tap === 'capacitor'
        ? t('Při nízké frekvenci má kondenzátor velkou reaktanci a většina napětí je na něm. S rostoucí frekvencí napětí na C klesá. Výstup proto obsahuje méně výšek.', 'At low frequencies the capacitor has a large reactance and most voltage falls across it. As frequency rises, the voltage across C falls, so the output contains less treble.')
        : t('Při nízké frekvenci má kondenzátor velkou reaktanci. Většina napětí zůstane na něm, méně na R. S rostoucí frekvencí reaktance klesá a na R zbývá větší část signálu.', 'At low frequencies the capacitor has a large reactance. Most voltage falls across it, leaving less across R. As frequency rises, its reactance falls and more signal appears across R.')
      : direction === 'charging'
        ? t('Zpočátku je kondenzátor vybitý. Proud přidává náboj na desky. Napětí na C roste, na R klesá, a proud se proto postupně zmenšuje.', 'At first the capacitor is empty. Current adds charge to the plates. Its voltage rises, leaving less across R, so the current gradually decreases.')
        : t('Nabitý kondenzátor napájí obvod. Jeho napětí exponenciálně klesá. Proud teče opačně než při nabíjení, ale výkon rezistoru zůstává kladný.', 'The charged capacitor supplies the circuit. Its voltage falls exponentially. Current reverses, but resistor power stays positive.')}</p>
    <Calculation
      title={t('Časová konstanta τ', 'Time constant τ')}
      value={eng(tau, 's')}
      formula="τ = RC"
      substitution={`${format(resistance, 5)} Ω × ${format(capacitance, 5)} F = ${format(tau, 5)} s`}
      meaning={t('Po jedné τ zbývá 36,8 % původního rozdílu do konečného napětí.', 'After one τ, 36.8% of the initial distance to the final voltage remains.')}
    />
    <Calculation
      title={t('Mezní frekvence fc', 'Cutoff frequency fc')}
      value={eng(fc, 'Hz')}
      formula="fc = 1 / (2πRC)"
      substitution={`1 / (2π × ${format(resistance, 5)} Ω × ${format(capacitance, 5)} F) = ${format(fc, 5)} Hz`}
      meaning={tap === 'capacitor'
        ? t('Zde je amplituda výstupu 1/√2 vstupu, tedy −3,0103 dB, a fáze se zpožďuje o 45°.', 'Here output amplitude is 1/√2 of input, so −3.0103 dB, and phase lags by 45°.')
        : t('Zde je amplituda výstupu 1/√2 vstupu, tedy −3,0103 dB, a fáze předbíhá o 45°.', 'Here output amplitude is 1/√2 of input, so −3.0103 dB, and phase leads by 45°.')}
      open
    />
    {mode === 'audio' ? <>
      <Calculation
        title={t('Úhlová frekvence ω', 'Angular frequency ω')}
        value={`${format(hp.omega)} rad/s`}
        formula="ω = 2πf"
        substitution={`2π × ${format(frequency)} Hz = ${format(hp.omega)} rad/s`}
        meaning={t('Jeden cyklus sinusovky odpovídá 2π radiánům.', 'One sine cycle corresponds to 2π radians.')}
      />
      <Calculation
        title={t('Velikost reaktance XC', 'Reactance magnitude XC')}
        value={eng(hp.reactance, 'Ω')}
        formula="XC = 1 / (2πfC)"
        substitution={`1 / (2π × ${format(frequency)} × ${format(capacitance)}) = ${eng(hp.reactance, 'Ω')}`}
        meaning={t('Míra, jak kondenzátor brání tomuto střídavému proudu. Při fc je XC = R.', 'How strongly the capacitor opposes this AC frequency. At fc, XC equals R.')}
      />
      <Calculation
        title={t('Poměr amplitud |H|', 'Amplitude ratio |H|')}
        value={format(hp.magnitude)}
        formula={tap === 'capacitor' ? '|H| = 1 / √(1 + x²); x = 2πfRC' : '|H| = x / √(1 + x²); x = 2πfRC'}
        substitution={`x = ${format(hp.omega * tau)} → ${tap === 'capacitor' ? '1' : format(hp.omega * tau)} / √(1 + ${format(hp.omega * tau)}²) = ${format(hp.magnitude)}`}
        meaning={t('Tímto bezrozměrným poměrem násobíš vstupní amplitudu.', 'Multiply the input amplitude by this dimensionless ratio.')}
      />
      <Calculation
        title={t('Přenos v decibelech', 'Gain in decibels')}
        value={`${format(hp.gainDb)} dB`}
        formula="G = 20 log₁₀ |H|"
        substitution={`20 × log₁₀(${format(hp.magnitude, 5)}) = ${format(hp.gainDb)} dB`}
        meaning={t('Záporná hodnota znamená zeslabení. −3 dB je asi 70,7 % amplitudy, ne 50 %.', 'Negative means attenuation. −3 dB is about 70.7% amplitude, not 50%.')}
      />
      <Calculation
        title={tap === 'capacitor' ? t('Fázové zpoždění φ', 'Phase lag φ') : t('Fázový předstih φ', 'Phase lead φ')}
        value={`${format(phase * 180 / Math.PI)}°`}
        formula={tap === 'capacitor' ? 'φ = −arctan(2πfRC)' : 'φ = atan2(1, 2πfRC)'}
        substitution={`${tap === 'capacitor' ? `−arctan(${format(hp.omega * tau)})` : `atan2(1, ${format(hp.omega * tau)})`} × 180/π = ${format(phase * 180 / Math.PI)}°`}
        meaning={t('Porovnej vrcholy obou sinusovek na stejné časové ose.', 'Compare the peaks of both sine waves on the same time axis.')}
      />
    </> : <>
      <Calculation
        title={t('Napětí kondenzátoru uC', 'Capacitor voltage uC')}
        value={eng(state.uc, 'V')}
        formula={direction === 'charging' ? 'uC = U(1 − e^(−t/τ))' : 'uC = Ue^(−t/τ)'}
        substitution={`U = ${format(voltage)} V; t/τ = ${format(position)} → uC = ${eng(state.uc, 'V')}`}
        meaning={t('Napětí kondenzátoru se při konečném proudu mění spojitě.', 'Capacitor voltage changes continuously for finite current.')}
        open
      />
      <Calculation
        title={t('Napětí rezistoru uR', 'Resistor voltage uR')}
        value={eng(state.ur, 'V')}
        formula={direction === 'charging' ? 'uR = U − uC' : 'uR = −uC'}
        substitution={`${direction === 'charging' ? `${format(voltage)} − ` : '−'}${format(state.uc)} = ${format(state.ur)} V`}
        meaning={t('Orientace napětí se mezi režimy nemění. Součet odpovídá přiloženému napětí.', 'Voltage references stay fixed between modes. The sum equals the applied voltage.')}
      />
      <Calculation
        title={t('Proud i', 'Current i')}
        value={eng(state.current, 'A')}
        formula="i = uR / R = C duC/dt"
        substitution={`${format(state.ur)} V / ${format(resistance)} Ω = ${eng(state.current, 'A')}`}
        meaning={t('Záporné znaménko znamená opačný směr než při nabíjení.', 'Negative means the opposite direction to charging.')}
      />
      <Calculation
        title={t('Teplo od začátku děje', 'Heat since t = 0')}
        value={eng(state.heat, 'J')}
        formula="WR = ∫ i²R dt = ½CU²(1 − e^(−2t/τ))"
        substitution={`½ × ${format(capacitance)} × ${format(voltage)}² × (1 − e^(−2 × ${format(position)})) = ${eng(state.heat, 'J')}`}
        meaning={t('Energie od t = 0, nikoli okamžitý výkon. Dvojka v exponentu vznikne umocněním proudu.', 'Accumulated energy, not instantaneous power. Squaring the current produces the factor 2 in the exponent.')}
      />
    </>}
  </aside>
}
