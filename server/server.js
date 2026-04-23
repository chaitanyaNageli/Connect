const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const http = require("http");
const multer = require("multer");
const streamifier = require("streamifier");
const console = require("console");
require("dotenv").config();



const app = express();

app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods:["GET","POST"]
  }
});


const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});



mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(mongoose.connection.name))
  .catch((err) => console.log(err));

const profile_schema = new mongoose.Schema({
  number: { type: String, unique: true },
  profilePic: { type: String, default: "" },
  profilePicPublicId: { type: String, default: "" }
});

const profile = mongoose.model("profile", profile_schema);

const Users = mongoose.model("Users", {
  sender: String,
  receiver: String

});


const MessageSchema = mongoose.model("MessageSchema", {
  sender: {
    type: String,
    trim: true,
    required: true
  },
  receiver: {
    type: String,
    trim: true,
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});




io.on("connection", (socket) => {
  socket.on("message", (data) => {
    MessageSchema.create({
      sender: data.sender,
      receiver: data.receiver,
      text: data.text,
    })
    io.emit("recievedMSG",data);
    io.emit("ackOfMSG", "stored successfully");

  })
})

app.get("/fetchMessages/:sender/:receiver", async (req, res) => {
  const { sender, receiver } = req.params;
  try {
    const messages = await MessageSchema.find({
      $or: [
        { sender: sender, receiver: receiver },
        { sender: receiver, receiver: sender }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  }
  catch (error) {
    console.log(error);
  }
})
app.post("/addUser", async (req, res) => {
  const { sender, receiver } = req.body;
  try {
    const exist = await Users.findOne({
      sender, receiver
    });
    if (exist) {
      res.json({ msg: "USER ALREADY AVAILABLE" });
      return;
    }
    await Users.create({
      sender: sender,
      receiver: receiver
    })
    await Users.create({
      sender: receiver,
      receiver: sender
    })
    res.json({ msg: "SAVED RECORD" });
    console.log(sender, receiver)
  }
  catch (err) {
    console.log("err");
  }
})

app.get(`/users/:number`, async (req, res) => {
  const { number } = req.params;
  try {
      const contacts = await Users.find({ sender: number });
      const numbers = contacts.map(c => c.receiver);

    const users = await profile.find({ number: { $in: numbers } });
    const map = new Map(users.map(u => [u.number, u.profilePic]));

    const result = numbers.map(num => ({
      number: num,
      profilePic: map.get(num) || ""
    }));

    res.json(result);
  }
  catch (error) {
    console.log(error);
  }
});

app.get("/profilepic/:number", async (req, res) => {
  try {
    const data = await profile.findOne({ number: req.params.number });
    res.json(data ? data.profilePic : "");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const upload = multer({ storage: multer.memoryStorage() });


app.post("/uploadProfile", upload.single("file"), async (req, res) => {
  try {
    const { number } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const existingUser = await profile.findOne({ number });

  
    if (existingUser && existingUser.profilePicPublicId) {
      await cloudinary.uploader.destroy(existingUser.profilePicPublicId);
    }

  
    const uploadFromBuffer = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "profiles" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    const result = await uploadFromBuffer(req.file.buffer);

    const updatedUser = await profile.findOneAndUpdate(
      { number },
      {
        profilePic: result.secure_url,
        profilePicPublicId: result.public_id
      },
      { new: true, upsert: true }
    );
    console.log("Yes");
    res.json({ url: result.secure_url });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Upload failed" });
  }
});




const port = process.env.PORT || 5000
server.listen(5000, () => {
  console.log(`App running at ${port}`)
})



