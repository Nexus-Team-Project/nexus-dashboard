# איפיון מערכת מתנות - Nexus Dashboard
## מסמך אינטגרציה, מחזור חיים, ושימוש

> גרסה: 1.0 | תאריך: 30/03/2026

---

## תוכן עניינים

1. [אינטגרציה עם מודולים אחרים](#1-אינטגרציה-עם-מודולים-אחרים)
2. [מחזור חיים של מתנה (Gift Lifecycle)](#2-מחזור-חיים-של-מתנה)
3. [ניהול תפוגה](#3-ניהול-תפוגה)
4. [אמצעי שליחה - Email / SMS / שניהם](#4-אמצעי-שליחה)
5. [מודל הזמנה (Gift Order)](#5-מודל-הזמנה)
6. [שימוש במתנה (Redemption)](#6-שימוש-במתנה)
7. [מתנות שפג תוקפן (Expiry & Reclamation)](#7-מתנות-שפג-תוקפן)
8. [מודל נתונים מוצע](#8-מודל-נתונים-מוצע)
9. [API Endpoints נדרשים](#9-api-endpoints-נדרשים)

---

## 1. אינטגרציה עם מודולים אחרים

מערכת המתנות אינה מודול עצמאי - היא משתלבת עם כל שאר מודולי הדאשבורד:

### 1.1 אינטגרציה עם מודול משתמשים (Users)

| נקודת חיבור | תיאור |
|---|---|
| **נמעני מתנות** | בעת הוספת נמענים (שלב 4), ניתן לשלוף אנשי קשר ממערכת המשתמשים (`AdminUser`) - כולל שם, אימייל, טלפון |
| **פרופיל משתמש** | כל משתמש צריך לראות את המתנות שקיבל בפרופיל שלו - מתנות פעילות, שנוצלו, ושפג תוקפן |
| **חברי ארגון** | `OrgMember` - אפשר לשלוח מתנות לכל חברי הארגון או לקבוצות מסוימות |
| **הרשאות** | רק בעלי הרשאה (`OWNER` / `ADMIN`) יכולים לשלוח מתנות מטעם הארגון |

### 1.2 אינטגרציה עם מודול טרנזקציות (Transactions)

| נקודת חיבור | תיאור |
|---|---|
| **סוג טרנזקציה חדש** | הוספת `type: 'gift'` ל-`TransactionType` הקיים (`payment`, `payout`, `topup`, `refund`, `third_party`) |
| **סטטוס תשלום** | שימוש באותם סטטוסים: `pending` → `successful` → (אופציונלי `refunded`) |
| **אמצעי תשלום** | שימוש באותם `PaymentMethod` - כרטיס אשראי, יתרת חשבון, bit וכו' |
| **היסטוריה** | כל רכישת מתנה מופיעה בדף הטרנזקציות הכללי עם סימון שזו מתנה |
| **חיוב חוזר (Reclamation)** | כשמתנה פגת תוקף - הכסף חוזר ליתרה, מה שיוצר טרנזקציה מסוג `topup` |

### 1.3 אינטגרציה עם מודול יתרות (Balances)

| נקודת חיבור | תיאור |
|---|---|
| **חיוב יתרה** | תשלום מיתרת חשבון מקטין את היתרה בעת שליחת מתנה |
| **החזר יתרה** | מתנה שפג תוקפה → הסכום חוזר ליתרת הארגון |
| **מתנה ≠ טעינה** | מתנה היא **לא** טעינת כסף רגילה. בעוד טעינה היא ללא הגבלת זמן, **למתנה יש תאריך תפוגה** |
| **תצוגת יתרה** | בדף היתרות צריך להבחין בין "יתרה טעונה" (ללא תפוגה) לבין "יתרת מתנה" (עם תפוגה) |

### 1.4 אינטגרציה עם מודול הטבות ושותפויות (Benefits & Partnerships)

| נקודת חיבור | תיאור |
|---|---|
| **מותגים** | רשימת המותגים (brands) בשלב 2 של האשף מגיעה ממערכת ה-Benefits |
| **שיטת מימוש** | ה-`implementationMethod` של ההטבה (`voucher`, `coupon`, `card`, `nexus`) קובע איך המתנה תמומש |
| **קטגוריות** | קטגוריות המתנות חופפות לקטגוריות ההטבות (אוכל, קניות, בידור, טכנולוגיה וכו') |
| **תנאי שימוש** | `usageTerms` של ההטבה חלים גם על המתנה |

### 1.5 אינטגרציה עם מודול שיווק (Marketing - SMS/Email)

| נקודת חיבור | תיאור |
|---|---|
| **שליחת מייל** | שימוש באותה תשתית Email Campaigns לשליחת הודעות ברכה |
| **שליחת SMS** | שימוש באותה תשתית SMS Campaigns לשליחת לינק למתנה |
| **תבניות** | אפשרות לשמור תבניות ברכה ולהשתמש בהן מחדש |
| **דוחות משלוח** | מעקב delivery rate, open rate, click rate של הודעות המתנה |

### 1.6 אינטגרציה עם הדאשבורד הראשי (Home)

| נקודת חיבור | תיאור |
|---|---|
| **גרפים** | סה"כ מתנות שנשלחו, סכומים, טרנד שימוש - מופיעים בגרפי ה-Home |
| **התראות** | מתנות שעומדות לפוג תוקף מופיעות כהתראות |
| **פעולות מהירות** | כפתור "שלח מתנה" זמין מהדאשבורד הראשי |

### 1.7 אינטגרציה עם מערכת ההזמנות (Invites)

| נקודת חיבור | תיאור |
|---|---|
| **שליחה לאורחים** | אפשר לשלוח מתנות גם למי שעדיין לא חבר בארגון, דרך לינק ייחודי (בדומה ל-`OrgInvite`) |
| **רישום דרך מתנה** | מקבל מתנה שאינו רשום יכול להירשם למערכת דרך לינק המתנה |

---

## 2. מחזור חיים של מתנה (Gift Lifecycle)

```
┌─────────────┐     ┌──────────┐     ┌──────────┐     ┌───────────┐     ┌──────────┐
│   DRAFT     │────>│ PENDING  │────>│  SENT    │────>│  VIEWED   │────>│ REDEEMED │
│  (טיוטה)    │     │ (ממתין)  │     │ (נשלח)   │     │ (נצפה)    │     │ (מומש)   │
└─────────────┘     └──────────┘     └──────────┘     └───────────┘     └──────────┘
                         │                │                 │
                         │                │                 │           ┌──────────┐
                         ▼                ▼                 ▼           │ PARTIALLY │
                    ┌──────────┐    ┌───────────┐    ┌───────────┐     │ REDEEMED  │
                    │ FAILED   │    │ DELIVERY  │    │  EXPIRED  │     │(מומש חלקי)│
                    │ (נכשל)   │    │  FAILED   │    │ (פג תוקף) │     └──────────┘
                    └──────────┘    │(שליחה     │    └───────────┘
                                   │ נכשלה)    │          │
                                   └───────────┘          ▼
                                                    ┌───────────┐
                                                    │ RECLAIMED │
                                                    │(הוחזר     │
                                                    │ לחשבון)   │
                                                    └───────────┘
```

### תיאור הסטטוסים

| סטטוס | תיאור | פעולות אפשריות |
|---|---|---|
| `DRAFT` | המתנה נוצרה אך טרם שולמה / אושרה | עריכה, מחיקה, אישור |
| `PENDING` | התשלום בוצע, ממתין לשליחה (מתוזמן או בעיבוד) | ביטול (עם החזר כספי) |
| `SENT` | ההודעה נשלחה לנמען (מייל/SMS/שניהם) | שליחה חוזרת, ביטול |
| `DELIVERY_FAILED` | השליחה נכשלה (מייל חזר, SMS לא הגיע) | שליחה חוזרת, עדכון פרטי קשר |
| `VIEWED` | הנמען פתח את ההודעה / לינק המתנה | - |
| `REDEEMED` | המתנה מומשה במלואה | - |
| `PARTIALLY_REDEEMED` | חלק מהסכום נוצל (אם המתנה מאפשרת מימוש חלקי) | מימוש נוסף |
| `EXPIRED` | עבר תאריך התפוגה ללא מימוש (או עם מימוש חלקי) | - |
| `RECLAIMED` | סכום מתנה שפגה הוחזר לחשבון הארגון | - |
| `FAILED` | התשלום נכשל | ניסיון חוזר, שינוי אמצעי תשלום |

---

## 3. ניהול תפוגה

### 3.1 מתנה vs. טעינת כסף רגילה

| מאפיין | טעינת כסף (Top-up) | מתנה (Gift) |
|---|---|---|
| **תפוגה** | אין תאריך תפוגה | **יש תאריך תפוגה** |
| **מקור** | הארגון טוען לעצמו | הארגון שולח לנמען |
| **בעלות** | הארגון | הנמען |
| **מימוש** | שימוש חופשי | מוגבל למותגים שנבחרו |
| **החזר** | לא רלוונטי | סכום שלא נוצל חוזר לארגון בתפוגה |
| **TransactionType** | `topup` | `gift` |

### 3.2 הגדרת תפוגה

```
ברירת מחדל: 12 חודשים מיום השליחה
מינימום: 30 ימים (דרישה רגולטורית)
מקסימום: 36 חודשים
מותאם אישית: הארגון יכול לקבוע תאריך ספציפי
```

### 3.3 התראות תפוגה

| תזמון | פעולה | נמען ההתראה |
|---|---|---|
| 30 יום לפני תפוגה | התראה ראשונה | מקבל המתנה (Email + Push) |
| 14 יום לפני תפוגה | תזכורת שנייה | מקבל המתנה (Email + SMS) |
| 3 ימים לפני תפוגה | התראה אחרונה דחופה | מקבל המתנה (Email + SMS + Push) |
| יום התפוגה | סיכום למנהל | שולח המתנה / מנהל הארגון |
| יום אחרי תפוגה | ביצוע Reclamation | מערכת אוטומטית |

---

## 4. אמצעי שליחה

### 4.1 אפשרויות שליחה

| אפשרות | תיאור |
|---|---|
| **Email בלבד** | הודעת ברכה מעוצבת עם לינק למתנה |
| **SMS בלבד** | הודעה קצרה עם לינק למתנה |
| **Email + SMS** | שניהם - המייל מכיל את הברכה המלאה, ה-SMS מכיל תזכורת עם לינק |

### 4.2 תוכן לפי אמצעי

**Email:**
```
- כרטיס ברכה מעוצב (4 סגנונות: classic, minimal, overlay, custom)
- תמונת רקע
- טקסט ברכה עם @firstName, @lastName
- שם השולח
- לוגו הארגון
- כפתור CTA: "לקבלת המתנה"
- פוטר עם תנאי שימוש ותאריך תפוגה
```

**SMS:**
```
- הודעה קצרה (עד 160 תווים)
- שם השולח
- סכום המתנה
- לינק מקוצר לדף המתנה
- תאריך תפוגה
```

### 4.3 לוגיקת שליחה

```typescript
// כל נמען מקבל לפי הבחירה של השולח:
interface DeliveryConfig {
  channels: ('email' | 'sms')[];  // לפחות אחד, אפשר שניהם
  timing: 'immediate' | 'scheduled';
  scheduledDate?: Date;           // רק אם timing === 'scheduled'

  // retry policy
  maxRetries: 3;
  retryIntervalMinutes: 30;
}
```

### 4.4 מעקב שליחה (Delivery Tracking)

| אירוע | תיאור | נרשם ב-DB |
|---|---|---|
| `QUEUED` | ההודעה בתור לשליחה | timestamp |
| `SENT` | נשלחה בהצלחה ל-provider | timestamp + messageId |
| `DELIVERED` | הגיעה לתיבת הדואר / מכשיר | timestamp |
| `OPENED` | הנמען פתח את המייל | timestamp |
| `CLICKED` | הנמען לחץ על הלינק | timestamp |
| `BOUNCED` | המייל חזר (כתובת לא תקינה) | timestamp + reason |
| `FAILED` | השליחה נכשלה | timestamp + error |

---

## 5. מודל הזמנה (Gift Order)

כל שליחת מתנות מייצרת **הזמנה** (`GiftOrder`) שמכילה פריטים בודדים (`GiftItem`) - אחד לכל נמען.

### 5.1 מבנה ההזמנה

```
GiftOrder (הזמנה)
├── orderId: "ORD-2026-00142"
├── orgId: "org_abc123"
├── createdBy: "user_xyz"           ← מי יצר את ההזמנה
├── status: "completed"
├── event: { name, imageUrl }
├── brands: [{ id, name }]          ← מותגים שנבחרו
├── greetingTemplate: { ... }        ← תבנית הברכה
├── deliveryChannels: ["email", "sms"]
├── timing: "immediate" | "scheduled"
├── scheduledDate?: Date
├── paymentMethod: "credit_card" | "balance"
├── paymentTransactionId: "txn_..."
├── totalAmount: 3750
├── currency: "ILS"
├── createdAt: "2026-03-30T10:00:00Z"
│
├── items: [
│   ├── GiftItem #1
│   │   ├── recipientName: "דניאל רביב"
│   │   ├── recipientEmail: "daniel@example.com"
│   │   ├── recipientPhone: "050-1234567"
│   │   ├── amount: 250
│   │   ├── personalGreeting?: "מזל טוב!"
│   │   ├── status: "redeemed"
│   │   ├── expiresAt: "2027-03-30"
│   │   ├── redemptionCode: "GIFT-XXXX-YYYY"
│   │   ├── redemptionUrl: "https://nexus.app/gift/XXXX-YYYY"
│   │   ├── deliveryStatus: { email: "delivered", sms: "delivered" }
│   │   ├── redeemedAmount: 250
│   │   └── redeemedAt: "2026-05-15"
│   │
│   ├── GiftItem #2
│   │   ├── recipientName: "שרה כהן"
│   │   ├── amount: 250
│   │   ├── status: "viewed"
│   │   ├── expiresAt: "2027-03-30"
│   │   └── ...
│   │
│   └── GiftItem #3 (15 items total)
│       └── ...
│
└── summary:
    ├── totalItems: 15
    ├── sent: 14
    ├── deliveryFailed: 1
    ├── viewed: 10
    ├── redeemed: 5
    ├── expired: 0
    └── totalRedeemedAmount: 1250
```

### 5.2 תצוגת הזמנה בדאשבורד

ההזמנה מופיעה ב-3 מקומות:

1. **דף נקודות ומתנות** (`/points-gifts`) - טבלת "מתנות אחרונות" עם סיכום לכל הזמנה
2. **דף טרנזקציות** (`/transactions`) - כשורת תשלום עם סוג `gift`
3. **דף פירוט הזמנה** (`/gift-orders/:orderId`) - **דף חדש נדרש** - עם כל הפריטים, סטטוסים, ופעולות

### 5.3 סטטוסי הזמנה ברמת הפריט (Item-level)

```
לכל GiftItem יש:
├── status:          סטטוס המתנה עצמה (draft → sent → viewed → redeemed / expired)
├── deliveryStatus:  סטטוס השליחה לכל ערוץ ({ email: "delivered", sms: "bounced" })
├── paymentStatus:   סטטוס התשלום (successful / refunded)
└── redemptionStatus: סטטוס המימוש (unused / partial / full / expired / reclaimed)
```

---

## 6. שימוש במתנה (Redemption)

### 6.1 תהליך מימוש מצד המקבל

```
1. מקבל הודעה (Email / SMS) עם לינק ייחודי
2. לוחץ על הלינק → מגיע לדף המתנה
3. רואה: ברכה, סכום, מותגים זמינים, תאריך תפוגה
4. בוחר מותג / חנות
5. מקבל קוד מימוש (voucher / coupon / QR code)
6. משתמש בקוד בחנות / באתר של המותג
```

### 6.2 שיטות מימוש

| שיטה | תיאור | קישור ל-Benefit |
|---|---|---|
| **Voucher** | קוד ייחודי חד-פעמי | `implementationMethod: 'voucher'` |
| **Coupon Code** | קוד הנחה לשימוש באתר | `implementationMethod: 'coupon'` |
| **QR Code** | סריקה בחנות פיזית | `implementationMethod: 'card'` |
| **לינק ישיר** | מפנה לאתר השותף עם הטבה אוטומטית | `implementationMethod: 'nexus'` |
| **רישום לשירות** | הרשמה לשירות כמתנה | `implementationMethod: 'registration'` |
| **מוצר** | משלוח מוצר פיזי | `implementationMethod: 'product'` |

### 6.3 מימוש חלקי

```typescript
// אם מתנה של 500₪ ומומשו רק 300₪:
{
  amount: 500,
  redeemedAmount: 300,
  remainingAmount: 200,   // ← עדיין זמין לשימוש
  status: 'partially_redeemed',
  redemptions: [
    { date: "2026-04-15", amount: 200, brand: "סופר-פארם", method: "voucher" },
    { date: "2026-05-01", amount: 100, brand: "אמזון", method: "coupon" }
  ]
}
```

### 6.4 API - פעולות מימוש

```
POST   /api/gifts/:giftId/redeem          ← מימוש מתנה (מלא או חלקי)
GET    /api/gifts/:giftId/redemptions      ← היסטוריית מימושים
GET    /api/gifts/:giftId/balance          ← יתרה זמינה במתנה
POST   /api/gifts/:giftId/transfer         ← העברת מתנה לאדם אחר (אופציונלי)
```

---

## 7. מתנות שפג תוקפן (Expiry & Reclamation)

### 7.1 תהליך Reclamation אוטומטי

```
תאריך תפוגה הגיע
        │
        ▼
  ┌─────────────┐
  │ בדיקה:       │
  │ האם נוצלה    │
  │ המתנה?       │
  └──────┬──────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  מלא     חלקי / לא
    │         │
    ▼         ▼
  סגור    חישוב סכום
  מתנה    שלא נוצל
            │
            ▼
      ┌──────────────┐
      │ החזרת סכום    │
      │ ליתרת הארגון  │
      │ (TransactionType: │
      │  'topup')     │
      └──────────────┘
            │
            ▼
      ┌──────────────┐
      │ עדכון סטטוס:  │
      │ RECLAIMED     │
      └──────────────┘
            │
            ▼
      ┌──────────────┐
      │ התראה למנהל   │
      │ על ההחזר      │
      └──────────────┘
```

### 7.2 חישוב Reclamation

```typescript
interface ReclamationResult {
  giftItemId: string;
  originalAmount: number;        // סכום מקורי
  redeemedAmount: number;        // סכום שנוצל
  reclaimedAmount: number;       // סכום שחוזר לארגון
  reclaimedAt: Date;
  creditedToOrgId: string;       // לאיזה ארגון חוזר הכסף
  transactionId: string;         // ID של טרנזקציית ההחזר
}

// דוגמה:
// מתנה של 500₪, נוצלו 200₪, פג תוקף
// → reclaimedAmount = 300₪ חוזרים לארגון
```

### 7.3 דוח תפוגות

דף חדש או חלק בדף `PointsGifts` שמציג:

| עמודה | תיאור |
|---|---|
| שם המתנה / הזמנה | שם האירוע + מספר הזמנה |
| נמען | שם מקבל המתנה |
| סכום מקורי | הסכום שנשלח |
| סכום שנוצל | כמה ממנו מומש |
| סכום שהוחזר | מה חזר לארגון |
| תאריך תפוגה | מתי פג התוקף |
| סטטוס | expired / reclaimed |

### 7.4 Job אוטומטי - Reclamation Scheduler

```
Schedule: כל יום בשעה 02:00 (לילה)
Logic:
  1. שלוף את כל ה-GiftItems עם expiresAt <= today AND status NOT IN ('redeemed', 'reclaimed', 'failed')
  2. לכל אחד:
     a. חשב reclaimedAmount = amount - redeemedAmount
     b. אם reclaimedAmount > 0:
        - צור טרנזקציה מסוג topup לארגון
        - עדכן סטטוס ל-RECLAIMED
        - שלח התראה למנהל
     c. אם reclaimedAmount === 0:
        - עדכן סטטוס ל-EXPIRED (נוצל לגמרי, פשוט סגור)
  3. צור דוח יומי של כל ה-reclamations
```

---

## 8. מודל נתונים מוצע

### 8.1 Prisma Schema

```prisma
model GiftOrder {
  id                String       @id @default(cuid())
  orgId             String
  createdByUserId   String

  // Event
  eventName         String
  eventImageUrl     String?
  eventType         String?

  // Brands
  selectedBrands    Json         // [{ id, name, category }]

  // Greeting
  greetingTemplate  Json         // { messageType, subjectLine, senderName, text, layoutStyle, cardImageUrl }

  // Delivery
  deliveryChannels  String[]     // ['email', 'sms']
  timing            String       // 'immediate' | 'scheduled'
  scheduledDate     DateTime?

  // Payment
  paymentMethod     String       // 'credit_card' | 'balance'
  paymentStatus     String       // 'pending' | 'successful' | 'failed' | 'refunded'
  transactionId     String?
  totalAmount       Decimal
  currency          String       @default("ILS")

  // Status
  status            String       @default("draft") // draft | pending | processing | completed | cancelled

  // Expiry
  expiresAt         DateTime     // תאריך תפוגה כללי להזמנה
  expiryDays        Int          @default(365)

  // Timestamps
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  // Relations
  org               Org          @relation(fields: [orgId], references: [id])
  createdBy         User         @relation(fields: [createdByUserId], references: [id])
  items             GiftItem[]
}

model GiftItem {
  id                 String       @id @default(cuid())
  orderId            String

  // Recipient
  recipientName      String
  recipientEmail     String?
  recipientPhone     String?
  recipientUserId    String?      // אם הנמען רשום במערכת

  // Amount
  amount             Decimal
  personalGreeting   String?

  // Redemption
  redemptionCode     String       @unique
  redemptionUrl      String
  redeemedAmount     Decimal      @default(0)

  // Status
  status             String       @default("pending")
  // pending | sent | delivery_failed | viewed | partially_redeemed | redeemed | expired | reclaimed

  // Delivery Tracking
  emailStatus        String?      // queued | sent | delivered | opened | clicked | bounced | failed
  smsStatus          String?      // queued | sent | delivered | failed
  emailSentAt        DateTime?
  smsSentAt          DateTime?
  emailOpenedAt      DateTime?
  linkClickedAt      DateTime?

  // Expiry & Reclamation
  expiresAt          DateTime
  reclaimedAmount    Decimal?
  reclaimedAt        DateTime?

  // Timestamps
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt
  redeemedAt         DateTime?

  // Relations
  order              GiftOrder    @relation(fields: [orderId], references: [id])
  recipientUser      User?        @relation(fields: [recipientUserId], references: [id])
  redemptions        GiftRedemption[]
}

model GiftRedemption {
  id               String       @id @default(cuid())
  giftItemId       String
  amount           Decimal
  brandId          String?
  brandName        String
  method           String       // voucher | coupon | qr | link | registration | product
  voucherCode      String?

  createdAt        DateTime     @default(now())

  // Relations
  giftItem         GiftItem     @relation(fields: [giftItemId], references: [id])
}
```

---

## 9. API Endpoints נדרשים

### 9.1 Gift Orders

```
POST   /api/gift-orders                    ← יצירת הזמנה חדשה (כל 5 השלבים)
GET    /api/gift-orders                    ← רשימת הזמנות (עם פילטרים)
GET    /api/gift-orders/:orderId           ← פרטי הזמנה מלאים
PATCH  /api/gift-orders/:orderId           ← עדכון הזמנה (רק DRAFT)
DELETE /api/gift-orders/:orderId           ← ביטול הזמנה
POST   /api/gift-orders/:orderId/send      ← שליחת הזמנה (DRAFT → PENDING → SENT)
POST   /api/gift-orders/:orderId/cancel    ← ביטול + החזר כספי
```

### 9.2 Gift Items

```
GET    /api/gift-orders/:orderId/items     ← רשימת פריטים בהזמנה
GET    /api/gift-items/:itemId             ← פרטי פריט בודד
PATCH  /api/gift-items/:itemId             ← עדכון פרטי נמען
POST   /api/gift-items/:itemId/resend      ← שליחה חוזרת
POST   /api/gift-items/:itemId/cancel      ← ביטול פריט בודד
```

### 9.3 Redemption (צד המקבל - Public API)

```
GET    /api/gifts/:redemptionCode          ← דף המתנה הפומבי
POST   /api/gifts/:redemptionCode/redeem   ← מימוש (מלא או חלקי)
GET    /api/gifts/:redemptionCode/balance  ← בדיקת יתרה
GET    /api/gifts/:redemptionCode/brands   ← מותגים זמינים למימוש
```

### 9.4 Reports & Analytics

```
GET    /api/gift-reports/summary           ← סיכום כללי (סה"כ נשלח, מומש, פג תוקף)
GET    /api/gift-reports/expiring          ← מתנות שעומדות לפוג
GET    /api/gift-reports/reclamations      ← דוח החזרים
GET    /api/gift-reports/delivery          ← דוח שליחות (rates)
```

### 9.5 Admin

```
POST   /api/admin/gifts/reclaim            ← הפעלת reclamation ידני
GET    /api/admin/gifts/expiry-settings    ← הגדרות תפוגה
PATCH  /api/admin/gifts/expiry-settings    ← עדכון הגדרות תפוגה
```

---

## 10. מגבלות שימוש בכסף מתנה בהטבות (Gift Fund Restrictions)

### 10.1 עיקרון מנחה

כסף שמגיע ממתנה **אינו שווה ערך לכסף רגיל** מבחינת תנאי ההטבה. הארגון יכול לקבוע מגבלות על מימוש הטבות בכסף מתנה, כך שהנחות מסוימות לא יחולו, או שאחוז ההנחה יהיה מופחת.

### 10.2 מודל מגבלות

```
כסף רגיל (Top-up / Balance):
├── זכאי ל-100% מתנאי ההטבה
├── אחוז הנחה מלא
├── כפל מבצעים - כן
└── ללא הגבלה

כסף מתנה (Gift Fund):
├── ההטבה עשויה להיות מוגבלת
├── אחוז הנחה מופחת או ללא הנחה כלל
├── כפל מבצעים - לפי הגדרה
└── מוגבל לפי הגדרת ההטבה
```

### 10.3 הגדרת מגבלות ברמת ההטבה (Benefit)

כל הטבה (`Benefit`) מקבלת שדה חדש שמגדיר את ההתנהגות עבור כסף מתנה:

```typescript
interface BenefitGiftPolicy {
  // האם ההטבה בכלל זמינה לכסף מתנה?
  allowGiftFunds: boolean;

  // אם כן - מה ההנחה לכסף מתנה?
  giftDiscountOverride?: {
    type: 'none' | 'reduced' | 'same';

    // 'none' → אין הנחה כלל על כסף מתנה (משלם מחיר מלא)
    // 'reduced' → אחוז הנחה מופחת (ראה reducedPercentage)
    // 'same' → אותו אחוז הנחה כמו כסף רגיל

    reducedPercentage?: number;  // רק אם type === 'reduced'
    // לדוגמה: ההטבה הרגילה 20% הנחה, לכסף מתנה רק 10%
  };

  // האם כפל מבצעים חל על כסף מתנה?
  allowCombinePromotions: boolean;

  // הגבלת סכום מתנה מקסימלי למימוש בהטבה זו
  maxGiftFundAmount?: number;  // null = ללא הגבלה
}
```

### 10.4 לוגיקת חישוב בקופה (Checkout Logic)

כשמשתמש מממש מתנה ורוכש מוצר/שירות עם הטבה, המערכת מפרידה את מקורות התשלום:

```
דוגמה:
  מוצר: 200₪
  הטבה רגילה: 20% הנחה
  מגבלת מתנה: הנחה מופחתת 10%

  תרחיש 1: תשלום מלא מכסף מתנה
  ├── 200₪ × 10% הנחה = 180₪ לתשלום
  └── (במקום 160₪ שהיה משלם עם כסף רגיל)

  תרחיש 2: תשלום מעורב - 100₪ מתנה + 100₪ רגיל
  ├── 100₪ מתנה × 10% הנחה  = 90₪
  ├── 100₪ רגיל × 20% הנחה  = 80₪
  └── סה"כ: 170₪ לתשלום

  תרחיש 3: תשלום מלא מכסף רגיל
  ├── 200₪ × 20% הנחה = 160₪ לתשלום
  └── (מקבל את מלוא ההנחה)
```

### 10.5 חוקי עדיפות (Priority Rules)

```
1. כסף רגיל תמיד עדיף מבחינת ההנחה
2. המערכת מציעה למשתמש לבחור מקור תשלום
3. אם יש שילוב - קודם מחושב כסף רגיל (עם הנחה מלאה), ואז כסף מתנה (עם הנחה מופחתת)
4. המשתמש רואה מראש כמה ישלם מכל מקור
```

### 10.6 תצוגה למשתמש

בעמוד מימוש המתנה (`GiftRedemption`), כשהמשתמש בוחר הטבה, הוא רואה:

```
┌─────────────────────────────────────────────┐
│  ☕ קפה ג'ו - 20% הנחה                      │
│                                              │
│  ⓘ בשימוש עם כסף מתנה: 10% הנחה בלבד       │
│                                              │
│  מחיר רגיל:     200₪                         │
│  הנחה למתנה:    -20₪ (10%)                   │
│  ─────────────────────                       │
│  לתשלום:        180₪ מיתרת המתנה             │
│                                              │
│  💡 טיפ: הוסף כסף מיתרה רגילה לקבלת          │
│     הנחה מלאה של 20%                         │
└─────────────────────────────────────────────┘
```

### 10.7 שדות חדשים ב-Prisma

```prisma
// הוספה ל-model Benefit הקיים:
model Benefit {
  // ... שדות קיימים ...

  // Gift Fund Policy
  allowGiftFunds           Boolean   @default(true)
  giftDiscountType         String?   // 'none' | 'reduced' | 'same'
  giftReducedPercentage    Decimal?  // אחוז הנחה מופחת לכסף מתנה
  giftAllowCombinePromos   Boolean   @default(false)
  giftMaxFundAmount        Decimal?  // סכום מקסימלי מכסף מתנה
}
```

### 10.8 API

```
GET    /api/benefits/:id/gift-policy       ← מה המגבלות של הטבה זו לכסף מתנה
PATCH  /api/benefits/:id/gift-policy       ← עדכון מגבלות (admin)
POST   /api/gifts/:code/calculate-price    ← חישוב מחיר עם הטבה + מקור תשלום
```

---

## סיכום שינויים נדרשים בקוד הקיים

### קבצים לעדכן

| קובץ | שינוי |
|---|---|
| `src/lib/api.ts` | הוספת `giftsApi` עם כל ה-endpoints, הוספת `'gift'` ל-`TransactionType` |
| `src/pages/PointsGifts.tsx` | חיבור ל-API במקום mock data, הוספת טבלת הזמנות אמיתית, תצוגת תפוגות |
| `src/pages/SendGiftSummary.tsx` | חיבור תשלום אמיתי, יצירת `GiftOrder`, בחירת ערוצי שליחה (email/sms/both) |
| `src/pages/SendGiftRecipients.tsx` | שליפת contacts מ-API, שמירת state מרכזי |
| `src/pages/SendGiftGreeting.tsx` | הוספת בחירת ערוצי שליחה (email/sms/שניהם) |
| `src/pages/Transactions.tsx` | הוספת תמיכה בסוג `gift`, הצגת לינק להזמנת מתנה |
| `src/pages/BenefitsPartnerships.tsx` | הוספת הגדרת `BenefitGiftPolicy` לכל הטבה |
| `src/pages/EditBenefit.tsx` | הוספת טופס הגדרת מגבלות כסף מתנה |
| `src/components/Sidebar.tsx` | ודא שהניווט מעודכן |

### קבצים חדשים נדרשים

| קובץ | תיאור |
|---|---|
| `src/pages/GiftOrderDetail.tsx` | דף פירוט הזמנת מתנה |
| `src/pages/GiftRedemption.tsx` | דף פומבי למימוש מתנה (צד המקבל) |
| `src/contexts/GiftWizardContext.tsx` | Context לשמירת state בין 5 שלבי האשף |
| `src/hooks/useGiftOrders.ts` | Hook לניהול הזמנות מתנה |
| `src/hooks/useGiftExpiry.ts` | Hook למעקב תפוגות |
| `src/components/GiftStatusBadge.tsx` | Badge component לסטטוסי מתנה |
| `src/components/ExpiryWarning.tsx` | התראת תפוגה |
