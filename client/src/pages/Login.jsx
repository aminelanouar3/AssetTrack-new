
import { useState } from "react";
import { Package, LockKeyhole, UserRound, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const { login } = useAuth();

  const [matricule, setMatricule] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!/^\d{8}$/.test(matricule)) {
      setError("Le matricule doit contenir exactement 8 chiffres.");
      return;
    }

    if (!password) {
      setError("Veuillez saisir votre mot de passe.");
      return;
    }

    try {
      setSubmitting(true);
      await login(matricule, password);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Impossible de se connecter au serveur."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            <Package size={27} />
          </div>
          <h1>AssetTrack</h1>
          <p>IT Asset Management System</p>
        </div>

        <div className="login-heading">
          <h2>Bienvenue</h2>
          <p>Connectez-vous à votre espace de gestion.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="matricule">Matricule</label>
          <div className="login-input">
            <UserRound size={18} />
            <input
              id="matricule"
              type="text"
              inputMode="numeric"
              maxLength={8}
              placeholder="Ex. 06604082"
              value={matricule}
              onChange={(e) =>
                setMatricule(e.target.value.replace(/\D/g, "").slice(0, 8))
              }
              autoComplete="username"
              required
            />
          </div>

          <label htmlFor="password">Mot de passe</label>
          <div className="login-input">
            <LockKeyhole size={18} />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Saisissez votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Afficher ou masquer le mot de passe"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="login-submit" type="submit" disabled={submitting}>
            {submitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="login-footer">
          Accès réservé aux utilisateurs autorisés.
        </div>
      </section>
    </main>
  );
}
