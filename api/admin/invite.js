export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "API invitation prête.",
  });
}
