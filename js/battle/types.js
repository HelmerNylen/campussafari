/**
 * @typedef {number} Type
 * @enum {Type}
 */
const Type = {
	"Rock": 0,
	"Paper": 1,
	"Scissors": 2
};

const TYPE_EFFECTIVENESS_MATRIX = [
	// Defending:	Rock,	Paper,	Scissors
	// Attacking:	|		|		|
	/* Rock		*/ [1,		1/2,	2,		],
	/* Paper	*/ [2,		1,		1/2,	],
	/* Scissors	*/ [1/2,	2,		1,		],
];

function getTypeEffectiveness(attacking, defending) {
	return TYPE_EFFECTIVENESS_MATRIX[attacking][defending];
}