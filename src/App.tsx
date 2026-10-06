import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Play,
  Search,
  ShoppingCart,
  Menu,
  X,
  ChevronLeft,
  Eye,
  Star,
  Loader2,
} from 'lucide-react'
import { supabase } from './lib/supabase'
import Admin from './Admin'
import './index.css'

type Product = {
  id: string
  title: string
  description: string | null
  price: number
  image_url: string | null
  video_url: string | null
  checkout_url: string | null
  button_text: string | null
  active: boolean
  views: number
  clicks: number
  created_at: string
}

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    loadProducts()

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setLoggedIn(true)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProducts() {
    setLoading(true)

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao carregar produtos:', error)
      setProducts([])
    } else {
      setProducts(data || [])
    }

    setLoading(false)
  }

  async function registerView(product: Product) {
    await supabase.from('product_views').insert({
      product_id: product.id,
    })

    await supabase
      .from('products')
      .update({ views: (product.views || 0) + 1 })
      .eq('id', product.id)

    setProducts((current) =>
      current.map((item) =>
        item.id === product.id
          ? { ...item, views: (item.views || 0) + 1 }
          : item
      )
    )
  }

  function openProduct(product: Product) {
    setSelectedProduct(product)
    registerView(product)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function buy(product: Product) {
    await supabase.from('product_clicks').insert({
      product_id: product.id,
    })

    await supabase
      .from('products')
      .update({ clicks: (product.clicks || 0) + 1 })
      .eq('id', product.id)

    window.open('https://checkout.escalepay.com/1493985', '_blank')
  }

  async function logout() {
    await supabase.auth.signOut()
    setLoggedIn(false)
    setAdmin(false)
  }

  if (location.pathname === '/admin' || admin) {
    return (
      <Admin
        loggedIn={loggedIn}
        onLogin={() => setLoggedIn(true)}
        onBack={() => {
          setAdmin(false)
          navigate('/')
        }}
        onLogout={logout}
      />
    )
  }

  if (selectedProduct) {
    return (
      <div className="app">
        <header className="header">
          <div className="container header-inner">
            <button
              className="logo"
              onClick={() => setSelectedProduct(null)}
            >
              HOT<span>FLIX</span>
            </button>

            <button
              className="back-button"
              onClick={() => setSelectedProduct(null)}
            >
              <ChevronLeft size={20} />
              Voltar
            </button>

          </div>
        </header>

        <main className="container product-page">
          <div className="product-video">
            {selectedProduct.video_url ? (
              <video
                src={selectedProduct.video_url}
                controls
                playsInline
                preload="metadata"
                controlsList="nodownload"
                style={{
                  width: '100%',
                  maxHeight: '75vh',
                  display: 'block',
                  background: '#000',
                  borderRadius: '12px',
                }}
              />
            ) : (
              <div className="video-placeholder">
                <Play size={58} />
                <span>Prévia do produto</span>
              </div>
            )}
          </div>

          <div className="product-info">
            <h1>{selectedProduct.title}</h1>

            <div className="product-stats">
              <span>
                <Eye size={17} />
                {(selectedProduct.views || 0).toLocaleString()} visualizações
              </span>

              <span>
                <Star size={17} />
                4.9
              </span>
            </div>

            <p className="product-description">
              {selectedProduct.description || 'Sem descrição disponível.'}
            </p>

            <div className="purchase-box">
              <div>
                <small>Preço</small>
                <strong>
                  {Number(selectedProduct.price).toLocaleString('pt-MZ')} MT
                </strong>
              </div>

              <button
                className="buy-button"
                onClick={() => buy(selectedProduct)}
              >
                <ShoppingCart size={20} />
                {selectedProduct.button_text || 'Comprar agora'}
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="app">
      <header className="header">
        <div className="container header-inner">
          <button className="logo">
            HOT<span>FLIX</span>
          </button>

          <nav className={menuOpen ? 'nav open' : 'nav'}>
            <a href="#inicio" onClick={() => setMenuOpen(false)}>
              Início
            </a>
            <a href="#produtos" onClick={() => setMenuOpen(false)}>
              Produtos
            </a>
          </nav>

          <div className="header-actions">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>


            <button
              className="menu-button"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      <section className="hero" id="inicio">
        <div className="container hero-content">
          <div className="hero-text">
            <span className="hero-label">CONTEÚDOS PREMIUM</span>

            <h1>
              Conteúdo.
              <br />
              <span>Exclusivo.</span>
              <br />
              Sem limites.
            </h1>

            <p>
              Descubra conteúdos exclusivos, previews e experiências
              premium em um só lugar.
            </p>

            <a href="#produtos" className="hero-button">
              Explorar conteúdo
              <ChevronLeft size={20} className="rotate-180" />
            </a>
          </div>
        </div>
      </section>

      <section className="complete-access-section">
  <div className="complete-access-card">
    <div className="complete-access-content">
      <span className="complete-access-label">👑 OFERTA VIP</span>

      <h2>Acesso Completo</h2>

      <p>
        Tenha acesso a todos os conteúdos premium disponíveis no HOTFLIX
        em uma única compra.
      </p>

      <div className="complete-access-benefits">
        <span>✓ Todos os conteúdos</span>
        <span>✓ Acesso completo</span>
        <span>✓ Compra única</span>
      </div>

      <div className="complete-access-price">
        <strong>R$ 497,00</strong>
        <span>acesso completo</span>
      </div>

      <button
        className="complete-access-button"
        onClick={() => window.open("https://checkout.escalepay.com/9996372", "_blank")}
      >
        Liberar acesso completo
      </button>
    </div>
  </div>
</section>

<main className="container products-section" id="produtos">
        <div className="section-heading">
          <div>
            <span className="section-label">CATÁLOGO</span>
            <h2>Conteúdos exclusivos</h2>
          </div>

          <span className="product-count">
            {products.length} conteúdos
          </span>
        </div>

        {loading ? (
          <div className="loading">
            <Loader2 size={32} className="spinner" />
            <p>Carregando conteúdos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty">
            <Play size={42} />
            <h3>Nenhum conteúdo encontrado</h3>
            <p>
              {products.length === 0
                ? 'Ainda não existem conteúdos publicados.'
                : 'Tente pesquisar por outro nome.'}
            </p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <article
                className="product-card"
                key={product.id}
                onClick={() => openProduct(product)}
              >
                <div className="product-image">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} />
                  ) : product.video_url ? (
                    <video
                      src={product.video_url}
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <div className="image-placeholder">
                      <Play size={42} />
                    </div>
                  )}

                  <div className="play-overlay">
                    <Play size={28} fill="currentColor" />
                  </div>
                </div>

                <div className="card-content">
                  <div className="card-stats">
                    <span>
                      <Eye size={15} />
                      {(product.views || 0).toLocaleString()}
                    </span>

                    <span>
                      <Star size={15} />
                      4.9
                    </span>
                  </div>

                  <h3>{product.title}</h3>

                  <p>
                    {product.description || 'Conteúdo digital premium.'}
                  </p>

                  <div className="card-bottom">
                    <strong>
                      {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                    </strong>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        buy(product)
                      }}
                    >
                      <ShoppingCart size={17} />
                      'Desbloquear'
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-logo">
            HOT<span>FLIX</span>
          </div>

          <p>
            Conteúdos digitais para quem quer aprender, crescer e vender.
          </p>

          <small>
            © {new Date().getFullYear()} HOTFLIX. Todos os direitos reservados.
          </small>
        </div>
      </footer>
    </div>
  )
}

export default App
