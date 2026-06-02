/**
 * search-inject.js
 * Classroom Search — injectable script for TeamDynamix KB pages.
 *
 * HOW IT WORKS
 * ------------
 * TDx renders the KB article body into the DOM before this script runs.
 * This script:
 *   1. Finds a mount point element (see MOUNT_SELECTOR below).
 *   2. Dynamically loads PapaParse if it isn't already present.
 *   3. Injects scoped CSS into <head>.
 *   4. Builds the search UI inside the mount point.
 *   5. Fetches + parses the CSV, populates dropdowns, and wires up the
 *      Search button.
 *
 * MOUNT POINT
 * -----------
 * Add a <div class="classroom-search-root"></div> to the TDx KB article
 * body (edit the article in HTML/source mode).  If that element is absent
 * the script falls back to document.body so something always renders.
 *
 * DEBUG LOGGING
 * -------------
 * Every major step emits a console.log prefixed with [ClassroomSearch].
 * Errors are console.error. Open DevTools → Console and filter on that
 * prefix to trace any breakage.
 */

(function () {
    "use strict";

    /* ------------------------------------------------------------------ */
    /* CONFIGURATION                                                         */
    /* ------------------------------------------------------------------ */

    const CSV_URL =
        "https://raw.githubusercontent.com/trstones/Classroom-360/main/classroom-database.csv";

    const PAPAPARSE_CDN =
        "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js";

    /** CSS class on the element TDx should inject the widget into.        */
    const MOUNT_SELECTOR = ".classroom-search-root";

    /** Column name mapping — matches search.html exactly.                 */
    const COLUMNS = {
        building:     "Building",
        roomNumber:   "Room Number",
        roomType:     "WD Room Type",
        capacity:     "Seating Capacity",
        zoom:         "Video Conferencing (Zoom Room)",
        computerLab:  "Number of Lab Computers",
        dvd:          "Optical Drive (DVD/Blu-Ray)",
        recordStream: "Record / Stream",
        venue:        "Is Venue",
        searchable:   "Searchable",
        tdxUrl:       "TDx URL",
    };

    /* ------------------------------------------------------------------ */
    /* HELPERS                                                              */
    /* ------------------------------------------------------------------ */

    const log   = (...a) => console.log(  "[ClassroomSearch]", ...a);
    const warn  = (...a) => console.warn( "[ClassroomSearch]", ...a);
    const error = (...a) => console.error("[ClassroomSearch]", ...a);

    const isYes = (val) =>
        val && val.toString().toLowerCase().trim() === "yes";

    const isLab = (val) =>
        val && val.toString().trim() !== "" && parseInt(val, 10) > 0;

    /* ------------------------------------------------------------------ */
    /* CSS — injected once into <head>                                      */
    /* ------------------------------------------------------------------ */

    function injectStyles() {
        if (document.getElementById("cs-styles")) {
            log("Styles already injected, skipping.");
            return;
        }
        log("Injecting styles into <head>.");
        const style = document.createElement("style");
        style.id = "cs-styles";
        style.textContent = `
            /* ---- Classroom Search widget ---- */
            .cs-root { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #333; }
            .cs-search-box { background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px; }
            .cs-search-box h2 { margin-top: 0; }
            .cs-filter-group { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 15px; }
            .cs-filter-item { display: flex; flex-direction: column; }
            .cs-filter-item label { font-weight: bold; margin-bottom: 5px; font-size: 0.9em; }
            .cs-filter-item input,
            .cs-filter-item select { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
            .cs-checkbox-group { display: flex; gap: 15px; align-items: center; flex-wrap: wrap; margin-top: 10px; }
            .cs-checkbox-item { display: flex; align-items: center; gap: 5px; cursor: pointer; }
            .cs-search-btn { background-color: #0056b3; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 1em; margin-top: 15px; }
            .cs-search-btn:hover { background-color: #004494; }
            .cs-status { margin-bottom: 15px; font-style: italic; color: #666; }
            .cs-room-card { background: white; border: 1px solid #e1e1e1; padding: 15px; margin-bottom: 10px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            .cs-room-title { font-size: 1.2em; font-weight: bold; margin: 0 0 8px 0; color: #0056b3; }
            .cs-room-title a { color: #0056b3; text-decoration: none; }
            .cs-room-title a:hover { text-decoration: underline; }
            .cs-room-details { margin: 0 0 6px 0; font-size: 0.9em; line-height: 1.5; }
            .cs-badge { display: inline-block; background: #e9ecef; padding: 2px 8px; border-radius: 4px; margin: 3px 4px 0 0; font-size: 0.82em; color: #495057; }
        `;
        document.head.appendChild(style);
        log("Styles injected.");
    }

    /* ------------------------------------------------------------------ */
    /* DOM BUILDER — returns the root element                               */
    /* ------------------------------------------------------------------ */

    function buildUI(mountEl) {
        log("Building search UI.");
        mountEl.classList.add("cs-root");

        /* ---- Search box ---- */
        const box = document.createElement("div");
        box.className = "cs-search-box";

        const heading = document.createElement("h2");
        heading.textContent = "Find a Space";
        box.appendChild(heading);

        /* Dropdowns row */
        const filterGroup = document.createElement("div");
        filterGroup.className = "cs-filter-group";

        /* Building dropdown */
        const bldgItem = makeFilterItem("Building", "cs-building");
        const bldgSelect = document.createElement("select");
        bldgSelect.id = "cs-building";
        appendOption(bldgSelect, "Any", "Any Building");
        bldgItem.appendChild(bldgSelect);
        filterGroup.appendChild(bldgItem);

        /* Room Type dropdown */
        const typeItem = makeFilterItem("Room Type", "cs-room-type");
        const typeSelect = document.createElement("select");
        typeSelect.id = "cs-room-type";
        appendOption(typeSelect, "Any", "Any Type");
        typeItem.appendChild(typeSelect);
        filterGroup.appendChild(typeItem);

        /* Capacity input */
        const capItem = makeFilterItem("Minimum Seats Required", "cs-capacity");
        const capInput = document.createElement("input");
        capInput.type = "number";
        capInput.id = "cs-capacity";
        capInput.min = "1";
        capInput.placeholder = "e.g. 20";
        capItem.appendChild(capInput);
        filterGroup.appendChild(capItem);

        box.appendChild(filterGroup);

        /* Checkboxes */
        const checkboxDefs = [
            { id: "cs-zoom",          label: "Zoom"           },
            { id: "cs-computer-lab",  label: "Computer Lab"   },
            { id: "cs-dvd",           label: "DVD Player"     },
            { id: "cs-record-stream", label: "Record/Stream"  },
            { id: "cs-venue",         label: "Venue"          },
        ];

        const cbGroup = document.createElement("div");
        cbGroup.className = "cs-checkbox-group";

        checkboxDefs.forEach(({ id, label }) => {
            const item = document.createElement("div");
            item.className = "cs-checkbox-item";
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.id = id;
            const lbl = document.createElement("label");
            lbl.htmlFor = id;
            lbl.textContent = label;
            item.appendChild(cb);
            item.appendChild(lbl);
            cbGroup.appendChild(item);
        });

        box.appendChild(cbGroup);

        /* Search button */
        const btn = document.createElement("button");
        btn.className = "cs-search-btn";
        btn.textContent = "Search";
        box.appendChild(btn);

        mountEl.appendChild(box);

        /* ---- Status + results ---- */
        const status = document.createElement("div");
        status.className = "cs-status";
        status.textContent = "Loading database…";
        mountEl.appendChild(status);

        const resultsContainer = document.createElement("div");
        resultsContainer.id = "cs-results";
        mountEl.appendChild(resultsContainer);

        log("UI built.");
        return { bldgSelect, typeSelect, capInput, btn, status, resultsContainer };
    }

    function makeFilterItem(labelText, forId) {
        const item = document.createElement("div");
        item.className = "cs-filter-item";
        const lbl = document.createElement("label");
        lbl.htmlFor = forId;
        lbl.textContent = labelText;
        item.appendChild(lbl);
        return item;
    }

    function appendOption(select, value, text) {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = text;
        select.appendChild(opt);
    }

    /* ------------------------------------------------------------------ */
    /* FILTER + DISPLAY                                                     */
    /* ------------------------------------------------------------------ */

    function initDropdowns(masterData, bldgSelect, typeSelect) {
        log("Populating dropdowns from", masterData.length, "searchable rooms.");
        const buildings = new Set();
        const roomTypes = new Set();

        masterData.forEach((row) => {
            const b = row[COLUMNS.building]?.trim();
            const t = row[COLUMNS.roomType]?.trim();
            if (b) buildings.add(b);
            if (t) roomTypes.add(t);
        });

        Array.from(buildings).sort().forEach((b) => appendOption(bldgSelect, b, b));
        Array.from(roomTypes).sort().forEach((t) => appendOption(typeSelect, t, t));
        log("Dropdowns populated —", buildings.size, "buildings,", roomTypes.size, "room types.");
    }

    function runSearch(masterData, els) {
        const prefBuilding  = els.bldgSelect.value;
        const prefRoomType  = els.typeSelect.value;
        const reqCapacity   = parseInt(els.capInput.value, 10) || 0;
        const reqZoom        = document.getElementById("cs-zoom").checked;
        const reqComputerLab = document.getElementById("cs-computer-lab").checked;
        const reqDvd         = document.getElementById("cs-dvd").checked;
        const reqRecordStream= document.getElementById("cs-record-stream").checked;
        const reqVenue       = document.getElementById("cs-venue").checked;

        log("Search params →",
            { prefBuilding, prefRoomType, reqCapacity, reqZoom, reqComputerLab, reqDvd, reqRecordStream, reqVenue });

        const filtered = masterData.filter((room) => {
            if (prefBuilding !== "Any" && room[COLUMNS.building] !== prefBuilding) return false;
            if (prefRoomType !== "Any" && room[COLUMNS.roomType]  !== prefRoomType)  return false;
            const cap = parseInt(room[COLUMNS.capacity], 10) || 0;
            if (cap < reqCapacity) return false;
            if (reqZoom         && !isYes(room[COLUMNS.zoom]))        return false;
            if (reqComputerLab  && !isLab(room[COLUMNS.computerLab])) return false;
            if (reqDvd          && !isYes(room[COLUMNS.dvd]))         return false;
            if (reqRecordStream && !isYes(room[COLUMNS.recordStream]))return false;
            if (reqVenue        && !isYes(room[COLUMNS.venue]))       return false;
            return true;
        });

        log("Results:", filtered.length, "room(s) matched.");
        displayResults(filtered, els.status, els.resultsContainer);
    }

    function displayResults(data, statusEl, containerEl) {
        containerEl.innerHTML = "";
        statusEl.textContent = `Found ${data.length} space(s).`;

        data.forEach((room) => {
            const card = document.createElement("div");
            card.className = "cs-room-card";

            /* Title / link */
            const title = document.createElement("div");
            title.className = "cs-room-title";
            const titleText =
                `${room[COLUMNS.building] || "Unknown Building"} ${room[COLUMNS.roomNumber] || "Unknown Room"}`.trim();
            const url = room[COLUMNS.tdxUrl]?.trim() || "";

            if (url) {
                const a = document.createElement("a");
                a.href = url;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                a.textContent = titleText;
                title.appendChild(a);
            } else {
                title.textContent = titleText;
            }
            card.appendChild(title);

            /* Basic details */
            const details = document.createElement("p");
            details.className = "cs-room-details";
            details.textContent =
                `Type: ${room[COLUMNS.roomType] || "N/A"} | Seats: ${room[COLUMNS.capacity] || "N/A"}`;
            card.appendChild(details);

            /* Feature badges */
            const badges = document.createElement("div");
            if (isYes(room[COLUMNS.zoom]))       addBadge(badges, "Zoom");
            if (isLab(room[COLUMNS.computerLab])) addBadge(badges, `Computer Lab (${room[COLUMNS.computerLab].trim()} stations)`);
            if (isYes(room[COLUMNS.dvd]))        addBadge(badges, "DVD Player");
            if (isYes(room[COLUMNS.recordStream]))addBadge(badges, "Record/Stream");
            if (isYes(room[COLUMNS.venue]))      addBadge(badges, "Venue");
            if (badges.hasChildNodes()) card.appendChild(badges);

            containerEl.appendChild(card);
        });
    }

    function addBadge(container, text) {
        const span = document.createElement("span");
        span.className = "cs-badge";
        span.textContent = text;
        container.appendChild(span);
    }

    /* ------------------------------------------------------------------ */
    /* PAPAPARSE LOADER                                                     */
    /* ------------------------------------------------------------------ */

    function loadPapaParse(callback) {
        if (window.Papa) {
            log("PapaParse already loaded.");
            callback();
            return;
        }
        log("Loading PapaParse from CDN:", PAPAPARSE_CDN);
        const s = document.createElement("script");
        s.src = PAPAPARSE_CDN;
        s.onload = () => {
            log("PapaParse loaded successfully.");
            callback();
        };
        s.onerror = () => {
            error("Failed to load PapaParse from CDN. Check network / CSP settings.");
        };
        document.head.appendChild(s);
    }

    /* ------------------------------------------------------------------ */
    /* CSV FETCH                                                            */
    /* ------------------------------------------------------------------ */

    function fetchData(statusEl, callback) {
        log("Fetching CSV from:", CSV_URL);
        window.Papa.parse(CSV_URL, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                log("CSV parsed. Total rows (raw):", results.data.length);

                if (results.errors && results.errors.length) {
                    warn("CSV parse warnings:", results.errors);
                }

                const masterData = results.data.filter((room) =>
                    isYes(room[COLUMNS.searchable])
                );
                log("Searchable rooms:", masterData.length);
                callback(masterData);
            },
            error: function (err) {
                error("CSV fetch/parse error:", err);
                statusEl.textContent =
                    "Error loading room database. Please try again later.";
            },
        });
    }

    /* ------------------------------------------------------------------ */
    /* INIT                                                                 */
    /* ------------------------------------------------------------------ */

    function init() {
        log("init() called.");

        /* 1 — Find or create mount point */
        let mountEl = document.querySelector(MOUNT_SELECTOR);
        if (mountEl) {
            log("Mount point found:", mountEl);
        } else {
            warn(
                "Mount point '" + MOUNT_SELECTOR + "' not found in DOM. " +
                "Add <div class='classroom-search-root'></div> to your TDx article. " +
                "Falling back to document.body."
            );
            mountEl = document.body;
        }

        /* 2 — Inject CSS */
        injectStyles();

        /* 3 — Build UI (returns references to interactive elements) */
        const els = buildUI(mountEl);

        /* 4 — Load PapaParse, then fetch CSV */
        loadPapaParse(function () {
            fetchData(els.status, function (masterData) {
                /* 5 — Populate dropdowns */
                initDropdowns(masterData, els.bldgSelect, els.typeSelect);

                /* 6 — Show initial full list */
                displayResults(masterData, els.status, els.resultsContainer);

                /* 7 — Wire up Search button */
                els.btn.addEventListener("click", function () {
                    log("Search button clicked.");
                    runSearch(masterData, els);
                });

                log("Initialisation complete.");
            });
        });
    }

    /* ------------------------------------------------------------------ */
    /* ENTRY POINT                                                          */
    /* ------------------------------------------------------------------ */

    /* Run after the page has fully loaded so TDx has rendered its DOM.    */
    if (document.readyState === "loading") {
        log("Document still loading — attaching DOMContentLoaded listener.");
        document.addEventListener("DOMContentLoaded", init);
    } else {
        log("Document already ready — running init() immediately.");
        init();
    }

})();