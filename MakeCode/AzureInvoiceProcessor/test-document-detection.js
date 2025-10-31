// ================================================================
// בדיקת זיהוי מספרי תעודות ב-AzureInvoiceProcessor v2.0
// ================================================================

const fs = require('fs');
const path = require('path');

// דמה את input עבור AzureInvoiceProcessor
global.input = {
    azureJsonInput: null
};

// טען את 2511_input.txt
const inputPath = path.join(__dirname, '../Processing Invoice/QA/2511_input.txt');
const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// הכן את הקלט עבור AzureInvoiceProcessor
global.input.azureJsonInput = inputData.AZURE_RESULT;

console.log('=== בדיקת זיהוי מספרי תעודות ב-AzureInvoiceProcessor v2.0 ===\n');

// טען ורץ את AzureInvoiceProcessor
const processorCode = fs.readFileSync(path.join(__dirname, 'v2.0(30.10.25)'), 'utf8');
const wrappedCode = `(function() { ${processorCode} })()`;
const result = eval(wrappedCode);

console.log('1. סטטוס:', result.status);
console.log('2. מספר שדות:', result.metadata.totalFields);
console.log('3. מספר UnidentifiedNumbers:', result.metadata.uniqueDataFound);

// בדוק אם יש UnidentifiedNumbers
if (result.data.fields.UnidentifiedNumbers && result.data.fields.UnidentifiedNumbers.length > 0) {
    console.log('\n=== UnidentifiedNumbers שנמצאו: ===');

    const docs = result.data.fields.UnidentifiedNumbers.filter(item =>
        item.label && (item.label.includes('DOCNO') || item.label.includes('BOOKNUM'))
    );

    if (docs.length > 0) {
        console.log('\n✅ נמצאו מספרי תעודות:');
        docs.forEach((doc, index) => {
            console.log(`   ${index + 1}. ${doc.label}: ${doc.value}`);
            console.log(`      הקשר: ${doc.context.substring(0, 50)}...`);
        });
    } else {
        console.log('\n❌ לא נמצאו מספרי תעודות!');
        console.log('הראשונים 5 פריטים ב-UnidentifiedNumbers:');
        result.data.fields.UnidentifiedNumbers.slice(0, 5).forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.label}: ${item.value}`);
        });
    }
} else {
    console.log('\n❌ אין UnidentifiedNumbers כלל!');
}

// בדוק את AZURE_TEXT לוודא שהמספרים שם
console.log('\n=== בדיקה ידנית של AZURE_TEXT ===');
const azureText = inputData.AZURE_TEXT;
const docnoPattern = /\b(25\d{6})\b/g;
const booknumPattern = /\b(108\d{6})\b/g;

const docnoMatches = azureText.match(docnoPattern) || [];
const booknumMatches = azureText.match(booknumPattern) || [];

console.log(`נמצאו ${docnoMatches.length} DOCNO במקור: ${docnoMatches.join(', ')}`);
console.log(`נמצאו ${booknumMatches.length} BOOKNUM במקור: ${booknumMatches.join(', ')}`);

console.log('\n=== סיכום ===');
if (docs && docs.length > 0) {
    console.log('✅ הזיהוי עובד! מספרי תעודות נמצאו ב-UnidentifiedNumbers');
} else if (docnoMatches.length > 0 || booknumMatches.length > 0) {
    console.log('⚠️  המספרים קיימים ב-AZURE_TEXT אבל לא נזהו על ידי AzureInvoiceProcessor');
} else {
    console.log('❌ אין מספרי תעודות ב-AZURE_TEXT');
}
