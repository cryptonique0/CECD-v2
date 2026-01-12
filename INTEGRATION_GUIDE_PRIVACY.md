# Privacy Features Integration Guide

Quick start guide for integrating jurisdiction-aware privacy into your CECD application.

---

## 🚀 Quick Start

### 1. **Initialize Services**

```typescript
// Initialize encryption service with master key (from KMS)
import { fieldEncryptionService } from './services/fieldEncryptionService';
import { jurisdictionService } from './services/jurisdictionService';

// On app startup
await fieldEncryptionService.initialize(process.env.MASTER_ENCRYPTION_KEY);
```

### 2. **Creating Incidents with Privacy**

```typescript
// pages/ReportIncident.tsx

const handleSubmitIncident = async (formData) => {
  // 1. Detect jurisdiction from incident location
  const jurisdiction = jurisdictionService.detectJurisdiction(
    formData.location.lat,
    formData.location.lng
  );
  
  // 2. Check if encryption is required
  const needsEncryption = jurisdictionService.requiresEncryption(
    'medicalNotes',
    jurisdiction
  );
  
  // 3. Encrypt sensitive fields if needed
  let medicalNotes = formData.medicalNotes;
  if (needsEncryption && medicalNotes) {
    medicalNotes = await fieldEncryptionService.encryptField(
      'medicalNotes',
      medicalNotes,
      currentUser.id,
      24 * 60 * 60 * 1000 // 24-hour expiry
    );
  }
  
  // 4. Calculate retention and deletion dates
  const retentionPolicy = jurisdictionService.getRetentionPolicy(
    formData.category, // 'medical', 'fire', etc.
    jurisdiction
  );
  
  const deletionDate = jurisdictionService.calculateDeletionDate(
    Date.now(),
    retentionPolicy
  );
  
  // 5. Check consent requirement
  const policy = jurisdictionService.getPolicy(jurisdiction);
  const needsConsent = policy.consentRequired;
  
  // 6. Create incident with privacy metadata
  const incident = {
    ...formData,
    jurisdiction,
    dataClassification: formData.category === 'medical' ? 'medical' : 'internal',
    retentionPeriod: retentionPolicy.retentionPeriod,
    deletionScheduledAt: deletionDate,
    medicalNotes,
    consentRequired: needsConsent,
    consentObtained: formData.consentGiven || false
  };
  
  await createIncident(incident);
};
```

### 3. **Viewing Encrypted Data**

```typescript
// pages/IncidentDetail.tsx

const viewMedicalNotes = async (incident) => {
  try {
    // Decrypt medical notes
    const decrypted = await fieldEncryptionService.decryptField(
      'medicalNotes',
      incident.medicalNotes,
      {
        userId: currentUser.id,
        userRole: currentUser.role,
        certifications: currentUser.certifications || [],
        hasMFA: currentUser.hasMFA || false,
        jurisdiction: incident.jurisdiction
      }
    );
    
    setMedicalNotes(decrypted);
  } catch (error) {
    // Access denied - show error message
    setError('You do not have permission to view medical notes. EMT certification required.');
  }
};
```

### 4. **Add Privacy Panel to UI**

```tsx
// pages/IncidentDetail.tsx

import PrivacyCompliancePanel from '../components/PrivacyCompliancePanel';

<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Incident details */}
  </div>
  
  <div>
    {/* Privacy compliance info */}
    <PrivacyCompliancePanel
      incidentId={incident.id}
      incidentType={incident.category}
      incidentLocation={incident.location}
      onJurisdictionChange={(newJurisdiction) => {
        updateIncidentJurisdiction(incident.id, newJurisdiction);
      }}
    />
  </div>
</div>
```

---

## 🔐 Common Patterns

### Pattern 1: Check Access Before Showing UI

```tsx
// Only show "View Medical Notes" button if user has access

const canViewMedicalNotes = fieldEncryptionService.canAccessField(
  'medicalNotes',
  currentUser.role,
  currentUser.certifications,
  currentUser.hasMFA
);

{canViewMedicalNotes && (
  <button onClick={viewMedicalNotes}>
    View Medical Notes (Encrypted)
  </button>
)}
```

### Pattern 2: Batch Encrypt Multiple Fields

