const jwt = require("jsonwebtoken");
const authenticateJWT =(req, res, next) =>{
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
      if (err) return res.sendStatus(403); // Forbidden if token is invalid
      req.studentId = decoded.studentId;
      req.userType = decoded.userType; // Optionally, you can also store userType
      next();
    });
  } else {
    res.sendStatus(401); // Unauthorized if no token is present
  }
}

module.exports = authenticateJWT;
