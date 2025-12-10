import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState } from '../types';
import { COLORS, generateParticleTexture, TREE_PARAMS } from '../constants';

interface MagicParticlesProps extends AppState {}

export const MagicParticles: React.FC<MagicParticlesProps> = ({
  mode,
  particleColor,
  particleShape,
  particleSize,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Generate Positions and Colors
  const { positions, snowPositions, colors, types } = useMemo(() => {
    const count = TREE_PARAMS.particleCount;
    const pos = new Float32Array(count * 3);
    const snowPos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const typeArr = new Uint8Array(count); // 0: Green, 1: Silver, 2: Gold, 3: Red, 4: White

    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      // --- Tree Spiral Logic ---
      const t = i / count; // Normalized progress 0 -> 1
      const angle = t * TREE_PARAMS.turns * Math.PI * 2;
      
      // Conical spiral
      const y = t * TREE_PARAMS.height - TREE_PARAMS.height / 2;
      // Start slightly wider at bottom, taper to almost 0
      const currentRadius = TREE_PARAMS.radius * (1 - t) + 0.1; 

      // Ribbon width spread (perpendicularish to spiral)
      const spreadX = (Math.random() - 0.5) * TREE_PARAMS.ribbonWidth * (1 - t * 0.5);
      const spreadY = (Math.random() - 0.5) * 1.5;
      const spreadZ = (Math.random() - 0.5) * TREE_PARAMS.ribbonWidth * (1 - t * 0.5);

      const x = (currentRadius + spreadX) * Math.cos(angle);
      const z = (currentRadius + spreadZ) * Math.sin(angle);
      
      // Store Tree Position
      pos[i * 3] = x;
      pos[i * 3 + 1] = y + spreadY;
      pos[i * 3 + 2] = z;

      // --- Snow Logic ---
      // Random box, make it taller for the bigger tree
      snowPos[i * 3] = (Math.random() - 0.5) * 50;
      snowPos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      snowPos[i * 3 + 2] = (Math.random() - 0.5) * 50;

      // --- Color/Type Logic ---
      // Determine what this particle represents
      let type = 0; // Default Green Tree
      const rand = Math.random();

      // Ribbon effect: A strip along the center of the path
      const isRibbon = Math.abs(spreadX) < 0.4 && Math.abs(spreadZ) < 0.4;
      
      if (isRibbon && rand > 0.4) {
        type = 1; // Silver Ribbon
        tempColor.set(COLORS.RIBBON_SILVER);
      } else if (rand > 0.96) {
        type = 2; // Gold Bell
        tempColor.set(COLORS.BELL_GOLD);
      } else if (rand > 0.94) {
        type = 3; // Red Sock part
        tempColor.set(COLORS.SOCK_RED);
      } else if (rand > 0.92) {
        type = 4; // White Sock part
        tempColor.set(COLORS.SOCK_WHITE);
      } else {
        type = 0; // Needle
        // Slight variation in green
        const greenVar = new THREE.Color(COLORS.TREE_GREEN);
        greenVar.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
        tempColor.copy(greenVar);
      }

      typeArr[i] = type;
      cols[i * 3] = tempColor.r;
      cols[i * 3 + 1] = tempColor.g;
      cols[i * 3 + 2] = tempColor.b;
    }

    return { positions: pos, snowPositions: snowPos, colors: cols, types: typeArr };
  }, []);

  // Current State Refs
  const currentPositions = useRef(new Float32Array(snowPositions)); 
  const velocities = useRef(new Float32Array(TREE_PARAMS.particleCount).fill(0).map(() => Math.random() * 0.15 + 0.05));

  // Update logic
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Texture Management
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    setTexture(generateParticleTexture(particleShape));
  }, [particleShape]);

  // Handle manual color override
  const baseTreeColor = useMemo(() => new THREE.Color(COLORS.TREE_GREEN), []);
  const userColor = useMemo(() => new THREE.Color(particleColor), [particleColor]);

  // Optimization: Pre-allocate color objects for the loop
  const tempColor = useMemo(() => new THREE.Color(), []);
  const snowColor = useMemo(() => new THREE.Color(COLORS.SNOW_WHITE), []);

  useFrame((state) => {
    // Safety check: ensure mesh is available
    if (!meshRef.current) return;

    // Double check instanceColor initialization
    if (!meshRef.current.instanceColor) {
      const count = TREE_PARAMS.particleCount;
      meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    }

    const time = state.clock.getElapsedTime();
    const count = TREE_PARAMS.particleCount;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      
      // Target Selection
      let tx, ty, tz;

      if (mode === 'tree') {
        // Spiral positions
        tx = positions[idx];
        ty = positions[idx + 1];
        tz = positions[idx + 2];

        // Add a gentle idle wave to the tree
        const wave = Math.sin(time * 2 + ty * 0.5) * 0.15;
        tx += wave;
        tz += wave;

      } else {
        // Snow mode: Physics fall
        // Update Y based on velocity
        let cy = currentPositions.current[idx + 1];
        cy -= velocities.current[i];
        
        // Reset to top if bottom hit
        if (cy < -25) {
           cy = 25;
           currentPositions.current[idx] = (Math.random() - 0.5) * 50; // New random X
           currentPositions.current[idx + 2] = (Math.random() - 0.5) * 50; // New random Z
        }
        
        // Add some wind/drift
        const wind = Math.sin(time + currentPositions.current[idx] * 0.5) * 0.03;
        currentPositions.current[idx] += wind;
        currentPositions.current[idx + 1] = cy;
        
        tx = currentPositions.current[idx];
        ty = currentPositions.current[idx + 1];
        tz = currentPositions.current[idx + 2];
      }

      // Lerp current position to target (smooth transition)
      // Faster lerp for responsiveness, slower for floaty feel
      const lerpFactor = mode === 'tree' ? 0.08 : 0.8; 
      
      currentPositions.current[idx] += (tx - currentPositions.current[idx]) * lerpFactor;
      currentPositions.current[idx + 1] += (ty - currentPositions.current[idx + 1]) * lerpFactor;
      currentPositions.current[idx + 2] += (tz - currentPositions.current[idx + 2]) * lerpFactor;

      dummy.position.set(
        currentPositions.current[idx],
        currentPositions.current[idx + 1],
        currentPositions.current[idx + 2]
      );

      // Rotate particles to face camera roughly or spin
      dummy.rotation.x = time * 0.5 + i;
      dummy.rotation.y = time * 0.3 + i;
      
      // Scale pulsing
      let scale = (Math.sin(time * 3 + i) * 0.2 + 1) * (particleSize / 5);
      if (types[i] > 0 && mode === 'tree') scale *= 2.0; // Make decorations larger and more visible
      
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Dynamic Color Mixing
      const type = types[i];
      if (mode === 'snow') {
        meshRef.current.setColorAt(i, snowColor);
      } else {
        if (type === 0) {
          // Tree body
           meshRef.current.setColorAt(i, userColor); 
        } else {
          // Ornaments
          tempColor.setRGB(colors[idx], colors[idx+1], colors[idx+2]);
          meshRef.current.setColorAt(i, tempColor);
        }
      }
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, TREE_PARAMS.particleCount]}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        alphaTest={0.01}
        opacity={1.0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};