const User = require('../models/userModel.js');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const Otp = require('../models/otpModel.js');

//-----------------  hash password -----------------//

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
       console.log(error.message);
    }
};

//-----------------  send OTP mail -----------------//

const sendOtpMail = async (name, email, otp, user_Id) => {
    try {
        // Your nodemailer configuration...
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL_USER, // email 
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


//----------------- load home page -----------------//

const loadHome = async (req, res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        res.render('home',{userName : userName});
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

//-----------------  load registration page -----------------//

const loadRegister = async (req, res) => {
    try {
        res.render('register');
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

//----------------- insert user into the database -----------------//

const insertUser = async (req, res) => {
    try {
        const hashedPassword = await securePassword(req.body['reg-password']);

        const user = new User({
            name: req.body['reg-name'],
            email: req.body['reg-email'],
            password: hashedPassword,
            mobile: req.body['reg-mobileno'],
            verified: false,
            is_admin: 0,
            is_blocked: false
        });

        const userData = await user.save();
        req.session.user = userData; 

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


//----------------- Function to generate OTP -----------------//

const generateOTP = () => {
    const digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 4; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
};

//----------------- load OTP verification page -----------------//

const loadOtp = async (req, res) => {
    try {
        res.render('otp',{message:""});
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

//----------------- load login page -----------------//

const loadlogin = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

//----------------- OTP verification(post) -----------------//

const verifyOtp = async (req, res) => {

    try {
        const checkotp = req.body.otp;
        const a = await Otp.findOne({otp:checkotp}) 
        if(!a){
            console.log('incorect Otp')
            return  res.render('otp',{message: "incorrect OTP"});
        }
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

        // Check OTP matches and is not expired
        if (checkotp === otpRecord.otp && Date.now() < otpRecord.expiresAt) {
            // Update user's verified status to true
            const user = await User.findById(userId);
            if (!user) { 
                console.log("User not found:", userId);
                return res.render('otp',{message:"Invalied user"})
            }
            user.verified = true;
            await user.save();

            //  delete the OTP record from the database
            await otpRecord.deleteOne();

            console.log("OTP verified successfully for user:", userId);
            return res.redirect('/login');
        } else {
            console.log("Invalid OTP or expired for user:", userId);
            return res.render('otp', { message: "OTP expired or Invalid OTP, please try again" });
        }

    } catch (error) {
        console.error("Error verifying OTP:", error.message);
    }
};


const backRegister = async (req,res) => {
    try {
        await User.deleteOne({ verified: false });
        res.redirect('/register');
    } catch (error) {
        console.log(error.message);
    }
}

//----------------- verifyLogin -----------------//

const verifyLogin = async (req, res) => {
    try { 
        const email = req.body.email;
        const password = req.body.password;

        if (!email || !password) {
            return res.render('login', { message: "Email and password are required" });
        }

        const userData = await User.findOne({ email: email, is_blocked: false});
        
        if (!userData) {
            return res.render('login', { message: "Email or password  is incorrect" });
        }

        const passwordMatch = await bcrypt.compare(password, userData.password);
       
        if (!passwordMatch) {
            return res.render('login', { message: "Email or password is incorrect" });
        }

        if (!userData.verified) {
            return res.render('login', { message: "Your account is not verified " });
        }

       
        req.session.user = userData;
        req.session.save(() => {
            res.redirect('/');
        });
       

    } catch (error) {
        console.error("Error verifying login:", error.message);
        res.status(500).render('login', { message: "Internal Server Error" });
    }
};

//----------------- Resent OTP -----------------//

const resendOtp = async (req, res) => {
    try {
        const myotp = await Otp.findOne();
        console.log(myotp.userId);

        // Find the user by userId
        const user = await User.findById(myotp.userId);

        if (!user) {
            console.log('user not found');
            return res.render('otp',{message:""});
            
        }

        // Generate new OTP
        const otp = generateOTP();
        console.log(otp);

        await Otp.deleteOne();

        // Send OTP mail
        await sendOtpMail(user.name, user.email, otp, myotp.userId);

        return res.redirect('/otpverification')
    } catch (error) {
        console.error("Error resending OTP:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


const logOut = async (req,res) => {
    try {
        req.session.destroy((err) => {
            if(err){
                console.error("Error destroying session:", err);
            }
        })

        res.redirect('/')
    } catch (error) {
        console.log(error.message);
    }
};

// const loadAllProduct = async (req,res) => {
//     try {
        
//         res.render('allproducts')
//     } catch (error) {
//         console.log(error.message);
//     }
// }
 
// Exporting functions
module.exports = {
    loadHome,
    loadRegister,
    insertUser,
    loadOtp,
    verifyOtp,
    loadlogin,
    verifyLogin,
    resendOtp,
    backRegister,
    logOut
    // loadAllProduct
};
