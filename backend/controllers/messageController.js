const Message = require("../models/Message");
const PurchaseRequest = require("../models/PurchaseRequest");
const { createNotification } = require("./notificationController");

// @desc  Send a message / bid in a request
// @route POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const { requestId, recipientId, text, isBidOffer, proposedPrice } = req.body;
    
    // Verify request exists
    const request = await PurchaseRequest.findById(requestId).populate("crop", "name unit");
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    const message = await Message.create({
      purchaseRequest: requestId,
      sender: req.user._id,
      recipient: recipientId,
      text,
      isBidOffer: isBidOffer || false,
      proposedPrice: isBidOffer ? proposedPrice : undefined
    });

    if (isBidOffer && proposedPrice) {
      request.totalPrice = proposedPrice;
      await request.save();
    }

    const populatedMsg = await Message.findById(message._id).populate("sender", "name role avatar");

    // Fire notification
    const typeStr = req.user.role === "buyer" ? "buyer_message" : "system";
    await createNotification({
      recipient: recipientId,
      sender: req.user._id,
      type: typeStr,
      title: isBidOffer ? "New Bid Offer" : "New Message",
      message: isBidOffer 
        ? `${req.user.name} offered a new bid of $${proposedPrice} for request on ${request.crop?.name || "your crop"}` 
        : `${req.user.name} sent you a message regarding request on ${request.crop?.name || "your crop"}`,
      link: "/messages",
      data: { requestId }
    });

    res.status(201).json({ success: true, data: populatedMsg });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Get messages for a request
// @route GET /api/messages/:requestId
const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ purchaseRequest: req.params.requestId })
      .populate("sender", "name role avatar")
      .sort({ createdAt: 1 });
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { sendMessage, getMessages };
