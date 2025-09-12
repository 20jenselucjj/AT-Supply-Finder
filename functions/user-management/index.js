import listUsers from './list-users.js';

export default async function (context) {
  // Delegate to the list-users function
  return await listUsers(context);
}