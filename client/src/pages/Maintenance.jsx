import { useCallback, useEffect, useState } from "react";
import {
  Search, Plus, RefreshCw, Eye, Pencil, Trash2, X,
  Wrench, ChevronLeft, ChevronRight, AlertCircle,
  LoaderCircle, CalendarDays
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Equipment.css";

const TYPES = ["Préventive", "Corrective"];
const STATUSES = ["Planifiée", "En cours", "Terminée", "Annulée"];

const STATUS_LABELS = {
  "Planifiée": "Planifiée",
  "En cours": "En cours",
  "Terminée": "Terminée",
  "Annulée": "Annulée"
};

const EMPTY_FORM = {
  equipmentId: "",
  technicianId: "",
  typeMaintenance: "Préventive",
  description: "",
  dateMaintenance: "",
  cout: "0",
  statut: "Planifiée",
  resultat: "",
  prochaineDateMaintenance: ""
};

function extractList(data, keys) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("fr-FR") : "—";
}

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString("fr-FR")} TND`;
}

function dateInput(value) {
  return value ? new Date(value).toISOString().substring(0, 10) : "";
}

export default function Maintenance() {
  const { user } = useAuth();
  const [maintenanceToDelete, setMaintenanceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [maintenances, setMaintenances] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [technicianSearch, setTechnicianSearch] = useState("");

  const [equipmentResults, setEquipmentResults] = useState([]);
  const [showEquipmentResults, setShowEquipmentResults] = useState(false);
  const [showTechnicianResults, setShowTechnicianResults] = useState(false);
  
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });

  const [filters, setFilters] = useState({
    typeMaintenance: "",
    statut: ""
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);

  const [modal, setModal] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const searchEquipment = async value => {
  setEquipmentSearch(value);
  setShowEquipmentResults(true);

  if (!value.trim()) {
    setEquipmentResults([]);
    return;
  }

  try {
    const response = await api.get("/equipment/search", {
      params: {
        q: value.trim(),
        page: 1,
        limit: 100
      }
    });

    const results = (response.data.equipment || []).filter(item =>
      item.serialNumber?.toLowerCase().includes(value.trim().toLowerCase()) &&
      !["Assigned", "Retired"].includes(item.status)
    );

    setEquipmentResults(results);
  } catch (err) {
    console.error("Erreur recherche équipement :", err);
    setEquipmentResults([]);
  }
};

const selectEquipment = item => {
  setForm(previous => ({
    ...previous,
    equipmentId: item._id
  }));

  setEquipmentSearch(item.serialNumber);
  setShowEquipmentResults(false);
};

const selectTechnician = item => {
  setForm(previous => ({
    ...previous,
    technicianId: item._id
  }));

  setTechnicianSearch(`${item.matricule} — ${item.firstName} ${item.lastName}`);
  setShowTechnicianResults(false);
};

const filteredTechnicians = technicians.filter(item =>
  item.matricule?.includes(technicianSearch.trim())
);

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true);

    try {
      const equipmentResponse = await api.get("/equipment", {
        params: { page: 1, limit: 100 }
      });

      const availableEquipment = extractList(
        equipmentResponse.data,
        ["equipment", "equipments"]
      ).filter(item => !["Assigned", "Retired"].includes(item.status));

      setEquipment(availableEquipment);

      if (user?.role === "technician") {
        setTechnicians([{
          _id: user.id || user._id,
          matricule: user.matricule,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive
        }]);
      } else {
        const usersResponse = await api.get("/users", {
          params: { page: 1, limit: 100 }
        });

        const users = extractList(usersResponse.data, ["users"]);

        setTechnicians(
          users.filter(item =>
            item.role === "technician" && item.isActive !== false
          )
        );
      }
    } catch (err) {
      console.error("Erreur chargement des options :", err);
      setError(
        err.response?.data?.message ||
        "Impossible de charger les équipements ou les techniciens."
      );
    } finally {
      setOptionsLoading(false);
    }
  }, [user]);

  

  const loadMaintenances = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");

    try {
      const params = { page, limit: 10 };

      if (filters.typeMaintenance) {
        params.typeMaintenance = filters.typeMaintenance;
      }

      if (filters.statut) {
        params.statut = filters.statut;
      }

      const response = await api.get("/maintenances", { params });

      setMaintenances(response.data.maintenances || []);
      setPagination(response.data.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Impossible de charger les maintenances."
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    loadMaintenances(1);
  }, [loadMaintenances]);

  const showMessage = message => {
    setSuccess(message);
    window.setTimeout(() => setSuccess(""), 3000);
  };

  const handleChange = event => {
    const { name, value } = event.target;
    setForm(previous => ({ ...previous, [name]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      technicianId: user?.role === "technician"
        ? (user.id || user._id || "")
        : ""
    });
    setError("");
    setModal("form");
  };

  const openEdit = item => {
    setEditingId(item._id);

    setForm({
      equipmentId: item.equipmentId?._id || "",
      technicianId: item.technicianId?._id || "",
      typeMaintenance: item.typeMaintenance || "Préventive",
      description: item.description || "",
      dateMaintenance: dateInput(item.dateMaintenance),
      cout: item.cout ?? 0,
      statut: item.statut || "Planifiée",
      resultat: item.resultat || "",
      prochaineDateMaintenance: dateInput(item.prochaineDateMaintenance)
    });

    setError("");
    setModal("form");
  };

  const openDetails = async item => {
    setError("");

    try {
      const response = await api.get(`/maintenances/${item._id}`);
      setSelectedMaintenance(response.data.maintenance);
      setModal("details");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Impossible de charger les détails."
      );
    }
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      typeMaintenance: form.typeMaintenance,
      description: form.description.trim(),
      dateMaintenance: form.dateMaintenance,
      cout: Number(form.cout),
      statut: form.statut,
      resultat: form.resultat.trim(),
      prochaineDateMaintenance: form.prochaineDateMaintenance || null
    };

    if (!editingId) {
      payload.equipmentId = form.equipmentId;
      payload.technicianId = form.technicianId;
    }

    try {
      if (editingId) {
        await api.put(`/maintenances/${editingId}`, payload);
        showMessage("Maintenance modifiée avec succès.");
      } else {
        await api.post("/maintenances", payload);
        showMessage("Maintenance créée avec succès.");
      }

      setModal("");
      setEditingId(null);
      setForm(EMPTY_FORM);

      await loadMaintenances(editingId ? pagination.page : 1);
      await loadOptions();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Une erreur est survenue lors de l'enregistrement."
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = item => {
  if (item.statut === "En cours") {
    setError("Une maintenance en cours ne peut pas être supprimée.");
    return;
  }

  setMaintenanceToDelete(item);
};

const handleDelete = async () => {
  if (!maintenanceToDelete) return;

  setDeleting(true);
  setError("");

  try {
    await api.delete(`/maintenances/${maintenanceToDelete._id}`);

    setMaintenanceToDelete(null);
    showMessage("Maintenance supprimée avec succès.");

    const nextPage =
      maintenances.length === 1 && pagination.page > 1
        ? pagination.page - 1
        : pagination.page;

    await loadMaintenances(nextPage);
    await loadOptions();
  } catch (err) {
    setError(
      err.response?.data?.message ||
      "Impossible de supprimer cette maintenance."
    );
  } finally {
    setDeleting(false);
  }
};

  const closeModal = () => {
    setModal("");
    setSelectedMaintenance(null);
    setEditingId(null);
    setError("");
  };

  return (
    <div className="equipment-page">
      <div className="equipment-heading">
        <div>
          <span className="equipment-eyebrow">
            GESTION DU PARC INFORMATIQUE
          </span>
          <h1>Maintenance</h1>
          <p>Planifiez et suivez les interventions sur vos équipements.</p>
        </div>

        <button
          className="equipment-primary-btn"
          onClick={openCreate}
        >
          <Plus size={18} /> Nouvelle maintenance
        </button>
      </div>

      <div className="equipment-summary">
        <div className="equipment-summary-icon">
          <Wrench size={23} />
        </div>
        <div>
          <span>Total des maintenances</span>
          <strong>{pagination.total.toLocaleString("fr-FR")}</strong>
        </div>
      </div>

      {success && (
        <div className="equipment-success">{success}</div>
      )}

      {error && !modal && (
        <div className="equipment-alert">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="equipment-toolbar">
        <select
          value={filters.typeMaintenance}
          onChange={event => setFilters(previous => ({
            ...previous,
            typeMaintenance: event.target.value
          }))}
        >
          <option value="">Tous les types</option>
          {TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <select
          value={filters.statut}
          onChange={event => setFilters(previous => ({
            ...previous,
            statut: event.target.value
          }))}
        >
          <option value="">Tous les statuts</option>
          {STATUSES.map(status => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>

        <button
          className="equipment-icon-btn"
          onClick={() => loadMaintenances(1)}
          title="Actualiser"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="equipment-table-card">
        <div className="equipment-table-header">
          <div>
            <h2>Liste des maintenances</h2>
            <p>{pagination.total} résultat(s)</p>
          </div>
        </div>

        {loading ? (
          <div className="equipment-state">
            <LoaderCircle className="equipment-spinner" size={28} />
            <span>Chargement des maintenances...</span>
          </div>
        ) : maintenances.length === 0 ? (
          <div className="equipment-state">
            <Wrench size={35} />
            <strong>Aucune maintenance trouvée</strong>
            <span>Ajoutez une maintenance ou modifiez vos filtres.</span>
          </div>
        ) : (
          <>
            <div className="equipment-table-wrapper">
              <table className="equipment-table">
                <thead>
                  <tr>
                    <th>Équipement</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Technicien</th>
                    <th>Coût</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {maintenances.map(item => (
                    <tr key={item._id}>
                      <td>
                        <div className="equipment-name-cell">
                          <div className="equipment-item-icon">
                            <Wrench size={18} />
                          </div>
                          <div>
                            <strong>
                              {item.equipmentId?.name || "Équipement inconnu"}
                            </strong>
                            <span>
                              {item.equipmentId?.serialNumber || "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>{item.typeMaintenance}</td>
                      <td>{formatDate(item.dateMaintenance)}</td>

                      <td>
                        {item.technicianId
                          ? `${item.technicianId.firstName} ${item.technicianId.lastName}`
                          : "—"}
                      </td>

                      <td>{formatPrice(item.cout)}</td>

                      <td>
                        <span className={`maintenance-status ${
                          item.statut === "Terminée" ? "maintenance-done" :
                          item.statut === "En cours" ? "maintenance-progress" :
                          item.statut === "Annulée" ? "maintenance-cancelled" :
                          "maintenance-planned"
                        }`}>
                          {item.statut}
                        </span>
                      </td>

                      <td>
                        <div className="equipment-actions">
                          <button
                            title="Détails"
                            onClick={() => openDetails(item)}
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            title="Modifier"
                            onClick={() => openEdit(item)}
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            className="equipment-delete-action"
                            title={
                              item.statut === "En cours"
                                ? "Suppression impossible"
                                : "Supprimer"
                            }
                            disabled={item.statut === "En cours"}
onClick={() => confirmDelete(item)}                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="equipment-pagination">
              <span>
                Page {pagination.page} sur {pagination.totalPages}
              </span>

              <div>
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => loadMaintenances(pagination.page - 1)}
                >
                  <ChevronLeft size={18} />
                </button>

                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadMaintenances(pagination.page + 1)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {modal === "form" && (
        <div className="equipment-modal-overlay" onClick={closeModal}>
          <div
            className="equipment-modal equipment-form-modal"
            onClick={event => event.stopPropagation()}
          >
            <div className="equipment-modal-header">
              <div>
                <h2>
                  {editingId ? "Modifier la maintenance" : "Nouvelle maintenance"}
                </h2>
                <p>Renseignez les informations de l'intervention.</p>
              </div>
              <button onClick={closeModal}><X size={21} /></button>
            </div>

            {error && (
              <div className="equipment-alert">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="equipment-form-grid">
                {!editingId && (
                  <>
                    
                      <label className="maintenance-search-field">
  Numéro de série *
  <input
    type="text"
    value={equipmentSearch}
    placeholder="Rechercher par numéro de série..."
    onChange={event => {
      setForm(previous => ({ ...previous, equipmentId: "" }));
      searchEquipment(event.target.value);
    }}
    onFocus={() => setShowEquipmentResults(true)}
    required={!form.equipmentId}
  />

  {showEquipmentResults && equipmentSearch && (
    <div className="maintenance-search-results">
      {equipmentResults.length > 0 ? (
        equipmentResults.map(item => (
          <button
            type="button"
            key={item._id}
            onClick={() => selectEquipment(item)}
          >
            <strong>{item.serialNumber}</strong>
            <span>{item.name} — {item.brand || ""}</span>
          </button>
        ))
      ) : (
        <p>Aucun équipement trouvé.</p>
      )}
    </div>
  )}
</label>


    <label className="maintenance-search-field">
  Matricule du technicien *
  <input
    type="text"
    value={technicianSearch}
    placeholder="Rechercher par matricule..."
    onChange={event => {
      setTechnicianSearch(event.target.value);
      setForm(previous => ({ ...previous, technicianId: "" }));
      setShowTechnicianResults(true);
    }}
    onFocus={() => setShowTechnicianResults(true)}
    disabled={user?.role === "technician"}
    required={!form.technicianId}
  />

  {showTechnicianResults && user?.role !== "technician" && technicianSearch && (
    <div className="maintenance-search-results">
      {filteredTechnicians.length > 0 ? (
        filteredTechnicians.map(item => (
          <button
            type="button"
            key={item._id}
            onClick={() => selectTechnician(item)}
          >
            <strong>{item.matricule}</strong>
            <span>{item.firstName} {item.lastName}</span>
          </button>
        ))
      ) : (
        <p>Aucun technicien trouvé.</p>
      )}
    </div>
  )}
</label>
                  </>
                )}

                <label>
                  Type de maintenance *
                  <select
                    name="typeMaintenance"
                    value={form.typeMaintenance}
                    onChange={handleChange}
                    required
                  >
                    {TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Date de maintenance *
                  <input
                    type="date"
                    name="dateMaintenance"
                    value={form.dateMaintenance}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Coût (TND) *
                  <input
                    type="number"
                    name="cout"
                    min="0"
                    step="0.01"
                    value={form.cout}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Statut *
                  <select
                    name="statut"
                    value={form.statut}
                    onChange={handleChange}
                    required
                  >
                    {STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label className="equipment-full-field">
                  Description *
                  <textarea
                    name="description"
                    rows="3"
                    value={form.description}
                    onChange={handleChange}
                    required
                    placeholder="Décrivez le problème ou l'intervention..."
                  />
                </label>

                <label className="equipment-full-field">
                  Résultat de l'intervention
                  <textarea
                    name="resultat"
                    rows="3"
                    value={form.resultat}
                    onChange={handleChange}
                    placeholder="Résultat et travaux effectués..."
                  />
                </label>

                <label className="equipment-full-field">
                  Prochaine date de maintenance
                  <input
                    type="date"
                    name="prochaineDateMaintenance"
                    value={form.prochaineDateMaintenance}
                    onChange={handleChange}
                  />
                </label>
              </div>

              {optionsLoading && !editingId && (
                <p className="equipment-muted">
                  Chargement des équipements et techniciens...
                </p>
              )}

              {!editingId && !optionsLoading && equipment.length === 0 && (
                <p className="equipment-muted">
                  Aucun équipement disponible pour une maintenance.
                </p>
              )}

              {!editingId && !optionsLoading && technicians.length === 0 && (
                <p className="equipment-muted">
                  Aucun technicien actif disponible.
                </p>
              )}

              <div className="equipment-modal-footer">
                <button
                  type="button"
                  className="equipment-secondary-btn"
                  onClick={closeModal}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="equipment-primary-btn"
                  disabled={
                    saving ||
                    (!editingId && (
                      optionsLoading ||
                      equipment.length === 0 ||
                      technicians.length === 0
                    ))
                  }
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "details" && selectedMaintenance && (
        <div className="equipment-modal-overlay" onClick={closeModal}>
          <div
            className="equipment-modal equipment-details-modal"
            onClick={event => event.stopPropagation()}
          >
            <div className="equipment-modal-header">
              <div>
                <h2>Détails de la maintenance</h2>
                <p>Informations complètes sur l'intervention.</p>
              </div>
              <button onClick={closeModal}><X size={21} /></button>
            </div>

            <div className="equipment-details-grid">
              <div>
                <span>Équipement</span>
                <strong>{selectedMaintenance.equipmentId?.name || "—"}</strong>
              </div>

              <div>
                <span>Numéro de série</span>
                <strong>{selectedMaintenance.equipmentId?.serialNumber || "—"}</strong>
              </div>

              <div>
                <span>Type</span>
                <strong>{selectedMaintenance.typeMaintenance}</strong>
              </div>

              <div>
                <span>Date</span>
                <strong>{formatDate(selectedMaintenance.dateMaintenance)}</strong>
              </div>

              <div>
                <span>Technicien</span>
                <strong>
                  {selectedMaintenance.technicianId
                    ? `${selectedMaintenance.technicianId.firstName} ${selectedMaintenance.technicianId.lastName}`
                    : "—"}
                </strong>
              </div>

              <div>
                <span>Coût</span>
                <strong>{formatPrice(selectedMaintenance.cout)}</strong>
              </div>

              <div>
                <span>Statut</span>
                <strong>{selectedMaintenance.statut}</strong>
              </div>

              <div>
                <span>Prochaine maintenance</span>
                <strong>
                  {formatDate(selectedMaintenance.prochaineDateMaintenance)}
                </strong>
              </div>
            </div>

            <div className="equipment-details-section">
              <h3>Description</h3>
              <p>{selectedMaintenance.description || "—"}</p>
            </div>

            <div className="equipment-details-section">
              <h3>Résultat de l'intervention</h3>
              <p>{selectedMaintenance.resultat || "Aucun résultat renseigné."}</p>
            </div>

            <div className="equipment-modal-footer">
              <button
                className="equipment-secondary-btn"
                onClick={closeModal}
              >
                Fermer
              </button>

              <button
                className="equipment-primary-btn"
                onClick={() => openEdit(selectedMaintenance)}
              >
                <Pencil size={16} /> Modifier
              </button>
            </div>
          </div>
        </div>
      )}
      {maintenanceToDelete && (
  <div
    className="equipment-modal-overlay"
    onClick={() => !deleting && setMaintenanceToDelete(null)}
  >
    <div
      className="equipment-modal delete-confirm-modal"
      onClick={event => event.stopPropagation()}
    >
      <div className="equipment-modal-header">
        <div>
          <h2>Confirmer la suppression</h2>
          <p>Cette action est irréversible.</p>
        </div>

        <button
          onClick={() => setMaintenanceToDelete(null)}
          disabled={deleting}
        >
          <X size={21} />
        </button>
      </div>

      <div className="delete-confirm-content">
        <div className="delete-confirm-icon">
          <Trash2 size={25} />
        </div>

        <p>
          Voulez-vous vraiment supprimer cette maintenance ?
        </p>

        <strong>
          {maintenanceToDelete.typeMaintenance} —{" "}
          {maintenanceToDelete.equipmentId?.serialNumber || "Équipement"}
        </strong>
      </div>

      <div className="equipment-modal-footer">
        <button
          className="equipment-secondary-btn"
          onClick={() => setMaintenanceToDelete(null)}
          disabled={deleting}
        >
          Annuler
        </button>

        <button
          className="equipment-primary-btn delete-confirm-btn"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? "Suppression..." : "Supprimer"}
        </button>
      </div>
    </div>
  </div>
    )}
    </div>
  );
}
