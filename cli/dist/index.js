#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs_1 = require("fs");
const parser_1 = require("./parser");
const renderer_1 = require("./renderer");
const program = new commander_1.Command();
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
        const mapText = (0, fs_1.readFileSync)(input, 'utf8');
        console.log('🔍 Parsing Wardley Map...');
        const parsedMap = parser_1.WardleyMapParser.parse(mapText);
        console.log(`🎨 Rendering PNG (${options.width}x${options.height})...`);
        const renderer = new renderer_1.WardleyMapRenderer(parseInt(options.width), parseInt(options.height));
        const pngBuffer = renderer.render(parsedMap);
        console.log(`💾 Saving to: ${options.output}`);
        (0, fs_1.writeFileSync)(options.output, pngBuffer);
        console.log(`✅ PNG created successfully!`);
        console.log(`📊 Map: "${parsedMap.title}"`);
        console.log(`📦 Components: ${parsedMap.components.length}`);
        console.log(`🔗 Connections: ${parsedMap.connections.length}`);
    }
    catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
program.parse();
