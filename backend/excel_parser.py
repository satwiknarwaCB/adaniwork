"""
Excel Parser for AGEL Commissioning Data
Reads workbook with multiple sheets and extracts project data.

Sheets expected:
1. Summary Linked - Main data with Plan/Rephase/Actual
2. KH Solar Actual - Khavda Solar actual tracking
3. KH Wind Actual - Khavda Wind actual tracking  
4. RJ Solar Actual - Rajasthan Solar actual tracking
5. KH Wind Internal - Khavda Wind Internal tracking
"""

import pandas as pd
import io
from typing import Dict, List, Any, Optional
from datetime import datetime

# Month column mapping
MONTH_COLUMNS = {
    'Apr-25': 'apr', 'May-25': 'may', 'Jun-25': 'jun',
    'Jul-25': 'jul', 'Aug-25': 'aug', 'Sep-25': 'sep',
    'Oct-25': 'oct', 'Nov-25': 'nov', 'Dec-25': 'dec',
    'Jan-26': 'jan', 'Feb-26': 'feb', 'Mar-26': 'mar'
}

# Expected column indices in Summary Linked (based on actual CSV structure)
SUMMARY_COLS = {
    'sno': 1,           # S. No.
    'project_name': 2,  # Project Name
    'spv': 3,           # SPV
    'type': 4,          # Type (PPA/Merchant/Group)
    'plot_location': 5, # Plot / Location / PSS
    'capacity': 6,      # Capacity
    'project_type': 7,  # Type (repeated)
    'plan_actual': 8,   # Plan Actual (Plan/Rephase/Actual)
    # Monthly values start at column 9 (Apr-25) through 20 (Mar-26)
    'apr': 9, 'may': 10, 'jun': 11, 'jul': 12, 'aug': 13, 'sep': 14,
    'oct': 15, 'nov': 16, 'dec': 17, 'jan': 18, 'feb': 19, 'mar': 20,
    'total_capacity': 21,
    'cumm_till_oct': 22,  # Cumm till 30-Nov-25
    # Column 23 is empty
    'q1': 24, 'q2': 25, 'q3': 26, 'q4': 27
}

# Section markers to identify categories
SECTION_MARKERS = {
    'A. Khavda Solar Projects': ('Khavda Solar', 'A', True),
    'B. Rajasthan Solar Projects': ('Rajasthan Solar', 'B', True),
    'C. Rajasthan Solar Projects (Additional': ('Rajasthan Solar Additional 500MW', 'C', True),
    'D1. Khavda Solar (Copper': ('Khavda Solar Copper+Merchant 50MW', 'D1', False),
    'D2. Khavda Solar (Additional': ('Khavda Solar Internal 650MW', 'D2', False),
    'A. Khavda Wind Projects': ('Khavda Wind', 'A', True),
    'B. Khavda Wind (Additional': ('Khavda Wind Internal 421MW', 'B', False),
    'C. Mundra Wind': ('Mundra Wind 76MW', 'C', True),
    'D. Mundra Wind': ('Mundra Wind Internal 224.4MW', 'D', False),
}


def parse_excel_workbook(file_content: bytes, filename: str = "") -> Dict[str, Any]:
    """
    Parse Excel workbook with multiple sheets or a single CSV file.
    Returns dict with all sheets' data and parsed projects.
    """
    try:
        all_sheets = {}
        
        # Determine if it's a CSV or Excel based on filename or content
        is_csv = filename.lower().endswith('.csv')
        
        if is_csv:
            # Handle CSV (Summary Linked sheet)
            df = pd.read_csv(io.BytesIO(file_content), header=None)
            all_sheets = {'Summary Linked': df}
        else:
            # Handle Excel (Multi-sheet)
            try:
                all_sheets = pd.read_excel(io.BytesIO(file_content), sheet_name=None, header=None)
            except Exception as e:
                # If Excel reading fails, try CSV as fallback
                try:
                    df = pd.read_csv(io.BytesIO(file_content), header=None)
                    all_sheets = {'Summary Linked': df}
                except:
                    raise Exception(f"Failed to read file as Excel or CSV: {str(e)}")
        
        result = {
            'sheets_found': list(all_sheets.keys()),
            'sheet_count': len(all_sheets),
            'projects': [],
            'summaries': [],
            'errors': []
        }
        
        # Process each sheet
        for sheet_name, df in all_sheets.items():
            sheet_lower = sheet_name.lower()
            
            # Treat Summary Linked, Linked, or any sheet in a CSV as the summary data
            if is_csv or 'summary' in sheet_lower or 'linked' in sheet_lower:
                # Main Summary sheet
                projects, errors = parse_summary_sheet(df, sheet_name)
                result['projects'].extend(projects)
                result['errors'].extend(errors)
                
            elif 'solar' in sheet_lower and 'actual' in sheet_lower:
                # Solar Actual tracking
                actuals, errors = parse_actual_sheet(df, sheet_name, 'Solar')
                result['summaries'].extend(actuals)
                result['errors'].extend(errors)
                
            elif 'wind' in sheet_lower and 'actual' in sheet_lower:
                # Wind Actual tracking
                actuals, errors = parse_actual_sheet(df, sheet_name, 'Wind')
                result['summaries'].extend(actuals)
                result['errors'].extend(errors)
                
            elif 'internal' in sheet_lower:
                # Internal tracking
                actuals, errors = parse_actual_sheet(df, sheet_name, 'Internal')
                result['summaries'].extend(actuals)
                result['errors'].extend(errors)
        
        result['project_count'] = len(result['projects'])
        result['summary_count'] = len(result['summaries'])
        
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


