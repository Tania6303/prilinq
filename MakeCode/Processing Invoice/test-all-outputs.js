const fs = require('fs');

const input = JSON.parse(fs.readFileSync('QA/input.txt', 'utf8'));
const codeString = fs.readFileSync('v4.2-COMPLETE.js', 'utf8');
const processFunc = new Function('input', codeString + '\nreturn processInvoiceComplete(input);');

const inputObj = input[0].input.reduce((acc, item) => {
  acc[item.name] = item.value;
  return acc;
}, {});

const result = processFunc(inputObj);

console.log('✅ Test Results - All 3 Outputs');
console.log('==================================\n');

console.log('📊 1. INVOICE_DATA (Priority JSON):');
console.log('   Status:', result.status);
console.log('   Supplier:', result.supplier_identification.supplier_code);
const item = result.invoice_data.PINVOICES[0].PINVOICEITEMS_SUBFORM[0];
console.log('   PRICE:', item.PRICE, '(Expected: 2138.98)');
console.log('   PDES:', item.PDES);
console.log('   ACCNAME:', item.ACCNAME);
console.log('');

console.log('📝 2. LLM_PROMPT:');
console.log('   Supplier:', result.llm_prompt.supplier_name);
console.log('   Document Type:', result.llm_prompt.document_type);
console.log('   Processing Steps:', result.llm_prompt.instructions.processing_steps.length, 'steps');
console.log('   Fields Explained:', Object.keys(result.llm_prompt.instructions.fields).length, 'fields');
console.log('   PRICE Instruction:', result.llm_prompt.instructions.fields.price.how_to_calculate);
console.log('   Vehicle Mapping:', Object.keys(result.llm_prompt.instructions.vehicle_mapping).length, 'vehicles');
console.log('');

console.log('⚙️  3. TECHNICAL_CONFIG:');
console.log('   Supplier:', result.technical_config.supplier_code);
console.log('   Version:', result.technical_config.version);
console.log('   Document Type:', result.technical_config.document_type);
console.log('   Extraction Rules:', Object.keys(result.technical_config.extraction_rules).length, 'rules');
console.log('   PRICE Formula:', result.technical_config.extraction_rules.price.calculation.primary.formula);
console.log('   PRICE Example:', JSON.stringify(result.technical_config.extraction_rules.price.example_calculation));
console.log('   Vehicle Mapping:', Object.keys(result.technical_config.vehicle_mapping).length, 'vehicles');
console.log('');

console.log('✅ ALL 3 OUTPUTS GENERATED SUCCESSFULLY!');
console.log('');

// Save to files for inspection
fs.writeFileSync('output-llm-prompt.json', JSON.stringify(result.llm_prompt, null, 2));
fs.writeFileSync('output-technical-config.json', JSON.stringify(result.technical_config, null, 2));
console.log('📁 Saved outputs to:');
console.log('   - output-llm-prompt.json');
console.log('   - output-technical-config.json');
