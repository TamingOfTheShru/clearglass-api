//var {morphism} = require('morphism');

module.exports = (sequelize, DataTypes) => {
  var Clients = sequelize.define(
    "clients",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(1000),
      }
    },
    {
      freezeTableName: true,
      underscored: true,
      timestamps: false,
    }
  );

    // var OrderSchemaMap = {
    //   id: 'customer.id',
    //   store_id: 'store_id',
    //   mobile: 'customer.mobile',
    //   name: 'customer.name',
    //   delivery_address_flat_number: 'delivery.delivery_address.address_flat_number',
    //   delivery_address_building_name: 'delivery.delivery_address.address_building_name',
    //   delivery_address_line_1: 'delivery.delivery_address.address_line_1',
    //   delivery_address_line_2: 'delivery.delivery_address.address_line_2',
    //   delivery_address_city: 'delivery.delivery_address.address_city',
    //   delivery_address_pin: 'delivery.delivery_address.address_pin',
    //   delivery_address_state: 'delivery.delivery_address.address_state',
    // };

    // Customer.mapfromOrder = (source) => {
    //   return morphism(OrderSchemaMap, source);
    // }
  return Clients;
};
