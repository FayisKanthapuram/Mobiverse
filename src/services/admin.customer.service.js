import { findUser } from "../repositories/customer.repo.js";

export const getCustomersBySearch=async(search="")=>{
  const query={}
  if(search) {
    query.$or=[
      {username:{$regex:search,$options:"i"}},
      {email:{$regex:search,$options:"i"}},
    ]
  }
  console.log(query);
  return await findUser(query);
}