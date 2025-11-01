const fs = require('fs');

console.log('\n🔍 ניתוח בעיית התעודות - ספק 2511');
console.log('═'.repeat(70));

const inputData = JSON.parse(fs.readFileSync('2511_input.txt', 'utf-8'));
const inputArray = inputData[0].input;

// 1. מה המערכת מצפה
const docsList = inputArray.find(item => item.name === 'docs_list').value;
const expectedDocs = JSON.parse(docsList.list_of_docs[0]);

console.log('\n1️⃣ מה המערכת מצפה למצוא:');
console.log('   (מ-docs_list שבא מפריוריטי)');
console.log('   ─'.repeat(70));
expectedDocs.forEach((doc, i) => {
    console.log(`   ${i+1}. DOCNO: ${doc.DOCNO} | BOOKNUM: ${doc.BOOKNUM}`);
});

// 2. מה AZURE_RESULT מכיל
const AZURE_RESULT = inputArray.find(item => item.name === 'AZURE_RESULT').value;
const unidentified = AZURE_RESULT.data.fields.UnidentifiedNumbers || [];

console.log('\n2️⃣ מה AZURE_RESULT.UnidentifiedNumbers מכיל:');
console.log('   ─'.repeat(70));
if (unidentified.length === 0) {
    console.log('   ❌ ריק לגמרי!');
} else {
    unidentified.forEach((item, i) => {
        console.log(`   ${i+1}. "${item.value}" (label: "${item.label}")`);
    });

    // בדוק אם יש BOOKNUM
    const hasBooknum = unidentified.some(item => {
        const val = item.value;
        return /^108\d{6}$/.test(val);
    });

    const status = hasBooknum ? 'כן' : 'לא';
    console.log(`\n   ❌ מכיל BOOKNUM של תעודות? ${status}`);
}

// 3. מה AZURE_TEXT מכיל
const AZURE_TEXT = inputArray.find(item => item.name === 'AZURE_TEXT').value;

const booknumPattern = /108\d{6}/g;
const booknumsInText = [...new Set(AZURE_TEXT.match(booknumPattern) || [])];

console.log('\n3️⃣ מה AZURE_TEXT מכיל:');
console.log('   ─'.repeat(70));
if (booknumsInText.length === 0) {
    console.log('   ❌ לא נמצא BOOKNUM');
} else {
    console.log(`   ✅ נמצאו ${booknumsInText.length} BOOKNUM ב-AZURE_TEXT:`);
    booknumsInText.forEach((num, i) => {
        const match = expectedDocs.find(d => d.BOOKNUM === num);
        if (match) {
            console.log(`   ${i+1}. ${num} ✅ תואם ל-DOCNO: ${match.DOCNO}`);
        } else {
            console.log(`   ${i+1}. ${num} ⚠️  לא תואם לרשימה`);
        }
    });
}

console.log('\n\n📋 סיכום הבעיה:');
console.log('═'.repeat(70));
console.log('❌ AZURE_RESULT.UnidentifiedNumbers לא מכיל את מספרי BOOKNUM של התעודות');
console.log('✅ AZURE_TEXT כן מכיל את כל 4 מספרי BOOKNUM');
console.log('\nהסיבה: הקוד ב-AzureInvoiceProcessor לא מזהה נכון מספרי תעודות');
console.log('         ולא מוסיף אותם ל-UnidentifiedNumbers');

console.log('\n\n💡 פתרון נדרש:');
console.log('═'.repeat(70));
console.log('1. קוד נוכחי (v4.2-COMPLETE.js):');
console.log('   → אם לא נמצאו תעודות ב-UnidentifiedNumbers');
console.log('   → חפש fallback ב-AZURE_TEXT');
console.log('   → אם גם שם לא נמצא - החזר JSON חלקי + דוח שגיאה');
console.log('');
console.log('2. קוד קודם (AzureInvoiceProcessor v2.0):');
console.log('   → תקן את הזיהוי של מספרי תעודות');
console.log('   → הוסף אותם ל-UnidentifiedNumbers');
console.log('');
