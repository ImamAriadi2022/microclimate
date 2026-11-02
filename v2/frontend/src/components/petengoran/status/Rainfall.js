import GaugeChart from "react-gauge-chart";

const clampPercent = (val) => {
  if (!Number.isFinite(val)) return 0;
  return Math.min(1, Math.max(0, val));
};

const RainfallGauge = ({ rainfall = 0 }) => {
  const safeVal = typeof rainfall === "number" && !isNaN(rainfall) ? rainfall : 0;

  const getCategory = (rain) => {
    if (rain <= 20) return "Light";
    if (rain <= 50) return "Moderate";
    if (rain <= 100) return "Heavy";
    if (rain <= 150) return "Very Heavy";
    return "Extreme";
  };

  const getColor = (rain) => {
    if (rain <= 20) return ["#10b981", "#e9eff2"];
    if (rain <= 50) return ["#0ea5e9", "#e9eff2"];
    if (rain <= 100) return ["#f59e0b", "#e9eff2"];
    if (rain <= 150) return ["#f97316", "#e9eff2"];
    return ["#ef4444", "#e9eff2"];
  };

  const percentValue = clampPercent(safeVal / 150);

  return (
    <div className="gauge-wrapper">
      <GaugeChart
        id="rainfall-gauge"
        nrOfLevels={100}
        arcsLength={[percentValue, 1 - percentValue]}
        colors={getColor(safeVal)}
        percent={percentValue}
        arcPadding={0.01}
        cornerRadius={3}
        needleColor="#33473f"
        needleBaseColor="#33473f"
        textColor="#12241d"
        formatTextValue={() => `${safeVal.toFixed(1)} mm`}
      />
      <span className="mc-gauge-category">{getCategory(safeVal)}</span>
    </div>
  );
};

export default RainfallGauge;
