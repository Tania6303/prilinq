// ================================================================
// בדיקה: סינון VIN מזויף (תאריכים שמתחילים ב-202X)
// ================================================================

const fs = require('fs');
const path = require('path');

// טען את הקוד
const processorCode = fs.readFileSync(path.join(__dirname, 'v2.0(30.10.25)'), 'utf8');

// חלץ את הפונקציות
const extractCode = `
${processorCode.match(/function extractSpecialLengthNumbers[\s\S]+?^}/m)[0]}
${processorCode.match(/function findAllNumbers[\s\S]+?^}/m)[0]}
${processorCode.match(/function findContext[\s\S]+?^}/m)[0]}
${processorCode.match(/function isValueExists[\s\S]+?^}/m)[0]}
`;

eval(extractCode);

const testText = `
חשבונית מספר: 12345
מס׳ הקצאה: 301086521 20251028104848545
VIN אמיתי: WBADT43452GZ12345
מספר אסמכתא: 1234567890123
`;

console.log('=== בדיקת סינון VIN ===\n');
console.log('טקסט לבדיקה:');
console.log(testText);
console.log('\n--- הרצת הפונקציה ---\n');

const result = extractSpecialLengthNumbers(testText, {});

console.log(`נמצאו ${result.length} מספרים:\n`);

result.forEach((item, index) => {
    console.log(`${index + 1}. ${item.label}: ${item.value}`);
});

console.log('\n=== בדיקה נגדית ===');
const pattern17 = /\b(\d{17})\b/g;
const all17 = testText.match(pattern17) || [];
console.log(`סה"כ מספרים בני 17 ספרות בטקסט: ${all17.length}`);
all17.forEach(num => {
    if (num.startsWith('202')) {
        console.log(`  ❌ ${num} - מתחיל ב-202 (תאריך) - צריך להיסנן`);
    } else {
        console.log(`  ✅ ${num} - לא מתחיל ב-202 - VIN תקין`);
    }
});

console.log('\n=== סיכום ===');
const has2025 = result.find(r => r.value.startsWith('2025'));
if (has2025) {
    console.log('❌ הסינון לא עובד - עדיין יש מספרי תאריך');
} else {
    console.log('✅ הסינון עובד! מספרי תאריך לא נכללים');
}
