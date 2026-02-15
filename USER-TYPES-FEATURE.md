# 👥 User Types Feature - Contacts & Members

## Overview
A two-tier user classification system that distinguishes between general contacts and registered members.

## User Types

### 🔵 Contacts (אנשי קשר)
- **Definition**: All users in the system
- **Includes**: Both contacts and members
- **Total**: 15 users
- **Icon**: `contacts`

### 🟢 Members (חברים רשומים)
- **Definition**: Registered users with full access
- **Includes**: Only registered members
- **Total**: 8 users
- **Icon**: `badge`
- **Note**: All members are also contacts, but not all contacts are members

## Relationship

```
┌─────────────────────────────────────┐
│         All Contacts (15)           │
│  ┌───────────────────────────────┐  │
│  │   Registered Members (8)      │  │
│  │                               │  │
│  │  • יונתן ישראלי               │  │
│  │  • מיכל כהן                   │  │
│  │  • שרה אהרוני                 │  │
│  │  • רונית שמש                  │  │
│  │  • נועה גולדברג               │  │
│  │  • אלון דהן                   │  │
│  │  • גיא פרידמן                 │  │
│  │  • הדס ויצמן                  │  │
│  └───────────────────────────────┘  │
│                                     │
│  Contact-Only Users (7):            │
│  • דוד לוי                          │
│  • אריאל מזרחי                      │
│  • עמית ברוך                        │
│  • תמר אברהם                        │
│  • ליאת מור                         │
│  • יוסי כץ                          │
│  • רועי שחר                         │
└─────────────────────────────────────┘

Members ⊆ Contacts
```

## Features

### ✅ Tab Switcher
Located at the top of the Users page, above the table:

**Design:**
- Pill-style toggle with rounded corners
- Active tab has white background + shadow
- Inactive tabs are translucent
- Smooth transitions
- Badge showing count for each type

**Tabs:**
1. **אנשי קשר (Contacts)**
   - Shows all 15 users
   - Icon: `contacts`
   - Count: 15

2. **חברים רשומים (Members)**
   - Shows only 8 members
   - Icon: `badge`
   - Count: 8

### ✅ Smart Filtering
- **Active Tab**: Filters users automatically
- **Respects Other Filters**: Works with search, status, and date filters
- **Dynamic Count**: Badge updates based on data

### ✅ Data Structure
```tsx
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  address: string;
  lastActivity: string;
  firstJoined: string;
  userType: 'contact' | 'member'; // NEW FIELD
}
```

## Implementation Details

### State Management
```tsx
const [activeTab, setActiveTab] = useState<'contacts' | 'members'>('contacts');
```

### Filter Logic
```tsx
const filteredUsers = users.filter(user => {
  // User type filter
  if (activeTab === 'members' && user.userType !== 'member') {
    return false;
  }
  // 'contacts' tab shows all users

  // ... other filters (search, status, etc.)
});
```

### Tab Component
```tsx
<div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
  <button onClick={() => setActiveTab('contacts')} ...>
    אנשי קשר (15)
  </button>
  <button onClick={() => setActiveTab('members')} ...>
    חברים רשומים (8)
  </button>
</div>
```

## User Distribution

### Members (8 users):
1. יונתן ישראלי (Active)
2. מיכל כהן (Active)
3. שרה אהרוני (Active)
4. רונית שמש (Active)
5. נועה גולדברג (Inactive)
6. אלון דהן (Active)
7. גיא פרידמן (Active)
8. הדס ויצמן (Active)

### Contacts Only (7 users):
1. דוד לוי (Inactive)
2. אריאל מזרחי (Pending)
3. עמית ברוך (Active)
4. תמר אברהם (Pending)
5. ליאת מור (Active)
6. יוסי כץ (Inactive)
7. רועי שחר (Pending)

## Usage

### Viewing All Contacts
1. Click on "אנשי קשר" tab (default)
2. See all 15 users
3. Badge shows "15"

### Viewing Members Only
1. Click on "חברים רשומים" tab
2. See only 8 members
3. Badge shows "8"
4. Table updates instantly

### Combined with Filters
- Use search while on Members tab
- Use status filter on Contacts tab
- All filters work together seamlessly

## Export Behavior

When exporting:
- **"Export All"**: Exports based on active tab
  - Contacts tab: All 15 users
  - Members tab: Only 8 members
- **"Export Selected"**: Exports selected rows from active tab

## Visual Design

### Tab Bar:
- Background: Light gray (`bg-slate-100`)
- Active tab: White with shadow
- Padding: `p-1` container, `px-6 py-2.5` buttons
- Border radius: `rounded-xl`
- Icons: Material Icons
- Badges: Count display with rounded background

### Transitions:
- Smooth color transitions on hover
- Shadow appears on active tab
- Instant table update on tab switch

## Future Enhancements

### Potential Additions:
1. **Badge on Members**
   - Visual indicator in table for members
   - "חבר רשום" badge in user row

2. **Quick Action**
   - "Promote to Member" button for contacts
   - "Demote to Contact" for members

3. **Advanced Filters**
   - "Show only contacts (not members)"
   - "Show only new members (this month)"

4. **Analytics**
   - Member growth chart
   - Conversion rate (contacts → members)

## Files Modified

- `src/pages/Users.tsx`:
  - Added `userType` field to User interface
  - Added `activeTab` state
  - Added tab switcher component
  - Updated filter logic
  - Updated all user data with userType

## Testing Checklist

- [x] Tab switches between Contacts and Members
- [x] Correct count displayed in badges
- [x] Members tab shows only 8 users
- [x] Contacts tab shows all 15 users
- [x] Search works on both tabs
- [x] Status filter works on both tabs
- [x] Export respects active tab
- [x] Dark mode styling works
- [x] Active tab visually distinct
- [x] Smooth transitions

## 🎉 Result

Professional two-tier user management system with:
- Clear visual separation
- Intuitive tab switching
- Smart filtering
- Accurate counts
- Clean design
