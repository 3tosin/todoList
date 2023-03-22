//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Mongoose database connection
mongoose.connect("mongodb+srv://admin-faith:test123@cluster0.gfu9qa0.mongodb.net/todolistDB");


//Creating a new items Schema
const itemsSchema = {
  name: String
};

//mongoose model
const Item = mongoose.model("Item", itemsSchema);

//Item model documents
const item1 = new Item({
    name: "Hi! Welcome to your TODO list"
});

const item2 = new Item({
    name: "Hit the + to add a new item"
});

const item3 = new Item({
    name: "Hit the checkbox to delete an Item"
});

//Array of documents
const defaultItems = [item1, item2, item3];

const listSchema = {
    name:String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);



app.get("/", function(req, res) {

    Item.find({})
    .then(function(foundItems){
        if (foundItems.length === 0) {
             Item.insertMany(defaultItems)
            .then(function(){
                console.log("Successfully saved items");
            }).catch(function(error){
                console.log(error);
            });
            res.redirect("/");
        }
        else{
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
       
    }).catch(function(error){
        console.log(error);
    })



});

//creating a custom list page
app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name: customListName})
    .then((foundList)=>{
        if(!foundList){
            const list = new List({
                name: customListName,
                items: defaultItems
            });
        list.save();
        res.redirect("/" + customListName);
     } else{
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
     }
    })
    .catch((err)=>{
        console.log(err);
    });
  

   

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName

  });
  //Saving a new item into the default list
  if (listName === "Today"){
    item.save();
  res.redirect("/");
  }
  //Saving a new item into the custom list created
  else{
    List.findOne({name: listName})
    .then((foundList)=>{
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
    })
    .catch((err)=>{
        console.log(err);
    });
  }
  

});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
//Deleting an item from the default list
    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId)
        .then(function(){
         console.log("Successfully deleted an item");
         res.redirect("/");
        })
        .catch(function(err){
         console.log(error);
        });
    }
    //deleting an item from the custom list created
    else{
        List.findOneAndUpdate({name: listName})
        .then((foundList)=>{
            if (foundList) {
                foundList.items.pull({_id: checkedItemId});
                foundList.save();
                res.redirect("/" + listName);
            }
        })
        .catch((err)=>{
            console.log(err);
        });

    }

});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000" );
});
