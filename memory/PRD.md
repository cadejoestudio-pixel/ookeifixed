# OOKEI Streetwear E-commerce Portal - PRD

## Project Overview
Premium streetwear e-commerce website for OOKEI brand with:
- **5 Limited T-shirt Drops** (Q299 each, 150 units per drop)
- **Core BASICS Collection** (always available - hoodie Q420)
- **LIVE Shopify Integration** for real-time inventory and checkout

## Real-Time Shopify Integration (COMPLETED)

### Live Data Features
1. **Real-time product data** from Shopify Admin API:
   - Product title, images, price, color
   - Variant sizes: S, M, L, XL only (XXL excluded)
   - `quantityAvailable` per variant
   - `checkoutUrl` per variant

2. **Size selector with real inventory**:
   ```
   S — 8 available
   M — 12 available
   L — 6 available
   XL — SOLD OUT
   ```
   Disabled sizes when `quantityAvailable = 0`

3. **Total remaining per drop**:
   ```
   totalRemaining = sum(quantityAvailable of all variants)
   Display: "23 / 150 remaining"
   ```

4. **Drop unlock logic**:
   - Drop 1 = always unlocked
   - Drop 2 = locked until Drop 1 `totalRemaining = 0`
   - Drop 3 = locked until Drop 2 `totalRemaining = 0`
   - Drop 4 = locked until Drop 3 `totalRemaining = 0`
   - Drop 5 = locked until Drop 4 `totalRemaining = 0`
   
   Locked drops show:
   - "LOCKED" badge
   - "Unlocks when previous drop sells out" message

5. **BUY button** uses `variant.checkoutUrl` from Shopify
   - Format: `https://ookey-2.myshopify.com/cart/VARIANT_ID:1`

6. **Auto-refresh every 30 seconds** (configurable)

### API Endpoints

#### Live Data Endpoints
- `GET /api/live/products` - All products with live inventory
- `GET /api/live/drops` - Drops only with unlock status
- `GET /api/live/basics` - Basics only
- `GET /api/live/product/{handle}` - Single product with full details

#### Shopify Endpoints
- `GET /api/shopify/status` - Connection status
- `POST /api/shopify/checkout` - Create checkout URL

### Product Card Display
Each card shows:
- Image
- Name
- Price (Q299 for tees, Q420 for hoodies)
- Color (if available)
- Remaining stock: "X / 150 remaining"
- Size selector with inventory per size
- BUY NOW button

### Shopify Product Setup
To add products to the portal:

1. **For DROPS**: Add tag `drop-1`, `drop-2`, `drop-3`, etc.
2. **For BASICS**: Add tag `basics`
3. **Variants**: Create S, M, L, XL sizes
4. **Inventory**: Set `inventory_quantity` per variant

### Connection Details
- **Store Domain**: ookey-2.myshopify.com
- **API Type**: Admin API (REST)
- **Token**: shpat_XXXXX (configured in .env)

## Implementation Status

### Completed ✅
- [x] Live Shopify Admin API connection
- [x] Real-time product data fetching
- [x] Size selector with live inventory display
- [x] Total remaining counter
- [x] Drop unlock logic based on inventory
- [x] BUY NOW with Shopify checkout URL
- [x] Auto-refresh every 30 seconds
- [x] Empty state handling (no products message)
- [x] REFRESH button for manual refresh
- [x] Live data hooks (useLiveProducts, useLiveDrops, useLiveBasics, useLiveProduct)
- [x] LiveProductCard component with full functionality

### User Action Required
- [ ] Add products to Shopify store
- [ ] Tag products correctly (`drop-1`, `basics`, etc.)
- [ ] Set inventory quantities per variant

### Future Tasks
- [ ] Real-time WebSocket updates (optional)
- [ ] Inventory low alerts
- [ ] Contact form submission storage
- [ ] Archive page for sold-out drops

## Tech Stack
- **Frontend**: React, Tailwind CSS, Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (for subscriptions, cart sessions)
- **E-commerce**: Shopify Admin API
- **Currency**: GTQ (Guatemalan Quetzal)

## File Structure

```
/app/
├── backend/
│   ├── server.py              # FastAPI with /api/live/* endpoints
│   └── shopify_service.py     # Shopify Admin API integration
├── frontend/
│   └── src/
│       ├── hooks/
│       │   └── useLiveShopify.js    # Live data hooks
│       ├── components/
│       │   └── LiveProductCard.js   # Real-time product card
│       ├── pages/
│       │   ├── Portal.js      # Homepage with live drops/basics
│       │   ├── Drops.js       # Drops page with live data
│       │   ├── Basics.js      # Basics page with live data
│       │   └── ProductPage.js # Product detail with live inventory
│       └── context/
│           └── CartContext.js # Cart with Shopify checkout
└── memory/
    └── PRD.md
```

---
*Last Updated: December 2025*
*Live Shopify Integration Complete*
*No mock data - 100% real Shopify data*
