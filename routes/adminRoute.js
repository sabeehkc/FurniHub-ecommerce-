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

admin_route.post('/block-user', adminController.blockUser);



//----------------- export admin route -----------------//
module.exports = admin_route;