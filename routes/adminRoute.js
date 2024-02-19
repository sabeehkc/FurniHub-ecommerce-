const express = require('express');
const admin_route = express();


//----------------- set view engine -----------------//
admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

//----------------- Require adminController -----------------//
const adminController = require("../controllers/adminController");


//----------------- load admin login page -----------------//
admin_route.get('/',adminController.loginload);
admin_route.post('/loginpost',adminController.Loginverifying);


//----------------- Admin Dashboard -----------------//
admin_route.get('/dashboard',adminController.loadDashboard); 


//----------------- load customer page -----------------//
admin_route.get('/customers',adminController.loadCustomer);
//----------------- block and unblock customer(post) -----------------//
admin_route.post('/block-user', adminController.blockUser);


//----------------- load category page -----------------//
admin_route.get('/category', adminController.loadCategory);

//----------------- load Addcategory page (get,post) -----------------//
admin_route.get('/category/add', adminController.loadAddCategory);
admin_route.post('/category/add', adminController.addCategory);

//----------------- load Editcategory page (get,post) -----------------//
admin_route.get('/category/edit/:id', adminController.LoadEditCategory);
admin_route.post('/category/edit/:id', adminController.editCategory);

//----------------- Delete Categories -----------------//
admin_route.post('/category/delete/:id', adminController.deleteCategory);

//----------------- export admin route -----------------//
module.exports = admin_route;