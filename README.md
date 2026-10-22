# Keisha Store

A digital storefront for selling **e-books** and **e-courses** — built with React + Vite.

## Status

**Phase 1 — Design & Frontend (current):** every page is built and navigable with mock data.
**Phase 2 — Backend:** database (products, orders, customers) + real auth.
**Phase 3 — Payments:** Stripe / Paystack wired into the checkout flow.

## Run it

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`).

## Pages

| Route | Page | Notes |
|---|---|---|
| `/` | Home | Hero, feature strip, categories, bestsellers, newsletter, trust bar |
| `/shop` | Shop | Filter by type + category, sort by price/rating/popularity |
| `/product/:id` | Product detail | Description, includes list, add to cart, buy now, related items |
| `/cart` | Cart | Quantity controls, remove items, order summary |
| `/checkout` | Checkout | Contact info + payment method (demo), places a mock order |
| `/admin` | Admin | Login `admin123` → dashboard, products, orders |

## Admin dashboard

Open `/admin` (or the **Owner login** link in the footer).

- **Dashboard** — total orders, total earnings, units sold, live products, recent orders
- **Products** — add a new e-book or course (title, author, type, category, price), delete products
- **Orders** — full order list with totals and statuses

Everything the admin adds/deletes updates the storefront instantly (products live in one shared store). Cart, orders and products persist in `localStorage` until a real database replaces them in Phase 2.

## Design system

- **Palette** — Forest green `#1F3D2B`, Cream `#F8F4EE`, Gold `#C9A24B` (tokens in `src/styles/index.css`)
- **Type** — Fraunces (display serif) + Inter (UI sans)
- **Icons** — `lucide-react`, no emojis
- **Covers** — generated typographic covers (`BookCover` component), no image files needed
- Original inspo designs kept in `design/`

## Structure

```
src/
├── App.jsx              # routes: storefront chrome vs admin shell
├── main.jsx
├── styles/index.css     # full design system (tokens, components, responsive)
├── data/products.js     # seed catalog + mock orders + helpers
├── context/
│   ├── CartContext.jsx  # cart state, localStorage-persisted
│   └── AdminContext.jsx # products, orders, auth, dashboard stats
├── components/          # TopBar, Navbar, Footer, ProductCard, BookCover, Stars, Toast...
└── pages/               # Home, Shop, ProductDetail, Cart, Checkout, Admin
```
