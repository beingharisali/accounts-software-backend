const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError } = require("../errors");
const User = require("../models/User");

/**
 * REGISTER / SIGNUP
 */
const register = async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  // validation
  if (!firstName || !lastName || !email || !password) {
    throw new BadRequestError("Please provide all values");
  }

  // create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role,
  });

  // create token
  const token = user.createJWT();

  // response
  res.status(StatusCodes.CREATED).json({
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    token,
  });
};

/**
 * LOGIN
 */
const login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    throw new BadRequestError("Please provide email and password");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new UnauthenticatedError("Invalid Credentials");
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Invalid Credentials");
  }

  const token = user.createJWT();

  res.status(StatusCodes.OK).json({
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    token,
  });
};

module.exports = {
  register,
  login,
};
