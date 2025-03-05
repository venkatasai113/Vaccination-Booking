require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
// const _ = require('lodash');


// console.log(process.env.API_KEY);

app.set('view engine', 'ejs');

app.use(express.static("public"));


app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
    withCredentials: true 
}));


app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({extended: true}));


mongoose.connect("mongodb+srv://dineshbankuru2004:"+process.env.MONGO+"@cluster0.f7z8mvo.mongodb.net/covid" , {useNewUrlParser : true});




const UserSchema = new mongoose.Schema({
    name:String,
    username: String,
    password: String
});
  
UserSchema.plugin(passportLocalMongoose);
  
const User = mongoose.model("User" , UserSchema);
  
  
passport.use(User.createStrategy());
  
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




const AdminSchema = new mongoose.Schema({
    username: String,
    password: String
});
  
AdminSchema.plugin(passportLocalMongoose);
  
const Admin = mongoose.model("Admin" , AdminSchema);
  
  
passport.use(Admin.createStrategy());
  
passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());





const CentreSchema = new mongoose.Schema({
    name:String,
    code: String
});

const Centre = mongoose.model("Centre" , CentreSchema);


const SlotSchema = new mongoose.Schema({
    date:String,
    booking:[{name: String, code: String}]
});

const Slot = mongoose.model("Slot" , SlotSchema);


var mes="";
var adminadd="";
var admindel="";


app.get("/",function(req,res){
    res.render("home");
});

app.get("/contact",function(req,res){
    res.render("contact" ,{mes:mes});
    mes="";
});

app.get("/adminlogin",function(req,res){
    res.render("adminlogin");
});

app.get("/adminhome",function(req,res){
    res.render("adminhome");
});

// app.get("/adminregister",function(req,res){
//     res.render("adminregister");
// });



app.get("/userslots" , function(req,res){
    if(req.isAuthenticated("userlocal"))
    {
        Centre.find({}).then(function(data)
        {
            res.render("userslots" , {user:req.user, a:data});   
        });
    }
    else
    {
        res.redirect("/contact");
    }
});



// app.get("/adminpage" , function(req,res){
//     if(req.isAuthenticated("adminlocal"))
//     {
//         res.render("adminpage" , {adminadd:adminadd , admindel:admindel});
//         adminadd="";
//         admindel="";
//     }
//     else
//     {
//         adminadd="";
//         admindel="";
//         res.redirect("/adminlogin");
//     }
// });






app.get("/userslots/:code" , function(req,res)
{
    // res.render("bookslot");
    
    if(req.isAuthenticated())
    {
       
        //console.log(dateStr);
        Centre.find({}).then(function(data)
        {
            res.render("bookslot" , {a:data , b:req.params.code });   
        });
    }
    else
    {
        //console.log("Here");
        res.redirect("/contact");
    }
    
})



// app.get('/logout', function(req, res){
//     req.logout();
//     res.redirect('/');
// });


// app.get("/adminreg" , function(req,res){
//     res.render("adminreg");
// })



// app.post("/adminregister", function(req,res){
    
//     Admin.register({username: req.body.username} , req.body.password).then(function(user){
//         passport.authenticate("adminlocal")(req,res,function(){
//             res.redirect("/adminpage");
//         })
//     })
//     .catch(function(err){
//         console.log(err);
//         res.redirect("/adminregister");
//     })

// });

let printpage ={name : "" ,Address: "" , City: "" , PinCode: "" , Date: "" , Centre: ""};

app.post("/slotdetails" , function(req,res){
    printpage.name=req.body.name;
    printpage.Address=req.body.address;
    printpage.City=req.body.city;
    printpage.PinCode=req.body.pincode;
    printpage.Date=req.body.date;
    printpage.Centre=req.body.centre;
    const abc = {name: req.body.name , code: req.body.centre};
    Slot.findOne({date: req.body.date}).then(function(foundSlot){
        if(!foundSlot)
        {
            const slot = new Slot({
                date: req.body.date,
                booking:[{name: req.body.name , code: req.body.centre}]
            });
            slot.save().then(function(doc){
                //console.log(doc);
            })
            .catch(function(err){
                console.log(err);
            })
        }
        else
        {
            foundSlot.booking.push(abc);
            foundSlot.save();
        }
    })
    .catch(function(err)
    {
        console.log(err);
        //console.log("Down");
    })

    res.render("printpage" , {printpage:printpage});

})



app.post("/userregister", function(req,res){
    //console.log(req.body.name);
    //console.log(req.body.email);
    User.register(({username: req.body.email}) , req.body.password).then(function(user){
        passport.authenticate("userlocal")(req,res,function(){
            res.redirect("/userslots");
            // Centre.find({}).then(function(data)
            // {
            //     res.render("userslots" , {a:data});   
            // });
        })
    })
    .catch(function(err){
        //console.log(err);
        res.redirect("/contact");
    })

});





app.post("/userlogin" , function(req,res){
    const user = new User({
        username: req.body.email,
        password: req.body.password
    });
    // console.log(user.username);
    // console.log(user.password);
    req.login(user , function(err){
        if(err)
        {
            //console.log(err);
            mes="!! Invalid credentials";
            res.redirect("/contact");
        }
        else
        {
            passport.authenticate("userlocal")(req,res,function(){
                res.redirect("/userslots");
                // res.render("userslots" , {a:centres});
                // Centre.find({}).then(function(data)
                // {
                //     res.render("userslots" , {user:req.user, a:data});   
                // });
            });
        }
    });
});



app.post("/adminlogin" , function(req,res){
    const user = new Admin({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user , function(err){
        if(err)
        {
            console.log(err);
        }
        else{
            passport.authenticate("adminlocal")(req,res,function(){
                res.render("adminpage" , {adminadd:adminadd , admindel:admindel});
                adminadd="";
                admindel="";
            })
        }
    })
});


app.post("/addcenter",function(req,res){
    Centre.findOne({code: req.body.code}).then(function(foundCentre){
        if(!foundCentre)
        {
            Centre.create({name:req.body.name , code:req.body.code});
            res.send('Inserted');
        }
        else
        {
            adminadd="!! Center with same code exists."
            res.render("adminpage" , {adminadd:adminadd , admindel:admindel});
            adminadd="";
        }
    })
    .catch(function(err){
        //console.log(err);
    })
})


app.post("/removecenter",function(req,res){
    Centre.findOne({code: req.body.code}).then(function(foundCentre){
        if(foundCentre)
        {
            Centre.deleteOne({code:req.body.code}).then(function(){
                res.send('Deleted');
            });
        }
        else
        {
            admindel="!! Centre doesn't exists."
            res.render("adminpage" , {adminadd:adminadd , admindel:admindel});
            admindel="";
        }
    })
    .catch(function(err){
        //console.log(err);
    })
})




app.post("/search" , function(req,res){
    
        let input = req.body.search;
        //console.log(input);
        Centre.find({code: input}).then(function(data)
        {
            res.render("userslots" , {a:data});  
        });
    
})

const port = process.env.PORT || 300;

app.listen(port, function() {
    console.log("Server started on port 3000");
});
  
