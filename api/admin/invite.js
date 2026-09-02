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
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée.",
    });
  }

  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({
        error: "Configuration serveur Supabase manquante.",
      });
    }

    // --------------------------------------------------
    // 1. Vérifier la session du Super-Admin
    // --------------------------------------------------

    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentification requise.",
      });
    }

    const accessToken = authorization
      .replace("Bearer ", "")
      .trim();

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return res.status(401).json({
        error: "Session invalide ou expirée.",
      });
    }

    // --------------------------------------------------
    // 2. Vérifier que celui qui invite est Super-Admin
    // --------------------------------------------------

    const {
      data: caller,
      error: callerError,
    } = await supabaseAdmin
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

    // --------------------------------------------------
    // 3. Récupérer les données envoyées
    // --------------------------------------------------

    const {
      hotel_id,
      full_name,
      email,
    } = req.body || {};

    if (!hotel_id || !full_name || !email) {
      return res.status(400).json({
        error:
          "hotel_id, full_name et email sont obligatoires.",
      });
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const normalizedName = String(full_name)
      .trim();

    if (!normalizedName) {
      return res.status(400).json({
        error: "Le nom est obligatoire.",
      });
    }

    // --------------------------------------------------
    // 4. Vérifier que l'hôtel existe et est actif
    // --------------------------------------------------

    const {
      data: hotel,
      error: hotelError,
    } = await supabaseAdmin
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

    // --------------------------------------------------
    // 5. Vérifier qu'il n'y a pas déjà un administrateur
    // --------------------------------------------------

    const {
      data: existingAdmin,
      error: existingAdminError,
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
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée.",
    });
  }

  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({
        error: "Configuration serveur Supabase manquante.",
      });
    }

    // --------------------------------------------------
    // 1. Vérifier la session
    // --------------------------------------------------

    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentification requise.",
      });
    }

    const accessToken = authorization
      .replace("Bearer ", "")
      .trim();

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return res.status(401).json({
        error: "Session invalide ou expirée.",
      });
    }

    // --------------------------------------------------
    // 2. Vérifier que l'utilisateur est Super-Admin
    // --------------------------------------------------

    const {
      data: caller,
      error: callerError,
    } = await supabaseAdmin
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

    // --------------------------------------------------
    // 3. Récupérer les données
    // --------------------------------------------------

    const {
      hotel_id,
      full_name,
      email,
    } = req.body || {};

    if (!hotel_id || !full_name || !email) {
      return res.status(400).json({
        error:
          "hotel_id, full_name et email sont obligatoires.",
      });
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const normalizedName = String(full_name).trim();

    if (!normalizedName) {
      return res.status(400).json({
        error: "Le nom est obligatoire.",
      });
    }

    // Vérification simple de l'adresse e-mail
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        error: "Adresse e-mail invalide.",
      });
    }

    // --------------------------------------------------
    // 4. Vérifier l'hôtel
    // --------------------------------------------------

    const {
      data: hotel,
      error: hotelError,
    } = await supabaseAdmin
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

    // --------------------------------------------------
    // 5. Vérifier qu'il n'existe pas déjà
    //    un administrateur pour cet hôtel
    // --------------------------------------------------

    const {
      data: existingAdmin,
      error: existingAdminError,
    } = await supabaseAdmin
      .from("admins")
      .select("id, email, status")
      .eq("hotel_id", hotel_id)
      .eq("role", "admin")
      .maybeSingle();

    if (existingAdminError) {
      return res.status(500).json({
        error:
          "Impossible de vérifier l'administrateur existant.",
      });
    }

    if (existingAdmin) {
      return res.status(409).json({
        error:
          "Cet établissement possède déjà un administrateur.",
      });
    }

    // --------------------------------------------------
    // 6. Chercher le compte existant dans Supabase Auth
    // --------------------------------------------------

    let existingAuthUser = null;
    let page = 1;
    const perPage = 1000;

    while (!existingAuthUser) {
      const {
        data: usersPage,
        error: usersError,
      } =
        await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage,
        });

      if (usersError) {
        console.error(
          "Erreur recherche utilisateur Auth:",
          usersError
        );

        return res.status(500).json({
          error:
            "Impossible de rechercher l'utilisateur dans Supabase Auth.",
        });
      }

      const users = usersPage?.users || [];

      existingAuthUser = users.find(
        (authUser) =>
          String(authUser.email || "")
            .trim()
            .toLowerCase() === normalizedEmail
      );

      if (
        existingAuthUser ||
        users.length < perPage
      ) {
        break;
      }

      page += 1;
    }

    // --------------------------------------------------
    // 7. L'adresse doit déjà exister dans Auth
    // --------------------------------------------------

    if (!existingAuthUser) {
      return res.status(404).json({
        error:
          "Aucun compte Supabase Auth ne correspond à cette adresse e-mail. Cette adresse doit d'abord exister dans Auth.",
      });
    }

    // --------------------------------------------------
    // 8. Vérifier si ce compte est déjà lié
    // --------------------------------------------------

    const {
      data: linkedAdmin,
      error: linkedAdminError,
    } = await supabaseAdmin
      .from("admins")
      .select(
        "id, hotel_id, role, status, email"
      )
      .eq("auth_user_id", existingAuthUser.id)
      .maybeSingle();

    if (linkedAdminError) {
      return res.status(500).json({
        error:
          "Impossible de vérifier le profil administrateur existant.",
      });
    }

    if (linkedAdmin) {
      if (linkedAdmin.role === "super_admin") {
        return res.status(409).json({
          error:
            "Cette adresse e-mail appartient déjà au Super-Admin.",
        });
      }

      return res.status(409).json({
        error:
          "Cette adresse e-mail est déjà liée à un compte administrateur.",
      });
    }

    // --------------------------------------------------
    // 9. Vérifier les invitations existantes
    // --------------------------------------------------

    const {
      data: pendingInvitation,
      error: pendingError,
    } = await supabaseAdmin
      .from("admin_invitations")
      .select(
        "id, email, expires_at, status"
      )
      .eq("hotel_id", hotel_id)
      .eq("email", normalizedEmail)
      .eq("status", "pending")
      .maybeSingle();

    if (pendingError) {
      return res.status(500).json({
        error:
          "Impossible de vérifier les invitations existantes.",
      });
    }

    if (pendingInvitation) {
      const expiresAt = new Date(
        pendingInvitation.expires_at
      ).getTime();

      if (expiresAt > Date.now()) {
        return res.status(409).json({
          error:
            "Une invitation est déjà en attente pour cet administrateur.",
        });
      }

      await supabaseAdmin
        .from("admin_invitations")
        .update({
          status: "expired",
        })
        .eq("id", pendingInvitation.id);
    }

    // --------------------------------------------------
    // 10. Créer la nouvelle invitation
    // --------------------------------------------------

    const {
      data: invitation,
      error: invitationError,
    } = await supabaseAdmin
      .from("admin_invitations")
      .insert({
        hotel_id: Number(hotel_id),
        invited_by: caller.id,
        email: normalizedEmail,
        full_name: normalizedName,
        role: "admin",
        auth_user_id: existingAuthUser.id,
        status: "pending",
        token_version: 1,
      })
      .select(
        "id, hotel_id, email, full_name, role, status, expires_at"
      )
      .single();

    if (invitationError) {
      console.error(
        "Erreur création invitation:",
        invitationError
      );

      return res.status(500).json({
        error:
          "Impossible d'enregistrer l'invitation.",
      });
    }

    // --------------------------------------------------
    // 11. Réponse
    // --------------------------------------------------

    return res.status(201).json({
      success: true,
      message:
        `Invitation préparée pour ${normalizedEmail}.`,
      invitation,
    });
  } catch (error) {
    console.error(
      "Erreur invitation administrateur:",
      error
    );

    return res.status(500).json({
      error: "Une erreur serveur est survenue.",
    });
  }
}
