const { MongoClient } = require("mongodb");
const uri =
  "mongodb+srv://ryandraarif:7hswQHeIpTVV0obY@cluster0.z65tliz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri);
const database = client.db("socialMedia");
module.exports = {
  database,
};
