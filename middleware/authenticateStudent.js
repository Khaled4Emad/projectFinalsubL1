const jwt = require('jsonwebtoken');

module.exports = function authenticateJWT(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    // Make sure you attach the studentId (or whatever field is in the payload)
    req.studentId = decoded.studentId;

    next();
  });
}


const authenticateJWTteacher =(req, res, next) =>{
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
      if (err) return res.sendStatus(403); // Forbidden if token is invalid
      req.professorId = decoded.professorId;
      req.userType = decoded.userType; // Optionally, you can also store userType
      next();
    });
  } else {
    res.sendStatus(401); // Unauthorized if no token is present
  }
}
module.exports = authenticateJWTteacher;