const fs = require('fs');
const path = require('path');

/**
 * סימולציה של הקוד הבא ב-MAKE
 *
 * INPUT:
 * 1. AZURE_RESULT + AZURE_TEXT (מסמך חדש)
 * 2. output-llm-prompt.json (הנחיות)
 * 3. output-technical-config.json (חוקים טכניים)
 * 4. output-invoice-data.json (דוגמה)
 *
 * OUTPUT:
 * - JSON חדש לפריוריטי
 *
 * המטרה: לבדוק אם ההנחיות מספיקות טובות!
 */

async function simulateNextCode() {
    console.log('🎬 Starting simulation of NEXT CODE in MAKE...\n');
    console.log('═══════════════════════════════════════════════\n');

    try {
        // ============================================================================
        // שלב 1: טעינת INPUT
        // ============================================================================

        console.log('📥 STEP 1: Loading INPUT files...\n');

        // 1.1 טעינת מסמך חדש (AZURE_RESULT + AZURE_TEXT)
        const inputPath = path.join(__dirname, 'QA', 'input.txt');
        const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
        const inputArray = inputData[0].input;

        const AZURE_RESULT = inputArray.find(item => item.name === 'AZURE_RESULT').value;
        const AZURE_TEXT = inputArray.find(item => item.name === 'AZURE_TEXT').value;

        console.log('✅ AZURE_RESULT loaded');
        console.log('✅ AZURE_TEXT loaded');

        // 1.2 טעינת הנחיות
        const llmPrompt = JSON.parse(fs.readFileSync(path.join(__dirname, 'output-llm-prompt.json'), 'utf-8'));
        console.log('✅ LLM Prompt loaded');

        const technicalConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'output-technical-config.json'), 'utf-8'));
        console.log('✅ Technical Config loaded');

        const exampleInvoice = JSON.parse(fs.readFileSync(path.join(__dirname, 'output-invoice-data.json'), 'utf-8'));
        console.log('✅ Example Invoice loaded');

        console.log('\n═══════════════════════════════════════════════\n');

        // ============================================================================
        // שלב 2: חילוץ שדות לפי TECHNICAL_CONFIG
        // ============================================================================

        console.log('⚙️  STEP 2: Extracting fields using technical_config...\n');

        const ocrFields = AZURE_RESULT.data.fields;
        const extractedData = {};

        // 2.1 BOOKNUM
        const booknumRule = technicalConfig.extraction_rules.booknum;
        let booknum = ocrFields.InvoiceId || "";
        // Apply transformations
        booknum = booknum.replace(/^SI/i, ''); // Remove SI prefix
        if (booknumRule.transformations) {
            const takeLastN = booknumRule.transformations.find(t => t.action === 'take_last_n_chars');
            if (takeLastN && booknum.length > takeLastN.count) {
                booknum = booknum.slice(-takeLastN.count);
            }
        }
        extractedData.BOOKNUM = booknum;
        console.log(`✅ BOOKNUM: ${booknum} (from ${ocrFields.InvoiceId})`);

        // 2.2 IVDATE
        const ivdateRule = technicalConfig.extraction_rules.ivdate;
        const isoDate = ocrFields.InvoiceDate;
        if (isoDate) {
            const date = new Date(isoDate);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = String(date.getFullYear()).slice(-2);
            extractedData.IVDATE = `${day}/${month}/${year}`;
            console.log(`✅ IVDATE: ${extractedData.IVDATE} (from ${isoDate})`);
        }

        // 2.3 PRICE
        const priceRule = technicalConfig.extraction_rules.price;
        let price = 0;
        if (ocrFields.TotalTax_amount) {
            // Primary formula
            price = (ocrFields.InvoiceTotal_amount || 0) - ocrFields.TotalTax_amount;
            console.log(`✅ PRICE: ${price} (formula: ${ocrFields.InvoiceTotal_amount} - ${ocrFields.TotalTax_amount})`);
        } else {
            // Fallback
            price = ocrFields.SubTotal_amount || ocrFields.InvoiceTotal_amount || 0;
            console.log(`✅ PRICE: ${price} (fallback: SubTotal_amount)`);
        }
        extractedData.PRICE = price;

        // 2.4 DETAILS
        const detailsRule = technicalConfig.extraction_rules.details;
        extractedData.DETAILS = ocrFields.InvoiceDescription || "";
        console.log(`✅ DETAILS: ${extractedData.DETAILS}`);

        // 2.5 VEHICLES
        const vehicleRule = technicalConfig.extraction_rules.vehicles;
        let vehicles = [];

        // Check VehicleNumbers first
        if (ocrFields.VehicleNumbers && ocrFields.VehicleNumbers.length > 0) {
            vehicles = ocrFields.VehicleNumbers.map(v =>
                typeof v === 'object' ? v.value : v
            );
        } else {
            // Search in UnidentifiedNumbers
            const unidentified = ocrFields.UnidentifiedNumbers || [];
            const vehiclePattern = new RegExp(vehicleRule.pattern);

            unidentified.forEach(item => {
                const value = typeof item === 'object' ? item.value : item;
                if (vehiclePattern.test(value)) {
                    vehicles.push(value);
                }
            });
        }
        extractedData.VEHICLES = vehicles;
        console.log(`✅ VEHICLES: ${vehicles.length} found - ${vehicles.join(', ')}`);

        console.log('\n═══════════════════════════════════════════════\n');

        // ============================================================================
        // שלב 3: בניית JSON לפי TEMPLATE
        // ============================================================================

        console.log('🏗️  STEP 3: Building JSON using template...\n');

        const template = technicalConfig.template;
        const vehicleMapping = technicalConfig.vehicle_mapping;

        // Build invoice
        const newInvoice = {
            SUPNAME: template.SUPNAME,
            CODE: template.CODE,
            DEBIT: template.DEBIT,
            IVDATE: extractedData.IVDATE,
            BOOKNUM: extractedData.BOOKNUM,
            DETAILS: extractedData.DETAILS,
            PINVOICEITEMS_SUBFORM: [],
            PINVOICESCONT_SUBFORM: template.PINVOICESCONT_SUBFORM
        };

        // Add vehicle items
        if (extractedData.VEHICLES.length > 0) {
            const pricePerVehicle = extractedData.PRICE / extractedData.VEHICLES.length;

            extractedData.VEHICLES.forEach(vehicleNum => {
                const mapping = vehicleMapping[vehicleNum];

                if (mapping) {
                    newInvoice.PINVOICEITEMS_SUBFORM.push({
                        PARTNAME: "car",
                        PDES: extractedData.DETAILS,
                        TQUANT: 1,
                        TUNITNAME: "יח'",
                        PRICE: pricePerVehicle,
                        VATFLAG: mapping.vat_pattern.VATFLAG,
                        ACCNAME: mapping.accname
                    });
                    console.log(`✅ Added item for vehicle ${vehicleNum}: PRICE=${pricePerVehicle}, ACCNAME=${mapping.accname}`);
                } else {
                    console.log(`⚠️  Vehicle ${vehicleNum} not in mapping - skipping`);
                }
            });
        } else {
            // No vehicles - use default from template
            newInvoice.PINVOICEITEMS_SUBFORM = [{
                PARTNAME: "car",
                PDES: extractedData.DETAILS,
                TQUANT: 1,
                TUNITNAME: "יח'",
                PRICE: extractedData.PRICE,
                VATFLAG: "Y",
                ACCNAME: template.PINVOICEITEMS_SUBFORM[0].ACCNAME
            }];
            console.log(`✅ Added default item: PRICE=${extractedData.PRICE}`);
        }

        console.log('\n═══════════════════════════════════════════════\n');

        // ============================================================================
        // שלב 4: השוואה לדוגמה המקורית
        // ============================================================================

        console.log('🔍 STEP 4: Comparing with original example...\n');

        const originalInvoice = exampleInvoice.PINVOICES[0];

        console.log('📊 Comparison:');
        console.log('──────────────────────────────────────────────');
        console.log(`BOOKNUM:   ${newInvoice.BOOKNUM} ${newInvoice.BOOKNUM === originalInvoice.BOOKNUM ? '✅' : '❌'} (original: ${originalInvoice.BOOKNUM})`);
        console.log(`IVDATE:    ${newInvoice.IVDATE} ${newInvoice.IVDATE === originalInvoice.IVDATE ? '✅' : '❌'} (original: ${originalInvoice.IVDATE})`);
        console.log(`DETAILS:   ${newInvoice.DETAILS} ${newInvoice.DETAILS === originalInvoice.DETAILS ? '✅' : '❌'} (original: ${originalInvoice.DETAILS})`);
        console.log(`Items:     ${newInvoice.PINVOICEITEMS_SUBFORM.length} ${newInvoice.PINVOICEITEMS_SUBFORM.length === originalInvoice.PINVOICEITEMS_SUBFORM.length ? '✅' : '❌'} (original: ${originalInvoice.PINVOICEITEMS_SUBFORM.length})`);

        const newPrice = newInvoice.PINVOICEITEMS_SUBFORM[0].PRICE;
        const originalPrice = originalInvoice.PINVOICEITEMS_SUBFORM[0].PRICE;
        console.log(`PRICE:     ${newPrice} ${newPrice === originalPrice ? '✅' : '❌'} (original: ${originalPrice})`);

        console.log('\n═══════════════════════════════════════════════\n');

        // ============================================================================
        // שלב 5: שמירת התוצאה
        // ============================================================================

        const outputPath = path.join(__dirname, 'output-simulated-invoice.json');
        fs.writeFileSync(outputPath, JSON.stringify({ PINVOICES: [newInvoice] }, null, 2));

        console.log('💾 STEP 5: Saved simulated output\n');
        console.log(`📁 File: ${path.basename(outputPath)}`);

        console.log('\n═══════════════════════════════════════════════\n');

        // ============================================================================
        // סיכום
        // ============================================================================

        console.log('📋 SUMMARY:');
        console.log('──────────────────────────────────────────────');

        const allMatch =
            newInvoice.BOOKNUM === originalInvoice.BOOKNUM &&
            newInvoice.IVDATE === originalInvoice.IVDATE &&
            newInvoice.DETAILS === originalInvoice.DETAILS &&
            newPrice === originalPrice;

        if (allMatch) {
            console.log('🎉 SUCCESS! The technical_config and llm_prompt contain');
            console.log('   all the information needed to generate the JSON!');
        } else {
            console.log('⚠️  PARTIAL SUCCESS - some fields differ.');
            console.log('   This might indicate missing information in the config.');
        }

        console.log('\n═══════════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ SIMULATION FAILED:', error.message);
        console.error(error.stack);
    }
}

simulateNextCode();
