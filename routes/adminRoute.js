const express = require("express");
const admin_route = express();
const auth = require("../middleware/adminAuth");
const adminController = require("../controllers/adminController");
const productController = require("../controllers/productController");
const categoryController = require("../controllers/categoryController");
const orderController = require("../controllers/orderController");

//----------------- set view engine -----------------//
admin_route.set("view engine", "ejs");
admin_route.set("views", "./views/admin");

//----------------- Multer -----------------//
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/product_images"));
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});

const upload = multer({ storage: storage });

//----------------- load admin login page -----------------//
admin_route.get("/", auth.isLogout, adminController.loginload);
admin_route.post("/loginpost", adminController.Loginverifying);

// admin_route.use(auth.isLogin);

//----------------- Admin Dashboard -----------------//
admin_route.get("/dashboard", adminController.loadDashboard);

//----------------- load customer page -----------------//
admin_route.get("/customers", adminController.loadCustomer);
//----------------- block and unblock customer(post) -----------------//
admin_route.post("/block-user", adminController.blockUser);

//----------------- load category page -----------------//
admin_route.get("/category", categoryController.loadCategory);

//----------------- load Addcategory page (get,post) -----------------//
admin_route.get("/category/add", categoryController.loadAddCategory);
admin_route.post("/category/add", categoryController.addCategory);

//----------------- load Editcategory page (get,post) -----------------//
admin_route.get("/category/edit/:id", categoryController.LoadEditCategory);
admin_route.post("/category/edit/:id", categoryController.editCategory);

//-----------------  Categories  active and blocked -----------------//
admin_route.post("/category/toggle/:id",categoryController.toggleCategoryStatus);

//-----------------  load Product page  -----------------//
admin_route.get("/products", productController.loadProducts);
admin_route.get("/products/add", productController.loadAddProducts);
admin_route.post("/products/addpost",upload.array("images", 4),productController.addProduct);
admin_route.get("/products/edit/:id", productController.loadEditProduct);
admin_route.post("/products/edit/:id",upload.array("images", 4),productController.editProduct);
admin_route.delete("/productsdelete", productController.deleteImage);
admin_route.post("/products/toggle/:id", productController.toggleProductStatus);
admin_route.post("/addOffer-product",productController.addOfferProduct);
admin_route.post("/products/remove-offer",productController.removeOfferProduct);

admin_route.get("/orders", orderController.loadOrdersAd);
admin_route.post("/change-product-status/:orderId/:productId",orderController.ChangeOrderStatus);


admin_route.get("/offers",adminController.loadOffers);
admin_route.get("/offers/add",adminController.loadAddOffer);
admin_route.post("/offers/addpost",adminController.addOffer);
admin_route.get("/offers/edit/:id",adminController.loadeditOffer);
admin_route.post("/offers/edit/:id",adminController.editOfferPost);
admin_route.post("/offers/delete/:id",adminController.deleteOffer);


admin_route.get("/logout", adminController.logout);

admin_route.get('*',adminController.Error404);

//----------------- export admin route -----------------//
module.exports = admin_route;
