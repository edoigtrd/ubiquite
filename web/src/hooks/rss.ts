import {api} from "../lib/api";

export const useRssFeed = () => {
    const getRssFeed = async () => {
        const response = await api.get('/rss/get');
        return response.data;
    };

    return { getRssFeed };
};
