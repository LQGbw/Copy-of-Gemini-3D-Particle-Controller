import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { GestureType } from '../types';

interface ParticleSceneProps {
  currentGesture: GestureType;
  resetKey: number;
}

const Points = 'points' as any;
const BufferGeometry = 'bufferGeometry' as any;
const BufferAttribute = 'bufferAttribute' as any;
const PointsMaterial = 'pointsMaterial' as any;

const COUNT = 8000;

const Particles: React.FC<{ gesture: GestureType; resetKey: number }> = ({ gesture, resetKey }) => {
  const mesh = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const temp = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 3);
    const originalPos = new Float32Array(COUNT * 3);
    
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      const x = (Math.random() - 0.5) * 50;
      const y = (Math.random() - 0.5) * 30;
      const z = (Math.random() - 0.5) * 20;
      
      temp[i3] = x;
      temp[i3 + 1] = y;
      temp[i3 + 2] = z;
      
      originalPos[i3] = x;
      originalPos[i3 + 1] = y;
      originalPos[i3 + 2] = z;

      const mix = Math.random();
      if (mix < 0.4) {
        colors[i3] = 0.0; colors[i3 + 1] = 0.8; colors[i3 + 2] = 1.0;
      } else if (mix < 0.8) {
        colors[i3] = 0.8; colors[i3 + 1] = 0.1; colors[i3 + 2] = 1.0;
      } else {
        colors[i3] = 1.0; colors[i3 + 1] = 1.0; colors[i3 + 2] = 1.0;
      }
    }
    return { positions: temp, colors, velocities, originalPos };
  }, []);

  // 监听重置事件（包括手动点击和手势切换）
  useEffect(() => {
    if (!mesh.current) return;
    const positions = mesh.current.geometry.attributes.position.array as Float32Array;
    const { velocities, originalPos } = particles;
    
    for (let i = 0; i < COUNT * 3; i++) {
      positions[i] = originalPos[i];
      velocities[i] = 0;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  }, [resetKey, particles]);

  useFrame((state) => {
    if (!mesh.current) return;

    const positions = mesh.current.geometry.attributes.position.array as Float32Array;
    const colors = mesh.current.geometry.attributes.color.array as Float32Array;
    const { velocities, originalPos } = particles;
    const time = state.clock.getElapsedTime();

    const targetColor = new THREE.Color();
    let friction = 0.95;
    
    switch (gesture) {
      case GestureType.OpenPalm: targetColor.set(0x00ffff); break;
      case GestureType.ClosedFist: targetColor.set(0xff4400); friction = 0.90; break;
      case GestureType.Pointing: targetColor.set(0x00ff88); break;
      case GestureType.Victory: targetColor.set(0xff00ff); break;
      default: targetColor.set(0x4488ff); break;
    }

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      let x = positions[i3];
      let y = positions[i3 + 1];
      let z = positions[i3 + 2];
      let vx = velocities[i3];
      let vy = velocities[i3 + 1];
      let vz = velocities[i3 + 2];

      const ox = originalPos[i3];
      const oy = originalPos[i3 + 1];
      const oz = originalPos[i3 + 2];

      const distFromCenter = Math.sqrt(x*x + y*y + z*z);

      // 全局安全回收（防止粒子彻底消失）
      if (distFromCenter > 40) {
        vx += (ox - x) * 0.1;
        vy += (oy - y) * 0.1;
        vz += (oz - z) * 0.1;
      }

      const wave = Math.sin(x * 0.3 + time * 2) * Math.cos(z * 0.3 + time) * 1.5;

      if (gesture === GestureType.Pointing) {
        vx += 0.25;
        vy += (Math.sin(x * 0.8 + time * 5) * 2 - y) * 0.15;
        vz += (oz - z) * 0.15;
        
        if (x > 35) { 
          positions[i3] = -35; 
          x = -35;
          vx = 0;
        }
      } 
      else if (gesture === GestureType.OpenPalm) {
        const force = 1.2 / (distFromCenter + 1.0);
        // 限制爆发力，防止粒子飞太远
        if (distFromCenter < 25) {
          vx += (x / (distFromCenter + 0.1)) * force * 1.2;
          vy += (y / (distFromCenter + 0.1)) * force * 1.2;
          vz += (z / (distFromCenter + 0.1)) * force * 1.2;
        }
      } 
      else if (gesture === GestureType.ClosedFist) {
        // 握拳引力优化：增加向心力，减弱旋转力
        const pull = 0.04;
        vx -= x * pull; 
        vy -= y * pull; 
        vz -= z * pull;
        
        // 限制旋转力，防止粒子因离心力飞走
        const spin = 0.12;
        vx += z * spin; 
        vz -= x * spin;

        // 硬性边界：如果粒子在引力下仍然跑远，强力拉回
        if (distFromCenter > 15) {
           vx -= x * 0.05;
           vy -= y * 0.05;
           vz -= z * 0.05;
        }
      } 
      else if (gesture === GestureType.Victory) {
        const jump = Math.sin(x * 0.5 + time * 8) * 3.5;
        vy += (jump - y) * 0.2;
        vx += (ox - x) * 0.08;
        vz += (oz - z) * 0.08;
      } 
      else {
        vx += (ox - x) * 0.03;
        vy += (oy + wave - y) * 0.04;
        vz += (oz - z) * 0.03;
      }

      vx *= friction; vy *= friction; vz *= friction;

      positions[i3] = x + vx;
      positions[i3 + 1] = y + vy;
      positions[i3 + 2] = z + vz;
      velocities[i3] = vx;
      velocities[i3 + 1] = vy;
      velocities[i3 + 2] = vz;

      colors[i3] += (targetColor.r - colors[i3]) * 0.05;
      colors[i3 + 1] += (targetColor.g - colors[i3 + 1]) * 0.05;
      colors[i3 + 2] += (targetColor.b - colors[i3 + 2]) * 0.05;
    }

    mesh.current.geometry.attributes.position.needsUpdate = true;
    mesh.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <Points ref={mesh}>
      <BufferGeometry>
        <BufferAttribute
          attach="attributes-position"
          count={COUNT}
          array={particles.positions}
          itemSize={3}
        />
        <BufferAttribute
          attach="attributes-color"
          count={COUNT}
          array={particles.colors}
          itemSize={3}
        />
      </BufferGeometry>
      <PointsMaterial
        size={0.3}
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
};

export const ParticleScene: React.FC<ParticleSceneProps> = ({ currentGesture, resetKey }) => {
  return (
    <div className="w-full h-full absolute inset-0 bg-black">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 30]} fov={60} />
        <Particles gesture={currentGesture} resetKey={resetKey} />
      </Canvas>
    </div>
  );
};