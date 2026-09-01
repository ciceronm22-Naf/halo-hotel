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
  Search,
  CheckCircle2,
  Clock3,
  ArrowUpRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";

import { supabase } from "./supabase";

/* =========================================================
   DESIGN
========================================================= */

const C = {
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

/* =========================================================
   ROLES
========================================================= */

const ROLE_LABELS = {
  super_admin: "Super-Admin",
  admin: "Administrateur",
  manager: "Gérant",
  receptionist: "Réceptionniste",
};

const PERMISSIONS = {
  super_admin: [
    "dashboard",
    "etablissements",
    "facturation",
    "utilisateurs",
    "reglages",
  ],

  admin: [
    "dashboard",
    "planning",
    "mouvements",
    "chambres",
    "clients",
    "finance",
    "utilisateurs",
    "notifications",
    "reglages",
  ],

  manager: [
    "dashboard",
    "planning",
    "mouvements",
    "chambres",
    "clients",
    "finance",
    "utilisateurs",
    "notifications",
  ],

  receptionist: [
    "dashboard",
    "planning",
    "mouvements",
    "chambres",
    "clients",
    "notifications",
  ],
};

/* =========================================================
   MENU
========================================================= */

const MENU = [
  {
    key: "dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
  },
  {
    key: "planning",
    label: "Planning",
    icon: CalendarDays,
  },
  {
    key: "mouvements",
    label: "Mouvements",
    icon: TrendingUp,
  },
  {
    key: "chambres",
    label: "Chambres",
    icon: BedDouble,
  },
  {
    key: "clients",
    label: "Clients",
    icon: Users,
  },
  {
    key: "finance",
    label: "Finance",
    icon: Wallet,
  },
  {
    key: "utilisateurs",
    label: "Utilisateurs",
    icon: UserPlus,
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: Bell,
  },
  {
    key: "reglages",
    label: "Réglages",
    icon: Settings,
  },
];

/* =========================================================
   SUPER ADMIN MENU
========================================================= */

const SUPER_ADMIN_MENU = [
  {
    key: "dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
  },
  {
    key: "etablissements",
    label: "Établissements",
    icon: Building2,
  },
  {
    key: "facturation",
    label: "Facturation",
    icon: Receipt,
  },
  {
    key: "utilisateurs",
    label: "Administrateurs",
    icon: UserPlus,
  },
  {
    key: "reglages",
    label: "Réglages",
    icon: Settings,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function initials(name = "") {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "HH";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatMoney(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
}

function formatDate(dateString) {
  if (!dateString) return "—";

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  const [session, setSession] = useState(null);

  const [profile, setProfile] = useState(null);
  const [hotel, setHotel] = useState(null);

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const [activePage, setActivePage] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const [authMode, setAuthMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  /* =======================================================
     AUTH SESSION
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      setLoading(true);

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(currentSession);
      setLoading(false);

      if (currentSession) {
        await loadProfile(currentSession.user.id);
      }
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);

      if (!currentSession) {
        setProfile(null);
        setHotel(null);
        setActivePage("dashboard");
        return;
      }

      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        await loadProfile(currentSession.user.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* =======================================================
     PASSWORD RECOVERY DETECTION
  ======================================================= */

  useEffect(() => {
    const hash = window.location.hash || "";

    if (
      hash.includes("type=recovery") ||
      hash.includes("access_token=")
    ) {
      setAuthMode("reset");
    }
  }, []);

  /* =======================================================
     LOAD PROFILE
  ======================================================= */

  async function loadProfile(userId) {
    setProfileLoading(true);
    setAuthError("");

    try {
      const { data, error } = await supabase
        .from("admins")
        .select(
          `
            id,
            hotel_id,
            auth_user_id,
            full_name,
            email,
            role,
            status,
            invited_at,
            last_login_at
          `
        )
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (error) {
        console.error(error);
        setAuthError(
          "Impossible de charger votre profil administrateur."
        );
        return;
      }

      if (!data) {
        setAuthError(
          "Votre compte existe mais aucun profil administrateur n'est associé."
        );
        return;
      }

      if (data.status !== "active") {
        await supabase.auth.signOut();

        setAuthError(
          "Ce compte est désactivé. Contactez le Super-Admin."
        );

        return;
      }

      setProfile(data);

      /* ===================================================
         LOAD HOTEL
      =================================================== */

      if (data.hotel_id) {
        const { data: hotelData, error: hotelError } = await supabase
          .from("hotels")
          .select("*")
          .eq("id", data.hotel_id)
          .maybeSingle();

        if (!hotelError) {
          setHotel(hotelData);
        }
      } else {
        setHotel(null);
      }

      /* ===================================================
         LAST LOGIN
      =================================================== */

      await supabase
        .from("admins")
        .update({
          last_login_at: new Date().toISOString(),
        })
        .eq("id", data.id);
    } finally {
      setProfileLoading(false);
    }
  }

  /* =======================================================
     LOGIN
  ======================================================= */

  async function handleLogin(event) {
    event.preventDefault();

    setAuthError("");
    setAuthMessage("");

    if (!email.trim() || !password) {
      setAuthError("Veuillez renseigner votre email et votre mot de passe.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);

      setAuthError(
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : error.message
      );

      return;
    }

    setSession(data.session);

    if (data.session?.user?.id) {
      await loadProfile(data.session.user.id);
    }

    setLoading(false);
  }

  /* =======================================================
     FORGOT PASSWORD
  ======================================================= */

  async function handleForgotPassword(event) {
    event.preventDefault();

    setAuthError("");
    setAuthMessage("");

    if (!email.trim()) {
      setAuthError("Entrez votre adresse email.");
      return;
    }

    setLoading(true);

    const redirectTo = `${window.location.origin}/`;

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo,
      }
    );

    setLoading(false);

    if (error) {
      setAuthError(error.message);
      return;
    }

    setAuthMessage(
      "Un email de récupération a été envoyé si cette adresse correspond à un compte."
    );
  }

  /* =======================================================
     RESET PASSWORD
  ======================================================= */

  async function handleResetPassword(event) {
    event.preventDefault();

    setAuthError("");
    setAuthMessage("");

    if (!newPassword || !confirmPassword) {
      setAuthError("Veuillez remplir les deux champs.");
      return;
    }

    if (newPassword.length < 8) {
      setAuthError(
        "Le nouveau mot de passe doit contenir au moins 8 caractères."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setAuthError(
        "Les deux mots de passe ne correspondent pas."
      );
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      setAuthError(error.message);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");

    setAuthMessage(
      "Votre mot de passe a été réinitialisé avec succès."
    );

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    setAuthMode("login");
  }

  /* =======================================================
     LOGOUT
  ======================================================= */

  async function handleLogout() {
    await supabase.auth.signOut();

    setSession(null);
    setProfile(null);
    setHotel(null);
    setActivePage("dashboard");
    setAuthMode("login");
  }

  /* =======================================================
     ROLE
  ======================================================= */

  const role = profile?.role || null;

  const isSuperAdmin = role === "super_admin";

  const allowedPages = useMemo(() => {
    if (!role) return [];

    return PERMISSIONS[role] || [];
  }, [role]);

  const currentMenu = isSuperAdmin
    ? SUPER_ADMIN_MENU
    : MENU.filter((item) => allowedPages.includes(item.key));

  /* =======================================================
     PROTECTION PAGE
  ======================================================= */

  useEffect(() => {
    if (!profile) return;

    const allowed = isSuperAdmin
      ? SUPER_ADMIN_MENU.map((item) => item.key)
      : allowedPages;

    if (!allowed.includes(activePage)) {
      setActivePage("dashboard");
    }
  }, [profile, activePage, allowedPages, isSuperAdmin]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading && !profile && !session) {
    return <SplashScreen />;
  }

  /* =======================================================
     RESET PASSWORD
  ======================================================= */

  if (authMode === "reset") {
    return (
      <AuthLayout
        title="Nouveau mot de passe"
        subtitle="Choisissez un nouveau mot de passe sécurisé."
      >
        <form onSubmit={handleResetPassword}>
          <Field
            label="Nouveau mot de passe"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Au moins 8 caractères"
            icon={Lock}
            rightIcon={
              showNewPassword ? EyeOff : Eye
            }
            onRightIconClick={() =>
              setShowNewPassword((value) => !value)
            }
          />

          <Field
            label="Confirmer le mot de passe"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Répétez le mot de passe"
            icon={Lock}
          />

          {authError && (
            <AlertBox type="error">
              {authError}
            </AlertBox>
          )}

          {authMessage && (
            <AlertBox type="success">
              {authMessage}
            </AlertBox>
          )}

          <PrimaryButton disabled={loading}>
            {loading
              ? "Enregistrement..."
              : "Enregistrer le nouveau mot de passe"}
          </PrimaryButton>
        </form>
      </AuthLayout>
    );
  }

  /* =======================================================
     LOGIN
  ======================================================= */

  if (!session || !profile) {
    if (authMode === "forgot") {
      return (
        <AuthLayout
          title="Mot de passe oublié"
          subtitle="Entrez votre email pour recevoir un lien de récupération."
        >
          <form onSubmit={handleForgotPassword}>
            <Field
              label="Adresse email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="vous@exemple.com"
              icon={Mail}
            />

            {authError && (
              <AlertBox type="error">
                {authError}
              </AlertBox>
            )}

            {authMessage && (
              <AlertBox type="success">
                {authMessage}
              </AlertBox>
            )}

            <PrimaryButton disabled={loading}>
              {loading
                ? "Envoi..."
                : "Envoyer le lien de récupération"}
            </PrimaryButton>

            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
                setAuthMessage("");
              }}
              style={styles.linkButton}
            >
              ← Retour à la connexion
            </button>
          </form>
        </AuthLayout>
      );
    }

    return (
      <AuthLayout
        title="Bienvenue sur Hôtel Halo"
        subtitle="Connectez-vous à votre espace de gestion."
      >
        <form onSubmit={handleLogin}>
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
            rightIcon={
              showPassword ? EyeOff : Eye
            }
            onRightIconClick={() =>
              setShowPassword((value) => !value)
            }
          />

          {authError && (
            <AlertBox type="error">
              {authError}
            </AlertBox>
          )}

          {authMessage && (
            <AlertBox type="success">
              {authMessage}
            </AlertBox>
          )}

          <PrimaryButton disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </PrimaryButton>

          <button
            type="button"
            onClick={() => {
              setAuthMode("forgot");
              setAuthError("");
              setAuthMessage("");
            }}
            style={styles.linkButton}
          >
            Mot de passe oublié ?
          </button>
        </form>
      </AuthLayout>
    );
  }

  /* =======================================================
     MAIN APPLICATION
  ======================================================= */

  return (
    <div style={styles.app}>
      {menuOpen && (
        <div
          style={styles.mobileOverlay}
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        style={{
          ...styles.sidebar,
          ...(menuOpen ? styles.sidebarMobileOpen : {}),
        }}
      >
        <div style={styles.logoArea}>
          <div style={styles.logoMark}>H</div>

          <div>
            <div style={styles.logoTitle}>Hôtel Halo</div>
            <div style={styles.logoSubtitle}>
              {isSuperAdmin
                ? "Administration plateforme"
                : "Gestion hôtelière"}
            </div>
          </div>

          <button
            style={styles.closeMobile}
            onClick={() => setMenuOpen(false)}
          >
            <X size={21} />
          </button>
        </div>

        <div style={styles.sidebarSection}>
          <div style={styles.sidebarLabel}>
            MENU PRINCIPAL
          </div>

          {currentMenu.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.key;

            return (
              <button
                key={item.key}
                onClick={() => {
                  setActivePage(item.key);
                  setMenuOpen(false);
                }}
                style={{
                  ...styles.menuButton,
                  ...(active
                    ? styles.menuButtonActive
                    : {}),
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div style={styles.sidebarBottom}>
          <div style={styles.profileCard}>
            <div style={styles.avatar}>
              {initials(profile.full_name)}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={styles.profileName}>
                {profile.full_name}
              </div>

              <div style={styles.profileRole}>
                {ROLE_LABELS[profile.role] || profile.role}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={styles.logoutButton}
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button
              style={styles.mobileMenuButton}
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} />
            </button>

            <div>
              <div style={styles.headerTitle}>
                {getPageTitle(activePage, isSuperAdmin)}
              </div>

              <div style={styles.headerSubtitle}>
                {isSuperAdmin
                  ? "Vue globale de la plateforme"
                  : hotel?.name || "Votre établissement"}
              </div>
            </div>
          </div>

          <div style={styles.headerRight}>
            <button style={styles.iconButton}>
              <Bell size={20} />
            </button>

            <div style={styles.headerAvatar}>
              {initials(profile.full_name)}
            </div>
          </div>
        </header>

        <div style={styles.content}>
          {profileLoading ? (
            <LoadingBlock />
          ) : isSuperAdmin ? (
            <SuperAdminPage
              page={activePage}
            />
          ) : (
            <HotelPage
              page={activePage}
              profile={profile}
              hotel={hotel}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   SUPER ADMIN
========================================================= */

function SuperAdminPage({ page }) {
  if (page === "dashboard") {
    return <SuperAdminDashboard />;
  }

  if (page === "etablissements") {
    return <SuperAdminEstablishments />;
  }

  if (page === "facturation") {
    return <SuperAdminBilling />;
  }

  if (page === "utilisateurs") {
    return <SuperAdminAdministrators />;
  }

  if (page === "reglages") {
    return <SettingsPage />;
  }

  return <SuperAdminDashboard />;
}

/* =========================================================
   SUPER ADMIN DASHBOARD
========================================================= */

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

    if (!error) {
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
    <div>
      <PageIntro
        eyebrow="SUPER-ADMIN"
        title="Vue d'ensemble"
        text="Pilotez les établissements et l'activité de la plateforme Hôtel Halo."
      />

      <div style={styles.kpiGrid}>
        <KpiCard
          title="Hôtels actifs"
          value={activeHotels}
          icon={Building2}
          tone="teal"
        />

        <KpiCard
          title="Total établissements"
          value={hotels.length}
          icon={Building2}
          tone="sage"
        />

        <KpiCard
          title="Administrateurs"
          value="—"
          icon={Users}
          tone="amber"
        />

        <KpiCard
          title="État plateforme"
          value="Opérationnelle"
          icon={CheckCircle2}
          tone="teal"
        />
      </div>

      <SectionCard
        title="Établissements récents"
        action={
          <button
            onClick={loadHotels}
            style={styles.smallButton}
          >
            <RefreshCw size={16} />
            Actualiser
          </button>
        }
      >
        {loading ? (
          <LoadingBlock />
        ) : hotels.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Aucun établissement"
            text="Les établissements créés par le Super-Admin apparaîtront ici."
          />
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
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
                      <strong>{hotel.name}</strong>
                    </td>

                    <td>{hotel.email || "—"}</td>

                    <td>{hotel.phone || "—"}</td>

                    <td>
                      <StatusBadge
                        status={
                          hotel.status === "active"
                            ? "Actif"
                            : "Inactif"
                        }
                        type={
                          hotel.status === "active"
                            ? "success"
                            : "danger"
                        }
                      />
                    </td>

                    <td>
                      {formatDate(hotel.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/* =========================================================
   SUPER ADMIN ESTABLISHMENTS
========================================================= */

function SuperAdminEstablishments() {
  const [hotels, setHotels] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadHotels() {
    setLoading(true);

    const { data, error } = await supabase
      .from("hotels")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (!error) {
      setHotels(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadHotels();
  }, []);

  const filtered = hotels.filter((hotel) => {
    const text = `
      ${hotel.name || ""}
      ${hotel.email || ""}
      ${hotel.phone || ""}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div>
      <PageIntro
        eyebrow="PLATEFORME"
        title="Établissements"
        text="Gérez les hôtels enregistrés sur Hôtel Halo."
      />

      <SectionCard
        title={`${filtered.length} établissement(s)`}
        action={
          <button
            onClick={loadHotels}
            style={styles.smallButton}
          >
            <RefreshCw size={16} />
            Actualiser
          </button>
        }
      >
        <div style={styles.searchBox}>
          <Search size={18} />
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Rechercher un établissement..."
            style={styles.searchInput}
          />
        </div>

        {loading ? (
          <LoadingBlock />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Aucun résultat"
            text="Aucun établissement ne correspond à votre recherche."
          />
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Établissement</th>
                  <th>Contact</th>
                  <th>Adresse</th>
                  <th>Statut</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((hotel) => (
                  <tr key={hotel.id}>
                    <td>
                      <strong>{hotel.name}</strong>
                    </td>

                    <td>
                      <div>{hotel.email || "—"}</div>
                      <div style={styles.mutedText}>
                        {hotel.phone || ""}
                      </div>
                    </td>

                    <td>{hotel.address || "—"}</td>

                    <td>
                      <StatusBadge
                        status={
                          hotel.status === "active"
                            ? "Actif"
                            : "Inactif"
                        }
                        type={
                          hotel.status === "active"
                            ? "success"
                            : "danger"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/* =========================================================
   BILLING
========================================================= */

function SuperAdminBilling() {
  return (
    <div>
      <PageIntro
        eyebrow="SAAS"
        title="Facturation"
        text="Suivez les abonnements et la facturation des établissements."
      />

      <div style={styles.kpiGrid}>
        <KpiCard
          title="MRR"
          value="—"
          icon={Wallet}
          tone="teal"
        />

        <KpiCard
          title="Factures payées"
          value="—"
          icon={CheckCircle2}
          tone="sage"
        />

        <KpiCard
          title="En attente"
          value="—"
          icon={Clock3}
          tone="amber"
        />

        <KpiCard
          title="En retard"
          value="—"
          icon={AlertCircle}
          tone="red"
        />
      </div>

      <SectionCard
        title="Facturation SaaS"
      >
        <EmptyState
          icon={Receipt}
          title="Module de facturation"
          text="La gestion détaillée des abonnements sera connectée à la base de données dans l'étape suivante."
        />
      </SectionCard>
    </div>
  );
}

/* =========================================================
   ADMINISTRATORS
========================================================= */

function SuperAdminAdministrators() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadAdmins() {
    setLoading(true);

    const { data, error } = await supabase
      .from("admins")
      .select(
        `
          id,
          hotel_id,
          full_name,
          email,
          role,
          status,
          created_at,
          hotels (
            name
          )
        `
      )
      .order("created_at", {
        ascending: false,
      });

    if (!error) {
      setAdmins(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  return (
    <div>
      <PageIntro
        eyebrow="ADMINISTRATION"
        title="Administrateurs"
        text="Consultez les comptes administrateurs associés aux établissements."
      />

      <SectionCard
        title={`${admins.length} compte(s)`}
        action={
          <button
            onClick={loadAdmins}
            style={styles.smallButton}
          >
            <RefreshCw size={16} />
            Actualiser
          </button>
        }
      >
        {loading ? (
          <LoadingBlock />
        ) : admins.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun administrateur"
            text="Les administrateurs apparaîtront ici."
          />
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Établissement</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                </tr>
              </thead>

              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td>
                      <strong>{admin.full_name}</strong>
                    </td>

                    <td>{admin.email}</td>

                    <td>
                      {admin.hotels?.name || "Plateforme"}
                    </td>

                    <td>
                      {ROLE_LABELS[admin.role] ||
                        admin.role}
                    </td>

                    <td>
                      <StatusBadge
                        status={
                          admin.status === "active"
                            ? "Actif"
                            : "Inactif"
                        }
                        type={
                          admin.status === "active"
                            ? "success"
                            : "danger"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/* =========================================================
   HOTEL PAGE
========================================================= */

function HotelPage({ page, profile, hotel }) {
  switch (page) {
    case "dashboard":
      return (
        <HotelDashboard
          profile={profile}
          hotel={hotel}
        />
      );

    case "planning":
      return <PlaceholderModule
        icon={CalendarDays}
        title="Planning"
        text="Le planning des réservations sera connecté à la base de données."
      />;

    case "mouvements":
      return <PlaceholderModule
        icon={TrendingUp}
        title="Mouvements"
        text="Les arrivées, départs et séjours en cours seront affichés ici."
      />;

    case "chambres":
      return <PlaceholderModule
        icon={BedDouble}
        title="Chambres"
        text="La gestion des chambres sera connectée à la base de données."
      />;

    case "clients":
      return <PlaceholderModule
        icon={Users}
        title="Clients"
        text="La gestion des clients sera connectée à la base de données."
      />;

    case "finance":
      return <PlaceholderModule
        icon={Wallet}
        title="Finance"
        text="Les recettes, paiements et dépenses seront gérés ici."
      />;

    case "utilisateurs":
      return <HotelUsers />;
      
    case "notifications":
      return <PlaceholderModule
        icon={Bell}
        title="Notifications"
        text="Vos notifications et alertes apparaîtront ici."
      />;

    case "reglages":
      return <SettingsPage />;

    default:
      return (
        <HotelDashboard
          profile={profile}
          hotel={hotel}
        />
      );
  }
}

/* =========================================================
   HOTEL DASHBOARD
========================================================= */

function HotelDashboard({ profile, hotel }) {
  return (
    <div>
      <PageIntro
        eyebrow="HÔTEL"
        title={`Bonjour ${profile.full_name.split(" ")[0] || ""}`}
        text={
          hotel?.name
            ? `Bienvenue dans l'espace de gestion de ${hotel.name}.`
            : "Bienvenue dans votre espace de gestion."
        }
      />

      <div style={styles.kpiGrid}>
        <KpiCard
          title="Chambres disponibles"
          value="—"
          icon={BedDouble}
          tone="teal"
        />

        <KpiCard
          title="Arrivées aujourd'hui"
          value="—"
          icon={CalendarDays}
          tone="sage"
        />

        <KpiCard
          title="Départs aujourd'hui"
          value="—"
          icon={TrendingUp}
          tone="amber"
        />

        <KpiCard
          title="Recettes"
          value="—"
          icon={Wallet}
          tone="clay"
        />
      </div>

      <div style={styles.twoColumn}>
        <SectionCard
          title="Activité récente"
        >
          <EmptyState
            icon={TrendingUp}
            title="Aucune activité"
            text="Les mouvements de l'hôtel apparaîtront ici."
          />
        </SectionCard>

        <SectionCard
          title="État de l'hôtel"
        >
          <div style={styles.statusPanel}>
            <div style={styles.statusIcon}>
              <CheckCircle2 size={24} />
            </div>

            <div>
              <div style={styles.statusTitle}>
                Système opérationnel
              </div>

              <div style={styles.statusText}>
                Votre espace Hôtel Halo est correctement connecté.
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

/* =========================================================
   HOTEL USERS
========================================================= */

function HotelUsers() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    setLoading(true);

    const { data, error } = await supabase
      .from("admins")
      .select(
        "id, full_name, email, role, status, created_at"
      )
      .order("created_at", {
        ascending: false,
      });

    if (!error) {
      setAdmins(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div>
      <PageIntro
        eyebrow="ÉQUIPE"
        title="Utilisateurs"
        text="Gérez les personnes autorisées à travailler dans cet établissement."
      />

      <SectionCard
        title="Membres de l'équipe"
        action={
          <button
            onClick={loadUsers}
            style={styles.smallButton}
          >
            <RefreshCw size={16} />
            Actualiser
          </button>
        }
      >
        {loading ? (
          <LoadingBlock />
        ) : admins.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun utilisateur"
            text="Les membres de votre équipe apparaîtront ici."
          />
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                </tr>
              </thead>

              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td>
                      <strong>{admin.full_name}</strong>
                    </td>

                    <td>{admin.email}</td>

                    <td>
                      {ROLE_LABELS[admin.role] ||
                        admin.role}
                    </td>

                    <td>
                      <StatusBadge
                        status={
                          admin.status === "active"
                            ? "Actif"
                            : "Inactif"
                        }
                        type={
                          admin.status === "active"
                            ? "success"
                            : "danger"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

function SettingsPage() {
  return (
    <div>
      <PageIntro
        eyebrow="CONFIGURATION"
        title="Réglages"
        text="Paramètres et configuration de votre espace Hôtel Halo."
      />

      <SectionCard title="Sécurité">
        <div style={styles.settingRow}>
          <div style={styles.settingIcon}>
            <Shield size={20} />
          </div>

          <div>
            <div style={styles.settingTitle}>
              Sécurité des accès
            </div>

            <div style={styles.settingText}>
              Les rôles et les permissions sont contrôlés côté base de données.
            </div>
          </div>

          <StatusBadge
            status="Activé"
            type="success"
          />
        </div>
      </SectionCard>

      <SectionCard title="Compte">
        <div style={styles.settingRow}>
          <div style={styles.settingIcon}>
            <Lock size={20} />
          </div>

          <div>
            <div style={styles.settingTitle}>
              Mot de passe
            </div>

            <div style={styles.settingText}>
              La récupération du mot de passe est disponible depuis l'écran de connexion.
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function SplashScreen() {
  return (
    <div style={styles.splash}>
      <div style={styles.logoMarkLarge}>H</div>

      <div style={styles.splashTitle}>
        Hôtel Halo
      </div>

      <div style={styles.spinner} />
    </div>
  );
}

function AuthLayout({ title, subtitle, children }) {
  return (
    <div style={styles.authPage}>
      <div style={styles.authDecorOne} />
      <div style={styles.authDecorTwo} />

      <div style={styles.authCard}>
        <div style={styles.authLogo}>
          <div style={styles.logoMark}>H</div>

          <div>
            <div style={styles.logoTitle}>
              Hôtel Halo
            </div>

            <div style={styles.logoSubtitle}>
              Gestion hôtelière
            </div>
          </div>
        </div>

        <div style={styles.authHeading}>
          {title}
        </div>

        <div style={styles.authSubtitle}>
          {subtitle}
        </div>

        <div style={{ marginTop: 28 }}>
          {children}
        </div>
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
  rightIcon: RightIcon,
  onRightIconClick,
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label}
      </label>

      <div style={styles.inputWrap}>
        <Icon
          size={18}
          style={styles.inputIcon}
        />

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          style={styles.input}
          autoComplete={
            type === "password"
              ? "current-password"
              : "email"
          }
        />

        {RightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            style={styles.inputAction}
          >
            <RightIcon size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

function PrimaryButton({
  children,
  disabled = false,
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{
        ...styles.primaryButton,
        ...(disabled
          ? styles.buttonDisabled
          : {}),
      }}
    >
      {children}
    </button>
  );
}

function AlertBox({ type, children }) {
  const success = type === "success";

  return (
    <div
      style={{
        ...styles.alert,
        ...(success
          ? styles.alertSuccess
          : styles.alertError),
      }}
    >
      {success ? (
        <CheckCircle2 size={18} />
      ) : (
        <AlertCircle size={18} />
      )}

      <span>{children}</span>
    </div>
  );
}

function PageIntro({
  eyebrow,
  title,
  text,
}) {
  return (
    <div style={styles.pageIntro}>
      <div style={styles.eyebrow}>
        {eyebrow}
      </div>

      <h1 style={styles.pageTitle}>
        {title}
      </h1>

      <p style={styles.pageText}>
        {text}
      </p>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  tone = "teal",
}) {
  const toneMap = {
    teal: {
      background: C.tealLight,
      color: C.teal,
    },

    sage: {
      background: C.sageLight,
      color: C.sage,
    },

    amber: {
      background: C.amberLight,
      color: C.amber,
    },

    clay: {
      background: C.clayLight,
      color: C.clay,
    },

    red: {
      background: C.redLight,
      color: C.red,
    },
  };

  const colors =
    toneMap[tone] || toneMap.teal;

  return (
    <div style={styles.kpiCard}>
      <div
        style={{
          ...styles.kpiIcon,
          background: colors.background,
          color: colors.color,
        }}
      >
        <Icon size={21} />
      </div>

      <div style={styles.kpiTitle}>
        {title}
      </div>

      <div style={styles.kpiValue}>
        {value}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  action,
  children,
}) {
  return (
    <section style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>
          {title}
        </h2>

        {action}
      </div>

      <div>
        {children}
      </div>
    </section>
  );
}

function StatusBadge({
  status,
  type = "success",
}) {
  const map = {
    success: {
      background: C.sageLight,
      color: C.tealDeep,
    },

    danger: {
      background: C.redLight,
      color: C.red,
    },

    warning: {
      background: C.amberLight,
      color: "#8A681B",
    },
  };

  const colors =
    map[type] || map.success;

  return (
    <span
      style={{
        ...styles.statusBadge,
        background: colors.background,
        color: colors.color,
      }}
    >
      {status}
    </span>
  );
}

function LoadingBlock() {
  return (
    <div style={styles.loadingBlock}>
      <RefreshCw
        size={20}
        style={{
          animation: "haloSpin 1s linear infinite",
        }}
      />

      <span>
        Chargement...
      </span>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>
        <Icon size={25} />
      </div>

      <div style={styles.emptyTitle}>
        {title}
      </div>

      <div style={styles.emptyText}>
        {text}
      </div>
    </div>
  );
}

function PlaceholderModule({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div>
      <PageIntro
        eyebrow="MODULE"
        title={title}
        text={text}
      />

      <SectionCard title={title}>
        <EmptyState
          icon={Icon}
          title="Module en préparation"
          text="La structure de cette fonctionnalité est prête. Nous allons maintenant la connecter aux données réelles."
        />
      </SectionCard>
    </div>
  );
}

/* =========================================================
   PAGE TITLE
========================================================= */

function getPageTitle(page, isSuperAdmin) {
  if (isSuperAdmin) {
    const item = SUPER_ADMIN_MENU.find(
      (menuItem) => menuItem.key === page
    );

    return item?.label || "Tableau de bord";
  }

  const item = MENU.find(
    (menuItem) => menuItem.key === page
  );

  return item?.label || "Tableau de bord";
}

/* =========================================================
   STYLES
========================================================= */

const styles = {
  app: {
    minHeight: "100vh",
    background: C.paper,
    color: C.ink,
    display: "flex",
  },

  splash: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: C.paper,
    color: C.ink,
  },

  splashTitle: {
    fontSize: 28,
    fontWeight: 800,
    marginTop: 16,
  },

  logoMarkLarge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    background: C.teal,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 32,
    fontWeight: 900,
    boxShadow: "0 12px 30px rgba(47,111,98,.20)",
  },

  spinner: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: `3px solid ${C.line}`,
    borderTopColor: C.teal,
    marginTop: 24,
    animation: "haloSpin 1s linear infinite",
  },

  authPage: {
    minHeight: "100vh",
    background: C.paper,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    position: "relative",
    overflow: "hidden",
  },

  authDecorOne: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: "50%",
    background: C.tealLight,
    top: -220,
    left: -180,
    opacity: 0.65,
  },

  authDecorTwo: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: "50%",
    background: C.clayLight,
    bottom: -180,
    right: -140,
    opacity: 0.55,
  },

  authCard: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: 440,
    background: C.card,
    border: `1px solid ${C.line}`,
    borderRadius: 24,
    padding: 32,
    boxShadow: "0 20px 60px rgba(27,36,48,.10)",
  },

  authLogo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 30,
  },

  authHeading: {
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1.15,
    letterSpacing: "-.5px",
  },

  authSubtitle: {
    color: C.stone,
    marginTop: 9,
    lineHeight: 1.5,
  },

  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: "22px 18px",
    borderBottom: `1px solid ${C.line}`,
  },

  logoMark: {
    width: 42,
    height: 42,
    borderRadius: 13,
    background: C.teal,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    fontWeight: 900,
    flexShrink: 0,
  },

  logoTitle: {
    fontWeight: 800,
    fontSize: 17,
    color: C.ink,
  },

  logoSubtitle: {
    color: C.stone,
    fontSize: 12,
    marginTop: 2,
  },

  sidebar: {
    width: 260,
    minHeight: "100vh",
    background: C.card,
    borderRight: `1px solid ${C.line}`,
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 30,
    display: "flex",
    flexDirection: "column",
  },

  sidebarMobileOpen: {
    transform: "translateX(0)",
  },

  closeMobile: {
    display: "none",
    marginLeft: "auto",
    border: 0,
    background: "transparent",
    cursor: "pointer",
    color: C.stone,
  },

  sidebarSection: {
    padding: "24px 12px",
    flex: 1,
    overflowY: "auto",
  },

  sidebarLabel: {
    fontSize: 10,
    letterSpacing: "1.2px",
    color: C.stone,
    fontWeight: 800,
    padding: "0 10px 10px",
  },

  menuButton: {
    width: "100%",
    border: 0,
    background: "transparent",
    color: C.inkSoft,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "11px 12px",
    borderRadius: 11,
    cursor: "pointer",
    textAlign: "left",
    marginBottom: 4,
    fontSize: 14,
    fontWeight: 600,
  },

  menuButtonActive: {
    background: C.tealLight,
    color: C.tealDeep,
    fontWeight: 800,
  },

  sidebarBottom: {
    padding: 14,
    borderTop: `1px solid ${C.line}`,
  },

  profileCard: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 12,
    background: C.paper,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 11,
    background: C.teal,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 12,
    flexShrink: 0,
  },

  profileName: {
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 160,
  },

  profileRole: {
    fontSize: 11,
    color: C.stone,
    marginTop: 2,
  },

  logoutButton: {
    width: "100%",
    border: 0,
    background: "transparent",
    color: C.red,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 10px 5px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
  },

  main: {
    marginLeft: 260,
    width: "calc(100% - 260px)",
    minHeight: "100vh",
  },

  header: {
    height: 76,
    background: C.card,
    borderBottom: `1px solid ${C.line}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 28px",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 15,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 800,
  },

  headerSubtitle: {
    fontSize: 12,
    color: C.stone,
    marginTop: 3,
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    border: `1px solid ${C.line}`,
    background: C.card,
    color: C.inkSoft,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: C.tealLight,
    color: C.tealDeep,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 12,
  },

  mobileMenuButton: {
    display: "none",
    border: 0,
    background: "transparent",
    cursor: "pointer",
    color: C.ink,
    padding: 4,
  },

  content: {
    padding: 28,
    maxWidth: 1500,
    margin: "0 auto",
  },

  pageIntro: {
    marginBottom: 26,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: "1.3px",
    color: C.teal,
    marginBottom: 7,
  },

  pageTitle: {
    margin: 0,
    fontSize: 30,
    lineHeight: 1.15,
    letterSpacing: "-.7px",
  },

  pageText: {
    margin: "8px 0 0",
    color: C.stone,
    maxWidth: 700,
    lineHeight: 1.5,
    fontSize: 14,
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: 16,
    marginBottom: 22,
  },

  kpiCard: {
    background: C.card,
    border: `1px solid ${C.line}`,
    borderRadius: 17,
    padding: 18,
    minHeight: 150,
  },

  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  kpiTitle: {
    color: C.stone,
    fontSize: 12,
    fontWeight: 700,
  },

  kpiValue: {
    fontSize: 24,
    fontWeight: 900,
    marginTop: 5,
    color: C.ink,
  },

  sectionCard: {
    background: C.card,
    border: `1px solid ${C.line}`,
    borderRadius: 17,
    padding: 20,
    marginBottom: 20,
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },

  sectionTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
  },

  smallButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    border: `1px solid ${C.line}`,
    background: C.card,
    color: C.inkSoft,
    padding: "8px 11px",
    borderRadius: 9,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  },

  tableWrap: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },

  twoColumn: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1.4fr) minmax(0, 1fr)",
    gap: 20,
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    border: `1px solid ${C.line}`,
    borderRadius: 11,
    padding: "0 12px",
    height: 42,
    marginBottom: 18,
    color: C.stone,
  },

  searchInput: {
    border: 0,
    outline: 0,
    width: "100%",
    background: "transparent",
    color: C.ink,
  },

  mutedText: {
    color: C.stone,
    fontSize: 11,
    marginTop: 3,
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
  },

  loadingBlock: {
    minHeight: 120,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    color: C.stone,
    fontSize: 13,
  },

  emptyState: {
    minHeight: 190,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 25,
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    background: C.tealLight,
    color: C.teal,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  emptyTitle: {
    fontWeight: 800,
    fontSize: 14,
  },

  emptyText: {
    color: C.stone,
    fontSize: 12,
    maxWidth: 450,
    lineHeight: 1.5,
    marginTop: 5,
  },

  statusPanel: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 13,
    background: C.sageLight,
  },

  statusIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    background: C.card,
    color: C.teal,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  statusTitle: {
    fontWeight: 800,
    fontSize: 14,
  },

  statusText: {
    color: C.stone,
    fontSize: 12,
    lineHeight: 1.45,
    marginTop: 3,
  },

  settingRow: {
    display: "flex",
    alignItems: "center",
    gap: 13,
    padding: 14,
    border: `1px solid ${C.line}`,
    borderRadius: 13,
  },

  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: C.tealLight,
    color: C.teal,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  settingTitle: {
    fontWeight: 800,
    fontSize: 14,
  },

  settingText: {
    color: C.stone,
    fontSize: 12,
    lineHeight: 1.45,
    marginTop: 3,
  },

  field: {
    marginBottom: 17,
  },

  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 800,
    color: C.inkSoft,
    marginBottom: 7,
  },

  inputWrap: {
    height: 46,
    border: `1px solid ${C.line}`,
    borderRadius: 11,
    display: "flex",
    alignItems: "center",
    background: C.card,
    transition: "border-color .2s",
  },

  inputIcon: {
    marginLeft: 13,
    color: C.stone,
    flexShrink: 0,
  },

  input: {
    border: 0,
    outline: 0,
    height: "100%",
    width: "100%",
    padding: "0 11px",
    background: "transparent",
    color: C.ink,
    minWidth: 0,
  },

  inputAction: {
    border: 0,
    background: "transparent",
    color: C.stone,
    cursor: "pointer",
    padding: 10,
    marginRight: 2,
  },

  primaryButton: {
    width: "100%",
    height: 47,
    border: 0,
    borderRadius: 11,
    background: C.teal,
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 14,
    boxShadow: "0 8px 20px rgba(47,111,98,.18)",
  },

  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  linkButton: {
    display: "block",
    width: "100%",
    marginTop: 16,
    border: 0,
    background: "transparent",
    color: C.teal,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
    textAlign: "center",
  },

  alert: {
    display: "flex",
    alignItems: "flex-start",
    gap: 9,
    borderRadius: 10,
    padding: 11,
    fontSize: 12,
    lineHeight: 1.45,
    marginBottom: 16,
  },

  alertError: {
    background: C.redLight,
    color: C.red,
  },

  alertSuccess: {
    background: C.sageLight,
    color: C.tealDeep,
  },

  mobileOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.35)",
    zIndex: 25,
  },
};

/* =========================================================
   GLOBAL STYLE
========================================================= */

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

    table th {
      text-align: left;
      color: #8A8578;
      font-size: 11px;
      font-weight: 800;
      padding: 12px;
      border-bottom: 1px solid #E6E2D8;
      white-space: nowrap;
    }

    table td {
      padding: 14px 12px;
      border-bottom: 1px solid #E6E2D8;
      vertical-align: middle;
    }

    table tr:last-child td {
      border-bottom: 0;
    }

    @media (max-width: 1000px) {
      .halo-kpi-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 800px) {
      aside {
        transform: translateX(-100%);
        transition: transform .25s ease;
      }

      main {
        margin-left: 0 !important;
        width: 100% !important;
      }

      .mobile-placeholder {
        display: block;
      }
    }

    @media (max-width: 700px) {
      .halo-content {
        padding: 18px;
      }
    }
  `;

  document.head.appendChild(styleElement);
    }
