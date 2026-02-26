"""
Shopify Storefront API Integration for OOKEI Portal
Uses GraphQL Storefront API ONLY for real-time product data and checkout
DOES NOT use Admin API or demo endpoints (graphql.myshopify.com)
"""
import os
import re
import httpx
import logging
from typing import Optional, List, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)


def get_config():
    """Get Shopify configuration from environment."""
    return {
        "store_domain": os.environ.get('SHOPIFY_STORE_DOMAIN', ''),
        "access_token": os.environ.get('SHOPIFY_STOREFRONT_ACCESS_TOKEN', ''),
        "api_version": os.environ.get('SHOPIFY_API_VERSION', '2026-01')
    }


# ============== STOREFRONT API QUERIES ==============
# These queries fetch ALL products without any collection/tag filtering
# Filtering into drops/basics is done AFTER fetching based on tags/productType
# NOTE: quantityAvailable requires unauthenticated_read_product_inventory scope
# If not available, we use availableForSale boolean instead

STOREFRONT_ALL_PRODUCTS_QUERY = """
query GetAllProducts($first: Int!) {
  products(first: $first) {
    edges {
      node {
        id
        title
        handle
        description
        productType
        tags
        availableForSale
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        featuredImage {
          url
          altText
        }
        images(first: 10) {
          edges {
            node {
              url
              altText
            }
          }
        }
        options {
          name
          values
        }
        variants(first: 50) {
          edges {
            node {
              id
              title
              availableForSale
              quantityAvailable
              price {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
  }
}
"""

STOREFRONT_PRODUCT_BY_HANDLE_QUERY = """
query GetProductByHandle($handle: String!) {
  productByHandle(handle: $handle) {
    id
    title
    handle
    description
    productType
    tags
    availableForSale
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      url
      altText
    }
    images(first: 10) {
      edges {
        node {
          url
          altText
        }
      }
    }
    options {
      name
      values
    }
    variants(first: 50) {
      edges {
        node {
          id
          title
          availableForSale
          price {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
}
"""

STOREFRONT_COLLECTION_QUERY = """
query GetCollection($handle: String!, $first: Int!) {
  collectionByHandle(handle: $handle) {
    id
    title
    handle
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          productType
          tags
          availableForSale
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          featuredImage {
            url
            altText
          }
          images(first: 10) {
            edges {
              node {
                url
                altText
              }
            }
          }
          options {
            name
            values
          }
          variants(first: 50) {
            edges {
              node {
                id
                title
                availableForSale
                price {
                  amount
                  currencyCode
                }
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }
    }
  }
}
"""


