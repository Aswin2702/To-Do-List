//jshint esversion:6

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

var mongoose = require("mongoose");

var items = [];

//Set up mongoose connection
var mongoDB = process.env.MONGO_URI;
console.log(process.env.MONGO_URI);
mongoose.connect(mongoDB, { useNewUrlParser: true });

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("item", itemsSchema);

const item1s = [
  new Item({
    name: "Welcome to your do List.",
  }),
  new Item({
    name: "Hit + button to add new item.",
  }),
  new Item({
    name: "<-- Hit this to delete an item.",
  }),
];

const listSchema = {
  name: String,
  item: [itemsSchema],
};

const List = mongoose.model("list", listSchema);

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  Item.find()
    .then((foundItems) => {
      if (foundItems.length === 0) {
        Item.insertMany(item1s)
          .then(() => {
            console.log("Sucess");
            res.redirect("/");
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        res.render("list", { listTitle: "Today", newItem: foundItems });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/", function (req, res) {
  const listTitle = req.body.newItem;
  const listItem = req.body.list;

  const ip = new Item({
    name: listTitle,
  });

  if (listItem === "Today") {
    ip.save()
      .then(() => {
        console.log("Success");
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    List.findOne({ name: listItem })
      .then((data) => {
        data.item.push(ip);
        data.save().then(() => {
          res.redirect("/" + listItem);
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.delbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndDelete(checkedItemId)
      .then(() => {
        console.log("item deletion success");
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { item: { _id: checkedItemId } } }
    )
      .then(() => {
        console.log("Update Successful");
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.get("/:customRoute", (req, res) => {
  const newRoute = _.capitalize(req.params.customRoute);

  List.findOne({ name: newRoute }).then((f) => {
    if (!f) {
      const list1 = new List({
        name: newRoute,
        item: item1s,
      });

      list1.save();

      res.redirect("/" + newRoute);
    } else {
      res.render("list", { listTitle: f.name, newItem: f.item });
    }
  });
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running at port 3000.");
});
