const UserModel = require('../model/UserModel');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

// ✅ TRANSPORTER (PRODUCTION READY)
let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

// ✅ CHECK CONNECTION (IMPORTANT)
transporter.verify((err, success) => {
    if (err) {
        console.log("SMTP ERROR:", err);
    } else {
        console.log("SMTP SERVER READY");
    }
});

/* --- REGISTER --- */
exports.Register = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userExists = await UserModel.findOne({ email });
        if (userExists) {
            return res.status(400).json({ status: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await UserModel.create({
            ...req.body,
            password: hashedPassword
        });

        res.status(201).json({
            status: "User Created Successfully",
            user
        });

    } catch (error) {
        console.log("REGISTER ERROR:", error);
        res.status(500).json({ status: "Error", error: error.message });
    }
};

/* --- LOGIN (SEND OTP) --- */
exports.Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await UserModel.findOne({ email });
        if (!user) return res.status(404).json({ status: "User not registered" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ status: "Invalid email or password" });

        // ✅ GENERATE OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        // ✅ SAVE IN SESSION
        req.session.otpData = {
            userId: user._id,
            email: user.email,
            otp: otp
        };

        // ✅ MAIL OPTIONS (FIXED)
        const mailOptions = {
            from: `"BagHaven" <${process.env.EMAIL}>`,
            to: email,
            subject: "Your Login OTP",
            text: `Your OTP is ${otp}`
        };

        // ✅ SEND MAIL
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("MAIL ERROR:", error);
                return res.status(500).json({
                    status: "Mail failed",
                    error: error.message
                });
            }

            console.log("MAIL SENT:", info.response);

            res.status(200).json({
                status: "OTP sent to your email"
            });
        });

    } catch (error) {
        console.log("LOGIN ERROR:", error);
        res.status(500).json({ status: "Server Error", error: error.message });
    }
};

/* --- VERIFY OTP --- */
exports.VerifyOTP = async (req, res) => {
    try {
        const sessionData = req.session.otpData;

        if (!sessionData) {
            return res.status(400).json({ status: "Session expired" });
        }

        if (parseInt(req.body.otp) === sessionData.otp) {
            req.session.userId = sessionData.userId;
            req.session.otpData = null;

            return res.status(200).json({
                status: "OTP verified",
                userId: sessionData.userId
            });
        } else {
            return res.status(400).json({ status: "Invalid OTP" });
        }

    } catch (error) {
        console.log("VERIFY OTP ERROR:", error);
        res.status(500).json({ status: "Error", error: error.message });
    }
};

/* --- FORGET PASSWORD --- */
exports.ForgetPassword = async (req, res) => {
    try {
        const user = await UserModel.findOne({ email: req.body.email });

        if (!user) return res.status(404).json({ status: "User not found" });

        const otp = Math.floor(100000 + Math.random() * 900000);

        req.session.forgetData = {
            email: user.email,
            otp: otp,
            verified: false
        };

        const mailOptions = {
            from: `"BagHaven" <${process.env.EMAIL}>`,
            to: user.email,
            subject: "Password Reset OTP",
            text: `Your OTP is ${otp}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("FORGET MAIL ERROR:", error);
                return res.status(500).json({ status: "Mail failed" });
            }

            console.log("FORGET MAIL SENT:", info.response);

            res.status(200).json({ status: "OTP sent to your email" });
        });

    } catch (error) {
        res.status(500).json({ status: "Error", error: error.message });
    }
};

/* --- VERIFY FORGET OTP --- */
exports.VerifyForgetOTP = async (req, res) => {
    const data = req.session.forgetData;

    if (!data) return res.status(400).json({ status: "OTP not generated" });

    if (parseInt(req.body.otp) === data.otp) {
        req.session.forgetData.verified = true;
        res.status(200).json({ status: "OTP verified successfully" });
    } else {
        res.status(400).json({ status: "Invalid OTP" });
    }
};

/* --- RESET PASSWORD --- */
exports.Resetpassword = async (req, res) => {
    const data = req.session.forgetData;

    if (!data || !data.verified) {
        return res.status(400).json({ status: "OTP not verified" });
    }

    if (req.body.password !== req.body.cpassword) {
        return res.status(400).json({ status: "Passwords do not match" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    await UserModel.updateOne(
        { email: data.email },
        { password: hashedPassword }
    );

    req.session.forgetData = null;

    res.status(200).json({ status: "Password reset successfully" });
};

/* --- LOGOUT --- */
exports.Logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ status: "Logout failed" });

        res.clearCookie('connect.sid');
        res.status(200).json({ status: "Logout success" });
    });
};