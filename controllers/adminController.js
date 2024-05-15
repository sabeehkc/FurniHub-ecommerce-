const User = require("../models/userModel");
const Category = require("../models/categoryModel")
const bcrypt = require('bcrypt');
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const Address = require("../models/addressModel");
const Offer = require("../models/offerModal");
const jsPDF = require('jspdf');
const ExcelJS =  require('exceljs');
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
        console.log("Admin",userData);
        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password);
            console.log("checkPassword",passwordMatch);
            if(passwordMatch){
                if(userData.is_admin === 0 ){
                    res.render('login',{message:"Your not Admin"});
                }else{
                    req.session.admin_id = userData._id; //user Id assign session
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
const loadDashboard = async (req, res) => {
  try {
      const orders = await Order.find()
          .populate({
              path: 'products.product',
              model: Product
          })
          .populate({
              path: 'user',
              model: User
          })
          .populate({
              path: 'address',
              model: Address
          });

      const userCount = await User.countDocuments({ is_admin: 0 });

      let mostOrderedProduct = null;
      let mostOrderedCategory = null;
      let maxProductCount = 0;
      let maxCategoryCount = 0;

      const productCounts = new Map();
      const categoryCounts = new Map();

      orders.forEach((order) => {
          order.products.forEach((product) => {
              const productId = product.product?._id?.toString();
              if (productId) {
                  const count = productCounts.get(productId) || 0;
                  productCounts.set(productId, count + 1);
              }

              const categoryId = product.product?.category?._id?.toString();
              if (categoryId) {
                  const categoryCount = categoryCounts.get(categoryId) || 0;
                  categoryCounts.set(categoryId, categoryCount + 1);
              }
          });
      });

      productCounts.forEach((count, productId) => {
          if (count > maxProductCount) {
              maxProductCount = count;
              mostOrderedProduct = productId;
          }
      });

      categoryCounts.forEach((count, categoryId) => {
          if (count > maxCategoryCount) {
              maxCategoryCount = count;
              mostOrderedCategory = categoryId;
          }
      });

      console.log("Most Ordered Product:", mostOrderedProduct);
      console.log("Most Ordered Category:", mostOrderedCategory);

      let mostSoldProduct = null;
      let mostSoldCategory = null;

      if (mostOrderedProduct) {
          mostSoldProduct = await Product.findOne({ _id: mostOrderedProduct });
      }

      if (mostOrderedCategory) {
          mostSoldCategory = await Category.findOne({ _id: mostOrderedCategory });
      }

      res.render("dashboard", {
          orders,
          mostSoldProduct,
          mostSoldCategory,
          userCount
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
  }
};

const chartYear = async (req, res , next) => {

    try {
  
      const curntYear = new Date().getFullYear();
  
      const yearChart = await Order.aggregate([
          
        {
          
          $match: {
  
            createdAt: {
  
              $gte: new Date(`${curntYear - 5}-01-01`),
              $lte: new Date(`${curntYear}-12-31`),
  
            },
  
          },
  
        },
  
        {
          $group: {
  
            _id: { $year: "$createdAt" },
            totalAmount: { $sum: "$total" },
  
          },
  
        },
  
        {
          $sort: { _id: 1 },
        },
  
      ]);
  
      res.send({ yearChart });
  
    } catch (error) {
      next(error,req,res);
    }
  
};
  
//  Month Chart (Put Method) :-
  
const monthChart = async (req, res , next) => {
  
    try {
      
      const monthName = [
  
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
  
      const curntYear = new Date().getFullYear();
  
      const monData = await Order.aggregate([
      
        {
          $match: {
  
            createdAt: {
  
              $gte: new Date(`${curntYear}-01-01`),
              $lte: new Date(`${curntYear}-12-31`),
              
            },
  
          },
        },
  
        {
          $group: {
            _id: { $month: "$createdAt" },
            totalAmount: { $sum: "$total" },
          },
        },
  
        {
          $sort: { _id: 1 },
        },
  
      ]);
  
      const salesData = Array.from({ length: 12 }, (_, i) => {
  
        const monthData = monData.find((item) => item._id === i + 1);
  
        return monthData ? monthData.totalAmount : 0;
  
      });
  
      res.json({ months: monthName, salesData });
  
    } catch (error) {
  
      next(error,req,res);
  
    }
  
};
  

//----------------- userlist  page -----------------//
const loadCustomer = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default to page 1 
        const pageSize = 6; // Number of users per page

        // Calculate the skip value 
        const skip = (page - 1) * pageSize;

        const userData = await User.find({ is_admin: 0 }).limit(pageSize).skip(skip);

        // Count total number of users
        const totalCount = await User.countDocuments({ is_admin: 0 });

        // Calculate total number of pages
        const totalPages = Math.ceil(totalCount / pageSize);

        res.render('userlist', { 
            users: userData,
            currentPage: page,
            totalPages: totalPages
        });
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
            res.render('userlist');
            alert("user not found");
        }
        user.is_blocked = !user.is_blocked
        
        
        await user.save();

        res.json({success:true})
    } catch (error) {
        console.error(error);
    }
};

//----------------- Admin logout -----------------//

const logout = async(req,res) => {
    try {
        req.session.destroy();
        res.redirect('/admin');

    } catch (error) {
        console.log(error.message);
    }
};

//----------------- Render(404) Page -----------------//
const Error404 = async(req,res)=> {
    try {
        res.render('404')
    } catch (error) {
        console.log(error.message);
    }
}

//----------------- Load Offer (Admin side) -----------------//
const loadOffers = async(req,res) => {
    try {
        const offers = await Offer.find();
        res.render('offer',{offers})
    } catch (error) {
        console.log(error.message);
    }
};

//----------------- Load Add Offer Page -----------------//
const loadAddOffer = async(req,res) => {
    try {
        res.render('offerAdd')
    } catch (error) {
        console.log(error.message);
    }
};

//----------------- Add Offer (post) -----------------//
const addOffer = async (req,res) => {
    try {
        const {name , discount,startingDate, expiryDate} = req.body;

        const offer = new Offer({
            name:name,
            discount: discount,
            startingDate : startingDate,
            expiryDate:expiryDate
        })
        await offer.save();

        res.redirect('/admin/offers');

    } catch (error) {
        console.log(error.message);
    }
};

//-----------------  Load Edit Offer page -----------------//

const loadeditOffer = async(req,res) => {
    try {
        const offerId = req.params.id;
        const offer = await Offer.findById(offerId);

        res.render('offerEdit',{offer})
    } catch (error) {
        console.log(error.message);
    }
};

//----------------- Edit offer (post) -----------------//
const editOfferPost = async (req, res) => {
    try {
        const offerId = req.params.id;
        const { name, discount, startingDate, expiryDate } = req.body;

        const offer = await Offer.findById(offerId);

        if (!offer) {
            throw new Error("Offer not found");
        }

        offer.name = name;
        offer.discount = discount;
        offer.startingDate = startingDate;
        offer.expiryDate = expiryDate;

        await offer.save();

        const product = await Product.findOne({ offer: offer._id });

        if (product) {
            const calculatedDiscount = Math.floor(product.price - product.price * discount / 100);
            console.log(calculatedDiscount);

            product.offer = offer._id;
            product.offerPrice = calculatedDiscount;

            await product.save();
        }

        res.redirect("/admin/offers");

    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

//----------------- Delete Offer -----------------//

const deleteOffer = async(req,res) => {
    try {
        const offerId =  req.params.id;

        const offer = await Offer.findByIdAndDelete(offerId);

        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }
      
        await Product.updateMany({ offer: offer._id }, { $unset: { offer: '', offerPrice: '' } });
      
        return res.status(200).json({ message: 'Offer deleted successfully' });

    } catch (error) {
        console.log(error.message);
    }
};


const loadSalesReport = async (req, res) => {
    try {
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const filterOption = req.query.filterOption;

        // Define filter object for date range
        const createdAtFilter = {};
        if (startDate && endDate) {
            createdAtFilter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        } else if (startDate) {
            createdAtFilter.createdAt = { $gte: new Date(startDate) };
        } else if (endDate) {
            createdAtFilter.createdAt = { $lte: new Date(endDate) };
        } else if (filterOption === 'day') {
            // Handle filter option 'day'
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
            createdAtFilter.createdAt = { $gte: startOfDay, $lt: endOfDay };
        } else if (filterOption === 'week') {
            // Handle filter option 'week'
            const today = new Date();
            const firstDayOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
            const lastDayOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 7);
            createdAtFilter.createdAt = { $gte: firstDayOfWeek, $lt: lastDayOfWeek };
        } else if (filterOption === 'month') {
            // Handle filter option 'month'
            const today = new Date();
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            createdAtFilter.createdAt = { $gte: firstDayOfMonth, $lt: lastDayOfMonth };
        }

        // Add exclusion for returned and canceled products
        const orderStatusFilter = {
            'products.orderStatus': { $in: ['delivered'] }
        };

        // Combine filters
        const combinedFilter = { ...createdAtFilter, ...orderStatusFilter };

        // Fetch sales report data from the database with optional date range and status filtering
        const orders = await Order.find(combinedFilter)
            .populate({
                path: 'address',
                model: Address,
                populate: {
                    path: 'user',
                    model: User
                }
            });

        let totalOrderProductCount = 0;
        let totalOrderPrice = 0;

        for (const order of orders) {
            totalOrderProductCount += order.products.length;
            const orderPrice = order.products.reduce((acc, product) => {
                return acc + product.price;
            }, 0);
            totalOrderPrice += orderPrice;
        }

        res.render('salesReport', { orders, totalOrderProductCount, totalOrderPrice });
    } catch (error) {
        console.error("Error fetching sales report:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const generateExcel = async (req, res) => {
    try {
     
      // Fetch filtered orders from the database
      const Orders = await Order.find({"products.orderStatus": { $nin: ["returned", "cancelled"] } }).populate({
        path: 'products.product', 
        model: Product
    }).populate({
        path: 'user',
        model: User
      }).populate({
        path: 'address',
        model: Address
    })
  
      // Create a new Excel workbook
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Orders");
  
      // Add headers
      sheet.addRow([
        "Date",
        "Product",
        "Quantity",
        "Address",
        "Price",
        "Payment Status",
        "Payment Method",
        "Order Status",
      ]);
  
      // Add data rows for filtered orders
      Orders.forEach((order) => {
        sheet.addRow([
          order.createdAt,
          order.products[0].name,  
          order.products[0].quantity,
          order.address.city, 
          order.total,
          order.paymentStatus,
          order.paymentMethod, 
          order.products[0].orderStatus,
        ]);
      });
  
      // Set response headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", "attachment; filename=filtered_orders.xlsx");
  
      // Send the Excel file
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Error generating Excel:", error.message);
      res.status(500).send("Error generating Excel");
    }
};

module.exports = {
    loginload,
    Loginverifying,
    loadDashboard,
    loadCustomer,
    blockUser, 
    logout,
    Error404,
    loadOffers,
    loadAddOffer,
    addOffer,
    loadeditOffer,
    editOfferPost,
    deleteOffer,
    loadSalesReport,
    generateExcel,
    chartYear,
    monthChart

}