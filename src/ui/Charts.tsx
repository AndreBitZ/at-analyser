type Slice = { label: string; value: number };

export function BarList({ title, data }: { title: string; data: Slice[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="card">
      <h3>{title}</h3>
      {data.length === 0 && <p className="muted">Ainda sem dados.</p>}
      <div className="bars">
        {data.map((d) => (
          <div className="bar-row" key={d.label}>
            <span className="bar-label">{d.label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(d.value / max) * 100}%` }} />
            </div>
            <span className="bar-n">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Donut({ title, data }: { title: string; data: Slice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let acc = 0;
  const colors = ["#3dcf8e", "#5b8cff", "#e8c36a", "#e07a5f", "#9b8cff", "#7ad7c7", "#c9d4ce"];
  const segs = data.map((d, i) => {
    const start = acc / total;
    acc += d.value;
    const end = acc / total;
    return { ...d, start, end, color: colors[i % colors.length] };
  });
  const arc = (a: number, b: number) => {
    const p = (t: number) => {
      const ang = t * 2 * Math.PI - Math.PI / 2;
      return [100 + 72 * Math.cos(ang), 100 + 72 * Math.sin(ang)];
    };
    const [x1, y1] = p(a);
    const [x2, y2] = p(b);
    const large = b - a > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A 72 72 0 ${large} 1 ${x2} ${y2}`;
  };
  return (
    <div className="card">
      <h3>{title}</h3>
      {data.length === 0 ? <p className="muted">Ainda sem dados.</p> : (
        <div className="donut-wrap">
          <svg viewBox="0 0 200 200" width="160" height="160">
            <circle cx="100" cy="100" r="72" fill="none" stroke="#1e2b26" strokeWidth="22" />
            {segs.map((s) => s.value > 0 && (
              <path key={s.label} d={arc(s.start, Math.max(s.start + 0.001, s.end))} fill="none" stroke={s.color} strokeWidth="22" />
            ))}
            <text x="100" y="104" textAnchor="middle" fill="#e8f0ec" fontSize="18" fontWeight="700">{total === 1 && data.every((d) => !d.value) ? 0 : data.reduce((s, d) => s + d.value, 0)}</text>
          </svg>
          <ul className="legend">
            {segs.map((s) => (
              <li key={s.label}><i style={{ background: s.color }} />{s.label} ({s.value})</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
