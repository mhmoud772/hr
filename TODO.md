# Device Details View Improvement Plan

## Task Overview

Improve the device details view interface in the HR Companion application to provide better organization, visual hierarchy, and information display.

## Current State Analysis

### Files Examined:

- `frontend/src/features/devices/pages/Devices.tsx` - Main devices page
- `frontend/src/shared/components/DetailsSheet.tsx` - Generic details sheet component
- `frontend/src/types/api.ts` - Device type definition

### Current Device Details (in DetailsSheet):

1. Model
2. IP Address
3. Port
4. Location
5. Last Sync
6. Last Seen
7. Employee Count

### Device Interface Properties:

```typescript
interface Device {
  id: string;
  name: string;
  serialNumber: string;
  ipAddress: string;
  port?: number;
  commKey?: string;
  modelName?: string;
  location: string;
  status: "online" | "offline";
  lastSync?: string;
  lastSeen?: string;
  employeeCount?: number;
}
```

## Improvement Plan

### 1. Create New DeviceDetailsSheet Component

**File:** `frontend/src/features/devices/components/DeviceDetailsSheet.tsx`

Features:

- Section-based layout with clear visual grouping
- Three sections:
  - **Device Information**: Name, Serial Number, Model, Location
  - **Network Settings**: IP Address, Port, Comm Key (masked)
  - **Status & Sync**: Status, Last Sync, Last Seen, Employee Count
- Add icons for each field
- Proper date formatting
- Device ID display
- Masked commKey for security

### 2. Update Devices.tsx to Use New Component

**File:** `frontend/src/features/devices/pages/Devices.tsx`

Changes:

- Import the new DeviceDetailsSheet component
- Replace DetailsSheet with DeviceDetailsSheet
- Pass organized data to the new component

### 3. Add Missing Translation Keys (if needed)

**Files:** `frontend/src/i18n/locales/en.json`, `frontend/src/i18n/locales/ar.json`

Add:

- device_id: "Device ID" / "معرف الجهاز"
- device_info: "Device Information" / "معلومات الجهاز"
- network_settings: "Network Settings" / "إعدادات الشبكة"
- status_sync: "Status & Sync" / "الحالة والمزامنة"

## Implementation Steps

### Step 1: Create DeviceDetailsSheet Component

- [x] Create new component file
- [x] Implement section-based layout
- [x] Add icons and proper formatting
- [x] Add masked commKey display
- [x] Add proper date formatting

### Step 2: Update Devices.tsx

- [x] Import new component
- [x] Replace DetailsSheet usage
- [x] Test the integration

### Step 3: Add Translations

- [x] Add missing translation keys
- [x] Test Arabic/English switching

## Expected Results

- Better organized device details with clear sections
- More information displayed (Device ID, masked Comm Key)
- Improved visual hierarchy with icons
- Proper date/time formatting
- Better RTL support for Arabic
