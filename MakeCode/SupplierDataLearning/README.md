# Supplier Data Learning v1.2

## 📋 תפקיד

**מודול למידה ראשוני** שמנתח חשבוניות קיימות במערכת Priority ולומד איך לעבד חשבוניות מספק מסוים.

**זהו מודול 1** במערכת - הנקודה ההתחלתית!

---

## 🎯 מה המודול עושה?

**מצב:** Initial Learning Mode
**מטרה:** ללמוד מדוגמאות קיימות במערכת

### תהליך:
1. **קבלת דוגמאות** - חשבוניות שכבר נכנסו ל-Priority
2. **ניתוח תבניות** - מזהה מבנים חוזרים
3. **זיהוי חוקים** - לומד חוקים (תעודות, יבוא, רכבים)
4. **יצירת קונפיג** - מייצר learned_config לשימוש במודולים הבאים

---

## 📥 קלט (Input)

```javascript
{
  // דוגמאות חשבוניות מ-Priority
  invoices: [
    {
      PINVOICES: [{
        SUPNAME: "2511",
        BOOKNUM: "...",
        IVDATE: "...",
        PIVDOC_SUBFORM: [...],    // אם יש תעודות
        PINVOICEITEMS_SUBFORM: [...] // אם יש פירוט
      }]
    },
    ...
  ]
}
```

---

## 📤 פלט (Output)

```javascript
{
  status: "success",
  supplier_id: "2511",
  supplier_name: "פלסאון בע\"מ",
  vendor_tax_id_reference: "512865254",
  json_files_analyzed: 10,
  templates_detected: 2,

  config: {
    supplier_config: {
      supplier_code: "2511",
      supplier_name: "...",
      vendor_tax_id_reference: "..."
    },

    structure: [
      {
        has_import: false,
        has_purchase_orders: false,
        has_doc: true,
        has_date_range: false,
        inventory_management: "managed_inventory",
        debit_type: "D"
      },
      // תבניות נוספות...
    ],

    rules: {
      invoice_date_format: "DD/MM/YY",
      critical_patterns: {
        vehicle_rules: {...}    // אם יש רכבים
      }
    },

    document_types: [
      {
        type: "חשבונית עם תעודות",
        accnames: ["63001"]
      }
    ]
  },

  template: {
    PINVOICES: [
      {
        CODE: "I",
        DETAILS: "...",
        ACCNAME: "63001",
        PIVDOC_SUBFORM: [...]
      }
    ]
  },

  recommended_samples: {...}
}
```

---

## ✨ מה נלמד?

### 1. **זיהוי מבנים (structure)**
- האם יש תעודות? (`has_doc`)
- האם יש יבוא? (`has_import`)
- האם יש רכבים? (נלמד מ-vehicle_account_mapping)
- חיוב או זיכוי? (`debit_type`)

### 2. **תבניות (template)**
- מבנה JSON לפי סוג חשבונית
- שדות קבועים (CODE, ACCNAME וכו')
- PIVDOC_SUBFORM / PINVOICEITEMS_SUBFORM

### 3. **חוקים (rules)**
- פורמט תאריך
- חוקי רכבים (אם קיימים)
- תבניות מיוחדות

---

## 🔧 פונקציות עיקריות

### **identifyDocumentType(invoice)**
מזהה סוג מסמך:
- חשבונית עם תעודות
- חשבונית עם פירוט
- חשבונית עם יבוא
- וכו'

### **extractVehicleRules(invoices)**
לומד חוקי רכבים:
- מיפוי רכב → חשבון (ACCNAME)
- תבניות VAT
- BUDCODE

### **buildTemplate(invoices, structure)**
בונה תבנית JSON:
- שדות קבועים
- SUBFORM מתאימים
- ברירות מחדל

---

## 📂 קבצים

```
SupplierDataLearning/
└── v1.2(28.10.25)                  ← הקוד הראשי (26KB)
```

---

## 🔄 מיקום במערכת

```
Priority ERP (דוגמאות קיימות)
    ↓
┌────────────────────────┐
│ SupplierDataLearning   │ ← אתה כאן (מודול 1)
│   (Initial Learning)   │
└───────────┬────────────┘
            ↓ learned_config
┌────────────────────────┐
│ Processing Invoice     │ ← מודול 2
│   (Learning + Guide)   │
└───────────┬────────────┘
            ↓ template + rules
┌────────────────────────┐
│ Production Invoice     │ ← מודול 3
│   (Execution)          │
└────────────────────────┘
```

---

## ✅ דוגמת שימוש

### קלט:
```javascript
// דוגמאות מ-Priority
const invoices = [
  { PINVOICES: [{...}] },
  { PINVOICES: [{...}] },
  ...
];
```

### הרצה:
```javascript
const result = learnSupplierData(invoices);
```

### פלט:
```javascript
{
  status: "success",
  config: {...},
  template: {...}
}
```

---

## 📝 שינויים בגרסה 1.2

### **28.10.2025:**
1. ✅ מבנה JSON חדש
2. ✅ לוגיקה משופרת
3. ✅ תמיכה ברכבים
4. ✅ DEBIT כתבנית נפרדת

---

## 💡 טיפים

### **כמה דוגמאות צריך?**
- מינימום: 3-5 חשבוניות
- מומלץ: 10+ חשבוניות
- אידיאלי: כל סוגי החשבוניות של הספק

### **איך לשפר למידה?**
1. הוסף דוגמאות מגוונות
2. ודא שיש דוגמאות לכל מצב (תעודות/יבוא/רכבים)
3. בדוק consistency בין הדוגמאות

---

## 🐛 Troubleshooting

**בעיה:** "לא מספיק דוגמאות"
**פתרון:** הוסף עוד חשבוניות מאותו ספק

**בעיה:** "תבניות סותרות"
**פתרון:** בדוק שהחשבוניות אכן מאותו ספק

---

## 🔗 קישורים

- **המשך:** Processing Invoice (מודול 2)
- **שימוש:** Production Invoice (מודול 3)

---

**גרסה:** 1.2
**תאריך עדכון אחרון:** 28 אוקטובר 2025
**מחבר:** Claude Code (Anthropic)
