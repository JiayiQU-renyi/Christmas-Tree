import * as THREE from 'three';

// Configuration
export const TREE_PARAMS = {
  height: 35,      // Taller tree
  radius: 12,      // Wider base
  turns: 9,        // More spiral turns
  ribbonWidth: 3,  // Wider ribbons
  particleCount: 5500, // Denser particles
};

// Colors
export const COLORS = {
  TREE_GREEN: '#90EE90', // Light Green (LightGreen) - slightly brighter than before
  RIBBON_SILVER: '#E0E0E0',
  BELL_GOLD: '#FFD700',
  SOCK_RED: '#FF4500',
  SOCK_WHITE: '#FFFFFF',
  SNOW_WHITE: '#F0F8FF',
};

// Texture Generators
export const generateParticleTexture = (shape: 'snowflake' | 'circle' | 'star'): THREE.Texture => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();

  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = '#FFFFFF';

  const centerX = 64;
  const centerY = 64;

  if (shape === 'circle') {
    ctx.beginPath();
    ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'star') {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(
        Math.cos(((18 + i * 72) * Math.PI) / 180) * 50 + centerX,
        -Math.sin(((18 + i * 72) * Math.PI) / 180) * 50 + centerY
      );
      ctx.lineTo(
        Math.cos(((54 + i * 72) * Math.PI) / 180) * 20 + centerX,
        -Math.sin(((54 + i * 72) * Math.PI) / 180) * 20 + centerY
      );
    }
    ctx.fill();
  } else {
    // Snowflake (Default)
    ctx.translate(centerX, centerY);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 50);
      ctx.stroke();
      
      // Branches
      ctx.beginPath();
      ctx.moveTo(0, 25);
      ctx.lineTo(15, 35);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, 25);
      ctx.lineTo(-15, 35);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(10, 20);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(-10, 20);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};
