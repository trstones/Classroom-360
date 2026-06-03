// =============================================================================
// search-inject.js  |  Classroom Search Widget for TDx
// =============================================================================
// DEPLOYMENT:
//   1. Upload this file to GitHub Pages (same place as inject-snippet-prod.js).
//   2. In TDx, add this script via the KB article's *script injection field*
//      (the same mechanism used for inject-snippet-prod.js) — NOT as a raw
//      <script> tag in the article body HTML (TDx strips those).
//   3. In the article body HTML, add the mount point div:
//         <div class="classroom-search-root"></div>
//
// DEBUG:
//   Open browser DevTools → Console, filter on "[CS]" to see every step.
// =============================================================================

console.log("[CS] search-inject.js: file parsed and executing.");

window.addEventListener("load", function () {
    console.log("[CS] window load event fired.");

    // -------------------------------------------------------------------------
    // STEP 1 — Find mount point
    // -------------------------------------------------------------------------
    const mountEl = document.querySelector(".classroom-search-root");
    console.log("[CS] Mount point (.classroom-search-root):", mountEl);

    if (!mountEl) {
        console.error(
            "[CS] FATAL: Mount point not found. " +
            "Add <div class='classroom-search-root'></div> to the TDx article body."
        );
        return;
    }

    // Show a loading indicator immediately so we know the script is alive.
    mountEl.innerHTML = "<p><em>[CS] Script loaded. Fetching room database…</em></p>";

    // -------------------------------------------------------------------------
    // STEP 2 — Inject scoped CSS
    // -------------------------------------------------------------------------
    if (!document.getElementById("cs-injected-styles")) {
        const style = document.createElement("style");
        style.id = "cs-injected-styles";
        style.textContent = `
            .cs-wrap { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #333; }
            .cs-box { background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px; }
            .cs-box h2 { margin-top: 0; }
            .cs-row { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 15px; }
            .cs-field { display: flex; flex-direction: column; }
            .cs-field label { font-weight: bold; margin-bottom: 5px; font-size: 0.9em; }
            .cs-field input, .cs-field select { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
            .cs-checks { display: flex; gap: 15px; align-items: center; flex-wrap: wrap; margin-top: 10px; }
            .cs-check { display: flex; align-items: center; gap: 5px; cursor: pointer; }
            .cs-btn { background: #0056b3; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 1em; margin-top: 15px; }
            .cs-btn:hover { background: #004494; }
            .cs-status { margin-bottom: 15px; font-style: italic; color: #666; }
            .cs-card { background: white; border: 1px solid #e1e1e1; padding: 15px; margin-bottom: 10px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,.05); }
            .cs-card-title { font-size: 1.2em; font-weight: normal; margin: 0 0 8px; color: #0056b3; }
            .cs-card-title a { color: #0056b3; text-decoration: none; }
            .cs-card-title a:hover { text-decoration: underline; }
            .cs-card-meta { margin: 0 0 6px; font-size: .9em; line-height: 1.5; }
            .cs-badge { display: inline-block; background: #e9ecef; padding: 2px 8px; border-radius: 4px; margin: 3px 4px 0 0; font-size: .82em; color: #495057; }
        `;
        document.head.appendChild(style);
        console.log("[CS] Styles injected.");
    } else {
        console.log("[CS] Styles already present, skipping.");
    }

    // -------------------------------------------------------------------------
    // STEP 3 — Fetch CSV (same pattern as inject-snippet-prod.js)
    // -------------------------------------------------------------------------
    const CSV_URL = "https://raw.githubusercontent.com/trstones/Classroom-360/main/classroom-database.csv";
    console.log("[CS] Fetching CSV from:", CSV_URL);

    fetch(CSV_URL)
        .then(function (response) {
            console.log("[CS] CSV fetch response — status:", response.status, response.statusText);
            if (!response.ok) {
                throw new Error("HTTP error fetching CSV: " + response.status);
            }
            return response.text();
        })
        .then(function (csvText) {
            console.log("[CS] CSV text received, length:", csvText.length, "chars.");

            // -----------------------------------------------------------------
            // STEP 4 — Parse CSV with PapaParse (load it on demand if needed)
            // -----------------------------------------------------------------
            loadPapaParse(function () {
                console.log("[CS] PapaParse ready. Parsing CSV…");

                const parsed = window.Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                });

                console.log("[CS] Parse complete. Rows:", parsed.data.length,
                            "| Errors:", parsed.errors.length);
                if (parsed.errors.length) {
                    console.warn("[CS] Parse warnings:", parsed.errors);
                }

                const masterData = parsed.data.filter(function (row) {
                    return row["Searchable"] &&
                           row["Searchable"].toString().toLowerCase().trim() === "yes";
                });
                console.log("[CS] Searchable rooms:", masterData.length);

                // -------------------------------------------------------------
                // STEP 5 — Build UI and wire it up
                // -------------------------------------------------------------
                buildAndMount(mountEl, masterData);
                console.log("[CS] Init complete.");
            });
        })
        .catch(function (err) {
            console.error("[CS] FATAL: Failed to load or parse CSV.", err);
            mountEl.innerHTML =
                "<p><strong>Classroom Search failed to load.</strong> " +
                "Check the browser console for details (filter on [CS]).</p>";
        });
});

