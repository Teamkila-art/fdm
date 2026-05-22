import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createBatiment,
  deleteBatiment,
  getBatiments,
  getEtablissements,
  updateBatiment,
} from '../../api/users';

function BatimentFormModal({ mode, initialData, etablissements, onClose, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({
    nom: initialData?.nom || '',
    id_etablissement: String(initialData?.idEtablissement ?? initialData?.id_etablissement ?? ''),
  });
  const [errors, setErrors] = useState({});

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleSave() {
    const nextErrors = {};
    if (!form.nom.trim()) nextErrors.nom = 'Ce champ est requis.';
    if (!form.id_etablissement) nextErrors.id_etablissement = 'Veuillez choisir un etablissement.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      nom: form.nom.trim(),
      id_etablissement: Number(form.id_etablissement),
    };

    await onSubmit?.(payload, { setErrors });
  }

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{mode === 'create' ? 'Nouveau bâtiment' : 'Modifier bâtiment'}</h3>

        <div style={{ display: 'grid', gap: 10 }}>
          <label style={labelStyle}>
            Nom du bâtiment
            <input style={inputStyle} value={form.nom} onChange={(e) => setField('nom', e.target.value)} />
            {errors.nom ? <span style={errStyle}>{errors.nom}</span> : null}
          </label>

          <label style={labelStyle}>
            Etablissement
            <select style={inputStyle} value={form.id_etablissement} onChange={(e) => setField('id_etablissement', e.target.value)}>
              <option value="">-- Choisir un etablissement --</option>
              {etablissements.map((et) => {
                const etabId = et.idEtablissement ?? et.id_etablissement;
                return (
                  <option key={etabId} value={etabId}>{et.nom}</option>
                );
              })}
            </select>
            {errors.id_etablissement ? <span style={errStyle}>{errors.id_etablissement}</span> : null}
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

export default function BatimentsPage() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState('closed');
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const etabQ = useQuery({ queryKey: ['users', 'etablissements'], queryFn: () => getEtablissements(), staleTime: 60000 });
  const batQ = useQuery({ queryKey: ['users', 'batiments'], queryFn: () => getBatiments(), staleTime: 60000 });

  const createM = useMutation({
    mutationFn: createBatiment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'batiments'] });
      close();
    },
  });

  const updateM = useMutation({
    mutationFn: ({ id, data }) => updateBatiment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'batiments'] });
      close();
    },
  });

  const deleteM = useMutation({
    mutationFn: deleteBatiment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users', 'batiments'] }),
  });

  const etablissements = useMemo(() => etabQ.data?.data || [], [etabQ.data?.data]);
  const batiments = useMemo(() => batQ.data?.data || [], [batQ.data?.data]);

  const etabMap = useMemo(() => {
    const m = {};
    etablissements.forEach((e) => {
      m[e.idEtablissement ?? e.id_etablissement] = e;
    });
    return m;
  }, [etablissements]);

  function getEtabName(b) {
    const etabId = b.idEtablissement ?? b.id_etablissement;
    return etabMap[etabId]?.nom || '—';
  }

  function open(bat) {
    setError('');
    setSelected(bat);
    setMode(bat ? 'edit' : 'create');
  }

  function close() {
    setMode('closed');
    setSelected(null);
    setError('');
  }

  async function submit(payload, { setErrors }) {
    setError('');
    try {
      if (mode === 'create') {
        await createM.mutateAsync(payload);
      } else if (selected) {
        const id = selected.idBatiment ?? selected.id_batiment;
        await updateM.mutateAsync({ id, data: payload });
      }
    } catch (err) {
      const d = err?.response?.data;
      if (d && typeof d === 'object') {
        const mapped = {};
        Object.entries(d).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(mapped);
      } else {
        setError("Erreur lors de l'enregistrement.");
      }
    }
  }

  function handleDelete(bat) {
    const id = bat.idBatiment ?? bat.id_batiment;
    if (!window.confirm(`Supprimer le bâtiment "${bat.nom}" ?`)) return;
    deleteM.mutate(id);
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Bâtiments</h1>
        <button style={priBtn} onClick={() => open(null)}>Nouveau bâtiment</button>
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
        {batQ.isLoading ? (
          <div style={{ padding: 14 }}>
            <div style={{ height: 160, borderRadius: 8, background: '#f3f4f6' }} />
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                <th style={thS}>Nom bâtiment</th>
                <th style={thS}>Établissement</th>
                <th style={thS}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {batiments.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: 16, color: '#6b7280' }}>Aucun bâtiment.</td>
                </tr>
              ) : (
                batiments.map((b) => {
                  const batId = b.idBatiment ?? b.id_batiment;
                  return (
                    <tr key={batId} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={tdS}>{b.nom}</td>
                      <td style={tdS}>{getEtabName(b)}</td>
                      <td style={tdS}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button style={secBtn} onClick={() => open(b)}>Edit</button>
                          <button style={secBtn} onClick={() => handleDelete(b)}>Supprimer</button>
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

      {error ? <div style={{ color: '#b91c1c', fontSize: 13 }}>{error}</div> : null}

      {(mode === 'create' || mode === 'edit') && (
        <BatimentFormModal
          mode={mode}
          initialData={selected}
          etablissements={etablissements}
          onClose={close}
          onSubmit={submit}
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
