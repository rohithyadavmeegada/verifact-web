"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface TrustSphere3DProps {
  score?: number;
  className?: string;
  size?: number;
}

export default function TrustSphere3D({ score = 75, className = "", size = 420 }: TrustSphere3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    // Check reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    // Check WebGL availability
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setWebGLSupported(false);
        return;
      }
    } catch (e) {
      setWebGLSupported(false);
      return;
    }

    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || size;
    const height = container.clientHeight || size;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5.2;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Outer Evidence Network Cage (Icosahedron)
    const icosahedronGeo = new THREE.IcosahedronGeometry(1.9, 2);
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const cage = new THREE.Mesh(icosahedronGeo, wireframeMat);
    scene.add(cage);

    // Inner Glowing Core (Sphere)
    const sphereGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const core = new THREE.Mesh(sphereGeo, coreMat);
    scene.add(core);

    // Floating Evidence Particle Nodes
    const particleCount = 140;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2.0 + Math.random() * 0.6;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Cyan to Violet color gradients
      colors[i * 3] = 0.1 + Math.random() * 0.3;     // R
      colors[i * 3 + 1] = 0.7 + Math.random() * 0.3; // G
      colors[i * 3 + 2] = 0.9 + Math.random() * 0.1; // B
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / width - 0.5) * 2;
      mouseY = -((event.clientY - rect.top) / height - 0.5) * 2;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse follow
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      const speedFactor = mediaQuery.matches ? 0 : 1;

      cage.rotation.y = elapsedTime * 0.15 * speedFactor + targetX * 0.4;
      cage.rotation.x = elapsedTime * 0.1 * speedFactor + targetY * 0.3;

      core.rotation.y = -elapsedTime * 0.25 * speedFactor + targetX * 0.2;
      core.rotation.x = -elapsedTime * 0.15 * speedFactor + targetY * 0.2;

      particles.rotation.y = elapsedTime * 0.08 * speedFactor;
      particles.rotation.z = elapsedTime * 0.05 * speedFactor;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      icosahedronGeo.dispose();
      wireframeMat.dispose();
      sphereGeo.dispose();
      coreMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, [size]);

  // CSS Fallback if WebGL is unavailable or reduced motion is preferred
  if (!webGLSupported) {
    return (
      <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-ping opacity-25" />
        <div className="w-48 h-48 rounded-full border-2 border-dashed border-cyan-400/50 animate-spin" style={{ animationDuration: "16s" }} />
        <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-cyan-600/30 to-blue-600/30 backdrop-blur-md border border-cyan-400/40 flex items-center justify-center">
          <div className="text-center">
            <span className="text-3xl font-bold text-cyan-300">{score}%</span>
            <p className="text-[11px] text-cyan-400/70 tracking-wider uppercase font-mono">Trust Index</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" style={{ width: size, height: size }} />
      {/* Central Hologram Score Badge */}
      <div className="absolute pointer-events-none flex flex-col items-center justify-center text-center">
        <div className="px-4 py-2 rounded-full glass-panel border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
          <span className="text-2xl font-black tracking-tight text-white font-mono">{score}</span>
          <span className="text-xs text-cyan-400 font-bold ml-1">/ 100</span>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Verified Score</p>
        </div>
      </div>
    </div>
  );
}
