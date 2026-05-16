const express = require('express');
const router = express.Router();

const authController =
require('../app/controllers/AuthController');

// page
router.get(
    '/login',
    authController.loginPage
);

router.get(
    '/register',
    authController.registerPage
);

// submit form
router.post(
    '/register',
    authController.register
);

router.post(
    '/login',
    authController.login
);

router.get(
    '/logout',
    authController.logout
);

module.exports = router;