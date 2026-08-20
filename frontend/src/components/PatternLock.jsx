import React, { useState, useRef, useEffect, useCallback } from 'react';

const PatternLock = ({ onChange, readOnly = false, initialPattern = [] }) => {
    const [path, setPath] = useState(initialPattern);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPos, setCurrentPos] = useState(null);
    const svgRef = useRef(null);

    // 3x3 Grid positions (0 to 8)
    const gridSize = 3;
    const spacing = 80;
    const offset = 40;
    
    const getPointCoords = (index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        return {
            x: col * spacing + offset,
            y: row * spacing + offset
        };
    };

    useEffect(() => {
        if (initialPattern.length > 0) {
            setPath(initialPattern);
        }
    }, [initialPattern]);

    const handlePointerDown = (index, e) => {
        if (readOnly) return;
        e.preventDefault(); // Prevent scrolling on touch
        setIsDrawing(true);
        setPath([index]);
        if (onChange) onChange([index]);
    };

    const handlePointerEnter = (index) => {
        if (readOnly || !isDrawing) return;
        if (!path.includes(index)) {
            const newPath = [...path, index];
            setPath(newPath);
            if (onChange) onChange(newPath);
        }
    };

    // To handle touch movement across elements
    const handleTouchMove = useCallback((e) => {
        if (readOnly || !isDrawing || !svgRef.current) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const svgRect = svgRef.current.getBoundingClientRect();
        
        // Update current line position for visual feedback
        setCurrentPos({
            x: touch.clientX - svgRect.left,
            y: touch.clientY - svgRect.top
        });

        // Find if we are over a node
        const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
        const node = elements.find(el => el.hasAttribute('data-index'));
        
        if (node) {
            const index = parseInt(node.getAttribute('data-index'), 10);
            if (!path.includes(index)) {
                const newPath = [...path, index];
                setPath(newPath);
                if (onChange) onChange(newPath);
            }
        }
    }, [isDrawing, path, readOnly, onChange]);

    const handlePointerMove = (e) => {
        if (readOnly || !isDrawing || !svgRef.current) return;
        const svgRect = svgRef.current.getBoundingClientRect();
        setCurrentPos({
            x: e.clientX - svgRect.left,
            y: e.clientY - svgRect.top
        });
    };

    const handlePointerUp = () => {
        if (readOnly) return;
        setIsDrawing(false);
        setCurrentPos(null);
    };

    useEffect(() => {
        const handleGlobalUp = () => setIsDrawing(false);
        window.addEventListener('pointerup', handleGlobalUp);
        window.addEventListener('touchend', handleGlobalUp);
        return () => {
            window.removeEventListener('pointerup', handleGlobalUp);
            window.removeEventListener('touchend', handleGlobalUp);
        };
    }, []);

    const resetPattern = () => {
        if (readOnly) return;
        setPath([]);
        setCurrentPos(null);
        if (onChange) onChange([]);
    };

    const dots = Array.from({ length: 9 }).map((_, i) => getPointCoords(i));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}>
            <svg 
                ref={svgRef}
                width={240} 
                height={240} 
                style={{ background: '#f8fafc', borderRadius: '12px', touchAction: 'none', border: '1px solid #e2e8f0' }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onTouchMove={handleTouchMove}
            >
                {/* Draw completed lines */}
                {path.length > 1 && path.map((pointIndex, i) => {
                    if (i === 0) return null;
                    const prev = getPointCoords(path[i - 1]);
                    const curr = getPointCoords(pointIndex);
                    return (
                        <line 
                            key={`line-${i}`}
                            x1={prev.x} y1={prev.y} 
                            x2={curr.x} y2={curr.y} 
                            stroke="#3b82f6" 
                            strokeWidth="4" 
                            strokeLinecap="round"
                        />
                    );
                })}

                {/* Draw active line while drawing */}
                {isDrawing && currentPos && path.length > 0 && (
                    <line 
                        x1={getPointCoords(path[path.length - 1]).x} 
                        y1={getPointCoords(path[path.length - 1]).y} 
                        x2={currentPos.x} 
                        y2={currentPos.y} 
                        stroke="#93c5fd" 
                        strokeWidth="4" 
                        strokeLinecap="round" 
                    />
                )}

                {/* Draw Dots */}
                {dots.map((pos, index) => {
                    const isActive = path.includes(index);
                    return (
                        <g key={index}>
                            {/* Hitbox for easier touching */}
                            <circle
                                data-index={index}
                                cx={pos.x} cy={pos.y} r="25"
                                fill="transparent"
                                onPointerDown={(e) => handlePointerDown(index, e)}
                                onPointerEnter={() => handlePointerEnter(index)}
                                style={{ cursor: readOnly ? 'default' : 'pointer' }}
                            />
                            {/* Visual Dot */}
                            <circle
                                cx={pos.x} cy={pos.y} r={isActive ? "8" : "5"}
                                fill={isActive ? "#2563eb" : "#cbd5e1"}
                                pointerEvents="none"
                                style={{ transition: 'all 0.2s ease' }}
                            />
                            {/* Halo effect on active */}
                            {isActive && (
                                <circle cx={pos.x} cy={pos.y} r="16" fill="rgba(59, 130, 246, 0.2)" pointerEvents="none" />
                            )}
                        </g>
                    );
                })}
            </svg>
            {!readOnly && (
                <button 
                    type="button" 
                    onClick={resetPattern}
                    style={{ marginTop: '12px', padding: '6px 16px', borderRadius: '20px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}
                >
                    Clear Pattern
                </button>
            )}
        </div>
    );
};

export default PatternLock;
