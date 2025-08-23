import api from "./index.js";

export const loginApi = (data) => {
  return api({
    method: "POST",
    url: "/api/login",
    data,
  });
};
