import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Building2, Receipt, Settings, LogOut, Menu, X, Users,
  Plus, Search, RefreshCw, Shield, AlertCircle, CheckCircle2, XCircle,
  Mail, Phone, MapPin, Eye, EyeOff, Lock
} from "lucide-react";
import { supabase } from "./supabase";

const T = {
  ink: "#1B2430", inkSoft: "#2A3444", paper: "#F6F4EF", card: "#FFFFFF",
  line: "#E6E2D8", stone: "#8A8578", teal: "#2F6F62", tealLight: "#DCEAE6",
  tealDeep: "#1F4B41", clay: "#C1622C", clayLight: "#F3E0D3", sage: "#7A8C6E",
  sageLight: "#E6EBDF", amber: "#D9A441", amberLight: "#F7ECD6", red: "#B4463D",
  redLight: "#F3DEDB"
};

const menuItems = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { key: "establishments", label: "Établissements", icon: Building2 },
  { key: "billing", label: "Facturation", icon: Receipt },
  { key: "administrators", label: "Administrateurs", icon: Users },
  { key: "settings", label: "Réglages", icon: Settings }
];

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [authMode, setAuthMode] = useState(
    new URLSearchParams(window.location.search).get("invite") === "1" ? "invite" : "login"
  );
  const isInviteUrl = new URLSearchParams(window.location.search).get("invite") === "1";
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
      const { data: { session: currentSession } } =
        await supabase.auth.getSession();

      if (!mounted) return;

      setSession(currentSession);

      if (currentSession?.user) {
        await loadProfile(currentSession.user.id);
      } else {
        setLoading(false);
      }
    }

    const isInvite =
      window.location.hash.includes("type=invite") || isInviteUrl;

    if (isInvite) setAuthMode("invite");

    init();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (_event, newSession) => {
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

    if (error || !data || data.status !== "active") {
      if (error) console.error(error);
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
      password
    });

    if (error) setAuthMessage(error.message);

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

    const { error } =
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin
      });

    setAuthMessage(
      error
        ? error.message
        : "Si cette adresse existe, un email de réinitialisation a été envoyé."
    );

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
      password: newPassword
    });

    if (error) {
      setAuthMessage(error.message);
    } else {
      setAuthMessage(
        "Votre mot de passe a été modifié. Vous pouvez vous connecter."
      );
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

  if (loading) return <LoadingScreen />;  
  
  if (
    window.location.hash.includes("type=recovery") ||
    window.location.hash.includes("type=invite") ||
    isInviteUrl ||
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
                onClick={() => setShowPassword(v => !v)}
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
                  onClick={() => setShowPassword(v => !v)}
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
      {mobileMenu && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <Sidebar
        page={page}
        setPage={value => {
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

function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <div className="auth-card">{children}</div>
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
    <div className="message">
      <AlertCircle size={19} />
      <span>{text}</span>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <strong>Hôtel Halo</strong>
      <span>Chargement sécurisé...</span>
    </div>
  );
}

function Sidebar({ page, setPage, onLogout, mobileMenu }) {
  return (
    <aside
      className={`sidebar ${
        mobileMenu ? "sidebar-open" : ""
      }`}
    >
      <div className="sidebar-brand">
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

          return (
            <button
              key={item.key}
              className={`nav-item ${
                page === item.key ? "active" : ""
              }`}
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

        <button
          className="logout-button"
          onClick={onLogout}
        >
          <LogOut size={20} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

function SuperAdminDashboard() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadHotels() {
    setLoading(true);

    const { data, error } = await supabase
      .from("hotels")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

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
            <p>
              Les derniers hôtels enregistrés sur la
              plateforme.
            </p>
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

function KpiCard({ icon: Icon, label, value, small }) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon">
        <Icon size={23} />
      </div>

      <div className="kpi-content">
        <span>{label}</span>
        <strong className={small ? "small-value" : ""}>
          {value}
        </strong>
      </div>
    </div>
  );
}

function Establishments() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");

  async function loadHotels() {
    setLoading(true);

    const { data, error } = await supabase
      .from("hotels")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

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

  const filteredHotels = hotels.filter((hotel) => {
    const text = `${hotel.name || ""} ${
      hotel.email || ""
    } ${hotel.phone || ""}`.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <>
      <PageIntro
        title="Établissements"
        subtitle="Gérez les hôtels présents sur la plateforme Hôtel Halo."
        action={
          <button
            className="primary-button"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={19} />
            Nouvel établissement
          </button>
        }
      />

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={19} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un établissement..."
            />
          </div>

          <button
            className="secondary-button"
            onClick={loadHotels}
          >
            <RefreshCw size={18} />
            Actualiser
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            <strong>Chargement...</strong>
          </div>
        ) : filteredHotels.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Aucun établissement"
            text="Aucun hôtel ne correspond à votre recherche."
          />
        ) : (
          <HotelTable hotels={filteredHotels} />
        )}
      </section>

      {showCreate && (
        <CreateHotelModal
          onClose={() => setShowCreate(false)}
          onCreated={async () => {
            setShowCreate(false);
            await loadHotels();
          }}
        />
      )}
    </>
  );
}

function CreateHotelModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function createHotel(event) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Le nom de l'établissement est obligatoire.");
      return;
    }

    setSaving(true);
    setError("");

    const { error: insertError } = await supabase
      .from("hotels")
      .insert({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        status: "active",
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    await onCreated();
  }

  return (
    <Modal title="Nouvel établissement" onClose={onClose}>
      <form onSubmit={createHotel}>
        <Field
          label="Nom de l'établissement"
          type="text"
          value={name}
          onChange={setName}
          placeholder="Ex. Hôtel Fleuve Congo"
          icon={Building2}
        />

        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="contact@hotel.com"
          icon={Mail}
        />

        <Field
          label="Téléphone"
          type="tel"
          value={phone}
          onChange={setPhone}
          placeholder="+243 ..."
          icon={Phone}
        />

        <div className="field">
          <label>Adresse</label>

          <div className="input-wrapper">
            <MapPin
              size={22}
              className="input-icon"
            />

            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Adresse de l'établissement"
            />
          </div>
        </div>

        {error && <Message text={error} />}

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Annuler
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving ? "Création..." : "Créer l'établissement"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function HotelTable({ hotels }) {
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Établissement</th>
            <th>Email</th>
            <th>Téléphone</th>
            <th>Statut</th>
            <th>Créé le</th>
          </tr>
        </thead>

        <tbody>
          {hotels.map((hotel) => (
            <tr key={hotel.id}>
              <td>
                <div className="table-primary">
                  <div className="table-avatar">
                    <Building2 size={18} />
                  </div>

                  <div>
                    <strong>{hotel.name}</strong>
                    <span>
                      ID #{hotel.id}
                    </span>
                  </div>
                </div>
              </td>

              <td>{hotel.email || "—"}</td>

              <td>{hotel.phone || "—"}</td>

              <td>
                <StatusBadge status={hotel.status} />
              </td>

              <td>
                {hotel.created_at
                  ? new Date(
                      hotel.created_at
                    ).toLocaleDateString("fr-FR")
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
      }

function Administrators() {
  const [hotels, setHotels] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [hotelId, setHotelId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);

    const [
      hotelsResult,
      adminsResult,
    ] = await Promise.all([
      supabase
        .from("hotels")
        .select("*")
        .order("name"),

      supabase
        .from("admins")
        .select("*")
        .in("role", ["admin", "super_admin"])
        .order("created_at", {
          ascending: false,
        }),
    ]);

    if (hotelsResult.error) {
      console.error(hotelsResult.error);
    } else {
      setHotels(hotelsResult.data || []);
    }

    if (adminsResult.error) {
      console.error(adminsResult.error);
    } else {
      setAdmins(adminsResult.data || []);
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        const response = await fetch(
          "/api/admin/pending-invitations",
          {
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
          }
        );

        const result = await response.json();

        if (response.ok) {
          setInvitations(
            result.invitations || []
          );
        }
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function sendInvitation(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (
      !hotelId ||
      !fullName.trim() ||
      !email.trim()
    ) {
      setError(
        "Tous les champs sont obligatoires."
      );
      return;
    }

    setSending(true);

    try {
      const normalizedEmail =
        email.trim().toLowerCase();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          "Votre session Super-Admin est invalide."
        );
      }

      const response = await fetch(
        "/api/admin/invite",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
          },

          body: JSON.stringify({
            hotel_id: Number(hotelId),
            full_name: fullName.trim(),
            email: normalizedEmail,
            role: "admin",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Impossible de créer l'invitation."
        );
      }

      if (!result?.invitation_token) {
        throw new Error(
          "L'invitation a été créée, mais aucun jeton d'activation n'a été reçu."
        );
      }

      const activationUrl =
        `${window.location.origin}/?invite=1&token=` +
        `${encodeURIComponent(
          result.invitation_token
        )}`;

      setMessage(
        `Invitation créée pour ${normalizedEmail}. ` +
        `Le lien d'activation est prêt.`
      );

      console.log(
        "Lien d'activation de test :",
        activationUrl
      );

      setFullName("");
      setEmail("");
      setHotelId("");

      await loadData();
    } catch (err) {
      setError(
        err.message ||
          "Une erreur est survenue."
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
        throw new Error(
          "Votre session Super-Admin est invalide."
        );
      }

      const response = await fetch(
        "/api/admin/resend-invitation",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
          },

          body: JSON.stringify({
            invitation_id: invitationId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Impossible de renvoyer l'invitation."
        );
      }

      if (!result?.invitation_token) {
        throw new Error(
          "Le nouveau lien d'invitation n'a pas été reçu."
        );
      }

      const activationUrl =
        `${window.location.origin}/?invite=1&token=` +
        `${encodeURIComponent(
          result.invitation_token
        )}`;

      console.log(
        "Nouveau lien d'activation de test :",
        activationUrl
      );

      setMessage(
        "Un nouveau lien d'activation a été généré. " +
        "Consultez la console du navigateur pour le test."
      );

      await loadData();
    } catch (err) {
      setError(
        err.message ||
          "Une erreur est survenue."
      );
    }
  }

  function getHotelName(id) {
    const hotel = hotels.find(
      (item) =>
        String(item.id) === String(id)
    );

    return hotel?.name || "—";
  }

  const administrators = admins.filter(
    (admin) =>
      admin.role === "admin" ||
      admin.role === "super_admin"
  );

  return (
    <>
      <PageIntro
        title="Administrateurs"
        subtitle="Invitez et gérez les administrateurs des établissements."
      />

      <div className="two-column-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Inviter un administrateur</h2>

              <p>
                L'administrateur recevra un lien
                sécurisé pour créer son mot de passe.
              </p>
            </div>
          </div>

          <form onSubmit={sendInvitation}>
            <div className="field">
              <label>Établissement</label>

              <div className="input-wrapper">
                <Building2
                  size={22}
                  className="input-icon"
                />

                <select
                  value={hotelId}
                  onChange={(e) =>
                    setHotelId(e.target.value)
                  }
                >
                  <option value="">
                    Sélectionner un établissement
                  </option>

                  {hotels.map((hotel) => (
                    <option
                      key={hotel.id}
                      value={hotel.id}
                    >
                      {hotel.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Field
              label="Nom complet"
              type="text"
              value={fullName}
              onChange={setFullName}
              placeholder="Nom de l'administrateur"
              icon={User}
            />

            <Field
              label="Adresse email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="administrateur@hotel.com"
              icon={Mail}
            />

            {error && (
              <Message text={error} />
            )}

            {message && (
              <div className="success-message">
                <CheckCircle2 size={19} />
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={sending}
            >
              {sending ? (
                "Création..."
              ) : (
                <>
                  <Send size={18} />
                  Créer l'invitation
                </>
              )}
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Administrateurs actifs</h2>

              <p>
                Les comptes administrateurs
                actuellement associés aux hôtels.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <strong>Chargement...</strong>
            </div>
          ) : administrators.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Aucun administrateur"
              text="Aucun administrateur d'hôtel n'est encore enregistré."
            />
          ) : (
            <div className="admin-list">
              {administrators.map((admin) => (
                <div
                  className="admin-list-item"
                  key={admin.id}
                >
                  <div className="table-avatar">
                    <User size={18} />
                  </div>

                  <div className="admin-list-main">
                    <strong>
                      {admin.full_name}
                    </strong>

                    <span>
                      {admin.email}
                    </span>

                    <small>
                      {getHotelName(
                        admin.hotel_id
                      )}
                    </small>
                  </div>

                  <StatusBadge
                    status={admin.status}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Invitations en attente</h2>

            <p>
              Les invitations qui n'ont pas encore
              été activées.
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={loadData}
          >
            <RefreshCw size={18} />
            Actualiser
          </button>
        </div>

        {invitations.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="Aucune invitation en attente"
            text="Toutes les invitations ont été traitées."
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Administrateur</th>
                  <th>Établissement</th>
                  <th>Email</th>
                  <th>Expiration</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {invitations.map(
                  (invitation) => (
                    <tr key={invitation.id}>
                      <td>
                        <strong>
                          {invitation.full_name}
                        </strong>
                      </td>

                      <td>
                        {getHotelName(
                          invitation.hotel_id
                        )}
                      </td>

                      <td>
                        {invitation.email}
                      </td>

                      <td>
                        {invitation.expires_at
                          ? new Date(
                              invitation.expires_at
                            ).toLocaleString(
                              "fr-FR"
                            )
                          : "—"}
                      </td>

                      <td>
                        <button
                          className="secondary-button small-button"
                          onClick={() =>
                            resendInvitation(
                              invitation.id
                            )
                          }
                        >
                          <RefreshCw size={16} />
                          Renvoyer
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
  }

function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadInvoices() {
    setLoading(true);

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("paid_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
    } else {
      setInvoices(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  return (
    <>
      <PageIntro
        title="Facturation"
        subtitle="Suivez les paiements et la facturation de la plateforme."
      />

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Paiements</h2>
            <p>
              Vue globale des paiements enregistrés.
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={loadInvoices}
          >
            <RefreshCw size={18} />
            Actualiser
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            <strong>Chargement...</strong>
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Aucun paiement"
            text="Aucun paiement n'est encore enregistré."
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Montant</th>
                  <th>Méthode</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <strong>
                        #{invoice.id}
                      </strong>
                    </td>

                    <td>
                      {Number(
                        invoice.amount || 0
                      ).toLocaleString("fr-FR")}{" "}
                      $
                    </td>

                    <td>
                      {invoice.method || "—"}
                    </td>

                    <td>
                      <StatusBadge
                        status={
                          invoice.status ||
                          "paid"
                        }
                      />
                    </td>

                    <td>
                      {invoice.paid_at
                        ? new Date(
                            invoice.paid_at
                          ).toLocaleString(
                            "fr-FR"
                          )
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function SettingsPage() {
  return (
    <>
      <PageIntro
        title="Réglages"
        subtitle="Paramètres généraux de la plateforme Hôtel Halo."
      />

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Configuration de la plateforme</h2>

            <p>
              Les paramètres avancés seront disponibles
              dans les prochaines étapes.
            </p>
          </div>
        </div>

        <div className="settings-list">
          <div className="settings-item">
            <div className="settings-icon">
              <DollarSign size={21} />
            </div>

            <div>
              <strong>Plans et tarifs</strong>
              <span>
                Gestion des abonnements SaaS.
              </span>
            </div>

            <span className="coming-soon">
              Bientôt
            </span>
          </div>

          <div className="settings-item">
            <div className="settings-icon">
              <Shield size={21} />
            </div>

            <div>
              <strong>Sécurité</strong>
              <span>
                Paramètres de sécurité et accès.
              </span>
            </div>

            <span className="coming-soon">
              Bientôt
            </span>
          </div>

          <div className="settings-item">
            <div className="settings-icon">
              <Bell size={21} />
            </div>

            <div>
              <strong>Notifications</strong>
              <span>
                Configuration des notifications.
              </span>
            </div>

            <span className="coming-soon">
              Bientôt
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

function HotelPlaceholder({ profile, onLogout }) {
  return (
    <div className="hotel-placeholder">
      <div className="hotel-placeholder-card">
        <div className="brand-logo">H</div>

        <h1>
          Bienvenue sur Hôtel Halo
        </h1>

        <p>
          Bonjour{" "}
          <strong>
            {profile.full_name}
          </strong>
          .
        </p>

        <p>
          Votre espace Administrateur d'hôtel
          sera disponible ici.
        </p>

        <div className="placeholder-badge">
          <Shield size={18} />
          Compte sécurisé
        </div>

        <button
          className="primary-button"
          onClick={onLogout}
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="modal-card">
        <div className="modal-header">
          <h2>{title}</h2>

          <button
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X size={22} />
          </button>
        </div>

        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

function PageIntro({
  title,
  subtitle,
  action,
}) {
  return (
    <div className="page-intro">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      {action && (
        <div className="page-intro-action">
          {action}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized =
    String(status || "")
      .toLowerCase()
      .trim();

  let label = status || "Inconnu";

  if (
    normalized === "active" ||
    normalized === "actif"
  ) {
    label = "Actif";
  } else if (
    normalized === "suspended" ||
    normalized === "suspendu"
  ) {
    label = "Suspendu";
  } else if (
    normalized === "paid" ||
    normalized === "payée" ||
    normalized === "paye"
  ) {
    label = "Payée";
  } else if (
    normalized === "pending" ||
    normalized === "en attente"
  ) {
    label = "En attente";
  } else if (
    normalized === "overdue" ||
    normalized === "en retard"
  ) {
    label = "En retard";
  }

  return (
    <span
      className={`status-badge status-${normalized.replace(
        /\s+/g,
        "-"
      )}`}
    >
      <span className="status-dot" />
      {label}
    </span>
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
        <Icon size={28} />
      </div>

      <strong>{title}</strong>

      <span>{text}</span>
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
  box-shadow:
    0 25px 80px rgba(27, 36, 48, 0.08);
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
}

.primary-small-button {
  min-height: 46px;
  padding: 0 17px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}

.link-button {
  display: block;
  width: 100%;
  border: 0;
  background: transparent;
  color: ${T.teal};
  font-weight: 700;
  margin-top: 18px;
  padding: 8px;
}

.message {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  padding: 13px 14px;
  border-radius: 12px;
  background: ${T.redLight};
  color: ${T.red};
  font-weight: 600;
  margin-bottom: 12px;
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

.app-shell {
  min-height: 100vh;
}

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 292px;
  background: white;
  border-right: 1px solid ${T.line};
  padding: 25px;
  display: flex;
  flex-direction: column;
  z-index: 30;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 13px;
}

.sidebar-brand .brand-logo {
  width: 52px;
  height: 52px;
  border-radius: 15px;
  font-size: 25px;
}

.brand-text strong,
.brand-text span {
  display: block;
}

.brand-text strong {
  font-size: 19px;
}

.brand-text span {
  color: ${T.stone};
  font-size: 12px;
  margin-top: 3px;
}

.sidebar-section-title {
  font-size: 11px;
  font-weight: 800;
  color: ${T.stone};
  letter-spacing: 1.5px;
  margin: 42px 0 13px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  border: 0;
  background: transparent;
  color: ${T.inkSoft};
  padding: 13px 14px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  text-align: left;
}

.nav-item:hover,
.nav-item.active {
  background: ${T.tealLight};
  color: ${T.tealDeep};
}

.sidebar-bottom {
  margin-top: auto;
}

.security-box {
  display: flex;
  gap: 11px;
  align-items: center;
  background: ${T.paper};
  padding: 14px;
  border-radius: 13px;
  margin-bottom: 12px;
  color: ${T.tealDeep};
}

.security-box strong,
.security-box span {
  display: block;
}

.security-box span {
  font-size: 12px;
  color: ${T.stone};
  margin-top: 3px;
}

.logout-button {
  width: 100%;
  border: 0;
  background: transparent;
  color: ${T.red};
  padding: 13px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  gap: 12px;
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
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
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

.kpi-content span {
  display: block;
  color: ${T.stone};
  font-weight: 700;
  margin-bottom: 8px;
}

.kpi-content strong {
  display: block;
  font-size: 32px;
}

.kpi-content .small-value {
  font-size: 23px;
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

.table-primary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-primary strong,
.table-primary span {
  display: block;
}

.table-primary span {
  color: ${T.stone};
  font-size: 12px;
  margin-top: 4px;
}

.table-avatar {
  width: 43px;
  height: 43px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${T.tealLight};
  color: ${T.teal};
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.status-active,
.status-paid {
  background: ${T.sageLight};
  color: ${T.tealDeep};
}

.status-suspended,
.status-overdue {
  background: ${T.redLight};
  color: ${T.red};
}

.status-pending {
  background: ${T.amberLight};
  color: ${T.clay};
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

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(27, 36, 48, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px;
  z-index: 100;
}

.modal-card {
  width: min(100%, 700px);
  max-height: 92vh;
  overflow-y: auto;
  background: white;
  border-radius: 26px;
  border: 1px solid ${T.line};
  box-shadow:
    0 30px 100px rgba(27, 36, 48, 0.2);
  padding: 30px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 30px;
}

.modal-header h2 {
  margin: 0;
  font-size: 27px;
}

.modal-body {
  width: 100%;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
}

.settings-list {
  display: flex;
  flex-direction: column;
}

.settings-item {
  display: flex;
  align-items: center;
  gap: 17px;
  padding: 22px 0;
  border-bottom: 1px solid ${T.line};
}

.settings-item:last-child {
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

.settings-item strong,
.settings-item span {
  display: block;
}

.settings-item > div:nth-child(2) {
  flex: 1;
}

.settings-item span {
  color: ${T.stone};
  margin-top: 4px;
}

.coming-soon {
  font-size: 12px;
  font-weight: 800;
  background: ${T.paper};
  padding: 7px 10px;
  border-radius: 999px;
}

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

.placeholder-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: ${T.tealLight};
  color: ${T.tealDeep};
  padding: 10px 14px;
  border-radius: 999px;
  font-weight: 700;
  margin: 15px 0 25px;
}

.admin-list {
  display: flex;
  flex-direction: column;
}

.admin-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid ${T.line};
}

.admin-list-item:last-child {
  border-bottom: 0;
}

.admin-list-main {
  flex: 1;
}

.admin-list-main strong,
.admin-list-main span,
.admin-list-main small {
  display: block;
}

.admin-list-main span,
.admin-list-main small {
  color: ${T.stone};
  margin-top: 3px;
}

.success-message {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  padding: 13px 14px;
  border-radius: 12px;
  background: ${T.tealLight};
  color: ${T.tealDeep};
  font-weight: 600;
  margin-bottom: 12px;
}

.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 24px;
}

.toolbar .search-box {
  flex: 1;
  margin-bottom: 0;
}

.small-button {
  padding: 8px 11px;
  font-size: 13px;
}

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
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
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
    background: rgba(0, 0, 0, 0.35);
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

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-card {
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

function Styles() {
  return <style>{globalStyles}</style>;
}

const OriginalApp = App;

export default function AppWithStyles() {
  return (
    <>
      <Styles />
      <OriginalApp />
    </>
  );
        }
