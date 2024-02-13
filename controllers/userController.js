const User = require('../models/userModel.js');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const Otp = require('../models/otpModel.js');

// Function to hash password
const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        throw new Error(error.message);
    }
};

// Function to send OTP mail
const sendOtpMail = async (name, email, otp,user_Id) => {
    try {
        // Your nodemailer configuration...
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL_USER, // Email 
                pass: process.env.EMAIL_PASSWORD //email password
            }
        });

        const mailOptions = {
            from: "wg457129@gmail.com",
            to: email,
            subject: "OTP for Signup to FurniHub",
            html: `<h3>Hello ${name}, Welcome to FurniHub</h3>
            <br><p>Enter ${otp} on the signup page to register</p>
            <br><p>This code expires after 2 minutes</p>`
        };

        const secureOTP = await securePassword(otp)
        const newUserOTP = await new Otp({
            userId: user_Id,
            otp:secureOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 120000,
        })

        await newUserOTP.save()

        const info = await transporter.sendMail(mailOptions);
        console.log("Email has been sent:", info.response);
    } catch (error) {
        console.log("Error sending OTP mail:", error.message);
        // Handle the error appropriately, maybe by returning false or rethrowing
    }
};


// Function to load home page
const loadHome = async (req, res) => {
    try {
        res.render('home');
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

//  load registration page
const loadRegister = async (req, res) => {
    try {
        res.render('register');
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

// insert user into the database
const insertUser = async (req, res) => {
    try {
        const hashedPassword = await securePassword(req.body['reg-password']);

        const user = new User({
            name: req.body['reg-name'],
            email: req.body['reg-email'],
            password: hashedPassword,
            mobile: req.body['reg-mobileno'],
            verified: false,
            is_Admin: 0,
            is_blocked: false
        });

        const userData = await user.save();

        if (userData) {
            const otp = generateOTP();
            console.log(otp);
            await sendOtpMail(req.body['reg-name'], req.body['reg-email'], otp,userData._id);
            res.redirect('/otpverification');
        } else {
            res.render('register');
        }
    } catch (error) {
        console.log("Error inserting user:", error.message);
        res.status(500).send("Internal Server Error");
    }
};
// Function to generate OTP
const generateOTP = () => {
    const digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 4; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
};

// load OTP verification page
const loadOtp = async (req, res) => {
    try {
        res.render('otp');
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};
const verifyOtp = async (req, res) => {
    try {
        const otp = req.body.otp;
        const userId = req.body.userId; 
        
        // Find the OTP record for the user from the database
        const otpRecord = await Otp.findOne({ userId: userId }).sort({ createdAt: -1 });

        if (!otpRecord) {
            // No OTP record found for the user
            console.log("No OTP record found for user:", userId);
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Check if the OTP matches
        if (otp === otpRecord.otp && Date.now() < otpRecord.expiresAt) {
            // OTP is valid and not expired
            // Update the user's verified status to true
            const user = await User.findById(userId);
            if (!user) {
                console.log("User not found:", userId);
                return res.status(400).json({ message: "Invalid user" });
            }
            user.verified = true; // Setting user.verified to true
            await user.save();
            
            // Optionally, you can delete the OTP record from the database
            await otpRecord.deleteOne();
            
            console.log("OTP verified successfully for user:", userId);
            // Redirect to login page
            return res.redirect('/login');
        } else {
            // Invalid OTP or expired
            console.log("Invalid OTP or expired for user:", userId);
            return res.status(400).json({ message: "Invalid OTP" });
        }
        
    } catch (error) {
        console.error("Error verifying OTP:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


//load login page
const loadlogin = async(req,res) => {
    try {
        res.render('login')
    } catch (error) {
        console.log(error.message);
    }
}



// Exporting functions
module.exports = {
    loadHome,
    loadRegister,
    insertUser,
    loadOtp,
    verifyOtp,
    loadlogin
};
