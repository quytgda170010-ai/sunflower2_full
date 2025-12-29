"""
Database connection module for EHR Core
"""
import pymysql
import os
from typing import Optional

def get_db_connection():
    """Get database connection"""
    try:
        connection = pymysql.connect(
            host=os.getenv('DB_HOST', 'mariadb'),
            port=int(os.getenv('DB_PORT', '3306')),
            database=os.getenv('DB_NAME', 'ehr_core'),
            user=os.getenv('DB_USER', 'openemr'),
            password=os.getenv('DB_PASS', 'Openemr!123'),
            cursorclass=pymysql.cursors.DictCursor,
            charset='utf8mb4',
            autocommit=False
        )
        return connection
    except Exception as e:
        print(f"Error connecting to database: {e}")
        raise

