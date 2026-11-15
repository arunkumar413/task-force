const multer = require("multer");
const parser = multer({ storage: multer.memoryStorage(), limits: { files: 5, fileSize: 10 * 1024 * 1024, fields: 1, fieldSize: 1024 * 1024, parts: 6 } }).array("files", 5);
module.exports = (req, res) => new Promise((resolve, reject) => parser(req, res, err => {
  if (!err) return resolve();
  reject(Object.assign(new Error(err.code === "LIMIT_FILE_SIZE" ? "Each attachment must be 10 MB or smaller" : "Upload up to 5 files with your submission"), { status: 413 }));
}));
