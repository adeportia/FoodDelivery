const express = require('express');
const helmet = require('helmet')
const cors = require('cors')
const bodyParser = require('body-parser')
const session = require('express-session')
const mysql = require('mysql')
const sqlSession = require('express-mysql-session')(session)
const cookieParser = require('cookie-parser')
const app = express();
const userAgent = require('express-useragent');
const path = require('path');
const { layouts } = require('chart.js');
const multer = require('multer');
const { JSON } = require('mysql/lib/protocol/constants/types');
require('dotenv').config()
const https  = require('https');
const { error } = require('console');
const paystack = require('paystack')(`${process.env.PAYSTACK_SECRET_KEY}`)
var val;
var checker;





app.use(express.urlencoded({
   extended:true,
}));
app.use(cookieParser())

app.use(express.json())


const connection = mysql.createConnection({
    host:process.env.host,
    user:process.env.user,
    password:process.env.passwords,
    database:process.env.database,
})

connection.connect((err)=>{
if (err) {
    console.log(err)
}
else{
    console.log("connected")
}
})


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/img');
    },
    filename: function (req, file, cb) {
        cb(null,file.originalname);
    }
})

const Store = new sqlSession({
    expiration: 60*60*24*1000,
    createDatabaseTable: true,
    schema:{
        tableName:"sessiontbl",
        columnNames:{
            session_id:"session_id",
            expires:"expires",
            data:"data"
        }
    }
},connection)

app.use(session({
     secret: `Math.floor(Math.random() * 9999 + 1)Rand`,
     saveUninitialized:false,
     resave:true,
     store:Store,
     cookie:{maxAge:60*60*24*1000}
}))


app.use(express.static(path.join(__dirname,'/public')))
app.use(userAgent.express())

app.set('views',path.join(__dirname,'/Views'))
app.engine('hbs',require('express-handlebars').engine({
    extname:'hbs',
    defaultLayout: 'main.hbs',
    layoutsDir:path.join(__dirname,'/Views/Layouts')
}))

app.set('view engine','hbs')

app.get('/',(req,res)=>{
    //select all from restaurant table in database

if (req.session.email) {
    connection.query("SELECT * FROM restaurant",(err,result)=>{
        if(err) throw err;
        return res.render('IndexView',{layout:'IndexLay',show:false,restaurants:result});
    })
    
}
else{
    connection.query("SELECT * FROM restaurant",(err,result)=>{
        if(err) throw err;
        return res.render('IndexView',{layout:'IndexLay',show:true,restaurants:result});
    })
}
})

app.get("/order-food",(req,res)=>{
    if(req.session.email){
     //select all from restaurant
     connection.query("SELECT * FROM restaurant",(err,result)=>{
         if(err) throw err;
         req.session.restaurants = result;
         req.session.itemsLength  = req.session.items.length;
         return res.render('OrderView',{layout:'OrderLay',ImageUrl:req.session.ImageUrl,username:req.session.Username,restaurants:req.session.restaurants,userId:req.session.userId,itemL:req.session.itemsLength ,totalCost:req.session.totalCost})
     })
     
    }
    else{
        return res.redirect('/login-Signup')
    }
})

app.get('/fetchFood',(req,res)=>{
    let restorantId = req.query.id;
    connection.query(`SELECT * FROM food WHERE restoId='${restorantId}' `,(err,result1)=>{
        if(err) throw err;
       req.session.foods = result1;
       req.session.itemsLength  = req.session.items.length;
        return res.render('OrderView',{layout:'OrderLay',ImageUrl:req.session.ImageUrl,username:req.session.Username,foods: req.session.foods, restaurants:req.session.restaurants,userId:req.session.userId,data:req.session.items,itemL: req.session.itemsLength ,totalCost:req.session.totalCost})
    })
})


app.get('/logout',(req,res)=>{
    req.session.destroy((err)=>{
        if(err){
            console.log(err)
        }
        else{
            res.redirect('/')
        }
    })
})




