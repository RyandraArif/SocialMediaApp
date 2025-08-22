const { hashPassword, comparePassword } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");
const { UserModel } = require("../models/UserModel");
const FollowModel = require("../models/FollowModel");

const typeDefs = `#graphql
  type User {
    _id: ID!
    name: String!
    username: String!
    email: String!
    password: String!
  }

  type LoginResponse {
    accessToken: String
    message: String
  }

  type Profile {
    name: String
    username: String
    email: String
    followers: [ID!]
    following: [ID!]
  }

  type Query {
    searchUsers(query: String!): [User!]!
    getUserById(userId: ID!): Profile
  }

  type Mutation {
    register(name: String!, username: String!, email: String!, password: String!): User!
    login(email: String!, password: String!): LoginResponse
  }
`;

const resolvers = {
  Query: {
    searchUsers: async (_, { query }) => {
      return await UserModel.searchUsers(query);
    },
    getUserById: async (_, { userId }, { auth }) => {
      await auth();
      const user = await UserModel.getUserById(userId);

      if (!user) {
        throw new Error("User not found");
      }

      const rawFollowers = (await FollowModel.getFollowers(userId)) || [];
      const rawFollowing = (await FollowModel.getFollowing(userId)) || [];

      const followers = rawFollowers.map((f) => {
        return f.followerId.toString();
      });

      const following = rawFollowing.map((f) => {
        return f.followingId.toString();
      });

      return {
        name: user.name,
        username: user.username,
        email: user.email,
        followers,
        following,
      };
    },
  },
  Mutation: {
    register: async (_, { name, username, email, password }) => {
      if (!password || password.length < 5) {
        throw new Error("Password min 5 chars");
      }
      const hashedPassword = hashPassword(password);
      return await UserModel.createUser({
        name,
        username,
        email,
        password: hashedPassword,
      });
    },
    login: async (_, { email, password }) => {
      const user = await UserModel.getUserByEmail(email);
      if (!user) {
        throw new Error("User not found");
      }

      const isValid = comparePassword(password, user.password);
      if (!isValid) {
        throw new Error("Invalid password");
      }

      const accessToken = signToken({ userId: user._id });
      return {
        accessToken,
        message: "Login successful",
      };
    },
  },
};

module.exports = { userTypeDefs: typeDefs, userResolvers: resolvers };
