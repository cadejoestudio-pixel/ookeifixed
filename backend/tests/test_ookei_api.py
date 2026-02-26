"""
OOKEI API Tests
Tests for the OOKEI streetwear ecommerce API
- /api/products - All products (drops + basics)
- /api/drops - Only drop products (5 t-shirts)
- /api/basics - Only basic products (hoodie)
- Product detail pages
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAPIHealth:
    """Health check tests"""
    
    def test_api_root(self):
        """Test API root endpoint returns success"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data.get("message") == "OOKEI API"
        assert "version" in data
        print("✓ API root endpoint working")


class TestProductsEndpoint:
    """Tests for /api/products - All products"""
    
    def test_get_all_products_returns_6(self):
        """Test /api/products returns all 6 products (5 drops + 1 basic)"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 6, f"Expected 6 products, got {len(data)}"
        print("✓ /api/products returns 6 products")
    
    def test_products_contain_drops_and_basics(self):
        """Test products contain both drop and basic product types"""
        response = requests.get(f"{BASE_URL}/api/products")
        data = response.json()
        
        drops = [p for p in data if p.get("productType") == "drop"]
        basics = [p for p in data if p.get("productType") == "basic"]
        
        assert len(drops) == 5, f"Expected 5 drops, got {len(drops)}"
        assert len(basics) == 1, f"Expected 1 basic, got {len(basics)}"
        print("✓ /api/products contains 5 drops and 1 basic")
    
    def test_drop_prices_are_299(self):
        """Test all drops have Q299 price"""
        response = requests.get(f"{BASE_URL}/api/products")
        data = response.json()
        
        drops = [p for p in data if p.get("productType") == "drop"]
        for drop in drops:
            assert drop.get("price") == 299.00, f"Drop {drop.get('name')} has wrong price: {drop.get('price')}"
        print("✓ All drops have Q299 price")
    
    def test_basic_price_is_420(self):
        """Test basic hoodie has Q420 price"""
        response = requests.get(f"{BASE_URL}/api/products")
        data = response.json()
        
        basics = [p for p in data if p.get("productType") == "basic"]
        assert len(basics) == 1
        assert basics[0].get("price") == 420.00, f"Basic has wrong price: {basics[0].get('price')}"
        print("✓ Basic hoodie has Q420 price")


class TestDropsEndpoint:
    """Tests for /api/drops - Only drop products"""
    
    def test_drops_returns_only_5_drops(self):
        """Test /api/drops returns exactly 5 drop products"""
        response = requests.get(f"{BASE_URL}/api/drops")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5, f"Expected 5 drops, got {len(data)}"
        
        # Verify all are drops
        for product in data:
            assert product.get("productType") == "drop", f"Non-drop found: {product.get('name')}"
        print("✓ /api/drops returns only 5 drop products")
    
    def test_drops_excludes_basics(self):
        """Test /api/drops does not include basic products"""
        response = requests.get(f"{BASE_URL}/api/drops")
        data = response.json()
        
        basics = [p for p in data if p.get("productType") == "basic"]
        assert len(basics) == 0, f"Found basic products in drops: {basics}"
        
        # Double check no hoodie
        hoodie = [p for p in data if "hoodie" in p.get("name", "").lower()]
        assert len(hoodie) == 0, "Hoodie found in drops endpoint"
        print("✓ /api/drops excludes basic products")
    
    def test_drop_001_is_unlocked(self):
        """Test DROP 001 is unlocked"""
        response = requests.get(f"{BASE_URL}/api/drops")
        data = response.json()
        
        drop_001 = [p for p in data if p.get("drop_order") == 1]
        assert len(drop_001) == 1
        assert drop_001[0].get("is_locked") == False, "DROP 001 should be unlocked"
        print("✓ DROP 001 is unlocked")
    
    def test_drops_002_to_005_are_locked(self):
        """Test DROPs 002-005 are locked"""
        response = requests.get(f"{BASE_URL}/api/drops")
        data = response.json()
        
        for drop_order in [2, 3, 4, 5]:
            drop = [p for p in data if p.get("drop_order") == drop_order]
            assert len(drop) == 1
            assert drop[0].get("is_locked") == True, f"DROP {drop_order:03d} should be locked"
        print("✓ DROPs 002-005 are locked")
    
    def test_drops_have_150_units(self):
        """Test all drops have 150 unit max edition"""
        response = requests.get(f"{BASE_URL}/api/drops")
        data = response.json()
        
        for drop in data:
            assert drop.get("max_edition") == 150, f"Drop {drop.get('name')} has wrong max_edition: {drop.get('max_edition')}"
        print("✓ All drops have 150 unit max edition")


class TestBasicsEndpoint:
    """Tests for /api/basics - Only basic products"""
    
    def test_basics_returns_only_1_basic(self):
        """Test /api/basics returns exactly 1 basic product"""
        response = requests.get(f"{BASE_URL}/api/basics")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1, f"Expected 1 basic, got {len(data)}"
        print("✓ /api/basics returns 1 basic product")
    
    def test_basics_excludes_drops(self):
        """Test /api/basics does not include drop products"""
        response = requests.get(f"{BASE_URL}/api/basics")
        data = response.json()
        
        drops = [p for p in data if p.get("productType") == "drop"]
        assert len(drops) == 0, f"Found drop products in basics: {drops}"
        print("✓ /api/basics excludes drop products")
    
    def test_basic_hoodie_properties(self):
        """Test basic hoodie has correct properties"""
        response = requests.get(f"{BASE_URL}/api/basics")
        data = response.json()
        
        hoodie = data[0]
        assert hoodie.get("name") == "OOKEI BASIC HOODIE"
        assert hoodie.get("slug") == "ookei-basic-hoodie"
        assert hoodie.get("price") == 420.00
        assert hoodie.get("category") == "BASICS"
        assert hoodie.get("is_locked") == False
        assert hoodie.get("restockable") == True
        print("✓ Basic hoodie has correct properties")
    
    def test_basic_hoodie_has_4_color_variants(self):
        """Test basic hoodie has 4 color variants"""
        response = requests.get(f"{BASE_URL}/api/basics")
        data = response.json()
        
        hoodie = data[0]
        color_variants = hoodie.get("color_variants", [])
        assert len(color_variants) == 4, f"Expected 4 color variants, got {len(color_variants)}"
        
        colors = [v.get("color") for v in color_variants]
        expected_colors = ["Black", "Brown", "Off White", "Navy"]
        for color in expected_colors:
            assert color in colors, f"Missing color: {color}"
        print("✓ Basic hoodie has 4 color variants: Black, Brown, Off White, Navy")


class TestProductDetailEndpoints:
    """Tests for /api/products/{slug}"""
    
    def test_hoodie_product_detail(self):
        """Test hoodie product detail page"""
        response = requests.get(f"{BASE_URL}/api/products/ookei-basic-hoodie")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("name") == "OOKEI BASIC HOODIE"
        assert data.get("price") == 420.00
        assert data.get("productType") == "basic"
        assert len(data.get("color_variants", [])) == 4
        print("✓ Hoodie product detail works at /api/products/ookei-basic-hoodie")
    
    def test_drop_001_product_detail(self):
        """Test drop 001 product detail page"""
        response = requests.get(f"{BASE_URL}/api/products/we-know-you-looked")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("name") == "WE KNOW YOU LOOKED"
        assert data.get("price") == 299.00
        assert data.get("productType") == "drop"
        assert data.get("is_locked") == False
        print("✓ DROP 001 product detail works at /api/products/we-know-you-looked")
    
    def test_invalid_product_returns_404(self):
        """Test invalid product slug returns 404"""
        response = requests.get(f"{BASE_URL}/api/products/invalid-product-slug")
        assert response.status_code == 404
        print("✓ Invalid product slug returns 404")


class TestCartEndpoints:
    """Tests for cart functionality"""
    
    def test_add_basic_hoodie_to_cart(self):
        """Test adding basic hoodie to cart"""
        session_id = "test-basics-session-001"
        
        # Clear cart first
        requests.delete(f"{BASE_URL}/api/cart/{session_id}")
        
        # Add hoodie to cart
        response = requests.post(f"{BASE_URL}/api/cart/add", json={
            "session_id": session_id,
            "product_id": "basic-hoodie-001",
            "size": "M",
            "color": "Black",
            "quantity": 1
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        
        # Verify cart
        cart_response = requests.get(f"{BASE_URL}/api/cart/{session_id}")
        cart = cart_response.json()
        assert len(cart.get("items", [])) == 1
        assert cart["items"][0]["product_id"] == "basic-hoodie-001"
        assert cart["items"][0]["color"] == "Black"
        print("✓ Basic hoodie can be added to cart with color variant")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/cart/{session_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
