const { getPoolBySource } = require("../config/database");
const {
  loginUser,
  registerUser,
  updateEmail,
  updatePassword,
  updateProfile,
} = require("../services/userAccountService");

const getAppPool = () => getPoolBySource("app");

const register = async (req, res, next) => {
  try {
    const result = await registerUser(getAppPool(), req.body || {});
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await loginUser(getAppPool(), req.body || {});
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const me = (req, res) => {
  res.status(200).json({ user: req.userResponse });
};

const saveProfile = async (req, res, next) => {
  try {
    const user = await updateProfile(getAppPool(), req.user.id, req.body || {});
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

const saveEmail = async (req, res, next) => {
  try {
    const user = await updateEmail(getAppPool(), req.user.id, req.body || {});
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

const savePassword = async (req, res, next) => {
  try {
    await updatePassword(getAppPool(), req.user.id, req.body || {});
    res.status(200).json({ message: "Password berhasil diperbarui." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  me,
  saveProfile,
  saveEmail,
  savePassword,
};
