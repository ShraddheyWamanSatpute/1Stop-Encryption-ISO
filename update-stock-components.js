#!/usr/bin/env node
/**
 * Automated Stock Components Update Script
 * 
 * This script updates all stock components to use the new dataVersion tracking system.
 * 
 * Usage: node update-stock-components.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const STOCK_COMPONENTS_DIR = './src/frontend/components/stock';
const STOCK_FORMS_DIR = './src/frontend/components/stock/forms';

// Patterns to update
const updates = {
  // 1. Add dataVersion and loading to destructured state
  addDataVersionToState: {
    pattern: /const\s+{\s+([^}]+)\s+}\s+=\s+state/g,
    transform: (match, vars) => {
      if (vars.includes('dataVersion') || vars.includes('loading')) {
        return match; // Already includes it
      }
      const trimmedVars = vars.trim();
      const newVars = trimmedVars.endsWith(',') 
        ? `${trimmedVars} dataVersion, loading` 
        : `${trimmedVars}, dataVersion, loading`;
      return `const { ${newVars} } = state`;
    }
  },

  // 2. Add dataVersion to useEffect dependencies
  addDataVersionToUseEffect: {
    pattern: /(useEffect\s*\([^,]+,\s*\[)([^\]]+)(\]\))/g,
    transform: (match, prefix, deps, suffix) => {
      if (deps.includes('dataVersion')) {
        return match; // Already includes it
      }
      // Check if dependencies include state properties that would need dataVersion
      const needsDataVersion = /state\.products|state\.suppliers|state\.measures|state\.categories|products|suppliers|measures|categories/.test(deps);
      if (needsDataVersion) {
        const newDeps = deps.trim().endsWith(',') 
          ? `${deps} dataVersion` 
          : `${deps}, dataVersion`;
        return `${prefix}${newDeps}${suffix}`;
      }
      return match;
    }
  },

  // 3. Add dataVersion to useMemo dependencies
  addDataVersionToUseMemo: {
    pattern: /(useMemo\s*\([^,]+,\s*\[)([^\]]+)(\]\))/g,
    transform: (match, prefix, deps, suffix) => {
      if (deps.includes('dataVersion')) {
        return match; // Already includes it
      }
      // Check if dependencies include state properties
      const needsDataVersion = /state\.products|state\.suppliers|state\.measures|state\.categories|products|suppliers|measures|categories|items|data/.test(deps);
      if (needsDataVersion) {
        const newDeps = deps.trim().endsWith(',') 
          ? `${deps} dataVersion` 
          : `${deps}, dataVersion`;
        return `${prefix}${newDeps}${suffix}`;
      }
      return match;
    }
  },

  // 4. Add dataVersion to useCallback dependencies
  addDataVersionToUseCallback: {
    pattern: /(useCallback\s*\([^,]+,\s*\[)([^\]]+)(\]\))/g,
    transform: (match, prefix, deps, suffix) => {
      if (deps.includes('dataVersion')) {
        return match; // Already includes it
      }
      // Check if dependencies include state properties
      const needsDataVersion = /state\.products|state\.suppliers|state\.measures|state\.categories|products|suppliers|measures|categories/.test(deps);
      if (needsDataVersion) {
        const newDeps = deps.trim().endsWith(',') 
          ? `${deps} dataVersion` 
          : `${deps}, dataVersion`;
        return `${prefix}${newDeps}${suffix}`;
      }
      return match;
    }
  },
};

// Helper function to add loading overlay
function addLoadingOverlay(content, framework = 'mui') {
  // Check if loading overlay already exists
  if (content.includes('Loading overlay') || content.includes('Refreshing data...')) {
    return content;
  }

  if (framework === 'mui') {
    // MUI version
    const loadingOverlay = `      {/* Loading overlay - doesn't hide content */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            bgcolor: 'info.light',
            borderRadius: 1,
            boxShadow: 2,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            Refreshing data... (v{dataVersion})
          </Typography>
        </Box>
      )}
      
