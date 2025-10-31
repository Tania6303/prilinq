const fs = require('fs');
const path = require('path');

// Copy the function
function shouldAddItems(structure, documents) {
    console.log('\n🔍 shouldAddItems Debug:');
    console.log('  structure.has_doc:', structure.has_doc);
    console.log('  structure.inventory_management:', structure.inventory_management);
    console.log('  documents:', documents ? documents.length : 'null');

    if (!structure.has_doc) {
        console.log('  → Result: TRUE (no has_doc)');
        return true;
    }

    if (structure.has_doc && (!documents || documents.length === 0)) {
        console.log('  → Result: TRUE (has_doc but no documents found)');
        return true;
    }

    if (structure.has_doc && structure.inventory_management === "not_managed_inventory") {
        console.log('  → Result: TRUE (not_managed_inventory)');
        return true;
    }

    console.log('  → Result: FALSE (has docs + managed inventory)');
    return false;
}

// Load 2511 input
const inputPath = path.join(__dirname, 'QA', '2511_input.txt');
const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
const inputArray = inputData[0].input;

const config = {};
inputArray.forEach(item => {
    config[item.name] = item.value;
});

const structure = config.learned_config.config.structure[0];
const docsList = config.docs_list;

// Parse docs
let documents = [];
if (docsList && docsList.list_of_docs && docsList.list_of_docs.length > 0) {
    const docsStr = docsList.list_of_docs[0];
    documents = JSON.parse(docsStr);
}

console.log('\n📊 Input for shouldAddItems:');
console.log('  structure.has_doc:', structure.has_doc);
console.log('  structure.inventory_management:', structure.inventory_management);
console.log('  documents count:', documents.length);

const result = shouldAddItems(structure, documents);

console.log('\n✅ Final result:', result);
console.log('');

if (result) {
    console.log('❌ PROBLEM: shouldAddItems returns TRUE');
    console.log('   → Code WILL create PINVOICEITEMS_SUBFORM');
    console.log('   → But should create PIVDOC_SUBFORM instead!');
} else {
    console.log('✅ CORRECT: shouldAddItems returns FALSE');
    console.log('   → Code should NOT create PINVOICEITEMS_SUBFORM');
    console.log('   → Should only have PIVDOC_SUBFORM');
}
console.log('');
