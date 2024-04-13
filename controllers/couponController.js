const Coupon = require("../models/couponModel");



//----------------- load Coupon Page (admin) -----------------//

const loadCoupons = async(req,res) => {
    try {
        const coupons = await Coupon.find();
        res.render('coupon',{coupons})
    } catch (error) {
        console.log(error.message);
    }
};


//----------------- load Coupon Add Page (admin) -----------------//

const loadCouponAdd = async(req,res) => {
    try {
        res.render('couponAdd');
    } catch (error) {
        console.log(error.message);
    }
};


//----------------- Coupon Add Post (admin) -----------------//

const couponAddPost = async(req,res) => {
    try {
        const {name,couponCode,discount,minAmount,expiryDate} = req.body;

        const coupon = new Coupon({
            couponName:name,
            couponCode:couponCode,
            discountPercent:discount,
            minAmount:minAmount,
            expiryDate:expiryDate
        })
        
        await coupon.save();

        res.redirect('/admin/coupons')

    } catch (error) {
        console.log(error.message);
    }
};


//----------------- Delete Coupon -----------------//

const deleteCoupon = async(req,res) => {
    try {
        const couponId =  req.params.id;

        const coupon = await Coupon.findByIdAndDelete(couponId);

        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        return res.status(200).json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        console.log(error.message);
    }
};

//----------------- Coupon Edit Page (admin) -----------------//
const loadEditCoupon = async(req,res) => {
    try {
        const couponId = req.params.id;
        const coupon = await Coupon.findById(couponId);

        res.render('couponEdit',{coupon});

    } catch (error) {
        console.log(error.message);
    }
};

//----------------- Coupon Edit Page Post (admin) -----------------//
const editCoupon = async(req,res) => {
    try {
        const couponId = req.params.id;
        const coupon = await Coupon.findById(couponId);

        const {name,couponCode,discount,minAmount,expiryDate} = req.body;

        if(!coupon){
            console.log("Coupon not found");
        }

        coupon.couponName = name;
        coupon.couponCode = couponCode;
        coupon.discountPercent = discount;
        coupon.minAmount = minAmount;
        coupon.expiryDate = expiryDate;

        await coupon.save();

        res.redirect("/admin/coupons");

    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    loadCoupons,
    loadCouponAdd,
    couponAddPost,
    deleteCoupon,
    loadEditCoupon,
    editCoupon
}