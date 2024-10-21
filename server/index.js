const express = require("express");
var cors = require("cors");
var session = require("express-session");
const Knex = require("knex");
const KnexSessionStore = require("connect-session-knex")(session);
const { pool } = require("./DBConfig");

const knex = Knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "postgres",
    password: "postgres",
    database: "rbac"
  }
});

const sessionStore = new KnexSessionStore({
  knex,
  tablename: "sessions" // optional. Defaults to 'sessions'
});

const app = express();
const port = 3000;

const path = require("path");

const apiRoutes = require("./routes/router");

sessionStore.on("connect", () => {
  console.log("Session store connected");
});
sessionStore.on("disconnect", (err) => {
  console.error("Session store disconnected", err);
});

app.use(
  session({
    store: sessionStore,
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 30 * 24 * 60 * 60 * 1000, path: "/" }
  })
);

const corsOptions = {
  origin: "http://localhost:3031",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client/dist")));

app.use("/api", apiRoutes);

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
