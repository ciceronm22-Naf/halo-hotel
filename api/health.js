export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    application: "Hôtel Halo",
    service: "API",
  });
}
