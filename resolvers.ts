import { Collection, ObjectId } from "mongodb";
import { ContactModel } from "./types.ts";
import { getPhoneData, getTimeData } from "./utils.ts";
import { GraphQLError } from "graphql";

type Context = {
    ContactsCollection: Collection<ContactModel>
}

type AddContactaMutationArgs = {
    name: string;
    phone: string;
}
 
type UpdateContactMutationArgs = {
    id: string;
    name: string;
    phone: string;
}

export const resolvers = {
    Contact: {
        id: (parent: ContactModel) => parent._id!.toString(),
        time: async (parent: ContactModel) => {
            const {timezone} = parent
            const data = await getTimeData(timezone)
            return data.datetime
        },
    }, 
    Query: {
        getContact: async(_: unknown, {id}: {id:string}, ctx: Context): Promise<ContactModel | null> => {
            return await ctx.ContactsCollection.findOne({_id: new ObjectId(id)})
        },
        getContacts: async(_: unknown, __: unknown, ctx: Context): Promise<ContactModel[]> => {
            return await ctx.ContactsCollection.find().toArray()
        }
    },
    Mutation: {
        addContact: async (_: unknown, args: AddContactaMutationArgs, ctx: Context): Promise<ContactModel> => {
            const {name, phone} = args

            const phoneExists = await ctx.ContactsCollection.findOne({phone})
            if (phoneExists) throw new GraphQLError("Phone alredy exists");

            const phoneData = await getPhoneData(phone)
            if (!phoneData.is_valid) throw new GraphQLError("Invalid phone number");
            const { insertedId } = await ctx.ContactsCollection.insertOne({
                name, 
                phone, 
                country: phoneData.country,
                timezone: phoneData.timezones[0]
            })
            return {
                _id: insertedId,
                name,
                phone,
                country: phoneData.country,
                timezone: phoneData.timezones[0],
            }
        },
        deleteContact: async(_:unknown, {id}: {id:string}, ctx: Context): Promise<Boolean> => {
            const result = await ctx.ContactsCollection.deleteOne({_id: new ObjectId(id)})
            return result.deletedCount === 1;
        },
        updateContact: async (_: unknown, args: UpdateContactMutationArgs, ctx: Context): Promise<ContactModel> => {
            const { id, name, phone } = args;

            if (!name && !phone) {
                throw new GraphQLError("You must update at least one field");
            }

            const contact = await ctx.ContactsCollection.findOne({ _id: new ObjectId(id) });
            if (!contact) throw new GraphQLError("Contact not found");

            // Si se quiere actualizar el teléfono
            if (phone) {
                const phoneExists = await ctx.ContactsCollection.findOne({ phone });
                if (phoneExists && phoneExists._id.toString() !== id) {
                    throw new GraphQLError("Phone already taken");
                }

                const phoneData = await getPhoneData(phone);
                if (!phoneData.is_valid) throw new GraphQLError("Invalid phone number");

                const updated = await ctx.ContactsCollection.findOneAndUpdate(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            name: name ?? contact.name,
                            phone,
                            country: phoneData.country,
                            timezone: phoneData.timezones[0],
                        }
                    },
                    { returnDocument: "after" }
                );

                if (!updated) throw new GraphQLError("Contact not found after update");
                return updated;
            }

            // Solo se actualiza el nombre
            const updated = await ctx.ContactsCollection.findOneAndUpdate(
                { _id: new ObjectId(id) },
                { $set: { name } },
                { returnDocument: "after" }
            );

            if (!updated) throw new GraphQLError("Contact not found after update");
            return updated;
        }
    }
}