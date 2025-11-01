# Processing Invoice v4.2

## 📋 תפקיד

**מודול למידה** שמנתח חשבונית דוגמה ויוצר הנחיות מפורטות להפעלת חשבוניות חדשות.

**חשוב:** מודול זה **לא מיועד ל-production**! הוא רק לומד ונותן הנחיות.

---

## 🎯 מה המודול עושה?

**מצב:** Learning Mode
**מטרה:** ללמוד מחשבונית דוגמה וליצור הנחיות

### תהליך:
1. **קבלת דוגמה** - חשבונית + AZURE_RESULT + docs_list
2. **זיהוי תבנית** - מזהה אם יש תעודות/יבוא/רכבים
3. **למידה** - לומד מהדוגמה איך לעבד חשבוניות כאלה
4. **יצירת הנחיות** - מייצר 4 פלטים (למטה)

---

## 📥 קלט (Input)

```javascript
{
  // 1. הגדרות ספק (ממודול SupplierDataLearning)
  learned_config: {
    supplier_id: "2511",
    supplier_name: "...",
    config: {
      supplier_config: {...},
      structure: [...],    // תבניות אפשריות
      rules: {...}
    },
    template: {...}        // תבנית JSON
  },

  // 2. נתונים זמינים
  docs_list: {...},        // תעודות מהמערכת
  import_files: {...},     // יבוא

  // 3. ניתוח OCR
  AZURE_RESULT: {...},
  AZURE_TEXT: "..."
}
```

---

## 📤 פלט (Output) - 4 פלטים!

### **1. invoice_data**
JSON דוגמה ללמידה (לא לשליחה ל-Priority!)
```javascript
{
  PINVOICES: [{
    SUPNAME: "2511",
    BOOKNUM: "...",
    PIVDOC_SUBFORM: [...]
  }]
}
```

### **2. llm_prompt**
הנחיות בשפה טבעית:
```
"עבור ספק 2511 - פלסאון:
1. חפש BOOKNUM ב-UnidentifiedNumbers
2. התאם עם docs_list
3. יצור PIVDOC_SUBFORM
..."
```

### **3. technical_config**
קונפיג טכני מפורט:
```javascript
{
  extraction_rules: {
    booknum: {...},
    ivdate: {...},
    documents: {              // ⭐ חדש!
      search_in: [...],
      matching: {...},
      error_handling: {...}
    }
  }
}
```

### **4. processing_scenario**
מה לשלוף מהמערכת:
```javascript
{
  check_docs: true,
  check_import: false,
  check_vehicles: false
}
```

---

## ✨ תכונות מיוחדות

### **🆕 חדש ב-v4.2 (31.10.25):**

#### 1. **extraction_rules.documents** ב-technical_config
מסביר בדיוק איך לחפש תעודות:
- איפה לחפש (UnidentifiedNumbers + AZURE_TEXT fallback)
- איך להתאים עם docs_list
- איך לטפל בשגיאות

#### 2. **AZURE_TEXT fallback משופר**
```javascript
searchDocuments(ocrFields, azureText, patterns, docsList)
```
- חיפוש ראשון ב-UnidentifiedNumbers
- fallback עם regex מדויק ב-AZURE_TEXT
- מונע התאמות חלקיות

#### 3. **טיפול בשגיאות לתעודות**
- אם 0 תעודות נמצאו → ERROR
- אם תעודות חלקיות → WARNING
- דוח מפורט: "נמצאו 2 מתוך 4 תעודות"

---

## 🔧 פונקציות עיקריות

### **processInvoiceComplete(input)**
הפונקציה הראשית - מריצה את כל התהליך

### **שלב 1: זיהוי**
- `checkDocsInOCR()` - בדיקה אם יש תעודות
- `checkImportExists()` - בדיקה אם יש יבוא
- `identifyDebitType()` - חיוב/זיכוי
- `findMatchingTemplate()` - מציאת תבנית מתאימה

### **שלב 2: חיפוש**
- `searchBooknum()` - מספר חשבונית
- `searchIvdate()` - תאריך
- `searchDocuments()` - תעודות (BOOKNUM → DOCNO)
- `searchImpfnum()` - יבוא
- `extractVehiclesAdvanced()` - רכבים

### **שלב 3: בניה**
- `buildInvoiceFromTemplate()` - בניית JSON
- `shouldAddItems()` - האם צריך פירוט?
- `createVehicleItems()` - פריטי רכבים
- `buildItems()` - פריטים רגילים

