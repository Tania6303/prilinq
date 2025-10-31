const fs = require('fs');
const inputData = JSON.parse(fs.readFileSync('2511_input.txt', 'utf-8'));
const inputArray = inputData[0].input;

console.log('\n📋 1. התעודות שאמורות להיות (מה-INPUT):');
console.log('═'.repeat(60));

const docsList = inputArray.find(item => item.name === 'docs_list').value;
if (docsList && docsList.list_of_docs && docsList.list_of_docs.length > 0) {
    const docsStr = docsList.list_of_docs[0];
    const docs = JSON.parse(docsStr);
    
    console.log('\nרשימת תעודות מהמערכת:');
    docs.forEach((doc, i) => {
        console.log(`  ${i+1}. DOCNO: ${doc.DOCNO} | BOOKNUM: ${doc.BOOKNUM} | TOTQUANT: ${doc.TOTQUANT}`);
    });
}

console.log('\n\n🔍 2. מה יש ב-AZURE OCR UnidentifiedNumbers:');
console.log('═'.repeat(60));

const AZURE_RESULT = inputArray.find(item => item.name === 'AZURE_RESULT').value;
const unidentified = AZURE_RESULT.data.fields.UnidentifiedNumbers || [];

console.log('\nUnidentifiedNumbers מכיל:');
unidentified.forEach((item, i) => {
    console.log(`  ${i+1}. label: "${item.label}" | value: "${item.value}"`);
});

console.log('\n\n🔍 3. מה יש ב-AZURE_TEXT:');
console.log('═'.repeat(60));

const AZURE_TEXT = inputArray.find(item => item.name === 'AZURE_TEXT').value;

const docPattern = /25\d{6}/g;
const docMatches = AZURE_TEXT.match(docPattern);

console.log('\nמספרי תעודות (25XXXXXX) שנמצאו ב-AZURE_TEXT:');
if (docMatches) {
    const unique = [...new Set(docMatches)];
    unique.forEach((m, i) => {
        console.log(`  ${i+1}. ${m}`);
    });
} else {
    console.log('  ❌ לא נמצא');
}

const booknumPattern = /108\d{6}/g;
const booknumMatches = AZURE_TEXT.match(booknumPattern);

console.log('\nמספרי BOOKNUM (108XXXXXX) שנמצאו ב-AZURE_TEXT:');
if (booknumMatches) {
    const unique = [...new Set(booknumMatches)];
    unique.forEach((m, i) => {
        console.log(`  ${i+1}. ${m}`);
    });
} else {
    console.log('  ❌ לא נמצא');
}

console.log('\n\n📊 4. סיכום - איך הקוד אמור למצוא תעודות:');
console.log('═'.repeat(60));

console.log('\nמה שיש לקוד:');
console.log('  ✅ docs_list.list_of_docs - רשימת 4 תעודות מהמערכת');
console.log('  ❌ UnidentifiedNumbers - לא מכיל מספרי תעודות');
console.log('  ✅ AZURE_TEXT - מכיל BOOKNUM של כל 4 התעודות');

console.log('\nאיך הקוד צריך לעבוד:');
console.log('  1. הקוד מקבל רשימת תעודות מהמערכת (docs_list)');
console.log('  2. הקוד מחפש את מספרי BOOKNUM ב-UnidentifiedNumbers');
console.log('  3. אם לא מצא - הקוד מחפש ב-AZURE_TEXT');
console.log('  4. הקוד משווה לרשימה ויוצר PIVDOC_SUBFORM');

console.log('\n');
