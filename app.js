require('dotenv').config()
const express=require("express");
const bodyParser=require("body-parser");
const mongoose= require("mongoose");
const app=express();
const  _ = require("lodash");
const bcrypt=require("bcrypt");
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(express.static("public"));

mongoose.connect(process.env.LINK);
const itemSchema = {
    name: String
};
const customListSchema ={
    name:String,
    items:[itemSchema]
};
const userSchema={
    username: String,
    password: String,
    nameOfUser: String,
    emailOfUser: String,
    userAllLists:  [customListSchema],
};
const Item=mongoose.model("Item",itemSchema);
const AllList=mongoose.model("AllList",customListSchema);
const User=mongoose.model("User",userSchema);
var correctlogin=true;
var rednotif="hide"
var correctexsists=true;
var rednotif1="hide";


app.get("/",function(req,res){
    
    if(correctlogin===false)
    rednotif='';
    else
    rednotif="hide";

    res.render("login",{
        LoginSignup: "Login",
        Greeting: "Welcome Back !",
        AccExist: "Create new Account",
        loginCred1: "Name",
        loginCred2: 'Email',
        loginCred3: 'Username',
        loginCred4: "Password",
        hide:"hide",
        hidewrongness:rednotif,
        hideAlreadyExsists:'hide'
    });
})


app.post("/signup",function(req,res){
    // console.log(req.body);
    if(req.body.logsign=="Login")
    {
        if(correctexsists===false)
        rednotif1=''
        res.redirect("/signup");
    }
    else
    {
        res.redirect("/")
    }
    
});
app.get("/signup",function(req,res){
    if(correctexsists===false)
    rednotif1=''
    else
    rednotif="hide";

    res.render("login",{
        LoginSignup: "Sign Up",
        Greeting: "Let's Sign You Up !",
        AccExist: "Already Have an account ?",
        loginCred1: "Name",
        loginCred2: 'Email',
        loginCred3: 'Username',
        loginCred4: "Password",
        hide:'',
        hidewrongness:'hide',
        hideAlreadyExsists:rednotif1
    });
});
app.get("/redirectpage",function(req,res){
    res.render("redirect")
})

app.get("/:user",function(req,res){
    const userId=req.params.user
    User.findOne({username:userId},function(err,userdata){
        if(!err)
        {
            if(userdata)
            {
              
                res.render("userHomePage",{
                    name_of_user:userdata.nameOfUser.split(" ")[0],
                    userid:userId,
                    listarr:userdata.userAllLists
                });
            }
            else
            res.redirect("/");
        }
    })
});

app.post("/:user/list",function(req,res){
    User.findOne({username: req.params.user},function(err,userdoc){
        if(!err)
        {
            if(!userdoc)
            res.redirect("/");
            else
            {
                if(req.body.newList=='')
                {
                    res.redirect("/"+req.params.user);
                }
                else
                {
                    var found=false;
                    var arr=userdoc.userAllLists
                    for(var i=0;i<arr.length;i++)
                    {
                        if(arr[i].name===_.startCase(req.body.newList))
                        {
                            found=true;
                            break;
                        }
                    }
                    if(!found){
                        const userListItem= new AllList({
                            name:_.startCase(req.body.newList)
                        });
                        userdoc.userAllLists.push(userListItem);
                        userdoc.save();
                        res.redirect("/"+req.params.user);
                        // res.redirect("/"+req.params.user);
                    }
                    else
                    {
                        res.redirect("/"+req.params.user);
                    }
                }
                // console.log(userdoc);
            }
        }
        
    })
    console.log(req.params.user)
})

