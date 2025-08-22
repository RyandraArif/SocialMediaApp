const { ObjectId } = require("mongodb");
const { database } = require("../config/mongodb");
const { hashPassword } = require("../helpers/bcrypt");

class UserModel {
  static collection() {
    return database.collection("users");
  }

  static async createUser({ name, username, email, password }) {
    if (!name) {
      throw new Error("Name is required");
    }

    if (!username) {
      throw new Error("Username is required");
    }

    if (!email) {
      throw new Error("Email is required");
    }

    if (!password || password.length < 5) {
      throw new Error("Password min 5 chars");
    }

    // Validasi uniq username dan email
    const exists = await this.collection().findOne({
      $or: [{ username }, { email }],
    });

    if (exists) {
      throw new Error("Username or email already exists");
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail) {
      throw new Error("Invalid email format");
    }

    const hashedPassword = hashPassword(password);
    password = hashedPassword;

    const user = { name, username, email, password };
    const result = await this.collection().insertOne(user);

    if (result.insertedCount === 0) {
      throw new Error("Failed to create user");
    }

    return await this.collection().findOne({ _id: result.insertedId });
  }

  static async find() {
    return await this.collection().find().toArray();
  }

  static async searchUsers(query) {
    return await this.collection()
      .find({
        $or: [
          {
            name: {
              $regex: query,
              $options: "i",
            },
          },
          {
            username: {
              $regex: query,
              $options: "i",
            },
          },
        ],
      })
      .toArray();
  }

  static async getUserById(userId) {
    const pipeline = [
      { $match: { _id: new ObjectId(userId) } },
      // Lookup followers
      {
        $lookup: {
          from: "follows",
          localField: "_id",
          foreignField: "followingId",
          as: "followersData",
        },
      },
      { $unwind: { path: "$followersData", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "followersData.followerId",
          foreignField: "_id",
          as: "followerUser",
        },
      },
      { $unwind: { path: "$followerUser", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          user: { $first: "$$ROOT" },
          followers: {
            $push: {
              _id: "$followerUser._id",
              username: "$followerUser.username",
              name: "$followerUser.name",
            },
          },
        },
      },
      // Lookup following
      {
        $lookup: {
          from: "follows",
          localField: "_id",
          foreignField: "followerId",
          as: "followingData",
        },
      },
      { $unwind: { path: "$followingData", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "followingData.followingId",
          foreignField: "_id",
          as: "followingUser",
        },
      },
      { $unwind: { path: "$followingUser", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          user: { $first: "$user" },
          followers: { $first: "$followers" },
          following: {
            $push: {
              _id: "$followingUser._id",
              username: "$followingUser.username",
              name: "$followingUser.name",
            },
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              "$user",
              { followers: "$followers", following: "$following" },
            ],
          },
        },
      },
    ];
    const result = await this.collection().aggregate(pipeline).toArray();
    return result[0] || null;
  }

  static async getUserByEmail(email) {
    return await this.collection().findOne({ email });
  }
}

module.exports = { UserModel };