`;

    // Find the main return statement and add overlay
    const returnPattern = /return\s*\(\s*<Box([^>]*)>/;
    const match = content.match(returnPattern);
    
    if (match) {
      // Add position: relative to Box if not already there
      let boxProps = match[1];
      if (!boxProps.includes('position')) {
        boxProps = boxProps.includes('sx={{') 
          ? boxProps.replace('sx={{', "sx={{ position: 'relative',")
          : boxProps + " sx={{ position: 'relative' }}";
      }
      
      const replacement = `return (
    <Box${boxProps}>
${loadingOverlay}`;
      
      content = content.replace(returnPattern, replacement);
    }
  }

  return content;
}

// Helper function to add opacity effect to tables/containers
function addOpacityEffect(content) {
  // TableContainer pattern for MUI
  content = content.replace(
    /<TableContainer([^>]*)sx=\{\{([^}]+)\}\}/g,
    (match, attrs, styles) => {
      if (styles.includes('opacity')) {
        return match;
      }
      const newStyles = `${styles.trim().replace(/,$/, '')}, opacity: loading ? 0.7 : 1, transition: 'opacity 0.3s'`;
      return `<TableContainer${attrs}sx={{ ${newStyles} }}`;
    }
  );

  // For components without sx prop
  content = content.replace(
    /<TableContainer([^>]*)component={Paper}([^>]*?)>/g,
    (match, before, after) => {
      if (match.includes('sx={{') || match.includes('opacity')) {
        return match;
      }
      return `<TableContainer${before}component={Paper}${after} sx={{ opacity: loading ? 0.7 : 1, transition: 'opacity 0.3s' }}>`;
    }
  );

  return content;
}

// Process a single file
function processFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Skip if already has dataVersion in imports or state
    if (content.includes('// UPDATED: dataVersion tracking')) {
      console.log(`  ✓ Already updated, skipping`);
      return;
    }

    // Apply all update patterns
    for (const [name, update] of Object.entries(updates)) {
      const originalContent = content;
      
      if (update.pattern && update.transform) {
        content = content.replace(update.pattern, update.transform);
      }
      
      if (content !== originalContent) {
        console.log(`  ✓ Applied: ${name}`);
        modified = true;
      }
    }

    // Add loading overlay
    const beforeOverlay = content;
    content = addLoadingOverlay(content);
    if (content !== beforeOverlay) {
      console.log(`  ✓ Added loading overlay`);
      modified = true;
    }

    // Add opacity effects
    const beforeOpacity = content;
    content = addOpacityEffect(content);
    if (content !== beforeOpacity) {
      console.log(`  ✓ Added opacity effects`);
      modified = true;
    }

    // Add marker comment at top if modified
    if (modified) {
      content = content.replace(
        /("use client"|'use client')\n/,
        `$1\n// UPDATED: dataVersion tracking for automatic UI updates\n`
      );

      // Write back to file
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ Updated successfully\n`);
    } else {
      console.log(`  ⏭️  No changes needed\n`);
    }

  } catch (error) {
    console.error(`  ❌ Error processing file: ${error.message}\n`);
  }
}

// Get all TypeScript/TSX files in a directory
function getFiles(dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return files;
  }

  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Recursively get files from subdirectories
      files.push(...getFiles(fullPath));
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
function main() {
  console.log('🚀 Stock Components Update Script\n');
  console.log('This script will update all stock components to use dataVersion tracking.\n');

  // Get all files
  const files = [
    ...getFiles(STOCK_COMPONENTS_DIR),
  ];

  console.log(`Found ${files.length} files to process\n`);
  console.log('─'.repeat(60) + '\n');

  // Process each file
  files.forEach(processFile);

  console.log('─'.repeat(60));
  console.log('\n✅ Update complete!\n');
  console.log('Next steps:');
  console.log('1. Review the changes in each file');
  console.log('2. Test the components to ensure they update properly');
  console.log('3. Check for any TypeScript errors');
  console.log('4. Run your test suite');
  console.log('\nSee STOCK_COMPONENTS_UPDATE.md for detailed patterns and examples.\n');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { processFile, addLoadingOverlay, addOpacityEffect };

