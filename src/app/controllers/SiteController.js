const Course = require('../models/Course');
const {
    multipleMongooseToObject,
} = require('../../util/mongoose');

class SiteController {

    // [GET] /
    async index(req, res, next) {
        try {

            const search =
                req.query.search || '';

            const category =
                req.query.category || '';

            const query = {};

            // SEARCH
            if (search) {
                query.name = {
                    $regex: search,
                    $options: 'i',
                };
            }

            // CATEGORY
            if (category) {
                query.category =
                    category;
            }

            const courses =
                await Course.find(query);

            res.render(
                'home',
                {
                    courses:
                    multipleMongooseToObject(
                        courses
                    ),

                    search,
                    category,
                }
            );

        } catch (error) {
            next(error);
        }
    }
}

module.exports =
    new SiteController();