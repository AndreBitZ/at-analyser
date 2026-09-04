const Z = ["Z1","Z2","Z3","Z4","Z5","Z6","Z7","Z8","Z9"];
const B = ["B1","B2","B3","B4","B5","B6","B7","B8","B9"];

function cell(map: Record<string, number>, key: string, max: number) {
  const n = map[key] || 0;
  const a = max ? n / max : 0;
  return (
    <div key={key} className="heat-cell" style={{ background: `rgba(61,207,142,${0.12 + a * 0.75})` }}>
      <span>{key}</span><strong>{n}</strong>
    </div>
  );
}

export function HeatGrid({ title, map, keys }: { title: string; map: Record<string, number>; keys: string[] }) {
  const max = Math.max(1, ...keys.map((k) => map[k] || 0));
  return (
    <div style={{ marginTop: 12 }}>
      <h3>{title}</h3>
      <div className="heat-grid">{keys.map((k) => cell(map, k, max))}</div>
    </div>
  );
}

export function ZoneHeat({ zones }: { zones: Record<string, number> }) {
  return <HeatGrid title="Campo Z1–Z9" map={zones || {}} keys={Z} />;
}
export function BoxHeat({ boxes }: { boxes: Record<string, number> }) {
  return <HeatGrid title="Baliza B1–B9" map={boxes || {}} keys={B} />;
}
