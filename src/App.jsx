import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Receipt,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  Plus,
  Search,
  RefreshCw,
  Shield,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { supabase } from "./supabase";

const T = {
  ink: "#1B2430",
  inkSoft: "#2A3444",
  paper: "#F6F4EF",
  card: "#FFFFFF",
  line: "#E6E2D8",
  stone: "#8A8578",
  teal: "#2F6F62",
  tealLight: "#DCEAE6",
  tealDeep: "#1F4B41",
  clay: "#C1622C",
  clayLight: "#F3E0D3",
  sage: "#7A8C6E",
  sageLight: "#E6EBDF",
  amber: "#D9A441",
  amberLight: "#F7ECD6",
  red: "#B4463D",
  redLight: "#F3DEDB",
};

const menuItems = [
  {
    key: "dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
  },
  {
    key: "establishments",
    label: "Établissements",
    icon: Building2,
  },
  {
    key: "billing",
    label: "Facturation",
    icon: Receipt,
  },
  {
    key: "administrators",
    label: "Administrateurs",
    icon: Users,
  },
  {
    key: "settings",
    label: "Réglages",
    icon: Settings,
  },
];

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [authMode, setAuthMode] = useState(
  new URLSearchParams(window.location.search).get("invite") === "1"
    ? "invite"
    : "login"
);
  const isInviteUrl =
  new URLSearchParams(window.location.search).get("invite") === "1";
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isSuperAdmin = profile?.role === "super_admin";

  useEffect(() => {
    let mounted = true;

    async function init() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(currentSession);

      if (currentSession?.user) {
        await loadProfile(currentSession.user.id);
      } else {
        setLoading(false);
      }
    }
const isInvite =
  window.location.hash.includes("type=invite") ||
  new URLSearchParams(window.location.search).get("invite") === "1";

if (isInvite) {
  setAuthMode("invite");
}
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);

      if (newSession?.user) {
        await loadProfile(newSession.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadProfile(userId) {
    setLoading(true);

    const { data, error } = await supabase
      .from("admins")
      .select("id, hotel_id, full_name, email, role, status")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (error) {
      console.error(error);
      setProfile(null);
      setLoading(false);
      return;
    }

    if (!data || data.status !== "active") {
      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile(data);

    await supabase
      .from("admins")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", data.id);

    setLoading(false);
  }

  async function handleLogin(event) {
    event.preventDefault();

    setAuthLoading(true);
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setAuthMessage(error.message);
    }

    setAuthLoading(false);
  }

  async function handleForgotPassword(event) {
    event.preventDefault();

    if (!email.trim()) {
      setAuthMessage("Saisissez votre adresse email.");
      return;
    }

    setAuthLoading(true);
    setAuthMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: window.location.origin,
      }
    );

    if (error) {
      setAuthMessage(error.message);
    } else {
      setAuthMessage(
        "Si cette adresse existe, un email de réinitialisation a été envoyé."
      );
    }

    setAuthLoading(false);
  }

  async function handleResetPassword(event) {
    event.preventDefault();

    if (newPassword.length < 8) {
      setAuthMessage(
        "Le nouveau mot de passe doit contenir au moins 8 caractères."
      );
      return;
    }

    setAuthLoading(true);
    setAuthMessage("");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setAuthMessage(error.message);
    } else {
      setAuthMessage("Votre mot de passe a été modifié. Vous pouvez vous connecter.");
      setAuthMode("login");
      setPassword("");
      setNewPassword("");
    }

    setAuthLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setPage("dashboard");
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (
  window.location.hash.includes("type=recovery") ||
  window.location.hash.includes("type=invite") ||
  new URLSearchParams(window.location.search).get("invite") === "1" ||
  authMode === "reset" ||
  authMode === "invite"
) {
  const isInvitation =
  window.location.hash.includes("type=invite") ||
  isInviteUrl ||
  authMode === "invite";
  
  return (
    <AuthLayout>
      <AuthHeader />

      <form onSubmit={handleResetPassword}>
        <h1>
          {isInvitation
            ? "Bienvenue sur Hôtel Halo"
            : "Réinitialiser le mot de passe"}
        </h1>

        <p className="auth-subtitle">
          {isInvitation
            ? "Créez votre mot de passe pour activer votre compte administrateur."
            : "Choisissez un nouveau mot de passe sécurisé."}
        </p>

        <Field
          label="Nouveau mot de passe"
          type={showPassword ? "text" : "password"}
          value={newPassword}
          onChange={setNewPassword}
          placeholder="Au moins 8 caractères"
          icon={Lock}
          right={
            <button
              type="button"
              className="icon-button"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          }
        />

        {authMessage && <Message text={authMessage} />}

        <button
          className="primary-button"
          disabled={authLoading}
          type="submit"
        >
          {authLoading
            ? "Activation..."
            : isInvitation
            ? "Créer mon mot de passe"
            : "Modifier le mot de passe"}
        </button>
      </form>
    </AuthLayout>
  );
}
  
  if (!session || !profile) {
    return (
      <AuthLayout>
        <AuthHeader />

        {authMode === "login" && (
          <form onSubmit={handleLogin}>
            <h1>Bienvenue sur Hôtel Halo</h1>
            <p className="auth-subtitle">
              Connectez-vous à votre espace de gestion.
            </p>

            <Field
              label="Adresse email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="vous@exemple.com"
              icon={Mail}
            />

            <Field
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={setPassword}
              placeholder="Votre mot de passe"
              icon={Lock}
              right={
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />

            {authMessage && <Message text={authMessage} />}

            <button
              className="primary-button"
              disabled={authLoading}
              type="submit"
            >
              {authLoading ? "Connexion..." : "Se connecter"}
            </button>

            <button
              type="button"
              className="link-button"
              onClick={() => {
                setAuthMode("forgot");
                setAuthMessage("");
              }}
            >
              Mot de passe oublié ?
            </button>
          </form>
        )}

        {authMode === "forgot" && (
          <form onSubmit={handleForgotPassword}>
            <h1>Mot de passe oublié ?</h1>
            <p className="auth-subtitle">
              Entrez votre adresse email pour recevoir un lien sécurisé.
            </p>

            <Field
              label="Adresse email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="vous@exemple.com"
              icon={Mail}
            />

            {authMessage && <Message text={authMessage} />}

            <button
              className="primary-button"
              disabled={authLoading}
              type="submit"
            >
              {authLoading ? "Envoi..." : "Envoyer le lien"}
            </button>

            <button
              type="button"
              className="link-button"
              onClick={() => {
                setAuthMode("login");
                setAuthMessage("");
              }}
            >
              Retour à la connexion
            </button>
          </form>
        )}
      </AuthLayout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <HotelPlaceholder
        profile={profile}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="app-shell">
      <style>{globalStyles}</style>

      {mobileMenu && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <Sidebar
        page={page}
        setPage={(value) => {
          setPage(value);
          setMobileMenu(false);
        }}
        onLogout={handleLogout}
        mobileMenu={mobileMenu}
      />

      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenu(true)}
          >
            <Menu size={24} />
          </button>

          <div>
            <div className="topbar-title">
              {pageTitle(page)}
            </div>
            <div className="topbar-subtitle">
              Administration de la plateforme
            </div>
          </div>

          <div className="topbar-user">
            <div className="avatar">
              {(profile.full_name || "S").charAt(0).toUpperCase()}
            </div>
            <div className="topbar-user-info">
              <strong>{profile.full_name}</strong>
              <span>Super-Admin</span>
            </div>
          </div>
        </header>

        <div className="page-container">
          {page === "dashboard" && <SuperAdminDashboard />}
          {page === "establishments" && <Establishments />}
          {page === "administrators" && <Administrators />}
          {page === "billing" && <Billing />}
          {page === "settings" && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   AUTH
========================================================= */

function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <style>{globalStyles}</style>

      <div className="auth-card">
        {children}
      </div>
    </div>
  );
}

function AuthHeader() {
  return (
    <div className="auth-brand">
      <div className="brand-logo">H</div>

      <div>
        <strong>Hôtel Halo</strong>
        <span>Gestion hôtelière</span>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  icon: Icon,
  right,
}) {
  return (
    <div className="field">
      <label>{label}</label>

      <div className="input-wrapper">
        <Icon size={22} className="input-icon" />

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={
            type === "password" ? "current-password" : "email"
          }
        />

        {right}
      </div>
    </div>
  );
}

function Message({ text }) {
  return (
    <div className="message error">
      <AlertCircle size={20} />
      <span>{text}</span>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <style>{globalStyles}</style>
      <div className="loading-spinner" />
      <strong>Hôtel Halo</strong>
      <span>Chargement sécurisé...</span>
    </div>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
  page,
  setPage,
  onLogout,
  mobileMenu,
}) {
  return (
    <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
      <div className="sidebar-header">
        <div className="brand-logo">H</div>

        <div className="brand-text">
          <strong>Hôtel Halo</strong>
          <span>Administration plateforme</span>
        </div>

        {mobileMenu && (
          <button
            className="sidebar-close"
            onClick={() => setPage(page)}
          >
            <X size={22} />
          </button>
        )}
      </div>

      <div className="sidebar-section-title">
        MENU PRINCIPAL
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = page === item.key;

          return (
            <button
              key={item.key}
              className={`nav-item ${active ? "active" : ""}`}
              onClick={() => setPage(item.key)}
            >
              <Icon size={23} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="security-box">
          <Shield size={20} />
          <div>
            <strong>Accès sécurisé</strong>
            <span>Compte Super-Admin</span>
          </div>
        </div>

        <button className="logout-button" onClick={onLogout}>
          <LogOut size={20} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function SuperAdminDashboard() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadHotels() {
    setLoading(true);

    const { data, error } = await supabase
      .from("hotels")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setHotels(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadHotels();
  }, []);

  const activeHotels = hotels.filter(
    (hotel) => hotel.status === "active"
  ).length;

  return (
    <>
      <PageIntro
        eyebrow="SUPER-ADMIN"
        title="Vue d'ensemble"
        description="Pilotez les établissements et les services d'Hôtel Halo."
      />

      <div className="kpi-grid">
        <KpiCard
          icon={Building2}
          label="Hôtels actifs"
          value={loading ? "..." : activeHotels}
        />

        <KpiCard
          icon={Users}
          label="Établissements"
          value={loading ? "..." : hotels.length}
        />

        <KpiCard
          icon={Receipt}
          label="MRR"
          value="0 $"
        />

        <KpiCard
          icon={Shield}
          label="Statut plateforme"
          value="Actif"
          small
        />
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Établissements récents</h2>
            <p>Les derniers hôtels enregistrés sur la plateforme.</p>
          </div>

          <button
            className="secondary-button"
            onClick={loadHotels}
          >
            <RefreshCw size={18} />
            Actualiser
          </button>
        </div>

        {hotels.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Aucun établissement"
            text="Commencez par créer le premier hôtel de la plateforme."
          />
        ) : (
          <HotelTable hotels={hotels} />
        )}
      </section>
    </>
  );
}

/* =========================================================
   ESTABLISHMENTS
========================================================= */

function Establishments() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  async function loadHotels() {
    setLoading(true);

    const { data, error } = await supabase
      .from("hotels")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Impossible de charger les établissements.");
    } else {
      setHotels(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadHotels();
  }, []);

  const filteredHotels = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return hotels;

    return hotels.filter((hotel) =>
      [
        hotel.name,
        hotel.email,
        hotel.phone,
        hotel.address,
      ]
        .filter(Boolean)
        .some((field) =>
          String(field).toLowerCase().includes(value)
        )
    );
  }, [hotels, search]);

  async function createHotel(form) {
    const { data, error } = await supabase
      .from("hotels")
      .insert({
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        status: form.status,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      throw new Error(
        error.message || "Impossible de créer l'établissement."
      );
    }

    setHotels((current) => [data, ...current]);
    setShowModal(false);
  }

  return (
    <>
      <PageIntro
        eyebrow="PLATEFORME"
        title="Établissements"
        description="Gérez les hôtels enregistrés sur Hôtel Halo."
        action={
          <button
            className="primary-small-button"
            onClick={() => setShowModal(true)}
          >
            <Plus size={19} />
            Ajouter un établissement
          </button>
        }
      />

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>{hotels.length} établissement(s)</h2>
            <p>
              Créez et consultez les établissements de votre plateforme.
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={loadHotels}
            disabled={loading}
          >
            <RefreshCw size={18} />
            Actualiser
          </button>
        </div>

        <div className="search-box">
          <Search size={21} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un établissement..."
          />
        </div>

        {loading ? (
          <div className="inline-loading">
            <div className="loading-spinner small" />
            Chargement...
          </div>
        ) : filteredHotels.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Aucun résultat"
            text={
              hotels.length === 0
                ? "Aucun établissement n'est encore enregistré."
                : "Aucun établissement ne correspond à votre recherche."
            }
          />
        ) : (
          <HotelTable hotels={filteredHotels} />
        )}
      </section>

      {showModal && (
        <CreateHotelModal
          onClose={() => setShowModal(false)}
          onCreate={createHotel}
        />
      )}
    </>
  );
}

