import helper from 'think-helper';
import SQLiteAdapter from 'think-model-sqlite';

let Cls: any = SQLiteAdapter;
Cls.prototype.isTableExists = async function (tableName: string) {
	let results = await this.query.query(`SELECT COUNT(*) AS is_exist FROM sqlite_master WHERE type='table' AND name = '${tableName}'`);
	return helper.isEmpty(results) || results.length <= 0 ? false : results[0].is_exist > 0;
};

Cls.prototype.getCreateDetailSql = function (option: { type: string; nn?: boolean; pk?: boolean; ai?: boolean; u?: boolean; default?: any }) {
	let detailSql = `${option.type.toUpperCase()} `;
	if (option.nn === true) detailSql += 'NOT NULL ';
	if (option.pk === true) detailSql += 'PRIMARY KEY ';
	if (option.ai === true) detailSql += 'AUTOINCREMENT ';
	if (option.u === true) detailSql += 'UNIQUE ';
	if (option.default !== undefined) detailSql += `DEFAULT ${option.default} `;
	return detailSql.trim();
};

Cls.prototype.createTable = async function (
	tableName: string,
	fields: { id: any; sp: any; [name: string]: { type: string; nn?: boolean; pk?: boolean; ai?: boolean; u?: boolean; default?: any } }
) {
	const fieldArr: string[] = [];
	if (fields.id === true) {
		fieldArr.push(`"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE`);
	}
	for (const name in fields) {
		if (name === 'id' && fields[name] === true) continue;
		if (name === 'sp' && fields[name] === true) continue;
		fieldArr.push(`"${name}" ${this.getCreateDetailSql(fields[name])}`);
	}
	if (fields.sp === true) {
		fieldArr.push(`"create_time" INTEGER DEFAULT 0`);
		fieldArr.push(`"update_time" INTEGER DEFAULT 0`);
		fieldArr.push(`"delete_time" INTEGER DEFAULT 0`);
	}
	//
	let sql = `CREATE TABLE "${tableName}" (${fieldArr.join(',')});`;
	return this.query.query(sql.replace(/[\r\n]/g, '').replace(/\s+/g, ' '));
};

Cls.prototype.checkTable = async function (
	tableName: string,
	fields: { id: any; sp: any; [name: string]: { type: string; nn?: boolean; pk?: boolean; ai?: boolean; u?: boolean; default?: any } }
) {
	let op = '';
	let tableInfo = await this.query.query(`SELECT * FROM sqlite_master WHERE type="table" AND name="${tableName}"`);
	if (helper.isEmpty(tableInfo) || tableInfo.length < 0) {
		op = 'add';
		await this.createTable(tableName, fields);
	} else {
		tableInfo = tableInfo[0];
		// 读取创建sql字符串
		// console.log(tableInfo.sql);
		const addList = [];
		for (const name in fields) {
			if (name === 'id' && fields[name] === true) continue;
			if (name === 'sp' && fields[name] === true) continue;
			if (tableInfo.sql.indexOf(`"${name}"`) < 0) addList.push(name);
		}
		if (addList.length > 0) {
			op = 'alter';
			for (const name of addList) await this.query.query(`ALTER TABLE ${tableName} ADD COLUMN "${name}" ${this.getCreateDetailSql(fields[name])}`);
		}
	}
	return op;
};

Cls.prototype.checkIndex = async function (indexName: string, tableName: string, columnName: string) {
	const indexes = await this.query.query(`SELECT * FROM sqlite_master WHERE type = 'index' AND name = '${indexName}'`);
	if (helper.isEmpty(indexes) || indexes.length <= 0) {
		await this.query.query(`CREATE UNIQUE INDEX '${indexName}' ON '${tableName}' ('${columnName}');`);
	}
};

export default Cls;
