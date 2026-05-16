module.exports = function (
    roles
) {

    return function (
        req,
        res,
        next
    ) {

        const user =
            req.session.user;

        if (!user) {
            return res.redirect(
                '/auth/login'
            );
        }

        if (
            !roles.includes(
                user.role
            )
        ) {
            return res.status(403)
            .send(
                'Bạn không có quyền truy cập'
            );
        }

        next();
    };
};  