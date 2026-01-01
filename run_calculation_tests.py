#!/usr/bin/env python
"""
Simple test runner for calculation logic verification
"""

import sys
sys.path.insert(0, 'd:/PWORK/CEO-tracker/backend')

from main import (
    calculate_derived_values,
    is_section_included_in_totals,
    SECTION_INCLUSION_MAP,
)


def test_total_capacity_calculation():
    """Verify total_capacity = sum(Apr..Mar)"""
    monthly_dict = {
        'apr': 100, 'may': 100, 'jun': 100,
        'jul': 100, 'aug': 100, 'sep': 100,
        'oct': 100, 'nov': 100, 'dec': 100,
        'jan': 100, 'feb': 100, 'mar': 100
    }
    derived = calculate_derived_values(monthly_dict)
    assert derived['totalCapacity'] == 1200, f"Expected 1200, got {derived['totalCapacity']}"
    print("✓ test_total_capacity_calculation PASSED")


def test_cumm_till_oct_calculation():
    """Verify cumm_till_oct = sum(Apr..Oct)"""
    monthly_dict = {
        'apr': 100, 'may': 100, 'jun': 100,
        'jul': 100, 'aug': 100, 'sep': 100,
        'oct': 100, 'nov': 100, 'dec': 100,
        'jan': 100, 'feb': 100, 'mar': 100
    }
    derived = calculate_derived_values(monthly_dict)
    assert derived['cummTillOct'] == 700, f"Expected 700, got {derived['cummTillOct']}"
    print("✓ test_cumm_till_oct_calculation PASSED")


def test_quarterly_calculations():
    """Verify Q1, Q2, Q3, Q4 calculations"""
    monthly_dict = {
        'apr': 10, 'may': 20, 'jun': 30,  # Q1 = 60
        'jul': 40, 'aug': 50, 'sep': 60,  # Q2 = 150
        'oct': 70, 'nov': 80, 'dec': 90,  # Q3 = 240
        'jan': 100, 'feb': 110, 'mar': 120  # Q4 = 330
    }
    derived = calculate_derived_values(monthly_dict)
    assert derived['q1'] == 60, f"Expected Q1=60, got {derived['q1']}"
    assert derived['q2'] == 150, f"Expected Q2=150, got {derived['q2']}"
    assert derived['q3'] == 240, f"Expected Q3=240, got {derived['q3']}"
    assert derived['q4'] == 330, f"Expected Q4=330, got {derived['q4']}"
    print("✓ test_quarterly_calculations PASSED")


def test_quarterly_sum_equals_total():
    """Verify Q1+Q2+Q3+Q4 == totalCapacity"""
    monthly_dict = {
        'apr': 10, 'may': 20, 'jun': 30,
        'jul': 40, 'aug': 50, 'sep': 60,
        'oct': 70, 'nov': 80, 'dec': 90,
        'jan': 100, 'feb': 110, 'mar': 120
    }
    derived = calculate_derived_values(monthly_dict)
    quarterly_sum = derived['q1'] + derived['q2'] + derived['q3'] + derived['q4']
    assert quarterly_sum == derived['totalCapacity'], \
        f"Q1+Q2+Q3+Q4 ({quarterly_sum}) != totalCapacity ({derived['totalCapacity']})"
    print("✓ test_quarterly_sum_equals_total PASSED")


def test_included_sections():
    """Verify all included sections are marked correctly."""
    included_sections = [
        'A. Khavda Solar Projects',
        'B. Rajasthan Solar Projects',
        'C. Rajasthan Solar Additional 500MW',
        'A. Khavda Wind Projects',
        'C. Mundra Wind 76MW',
    ]
    for section in included_sections:
        assert is_section_included_in_totals(section) == True, \
            f"Section '{section}' should be INCLUDED but isn't"
    print("✓ test_included_sections PASSED")


def test_excluded_sections():
    """Verify all excluded sections are marked correctly."""
    excluded_sections = [
        'D1. Khavda Solar Copper + Merchant 50MW',
        'D2. Khavda Solar Internal 650MW',
        'B. Khavda Wind Internal 421MW',
        'D. Mundra Wind Internal 224.4MW',
    ]
    for section in excluded_sections:
        assert is_section_included_in_totals(section) == False, \
            f"Section '{section}' should be EXCLUDED but isn't"
    print("✓ test_excluded_sections PASSED")