async def execute_storefront_graphql(query: str, variables: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Execute a GraphQL query against Shopify Storefront API.
    
    Endpoint: https://{store_domain}/api/{version}/graphql.json
    Header: X-Shopify-Storefront-Access-Token
    
    DOES NOT use graphql.myshopify.com (demo endpoint)
    DOES NOT use Admin API
    """
    config = get_config()
    store_domain = config["store_domain"]
    access_token = config["access_token"]
    api_version = config["api_version"]
    
    if not store_domain or not access_token:
        logger.error("Shopify credentials not configured")
        return {"errors": [{"message": "Shopify not configured"}]}
    
    # Storefront API endpoint - NOT graphql.myshopify.com
    api_url = f"https://{store_domain}/api/{api_version}/graphql.json"
    
    # Storefront API uses X-Shopify-Storefront-Access-Token header
    headers = {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": access_token
    }
    
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    
    logger.info(f"Storefront API call: {api_url}")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(api_url, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
            
            if "errors" in result:
                logger.error(f"GraphQL errors: {result['errors']}")
            
            return result
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Storefront API HTTP error: {e.response.status_code} - {e.response.text}")
            return {"errors": [{"message": f"HTTP {e.response.status_code}: {e.response.text}"}]}
        except httpx.HTTPError as e:
            logger.error(f"Storefront API error: {e}")
            return {"errors": [{"message": str(e)}]}


# ============== PRODUCT FUNCTIONS ==============

async def fetch_all_products_live(limit: int = 50) -> List[Dict]:
    """
    Fetch ALL products from Shopify Storefront API.
    
    NO filtering by collection, tags, or productType at the query level.
    All filtering is done AFTER fetching to ensure we see all products.
    """
    logger.info(f"Fetching all products (limit={limit})")
    
    result = await execute_storefront_graphql(STOREFRONT_ALL_PRODUCTS_QUERY, {"first": limit})
    
    if "errors" in result:
        logger.error(f"Error fetching products: {result['errors']}")
        return []
    
    products = []
    edges = result.get("data", {}).get("products", {}).get("edges", [])
    
    logger.info(f"Storefront API returned {len(edges)} products")
    
    for edge in edges:
        node = edge.get("node", {})
        transformed = transform_storefront_product(node)
        if transformed:
            products.append(transformed)
            logger.info(f"Product: {transformed['name']} | Type: {transformed['productType']} | Category: {transformed['category']} | Tags: {transformed.get('tags', [])}")
    
    # Sort by drop order if applicable
    products.sort(key=lambda x: x.get("drop_order") or 999)
    
    return products


async def fetch_collection_products(collection_handle: str, limit: int = 50) -> List[Dict]:
    """Fetch products from a specific Shopify collection."""
    logger.info(f"Fetching collection: {collection_handle}")
    
    result = await execute_storefront_graphql(
        STOREFRONT_COLLECTION_QUERY, 
        {"handle": collection_handle, "first": limit}
    )
    
    if "errors" in result:
        logger.error(f"Error fetching collection {collection_handle}: {result['errors']}")
        return []
    
    collection = result.get("data", {}).get("collectionByHandle")
    if not collection:
        logger.warning(f"Collection not found: {collection_handle}")
        return []
    
    products = []
    edges = collection.get("products", {}).get("edges", [])
    
    logger.info(f"Collection '{collection_handle}' has {len(edges)} products")
    
    for edge in edges:
        node = edge.get("node", {})
        transformed = transform_storefront_product(node)
        if transformed:
            products.append(transformed)
    
    return products


async def fetch_product_by_handle_live(handle: str) -> Optional[Dict]:
    """Fetch a single product by handle with real-time data."""
    logger.info(f"Fetching product by handle: {handle}")
    
    result = await execute_storefront_graphql(STOREFRONT_PRODUCT_BY_HANDLE_QUERY, {"handle": handle})
    
    if "errors" in result:
        logger.error(f"Error fetching product {handle}: {result['errors']}")
        return None
    
    product_data = result.get("data", {}).get("productByHandle")
    if not product_data:
        logger.warning(f"Product not found: {handle}")
        return None
    
    return transform_storefront_product(product_data)


def transform_storefront_product(node: Dict) -> Dict:
    """
    Transform Shopify Storefront API product to OOKEI format.
    
    CATEGORIZATION LOGIC (applied AFTER fetching):
    
    DROPS are identified by:
    - Tags containing: "drop", "drop-1", "drop-2", "drop1", "drop2", etc.
    - ProductType containing: "drop"
    - Title containing: "drop"
    
    BASICS are identified by:
    - Tags containing: "basic", "basics"
    - ProductType containing: "basic", "basics"
    - Title containing: "basic", "hoodie"
    
    If neither matches, product defaults to BASICS.
    
    Drop order is extracted from tags like "drop-1", "drop-2" or "drop1", "drop2"
    """
    config = get_config()
    store_domain = config["store_domain"]
    
    # Extract images
    images = []
    featured = node.get("featuredImage")
    if featured and featured.get("url"):
        images.append(featured["url"])
    
    for edge in node.get("images", {}).get("edges", []):
        img_url = edge.get("node", {}).get("url")
        if img_url and img_url not in images:
            images.append(img_url)
    
    # Extract tags (array of strings)
    tags = node.get("tags", [])
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(",")]
    tags_lower = [t.lower().strip() for t in tags]
    
    # Get productType
    product_type_raw = (node.get("productType") or "").lower().strip()
    title_lower = (node.get("title") or "").lower()
    
    # Determine category: DROPS or BASICS
    is_drop = False
    is_basic = False
    drop_order = None
    
    # Check tags for category indicators
    for tag in tags_lower:
        # Match drop tags: "drop", "drop-1", "drop1", "drop 1", "drops"
        if "drop" in tag:
            is_drop = True
            # Try to extract drop number
            match = re.search(r'drop[- ]?(\d+)', tag)
            if match:
                drop_order = int(match.group(1))
        
        # Match basic tags: "basic", "basics"
        if "basic" in tag:
            is_basic = True
    
    # Check productType
    if "drop" in product_type_raw:
        is_drop = True
    if "basic" in product_type_raw:
        is_basic = True
    
    # Check title as fallback
    if not is_drop and not is_basic:
        if "drop" in title_lower:
            is_drop = True
            # Try to get drop number from title
            match = re.search(r'drop[- ]?(\d+)', title_lower)
            if match:
                drop_order = int(match.group(1))
        elif "basic" in title_lower or "hoodie" in title_lower:
            is_basic = True
    
    # Default: if nothing matched, treat as basic
    if not is_drop and not is_basic:
        is_basic = True
    
    # Final category assignment
    if is_drop:
        product_type = "drop"
        category = "DROPS"
        if drop_order is None:
            drop_order = 1  # Default to drop 1
    else:
        product_type = "basic"
        category = "BASICS"
        drop_order = None
    
    # Extract variants with inventory - ONLY S, M, L, XL (exclude XXL)
    # NOTE: If quantityAvailable is not available (missing scope), use availableForSale
    ALLOWED_SIZES = ["S", "M", "L", "XL"]
    variants = []
    shopify_variants = []
    total_inventory = 0
    available_variants_count = 0
    
    # Get color from options
    color = None
    for option in node.get("options", []):
        if option.get("name", "").lower() == "color":
            values = option.get("values", [])
            if values:
                color = values[0]
            break
    
    for edge in node.get("variants", {}).get("edges", []):
        v = edge.get("node", {})
        variant_gid = v.get("id", "")
        
        # Parse size from selectedOptions
        size = None
        variant_color = color
        for opt in v.get("selectedOptions", []):
            opt_name = opt.get("name", "").lower()
            opt_value = opt.get("value", "")
            if opt_name == "size":
                size = opt_value.upper() if opt_value else None
            elif opt_name == "color":
                variant_color = opt_value
        
        # Fallback: parse from title
        if not size:
            title = v.get("title", "")
            for allowed in ALLOWED_SIZES:
                if allowed in title.upper():
                    size = allowed
                    break
            # If still no size, use title as size
            if not size:
                size = title.split("/")[0].strip().upper() if "/" in title else title.strip().upper()
        
        # Skip XXL
        if size and "XXL" in size:
            continue
        
        # Use quantityAvailable if present, otherwise estimate from availableForSale
        # If availableForSale is True, assume some inventory (e.g., 10)
        # This is a workaround when inventory scope is not available
        inventory_qty = v.get("quantityAvailable")
        if inventory_qty is None:
            # Estimate inventory based on availableForSale
            inventory_qty = 10 if v.get("availableForSale", False) else 0
            
        if inventory_qty < 0:
            inventory_qty = 0
            
        available = v.get("availableForSale", False)
        if available:
            available_variants_count += 1
            
        price = float(v.get("price", {}).get("amount", 0))
        
        # Extract numeric variant ID from GID
        variant_id = variant_gid.split("/")[-1] if "/" in variant_gid else variant_gid
        
        # Build checkout URL
        checkout_url = f"https://{store_domain}/cart/{variant_id}:1"
        
        shopify_variants.append({
            "shopify_variant_id": variant_gid,
            "variant_id": variant_id,
            "size": size or "Default",
            "color": variant_color,
            "price": price,
            "available": available,
            "quantity_available": inventory_qty,
            "checkout_url": checkout_url
        })
        
        variants.append({
            "size": size or "Default",
            "inventory": inventory_qty,
            "available": available,
            "shopify_variant_id": variant_gid,
            "checkout_url": checkout_url
        })
        
        total_inventory += inventory_qty
    
    # Get price from priceRange
    price_data = node.get("priceRange", {}).get("minVariantPrice", {})
    price = float(price_data.get("amount", 0))
    currency = price_data.get("currencyCode", "GTQ")
    
    # Max edition for drops
    max_edition = 150 if product_type == "drop" else None
    
    # Check if sold out
    is_sold_out = not node.get("availableForSale", True) or total_inventory <= 0
    
    return {
        "shopify_id": node.get("id", ""),
        "id": f"shopify-{node.get('handle', '')}",
        "name": node.get("title", ""),
        "slug": node.get("handle", ""),
        "handle": node.get("handle", ""),
        "productType": product_type,
        "category": category,
        "price": price,
        "currency": currency,
        "description": node.get("description", ""),
        "images": images,
        "color": color,
        "tags": tags,
        "variants": variants,
        "shopify_variants": shopify_variants,
        "total_inventory": total_inventory,
        "max_edition": max_edition,
        "is_sold_out": is_sold_out,
        "is_locked": False,  # Will be calculated by unlock logic
        "restockable": product_type == "basic",
        "drop_order": drop_order,
        "available_for_sale": node.get("availableForSale", True)
    }


def calculate_drop_unlock_status(products: List[Dict]) -> List[Dict]:
    """
    Calculate drop unlock status based on inventory.
    
    Rules:
    - Drop 1 = always unlocked
    - Drop 2 = unlocked when Drop 1 total_inventory = 0
    - Drop 3 = unlocked when Drop 2 total_inventory = 0
    - etc.
    
    Also assigns sequential drop_order to drops without explicit numbers.
    """
    # Separate drops and basics
    drops = [p for p in products if p.get("productType") == "drop"]
    basics = [p for p in products if p.get("productType") == "basic"]
    
    # Sort drops by drop_order (if available) or by name
    drops.sort(key=lambda x: (x.get("drop_order") or 999, x.get("name", "")))
    
    # Assign sequential drop_order to drops that don't have one
    # or have the same order
    used_orders = set()
    for drop in drops:
        current_order = drop.get("drop_order")
        if current_order is None or current_order in used_orders:
            # Find next available order
            next_order = 1
            while next_order in used_orders:
                next_order += 1
            drop["drop_order"] = next_order
            used_orders.add(next_order)
        else:
            used_orders.add(current_order)
    
    # Re-sort after assigning orders
    drops.sort(key=lambda x: x.get("drop_order") or 999)
    
    # Apply unlock logic
    for i, drop in enumerate(drops):
        if i == 0:
            # Drop 1 is always unlocked
            drop["is_locked"] = False
            drop["unlock_message"] = None
        else:
            # Check if previous drop is sold out
            prev_drop = drops[i - 1]
            if prev_drop.get("total_inventory", 0) <= 0:
                drop["is_locked"] = False
                drop["unlock_message"] = None
            else:
                drop["is_locked"] = True
                prev_order = prev_drop.get('drop_order', i)
                drop["unlock_message"] = f"Unlocks when Drop {prev_order} sells out"
    
    # Basics are never locked
    for basic in basics:
        basic["is_locked"] = False
        basic["unlock_message"] = None
    
    return drops + basics


async def create_checkout_url(variant_id: str, quantity: int = 1) -> Dict:
    """Create a Shopify checkout URL for direct purchase."""
    config = get_config()
    store_domain = config["store_domain"]
    
    # Extract numeric ID if it's a GID
    numeric_id = variant_id
    if "gid://" in str(variant_id):
        numeric_id = str(variant_id).split("/")[-1]
    
    checkout_url = f"https://{store_domain}/cart/{numeric_id}:{quantity}"
    
    return {
        "success": True,
        "checkout_url": checkout_url,
        "variant_id": numeric_id,
        "quantity": quantity
    }


async def create_cart_checkout(items: List[Dict]) -> Dict:
    """Create checkout URL for multiple cart items."""
    config = get_config()
    store_domain = config["store_domain"]
    
    cart_items = []
    for item in items:
        variant_id = item.get("variant_id") or item.get("shopify_variant_id", "")
        
        if "gid://" in str(variant_id):
            variant_id = str(variant_id).split("/")[-1]
        
        quantity = item.get("quantity", 1)
        cart_items.append(f"{variant_id}:{quantity}")
    
    checkout_url = f"https://{store_domain}/cart/{','.join(cart_items)}"
    
    return {
        "success": True,
        "checkout_url": checkout_url,
        "items_count": len(cart_items)
    }


# ============== HEALTH CHECK ==============

async def test_connection() -> Dict:
    """Test the Shopify Storefront API connection."""
    config = get_config()
    store_domain = config["store_domain"]
    access_token = config["access_token"]
    api_version = config["api_version"]
    
    if not store_domain or not access_token:
        return {
            "connected": False,
            "error": "Shopify credentials not configured",
            "store_domain": store_domain
        }
    
    # Test with shop query
    test_query = """
    query {
      shop {
        name
        primaryDomain {
          url
        }
      }
    }
    """
    
    result = await execute_storefront_graphql(test_query)
    
    if "errors" in result:
        return {
            "connected": False,
            "error": result["errors"][0].get("message", "Unknown error"),
            "store_domain": store_domain,
            "api_endpoint": f"https://{store_domain}/api/{api_version}/graphql.json"
        }
    
    shop_data = result.get("data", {}).get("shop", {})
    return {
        "connected": True,
        "shop_name": shop_data.get("name"),
        "store_domain": store_domain,
        "primary_url": shop_data.get("primaryDomain", {}).get("url"),
        "api_version": api_version,
        "api_endpoint": f"https://{store_domain}/api/{api_version}/graphql.json",
        "api_type": "Storefront API (public token)"
    }
