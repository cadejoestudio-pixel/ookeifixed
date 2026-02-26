from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone

# Import Shopify service
import shopify_service

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.getenv('MONGO_URL', '')
db_name = os.getenv('DB_NAME', 'ookei')

client = None
db = None
if mongo_url:
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
else:
    logger = logging.getLogger(__name__)
    logger.warning('MONGO_URL not set - database-backed endpoints will be unavailable.')

app = FastAPI(title="OOKEI API", version="4.0.0")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class SizeVariant(BaseModel):
    size: str
    inventory: int
    sku: str

class ColorVariant(BaseModel):
    color: str
    color_code: str
    image: str
    sizes: List[SizeVariant]

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    slug: str
    productType: str  # "drop" or "basic"
    category: str  # "DROPS" or "BASICS"
    price: float
    currency: str = "GTQ"
    description: str
    story: str
    details: List[str]
    images: List[str]
    variants: List[SizeVariant]
    color_variants: Optional[List[ColorVariant]] = None
    total_inventory: int
    max_edition: Optional[int] = None
    is_locked: bool = False
    is_sold_out: bool = False
    restockable: bool = False
    drop_order: Optional[int] = None
    is_active: bool = True

class EmailSubscribeRequest(BaseModel):
    email: EmailStr
    source: str = "homepage"

class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    message: str

class CartAddRequest(BaseModel):
    session_id: str
    product_id: str
    size: str
    color: Optional[str] = None
    quantity: int = 1

class CartUpdateRequest(BaseModel):
    session_id: str
    product_id: str
    size: str
    color: Optional[str] = None
    quantity: int

class ShopifyCheckoutRequest(BaseModel):
    variant_id: str
    quantity: int = 1

class CartCheckoutRequest(BaseModel):
    session_id: str

class LinkShopifyVariantRequest(BaseModel):
    product_slug: str
    size: str
    shopify_variant_id: str
    color: Optional[str] = None

# ============== PRODUCT IMAGES (PRESERVED) ==============

DROP_IMAGES = {
    1: "https://customer-assets.emergentagent.com/job_ookei-gallery/artifacts/fbx83g6l_hf_20260224_030822_d0691001-250d-45b6-9ce8-127ba8aa1a6e.jpeg",
    2: "https://customer-assets.emergentagent.com/job_ookei-gallery/artifacts/flx65wub_hf_20260224_030131_4fac10bd-ca25-4444-8ee1-8170ee3c78b1.jpeg",
    3: "https://customer-assets.emergentagent.com/job_ookei-gallery/artifacts/g3taax96_hf_20260224_015125_fc0187bc-f9d9-4d2f-a724-f59659874636.jpeg",
    4: "https://customer-assets.emergentagent.com/job_ookei-gallery/artifacts/b38qb6k1_hf_20260224_015433_043abdd1-26da-45aa-85d5-df15dda13ff7.png",
    5: "https://customer-assets.emergentagent.com/job_ookei-gallery/artifacts/7yzwdrd8_hf_20260224_025820_c36dd203-39f7-4af5-a90f-1c8e937eae43.png",
}

HOODIE_IMAGE = "https://customer-assets.emergentagent.com/job_ookei-gallery/artifacts/9m86ryg1_hf_20260224_035933_ebc321dd-7918-4bad-8526-67ce12ec9b8f.jpg"

# ============== DROP PRODUCTS (LIMITED T-SHIRTS) ==============

