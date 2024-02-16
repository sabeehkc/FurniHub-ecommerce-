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
       console.log(error.message);
    }
};

// Function to send OTP mail
const sendOtpMail = async (name, email, otp, user_Id) => {
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

        // const secureOTP = await securePassword(otp);
        const newUserOTP = new Otp({
            userId: user_Id,
            otp: otp,
            createdAt: Date.now(),
            expiresAt: Date.now() + 120000, //expire after 2 minute
        });

        

        await newUserOTP.save();

        const info = await transporter.sendMail(mailOptions);
        console.log("Email has been sent:", info.response);
    } catch (error) {
        console.log("Error sending OTP mail:", error.message);
        throw new Error("Failed to send OTP");
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
            await sendOtpMail(req.body['reg-name'], req.body['reg-email'], otp, userData._id);
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
        res.render('otp',{message:""});
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

//load login page
const loadlogin = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

//OTP verification
const verifyOtp = async (req, res) => {
    try {
        const checkotp = req.body.otp;
        const a = await Otp.findOne({otp:checkotp})
        const userId = a.userId
        
        // Check if userId and otp are present
        if (!userId || !checkotp) {
            console.log("Missing userId or otp in request body");
            return res.render('otp', { message: "Please Enter OTP" });
        }

        // Find the OTP record for the user
        const otpRecord = await Otp.findOne({ userId: userId }).sort({ createdAt: -1 });

        if (!otpRecord) {
            console.log("No OTP record found for user:", userId);
            return res.render('otp', { message: "Invalid OTP, please try again" });
        }

        // Check if the OTP matches and is not expired
        if (checkotp === otpRecord.otp && Date.now() < otpRecord.expiresAt) {
            // Update user's verified status to true
            const user = await User.findById(userId);
            if (!user) {
                console.log("User not found:", userId);
                return res.status(400).json({ message: "Invalid user" });
            }
            user.verified = true;
            await user.save();

            // Optionally, delete the OTP record from the database
            await otpRecord.deleteOne();

            console.log("OTP verified successfully for user:", userId);
            return res.redirect('/login');
        } else {
            console.log("Invalid OTP or expired for user:", userId);
            return res.render('login', { message: "OTP expired or Invalid OTP, please try again" });
        }

    } catch (error) {
        console.error("Error verifying OTP:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// verifyLogin 
const verifyLogin = async (req, res) => {
    try { 
        const email = req.body.email;
        const password = req.body.password;

        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).render('login', { message: "Email and password are required" });
        }

        // Find the user by email
        const userData = await User.findOne({ email: email, is_blocked: false});
        // console.log(userData);

        // If user not found, render login page with error message
        if (!userData) {
            return res.status(400).render('login', { message: "Email or password  is incorrect" });
        }

        // Compare the password provided with the hashed password in the database
        const passwordMatch = await bcrypt.compare(password, userData.password);
        // console.log(password);
        // console.log(passwordMatch);
        
        // If passwords don't match, render login page with error message
        if (!passwordMatch) {
            return res.status(400).render('login', { message: "Email or password is incorrect" });
        }

        // If user is not verified, render login page with error message
        if (!userData.verified) {
            return res.status(400).render('login', { message: "Your account is not verified" });
        }

        // Redirect user to the home page upon successful login
        res.redirect('/');

    } catch (error) {
        console.error("Error verifying login:", error.message);
        res.status(500).render('login', { message: "Internal Server Error" });
    }
};

// go back to register page
const goback = async(req,res) => {
    try {
        await Otp.deleteMany({userId:req.session.userId});
    // Destroy the session
   
    if(User.find({userId:req.session.userId,is_verified:false})) 
    {
      await User.deleteOne({ _id: req.session.userId});
    }
        // Redirect the user to the register page
        res.redirect('/register');
        
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
    loadlogin,
    verifyLogin,
    goback
};
