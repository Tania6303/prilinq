const fs = require('fs');
const path = require('path');
const { processInvoiceComplete } = require('./v4.2-COMPLETE.js');

// Monkey-patch to debug
const originalLog = console.log;
const logs = [];

console.log = function(...args) {
    const msg = args.join(' ');
    if (msg.includes('searchResults.documents') ||
        msg.includes('shouldAddItems') ||
        msg.includes('needItems') ||
        msg.includes('PIVDOC') ||
        msg.includes('PINVOICEITEMS')) {
        logs.push(msg);
    }
    originalLog.apply(console, args);
};

async function debugFullFlow() {
    try {
        const inputPath = path.join(__dirname, 'QA', '2511_input.txt');
        const inputData = fs.readFileSync(inputPath, 'utf-8');
        const rawData = JSON.parse(inputData);
        const inputArray = rawData[0].input;

        const config = {};
        inputArray.forEach(item => {
            config[item.name] = item.value;
        });

        originalLog('\n🔍 Debugging full flow for 2511...\n');

        // Check what docs are in input
        const docsList = config.docs_list;
        originalLog('📄 Input docs:');
        originalLog('  DOC_YES_NO:', docsList.DOC_YES_NO);
        originalLog('  list_of_docs:', docsList.list_of_docs ? docsList.list_of_docs.length : 0);

        if (docsList.list_of_docs && docsList.list_of_docs.length > 0) {
            const docs = JSON.parse(docsList.list_of_docs[0]);
            originalLog('  Parsed docs:', docs.length);
            docs.forEach((d, i) => {
                originalLog(`    [${i}] BOOKNUM: ${d.BOOKNUM}, DOCNO: ${d.DOCNO}`);
            });
        }

        originalLog('');

        // Check AZURE_RESULT for doc numbers
        const AZURE_RESULT = inputArray.find(item => item.name === 'AZURE_RESULT').value;
        const ocrFields = AZURE_RESULT.data.fields;
        const unidentified = ocrFields.UnidentifiedNumbers || [];

        originalLog('🔍 Searching for DOC numbers in OCR:');
        originalLog('  UnidentifiedNumbers count:', unidentified.length);

        const docPattern = /^25\d{6}$/;
        const foundDocs = [];

        unidentified.forEach((item, i) => {
            const value = typeof item === 'object' ? item.value : item;
            if (docPattern.test(value)) {
                foundDocs.push(value);
                originalLog(`    [${i}] Found DOC: ${value}`);
            }
        });

        originalLog('  Total DOC numbers found in OCR:', foundDocs.length);
        originalLog('');

        // Run processing
        originalLog('▶️  Running processInvoiceComplete...\n');
        const result = await processInvoiceComplete(config);

        originalLog('\n📦 Result:');
        const invoice = result.invoice_data.PINVOICES[0];
        originalLog('  PIVDOC_SUBFORM:', invoice.PIVDOC_SUBFORM ? `YES (${invoice.PIVDOC_SUBFORM.length} items)` : 'NO');
        originalLog('  PINVOICEITEMS_SUBFORM:', invoice.PINVOICEITEMS_SUBFORM ? `YES (${invoice.PINVOICEITEMS_SUBFORM.length} items)` : 'NO');

        if (invoice.PIVDOC_SUBFORM) {
            originalLog('\n  PIVDOC_SUBFORM contents:');
            invoice.PIVDOC_SUBFORM.forEach((doc, i) => {
                originalLog(`    [${i}] DOCNO: ${doc.DOCNO}, BOOKNUM: ${doc.BOOKNUM}`);
            });
        }

        originalLog('\n💡 Analysis:');
        if (!invoice.PIVDOC_SUBFORM && invoice.PINVOICEITEMS_SUBFORM) {
            originalLog('  ❌ searchResults.documents is probably EMPTY');
            originalLog('  → searchDocuments() didnt find the docs in OCR');
            originalLog('  → shouldAddItems returned TRUE (no docs found)');
            originalLog('  → Code created PINVOICEITEMS_SUBFORM instead');
        } else if (invoice.PIVDOC_SUBFORM && !invoice.PINVOICEITEMS_SUBFORM) {
            originalLog('  ✅ searchResults.documents found correctly');
            originalLog('  → shouldAddItems returned FALSE');
            originalLog('  → Code created PIVDOC_SUBFORM correctly');
        }

        originalLog('');

    } catch (error) {
        originalLog('\n❌ Error:', error.message);
        originalLog(error.stack);
    }
}

debugFullFlow();
