import express from "express";

const app = express();

const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(express.static("public"));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "QubitLab"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`QubitLab running on port ${PORT}`);
});