/* =========================================================
   CREATE HOTEL MODAL
========================================================= */

function CreateHotelModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "active",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Le nom de l'établissement est obligatoire.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onCreate(form);
    } catch (err) {
      setError(err.message);
    }

    setSaving(false);
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-icon">
              <Building2 size={24} />
            </div>

            <h2>Ajouter un établissement</h2>
            <p>
              Enregistrez un nouvel hôtel sur Hôtel Halo.
            </p>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
            type="button"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field">
              <label>Nom de l'établissement *</label>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Ex. Hôtel Fleuve Congo"
                autoFocus
              />
            </div>

            <div className="field">
              <label>Email</label>
              <div className="simple-input-icon">
                <Mail size={19} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="contact@hotel.com"
                />
              </div>
            </div>

            <div className="field">
              <label>Téléphone</label>
              <div className="simple-input-icon">
                <Phone size={19} />
                <input
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+243 ..."
                />
              </div>
            </div>

            <div className="field">
              <label>Statut</label>
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
              >
                <option value="active">Actif</option>
                <option value="suspended">Suspendu</option>
              </select>
            </div>

            <div className="field full">
              <label>Adresse</label>
              <div className="simple-input-icon">
                <MapPin size={19} />
                <input
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Adresse de l'établissement"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="message error modal-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Annuler
            </button>

            <button
              type="submit"
              className="primary-small-button"
              disabled={saving}
            >
              {saving ? (
                "Enregistrement..."
              ) : (
                <>
                  <Plus size={19} />
                  Créer l'établissement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   HOTEL TABLE
========================================================= */

function HotelTable({ hotels }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Établissement</th>
            <th>Contact</th>
            <th>Statut</th>
            <th>Créé le</th>
          </tr>
        </thead>

        <tbody>
          {hotels.map((hotel) => (
            <tr key={hotel.id}>
              <td>
                <div className="hotel-name-cell">
                  <div className="table-icon">
                    <Building2 size={20} />
                  </div>

                  <div>
                    <strong>{hotel.name}</strong>
                    <span>
                      ID #{hotel.id}
                    </span>
                  </div>
                </div>
              </td>

              <td>
                <div className="contact-cell">
                  {hotel.email && (
                    <span>{hotel.email}</span>
                  )}

                  {hotel.phone && (
                    <span>{hotel.phone}</span>
                  )}

                  {!hotel.email && !hotel.phone && (
                    <span>—</span>
                  )}
                </div>
              </td>

              <td>
                <StatusBadge status={hotel.status} />
              </td>

              <td>
                {formatDate(hotel.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }) {
  const active = status === "active";

  return (
    <span
      className={`status-badge ${
        active ? "status-active" : "status-suspended"
      }`}
    >
      {active ? (
        <CheckCircle2 size={15} />
      ) : (
        <XCircle size={15} />
      )}

      {active ? "Actif" : "Suspendu"}
    </span>
  );
}

/* =========================================================
   ADMINISTRATORS
========================================================= */

function Administrators() {
  const [admins, setAdmins] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const [hotelId, setHotelId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingInvitations, setPendingInvitations] = useState([]);
  
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const [
      { data: adminsData, error: adminsError },
      { data: hotelsData, error: hotelsError },
    ] = await Promise.all([
      supabase
        .from("admins")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("hotels")
        .select("*")
        .order("name", { ascending: true }),
    ]);
    
    const {
  data: { session },
    } = await supabase.auth.getSession();

if (session?.access_token) {
  const response = await fetch("/api/admin/pending-invitations", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const result = await response.json();

  if (response.ok) {
    setPendingInvitations(result.invitations || []);
  }
}

    if (adminsError) {
      setError(adminsError.message);
    }

    if (hotelsError) {
      setError(hotelsError.message);
    }

    setAdmins(adminsData || []);
    setHotels(hotelsData || []);
    setLoading(false);
  }

  function openInvite() {
    setHotelId("");
    setFullName("");
    setEmail("");
    setMessage("");
    setError("");
    setShowInvite(true);
  }

  async function sendInvitation(e) {
  e.preventDefault();

  setMessage("");
  setError("");

  if (!hotelId || !fullName.trim() || !email.trim()) {
    setError("Tous les champs sont obligatoires.");
    return;
  }

  setSending(true);

  try {
    const normalizedEmail = email.trim().toLowerCase();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Votre session Super-Admin est invalide.");
    }

    const response = await fetch("/api/admin/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        hotel_id: Number(hotelId),
        full_name: fullName.trim(),
        email: normalizedEmail,
        role: "admin",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result?.error || "Impossible de créer l'invitation."
      );
    }

    if (!result?.invitation_token) {
      throw new Error(
        "L'invitation a été créée, mais aucun jeton d'activation n'a été reçu."
      );
    }

    const activationUrl =
      `${window.location.origin}/?invite=1&token=${encodeURIComponent(
        result.invitation_token
      )}`;

    setMessage(
      `Invitation créée pour ${normalizedEmail}. ` +
      `Le lien d'activation est prêt.`
    );

    console.log("Lien d'activation de test :", activationUrl);

    setFullName("");
    setEmail("");
    setHotelId("");

    await loadData();
  } catch (err) {
    setError(
      err.message || "Une erreur est survenue."
    );
  } finally {
    setSending(false);
  }
}
  async function resendInvitation(invitationId) {
  setMessage("");
  setError("");

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Votre session Super-Admin est invalide.");
    }

    const response = await fetch("/api/admin/resend-invitation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        invitation_id: Number(invitationId),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result?.error || "Impossible de renouveler l'invitation."
      );
    }

    const activationUrl =
      `${window.location.origin}/?invite=1&token=${encodeURIComponent(
        result.invitation_token
      )}`;

    setMessage(`Invitation renouvelée pour ${result.email}.`);

    console.log("Nouveau lien d'activation :", activationUrl);
  } catch (err) {
    setError(
      err.message || "Une erreur est survenue."
    );
  }
  }
  function getHotelName(hotelId) {
    const hotel = hotels.find((item) => String(item.id) === String(hotelId));
    return hotel?.name || "—";
  }

  const administrators = admins.filter(
    (admin) => admin.role === "admin" || admin.role === "super_admin"
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: T.ink,
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            Administrateurs
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              color: T.stone,
              fontSize: 14,
            }}
          >
            Gérez les administrateurs des établissements Hôtel Halo.
          </p>
        </div>

        <button
          onClick={openInvite}
          style={{
            border: "none",
            borderRadius: 12,
            padding: "12px 18px",
            background: T.teal,
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Plus size={18} />
          Inviter un administrateur
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            background: T.tealLight,
            color: T.tealDeep,
            fontWeight: 600,
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            background: T.redLight,
            color: T.red,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          background: T.card,
          border: `1px solid ${T.line}`,
          borderRadius: 18,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: `1px solid ${T.line}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: T.ink,
              }}
            >
              Comptes administrateurs
            </div>

            <div
              style={{
                marginTop: 4,
                color: T.stone,
                fontSize: 13,
              }}
            >
              {administrators.length} compte
              {administrators.length > 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {loading ? (
          <div
            style={{
              padding: 30,
              textAlign: "center",
              color: T.stone,
            }}
          >
            Chargement...
          </div>
        ) : administrators.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: T.stone,
            }}
          >
            Aucun administrateur pour le moment.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 700,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: T.paper,
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: 14 }}>Nom</th>
                  <th style={{ padding: 14 }}>Email</th>
                  <th style={{ padding: 14 }}>Établissement</th>
                  <th style={{ padding: 14 }}>Rôle</th>
                  <th style={{ padding: 14 }}>Statut</th>
                </tr>
              </thead>

              <tbody>
                {administrators.map((admin) => (
                  <tr
                    key={admin.id}
                    style={{
                      borderTop: `1px solid ${T.line}`,
                    }}
                  >
                    <td
                      style={{
                        padding: 14,
                        fontWeight: 700,
                        color: T.ink,
                      }}
                    >
                      {admin.full_name}
                    </td>

                    <td style={{ padding: 14, color: T.inkSoft }}>
                      {admin.email}
                    </td>

                    <td style={{ padding: 14, color: T.inkSoft }}>
                      {admin.role === "super_admin"
                        ? "Plateforme Hôtel Halo"
                        : getHotelName(admin.hotel_id)}
                    </td>

                    <td style={{ padding: 14 }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "6px 10px",
                          borderRadius: 999,
                          background:
                            admin.role === "super_admin"
                              ? T.clayLight
                              : T.tealLight,
                          color:
                            admin.role === "super_admin"
                              ? T.clay
                              : T.tealDeep,
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {admin.role === "super_admin"
                          ? "Super-Admin"
                          : "Administrateur"}
                      </span>
                    </td>

                    <td style={{ padding: 14 }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "6px 10px",
                          borderRadius: 999,
                          background:
                            admin.status === "active"
                              ? T.sageLight
                              : T.redLight,
                          color:
                            admin.status === "active"
                              ? T.sage
                              : T.red,
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {admin.status === "active"
                          ? "Actif"
                          : admin.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        {pendingInvitations.length > 0 && (
  <div
    style={{
      marginTop: 20,
      background: T.card,
      border: `1px solid ${T.line}`,
      borderRadius: 16,
      padding: 18,
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
      }}
    >
      <div>
        <div
          style={{
            fontWeight: 800,
            color: T.ink,
            fontSize: 16,
          }}
        >
          Invitations en attente
        </div>

        <div
          style={{
            marginTop: 4,
            color: T.stone,
            fontSize: 13,
          }}
        >
          Administrateurs qui n’ont pas encore activé leur compte.
        </div>
      </div>
    </div>

    {pendingInvitations.map((invitation) => (
      <div
        key={invitation.id}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          padding: "14px 0",
          borderTop: `1px solid ${T.line}`,
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 700,
              color: T.ink,
            }}
          >
            {invitation.full_name}
          </div>

          <div
            style={{
              marginTop: 4,
              color: T.stone,
              fontSize: 13,
            }}
          >
            {invitation.email}
          </div>

          <div
            style={{
              marginTop: 4,
              color: T.stone,
              fontSize: 12,
            }}
          >
            {getHotelName(invitation.hotel_id)}
          </div>
        </div>

        <button
          type="button"
          onClick={() => resendInvitation(invitation.id)}
          style={{
            border: "none",
            borderRadius: 10,
            padding: "10px 14px",
            background: T.teal,
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Renvoyer
        </button>
      </div>
    ))}
  </div>
)}

      {showInvite && (
        <div
          onClick={() => {
            if (!sending) setShowInvite(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 520,
              background: T.card,
              borderRadius: 20,
              padding: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: T.ink,
                    fontSize: 22,
                  }}
                >
                  Inviter un administrateur
                </h2>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: T.stone,
                    fontSize: 13,
                  }}
                >
                  L'administrateur recevra un email pour définir son mot de
                  passe.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInvite(false)}
                disabled={sending}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 24,
                  color: T.stone,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={sendInvitation}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <label>
                <div
                  style={{
                    marginBottom: 7,
                    fontWeight: 700,
                    color: T.ink,
                  }}
                >
                  Établissement
                </div>

                <select
                  value={hotelId}
                  onChange={(e) => setHotelId(e.target.value)}
                  disabled={sending}
                  style={{
                    width: "100%",
                    padding: "12px 13px",
                    borderRadius: 10,
                    border: `1px solid ${T.line}`,
                    background: "#fff",
                    color: T.ink,
                  }}
                >
                  <option value="">Sélectionner un établissement</option>

                  {hotels
                    .filter((hotel) => hotel.status === "active")
                    .map((hotel) => (
                      <option key={hotel.id} value={hotel.id}>
                        {hotel.name}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                <div
                  style={{
                    marginBottom: 7,
                    fontWeight: 700,
                    color: T.ink,
                  }}
                >
                  Nom complet
                </div>

                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={sending}
                  placeholder="Ex. Patrick Mbuyi"
                  style={{
                    width: "100%",
                    padding: "12px 13px",
                    borderRadius: 10,
                    border: `1px solid ${T.line}`,
                    outline: "none",
                  }}
                />
              </label>

              <label>
                <div
                  style={{
                    marginBottom: 7,
                    fontWeight: 700,
                    color: T.ink,
                  }}
                >
                  Adresse email
                </div>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={sending}
                  placeholder="administrateur@hotel.com"
                  style={{
                    width: "100%",
                    padding: "12px 13px",
                    borderRadius: 10,
                    border: `1px solid ${T.line}`,
                    outline: "none",
                  }}
                />
              </label>

              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: T.paper,
                  color: T.stone,
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: T.ink }}>
                  Rôle :
                </strong>{" "}
                Administrateur de l'établissement.
                <br />
                Il pourra ensuite gérer les agents Gérant et Réceptionniste.
              </div>

              {error && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: T.redLight,
                    color: T.red,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                style={{
                  border: "none",
                  borderRadius: 12,
                  padding: "13px 16px",
                  background: sending ? T.stone : T.teal,
                  color: "#fff",
                  fontWeight: 800,
                  cursor: sending ? "not-allowed" : "pointer",
                }}
              >
                {sending ? "Envoi en cours..." : "Envoyer l'invitation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   BILLING
========================================================= */

function Billing() {
  return (
    <>
      <PageIntro
        eyebrow="PLATEFORME"
        title="Facturation"
        description="Suivez la facturation des abonnements Hôtel Halo."
      />

      <div className="kpi-grid">
        <KpiCard
          icon={Receipt}
          label="MRR"
          value="0 $"
        />

        <KpiCard
          icon={CheckCircle2}
          label="Factures payées"
          value="0"
        />

        <KpiCard
          icon={AlertCircle}
          label="En attente"
          value="0"
        />

        <KpiCard
          icon={XCircle}
          label="En retard"
          value="0"
        />
      </div>

      <section className="panel">
        <EmptyState
          icon={Receipt}
          title="Aucune facture"
          text="Les factures apparaîtront ici lorsque les abonnements seront activés."
        />
      </section>
    </>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

function SettingsPage() {
  return (
    <>
      <PageIntro
        eyebrow="CONFIGURATION"
        title="Réglages"
        description="Configuration générale de la plateforme Hôtel Halo."
      />

      <section className="panel">
        <div className="settings-row">
          <div className="settings-icon">
            <Shield size={22} />
          </div>

          <div>
            <h3>Sécurité et accès</h3>
            <p>
              Les rôles et les autorisations sont contrôlés côté base de données.
            </p>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-icon">
            <Receipt size={22} />
          </div>

          <div>
            <h3>Plans tarifaires</h3>
            <p>
              Les offres Starter, Pro et Enterprise seront configurées ici.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

/* =========================================================
   HOTEL PLACEHOLDER
========================================================= */

function HotelPlaceholder({ profile, onLogout }) {
  return (
    <div className="hotel-placeholder">
      <style>{globalStyles}</style>

      <div className="hotel-placeholder-card">
        <div className="brand-logo">H</div>

        <h1>Bienvenue sur Hôtel Halo</h1>

        <p>
          Votre espace administrateur hôtel sera disponible
          dans les prochaines étapes.
        </p>

        <div className="profile-box">
          <strong>{profile.full_name}</strong>
          <span>{roleLabel(profile.role)}</span>
        </div>

        <button
          className="primary-button"
          onClick={onLogout}
        >
          <LogOut size={19} />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   UI HELPERS
========================================================= */

function PageIntro({
  eyebrow,
  title,
  description,
  action,
}) {
  return (
    <div className="page-intro">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {action && (
        <div className="page-intro-action">
          {action}
        </div>
      )}
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  small = false,
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon">
        <Icon size={24} />
      </div>

      <span>{label}</span>

      <strong className={small ? "kpi-small" : ""}>
        {value}
      </strong>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={38} />
      </div>

      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function pageTitle(page) {
  const item = menuItems.find(
    (entry) => entry.key === page
  );

  return item?.label || "Tableau de bord";
}

function roleLabel(role) {
  switch (role) {
    case "super_admin":
      return "Super-Admin";
    case "admin":
      return "Administrateur";
    case "manager":
      return "Gérant";
    case "receptionist":
      return "Réceptionniste";
    default:
      return role || "Utilisateur";
  }
}

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

/* =========================================================
   GLOBAL STYLES
========================================================= */

const globalStyles = `
* {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  min-height: 100%;
  width: 100%;
}

body {
  overflow-x: hidden;
  font-family: Arial, sans-serif;
  color: ${T.ink};
  background: ${T.paper};
}

button,
input,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

/* AUTH */

.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  background:
    radial-gradient(
      circle at 0% 0%,
      ${T.tealLight} 0,
      transparent 35%
    ),
    radial-gradient(
      circle at 100% 100%,
      ${T.clayLight} 0,
      transparent 35%
    ),
    ${T.paper};
}

.auth-card {
  width: min(100%, 640px);
  background: ${T.card};
  border: 1px solid ${T.line};
  border-radius: 32px;
  padding: 58px;
  box-shadow: 0 25px 80px rgba(27,36,48,0.08);
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 62px;
}

.brand-logo {
  width: 78px;
  height: 78px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${T.teal};
  color: white;
  font-size: 38px;
  font-weight: 800;
}

.auth-brand strong {
  display: block;
  font-size: 28px;
}

.auth-brand span {
  display: block;
  color: ${T.stone};
  margin-top: 5px;
  font-size: 18px;
}

.auth-card h1 {
  margin: 0 0 18px;
  font-size: 46px;
  line-height: 1.08;
}

.auth-subtitle {
  color: ${T.stone};
  font-size: 22px;
  line-height: 1.55;
  margin: 0 0 48px;
}

.field {
  margin-bottom: 28px;
}

.field label {
  display: block;
  margin-bottom: 10px;
  font-weight: 700;
  font-size: 17px;
  color: ${T.inkSoft};
}

.input-wrapper {
  min-height: 68px;
  display: flex;
  align-items: center;
  border: 1px solid ${T.line};
  border-radius: 18px;
  background: white;
  padding: 0 18px;
}

.input-wrapper:focus-within {
  border-color: ${T.teal};
  box-shadow: 0 0 0 4px ${T.tealLight};
}

.input-icon {
  flex: 0 0 auto;
  color: ${T.stone};
}

.input-wrapper input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  padding: 0 14px;
  color: ${T.ink};
  font-size: 19px;
  background: transparent;
}

.icon-button {
  border: 0;
  background: transparent;
  color: ${T.stone};
  padding: 5px;
}

.primary-button,
.primary-small-button {
  border: 0;
  background: ${T.teal};
  color: white;
  font-weight: 700;
  transition: 0.2s ease;
}

.primary-button:hover,
.primary-small-button:hover {
  background: ${T.tealDeep};
}

.primary-button {
  width: 100%;
  min-height: 68px;
  border-radius: 18px;
  font-size: 19px;
  margin-top: 8px;
}

.primary-small-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 13px 19px;
  border-radius: 13px;
}

