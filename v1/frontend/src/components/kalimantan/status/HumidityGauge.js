import React from "react";
import GaugeChart from "react-gauge-chart";

const HumidityGauge = ({ humidity = 0 }) => {
  // Function to determine category based on humidity
  const getCategory = (hum) => {
    if (hum < 30) return "Very Dry";
    if (hum < 40) return "Dry";
    if (hum < 60) return "Normal";
    if (hum < 80) return "Humid";
    return "Very Humid";
  };

  // Function to determine color based on category
  const getColor = (hum) => {
    if (hum < 30) return ["#FFA500", "#e6e6e6"]; // Orange
    if (hum < 40) return ["#ADFF2F", "#e6e6e6"]; // Light Green
    if (hum < 60) return ["#00FF00", "#e6e6e6"]; // Green
    if (hum < 80) return ["#FFD700", "#e6e6e6"]; // Yellow
    return ["#FF4500", "#e6e6e6"]; // Red
  };

  // Calculate percent value for GaugeChart
  const percentValue = typeof humidity === "number" && !isNaN(humidity) ? humidity / 100 : 0;

  return (
    <div style={{ width: "200px", margin: "0 auto" }}>
      <GaugeChart
        id="humidity-gauge"
        nrOfLevels={100}
        arcsLength={[percentValue, 1 - percentValue]}
        colors={getColor(humidity)}
        percent={percentValue}
        arcPadding={0.01}
        cornerRadius={3}
        needleColor="#464A4F"
        needleBaseColor="#464A4F"
        textColor="#000000"
        formatTextValue={() =>
          typeof humidity === "number" && !isNaN(humidity)
            ? `${humidity.toFixed(1)}%`
            : "N/A"
        }
      />
      <p style={{ textAlign: "center", marginTop: "-10px", fontWeight: "bold" }}>
        {typeof humidity === "number" && !isNaN(humidity)
          ? getCategory(humidity)
          : "No Data"}
      </p>
    </div>
  );
};

export default HumidityGauge;