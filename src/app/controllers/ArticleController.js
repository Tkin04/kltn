const Article = require('../models/Article');
const slugify = require('slugify');
const { mongooseToObject, multipleMongooseToObject } = require('../../util/mongoose');

class ArticleController {
    // [GET] /articles/:slug
    async show(req, res, next) {
        try {

            const article =
                await Article.findOne({slug: req.params.slug});

            if (!article) {
                return res
                    .status(404)
                    .send('Không tìm thấy bài viết');
            }

            // tăng view
            await Article.updateOne( {_id: article._id}, {$inc: { views: 1} } );

            // bài liên quan
            const relatedArticles =
                await Article.find({
                    category: article.category,
                    _id: { $ne: article._id },
                })
                .limit(3);

            res.render('articles/show',
                {
                    article: mongooseToObject(article),
                    relatedArticles: multipleMongooseToObject(relatedArticles),
                    title: article.name,
                }
            );

        } catch (error) {
            next(error);
        }
    }

    // [GET] /articles/create
    create(req, res, next) {
        res.render('articles/create', { title: 'Đăng bài viết' });
    }

    // [POST] /articles/store
    store(req, res, next) {
        req.body.author = req.session.user._id;
        const article = new Article(req.body);
        article.save()
            .then(() =>
                res.redirect('/me/stored/articles')
            )
            .catch(next);
    }
        // [GET] /articles/:id/edit
    edit(req, res, next) {
        Article.findOne({
            _id: req.params.id,
            author: req.session.user._id,
        })
        .then(article => {
            if (!article) {
                return res
                    .status(403)
                    .send('Bạn không có quyền chỉnh sửa bài viết này');
            }
            res.render('articles/edit',{article: mongooseToObject(article), title: 'Chỉnh sửa bài viết'});
        })
        .catch(next);
    }

    //[PUT] /articles/:id
    update(req, res, next){
        req.body.slug = slugify(
            req.body.name,
            {
                lower: true,
                strict: true,
            }
        );
        Article.updateOne(
            {
                _id: req.params.id,
                author: req.session.user._id,
            },
            req.body
        )
        .then(result => {

            if (!result.matchedCount) {
                return res.send(
                    'Bạn không có quyền chỉnh sửa bài viết này'
                );
            }

            res.redirect('/me/stored/articles');
        })
        .catch(next);
    }

    //[DELETE] /articles/:id
    destroy(req, res, next){
        Article.delete({
            _id: req.params.id,
            author: req.session.user._id,
        })
        .then(result => {
            if (!result.modifiedCount) {
                return res.send(
                    'Bạn không có quyền xóa bài viết này'
                );
            }
            res.redirect('/me/stored/articles');
        })
        .catch(next);
    }

    //[DELETE] /articles/:id/force
    forcedestroy(req, res, next){
        Article.deleteOne({
            _id: req.params.id,
            author: req.session.user._id,
        })
            .then(() => res.redirect('/me/trash/articles'))
            .catch(next);
    }

    //[PATCH] /articles/:id/restore
    restore(req, res, next){
        Article.restore({
            _id: req.params.id,
            author: req.session.user._id,
        })
            .then(() => res.redirect('/me/trash/articles'))
            .catch(next);
    }
    
    //[POST] /articles/handle-form-actions
    handleFormActions(req, res, next){
        switch(req.body.action){
            case 'delete':
                Article.delete({
                    _id: { $in: req.body.articleIds },
                    author: req.session.user._id,
                })
                    .then(result => {
                        const selectedCount = req.body.articleIds.length;
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
                                    window.location = '/me/stored/articles';
                                </script>
                            `);
                        }
                        res.redirect('/me/stored/articles');
                    })
                    .catch(next);
                break;
            case 'restore':
                Article.restore({
                    _id: { $in: req.body.articleIds },
                    author: req.session.user._id,
                })
                    .then(result => {
                        const selectedCount = req.body.articleIds.length;
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
                                    window.location = '/me/trash/articles';
                                </script>
                            `);
                        }
                        res.redirect('/me/trash/articles');
                    })
                    .catch(next);
                break;
            case 'force-delete':
                Article.deleteMany({
                    _id: { $in: req.body.articleIds },
                    author: req.session.user._id,
                })
                    .then(result => {
                        const selectedCount = req.body.articleIds.length;
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
                                    window.location = '/me/stored/articles';
                                </script>
                            `);
                        }
                        res.redirect('/me/stored/articles');
                    })
                    .catch(next);
                break;
            default:
                res.json({ message: 'Hành động không hợp lệ!' });
        }
    }

}
module.exports = new ArticleController();
