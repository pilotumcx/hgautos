import sequelize from "../db.js";
import { DataTypes, Model, Optional } from 'sequelize';


class Session extends Model {
    public id!: number;
    public sessionID!: string;
    public creds!: string;
    public createdAt!: Date;
  }
  
  Session.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sessionID: {
      type: DataTypes.STRING,
      unique: true,
      defaultValue: DataTypes.UUIDV4,
    },
    creds: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    tableName: 'sessions',
    timestamps: false,
  });
  
  export { sequelize, Session };