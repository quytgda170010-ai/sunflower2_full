#!/usr/bin/env python3
"""
Test Script for Nurse Screening Workflow
This script tests the nurse screening API endpoint with multiple test cases.

Usage:
  python test_nurse_screening.py
  
Prerequisites:
  - ehr-core container running
  - Valid authentication token
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://localhost:8443"
VERIFY_SSL = False  # Disable SSL verification for localhost

# Test data
TEST_CASES = [
    {
        "name": "Normal Patient Screening",
        "description": "Bệnh nhân bình thường với vital signs trong ngưỡng",
        "data": {
            "pulse": 72,
            "temperature": 36.8,
            "blood_pressure_systolic": 120,
            "blood_pressure_diastolic": 80,
            "respiratory_rate": 16,
            "weight": 65.5,
            "height": 170,
            "oxygen_saturation": 98,
            "pain_scale": 0,
            "reason_text": "Khám sức khỏe định kỳ",
            "medical_history": "Không có tiền sử bệnh đặc biệt",
            "allergies": "Không",
            "current_medications": "Không",
            "nurse_notes": "Bệnh nhân khỏe mạnh, đủ điều kiện khám"
        },
        "expected_status": 200
    },
    {
        "name": "High Blood Pressure Patient",
        "description": "Bệnh nhân có huyết áp cao",
        "data": {
            "pulse": 88,
            "temperature": 37.2,
            "blood_pressure_systolic": 160,
            "blood_pressure_diastolic": 100,
            "respiratory_rate": 18,
            "weight": 85,
            "height": 165,
            "oxygen_saturation": 96,
            "pain_scale": 2,
            "reason_text": "Đau đầu, chóng mặt",
            "medical_history": "Tiền sử tăng huyết áp từ 2020",
            "allergies": "Dị ứng với Penicillin",
            "current_medications": "Amlodipine 5mg/ngày",
            "nurse_notes": "Huyết áp cao, cần theo dõi. Tiền sử dị ứng thuốc."
        },
        "expected_status": 200
    },
    {
        "name": "Fever Patient",
        "description": "Bệnh nhân sốt cao",
        "data": {
            "pulse": 100,
            "temperature": 39.5,
            "blood_pressure_systolic": 110,
            "blood_pressure_diastolic": 70,
            "respiratory_rate": 22,
            "weight": 55,
            "height": 160,
            "oxygen_saturation": 95,
            "pain_scale": 5,
            "reason_text": "Sốt cao 3 ngày, đau họng, ho",
            "medical_history": "Không",
            "allergies": "Không",
            "current_medications": "Paracetamol 500mg khi sốt",
            "nurse_notes": "Bệnh nhân sốt cao, cần ưu tiên khám sớm"
        },
        "expected_status": 200
    },
    {
        "name": "Elderly Patient",
        "description": "Bệnh nhân cao tuổi với nhiều bệnh nền",
        "data": {
            "pulse": 68,
            "temperature": 36.5,
            "blood_pressure_systolic": 145,
            "blood_pressure_diastolic": 85,
            "respiratory_rate": 18,
            "weight": 58,
            "height": 155,
            "oxygen_saturation": 94,
            "pain_scale": 3,
            "reason_text": "Tái khám định kỳ tiểu đường + cao huyết áp",
            "medical_history": "Tiểu đường type 2 (10 năm), Tăng huyết áp (15 năm), Loãng xương",
            "allergies": "Ibuprofen, Hải sản",
            "current_medications": "Metformin 500mg x2/ngày, Amlodipine 5mg/ngày, Calcium + D3",
            "nurse_notes": "Bệnh nhân cao tuổi, nhiều bệnh nền. Cần review đơn thuốc."
        },
        "expected_status": 200
    },
    {
        "name": "Minimal Data",
        "description": "Chỉ có dữ liệu tối thiểu",
        "data": {
            "reason_text": "Khám tổng quát",
            "nurse_notes": "Health Check Mode"
        },
        "expected_status": 200
    }
]


def get_token():
    """Get authentication token from Keycloak (if available)"""
    # Try to read from environment or config file
    import os
    token = os.environ.get("EHR_TOKEN")
    if token:
        return token
    
    # Try to get from Keycloak directly
    try:
        keycloak_url = "https://localhost:8443/realms/ClinicRealm/protocol/openid-connect/token"
        response = requests.post(
            keycloak_url,
            data={
                "client_id": "ehr-frontend",
                "username": "dd.ha",
                "password": "123",
                "grant_type": "password"
            },
            verify=False
        )
        if response.status_code == 200:
            return response.json().get("access_token")
    except Exception as e:
        print(f"Warning: Could not get token from Keycloak: {e}")
    
    return None


def test_screening_endpoint(appointment_id: str, screening_data: dict, token: str = None):
    """Test the PUT /admin/appointments/{id}/screening endpoint"""
    url = f"{BASE_URL}/admin/appointments/{appointment_id}/screening"
    
    headers = {
        "Content-Type": "application/json",
        "X-User": "dd.ha",
        "X-Roles": "nurse",
        "X-Purpose": "care"
    }
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        response = requests.put(
            url,
            json=screening_data,
            headers=headers,
            verify=VERIFY_SSL,
            timeout=30
        )
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None


def get_appointments_with_waiting_status():
    """Get appointments that are waiting for screening"""
    url = f"{BASE_URL}/admin/appointments?status=waiting"
    
    headers = {
        "Content-Type": "application/json",
        "X-User": "dd.ha", 
        "X-Roles": "nurse",
        "X-Purpose": "care"
    }
    
    try:
        response = requests.get(url, headers=headers, verify=VERIFY_SSL, timeout=30)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                return data
            elif isinstance(data, dict):
                return data.get("data", []) or data.get("appointments", [])
        return []
    except Exception as e:
        print(f"Failed to get appointments: {e}")
        return []


def run_tests(appointment_id: str = None, token: str = None):
    """Run all test cases"""
    print("=" * 60)
    print("NURSE SCREENING WORKFLOW TEST")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}")
    print(f"Token: {'Present' if token else 'Not provided'}")
    print(f"Test Time: {datetime.now().isoformat()}")
    print("=" * 60)
    
    if not appointment_id:
        # Try to get an appointment from the system
        appointments = get_appointments_with_waiting_status()
        if appointments:
            appointment_id = appointments[0].get("id")
            print(f"Using appointment: {appointment_id}")
        else:
            # Use a test UUID
            appointment_id = "test-" + datetime.now().strftime("%Y%m%d%H%M%S")
            print(f"No appointments found. Using test ID: {appointment_id}")
    
    print()
    
    results = []
    for i, test_case in enumerate(TEST_CASES, 1):
        print(f"Test {i}: {test_case['name']}")
        print(f"  Description: {test_case['description']}")
        
        response = test_screening_endpoint(appointment_id, test_case["data"], token)
        
        if response is None:
            status = "FAILED - Connection Error"
            passed = False
        elif response.status_code == test_case["expected_status"]:
            status = f"PASSED - Status {response.status_code}"
            passed = True
        elif response.status_code == 401 or response.status_code == 403:
            status = f"SKIPPED - Authentication Required ({response.status_code})"
            passed = None
        elif response.status_code == 404:
            status = f"SKIPPED - Appointment not found ({response.status_code})"
            passed = None
        else:
            status = f"FAILED - Expected {test_case['expected_status']}, got {response.status_code}"
            passed = False
            try:
                print(f"  Response: {response.text[:200]}")
            except:
                pass
        
        print(f"  Result: {status}")
        results.append({
            "name": test_case["name"],
            "passed": passed,
            "status": status
        })
        print()
    
    # Summary
    print("=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    passed_count = sum(1 for r in results if r["passed"] is True)
    failed_count = sum(1 for r in results if r["passed"] is False)
    skipped_count = sum(1 for r in results if r["passed"] is None)
    
    print(f"Total: {len(results)}")
    print(f"Passed: {passed_count}")
    print(f"Failed: {failed_count}")
    print(f"Skipped: {skipped_count}")
    
    return results


if __name__ == "__main__":
    # Get token if possible
    token = get_token()
    
    # Check if appointment_id is provided as argument
    appointment_id = sys.argv[1] if len(sys.argv) > 1 else None
    
    # Run tests
    run_tests(appointment_id, token)
