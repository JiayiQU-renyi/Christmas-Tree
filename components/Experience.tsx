import React, { useRef, useMemo, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles, Text, Hud, PerspectiveCamera, Image as DreiImage } from '@react-three/drei';
import * as THREE from 'three';
import { MagicParticles } from './MagicParticles';
import { AppState } from '../types';
import { TREE_PARAMS } from '../constants';

interface ExperienceProps extends AppState {}

// Top Star Component
const TopStar: React.FC<{ mode: 'tree' | 'snow' }> = ({ mode }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create a 5-pointed star shape
  const starGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 2.5;
    const innerRadius = 1.2;

    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.sin(angle) * radius;
      const y = Math.cos(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: 0.8,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.1,
      bevelSegments: 2,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  useMemo(() => {
    starGeometry.center();
  }, [starGeometry]);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Smooth Scale Animation: Disappear in snow mode, appear in tree mode
    const targetScale = mode === 'tree' ? 1 : 0;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 4);
    
    // Rotate
    groupRef.current.rotation.y += delta * 0.5;
    
    // Bobbing motion
    groupRef.current.position.y = (TREE_PARAMS.height / 2 + 1.5) + Math.sin(state.clock.elapsedTime * 1.5) * 0.2;
  });

  return (
    <group ref={groupRef} position={[0, TREE_PARAMS.height / 2 + 1.5, 0]}>
      <mesh geometry={starGeometry}>
        <meshStandardMaterial 
          color="#FFD700" 
          roughness={0.2} 
          metalness={1.0} 
          emissive="#FFD700"
          emissiveIntensity={0.2}
        />
      </mesh>
      <Sparkles count={20} scale={6} size={10} speed={0.4} opacity={1} color="#FFFFE0" />
      <pointLight distance={20} intensity={2.5} color="#FFD700" decay={2} />
    </group>
  );
};

// Handwritten Text Component with Gold Color
const MerryChristmasSign: React.FC<{ mode: 'tree' | 'snow' }> = ({ mode }) => {
  const textRef = useRef<any>(null);
  const lightsGroupRef = useRef<THREE.Group>(null);
  
  const opacityRef = useRef(0);
  const scaleRef = useRef(0);
  
  const lightsData = useMemo(() => {
    return new Array(40).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 16, 
      y: (Math.random() - 0.5) * 8, 
      z: (Math.random() - 0.5) * 5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.7
    }));
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const isSnow = mode === 'snow';
    
    // --- 1. Text Animation ---
    if (textRef.current && textRef.current.fillOpacity !== undefined) {
      const targetVal = isSnow ? 1 : 0;
      
      opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, targetVal, delta * 2.0);
      textRef.current.fillOpacity = opacityRef.current;

      scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetVal, delta * 2.5);
      textRef.current.scale.setScalar(scaleRef.current);
      
      textRef.current.position.y = Math.sin(time * 0.8) * 0.5;
    }

    // --- 2. Golden Lights Animation ---
    if (lightsGroupRef.current) {
      const targetScale = isSnow ? 1 : 0;

      lightsGroupRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const data = lightsData[i];
          if (data) {
             child.position.x = data.x + Math.sin(time * data.speed * 0.5 + data.phase) * 1.5;
             child.position.y = data.y + Math.cos(time * data.speed * 0.3 + data.phase) * 1.0;
             child.position.z = data.z + Math.sin(time * data.speed + data.phase) * 0.5;

             const currentScale = child.scale.x;
             const pulse = 1 + Math.sin(time * 3 + i) * 0.3;
             const desiredScale = targetScale * 0.25 * pulse; 
          
             const newScale = THREE.MathUtils.lerp(currentScale, desiredScale, delta * 3);
             child.scale.setScalar(newScale);
          }
        }
      });
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <Text
        ref={textRef}
        font="https://fonts.gstatic.com/s/cookie/v10/syky-y18lb0tSbf9kgqU.woff"
        fontSize={3} 
        maxWidth={40}
        lineHeight={1}
        letterSpacing={0.05}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        color="#FFD700"
        fillOpacity={0}
      >
        Merry Christmas
      </Text>
      
      <group ref={lightsGroupRef}>
        {lightsData.map((data, i) => (
          <mesh key={i} position={[data.x, data.y, data.z]} scale={[0,0,0]}>
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshBasicMaterial color="#FFD700" />
          </mesh>
        ))}
      </group>
      
      <pointLight position={[0, 0, 10]} intensity={0.5} color="#FFD700" decay={2} />
    </group>
  );
};

