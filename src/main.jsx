
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import {
  Search, ShoppingCart, Zap, Plus, Minus, Trash2, Pencil, X,
  LogIn, LogOut, ImagePlus, ArrowRight, ShieldCheck, MapPin,
  MessageCircle, Package, Menu, Truck, Headphones, Tag, Lightbulb,
  Fan, Plug, Droplets, Heart, Phone, Store, Wrench
} from 'lucide-react';
import './style.css';

const envOk = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const supabase = envOk
  ? createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
  : null;

const WA = (
  import.meta.env.VITE_SHOP_WHATSAPP || '919865551358'
).replace(/\D/g, '');

const PHONE = '+919865551358';
const MAP_URL = 'https://share.google/4LNiEZtxgUxfR7jPo';
const money = n =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(n) || 0);

const BRANDS = [
  'Finolex', 'Crompton', 'Legrand', 'E-FAB', 'GM', 'GreatWhite',
  'Philips', 'Anchor', 'Havells', 'Fybros', 'Polar', 'Parryware'
];

const demoProducts = [
  {
    id: 'demo1',
    name: 'LED Bulb 9W',
    category: 'Lighting',
    price: 65,
    description: 'Energy-saving LED bulb for everyday use.',
    image_url: '',
    active: true
  },
  {
    id: 'demo2',
    name: 'Modular Switch',
    category: 'Switches & Sockets',
    price: 120,
    description: 'Modern switch for your home.',
    image_url: '',
    active: true
  },
  {
    id: 'demo3',
    name: 'Electrical Wire',
    category: 'Wires & Cables',
    price: 1350,
    description: 'Quality electrical wire. Confirm size and length.',
    image_url: '',
    active: true
  },
  {
    id: 'demo4',
    name: 'Ceiling Fan',
    category: 'Fans',
    price: 2299,
    description: 'Reliable ceiling fan for everyday comfort.',
    image_url: '',
    active: true
  }
];

