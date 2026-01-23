import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
console.log('Reading from:', envPath);
console.log('File exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    console.log('\n=== File Content ===');
    console.log(content);
    console.log('=== End Content ===\n');

    const lines = content.split('\n');
    console.log('Number of lines:', lines.length);

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=').trim();
            console.log(`Line ${index}: Key="${key.trim()}" Value="${value.substring(0, 50)}..."`);
        }
    });
}
