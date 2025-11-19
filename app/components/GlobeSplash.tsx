"use client";

import { useEffect, useRef, useState } from "react";

interface GlobeSplashProps {
  onComplete: () => void;
}

export default function GlobeSplash({ onComplete }: GlobeSplashProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const innerRotationRef = useRef(0);
  const outerRotationRef = useRef(0);
  const zoomRef = useRef(1);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [fadeOut, setFadeOut] = useState(false);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    // 1.2 saniye sonra fade out başlat (kısa süre)
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        onComplete();
      }, 600);
    }, 1200);

    return () => {
      clearTimeout(fadeTimer);
    };
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas boyutunu ayarla - ekranı kaplasın
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    // Dünyayı ekranı daha iyi kaplayacak şekilde büyüt (geniş ekranlar için genişliğe göre)
    const baseRadius = Math.min(
      Math.min(canvas.width, canvas.height) * 0.6,
      canvas.width * 0.45
    );

    // İç dünya için grid noktaları
    const innerNodes: Array<{
      lat: number;
      lon: number;
      x: number;
      y: number;
      z: number;
    }> = [];

    const gridDensity = 15;
    for (let latStep = 0; latStep <= gridDensity; latStep++) {
      for (let lonStep = 0; lonStep <= gridDensity * 2; lonStep++) {
        const lat = (latStep / gridDensity) * Math.PI - Math.PI / 2;
        const lon = (lonStep / (gridDensity * 2)) * Math.PI * 2;
        innerNodes.push({ lat, lon, x: 0, y: 0, z: 0 });
      }
    }

    // Dış ağ için noktalar (TechBackground tarzı)
    const outerNodeCount = 150;
    const outerNodes: Array<{
      angle: number;
      distance: number;
      height: number;
      vx: number;
      vy: number;
      x: number;
      y: number;
      z: number;
    }> = [];

    for (let i = 0; i < outerNodeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = baseRadius * (1.2 + Math.random() * 0.5); // Dünyanın etrafında, daha geniş
      const height = (Math.random() - 0.5) * baseRadius * 1.2;
      outerNodes.push({
        angle,
        distance,
        height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        x: 0,
        y: 0,
        z: 0,
      });
    }

    // 3D projeksiyon fonksiyonu
    const project3D = (x: number, y: number, z: number, radius: number) => {
      const scale = 1 + z / (radius * 2);
      return {
        screenX: x * scale,
        screenY: y * scale,
        z: z,
      };
    };

    // Küre üzerinde nokta projeksiyonu
    const projectSphere = (lat: number, lon: number, radius: number, rotation: number) => {
      const x = radius * Math.cos(lat) * Math.cos(lon + rotation);
      const y = radius * Math.cos(lat) * Math.sin(lon + rotation);
      const z = radius * Math.sin(lat);
      return { x, y, z };
    };

    // Animasyon fonksiyonu
    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dönüş hızları (farklı yönlerde)
      innerRotationRef.current += 0.015; // İç dünya dönüşü
      outerRotationRef.current -= 0.012; // Dış ağ ters yönde dönsün

      // Yaklaşma animasyonu (zoom in)
      zoomRef.current = Math.min(1 + elapsed * 0.25, 1.3); // 1.3x'e kadar yaklaşsın

      const currentRadius = baseRadius * zoomRef.current;

      ctx.save();
      ctx.translate(centerX, centerY);

      // İç dünya grid çizimi
      const innerGridLines: Array<Array<{ x: number; y: number; z: number }>> = [];

      // Enlem çizgileri
      for (let latStep = 0; latStep <= gridDensity; latStep++) {
        const lat = (latStep / gridDensity) * Math.PI - Math.PI / 2;
        const linePoints: Array<{ x: number; y: number; z: number }> = [];
        for (let lonStep = 0; lonStep <= gridDensity * 2; lonStep++) {
          const lon = (lonStep / (gridDensity * 2)) * Math.PI * 2;
          const projected = projectSphere(lat, lon, currentRadius * 0.9, innerRotationRef.current);
          linePoints.push(projected);
        }
        innerGridLines.push(linePoints);
      }

      // Boylam çizgileri
      for (let lonStep = 0; lonStep <= gridDensity * 2; lonStep++) {
        const lon = (lonStep / (gridDensity * 2)) * Math.PI * 2;
        const linePoints: Array<{ x: number; y: number; z: number }> = [];
        for (let latStep = 0; latStep <= gridDensity; latStep++) {
          const lat = (latStep / gridDensity) * Math.PI - Math.PI / 2;
          const projected = projectSphere(lat, lon, currentRadius * 0.9, innerRotationRef.current);
          linePoints.push(projected);
        }
        innerGridLines.push(linePoints);
      }

      // İç grid çizgilerini çiz
      innerGridLines.forEach((line) => {
        ctx.beginPath();
        let firstPoint = true;
        line.forEach((point) => {
          if (point.z > -currentRadius * 0.4) {
            const proj = project3D(point.x, point.y, point.z, currentRadius);
            if (firstPoint) {
              ctx.moveTo(proj.screenX, proj.screenY);
              firstPoint = false;
            } else {
              ctx.lineTo(proj.screenX, proj.screenY);
            }
          }
        });
        ctx.strokeStyle = "rgba(74, 144, 226, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // İç dünya noktaları
      innerNodes.forEach((node) => {
        const projected = projectSphere(
          node.lat,
          node.lon,
          currentRadius * 0.9,
          innerRotationRef.current
        );
        node.x = projected.x;
        node.y = projected.y;
        node.z = projected.z;

        if (projected.z > -currentRadius * 0.4) {
          const proj = project3D(projected.x, projected.y, projected.z, currentRadius);
          ctx.beginPath();
          ctx.arc(proj.screenX, proj.screenY, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(74, 144, 226, ${0.7 * (1 + projected.z / currentRadius)})`;
          ctx.fill();
        }
      });

      // Dış ağ noktalarını güncelle ve çiz
      outerNodes.forEach((node) => {
        // Dünyanın etrafında dön
        node.angle += 0.005 + node.vx * 0.01;
        node.height += node.vy * 0.5;

        // Dünyaya yaklaş (zoom ile)
        const targetDistance = currentRadius * (1.1 + Math.sin(elapsed * 2) * 0.1);
        node.distance = node.distance * 0.98 + targetDistance * 0.02;

        // 3D pozisyon hesapla
        const x = node.distance * Math.cos(node.angle + outerRotationRef.current);
        const y = node.distance * Math.sin(node.angle + outerRotationRef.current);
        const z = node.height;

        node.x = x;
        node.y = y;
        node.z = z;

        // Noktayı çiz
        if (z > -currentRadius * 0.5) {
          const proj = project3D(x, y, z, currentRadius * 1.5);
          ctx.beginPath();
          ctx.arc(proj.screenX, proj.screenY, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(74, 144, 226, ${0.8 * (1 + z / (currentRadius * 1.5))})`;
          ctx.fill();
        }
      });

      // Dış ağ bağlantıları (TechBackground tarzı)
      outerNodes.forEach((node, i) => {
        if (node.z > -currentRadius * 0.5) {
          outerNodes.slice(i + 1).forEach((otherNode) => {
            if (otherNode.z > -currentRadius * 0.5) {
              const dx = node.x - otherNode.x;
              const dy = node.y - otherNode.y;
              const dz = node.z - otherNode.z;
              const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

              // Yakın noktalar arasında bağlantı (daha geniş mesafe)
              if (distance < currentRadius * 0.9) {
                const nodeProj = project3D(node.x, node.y, node.z, currentRadius * 1.5);
                const otherProj = project3D(otherNode.x, otherNode.y, otherNode.z, currentRadius * 1.5);

                ctx.beginPath();
                ctx.moveTo(nodeProj.screenX, nodeProj.screenY);
                ctx.lineTo(otherProj.screenX, otherProj.screenY);
                const opacity = 0.3 * (1 - distance / (currentRadius * 0.9));
                ctx.strokeStyle = `rgba(74, 144, 226, ${opacity})`;
                ctx.lineWidth = 1;
                ctx.stroke();
              }
            }
          });
        }
      });

      // Küre çerçevesi
      ctx.beginPath();
      ctx.arc(0, 0, currentRadius * 0.9, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(74, 144, 226, 0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    startTimeRef.current = Date.now();
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.6s ease-out",
      }}
      className="globe-splash"
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}

