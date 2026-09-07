/**
 * TopographicBackground.jsx
 *
 * Procedurally generated topographic contour background.
 * - simplex-noise → elevation field
 * - d3-contour    → isolines (GeoJSON MultiPolygon)
 * - Custom SVG path builder (no d3-geo dependency)
 * - position:fixed, z-index:0, pointer-events:none
 */

import { useMemo, useEffect, useState } from "react";
import { contours } from "d3-contour";
import { createNoise2D } from "simplex-noise";

// ── Deterministic PRNG so the terrain looks the same every render ───────────
function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

// ── Build elevation field using multi-octave simplex noise ──────────────────
function buildElevationField(cols, rows) {
  const noise1 = createNoise2D(seededRng(42));
  const noise2 = createNoise2D(seededRng(137));
  const noise3 = createNoise2D(seededRng(251));

  const values = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const nx = c / cols;
      const ny = r / rows;
      const v =
        noise1(nx * 2.2, ny * 2.2) * 0.55 +
        noise2(nx * 4.8, ny * 4.8) * 0.28 +
        noise3(nx * 10, ny * 10) * 0.12;
      // normalise to [0, 1]
      values[r * cols + c] = (v + 1) / 2;
    }
  }
  return values;
}

// ── Convert a GeoJSON ring (array of [x,y] grid-coords) to an SVG path ──────
function ringToPath(ring, sx, sy) {
  if (!ring || ring.length < 2) return "";
  const parts = ring.map(([x, y], i) => {
    const px = (x * sx).toFixed(2);
    const py = (y * sy).toFixed(2);
    return i === 0 ? `M${px},${py}` : `L${px},${py}`;
  });
  return parts.join(" ") + " Z";
}

// ── Convert a d3-contour MultiPolygon feature to one SVG path string ────────
function featureToPath(feature, sx, sy) {
  if (!feature || !feature.coordinates) return "";
  // MultiPolygon: coordinates = array of polygons, each polygon = array of rings
  return feature.coordinates
    .flatMap((polygon) => polygon.map((ring) => ringToPath(ring, sx, sy)))
    .join(" ");
}

// ── Component ────────────────────────────────────────────────────────────────
export default function TopographicBackground({ isDark = false }) {
  const [vw, setVw] = useState(window.innerWidth);
  const [vh, setVh] = useState(window.innerHeight);

  useEffect(() => {
    let timer;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setVw(window.innerWidth);
        setVh(window.innerHeight);
      }, 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
    };
  }, []);

  const svgPaths = useMemo(() => {
    // Grid: ~1 cell per 8px – coarse enough for performance
    const cols = Math.ceil(vw / 8);
    const rows = Math.ceil(vh / 8);
    const scaleX = vw / cols;
    const scaleY = vh / rows;

    const values = buildElevationField(cols, rows);

    // 20 contour levels
    const thresholds = Array.from({ length: 20 }, (_, i) => (i + 1) / 21);

    const gen = contours()
      .size([cols, rows])
      .thresholds(thresholds)
      .smooth(true);
    const features = gen(values);

    return features.map((f, i) => ({
      d: featureToPath(f, scaleX, scaleY),
      opacity: 0.045 + (i / features.length) * 0.045,
      key: i,
    }));
  }, [vw, vh]);

  const stroke = isDark ? "rgb(148,163,184)" : "rgb(71,85,105)";

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
        viewBox={`0 0 ${vw} ${vh}`}
        preserveAspectRatio="xMidYMid slice"
      >
        {svgPaths.map(({ d, opacity, key }) =>
          d ? (
            <path
              key={key}
              d={d}
              fill="none"
              stroke={stroke}
              strokeWidth="0.65"
              strokeOpacity={opacity}
              vectorEffect="non-scaling-stroke"
            />
          ) : null,
        )}
      </svg>
    </div>
  );
}
