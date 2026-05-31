import React, { useEffect, useState } from 'react';
import { getProducts } from '../api/productApi';

// Lightweight SVG pie chart that groups product stock by brand
const COLORS = [
  '#4caf50','#2196f3','#ff9800','#9c27b0','#f44336','#00bcd4','#8bc34a','#ffc107','#3f51b5','#e91e63'
];

function polarToCartesian(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * Math.PI / 180.0;
  return { x: cx + (r * Math.cos(a)), y: cy + (r * Math.sin(a)) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

const BrandStockPie = ({ maxSlices = 8, width = 420, height = 300, onlyPhones = true }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const products = await getProducts();
        // optionally limit to phones only (items that have IMEI/serial fields)
        const items = (products || []).filter(p => {
          if (!onlyPhones) return true;
          if (!p) return false;
          if (p.imei) return true;
          if (p.imei1 || p.imei2) return true;
          if (p.serialNumber) return true;
          return false;
        });
        // aggregate by brand (normalize brand strings)
        const map = {};
        for (const p of items) {
          const brand = (p.brand || 'Unknown').trim() || 'Unknown';
          const qty = Number(p.stock || 0);
          map[brand] = (map[brand] || 0) + qty;
        }
        // convert to array and sort
        const arr = Object.keys(map).map(k => ({ brand: k, stock: map[k] }));
        arr.sort((a,b) => b.stock - a.stock);
        // group small slices into "Other"
        if (arr.length > maxSlices) {
          const main = arr.slice(0, maxSlices - 1);
          const other = arr.slice(maxSlices - 1).reduce((s, it) => s + it.stock, 0);
          main.push({ brand: 'Other', stock: other });
          setData(main);
        } else {
          setData(arr);
        }
      } catch (err) {
        console.error('Failed to load products for brand pie', err);
        setData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [maxSlices]);

  if (loading) return <div style={{ padding: 12 }}>Loading brand stock...</div>;
  if (!data || data.length === 0) return <div style={{ padding: 12, color: '#666' }}>No product stock data available.</div>;

  const total = data.reduce((s, d) => s + d.stock, 0) || 1;
  const cx = width / 2 - 10;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.36;

  // build arcs
  let angleAcc = 0;
  const slices = data.map((d, i) => {
    const angle = (d.stock / total) * 360;
    const start = angleAcc;
    const end = angleAcc + angle;
    angleAcc += angle;
    return { ...d, start, end, color: COLORS[i % COLORS.length], index: i };
  });

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 12 }}>
      <svg width={width} height={height} style={{ flex: '0 0 auto' }}>
        {slices.map(s => (
          <path
            key={`${s.brand}-${s.index}`}
            d={describeArc(cx, cy, r, s.start, s.end)}
            fill={s.color}
            stroke="#fff"
            strokeWidth={1}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: 'pointer', opacity: hover && hover.index !== s.index ? 0.7 : 1 }}
          />
        ))}

        {/* center label */}
        <circle cx={cx} cy={cy} r={r * 0.45} fill="#fff" />
        <text x={cx} y={cy - 4} fontSize={14} fontWeight={600} textAnchor="middle" fill="#222">Brands</text>
        <text x={cx} y={cy + 16} fontSize={12} textAnchor="middle" fill="#666">Total: {total}</text>
      </svg>

      <div style={{ flex: 1, minWidth: 160 }}>
        <h3 style={{ margin: '4px 0 8px 0' }}>Phone Stock by Brand</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: height - 40, overflow: 'auto' }}>
          {slices.map(s => (
            <div key={`${s.brand}-${s.index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 14, height: 14, background: s.color, borderRadius: 3 }} />
                <div style={{ fontSize: 13 }}>{s.brand}</div>
              </div>
              <div style={{ color: '#333', fontWeight: 600 }}>{s.stock}</div>
            </div>
          ))}
        </div>
        {hover && (
          <div style={{ marginTop: 12, color: '#333' }}>
            <strong>{hover.brand}</strong>: {hover.stock} ({((hover.stock / total) * 100).toFixed(1)}%)
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandStockPie;
