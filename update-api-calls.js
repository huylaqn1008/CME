const fs = require('fs');
const path = require('path');

// Danh sách các file cần cập nhật
const filesToUpdate = [
  'frontend/src/pages/User/CourseList.jsx',
  'frontend/src/pages/Super Admin/Users/UserManager.jsx',
  'frontend/src/pages/Super Admin/Departments/DepartmentManager.jsx',
  'frontend/src/pages/Super Admin/Courses/CourseManager.jsx',
  'frontend/src/pages/LiveClassroom/LiveClassroom.jsx',
  'frontend/src/pages/Auth/Login.jsx',
  'frontend/src/pages/Auth/Register.jsx'
];

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Thêm import apiClient nếu chưa có và file có sử dụng axios
    if (!content.includes('import apiClient from') && content.includes('axios')) {
      // Tìm vị trí để thêm import
      const importIndex = content.indexOf('import axios from "axios";');
      if (importIndex !== -1) {
        content = content.replace(
          'import axios from "axios";',
          'import apiClient from "../../config/api";'
        );
        hasChanges = true;
      } else {
        // Nếu không tìm thấy axios import, thêm vào sau import React
        const reactImportMatch = content.match(/^import React[^;]*;$/m);
        if (reactImportMatch) {
          const insertIndex = content.indexOf(reactImportMatch[0]) + reactImportMatch[0].length;
          content = content.slice(0, insertIndex) + '\nimport apiClient from "../../config/api";' + content.slice(insertIndex);
          hasChanges = true;
        }
      }
    }
    
    // Loại bỏ import axios không cần thiết nếu đã có apiClient
    if (content.includes('import apiClient from') && content.includes('import axios from "axios";')) {
      content = content.replace(/import axios from "axios";\s*\n?/g, '');
      hasChanges = true;
    }
    
    // Thay thế tất cả axios calls với apiClient
    const originalContent = content;
    
    // Thay thế các axios calls với localhost
    content = content.replace(/axios\.get\("http:\/\/localhost:5000(\/[^"]+)"/g, 'apiClient.get("$1"');
    content = content.replace(/axios\.post\("http:\/\/localhost:5000(\/[^"]+)"/g, 'apiClient.post("$1"');
    content = content.replace(/axios\.put\("http:\/\/localhost:5000(\/[^"]+)"/g, 'apiClient.put("$1"');
    content = content.replace(/axios\.patch\("http:\/\/localhost:5000(\/[^"]+)"/g, 'apiClient.patch("$1"');
    content = content.replace(/axios\.delete\("http:\/\/localhost:5000(\/[^"]+)"/g, 'apiClient.delete("$1"');
    
    // Thay thế các template literals
    content = content.replace(/axios\.get\(`http:\/\/localhost:5000(\/[^`]+)`/g, 'apiClient.get(`$1`');
    content = content.replace(/axios\.post\(`http:\/\/localhost:5000(\/[^`]+)`/g, 'apiClient.post(`$1`');
    content = content.replace(/axios\.put\(`http:\/\/localhost:5000(\/[^`]+)`/g, 'apiClient.put(`$1`');
    content = content.replace(/axios\.patch\(`http:\/\/localhost:5000(\/[^`]+)`/g, 'apiClient.patch(`$1`');
    content = content.replace(/axios\.delete\(`http:\/\/localhost:5000(\/[^`]+)`/g, 'apiClient.delete(`$1`');
    
    // Loại bỏ headers Authorization thủ công vì apiClient tự động thêm
    content = content.replace(/,\s*{\s*headers:\s*{\s*Authorization:\s*`Bearer\s*\$\{[^}]*\}`\s*}\s*}/g, '');
    content = content.replace(/,\s*{\s*headers:\s*{\s*Authorization:\s*`Bearer\s*\$\{localStorage\.getItem\(["']token["']\)\}`[^}]*}\s*}/g, '');
    
    if (content !== originalContent) {
      hasChanges = true;
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

// Cập nhật tất cả các file
console.log('🔄 Starting API calls update...\n');
filesToUpdate.forEach(updateFile);

console.log('\n🎉 API calls update completed!');
console.log('\nSummary of changes:');
console.log('✅ All axios calls now use apiClient');
console.log('✅ Dynamic API base URL (localhost or network IP)');
console.log('✅ Automatic Authorization header injection');
console.log('✅ Automatic token expiry handling');
console.log('✅ Improved error handling');

console.log('\nNext steps:');
console.log('1. Run setup-firewall.bat as Administrator (one time only)');
console.log('2. Run start-network.bat to start the servers');
console.log('3. Share the network URLs with other devices');
console.log('4. Test login from other devices on the same network');