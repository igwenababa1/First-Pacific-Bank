const fs = require('fs');
let content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

// We have alerts with string literals or template literals.
// E.g., alert(`...`); or alert("...");
// Note that some alerts are error alerts. We can try to guess based on content if it's an error.
content = content.replace(/alert\((.*?(?:error|fail|Error|Failed|issue|must).*?)\);/gi, (match, p1) => {
    return `addAdminToast('error', 'System Alert', ${p1});`;
});

content = content.replace(/alert\((.*?)\);/g, (match, p1) => {
    // If it's already a toast or log, skip.
    if(p1.includes("deleteAlertConfirmModal")) return match;
    return `addAdminToast('info', 'System Notification', ${p1});`;
});

fs.writeFileSync('components/AdminDashboard.tsx', content);
