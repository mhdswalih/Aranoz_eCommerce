const islogin = async(req,res,next) =>{
    try {
        if(req.session.user){
            next()
        }else{
            res.redirect('/login')
        }
    }catch (err) {
        console.log(err)
    }
};

const islogout = async(req,res,next) =>{
    try {
    if(!req.session.user){
        next();
    }else{
        res.redirect('/home');
    
    }
    }catch (err) {
        console.log(err)
    }
};

module.exports = {
    islogin,
    islogout,
};
