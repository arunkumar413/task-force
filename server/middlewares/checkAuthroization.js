const { pool } = require("../DBConfig");

module.exports.checkAuthorization = function (accessCheckObj) {
  return async function (req, res, next) {
    try {
      let userRoles = req.session.user.roles;
      let accessCheckRoles = accessCheckObj.rolesWithAccess;

      function hasCommonElement(array1, array2) {
        return userRoles.some((element) => accessCheckRoles.includes(element));
      }

      const result = hasCommonElement(userRoles, accessCheckRoles); // check if atleast one api endpoint roles match with the user roles
      if (result === true) {
        next();
      } else {
        res.status(403).json({ statusMessage: "Authorization failed" });
      }
    } catch (err) {
      console.log(err);
    }
  };
};
