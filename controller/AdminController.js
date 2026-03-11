const UserModel = require('../model/UserModel');
const OrderModel = require('../model/OrderModel');

const ADMIN_EMAIL = "admin@baghaven.com";
const ADMIN_PASSWORD = "admin123";

exports.adminLogin = (req, res) => {

    const { email, password } = req.body;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {

        req.session.isAdmin = true;

        res.json({
            message: "Admin login successful"
        });

    } else {

        res.status(401).json({
            message: "Invalid admin credentials"
        });
    }
};


exports.adminLogout = (req, res) => {

    req.session.destroy();

    res.json({
        message: "Admin logout successful"
    });

};

/* GET ALL USERS (ADMIN) */
exports.getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.find();
        res.status(200).json({
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching users",
            error: error.message
        });
    }
};

/* GET ALL ORDERS (ADMIN) */
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await OrderModel.find()
            .populate('userId', 'name email address city')
            .populate('items.productId');

        res.status(200).json({
            count: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching orders",
            error: error.message
        });
    }
};