def parse_summary_sheet(df: pd.DataFrame, sheet_name: str) -> tuple:
    """
    Parse the Summary Linked sheet to extract all projects.
    Returns (projects_list, errors_list)
    """
    projects = []
    errors = []
    
    current_category = None
    current_section = None
    included_in_total = True
    
    # STICKY PROJECT IDENTITY for merged cells
    last_project_identity = {
        'sno': 0,
        'project_name': '',
        'spv': '',
        'project_type': '',
        'plot_location': '',
        'capacity': 0
    }
    
    print(f"DEBUG: Parsing sheet '{sheet_name}' with {len(df)} rows")
    
    for idx, row in df.iterrows():
        try:
            # Check for section markers
            text_1 = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else ''
            text_0 = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ''
            row_text = f"{text_0} {text_1}"
            
            # 🛑 SKIP SUBTOTAL AND TOTAL ROWS
            skip_keywords = ['Subtotal', 'Total', 'Overall', 'Grand Total', 'Chairman Plan']
            if any(key.lower() in row_text.lower() for key in skip_keywords):
                print(f"DEBUG: Skipping aggregate row at {idx}: {row_text}")
                continue

            # Check if this is a section header
            for marker, (category, section, included) in SECTION_MARKERS.items():
                if marker in row_text:
                    current_category = category
                    current_section = section
                    included_in_total = included
                    print(f"DEBUG: Found Section - {current_category} ({current_section}) at row {idx}")
                    break
            
            # Skip rows before we find a category
            if current_category is None:
                continue
                
            # Check if this is a project row (has Plan/Rephase/Actual)
            plan_actual_val = row.iloc[SUMMARY_COLS['plan_actual']]
            plan_actual = str(plan_actual_val).strip() if pd.notna(plan_actual_val) else ''
            
            # Normalized values we accept
            if 'plan' in plan_actual.lower():
                plan_actual = 'Plan'
            elif 'rephase' in plan_actual.lower():
                plan_actual = 'Rephase'
            elif 'actual' in plan_actual.lower():
                plan_actual = 'Actual'
            else:
                continue
            
            # Get current row's project identity (may be empty if merged)
            current_name = str(row.iloc[SUMMARY_COLS['project_name']]).strip() if pd.notna(row.iloc[SUMMARY_COLS['project_name']]) else ''
            current_spv = str(row.iloc[SUMMARY_COLS['spv']]).strip() if pd.notna(row.iloc[SUMMARY_COLS['spv']]) else ''
            current_type = str(row.iloc[SUMMARY_COLS['type']]).strip() if pd.notna(row.iloc[SUMMARY_COLS['type']]) else ''
            current_location = str(row.iloc[SUMMARY_COLS['plot_location']]).strip() if pd.notna(row.iloc[SUMMARY_COLS['plot_location']]) else ''
            current_capacity = safe_float(row.iloc[SUMMARY_COLS['capacity']])
            
            # Get S.No
            sno_val = row.iloc[SUMMARY_COLS['sno']]
            try:
                if pd.isna(sno_val) or str(sno_val).strip() == '':
                    sno = 0
                else:
                    sno = int(float(sno_val))
            except:
                sno = 0
            
            # 🛑 STICKY LOGIC: If this is a Plan row with a name, update the sticky identity
            if plan_actual == 'Plan' and current_name:
                last_project_identity = {
                    'sno': sno if sno else last_project_identity['sno'],
                    'project_name': current_name,
                    'spv': current_spv if current_spv else last_project_identity['spv'],
                    'project_type': current_type if current_type else last_project_identity['project_type'],
                    'plot_location': current_location if current_location else last_project_identity['plot_location'],
                    'capacity': current_capacity if current_capacity else last_project_identity['capacity']
                }
            
            # Use sticky identity if current row has empty name (merged cell)
            if not current_name:
                proj_name = last_project_identity['project_name']
                proj_spv = last_project_identity['spv']
                proj_type = last_project_identity['project_type']
                proj_location = last_project_identity['plot_location']
                proj_capacity = last_project_identity['capacity']
                proj_sno = last_project_identity['sno']
            else:
                proj_name = current_name
                proj_spv = current_spv
                proj_type = current_type
                proj_location = current_location
                proj_capacity = current_capacity
                proj_sno = sno
            
            # Skip if still no name
            if not proj_name or any(key in proj_name for key in ['Summary', 'Total', 'Subtotal']):
                continue

            print(f"DEBUG: Found Project Row at {idx}: {proj_name} [{plan_actual}]")
            
            # Extract project data
            project = {
                'sno': proj_sno,
                'project_name': proj_name,
                'spv': proj_spv,
                'project_type': proj_type,
                'plot_location': proj_location,
                'capacity': proj_capacity,
                'plan_actual': plan_actual,
                'category': current_category,
                'section': current_section,
                'included_in_total': included_in_total,
                # Monthly values
                'apr': safe_float(row.iloc[SUMMARY_COLS['apr']]),
                'may': safe_float(row.iloc[SUMMARY_COLS['may']]),
                'jun': safe_float(row.iloc[SUMMARY_COLS['jun']]),
                'jul': safe_float(row.iloc[SUMMARY_COLS['jul']]),
                'aug': safe_float(row.iloc[SUMMARY_COLS['aug']]),
                'sep': safe_float(row.iloc[SUMMARY_COLS['sep']]),
                'oct': safe_float(row.iloc[SUMMARY_COLS['oct']]),
                'nov': safe_float(row.iloc[SUMMARY_COLS['nov']]),
                'dec': safe_float(row.iloc[SUMMARY_COLS['dec']]),
                'jan': safe_float(row.iloc[SUMMARY_COLS['jan']]),
                'feb': safe_float(row.iloc[SUMMARY_COLS['feb']]),
                'mar': safe_float(row.iloc[SUMMARY_COLS['mar']]),
                'total_capacity': safe_float(row.iloc[SUMMARY_COLS['total_capacity']]),
                'cumm_till_oct': safe_float(row.iloc[SUMMARY_COLS['cumm_till_oct']]),
                'q1': safe_float(row.iloc[SUMMARY_COLS['q1']]),
                'q2': safe_float(row.iloc[SUMMARY_COLS['q2']]),
                'q3': safe_float(row.iloc[SUMMARY_COLS['q3']]),
                'q4': safe_float(row.iloc[SUMMARY_COLS['q4']]),
            }
            
            projects.append(project)
                
        except Exception as e:
            errors.append(f"Row {idx} in {sheet_name}: {str(e)}")
    
    return projects, errors


