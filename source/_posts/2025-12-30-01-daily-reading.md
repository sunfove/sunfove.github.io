---
title: "📚 Daily Reading: The Maxwell Relations and Thermodynamic Potentials | 2025-12-30 01:22"
date: 2025-12-30 01:22:29
categories: Daily Reading
tags: [Learning, The Maxwell Relations and Thermodynamic Potentials]
---

## ☕ Morning English
![](https://staticedu-wps-cache.iciba.com/image/05d65b68b31e2c60017298b2164a841a.png)
> **Yesterday's shadow elevates today's me.**
> *昨日之影，垫高今日之我。*

---

## 🧠 Deep Dive: The Maxwell Relations and Thermodynamic Potentials

### ❓ The Challenge
Consider a paramagnetic salt that obeys Curie's law, where the magnetization M is given by M = (C/T)H, with C being the Curie constant, T the absolute temperature, and H the applied magnetic field. The fundamental thermodynamic relation for such a system is dU = T dS + H dM, where U is the internal energy. (a) Derive the Maxwell relation from the Helmholtz free energy F = U - TS for this system. (b) Using this Maxwell relation and the given Curie's law, show that the heat capacity at constant magnetization, C_M, is independent of M. (c) Calculate the difference between the heat capacity at constant field, C_H, and C_M, and interpret the result physically.

---

### 📝 Detailed Analysis
This problem explores the interplay between thermodynamics and magnetic systems, specifically focusing on Maxwell relations derived from thermodynamic potentials. Let's proceed step-by-step.

**Part (a): Deriving the Maxwell relation from the Helmholtz free energy**

For the paramagnetic system, the fundamental relation is dU = T dS + H dM. The Helmholtz free energy is defined as F = U - TS. Taking the differential:
dF = dU - T dS - S dT.
Substituting dU from the fundamental relation:
dF = (T dS + H dM) - T dS - S dT = H dM - S dT.
Thus, F is naturally expressed as a function of M and T: F = F(M, T). From dF = H dM - S dT, we identify the partial derivatives:
(∂F/∂M)_T = H and (∂F/∂T)_M = -S.
Since dF is an exact differential, the mixed second partial derivatives must be equal (Clairaut's theorem). Therefore:
∂/∂T (∂F/∂M)_T = ∂/∂M (∂F/∂T)_M.
Substituting the expressions for the first derivatives:
(∂H/∂T)_M = -(∂S/∂M)_T.
This is the Maxwell relation derived from the Helmholtz free energy for this magnetic system. Physically, it relates how the magnetic field changes with temperature at constant magnetization to how entropy changes with magnetization at constant temperature.

**Part (b): Showing C_M is independent of M**

The heat capacity at constant magnetization is defined as C_M = T (∂S/∂T)_M. To show it is independent of M, we need to examine how C_M varies with M. Consider the derivative of C_M with respect to M at constant T:
(∂C_M/∂M)_T = T ∂/∂M (∂S/∂T)_M = T ∂/∂T (∂S/∂M)_T, by swapping the order of differentiation (since S is a state function).
From the Maxwell relation in part (a), (∂S/∂M)_T = -(∂H/∂T)_M. Substituting:
(∂C_M/∂M)_T = T ∂/∂T [-(∂H/∂T)_M] = -T (∂²H/∂T²)_M.
Now, using Curie's law: M = (C/T)H, which can be rearranged as H = (T/C)M. Therefore, H is linear in T at constant M: H = (M/C)T. Then:
(∂H/∂T)_M = M/C, and (∂²H/∂T²)_M = 0.
Thus, (∂C_M/∂M)_T = -T * 0 = 0, meaning C_M does not depend on M. So, C_M is a function of temperature only. Intuitively, this arises because Curie's law implies a linear relationship between H and T at fixed M, making the second derivative vanish. In simpler terms, the energy required to change the temperature doesn't depend on how magnetized the system is, due to the specific form of the magnetic equation of state.

**Part (c): Calculating C_H - C_M and physical interpretation**

The heat capacity at constant field is C_H = T (∂S/∂T)_H. To find the difference, we relate entropy changes under different conditions. Consider S as a function of T and M: S = S(T, M). Then:
dS = (∂S/∂T)_M dT + (∂S/∂M)_T dM.
At constant H, M varies with T according to Curie's law: M = (C/T)H, so dM = -(C/T²)H dT. Substituting into dS:
dS = (∂S/∂T)_M dT + (∂S/∂M)_T * [-(C/T²)H dT].
Thus, (∂S/∂T)_H = (∂S/∂T)_M - (C/T²)H (∂S/∂M)_T.
Multiply by T to get heat capacities:
C_H = C_M - (C/T) H (∂S/∂M)_T.
From the Maxwell relation, (∂S/∂M)_T = -(∂H/∂T)_M = -M/C (since from Curie's law, (∂H/∂T)_M = M/C). Substituting:
C_H = C_M - (C/T) H * (-M/C) = C_M + (H M)/T.
Using Curie's law again, M = (C/T)H, so H M = (C/T)H². Therefore:
C_H - C_M = (C/T²) H².

**Physical Interpretation:** The difference C_H - C_M is positive and proportional to H²/T². This means that more heat is required to raise the temperature at constant field compared to constant magnetization. Why? At constant H, as T increases, M decreases according to Curie's law (since M ∝ 1/T). This change in magnetization involves work done by the magnetic field, which adds to the energy input needed. Specifically, when heating at constant H, the system does work on the surroundings as M decreases, so additional heat must be supplied to compensate for this work, increasing C_H relative to C_M. In contrast, at constant M, no such work is done, so C_M is lower. This highlights how constraints affect heat capacities in thermodynamic systems, with implications for cooling techniques like adiabatic demagnetization, where reducing H at constant entropy lowers T.

---

*(Auto-generated at 01:22)*