```typescript
// Encrypt multiple fields at once

const sensitiveFields = {
  medicalNotes: formData.medicalNotes,
  patientVitals: formData.vitals,
  personalInfo: {
    name: formData.patientName,
    ssn: formData.patientSSN,
    dob: formData.patientDOB
  }
};

const encrypted = await fieldEncryptionService.encryptFields(
  sensitiveFields,
  currentUser.id
);

// encrypted.medicalNotes, encrypted.patientVitals, encrypted.personalInfo
// are now EncryptedField objects
```

### Pattern 3: Handle GDPR Data Export

```tsx
// User requests all their data (GDPR Article 20)

const handleDataExport = async (userId) => {
  // Get all incidents involving user
  const userIncidents = await getIncidentsByUser(userId);
  
  // Export all data
  const exportData = jurisdictionService.exportUserData(userId, userIncidents);
  
  // Download as JSON
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `data-export-${userId}-${Date.now()}.json`;
  link.click();
};
```

### Pattern 4: Consent Management (GDPR)

```tsx
// Collect consent for analytics (EU users)

const handleConsentChange = (granted: boolean) => {
  jurisdictionService.recordConsent(currentUser.id, {
    userId: currentUser.id,
    purpose: 'analytics',
    granted,
    timestamp: Date.now(),
    expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
    jurisdiction: currentUser.jurisdiction
  });
};

// Check before tracking analytics
if (jurisdictionService.hasValidConsent(currentUser.id, 'analytics', currentUser.jurisdiction)) {
  // Track analytics
  analyticsService.trackEvent('incident_viewed', { incidentId });
}
```

### Pattern 5: Data Retention Warnings

```tsx
// Show warning if incident approaching deletion

const IncidentRetentionWarning = ({ incident }) => {
  const daysUntilDeletion = Math.floor(
    (incident.deletionScheduledAt - Date.now()) / (24 * 60 * 60 * 1000)
  );
  
  if (daysUntilDeletion < 30) {
    return (
      <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4">
        <AlertTriangle className="w-5 h-5 text-yellow-500 inline mr-2" />
        <strong>Retention Notice:</strong> This incident will be automatically
        deleted in {daysUntilDeletion} days per {incident.jurisdiction} regulations.
        Archive important data now.
      </div>
    );
  }
  
  return null;
};
```

---

## 🛠️ Testing

### Test Encryption

```typescript
// Test encrypting and decrypting a field

const testEncryption = async () => {
  const originalData = { diagnosis: 'Fracture', severity: 'Moderate' };
  
  // Encrypt
  const encrypted = await fieldEncryptionService.encryptField(
    'medicalNotes',
    originalData,
    'user-123'
  );
  
  console.log('Encrypted:', encrypted);
  // { value: 'base64...', algorithm: 'AES-256-GCM', iv: '...', ... }
  
  // Decrypt (with proper permissions)
  const decrypted = await fieldEncryptionService.decryptField(
    'medicalNotes',
    encrypted,
    {
      userId: 'user-456',
      userRole: 'emt',
      certifications: ['EMT-P'],
      hasMFA: true,
      jurisdiction: 'US'
    }
  );
  
  console.log('Decrypted:', decrypted);
  // { diagnosis: 'Fracture', severity: 'Moderate' }
  
  expect(decrypted).toEqual(originalData);
};
```

### Test Access Control

```typescript
// Test that non-EMT users cannot access medical notes

const testAccessControl = async () => {
  const encrypted = await fieldEncryptionService.encryptField(
    'medicalNotes',
    { diagnosis: 'Classified' },
    'emt-001'
  );
  
  try {
    // Try to decrypt as analyst (no EMT cert)
    await fieldEncryptionService.decryptField(
      'medicalNotes',
      encrypted,
      {
        userId: 'analyst-001',
        userRole: 'analyst',
        certifications: [],
        hasMFA: true,
        jurisdiction: 'US'
      }
    );
    
    fail('Should have thrown access denied error');
  } catch (error) {
    expect(error.message).toContain('Access denied');
  }
};
```

### Test Jurisdiction Detection

