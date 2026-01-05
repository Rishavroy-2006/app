import requests
import sys
from datetime import datetime

class AadhaarAPITester:
    def __init__(self, base_url="https://aadhaar-intel.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, endpoint, expected_status=200, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, params=params, timeout=10)
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Parse and validate response structure
                try:
                    data = response.json()
                    print(f"   Response type: {type(data)}")
                    if isinstance(data, list):
                        print(f"   Array length: {len(data)}")
                    elif isinstance(data, dict):
                        print(f"   Dict keys: {list(data.keys())}")
                    return True, data
                except Exception as e:
                    print(f"   Warning: Could not parse JSON - {e}")
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error response: {error_data}")
                except:
                    print(f"   Error text: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "")

    def test_stats_endpoint(self):
        """Test stats endpoint - should return overall statistics"""
        success, data = self.run_test("Stats Endpoint", "stats")
        if success and isinstance(data, dict):
            expected_keys = ['total_states', 'total_enrolments', 'total_demo_updates', 'total_bio_updates']
            missing_keys = [key for key in expected_keys if key not in data]
            if missing_keys:
                print(f"   Warning: Missing keys: {missing_keys}")
            else:
                print(f"   ✅ All expected keys present")
                print(f"   Stats: {data}")
        return success

    def test_state_summary_endpoint(self):
        """Test state summary endpoint - should return array of state data"""
        success, data = self.run_test("State Summary Endpoint", "state-summary")
        if success and isinstance(data, list):
            if len(data) == 0:
                print(f"   ✅ Empty array returned (expected with no data)")
            else:
                print(f"   Sample state data: {data[0] if data else 'None'}")
        return success

    def test_top_states_endpoint(self):
        """Test top states endpoint with different parameters"""
        # Test default parameters
        success1, data1 = self.run_test("Top States (default)", "top-states")
        
        # Test with specific metric
        success2, data2 = self.run_test("Top States (demo metric)", "top-states", params={"metric": "total_demo_updates", "n": 5})
        
        # Test with bio metric
        success3, data3 = self.run_test("Top States (bio metric)", "top-states", params={"metric": "total_bio_updates", "n": 3})
        
        return success1 and success2 and success3

    def test_anomaly_points_endpoint(self):
        """Test anomaly points endpoint - should return scatter plot data"""
        success, data = self.run_test("Anomaly Points Endpoint", "anomaly-points")
        if success and isinstance(data, list):
            if len(data) == 0:
                print(f"   ✅ Empty array returned (expected with no data)")
            else:
                # Check if data has expected structure
                sample = data[0]
                expected_keys = ['state', 'demo_per_enrol', 'bio_per_enrol', 'is_anomaly']
                missing_keys = [key for key in expected_keys if key not in sample]
                if missing_keys:
                    print(f"   Warning: Missing keys in sample: {missing_keys}")
                else:
                    print(f"   ✅ Sample data structure correct")
        return success

    def test_monthly_enrolment_endpoint(self):
        """Test monthly enrolment endpoint - should return time series data"""
        success, data = self.run_test("Monthly Enrolment Endpoint", "monthly-enrolment")
        if success and isinstance(data, list):
            if len(data) == 0:
                print(f"   ✅ Empty array returned (expected with no data)")
            else:
                # Check if data has expected structure
                sample = data[0]
                expected_keys = ['month', 'total_enrol']
                missing_keys = [key for key in expected_keys if key not in sample]
                if missing_keys:
                    print(f"   Warning: Missing keys in sample: {missing_keys}")
                else:
                    print(f"   ✅ Sample data structure correct")
        return success

    def test_invalid_endpoints(self):
        """Test invalid endpoints return proper error codes"""
        success1, _ = self.run_test("Invalid Endpoint", "nonexistent", expected_status=404)
        
        # Test invalid metric parameter
        success2, _ = self.run_test("Invalid Metric Parameter", "top-states", expected_status=422, params={"metric": "invalid_metric"})
        
        return success1 and success2

def main():
    print("🚀 Starting Aadhaar Intelligence Console API Tests")
    print("=" * 60)
    
    tester = AadhaarAPITester()
    
    # Run all tests
    test_results = []
    
    print("\n📋 Testing Core API Endpoints...")
    test_results.append(tester.test_root_endpoint())
    test_results.append(tester.test_stats_endpoint())
    test_results.append(tester.test_state_summary_endpoint())
    test_results.append(tester.test_top_states_endpoint())
    test_results.append(tester.test_anomaly_points_endpoint())
    test_results.append(tester.test_monthly_enrolment_endpoint())
    
    print("\n🔍 Testing Error Handling...")
    test_results.append(tester.test_invalid_endpoints())
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())