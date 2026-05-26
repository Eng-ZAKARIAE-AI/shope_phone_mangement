# Firebase Security Specification

This document defines the security guarantees, threat models, and edge cases checked for the Tecno Tech Shop stock manager.

## Data Invariants

- A product document must have a valid string `name`, `brand`, and `sku`.
- A product's `quantity` must be a non-negative integer.
- A product's `unitPrice` must be a positive number.
- A product's `stockStatus` must strictly correspond to its `quantity` state:
  - If quantity == 0: `stockStatus` must be `"Out of Stock"`
  - If quantity >= 1 and quantity < 5: `stockStatus` must be `"Low Stock"`
  - If quantity >= 5: `stockStatus` must be `"In Stock"`
- Re-marking status incorrectly or altering `stockStatus` to values not aligned with quantity must be blocked by validation logic.
- Only signed-in employees (with verified emails) have read or write privileges to product inventories. Anonymous users have no access whatsoever.

## The "Dirty Dozen" Vulnerability Vectors & Payloads
We block each of these malicious payloads:

1. **Unauthenticated Read**: Attempt to read products list without login. (RESULT: Denied)
2. **Anonymous Read**: Attempt to query products list with anonymous credentials. (RESULT: Denied)
3. **Identity Spoofing (Create)**: Creating a product where `createdBy` does not match `request.auth.uid`. (RESULT: Denied)
4. **Identity Spoofing (Update)**: Editing a product and attempting to overwrite others' `createdBy` track. (RESULT: Denied)
5. **Negative Stocks**: Setting `quantity` to `-15`. (RESULT: Denied)
6. **Negative Price**: Adding item with `unitPrice` of `-100.00`. (RESULT: Denied)
7. **Phantom Fields Injection**: Injecting a "Ghost Field" like `isVerified: true` or `isAdmin: true` into the product layout to trigger privilege escalation. (RESULT: Denied)
8. **Invalid ID Poisioning**: Creating sub-catalogs or utilizing dynamic document paths exceeding 128 characters or containing illegal characters limit. (RESULT: Denied)
9. **Mismatched Stock Status (High quantity low-stock)**: Setting `quantity` as `42` but marking `stockStatus` as `"Low Stock"`. (RESULT: Denied)
10. **Mismatched Stock Status (Zero quantity in-stock)**: Setting `quantity` as `0` but marking `stockStatus` as `"In Stock"`. (RESULT: Denied)
11. **Altering Creation History**: Attempting to alter `createdAt` to a developer custom date or modifying `createdAt` during an update block. (RESULT: Denied)
12. **Unverified Account Writes**: Signed-up employee writing stock before their email is verified (if verification is enforced). (RESULT: Denied)

## Test Coverage Checklist
We will write firestore security rules to guarantee that each vector is covered.
