import React, { useState } from "react";

export default function App() {
  const [interfaceType, setInterfaceType] = useState("admin");

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f4f6f8",
      fontFamily: "Arial, sans-serif",
      padding: "30px"
    }}>
      <h1 style={{ color: "#17202a" }}>
        Hôtel Halo
      </h1>

      <p style={{ color: "#666" }}>
        Système de gestion de l'hôtel
      </p>

      <div style={{
        display: "flex",
        gap: "15px",
        marginTop: "30px",
        flexWrap: "wrap"
      }}>
        <button
          onClick={() => setInterfaceType("admin")}
          style={{
            padding: "15px 25px",
            borderRadius: "10px",
            border: "none",
            background: interfaceType === "admin" ? "#2563eb" : "#ddd",
            color: interfaceType === "admin" ? "white" : "#333",
            fontSize: "16px"
          }}
        >
          🏨 Administrateur
        </button>

        <button
          onClick={() => setInterfaceType("superadmin")}
          style={{
            padding: "15px 25px",
            borderRadius: "10px",
            border: "none",
            background: interfaceType === "superadmin" ? "#7c3aed" : "#ddd",
            color: interfaceType === "superadmin" ? "white" : "#333",
            fontSize: "16px"
          }}
        >
          👑 Super-Admin
        </button>
      </div>

      <div style={{
        marginTop: "30px",
        background: "white",
        padding: "25px",
        borderRadius: "15px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
      }}>
        {interfaceType === "admin" ? (
          <>
            <h2>🏨 Interface Administrateur</h2>
            <p>
              Gestion quotidienne de l'hôtel : chambres, réservations,
              clients et finances.
            </p>
          </>
        ) : (
          <>
            <h2>👑 Interface Super-Admin</h2>
            <p>
              Gestion globale : administrateurs, hôtels, statistiques
              et paramètres du système.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
