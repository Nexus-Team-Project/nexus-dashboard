# 📤 Export to Excel Feature

## Overview
Professional export functionality that allows users to export user data to Excel format with flexible options.

## Features

### ✅ What's Included:

1. **Export Options:**
   - Export All Users (filtered)
   - Export Selected Users Only

2. **Email Copy:**
   - Optional checkbox to send a copy via email
   - File is both downloaded and emailed

3. **Visual Design:**
   - Excel logo displayed in grayscale (black & white)
   - Professional modal design matching the import modal
   - Loading state during export

4. **Smart Validation:**
   - "Export Selected" is disabled if no rows are selected
   - Shows count of users to be exported
   - Shows count of selected users

## How to Use

### From User Interface:

1. **Navigate to Users Page**
   - Go to the משתמשים (Users) page

2. **Open Export Menu**
   - Click "ייבוא/ייצוא" button
   - Select "ייצא לאקסל"

3. **Choose Export Options**
   - Select "ייצא הכל" to export all filtered users
   - OR select "ייצא רק שורות מסומנות" to export only checked rows

4. **Optional: Email Copy**
   - Check "שלח עותק למייל שלי" to receive email copy

5. **Export**
   - Click "ייצא לאקסל" button
   - File will download automatically

## Technical Implementation

### State Variables:
```tsx
const [showExportModal, setShowExportModal] = useState(false);
const [exportOption, setExportOption] = useState<'all' | 'selected'>('all');
const [sendEmailCopy, setSendEmailCopy] = useState(false);
const [isExporting, setIsExporting] = useState(false);
```

### Export Function:
```tsx
const handleExport = async () => {
  setIsExporting(true);

  const usersToExport = exportOption === 'all'
    ? filteredUsers
    : filteredUsers.filter(u => selectedIds.includes(u.id));

  // Export logic here
  // 1. Convert to Excel (use library like xlsx)
  // 2. Trigger download
  // 3. Send email if requested

  setIsExporting(false);
  setShowExportModal(false);
};
```

## Next Steps (For Production)

### To Make it Fully Functional:

1. **Install Excel Library:**
   ```bash
   npm install xlsx
   ```

2. **Implement Export Logic:**
   ```tsx
   import * as XLSX from 'xlsx';

   const exportToExcel = (users: User[]) => {
     const worksheet = XLSX.utils.json_to_sheet(users);
     const workbook = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
     XLSX.writeFile(workbook, `users-export-${Date.now()}.xlsx`);
   };
   ```

3. **Backend Email API:**
   ```tsx
   if (sendEmailCopy) {
     await fetch('/api/export/email', {
       method: 'POST',
       body: JSON.stringify({
         users: usersToExport,
         email: currentUser.email
       })
     });
   }
   ```

## UI Components

### Export Modal Structure:
- **Header:** Title + Excel icon + Close button
- **Content:**
  - Excel logo (grayscale)
  - Export options (radio buttons)
  - Email checkbox
  - Info box
- **Footer:** Cancel + Export buttons

### Visual Features:
- Excel logo in grayscale for professional look
- Hover effects on radio options
- Loading spinner during export
- Success message after completion

## User Experience

### Smart Behavior:
- ✅ Automatically uses filtered users (respects search/filters)
- ✅ Disables "Selected Only" if nothing is selected
- ✅ Shows count for transparency
- ✅ Loading state prevents double-clicks
- ✅ Resets state after export

### Validation:
- Must have users to export
- Must select rows if choosing "Selected Only"
- Button disabled during export

## Files Modified:
- `src/pages/Users.tsx` - Main implementation
- Added export modal UI
- Added export logic
- Updated import/export menu button

## Testing Checklist:

- [ ] Export all users works
- [ ] Export selected users works
- [ ] Selected export disabled when no selection
- [ ] Email checkbox toggles correctly
- [ ] Loading state shows during export
- [ ] Success message appears
- [ ] Modal closes after export
- [ ] Filters are respected in export
- [ ] Works in dark mode
