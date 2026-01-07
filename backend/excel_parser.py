"""
Excel Parser for AGEL Commissioning Data
Matches the EXACT structure of AGEL Excel files.
"""

import pandas as pd
import io
from typing import Dict, List, Any, Optional
from datetime import datetime

# Section markers - detect category headers in the Excel
SECTION_MARKERS = {
    # Solar sections
    'A. Khavda Solar Projects': ('Khavda Solar', 'A', True),
    'A. Khavda Solar': ('Khavda Solar', 'A', True),
    'B. Rajasthan Solar Projects': ('Rajasthan Solar', 'B', True),
    'B. Rajasthan Solar': ('Rajasthan Solar', 'B', True),
    'C. Rajasthan Solar Projects': ('Rajasthan Solar Additional 500MW', 'C', True),
    'C. Rajasthan Solar': ('Rajasthan Solar Additional 500MW', 'C', True),
    'D1. Khavda Solar (Copper': ('Khavda Solar Copper+Merchant 50MW', 'D1', False),
    'D1. Khavda Solar': ('Khavda Solar Copper+Merchant 50MW', 'D1', False),
    'D2. Khavda Solar (Additional': ('Khavda Solar Internal 650MW', 'D2', False),
    'D2. Khavda Solar': ('Khavda Solar Internal 650MW', 'D2', False),
    # Wind sections
    'A. Khavda Wind Projects': ('Khavda Wind', 'A', True),
    'A. Khavda Wind': ('Khavda Wind', 'A', True),
    'B. Khavda Wind (Additional': ('Khavda Wind Internal 421MW', 'B', False),
    'B. Khavda Wind': ('Khavda Wind Internal 421MW', 'B', False),
    'C. Mundra Wind': ('Mundra Wind 76MW', 'C', True),
    'D. Mundra Wind': ('Mundra Wind Internal 224.4MW', 'D', False),
}

# Skip these rows - they are summaries, not projects
SKIP_PATTERNS = [
    'agel overall', 'agel fy', 'chairman', 'budget', 'grand total',
    'total (a', 'total(a', 'monthwise', '(a+b', '(a + b', '(1+2',
    'subtotal', 'overall total'
]


def safe_float(value) -> Optional[float]:
    """Safely convert value to float, return None if invalid."""
    if pd.isna(value) or value == '' or value is None:
        return None
    try:
        if isinstance(value, str):
            value = value.replace(',', '').replace('%', '').strip()
        return float(value)
    except (ValueError, TypeError):
        return None


def parse_excel_workbook(file_content: bytes, filename: str = "") -> Dict[str, Any]:
    """Parse Excel workbook and extract project data."""
    try:
        all_sheets = {}
        is_csv = filename.lower().endswith('.csv')
        
        if is_csv:
            df = pd.read_csv(io.BytesIO(file_content), header=None)
            all_sheets = {'Summary Linked': df}
        else:
            all_sheets = pd.read_excel(io.BytesIO(file_content), sheet_name=None, header=None)
        
        result = {
            'sheets_found': list(all_sheets.keys()),
            'sheet_count': len(all_sheets),
            'projects': [],
            'summaries': [],
            'errors': []
        }
        
        # PRIORITY: Parse ONLY the Summary Linked sheet for main data
        # This avoids duplicates from other sheets
        summary_sheet = None
        for sheet_name in all_sheets.keys():
            if 'summary' in sheet_name.lower() and 'linked' in sheet_name.lower():
                summary_sheet = sheet_name
                break
        
        if summary_sheet:
            print(f"INFO: Using '{summary_sheet}' as primary data source")
            projects, errors = parse_data_sheet(all_sheets[summary_sheet], summary_sheet)
            result['projects'].extend(projects)
            result['errors'].extend(errors)
            print(f"INFO: Extracted {len(projects)} projects from '{summary_sheet}'")
        else:
            # Fallback: try all sheets if no Summary Linked found
            print("WARNING: No 'Summary Linked' sheet found, trying all sheets")
            for sheet_name, df in all_sheets.items():
                projects, errors = parse_data_sheet(df, sheet_name)
                if projects:
                    result['projects'].extend(projects)
                    print(f"INFO: Extracted {len(projects)} projects from '{sheet_name}'")
                if errors:
                    result['errors'].extend(errors)
        
        result['project_count'] = len(result['projects'])
        return result
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            'sheets_found': [],
            'sheet_count': 0,
            'projects': [],
            'summaries': [],
            'errors': [f"Failed to process file: {str(e)}"]
        }


