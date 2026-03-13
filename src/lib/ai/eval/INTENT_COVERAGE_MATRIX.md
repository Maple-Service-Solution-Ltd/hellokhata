# Intent Coverage Matrix

## Overview
This document tracks the coverage of intents across tool adapters, evaluation tests, and stress tests.

**Generated**: Task ID 4-5  
**Purpose**: Zero-trust audit of AI intent parsing system

---

## Intent Types

| Intent | Description | Tool Adapter | Eval Tests | Stress Tests | Coverage |
|--------|-------------|--------------|------------|--------------|----------|
| `query` | General data queries (sales, expenses, stock, etc.) | ✅ Yes | ✅ Yes | ✅ Yes | 100% |
| `create_sale` | Create a new sale transaction | ✅ Yes | ✅ Yes | ✅ Yes | 100% |
| `create_expense` | Record a new expense | ✅ Yes | ✅ Yes | ✅ Yes | 100% |
| `create_payment` | Record a payment received/made | ✅ Yes | ✅ Yes | ✅ Yes | 100% |
| `create_party` | Create new customer/supplier | ✅ Yes | ⚠️ Partial | ✅ Yes | 75% |
| `create_item` | Add new inventory item | ✅ Yes | ⚠️ Partial | ✅ Yes | 75% |
| `update_sale` | Modify existing sale | ⚠️ Partial | ⚠️ Partial | ✅ Yes | 50% |
| `update_party` | Update party information | ⚠️ Partial | ❌ No | ✅ Yes | 33% |
| `informative` | General information response | ❌ No tool | ✅ Yes | ✅ Yes | N/A |

---

## Query Sub-Types

| Query Type | Tool Adapter | Eval Coverage | Notes |
|------------|--------------|---------------|-------|
| Sales queries | ✅ `getSales()` | ✅ 20+ tests | Today, yesterday, weekly, monthly |
| Expense queries | ✅ `getExpenses()` | ✅ 10+ tests | By period, category |
| Payment queries | ✅ `getPayments()` | ✅ 5+ tests | Received/paid |
| Stock queries | ✅ `getItems()` | ✅ 10+ tests | Including low stock |
| Receivable queries | ✅ `getReceivables()` | ✅ 5+ tests | Due amounts |
| Payable queries | ✅ `getPayables()` | ✅ 5+ tests | Supplier debts |
| Profit queries | ✅ `getProfit()` | ✅ 10+ tests | By period |
| Customer queries | ✅ `getParties()` | ✅ 5+ tests | Customer type filter |
| Supplier queries | ✅ `getParties()` | ✅ 5+ tests | Supplier type filter |
| Top selling | ✅ `getTopSelling()` | ✅ 2 tests | Best sellers |
| Invoice lookup | ✅ `getSaleByInvoice()` | ✅ 2 tests | By invoice number |
| Dashboard summary | ✅ `getDashboardStats()` | ✅ 5+ tests | Overview data |

---

## Entity Extraction Coverage

| Entity | Parser Support | Eval Tests | Notes |
|--------|----------------|------------|-------|
| `period` | ✅ Full | ✅ Yes | today, yesterday, this_week, this_month, last_7_days, last_30_days, custom |
| `date` | ✅ Full | ✅ Yes | Custom date parsing |
| `startDate/endDate` | ✅ Full | ✅ Yes | Date range queries |
| `itemName` | ✅ Full | ✅ Yes | Fuzzy matching with items list |
| `itemId` | ✅ Full | ✅ Yes | Auto-resolved from item name |
| `quantity` | ✅ Full | ✅ Yes | Number + unit extraction |
| `unitPrice` | ✅ Full | ⚠️ Partial | From item data |
| `partyName` | ✅ Full | ✅ Yes | Fuzzy matching with parties list |
| `partyId` | ✅ Full | ✅ Yes | Auto-resolved from party name |
| `partyType` | ✅ Full | ✅ Yes | customer/supplier |
| `amount` | ✅ Full | ✅ Yes | ৳ symbol, taka, টাকা |
| `paidAmount` | ✅ Full | ⚠️ Partial | Calculated from price × qty |
| `paymentMethod` | ✅ Full | ✅ Yes | cash, credit, card, mobile_banking |
| `expenseCategory` | ✅ Full | ⚠️ Partial | Category matching |
| `invoiceNo` | ✅ Full | ✅ Yes | Pattern extraction |

---

## Language Support

| Language | Query Support | Create Support | Eval Tests |
|----------|---------------|----------------|------------|
| English | ✅ Full | ✅ Full | ✅ 50 tests |
| Bengali | ✅ Full | ✅ Full | ✅ 50 tests |
| Mixed | ⚠️ Partial | ⚠️ Partial | ✅ 20+ tests |

---

## Coverage Summary

### Overall Statistics
- **Total Intents**: 9
- **Intents with Tool Adapters**: 7/9 (78%)
- **Intents with Eval Tests**: 9/9 (100%)
- **Intents with Stress Tests**: 9/9 (100%)

### Gap Analysis

#### High Priority Gaps
1. **`update_sale` intent** - Only partial tool adapter, needs full implementation
2. **`update_party` intent** - Missing eval tests, partial tool adapter

#### Medium Priority Gaps
1. **`create_party` tests** - Add more dedicated test cases
2. **`create_item` tests** - Add more dedicated test cases

#### Low Priority Gaps
1. **Mixed language edge cases** - Need more hybrid Banglish tests
2. **Payment method edge cases** - Some variations not covered

---

## Test Distribution

### golden_300.jsonl
- **Total test cases**: 100
- **Query tests**: 52
- **Create sale tests**: 24
- **Create expense tests**: 12
- **Create payment tests**: 12

### vocab_stress_cases.jsonl
- **Total test cases**: 120+
- **Bangla queries**: 40+
- **English queries**: 40+
- **Mixed queries**: 20+
- **Edge cases**: 20+

---

## Recommendations

1. **Add dedicated update tests** - Create test cases for `update_sale` and `update_party`
2. **Expand party/item creation tests** - Add more test coverage for these intents
3. **Add confirmation flow tests** - Test the confirmation/rejection scenarios
4. **Add error handling tests** - Test missing entity scenarios
5. **Add multi-item sale tests** - Test sales with multiple items
