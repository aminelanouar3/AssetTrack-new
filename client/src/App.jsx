
import { useState } from "react";
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
  CalendarDays,
  Settings,
  LogOut,
} from "lucide-react";

import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
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
          ) : (
            <ModulePlaceholder page={activePage} />
          )}
        </div>
      </main>
    </div>
  );
}

function Dashboard() {
  const statistics = [
    {
      title: "Total équipements",
      value: "—",
      description: "Équipements enregistrés",
      icon: Monitor,
      color: "blue",
    },
    {
      title: "Équipements affectés",
      value: "—",
      description: "En cours d'utilisation",
      icon: Users,
      color: "purple",
    },
    {
      title: "En maintenance",
      value: "—",
      description: "Interventions en cours",
      icon: Wrench,
      color: "orange",
    },
    {
      title: "Disponibles",
      value: "—",
      description: "Prêts à être affectés",
      icon: Activity,
      color: "green",
    },
  ];

  return (
    <>
      <div className="welcome-section">
        <div>
          <h2>Vue d'ensemble</h2>
          <p>Bienvenue sur votre espace de gestion du parc informatique.</p>
        </div>
        <button className="date-button">
          <CalendarDays size={17} />
          Aujourd'hui
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

      <div className="dashboard-grid">
        <section className="panel activity-panel">
          <div className="panel-header">
            <div>
              <h3>Activité récente</h3>
              <p>Suivi des dernières opérations</p>
            </div>
            <button className="text-button">Voir tout</button>
          </div>

          <div className="empty-state">
            <div className="empty-icon">
              <Activity size={25} />
            </div>
            <h4>Aucune activité affichée</h4>
            <p>
              Les dernières opérations apparaîtront ici après connexion aux
              données.
            </p>
          </div>
        </section>

        <section className="panel overview-panel">
          <div className="panel-header">
            <div>
              <h3>État du parc</h3>
              <p>Répartition des équipements</p>
            </div>
          </div>

          <div className="empty-state compact">
            <div className="empty-icon">
              <Monitor size={25} />
            </div>
            <h4>Statistiques indisponibles</h4>
            <p>Les statistiques seront chargées depuis MongoDB.</p>
          </div>
        </section>
      </div>

      <div className="bottom-note">
        <div className="note-icon">
          <Activity size={19} />
        </div>
        <div>
          <strong>AssetTrack est prêt à être configuré</strong>
          <p>
            Connectez les modules aux services backend pour afficher les
            informations réelles.
          </p>
        </div>
      </div>
    </>
  );
}

function ModulePlaceholder({ page }) {
  const descriptions = {
    Équipements: "Consulter et gérer le matériel informatique.",
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