def test_section_mapping_complete():
    """Verify all expected sections are in the mapping."""
    expected_sections = [
        'A. Khavda Solar Projects',
        'B. Rajasthan Solar Projects',
        'C. Rajasthan Solar Additional 500MW',
        'A. Khavda Wind Projects',
        'C. Mundra Wind 76MW',
        'D1. Khavda Solar Copper + Merchant 50MW',
        'D2. Khavda Solar Internal 650MW',
        'B. Khavda Wind Internal 421MW',
        'D. Mundra Wind Internal 224.4MW',
    ]
    for section in expected_sections:
        assert section in SECTION_INCLUSION_MAP, \
            f"Section '{section}' missing from SECTION_INCLUSION_MAP"
    print("✓ test_section_mapping_complete PASSED")


def test_plan_uses_capacity_not_months():
    """PLAN: Row_Total = Capacity (ignore monthly values)"""
    monthly_dict = {
        'apr': 10, 'may': 20, 'jun': 30,
        'jul': 40, 'aug': 50, 'sep': 60,
        'oct': 70, 'nov': 80, 'dec': 90,
        'jan': 100, 'feb': 110, 'mar': 120
    }
    capacity = 1000
    plan_actual = 'Plan'
    
    derived = calculate_derived_values(monthly_dict, capacity, plan_actual)
    
    # Should use Capacity, NOT sum of months (780)
    assert derived['totalCapacity'] == 1000, \
        f"PLAN should use Capacity (1000), got {derived['totalCapacity']}"
    print("✓ test_plan_uses_capacity_not_months PASSED")


def test_rephase_uses_capacity_not_months():
    """REPHASE: Row_Total = Capacity (ignore monthly values)"""
    monthly_dict = {
        'apr': 15, 'may': 25, 'jun': 35,
        'jul': 45, 'aug': 55, 'sep': 65,
        'oct': 75, 'nov': 85, 'dec': 95,
        'jan': 105, 'feb': 115, 'mar': 125
    }
    capacity = 800
    plan_actual = 'Rephase'
    
    derived = calculate_derived_values(monthly_dict, capacity, plan_actual)
    
    # Should use Capacity, NOT sum of months (840)
    assert derived['totalCapacity'] == 800, \
        f"REPHASE should use Capacity (800), got {derived['totalCapacity']}"
    print("✓ test_rephase_uses_capacity_not_months PASSED")


def test_actual_uses_monthly_sum_not_capacity():
    """ACTUAL: Row_Total = sum(Apr..Mar) (ignore Capacity)"""
    monthly_dict = {
        'apr': 10, 'may': 20, 'jun': 30,
        'jul': 40, 'aug': 50, 'sep': 60,
        'oct': 70, 'nov': 80, 'dec': 90,
        'jan': 100, 'feb': 110, 'mar': 120
    }
    capacity = 1000  # This is reference only
    plan_actual = 'Actual'
    
    derived = calculate_derived_values(monthly_dict, capacity, plan_actual)
    
    # Should use sum of months (780), NOT Capacity (1000)
    assert derived['totalCapacity'] == 780, \
        f"ACTUAL should sum months (780), got {derived['totalCapacity']}"
    print("✓ test_actual_uses_monthly_sum_not_capacity PASSED")


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("CALCULATION LOGIC VERIFICATION TESTS")
    print("="*60 + "\n")
    
    tests = [
        ("Derived Value Calculations", [
            test_total_capacity_calculation,
            test_cumm_till_oct_calculation,
            test_quarterly_calculations,
            test_quarterly_sum_equals_total,
        ]),
        ("Section Inclusion/Exclusion Logic", [
            test_included_sections,
            test_excluded_sections,
            test_section_mapping_complete,
        ]),
        ("Capacity Type Differentiation", [
            test_plan_uses_capacity_not_months,
            test_rephase_uses_capacity_not_months,
            test_actual_uses_monthly_sum_not_capacity,
        ]),
    ]
    
    total_passed = 0
    total_failed = 0
    
    for category, test_functions in tests:
        print(f"\n{category}:")
        print("-" * 60)
        for test_func in test_functions:
            try:
                test_func()
                total_passed += 1
            except AssertionError as e:
                print(f"✗ {test_func.__name__} FAILED: {str(e)}")
                total_failed += 1
            except Exception as e:
                print(f"✗ {test_func.__name__} ERROR: {str(e)}")
                total_failed += 1
    
    print("\n" + "="*60)
    print(f"RESULTS: {total_passed} passed, {total_failed} failed")
    print("="*60 + "\n")
    
    if total_failed > 0:
        sys.exit(1)
    else:
        print("All tests PASSED! ✓")
        sys.exit(0)


if __name__ == '__main__':
    main()
