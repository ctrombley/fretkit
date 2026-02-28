import { useEffect, useRef } from 'react';
import { getSynth } from '../lib/synth';

export default function StereoVU() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const barW = 6;
    const gap = 2;
    const bars = 5;
    const barH = Math.floor((H - (bars - 1)) / bars);

    const draw = () => {
      const { left, right } = getSynth().getStereoLevels();
      ctx.clearRect(0, 0, W, H);

      for (const [ch, level] of [[0, left], [1, right]] as [number, number][]) {
        const x = ch * (barW + gap);
        for (let i = 0; i < bars; i++) {
          const threshold = (i + 1) / bars;
          const y = H - (i + 1) * (barH + 1);
          const lit = level >= threshold - 0.1;
          if (i >= 4) ctx.fillStyle = lit ? '#EF4444' : '#4B1113';
          else if (i >= 3) ctx.fillStyle = lit ? '#EAB308' : '#3D3510';
          else ctx.fillStyle = lit ? '#22C55E' : '#0D3320';
          ctx.fillRect(x, y, barW, barH);
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return <canvas ref={canvasRef} width={14} height={19} className="flex-shrink-0" />;
}
