import React from "react";
import GaugeChart from "react-gauge-chart";

const WindspeedGauge = ({ windspeed }) => {
  // Function to determine category based on wind speed
  const getCategory = (speed) => {
    if (speed < 1) return "Calm";
    if (speed <= 5) return "Light Air";
    if (speed <= 11) return "Light Breeze";
    if (speed <= 19) return "Gentle Breeze";
    if (speed <= 28) return "Moderate Breeze";
    if (speed <= 38) return "Fresh Breeze";
    if (speed <= 49) return "Strong Breeze";
    if (speed <= 61) return "Near Gale";
    if (speed <= 74) return "Gale";
    if (speed <= 88) return "Severe Gale";
    if (speed <= 102) return "Storm";
    if (speed <= 117) return "Violent Storm";
    return "Hurricane";
  };

  // Function to determine color based on wind speed
  const getColor = (speed) => {
    const hue = 120 - (speed / 120) * 120; // 120° (Green) to 0° (Red)
    return `hsl(${hue}, 100%, 50%)`;
  };

  // Calculate percent value for GaugeChart
  const percentValue = windspeed / 120; // Assume max value is 120 km/h

  return (
    <div style={{ width: "200px", margin: "0 auto" }}>
      <GaugeChart
        id="windspeed-gauge"
        nrOfLevels={100}
        arcsLength={[percentValue, 1 - percentValue]}
        colors={[getColor(windspeed), "#e6e6e6"]} // Color based on wind speed
        percent={percentValue}
        arcPadding={0.01}
        cornerRadius={3}
        needleColor="#464A4F"
        needleBaseColor="#464A4F"
        textColor="#000000"
        formatTextValue={() => `${windspeed.toFixed(1)} km/h`}
      />
      <p style={{ textAlign: "center", marginTop: "-10px", fontWeight: "bold" }}>
        {getCategory(windspeed)}
      </p>
    </div>
  );
};

export default WindspeedGauge;