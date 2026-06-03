import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createService, deleteService, getServices, updateService,
  getEtablissements, getBatiments,
} from '../../api/users';

function ServiceFormModal({ mode, initialData, etablissements, batiments, onClose, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({
    nom_service: initialData?.nomService ?? initialData?.nom_service ?? '',
    description: initialData?.description ?? '',
    lettre_nomination_chef: null,
    id_etablissement: '',
    id_batiment: String(initialData?.idBatiment ?? initialData?.id_batiment ?? ''),
  });
  const [errors, setErrors] = useState({});

  // Pre-fill etablissement from existing batiment in edit mode
  useEffect(() => {
    const batId = initialData?.idBatiment ?? initialData?.id_batiment;
    if (batId && batiments.length > 0) {
      const bat = batiments.find((b) => String(b.idBatiment ?? b.id_batiment) === String(batId));
      if (bat) {
        setForm((prev) => ({
          ...prev,
          id_etablissement: String(bat.idEtablissement ?? bat.id_etablissement ?? ''),
          id_batiment: String(batId),
        }));
      }
    }
  }, [initialData, batiments]);

  const filteredBatiments = useMemo(() => {
    if (!form.id_etablissement) return [];
    return batiments.filter((b) => {
      const etabId = b.idEtablissement ?? b.id_etablissement;
      return String(etabId) === String(form.id_etablissement);
    });
  }, [batiments, form.id_etablissement]);

  function setField(name, value) {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'id_etablissement') next.id_batiment = '';
      return next;
    });
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleSave() {
    const nextErrors = {};
    if (!form.nom_service.trim()) nextErrors.nom_service = 'Ce champ est requis.';
    if (!form.id_etablissement) nextErrors.id_etablissement = 'Veuillez choisir un etablissement.';
    if (!form.id_batiment) nextErrors.id_batiment = 'Veuillez choisir un batiment.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const formData = new FormData();
    formData.append('nom_service', form.nom_service.trim());
    formData.append('description', form.description);
    formData.append('id_batiment', form.id_batiment);
    if (form.lettre_nomination_chef) {
      formData.append('lettre_nomination_chef', form.lettre_nomination_chef);
    }

    await onSubmit?.(formData, { setErrors });
  }

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{mode === 'create' ? 'Nouveau service' : 'Modifier service'}</h3>

        <div style={{ display: 'grid', gap: 10 }}>
          <label style={labelStyle}>
            Nom du service
            <input style={inputStyle} value={form.nom_service} onChange={(e) => setField('nom_service', e.target.value)} />
            {errors.nom_service ? <span style={errStyle}>{errors.nom_service}</span> : null}
          </label>


          <label style={labelStyle}>
            Etablissement
            <select style={inputStyle} value={form.id_etablissement} onChange={(e) => setField('id_etablissement', e.target.value)}>
              <option value="">-- Choisir un etablissement --</option>
              {etablissements.map((et) => (
                <option key={et.idEtablissement ?? et.id_etablissement} value={et.idEtablissement ?? et.id_etablissement}>{et.nom}</option>
              ))}
            </select>
            {errors.id_etablissement ? <span style={errStyle}>{errors.id_etablissement}</span> : null}
          </label>

          <label style={labelStyle}>
            Batiment
            <select style={inputStyle} value={form.id_batiment} onChange={(e) => setField('id_batiment', e.target.value)} disabled={!form.id_etablissement}>
              <option value="">{form.id_etablissement ? '-- Choisir un batiment --' : '-- Choisir un etablissement d\'abord --'}</option>
              {filteredBatiments.map((b) => {
                const batId = b.idBatiment ?? b.id_batiment;
                return (
                  <option key={batId} value={batId}>{b.nom}</option>
                );
              })}
            </select>
            {errors.id_batiment ? <span style={errStyle}>{errors.id_batiment}</span> : null}
          </label>

          <label style={labelStyle}>
            Description
            <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={form.description} onChange={(e) => setField('description', e.target.value)} />
          </label>

          <label style={labelStyle}>
            Lettre nomination chef
            <input type="file" onChange={(e) => setField('lettre_nomination_chef', e.target.files?.[0] || null)} />
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          <button style={secBtn} onClick={onClose}>Annuler</button>
          <button style={priBtn} onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState('closed');
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const servicesQ = useQuery({ queryKey: ['users', 'services'], queryFn: () => getServices(), staleTime: 10000 });
  const etabQ = useQuery({ queryKey: ['users', 'etablissements'], queryFn: () => getEtablissements(), staleTime: 60000 });
  const batQ = useQuery({ queryKey: ['users', 'batiments'], queryFn: () => getBatiments(), staleTime: 60000 });

  const createM = useMutation({ mutationFn: createService, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users', 'services'] }); close(); } });
  const updateM = useMutation({ mutationFn: ({ id, data }) => updateService(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users', 'services'] }); close(); } });
  const deleteM = useMutation({ mutationFn: deleteService, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users', 'services'] }) });

  const rows = useMemo(() => servicesQ.data?.data || [], [servicesQ.data?.data]);
  const etablissements = useMemo(() => etabQ.data?.data || [], [etabQ.data?.data]);
  const batiments = useMemo(() => batQ.data?.data || [], [batQ.data?.data]);

  const batMap = useMemo(() => { const m = {}; batiments.forEach((b) => { m[b.idBatiment ?? b.id_batiment] = b; }); return m; }, [batiments]);
  const etabMap = useMemo(() => { const m = {}; etablissements.forEach((e) => { m[e.idEtablissement ?? e.id_etablissement] = e; }); return m; }, [etablissements]);

  function getBatName(id) { return batMap[id]?.nom || '—'; }
  function getEtabForBat(id) {
    const bat = batMap[id];
    if (!bat) return '—';
    const eid = bat.idEtablissement ?? bat.id_etablissement;
    return etabMap[eid]?.nom || '—';
  }

  function open(svc) { setError(''); setSelected(svc); setMode(svc ? 'edit' : 'create'); }
  function close() { setMode('closed'); setSelected(null); setError(''); }

  async function submit(formData, { setErrors }) {
    setError('');
    try {
      if (mode === 'create') await createM.mutateAsync(formData);
      else if (selected) {
        const id = selected.idService ?? selected.id_service;
        await updateM.mutateAsync({ id, data: formData });
      }
    } catch (err) {
      const d = err?.response?.data;
      if (d && typeof d === 'object') {
        const mapped = {};
        Object.entries(d).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : String(v); });
        setErrors(mapped);
      } else setError("Erreur lors de l'enregistrement.");
    }
  }

  function handleDelete(svc) {
    const id = svc.idService ?? svc.id_service;
    const name = svc.nomService ?? svc.nom_service;
    if (!window.confirm(`Supprimer le service "${name}" ?`)) return;
    deleteM.mutate(id);
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Services</h1>
        <button style={priBtn} onClick={() => open(null)}>Nouveau service</button>
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
        {servicesQ.isLoading ? (
          <div style={{ padding: 14 }}><div style={{ height: 160, borderRadius: 8, background: '#f3f4f6' }} /></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                <th style={thS}>Nom service</th>
                <th style={thS}>Etablissement</th>
                <th style={thS}>Batiment</th>
                <th style={thS}>Description</th>
                <th style={thS}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 16, color: '#6b7280' }}>Aucun service.</td></tr>
              ) : rows.map((svc) => {
                const svcId = svc.idService ?? svc.id_service;
                const batId = svc.idBatiment ?? svc.id_batiment;
                return (
                  <tr key={svcId} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={tdS}>{svc.nomService ?? svc.nom_service}</td>
                    <td style={tdS}>{getEtabForBat(batId)}</td>
                    <td style={tdS}>{getBatName(batId)}</td>
                    <td style={tdS}>{svc.description || '—'}</td>
                    <td style={tdS}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={secBtn} onClick={() => open(svc)}>Edit</button>
                        <button style={secBtn} onClick={() => handleDelete(svc)}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {error ? <div style={{ color: '#b91c1c', fontSize: 13 }}>{error}</div> : null}

      {(mode === 'create' || mode === 'edit') && (
        <ServiceFormModal
          mode={mode} initialData={selected}
          etablissements={etablissements} batiments={batiments}
          onClose={close} onSubmit={submit}
          isSubmitting={createM.isPending || updateM.isPending}
        />
      )}
    </div>
  );
}

const backdropStyle = { position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)', display: 'grid', placeItems: 'center', zIndex: 90 };
const modalStyle = { width: 'min(620px, 94vw)', background: '#fff', borderRadius: 12, padding: 18 };
const labelStyle = { display: 'grid', gap: 6, fontSize: 13, color: '#374151' };
const inputStyle = { border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px', fontSize: 14 };
const errStyle = { color: '#b91c1c', fontSize: 12 };
const priBtn = { border: 'none', borderRadius: 8, padding: '8px 12px', background: '#111827', color: '#fff', cursor: 'pointer' };
const secBtn = { border: '1px solid #d1d5db', borderRadius: 8, padding: '6px 10px', background: '#fff', cursor: 'pointer' };
const thS = { padding: 10, fontWeight: 600 };
const tdS = { padding: 10, verticalAlign: 'top' };
