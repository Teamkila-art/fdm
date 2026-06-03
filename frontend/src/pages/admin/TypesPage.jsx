import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, Settings } from 'lucide-react';

import {
  getTypesBeneficiaire,
  createTypeBeneficiaire,
  updateTypeBeneficiaire,
  deleteTypeBeneficiaire,
} from '../../api/users';

// ── FORM MODAL ──────────────────────────────────────────────────────────────
function TypeFormModal({ mode, initialData, typeLabel, onClose, onSubmit, isSubmitting }) {
  const [nom, setNom] = useState(initialData?.nom ?? '');
  const [error, setError] = useState('');

  async function handleSave() {
    if (!nom.trim()) {
      setError('Ce champ est requis.');
      return;
    }
    setError('');
    await onSubmit?.({ nom: nom.trim() }, { setError });
  }

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 600 }}>
          {mode === 'create' ? `Nouveau ${typeLabel}` : `Modifier ${typeLabel}`}
        </h3>

        <div style={{ display: 'grid', gap: 14 }}>
          <label style={labelStyle}>
            Nom
            <input
              style={inputStyle}
              placeholder="Ex: Administratif, Enseignant, etc."
              value={nom}
              onChange={(e) => {
                setNom(e.target.value);
                setError('');
              }}
              autoFocus
            />
            {error ? <span style={errStyle}>{error}</span> : null}
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
export default function TypesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState('closed'); // 'closed' | 'create' | 'edit'
  const [selectedItem, setSelectedItem] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Queries
  const benefTypesQ = useQuery({
    queryKey: ['users', 'types-beneficiaire'],
    queryFn: () => getTypesBeneficiaire().then((r) => r.data),
    staleTime: 30000,
  });

  // Mutations - Beneficiary Types
  const createBenefTypeM = useMutation({
    mutationFn: createTypeBeneficiaire,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'types-beneficiaire'] });
      closeModal();
    },
  });

  const updateBenefTypeM = useMutation({
    mutationFn: ({ id, data }) => updateTypeBeneficiaire(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'types-beneficiaire'] });
      closeModal();
    },
  });

  const deleteBenefTypeM = useMutation({
    mutationFn: deleteTypeBeneficiaire,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'types-beneficiaire'] });
    },
  });

  const benefTypes = useMemo(() => benefTypesQ.data || [], [benefTypesQ.data]);

  // Modals management
  function openModal(item = null) {
    setErrorMsg('');
    setSelectedItem(item);
    setModalMode(item ? 'edit' : 'create');
  }

  function closeModal() {
    setModalMode('closed');
    setSelectedItem(null);
    setErrorMsg('');
  }

  // Submission handler
  async function handleSubmit(payload, { setError }) {
    setErrorMsg('');
    try {
      if (modalMode === 'create') {
        await createBenefTypeM.mutateAsync(payload);
      } else if (selectedItem) {
        const id = selectedItem.id_type_beneficiaire;
        await updateBenefTypeM.mutateAsync({ id, data: payload });
      }
    } catch (err) {
      const d = err?.response?.data;
      if (d && typeof d === 'object' && d.nom) {
        setError(Array.isArray(d.nom) ? d.nom[0] : String(d.nom));
      } else {
        setErrorMsg("Erreur lors de l'enregistrement du type.");
      }
    }
  }

  // Delete handler
  function handleDelete(item) {
    const name = item.nom;
    const id = item.id_type_beneficiaire;
    if (window.confirm(`Supprimer le type de bénéficiaire "${name}" ?`)) {
      deleteBenefTypeM.mutate(id);
    }
  }

  // Filtered lists
  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return benefTypes;
    return benefTypes.filter((item) => (item.nom || '').toLowerCase().includes(q));
  }, [benefTypes, searchQuery]);

  const isLoading = benefTypesQ.isLoading;
  const isSubmitting =
    createBenefTypeM.isPending ||
    updateBenefTypeM.isPending;

  const currentLabel = 'type de bénéficiaire';

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Header and Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, color: '#6366f1' }}>
          <Settings size={24} /> Types Dynamiques
        </h1>
        <button style={priBtn} onClick={() => openModal(null)}>
          <Plus size={16} style={{ marginRight: 6 }} /> Nouveau {currentLabel}
        </button>
      </div>

      {/* Tabs list & Search Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: 1 }}>
        {/* Search */}
        <div style={{ position: 'relative', width: 'min(300px, 100%)' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder={`Rechercher un ${currentLabel}...`}
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
            <div style={{ height: 160, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              Chargement des données...
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                <th style={{ ...thS, width: 80 }}>ID</th>
                <th style={thS}>Nom du Type</th>
                <th style={{ ...thS, width: 120, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                    Aucun type trouvé.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const id = item.id_type_beneficiaire;
                  return (
                    <tr key={id} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ ...tdS, color: '#6b7280' }}>
                        {id}
                      </td>
                      <td style={{ ...tdS, fontWeight: 500, color: '#111827' }}>
                        {item.nom}
                      </td>
                      <td style={{ ...tdS, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button style={secBtn} title="Modifier" onClick={() => openModal(item)}>
                            <Pencil size={14} />
                          </button>
                          <button style={deleteBtnStyle} title="Supprimer" onClick={() => handleDelete(item)}>
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

      {/* Modal Popup */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <TypeFormModal
          mode={modalMode}
          initialData={selectedItem}
          typeLabel={currentLabel}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

// ── DESIGN SYSTEMS / STYLES ──────────────────────────────────────────────────
const backdropStyle = { position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)', display: 'grid', placeItems: 'center', zIndex: 99 };
const modalStyle = { width: 'min(420px, 94vw)', background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' };
const labelStyle = { display: 'grid', gap: 6, fontSize: 13, color: '#374151', fontWeight: 500 };
const inputStyle = { border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', transition: 'border-color 0.15s', color: '#111827' };
const errStyle = { color: '#b91c1c', fontSize: 12, fontWeight: 400 };

const priBtn = { border: 'none', borderRadius: 8, padding: '8px 16px', background: '#111827', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', transition: 'background-color 0.15s' };
const secBtn = { border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 12px', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#374151', display: 'flex', alignItems: 'center', transition: 'background-color 0.15s' };
const deleteBtnStyle = { border: '1px solid #fee2e2', borderRadius: 8, padding: '8px 12px', background: '#fef2f2', cursor: 'pointer', color: '#b91c1c', display: 'flex', alignItems: 'center', transition: 'all 0.15s' };

const thS = { padding: '12px 16px', fontWeight: 600, color: '#4b5563', borderBottom: '1px solid #e5e7eb' };
const tdS = { padding: '14px 16px', verticalAlign: 'middle', color: '#374151' };

const tabItemStyle = { border: 'none', borderBottom: '3px solid transparent', background: 'transparent', padding: '10px 16px', cursor: 'pointer', fontSize: 14, transition: 'all 0.15s' };
