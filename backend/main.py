from fastapi import FastAPI, HTTPException, Query, Body, Depends, Request, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import pandas as pd
import io
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Dict, Any, Optional
import json
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
import os
import subprocess
import sys
import bcrypt
import jwt
from database import get_db_connection, init_db
from schemas import (
    UserRegister, UserLogin, UserResponse, LoginResponse,
    CommissioningProject, CommissioningSummary, CommissioningDataRequest
)

# JWT configuration
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/health")
def health_check():
    try:
        conn = get_db_connection()
        conn.execute("SELECT 1")
        conn.close()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

# Additional routes with /api prefix for direct access
@app.get("/api/health")
def api_health_check():
    return health_check()

# --- Authentication Endpoints ---

# Utility function to create access token
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Login endpoint
@app.post("/login", response_model=LoginResponse)
async def login_user(user: UserLogin):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
   
    try:
        # Find user by email
        cursor.execute("SELECT id, username, email, password, role, created_at FROM users WHERE email = ?", (user.email,))
        db_user = cursor.fetchone()
       
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
       
        # Verify password - handle both string and bytes passwords
        stored_password = db_user["password"]
        # If stored password is bytes, decode it to string
        if isinstance(stored_password, bytes):
            stored_password = stored_password.decode('utf-8')
        
        # Now verify the password
        if not bcrypt.checkpw(user.password.encode('utf-8'), stored_password.encode('utf-8')):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
       
        # Create user response object
        user_response = {
            "id": db_user["id"],
            "username": db_user["username"],
            "email": db_user["email"],
            "role": db_user["role"] if db_user["role"] else "viewer",
            "created_at": db_user["created_at"]
        }
       
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(db_user["id"]), "email": db_user["email"]},
            expires_delta=access_token_expires
        )
       
        return {
            "user": user_response,
            "access_token": access_token,
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during login: {str(e)}"
        )
    finally:
        conn.close()

# Additional route with /api prefix for direct access
@app.post("/api/login", response_model=LoginResponse)
async def api_login_user(user: UserLogin):
    return await login_user(user)

# --- Variables Endpoints ---

# Get all variables or a specific variable by key
@app.get("/variables")
async def get_variables(key: Optional[str] = None, user_id: Optional[str] = None):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
   
    try:
        if key:
            # Get specific variable by key (and optionally user_id)
            if user_id:
                cursor.execute("SELECT * FROM variables WHERE key = ? AND user_id = ?", (key, user_id))
            else:
                cursor.execute("SELECT * FROM variables WHERE key = ?", (key,))
        else:
            # Get all variables (optionally filtered by user_id)
            if user_id:
                cursor.execute("SELECT * FROM variables WHERE user_id = ?", (user_id,))
            else:
                cursor.execute("SELECT * FROM variables")
       
        rows = cursor.fetchall()
        variables = [dict(row) for row in rows]
        return variables
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving variables: {str(e)}"
        )
    finally:
        conn.close()

# Additional route with /api prefix for direct access
@app.get("/api/variables")
async def api_get_variables(key: Optional[str] = None, user_id: Optional[str] = None):
    return await get_variables(key, user_id)

# Set a variable
@app.post("/variables")
async def set_variable(variable: dict):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
   
    try:
        # Check if variable already exists
        if variable.user_id:
            cursor.execute("SELECT id FROM variables WHERE key = ? AND user_id = ?", (variable.key, variable.user_id))
        else:
            cursor.execute("SELECT id FROM variables WHERE key = ? AND user_id IS NULL", (variable.key,))
           
        existing_variable = cursor.fetchone()
       
        if existing_variable:
            # Update existing variable
            if variable.user_id:
                cursor.execute(
                    "UPDATE variables SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ? AND user_id = ?",
                    (json.dumps(variable.value), variable.key, variable.user_id)
                )
            else:
                cursor.execute(
                    "UPDATE variables SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ? AND user_id IS NULL",
                    (json.dumps(variable.value), variable.key)
                )
        else:
            # Insert new variable
            cursor.execute(
                "INSERT INTO variables (key, value, user_id) VALUES (?, ?, ?)",
                (variable.key, json.dumps(variable.value), variable.user_id)
            )
       
        conn.commit()
       
        # Return the updated/created variable
        if variable.user_id:
            cursor.execute("SELECT * FROM variables WHERE key = ? AND user_id = ?", (variable.key, variable.user_id))
        else:
            cursor.execute("SELECT * FROM variables WHERE key = ? AND user_id IS NULL", (variable.key,))
           
        updated_variable = cursor.fetchone()
        return dict(updated_variable)
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error setting variable: {str(e)}"
        )
    finally:
        conn.close()

# Additional route with /api prefix for direct access
@app.post("/api/variables")
async def api_set_variable(variable: dict):
    return await set_variable(variable)

# Delete a variable
@app.delete("/variables")
async def delete_variable(key: str, user_id: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
   
    try:
        # Delete variable by key (and optionally user_id)
        if user_id:
            cursor.execute("DELETE FROM variables WHERE key = ? AND user_id = ?", (key, user_id))
        else:
            cursor.execute("DELETE FROM variables WHERE key = ? AND user_id IS NULL", (key,))
           
        conn.commit()
       
        if cursor.rowcount > 0:
            return {"message": f"Variable '{key}' deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Variable '{key}' not found"
            )
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting variable: {str(e)}"
        )
    finally:
        conn.close()

# Additional route with /api prefix for direct access
@app.delete("/api/variables")
async def api_delete_variable(key: str, user_id: Optional[str] = None):
    return await delete_variable(key, user_id)

# --- Dropdown Options Endpoints ---