// =============================================================================
// loadPapaParse — dynamically load PapaParse if it isn't already on the page
// =============================================================================
function loadPapaParse(callback) {
    if (window.Papa) {
        console.log("[CS] PapaParse already loaded.");
        callback();
        return;
    }
    const CDN = "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js";
    console.log("[CS] Loading PapaParse from CDN:", CDN);
    const s = document.createElement("script");
    s.src = CDN;
    s.onload = function () {
        console.log("[CS] PapaParse loaded successfully.");
        callback();
    };
    s.onerror = function () {
        console.error("[CS] Failed to load PapaParse. Check network / CSP.");
        // Surface the failure visibly in the mount point (already set above,
        // but the catch in the outer chain will handle it via a thrown error).
    };
    document.head.appendChild(s);
}

// =============================================================================
// buildAndMount — inject the search UI and bind events
// =============================================================================
function buildAndMount(mountEl, masterData) {
    console.log("[CS] Building UI.");

    mountEl.className = (mountEl.className + " cs-wrap").trim();

    // ---- Search box ---------------------------------------------------------
    const box = document.createElement("div");
    box.className = "cs-box";

    const h2 = document.createElement("h2");
    h2.textContent = "Find a Space";
    box.appendChild(h2);

    // Dropdowns row
    const row = document.createElement("div");
    row.className = "cs-row";

    const bldgSel  = makeSelect("cs-building",  "Building",             "Any Building");
    const typeSel  = makeSelect("cs-room-type",  "Room Type",            "Any Type");
    const capField = makeNumberInput("cs-capacity", "Minimum Seats Required", "e.g. 20");
    row.appendChild(bldgSel.wrap);
    row.appendChild(typeSel.wrap);
    row.appendChild(capField.wrap);
    box.appendChild(row);

    // Populate dropdown options
    const buildings = new Set();
    const roomTypes = new Set();
    masterData.forEach(function (r) {
        const b = (r["Building"]     || "").trim();
        const t = (r["WD Room Type"] || "").trim();
        if (b) buildings.add(b);
        if (t) roomTypes.add(t);
    });
    Array.from(buildings).sort().forEach(function (b) { appendOpt(bldgSel.el, b, b); });
    Array.from(roomTypes).sort().forEach(function (t) { appendOpt(typeSel.el, t, t); });
    console.log("[CS] Dropdowns populated —", buildings.size, "buildings,", roomTypes.size, "types.");

    // Checkboxes
    const cbDefs = [
        { id: "cs-zoom",          label: "Zoom"          },
        { id: "cs-lab",           label: "Computer Lab"  },
        { id: "cs-dvd",           label: "DVD Player"    },
        { id: "cs-stream",        label: "Record/Stream" },
        { id: "cs-venue",         label: "Venue"         },
    ];
    const cbGroup = document.createElement("div");
    cbGroup.className = "cs-checks";
    cbDefs.forEach(function (def) {
        const wrap  = document.createElement("div");
        wrap.className = "cs-check";
        const cb  = document.createElement("input");
        cb.type   = "checkbox";
        cb.id     = def.id;
        const lbl = document.createElement("label");
        lbl.htmlFor     = def.id;
        lbl.textContent = def.label;
        wrap.appendChild(cb);
        wrap.appendChild(lbl);
        cbGroup.appendChild(wrap);
    });
    box.appendChild(cbGroup);

    // Search button
    const btn = document.createElement("button");
    btn.className   = "cs-btn";
    btn.textContent = "Search";
    btn.type = "button";
    box.appendChild(btn);

    mountEl.innerHTML = ""; // clear loading message
    mountEl.appendChild(box);

    // ---- Status + results container ----------------------------------------
    const statusEl    = document.createElement("div");
    statusEl.className = "cs-status";
    mountEl.appendChild(statusEl);

    const resultsEl = document.createElement("div");
    mountEl.appendChild(resultsEl);

    // ---- Show all rooms on first load --------------------------------------
    renderResults(masterData, statusEl, resultsEl);

    // ---- Search button handler ---------------------------------------------
    btn.addEventListener("click", function () {
        console.log("[CS] Search clicked.");

        const prefBuilding  = bldgSel.el.value;
        const prefType      = typeSel.el.value;
        const minCap        = parseInt(capField.el.value, 10) || 0;
        const wantZoom      = document.getElementById("cs-zoom").checked;
        const wantLab       = document.getElementById("cs-lab").checked;
        const wantDvd       = document.getElementById("cs-dvd").checked;
        const wantStream    = document.getElementById("cs-stream").checked;
        const wantVenue     = document.getElementById("cs-venue").checked;

        console.log("[CS] Filters →", {
            prefBuilding, prefType, minCap,
            wantZoom, wantLab, wantDvd, wantStream, wantVenue
        });

        const filtered = masterData.filter(function (r) {
            if (prefBuilding !== "Any" && r["Building"]     !== prefBuilding) return false;
            if (prefType     !== "Any" && r["WD Room Type"] !== prefType)     return false;

            const cap = parseInt(r["Seating Capacity"], 10) || 0;
            if (cap < minCap) return false;

            if (wantZoom   && !isYes(r["Video Conferencing (Zoom Room)"])) return false;
            if (wantLab    && !isLab(r["Number of Lab Computers"]))        return false;
            if (wantDvd    && !isYes(r["Optical Drive (DVD/Blu-Ray)"]))    return false;
            if (wantStream && !isYes(r["Record / Stream"]))                return false;
            if (wantVenue  && !isYes(r["Is Venue"]))                       return false;

            return true;
        });

        console.log("[CS] Matched:", filtered.length, "room(s).");
        renderResults(filtered, statusEl, resultsEl);
    });
}

