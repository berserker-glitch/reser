const fs = require('fs');

console.log('🎯 Fixing holiday date comparison...');

try {
  const filePath = 'frontend/src/components/admin/EnhancedCalendar.tsx';
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the holiday date comparison to handle datetime strings from API
  const oldPattern = /const foundHoliday = \(holidays as Holiday\[\]\)\.find\(h => h\.id === dateStr\);/g;
  
  const newCode = `const foundHoliday = (holidays as Holiday[]).find(h => {
      // Handle both date formats: "2025-01-01" and "2025-01-01T00:00:00.000000Z"
      const holidayDateStr = h.id.includes('T') ? h.id.split('T')[0] : h.id;
      return holidayDateStr === dateStr;
    });`;
  
  if (content.includes('h.id === dateStr')) {
    content = content.replace(oldPattern, newCode);
    fs.writeFileSync(filePath, content);
    console.log('✅ Holiday date comparison fixed!');
  } else {
    console.log('ℹ️ Holiday date comparison already appears to be fixed.');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
} 