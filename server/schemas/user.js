const { hashPassword } = require("../helpers/bcrypt");
const { UserModel } = require("../models/UserModel");

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

  type Query {
    searchUsers(query: String!): [User!]!
    getUserById(userId: ID!): User
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
      return await UserModel.getUserById(userId);
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
      const user = await UserModel.findUserByEmail(email);
      if (!user) {
        throw new Error("User not found");
      }

      const isValid = comparePassword(password, user.password);
      if (!isValid) {
        throw new Error("Invalid password");
      }

      const accessToken = generateToken({ userId: user._id });
      return {
        accessToken,
        message: "Login successful",
      };
    },
  },
};

module.exports = { userTypeDefs: typeDefs, userResolvers: resolvers };
