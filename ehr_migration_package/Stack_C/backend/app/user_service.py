"""
User Service: Query users from database
"""
import os
import mysql.connector
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


class UserService:
    """Query users from database"""
    
    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST', 'mariadb'),
            'user': os.getenv('DB_USER', 'openemr'),
            'password': os.getenv('DB_PASS', 'Openemr!123'),
            'database': os.getenv('DB_NAME', 'ehr_core'),
            'charset': 'utf8mb4'
        }
    
    def _get_connection(self):
        """Get database connection"""
        return mysql.connector.connect(**self.db_config)
    
    def get_users(self) -> List[Dict[str, Any]]:
        """Get all users from openemr_users table"""
        conn = self._get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Get all users (both active and inactive)
            cursor.execute("""
                SELECT 
                    id,
                    username,
                    email,
                    fname as first_name,
                    mname as middle_name,
                    lname as last_name,
                    authorized,
                    active,
                    phone,
                    specialty,
                    '' as role,
                    '' as status
                FROM openemr_users
                ORDER BY username
            """)
            users = cursor.fetchall()
            
            # Map authorized to role (based on OpenEMR authorization levels)
            # Also infer role from username if authorized is 0 or not set
            role_mapping = {
                1: 'admin',
                2: 'physician',  # OpenEMR uses 2 for physicians/doctors
                3: 'nurse',
                4: 'receptionist',
                5: 'lab_technician',
                6: 'pharmacist',
                7: 'accountant'
            }
            
            for user in users:
                username_lower = (user.get('username') or '').lower()
                authorized = user.get('authorized', 0)
                
                # First try to get role from authorized field
                role = role_mapping.get(authorized, '')
                
                # If no role from authorized, infer from username
                if not role:
                    if 'admin' in username_lower or 'quanly' in username_lower:
                        role = 'admin'
                    elif 'bs' in username_lower or 'bacsi' in username_lower or 'doctor' in username_lower:
                        role = 'doctor'
                    elif 'dd' in username_lower or 'dieuduong' in username_lower or 'nurse' in username_lower or 'yd' in username_lower:
                        role = 'nurse'
                    elif 'letan' in username_lower or 'reception' in username_lower or 'tieptan' in username_lower:
                        role = 'receptionist'
                    elif 'ktv' in username_lower or 'lab' in username_lower or 'xetnghiem' in username_lower:
                        role = 'lab_technician'
                    elif 'duocsi' in username_lower or 'pharmacist' in username_lower or 'ds' in username_lower:
                        role = 'pharmacist'
                    elif 'ketoan' in username_lower or 'accountant' in username_lower:
                        role = 'accountant'
                    else:
                        role = 'user'
                
                user['role'] = role
                # Status will be determined later based on recent activity
                user['status'] = 'offline'  # Default, will be updated
                user['online'] = False  # Default, will be updated
                
                # Set email if missing
                if not user.get('email'):
                    user['email'] = f"{user.get('username')}@example.com"
                
                # Set full name
                full_name_parts = []
                if user.get('fname'):
                    full_name_parts.append(user['fname'])
                if user.get('mname'):
                    full_name_parts.append(user['mname'])
                if user.get('lname'):
                    full_name_parts.append(user['lname'])
                user['full_name'] = ' '.join(full_name_parts) if full_name_parts else user.get('username', '')
            
            # Also get unique users from access_logs (users who have logged in)
            # This is the primary source for users like bs.noikhoa, dd.ha, etc.
            try:
                access_log_users = self._get_users_from_access_logs()
                # Merge with database users (avoid duplicates by username)
                existing_usernames = {u['username'] for u in users}
                for al_user in access_log_users:
                    if al_user['username'] not in existing_usernames:
                        users.append(al_user)
            except Exception as e:
                logger.warning(f"Could not fetch users from access_logs: {e}")
            
            # Also try to get users from Keycloak if available (optional, may fail)
            try:
                keycloak_users = self._get_keycloak_users()
                # Merge Keycloak users with existing users (avoid duplicates)
                existing_usernames = {u['username'] for u in users}
                for kc_user in keycloak_users:
                    if kc_user['username'] not in existing_usernames:
                        users.append(kc_user)
            except Exception as e:
                logger.debug(f"Could not fetch users from Keycloak (this is optional): {e}")
            
            # Final deduplication and cleanup
            # Group by username and keep the best entry
            user_dict = {}
            for user in users:
                username = user.get('username', '')
                if not username:
                    continue
                
                # Skip UUIDs (they're not real usernames)
                if len(username) > 30 and '-' in username and username.count('-') >= 4:
                    continue
                
                # Skip system users
                if username in ['phimail-service', 'portal-user', 'oe-system']:
                    continue
                
                # If we already have this user, keep the one with better role (not system role)
                if username in user_dict:
                    existing_role = user_dict[username].get('role', '')
                    new_role = user.get('role', '')
                    
                    # System roles to avoid
                    system_roles = ['offline_access', 'manage-account', 'manage-account-links', 
                                   'view-profile', 'uma_authorization', 'default-roles-clinicrealm']
                    
                    # Prefer non-system role
                    if existing_role in system_roles and new_role not in system_roles:
                        user_dict[username] = user
                    elif new_role in system_roles and existing_role not in system_roles:
                        pass  # Keep existing
                    elif existing_role in system_roles and new_role in system_roles:
                        # Both are system roles, prefer the one with better inferred role
                        if 'doctor' in username.lower() or 'bs' in username.lower():
                            user_dict[username]['role'] = 'doctor'
                        elif 'nurse' in username.lower() or 'dd' in username.lower():
                            user_dict[username]['role'] = 'nurse'
                        elif 'letan' in username.lower() or 'reception' in username.lower():
                            user_dict[username]['role'] = 'receptionist'
                        elif 'ktv' in username.lower() or 'lab' in username.lower():
                            user_dict[username]['role'] = 'lab_technician'
                else:
                    user_dict[username] = user
            
            # Convert back to list and filter out system roles
            final_users = []
            system_roles = ['offline_access', 'manage-account', 'manage-account-links', 
                           'view-profile', 'uma_authorization', 'default-roles-clinicrealm']
            
            for username, user in user_dict.items():
                # Fix role if it's a system role
                if user.get('role') in system_roles:
                    username_lower = username.lower()
                    if 'admin' in username_lower or 'quanly' in username_lower:
                        user['role'] = 'admin'
                    elif 'bs' in username_lower or 'bacsi' in username_lower or 'doctor' in username_lower:
                        user['role'] = 'doctor'
                    elif 'dd' in username_lower or 'dieuduong' in username_lower or 'nurse' in username_lower or 'yd' in username_lower:
                        user['role'] = 'nurse'
                    elif 'letan' in username_lower or 'reception' in username_lower or 'tieptan' in username_lower:
                        user['role'] = 'receptionist'
                    elif 'ktv' in username_lower or 'lab' in username_lower or 'xetnghiem' in username_lower:
                        user['role'] = 'lab_technician'
                    elif 'duocsi' in username_lower or 'pharmacist' in username_lower or 'ds' in username_lower:
                        user['role'] = 'pharmacist'
                    elif 'ketoan' in username_lower or 'accountant' in username_lower:
                        user['role'] = 'accountant'
                    else:
                        user['role'] = 'user'
                
                final_users.append(user)
            
            # Determine online/offline status based on recent activity
            # Check last activity from access_logs (within last 15 minutes = online)
            try:
                status_conn = self._get_connection()
                status_cursor = status_conn.cursor(dictionary=True)
                
                # Get last activity timestamp for each user
                # Check for activity in last 30 minutes (more reasonable for "online" status)
                status_cursor.execute("""
                    SELECT 
                        user_id as username,
                        MAX(timestamp) as last_activity
                    FROM access_logs
                    WHERE user_id IS NOT NULL
                    AND user_id != ''
                    AND timestamp > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
                    GROUP BY user_id
                """)
                online_users = {row['username']: row['last_activity'] for row in status_cursor.fetchall()}
                
                # Also check session_logs for active sessions (logged in but not logged out)
                try:
                    status_cursor.execute("""
                        SELECT DISTINCT username, MAX(login_time) as last_login
                        FROM session_logs
                        WHERE username IS NOT NULL
                        AND username != ''
                        AND (logout_time IS NULL OR logout_time = '')
                        AND login_time > DATE_SUB(NOW(), INTERVAL 2 HOUR)
                        GROUP BY username
                    """)
                    active_sessions = status_cursor.fetchall()
                    
                    # Add users with active sessions to online_users
                    for session in active_sessions:
                        username = session.get('username')
                        if username and username not in online_users:
                            # User has active session, mark as online
                            online_users[username] = session.get('last_login')
                except Exception as e:
                    logger.debug(f"Error checking session_logs: {e}")
                
                # Update status for each user
                for user in final_users:
                    username = user.get('username', '')
                    if username in online_users:
                        user['status'] = 'online'
                        user['online'] = True
                        user['last_activity'] = online_users[username]
                    else:
                        # Check if user already has online status from access_logs
                        if 'online' not in user:
                            user['status'] = 'offline'
                            user['online'] = False
                            user['last_activity'] = user.get('last_activity')  # Keep existing if any
                
                status_cursor.close()
                status_conn.close()
            except Exception as e:
                logger.warning(f"Error determining user status: {e}")
                # Default to offline if error
                for user in final_users:
                    user['status'] = 'offline'
                    user['online'] = False
            
            # Sort by username
            final_users.sort(key=lambda x: x.get('username', '').lower())
            
            return final_users
        finally:
            cursor.close()
            conn.close()
    
    def _get_keycloak_users(self) -> List[Dict[str, Any]]:
        """Get users from Keycloak"""
        try:
            keycloak_url = os.getenv('KEYCLOAK_URL', 'http://keycloak:8080')
            realm = os.getenv('KEYCLOAK_REALM', 'clinicrealm')
            admin_client_id = os.getenv('KEYCLOAK_ADMIN_CLIENT_ID', 'admin-cli')
            admin_client_secret = os.getenv('KEYCLOAK_ADMIN_CLIENT_SECRET', '')
            
            # Get admin token
            token_url = f"{keycloak_url}/realms/master/protocol/openid-connect/token"
            token_data = {
                'grant_type': 'client_credentials',
                'client_id': admin_client_id,
                'client_secret': admin_client_secret
            }
            
            # Try to get token (may fail if not configured)
            token_response = requests.post(token_url, data=token_data, timeout=2)
            if token_response.status_code != 200:
                return []
            
            access_token = token_response.json().get('access_token')
            if not access_token:
                return []
            
            # Get users from realm
            users_url = f"{keycloak_url}/admin/realms/{realm}/users"
            headers = {'Authorization': f'Bearer {access_token}'}
            users_response = requests.get(users_url, headers=headers, timeout=2)
            
            if users_response.status_code != 200:
                return []
            
            keycloak_users = users_response.json()
            formatted_users = []
            
            for kc_user in keycloak_users:
                username = kc_user.get('username', '')
                if not username or username in ['phimail-service', 'portal-user', 'oe-system']:
                    continue  # Skip system users
                
                # Infer role from username
                username_lower = username.lower()
                role = 'user'
                if 'admin' in username_lower or 'quanly' in username_lower:
                    role = 'admin'
                elif 'bs' in username_lower or 'bacsi' in username_lower or 'doctor' in username_lower:
                    role = 'doctor'
                elif 'dd' in username_lower or 'dieuduong' in username_lower or 'nurse' in username_lower or 'yd' in username_lower:
                    role = 'nurse'
                elif 'letan' in username_lower or 'reception' in username_lower or 'tieptan' in username_lower:
                    role = 'receptionist'
                elif 'ktv' in username_lower or 'lab' in username_lower or 'xetnghiem' in username_lower:
                    role = 'lab_technician'
                elif 'duocsi' in username_lower or 'pharmacist' in username_lower or 'ds' in username_lower:
                    role = 'pharmacist'
                elif 'ketoan' in username_lower or 'accountant' in username_lower:
                    role = 'accountant'
                
                formatted_users.append({
                    'id': kc_user.get('id', ''),
                    'username': username,
                    'email': kc_user.get('email') or f"{username}@example.com",
                    'first_name': kc_user.get('firstName', ''),
                    'last_name': kc_user.get('lastName', ''),
                    'full_name': f"{kc_user.get('firstName', '')} {kc_user.get('lastName', '')}".strip() or username,
                    'role': role,
                    'status': 'active' if kc_user.get('enabled', True) else 'inactive',
                    'active': 1 if kc_user.get('enabled', True) else 0,
                    'authorized': 0,
                    'phone': '',
                    'specialty': ''
                })
            
            return formatted_users
        except Exception as e:
            logger.warning(f"Error fetching Keycloak users: {e}")
            return []
    
    def _get_users_from_access_logs(self) -> List[Dict[str, Any]]:
        """Get unique users from access_logs table (users who have logged in)"""
        conn = self._get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Get distinct users from access_logs
            # Filter out UUIDs, system users, and system roles
            # ALSO filter out SQL injection test patterns and invalid characters
            cursor.execute("""
                SELECT DISTINCT
                    user_id as username,
                    actor_name,
                    role,
                    MAX(timestamp) as last_login
                FROM access_logs
                WHERE user_id IS NOT NULL 
                AND user_id != ''
                AND user_id NOT IN ('phimail-service', 'portal-user', 'oe-system', 'attacker', 'unknown', 'system', 'encryption_service')
                AND LENGTH(user_id) < 40
                AND user_id NOT LIKE '%-%-%-%-%'
                AND user_id NOT LIKE '%''%'
                AND user_id NOT LIKE '% OR %'
                AND user_id NOT LIKE '%1=1%'
                AND user_id NOT LIKE '%SELECT%'
                AND user_id NOT LIKE '%UNION%'
                AND user_id NOT LIKE '%bn%'
                AND user_id NOT LIKE '%3123%'
                AND role NOT IN ('offline_access', 'manage-account', 'manage-account-links', 
                                'view-profile', 'uma_authorization', 'default-roles-clinicrealm', 'UNKNOWN', 'system')
                AND user_id REGEXP '^[a-zA-Z][a-zA-Z0-9._-]*$'
                GROUP BY user_id, actor_name, role
                ORDER BY last_login DESC
            """)
            access_log_users = cursor.fetchall()
            
            formatted_users = []
            for al_user in access_log_users:
                username = al_user.get('username', '')
                if not username:
                    continue
                
                username_lower = username.lower()
                
                # Infer role from username or use role from access_logs
                role = al_user.get('role', '')
                if not role or role == 'UNKNOWN':
                    if 'admin' in username_lower or 'quanly' in username_lower:
                        role = 'admin'
                    elif 'bs' in username_lower or 'bacsi' in username_lower or 'doctor' in username_lower:
                        role = 'doctor'
                    elif 'dd' in username_lower or 'dieuduong' in username_lower or 'nurse' in username_lower or 'yd' in username_lower:
                        role = 'nurse'
                    elif 'letan' in username_lower or 'reception' in username_lower or 'tieptan' in username_lower:
                        role = 'receptionist'
                    elif 'ktv' in username_lower or 'lab' in username_lower or 'xetnghiem' in username_lower:
                        role = 'lab_technician'
                    elif 'duocsi' in username_lower or 'pharmacist' in username_lower or 'ds' in username_lower:
                        role = 'pharmacist'
                    elif 'ketoan' in username_lower or 'accountant' in username_lower:
                        role = 'accountant'
                    else:
                        role = 'user'
                
                # Check if user is online (has activity in last 15 minutes)
                last_login = al_user.get('last_login')
                is_online = False
                if last_login:
                    from datetime import datetime, timedelta
                    try:
                        if isinstance(last_login, str):
                            # Try to parse datetime string
                            last_login_dt = datetime.fromisoformat(last_login.replace('Z', '+00:00'))
                        else:
                            last_login_dt = last_login
                        # Remove timezone for comparison
                        if hasattr(last_login_dt, 'tzinfo') and last_login_dt.tzinfo:
                            last_login_dt = last_login_dt.replace(tzinfo=None)
                        time_diff = datetime.now() - last_login_dt
                        is_online = time_diff < timedelta(minutes=30)  # 30 minutes timeout
                    except Exception as e:
                        logger.debug(f"Error parsing last_login for {username}: {e}")
                        is_online = False
                
                formatted_users.append({
                    'id': username,  # Use username as ID
                    'username': username,
                    'email': f"{username}@example.com",
                    'first_name': '',
                    'last_name': '',
                    'full_name': al_user.get('actor_name', '') or username,
                    'role': role,
                    'status': 'online' if is_online else 'offline',
                    'active': 1,
                    'authorized': 0,
                    'phone': '',
                    'specialty': '',
                    'online': is_online,
                    'last_activity': str(last_login) if last_login else None
                })
            
            return formatted_users
        except Exception as e:
            logger.warning(f"Error fetching users from access_logs: {e}")
            return []
        finally:
            cursor.close()
            conn.close()

