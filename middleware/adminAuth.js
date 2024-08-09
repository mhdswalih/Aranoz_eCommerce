const adlogin = async (req,res,next) => {
 try {
    if(req.session.admin){
        next();
    }else{
        res.redirect('/admin/login');
    }
 } catch (error) {
    console.log(error)
 }
};

const adlogout = async (req,res,next) => {
    try {
        if(!req.session.admin){
            next();
        }else{
            res.redirect('/admin/home');
        }
    } catch (error) {
        console.log(error)
        
    }
}
module.exports = {
    adlogin,
    adlogout,
};