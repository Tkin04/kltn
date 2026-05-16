const bcrypt = require('bcryptjs');
const User = require('../models/User');

class AuthController {

    // GET
    loginPage(req, res) {
        res.render('auth/login');
    }

    registerPage(req, res) {
        res.render('auth/register');
    }

    // POST REGISTER
    async register(req, res) {

        try {

            const {
                username,
                email,
                password,
            } = req.body;

            // check username
            const existingUsername =
                await User.findOne({
                    username
                });

            if (
                existingUsername
            ) {
                return res.send(
                    'Tên người dùng đã tồn tại'
                );
            }

            // check email
            const existingEmail =
                await User.findOne({
                    email
                });

            if (
                existingEmail
            ) {
                return res.send(
                    'Email đã tồn tại'
                );
            }

            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );

            const user =
                new User({
                    username,
                    email,
                    password:
                        hashedPassword,
                });

            await user.save();

            res.redirect(
                '/auth/login'
            );

        } catch (error) {

            console.log(error);

            res.send(
                'Register failed'
            );
        }
    }

    // POST LOGIN
    async login(req, res) {
        try {

            const {
                email,
                password,
            } = req.body;

            const user =
                await User.findOne({
                    email,
                });

            if (!user) {
                return res.send(
                    'Sai email'
                );
            }

            const isMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if (!isMatch) {
                return res.send(
                    'Sai mật khẩu'
                );
            }

            // save session
            req.session.user = {
                _id: user._id,
                username:
                    user.username,
                role: user.role,
            };

            res.redirect('/');

        } catch (error) {
            console.log(error);
            res.send(
                'Login failed'
            );
        }
    }

    // LOGOUT
    logout(req, res) {

        req.session.destroy(
            (err) => {

                if (err) {
                    return res.send(
                        'Logout failed'
                    );
                }

                res.clearCookie(
                    'connect.sid'
                );

                res.redirect(
                    '/auth/login'
                );
            }
        );
    }
}

module.exports =
new AuthController();