.link-button {
  width: 100%;
  border: 0;
  background: transparent;
  color: ${T.teal};
  font-weight: 700;
  font-size: 17px;
  padding: 22px 0 0;
}

.message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 14px;
  margin: 12px 0 20px;
  line-height: 1.4;
}

.message.error {
  color: ${T.red};
  background: ${T.redLight};
}

/* APP */

.app-shell {
  min-height: 100vh;
  display: flex;
  background: ${T.paper};
}

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: 292px;
  background: white;
  border-right: 1px solid ${T.line};
  display: flex;
  flex-direction: column;
  z-index: 30;
}

.sidebar-header {
  min-height: 118px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 24px;
  border-bottom: 1px solid ${T.line};
}

.sidebar-header .brand-logo {
  width: 64px;
  height: 64px;
  border-radius: 19px;
  font-size: 31px;
}

.brand-text strong {
  display: block;
  font-size: 21px;
}

.brand-text span {
  display: block;
  color: ${T.stone};
  font-size: 14px;
  margin-top: 5px;
}

.sidebar-section-title {
  padding: 38px 28px 18px;
  color: ${T.stone};
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 2px;
}

.sidebar-nav {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 17px;
  border: 0;
  background: transparent;
  color: ${T.inkSoft};
  padding: 17px 17px;
  border-radius: 16px;
  text-align: left;
  font-weight: 700;
  font-size: 17px;
}