// =============================================================================
// renderResults
// =============================================================================
function renderResults(data, statusEl, resultsEl) {
    resultsEl.innerHTML = "";
    statusEl.textContent = "Found " + data.length + " space(s).";

    data.forEach(function (room) {
        const card = document.createElement("div");
        card.className = "cs-card";

        // Title / link
        const titleEl = document.createElement("div");
        titleEl.className = "cs-card-title";
        const name = ((room["Building"] || "Unknown") + " " + (room["Room Number"] || "")).trim();
        const url  = (room["TDx URL"] || "").trim();
        if (url) {
            const a   = document.createElement("a");
            a.href    = url;
            a.target  = "_blank";
            a.rel     = "noopener noreferrer";
            a.textContent = name;
            titleEl.appendChild(a);
        } else {
            titleEl.textContent = name;
        }
        card.appendChild(titleEl);

        // Type + capacity
        const meta = document.createElement("p");
        meta.className   = "cs-card-meta";
        meta.textContent = "Type: " + (room["WD Room Type"] || "N/A") +
                           " | Seats: " + (room["Seating Capacity"] || "N/A");
        card.appendChild(meta);

        // Feature badges
        const badges = document.createElement("div");
        if (isYes(room["Video Conferencing (Zoom Room)"]))   addBadge(badges, "Zoom");
        if (isLab(room["Number of Lab Computers"]))          addBadge(badges, "Computer Lab (" + room["Number of Lab Computers"].trim() + " stations)");
        if (isYes(room["Optical Drive (DVD/Blu-Ray)"]))      addBadge(badges, "DVD Player");
        if (isYes(room["Record / Stream"]))                  addBadge(badges, "Record/Stream");
        if (isYes(room["Is Venue"]))                         addBadge(badges, "Venue");
        if (badges.hasChildNodes()) card.appendChild(badges);

        resultsEl.appendChild(card);
    });
}

// =============================================================================
// Small helpers
// =============================================================================
function isYes(val) {
    return val && val.toString().toLowerCase().trim() === "yes";
}
function isLab(val) {
    return val && val.toString().trim() !== "" && parseInt(val, 10) > 0;
}
function addBadge(container, text) {
    const span = document.createElement("span");
    span.className   = "cs-badge";
    span.textContent = text;
    container.appendChild(span);
}
function appendOpt(select, value, text) {
    const o = document.createElement("option");
    o.value = value;
    o.textContent = text;
    select.appendChild(o);
}
function makeSelect(id, labelText, defaultText) {
    const wrap = document.createElement("div");
    wrap.className = "cs-field";
    const lbl = document.createElement("label");
    lbl.htmlFor     = id;
    lbl.textContent = labelText;
    const sel = document.createElement("select");
    sel.id = id;
    appendOpt(sel, "Any", defaultText);
    wrap.appendChild(lbl);
    wrap.appendChild(sel);
    return { wrap: wrap, el: sel };
}
function makeNumberInput(id, labelText, placeholder) {
    const wrap = document.createElement("div");
    wrap.className = "cs-field";
    const lbl = document.createElement("label");
    lbl.htmlFor     = id;
    lbl.textContent = labelText;
    const inp = document.createElement("input");
    inp.type        = "number";
    inp.id          = id;
    inp.min         = "1";
    inp.placeholder = placeholder;
    wrap.appendChild(lbl);
    wrap.appendChild(inp);
    return { wrap: wrap, el: inp };
}