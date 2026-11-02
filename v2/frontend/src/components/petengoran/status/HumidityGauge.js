import GaugeChart from "react-gauge-chart";

const clampPercent = (val) => {
  if (!Number.isFinite(val)) return 0;
  return Math.min(1, Math.max(0, val));
};

const HumidityGauge = ({ humidity = 0 }) => {
  const safeVal = typeof humidity === "number" && !isNaN(humidity) ? humidity : 0;

  const getCategory = (hum) => {
    if (hum < 30) return "Very Dry";
    if (hum < 40) return "Dry";
    if (hum < 60) return "Normal";
    if (hum < 80) return "Humid";
    return "Very Humid";
  };

  const getColor = (hum) => {
    if (hum < 30) return ["#f59e0b", "#e9eff2"];
    if (hum < 40) return ["#84cc16", "#e9eff2"];
    if (hum < 60) return ["#10b981", "#e9eff2"];
    if (hum < 80) return ["#0ea5e9", "#e9eff2"];
    return ["#3b82f6", "#e9eff2"];
  };

  const percentValue = clampPercent(safeVal / 100);

  return (
    <div className="gauge-wrapper">
      <GaugeChart
        id="humidity-gauge"
        nrOfLevels={100}
        arcsLength={[percentValue, 1 - percentValue]}
        colors={getColor(safeVal)}
        percent={percentValue}
        arcPadding={0.01}
        cornerRadius={3}
        needleColor="#33473f"
        needleBaseColor="#33473f"
        textColor="#12241d"
        formatTextValue={() => `${safeVal.toFixed(1)}%`}
      />
      <span className="mc-gauge-category">{getCategory(safeVal)}</span>
    </div>
  );
};

export default HumidityGauge;
