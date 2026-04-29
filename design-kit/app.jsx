// Main App — combines shell + screens, exposes Tweaks (slate temp, accent intensity, sidebar variant)

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "slateTemp": "neutral",
  "mainBg": "blueish",
  "accentIntensity": "moderate",
  "sidebarVariant": "dark"
}/*EDITMODE-END*/;

// Slate temperature ramps — sidebar bg, text, hover
const SLATE_RAMPS = {
  cooler:  { bg: "#0F172A", elev: "#1E293B", border: "#1E293B", text: "#E2E8F0", muted: "#94A3B8", section: "#64748B" },
  neutral: { bg: "#1E293B", elev: "#334155", border: "#334155", text: "#E2E8F0", muted: "#94A3B8", section: "#64748B" },
  warm:    { bg: "#1F2937", elev: "#374151", border: "#374151", text: "#E5E7EB", muted: "#9CA3AF", section: "#6B7280" },
  warmest: { bg: "#262228", elev: "#3B3539", border: "#3B3539", text: "#EDE5E0", muted: "#A89A95", section: "#6B5C57" },
};

const MAIN_BGS = {
  white:    { bg: "#FFFFFF", subtle: "#F8FAFC" },
  warm:     { bg: "#FBFAF8", subtle: "#F4F2EE" },
  blueish:  { bg: "#F8FAFC", subtle: "#F1F5F9" },
  slate:    { bg: "#F1F5F9", subtle: "#E2E8F0" },
};

const App = ({ embedded = false, overrides = {} }) => {
  const tweaks = window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, () => {}];
  const [tw, setTweak] = tweaks;
  const T = { ...tw, ...overrides };

  const [route, setRoute] = React.useState({ screen: "overview", id: null });

  // Apply slate ramp + accent intensity via inline style
  const ramp = SLATE_RAMPS[T.slateTemp] || SLATE_RAMPS.cooler;
  const main = MAIN_BGS[T.mainBg] || MAIN_BGS.white;

  const styleVars = {
    "--sidebar": ramp.bg,
    "--sidebar-elev": ramp.elev,
    "--slate-800": ramp.elev,
    "--slate-900": ramp.bg,
    "--bg": main.bg,
    "--bg-subtle": main.subtle,
  };

  const crumbs = (() => {
    if (route.screen === "overview") return ["Mineral Risk Analytics", "Overview"];
    if (route.screen === "materials") return ["Mineral Risk Analytics", "Supply chain", "Materials"];
    if (route.screen === "material-detail") {
      const m = window.MRA_DATA.MATERIALS.find(x => x.id === route.id);
      return ["Mineral Risk Analytics", "Supply chain", "Materials", m?.name || "—"];
    }
    if (route.screen === "chemistries") return ["Mineral Risk Analytics", "Supply chain", "Chemistries"];
    return ["Mineral Risk Analytics"];
  })();

  const sideActive = route.screen === "material-detail" ? "materials" : route.screen;

  return (
    <div className="app" style={styleVars}>
      <Sidebar active={sideActive} onNavigate={(id) => setRoute({ screen: id, id: null })} />
      <main className="main">
        <Topbar crumbs={crumbs} />
        {route.screen === "overview" && <Overview />}
        {route.screen === "materials" && <MaterialsList onOpen={(id) => setRoute({ screen: "material-detail", id })} />}
        {route.screen === "material-detail" && <MaterialDetail id={route.id || "cobalt"} onBack={() => setRoute({ screen: "materials", id: null })} />}
        {route.screen === "chemistries" && <Chemistries />}
        {(route.screen === "companies" || route.screen === "scores" || route.screen === "events" || route.screen === "regs") && (
          <div className="page">
            <div className="page-head"><div><h1>{sideActive[0].toUpperCase() + sideActive.slice(1)}</h1><p>This screen is not part of the current exploration.</p></div></div>
            <div className="card"><div className="card-body" style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>
              Out of scope for this prototype — try Overview, Materials, or Chemistries.
            </div></div>
          </div>
        )}
      </main>

      {!embedded && window.TweaksPanel && (
        <TweaksPanel title="Tweaks">
          <TweakSection title="Sidebar slate">
            <TweakRadio
              label="Temperature"
              value={T.slateTemp}
              onChange={(v) => setTweak("slateTemp", v)}
              options={[
                { value: "cooler",  label: "Cool" },
                { value: "neutral", label: "Neutral" },
                { value: "warm",    label: "Warm" },
              ]}
            />
          </TweakSection>
          <TweakSection title="Main background">
            <TweakRadio
              label="Surface"
              value={T.mainBg}
              onChange={(v) => setTweak("mainBg", v)}
              options={[
                { value: "white",   label: "White" },
                { value: "blueish", label: "Cool" },
                { value: "warm",    label: "Warm" },
                { value: "slate",   label: "Slate" },
              ]}
            />
          </TweakSection>
        </TweaksPanel>
      )}
    </div>
  );
};

window.App = App;