```typescript
// Test jurisdiction auto-detection

const testJurisdictionDetection = () => {
  // Paris, France
  const euJurisdiction = jurisdictionService.detectJurisdiction(48.8566, 2.3522);
  expect(euJurisdiction).toBe('EU');
  
  // New York, USA
  const usJurisdiction = jurisdictionService.detectJurisdiction(40.7128, -74.0060);
  expect(usJurisdiction).toBe('US');
  
  // San Francisco, California
  const caJurisdiction = jurisdictionService.detectJurisdiction(37.7749, -122.4194);
  expect(caJurisdiction).toBe('US_CALIFORNIA');
  
  // London, UK
  const ukJurisdiction = jurisdictionService.detectJurisdiction(51.5074, -0.1278);
  expect(ukJurisdiction).toBe('UK');
};
```

---

## 🚨 Error Handling

```typescript
// Comprehensive error handling for privacy operations

const handlePrivacyOperation = async () => {
  try {
    await fieldEncryptionService.decryptField(...);
  } catch (error) {
    if (error.message.includes('Access denied')) {
      // User lacks permissions
      showError('You do not have permission to view this field. Contact your administrator.');
    } else if (error.message.includes('expired')) {
      // Data expired (auto-expiry)
      showError('This data has expired per security policy. Please re-encrypt if needed.');
    } else if (error.message.includes('MFA required')) {
      // User needs to enable MFA
      showError('Multi-factor authentication required to access this field.');
      redirectTo('/profile/security');
    } else {
      // Unknown error
      console.error('Privacy operation failed:', error);
      showError('Unable to process request. Please try again.');
    }
  }
};
```

---

## 📋 Checklist for New Features

When adding new sensitive data fields:

- [ ] Add field to `encryptionRules` in `jurisdictionService.ts`
- [ ] Define `allowedRoles`, `allowedCertifications`, `requiresMFA`
- [ ] Set `dataClassification` ('public', 'internal', 'confidential', 'restricted', 'medical', 'pii')
- [ ] Choose `algorithm` ('AES-256-GCM', 'RSA-2048', 'ChaCha20-Poly1305')
- [ ] Set `autoExpiry` if temporary data (e.g., 24 hours for medical notes)
- [ ] Update `Incident` type in `types.ts` with optional encrypted field
- [ ] Add access control check in `hasAccess()` method
- [ ] Update UI to show/hide field based on permissions
- [ ] Add audit logging for field access
- [ ] Test encryption/decryption with different user roles

---

## 🌟 Best Practices

1. **Always Check Permissions Before Showing UI**
   ```typescript
   const canView = fieldEncryptionService.canAccessField(...);
   {canView && <SensitiveComponent />}
   ```

2. **Encrypt on Write, Decrypt on Read**
   - Encrypt when creating/updating incidents
   - Decrypt only when user requests to view (lazy decryption)

3. **Use Batch Operations for Performance**
   ```typescript
   // Encrypt multiple fields in one call
   const encrypted = await fieldEncryptionService.encryptFields(multipleFields, userId);
   ```

4. **Handle Expired Data Gracefully**
   - Encrypted fields with `expiresAt` cannot be decrypted after expiry
   - Show "Data Expired" message, offer re-encryption option

5. **Audit All Access**
   ```typescript
   // Automatically logged by fieldEncryptionService
   await fieldEncryptionService.decryptField(...);
   // Logs: { userId, fieldPath, timestamp, success: true/false }
   ```

6. **Respect Jurisdiction Restrictions**
   ```typescript
   // Check before transferring data internationally
   if (!jurisdictionService.canTransferToCountry(fromJurisdiction, toCountry)) {
     throw new Error('Cross-border transfer not allowed');
   }
   ```

---

## 🎯 Next Steps

1. **Integrate Privacy Panel** into existing incident pages
2. **Add Consent UI** for GDPR-compliant regions
3. **Set Up Audit Logging** dashboard for compliance teams
4. **Configure KMS** for production encryption keys
5. **Implement Data Retention Scheduler** (auto-delete after retention period)
6. **Add Breach Notification Workflow** for GDPR/HIPAA compliance
7. **Create User Privacy Settings** page (data export, consent management)

**Your platform is now ready for privacy-compliant emergency response!** 🎉
