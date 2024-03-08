const User = require('../models/userModel');

const isBlock = async (req, res, next) => {
  try {
    if (req.session && req.session.user) {
      const email = req.session.user.email;

      const user = await User.findOne({ email });

      if (!user) {
        console.log("User not found");
      }else if (user.is_blocked) {
        await req.session.destroy(); 
        res.redirect('/'); 
      } else {
        next(); 
      }
    } else {
      next(); 
    }
  } catch (error) {
    console.error("Error checking user block status:", error.message);
  }
};

module.exports = {
  isBlock,
    
}