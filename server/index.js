require("dotenv").config();
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { verifyToken } = require("./helpers/bcrypt");

const { userTypeDefs, userResolvers } = require("./schemas/user");
const { postTypeDefs, postResolvers } = require("./schemas/post");
const { followTypeDefs, followResolvers } = require("./schemas/follow");

const server = new ApolloServer({
  typeDefs: [userTypeDefs, postTypeDefs, followTypeDefs],
  resolvers: [userResolvers, postResolvers, followResolvers],
});

startStandaloneServer(server, {
  listen: { port: 3000 },
  context: ({ req }) => {
    return {
      message: "hello world",
      auth: async () => {
        const authentication = req.headers.authorization;
        if (!authentication) {
          throw new Error("You must logged in to access this resource");
        }

        const [type, token] = authentication.split(" ");
        if (type !== "Bearer" || !token) {
          throw new Error("Invalid authentication type");
        }

        const decoded = verifyToken(token);
        if (!decoded) {
          throw new Error("Invalid token");
        }

        const user = await UserModel.findById(decoded.userId);
        if (!user) {
          throw new Error("User not found");
        }

        return { user };
      },
    };
  },
}).then(({ url }) => {
  console.log(`🚀  Server ready at: ${url}`);
});
