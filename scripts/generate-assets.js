const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Colors from theme
const colors = {
  background: '#121212',
  primary: '#6CFF5A',
  text: '#9E9E9E',
};

// Create an SVG buffer
const createSVGBuffer = (width, height, content) => {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${colors.background}"/>
  ${content}
</svg>`);
};

// Generate icon (1024x1024)
async function generateIcon() {
  const size = 1024;
  const svg = createSVGBuffer(
    size,
    size,
    `<circle cx="${size/2}" cy="${size/2}" r="${size * 0.35}" fill="${colors.primary}" opacity="0.2"/>
     <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.25}" font-weight="bold" fill="${colors.primary}" text-anchor="middle" dominant-baseline="middle">OB</text>`
  );
  
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
  
  console.log('✓ Created icon.png (1024x1024)');
}

// Generate adaptive icon (1024x1024)
async function generateAdaptiveIcon() {
  const size = 1024;
  const svg = createSVGBuffer(
    size,
    size,
    `<rect x="${size * 0.2}" y="${size * 0.2}" width="${size * 0.6}" height="${size * 0.6}" rx="${size * 0.15}" fill="${colors.primary}"/>
     <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.2}" font-weight="bold" fill="${colors.background}" text-anchor="middle" dominant-baseline="middle">OB</text>`
  );
  
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(path.join(assetsDir, 'adaptive-icon.png'));
  
  console.log('✓ Created adaptive-icon.png (1024x1024)');
}

// Generate splash screen (1242x2436)
async function generateSplash() {
  const width = 1242;
  const height = 2436;
  const svg = createSVGBuffer(
    width,
    height,
    `<circle cx="${width/2}" cy="${height * 0.3}" r="${width * 0.15}" fill="${colors.primary}" opacity="0.2"/>
     <text x="50%" y="40%" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="${colors.primary}" text-anchor="middle" dominant-baseline="middle">Offerbound</text>
     <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" fill="${colors.text}" text-anchor="middle" dominant-baseline="middle">Accountability for Internship</text>
     <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="48" fill="${colors.text}" text-anchor="middle" dominant-baseline="middle">Applications</text>`
  );
  
  await sharp(svg)
    .resize(width, height)
    .png()
    .toFile(path.join(assetsDir, 'splash.png'));
  
  console.log('✓ Created splash.png (1242x2436)');
}

// Generate favicon (48x48)
async function generateFavicon() {
  const size = 48;
  const svg = createSVGBuffer(
    size,
    size,
    `<rect x="${size * 0.15}" y="${size * 0.15}" width="${size * 0.7}" height="${size * 0.7}" rx="${size * 0.2}" fill="${colors.primary}"/>
     <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="${colors.background}" text-anchor="middle" dominant-baseline="middle">OB</text>`
  );
  
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(path.join(assetsDir, 'favicon.png'));
  
  console.log('✓ Created favicon.png (48x48)');
}

// Main function
async function generateAllAssets() {
  console.log('Generating placeholder assets...\n');
  
  try {
    await generateIcon();
    await generateAdaptiveIcon();
    await generateSplash();
    await generateFavicon();
    
    console.log('\n✅ All assets generated successfully!');
    console.log('Assets are located in: ./assets/');
  } catch (error) {
    console.error('Error generating assets:', error);
    process.exit(1);
  }
}

generateAllAssets();
