import { api } from "./api";

export interface TelegramStatus {
    isLinked: boolean;
    telegramId?: number;
    hasActiveToken: boolean;
}

export interface LinkTokenResponse {
    token: string;
    botUrl: string;
}

const telegramService = {
    getStatus: async () => {
        const response = await api.get<TelegramStatus>("/telegram/status");
        return response.data;
    },

    generateLinkToken: async () => {
        const response = await api.post<LinkTokenResponse>("/telegram/link-token");
        return response.data;
    },

    unlink: async () => {
        await api.delete("/telegram/unlink");
    }
};

export default telegramService;
