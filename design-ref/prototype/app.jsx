/* @jsx React.createElement */
// FlowBase main app — wires variations into design_canvas + tweaks_panel

const { useState } = React;

const DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "density": "default",
  "aiPanelMode": "right",
  "showAiBadges": true
}/*EDITMODE-END*/;

function App() {
  const [tw, setTw] = useTweaks(DEFAULTS);

  // Sync theme to <body> so tokens cascade everywhere — including the canvas chrome edges
  React.useEffect(() => {
    document.body.className = tw.theme === "dark" ? "dark" : "";
    document.body.setAttribute("data-theme", tw.theme);
  }, [tw.theme]);

  const setTheme = (next) => setTw("theme", next);

  return (
    <React.Fragment>
      <DesignCanvas title="FlowBase — data board" subtitle="Import flow → Sheet board · 3 variations">
        <DCSection id="import" title="Import flow" subtitle="Google Sheets URL → AI schema preview → confirm">
          <DCArtboard id="import-1" label="Step 2 · Preview + AI schema recommendations" width={1240} height={760}>
            <ImportFlow theme={tw.theme} setTheme={setTheme} showAiBadges={tw.showAiBadges} />
          </DCArtboard>
        </DCSection>

        <DCSection id="board" title="Board main — 3 variations" subtitle="Same data, different layout for the AI activity surface">
          <DCArtboard id="v1" label="V1 · Default — Linear-canonical, persistent right activity rail" width={1440} height={880}>
            <BoardV1 theme={tw.theme} setTheme={setTheme} density={tw.density} showAiBadges={tw.showAiBadges} />
          </DCArtboard>
          <DCArtboard id="v2" label="V2 · Doc-feel — Notion/Coda title block, AI panel collapsed by default" width={1440} height={880}>
            <BoardV2 theme={tw.theme} setTheme={setTheme} density={tw.density} showAiBadges={tw.showAiBadges} />
          </DCArtboard>
          <DCArtboard id="v3" label="V3 · Focus — narrow rail + bottom AI activity strip" width={1440} height={880}>
            <BoardV3 theme={tw.theme} setTheme={setTheme} density={tw.density} showAiBadges={tw.showAiBadges} />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme">
          <TweakRadio
            label="Mode"
            value={tw.theme}
            onChange={(v) => setTw("theme", v)}
            options={[
              { value: "light", label: "Light" },
              { value: "dark",  label: "Dark"  },
            ]}
          />
        </TweakSection>
        <TweakSection label="Sheet density">
          <TweakRadio
            label="Row height"
            value={tw.density}
            onChange={(v) => setTw("density", v)}
            options={[
              { value: "compact",     label: "Compact" },
              { value: "default",     label: "Default" },
              { value: "comfortable", label: "Comfort" },
            ]}
          />
        </TweakSection>
        <TweakSection label="AI">
          <TweakToggle
            label="AI column badges"
            value={tw.showAiBadges}
            onChange={(v) => setTw("showAiBadges", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
