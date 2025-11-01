# MakeCode - Invoice Processing System

## 🎯 סקירה כללית

מערכת שלמה לעיבוד אוטומטי של חשבוניות מ-OCR ל-Priority ERP.

**3 מודולים עיקריים + 2 כלי עזר**

---

## 📊 ארכיטקטורה

```
┌─────────────────────────────────────────────────────────┐
│                  Priority ERP                           │
│              (דוגמאות קיימות)                          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 1: SupplierDataLearning                           │
│ תפקיד: למידה ראשונית מדוגמאות                         │
│ קלט: חשבוניות קיימות מ-Priority                       │
│ פלט: learned_config (קונפיג + תבניות)                 │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Azure Document Intelligence API                         │
│ (OCR - זיהוי טקסט מתמונת חשבונית)                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ AzureInvoiceProcessor v2.0                             │
│ תפקיד: עיבוד OCR ← שדות מובנים                        │
│ קלט: Azure OCR גולמי                                   │
│ פלט: AZURE_RESULT + UnidentifiedNumbers                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 2: Processing Invoice v4.2                        │
│ תפקיד: למידה מדוגמה + יצירת הנחיות                    │
│ קלט: learned_config + AZURE_RESULT + דוגמה             │
│ פלט: 4 פלטים (invoice_data, llm_prompt,               │
│       technical_config, processing_scenario)            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 3: Production Invoice v1.0                        │
│ תפקיד: ייצור JSON סופי לחשבונית חדשה                  │
│ קלט: learned_config + AZURE_RESULT + נתונים חיים       │
│       (docs_list, import_files, vehicles)               │
│ פלט: JSON מוכן ל-Priority + execution_report           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐   ┌─────────────┐
│  cleanJson   │   │  Priority   │
│  (optional)  │   │     ERP     │
└──────────────┘   └─────────────┘
```

---

## 📁 מבנה הספריות

```
MakeCode/
│
├── SupplierDataLearning/           ← מודול 1
│   ├── v1.2(28.10.25)
│   └── README.md
│
├── AzureInvoiceProcessor/          ← כלי עזר
│   ├── v2.0(30.10.25)
│   ├── test-*.js
│   └── README.md
│
├── Processing Invoice/             ← מודול 2
│   ├── v4.2-COMPLETE.js
│   ├── QA/
│   ├── Tests/
│   ├── Debug/
│   ├── Output/
│   └── README.md
│
├── Production Invoice/             ← מודול 3
│   ├── execute-invoice.js
│   ├── QA/
│   └── README.md
│
├── cleanJson/                      ← כלי עזר
│   ├── v1
│   └── README.md
│
└── NewDocuments/                   ← זמני
    └── T.TXT
```

---

## 🔄 תהליך מלא - מחשבונית לJSON

### **שלב 0: הכנה (פעם אחת לספק)**
```
1. קבל דוגמאות חשבוניות מ-Priority
2. הרץ SupplierDataLearning → learned_config
3. שמור את ה-learned_config
```

### **שלב 1: למידה מדוגמה (פעם אחת לספק)**
```
1. קבל חשבונית דוגמה + OCR
2. הרץ AzureInvoiceProcessor → AZURE_RESULT
3. הרץ Processing Invoice → 4 פלטים
4. שמור את ההנחיות
```

### **שלב 2: ייצור (כל חשבונית חדשה)**
```
1. קבל חשבונית חדשה
2. הרץ Azure OCR
3. הרץ AzureInvoiceProcessor → AZURE_RESULT
4. שלוף נתונים (docs_list, import_files, vehicles)
5. הרץ Production Invoice → JSON סופי
6. (אופציונלי) הרץ cleanJson → ניקוי
7. שלח ל-Priority
```

---

## 📋 פירוט המודולים

### **1️⃣ SupplierDataLearning v1.2**
- **תפקיד:** למידה ראשונית מדוגמאות
- **קלט:** חשבוניות מ-Priority
- **פלט:** learned_config
- **שימוש:** פעם אחת לספק
- **📖 README:** [SupplierDataLearning/README.md](SupplierDataLearning/README.md)

### **2️⃣ Processing Invoice v4.2**
- **תפקיד:** למידה מדוגמה + יצירת הנחיות
- **קלט:** learned_config + AZURE_RESULT + דוגמה
- **פלט:** 4 פלטים (הנחיות)
- **שימוש:** פעם אחת לספק
- **📖 README:** [Processing Invoice/README.md](Processing%20Invoice/README.md)

### **3️⃣ Production Invoice v1.0** ⭐ חדש!
- **תפקיד:** ייצור JSON לחשבונית חדשה
- **קלט:** learned_config + AZURE_RESULT + נתונים חיים
- **פלט:** JSON סופי ל-Priority
- **שימוש:** כל חשבונית חדשה
- **📖 README:** [Production Invoice/README.md](Production%20Invoice/README.md)

---

## 🛠️ כלי עזר