function App() {
  const [products, setProducts] = useState(demoProducts);
  const [cart, setCart] = useState({});
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All products');
  const [cartOpen, setCartOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    category: 'Lighting',
    price: '',
    description: '',
    image_url: '',
    active: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [favorites, setFavorites] = useState([]);

  const configured = !!supabase;
  const isAdmin =
    !!session?.user?.app_metadata?.role &&
    session.user.app_metadata.role === 'admin';

  const categories = useMemo(
    () => [
      'All products',
      ...new Set(
        products
          .filter(p => p.active !== false)
          .map(p => p.category)
          .filter(Boolean)
      )
    ],
    [products]
  );

  const filtered = useMemo(
    () =>
      products.filter(
        p =>
          p.active !== false &&
          (category === 'All products' || p.category === category) &&
          `${p.name} ${p.category} ${p.description || ''}`
            .toLowerCase()
            .includes(query.toLowerCase())
      ),
    [products, category, query]
  );

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({
      product:
        products.find(p => String(p.id) === id) ||
        demoProducts.find(p => String(p.id) === id),
      qty
    }))
    .filter(x => x.product);

  const total = cartItems.reduce(
    (sum, x) => sum + Number(x.product.price) * x.qty,
    0
  );
  const count = Object.values(cart).reduce((a, b) => a + b, 0);

  const say = message => {
    setNotice(message);
    setTimeout(() => setNotice(''), 4500);
  };

  async function loadProducts() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      say('Could not load products: ' + error.message);
      return;
    }
    setProducts(data || []);
  }

  useEffect(() => {
    if (!supabase) return;

    loadProducts();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  function add(product) {
    setCart(current => ({
      ...current,
      [String(product.id)]: (current[String(product.id)] || 0) + 1
    }));
    say(`${product.name} added to cart`);
  }

  function changeQty(id, delta) {
    setCart(current => {
      const next = { ...current };
      const qty = (next[id] || 0) + delta;
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }

  function checkout() {
    if (!cartItems.length) return;

    const lines = cartItems.map(
      ({ product, qty }) =>
        `• ${product.name} x ${qty} — ${money(product.price * qty)}`
    );

    const message =
      `Hello Anand Electricals! I would like to place an order:\n\n` +
      `${lines.join('\n')}\n\n` +
      `*Estimated total: ${money(total)}*\n\n` +
      `Please confirm availability and final amount.\n` +
      `Free delivery above ₹999, subject to shop confirmation.\n` +
      `Free fan fitting: please confirm eligibility.\n\n` +
      `Name:\nDelivery address or pickup:`;

    window.open(
      `https://wa.me/${WA}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  async function login(event) {
    event.preventDefault();
    if (!supabase) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setLoading(false);

    if (error) say(error.message);
    else {
      setPassword('');
      say('Signed in. Admin access depends on your account role.');
    }
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    setEditing(null);
    say('Signed out');
  }

  function openNew() {
    setEditing('new');
    setForm({
      name: '',
      category: 'Lighting',
      price: '',
      description: '',
      image_url: '',
      active: true
    });
    setImageFile(null);
  }

  function openEdit(product) {
    setEditing(product.id);
    setForm({
      name: product.name || '',
      category: product.category || 'Lighting',
      price: String(product.price ?? ''),
      description: product.description || '',
      image_url: product.image_url || '',
      active: product.active !== false
    });
    setImageFile(null);
  }

  async function saveProduct(event) {
    event.preventDefault();

    if (!isAdmin) {
      say('Your account is not authorized as an admin.');
      return;
    }

    setLoading(true);
    let image_url = form.image_url;

    if (imageFile) {
      const ext =
        imageFile.name
          .split('.')
          .pop()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, imageFile, {
          upsert: false,
          contentType: imageFile.type
        });

      if (uploadError) {
        setLoading(false);
        return say('Image upload failed: ' + uploadError.message);
      }

      image_url = supabase.storage
        .from('product-images')
        .getPublicUrl(path).data.publicUrl;
    }

    const row = {
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      description: form.description.trim(),
      image_url,
      active: form.active
    };

    let result;

    if (editing === 'new') {
      result = await supabase.from('products').insert(row);
    } else {
      result = await supabase
        .from('products')
        .update(row)
        .eq('id', editing);
    }

    setLoading(false);

    if (result.error) return say('Save failed: ' + result.error.message);

    setEditing(null);
    await loadProducts();
    say('Product saved successfully.');
  }

  async function deleteProduct(product) {
    if (
      !isAdmin ||
      !confirm(`Delete "${product.name}"? This cannot be undone.`)
    ) {
      return;
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id);

    if (error) {
      say(error.message);
    } else {
      setCart(current => {
        const next = { ...current };
        delete next[String(product.id)];
        return next;
      });
      await loadProducts();
      say('Product deleted.');
    }
  }

  function serviceMessage(service) {
    const message =
      `Hello Anand Electricals! I would like to enquire about ${service} service.\n` +
      `Name:\nAddress/location:\nPreferred date/time:\n` +
      `Please confirm availability and charges.`;

    window.open(
      `https://wa.me/${WA}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  function toggleFavorite(id) {
    setFavorites(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id]
    );
  }

  return (
    <>
      <div className="announcement-bar">
        <span><MapPin size={15} /> Pollachi, Tamil Nadu</span>
        <span><Store size={16} /> Wholesale &amp; Retail</span>
        <span><ShieldCheck size={16} /> Original Brands</span>
        <span><Truck size={16} /> Free Delivery Above ₹999</span>
        <span><Headphones size={16} /> Expert Support</span>
        <a href={`tel:${PHONE}`}><Phone size={15} /> +91 98655 51358</a>
        <a href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer">
          <MessageCircle size={15} /> WhatsApp
        </a>
      </div>

      <header className="topbar">
        <a className="brand" href="#home" aria-label="Anand Electricals home">
          <img
            className="brand-logo"
            src="/Anand_Electricals_logo.png"
            alt="Anand Electricals logo"
          />
          <span className="brand-copy">
            <strong>ANAND</strong>
            <small>ELECTRICALS</small>
          </span>
        </a>

        <button
          className="icon-button mobile-toggle"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Toggle navigation"
        >
          <Menu />
        </button>

        <nav className={mobileMenu ? 'nav open' : 'nav'}>
          <a className="nav-home" href="#home" onClick={() => setMobileMenu(false)}>Home</a>
          <a href="#products" onClick={() => setMobileMenu(false)}>Products⌄</a>
          <a href="#brands" onClick={() => setMobileMenu(false)}>Brands</a>
          <a href="#wholesale" onClick={() => setMobileMenu(false)}>Wholesale</a>
          <a href="#services" onClick={() => setMobileMenu(false)}>Services</a>
          <a href="#about" onClick={() => setMobileMenu(false)}>About</a>
          <a href="#contact" onClick={() => setMobileMenu(false)}>Contact</a>
          <button className="nav-admin" onClick={() => {
            setAdminOpen(true);
            setMobileMenu(false);
          }}>
            <ShieldCheck size={16} /> Admin
          </button>
        </nav>

        <form
          className="header-search"
          onSubmit={event => {
            event.preventDefault();
            document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <Search size={18} />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search bulbs, switches, wires, fans..."
            aria-label="Search catalogue"
          />
          <button type="submit">Search</button>
        </form>

        <div className="top-actions">
          <button
            className="cart-button"
            onClick={() => setCartOpen(true)}
            aria-label="Open shopping cart"
          >
            <ShoppingCart size={20} />
            <span className="cart-count">{count}</span>
          </button>
          <button
            className="icon-button"
            onClick={() => setAdminOpen(true)}
            aria-label="Admin login"
          >
            <LogIn size={19} />
          </button>
        </div>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">YOUR TRUSTED ELECTRICAL STORE</span>
            <h1>
              ANAND
              <br />
              <em>ELECTRICALS</em>
            </h1>
            <p>
              Lighting, fans, switches, wires and all electrical essentials —
              original brands at competitive prices for your home, office and projects.
            </p>

            <div className="hero-highlights">
              <span><ShoppingCart /> Wholesale<br />&amp; Retail</span>
              <span><ShieldCheck /> Original<br />Brand Products</span>
              <span><Truck /> Free Delivery<br />Above ₹999</span>
              <span><Headphones /> Expert<br />Support</span>
            </div>

            <div className="hero-buttons">
              <a className="primary-btn" href="#products">
                Explore Products <ArrowRight size={19} />
              </a>
              <a
                className="whatsapp-btn"
                href={`https://wa.me/${WA}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={20} /> Order on WhatsApp
              </a>
            </div>
          </div>

          <div className="hero-art">
            <img
              className="hero-products-image"
              src="/anand-hero.png"
              alt="Electrical products including wires, ceiling fans, bulbs, switches and fittings"
            />
            <div className="hero-benefit-stack">
              <div>
                <span className="benefit-symbol"><Zap /></span>
                <span><strong>Wide Range</strong><small>Lighting · Fans · Wires</small></span>
              </div>
              <div>
                <span className="benefit-symbol"><Tag /></span>
                <span><strong>Wholesale &amp; Retail</strong><small>Competitive prices</small></span>
              </div>
              <div>
                <span className="benefit-symbol"><ShieldCheck /></span>
                <span><strong>Original Brands</strong><small>Trusted products</small></span>
              </div>
              <div>
                <span className="benefit-symbol"><Truck /></span>
                <span><strong>Local Delivery</strong><small>Pollachi &amp; nearby</small></span>
              </div>
            </div>
          </div>
        </section>

        <section id="brands" className="brand-showcase">
          <div className="brand-track">
            {[...BRANDS, ...BRANDS].map((brand, index) => (
              <div
                key={`${brand}-${index}`}
                className={`brand-tile brand-tile-${BRANDS.indexOf(brand) % 6}`}
              >
                <span>{brand}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="products" className="catalogue">
          <div className="section-heading">
            <div>
              <span className="eyebrow">OUR CATALOGUE</span>
              <h2>Our <em>Products</em></h2>
              <p>Browse our products and see prices before you order.</p>
            </div>
            <div className="product-count">
              <strong>{filtered.length.toString().padStart(2, '0')}</strong>
              <span>products shown</span>
            </div>
          </div>

          <div className="catalog-tools">
            <div className="searchbox">
              <Search size={19} />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search bulbs, switches, wires..."
                aria-label="Search products"
              />
            </div>

            <div className="category-scroll">
              {categories.map(item => {
                const icons = {
                  Lighting: <Lightbulb size={18} />,
                  Fans: <Fan size={18} />,
                  'Switches & Sockets': <Plug size={18} />,
                  'Wires & Cables': <Wrench size={18} />,
                  'Pipes & Fittings': <Package size={18} />,
                  'Water Solutions': <Droplets size={18} />
                };

                return (
                  <button
                    key={item}
                    className={category === item ? 'category active' : 'category'}
                    onClick={() => setCategory(item)}
                  >
                    {icons[item]}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {!configured && (
            <div className="setup-notice">
              <strong>Preview mode:</strong> These are sample products.
              Connect Supabase using your existing project configuration to load
              your saved catalogue and enable admin features.
            </div>
          )}

          <div className="product-grid">
            {filtered.map(product => (
              <article className="product-card" key={product.id}>
                <div className="product-image">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} loading="lazy" />
                  ) : (
                    <div className="image-placeholder">
                      <Zap size={42} />
                      <span>ANAND ELECTRICALS</span>
                    </div>
                  )}
                  <span className="product-category">{product.category}</span>
                  <button
                    className={`favorite-button ${favorites.includes(product.id) ? 'favorited' : ''}`}
                    onClick={() => toggleFavorite(product.id)}
                    aria-label="Add to favourites"
                  >
                    <Heart size={18} fill={favorites.includes(product.id) ? 'currentColor' : 'none'} />
                  </button>
                  {isAdmin && (
                    <div className="manage-buttons">
                      <button onClick={() => openEdit(product)} title="Edit product"><Pencil size={15} /></button>
                      <button onClick={() => deleteProduct(product)} title="Delete product"><Trash2 size={15} /></button>
                    </div>
                  )}
                </div>
                <div className="product-info">
                  <small className="product-brand">{product.category}</small>
                  <h3>{product.name}</h3>
                  <p>{product.description || 'Quality product for everyday needs.'}</p>
                  <div className="product-bottom">
                    <div>
                      <small>PRICE</small>
                      <strong>{money(product.price)}</strong>
                    </div>
                    <button className="add-button" onClick={() => add(product)}>
                      <ShoppingCart size={16} /> Add
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="empty-state">
              <Package size={36} />
              <h3>No products found</h3>
              <p>Try a different search or category.</p>
            </div>
          )}

          {isAdmin && (
            <button className="add-product-floating" onClick={openNew}>
              <Plus size={18} /> Add new product
            </button>
          )}
        </section>

        <section id="wholesale" className="benefits-row">
          <article><Truck /><div><strong>Free Delivery</strong><span>On orders above ₹999</span></div></article>
          <article><Tag /><div><strong>Wholesale &amp; Retail</strong><span>Best prices for all customers</span></div></article>
          <article><ShieldCheck /><div><strong>Original Brands</strong><span>Genuine products and warranty as applicable</span></div></article>
          <article><Headphones /><div><strong>Expert Support</strong><span>Get help on WhatsApp</span></div></article>
        </section>

        <section id="about" className="about-strip">
          <div className="about-symbol"><Zap size={32} fill="currentColor" /></div>
          <div>
            <span className="eyebrow">YOUR NEIGHBOURHOOD ELECTRICAL STORE</span>
            <h2>Good products. Straightforward service.</h2>
            <p>
              Visit Anand Electricals on R.R. Theatre Road, Pollachi, for
              product availability, pricing and order confirmation.
            </p>
          </div>
          <a href={MAP_URL} target="_blank" rel="noreferrer" className="outline-btn">
            <MapPin size={17} /> Get directions
          </a>
        </section>

        <section id="services" className="contact-services">
          <div className="section-heading">
            <div>
              <span className="eyebrow">HERE FOR YOUR HOME</span>
              <h2>Products, advice &amp; local service<span>.</span></h2>
              <p>Contact our team for products, orders and home-service enquiries.</p>
            </div>
          </div>

          <div className="contact-service-grid">
            <article className="contact-service-card">
              <span className="contact-service-icon"><MapPin size={23} /></span>
              <h3>Visit our shop</h3>
              <p>R.R. Theatre Road, Pollachi, Tamil Nadu 642001</p>
              <a className="primary-btn" href={MAP_URL} target="_blank" rel="noreferrer">
                <MapPin size={17} /> Get directions
              </a>
            </article>

            <article id="contact" className="contact-service-card">
              <span className="contact-service-icon"><Phone size={23} /></span>
              <h3>Call or WhatsApp</h3>
              <p>Speak with us about products, prices and orders.</p>
              <a className="primary-btn" href={`tel:${PHONE}`}>Call +91 98655 51358</a>
              <a className="outline-btn" href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer">
                <MessageCircle size={17} /> WhatsApp us
              </a>
            </article>

            <article className="contact-service-card">
              <span className="contact-service-icon"><Zap size={23} /></span>
              <h3>Electrician service</h3>
              <p>Tell us about the electrical work you need.</p>
              <button className="primary-btn" onClick={() => serviceMessage('electrician')}>
                <MessageCircle size={17} /> Request electrician
              </button>
            </article>

            <article className="contact-service-card">
              <span className="contact-service-icon"><Droplets size={23} /></span>
              <h3>Plumber service</h3>
              <p>Send your location and describe the plumbing work needed.</p>
              <button className="primary-btn" onClick={() => serviceMessage('plumber')}>
                <MessageCircle size={17} /> Request plumber
              </button>
            </article>
          </div>
          <p className="contact-disclaimer">
            Delivery coverage, fan-fitting eligibility, service availability and final charges
            are confirmed by the shop.
          </p>
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="#home">
          <img className="brand-logo footer-logo" src="/Anand_Electricals_logo.png" alt="Anand Electricals logo" />
          <span className="brand-copy"><strong>ANAND</strong><small>ELECTRICALS</small></span>
        </a>
        <p>Electrical essentials for everyday living.</p>
        <span>© {new Date().getFullYear()} Anand Electricals · Pollachi, Tamil Nadu</span>
      </footer>

      {notice && <div className="toast" role="status">{notice}</div>}

      {cartOpen && (
        <div className="overlay" onMouseDown={event => {
          if (event.target === event.currentTarget) setCartOpen(false);
        }}>
          <aside className="drawer">
            <div className="drawer-head">
              <div><span className="eyebrow">YOUR SELECTION</span><h2>Shopping cart <span>({count})</span></h2></div>
              <button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close cart"><X /></button>
            </div>

            {cartItems.length === 0 ? (
              <div className="empty-cart">
                <ShoppingCart size={46} />
                <h3>Your cart is empty</h3>
                <p>Add products to start your order.</p>
                <button className="primary-btn" onClick={() => setCartOpen(false)}>Browse products</button>
              </div>
            ) : (
              <>
                <div className="cart-lines">
                  {cartItems.map(({ product, qty }) => (
                    <div className="cart-line" key={product.id}>
                      <div className="cart-thumb">
                        {product.image_url ? <img src={product.image_url} alt="" /> : <Zap />}
                      </div>
                      <div className="cart-line-info">
                        <strong>{product.name}</strong>
                        <span>{money(product.price)} each</span>
                        <b>{money(product.price * qty)}</b>
                        <div className="qty-controls">
                          <button onClick={() => changeQty(String(product.id), -1)} aria-label="Decrease quantity"><Minus size={14} /></button>
                          <span>{qty}</span>
                          <button onClick={() => changeQty(String(product.id), 1)} aria-label="Increase quantity"><Plus size={14} /></button>
                        </div>
                      </div>
                      <button className="remove-line" onClick={() => setCart(current => {
                        const next = { ...current };
                        delete next[String(product.id)];
                        return next;
                      })} aria-label="Remove item"><Trash2 size={17} /></button>
                    </div>
                  ))}
                </div>
                <div className="cart-summary">
                  <div><span>Subtotal</span><strong>{money(total)}</strong></div>
                  <p>Final price and availability will be confirmed by the shop on WhatsApp.</p>
                  <button className="checkout-btn" onClick={checkout}>
                    <MessageCircle size={19} /> Proceed to WhatsApp <ArrowRight size={18} />
                  </button>
                  <button className="continue-btn" onClick={() => setCartOpen(false)}>Continue shopping</button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {adminOpen && (
        <div className="overlay" onMouseDown={event => {
          if (event.target === event.currentTarget) {
            setAdminOpen(false);
            setEditing(null);
          }
        }}>
          <section className="admin-modal">
            <div className="drawer-head">
              <div><span className="eyebrow">SHOP OWNER ACCESS</span><h2>Admin panel</h2></div>
              <button className="icon-button" onClick={() => {
                setAdminOpen(false);
                setEditing(null);
              }} aria-label="Close admin"><X /></button>
            </div>

            {!configured ? (
              <div className="admin-help">
                <ShieldCheck size={35} />
                <h3>Connect your shop database</h3>
                <p>Configure your existing Supabase project using your project environment variables.</p>
              </div>
            ) : !session ? (
              <form className="admin-form" onSubmit={login}>
                <p>Sign in with your shop administrator account.</p>
                <label>Email address<input type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="username" /></label>
                <label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} required autoComplete="current-password" /></label>
                <button className="checkout-btn" disabled={loading}>
                  {loading ? 'Signing in…' : <><LogIn size={18} /> Sign in securely</>}
                </button>
                <small>Admin accounts must be created in Supabase. Public sign-up is not enabled.</small>
              </form>
            ) : !isAdmin ? (
              <div className="admin-help">
                <ShieldCheck size={35} />
                <h3>Admin permission required</h3>
                <p>This account is signed in but does not have the admin role.</p>
                <button className="outline-btn" onClick={logout}><LogOut size={17} /> Sign out</button>
              </div>
            ) : (
              <div className="admin-content">
                <div className="admin-welcome">
                  <div><strong>You're signed in</strong><small>{session.user.email}</small></div>
                  <button className="outline-btn" onClick={logout}><LogOut size={16} /> Sign out</button>
                </div>
                <div className="admin-stats">
                  <div><strong>{products.length}</strong><span>Products</span></div>
                  <div><strong>{categories.length - 1}</strong><span>Categories</span></div>
                </div>
                <button className="primary-btn full" onClick={openNew}><Plus size={18} /> Add a product</button>
                <div className="admin-product-list">
                  {products.map(product => (
                    <div className="admin-product-row" key={product.id}>
                      <div className="admin-mini-image">
                        {product.image_url ? <img src={product.image_url} alt="" /> : <Zap size={18} />}
                      </div>
                      <div><strong>{product.name}</strong><small>{money(product.price)} · {product.category}</small></div>
                      <button className="icon-button" onClick={() => openEdit(product)} aria-label="Edit product"><Pencil size={17} /></button>
                      <button className="icon-button danger" onClick={() => deleteProduct(product)} aria-label="Delete product"><Trash2 size={17} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {editing !== null && (
        <div className="overlay editor-overlay" onMouseDown={event => {
          if (event.target === event.currentTarget) setEditing(null);
        }}>
          <section className="admin-modal editor-modal">
            <div className="drawer-head">
              <div><span className="eyebrow">PRODUCT MANAGEMENT</span><h2>{editing === 'new' ? 'Add product' : 'Edit product'}</h2></div>
              <button className="icon-button" onClick={() => setEditing(null)} aria-label="Close editor"><X /></button>
            </div>

            <form className="admin-form" onSubmit={saveProduct}>
              <label>Product name
                <input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required maxLength="120" placeholder="e.g. LED Bulb 9W" />
              </label>
              <div className="form-two">
                <label>Price (₹)
                  <input type="number" value={form.price} onChange={event => setForm({ ...form, price: event.target.value })} required min="0" step="0.01" />
                </label>
                <label>Category
                  <input value={form.category} onChange={event => setForm({ ...form, category: event.target.value })} required maxLength="60" placeholder="Lighting" list="categories" />
                  <datalist id="categories">
                    {categories.filter(item => item !== 'All products').map(item => <option key={item} value={item} />)}
                  </datalist>
                </label>
              </div>
              <label>Description
                <textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} rows="3" maxLength="500" placeholder="Brief product description" />
              </label>
              <label className="upload-box">
                <ImagePlus size={25} />
                <strong>{imageFile ? imageFile.name : 'Upload product image'}</strong>
                <small>JPG, PNG, WEBP — max 5 MB recommended</small>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => {
                  const file = event.target.files?.[0];
                  if (file && file.size > 5 * 1024 * 1024) {
                    say('Please choose an image smaller than 5 MB.');
                    event.target.value = '';
                    return;
                  }
                  setImageFile(file || null);
                }} />
              </label>
              {form.image_url && !imageFile && (
                <div className="current-image">
                  <img src={form.image_url} alt="Current product" />
                  <button type="button" className="text-link" onClick={() => setForm({ ...form, image_url: '' })}>Remove current image</button>
                </div>
              )}
              {imageFile && (
                <div className="current-image">
                  <img src={URL.createObjectURL(imageFile)} alt="Image preview" />
                </div>
              )}
              <label className="check-label">
                <input type="checkbox" checked={form.active} onChange={event => setForm({ ...form, active: event.target.checked })} />
                Show this product in the public catalogue
              </label>
              <div className="form-actions">
                <button type="button" className="outline-btn" onClick={() => setEditing(null)}>Cancel</button>
                <button className="checkout-btn" disabled={loading}>{loading ? 'Saving…' : 'Save product'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
