const express = require('express');
const router = express.Router();
const authMiddleware = require('../app/middlewares/authMiddleware');
const roleMiddleware = require('../app/middlewares/roleMiddleware');


const meController = require('../app/controllers/MeController');
router.get(
 '/stored/courses',
 authMiddleware,
 roleMiddleware(['admin']),
 meController.storedCourses
);

router.get(
 '/trash/courses',
 authMiddleware,
 roleMiddleware(['admin']),
 meController.trashCourses
);

module.exports = router;
