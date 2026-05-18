import React from "react";
import GaugeChart from "react-gauge-chart";

const RainfallGauge = ({ rainfall }) => {
  // Function to determine category based on rainfall
  const getCategory = (rain) => {
    if (rain <= 20) return "Light";
    if (rain <= 50) return "Moderate";
    if (rain <= 100) return "Heavy";
    if (rain <= 150) return "Very Heavy";
    return "Extreme";
  };

  // Function to determine color based on category
  const getColor = (rain) => {
    if (rain <= 20) return ["#00FF00", "#e6e6e6"]; // Green
    if (rain <= 50) return ["#ADFF2F", "#e6e6e6"]; // Light Green
    if (rain <= 100) return ["#FFD700", "#e6e6e6"]; // Yellow
    if (rain <= 150) return ["#FFA500", "#e6e6e6"]; // Orange
    return ["#FF4500", "#e6e6e6"]; // Red (Extreme)
  };

  // Calculate percent value for GaugeChart
  const percentValue = rainfall / 150; // Assume max value is 150 mm

  return (
    <div style={{ width: "200px", margin: "0 auto" }}>
      <GaugeChart
        id="rainfall-gauge"
        nrOfLevels={100}
        arcsLength={[percentValue, 1 - percentValue]}
        colors={getColor(rainfall)} // Color based on category
        percent={percentValue}
        arcPadding={0.01}
        cornerRadius={3}
        needleColor="#464A4F"
        needleBaseColor="#464A4F"
        textColor="#000000"
        formatTextValue={() => `${rainfall.toFixed(1)} mm`}
      />
      <p style={{ textAlign: "center", marginTop: "-10px", fontWeight: "bold" }}>
        {getCategory(rainfall)}
      </p>
    </div>
  );
};

export default RainfallGauge;