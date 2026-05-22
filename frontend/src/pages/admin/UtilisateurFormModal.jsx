import { useMemo, useState } from 'react';

const REQUIRED_MESSAGE = 'Ce champ est requis.';

export default function UtilisateurFormModal({
  mode = 'create',
  initialData,
  roles = [],
  services = [],
  fournisseurs = [],
  etablissements = [],
  batiments = [],
  existingUsers = [],
  onClose,
  onSubmit,
  isSubmitting,
}) {
  const isCreate = mode === 'create';

  // Derive initial etablissement/batiment from the user's current service
  const initialServiceId = String(initialData?.id_service?.id_service || initialData?.id_service || '');
  const initialBatimentId = useMemo(() => {
    if (!initialServiceId) return '';
    const svc = services.find((s) => String(s.id_service) === initialServiceId);
    return String(svc?.id_batiment ?? svc?.idBatiment ?? '');
  }, [initialServiceId, services]);
  const initialEtablissementId = useMemo(() => {
    if (!initialBatimentId) return '';
    const bat = batiments.find((b) => String(b.idBatiment ?? b.id_batiment) === initialBatimentId);
    const etabId = bat?.idEtablissement ?? bat?.id_etablissement?.id_etablissement ?? bat?.id_etablissement;
    return String(etabId || '');
  }, [initialBatimentId, batiments]);

  const [form, setForm] = useState(() => ({
    nom_complet: initialData?.nom_complet || '',
    email: initialData?.email || '',
    password: '',
    titre_poste: initialData?.titre_poste || '',
    id_role: String(initialData?.id_role?.id_role || initialData?.id_role || ''),
    id_etablissement: initialEtablissementId,
    id_batiment: initialBatimentId,
    id_service: initialServiceId,
    id_fournisseur: String(initialData?.fournisseur_profile?.id_fournisseur || ''),
  }));
  const [errors, setErrors] = useState({});

  const selectedRole = useMemo(
    () => roles.find((item) => String(item.id_role) === String(form.id_role)),
    [roles, form.id_role]
  );
  const isFournisseurRole = selectedRole?.nom_role === 'fournisseur';

  // Cascading filters
  const filteredBatiments = useMemo(() => {
    if (!form.id_etablissement) return [];
    return batiments.filter((b) => {
      const etabId = b.idEtablissement ?? b.id_etablissement?.id_etablissement ?? b.id_etablissement;
      return String(etabId) === String(form.id_etablissement);
    });
  }, [batiments, form.id_etablissement]);

  const filteredServices = useMemo(() => {
    if (!form.id_batiment) return [];
    return services.filter((s) => String(s.id_batiment ?? s.idBatiment ?? '') === String(form.id_batiment));
  }, [services, form.id_batiment]);

  const duplicateEmail = useMemo(() => {
    const trimmed = form.email.trim().toLowerCase();
    if (!trimmed) return false;
    return existingUsers.some((user) => {
      if (initialData?.id_utilisateur && user.id_utilisateur === initialData.id_utilisateur) return false;
      return String(user.email || '').toLowerCase() === trimmed;
    });
  }, [existingUsers, form.email, initialData?.id_utilisateur]);

  function setField(name, value) {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // Cascade resets
      if (name === 'id_etablissement') {
        next.id_batiment = '';
        next.id_service = '';
      }
      if (name === 'id_batiment') {
        next.id_service = '';
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const next = {};

    if (!form.nom_complet.trim()) next.nom_complet = REQUIRED_MESSAGE;
    if (!form.email.trim()) next.email = REQUIRED_MESSAGE;
    if (duplicateEmail) next.email = 'Cet email est déjà utilisé.';
    if (!form.titre_poste.trim()) next.titre_poste = REQUIRED_MESSAGE;
    if (!form.id_role) next.id_role = REQUIRED_MESSAGE;

    if (isCreate && !form.password.trim()) {
      next.password = REQUIRED_MESSAGE;
    }

    if (isFournisseurRole) {
      if (!form.id_fournisseur) next.id_fournisseur = REQUIRED_MESSAGE;
    } else {
      if (!form.id_etablissement) next.id_etablissement = 'Veuillez choisir un établissement.';
      if (!form.id_batiment) next.id_batiment = 'Veuillez choisir un bâtiment.';
      if (!form.id_service) next.id_service = REQUIRED_MESSAGE;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    const payload = {
      nom_complet: form.nom_complet.trim(),
      email: form.email.trim(),
      titre_poste: form.titre_poste.trim(),
      id_role: Number(form.id_role),
      actif: initialData?.actif ?? true,
    };

    if (isCreate && form.password.trim()) {
      payload.password = form.password;
    }

    if (isFournisseurRole) {
      payload.id_fournisseur = Number(form.id_fournisseur);
      payload.id_service = null;
    } else {
      payload.id_service = Number(form.id_service);
    }

    await onSubmit?.(payload, { setErrors });
  }

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(event) => event.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{isCreate ? 'Nouvel utilisateur' : 'Modifier utilisateur'}</h3>

        <div style={{ display: 'grid', gap: 10 }}>
          <label style={labelStyle}>
            Nom complet
            <input
              style={inputStyle}
              value={form.nom_complet}
              onChange={(e) => setField('nom_complet', e.target.value)}
            />
            {errors.nom_complet ? <span style={errorTextStyle}>{errors.nom_complet}</span> : null}
          </label>

          <label style={labelStyle}>
            Email
            <input style={inputStyle} value={form.email} onChange={(e) => setField('email', e.target.value)} />
            {errors.email ? <span style={errorTextStyle}>{errors.email}</span> : null}
          </label>

          {isCreate ? (
            <label style={labelStyle}>
              Mot de passe
              <input
                style={inputStyle}
                type="password"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
              />
              {errors.password ? <span style={errorTextStyle}>{errors.password}</span> : null}
            </label>
          ) : null}

          <label style={labelStyle}>
            Titre poste
            <input
              style={inputStyle}
              value={form.titre_poste}
              onChange={(e) => setField('titre_poste', e.target.value)}
            />
            {errors.titre_poste ? <span style={errorTextStyle}>{errors.titre_poste}</span> : null}
          </label>

          <label style={labelStyle}>
            Rôle
            <select style={inputStyle} value={form.id_role} onChange={(e) => setField('id_role', e.target.value)}>
              <option value="">Sélectionner</option>
              {roles.map((role) => (
                <option key={role.id_role} value={role.id_role}>
                  {role.nom_role}
                </option>
              ))}
            </select>
            {errors.id_role ? <span style={errorTextStyle}>{errors.id_role}</span> : null}
          </label>

          {isFournisseurRole ? (
            <label style={labelStyle}>
              Fournisseur
              <select
                style={inputStyle}
                value={form.id_fournisseur}
                onChange={(e) => setField('id_fournisseur', e.target.value)}
              >
                <option value="">Sélectionner</option>
                {fournisseurs.map((fournisseur) => (
                  <option key={fournisseur.id_fournisseur} value={fournisseur.id_fournisseur}>
                    {fournisseur.nom_societe}
                  </option>
                ))}
              </select>
              {errors.id_fournisseur ? <span style={errorTextStyle}>{errors.id_fournisseur}</span> : null}
            </label>
          ) : (
            <>
              {/* ── Cascading: Établissement → Bâtiment → Service ── */}
              <label style={labelStyle}>
                Établissement
                <select
                  style={inputStyle}
                  value={form.id_etablissement}
                  onChange={(e) => setField('id_etablissement', e.target.value)}
                >
                  <option value="">-- Choisir un établissement --</option>
                  {etablissements.map((et) => {
                    const etabId = et.idEtablissement ?? et.id_etablissement;
                    return (
                      <option key={etabId} value={etabId}>
                        {et.nom}
                      </option>
                    );
                  })}
                </select>
                {errors.id_etablissement ? <span style={errorTextStyle}>{errors.id_etablissement}</span> : null}
              </label>

              <label style={labelStyle}>
                Bâtiment
                <select
                  style={inputStyle}
                  value={form.id_batiment}
                  onChange={(e) => setField('id_batiment', e.target.value)}
                  disabled={!form.id_etablissement}
                >
                  <option value="">
                    {form.id_etablissement ? '-- Choisir un bâtiment --' : '-- Sélectionner un établissement d\'abord --'}
                  </option>
                  {filteredBatiments.map((b) => {
                    const batId = b.idBatiment ?? b.id_batiment;
                    return (
                      <option key={batId} value={batId}>
                        {b.nom}
                      </option>
                    );
                  })}
                </select>
                {errors.id_batiment ? <span style={errorTextStyle}>{errors.id_batiment}</span> : null}
              </label>

              <label style={labelStyle}>
                Service
                <select
                  style={inputStyle}
                  value={form.id_service}
                  onChange={(e) => setField('id_service', e.target.value)}
                  disabled={!form.id_batiment}
                >
                  <option value="">
                    {form.id_batiment ? '-- Choisir un service --' : '-- Sélectionner un bâtiment d\'abord --'}
                  </option>
                  {filteredServices.map((service) => {
                    const svcId = service.id_service ?? service.idService;
                    return (
                      <option key={svcId} value={svcId}>
                        {service.nom_service}
                      </option>
                    );
                  })}
                </select>
                {errors.id_service ? <span style={errorTextStyle}>{errors.id_service}</span> : null}
              </label>
            </>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          <button style={secondaryButton} onClick={onClose}>Annuler</button>
          <button style={primaryButton} onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

const backdropStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(17,24,39,0.45)',
  display: 'grid',
  placeItems: 'center',
  zIndex: 90,
};

const modalStyle = {
  width: 'min(640px, 94vw)',
  background: '#fff',
  borderRadius: 12,
  padding: 18,
};

const labelStyle = {
  display: 'grid',
  gap: 6,
  fontSize: 13,
  color: '#374151',
};

const inputStyle = {
  border: '1px solid #d1d5db',
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 14,
};

const errorTextStyle = {
  color: '#b91c1c',
  fontSize: 12,
};

const primaryButton = {
  border: 'none',
  borderRadius: 8,
  padding: '8px 12px',
  background: '#111827',
  color: '#fff',
  cursor: 'pointer',
};

const secondaryButton = {
  border: '1px solid #d1d5db',
  borderRadius: 8,
  padding: '8px 12px',
  background: '#fff',
  cursor: 'pointer',
};
