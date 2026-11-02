import GaugeChart from "react-gauge-chart";

const clampPercent = (val) => {
  if (!Number.isFinite(val)) return 0;
  return Math.min(1, Math.max(0, val));
};

const IrradiationGauge = ({ irradiation = 0 }) => {
  const safeVal = typeof irradiation === "number" && !isNaN(irradiation) ? irradiation : 0;

  const getCategory = (irr) => {
    if (irr <= 200) return "Low";
    if (irr <= 400) return "Moderate";
    if (irr <= 600) return "High";
    return "Very High";
  };

  const getColor = (irr) => {
    if (irr <= 200) return ["#10b981", "#e9eff2"];
    if (irr <= 400) return ["#84cc16", "#e9eff2"];
    if (irr <= 600) return ["#f59e0b", "#e9eff2"];
    return ["#f97316", "#e9eff2"];
  };

  const percentValue = clampPercent(safeVal / 1000);

  return (
    <div className="gauge-wrapper">
      <GaugeChart
        id="irradiation-gauge"
        nrOfLevels={100}
        arcsLength={[percentValue, 1 - percentValue]}
        colors={getColor(safeVal)}
        percent={percentValue}
        arcPadding={0.01}
        cornerRadius={3}
        needleColor="#33473f"
        needleBaseColor="#33473f"
        textColor="#12241d"
        formatTextValue={() => `${safeVal.toFixed(1)} W/m²`}
      />
      <span className="mc-gauge-category">{getCategory(safeVal)}</span>
    </div>
  );
};

export default IrradiationGauge;
