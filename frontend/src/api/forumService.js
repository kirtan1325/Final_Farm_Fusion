// frontend/src/api/forumService.js
import api from "./axiosInstance";

export const getPosts        = async (params = {}) => { const { data } = await api.get("/forum",                      { params }); return data; };
export const getPost         = async (id)           => { const { data } = await api.get(`/forum/${id}`);                            return data; };
export const createPost      = async (body)         => { const { data } = await api.post("/forum",                     body);       return data; };
export const upvotePost      = async (id)           => { const { data } = await api.patch(`/forum/${id}/upvote`);                   return data; };
export const resolvePost     = async (id)           => { const { data } = await api.patch(`/forum/${id}/resolve`);                  return data; };
export const deletePost      = async (id)           => { const { data } = await api.delete(`/forum/${id}`);                         return data; };

export const addComment      = async (postId, body) => { const { data } = await api.post(`/forum/${postId}/comments`,  body);       return data; };
export const upvoteComment   = async (id)           => { const { data } = await api.patch(`/forum/comments/${id}/upvote`);          return data; };
export const deleteComment   = async (id)           => { const { data } = await api.delete(`/forum/comments/${id}`);                return data; };
