const express = require("express");
const router = express.Router();
const { getAllRoles } = require("../controllers/RoleController");

// Route: GET /api/roles
router.get("/", getAllRoles);

module.exports = router;
