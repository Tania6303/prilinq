const fs = require('fs');
const path = require('path');
const { processInvoiceComplete } = require('./v4.2-COMPLETE.js');

async function checkDocsIssue() {
    try {
        const inputPath = path.join(__dirname, 'QA', 'input.txt');
        const inputData = fs.readFileSync(inputPath, 'utf-8');
        const rawData = JSON.parse(inputData);
        const inputArray = rawData[0].input;

        const config = {};
        inputArray.forEach(item => {
            config[item.name] = item.value;
        });

        // Check structure
        const structure = config.learned_config.config.structure[0];
        console.log('\n📋 Structure Configuration:');
        console.log('═══════════════════════════════════════\n');
        console.log('  has_doc:', structure.has_doc);
        console.log('  has_import:', structure.has_import);
        console.log('  inventory_management:', structure.inventory_management);
        console.log('  debit_type:', structure.debit_type);

        // Check if docs exist in input
        const docsList = config.docs_list;
        console.log('\n📄 Docs List:');
        console.log('═══════════════════════════════════════\n');
        console.log('  DOC_YES_NO:', docsList ? docsList.DOC_YES_NO : 'N/A');
        console.log('  list_of_docs:', docsList && docsList.list_of_docs ? docsList.list_of_docs.length : 0, 'docs');

        if (docsList && docsList.list_of_docs && docsList.list_of_docs.length > 0) {
            console.log('\n  Sample docs:');
            docsList.list_of_docs.slice(0, 3).forEach((docStr, i) => {
                const doc = JSON.parse(docStr);
                console.log('    [' + i + '] BOOKNUM:', doc.BOOKNUM, '| DOCNO:', doc.DOCNO);
            });
        }

        // Run processing
        const result = await processInvoiceComplete(config);

        console.log('\n📦 Generated Invoice:');
        console.log('═══════════════════════════════════════\n');

        const invoice = result.invoice_data.PINVOICES[0];
        console.log('  BOOKNUM:', invoice.BOOKNUM);
        console.log('  Items count:', invoice.PINVOICEITEMS_SUBFORM ? invoice.PINVOICEITEMS_SUBFORM.length : 0);

        if (invoice.PINVOICEITEMS_SUBFORM && invoice.PINVOICEITEMS_SUBFORM.length > 0) {
            console.log('\n  Items:');
            invoice.PINVOICEITEMS_SUBFORM.forEach((item, i) => {
                console.log('    [' + i + '] PARTNAME:', item.PARTNAME, '| BOOKNUM:', item.BOOKNUM || 'N/A', '| PRICE:', item.PRICE);
            });
        }

        console.log('\n\n🔍 Analysis:');
        console.log('═══════════════════════════════════════\n');

        const hasDocs = docsList && docsList.list_of_docs && docsList.list_of_docs.length > 0;

        if (structure.has_doc && hasDocs) {
            if (invoice.PINVOICEITEMS_SUBFORM && invoice.PINVOICEITEMS_SUBFORM.length > 0) {
                const hasDocItems = invoice.PINVOICEITEMS_SUBFORM.some(item => item.BOOKNUM);
                if (hasDocItems) {
                    console.log('✅ CORRECT: Items link to DOCS via BOOKNUM');
                } else {
                    console.log('❌ PROBLEM: has_doc=true AND docs exist');
                    console.log('   → Items should link to DOCS via BOOKNUM field');
                    console.log('   → Items should NOT have PRICE/PDES details');
                }
            } else {
                console.log('⚠️  WARNING: has_doc=true but no items generated');
                console.log('   → Should generate items linking to DOCS');
            }
        } else if (!structure.has_doc) {
            console.log('ℹ️  has_doc=false - regular items with PRICE are correct');
        } else {
            console.log('ℹ️  No docs found - regular items are correct');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    }
}

checkDocsIssue();
