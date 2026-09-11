# Nabíjení a vybíjení kondenzátoru a RC obvody v hudbě

**Semestrální projekt č. 8 k předmětu AK3EJ | 2026**  
*Autor: Multiinstrumentalista (kytara, baskytara, bicí)*  
*Univerzita Tomáše Bati ve Zlíně*

> **Interaktivní webová simulace k projektu:**  
> [https://majkey25.github.io/rc-audio-lab/](https://majkey25.github.io/rc-audio-lab/)  
> Repozitář se zdrojovými kódy: [https://github.com/Majkey25/rc-audio-lab](https://github.com/Majkey25/rc-audio-lab)

---

## Obsah

1. [Úvod a fyzikální podstata kondenzátoru](#1-úvod-a-fyzikální-podstata-kondenzátoru)
2. [Nabíjení a vybíjení RC obvodu](#2-nabíjení-a-vybíjení-rc-obvodu)
3. [Časová konstanta a průběh přechodového děje](#3-časová-konstanta-a-průběh-přechodového-děje)
4. [RC filtry a kmitočtová charakteristika](#4-rc-filtry-a-kmitočtová-charakteristika)
5. [Praktické řešení úkolů jedna a dvě](#5-praktické-řešení-úkolů-jedna-a-dvě)
6. [Praktické řešení úkolu tři (ztrátová energie na rezistoru)](#6-praktické-řešení-úkolu-tři-ztrátová-energie-na-rezistoru)
7. [Kytara a baskytara jako aplikace filtrace](#7-kytara-a-baskytara-jako-aplikace-filtrace)
8. [Vazební kondenzátor a zachování basů](#8-vazební-kondenzátor-a-zachování-basů)
9. [Bicí a časové řízení hudebního signálu](#9-bicí-a-časové-řízení-hudebního-signálu)
10. [Vizualizace pole a zhodnocení výsledků](#10-vizualizace-pole-a-zhodnocení-výsledků)
11. [Seznam použité literatury](#11-seznam-použité-literatury)

---

## 1. Úvod a fyzikální podstata kondenzátoru

Jako multiinstrumentalista, který hraje na kytaru, baskytaru a bicí, se s úpravou zvuku setkávám z několika různých stran. U strunných nástrojů mě primárně zajímá barva tónu a chování vyšších harmonických složek, u bicích zase strmost náběhu úderu (attack) a délka jeho doznění (decay/release). Kondenzátor ve spojení s rezistorem představuje základní stavební kámen analogové elektroniky, který umožňuje oba tyto zdánlivě odlišné jevy popsat jednotným matematickým a fyzikálním aparátem. Tato práce proto propojuje teorii nabíjení a vybíjení kondenzátoru s kmitočtovou filtrací a časovým řízením hudebního signálu.

Projekt č. 8 nejprve zavádí pojem kapacity, odvozuje diferenciální rovnici sériového RC obvodu a definuje časovou konstantu. Následně detailně analyticky řeší všechny tři povinné úkoly ze zadání a rozšiřuje je o modelové hudební aplikace. Všechny uvedené výsledky jsou exaktními analytickými výpočty a jejich počítačovými vizualizacemi.

### Kapacita a energie elektrického pole

Kondenzátor je pasivní elektrotechnická součástka tvořená dvěma vodiči (elektrodami) oddělenými dielektrikem. Na elektrodách se hromadí náboje shodné velikosti a opačných polarit. Kapacita $C$ vyjadřuje schopnost kondenzátoru vázat náboj $q$ při určitém napětí $u_C$ mezi elektrodami:

$$q = C \cdot u_C \implies C = \frac{q}{u_C}$$

Pro ideální deskový kondenzátor s plochou elektrod $S$, jejich vzájemnou vzdáleností $d$ a homogenním dielektrikem s relativní permitivitou $\varepsilon_r$ platí:

$$C = \varepsilon_0 \varepsilon_r \frac{S}{d}, \quad E \approx \frac{u_C}{d}$$

kde $\varepsilon_0 \approx 8{,}854 \times 10^{-12}\,\mathrm{F/m}$ je permitivita vakua a $E$ je velikost intenzity elektrického pole mezi deskami.

Při přenosu elementárního náboje $\mathrm{d}q$ je nutno vykonat práci $\mathrm{d}W = u_C\,\mathrm{d}q$. Integrací od nulového náboje po konečný náboj $q$ získáme energii elektrického pole akumulovanou v kondenzátoru:

$$W_C = \int_0^q \frac{q'}{C}\,\mathrm{d}q' = \frac{q^2}{2C} = \frac{1}{2} C u_C^2$$

Objemová hustota energie pole v lineárním dielektriku činí:

$$w_e = \frac{1}{2} \varepsilon_0 \varepsilon_r E^2$$

Kondenzátor energii akumuluje reverzibilně. Naproti tomu ideální rezistor elektrickou energii nevratně přeměňuje v Jouleovo teplo. Toto rozlišení je zásadní pro řešení třetího úkolu.

---

## 2. Nabíjení a vybíjení RC obvodu

Mějme sériové spojení ideálního zdroje stejnosměrného napětí $U$, rezistoru $R > 0$ a kondenzátoru $C > 0$. V čase $t = 0$ je k původně vybitému kondenzátoru ($u_C(0) = 0$) připojen zdroj napětí.

Podle 2. Kirchhoffova zákona:

$$U = u_R(t) + u_C(t)$$

Podle Ohmova zákona $u_R(t) = R \cdot i(t)$, přičemž proud je definován jako změna náboje v čase $i(t) = \frac{\mathrm{d}q}{\mathrm{d}t} = C \frac{\mathrm{d}u_C}{\mathrm{d}t}$. Dosazením obdržíme nehomogenní lineární diferenciální rovnici prvního řádu:

$$R C \frac{\mathrm{d}u_C(t)}{\mathrm{d}t} + u_C(t) = U, \quad u_C(0) = 0$$

Separací proměnných $\frac{\mathrm{d}u_C}{U - u_C} = \frac{\mathrm{d}t}{RC}$ a integrací v mezích od $0$ do $t$ získáváme časové průběhy napětí a proudu při nabíjení:

$$u_C(t) = U \left(1 - e^{-t / RC}\right)$$
$$u_R(t) = U e^{-t / RC}$$
$$i(t) = \frac{U}{R} e^{-t / RC}$$

V čase $t = 0^+$ je kondenzátor zkratem pro napětí ($u_C(0^+) = 0$), veškeré napětí leží na rezistoru a proud dosahuje maxima $i(0^+) = U/R$. V ustáleném stavu ($t \to \infty$) proud klesá k nule a kondenzátor je nabit na napětí zdroje $u_C(\infty) = U$.

### Vybíjení kondenzátoru

Při odpojení zdroje a sepnutí obvodu do zkratu ($U = 0$) z počátečního napětí $u_C(0) = U_0$:

$$u_C(t) = U_0 e^{-t / RC}, \quad i(t) = -\frac{U_0}{R} e^{-t / RC}$$

Záporné znaménko proudu reflektuje opačný směr toku náboje z kladné elektrody kondenzátoru zpět přes rezistor.

---

## 3. Časová konstanta a průběh přechodového děje

Časová konstanta obvodu je definována součinem:

$$\tau = R \cdot C \quad [\Omega \cdot \mathrm{F} = \mathrm{s}]$$

Udává čas, za který klesne odchylka okamžitého napětí od konečného ustáleného stavu na násobek $e^{-1} \approx 0{,}367879$ své původní hodnoty:

| Čas $t$ | Nabíjení $u_C(t) / U$ | Vybíjení $u_C(t) / U_0$ |
| :---: | :---: | :---: |
| $0\,\tau$ | $0{,}00\,\%$ | $100{,}00\,\%$ |
| $1\,\tau$ | $63{,}21\,\%$ | $36{,}79\,\%$ |
| $2\,\tau$ | $86{,}47\,\%$ | $13{,}53\,\%$ |
| $3\,\tau$ | $95{,}02\,\%$ | $4{,}98\,\%$ |
| $5\,\tau$ | $99{,}33\,\%$ | $0{,}67\,\%$ |

Standardní doba náběhu mezi $10\,\%$ a $90\,\%$ konečné hodnoty činí:

$$t_{10-90} = \tau \ln\left(\frac{1 - 0{,}1}{1 - 0{,}9}\right) = \tau \ln 9 \approx 2{,}1972\,\tau$$

---

## 4. RC filtry a kmitočtová charakteristika

V harmonickém ustáleném stavu ($u_{\text{in}}(t) = \hat{U} \sin(\omega t)$) reprezentujeme rezistor impedancí $Z_R = R$ a kondenzátor kapacitní impedancí $Z_C = \frac{1}{j\omega C}$.

### Dolní a horní propust

* **Dolní propust (výstup na kondenzátoru):**
  $$H_{\text{DP}}(j\omega) = \frac{1}{1 + j\omega RC}, \quad |H_{\text{DP}}| = \frac{1}{\sqrt{1 + (\omega RC)^2}}, \quad \phi_{\text{DP}} = -\arctan(\omega RC)$$

* **Horní propust (výstup na rezistoru):**
  $$H_{\text{HP}}(j\omega) = \frac{j\omega RC}{1 + j\omega RC}, \quad |H_{\text{HP}}| = \frac{\omega RC}{\sqrt{1 + (\omega RC)^2}}, \quad \phi_{\text{HP}} = 90^\circ - \arctan(\omega RC)$$

Mezní kmitočet $f_c$ odpovídá stavu $\omega RC = 1$:

$$f_c = \frac{1}{2\pi RC}$$

Při kmitočtu $f = f_c$ je velikost přenosu $|H| = \frac{1}{\sqrt{2}} \approx 0{,}7071$, což odpovídá poklesu o $-3{,}01\,\mathrm{dB}$. Fázový posun činí $-45^\circ$ u dolní propusti a $+45^\circ$ (předstih) u horní propusti.

---

## 5. Praktické řešení úkolů jedna a dvě

### Úkol 1: Odvození napětí $u_R(t)$ a $u_C(t)$
Pro nabíjení původně vybitého kondenzátoru ze zdroje $U$:

$$u_C(t) = U \left(1 - e^{-t / \tau}\right)$$
$$u_R(t) = U e^{-t / \tau}$$

Součet okamžitých napětí pro libovolný čas $t \ge 0$ splňuje Kirchhoffův zákon:

$$u_R(t) + u_C(t) = U e^{-t/\tau} + U(1 - e^{-t/\tau}) \equiv U$$

### Úkol 2: Napětí na kondenzátoru v čase $t = \tau$
Dosazením $t = \tau$:

$$u_C(\tau) = U \left(1 - e^{-1}\right) = U \left(1 - \frac{1}{2{,}718282}\right) \approx 0{,}632121 \cdot U$$

Napětí na kondenzátoru v čase jedné časové konstanty dosáhne přesně $63{,}21\,\%$ napětí zdroje, zcela nezávisle na konkrétních číselných hodnotách $R$ a $C$.

#### Modelový číselný příklad:
Uvažujme modelové hodnoty $U = 5{,}00\,\mathrm{V}$, $R = 10{,}0\,\mathrm{k\Omega}$, $C = 1{,}00\,\mathrm{\mu F}$.  
Časová konstanta: $\tau = 10{,}0\,\mathrm{k\Omega} \times 1{,}00\,\mathrm{\mu F} = 10{,}0\,\mathrm{ms}$.  
V čase $t = \tau = 10{,}0\,\mathrm{ms}$:
* $u_C(\tau) = 5{,}00 \cdot (1 - e^{-1}) \approx 3{,}1606\,\mathrm{V}$
* $u_R(\tau) = 5{,}00 \cdot e^{-1} \approx 1{,}8394\,\mathrm{V}$
* $i(\tau) = \frac{1{,}8394\,\mathrm{V}}{10{,}0\,\mathrm{k\Omega}} \approx 0{,}1839\,\mathrm{mA}$

---

## 6. Praktické řešení úkolu tři (ztrátová energie na rezistoru)

Hledáme celkovou energii $W_R$ přeměněnou v teplo na rezistoru od začátku nabíjení ($t = 0$) do času $t = \tau$.

Okamžitý ztrátový výkon rezistoru je:

$$p_R(t) = R \cdot i^2(t) = R \left(\frac{U}{R} e^{-t/\tau}\right)^2 = \frac{U^2}{R} e^{-2t/\tau}$$

Celkové teplo vyvinuté do času $\tau$ je integrálem výkonu:

$$W_R(\tau) = \int_0^\tau p_R(t)\,\mathrm{d}t = \int_0^\tau \frac{U^2}{R} e^{-2t/(RC)}\,\mathrm{d}t$$

Substitucí a integrací:

$$W_R(\tau) = \frac{U^2}{R} \left[ -\frac{RC}{2} e^{-2t/(RC)} \right]_0^\tau = \frac{1}{2} C U^2 \left(1 - e^{-2}\right)$$

Číselné vyhodnocení:

$$1 - e^{-2} \approx 1 - 0{,}135335 = 0{,}864665$$
$$W_R(\tau) = \frac{0{,}864665}{2} C U^2 \approx 0{,}432332 \cdot C U^2$$

### Kontrola celkové energetické bilance
V čase $t = \tau$:
1. Energie dodaná zdrojem: $W_z(\tau) = \int_0^\tau U i(t)\,\mathrm{d}t = C U^2 (1 - e^{-1}) \approx 0{,}632121 \cdot C U^2$
2. Energie akumulovaná v poli kondenzátoru: $W_C(\tau) = \frac{1}{2} C [u_C(\tau)]^2 = \frac{1}{2} C U^2 (1 - e^{-1})^2 \approx 0{,}199788 \cdot C U^2$
3. Teplo na rezistoru: $W_R(\tau) \approx 0{,}432332 \cdot C U^2$

Součet energie pole a disipovaného tepla:

$$W_C(\tau) + W_R(\tau) = (0{,}199788 + 0{,}432332)\, C U^2 = 0{,}632120 \cdot C U^2 \equiv W_z(\tau)$$

Energetická bilance je přesně zachována.

---

## 7. Kytara a baskytara jako aplikace filtrace

V hudební praxi elektrické kytary a baskytary hraje kondenzátor klíčovou roli v pasivní tónové cloně (Tone). Běžně se používají hodnoty $22\,\mathrm{nF}$ (kytary typu Stratocaster/Les Paul) nebo $47\,\mathrm{nF}$ až $50\,\mathrm{nF}$ (baskytary typu Jazz Bass / Precision Bass).

### Proč pasivní kytarový tónový obvod není prostý RC filtr
V populární literatuře se často chybně uvádí, že kytarová clona je obyčejná dolní propust s mezní frekvencí $f_c = \frac{1}{2\pi R C}$. Tento předpoklad je fyzikálně nesprávný, protože:
1. Magnetický snímač není ideální zdroj napětí, ale generátor s vysokou vlastní indukčností ($L \approx 2\text{ až }6\,\mathrm{H}$) a stejnosměrným odporem vinutí ($R_{\text{dc}} \approx 5\text{ až }15\,\mathrm{k\Omega}$).
2. Celý systém se stíněným kabelem ($C_{\text{kabel}} \approx 500\text{ až }1000\,\mathrm{pF}$) a vstupní impedancí zesilovače ($R_{\text{in}} \approx 1\,\mathrm{M\Omega}$) tvoří **vázaný RLC rezonanční obvod druhého řádu**.
3. Otáčením tónového potenciometru se nejen tlumí výšky, ale dochází k posunu rezonančního kmitočtu a změně činitele jakosti $Q$.

---

## 8. Vazební kondenzátor a zachování basů

V efektových pedálech (overdrive, distortion, boost) a zesilovačích slouží sériově zapojený kondenzátor jako **vazební člen (AC coupling)**. Jeho primárním úkolem je oddělit stejnosměrné pracovní napětí (DC bias) předchozího stupně a propustit pouze střídavý hudební signál na vstupní odpor dalšího stupně $R_L$.

Obvod tvoří horní propust s přenosem:

$$H(j\omega) = \frac{j\omega C R_L}{1 + j\omega C(R_s + R_L)}$$

Pro zátěž $R_L = 100\,\mathrm{k\Omega}$ a $R_s \ll R_L$:
* $C = 100\,\mathrm{nF} \implies f_c \approx 15{,}9\,\mathrm{Hz}$ (bezeztrátový přenos hlubokých basů; tón $E_1 \approx 41{,}2\,\mathrm{Hz}$ zeslaben o pouhých $0{,}60\,\mathrm{dB}$).
* $C = 10\,\mathrm{nF} \implies f_c \approx 159\,\mathrm{Hz}$ (výrazné ořezání basů; tón $E_1$ zeslaben o $12{,}02\,\mathrm{dB}$).

Menší vazební kondenzátor před zkreslujícím stupněm zabraňuje tzv. "zahlcení basy" (bass flub), čímž pročišťuje zkreslený tón kytary.

---

## 9. Bicí a časové řízení hudebního signálu

V dynamických procesorech (kompresory, expandery, noise gate) řídí RC obvod časovou odezvu obálkového detektoru (envelope detector):

* **Attack time (náběh):** Určen nabíjením kondenzátoru přes malý odpor $R_A$ při překročení prahové úrovně. Krátký attack ($1\text{–}10\,\mathrm{ms}$) zachytí úder virblu nebo velkého bubnu a ztlumí počáteční špičku.
* **Release time (uvolnění):** Určen vybíjením kondenzátoru přes větší odpor $R_R$ ($50\text{–}500\,\mathrm{ms}$) po doznění signálu.

---

## 10. Vizualizace pole a zhodnocení výsledků

Elektrické pole v kondenzátoru se řídí napětím elektrod $E(t) = \frac{u_C(t)}{d}$. Zatímco intenzita pole $E$ roste úměrně napětí ($63{,}21\,\%$ v čase $\tau$), hustota energie pole roste s druhou mocninou:

$$\frac{W_C(\tau)}{W_{C,\infty}} = \left(1 - e^{-1}\right)^2 \approx 0{,}3996 \quad (39{,}96\,\%)$$

V čase $\tau$ je tedy v kondenzátoru uloženo necelých $40\,\%$ konečné energie, zatímco na rezistoru se vlivem vysokého počátečního proudu již ztratilo přes $43{,}2\,\%$ celkové energie dodané zdrojem.

---

## 11. Seznam použité literatury

1. **MIT; ALDEBARAN GROUP FOR ASTROPHYSICS.** *Elektřina a magnetizmus V: Kapacita a dielektrika*. Překlad Petr Kulhánek. [Online](https://www.aldebaran.cz/elmg/kurz_05_diel.pdf)
2. **MIT; ALDEBARAN GROUP FOR ASTROPHYSICS.** *Elektřina a magnetizmus VII: Stejnosměrné obvody*. Překlad Jan Pacák. [Online](https://www.aldebaran.cz/elmg/kurz_07_curd.pdf)
3. **BALES, James A.** *Lecture 4: RC Circuits*. Practical Electronics, Fall 2004. MIT OpenCourseWare. [Online](https://ocw.mit.edu/courses/ec-s06-practical-electronics-fall-2004/5d70e7c37b7dc19e1e947e7a7b1d4ac6_MITEC_S06F04_lec04.pdf)
4. **MIT; ALDEBARAN GROUP FOR ASTROPHYSICS.** *Elektřina a magnetizmus XII: Střídavé obvody*. Překlad Jan Pacák. [Online](https://www.aldebaran.cz/elmg/kurz_12_cura.pdf)
5. **MASSACHUSETTS INSTITUTE OF TECHNOLOGY.** *6.117 Lecture 3: Digital circuits, power supplies and regulation*. IAP 2020. [Online](https://web.mit.edu/6.117/www/lec3.pdf)
6. **FENDER MUSICAL INSTRUMENTS CORPORATION.** *Capacitor Ceramic Disc .05µF @ 100V 20% (12)*. [Online](https://www.fender.com/products/capacitor-ceramic-disc-05uf-100v-20-percent-12)
7. **ORPHEO.** *250k vs 500k pots: Going Deeper into the Subject*. Seymour Duncan. [Online](https://www.seymourduncan.com/blog/tips-and-tricks/250k-pots-versus-500k-pots-going-deeper-into-the-subject)
8. **TEXAS INSTRUMENTS.** *RC circuits*. TI Precision Labs. [Online](https://www.ti.com/video/6119035031001)
9. **ANALOG DEVICES.** *Chapter 7: Diode application topics – Peak Detector*. [Online](https://wiki.analog.com/university/courses/electronics/text/chapter-7)
10. **ANALOG DEVICES.** *An Overview of Automatic Level Control*. [Online](https://www.analog.com/en/resources/technical-articles/an-overview-of-automatic-level-control.html)
