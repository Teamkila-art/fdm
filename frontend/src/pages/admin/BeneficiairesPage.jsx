import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Pencil, Trash2, Search } from 'lucide-react';

import {
  getEtablissements,
  getBatiments,
  getServices,
  getBeneficiaires,
  createBeneficiaire,
  updateBeneficiaire,
  deleteBeneficiaire,
  getTypesBeneficiaire,
} from '../../api/users';

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

// ── FORM MODAL ──────────────────────────────────────────────────────────────
function BeneficiaireFormModal({ mode, initialData, etablissements, batiments, services, typesBeneficiaire, onClose, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({
    nom: initialData?.nom ?? '',
    id_type_beneficiaire: String(initialData?.id_type_beneficiaire ?? initialData?.idTypeBeneficiaire ?? ''),
    idEtablissement: '',
    idBatiment: '',
    idService: '',
  });
  const [errors, setErrors] = useState({});

  // Resolve and pre-populate hierarchy in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData && services.length > 0 && batiments.length > 0) {
      const svcId = initialData.idService ?? initialData.id_service;
      const svc = services.find((s) => String(s.idService ?? s.id_service) === String(svcId));
      if (svc) {
        const batId = svc.idBatiment ?? svc.id_batiment;
        const bat = batiments.find((b) => String(b.idBatiment ?? b.id_batiment) === String(batId));
        if (bat) {
          const etabId = bat.idEtablissement ?? bat.id_etablissement;
          setForm({
            nom: initialData.nom ?? '',
            id_type_beneficiaire: String(initialData.id_type_beneficiaire ?? initialData.idTypeBeneficiaire ?? ''),
            idEtablissement: String(etabId ?? ''),
            idBatiment: String(batId ?? ''),
            idService: String(svcId ?? ''),
          });
        }
      }
    }
  }, [mode, initialData, services, batiments]);

  // Cascading filters
  const filteredBatiments = useMemo(() => {
    if (!form.idEtablissement) return [];
    return batiments.filter((b) => String(b.idEtablissement ?? b.id_etablissement) === String(form.idEtablissement));
  }, [batiments, form.idEtablissement]);

  const filteredServices = useMemo(() => {
    if (!form.idBatiment) return [];
    return services.filter((s) => String(s.idBatiment ?? s.id_batiment) === String(form.idBatiment));
  }, [services, form.idBatiment]);

  function setField(name, value) {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'idEtablissement') {
        next.idBatiment = '';
        next.idService = '';
      } else if (name === 'idBatiment') {
        next.idService = '';
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleSave() {
    const nextErrors = {};
    if (!form.nom.trim()) nextErrors.nom = 'Le nom est requis.';
    if (!form.id_type_beneficiaire) nextErrors.id_type_beneficiaire = 'Le type est requis.';
    if (!form.idEtablissement) nextErrors.idEtablissement = 'Sélectionnez un établissement.';
    if (!form.idBatiment) nextErrors.idBatiment = 'Sélectionnez un bâtiment.';
    if (!form.idService) nextErrors.idService = 'Sélectionnez un service.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      nom: form.nom.trim(),
      id_type_beneficiaire: Number(form.id_type_beneficiaire),
      id_service: Number(form.idService),
    };

    await onSubmit?.(payload, { setErrors });
  }

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 600 }}>
          {mode === 'create' ? 'Nouveau bénéficiaire' : 'Modifier bénéficiaire'}
        </h3>

        <div style={{ display: 'grid', gap: 14 }}>
          {/* Nom */}
          <label style={labelStyle}>
            Nom complet
            <input
              style={inputStyle}
              placeholder="Ex: John Doe"
              value={form.nom}
              onChange={(e) => setField('nom', e.target.value)}
            />
            {errors.nom ? <span style={errStyle}>{errors.nom}</span> : null}
          </label>

          {/* Rôle */}
          <label style={labelStyle}>
            Type de bénéficiaire
            <select
              style={inputStyle}
              value={form.id_type_beneficiaire}
              onChange={(e) => setField('id_type_beneficiaire', e.target.value)}
            >
              <option value="">-- Choisir un type --</option>
              {typesBeneficiaire.map((t) => (
                <option key={t.id_type_beneficiaire} value={t.id_type_beneficiaire}>{getTypeLabel(t.nom)}</option>
              ))}
            </select>
            {errors.id_type_beneficiaire ? <span style={errStyle}>{errors.id_type_beneficiaire}</span> : null}
          </label>

          {/* Etablissement */}
          <label style={labelStyle}>
            Établissement
            <select
              style={inputStyle}
              value={form.idEtablissement}
              onChange={(e) => setField('idEtablissement', e.target.value)}
            >
              <option value="">-- Choisir un établissement --</option>
              {etablissements.map((et) => {
                const id = et.idEtablissement ?? et.id_etablissement;
                return (
                  <option key={id} value={id}>{et.nom}</option>
                );
              })}
            </select>
            {errors.idEtablissement ? <span style={errStyle}>{errors.idEtablissement}</span> : null}
          </label>

          {/* Batiment */}
          <label style={labelStyle}>
            Bâtiment
            <select
              style={inputStyle}
              value={form.idBatiment}
              onChange={(e) => setField('idBatiment', e.target.value)}
              disabled={!form.idEtablissement}
            >
              <option value="">{form.idEtablissement ? '-- Choisir un bâtiment --' : '-- Sélectionnez d\'abord un établissement --'}</option>
              {filteredBatiments.map((b) => {
                const id = b.idBatiment ?? b.id_batiment;
                return (
                  <option key={id} value={id}>{b.nom}</option>
                );
              })}
            </select>
            {errors.idBatiment ? <span style={errStyle}>{errors.idBatiment}</span> : null}
          </label>

          {/* Service */}
          <label style={labelStyle}>
            Service
            <select
              style={inputStyle}
              value={form.idService}
              onChange={(e) => setField('idService', e.target.value)}
              disabled={!form.idBatiment}
            >
              <option value="">{form.idBatiment ? '-- Choisir un service --' : '-- Sélectionnez d\'abord un bâtiment --'}</option>
              {filteredServices.map((s) => {
                const id = s.idService ?? s.id_service;
                return (
                  <option key={id} value={id}>{s.nomService ?? s.nom_service}</option>
                );
              })}
            </select>
            {errors.idService ? <span style={errStyle}>{errors.idService}</span> : null}
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
export default function BeneficiairesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [modalMode, setModalMode] = useState('closed'); // 'closed' | 'create' | 'edit'
  const [selectedItem, setSelectedItem] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Queries
  const etablissementsQ = useQuery({
    queryKey: ['users', 'etablissements'],
    queryFn: () => getEtablissements().then(r => r.data),
    staleTime: 60000,
  });

  const batimentsQ = useQuery({
    queryKey: ['users', 'batiments'],
    queryFn: () => getBatiments().then(r => r.data),
    staleTime: 60000,
  });

  const servicesQ = useQuery({
    queryKey: ['users', 'services'],
    queryFn: () => getServices().then(r => r.data),
    staleTime: 30000,
  });

  const beneficiairesQ = useQuery({
    queryKey: ['users', 'beneficiaires'],
    queryFn: () => getBeneficiaires().then(r => r.data),
    staleTime: 20000,
  });

  const typesBeneficiaireQ = useQuery({
    queryKey: ['users', 'types-beneficiaire'],
    queryFn: () => getTypesBeneficiaire().then(r => r.data),
    staleTime: 60000,
  });

  // Mutations
  const createMut = useMutation({
    mutationFn: createBeneficiaire,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'beneficiaires'] });
      closeModal();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateBeneficiaire(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'beneficiaires'] });
      closeModal();
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteBeneficiaire,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'beneficiaires'] });
    },
  });

  // Lists & mapping resolution
  const etablissements = useMemo(() => etablissementsQ.data || [], [etablissementsQ.data]);
  const batiments = useMemo(() => batimentsQ.data || [], [batimentsQ.data]);
  const services = useMemo(() => servicesQ.data || [], [servicesQ.data]);
  const beneficiaires = useMemo(() => beneficiairesQ.data || [], [beneficiairesQ.data]);
  const typesBeneficiaire = useMemo(() => typesBeneficiaireQ.data || [], [typesBeneficiaireQ.data]);

  const etMap = useMemo(() => {
    const m = {};
    etablissements.forEach((et) => { m[et.idEtablissement ?? et.id_etablissement] = et; });
    return m;
  }, [etablissements]);

  const batMap = useMemo(() => {
    const m = {};
    batiments.forEach((b) => { m[b.idBatiment ?? b.id_batiment] = b; });
    return m;
  }, [batiments]);

  const svcMap = useMemo(() => {
    const m = {};
    services.forEach((s) => { m[s.idService ?? s.id_service] = s; });
    return m;
  }, [services]);

  // Modal actions
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
  async function handleSubmit(payload, { setErrors }) {
    setErrorMsg('');
    try {
      if (modalMode === 'create') {
        await createMut.mutateAsync(payload);
      } else if (selectedItem) {
        const id = selectedItem.idBeneficiaire ?? selectedItem.id_beneficiaire;
        await updateMut.mutateAsync({ id, data: payload });
      }
    } catch (err) {
      const d = err?.response?.data;
      if (d && typeof d === 'object') {
        const mapped = {};
        Object.entries(d).forEach(([k, v]) => {
          const key = k === 'role_type' ? 'id_type_beneficiaire' : k;
          mapped[key] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(mapped);
      } else {
        setErrorMsg("Erreur lors de l'enregistrement du bénéficiaire.");
      }
    }
  }

  // Delete
  function handleDelete(item) {
    const id = item.idBeneficiaire ?? item.id_beneficiaire;
    if (window.confirm(`Supprimer le bénéficiaire "${item.nom}" ?`)) {
      deleteMut.mutate(id);
    }
  }

  // Filtering
  const filteredBeneficiaires = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return beneficiaires;
    return beneficiaires.filter((item) => {
      const name = (item.nom ?? '').toLowerCase();
      const role = getTypeLabel(item.type_beneficiaire_display?.nom).toLowerCase();
      
      const svc = svcMap[item.idService ?? item.id_service];
      const svcName = (svc?.nomService ?? svc?.nom_service ?? '').toLowerCase();
      
      const bat = batMap[svc?.idBatiment ?? svc?.id_batiment];
      const batName = (bat?.nom ?? '').toLowerCase();
      
      const etab = etMap[bat?.idEtablissement ?? bat?.id_etablissement];
      const etabName = (etab?.nom ?? '').toLowerCase();

      return name.includes(q) || role.includes(q) || svcName.includes(q) || batName.includes(q) || etabName.includes(q);
    });
  }, [beneficiaires, svcMap, batMap, etMap, searchQuery]);

  const isLoading = beneficiairesQ.isLoading || servicesQ.isLoading || batimentsQ.isLoading || etablissementsQ.isLoading || typesBeneficiaireQ.isLoading;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={24} /> Bénéficiaires
        </h1>
        <button style={priBtn} onClick={() => openModal(null)}>
          <Plus size={16} style={{ marginRight: 6 }} /> Nouveau bénéficiaire
        </button>
      </div>

      {/* Search and Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>
        <div style={{ fontSize: 14, color: '#6b7280' }}>
          Total : <strong>{filteredBeneficiaires.length}</strong> bénéficiaire(s)
        </div>
        <div style={{ position: 'relative', width: 'min(300px, 100%)' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Rechercher un bénéficiaire..."
            style={{ ...inputStyle, paddingLeft: 34, width: '100%' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ height: 160, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              Chargement des bénéficiaires...
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                <th style={thS}>Nom</th>
                <th style={thS}>Type / Rôle</th>
                <th style={thS}>Établissement</th>
                <th style={thS}>Bâtiment</th>
                <th style={thS}>Service</th>
                <th style={thS}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBeneficiaires.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                    Aucun bénéficiaire trouvé.
                  </td>
                </tr>
              ) : (
                filteredBeneficiaires.map((item) => {
                  const id = item.idBeneficiaire ?? item.id_beneficiaire;
                  const roleKey = item.type_beneficiaire_display?.nom;
                  const roleLabel = getTypeLabel(roleKey);
                  
                  const svc = svcMap[item.idService ?? item.id_service];
                  const svcName = svc ? (svc.nomService ?? svc.nom_service) : '—';
                  
                  const bat = batMap[svc?.idBatiment ?? svc?.id_batiment];
                  const batName = bat ? bat.nom : '—';
                  
                  const etab = etMap[bat?.idEtablissement ?? bat?.id_etablissement];
                  const etabName = etab ? etab.nom : '—';

                  return (
                    <tr key={id} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ ...tdS, fontWeight: 500, color: '#111827' }}>
                        {item.nom}
                      </td>
                      <td style={tdS}>
                        <span style={roleKey === 'chef_service' ? badgeGreen : roleKey === 'prof' ? badgeBlue : badgeGrey}>
                          {roleLabel}
                        </span>
                      </td>
                      <td style={tdS}>{etabName}</td>
                      <td style={tdS}>{batName}</td>
                      <td style={{ ...tdS, color: '#111827', fontWeight: 500 }}>{svcName}</td>
                      <td style={tdS}>
                        <div style={{ display: 'flex', gap: 6 }}>
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

      {/* Form Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <BeneficiaireFormModal
          mode={modalMode}
          initialData={selectedItem}
          etablissements={etablissements}
          batiments={batiments}
          services={services}
          typesBeneficiaire={typesBeneficiaire}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isSubmitting={createMut.isPending || updateMut.isPending}
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

const badgeBase = { display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500 };
const badgeBlue = { ...badgeBase, background: '#eff6ff', color: '#1d4ed8' };
const badgeGreen = { ...badgeBase, background: '#ecfdf5', color: '#047857' };
const badgeGrey = { ...badgeBase, background: '#f3f4f6', color: '#4b5563' };
