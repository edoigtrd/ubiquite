import { time } from "motion/react";
import { api } from "../lib/api";

export const getMessageImages = async (messageId: string) => {
  const response = await api.get("/images/get", {
    params: { uuid: messageId },
    timeout: 0

});
  return response.data;
};


