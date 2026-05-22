import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tag, Plus, Pencil, Trash2, Search } from 'lucide-react';

import {
  getTypeArticles,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSousCategories,
  createSousCategory,
  updateSousCategory,
  deleteSousCategory,
} from '../../api/resources';

// ── CATEGORY MODAL ──────────────────────────────────────────────────────────
function CategoryFormModal({ mode, initialData, types, onClose, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({
    nomCategorie: initialData?.nomCategorie ?? initialData?.nom_categorie ?? '',
    idType: String(initialData?.idType ?? initialData?.id_type ?? ''),
    description: initialData?.description ?? '',
  });
  const [errors, setErrors] = useState({});

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleSave() {
    const nextErrors = {};
    if (!form.nomCategorie.trim()) nextErrors.nomCategorie = 'Ce champ est requis.';
    if (!form.idType) nextErrors.idType = "Veuillez choisir un type d'article.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      nomCategorie: form.nomCategorie.trim(),
      idType: Number(form.idType),
      description: form.description.trim(),
    };

    await onSubmit?.(payload, { setErrors });
  }

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 600 }}>
          {mode === 'create' ? 'Nouvelle catégorie' : 'Modifier catégorie'}
        </h3>

        <div style={{ display: 'grid', gap: 14 }}>
          <label style={labelStyle}>
            Nom de la catégorie
            <input
              style={inputStyle}
              placeholder="Ex: Matériel de Bureau"
              value={form.nomCategorie}
              onChange={(e) => setField('nomCategorie', e.target.value)}
            />
            {errors.nomCategorie ? <span style={errStyle}>{errors.nomCategorie}</span> : null}
          </label>

          <label style={labelStyle}>
            Type d'article
            <select
              style={inputStyle}
              value={form.idType}
              onChange={(e) => setField('idType', e.target.value)}
            >
              <option value="">-- Choisir un type --</option>
              {types.map((t) => {
                const typeId = t.idTypeArticle ?? t.id_type_article;
                const label = t.nomCategorie === 'consommable' ? 'Consommable' : 'Bien d\'inventaire';
                return (
                  <option key={typeId} value={typeId}>{label}</option>
                );
              })}
            </select>
            {errors.idType ? <span style={errStyle}>{errors.idType}</span> : null}
          </label>

          <label style={labelStyle}>
            Description
            <textarea
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Description optionnelle..."
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />
            {errors.description ? <span style={errStyle}>{errors.description}</span> : null}
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button style={secBtn} onClick={onClose}>Annuler</button>
          <button style={priBtn} onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SUBCATEGORY MODAL ───────────────────────────────────────────────────────
