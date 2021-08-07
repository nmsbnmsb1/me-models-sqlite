const path = require('path');
const Model = require('./../../me-models/lib').default;
const Sqlite = require('./../lib').default;

Model.setCommon({ logConnect: true, logSql: true, logger: (msg) => console.log(msg) });
Model.addConfig('sqlite', { handle: Sqlite, path: path.resolve(__dirname), database: 'db', connectionLimit: 1, prefix: '' }, true);

let m = Model.get('user');

(async () => {
	await m.checkTable({
		id: true,
		sp: true,
		uuid: { type: 'Text', nn: true, u: true },
		username: { type: 'TEXT', nn: true, u: true },
		password: { type: 'TEXT', nn: true },
	});
	await m.add({ uuid: '111', username: 'admin', password: 'admin' });
})();

// (async () => {
//   await new Model('user').add({ uuid: CryptoUtils.uuid(), username: 'ddd2', password: '1112' });
// })();

// (async () => {
//   console.log(await new Model('user').isTableExists());
// })();
