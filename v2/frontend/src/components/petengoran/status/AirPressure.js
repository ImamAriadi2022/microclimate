import GaugeChart from "react-gauge-chart";

const clampPercent = (val) => {
  if (!Number.isFinite(val)) return 0;
  return Math.min(1, Math.max(0, val));
};

const AirPressureGauge = ({ airPressure = 0 }) => {
  const safeVal = typeof airPressure === "number" && !isNaN(airPressure) ? airPressure : 0;

  const getCategory = (pressure) => {
    if (pressure < 1000) return "Low";
    if (pressure <= 1020) return "Normal";
    if (pressure <= 1040) return "High";
    return "Very High";
  };

  const getColor = (pressure) => {
    if (pressure < 1000) return ["#0ea5e9", "#e9eff2"];
    if (pressure <= 1020) return ["#10b981", "#e9eff2"];
    if (pressure <= 1040) return ["#f59e0b", "#e9eff2"];
    return ["#ef4444", "#e9eff2"];
  };

  const percentValue = clampPercent(safeVal <= 0 ? 0 : (safeVal - 950) / 120);

  return (
    <div className="gauge-wrapper">
      <GaugeChart
        id="air-pressure-gauge"
        nrOfLevels={100}
        arcsLength={[percentValue, 1 - percentValue]}
        colors={getColor(safeVal)}
        percent={percentValue}
        arcPadding={0.01}
        cornerRadius={3}
        needleColor="#33473f"
        needleBaseColor="#33473f"
        textColor="#12241d"
        formatTextValue={() => `${safeVal.toFixed(1)} hPa`}
      />
      <span className="mc-gauge-category">{getCategory(safeVal)}</span>
    </div>
  );
};

export default AirPressureGauge;
