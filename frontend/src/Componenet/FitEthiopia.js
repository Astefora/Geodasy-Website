// FitEthiopia.js
//
// Drop this inside any <MapContainer> to make the map always fit Ethiopia's
// full extent, responsive to the actual container size.
//
// On desktop zoom={5} usually works. On narrow mobile screens it clips the
// north or south. This component calls map.fitBounds() on mount and on every
// window resize so the map self-adjusts to the container dimensions.
//
// Usage:
//   <MapContainer center={...} zoom={5} ...>
//     <FitEthiopia />
//     ...
//   </MapContainer>

import { useEffect } from "react";
import { useMap } from "react-leaflet";

// Ethiopia bounding box — slight padding so labels aren't cut off
const ETH_BOUNDS = [
  [3.0, 32.5], // SW corner
  [15.2, 48.4], // NE corner
];

// fitBounds options — tight padding so Ethiopia fills the frame.
// No maxZoom cap so when the container gets taller (e.g. sibling card has
// an uploaded image making the row taller), the map zooms out to fill the
// extra height with surrounding geographic context instead of blank space.
const FIT_OPTIONS = { padding: [6, 6], animate: false };

function FitEthiopia() {
  const map = useMap();

  useEffect(() => {
    let isMounted = true;

    const fit = () => {
      if (!isMounted || !map) return;
      try {
        const container = map.getContainer ? map.getContainer() : null;
        if (!container || !container.parentElement || container.clientWidth === 0 || container.clientHeight === 0) return;
        if (!map._loaded || !map.getPanes || !map.getPanes()?.mapPane) return;
        map.invalidateSize({ animate: false });
        map.fitBounds(ETH_BOUNDS, FIT_OPTIONS);
      } catch (err) {
        // Safe failover
      }
    };

    // Small delay lets the container finish rendering (avoids 0-size flash)
    const t = setTimeout(fit, 60);

    // Re-fit on window resize
    window.addEventListener("resize", fit);

    let ro;
    try {
      const container = map.getContainer ? map.getContainer() : null;
      if (container && typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(() => {
          if (!isMounted) return;
          clearTimeout(ro._t);
          ro._t = setTimeout(fit, 40);
        });
        ro.observe(container);
      }
    } catch (err) {}

    return () => {
      isMounted = false;
      clearTimeout(t);
      window.removeEventListener("resize", fit);
      if (ro) {
        clearTimeout(ro._t);
        ro.disconnect();
      }
    };
  }, [map]);

  return null;
}

export default FitEthiopia;
