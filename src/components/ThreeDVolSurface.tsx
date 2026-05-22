import { useState } from 'react';
import { RotateCw, Move } from 'lucide-react';

interface ThreeDVolSurfaceProps {
  spot: number;
  baseIV: number;
}

export default function ThreeDVolSurface(props: ThreeDVolSurfaceProps) {
  const { spot, baseIV } = props;
  const [azimuth, setAzimuth] = useState<number>(35); // Azimuth rotation in degrees
  const [elevation, setElevation] = useState<number>(30); // Elevation angle in degrees
  
  // Grid parameters
  const strikeCount = 11;
  const expiryCount = 11;
  
  // Calculate Volatility Surface points
  const points: { strike: number; expiry: number; iv: number }[][] = [];
  
  for (let tIdx = 0; tIdx < expiryCount; tIdx++) {
    const expiry = 0.1 + (tIdx / (expiryCount - 1)) * 0.9; // 0.1 to 1.0 years
    const rowList: { strike: number; expiry: number; iv: number }[] = [];
    
    for (let sIdx = 0; sIdx < strikeCount; sIdx++) {
      const strikeRatio = 0.8 + (sIdx / (strikeCount - 1)) * 4 / 10; // 80% to 120% of spot
      const strike = spot * strikeRatio;
      
      // Implied volatility surface formula: Smile Skew (quadratic in strike) + Term Structure decay
      const skew = Math.pow(strikeRatio - 1.0, 2) * 1.5;
      const termStructure = - 0.04 * Math.sqrt(expiry);
      const ivVal = Math.max(0.04, baseIV + skew + termStructure);
      
      rowList.push({ strike, expiry, iv: ivVal });
    }
    points.push(rowList);
  }

  // 3D Isometric Projection Helper
  // Maps (strikeRatio 0..1, expiryT 0..1, iv 0..1) into canvas space (500x320)
  const project = (sIdx: number, tIdx: number, iv: number) => {
    // Center inputs around 0 (-0.5 to 0.5)
    const x = (sIdx / (strikeCount - 1)) - 0.5;
    const y = (tIdx / (expiryCount - 1)) - 0.5;
    const z = iv - 0.5; // Offset IV values

    // Convert angles to radians
    const theta = (azimuth * Math.PI) / 180;
    const phi = (elevation * Math.PI) / 180;

    // Standard 3D transformation around Azimuth (Z-axis)
    const xr = x * Math.cos(theta) - y * Math.sin(theta);
    const yr = x * Math.sin(theta) + y * Math.cos(theta);
    
    // Transform around Elevation (X-axis)
    const xp = xr;
    const yp = yr * Math.cos(phi) - z * Math.sin(phi);

    // Canvas coordinate adjustments (scale to fit 400x260 bounding area, then offset to center)
    const scaleX = 280;
    const scaleY = 180;
    const canvasX = 250 + xp * scaleX;
    // Lower Z values project higher on screen (standard SVG coordinate inversion)
    const canvasY = 160 + yp * scaleY - z * 100;

    return { x: canvasX, y: canvasY };
  };

  // Build grid paths
  const paths: string[] = [];
  
  // Strike-wise lines
  for (let t = 0; t < expiryCount; t++) {
    let d = '';
    for (let s = 0; s < strikeCount; s++) {
      const { x, y } = project(s, t, points[t][s].iv);
      if (s === 0) d += `M ${x} ${y}`;
      else d += ` L ${x} ${y}`;
    }
    paths.push(d);
  }

  // Expiry-wise lines
  for (let s = 0; s < strikeCount; s++) {
    let d = '';
    for (let t = 0; t < expiryCount; t++) {
      const { x, y } = project(s, t, points[t][s].iv);
      if (t === 0) d += `M ${x} ${y}`;
      else d += ` L ${x} ${y}`;
    }
    paths.push(d);
  }

  // Draw axis ticks and arrows
  // Origin point in logical coordinates (s=0, t=0, iv=0.1)
  const origin = project(0, 0, 0.1);
  const strikeAxisEnd = project(strikeCount - 1, 0, 0.1);
  const expiryAxisEnd = project(0, expiryCount - 1, 0.1);
  const ivAxisEnd = project(0, 0, 0.8);

  const rotateSurface = () => {
    setAzimuth((prev) => (prev + 15) % 360);
  };

  const tiltsUp = () => {
    setElevation((prev) => Math.min(75, prev + 10));
  };

  const tiltsDown = () => {
    setElevation((prev) => Math.max(15, prev - 10));
  };

  return (
    <div className="flex-1 flex flex-col pt-1">
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-800">
            Interactive Multi-Axis IV Wireframe Grid
          </span>
          <span className="text-[10px] text-slate-400">
            Horizontal: Strike ($) &bull; Depth: Expiration (Yrs) &bull; Radial: IV (%)
          </span>
        </div>
        
        {/* Rotation Controls */}
        <div className="flex gap-1.5">
          <button 
            onClick={rotateSurface}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded border border-slate-200 transition-colors"
            title="Rotate Azimuth Angle"
          >
            <RotateCw size={10} className="animate-spin-slow" /> Rotate Strike (azim: {azimuth}°)
          </button>
          
          <button 
            onClick={tiltsUp}
            className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded border border-slate-200 transition-colors"
            title="Tilt Elevation Up"
          >
            Tilt Up
          </button>
          <button 
            onClick={tiltsDown}
            className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded border border-slate-200 transition-colors"
            title="Tilt Elevation Down"
          >
            Tilt Down
          </button>
        </div>
      </div>

      {/* SVG Canvas viewports */}
      <div className="flex-1 bg-slate-50 border border-slate-100 rounded-lg relative overflow-hidden flex items-center justify-center min-h-[250px] cursor-grab active:cursor-grabbing">
        <svg className="w-full h-full p-2 max-h-[300px]" viewBox="0 0 500 320" preserveAspectRatio="xMidYMid meet">
          
          {/* Axis projections */}
          {/* Strike Axis (Green-blue) */}
          <line x1={origin.x} y1={origin.y} x2={strikeAxisEnd.x} y2={strikeAxisEnd.y} stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="3" />
          <text x={strikeAxisEnd.x + 5} y={strikeAxisEnd.y + 12} fontSize="9" fill="#94a3b8" fontWeight="bold" textAnchor="middle">
            Strike Strike
          </text>

          {/* Expiry Axis (Slate-blue) */}
          <line x1={origin.x} y1={origin.y} x2={expiryAxisEnd.x} y2={expiryAxisEnd.y} stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="3" />
          <text x={expiryAxisEnd.x - 12} y={expiryAxisEnd.y + 14} fontSize="9" fill="#94a3b8" fontWeight="bold" textAnchor="middle">
            Expiry T
          </text>

          {/* Volatility Axis (Purple) */}
          <line x1={origin.x} y1={origin.y} x2={ivAxisEnd.x} y2={ivAxisEnd.y} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="2" />
          <polygon 
            points={`${ivAxisEnd.x},${ivAxisEnd.y - 4} ${ivAxisEnd.x - 3},${ivAxisEnd.y} ${ivAxisEnd.x + 3},${ivAxisEnd.y}`} 
            fill="#64748b" 
          />
          <text x={ivAxisEnd.x - 14} y={ivAxisEnd.y + 2} fontSize="9" fill="#64748b" fontWeight="bold">
            IV %
          </text>

          {/* Wireframe Paths */}
          {paths.map((d, idx) => (
            <path
              key={idx}
              d={d}
              fill="none"
              stroke={idx < expiryCount ? "rgba(59, 130, 246, 0.45)" : "rgba(6, 182, 212, 0.45)"}
              strokeWidth={1.2}
              className="hover:stroke-blue-600 transition-colors"
            />
          ))}

          {/* Surface shading (points of extreme skew / ATM overlay) */}
          {/* We'll highlight ATM strike mapping as a translucent blue curve */}
          {(() => {
            const atmRowPoints: {x: number, y: number}[] = [];
            const midSIdx = Math.floor(strikeCount / 2); // ATM index
            for (let t = 0; t < expiryCount; t++) {
              atmRowPoints.push(project(midSIdx, t, points[t][midSIdx].iv));
            }
            if (atmRowPoints.length === 0) return null;
            let dString = `M ${atmRowPoints[0].x} ${atmRowPoints[0].y}`;
            for (let i = 1; i < atmRowPoints.length; i++) {
              dString += ` L ${atmRowPoints[i].x} ${atmRowPoints[i].y}`;
            }
            return (
              <path
                d={dString}
                fill="none"
                stroke="#2563eb"
                strokeWidth={2.5}
                strokeDasharray="1"
                className="drop-shadow-sm"
              />
            );
          })()}

          {/* Legend indicator badges */}
          <g transform="translate(18, 290)">
            <circle cx="0" cy="-3" r="3.5" fill="#3b82f6" />
            <text x="8" y="1" fontSize="9" fill="#64748b" fontWeight="medium">Strikes Grid</text>
          </g>
          <g transform="translate(125, 290)">
            <circle cx="0" cy="-3" r="3.5" fill="#06b6d4" />
            <text x="8" y="1" fontSize="9" fill="#64748b" fontWeight="medium">Expirations Grid</text>
          </g>
          <g transform="translate(255, 290)">
            <line x1="-8" y1="-3" x2="8" y2="-3" stroke="#2563eb" strokeWidth={2.5} />
            <text x="12" y="1" fontSize="9" fill="#64748b" fontWeight="bold">ATM Ridge Skew</text>
          </g>
        </svg>

        {/* Floating Rotation info */}
        <div className="absolute right-3.5 bottom-3.5 flex items-center gap-1 text-[10px] text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded shadow-sm leading-none">
          <Move size={10} /> Tilt: {elevation}° | Yaw: {azimuth}°
        </div>
      </div>
    </div>
  );
}
