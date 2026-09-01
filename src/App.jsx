import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  Users,
  Wallet,
  Receipt,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  UserPlus,
  Shield,
  RefreshCw,
  AlertCircle,
  Building2,
} from "lucide-react";
import { supabase } from "./supabase";

const C = {
  blue: "#2563eb",
  blueLight: "#eff6ff",
  bg: "#f5f7fb",
  text: "#172033",
  muted: "#6b7280",
  border: "#e5e7eb",
  dark: "#111827",
  green: "#166534",
  greenBg: "#dcfce7",
  red: "#991b1b",
  redBg: "#fee2e2",
};

const ROLE_LABELS = {
  super_admin: "Super-Administrateur",
  admin: "Administrateur",
  manager: "Gérant",
  receptionist: "Réceptionniste",
};

const MENU = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
  },
  {
    id: "rooms",
    label: "Chambres",
    icon: BedDouble,
  },
  {
    id: "reservations",
    label: "Réservations",
    icon: CalendarDays,
  },
  {
    id: "clients",
    label: "Clients",
    icon: Users,
  },
  {
    id: "finances",
    label: "Finances",
    icon: Wallet,
  },
  {
    id: "payments",
    label: "Paiements",
    icon: Receipt,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
  },
  {
    id: "settings",
    label: "Paramètres",
    icon: Settings,
  },
];

const PERMISSIONS = {
  admin: [
    "dashboard",
    "rooms",
    "reservations",
    "clients",
    "finances",
    "payments",
    "notifications",
    "settings",
  ],

  manager: [
    "dashboard",
    "rooms",
    "reservations",
    "clients",
    "finances",
    "payments",
    "notifications",
  ],

  receptionist: [
    "dashboard",
    "rooms",
    "reservations",
    "clients",
    "payments",
    "notifications",
  ],
};

