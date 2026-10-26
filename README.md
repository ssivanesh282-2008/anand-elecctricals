# Anand Electricals — shop catalogue and WhatsApp checkout

A responsive React/Vite storefront for Anand Electricals, Pollachi, Tamil Nadu. Customers can search and filter products, add items to a cart, adjust cart quantities, and send a prepared order through WhatsApp. The admin area supports secure sign-in, add/edit/delete, image upload, category, price, description and hiding a product without deleting it.

The WhatsApp number is configured as `919865551358` (country code +91, without `+`). Change `VITE_SHOP_WHATSAPP` in `.env` if needed.

## Important

- Demo mode (without Supabase credentials) shows sample products. They are not your actual stock or prices.
- A working public catalogue with persistent products and admin management requires a Supabase project and the SQL setup below.
- WhatsApp checkout opens a prefilled message. Customers still press Send in WhatsApp; this website does not automatically send messages or take payments.
- The displayed total is an estimate until the shop confirms price, stock, delivery and final total.
- This starter does not provide inventory quantities, payment processing, order storage, delivery management or tax invoices.

## 1. Create a Supabase project (free tier where available)

1. Create a project at https://supabase.com and save its database password somewhere safe.
2. Open **SQL Editor** in the Supabase dashboard.
3. Open `supabase-setup.sql` from this folder, paste its contents into the SQL editor, and run it.
4. Open **Project Settings → API** (or **Connect**) and copy the project URL and publishable key. The legacy `anon` key can be used if that is what your project provides. Never use a `service_role` key in this website.
5. Copy `.env.example` to `.env` and fill in the values:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
   VITE_SHOP_WHATSAPP=919865551358
   ```

   Do not put passwords, database credentials, or Supabase secret/service-role keys in `.env` for this frontend.

## 2. Create your admin account

1. In Supabase, go to **Authentication → Users → Add user** and create your own email/password account. Do not build a public sign-up page.
2. Open **SQL Editor** and run the following, replacing the email with the exact email you used. This sets a trusted server-managed `app_metadata` role; it is not user-editable profile metadata.

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
       || '{"role":"admin"}'::jsonb
   where lower(email) = lower('YOUR_ADMIN_EMAIL');
   ```

3. Confirm one row was updated. If zero rows were updated, check the email.
4. Sign in to the website after deploying. If the user was already signed in when you changed the role, sign out and sign back in so the session receives refreshed trusted metadata.

Security model: row-level security on the products table and storage policies checks `app_metadata.role = admin`. Never use `user_metadata` for this authorization check. Never share the admin password. Enable MFA on the admin account if available.

## 3. Run locally

Install Node.js 20 LTS or later from https://nodejs.org. In this folder run:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. For a production build:

```bash
npm run build
npm run preview
```

The production files are created in `dist/`.

## 4. Deploy for free using Vercel

1. Create a GitHub account (if needed) and a new repository.
2. Upload these project files to the repository. Do not upload your `.env` file. `.env` is excluded by `.gitignore`.
3. Sign in to https://vercel.com and import the GitHub repository.
4. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
5. In Vercel project **Settings → Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SHOP_WHATSAPP`
6. Deploy. If you change environment variables, redeploy the project.
7. Open the live site on a phone and test product search, cart, WhatsApp, admin sign-in, image upload and product updates.

Free tiers and limits can change; review the current plans and usage limits at Vercel and Supabase. A custom domain is optional and may cost extra.

## 5. Use the site

- Customers browse the public catalogue, search by name/category/description and add items to the cart.
- The cart allows increasing/decreasing item counts or removing an item.
- **Proceed to WhatsApp** opens a prefilled message to the configured business number. The customer reviews it and taps Send.
- Tap **Admin** and sign in. Only an account with the trusted admin role can manage products.
- Use **Add a product**, or the pencil/trash controls on products. Uploading an image stores it in the public `product-images` bucket. Product records are saved in Supabase.
- Uncheck **Show this product in the public catalogue** to hide an item without deleting it.

## 6. Before sharing publicly

- Replace all sample products with real product names, images and prices.
- Confirm the WhatsApp number is correct and can receive messages.
- Test from a signed-out/private browser window that the catalogue is public but admin changes are blocked.
- Keep your admin email/password private and never add a service-role key to frontend variables.
- Image replacement currently uploads the new image and updates the product record; old uploaded images may remain in storage and can be removed later from Supabase Storage.
- The public image bucket is intended for non-sensitive product photos only.
