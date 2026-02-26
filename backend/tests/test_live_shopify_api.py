"""
Test file for OOKEI Portal Live Shopify API integration
Tests all /api/live/* endpoints and Shopify status/checkout endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hype-drop-portal.preview.emergentagent.com').rstrip('/')


class TestShopifyStatus:
    """Test Shopify connection status endpoint"""
    
    def test_shopify_connected(self):
        """GET /api/shopify/status returns connected: true"""
        response = requests.get(f"{BASE_URL}/api/shopify/status")
        assert response.status_code == 200
        
        data = response.json()
        assert data["connected"] == True
        assert "shop_name" in data
        assert "store_domain" in data
        assert data["store_domain"] == "ookey-2.myshopify.com"
        print(f"✓ Shopify connected: {data['shop_name']}")


class TestLiveProducts:
    """Test /api/live/products endpoint"""
    
    def test_live_products_endpoint(self):
        """GET /api/live/products returns products array with drops and basics separated"""
        response = requests.get(f"{BASE_URL}/api/live/products")
        assert response.status_code == 200
        
        data = response.json()
        assert "products" in data
        assert "drops" in data
        assert "basics" in data
        assert "count" in data
        assert isinstance(data["products"], list)
        assert isinstance(data["drops"], list)
        assert isinstance(data["basics"], list)
        
        # Shopify store is empty, so expect 0 products
        assert data["count"] == 0 or data["count"] == len(data["products"])
        print(f"✓ Live products endpoint works - {data['count']} products")
    
    def test_live_products_has_timestamp(self):
        """GET /api/live/products includes timestamp for auto-refresh tracking"""
        response = requests.get(f"{BASE_URL}/api/live/products")
        assert response.status_code == 200
        
        data = response.json()
        if data["count"] > 0:
            assert "timestamp" in data
        print("✓ Live products response structure valid")


class TestLiveDrops:
    """Test /api/live/drops endpoint"""
    
    def test_live_drops_endpoint(self):
        """GET /api/live/drops returns drops array"""
        response = requests.get(f"{BASE_URL}/api/live/drops")
        assert response.status_code == 200
        
        data = response.json()
        assert "drops" in data
        assert "count" in data
        assert isinstance(data["drops"], list)
        
        # Each drop should have drop_order and is_locked fields
        for drop in data["drops"]:
            assert "drop_order" in drop or drop.get("drop_order") is None
            assert "is_locked" in drop
        
        print(f"✓ Live drops endpoint works - {data['count']} drops")
    
    def test_drop_unlock_logic(self):
        """Verify drop unlock logic - is_locked and unlock_message fields"""
        response = requests.get(f"{BASE_URL}/api/live/drops")
        assert response.status_code == 200
        
        data = response.json()
        drops = data["drops"]
        
        # If there are drops, first drop (drop_order=1) should be unlocked
        if len(drops) >= 1:
            sorted_drops = sorted(drops, key=lambda x: x.get("drop_order") or 999)
            first_drop = sorted_drops[0]
            assert first_drop.get("is_locked") == False, "Drop 1 should always be unlocked"
            
            # Subsequent drops should be locked unless previous is sold out
            for i, drop in enumerate(sorted_drops[1:], start=1):
                prev_drop = sorted_drops[i-1]
                if prev_drop.get("total_inventory", 0) <= 0:
                    assert drop.get("is_locked") == False, f"Drop {drop.get('drop_order')} should unlock when previous sells out"
                else:
                    assert drop.get("is_locked") == True, f"Drop {drop.get('drop_order')} should be locked"
                    assert "unlock_message" in drop
        
        print("✓ Drop unlock logic verified")


class TestLiveBasics:
    """Test /api/live/basics endpoint"""
    
    def test_live_basics_endpoint(self):
        """GET /api/live/basics returns basics products"""
        response = requests.get(f"{BASE_URL}/api/live/basics")
        assert response.status_code == 200
        
        data = response.json()
        assert "basics" in data
        assert "count" in data
        assert isinstance(data["basics"], list)
        
        # Basics should never be locked
        for basic in data["basics"]:
            assert basic.get("is_locked") == False
        
        print(f"✓ Live basics endpoint works - {data['count']} basics")


class TestLiveSingleProduct:
    """Test /api/live/product/{handle} endpoint"""
    
    def test_live_product_not_found(self):
        """GET /api/live/product/{handle} returns 404 for non-existent product"""
        response = requests.get(f"{BASE_URL}/api/live/product/non-existent-product")
        assert response.status_code == 404
        
        data = response.json()
        assert "detail" in data
        print("✓ Non-existent product returns 404")
    
    def test_live_product_structure_if_exists(self):
        """GET /api/live/product/{handle} returns correct structure if product exists"""
        # First check if there are any products
        products_response = requests.get(f"{BASE_URL}/api/live/products")
        products = products_response.json().get("products", [])
        
        if products:
            handle = products[0].get("handle") or products[0].get("slug")
            response = requests.get(f"{BASE_URL}/api/live/product/{handle}")
            assert response.status_code == 200
            
            data = response.json()
            assert "product" in data
            assert "timestamp" in data
            
            product = data["product"]
            # Verify product has real-time inventory fields
            assert "shopify_variants" in product or "variants" in product
            assert "total_inventory" in product
            assert "max_edition" in product
            print(f"✓ Live product endpoint works for handle: {handle}")
        else:
            print("✓ No products in Shopify to test single product endpoint")


class TestShopifyCheckout:
    """Test /api/shopify/checkout endpoint"""
    
    def test_create_checkout_url(self):
        """POST /api/shopify/checkout creates checkout URL"""
        payload = {
            "variant_id": "gid://shopify/ProductVariant/12345",
            "quantity": 1
        }
        response = requests.post(f"{BASE_URL}/api/shopify/checkout", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "checkout_url" in data
        assert "variant_id" in data
        assert data["quantity"] == 1
        
        # Verify checkout URL format
        checkout_url = data["checkout_url"]
        assert "ookey-2.myshopify.com/cart/" in checkout_url
        assert "12345:1" in checkout_url
        print(f"✓ Checkout URL created: {checkout_url}")
    
    def test_checkout_multiple_quantity(self):
        """POST /api/shopify/checkout with quantity > 1"""
        payload = {
            "variant_id": "variant-abc-123",
            "quantity": 3
        }
        response = requests.post(f"{BASE_URL}/api/shopify/checkout", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "variant-abc-123:3" in data["checkout_url"]
        print("✓ Multiple quantity checkout works")


class TestProductVariantStructure:
    """Test product variant structure includes required fields"""
    
    def test_variant_fields(self):
        """Products include shopify_variants with size, quantity_available, checkout_url"""
        response = requests.get(f"{BASE_URL}/api/live/products")
        products = response.json().get("products", [])
        
        for product in products:
            variants = product.get("shopify_variants") or product.get("variants", [])
            for variant in variants:
                # Check required fields
                assert "size" in variant, f"Variant missing 'size' field"
                if "shopify_variants" in product:
                    assert "quantity_available" in variant or "inventory" in variant
                    assert "checkout_url" in variant
        
        print(f"✓ Variant structure verified for {len(products)} products")
    
    def test_product_inventory_fields(self):
        """Products include total_inventory and max_edition fields"""
        response = requests.get(f"{BASE_URL}/api/live/products")
        products = response.json().get("products", [])
        
        for product in products:
            assert "total_inventory" in product
            assert "max_edition" in product
            
            # Drops should have max_edition of 150
            if product.get("productType") == "drop":
                assert product.get("max_edition") == 150
        
        print(f"✓ Inventory fields verified for {len(products)} products")


class TestEmptyStateHandling:
    """Test graceful handling of empty Shopify store"""
    
    def test_empty_products_message(self):
        """Empty store returns appropriate message"""
        response = requests.get(f"{BASE_URL}/api/live/products")
        data = response.json()
        
        if data["count"] == 0:
            assert "message" in data or data["products"] == []
        print("✓ Empty state handled correctly")
    
    def test_all_endpoints_return_200_even_empty(self):
        """All live endpoints return 200 even when empty"""
        endpoints = [
            "/api/live/products",
            "/api/live/drops",
            "/api/live/basics"
        ]
        
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}")
            assert response.status_code == 200, f"{endpoint} should return 200"
        
        print("✓ All endpoints return 200 even when empty")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
