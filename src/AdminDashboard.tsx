import { useEffect, useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Power,
  Eye,
  MousePointerClick,
  Save,
  X,
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

type AdminDashboardProps = {
  onLogout: () => void
}

const emptyForm = {
  title: '',
  description: '',
  price: '',
  image_url: '',
  video_url: '',
  checkout_url: '',
  button_text: 'Comprar agora',
  active: true,
}

export default function AdminDashboard({
  onLogout,
}: AdminDashboardProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState('')

  async function loadProducts() {
    setLoading(true)

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage('Erro ao carregar produtos: ' + error.message)
    } else {
      setProducts(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  function updateField(
    field: keyof typeof emptyForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setMessage('')
    setShowForm(true)
  }

  function openEdit(product: Product) {
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

    setMessage('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault()

    if (!form.title.trim()) {
      setMessage('Digite o nome do produto.')
      return
    }

    setSaving(true)
    setMessage('')

    const productData = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: Number(form.price) || 0,
      image_url: form.image_url.trim(),
      video_url: form.video_url.trim(),
      checkout_url: form.checkout_url.trim(),
      button_text: form.button_text.trim() || 'Comprar agora',
      active: form.active,
    }

    if (editingId) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingId)

      if (error) {
        setMessage('Erro ao atualizar: ' + error.message)
        setSaving(false)
        return
      }

      setMessage('Produto atualizado com sucesso.')
    } else {
      const { error } = await supabase
        .from('products')
        .insert(productData)

      if (error) {
        setMessage('Erro ao cadastrar: ' + error.message)
        setSaving(false)
        return
      }

      setMessage('Produto cadastrado com sucesso.')
    }

    setSaving(false)
    closeForm()
    await loadProducts()
  }

  async function deleteProduct(id: string) {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir este produto?'
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage('Erro ao excluir: ' + error.message)
      return
    }

    setMessage('Produto excluído com sucesso.')
    await loadProducts()
  }

  async function toggleProduct(product: Product) {
    const { error } = await supabase
      .from('products')
      .update({
        active: !product.active,
      })
      .eq('id', product.id)

    if (error) {
      setMessage('Erro ao alterar status: ' + error.message)
      return
    }

    await loadProducts()
  }

  const totalViews = products.reduce(
    (total, product) => total + (product.views || 0),
    0
  )

  const totalClicks = products.reduce(
    (total, product) => total + (product.clicks || 0),
    0
  )

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div>
          <div className="admin-logo">
            HOT<span>FLIX</span>
          </div>

          <p>Painel administrativo</p>
        </div>

        <button className="admin-logout" onClick={onLogout}>
          Sair
        </button>
      </header>

      <main className="admin-content">
        <div className="admin-dashboard-top">
          <div>
            <h1>Produtos</h1>
            <p>Gerencie os produtos publicados no HOTFLIX.</p>
          </div>

          <button
            className="admin-primary-button"
            onClick={openCreate}
          >
            <Plus size={19} />
            Novo produto
          </button>
        </div>

        <div className="admin-stats">
          <div className="admin-stat">
            <strong>{products.length}</strong>
            <span>Produtos</span>
          </div>

          <div className="admin-stat">
            <strong>{totalViews}</strong>
            <span>Visualizações</span>
          </div>

          <div className="admin-stat">
            <strong>{totalClicks}</strong>
            <span>Cliques</span>
          </div>
        </div>

        {message && (
          <div className="admin-message">
            {message}
          </div>
        )}

        {showForm && (
          <div className="admin-form-card">
            <div className="admin-form-header">
              <div>
                <h2>
                  {editingId
                    ? 'Editar produto'
                    : 'Cadastrar produto'}
                </h2>

                <p>
                  Preencha as informações do produto.
                </p>
              </div>

              <button
                className="admin-close-button"
                onClick={closeForm}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveProduct}>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <label>Nome do produto</label>

                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      updateField('title', e.target.value)
                    }
                    placeholder="Ex: Curso de Arbitragem USDT"
                    required
                  />
                </div>

                <div className="admin-field">
                  <label>Preço</label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      updateField('price', e.target.value)
                    }
                    placeholder="5000"
                  />
                </div>
              </div>

              <div className="admin-field">
                <label>Descrição</label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    updateField('description', e.target.value)
                  }
                  placeholder="Descrição do produto..."
                  rows={4}
                />
              </div>

              <div className="admin-form-grid">
                <div className="admin-field">
                  <label>URL da capa</label>

                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(e) =>
                      updateField('image_url', e.target.value)
                    }
                    placeholder="https://..."
                  />
                </div>

                <div className="admin-field">
                  <label>URL do vídeo</label>

                  <input
                    type="url"
                    value={form.video_url}
                    onChange={(e) =>
                      updateField('video_url', e.target.value)
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="admin-field">
                <label>Link do checkout</label>

                <input
                  type="url"
                  value={form.checkout_url}
                  onChange={(e) =>
                    updateField('checkout_url', e.target.value)
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="admin-field">
                <label>Texto do botão</label>

                <input
                  type="text"
                  value={form.button_text}
                  onChange={(e) =>
                    updateField('button_text', e.target.value)
                  }
                  placeholder="Comprar agora"
                />
              </div>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    updateField('active', e.target.checked)
                  }
                />

                <span>Produto ativo e visível no catálogo</span>
              </label>

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={closeForm}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="admin-primary-button"
                  disabled={saving}
                >
                  <Save size={18} />
                  {saving ? 'Salvando...' : 'Salvar produto'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="admin-products">
          {loading ? (
            <div className="admin-empty">
              Carregando produtos...
            </div>
          ) : products.length === 0 ? (
            <div className="admin-empty">
              <h3>Nenhum produto cadastrado</h3>
              <p>Clique em “Novo produto” para começar.</p>
            </div>
          ) : (
            products.map((product) => (
              <div className="admin-product-card" key={product.id}>
                <div className="admin-product-image">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                    />
                  ) : (
                    <div>HOTFLIX</div>
                  )}
                </div>

                <div className="admin-product-info">
                  <div className="admin-product-title-row">
                    <h3>{product.title}</h3>

                    <span
                      className={
                        product.active
                          ? 'admin-status active'
                          : 'admin-status inactive'
                      }
                    >
                      {product.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <p>
                    {product.description ||
                      'Sem descrição cadastrada.'}
                  </p>

                  <strong>
                    {Number(product.price).toLocaleString('pt-MZ')} MT
                  </strong>

                  <div className="admin-product-metrics">
                    <span>
                      <Eye size={16} />
                      {product.views || 0} visualizações
                    </span>

                    <span>
                      <MousePointerClick size={16} />
                      {product.clicks || 0} cliques
                    </span>
                  </div>
                </div>

                <div className="admin-product-actions">
                  <button
                    onClick={() => openEdit(product)}
                    title="Editar"
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    onClick={() => toggleProduct(product)}
                    title={
                      product.active
                        ? 'Desativar'
                        : 'Ativar'
                    }
                  >
                    <Power size={18} />
                  </button>

                  <button
                    className="danger"
                    onClick={() => deleteProduct(product.id)}
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
