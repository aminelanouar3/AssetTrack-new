
import { useCallback, useEffect, useState } from "react";
import {
  Search, Plus, RefreshCw, Eye, Pencil, Trash2, X,
  Users, ChevronLeft, ChevronRight, AlertCircle,
  LoaderCircle
} from "lucide-react";
import api from "../services/api";
import "./Equipment.css";

const EMPTY_FORM = {
  matricule: "",
  firstName: "",
  lastName: "",
  department: "",
  position: ""
};

const DEFAULT_PAGINATION = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const [filters, setFilters] = useState({
    q: "",
    department: ""
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [modal, setModal] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Charger tous les départements de la base de données
  const loadDepartments = useCallback(async () => {
    try {
      const firstResponse = await api.get("/employees", {
        params: { page: 1, limit: 100 }
      });

      const firstEmployees = firstResponse.data.employees || [];
      const totalPages = firstResponse.data.pagination?.totalPages || 1;

      let allEmployees = [...firstEmployees];

      // Récupérer les autres pages si nécessaire
      if (totalPages > 1) {
        const remainingRequests = [];

        for (let page = 2; page <= totalPages; page++) {
          remainingRequests.push(
            api.get("/employees", {
              params: { page, limit: 100 }
            })
          );
        }

        const responses = await Promise.all(remainingRequests);

        responses.forEach(response => {
          allEmployees = [
            ...allEmployees,
            ...(response.data.employees || [])
          ];
        });
      }

      const uniqueDepartments = [
        ...new Set(
          allEmployees
            .map(employee => employee.department?.trim())
            .filter(Boolean)
        )
      ].sort((a, b) => a.localeCompare(b, "fr"));

      setDepartments(uniqueDepartments);
    } catch (err) {
      console.error("Erreur chargement départements :", err);
    }
  }, []);

  // Charger les employés avec recherche et filtres
  const loadEmployees = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        limit: 10
      };

      if (filters.q.trim()) {
        params.q = filters.q.trim();
      }

      if (filters.department) {
        params.department = filters.department;
      }

      const response = await api.get("/employees", { params });

      setEmployees(response.data.employees || []);
      setPagination(response.data.pagination || DEFAULT_PAGINATION);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Impossible de charger les employés."
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadEmployees(1);
  }, [loadEmployees]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

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

  const openEdit = (employee) => {
    setEditingId(employee._id);

    setForm({
      matricule: employee.matricule || "",
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      department: employee.department || "",
      position: employee.position || ""
    });

    setError("");
    setModal("form");
  };

  const openDetails = async (employee) => {
    setError("");

    try {
      const response = await api.get(`/employees/${employee._id}`);
      setSelectedEmployee(response.data.employee);
      setModal("details");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Impossible de charger les détails de l'employé."
      );
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm(previous => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      matricule: form.matricule.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      department: form.department.trim(),
      position: form.position.trim()
    };

    if (!/^\d{8}$/.test(payload.matricule)) {
      setError("Le matricule doit contenir exactement 8 chiffres.");
      setSaving(false);
      return;
    }

    try {
      if (editingId) {
        await api.put(`/employees/${editingId}`, payload);
        showMessage("Employé modifié avec succès.");
      } else {
        await api.post("/employees", payload);
        showMessage("Employé ajouté avec succès.");
      }

      setModal("");
      setForm(EMPTY_FORM);
      setEditingId(null);

      await Promise.all([
        loadEmployees(editingId ? pagination.page : 1),
        loadDepartments()
      ]);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Une erreur est survenue lors de l'enregistrement."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (employee) => {
    if (!window.confirm(
      `Voulez-vous vraiment supprimer ${employee.firstName} ${employee.lastName} ?`
    )) {
      return;
    }

    setError("");

    try {
      await api.delete(`/employees/${employee._id}`);
      showMessage("Employé supprimé avec succès.");

      const nextPage =
        employees.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;

      await Promise.all([
        loadEmployees(nextPage),
        loadDepartments()
      ]);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Impossible de supprimer cet employé."
      );
    }
  };

  const closeModal = () => {
    setModal("");
    setSelectedEmployee(null);
    setError("");
  };

  return (
    <div className="equipment-page">
      <div className="equipment-heading">
        <div>
          <span className="equipment-eyebrow">
            GESTION DES RESSOURCES HUMAINES
          </span>
          <h1>Employés</h1>
          <p>
            Gérez les employés et leurs informations professionnelles.
          </p>
        </div>

        <button
          className="equipment-primary-btn"
          onClick={openCreate}
        >
          <Plus size={18} />
          Ajouter un employé
        </button>
      </div>

      <div className="equipment-summary">
        <div className="equipment-summary-icon">
          <Users size={23} />
        </div>
        <div>
          <span>Total des employés</span>
          <strong>
            {pagination.total.toLocaleString("fr-FR")}
          </strong>
        </div>
      </div>

      {success && (
        <div className="equipment-success">{success}</div>
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
            placeholder="Rechercher par matricule, nom, département ou poste..."
            value={filters.q}
            onChange={event => setFilters(previous => ({
              ...previous,
              q: event.target.value
            }))}
          />
        </div>

        <select
          value={filters.department}
          onChange={event => setFilters(previous => ({
            ...previous,
            department: event.target.value
          }))}
        >
          <option value="">Tous les départements</option>

          {departments.map(department => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>

        <button
          className="equipment-icon-btn"
          onClick={() => loadEmployees(1)}
          title="Actualiser"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="equipment-table-card">
        <div className="equipment-table-header">
          <div>
            <h2>Liste des employés</h2>
            <p>{pagination.total} résultat(s)</p>
          </div>
        </div>

        {loading ? (
          <div className="equipment-state">
            <LoaderCircle
              className="equipment-spinner"
              size={28}
            />
            <span>Chargement des employés...</span>
          </div>
        ) : employees.length === 0 ? (
          <div className="equipment-state">
            <Users size={35} />
            <strong>Aucun employé trouvé</strong>
            <span>
              Modifiez vos filtres ou ajoutez un employé.
            </span>
          </div>
        ) : (
          <>
            <div className="equipment-table-wrapper">
              <table className="equipment-table">
                <thead>
                  <tr>
                    <th>Employé</th>
                    <th>Matricule</th>
                    <th>Département</th>
                    <th>Poste</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {employees.map(employee => (
                    <tr key={employee._id}>
                      <td>
                        <div className="equipment-name-cell">
                          <div className="equipment-item-icon">
                            <Users size={18} />
                          </div>
                          <div>
                            <strong>
                              {employee.firstName} {employee.lastName}
                            </strong>
                            <span>Employé</span>
                          </div>
                        </div>
                      </td>

                      <td>{employee.matricule}</td>
                      <td>{employee.department}</td>
                      <td>{employee.position}</td>

                      <td>
                        <div className="equipment-actions">
                          <button
                            title="Détails"
                            onClick={() => openDetails(employee)}
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            title="Modifier"
                            onClick={() => openEdit(employee)}
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            className="equipment-delete-action"
                            title="Supprimer"
                            onClick={() => handleDelete(employee)}
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
                Page {pagination.page} sur {Math.max(1, pagination.totalPages)}
              </span>

              <div>
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => loadEmployees(pagination.page - 1)}
                >
                  <ChevronLeft size={18} />
                </button>

                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadEmployees(pagination.page + 1)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {modal === "form" && (
        <div
          className="equipment-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="equipment-modal equipment-form-modal"
            onClick={event => event.stopPropagation()}
          >
            <div className="equipment-modal-header">
              <div>
                <h2>
                  {editingId ? "Modifier l'employé" : "Nouvel employé"}
                </h2>
                <p>
                  Renseignez les informations de l'employé.
                </p>
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
                  Matricule *
                  <input
                    name="matricule"
                    value={form.matricule}
                    onChange={handleFormChange}
                    inputMode="numeric"
                    pattern="[0-9]{8}"
                    maxLength={8}
                    placeholder="Ex : 06604082"
                    required
                  />
                </label>

                <label>
                  Prénom *
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label>
                  Nom *
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label>
                  Département *
                  <input
                    name="department"
                    value={form.department}
                    onChange={handleFormChange}
                    placeholder="Ex : Informatique"
                    required
                  />
                </label>

                <label className="equipment-full-field">
                  Poste *
                  <input
                    name="position"
                    value={form.position}
                    onChange={handleFormChange}
                    placeholder="Ex : Technicien réseau"
                    required
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

      {modal === "details" && selectedEmployee && (
        <div
          className="equipment-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="equipment-modal equipment-details-modal"
            onClick={event => event.stopPropagation()}
          >
            <div className="equipment-modal-header">
              <div>
                <h2>Détails de l'employé</h2>
                <p>Informations professionnelles complètes.</p>
              </div>

              <button onClick={closeModal}>
                <X size={21} />
              </button>
            </div>

            <div className="equipment-details-grid">
              <div>
                <span>Matricule</span>
                <strong>{selectedEmployee.matricule}</strong>
              </div>

              <div>
                <span>Prénom</span>
                <strong>{selectedEmployee.firstName}</strong>
              </div>

              <div>
                <span>Nom</span>
                <strong>{selectedEmployee.lastName}</strong>
              </div>

              <div>
                <span>Département</span>
                <strong>{selectedEmployee.department}</strong>
              </div>

              <div>
                <span>Poste</span>
                <strong>{selectedEmployee.position}</strong>
              </div>
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
                onClick={() => openEdit(selectedEmployee)}
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
