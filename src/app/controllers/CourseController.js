const Course = require('../models/Course');
const slugify = require('slugify');
const {
    mongooseToObject,
    multipleMongooseToObject
} = require('../../util/mongoose');

class CourseController {
    // [GET] /courses/:slug
    async show(req, res, next) {
        try {

            const course =
                await Course.findOne({
                    slug:
                    req.params.slug
                });

            if (!course) {
                return res
                    .status(404)
                    .send(
                        'Không tìm thấy bài viết'
                    );
            }

            // tăng view
            await Course.updateOne(
                {
                    _id:
                    course._id
                },
                {
                    $inc: {
                        views: 1
                    }
                }
            );

            // bài liên quan
            const relatedCourses =
                await Course.find({
                    category:
                    course.category,

                    _id: {
                        $ne:
                        course._id
                    }
                })
                .limit(3);

            res.render(
                'courses/show',
                {
                    course: mongooseToObject(course),
                    relatedCourses: multipleMongooseToObject(relatedCourses),
                }
            );

        } catch (error) {
            next(error);
        }
    }

    // [GET] /courses/create
    create(req, res, next) {
        res.render('courses/create');
    }

    // [POST] /courses/store
    store(req, res, next) {
        req.body.author = req.session.user._id;
        const course = new Course(req.body);
        course.save()
            .then(() =>
                res.redirect('/me/stored/courses')
            )
            .catch(next);
    }
        // [GET] /courses/:id/edit
    edit(req, res, next) {
        Course.findOne({
            _id: req.params.id,
            author: req.session.user._id,
        })
        .then(course => {
            if (!course) {
                return res
                    .status(403)
                    .send('Bạn không có quyền chỉnh sửa bài viết này');
            }
            res.render('courses/edit',{course: mongooseToObject(course)});
        })
        .catch(next);
    }

    //[PUT] /courses/:id
    update(req, res, next){
        req.body.slug = slugify(
            req.body.name,
            {
                lower: true,
                strict: true,
            }
        );
        Course.updateOne(
            {
                _id: req.params.id,
                author:
                req.session.user._id,
            },
            req.body
        )
        .then(result => {

            if (!result.matchedCount) {
                return res.send(
                    'Bạn không có quyền chỉnh sửa bài viết này'
                );
            }

            res.redirect('/me/stored/courses');
        })
        .catch(next);
    }

    //[DELETE] /courses/:id
    destroy(req, res, next){
        Course.delete({
            _id: req.params.id,
            author: req.session.user._id,
        })
        .then(result => {
            if (!result.modifiedCount) {
                return res.send(
                    'Bạn không có quyền xóa bài viết này'
                );
            }
            res.redirect('/me/stored/courses');
        })
        .catch(next);
    }

    //[DELETE] /courses/:id/force
    forcedestroy(req, res, next){
        Course.deleteOne({
            _id: req.params.id,
            author: req.session.user._id,
        })
            .then(() => res.redirect('/me/trash/courses'))
            .catch(next);
    }

    //[PATCH] /courses/:id/restore
    restore(req, res, next){
        Course.restore({
            _id: req.params.id,
            author: req.session.user._id,
        })
            .then(() => res.redirect('/me/trash/courses'))
            .catch(next);
    }
    
    //[POST] /courses/handle-form-actions
    handleFormActions(req, res, next){
        switch(req.body.action){
            case 'delete':
                Course.delete({
                    _id: { $in: req.body.courseIds },
                    author: req.session.user._id,
                })
                    .then(result => {
                        const selectedCount = req.body.courseIds.length;
                        const deletedCount = result.modifiedCount;
                        const deniedCount = selectedCount - deletedCount;

                        if (deniedCount > 0) {
                            return res.send(`
                                <script>
                                    alert(
                                        'Đã xóa ${deletedCount} bài. '
                                        + '${deniedCount} bài '
                                        + 'không thuộc quyền '
                                        + 'quản lý của bạn.'
                                    );
                                    window.location = '/me/stored/courses';
                                </script>
                            `);
                        }
                        res.redirect('/me/stored/courses');
                    })
                    .catch(next);
                break;
            case 'restore':
                Course.restore({
                    _id: { $in: req.body.courseIds },
                    author: req.session.user._id,
                })
                    .then(result => {
                        const selectedCount = req.body.courseIds.length;
                        const restoredCount = result.modifiedCount;
                        const deniedCount = selectedCount - restoredCount;

                        if (deniedCount > 0) {
                            return res.send(`
                                <script>
                                    alert(
                                        'Đã khôi phục ${restoredCount} bài. '
                                        + '${deniedCount} bài '
                                        + 'không thuộc quyền '
                                        + 'quản lý của bạn.'
                                    );
                                    window.location = '/me/trash/courses';
                                </script>
                            `);
                        }
                        res.redirect('/me/trash/courses');
                    })
                    .catch(next);
                break;
            case 'force-delete':
                Course.deleteMany({
                    _id: { $in: req.body.courseIds },
                    author: req.session.user._id,
                })
                    .then(result => {
                        const selectedCount = req.body.courseIds.length;
                        const fdeletedCount = result.modifiedCount;
                        const deniedCount = selectedCount - fdeletedCount;

                        if (deniedCount > 0) {
                            return res.send(`
                                <script>
                                    alert(
                                        'Đã xóa ${fdeletedCount} bài. '
                                        + '${deniedCount} bài '
                                        + 'không thuộc quyền '
                                        + 'quản lý của bạn.'
                                    );
                                    window.location = '/me/stored/courses';
                                </script>
                            `);
                        }
                        res.redirect('/me/stored/courses');
                    })
                    .catch(next);
                break;
            default:
                res.json({ message: 'Hành động không hợp lệ!' });
        }
    }

}
module.exports = new CourseController();
