
import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  X,
  Package,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";
import api from "../services/api";
import "./Equipment.css";

const STATUSES = ["Available", "Assigned", "Maintenance", "Retired"];

const EMPTY_FORM = {
  name: "",
  serialNumber: "",
  brand: "",
  model: "",
  categoryId: "",
  status: "Available",
  purchasePrice: "",
  purchaseDate: "",
  warrantyEndDate: "",
  specifications: "{}",
  tags: "",
};

const STATUS_LABELS = {
  Available: "Disponible",
  Assigned: "Affecté",
  Maintenance: "En maintenance",
  Retired: "Retiré",
};

function extractList(data, keys) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("fr-FR");
}

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString("fr-FR")} TND`;
}

export default function Equipment() {
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [filters, setFilters] = useState({
    q: "",
    status: "",
    categoryId: "",
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  const [modal, setModal] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCategories = useCallback(async () => {
    try {
      const response = await api.get("/categories");
      setCategories(
        extractList(response.data, ["categories", "categoriesList"])
      );
    } catch {
      setCategories([]);
    }
  }, []);

  const loadEquipment = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        limit: 10,
      };

      if (filters.q.trim()) params.q = filters.q.trim();
      if (filters.status) params.status = filters.status;
      if (filters.categoryId) params.categoryId = filters.categoryId;

      const response = await api.get("/equipment", { params });

      setEquipment(response.data.equipment || []);
      setPagination(
        response.data.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        }
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Impossible de charger les équipements."
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadEquipment(1);
  }, [loadEquipment]);

  const showMessage = (message) => {
    setSuccess(message);
    window.setTimeout(() => setSuccess(""), 3000);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setModal("form");
  };

  const openEdit = (item) => {
    setEditingId(item._id);

    setForm({
      name: item.name || "",
      serialNumber: item.serialNumber || "",
      brand: item.brand || "",
      model: item.model || "",
      categoryId: item.categoryId?._id || item.categoryId || "",
      status: item.status || "Available",
      purchasePrice: item.purchasePrice ?? "",
      purchaseDate: item.purchaseDate
        ? item.purchaseDate.substring(0, 10)
        : "",
      warrantyEndDate: item.warrantyEndDate
        ? item.warrantyEndDate.substring(0, 10)
        : "",
      specifications: JSON.stringify(item.specifications || {}, null, 2),
      tags: (item.tags || []).join(", "),
    });

    setError("");
    setModal("form");
  };

  const openDetails = async (item) => {
    setError("");

    try {
      const response = await api.get(`/equipment/${item._id}`);
      setSelectedEquipment(response.data.equipment);
      setModal("details");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Impossible de charger les détails."
      );
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    let specifications;

    try {
      specifications = JSON.parse(form.specifications || "{}");

      if (
        specifications === null ||
        Array.isArray(specifications) ||
        typeof specifications !== "object"
      ) {
        throw new Error("Les caractéristiques doivent être un objet JSON.");
      }
    } catch (err) {
      setError(err.message || "Format JSON des caractéristiques invalide.");
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      serialNumber: form.serialNumber.trim(),
      brand: form.brand.trim(),
      model: form.model.trim(),
      categoryId: form.categoryId,
      purchasePrice: Number(form.purchasePrice),
      specifications,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    if (form.purchaseDate) payload.purchaseDate = form.purchaseDate;
    if (form.warrantyEndDate) {
      payload.warrantyEndDate = form.warrantyEndDate;
    }

    if (editingId) {
      payload.status = form.status;
    }

    try {
      if (editingId) {
        await api.put(`/equipment/${editingId}`, payload);
        showMessage("Équipement modifié avec succès.");
      } else {
        await api.post("/equipment", payload);
        showMessage("Équipement ajouté avec succès.");
      }

      setModal("");
      setForm(EMPTY_FORM);
      setEditingId(null);
      await loadEquipment(editingId ? pagination.page : 1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Une erreur est survenue lors de l'enregistrement."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer l'équipement "${item.name}" ?`
    );

    if (!confirmed) return;

    setError("");

    try {
      await api.delete(`/equipment/${item._id}`);
      showMessage("Équipement supprimé avec succès.");

      const nextPage =
        equipment.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;

      await loadEquipment(nextPage);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Impossible de supprimer cet équipement."
      );
    }
  };

  const closeModal = () => {
    setModal("");
    setSelectedEquipment(null);
    setError("");
  };

  return (
    <div className="equipment-page">
      <div className="equipment-heading">
        <div>
          <span className="equipment-eyebrow">GESTION DU PARC INFORMATIQUE</span>
          <h1>Équipements</h1>
          <p>Gérez et suivez l'ensemble de vos équipements informatiques.</p>
        </div>

        <button className="equipment-primary-btn" onClick={openCreate}>
          <Plus size={18} />
          Ajouter un équipement
        </button>
      </div>

      <div className="equipment-summary">
        <div className="equipment-summary-icon">
          <Package size={23} />
        </div>
        <div>
          <span>Total des équipements</span>
          <strong>{pagination.total.toLocaleString("fr-FR")}</strong>
        </div>
      </div>

      {success && (
        <div className="equipment-success">
          {success}
        </div>
      )}

      {error && !modal && (
        <div className="equipment-alert">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="equipment-toolbar">
        <div className="equipment-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Rechercher par nom, marque, modèle ou numéro de série..."
            value={filters.q}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                q: event.target.value,
              }))
            }
          />
        </div>

        <select
          value={filters.status}
          onChange={(event) =>
            setFilters((previous) => ({
              ...previous,
              status: event.target.value,
            }))
          }
        >
          <option value="">Tous les statuts</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>

        <select
          value={filters.categoryId}
          onChange={(event) =>
            setFilters((previous) => ({
              ...previous,
              categoryId: event.target.value,
            }))
          }
        >
          <option value="">Toutes les catégories</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>

        <button
          className="equipment-icon-btn"
          onClick={() => loadEquipment(1)}
          title="Actualiser"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="equipment-table-card">
        <div className="equipment-table-header">
          <div>
            <h2>Liste des équipements</h2>
            <p>{pagination.total} résultat(s)</p>
          </div>
        </div>

        {loading ? (
          <div className="equipment-state">
            <LoaderCircle className="equipment-spinner" size={28} />
            <span>Chargement des équipements...</span>
          </div>
        ) : equipment.length === 0 ? (
          <div className="equipment-state">
            <Package size={35} />
            <strong>Aucun équipement trouvé</strong>
            <span>Modifiez vos filtres ou ajoutez un équipement.</span>
          </div>
        ) : (
          <>
            <div className="equipment-table-wrapper">
              <table className="equipment-table">
                <thead>
                  <tr>
                    <th>Équipement</th>
                    <th>N° de série</th>
                    <th>Catégorie</th>
                    <th>Statut</th>
                    <th>Prix</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {equipment.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <div className="equipment-name-cell">
                          <div className="equipment-item-icon">
                            <Package size={18} />
                          </div>
                          <div>
                            <strong>{item.name}</strong>
                            <span>
                              {[item.brand, item.model]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>{item.serialNumber}</td>

                      <td>
                        {item.categoryId?.name || "—"}
                      </td>

                      <td>
                        <span
                          className={`equipment-status status-${item.status?.toLowerCase()}`}
                        >
                          {STATUS_LABELS[item.status] || item.status}
                        </span>
                      </td>

                      <td>{formatPrice(item.purchasePrice)}</td>

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
                            title="Supprimer"
                            onClick={() => handleDelete(item)}
                          >
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
                  onClick={() => loadEquipment(pagination.page - 1)}
                >
                  <ChevronLeft size={18} />
                </button>

                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadEquipment(pagination.page + 1)}
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
            onClick={(event) => event.stopPropagation()}
          >
            <div className="equipment-modal-header">
              <div>
                <h2>
                  {editingId ? "Modifier l'équipement" : "Nouvel équipement"}
                </h2>
                <p>Renseignez les informations de l'équipement.</p>
              </div>
              <button onClick={closeModal}>
                <X size={21} />
              </button>
            </div>

            {error && (
              <div className="equipment-alert">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="equipment-form-grid">
                <label>
                  Nom de l'équipement *
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label>
                  Numéro de série *
                  <input
                    name="serialNumber"
                    value={form.serialNumber}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label>
                  Marque
                  <input
                    name="brand"
                    value={form.brand}
                    onChange={handleFormChange}
                  />
                </label>

                <label>
                  Modèle
                  <input
                    name="model"
                    value={form.model}
                    onChange={handleFormChange}
                  />
                </label>

                <label>
                  Catégorie *
                  <select
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Prix d'achat (TND) *
                  <input
                    name="purchasePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.purchasePrice}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label>
                  Date d'achat
                  <input
                    name="purchaseDate"
                    type="date"
                    value={form.purchaseDate}
                    onChange={handleFormChange}
                  />
                </label>

                <label>
                  Fin de garantie
                  <input
                    name="warrantyEndDate"
                    type="date"
                    value={form.warrantyEndDate}
                    onChange={handleFormChange}
                  />
                </label>

                {editingId && (
                  <label>
                    Statut
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleFormChange}
                      disabled={form.status === "Assigned"}
                    >
                      {STATUSES.filter((status) => status !== "Assigned").map(
                        (status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                )}

                <label className="equipment-full-field">
                  Caractéristiques (JSON)
                  <textarea
                    name="specifications"
                    rows="4"
                    value={form.specifications}
                    onChange={handleFormChange}
                    placeholder='{"RAM": "16 GB", "CPU": "Intel Core i7"}'
                  />
                </label>

                <label className="equipment-full-field">
                  Tags (séparés par des virgules)
                  <input
                    name="tags"
                    value={form.tags}
                    onChange={handleFormChange}
                    placeholder="ordinateur, portable, informatique"
                  />
                </label>
              </div>

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
                  disabled={saving}
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "details" && selectedEquipment && (
        <div className="equipment-modal-overlay" onClick={closeModal}>
          <div
            className="equipment-modal equipment-details-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="equipment-modal-header">
              <div>
                <h2>Détails de l'équipement</h2>
                <p>Informations complètes sur cet équipement.</p>
              </div>
              <button onClick={closeModal}>
                <X size={21} />
              </button>
            </div>

            <div className="equipment-details-grid">
              <div>
                <span>Nom</span>
                <strong>{selectedEquipment.name}</strong>
              </div>
              <div>
                <span>Numéro de série</span>
                <strong>{selectedEquipment.serialNumber}</strong>
              </div>
              <div>
                <span>Marque</span>
                <strong>{selectedEquipment.brand || "—"}</strong>
              </div>
              <div>
                <span>Modèle</span>
                <strong>{selectedEquipment.model || "—"}</strong>
              </div>
              <div>
                <span>Catégorie</span>
                <strong>{selectedEquipment.categoryId?.name || "—"}</strong>
              </div>
              <div>
                <span>Statut</span>
                <strong>
                  {STATUS_LABELS[selectedEquipment.status] ||
                    selectedEquipment.status}
                </strong>
              </div>
              <div>
                <span>Prix d'achat</span>
                <strong>{formatPrice(selectedEquipment.purchasePrice)}</strong>
              </div>
              <div>
                <span>Date d'achat</span>
                <strong>{formatDate(selectedEquipment.purchaseDate)}</strong>
              </div>
              <div>
                <span>Fin de garantie</span>
                <strong>{formatDate(selectedEquipment.warrantyEndDate)}</strong>
              </div>
              <div>
                <span>Employé actuel</span>
                <strong>
                  {selectedEquipment.currentEmployeeId
                    ? `${selectedEquipment.currentEmployeeId.firstName} ${selectedEquipment.currentEmployeeId.lastName}`
                    : "Non affecté"}
                </strong>
              </div>
            </div>

            <div className="equipment-details-section">
  <h3>Caractéristiques techniques</h3>

  {selectedEquipment.specifications &&
  Object.keys(selectedEquipment.specifications).length > 0 ? (
    <div className="equipment-specifications">
  {Object.entries(selectedEquipment.specifications).map(
    ([key, value]) => (
      <div className="equipment-specification" key={key}>
        <span>
          {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()} :
        </span>
        <strong>{String(value ?? "—")}</strong>
      </div>
    )
  )}
</div>
  ) : (
    <p className="equipment-muted">
      Aucune caractéristique technique renseignée.
    </p>
  )}
</div>

            <div className="equipment-details-section">
              <h3>Historique des affectations</h3>

              {selectedEquipment.assignmentHistory?.length ? (
                <div className="equipment-history">
                  {selectedEquipment.assignmentHistory.map((assignment, index) => (
                    <div key={assignment._id || index}>
                      <strong>
                        {assignment.employeeId
                          ? `${assignment.employeeId.firstName} ${assignment.employeeId.lastName}`
                          : "Employé inconnu"}
                      </strong>
                      <span>
                        Affecté le : {formatDate(assignment.assignedAt)}
                      </span>
                      <span>
                        Retourné le : {formatDate(assignment.returnedAt)}
                      </span>
                      {assignment.notes && <p>{assignment.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="equipment-muted">Aucun historique disponible.</p>
              )}
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
                onClick={() => {
                  const item = selectedEquipment;
                  setModal("");
                  openEdit(item);
                }}
              >
                <Pencil size={16} />
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
