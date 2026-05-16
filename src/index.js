const path = require('path');
const express = require('express');
const morgan = require('morgan');
const methodOverride = require('method-override');
const { engine } = require('express-handlebars');
const app = express();
app.use(methodOverride('_method'));
const port = 3000;

const session = require('express-session');
const MongoStore = require('connect-mongo').default;

const SortMiddleware = require('./app/middlewares/SortMiddleware');

const router = require('./routes');
const db = require('./config/db');

// Connect to DB
db.connect();

// Static files

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Session
app.use(
    session({
        secret: 'kltn-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24, // 1 ngày
        },
        store: MongoStore.create({
            mongoUrl:'mongodb://localhost:27017/F8_news_dev',
        }),
    }),
);
app.use((req, res, next) => {

    res.locals.user =
        req.session.user;

    next();
});

// Custom middlewares
app.use(SortMiddleware);

// app.use(morgan('combined'))

// Template engine
app.engine(
    'hbs',
    engine({
        extname: '.hbs',
        helpers: {
            sum: (a, b) => a + b,
            sortable: (field, sort) => {
                const sortType = field === sort.column ? sort.type : 'default';

                const icons = {
                    default: 'bi-arrow-down-up',
                    desc: 'bi bi-sort-down',
                    asc: 'bi bi-sort-down-alt' };

                const types = {
                    default: 'desc',
                    asc: 'desc',
                    desc: 'asc' };

                const icon = icons[sortType];
                const type = types[sortType];

                return `<a href="?_sort&column=${field}&type=${type}">
                <span class="${icon}"></span></a>`;
            },
            eq: (a, b) => a === b
        }
    }),
);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'resources', 'views'));

// Routes init
router(app);

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
