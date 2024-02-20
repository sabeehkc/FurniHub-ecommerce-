const User = require("../models/userModel");
const Category = require("../models/categoryModel")
const bcrypt = require('bcrypt');

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
       console.log(error.message);
    }
};
 
//----------------- Admin login page -----------------//

const loginload = async(req,res) => {
    try {
        res.render('login',{message:""})
    } catch (error) {
        console.log(error.message);
    }
};

//----------------- verify admin email and password -----------------//

const Loginverifying = async(req,res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
    
        
        const userData = await User.findOne({email:email});
        console.log(userData);
        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password);
            console.log(passwordMatch);
            if(passwordMatch){
                if(userData.is_admin === 0 ){
                    res.render('login',{message:"Your not Admin"});
                }else{
                    req.session.user_id = userData._id; //user Id assign session
                    res.redirect('/admin/dashboard');
                }
            }else{
                res.render('login',{message:"Email or Password is incorrect"});
            }
        }else{
            res.render('login',{message:"Email or Password is incorrect"});
        }
    } catch (error) {
        console.log(error.message);
    }
};

//----------------- Admin load Dashboard -----------------//

const loadDashboard = async(req,res) => {
    try {
        res.render('dashboard');
    } catch (error) {
        console.log(error.message);
    }
};

//----------------- userlist  page -----------------//

const loadCustomer = async(req,res) => {
    try {
        const userData = await User.find({is_admin:0});
        res.render('userlist',{users:userData})
    } catch (error) {
        console.log(error.message);
    }
};


//-----------------  block and unblock user -----------------//

const blockUser = async (req, res) => {
    try {
        const { email } = req.body;
        console.log(email);

        const user = await User.findOne({ email });
        console.log(user);
        if (!user) {
            return res.render('userlist');
        }
        if(user.is_blocked == false){
            user.is_blocked = true
            console.log('user blocked successfully');
        }else if(user.is_blocked == true){
            user.is_blocked = false
            console.log('user unblocked successfully');
        }
        
        await user.save();

        res.json({success:true})
    } catch (error) {
        console.error(error);
    }
};

//-----------------  load category page -----------------//

const loadCategory = async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('category', { categories });
    } catch (error) {
        console.log(error.message);
    }
};

//-----------------  load Addcategory page -----------------//

const loadAddCategory = async (req, res) => {
    try {
        res.render('addcategory');
    } catch (error) {
        console.log(error.message);
    }
};


//-----------------  Addcategory (post) -----------------//

const addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        const category = new Category({ name, description }); 

        await category.save();

        res.redirect('/admin/category');
    } catch (error) {
        console.log(error.message);
    }
};

//----------------- Load EditCategory page -----------------//

const LoadEditCategory = async (req, res) => { 
    try {
        const id = req.params.id;
        
        const catData = await Category.findById(id); 
        
        if(catData) {
            res.render('editcategory',{category:catData});
        } else {
            res.redirect('/admin/category');
        }
    } catch (error) {
        console.log(error.message);
    }
}


//-----------------  EditCategory (post) -----------------//

const editCategory = async (req, res) => {
    try {
        const categoryId = req.params.id; 
        const { name, description } = req.body;

    
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).send('Category not found');
        }

        category.name = name;
        category.description = description;

        await category.save();

        res.redirect('/admin/category');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};


//-----------------  Delete category -----------------//

const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;

        
        await Category.findByIdAndDelete(categoryId);

        res.redirect('/admin/category');
    } catch (error) {
        console.log(error.message);
       
    }
};


const loadProducts = async(req,res) => {
    try {
        res.render('product');
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    loginload,
    Loginverifying,
    loadDashboard,
    loadCustomer,
    blockUser, 
    loadCategory,
    loadAddCategory,
    addCategory,
    LoadEditCategory,
    editCategory,
    deleteCategory,
    loadProducts

}