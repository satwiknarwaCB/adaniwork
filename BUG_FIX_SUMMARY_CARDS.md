# Critical Bug Fix - Summary Cards Showing Wrong Totals

## ❌ Problem Found

User reported seeing incorrect values in the summary cards:
- **Total Capacity**: 21,447 MW (expected: ~7,073 MW)
- **Solar Capacity**: 18,957 MW (expected: ~5,869 MW) 
- **Wind Capacity**: 2,490 MW (expected: ~1,204 MW)

Values were approximately **3x higher** than expected!

## 🔍 Root Cause

The summary cards were displaying **`.capacity`** (raw capacity field sum) instead of **`.totalCapacity`** (correctly calculated value that respects PLAN/REPHASE logic).

### Why This Matters

According to the specification:
- **PLAN/REPHASE**: Total should use the **Capacity field** directly
- **ACTUAL**: Total should use **sum of monthly values**

The backend's `calculate_derived_values()` function correctly implements this and returns `.totalCapacity` with the right value.

But the frontend summary cards at lines 528, 536, 540 were displaying:
```typescript
hierarchicalTotals.total.capacity     // ❌ WRONG - raw sum
hierarchicalTotals.solar.capacity    // ❌ WRONG
hierarchicalTotals.wind.capacity     // ❌ WRONG
```

This caused them to show the **sum of the capacity field** for all projects, which doesn't respect whether it's PLAN, REPHASE, or ACTUAL.

## ✅ Fixes Applied

### 1. Fixed Summary Card Display (CommissioningStatusPage.tsx)

**Lines 526-541**: Changed all three summary cards to use `.totalCapacity`:

```typescript
// Total Capacity Card
<p>{formatNumber(hierarchicalTotals.total.totalCapacity)} MW</p>  // ✅ FIXED

// Solar Capacity Card  
<p>{formatNumber(hierarchicalTotals.solar.totalCapacity)} MW</p>  // ✅ FIXED

// Wind Capacity Card
<p>{formatNumber(hierarchicalTotals.wind.totalCapacity)} MW</p>   // ✅ FIXED
```

### 2. Changed Default Filter (CommissioningStatusPage.tsx)

**Line 104**: Changed default capacity type from 'Actual' to 'Plan':

```typescript
const [filters, setFilters] = useState({
  ...
  planActual: 'Plan',  // ✅ Changed from 'Actual'
  ...
});
```

**Line 289**: Updated clear filters to reset to 'Plan':

```typescript
setFilters({ ... planActual: 'Plan', ...});  // ✅ Changed from 'Actual'
```

## 📊 Expected Results After Fix

With **"Capacity Type: Plan"** selected, you should now see:
- **Total Capacity**: ~7,215 MW (from database: 38 included projects)
- **Solar Capacity**: ~5,800-5,900 MW
- **Wind Capacity**: ~1,200-1,300 MW

These values will now correctly reflect:
- Only **PLAN** capacity type (not Plan + Rephase + Actual)
- Only **included projects** (excludes D1, D2, Wind-B, Wind-D sections)
- Uses **Capacity field** for PLAN (not sum of monthly values)

## 🧪 To Verify

1. **Refresh the browser** (F5 or Ctrl+R)
2. Verify "Capacity Type" shows "Plan" by default
3. Check that:
   - Total Capacity ~7,215 MW
   - Cumm till Oct-25 shows actual monthly sum
   - Solar + Wind capacities match breakdown
4. Switch to "Actual" and verify totals recalculate
5. Switch to "Rephase" and verify totals recalculate

## 🎯 Why It Works Now

The calculation chain is now correct:

1. **Backend** calculates `.totalCapacity` based on capacity type:
   - PLAN/REPHASE: Uses Capacity field ✅
   - ACTUAL: Uses sum of monthly values ✅

2. **Frontend** `calculateTotals()` sums `.totalCapacity` values ✅

3. **Frontend** summary cards display `.totalCapacity` ✅

4. **Result**: Values respect capacity type exclusivity and calculation rules! ✅
