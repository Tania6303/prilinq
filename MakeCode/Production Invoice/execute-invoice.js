// ================================================================
// Production Invoice Generator v1.0
// תאריך: 31 אוקטובר 2025
// ================================================================
//
// תפקיד: ייצור JSON סופי לחשבוניות חדשות (Production Mode)
//
// קלט:
// - learned_config: הנחיות ממודול SupplierDataLearning + Processing Invoice
// - docs_list: תעודות מהמערכת Priority
// - import_files: תיקי יבוא מהמערכת Priority
// - vehicles: רשימת רכבים מהמערכת Priority
// - AZURE_RESULT: ניתוח OCR מעובד
// - AZURE_TEXT: טקסט גולמי מ-OCR
//
// פלט:
// - invoice: JSON מוכן לשליחה ל-Priority (PINVOICES)
// - execution_report: דוח ביצוע (found, not_found, warnings, errors)
//
// הבדל ממודול Processing Invoice (v4.2):
// - מודול זה לא לומד! רק מפעיל לפי הנחיות קיימות
// - מיועד ל-production, לא ל-learning
// - עצמאי לחלוטין (לא תלוי ב-v4.2)
//
// קשרים לפונקציות ב-Processing Invoice v4.2-COMPLETE.js:
// - searchDocuments() ← זהה ל-searchDocuments() בשורות 505-567
// - searchImport() ← דומה ל-searchImpfnum() בשורות 481-503
// - searchVehicles() ← דומה ל-extractVehiclesAdvanced() בשורות 569-656
// - buildInvoice() ← דומה ל-buildInvoiceFromTemplate() בשורות 766-895
//
// ================================================================

// ================================================================
// פונקציה ראשית
// ================================================================

