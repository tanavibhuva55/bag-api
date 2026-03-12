const UserModel = require('../model/UserModel');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

// Nodemailer Setup
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'jankisutariya14@gmail.com',
        pass: 'xjwp aqym gwzb lsle' 
    }
});

/* --- REGISTER --- */
exports.Register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        const userExists = await UserModel.findOne({ email });
        if (userExists) {
            return res.status(400).json({ status: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const data = await UserModel.create({
            ...req.body,
            password: hashedPassword
        });

        res.status(201).json({
            status: "User Created Successfully",
            data
        });
    } catch (error) {
        res.status(500).json({ status: "Error", error: error.message });
    }
};

/* --- LOGIN (Sends OTP) --- */
exports.Login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ status: "User not registered" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ status: "Check your email and password" });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        // Store in SESSION (Not in node-persist)
        req.session.otpData = { 
            userId: user._id, 
            otp: otp, 
            email: email,
            type: 'login' 
        };

        let mailOptions = {
            from: 'jankisutariya14@gmail.com',
            to: email,
            subject: 'Your Login OTP',
            text: `Your Login OTP is ${otp}`
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) return res.status(500).json({ status: "Mail failed", error });
            res.status(200).json({ status: "Login Success. OTP sent to your email" });
        });

    } catch (error) {
        res.status(500).json({ status: "Server Error", error: error.message });
    }
};

/* --- VERIFY OTP --- */
exports.VerifyOTP = async (req, res) => {
    const sessionData = req.session.otpData;

    if (!sessionData || sessionData.type !== 'login') {
        return res.status(400).json({ status: "No OTP request found" });
    }

    if (parseInt(req.body.otp) === sessionData.otp) {
        const userId = sessionData.userId;
        req.session.userId = userId; // User logged in
        req.session.otpData = null; // Clear OTP data

        res.status(200).json({
            status: "OTP verified successfully",
            userId: userId
        });
    } else {
        res.status(400).json({ status: "Invalid OTP" });
    }
};

/* --- FORGET PASSWORD --- */
exports.ForgetPassword = async (req, res) => {
    const user = await UserModel.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ status: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000);
    
    // Store in Session
    req.session.forgetData = { email: user.email, otp: otp, verified: false };

    let mailOptions = {
        from: 'jankisutariya14@gmail.com',
        to: user.email,
        subject: 'Forgot Password OTP',
        text: `Your OTP is ${otp}`
    };

    transporter.sendMail(mailOptions, (error) => {
        if (error) return res.status(500).json({ status: "Error sending mail" });
        res.status(200).json({ status: "OTP sent to your email" });
    });
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
    await UserModel.updateOne({ email: data.email }, { password: hashedPassword });

    req.session.forgetData = null; // Clear session
    res.status(200).json({ status: "Password reset successfully" });
};

/* --- LOGOUT --- */
exports.Logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ status: "Logout failed" });
        res.clearCookie('connect.sid'); // Session cookie delete karein
        res.status(200).json({ status: "Logout Success" });
    });
};