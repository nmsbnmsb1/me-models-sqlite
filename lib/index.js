"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const think_helper_1 = __importDefault(require("think-helper"));
const think_model_sqlite_1 = __importDefault(require("think-model-sqlite"));
let Cls = think_model_sqlite_1.default;
Cls.prototype.isTableExists = async function (tableName) {
    let results = await this.query.query(`SELECT COUNT(*) AS is_exist FROM sqlite_master WHERE type='table' AND name = '${tableName}'`);
    return think_helper_1.default.isEmpty(results) || results.length <= 0 ? false : results[0].is_exist > 0;
};
Cls.prototype.getCreateDetailSql = function (option) {
    let detailSql = `${option.type.toUpperCase()} `;
    if (option.nn === true)
        detailSql += 'NOT NULL ';
    if (option.pk === true)
        detailSql += 'PRIMARY KEY ';
    if (option.ai === true)
        detailSql += 'AUTOINCREMENT ';
    if (option.u === true)
        detailSql += 'UNIQUE ';
    if (option.default !== undefined)
        detailSql += `DEFAULT ${option.default} `;
    return detailSql.trim();
};
Cls.prototype.createTable = async function (tableName, fields) {
    const fieldArr = [];
    if (fields.id === true) {
        fieldArr.push(`"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE`);
    }
    for (const name in fields) {
        if (name === 'id' && fields[name] === true)
            continue;
        if (name === 'sp' && fields[name] === true)
            continue;
        fieldArr.push(`"${name}" ${this.getCreateDetailSql(fields[name])}`);
    }
    if (fields.sp === true) {
        fieldArr.push(`"create_time" INTEGER DEFAULT 0`);
        fieldArr.push(`"update_time" INTEGER DEFAULT 0`);
        fieldArr.push(`"delete_time" INTEGER DEFAULT 0`);
    }
    let sql = `CREATE TABLE "${tableName}" (${fieldArr.join(',')});`;
    return this.query.query(sql.replace(/[\r\n]/g, '').replace(/\s+/g, ' '));
};
Cls.prototype.checkTable = async function (tableName, fields) {
    let op = '';
    let tableInfo = await this.query.query(`SELECT * FROM sqlite_master WHERE type="table" AND name="${tableName}"`);
    if (think_helper_1.default.isEmpty(tableInfo) || tableInfo.length < 0) {
        op = 'add';
        await this.createTable(tableName, fields);
    }
    else {
        tableInfo = tableInfo[0];
        const addList = [];
        for (const name in fields) {
            if (name === 'id' && fields[name] === true)
                continue;
            if (name === 'sp' && fields[name] === true)
                continue;
            if (tableInfo.sql.indexOf(`"${name}"`) < 0)
                addList.push(name);
        }
        if (addList.length > 0) {
            op = 'alter';
            for (const name of addList)
                await this.query.query(`ALTER TABLE ${tableName} ADD COLUMN "${name}" ${this.getCreateDetailSql(fields[name])}`);
        }
    }
    return op;
};
Cls.prototype.checkIndex = async function (indexName, tableName, columnName) {
    const indexes = await this.query.query(`SELECT * FROM sqlite_master WHERE type = 'index' AND name = '${indexName}'`);
    if (think_helper_1.default.isEmpty(indexes) || indexes.length <= 0) {
        await this.query.query(`CREATE UNIQUE INDEX '${indexName}' ON '${tableName}' ('${columnName}');`);
    }
};
exports.default = Cls;
//# sourceMappingURL=index.js.map