DROP_PRODUCTS = [
    {
        "id": "drop-001",
        "name": "WE KNOW YOU LOOKED",
        "slug": "we-know-you-looked",
        "productType": "drop",
        "category": "DROPS",
        "price": 299.00,
        "currency": "GTQ",
        "description": "The iconic OOKEI debut. A statement piece that speaks before you do.",
        "story": "They watched you. Now you're watching them.",
        "details": ["Heavyweight Premium Cotton", "Oversized Fit", "DTG Print", "Limited Edition", "MARA by OOKEI"],
        "images": [DROP_IMAGES[1]],
        "variants": [
            {"size": "S", "inventory": 20, "sku": "DROP01-S"},
            {"size": "M", "inventory": 50, "sku": "DROP01-M"},
            {"size": "L", "inventory": 55, "sku": "DROP01-L"},
            {"size": "XL", "inventory": 25, "sku": "DROP01-XL"}
        ],
        "total_inventory": 150,
        "max_edition": 150,
        "is_locked": False,
        "is_sold_out": False,
        "restockable": False,
        "drop_order": 1,
        "is_active": True
    },
    {
        "id": "drop-002",
        "name": "JOIN THE CULT",
        "slug": "join-the-cult",
        "productType": "drop",
        "category": "DROPS",
        "price": 299.00,
        "currency": "GTQ",
        "description": "Join the cult - buy the shirt. An invitation to belong.",
        "story": "In a world of followers, be the one who chooses.",
        "details": ["Heavyweight Premium Cotton", "Oversized Fit", "DTG Print", "Limited Edition", "MARA by OOKEI"],
        "images": [DROP_IMAGES[2]],
        "variants": [
            {"size": "S", "inventory": 20, "sku": "DROP02-S"},
            {"size": "M", "inventory": 50, "sku": "DROP02-M"},
            {"size": "L", "inventory": 55, "sku": "DROP02-L"},
            {"size": "XL", "inventory": 25, "sku": "DROP02-XL"}
        ],
        "total_inventory": 150,
        "max_edition": 150,
        "is_locked": True,
        "is_sold_out": False,
        "restockable": False,
        "drop_order": 2,
        "is_active": True
    },
    {
        "id": "drop-003",
        "name": "BEWARE OF FALSE PROPHETS",
        "slug": "beware-of-false-prophets",
        "productType": "drop",
        "category": "DROPS",
        "price": 299.00,
        "currency": "GTQ",
        "description": "Question everything. Trust your instincts.",
        "story": "The only course you need is your own path.",
        "details": ["Heavyweight Premium Cotton", "Oversized Fit", "DTG Print", "Limited Edition", "MARA by OOKEI"],
        "images": [DROP_IMAGES[3]],
        "variants": [
            {"size": "S", "inventory": 20, "sku": "DROP03-S"},
            {"size": "M", "inventory": 50, "sku": "DROP03-M"},
            {"size": "L", "inventory": 55, "sku": "DROP03-L"},
            {"size": "XL", "inventory": 25, "sku": "DROP03-XL"}
        ],
        "total_inventory": 150,
        "max_edition": 150,
        "is_locked": True,
        "is_sold_out": False,
        "restockable": False,
        "drop_order": 3,
        "is_active": True
    },
    {
        "id": "drop-004",
        "name": "BLACK STILLNESS",
        "slug": "black-stillness",
        "productType": "drop",
        "category": "DROPS",
        "price": 299.00,
        "currency": "GTQ",
        "description": "90% stillness. In the chaos, find your calm.",
        "story": "While the world rushes, we stand still.",
        "details": ["Heavyweight Premium Cotton", "Oversized Fit", "DTG Print", "Limited Edition", "MARA by OOKEI"],
        "images": [DROP_IMAGES[4]],
        "variants": [
            {"size": "S", "inventory": 20, "sku": "DROP04-S"},
            {"size": "M", "inventory": 50, "sku": "DROP04-M"},
            {"size": "L", "inventory": 55, "sku": "DROP04-L"},
            {"size": "XL", "inventory": 25, "sku": "DROP04-XL"}
        ],
        "total_inventory": 150,
        "max_edition": 150,
        "is_locked": True,
        "is_sold_out": False,
        "restockable": False,
        "drop_order": 4,
        "is_active": True
    },
    {
        "id": "drop-005",
        "name": "EYES ALWAYS WATCHING",
        "slug": "eyes-always-watching",
        "productType": "drop",
        "category": "DROPS",
        "price": 299.00,
        "currency": "GTQ",
        "description": "The eyes never sleep. Awareness is power.",
        "story": "The watchers become the watched.",
        "details": ["Heavyweight Premium Cotton", "Oversized Fit", "DTG Print", "Limited Edition", "MARA by OOKEI"],
        "images": [DROP_IMAGES[5]],
        "variants": [
            {"size": "S", "inventory": 20, "sku": "DROP05-S"},
            {"size": "M", "inventory": 50, "sku": "DROP05-M"},
            {"size": "L", "inventory": 55, "sku": "DROP05-L"},
            {"size": "XL", "inventory": 25, "sku": "DROP05-XL"}
        ],
        "total_inventory": 150,
        "max_edition": 150,
        "is_locked": True,
        "is_sold_out": False,
        "restockable": False,
        "drop_order": 5,
        "is_active": True
    }
]

