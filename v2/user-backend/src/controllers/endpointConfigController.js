const { getPoolBySource } = require("../config/database");
const {
  activateEndpointConfig,
  deleteEndpointConfig,
  listEndpointConfigs,
  upsertEndpointConfig,
} = require("../services/endpointConfigService");

const getAppPool = () => getPoolBySource("app");

const list = async (req, res, next) => {
  try {
    const configs = await listEndpointConfigs(getAppPool(), req.user.id);
    res.status(200).json({ result: configs });
  } catch (error) {
    next(error);
  }
};

const save = async (req, res, next) => {
  try {
    const config = await upsertEndpointConfig(getAppPool(), req.user.id, req.body || {});
    res.status(200).json({ result: config });
  } catch (error) {
    next(error);
  }
};

const activate = async (req, res, next) => {
  try {
    const config = await activateEndpointConfig(getAppPool(), req.user.id, req.params.id);
    res.status(200).json({ result: config });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteEndpointConfig(getAppPool(), req.user.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  list,
  save,
  activate,
  remove,
};
