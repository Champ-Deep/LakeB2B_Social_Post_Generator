/**
 * Mascot Asset Optimization Script
 *
 * Compresses the large Gubey mascot images (7.5MB) to web-optimized
 * versions suitable for the floating button, avatar, and favicon.
 *
 * Run with: node scripts/optimize-mascot-assets.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Paths
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(PROJECT_ROOT, 'App mascot');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'mascot');

// Source files
const MAIN_MASCOT = path.join(SOURCE_DIR, 'Gubey.png');
const FAVICON_SOURCE = path.join(SOURCE_DIR, 'Gubey-favicon.png');

// Output configurations
const OUTPUT_CONFIGS = [
  {
    name: 'gubey-button.png',
    source: MAIN_MASCOT,
    width: 80,
    height: 80,
    format: 'png',
    compressionLevel: 9,
  },
  {
    name: 'gubey-button@2x.png',
    source: MAIN_MASCOT,
    width: 160,
    height: 160,
    format: 'png',
    compressionLevel: 9,
  },
  {
    name: 'gubey-button.webp',
    source: MAIN_MASCOT,
    width: 80,
    height: 80,
    format: 'webp',
    quality: 85,
  },
  {
    name: 'gubey-button@2x.webp',
    source: MAIN_MASCOT,
    width: 160,
    height: 160,
    format: 'webp',
    quality: 85,
  },
  {
    name: 'gubey-avatar.png',
    source: MAIN_MASCOT,
    width: 200,
    height: 200,
    format: 'png',
    compressionLevel: 9,
  },
  {
    name: 'gubey-avatar.webp',
    source: MAIN_MASCOT,
    width: 200,
    height: 200,
    format: 'webp',
    quality: 85,
  },
  {
    name: 'gubey-favicon-32.png',
    source: FAVICON_SOURCE,
    width: 32,
    height: 32,
    format: 'png',
    compressionLevel: 9,
  },
  {
    name: 'gubey-favicon-16.png',
    source: FAVICON_SOURCE,
    width: 16,
    height: 16,
    format: 'png',
    compressionLevel: 9,
  },
];

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Process a single image configuration
 */
async function processImage(config) {
  const outputPath = path.join(OUTPUT_DIR, config.name);

  try {
    // Check if source exists
    if (!fs.existsSync(config.source)) {
      console.error(`  Source not found: ${config.source}`);
      return null;
    }

    // Create sharp pipeline
    let pipeline = sharp(config.source)
      .resize(config.width, config.height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });

    // Apply format-specific options
    if (config.format === 'png') {
      pipeline = pipeline.png({
        compressionLevel: config.compressionLevel || 9,
        palette: true,
      });
    } else if (config.format === 'webp') {
      pipeline = pipeline.webp({
        quality: config.quality || 85,
        alphaQuality: 90,
      });
    }

    // Process and save
    await pipeline.toFile(outputPath);

    // Get file size
    const stats = fs.statSync(outputPath);
    return {
      name: config.name,
      size: stats.size,
      path: outputPath,
    };
  } catch (error) {
    console.error(`  Error processing ${config.name}:`, error.message);
    return null;
  }
}

/**
 * Main optimization function
 */
async function optimizeMascotAssets() {
  console.log('\n========================================');
  console.log('  Gubey Mascot Asset Optimization');
  console.log('========================================\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}\n`);
  }

  // Check source files
  console.log('Checking source files:');
  if (fs.existsSync(MAIN_MASCOT)) {
    const stats = fs.statSync(MAIN_MASCOT);
    console.log(`  Gubey.png: ${formatBytes(stats.size)}`);
  } else {
    console.error('  Gubey.png: NOT FOUND');
  }
  if (fs.existsSync(FAVICON_SOURCE)) {
    const stats = fs.statSync(FAVICON_SOURCE);
    console.log(`  Gubey-favicon.png: ${formatBytes(stats.size)}`);
  } else {
    console.error('  Gubey-favicon.png: NOT FOUND');
  }
  console.log('');

  // Process all images
  console.log('Optimizing assets:');
  const results = [];
  let totalSize = 0;

  for (const config of OUTPUT_CONFIGS) {
    process.stdout.write(`  Processing ${config.name}...`);
    const result = await processImage(config);

    if (result) {
      console.log(` ${formatBytes(result.size)}`);
      results.push(result);
      totalSize += result.size;
    } else {
      console.log(' FAILED');
    }
  }

  // Summary
  console.log('\n----------------------------------------');
  console.log('  Optimization Summary');
  console.log('----------------------------------------');
  console.log(`  Files created: ${results.length}/${OUTPUT_CONFIGS.length}`);
  console.log(`  Total size: ${formatBytes(totalSize)}`);
  console.log(`  Target: <50KB`);
  console.log(`  Status: ${totalSize < 50000 ? 'PASS' : 'NEEDS REVIEW'}`);
  console.log('');

  // List all created files
  console.log('Created files:');
  results.forEach((r) => {
    console.log(`  - ${r.name} (${formatBytes(r.size)})`);
  });
  console.log('');

  return results;
}

// Run if called directly
if (require.main === module) {
  optimizeMascotAssets()
    .then(() => {
      console.log('Done!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Optimization failed:', error);
      process.exit(1);
    });
}

module.exports = { optimizeMascotAssets };
