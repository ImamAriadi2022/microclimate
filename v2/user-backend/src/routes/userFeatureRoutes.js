const express = require("express");
const accountController = require("../controllers/userAccountController");
const dashboardLinkController = require("../controllers/dashboardLinkController");
const endpointConfigController = require("../controllers/endpointConfigController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/auth/register", accountController.register);
router.post("/auth/login", accountController.login);

router.get("/me", requireAuth, accountController.me);
router.patch("/me/profile", requireAuth, accountController.saveProfile);
router.patch("/me/email", requireAuth, accountController.saveEmail);
router.patch("/me/password", requireAuth, accountController.savePassword);

router.get("/user/configs", requireAuth, endpointConfigController.list);
router.post("/user/configs", requireAuth, endpointConfigController.save);
router.patch("/user/configs/:id/active", requireAuth, endpointConfigController.activate);
router.delete("/user/configs/:id", requireAuth, endpointConfigController.remove);

router.get("/user/dashboard-links", requireAuth, dashboardLinkController.list);
router.post("/user/dashboard-links", requireAuth, dashboardLinkController.save);
router.patch("/user/dashboard-links/:id/publish", requireAuth, dashboardLinkController.publish);
router.patch("/user/dashboard-links/:id/ui", requireAuth, dashboardLinkController.saveUi);
router.delete("/user/dashboard-links/:id", requireAuth, dashboardLinkController.remove);

router.get("/public/dashboard-links/:username/:template/:slug", dashboardLinkController.showPublicByUsername);
router.get("/public/dashboard-links/:template/:slug", dashboardLinkController.showPublic);

module.exports = {
  userFeatureRouter: router,
};
