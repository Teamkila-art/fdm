import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { getBeneficiaires, createBeneficiaire, updateBeneficiaire, deleteBeneficiaire, getTypesBeneficiaire } from '../../api/users';

// ── Design tokens ─────────────────────────────────────────────────────────
const C = {
  primary:    '#6366f1',
  lightPrimary: '#8b5cf6',
  textDark:   '#0f172a',
  textMid:    '#374151',
  textMuted:  '#64748b',
  border:     '#e2e8f0',
  bgWhite:    '#ffffff',
  bgSubtle:   '#f8fafc',
  danger:     '#ef4444',
  dangerBg:   '#fef2f2',
  radius:     12,
  radiusSm:   8,
};

const ROLE_LABELS = {
  chef_service:   'Chef de Service',
  fonctionnaire:  'Fonctionnaire',
  secretariat:    'Secrétariat',
  salle_de_cours: 'Salle de cours',
  prof:           'Prof',
  personnel:      'Personnel',
};
function getTypeLabel(nom) {
  return ROLE_LABELS[nom] || nom || '—';
}

export default function PersonnelPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const serviceId = user?.service?.id;
  const serviceName = user?.service?.nom || '—';

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [nom, setNom] = useState('');
  const [id_type_beneficiaire, setIdTypeBeneficiaire] = useState('');
  const [formError, setFormError] = useState('');

  const benefQuery = useQuery({
    queryKey: ['chef', 'beneficiaires', serviceId],
    queryFn: () => getBeneficiaires({ id_service: serviceId }),
    enabled: Boolean(serviceId),
    staleTime: 30_000,
  });
  const beneficiaires = benefQuery.data?.data || [];

  const typesQuery = useQuery({
    queryKey: ['chef', 'types-beneficiaire'],
    queryFn: () => getTypesBeneficiaire(),
    staleTime: 60_000,
  });
  const typesBeneficiaire = typesQuery.data?.data || [];

  const createMut = useMutation({
    mutationFn: createBeneficiaire,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['chef', 'beneficiaires'] }); closeForm(); },
    onError: (e) => setFormError(e?.response?.data?.detail || 'Erreur lors de la création.'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateBeneficiaire(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['chef', 'beneficiaires'] }); closeForm(); },
    onError: (e) => setFormError(e?.response?.data?.detail || 'Erreur lors de la modification.'),
  });

  const deleteMut = useMutation({
    mutationFn: deleteBeneficiaire,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chef', 'beneficiaires'] }),
    onError: (e) => setFormError(e?.response?.data?.detail || 'Erreur lors de la suppression.'),
  });

  function openCreate() {
    setEditItem(null);
    setNom('');
    setIdTypeBeneficiaire('');
    setFormError('');
    setShowForm(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setNom(item.nom);
    setIdTypeBeneficiaire(String(item.id_type_beneficiaire ?? item.idTypeBeneficiaire ?? ''));
    setFormError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditItem(null);
    setNom('');
    setIdTypeBeneficiaire('');
    setFormError('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!nom.trim()) { setFormError('Le nom est requis.'); return; }
    if (!id_type_beneficiaire) { setFormError('Le type de bénéficiaire est requis.'); return; }
    const payload = { nom: nom.trim(), id_type_beneficiaire: Number(id_type_beneficiaire), id_service: serviceId };
    if (editItem) {
      const id = editItem.idBeneficiaire ?? editItem.id_beneficiaire;
      updateMut.mutate({ id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  }

  function handleDelete(item) {
    const id = item.idBeneficiaire ?? item.id_beneficiaire;
    if (window.confirm(`Supprimer "${item.nom}" ?`)) {
      deleteMut.mutate(id);
    }
  }

  if (!serviceId) {
    return (
      <div style={card}>
        <p style={{ color: C.textMuted, fontSize: 14 }}>
          Veuillez d'abord sélectionner votre service dans la page <strong>Profil</strong>.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 20, paddingBottom: 40, maxWidth: 720 }}>

      {/* ── Header ── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.primary }}>
              Personnel & Bénéficiaires
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.textMuted }}>
              Service : <strong>{serviceName}</strong> — Gérez les bénéficiaires de votre service.
            </p>
          </div>
          <button style={btnPrimary} onClick={openCreate}>
            + Ajouter
          </button>
        </div>
        <div style={{ height: 3, background: C.lightPrimary, borderRadius: 2, margin: '16px -24px 0' }} />
      </div>

      {/* ── Inline form ── */}
      {showForm && (
        <div style={card}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: C.textDark }}>
            {editItem ? 'Modifier le bénéficiaire' : 'Nouveau bénéficiaire'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Nom</span>
              <input
                style={inputStyle}
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Nom du bénéficiaire"
                autoFocus
              />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Type / Rôle</span>
              <select style={inputStyle} value={id_type_beneficiaire} onChange={(e) => setIdTypeBeneficiaire(e.target.value)}>
                <option value="">-- Choisir un type --</option>
                {typesBeneficiaire.map((t) => (
                  <option key={t.id_type_beneficiaire} value={t.id_type_beneficiaire}>{getTypeLabel(t.nom)}</option>
                ))}
              </select>
            </label>
            {formError && (
              <div style={{ fontSize: 13, color: C.danger, fontWeight: 500 }}>{formError}</div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                type="submit"
                style={{ ...btnPrimary, opacity: createMut.isPending || updateMut.isPending ? 0.6 : 1 }}
                disabled={createMut.isPending || updateMut.isPending}
              >
                {editItem ? 'Enregistrer' : 'Créer'}
              </button>
              <button type="button" style={btnSecondary} onClick={closeForm}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Table ── */}
      <div style={tableShell}>
        {benefQuery.isLoading || typesQuery.isLoading ? (
          <div style={{ padding: 20 }}>
            <div style={{ height: 120, borderRadius: C.radiusSm, background: C.bgSubtle }} />
          </div>
        ) : beneficiaires.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: C.textMuted, fontSize: 14 }}>
            Aucun bénéficiaire. Cliquez sur <strong>+ Ajouter</strong> pour en créer.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                <th style={thStyle}>Nom</th>
                <th style={thStyle}>Type</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {beneficiaires.map((b) => {
                const bid = b.idBeneficiaire ?? b.id_beneficiaire;
                const bRole = b.type_beneficiaire_display?.nom;
                return (
                  <tr key={bid} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td style={tdStyle}>{b.nom}</td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                        background: bRole === 'personnel' ? '#dbeafe' : '#f1f5f9',
                        color: bRole === 'personnel' ? '#1e3a8a' : '#475569',
                        border: `1px solid ${bRole === 'personnel' ? '#93c5fd' : '#cbd5e1'}`,
                      }}>
                        {getTypeLabel(bRole)}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button style={btnSmall} onClick={() => openEdit(b)}>Modifier</button>
                        <button
                          style={{ ...btnSmall, color: C.danger, borderColor: '#fecaca' }}
                          onClick={() => handleDelete(b)}
                          disabled={deleteMut.isPending}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const card = {
  background: C.bgWhite, border: `1px solid ${C.border}`,
  borderRadius: C.radius, padding: '20px 24px',
};
const tableShell = {
  border: `1px solid ${C.border}`, borderRadius: C.radius,
  overflow: 'hidden', background: C.bgWhite,
};
const labelStyle = {
  fontSize: 12, fontWeight: 600, color: C.textMuted,
  textTransform: 'uppercase', letterSpacing: '0.04em',
};
const inputStyle = {
  width: '100%', padding: '10px 14px', fontSize: 14,
  color: C.textDark, background: C.bgWhite,
  border: `1px solid ${C.border}`, borderRadius: C.radiusSm,
  boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
};
const thStyle = {
  padding: '10px 14px', fontSize: 12, fontWeight: 700,
  color: C.textMuted, textAlign: 'left',
  borderBottom: `1px solid ${C.border}`, background: C.bgSubtle,
};
const tdStyle = {
  padding: '10px 14px', fontSize: 14, color: C.textMid, verticalAlign: 'middle',
};
const btnPrimary = {
  border: 'none', borderRadius: C.radiusSm,
  padding: '9px 16px', fontSize: 13, fontWeight: 600,
  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
  color: '#ffffff', cursor: 'pointer',
};
const btnSecondary = {
  border: `1px solid ${C.border}`, borderRadius: C.radiusSm,
  padding: '9px 16px', fontSize: 13, fontWeight: 500,
  background: C.bgWhite, color: C.textMid, cursor: 'pointer',
};
const btnSmall = {
  border: `1px solid ${C.border}`, borderRadius: 6,
  padding: '5px 10px', fontSize: 12, fontWeight: 500,
  background: C.bgWhite, color: C.textMid, cursor: 'pointer',
};
