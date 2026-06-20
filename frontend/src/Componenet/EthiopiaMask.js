// EthiopiaMask.js
//
// Clips NASA WMS overlay tiles to Ethiopia's borders using an SVG <clipPath>.
//
// ── How it works ──────────────────────────────────────────────────────────────
// Leaflet renders tile layers into named CSS panes (divs). Each pane that holds
// overlay tiles (e.g. "nasaOverlayPane") can have a CSS `clip-path: url(#id)`
// applied to it. The SVG <clipPath> is injected into the map's own SVG element
// and its path data is recomputed from Ethiopia's GeoJSON on every map move/zoom.
//
// Result:
//   • Base OSM tiles are completely untouched — world map looks normal.
//   • NASA hazard overlay tiles are clipped to Ethiopia's polygon shape.
//   • No dark fills, no opacity masks, no polygon colors anywhere.
//   • User can zoom and pan freely — clip path updates in real time.
//
// Usage:
//   1. Create a custom Leaflet pane for the overlay BEFORE adding WMS layers:
//        map.createPane('nasaOverlayPane').style.zIndex = 450;
//   2. Pass that pane name to WMSTileLayer: pane="nasaOverlayPane"
//   3. Mount <EthiopiaMask paneNames={['nasaOverlayPane']} /> inside MapContainer.
//
// The component accepts a `paneNames` prop — an array of pane names whose
// CSS clip-path should be set. This lets one mask clip multiple overlay panes.

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

// ── Module-level GeoJSON cache ─────────────────────────────────────────────
// One fetch per browser session regardless of how many map instances mount.
let _cachedFeature = null;
let _fetchPromise = null;

const PRIMARY_URL =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";
const FALLBACK_URL =
  "https://raw.githubusercontent.com/wmgeolab/geoBoundaries/main/releaseData/CGAZ/ADM0/geoBoundaries-ETH-ADM0_simplified.geojson";

function fetchEthiopiaFeature() {
  if (_cachedFeature) return Promise.resolve(_cachedFeature);
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = fetch(PRIMARY_URL)
    .then((r) => {
      if (!r.ok) throw new Error("primary failed");
      return r.json();
    })
    .then((world) => {
      const f = world.features.find(
        (f) =>
          f.properties.ISO_A3 === "ETH" ||
          f.properties.ADMIN === "Ethiopia" ||
          (f.properties.name || "").toLowerCase() === "ethiopia",
      );
      if (!f) throw new Error("ETH not found");
      _cachedFeature = f;
      return f;
    })
    .catch(() =>
      fetch(FALLBACK_URL)
        .then((r) => r.json())
        .then((data) => {
          const f = data.type === "FeatureCollection" ? data.features[0] : data;
          _cachedFeature = f;
          return f;
        }),
    );

  return _fetchPromise;
}

// ── Convert GeoJSON geometry → SVG path string ────────────────────────────
// Projects each [lng, lat] coordinate through Leaflet's latLngToLayerPoint
// so the path stays accurate at every zoom level and map position.
function geomToSvgPath(geometry, map) {
  const ringToPath = (ring) =>
    ring
      .map(([lng, lat], i) => {
        const pt = map.latLngToLayerPoint([lat, lng]);
        return `${i === 0 ? "M" : "L"}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(" ") + " Z";

  if (geometry.type === "Polygon") {
    return geometry.coordinates.map(ringToPath).join(" ");
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .flatMap((poly) => poly.map(ringToPath))
      .join(" ");
  }
  return "";
}

// ── Component ─────────────────────────────────────────────────────────────
function EthiopiaMask({ paneNames = [] }) {
  const map = useMap();
  const featureRef = useRef(null); // cached Ethiopia GeoJSON feature
  const clipIdRef = useRef(
    // unique clip-path id per instance
    "eth-clip-" + Math.random().toString(36).slice(2, 8),
  );
  const svgRef = useRef(null); // the <svg> element we inject
  const pathRef = useRef(null); // the <path> inside <clipPath>

  // ── Inject SVG <clipPath> into the map container ────────────────────────
  // Leaflet already has an SVG overlay element; we create our own lightweight
  // SVG that sits at 0,0 with pointer-events:none so it never blocks clicks.
  function ensureSvg() {
    if (svgRef.current) return;

    const mapSize = map.getSize();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.style.cssText =
      "position:absolute;top:0;left:0;width:100%;height:100%;" +
      "pointer-events:none;overflow:visible;z-index:0;";
    svg.setAttribute("width", mapSize.x);
    svg.setAttribute("height", mapSize.y);

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const clipEl = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "clipPath",
    );
    clipEl.setAttribute("id", clipIdRef.current);
    // clipPathUnits="userSpaceOnUse" means coordinates are in pixel space —
    // exactly what latLngToLayerPoint gives us.
    clipEl.setAttribute("clipPathUnits", "userSpaceOnUse");

    const pathEl = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    clipEl.appendChild(pathEl);
    defs.appendChild(clipEl);
    svg.appendChild(defs);

    // Append to the map's container div (not a pane — just the root div)
    map.getContainer().appendChild(svg);

    svgRef.current = svg;
    pathRef.current = pathEl;
  }

  // ── Recompute the SVG path and apply clip-path to panes ─────────────────
  function updateClip() {
    if (!featureRef.current || !pathRef.current) return;

    // Reproject Ethiopia coordinates to current pixel space
    const d = geomToSvgPath(featureRef.current.geometry, map);
    pathRef.current.setAttribute("d", d);

    // Apply clip-path CSS to every named overlay pane
    const clipVal = `url(#${clipIdRef.current})`;
    paneNames.forEach((name) => {
      const paneEl = map.getPane(name);
      if (paneEl) paneEl.style.clipPath = clipVal;
    });
  }

  // ── Main effect: fetch GeoJSON, set up SVG, bind map events ─────────────
  useEffect(() => {
    let cancelled = false;

    fetchEthiopiaFeature()
      .then((feature) => {
        if (cancelled) return;
        featureRef.current = feature;

        ensureSvg();
        updateClip();

        // Re-project on every move and zoom — keeps clip aligned with tiles
        map.on("move zoom viewreset", updateClip);
      })
      .catch((err) => console.error("EthiopiaMask: GeoJSON load failed", err));

    return () => {
      cancelled = true;
      map.off("move zoom viewreset", updateClip);

      // Remove clip-path from panes on unmount
      paneNames.forEach((name) => {
        const paneEl = map.getPane(name);
        if (paneEl) paneEl.style.clipPath = "";
      });

      // Remove injected SVG
      if (svgRef.current) {
        svgRef.current.remove();
        svgRef.current = null;
        pathRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}

export default EthiopiaMask;