### **AzureInvoiceProcessor v2.0**
- **תפקיד:** עיבוד OCR מ-Azure
- **קלט:** Azure OCR גולמי
- **פלט:** AZURE_RESULT מובנה
- **שימוש:** כל חשבונית (דוגמה או חדשה)
- **📖 README:** [AzureInvoiceProcessor/README.md](AzureInvoiceProcessor/README.md)

### **cleanJson v1**
- **תפקיד:** ניקוי JSON
- **קלט:** JSON גולמי
- **פלט:** JSON נקי + סיכום
- **שימוש:** לפני שליחה ל-Priority (אופציונלי)
- **📖 README:** [cleanJson/README.md](cleanJson/README.md)

---

## 🆚 ההבדלים בין המודולים

| מאפיין | Module 1 | Module 2 | Module 3 |
|---|---|---|---|
| **שם** | SupplierDataLearning | Processing Invoice | Production Invoice |
| **מצב** | Initial Learning | Learning + Guide | Production |
| **מטרה** | ללמוד מדוגמאות | ללמוד מדוגמה | להריץ חדש |
| **קלט** | חשבוניות מ-Priority | דוגמה + OCR | OCR + הנחיות |
| **פלט** | learned_config | 4 פלטים | JSON סופי |
| **תדירות** | פעם אחת | פעם אחת | כל חשבונית |
| **תלות** | - | Module 1 | Module 1 + 2 |

---

## ✅ Quick Start

### **ספק חדש - תהליך מלא:**

```bash
# שלב 0: למידה ראשונית
cd SupplierDataLearning
# הרץ עם דוגמאות מ-Priority
# שמור learned_config

# שלב 1: למידה מדוגמה
cd ../AzureInvoiceProcessor
# הרץ עם OCR של דוגמה
# קבל AZURE_RESULT

cd "../Processing Invoice"
# הרץ עם learned_config + AZURE_RESULT
# שמור 4 פלטים

# שלב 2: production (חשבונית חדשה)
cd ../AzureInvoiceProcessor
# הרץ עם OCR חדש

cd "../Production Invoice"
# הרץ עם כל הנתונים
# קבל JSON סופי → שלח ל-Priority
```

---

## 🎓 דוגמה מלאה - ספק 2511

### **Input:**
- ספק: פלסאון בע"מ (2511)
- חשבונית עם 4 תעודות
- BOOKNUM: 108379736, 108379734, 108367753, 108367755

### **Process:**
1. AzureInvoiceProcessor → זיהה 4 BOOKNUM ב-UnidentifiedNumbers
2. Production Invoice → התאים עם docs_list
3. קיבל 4 DOCNO: 25026849, 25026850, 25026832, 25026831

### **Output:**
```javascript
{
  PINVOICES: [{
    SUPNAME: "2511",
    BOOKNUM: "60000013",
    IVDATE: "28/10/25",
    PIVDOC_SUBFORM: [
      { DOCNO: "25026849", BOOKNUM: "108379736" },
      { DOCNO: "25026850", BOOKNUM: "108379734" },
      { DOCNO: "25026832", BOOKNUM: "108367753" },
      { DOCNO: "25026831", BOOKNUM: "108367755" }
    ]
  }]
}
```

---

## 📝 עדכונים אחרונים

### **31 אוקטובר 2025:**

#### **AzureInvoiceProcessor v2.0**
- ✅ הוספת `extractDocumentNumbers()` - זיהוי BOOKNUM
- ✅ סינון VIN מזויף (תאריכים 202X)

#### **Processing Invoice v4.2**
- ✅ `extraction_rules.documents` בtechnical_config
- ✅ AZURE_TEXT fallback משופר
- ✅ טיפול בשגיאות לתעודות

#### **Production Invoice v1.0** ⭐ חדש!
- ✅ מודול חדש לייצור JSON בproduction
- ✅ נבדק עם ספק 2511
- ✅ תיעוד מלא

---

## 🐛 Troubleshooting כללי

### **בעיה:** חשבונית לא מעובדת נכון
**צעדי דיבאג:**
1. בדוק AZURE_RESULT - האם ה-OCR תקין?
2. בדוק learned_config - האם יש תבנית מתאימה?
3. הרץ Processing Invoice במצב debug
4. בדוק execution_report

### **בעיה:** תעודות לא נמצאות
**פתרון:**
1. בדוק AzureInvoiceProcessor - BOOKNUM ב-UnidentifiedNumbers?
2. בדוק docs_list - התעודות קיימות?
3. בדוק Production Invoice - ההתאמה עובדת?

---

## 📚 מסמכים נוספים

- [SupplierDataLearning README](SupplierDataLearning/README.md)
- [AzureInvoiceProcessor README](AzureInvoiceProcessor/README.md)
- [Processing Invoice README](Processing%20Invoice/README.md)
- [Production Invoice README](Production%20Invoice/README.md)
- [cleanJson README](cleanJson/README.md)

---

## 🤝 תמיכה

לשאלות ובעיות: פנה למפתח המערכת

---

**גרסת מערכת:** 1.0
**תאריך עדכון אחרון:** 31 אוקטובר 2025
**מחבר:** Claude Code (Anthropic)
