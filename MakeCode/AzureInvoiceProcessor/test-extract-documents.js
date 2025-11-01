// ================================================================
// בדיקה פשוטה: האם extractDocumentNumbers() מזהה מספרי תעודות?
// ================================================================

const fs = require('fs');
const path = require('path');

// טען את הקוד של v2.0
const processorCode = fs.readFileSync(path.join(__dirname, 'v2.0(30.10.25)'), 'utf8');

// חלץ רק את הפונקציות שאנחנו צריכים
const extractCode = `
${processorCode.match(/function extractDocumentNumbers[\s\S]+?^}/m)[0]}
${processorCode.match(/function findContext[\s\S]+?^}/m)[0]}
${processorCode.match(/function isValueExists[\s\S]+?^}/m)[0]}
${processorCode.match(/function codeAlreadyFound[\s\S]+?^}/m)[0]}
`;

// הרץ את הקוד
eval(extractCode);

// טקסט לבדיקה - מכיל את 4 המספרים מספק 2511
const testText = `
חשבונית מספר: 12345
תאריך: 10/10/2024

תעודות משלוח:
1. תעודה 25026831 - הקצאה 108367755
2. תעודה 25026832 - הקצאה 108367753
3. תעודה 25026849 - הקצאה 108379736
4. תעודה 25026850 - הקצאה 108379734

סה"כ: 1,500 ש"ח
`;

console.log('=== בדיקת extractDocumentNumbers() ===\n');
console.log('טקסט לבדיקה:');
console.log(testText);
console.log('\n--- הרצת הפונקציה ---\n');

const result = extractDocumentNumbers(testText, {});

console.log(`✅ נמצאו ${result.length} מספרי תעודות:\n`);

result.forEach((doc, index) => {
    console.log(`${index + 1}. ${doc.label}: ${doc.value}`);
    console.log(`   הקשר: "${doc.context}"`);
    console.log('');
});

// בדיקה נגדית - חיפוש ידני
const docnoMatches = testText.match(/\b(25\d{6})\b/g) || [];
const booknumMatches = testText.match(/\b(108\d{6})\b/g) || [];

console.log('=== בדיקה נגדית (חיפוש ידני) ===');
console.log(`DOCNO (25XXXXXX): ${docnoMatches.join(', ')}`);
console.log(`BOOKNUM (108XXXXXX): ${booknumMatches.join(', ')}`);

// סיכום
console.log('\n=== סיכום ===');
if (result.length === docnoMatches.length + booknumMatches.length) {
    console.log('✅ הפונקציה עובדת! כל המספרים נמצאו.');
} else {
    console.log(`⚠️  נמצאו ${result.length} מתוך ${docnoMatches.length + booknumMatches.length} מספרים`);
}
