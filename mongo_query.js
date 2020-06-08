const MongoClient = require('mongodb').MongoClient
var current =1;
const client = new MongoClient("mongodb+srv://sumukh1996:Dexler%401234@cluster0-et4eg.gcp.mongodb.net/test?retryWrites=true&w=majority",{useNewUrlParser: true,useUnifiedTopology: true});
  client.connect(err => {
      const collection = client.db("chatbot").collection("qna");
      collection.find({})
      .sort({"order": 1})
      .skip(current)
      .limit(1)
      .toArray((err, result) => {
          if(err){
             console.log("error"+err) 
             
          }
          if(result !== null){  
            text = result; 
            console.log("result"+result[0].order); 
            

          }
      });   
});