function executeInvoice(data) {
    const report = {
        stage: "",
        found: [],
        not_found: [],
        warnings: [],
        errors: []
    };

    try {
        // ============================================================================
        // שלב 1: זיהוי מצב ותבנית
        // ============================================================================

        report.stage = "שלב 1: זיהוי מצב";

        const config = data.learned_config.config;
        const template = data.learned_config.template.PINVOICES[0];

        // זיהוי חיוב/זיכוי
        const debitType = identifyDebitType(data.AZURE_RESULT.data.fields);

        // חיפוש התאמת מצב
        const hasImport = checkImportExists(data.import_files);
        const hasDocsInOCR = checkDocsInOCR(data.AZURE_RESULT.data.fields, data.AZURE_TEXT);

        report.found.push(`מצב: יבוא=${hasImport}, תעודות=${hasDocsInOCR}, חיוב/זיכוי=${debitType}`);

        // מציאת תבנית מתאימה
        const templateIndex = findMatchingTemplate(
            config.structure,
            hasImport,
            hasDocsInOCR,
            debitType
        );

        if (templateIndex === -1) {
            report.errors.push("לא נמצאה תבנית מתאימה למצב זה");
            return {
                status: "error",
                execution_report: report
            };
        }

        const structure = config.structure[templateIndex];
        report.found.push(`תבנית: index=${templateIndex}`);

        // ============================================================================
        // שלב 2: חיפוש נתונים
        // ============================================================================

        report.stage = "שלב 2: חיפוש נתונים";

        const ocrFields = data.AZURE_RESULT.data.fields;
        const searchResults = {};

        // חיפוש מספר חשבונית (BOOKNUM)
        searchResults.booknum = searchBooknum(ocrFields);
        if (searchResults.booknum) {
            report.found.push(`BOOKNUM: ${searchResults.booknum}`);
        } else {
            report.not_found.push("BOOKNUM");
        }

        // חיפוש תאריך
        searchResults.ivdate = searchIvdate(ocrFields);
        if (searchResults.ivdate) {
            report.found.push(`תאריך: ${searchResults.ivdate}`);
        } else {
            report.not_found.push("תאריך");
        }

        // חיפוש תעודות (אם נדרש)
        if (structure.has_doc) {
            searchResults.documents = searchDocuments(
                ocrFields,
                data.AZURE_TEXT,
                data.docs_list
            );

            if (searchResults.documents && searchResults.documents.length > 0) {
                const docsInfo = searchResults.documents.map(d =>
                    `${d.BOOKNUM} (DOCNO: ${d.DOCNO})`
                ).join(', ');
                report.found.push(`תעודות: ${searchResults.documents.length} - ${docsInfo}`);
            } else {
                report.not_found.push("תעודות");
                report.errors.push("תבנית דורשת תעודות אך לא נמצאו");
            }
        }

        // חיפוש יבוא (אם נדרש)
        if (structure.has_import) {
            searchResults.impfnum = searchImport(ocrFields, data.import_files);

            if (searchResults.impfnum) {
                report.found.push(`יבוא: ${searchResults.impfnum}`);
            } else {
                report.not_found.push("יבוא");
                report.warnings.push("תבנית דורשת יבוא אך לא נמצא");
            }
        }

        // חיפוש רכבים (אם קיימים חוקי רכבים)
        const vehicleRules = config.rules?.critical_patterns?.vehicle_rules;
        if (vehicleRules && vehicleRules.vehicle_account_mapping) {
            searchResults.vehicles = searchVehicles(ocrFields, data.vehicles);

            if (searchResults.vehicles && searchResults.vehicles.length > 0) {
                report.found.push(`רכבים: ${searchResults.vehicles.length} - ${searchResults.vehicles.join(', ')}`);
            } else {
                report.not_found.push("רכבים");
            }
        }

        // פריטים (מה-OCR)
        searchResults.items = ocrFields.Items || [];

        // ============================================================================
        // שלב 3: בניית JSON
        // ============================================================================

        report.stage = "שלב 3: בניית JSON";

        const invoice = buildInvoice(
            template,
            structure,
            config,
            searchResults,
            ocrFields,
            vehicleRules
        );

        // ============================================================================
        // שלב 4: ולידציה סופית
        // ============================================================================

        report.stage = "שלב 4: ולידציה";

        // בדיקה: אם צריך תעודות ולא נמצאו
        if (structure.has_doc && (!searchResults.documents || searchResults.documents.length === 0)) {
            report.errors.push("חסרות תעודות - JSON לא שלם");
        }

        // בדיקה: אם צריך יבוא ולא נמצא
        if (structure.has_import && !searchResults.impfnum) {
            report.warnings.push("חסר מספר יבוא");
        }

        // ============================================================================
        // החזרת תוצאה
        // ============================================================================

        report.stage = "הושלם";

        return {
            status: report.errors.length > 0 ? "error" : "success",
            invoice: {
                PINVOICES: [invoice]
            },
            execution_report: report
        };

    } catch (error) {
        report.errors.push(`שגיאה: ${error.message}`);
        return {
            status: "error",
            error_message: error.message,
            execution_report: report
        };
    }
}

// ================================================================
// פונקציות עזר - זיהוי מצב
// ================================================================

function identifyDebitType(ocrFields) {
    // קשר ל-v4.2: identifyDebitType() בשורה 99
    const total = ocrFields.InvoiceTotal || ocrFields.InvoiceTotal_amount || 0;
    return total >= 0 ? "D" : "C";
}

function checkImportExists(importFiles) {
    // קשר ל-v4.2: checkImportExists() בשורות 89-97
    if (!importFiles || !importFiles.IMPFILES) return false;
    if (importFiles.IMPFILES.length === 0) return false;

    try {
        const parsed = JSON.parse('[' + importFiles.IMPFILES[0] + ']');
        return parsed.length > 0 && parsed[0].IMPFNUM;
    } catch (e) {
        return false;
    }
}

function checkDocsInOCR(ocrFields, azureText) {
    // קשר ל-v4.2: checkDocsInOCR() בשורות 107-125
    const unidentified = ocrFields.UnidentifiedNumbers || [];
    const booknumPattern = /^108\d{6}$/;

    // חיפוש ב-UnidentifiedNumbers
    let foundInUnidentified = false;

    if (unidentified.length > 0) {
        if (typeof unidentified[0] === 'object' && unidentified[0].value) {
            foundInUnidentified = unidentified.some(item =>
                booknumPattern.test(item.value)
            );
        } else {
            foundInUnidentified = unidentified.some(num =>
                booknumPattern.test(num)
            );
        }
    }

    if (foundInUnidentified) return true;

    // fallback: חיפוש ב-AZURE_TEXT
    if (azureText) {
        const matches = azureText.match(/108\d{6}/g);
        if (matches && matches.length > 0) return true;
    }

    return false;
}

