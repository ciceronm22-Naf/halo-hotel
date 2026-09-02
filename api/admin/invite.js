import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default async function handler(req, res) {
  // Autoriser uniquement POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée",
    });
  }

  try {
    // Vérifier la configuration serveur
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({
        error: "Configuration serveur Supabase manquante.",
      });
    }

    // Vérifier le token de l'utilisateur connecté
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentification requise.",
      });
    }

    const accessToken = authorization.replace("Bearer ", "").trim();

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return res.status(401).json({
        error: "Session invalide ou expirée.",
      });
    }

    // Vérifier que l'utilisateur est bien Super-Admin
    const { data: caller, error: callerError } = await supabaseAdmin
      .from("admins")
      .select("id, role, status")
      .eq("auth_user_id", user.id)
      .single();

    if (
      callerError ||
      !caller ||
      caller.role !== "super_admin" ||
      caller.status !== "active"
    ) {
      return res.status(403).json({
        error: "Accès réservé au Super-Admin.",
      });
    }

    // Récupérer les données de l'invitation
    const {
      hotel_id,
      full_name,
      email,
      role = "admin",
    } = req.body || {};

    // Vérifications
    if (!hotel_id || !full_name || !email) {
      return res.status(400).json({
        error: "hotel_id, full_name et email sont obligatoires.",
      });
    }

    if (!["admin"].includes(role)) {
      return res.status(400).json({
        error: "Le rôle doit être administrateur.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(full_name).trim();

    if (!normalizedName) {
      return res.status(400).json({
        error: "Le nom est obligatoire.",
      });
    }

    // Vérifier que l'hôtel existe
    const { data: hotel, error: hotelError } = await supabaseAdmin
      .from("hotels")
      .select("id, name, status")
      .eq("id", hotel_id)
      .single();

    if (hotelError || !hotel) {
      return res.status(404).json({
        error: "Établissement introuvable.",
      });
    }

    if (hotel.status !== "active") {
      return res.status(400).json({
        error: "Cet établissement n'est pas actif.",
      });
    }

    // Vérifier qu'il n'existe pas déjà un administrateur pour cet hôtel
    const { data: existingAdmin, error: existingAdminError } =
      await supabaseAdmin
        .from("admins")
        .select("id, email, status")
        .eq("hotel_id", hotel_id)
        .eq("role", "admin")
        .maybeSingle();

    if (existingAdminError) {
      return res.status(500).json({
        error: "Impossible de vérifier l'administrateur existant.",
      });
    }

    if (existingAdmin) {
      return res.status(409).json({
        error: "Cet établissement possède déjà un administrateur.",
      });
    }

    // Vérifier une invitation déjà en attente
    const { data: pendingInvitation } = await supabaseAdmin
      .from("admin_invitations")
      .select("id, email, expires_at")
      .eq("hotel_id", hotel_id)
      .eq("email", normalizedEmail)
      .eq("status", "pending")
      .maybeSingle();

    if (pendingInvitation) {
      return res.status(409).json({
        error: "Une invitation est déjà en attente pour cet administrateur.",
      });
    }

    // Envoyer l'invitation Supabase Auth
    const origin =
      req.headers.origin ||
      `https://${req.headers.host}`;

    const redirectTo = `${origin}/`;

    const {
      data: invitedUser,
      error: inviteError,
    } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      normalizedEmail,
      {
        redirectTo,
        data: {
          full_name: normalizedName,
          hotel_id: hotel_id,
          role: "admin",
        },
      }
    );

    if (inviteError) {
      return res.status(400).json({
        error: inviteError.message,
      });
    }

    // Enregistrer l'invitation
    const { data: invitation, error: invitationError } =
      await supabaseAdmin
        .from("admin_invitations")
        .insert({
          hotel_id,
          invited_by: caller.id,
          email: normalizedEmail,
          full_name: normalizedName,
          role: "admin",
          auth_user_id: invitedUser.user.id,
          status: "pending",
        })
        .select()
        .single();

    if (invitationError) {
      return res.status(500).json({
        error:
          "L'utilisateur a été créé mais l'invitation n'a pas pu être enregistrée.",
      });
    }

    return res.status(201).json({
      success: true,
      message: `Invitation envoyée à ${normalizedEmail}.`,
      invitation: {
        id: invitation.id,
        hotel_id: invitation.hotel_id,
        email: invitation.email,
        full_name: invitation.full_name,
        role: invitation.role,
        status: invitation.status,
        expires_at: invitation.expires_at,
      },
    });
  } catch (error) {
    console.error("Erreur invitation administrateur:", error);

    return res.status(500).json({
      error: "Une erreur serveur est survenue.",
    });
  }
  }
