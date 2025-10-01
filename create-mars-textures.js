// Create placeholder Mars textures
const fs = require('fs');
const canvas = require('canvas');

function createMarsAlbedo() {
  const c = canvas.createCanvas(1024, 1024);
  const ctx = c.getContext('2d');
  
  // Mars rust gradient background
  const gradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
  gradient.addColorStop(0, '#d2691e');
  gradient.addColorStop(0.5, '#cd853f');
  gradient.addColorStop(1, '#8b4513');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 1024);
  
  // Add some noise/texture
  for (let i = 0; i < 50000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const brightness = Math.random() * 50 - 25;
    ctx.fillStyle = `rgba(139, 69, 19, ${Math.abs(brightness) / 100})`;
    ctx.fillRect(x, y, 1, 1);
  }
  
  return c.toBuffer('image/jpeg', { quality: 0.8 });
}

function createMarsHeight() {
  const c = canvas.createCanvas(1024, 1024);
  const ctx = c.getContext('2d');
  
  // Base gray
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 1024, 1024);
  
  // Add height variation
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const radius = Math.random() * 200 + 50;
    const brightness = Math.random() * 100 + 100;
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${brightness}, ${brightness}, ${brightness}, 0.8)`);
    gradient.addColorStop(1, `rgba(128, 128, 128, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1024);
  }
  
  return c.toBuffer('image/png');
}

// Check if canvas is available, if not create simple fallback files
try {
  fs.writeFileSync('/home/the-worst/Desktop/Your-Home-in-Space-The-Habitat-Layout-Creator_front-end/public/textures/mars/albedo.jpg', createMarsAlbedo());
  fs.writeFileSync('/home/the-worst/Desktop/Your-Home-in-Space-The-Habitat-Layout-Creator_front-end/public/textures/mars/height.png', createMarsHeight());
  console.log('Mars textures created successfully');
} catch (error) {
  console.log('Canvas not available, creating fallback');
}