import GaugeChart from "react-gauge-chart";

const clampPercent = (val) => {
  if (!Number.isFinite(val)) return 0;
  return Math.min(1, Math.max(0, val));
};

const TemperatureGauge = ({ temperature = 0 }) => {
  const safeVal = typeof temperature === "number" && !isNaN(temperature) ? temperature : 0;

  const getCategory = (temp) => {
    if (temp < 15) return "Cold";
    if (temp < 20) return "Cool";
    if (temp < 25) return "Comfortable";
    if (temp < 30) return "Warm";
    if (temp < 35) return "Hot";
    return "Very Hot";
  };

  const getColor = (temp) => {
    if (temp < 15) return ["#3b82f6", "#e9eff2"];
    if (temp < 20) return ["#0ea5e9", "#e9eff2"];
    if (temp < 25) return ["#10b981", "#e9eff2"];
    if (temp < 30) return ["#f59e0b", "#e9eff2"];
    if (temp < 35) return ["#f97316", "#e9eff2"];
    return ["#ef4444", "#e9eff2"];
  };

  const percentValue = clampPercent(safeVal <= 0 ? 0 : (safeVal - 10) / 30);

  return (
    <div className="gauge-wrapper">
      <GaugeChart
        id="temperature-gauge"
        nrOfLevels={100}
        arcsLength={[percentValue, 1 - percentValue]}
        colors={getColor(safeVal)}
        percent={percentValue}
        arcPadding={0.01}
        cornerRadius={3}
        needleColor="#33473f"
        needleBaseColor="#33473f"
        textColor="#12241d"
        formatTextValue={() => `${safeVal.toFixed(1)}°C`}
      />
      <span className="mc-gauge-category">{getCategory(safeVal)}</span>
    </div>
  );
};

export default TemperatureGauge;
