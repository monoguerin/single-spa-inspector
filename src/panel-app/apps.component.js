import React, { useState, useEffect, useMemo } from "react";
import { Scoped, always } from "kremling";
import AppStatusOverride from "./app-status-override.component";
import Button from "./button";
import { evalDevtoolsCmd } from "../inspected-window.helper.js";
import useImportMapOverrides from "./useImportMapOverrides";

const OFF = "off",
  ON = "on",
  LIST = "list",
  PAGE = "page";

export default function Apps(props) {
  const sortedApps = useMemo(() => sortApps(props.apps), [props.apps]);
  const importMaps = useImportMapOverrides();

  const [hovered, setHovered] = useState();
  const [overlaysEnabled, setOverlaysEnabled] = useState("off");

  useEffect(() => {
    if (hovered) {
      overlayApp(hovered);
      return () => deOverlayApp(hovered);
    }
  }, [hovered]);

  useEffect(() => {
    document.body.classList.add(props.theme);
    return () => {
      document.body.classList.remove(props.theme);
    };
  }, [props.theme]);

  return (
    <Scoped css={css}>
      <span>
        <div>
          <label htmlFor="overlayEnabledSelect">Overlays: </label>
          <select
            id="overlayEnabledSelect"
            value={overlaysEnabled}
            onChange={e => setOverlaysEnabled(e.target.value)}
          >
            <option value={OFF}>Off</option>
            <option value={ON}>On</option>
            <option value={LIST}>On list hover</option>
            <option value={PAGE}>On page hover</option>
          </select>
        </div>
        <div role="table" className={"table"}>
          <div role="row">
            <span role="columnheader">App Name</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Actions</span>
            {importMaps.enabled && (
              <span role="columnheader">Import Override</span>
            )}
          </div>
          {sortedApps.map(app => (
            <div
              role="row"
              key={app.name}
              onMouseEnter={() => setHovered(app)}
              onMouseLeave={() => setHovered()}
            >
              <div role="cell">{app.name}</div>
              <div role="cell">
                <span
                  className={always("app-status")
                    .maybe("app-mounted", app.status === "MOUNTED")
                    .maybe("app-not-mounted", app.status !== "MOUNTED")}
                >
                  {app.status.replace("_", " ")}
                </span>
              </div>
              <div role="cell">
                <AppStatusOverride app={app} />
              </div>
              {importMaps.enabled && (
                <div role="cell">
                  <input
                    className={always("import-override")}
                    aria-label={`Input an import-map override url for ${
                      app.name
                    }`}
                    value={importMaps.overrides[app.name] || ""}
                    onChange={e => {
                      importMaps.setOverride(app.name, e.target.value);
                    }}
                  />
                </div>
              )}
            </div>
          ))}
          {importMaps.enabled && (
            <div role="row">
              <div role="cell" className="summary-action">
                <Button onClick={importMaps.commitOverrides}>
                  Apply Overrides & Refresh
                </Button>
              </div>
            </div>
          )}
        </div>
      </span>
    </Scoped>
  );
}

function sortApps(apps) {
  return [...apps]
    .sort((a, b) => {
      const nameA = a.name.toUpperCase(); // ignore upper and lowercase
      const nameB = b.name.toUpperCase(); // ignore upper and lowercase
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      // names must be equal
      return 0;
    })
    .sort((a, b) => {
      const statusA =
        a.status === "MOUNTED" || !!a.devtools.activeWhenForced ? 1 : 0;
      const statusB =
        b.status === "MOUNTED" || !!b.devtools.activeWhenForced ? 1 : 0;
      if (statusA > statusB) {
        return -1;
      } else if (statusA < statusB) {
        return 1;
      } else {
        return 0;
      }
    });
}

function overlayApp(app) {
  if (
    app.status !== "SKIP_BECAUSE_BROKEN" &&
    app.status !== "NOT_LOADED" &&
    app.devtools &&
    app.devtools.overlays
  ) {
    evalDevtoolsCmd(`overlay('${app.name}')`).catch(err => {
      console.error(`Error overlaying applicaton: ${app.name}`, err);
    });
  }
}

function deOverlayApp(app) {
  if (app.devtools && app.devtools.overlays) {
    evalDevtoolsCmd(`removeOverlay('${app.name}')`).catch(err => {
      console.error(`Error removing overlay on applicaton: ${app.name}`, err);
    });
  }
}

const css = `
:root {
  --gray: #82889a;
  --blue-light: #96b0ff;
  --blue: #3366ff;
  --blue-dark: #2850c8;
  --pink: #e62e5c;
  --green: #28cb51;
  --table-spacing: .5rem;
}
body {
  font-family: sans-serif;
}

body.dark {
  background-color: #272822;
  color: #F8F8F2;
}

& [role="table"] {
  display: grid;
  grid-row-gap: var(--table-spacing);
  grid-template-columns: 1fr;
  padding: var(--table-spacing);
  width: max-content;
}

& [role="columnheader"] {
  color: var(--gray);
  font-size: .9rem;
  padding-left: .25rem;
}

& [role="row"] {
  align-items: center;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 2fr;
  grid-column-gap: calc(var(--table-spacing) * 2);
}

& [role="row"] [role="cell"]:nth-child(1) { grid-area: 1 / 1 / 2 / 2; }
& [role="row"] [role="cell"]:nth-child(2) { grid-area: 1 / 2 / 2 / 3; }
& [role="row"] [role="cell"]:nth-child(3) { grid-area: 1 / 3 / 2 / 4; }
& [role="row"] [role="cell"]:nth-child(4), 
& [role="row"] [role="cell"].summary-action { grid-area: 1 / 4 / 2 / 5; }

& .app-status {
  border-radius: 1rem;
  color: #fff;
  font-size: .75rem;
  padding: .25rem .5rem .125rem;
  text-shadow: 0px 2px 4px rgba(0,0,0,.15);
  text-transform: capitalize;
}

& .app-mounted {
  background-color: var(--green);
}

& .app-not-mounted {
  background-color: var(--pink);
}

& .import-override {
  border: 1.5px solid lightgrey;
  border-radius: 3px;
  box-sizing: border-box;
  font-size: .75rem;
  padding: .2rem;
  transition: all .15s ease-in-out;
  width: 100%;
}

& .import-override:focus {
  border-color: var(--blue);
}
`;
