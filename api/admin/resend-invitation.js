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

    // Vérifier le Super-Admin
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

    const { invitation_id } = req.body || {};

    if (!invitation_id) {
      return res.status(400).json({
        error: "Identifiant de l'invitation obligatoire.",
      });
    }

    // Récupérer l'invitation
    const { data: invitation, error: invitationError } =
      await supabase
        .from("admin_invitations")
        .select(
          "id, hotel_id, email, full_name, role, auth_user_id, status, token_version"
        )
        .eq("id", Number(invitation_id))
        .maybeSingle();

    if (invitationError) {
      return res.status(500).json({
        error: "Impossible de récupérer l'invitation.",
      });
    }

    if (!invitation) {
      return res.status(404).json({
        error: "Invitation introuvable.",
      });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({
        error: "Cette invitation n'est plus en attente.",
      });
    }

    if (!invitation.auth_user_id) {
      return res.status(400).json({
        error: "Cette invitation n'est pas associée à un compte.",
      });
    }

    // Nouveau jeton aléatoire
    const invitationToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(invitationToken)
      .digest("hex");

    // Nouvelle expiration : 48 heures
    const expiresAt = new Date(
      Date.now() + 48 * 60 * 60 * 1000
    ).toISOString();

    // Invalider l'ancien jeton et enregistrer le nouveau
    const { error: updateError } = await supabase
      .from("admin_invitations")
      .update({
        token_hash: tokenHash,
        token_version: invitation.token_version + 1,
        expires_at: expiresAt,
        invited_at: new Date().toISOString(),
      })
      .eq("id", invitation.id)
      .eq("status", "pending");

    if (updateError) {
      return res.status(500).json({
        error: "Impossible de renouveler l'invitation.",
      });
    }

    // IMPORTANT :
    // le jeton est retourné temporairement uniquement pour nos tests.
    return res.status(200).json({
      success: true,
      message: "Invitation renouvelée.",
      invitation_token: invitationToken,
      invitation_id: invitation.id,
      email: invitation.email,
      expires_at: expiresAt,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erreur serveur.",
    });
  }
    }