function findMatchingTemplate(structures, hasImport, hasDocs, debitType) {
    // קשר ל-v4.2: findMatchingTemplate() בשורות 127-132
    return structures.findIndex(s =>
        s.has_import === hasImport &&
        s.has_doc === hasDocs &&
        s.debit_type === debitType
    );
}

// ================================================================
// פונקציות חיפוש - שלב 2
// ================================================================

function searchBooknum(ocrFields) {
    // קשר ל-v4.2: searchBooknum() בשורות 402-414
    let booknum = ocrFields.InvoiceId || "";

    // הסר קידומת SI אם קיימת
    booknum = String(booknum).replace(/^SI/i, '');

    return booknum;
}

function searchIvdate(ocrFields) {
    // קשר ל-v4.2: searchIvdate() בשורות 416-425
    const isoDate = ocrFields.InvoiceDate;
    if (!isoDate) return "";

    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);

    return `${day}/${month}/${year}`;
}

function searchDocuments(ocrFields, azureText, docsList) {
    // ⚠️ קשר ל-v4.2: searchDocuments() בשורות 505-567
    // פונקציה זהה - מחפשת BOOKNUM ב-OCR ומתאימה עם docs_list

    const foundDocs = [];

    if (!docsList || !docsList.list_of_docs || docsList.list_of_docs.length === 0) {
        return foundDocs;
    }

    let availableDocs = [];
    try {
        availableDocs = docsList.list_of_docs.flatMap(d => JSON.parse(d));
    } catch (e) {
        return foundDocs;
    }

    const unidentified = ocrFields.UnidentifiedNumbers || [];

    // חיפוש ב-UnidentifiedNumbers
    if (unidentified.length > 0) {
        if (typeof unidentified[0] === 'object' && unidentified[0].value) {
            for (const item of unidentified) {
                const match = availableDocs.find(doc => doc.BOOKNUM === item.value);

                if (match) {
                    foundDocs.push({
                        DOCNO: match.DOCNO,
                        BOOKNUM: match.BOOKNUM,
                        TOTQUANT: match.TOTQUANT || null
                    });
                }
            }
        } else {
            for (const num of unidentified) {
                const match = availableDocs.find(doc => doc.BOOKNUM === num);

                if (match) {
                    foundDocs.push({
                        DOCNO: match.DOCNO,
                        BOOKNUM: match.BOOKNUM,
                        TOTQUANT: match.TOTQUANT || null
                    });
                }
            }
        }
    }

    // Fallback: חיפוש ב-AZURE_TEXT
    if (foundDocs.length === 0 && azureText) {
        for (const doc of availableDocs) {
            const pattern = new RegExp('\\b' + doc.BOOKNUM + '\\b');
            if (pattern.test(azureText)) {
                foundDocs.push({
                    DOCNO: doc.DOCNO,
                    BOOKNUM: doc.BOOKNUM,
                    TOTQUANT: doc.TOTQUANT || null
                });
            }
        }
    }

    return foundDocs;
}

