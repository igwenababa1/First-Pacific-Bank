const fs = require('fs');
let content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

// Fix the "alert(s)" replacement mistake
content = content.replace(/addAdminToast\('info', 'System Notification', s\)/g, "alert(s)");

// Fix "Successfully" being marked as error
content = content.replace(/addAdminToast\('error', 'System Alert', (.*?Successfully.*?)\)/g, (match, p1) => {
    return `addAdminToast('success', 'System Notification', ${p1})`;
});

// Any other issues? Let's check "issued".
// "issued code" might have caused it. Let's find any error toasts that don't look like errors.
fs.writeFileSync('components/AdminDashboard.tsx', content);
