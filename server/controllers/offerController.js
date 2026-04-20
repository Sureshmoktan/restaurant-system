const Offer = require("../models/Offer");
const asyncHandler = require("../utils/asyncHandler")
const { logAudit, getIp } = require("../utils/auditHelper")


// GET /api/v1/offers
const getAllOffers = asyncHandler(async (req, res) => {
  const offers = await Offer.find()
    .populate("applicableItems", "name price category")
    .populate("createdBy", "name")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: offers });
});

// GET /api/v1/offers/active
const getActiveOffers = asyncHandler(async (req, res) => {
  const now = new Date();
  const offers = await Offer.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).populate("applicableItems", "name price category");

  res.json({ success: true, data: offers });
});

// POST /api/v1/offers
const createOffer = asyncHandler(async (req, res) => {
  const {
    title, description, type, value,
    scope, applicableItems, applicableCategory,
    startDate, endDate, source, suggestedDiscount,
  } = req.body;

  if (type === "percentage" && value > 100) {
    return res.json({ success: false, message: "Percentage cannot exceed 100" });
  }
  if (new Date(startDate) >= new Date(endDate)) {
    return res.json({ success: false, message: "End date must be after start date" });
  }

  const offer = await Offer.create({
    title,
    description,
    type,
    value,
    scope,
    applicableItems: scope === "item" ? applicableItems : [],
    applicableCategory: scope === "category" ? applicableCategory : null,
    startDate,
    endDate,
    createdBy: req.user._id,
    source: source || "manual",
    suggestedDiscount: suggestedDiscount ?? null,
  });

  logAudit({
    action:      "OFFER_CREATE",
    actor:       req.user._id,
    actorName:   req.user.name,
    actorRole:   req.user.role,
    targetModel: "Offer",
    targetId:    offer._id,
    details:     { title: offer.title, type: offer.type, value: offer.value, scope: offer.scope },
    ip:          getIp(req),
  });

  res.json({ success: true, data: offer, message: "Offer created successfully" });
});

// PUT /api/v1/offers/:id
const updateOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!offer) return res.json({ success: false, message: "Offer not found" });

  const isActiveChanged = req.body.isActive !== undefined
  const action = isActiveChanged
    ? (req.body.isActive ? "OFFER_ACTIVATE" : "OFFER_DEACTIVATE")
    : "OFFER_UPDATE"

  logAudit({
    action,
    actor:       req.user._id,
    actorName:   req.user.name,
    actorRole:   req.user.role,
    targetModel: "Offer",
    targetId:    req.params.id,
    details:     { title: offer.title, isActive: offer.isActive },
    ip:          getIp(req),
  });

  res.json({ success: true, data: offer, message: "Offer updated" });
});

// DELETE /api/v1/offers/:id
const deleteOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndDelete(req.params.id);
  if (!offer) return res.json({ success: false, message: "Offer not found" });

  logAudit({
    action:      "OFFER_DELETE",
    actor:       req.user._id,
    actorName:   req.user.name,
    actorRole:   req.user.role,
    targetModel: "Offer",
    targetId:    req.params.id,
    details:     { title: offer.title },
    ip:          getIp(req),
  });

  res.json({ success: true, message: "Offer deleted" });
});

// POST /api/v1/offers/apply
const applyOffers = asyncHandler(async (req, res) => {
  const { items, subtotal } = req.body;
  const now = new Date();

  const activeOffers = await Offer.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).populate("applicableItems", "_id");

  let discounts = [];
  let totalDiscount = 0;
  let itemsWithDiscount = items.map((item) => ({ ...item, discount: 0 }));

  for (const offer of activeOffers) {
    if (offer.scope === "bill") {
      const discountAmount =
        offer.type === "percentage"
          ? (subtotal * offer.value) / 100
          : Math.min(offer.value, subtotal);

      totalDiscount += discountAmount;
      discounts.push({
        offerId: offer._id,
        title: offer.title,
        scope: "bill",
        discountAmount: parseFloat(discountAmount.toFixed(2)),
      });

    } else if (offer.scope === "item") {
      const applicableIds = offer.applicableItems.map((i) => i._id.toString());

      for (let item of itemsWithDiscount) {
        if (applicableIds.includes(item.menuItemId.toString())) {
          const itemTotal = item.price * item.quantity;
          const discountAmount =
            offer.type === "percentage"
              ? (itemTotal * offer.value) / 100
              : Math.min(offer.value * item.quantity, itemTotal);

          item.discount += discountAmount;
          totalDiscount += discountAmount;
          discounts.push({
            offerId: offer._id,
            title: offer.title,
            scope: "item",
            itemName: item.name,
            discountAmount: parseFloat(discountAmount.toFixed(2)),
          });
        }
      }

    } else if (offer.scope === "category") {
      for (let item of itemsWithDiscount) {
        if (item.category === offer.applicableCategory) {
          const itemTotal = item.price * item.quantity;
          const discountAmount =
            offer.type === "percentage"
              ? (itemTotal * offer.value) / 100
              : Math.min(offer.value * item.quantity, itemTotal);

          item.discount += discountAmount;
          totalDiscount += discountAmount;
          discounts.push({
            offerId: offer._id,
            title: offer.title,
            scope: "category",
            category: offer.applicableCategory,
            discountAmount: parseFloat(discountAmount.toFixed(2)),
          });
        }
      }
    }
  }

  const discountedSubtotal = subtotal - totalDiscount;
  const vat = discountedSubtotal * 0.13;
  const finalTotal = discountedSubtotal + vat;

  res.json({
    success: true,
    data: {
      originalSubtotal: subtotal,
      totalDiscount: parseFloat(totalDiscount.toFixed(2)),
      discountedSubtotal: parseFloat(discountedSubtotal.toFixed(2)),
      vat: parseFloat(vat.toFixed(2)),
      finalTotal: parseFloat(finalTotal.toFixed(2)),
      appliedOffers: discounts,
      itemsWithDiscount,
    },
  });
});

module.exports = {
  getAllOffers,
  getActiveOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  applyOffers,
};