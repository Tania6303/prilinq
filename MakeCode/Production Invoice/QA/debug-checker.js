// ============================================================================
// Debug Checker - מאתר בעיות במבנה התוצאה
// ============================================================================

const fs = require('fs');
const path = require('path');

console.log("================================================================================");
console.log("Debug Checker - Production Invoice");
console.log("================================================================================\n");

// קריאת הקוד
const codeFile = path.join(__dirname, '..', 'v1.0-production.js');
const inputFile = path.join(__dirname, 'INPUT_3979.TXT');

console.log("📂 Loading files...");
console.log(`   Code: ${codeFile}`);
console.log(`   Input: ${inputFile}\n`);

const codeContent = fs.readFileSync(codeFile, 'utf-8');
const inputContent = fs.readFileSync(inputFile, 'utf-8');

// parse input
let input;
try {
    input = JSON.parse(inputContent);
    console.log("✅ Input parsed successfully\n");
} catch (error) {
    console.error("❌ Failed to parse input:", error.message);
    process.exit(1);
}

// הרצת הקוד
console.log("================================================================================");
console.log("Running code...");
console.log("================================================================================\n");

let result;
try {
    // עטיפת הקוד בפונקציה
    const wrappedCode = `
        (function() {
            ${codeContent}
        })();
    `;
    result = eval(wrappedCode);
    console.log("✅ Code executed successfully\n");
} catch (error) {
    console.error("❌ Code execution failed:", error.message);
    console.error(error.stack);
    process.exit(1);
}

// ============================================================================
// בדיקות עומק
// ============================================================================

console.log("================================================================================");
console.log("DEEP ANALYSIS");
console.log("================================================================================\n");

// פונקציה רקורסיבית לחיפוש בעיות
function findIssues(obj, path = 'root') {
    const issues = [];

    if (obj === null) {
        issues.push({ path, issue: 'NULL_VALUE', value: null });
    } else if (obj === undefined) {
        issues.push({ path, issue: 'UNDEFINED_VALUE', value: undefined });
    } else if (obj === '') {
        issues.push({ path, issue: 'EMPTY_STRING', value: '' });
    } else if (Array.isArray(obj)) {
        if (obj.length === 0) {
            issues.push({ path, issue: 'EMPTY_ARRAY', value: [] });
        }
        obj.forEach((item, index) => {
            issues.push(...findIssues(item, `${path}[${index}]`));
        });
    } else if (typeof obj === 'object') {
        // בדיקה אם זה אובייקט ריק
        if (Object.keys(obj).length === 0) {
            issues.push({ path, issue: 'EMPTY_OBJECT', value: {} });
        }

        for (const [key, value] of Object.entries(obj)) {
            issues.push(...findIssues(value, `${path}.${key}`));
        }
    }

    return issues;
}

const issues = findIssues(result);

console.log("🔍 ISSUES FOUND:\n");

if (issues.length === 0) {
    console.log("   ✅ No issues found - all values are defined and non-empty\n");
} else {
    console.log(`   ⚠️  Found ${issues.length} potential issues:\n`);

    // קיבוץ לפי סוג בעיה
    const grouped = {};
    issues.forEach(issue => {
        if (!grouped[issue.issue]) {
            grouped[issue.issue] = [];
        }
        grouped[issue.issue].push(issue.path);
    });

    Object.entries(grouped).forEach(([issueType, paths]) => {
        console.log(`   ${issueType}: ${paths.length} occurrences`);
        paths.slice(0, 10).forEach(p => console.log(`      - ${p}`));
        if (paths.length > 10) {
            console.log(`      ... and ${paths.length - 10} more`);
        }
        console.log();
    });
}

// ============================================================================
// בדיקת מבנה
// ============================================================================

console.log("================================================================================");
console.log("STRUCTURE ANALYSIS");
console.log("================================================================================\n");

function getStructure(obj, depth = 0, maxDepth = 3) {
    if (depth > maxDepth) return '...';

    const indent = '  '.repeat(depth);

    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    if (typeof obj !== 'object') return typeof obj;

    if (Array.isArray(obj)) {
        if (obj.length === 0) return '[]';
        return `[\n${indent}  ${getStructure(obj[0], depth + 1, maxDepth)}\n${indent}] (${obj.length} items)`;
    }

    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';

    const lines = keys.map(key => {
        const value = obj[key];
        const valueStr = getStructure(value, depth + 1, maxDepth);
        return `${indent}  "${key}": ${valueStr}`;
    });

    return `{\n${lines.join(',\n')}\n${indent}}`;
}

console.log(getStructure(result));
console.log();

// ============================================================================
// בדיקה ספציפית למה ש-Make.com מצפה
// ============================================================================

console.log("================================================================================");
console.log("MAKE.COM COMPATIBILITY CHECK");
console.log("================================================================================\n");

// בדיקה אם יש שדה 'value' חסר
function checkForMissingValueFields(obj, path = 'root') {
    const missing = [];

    if (typeof obj === 'object' && obj !== null) {
        if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                // בדוק אם זה אובייקט עם name אבל בלי value
                if (typeof item === 'object' && item !== null) {
                    if (item.hasOwnProperty('name') && !item.hasOwnProperty('value')) {
                        missing.push({ path: `${path}[${index}]`, has: Object.keys(item) });
                    }
                }
                missing.push(...checkForMissingValueFields(item, `${path}[${index}]`));
            });
        } else {
            for (const [key, value] of Object.entries(obj)) {
                missing.push(...checkForMissingValueFields(value, `${path}.${key}`));
            }
        }
    }

    return missing;
}

const missingValueFields = checkForMissingValueFields(result);

if (missingValueFields.length > 0) {
    console.log("⚠️  Found objects with 'name' but no 'value':");
    missingValueFields.forEach(item => {
        console.log(`   ${item.path}: has keys [${item.has.join(', ')}]`);
    });
    console.log();
} else {
    console.log("✅ No objects with missing 'value' field\n");
}

// ============================================================================
// סיכום
// ============================================================================

console.log("================================================================================");
console.log("SUMMARY");
console.log("================================================================================\n");

console.log(`Status: ${result.status}`);
console.log(`Top-level keys: ${Object.keys(result).join(', ')}`);
console.log();

// שמירת דוח
const report = {
    timestamp: new Date().toISOString(),
    issues: issues,
    missing_value_fields: missingValueFields,
    result_keys: Object.keys(result),
    result_status: result.status
};

const reportFile = path.join(__dirname, 'debug-report.json');
fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

console.log(`📄 Full report saved to: ${reportFile}`);
console.log();

console.log("================================================================================");
console.log("PLEASE SEND THIS OUTPUT TO DEBUG THE ISSUE");
console.log("================================================================================");
