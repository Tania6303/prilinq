const fs = require('fs');
const path = require('path');
const { processInvoiceComplete } = require('./v4.2-COMPLETE.js');

async function checkMissingFields() {
    try {
        const inputPath = path.join(__dirname, 'QA', 'input.txt');
        const inputData = fs.readFileSync(inputPath, 'utf-8');
        const rawData = JSON.parse(inputData);

        const inputArray = rawData[0].input;
        const config = {};
        inputArray.forEach(item => {
            config[item.name] = item.value;
        });

        const result = await processInvoiceComplete(config);

        console.log('\n📋 מה כבר נמצא ב-technical_config:');
        console.log('=====================================');
        const techKeys = Object.keys(result.technical_config);
        techKeys.forEach(key => {
            console.log(`✅ ${key}`);
        });

        console.log('\n\n❌ מה הוסר מהפלט:');
        console.log('=====================================');
        console.log('1. supplier_identification');
        console.log('   - supplier_code (כבר ב-technical_config ✓)');
        console.log('   - supplier_name (כבר ב-technical_config ✓)');
        console.log('   - identification_method (חסר!)');
        console.log('   - confidence (חסר!)');
        
        console.log('\n2. validation');
        console.log('   - בדיקות תקינות על החשבונית');
        console.log('   - אזהרות ושגיאות');
        
        console.log('\n3. learning_analysis');
        console.log('   - ניתוח מה שלמד');
        console.log('   - רכבים חדשים שהתגלו');
        
        console.log('\n4. execution_report');
        console.log('   - stage (באיזה שלב)');
        console.log('   - found (מה נמצא)');
        console.log('   - not_found (מה לא נמצא)');
        console.log('   - warnings (אזהרות)');
        console.log('   - errors (שגיאות)');
        
        console.log('\n5. metadata');
        console.log('   - ocr_invoice_id (חסר!)');
        console.log('   - ocr_invoice_date (חסר!)');
        console.log('   - ocr_total_amount (חסר!)');
        console.log('   - processing_timestamp (חסר!)');
        console.log('   - version (כבר ב-technical_config ✓)');

        console.log('\n\n❓ השאלה החשובה:');
        console.log('=====================================');
        console.log('האם הקוד הבא שלך יצטרך את המידע שהוסר?');
        console.log('לדוגמה:');
        console.log('- האם צריך לדעת אם יש שגיאות/אזהרות? (execution_report.errors)');
        console.log('- האם צריך לדעת מה נמצא ומה לא? (execution_report.found/not_found)');
        console.log('- האם צריך metadata כמו ocr_invoice_id, timestamp?');
        console.log('- האם צריך בדיקות validation?');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkMissingFields();