.nav-item:hover {
  background: ${T.paper};
}

.nav-item.active {
  color: ${T.tealDeep};
  background: ${T.tealLight};
}

.sidebar-bottom {
  margin-top: auto;
  padding: 20px 16px 22px;
}

.security-box {
  display: flex;
  gap: 12px;
  padding: 15px;
  border-radius: 15px;
  background: ${T.sageLight};
  color: ${T.tealDeep};
  margin-bottom: 13px;
}

.security-box strong,
.security-box span {
  display: block;
}

.security-box span {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.75;
}

.logout-button {
  width: 100%;
  border: 0;
  background: transparent;
  color: ${T.red};
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 13px;
  font-weight: 700;
  text-align: left;
}

.logout-button:hover {
  background: ${T.redLight};
}

.main-content {
  width: calc(100% - 292px);
  margin-left: 292px;
  min-height: 100vh;
}

.topbar {
  min-height: 92px;
  background: white;
  border-bottom: 1px solid ${T.line};
  display: flex;
  align-items: center;
  padding: 18px 38px;
  gap: 18px;
}

.topbar-title {
  font-size: 22px;
  font-weight: 800;
}

.topbar-subtitle {
  color: ${T.stone};
  font-size: 14px;
  margin-top: 5px;
}

.topbar-user {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 11px;
}

