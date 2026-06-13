const express = require('express');
const router = express.Router();
const authMiddleware = require('../app/middlewares/authMiddleware');
const roleMiddleware = require('../app/middlewares/roleMiddleware');


const meController = require('../app/controllers/MeController');
router.get(
 '/stored/articles',
 authMiddleware,
 roleMiddleware(['admin']),
 meController.storedArticles
);

router.get(
 '/trash/articles',
 authMiddleware,
 roleMiddleware(['admin']),
 meController.trashArticles
);

router.get(
 '/header-settings',
 authMiddleware,
 roleMiddleware(['admin']),
 meController.headerSettings
);

router.post(
 '/header-settings',
 authMiddleware,
 roleMiddleware(['admin']),
 meController.updateHeaderSettings
);

module.exports = router;
