import requests
import sys
import json
from datetime import datetime

class OOKEIAPITester:
    def __init__(self, base_url="https://hype-drop-portal.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.session_id = f"test_session_{datetime.now().strftime('%H%M%S')}"

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}" if not endpoint.startswith('http') else endpoint
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if method == 'GET' and isinstance(response_data, list):
                        print(f"   Response: {len(response_data)} items returned")
                    elif isinstance(response_data, dict) and 'message' in response_data:
                        print(f"   Message: {response_data['message']}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error text: {response.text[:200]}...")

            return success, response.json() if response.content and response.headers.get('content-type', '').startswith('application/json') else {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_get_products(self):
        """Test getting all products"""
        return self.run_test("Get Products", "GET", "products", 200)

    def test_get_single_product(self):
        """Test getting specific OOKEI drops by slug"""
        # Test DROP 001
        success1, _ = self.run_test("Get DROP 001 (we-know-you-looked)", "GET", "products/we-know-you-looked", 200)
        # Test DROP 002  
        success2, _ = self.run_test("Get DROP 002 (join-the-cult)", "GET", "products/join-the-cult", 200)
        return success1 and success2

    def test_get_nonexistent_product(self):
        """Test getting a non-existent product"""
        success, _ = self.run_test("Get Non-existent Product", "GET", "products/nonexistent", 404)
        return success

    def test_get_drops(self):
        """Test getting all drops for drops page"""
        return self.run_test("Get All Drops", "GET", "drops", 200)

    def test_email_subscription(self):
        """Test email subscription"""
        test_email = f"test_{self.session_id}@example.com"
        success, response = self.run_test(
            "Email Subscription",
            "POST",
            "subscribe",
            200,
            data={"email": test_email, "source": "homepage"}
        )
        return success

    def test_duplicate_email_subscription(self):
        """Test duplicate email subscription"""
        test_email = f"test_{self.session_id}@example.com"
        # Subscribe twice with same email
        self.run_test("First Email Subscription", "POST", "subscribe", 200,
                     data={"email": test_email, "source": "homepage"})
        success, response = self.run_test(
            "Duplicate Email Subscription",
            "POST", 
            "subscribe",
            200,
            data={"email": test_email, "source": "homepage"}
        )
        return success

    def test_invalid_email_subscription(self):
        """Test invalid email subscription"""
        success, _ = self.run_test(
            "Invalid Email Subscription",
            "POST",
            "subscribe",
            422,  # FastAPI validation error
            data={"email": "invalid-email", "source": "homepage"}
        )
        return success

    def test_get_subscriber_count(self):
        """Test getting subscriber count"""
        return self.run_test("Get Subscriber Count", "GET", "subscribers/count", 200)

    def test_contact_submission(self):
        """Test contact form submission"""
        success, response = self.run_test(
            "Contact Submission",
            "POST",
            "contact",
            200,
            data={
                "name": "Test User",
                "email": f"contact_{self.session_id}@example.com", 
                "message": "This is a test contact message."
            }
        )
        return success

    def test_invalid_contact_submission(self):
        """Test invalid contact form submission"""
        success, _ = self.run_test(
            "Invalid Contact Submission",
            "POST",
            "contact", 
            422,
            data={
                "name": "Test User",
                "email": "invalid-email",
                "message": "Test message"
            }
        )
        return success

    def test_cart_operations(self):
        """Test cart operations with real OOKEI product IDs"""
        # Test adding to cart with DROP 001 ID
        success1, _ = self.run_test(
            "Add DROP 001 to Cart",
            "POST",
            "cart/add",
            200,
            data={
                "session_id": self.session_id,
                "product_id": "drop-001",
                "variant_size": "M",
                "quantity": 1
            }
        )

        # Test getting cart
        success2, cart_data = self.run_test(
            "Get Cart",
            "GET", 
            f"cart/{self.session_id}",
            200
        )

        # Test updating cart item
        success3, _ = self.run_test(
            "Update Cart Item",
            "PUT",
            "cart/update",
            200,
            data={
                "session_id": self.session_id,
                "product_id": "drop-001", 
                "variant_size": "M",
                "quantity": 2
            }
        )

        # Test clearing cart
        success4, _ = self.run_test(
            "Clear Cart",
            "DELETE",
            f"cart/{self.session_id}",
            200
        )

        return all([success1, success2, success3, success4])

    def test_shopify_checkout(self):
        """Test Shopify checkout placeholder"""
        # First add item to cart with real OOKEI product
        self.run_test(
            "Add DROP 002 for Checkout",
            "POST",
            "cart/add", 
            200,
            data={
                "session_id": self.session_id,
                "product_id": "drop-002",
                "variant_size": "L", 
                "quantity": 1
            }
        )

        # Test checkout
        success, response = self.run_test(
            "Shopify Checkout Placeholder",
            "POST",
            f"shopify/checkout?session_id={self.session_id}",
            200
        )
        return success

    def test_drop_stats(self):
        """Test drop statistics"""
        return self.run_test("Drop Statistics", "GET", "drop/stats", 200)

def main():
    print("🚀 Starting OOKEI API Tests")
    print("=" * 50)
    
    tester = OOKEIAPITester()
    
    # Run all tests
    tests = [
        tester.test_api_root,
        tester.test_get_products,
        tester.test_get_drops,
        tester.test_get_single_product,
        tester.test_get_nonexistent_product,
        tester.test_email_subscription,
        tester.test_duplicate_email_subscription,
        tester.test_invalid_email_subscription,
        tester.test_contact_submission,
        tester.test_invalid_contact_submission,
        tester.test_cart_operations,
        tester.test_shopify_checkout,
        tester.test_drop_stats
    ]

    failed_tests = []
    
    for test in tests:
        try:
            if not test():
                failed_tests.append(test.__name__)
        except Exception as e:
            print(f"❌ Test {test.__name__} crashed: {str(e)}")
            failed_tests.append(test.__name__)

    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"\n❌ Failed tests:")
        for test in failed_tests:
            print(f"   - {test}")
        return 1
    else:
        print("\n✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())