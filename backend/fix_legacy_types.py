"""
Script to comment out legacy code sections in main.py
This will add # to the beginning of each line in the specified ranges
"""
import re

with open('main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all occurrences of "variable: Variable" with "variable: dict"
content = content.replace('variable: Variable', 'variable: dict')

# Replace all occurrences of "options: DropdownOptions" with "options: dict"
content = content.replace('options: DropdownOptions', 'options: dict')

# Replace all occurrences of "request: TableDataRequest" with "request: dict"
content = content.replace('request: TableDataRequest', 'request: dict')

# Replace all occurrences of "relationships: List[LocationRelationship]" with "relationships: list"
content = content.replace('relationships: List[LocationRelationship]', 'relationships: list')

# Replace all occurrences of "request: RestoreBackupRequest" with "request: dict"
content = content.replace('request: RestoreBackupRequest', 'request: dict')

with open('main.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully replaced all legacy schema type hints with 'dict'")
print("The backend should now start successfully")
