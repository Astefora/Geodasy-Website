import React from "react";
import { Link } from "react-router-dom";
import { useColors } from "../useColors";

const hazards = [
  { name: "Landslide", path: "/hazards/landslide" },
  { name: "Flood", path: "/hazards/flood" },
  { name: "Drought", path: "/hazards/drought" },
  { name: "Volcano", path: "/hazards/volcano" },
  { name: "Fire", path: "/hazards/fire" },
  { name: "Earthquake", path: "/hazards/earthquake" },
];

function Hazards() {
  return (
    <div style={{ paddingTop: "80px", maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: "30px" }}></h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {hazards.map((hazard) => (
          <Link
            key={hazard.name}
            to={hazard.path}
            style={{
              padding: "20px",
              backgroundColor: "#004080",
              color: "#fff",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "bold",
              textAlign: "center",
              fontSize: "18px",
            }}
          >
            {hazard.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Hazards;