.avatar {
  width: 43px;
  height: 43px;
  border-radius: 50%;
  background: ${T.tealLight};
  color: ${T.tealDeep};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.topbar-user-info strong,
.topbar-user-info span {
  display: block;
}

.topbar-user-info span {
  color: ${T.stone};
  font-size: 12px;
  margin-top: 3px;
}

.page-container {
  padding: 40px;
  max-width: 1600px;
  margin: auto;
}

.page-intro {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 25px;
  margin-bottom: 35px;
}

.eyebrow {
  color: ${T.teal};
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 2px;
  margin-bottom: 10px;
}

.page-intro h1 {
  margin: 0;
  font-size: 46px;
  line-height: 1.05;
}

.page-intro p {
  color: ${T.stone};
  font-size: 19px;
  margin: 13px 0 0;
}

.page-intro-action {
  flex: 0 0 auto;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 28px;
}

.kpi-card {
  background: white;
  border: 1px solid ${T.line};
  border-radius: 23px;
  padding: 25px;
  min-height: 170px;
}

.kpi-icon {
  width: 53px;
  height: 53px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${T.tealLight};
  color: ${T.teal};
  margin-bottom: 23px;
}

.kpi-card > span {
  display: block;
  color: ${T.stone};
  font-weight: 700;
  margin-bottom: 8px;
}

.kpi-card > strong {
  display: block;
  font-size: 32px;
}

.kpi-small {
  font-size: 23px !important;
}

.panel {
  background: white;
  border: 1px solid ${T.line};
  border-radius: 25px;
  padding: 27px;
  margin-bottom: 25px;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 25px;
}

.panel-header h2 {
  margin: 0;
  font-size: 24px;
}

.panel-header p {
  color: ${T.stone};
  margin: 7px 0 0;
}

.secondary-button {
  border: 1px solid ${T.line};
  background: white;
  color: ${T.inkSoft};
  padding: 11px 15px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}

.secondary-button:hover {
  background: ${T.paper};
}

.search-box {
  height: 62px;
  display: flex;
  align-items: center;
  gap: 13px;
  border: 1px solid ${T.line};
  border-radius: 16px;
  padding: 0 18px;
  margin-bottom: 24px;
}

.search-box svg {
  color: ${T.stone};
}

.search-box input {
  border: 0;
  outline: none;
  flex: 1;
  font-size: 17px;
  min-width: 0;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
}

th {
  text-align: left;
  color: ${T.stone};
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 14px 12px;
  border-bottom: 1px solid ${T.line};
}

td {
  padding: 17px 12px;
  border-bottom: 1px solid ${T.line};
}

.hotel-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hotel-name-cell strong,
.hotel-name-cell span {
  display: block;
}

.hotel-name-cell span {
  color: ${T.stone};
  font-size: 12px;
  margin-top: 4px;
}

.table-icon {
  width: 43px;
  height: 43px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${T.tealLight};
  color: ${T.teal};
}

.contact-cell span {
  display: block;
  margin: 3px 0;
}

.status-badge,
.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
}