app.get('/logout2',(req,res)=>{
    req.session.destroy((err)=>{
        if(err){
            console.log(err)
        }
        else{
            res.redirect('/')
        }
    })
})

app.get("/Dashboard",(req,res)=>{
    if ( req.session.authenticatedUser2 ) {
        let query = `SELECT count(*) AS restaurantCount From restaurant`;
        let query2 = `SELECT count(*) AS ordersCount From orderdetails`;
        let query3 = `SELECT count(*) AS customerCount From signup`;
        
        //connect to query1 and query2
        connection.query(query,(err,result)=>{
            connection.query(query2,(err1,result1)=>{
            connection.query(query3,(err2,result3) =>{

                if (result.length > 0 && result1.length > 0){
                    return res.render('DashboardView', {layout:'DashboardLay',countData:result1[0].ordersCount,countData2:result[0].restaurantCount,countData3:result3[0].customerCount});
                 }
                 else{
                     return res.render('DashboardView', {layout:'DashboardLay',countData:0,countData2:0,countData3:0});
                 }

            })
    
            })
        })
    }
    else{
        res.redirect('/AdminLogin')
    }
    })

app.get('/login-Signup',(req,res)=>{
 if (req.session.email) {
    res.redirect('/')
 }
 else{
    return res.render('LoginView',{layout:'LoginLay'});
 }
});


const loader = multer({
    storage: storage,
    
    fileFilter: function(req,file,cb){
        if(file.mimetype == 'image/jpeg' || file.mimetype == 'image/png'){
            cb(null,true)
        }
        else{
            cb(null,false)
        }
    }
})
app.post('/signup',loader.single('Image'),(req,res)=>{
    let fullname = req.body.fullname;
    let email = req.body.email;
    let password = req.body.password;
    let Telephone = req.body.telephone;
    let ImageName = req.file.originalname;
    let query = `Insert Into signup(Fullname,Email,Password,Telephone,Image) VALUES('${fullname}','${email}','${password}','${Telephone}','${ImageName}')`;
    connection.query(query,(err,result)=>{
        if(err){
            console.log(err)
            return res.render('LoginView', {layout:'LoginLay',color:'red',text:'Signup Error Contact the Admin on 0545818397'})
        }
        else{
            return res.render('LoginView', {layout:'LoginLay',color:'green',text:'SignUp Succesful Login now'})
        }
    })

})
app.post('/Login',(req, res)=>{
    let email = req.body.email;
    let password = req.body.password;
    let query = `SELECT * FROM signup WHERE Email='${email}' AND Password='${password}'`;
    connection.query(query,(err,result)=>{
        if(err){
            console.log(err)
            return res.render('LoginView', {layout:'LoginLay',color:'red',text:'Login Error Contact the Admin on 0545818397'})
        }
        else if(result.length == 0){
            return res.render('LoginView', {layout:'LoginLay',color:'red',text:'Invalid Email or Password'})
        }
        else{
            req.session.email = result[0].Email;
            req.session.ImageUrl = result[0].Image;
            req.session.Username = result[0].FullName;
            req.session.items = []; 
            req.session.authenticatedUser = result[0];
            req.session.userId = result[0].id
            req.session.Telephone = result[0].Telephone
            return res.redirect('/order-food');
        }
    })
})

app.get('/viewRestaurant',(req,res)=>{
    if (req.session.authenticatedUser2) {
        return res.render('RestaurantView', {layout:'RestaurantLay'})
    }
    else{
        res.redirect('/AdminLogin')
    }

 
})


app.get('/addRestaurant',(req,res)=>{
    if (req.session.authenticatedUser2) {
        
    
    return res.render('ProfileView', {layout:'ProfileLay'})
    }
    else{
        res.redirect('/AdminLogin')
    }
   })

   
