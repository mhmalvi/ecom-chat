require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const chatRoutes = require("./src/routes/chatRoutes");
const supabase = require("./src/lib/supabase");

const app = express();
const port = process.env.PORT || 8000;

// ✅ CORS config: allow frontend origin + headers
app.use(cors({
  origin: "*", // Or ["http://localhost:5500"] for tighter control
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "x-api-key"]
}));

// ✅ JSON parsing middleware
app.use(bodyParser.json());

// ✅ Static assets (widget.js, chat-ui.html, etc.)
app.use(express.static(path.join(__dirname, "public")));

// ✅ Routes
app.use("/debug", require("./src/routes/debugRoutes"));         // Supabase debug
app.use("/webhooks", require("./src/routes/webhookRoutes"));   // Webhooks (optional)
app.use("/chat", require("./src/routes/chatRoutes"));           // Chat logic

// ✅ Health check
app.get("/", (req, res) => {
  res.send("🚀 AI Chatbot Backend Running");
});


app.use("/chat", chatRoutes); // ✅ This means POST /chat → routed to chatRoutes.js
// ✅ Start server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
