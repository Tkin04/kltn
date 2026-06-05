const Article = require('../models/Article');
const slugify = require('slugify');
const { mongooseToObject, multipleMongooseToObject } = require('../../util/mongoose');

class ArticleController {
    // [GET] /articles/:slug
    async show(req, res, next) {
        try {
            const article = await Article.findOne({
                slug: req.params.slug,
                status: 'published',
                deleted: false,
            });
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
                    status: 'published',
                    deleted: false,
                    _id: { $ne: article._id },
                })
                .sort({views: -1,})
                .limit(3);

            const plainText = article.content.replace( /<[^>]*>/g, ' ' ).trim();

            const wordCount =
                plainText
                    .split(/\s+/)
                    .filter(Boolean)
                    .length;

            const readingTime = Math.max( 1, Math.ceil( wordCount / 200 ));
            const categoryMap = {
                premierleague:'Premier League',
                laliga:'La Liga',
                bundesliga:'Bundesliga',
                seriea:'Serie A',
                ligue1:'Ligue 1',
                transfer:'Chuyển nhượng',
                vietnam:'Bóng đá Việt Nam',
                general:'Tin tức',
            };

            const categoryName = categoryMap[ article.category ] || 'Tin tức';
            res.render('articles/show', {
                article: mongooseToObject(article),
                relatedArticles:multipleMongooseToObject(relatedArticles),
                title: article.name,
                metaDescription: article.description,
                ogImage: article.image,
                readingTime,
                categoryName,
            });
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
        if (req.file) {
            req.body.image = `/uploads/${req.file.filename}`;
        }
        const article = new Article(req.body);
        article.save()
            .then(() => res.redirect('/me/stored/articles'))
            .catch(next);
    }

    // [POST] /articles/upload-editor-image
    uploadEditorImage(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: {
                        message: 'Không có ảnh upload'
                    }
                });
            }

            res.status(200).json({
                url: `/uploads/${req.file.filename}`
            });
        } catch (error) {
            next(error);
        }
    }

    // [GET] /articles/:id/edit
    edit(req, res, next) {
        const mongoose = require('mongoose');
        if (
            !mongoose.Types
                .ObjectId
                .isValid( req.params.id )
        ) {
            return res
                .status(404)
                .send('Không tìm thấy bài viết');
        }
        const page = Math.max( 1, parseInt( req.query.page ) || 1 );
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
            res.render('articles/edit',{
                article: mongooseToObject(article),
                title: 'Chỉnh sửa bài viết',
                page,
            });
        })
        .catch(next);
    }

    //[PUT] /articles/:id
    async update(req, res, next) {
        const page = Math.max( 1, parseInt( req.query.page ) || 1 );
        req.body.slug = slugify( req.body.name, { lower: true, strict: true, }
        );

        try {
            const article = await Article.findOne({
                _id: req.params.id,
                author:
                    req.session.user._id,
            });

            if (!article) {
                return res.send(
                    'Bạn không có quyền chỉnh sửa bài viết này'
                );
            }

            // có ảnh mới
            if (req.file) {
                req.body.image =
                    '/uploads/' +
                    req.file.filename;
            }
            // không có ảnh mới
            else {
                req.body.image =
                    article.image;
            }

            await Article.updateOne(
                {
                    _id: req.params.id,
                    author: req.session.user._id,
                },
                req.body
            );

            res.redirect(`/me/stored/articles?page=${page}`);
        } catch (error) {
            next(error);
        }
    }

    //[DELETE] /articles/:id
    destroy(req, res, next){
        const page = Math.max( 1, parseInt( req.query.page ) || 1 );
        Article.delete({
            _id: req.params.id,
            author: req.session.user._id,
        })
        .then(result => {
            if (!result.modifiedCount) {
                return res.send( 'Bạn không có quyền xóa bài viết này' );
            }
            res.redirect(`/me/stored/articles?page=${page}`);
        })
        .catch(next);
    }

    //[DELETE] /articles/:id/force
    forcedestroy(req, res, next){
        const page = Math.max( 1, parseInt( req.query.page ) || 1 );
        Article.deleteOne({
            _id: req.params.id,
            author: req.session.user._id,
        })
            .then(() => res.redirect(`/me/trash/articles?page=${page}`))
            .catch(next);
    }

    //[PATCH] /articles/:id/restore
    restore(req, res, next){
        const page = Math.max( 1, parseInt( req.query.page ) || 1 );
        Article.restore({
            _id: req.params.id,
            author: req.session.user._id,
        })
            .then(() => res.redirect(`/me/trash/articles?page=${page}`))
            .catch(next);
    }
    
    //[POST] /articles/handle-form-actions
    handleFormActions(req, res, next){
        const page = Math.max( 1, parseInt( req.query.page ) || 1 );
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
                                    window.location = '/me/stored/articles?page=${page}';
                                </script>
                            `);
                        }
                        res.redirect(`/me/stored/articles?page=${page}`);
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
                                    window.location = '/me/trash/articles?page=${page}'';
                                </script>
                            `);
                        }
                        res.redirect(`/me/trash/articles?page=${page}`);
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
                                    window.location = '/me/stored/articles?page=${page}';
                                </script>
                            `);
                        }
                        res.redirect(`/me/stored/articles?page=${page}`);
                    })
                    .catch(next);
                break;
            default:
                res.json({ message: 'Hành động không hợp lệ!' });
        }
    }
    
}
module.exports = new ArticleController();
