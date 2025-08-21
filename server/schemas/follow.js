const FollowModel = require("../models/FollowModel");

const typeDefs = `#graphql
    type Follow {
      _id: ID!
      followerId: ID!
      followingId: ID!
      createdAt: String
      updatedAt: String
    }

    type Query {
      followers(userId: ID!): [Follow]
      following(userId: ID!): [Follow]
    }

    type Mutation {
      followUser(followerId: ID!, followingId: ID!): Boolean
      unfollowUser(followerId: ID!, followingId: ID!): Boolean
    }
  `;
const resolvers = {
  Query: {
    followers: async (_, { userId }, { auth }) => {
      await auth();
      return await FollowModel.getFollowers(userId);
    },
    following: async (_, { userId }, { auth }) => {
      await auth();
      return await FollowModel.getFollowing(userId);
    },
  },
  Mutation: {
    followUser: async (_, { followerId, followingId }, { auth }) => {
      await auth();
      return await FollowModel.follow(followerId, followingId);
    },
    unfollowUser: async (_, { followerId, followingId }, { auth }) => {
      await auth();
      const result = await FollowModel.unfollow(followerId, followingId);
      return result.deletedCount > 0;
    },
  },
};

module.exports = {
  followTypeDefs: typeDefs,
  followResolvers: resolvers,
};