def parse_actual_sheet(df: pd.DataFrame, sheet_name: str, category_type: str) -> tuple:
    """
    Parse Actual tracking sheets (Solar/Wind Actual).
    Extracts monthly totals for the category.
    Returns (actuals_list, errors_list)
    """
    actuals = []
    errors = []
    
    try:
        # Looking for a row that has 'Total' and monthly values
        # We assume the sheet structure might have months as columns
        # Search from bottom to find the final totals
        for idx in range(len(df)-1, -1, -1):
            row = df.iloc[idx]
            row_str = " ".join([str(v) for v in row.values if pd.notna(v)])
            
            # Look for keywords indicating a total row
            if any(key in row_str for key in ['Overall Total', 'Grand Total', 'Total (A', 'Total Plan', 'Total']):
                summary = {
                    'category': category_type,
                    'sheet_source': sheet_name,
                    'summary_type': 'Actual'
                }
                
                # Monthly values are usually in a sequence of 12 columns
                nums = []
                for val in row:
                    f = safe_float(val)
                    if f is not None:
                        nums.append(f)
                
                if len(nums) >= 12:
                    # In many Adani sheets, the last 12-14 numbers found in a total row
                    # represent Apr to Mar (sometimes followed by Q1-Q4 or Total)
                    # We'll try to find a sequence that looks like monthly data
                    # For simplicity, we'll take the first 12 valid numbers
                    months = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar']
                    for i, m in enumerate(months):
                        summary[m] = nums[i]
                    actuals.append(summary)
                    print(f"DEBUG: Found Actual summary in '{sheet_name}' at row {idx}")
                    break
    except Exception as e:
        errors.append(f"Error in {sheet_name}: {str(e)}")
        
    return actuals, errors


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


