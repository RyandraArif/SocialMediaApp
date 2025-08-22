const { ObjectId } = require("mongodb");
const { database } = require("../config/mongodb");

class PostModel {
  static collection() {
    return database.collection("posts");
  }

  static async addPost({ authorId, content, tags = [], imgUrl = "" }) {
    if (!content) {
      throw new Error("Content is required");
    }
    const user = await database
      .collection("users")
      .findOne({ _id: new ObjectId(authorId) });

    if (!user) {
      throw new Error("User not found");
    }

    const post = {
      content,
      tags,
      imgUrl,
      authorId: new ObjectId(authorId),
      comments: [],
      likes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await this.collection().insertOne(post);
    return await this.collection().findOne({ _id: result.insertedId });
  }

  static async getPost() {
    return await this.collection()
      .aggregate([
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: "users",
            localField: "authorId",
            foreignField: "_id",
            as: "author",
          },
        },
        { $unwind: "$author" },
      ])
      .toArray();
  }

  static async getPostById(postId) {
    return await this.collection().findOne({ _id: new ObjectId(postId) });
  }

  static async getPostsByUser(authorId) {
    return await this.collection()
      .find({ authorId: new ObjectId(authorId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async addComment(postId, username, content) {
    if (!content) throw new Error("Comment content is required");
    if (!username) throw new Error("Comment username is required");
    const now = new Date();
    return await this.collection().updateOne(
      { _id: new ObjectId(postId) },
      {
        $push: {
          comments: {
            content,
            username,
            createdAt: now,
            updatedAt: now,
          },
        },
        $set: { updatedAt: now },
      }
    );
  }

  static async addLike(postId, username) {
    if (!username) throw new Error("Like username is required");
    const now = new Date();
    return await this.collection().updateOne(
      { _id: new ObjectId(postId) },
      {
        $addToSet: {
          likes: {
            username,
            createdAt: now,
            updatedAt: now,
          },
        },
        $set: { updatedAt: now },
      }
    );
  }
}

module.exports = PostModel;
