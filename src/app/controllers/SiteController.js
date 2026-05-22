const Article = require('../models/Article');
const { multipleMongooseToObject,} = require('../../util/mongoose');

class SiteController {
    // [GET] /
    async index(req, res, next) {
        try {
            const search = req.query.search || '';
            const category = req.query.category || '';
            const query = { status: 'published', };

            // SEARCH
            if (search) {
                query.name = {
                    $regex: search,
                    $options: 'i',
                };
            }

            // CATEGORY
            if (category) {
                query.category = category;
            }

            const articles = await Article.find(query);

            const topViewedArticles = await Article.find({ status: 'published', })
                .sort({ views: -1 })
                .limit(3);

            // HERO CONTENT
            const categoryMap = {
                transfer: 'Tin chuyển nhượng',
                'premier-league': 'Ngoại hạng Anh',
                'champions-league': 'Champions League',
                laliga: 'La Liga',
                'serie-a': 'Serie A',
                bundesliga: 'Bundesliga',
                general: 'Tin tức chung',
            };

            let heroTitle =
                'Cập nhật tin tức bóng đá nhanh nhất';

            let heroDescription =
                'Tin tức nóng hổi, chuyển nhượng và diễn biến mới nhất từ thế giới bóng đá.';

            // SEARCH ưu tiên cao nhất
            if (search) {
                heroTitle =
                    `Kết quả tìm kiếm: ${search}`;
                heroDescription =
                    `Các bài viết liên quan đến "${search}"`;
            }

            // CATEGORY
            else if (category) {
                heroTitle = categoryMap[category]|| 'Tin tức bóng đá';
                heroDescription =`Khám phá các bài viết thuộc chuyên mục ${heroTitle}`;
            }

            res.render( 'home', {
                articles: multipleMongooseToObject(articles),
                topViewedArticles: multipleMongooseToObject(topViewedArticles),
                search,
                category,
                heroTitle,
                heroDescription,
                title: search
                        ? `Tìm kiếm: ${search}`
                        : category
                        ? categoryMap[category]
                            || 'Tin tức bóng đá'
                        : 'Trang chủ',
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SiteController();