app.get('/addFoods',(req,res)=>{
    if (req.session.authenticatedUser2) {
        
    
    return res.render('addFoodView', {layout:'addFoodLay'})
    }
    else{
        res.redirect('/AdminLogin')
    }
   })

   

   app.post('/commSearch',(req,res)=>{
    if (req.session.authenticatedUser2) {
        
    
    let search = req.body.resDate;
    let query = `SELECT * FROM restaurant WHERE Date(Date) ='${search}'`;
    let query2 = `SELECT count(*) AS restaurantCountOnDate From restaurant WHERE Date(Date) = '${search}'`;
    //connect to query1 and query2
    connection.query(query,(err,result)=>{
        connection.query(query2,(err,result1)=>{
         if (result.length > 0 && result1.length > 0){
            return res.render('RestaurantView', {layout:'RestaurantLay',searchResult:result,countData:result1[0].restaurantCountOnDate});
         }
         else{
             return res.render('RestaurantView', {layout:'RestaurantLay',searchResult:[],countData:0});
         }

        })
    })



    }
    else{
        res.redirect('/AdminLogin')
    }
    


   })




   app.post('/commSearchOrder',(req,res)=>{
    if (req.session.authenticatedUser2) {
        
    
    let search = req.body.resDate;
    let query = `SELECT * FROM orderdetails WHERE Date(OrderDate) ='${search}'`;
    connection.query(query,(err,result)=>{
        if(err){
            console.log(err)
        }
        else{
            
            return res.render('ViewOrdersView', {layout:'ViewOrdersLay',searchResult:result})
        }
    })
}
else{
    res.redirect('/AdminLogin')
}
   })



app.get('/viewOrders',(req,res)=>{
    if (req.session.authenticatedUser2) {
        
    
    return res.render('ViewOrdersView', {layout:'ViewOrdersLay'})
    }
    else{
        res.redirect('/AdminLogin')
    }
   })

   app.post('/addResto',loader.single('FoodSpecializedImage'),(req,res)=>{
    if (req.session.authenticatedUser2) {
        
    
    let RestaurantName = req.body.RestaurantName;
    let FoodSpecialized = req.body.FoodSpecialized;
    let Location = req.body.Location;
    let FoodSpecializedImage = req.file.originalname;
    
    let query = `INSERT INTO restaurant(RestaurantName,FoodSpecialized,Location,FoodSpecializedImage) VALUES('${RestaurantName}','${FoodSpecialized}','${Location}','${FoodSpecializedImage}')`;
    connection.query(query,(err,result)=>{
        if(err){
            console.log(err)
            return res.render('ProfileView', {layout:'ProfileLay',color:'red',text:'Error Contact the Admin on 0545818397'})
        }
        else{
            return res.render('ProfileView', {layout:'ProfileLay',color:'green',text:'Restaurant Added Succesfully'})
        }
    })
}
else{
    res.redirect('/AdminLogin')
}
   })




   app.post('/addFood',loader.single('FoodImage'),(req,res)=>{
    if (req.session.authenticatedUser2) {
        
    
    let FoodName = req.body.FoodName;
    let FoodPrice = req.body.FoodPrice;
    let RestaurantName = req.body.RestaurantName;
    let RestaurantId = req.body.RestaurantId;
    let FoodImage = req.file.originalname;
    
    let query = `INSERT INTO food(FoodName,FoodPrice,RestaurantName,FoodImage,restoId) VALUES('${FoodName}','${FoodPrice}','${RestaurantName}','${FoodImage}','${RestaurantId}')`;
    connection.query(query,(err,result)=>{
        if(err){
            console.log(err)
            return res.render('addFoodView', {layout:'addFoodLay',color:'red',text:'Error Contact the Admin on 0545818397'})
        }
        else{
            return res.render('addFoodView', {layout:'addFoodLay',color:'green',text:'Food Added Succesfully'})
        }
    })
}
else{
    res.redirect('/AdminLogin')
}
   })

var total;
 