# ============== BASICS PRODUCTS (ALWAYS AVAILABLE) ==============

BASICS_PRODUCTS = [
    {
        "id": "basic-hoodie-001",
        "name": "OOKEI BASIC HOODIE",
        "slug": "ookei-basic-hoodie",
        "productType": "basic",
        "category": "BASICS",
        "price": 420.00,
        "currency": "GTQ",
        "description": "Core identity. Always present. Premium heavyweight cotton hoodie.",
        "story": "Some things never go out of style.",
        "details": [
            "450 GSM Heavyweight Cotton",
            "Oversized Fit",
            "Kangaroo Pocket",
            "Ribbed Cuffs & Hem",
            "Embroidered OOKEI Logo"
        ],
        "images": [HOODIE_IMAGE],
        "variants": [
            {"size": "S", "inventory": 50, "sku": "BASIC-H-S"},
            {"size": "M", "inventory": 50, "sku": "BASIC-H-M"},
            {"size": "L", "inventory": 50, "sku": "BASIC-H-L"},
            {"size": "XL", "inventory": 50, "sku": "BASIC-H-XL"}
        ],
        "color_variants": [
            {
                "color": "Black",
                "color_code": "#000000",
                "image": HOODIE_IMAGE,
                "sizes": [
                    {"size": "S", "inventory": 50, "sku": "BASIC-H-BLK-S"},
                    {"size": "M", "inventory": 50, "sku": "BASIC-H-BLK-M"},
                    {"size": "L", "inventory": 50, "sku": "BASIC-H-BLK-L"},
                    {"size": "XL", "inventory": 50, "sku": "BASIC-H-BLK-XL"}
                ]
            },
            {
                "color": "Brown",
                "color_code": "#5C4033",
                "image": HOODIE_IMAGE,
                "sizes": [
                    {"size": "S", "inventory": 50, "sku": "BASIC-H-BRN-S"},
                    {"size": "M", "inventory": 50, "sku": "BASIC-H-BRN-M"},
                    {"size": "L", "inventory": 50, "sku": "BASIC-H-BRN-L"},
                    {"size": "XL", "inventory": 50, "sku": "BASIC-H-BRN-XL"}
                ]
            },
            {
                "color": "Off White",
                "color_code": "#FAF9F6",
                "image": HOODIE_IMAGE,
                "sizes": [
                    {"size": "S", "inventory": 50, "sku": "BASIC-H-OFW-S"},
                    {"size": "M", "inventory": 50, "sku": "BASIC-H-OFW-M"},
                    {"size": "L", "inventory": 50, "sku": "BASIC-H-OFW-L"},
                    {"size": "XL", "inventory": 50, "sku": "BASIC-H-OFW-XL"}
                ]
            },
            {
                "color": "Navy",
                "color_code": "#0B1B3A",
                "image": HOODIE_IMAGE,
                "sizes": [
                    {"size": "S", "inventory": 50, "sku": "BASIC-H-NVY-S"},
                    {"size": "M", "inventory": 50, "sku": "BASIC-H-NVY-M"},
                    {"size": "L", "inventory": 50, "sku": "BASIC-H-NVY-L"},
                    {"size": "XL", "inventory": 50, "sku": "BASIC-H-NVY-XL"}
                ]
            }
        ],
        "total_inventory": 800,
        "max_edition": None,
        "is_locked": False,
        "is_sold_out": False,
        "restockable": True,
        "drop_order": None,
        "is_active": True
    }
]

ALL_PRODUCTS = DROP_PRODUCTS + BASICS_PRODUCTS

# ============== HELPER FUNCTIONS ==============

def calculate_drop_lock_status(products: List[dict]) -> List[dict]:
    """Calculate lock status based on previous drop inventory."""
    drops = sorted([p for p in products if p.get("productType") == "drop"], key=lambda x: x.get("drop_order", 0))
    
    for i, drop in enumerate(drops):
        if i == 0:
            drop["is_locked"] = False
        else:
            prev_drop = drops[i - 1]
            # Unlock if previous drop is sold out
            drop["is_locked"] = prev_drop.get("total_inventory", 0) > 0
        
        # Check if sold out
        drop["is_sold_out"] = drop.get("total_inventory", 0) == 0
    
    # Basics are never locked
    basics = [p for p in products if p.get("productType") == "basic"]
    for basic in basics:
        basic["is_locked"] = False
        basic["is_sold_out"] = False if basic.get("restockable") else basic.get("total_inventory", 0) == 0
    
    return drops + basics

