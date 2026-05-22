const meRouter = require('./me');
const authRouter = require('./auth');
const articleRouter = require('./article');
const siteRouter = require('./site');

function route(app) {
    app.use('/me', meRouter);
    app.use('/articles', articleRouter);
    app.use('/auth', authRouter);
    app.use('/', siteRouter);
}

module.exports = route;