// Gallery Item Component - Individual Photo in the fan
const GalleryItem: React.FC<{ 
  url: string; 
  index: number; 
  total: number; 
  isOpen: boolean; 
  openedAt: number 
}> = ({ url, index, total, isOpen, openedAt }) => {
  const meshRef = useRef<THREE.Group>(null);
  const targetScale = useRef(0);
  
  // Calculate fan position
  const { posValues, rotValues } = useMemo(() => {
    // Fan Math
    const radius = 12;
    const maxSpread = 120 * (Math.PI / 180);
    const step = total > 1 ? Math.min(maxSpread / (total - 1), 20 * (Math.PI / 180)) : 0;
    const startAngle = - ((total - 1) * step) / 2;
    
    const angle = startAngle + index * step;
    
    // Pivot around center-bottom
    const x = Math.sin(angle) * radius;
    const y = Math.cos(angle) * 3 - 2; // Arcs slightly
    
    // Z-Position:
    // Strictly increasing Z to ensure visual sorting (Stack effect)
    // Higher index = Higher Z = Closer to camera = Draws on top
    // We remove the curve logic from Z to avoid self-occlusion issues.
    const z = index * 0.1; 
    
    // Rotate to face center
    const rotZ = -angle;
    
    // Return primitives to avoid strict mode freezing issues
    return { 
      posValues: [x, y, z] as [number, number, number], 
      rotValues: [0, 0, rotZ] as [number, number, number] 
    };
  }, [index, total]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Sequential Animation Logic
    const delay = index * 1000;
    const myStartTime = openedAt + delay;
    
    let active = false;
    if (isOpen) {
       if (Date.now() >= myStartTime) {
         active = true;
       }
    } else {
       active = false;
    }
    
    const desired = active ? 1 : 0;
    
    // Springy Lerp
    targetScale.current = THREE.MathUtils.lerp(targetScale.current, desired, delta * 6);
    
    meshRef.current.scale.setScalar(targetScale.current);
    
    // Add subtle floating when active
    const baseY = posValues[1];
    if (active) {
       meshRef.current.position.y = baseY + Math.sin(state.clock.elapsedTime * 2 + index) * 0.2;
    } else {
       meshRef.current.position.y = baseY;
    }
  });

  return (
    <group ref={meshRef} position={posValues} rotation={rotValues}>
       {/* Polaroid Frame */}
       <mesh position={[0, -0.4, -0.05]} renderOrder={index}>
         <boxGeometry args={[7, 8.5, 0.05]} />
         <meshBasicMaterial color="#ffffff" />
       </mesh>
       {/* Photo */}
       <DreiImage 
         url={url} 
         scale={[6, 6, 1]} 
         position={[0, 0.2, 0.05]}
         transparent
         renderOrder={index + 1}
       />
    </group>
  );
};

// New Component: Displays the uploaded photos in a fan
const PhotoGallery: React.FC<{ photos: string[]; isOpen: boolean }> = ({ photos, isOpen }) => {
  const [openedAt, setOpenedAt] = useState(0);

  // Capture the time when gallery opens
  useEffect(() => {
    if (isOpen) {
      setOpenedAt(Date.now());
    }
  }, [isOpen]);

  if (photos.length === 0) return null;

  return (
    <group position={[0, 1, 5]}> 
       {photos.map((url, i) => (
         <GalleryItem 
           key={`${i}-${url}`} 
           url={url} 
           index={i} 
           total={photos.length} 
           isOpen={isOpen}
           openedAt={openedAt}
         />
       ))}
    </group>
  );
};


export const Experience: React.FC<ExperienceProps> = (props) => {
  return (
    <div className="w-full h-screen bg-slate-900">
      <Canvas
        camera={{ position: [0, 5, 45], fov: 60 }} 
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#0f172a']} />
        
        {/* Environment */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Sparkles count={100} scale={40} size={4} speed={0.4} opacity={0.5} color="#fff" />

        {/* Lighting for Main Scene */}
        <ambientLight intensity={0.4} />
        <pointLight position={[20, 20, 20]} intensity={1} color="#ffaa00" />
        <pointLight position={[-20, 10, -20]} intensity={1} color="#00aaff" />
        <spotLight position={[0, 40, 0]} angle={0.4} penumbra={1} intensity={1.5} castShadow />

        {/* HUD Layer for Fixed Text AND Photos */}
        <Suspense fallback={null}>
          <Hud renderPriority={1}>
            <PerspectiveCamera makeDefault position={[0, 0, 30]} />
            <MerryChristmasSign mode={props.mode} />
            <PhotoGallery photos={props.uploadedPhotos} isOpen={props.isGalleryOpen} />
          </Hud>
        </Suspense>
        
        {/* Main 3D Scene Content */}
        <MagicParticles {...props} />
        <TopStar mode={props.mode} />

        {/* Interaction */}
        <OrbitControls 
          enablePan={false}
          minDistance={15}
          maxDistance={80}
          autoRotate={props.mode === 'tree'}
          autoRotateSpeed={0.5}
          target={[0, 5, 0]} 
        />
      </Canvas>
    </div>
  );
};