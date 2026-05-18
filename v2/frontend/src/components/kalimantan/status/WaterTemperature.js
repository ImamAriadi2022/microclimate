import React from "react";
import GaugeChart from "react-gauge-chart";

const WaterTemperatureGauge = ({ waterTemperature }) => {
  // Function to determine category based on water temperature
  const getCategory = (temp) => {
    if (temp < 15) return "Cold";
    if (temp < 20) return "Cool";
    if (temp < 25) return "Comfortable";
    if (temp < 30) return "Warm";
    if (temp < 35) return "Hot";
    return "Very Hot";
  };

  // Function to determine color based on category
  const getColor = (temp) => {
    if (temp < 15) return ["#0000FF", "#e6e6e6"]; // Blue
    if (temp < 20) return ["#87CEEB", "#e6e6e6"]; // Light Blue
    if (temp < 25) return ["#00FF00", "#e6e6e6"]; // Green
    if (temp < 30) return ["#FFD700", "#e6e6e6"]; // Yellow
    if (temp < 35) return ["#FFA500", "#e6e6e6"]; // Orange
    return ["#FF4500", "#e6e6e6"]; // Red
  };

  // Calculate percent value for GaugeChart
  const percentValue = (waterTemperature - 10) / 30; // Assume water temperature range is 10°C to 40°C

  return (
    <div style={{ width: "200px", margin: "0 auto" }}>
      <GaugeChart
        id="water-temperature-gauge"
        nrOfLevels={100}
        arcsLength={[percentValue, 1 - percentValue]}
        colors={getColor(waterTemperature)} // Color based on category
        percent={percentValue}
        arcPadding={0.01}
        cornerRadius={3}
        needleColor="#464A4F"
        needleBaseColor="#464A4F"
        textColor="#000000"
        formatTextValue={() => `${waterTemperature.toFixed(1)}°C`}
      />
      <p style={{ textAlign: "center", marginTop: "-10px", fontWeight: "bold" }}>
        {getCategory(waterTemperature)}
      </p>
    </div>
  );
};

export default WaterTemperatureGauge;