function updateCart(req,res) {
    total = 0;
    req.session.items.forEach((cartItem) => {
        total += cartItem.price * cartItem.quantity;
    })
    req.session.itemsLength  = req.session.items.length;
     req.session.totalCost = total;
    return res.render('OrderView',{layout:'OrderLay',ImageUrl:req.session.ImageUrl,username:req.session.Username,restaurants:req.session.restaurants,userId:req.session.userId,data:req.session.items,foods: req.session.foods,itemL: req.session.itemsLength,totalCost:req.session.totalCost})
   
    
}
   app.get("/addToCart",(req,res)=>{
    var id = req.query.id;
   
    let query = `SELECT FoodName,FoodPrice  FROM food WHERE id ='${id}'`;
    connection.query(query,(err,result)=>{
        if(err){
            console.log(err)
        }
        else{
            
             
    let itemExists = false;
    req.session.items.forEach(item => {
      
     if(item.id == id){
         item.quantity = (item.quantity + 1);
         itemExists = true;
        
        
     }
    })
    if(!itemExists){
     req.session.items.push({id:id, name: result[0].FoodName, price: result[0].FoodPrice, quantity: 1});
    
    //console.log(JSON.stringify(req.session.items))
  
    
    }
    updateCart(req,res)
    

}
        
    })
   
   
   })


app.post('/ProceedToPayment',(req,res)=>{
   let locations = req.body.location;
   req.session.location = locations;
   let telephone = req.session.Telephone;
   let Username = req.session.Username;
   let orders =req.session.items;
   let totalCost =req.session.totalCost;

   if (orders.length < 1) {
    req.session.errorOrder = "Please Make Sure You have an item in Cart";
    return res.render('OrderView',{layout:'OrderLay',ImageUrl:req.session.ImageUrl,username:req.session.Username,restaurants:req.session.restaurants,userId:req.session.userId,data:req.session.items,foods: req.session.foods,itemL: req.session.itemsLength,totalCost:req.session.totalCost,errorOrder:req.session.errorOrder})
   }
   else{


//console.log(totalCost)
res.redirect('/Payments')
      //let query = `INSERT INTO orderdetails(Orders,Location,TotalCost,AmountPayed,user_id) VALUES('${JSON.stringify(items)}','${deliveryLocation}','${totalCost}','${AmountPayed}','${userId}')`;
   //connection.query(query,(err,result)=>{
       //if(err){
          // console.log(err)

      // }
       //else{
       
     //  return res.json(result)
      // }
  // })


   }


 
   
  
   
})

//decrease Quantity
app.get('/decrease',(req,res) =>{
    let id = req.query.id;

    req.session.items.forEach(item => {
      
        if(item.id == id  && item.quantity > 1){
          
           

            item.quantity = (item.quantity - 1);
        }
     
    
    else {
        req.session.items.splice(req.session.items.indexOf(item), 1);
    }

    updateCart(req,res);
           
        
       })


})



app.get('/increase',(req,res) =>{
    let id = req.query.id;

    req.session.items.forEach(item => {
      
        if(item.id == id){
          
    
        item.quantity = item.quantity + 1;
        updateCart(req,res);

   
           
        }
       })


})

app.post('/searchFood',(req,res) =>{

let search = req.body.foodName;
    let query = `SELECT * FROM food WHERE FoodName  LIKE '%${search}%'`;
    connection.query(query,(err,result)=>{
        if(err){
            console.log(err)
        }
        else{
            req.session.foods = result;
            return res.render('OrderView',{layout:'OrderLay',ImageUrl:req.session.ImageUrl,username:req.session.Username,restaurants:req.session.restaurants,userId:req.session.userId,data:req.session.items,foods: req.session.foods,itemL: req.session.itemsLength,totalCost:req.session.totalCost})
        }
    })

})
app.get('/AdminLogin',(req,res) =>{
    return res.render('DashLogView',{layout:'DashLogLay'})
})

app.post('/DashLogin',(req,res)=>{
    const{Username,Password} = req.body;
    if (Username === 'Danny' && Password === 'Danny@123') {
        req.session.authenticatedUser2 = {username:Username,password:Password};
       // console.log( process.env.pass)
        return res.redirect('/Dashboard')
    }
    else{
        return res.render('DashLogView',{layout:'DashLogLay',data:'Incorrect Username and Password'})
    }
})




