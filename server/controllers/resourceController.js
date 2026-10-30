const Resource = require("../models/Resource");

module.exports.listResources = async function (req, res) {
  try {
    const q = String(req.query.q || "").trim();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const filter = {};

    if (q) {
      filter.$or = [
        { key: new RegExp(q, "i") },
        { name: new RegExp(q, "i") },
      ];
    }

    const [total, resources] = await Promise.all([
      Resource.countDocuments(filter),
      Resource.find(filter)
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    res.json({
      data: resources.map(function (resource) {
        return {
          id: resource._id.toString(),
          key: resource.key,
          name: resource.name,
          description: resource.description || "",
          actions: resource.actions || [],
        };
      }),
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ statusMessage: "Unable to load resources" });
  }
};

