import { useEffect, useState, type FormEvent } from 'react'
import {
  LogIn,
  Lock,
  Mail,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Eye,
  MousePointerClick,
  Power,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react'
import { supabase } from './lib/supabase'

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

type AdminProps = {
  loggedIn: boolean
  onLogin: () => void
  onBack: () => void
  onLogout: () => void
}

const emptyForm = {
  title: '',
  description: '',
  price: '127',
  image_url: '',
  video_url: '',
  checkout_url: '',
  button_text: 'Comprar agora',
  active: true,
}

export default function Admin({
  loggedIn,
  onLogin,
  onBack,
  onLogout,
}: AdminProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [error, setError] = useState('')

  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (loggedIn) {
      loadProducts()
    }
  }, [loggedIn])

  async function handleLogin(e: FormEvent) {
    e.preventDefault()

    setLoginLoading(true)
    setError('')

    if (email === 'machelbarros1919@gmail.com' && password === '1234') {
      setLoginLoading(false)
      onLogin()
      return
    }

    setError('E-mail ou senha incorretos.')
    setLoginLoading(false)
  }

  async function loadProducts() {
    setLoadingProducts(true)
    setError('')

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setError(`Erro ao carregar conteúdos: ${error.message}`)
      setProducts([])
    } else {
      setProducts(data || [])
    }

    setLoadingProducts(false)
  }

  function openNewProduct() {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
    setError('')
  }

  function openEditProduct(product: Product) {
    setEditingId(product.id)

    setForm({
      title: product.title || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      image_url: product.image_url || '',
      video_url: product.video_url || '',
      checkout_url: product.checkout_url || '',
      button_text: product.button_text || 'Comprar agora',
      active: product.active,
    })

    setShowForm(true)
    setError('')
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleVideoUpload(file: File) {
    if (!file) return

    if (!file.type.startsWith('video/')) {
      setError('Selecione um arquivo de vídeo válido.')
      return
    }

    const maxSize = 500 * 1024 * 1024

    if (file.size > maxSize) {
      setError('O vídeo não pode ultrapassar 500 MB.')
      return
    }

    setUploadingVideo(true)
    setError('')

    const extension = file.name.split('.').pop() || 'mp4'
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('video')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      console.error(uploadError)
      setError(`Erro ao carregar vídeo: ${uploadError.message}`)
      setUploadingVideo(false)
      return
    }

    const { data } = supabase.storage
      .from('video')
      .getPublicUrl(fileName)

    setForm((current) => ({
      ...current,
      video_url: data.publicUrl,
    }))

    setUploadingVideo(false)
  }

  async function saveProduct(e: FormEvent) {
    e.preventDefault()

    if (!form.title.trim()) {
      setError('Digite o nome do conteúdo.')
      return
    }

    if (!form.title.trim()) {
      setError('Digite o nome do conteúdo.')
      return
    }

    setSaving(true)
    setError('')

    const productData = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      price: 127,
      image_url: form.image_url.trim() || null,
      video_url: form.video_url.trim() || null,
      checkout_url: 'https://checkout.escalepay.com/1493985',
      button_text: 'Desbloquear',
      active: form.active,
    }

    if (editingId) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingId)

      if (error) {
        console.error(error)
        setError(`Erro ao atualizar: ${error.message}`)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert(productData)

      if (error) {
        console.error(error)
        setError(`Erro ao cadastrar: ${error.message}`)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    closeForm()
    await loadProducts()
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir "${product.title}"?`
    )

    if (!confirmed) return

    setError('')

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id)

    if (error) {
      console.error(error)
      setError(`Erro ao excluir: ${error.message}`)
      return
    }

    await loadProducts()
  }

  async function toggleProduct(product: Product) {
    setError('')

    const { error } = await supabase
      .from('products')
      .update({ active: !product.active })
      .eq('id', product.id)

    if (error) {
      console.error(error)
      setError(`Erro ao alterar status: ${error.message}`)
      return
    }

    await loadProducts()
  }

  if (!loggedIn) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <button className="admin-back" onClick={onBack}>
            ← Voltar ao HOTFLIX
          </button>

          <div className="admin-logo">
            HOT<span>FLIX</span>
          </div>

          <div className="admin-login-title">
            <Lock size={28} />
            <h1>Área administrativa</h1>
            <p>Entre para gerenciar seus conteúdos.</p>
          </div>

          <form onSubmit={handleLogin}>
            <label>E-mail</label>

            <div className="admin-input">
              <Mail size={18} />
              <input
                type="email"
                placeholder="admin@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <label>Senha</label>

            <div className="admin-input">
              <Lock size={18} />
              <input
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="admin-error">{error}</div>}

            <button
              className="admin-login-button"
              type="submit"
              disabled={loginLoading}
            >
              <LogIn size={19} />
              {loginLoading ? 'Entrando...' : 'Entrar no ADM'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const totalViews = products.reduce(
    (total, product) => total + (product.views || 0),
    0
  )

  const totalClicks = products.reduce(
    (total, product) => total + (product.clicks || 0),
    0
  )

  const activeProducts = products.filter((product) => product.active).length

  const clickRate =
    totalViews > 0
      ? ((totalClicks / totalViews) * 100).toFixed(1)
      : '0.0'

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-brand">
            HOT<span>FLIX</span>
            <small>ADMIN</small>
          </div>

          <button className="admin-logout" onClick={onLogout}>
            <ArrowLeft size={18} />
            Sair
          </button>
        </div>
      </header>

      <main className="container admin-main">
        <div className="admin-title">
          <div>
            <span className="section-label">HOTFLIX • ADMIN</span>
            <h1>Painel de controle</h1>
            <p>Gerencie conteúdos, previews e desempenho da plataforma.</p>
          </div>

          <div className="admin-title-actions">
            <button
              className="admin-refresh"
              onClick={loadProducts}
              disabled={loadingProducts}
            >
              <RefreshCw
                size={18}
                className={loadingProducts ? 'spinner' : ''}
              />
            </button>

            <button className="admin-add-button" onClick={openNewProduct}>
              <Plus size={19} />
              Novo conteúdo
            </button>
          </div>
        </div>

        <div className="admin-stats">
          <div className="admin-stat">
            <strong>{products.length}</strong>
            <span>Total de conteúdos</span>
          </div>

          <div className="admin-stat">
            <strong>{activeProducts}</strong>
            <span>Conteúdos ativos</span>
          </div>

          <div className="admin-stat">
            <strong>{totalViews.toLocaleString()}</strong>
            <span>Visualizações</span>
          </div>

          <div className="admin-stat">
            <strong>{totalClicks.toLocaleString()}</strong>
            <span>Cliques</span>
          </div>

          <div className="admin-stat admin-stat-highlight">
            <strong>{clickRate}%</strong>
            <span>Taxa de conversão</span>
          </div>
        </div>

        {error && <div className="admin-error admin-error-global">{error}</div>}

        {showForm && (
          <div className="admin-form-card">
            <div className="admin-form-header">
              <div>
                <span className="section-label">
                  {editingId ? 'EDITAR' : 'NOVO CONTEÚDO'}
                </span>
                <h2>
                  {editingId ? 'Editar conteúdo' : 'Cadastrar conteúdo'}
                </h2>
              </div>

              <button className="admin-close" onClick={closeForm}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={saveProduct}>
              <div className="admin-form-grid">
                <div className="admin-field admin-field-full">
                  <label>Nome do conteúdo *</label>
                  <input
                    type="text"
                    placeholder="Ex.: Método Venda Rápida"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="admin-field">
                  <label>Preço do conteúdo</label>
                  <div className="admin-fixed-price">
                    R$ 127,00
                  </div>
                  <input
                    type="hidden"
                    value="127"
                    readOnly
                  />
                </div>

                

                <div className="admin-field admin-field-full">
                  <label>Descrição</label>
                  <textarea
                    rows={4}
                    placeholder="Descreva o conteúdo..."
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>

                <div className="admin-field admin-field-full">
                  <label>URL da imagem</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={form.image_url}
                    onChange={(e) =>
                      setForm({ ...form, image_url: e.target.value })
                    }
                  />
                </div>

                <div className="admin-field admin-field-full">
                  <label>Prévia do conteúdo</label>

                  <div className="admin-video-upload">
                    <div className="admin-video-upload-icon">
                      <Plus size={24} />
                    </div>

                    <strong>
                      {uploadingVideo
                        ? 'Carregando vídeo...'
                        : 'Selecionar vídeo'}
                    </strong>

                    <span>
                      MP4, MOV ou outro formato de vídeo • Máx. 500 MB
                    </span>

                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleVideoUpload(file)
                      }}
                      disabled={uploadingVideo}
                    />
                  </div>

                  {uploadingVideo && (
                    <div className="admin-video-loading">
                      <RefreshCw size={15} className="spinner" />
                      Enviando vídeo para o HOTFLIX...
                    </div>
                  )}

                  {form.video_url && !uploadingVideo && (
                    <div className="admin-video-status">
                      ✓ Vídeo carregado com sucesso
                    </div>
                  )}

                  <input
                    type="url"
                    placeholder="Ou cole uma URL de vídeo..."
                    value={form.video_url}
                    onChange={(e) =>
                      setForm({ ...form, video_url: e.target.value })
                    }
                  />
                </div>

                

                <label className="admin-switch">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      setForm({ ...form, active: e.target.checked })
                    }
                  />
                  <span>Conteúdo ativo e visível no HOTFLIX</span>
                </label>
              </div>

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="admin-cancel-button"
                  onClick={closeForm}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="admin-save-button"
                  disabled={saving}
                >
                  <Save size={18} />
                  {saving
                    ? 'Salvando...'
                    : editingId
                      ? 'Salvar alterações'
                      : 'Cadastrar conteúdo'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="admin-products">
          <div className="admin-products-header">
            <div>
              <h2>Conteúdos</h2>
              <span>{products.length} cadastrados</span>
            </div>
          </div>

          {loadingProducts ? (
            <div className="admin-loading">
              <RefreshCw size={30} className="spinner" />
              <p>Carregando conteúdos...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="admin-empty">
              <Plus size={40} />
              <h3>Nenhum conteúdo cadastrado</h3>
              <p>Comece cadastrando o primeiro conteúdo.</p>

              <button onClick={openNewProduct}>
                <Plus size={18} />
                Cadastrar conteúdo
              </button>
            </div>
          ) : (
            <div className="admin-product-list">
              {products.map((product) => (
                <div className="admin-product-row" key={product.id}>
                  <div className="admin-product-thumb">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.title} />
                    ) : (
                      <span>▶</span>
                    )}
                  </div>

                  <div className="admin-product-info">
                    <h3>{product.title}</h3>

                    <p>
                      {product.description || 'Sem descrição'}
                    </p>

                    <div className="admin-product-meta">
                      <strong>
                        R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>

                      <span>
                        <Eye size={14} />
                        {(product.views || 0).toLocaleString()}
                      </span>

                      <span>
                        <MousePointerClick size={14} />
                        {(product.clicks || 0).toLocaleString()}
                      </span>

                      <span>
                        {product.video_url ? '🎬 Prévia disponível' : '○ Sem prévia'}
                      </span>
                    </div>
                  </div>

                  <div className="admin-product-status">
                    <span
                      className={
                        product.active
                          ? 'status-active'
                          : 'status-inactive'
                      }
                    >
                      {product.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="admin-product-actions">
                    <button
                      title={product.active ? 'Desativar' : 'Ativar'}
                      onClick={() => toggleProduct(product)}
                    >
                      <Power size={18} />
                    </button>

                    <button
                      title="Editar"
                      onClick={() => openEditProduct(product)}
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      title="Excluir"
                      className="delete"
                      onClick={() => deleteProduct(product)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
