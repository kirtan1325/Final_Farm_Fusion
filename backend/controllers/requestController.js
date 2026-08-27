const PurchaseRequest = require("../models/PurchaseRequest");
const Crop            = require("../models/Crop");
const Order           = require("../models/Order");
const { createNotification } = require("./notificationController");

// ── Helper ─────────────────────────────────────────────
const safePagesCount = (total, limit) => total === 0 ? 1 : Math.ceil(total / Number(limit));

// @desc  Buyer creates a purchase request
// @route POST /api/requests
const createRequest = async (req, res) => {
  try {
    const { cropId, quantity, message, deliveryAddress, requestedDeliveryDate } = req.body;

    if (!cropId)    return res.status(400).json({ success: false, message: "cropId is required" });
    if (!quantity)  return res.status(400).json({ success: false, message: "quantity is required" });

    const crop = await Crop.findById(cropId);
    if (!crop) return res.status(404).json({ success: false, message: "Crop not found" });
    if (crop.status !== "available") return res.status(400).json({ success: false, message: "Crop is not available" });

    const totalPrice = crop.pricePerUnit * Number(quantity);

    const request = await PurchaseRequest.create({
      buyer:  req.user._id,
      farmer: crop.farmer,
      crop:   cropId,
      quantity: Number(quantity),
      unit:     crop.unit,
      totalPrice,
      message,
      deliveryAddress,
      requestedDeliveryDate,
    });

    const populated = await PurchaseRequest.findById(request._id)
      .populate("buyer",  "name companyName")
      .populate("farmer", "name farmName")
      .populate("crop",   "name emoji unit pricePerUnit");

    await createNotification({
      recipient: crop.farmer,
      sender: req.user._id,
      type: "request_received",
      title: "New Purchase Request",
      message: `${req.user.name} requested ${quantity} ${crop.unit} of ${crop.name}.`,
      link: "/farmer/requests",
      data: { requestId: request._id }
    });

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error("CREATE REQUEST ERROR:", err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Buyer gets their own requests
// @route GET /api/requests/my
const getMyRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 4 } = req.query;
    const filter = { buyer: req.user._id };
    if (status) filter.status = status;

    const total    = await PurchaseRequest.countDocuments(filter);
    const requests = await PurchaseRequest.find(filter)
      .populate("farmer", "name farmName avatar")
      .populate("crop",   "name emoji pricePerUnit unit")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page:  Number(page),
      pages: safePagesCount(total, limit),
      data:  requests,
    });
  } catch (err) {
    console.error("GET MY REQUESTS ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Farmer gets incoming requests
// @route GET /api/requests/incoming
const getIncomingRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 4, search } = req.query;

    const filter = { farmer: req.user._id };
    if (status) filter.status = status;

    let requests = await PurchaseRequest.find(filter)
      .populate("buyer", "name companyName avatar")
      .populate("crop",  "name emoji unit pricePerUnit")
      .sort({ createdAt: -1 });

    // Client-side search filter
    if (search) {
      const s = search.toLowerCase();
      requests = requests.filter(r =>
        r.buyer?.name?.toLowerCase().includes(s) ||
        r.crop?.name?.toLowerCase().includes(s)  ||
        r.buyer?.companyName?.toLowerCase().includes(s)
      );
    }

    const total = requests.length;
    const start = (Number(page) - 1) * Number(limit);
    const paged = requests.slice(start, start + Number(limit));

    res.json({
      success: true,
      total,
      page:  Number(page),
      pages: safePagesCount(total, limit),
      data:  paged,
    });
  } catch (err) {
    console.error("GET INCOMING REQUESTS ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Farmer accepts a request
// @route PATCH /api/requests/:id/accept
const acceptRequest = async (req, res) => {
  try {
    const request = await PurchaseRequest.findOne({ _id: req.params.id, farmer: req.user._id });
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    if (request.status !== "pending") return res.status(400).json({ success: false, message: "Request already handled" });

    request.status = "accepted";
    await request.save();
    
    await createNotification({
      recipient: request.buyer,
      sender: req.user._id,
      type: "request_accepted",
      title: "Request Accepted",
      message: "Your purchase request was successfully accepted.",
      link: "/buyer/orders",
      data: { requestId: request._id }
    });

    res.json({ success: true, data: request });
  } catch (err) {
    console.error("ACCEPT REQUEST ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Farmer rejects a request
// @route PATCH /api/requests/:id/reject
const rejectRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await PurchaseRequest.findOne({ _id: req.params.id, farmer: req.user._id });
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    if (request.status !== "pending") return res.status(400).json({ success: false, message: "Request already handled" });

    request.status = "rejected";
    request.rejectedReason = reason || "No reason provided";
    await request.save();
    
    await createNotification({
      recipient: request.buyer,
      sender: req.user._id,
      type: "request_rejected",
      title: "Request Rejected",
      message: `Your purchase request was rejected. Reason: ${request.rejectedReason}`,
      link: "/buyer/orders",
      data: { requestId: request._id }
    });

    res.json({ success: true, data: request });
  } catch (err) {
    console.error("REJECT REQUEST ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Buyer cancels a pending request
// @route PATCH /api/requests/:id/cancel
const cancelRequest = async (req, res) => {
  try {
    const request = await PurchaseRequest.findOne({ _id: req.params.id, buyer: req.user._id });
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    if (request.status !== "pending") return res.status(400).json({ success: false, message: "Only pending requests can be cancelled" });

    request.status = "cancelled";
    await request.save();

    await createNotification({
      recipient: request.farmer,
      sender: req.user._id,
      type: "request_cancelled",
      title: "Request Cancelled",
      message: `${req.user.name} cancelled a request for ${request.quantity} ${request.unit}.`,
      link: "/farmer/requests",
      data: { requestId: request._id }
    });

    res.json({ success: true, data: request });
  } catch (err) {
    console.error("CANCEL REQUEST ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Buyer pays → creates Order
// @route POST /api/requests/:id/pay
const payRequest = async (req, res) => {
  try {
    const { paymentMethod = "card", transactionId } = req.body;
    const request = await PurchaseRequest.findOne({ _id: req.params.id, buyer: req.user._id });
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    if (request.status !== "accepted") return res.status(400).json({ success: false, message: "Request must be accepted before payment" });
    if (request.isPaid) return res.status(400).json({ success: false, message: "Already paid" });

    request.isPaid = true;
    request.paidAt = new Date();
    await request.save();

    const order = await Order.create({
      purchaseRequest: request._id,
      buyer:       request.buyer,
      farmer:      request.farmer,
      crop:        request.crop,
      quantity:    request.quantity,
      totalPrice:  request.totalPrice,
      paymentMethod,
      transactionId: transactionId || `TXN_${Date.now()}`,
    });

    await createNotification({
      recipient: request.farmer,
      sender: req.user._id,
      type: "payment_received",
      title: "Payment Received",
      message: `You received a payment of $${request.totalPrice}.`,
      link: "/farmer/sales",
      data: { orderId: order._id }
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    console.error("PAY REQUEST ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createRequest, getMyRequests, getIncomingRequests,
  acceptRequest, rejectRequest, cancelRequest, payRequest,
};