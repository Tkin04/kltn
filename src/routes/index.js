const newsRouter = require('./news');
const meRouter = require('./me');
const authRouter = require('./auth');
const courseRouter = require('./course');
const siteRouter = require('./site');

function route(app) {
    app.use('/news', newsRouter);
    app.use('/me', meRouter);
    app.use('/courses', courseRouter);
    app.use('/auth', authRouter);
    app.use('/', siteRouter);
}

module.exports = route;
