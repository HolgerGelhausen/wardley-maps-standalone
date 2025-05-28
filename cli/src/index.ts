#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { WardleyMapParser } from './parser';
import { WardleyMapRenderer } from './renderer';

const program = new Command();

program
  .name('wardley-png')
  .description('Generate PNG images from Wardley Map files')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate PNG from Wardley Map file')
  .argument('<input>', 'Input Wardley Map file (.txt)')
  .option('-o, --output <file>', 'Output PNG file', 'wardley-map.png')
  .option('-w, --width <number>', 'Canvas width', '1400')
  .option('-h, --height <number>', 'Canvas height', '1000')
  .action((input, options) => {
    try {
      console.log(`📖 Reading Wardley Map from: ${input}`);
      const mapText = readFileSync(input, 'utf8');
      
      console.log('🔍 Parsing Wardley Map...');
      const parsedMap = WardleyMapParser.parse(mapText);
      
      console.log(`🎨 Rendering PNG (${options.width}x${options.height})...`);
      const renderer = new WardleyMapRenderer(
        parseInt(options.width), 
        parseInt(options.height)
      );
      
      const pngBuffer = renderer.render(parsedMap);
      
      console.log(`💾 Saving to: ${options.output}`);
      writeFileSync(options.output, pngBuffer);
      
      console.log(`✅ PNG created successfully!`);
      console.log(`📊 Map: "${parsedMap.title}"`);
      console.log(`📦 Components: ${parsedMap.components.length}`);
      console.log(`🔗 Connections: ${parsedMap.connections.length}`);
      
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();