const assert = require("node:assert/strict");
const test = require("node:test");
const { hashPassword, verifyPassword } = require("../src/utils/password");
const { buildUsername } = require("../src/services/userAccountService");

test("password hash verifies only the original password", () => {
  const hash = hashPassword("password-rahasia");

  assert.equal(verifyPassword("password-rahasia", hash), true);
  assert.equal(verifyPassword("password-salah", hash), false);
});

test("buildUsername normalizes email into route-safe username", () => {
  assert.equal(buildUsername("Nama.User+demo@example.com"), "nama-user-demo");
  assert.equal(buildUsername("@example.com"), "user");
});