# ============== API ENDPOINTS ==============

@api_router.get("/")
async def root():
    return {"message": "OOKEI API", "version": "3.0.0"}

@api_router.get("/products")
async def get_all_products():
    """Get all products with calculated lock status."""
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    
    if not products:
        # Seed products
        for product in ALL_PRODUCTS:
            doc = {**product, "created_at": datetime.now(timezone.utc).isoformat()}
            await db.products.insert_one(doc)
        products = ALL_PRODUCTS.copy()
    
    # Calculate lock status
    products = calculate_drop_lock_status(products)
    
    # Log verification
    drops = [p for p in products if p.get("productType") == "drop"]
    basics = [p for p in products if p.get("productType") == "basic"]
    
    logger.info(f"TOTAL_PRODUCTS: {len(products)}")
    logger.info(f"DROPS_COUNT: {len(drops)}")
    logger.info(f"BASICS_COUNT: {len(basics)}")
    
    for drop in drops:
        logger.info(f"DROP_{drop.get('drop_order'):02d}_LOCKED: {drop.get('is_locked')}")
    
    logger.info(f"BASICS_LOCKED: False")
    
    return products

@api_router.get("/products/{slug}")
async def get_product(slug: str):
    """Get a single product by slug."""
    product = await db.products.find_one({"slug": slug}, {"_id": 0})
    
    if not product:
        for p in ALL_PRODUCTS:
            if p["slug"] == slug:
                product = p.copy()
                break
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Calculate lock status for this product
    all_products = await db.products.find({}, {"_id": 0}).to_list(100)
    if not all_products:
        all_products = ALL_PRODUCTS.copy()
    
    all_products = calculate_drop_lock_status(all_products)
    
    for p in all_products:
        if p["slug"] == slug:
            return p
    
    return product

@api_router.get("/drops")
async def get_drops():
    """Get all drop products with lock status."""
    products = await db.products.find({"productType": "drop"}, {"_id": 0}).to_list(100)
    
    if not products:
        products = [p.copy() for p in DROP_PRODUCTS]
    
    all_products = await db.products.find({}, {"_id": 0}).to_list(100)
    if not all_products:
        all_products = ALL_PRODUCTS.copy()
    
    all_products = calculate_drop_lock_status(all_products)
    drops = [p for p in all_products if p.get("productType") == "drop"]
    drops.sort(key=lambda x: x.get("drop_order", 0))
    
    return drops

@api_router.get("/basics")
async def get_basics():
    """Get all basics products (always available)."""
    products = await db.products.find({"productType": "basic"}, {"_id": 0}).to_list(100)
    
    if not products:
        products = [p.copy() for p in BASICS_PRODUCTS]
    
    # Basics are never locked
    for p in products:
        p["is_locked"] = False
    
    return products

@api_router.post("/subscribe")
async def subscribe_email(request: EmailSubscribeRequest):
    """Subscribe email."""
    existing = await db.subscribers.find_one({"email": request.email})
    if existing:
        return {"success": True, "message": "Already subscribed"}
    
    doc = {
        "id": str(uuid.uuid4()),
        "email": request.email,
        "source": request.source,
        "subscribed_at": datetime.now(timezone.utc).isoformat()
    }
    await db.subscribers.insert_one(doc)
    return {"success": True, "message": "Welcome to the inner circle"}

