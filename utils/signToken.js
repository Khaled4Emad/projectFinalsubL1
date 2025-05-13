const jwt = require('jsonwebtoken');

const signToken = (id, email, role, classId) => {
  return jwt.sign({ studentId: student.id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
};

module.exports = signToken;
