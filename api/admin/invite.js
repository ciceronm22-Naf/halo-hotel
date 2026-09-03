import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

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

    // 1. Vérifier la session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({
        error: "Session invalide.",
      });
    }

    // 2. Vérifier le Super-Admin
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

    // 3. Récupérer les données
    const { hotel_id, full_name, email } = req.body || {};

    if (!hotel_id || !full_name?.trim() || !email?.trim()) {
      return res.status(400).json({
        error: "Hôtel, nom et e-mail sont obligatoires.",
      });
    }

    const hotelId = Number(hotel_id);
    const normalizedEmail = email.trim().toLowerCase();

    // 4. Vérifier l'hôtel
    const { data: hotel, error: hotelError } = await supabase
      .from("hotels")
      .select("id, name, status")
      .eq("id", hotelId)
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

    // 5. Vérifier l'administrateur existant
    const { data: existingAdmin, error: existingAdminError } =
      await supabase
        .from("admins")
        .select("id")
        .eq("hotel_id", hotelId)
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

    // 6. Vérifier une invitation déjà en attente
    const { data: pendingInvitation, error: pendingError } =
      await supabase
        .from("admin_invitations")
        .select("id")
        .eq("hotel_id", hotelId)
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

    // 7. Créer le compte Auth
    const temporaryPassword =
      crypto.randomUUID() + crypto.randomUUID();

    const {
      data: authData,
      error: authError,
    } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: temporaryPassword,
      email_confirm: false,
      user_metadata: {
        full_name: full_name.trim(),
        hotel_id: hotelId,
        invited_role: "admin",
      },
    });

    if (authError) {
      return res.status(400).json({
        error:
          "Impossible de créer le compte utilisateur : " +
          authError.message,
      });
    }

    const authUserId = authData.user.id;

    // 8. Générer un jeton d'invitation sécurisé
    const invitationToken = crypto.randomBytes(32).toString("hex");

    // On ne stocke jamais le jeton original en base.
    const tokenHash = crypto
      .createHash("sha256")
      .update(invitationToken)
      .digest("hex");

    // 9. Créer l'invitation
    const {
      data: invitation,
      error: invitationError,
    } = await supabase
      .from("admin_invitations")
      .insert({
        hotel_id: hotelId,
        invited_by: admin.id,
        email: normalizedEmail,
        full_name: full_name.trim(),
        role: "admin",
        auth_user_id: authUserId,
        status: "pending",
        token_hash: tokenHash,
        token_version: 1,
      })
      .select(
        "id, hotel_id, email, full_name, role, auth_user_id, status, expires_at"
      )
      .single();

    if (invitationError) {
      // Nettoyage si l'invitation n'a pas pu être enregistrée.
      await supabase.auth.admin.deleteUser(authUserId);

      return res.status(500).json({
        error: "Impossible d'enregistrer l'invitation.",
      });
    }

    // 10. Pour le moment, on retourne le jeton uniquement
    // afin de pouvoir tester le mécanisme.
    return res.status(200).json({
      success: true,
      message: "Invitation créée avec jeton sécurisé.",
      invitation,
      invitation_token: invitationToken,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erreur serveur.",
    });
  }
}
