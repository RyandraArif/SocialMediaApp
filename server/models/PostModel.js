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

  static async getPosts() {
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
    const pipeline = [
      { $match: { _id: new ObjectId(postId) } },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      // Lookup untuk komentar
      { $unwind: { path: "$comments", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "comments.username",
          foreignField: "username",
          as: "commentUser",
        },
      },
      { $unwind: { path: "$commentUser", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          "comments.name": "$commentUser.name",
          "comments.username": "$commentUser.username",
        },
      },
      {
        $group: {
          _id: "$_id",
          post: { $first: "$$ROOT" },
          comments: { $push: "$comments" },
        },
      },
      {
        $addFields: {
          "post.comments": "$comments",
        },
      },
      { $replaceRoot: { newRoot: "$post" } },
      // Lookup untuk like
      { $unwind: { path: "$likes", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "likes.username",
          foreignField: "username",
          as: "likeUser",
        },
      },
      { $unwind: { path: "$likeUser", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          "likes.name": "$likeUser.name",
          "likes.username": "$likeUser.username",
        },
      },
      {
        $group: {
          _id: "$_id",
          post: { $first: "$$ROOT" },
          likes: { $push: "$likes" },
        },
      },
      {
        $addFields: {
          "post.likes": "$likes",
        },
      },
      { $replaceRoot: { newRoot: "$post" } },
    ];
    const result = await this.collection().aggregate(pipeline).toArray();
    return result[0] || null;
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
