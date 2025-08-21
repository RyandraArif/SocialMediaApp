const PostModel = require("../models/PostModel");

const typeDefs = `#graphql
  type Post {
    _id: ID!
    content: String!
    tags: [String!]
    imgUrl: String
    authorId: ID!
    comments: [Comment!]
    likes: [Like!]
    createdAt: String!
    updatedAt: String!
  }

  type Comment {
    content: String!
    username: String!
    createdAt: String!
    updatedAt: String!
  }

  type Like {
    username: String!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getAllPosts: [Post!]!
    getPostById(postId: ID!): Post
    getPostsByUser(authorId: ID!): [Post!]!
  }

  type Mutation {
    addPost(content: String!, authorId: ID!, tags: [String], imgUrl: String): Post!
    addComment(postId: ID!, username: String!, content: String!): String!
    addLike(postId: ID!, username: String!): String!
  }
`;

const resolvers = {
  Query: {
    getAllPosts: async () => {
      return await PostModel.getAllPosts();
    },
    getPostById: async (_, { postId }) => {
      return await PostModel.getPostById(postId);
    },
    getPostsByUser: async (_, { authorId }) => {
      return await PostModel.getPostsByUser(authorId);
    },
  },
  Mutation: {
    addPost: async (
      _,
      { content, authorId, tags = [], imgUrl = "" },
      { auth }
    ) => {
      await auth();
      return await PostModel.addPost({ content, authorId, tags, imgUrl });
    },
    addComment: async (_, { postId, username, content }, { auth }) => {
      await auth();
      const result = await PostModel.addComment(postId, username, content);
      if (result.modifiedCount > 0) {
        return "Comment added successfully";
      }
      throw new Error("Failed to add comment");
    },
    addLike: async (_, { postId, username }, { auth }) => {
      await auth();
      const result = await PostModel.addLike(postId, username);
      if (result.modifiedCount > 0) {
        return "Like added successfully";
      }
      throw new Error("Failed to add like");
    },
  },
};

module.exports = { postTypeDefs: typeDefs, postResolvers: resolvers };
