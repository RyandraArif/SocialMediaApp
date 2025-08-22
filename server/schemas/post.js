const redis = require("../config/redis");
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
    getPosts: [Post!]!
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
    getPosts: async () => {
      // await auth();
      const postCache = await redis.get("postCache");
      if (postCache) {
        console.log("masuk cache");
        return JSON.parse(postCache);
      }

      const posts = await PostModel.getPosts();
      await redis.set("postCache", JSON.stringify(posts));
      console.log("masuk db");

      return posts.map((post) => ({
        ...post,
        authorName: post.author.name,
      }));
    },
    getPostById: async (_, { postId }) => {
      const post = await PostModel.getPostById(postId);
      // Nama author sudah tersedia di hasil aggregation
      return post ? { ...post, authorName: post.author.name } : null;
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
      const post = await PostModel.addPost({ content, authorId, tags, imgUrl });
      await redis.del("postCache");
      return post;
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
