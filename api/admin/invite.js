import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
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

    // Vérifier le Super-Admin connecté
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({
        error: "Session invalide.",
      });
    }

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

    // Récupérer les données de l'invitation
    const { hotel_id, full_name, email, role } = req.body || {};

    if (!hotel_id || !full_name?.trim() || !email?.trim()) {
      return res.status(400).json({
        error: "Hôtel, nom et e-mail sont obligatoires.",
      });
    }

    // Vérifier que l'hôtel existe
    const { data: hotel, error: hotelError } = await supabase
      .from("hotels")
      .select("id, name, status")
      .eq("id", Number(hotel_id))
      .maybeSingle();

    if (hotelError) {
      return res.status(500).json({
        error: "Impossible de vérifier l'hôtel.",
      });
    }

    if (!hotel) {
      return res.status(404).json({
        error: "Hôtel introuvable.",
      });
    }

    if (hotel.status !== "active") {
      return res.status(400).json({
        error: "Cet hôtel n'est pas actif.",
      });
    }

    // Vérifier qu'il n'existe pas déjà un administrateur pour cet hôtel
    const { data: existingAdmin, error: existingAdminError } =
      await supabase
        .from("admins")
        .select("id")
        .eq("hotel_id", Number(hotel_id))
        .eq("role", "admin")
        .maybeSingle();

    if (existingAdminError) {
      return res.status(500).json({
        error: "Impossible de vérifier l'administrateur de l'hôtel.",
      });
    }

    if (existingAdmin) {
      return res.status(409).json({
        error: "Cet hôtel possède déjà un administrateur.",
      });
    }

    // Vérifier une invitation déjà en attente
    const normalizedEmail = email.trim().toLowerCase();

    const { data: pendingInvitation, error: pendingError } =
      await supabase
        .from("admin_invitations")
        .select("id")
        .eq("hotel_id", Number(hotel_id))
        .eq("email", normalizedEmail)
        .eq("status", "pending")
        .maybeSingle();

    if (pendingError) {
      return res.status(500).json({
        error: "Impossible de vérifier les invitations existantes.",
      });
    }

    if (pendingInvitation) {
      return res.status(409).json({
        error: "Une invitation est déjà en attente pour cet administrateur.",
      });
    }

    // Créer l'invitation
    const { data: invitation, error: invitationError } =
      await supabase
        .from("admin_invitations")
        .insert({
          hotel_id: Number(hotel_id),
          invited_by: admin.id,
          email: normalizedEmail,
          full_name: full_name.trim(),
          role: role === "admin" ? "admin" : "admin",
          status: "pending",
        })
        .select("id, hotel_id, email, full_name, role, status, expires_at")
        .single();

    if (invitationError) {
      return res.status(500).json({
        error: "Impossible d'enregistrer l'invitation.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invitation enregistrée.",
      invitation,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erreur serveur.",
    });
  }
}
