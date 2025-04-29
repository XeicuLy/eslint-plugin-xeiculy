const config = {
	extends: ['gitmoji'],
	rules: {
		'header-max-length': [2, 'always', 100],
		'type-case': [0, 'always', 'lower-case'],
		'type-enum': [
			2,
			'always',
			[
				'feat',
				'perf',
				'improve',
				'update',
				'fix',
				'hotfix',
				'typo',
				'refactor',
				'delete',
				'type',
				'docs',
				'move',
				'test',
				'chore',
				'ci',
				'package',
				'release',
				'WIP',
			],
		],
	},
};

module.exports = config;
