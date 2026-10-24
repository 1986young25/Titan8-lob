# Sovereign Octa-Lobe Tactical Command - Firestore Security Specification

## 1. Data Invariants

1. **Telemetry Event Immutability**:
   - Telemetry logs and cryptographic state seals are write-once append-only records.
   - Deletions and updates on `/telemetry_events/{eventId}` are strictly forbidden to ensure forensic ledger integrity under UCC-9 and fiduciary audit requirements.
   - Every telemetry entry must be attributed to an authenticated operator or verified system identity (`operatorUid == request.auth.uid`).

2. **System State Integrity**:
   - The global system state configuration at `/system_state/{stateId}` can only be read by authenticated enclave operators or public tactical viewer sessions, but mutations require verified operator authentication.
   - Allowed update keys are strictly bounded to physical constants, metronome cadence, root seal, and status updates.

3. **Lobe Configuration Governance**:
   - Lobe directives and notes at `/lobe_configs/{lobeId}` must have validated lobe indices (0-7), bounded note sizes (<= 1000 chars), and strict alphanumeric identifiers.
   - No untrusted ghost fields or unbounded payload injection.

4. **Default Deny**:
   - All collections not explicitly allowlisted are completely blocked by `match /{document=**} { allow read, write: if false; }`.

---

## 2. The "Dirty Dozen" Threat Payloads

1. **Unauthenticated Telemetry Injection**:
   - Target: `POST /telemetry_events/spoof_01` without `request.auth`.
   - Expected: `PERMISSION_DENIED`.

2. **Identity Spoofing on Telemetry Log**:
   - Target: `POST /telemetry_events/spoof_02` with `operatorUid: "victim_admin_uid"` while signed in as `attacker_uid`.
   - Expected: `PERMISSION_DENIED` (`incoming().operatorUid == request.auth.uid` validation fails).

3. **Ledger Tampering / Update Attack**:
   - Target: `UPDATE /telemetry_events/seal_01` modifying `sealHash` or timestamp.
   - Expected: `PERMISSION_DENIED` (telemetry collection forbids `update`).

4. **Forensic Record Deletion Attack**:
   - Target: `DELETE /telemetry_events/seal_01`.
   - Expected: `PERMISSION_DENIED` (telemetry collection forbids `delete`).

5. **Payload Inflation / Denial of Wallet Attack**:
   - Target: `POST /telemetry_events/bloat_01` with a 2MB string in `message`.
   - Expected: `PERMISSION_DENIED` (strictly bounded by `.size() <= 512`).

6. **ID Path Poisoning**:
   - Target: `GET /telemetry_events/../../unauthorized_system_doc` or `../bad%20id`.
   - Expected: `PERMISSION_DENIED` (guarded by `isValidId(eventId)`).

7. **System State Ghost Field Injection**:
   - Target: `UPDATE /system_state/current` injecting `{ backdoorAccess: true, adminGranted: true }`.
   - Expected: `PERMISSION_DENIED` (strict `affectedKeys().hasOnly(...)` gate).

8. **Terminal State Lockdown Bypass**:
   - Target: `UPDATE /system_state/current` altering root seal without valid timestamp or operator signature.
   - Expected: `PERMISSION_DENIED`.

9. **Lobe Index Out-Of-Bounds Attack**:
   - Target: `SET /lobe_configs/lobe_99` with `lobeIndex: 9999`.
   - Expected: `PERMISSION_DENIED` (validated `lobeIndex >= 0 && lobeIndex <= 7`).

10. **Lobe Directives Unbounded Memory Spike**:
    - Target: `UPDATE /lobe_configs/mod-01` with 100KB notes payload.
    - Expected: `PERMISSION_DENIED` (`notes.size() <= 1000`).

11. **Arbitrary Collection Traversal**:
    - Target: `GET /secret_master_keys/root`.
    - Expected: `PERMISSION_DENIED` (global catch-all default deny).

12. **Malformed Numeric Field Attack**:
    - Target: `UPDATE /system_state/current` with `metronomeHz: "NOT_A_NUMBER"`.
    - Expected: `PERMISSION_DENIED` (`metronomeHz is number`).
