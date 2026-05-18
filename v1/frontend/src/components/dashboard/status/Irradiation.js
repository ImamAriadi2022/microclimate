import React from "react";
import GaugeChart from "react-gauge-chart";

const IrradiationGauge = ({ irradiation }) => {
  // Function to determine category based on irradiation
  const getCategory = (irr) => {
    if (irr <= 200) return "Low";
    if (irr <= 400) return "Moderate";
    if (irr <= 600) return "High";
    return "Very High";
  };

  // Function to determine color based on category
  const getColor = (irr) => {
    if (irr <= 200) return ["#00FF00", "#e6e6e6"]; // Green
    if (irr <= 400) return ["#ADFF2F", "#e6e6e6"]; // Light Green
    if (irr <= 600) return ["#FFD700", "#e6e6e6"]; // Yellow
    return ["#FF4500", "#e6e6e6"]; // Orange Red
  };

  // Calculate percent value for GaugeChart
  const percentValue = irradiation / 800; // Assume max value is 800 W/m²

  return (
    <div style={{ width: "200px", margin: "0 auto" }}>
      <GaugeChart
        id="irradiation-gauge"
        nrOfLevels={100}
        arcsLength={[percentValue, 1 - percentValue]}
        colors={getColor(irradiation)} // Color based on category
        percent={percentValue}
        arcPadding={0.01}
        cornerRadius={3}
        needleColor="#464A4F"
        needleBaseColor="#464A4F"
        textColor="#000000"
        formatTextValue={() => `${irradiation.toFixed(1)} W/m²`}
      />
      <p style={{ textAlign: "center", marginTop: "-10px", fontWeight: "bold" }}>
        {getCategory(irradiation)}
      </p>
    </div>
  );
};

export default IrradiationGauge;