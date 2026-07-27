// Variants overview — render the App with different palette overrides
// inside the design canvas.

const VARIANTS = [
  {
    id: "cool-slate",
    title: "A · Cool slate",
    note: "Recommended. Cool slate sidebar (#0F172A), white main, terracotta accent moderate. Linear/Retool register; brand carried through accent only.",
    overrides: { slateTemp: "cooler", mainBg: "white" },
  },
  {
    id: "neutral-slate",
    title: "B · Neutral slate",
    note: "Slightly warmer sidebar (#1E293B) for less Linear association, paired with a tinted blue-gray main. Holds together well at scale; reads less stark.",
    overrides: { slateTemp: "neutral", mainBg: "blueish" },
  },
  {
    id: "warm-bridge",
    title: "C · Warm bridge",
    note: "Warmest slate (#262228) + warm cream main. The bridge between data tool and the wine-stone Hub — same building, adjacent room.",
    overrides: { slateTemp: "warmest", mainBg: "warm" },
  },
];

window.VARIANTS = VARIANTS;
