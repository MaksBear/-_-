const jwt = require('jsonwebtoken');

const auth = (requiredType = null) => {
    return async (req, res, next) => {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            
            if (!token) {
                throw new Error();
            }
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            
            if (requiredType && req.user.userType !== requiredType) {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            next();
        } catch (error) {
            res.status(401).json({ error: 'Please authenticate' });
        }
    };
};

module.exports = auth;