function initials(name = "Utilisateur") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0].toUpperCase())
    .join("");
}

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [hotel, setHotel] = useState(null);

  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [authMode, setAuthMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;

    async function start() {
      const { data } = await supabase.auth.getSession();

      if (!alive) return;

      const currentSession = data.session || null;

      setSession(currentSession);

      if (currentSession) {
        await loadProfile(currentSession.user.id);
      } else {
        setLoading(false);
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!alive) return;

      setSession(nextSession || null);

      if (nextSession) {
        await loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
        setHotel(null);
        setLoading(false);
      }
    });

    start();

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadProfile(userId) {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("admins")
      .select(
        "id, hotel_id, full_name, email, role, status"
      )
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setProfile(null);
      setHotel(null);
      setError(
        "Votre compte existe dans Supabase Auth, mais aucun profil Hôtel Halo ne lui est associé."
      );
      setLoading(false);
      return;
    }

    if (data.status !== "active") {
      await supabase.auth.signOut();

      setProfile(null);
      setHotel(null);
      setError("Ce compte est désactivé.");
      setLoading(false);

      return;
    }

    setProfile(data);

    if (data.hotel_id) {
      const { data: hotelData } = await supabase
        .from("hotels")
        .select(
          "id, name, email, phone, address, status"
        )
        .eq("id", data.hotel_id)
        .maybeSingle();

      setHotel(hotelData || null);
    } else {
      setHotel(null);
    }

    setLoading(false);
  }

  async function login(event) {
    event.preventDefault();

    setBusy(true);
    setError("");
    setMessage("");

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setError(error.message);
    }

    setBusy(false);
  }

  async function forgotPassword(event) {
    event.preventDefault();

    setBusy(true);
    setError("");
    setMessage("");

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: window.location.origin,
        }
      );

    if (error) {
      setError(error.message);
    } else {
      setMessage(
        "Si cette adresse possède un compte, un lien de réinitialisation a été envoyé."
      );
    }

    setBusy(false);
  }

  async function changePassword(event) {
    event.preventDefault();

    setBusy(true);
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError(
        "Le nouveau mot de passe doit contenir au moins 8 caractères."
      );

      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage(
        "Mot de passe modifié avec succès."
      );

      setNewPassword("");

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }

    setBusy(false);
  }

  async function logout() {
    await supabase.auth.signOut();

    setPage("dashboard");
  }

  const allowed = useMemo(() => {
    if (!profile) return [];

    return MENU.filter((item) =>
      (PERMISSIONS[profile.role] || []).includes(
        item.id
      )
    );
  }, [profile]);

  useEffect(() => {
    if (
      profile &&
      allowed.length > 0 &&
      !allowed.some((item) => item.id === page)
    ) {
      setPage("dashboard");
    }
  }, [profile, allowed, page]);

  const recovery =
    window.location.hash.includes(
      "type=recovery"
    );

  if (loading) {
    return <Loading />;
  }

  if (recovery) {
    return (
      <AuthShell
        title="Nouveau mot de passe"
        subtitle="Choisissez un nouveau mot de passe sécurisé."
      >
        <form
          onSubmit={changePassword}
          style={styles.form}
        >
          <input
            style={styles.input}
            type="password"
            minLength="8"
            required
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(event) =>
              setNewPassword(event.target.value)
            }
          />

          <button
            style={styles.primary}
            disabled={busy}
          >
            {busy
              ? "Enregistrement..."
              : "Changer le mot de passe"}
          </button>

          {message && (
            <div style={styles.success}>
              {message}
            </div>
          )}

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}
        </form>
      </AuthShell>
    );
  }

  if (!session || !profile) {
    return (
      <AuthShell
        title={
          authMode === "forgot"
            ? "Mot de passe oublié"
            : "Connexion à Hôtel Halo"
        }
        subtitle={
          authMode === "forgot"
            ? "Entrez votre adresse e-mail pour recevoir un lien sécurisé."
            : "Connectez-vous à votre espace d'administration."
        }
      >
        {authMode === "forgot" ? (
          <form
            onSubmit={forgotPassword}
            style={styles.form}
          >
            <input
              style={styles.input}
              type="email"
              required
              placeholder="Adresse e-mail"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />

            <button
              style={styles.primary}
              disabled={busy}
            >
              {busy
                ? "Envoi..."
                : "Recevoir le lien"}
            </button>

            <button
              type="button"
              style={styles.link}
              onClick={() => {
                setAuthMode("login");
                setError("");
                setMessage("");
              }}
            >
              Retour à la connexion
            </button>

            {message && (
              <div style={styles.success}>
                {message}
              </div>
            )}

            {error && (
              <div style={styles.error}>
                {error}
              </div>
            )}
          </form>
        ) : (
          <form
            onSubmit={login}
            style={styles.form}
          >
            <input
              style={styles.input}
              type="email"
              required
              placeholder="Adresse e-mail"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />

            <input
              style={styles.input}
              type="password"
              required
              placeholder="Mot de passe"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
            />

            <button
              style={styles.primary}
              disabled={busy}
            >
              {busy
                ? "Connexion..."
                : "Se connecter"}
            </button>

            <button
              type="button"
              style={styles.link}
              onClick={() => {
                setAuthMode("forgot");
                setError("");
                setMessage("");
              }}
            >
              Mot de passe oublié ?
            </button>

            {error && (
              <div style={styles.error}>
                {error}
              </div>
            )}
          </form>
        )}
      </AuthShell>
    );
  }

  if (profile.role === "super_admin") {
    return (
      <SuperAdmin
        profile={profile}
        onLogout={logout}
      />
    );
  }

  const current =
    allowed.find((item) => item.id === page) ||
    allowed[0];

  return (
    <div style={styles.app}>
      {mobileMenu && (
        <div
          style={styles.overlay}
          onClick={() => setMobileMenu(false)}
        />
      )}

      <aside
        style={{
          ...styles.sidebar,
          ...(mobileMenu
            ? styles.sidebarOpen
            : {}),
        }}
      >
        <div style={styles.sidebarHeader}>
          <div>
            <div style={styles.hotelName}>
              🏨 {hotel?.name || "Hôtel Halo"}
            </div>

            <div style={styles.hotelType}>
              {ROLE_LABELS[profile.role]}
            </div>
          </div>

          <button
            style={styles.close}
            onClick={() =>
              setMobileMenu(false)
            }
          >
            <X size={22} />
          </button>
        </div>

        <div style={styles.menuTitle}>
          MENU PRINCIPAL
        </div>

        <nav>
          {allowed.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                style={{
                  ...styles.menuItem,
                  ...(page === item.id
                    ? styles.menuActive
                    : {}),
                }}
                onClick={() => {
                  setPage(item.id);
                  setMobileMenu(false);
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={styles.sidebarBottom}>
          <div style={styles.roleBox}>
            <Shield size={16} />
            {ROLE_LABELS[profile.role]}
          </div>

          <button
            style={styles.logout}
            onClick={logout}
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <button
            style={styles.menuButton}
            onClick={() =>
              setMobileMenu(true)
            }
          >
            <Menu size={24} />
          </button>

          <div>
            <h1 style={styles.pageTitle}>
              {current?.label ||
                "Tableau de bord"}
            </h1>

            <p style={styles.pageSubtitle}>
              Bienvenue, {profile.full_name}
            </p>
          </div>

          <div style={styles.headerRight}>
            <button
              style={styles.notification}
            >
              <Bell size={21} />
              <span style={styles.badge}>
                3
              </span>
            </button>

            <div style={styles.avatar}>
              {initials(profile.full_name)}
            </div>
          </div>
        </header>

        {page === "dashboard" ? (
          <Dashboard
            profile={profile}
            hotel={hotel}
            navigate={setPage}
          />
        ) : (
          <ModulePlaceholder
            page={current}
            role={profile.role}
          />
        )}
      </main>
    </div>
  );
}

function Loading() {
  return (
    <div style={styles.center}>
      <RefreshCw
        size={28}
        style={{
          animation:
            "haloSpin 1s linear infinite",
        }}
      />

      <strong>
        Chargement de Hôtel Halo...
      </strong>
    </div>
  );
}

function AuthShell({
  title,
  subtitle,
  children,
}) {
  return (
    <div style={styles.authPage}>
      <div style={styles.authCard}>
        <div style={{ fontSize: 48 }}>
          🏨
        </div>

        <h1 style={styles.authTitle}>
          {title}
        </h1>

        <p style={styles.authSubtitle}>
          {subtitle}
        </p>

        {children}

        <div style={styles.security}>
          <Shield size={14} />
          Connexion sécurisée
        </div>
      </div>
    </div>
  );
}

function Dashboard({
  profile,
  hotel,
  navigate,
}) {
  const stats = [
    [
      "Chambres disponibles",
      "—",
      BedDouble,
      "Données réelles à connecter",
    ],
    [
      "Chambres occupées",
      "—",
      Building2,
      "Données réelles à connecter",
    ],
    [
      "Réservations",
      "—",
      CalendarDays,
      "Données réelles à connecter",
    ],
    [
      "Revenus du mois",
      "—",
      Wallet,
      "Données réelles à connecter",
    ],
  ];

  return (
    <>
      <section style={styles.welcome}>
        <div>
          <p style={styles.welcomeSmall}>
            Aujourd'hui
          </p>

          <h2 style={styles.welcomeTitle}>
            Bonjour, {profile.full_name} 👋
          </h2>

          <p
            style={{
              margin: 0,
              opacity: 0.9,
            }}
          >
            {hotel?.name
              ? `Voici l'activité de ${hotel.name}.`
              : "Votre espace Hôtel Halo."}
          </p>
        </div>

        <div style={styles.date}>
          <CalendarDays size={19} />

          {new Date().toLocaleDateString(
            "fr-FR",
            {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }
          )}
        </div>
      </section>

      <section style={styles.stats}>
        {stats.map(
          ([
            title,
            value,
            Icon,
            info,
          ]) => (
            <div
              style={styles.stat}
              key={title}
            >
              <div style={styles.statTop}>
                <div style={styles.statIcon}>
                  <Icon size={23} />
                </div>

                <TrendingUp size={18} />
              </div>

              <p style={styles.statTitle}>
                {title}
              </p>

              <div style={styles.statValue}>
                {value}
              </div>

              <p style={styles.statInfo}>
                {info}
              </p>
            </div>
          )
        )}
      </section>

      <section style={styles.content}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2
                style={{
                  margin: "0 0 5px",
                }}
              >
                Compte sécurisé
              </h2>

              <p style={styles.muted}>
                Votre identité et votre rôle
                sont lus depuis Supabase.
              </p>
            </div>
          </div>

          <div style={styles.info}>
            <Shield size={30} />

            <div>
              <strong>
                {ROLE_LABELS[profile.role]}
              </strong>

              <p>
                Les permissions sont
                appliquées selon votre rôle
                et protégées par les règles
                RLS de la base de données.
              </p>
            </div>
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2
                style={{
                  margin: "0 0 5px",
                }}
              >
                Accès rapides
              </h2>

              <p style={styles.muted}>
                Modules autorisés
              </p>
            </div>
          </div>

          <div style={styles.quick}>
            <button
              style={styles.quickBtn}
              onClick={() =>
                navigate("reservations")
              }
            >
              <CalendarDays size={24} />
              Réservations
            </button>

            <button
              style={styles.quickBtn}
              onClick={() =>
                navigate("clients")
              }
            >
              <UserPlus size={24} />
              Clients
            </button>

            <button
              style={styles.quickBtn}
              onClick={() =>
                navigate("rooms")
              }
            >
              <BedDouble size={24} />
              Chambres
            </button>

            <button
              style={styles.quickBtn}
              onClick={() =>
                navigate("payments")
              }
            >
              <Receipt size={24} />
              Paiements
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function ModulePlaceholder({
  page,
  role,
}) {
  const Icon =
    page?.icon || LayoutDashboard;

  return (
    <section style={styles.placeholder}>
      <div style={styles.placeholderIcon}>
        <Icon size={42} />
      </div>

      <h2>
        {page?.label}
      </h2>

      <p>
        Ce module est prêt à être connecté
        aux vraies données métier. Votre
        rôle actuel est{" "}
        <strong>
          {ROLE_LABELS[role]}
        </strong>
        .
      </p>

      <div style={styles.security}>
        <Shield size={14} />
        Accès contrôlé par rôle + RLS
      </div>
    </section>
  );
}

function SuperAdmin({
  profile,
  onLogout,
}) {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    const { data, error } =
      await supabase
        .from("hotels")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      setError(error.message);
    } else {
      setHotels(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={styles.superPage}>
      <header style={styles.superHeader}>
        <div>
          <h1 style={styles.logo}>
            Hôtel Halo
          </h1>

          <p style={styles.subtitle}>
            Panneau Super-Admin
          </p>
        </div>

        <div style={styles.superRight}>
          <span style={styles.superRole}>
            <Shield size={15} />
            {ROLE_LABELS[profile.role]}
          </span>

          <button
            style={styles.logoutSmall}
            onClick={onLogout}
          >
            <LogOut size={17} />
            Déconnexion
          </button>
        </div>
      </header>

      <section style={styles.superWelcome}>
        <div style={{ fontSize: 48 }}>
          👑
        </div>

        <div>
          <h2
            style={{
              margin: "0 0 7px",
            }}
          >
            Administration globale
          </h2>

          <p style={styles.muted}>
            Seul un compte dont le rôle en
            base est{" "}
            <strong>super_admin</strong>{" "}
            arrive ici.
          </p>
        </div>
      </section>

      <section style={styles.superStats}>
        <div style={styles.superBox}>
          <strong>
            {hotels.length}
          </strong>

          <span>Hôtels</span>
        </div>

        <div style={styles.superBox}>
          <strong>—</strong>
          <span>Administrateurs</span>
        </div>

        <div style={styles.superBox}>
          <strong>—</strong>
          <span>Utilisateurs</span>
        </div>
      </section>

      <section
        style={{
          ...styles.panel,
          margin: "0 auto",
          maxWidth: 1100,
        }}
      >
        <div style={styles.panelHeader}>
          <div>
            <h2
              style={{
                margin: "0 0 5px",
              }}
            >
              Établissements
            </h2>

            <p style={styles.muted}>
              Données réelles de Supabase
            </p>
          </div>

          <button
            style={styles.refresh}
            onClick={load}
          >
            <RefreshCw size={16} />
            Actualiser
          </button>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        {loading ? (
          <div style={styles.empty}>
            Chargement...
          </div>
        ) : hotels.length === 0 ? (
          <div style={styles.empty}>
            Aucun hôtel enregistré pour le
            moment.
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Hôtel</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Statut</th>
                </tr>
              </thead>

              <tbody>
                {hotels.map((hotel) => (
                  <tr key={hotel.id}>
                    <td>
                      <strong>
                        {hotel.name}
                      </strong>
                    </td>

                    <td>
                      {hotel.email || "—"}
                    </td>

                    <td>
                      {hotel.phone || "—"}
                    </td>

                    <td>
                      <span
                        style={styles.active}
                      >
                        {hotel.status ||
                          "active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: C.bg,
    color: C.text,
    display: "flex",
  },

  sidebar: {
    width: 270,
    background: C.dark,
    color: "#fff",
    minHeight: "100vh",
    padding: "22px 16px",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 20,
    transition: "transform .25s ease",
  },

  sidebarOpen: {
    transform: "translateX(0)",
  },

  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "5px 8px 28px",
  },

  hotelName: {
    fontSize: 21,
    fontWeight: 700,
  },

  hotelType: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 5,
  },

  close: {
    display: "none",
    background: "transparent",
    border: 0,
    color: "#fff",
  },

  menuTitle: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: 700,
    padding: "0 10px 10px",
    letterSpacing: 1,
  },

  menuItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 13,
    padding: "13px 12px",
    marginBottom: 5,
    background: "transparent",
    color: "#cbd5e1",
    border: 0,
    borderRadius: 10,
    fontSize: 14,
    textAlign: "left",
    cursor: "pointer",
  },

  menuActive: {
    background: C.blue,
    color: "#fff",
  },

  sidebarBottom: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 25,
  },

  roleBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    border: "1px solid #374151",
    borderRadius: 9,
    color: "#d1d5db",
    fontSize: 12,
    marginBottom: 10,
  },

  logout: {
    width: "100%",
    padding: 11,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    border: 0,
    background: "#1f2937",
    color: "#d1d5db",
    borderRadius: 9,
    cursor: "pointer",
  },

  main: {
    marginLeft: 270,
    width: "calc(100% - 270px)",
    minHeight: "100vh",
  },

  header: {
    height: 82,
    background: "#fff",
    borderBottom: `1px solid ${C.border}`,
    padding: "0 30px",
    display: "flex",
    alignItems: "center",
    gap: 18,
  },

  menuButton: {
    display: "none",
    border: 0,
    background: "transparent",
    cursor: "pointer",
  },

  pageTitle: {
    margin: 0,
    fontSize: 24,
  },

  pageSubtitle: {
    margin: "5px 0 0",
    color: C.muted,
    fontSize: 13,
  },

  headerRight: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: 17,
  },

  notification: {
    position: "relative",
    background: "#f3f4f6",
    border: 0,
    width: 42,
    height: 42,
    borderRadius: "50%",
    cursor: "pointer",
  },

  badge: {
    position: "absolute",
    right: -2,
    top: -2,
    background: "#ef4444",
    color: "#fff",
    borderRadius: "50%",
    width: 19,
    height: 19,
    fontSize: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: C.blue,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },

  welcome: {
    margin: "28px 30px 22px",
    padding: 26,
    borderRadius: 16,
    background: C.blue,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  welcomeSmall: {
    margin: 0,
    opacity: 0.8,
    fontSize: 13,
  },

  welcomeTitle: {
    margin: "7px 0",
    fontSize: 24,
  },

  date: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,.15)",
    padding: "12px 15px",
    borderRadius: 10,
    fontSize: 13,
  },

  stats: {
    padding: "0 30px",
    display: "grid",
    gridTemplateColumns:
      "repeat(4,1fr)",
    gap: 18,
  },

  stat: {
    background: "#fff",
    border: `1px solid ${C.border}`,
    borderRadius: 15,
    padding: 19,
  },

  statTop: {
    display: "flex",
    justifyContent: "space-between",
    color: C.blue,
  },

  statIcon: {
    width: 43,
    height: 43,
    borderRadius: 10,
    background: C.blueLight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  statTitle: {
    color: C.muted,
    fontSize: 13,
    margin: "15px 0 7px",
  },

  statValue: {
    fontSize: 26,
    fontWeight: 700,
  },

  statInfo: {
    color: C.muted,
    fontSize: 12,
  },

  content: {
    padding: "22px 30px 40px",
    display: "grid",
    gridTemplateColumns:
      "1.5fr 1fr",
    gap: 20,
  },

  panel: {
    background: "#fff",
    border: `1px solid ${C.border}`,
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 25,
  },

  panelHeader: {
    padding: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom:
      "1px solid #eef0f3",
  },

  muted: {
    color: C.muted,
    margin: "5px 0",
    lineHeight: 1.5,
  },

  info: {
    display: "flex",
    gap: 15,
    padding: 25,
    color: C.blue,
  },

  quick: {
    padding: 20,
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: 12,
  },

  quickBtn: {
    minHeight: 105,
    padding: 15,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    background: "#f9fafb",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 10,
    cursor: "pointer",
    color: C.text,
  },

  placeholder: {
    margin: 30,
    background: "#fff",
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: "70px 25px",
    textAlign: "center",
  },

  placeholderIcon: {
    width: 85,
    height: 85,
    margin: "0 auto 20px",
    borderRadius: "50%",
    background: C.blueLight,
    color: C.blue,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.45)",
    zIndex: 15,
  },

  authPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg,#eff6ff,#f5f7fb)",
    padding: 20,
  },

  authCard: {
    width: "100%",
    maxWidth: 430,
    background: "#fff",
    padding: 35,
    borderRadius: 20,
    boxShadow:
      "0 15px 50px rgba(0,0,0,.1)",
    textAlign: "center",
  },

  authTitle: {
    margin: "10px 0 8px",
    fontSize: 25,
  },

  authSubtitle: {
    margin: "0 0 25px",
    color: C.muted,
    lineHeight: 1.5,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  input: {
    width: "100%",
    padding: "13px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    fontSize: 14,
  },

  primary: {
    padding: 13,
    border: 0,
    borderRadius: 10,
    background: C.blue,
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },

  link: {
    border: 0,
    background: "transparent",
    color: C.blue,
    cursor: "pointer",
    padding: 8,
  },

  error: {
    background: C.redBg,
    color: C.red,
    padding: 11,
    borderRadius: 9,
    fontSize: 13,
  },

  success: {
    background: C.greenBg,
    color: C.green,
    padding: 11,
    borderRadius: 9,
    fontSize: 13,
  },

  security: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    color: C.muted,
    fontSize: 12,
    marginTop: 18,
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
    color: C.muted,
  },

  superPage: {
    minHeight: "100vh",
    background: C.bg,
    paddingBottom: 40,
  },

  superHeader: {
    height: 82,
    background: "#fff",
    borderBottom: `1px solid ${C.border}`,
    padding: "0 30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logo: {
    margin: 0,
    fontSize: 28,
  },

  subtitle: {
    color: C.muted,
    margin: "5px 0 0",
  },

  superRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  superRole: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "8px 11px",
    background: C.blueLight,
    color: C.blue,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
  },

  logoutSmall: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "10px 13px",
    border: 0,
    borderRadius: 9,
    background: C.dark,
    color: "#fff",
    cursor: "pointer",
  },

  superWelcome: {
    maxWidth: 1100,
    margin: "30px auto 20px",
    padding: 25,
    background: "#fff",
    borderRadius: 16,
    display: "flex",
    gap: 18,
    alignItems: "center",
    boxShadow:
      "0 8px 25px rgba(0,0,0,.05)",
  },

  superStats: {
    maxWidth: 1100,
    margin: "0 auto 25px",
    display: "grid",
    gridTemplateColumns:
      "repeat(3,1fr)",
    gap: 15,
  },

  superBox: {
    background: "#fff",
    padding: 22,
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    gap: 7,
    textAlign: "center",
  },

  refresh: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid #d1d5db",
    background: "#fff",
    padding: "9px 12px",
    borderRadius: 9,
    cursor: "pointer",
  },

  empty: {
    padding: 30,
    textAlign: "center",
    color: C.muted,
  },

  errorBox: {
    margin: 20,
    padding: 12,
    background: C.redBg,
    color: C.red,
    borderRadius: 9,
    display: "flex",
    gap: 8,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  active: {
    display: "inline-block",
    background: C.greenBg,
    color: C.green,
    padding: "5px 9px",
    borderRadius: 20,
    fontSize: 12,
  },
};