def import_projects_to_db(projects: List[Dict], summaries: List[Dict] = None, fiscal_year: str = "FY_25-26"):
    """
    Import parsed projects and summaries into the database.
    Clears existing data and inserts new.
    """
    from database import get_db_connection
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Clear existing data for this fiscal year
        cursor.execute("DELETE FROM commissioning_projects WHERE fiscal_year = ?", (fiscal_year,))
        cursor.execute("DELETE FROM commissioning_summaries WHERE fiscal_year = ?", (fiscal_year,))
        
        # --- Deduplication Storage ---
        # Key: (name, spv, plan_actual, section, category)
        unique_projects = {}
        
        for proj in projects:
            name = str(proj.get('project_name', '')).strip()
            spv = str(proj.get('spv', '')).strip()
            status = str(proj.get('plan_actual', '')).strip()
            section = str(proj.get('section', '')).strip()
            category = str(proj.get('category', '')).strip()
            location = str(proj.get('plot_location', '')).strip()
            
            if not name or not status:
                continue
                
            key = (name, spv, status, section, category, location)
            
            # If we see the same project, we keep the one with most values
            if key not in unique_projects:
                unique_projects[key] = proj
            else:
                existing = unique_projects[key]
                existing_vals = sum(1 for m in ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'] if existing.get(m) is not None)
                new_vals = sum(1 for m in ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'] if proj.get(m) is not None)
                if new_vals > existing_vals:
                    unique_projects[key] = proj

        # Insert unique projects
        inserted_projects = 0
        for proj in unique_projects.values():
            cursor.execute('''
                INSERT INTO commissioning_projects (
                    fiscal_year, sno, project_name, spv, project_type, plot_location,
                    capacity, plan_actual, category, section, included_in_total,
                    apr, may, jun, jul, aug, sep, oct, nov, dec, jan, feb, mar,
                    total_capacity, cumm_till_oct, q1, q2, q3, q4
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                fiscal_year,
                proj.get('sno'),
                proj.get('project_name', ''),
                proj.get('spv', ''),
                proj.get('project_type', ''),
                proj.get('plot_location', ''),
                proj.get('capacity'),
                proj.get('plan_actual', ''),
                proj.get('category', ''),
                proj.get('section', ''),
                proj.get('included_in_total', True),
                proj.get('apr'), proj.get('may'), proj.get('jun'),
                proj.get('jul'), proj.get('aug'), proj.get('sep'),
                proj.get('oct'), proj.get('nov'), proj.get('dec'),
                proj.get('jan'), proj.get('feb'), proj.get('mar'),
                proj.get('total_capacity'),
                proj.get('cumm_till_oct'),
                proj.get('q1'), proj.get('q2'), proj.get('q3'), proj.get('q4')
            ))
            inserted_projects += 1
            
        # Insert summaries (Actual tracking totals)
        inserted_summaries = 0
        if summaries:
            for s in summaries:
                cursor.execute('''
                    INSERT INTO commissioning_summaries (
                        fiscal_year, category, summary_type,
                        apr, may, jun, jul, aug, sep, oct, nov, dec, jan, feb, mar
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    fiscal_year,
                    s.get('category'),
                    s.get('type', 'Actual'),
                    s.get('apr', 0), s.get('may', 0), s.get('jun', 0),
                    s.get('jul', 0), s.get('aug', 0), s.get('sep', 0),
                    s.get('oct', 0), s.get('nov', 0), s.get('dec', 0),
                    s.get('jan', 0), s.get('feb', 0), s.get('mar', 0)
                ))
                inserted_summaries += 1
        
        conn.commit()
        return {
            'success': True, 
            'inserted_projects': inserted_projects,
            'inserted_summaries': inserted_summaries
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        conn.rollback()
        return {'success': False, 'error': str(e)}
    finally:
        conn.close()
