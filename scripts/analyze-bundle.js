#!/usr/bin/env node

// Script to analyze bundle sizes and identify large chunks
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 Analyzing bundle sizes...\n');

try {
  // Run build with bundle analyzer
  console.log('📦 Building project with bundle analysis...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Check dist folder for large files
  const distPath = path.join(process.cwd(), 'dist');
  const assetsPath = path.join(distPath, 'assets');
  
  if (fs.existsSync(assetsPath)) {
    const files = fs.readdirSync(assetsPath);
    const jsFiles = files.filter(file => file.endsWith('.js'));
    
    console.log('\n📊 Bundle Analysis Results:');
    console.log('==========================');
    
    let totalSize = 0;
    const largeFiles = [];
    
    jsFiles.forEach(file => {
      const filePath = path.join(assetsPath, file);
      const stats = fs.statSync(filePath);
      const sizeInKB = Math.round(stats.size / 1024);
      totalSize += stats.size;
      
      // Highlight files larger than 100KB
      if (sizeInKB > 100) {
        largeFiles.push({ file, size: sizeInKB });
      }
      
      console.log(`${file}: ${sizeInKB}KB`);
    });
    
    console.log(`\n📈 Total JavaScript bundle size: ${Math.round(totalSize / 1024)}KB`);
    
    if (largeFiles.length > 0) {
      console.log('\n⚠️  Large files (>100KB):');
      largeFiles.forEach(({ file, size }) => {
        console.log(`  - ${file}: ${size}KB`);
      });
    }
    
    console.log('\n✅ Bundle analysis complete!');
  } else {
    console.log('❌ Dist folder not found. Please run npm run build first.');
  }
} catch (error) {
  console.error('❌ Error during bundle analysis:', error.message);
  process.exit(1);
}