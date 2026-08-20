import React, { useEffect, useState } from 'react';
import { getParts } from '../api/partApi';

const CATEGORIES = [
    { key: 'Display', label: 'Display', emoji: '📱', image: '/part-categories/display.jpg', color: '#2196f3' },
    { key: 'Battery', label: 'Battery', emoji: '🔋', image: '/part-categories/battery.jpg', color: '#4caf50' },
    { key: 'Speaker', label: 'Speaker', emoji: '🔊', image: '/part-categories/speaker.jpg', color: '#ff9800' },
    { key: 'Microphone', label: 'Microphone', emoji: '🎤', image: '/part-categories/microphone.jpg', color: '#e91e63' },
    { key: 'Camera', label: 'Camera', emoji: '📷', image: '/part-categories/camera.jpg', color: '#9c27b0' },
    { key: 'Charging Port', label: 'Charging Port', emoji: '⚡', image: '/part-categories/charging-port.jpg', color: '#ff5722' },
    { key: 'Motherboard', label: 'Motherboard', emoji: '🖥️', image: null, color: '#607d8b' },
    { key: 'Back Cover', label: 'Back Cover', emoji: '🛡️', image: null, color: '#795548' },
    { key: 'Other', label: 'Other', emoji: '🔩', image: null, color: '#9e9e9e' },
];

const PartCategoryGrid = ({ onCategorySelect, onBack }) => {
    const [parts, setParts] = useState([]);
    const [hoveredCard, setHoveredCard] = useState(null);

    useEffect(() => {
        const fetchParts = async () => {
            try {
                const data = await getParts();
                setParts(data);
            } catch (err) {
                console.error('Failed to load parts', err);
            }
        };
        fetchParts();
    }, []);

    const getCategoryCount = (categoryKey) => {
        return parts.filter(p => (p.category || 'Other') === categoryKey).length;
    };

    const getTotalStock = (categoryKey) => {
        return parts.filter(p => (p.category || 'Other') === categoryKey)
            .reduce((sum, p) => sum + (p.quantity || 0), 0);
    };

    return (
        <div className="card">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={onBack} style={{
                        backgroundColor: '#f1f1f1', border: 'none', padding: '10px 15px',
                        borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px',
                        transition: 'all 0.2s'
                    }}>
                        ← Back to Repairs
                    </button>
                    <h2 style={{ margin: 0, color: '#333', fontSize: '24px' }}>⚙️ Repair Parts Inventory</h2>
                </div>
                <div style={{
                    backgroundColor: '#f0f4ff', padding: '8px 16px', borderRadius: '20px',
                    color: '#3f51b5', fontWeight: '600', fontSize: '14px'
                }}>
                    Total: {parts.length} parts | {parts.reduce((s, p) => s + (p.quantity || 0), 0)} units
                </div>
            </div>

            {/* Subtitle */}
            <p style={{ color: '#888', margin: '0 0 25px 0', fontSize: '15px' }}>
                Select a category to view and manage repair parts
            </p>

            {/* Category Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '20px',
            }}>
                {CATEGORIES.map((cat) => {
                    const count = getCategoryCount(cat.key);
                    const stock = getTotalStock(cat.key);
                    const isHovered = hoveredCard === cat.key;

                    return (
                        <div
                            key={cat.key}
                            onClick={() => onCategorySelect(cat.key)}
                            onMouseEnter={() => setHoveredCard(cat.key)}
                            onMouseLeave={() => setHoveredCard(null)}
                            style={{
                                position: 'relative',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: isHovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
                                boxShadow: isHovered
                                    ? `0 20px 40px ${cat.color}30, 0 0 0 2px ${cat.color}40`
                                    : '0 4px 15px rgba(0,0,0,0.08)',
                                border: `1px solid ${isHovered ? cat.color + '60' : '#eee'}`,
                                background: '#fff',
                            }}
                        >
                            {/* Image / Fallback */}
                            <div style={{
                                height: '160px',
                                background: cat.image ? `url(${cat.image}) center/cover no-repeat` : `linear-gradient(135deg, ${cat.color}15, ${cat.color}30)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                            }}>
                                {!cat.image && (
                                    <span style={{ fontSize: '60px', opacity: 0.8 }}>{cat.emoji}</span>
                                )}

                                {/* Gradient Overlay for images */}
                                {cat.image && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: '60px',
                                        background: 'linear-gradient(transparent, rgba(0,0,0,0.3))',
                                    }} />
                                )}

                                {/* Count Badge */}
                                <div style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    backgroundColor: count > 0 ? cat.color : '#bbb',
                                    color: 'white',
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                }}>
                                    {count} {count === 1 ? 'part' : 'parts'}
                                </div>
                            </div>

                            {/* Info */}
                            <div style={{ padding: '16px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '6px',
                                }}>
                                    <span style={{ fontSize: '20px' }}>{cat.emoji}</span>
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: '16px',
                                        fontWeight: '700',
                                        color: '#333',
                                    }}>
                                        {cat.label}
                                    </h3>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}>
                                    <span style={{
                                        fontSize: '13px',
                                        color: stock > 0 ? '#4caf50' : '#f44336',
                                        fontWeight: '600',
                                    }}>
                                        {stock} units in stock
                                    </span>
                                    <span style={{
                                        fontSize: '12px',
                                        color: cat.color,
                                        fontWeight: '600',
                                        opacity: isHovered ? 1 : 0,
                                        transition: 'opacity 0.3s',
                                    }}>
                                        View →
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export { CATEGORIES };
export default PartCategoryGrid;
