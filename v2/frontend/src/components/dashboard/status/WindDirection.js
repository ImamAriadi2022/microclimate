import React from "react";
import GaugeChart from "react-gauge-chart";

const WindDirectionGauge = ({ windDirection }) => {
  // Function to determine category based on wind direction
  const getCategory = (direction) => {
    if (direction === 0) return "North (N)";
    if (direction > 0 && direction <= 45) return "Northeast (NE)";
    if (direction > 45 && direction <= 90) return "East (E)";
    if (direction > 90 && direction <= 135) return "Southeast (SE)";
    if (direction > 135 && direction <= 180) return "South (S)";
    if (direction > 180 && direction <= 225) return "Southwest (SW)";
    if (direction > 225 && direction <= 270) return "West (W)";
    if (direction > 270 && direction <= 315) return "Northwest (NW)";
    return "North (N)"; // If more than 315°, back to North
  };

  // Function to determine color based on wind direction
  const getColor = (direction) => {
    const hue = (direction / 360) * 120; // 0° (Green) to 360° (Green) via 180° (Red)
    return `hsl(${hue}, 100%, 50%)`;
  };

  // Calculate percent value for GaugeChart
  const percentValue = typeof windDirection === "number" ? windDirection / 360 : 0;

  return (
    <div style={{ width: "200px", margin: "0 auto" }}>
      <GaugeChart
        id="wind-direction-gauge"
        nrOfLevels={360}
        arcsLength={[percentValue, 1 - percentValue]}
        colors={[getColor(windDirection), "#e6e6e6"]} // Color based on wind direction
        percent={percentValue}
        arcPadding={0.01}
        cornerRadius={3}
        needleColor="#464A4F"
        needleBaseColor="#464A4F"
        textColor="#000000"
        formatTextValue={() =>
          typeof windDirection === "number" ? `${windDirection.toFixed(1)}°` : "N/A"
        }
      />
      <p style={{ textAlign: "center", marginTop: "-10px", fontWeight: "bold" }}>
        {typeof windDirection === "number" ? getCategory(windDirection) : "Invalid Data"}
      </p>
    </div>
  );
};

export default WindDirectionGauge;