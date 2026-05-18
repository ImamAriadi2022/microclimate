const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const { petengoranStationRouter } = require("./routes/petengoranStationRoutes");
const { topic4Router } = require("./routes/topic4Routes");
const { simulationRouter } = require("./routes/simulationRoutes");
const { healthRouter } = require("./routes/healthRoutes");
const { publicApiRateLimiter } = require("./middleware/rateLimiter");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { loadOpenApiDocument } = require("./config/openapi");

const app = express();
const openApiDocument = loadOpenApiDocument();
const swaggerSidebarScript = `
(function () {
  const slugify = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const getPageFromHash = () => {
    const hash = window.location.hash || "";
    const match = hash.match(/page=([a-z0-9-]+)/i);
    return match ? match[1] : "all";
  };

  const setPageHash = (page) => {
    const nextHash = page === "all" ? "" : "#page=" + page;
    if (window.location.hash !== nextHash) {
      history.replaceState(null, "", nextHash || window.location.pathname + window.location.search);
    }
  };

  const extractLabel = (sectionNode, tagNode) => {
    const byId = (sectionNode.id || "").match(/^operations-tag-(.+)$/);
    if (byId && byId[1]) {
      return byId[1];
    }

    const raw = (tagNode.textContent || "").split("\n")[0].trim();
    return raw || "Section";
  };

  const buildSidebar = () => {
    if (document.getElementById("copilot-swagger-sidebar")) {
      return true;
    }

    const root = document.querySelector(".swagger-ui");
    const wrapper = document.querySelector(".swagger-ui .wrapper");
    const sections = Array.from(document.querySelectorAll(".opblock-tag-section"));

    if (!root || !wrapper || sections.length === 0) {
      return false;
    }

    const sidebar = document.createElement("aside");
    sidebar.id = "copilot-swagger-sidebar";

    const header = document.createElement("div");
    header.className = "sidebar-header";
    header.innerHTML = "<h3>Back Climate Docs</h3><p>Pilih section seperti pindah halaman.</p>";
    sidebar.appendChild(header);

    const list = document.createElement("ul");

    const pages = [{ slug: "all", label: "All APIs" }];

    sections.forEach((sectionNode) => {
      const tagNode = sectionNode.querySelector(".opblock-tag");
      const label = tagNode ? extractLabel(sectionNode, tagNode) : "Section";
      const slug = slugify(label);

      sectionNode.dataset.copilotPage = slug;
      pages.push({ slug, label });
    });

    const setActivePage = (page) => {
      const chosen = pages.some((p) => p.slug === page) ? page : "all";

      sections.forEach((sectionNode) => {
        const sectionPage = sectionNode.dataset.copilotPage;
        const shouldShow = chosen === "all" || sectionPage === chosen;
        sectionNode.classList.toggle("copilot-hidden", !shouldShow);
      });

      Array.from(list.querySelectorAll("button")).forEach((button) => {
        button.classList.toggle("is-active", button.dataset.page === chosen);
      });

      setPageHash(chosen);
    };

    pages.forEach((page) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = page.label;
      button.dataset.page = page.slug;
      button.addEventListener("click", () => {
        setActivePage(page.slug);
      });
      item.appendChild(button);
      list.appendChild(item);
    });

    sidebar.appendChild(list);
    root.insertBefore(sidebar, wrapper);
    document.body.classList.add("swagger-has-sidebar");

    setActivePage(getPageFromHash());
    window.addEventListener("hashchange", () => setActivePage(getPageFromHash()));

    return true;
  };

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (buildSidebar() || tries > 60) {
      clearInterval(timer);
    }
  }, 250);
})();
`;
const swaggerUiOptions = {
  customSiteTitle: "Back Climate API Docs",
  customJs: "/docs/sidebar.js",
  customCss: `
    :root {
      --copilot-bg: #0b1020;
      --copilot-panel: #111a2e;
      --copilot-soft: #0f1729;
      --copilot-primary: #22d3ee;
      --copilot-primary-soft: #0f3144;
      --copilot-border: #253752;
      --copilot-text: #e7efff;
      --copilot-muted: #9eb2cd;
      --copilot-code: #0a1222;
    }

    body.swagger-has-sidebar {
      background: radial-gradient(circle at 6% 6%, #10253f 0%, var(--copilot-bg) 42%, #050913 100%);
      color: var(--copilot-text);
    }

    body.swagger-has-sidebar .swagger-ui {
      display: flex;
      gap: 20px;
      align-items: flex-start;
      padding: 16px;
    }

    body.swagger-has-sidebar .swagger-ui .wrapper {
      flex: 1;
      margin: 0;
      max-width: none;
      background: transparent;
      border: 0;
      border-radius: 0;
      padding: 0;
      box-shadow: none;
    }

    body.swagger-has-sidebar .swagger-ui .info {
      margin: 0 0 16px !important;
      max-width: none;
      text-align: left;
      background: var(--copilot-panel);
      border: 1px solid var(--copilot-border);
      border-radius: 12px;
      padding: 14px;
    }

    body.swagger-has-sidebar .swagger-ui .info .title,
    body.swagger-has-sidebar .swagger-ui .info p,
    body.swagger-has-sidebar .swagger-ui .info ul {
      margin-left: 0;
      margin-right: 0;
      text-align: left;
    }

    #copilot-swagger-sidebar {
      width: 260px;
      position: sticky;
      top: 14px;
      max-height: calc(100vh - 28px);
      overflow: auto;
      padding: 12px;
      border: 1px solid var(--copilot-border);
      border-radius: 12px;
      background: linear-gradient(180deg, #10203a 0%, #0c1628 100%);
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
    }

    #copilot-swagger-sidebar .sidebar-header {
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #223754;
    }

    #copilot-swagger-sidebar h3 {
      margin: 0;
      font-size: 22px;
      font-family: Arial, sans-serif;
      color: var(--copilot-text);
      line-height: 1.1;
    }

    #copilot-swagger-sidebar p {
      margin: 4px 0 0;
      font-size: 12px;
      color: var(--copilot-muted);
    }

    #copilot-swagger-sidebar ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    #copilot-swagger-sidebar button {
      width: 100%;
      text-align: left;
      border: 1px solid #2a4565;
      background: #12253c;
      color: var(--copilot-text);
      padding: 10px 11px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s ease;
      line-height: 1.25;
    }

    #copilot-swagger-sidebar button:hover {
      background: #163252;
      border-color: #2dd4bf;
    }

    #copilot-swagger-sidebar button.is-active {
      background: linear-gradient(180deg, #22d3ee 0%, #0ea5b7 100%);
      border-color: #67e8f9;
      color: #05232a;
      font-weight: 600;
      box-shadow: 0 6px 14px rgba(34, 211, 238, 0.35);
    }

    .swagger-ui .opblock-tag-section.copilot-hidden {
      display: none !important;
    }

    body.swagger-has-sidebar .swagger-ui .scheme-container,
    body.swagger-has-sidebar .swagger-ui .topbar {
      display: none;
    }

    body.swagger-has-sidebar .swagger-ui .information-container,
    body.swagger-has-sidebar .swagger-ui .info,
    body.swagger-has-sidebar .swagger-ui .opblock-tag,
    body.swagger-has-sidebar .swagger-ui .opblock,
    body.swagger-has-sidebar .swagger-ui .model-box,
    body.swagger-has-sidebar .swagger-ui .responses-inner,
    body.swagger-has-sidebar .swagger-ui .response-col_status,
    body.swagger-has-sidebar .swagger-ui .response-col_description {
      color: var(--copilot-text);
    }

    body.swagger-has-sidebar .swagger-ui .opblock-tag {
      background: #11243b;
      border: 1px solid #203958;
      border-radius: 10px;
      margin-bottom: 10px;
      padding: 0 10px;
    }

    body.swagger-has-sidebar .swagger-ui .opblock {
      background: var(--copilot-soft);
      border-color: #1f3149;
    }

    body.swagger-has-sidebar .swagger-ui input,
    body.swagger-has-sidebar .swagger-ui textarea,
    body.swagger-has-sidebar .swagger-ui select {
      background: #0a1625;
      color: var(--copilot-text);
      border-color: #2a4260;
    }

    body.swagger-has-sidebar .swagger-ui .btn,
    body.swagger-has-sidebar .swagger-ui .opblock-summary-control {
      color: var(--copilot-text);
    }

    body.swagger-has-sidebar .swagger-ui pre,
    body.swagger-has-sidebar .swagger-ui code,
    body.swagger-has-sidebar .swagger-ui .microlight {
      background: var(--copilot-code) !important;
      color: #d1e4ff !important;
    }

    body.swagger-has-sidebar .swagger-ui .parameter__name,
    body.swagger-has-sidebar .swagger-ui .parameter__type,
    body.swagger-has-sidebar .swagger-ui .parameter__deprecated,
    body.swagger-has-sidebar .swagger-ui .prop-type,
    body.swagger-has-sidebar .swagger-ui .prop-name {
      color: #b9d0e8;
    }

    body.swagger-has-sidebar .swagger-ui .info p,
    body.swagger-has-sidebar .swagger-ui .info li,
    body.swagger-has-sidebar .swagger-ui .markdown p,
    body.swagger-has-sidebar .swagger-ui .markdown li {
      color: var(--copilot-muted);
    }

    @media (max-width: 1024px) {
      #copilot-swagger-sidebar {
        display: none;
      }

      body.swagger-has-sidebar .swagger-ui {
        display: block;
        padding: 8px;
      }

      body.swagger-has-sidebar .swagger-ui .wrapper {
        padding: 0;
      }
    }
  `,
  explorer: false,
  swaggerOptions: {
    docExpansion: "list",
    defaultModelsExpandDepth: 1,
    displayRequestDuration: true,
    tryItOutEnabled: true,
    filter: false,
  },
};

app.use(cors());
app.use(express.json());
app.use(publicApiRateLimiter);

app.get("/docs.json", (_req, res) => {
  res.status(200).json(openApiDocument);
});

app.get("/docs/sidebar.js", (_req, res) => {
  res.type("application/javascript").send(swaggerSidebarScript);
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument, swaggerUiOptions));

app.use(healthRouter);
app.use(petengoranStationRouter);
app.use(topic4Router);
app.use(simulationRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = {
  app,
};
