

## Goal
Mirror the **Got a Query?** form's prefill behavior in the **Access Request** dialog and the **Subscription Inquiry** form on My Account.

## Pattern to apply (from QueryFormTab)
- **Name, Designation, Company** → prefilled from user profile, **read-only** (muted background, no cursor)
- **Email** → prefilled, **editable**
- **Phone** → prefilled via `parsePhone` into `CountrySelector` + number input, **editable**

## Changes

### 1. `src/components/AccessRequestDialog.tsx`
- Prefill all 5 fields from `user` whenever the dialog opens (re-sync on each open)
- Make Name / Designation / Company read-only when the corresponding `user.<field>` exists
- Remove the hardcoded `"Stratview Research"` company default
- Replace the single Mobile text input with `CountrySelector` + phone number input (split via `parsePhone`)
- On submit, send mobile as `` `${phoneCode}${phoneNum}` `` inside the existing message JSON
- No change to `submitInquiry` payload shape or `type: 'access_request'`

### 2. `src/pages/MyAccount.tsx` — Subscription Inquiry section
Add a "Your Profile" block above the existing dashboard dropdown:
- Read-only Name, Designation, Company (when present on `user`)
- Editable Email + Phone (CountrySelector + number, prefilled via `parsePhone`)
- Existing dashboard dropdown + message textarea remain
- Continue dispatching `submitInquiry({ type: 'subscription_inquires' })` with the same JSON message shape (already includes name/designation/company/email/mobile/message)

### 3. Visual consistency
- Read-only inputs use the same treatment as QueryFormTab (`bg-muted/50 text-foreground cursor-default`)
- All three forms share `CountrySelector` + `parsePhone` for phone handling

## Files touched
- `src/components/AccessRequestDialog.tsx`
- `src/pages/MyAccount.tsx`

No new dependencies, no API contract changes, no store/slice changes.

