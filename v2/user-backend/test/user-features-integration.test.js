const assert = require("node:assert/strict");
const http = require("node:http");
const { after, before, test } = require("node:test");
const { app } = require("../src/app");
const { pools } = require("../src/config/database");

const createInMemoryPool = () => {
  const users = [];
  const sessions = [];
  const configs = [];
  const links = [];

  return {
    users,
    sessions,
    configs,
    links,
    async query(sql, params = []) {
      const normalized = sql.replace(/\s+/g, " ").trim();

      if (normalized === "SELECT 1") {
        return { rows: [{ 1: 1 }], affectedRows: 0 };
      }

      if (normalized.startsWith("INSERT INTO mc_users")) {
        const [id, email, username, fullName, passwordHash] = params;
        if (users.some((u) => u.email === email || u.username === username)) {
          const err = new Error("Duplicate entry");
          err.code = "ER_DUP_ENTRY";
          throw err;
        }
        const row = {
          id,
          email,
          username,
          full_name: fullName,
          password_hash: passwordHash,
          profile_photo: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        users.push(row);
        return { rows: [row], affectedRows: 1 };
      }

      if (normalized.startsWith("INSERT INTO mc_user_sessions")) {
        const [id, userId, tokenHash] = params;
        sessions.push({
          id,
          user_id: userId,
          token_hash: tokenHash,
          expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        });
        return { rows: [], affectedRows: 1 };
      }

      if (normalized.startsWith("SELECT * FROM mc_users WHERE email = ?")) {
        return { rows: users.filter((u) => u.email === params[0]), affectedRows: 0 };
      }

      if (normalized.startsWith("SELECT * FROM mc_users WHERE id = ?")) {
        return { rows: users.filter((u) => u.id === params[0]), affectedRows: 0 };
      }

      if (normalized.startsWith("SELECT email FROM mc_users WHERE id = ?")) {
        return {
          rows: users.filter((u) => u.id === params[0]).map((u) => ({ email: u.email })),
          affectedRows: 0,
        };
      }

      if (normalized.includes("FROM mc_user_sessions s JOIN mc_users u")) {
        const tokenHash = params[0];
        const session = sessions.find((s) => s.token_hash === tokenHash);
        if (!session) return { rows: [], affectedRows: 0 };
        const user = users.find((u) => u.id === session.user_id);
        return { rows: user ? [user] : [], affectedRows: 0 };
      }

      if (normalized.startsWith("UPDATE mc_users SET full_name = ?")) {
        const [fullName, username, profilePhoto, userId] = params;
        if (users.some((u) => u.username === username && u.id !== userId)) {
          const err = new Error("Duplicate username");
          err.code = "ER_DUP_ENTRY";
          throw err;
        }
        const user = users.find((u) => u.id === userId);
        if (user) {
          user.full_name = fullName;
          user.username = username;
          user.profile_photo = profilePhoto;
          user.updated_at = new Date().toISOString();
        }
        return { rows: user ? [user] : [], affectedRows: user ? 1 : 0 };
      }

      if (normalized.startsWith("UPDATE mc_users SET email = ?")) {
        const [newEmail, newUsername, userId] = params;
        if (users.some((u) => (u.email === newEmail || u.username === newUsername) && u.id !== userId)) {
          const err = new Error("Duplicate email");
          err.code = "ER_DUP_ENTRY";
          throw err;
        }
        const user = users.find((u) => u.id === userId);
        if (user) {
          user.email = newEmail;
          user.username = newUsername;
          user.updated_at = new Date().toISOString();
        }
        return { rows: user ? [user] : [], affectedRows: user ? 1 : 0 };
      }

      if (normalized.startsWith("UPDATE mc_users SET password_hash = ?")) {
        const [passwordHash, userId] = params;
        const user = users.find((u) => u.id === userId);
        if (user) {
          user.password_hash = passwordHash;
          user.updated_at = new Date().toISOString();
        }
        return { rows: [], affectedRows: user ? 1 : 0 };
      }

      if (normalized.startsWith("SELECT * FROM mc_endpoint_configs WHERE user_id = ? AND client_id = ?")) {
        const [userId, clientId] = params;
        return {
          rows: configs.filter((c) => c.user_id === userId && c.client_id === clientId),
          affectedRows: 0,
        };
      }

      if (normalized.startsWith("SELECT id FROM mc_endpoint_configs WHERE user_id = ? AND client_id = ?")) {
        const [userId, clientId] = params;
        return {
          rows: configs
            .filter((c) => c.user_id === userId && c.client_id === clientId)
            .map((c) => ({ id: c.id })),
          affectedRows: 0,
        };
      }

      if (normalized.startsWith("SELECT * FROM mc_endpoint_configs WHERE user_id = ?")) {
        const [userId] = params;
        return {
          rows: configs.filter((c) => c.user_id === userId),
          affectedRows: 0,
        };
      }

      if (normalized.startsWith("INSERT INTO mc_endpoint_configs")) {
        const [
          id,
          userId,
          clientId,
          name,
          sourceType,
          templateId,
          baseUrl,
          brokerUrl,
          endpointMap,
          topicMap,
          useSingleEndpoint,
          clientResample,
        ] = params;

        let existing = configs.find((c) => c.user_id === userId && c.client_id === clientId);
        if (existing) {
          existing.name = name;
          existing.source_type = sourceType;
          existing.template_id = templateId;
          existing.base_url = baseUrl;
          existing.broker_url = brokerUrl;
          existing.endpoint_map = endpointMap;
          existing.topic_map = topicMap;
          existing.use_single_endpoint = useSingleEndpoint;
          existing.client_resample = clientResample;
          existing.updated_at = new Date().toISOString();
        } else {
          existing = {
            id,
            user_id: userId,
            client_id: clientId,
            name,
            source_type: sourceType,
            template_id: templateId,
            base_url: baseUrl,
            broker_url: brokerUrl,
            endpoint_map: endpointMap,
            topic_map: topicMap,
            use_single_endpoint: useSingleEndpoint,
            client_resample: clientResample,
            is_active: false,
            updated_at: new Date().toISOString(),
          };
          configs.push(existing);
        }
        return { rows: [existing], affectedRows: 1 };
      }

      if (normalized.startsWith("UPDATE mc_endpoint_configs SET is_active = false WHERE user_id = ?")) {
        const [userId] = params;
        configs.forEach((c) => {
          if (c.user_id === userId) c.is_active = false;
        });
        return { rows: [], affectedRows: 1 };
      }

      if (normalized.startsWith("UPDATE mc_endpoint_configs SET is_active = true")) {
        const [userId, clientId] = params;
        const found = configs.find((c) => c.user_id === userId && c.client_id === clientId);
        if (found) {
          found.is_active = true;
          found.updated_at = new Date().toISOString();
        }
        return { rows: found ? [found] : [], affectedRows: found ? 1 : 0 };
      }

      if (normalized.startsWith("DELETE FROM mc_endpoint_configs WHERE user_id = ? AND client_id = ?")) {
        const [userId, clientId] = params;
        const idx = configs.findIndex((c) => c.user_id === userId && c.client_id === clientId);
        if (idx === -1) return { rows: [], affectedRows: 0 };
        configs.splice(idx, 1);
        return { rows: [], affectedRows: 1 };
      }

      if (normalized.startsWith("INSERT INTO mc_dashboard_links")) {
        const [
          id,
          userId,
          clientId,
          name,
          slug,
          templateId,
          published,
          configId,
          uiSettings,
        ] = params;

        if (links.some((l) => l.user_id === userId && l.slug === slug && l.client_id !== clientId)) {
          const err = new Error("Duplicate slug");
          err.code = "ER_DUP_ENTRY";
          throw err;
        }

        let existing = links.find((l) => l.user_id === userId && l.client_id === clientId);
        if (existing) {
          existing.name = name;
          existing.slug = slug;
          existing.template_id = templateId;
          existing.published = published;
          existing.config_id = configId;
          if (uiSettings !== null && uiSettings !== undefined) {
            existing.ui_settings = uiSettings;
          }
          existing.updated_at = new Date().toISOString();
        } else {
          existing = {
            id,
            user_id: userId,
            client_id: clientId,
            name,
            slug,
            template_id: templateId,
            published,
            config_id: configId,
            ui_settings: uiSettings,
            updated_at: new Date().toISOString(),
          };
          links.push(existing);
        }
        return { rows: [existing], affectedRows: 1 };
      }

      if (normalized.startsWith("SELECT l.*, c.client_id AS config_client_id FROM mc_dashboard_links l")) {
        if (normalized.includes("WHERE l.user_id = ? AND l.client_id = ?")) {
          const [userId, clientId] = params;
          const rows = links
            .filter((l) => l.user_id === userId && l.client_id === clientId)
            .map((l) => {
              const cfg = configs.find((c) => c.id === l.config_id);
              return { ...l, config_client_id: cfg ? cfg.client_id : "" };
            });
          return { rows, affectedRows: 0 };
        }

        const [userId] = params;
        const rows = links
          .filter((l) => l.user_id === userId)
          .map((l) => {
            const cfg = configs.find((c) => c.id === l.config_id);
            return { ...l, config_client_id: cfg ? cfg.client_id : "" };
          });
        return { rows, affectedRows: 0 };
      }

      if (normalized.startsWith("UPDATE mc_dashboard_links SET ui_settings = ?")) {
        const [settingsJson, userId, clientId] = params;
        const found = links.find((l) => l.user_id === userId && l.client_id === clientId);
        if (!found) return { rows: [], affectedRows: 0 };
        found.ui_settings = settingsJson;
        found.updated_at = new Date().toISOString();
        return { rows: [found], affectedRows: 1 };
      }

      if (normalized.startsWith("UPDATE mc_dashboard_links SET published = true")) {
        const [userId, clientId] = params;
        const found = links.find((l) => l.user_id === userId && l.client_id === clientId);
        if (!found) return { rows: [], affectedRows: 0 };
        found.published = true;
        found.updated_at = new Date().toISOString();
        return { rows: [found], affectedRows: 1 };
      }

      if (normalized.startsWith("DELETE FROM mc_dashboard_links WHERE user_id = ? AND client_id = ?")) {
        const [userId, clientId] = params;
        const idx = links.findIndex((l) => l.user_id === userId && l.client_id === clientId);
        if (idx === -1) return { rows: [], affectedRows: 0 };
        links.splice(idx, 1);
        return { rows: [], affectedRows: 1 };
      }

      if (normalized.includes("FROM mc_dashboard_links l JOIN mc_users u ON u.id = l.user_id JOIN mc_endpoint_configs c")) {
        const hasUsername = params.length === 3;
        const [username, templateId, slug] = hasUsername ? params : [null, params[0], params[1]];

        const found = links.find((l) => {
          const usr = users.find((u) => u.id === l.user_id);
          if (!usr) return false;
          if (hasUsername && usr.username !== username) return false;
          return l.template_id === templateId && l.slug === slug;
        });

        if (!found) return { rows: [], affectedRows: 0 };
        const usr = users.find((u) => u.id === found.user_id);
        const cfg = configs.find((c) => c.id === found.config_id);
        return {
          rows: [
            {
              ...found,
              username: usr.username,
              config_client_id: cfg.client_id,
              config_name: cfg.name,
              source_type: cfg.source_type,
              config_template_id: cfg.template_id,
              base_url: cfg.base_url,
              broker_url: cfg.broker_url,
              endpoint_map: cfg.endpoint_map,
              topic_map: cfg.topic_map,
              use_single_endpoint: cfg.use_single_endpoint,
              client_resample: cfg.client_resample,
              is_active: cfg.is_active,
            },
          ],
          affectedRows: 0,
        };
      }

      throw new Error(`Unhandled query in test pool: ${normalized}`);
    },
  };
};

let server;
let baseUrl;

before(async () => {
  pools.app = createInMemoryPool();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

const requestJson = async (path, { method = "GET", token, body } = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = response.status === 204 ? null : await response.json();
  return { status: response.status, data };
};

test("Full user-backend HTTP lifecycle: auth -> profile -> endpoint configs -> dashboard links -> public endpoint", async () => {
  // 1. Health check
  const health = await requestJson("/health");
  assert.equal(health.status, 200);
  assert.equal(health.data.database.app, "ok");

  // 2. Register account
  const reg = await requestJson("/auth/register", {
    method: "POST",
    body: {
      fullName: "Imam Ariadi",
      email: "Imam.Ariadi@Example.com",
      password: "password123",
    },
  });
  assert.equal(reg.status, 201);
  assert.ok(reg.data.token);
  assert.equal(reg.data.user.email, "imam.ariadi@example.com");
  assert.equal(reg.data.user.username, "imam-ariadi");

  const token = reg.data.token;

  // 3. Verify GET /me
  const me = await requestJson("/me", { token });
  assert.equal(me.status, 200);
  assert.equal(me.data.user.fullName, "Imam Ariadi");

  // 4. Reject unauthenticated /me
  const unauth = await requestJson("/me");
  assert.equal(unauth.status, 401);

  // 5. Update profile (PATCH /me/profile)
  const updatedProfile = await requestJson("/me/profile", {
    method: "PATCH",
    token,
    body: {
      fullName: "Imam Ariadi Updated",
      username: "imam-v2",
      profilePhoto: "data:image/png;base64,AAA",
    },
  });
  assert.equal(updatedProfile.status, 200);
  assert.equal(updatedProfile.data.user.username, "imam-v2");
  assert.equal(updatedProfile.data.user.fullName, "Imam Ariadi Updated");

  // 6. Create & activate endpoint config
  const savedConfig = await requestJson("/user/configs", {
    method: "POST",
    token,
    body: {
      id: "cfg-petengoran-1",
      name: "Petengoran Station 2 API",
      type: "backend",
      templateId: "station2",
      baseUrl: "https://api-microclimate.example.com",
      endpointMap: {
        topic5History: "/petengoran/topic5/history",
        station2Daily: "/petengoran/station2/history",
        station2Resample15m: "/petengoran/station2/history",
      },
      useSingleEndpoint: false,
      clientResample: "15",
    },
  });
  assert.equal(savedConfig.status, 200);
  assert.equal(savedConfig.data.result.id, "cfg-petengoran-1");

  const activated = await requestJson("/user/configs/cfg-petengoran-1/active", {
    method: "PATCH",
    token,
  });
  assert.equal(activated.status, 200);
  assert.equal(activated.data.result.isActive, true);

  const configList = await requestJson("/user/configs", { token });
  assert.equal(configList.status, 200);
  assert.equal(configList.data.result.length, 1);
  assert.equal(configList.data.result[0].isActive, true);

  // 7. Create, publish, and customize UI of a dashboard link
  const savedLink = await requestJson("/user/dashboard-links", {
    method: "POST",
    token,
    body: {
      id: "link-kebun-c",
      name: "Stasiun Kebun C",
      slug: "kebun-c",
      templateId: "station2",
      configId: "cfg-petengoran-1",
      published: false,
    },
  });
  assert.equal(savedLink.status, 200);
  assert.equal(savedLink.data.result.slug, "kebun-c");
  assert.equal(savedLink.data.result.published, false);

  const publishedLink = await requestJson("/user/dashboard-links/link-kebun-c/publish", {
    method: "PATCH",
    token,
  });
  assert.equal(publishedLink.status, 200);
  assert.equal(publishedLink.data.result.published, true);

  const uiUpdated = await requestJson("/user/dashboard-links/link-kebun-c/ui", {
    method: "PATCH",
    token,
    body: {
      uiSettings: {
        gauges: true,
        chart: true,
        table: false,
        gaugeItems: { humidity: true, temperature: true, rainfall: false },
      },
    },
  });
  assert.equal(uiUpdated.status, 200);
  assert.equal(uiUpdated.data.result.uiSettings.table, false);
  assert.equal(uiUpdated.data.result.uiSettings.gaugeItems.rainfall, false);

  // 8. Fetch public dashboard link by username, template, and slug
  const publicData = await requestJson("/public/dashboard-links/imam-v2/station2/kebun-c");
  assert.equal(publicData.status, 200);
  assert.equal(publicData.data.link.name, "Stasiun Kebun C");
  assert.equal(publicData.data.link.published, true);
  assert.equal(publicData.data.link.uiSettings.table, false);
  assert.equal(publicData.data.config.baseUrl, "https://api-microclimate.example.com");
  assert.equal(publicData.data.config.endpointMap.station2Daily, "/petengoran/station2/history");

  // 9. Update email and password
  const emailRes = await requestJson("/me/email", {
    method: "PATCH",
    token,
    body: {
      oldEmail: "imam.ariadi@example.com",
      newEmail: "imam.baru@example.com",
    },
  });
  assert.equal(emailRes.status, 200);
  assert.equal(emailRes.data.user.email, "imam.baru@example.com");

  const passRes = await requestJson("/me/password", {
    method: "PATCH",
    token,
    body: { newPassword: "passwordBaru123" },
  });
  assert.equal(passRes.status, 200);

  const relogin = await requestJson("/auth/login", {
    method: "POST",
    body: { email: "imam.baru@example.com", password: "passwordBaru123" },
  });
  assert.equal(relogin.status, 200);
  assert.ok(relogin.data.token);
});