function searchImport(ocrFields, importFiles) {
    // קשר ל-v4.2: searchImpfnum() בשורות 481-503
    const unidentified = ocrFields.UnidentifiedNumbers || [];
    const impPattern = /^\d{2}c\d{5}$/;
    let foundInOCR = "";

    // חיפוש ב-UnidentifiedNumbers
    if (unidentified.length > 0) {
        if (typeof unidentified[0] === 'object' && unidentified[0].value) {
            const importItem = unidentified.find(item =>
                item.label && (
                    item.label.includes('יבוא') ||
                    item.label.toLowerCase().includes('import') ||
                    item.label.includes('IMPFNUM')
                ) && impPattern.test(item.value)
            );

            if (importItem) {
                foundInOCR = importItem.value;
            } else {
                const anyImport = unidentified.find(item =>
                    impPattern.test(item.value)
                );
                foundInOCR = anyImport ? anyImport.value : "";
            }
        } else {
            const match = unidentified.find(num => impPattern.test(num));
            foundInOCR = match || "";
        }
    }

    if (foundInOCR) return foundInOCR;

    // Fallback: חיפוש ב-import_files
    if (importFiles && importFiles.IMPFILES && importFiles.IMPFILES.length > 0) {
        try {
            const parsed = JSON.parse('[' + importFiles.IMPFILES[0] + ']');
            if (parsed.length > 0 && parsed[0].IMPFNUM) {
                return parsed[0].IMPFNUM;
            }
        } catch (e) {
            // ממשיכים בלי
        }
    }

    return "";
}

function searchVehicles(ocrFields, vehiclesList) {
    // קשר ל-v4.2: extractVehiclesAdvanced() בשורות 569-656
    // גרסה מפושטת - חיפוש ישיר ברשימת הרכבים

    const foundVehicles = [];

    if (!vehiclesList || !vehiclesList.list_of_vehicles) {
        return foundVehicles;
    }

    let availableVehicles = [];
    try {
        // הנחה: list_of_vehicles זה מערך JSON כמו docs_list
        if (Array.isArray(vehiclesList.list_of_vehicles)) {
            availableVehicles = vehiclesList.list_of_vehicles.flatMap(v =>
                typeof v === 'string' ? JSON.parse(v) : v
            );
        }
    } catch (e) {
        return foundVehicles;
    }

    const unidentified = ocrFields.UnidentifiedNumbers || [];
    const vehiclePattern = /\d{3}-\d{2}-\d{3}/;

    // חיפוש ב-UnidentifiedNumbers
    unidentified.forEach(item => {
        const value = typeof item === 'object' ? item.value : item;
        const label = typeof item === 'object' ? (item.label || '') : '';
        const context = typeof item === 'object' ? (item.context || '') : '';

        // בדיקה: האם זה מספר רכב תקין
        const isValidVehicleNumber = vehiclePattern.test(value);
        const looksLikeCardNumber = context.includes('כרטיס') || label.includes('כרטיס');

        if (isValidVehicleNumber && !looksLikeCardNumber) {
            // בדוק אם הרכב קיים ברשימה
            const vehicleMatch = availableVehicles.find(v =>
                v.vehicle_number === value || v.VEHICLE_NUM === value
            );

            if (vehicleMatch && !foundVehicles.includes(value)) {
                foundVehicles.push(value);
            }
        }
    });

    return foundVehicles;
}

// ================================================================
// בניית JSON - שלב 3
// ================================================================

function buildInvoice(template, structure, config, searchResults, ocrFields, vehicleRules) {
    // ⚠️ קשר ל-v4.2: buildInvoiceFromTemplate() בשורות 766-895
    // פונקציה דומה אבל מפושטת יותר

    const invoice = {
        SUPNAME: config.supplier_config.supplier_code,
        CODE: template.CODE || "I",
        DEBIT: structure.debit_type,
        IVDATE: searchResults.ivdate,
        BOOKNUM: searchResults.booknum
    };

    // DETAILS - תיאור כללי
    invoice.DETAILS = template.DETAILS || `${config.supplier_config.supplier_name} - חשבונית`;

    // יבוא (אם קיים)
    if (searchResults.impfnum) {
        invoice.IMPFNUM = searchResults.impfnum;
    }

    // תעודות
    if (searchResults.documents && searchResults.documents.length > 0) {
        if (searchResults.documents.length === 1) {
            // תעודה יחידה - שדות רגילים
            invoice.DOCNO = searchResults.documents[0].DOCNO;
            invoice.BOOKNUM = searchResults.documents[0].BOOKNUM;
        } else {
            // מספר תעודות - PIVDOC_SUBFORM
            invoice.PIVDOC_SUBFORM = searchResults.documents.map(d => ({
                DOCNO: d.DOCNO,
                BOOKNUM: d.BOOKNUM
            }));
        }
    }

    // פריטים (אם נדרש)
    const needItems = shouldAddItems(structure, searchResults.documents);

    if (needItems) {
        // אם יש רכבים - יוצרים פריטי רכבים
        if (searchResults.vehicles && searchResults.vehicles.length > 0 && vehicleRules) {
            invoice.PINVOICEITEMS_SUBFORM = createVehicleItems(
                searchResults.vehicles,
                searchResults.items,
                vehicleRules,
                ocrFields
            );
        }
        // אחרת - פריטים רגילים
        else if (searchResults.items && searchResults.items.length > 0) {
            invoice.PINVOICEITEMS_SUBFORM = buildItems(
                searchResults.items,
                config,
                template
            );
        }
    }

    // PINVOICESCONT_SUBFORM
    if (template.PINVOICESCONT_SUBFORM) {
        invoice.PINVOICESCONT_SUBFORM = template.PINVOICESCONT_SUBFORM;
    }

    return invoice;
}

