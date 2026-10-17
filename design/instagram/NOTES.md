# Instagram Grid Analysis — Claws by D (@clawsby_d)

## Source
Two screenshots from her Instagram profile grid (design/instagram/).

---

## Dominant colours (sampled from her actual nail work)

| Swatch | Hex | Appears in |
|--------|-----|-----------|
| Deep burgundy / wine | `#6B1A2C` | Bold gel sets, bridal-look reds |
| Rose red | `#C0334A` | Extension sets, festive looks |
| Midnight navy with rhinestones | `#1A1A3E` | Glam press-on cards |
| Nude / warm beige | `#D4B8A0` | Everyday gel sets on natural nails |
| Soft blush | `#F0C8D0` | Dainty sheer looks |
| Chrome silver | `#C8CDD6` | Chrome finish close-ups |
| Clear / glass | `#F5F5F7` | Glass-tip extensions |
| Warm ivory (skin tones, not nails) | `#E8C9A8` | Hand photography |

## Backgrounds in her photography
- **Flat lay on white/cream surface** — most common; clean studio-feel
- **Natural light hands outdoors** — warm afternoon light, warm skin tones
- **Nail art product cards** (Reels covers) — white background, bold typography
- **Dark Instagram UI** — this is the app theme, not her photos

## Mood range across her grid
Her grid runs a genuine **full dainty-to-glam range**:
- Soft sheer glazed nails and Micro French sets (glam 1–2)
- Chrome ombre and pearl accents (glam 3)
- Hand-painted florals and signature ombre (glam 3–4)
- Dark rhinestone sets and bold reds (glam 4–5)
- Full bridal sets with 3D work (glam 5)

The **volume is weighted toward everyday/college** — gel polish and light extensions dominate the grid count. The **glam shots are fewer but photographed better** and pull more visual weight.

## Her 5 strongest posts
1. **Navy rhinestone press-on set** — a full "Nail Art" product card on white. Clean composition, showcases craftsmanship; top performer visually.
2. **Deep red extension set on a birthday setup** — cake + nails together; lifestyle context that communicates her customer demographic.
3. **Nude extension close-up outdoors** — warm light, real hands; the most natural and relatable.
4. **Chrome ombre almond set** — demonstrates technical range; the metallic finish reads well on a phone screen.
5. **Hindi Reels text slide ("Kitna paise kamaiti ho")** — authentic personality that connects with the college audience; not nail work but shows her voice.

---

## Palette adjustments from the spec

### Direction A — Lookbook

| Token | Spec | Adjusted | Reason |
|-------|------|---------|--------|
| `--milk` | `#FBF7F8` | **`#FAF6F7`** | Slightly warmer; her photography backgrounds lean warm ivory, not cool. Contrast maintained: ink ratio 16.7:1. |
| `--blush` | `#F2C4CE` | **`#F0C0CB`** | Her softest nail tones are slightly cooler than the spec's blush. Visual match to her sheer looks. |
| `--accent-dainty` | `#A3405A` | **unchanged** | Her rose reds confirm this is the right hue for the mid-glam tones. 5.75:1 on milk. |
| `--accent-glam` | `#8C1332` | **`#851230`** | Her darkest burgundy is fractionally deeper. Contrast improves from 8.8 → 9.2:1 on milk. |

All other Direction A tokens are confirmed by the grid.

### Direction B — Lacquer

| Token | Spec | Adjusted | Reason |
|-------|------|---------|--------|
| `--lacquer` | `#1B0F17` | **unchanged** | Grid shows minimal dark-background photography; the spec's choice is correct. |
| `--petal` | `#F4B6C6` | **`#F2B0C2`** | Her softest blush tones on dark are fractionally cooler/deeper than the spec. Contrast 11.2:1 on lacquer. |

All other Direction B tokens are confirmed.

---

## Recommendation
**Direction A is right for her customer profile** — everyday college students in daylight on budget phones. Her photography looks best on white/warm grounds.

Build **B as the alternative** to show her at her most dramatic. If her glam posts perform better over the next month, B could replace A.
