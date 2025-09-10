import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function RealTimeChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const [heartRate, setHeartRate] = useState(72);
  const [dataPoints, setDataPoints] = useState<number[]>([]);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      
      // Draw grid
      ctx.strokeStyle = 'hsl(24, 20%, 88%)';
      ctx.lineWidth = 0.5;
      
      // Vertical lines
      for (let x = 0; x < canvas.offsetWidth; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.offsetHeight);
        ctx.stroke();
      }
      
      // Horizontal lines
      for (let y = 0; y < canvas.offsetHeight; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.offsetWidth, y);
        ctx.stroke();
      }

      // Draw ECG waveform
      if (dataPoints.length > 1) {
        ctx.strokeStyle = 'hsl(0, 84%, 60%)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const xStep = canvas.offsetWidth / Math.max(dataPoints.length - 1, 1);
        const centerY = canvas.offsetHeight / 2;
        
        dataPoints.forEach((point, index) => {
          const x = index * xStep;
          const y = centerY + (point * centerY * 0.8);
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        
        ctx.stroke();
      }
    };

    draw();
  }, [dataPoints]);

  // Generate realistic ECG data
  useEffect(() => {
    let timeIndex = 0;
    const maxPoints = 150;
    
    const generateECGPoint = (t: number): number => {
      // Simulate ECG waveform with P, QRS, T waves
      const heartCycle = (t % (60 / heartRate * 10)) / (60 / heartRate * 10);
      
      if (heartCycle < 0.1) {
        // P wave
        return Math.sin(heartCycle * Math.PI * 10) * 0.2;
      } else if (heartCycle >= 0.15 && heartCycle < 0.25) {
        // QRS complex
        const qrsPhase = (heartCycle - 0.15) / 0.1;
        if (qrsPhase < 0.3) {
          return -Math.sin(qrsPhase * Math.PI * 3.33) * 0.3;
        } else if (qrsPhase < 0.7) {
          return Math.sin((qrsPhase - 0.3) * Math.PI * 2.5) * 1.2;
        } else {
          return -Math.sin((qrsPhase - 0.7) * Math.PI * 3.33) * 0.5;
        }
      } else if (heartCycle >= 0.35 && heartCycle < 0.55) {
        // T wave
        const tPhase = (heartCycle - 0.35) / 0.2;
        return Math.sin(tPhase * Math.PI) * 0.4;
      } else {
        // Baseline with slight noise
        return (Math.random() - 0.5) * 0.05;
      }
    };

    const interval = setInterval(() => {
      setDataPoints(prev => {
        const newPoint = generateECGPoint(timeIndex);
        const newPoints = [...prev, newPoint];
        
        // Keep only the last maxPoints
        if (newPoints.length > maxPoints) {
          newPoints.shift();
        }
        
        return newPoints;
      });
      
      timeIndex += 0.1;
      
      // Simulate heart rate variations
      if (timeIndex % 30 === 0) {
        setHeartRate(prev => {
          const variation = (Math.random() - 0.5) * 10;
          return Math.max(60, Math.min(100, prev + variation));
        });
      }
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(interval);
  }, [heartRate]);

  return (
    <div className="relative w-full h-40 bg-muted rounded-lg overflow-hidden" data-testid="ecg-chart">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%' }}
        data-testid="ecg-canvas"
      />
      
      {/* Live indicator */}
      <div className="absolute top-2 right-2 flex items-center space-x-2">
        <div className="w-2 h-2 bg-accent rounded-full animate-pulse" data-testid="live-indicator"></div>
        <span className="text-xs text-muted-foreground">LIVE</span>
      </div>
      
      {/* Heart rate display */}
      <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1">
        <span className="text-xs font-medium text-foreground" data-testid="chart-heart-rate">
          {Math.round(heartRate)} BPM
        </span>
      </div>
    </div>
  );
}