function SousCategoryFormModal({ mode, initialData, categories, onClose, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({
    nomSousCategorie: initialData?.nomSousCategorie ?? initialData?.nom_sous_categorie ?? '',
    idCategorie: String(initialData?.idCategorie ?? initialData?.id_categorie ?? ''),
  });
  const [errors, setErrors] = useState({});

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleSave() {
    const nextErrors = {};
    if (!form.nomSousCategorie.trim()) nextErrors.nomSousCategorie = 'Ce champ est requis.';
    if (!form.idCategorie) nextErrors.idCategorie = 'Veuillez choisir une catégorie parente.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      nomSousCategorie: form.nomSousCategorie.trim(),
      idCategorie: Number(form.idCategorie),
    };

    await onSubmit?.(payload, { setErrors });
  }

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 600 }}>
          {mode === 'create' ? 'Nouvelle sous-catégorie' : 'Modifier sous-catégorie'}
        </h3>

        <div style={{ display: 'grid', gap: 14 }}>
          <label style={labelStyle}>
            Nom de la sous-catégorie
            <input
              style={inputStyle}
              placeholder="Ex: Stylos, Imprimantes"
              value={form.nomSousCategorie}
              onChange={(e) => setField('nomSousCategorie', e.target.value)}
            />
            {errors.nomSousCategorie ? <span style={errStyle}>{errors.nomSousCategorie}</span> : null}
          </label>

          <label style={labelStyle}>
            Catégorie Parente
            <select
              style={inputStyle}
              value={form.idCategorie}
              onChange={(e) => setField('idCategorie', e.target.value)}
            >
              <option value="">-- Choisir une catégorie --</option>
              {categories.map((c) => {
                const catId = c.idCategorie ?? c.id_categorie;
                const typeLabel = c.typeArticle?.nomCategorie === 'consommable' ? 'Consommable' : 'Inventaire';
                return (
                  <option key={catId} value={catId}>
                    {c.nomCategorie ?? c.nom_categorie} ({typeLabel})
                  </option>
                );
              })}
            </select>
            {errors.idCategorie ? <span style={errStyle}>{errors.idCategorie}</span> : null}
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button style={secBtn} onClick={onClose}>Annuler</button>
          <button style={priBtn} onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'subcategories'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [categoryModalMode, setCategoryModalMode] = useState('closed'); // 'closed' | 'create' | 'edit'
  const [subcategoryModalMode, setSubcategoryModalMode] = useState('closed'); // 'closed' | 'create' | 'edit'
  const [selectedItem, setSelectedItem] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Queries
  const typesQ = useQuery({
    queryKey: ['resources', 'types'],
    queryFn: () => getTypeArticles().then(r => r.data),
    staleTime: 60000,
  });

  const categoriesQ = useQuery({
    queryKey: ['resources', 'categories'],
    queryFn: () => getCategories().then(r => r.data),
    staleTime: 30000,
  });

  const subcategoriesQ = useQuery({
    queryKey: ['resources', 'subcategories'],
    queryFn: () => getSousCategories().then(r => r.data),
    staleTime: 30000,
  });

  // Category Mutations
  const createCategoryM = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', 'categories'] });
      closeCategoryModal();
    },
  });

  const updateCategoryM = useMutation({
    mutationFn: ({ id, data }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', 'categories'] });
      closeCategoryModal();
    },
  });

  const deleteCategoryM = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', 'categories'] });
    },
  });

  // Subcategory Mutations
  const createSubM = useMutation({
    mutationFn: createSousCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', 'subcategories'] });
      closeSubcategoryModal();
    },
  });

  const updateSubM = useMutation({
    mutationFn: ({ id, data }) => updateSousCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', 'subcategories'] });
      closeSubcategoryModal();
    },
  });

  const deleteSubM = useMutation({
    mutationFn: deleteSousCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', 'subcategories'] });
    },
  });

  // Memoized lists & maps
  const types = useMemo(() => typesQ.data || [], [typesQ.data]);
  const categories = useMemo(() => categoriesQ.data || [], [categoriesQ.data]);
  const subcategories = useMemo(() => subcategoriesQ.data || [], [subcategoriesQ.data]);

  const categoriesMap = useMemo(() => {
    const map = {};
    categories.forEach((cat) => {
      const id = cat.idCategorie ?? cat.id_categorie;
      map[id] = cat;
    });
    return map;
  }, [categories]);

  // Modals management
  function openCategoryModal(item = null) {
    setErrorMsg('');
    setSelectedItem(item);
    setCategoryModalMode(item ? 'edit' : 'create');
  }

  function closeCategoryModal() {
    setCategoryModalMode('closed');
    setSelectedItem(null);
    setErrorMsg('');
  }

  function openSubcategoryModal(item = null) {
    setErrorMsg('');
    setSelectedItem(item);
    setSubcategoryModalMode(item ? 'edit' : 'create');
  }

  function closeSubcategoryModal() {
    setSubcategoryModalMode('closed');
    setSelectedItem(null);
    setErrorMsg('');
  }

  // Submissions
  async function handleCategorySubmit(payload, { setErrors }) {
    setErrorMsg('');
    try {
      if (categoryModalMode === 'create') {
        await createCategoryM.mutateAsync(payload);
      } else if (selectedItem) {
        const id = selectedItem.idCategorie ?? selectedItem.id_categorie;
        await updateCategoryM.mutateAsync({ id, data: payload });
      }
    } catch (err) {
      const d = err?.response?.data;
      if (d && typeof d === 'object') {
        const mapped = {};
        Object.entries(d).forEach(([k, v]) => {
          const key = k === 'nom_categorie' ? 'nomCategorie'
                    : k === 'id_type' ? 'idType'
                    : k;
          mapped[key] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(mapped);
      } else {
        setErrorMsg("Erreur lors de l'enregistrement de la catégorie.");
      }
    }
  }

  async function handleSubcategorySubmit(payload, { setErrors }) {
    setErrorMsg('');
    try {
      if (subcategoryModalMode === 'create') {
        await createSubM.mutateAsync(payload);
      } else if (selectedItem) {
        const id = selectedItem.idSousCategorie ?? selectedItem.id_sous_categorie;
        await updateSubM.mutateAsync({ id, data: payload });
      }
    } catch (err) {
      const d = err?.response?.data;
      if (d && typeof d === 'object') {
        const mapped = {};
        Object.entries(d).forEach(([k, v]) => {
          const key = k === 'nom_sous_categorie' ? 'nomSousCategorie'
                    : k === 'id_categorie' ? 'idCategorie'
                    : k;
          mapped[key] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(mapped);
      } else {
        setErrorMsg("Erreur lors de l'enregistrement de la sous-catégorie.");
      }
    }
  }

  // Deletions
  function handleCategoryDelete(cat) {
    const id = cat.idCategorie ?? cat.id_categorie;
    const name = cat.nomCategorie ?? cat.nom_categorie;
    if (window.confirm(`Supprimer la catégorie "${name}" ? Attention, cela peut affecter les sous-catégories et articles associés.`)) {
      deleteCategoryM.mutate(id);
    }
  }

  function handleSubcategoryDelete(sub) {
    const id = sub.idSousCategorie ?? sub.id_sous_categorie;
    const name = sub.nomSousCategorie ?? sub.nom_sous_categorie;
    if (window.confirm(`Supprimer la sous-catégorie "${name}" ?`)) {
      deleteSubM.mutate(id);
    }
  }

  // Search filtering
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter((cat) => {
      const name = (cat.nomCategorie ?? cat.nom_categorie ?? '').toLowerCase();
      const desc = (cat.description ?? '').toLowerCase();
      const type = cat.typeArticle?.nomCategorie === 'consommable' ? 'consommable' : 'bien d\'inventaire';
      return name.includes(q) || desc.includes(q) || type.includes(q);
    });
  }, [categories, searchQuery]);

  const filteredSubcategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return subcategories;
    return subcategories.filter((sub) => {
      const name = (sub.nomSousCategorie ?? sub.nom_sous_categorie ?? '').toLowerCase();
      const parentCat = categoriesMap[sub.idCategorie ?? sub.id_categorie];
      const parentName = (parentCat?.nomCategorie ?? parentCat?.nom_categorie ?? '').toLowerCase();
      return name.includes(q) || parentName.includes(q);
    });
  }, [subcategories, categoriesMap, searchQuery]);

  const isLoading = categoriesQ.isLoading || subcategoriesQ.isLoading || typesQ.isLoading;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Header and Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Tag size={24} /> Catégories &amp; Sous-catégories
        </h1>
        {activeTab === 'categories' ? (
          <button style={priBtn} onClick={() => openCategoryModal(null)}>
            <Plus size={16} style={{ marginRight: 6 }} /> Nouvelle catégorie
          </button>
        ) : (
          <button style={priBtn} onClick={() => openSubcategoryModal(null)}>
            <Plus size={16} style={{ marginRight: 6 }} /> Nouvelle sous-catégorie
          </button>
        )}
      </div>

      {/* Tabs list & Search Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: 1 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => { setActiveTab('categories'); setSearchQuery(''); }}
            style={{
              ...tabItemStyle,
              borderBottom: activeTab === 'categories' ? '3px solid #3b82f6' : '3px solid transparent',
              color: activeTab === 'categories' ? '#111827' : '#6b7280',
              fontWeight: activeTab === 'categories' ? 600 : 400,
            }}
          >
            Catégories ({categories.length})
          </button>
          <button
            onClick={() => { setActiveTab('subcategories'); setSearchQuery(''); }}
            style={{
              ...tabItemStyle,
              borderBottom: activeTab === 'subcategories' ? '3px solid #3b82f6' : '3px solid transparent',
              color: activeTab === 'subcategories' ? '#111827' : '#6b7280',
              fontWeight: activeTab === 'subcategories' ? 600 : 400,
            }}
          >
            Sous-catégories ({subcategories.length})
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: 'min(300px, 100%)' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder={activeTab === 'categories' ? "Rechercher une catégorie..." : "Rechercher une sous-catégorie..."}
            style={{ ...inputStyle, paddingLeft: 34, width: '100%' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table view */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ height: 160, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              Chargement des données...
            </div>
          </div>
        ) : activeTab === 'categories' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                <th style={thS}>Nom</th>
                <th style={thS}>Type d'article</th>
                <th style={thS}>Description</th>
                <th style={thS}>Statut</th>
                <th style={thS}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                    Aucune catégorie trouvée.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => {
                  const catId = cat.idCategorie ?? cat.id_categorie;
                  const isConsommable = cat.typeArticle?.nomCategorie === 'consommable';
                  
                  return (
                    <tr key={catId} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ ...tdS, fontWeight: 500, color: '#111827' }}>
                        {cat.nomCategorie ?? cat.nom_categorie}
                      </td>
                      <td style={tdS}>
                        <span style={isConsommable ? badgeBlue : badgePurple}>
                          {isConsommable ? 'Consommable' : 'Bien d\'inventaire'}
                        </span>
                      </td>
                      <td style={{ ...tdS, color: '#4b5563', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cat.description || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Aucune description</span>}
                      </td>
                      <td style={tdS}>
                        <span style={cat.actif !== false ? badgeGreen : badgeRed}>
                          {cat.actif !== false ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td style={tdS}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={secBtn} title="Modifier" onClick={() => openCategoryModal(cat)}>
                            <Pencil size={14} />
                          </button>
                          <button style={deleteBtnStyle} title="Supprimer" onClick={() => handleCategoryDelete(cat)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                <th style={thS}>Nom de la sous-catégorie</th>
                <th style={thS}>Catégorie Parente</th>
                <th style={thS}>Type d'article</th>
                <th style={thS}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubcategories.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                    Aucune sous-catégorie trouvée.
                  </td>
                </tr>
              ) : (
                filteredSubcategories.map((sub) => {
                  const subId = sub.idSousCategorie ?? sub.id_sous_categorie;
                  const parentCat = categoriesMap[sub.idCategorie ?? sub.id_categorie];
                  const parentName = parentCat ? (parentCat.nomCategorie ?? parentCat.nom_categorie) : '—';
                  const isConsommable = parentCat?.typeArticle?.nomCategorie === 'consommable';

                  return (
                    <tr key={subId} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ ...tdS, fontWeight: 500, color: '#111827' }}>
                        {sub.nomSousCategorie ?? sub.nom_sous_categorie}
                      </td>
                      <td style={tdS}>
                        {parentName}
                      </td>
                      <td style={tdS}>
                        {parentCat ? (
                          <span style={isConsommable ? badgeBlue : badgePurple}>
                            {isConsommable ? 'Consommable' : 'Bien d\'inventaire'}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={tdS}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={secBtn} title="Modifier" onClick={() => openSubcategoryModal(sub)}>
                            <Pencil size={14} />
                          </button>
                          <button style={deleteBtnStyle} title="Supprimer" onClick={() => handleSubcategoryDelete(sub)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {errorMsg ? <div style={{ color: '#b91c1c', fontSize: 13, fontWeight: 500 }}>{errorMsg}</div> : null}

      {/* Category Modal Popup */}
      {(categoryModalMode === 'create' || categoryModalMode === 'edit') && (
        <CategoryFormModal
          mode={categoryModalMode}
          initialData={selectedItem}
          types={types}
          onClose={closeCategoryModal}
          onSubmit={handleCategorySubmit}
          isSubmitting={createCategoryM.isPending || updateCategoryM.isPending}
        />
      )}

      {/* Subcategory Modal Popup */}
      {(subcategoryModalMode === 'create' || subcategoryModalMode === 'edit') && (
        <SousCategoryFormModal
          mode={subcategoryModalMode}
          initialData={selectedItem}
          categories={categories}
          onClose={closeSubcategoryModal}
          onSubmit={handleSubcategorySubmit}
          isSubmitting={createSubM.isPending || updateSubM.isPending}
        />
      )}
    </div>
  );
}

// ── DESIGN SYSTEMS / STYLES ──────────────────────────────────────────────────
const backdropStyle = { position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)', display: 'grid', placeItems: 'center', zIndex: 99 };
const modalStyle = { width: 'min(500px, 94vw)', background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' };
const labelStyle = { display: 'grid', gap: 6, fontSize: 13, color: '#374151', fontWeight: 500 };
const inputStyle = { border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', transition: 'border-color 0.15s', color: '#111827' };
const errStyle = { color: '#b91c1c', fontSize: 12, fontWeight: 400 };

const priBtn = { border: 'none', borderRadius: 8, padding: '8px 16px', background: '#111827', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', transition: 'background-color 0.15s' };
const secBtn = { border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 12px', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#374151', display: 'flex', alignItems: 'center', transition: 'background-color 0.15s' };
const deleteBtnStyle = { border: '1px solid #fee2e2', borderRadius: 8, padding: '8px 12px', background: '#fef2f2', cursor: 'pointer', color: '#b91c1c', display: 'flex', alignItems: 'center', transition: 'all 0.15s' };

const thS = { padding: '12px 16px', fontWeight: 600, color: '#4b5563', borderBottom: '1px solid #e5e7eb' };
const tdS = { padding: '14px 16px', verticalAlign: 'middle', color: '#374151' };

const tabItemStyle = { border: 'none', borderBottom: '3px solid transparent', background: 'transparent', padding: '10px 16px', cursor: 'pointer', fontSize: 14, transition: 'all 0.15s' };

const badgeBase = { display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500 };
const badgeBlue = { ...badgeBase, background: '#eff6ff', color: '#1d4ed8' };
const badgePurple = { ...badgeBase, background: '#f5f3ff', color: '#6d28d9' };
const badgeGreen = { ...badgeBase, background: '#ecfdf5', color: '#047857' };
const badgeRed = { ...badgeBase, background: '#fef2f2', color: '#b91c1c' };
