import React, { useState } from "react";
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
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Building2,
} from "lucide-react";

export default function App() {
  const [interfaceType, setInterfaceType] = useState("admin");
  const [activePage, setActivePage] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const adminMenu = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { id: "rooms", label: "Chambres", icon: BedDouble },
    { id: "reservations", label: "Réservations", icon: CalendarDays },
    { id: "clients", label: "Clients", icon: Users },
    { id: "finances", label: "Finances", icon: Wallet },
    { id: "payments", label: "Paiements", icon: Receipt },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "settings", label: "Paramètres", icon: Settings },
  ];

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
