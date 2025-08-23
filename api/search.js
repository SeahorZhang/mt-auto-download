import api from "./index.js";
import FormData from "form-data";

export const searchApi = async (data) => {
  return await api({
    method: "POST",
    url: "/api/torrent/search",
    data: {
      mode: "normal",
      visible: 1,
      categories: [],
      sortDirection: "ASC",
      sortField: "SIZE",
      ...data,
    },
  }).then((res) => res.data);
};

export const queryHistoryApi = async (data) => {
  return await api({
    method: "POST",
    url: "/api/tracker/queryHistory",
    data,
  }).then((res) => res.data);
};

export const torrentApi = async (data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });

  return await api({
    method: "POST",
    url: `/api/torrent/genDlToken`,
    data: formData,
  }).then((res) => res.data);
};
