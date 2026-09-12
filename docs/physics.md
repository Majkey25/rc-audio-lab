# RC equations and digital audio

The continuous model follows the RC treatment in MIT course materials. Source entries and links are in [references](references.md). The Czech report contains the full worked project.

## Transient response

Choose current positive toward the capacitor's positive electrode. The resistor voltage is the drop in that direction. Kirchhoff's loop law and the capacitor relation give

$$RC\frac{du_C}{dt}+u_C=u_{\mathrm{in}},\qquad i=C\frac{du_C}{dt},\qquad \tau=RC.$$

For a step to constant $U$, with $u_C(0)=0$:

$$u_C=U(1-e^{-t/\tau}),\qquad u_R=Ue^{-t/\tau},\qquad i=\frac UR e^{-t/\tau}.$$

For discharge from $U_0$, short the input without changing reference directions:

$$u_C=U_0e^{-t/\tau},\qquad u_R=-u_C,\qquad i=-\frac{U_0}{R}e^{-t/\tau}.$$

Negative discharge current is expected. Time must remain nonnegative. The animation clamps the first animation-frame interval because its timestamp can precede effect initialization.

## Energy

$$W_R(t)=\int_0^t Ri(s)^2\,ds=\frac12CU^2(1-e^{-2t/\tau}).$$

At $t=\tau$, $W_R=0.4323323584CU^2$. Charging-source energy is $W_z=CU^2(1-e^{-t/\tau})$ and stored energy is $W_C=\tfrac12Cu_C^2$. Algebra gives $W_C+W_R=W_z$ exactly, before display rounding. During discharge, $W_C+W_R=\tfrac12CU_0^2$ and the source contributes zero.

## High-pass coupling circuit

The output is across R, with ideal source impedance and no additional load:

$$H(s)=\frac{sRC}{1+sRC},\qquad f_c=\frac1{2\pi RC}.$$

$$|H(j\omega)|=\frac{\omega RC}{\sqrt{1+(\omega RC)^2}},\qquad \phi=\operatorname{atan2}(1,\omega RC).$$

At $f_c$, magnitude is $1/\sqrt2$, gain is −3.0103 dB and phase is +45°. At DC, magnitude is zero and phase is undefined. The logarithmic x-axis only receives positive frequencies; negative dB values use a linear vertical axis.

With source resistance $R_s$ and input load $R_L$, the more general result is

$$H(s)=\frac{sCR_L}{1+sC(R_s+R_L)}.$$

The app sets $R_s=0$ and uses its R control for $R_L$. Its rotary control is an educational parameter control, not a claim that every commercial coupling network contains an adjustable resistor.

## Audio processor

Use the bilinear substitution $s=K(1-z^{-1})/(1+z^{-1})$, with $K=\omega_c/\tan(\pi f_c/f_s)$. After normalization,

$$k=\tan(\pi f_c/f_s),\quad b_0=\frac1{1+k},\quad b_1=-b_0,\quad a_1=1-2b_0.$$

The production `rc-processor.js` evaluates

$$y[n]=b_0(x[n]-x[n-1])+(2b_0-1)y[n-1].$$

One input/output state pair is kept per channel. The application requests a 48 kHz audio context and uses mono output. R/C updates change the shared coefficient through an AudioParam with a 12 ms smoothing constant. Bypass crossfades the unfiltered and filtered samples with the same input gain. Nodes are not created for each slider event.

The cutoff agrees with the analog model. Away from it, the bilinear mapping warps the frequency axis, particularly near Nyquist. This difference is plotted after audio starts; the app does not claim exact analog equivalence over the entire audio band. Equations describe settled parameter values, not the brief smoothing interval.

## Recorded example and verification

The FreePats F2 recording is transposed into an eight-note E2 riff using native offline buffer-source playback and short attack/release ramps. The lower variant transposes the same recording by another octave. This changes pitch; it is not a recording of a separate bass guitar. Samples are normalized once before filtering, with no adaptive loudness compensation.

Automated browser tests render the actual worklet, recover output amplitude and phase by sine/cosine least-squares fitting, and compare three frequencies against the DSP response. A separate test filters the first three seconds of the original recording at R = 100 kΩ and C = 100 nF / 2.2 nF. The measured mean-square ratio is approximately −10.19 dB. This number belongs to that sample and window, not every input signal.
