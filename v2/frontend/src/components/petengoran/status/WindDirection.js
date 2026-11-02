import GaugeChart from "react-gauge-chart";

const clampPercent = (val) => {
  if (!Number.isFinite(val)) return 0;
  return Math.min(1, Math.max(0, val));
};

const WindDirectionGauge = ({ windDirection = 0 }) => {
  const isNumeric = typeof windDirection === "number" && !isNaN(windDirection);
  const safeVal = isNumeric ? windDirection : 0;

  const getCategory = (direction) => {
    if (direction === 0) return "North (N)";
    if (direction > 0 && direction <= 45) return "Northeast (NE)";
    if (direction > 45 && direction <= 90) return "East (E)";
    if (direction > 90 && direction <= 135) return "Southeast (SE)";
    if (direction > 135 && direction <= 180) return "South (S)";
    if (direction > 180 && direction <= 225) return "Southwest (SW)";
    if (direction > 225 && direction <= 270) return "West (W)";
    if (direction > 270 && direction <= 315) return "Northwest (NW)";
    return "North (N)";
  };

  const percentValue = clampPercent(safeVal / 360);

  return (
    <div className="gauge-wrapper">
      <GaugeChart
        id="wind-direction-gauge"
        nrOfLevels={360}
        arcsLength={[percentValue, 1 - percentValue]}
        colors={["#0f9b63", "#e9eff2"]}
        percent={percentValue}
        arcPadding={0.01}
        cornerRadius={3}
        needleColor="#33473f"
        needleBaseColor="#33473f"
        textColor="#12241d"
        formatTextValue={() => (isNumeric ? `${safeVal.toFixed(1)}°` : "0.0°")}
      />
      <span className="mc-gauge-category">{getCategory(safeVal)}</span>
    </div>
  );
};

export default WindDirectionGauge;
