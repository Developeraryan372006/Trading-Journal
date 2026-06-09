# Security Specification & Test-Driven Development (TDD)
## System: Trading Journal Database

### 1. Core Data Invariants
- **Identity Isolation**: A trader can only read, write, or delete their own user profile and journal entry pages under `/users/{userId}`.
- **Rule Lockdowns**: Profile configurations the user writes must map `userId` exactly to `request.auth.uid`. No user can rewrite another user's boundaries.
- **Verification Strictness**: To maintain a clean, cheat-resistant database, only verified authenticated accounts `request.auth.token.email_verified == true` are permitted execution access.
- **Timestamp Integrity**: `updatedAt` and `createdAt` must match server-time clocks exactly, and `createdAt` cannot be subsequently overwritten or mutated.
- **ID Integrity**: Path variables like `{userId}` and `{date}` must match valid patterns and not contain arbitrary giant payload arrays or code injection characters.

---

### 2. The "Dirty Dozen" Rogue Payloads
Here are 12 malicious or structurally non-compliant payloads curated to test our security policies. All these attempts must yield `PERMISSION_DENIED`.

#### P1: Profile Hack (Privilege Hijack)
An authenticated user attempts to modify some other user's profile database.
```json
// Path: /users/victim-user-id-555
{
  "userId": "victim-user-id-555",
  "maxDailyLoss": 10
}
```

#### P2: Identity Spoofing (Owner Forgery)
A user tries to write a journal entry where the `userId` in the document body is spoofed to another user's UID to frame them or leak data.
```json
// Path: /users/attacker-uid/entries/2026-06-09
{
  "date": "2026-06-09",
  "userId": "victim-uid-999",
  "manualReflections": "Heist execution."
}
```

#### P3: Timestamp Trick (Client Fake Time)
A client tries to force a custom historical or future date on `createdAt`.
```json
// Path: /users/attacker-uid/entries/2026-06-09
{
  "date": "2026-06-09",
  "userId": "attacker-uid",
  "manualReflections": "Manipulating timestamps.",
  "createdAt": "1999-01-01T00:00:00Z",
  "updatedAt": "2026-06-09T13:00:00Z"
}
```

#### P4: Immortal Override (Mutating Creation Date)
An update operation attempts to change the structural `createdAt` field on a historical diary entry.
```json
// Path: /users/attacker-uid/entries/2026-06-09
// Action: Update
{
  "createdAt": "2020-05-05T12:00:00Z"
}
```

#### P5: Invisible Ghost Field (Data Contamination)
Attempting to save a user constitution containing arbitrary extra key values (`ghostVerificationField`).
```json
// Path: /users/attacker-uid
{
  "userId": "attacker-uid",
  "maxDailyLoss": 1000,
  "ghostVerificationField": "I_Am_An_Admin"
}
```

#### P6: Impersonation with Unverified Email
An attacker registers with an unverified email claiming admin privileges or writing trade records.
```json
// Auth Context: email_verified: false
// Path: /users/unverified-attacker
{
  "userId": "unverified-attacker",
  "maxDailyLoss": 500
}
```

#### P7: Rogue Status Escalation
An attacker bypasses client logic to write synthetic trade logs while bypassing emotional/financial constraints.
```json
// Path: /users/attacker-uid/entries/2026-06-09
{
  "date": "2026-06-09",
  "userId": "attacker-uid",
  "trades": [{"id": "infinite-cash", "pnl": 9999999, "emotion": "calm", "symbol": "FAKE"}]
}
```

#### P8: Denial of Wallet (Size Exhaustion)
An attacker attempts to inject a 2MB string into their own daily manual reflections to overload storage quotas.
```json
// Path: /users/attacker-uid/entries/2026-06-09
{
  "date": "2026-06-09",
  "userId": "attacker-uid",
  "manualReflections": "... [2 Megabytes of junk characters] ..."
}
```

#### P9: SQL/NoSQL Code Injection as Date Index
An attacker tries to poison the index mapping by using a malicious path key.
```json
// Path: /users/attacker-uid/entries/../../system_files
{
  "date": "../../system_files",
  "userId": "attacker-uid",
  "manualReflections": "Code injection attempt."
}
```

#### P10: Arbitrary Resource Cross-Reads (Scraping)
An attacker queries `/users` or `/users/victim-uid/entries` in bulk to scrape performance data of other traders.
```json
// Query context: select * from /users/victim-uid/entries
// Expectation: Strict rule block denies list reads of non-owned collections.
```

#### P11: Schema-Breaking Field Types
Writing a numeric string inside a floating-point data constraint field (e.g., writing `"FIVE_HUNDRED"` into `maxDailyLoss`).
```json
// Path: /users/attacker-uid
{
  "userId": "attacker-uid",
  "maxDailyLoss": "FIVE_HUNDRED"
}
```

#### P12: Malicious Empty Entries
Deleting critical user identification keys from a previously stored profile, leaving it as an orphan record.
```json
// Path: /users/attacker-uid
{
  "maxDailyLoss": 200
  // "userId" key removed completely to cause null errors
}
```
