import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée.",
    });
  }

  try {
    const { token, password } = req.body || {};

    if (!token || !password) {
      return res.status(400).json({
        error: "Jeton et mot de passe obligatoires.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Le mot de passe doit contenir au moins 8 caractères.",
      });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Calculer l'empreinte du jeton reçu.
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Rechercher l'invitation correspondante.
    const { data: invitation, error: invitationError } =
      await supabase
        .from("admin_invitations")
        .select(
          "id, hotel_id, email, full_name, role, auth_user_id, status, expires_at, token_hash"
        )
        .eq("token_hash", tokenHash)
        .eq("status", "pending")
        .maybeSingle();

    if (invitationError) {
      return res.status(500).json({
        error: "Impossible de vérifier l'invitation.",
      });
    }

    if (!invitation) {
      return res.status(400).json({
        error: "Invitation invalide ou déjà utilisée.",
      });
    }

    // Vérifier l'expiration.
    if (new Date(invitation.expires_at) <= new Date()) {
      await supabase
        .from("admin_invitations")
        .update({
          status: "expired",
        })
        .eq("id", invitation.id);

      return res.status(400).json({
        error: "Cette invitation a expiré.",
      });
    }

    if (!invitation.auth_user_id) {
      return res.status(400).json({
        error: "Cette invitation n'est pas correctement associée à un compte.",
      });
    }

    // Définir le mot de passe choisi par l'administrateur.
    const { data: updatedUser, error: updateUserError } =
      await supabase.auth.admin.updateUserById(
        invitation.auth_user_id,
        {
          password,
          email_confirm: true,
          user_metadata: {
            full_name: invitation.full_name,
            hotel_id: invitation.hotel_id,
            invited_role: invitation.role,
          },
        }
      );

    if (updateUserError) {
      return res.status(400).json({
        error:
          "Impossible de définir le mot de passe : " +
          updateUserError.message,
      });
    }

    // Créer la fiche administrateur de l'hôtel.
    const { data: existingAdmin } = await supabase
      .from("admins")
      .select("id")
      .eq("auth_user_id", invitation.auth_user_id)
      .maybeSingle();

    if (!existingAdmin) {
      const { error: adminInsertError } = await supabase
        .from("admins")
        .insert({
          hotel_id: invitation.hotel_id,
          full_name: invitation.full_name,
          email: invitation.email,
          auth_user_id: invitation.auth_user_id,
          role: "admin",
          status: "active",
          invited_at: new Date().toISOString(),
        });

      if (adminInsertError) {
        return res.status(500).json({
          error:
            "Le compte a été créé, mais son profil administrateur n'a pas pu être enregistré.",
        });
      }
    }

    // Marquer l'invitation comme acceptée.
    const { error: invitationUpdateError } = await supabase
      .from("admin_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        token_hash: null,
        token_version: invitation.token_version + 1,
      })
      .eq("id", invitation.id)
      .eq("status", "pending");

    if (invitationUpdateError) {
      return res.status(500).json({
        error: "Impossible de finaliser l'invitation.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Compte administrateur activé.",
      user_id: updatedUser.user.id,
      hotel_id: invitation.hotel_id,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erreur serveur.",
    });
  }
      }
