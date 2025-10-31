# Azure Invoice Processor v2.0

## 📋 תפקיד

מעבד OCR מתקדם שמנתח חשבוניות באמצעות Azure Document Intelligence API ומחלץ מידע מובנה.

---

## 🎯 מה המודול עושה?

**קלט:** תוצאות Azure OCR גולמיות
**פלט:** JSON מובנה עם שדות מזוהים + UnidentifiedNumbers

### תהליך:
1. **קבלת OCR** - מקבל analyzeResult מ-Azure
2. **חילוץ שדות** - מזהה שדות ידועים (InvoiceId, InvoiceDate, וכו')
3. **זיהוי פריטים** - מחלץ פריטים מטבלאות
4. **זיהוי ייחודי** - מזהה מספרים ייחודיים (תעודות, רכבים, קודי חלקים)
5. **החזרת תוצאה** - JSON מובנה לשימוש במודולים הבאים

---

## ✨ תכונות מיוחדות

### **🆕 חדש ב-v2.0 (31.10.25):**

#### 1. **זיהוי מספרי תעודות**
```javascript
extractDocumentNumbers(content, existing)
```
- זיהוי **DOCNO** (25XXXXXX - 8 ספרות)
- זיהוי **BOOKNUM** (108XXXXXX - 9 ספרות)
- מוסיף ל-UnidentifiedNumbers עם תווית מתאימה

#### 2. **סינון VIN מזויף**
```javascript
extractSpecialLengthNumbers(content, existing)
```
- מסנן מספרים שמתחילים ב-"202" (תאריכים)
- מונע זיהוי מוטעה של תאריכים כ-VIN

---

## 📥 קלט (Input)

```javascript
{
  azureJsonInput: {
    analyzeResult: {
      content: "...",      // טקסט גולמי
      tables: [...],       // טבלאות
      documents: [...]     // מסמכים מזוהים
    }
  }
}
```

---

## 📤 פלט (Output)

```javascript
{
  status: "success",

  structure: {
    docType: "invoice",
    fields: {...}
  },

  data: {
    docType: "invoice",
    fields: {
      InvoiceId: "...",
      InvoiceDate: "...",
      InvoiceTotal_amount: 1000,
      Items: [...],
      UnidentifiedNumbers: [
        {
          label: "מס׳ הקצאה (BOOKNUM)",
          value: "108379736",
          context: "..."
        },
        ...
      ]
    }
  },

  metadata: {
    modelId: "prebuilt-invoice",
    totalFields: 10,
    uniqueDataFound: 8
  }
}
```

---

## 🔧 פונקציות עיקריות

### **extractUniqueData()**
זיהוי דינמי של מידע ייחודי:
1. `extractLabelValuePairs()` - זוגות "כותרת: ערך"
2. `extractPartCodes()` - קודי חלקים (ABC-12345)
3. `extractVehicleNumbers()` - מספרי רכב (123-45-678)
4. `extractDocumentNumbers()` - מספרי תעודות (DOCNO, BOOKNUM) ⭐ חדש!
5. `extractSpecialLengthNumbers()` - מספרים באורכים מיוחדים (13, 17 ספרות)

### **extractRealItemsFromTable()**
חילוץ פריטים מטבלאות:
- מזהה טבלה ראשית
- מזהה כותרות עמודות
- מנקה פריטים לא רלוונטיים

### **detectNumbersByContext()**
זיהוי מספרים לפי הקשר:
- מספרי טלפון
- תאריכים
- פרטי בנק (IBAN, SWIFT)
- כתובות אימייל

---

## 📂 קבצים

```
AzureInvoiceProcessor/
├── v2.0(30.10.25)                  ← הקוד הראשי (27KB)
├── test-document-detection.js      ← בדיקת זיהוי תעודות
├── test-extract-documents.js       ← בדיקת extractDocumentNumbers()
└── test-vin-filter.js              ← בדיקת סינון VIN מזויף
```

---

## 🧪 בדיקות

### הרצת בדיקות:
```bash
# בדיקת זיהוי תעודות
node test-document-detection.js

# בדיקת פונקציית extractDocumentNumbers
node test-extract-documents.js

# בדיקת סינון VIN
node test-vin-filter.js
```

### תוצאות מוצלחות:
✅ זיהוי 4 DOCNO + 4 BOOKNUM
✅ סינון תאריכים (202X) מרשימת VIN
✅ כל המספרים מסומנים עם context ו-label

---

## 🔄 שימוש במערכת

```
Azure OCR
    ↓
┌────────────────────────┐
│ AzureInvoiceProcessor  │ ← אתה כאן
│       v2.0             │
└───────────┬────────────┘
            ↓
    AZURE_RESULT + AZURE_TEXT
            ↓
┌────────────────────────┐
│ Processing Invoice     │ ← מודול 2
│      (Learning)        │
└───────────┬────────────┘
            ↓
┌────────────────────────┐
│ Production Invoice     │ ← מודול 3
│    (Execution)         │
└────────────────────────┘
```

---

## 📝 שינויים בגרסה 2.0

### **31.10.2025:**
1. ✅ הוספת `extractDocumentNumbers()` - זיהוי DOCNO/BOOKNUM
2. ✅ שיפור `extractSpecialLengthNumbers()` - סינון VIN מזויף
3. ✅ תיעוד מלא של כל הפונקציות

---

## 💡 טיפים

### **למה UnidentifiedNumbers חשובים?**
מספרים אלה משמשים את המודולים הבאים למציאת:
- תעודות (BOOKNUM → docs_list)
- תיקי יבוא (IMPFNUM → import_files)
- רכבים (מספר רכב → vehicles)

### **איך לשפר זיהוי?**
1. הוסף תבניות חדשות ל-extractUniqueData()
2. שפר זיהוי תוויות (labels) בפונקציות
3. הוסף context לזיהוי מדויק יותר

---

## 🐛 Troubleshooting

**בעיה:** מספרי תעודות לא מזוהים
**פתרון:** בדוק שהתבנית `108\d{6}` או `25\d{6}` תואמת למספרים שלך

**בעיה:** VIN מזויף מזוהה
**פתרון:** המסנן כבר מטפל במספרים שמתחילים ב-202

**בעיה:** פריטים לא מזוהים בטבלה
**פתרון:** בדוק את זיהוי כותרות העמודות ב-guessFieldNameGeneric()

---

**גרסה:** 2.0
**תאריך עדכון אחרון:** 31 אוקטובר 2025
**מחבר:** Claude Code (Anthropic)