.status-active {
  background: ${T.sageLight};
  color: ${T.tealDeep};
}

.status-suspended {
  background: ${T.redLight};
  color: ${T.red};
}

.role-badge {
  background: ${T.tealLight};
  color: ${T.tealDeep};
}

.empty-state {
  min-height: 310px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 30px;
}

.empty-icon {
  width: 82px;
  height: 82px;
  border-radius: 24px;
  background: ${T.tealLight};
  color: ${T.teal};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 23px;
  margin: 0 0 8px;
}

.empty-state p {
  color: ${T.stone};
  max-width: 500px;
  margin: 0;
  line-height: 1.5;
}

.inline-loading {
  min-height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: ${T.stone};
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid ${T.tealLight};
  border-top-color: ${T.teal};
  border-radius: 50%;
  animation: haloSpin 0.8s linear infinite;
}

.loading-spinner.small {
  width: 22px;
  height: 22px;
}

.loading-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: ${T.paper};
  color: ${T.tealDeep};
}

.loading-screen strong {
  font-size: 23px;
}

.loading-screen span {
  color: ${T.stone};
}

/* MODAL */

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(27,36,48,0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px;
  z-index: 100;
}

.modal {
  width: min(100%, 700px);
  max-height: 92vh;
  overflow-y: auto;
  background: white;
  border-radius: 26px;
  border: 1px solid ${T.line};
  box-shadow: 0 30px 100px rgba(27,36,48,0.2);
  padding: 30px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 30px;
}

