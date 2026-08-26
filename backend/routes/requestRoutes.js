// backend/routes/requestRoutes.js
const express = require("express");
const router  = express.Router();
const {
  createRequest, getMyRequests, getIncomingRequests,
  acceptRequest, rejectRequest, cancelRequest, payRequest,
} = require("../controllers/requestController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/",             protect, authorize("buyer"),  createRequest);
router.get("/my",            protect, authorize("buyer"),  getMyRequests);
router.get("/incoming",      protect, authorize("farmer"), getIncomingRequests);
router.patch("/:id/accept",  protect, authorize("farmer"), acceptRequest);
router.patch("/:id/reject",  protect, authorize("farmer"), rejectRequest);
router.patch("/:id/cancel",  protect, authorize("buyer"),  cancelRequest);
router.post("/:id/pay",      protect, authorize("buyer"),  payRequest);

module.exports = router;