# Physics and Digital Modeling Specification

This document details the mathematical derivations, energy calculations, and digital signal processing (DSP) models implemented in **RC Audio Lab**.

---

## 1. Continuous-Time RC Circuit Derivations

### 1.1 Differential Equation for Series RC Network

Consider a series circuit with an ideal voltage source $U(t)$, an ideal resistor $R > 0$, and an ideal capacitor $C > 0$. By Kirchhoff's Voltage Law (KVL):

$$u_{\text{in}}(t) = u_R(t) + u_C(t)$$

Ohm's Law across the resistor gives $u_R(t) = R \cdot i(t)$. By the constitutive relation of a linear capacitor, $q(t) = C \cdot u_C(t)$ and $i(t) = \frac{\mathrm{d}q}{\mathrm{d}t} = C \frac{\mathrm{d}u_C}{\mathrm{d}t}$. Substituting yields the standard first-order non-homogeneous ordinary differential equation (ODE):

$$R C \frac{\mathrm{d}u_C(t)}{\mathrm{d}t} + u_C(t) = u_{\text{in}}(t)$$

where $\tau = R C$ is the **characteristic time constant** ($[\tau] = \Omega \cdot \mathrm{F} = \frac{\mathrm{V}}{\mathrm{A}} \cdot \frac{\mathrm{A \cdot s}}{\mathrm{V}} = \mathrm{s}$).

---

### 1.2 DC Charging Step Response ($u_C(0) = 0$)

For a unit step input $u_{\text{in}}(t) = U \cdot \Theta(t)$ applied to an initially discharged capacitor:

$$u_C(t) = U \left(1 - e^{-t / \tau}\right)$$
$$u_R(t) = U e^{-t / \tau}$$
$$i(t) = \frac{U}{R} e^{-t / \tau}$$

#### Condition at $t = \tau$:
$$u_C(\tau) = U \left(1 - e^{-1}\right) \approx 0.632121 \cdot U \quad (63.21\%)$$
$$u_R(\tau) = U e^{-1} \approx 0.367879 \cdot U \quad (36.79\%)$$

---

### 1.3 DC Discharging from Initial Voltage $U_0$

When shorting the input ($u_{\text{in}}(t) = 0$) with $u_C(0) = U_0$:

$$u_C(t) = U_0 e^{-t / \tau}$$
$$u_R(t) = -U_0 e^{-t / \tau} \quad (\text{with passive reference direction towards ground})$$
$$i(t) = -\frac{U_0}{R} e^{-t / \tau}$$

---

### 1.4 Exact Energy Balance from $t = 0$ to $t = \tau$

When charging from $0$ to $t = \tau$, we calculate:

1. **Instantaneous Joule dissipation in resistor**:
   $$p_R(t) = R \cdot i(t)^2 = \frac{U^2}{R} e^{-2t / \tau}$$

2. **Total heat dissipated in resistor up to $t = \tau$**:
   $$W_R(\tau) = \int_{0}^{\tau} p_R(t)\,\mathrm{d}t = \int_{0}^{\tau} \frac{U^2}{R} e^{-2t / (RC)}\,\mathrm{d}t$$
   $$W_R(\tau) = \frac{U^2}{R} \left[ -\frac{RC}{2} e^{-2t / (RC)} \right]_0^{\tau} = \frac{1}{2} C U^2 \left(1 - e^{-2}\right)$$
   $$W_R(\tau) \approx \frac{1}{2} (1 - 0.135335)\, C U^2 \approx 0.432332 \cdot C U^2$$

3. **Energy stored in capacitor at $t = \tau$**:
   $$W_C(\tau) = \frac{1}{2} C [u_C(\tau)]^2 = \frac{1}{2} C U^2 \left(1 - e^{-1}\right)^2 \approx \frac{1}{2} (0.632121)^2 C U^2 \approx 0.199788 \cdot C U^2$$

4. **Energy supplied by source up to $t = \tau$**:
   $$W_z(\tau) = \int_{0}^{\tau} U \cdot i(t)\,\mathrm{d}t = U \int_{0}^{\tau} \frac{U}{R} e^{-t/\tau}\,\mathrm{d}t = C U^2 \left(1 - e^{-1}\right) \approx 0.632121 \cdot C U^2$$

#### Energy Conservation Check:
$$W_C(\tau) + W_R(\tau) = (0.199788 + 0.432332)\, C U^2 = 0.632120 \cdot C U^2 \equiv W_z(\tau)$$
The energy supplied by the source exactly matches the sum of stored electric field energy and dissipated thermal losses.

---

## 2. AC Frequency Response (High-Pass Coupling Filter)

When the output is measured across the resistor $R$:

$$H_{\text{HP}}(j\omega) = \frac{R}{R + \frac{1}{j\omega C}} = \frac{j\omega R C}{1 + j\omega R C}$$

Defining the **cutoff frequency** $f_c = \frac{1}{2\pi R C}$:

$$|H_{\text{HP}}(f)| = \frac{2\pi f R C}{\sqrt{1 + (2\pi f R C)^2}} = \frac{f / f_c}{\sqrt{1 + (f / f_c)^2}}$$
$$\phi_{\text{HP}}(f) = 90^\circ - \arctan(2\pi f R C) = \arctan\left(\frac{1}{2\pi f R C}\right)$$

* At $f \ll f_c$: $|H| \to 0$ (+20 dB/decade roll-off), $\phi \to +90^\circ$ (output leads input).
* At $f = f_c$: $|H| = \frac{1}{\sqrt{2}} \approx -3.01\,\text{dB}$, $\phi = +45^\circ$.
* At $f \gg f_c$: $|H| \to 1$ ($0\,\text{dB}$ pass-through), $\phi \to 0^\circ$.

---

## 3. Real-Time Web Audio Digital Model (IIRFilterNode)

To achieve authentic physical audio in the browser without relying on generic biquad filters, the simulator maps the analog transfer function to the discrete domain using the **Bilinear Transform with frequency prewarping**.

Analog high-pass prototype:
$$H(s) = \frac{s}{s + \omega_a}$$

Prewarped analog cutoff frequency for sampling rate $f_s$:
$$\omega_a = 2 f_s \tan\left(\frac{\pi f_c}{f_s}\right)$$

Applying the substitution $s = 2 f_s \frac{1 - z^{-1}}{1 + z^{-1}}$ gives:
$$H(z) = \frac{b_0 + b_1 z^{-1}}{a_0 + a_1 z^{-1}}$$

Normalized coefficients:
$$K = \tan\left(\frac{\pi f_c}{f_s}\right)$$
$$a_0 = 1, \quad a_1 = \frac{K - 1}{K + 1}$$
$$b_0 = \frac{1}{K + 1}, \quad b_1 = -\frac{1}{K + 1}$$

These coefficients are directly loaded into the Web Audio API's native `IIRFilterNode` (`new IIRFilterNode(audioContext, { feedforward: [b0, b1], feedback: [1, a1] })`), ensuring an exact 1st-order 6 dB/octave physical slope across all sample rates.
