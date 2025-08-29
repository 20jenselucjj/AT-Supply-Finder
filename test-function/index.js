export default async function (req, res) {
  res.json({
    success: true,
    message: "Function is working!",
    data: {
      users: [],
      total: 0,
      page: 1,
      limit: 25
    }
  });
};