import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Monitor,
  Tags,
  Users,
  Wrench,
  ClipboardList,
  UserCog,
  Search,
  Bell,
  Menu,
  ChevronDown,
  Package,
  ArrowUpRight,
  Activity,
  Settings,
  LogOut,
  RefreshCw,
  Wallet,
  AlertCircle,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

import { useAuth } from "./context/AuthContext";
import api from "./services/api";
import Login from "./pages/Login";
import Employees from "./pages/Employees";
import Maintenance from "./pages/Maintenance";
import Equipment from "./pages/Equipment";
import "./App.css";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Équipements", icon: Monitor },
  { label: "Catégories", icon: Tags },
  { label: "Employés", icon: Users },
  { label: "Affectations", icon: ClipboardList },
  { label: "Maintenances", icon: Wrench },
  { label: "Utilisateurs", icon: UserCog, adminOnly: true },
];

const STATUS_COLORS = {
  Available: "#16a36a",
  Assigned: "#4779e8",
  Maintenance: "#ed9b36",
  Retired: "#9299a6",
};

const MAINTENANCE_COLORS = [
  "#4779e8",
  "#ed9b36",
  "#16a36a",
  "#9299a6",
];

const MONTHS = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
];

const formatNumber = (value) =>
  new Intl.NumberFormat("fr-FR").format(Number(value) || 0);

const formatMoney = (value) =>
  `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)} DT`;

