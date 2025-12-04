import userModel from "../models/userModel.js"

export const findUser=(query)=>{
  return userModel.find(query);
}