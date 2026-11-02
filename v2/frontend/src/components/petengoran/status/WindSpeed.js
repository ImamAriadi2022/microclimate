import GaugeChart from "react-gauge-chart";

const clampPercent = (val) => {
  if (!Number.isFinite(val)) return 0;
  return Math.min(1, Math.max(0, val));
};

const WindspeedGauge = ({ windspeed = 0 }) => {
  const safeVal = typeof windspeed === "number" && !isNaN(windspeed) ? windspeed : 0;

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

  const getColor = (speed) => {
    const ratio = clampPercent(speed / 120);
    const hue = Math.round(150 - ratio * 150);
    return `hsl(${hue}, 82%, 44%)`;
  };

  const percentValue = clampPercent(safeVal / 120);

  return (
    <div className="gauge-wrapper">
      <GaugeChart
        id="windspeed-gauge"
        nrOfLevels={100}
        arcsLength={[percentValue, 1 - percentValue]}
        colors={[getColor(safeVal), "#e9eff2"]}
        percent={percentValue}
        arcPadding={0.01}
        cornerRadius={3}
        needleColor="#33473f"
        needleBaseColor="#33473f"
        textColor="#12241d"
        formatTextValue={() => `${safeVal.toFixed(1)} km/h`}
      />
      <span className="mc-gauge-category">{getCategory(safeVal)}</span>
    </div>
  );
};

export default WindspeedGauge;