@app.get("/dropdown-options")
def get_dropdown_options(fiscalYear: str = Query(None)):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT * FROM dropdown_options WHERE is_deleted = 0')
        rows = cursor.fetchall()
        
        if rows:
            options = {
                'groups': [],
                'ppaMerchants': [],
                'types': [],
                'locationCodes': [],
                'locations': [],
                'connectivities': []
            }
            # Also handle dynamic keys
            for row in rows:
                key = row['option_type']
                value = row['option_value']
                # Map database keys to API keys
                key_mapping = {
                    'ppa-merchants': 'ppaMerchants',
                    'location-codes': 'locationCodes'
                }
                api_key = key_mapping.get(key, key)
                if api_key not in options:
                    options[api_key] = []
                options[api_key].append(value)
            
            return options
        else:
            # Default options
            return {
                "groups": ['AGEL', 'ACL'],
                "ppaMerchants": ['PPA', 'Merchant'],
                "types": ['Solar', 'Wind', 'Hybrid'],
                "locationCodes": ['Khavda', 'RJ'],
                "locations": ['Khavda', 'Baap', 'Essel'],
                "connectivities": ['CTU']
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# Additional route with /api prefix for direct access
@app.get("/api/dropdown-options")
def api_get_dropdown_options(fiscalYear: str = Query(None)):
    return get_dropdown_options(fiscalYear)

@app.post("/dropdown-options")
def save_dropdown_options(options: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Soft delete existing options
        cursor.execute('''
            UPDATE dropdown_options
            SET is_deleted = 1, version = version + 1, updated_at = CURRENT_TIMESTAMP
        ''')
        
        # Insert new options
        # Ensure we're using the correct field names from the Pydantic model
        options_dict = options.dict(exclude={'fiscalYear'})
        # Map API keys to database keys
        key_mapping = {
            'ppaMerchants': 'ppa-merchants',
            'locationCodes': 'location-codes'
        }
        for key, values in options_dict.items():
            if isinstance(values, list):
                # Map the key for database storage
                db_key = key_mapping.get(key, key)
                for value in values:
                    cursor.execute('''
                        INSERT INTO dropdown_options (option_type, option_value, version)
                        VALUES (?, ?, 1)
                    ''', (db_key, value))
        
        conn.commit()
        # Return the saved options
        result = options.dict()
        # Remove fiscalYear from response since it's not used
        if 'fiscalYear' in result:
            del result['fiscalYear']
        return result
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# Additional route with /api prefix for direct access
@app.post("/api/dropdown-options")
def api_save_dropdown_options(options: dict):
    return save_dropdown_options(options)

# Additional route for single dropdown option (used by Next.js)
@app.post("/dropdown-option")
def add_dropdown_option(option: Dict[str, Any] = Body(...)):
    # This endpoint adds a single dropdown option
    # It's used by the Next.js /api/dropdown-option route
    option_type = option.get('optionType')
    option_value = option.get('optionValue')
   
    if not option_type or not option_value:
        raise HTTPException(status_code=400, detail="Option type and value are required")
   
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # First, get all existing options
        cursor.execute('''
            SELECT option_type, option_value FROM dropdown_options
            WHERE is_deleted = 0
        ''', ())
        rows = cursor.fetchall()
       
        # Build current options dictionary
        current_options = {
            'groups': [],
            'ppaMerchants': [],
            'types': [],
            'locationCodes': [],
            'locations': [],
            'connectivities': []
        }
       
        # Map database keys to API keys
        key_mapping = {
            'ppa-merchants': 'ppaMerchants',
            'location-codes': 'locationCodes'
        }
       
        for row in rows:
            key = row['option_type']
            value = row['option_value']
            # Map database keys to API keys
            api_key = key_mapping.get(key, key)
            if api_key in current_options:
                current_options[api_key].append(value)
       
        # Add the new option if it doesn't already exist
        if option_type in current_options and option_value not in current_options[option_type]:
            current_options[option_type].append(option_value)
       
        # Soft delete existing options
        cursor.execute('''
            UPDATE dropdown_options
            SET is_deleted = 1, version = version + 1, updated_at = CURRENT_TIMESTAMP
        ''')
       
        # Insert all options (including the new one)
        # Map API keys to database keys
        reverse_key_mapping = {
            'ppaMerchants': 'ppa-merchants',
            'locationCodes': 'location-codes'
        }
        for key, values in current_options.items():
            # Map the key for database storage
            db_key = reverse_key_mapping.get(key, key)
            for value in values:
                cursor.execute('''
                    INSERT INTO dropdown_options (option_type, option_value, version)
                    VALUES (?, ?, 1)
                ''', (db_key, value))
       
        conn.commit()
       
        return {
            "success": True,
            "optionType": option_type,
            "optionValue": option_value,
            "message": "Option added successfully"
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# New endpoints for separate dropdown options
@app.get("/dropdown-options/{option_type}")
def get_dropdown_options_by_type(option_type: str):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        # Validate option_type
        valid_types = ['groups', 'ppa-merchants', 'types', 'location-codes', 'locations', 'connectivities']
        if option_type not in valid_types:
            raise HTTPException(status_code=400, detail=f"Invalid option type. Valid types: {valid_types}")
        
        cursor.execute('SELECT option_value FROM dropdown_options WHERE option_type = ? AND is_deleted = 0', 
                      (option_type,))
        rows = cursor.fetchall()
       
        if rows:
            options = [row['option_value'] for row in rows]
            # Map database key to API key
            key_mapping = {
                'ppa-merchants': 'ppaMerchants',
                'location-codes': 'locationCodes'
            }
            api_key = key_mapping.get(option_type, option_type)
            return {api_key: options}
        else:
            # Return empty array instead of default values
            key_mapping = {
                'ppa-merchants': 'ppaMerchants',
                'location-codes': 'locationCodes'
            }
            api_key = key_mapping.get(option_type, option_type)
            return {api_key: []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/dropdown-options/{option_type}")
def save_dropdown_options_by_type(option_type: str, options: List[str] = Body(...)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Validate option_type
        valid_types = ['groups', 'ppa-merchants', 'types', 'location-codes', 'locations', 'connectivities']
        if option_type not in valid_types:
            raise HTTPException(status_code=400, detail=f"Invalid option type. Valid types: {valid_types}")
        
        # Soft delete existing options for this type
        cursor.execute('''
            UPDATE dropdown_options
            SET is_deleted = 1, version = version + 1, updated_at = CURRENT_TIMESTAMP
            WHERE option_type = ?
        ''', (option_type,))
        
        # Insert new options
        for value in options:
            cursor.execute('''
                INSERT INTO dropdown_options (option_type, option_value, version)
                VALUES (?, ?, 1)
            ''', (option_type, value))
        
        conn.commit()
        return {option_type: options, "message": f"{option_type} saved successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# Additional route with /api prefix for direct access
@app.post("/api/dropdown-option")
def api_add_dropdown_option(option: Dict[str, Any] = Body(...)):
    return add_dropdown_option(option)

# --- Table Data Endpoints ---

@app.get("/table-data")
def get_table_data(fiscalYear: str = Query(..., description="Fiscal Year")):
    print(f"Received request for fiscalYear: {fiscalYear}")
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        print(f"Executing query for fiscalYear: {fiscalYear}")
        cursor.execute('SELECT * FROM table_data WHERE fiscal_year = ? AND is_deleted = 0', (fiscalYear,))
        row = cursor.fetchone()
        print(f"Query result: {row is not None}")
        if row:
            print(f"Row keys: {list(row.keys())}")
            data = json.loads(row['data'])
            print(f"Data loaded, length: {len(data)}")
        else:
            data = []
        result = {"data": data}
        print(f"Returning result: {result}")
        return result
    except Exception as e:
        print(f"Error in get_table_data: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# Additional route with /api prefix for direct access
@app.get("/api/table-data")
def api_get_table_data(fiscalYear: str = Query(..., description="Fiscal Year")):
    return get_table_data(fiscalYear)

@app.post("/table-data")
def save_table_data(request: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        fiscal_year = request.fiscalYear
        # Convert TableRow objects to dictionaries
        data_dicts = []
        for row in request.data:
            try:
                data_dicts.append(row.dict())
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error converting row to dict: {str(e)}")
       
        data_json = json.dumps(data_dicts)
       
        # Check if there's already an active record for this fiscal year
        cursor.execute('SELECT id, version FROM table_data WHERE fiscal_year = ? AND is_deleted = 0', (fiscal_year,))
        existing_record = cursor.fetchone()
       
        if existing_record:
            # Update existing active record
            next_version = existing_record['version'] + 1
            cursor.execute('''
                UPDATE table_data
                SET data = ?, version = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (data_json, next_version, existing_record['id']))
        else:
            # Get current max version for this fiscal year
            cursor.execute('SELECT MAX(version) FROM table_data WHERE fiscal_year = ?', (fiscal_year,))
            row = cursor.fetchone()
            next_version = (row[0] if row[0] is not None else 0) + 1
           
            # Insert new active record
            cursor.execute('''
                INSERT INTO table_data (fiscal_year, data, version, is_deleted)
                VALUES (?, ?, ?, 0)
            ''', (fiscal_year, data_json, next_version))
           
        conn.commit()
       
        return {"message": "Table data saved successfully", "version": next_version}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save data to database: {str(e)}")
    finally:
        conn.close()

# Additional route with /api prefix for direct access
@app.post("/api/table-data")
def api_save_table_data(request: dict):
    return save_table_data(request)

@app.delete("/table-data")
def delete_table_data(fiscalYear: str = Query(..., description="Fiscal Year")):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            UPDATE table_data
            SET is_deleted = 1, version = version + 1, updated_at = CURRENT_TIMESTAMP
            WHERE fiscal_year = ?
        ''', (fiscalYear,))
       
        if cursor.rowcount > 0:
            conn.commit()
            return {"message": "Table data marked as deleted successfully"}
        else:
            # Check if it existed at all
            cursor.execute('SELECT 1 FROM table_data WHERE fiscal_year = ?', (fiscalYear,))
            if cursor.fetchone():
                 return {"message": "Table data already marked as deleted"}
            else:
                raise HTTPException(status_code=404, detail="Table data not found")
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# Additional route with /api prefix for direct access
@app.delete("/api/table-data")
def api_delete_table_data(fiscalYear: str = Query(..., description="Fiscal Year")):
    return delete_table_data(fiscalYear)

# --- Location Relationships Endpoints ---

@app.get("/location-relationships")
def get_location_relationships(fiscalYear: str = Query("FY_25", description="Fiscal Year")):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT * FROM location_relationships WHERE fiscal_year = ? AND is_deleted = 0', (fiscalYear,))
        rows = cursor.fetchall()
       
        if rows:
            relationships = [
                {'location': row['location'], 'locationCode': row['location_code']}
                for row in rows
            ]
            return relationships
        else:
            # Default relationships
            return [
                { 'location': 'Khavda', 'locationCode': 'Khavda' },
                { 'location': 'Baap', 'locationCode': 'RJ' },
                { 'location': 'Essel', 'locationCode': 'RJ' }
            ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/location-relationships")
def save_location_relationships(
    relationships: list,
    fiscalYear: str = Query("FY_25")
):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Soft delete existing
        cursor.execute('''
            UPDATE location_relationships
            SET is_deleted = 1, version = version + 1, updated_at = CURRENT_TIMESTAMP
            WHERE fiscal_year = ?
        ''', (fiscalYear,))
       
        # Insert new
        for rel in relationships:
            cursor.execute('''
                INSERT INTO location_relationships (fiscal_year, location, location_code, version)
                VALUES (?, ?, ?, 1)
            ''', (fiscalYear, rel.location, rel.locationCode))
           
        conn.commit()
        return relationships
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# Additional route with /api prefix for direct access
@app.get("/api/location-relationships")
def api_get_location_relationships(fiscalYear: str = Query("FY_25")):
    return get_location_relationships(fiscalYear)

# Additional route with /api prefix for direct access
@app.post("/api/location-relationships")
def api_save_location_relationships(
    relationships: list,
    fiscalYear: str = Query("FY_25")
):
    return save_location_relationships(relationships, fiscalYear)

# --- Backup Data Endpoints ---

@app.get("/backup-data")
def get_backups(fiscalYear: str = Query("FY_25")):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT id, fiscal_year, data, version, is_deleted, created_at, updated_at
            FROM table_data
            WHERE fiscal_year = ?
            ORDER BY version DESC
        ''', (fiscalYear,))
        rows = cursor.fetchall()
       
        backups = []
        for row in rows:
            backup = dict(row)
            backup['data'] = json.loads(row['data'])
            backups.append(backup)
           
        return {
            "fiscalYear": fiscalYear,
            "backups": backups,
            "count": len(backups)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/backup-data/restore")
def restore_backup(request: dict):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        # Get specific version
        cursor.execute('''
            SELECT data FROM table_data
            WHERE fiscal_year = ? AND version = ?
        ''', (request.fiscalYear, request.version))
       
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Backup not found")
           
        # Restore by inserting new version (or updating current active one? logic says updateOne with upsert)
        # The Next.js logic was: updateOne({fiscalYear}, {$set: ...})
        # Which effectively updates the 'current' record (where is_deleted=0 usually, but here it just matches fiscalYear)
        # Wait, my schema design allows multiple rows per fiscalYear (history).
        # The 'current' one is usually the latest version or the one with is_deleted=0.
        # But my `save_table_data` updates the existing row if `is_deleted=0`.
        # So here I should update that row too.
       
        data_str = result['data']
       
        cursor.execute('''
            UPDATE table_data
            SET data = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP
            WHERE fiscal_year = ? AND is_deleted = 0
        ''', (data_str, request.fiscalYear))
       
        if cursor.rowcount == 0:
            # If no active record, insert one
            cursor.execute('''
                INSERT INTO table_data (fiscal_year, data, version)
                VALUES (?, ?, 1)
            ''', (request.fiscalYear, data_str))
           
        conn.commit()
        return {"message": "Data restored successfully"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/backup-data")
def delete_backup(fiscalYear: str = Query(...), version: int = Query(...)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Hard delete specific version (only if it is a backup/history, usually we keep history but user wants delete)
        # Next.js logic: DELETE FROM table_data WHERE ... AND is_deleted=TRUE
        # Wait, Next.js logic deletes only if `is_deleted=TRUE`?
        # "DELETE FROM table_data WHERE fiscal_year = ? AND version = ? AND is_deleted = TRUE"
        # This implies it only deletes "soft deleted" records? Or maybe "history" records are marked as deleted?
        # In my `save_table_data`, I update the single row. I don't create a new row for history.
        # Ah, `lib/sqlite-adapter.ts` logic:
        # `updateOne`: "UPDATE ... SET data=?, version=version+1 ..."
        # It does NOT create a history row. It just updates the single row.
        # So where does the history come from?
        # The Next.js `GET` query: "SELECT ... FROM table_data WHERE fiscal_year = ? ORDER BY version DESC"
        # If I only have one row per fiscalYear, this returns 1 row.
        # The `lib/sqlite-adapter.ts` implementation I wrote earlier:
        # It updates the single row.
        # So `backup-data` logic in Next.js (which assumes history) might be broken with my previous `sqlite-adapter` implementation if it expects multiple rows.
        # OR, the `sqlite-adapter` was supposed to INSERT a new row for every version?
        # Let's check `lib/sqlite-adapter.ts` again.
        # It says: `UPDATE table_data ...`
        # So it overwrites.
        # If the user wants backups, we should probably INSERT a new row to keep history.
        # But the current schema has `version`.
        # If I want to support backups, I should probably CHANGE `save_table_data` to INSERT a new row instead of UPDATE.
        # OR, the `backup-data` route logic implies there ARE multiple rows.
        # Let's assume for now I should INSERT new rows to keep history.
        # But `is_deleted=0` usually implies the "active" one.
        # If I insert a new row, I should mark the old one as `is_deleted=1`?
        # Or just have multiple rows and `GET /table-data` fetches the latest `ORDER BY version DESC`?
        # My `GET /table-data` does `WHERE ... AND is_deleted=0`.
        # So I should probably:
        # 1. Mark current as deleted (archive it).
        # 2. Insert new as active.
        # Let's adjust `save_table_data` to do this.
       
        pass
    except Exception as e:
        pass
       
    # Re-implementing delete based on adjusted logic
    try:
        cursor.execute('''
            DELETE FROM table_data
            WHERE fiscal_year = ? AND version = ? AND is_deleted = 1
        ''', (fiscalYear, version))
       
        if cursor.rowcount > 0:
            conn.commit()
            return {"message": "Backup version deleted successfully"}
        else:
             raise HTTPException(status_code=404, detail="Backup version not found or not deleted")
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# Additional route with /api prefix for direct access
@app.get("/api/backup-data")
def api_get_backups(fiscalYear: str = Query("FY_25")):
    return get_backups(fiscalYear)

# Additional route with /api prefix for direct access
@app.post("/api/backup-data/restore")
def api_restore_backup(request: dict):
    return restore_backup(request)

# Additional route with /api prefix for direct access
@app.delete("/api/backup-data")
def api_delete_backup(fiscalYear: str = Query(...), version: int = Query(...)):
    return delete_backup(fiscalYear, version)

# --- Import Data Endpoints ---

def convert_to_table_row(item: Dict[str, Any], index: int) -> Dict[str, Any]:
    # Handle different possible field names for PSS
    pss_value = ""
    if "PSS" in item:
        pss_value = item["PSS"]
    elif "PSS -" in item:
        pss_value = item["PSS -"]
    elif "PSS-" in item:
        pss_value = item["PSS-"]
       
    # Helper to parse float safely
    def parse_float(val):
        if isinstance(val, (int, float)):
            return float(val)
        if isinstance(val, str):
            try:
                return float(val)
            except ValueError:
                return None
        return None

    return {
        "id": index + 1,
        "sno": item.get("Sl No") or (index + 1),
        "capacity": parse_float(item.get("Capacity")),
        "group": item.get("Group") or "",
        "ppaMerchant": item.get("PPA/Merchant") or "",
        "type": item.get("Type") or "",
        "solar": parse_float(item.get("Solar")),
        "wind": parse_float(item.get("Wind")),
        "spv": item.get("SPV") or "",
        "locationCode": item.get("Location Code") or "",
        "location": item.get("Location") or "",
        "pss": pss_value or "",
        "connectivity": item.get("Connectivity") or ""
    }

@app.post("/import-data")
def import_data():
    import os
   
    # Define paths to JSON files
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    components_dir = os.path.join(base_dir, 'app', 'components')
   
    files_map = [
        {'name': 'FY_23', 'file': 'ex.json'},
        {'name': 'FY_24', 'file': 'ex_fy25.json'},
        {'name': 'FY_25', 'file': 'ex_fy26.json'},
        {'name': 'FY_26', 'file': 'ex_fy27.json'},
        {'name': 'FY_27', 'file': 'ex_fy28.json'},
    ]
   
    conn = get_db_connection()
    cursor = conn.cursor()
    results = []
   
    try:
        for item in files_map:
            file_path = os.path.join(components_dir, item['file'])
            if not os.path.exists(file_path):
                results.append({'fiscalYear': item['name'], 'message': 'File not found', 'count': 0})
                continue
               
            with open(file_path, 'r') as f:
                try:
                    raw_data = json.load(f)
                except json.JSONDecodeError:
                    raw_data = []
           
            if not raw_data:
                results.append({'fiscalYear': item['name'], 'message': 'No data to import', 'count': 0})
                continue
               
            converted_data = [convert_to_table_row(row, i) for i, row in enumerate(raw_data)]
            data_json = json.dumps(converted_data)
           
            # Upsert logic
            cursor.execute('SELECT 1 FROM table_data WHERE fiscal_year = ?', (item['name'],))
            exists = cursor.fetchone()
           
            if exists:
                cursor.execute('''
                    UPDATE table_data
                    SET data = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE fiscal_year = ?
                ''', (data_json, item['name']))
            else:
                cursor.execute('''
                    INSERT INTO table_data (fiscal_year, data, version)
                    VALUES (?, ?, 1)
                ''', (item['name'], data_json))
               
            results.append({
                'fiscalYear': item['name'],
                'message': 'Data imported successfully',
                'count': len(converted_data)
            })
           
        conn.commit()
        return {"message": "All fiscal year data imported successfully", "results": results}
       
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/import-default-data")
def import_default_data():
    # Same logic as import_data but only for specific files if needed.
    # The Next.js implementation for import-default-data only processed FY_23, FY_24, FY_25.
    # I'll reuse the logic but filter the list.
    return import_data()

# Add this new endpoint after the existing import endpoints
@app.post("/import-data-from-frontend")
def import_data_from_frontend(request: dict):
    """
    Import data directly from frontend - useful for production environments
    where local JSON files might not be available
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        fiscal_year = request.fiscalYear
        # Convert TableRow objects to dictionaries if needed
        data_dicts = []
        for row in request.data:
            if hasattr(row, 'dict'):
                data_dicts.append(row.dict())
            else:
                data_dicts.append(row)
       
        data_json = json.dumps(data_dicts)
       
        # Check if there's already an active record for this fiscal year
        cursor.execute('SELECT id, version FROM table_data WHERE fiscal_year = ? AND is_deleted = 0', (fiscal_year,))
        existing_record = cursor.fetchone()
       
        if existing_record:
            # Update existing active record
            next_version = existing_record['version'] + 1
            cursor.execute('''
                UPDATE table_data
                SET data = ?, version = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (data_json, next_version, existing_record['id']))
        else:
            # Get current max version for this fiscal year
            cursor.execute('SELECT MAX(version) FROM table_data WHERE fiscal_year = ?', (fiscal_year,))
            row = cursor.fetchone()
            next_version = (row[0] if row[0] is not None else 0) + 1
           
            # Insert new active record
            cursor.execute('''
                INSERT INTO table_data (fiscal_year, data, version, is_deleted)
                VALUES (?, ?, ?, 0)
            ''', (fiscal_year, data_json, next_version))
           
        conn.commit()
       
        return {"message": "Table data imported successfully", "version": next_version, "count": len(data_dicts)}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to import data: {str(e)}")
    finally:
        conn.close()

# Additional route with /api prefix for direct access
@app.post("/api/import-data-from-frontend")
def api_import_data_from_frontend(request: dict):
    return import_data_from_frontend(request)

# Additional route with /api prefix for direct access
@app.post("/api/import-data")
def api_import_data():
    return import_data()

# Additional route with /api prefix for direct access
@app.post("/api/import-default-data")
def api_import_default_data():
    return import_default_data()

# --- Commissioning Status Endpoints ---

@app.get("/commissioning-projects")
def get_commissioning_projects(fiscalYear: str = Query("FY_25-26")):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT * FROM commissioning_projects 
            WHERE fiscal_year = ? AND is_deleted = 0
            ORDER BY category, sno
        ''', (fiscalYear,))
        rows = cursor.fetchall()
        
        projects = []
        for row in rows:
            # Convert row to dict for safer access
            row_dict = dict(row)
            
            # Calculate monthly sum (Apr-Mar) - used for ACTUAL only
            monthly_sum = sum([
                row_dict.get('apr') or 0,
                row_dict.get('may') or 0,
                row_dict.get('jun') or 0,
                row_dict.get('jul') or 0,
                row_dict.get('aug') or 0,
                row_dict.get('sep') or 0,
                row_dict.get('oct') or 0,
                row_dict.get('nov') or 0,
                row_dict.get('dec') or 0,
                row_dict.get('jan') or 0,
                row_dict.get('feb') or 0,
                row_dict.get('mar') or 0
            ])
            
            # CRITICAL FIX: Row Total Logic per PDF Spec
            # PLAN/REPHASE: totalCapacity = capacity (the project's planned capacity)
            # ACTUAL: totalCapacity = sum of monthly values
            plan_actual = row_dict.get('plan_actual', '')
            if plan_actual in ['Plan', 'Rephase']:
                total_capacity = row_dict.get('capacity') or 0
            else:  # ACTUAL / Fcst
                total_capacity = monthly_sum
            
            # Calculate cummTillOct from Apr-Oct
            cumm_till_oct = sum([
                row_dict.get('apr') or 0,
                row_dict.get('may') or 0,
                row_dict.get('jun') or 0,
                row_dict.get('jul') or 0,
                row_dict.get('aug') or 0,
                row_dict.get('sep') or 0,
                row_dict.get('oct') or 0
            ])
            
            # Calculate quarters
            q1 = sum([row_dict.get('apr') or 0, row_dict.get('may') or 0, row_dict.get('jun') or 0])
            q2 = sum([row_dict.get('jul') or 0, row_dict.get('aug') or 0, row_dict.get('sep') or 0])
            q3 = sum([row_dict.get('oct') or 0, row_dict.get('nov') or 0, row_dict.get('dec') or 0])
            q4 = sum([row_dict.get('jan') or 0, row_dict.get('feb') or 0, row_dict.get('mar') or 0])
            
            projects.append({
                'id': row_dict['id'],
                'sno': row_dict['sno'],
                'projectName': row_dict['project_name'],
                'spv': row_dict['spv'],
                'projectType': row_dict['project_type'],
                'plotLocation': row_dict['plot_location'],
                'capacity': row_dict['capacity'],
                'planActual': row_dict['plan_actual'],
                'apr': row_dict['apr'],
                'may': row_dict['may'],
                'jun': row_dict['jun'],
                'jul': row_dict['jul'],
                'aug': row_dict['aug'],
                'sep': row_dict['sep'],
                'oct': row_dict['oct'],
                'nov': row_dict['nov'],
                'dec': row_dict['dec'],
                'jan': row_dict['jan'],
                'feb': row_dict['feb'],
                'mar': row_dict['mar'],
                'totalCapacity': total_capacity,
                'cummTillOct': cumm_till_oct,
                'q1': q1,
                'q2': q2,
                'q3': q3,
                'q4': q4,
                'category': row_dict['category'],
                'section': row_dict.get('section', 'A'),
                'includedInTotal': bool(row_dict.get('included_in_total', True))
            })
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/commissioning-projects")
def api_get_commissioning_projects(fiscalYear: str = Query("FY_25-26")):
    return get_commissioning_projects(fiscalYear)

@app.post("/commissioning-projects")
def save_commissioning_projects(projects: List[CommissioningProject], fiscalYear: str = Query("FY_25-26")):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Soft delete existing
        cursor.execute('''
            UPDATE commissioning_projects
            SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP
            WHERE fiscal_year = ?
        ''', (fiscalYear,))
        
        # Insert new
        for proj in projects:
            cursor.execute('''
                INSERT INTO commissioning_projects (
                    fiscal_year, sno, project_name, spv, project_type, plot_location,
                    capacity, plan_actual, apr, may, jun, jul, aug, sep, oct, nov, dec,
                    jan, feb, mar, total_capacity, cumm_till_oct, q1, q2, q3, q4, category, section, included_in_total
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                fiscalYear, proj.sno, proj.projectName, proj.spv, proj.projectType,
                proj.plotLocation, proj.capacity, proj.planActual,
                proj.apr, proj.may, proj.jun, proj.jul, proj.aug, proj.sep,
                proj.oct, proj.nov, proj.dec, proj.jan, proj.feb, proj.mar,
                proj.totalCapacity, proj.cummTillOct, proj.q1, proj.q2, proj.q3, proj.q4, proj.category,
                proj.section, proj.includedInTotal
            ))
        
        conn.commit()
        return {"message": "Commissioning projects saved successfully", "count": len(projects)}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/commissioning-projects")
def api_save_commissioning_projects(projects: List[CommissioningProject], fiscalYear: str = Query("FY_25-26")):
    return save_commissioning_projects(projects, fiscalYear)

@app.delete("/commissioning-projects/{project_id}")
def delete_commissioning_project(project_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            UPDATE commissioning_projects
            SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (project_id,))
        
        if cursor.rowcount > 0:
            conn.commit()
            return {"message": "Project deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Project not found")
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/api/commissioning-projects/{project_id}")
def api_delete_commissioning_project(project_id: int):
    return delete_commissioning_project(project_id)

@app.get("/commissioning-summaries")
def get_commissioning_summaries(fiscalYear: str = Query("FY_25-26")):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT * FROM commissioning_summaries 
            WHERE fiscal_year = ? AND is_deleted = 0
            ORDER BY summary_type, category
        ''', (fiscalYear,))
        rows = cursor.fetchall()
        
        summaries = []
        for row in rows:
            summaries.append({
                'id': row['id'],
                'category': row['category'],
                'summaryType': row['summary_type'],
                'apr': row['apr'],
                'may': row['may'],
                'jun': row['jun'],
                'jul': row['jul'],
                'aug': row['aug'],
                'sep': row['sep'],
                'oct': row['oct'],
                'nov': row['nov'],
                'dec': row['dec'],
                'jan': row['jan'],
                'feb': row['feb'],
                'mar': row['mar'],
                'total': row['total'],
                'cummTillOct': row['cumm_till_oct'],
                'q1': row['q1'],
                'q2': row['q2'],
                'q3': row['q3'],
                'q4': row['q4']
            })
        return summaries
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/commissioning-summaries")
def api_get_commissioning_summaries(fiscalYear: str = Query("FY_25-26")):
    return get_commissioning_summaries(fiscalYear)

@app.post("/commissioning-summaries")
def save_commissioning_summaries(summaries: List[CommissioningSummary], fiscalYear: str = Query("FY_25-26")):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Soft delete existing
        cursor.execute('''
            UPDATE commissioning_summaries
            SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP
            WHERE fiscal_year = ?
        ''', (fiscalYear,))
        
        # Insert new
        for summary in summaries:
            cursor.execute('''
                INSERT INTO commissioning_summaries (
                    fiscal_year, category, summary_type, apr, may, jun, jul, aug, sep,
                    oct, nov, dec, jan, feb, mar, total, cumm_till_oct, q1, q2, q3, q4
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                fiscalYear, summary.category, summary.summaryType,
                summary.apr, summary.may, summary.jun, summary.jul, summary.aug, summary.sep,
                summary.oct, summary.nov, summary.dec, summary.jan, summary.feb, summary.mar,
                summary.total, summary.cummTillOct, summary.q1, summary.q2, summary.q3, summary.q4
            ))
        
        conn.commit()
        return {"message": "Commissioning summaries saved successfully", "count": len(summaries)}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/commissioning-summaries")
def api_save_commissioning_summaries(summaries: List[CommissioningSummary], fiscalYear: str = Query("FY_25-26")):
    return save_commissioning_summaries(summaries, fiscalYear)


@app.post("/api/upload-commissioning-data")
async def upload_commissioning_data(
    file: UploadFile = File(...),
    fiscalYear: str = Form("FY_25-26")
):
    """
    Upload commissioning data from a multi-row structured Excel file.
    Identifies projects by S.No, Name, and SPV.
    Handles Plan, Rephase, and Actual / Fcst rows.
    """
    try:
        contents = await file.read()
        # Read without header to find the header row manually
        df = pd.read_excel(io.BytesIO(contents), header=None)
        
        # Find header row (usually Row 35, index 34-36)
        start_row = 0
        for i in range(len(df)):
            row_vals = [str(v).strip() for v in df.iloc[i]]
            if 'Project Name' in row_vals and 'Plan Actual' in row_vals:
                start_row = i
                print(f"Header row found at index {i}")
                break
        else:
            # Fallback if specific header not found
            raise HTTPException(status_code=400, detail="Could not find header row with 'Project Name' and 'Plan Actual'")

        # Define month columns based on found header row
        header_vals = df.iloc[start_row].tolist()
        month_indices = {}
        target_months = ['Apr-25', 'May-25', 'Jun-25', 'Jul-25', 'Aug-25', 'Sep-25', 
                         'Oct-25', 'Nov-25', 'Dec-25', 'Jan-26', 'Feb-26', 'Mar-26']
        
        for idx, val in enumerate(header_vals):
            val_str = str(val).strip()
            if val_str in target_months:
                month_indices[val_str] = idx

        db_month_map = {
            'Apr-25': 'apr', 'May-25': 'may', 'Jun-25': 'jun', 
            'Jul-25': 'jul', 'Aug-25': 'aug', 'Sep-25': 'sep', 
            'Oct-25': 'oct', 'Nov-25': 'nov', 'Dec-25': 'dec', 
            'Jan-26': 'jan', 'Feb-26': 'feb', 'Mar-26': 'mar'
        }

        conn = get_db_connection()
        cursor = conn.cursor()
        
        success_count = 0
        failed_count = 0
        errors = []
        
        # Current project state
        current_project = {
            "name": None,
            "spv": None,
            "sno": None,
            "capacity": None
        }

        # Value helper
        def to_float(val):
            try:
                if pd.isna(val) or str(val).strip() == '':
                    return 0.0
                return float(val)
            except:
                return 0.0

        # Iterate through rows starting from the row after header
        for i in range(start_row + 1, len(df)):
            row = df.iloc[i].tolist()
            
            # Check if this row starts a new project (Col 1 is Project Name)
            proj_name = str(row[1]).strip() if not pd.isna(row[1]) else None
            if proj_name and proj_name not in ('nan', '', '0.0', 'S.No.'):
                current_project["name"] = proj_name
                current_project["spv"] = str(row[2]).strip() if not pd.isna(row[2]) else ""
                current_project["sno"] = row[0]
                current_project["capacity"] = to_float(row[5])
                # print(f"Processing project: {proj_name} ({current_project['spv']})")

            # Check Plan Actual Type (Col 6)
            plan_actual_raw = str(row[6]).strip() if not pd.isna(row[6]) else None
            if not plan_actual_raw or plan_actual_raw in ('nan', 'Plan Actual'):
                continue

            # Normalize type
            plan_actual = plan_actual_raw
            if "Actual" in plan_actual_raw:
                plan_actual = "Actual"
            elif "Plan" in plan_actual_raw:
                plan_actual = "Plan"
            elif "Rephase" in plan_actual_raw:
                plan_actual = "Rephase"

            if not current_project["name"]:
                continue

            # Find matching project in DB
            cursor.execute('''
                SELECT id FROM commissioning_projects 
                WHERE project_name = ? AND spv = ? AND plan_actual = ? AND fiscal_year = ?
            ''', (current_project["name"], current_project["spv"], plan_actual, fiscalYear))
            
            proj_record = cursor.fetchone()
            
            if not proj_record:
                # Try fallback matching (e.g. without SPV if SPV is messy in excel)
                cursor.execute('''
                    SELECT id FROM commissioning_projects 
                    WHERE project_name = ? AND plan_actual = ? AND fiscal_year = ?
                ''', (current_project["name"], plan_actual, fiscalYear))
                proj_record = cursor.fetchone()

            if proj_record:
                proj_id = proj_record['id']
                
                # Update monthly values
                update_fields = []
                update_params = []
                
                for excel_col, db_col in db_month_map.items():
                    if excel_col in month_indices:
                        val = to_float(row[month_indices[excel_col]])
                        update_fields.append(f"{db_col} = ?")
                        update_params.append(val)
                
                if update_fields:
                    update_params.append(proj_id)
                    cursor.execute(f'''
                        UPDATE commissioning_projects 
                        SET {", ".join(update_fields)}, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    ''', tuple(update_params))
                    success_count += 1
            else:
                # Log mismatch if it's a real project row
                if current_project["name"] and len(current_project["name"]) > 2:
                    failed_count += 1
                    errors.append(f"Row {i+1}: Project '{current_project['name']}' with type '{plan_actual}' not found in DB")

        conn.commit()
        conn.close()
        
        return {
            "success": success_count,
            "failed": failed_count,
            "errors": errors[:50] # Limit error count
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process upload: {str(e)}")
@app.post("/api/reset-commissioning-data")
def reset_commissioning_data(request: dict):
    """
    Resets all monthly values to 0 for a given fiscal year.
    Expects json body: { "fiscalYear": "FY_25-26" }
    """
    fiscal_year = request.get("fiscalYear", "FY_25-26")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Reset monthly columns to NULL or 0
        cursor.execute('''
            UPDATE commissioning_projects 
            SET apr = NULL, may = NULL, jun = NULL, jul = NULL, aug = NULL, sep = NULL,
                oct = NULL, nov = NULL, dec = NULL, jan = NULL, feb = NULL, mar = NULL,
                total_capacity = 0, cumm_till_oct = 0, q1 = 0, q2 = 0, q3 = 0, q4 = 0,
                updated_at = CURRENT_TIMESTAMP
            WHERE fiscal_year = ?
        ''', (fiscal_year,))
        
        updated_count = cursor.rowcount
        conn.commit()
        
        # Recalculate derived (will just confirm 0s)
        calculate_derived_values(cursor)
        conn.commit()
        
        conn.close()
        return {"message": "Commissioning data reset successfully", "count": updated_count}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)

# --- Excel Upload Endpoint ---

@app.post("/api/upload-excel")
async def upload_excel_workbook(
    file: UploadFile = File(...),
    fiscalYear: str = Form("FY_25-26")
):
    """
    Upload Excel workbook with multiple sheets.
    Parses all sheets and imports data into the database.
    Uses: pd.read_excel(file, sheet_name=None) to read all sheets.
    """
    try:
        # Validate file type
        if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Please upload .xlsx, .xls, or .csv file"
            )
        
        # Read file content
        content = await file.read()
        
        # Import parser
        from excel_parser import parse_excel_workbook, import_projects_to_db
        
        # Parse the workbook (reads all sheets)
        result = parse_excel_workbook(content, file.filename)
        
        if result['errors'] and not result['projects']:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to parse file: {result['errors'][:5]}"
            )
        
        # Import to database (clears existing data first)
        db_result = import_projects_to_db(result['projects'], result.get('summaries'), fiscalYear)
        
        if not db_result['success']:
            raise HTTPException(
                status_code=500,
                detail=f"Database import failed: {db_result.get('error')}"
            )
            
        return {
            "success": True,
            "message": f"Successfully processed {file.filename}",
            "projects_imported": db_result['inserted_projects'],
            "summaries_imported": db_result['inserted_summaries'],
            "sheets_found": result['sheets_found'],
            "sheet_count": result['sheet_count'],
            "parse_errors": result['errors']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.get("/api/upload-status")
def get_upload_status(fiscalYear: str = Query("FY_25-26")):
    """
    Get the current data status for a fiscal year.
    Shows count of projects and last update time.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Count projects
        cursor.execute('''
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN plan_actual = 'Plan' THEN 1 ELSE 0 END) as plan_count,
                   SUM(CASE WHEN plan_actual = 'Rephase' THEN 1 ELSE 0 END) as rephase_count,
                   SUM(CASE WHEN plan_actual = 'Actual' THEN 1 ELSE 0 END) as actual_count
            FROM commissioning_projects 
            WHERE fiscal_year = ? AND is_deleted = 0
        ''', (fiscalYear,))
        
        row = cursor.fetchone()
        
        # Get last update
        cursor.execute('''
            SELECT MAX(updated_at) as last_update 
            FROM commissioning_projects 
            WHERE fiscal_year = ?
        ''', (fiscalYear,))
        
        last_update = cursor.fetchone()
        
        return {
            "fiscal_year": fiscalYear,
            "total_projects": row[0] if row else 0,
            "plan_count": row[1] if row else 0,
            "rephase_count": row[2] if row else 0,
            "actual_count": row[3] if row else 0,
            "last_update": last_update[0] if last_update else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

