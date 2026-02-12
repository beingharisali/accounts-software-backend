const jwt = require("jsonwebtoken");
const { UnauthenticatedError } = require("../errors");

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthenticatedError("Authentication invalid"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: payload.userId,
      name: payload.name,
      role: payload.role
    };

    next();
  } catch (error) {
    return next(new UnauthenticatedError("Authentication invalid"));
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        msg: "Access Denied: Aap is action ke liye authorized nahi hain."
      });
    }
    next();
  };
};

module.exports = { auth, authorizeRoles };