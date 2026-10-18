# Shor arithmetic SVG: owned, fixed-data inspection module

## Grounding / problem

`TutorialLayout.astro` loads shared MathJax and `fit-content.ts`; no page-transition mechanism. `GroverReflectionIllustration.astro` shows SSR SVG plus `data-original-image`, which excludes figure text from authored prose and Bold gate context. Its shared client selection is not reused. The two original PNGs have X0..15/f(x)0..12 and [1,2,4,8]×4; the second adds only red rings at (0,1)/(4,1).

## Caller usage / shape

```astro
<ShorMod15Graph />
<ShorMod15Graph markedPeriod />
```

Public `Props { markedPeriod?: boolean }` hides fixed data, grid geometry, red-ring policy, pointer-coordinate transforms, keyboard behavior and instance state. One `ShorMod15Graph.astro` owns SSR and local script. The immutable SSR values drive polyline/markers; the browser reads emitted point data/coordinates, never carries a second table or computes quantum states.

Interaction state is a closure per root. `inspect(index:number|null):void` is the only state transition; null hides selection/readout. Click maps client coordinates through inverse SVG screen CTM and selects the nearest emitted point x. Arrow, Home, End, Enter, Space, Escape select or clear values. All original geometry and red period rings are invariant. One focus target gives a real whole-graph hit area rather than sixteen tiny tab stops.

## Synthesis decision / alternatives

Two read-only architect candidates considered (1) SSR Astro plus instance-local script, (2) autonomous custom element with disconnect/AbortController and a shared data module. Use (1) as base: static full-page navigation does not need upgrade/reconnection lifecycle or a public element contract. Graft (2)'s independent instance-state invariant and one-focus-target model. Reject a generic chart interface because it leaks axis/series/ring configuration to the caller without another use case. No transport/wire representation on the public API, no graph-wide selection state, no extra coordinate helper files.

## Accepted tradeoffs / checks

Fixed original geometry instead of generic chart configuration; responsive SVG viewBox rather than inner scrolling or clipping. Original labels scale with the original figure, while the HTML readout remains readable after interaction. Existing `fit-content` is used only for indivisible source TeX, never native canvas. Non-GPU tests pin all 16 coordinates/values, both tick ranges/labels, red-ring locations, click at x4, keyboard endpoints/Escape and two-instance isolation at390/1440×DPR1/2. No GPU/quantum simulator or production readback.
