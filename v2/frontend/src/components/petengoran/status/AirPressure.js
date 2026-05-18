import React from "react";
import GaugeChart from "react-gauge-chart";

const AirPressureGauge = ({ airPressure }) => {
  // Function to determine category based on air pressure
  const getCategory = (pressure) => {
    if (pressure < 1000) return "Low";
    if (pressure <= 1020) return "Normal";
    if (pressure <= 1040) return "High";
    return "Very High";
  };

  // Function to determine color based on category
  const getColor = (pressure) => {
    if (pressure < 1000) return ["#00FF00", "#e6e6e6"]; // Green
    if (pressure <= 1020) return ["#ADFF2F", "#e6e6e6"]; // Light Green
    if (pressure <= 1040) return ["#FFD700", "#FFA500"]; // Yellow and Orange
    return ["#FF4500", "#e6e6e6"]; // Red
  };

  // Calculate percent value for GaugeChart
  const percentValue = (airPressure - 950) / 120;

  return (
    <div style={{ width: "200px", margin: "0 auto" }}>
      <GaugeChart
        id="air-pressure-gauge"
        nrOfLevels={100}
        arcsLength={[percentValue, 1 - percentValue]}
        colors={getColor(airPressure)} // Color based on category
        percent={percentValue}
        arcPadding={0.01}
        cornerRadius={3}
        needleColor="#464A4F"
        needleBaseColor="#464A4F"
        textColor="#000000"
        formatTextValue={() => `${airPressure.toFixed(1)} hPa`}
      />
      <p style={{ textAlign: "center", marginTop: "-10px", fontWeight: "bold" }}>
        {getCategory(airPressure)}
      </p>
    </div>
  );
};

export default AirPressureGauge;