app.post("/login",function(req,res){
    let userId=req.body.username;
    let pass=req.body.password;
    let user_name=_.startCase(req.body.nameOfUser);
    let user_email=req.body.emailOfUser;
    if(user_name=='')
    user_name=userId;
    
    if(req.body.logsign==="Login")
    {
        User.findOne({username:userId},async (err,userdata)=>{
            if(!err)
            {
                if(!userdata)
                {
                    correctlogin=false;
                    console.log("Not Found");
                    res.redirect("/");
                }
                else
                {
                    const getpass= await bcrypt.compare(pass,userdata.password);
                    if(getpass)
                    {
                        correctlogin=true;
                        console.log("Found");
                        res.redirect("/"+userId);
                    }
                    else
                    {
                        correctlogin=false;
                        res.redirect("/");
                        console.log("Wrong Password");
                    }
                    
                }
            }
        });
    }
    else
    {
        User.findOne({username:userId},async (err,userdata)=>{
            if(!err)
            {
                if(userdata)
                {
                    correctexsists=false;
                    console.log("Already Exsists");
                    res.redirect("/signup");
                }
                else
                {
                    correctexsists=true;
                    correctlogin=true;
                    const hashpass=await bcrypt.hash(pass,10);
                    const user= new User({
                        username: userId,
                        password: hashpass,
                        nameOfUser: user_name,
                        emailOfUser: user_email
                    });
                    user.save();
                    res.redirect("/redirectpage");
                }
            }
        })
    }
    
});


app.get("/:user/:listName",function(req,res){
    User.findOne({username:req.params.user},function(err,userdata){
        if(!err)
        {
            if(!userdata)
            res.redirect("/");
            else
            {
                var found=false;
                var index=0;
                let arr=userdata.userAllLists;
                for(var i=0;i<arr.length;i++)
                {
                    if(arr[i].name===req.params.listName)
                    {
                        found=true;
                        index=i;
                        break;
                    }
                }
                if(found)
                {
                    res.render("list",{
                        ListTitle:req.params.listName,
                        userid:req.params.user,
                        ListItems:userdata.userAllLists[i].items
                    })
                }
                else
                res.redirect("/"+req.params.user)
            }
        }
    })
    
});
app.post("/:user/logout",function(req,res){
    res.redirect("/");
})
app.post("/:user/deleteItem",function(req,res){
    User.findOne({username:req.params.user},function(err,userdoc){
        if(!err){
            if(!userdoc)
            res.redirect("/");
            else
            {
                var arr1=userdoc.userAllLists;
                var idx=0;
                for(var i=0;i<arr1.length;i++)
                {
                    if(arr1[i].name===req.body.listname)
                    {
                        idx=i;
                        break;
                    }
                }
                var index=0;
                var arr2=userdoc.userAllLists[idx].items;
                for(var j=0;j<arr2.length;j++)
                {
                    if(arr2[j]._id== req.body.checkbox)
                    {
                        index=j;
                        break;
                    }
                }
                // console.log(arr2);
                // console.log(index);
                
                userdoc.userAllLists[idx].items.splice(index,1);
                userdoc.save();
                res.redirect("/"+req.params.user+"/"+req.body.listname)
            }
            
        }
        
    });

})
app.post("/:user/:listName/addItem",function(req,res){
    const todoitem=_.startCase(req.body.toDoItem);
    const item= new Item({
        name:todoitem
    });
    User.findOne({username:req.params.user},function(err,userdata){
        if(!err)
        {
            if(!userdata)
            res.redirect("/")
            else{
                var index=0;
                var arr=userdata.userAllLists;
                for(var i=0;i<arr.length;i++)
                {
                    if(arr[i].name===req.params.listName)
                    {
                        index=i;
                        break;
                    }
                }
                if(todoitem!=''){
                    userdata.userAllLists[index].items.push(item);
                    userdata.save();
                    res.redirect("/"+req.params.user+"/"+req.params.listName)
                }
                else
                res.redirect("/"+req.params.user+"/"+req.params.listName);
                // console.log(userdata);
            }
            
        }
        
    });
    
});

app.post("/:user/redirectionFromList/:listtitle",function(req,res){
    
    if(req.body.redirectionfromlist==="delList")
    {
        User.findOne({username:req.params.user},function(err,userdata){
            if(!err)
            {
                if(!userdata)
                res.redirect("/");
                else{
                    // console.log(userdata);
                    var temparr=userdata.userAllLists;
                    var idx=0;
                    for(var i=0;i<temparr.length;i++)
                    {
                        if(temparr[i].name===req.params.listtitle)
                        {
                            idx=i;
                            break;
                        }
                    }
                    userdata.userAllLists.splice(idx,1);
                    userdata.save();
                }
            }
        })
    }
    res.redirect("/"+req.params.user);
})

app.listen(process.env.PORT || 3000,function(){
    console.log("Server Started Successfully...");
});