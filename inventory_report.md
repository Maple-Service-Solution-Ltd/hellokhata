# Inventory Management - Search, Filter, and Sorting Report

This report analyzes how the search, filtering, and sorting functionality is currently implemented in the Inventory module (`InventoryPage.tsx` and the `api/items/route.ts` backend).

## 1. Search Functionality
**Status:** ✅ Working correctly

**How it works:**
*   **Frontend:** The search input correctly captures the user's query and passes it as a `search` parameter through the `useGetItems` hook which fetches the `/api/items` endpoint.
*   **Backend:** The backend extracts the `search` query parameter and applies a Prisma `OR` condition to match the text across multiple fields:
    *   Item Name (`name`)
    *   Bengali Name (`nameBn`)
    *   SKU (`sku`)
    *   Barcode (`barcode`)

## 2. Filtering Functionality
**Status:** ⚠️ Partially implemented (Contains bugs/missing features)

**How it works:**
*   **Category Filter (✅ Working):** 
    *   Frontend sends the `categoryId` to the API. 
    *   Backend successfully applies the `where.categoryId = categoryId` condition to filter items by category.
*   **Stock Filter (❌ Broken):**
    *   The UI provides three options: "All", "Low Stock", and "Out of Stock".
    *   **Bug 1 (Low Stock):** The frontend correctly sends `lowStock: true` to the API. However, in the backend route (`app/api/items/route.ts`), the condition is an empty block and does nothing:
        ```typescript
        if (lowStock === 'true') {
          // Items where current stock <= min stock  <-- Missing implementation!
        }
        ```
    *   **Bug 2 (Out of Stock):** The "Out of Stock" option updates the local UI state (`stockFilter === "out"`) but is not sent to the API, nor is the list filtered on the client side. 
*   **Price Filter (❌ Broken):**
    *   The UI has a "Price" dropdown with options like "Wholesale", "VIP", and "Multi-Price".
    *   **Bug:** The selected state (`priceFilter`) is completely ignored. It isn't used to filter items on the frontend before rendering, and it is not passed to the backend API.

## 3. Sorting Functionality
**Status:** ℹ️ Static (No dynamic UI control)

**How it works:**
*   **Frontend:** There are no UI controls (e.g., column headers or dropdowns) to allow users to sort items by price, stock quantity, or date created.
*   **Backend:** Sorting is hardcoded to sort alphabetically by the item's name:
    ```typescript
    orderBy: { name: 'asc' }
    ```
    All results returned from the API will invariably be sorted A-Z by name.

---

### Recommendations for Fixing

1. **Fix Backend Low Stock Filter:** Update Prisma logic in `app/api/items/route.ts` to actually filter by stock. *Note: Since comparing two columns (`currentStock <= minStock`) is an edge-case in standard Prisma, this may require a raw query or a generated boolean column.*
2. **Implement Out-of-Stock Filter:** Support `outOfStock` filter in both the frontend query params and backend endpoint (e.g. `where: { currentStock: 0 }`).
3. **Implement Price Filter:** Either handle `priceFilter` on the client side (filtering the returned data before mapping) or pass it to the backend to filter items returning only those with `wholesalePrice > 0`, `vipPrice > 0`, etc.
4. **Implement Dynamic Sorting:** Pass a `sortBy` and `sortOrder` parameter from the frontend to securely apply dynamic sorting in the backend via Prisma's `orderBy`.
