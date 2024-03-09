const express = require('express');
const admin_route = express();
const auth = require("../middleware/adminAuth");
const adminController = require("../controllers/adminController");
const productController = require("../controllers/productController");
const categoryController = require("../controllers/categoryController");

//----------------- set view engine -----------------//
admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');


//----------------- Multer -----------------//
const multer =require('multer');
const path = require("path");

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname, '../public/product_images'));
    },
    filename:function(req,file,cb){
        const name = Date.now()+'-'+file.originalname;
        cb(null,name);
    }
});

const upload = multer({storage:storage});


//----------------- load admin login page -----------------//
admin_route.get('/',auth.isLogout,adminController.loginload);
admin_route.post('/loginpost',adminController.Loginverifying);

admin_route.use(auth.isLogin)

//----------------- Admin Dashboard -----------------//
admin_route.get('/dashboard',auth.isLogin,adminController.loadDashboard); 


//----------------- load customer page -----------------//
admin_route.get('/customers',auth.isLogin,adminController.loadCustomer);
//----------------- block and unblock customer(post) -----------------//
admin_route.post('/block-user', adminController.blockUser);


//----------------- load category page -----------------//
admin_route.get('/category',auth.isLogin, categoryController.loadCategory);

//----------------- load Addcategory page (get,post) -----------------//
admin_route.get('/category/add',auth.isLogin ,categoryController.loadAddCategory);
admin_route.post('/category/add', categoryController.addCategory);

//----------------- load Editcategory page (get,post) -----------------//
admin_route.get('/category/edit/:id', auth.isLogin,categoryController.LoadEditCategory);
admin_route.post('/category/edit/:id', categoryController.editCategory);

//-----------------  Categories  active and blocked -----------------//
admin_route.post('/category/toggle/:id', categoryController.toggleCategoryStatus);


//-----------------  load Product page  -----------------//   
admin_route.get('/products',auth.isLogin,productController.loadProducts);

admin_route.get('/products/add',auth.isLogin,productController.loadAddProducts);
admin_route.post('/products/addpost',upload.array('images',4),productController.addProduct);

admin_route.get('/products/edit/:id',productController.loadEditProduct);
admin_route.post('/products/edit/:id',productController.editProduct);

admin_route.delete('/productsdelete', productController.deleteImage);

admin_route.post('/products/toggle/:id',productController.toggleProductStatus);


admin_route.get('/logout',auth.isLogin,adminController.logout);




//----------------- export admin route -----------------//
module.exports = admin_route;