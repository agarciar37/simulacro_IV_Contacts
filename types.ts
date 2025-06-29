import { OptionalId } from "mongodb"

export type Contact = OptionalId<{
    name: string;
    phone: string;
    country: string;
    timezone: string;
}>

export type PhoneDataAPI = {
    is_valid: boolean;
    country: string;
    timezones: string[]
}