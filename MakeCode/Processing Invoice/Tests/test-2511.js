const fs = require('fs');
const path = require('path');
const { processInvoiceComplete } = require('./v4.2-COMPLETE.js');

async function test2511() {
    try {
        console.log('\n🔍 Testing 2511 input...\n');

        const inputPath = path.join(__dirname, 'QA', '2511_input.txt');
        const inputData = fs.readFileSync(inputPath, 'utf-8');
        const rawData = JSON.parse(inputData);
        const inputArray = rawData[0].input;

        const config = {};
        inputArray.forEach(item => {
            config[item.name] = item.value;
        });

        // Show structure and template
        const structure = config.learned_config.config.structure[0];
        const template = config.learned_config.template.PINVOICES[0];

        console.log('📋 Structure:');
        console.log('  has_doc:', structure.has_doc);
        console.log('  inventory_management:', structure.inventory_management);
        console.log('');

        console.log('📄 Template contains:');
        console.log('  PIVDOC_SUBFORM:', template.PIVDOC_SUBFORM ? 'YES' : 'NO');
        console.log('  PINVOICEITEMS_SUBFORM:', template.PINVOICEITEMS_SUBFORM ? 'YES' : 'NO');
        console.log('');

        console.log('📚 Docs available:');
        const docsList = config.docs_list;
        console.log('  DOC_YES_NO:', docsList.DOC_YES_NO);
        console.log('  count:', docsList.list_of_docs ? docsList.list_of_docs.length : 0);
        console.log('');

        // Run processing
        const result = await processInvoiceComplete(config);

        if (result.status === 'error') {
            console.log('❌ Processing failed:', result.message);
            return;
        }

        const invoice = result.invoice_data.PINVOICES[0];

        console.log('📦 Generated invoice contains:');
        console.log('  PIVDOC_SUBFORM:', invoice.PIVDOC_SUBFORM ? 'YES (' + invoice.PIVDOC_SUBFORM.length + ' items)' : 'NO');
        console.log('  PINVOICEITEMS_SUBFORM:', invoice.PINVOICEITEMS_SUBFORM ? 'YES (' + invoice.PINVOICEITEMS_SUBFORM.length + ' items)' : 'NO');
        console.log('');

        console.log('🎯 Expected based on template:');
        console.log('  Should have: PIVDOC_SUBFORM (linking to DOCS)');
        console.log('  Should NOT have: PINVOICEITEMS_SUBFORM (detailed items)');
        console.log('');

        if (invoice.PIVDOC_SUBFORM && !invoice.PINVOICEITEMS_SUBFORM) {
            console.log('✅ CORRECT: Using PIVDOC_SUBFORM as per template');
        } else if (invoice.PINVOICEITEMS_SUBFORM && !invoice.PIVDOC_SUBFORM) {
            console.log('❌ WRONG: Using PINVOICEITEMS_SUBFORM instead of PIVDOC_SUBFORM');
            console.log('   Template says: PIVDOC_SUBFORM');
            console.log('   Code generated: PINVOICEITEMS_SUBFORM');
        } else if (invoice.PIVDOC_SUBFORM && invoice.PINVOICEITEMS_SUBFORM) {
            console.log('⚠️  Both exist - might be wrong');
        }

        // Save for comparison
        fs.writeFileSync(
            path.join(__dirname, 'test-2511-output.json'),
            JSON.stringify(result, null, 2)
        );
        console.log('\n💾 Saved output to: test-2511-output.json\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    }
}

test2511();