if (typeof document !== "undefined") {
  const styleElement =
    document.createElement("style");

  styleElement.textContent = `
    @keyframes haloSpin {
      to {
        transform: rotate(360deg);
      }
    }

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
    }

    button,
    input {
      font: inherit;
    }

    @media (max-width: 800px) {
      aside {
        transform: translateX(-100%);
      }

      main {
        margin-left: 0 !important;
        width: 100% !important;
      }

      .mobile-placeholder {
        display: block;
      }
    }
  `;

  document.head.appendChild(
    styleElement
  );
}
  const stats = [
    {
      title: "Chambres disponibles",
      value: "18",
      total: "/ 30",
      icon: BedDouble,
      info: "+3 aujourd'hui",
    },
    {
      title: "Chambres occupées",
      value: "12",
      total: "/ 30",
      icon: Building2,
      info: "40% du total",
    },
    {
      title: "Réservations",
      value: "24",
      total: "",
      icon: CalendarDays,
      info: "+8 cette semaine",
    },
    {
      title: "Revenus du mois",
      value: "$12,480",
      total: "",
      icon: Wallet,
      info: "+14.5%",
    },
  ];

  const reservations = [
    {
      client: "Jean Mukendi",
      room: "Chambre 204",
      date: "31 Août 2026",
      status: "Confirmée",
    },
    {
      client: "Sarah Kabeya",
      room: "Suite 301",
      date: "31 Août 2026",
      status: "En attente",
    },
    {
      client: "David Mbuyi",
      room: "Chambre 108",
      date: "01 Sept. 2026",
      status: "Confirmée",
    },
    {
      client: "Marie Ilunga",
      room: "Chambre 215",
      date: "02 Sept. 2026",
      status: "Confirmée",
    },
  ];

  const handleMenuClick = (page) => {
    setActivePage(page);
    setMenuOpen(false);
  };

  if (interfaceType === "superadmin") {
    return (
      <div style={styles.page}>
        <div style={styles.topHeader}>
          <div>
            <h1 style={styles.logo}>Hôtel Halo</h1>
            <p style={styles.subtitle}>Système de gestion de l'hôtel</p>
          </div>

          <button
            style={styles.switchButton}
            onClick={() => setInterfaceType("admin")}
          >
            🏨 Administrateur
          </button>
        </div>

        <div style={styles.superCard}>
          <div style={styles.superIcon}>👑</div>
          <h2>Interface Super-Admin</h2>
          <p>
            Gestion globale de la plateforme, des hôtels, des administrateurs
            et des paramètres du système.
          </p>

          <div style={styles.superGrid}>
            <div style={styles.superBox}>
              <strong>8</strong>
              <span>Hôtels</span>
            </div>
            <div style={styles.superBox}>
              <strong>32</strong>
              <span>Administrateurs</span>
            </div>
            <div style={styles.superBox}>
              <strong>156</strong>
              <span>Utilisateurs</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {menuOpen && (
        <div
          style={styles.overlay}
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        style={{
          ...styles.sidebar,
          transform:
            window.innerWidth <= 800
              ? menuOpen
                ? "translateX(0)"
                : "translateX(-100%)"
              : "translateX(0)",
        }}
      >
        <div style={styles.sidebarHeader}>
          <div>
            <div style={styles.hotelName}>🏨 Hôtel Halo</div>
            <div style={styles.hotelType}>Administration</div>
          </div>

          <button
            style={styles.closeButton}
            onClick={() => setMenuOpen(false)}
          >
            <X size={22} />
          </button>
        </div>

        <div style={styles.menuTitle}>MENU PRINCIPAL</div>

        <nav>
          {adminMenu.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                style={{
                  ...styles.menuItem,
                  ...(active ? styles.menuItemActive : {}),
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={styles.sidebarBottom}>
          <button
            style={styles.superAdminButton}
            onClick={() => setInterfaceType("superadmin")}
          >
            👑 Passer au Super-Admin
          </button>

          <button style={styles.logoutButton}>
            <LogOut size={19} />
            Déconnexion
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <button
            style={styles.menuButton}
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div>
            <h1 style={styles.pageTitle}>
              {activePage === "dashboard"
                ? "Tableau de bord"
                : adminMenu.find((x) => x.id === activePage)?.label}
            </h1>
            <p style={styles.pageSubtitle}>
              Bienvenue dans votre espace d'administration
            </p>
          </div>

          <div style={styles.headerRight}>
            <button style={styles.notificationButton}>
              <Bell size={21} />
              <span style={styles.notificationDot}>3</span>
            </button>

            <div style={styles.avatar}>AD</div>
          </div>
        </header>

        {activePage === "dashboard" ? (
          <>
            <section style={styles.welcomeCard}>
              <div>
                <p style={styles.welcomeSmall}>Aujourd'hui</p>
                <h2 style={styles.welcomeTitle}>
                  Bonjour, Administrateur 👋
                </h2>
                <p style={styles.welcomeText}>
                  Voici un aperçu de l'activité de votre hôtel.
                </p>
              </div>

              <div style={styles.dateBox}>
                <CalendarDays size={20} />
                31 Août 2026
              </div>
            </section>

            <section style={styles.statsGrid}>
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div style={styles.statCard} key={stat.title}>
                    <div style={styles.statTop}>
                      <div style={styles.statIcon}>
                        <Icon size={23} />
                      </div>

                      <TrendingUp size={18} />
                    </div>

                    <p style={styles.statTitle}>{stat.title}</p>

                    <div style={styles.statValue}>
                      {stat.value}
                      <span>{stat.total}</span>
                    </div>

                    <p style={styles.statInfo}>{stat.info}</p>
                  </div>
                );
              })}
            </section>

            <section style={styles.contentGrid}>
              <div style={styles.panel}>
                <div style={styles.panelHeader}>
                  <div>
                    <h2>Réservations récentes</h2>
                    <p>Les dernières réservations de l'hôtel</p>
                  </div>

                  <button
                    style={styles.viewButton}
                    onClick={() => setActivePage("reservations")}
                  >
                    Voir tout <ArrowUpRight size={16} />
                  </button>
                </div>

                <div style={styles.reservationList}>
                  {reservations.map((reservation, index) => (
                    <div
                      style={styles.reservation}
                      key={index}
                    >
                      <div style={styles.clientAvatar}>
                        {reservation.client
                          .split(" ")
                          .map((x) => x[0])
                          .join("")}
                      </div>

                      <div style={styles.reservationInfo}>
                        <strong>{reservation.client}</strong>
                        <span>{reservation.room}</span>
                      </div>

                      <div style={styles.reservationDate}>
                        <span>{reservation.date}</span>

                        <div
                          style={{
                            ...styles.status,
                            ...(reservation.status === "Confirmée"
                              ? styles.statusConfirmed
                              : styles.statusPending),
                          }}
                        >
                          {reservation.status === "Confirmée" ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            <Clock3 size={14} />
                          )}

                          {reservation.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.panel}>
                <div style={styles.panelHeader}>
                  <div>
                    <h2>Actions rapides</h2>
                    <p>Gérez rapidement votre hôtel</p>
                  </div>
                </div>

                <div style={styles.quickGrid}>
                  <button
                    style={styles.quickButton}
                    onClick={() => setActivePage("reservations")}
                  >
                    <CalendarDays size={24} />
                    <span>Nouvelle réservation</span>
                  </button>

                  <button
                    style={styles.quickButton}
                    onClick={() => setActivePage("clients")}
                  >
                    <UserPlus size={24} />
                    <span>Ajouter un client</span>
                  </button>

                  <button
                    style={styles.quickButton}
                    onClick={() => setActivePage("rooms")}
                  >
                    <BedDouble size={24} />
                    <span>Gérer les chambres</span>
                  </button>

                  <button
                    style={styles.quickButton}
                    onClick={() => setActivePage("payments")}
                  >
                    <Receipt size={24} />
                    <span>Enregistrer un paiement</span>
                  </button>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section style={styles.placeholder}>
            <div style={styles.placeholderIcon}>
              {(() => {
                const current = adminMenu.find(
                  (x) => x.id === activePage
                );
                const Icon = current?.icon || LayoutDashboard;
                return <Icon size={42} />;
              })()}
            </div>

            <h2>
              {adminMenu.find((x) => x.id === activePage)?.label}
            </h2>

            <p>
              Cette section est prête à être développée.
              Nous allons maintenant y ajouter les fonctionnalités
              réelles de votre hôtel.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#f5f7fb",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
    display: "flex",
  },

  sidebar: {
    width: "270px",
    background: "#111827",
    color: "white",
    minHeight: "100vh",
    padding: "22px 16px",
    boxSizing: "border-box",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 20,
    transition: "transform 0.25s ease",
  },

  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "5px 8px 28px",
  },

  hotelName: {
    fontSize: "21px",
    fontWeight: "700",
  },

  hotelType: {
    color: "#9ca3af",
    fontSize: "13px",
    marginTop: "5px",
  },

  closeButton: {
    display: "none",
    background: "transparent",
    border: "none",
    color: "white",
  },

  menuTitle: {
    fontSize: "11px",
    color: "#6b7280",
    fontWeight: "700",
    padding: "0 10px 10px",
    letterSpacing: "1px",
  },

  menuItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "13px 12px",
    marginBottom: "5px",
    background: "transparent",
    color: "#cbd5e1",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    textAlign: "left",
    cursor: "pointer",
  },

  menuItemActive: {
    background: "#2563eb",
    color: "white",
  },

  sidebarBottom: {
    position: "absolute",
    left: "16px",
    right: "16px",
    bottom: "25px",
  },

  superAdminButton: {
    width: "100%",
    padding: "11px",
    borderRadius: "9px",
    border: "1px solid #374151",
    background: "#1f2937",
    color: "#e5e7eb",
    cursor: "pointer",
    marginBottom: "10px",
  },

  logoutButton: {
    width: "100%",
    padding: "11px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    borderRadius: "9px",
    border: "none",
    background: "#111827",
    color: "#9ca3af",
    cursor: "pointer",
  },

  main: {
    marginLeft: "270px",
    width: "calc(100% - 270px)",
    minHeight: "100vh",
  },

  header: {
    height: "82px",
    background: "white",
    borderBottom: "1px solid #e5e7eb",
    padding: "0 30px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxSizing: "border-box",
  },

  menuButton: {
    display: "none",
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },

  pageTitle: {
    margin: 0,
    fontSize: "24px",
  },

  pageSubtitle: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  headerRight: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: "17px",
  },

  notificationButton: {
    position: "relative",
    background: "#f3f4f6",
    border: "none",
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    cursor: "pointer",
  },

  notificationDot: {
    position: "absolute",
    right: "-2px",
    top: "-2px",
    background: "#ef4444",
    color: "white",
    borderRadius: "50%",
    width: "19px",
    height: "19px",
    fontSize: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "13px",
  },

  welcomeCard: {
    margin: "28px 30px 22px",
    padding: "26px",
    borderRadius: "16px",
    background: "#2563eb",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxSizing: "border-box",
  },

  welcomeSmall: {
    margin: 0,
    opacity: 0.8,
    fontSize: "13px",
  },

  welcomeTitle: {
    margin: "7px 0",
    fontSize: "24px",
  },

  welcomeText: {
    margin: 0,
    opacity: 0.9,
  },

  dateBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.15)",
    padding: "12px 15px",
    borderRadius: "10px",
    fontSize: "13px",
  },

  statsGrid: {
    padding: "0 30px",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "18px",
  },

  statCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "15px",
    padding: "19px",
  },

  statTop: {
    display: "flex",
    justifyContent: "space-between",
    color: "#2563eb",
  },

  statIcon: {
    width: "43px",
    height: "43px",
    borderRadius: "10px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  statTitle: {
    color: "#6b7280",
    fontSize: "13px",
    margin: "15px 0 7px",
  },

  statValue: {
    fontSize: "26px",
    fontWeight: "700",
  },

  statValueSpan: {
    color: "#9ca3af",
  },

  statInfo: {
    color: "#16a34a",
    fontSize: "12px",
    marginBottom: 0,
  },

  contentGrid: {
    padding: "22px 30px 40px",
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr",
    gap: "20px",
  },

  panel: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "15px",
    overflow: "hidden",
  },

  panelHeader: {
    padding: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #eef0f3",
  },

  panelHeaderH2: {
    margin: 0,
  },

  viewButton: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    border: "none",
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: "600",
  },

  reservationList: {
    padding: "0 20px",
  },

  reservation: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "15px 0",
    borderBottom: "1px solid #f0f1f3",
  },

  clientAvatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "#dbeafe",
    color: "#1d4ed8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "700",
  },

  reservationInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
    fontSize: "13px",
  },

  reservationInfoSpan: {
    color: "#6b7280",
  },

  reservationDate: {
    textAlign: "right",
    fontSize: "11px",
    color: "#6b7280",
  },

  status: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginTop: "6px",
    padding: "4px 7px",
    borderRadius: "20px",
    fontSize: "10px",
  },

  statusConfirmed: {
    background: "#dcfce7",
    color: "#15803d",
  },

  statusPending: {
    background: "#fef3c7",
    color: "#b45309",
  },

  quickGrid: {
    padding: "20px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },

  quickButton: {
    minHeight: "105px",
    padding: "15px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    background: "#f9fafb",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: "10px",
    cursor: "pointer",
    color: "#172033",
    textAlign: "left",
  },

  placeholder: {
    margin: "30px",
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "70px 25px",
    textAlign: "center",
  },

  placeholderIcon: {
    width: "85px",
    height: "85px",
    margin: "0 auto 20px",
    borderRadius: "50%",
    background: "#eff6ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  placeholderH2: {
    fontSize: "24px",
  },

  placeholderP: {
    maxWidth: "500px",
    margin: "auto",
    color: "#6b7280",
    lineHeight: 1.6,
  },

  superCard: {
    maxWidth: "900px",
    margin: "50px auto",
    background: "white",
    padding: "35px",
    borderRadius: "18px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },

  superIcon: {
    fontSize: "55px",
  },

  superGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "15px",
    marginTop: "30px",
  },

  superBox: {
    background: "#f5f7fb",
    padding: "22px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  topHeader: {
    padding: "30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logo: {
    margin: 0,
    fontSize: "28px",
  },

  subtitle: {
    color: "#6b7280",
  },

  switchButton: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 15,
  },
};
