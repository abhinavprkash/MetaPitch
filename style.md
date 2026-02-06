Below is a **clean, structured style spec** you can hand directly to Claude. This is not implementation—this is **visual language + rendering intent**.

---

## Overall Visual Identity

* **Futuristic analytical hologram**
* Feels like a **command-room visualization**, not a game UI
* Dark void background, high contrast, emissive geometry
* Everything looks *projected*, *scanned*, or *computed*, never “rendered for fun”

Think:

* **Blue Lock (Ego POV)** analysis screen
* **TRON grid field**
* **NASA / JPL wireframe schematics**
* **Sports broadcast meets sci-fi tactical display**

---

## Color & Material Language

* **Primary colors:** cyan / electric blue / white
* **Secondary accents:** subtle teal, faint orange for highlights
* **No flat colors**

  * All surfaces are either:

    * emissive lines
    * wireframes
    * translucent holographic planes
* **Glow is controlled**, thin, precise—not neon blobs
* Use additive blending, bloom only on edges and paths

---

## Field Design (TRON-inspired)

* Field is **not grass**
* It is a **procedural grid surface**

  * Thin glowing lines form:

    * yard lines
    * hash marks
    * boundaries
* Grid subtly animates or pulses
* Field exists in a **dark void**, stadium implied, not detailed
* Slight curvature or depth to avoid flatness
* Field slowly rotates or subtly floats → pseudo-AR feel

---

## Player Representation (Rover / Schematic Style)

Players are **not dots** and **not realistic humans**.

Each player is a **minimal volumetric construct**:

* Core body:

  * vertical capsule or short cylinder
  * semi-transparent
  * faint wireframe outline
* Base:

  * circular ring on the ground (anchor)
  * ring pulses when selected or active
* Internal detail:

  * faint internal lines or layers (like mechanical internals)
  * evokes the **Mars rover wireframe** aesthetic
* Absolutely no faces or limbs
* They read as **entities**, not avatars

---

## Identity & Information Projection

* Each player has a **vertical laser tether**

  * Thin, straight beam
  * Extends upward into space
* At the top of the tether:

  * a **floating holographic card**
  * contains:

    * player name / number
    * minimal icon or silhouette
* Cards gently drift, never static
* This is inspired by:

  * Blue Lock analysis screens
  * “laser-from-heaven” sci-fi targeting visuals

---

## Motion & Trajectories

* Past movement:

  * glowing trails
  * fade over time
  * slightly curved, spline-based
* Future possibilities:

  * **dotted or dashed splines**
  * thinner, semi-transparent
  * multiple branches visible at once
* Optimal path:

  * solid line
  * brighter, thicker glow
  * visually dominant but still clean

---

## Prediction / Analysis Overlays

* Influence zones:

  * faint Voronoi / soft radial fields
  * appear briefly, then fade
* Direction cones:

  * thin, translucent wedges
* Probabilities:

  * encoded as:

    * brightness
    * line thickness
    * pulse frequency
* Numbers are minimal

  * analysis is primarily **visual**, not textual

---

## Camera & Perspective

* Default camera:

  * angled, not top-down
  * feels like a **floating observer**
* Slow orbital motion at rest
* When paused:

  * camera gently stabilizes
* Optional snap to:

  * broadcast angle
  * inferred camera pose from image
* No hard cuts—everything eases

---

## UI Philosophy

* No panels that feel like dashboards
* UI elements float in 3D space
* Labels appear contextually, then disappear
* The visualization itself is the interface

---

## Emotional Target

* Calm
* Precise
* Powerful
* Feels like:

  > “I am seeing the *decision structure* of the game”

Not hype.
Not arcade.
Not cartoon.

---

If you want next:

* I can compress this into a **single paragraph Claude prompt**.
* Or map each section → **Three.js primitives + materials**.
* Or help you define **one canonical hero scene** for the demo.