def parse_data_sheet(df: pd.DataFrame, sheet_name: str) -> tuple:
    """
    Parse a sheet with EXACT column matching for AGEL format.
    """
    projects = []
    errors = []
    
    # Infer status and category from sheet name
    sheet_lower = sheet_name.lower()
    inferred_status = None
    if 'plan' in sheet_lower and 'actual' not in sheet_lower: 
        inferred_status = 'Plan'
    elif 'rephase' in sheet_lower: 
        inferred_status = 'Rephase'
    elif 'actual' in sheet_lower: 
        inferred_status = 'Actual'
    
    inferred_category = None
    inferred_section = 'A'
    if 'kh' in sheet_lower and 'solar' in sheet_lower: 
        inferred_category = 'Khavda Solar'
    elif 'rj' in sheet_lower and 'solar' in sheet_lower: 
        inferred_category = 'Rajasthan Solar'
    elif 'kh' in sheet_lower and 'wind' in sheet_lower: 
        inferred_category = 'Khavda Wind'
    elif 'mundra' in sheet_lower: 
        inferred_category = 'Mundra Wind 76MW'
    
    # Internal sheets are excluded from totals
    included_default = True
    if 'internal' in sheet_lower:
        included_default = False
        inferred_section = 'B' if 'wind' in sheet_lower else 'D2'

    # ===== FIND HEADER ROW =====
    header_row_idx = -1
    col_map = {}
    
    for idx, row in df.iterrows():
        row_vals = list(row.values)
        row_str = ' '.join([str(v).lower() for v in row_vals if pd.notna(v)])
        
        # Look for header row with key columns
        has_sno = 's.no' in row_str or 's. no' in row_str or 'sl no' in row_str or 'priority' in row_str
        has_project = 'project' in row_str
        has_capacity = 'capacity' in row_str
        
        if has_sno and has_project and has_capacity:
            header_row_idx = idx
            
            # Map each column
            for i, val in enumerate(row_vals):
                if pd.isna(val):
                    continue
                    
                # Handle datetime columns (month headers)
                if isinstance(val, (datetime, pd.Timestamp)):
                    month_map = {4:'apr', 5:'may', 6:'jun', 7:'jul', 8:'aug', 9:'sep', 
                                10:'oct', 11:'nov', 12:'dec', 1:'jan', 2:'feb', 3:'mar'}
                    if val.month in month_map:
                        col_map[month_map[val.month]] = i
                    continue
                
                low = str(val).lower().replace('\n', ' ').strip()
                
                # Exact column mapping - ORDER MATTERS!
                # Check for cumm/cumulative FIRST before month patterns
                if 'cumm' in low or 'cumulative' in low:
                    col_map['cumm_till_oct'] = i
                elif 's.no' in low or 's. no' in low or 'sl no' in low or low == 'priority':
                    col_map['sno'] = i
                elif 'project' in low and 'name' in low:
                    col_map['project_name'] = i
                elif low == 'project':
                    col_map['project_name'] = i
                elif low == 'spv':
                    col_map['spv'] = i
                elif low == 'type':
                    col_map['project_type'] = i
                elif 'plot' in low or 'location' in low or 'pss' in low:
                    col_map['plot_location'] = i
                elif 'capacity' in low and 'total' not in low:
                    if 'capacity' not in col_map:
                        col_map['capacity'] = i
                elif 'plan' in low and ('actual' in low or 'status' in low):
                    col_map['plan_actual'] = i
                elif 'total' in low and 'capacity' in low:
                    col_map['total_capacity'] = i
                elif low == 'q1':
                    col_map['q1'] = i
                elif low == 'q2':
                    col_map['q2'] = i
                elif low == 'q3':
                    col_map['q3'] = i
                elif low == 'q4':
                    col_map['q4'] = i
                else:
                    # Month string matching (e.g., "Apr-25") - only if not already handled
                    month_patterns = {
                        'apr-': 'apr', 'may-': 'may', 'jun-': 'jun', 'jul-': 'jul',
                        'aug-': 'aug', 'sep-': 'sep', 'oct-': 'oct', 'nov-': 'nov',
                        'dec-': 'dec', 'jan-': 'jan', 'feb-': 'feb', 'mar-': 'mar'
                    }
                    for pattern, month_key in month_patterns.items():
                        if pattern in low and month_key not in col_map:
                            col_map[month_key] = i
                            break
            
            print(f"DEBUG: Header found at row {idx} in '{sheet_name}'")
            print(f"DEBUG: Column map: {col_map}")
            break
    
    if header_row_idx == -1:
        return [], []
    
    # ===== PROCESS DATA ROWS =====
    current_category = inferred_category
    current_section = inferred_section
    included_in_total = included_default
    
    # For sticky identity (merged cells)
    sticky = {'sno': '', 'project_name': '', 'spv': '', 'project_type': '', 'plot_location': '', 'capacity': 0}
    
    name_idx = col_map.get('project_name', 1)
    type_idx = col_map.get('plan_actual')
    
    for idx, row in df.iloc[header_row_idx + 1:].iterrows():
        row_vals = list(row.values)
        
        # ===== DETECT SECTION MARKERS =====
        # Usually in columns 0-2
        row_text = ' '.join([str(row_vals[i]) for i in range(min(3, len(row_vals))) if pd.notna(row_vals[i])])
        row_text_lower = row_text.lower()
        
        # Check for section markers
        section_found = False
        for marker, (cat, sec, inc) in SECTION_MARKERS.items():
            if marker.lower() in row_text_lower:
                current_category = cat
                current_section = sec
                included_in_total = inc
                section_found = True
                print(f"DEBUG: Section marker found: {marker} -> {cat}, {sec}, included={inc}")
                break
        
        if section_found:
            continue
        
        # ===== SKIP NON-PROJECT ROWS =====
        should_skip = False
        for pattern in SKIP_PATTERNS:
            if pattern in row_text_lower:
                should_skip = True
                break
        
        if should_skip:
            continue
        
        # ===== GET PROJECT NAME =====
        name_val = row_vals[name_idx] if name_idx < len(row_vals) else None
        name = str(name_val).strip() if pd.notna(name_val) else ''
        
        # Skip empty or invalid names
        if not name or name.lower() in ['nan', 'none', '']:
            # Use sticky name if this is a Rephase/Actual row
            if not sticky['project_name']:
                continue
        else:
            # This is a new project - update sticky
            sticky['project_name'] = name
            sticky['sno'] = str(row_vals[col_map.get('sno', 0)]).strip() if pd.notna(row_vals[col_map.get('sno', 0)]) else ''
            sticky['spv'] = str(row_vals[col_map.get('spv', 2)]).strip() if col_map.get('spv') and pd.notna(row_vals[col_map.get('spv')]) else ''
            sticky['project_type'] = str(row_vals[col_map.get('project_type', 3)]).strip() if col_map.get('project_type') and pd.notna(row_vals[col_map.get('project_type')]) else ''
            sticky['plot_location'] = str(row_vals[col_map.get('plot_location', 4)]).strip() if col_map.get('plot_location') and pd.notna(row_vals[col_map.get('plot_location')]) else ''
            sticky['capacity'] = safe_float(row_vals[col_map.get('capacity', 5)]) or 0
        
        # ===== DETECT PLAN/REPHASE/ACTUAL =====
        if type_idx is not None and type_idx < len(row_vals):
            raw_type = str(row_vals[type_idx]).lower().strip()
            if 'plan' in raw_type and 'rephase' not in raw_type:
                status = 'Plan'
            elif 'rephase' in raw_type:
                status = 'Rephase'
            elif 'actual' in raw_type or 'fcst' in raw_type:
                status = 'Actual'
            else:
                status = inferred_status or 'Plan'
        else:
            status = inferred_status or 'Plan'
        
        # Skip if no category assigned yet
        if current_category is None:
            continue
        
        # ===== BUILD PROJECT RECORD =====
        project = {
            'sno': sticky['sno'],
            'project_name': sticky['project_name'],
            'spv': sticky['spv'],
            'project_type': sticky['project_type'],
            'plot_location': sticky['plot_location'],
            'capacity': sticky['capacity'],
            'plan_actual': status,
            'category': current_category,
            'section': current_section,
            'included_in_total': included_in_total,
        }
        
        # Monthly values
        for month in ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar']:
            idx_m = col_map.get(month)
            if idx_m is not None and idx_m < len(row_vals):
                project[month] = safe_float(row_vals[idx_m])
            else:
                project[month] = None
        
        # Derived values
        for key in ['total_capacity', 'cumm_till_oct', 'q1', 'q2', 'q3', 'q4']:
            idx_k = col_map.get(key)
            if idx_k is not None and idx_k < len(row_vals):
                project[key] = safe_float(row_vals[idx_k])
            else:
                project[key] = None
        
        projects.append(project)
    
    return projects, errors


