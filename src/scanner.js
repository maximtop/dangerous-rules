import { promises as fs } from 'fs';
import path from 'path';

// Configurations
const config = {
    searchTerms: [/createElement/, /setAttribute/, /\.src/, /eval/],
    includePatterns: ['#%#', '#@%#'],
    excludePatterns: ['//scriptlet', '#%#var AG_abortInlineScript'],
    fileExtension: '.txt',
    excludeFileName: 'optimized',
};

// Function to check if a line matches the criteria
export function matchesLineCriteria(line) {
    const include = config.includePatterns.some((pattern) => line.includes(pattern));
    const exclude = config.excludePatterns.some((pattern) => line.includes(pattern));
    const searchTermMatch = config.searchTerms.some((regex) => regex.test(line));

    return include && !exclude && searchTermMatch;
}

async function searchInFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    let matchCount = 0;

    lines.forEach((line, index) => {
        if (matchesLineCriteria(line)) {
            if (matchCount === 0) {
                console.group(`\nMatches in ${filePath}:`);
            }
            console.log(`Line ${index + 1}: ${line.trim()}`);
            matchCount += 1;
        }
    });

    if (matchCount > 0) {
        console.log(`Total matches: ${matchCount}`);
        console.groupEnd();
    }
}

async function scanDirectory(directory) {
    const files = await fs.readdir(directory);

    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
            await scanDirectory(fullPath);
        } else if (fullPath.endsWith(config.fileExtension) && !fullPath.includes(config.excludeFileName)) {
            await searchInFile(fullPath);
        }
    }
}

export async function scanner() {
    const directoryToScan = process.argv[2]; // Get directory path from command line argument
    if (!directoryToScan) {
        console.error('Please provide a directory path.');
        process.exit(1);
    }

    try {
        console.log(`Scanning directory: ${directoryToScan}`);
        await scanDirectory(directoryToScan);
    } catch (error) {
        console.error('Error scanning directory:', error);
    }
}
