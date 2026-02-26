"""
Shopify Integration Tests for OOKEI Portal
Tests for:
- Shopify connection status
- Product sync from Shopify
- Checkout URL generation
- Variant linking
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestShopifyStatus:
    """Test Shopify connection status endpoint"""
    
    def test_shopify_status_connected(self):
        """Test GET /api/shopify/status returns connected: true"""
        response = requests.get(f"{BASE_URL}/api/shopify/status")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("connected") == True, f"Expected connected: true, got {data}"
        assert data.get("shop_name") == "OOKEY", f"Expected shop_name: OOKEY, got {data.get('shop_name')}"
        assert data.get("store_domain") == "ookey-2.myshopify.com"
        print("✓ Shopify status returns connected: true with shop_name 'OOKEY'")


class TestShopifyProducts:
    """Test Shopify products endpoint"""
    
    def test_shopify_products_returns_list(self):
        """Test GET /api/shopify/products returns products (may be empty if store has no products)"""
        response = requests.get(f"{BASE_URL}/api/shopify/products")
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data, f"Expected 'products' key in response, got {data.keys()}"
        assert "count" in data, f"Expected 'count' key in response"
        assert isinstance(data["products"], list), f"Expected products to be a list"
        print(f"✓ Shopify products returns {data['count']} products (store may be empty)")


class TestShopifyCheckout:
    """Test Shopify direct checkout endpoint"""
    
    def test_shopify_checkout_creates_url(self):
        """Test POST /api/shopify/checkout creates checkout URL with correct format"""
        response = requests.post(
            f"{BASE_URL}/api/shopify/checkout",
            json={
                "variant_id": "gid://shopify/ProductVariant/12345678",
                "quantity": 1
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True, f"Expected success: true, got {data}"
        assert "checkout_url" in data, f"Expected checkout_url in response"
        
        # Verify URL format: https://ookey-2.myshopify.com/cart/VARIANT:QTY
        checkout_url = data["checkout_url"]
        assert checkout_url.startswith("https://ookey-2.myshopify.com/cart/"), f"Invalid checkout URL: {checkout_url}"
        assert ":1" in checkout_url, f"Expected ':1' quantity in URL: {checkout_url}"
        print(f"✓ Shopify checkout creates URL: {checkout_url}")
    
    def test_shopify_checkout_with_numeric_variant(self):
        """Test checkout works with plain numeric variant ID"""
        response = requests.post(
            f"{BASE_URL}/api/shopify/checkout",
            json={
                "variant_id": "87654321",
                "quantity": 2
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "87654321:2" in data["checkout_url"]
        print("✓ Shopify checkout works with numeric variant ID")


class TestLinkShopifyVariant:
    """Test variant linking endpoint"""
    
    def test_link_shopify_variant_success(self):
        """Test POST /api/link-shopify-variant successfully links variant"""
        # Use test product slug
        response = requests.post(
            f"{BASE_URL}/api/link-shopify-variant",
            json={
                "product_slug": "we-know-you-looked",
                "size": "L",
                "shopify_variant_id": "gid://shopify/ProductVariant/TEST_12345"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True, f"Expected success: true, got {data}"
        assert "we-know-you-looked" in data.get("product_slug", "")
        print("✓ Link Shopify variant works correctly")
    
    def test_link_shopify_variant_invalid_product(self):
        """Test linking to invalid product returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/link-shopify-variant",
            json={
                "product_slug": "invalid-product-slug",
                "size": "M",
                "shopify_variant_id": "gid://shopify/ProductVariant/99999"
            }
        )
        assert response.status_code == 404
        print("✓ Link to invalid product returns 404")


class TestProductVariants:
    """Test product variants endpoint"""
    
    def test_get_product_variants(self):
        """Test GET /api/product-variants/{slug} returns variants with Shopify IDs"""
        response = requests.get(f"{BASE_URL}/api/product-variants/we-know-you-looked")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("product_slug") == "we-know-you-looked"
        assert data.get("product_name") == "WE KNOW YOU LOOKED"
        assert "variants" in data
        assert isinstance(data["variants"], list)
        assert len(data["variants"]) > 0, "Expected at least one variant"
        
        # Check for Shopify variants field
        assert "shopify_variants" in data
        print(f"✓ Product variants returns {len(data['variants'])} variants")
    
    def test_get_product_variants_invalid_slug(self):
        """Test invalid product slug returns 404"""
        response = requests.get(f"{BASE_URL}/api/product-variants/invalid-slug")
        assert response.status_code == 404
        print("✓ Invalid product slug returns 404")


class TestCartCheckout:
    """Test cart-based checkout"""
    
    def test_cart_checkout_without_shopify_variants(self):
        """Test checkout fails gracefully if cart items don't have Shopify variants"""
        session_id = "TEST_cart_checkout_session"
        
        # Clear existing cart
        requests.delete(f"{BASE_URL}/api/cart/{session_id}")
        
        # Add item without Shopify variant
        response = requests.post(
            f"{BASE_URL}/api/cart/add",
            json={
                "session_id": session_id,
                "product_id": "drop-002",  # Not linked to Shopify
                "size": "S",
                "quantity": 1
            }
        )
        assert response.status_code == 200
        
        # Try checkout - should fail due to missing Shopify variants or API scope
        checkout_response = requests.post(
            f"{BASE_URL}/api/checkout",
            json={"session_id": session_id}
        )
        
        # Either 400 (no valid variants) or another error status
        assert checkout_response.status_code >= 400, f"Expected error, got {checkout_response.status_code}"
        print("✓ Cart checkout handles missing Shopify variants correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/cart/{session_id}")
    
    def test_checkout_empty_cart(self):
        """Test checkout with empty cart returns error"""
        session_id = "TEST_empty_cart_session"
        
        # Ensure cart is empty
        requests.delete(f"{BASE_URL}/api/cart/{session_id}")
        
        response = requests.post(
            f"{BASE_URL}/api/checkout",
            json={"session_id": session_id}
        )
        
        assert response.status_code == 400
        print("✓ Checkout with empty cart returns 400")


class TestExistingOOKEIFeatures:
    """Verify existing OOKEI features still work after Shopify integration"""
    
    def test_drops_page_still_works(self):
        """Test /api/drops returns 5 drops"""
        response = requests.get(f"{BASE_URL}/api/drops")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5, f"Expected 5 drops, got {len(data)}"
        print("✓ Drops endpoint still returns 5 drops")
    
    def test_basics_page_still_works(self):
        """Test /api/basics returns 1 basic product"""
        response = requests.get(f"{BASE_URL}/api/basics")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1, f"Expected 1 basic, got {len(data)}"
        assert data[0].get("name") == "OOKEI BASIC HOODIE"
        print("✓ Basics endpoint still returns OOKEI BASIC HOODIE")
    
    def test_products_endpoint_still_works(self):
        """Test /api/products returns all 6 products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 6, f"Expected 6 products, got {len(data)}"
        print("✓ Products endpoint still returns all 6 products")
    
    def test_cart_add_still_works(self):
        """Test cart add functionality"""
        session_id = "TEST_cart_add_test"
        
        # Clear cart
        requests.delete(f"{BASE_URL}/api/cart/{session_id}")
        
        # Add item
        response = requests.post(
            f"{BASE_URL}/api/cart/add",
            json={
                "session_id": session_id,
                "product_id": "drop-001",
                "size": "M",
                "quantity": 1
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        
        # Verify persistence
        cart = requests.get(f"{BASE_URL}/api/cart/{session_id}").json()
        assert len(cart.get("items", [])) == 1
        print("✓ Cart add functionality still works")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/cart/{session_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
