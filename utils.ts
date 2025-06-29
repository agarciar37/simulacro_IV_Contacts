import { PhoneDataAPI } from "./types.ts";

export const getPhoneData = async(phone: string): Promise<PhoneDataAPI> => {
    const API_KEY = Deno.env.get("API_KEY")
    if (!API_KEY) throw new Error("API_KEY not found");
    const url = `https://api.api-ninjas.com/v1/validatephone?number=${phone}`
    const response = await fetch(url, {
        headers: {
            "X-Api-Key": API_KEY
        }
    })
    if (!response.ok) throw new Error("Error fetching API");

    return await response.json()
}