function shouldAddItems(structure, documents) {
    // קשר ל-v4.2: shouldAddItems() בשורות 897-901
    if (!structure.has_doc) return true;
    if (structure.has_doc && (!documents || documents.length === 0)) return true;
    return false;
}

function createVehicleItems(vehicles, ocrItems, vehicleRules, ocrFields) {
    // קשר ל-v4.2: createVehicleItems() בשורות 658-733
    if (!vehicles || vehicles.length === 0) return [];

    const vehicleItems = [];

    // חישוב מחיר כולל
    const totalPrice = ocrFields.TotalTax_amount
        ? (ocrFields.InvoiceTotal_amount || 0) - ocrFields.TotalTax_amount
        : (ocrFields.SubTotal_amount || ocrFields.InvoiceTotal_amount || 0);

    const pricePerVehicle = vehicles.length > 0 ? totalPrice / vehicles.length : totalPrice;

    vehicles.forEach(vehicleNum => {
        const mapping = vehicleRules.vehicle_account_mapping?.[vehicleNum];

        const item = {
            PARTNAME: vehicleRules.output_format?.partname || "car",
            PDES: `רכב ${vehicleNum}`,
            TQUANT: 1,
            TUNITNAME: "יח'",
            PRICE: pricePerVehicle,
            VATFLAG: mapping?.vat_pattern?.VATFLAG || "Y",
            ACCNAME: mapping?.accname || vehicleRules.default_values?.accname || ""
        };

        if (mapping?.budcode) {
            item.BUDCODE = mapping.budcode;
        } else if (vehicleRules.default_values?.budcode) {
            item.BUDCODE = vehicleRules.default_values.budcode;
        }

        if (mapping?.vat_pattern?.SPECIALVATFLAG === "Y") {
            item.SPECIALVATFLAG = "Y";
        }

        vehicleItems.push(item);
    });

    return vehicleItems;
}

function buildItems(items, config, template) {
    // קשר ל-v4.2: buildItems() בשורות 903-1011
    // גרסה מפושטת

    const invoiceItems = [];

    items.forEach(ocrItem => {
        const item = {
            PARTNAME: ocrItem.ProductCode || "",
            PDES: ocrItem.Description || "",
            TQUANT: ocrItem.Quantity || 1,
            TUNITNAME: ocrItem.Unit || "יח'",
            PRICE: ocrItem.UnitPrice || ocrItem.Amount || 0,
            VATFLAG: "Y"
        };

        // ACCNAME מהתבנית
        if (template.ACCNAME) {
            item.ACCNAME = template.ACCNAME;
        }

        invoiceItems.push(item);
    });

    return invoiceItems;
}

// ================================================================
// ריצה (עבור MAKE)
// ================================================================

// בדיקה אם הקוד רץ ב-MAKE עם input גלובלי
// ב-MAKE, input יהיה משתנה גלובלי
if (typeof global !== 'undefined' && global.input) {
    const result = executeInvoice(global.input);
    result;
} else if (typeof this !== 'undefined' && this.input) {
    const result = executeInvoice(this.input);
    result;
}

// ================================================================
// Export (עבור Node.js / בדיקות)
// ================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { executeInvoice };
}
