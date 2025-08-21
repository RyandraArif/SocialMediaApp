const { ObjectId } = require("mongodb");
const { database } = require("../config/mongodb");

class FollowModel {
  static collection() {
    return database.collection("follows");
  }

  static async follow(followerId, followingId) {
    if (!followerId || !followingId) throw new Error("Both IDs required");
    const now = new Date();
    const followDoc = {
      followerId: new ObjectId(followerId),
      followingId: new ObjectId(followingId),
      createdAt: now,
      updatedAt: now,
    };
    const exists = await this.collection().findOne({
      followerId: followDoc.followerId,
      followingId: followDoc.followingId,
    });
    if (exists) return false;
    const result = await this.collection().insertOne(followDoc);
    return result.insertedId ? true : false;
  }

  static async unfollow(followerId, followingId) {
    return await this.collection().deleteOne({
      followerId: new ObjectId(followerId),
      followingId: new ObjectId(followingId),
    });
  }

  static async getFollowers(userId) {
    return await this.collection()
      .find({ followingId: new ObjectId(userId) })
      .toArray();
  }

  static async getFollowing(userId) {
    return await this.collection()
      .find({ followerId: new ObjectId(userId) })
      .toArray();
  }
}

module.exports = FollowModel;
