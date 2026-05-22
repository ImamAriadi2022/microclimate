const assert = require("node:assert/strict");
const test = require("node:test");
const { loginUser, registerUser } = require("../src/services/userAccountService");

const createFakePool = () => {
  const users = [];

  return {
    async query(sql, params) {
      if (sql.includes("INSERT INTO mc_users")) {
        const row = {
          id: "user-1",
          email: params[0],
          username: params[1],
          full_name: params[2],
          password_hash: params[3],
          profile_photo: "",
          created_at: "2026-05-22T00:00:00.000Z",
          updated_at: "2026-05-22T00:00:00.000Z",
        };
        users.push(row);
        return { rows: [row] };
      }

      if (sql.includes("INSERT INTO mc_user_sessions")) {
        return { rows: [] };
      }

      if (sql.includes("SELECT * FROM mc_users WHERE email")) {
        return { rows: users.filter((user) => user.email === params[0]) };
      }

      throw new Error(`Unexpected query: ${sql}`);
    },
  };
};

test("registerUser creates a normalized user and loginUser accepts the same password", async () => {
  const pool = createFakePool();
  const registered = await registerUser(pool, {
    fullName: "Demo User",
    email: "Demo.User@example.com",
    password: "password-rahasia",
  });

  assert.equal(registered.user.email, "demo.user@example.com");
  assert.equal(registered.user.username, "demo-user");
  assert.ok(registered.token);

  const loggedIn = await loginUser(pool, {
    email: "demo.user@example.com",
    password: "password-rahasia",
  });

  assert.equal(loggedIn.user.id, registered.user.id);
  assert.ok(loggedIn.token);
});
