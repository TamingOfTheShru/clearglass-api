//var { morphism } = require("morphism");

module.exports = (sequelize, DataTypes) => {
  var Costs = sequelize.define(
    "costs", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      amount: {
        type: DataTypes.DECIMAL(15, 6),
        allowNull: false,
      },
      project_id: {
        type: DataTypes.INTEGER,
      },
      cost_type_id: {
        type: DataTypes.INTEGER,
      }
    }, {
      freezeTableName: true,
      underscored: true,
      timestamps: false,
    }
  );

  // var OrderSchemaMap = {
  //   id: "id",
  //   reference: "reference",
  //   notes: "notes",
  //   channel: "channel",
  //   customer_id: "customer.id",
  //   customer_mobile: "customer.mobile",
  //   customer_name: "customer.name",
  //   delivery_charge: "delivery.delivery_charge",
  //   delivery_track_code: "delivery.delivery_track_code",
  //   delivery_eta: "delivery.delivery_eta",
  //   delivery_address_flat_number:
  //     "delivery.delivery_address.address_flat_number",
  //   delivery_address_building_name:
  //     "delivery.delivery_address.address_building_name",
  //   delivery_address_line_1: "delivery.delivery_address.address_line_1",
  //   delivery_address_line_2: "delivery.delivery_address.address_line_2",
  //   delivery_address_city: "delivery.delivery_address.address_city",
  //   delivery_address_pin: "delivery.delivery_address.address_pin",
  //   delivery_address_state: "delivery.delivery_address.address_state",
  //   item_amount: 0,
  //   order_amount: 0,
  //   discount: "discount",
  //   coupon: "coupon",
  //   status: "status",
  //   payment_option: "payment_option",
  // };

  // var OrderAPISchemaMap = {
  //   id: "id",
  //   reference: "reference",
  //   notes: "notes",
  //   channel: "channel",
  //   customer: {
  //     id: "customer_id",
  //     mobile: "customer_mobile",
  //     name: "customer_name",
  //   },
  //   delivery: {
  //     delivery_charge: "delivery_charge",
  //     delivery_track_code: "delivery_track_code",
  //     delivery_eta: "delivery_eta",
  //     delivery_address: {
  //       address_flat_number: "delivery_address_flat_number",
  //       address_building_name: "delivery_address_building_name",
  //       address_line_1: "delivery_address_line_1",
  //       address_line_2: "delivery_address_line_2",
  //       address_city: "delivery_address_city",
  //       address_pin: "delivery_address_pin",
  //       address_state: "delivery_address_state",
  //     },
  //   },
  //   order_items: "order_items",
  //   customer: "customer", 
  //   item_amount: "item_amount",
  //   order_amount: "order_amount",
  //   discount: "discount",
  //   coupon: "coupon",
  //   status: "status",
  //   payment_option: "payment_option",
  // };

  // Order.mapfromOrder = (source) => {
  //   return morphism(OrderSchemaMap, source);
  // };

  // Order.maptoOrder = (source) => {
  //   return morphism(OrderAPISchemaMap, source);
  // };

  return Costs;
};