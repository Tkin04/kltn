const Course = require('../models/Course');
const { multipleMongooseToObject } = require('../../util/mongoose')

class MeController {
    // [GET] /me/stored/courses
    storedCourses(req, res, next) {

        let courseQuery = Course.find({});

        if ('_sort' in req.query) {
            courseQuery = courseQuery.sort({
                [req.query.column]: req.query.type
            });
        }

        Promise.all([
            courseQuery,
            Course.countDocumentsDeleted(),
            Course.countDocuments(),
            Course.countDocuments({
                status: 'published',
            }),
            Course.countDocuments({
                status: 'draft',
            }),
            Course.aggregate([
                {
                    $group: {
                        _id: null,
                        totalViews: {
                            $sum: '$views',
                        },
                    },
                },
            ]),
        ])
        .then(([courses, deletedCount, totalCourses, publishedCount, draftCount, totalViews]) => {
            res.locals.deletedCount = deletedCount;
            res.render('me/stored-courses', { 
                courses: multipleMongooseToObject(courses),
                analytics: {
                    totalCourses,
                    publishedCount,
                    draftCount,
                    totalViews: totalViews[0]?.totalViews || 0,
                },
            });
        })
        .catch(next);
    }

    // [GET] /me/trash/courses
    trashCourses(req, res, next) {
        Course.findDeleted({})
            .then(courses => {
                res.render('me/trash-courses', { courses: multipleMongooseToObject(courses) });
            })
            .catch(next);

    }
}
module.exports = new MeController();