//const port = process.env.Port || 5000;
app.get('/Payments',(req,res) =>{
    if (req.session.email) {
        res.render('PaymentView',{layout:'PaymentLay',data:req.session.totalCost,data2:req.session.Username,data3:req.session.email})
    }
    else{
        res.redirect('/')
    }
  
})

app.post('/AcceptPayment', (req,res) =>{
    
 const{email,amount,FullName} = req.body;
 let name = FullName;
      //here
      const callbackUrl = 'http://localhost:5000/paystack/callback'
     paystack.transaction.initialize({
        email,
        amount: amount* 100,
        name,
        callback_url: callbackUrl,
     },(error,body) =>{

        if (error) {
            console.log(error);
            return;
        }
        const authorizationUrl = body.data.authorization_url
        res.redirect(authorizationUrl)
     })
        
// Handle Paystack callback
app.get('/paystack/callback', (req, res) => {
    const reference = req.query.reference;
    let telephone = req.session.Telephone;
   let Username = req.session.Username;
   let orders =req.session.items;
   let totalCost =req.session.totalCost;
    // Verify the transaction with Paystack
    verifyTransaction(reference)
      .then((response) => {
        if (response.data.status === 'success') {
          // Redirect to homepage after successful payment
          let amount = response.data.amount;
             let amounts = amount / 100;
            let query = `INSERT INTO orderdetails(Orders,Location,TotalCost,AmountPayed,user_id,Telephone,customerName) VALUES('${global.JSON.stringify(orders)}','${req.session.location}','${totalCost}','${amounts}','${req.session.userId}','${telephone}','${  req.session.Username }')`;
   connection.query(query,(err,result)=>{
       if(err){
           console.log(err)

       }
      // else{
       
      //return res.json(result)
       //}
  })
          req.session.items = [];
          req.session.totalCost = 0
          req.session.itemsLength = 0;
          //res.redirect('/logout');
          return res.render('OrderView',{layout:'OrderLay',ImageUrl:req.session.ImageUrl,username:req.session.Username,restaurants:req.session.restaurants,userId:req.session.userId,itemL:req.session.itemsLength ,totalCost:req.session.totalCost})
        } else {
          // Handle failed payment
          res.status(400).send('Payment failed');
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error verifying transaction');
      });
  });
  
     

      

    })
 
  


//verifyPayment



/*
function verifyPayment(verifier){
   // const https = require('https')

const options = {
  hostname: 'api.paystack.co',
  port: 443,
  path: `/transaction/verify/${verifier}`,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
  }
}

https.request(options, resme => {
  let data = ''

  resme.on('data', (chunk) => {
    data += chunk
  });

  resme.on('end', () => {
    let d = global.JSON.parse(data);
    if (d) {
        clearInterval(checker)
        console.log(d)
    }
  })
}).on('error', error => {
  console.error(error)
})
  
 
}

*/



//const paystack = require('paystack-api')(process.env.PAYSTACK_SECRET_KEY);

 










app.post("/webhook", function(req, res) {
    // Validate event
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY ).update(global.JSON.stringify(req.body)).digest('hex');
    if (hash == req.headers['x-paystack-signature']) {
      // Retrieve the request's body
      const event = req.body;
      // Do something with event
      if (event && event.event === 'transfer.success') {
        return res.status(200).json({ message: 'Transfer successful' });
      }
    }
    res.send(200);
  });









// Verify transaction function
function verifyTransaction(reference) {
    const paystackSecretKey = `${process.env.PAYSTACK_SECRET_KEY}`;
    const url = `https://api.paystack.co/transaction/verify/${reference}`;
    const headers = {
      'Authorization': `Bearer ${paystackSecretKey}`,
      'Content-Type': 'application/json'
    };
  
    return fetch(url, { headers })
      .then((response) => response.json())
      .then((data) => data);
  }



  
var ports = process.env.PORT ||  5000;
app.listen(ports, () => {
    console.log(`Server started on port`);
});

//username:req.session.authenticatedUser.Username