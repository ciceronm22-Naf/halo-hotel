import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Méthode non autorisée.",
    });
  }

  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Session manquante.",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Vérifier la session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({
        error: "Session invalide.",
      });
    }

    // Vérifier que l'utilisateur est Super-Admin
    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("id, role, status")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (adminError) {
      return res.status(500).json({
        error: "Impossible de vérifier les droits.",
      });
    }

    if (!admin || admin.status !== "active") {
      return res.status(403).json({
        error: "Compte administrateur introuvable ou désactivé.",
      });
    }

    if (admin.role !== "super_admin") {
      return res.status(403).json({
        error: "Accès réservé au Super-Admin.",
      });
    }

    // Récupérer les invitations encore en attente
    const {
      data: invitations,
      error: invitationsError,
    } = await supabase
      .from("admin_invitations")
      .select(
        "id, hotel_id, email, full_name, role, status, invited_at, expires_at, auth_user_id"
      )
      .eq("status", "pending")
      .order("id", { ascending: false });

    if (invitationsError) {
      return res.status(500).json({
        error: "Impossible de récupérer les invitations.",
      });
    }

    return res.status(200).json({
      success: true,
      invitations: invitations || [],
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erreur serveur.",
    });
  }
      }
