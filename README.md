# OBER SOUND UNIVERSE — CANON DOCUMENT

**Status:** Locked (Working Title / Internal Use)  
**Purpose:** Defines the philosophy, structure, architecture and UX canon for the Ober Sound Universe platform and its first flagship experience.

---

## Brand & Platform Structure

### Ober Instruments
Umbrella brand / company that designs and ships creative musical technology experiences.

---

### Ober Sound Universe
The entire experiential product suite — a growing universe of musical environments, emotional worlds, and interactive sound instruments.

A user lives inside the Sound Universe.

---

### OMSE — Ober MotionSynth Engine
The core audio + motion technology engine that powers all Sound Universe experiences.

OMSE includes:
- Multi-voice architecture  
- Polyrhythm + timing engine  
- Layering engine  
- Routing / buss system  
- Spectral visualization framework  
- Preset + state engine  

OMSE is the technology.  
Ober Sound Universe is the experience built on it.

---

## 1️⃣ Current Project Scope

We are building:

    Ober Instruments
      → Ober Sound Universe
          → Galaxy0 (Working Title)
              Powered by OMSE

Galaxy0 is the first sound world / product.

---

## 2️⃣ Core Musical Architecture

### Voices
There are always four musical voices:

    Core
    Orbit A
    Orbit B
    Orbit C

---

### Core Voice
The emotional heart and sonic foundation of each Galaxy.

Core is not a single sample or tone.  
Core is a miniature layered instrument:

---

### Core Layer Structure
Core consists of three distinct internal layers:

**1️⃣ Core Low / Ground Layer**
- Deep emotional foundation  
- Centered  
- Stable  
- Grounding presence  

**2️⃣ Harmonizer Layer**
- Tonal intelligence  
- Chordal implication  
- Supports emotional context  
- Stereo-aware  

**3️⃣ Atmosphere Layer**
- Spatial consciousness  
- Environmental texture  
- Subtle movement  
- Perceived life  

All three layers mix into a single Core Buss Output.

Each layer:
- Has independent gain  
- Can be enabled / muted  
- Has spectral monitoring  

Core buss:
- Feeds into Master buss  
- Independently analyzable  
- Primary emotional anchor of the UI  

---

## Orbit Voices
Orbit A / Orbit B / Orbit C are expressive satellite voices.

They:
- Support rhythmic intelligence  
- Add movement  
- Add character  
- Add emotional complexity  

They are:
- Lighter CPU  
- Flexible in tone  
- Highly motion-capable  
- Polyrhythm capable  

---

## 3️⃣ Orbit Group Intelligence

Beyond individual orbits, we define:

### Orbit Group System
Controls how the three orbits behave together.

Includes:
- Orbit enable / disable  
- Relative volume relationships  
- Stereo spread / choreography  
- Arpeggiator behavior  
- Polyrhythm relationships  
- Rhythmic personality  

There will be Orbit Group Presets such as:
- Tight alignment  
- Breathing drift  
- Mathematical lattice  
- Chaotic beauty  

This is a defining feature.

---

## 4️⃣ Keyboard Requirement

From MVP forward, the system must support true instrument play.

Keyboard priority:
- Computer keyboard support  
- MIDI keyboard support  
- No demo-only playback  
- Must feel like a playable instrument  

---

## 5️⃣ Audio Engine Architecture

### Engine
Tone.js + Web Audio Foundation

---

### Routing Model

    Core Layers
        → Core Layer Gains
        → Core Buss
            → Master Buss
            → Master Output

    Orbit A → Orbit Buss → Master Buss
    Orbit B → Orbit Buss → Master Buss
    Orbit C → Orbit Buss → Master Buss

---

### Analyser Strategy
AnalyserNodes exist for:
- Master Output  
- Core Buss  
- Core Layers  
- Orbit A  
- Orbit B  
- Orbit C  

Spectral system must be:
- Smooth  
- Musical  
- Calm by default  

Performance rules:
- Master: Highest fidelity  
- Sub-voices: Throttled  
- Never visually overwhelming  

---

## 6️⃣ UI Canon

### Global UX Philosophy
Instrument must feel:

- Cinematic  
- Human  
- Emotionally intelligent  
- Visually calm but powerful  
- Intentional  
- Inspiring by default  

“Depth when desired, beauty by default.”

---

## Primary Layout Regions

### Top Bar — Identity & Navigation
- Brand / Galaxy  
- Master Preset  
- Tempo overview  
- System overview  

---

### Rhythm Intelligence Panel
- Transport  
- Tempo  
- Swing  
- Polyrhythm brain  
- Randomization hierarchy  

---

### Universe View (Main Screen)
Centered experience showing:
- Core (hero)  
- Orbits cluster  
- Spectral hero output  
- Calm, living motion  

Clicking Core or an Orbit opens deeper panel.

---

### Core Panel
Includes:
- Layer mixer  
- Per-layer controls  
- Core buss  
- Core spectrum  
- Layer spectral minis  
- Layer preset controls  

---

### Orbit Panel
Includes:
- Orbit preset selector  
- Motion controls  
- Polyrhythm role settings  
- Spectrum mini  

---

### Orbit Group Panel
Defines choreography.  
Preset based.  
Powerful. Intuitive.

---

### Control Deck (Advanced / Sculpt Mode)
One-screen power center:
- Mixer  
- Rhythm system  
- Sound shaping macros  
- Professional tools  
- Still elegant  

---

## 7️⃣ Spectral Visualization Canon

Spectral hierarchy:

**Primary Visual**
- Master Out OR Core Out

**Secondary**
- Individual voices  
- Small + ambient

**Deep View**
- Optional analytical mode  
- Not default  
- Never overwhelming  

Motion should feel alive, never chaotic.

---

## 8️⃣ MVP Definition

The MVP must achieve:

- Galaxy0  
- Two working master presets  
- Core 3-layer system working  
- Orbit placeholders audible  
- Master spectrum visualization  
- Core spectrum visualization  
- Keyboard input working  
- Feels musical, cinematic, alive  

(Randomizers / choreography / advanced mixer may come later)

---

## Canon Stability

The following are locked and cannot change casually:

- Four-voice architecture  
- Core is layered (3 layers minimum)  
- Orbit Group System exists  
- Spectral hierarchy philosophy  
- Playable instrument requirement  
- Calm UI philosophy  
- OMSE is the engine foundation  

Everything else may evolve.

---

### End of Canon
This document defines the soul of Ober Sound Universe and OMSE.  
If we honor this — the instrument will remain coherent, musical, powerful, and emotionally meaningful.