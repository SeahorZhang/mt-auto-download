import api from "./index.js";
import FormData from "form-data";

const searchTypeMap = {
  综合: {
    categories: [],
    mode: "normal",
  },
  电影: {
    categories: ["401", "419", "420", "421"],
    mode: "movie",
  },
  记录: {
    categories: ["404"],
    mode: "normal",
  },
  剧集: {
    categories: ["403", "402", "435", "438"],
    mode: "normal",
  },
  音乐: {
    categories: [],
    mode: "music",
  },
  动漫: {
    categories: ["405"],
    mode: "normal",
  },
  体育: {
    categories: ["407"],
    mode: "normal",
  },
  软件: {
    categories: ["422"],
    mode: "normal",
  },
  游戏: {
    categories: ["423", "448"],
    mode: "normal",
  },
  电子书: {
    categories: ["427"],
    mode: "normal",
  },
  有声书: {
    categories: ["442"],
    mode: "normal",
  },
  教育影片: {
    categories: ["451"],
    mode: "normal",
  },
  其他: {
    categories: ["409"],
    mode: "normal",
  },
};
export const searchApi = async (data) => {
  return await api({
    method: "POST",
    url: "/api/torrent/search",
    data: {
      visible: 1,
      sortDirection: "ASC",
      sortField: "SIZE",
      ...data,
      ...(searchTypeMap[data.type] || searchTypeMap["综合"]),
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