### **שלב 4: יצירת הנחיות**
- `generateLLMPrompt()` - פלט 2
- `generateTechnicalConfig()` - פלט 3
- `processing_scenario` - פלט 4

---

## 📂 מבנה הספרייה

```
Processing Invoice/
├── v4.2-COMPLETE.js            ← הקוד הראשי (1500+ שורות)
├── SUMMARY-PROBLEMS-AND-SOLUTIONS.md
├── QA/
│   ├── 2511_input.txt          ← דוגמת קלט
│   ├── 2511_output.txt         ← דוגמת פלט
│   ├── input.txt
│   └── output.txt
├── Tests/                      ← סקריפטי בדיקה
│   ├── test-2511.js
│   ├── test-processing-scenario.js
│   └── ...
├── Debug/                      ← כלי דיבאג
│   ├── analyze-problem.js
│   ├── check-technical-config-docs.js
│   └── ...
└── Output/                     ← דוגמאות פלט
    ├── output-invoice-data.json
    ├── output-llm-prompt.json
    ├── output-technical-config.json
    └── output-processing-scenario.json
```

---

## 🔄 מיקום במערכת

```
┌────────────────────────┐
│ SupplierDataLearning   │ ← מודול 1
│   (Learning Mode)      │
└───────────┬────────────┘
            ↓ learned_config
┌────────────────────────┐
│ Processing Invoice     │ ← אתה כאן (מודול 2)
│   (Learning + Guide)   │
└───────────┬────────────┘
            ↓ template, structure, rules
┌────────────────────────┐
│ Production Invoice     │ ← מודול 3
│   (Execution)          │
└────────────────────────┘
```

---

## 🆚 ההבדל ממודול Production

| | Processing Invoice | Production Invoice |
|---|---|---|
| **מצב** | Learning | Production |
| **מטרה** | ללמוד מדוגמה | להריץ חשבונית חדשה |
| **קלט** | דוגמה + OCR | OCR חדש + הנחיות |
| **פלט** | 4 פלטים (הנחיות) | JSON סופי ל-Priority |
| **שימוש** | פעם אחת לספק | כל חשבונית חדשה |

---

## ✅ דוגמת שימוש

### ריצה:
```bash
cd "MakeCode/Processing Invoice"
node Tests/test-2511.js
```

### תוצאה צפויה:
```
✅ סטטוס: success
✅ 4 פלטים נוצרו:
   - invoice_data (דוגמה)
   - llm_prompt (הנחיות)
   - technical_config (קונפיג)
   - processing_scenario (מה לשלוף)
```

---

## 📝 שינויים בגרסה 4.2

### **31.10.2025:**
1. ✅ `extraction_rules.documents` בtechnical_config
2. ✅ AZURE_TEXT fallback משופר (regex)
3. ✅ טיפול בשגיאות לתעודות חסרות
4. ✅ תיעוד מפורט של כל הפונקציות

### **גרסאות קודמות:**
- v4.1 - חילוץ רכבים מתקדם
- v4.0 - תמיכה ב-VehicleNumbers
- v3.0 - UnidentifiedNumbers כמערך אובייקטים

---

## 💡 טיפים

### **איך לדבג?**
1. השתמש בסקריפטים ב-`Debug/`
2. בדוק את `execution_report.errors` ו-`warnings`
3. השווה ל-`QA/2511_output.txt`

### **איך להוסיף ספק חדש?**
1. הרץ SupplierDataLearning (מודול 1)
2. הרץ Processing Invoice (מודול 2) עם דוגמה
3. שמור את ה-4 פלטים
4. השתמש בהם ב-Production Invoice (מודול 3)

---

## 🐛 Troubleshooting

**בעיה:** "לא נמצאה תבנית מתאימה"
**פתרון:** בדוק ש-structure מכיל תבנית עם has_doc/has_import/debit_type מתאימים

**בעיה:** "תעודות לא נמצאו"
**פתרון:** בדוק:
1. BOOKNUM קיימים ב-UnidentifiedNumbers?
2. docs_list מכיל תעודות?
3. ההתאמה עובדת?

---

## 📚 קבצים חשובים

- `v4.2-COMPLETE.js` - הקוד הראשי
- `SUMMARY-PROBLEMS-AND-SOLUTIONS.md` - תיעוד בעיות ופתרונות
- `QA/2511_input.txt` - דוגמת קלט מלאה
- `Tests/test-2511.js` - בדיקה לספק 2511

---

**גרסה:** 4.2
**תאריך עדכון אחרון:** 31 אוקטובר 2025
**מחבר:** Claude Code (Anthropic)
