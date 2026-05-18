import React from "react";
import GaugeChart from "react-gauge-chart";

const OxygenGauge = ({ oxygen }) => {
  // Function to determine category based on oxygen level
  const getCategory = (oxy) => {
    if (oxy < 19.5) return "Oxygen Deficiency";
    if (oxy <= 23.5) return "Safe";
    if (oxy <= 25) return "Oxygen Surplus";
    return "Overload";
  };

  // Function to determine color based on category
  const getColor = (oxy) => {
    if (oxy < 19.5) return ["#FFA500", "#e6e6e6"]; // Orange
    if (oxy <= 23.5) return ["#32CD32", "#e6e6e6"]; // Green
    if (oxy <= 25) return ["#FFD700", "#e6e6e6"]; // Yellow
    return ["#FF4500", "#e6e6e6"]; // Red (Overload)
  };

  // Calculate percent value for GaugeChart
  const percentValue = (oxygen - 18) / 7; // Assume oxygen range is 18% to 25%

  return (
    <div style={{ width: "200px", margin: "0 auto" }}>
      <GaugeChart
        id="oxygen-gauge"
        nrOfLevels={100}
        arcsLength={[percentValue, 1 - percentValue]}
        colors={getColor(oxygen)} // Color based on category
        percent={percentValue}
        arcPadding={0.01}
        cornerRadius={3}
        needleColor="#464A4F"
        needleBaseColor="#464A4F"
        textColor="#000000"
        formatTextValue={() => `${oxygen.toFixed(1)}%`}
      />
      <p style={{ textAlign: "center", marginTop: "-10px", fontWeight: "bold" }}>
        {getCategory(oxygen)}
      </p>
    </div>
  );
};

export default OxygenGauge;