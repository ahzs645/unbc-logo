# UNBC Logo Generator

The UNBC wordmark lockup, social-media profile pictures, and the Alumni crest as reusable code:
brand-correct department-line wrapping, white/black/green colour variants, and export to SVG,
PNG, WebP, and JPEG.

Extracted from [UNBCDoor](https://github.com/ahzs645/UNBCDoor), which consumes it as a git
submodule so the door-sign generator and any future project draw the same lockup from one source.

---

## Two ways in

**The standalone site** — type a department, pick colours, download the file. Run it locally with
`npm install && npm run dev`, or use the deployed GitHub Pages build (see *Deployment* below).

**The package** — import the rendering logic into your own app.

---

## Install as a submodule

```bash
git submodule add https://github.com/ahzs645/unbc-logo.git vendor/unbc-logo
git submodule update --init --recursive
```

Cloning a repo that uses it:

```bash
git clone --recurse-submodules https://github.com/ahzs645/<your-repo>.git
```

The package is consumed **from source** — there is no build step and nothing is published to npm.
Point your bundler at `vendor/unbc-logo/src/index.js`. In Vite, an alias keeps imports tidy:

```js
// vite.config.js
resolve: {
  alias: {
    '@unbc/logo': fileURLToPath(new URL('./vendor/unbc-logo/src/index.js', import.meta.url))
  }
}
```

Because it ships `.jsx` and modern ESM, your build must transpile JSX. Any Vite/Next/Webpack
setup with a React preset already does. The **core renderer has no JSX and no React**, so if you
only want SVG strings you can import `src/logo/renderLogoSvg.js` directly — including from Node.

---

## Rendering

### Framework-free

`renderLogoSvg()` returns a complete, standalone `<svg>` document as a string. It works in the
browser, in Node, in a worker — no DOM required.

```js
import { renderLogoSvg } from '@unbc/logo'

const svg = renderLogoSvg({
  departmentText: 'Faculty of Indigenous Studies, Social Sciences and Humanities',
  color: 'green',          // 'white' | 'black' | 'green' | any CSS colour
  background: 'none',      // 'none' | a variant name | any CSS colour
  padding: 8               // in viewBox units
})
```

| Option | Default | Meaning |
| --- | --- | --- |
| `departmentText` | `''` | The department line. Wraps automatically; `\n` forces a break. |
| `color` | `'white'` | Wordmark colour. |
| `departmentColor` | follows `color` | Department line colour, when it should differ. |
| `background` | `'none'` | Background rect; omitted entirely when `'none'`. |
| `padding` | `0` | Margin on all sides, in viewBox units. |
| `pixelWidth` | – | Sets `width`/`height`; height follows the aspect ratio. |
| `fontCss` | – | CSS injected into `<defs>`, for embedding `@font-face`. |
| `maxWidth` | `122` | Wrap width override, in viewBox units. |
| `square` | `false` | Centres the lockup on a square canvas (the short side grows). |

`renderCrestSvg({ variant })` does the same for the Alumni crest, where `variant` is `'full'` for
the original gold/green/black artwork or a colour to flatten it to one ink.

> The crest is **API-only and deliberately absent from the generator site**. It is a separate mark
> with its own usage rules, so it is not offered for free recolouring and download; apps that
> legitimately need it (such as the door-sign generator) use it through this API.

`renderLogoMarkup()` / `renderCrestMarkup()` return just the drawable fragment, for embedding in a
larger SVG rather than producing a standalone file.

### React

```jsx
import { UnbcLogoMark, AlumniCrest } from '@unbc/logo'

<svg viewBox="0 0 400 200">
  <UnbcLogoMark
    transform="translate(20, 20) scale(1.5)"
    departmentText="School of Engineering"
    color="white"
  />
  <AlumniCrest transform="translate(300, 20)" variant="full" />
</svg>
```

Both components default to the artwork's native appearance (white wordmark, full-colour crest),
so adding colour support did not change how existing callers render.

### Social-media profile pictures

`renderProfileSvg()` draws the square avatar used on UNBC social accounts: the UNBC letters on a
green panel over the top two thirds, with the department or group name centred in a white band
underneath, set in Helvetica Neue Bold. The layout is measured from the existing account
avatars.

```js
import { exportLogo, renderProfileSvg } from '@unbc/logo'

const svg = renderProfileSvg({ departmentText: 'Faculty of Environment' })

// In the browser: a 1080×1080 PNG with the brand font embedded.
await exportLogo({ mark: 'profile', departmentText: 'Student Life', format: 'png', pixelWidth: 1080 })
```

| Option | Default | Meaning |
| --- | --- | --- |
| `departmentText` | `''` | Caption. Wraps, and shrinks (down to 8 of 13 units) when it would not fit; `\n` forces a break. |
| `background` | `'gradient'` | The green radial glow, or any colour for a flat panel. |
| `markColor` | white | Colour of the UNBC letters. |
| `bandColor` | white | Colour of the caption band. |
| `textColor` | deep green | Caption colour. |
| `pixelWidth` | – | Sets `width` and `height` (the image is square). |

Most platforms crop avatars to a circle. `findCircleCropOverflow(text)` returns the caption lines
that crop would clip, and the site previews the circle crop and warns about them.

---

## Colour variants

The production artwork is authored as a **white knockout** — 40 hard-coded `fill="#fff"`
attributes meant for a dark ground. Rather than maintain three near-identical SVGs, the fills are
rewritten at render time.

Fills stay *presentation attributes* rather than moving to `currentColor`: `svg2pdf` and
standalone `<img>` rasterization both resolve presentation attributes, but neither reliably
inherits `currentColor` from a host document.

The crest needs more than a blanket replacement. It is a solid body with the UNBC wordmark and the
ALUMNI banner **knocked out** of it in white; flattening every fill to one colour would fill those
holes back in and leave a solid blob. So body and knockout are repainted separately, and the
knockout default follows the body — a dark crest keeps its white detail, while a white crest makes
the detail transparent so the backdrop shows through. Override it with `knockoutColor`.

---

## Wrapping

`splitDepartmentText()` is the single source of truth for how a department line breaks.

It measures against a table of advance widths taken from Helvetica Neue Black, rather than a
browser canvas. That makes wrapping **deterministic and synchronous** — identical in a live
preview, a PNG export, and a PDF, and correct on the first render instead of after the webfont
loads.

```js
splitDepartmentText('Faculty of Indigenous Studies, Social Sciences and Humanities')
// ['Faculty of Indigenous', 'Studies, Social Sciences', 'and Humanities']
```

A single word wider than the lockup cannot be broken and will overhang; the generator site flags
this rather than silently clipping. Explicit `\n` breaks are preserved.

The canvas grows to fit: one to three department lines sit inside the artwork's native 80-unit
box, and beyond that `measureLockupHeight()` extends it so a tall lockup is never clipped.

---

## Export

```js
import { exportLogo, renderLogoBlob } from '@unbc/logo'

// Render and download in one call.
await exportLogo({
  departmentText: 'School of Engineering',
  color: 'white',
  background: 'green',
  format: 'png',      // 'svg' | 'png' | 'webp' | 'jpeg'
  pixelWidth: 2048
})

// Or get the Blob and handle it yourself.
const blob = await renderLogoBlob({ format: 'webp', pixelWidth: 1024 })
```

Raster formats go SVG → `<img>` → `<canvas>` → Blob, so the vector is rasterized *at* the target
resolution rather than upscaled — text stays crisp at any size.

Exported SVGs embed the brand face as base64. A standalone SVG cannot see the host page's
`@font-face` rules, so without this the department line would silently fall back to a system sans
and stop matching the preview. Only the Black (900) face is embedded: the wordmark is outlined
paths, so the department line is the lockup's only text.

PNG and WebP keep transparency. JPEG has no alpha channel, so a transparent request is composited
onto white instead of coming out black. `isFormatSupported()` probes the browser's encoder — WebP
support is not universal.

---

## Department presets

The full UNBC hierarchy ships as data, flattened into 61 ready-to-use lockup presets:

```js
import { departmentPresets, searchDepartmentPresets } from '@unbc/logo'

searchDepartmentPresets('engineering')
// [{ id, label: 'School of Engineering', path: 'Academic Departments › … ', lines: [...] }]
```

Each preset carries its pre-wrapped `lines`, so a picker can show how tall a lockup will be
without re-measuring. Presets are *derived* from `departmentData.js` rather than duplicated, so
adding a department updates both the drill-down selector and the preset list.

`DepartmentSelector` (React) provides the searchable drill-down UI.

---

## Fonts

`fonts/` holds the Helvetica Neue faces the lockup is built from, and `src/fonts.css` declares the
family. The wordmark itself is outlined paths and needs no font — only the department line renders
as text, at weight 800 (the Black face). The profile picture's caption is set in Bold (700).

Exports embed only the face they draw, from small Latin subsets: `HelveticaNeueBlack.ttf` (24KB)
and `HelveticaNeueBoldLatin.ttf` (19KB, rebuilt with `python3 scripts/subset-bold-font.py`).

`HelveticaNeueBold.ttf` shipped without a `cmap` table, which browsers reject outright. Its
character map was rebuilt from the standard glyph names in its `post` table; the outlines and
metrics are untouched.

> These are **licensed commercial fonts**, redistributed here on the same basis as the UNBCDoor
> repository they came from. Check your licence before relying on them in a new context.

---

## Artwork

`src/assets/markup.js` is **generated** from the `.svg` files by `npm run build:assets` and
committed, so consumers get working artwork with no build step and the core stays free of Vite's
`?raw` import syntax.

After editing an `.svg`, regenerate it:

```bash
npm run build:assets
```

`npm test` fails if the committed module has drifted from its sources, so a forgotten regeneration
cannot ship silently.

---

## Development

```bash
npm install
npm run dev            # generator site at http://localhost:5183
npm test               # wrapping, colour, preset, and export-naming tests
npm run build          # static site into dist/
npm run build:assets   # regenerate src/assets/markup.js from the SVGs
```

---

## Deployment

`.github/workflows/pages.yml` builds and publishes the generator site to GitHub Pages on every
push to `main`, with *Settings → Pages → Source* set to **GitHub Actions**.

**Live at <http://projects.ahmadjalil.com/unbc-logo/>** — the account's custom domain, so project
sites are served from `<domain>/<repo>/` rather than `ahzs645.github.io`.

The site is served from `/unbc-logo/`; that prefix is set as Vite's `base` and must match the
repository name. Renaming the repository means updating `base` in `vite.config.js` to match, or
the built assets 404.