function App() {
  const { user, loading, logout } = useAuth();
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return <div className="auth-loading">Chargement...</div>;
  }

  if (!user) {
    return <Login />;
  }

  const visibleNavigation = navigation.filter(
    (item) => !item.adminOnly || user.role === "admin"
  );

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`
    .toUpperCase();

  return (
    <div className="app-container">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Package size={23} />
          </div>
          <div>
            <h2>AssetTrack</h2>
            <span>Management System</span>
          </div>
        </div>

        <div className="nav-section">
          <p className="nav-title">MENU PRINCIPAL</p>

          {visibleNavigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activePage === label ? "active" : ""}`}
              onClick={() => {
                setActivePage(label);
                setSidebarOpen(false);
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
              {label === "Maintenances" && (
                <span className="nav-indicator" />
              )}
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <button className="nav-item">
            <Settings size={19} />
            <span>Paramètres</span>
          </button>

          <button className="nav-item logout" onClick={logout}>
            <LogOut size={19} />
            <span>Déconnexion</span>
          </button>

          <div className="sidebar-footer">
            <div className="avatar">{initials || "U"}</div>
            <div className="user-info">
              <strong>{user.firstName} {user.lastName}</strong>
              <span>
                {user.role === "admin" ? "Administrateur" : "Technicien"}
              </span>
            </div>
            <ChevronDown size={16} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={22} />
            </button>
            <div>
              <div className="breadcrumb">AssetTrack / {activePage}</div>
              <h1>{activePage}</h1>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="search-box">
              <Search size={18} />
              <input placeholder="Rechercher..." />
              <kbd>⌘ K</kbd>
            </div>
            <button className="notification-button">
              <Bell size={19} />
            </button>
            <div className="topbar-avatar">{initials || "U"}</div>
          </div>
        </header>

        <div className="page-content">
          {activePage === "Dashboard" ? (
            <Dashboard />
          ) : activePage === "Équipements" ? (
            <Equipment />
          ) : activePage === "Employés" ? (
            <Employees />
          ) : activePage === "Maintenances" ? (
            <Maintenance />
          ) : (
            <ModulePlaceholder page={activePage} />
          )}
        </div>
      </main>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState({
    equipment: null,
    maintenanceCosts: null,
    maintenance: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStatistics = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        equipmentResponse,
        costsResponse,
        maintenanceResponse,
      ] = await Promise.all([
        api.get("/equipment/statistics"),
        api.get("/maintenances/statistics/costs"),
        api.get("/maintenances/statistics"),
      ]);

      setData({
        equipment: equipmentResponse.data.statistiques,
        maintenanceCosts: costsResponse.data.statistiques,
        maintenance: maintenanceResponse.data.statistiques,
      });
    } catch (err) {
      console.error("Dashboard statistics error:", err);

      setError(
        err.response?.data?.message ||
        "Impossible de récupérer les statistiques du serveur."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  const equipmentStats = data.equipment;
  const maintenanceStats = data.maintenance;
  const costsStats = data.maintenanceCosts || [];

  const financialSummary = equipmentStats?.resumeFinancier?.[0] || {};

  const getEquipmentCount = (status) =>
    equipmentStats?.parStatut?.find(
      (item) => item.statut === status
    )?.nombre || 0;

  const totalMaintenances = maintenanceStats?.parStatut?.reduce(
    (total, item) => total + item.nombre,
    0
  ) || 0;

  const totalMaintenanceCost = costsStats.reduce(
    (total, item) => total + (item.coutTotal || 0),
    0
  );

  const monthlyCosts = costsStats.map((item) => ({
    periode: `${MONTHS[item.mois - 1]} ${item.annee}`,
    coutTotal: item.coutTotal,
    nombreMaintenances: item.nombreMaintenances,
  }));

  const maintenanceByTechnician =
    maintenanceStats?.parTechnicien || [];

  const statistics = [
    {
      title: "Total équipements",
      value: formatNumber(financialSummary.nombreTotal),
      description: "Équipements enregistrés",
      icon: Monitor,
      color: "blue",
    },
    {
      title: "Équipements affectés",
      value: formatNumber(getEquipmentCount("Assigned")),
      description: "En cours d'utilisation",
      icon: Users,
      color: "purple",
    },
    {
      title: "En maintenance",
      value: formatNumber(getEquipmentCount("Maintenance")),
      description: "Équipements en intervention",
      icon: Wrench,
      color: "orange",
    },
    {
      title: "Disponibles",
      value: formatNumber(getEquipmentCount("Available")),
      description: "Prêts à être affectés",
      icon: Activity,
      color: "green",
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <RefreshCw size={25} className="loading-spinner" />
        <p>Chargement des statistiques...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <AlertCircle size={25} />
        <div>
          <h3>Erreur de chargement</h3>
          <p>{error}</p>
          <button className="refresh-button" onClick={loadStatistics}>
            <RefreshCw size={16} />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="welcome-section">
        <div>
          <h2>Vue d'ensemble</h2>
          <p>
            Bienvenue sur votre espace de gestion du parc informatique.
          </p>
        </div>

        <button className="date-button" onClick={loadStatistics}>
          <RefreshCw size={16} />
          Actualiser
        </button>
      </div>

      <div className="stats-grid">
        {statistics.map((stat) => {
          const Icon = stat.icon;

          return (
            <div className="stat-card" key={stat.title}>
              <div className="stat-top">
                <div className={`stat-icon ${stat.color}`}>
                  <Icon size={21} />
                </div>
                <ArrowUpRight size={17} className="stat-arrow" />
              </div>
              <p>{stat.title}</p>
              <h3>{stat.value}</h3>
              <span>{stat.description}</span>
            </div>
          );
        })}
      </div>

      <div className="financial-grid">
        <div className="financial-card">
          <div className="financial-icon blue">
            <Wallet size={21} />
          </div>
          <div>
            <span>Valeur totale du parc</span>
            <h3>{formatMoney(financialSummary.valeurTotale)}</h3>
            <small>Prix d'acquisition cumulé</small>
          </div>
        </div>

        <div className="financial-card">
          <div className="financial-icon orange">
            <Wrench size={21} />
          </div>
          <div>
            <span>Coût total des maintenances</span>
            <h3>{formatMoney(totalMaintenanceCost)}</h3>
            <small>{formatNumber(totalMaintenances)} interventions enregistrées</small>
          </div>
        </div>

        <div className="financial-card">
          <div className="financial-icon purple">
            <Activity size={21} />
          </div>
          <div>
            <span>Prix moyen d'un équipement</span>
            <h3>{formatMoney(financialSummary.prixMoyen)}</h3>
            <small>Sur l'ensemble du parc</small>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h3>État du parc informatique</h3>
              <p>Répartition des équipements par statut</p>
            </div>
          </div>

          {equipmentStats?.parStatut?.length ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={equipmentStats.parStatut}
                    dataKey="nombre"
                    nameKey="statut"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={58}
                    paddingAngle={3}
                  >
                    {equipmentStats.parStatut.map((entry, index) => (
                      <Cell
                        key={entry.statut}
                        fill={STATUS_COLORS[entry.statut] || MAINTENANCE_COLORS[index % MAINTENANCE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="Aucune donnée sur les statuts." />
          )}
        </section>

        <section className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h3>Équipements par catégorie</h3>
              <p>Nombre d'équipements enregistrés</p>
            </div>
          </div>

          {equipmentStats?.parCategorie?.length ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={equipmentStats.parCategorie}
                  margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="categorie"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={55}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="nombre"
                    name="Équipements"
                    fill="#4779e8"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="Aucune catégorie disponible." />
          )}
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h3>Coûts des maintenances</h3>
              <p>Évolution mensuelle des dépenses</p>
            </div>
          </div>

          {monthlyCosts.length ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={290}>
                <LineChart
                  data={monthlyCosts}
                  margin={{ top: 10, right: 15, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="periode"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatMoney(value)}
                  />
                  <Line
                    type="monotone"
                    dataKey="coutTotal"
                    name="Coût"
                    stroke="#4779e8"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="Aucune donnée de coût disponible." />
          )}
        </section>

        <section className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h3>Maintenances par type</h3>
              <p>Préventive et corrective</p>
            </div>
          </div>

          {maintenanceStats?.parType?.length ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={290}>
                <PieChart>
                  <Pie
                    data={maintenanceStats.parType}
                    dataKey="nombre"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    paddingAngle={4}
                  >
                    {maintenanceStats.parType.map((entry, index) => (
                      <Cell
                        key={entry.type}
                        fill={MAINTENANCE_COLORS[index % MAINTENANCE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatNumber(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="Aucune maintenance disponible." />
          )}
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h3>Maintenances par statut</h3>
              <p>Suivi des interventions</p>
            </div>
          </div>

          {maintenanceStats?.parStatut?.length ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={270}>
                <BarChart
                  data={maintenanceStats.parStatut}
                  margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="statut"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="nombre"
                    name="Maintenances"
                    fill="#16a36a"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="Aucun statut disponible." />
          )}
        </section>

        <section className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h3>Activité des techniciens</h3>
              <p>Nombre d'interventions par technicien</p>
            </div>
          </div>

          {maintenanceByTechnician.length ? (
            <div className="technician-list">
              {maintenanceByTechnician.slice(0, 6).map((technician, index) => (
                <div className="technician-row" key={technician.matricule || index}>
                  <div className="technician-avatar">
                    {technician.nom?.trim()?.[0] || "T"}
                  </div>
                  <div className="technician-details">
                    <strong>{technician.nom?.trim() || "Technicien"}</strong>
                    <span>Matricule : {technician.matricule || "—"}</span>
                  </div>
                  <div className="technician-count">
                    <strong>{formatNumber(technician.nombreMaintenances)}</strong>
                    <span>interventions</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyChart message="Aucune activité technicien disponible." />
          )}
        </section>
      </div>

      <div className="bottom-note">
        <div className="note-icon">
          <Activity size={19} />
        </div>
        <div>
          <strong>Statistiques actualisées depuis MongoDB</strong>
          <p>
            Les indicateurs et graphiques sont calculés à partir des
            agrégations des équipements et des maintenances.
          </p>
        </div>
      </div>
    </>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="empty-chart">
      <Activity size={25} />
      <p>{message}</p>
    </div>
  );
}

function ModulePlaceholder({ page }) {
  const descriptions = {
    Catégories: "Organiser les équipements par catégorie.",
    Employés: "Gérer les informations des employés.",
    Affectations: "Suivre les affectations et les restitutions.",
    Maintenances: "Gérer les interventions et les coûts de maintenance.",
    Utilisateurs: "Administrer les comptes et les rôles.",
  };

  return (
    <section className="module-placeholder">
      <div className="placeholder-icon">
        <Package size={30} />
      </div>
      <h2>{page}</h2>
      <p>{descriptions[page]}</p>
      <span>Module en cours d'implémentation</span>
    </section>
  );
}

export default App;