def import_projects_to_db(projects: List[Dict], summaries: List[Dict] = None, fiscal_year: str = "FY_25-26"):
    """Import parsed projects into the database."""
    from database import get_db_connection
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Clear existing data
        cursor.execute("DELETE FROM commissioning_projects WHERE fiscal_year = ?", (fiscal_year,))
        cursor.execute("DELETE FROM commissioning_summaries WHERE fiscal_year = ?", (fiscal_year,))
        
        # Deduplicate
        unique = {}
        for p in projects:
            key = (p['project_name'], p['spv'], p['plan_actual'], p['section'], p['category'])
            if key not in unique:
                unique[key] = p
            else:
                # Keep row with more data
                existing = unique[key]
                new_vals = sum(1 for m in ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar'] if p.get(m))
                old_vals = sum(1 for m in ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar'] if existing.get(m))
                if new_vals > old_vals:
                    unique[key] = p
        
        # Insert
        inserted = 0
        for p in unique.values():
            cursor.execute('''
                INSERT INTO commissioning_projects (
                    fiscal_year, sno, project_name, spv, project_type, plot_location,
                    capacity, plan_actual, category, section, included_in_total,
                    apr, may, jun, jul, aug, sep, oct, nov, dec, jan, feb, mar,
                    total_capacity, cumm_till_oct, q1, q2, q3, q4
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                fiscal_year, p.get('sno'), p.get('project_name'), p.get('spv'),
                p.get('project_type'), p.get('plot_location'), p.get('capacity'),
                p.get('plan_actual'), p.get('category'), p.get('section'),
                p.get('included_in_total', True),
                p.get('apr'), p.get('may'), p.get('jun'), p.get('jul'),
                p.get('aug'), p.get('sep'), p.get('oct'), p.get('nov'),
                p.get('dec'), p.get('jan'), p.get('feb'), p.get('mar'),
                p.get('total_capacity'), p.get('cumm_till_oct'),
                p.get('q1'), p.get('q2'), p.get('q3'), p.get('q4')
            ))
            inserted += 1
        
        conn.commit()
        return {'success': True, 'inserted_projects': inserted, 'inserted_summaries': 0}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        conn.rollback()
        return {'success': False, 'error': str(e)}
    finally:
        conn.close()
