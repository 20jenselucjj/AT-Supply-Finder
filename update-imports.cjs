const fs = require('fs');
const path = require('path');

// Function to recursively get all .ts and .tsx files
function getAllTsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    
    if (stat && stat.isDirectory()) {
      // Skip node_modules and backup directories
      if (!file.includes('node_modules') && !file.includes('backup')) {
        results = results.concat(getAllTsFiles(file));
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  
  return results;
}

// Function to replace Supabase imports with Appwrite imports
function replaceSupabaseWithAppwrite(content) {
  // Replace import statements
  content = content.replace(
    /import\s+{[^}]*supabase[^}]*}\s+from\s+['"]@\/lib\/supabase['"];/g,
    "import { databases, account } from '@/lib/appwrite';"
  );
  
  content = content.replace(
    /import\s+{[^}]*supabaseAdmin[^}]*}\s+from\s+['"]@\/lib\/supabase['"];/g,
    "import { databases, account } from '@/lib/appwrite';"
  );
  
  content = content.replace(
    /import\s+{\s*supabase\s*}\s+from\s+['"]@\/lib\/supabase['"];/g,
    "import { databases, account } from '@/lib/appwrite';"
  );
  
  content = content.replace(
    /import\s+{\s*supabaseAdmin\s*}\s+from\s+['"]@\/lib\/supabase['"];/g,
    "import { databases, account } from '@/lib/appwrite';"
  );
  
  // Replace specific Supabase method calls with Appwrite equivalents
  // This is a simplified replacement - more complex logic would be needed for a complete migration
  content = content.replace(/supabase\.auth\.resetPasswordForEmail/g, 'account.createRecovery');
  
  return content;
}

// Main function
function main() {
  const srcDir = path.join(__dirname, 'src');
  const files = getAllTsFiles(srcDir);
  
  console.log(`Found ${files.length} TypeScript files to process`);
  
  let updatedFiles = 0;
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if file contains Supabase references
      if (content.includes('supabase') || content.includes('Supabase')) {
        console.log(`Processing file: ${file}`);
        
        const updatedContent = replaceSupabaseWithAppwrite(content);
        
        // Only write if content actually changed
        if (updatedContent !== content) {
          fs.writeFileSync(file, updatedContent, 'utf8');
          console.log(`  Updated: ${file}`);
          updatedFiles++;
        }
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error.message);
    }
  });
  
  console.log(`\nUpdated ${updatedFiles} files`);
}

main();