import { MongoClient } from "mongodb";
import { resolvers } from "./resolvers.ts";
import { typeDefs } from "./schema.ts";
import { ApolloServer } from "@apollo/server";
import { ContactModel } from "./types.ts";
import { startStandaloneServer } from "@apollo/server/standalone";

const MONGO_URL = Deno.env.get("MONGO_URL")
if (!MONGO_URL) {
  throw new Error("MONGO_URL is not defined");
}

const mongoClient = new MongoClient(MONGO_URL);
await mongoClient.connect();

console.info("Connected to MongoDB");

const mongoDB = mongoClient.db("Simulacro_IV_Contac");
const ContactCollection = mongoDB.collection<ContactModel>("contacts");

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  context: async () => ({ ContactsCollection: ContactCollection }),
});

console.info(`Server ready at ${url}`);