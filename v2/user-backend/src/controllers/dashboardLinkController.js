const { getPoolBySource } = require("../config/database");
const {
  deleteDashboardLink,
  getPublicDashboardLink,
  listDashboardLinks,
  publishDashboardLink,
  saveDashboardLinkUi,
  upsertDashboardLink,
} = require("../services/dashboardLinkService");

const getAppPool = () => getPoolBySource("app");

const list = async (req, res, next) => {
  try {
    const links = await listDashboardLinks(getAppPool(), req.user.id);
    res.status(200).json({ result: links });
  } catch (error) {
    next(error);
  }
};

const save = async (req, res, next) => {
  try {
    const link = await upsertDashboardLink(getAppPool(), req.user.id, req.body || {});
    res.status(200).json({ result: link });
  } catch (error) {
    next(error);
  }
};

const publish = async (req, res, next) => {
  try {
    const link = await publishDashboardLink(getAppPool(), req.user.id, req.params.id);
    res.status(200).json({ result: link });
  } catch (error) {
    next(error);
  }
};

const saveUi = async (req, res, next) => {
  try {
    const link = await saveDashboardLinkUi(
      getAppPool(),
      req.user.id,
      req.params.id,
      req.body?.uiSettings || {}
    );
    res.status(200).json({ result: link });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteDashboardLink(getAppPool(), req.user.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const showPublic = async (req, res, next) => {
  try {
    const result = await getPublicDashboardLink(
      getAppPool(),
      null,
      req.params.template,
      req.params.slug
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const showPublicByUsername = async (req, res, next) => {
  try {
    const result = await getPublicDashboardLink(
      getAppPool(),
      req.params.username,
      req.params.template,
      req.params.slug
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  list,
  save,
  publish,
  saveUi,
  remove,
  showPublic,
  showPublicByUsername,
};