@api_router.post("/contact")
async def submit_contact(request: ContactRequest):
    """Submit contact message."""
    doc = {
        "id": str(uuid.uuid4()),
        "name": request.name,
        "email": request.email,
        "message": request.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.contact_messages.insert_one(doc)
    return {"success": True, "message": "Message received"}

@api_router.post("/cart/add")
async def add_to_cart(request: CartAddRequest):
    """Add item to cart."""
    cart = await db.carts.find_one({"session_id": request.session_id}, {"_id": 0})
    
    if not cart:
        cart = {
            "id": str(uuid.uuid4()),
            "session_id": request.session_id,
            "items": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    
    items = cart.get("items", [])
    found = False
    for item in items:
        if (item["product_id"] == request.product_id and 
            item["size"] == request.size and
            item.get("color") == request.color):
            item["quantity"] += request.quantity
            found = True
            break
    
    if not found:
        items.append({
            "product_id": request.product_id,
            "size": request.size,
            "color": request.color,
            "quantity": request.quantity
        })
    
    cart["items"] = items
    cart["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.carts.update_one(
        {"session_id": request.session_id},
        {"$set": cart},
        upsert=True
    )
    
    return {"success": True, "cart": cart}

@api_router.get("/cart/{session_id}")
async def get_cart(session_id: str):
    """Get cart."""
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    if not cart:
        return {"items": [], "session_id": session_id}
    return cart

@api_router.put("/cart/update")
async def update_cart_item(request: CartUpdateRequest):
    """Update cart item."""
    cart = await db.carts.find_one({"session_id": request.session_id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = cart.get("items", [])
    if request.quantity <= 0:
        items = [i for i in items if not (
            i["product_id"] == request.product_id and 
            i["size"] == request.size and
            i.get("color") == request.color
        )]
    else:
        for item in items:
            if (item["product_id"] == request.product_id and 
                item["size"] == request.size and
                item.get("color") == request.color):
                item["quantity"] = request.quantity
                break
    
    cart["items"] = items
    await db.carts.update_one({"session_id": request.session_id}, {"$set": cart})
    return {"success": True, "cart": cart}

@api_router.delete("/cart/{session_id}")
async def clear_cart(session_id: str):
    """Clear cart."""
    await db.carts.delete_one({"session_id": session_id})
    return {"success": True}

# ============== SHOPIFY INTEGRATION ENDPOINTS ==============

@api_router.get("/shopify/status")
async def shopify_status():
    """Check Shopify connection status."""
    return await shopify_service.test_connection()

@api_router.get("/shopify/debug")
async def shopify_debug():
    """Debug endpoint to see raw Shopify API response."""
    config = shopify_service.get_config()
    
    # Test Storefront API
    query = """
    query {
      products(first: 10) {
        edges {
          node {
            id
            title
            handle
            tags
            productType
          }
        }
      }
    }
    """
    result = await shopify_service.execute_storefront_graphql(query)
    
    return {
        "config": {
            "store_domain": config["store_domain"],
            "api_version": config["api_version"],
            "token_prefix": config["access_token"][:10] + "..." if config["access_token"] else None
        },
        "storefront_api_response": result
    }

@api_router.get("/shopify/collection/{handle}")
async def get_shopify_collection(handle: str):
    """Fetch products from a specific Shopify collection."""
    products = await shopify_service.fetch_collection_products(handle)
    return {"collection": handle, "products": products, "count": len(products)}

@api_router.get("/shopify/products")
async def get_shopify_products():
    """Fetch all products directly from Shopify (deprecated - use /live/products)."""
    products = await shopify_service.fetch_all_products_live()
    return {"products": products, "count": len(products)}

@api_router.get("/shopify/product/{handle}")
async def get_shopify_product(handle: str):
    """Fetch a single product from Shopify by handle."""
    product = await shopify_service.fetch_product_by_handle_live(handle)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found in Shopify")
    return product

@api_router.post("/shopify/checkout")
async def create_shopify_checkout(request: ShopifyCheckoutRequest):
    """
    Create a Shopify checkout session for direct purchase.
    Used when user clicks BUY on a product.
    """
    result = await shopify_service.create_checkout_url(
        variant_id=request.variant_id,
        quantity=request.quantity
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Checkout failed"))
    
    return result

# ============== LIVE SHOPIFY DATA ENDPOINTS ==============

@api_router.get("/live/products")
async def get_live_products():
    """
    Get ALL products from Shopify with REAL-TIME inventory data.
    Includes:
    - Real inventory per size variant
    - Total remaining calculation
    - Drop unlock status
    - Checkout URLs per variant
    
    Auto-refreshes every request. Frontend should poll every 30 seconds.
    """
    products = await shopify_service.fetch_all_products_live()
    
    if not products:
        return {
            "products": [],
            "drops": [],
            "basics": [],
            "count": 0,
            "message": "No products found in Shopify"
        }
    
    # Apply drop unlock logic
    products = shopify_service.calculate_drop_unlock_status(products)
    
    # Separate drops and basics
    drops = [p for p in products if p.get("productType") == "drop"]
    basics = [p for p in products if p.get("productType") == "basic"]
    
    # Sort drops by drop_order
    drops.sort(key=lambda x: x.get("drop_order") or 999)
    
    return {
        "products": products,
        "drops": drops,
        "basics": basics,
        "count": len(products),
        "drops_count": len(drops),
        "basics_count": len(basics),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/live/drops")
async def get_live_drops():
    """
    Get DROP products only from Shopify with real-time inventory.
    Includes drop unlock status based on previous drop inventory.
    """
    products = await shopify_service.fetch_all_products_live()
    
    if not products:
        return {"drops": [], "count": 0}
    
    # Apply unlock logic
    products = shopify_service.calculate_drop_unlock_status(products)
    
    # Filter to drops only
    drops = [p for p in products if p.get("productType") == "drop"]
    drops.sort(key=lambda x: x.get("drop_order") or 999)

    # Fallback: if no products are tagged as DROP yet, show all products as drops.
    # This avoids an empty storefront when the merchant hasn't set productType/tags.
    if not drops and products:
        drops = products
        drops.sort(key=lambda x: x.get(\"drop_order\") or 999)
    
    return {
        "drops": drops,
        "count": len(drops),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/live/basics")
async def get_live_basics():
    """Get BASICS products from Shopify with real-time inventory."""
    products = await shopify_service.fetch_all_products_live()
    
    if not products:
        return {"basics": [], "count": 0}
    
    basics = [p for p in products if p.get("productType") == "basic"]
    
    return {
        "basics": basics,
        "count": len(basics),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/live/product/{handle}")
async def get_live_product(handle: str):
    """
    Get a single product from Shopify with real-time inventory.
    Returns full variant details with inventory per size.
    """
    product = await shopify_service.fetch_product_by_handle_live(handle)
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found in Shopify")
    
    # Get all products to calculate unlock status
    all_products = await shopify_service.fetch_all_products_live()
    all_products = shopify_service.calculate_drop_unlock_status(all_products)
    
    # Find this product in the list to get unlock status
    for p in all_products:
        if p.get("handle") == handle or p.get("slug") == handle:
            return {
                "product": p,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    return {
        "product": product,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@api_router.post("/checkout")
async def checkout(request: CartCheckoutRequest):
    """
    Process cart checkout via Shopify Storefront API.
    Converts cart items to Shopify checkout.
    """
    cart = await db.carts.find_one({"session_id": request.session_id}, {"_id": 0})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Build line items for Shopify checkout
    line_items = []
    
    for item in cart["items"]:
        product_id = item["product_id"]
        size = item["size"]
        color = item.get("color")
        quantity = item["quantity"]
        
        # Find the product to get Shopify variant ID
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
        if not product:
            continue
        
        # Look for the variant with matching size/color
        shopify_variant_id = None
        
        # Check shopify_variants first if available
        if "shopify_variants" in product:
            for v in product["shopify_variants"]:
                if v.get("size") == size:
                    if color:
                        if v.get("color") == color:
                            shopify_variant_id = v["shopify_variant_id"]
                            break
                    else:
                        shopify_variant_id = v["shopify_variant_id"]
                        break
        
        # Fallback to variants array
        if not shopify_variant_id and "variants" in product:
            for v in product["variants"]:
                if v.get("size") == size and "shopify_variant_id" in v:
                    shopify_variant_id = v["shopify_variant_id"]
                    break
        
        if shopify_variant_id:
            line_items.append({
                "variantId": shopify_variant_id,
                "quantity": quantity
            })
    
    if not line_items:
        raise HTTPException(
            status_code=400, 
            detail="No valid Shopify variants found. Products may not be synced with Shopify."
        )
    
    # Create Shopify checkout using cart URL
    result = await shopify_service.create_cart_checkout(line_items)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Checkout failed"))
    
    # Clear cart after successful checkout creation
    await db.carts.delete_one({"session_id": request.session_id})
    
    return result

@api_router.post("/sync-shopify")
async def sync_shopify_products():
    """
    Sync products from Shopify to local database.
    Maps Shopify products to OOKEI product structure.
    """
    # Fetch products from Shopify
    shopify_products = await shopify_service.fetch_all_products_live()
    
    if not shopify_products:
        return {
            "success": False,
            "message": "No products found in Shopify or connection failed",
            "synced": 0
        }
    
    synced_count = 0
    
    for sp in shopify_products:
        # Try to match with existing OOKEI product by slug/handle
        existing = await db.products.find_one({"slug": sp["handle"]}, {"_id": 0})
        
        if existing:
            # Update existing product with Shopify data
            update_data = {
                "shopify_id": sp["shopify_id"],
                "shopify_variants": sp.get("shopify_variants", []),
                "available_for_sale": sp.get("available_for_sale", True),
                "total_inventory": sp.get("total_inventory", 0),
                "is_sold_out": sp.get("is_sold_out", False),
                "synced_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Update images if Shopify has them
            if sp.get("images"):
                update_data["images"] = sp["images"]
            
            # Update price from Shopify
            if sp.get("price"):
                update_data["price"] = sp["price"]
            
            await db.products.update_one(
                {"slug": sp["handle"]},
                {"$set": update_data}
            )
            synced_count += 1
            logger.info(f"Synced existing product: {sp['handle']}")
        else:
            # Create new product from Shopify
            new_product = {
                **sp,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "synced_at": datetime.now(timezone.utc).isoformat()
            }
            await db.products.insert_one(new_product)
            synced_count += 1
            logger.info(f"Created new product from Shopify: {sp['handle']}")
    
    return {
        "success": True,
        "message": f"Synced {synced_count} products from Shopify",
        "synced": synced_count,
        "total_shopify_products": len(shopify_products)
    }

@api_router.post("/link-shopify-variant")
async def link_shopify_variant(request: LinkShopifyVariantRequest):
    """
    Manually link a local product variant to a Shopify variant ID.
    Used when products need to be manually mapped to Shopify.
    """
    product = await db.products.find_one({"slug": request.product_slug}, {"_id": 0})
    
    if not product:
        raise HTTPException(status_code=404, detail=f"Product '{request.product_slug}' not found")
    
    # Update the variant with Shopify ID
    variants = product.get("variants", [])
    shopify_variants = product.get("shopify_variants", [])
    
    # Find and update the matching variant
    variant_updated = False
    for v in variants:
        if v.get("size") == request.size:
            v["shopify_variant_id"] = request.shopify_variant_id
            variant_updated = True
            break
    
    # Add to shopify_variants if not already there
    existing_sv = next((sv for sv in shopify_variants if sv.get("size") == request.size), None)
    if existing_sv:
        existing_sv["shopify_variant_id"] = request.shopify_variant_id
    else:
        shopify_variants.append({
            "shopify_variant_id": request.shopify_variant_id,
            "size": request.size,
            "color": request.color,
            "available": True,
            "quantity_available": 0
        })
    
    # Update in database
    await db.products.update_one(
        {"slug": request.product_slug},
        {"$set": {
            "variants": variants,
            "shopify_variants": shopify_variants,
            "linked_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "success": True,
        "message": f"Linked variant {request.size} to Shopify variant {request.shopify_variant_id}",
        "product_slug": request.product_slug
    }

@api_router.get("/product-variants/{slug}")
async def get_product_variants(slug: str):
    """Get all variants for a product including Shopify IDs."""
    product = await db.products.find_one({"slug": slug}, {"_id": 0})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {
        "product_slug": slug,
        "product_name": product.get("name"),
        "variants": product.get("variants", []),
        "shopify_variants": product.get("shopify_variants", [])
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    """Initialize database with products."""
    await db.products.delete_many({})
    for product in ALL_PRODUCTS:
        doc = {**product, "created_at": datetime.now(timezone.utc).isoformat()}
        await db.products.insert_one(doc)
    
    # Log verification
    logger.info("=" * 50)
    logger.info("OOKEI STORE INITIALIZED")
    logger.info(f"TOTAL_PRODUCTS: {len(ALL_PRODUCTS)}")
    logger.info(f"DROPS_COUNT: {len(DROP_PRODUCTS)}")
    logger.info(f"BASICS_COUNT: {len(BASICS_PRODUCTS)}")
    for drop in DROP_PRODUCTS:
        logger.info(f"DROP_{drop['drop_order']:02d}_LOCKED: {drop['is_locked']}")
    logger.info("BASICS_LOCKED: False")
    logger.info("=" * 50)

@app.on_event("shutdown")
async def shutdown():
    client.close()