.modal-icon {
  width: 53px;
  height: 53px;
  border-radius: 15px;
  background: ${T.tealLight};
  color: ${T.teal};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.modal-header h2 {
  margin: 0;
  font-size: 27px;
}

.modal-header p {
  margin: 7px 0 0;
  color: ${T.stone};
}

.modal-close {
  border: 0;
  background: ${T.paper};
  width: 43px;
  height: 43px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${T.inkSoft};
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-grid .full {
  grid-column: 1 / -1;
}

.modal .field {
  margin: 0;
}

.modal .field input,
.modal .field select {
  width: 100%;
  min-height: 56px;
  border: 1px solid ${T.line};
  border-radius: 13px;
  outline: none;
  padding: 0 15px;
  background: white;
  color: ${T.ink};
}

.modal .field input:focus,
.modal .field select:focus {
  border-color: ${T.teal};
  box-shadow: 0 0 0 3px ${T.tealLight};
}

.simple-input-icon {
  min-height: 56px;
  display: flex;
  align-items: center;
  gap: 9px;
  border: 1px solid ${T.line};
  border-radius: 13px;
  padding: 0 14px;
}

.simple-input-icon:focus-within {
  border-color: ${T.teal};
  box-shadow: 0 0 0 3px ${T.tealLight};
}

.simple-input-icon svg {
  color: ${T.stone};
  flex: 0 0 auto;
}

.simple-input-icon input {
  border: 0 !important;
  box-shadow: none !important;
  padding: 0 !important;
}

.modal-error {
  margin-bottom: 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
}

/* SETTINGS */

.settings-row {
  display: flex;
  align-items: flex-start;
  gap: 17px;
  padding: 22px 0;
  border-bottom: 1px solid ${T.line};
}

.settings-row:last-child {
  border-bottom: 0;
}

.settings-icon {
  width: 47px;
  height: 47px;
  border-radius: 14px;
  background: ${T.tealLight};
  color: ${T.teal};
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.settings-row h3 {
  margin: 0 0 6px;
}

.settings-row p {
  margin: 0;
  color: ${T.stone};
}

/* HOTEL */

.hotel-placeholder {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 25px;
  background: ${T.paper};
}

.hotel-placeholder-card {
  width: min(100%, 550px);
  background: white;
  border: 1px solid ${T.line};
  border-radius: 27px;
  padding: 45px;
  text-align: center;
}

.hotel-placeholder-card .brand-logo {
  margin: 0 auto 25px;
}

.hotel-placeholder-card h1 {
  margin: 0 0 12px;
}

.hotel-placeholder-card p {
  color: ${T.stone};
  line-height: 1.6;
}

.profile-box {
  background: ${T.tealLight};
  border-radius: 15px;
  padding: 17px;
  margin: 25px 0;
}

.profile-box strong,
.profile-box span {
  display: block;
}

.profile-box span {
  color: ${T.tealDeep};
  margin-top: 5px;
}

/* MOBILE */

.mobile-menu-button,
.sidebar-close {
  display: none;
  border: 0;
  background: transparent;
}

.mobile-overlay {
  display: none;
}

@media (max-width: 1050px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }

  .sidebar.sidebar-open {
    transform: translateX(0);
  }

  .main-content {
    width: 100%;
    margin-left: 0;
  }

  .mobile-menu-button {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sidebar-close {
    display: flex;
    margin-left: auto;
  }

  .mobile-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.35);
    z-index: 20;
  }
}

@media (max-width: 700px) {
  .auth-page {
    padding: 14px;
  }

  .auth-card {
    padding: 32px 22px;
    border-radius: 24px;
  }

  .auth-brand {
    margin-bottom: 40px;
  }

  .auth-card h1 {
    font-size: 35px;
  }

  .auth-subtitle {
    font-size: 18px;
  }

  .page-container {
    padding: 25px 16px;
  }

  .topbar {
    padding: 16px;
  }

  .topbar-user-info {
    display: none;
  }

  .page-intro {
    align-items: flex-start;
    flex-direction: column;
  }

  .page-intro h1 {
    font-size: 37px;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .panel {
    padding: 19px;
    border-radius: 19px;
  }

  .panel-header {
    flex-direction: column;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-grid .full {
    grid-column: auto;
  }

  .modal {
    padding: 22px;
    border-radius: 21px;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions button {
    width: 100%;
  }
}

@keyframes haloSpin {
  to {
    transform: rotate(360deg);
  }
}
`;

export default App;
